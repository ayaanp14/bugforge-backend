/**
 * Graphs, grids & state-space search — wave 7, batch 05.
 * Real problems only: GeeksforGeeks graph classics (Floyd Warshall, Minimum
 * Spanning Tree, Kosaraju, Articulation Points, Knight Walk, Water Connection)
 * and LeetCode numbered hards. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * A vertex count is always called `n`, never GeeksforGeeks' `V`: the Ruby
 * driver assigns each parameter to a local of the same name, and a capital
 * there is a constant, which Ruby refuses to assign inside a block.
 *
 * Every `ref` is a different algorithm from the solutions wherever one is
 * cheap enough — Bellman-style relaxation for Floyd Warshall, Prim for the
 * Kruskal solutions, a reachability matrix for Kosaraju, vertex deletion for
 * Tarjan, a fixed-point minimax for Cat and Mouse's retrograde colouring, an
 * explicitly subdivided graph for LC 882, a bounded window for LC 1036, subset
 * enumeration for LC 1284 — so a ref and a solution that agree are evidence.
 * Search problems (K-Similar Strings, the flips) cap `hiddenCount`.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const GRAPHS7_PROBLEMS: CatalogProblem[] = [

  // ── Floyd Warshall (GFG) ────────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const n = matrix.length;
      const out: number[][] = [];
      for (let s = 0; s < n; s++) {
        const dist = new Array(n).fill(Infinity);
        dist[s] = 0;
        for (let round = 0; round < n; round++) {
          for (let u = 0; u < n; u++) {
            if (dist[u] === Infinity) continue;
            for (let v = 0; v < n; v++) {
              if (u !== v && matrix[u][v] !== -1 && dist[u] + matrix[u][v] < dist[v]) dist[v] = dist[u] + matrix[u][v];
            }
          }
        }
        out.push(dist.map((x) => (x === Infinity ? -1 : x)));
      }
      return out;
    };
    return {
      slug: "floyd-warshall",
      title: "Floyd Warshall",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Dynamic Programming", "Shortest Path", "Amazon", "Samsung", "Flipkart"],
      signature: { funcName: "shortestDistance", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "A weighted **directed** graph with `n` vertices, numbered `0` to `n - 1`, is given as an `n x n` adjacency matrix `matrix`:\n\n- `matrix[i][j]` is the weight of the edge from `i` to `j`, or `-1` if there is no such edge,\n- `matrix[i][i]` is always `0`.\n\nReturn the matrix of **shortest distances**: entry `[i][j]` is the length of the shortest path from `i` to `j`, or `-1` if `j` cannot be reached from `i`. A vertex is at distance `0` from itself.",
        [
          { in: "matrix = [[0,25],[-1,0]]", out: "[[0,25],[-1,0]]", note: "Vertex 1 has no outgoing edge, so it reaches nothing but itself." },
          { in: "matrix = [[0,1,43],[1,0,6],[-1,-1,0]]", out: "[[0,1,7],[1,0,6],[-1,-1,0]]", note: "Going 0 → 1 → 2 costs 1 + 6 = 7, cheaper than the direct edge of 43." },
          { in: "matrix = [[0]]", out: "[[0]]" },
        ],
        ["1 <= n <= 100", "matrix.length == matrix[i].length == n", "matrix[i][i] == 0", "matrix[i][j] == -1 or 1 <= matrix[i][j] <= 1000 for i != j"]),
      hints: [
        "A shortest path from `i` to `j` either avoids vertex `k` or goes `i → … → k → … → j`, joining two shorter shortest paths.",
        "Let `d[i][j]` be the best distance using only intermediate vertices from `{0, …, k}`. Adding vertex `k` can only improve `d[i][j]` to `d[i][k] + d[k][j]`.",
        "Treat `-1` as infinity while relaxing, loop `k` outermost, and turn infinity back into `-1` at the end.",
      ],
      editorial: explain({
        idea: "Floyd–Warshall is a dynamic programme over the set of vertices a path may pass *through*. After processing vertices `0..k` as possible intermediates, `d[i][j]` holds the shortest `i → j` path whose interior uses only those vertices.",
        steps: [
          "Copy the matrix, replacing every `-1` with a large sentinel `INF` (any value above the longest possible path, e.g. `10^8`).",
          "For `k` from `0` to `n - 1`, for every pair `(i, j)`: if `d[i][k] + d[k][j] < d[i][j]`, update `d[i][j]`.",
          "Replace every entry still at `INF` with `-1` and return the matrix.",
        ],
        why: "Consider the shortest `i → j` path whose interior vertices are all below `k + 1`. If it does not use `k`, it was already found in round `k - 1`. If it does, it visits `k` once (weights are positive, so a cycle never helps), splitting into an `i → k` and a `k → j` path whose interiors are below `k` — both already optimal in `d` — so the update in round `k` finds it. By induction the final table is exact.",
        time: "O(n^3)",
        space: "O(n^2)",
        pitfalls: [
          "The loop over the intermediate vertex `k` must be the **outermost** one; putting it inside the `i`/`j` loops gives wrong answers.",
          "Do not add to `-1` directly — convert it to a sentinel first, or a missing edge looks like a negative shortcut.",
          "Keep the sentinel small enough that `INF + INF` cannot overflow a 32-bit integer.",
        ],
      }),
      examples: [
        { input: "[[0,25],[-1,0]]", expectedOutput: "[[0,25],[-1,0]]" },
        { input: "[[0,1,43],[1,0,6],[-1,-1,0]]", expectedOutput: "[[0,1,7],[1,0,6],[-1,-1,0]]" },
        { input: "[[0]]", expectedOutput: "[[0]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 10, 14]));
        const dens = pick(rng, [0.1, 0.3, 0.6, 1]);
        const wmax = pick(rng, [1, 10, 1000]);
        const matrix = Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => (i === j ? 0 : rng() < dens ? ri(rng, 1, wmax) : -1)));
        return { input: fmtIntMat(matrix), expectedOutput: fmtIntMat(ref(matrix)) };
      },
      solutions: {
        python: code`
          from typing import List

          def shortestDistance(matrix: List[List[int]]) -> List[List[int]]:
              n = len(matrix)
              INF = 10 ** 8
              d = [[INF if v == -1 else v for v in row] for row in matrix]
              for k in range(n):
                  dk = d[k]
                  for i in range(n):
                      dik = d[i][k]
                      if dik == INF:
                          continue
                      di = d[i]
                      for j in range(n):
                          if dik + dk[j] < di[j]:
                              di[j] = dik + dk[j]
              return [[-1 if v >= INF else v for v in row] for row in d]
        `,
        javascript: code`
          var shortestDistance = function(matrix) {
              var n = matrix.length, INF = 100000000;
              var d = [];
              for (var i = 0; i < n; i++) {
                  var row = [];
                  for (var j = 0; j < n; j++) row.push(matrix[i][j] === -1 ? INF : matrix[i][j]);
                  d.push(row);
              }
              for (var k = 0; k < n; k++) {
                  for (var a = 0; a < n; a++) {
                      if (d[a][k] === INF) continue;
                      for (var b = 0; b < n; b++) {
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
                      }
                  }
              }
              for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) if (d[x][y] >= INF) d[x][y] = -1;
              return d;
          };
        `,
        typescript: code`
          function shortestDistance(matrix: number[][]): number[][] {
              var n = matrix.length, INF = 100000000;
              var d: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(matrix[i][j] === -1 ? INF : matrix[i][j]);
                  d.push(row);
              }
              for (var k = 0; k < n; k++) {
                  for (var a = 0; a < n; a++) {
                      if (d[a][k] === INF) continue;
                      for (var b = 0; b < n; b++) {
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
                      }
                  }
              }
              for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) if (d[x][y] >= INF) d[x][y] = -1;
              return d;
          }
        `,
        java: code`
          public static int[][] shortestDistance(int[][] matrix) {
              int n = matrix.length, INF = 100000000;
              int[][] d = new int[n][n];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) d[i][j] = matrix[i][j] == -1 ? INF : matrix[i][j];
              for (int k = 0; k < n; k++)
                  for (int i = 0; i < n; i++) {
                      if (d[i][k] == INF) continue;
                      for (int j = 0; j < n; j++)
                          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                  }
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) if (d[i][j] >= INF) d[i][j] = -1;
              return d;
          }
        `,
        cpp: code`
          vector<vector<int>> shortestDistance(vector<vector<int>>& matrix) {
              int n = matrix.size(), INF = 100000000;
              vector<vector<int>> d(n, vector<int>(n));
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) d[i][j] = matrix[i][j] == -1 ? INF : matrix[i][j];
              for (int k = 0; k < n; k++)
                  for (int i = 0; i < n; i++) {
                      if (d[i][k] == INF) continue;
                      for (int j = 0; j < n; j++)
                          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                  }
              for (auto& row : d)
                  for (auto& v : row) if (v >= INF) v = -1;
              return d;
          }
        `,
        c: code`
          int** shortestDistance(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {
              int n = matrixSize, INF = 100000000;
              int** d = (int**)malloc(n * sizeof(int*));
              *returnColumnSizes = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) {
                  d[i] = (int*)malloc(n * sizeof(int));
                  (*returnColumnSizes)[i] = n;
                  for (int j = 0; j < n; j++) d[i][j] = matrix[i][j] == -1 ? INF : matrix[i][j];
              }
              for (int k = 0; k < n; k++)
                  for (int i = 0; i < n; i++) {
                      if (d[i][k] == INF) continue;
                      for (int j = 0; j < n; j++)
                          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                  }
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) if (d[i][j] >= INF) d[i][j] = -1;
              *returnSize = n;
              return d;
          }
        `,
        csharp: code`
          public static int[][] ShortestDistance(int[][] matrix)
          {
              int n = matrix.Length, INF = 100000000;
              int[][] d = new int[n][];
              for (int i = 0; i < n; i++)
              {
                  d[i] = new int[n];
                  for (int j = 0; j < n; j++) d[i][j] = matrix[i][j] == -1 ? INF : matrix[i][j];
              }
              for (int k = 0; k < n; k++)
                  for (int i = 0; i < n; i++)
                  {
                      if (d[i][k] == INF) continue;
                      for (int j = 0; j < n; j++)
                          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                  }
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) if (d[i][j] >= INF) d[i][j] = -1;
              return d;
          }
        `,
        go: code`
          func shortestDistance(matrix [][]int) [][]int {
              n, INF := len(matrix), 100000000
              d := make([][]int, n)
              for i := 0; i < n; i++ {
                  d[i] = make([]int, n)
                  for j := 0; j < n; j++ {
                      if matrix[i][j] == -1 {
                          d[i][j] = INF
                      } else {
                          d[i][j] = matrix[i][j]
                      }
                  }
              }
              for k := 0; k < n; k++ {
                  for i := 0; i < n; i++ {
                      if d[i][k] == INF {
                          continue
                      }
                      for j := 0; j < n; j++ {
                          if d[i][k]+d[k][j] < d[i][j] {
                              d[i][j] = d[i][k] + d[k][j]
                          }
                      }
                  }
              }
              for i := 0; i < n; i++ {
                  for j := 0; j < n; j++ {
                      if d[i][j] >= INF {
                          d[i][j] = -1
                      }
                  }
              }
              return d
          }
        `,
        kotlin: code`
          fun shortestDistance(matrix: Array<IntArray>): Array<IntArray> {
              val n = matrix.size
              val inf = 100000000
              val d = Array(n) { i -> IntArray(n) { j -> if (matrix[i][j] == -1) inf else matrix[i][j] } }
              for (k in 0 until n)
                  for (i in 0 until n) {
                      if (d[i][k] == inf) continue
                      for (j in 0 until n)
                          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j]
                  }
              for (i in 0 until n)
                  for (j in 0 until n) if (d[i][j] >= inf) d[i][j] = -1
              return d
          }
        `,
        swift: code`
          func shortestDistance(_ matrix: [[Int]]) -> [[Int]] {
              let n = matrix.count, inf = 100000000
              var d = matrix.map { row in row.map { $0 == -1 ? inf : $0 } }
              for k in 0..<n {
                  for i in 0..<n {
                      if d[i][k] == inf { continue }
                      for j in 0..<n {
                          if d[i][k] + d[k][j] < d[i][j] { d[i][j] = d[i][k] + d[k][j] }
                      }
                  }
              }
              return d.map { row in row.map { $0 >= inf ? -1 : $0 } }
          }
        `,
        rust: code`
          fn shortestDistance(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let n = matrix.len();
              let inf = 100000000i32;
              let mut d: Vec<Vec<i32>> = matrix.iter().map(|r| r.iter().map(|&v| if v == -1 { inf } else { v }).collect()).collect();
              for k in 0..n {
                  for i in 0..n {
                      if d[i][k] == inf {
                          continue;
                      }
                      for j in 0..n {
                          let via = d[i][k] + d[k][j];
                          if via < d[i][j] {
                              d[i][j] = via;
                          }
                      }
                  }
              }
              d.iter().map(|r| r.iter().map(|&v| if v >= inf { -1 } else { v }).collect()).collect()
          }
        `,
        php: code`
          function shortestDistance($matrix) {
              $n = count($matrix);
              $INF = 100000000;
              $d = [];
              for ($i = 0; $i < $n; $i++)
                  for ($j = 0; $j < $n; $j++) $d[$i][$j] = $matrix[$i][$j] == -1 ? $INF : $matrix[$i][$j];
              for ($k = 0; $k < $n; $k++)
                  for ($i = 0; $i < $n; $i++) {
                      if ($d[$i][$k] == $INF) continue;
                      for ($j = 0; $j < $n; $j++)
                          if ($d[$i][$k] + $d[$k][$j] < $d[$i][$j]) $d[$i][$j] = $d[$i][$k] + $d[$k][$j];
                  }
              for ($i = 0; $i < $n; $i++)
                  for ($j = 0; $j < $n; $j++) if ($d[$i][$j] >= $INF) $d[$i][$j] = -1;
              return $d;
          }
        `,
        ruby: code`
          def shortestDistance(matrix)
            n = matrix.length
            inf = 100_000_000
            d = matrix.map { |row| row.map { |v| v == -1 ? inf : v } }
            n.times do |k|
              dk = d[k]
              n.times do |i|
                dik = d[i][k]
                next if dik == inf
                di = d[i]
                n.times do |j|
                  di[j] = dik + dk[j] if dik + dk[j] < di[j]
                end
              end
            end
            d.map { |row| row.map { |v| v >= inf ? -1 : v } }
          end
        `,
      },
    };
  })(),

  // ── Minimum Spanning Tree (GFG) ─────────────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // Prim over an adjacency matrix of the cheapest edge between each pair.
      const w: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity));
      for (const [u, v, c] of edges) { if (c < w[u][v]) { w[u][v] = c; w[v][u] = c; } }
      const inTree = new Array(n).fill(false);
      const best = new Array(n).fill(Infinity);
      best[0] = 0;
      let total = 0;
      for (let it = 0; it < n; it++) {
        let u = -1;
        for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || best[v] < best[u])) u = v;
        inTree[u] = true;
        total += best[u];
        for (let v = 0; v < n; v++) if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
      }
      return total;
    };
    return {
      slug: "minimum-spanning-tree",
      title: "Minimum Spanning Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Union Find", "Minimum Spanning Tree", "Greedy", "Amazon", "Flipkart", "Samsung"],
      signature: {
        funcName: "spanningTree",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a **connected**, undirected, weighted graph with `n` vertices numbered `0` to `n - 1`. Each `edges[i] = [u, v, w]` is an edge between `u` and `v` of weight `w`.\n\nA **spanning tree** is a set of `n - 1` edges that connects all the vertices. Return the **sum of the weights** of a minimum spanning tree — the smallest total weight any spanning tree can have.",
        [
          { in: "n = 3, edges = [[0,1,5],[1,2,3],[0,2,1]]", out: "4", note: "Keep the edges of weight 1 (0–2) and 3 (1–2); together they connect all three vertices." },
          { in: "n = 2, edges = [[0,1,5]]", out: "5" },
          { in: "n = 4, edges = [[0,1,2],[1,2,2],[2,3,2],[0,3,2],[0,2,5]]", out: "6", note: "Any three of the four weight-2 edges form a spanning tree." },
        ],
        ["2 <= n <= 1000", "n - 1 <= edges.length <= min(10^5, n * (n - 1) / 2)", "edges[i].length == 3", "0 <= u, v < n, u != v", "1 <= w <= 1000", "there are no repeated edges, and the graph is connected"]),
      hints: [
        "Sort the edges by weight. The lightest edge of the whole graph always belongs to some minimum spanning tree.",
        "Walk the sorted edges and keep an edge only when it joins two vertices that are not yet connected; otherwise it would close a cycle.",
        "A disjoint-set union (union–find) answers \"are these already connected?\" in near-constant time. Stop after `n - 1` edges are kept.",
      ],
      editorial: explain({
        idea: "Kruskal's algorithm: consider edges from lightest to heaviest and take every edge that connects two different components. The cut property guarantees each such edge is safe.",
        steps: [
          "Sort the edges by weight.",
          "Start a union–find structure with every vertex in its own set.",
          "For each edge `(u, v, w)` in order: if `find(u) != find(v)`, union them and add `w` to the total.",
          "Return the total once `n - 1` edges have been taken (the graph is connected, so this always happens).",
        ],
        why: "When Kruskal takes edge `e`, it is the lightest edge crossing the cut between `u`'s current component and the rest of the graph — every lighter edge was already examined and either taken or found to lie inside a component. The cut property says some minimum spanning tree contains the lightest edge across any cut, so each choice can be extended to an optimal tree. Skipped edges would close a cycle and are never needed.",
        time: "O(E log E)",
        space: "O(n + E)",
        pitfalls: [
          "Without path compression (or union by size) the union–find can degrade to linear time per query.",
          "Edges are undirected: `[u, v, w]` connects both ways, so do not build a one-directional adjacency for Prim.",
          "Equal weights are fine in any order — the total of a minimum spanning tree is unique even when the tree is not.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1,5],[1,2,3],[0,2,1]]", expectedOutput: "4" },
        { input: "2\n[[0,1,5]]", expectedOutput: "5" },
        { input: "4\n[[0,1,2],[1,2,2],[2,3,2],[0,3,2],[0,2,5]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 6, 12, 25]));
        const wmax = pick(rng, [1, 5, 100, 1000]);
        const has = new Set<string>();
        const edges: number[][] = [];
        const add = (u: number, v: number) => {
          const key = u < v ? `${u},${v}` : `${v},${u}`;
          if (u === v || has.has(key)) return;
          has.add(key);
          edges.push(rng() < 0.5 ? [u, v, ri(rng, 1, wmax)] : [v, u, ri(rng, 1, wmax)]);
        };
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        for (let i = 1; i < n; i++) add(order[i], order[ri(rng, 0, i - 1)]);
        const extra = ri(rng, 0, pick(rng, [0, n, 3 * n]));
        for (let t = 0; t < extra; t++) add(ri(rng, 0, n - 1), ri(rng, 0, n - 1));
        shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def spanningTree(n: int, edges: List[List[int]]) -> int:
              parent = list(range(n))

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              total = 0
              taken = 0
              for u, v, w in sorted(edges, key=lambda e: e[2]):
                  ru, rv = find(u), find(v)
                  if ru != rv:
                      parent[ru] = rv
                      total += w
                      taken += 1
                      if taken == n - 1:
                          break
              return total
        `,
        javascript: code`
          var spanningTree = function(n, edges) {
              var parent = [];
              for (var i = 0; i < n; i++) parent.push(i);
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var sorted = edges.slice().sort(function(a, b) { return a[2] - b[2]; });
              var total = 0, taken = 0;
              for (var k = 0; k < sorted.length && taken < n - 1; k++) {
                  var ru = find(sorted[k][0]), rv = find(sorted[k][1]);
                  if (ru !== rv) { parent[ru] = rv; total += sorted[k][2]; taken++; }
              }
              return total;
          };
        `,
        typescript: code`
          function spanningTree(n: number, edges: number[][]): number {
              var parent: number[] = [];
              for (var i = 0; i < n; i++) parent.push(i);
              function find(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              }
              var sorted = edges.slice().sort(function(a, b) { return a[2] - b[2]; });
              var total = 0, taken = 0;
              for (var k = 0; k < sorted.length && taken < n - 1; k++) {
                  var ru = find(sorted[k][0]), rv = find(sorted[k][1]);
                  if (ru !== rv) { parent[ru] = rv; total += sorted[k][2]; taken++; }
              }
              return total;
          }
        `,
        java: code`
          public static int spanningTree(int n, int[][] edges) {
              int[][] sorted = edges.clone();
              Arrays.sort(sorted, (a, b) -> a[2] - b[2]);
              int[] parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              int total = 0, taken = 0;
              for (int[] e : sorted) {
                  if (taken == n - 1) break;
                  int ru = mstFind(parent, e[0]), rv = mstFind(parent, e[1]);
                  if (ru != rv) { parent[ru] = rv; total += e[2]; taken++; }
              }
              return total;
          }

          static int mstFind(int[] parent, int x) {
              while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
              return x;
          }
        `,
        cpp: code`
          static int mstFind(vector<int>& parent, int x) {
              while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
              return x;
          }

          int spanningTree(int n, vector<vector<int>>& edges) {
              vector<vector<int>> sorted = edges;
              sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[2] < b[2]; });
              vector<int> parent(n);
              for (int i = 0; i < n; i++) parent[i] = i;
              int total = 0, taken = 0;
              for (auto& e : sorted) {
                  if (taken == n - 1) break;
                  int ru = mstFind(parent, e[0]), rv = mstFind(parent, e[1]);
                  if (ru != rv) { parent[ru] = rv; total += e[2]; taken++; }
              }
              return total;
          }
        `,
        c: code`
          typedef struct { int w, u, v; } MstEdge;

          static int mstCmp(const void* a, const void* b) {
              return ((const MstEdge*)a)->w - ((const MstEdge*)b)->w;
          }

          static int mstFind(int* parent, int x) {
              while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
              return x;
          }

          int spanningTree(int n, int** edges, int edgesSize, int* edgesColSize) {
              MstEdge* es = (MstEdge*)malloc((edgesSize + 1) * sizeof(MstEdge));
              for (int i = 0; i < edgesSize; i++) { es[i].u = edges[i][0]; es[i].v = edges[i][1]; es[i].w = edges[i][2]; }
              qsort(es, edgesSize, sizeof(MstEdge), mstCmp);
              int* parent = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) parent[i] = i;
              int total = 0, taken = 0;
              for (int i = 0; i < edgesSize && taken < n - 1; i++) {
                  int ru = mstFind(parent, es[i].u), rv = mstFind(parent, es[i].v);
                  if (ru != rv) { parent[ru] = rv; total += es[i].w; taken++; }
              }
              free(es);
              free(parent);
              return total;
          }
        `,
        csharp: code`
          public static int SpanningTree(int n, int[][] edges)
          {
              var sorted = edges.OrderBy(e => e[2]).ToArray();
              int[] parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              int total = 0, taken = 0;
              foreach (var e in sorted)
              {
                  if (taken == n - 1) break;
                  int ru = MstFind(parent, e[0]), rv = MstFind(parent, e[1]);
                  if (ru != rv) { parent[ru] = rv; total += e[2]; taken++; }
              }
              return total;
          }

          static int MstFind(int[] parent, int x)
          {
              while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
              return x;
          }
        `,
        go: code`
          func spanningTree(n int, edges [][]int) int {
              sorted := make([][]int, len(edges))
              copy(sorted, edges)
              sort.Slice(sorted, func(a, b int) bool { return sorted[a][2] < sorted[b][2] })
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = i
              }
              var find func(int) int
              find = func(x int) int {
                  for parent[x] != x {
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  }
                  return x
              }
              total, taken := 0, 0
              for _, e := range sorted {
                  if taken == n-1 {
                      break
                  }
                  ru, rv := find(e[0]), find(e[1])
                  if ru != rv {
                      parent[ru] = rv
                      total += e[2]
                      taken++
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun spanningTree(n: Int, edges: Array<IntArray>): Int {
              val sorted = edges.sortedBy { it[2] }
              val parent = IntArray(n) { it }
              fun find(x0: Int): Int {
                  var x = x0
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              var total = 0
              var taken = 0
              for (e in sorted) {
                  if (taken == n - 1) break
                  val ru = find(e[0])
                  val rv = find(e[1])
                  if (ru != rv) { parent[ru] = rv; total += e[2]; taken++ }
              }
              return total
          }
        `,
        swift: code`
          func spanningTree(_ n: Int, _ edges: [[Int]]) -> Int {
              let sorted = edges.sorted { $0[2] < $1[2] }
              var parent = Array(0..<n)
              func find(_ x0: Int) -> Int {
                  var x = x0
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              var total = 0, taken = 0
              for e in sorted {
                  if taken == n - 1 { break }
                  let ru = find(e[0]), rv = find(e[1])
                  if ru != rv { parent[ru] = rv; total += e[2]; taken += 1 }
              }
              return total
          }
        `,
        rust: code`
          fn mst_find(parent: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while parent[x] != x {
                  let up = parent[parent[x]];
                  parent[x] = up;
                  x = up;
              }
              x
          }

          fn spanningTree(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut sorted = edges.clone();
              sorted.sort_by_key(|e| e[2]);
              let mut parent: Vec<usize> = (0..n).collect();
              let mut total = 0;
              let mut taken = 0;
              for e in sorted.iter() {
                  if taken == n - 1 {
                      break;
                  }
                  let ru = mst_find(&mut parent, e[0] as usize);
                  let rv = mst_find(&mut parent, e[1] as usize);
                  if ru != rv {
                      parent[ru] = rv;
                      total += e[2];
                      taken += 1;
                  }
              }
              total
          }
        `,
        php: code`
          function spanningTree($n, $edges) {
              usort($edges, function ($a, $b) { return $a[2] - $b[2]; });
              $parent = range(0, $n - 1);
              $total = 0;
              $taken = 0;
              foreach ($edges as $e) {
                  if ($taken == $n - 1) break;
                  $ru = mstFind($parent, $e[0]);
                  $rv = mstFind($parent, $e[1]);
                  if ($ru != $rv) { $parent[$ru] = $rv; $total += $e[2]; $taken++; }
              }
              return $total;
          }

          function mstFind(&$parent, $x) {
              while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def spanningTree(n, edges)
            parent = (0...n).to_a
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            total = 0
            taken = 0
            edges.sort_by { |e| e[2] }.each do |u, v, w|
              break if taken == n - 1
              ru = find.call(u)
              rv = find.call(v)
              next if ru == rv
              parent[ru] = rv
              total += w
              taken += 1
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Strongly Connected Components (Kosaraju's Algorithm) (GFG) ──
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const g: number[][] = Array.from({ length: n }, () => []);
      for (const [u, v] of edges) g[u].push(v);
      const reach: boolean[][] = [];
      for (let s = 0; s < n; s++) {
        const seen = new Array(n).fill(false);
        seen[s] = true;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of g[q[h]]) if (!seen[v]) { seen[v] = true; q.push(v); }
        reach.push(seen);
      }
      const done = new Array(n).fill(false);
      let count = 0;
      for (let u = 0; u < n; u++) {
        if (done[u]) continue;
        count++;
        for (let v = 0; v < n; v++) if (reach[u][v] && reach[v][u]) done[v] = true;
      }
      return count;
    };
    return {
      slug: "strongly-connected-components",
      title: "Strongly Connected Components (Kosaraju's Algorithm)",
      difficulty: "HARD" as const,
      tags: ["Graph", "Depth-First Search", "Amazon", "Microsoft", "Flipkart", "Adobe"],
      signature: {
        funcName: "kosaraju",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a **directed** graph with `n` vertices numbered `0` to `n - 1`; each `edges[i] = [u, v]` is an edge from `u` to `v`.\n\nTwo vertices belong to the same **strongly connected component** when each can reach the other along directed edges. Every vertex lies in exactly one component (a vertex alone is a component of size one).\n\nReturn the **number** of strongly connected components.",
        [
          { in: "n = 5, edges = [[0,2],[2,1],[1,0],[0,3],[3,4]]", out: "3", note: "The components are {0, 1, 2}, {3} and {4}." },
          { in: "n = 3, edges = [[0,1],[1,2],[2,0]]", out: "1", note: "The three edges form one cycle, so every vertex reaches every other." },
          { in: "n = 4, edges = [[0,1],[1,2],[2,3]]", out: "4", note: "A path has no way back, so each vertex is its own component." },
        ],
        ["1 <= n <= 5000", "0 <= edges.length <= 10^4", "edges[i].length == 2", "0 <= u, v < n, u != v", "there are no repeated edges"]),
      hints: [
        "If you start a DFS inside a \"sink\" component — one with no edges leaving it — the DFS visits exactly that component.",
        "In a first DFS, record vertices in order of **finishing time**. The vertex that finishes last lies in a source component of the condensation.",
        "Reverse every edge: sources become sinks. Run DFS on the reversed graph in decreasing finishing time; each new start discovers one whole component.",
      ],
      editorial: explain({
        idea: "Kosaraju's algorithm uses two depth-first searches. The first orders vertices by finishing time; the second, on the transposed graph and in reverse finishing order, peels off one strongly connected component per DFS tree.",
        steps: [
          "Build the adjacency list `g` and its transpose `rg` (every edge reversed).",
          "DFS over `g` from every unvisited vertex, appending each vertex to `order` when it finishes.",
          "Clear the visited marks. Walk `order` from last to first; whenever a vertex is unvisited, count a new component and DFS from it over `rg`, marking everything reached.",
          "Return the count.",
        ],
        why: "For two components `C` and `D` with an edge from `C` to `D`, the latest finishing time in `C` exceeds every finishing time in `D`. So the vertex taken first in the second pass belongs to a source component of the condensation — which is a sink in the transpose — and a DFS on `rg` from it cannot leave its component. Its component is then removed and the argument repeats on what remains.",
        time: "O(n + E)",
        space: "O(n + E)",
        pitfalls: [
          "The second pass must run on the **reversed** graph; running it on `g` merges components.",
          "Use finishing order, not discovery order.",
          "Isolated vertices are components too — loop over every vertex, not just those that appear in an edge.",
        ],
      }),
      examples: [
        { input: "5\n[[0,2],[2,1],[1,0],[0,3],[3,4]]", expectedOutput: "3" },
        { input: "3\n[[0,1],[1,2],[2,0]]", expectedOutput: "1" },
        { input: "4\n[[0,1],[1,2],[2,3]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 10, 20]));
        const p = pick(rng, [0.05, 0.12, 0.25, 0.5]);
        const edges: number[][] = [];
        for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if (u !== v && rng() < p) edges.push([u, v]);
        shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          import sys
          from typing import List

          def kosaraju(n: int, edges: List[List[int]]) -> int:
              sys.setrecursionlimit(max(1000, 4 * n + 100))
              g = [[] for _ in range(n)]
              rg = [[] for _ in range(n)]
              for u, v in edges:
                  g[u].append(v)
                  rg[v].append(u)
              seen = [False] * n
              order = []

              def dfs1(u):
                  seen[u] = True
                  for v in g[u]:
                      if not seen[v]:
                          dfs1(v)
                  order.append(u)

              def dfs2(u):
                  seen[u] = True
                  for v in rg[u]:
                      if not seen[v]:
                          dfs2(v)

              for u in range(n):
                  if not seen[u]:
                      dfs1(u)
              for u in range(n):
                  seen[u] = False
              count = 0
              for u in reversed(order):
                  if not seen[u]:
                      count += 1
                      dfs2(u)
              return count
        `,
        javascript: code`
          var kosaraju = function(n, edges) {
              var g = [], rg = [], seen = [], order = [];
              for (var i = 0; i < n; i++) { g.push([]); rg.push([]); seen.push(false); }
              for (var k = 0; k < edges.length; k++) { g[edges[k][0]].push(edges[k][1]); rg[edges[k][1]].push(edges[k][0]); }
              var dfs1 = function(u) {
                  seen[u] = true;
                  for (var j = 0; j < g[u].length; j++) if (!seen[g[u][j]]) dfs1(g[u][j]);
                  order.push(u);
              };
              var dfs2 = function(u) {
                  seen[u] = true;
                  for (var j = 0; j < rg[u].length; j++) if (!seen[rg[u][j]]) dfs2(rg[u][j]);
              };
              for (var u = 0; u < n; u++) if (!seen[u]) dfs1(u);
              for (var x = 0; x < n; x++) seen[x] = false;
              var count = 0;
              for (var t = order.length - 1; t >= 0; t--) {
                  if (!seen[order[t]]) { count++; dfs2(order[t]); }
              }
              return count;
          };
        `,
        typescript: code`
          function kosaraju(n: number, edges: number[][]): number {
              var g: number[][] = [], rg: number[][] = [], seen: boolean[] = [], order: number[] = [];
              for (var i = 0; i < n; i++) { g.push([]); rg.push([]); seen.push(false); }
              for (var k = 0; k < edges.length; k++) { g[edges[k][0]].push(edges[k][1]); rg[edges[k][1]].push(edges[k][0]); }
              function dfs1(u: number): void {
                  seen[u] = true;
                  for (var j = 0; j < g[u].length; j++) if (!seen[g[u][j]]) dfs1(g[u][j]);
                  order.push(u);
              }
              function dfs2(u: number): void {
                  seen[u] = true;
                  for (var j = 0; j < rg[u].length; j++) if (!seen[rg[u][j]]) dfs2(rg[u][j]);
              }
              for (var u = 0; u < n; u++) if (!seen[u]) dfs1(u);
              for (var x = 0; x < n; x++) seen[x] = false;
              var count = 0;
              for (var t = order.length - 1; t >= 0; t--) {
                  if (!seen[order[t]]) { count++; dfs2(order[t]); }
              }
              return count;
          }
        `,
        java: code`
          public static int kosaraju(int n, int[][] edges) {
              List<List<Integer>> g = new ArrayList<>(), rg = new ArrayList<>();
              for (int i = 0; i < n; i++) { g.add(new ArrayList<>()); rg.add(new ArrayList<>()); }
              for (int[] e : edges) { g.get(e[0]).add(e[1]); rg.get(e[1]).add(e[0]); }
              boolean[] seen = new boolean[n];
              List<Integer> order = new ArrayList<>();
              for (int u = 0; u < n; u++) if (!seen[u]) sccFirst(g, u, seen, order);
              seen = new boolean[n];
              int count = 0;
              for (int t = order.size() - 1; t >= 0; t--) {
                  int u = order.get(t);
                  if (!seen[u]) { count++; sccSecond(rg, u, seen); }
              }
              return count;
          }

          static void sccFirst(List<List<Integer>> g, int u, boolean[] seen, List<Integer> order) {
              seen[u] = true;
              for (int v : g.get(u)) if (!seen[v]) sccFirst(g, v, seen, order);
              order.add(u);
          }

          static void sccSecond(List<List<Integer>> rg, int u, boolean[] seen) {
              seen[u] = true;
              for (int v : rg.get(u)) if (!seen[v]) sccSecond(rg, v, seen);
          }
        `,
        cpp: code`
          static void sccFirst(vector<vector<int>>& g, int u, vector<bool>& seen, vector<int>& order) {
              seen[u] = true;
              for (int v : g[u]) if (!seen[v]) sccFirst(g, v, seen, order);
              order.push_back(u);
          }

          static void sccSecond(vector<vector<int>>& rg, int u, vector<bool>& seen) {
              seen[u] = true;
              for (int v : rg[u]) if (!seen[v]) sccSecond(rg, v, seen);
          }

          int kosaraju(int n, vector<vector<int>>& edges) {
              vector<vector<int>> g(n), rg(n);
              for (auto& e : edges) { g[e[0]].push_back(e[1]); rg[e[1]].push_back(e[0]); }
              vector<bool> seen(n, false);
              vector<int> order;
              for (int u = 0; u < n; u++) if (!seen[u]) sccFirst(g, u, seen, order);
              seen.assign(n, false);
              int count = 0;
              for (int t = (int)order.size() - 1; t >= 0; t--) {
                  if (!seen[order[t]]) { count++; sccSecond(rg, order[t], seen); }
              }
              return count;
          }
        `,
        c: code`
          typedef struct {
              int *gStart, *gAdj, *rStart, *rAdj, *seen, *order;
              int orderLen;
          } SccCtx;

          static void sccFirst(SccCtx* c, int u) {
              c->seen[u] = 1;
              for (int k = c->gStart[u]; k < c->gStart[u + 1]; k++)
                  if (!c->seen[c->gAdj[k]]) sccFirst(c, c->gAdj[k]);
              c->order[c->orderLen++] = u;
          }

          static void sccSecond(SccCtx* c, int u) {
              c->seen[u] = 1;
              for (int k = c->rStart[u]; k < c->rStart[u + 1]; k++)
                  if (!c->seen[c->rAdj[k]]) sccSecond(c, c->rAdj[k]);
          }

          int kosaraju(int n, int** edges, int edgesSize, int* edgesColSize) {
              SccCtx c;
              c.gStart = (int*)calloc(n + 1, sizeof(int));
              c.rStart = (int*)calloc(n + 1, sizeof(int));
              c.gAdj = (int*)malloc((edgesSize + 1) * sizeof(int));
              c.rAdj = (int*)malloc((edgesSize + 1) * sizeof(int));
              for (int i = 0; i < edgesSize; i++) { c.gStart[edges[i][0] + 1]++; c.rStart[edges[i][1] + 1]++; }
              for (int i = 0; i < n; i++) { c.gStart[i + 1] += c.gStart[i]; c.rStart[i + 1] += c.rStart[i]; }
              int* gPos = (int*)malloc((n + 1) * sizeof(int));
              int* rPos = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i <= n; i++) { gPos[i] = c.gStart[i]; rPos[i] = c.rStart[i]; }
              for (int i = 0; i < edgesSize; i++) {
                  int u = edges[i][0], v = edges[i][1];
                  c.gAdj[gPos[u]++] = v;
                  c.rAdj[rPos[v]++] = u;
              }
              c.seen = (int*)calloc(n, sizeof(int));
              c.order = (int*)malloc(n * sizeof(int));
              c.orderLen = 0;
              for (int u = 0; u < n; u++) if (!c.seen[u]) sccFirst(&c, u);
              for (int u = 0; u < n; u++) c.seen[u] = 0;
              int count = 0;
              for (int t = n - 1; t >= 0; t--) {
                  if (!c.seen[c.order[t]]) { count++; sccSecond(&c, c.order[t]); }
              }
              free(c.gStart); free(c.rStart); free(c.gAdj); free(c.rAdj);
              free(gPos); free(rPos); free(c.seen); free(c.order);
              return count;
          }
        `,
        csharp: code`
          public static int Kosaraju(int n, int[][] edges)
          {
              var g = new List<int>[n];
              var rg = new List<int>[n];
              for (int i = 0; i < n; i++) { g[i] = new List<int>(); rg[i] = new List<int>(); }
              foreach (var e in edges) { g[e[0]].Add(e[1]); rg[e[1]].Add(e[0]); }
              var seen = new bool[n];
              var order = new List<int>();
              for (int u = 0; u < n; u++) if (!seen[u]) SccFirst(g, u, seen, order);
              seen = new bool[n];
              int count = 0;
              for (int t = order.Count - 1; t >= 0; t--)
              {
                  if (!seen[order[t]]) { count++; SccSecond(rg, order[t], seen); }
              }
              return count;
          }

          static void SccFirst(List<int>[] g, int u, bool[] seen, List<int> order)
          {
              seen[u] = true;
              foreach (int v in g[u]) if (!seen[v]) SccFirst(g, v, seen, order);
              order.Add(u);
          }

          static void SccSecond(List<int>[] rg, int u, bool[] seen)
          {
              seen[u] = true;
              foreach (int v in rg[u]) if (!seen[v]) SccSecond(rg, v, seen);
          }
        `,
        go: code`
          func kosaraju(n int, edges [][]int) int {
              g := make([][]int, n)
              rg := make([][]int, n)
              for _, e := range edges {
                  g[e[0]] = append(g[e[0]], e[1])
                  rg[e[1]] = append(rg[e[1]], e[0])
              }
              seen := make([]bool, n)
              order := []int{}
              var dfs1 func(int)
              dfs1 = func(u int) {
                  seen[u] = true
                  for _, v := range g[u] {
                      if !seen[v] {
                          dfs1(v)
                      }
                  }
                  order = append(order, u)
              }
              var dfs2 func(int)
              dfs2 = func(u int) {
                  seen[u] = true
                  for _, v := range rg[u] {
                      if !seen[v] {
                          dfs2(v)
                      }
                  }
              }
              for u := 0; u < n; u++ {
                  if !seen[u] {
                      dfs1(u)
                  }
              }
              for i := range seen {
                  seen[i] = false
              }
              count := 0
              for t := len(order) - 1; t >= 0; t-- {
                  if !seen[order[t]] {
                      count++
                      dfs2(order[t])
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun kosaraju(n: Int, edges: Array<IntArray>): Int {
              val g = Array(n) { ArrayList<Int>() }
              val rg = Array(n) { ArrayList<Int>() }
              for (e in edges) { g[e[0]].add(e[1]); rg[e[1]].add(e[0]) }
              val seen = BooleanArray(n)
              val order = ArrayList<Int>()
              fun dfs1(u: Int) {
                  seen[u] = true
                  for (v in g[u]) if (!seen[v]) dfs1(v)
                  order.add(u)
              }
              fun dfs2(u: Int) {
                  seen[u] = true
                  for (v in rg[u]) if (!seen[v]) dfs2(v)
              }
              for (u in 0 until n) if (!seen[u]) dfs1(u)
              seen.fill(false)
              var count = 0
              for (t in order.indices.reversed()) {
                  if (!seen[order[t]]) { count++; dfs2(order[t]) }
              }
              return count
          }
        `,
        swift: code`
          func kosaraju(_ n: Int, _ edges: [[Int]]) -> Int {
              var g = [[Int]](repeating: [], count: n)
              var rg = [[Int]](repeating: [], count: n)
              for e in edges { g[e[0]].append(e[1]); rg[e[1]].append(e[0]) }
              var seen = [Bool](repeating: false, count: n)
              var order = [Int]()
              func dfs1(_ u: Int) {
                  seen[u] = true
                  for v in g[u] where !seen[v] { dfs1(v) }
                  order.append(u)
              }
              func dfs2(_ u: Int) {
                  seen[u] = true
                  for v in rg[u] where !seen[v] { dfs2(v) }
              }
              for u in 0..<n where !seen[u] { dfs1(u) }
              seen = [Bool](repeating: false, count: n)
              var count = 0
              for u in order.reversed() where !seen[u] {
                  count += 1
                  dfs2(u)
              }
              return count
          }
        `,
        rust: code`
          fn scc_first(g: &Vec<Vec<usize>>, u: usize, seen: &mut Vec<bool>, order: &mut Vec<usize>) {
              seen[u] = true;
              for &v in g[u].iter() {
                  if !seen[v] {
                      scc_first(g, v, seen, order);
                  }
              }
              order.push(u);
          }

          fn scc_second(rg: &Vec<Vec<usize>>, u: usize, seen: &mut Vec<bool>) {
              seen[u] = true;
              for &v in rg[u].iter() {
                  if !seen[v] {
                      scc_second(rg, v, seen);
                  }
              }
          }

          fn kosaraju(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut g = vec![Vec::new(); n];
              let mut rg = vec![Vec::new(); n];
              for e in edges.iter() {
                  g[e[0] as usize].push(e[1] as usize);
                  rg[e[1] as usize].push(e[0] as usize);
              }
              let mut seen = vec![false; n];
              let mut order = Vec::with_capacity(n);
              for u in 0..n {
                  if !seen[u] {
                      scc_first(&g, u, &mut seen, &mut order);
                  }
              }
              let mut seen = vec![false; n];
              let mut count = 0;
              for &u in order.iter().rev() {
                  if !seen[u] {
                      count += 1;
                      scc_second(&rg, u, &mut seen);
                  }
              }
              count
          }
        `,
        php: code`
          function kosaraju($n, $edges) {
              $g = array_fill(0, $n, []);
              $rg = array_fill(0, $n, []);
              foreach ($edges as $e) { $g[$e[0]][] = $e[1]; $rg[$e[1]][] = $e[0]; }
              $seen = array_fill(0, $n, false);
              $order = [];
              for ($u = 0; $u < $n; $u++) if (!$seen[$u]) sccFirst($g, $u, $seen, $order);
              $seen = array_fill(0, $n, false);
              $count = 0;
              for ($t = count($order) - 1; $t >= 0; $t--) {
                  if (!$seen[$order[$t]]) { $count++; sccSecond($rg, $order[$t], $seen); }
              }
              return $count;
          }

          function sccFirst(&$g, $u, &$seen, &$order) {
              $seen[$u] = true;
              foreach ($g[$u] as $v) if (!$seen[$v]) sccFirst($g, $v, $seen, $order);
              $order[] = $u;
          }

          function sccSecond(&$rg, $u, &$seen) {
              $seen[$u] = true;
              foreach ($rg[$u] as $v) if (!$seen[$v]) sccSecond($rg, $v, $seen);
          }
        `,
        ruby: code`
          def scc_first(g, u, seen, order)
            seen[u] = true
            g[u].each { |v| scc_first(g, v, seen, order) unless seen[v] }
            order << u
          end

          def scc_second(rg, u, seen)
            seen[u] = true
            rg[u].each { |v| scc_second(rg, v, seen) unless seen[v] }
          end

          def kosaraju(n, edges)
            g = Array.new(n) { [] }
            rg = Array.new(n) { [] }
            edges.each do |u, v|
              g[u] << v
              rg[v] << u
            end
            seen = Array.new(n, false)
            order = []
            n.times { |u| scc_first(g, u, seen, order) unless seen[u] }
            seen = Array.new(n, false)
            count = 0
            order.reverse_each do |u|
              next if seen[u]
              count += 1
              scc_second(rg, u, seen)
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Articulation Points in a Graph (GFG) ────────────────────────
  (() => {
    const components = (n: number, adj: number[][], removed: number) => {
      const seen = new Array(n).fill(false);
      let c = 0;
      for (let s = 0; s < n; s++) {
        if (s === removed || seen[s]) continue;
        c++;
        seen[s] = true;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (v !== removed && !seen[v]) { seen[v] = true; q.push(v); }
      }
      return c;
    };
    const ref = (n: number, edges: number[][]) => {
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
      const base = components(n, adj, -1);
      const out: number[] = [];
      for (let v = 0; v < n; v++) if (components(n, adj, v) > base) out.push(v);
      return out.length ? out : [-1];
    };
    return {
      slug: "articulation-points",
      title: "Articulation Points in a Graph",
      difficulty: "HARD" as const,
      tags: ["Graph", "Depth-First Search", "Amazon", "Microsoft", "Samsung"],
      signature: {
        funcName: "articulationPoints",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an **undirected** graph with `n` vertices numbered `0` to `n - 1`; each `edges[i] = [u, v]` connects `u` and `v`. The graph need not be connected.\n\nA vertex is an **articulation point** (a cut vertex) if deleting it, together with its edges, increases the number of connected components of the graph.\n\nReturn every articulation point in **ascending order**. If the graph has none, return `[-1]`.",
        [
          { in: "n = 5, edges = [[0,1],[1,4],[4,3],[4,2],[2,3]]", out: "[1,4]", note: "Removing 1 cuts 0 off; removing 4 separates {0, 1} from {2, 3}. The triangle 2–3–4 survives losing 2 or 3." },
          { in: "n = 4, edges = [[0,1],[1,2],[2,3],[3,0]]", out: "[-1]", note: "On a cycle every vertex has a way around, so no single deletion disconnects anything." },
          { in: "n = 3, edges = [[0,1],[1,2]]", out: "[1]" },
        ],
        ["1 <= n <= 10^4", "0 <= edges.length <= 10^4", "edges[i].length == 2", "0 <= u, v < n, u != v", "there are no repeated edges"]),
      hints: [
        "Run a DFS and record each vertex's discovery time `disc[u]`. Edges that go back to an ancestor are the only way a subtree can bypass its parent.",
        "Let `low[u]` be the earliest discovery time reachable from `u`'s subtree using tree edges down and at most one back edge up.",
        "A non-root `u` is a cut vertex if some child `v` has `low[v] >= disc[u]`. The DFS root is a cut vertex exactly when it has two or more DFS children.",
      ],
      editorial: explain({
        idea: "Tarjan's low-link technique finds every cut vertex in one DFS. A child subtree that cannot climb above `u` without passing through `u` gets disconnected when `u` is removed.",
        steps: [
          "Build the adjacency list. Set `disc[u] = -1` for all `u`.",
          "For each undiscovered vertex, start a DFS as a root with parent `-1`.",
          "In `dfs(u, parent)`: set `disc[u] = low[u] = timer++`. For each neighbour `v`: if undiscovered, recurse, count a child, set `low[u] = min(low[u], low[v])`, and mark `u` if `parent != -1` and `low[v] >= disc[u]`; else if `v != parent`, set `low[u] = min(low[u], disc[v])`.",
          "After the loop, mark a root `u` if it has more than one DFS child.",
          "Collect marked vertices in ascending order, or return `[-1]` if there are none.",
        ],
        why: "In an undirected DFS every non-tree edge joins a vertex to one of its ancestors. If child `v` has `low[v] >= disc[u]`, no vertex in `v`'s subtree has an edge to a proper ancestor of `u`, so every path from that subtree to the rest of the graph passes through `u` — deleting `u` disconnects it. Conversely if every child can reach above `u`, all children stay attached to `u`'s parent. A root has no ancestor, so it separates its subtrees exactly when it has more than one.",
        time: "O(n + E)",
        space: "O(n + E)",
        pitfalls: [
          "The root needs its own rule: `low[v] >= disc[root]` holds for every child of the root.",
          "Update `low[u]` from a back edge with `disc[v]`, not `low[v]`.",
          "A vertex can be found as a cut vertex through several children — mark it once, not once per child.",
          "Restart the DFS from every undiscovered vertex: the graph may be disconnected.",
        ],
      }),
      examples: [
        { input: "5\n[[0,1],[1,4],[4,3],[4,2],[2,3]]", expectedOutput: "[1,4]" },
        { input: "4\n[[0,1],[1,2],[2,3],[3,0]]", expectedOutput: "[-1]" },
        { input: "3\n[[0,1],[1,2]]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 10, 16]));
        const has = new Set<string>();
        const edges: number[][] = [];
        const add = (u: number, v: number) => {
          const key = u < v ? `${u},${v}` : `${v},${u}`;
          if (u === v || has.has(key)) return;
          has.add(key);
          edges.push(rng() < 0.5 ? [u, v] : [v, u]);
        };
        const mode = ri(rng, 0, 2);
        if (mode === 0) {
          const p = pick(rng, [0.1, 0.2, 0.35, 0.6]);
          for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (rng() < p) add(u, v);
        } else {
          // a random tree (or forest) plus a few extra edges closing cycles
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          for (let i = 1; i < n; i++) if (mode === 1 || rng() < 0.85) add(order[i], order[ri(rng, 0, i - 1)]);
          const extra = ri(rng, 0, Math.max(0, Math.floor(n / 2)));
          for (let t = 0; t < extra; t++) add(ri(rng, 0, n - 1), ri(rng, 0, n - 1));
        }
        shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntArr(ref(n, edges)) };
      },
      solutions: {
        python: code`
          import sys
          from typing import List

          def articulationPoints(n: int, edges: List[List[int]]) -> List[int]:
              sys.setrecursionlimit(max(1000, 4 * n + 100))
              adj = [[] for _ in range(n)]
              for u, v in edges:
                  adj[u].append(v)
                  adj[v].append(u)
              disc = [-1] * n
              low = [0] * n
              cut = [False] * n
              timer = [0]

              def dfs(u, parent):
                  disc[u] = low[u] = timer[0]
                  timer[0] += 1
                  children = 0
                  for v in adj[u]:
                      if disc[v] == -1:
                          children += 1
                          dfs(v, u)
                          low[u] = min(low[u], low[v])
                          if parent != -1 and low[v] >= disc[u]:
                              cut[u] = True
                      elif v != parent:
                          low[u] = min(low[u], disc[v])
                  if parent == -1 and children > 1:
                      cut[u] = True

              for u in range(n):
                  if disc[u] == -1:
                      dfs(u, -1)
              res = [u for u in range(n) if cut[u]]
              return res if res else [-1]
        `,
        javascript: code`
          var articulationPoints = function(n, edges) {
              var adj = [], disc = [], low = [], cut = [];
              for (var i = 0; i < n; i++) { adj.push([]); disc.push(-1); low.push(0); cut.push(false); }
              for (var k = 0; k < edges.length; k++) { adj[edges[k][0]].push(edges[k][1]); adj[edges[k][1]].push(edges[k][0]); }
              var timer = 0;
              var dfs = function(u, parent) {
                  disc[u] = low[u] = timer++;
                  var children = 0;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (disc[v] === -1) {
                          children++;
                          dfs(v, u);
                          low[u] = Math.min(low[u], low[v]);
                          if (parent !== -1 && low[v] >= disc[u]) cut[u] = true;
                      } else if (v !== parent) {
                          low[u] = Math.min(low[u], disc[v]);
                      }
                  }
                  if (parent === -1 && children > 1) cut[u] = true;
              };
              for (var u = 0; u < n; u++) if (disc[u] === -1) dfs(u, -1);
              var res = [];
              for (var x = 0; x < n; x++) if (cut[x]) res.push(x);
              return res.length ? res : [-1];
          };
        `,
        typescript: code`
          function articulationPoints(n: number, edges: number[][]): number[] {
              var adj: number[][] = [], disc: number[] = [], low: number[] = [], cut: boolean[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); disc.push(-1); low.push(0); cut.push(false); }
              for (var k = 0; k < edges.length; k++) { adj[edges[k][0]].push(edges[k][1]); adj[edges[k][1]].push(edges[k][0]); }
              var timer = 0;
              function dfs(u: number, parent: number): void {
                  disc[u] = low[u] = timer++;
                  var children = 0;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (disc[v] === -1) {
                          children++;
                          dfs(v, u);
                          low[u] = Math.min(low[u], low[v]);
                          if (parent !== -1 && low[v] >= disc[u]) cut[u] = true;
                      } else if (v !== parent) {
                          low[u] = Math.min(low[u], disc[v]);
                      }
                  }
                  if (parent === -1 && children > 1) cut[u] = true;
              }
              for (var u = 0; u < n; u++) if (disc[u] === -1) dfs(u, -1);
              var res: number[] = [];
              for (var x = 0; x < n; x++) if (cut[x]) res.push(x);
              return res.length ? res : [-1];
          }
        `,
        java: code`
          static int apTimer;

          public static int[] articulationPoints(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] disc = new int[n], low = new int[n];
              boolean[] cut = new boolean[n];
              Arrays.fill(disc, -1);
              apTimer = 0;
              for (int u = 0; u < n; u++) if (disc[u] == -1) apDfs(adj, u, -1, disc, low, cut);
              List<Integer> res = new ArrayList<>();
              for (int u = 0; u < n; u++) if (cut[u]) res.add(u);
              if (res.isEmpty()) return new int[]{-1};
              int[] out = new int[res.size()];
              for (int i = 0; i < out.length; i++) out[i] = res.get(i);
              return out;
          }

          static void apDfs(List<List<Integer>> adj, int u, int parent, int[] disc, int[] low, boolean[] cut) {
              disc[u] = low[u] = apTimer++;
              int children = 0;
              for (int v : adj.get(u)) {
                  if (disc[v] == -1) {
                      children++;
                      apDfs(adj, v, u, disc, low, cut);
                      low[u] = Math.min(low[u], low[v]);
                      if (parent != -1 && low[v] >= disc[u]) cut[u] = true;
                  } else if (v != parent) {
                      low[u] = Math.min(low[u], disc[v]);
                  }
              }
              if (parent == -1 && children > 1) cut[u] = true;
          }
        `,
        cpp: code`
          static void apDfs(vector<vector<int>>& adj, int u, int parent, vector<int>& disc, vector<int>& low, vector<bool>& cut, int& timer) {
              disc[u] = low[u] = timer++;
              int children = 0;
              for (int v : adj[u]) {
                  if (disc[v] == -1) {
                      children++;
                      apDfs(adj, v, u, disc, low, cut, timer);
                      low[u] = min(low[u], low[v]);
                      if (parent != -1 && low[v] >= disc[u]) cut[u] = true;
                  } else if (v != parent) {
                      low[u] = min(low[u], disc[v]);
                  }
              }
              if (parent == -1 && children > 1) cut[u] = true;
          }

          vector<int> articulationPoints(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> disc(n, -1), low(n, 0);
              vector<bool> cut(n, false);
              int timer = 0;
              for (int u = 0; u < n; u++) if (disc[u] == -1) apDfs(adj, u, -1, disc, low, cut, timer);
              vector<int> res;
              for (int u = 0; u < n; u++) if (cut[u]) res.push_back(u);
              if (res.empty()) res.push_back(-1);
              return res;
          }
        `,
        c: code`
          typedef struct {
              int *start, *adj, *disc, *low, *cut;
              int timer;
          } ApCtx;

          static void apDfs(ApCtx* c, int u, int parent) {
              c->disc[u] = c->low[u] = c->timer++;
              int children = 0;
              for (int k = c->start[u]; k < c->start[u + 1]; k++) {
                  int v = c->adj[k];
                  if (c->disc[v] == -1) {
                      children++;
                      apDfs(c, v, u);
                      if (c->low[v] < c->low[u]) c->low[u] = c->low[v];
                      if (parent != -1 && c->low[v] >= c->disc[u]) c->cut[u] = 1;
                  } else if (v != parent) {
                      if (c->disc[v] < c->low[u]) c->low[u] = c->disc[v];
                  }
              }
              if (parent == -1 && children > 1) c->cut[u] = 1;
          }

          int* articulationPoints(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
              ApCtx c;
              c.start = (int*)calloc(n + 1, sizeof(int));
              c.adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int i = 0; i < edgesSize; i++) { c.start[edges[i][0] + 1]++; c.start[edges[i][1] + 1]++; }
              for (int i = 0; i < n; i++) c.start[i + 1] += c.start[i];
              int* pos = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i <= n; i++) pos[i] = c.start[i];
              for (int i = 0; i < edgesSize; i++) {
                  int u = edges[i][0], v = edges[i][1];
                  c.adj[pos[u]++] = v;
                  c.adj[pos[v]++] = u;
              }
              c.disc = (int*)malloc(n * sizeof(int));
              c.low = (int*)calloc(n, sizeof(int));
              c.cut = (int*)calloc(n, sizeof(int));
              for (int i = 0; i < n; i++) c.disc[i] = -1;
              c.timer = 0;
              for (int u = 0; u < n; u++) if (c.disc[u] == -1) apDfs(&c, u, -1);
              int* res = (int*)malloc((n + 1) * sizeof(int));
              int cnt = 0;
              for (int u = 0; u < n; u++) if (c.cut[u]) res[cnt++] = u;
              if (cnt == 0) res[cnt++] = -1;
              *returnSize = cnt;
              free(c.start); free(c.adj); free(pos); free(c.disc); free(c.low); free(c.cut);
              return res;
          }
        `,
        csharp: code`
          static int apTimer;

          public static int[] ArticulationPoints(int n, int[][] edges)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var disc = new int[n];
              var low = new int[n];
              var cut = new bool[n];
              for (int i = 0; i < n; i++) disc[i] = -1;
              apTimer = 0;
              for (int u = 0; u < n; u++) if (disc[u] == -1) ApDfs(adj, u, -1, disc, low, cut);
              var res = new List<int>();
              for (int u = 0; u < n; u++) if (cut[u]) res.Add(u);
              if (res.Count == 0) res.Add(-1);
              return res.ToArray();
          }

          static void ApDfs(List<int>[] adj, int u, int parent, int[] disc, int[] low, bool[] cut)
          {
              disc[u] = low[u] = apTimer++;
              int children = 0;
              foreach (int v in adj[u])
              {
                  if (disc[v] == -1)
                  {
                      children++;
                      ApDfs(adj, v, u, disc, low, cut);
                      low[u] = Math.Min(low[u], low[v]);
                      if (parent != -1 && low[v] >= disc[u]) cut[u] = true;
                  }
                  else if (v != parent)
                  {
                      low[u] = Math.Min(low[u], disc[v]);
                  }
              }
              if (parent == -1 && children > 1) cut[u] = true;
          }
        `,
        go: code`
          func articulationPoints(n int, edges [][]int) []int {
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              disc := make([]int, n)
              low := make([]int, n)
              cut := make([]bool, n)
              for i := range disc {
                  disc[i] = -1
              }
              timer := 0
              var dfs func(u, parent int)
              dfs = func(u, parent int) {
                  disc[u] = timer
                  low[u] = timer
                  timer++
                  children := 0
                  for _, v := range adj[u] {
                      if disc[v] == -1 {
                          children++
                          dfs(v, u)
                          if low[v] < low[u] {
                              low[u] = low[v]
                          }
                          if parent != -1 && low[v] >= disc[u] {
                              cut[u] = true
                          }
                      } else if v != parent && disc[v] < low[u] {
                          low[u] = disc[v]
                      }
                  }
                  if parent == -1 && children > 1 {
                      cut[u] = true
                  }
              }
              for u := 0; u < n; u++ {
                  if disc[u] == -1 {
                      dfs(u, -1)
                  }
              }
              res := []int{}
              for u := 0; u < n; u++ {
                  if cut[u] {
                      res = append(res, u)
                  }
              }
              if len(res) == 0 {
                  res = append(res, -1)
              }
              return res
          }
        `,
        kotlin: code`
          fun articulationPoints(n: Int, edges: Array<IntArray>): IntArray {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val disc = IntArray(n) { -1 }
              val low = IntArray(n)
              val cut = BooleanArray(n)
              var timer = 0
              fun dfs(u: Int, parent: Int) {
                  disc[u] = timer; low[u] = timer; timer++
                  var children = 0
                  for (v in adj[u]) {
                      if (disc[v] == -1) {
                          children++
                          dfs(v, u)
                          low[u] = minOf(low[u], low[v])
                          if (parent != -1 && low[v] >= disc[u]) cut[u] = true
                      } else if (v != parent) {
                          low[u] = minOf(low[u], disc[v])
                      }
                  }
                  if (parent == -1 && children > 1) cut[u] = true
              }
              for (u in 0 until n) if (disc[u] == -1) dfs(u, -1)
              val res = (0 until n).filter { cut[it] }
              return if (res.isEmpty()) intArrayOf(-1) else res.toIntArray()
          }
        `,
        swift: code`
          func articulationPoints(_ n: Int, _ edges: [[Int]]) -> [Int] {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var disc = [Int](repeating: -1, count: n)
              var low = [Int](repeating: 0, count: n)
              var cut = [Bool](repeating: false, count: n)
              var timer = 0
              func dfs(_ u: Int, _ parent: Int) {
                  disc[u] = timer; low[u] = timer; timer += 1
                  var children = 0
                  for v in adj[u] {
                      if disc[v] == -1 {
                          children += 1
                          dfs(v, u)
                          low[u] = min(low[u], low[v])
                          if parent != -1 && low[v] >= disc[u] { cut[u] = true }
                      } else if v != parent {
                          low[u] = min(low[u], disc[v])
                      }
                  }
                  if parent == -1 && children > 1 { cut[u] = true }
              }
              for u in 0..<n where disc[u] == -1 { dfs(u, -1) }
              let res = (0..<n).filter { cut[$0] }
              return res.isEmpty ? [-1] : res
          }
        `,
        rust: code`
          fn ap_dfs(adj: &Vec<Vec<usize>>, u: usize, parent: usize, disc: &mut Vec<i32>, low: &mut Vec<i32>, cut: &mut Vec<bool>, timer: &mut i32) {
              disc[u] = *timer;
              low[u] = *timer;
              *timer += 1;
              let mut children = 0;
              for &v in adj[u].iter() {
                  if disc[v] == -1 {
                      children += 1;
                      ap_dfs(adj, v, u, disc, low, cut, timer);
                      if low[v] < low[u] {
                          low[u] = low[v];
                      }
                      if parent != std::usize::MAX && low[v] >= disc[u] {
                          cut[u] = true;
                      }
                  } else if v != parent && disc[v] < low[u] {
                      low[u] = disc[v];
                  }
              }
              if parent == std::usize::MAX && children > 1 {
                  cut[u] = true;
              }
          }

          fn articulationPoints(n: i32, edges: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut adj = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut disc = vec![-1i32; n];
              let mut low = vec![0i32; n];
              let mut cut = vec![false; n];
              let mut timer = 0i32;
              for u in 0..n {
                  if disc[u] == -1 {
                      ap_dfs(&adj, u, std::usize::MAX, &mut disc, &mut low, &mut cut, &mut timer);
                  }
              }
              let res: Vec<i32> = (0..n).filter(|&u| cut[u]).map(|u| u as i32).collect();
              if res.is_empty() { vec![-1] } else { res }
          }
        `,
        php: code`
          function articulationPoints($n, $edges) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $disc = array_fill(0, $n, -1);
              $low = array_fill(0, $n, 0);
              $cut = array_fill(0, $n, false);
              $timer = 0;
              for ($u = 0; $u < $n; $u++) if ($disc[$u] == -1) apDfs($adj, $u, -1, $disc, $low, $cut, $timer);
              $res = [];
              for ($u = 0; $u < $n; $u++) if ($cut[$u]) $res[] = $u;
              return count($res) ? $res : [-1];
          }

          function apDfs(&$adj, $u, $parent, &$disc, &$low, &$cut, &$timer) {
              $disc[$u] = $low[$u] = $timer++;
              $children = 0;
              foreach ($adj[$u] as $v) {
                  if ($disc[$v] == -1) {
                      $children++;
                      apDfs($adj, $v, $u, $disc, $low, $cut, $timer);
                      $low[$u] = min($low[$u], $low[$v]);
                      if ($parent != -1 && $low[$v] >= $disc[$u]) $cut[$u] = true;
                  } elseif ($v != $parent) {
                      $low[$u] = min($low[$u], $disc[$v]);
                  }
              }
              if ($parent == -1 && $children > 1) $cut[$u] = true;
          }
        `,
        ruby: code`
          def ap_dfs(st, u, parent)
            adj, disc, low, cut = st[:adj], st[:disc], st[:low], st[:cut]
            disc[u] = low[u] = st[:timer]
            st[:timer] += 1
            children = 0
            adj[u].each do |v|
              if disc[v] == -1
                children += 1
                ap_dfs(st, v, u)
                low[u] = low[v] if low[v] < low[u]
                cut[u] = true if parent != -1 && low[v] >= disc[u]
              elsif v != parent
                low[u] = disc[v] if disc[v] < low[u]
              end
            end
            cut[u] = true if parent == -1 && children > 1
          end

          def articulationPoints(n, edges)
            adj = Array.new(n) { [] }
            edges.each do |u, v|
              adj[u] << v
              adj[v] << u
            end
            st = { adj: adj, disc: Array.new(n, -1), low: Array.new(n, 0), cut: Array.new(n, false), timer: 0 }
            n.times { |u| ap_dfs(st, u, -1) if st[:disc][u] == -1 }
            res = (0...n).select { |u| st[:cut][u] }
            res.empty? ? [-1] : res
          end
        `,
      },
    };
  })(),

  // ── Knight Walk (GFG) ───────────────────────────────────────────
  (() => {
    const MOVES = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    const ref = (kp: number[], tp: number[], n: number) => {
      const dist = new Map<string, number>();
      const start = `${kp[0]},${kp[1]}`;
      dist.set(start, 0);
      const q: number[][] = [kp];
      for (let h = 0; h < q.length; h++) {
        const [r, c] = q[h];
        const d = dist.get(`${r},${c}`)!;
        if (r === tp[0] && c === tp[1]) return d;
        for (const [dr, dc] of MOVES) {
          const nr = r + dr, nc = c + dc;
          if (nr < 1 || nc < 1 || nr > n || nc > n || dist.has(`${nr},${nc}`)) continue;
          dist.set(`${nr},${nc}`, d + 1);
          q.push([nr, nc]);
        }
      }
      return -1;
    };
    return {
      slug: "knight-walk",
      title: "Knight Walk",
      difficulty: "MEDIUM" as const,
      tags: ["Breadth-First Search", "Matrix", "Amazon", "Microsoft", "Samsung"],
      signature: {
        funcName: "minStepToReachTarget",
        params: [{ name: "knightPos", type: "int[]" as const }, { name: "targetPos", type: "int[]" as const }, { name: "n", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A knight stands on an `n x n` chessboard whose rows and columns are numbered `1` to `n`. It starts at `knightPos = [row, col]` and wants to reach `targetPos = [row, col]`.\n\nIn one move a knight goes two squares in one direction and one square in a perpendicular direction — up to eight possible squares — and it may never leave the board.\n\nReturn the **minimum number of moves** the knight needs to reach the target, or `-1` if it can never get there.",
        [
          { in: "knightPos = [4,5], targetPos = [1,1], n = 6", out: "3", note: "One shortest route is (4,5) → (5,3) → (3,2) → (1,1)." },
          { in: "knightPos = [2,2], targetPos = [1,1], n = 3", out: "-1", note: "On a 3 x 3 board the centre square has no legal move at all." },
          { in: "knightPos = [1,1], targetPos = [1,1], n = 1", out: "0" },
        ],
        ["1 <= n <= 1000", "knightPos.length == targetPos.length == 2", "1 <= knightPos[i], targetPos[i] <= n"]),
      hints: [
        "Every move costs the same, so the fewest moves is a shortest path in an unweighted graph whose vertices are the squares.",
        "Breadth-first search from the knight's square visits squares in order of their distance.",
        "Mark a square when it is first enqueued so no square enters the queue twice, and stop as soon as the target is reached.",
      ],
      editorial: explain({
        idea: "The board is an unweighted graph: each square is a vertex joined to the up-to-eight squares a knight can jump to. Breadth-first search from the start finds the shortest number of jumps to every square.",
        steps: [
          "If the start equals the target, return `0`.",
          "Keep a distance array over the `n * n` squares, all `-1`, and set the start to `0`. Push the start into a queue.",
          "Pop a square; for each of the eight jumps that stays on the board and lands on an unvisited square, set its distance to the current one plus one and push it. If that square is the target, return its distance.",
          "If the queue empties first, the target is unreachable: return `-1`.",
        ],
        why: "BFS processes squares in non-decreasing distance order, so the first time a square is discovered it is discovered by a shortest route. The target therefore gets its true minimum on discovery.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Positions are 1-indexed; convert them (or bound-check against `1..n`) consistently.",
          "On boards of side 1, 2 or 3 some squares are unreachable — the `-1` case is real.",
          "Mark squares visited when they are pushed, not when popped, or the queue can hold many copies of a square.",
        ],
      }),
      examples: [
        { input: "[4,5]\n[1,1]\n6", expectedOutput: "3" },
        { input: "[2,2]\n[1,1]\n3", expectedOutput: "-1" },
        { input: "[1,1]\n[1,1]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [3, 4, 8, 20, 30]));
        const kp = [ri(rng, 1, n), ri(rng, 1, n)];
        const tp = rng() < 0.1 ? kp.slice() : [ri(rng, 1, n), ri(rng, 1, n)];
        return { input: `${fmtIntArr(kp)}\n${fmtIntArr(tp)}\n${n}`, expectedOutput: String(ref(kp, tp, n)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def minStepToReachTarget(knightPos: List[int], targetPos: List[int], n: int) -> int:
              sr, sc = knightPos[0] - 1, knightPos[1] - 1
              tr, tc = targetPos[0] - 1, targetPos[1] - 1
              if sr == tr and sc == tc:
                  return 0
              dist = [-1] * (n * n)
              dist[sr * n + sc] = 0
              q = deque([(sr, sc)])
              moves = ((1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2))
              while q:
                  r, c = q.popleft()
                  d = dist[r * n + c]
                  for dr, dc in moves:
                      nr, nc = r + dr, c + dc
                      if 0 <= nr < n and 0 <= nc < n and dist[nr * n + nc] == -1:
                          if nr == tr and nc == tc:
                              return d + 1
                          dist[nr * n + nc] = d + 1
                          q.append((nr, nc))
              return -1
        `,
        javascript: code`
          var minStepToReachTarget = function(knightPos, targetPos, n) {
              var sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr === tr && sc === tc) return 0;
              var dr = [1, 2, 2, 1, -1, -2, -2, -1], dc = [2, 1, -1, -2, -2, -1, 1, 2];
              var dist = new Array(n * n);
              for (var i = 0; i < n * n; i++) dist[i] = -1;
              dist[sr * n + sc] = 0;
              var q = [sr * n + sc];
              for (var h = 0; h < q.length; h++) {
                  var r = Math.floor(q[h] / n), c = q[h] % n, d = dist[q[h]];
                  for (var k = 0; k < 8; k++) {
                      var nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] !== -1) continue;
                      if (nr === tr && nc === tc) return d + 1;
                      dist[nr * n + nc] = d + 1;
                      q.push(nr * n + nc);
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function minStepToReachTarget(knightPos: number[], targetPos: number[], n: number): number {
              var sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr === tr && sc === tc) return 0;
              var dr = [1, 2, 2, 1, -1, -2, -2, -1], dc = [2, 1, -1, -2, -2, -1, 1, 2];
              var dist: number[] = new Array(n * n);
              for (var i = 0; i < n * n; i++) dist[i] = -1;
              dist[sr * n + sc] = 0;
              var q: number[] = [sr * n + sc];
              for (var h = 0; h < q.length; h++) {
                  var r = Math.floor(q[h] / n), c = q[h] % n, d = dist[q[h]];
                  for (var k = 0; k < 8; k++) {
                      var nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] !== -1) continue;
                      if (nr === tr && nc === tc) return d + 1;
                      dist[nr * n + nc] = d + 1;
                      q.push(nr * n + nc);
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minStepToReachTarget(int[] knightPos, int[] targetPos, int n) {
              int sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr == tr && sc == tc) return 0;
              int[] dr = {1, 2, 2, 1, -1, -2, -2, -1}, dc = {2, 1, -1, -2, -2, -1, 1, 2};
              int[] dist = new int[n * n];
              Arrays.fill(dist, -1);
              int[] q = new int[n * n];
              int head = 0, tail = 0;
              dist[sr * n + sc] = 0;
              q[tail++] = sr * n + sc;
              while (head < tail) {
                  int cur = q[head++], r = cur / n, c = cur % n;
                  for (int k = 0; k < 8; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1) continue;
                      if (nr == tr && nc == tc) return dist[cur] + 1;
                      dist[nr * n + nc] = dist[cur] + 1;
                      q[tail++] = nr * n + nc;
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minStepToReachTarget(vector<int>& knightPos, vector<int>& targetPos, int n) {
              int sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr == tr && sc == tc) return 0;
              int dr[8] = {1, 2, 2, 1, -1, -2, -2, -1}, dc[8] = {2, 1, -1, -2, -2, -1, 1, 2};
              vector<int> dist(n * n, -1);
              queue<int> q;
              dist[sr * n + sc] = 0;
              q.push(sr * n + sc);
              while (!q.empty()) {
                  int cur = q.front(); q.pop();
                  int r = cur / n, c = cur % n;
                  for (int k = 0; k < 8; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1) continue;
                      if (nr == tr && nc == tc) return dist[cur] + 1;
                      dist[nr * n + nc] = dist[cur] + 1;
                      q.push(nr * n + nc);
                  }
              }
              return -1;
          }
        `,
        c: code`
          int minStepToReachTarget(int* knightPos, int knightPosSize, int* targetPos, int targetPosSize, int n) {
              int sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr == tr && sc == tc) return 0;
              int dr[8] = {1, 2, 2, 1, -1, -2, -2, -1}, dc[8] = {2, 1, -1, -2, -2, -1, 1, 2};
              int* dist = (int*)malloc(n * n * sizeof(int));
              int* q = (int*)malloc(n * n * sizeof(int));
              for (int i = 0; i < n * n; i++) dist[i] = -1;
              int head = 0, tail = 0, ans = -1;
              dist[sr * n + sc] = 0;
              q[tail++] = sr * n + sc;
              while (head < tail && ans == -1) {
                  int cur = q[head++], r = cur / n, c = cur % n;
                  for (int k = 0; k < 8; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1) continue;
                      dist[nr * n + nc] = dist[cur] + 1;
                      if (nr == tr && nc == tc) { ans = dist[cur] + 1; break; }
                      q[tail++] = nr * n + nc;
                  }
              }
              free(dist);
              free(q);
              return ans;
          }
        `,
        csharp: code`
          public static int MinStepToReachTarget(int[] knightPos, int[] targetPos, int n)
          {
              int sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1;
              if (sr == tr && sc == tc) return 0;
              int[] dr = { 1, 2, 2, 1, -1, -2, -2, -1 }, dc = { 2, 1, -1, -2, -2, -1, 1, 2 };
              var dist = new int[n * n];
              for (int i = 0; i < n * n; i++) dist[i] = -1;
              var q = new Queue<int>();
              dist[sr * n + sc] = 0;
              q.Enqueue(sr * n + sc);
              while (q.Count > 0)
              {
                  int cur = q.Dequeue(), r = cur / n, c = cur % n;
                  for (int k = 0; k < 8; k++)
                  {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1) continue;
                      if (nr == tr && nc == tc) return dist[cur] + 1;
                      dist[nr * n + nc] = dist[cur] + 1;
                      q.Enqueue(nr * n + nc);
                  }
              }
              return -1;
          }
        `,
        go: code`
          func minStepToReachTarget(knightPos []int, targetPos []int, n int) int {
              sr, sc, tr, tc := knightPos[0]-1, knightPos[1]-1, targetPos[0]-1, targetPos[1]-1
              if sr == tr && sc == tc {
                  return 0
              }
              dr := []int{1, 2, 2, 1, -1, -2, -2, -1}
              dc := []int{2, 1, -1, -2, -2, -1, 1, 2}
              dist := make([]int, n*n)
              for i := range dist {
                  dist[i] = -1
              }
              dist[sr*n+sc] = 0
              q := []int{sr*n + sc}
              for h := 0; h < len(q); h++ {
                  cur := q[h]
                  r, c := cur/n, cur%n
                  for k := 0; k < 8; k++ {
                      nr, nc := r+dr[k], c+dc[k]
                      if nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr*n+nc] != -1 {
                          continue
                      }
                      if nr == tr && nc == tc {
                          return dist[cur] + 1
                      }
                      dist[nr*n+nc] = dist[cur] + 1
                      q = append(q, nr*n+nc)
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun minStepToReachTarget(knightPos: IntArray, targetPos: IntArray, n: Int): Int {
              val sr = knightPos[0] - 1
              val sc = knightPos[1] - 1
              val tr = targetPos[0] - 1
              val tc = targetPos[1] - 1
              if (sr == tr && sc == tc) return 0
              val dr = intArrayOf(1, 2, 2, 1, -1, -2, -2, -1)
              val dc = intArrayOf(2, 1, -1, -2, -2, -1, 1, 2)
              val dist = IntArray(n * n) { -1 }
              val q = IntArray(n * n)
              var head = 0
              var tail = 0
              dist[sr * n + sc] = 0
              q[tail++] = sr * n + sc
              while (head < tail) {
                  val cur = q[head++]
                  val r = cur / n
                  val c = cur % n
                  for (k in 0 until 8) {
                      val nr = r + dr[k]
                      val nc = c + dc[k]
                      if (nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1) continue
                      if (nr == tr && nc == tc) return dist[cur] + 1
                      dist[nr * n + nc] = dist[cur] + 1
                      q[tail++] = nr * n + nc
                  }
              }
              return -1
          }
        `,
        swift: code`
          func minStepToReachTarget(_ knightPos: [Int], _ targetPos: [Int], _ n: Int) -> Int {
              let sr = knightPos[0] - 1, sc = knightPos[1] - 1, tr = targetPos[0] - 1, tc = targetPos[1] - 1
              if sr == tr && sc == tc { return 0 }
              let dr = [1, 2, 2, 1, -1, -2, -2, -1], dc = [2, 1, -1, -2, -2, -1, 1, 2]
              var dist = [Int](repeating: -1, count: n * n)
              dist[sr * n + sc] = 0
              var q = [sr * n + sc]
              var h = 0
              while h < q.count {
                  let cur = q[h]
                  h += 1
                  let r = cur / n, c = cur % n
                  for k in 0..<8 {
                      let nr = r + dr[k], nc = c + dc[k]
                      if nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1 { continue }
                      if nr == tr && nc == tc { return dist[cur] + 1 }
                      dist[nr * n + nc] = dist[cur] + 1
                      q.append(nr * n + nc)
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn minStepToReachTarget(knight_pos: Vec<i32>, target_pos: Vec<i32>, n: i32) -> i32 {
              let (sr, sc, tr, tc) = (knight_pos[0] - 1, knight_pos[1] - 1, target_pos[0] - 1, target_pos[1] - 1);
              if sr == tr && sc == tc {
                  return 0;
              }
              let moves = [(1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2)];
              let nu = n as usize;
              let mut dist = vec![-1i32; nu * nu];
              dist[(sr * n + sc) as usize] = 0;
              let mut q = VecDeque::new();
              q.push_back((sr, sc));
              while let Some((r, c)) = q.pop_front() {
                  let d = dist[(r * n + c) as usize];
                  for &(dr, dc) in moves.iter() {
                      let (nr, nc) = (r + dr, c + dc);
                      if nr < 0 || nc < 0 || nr >= n || nc >= n || dist[(nr * n + nc) as usize] != -1 {
                          continue;
                      }
                      if nr == tr && nc == tc {
                          return d + 1;
                      }
                      dist[(nr * n + nc) as usize] = d + 1;
                      q.push_back((nr, nc));
                  }
              }
              -1
          }
        `,
        php: code`
          function minStepToReachTarget($knightPos, $targetPos, $n) {
              $sr = $knightPos[0] - 1; $sc = $knightPos[1] - 1;
              $tr = $targetPos[0] - 1; $tc = $targetPos[1] - 1;
              if ($sr == $tr && $sc == $tc) return 0;
              $dr = [1, 2, 2, 1, -1, -2, -2, -1];
              $dc = [2, 1, -1, -2, -2, -1, 1, 2];
              $dist = array_fill(0, $n * $n, -1);
              $dist[$sr * $n + $sc] = 0;
              $q = [$sr * $n + $sc];
              for ($h = 0; $h < count($q); $h++) {
                  $cur = $q[$h];
                  $r = intdiv($cur, $n); $c = $cur % $n;
                  for ($k = 0; $k < 8; $k++) {
                      $nr = $r + $dr[$k]; $nc = $c + $dc[$k];
                      if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n || $dist[$nr * $n + $nc] != -1) continue;
                      if ($nr == $tr && $nc == $tc) return $dist[$cur] + 1;
                      $dist[$nr * $n + $nc] = $dist[$cur] + 1;
                      $q[] = $nr * $n + $nc;
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minStepToReachTarget(knightPos, targetPos, n)
            sr, sc = knightPos[0] - 1, knightPos[1] - 1
            tr, tc = targetPos[0] - 1, targetPos[1] - 1
            return 0 if sr == tr && sc == tc
            moves = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
            dist = Array.new(n * n, -1)
            dist[sr * n + sc] = 0
            q = [sr * n + sc]
            h = 0
            while h < q.length
              cur = q[h]
              h += 1
              r, c = cur.divmod(n)
              moves.each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next if nr < 0 || nc < 0 || nr >= n || nc >= n || dist[nr * n + nc] != -1
                return dist[cur] + 1 if nr == tr && nc == tc
                dist[nr * n + nc] = dist[cur] + 1
                q << nr * n + nc
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Water Connection Problem (GFG) ──────────────────────────────
  (() => {
    const ref = (n: number, a: number[], b: number[], d: number[]) => {
      const out = new Map<number, [number, number]>();
      const hasIn = new Set<number>();
      for (let i = 0; i < a.length; i++) { out.set(a[i], [b[i], d[i]]); hasIn.add(b[i]); }
      const res: number[][] = [];
      for (let h = 1; h <= n; h++) {
        if (!out.has(h) || hasIn.has(h)) continue;
        let cur = h, best = Infinity;
        while (out.has(cur)) { const [nx, w] = out.get(cur)!; best = Math.min(best, w); cur = nx; }
        res.push([h, cur, best]);
      }
      return res;
    };
    return {
      slug: "water-connection-problem",
      title: "Water Connection Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Depth-First Search", "Microsoft", "Flipkart"],
      signature: {
        funcName: "solve",
        params: [
          { name: "n", type: "int" as const }, { name: "p", type: "int" as const },
          { name: "a", type: "int[]" as const }, { name: "b", type: "int[]" as const }, { name: "d", type: "int[]" as const },
        ],
        returns: "int[][]" as const,
      },
      description: describe(
        "A colony has `n` houses numbered `1` to `n` and `p` water pipes. Pipe `i` carries water **from** house `a[i]` **to** house `b[i]` and has diameter `d[i]`. Every house has at most one outgoing pipe and at most one incoming pipe.\n\n- A house with an outgoing pipe but no incoming pipe gets a **tank** on its roof.\n- A house with an incoming pipe but no outgoing pipe gets a **tap**.\n\nWater from each tank flows along the chain of pipes until it reaches a tap. The chain can only carry as much as its **narrowest** pipe allows.\n\nReturn one triple `[tank, tap, diameter]` for every tank — the tank's house, the tap its chain ends at, and the smallest diameter along the chain — **sorted by the tank's house number**. Houses on a closed loop of pipes have neither a tank nor a tap and are ignored.",
        [
          { in: "n = 9, p = 6, a = [7,5,4,2,9,3], b = [4,9,6,8,7,1], d = [98,72,10,22,17,66]", out: "[[2,8,22],[3,1,66],[5,6,10]]", note: "Tank 5 feeds 5 → 9 → 7 → 4 → 6 through diameters 72, 17, 98, 10, so the chain carries 10." },
          { in: "n = 4, p = 2, a = [1,3], b = [2,4], d = [60,50]", out: "[[1,2,60],[3,4,50]]" },
          { in: "n = 3, p = 3, a = [1,2,3], b = [2,3,1], d = [5,6,7]", out: "[]", note: "The pipes form a loop: no house is a tank." },
        ],
        ["1 <= n <= 20", "1 <= p <= n", "a.length == b.length == d.length == p", "1 <= a[i], b[i] <= n, a[i] != b[i]", "1 <= d[i] <= 100", "each house has at most one outgoing and at most one incoming pipe"]),
      hints: [
        "With at most one pipe in and one pipe out per house, the pipes split into simple chains and closed loops.",
        "A chain starts exactly at a house that has an outgoing pipe and no incoming one — that is the tank.",
        "Store `next[house]` and `diameter[house]`, then from each tank follow `next` until it runs out, keeping the minimum diameter. Scanning tanks in increasing house order gives the required sort for free.",
      ],
      editorial: explain({
        idea: "Each house has out-degree and in-degree at most one, so the pipe network is a set of disjoint paths and cycles. Each path runs from a tank to a tap, and its capacity is its minimum pipe diameter.",
        steps: [
          "For every pipe `i`, set `next[a[i]] = b[i]`, `diam[a[i]] = d[i]` and mark `b[i]` as having an incoming pipe.",
          "For each house `h` from `1` to `n`: if it has an outgoing pipe and no incoming pipe, it is a tank.",
          "From a tank, follow `next` until reaching a house with no outgoing pipe (the tap), tracking the minimum `diam` seen.",
          "Append `[h, tap, minimum]`; the loop over `h` already produces the triples in tank order.",
        ],
        why: "A walk from a tank can never revisit a house: a repeat would need some house with two incoming pipes. So it ends at a house with no outgoing pipe, which has an incoming one — a tap. Houses on a cycle all have an incoming pipe, so none is a tank and the cycle is never entered.",
        time: "O(n + p)",
        space: "O(n)",
        pitfalls: [
          "Only start from houses with **no** incoming pipe; starting from every house with an outgoing pipe would report partial chains and loop forever on cycles.",
          "The answer is the minimum diameter on the chain, not the first or last pipe's.",
          "Houses are numbered from 1 — size arrays as `n + 1`.",
        ],
      }),
      examples: [
        { input: "9\n6\n[7,5,4,2,9,3]\n[4,9,6,8,7,1]\n[98,72,10,22,17,66]", expectedOutput: "[[2,8,22],[3,1,66],[5,6,10]]" },
        { input: "4\n2\n[1,3]\n[2,4]\n[60,50]", expectedOutput: "[[1,2,60],[3,4,50]]" },
        { input: "3\n3\n[1,2,3]\n[2,3,1]\n[5,6,7]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 8, 14, 20]));
        const houses = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const pipes: number[][] = [];
        const dmax = pick(rng, [3, 20, 100]);
        let i = 0;
        while (i < n) {
          const len = Math.min(n - i, ri(rng, 1, 6));
          const seg = houses.slice(i, i + len);
          i += len;
          if (len === 1) continue;
          for (let k = 0; k + 1 < len; k++) pipes.push([seg[k], seg[k + 1], ri(rng, 1, dmax)]);
          if (rng() < 0.2) pipes.push([seg[len - 1], seg[0], ri(rng, 1, dmax)]);
        }
        if (pipes.length === 0) pipes.push([houses[0], houses[1], ri(rng, 1, dmax)]);
        shuffle(rng, pipes);
        const a = pipes.map((q) => q[0]), b = pipes.map((q) => q[1]), d = pipes.map((q) => q[2]);
        return {
          input: `${n}\n${pipes.length}\n${fmtIntArr(a)}\n${fmtIntArr(b)}\n${fmtIntArr(d)}`,
          expectedOutput: fmtIntMat(ref(n, a, b, d)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def solve(n: int, p: int, a: List[int], b: List[int], d: List[int]) -> List[List[int]]:
              nxt = [0] * (n + 1)
              diam = [0] * (n + 1)
              has_in = [False] * (n + 1)
              for i in range(p):
                  nxt[a[i]] = b[i]
                  diam[a[i]] = d[i]
                  has_in[b[i]] = True
              res = []
              for h in range(1, n + 1):
                  if nxt[h] == 0 or has_in[h]:
                      continue
                  cur, best = h, 101
                  while nxt[cur] != 0:
                      best = min(best, diam[cur])
                      cur = nxt[cur]
                  res.append([h, cur, best])
              return res
        `,
        javascript: code`
          var solve = function(n, p, a, b, d) {
              var nxt = [], diam = [], hasIn = [];
              for (var i = 0; i <= n; i++) { nxt.push(0); diam.push(0); hasIn.push(false); }
              for (var k = 0; k < p; k++) { nxt[a[k]] = b[k]; diam[a[k]] = d[k]; hasIn[b[k]] = true; }
              var res = [];
              for (var h = 1; h <= n; h++) {
                  if (nxt[h] === 0 || hasIn[h]) continue;
                  var cur = h, best = 101;
                  while (nxt[cur] !== 0) { best = Math.min(best, diam[cur]); cur = nxt[cur]; }
                  res.push([h, cur, best]);
              }
              return res;
          };
        `,
        typescript: code`
          function solve(n: number, p: number, a: number[], b: number[], d: number[]): number[][] {
              var nxt: number[] = [], diam: number[] = [], hasIn: boolean[] = [];
              for (var i = 0; i <= n; i++) { nxt.push(0); diam.push(0); hasIn.push(false); }
              for (var k = 0; k < p; k++) { nxt[a[k]] = b[k]; diam[a[k]] = d[k]; hasIn[b[k]] = true; }
              var res: number[][] = [];
              for (var h = 1; h <= n; h++) {
                  if (nxt[h] === 0 || hasIn[h]) continue;
                  var cur = h, best = 101;
                  while (nxt[cur] !== 0) { best = Math.min(best, diam[cur]); cur = nxt[cur]; }
                  res.push([h, cur, best]);
              }
              return res;
          }
        `,
        java: code`
          public static int[][] solve(int n, int p, int[] a, int[] b, int[] d) {
              int[] nxt = new int[n + 1], diam = new int[n + 1];
              boolean[] hasIn = new boolean[n + 1];
              for (int i = 0; i < p; i++) { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = true; }
              List<int[]> res = new ArrayList<>();
              for (int h = 1; h <= n; h++) {
                  if (nxt[h] == 0 || hasIn[h]) continue;
                  int cur = h, best = 101;
                  while (nxt[cur] != 0) { best = Math.min(best, diam[cur]); cur = nxt[cur]; }
                  res.add(new int[]{h, cur, best});
              }
              return res.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> solve(int n, int p, vector<int>& a, vector<int>& b, vector<int>& d) {
              vector<int> nxt(n + 1, 0), diam(n + 1, 0);
              vector<bool> hasIn(n + 1, false);
              for (int i = 0; i < p; i++) { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = true; }
              vector<vector<int>> res;
              for (int h = 1; h <= n; h++) {
                  if (nxt[h] == 0 || hasIn[h]) continue;
                  int cur = h, best = 101;
                  while (nxt[cur] != 0) { best = min(best, diam[cur]); cur = nxt[cur]; }
                  res.push_back({h, cur, best});
              }
              return res;
          }
        `,
        c: code`
          int** solve(int n, int p, int* a, int aSize, int* b, int bSize, int* d, int dSize, int* returnSize, int** returnColumnSizes) {
              int* nxt = (int*)calloc(n + 1, sizeof(int));
              int* diam = (int*)calloc(n + 1, sizeof(int));
              int* hasIn = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < p; i++) { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = 1; }
              int** res = (int**)malloc((n + 1) * sizeof(int*));
              *returnColumnSizes = (int*)malloc((n + 1) * sizeof(int));
              int cnt = 0;
              for (int h = 1; h <= n; h++) {
                  if (nxt[h] == 0 || hasIn[h]) continue;
                  int cur = h, best = 101;
                  while (nxt[cur] != 0) { if (diam[cur] < best) best = diam[cur]; cur = nxt[cur]; }
                  res[cnt] = (int*)malloc(3 * sizeof(int));
                  res[cnt][0] = h; res[cnt][1] = cur; res[cnt][2] = best;
                  (*returnColumnSizes)[cnt] = 3;
                  cnt++;
              }
              free(nxt); free(diam); free(hasIn);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static int[][] Solve(int n, int p, int[] a, int[] b, int[] d)
          {
              int[] nxt = new int[n + 1], diam = new int[n + 1];
              bool[] hasIn = new bool[n + 1];
              for (int i = 0; i < p; i++) { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = true; }
              var res = new List<int[]>();
              for (int h = 1; h <= n; h++)
              {
                  if (nxt[h] == 0 || hasIn[h]) continue;
                  int cur = h, best = 101;
                  while (nxt[cur] != 0) { best = Math.Min(best, diam[cur]); cur = nxt[cur]; }
                  res.Add(new int[] { h, cur, best });
              }
              return res.ToArray();
          }
        `,
        go: code`
          func solve(n int, p int, a []int, b []int, d []int) [][]int {
              nxt := make([]int, n+1)
              diam := make([]int, n+1)
              hasIn := make([]bool, n+1)
              for i := 0; i < p; i++ {
                  nxt[a[i]] = b[i]
                  diam[a[i]] = d[i]
                  hasIn[b[i]] = true
              }
              res := [][]int{}
              for h := 1; h <= n; h++ {
                  if nxt[h] == 0 || hasIn[h] {
                      continue
                  }
                  cur, best := h, 101
                  for nxt[cur] != 0 {
                      if diam[cur] < best {
                          best = diam[cur]
                      }
                      cur = nxt[cur]
                  }
                  res = append(res, []int{h, cur, best})
              }
              return res
          }
        `,
        kotlin: code`
          fun solve(n: Int, p: Int, a: IntArray, b: IntArray, d: IntArray): Array<IntArray> {
              val nxt = IntArray(n + 1)
              val diam = IntArray(n + 1)
              val hasIn = BooleanArray(n + 1)
              for (i in 0 until p) { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = true }
              val res = ArrayList<IntArray>()
              for (h in 1..n) {
                  if (nxt[h] == 0 || hasIn[h]) continue
                  var cur = h
                  var best = 101
                  while (nxt[cur] != 0) { best = minOf(best, diam[cur]); cur = nxt[cur] }
                  res.add(intArrayOf(h, cur, best))
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func solve(_ n: Int, _ p: Int, _ a: [Int], _ b: [Int], _ d: [Int]) -> [[Int]] {
              var nxt = [Int](repeating: 0, count: n + 1)
              var diam = [Int](repeating: 0, count: n + 1)
              var hasIn = [Bool](repeating: false, count: n + 1)
              for i in 0..<p { nxt[a[i]] = b[i]; diam[a[i]] = d[i]; hasIn[b[i]] = true }
              var res = [[Int]]()
              for h in 1...n {
                  if nxt[h] == 0 || hasIn[h] { continue }
                  var cur = h, best = 101
                  while nxt[cur] != 0 { best = min(best, diam[cur]); cur = nxt[cur] }
                  res.append([h, cur, best])
              }
              return res
          }
        `,
        rust: code`
          fn solve(n: i32, p: i32, a: Vec<i32>, b: Vec<i32>, d: Vec<i32>) -> Vec<Vec<i32>> {
              let n = n as usize;
              let mut nxt = vec![0usize; n + 1];
              let mut diam = vec![0i32; n + 1];
              let mut has_in = vec![false; n + 1];
              for i in 0..p as usize {
                  nxt[a[i] as usize] = b[i] as usize;
                  diam[a[i] as usize] = d[i];
                  has_in[b[i] as usize] = true;
              }
              let mut res = Vec::new();
              for h in 1..=n {
                  if nxt[h] == 0 || has_in[h] {
                      continue;
                  }
                  let mut cur = h;
                  let mut best = 101i32;
                  while nxt[cur] != 0 {
                      best = best.min(diam[cur]);
                      cur = nxt[cur];
                  }
                  res.push(vec![h as i32, cur as i32, best]);
              }
              res
          }
        `,
        php: code`
          function solve($n, $p, $a, $b, $d) {
              $nxt = array_fill(0, $n + 1, 0);
              $diam = array_fill(0, $n + 1, 0);
              $hasIn = array_fill(0, $n + 1, false);
              for ($i = 0; $i < $p; $i++) { $nxt[$a[$i]] = $b[$i]; $diam[$a[$i]] = $d[$i]; $hasIn[$b[$i]] = true; }
              $res = [];
              for ($h = 1; $h <= $n; $h++) {
                  if ($nxt[$h] == 0 || $hasIn[$h]) continue;
                  $cur = $h;
                  $best = 101;
                  while ($nxt[$cur] != 0) { $best = min($best, $diam[$cur]); $cur = $nxt[$cur]; }
                  $res[] = [$h, $cur, $best];
              }
              return $res;
          }
        `,
        ruby: code`
          def solve(n, p, a, b, d)
            nxt = Array.new(n + 1, 0)
            diam = Array.new(n + 1, 0)
            has_in = Array.new(n + 1, false)
            p.times do |i|
              nxt[a[i]] = b[i]
              diam[a[i]] = d[i]
              has_in[b[i]] = true
            end
            res = []
            (1..n).each do |h|
              next if nxt[h] == 0 || has_in[h]
              cur = h
              best = 101
              while nxt[cur] != 0
                best = diam[cur] if diam[cur] < best
                cur = nxt[cur]
              end
              res << [h, cur, best]
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Cut Off Trees for Golf Event (LC 675) ───────────────────────
  (() => {
    const ref = (forest: number[][]) => {
      const m = forest.length, n = forest[0].length;
      const trees: number[][] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (forest[r][c] > 1) trees.push([forest[r][c], r, c]);
      trees.sort((x, y) => x[0] - y[0]);
      const dist = (sr: number, sc: number, tr: number, tc: number) => {
        const d: number[][] = Array.from({ length: m }, () => new Array(n).fill(-1));
        d[sr][sc] = 0;
        const q = [[sr, sc]];
        for (let h = 0; h < q.length; h++) {
          const [r, c] = q[h];
          for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
            if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] === 0 || d[nr][nc] !== -1) continue;
            d[nr][nc] = d[r][c] + 1;
            q.push([nr, nc]);
          }
        }
        return d[tr][tc];
      };
      let r = 0, c = 0, total = 0;
      for (const [, tr, tc] of trees) {
        const d = dist(r, c, tr, tc);
        if (d < 0) return -1;
        total += d; r = tr; c = tc;
      }
      return total;
    };
    return {
      slug: "cut-off-trees-for-golf-event",
      title: "Cut Off Trees for Golf Event",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Heap (Priority Queue)", "Matrix", "Amazon", "Google"],
      signature: { funcName: "cutOffTree", params: [{ name: "forest", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A forest is given as an `m x n` matrix `forest`:\n\n- `0` is an obstacle that cannot be walked through,\n- `1` is open ground,\n- a number greater than `1` is a tree of that height; it can be walked through too.\n\nYou start at cell `(0, 0)` and each step moves one cell up, down, left or right. You must cut down **every** tree, in order from the **shortest to the tallest**. Cutting a tree turns its cell into open ground (`1`). All tree heights are distinct.\n\nReturn the minimum number of steps needed to cut all the trees, or `-1` if some tree cannot be reached.",
        [
          { in: "forest = [[1,2,3],[0,0,4],[7,6,5]]", out: "6", note: "The trees 2, 3, 4, 5, 6, 7 lie along one path from the start, one step apart." },
          { in: "forest = [[1,2,3],[0,0,0],[7,6,5]]", out: "-1", note: "The middle row is a wall: trees 5, 6 and 7 are out of reach." },
          { in: "forest = [[2,3,4],[0,0,5],[8,7,6]]", out: "6", note: "Tree 2 stands on the start cell, so it is cut without moving." },
        ],
        ["m == forest.length", "n == forest[i].length", "1 <= m, n <= 50", "0 <= forest[i][j] <= 10^9", "forest[0][0] != 0", "all heights greater than 1 are distinct"]),
      hints: [
        "The order of the cuts is fixed: sort the trees by height. The total is the sum of the walking distances between consecutive targets, starting from `(0, 0)`.",
        "Walking from one target to the next is an independent shortest-path question on a grid whose obstacles never change (a cut tree still lets you pass).",
        "Run a BFS for each leg. If any leg's target is unreachable, the answer is `-1`.",
      ],
      editorial: explain({
        idea: "Since the trees must be cut in height order and cutting never changes which cells are walkable, the problem splits into independent legs: from the start to the shortest tree, from there to the next, and so on. Each leg is a breadth-first search.",
        steps: [
          "Collect every cell with value `> 1` as `(height, row, col)` and sort by height.",
          "Set the current position to `(0, 0)` and the total to `0`.",
          "For each tree in order, BFS from the current position to the tree over cells that are not `0`. If it is unreachable, return `-1`; otherwise add the distance and move to the tree.",
          "Return the total.",
        ],
        why: "Every cell except an obstacle is walkable before and after its tree is cut, so the grid's walkable set is fixed. The cost of a leg therefore depends only on its two endpoints, and the minimum total is the sum of the minimum legs. BFS gives the exact shortest leg on an unweighted grid.",
        time: "O(T · m · n) for T trees — at most O((m · n)^2)",
        space: "O(m · n)",
        pitfalls: [
          "A tree on `(0, 0)` costs zero steps — the first leg can have length 0.",
          "Trees are not obstacles: you may walk across taller trees on the way to a shorter one.",
          "Reset the visited marks for every BFS.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[0,0,4],[7,6,5]]", expectedOutput: "6" },
        { input: "[[1,2,3],[0,0,0],[7,6,5]]", expectedOutput: "-1" },
        { input: "[[2,3,4],[0,0,5],[8,7,6]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 6, 7]));
        const n = ri(rng, 1, pick(rng, [2, 4, 6, 7]));
        const p0 = pick(rng, [0, 0.15, 0.3]);
        const pt = pick(rng, [0.15, 0.4, 0.8]);
        const big = rng() < 0.4;
        const used = new Set<number>();
        const height = () => {
          for (;;) {
            const h = big ? ri(rng, 2, 1000000000) : ri(rng, 2, 60);
            if (!used.has(h)) { used.add(h); return h; }
          }
        };
        const forest = Array.from({ length: m }, () => Array.from({ length: n }, (): number => (rng() < p0 ? 0 : rng() < pt ? -1 : 1)));
        if (forest[0][0] === 0) forest[0][0] = 1;
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (forest[r][c] === -1) forest[r][c] = height();
        return { input: fmtIntMat(forest), expectedOutput: String(ref(forest)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def cutOffTree(forest: List[List[int]]) -> int:
              m, n = len(forest), len(forest[0])
              trees = sorted((forest[r][c], r, c) for r in range(m) for c in range(n) if forest[r][c] > 1)

              def bfs(sr, sc, tr, tc):
                  if sr == tr and sc == tc:
                      return 0
                  seen = [[False] * n for _ in range(m)]
                  seen[sr][sc] = True
                  q = deque([(sr, sc, 0)])
                  while q:
                      r, c, d = q.popleft()
                      for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                          if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc] and forest[nr][nc] != 0:
                              if nr == tr and nc == tc:
                                  return d + 1
                              seen[nr][nc] = True
                              q.append((nr, nc, d + 1))
                  return -1

              total, r, c = 0, 0, 0
              for _, tr, tc in trees:
                  d = bfs(r, c, tr, tc)
                  if d < 0:
                      return -1
                  total += d
                  r, c = tr, tc
              return total
        `,
        javascript: code`
          var cutOffTree = function(forest) {
              var m = forest.length, n = forest[0].length;
              var trees = [];
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) if (forest[r][c] > 1) trees.push([forest[r][c], r, c]);
              trees.sort(function(x, y) { return x[0] - y[0]; });
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var bfs = function(s, t) {
                  if (s === t) return 0;
                  var dist = new Array(m * n);
                  for (var i = 0; i < m * n; i++) dist[i] = -1;
                  dist[s] = 0;
                  var q = [s];
                  for (var h = 0; h < q.length; h++) {
                      var cr = Math.floor(q[h] / n), cc = q[h] % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = cr + dr[k], nc = cc + dc[k];
                          if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] === 0) continue;
                          var x = nr * n + nc;
                          if (dist[x] !== -1) continue;
                          dist[x] = dist[q[h]] + 1;
                          if (x === t) return dist[x];
                          q.push(x);
                      }
                  }
                  return -1;
              };
              var total = 0, pos = 0;
              for (var j = 0; j < trees.length; j++) {
                  var target = trees[j][1] * n + trees[j][2];
                  var d = bfs(pos, target);
                  if (d < 0) return -1;
                  total += d;
                  pos = target;
              }
              return total;
          };
        `,
        typescript: code`
          function cutOffTree(forest: number[][]): number {
              var m = forest.length, n = forest[0].length;
              var trees: number[][] = [];
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) if (forest[r][c] > 1) trees.push([forest[r][c], r, c]);
              trees.sort(function(x, y) { return x[0] - y[0]; });
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              function bfs(s: number, t: number): number {
                  if (s === t) return 0;
                  var dist: number[] = new Array(m * n);
                  for (var i = 0; i < m * n; i++) dist[i] = -1;
                  dist[s] = 0;
                  var q: number[] = [s];
                  for (var h = 0; h < q.length; h++) {
                      var cr = Math.floor(q[h] / n), cc = q[h] % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = cr + dr[k], nc = cc + dc[k];
                          if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] === 0) continue;
                          var x = nr * n + nc;
                          if (dist[x] !== -1) continue;
                          dist[x] = dist[q[h]] + 1;
                          if (x === t) return dist[x];
                          q.push(x);
                      }
                  }
                  return -1;
              }
              var total = 0, pos = 0;
              for (var j = 0; j < trees.length; j++) {
                  var target = trees[j][1] * n + trees[j][2];
                  var d = bfs(pos, target);
                  if (d < 0) return -1;
                  total += d;
                  pos = target;
              }
              return total;
          }
        `,
        java: code`
          public static int cutOffTree(int[][] forest) {
              int m = forest.length, n = forest[0].length;
              List<int[]> trees = new ArrayList<>();
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (forest[r][c] > 1) trees.add(new int[]{forest[r][c], r * n + c});
              trees.sort((x, y) -> Integer.compare(x[0], y[0]));
              int total = 0, pos = 0;
              for (int[] t : trees) {
                  int d = cotBfs(forest, m, n, pos, t[1]);
                  if (d < 0) return -1;
                  total += d;
                  pos = t[1];
              }
              return total;
          }

          static int cotBfs(int[][] forest, int m, int n, int s, int t) {
              if (s == t) return 0;
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              int[] dist = new int[m * n];
              Arrays.fill(dist, -1);
              int[] q = new int[m * n];
              int head = 0, tail = 0;
              dist[s] = 0;
              q[tail++] = s;
              while (head < tail) {
                  int cur = q[head++], r = cur / n, c = cur % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0) continue;
                      int x = nr * n + nc;
                      if (dist[x] != -1) continue;
                      dist[x] = dist[cur] + 1;
                      if (x == t) return dist[x];
                      q[tail++] = x;
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          static int cotBfs(vector<vector<int>>& forest, int m, int n, int s, int t) {
              if (s == t) return 0;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              vector<int> dist(m * n, -1);
              queue<int> q;
              dist[s] = 0;
              q.push(s);
              while (!q.empty()) {
                  int cur = q.front(); q.pop();
                  int r = cur / n, c = cur % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0) continue;
                      int x = nr * n + nc;
                      if (dist[x] != -1) continue;
                      dist[x] = dist[cur] + 1;
                      if (x == t) return dist[x];
                      q.push(x);
                  }
              }
              return -1;
          }

          int cutOffTree(vector<vector<int>>& forest) {
              int m = forest.size(), n = forest[0].size();
              vector<pair<int, int>> trees;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (forest[r][c] > 1) trees.push_back({forest[r][c], r * n + c});
              sort(trees.begin(), trees.end());
              int total = 0, pos = 0;
              for (auto& t : trees) {
                  int d = cotBfs(forest, m, n, pos, t.second);
                  if (d < 0) return -1;
                  total += d;
                  pos = t.second;
              }
              return total;
          }
        `,
        c: code`
          typedef struct { int h, cell; } CotTree;

          static int cotCmp(const void* a, const void* b) {
              int x = ((const CotTree*)a)->h, y = ((const CotTree*)b)->h;
              return (x > y) - (x < y);
          }

          static int cotBfs(int** forest, int m, int n, int s, int t, int* dist, int* q) {
              if (s == t) return 0;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              for (int i = 0; i < m * n; i++) dist[i] = -1;
              int head = 0, tail = 0;
              dist[s] = 0;
              q[tail++] = s;
              while (head < tail) {
                  int cur = q[head++], r = cur / n, c = cur % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0) continue;
                      int x = nr * n + nc;
                      if (dist[x] != -1) continue;
                      dist[x] = dist[cur] + 1;
                      if (x == t) return dist[x];
                      q[tail++] = x;
                  }
              }
              return -1;
          }

          int cutOffTree(int** forest, int forestSize, int* forestColSize) {
              int m = forestSize, n = forestColSize[0];
              CotTree* trees = (CotTree*)malloc(m * n * sizeof(CotTree));
              int cnt = 0;
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                      if (forest[r][c] > 1) { trees[cnt].h = forest[r][c]; trees[cnt].cell = r * n + c; cnt++; }
              qsort(trees, cnt, sizeof(CotTree), cotCmp);
              int* dist = (int*)malloc(m * n * sizeof(int));
              int* q = (int*)malloc(m * n * sizeof(int));
              int total = 0, pos = 0;
              for (int i = 0; i < cnt; i++) {
                  int d = cotBfs(forest, m, n, pos, trees[i].cell, dist, q);
                  if (d < 0) { total = -1; break; }
                  total += d;
                  pos = trees[i].cell;
              }
              free(trees); free(dist); free(q);
              return total;
          }
        `,
        csharp: code`
          public static int CutOffTree(int[][] forest)
          {
              int m = forest.Length, n = forest[0].Length;
              var trees = new List<int[]>();
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (forest[r][c] > 1) trees.Add(new int[] { forest[r][c], r * n + c });
              trees.Sort((x, y) => x[0].CompareTo(y[0]));
              int total = 0, pos = 0;
              foreach (var t in trees)
              {
                  int d = CotBfs(forest, m, n, pos, t[1]);
                  if (d < 0) return -1;
                  total += d;
                  pos = t[1];
              }
              return total;
          }

          static int CotBfs(int[][] forest, int m, int n, int s, int t)
          {
              if (s == t) return 0;
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              var dist = new int[m * n];
              for (int i = 0; i < m * n; i++) dist[i] = -1;
              var q = new Queue<int>();
              dist[s] = 0;
              q.Enqueue(s);
              while (q.Count > 0)
              {
                  int cur = q.Dequeue(), r = cur / n, c = cur % n;
                  for (int k = 0; k < 4; k++)
                  {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0) continue;
                      int x = nr * n + nc;
                      if (dist[x] != -1) continue;
                      dist[x] = dist[cur] + 1;
                      if (x == t) return dist[x];
                      q.Enqueue(x);
                  }
              }
              return -1;
          }
        `,
        go: code`
          func cutOffTree(forest [][]int) int {
              m, n := len(forest), len(forest[0])
              trees := [][2]int{}
              for r := 0; r < m; r++ {
                  for c := 0; c < n; c++ {
                      if forest[r][c] > 1 {
                          trees = append(trees, [2]int{forest[r][c], r*n + c})
                      }
                  }
              }
              sort.Slice(trees, func(a, b int) bool { return trees[a][0] < trees[b][0] })
              dr := []int{1, -1, 0, 0}
              dc := []int{0, 0, 1, -1}
              bfs := func(s, t int) int {
                  if s == t {
                      return 0
                  }
                  dist := make([]int, m*n)
                  for i := range dist {
                      dist[i] = -1
                  }
                  dist[s] = 0
                  q := []int{s}
                  for h := 0; h < len(q); h++ {
                      cur := q[h]
                      r, c := cur/n, cur%n
                      for k := 0; k < 4; k++ {
                          nr, nc := r+dr[k], c+dc[k]
                          if nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0 {
                              continue
                          }
                          x := nr*n + nc
                          if dist[x] != -1 {
                              continue
                          }
                          dist[x] = dist[cur] + 1
                          if x == t {
                              return dist[x]
                          }
                          q = append(q, x)
                      }
                  }
                  return -1
              }
              total, pos := 0, 0
              for _, t := range trees {
                  d := bfs(pos, t[1])
                  if d < 0 {
                      return -1
                  }
                  total += d
                  pos = t[1]
              }
              return total
          }
        `,
        kotlin: code`
          fun cutOffTree(forest: Array<IntArray>): Int {
              val m = forest.size
              val n = forest[0].size
              val trees = ArrayList<IntArray>()
              for (r in 0 until m) for (c in 0 until n) if (forest[r][c] > 1) trees.add(intArrayOf(forest[r][c], r * n + c))
              trees.sortBy { it[0] }
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              fun bfs(s: Int, t: Int): Int {
                  if (s == t) return 0
                  val dist = IntArray(m * n) { -1 }
                  val q = IntArray(m * n)
                  var head = 0
                  var tail = 0
                  dist[s] = 0
                  q[tail++] = s
                  while (head < tail) {
                      val cur = q[head++]
                      val r = cur / n
                      val c = cur % n
                      for (k in 0 until 4) {
                          val nr = r + dr[k]
                          val nc = c + dc[k]
                          if (nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0) continue
                          val x = nr * n + nc
                          if (dist[x] != -1) continue
                          dist[x] = dist[cur] + 1
                          if (x == t) return dist[x]
                          q[tail++] = x
                      }
                  }
                  return -1
              }
              var total = 0
              var pos = 0
              for (t in trees) {
                  val d = bfs(pos, t[1])
                  if (d < 0) return -1
                  total += d
                  pos = t[1]
              }
              return total
          }
        `,
        swift: code`
          func cutOffTree(_ forest: [[Int]]) -> Int {
              let m = forest.count, n = forest[0].count
              var trees = [(Int, Int)]()
              for r in 0..<m { for c in 0..<n where forest[r][c] > 1 { trees.append((forest[r][c], r * n + c)) } }
              trees.sort { $0.0 < $1.0 }
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              func bfs(_ s: Int, _ t: Int) -> Int {
                  if s == t { return 0 }
                  var dist = [Int](repeating: -1, count: m * n)
                  dist[s] = 0
                  var q = [s]
                  var h = 0
                  while h < q.count {
                      let cur = q[h]
                      h += 1
                      let r = cur / n, c = cur % n
                      for k in 0..<4 {
                          let nr = r + dr[k], nc = c + dc[k]
                          if nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0 { continue }
                          let x = nr * n + nc
                          if dist[x] != -1 { continue }
                          dist[x] = dist[cur] + 1
                          if x == t { return dist[x] }
                          q.append(x)
                      }
                  }
                  return -1
              }
              var total = 0, pos = 0
              for t in trees {
                  let d = bfs(pos, t.1)
                  if d < 0 { return -1 }
                  total += d
                  pos = t.1
              }
              return total
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn cot_bfs(forest: &Vec<Vec<i32>>, m: usize, n: usize, s: usize, t: usize) -> i32 {
              if s == t {
                  return 0;
              }
              let mut dist = vec![-1i32; m * n];
              dist[s] = 0;
              let mut q = VecDeque::new();
              q.push_back(s);
              while let Some(cur) = q.pop_front() {
                  let (r, c) = ((cur / n) as i32, (cur % n) as i32);
                  for &(dr, dc) in [(1, 0), (-1, 0), (0, 1), (0, -1)].iter() {
                      let (nr, nc) = (r + dr, c + dc);
                      if nr < 0 || nc < 0 || nr >= m as i32 || nc >= n as i32 || forest[nr as usize][nc as usize] == 0 {
                          continue;
                      }
                      let x = nr as usize * n + nc as usize;
                      if dist[x] != -1 {
                          continue;
                      }
                      dist[x] = dist[cur] + 1;
                      if x == t {
                          return dist[x];
                      }
                      q.push_back(x);
                  }
              }
              -1
          }

          fn cutOffTree(forest: Vec<Vec<i32>>) -> i32 {
              let (m, n) = (forest.len(), forest[0].len());
              let mut trees: Vec<(i32, usize)> = Vec::new();
              for r in 0..m {
                  for c in 0..n {
                      if forest[r][c] > 1 {
                          trees.push((forest[r][c], r * n + c));
                      }
                  }
              }
              trees.sort();
              let mut total = 0;
              let mut pos = 0usize;
              for &(_, cell) in trees.iter() {
                  let d = cot_bfs(&forest, m, n, pos, cell);
                  if d < 0 {
                      return -1;
                  }
                  total += d;
                  pos = cell;
              }
              total
          }
        `,
        php: code`
          function cutOffTree($forest) {
              $m = count($forest);
              $n = count($forest[0]);
              $trees = [];
              for ($r = 0; $r < $m; $r++)
                  for ($c = 0; $c < $n; $c++)
                      if ($forest[$r][$c] > 1) $trees[] = [$forest[$r][$c], $r * $n + $c];
              usort($trees, function ($x, $y) { return $x[0] <=> $y[0]; });
              $total = 0;
              $pos = 0;
              foreach ($trees as $t) {
                  $d = cotBfs($forest, $m, $n, $pos, $t[1]);
                  if ($d < 0) return -1;
                  $total += $d;
                  $pos = $t[1];
              }
              return $total;
          }

          function cotBfs(&$forest, $m, $n, $s, $t) {
              if ($s == $t) return 0;
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $dist = array_fill(0, $m * $n, -1);
              $dist[$s] = 0;
              $q = [$s];
              for ($h = 0; $h < count($q); $h++) {
                  $cur = $q[$h];
                  $r = intdiv($cur, $n);
                  $c = $cur % $n;
                  for ($k = 0; $k < 4; $k++) {
                      $nr = $r + $dr[$k];
                      $nc = $c + $dc[$k];
                      if ($nr < 0 || $nc < 0 || $nr >= $m || $nc >= $n || $forest[$nr][$nc] == 0) continue;
                      $x = $nr * $n + $nc;
                      if ($dist[$x] != -1) continue;
                      $dist[$x] = $dist[$cur] + 1;
                      if ($x == $t) return $dist[$x];
                      $q[] = $x;
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def cot_bfs(forest, m, n, s, t)
            return 0 if s == t
            dist = Array.new(m * n, -1)
            dist[s] = 0
            q = [s]
            h = 0
            while h < q.length
              cur = q[h]
              h += 1
              r, c = cur.divmod(n)
              [[1, 0], [-1, 0], [0, 1], [0, -1]].each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next if nr < 0 || nc < 0 || nr >= m || nc >= n || forest[nr][nc] == 0
                x = nr * n + nc
                next if dist[x] != -1
                dist[x] = dist[cur] + 1
                return dist[x] if x == t
                q << x
              end
            end
            -1
          end

          def cutOffTree(forest)
            m = forest.length
            n = forest[0].length
            trees = []
            m.times { |r| n.times { |c| trees << [forest[r][c], r * n + c] if forest[r][c] > 1 } }
            trees.sort!
            total = 0
            pos = 0
            trees.each do |_, cell|
              d = cot_bfs(forest, m, n, pos, cell)
              return -1 if d < 0
              total += d
              pos = cell
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Contain Virus (LC 749) ──────────────────────────────────────
  (() => {
    /** Simulates the nights; null when two regions tie for the most threatened cells (the problem rules ties out). */
    const ref = (grid: number[][]): number | null => {
      const m = grid.length, n = grid[0].length;
      const g = grid.map((r) => r.slice());
      let total = 0;
      for (;;) {
        const seen = g.map((r) => r.map(() => false));
        const regions: { cells: number[][]; front: Set<string>; walls: number }[] = [];
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
          if (g[i][j] !== 1 || seen[i][j]) continue;
          const reg = { cells: [] as number[][], front: new Set<string>(), walls: 0 };
          seen[i][j] = true;
          const st = [[i, j]];
          while (st.length) {
            const [r, c] = st.pop()!;
            reg.cells.push([r, c]);
            for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
              if (g[nr][nc] === 0) { reg.walls++; reg.front.add(`${nr},${nc}`); }
              else if (g[nr][nc] === 1 && !seen[nr][nc]) { seen[nr][nc] = true; st.push([nr, nc]); }
            }
          }
          regions.push(reg);
        }
        if (!regions.length) return total;
        let best = 0;
        for (let k = 1; k < regions.length; k++) if (regions[k].front.size > regions[best].front.size) best = k;
        if (regions[best].front.size === 0) return total;
        if (regions.filter((x) => x.front.size === regions[best].front.size).length > 1) return null;
        total += regions[best].walls;
        for (const [r, c] of regions[best].cells) g[r][c] = -1;
        regions.forEach((x, k) => { if (k !== best) for (const key of x.front) { const [r, c] = key.split(",").map(Number); g[r][c] = 1; } });
      }
    };
    return {
      slug: "contain-virus",
      title: "Contain Virus",
      difficulty: "HARD" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Matrix", "Simulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "containVirus", params: [{ name: "isInfected", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A virus is spreading over an `m x n` grid `isInfected`, where `1` marks an infected cell and `0` a clean one. Infected cells that touch up, down, left or right form a **region**.\n\nYou can build walls on the boundary between two adjacent cells. Each day you have resources to wall off **exactly one** region: the region that threatens the **most** clean cells (the number of distinct clean cells adjacent to it). You build a wall on every shared side between that region and a clean cell, and that region never spreads again. It is guaranteed that this region is always unique.\n\nThen, at night, every other region spreads to all clean cells adjacent to it.\n\nRepeat until no region threatens any clean cell. Return the **total number of walls** built. (If the whole grid becomes infected, the process simply stops.)",
        [
          { in: "isInfected = [[0,1,0,0,0,0,0,1],[0,1,0,0,0,0,0,1],[0,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0]]", out: "10", note: "Day 1 walls the right-hand region (5 threatened cells, 5 walls) while the left one spreads; day 2 walls the left region with 5 more." },
          { in: "isInfected = [[1,1,1],[1,0,1],[1,1,1]]", out: "4", note: "One region threatens only the centre cell, but four infected cells border it." },
          { in: "isInfected = [[1,1,1,0,0,0,0,0,0],[1,0,1,0,1,1,1,1,1],[1,1,1,0,0,0,0,0,0]]", out: "13", note: "Walls between infected cells and the clean centre count too." },
        ],
        ["m == isInfected.length", "n == isInfected[i].length", "1 <= m, n <= 50", "isInfected[i][j] is 0 or 1", "on every day there is a unique region threatening the most clean cells"]),
      hints: [
        "Simulate day by day. Each day, find all infected regions with a flood fill.",
        "For each region record two numbers: the **distinct** clean cells it touches (to choose the region) and the **number of walls** — every (infected cell, clean neighbour) pair, counted with multiplicity.",
        "Wall off the region with the most threatened cells by marking its cells as dead (say `-1`), then infect every threatened cell of every other region. Stop when the largest threat is zero.",
      ],
      editorial: explain({
        idea: "There is nothing to optimise — the rules fix which region is walled each day — so the task is a careful simulation. The subtlety is that two different counts are involved: threatened cells (distinct) decide the choice, walls (per shared side) decide the cost.",
        steps: [
          "Loop: flood-fill every region of `1` cells. For each, collect the set of adjacent `0` cells (`frontier`) and count `walls`, the number of (cell, clean neighbour) pairs.",
          "If there is no region, or the largest frontier is empty, stop and return the total.",
          "Pick the region with the largest frontier; add its `walls` to the total and set its cells to `-1` so they are neither counted nor spread again.",
          "For every other region, set each frontier cell to `1`.",
        ],
        why: "The day's process is deterministic given the grid, and the problem guarantees the chosen region is unique, so the simulation reproduces exactly the walls that get built. Marking contained cells `-1` keeps them out of future flood fills and keeps them from being reinfected, matching a region that has been sealed in.",
        time: "O((m · n)^(4/3))",
        space: "O(m · n)",
        pitfalls: [
          "A clean cell touched by a region on two sides counts once toward the threat but needs two walls.",
          "Spread only after choosing and containing, and spread every other region simultaneously — a newly infected cell does not spread again that same night.",
          "Contained cells must not be treated as infected or clean afterwards.",
        ],
      }),
      examples: [
        { input: "[[0,1,0,0,0,0,0,1],[0,1,0,0,0,0,0,1],[0,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0]]", expectedOutput: "10" },
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "4" },
        { input: "[[1,1,1,0,0,0,0,0,0],[1,0,1,0,1,1,1,1,1],[1,1,1,0,0,0,0,0,0]]", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const m = ri(rng, 1, pick(rng, [3, 5, 8, 8]));
          const n = ri(rng, 2, pick(rng, [3, 5, 8, 8]));
          const p = pick(rng, [0.08, 0.15, 0.25, 0.4]);
          const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
          const ans = ref(grid);
          if (ans !== null) return { input: fmtIntMat(grid), expectedOutput: String(ans) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def containVirus(isInfected: List[List[int]]) -> int:
              g = [row[:] for row in isInfected]
              m, n = len(g), len(g[0])
              total = 0
              while True:
                  seen = [[False] * n for _ in range(m)]
                  regions, fronts, walls = [], [], []
                  for i in range(m):
                      for j in range(n):
                          if g[i][j] != 1 or seen[i][j]:
                              continue
                          cells, front, w = [], set(), 0
                          seen[i][j] = True
                          stack = [(i, j)]
                          while stack:
                              r, c = stack.pop()
                              cells.append((r, c))
                              for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                                  if 0 <= nr < m and 0 <= nc < n:
                                      if g[nr][nc] == 0:
                                          front.add((nr, nc))
                                          w += 1
                                      elif g[nr][nc] == 1 and not seen[nr][nc]:
                                          seen[nr][nc] = True
                                          stack.append((nr, nc))
                          regions.append(cells)
                          fronts.append(front)
                          walls.append(w)
                  if not regions:
                      break
                  best = max(range(len(regions)), key=lambda k: len(fronts[k]))
                  if not fronts[best]:
                      break
                  total += walls[best]
                  for r, c in regions[best]:
                      g[r][c] = -1
                  for k in range(len(regions)):
                      if k != best:
                          for r, c in fronts[k]:
                              g[r][c] = 1
              return total
        `,
        javascript: code`
          var containVirus = function(isInfected) {
              var m = isInfected.length, n = isInfected[0].length, total = 0, token = 0;
              var g = [], stamp = [];
              for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) { g.push(isInfected[i][j]); stamp.push(0); }
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              for (;;) {
                  var rid = [], fronts = [], walls = [];
                  for (var x = 0; x < m * n; x++) rid.push(-1);
                  for (var s = 0; s < m * n; s++) {
                      if (g[s] !== 1 || rid[s] !== -1) continue;
                      var id = fronts.length, front = [], w = 0, stack = [s];
                      token++;
                      rid[s] = id;
                      while (stack.length) {
                          var cur = stack.pop(), r = Math.floor(cur / n), c = cur % n;
                          for (var k = 0; k < 4; k++) {
                              var nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              var t = nr * n + nc;
                              if (g[t] === 0) { w++; if (stamp[t] !== token) { stamp[t] = token; front.push(t); } }
                              else if (g[t] === 1 && rid[t] === -1) { rid[t] = id; stack.push(t); }
                          }
                      }
                      fronts.push(front);
                      walls.push(w);
                  }
                  if (fronts.length === 0) break;
                  var best = 0;
                  for (var q = 1; q < fronts.length; q++) if (fronts[q].length > fronts[best].length) best = q;
                  if (fronts[best].length === 0) break;
                  total += walls[best];
                  for (var y = 0; y < m * n; y++) if (rid[y] === best) g[y] = -1;
                  for (var z = 0; z < fronts.length; z++) {
                      if (z === best) continue;
                      for (var f = 0; f < fronts[z].length; f++) g[fronts[z][f]] = 1;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function containVirus(isInfected: number[][]): number {
              var m = isInfected.length, n = isInfected[0].length, total = 0, token = 0;
              var g: number[] = [], stamp: number[] = [];
              for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) { g.push(isInfected[i][j]); stamp.push(0); }
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              for (;;) {
                  var rid: number[] = [], fronts: number[][] = [], walls: number[] = [];
                  for (var x = 0; x < m * n; x++) rid.push(-1);
                  for (var s = 0; s < m * n; s++) {
                      if (g[s] !== 1 || rid[s] !== -1) continue;
                      var id = fronts.length, front: number[] = [], w = 0, stack: number[] = [s];
                      token++;
                      rid[s] = id;
                      while (stack.length) {
                          var cur = stack.pop() as number, r = Math.floor(cur / n), c = cur % n;
                          for (var k = 0; k < 4; k++) {
                              var nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              var t = nr * n + nc;
                              if (g[t] === 0) { w++; if (stamp[t] !== token) { stamp[t] = token; front.push(t); } }
                              else if (g[t] === 1 && rid[t] === -1) { rid[t] = id; stack.push(t); }
                          }
                      }
                      fronts.push(front);
                      walls.push(w);
                  }
                  if (fronts.length === 0) break;
                  var best = 0;
                  for (var q = 1; q < fronts.length; q++) if (fronts[q].length > fronts[best].length) best = q;
                  if (fronts[best].length === 0) break;
                  total += walls[best];
                  for (var y = 0; y < m * n; y++) if (rid[y] === best) g[y] = -1;
                  for (var z = 0; z < fronts.length; z++) {
                      if (z === best) continue;
                      for (var f = 0; f < fronts[z].length; f++) g[fronts[z][f]] = 1;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int containVirus(int[][] isInfected) {
              int m = isInfected.length, n = isInfected[0].length, total = 0, token = 0;
              int[] g = new int[m * n], stamp = new int[m * n], rid = new int[m * n], stack = new int[m * n];
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) g[i * n + j] = isInfected[i][j];
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              while (true) {
                  Arrays.fill(rid, -1);
                  List<List<Integer>> fronts = new ArrayList<>();
                  List<Integer> walls = new ArrayList<>();
                  for (int s = 0; s < m * n; s++) {
                      if (g[s] != 1 || rid[s] != -1) continue;
                      int id = fronts.size(), w = 0, top = 0;
                      List<Integer> front = new ArrayList<>();
                      token++;
                      rid[s] = id;
                      stack[top++] = s;
                      while (top > 0) {
                          int cur = stack[--top], r = cur / n, c = cur % n;
                          for (int k = 0; k < 4; k++) {
                              int nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              int t = nr * n + nc;
                              if (g[t] == 0) { w++; if (stamp[t] != token) { stamp[t] = token; front.add(t); } }
                              else if (g[t] == 1 && rid[t] == -1) { rid[t] = id; stack[top++] = t; }
                          }
                      }
                      fronts.add(front);
                      walls.add(w);
                  }
                  if (fronts.isEmpty()) break;
                  int best = 0;
                  for (int q = 1; q < fronts.size(); q++) if (fronts.get(q).size() > fronts.get(best).size()) best = q;
                  if (fronts.get(best).isEmpty()) break;
                  total += walls.get(best);
                  for (int y = 0; y < m * n; y++) if (rid[y] == best) g[y] = -1;
                  for (int z = 0; z < fronts.size(); z++) {
                      if (z == best) continue;
                      for (int t : fronts.get(z)) g[t] = 1;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int containVirus(vector<vector<int>>& isInfected) {
              int m = isInfected.size(), n = isInfected[0].size(), total = 0, token = 0;
              vector<int> g(m * n), stamp(m * n, 0), rid(m * n);
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) g[i * n + j] = isInfected[i][j];
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              while (true) {
                  fill(rid.begin(), rid.end(), -1);
                  vector<vector<int>> fronts;
                  vector<int> walls;
                  for (int s = 0; s < m * n; s++) {
                      if (g[s] != 1 || rid[s] != -1) continue;
                      int id = fronts.size(), w = 0;
                      vector<int> front, st{s};
                      token++;
                      rid[s] = id;
                      while (!st.empty()) {
                          int cur = st.back(); st.pop_back();
                          int r = cur / n, c = cur % n;
                          for (int k = 0; k < 4; k++) {
                              int nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              int t = nr * n + nc;
                              if (g[t] == 0) { w++; if (stamp[t] != token) { stamp[t] = token; front.push_back(t); } }
                              else if (g[t] == 1 && rid[t] == -1) { rid[t] = id; st.push_back(t); }
                          }
                      }
                      fronts.push_back(front);
                      walls.push_back(w);
                  }
                  if (fronts.empty()) break;
                  int best = 0;
                  for (int q = 1; q < (int)fronts.size(); q++) if (fronts[q].size() > fronts[best].size()) best = q;
                  if (fronts[best].empty()) break;
                  total += walls[best];
                  for (int y = 0; y < m * n; y++) if (rid[y] == best) g[y] = -1;
                  for (int z = 0; z < (int)fronts.size(); z++) {
                      if (z == best) continue;
                      for (int t : fronts[z]) g[t] = 1;
                  }
              }
              return total;
          }
        `,
        c: code`
          int containVirus(int** isInfected, int isInfectedSize, int* isInfectedColSize) {
              int m = isInfectedSize, n = isInfectedColSize[0], mn = m * n, total = 0, token = 0;
              int* g = (int*)malloc(mn * sizeof(int));
              int* stamp = (int*)calloc(mn, sizeof(int));
              int* rid = (int*)malloc(mn * sizeof(int));
              int* stack = (int*)malloc(mn * sizeof(int));
              int* fbuf = (int*)malloc(4 * mn * sizeof(int));
              int* fStart = (int*)malloc((mn + 1) * sizeof(int));
              int* fLen = (int*)malloc((mn + 1) * sizeof(int));
              int* wall = (int*)malloc((mn + 1) * sizeof(int));
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) g[i * n + j] = isInfected[i][j];
              while (1) {
                  int regions = 0, used = 0;
                  for (int i = 0; i < mn; i++) rid[i] = -1;
                  for (int s = 0; s < mn; s++) {
                      if (g[s] != 1 || rid[s] != -1) continue;
                      int id = regions++, w = 0, top = 0;
                      fStart[id] = used;
                      fLen[id] = 0;
                      token++;
                      rid[s] = id;
                      stack[top++] = s;
                      while (top > 0) {
                          int cur = stack[--top], r = cur / n, c = cur % n;
                          for (int k = 0; k < 4; k++) {
                              int nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              int t = nr * n + nc;
                              if (g[t] == 0) {
                                  w++;
                                  if (stamp[t] != token) { stamp[t] = token; fbuf[used++] = t; fLen[id]++; }
                              } else if (g[t] == 1 && rid[t] == -1) {
                                  rid[t] = id;
                                  stack[top++] = t;
                              }
                          }
                      }
                      wall[id] = w;
                  }
                  if (regions == 0) break;
                  int best = 0;
                  for (int q = 1; q < regions; q++) if (fLen[q] > fLen[best]) best = q;
                  if (fLen[best] == 0) break;
                  total += wall[best];
                  for (int y = 0; y < mn; y++) if (rid[y] == best) g[y] = -1;
                  for (int z = 0; z < regions; z++) {
                      if (z == best) continue;
                      for (int f = 0; f < fLen[z]; f++) g[fbuf[fStart[z] + f]] = 1;
                  }
              }
              free(g); free(stamp); free(rid); free(stack); free(fbuf); free(fStart); free(fLen); free(wall);
              return total;
          }
        `,
        csharp: code`
          public static int ContainVirus(int[][] isInfected)
          {
              int m = isInfected.Length, n = isInfected[0].Length, total = 0, token = 0;
              int[] g = new int[m * n], stamp = new int[m * n], rid = new int[m * n];
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) g[i * n + j] = isInfected[i][j];
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              while (true)
              {
                  for (int i = 0; i < m * n; i++) rid[i] = -1;
                  var fronts = new List<List<int>>();
                  var walls = new List<int>();
                  for (int s = 0; s < m * n; s++)
                  {
                      if (g[s] != 1 || rid[s] != -1) continue;
                      int id = fronts.Count, w = 0;
                      var front = new List<int>();
                      var stack = new Stack<int>();
                      token++;
                      rid[s] = id;
                      stack.Push(s);
                      while (stack.Count > 0)
                      {
                          int cur = stack.Pop(), r = cur / n, c = cur % n;
                          for (int k = 0; k < 4; k++)
                          {
                              int nr = r + dr[k], nc = c + dc[k];
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                              int t = nr * n + nc;
                              if (g[t] == 0) { w++; if (stamp[t] != token) { stamp[t] = token; front.Add(t); } }
                              else if (g[t] == 1 && rid[t] == -1) { rid[t] = id; stack.Push(t); }
                          }
                      }
                      fronts.Add(front);
                      walls.Add(w);
                  }
                  if (fronts.Count == 0) break;
                  int best = 0;
                  for (int q = 1; q < fronts.Count; q++) if (fronts[q].Count > fronts[best].Count) best = q;
                  if (fronts[best].Count == 0) break;
                  total += walls[best];
                  for (int y = 0; y < m * n; y++) if (rid[y] == best) g[y] = -1;
                  for (int z = 0; z < fronts.Count; z++)
                  {
                      if (z == best) continue;
                      foreach (int t in fronts[z]) g[t] = 1;
                  }
              }
              return total;
          }
        `,
        go: code`
          func containVirus(isInfected [][]int) int {
              m, n := len(isInfected), len(isInfected[0])
              total, token := 0, 0
              g := make([]int, m*n)
              stamp := make([]int, m*n)
              rid := make([]int, m*n)
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      g[i*n+j] = isInfected[i][j]
                  }
              }
              dr := []int{1, -1, 0, 0}
              dc := []int{0, 0, 1, -1}
              for {
                  for i := range rid {
                      rid[i] = -1
                  }
                  fronts := [][]int{}
                  walls := []int{}
                  for s := 0; s < m*n; s++ {
                      if g[s] != 1 || rid[s] != -1 {
                          continue
                      }
                      id, w := len(fronts), 0
                      front := []int{}
                      stack := []int{s}
                      token++
                      rid[s] = id
                      for len(stack) > 0 {
                          cur := stack[len(stack)-1]
                          stack = stack[:len(stack)-1]
                          r, c := cur/n, cur%n
                          for k := 0; k < 4; k++ {
                              nr, nc := r+dr[k], c+dc[k]
                              if nr < 0 || nc < 0 || nr >= m || nc >= n {
                                  continue
                              }
                              t := nr*n + nc
                              if g[t] == 0 {
                                  w++
                                  if stamp[t] != token {
                                      stamp[t] = token
                                      front = append(front, t)
                                  }
                              } else if g[t] == 1 && rid[t] == -1 {
                                  rid[t] = id
                                  stack = append(stack, t)
                              }
                          }
                      }
                      fronts = append(fronts, front)
                      walls = append(walls, w)
                  }
                  if len(fronts) == 0 {
                      break
                  }
                  best := 0
                  for q := 1; q < len(fronts); q++ {
                      if len(fronts[q]) > len(fronts[best]) {
                          best = q
                      }
                  }
                  if len(fronts[best]) == 0 {
                      break
                  }
                  total += walls[best]
                  for y := 0; y < m*n; y++ {
                      if rid[y] == best {
                          g[y] = -1
                      }
                  }
                  for z := range fronts {
                      if z == best {
                          continue
                      }
                      for _, t := range fronts[z] {
                          g[t] = 1
                      }
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun containVirus(isInfected: Array<IntArray>): Int {
              val m = isInfected.size
              val n = isInfected[0].size
              var total = 0
              var token = 0
              val g = IntArray(m * n) { isInfected[it / n][it % n] }
              val stamp = IntArray(m * n)
              val rid = IntArray(m * n)
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              while (true) {
                  rid.fill(-1)
                  val fronts = ArrayList<ArrayList<Int>>()
                  val walls = ArrayList<Int>()
                  for (s in 0 until m * n) {
                      if (g[s] != 1 || rid[s] != -1) continue
                      val id = fronts.size
                      var w = 0
                      val front = ArrayList<Int>()
                      val stack = ArrayList<Int>()
                      token++
                      rid[s] = id
                      stack.add(s)
                      while (stack.isNotEmpty()) {
                          val cur = stack.removeAt(stack.size - 1)
                          val r = cur / n
                          val c = cur % n
                          for (k in 0 until 4) {
                              val nr = r + dr[k]
                              val nc = c + dc[k]
                              if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue
                              val t = nr * n + nc
                              if (g[t] == 0) {
                                  w++
                                  if (stamp[t] != token) { stamp[t] = token; front.add(t) }
                              } else if (g[t] == 1 && rid[t] == -1) {
                                  rid[t] = id
                                  stack.add(t)
                              }
                          }
                      }
                      fronts.add(front)
                      walls.add(w)
                  }
                  if (fronts.isEmpty()) break
                  var best = 0
                  for (q in 1 until fronts.size) if (fronts[q].size > fronts[best].size) best = q
                  if (fronts[best].isEmpty()) break
                  total += walls[best]
                  for (y in 0 until m * n) if (rid[y] == best) g[y] = -1
                  for (z in fronts.indices) {
                      if (z == best) continue
                      for (t in fronts[z]) g[t] = 1
                  }
              }
              return total
          }
        `,
        swift: code`
          func containVirus(_ isInfected: [[Int]]) -> Int {
              let m = isInfected.count, n = isInfected[0].count
              var total = 0, token = 0
              var g = isInfected.flatMap { $0 }
              var stamp = [Int](repeating: 0, count: m * n)
              var rid = [Int](repeating: -1, count: m * n)
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              while true {
                  for i in 0..<(m * n) { rid[i] = -1 }
                  var fronts = [[Int]]()
                  var walls = [Int]()
                  for s in 0..<(m * n) {
                      if g[s] != 1 || rid[s] != -1 { continue }
                      let id = fronts.count
                      var w = 0
                      var front = [Int]()
                      var stack = [s]
                      token += 1
                      rid[s] = id
                      while let cur = stack.popLast() {
                          let r = cur / n, c = cur % n
                          for k in 0..<4 {
                              let nr = r + dr[k], nc = c + dc[k]
                              if nr < 0 || nc < 0 || nr >= m || nc >= n { continue }
                              let t = nr * n + nc
                              if g[t] == 0 {
                                  w += 1
                                  if stamp[t] != token { stamp[t] = token; front.append(t) }
                              } else if g[t] == 1 && rid[t] == -1 {
                                  rid[t] = id
                                  stack.append(t)
                              }
                          }
                      }
                      fronts.append(front)
                      walls.append(w)
                  }
                  if fronts.isEmpty { break }
                  var best = 0
                  for q in 1..<max(1, fronts.count) where fronts[q].count > fronts[best].count { best = q }
                  if fronts[best].isEmpty { break }
                  total += walls[best]
                  for y in 0..<(m * n) where rid[y] == best { g[y] = -1 }
                  for z in 0..<fronts.count where z != best {
                      for t in fronts[z] { g[t] = 1 }
                  }
              }
              return total
          }
        `,
        rust: code`
          fn containVirus(is_infected: Vec<Vec<i32>>) -> i32 {
              let m = is_infected.len();
              let n = is_infected[0].len();
              let mut total = 0;
              let mut token = 0;
              let mut g: Vec<i32> = is_infected.iter().flat_map(|r| r.iter().cloned()).collect();
              let mut stamp = vec![0i32; m * n];
              let mut rid = vec![-1i64; m * n];
              let dirs = [(1i32, 0i32), (-1, 0), (0, 1), (0, -1)];
              loop {
                  for x in rid.iter_mut() {
                      *x = -1;
                  }
                  let mut fronts: Vec<Vec<usize>> = Vec::new();
                  let mut walls: Vec<i32> = Vec::new();
                  for s in 0..m * n {
                      if g[s] != 1 || rid[s] != -1 {
                          continue;
                      }
                      let id = fronts.len() as i64;
                      let mut w = 0;
                      let mut front = Vec::new();
                      let mut stack = vec![s];
                      token += 1;
                      rid[s] = id;
                      while let Some(cur) = stack.pop() {
                          let (r, c) = ((cur / n) as i32, (cur % n) as i32);
                          for &(dr, dc) in dirs.iter() {
                              let (nr, nc) = (r + dr, c + dc);
                              if nr < 0 || nc < 0 || nr >= m as i32 || nc >= n as i32 {
                                  continue;
                              }
                              let t = nr as usize * n + nc as usize;
                              if g[t] == 0 {
                                  w += 1;
                                  if stamp[t] != token {
                                      stamp[t] = token;
                                      front.push(t);
                                  }
                              } else if g[t] == 1 && rid[t] == -1 {
                                  rid[t] = id;
                                  stack.push(t);
                              }
                          }
                      }
                      fronts.push(front);
                      walls.push(w);
                  }
                  if fronts.is_empty() {
                      break;
                  }
                  let mut best = 0;
                  for q in 1..fronts.len() {
                      if fronts[q].len() > fronts[best].len() {
                          best = q;
                      }
                  }
                  if fronts[best].is_empty() {
                      break;
                  }
                  total += walls[best];
                  for y in 0..m * n {
                      if rid[y] == best as i64 {
                          g[y] = -1;
                      }
                  }
                  for z in 0..fronts.len() {
                      if z == best {
                          continue;
                      }
                      for &t in fronts[z].iter() {
                          g[t] = 1;
                      }
                  }
              }
              total
          }
        `,
        php: code`
          function containVirus($isInfected) {
              $m = count($isInfected);
              $n = count($isInfected[0]);
              $total = 0;
              $token = 0;
              $g = [];
              for ($i = 0; $i < $m; $i++) for ($j = 0; $j < $n; $j++) $g[] = $isInfected[$i][$j];
              $stamp = array_fill(0, $m * $n, 0);
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              while (true) {
                  $rid = array_fill(0, $m * $n, -1);
                  $fronts = [];
                  $walls = [];
                  for ($s = 0; $s < $m * $n; $s++) {
                      if ($g[$s] != 1 || $rid[$s] != -1) continue;
                      $id = count($fronts);
                      $w = 0;
                      $front = [];
                      $stack = [$s];
                      $token++;
                      $rid[$s] = $id;
                      while ($stack) {
                          $cur = array_pop($stack);
                          $r = intdiv($cur, $n);
                          $c = $cur % $n;
                          for ($k = 0; $k < 4; $k++) {
                              $nr = $r + $dr[$k];
                              $nc = $c + $dc[$k];
                              if ($nr < 0 || $nc < 0 || $nr >= $m || $nc >= $n) continue;
                              $t = $nr * $n + $nc;
                              if ($g[$t] == 0) {
                                  $w++;
                                  if ($stamp[$t] != $token) { $stamp[$t] = $token; $front[] = $t; }
                              } elseif ($g[$t] == 1 && $rid[$t] == -1) {
                                  $rid[$t] = $id;
                                  $stack[] = $t;
                              }
                          }
                      }
                      $fronts[] = $front;
                      $walls[] = $w;
                  }
                  if (!$fronts) break;
                  $best = 0;
                  for ($q = 1; $q < count($fronts); $q++) if (count($fronts[$q]) > count($fronts[$best])) $best = $q;
                  if (!$fronts[$best]) break;
                  $total += $walls[$best];
                  for ($y = 0; $y < $m * $n; $y++) if ($rid[$y] == $best) $g[$y] = -1;
                  foreach ($fronts as $z => $front) {
                      if ($z == $best) continue;
                      foreach ($front as $t) $g[$t] = 1;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def containVirus(isInfected)
            m = isInfected.length
            n = isInfected[0].length
            g = isInfected.flatten
            stamp = Array.new(m * n, 0)
            total = 0
            token = 0
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            loop do
              rid = Array.new(m * n, -1)
              fronts = []
              walls = []
              (m * n).times do |s|
                next if g[s] != 1 || rid[s] != -1
                id = fronts.length
                w = 0
                front = []
                stack = [s]
                token += 1
                rid[s] = id
                until stack.empty?
                  cur = stack.pop
                  r, c = cur.divmod(n)
                  dirs.each do |dr, dc|
                    nr = r + dr
                    nc = c + dc
                    next if nr < 0 || nc < 0 || nr >= m || nc >= n
                    t = nr * n + nc
                    if g[t] == 0
                      w += 1
                      if stamp[t] != token
                        stamp[t] = token
                        front << t
                      end
                    elsif g[t] == 1 && rid[t] == -1
                      rid[t] = id
                      stack << t
                    end
                  end
                end
                fronts << front
                walls << w
              end
              break if fronts.empty?
              best = 0
              (1...fronts.length).each { |q| best = q if fronts[q].length > fronts[best].length }
              break if fronts[best].empty?
              total += walls[best]
              (m * n).times { |y| g[y] = -1 if rid[y] == best }
              fronts.each_with_index do |front, z|
                next if z == best
                front.each { |t| g[t] = 1 }
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── K-Similar Strings (LC 854) ──────────────────────────────────
  (() => {
    // Plain BFS over every possible swap — no pruning, so it is an
    // independent check of the solutions' "fix the first mismatch" search.
    const ref = (s1: string, s2: string) => {
      const dist = new Map<string, number>([[s1, 0]]);
      const q = [s1];
      for (let h = 0; h < q.length; h++) {
        const s = q[h];
        const d = dist.get(s)!;
        if (s === s2) return d;
        const a = s.split("");
        for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
          if (a[i] === a[j]) continue;
          const b = a.slice();
          b[i] = a[j]; b[j] = a[i];
          const t = b.join("");
          if (!dist.has(t)) { dist.set(t, d + 1); q.push(t); }
        }
      }
      return -1;
    };
    return {
      slug: "k-similar-strings",
      title: "K-Similar Strings",
      difficulty: "HARD" as const,
      tags: ["String", "Breadth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "kSimilarity",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Two strings are `k`-similar if you can turn the first into the second by swapping the positions of two letters **exactly** `k` times.\n\nGiven two anagrams `s1` and `s2`, return the **smallest** `k` for which they are `k`-similar.",
        [
          { in: "s1 = \"ab\", s2 = \"ba\"", out: "1" },
          { in: "s1 = \"abc\", s2 = \"bca\"", out: "2", note: "\"abc\" → \"bac\" → \"bca\"." },
          { in: "s1 = \"abac\", s2 = \"baca\"", out: "2" },
        ],
        ["1 <= s1.length <= 20", "s2.length == s1.length", "s1 and s2 contain only letters from {'a', 'b', 'c', 'd', 'e', 'f'}", "s2 is an anagram of s1"]),
      hints: [
        "Think of each string as a state and each swap as an edge: the answer is a shortest path, so BFS from `s1`.",
        "Trying all `n^2` swaps per state explodes. Positions that already match `s2` never need to move, so always work on the **first** mismatched index `i`.",
        "Only swap `i` with a later `j` where `s[j] == s2[i]` (that fixes position `i`) and `s[j] != s2[j]` (never break a position that is already right).",
      ],
      editorial: explain({
        idea: "Breadth-first search over strings, where each level is one swap. The branching is cut down by always fixing the first position that differs from `s2`, using only swaps that put the right letter there and take it from a position that was itself wrong.",
        steps: [
          "If `s1 == s2`, return `0`. Otherwise push `s1` into a queue and a visited set.",
          "Process the queue level by level, counting levels as swaps.",
          "For a string `s`, find the first index `i` with `s[i] != s2[i]`. For each `j > i` with `s[j] == s2[i]` and `s[j] != s2[j]`, swap `i` and `j`.",
          "If the new string equals `s2`, return the current level; otherwise enqueue it if unseen.",
        ],
        why: "Some optimal sequence of swaps fixes position `i` in its first swap that touches `i`, and swaps commute enough that we may perform that one first. That swap must bring the letter `s2[i]` from some `j`; taking it from a position that is already correct would cost an extra swap to repair, so only mismatched `j` need to be tried. Hence the pruned search still contains an optimal path, and BFS finds the shortest.",
        time: "O(n^2 · S) where S is the number of states explored — small in practice for n ≤ 20 over six letters",
        space: "O(n · S)",
        pitfalls: [
          "Always branch on the **first** mismatch only — branching on every mismatch multiplies the state space with no benefit.",
          "Count levels, not individual dequeues.",
          "A swap of two equal letters changes nothing; the `s[j] != s2[j]` filter also prevents useless moves.",
        ],
      }),
      examples: [
        { input: "\"ab\"\n\"ba\"", expectedOutput: "1" },
        { input: "\"abc\"\n\"bca\"", expectedOutput: "2" },
        { input: "\"abac\"\n\"baca\"", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, rng() < 0.05 ? 1 : 2, pick(rng, [5, 7, 7, 7]));
        const alpha = "abcdef".slice(0, ri(rng, 2, 6));
        const s1 = Array.from({ length: len }, () => alpha[ri(rng, 0, alpha.length - 1)]).join("");
        let s2 = s1;
        for (let tries = 0; tries < 6 && s2 === s1 && rng() < 0.97; tries++) s2 = shuffle(rng, s1.split("")).join("");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: String(ref(s1, s2)) };
      },
      hiddenCount: 1500,
      solutions: {
        python: code`
          from collections import deque

          def kSimilarity(s1: str, s2: str) -> int:
              if s1 == s2:
                  return 0
              n = len(s1)
              seen = {s1}
              q = deque([s1])
              d = 0
              while q:
                  d += 1
                  for _ in range(len(q)):
                      s = q.popleft()
                      i = 0
                      while s[i] == s2[i]:
                          i += 1
                      for j in range(i + 1, n):
                          if s[j] == s2[i] and s[j] != s2[j]:
                              t = s[:i] + s[j] + s[i + 1:j] + s[i] + s[j + 1:]
                              if t == s2:
                                  return d
                              if t not in seen:
                                  seen.add(t)
                                  q.append(t)
              return d
        `,
        javascript: code`
          var kSimilarity = function(s1, s2) {
              if (s1 === s2) return 0;
              var n = s1.length, seen = {}, q = [s1], d = 0;
              seen[s1] = true;
              var head = 0;
              while (head < q.length) {
                  d++;
                  var end = q.length;
                  for (; head < end; head++) {
                      var s = q[head], i = 0;
                      while (s[i] === s2[i]) i++;
                      for (var j = i + 1; j < n; j++) {
                          if (s[j] !== s2[i] || s[j] === s2[j]) continue;
                          var t = s.substring(0, i) + s[j] + s.substring(i + 1, j) + s[i] + s.substring(j + 1);
                          if (t === s2) return d;
                          if (!seen[t]) { seen[t] = true; q.push(t); }
                      }
                  }
              }
              return d;
          };
        `,
        typescript: code`
          function kSimilarity(s1: string, s2: string): number {
              if (s1 === s2) return 0;
              var n = s1.length, q: string[] = [s1], d = 0;
              var seen: { [k: string]: boolean } = {};
              seen[s1] = true;
              var head = 0;
              while (head < q.length) {
                  d++;
                  var end = q.length;
                  for (; head < end; head++) {
                      var s = q[head], i = 0;
                      while (s.charAt(i) === s2.charAt(i)) i++;
                      for (var j = i + 1; j < n; j++) {
                          if (s.charAt(j) !== s2.charAt(i) || s.charAt(j) === s2.charAt(j)) continue;
                          var t = s.substring(0, i) + s.charAt(j) + s.substring(i + 1, j) + s.charAt(i) + s.substring(j + 1);
                          if (t === s2) return d;
                          if (!seen[t]) { seen[t] = true; q.push(t); }
                      }
                  }
              }
              return d;
          }
        `,
        java: code`
          public static int kSimilarity(String s1, String s2) {
              if (s1.equals(s2)) return 0;
              int n = s1.length(), d = 0;
              Set<String> seen = new HashSet<>();
              ArrayDeque<String> q = new ArrayDeque<>();
              seen.add(s1);
              q.add(s1);
              while (!q.isEmpty()) {
                  d++;
                  for (int size = q.size(); size > 0; size--) {
                      char[] s = q.poll().toCharArray();
                      int i = 0;
                      while (s[i] == s2.charAt(i)) i++;
                      for (int j = i + 1; j < n; j++) {
                          if (s[j] != s2.charAt(i) || s[j] == s2.charAt(j)) continue;
                          char tmp = s[i]; s[i] = s[j]; s[j] = tmp;
                          String t = new String(s);
                          if (t.equals(s2)) return d;
                          if (seen.add(t)) q.add(t);
                          tmp = s[i]; s[i] = s[j]; s[j] = tmp;
                      }
                  }
              }
              return d;
          }
        `,
        cpp: code`
          int kSimilarity(string s1, string s2) {
              if (s1 == s2) return 0;
              int n = s1.size(), d = 0;
              unordered_set<string> seen{s1};
              queue<string> q;
              q.push(s1);
              while (!q.empty()) {
                  d++;
                  for (int size = q.size(); size > 0; size--) {
                      string s = q.front(); q.pop();
                      int i = 0;
                      while (s[i] == s2[i]) i++;
                      for (int j = i + 1; j < n; j++) {
                          if (s[j] != s2[i] || s[j] == s2[j]) continue;
                          swap(s[i], s[j]);
                          if (s == s2) return d;
                          if (seen.insert(s).second) q.push(s);
                          swap(s[i], s[j]);
                      }
                  }
              }
              return d;
          }
        `,
        c: code`
          typedef struct { unsigned long long* keys; char* used; int cap, size; } KsSet;

          static unsigned long long ksEnc(const char* s, int n) {
              unsigned long long v = 0;
              for (int i = 0; i < n; i++) v = v * 6 + (unsigned long long)(s[i] - 'a');
              return v;
          }

          static int ksAdd(KsSet* st, unsigned long long k);

          static void ksGrow(KsSet* st) {
              unsigned long long* oldKeys = st->keys;
              char* oldUsed = st->used;
              int oldCap = st->cap;
              st->cap *= 2;
              st->size = 0;
              st->keys = (unsigned long long*)calloc(st->cap, sizeof(unsigned long long));
              st->used = (char*)calloc(st->cap, 1);
              for (int i = 0; i < oldCap; i++) if (oldUsed[i]) ksAdd(st, oldKeys[i]);
              free(oldKeys);
              free(oldUsed);
          }

          /* Returns 1 when k was not in the set (and adds it). */
          static int ksAdd(KsSet* st, unsigned long long k) {
              if (2 * (st->size + 1) > st->cap) ksGrow(st);
              unsigned long long h = (k * 11400714819323198485ULL) >> 20;
              int i = (int)(h % (unsigned long long)st->cap);
              while (st->used[i]) {
                  if (st->keys[i] == k) return 0;
                  i = (i + 1) % st->cap;
              }
              st->used[i] = 1;
              st->keys[i] = k;
              st->size++;
              return 1;
          }

          int kSimilarity(const char* s1, const char* s2) {
              int n = (int)strlen(s1);
              if (strcmp(s1, s2) == 0) return 0;
              KsSet st;
              st.cap = 1024;
              st.size = 0;
              st.keys = (unsigned long long*)calloc(st.cap, sizeof(unsigned long long));
              st.used = (char*)calloc(st.cap, 1);
              int qcap = 1024, head = 0, tail = 0, d = 0, ans = -1;
              char* q = (char*)malloc((size_t)qcap * n);
              char* cur = (char*)malloc(n + 1);
              memcpy(q, s1, n);
              tail = 1;
              ksAdd(&st, ksEnc(s1, n));
              while (head < tail && ans < 0) {
                  d++;
                  int end = tail;
                  for (; head < end && ans < 0; head++) {
                      memcpy(cur, q + (size_t)head * n, n);
                      int i = 0;
                      while (cur[i] == s2[i]) i++;
                      for (int j = i + 1; j < n; j++) {
                          if (cur[j] != s2[i] || cur[j] == s2[j]) continue;
                          char tmp = cur[i]; cur[i] = cur[j]; cur[j] = tmp;
                          if (memcmp(cur, s2, n) == 0) { ans = d; break; }
                          if (ksAdd(&st, ksEnc(cur, n))) {
                              if (tail == qcap) { qcap *= 2; q = (char*)realloc(q, (size_t)qcap * n); }
                              memcpy(q + (size_t)tail * n, cur, n);
                              tail++;
                          }
                          tmp = cur[i]; cur[i] = cur[j]; cur[j] = tmp;
                      }
                  }
              }
              free(st.keys); free(st.used); free(q); free(cur);
              return ans < 0 ? d : ans;
          }
        `,
        csharp: code`
          public static int KSimilarity(string s1, string s2)
          {
              if (s1 == s2) return 0;
              int n = s1.Length, d = 0;
              var seen = new HashSet<string> { s1 };
              var q = new Queue<string>();
              q.Enqueue(s1);
              while (q.Count > 0)
              {
                  d++;
                  for (int size = q.Count; size > 0; size--)
                  {
                      char[] s = q.Dequeue().ToCharArray();
                      int i = 0;
                      while (s[i] == s2[i]) i++;
                      for (int j = i + 1; j < n; j++)
                      {
                          if (s[j] != s2[i] || s[j] == s2[j]) continue;
                          char tmp = s[i]; s[i] = s[j]; s[j] = tmp;
                          string t = new string(s);
                          if (t == s2) return d;
                          if (seen.Add(t)) q.Enqueue(t);
                          tmp = s[i]; s[i] = s[j]; s[j] = tmp;
                      }
                  }
              }
              return d;
          }
        `,
        go: code`
          func kSimilarity(s1 string, s2 string) int {
              if s1 == s2 {
                  return 0
              }
              n, d := len(s1), 0
              seen := map[string]bool{s1: true}
              q := []string{s1}
              for len(q) > 0 {
                  d++
                  next := []string{}
                  for _, str := range q {
                      s := []byte(str)
                      i := 0
                      for s[i] == s2[i] {
                          i++
                      }
                      for j := i + 1; j < n; j++ {
                          if s[j] != s2[i] || s[j] == s2[j] {
                              continue
                          }
                          s[i], s[j] = s[j], s[i]
                          t := string(s)
                          if t == s2 {
                              return d
                          }
                          if !seen[t] {
                              seen[t] = true
                              next = append(next, t)
                          }
                          s[i], s[j] = s[j], s[i]
                      }
                  }
                  q = next
              }
              return d
          }
        `,
        kotlin: code`
          fun kSimilarity(s1: String, s2: String): Int {
              if (s1 == s2) return 0
              val n = s1.length
              var d = 0
              val seen = HashSet<String>()
              seen.add(s1)
              var q = ArrayList<String>()
              q.add(s1)
              while (q.isNotEmpty()) {
                  d++
                  val next = ArrayList<String>()
                  for (str in q) {
                      val s = str.toCharArray()
                      var i = 0
                      while (s[i] == s2[i]) i++
                      for (j in i + 1 until n) {
                          if (s[j] != s2[i] || s[j] == s2[j]) continue
                          var tmp = s[i]; s[i] = s[j]; s[j] = tmp
                          val t = String(s)
                          if (t == s2) return d
                          if (seen.add(t)) next.add(t)
                          tmp = s[i]; s[i] = s[j]; s[j] = tmp
                      }
                  }
                  q = next
              }
              return d
          }
        `,
        swift: code`
          func kSimilarity(_ s1: String, _ s2: String) -> Int {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              if a == b { return 0 }
              let n = a.count
              var seen = Set<[UInt8]>([a])
              var q = [a]
              var d = 0
              while !q.isEmpty {
                  d += 1
                  var next = [[UInt8]]()
                  for str in q {
                      var s = str
                      var i = 0
                      while s[i] == b[i] { i += 1 }
                      for j in (i + 1)..<n {
                          if s[j] != b[i] || s[j] == b[j] { continue }
                          s.swapAt(i, j)
                          if s == b { return d }
                          if !seen.contains(s) { seen.insert(s); next.append(s) }
                          s.swapAt(i, j)
                      }
                  }
                  q = next
              }
              return d
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn kSimilarity(s1: String, s2: String) -> i32 {
              if s1 == s2 {
                  return 0;
              }
              let a: Vec<u8> = s1.into_bytes();
              let b: Vec<u8> = s2.into_bytes();
              let n = a.len();
              let mut seen: HashSet<Vec<u8>> = HashSet::new();
              seen.insert(a.clone());
              let mut q = vec![a];
              let mut d = 0;
              while !q.is_empty() {
                  d += 1;
                  let mut next = Vec::new();
                  for str in q.iter() {
                      let mut s = str.clone();
                      let mut i = 0;
                      while s[i] == b[i] {
                          i += 1;
                      }
                      for j in (i + 1)..n {
                          if s[j] != b[i] || s[j] == b[j] {
                              continue;
                          }
                          s.swap(i, j);
                          if s == b {
                              return d;
                          }
                          if seen.insert(s.clone()) {
                              next.push(s.clone());
                          }
                          s.swap(i, j);
                      }
                  }
                  q = next;
              }
              d
          }
        `,
        php: code`
          function kSimilarity($s1, $s2) {
              if ($s1 === $s2) return 0;
              $n = strlen($s1);
              $seen = [$s1 => true];
              $q = [$s1];
              $d = 0;
              while ($q) {
                  $d++;
                  $next = [];
                  foreach ($q as $s) {
                      $i = 0;
                      while ($s[$i] === $s2[$i]) $i++;
                      for ($j = $i + 1; $j < $n; $j++) {
                          if ($s[$j] !== $s2[$i] || $s[$j] === $s2[$j]) continue;
                          $t = $s;
                          $t[$i] = $s[$j];
                          $t[$j] = $s[$i];
                          if ($t === $s2) return $d;
                          if (!isset($seen[$t])) { $seen[$t] = true; $next[] = $t; }
                      }
                  }
                  $q = $next;
              }
              return $d;
          }
        `,
        ruby: code`
          def kSimilarity(s1, s2)
            return 0 if s1 == s2
            n = s1.length
            seen = { s1 => true }
            q = [s1]
            d = 0
            until q.empty?
              d += 1
              nxt = []
              q.each do |s|
                i = 0
                i += 1 while s[i] == s2[i]
                ((i + 1)...n).each do |j|
                  next if s[j] != s2[i] || s[j] == s2[j]
                  t = s.dup
                  t[i] = s[j]
                  t[j] = s[i]
                  return d if t == s2
                  next if seen[t]
                  seen[t] = true
                  nxt << t
                end
              end
              q = nxt
            end
            d
          end
        `,
      },
    };
  })(),

  // ── Reachable Nodes In Subdivided Graph (LC 882) ────────────────
  (() => {
    // Builds the subdivided graph for real and BFSes it — feasible for the
    // small counts the generator uses, and independent of Dijkstra.
    const ref = (edges: number[][], maxMoves: number, n: number) => {
      const adj: number[][] = Array.from({ length: n }, () => []);
      let next = n;
      for (const [u, v, cnt] of edges) {
        let prev = u;
        for (let k = 0; k < cnt; k++) { adj.push([]); adj[prev].push(next); adj[next].push(prev); prev = next; next++; }
        adj[prev].push(v); adj[v].push(prev);
      }
      const dist = new Array(adj.length).fill(-1);
      dist[0] = 0;
      const q = [0];
      for (let h = 0; h < q.length; h++) {
        const x = q[h];
        if (dist[x] === maxMoves) continue;
        for (const y of adj[x]) if (dist[y] === -1) { dist[y] = dist[x] + 1; q.push(y); }
      }
      return q.length;
    };
    return {
      slug: "reachable-nodes-in-subdivided-graph",
      title: "Reachable Nodes In Subdivided Graph",
      difficulty: "HARD" as const,
      tags: ["Graph", "Heap (Priority Queue)", "Shortest Path", "Google", "Amazon"],
      signature: {
        funcName: "reachableNodes",
        params: [{ name: "edges", type: "int[][]" as const }, { name: "maxMoves", type: "int" as const }, { name: "n", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an undirected graph with `n` nodes labelled `0` to `n - 1`. Each `edges[i] = [u, v, cnt]` means the edge between `u` and `v` is **subdivided** into a chain of `cnt + 1` edges by inserting `cnt` new nodes `x1, …, xcnt` between them: `[u, x1], [x1, x2], …, [xcnt, v]`. With `cnt == 0` the edge is left as it is.\n\nIn the new graph you start at node `0` and may walk at most `maxMoves` edges. Return how many nodes of the **new** graph (original and inserted) are reachable from node `0`.",
        [
          { in: "edges = [[0,1,10],[0,2,1],[1,2,2]], maxMoves = 6, n = 3", out: "13", note: "Node 2 is 2 moves away and node 1 is 5 moves away (0 → 2 → 1 through three new nodes); counting the inserted nodes each side can still reach gives 13." },
          { in: "edges = [[0,1,4],[1,2,6],[0,2,8],[1,3,1]], maxMoves = 10, n = 4", out: "23" },
          { in: "edges = [[1,2,4],[1,4,5],[1,3,1],[2,3,4],[3,4,5]], maxMoves = 17, n = 5", out: "1", note: "Node 0 has no edges, so only node 0 itself is reachable." },
        ],
        ["0 <= edges.length <= min(n * (n - 1) / 2, 10^4)", "edges[i].length == 3", "0 <= u < v < n", "there are no multiple edges", "0 <= cnt <= 10^4", "0 <= maxMoves <= 10^9", "1 <= n <= 3000"]),
      hints: [
        "Never build the subdivided graph — a single edge can hide ten thousand nodes. Treat edge `[u, v, cnt]` as a weighted edge of length `cnt + 1`.",
        "Shortest distances from `0` to the original nodes come from Dijkstra. An original node counts when its distance is at most `maxMoves`.",
        "For the inserted nodes on edge `(u, v)`: from `u` you can walk `max(0, maxMoves - dist[u])` of them, from `v` `max(0, maxMoves - dist[v])`. The edge contributes the sum of those, capped at `cnt`.",
      ],
      editorial: explain({
        idea: "Count original nodes and inserted nodes separately. Original nodes need true shortest distances (Dijkstra with weights `cnt + 1`); inserted nodes on an edge are reached by walking in from either end with whatever moves remain.",
        steps: [
          "Build an adjacency list where edge `[u, v, cnt]` has weight `cnt + 1` in both directions.",
          "Run Dijkstra from node `0` to get `dist[x]` for every original node (infinity if unreachable).",
          "Count original nodes with `dist[x] <= maxMoves`.",
          "For each edge, let `a = min(cnt, max(0, maxMoves - dist[u]))` and `b = min(cnt, max(0, maxMoves - dist[v]))`; add `min(cnt, a + b)`.",
          "Return the total.",
        ],
        why: "Any walk reaching an inserted node on edge `(u, v)` enters the chain through `u` or `v`, so the best it can do from `u` is walk the leftover budget `maxMoves - dist[u]` along the chain, and likewise from `v`. The nodes reached from both ends overlap only when the two stretches meet, which the cap at `cnt` handles. Original nodes are reachable exactly when their shortest distance fits in the budget.",
        time: "O(n^2 + E) with an array-based Dijkstra (or O(E log n) with a heap)",
        space: "O(n + E)",
        pitfalls: [
          "Inserted nodes are counted per edge, never through `dist` — they are not vertices of the Dijkstra graph.",
          "`a + b` may count the middle twice; cap the edge's contribution at `cnt`.",
          "`maxMoves` can be `10^9`: compute the leftover budgets before adding them, or use 64-bit arithmetic.",
        ],
      }),
      examples: [
        { input: "[[0,1,10],[0,2,1],[1,2,2]]\n6\n3", expectedOutput: "13" },
        { input: "[[0,1,4],[1,2,6],[0,2,8],[1,3,1]]\n10\n4", expectedOutput: "23" },
        { input: "[[1,2,4],[1,4,5],[1,3,1],[2,3,4],[3,4,5]]\n17\n5", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, rng() < 0.05 ? 1 : 2, pick(rng, [3, 5, 8, 10]));
        const p = pick(rng, [0.2, 0.4, 0.7]);
        const cmax = pick(rng, [0, 3, 10, 25]);
        const edges: number[][] = [];
        for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (rng() < p) edges.push([u, v, ri(rng, 0, cmax)]);
        if (n > 1 && !edges.some((e) => e[0] === 0) && rng() < 0.85) edges.push([0, ri(rng, 1, n - 1), ri(rng, 0, cmax)]);
        shuffle(rng, edges);
        const maxMoves = rng() < 0.1 ? 1000000000 : ri(rng, rng() < 0.05 ? 0 : 1, pick(rng, [3, 12, 40]));
        return { input: `${fmtIntMat(edges)}\n${maxMoves}\n${n}`, expectedOutput: String(ref(edges, maxMoves, n)) };
      },
      solutions: {
        python: code`
          import heapq
          from typing import List

          def reachableNodes(edges: List[List[int]], maxMoves: int, n: int) -> int:
              adj = [[] for _ in range(n)]
              for u, v, cnt in edges:
                  adj[u].append((v, cnt + 1))
                  adj[v].append((u, cnt + 1))
              INF = float('inf')
              dist = [INF] * n
              dist[0] = 0
              heap = [(0, 0)]
              while heap:
                  d, x = heapq.heappop(heap)
                  if d > dist[x]:
                      continue
                  for y, w in adj[x]:
                      if d + w < dist[y]:
                          dist[y] = d + w
                          heapq.heappush(heap, (d + w, y))
              total = sum(1 for x in range(n) if dist[x] <= maxMoves)
              for u, v, cnt in edges:
                  a = min(cnt, max(0, maxMoves - dist[u])) if dist[u] != INF else 0
                  b = min(cnt, max(0, maxMoves - dist[v])) if dist[v] != INF else 0
                  total += min(cnt, a + b)
              return total
        `,
        javascript: code`
          var reachableNodes = function(edges, maxMoves, n) {
              var adj = [], dist = [], done = [], INF = 2000000000;
              for (var i = 0; i < n; i++) { adj.push([]); dist.push(INF); done.push(false); }
              for (var k = 0; k < edges.length; k++) {
                  var e = edges[k];
                  adj[e[0]].push([e[1], e[2] + 1]);
                  adj[e[1]].push([e[0], e[2] + 1]);
              }
              dist[0] = 0;
              // Array-based Dijkstra: n is at most 3000, so O(n^2) is fine.
              for (var it = 0; it < n; it++) {
                  var x = -1;
                  for (var j = 0; j < n; j++) if (!done[j] && dist[j] < INF && (x === -1 || dist[j] < dist[x])) x = j;
                  if (x === -1) break;
                  done[x] = true;
                  for (var a = 0; a < adj[x].length; a++) {
                      var y = adj[x][a][0], w = adj[x][a][1];
                      if (dist[x] + w < dist[y]) dist[y] = dist[x] + w;
                  }
              }
              var total = 0;
              for (var z = 0; z < n; z++) if (dist[z] <= maxMoves) total++;
              for (var q = 0; q < edges.length; q++) {
                  var u = edges[q][0], v = edges[q][1], cnt = edges[q][2];
                  var left = Math.min(cnt, Math.max(0, maxMoves - dist[u]));
                  var right = Math.min(cnt, Math.max(0, maxMoves - dist[v]));
                  total += Math.min(cnt, left + right);
              }
              return total;
          };
        `,
        typescript: code`
          function reachableNodes(edges: number[][], maxMoves: number, n: number): number {
              var adj: number[][][] = [], dist: number[] = [], done: boolean[] = [], INF = 2000000000;
              for (var i = 0; i < n; i++) { adj.push([]); dist.push(INF); done.push(false); }
              for (var k = 0; k < edges.length; k++) {
                  var e = edges[k];
                  adj[e[0]].push([e[1], e[2] + 1]);
                  adj[e[1]].push([e[0], e[2] + 1]);
              }
              dist[0] = 0;
              for (var it = 0; it < n; it++) {
                  var x = -1;
                  for (var j = 0; j < n; j++) if (!done[j] && dist[j] < INF && (x === -1 || dist[j] < dist[x])) x = j;
                  if (x === -1) break;
                  done[x] = true;
                  for (var a = 0; a < adj[x].length; a++) {
                      var y = adj[x][a][0], w = adj[x][a][1];
                      if (dist[x] + w < dist[y]) dist[y] = dist[x] + w;
                  }
              }
              var total = 0;
              for (var z = 0; z < n; z++) if (dist[z] <= maxMoves) total++;
              for (var q = 0; q < edges.length; q++) {
                  var u = edges[q][0], v = edges[q][1], cnt = edges[q][2];
                  var left = Math.min(cnt, Math.max(0, maxMoves - dist[u]));
                  var right = Math.min(cnt, Math.max(0, maxMoves - dist[v]));
                  total += Math.min(cnt, left + right);
              }
              return total;
          }
        `,
        java: code`
          public static int reachableNodes(int[][] edges, int maxMoves, int n) {
              List<List<int[]>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(new int[]{e[1], e[2] + 1}); adj.get(e[1]).add(new int[]{e[0], e[2] + 1}); }
              final int INF = Integer.MAX_VALUE;
              int[] dist = new int[n];
              Arrays.fill(dist, INF);
              dist[0] = 0;
              PriorityQueue<int[]> pq = new PriorityQueue<>((x, y) -> Integer.compare(x[0], y[0]));
              pq.add(new int[]{0, 0});
              while (!pq.isEmpty()) {
                  int[] top = pq.poll();
                  int d = top[0], x = top[1];
                  if (d > dist[x]) continue;
                  for (int[] nb : adj.get(x)) {
                      if (d + nb[1] < dist[nb[0]]) { dist[nb[0]] = d + nb[1]; pq.add(new int[]{dist[nb[0]], nb[0]}); }
                  }
              }
              int total = 0;
              for (int x = 0; x < n; x++) if (dist[x] <= maxMoves) total++;
              for (int[] e : edges) {
                  int a = dist[e[0]] == INF ? 0 : Math.min(e[2], Math.max(0, maxMoves - dist[e[0]]));
                  int b = dist[e[1]] == INF ? 0 : Math.min(e[2], Math.max(0, maxMoves - dist[e[1]]));
                  total += Math.min(e[2], a + b);
              }
              return total;
          }
        `,
        cpp: code`
          int reachableNodes(vector<vector<int>>& edges, int maxMoves, int n) {
              vector<vector<pair<int, int>>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back({e[1], e[2] + 1}); adj[e[1]].push_back({e[0], e[2] + 1}); }
              const int INF = INT_MAX;
              vector<int> dist(n, INF);
              dist[0] = 0;
              priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
              pq.push({0, 0});
              while (!pq.empty()) {
                  int d = pq.top().first, x = pq.top().second;
                  pq.pop();
                  if (d > dist[x]) continue;
                  for (auto& e : adj[x]) {
                      int y = e.first, w = e.second;
                      if (d + w < dist[y]) { dist[y] = d + w; pq.push({dist[y], y}); }
                  }
              }
              int total = 0;
              for (int x = 0; x < n; x++) if (dist[x] <= maxMoves) total++;
              for (auto& e : edges) {
                  int a = dist[e[0]] == INF ? 0 : min(e[2], max(0, maxMoves - dist[e[0]]));
                  int b = dist[e[1]] == INF ? 0 : min(e[2], max(0, maxMoves - dist[e[1]]));
                  total += min(e[2], a + b);
              }
              return total;
          }
        `,
        c: code`
          int reachableNodes(int** edges, int edgesSize, int* edgesColSize, int maxMoves, int n) {
              const int INF = 2147483647;
              int* start = (int*)calloc(n + 1, sizeof(int));
              int* to = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              int* wt = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int i = 0; i < edgesSize; i++) { start[edges[i][0] + 1]++; start[edges[i][1] + 1]++; }
              for (int i = 0; i < n; i++) start[i + 1] += start[i];
              int* pos = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i <= n; i++) pos[i] = start[i];
              for (int i = 0; i < edgesSize; i++) {
                  int u = edges[i][0], v = edges[i][1], w = edges[i][2] + 1;
                  to[pos[u]] = v; wt[pos[u]++] = w;
                  to[pos[v]] = u; wt[pos[v]++] = w;
              }
              int* dist = (int*)malloc(n * sizeof(int));
              char* done = (char*)calloc(n, 1);
              for (int i = 0; i < n; i++) dist[i] = INF;
              dist[0] = 0;
              /* Array-based Dijkstra: n <= 3000. */
              for (int it = 0; it < n; it++) {
                  int x = -1;
                  for (int j = 0; j < n; j++) if (!done[j] && dist[j] != INF && (x == -1 || dist[j] < dist[x])) x = j;
                  if (x == -1) break;
                  done[x] = 1;
                  for (int k = start[x]; k < start[x + 1]; k++)
                      if (dist[x] + wt[k] < dist[to[k]]) dist[to[k]] = dist[x] + wt[k];
              }
              int total = 0;
              for (int x = 0; x < n; x++) if (dist[x] <= maxMoves) total++;
              for (int i = 0; i < edgesSize; i++) {
                  int u = edges[i][0], v = edges[i][1], cnt = edges[i][2];
                  int a = 0, b = 0;
                  if (dist[u] != INF && maxMoves > dist[u]) a = maxMoves - dist[u] < cnt ? maxMoves - dist[u] : cnt;
                  if (dist[v] != INF && maxMoves > dist[v]) b = maxMoves - dist[v] < cnt ? maxMoves - dist[v] : cnt;
                  total += a + b < cnt ? a + b : cnt;
              }
              free(start); free(to); free(wt); free(pos); free(dist); free(done);
              return total;
          }
        `,
        csharp: code`
          public static int ReachableNodes(int[][] edges, int maxMoves, int n)
          {
              const int INF = int.MaxValue;
              var adj = new List<int[]>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int[]>();
              foreach (var e in edges) { adj[e[0]].Add(new int[] { e[1], e[2] + 1 }); adj[e[1]].Add(new int[] { e[0], e[2] + 1 }); }
              var dist = new int[n];
              var done = new bool[n];
              for (int i = 0; i < n; i++) dist[i] = INF;
              dist[0] = 0;
              for (int it = 0; it < n; it++)
              {
                  int x = -1;
                  for (int j = 0; j < n; j++) if (!done[j] && dist[j] != INF && (x == -1 || dist[j] < dist[x])) x = j;
                  if (x == -1) break;
                  done[x] = true;
                  foreach (var nb in adj[x]) if (dist[x] + nb[1] < dist[nb[0]]) dist[nb[0]] = dist[x] + nb[1];
              }
              int total = 0;
              for (int x = 0; x < n; x++) if (dist[x] <= maxMoves) total++;
              foreach (var e in edges)
              {
                  int a = dist[e[0]] == INF ? 0 : Math.Min(e[2], Math.Max(0, maxMoves - dist[e[0]]));
                  int b = dist[e[1]] == INF ? 0 : Math.Min(e[2], Math.Max(0, maxMoves - dist[e[1]]));
                  total += Math.Min(e[2], a + b);
              }
              return total;
          }
        `,
        go: code`
          func reachableNodes(edges [][]int, maxMoves int, n int) int {
              const INF = 1 << 60
              type arc struct{ to, w int }
              adj := make([][]arc, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], arc{e[1], e[2] + 1})
                  adj[e[1]] = append(adj[e[1]], arc{e[0], e[2] + 1})
              }
              dist := make([]int, n)
              done := make([]bool, n)
              for i := range dist {
                  dist[i] = INF
              }
              dist[0] = 0
              for it := 0; it < n; it++ {
                  x := -1
                  for j := 0; j < n; j++ {
                      if !done[j] && dist[j] < INF && (x == -1 || dist[j] < dist[x]) {
                          x = j
                      }
                  }
                  if x == -1 {
                      break
                  }
                  done[x] = true
                  for _, a := range adj[x] {
                      if dist[x]+a.w < dist[a.to] {
                          dist[a.to] = dist[x] + a.w
                      }
                  }
              }
              total := 0
              for x := 0; x < n; x++ {
                  if dist[x] <= maxMoves {
                      total++
                  }
              }
              left := func(d, cnt int) int {
                  if d >= maxMoves {
                      return 0
                  }
                  if maxMoves-d < cnt {
                      return maxMoves - d
                  }
                  return cnt
              }
              for _, e := range edges {
                  s := left(dist[e[0]], e[2]) + left(dist[e[1]], e[2])
                  if s > e[2] {
                      s = e[2]
                  }
                  total += s
              }
              return total
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun reachableNodes(edges: Array<IntArray>, maxMoves: Int, n: Int): Int {
              val adj = Array(n) { ArrayList<IntArray>() }
              for (e in edges) { adj[e[0]].add(intArrayOf(e[1], e[2] + 1)); adj[e[1]].add(intArrayOf(e[0], e[2] + 1)) }
              val inf = Int.MAX_VALUE
              val dist = IntArray(n) { inf }
              dist[0] = 0
              val pq = PriorityQueue<IntArray>(compareBy { it[0] })
              pq.add(intArrayOf(0, 0))
              while (pq.isNotEmpty()) {
                  val top = pq.poll()
                  val d = top[0]
                  val x = top[1]
                  if (d > dist[x]) continue
                  for (nb in adj[x]) {
                      if (d + nb[1] < dist[nb[0]]) { dist[nb[0]] = d + nb[1]; pq.add(intArrayOf(dist[nb[0]], nb[0])) }
                  }
              }
              var total = dist.count { it <= maxMoves }
              for (e in edges) {
                  val a = if (dist[e[0]] == inf) 0 else minOf(e[2], maxOf(0, maxMoves - dist[e[0]]))
                  val b = if (dist[e[1]] == inf) 0 else minOf(e[2], maxOf(0, maxMoves - dist[e[1]]))
                  total += minOf(e[2], a + b)
              }
              return total
          }
        `,
        swift: code`
          func reachableNodes(_ edges: [[Int]], _ maxMoves: Int, _ n: Int) -> Int {
              let inf = Int.max / 4
              var adj = [[(Int, Int)]](repeating: [], count: n)
              for e in edges { adj[e[0]].append((e[1], e[2] + 1)); adj[e[1]].append((e[0], e[2] + 1)) }
              var dist = [Int](repeating: inf, count: n)
              var done = [Bool](repeating: false, count: n)
              dist[0] = 0
              for _ in 0..<n {
                  var x = -1
                  for j in 0..<n where !done[j] && dist[j] < inf && (x == -1 || dist[j] < dist[x]) { x = j }
                  if x == -1 { break }
                  done[x] = true
                  for (y, w) in adj[x] where dist[x] + w < dist[y] { dist[y] = dist[x] + w }
              }
              var total = dist.filter { $0 <= maxMoves }.count
              for e in edges {
                  let a = min(e[2], max(0, maxMoves - dist[e[0]]))
                  let b = min(e[2], max(0, maxMoves - dist[e[1]]))
                  total += min(e[2], a + b)
              }
              return total
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn reachableNodes(edges: Vec<Vec<i32>>, max_moves: i32, n: i32) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push((e[1] as usize, e[2] as i64 + 1));
                  adj[e[1] as usize].push((e[0] as usize, e[2] as i64 + 1));
              }
              let inf = std::i64::MAX / 4;
              let mut dist = vec![inf; n];
              dist[0] = 0;
              let mut heap = BinaryHeap::new();
              heap.push(Reverse((0i64, 0usize)));
              while let Some(Reverse((d, x))) = heap.pop() {
                  if d > dist[x] {
                      continue;
                  }
                  for &(y, w) in adj[x].iter() {
                      if d + w < dist[y] {
                          dist[y] = d + w;
                          heap.push(Reverse((d + w, y)));
                      }
                  }
              }
              let m = max_moves as i64;
              let mut total: i64 = dist.iter().filter(|&&d| d <= m).count() as i64;
              for e in edges.iter() {
                  let cnt = e[2] as i64;
                  let a = cnt.min((m - dist[e[0] as usize]).max(0));
                  let b = cnt.min((m - dist[e[1] as usize]).max(0));
                  total += cnt.min(a + b);
              }
              total as i32
          }
        `,
        php: code`
          function reachableNodes($edges, $maxMoves, $n) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = [$e[1], $e[2] + 1]; $adj[$e[1]][] = [$e[0], $e[2] + 1]; }
              $INF = PHP_INT_MAX >> 2;
              $dist = array_fill(0, $n, $INF);
              $dist[0] = 0;
              $pq = new \SplPriorityQueue();
              $pq->insert(0, 0);
              while (!$pq->isEmpty()) {
                  $pq->setExtractFlags(\SplPriorityQueue::EXTR_BOTH);
                  $top = $pq->extract();
                  $x = $top['data'];
                  $d = -$top['priority'];
                  if ($d > $dist[$x]) continue;
                  foreach ($adj[$x] as $nb) {
                      if ($d + $nb[1] < $dist[$nb[0]]) { $dist[$nb[0]] = $d + $nb[1]; $pq->insert($nb[0], -$dist[$nb[0]]); }
                  }
              }
              $total = 0;
              for ($x = 0; $x < $n; $x++) if ($dist[$x] <= $maxMoves) $total++;
              foreach ($edges as $e) {
                  $a = min($e[2], max(0, $maxMoves - $dist[$e[0]]));
                  $b = min($e[2], max(0, $maxMoves - $dist[$e[1]]));
                  $total += min($e[2], $a + $b);
              }
              return $total;
          }
        `,
        ruby: code`
          def reachableNodes(edges, maxMoves, n)
            adj = Array.new(n) { [] }
            edges.each do |u, v, cnt|
              adj[u] << [v, cnt + 1]
              adj[v] << [u, cnt + 1]
            end
            inf = Float::INFINITY
            dist = Array.new(n, inf)
            done = Array.new(n, false)
            dist[0] = 0
            # Array-based Dijkstra: n is at most 3000.
            n.times do
              x = -1
              n.times { |j| x = j if !done[j] && dist[j] < inf && (x == -1 || dist[j] < dist[x]) }
              break if x == -1
              done[x] = true
              adj[x].each { |y, w| dist[y] = dist[x] + w if dist[x] + w < dist[y] }
            end
            total = dist.count { |d| d <= maxMoves }
            edges.each do |u, v, cnt|
              a = dist[u] == inf ? 0 : [cnt, [0, maxMoves - dist[u]].max].min
              b = dist[v] == inf ? 0 : [cnt, [0, maxMoves - dist[v]].max].min
              total += [cnt, a + b].min
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Cat and Mouse (LC 913) ──────────────────────────────────────
  (() => {
    // Fixed-point minimax: repeat until nothing changes, deciding a state
    // once one move wins or every move loses. The least fixed point is the
    // retrograde colouring the solutions compute with a queue.
    const ref = (graph: number[][]) => {
      const n = graph.length;
      const val: number[][][] = Array.from({ length: n }, () => Array.from({ length: n }, () => [0, 0]));
      for (let c = 1; c < n; c++) for (let t = 0; t < 2; t++) { val[0][c][t] = 1; val[c][c][t] = 2; }
      for (let changed = true; changed;) {
        changed = false;
        for (let m = 1; m < n; m++) for (let c = 1; c < n; c++) {
          if (m === c) continue;
          if (val[m][c][0] === 0) {
            const kids = graph[m].map((v) => val[v][c][1]);
            const r = kids.some((x) => x === 1) ? 1 : kids.every((x) => x === 2) ? 2 : 0;
            if (r) { val[m][c][0] = r; changed = true; }
          }
          if (val[m][c][1] === 0) {
            const kids = graph[c].filter((v) => v !== 0).map((v) => val[m][v][0]);
            const r = kids.some((x) => x === 2) ? 2 : kids.every((x) => x === 1) ? 1 : 0;
            if (r) { val[m][c][1] = r; changed = true; }
          }
        }
      }
      return val[1][2][0];
    };
    return {
      slug: "cat-and-mouse",
      title: "Cat and Mouse",
      difficulty: "HARD" as const,
      tags: ["Graph", "Topological Sort", "Memoization", "Math", "Dynamic Programming", "Game Theory", "Google", "Amazon"],
      signature: { funcName: "catMouseGame", params: [{ name: "graph", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A mouse and a cat play a game on an undirected graph given as an adjacency list: `graph[a]` lists every node `b` joined to `a`.\n\nThe mouse starts at node `1` and moves first; the cat starts at node `2`; node `0` is the hole. On each turn the player to move **must** travel along one edge from its current node. The cat may never enter the hole.\n\nThe game ends when:\n\n- the cat reaches the mouse's node — the **cat wins**;\n- the mouse reaches the hole — the **mouse wins**;\n- a position (both nodes and whose turn it is) repeats — the game is a **draw**.\n\nAssuming both play optimally, return `1` if the mouse wins, `2` if the cat wins, or `0` for a draw.",
        [
          { in: "graph = [[2,5],[3],[0,4,5],[1,4,5],[2,3],[0,2,3]]", out: "0" },
          { in: "graph = [[1,3],[0],[3],[0,2]]", out: "1", note: "The mouse steps straight from node 1 into the hole." },
          { in: "graph = [[2],[2],[0,1]]", out: "2", note: "The mouse's only move is onto the cat's node 2." },
        ],
        ["3 <= graph.length <= 50", "1 <= graph[i].length < graph.length", "0 <= graph[i][j] < graph.length", "graph[i][j] != i", "graph[i] has no duplicates", "b is in graph[a] exactly when a is in graph[b]", "the cat and the mouse can always move"]),
      hints: [
        "A game state is `(mouse node, cat node, whose turn)` — at most `2 · n^2` of them. The outcome of the game is a function of the state.",
        "Some states are decided outright: mouse in the hole (mouse wins) and mouse and cat on the same node (cat wins). Propagate backwards from them.",
        "A state is a win for the player to move if **some** move reaches a state they win; it is a loss if **all** moves reach states the opponent wins. Track how many undecided moves each state has left; whatever is never decided is a draw.",
      ],
      editorial: explain({
        idea: "Plain DFS with memoisation gets draws wrong, because a state's value can depend on states still on the stack. Retrograde analysis avoids that: start from the decided terminal states and work backwards, the way endgame tables are built.",
        steps: [
          "Colour every state `(m, c, turn)` as undecided. Count, for each state, how many moves the player to move has (`degree`); the cat never counts the hole.",
          "Mark terminal states and push them on a queue: `(0, c, *)` mouse wins, `(c, c, *)` cat wins, for every `c >= 1`.",
          "Pop a decided state. For each undecided parent (a state one move earlier, by the other player): if the parent's mover wins in the popped state, the parent is a win for that mover; otherwise decrement the parent's degree, and when it hits zero every move loses, so the parent is a loss for its mover. Push newly decided parents.",
          "Return the colour of `(1, 2, mouse to move)`; undecided means draw (`0`).",
        ],
        why: "Each step decides a state only from facts already proven: one winning move suffices, and a loss needs every move to be proven losing. Any state that can be forced to a terminal outcome in finitely many moves is eventually reached by this propagation. A state never decided has, for its mover, at least one move that avoids a forced loss forever — with optimal play the game repeats a position, which is a draw.",
        time: "O(n^3)",
        space: "O(n^2)",
        pitfalls: [
          "Do not let the cat move into node `0` — not when generating parents, and not when counting its degree.",
          "Terminal states have no outgoing moves to count; never decrement their degree.",
          "A top-down DFS that treats \"currently on the stack\" as a draw is wrong on some graphs; use the queue-based propagation.",
        ],
      }),
      examples: [
        { input: "[[2,5],[3],[0,4,5],[1,4,5],[2,3],[0,2,3]]", expectedOutput: "0" },
        { input: "[[1,3],[0],[3],[0,2]]", expectedOutput: "1" },
        { input: "[[2],[2],[0,1]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const n = ri(rng, 3, pick(rng, [4, 6, 8, 11]));
          const p = pick(rng, [0.2, 0.35, 0.55]);
          const adj: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
          // Few edges into the hole keep the mouse from always walking straight in.
          const p0 = pick(rng, [p, 0.15]);
          for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (rng() < (u === 0 ? p0 : p)) { adj[u].add(v); adj[v].add(u); }
          if (adj[0].size === 0) { const v = ri(rng, 1, n - 1); adj[0].add(v); adj[v].add(0); }
          let ok = true;
          for (let u = 1; u < n && ok; u++) if ([...adj[u]].filter((v) => v !== 0).length === 0) ok = false;
          if (!ok) continue;
          const graph = adj.map((s) => shuffle(rng, [...s]));
          return { input: fmtIntMat(graph), expectedOutput: String(ref(graph)) };
        }
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def catMouseGame(graph: List[List[int]]) -> int:
              n = len(graph)
              MOUSE, CAT = 1, 2
              color = [[[0, 0] for _ in range(n)] for _ in range(n)]
              degree = [[[len(graph[m]), len(graph[c]) - (0 in graph[c])] for c in range(n)] for m in range(n)]
              q = deque()
              for c in range(1, n):
                  for t in range(2):
                      color[0][c][t] = MOUSE
                      q.append((0, c, t))
                      color[c][c][t] = CAT
                      q.append((c, c, t))
              while q:
                  m, c, t = q.popleft()
                  res = color[m][c][t]
                  if t == 1:
                      # the mouse moved into this state: parents have the mouse to move
                      for pm in graph[m]:
                          if color[pm][c][0]:
                              continue
                          if res == MOUSE:
                              color[pm][c][0] = MOUSE
                              q.append((pm, c, 0))
                          else:
                              degree[pm][c][0] -= 1
                              if degree[pm][c][0] == 0:
                                  color[pm][c][0] = CAT
                                  q.append((pm, c, 0))
                  else:
                      for pc in graph[c]:
                          if pc == 0 or color[m][pc][1]:
                              continue
                          if res == CAT:
                              color[m][pc][1] = CAT
                              q.append((m, pc, 1))
                          else:
                              degree[m][pc][1] -= 1
                              if degree[m][pc][1] == 0:
                                  color[m][pc][1] = MOUSE
                                  q.append((m, pc, 1))
              return color[1][2][0]
        `,
        javascript: code`
          var catMouseGame = function(graph) {
              var n = graph.length, MOUSE = 1, CAT = 2;
              var color = [], degree = [];
              var idx = function(m, c, t) { return (m * n + c) * 2 + t; };
              for (var m = 0; m < n; m++) {
                  for (var c = 0; c < n; c++) {
                      var catDeg = graph[c].length - (graph[c].indexOf(0) >= 0 ? 1 : 0);
                      color.push(0, 0);
                      degree.push(graph[m].length, catDeg);
                  }
              }
              var q = [];
              for (var k = 1; k < n; k++) {
                  for (var t = 0; t < 2; t++) {
                      color[idx(0, k, t)] = MOUSE; q.push([0, k, t]);
                      color[idx(k, k, t)] = CAT; q.push([k, k, t]);
                  }
              }
              for (var h = 0; h < q.length; h++) {
                  var cm = q[h][0], cc = q[h][1], ct = q[h][2], res = color[idx(cm, cc, ct)];
                  if (ct === 1) {
                      for (var a = 0; a < graph[cm].length; a++) {
                          var p = idx(graph[cm][a], cc, 0);
                          if (color[p]) continue;
                          if (res === MOUSE || --degree[p] === 0) { color[p] = res === MOUSE ? MOUSE : CAT; q.push([graph[cm][a], cc, 0]); }
                      }
                  } else {
                      for (var b = 0; b < graph[cc].length; b++) {
                          var pc = graph[cc][b];
                          if (pc === 0) continue;
                          var p2 = idx(cm, pc, 1);
                          if (color[p2]) continue;
                          if (res === CAT || --degree[p2] === 0) { color[p2] = res === CAT ? CAT : MOUSE; q.push([cm, pc, 1]); }
                      }
                  }
              }
              return color[idx(1, 2, 0)];
          };
        `,
        typescript: code`
          function catMouseGame(graph: number[][]): number {
              var n = graph.length, MOUSE = 1, CAT = 2;
              var color: number[] = [], degree: number[] = [];
              function idx(m: number, c: number, t: number): number { return (m * n + c) * 2 + t; }
              for (var m = 0; m < n; m++) {
                  for (var c = 0; c < n; c++) {
                      var catDeg = graph[c].length - (graph[c].indexOf(0) >= 0 ? 1 : 0);
                      color.push(0, 0);
                      degree.push(graph[m].length, catDeg);
                  }
              }
              var q: number[][] = [];
              for (var k = 1; k < n; k++) {
                  for (var t = 0; t < 2; t++) {
                      color[idx(0, k, t)] = MOUSE; q.push([0, k, t]);
                      color[idx(k, k, t)] = CAT; q.push([k, k, t]);
                  }
              }
              for (var h = 0; h < q.length; h++) {
                  var cm = q[h][0], cc = q[h][1], ct = q[h][2], res = color[idx(cm, cc, ct)];
                  if (ct === 1) {
                      for (var a = 0; a < graph[cm].length; a++) {
                          var p = idx(graph[cm][a], cc, 0);
                          if (color[p]) continue;
                          if (res === MOUSE || --degree[p] === 0) { color[p] = res === MOUSE ? MOUSE : CAT; q.push([graph[cm][a], cc, 0]); }
                      }
                  } else {
                      for (var b = 0; b < graph[cc].length; b++) {
                          var pc = graph[cc][b];
                          if (pc === 0) continue;
                          var p2 = idx(cm, pc, 1);
                          if (color[p2]) continue;
                          if (res === CAT || --degree[p2] === 0) { color[p2] = res === CAT ? CAT : MOUSE; q.push([cm, pc, 1]); }
                      }
                  }
              }
              return color[idx(1, 2, 0)];
          }
        `,
        java: code`
          public static int catMouseGame(int[][] graph) {
              int n = graph.length;
              int[] color = new int[n * n * 2], degree = new int[n * n * 2];
              for (int m = 0; m < n; m++)
                  for (int c = 0; c < n; c++) {
                      int catDeg = graph[c].length;
                      for (int v : graph[c]) if (v == 0) catDeg--;
                      degree[(m * n + c) * 2] = graph[m].length;
                      degree[(m * n + c) * 2 + 1] = catDeg;
                  }
              int[] q = new int[n * n * 2];
              int head = 0, tail = 0;
              for (int c = 1; c < n; c++)
                  for (int t = 0; t < 2; t++) {
                      color[(c) * 2 + t] = 1; q[tail++] = c * 2 + t;
                      color[(c * n + c) * 2 + t] = 2; q[tail++] = (c * n + c) * 2 + t;
                  }
              while (head < tail) {
                  int s = q[head++], t = s % 2, m = s / 2 / n, c = s / 2 % n, res = color[s];
                  if (t == 1) {
                      for (int pm : graph[m]) {
                          int p = (pm * n + c) * 2;
                          if (color[p] != 0) continue;
                          if (res == 1 || --degree[p] == 0) { color[p] = res == 1 ? 1 : 2; q[tail++] = p; }
                      }
                  } else {
                      for (int pc : graph[c]) {
                          if (pc == 0) continue;
                          int p = (m * n + pc) * 2 + 1;
                          if (color[p] != 0) continue;
                          if (res == 2 || --degree[p] == 0) { color[p] = res == 2 ? 2 : 1; q[tail++] = p; }
                      }
                  }
              }
              return color[(1 * n + 2) * 2];
          }
        `,
        cpp: code`
          int catMouseGame(vector<vector<int>>& graph) {
              int n = graph.size();
              vector<int> color(n * n * 2, 0), degree(n * n * 2, 0), q;
              for (int m = 0; m < n; m++)
                  for (int c = 0; c < n; c++) {
                      int catDeg = graph[c].size();
                      for (int v : graph[c]) if (v == 0) catDeg--;
                      degree[(m * n + c) * 2] = graph[m].size();
                      degree[(m * n + c) * 2 + 1] = catDeg;
                  }
              for (int c = 1; c < n; c++)
                  for (int t = 0; t < 2; t++) {
                      color[c * 2 + t] = 1; q.push_back(c * 2 + t);
                      color[(c * n + c) * 2 + t] = 2; q.push_back((c * n + c) * 2 + t);
                  }
              for (size_t h = 0; h < q.size(); h++) {
                  int s = q[h], t = s % 2, m = s / 2 / n, c = s / 2 % n, res = color[s];
                  if (t == 1) {
                      for (int pm : graph[m]) {
                          int p = (pm * n + c) * 2;
                          if (color[p]) continue;
                          if (res == 1 || --degree[p] == 0) { color[p] = res == 1 ? 1 : 2; q.push_back(p); }
                      }
                  } else {
                      for (int pc : graph[c]) {
                          if (pc == 0) continue;
                          int p = (m * n + pc) * 2 + 1;
                          if (color[p]) continue;
                          if (res == 2 || --degree[p] == 0) { color[p] = res == 2 ? 2 : 1; q.push_back(p); }
                      }
                  }
              }
              return color[(1 * n + 2) * 2];
          }
        `,
        c: code`
          int catMouseGame(int** graph, int graphSize, int* graphColSize) {
              int n = graphSize, S = n * n * 2;
              int* color = (int*)calloc(S, sizeof(int));
              int* degree = (int*)calloc(S, sizeof(int));
              int* q = (int*)malloc(S * sizeof(int));
              for (int m = 0; m < n; m++)
                  for (int c = 0; c < n; c++) {
                      int catDeg = graphColSize[c];
                      for (int k = 0; k < graphColSize[c]; k++) if (graph[c][k] == 0) catDeg--;
                      degree[(m * n + c) * 2] = graphColSize[m];
                      degree[(m * n + c) * 2 + 1] = catDeg;
                  }
              int head = 0, tail = 0;
              for (int c = 1; c < n; c++)
                  for (int t = 0; t < 2; t++) {
                      color[c * 2 + t] = 1; q[tail++] = c * 2 + t;
                      color[(c * n + c) * 2 + t] = 2; q[tail++] = (c * n + c) * 2 + t;
                  }
              while (head < tail) {
                  int s = q[head++], t = s % 2, m = s / 2 / n, c = s / 2 % n, res = color[s];
                  if (t == 1) {
                      for (int k = 0; k < graphColSize[m]; k++) {
                          int p = (graph[m][k] * n + c) * 2;
                          if (color[p]) continue;
                          if (res == 1 || --degree[p] == 0) { color[p] = res == 1 ? 1 : 2; q[tail++] = p; }
                      }
                  } else {
                      for (int k = 0; k < graphColSize[c]; k++) {
                          int pc = graph[c][k];
                          if (pc == 0) continue;
                          int p = (m * n + pc) * 2 + 1;
                          if (color[p]) continue;
                          if (res == 2 || --degree[p] == 0) { color[p] = res == 2 ? 2 : 1; q[tail++] = p; }
                      }
                  }
              }
              int ans = color[(1 * n + 2) * 2];
              free(color); free(degree); free(q);
              return ans;
          }
        `,
        csharp: code`
          public static int CatMouseGame(int[][] graph)
          {
              int n = graph.Length;
              var color = new int[n * n * 2];
              var degree = new int[n * n * 2];
              for (int m = 0; m < n; m++)
                  for (int c = 0; c < n; c++)
                  {
                      int catDeg = graph[c].Length;
                      foreach (int v in graph[c]) if (v == 0) catDeg--;
                      degree[(m * n + c) * 2] = graph[m].Length;
                      degree[(m * n + c) * 2 + 1] = catDeg;
                  }
              var q = new Queue<int>();
              for (int c = 1; c < n; c++)
                  for (int t = 0; t < 2; t++)
                  {
                      color[c * 2 + t] = 1; q.Enqueue(c * 2 + t);
                      color[(c * n + c) * 2 + t] = 2; q.Enqueue((c * n + c) * 2 + t);
                  }
              while (q.Count > 0)
              {
                  int s = q.Dequeue(), t = s % 2, m = s / 2 / n, c = s / 2 % n, res = color[s];
                  if (t == 1)
                  {
                      foreach (int pm in graph[m])
                      {
                          int p = (pm * n + c) * 2;
                          if (color[p] != 0) continue;
                          if (res == 1 || --degree[p] == 0) { color[p] = res == 1 ? 1 : 2; q.Enqueue(p); }
                      }
                  }
                  else
                  {
                      foreach (int pc in graph[c])
                      {
                          if (pc == 0) continue;
                          int p = (m * n + pc) * 2 + 1;
                          if (color[p] != 0) continue;
                          if (res == 2 || --degree[p] == 0) { color[p] = res == 2 ? 2 : 1; q.Enqueue(p); }
                      }
                  }
              }
              return color[(1 * n + 2) * 2];
          }
        `,
        go: code`
          func catMouseGame(graph [][]int) int {
              n := len(graph)
              color := make([]int, n*n*2)
              degree := make([]int, n*n*2)
              for m := 0; m < n; m++ {
                  for c := 0; c < n; c++ {
                      catDeg := len(graph[c])
                      for _, v := range graph[c] {
                          if v == 0 {
                              catDeg--
                          }
                      }
                      degree[(m*n+c)*2] = len(graph[m])
                      degree[(m*n+c)*2+1] = catDeg
                  }
              }
              q := []int{}
              for c := 1; c < n; c++ {
                  for t := 0; t < 2; t++ {
                      color[c*2+t] = 1
                      q = append(q, c*2+t)
                      color[(c*n+c)*2+t] = 2
                      q = append(q, (c*n+c)*2+t)
                  }
              }
              for h := 0; h < len(q); h++ {
                  s := q[h]
                  t, m, c, res := s%2, s/2/n, s/2%n, color[s]
                  if t == 1 {
                      for _, pm := range graph[m] {
                          p := (pm*n + c) * 2
                          if color[p] != 0 {
                              continue
                          }
                          if res == 1 {
                              color[p] = 1
                              q = append(q, p)
                          } else {
                              degree[p]--
                              if degree[p] == 0 {
                                  color[p] = 2
                                  q = append(q, p)
                              }
                          }
                      }
                  } else {
                      for _, pc := range graph[c] {
                          if pc == 0 {
                              continue
                          }
                          p := (m*n+pc)*2 + 1
                          if color[p] != 0 {
                              continue
                          }
                          if res == 2 {
                              color[p] = 2
                              q = append(q, p)
                          } else {
                              degree[p]--
                              if degree[p] == 0 {
                                  color[p] = 1
                                  q = append(q, p)
                              }
                          }
                      }
                  }
              }
              return color[(1*n+2)*2]
          }
        `,
        kotlin: code`
          fun catMouseGame(graph: Array<IntArray>): Int {
              val n = graph.size
              val color = IntArray(n * n * 2)
              val degree = IntArray(n * n * 2)
              for (m in 0 until n)
                  for (c in 0 until n) {
                      degree[(m * n + c) * 2] = graph[m].size
                      degree[(m * n + c) * 2 + 1] = graph[c].count { it != 0 }
                  }
              val q = IntArray(n * n * 2)
              var head = 0
              var tail = 0
              for (c in 1 until n)
                  for (t in 0 until 2) {
                      color[c * 2 + t] = 1; q[tail++] = c * 2 + t
                      color[(c * n + c) * 2 + t] = 2; q[tail++] = (c * n + c) * 2 + t
                  }
              while (head < tail) {
                  val s = q[head++]
                  val t = s % 2
                  val m = s / 2 / n
                  val c = s / 2 % n
                  val res = color[s]
                  if (t == 1) {
                      for (pm in graph[m]) {
                          val p = (pm * n + c) * 2
                          if (color[p] != 0) continue
                          if (res == 1 || --degree[p] == 0) { color[p] = if (res == 1) 1 else 2; q[tail++] = p }
                      }
                  } else {
                      for (pc in graph[c]) {
                          if (pc == 0) continue
                          val p = (m * n + pc) * 2 + 1
                          if (color[p] != 0) continue
                          if (res == 2 || --degree[p] == 0) { color[p] = if (res == 2) 2 else 1; q[tail++] = p }
                      }
                  }
              }
              return color[(1 * n + 2) * 2]
          }
        `,
        swift: code`
          func catMouseGame(_ graph: [[Int]]) -> Int {
              let n = graph.count
              var color = [Int](repeating: 0, count: n * n * 2)
              var degree = [Int](repeating: 0, count: n * n * 2)
              for m in 0..<n {
                  for c in 0..<n {
                      degree[(m * n + c) * 2] = graph[m].count
                      degree[(m * n + c) * 2 + 1] = graph[c].filter { $0 != 0 }.count
                  }
              }
              var q = [Int]()
              for c in 1..<n {
                  for t in 0..<2 {
                      color[c * 2 + t] = 1; q.append(c * 2 + t)
                      color[(c * n + c) * 2 + t] = 2; q.append((c * n + c) * 2 + t)
                  }
              }
              var h = 0
              while h < q.count {
                  let s = q[h]
                  h += 1
                  let t = s % 2, m = s / 2 / n, c = s / 2 % n, res = color[s]
                  if t == 1 {
                      for pm in graph[m] {
                          let p = (pm * n + c) * 2
                          if color[p] != 0 { continue }
                          if res == 1 { color[p] = 1; q.append(p); continue }
                          degree[p] -= 1
                          if degree[p] == 0 { color[p] = 2; q.append(p) }
                      }
                  } else {
                      for pc in graph[c] where pc != 0 {
                          let p = (m * n + pc) * 2 + 1
                          if color[p] != 0 { continue }
                          if res == 2 { color[p] = 2; q.append(p); continue }
                          degree[p] -= 1
                          if degree[p] == 0 { color[p] = 1; q.append(p) }
                      }
                  }
              }
              return color[(1 * n + 2) * 2]
          }
        `,
        rust: code`
          fn catMouseGame(graph: Vec<Vec<i32>>) -> i32 {
              let n = graph.len();
              let mut color = vec![0i32; n * n * 2];
              let mut degree = vec![0i32; n * n * 2];
              for m in 0..n {
                  for c in 0..n {
                      degree[(m * n + c) * 2] = graph[m].len() as i32;
                      degree[(m * n + c) * 2 + 1] = graph[c].iter().filter(|&&v| v != 0).count() as i32;
                  }
              }
              let mut q: Vec<usize> = Vec::new();
              for c in 1..n {
                  for t in 0..2 {
                      color[c * 2 + t] = 1;
                      q.push(c * 2 + t);
                      color[(c * n + c) * 2 + t] = 2;
                      q.push((c * n + c) * 2 + t);
                  }
              }
              let mut h = 0;
              while h < q.len() {
                  let s = q[h];
                  h += 1;
                  let (t, m, c, res) = (s % 2, s / 2 / n, s / 2 % n, color[s]);
                  if t == 1 {
                      for &pm in graph[m].iter() {
                          let p = (pm as usize * n + c) * 2;
                          if color[p] != 0 {
                              continue;
                          }
                          if res == 1 {
                              color[p] = 1;
                              q.push(p);
                          } else {
                              degree[p] -= 1;
                              if degree[p] == 0 {
                                  color[p] = 2;
                                  q.push(p);
                              }
                          }
                      }
                  } else {
                      for &pc in graph[c].iter() {
                          if pc == 0 {
                              continue;
                          }
                          let p = (m * n + pc as usize) * 2 + 1;
                          if color[p] != 0 {
                              continue;
                          }
                          if res == 2 {
                              color[p] = 2;
                              q.push(p);
                          } else {
                              degree[p] -= 1;
                              if degree[p] == 0 {
                                  color[p] = 1;
                                  q.push(p);
                              }
                          }
                      }
                  }
              }
              color[(n + 2) * 2]
          }
        `,
        php: code`
          function catMouseGame($graph) {
              $n = count($graph);
              $S = $n * $n * 2;
              $color = array_fill(0, $S, 0);
              $degree = array_fill(0, $S, 0);
              for ($m = 0; $m < $n; $m++)
                  for ($c = 0; $c < $n; $c++) {
                      $catDeg = count($graph[$c]) - (in_array(0, $graph[$c]) ? 1 : 0);
                      $degree[($m * $n + $c) * 2] = count($graph[$m]);
                      $degree[($m * $n + $c) * 2 + 1] = $catDeg;
                  }
              $q = [];
              for ($c = 1; $c < $n; $c++)
                  for ($t = 0; $t < 2; $t++) {
                      $color[$c * 2 + $t] = 1; $q[] = $c * 2 + $t;
                      $color[($c * $n + $c) * 2 + $t] = 2; $q[] = ($c * $n + $c) * 2 + $t;
                  }
              for ($h = 0; $h < count($q); $h++) {
                  $s = $q[$h];
                  $t = $s % 2;
                  $m = intdiv(intdiv($s, 2), $n);
                  $c = intdiv($s, 2) % $n;
                  $res = $color[$s];
                  if ($t == 1) {
                      foreach ($graph[$m] as $pm) {
                          $p = ($pm * $n + $c) * 2;
                          if ($color[$p]) continue;
                          if ($res == 1 || --$degree[$p] == 0) { $color[$p] = $res == 1 ? 1 : 2; $q[] = $p; }
                      }
                  } else {
                      foreach ($graph[$c] as $pc) {
                          if ($pc == 0) continue;
                          $p = ($m * $n + $pc) * 2 + 1;
                          if ($color[$p]) continue;
                          if ($res == 2 || --$degree[$p] == 0) { $color[$p] = $res == 2 ? 2 : 1; $q[] = $p; }
                      }
                  }
              }
              return $color[(1 * $n + 2) * 2];
          }
        `,
        ruby: code`
          def catMouseGame(graph)
            n = graph.length
            color = Array.new(n * n * 2, 0)
            degree = Array.new(n * n * 2, 0)
            n.times do |m|
              n.times do |c|
                degree[(m * n + c) * 2] = graph[m].length
                degree[(m * n + c) * 2 + 1] = graph[c].count { |v| v != 0 }
              end
            end
            q = []
            (1...n).each do |c|
              2.times do |t|
                color[c * 2 + t] = 1
                q << c * 2 + t
                color[(c * n + c) * 2 + t] = 2
                q << (c * n + c) * 2 + t
              end
            end
            h = 0
            while h < q.length
              s = q[h]
              h += 1
              t = s % 2
              m, c = (s / 2).divmod(n)
              res = color[s]
              if t == 1
                graph[m].each do |pm|
                  p = (pm * n + c) * 2
                  next if color[p] != 0
                  if res == 1
                    color[p] = 1
                    q << p
                  else
                    degree[p] -= 1
                    if degree[p] == 0
                      color[p] = 2
                      q << p
                    end
                  end
                end
              else
                graph[c].each do |pc|
                  next if pc == 0
                  p = (m * n + pc) * 2 + 1
                  next if color[p] != 0
                  if res == 2
                    color[p] = 2
                    q << p
                  else
                    degree[p] -= 1
                    if degree[p] == 0
                      color[p] = 1
                      q << p
                    end
                  end
                end
              end
            end
            color[(n + 2) * 2]
          end
        `,
      },
    };
  })(),

  // ── Minimize Malware Spread II (LC 928) ─────────────────────────
  (() => {
    const ref = (graph: number[][], initial: number[]) => {
      const n = graph.length;
      let best = -1, bestCount = Infinity;
      for (const rem of [...initial].sort((a, b) => a - b)) {
        const inf = new Array(n).fill(false);
        const q: number[] = [];
        for (const s of initial) if (s !== rem) { inf[s] = true; q.push(s); }
        for (let h = 0; h < q.length; h++) for (let v = 0; v < n; v++) {
          if (v !== rem && graph[q[h]][v] === 1 && !inf[v]) { inf[v] = true; q.push(v); }
        }
        if (q.length < bestCount) { bestCount = q.length; best = rem; }
      }
      return best;
    };
    return {
      slug: "minimize-malware-spread-ii",
      title: "Minimize Malware Spread II",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Google", "Amazon"],
      signature: {
        funcName: "minMalwareSpread",
        params: [{ name: "graph", type: "int[][]" as const }, { name: "initial", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A network of `n` nodes is given as an `n x n` adjacency matrix `graph`, where `graph[i][j] == 1` means nodes `i` and `j` are directly connected.\n\nThe nodes in `initial` start infected by malware. Whenever two directly connected nodes have at least one infected, both become infected; this repeats until no more nodes can be infected. Let `M(initial)` be the final number of infected nodes.\n\nYou may remove exactly **one** node from `initial`, **deleting it from the network entirely** together with all its connections. Return the node whose removal makes `M(initial)` as small as possible. If several nodes tie, return the one with the **smallest index**.",
        [
          { in: "graph = [[1,1,0],[1,1,0],[0,0,1]], initial = [0,1]", out: "0", note: "Either removal leaves one infected node; 0 is the smaller index." },
          { in: "graph = [[1,1,0],[1,1,1],[0,1,1]], initial = [0,1]", out: "1", note: "Removing 1 cuts node 2 off from node 0, so only node 0 stays infected." },
          { in: "graph = [[1,1,0,0],[1,1,1,0],[0,1,1,1],[0,0,1,1]], initial = [0,1]", out: "1" },
        ],
        ["n == graph.length == graph[i].length", "2 <= n <= 300", "graph[i][j] is 0 or 1", "graph[i][j] == graph[j][i]", "graph[i][i] == 1", "1 <= initial.length < n", "0 <= initial[i] <= n - 1", "all the integers in initial are unique"]),
      hints: [
        "Removing an infected node `u` saves exactly the clean nodes that would have been infected **only** through `u`.",
        "For each infected node, search outward through **clean** nodes only (stop at other infected nodes). Record, for every clean node, which infected sources reach it.",
        "A clean node reached by exactly one source is credited to that source. Return the source with the most credit, breaking ties by the smallest index.",
      ],
      editorial: explain({
        idea: "Unlike the first version of this problem, the removed node disappears from the graph, so it can no longer act as a bridge. A clean node is saved by removing `u` exactly when every path from the infection to it passes through `u` first — that is, when `u` is the only infected node that reaches it through clean nodes.",
        steps: [
          "Mark the initial nodes as infected.",
          "For each infected `u`, run a DFS/BFS from `u` that moves only into clean nodes. For every clean node `v` reached, increment `count[v]` and set `source[v] = u`.",
          "For each clean node with `count[v] == 1`, add one to `saved[source[v]]`.",
          "Return the initial node with the largest `saved`, smallest index on ties.",
        ],
        why: "With `u` deleted, a clean node `v` still gets infected iff some other infected node `w` reaches it by a path avoiding `u`. On such a path, the last infected node reaches `v` through clean nodes only, and it is not `u`, so `v` gets a count from a source other than `u`. Conversely a clean-only path from `w != u` survives the deletion. So `v` is saved iff `u` is its only clean-path source. Every node in `initial` stays infected except `u` itself, which is removed either way, so comparing `saved` compares `M(initial)`.",
        time: "O(k · n^2) with an adjacency matrix, k = initial.length",
        space: "O(n)",
        pitfalls: [
          "The searches must not pass through other infected nodes — they would credit a source with nodes another infection reaches anyway.",
          "When every node's `saved` is 0, the answer is the smallest index in `initial`, which need not be `initial[0]`.",
          "This is not LC 924: there the removed node stays in the graph and can still spread malware from neighbours.",
        ],
      }),
      examples: [
        { input: "[[1,1,0],[1,1,0],[0,0,1]]\n[0,1]", expectedOutput: "0" },
        { input: "[[1,1,0],[1,1,1],[0,1,1]]\n[0,1]", expectedOutput: "1" },
        { input: "[[1,1,0,0],[1,1,1,0],[0,1,1,1],[0,0,1,1]]\n[0,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 6, 10, 14]));
        const p = pick(rng, [0.1, 0.2, 0.35, 0.6]);
        const graph = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          graph[i][i] = 1;
          for (let j = i + 1; j < n; j++) if (rng() < p) { graph[i][j] = 1; graph[j][i] = 1; }
        }
        const k = ri(rng, 1, Math.max(1, Math.min(n - 1, pick(rng, [1, 2, 4, n - 1]))));
        const initial = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, k);
        return { input: `${fmtIntMat(graph)}\n${fmtIntArr(initial)}`, expectedOutput: String(ref(graph, initial)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minMalwareSpread(graph: List[List[int]], initial: List[int]) -> int:
              n = len(graph)
              infected = [False] * n
              for u in initial:
                  infected[u] = True
              count = [0] * n
              source = [-1] * n
              for u in initial:
                  seen = [False] * n
                  stack = [u]
                  seen[u] = True
                  while stack:
                      x = stack.pop()
                      row = graph[x]
                      for v in range(n):
                          if row[v] and not seen[v] and not infected[v]:
                              seen[v] = True
                              count[v] += 1
                              source[v] = u
                              stack.append(v)
              saved = [0] * n
              for v in range(n):
                  if count[v] == 1:
                      saved[source[v]] += 1
              best = -1
              for u in sorted(initial):
                  if best == -1 or saved[u] > saved[best]:
                      best = u
              return best
        `,
        javascript: code`
          var minMalwareSpread = function(graph, initial) {
              var n = graph.length, infected = [], count = [], source = [], saved = [];
              for (var i = 0; i < n; i++) { infected.push(false); count.push(0); source.push(-1); saved.push(0); }
              for (var a = 0; a < initial.length; a++) infected[initial[a]] = true;
              for (var b = 0; b < initial.length; b++) {
                  var u = initial[b], seen = [];
                  for (var s = 0; s < n; s++) seen.push(false);
                  seen[u] = true;
                  var stack = [u];
                  while (stack.length) {
                      var x = stack.pop();
                      for (var v = 0; v < n; v++) {
                          if (graph[x][v] === 1 && !seen[v] && !infected[v]) {
                              seen[v] = true; count[v]++; source[v] = u; stack.push(v);
                          }
                      }
                  }
              }
              for (var w = 0; w < n; w++) if (count[w] === 1) saved[source[w]]++;
              var best = -1;
              for (var c = 0; c < initial.length; c++) {
                  var node = initial[c];
                  if (best === -1 || saved[node] > saved[best] || (saved[node] === saved[best] && node < best)) best = node;
              }
              return best;
          };
        `,
        typescript: code`
          function minMalwareSpread(graph: number[][], initial: number[]): number {
              var n = graph.length, infected: boolean[] = [], count: number[] = [], source: number[] = [], saved: number[] = [];
              for (var i = 0; i < n; i++) { infected.push(false); count.push(0); source.push(-1); saved.push(0); }
              for (var a = 0; a < initial.length; a++) infected[initial[a]] = true;
              for (var b = 0; b < initial.length; b++) {
                  var u = initial[b], seen: boolean[] = [];
                  for (var s = 0; s < n; s++) seen.push(false);
                  seen[u] = true;
                  var stack: number[] = [u];
                  while (stack.length) {
                      var x = stack.pop() as number;
                      for (var v = 0; v < n; v++) {
                          if (graph[x][v] === 1 && !seen[v] && !infected[v]) {
                              seen[v] = true; count[v]++; source[v] = u; stack.push(v);
                          }
                      }
                  }
              }
              for (var w = 0; w < n; w++) if (count[w] === 1) saved[source[w]]++;
              var best = -1;
              for (var c = 0; c < initial.length; c++) {
                  var node = initial[c];
                  if (best === -1 || saved[node] > saved[best] || (saved[node] === saved[best] && node < best)) best = node;
              }
              return best;
          }
        `,
        java: code`
          public static int minMalwareSpread(int[][] graph, int[] initial) {
              int n = graph.length;
              boolean[] infected = new boolean[n];
              for (int u : initial) infected[u] = true;
              int[] count = new int[n], source = new int[n], saved = new int[n], stack = new int[n];
              for (int u : initial) {
                  boolean[] seen = new boolean[n];
                  seen[u] = true;
                  int top = 0;
                  stack[top++] = u;
                  while (top > 0) {
                      int x = stack[--top];
                      for (int v = 0; v < n; v++) {
                          if (graph[x][v] == 1 && !seen[v] && !infected[v]) {
                              seen[v] = true; count[v]++; source[v] = u; stack[top++] = v;
                          }
                      }
                  }
              }
              for (int v = 0; v < n; v++) if (count[v] == 1) saved[source[v]]++;
              int best = -1;
              for (int u : initial)
                  if (best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)) best = u;
              return best;
          }
        `,
        cpp: code`
          int minMalwareSpread(vector<vector<int>>& graph, vector<int>& initial) {
              int n = graph.size();
              vector<bool> infected(n, false);
              for (int u : initial) infected[u] = true;
              vector<int> count(n, 0), source(n, -1), saved(n, 0);
              for (int u : initial) {
                  vector<bool> seen(n, false);
                  seen[u] = true;
                  vector<int> st{u};
                  while (!st.empty()) {
                      int x = st.back(); st.pop_back();
                      for (int v = 0; v < n; v++) {
                          if (graph[x][v] == 1 && !seen[v] && !infected[v]) {
                              seen[v] = true; count[v]++; source[v] = u; st.push_back(v);
                          }
                      }
                  }
              }
              for (int v = 0; v < n; v++) if (count[v] == 1) saved[source[v]]++;
              int best = -1;
              for (int u : initial)
                  if (best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)) best = u;
              return best;
          }
        `,
        c: code`
          int minMalwareSpread(int** graph, int graphSize, int* graphColSize, int* initial, int initialSize) {
              int n = graphSize;
              int* infected = (int*)calloc(n, sizeof(int));
              int* count = (int*)calloc(n, sizeof(int));
              int* source = (int*)calloc(n, sizeof(int));
              int* saved = (int*)calloc(n, sizeof(int));
              int* seen = (int*)malloc(n * sizeof(int));
              int* stack = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < initialSize; i++) infected[initial[i]] = 1;
              for (int i = 0; i < initialSize; i++) {
                  int u = initial[i], top = 0;
                  for (int v = 0; v < n; v++) seen[v] = 0;
                  seen[u] = 1;
                  stack[top++] = u;
                  while (top > 0) {
                      int x = stack[--top];
                      for (int v = 0; v < n; v++) {
                          if (graph[x][v] == 1 && !seen[v] && !infected[v]) {
                              seen[v] = 1; count[v]++; source[v] = u; stack[top++] = v;
                          }
                      }
                  }
              }
              for (int v = 0; v < n; v++) if (count[v] == 1) saved[source[v]]++;
              int best = -1;
              for (int i = 0; i < initialSize; i++) {
                  int u = initial[i];
                  if (best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)) best = u;
              }
              free(infected); free(count); free(source); free(saved); free(seen); free(stack);
              return best;
          }
        `,
        csharp: code`
          public static int MinMalwareSpread(int[][] graph, int[] initial)
          {
              int n = graph.Length;
              var infected = new bool[n];
              foreach (int u in initial) infected[u] = true;
              int[] count = new int[n], source = new int[n], saved = new int[n];
              foreach (int u in initial)
              {
                  var seen = new bool[n];
                  seen[u] = true;
                  var stack = new Stack<int>();
                  stack.Push(u);
                  while (stack.Count > 0)
                  {
                      int x = stack.Pop();
                      for (int v = 0; v < n; v++)
                      {
                          if (graph[x][v] == 1 && !seen[v] && !infected[v])
                          {
                              seen[v] = true; count[v]++; source[v] = u; stack.Push(v);
                          }
                      }
                  }
              }
              for (int v = 0; v < n; v++) if (count[v] == 1) saved[source[v]]++;
              int best = -1;
              foreach (int u in initial)
                  if (best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)) best = u;
              return best;
          }
        `,
        go: code`
          func minMalwareSpread(graph [][]int, initial []int) int {
              n := len(graph)
              infected := make([]bool, n)
              for _, u := range initial {
                  infected[u] = true
              }
              count := make([]int, n)
              source := make([]int, n)
              saved := make([]int, n)
              for _, u := range initial {
                  seen := make([]bool, n)
                  seen[u] = true
                  stack := []int{u}
                  for len(stack) > 0 {
                      x := stack[len(stack)-1]
                      stack = stack[:len(stack)-1]
                      for v := 0; v < n; v++ {
                          if graph[x][v] == 1 && !seen[v] && !infected[v] {
                              seen[v] = true
                              count[v]++
                              source[v] = u
                              stack = append(stack, v)
                          }
                      }
                  }
              }
              for v := 0; v < n; v++ {
                  if count[v] == 1 {
                      saved[source[v]]++
                  }
              }
              best := -1
              for _, u := range initial {
                  if best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best) {
                      best = u
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minMalwareSpread(graph: Array<IntArray>, initial: IntArray): Int {
              val n = graph.size
              val infected = BooleanArray(n)
              for (u in initial) infected[u] = true
              val count = IntArray(n)
              val source = IntArray(n)
              val saved = IntArray(n)
              val stack = IntArray(n)
              for (u in initial) {
                  val seen = BooleanArray(n)
                  seen[u] = true
                  var top = 0
                  stack[top++] = u
                  while (top > 0) {
                      val x = stack[--top]
                      for (v in 0 until n) {
                          if (graph[x][v] == 1 && !seen[v] && !infected[v]) {
                              seen[v] = true; count[v]++; source[v] = u; stack[top++] = v
                          }
                      }
                  }
              }
              for (v in 0 until n) if (count[v] == 1) saved[source[v]]++
              var best = -1
              for (u in initial)
                  if (best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)) best = u
              return best
          }
        `,
        swift: code`
          func minMalwareSpread(_ graph: [[Int]], _ initial: [Int]) -> Int {
              let n = graph.count
              var infected = [Bool](repeating: false, count: n)
              for u in initial { infected[u] = true }
              var count = [Int](repeating: 0, count: n)
              var source = [Int](repeating: -1, count: n)
              var saved = [Int](repeating: 0, count: n)
              for u in initial {
                  var seen = [Bool](repeating: false, count: n)
                  seen[u] = true
                  var stack = [u]
                  while let x = stack.popLast() {
                      for v in 0..<n where graph[x][v] == 1 && !seen[v] && !infected[v] {
                          seen[v] = true
                          count[v] += 1
                          source[v] = u
                          stack.append(v)
                      }
                  }
              }
              for v in 0..<n where count[v] == 1 { saved[source[v]] += 1 }
              var best = -1
              for u in initial where best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best) {
                  best = u
              }
              return best
          }
        `,
        rust: code`
          fn minMalwareSpread(graph: Vec<Vec<i32>>, initial: Vec<i32>) -> i32 {
              let n = graph.len();
              let mut infected = vec![false; n];
              for &u in initial.iter() {
                  infected[u as usize] = true;
              }
              let mut count = vec![0; n];
              let mut source = vec![0usize; n];
              let mut saved = vec![0; n];
              for &u in initial.iter() {
                  let u = u as usize;
                  let mut seen = vec![false; n];
                  seen[u] = true;
                  let mut stack = vec![u];
                  while let Some(x) = stack.pop() {
                      for v in 0..n {
                          if graph[x][v] == 1 && !seen[v] && !infected[v] {
                              seen[v] = true;
                              count[v] += 1;
                              source[v] = u;
                              stack.push(v);
                          }
                      }
                  }
              }
              for v in 0..n {
                  if count[v] == 1 {
                      saved[source[v]] += 1;
                  }
              }
              let mut best: i32 = -1;
              for &u in initial.iter() {
                  let b = best as usize;
                  if best == -1 || saved[u as usize] > saved[b] || (saved[u as usize] == saved[b] && u < best) {
                      best = u;
                  }
              }
              best
          }
        `,
        php: code`
          function minMalwareSpread($graph, $initial) {
              $n = count($graph);
              $infected = array_fill(0, $n, false);
              foreach ($initial as $u) $infected[$u] = true;
              $count = array_fill(0, $n, 0);
              $source = array_fill(0, $n, -1);
              $saved = array_fill(0, $n, 0);
              foreach ($initial as $u) {
                  $seen = array_fill(0, $n, false);
                  $seen[$u] = true;
                  $stack = [$u];
                  while ($stack) {
                      $x = array_pop($stack);
                      for ($v = 0; $v < $n; $v++) {
                          if ($graph[$x][$v] == 1 && !$seen[$v] && !$infected[$v]) {
                              $seen[$v] = true; $count[$v]++; $source[$v] = $u; $stack[] = $v;
                          }
                      }
                  }
              }
              for ($v = 0; $v < $n; $v++) if ($count[$v] == 1) $saved[$source[$v]]++;
              $best = -1;
              foreach ($initial as $u)
                  if ($best == -1 || $saved[$u] > $saved[$best] || ($saved[$u] == $saved[$best] && $u < $best)) $best = $u;
              return $best;
          }
        `,
        ruby: code`
          def minMalwareSpread(graph, initial)
            n = graph.length
            infected = Array.new(n, false)
            initial.each { |u| infected[u] = true }
            count = Array.new(n, 0)
            source = Array.new(n, -1)
            saved = Array.new(n, 0)
            initial.each do |u|
              seen = Array.new(n, false)
              seen[u] = true
              stack = [u]
              until stack.empty?
                x = stack.pop
                row = graph[x]
                n.times do |v|
                  next unless row[v] == 1 && !seen[v] && !infected[v]
                  seen[v] = true
                  count[v] += 1
                  source[v] = u
                  stack << v
                end
              end
            end
            n.times { |v| saved[source[v]] += 1 if count[v] == 1 }
            best = -1
            initial.each do |u|
              best = u if best == -1 || saved[u] > saved[best] || (saved[u] == saved[best] && u < best)
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Coloring A Border (LC 1034) ─────────────────────────────────
  (() => {
    const ref = (grid: number[][], row: number, col: number, color: number) => {
      const m = grid.length, n = grid[0].length, c0 = grid[row][col];
      const inC = grid.map((r) => r.map(() => false));
      inC[row][col] = true;
      const q = [[row, col]];
      for (let h = 0; h < q.length; h++) {
        const [r, c] = q[h];
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
          if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inC[nr][nc] && grid[nr][nc] === c0) { inC[nr][nc] = true; q.push([nr, nc]); }
        }
      }
      const out = grid.map((r) => r.slice());
      for (const [r, c] of q) {
        const border = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].some(([nr, nc]) => nr < 0 || nc < 0 || nr >= m || nc >= n || !inC[nr][nc]);
        if (border) out[r][c] = color;
      }
      return out;
    };
    return {
      slug: "coloring-a-border",
      title: "Coloring A Border",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Matrix", "Amazon", "Booking.com"],
      signature: {
        funcName: "colorBorder",
        params: [
          { name: "grid", type: "int[][]" as const }, { name: "row", type: "int" as const },
          { name: "col", type: "int" as const }, { name: "color", type: "int" as const },
        ],
        returns: "int[][]" as const,
      },
      description: describe(
        "You are given an `m x n` integer matrix `grid`, where each value is the colour of that cell, and three integers `row`, `col` and `color`.\n\nTwo cells are **adjacent** if they share a side. Two cells belong to the same **connected component** if they have the same colour and are linked by a chain of adjacent same-coloured cells.\n\nThe **border** of a component is every cell of it that is either adjacent to a cell outside the component or lies on the edge of the grid.\n\nRecolour the border of the component containing `grid[row][col]` with `color`, and return the resulting grid.",
        [
          { in: "grid = [[1,1],[1,2]], row = 0, col = 0, color = 3", out: "[[3,3],[3,2]]" },
          { in: "grid = [[1,2,2],[2,3,2]], row = 0, col = 1, color = 3", out: "[[1,3,3],[2,3,3]]" },
          { in: "grid = [[1,1,1],[1,1,1],[1,1,1]], row = 1, col = 1, color = 2", out: "[[2,2,2],[2,1,2],[2,2,2]]", note: "The centre cell is surrounded by its own component and is not on the grid's edge, so it keeps its colour." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "1 <= grid[i][j], color <= 1000", "0 <= row < m", "0 <= col < n"]),
      hints: [
        "First find the whole component with a DFS or BFS from `(row, col)`, moving only to cells of the starting colour.",
        "A component cell is on the border if it is on the grid's edge or any of its four neighbours is **not** in the component.",
        "Decide every border cell against the **original** colours, then paint — painting during the search changes the answers for cells you have not checked yet.",
      ],
      editorial: explain({
        idea: "Separate finding from painting: mark the component, decide which marked cells are on its border using the marks, then recolour those cells.",
        steps: [
          "Let `c0 = grid[row][col]`. Flood-fill from `(row, col)` over cells equal to `c0`, marking them as in the component.",
          "For each marked cell, it is a border cell if it lies on the outer edge of the grid or has a neighbour that is not marked.",
          "Set every border cell to `color` and return the grid.",
        ],
        why: "Being on the border depends only on membership in the component, which the marks record exactly. Because no cell is repainted until every border test is done, a recoloured neighbour can never be mistaken for a foreign cell — even when `color` equals `c0`.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Recolouring during the DFS makes interior cells look like they touch another colour.",
          "Cells of the same colour that are not connected to the start are a different component and must not change.",
          "A one-row or one-column component is entirely border.",
        ],
      }),
      examples: [
        { input: "[[1,1],[1,2]]\n0\n0\n3", expectedOutput: "[[3,3],[3,2]]" },
        { input: "[[1,2,2],[2,3,2]]\n0\n1\n3", expectedOutput: "[[1,3,3],[2,3,3]]" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]\n1\n1\n2", expectedOutput: "[[2,2,2],[2,1,2],[2,2,2]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 7, 9]));
        const n = ri(rng, 1, pick(rng, [2, 4, 7, 9]));
        const palette = Array.from({ length: ri(rng, 1, 4) }, () => ri(rng, 1, pick(rng, [5, 1000])));
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(rng, palette)));
        const row = ri(rng, 0, m - 1), col = ri(rng, 0, n - 1);
        const color = rng() < 0.3 ? pick(rng, palette) : ri(rng, 1, 1000);
        return { input: `${fmtIntMat(grid)}\n${row}\n${col}\n${color}`, expectedOutput: fmtIntMat(ref(grid, row, col, color)) };
      },
      solutions: {
        python: code`
          from typing import List

          def colorBorder(grid: List[List[int]], row: int, col: int, color: int) -> List[List[int]]:
              m, n = len(grid), len(grid[0])
              c0 = grid[row][col]
              inside = [[False] * n for _ in range(m)]
              inside[row][col] = True
              stack = [(row, col)]
              cells = []
              while stack:
                  r, c = stack.pop()
                  cells.append((r, c))
                  for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if 0 <= nr < m and 0 <= nc < n and not inside[nr][nc] and grid[nr][nc] == c0:
                          inside[nr][nc] = True
                          stack.append((nr, nc))
              border = []
              for r, c in cells:
                  for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if not (0 <= nr < m and 0 <= nc < n) or not inside[nr][nc]:
                          border.append((r, c))
                          break
              out = [row_[:] for row_ in grid]
              for r, c in border:
                  out[r][c] = color
              return out
        `,
        javascript: code`
          var colorBorder = function(grid, row, col, color) {
              var m = grid.length, n = grid[0].length, c0 = grid[row][col];
              var inside = [], out = [];
              for (var i = 0; i < m; i++) {
                  inside.push(new Array(n).fill(false));
                  out.push(grid[i].slice());
              }
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              inside[row][col] = true;
              var cells = [[row, col]];
              for (var h = 0; h < cells.length; h++) {
                  for (var k = 0; k < 4; k++) {
                      var nr = cells[h][0] + dr[k], nc = cells[h][1] + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr][nc] && grid[nr][nc] === c0) {
                          inside[nr][nc] = true;
                          cells.push([nr, nc]);
                      }
                  }
              }
              for (var j = 0; j < cells.length; j++) {
                  var r = cells[j][0], c = cells[j][1];
                  for (var d = 0; d < 4; d++) {
                      var ar = r + dr[d], ac = c + dc[d];
                      if (ar < 0 || ac < 0 || ar >= m || ac >= n || !inside[ar][ac]) { out[r][c] = color; break; }
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function colorBorder(grid: number[][], row: number, col: number, color: number): number[][] {
              var m = grid.length, n = grid[0].length, c0 = grid[row][col];
              var inside: boolean[][] = [], out: number[][] = [];
              for (var i = 0; i < m; i++) {
                  var line: boolean[] = [];
                  for (var j0 = 0; j0 < n; j0++) line.push(false);
                  inside.push(line);
                  out.push(grid[i].slice());
              }
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              inside[row][col] = true;
              var cells: number[][] = [[row, col]];
              for (var h = 0; h < cells.length; h++) {
                  for (var k = 0; k < 4; k++) {
                      var nr = cells[h][0] + dr[k], nc = cells[h][1] + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr][nc] && grid[nr][nc] === c0) {
                          inside[nr][nc] = true;
                          cells.push([nr, nc]);
                      }
                  }
              }
              for (var j = 0; j < cells.length; j++) {
                  var r = cells[j][0], c = cells[j][1];
                  for (var d = 0; d < 4; d++) {
                      var ar = r + dr[d], ac = c + dc[d];
                      if (ar < 0 || ac < 0 || ar >= m || ac >= n || !inside[ar][ac]) { out[r][c] = color; break; }
                  }
              }
              return out;
          }
        `,
        java: code`
          public static int[][] colorBorder(int[][] grid, int row, int col, int color) {
              int m = grid.length, n = grid[0].length, c0 = grid[row][col];
              boolean[][] inside = new boolean[m][n];
              int[][] out = new int[m][];
              for (int i = 0; i < m; i++) out[i] = grid[i].clone();
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              int[] cells = new int[m * n];
              int cnt = 0;
              inside[row][col] = true;
              cells[cnt++] = row * n + col;
              for (int h = 0; h < cnt; h++) {
                  int r = cells[h] / n, c = cells[h] % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr][nc] && grid[nr][nc] == c0) {
                          inside[nr][nc] = true;
                          cells[cnt++] = nr * n + nc;
                      }
                  }
              }
              for (int h = 0; h < cnt; h++) {
                  int r = cells[h] / n, c = cells[h] % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr][nc]) { out[r][c] = color; break; }
                  }
              }
              return out;
          }
        `,
        cpp: code`
          vector<vector<int>> colorBorder(vector<vector<int>>& grid, int row, int col, int color) {
              int m = grid.size(), n = grid[0].size(), c0 = grid[row][col];
              vector<vector<bool>> inside(m, vector<bool>(n, false));
              vector<vector<int>> out = grid;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              vector<pair<int, int>> cells{{row, col}};
              inside[row][col] = true;
              for (size_t h = 0; h < cells.size(); h++) {
                  int r = cells[h].first, c = cells[h].second;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr][nc] && grid[nr][nc] == c0) {
                          inside[nr][nc] = true;
                          cells.push_back({nr, nc});
                      }
                  }
              }
              for (auto& cell : cells) {
                  int r = cell.first, c = cell.second;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr][nc]) { out[r][c] = color; break; }
                  }
              }
              return out;
          }
        `,
        c: code`
          int** colorBorder(int** grid, int gridSize, int* gridColSize, int row, int col, int color, int* returnSize, int** returnColumnSizes) {
              int m = gridSize, n = gridColSize[0], c0 = grid[row][col];
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              char* inside = (char*)calloc(m * n, 1);
              int* cells = (int*)malloc(m * n * sizeof(int));
              int** out = (int**)malloc(m * sizeof(int*));
              *returnColumnSizes = (int*)malloc(m * sizeof(int));
              for (int i = 0; i < m; i++) {
                  out[i] = (int*)malloc(n * sizeof(int));
                  memcpy(out[i], grid[i], n * sizeof(int));
                  (*returnColumnSizes)[i] = n;
              }
              int cnt = 0;
              inside[row * n + col] = 1;
              cells[cnt++] = row * n + col;
              for (int h = 0; h < cnt; h++) {
                  int r = cells[h] / n, c = cells[h] % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr * n + nc] && grid[nr][nc] == c0) {
                          inside[nr * n + nc] = 1;
                          cells[cnt++] = nr * n + nc;
                      }
                  }
              }
              for (int h = 0; h < cnt; h++) {
                  int r = cells[h] / n, c = cells[h] % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr * n + nc]) { out[r][c] = color; break; }
                  }
              }
              free(inside);
              free(cells);
              *returnSize = m;
              return out;
          }
        `,
        csharp: code`
          public static int[][] ColorBorder(int[][] grid, int row, int col, int color)
          {
              int m = grid.Length, n = grid[0].Length, c0 = grid[row][col];
              var inside = new bool[m * n];
              var out_ = new int[m][];
              for (int i = 0; i < m; i++) out_[i] = (int[])grid[i].Clone();
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              var cells = new List<int> { row * n + col };
              inside[row * n + col] = true;
              for (int h = 0; h < cells.Count; h++)
              {
                  int r = cells[h] / n, c = cells[h] % n;
                  for (int k = 0; k < 4; k++)
                  {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr * n + nc] && grid[nr][nc] == c0)
                      {
                          inside[nr * n + nc] = true;
                          cells.Add(nr * n + nc);
                      }
                  }
              }
              foreach (int cell in cells)
              {
                  int r = cell / n, c = cell % n;
                  for (int k = 0; k < 4; k++)
                  {
                      int nr = r + dr[k], nc = c + dc[k];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr * n + nc]) { out_[r][c] = color; break; }
                  }
              }
              return out_;
          }
        `,
        go: code`
          func colorBorder(grid [][]int, row int, col int, color int) [][]int {
              m, n, c0 := len(grid), len(grid[0]), grid[row][col]
              inside := make([]bool, m*n)
              out := make([][]int, m)
              for i := range grid {
                  out[i] = append([]int{}, grid[i]...)
              }
              dr := []int{1, -1, 0, 0}
              dc := []int{0, 0, 1, -1}
              cells := []int{row*n + col}
              inside[row*n+col] = true
              for h := 0; h < len(cells); h++ {
                  r, c := cells[h]/n, cells[h]%n
                  for k := 0; k < 4; k++ {
                      nr, nc := r+dr[k], c+dc[k]
                      if nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr*n+nc] && grid[nr][nc] == c0 {
                          inside[nr*n+nc] = true
                          cells = append(cells, nr*n+nc)
                      }
                  }
              }
              for _, cell := range cells {
                  r, c := cell/n, cell%n
                  for k := 0; k < 4; k++ {
                      nr, nc := r+dr[k], c+dc[k]
                      if nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr*n+nc] {
                          out[r][c] = color
                          break
                      }
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun colorBorder(grid: Array<IntArray>, row: Int, col: Int, color: Int): Array<IntArray> {
              val m = grid.size
              val n = grid[0].size
              val c0 = grid[row][col]
              val inside = BooleanArray(m * n)
              val out = Array(m) { grid[it].clone() }
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              val cells = ArrayList<Int>()
              cells.add(row * n + col)
              inside[row * n + col] = true
              var h = 0
              while (h < cells.size) {
                  val r = cells[h] / n
                  val c = cells[h] % n
                  h++
                  for (k in 0 until 4) {
                      val nr = r + dr[k]
                      val nc = c + dc[k]
                      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr * n + nc] && grid[nr][nc] == c0) {
                          inside[nr * n + nc] = true
                          cells.add(nr * n + nc)
                      }
                  }
              }
              for (cell in cells) {
                  val r = cell / n
                  val c = cell % n
                  for (k in 0 until 4) {
                      val nr = r + dr[k]
                      val nc = c + dc[k]
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr * n + nc]) { out[r][c] = color; break }
                  }
              }
              return out
          }
        `,
        swift: code`
          func colorBorder(_ grid: [[Int]], _ row: Int, _ col: Int, _ color: Int) -> [[Int]] {
              let m = grid.count, n = grid[0].count, c0 = grid[row][col]
              var inside = [Bool](repeating: false, count: m * n)
              var out = grid
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              var cells = [row * n + col]
              inside[row * n + col] = true
              var h = 0
              while h < cells.count {
                  let r = cells[h] / n, c = cells[h] % n
                  h += 1
                  for k in 0..<4 {
                      let nr = r + dr[k], nc = c + dc[k]
                      if nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[nr * n + nc] && grid[nr][nc] == c0 {
                          inside[nr * n + nc] = true
                          cells.append(nr * n + nc)
                      }
                  }
              }
              for cell in cells {
                  let r = cell / n, c = cell % n
                  for k in 0..<4 {
                      let nr = r + dr[k], nc = c + dc[k]
                      if nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr * n + nc] { out[r][c] = color; break }
                  }
              }
              return out
          }
        `,
        rust: code`
          fn colorBorder(grid: Vec<Vec<i32>>, row: i32, col: i32, color: i32) -> Vec<Vec<i32>> {
              let (m, n) = (grid.len() as i32, grid[0].len() as i32);
              let c0 = grid[row as usize][col as usize];
              let mut inside = vec![false; (m * n) as usize];
              let mut out = grid.clone();
              let dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)];
              let mut cells = vec![(row, col)];
              inside[(row * n + col) as usize] = true;
              let mut h = 0;
              while h < cells.len() {
                  let (r, c) = cells[h];
                  h += 1;
                  for &(dr, dc) in dirs.iter() {
                      let (nr, nc) = (r + dr, c + dc);
                      if nr >= 0 && nc >= 0 && nr < m && nc < n && !inside[(nr * n + nc) as usize] && grid[nr as usize][nc as usize] == c0 {
                          inside[(nr * n + nc) as usize] = true;
                          cells.push((nr, nc));
                      }
                  }
              }
              for &(r, c) in cells.iter() {
                  for &(dr, dc) in dirs.iter() {
                      let (nr, nc) = (r + dr, c + dc);
                      if nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[(nr * n + nc) as usize] {
                          out[r as usize][c as usize] = color;
                          break;
                      }
                  }
              }
              out
          }
        `,
        php: code`
          function colorBorder($grid, $row, $col, $color) {
              $m = count($grid);
              $n = count($grid[0]);
              $c0 = $grid[$row][$col];
              $inside = array_fill(0, $m * $n, false);
              $out = $grid;
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $cells = [$row * $n + $col];
              $inside[$row * $n + $col] = true;
              for ($h = 0; $h < count($cells); $h++) {
                  $r = intdiv($cells[$h], $n);
                  $c = $cells[$h] % $n;
                  for ($k = 0; $k < 4; $k++) {
                      $nr = $r + $dr[$k];
                      $nc = $c + $dc[$k];
                      if ($nr >= 0 && $nc >= 0 && $nr < $m && $nc < $n && !$inside[$nr * $n + $nc] && $grid[$nr][$nc] == $c0) {
                          $inside[$nr * $n + $nc] = true;
                          $cells[] = $nr * $n + $nc;
                      }
                  }
              }
              foreach ($cells as $cell) {
                  $r = intdiv($cell, $n);
                  $c = $cell % $n;
                  for ($k = 0; $k < 4; $k++) {
                      $nr = $r + $dr[$k];
                      $nc = $c + $dc[$k];
                      if ($nr < 0 || $nc < 0 || $nr >= $m || $nc >= $n || !$inside[$nr * $n + $nc]) { $out[$r][$c] = $color; break; }
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def colorBorder(grid, row, col, color)
            m = grid.length
            n = grid[0].length
            c0 = grid[row][col]
            inside = Array.new(m * n, false)
            out = grid.map(&:dup)
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            cells = [row * n + col]
            inside[row * n + col] = true
            h = 0
            while h < cells.length
              r, c = cells[h].divmod(n)
              h += 1
              dirs.each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next unless nr >= 0 && nc >= 0 && nr < m && nc < n
                next if inside[nr * n + nc] || grid[nr][nc] != c0
                inside[nr * n + nc] = true
                cells << nr * n + nc
              end
            end
            cells.each do |cell|
              r, c = cell.divmod(n)
              border = dirs.any? do |dr, dc|
                nr = r + dr
                nc = c + dc
                nr < 0 || nc < 0 || nr >= m || nc >= n || !inside[nr * n + nc]
              end
              out[r][c] = color if border
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Escape a Large Maze (LC 1036) ───────────────────────────────
  (() => {
    const SIDE = 1000000;
    // BFS confined to the bounding box of the blocked cells and the source,
    // grown by one cell (clamped to the grid). Outside that box every cell is
    // free and the one-cell ring is connected, so a path leaving the box can
    // be rerouted along the ring: reachability inside the box is exact, and a
    // target outside it is reachable iff the source reaches the ring.
    const ref = (blocked: number[][], source: number[], target: number[]) => {
      const xs = [source[0], ...blocked.map((b) => b[0])], ys = [source[1], ...blocked.map((b) => b[1])];
      const x0 = Math.max(0, Math.min(...xs) - 1), x1 = Math.min(SIDE - 1, Math.max(...xs) + 1);
      const y0 = Math.max(0, Math.min(...ys) - 1), y1 = Math.min(SIDE - 1, Math.max(...ys) + 1);
      const inBox = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
      const onRing = (x: number, y: number) =>
        (x === x0 && x0 > 0) || (x === x1 && x1 < SIDE - 1) || (y === y0 && y0 > 0) || (y === y1 && y1 < SIDE - 1);
      const block = new Set(blocked.map((b) => `${b[0]},${b[1]}`));
      const targetInside = inBox(target[0], target[1]);
      const seen = new Set<string>([`${source[0]},${source[1]}`]);
      const q = [source];
      for (let h = 0; h < q.length; h++) {
        const [x, y] = q[h];
        if (x === target[0] && y === target[1]) return true;
        if (!targetInside && onRing(x, y)) return true;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          const key = `${nx},${ny}`;
          if (!inBox(nx, ny) || block.has(key) || seen.has(key)) continue;
          seen.add(key);
          q.push([nx, ny]);
        }
      }
      return false;
    };
    return {
      slug: "escape-a-large-maze",
      title: "Escape a Large Maze",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Depth-First Search", "Breadth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "isEscapePossible",
        params: [{ name: "blocked", type: "int[][]" as const }, { name: "source", type: "int[]" as const }, { name: "target", type: "int[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "There is a `10^6 x 10^6` grid on the XY-plane; each square has integer coordinates `(x, y)` with `0 <= x, y < 10^6`.\n\nYou start at `source = [sx, sy]` and want to reach `target = [tx, ty]`. The squares listed in `blocked` (each `[xi, yi]`) cannot be entered. In one move you go one square north, east, south or west, and you may not leave the grid.\n\nReturn `true` if the target can be reached from the source, and `false` otherwise.",
        [
          { in: "blocked = [[0,1],[1,0]], source = [0,0], target = [0,2]", out: "false", note: "The two blocked squares seal the corner square (0, 0) off from everything else." },
          { in: "blocked = [], source = [0,0], target = [999999,999999]", out: "true" },
          { in: "blocked = [[1,0],[1,1],[1,2]], source = [0,0], target = [5,5]", out: "true", note: "The wall along x = 1 ends at y = 2, so the walker goes up column 0 and around it." },
        ],
        ["0 <= blocked.length <= 200", "blocked[i].length == 2", "0 <= xi, yi < 10^6", "source.length == target.length == 2", "0 <= sx, sy, tx, ty < 10^6", "source != target", "source and target are not blocked", "all blocked squares are distinct"]),
      hints: [
        "The grid has `10^12` squares — searching it all is out of the question. Only the blocked squares can stop you, and there are at most 200 of them.",
        "How large an area can `k` blocked squares enclose? Bending a wall against a corner of the grid is the best they can do: a diagonal of `k` squares encloses about `k · (k - 1) / 2` squares.",
        "BFS from the source but stop early: if you have visited more squares than `k · (k - 1) / 2`, you cannot be enclosed. Do the same from the target — both must escape (or meet).",
      ],
      editorial: explain({
        idea: "A small wall can only enclose a small region. `k` blocked squares enclose at most `k · (k - 1) / 2` free squares (a diagonal across a corner of the grid). So a bounded BFS either finds the target, runs out of squares (it is trapped), or exceeds that bound (it is free).",
        steps: [
          "Put the blocked squares in a hash set and let `limit = k · (k - 1) / 2` for `k = blocked.length`.",
          "`bfs(from, to)`: a BFS from `from` with a visited hash set. Return `true` as soon as `to` is reached or the visited count exceeds `limit`; return `false` if the queue empties first.",
          "Answer `bfs(source, target) && bfs(target, source)`.",
        ],
        why: "If the source is enclosed, its region has at most `limit` squares and its BFS empties without exceeding the bound — unless the target is inside the same region, in which case it is found. If neither endpoint is enclosed, both lie in the single unbounded region that surrounds every blocked square (any two escaping squares are connected around the outside of the walls). The second search guards the case where the source is free but the target is enclosed.",
        time: "O(k^2) — each BFS touches at most about `k^2 / 2` squares",
        space: "O(k^2)",
        pitfalls: [
          "Checking only from the source is wrong: the target may be the one sealed in.",
          "Encode a square as one 64-bit key (`x · 10^6 + y`) — the product overflows 32 bits.",
          "With zero or one blocked square nothing can be enclosed; the bound of 0 handles that automatically.",
        ],
      }),
      examples: [
        { input: "[[0,1],[1,0]]\n[0,0]\n[0,2]", expectedOutput: "false" },
        { input: "[]\n[0,0]\n[999999,999999]", expectedOutput: "true" },
        { input: "[[1,0],[1,1],[1,2]]\n[0,0]\n[5,5]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const span = ri(rng, 3, 12);
          const mode = ri(rng, 0, 2);
          // Walls are drawn in a local span x span box; "low" maps it onto the
          // grid corner (0, 0), "high" mirrors it onto (10^6 - 1, 10^6 - 1), so a
          // diagonal wall really does seal a corner. "mid" floats in the open.
          const corner = mode === 1 ? pick(rng, ["low", "high"]) : pick(rng, ["low", "low", "mid", "high"]);
          const base = corner === "low" ? 0 : corner === "mid" ? 500000 : SIDE - span;
          const flip = corner === "high" || (corner === "mid" && rng() < 0.5);
          const put = (x: number, y: number) => (flip ? [base + span - 1 - x, base + span - 1 - y] : [base + x, base + y]);
          const cells = new Map<string, number[]>();
          const add = (x: number, y: number) => { if (x >= 0 && y >= 0 && x < span && y < span) { const p = put(x, y); cells.set(`${p[0]},${p[1]}`, p); } };
          let inside: (() => number[]) | null = null;
          if (mode === 0) {
            const k = ri(rng, 0, pick(rng, [2, 8, 25]));
            for (let t = 0; t < k; t++) add(ri(rng, 0, span - 1), ri(rng, 0, span - 1));
          } else if (mode === 1) {
            const r = ri(rng, 1, span - 1);
            for (let x = 0; x <= r; x++) if (rng() < 0.93) add(x, r - x);
            inside = () => { const x = ri(rng, 0, r - 1); return [x, ri(rng, 0, r - 1 - x)]; };
          } else {
            const a = ri(rng, 0, span - 3), b = ri(rng, a + 2, span - 1);
            for (let t = a; t <= b; t++) { add(a, t); add(b, t); add(t, a); add(t, b); }
            if (rng() < 0.3) cells.delete([...cells.keys()][ri(rng, 0, cells.size - 1)]);
            inside = () => [ri(rng, a + 1, b - 1), ri(rng, a + 1, b - 1)];
          }
          const blocked = shuffle(rng, [...cells.values()]);
          const local = () => (inside && rng() < 0.5 ? inside() : [ri(rng, 0, span - 1), ri(rng, 0, span - 1)]);
          const free = () => { const l = local(); const p = put(l[0], l[1]); return cells.has(`${p[0]},${p[1]}`) ? null : p; };
          const source = free();
          if (!source) continue;
          const target: number[] | null = rng() < 0.6 ? free() : [ri(rng, 0, SIDE - 1), ri(rng, 0, SIDE - 1)];
          if (!target || cells.has(`${target[0]},${target[1]}`) || (target[0] === source[0] && target[1] === source[1])) continue;
          const ans = ref(blocked, source, target);
          const swap = rng() < 0.5;
          const [s, t] = swap ? [target, source] : [source, target];
          return { input: `${fmtIntMat(blocked)}
${fmtIntArr(s)}
${fmtIntArr(t)}`, expectedOutput: bool(ans) };
        }
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def isEscapePossible(blocked: List[List[int]], source: List[int], target: List[int]) -> bool:
              SIDE = 10 ** 6
              block = {(x, y) for x, y in blocked}
              limit = len(blocked) * (len(blocked) - 1) // 2

              def bfs(src, dst):
                  start = (src[0], src[1])
                  goal = (dst[0], dst[1])
                  seen = {start}
                  q = deque([start])
                  while q:
                      x, y = q.popleft()
                      for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                          if 0 <= nx < SIDE and 0 <= ny < SIDE and (nx, ny) not in block and (nx, ny) not in seen:
                              if (nx, ny) == goal:
                                  return True
                              seen.add((nx, ny))
                              if len(seen) > limit:
                                  return True
                              q.append((nx, ny))
                  return False

              return bfs(source, target) and bfs(target, source)
        `,
        javascript: code`
          var isEscapePossible = function(blocked, source, target) {
              var SIDE = 1000000, block = {};
              for (var i = 0; i < blocked.length; i++) block[blocked[i][0] * SIDE + blocked[i][1]] = true;
              var limit = blocked.length * (blocked.length - 1) / 2;
              var dx = [1, -1, 0, 0], dy = [0, 0, 1, -1];
              var bfs = function(src, dst) {
                  var goal = dst[0] * SIDE + dst[1];
                  var seen = {}, count = 1;
                  seen[src[0] * SIDE + src[1]] = true;
                  var q = [src];
                  for (var h = 0; h < q.length; h++) {
                      for (var k = 0; k < 4; k++) {
                          var nx = q[h][0] + dx[k], ny = q[h][1] + dy[k];
                          if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                          var key = nx * SIDE + ny;
                          if (block[key] || seen[key]) continue;
                          if (key === goal) return true;
                          seen[key] = true;
                          if (++count > limit) return true;
                          q.push([nx, ny]);
                      }
                  }
                  return false;
              };
              return bfs(source, target) && bfs(target, source);
          };
        `,
        typescript: code`
          function isEscapePossible(blocked: number[][], source: number[], target: number[]): boolean {
              var SIDE = 1000000;
              var block: { [k: number]: boolean } = {};
              for (var i = 0; i < blocked.length; i++) block[blocked[i][0] * SIDE + blocked[i][1]] = true;
              var limit = blocked.length * (blocked.length - 1) / 2;
              var dx = [1, -1, 0, 0], dy = [0, 0, 1, -1];
              function bfs(src: number[], dst: number[]): boolean {
                  var goal = dst[0] * SIDE + dst[1];
                  var seen: { [k: number]: boolean } = {};
                  var count = 1;
                  seen[src[0] * SIDE + src[1]] = true;
                  var q: number[][] = [src];
                  for (var h = 0; h < q.length; h++) {
                      for (var k = 0; k < 4; k++) {
                          var nx = q[h][0] + dx[k], ny = q[h][1] + dy[k];
                          if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                          var key = nx * SIDE + ny;
                          if (block[key] || seen[key]) continue;
                          if (key === goal) return true;
                          seen[key] = true;
                          if (++count > limit) return true;
                          q.push([nx, ny]);
                      }
                  }
                  return false;
              }
              return bfs(source, target) && bfs(target, source);
          }
        `,
        java: code`
          public static boolean isEscapePossible(int[][] blocked, int[] source, int[] target) {
              Set<Long> block = new HashSet<>();
              for (int[] b : blocked) block.add((long) b[0] * 1000000 + b[1]);
              long limit = (long) blocked.length * (blocked.length - 1) / 2;
              return escBfs(block, limit, source, target) && escBfs(block, limit, target, source);
          }

          static boolean escBfs(Set<Long> block, long limit, int[] src, int[] dst) {
              final int SIDE = 1000000;
              int[] dx = {1, -1, 0, 0}, dy = {0, 0, 1, -1};
              long goal = (long) dst[0] * SIDE + dst[1];
              Set<Long> seen = new HashSet<>();
              seen.add((long) src[0] * SIDE + src[1]);
              ArrayDeque<int[]> q = new ArrayDeque<>();
              q.add(src);
              while (!q.isEmpty()) {
                  int[] cur = q.poll();
                  for (int k = 0; k < 4; k++) {
                      int nx = cur[0] + dx[k], ny = cur[1] + dy[k];
                      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                      long key = (long) nx * SIDE + ny;
                      if (block.contains(key) || seen.contains(key)) continue;
                      if (key == goal) return true;
                      seen.add(key);
                      if (seen.size() > limit) return true;
                      q.add(new int[]{nx, ny});
                  }
              }
              return false;
          }
        `,
        cpp: code`
          static bool escBfs(unordered_set<long long>& block, long long limit, vector<int>& src, vector<int>& dst) {
              const int SIDE = 1000000;
              int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
              long long goal = (long long)dst[0] * SIDE + dst[1];
              unordered_set<long long> seen{(long long)src[0] * SIDE + src[1]};
              queue<pair<int, int>> q;
              q.push({src[0], src[1]});
              while (!q.empty()) {
                  int x = q.front().first, y = q.front().second;
                  q.pop();
                  for (int k = 0; k < 4; k++) {
                      int nx = x + dx[k], ny = y + dy[k];
                      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                      long long key = (long long)nx * SIDE + ny;
                      if (block.count(key) || seen.count(key)) continue;
                      if (key == goal) return true;
                      seen.insert(key);
                      if ((long long)seen.size() > limit) return true;
                      q.push({nx, ny});
                  }
              }
              return false;
          }

          bool isEscapePossible(vector<vector<int>>& blocked, vector<int>& source, vector<int>& target) {
              unordered_set<long long> block;
              for (auto& b : blocked) block.insert((long long)b[0] * 1000000 + b[1]);
              long long limit = (long long)blocked.size() * ((long long)blocked.size() - 1) / 2;
              return escBfs(block, limit, source, target) && escBfs(block, limit, target, source);
          }
        `,
        c: code`
          typedef struct { long long* keys; char* used; int cap; int size; } EscSet;

          static void escInit(EscSet* s, int cap) {
              s->cap = cap; s->size = 0;
              s->keys = (long long*)malloc(cap * sizeof(long long));
              s->used = (char*)calloc(cap, 1);
          }

          static int escSlot(EscSet* s, long long k) {
              unsigned long long h = ((unsigned long long)k * 11400714819323198485ULL) >> 17;
              int i = (int)(h & (unsigned long long)(s->cap - 1));
              while (s->used[i] && s->keys[i] != k) i = (i + 1) & (s->cap - 1);
              return i;
          }

          static int escHas(EscSet* s, long long k) { return s->used[escSlot(s, k)]; }

          static void escAdd(EscSet* s, long long k) {
              int i = escSlot(s, k);
              if (!s->used[i]) { s->used[i] = 1; s->keys[i] = k; s->size++; }
          }

          static int escBfs(EscSet* block, long long limit, int* src, int* dst) {
              const long long SIDE = 1000000;
              int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
              int cap = 1;
              while (cap < 4 * (limit + 8)) cap <<= 1;
              EscSet seen;
              escInit(&seen, cap);
              int* qx = (int*)malloc((limit + 8) * sizeof(int));
              int* qy = (int*)malloc((limit + 8) * sizeof(int));
              int head = 0, tail = 0, ok = 0;
              long long goal = dst[0] * SIDE + dst[1];
              escAdd(&seen, src[0] * SIDE + src[1]);
              qx[tail] = src[0]; qy[tail++] = src[1];
              while (head < tail && !ok) {
                  int x = qx[head], y = qy[head++];
                  for (int k = 0; k < 4; k++) {
                      int nx = x + dx[k], ny = y + dy[k];
                      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                      long long key = nx * SIDE + ny;
                      if (escHas(block, key) || escHas(&seen, key)) continue;
                      if (key == goal) { ok = 1; break; }
                      escAdd(&seen, key);
                      if (seen.size > limit) { ok = 1; break; }
                      qx[tail] = nx; qy[tail++] = ny;
                  }
              }
              free(seen.keys); free(seen.used); free(qx); free(qy);
              return ok;
          }

          bool isEscapePossible(int** blocked, int blockedSize, int* blockedColSize, int* source, int sourceSize, int* target, int targetSize) {
              EscSet block;
              escInit(&block, 1024);
              for (int i = 0; i < blockedSize; i++) escAdd(&block, (long long)blocked[i][0] * 1000000 + blocked[i][1]);
              long long limit = (long long)blockedSize * (blockedSize - 1) / 2;
              int ans = escBfs(&block, limit, source, target) && escBfs(&block, limit, target, source);
              free(block.keys); free(block.used);
              return ans;
          }
        `,
        csharp: code`
          public static bool IsEscapePossible(int[][] blocked, int[] source, int[] target)
          {
              var block = new HashSet<long>();
              foreach (var b in blocked) block.Add((long)b[0] * 1000000 + b[1]);
              long limit = (long)blocked.Length * (blocked.Length - 1) / 2;
              return EscBfs(block, limit, source, target) && EscBfs(block, limit, target, source);
          }

          static bool EscBfs(HashSet<long> block, long limit, int[] src, int[] dst)
          {
              const int SIDE = 1000000;
              int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
              long goal = (long)dst[0] * SIDE + dst[1];
              var seen = new HashSet<long> { (long)src[0] * SIDE + src[1] };
              var q = new Queue<int[]>();
              q.Enqueue(src);
              while (q.Count > 0)
              {
                  var cur = q.Dequeue();
                  for (int k = 0; k < 4; k++)
                  {
                      int nx = cur[0] + dx[k], ny = cur[1] + dy[k];
                      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
                      long key = (long)nx * SIDE + ny;
                      if (block.Contains(key) || seen.Contains(key)) continue;
                      if (key == goal) return true;
                      seen.Add(key);
                      if (seen.Count > limit) return true;
                      q.Enqueue(new int[] { nx, ny });
                  }
              }
              return false;
          }
        `,
        go: code`
          func isEscapePossible(blocked [][]int, source []int, target []int) bool {
              const SIDE = 1000000
              block := map[int]bool{}
              for _, b := range blocked {
                  block[b[0]*SIDE+b[1]] = true
              }
              limit := len(blocked) * (len(blocked) - 1) / 2
              dx := []int{1, -1, 0, 0}
              dy := []int{0, 0, 1, -1}
              bfs := func(src, dst []int) bool {
                  goal := dst[0]*SIDE + dst[1]
                  seen := map[int]bool{src[0]*SIDE + src[1]: true}
                  q := [][2]int{{src[0], src[1]}}
                  for h := 0; h < len(q); h++ {
                      for k := 0; k < 4; k++ {
                          nx, ny := q[h][0]+dx[k], q[h][1]+dy[k]
                          if nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE {
                              continue
                          }
                          key := nx*SIDE + ny
                          if block[key] || seen[key] {
                              continue
                          }
                          if key == goal {
                              return true
                          }
                          seen[key] = true
                          if len(seen) > limit {
                              return true
                          }
                          q = append(q, [2]int{nx, ny})
                      }
                  }
                  return false
              }
              return bfs(source, target) && bfs(target, source)
          }
        `,
        kotlin: code`
          fun isEscapePossible(blocked: Array<IntArray>, source: IntArray, target: IntArray): Boolean {
              val side = 1000000L
              val block = HashSet<Long>()
              for (b in blocked) block.add(b[0] * side + b[1])
              val limit = blocked.size.toLong() * (blocked.size - 1) / 2
              val dx = intArrayOf(1, -1, 0, 0)
              val dy = intArrayOf(0, 0, 1, -1)
              fun bfs(src: IntArray, dst: IntArray): Boolean {
                  val goal = dst[0] * side + dst[1]
                  val seen = HashSet<Long>()
                  seen.add(src[0] * side + src[1])
                  val q = ArrayList<IntArray>()
                  q.add(src)
                  var h = 0
                  while (h < q.size) {
                      val cur = q[h++]
                      for (k in 0 until 4) {
                          val nx = cur[0] + dx[k]
                          val ny = cur[1] + dy[k]
                          if (nx < 0 || ny < 0 || nx >= side || ny >= side) continue
                          val key = nx * side + ny
                          if (block.contains(key) || seen.contains(key)) continue
                          if (key == goal) return true
                          seen.add(key)
                          if (seen.size > limit) return true
                          q.add(intArrayOf(nx, ny))
                      }
                  }
                  return false
              }
              return bfs(source, target) && bfs(target, source)
          }
        `,
        swift: code`
          func isEscapePossible(_ blocked: [[Int]], _ source: [Int], _ target: [Int]) -> Bool {
              let side = 1000000
              let block = Set(blocked.map { $0[0] * side + $0[1] })
              let limit = blocked.count * (blocked.count - 1) / 2
              let dx = [1, -1, 0, 0], dy = [0, 0, 1, -1]
              func bfs(_ src: [Int], _ dst: [Int]) -> Bool {
                  let goal = dst[0] * side + dst[1]
                  var seen: Set<Int> = [src[0] * side + src[1]]
                  var q = [(src[0], src[1])]
                  var h = 0
                  while h < q.count {
                      let (x, y) = q[h]
                      h += 1
                      for k in 0..<4 {
                          let nx = x + dx[k], ny = y + dy[k]
                          if nx < 0 || ny < 0 || nx >= side || ny >= side { continue }
                          let key = nx * side + ny
                          if block.contains(key) || seen.contains(key) { continue }
                          if key == goal { return true }
                          seen.insert(key)
                          if seen.count > limit { return true }
                          q.append((nx, ny))
                      }
                  }
                  return false
              }
              return bfs(source, target) && bfs(target, source)
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn esc_bfs(block: &HashSet<i64>, limit: usize, src: &Vec<i32>, dst: &Vec<i32>) -> bool {
              let side: i64 = 1000000;
              let goal = dst[0] as i64 * side + dst[1] as i64;
              let mut seen: HashSet<i64> = HashSet::new();
              seen.insert(src[0] as i64 * side + src[1] as i64);
              let mut q: Vec<(i64, i64)> = vec![(src[0] as i64, src[1] as i64)];
              let mut h = 0;
              while h < q.len() {
                  let (x, y) = q[h];
                  h += 1;
                  for &(dx, dy) in [(1i64, 0i64), (-1, 0), (0, 1), (0, -1)].iter() {
                      let (nx, ny) = (x + dx, y + dy);
                      if nx < 0 || ny < 0 || nx >= side || ny >= side {
                          continue;
                      }
                      let key = nx * side + ny;
                      if block.contains(&key) || seen.contains(&key) {
                          continue;
                      }
                      if key == goal {
                          return true;
                      }
                      seen.insert(key);
                      if seen.len() > limit {
                          return true;
                      }
                      q.push((nx, ny));
                  }
              }
              false
          }

          fn isEscapePossible(blocked: Vec<Vec<i32>>, source: Vec<i32>, target: Vec<i32>) -> bool {
              let block: HashSet<i64> = blocked.iter().map(|b| b[0] as i64 * 1000000 + b[1] as i64).collect();
              let k = blocked.len();
              let limit = if k < 2 { 0 } else { k * (k - 1) / 2 };
              esc_bfs(&block, limit, &source, &target) && esc_bfs(&block, limit, &target, &source)
          }
        `,
        php: code`
          function isEscapePossible($blocked, $source, $target) {
              $block = [];
              foreach ($blocked as $b) $block[$b[0] * 1000000 + $b[1]] = true;
              $limit = intdiv(count($blocked) * (count($blocked) - 1), 2);
              return escBfs($block, $limit, $source, $target) && escBfs($block, $limit, $target, $source);
          }

          function escBfs(&$block, $limit, $src, $dst) {
              $SIDE = 1000000;
              $dx = [1, -1, 0, 0];
              $dy = [0, 0, 1, -1];
              $goal = $dst[0] * $SIDE + $dst[1];
              $seen = [$src[0] * $SIDE + $src[1] => true];
              $count = 1;
              $q = [$src];
              for ($h = 0; $h < count($q); $h++) {
                  for ($k = 0; $k < 4; $k++) {
                      $nx = $q[$h][0] + $dx[$k];
                      $ny = $q[$h][1] + $dy[$k];
                      if ($nx < 0 || $ny < 0 || $nx >= $SIDE || $ny >= $SIDE) continue;
                      $key = $nx * $SIDE + $ny;
                      if (isset($block[$key]) || isset($seen[$key])) continue;
                      if ($key == $goal) return true;
                      $seen[$key] = true;
                      if (++$count > $limit) return true;
                      $q[] = [$nx, $ny];
                  }
              }
              return false;
          }
        `,
        ruby: code`
          require 'set'

          def esc_bfs(block, limit, src, dst)
            side = 1_000_000
            goal = dst[0] * side + dst[1]
            seen = Set.new([src[0] * side + src[1]])
            q = [src]
            h = 0
            while h < q.length
              x, y = q[h]
              h += 1
              [[1, 0], [-1, 0], [0, 1], [0, -1]].each do |dx, dy|
                nx = x + dx
                ny = y + dy
                next if nx < 0 || ny < 0 || nx >= side || ny >= side
                key = nx * side + ny
                next if block.include?(key) || seen.include?(key)
                return true if key == goal
                seen << key
                return true if seen.size > limit
                q << [nx, ny]
              end
            end
            false
          end

          def isEscapePossible(blocked, source, target)
            block = Set.new(blocked.map { |x, y| x * 1_000_000 + y })
            limit = blocked.length * (blocked.length - 1) / 2
            esc_bfs(block, limit, source, target) && esc_bfs(block, limit, target, source)
          end
        `,
      },
    };
  })(),

  // ── Minimum Moves to Move a Box to Their Target Location (LC 1263) ──
  (() => {
    // BFS over pushes: a state is (box, the cell the player stands on after
    // the push); between pushes a flood fill decides which side of the box
    // the player can walk to. The solutions instead run a 0-1 search over
    // every (box, player) pair.
    const ref = (grid: string[]) => {
      const m = grid.length, n = grid[0].length;
      let S = -1, B = -1, T = -1;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        const ch = grid[r][c];
        if (ch === "S") S = r * n + c; else if (ch === "B") B = r * n + c; else if (ch === "T") T = r * n + c;
      }
      const free = (r: number, c: number) => r >= 0 && c >= 0 && r < m && c < n && grid[r][c] !== "#";
      const reach = (p: number, box: number) => {
        const seen = new Array(m * n).fill(false);
        seen[p] = true;
        const q = [p];
        for (let h = 0; h < q.length; h++) {
          const r = Math.floor(q[h] / n), c = q[h] % n;
          for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
            const x = nr * n + nc;
            if (free(nr, nc) && x !== box && !seen[x]) { seen[x] = true; q.push(x); }
          }
        }
        return seen;
      };
      const seenState = new Set<number>([B * m * n + S]);
      const q: number[][] = [[B, S, 0]];
      for (let h = 0; h < q.length; h++) {
        const [b, p, d] = q[h];
        const R = reach(p, b);
        const br = Math.floor(b / n), bc = b % n;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const fr = br + dr, fc = bc + dc, hr = br - dr, hc = bc - dc;
          if (!free(fr, fc) || !free(hr, hc) || !R[hr * n + hc]) continue;
          const nb = fr * n + fc;
          if (nb === T) return d + 1;
          const key = nb * m * n + b;
          if (seenState.has(key)) continue;
          seenState.add(key);
          q.push([nb, b, d + 1]);
        }
      }
      return -1;
    };
    return {
      slug: "minimum-moves-to-move-a-box-to-their-target-location",
      title: "Minimum Moves to Move a Box to Their Target Location",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Heap (Priority Queue)", "Matrix", "Google", "Amazon"],
      signature: { funcName: "minPushBox", params: [{ name: "grid", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Storekeeper is a game where a player pushes a box around a warehouse to a target. The warehouse is an `m x n` grid given as a list of strings, one per row:\n\n- `'S'` is the player, `'B'` the box and `'T'` the target — exactly one of each;\n- `'.'` is a free floor cell and `'#'` a wall.\n\nThe player walks up, down, left or right onto free floor cells (never through the box or a wall). Standing next to the box and walking into it **pushes** the box one cell in that direction, which is allowed only if the cell beyond the box is free floor inside the grid.\n\nReturn the **minimum number of pushes** needed to move the box onto the target, or `-1` if it cannot be done. Walking without pushing costs nothing.",
        [
          { in: "grid = [\"######\",\"#T####\",\"#..B.#\",\"#.##.#\",\"#...S#\",\"######\"]", out: "3", note: "Push the box left twice, then walk around and push it up onto the target." },
          { in: "grid = [\"######\",\"#T####\",\"#..B.#\",\"####.#\",\"#...S#\",\"######\"]", out: "-1", note: "The player can never get to the right side of the box to push it left." },
          { in: "grid = [\"######\",\"#T..##\",\"#.#B.#\",\"#....#\",\"#...S#\",\"######\"]", out: "5" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 20", "grid contains only the characters '.', '#', 'S', 'T' and 'B'", "there is exactly one 'S', one 'B' and one 'T' in grid"]),
      hints: [
        "The box alone is not a full state: whether a push is possible depends on where the player is. Use `(box cell, player cell)` as the state.",
        "A player step that does not touch the box costs 0 pushes; a step into the box moves the box and costs 1. That is a shortest path with edge weights 0 and 1.",
        "Process states in layers by push count: within a layer, expand all 0-cost walks first (they stay in the layer); pushes go to the next layer. The first time the box sits on the target, the layer number is the answer.",
      ],
      editorial: explain({
        idea: "Search over pairs `(box, player)`. Walking is free and pushing costs one, so this is a 0-1 shortest path: expand everything reachable without pushing before moving on to states that need one more push.",
        steps: [
          "Locate `S`, `B` and `T`. Number cells `0..m·n-1` and encode a state as `box · (m·n) + player`.",
          "Start layer 0 with the initial state. For the current layer `d`, scan its list (which grows while scanning): skip a state whose recorded distance is not `d`; if its box is on the target, return `d`.",
          "For each of the four directions, let the player step to the neighbouring cell. If that cell is the box and the cell beyond the box is free, the box moves there — record the new state at `d + 1` in the next layer. Otherwise, if the cell is free floor, record the new state at `d` and append it to the current layer.",
          "When a layer is exhausted, move to the next one. If no layer remains, return `-1`.",
        ],
        why: "Every state in layer `d` is reachable with exactly `d` pushes and no fewer: zero-cost moves are explored completely before any `d + 1` state is processed, which is the 0-1 BFS invariant (Dijkstra with only two edge weights). The box first reaches the target in the lowest layer that contains such a state, so the answer is minimal.",
        time: "O((m · n)^2)",
        space: "O((m · n)^2)",
        pitfalls: [
          "Searching on box positions alone, ignoring where the player can stand, accepts pushes from the wrong side.",
          "The player cannot walk through the box while getting into position.",
          "A state can first be reached by a push and later, in the same round, more cheaply by a walk — keep the smaller distance.",
        ],
      }),
      examples: [
        { input: "[\"######\",\"#T####\",\"#..B.#\",\"#.##.#\",\"#...S#\",\"######\"]", expectedOutput: "3" },
        { input: "[\"######\",\"#T####\",\"#..B.#\",\"####.#\",\"#...S#\",\"######\"]", expectedOutput: "-1" },
        { input: "[\"######\",\"#T..##\",\"#.#B.#\",\"#....#\",\"#...S#\",\"######\"]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          // At most 6 x 6: the search is over (box, player) states, and 5,000
          // 8 x 8 grids ran past Paiza's per-run limit in Python and Ruby.
          const m = ri(rng, rng() < 0.1 ? 1 : 3, pick(rng, [4, 5, 6, 6]));
          const n = ri(rng, rng() < 0.1 ? 1 : 3, pick(rng, [4, 5, 6, 6]));
          if (m * n < 3) continue;
          const pw = pick(rng, [0, 0.05, 0.12, 0.25]);
          const g: string[][] = Array.from({ length: m }, () => Array.from({ length: n }, (): string => (rng() < pw ? "#" : ".")));
          // The box usually starts away from the walls of the grid, where it can still be pushed both ways.
          const interior = Array.from({ length: m * n }, (_, i) => i).filter((i) => { const r = Math.floor(i / n), c = i % n; return r > 0 && c > 0 && r < m - 1 && c < n - 1; });
          const b = interior.length && rng() < 0.75 ? pick(rng, interior) : ri(rng, 0, m * n - 1);
          const rest = shuffle(rng, Array.from({ length: m * n }, (_, i) => i).filter((i) => i !== b)).slice(0, 2);
          const cells = [rest[0], b, rest[1]];
          ["S", "B", "T"].forEach((ch, i) => { g[Math.floor(cells[i] / n)][cells[i] % n] = ch; });
          const grid = g.map((row) => row.join(""));
          return { input: fmtStrArr(grid), expectedOutput: String(ref(grid)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def minPushBox(grid: List[str]) -> int:
              m, n = len(grid), len(grid[0])
              N = m * n
              S = B = T = -1
              for r in range(m):
                  for c in range(n):
                      ch = grid[r][c]
                      if ch == 'S':
                          S = r * n + c
                      elif ch == 'B':
                          B = r * n + c
                      elif ch == 'T':
                          T = r * n + c

              def free(r, c):
                  return 0 <= r < m and 0 <= c < n and grid[r][c] != '#'

              dist = [-1] * (N * N)
              start = B * N + S
              dist[start] = 0
              cur = [start]
              d = 0
              dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))
              while cur:
                  nxt = []
                  i = 0
                  while i < len(cur):
                      st = cur[i]
                      i += 1
                      if dist[st] != d:
                          continue
                      b, p = divmod(st, N)
                      if b == T:
                          return d
                      br, bc = divmod(b, n)
                      pr, pc = divmod(p, n)
                      for dr, dc in dirs:
                          nr, nc = pr + dr, pc + dc
                          if not free(nr, nc):
                              continue
                          np_ = nr * n + nc
                          if np_ == b:
                              if not free(br + dr, bc + dc):
                                  continue
                              ns = ((br + dr) * n + bc + dc) * N + np_
                              if dist[ns] == -1:
                                  dist[ns] = d + 1
                                  nxt.append(ns)
                          else:
                              ns = b * N + np_
                              if dist[ns] == -1 or dist[ns] > d:
                                  dist[ns] = d
                                  cur.append(ns)
                  cur = nxt
                  d += 1
              return -1
        `,
        javascript: code`
          var minPushBox = function(grid) {
              var m = grid.length, n = grid[0].length, N = m * n, S = -1, B = -1, T = -1;
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) {
                  var ch = grid[r][c];
                  if (ch === "S") S = r * n + c; else if (ch === "B") B = r * n + c; else if (ch === "T") T = r * n + c;
              }
              var free = function(rr, cc) { return rr >= 0 && cc >= 0 && rr < m && cc < n && grid[rr][cc] !== "#"; };
              var dist = new Array(N * N);
              for (var i = 0; i < N * N; i++) dist[i] = -1;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var start = B * N + S;
              dist[start] = 0;
              var cur = [start], d = 0;
              while (cur.length) {
                  var nxt = [];
                  for (var h = 0; h < cur.length; h++) {
                      var st = cur[h];
                      if (dist[st] !== d) continue;
                      var b = Math.floor(st / N), p = st % N;
                      if (b === T) return d;
                      var br = Math.floor(b / n), bc = b % n, pr = Math.floor(p / n), pc = p % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = pr + dr[k], nc = pc + dc[k];
                          if (!free(nr, nc)) continue;
                          var np = nr * n + nc, ns;
                          if (np === b) {
                              if (!free(br + dr[k], bc + dc[k])) continue;
                              ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] === -1) { dist[ns] = d + 1; nxt.push(ns); }
                          } else {
                              ns = b * N + np;
                              if (dist[ns] === -1 || dist[ns] > d) { dist[ns] = d; cur.push(ns); }
                          }
                      }
                  }
                  cur = nxt;
                  d++;
              }
              return -1;
          };
        `,
        typescript: code`
          function minPushBox(grid: string[]): number {
              var m = grid.length, n = grid[0].length, N = m * n, S = -1, B = -1, T = -1;
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) {
                  var ch = grid[r].charAt(c);
                  if (ch === "S") S = r * n + c; else if (ch === "B") B = r * n + c; else if (ch === "T") T = r * n + c;
              }
              function free(rr: number, cc: number): boolean { return rr >= 0 && cc >= 0 && rr < m && cc < n && grid[rr].charAt(cc) !== "#"; }
              var dist: number[] = new Array(N * N);
              for (var i = 0; i < N * N; i++) dist[i] = -1;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var start = B * N + S;
              dist[start] = 0;
              var cur: number[] = [start], d = 0;
              while (cur.length) {
                  var nxt: number[] = [];
                  for (var h = 0; h < cur.length; h++) {
                      var st = cur[h];
                      if (dist[st] !== d) continue;
                      var b = Math.floor(st / N), p = st % N;
                      if (b === T) return d;
                      var br = Math.floor(b / n), bc = b % n, pr = Math.floor(p / n), pc = p % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = pr + dr[k], nc = pc + dc[k];
                          if (!free(nr, nc)) continue;
                          var np = nr * n + nc, ns: number;
                          if (np === b) {
                              if (!free(br + dr[k], bc + dc[k])) continue;
                              ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] === -1) { dist[ns] = d + 1; nxt.push(ns); }
                          } else {
                              ns = b * N + np;
                              if (dist[ns] === -1 || dist[ns] > d) { dist[ns] = d; cur.push(ns); }
                          }
                      }
                  }
                  cur = nxt;
                  d++;
              }
              return -1;
          }
        `,
        java: code`
          public static int minPushBox(String[] grid) {
              int m = grid.length, n = grid[0].length(), N = m * n, S = -1, B = -1, T = -1;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  char ch = grid[r].charAt(c);
                  if (ch == 'S') S = r * n + c; else if (ch == 'B') B = r * n + c; else if (ch == 'T') T = r * n + c;
              }
              int[] dist = new int[N * N];
              Arrays.fill(dist, -1);
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              int start = B * N + S;
              dist[start] = 0;
              List<Integer> cur = new ArrayList<>();
              cur.add(start);
              int d = 0;
              while (!cur.isEmpty()) {
                  List<Integer> nxt = new ArrayList<>();
                  for (int h = 0; h < cur.size(); h++) {
                      int st = cur.get(h);
                      if (dist[st] != d) continue;
                      int b = st / N, p = st % N;
                      if (b == T) return d;
                      int br = b / n, bc = b % n, pr = p / n, pc = p % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = pr + dr[k], nc = pc + dc[k];
                          if (!boxFree(grid, m, n, nr, nc)) continue;
                          int np = nr * n + nc;
                          if (np == b) {
                              if (!boxFree(grid, m, n, br + dr[k], bc + dc[k])) continue;
                              int ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] == -1) { dist[ns] = d + 1; nxt.add(ns); }
                          } else {
                              int ns = b * N + np;
                              if (dist[ns] == -1 || dist[ns] > d) { dist[ns] = d; cur.add(ns); }
                          }
                      }
                  }
                  cur = nxt;
                  d++;
              }
              return -1;
          }

          static boolean boxFree(String[] grid, int m, int n, int r, int c) {
              return r >= 0 && c >= 0 && r < m && c < n && grid[r].charAt(c) != '#';
          }
        `,
        cpp: code`
          int minPushBox(vector<string>& grid) {
              int m = grid.size(), n = grid[0].size(), N = m * n, S = -1, B = -1, T = -1;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  char ch = grid[r][c];
                  if (ch == 'S') S = r * n + c; else if (ch == 'B') B = r * n + c; else if (ch == 'T') T = r * n + c;
              }
              auto freeCell = [&](int r, int c) { return r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#'; };
              vector<int> dist(N * N, -1);
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int start = B * N + S;
              dist[start] = 0;
              vector<int> cur{start};
              int d = 0;
              while (!cur.empty()) {
                  vector<int> nxt;
                  for (size_t h = 0; h < cur.size(); h++) {
                      int st = cur[h];
                      if (dist[st] != d) continue;
                      int b = st / N, p = st % N;
                      if (b == T) return d;
                      int br = b / n, bc = b % n, pr = p / n, pc = p % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = pr + dr[k], nc = pc + dc[k];
                          if (!freeCell(nr, nc)) continue;
                          int np = nr * n + nc;
                          if (np == b) {
                              if (!freeCell(br + dr[k], bc + dc[k])) continue;
                              int ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] == -1) { dist[ns] = d + 1; nxt.push_back(ns); }
                          } else {
                              int ns = b * N + np;
                              if (dist[ns] == -1 || dist[ns] > d) { dist[ns] = d; cur.push_back(ns); }
                          }
                      }
                  }
                  cur = nxt;
                  d++;
              }
              return -1;
          }
        `,
        c: code`
          static int boxFree(char** grid, int m, int n, int r, int c) {
              return r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#';
          }

          int minPushBox(char** grid, int gridSize) {
              int m = gridSize, n = (int)strlen(grid[0]), N = m * n, S = -1, B = -1, T = -1;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  char ch = grid[r][c];
                  if (ch == 'S') S = r * n + c; else if (ch == 'B') B = r * n + c; else if (ch == 'T') T = r * n + c;
              }
              int* dist = (int*)malloc((size_t)N * N * sizeof(int));
              for (int i = 0; i < N * N; i++) dist[i] = -1;
              /* Each state enters a layer list at most twice (once by a push, once by a walk). */
              int* cur = (int*)malloc((size_t)2 * N * N * sizeof(int));
              int* nxt = (int*)malloc((size_t)2 * N * N * sizeof(int));
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int curLen = 0, d = 0, ans = -1;
              cur[curLen++] = B * N + S;
              dist[B * N + S] = 0;
              while (curLen > 0 && ans < 0) {
                  int nxtLen = 0;
                  for (int h = 0; h < curLen && ans < 0; h++) {
                      int st = cur[h];
                      if (dist[st] != d) continue;
                      int b = st / N, p = st % N;
                      if (b == T) { ans = d; break; }
                      int br = b / n, bc = b % n, pr = p / n, pc = p % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = pr + dr[k], nc = pc + dc[k];
                          if (!boxFree(grid, m, n, nr, nc)) continue;
                          int np = nr * n + nc;
                          if (np == b) {
                              if (!boxFree(grid, m, n, br + dr[k], bc + dc[k])) continue;
                              int ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] == -1) { dist[ns] = d + 1; nxt[nxtLen++] = ns; }
                          } else {
                              int ns = b * N + np;
                              if (dist[ns] == -1 || dist[ns] > d) { dist[ns] = d; cur[curLen++] = ns; }
                          }
                      }
                  }
                  int* tmp = cur; cur = nxt; nxt = tmp;
                  curLen = nxtLen;
                  d++;
              }
              free(dist); free(cur); free(nxt);
              return ans;
          }
        `,
        csharp: code`
          public static int MinPushBox(string[] grid)
          {
              int m = grid.Length, n = grid[0].Length, N = m * n, S = -1, B = -1, T = -1;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++)
              {
                  char ch = grid[r][c];
                  if (ch == 'S') S = r * n + c; else if (ch == 'B') B = r * n + c; else if (ch == 'T') T = r * n + c;
              }
              var dist = new int[N * N];
              for (int i = 0; i < N * N; i++) dist[i] = -1;
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              int start = B * N + S;
              dist[start] = 0;
              var cur = new List<int> { start };
              int d = 0;
              while (cur.Count > 0)
              {
                  var nxt = new List<int>();
                  for (int h = 0; h < cur.Count; h++)
                  {
                      int st = cur[h];
                      if (dist[st] != d) continue;
                      int b = st / N, p = st % N;
                      if (b == T) return d;
                      int br = b / n, bc = b % n, pr = p / n, pc = p % n;
                      for (int k = 0; k < 4; k++)
                      {
                          int nr = pr + dr[k], nc = pc + dc[k];
                          if (!BoxFree(grid, m, n, nr, nc)) continue;
                          int np = nr * n + nc;
                          if (np == b)
                          {
                              if (!BoxFree(grid, m, n, br + dr[k], bc + dc[k])) continue;
                              int ns = ((br + dr[k]) * n + bc + dc[k]) * N + np;
                              if (dist[ns] == -1) { dist[ns] = d + 1; nxt.Add(ns); }
                          }
                          else
                          {
                              int ns = b * N + np;
                              if (dist[ns] == -1 || dist[ns] > d) { dist[ns] = d; cur.Add(ns); }
                          }
                      }
                  }
                  cur = nxt;
                  d++;
              }
              return -1;
          }

          static bool BoxFree(string[] grid, int m, int n, int r, int c)
          {
              return r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#';
          }
        `,
        go: code`
          func minPushBox(grid []string) int {
              m, n := len(grid), len(grid[0])
              N := m * n
              S, B, T := -1, -1, -1
              for r := 0; r < m; r++ {
                  for c := 0; c < n; c++ {
                      switch grid[r][c] {
                      case 'S':
                          S = r*n + c
                      case 'B':
                          B = r*n + c
                      case 'T':
                          T = r*n + c
                      }
                  }
              }
              free := func(r, c int) bool { return r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#' }
              dist := make([]int, N*N)
              for i := range dist {
                  dist[i] = -1
              }
              dr := []int{1, -1, 0, 0}
              dc := []int{0, 0, 1, -1}
              start := B*N + S
              dist[start] = 0
              cur := []int{start}
              d := 0
              for len(cur) > 0 {
                  nxt := []int{}
                  for h := 0; h < len(cur); h++ {
                      st := cur[h]
                      if dist[st] != d {
                          continue
                      }
                      b, p := st/N, st%N
                      if b == T {
                          return d
                      }
                      br, bc, pr, pc := b/n, b%n, p/n, p%n
                      for k := 0; k < 4; k++ {
                          nr, nc := pr+dr[k], pc+dc[k]
                          if !free(nr, nc) {
                              continue
                          }
                          np := nr*n + nc
                          if np == b {
                              if !free(br+dr[k], bc+dc[k]) {
                                  continue
                              }
                              ns := ((br+dr[k])*n+bc+dc[k])*N + np
                              if dist[ns] == -1 {
                                  dist[ns] = d + 1
                                  nxt = append(nxt, ns)
                              }
                          } else {
                              ns := b*N + np
                              if dist[ns] == -1 || dist[ns] > d {
                                  dist[ns] = d
                                  cur = append(cur, ns)
                              }
                          }
                      }
                  }
                  cur = nxt
                  d++
              }
              return -1
          }
        `,
        kotlin: code`
          fun minPushBox(grid: Array<String>): Int {
              val m = grid.size
              val n = grid[0].length
              val N = m * n
              var S = -1
              var B = -1
              var T = -1
              for (r in 0 until m) for (c in 0 until n) {
                  when (grid[r][c]) {
                      'S' -> S = r * n + c
                      'B' -> B = r * n + c
                      'T' -> T = r * n + c
                  }
              }
              fun free(r: Int, c: Int) = r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#'
              val dist = IntArray(N * N) { -1 }
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              val start = B * N + S
              dist[start] = 0
              var cur = ArrayList<Int>()
              cur.add(start)
              var d = 0
              while (cur.isNotEmpty()) {
                  val nxt = ArrayList<Int>()
                  var h = 0
                  while (h < cur.size) {
                      val st = cur[h]
                      h++
                      if (dist[st] != d) continue
                      val b = st / N
                      val p = st % N
                      if (b == T) return d
                      val br = b / n
                      val bc = b % n
                      val pr = p / n
                      val pc = p % n
                      for (k in 0 until 4) {
                          val nr = pr + dr[k]
                          val nc = pc + dc[k]
                          if (!free(nr, nc)) continue
                          val np = nr * n + nc
                          if (np == b) {
                              if (!free(br + dr[k], bc + dc[k])) continue
                              val ns = ((br + dr[k]) * n + bc + dc[k]) * N + np
                              if (dist[ns] == -1) { dist[ns] = d + 1; nxt.add(ns) }
                          } else {
                              val ns = b * N + np
                              if (dist[ns] == -1 || dist[ns] > d) { dist[ns] = d; cur.add(ns) }
                          }
                      }
                  }
                  cur = nxt
                  d++
              }
              return -1
          }
        `,
        swift: code`
          func minPushBox(_ grid: [String]) -> Int {
              let g = grid.map { Array($0.utf8) }
              let m = g.count, n = g[0].count, N = m * n
              var S = -1, B = -1, T = -1
              for r in 0..<m {
                  for c in 0..<n {
                      switch g[r][c] {
                      case UInt8(ascii: "S"): S = r * n + c
                      case UInt8(ascii: "B"): B = r * n + c
                      case UInt8(ascii: "T"): T = r * n + c
                      default: break
                      }
                  }
              }
              let wall = UInt8(ascii: "#")
              func free(_ r: Int, _ c: Int) -> Bool { return r >= 0 && c >= 0 && r < m && c < n && g[r][c] != wall }
              var dist = [Int](repeating: -1, count: N * N)
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              let start = B * N + S
              dist[start] = 0
              var cur = [start]
              var d = 0
              while !cur.isEmpty {
                  var nxt = [Int]()
                  var h = 0
                  while h < cur.count {
                      let st = cur[h]
                      h += 1
                      if dist[st] != d { continue }
                      let b = st / N, p = st % N
                      if b == T { return d }
                      let br = b / n, bc = b % n, pr = p / n, pc = p % n
                      for k in 0..<4 {
                          let nr = pr + dr[k], nc = pc + dc[k]
                          if !free(nr, nc) { continue }
                          let np = nr * n + nc
                          if np == b {
                              if !free(br + dr[k], bc + dc[k]) { continue }
                              let ns = ((br + dr[k]) * n + bc + dc[k]) * N + np
                              if dist[ns] == -1 { dist[ns] = d + 1; nxt.append(ns) }
                          } else {
                              let ns = b * N + np
                              if dist[ns] == -1 || dist[ns] > d { dist[ns] = d; cur.append(ns) }
                          }
                      }
                  }
                  cur = nxt
                  d += 1
              }
              return -1
          }
        `,
        rust: code`
          fn minPushBox(grid: Vec<String>) -> i32 {
              let g: Vec<Vec<u8>> = grid.iter().map(|s| s.as_bytes().to_vec()).collect();
              let (m, n) = (g.len() as i32, g[0].len() as i32);
              let nn = (m * n) as usize;
              let (mut s0, mut b0, mut t0) = (0usize, 0usize, 0usize);
              for r in 0..m as usize {
                  for c in 0..n as usize {
                      let cell = r * n as usize + c;
                      match g[r][c] {
                          b'S' => s0 = cell,
                          b'B' => b0 = cell,
                          b'T' => t0 = cell,
                          _ => {}
                      }
                  }
              }
              let free = |r: i32, c: i32| r >= 0 && c >= 0 && r < m && c < n && g[r as usize][c as usize] != b'#';
              let mut dist = vec![-1i32; nn * nn];
              let dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)];
              let start = b0 * nn + s0;
              dist[start] = 0;
              let mut cur = vec![start];
              let mut d = 0i32;
              while !cur.is_empty() {
                  let mut nxt = Vec::new();
                  let mut h = 0;
                  while h < cur.len() {
                      let st = cur[h];
                      h += 1;
                      if dist[st] != d {
                          continue;
                      }
                      let (b, p) = (st / nn, st % nn);
                      if b == t0 {
                          return d;
                      }
                      let (br, bc) = ((b / n as usize) as i32, (b % n as usize) as i32);
                      let (pr, pc) = ((p / n as usize) as i32, (p % n as usize) as i32);
                      for &(dr, dc) in dirs.iter() {
                          let (nr, nc) = (pr + dr, pc + dc);
                          if !free(nr, nc) {
                              continue;
                          }
                          let np = (nr * n + nc) as usize;
                          if np == b {
                              if !free(br + dr, bc + dc) {
                                  continue;
                              }
                              let ns = ((br + dr) * n + bc + dc) as usize * nn + np;
                              if dist[ns] == -1 {
                                  dist[ns] = d + 1;
                                  nxt.push(ns);
                              }
                          } else {
                              let ns = b * nn + np;
                              if dist[ns] == -1 || dist[ns] > d {
                                  dist[ns] = d;
                                  cur.push(ns);
                              }
                          }
                      }
                  }
                  cur = nxt;
                  d += 1;
              }
              -1
          }
        `,
        php: code`
          function minPushBox($grid) {
              $m = count($grid);
              $n = strlen($grid[0]);
              $N = $m * $n;
              $S = $B = $T = -1;
              for ($r = 0; $r < $m; $r++)
                  for ($c = 0; $c < $n; $c++) {
                      $ch = $grid[$r][$c];
                      if ($ch === 'S') $S = $r * $n + $c;
                      elseif ($ch === 'B') $B = $r * $n + $c;
                      elseif ($ch === 'T') $T = $r * $n + $c;
                  }
              $dist = array_fill(0, $N * $N, -1);
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $start = $B * $N + $S;
              $dist[$start] = 0;
              $cur = [$start];
              $d = 0;
              while ($cur) {
                  $nxt = [];
                  for ($h = 0; $h < count($cur); $h++) {
                      $st = $cur[$h];
                      if ($dist[$st] != $d) continue;
                      $b = intdiv($st, $N);
                      $p = $st % $N;
                      if ($b == $T) return $d;
                      $br = intdiv($b, $n); $bc = $b % $n;
                      $pr = intdiv($p, $n); $pc = $p % $n;
                      for ($k = 0; $k < 4; $k++) {
                          $nr = $pr + $dr[$k];
                          $nc = $pc + $dc[$k];
                          if ($nr < 0 || $nc < 0 || $nr >= $m || $nc >= $n || $grid[$nr][$nc] === '#') continue;
                          $np = $nr * $n + $nc;
                          if ($np == $b) {
                              $fr = $br + $dr[$k];
                              $fc = $bc + $dc[$k];
                              if ($fr < 0 || $fc < 0 || $fr >= $m || $fc >= $n || $grid[$fr][$fc] === '#') continue;
                              $ns = ($fr * $n + $fc) * $N + $np;
                              if ($dist[$ns] == -1) { $dist[$ns] = $d + 1; $nxt[] = $ns; }
                          } else {
                              $ns = $b * $N + $np;
                              if ($dist[$ns] == -1 || $dist[$ns] > $d) { $dist[$ns] = $d; $cur[] = $ns; }
                          }
                      }
                  }
                  $cur = $nxt;
                  $d++;
              }
              return -1;
          }
        `,
        ruby: code`
          def minPushBox(grid)
            m = grid.length
            n = grid[0].length
            nn = m * n
            s0 = b0 = t0 = -1
            m.times do |r|
              n.times do |c|
                case grid[r][c]
                when 'S' then s0 = r * n + c
                when 'B' then b0 = r * n + c
                when 'T' then t0 = r * n + c
                end
              end
            end
            free = ->(r, c) { r >= 0 && c >= 0 && r < m && c < n && grid[r][c] != '#' }
            dist = Array.new(nn * nn, -1)
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            start = b0 * nn + s0
            dist[start] = 0
            cur = [start]
            d = 0
            until cur.empty?
              nxt = []
              h = 0
              while h < cur.length
                st = cur[h]
                h += 1
                next if dist[st] != d
                b, p = st.divmod(nn)
                return d if b == t0
                br, bc = b.divmod(n)
                pr, pc = p.divmod(n)
                dirs.each do |dr, dc|
                  nr = pr + dr
                  nc = pc + dc
                  next unless free.call(nr, nc)
                  np = nr * n + nc
                  if np == b
                    next unless free.call(br + dr, bc + dc)
                    ns = ((br + dr) * n + bc + dc) * nn + np
                    if dist[ns] == -1
                      dist[ns] = d + 1
                      nxt << ns
                    end
                  else
                    ns = b * nn + np
                    if dist[ns] == -1 || dist[ns] > d
                      dist[ns] = d
                      cur << ns
                    end
                  end
                end
              end
              cur = nxt
              d += 1
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Flips to Convert Binary Matrix to Zero Matrix (LC 1284) ──
  (() => {
    // Flips commute and two flips of one cell cancel, so an answer is a set
    // of cells: try every subset and keep the smallest that clears the matrix.
    const ref = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length, cells = m * n;
      let best = -1;
      for (let set = 0; set < 1 << cells; set++) {
        const g = mat.map((r) => r.slice());
        let size = 0;
        for (let k = 0; k < cells; k++) {
          if (!(set & (1 << k))) continue;
          size++;
          const r = Math.floor(k / n), c = k % n;
          for (const [nr, nc] of [[r, c], [r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) if (nr >= 0 && nc >= 0 && nr < m && nc < n) g[nr][nc] ^= 1;
        }
        if (g.every((row) => row.every((v) => v === 0)) && (best === -1 || size < best)) best = size;
      }
      return best;
    };
    return {
      slug: "minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix",
      title: "Minimum Number of Flips to Convert Binary Matrix to Zero Matrix",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Breadth-First Search", "Matrix", "Google", "Airbnb"],
      signature: { funcName: "minFlips", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` binary matrix `mat`. In one step you choose a cell and **flip** it together with its up-to-four neighbours (those sharing a side): every `0` among them becomes `1` and every `1` becomes `0`.\n\nReturn the minimum number of steps needed to turn `mat` into the all-zero matrix, or `-1` if that is impossible.",
        [
          { in: "mat = [[0,0],[0,1]]", out: "3", note: "Flip (1,0), then (0,1), then (1,1)." },
          { in: "mat = [[0]]", out: "0", note: "It is already the zero matrix." },
          { in: "mat = [[1,0,0],[1,0,0]]", out: "-1", note: "No sequence of flips clears this matrix." },
        ],
        ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 3", "mat[i][j] is 0 or 1"]),
      hints: [
        "With at most 9 cells there are at most `2^9 = 512` possible matrices. Encode one as a bitmask.",
        "Each flip XORs the mask with a fixed pattern (the cell and its neighbours). Precompute the pattern for every cell.",
        "Run a BFS from the starting mask over these XOR moves; the distance at which mask `0` is first reached is the answer, and `-1` if it never is.",
      ],
      editorial: explain({
        idea: "The matrix is tiny, so treat every matrix as a node of a graph with at most 512 nodes, joined by single flips, and find the shortest path to the zero matrix with breadth-first search.",
        steps: [
          "Encode `mat` as a bitmask: bit `i · n + j` is `mat[i][j]`.",
          "For each cell build `flip[k]`, the mask of that cell and its in-grid neighbours.",
          "BFS from the start mask. From a mask `x`, the neighbours are `x ^ flip[k]` for every `k`.",
          "Return the BFS distance of mask `0`, or `-1` if it is never reached.",
        ],
        why: "BFS on an unweighted graph returns the fewest edges to every reachable node; here an edge is one step. Because flips commute and flipping a cell twice undoes it, an optimal answer never flips a cell twice — at most 9 steps — but BFS does not need that fact to be correct.",
        time: "O(2^(m·n) · m · n)",
        space: "O(2^(m·n))",
        pitfalls: [
          "Flipping includes the chosen cell itself, not only its neighbours.",
          "Neighbours outside the matrix are simply skipped — do not wrap around.",
          "Return `0` straight away when the matrix is already zero.",
        ],
      }),
      examples: [
        { input: "[[0,0],[0,1]]", expectedOutput: "3" },
        { input: "[[0]]", expectedOutput: "0" },
        { input: "[[1,0,0],[1,0,0]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 3), n = ri(rng, 1, 3);
        const p = pick(rng, [0.2, 0.5, 0.8]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      hiddenCount: 800,
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def minFlips(mat: List[List[int]]) -> int:
              m, n = len(mat), len(mat[0])
              start = 0
              for i in range(m):
                  for j in range(n):
                      if mat[i][j]:
                          start |= 1 << (i * n + j)
              flips = []
              for i in range(m):
                  for j in range(n):
                      f = 0
                      for r, c in ((i, j), (i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                          if 0 <= r < m and 0 <= c < n:
                              f |= 1 << (r * n + c)
                      flips.append(f)
              dist = [-1] * (1 << (m * n))
              dist[start] = 0
              q = deque([start])
              while q:
                  x = q.popleft()
                  if x == 0:
                      return dist[x]
                  for f in flips:
                      y = x ^ f
                      if dist[y] == -1:
                          dist[y] = dist[x] + 1
                          q.append(y)
              return -1
        `,
        javascript: code`
          var minFlips = function(mat) {
              var m = mat.length, n = mat[0].length, start = 0, flips = [];
              for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) if (mat[i][j]) start |= 1 << (i * n + j);
              var dr = [0, 1, -1, 0, 0], dc = [0, 0, 0, 1, -1];
              for (var a = 0; a < m; a++) for (var b = 0; b < n; b++) {
                  var f = 0;
                  for (var k = 0; k < 5; k++) {
                      var r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips.push(f);
              }
              var dist = new Array(1 << (m * n));
              for (var t = 0; t < dist.length; t++) dist[t] = -1;
              dist[start] = 0;
              var q = [start];
              for (var h = 0; h < q.length; h++) {
                  var x = q[h];
                  if (x === 0) return dist[x];
                  for (var z = 0; z < flips.length; z++) {
                      var y = x ^ flips[z];
                      if (dist[y] === -1) { dist[y] = dist[x] + 1; q.push(y); }
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function minFlips(mat: number[][]): number {
              var m = mat.length, n = mat[0].length, start = 0, flips: number[] = [];
              for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) if (mat[i][j]) start |= 1 << (i * n + j);
              var dr = [0, 1, -1, 0, 0], dc = [0, 0, 0, 1, -1];
              for (var a = 0; a < m; a++) for (var b = 0; b < n; b++) {
                  var f = 0;
                  for (var k = 0; k < 5; k++) {
                      var r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips.push(f);
              }
              var dist: number[] = new Array(1 << (m * n));
              for (var t = 0; t < dist.length; t++) dist[t] = -1;
              dist[start] = 0;
              var q: number[] = [start];
              for (var h = 0; h < q.length; h++) {
                  var x = q[h];
                  if (x === 0) return dist[x];
                  for (var z = 0; z < flips.length; z++) {
                      var y = x ^ flips[z];
                      if (dist[y] === -1) { dist[y] = dist[x] + 1; q.push(y); }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minFlips(int[][] mat) {
              int m = mat.length, n = mat[0].length, start = 0;
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (mat[i][j] == 1) start |= 1 << (i * n + j);
              int[] dr = {0, 1, -1, 0, 0}, dc = {0, 0, 0, 1, -1};
              int[] flips = new int[m * n];
              for (int a = 0; a < m; a++) for (int b = 0; b < n; b++) {
                  int f = 0;
                  for (int k = 0; k < 5; k++) {
                      int r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips[a * n + b] = f;
              }
              int[] dist = new int[1 << (m * n)];
              Arrays.fill(dist, -1);
              int[] q = new int[1 << (m * n)];
              int head = 0, tail = 0;
              dist[start] = 0;
              q[tail++] = start;
              while (head < tail) {
                  int x = q[head++];
                  if (x == 0) return dist[x];
                  for (int f : flips) {
                      int y = x ^ f;
                      if (dist[y] == -1) { dist[y] = dist[x] + 1; q[tail++] = y; }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minFlips(vector<vector<int>>& mat) {
              int m = mat.size(), n = mat[0].size(), start = 0;
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (mat[i][j]) start |= 1 << (i * n + j);
              int dr[5] = {0, 1, -1, 0, 0}, dc[5] = {0, 0, 0, 1, -1};
              vector<int> flips;
              for (int a = 0; a < m; a++) for (int b = 0; b < n; b++) {
                  int f = 0;
                  for (int k = 0; k < 5; k++) {
                      int r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips.push_back(f);
              }
              vector<int> dist(1 << (m * n), -1);
              queue<int> q;
              dist[start] = 0;
              q.push(start);
              while (!q.empty()) {
                  int x = q.front(); q.pop();
                  if (x == 0) return dist[x];
                  for (int f : flips) {
                      int y = x ^ f;
                      if (dist[y] == -1) { dist[y] = dist[x] + 1; q.push(y); }
                  }
              }
              return -1;
          }
        `,
        c: code`
          int minFlips(int** mat, int matSize, int* matColSize) {
              int m = matSize, n = matColSize[0], start = 0, total = 1 << (m * n);
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (mat[i][j]) start |= 1 << (i * n + j);
              int dr[5] = {0, 1, -1, 0, 0}, dc[5] = {0, 0, 0, 1, -1};
              int flips[9];
              for (int a = 0; a < m; a++) for (int b = 0; b < n; b++) {
                  int f = 0;
                  for (int k = 0; k < 5; k++) {
                      int r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips[a * n + b] = f;
              }
              int* dist = (int*)malloc(total * sizeof(int));
              int* q = (int*)malloc(total * sizeof(int));
              for (int i = 0; i < total; i++) dist[i] = -1;
              int head = 0, tail = 0, ans = -1;
              dist[start] = 0;
              q[tail++] = start;
              while (head < tail) {
                  int x = q[head++];
                  if (x == 0) { ans = dist[x]; break; }
                  for (int k = 0; k < m * n; k++) {
                      int y = x ^ flips[k];
                      if (dist[y] == -1) { dist[y] = dist[x] + 1; q[tail++] = y; }
                  }
              }
              free(dist);
              free(q);
              return ans;
          }
        `,
        csharp: code`
          public static int MinFlips(int[][] mat)
          {
              int m = mat.Length, n = mat[0].Length, start = 0;
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) if (mat[i][j] == 1) start |= 1 << (i * n + j);
              int[] dr = { 0, 1, -1, 0, 0 }, dc = { 0, 0, 0, 1, -1 };
              var flips = new List<int>();
              for (int a = 0; a < m; a++) for (int b = 0; b < n; b++)
              {
                  int f = 0;
                  for (int k = 0; k < 5; k++)
                  {
                      int r = a + dr[k], c = b + dc[k];
                      if (r >= 0 && c >= 0 && r < m && c < n) f |= 1 << (r * n + c);
                  }
                  flips.Add(f);
              }
              var dist = new int[1 << (m * n)];
              for (int i = 0; i < dist.Length; i++) dist[i] = -1;
              var q = new Queue<int>();
              dist[start] = 0;
              q.Enqueue(start);
              while (q.Count > 0)
              {
                  int x = q.Dequeue();
                  if (x == 0) return dist[x];
                  foreach (int f in flips)
                  {
                      int y = x ^ f;
                      if (dist[y] == -1) { dist[y] = dist[x] + 1; q.Enqueue(y); }
                  }
              }
              return -1;
          }
        `,
        go: code`
          func minFlips(mat [][]int) int {
              m, n, start := len(mat), len(mat[0]), 0
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      if mat[i][j] == 1 {
                          start |= 1 << (i*n + j)
                      }
                  }
              }
              dr := []int{0, 1, -1, 0, 0}
              dc := []int{0, 0, 0, 1, -1}
              flips := []int{}
              for a := 0; a < m; a++ {
                  for b := 0; b < n; b++ {
                      f := 0
                      for k := 0; k < 5; k++ {
                          r, c := a+dr[k], b+dc[k]
                          if r >= 0 && c >= 0 && r < m && c < n {
                              f |= 1 << (r*n + c)
                          }
                      }
                      flips = append(flips, f)
                  }
              }
              dist := make([]int, 1<<(m*n))
              for i := range dist {
                  dist[i] = -1
              }
              dist[start] = 0
              q := []int{start}
              for h := 0; h < len(q); h++ {
                  x := q[h]
                  if x == 0 {
                      return dist[x]
                  }
                  for _, f := range flips {
                      y := x ^ f
                      if dist[y] == -1 {
                          dist[y] = dist[x] + 1
                          q = append(q, y)
                      }
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun minFlips(mat: Array<IntArray>): Int {
              val m = mat.size
              val n = mat[0].size
              var start = 0
              for (i in 0 until m) for (j in 0 until n) if (mat[i][j] == 1) start = start or (1 shl (i * n + j))
              val dr = intArrayOf(0, 1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 0, 1, -1)
              val flips = IntArray(m * n)
              for (a in 0 until m) for (b in 0 until n) {
                  var f = 0
                  for (k in 0 until 5) {
                      val r = a + dr[k]
                      val c = b + dc[k]
                      if (r >= 0 && c >= 0 && r < m && c < n) f = f or (1 shl (r * n + c))
                  }
                  flips[a * n + b] = f
              }
              val dist = IntArray(1 shl (m * n)) { -1 }
              val q = IntArray(1 shl (m * n))
              var head = 0
              var tail = 0
              dist[start] = 0
              q[tail++] = start
              while (head < tail) {
                  val x = q[head++]
                  if (x == 0) return dist[x]
                  for (f in flips) {
                      val y = x xor f
                      if (dist[y] == -1) { dist[y] = dist[x] + 1; q[tail++] = y }
                  }
              }
              return -1
          }
        `,
        swift: code`
          func minFlips(_ mat: [[Int]]) -> Int {
              let m = mat.count, n = mat[0].count
              var start = 0
              for i in 0..<m { for j in 0..<n where mat[i][j] == 1 { start |= 1 << (i * n + j) } }
              let dr = [0, 1, -1, 0, 0], dc = [0, 0, 0, 1, -1]
              var flips = [Int]()
              for a in 0..<m {
                  for b in 0..<n {
                      var f = 0
                      for k in 0..<5 {
                          let r = a + dr[k], c = b + dc[k]
                          if r >= 0 && c >= 0 && r < m && c < n { f |= 1 << (r * n + c) }
                      }
                      flips.append(f)
                  }
              }
              var dist = [Int](repeating: -1, count: 1 << (m * n))
              dist[start] = 0
              var q = [start]
              var h = 0
              while h < q.count {
                  let x = q[h]
                  h += 1
                  if x == 0 { return dist[x] }
                  for f in flips {
                      let y = x ^ f
                      if dist[y] == -1 { dist[y] = dist[x] + 1; q.append(y) }
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn minFlips(mat: Vec<Vec<i32>>) -> i32 {
              let (m, n) = (mat.len() as i32, mat[0].len() as i32);
              let mut start = 0usize;
              for i in 0..m {
                  for j in 0..n {
                      if mat[i as usize][j as usize] == 1 {
                          start |= 1 << (i * n + j);
                      }
                  }
              }
              let mut flips: Vec<usize> = Vec::new();
              for a in 0..m {
                  for b in 0..n {
                      let mut f = 0usize;
                      for &(dr, dc) in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)].iter() {
                          let (r, c) = (a + dr, b + dc);
                          if r >= 0 && c >= 0 && r < m && c < n {
                              f |= 1 << (r * n + c);
                          }
                      }
                      flips.push(f);
                  }
              }
              let mut dist = vec![-1i32; 1 << (m * n)];
              dist[start] = 0;
              let mut q = vec![start];
              let mut h = 0;
              while h < q.len() {
                  let x = q[h];
                  h += 1;
                  if x == 0 {
                      return dist[x];
                  }
                  for &f in flips.iter() {
                      let y = x ^ f;
                      if dist[y] == -1 {
                          dist[y] = dist[x] + 1;
                          q.push(y);
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minFlips($mat) {
              $m = count($mat);
              $n = count($mat[0]);
              $start = 0;
              for ($i = 0; $i < $m; $i++) for ($j = 0; $j < $n; $j++) if ($mat[$i][$j]) $start |= 1 << ($i * $n + $j);
              $dr = [0, 1, -1, 0, 0];
              $dc = [0, 0, 0, 1, -1];
              $flips = [];
              for ($a = 0; $a < $m; $a++)
                  for ($b = 0; $b < $n; $b++) {
                      $f = 0;
                      for ($k = 0; $k < 5; $k++) {
                          $r = $a + $dr[$k];
                          $c = $b + $dc[$k];
                          if ($r >= 0 && $c >= 0 && $r < $m && $c < $n) $f |= 1 << ($r * $n + $c);
                      }
                      $flips[] = $f;
                  }
              $dist = array_fill(0, 1 << ($m * $n), -1);
              $dist[$start] = 0;
              $q = [$start];
              for ($h = 0; $h < count($q); $h++) {
                  $x = $q[$h];
                  if ($x == 0) return $dist[$x];
                  foreach ($flips as $f) {
                      $y = $x ^ $f;
                      if ($dist[$y] == -1) { $dist[$y] = $dist[$x] + 1; $q[] = $y; }
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minFlips(mat)
            m = mat.length
            n = mat[0].length
            start = 0
            m.times { |i| n.times { |j| start |= 1 << (i * n + j) if mat[i][j] == 1 } }
            flips = []
            m.times do |a|
              n.times do |b|
                f = 0
                [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].each do |dr, dc|
                  r = a + dr
                  c = b + dc
                  f |= 1 << (r * n + c) if r >= 0 && c >= 0 && r < m && c < n
                end
                flips << f
              end
            end
            dist = Array.new(1 << (m * n), -1)
            dist[start] = 0
            q = [start]
            h = 0
            while h < q.length
              x = q[h]
              h += 1
              return dist[x] if x == 0
              flips.each do |f|
                y = x ^ f
                next if dist[y] != -1
                dist[y] = dist[x] + 1
                q << y
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Maximum Candies You Can Get from Boxes (LC 1298) ────────────
  (() => {
    // Fixed point: keep sweeping all boxes, opening any box that is held and
    // openable, until a sweep changes nothing.
    const ref = (status: number[], candies: number[], keys: number[][], contained: number[][], initial: number[]) => {
      const n = status.length;
      const open = status.slice(), have = new Array(n).fill(false), done = new Array(n).fill(false);
      for (const b of initial) have[b] = true;
      let total = 0;
      for (let changed = true; changed;) {
        changed = false;
        for (let b = 0; b < n; b++) {
          if (done[b] || !have[b] || !open[b]) continue;
          done[b] = true; changed = true; total += candies[b];
          for (const k of keys[b]) open[k] = 1;
          for (const c of contained[b]) have[c] = true;
        }
      }
      return total;
    };
    return {
      slug: "maximum-candies-you-can-get-from-boxes",
      title: "Maximum Candies You Can Get from Boxes",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Graph", "Airbnb", "Amazon"],
      signature: {
        funcName: "maxCandies",
        params: [
          { name: "status", type: "int[]" as const }, { name: "candies", type: "int[]" as const },
          { name: "keys", type: "int[][]" as const }, { name: "containedBoxes", type: "int[][]" as const },
          { name: "initialBoxes", type: "int[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` boxes labelled `0` to `n - 1`. For each box `i`:\n\n- `status[i]` is `1` if the box is open and `0` if it is closed;\n- `candies[i]` is the number of candies inside;\n- `keys[i]` lists the boxes whose keys are inside box `i`;\n- `containedBoxes[i]` lists the boxes found inside box `i`.\n\nYou start holding the boxes in `initialBoxes`. You can take the candies from any box you hold that is open, and use the keys and boxes inside it. A key opens its box whenever you come to hold that box (or immediately, if you already hold it).\n\nReturn the **maximum number of candies** you can collect.",
        [
          { in: "status = [1,0,1,0], candies = [7,5,4,100], keys = [[],[],[1],[]], containedBoxes = [[1,2],[3],[],[]], initialBoxes = [0]", out: "16", note: "Box 0 gives 7 candies and boxes 1 and 2. Box 2 is open: 4 candies and the key to box 1. Box 1 gives 5 candies and box 3, which stays locked. 7 + 4 + 5 = 16." },
          { in: "status = [1,0,0,0,0,0], candies = [1,1,1,1,1,1], keys = [[1,2,3,4,5],[],[],[],[],[]], containedBoxes = [[1,2,3,4,5],[],[],[],[],[]], initialBoxes = [0]", out: "6" },
          { in: "status = [0], candies = [5], keys = [[]], containedBoxes = [[]], initialBoxes = [0]", out: "0", note: "The only box is locked and its key is nowhere." },
        ],
        ["n == status.length == candies.length == keys.length == containedBoxes.length", "1 <= n <= 1000", "status[i] is 0 or 1", "1 <= candies[i] <= 1000", "0 <= keys[i].length <= n", "0 <= keys[i][j] < n, and the values of keys[i] are unique", "0 <= containedBoxes[i].length <= n", "0 <= containedBoxes[i][j] < n, and the values of containedBoxes[i] are unique", "each box is contained in at most one box", "0 <= initialBoxes.length <= n", "0 <= initialBoxes[i] < n"]),
      hints: [
        "A box can be opened exactly when you **hold** it and it is **open or you have its key**. Both facts only ever become true, never false.",
        "Keep a queue of boxes ready to open. Whenever a box is opened, it may make other boxes ready: through a key it contains, or through a box it contains.",
        "Mark a box as queued the moment it becomes ready so it is opened once. Sum the candies of every box you open.",
      ],
      editorial: explain({
        idea: "Opening a box only ever adds keys and boxes, so there is no choice to make — open everything that can ever be opened. A breadth-first search over \"ready\" boxes does this in linear time.",
        steps: [
          "Track `held[i]`, `canOpen[i]` (initially `status[i]`) and `queued[i]`.",
          "Mark every initial box as held; queue those that can be opened.",
          "Pop a box, add its candies. For every key `k` inside: set `canOpen[k]`, and queue `k` if it is held and not yet queued. For every box `c` inside: set `held[c]`, and queue it if it can be opened and is not yet queued.",
          "Return the total when the queue empties.",
        ],
        why: "Holding a box and being able to open it are monotone facts, so opening a box early never prevents anything later. The queue opens a box as soon as both facts hold, and each event that could complete them (finding a key, finding a box) re-checks the affected box. Therefore every box that any strategy could open is opened, exactly once.",
        time: "O(n + total keys + total contained boxes)",
        space: "O(n)",
        pitfalls: [
          "A key found for a box you do not hold yet must be remembered — the box may turn up later.",
          "A box can become ready through a key or through being found; check readiness in both places.",
          "Use a `queued` flag so a box is never counted twice.",
        ],
      }),
      examples: [
        { input: "[1,0,1,0]\n[7,5,4,100]\n[[],[],[1],[]]\n[[1,2],[3],[],[]]\n[0]", expectedOutput: "16" },
        { input: "[1,0,0,0,0,0]\n[1,1,1,1,1,1]\n[[1,2,3,4,5],[],[],[],[],[]]\n[[1,2,3,4,5],[],[],[],[],[]]\n[0]", expectedOutput: "6" },
        { input: "[0]\n[5]\n[[]]\n[[]]\n[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [3, 6, 10, 14]));
        const ps = pick(rng, [0.4, 0.7, 0.9]);
        const status = Array.from({ length: n }, () => (rng() < ps ? 1 : 0));
        const candies = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [10, 1000])));
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const contained: number[][] = Array.from({ length: n }, () => []);
        const initial: number[] = [];
        order.forEach((b, i) => {
          if (i > 0 && rng() < 0.6) contained[order[ri(rng, 0, i - 1)]].push(b);
          else if (rng() < 0.9) initial.push(b);
        });
        const keys = Array.from({ length: n }, () => shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, ri(rng, 0, Math.min(n, 4))));
        contained.forEach((c) => shuffle(rng, c));
        shuffle(rng, initial);
        return {
          input: `${fmtIntArr(status)}\n${fmtIntArr(candies)}\n${fmtIntMat(keys)}\n${fmtIntMat(contained)}\n${fmtIntArr(initial)}`,
          expectedOutput: String(ref(status, candies, keys, contained, initial)),
        };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def maxCandies(status: List[int], candies: List[int], keys: List[List[int]],
                         containedBoxes: List[List[int]], initialBoxes: List[int]) -> int:
              n = len(status)
              can_open = status[:]
              held = [False] * n
              queued = [False] * n
              q = deque()
              for b in initialBoxes:
                  held[b] = True
                  if can_open[b] and not queued[b]:
                      queued[b] = True
                      q.append(b)
              total = 0
              while q:
                  b = q.popleft()
                  total += candies[b]
                  for k in keys[b]:
                      can_open[k] = 1
                      if held[k] and not queued[k]:
                          queued[k] = True
                          q.append(k)
                  for c in containedBoxes[b]:
                      held[c] = True
                      if can_open[c] and not queued[c]:
                          queued[c] = True
                          q.append(c)
              return total
        `,
        javascript: code`
          var maxCandies = function(status, candies, keys, containedBoxes, initialBoxes) {
              var n = status.length, canOpen = status.slice(), held = [], queued = [], q = [], total = 0;
              for (var i = 0; i < n; i++) { held.push(false); queued.push(false); }
              for (var a = 0; a < initialBoxes.length; a++) {
                  var b0 = initialBoxes[a];
                  held[b0] = true;
                  if (canOpen[b0] && !queued[b0]) { queued[b0] = true; q.push(b0); }
              }
              for (var h = 0; h < q.length; h++) {
                  var b = q[h];
                  total += candies[b];
                  for (var x = 0; x < keys[b].length; x++) {
                      var k = keys[b][x];
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = true; q.push(k); }
                  }
                  for (var y = 0; y < containedBoxes[b].length; y++) {
                      var c = containedBoxes[b][y];
                      held[c] = true;
                      if (canOpen[c] && !queued[c]) { queued[c] = true; q.push(c); }
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function maxCandies(status: number[], candies: number[], keys: number[][], containedBoxes: number[][], initialBoxes: number[]): number {
              var n = status.length, canOpen = status.slice(), held: boolean[] = [], queued: boolean[] = [], q: number[] = [], total = 0;
              for (var i = 0; i < n; i++) { held.push(false); queued.push(false); }
              for (var a = 0; a < initialBoxes.length; a++) {
                  var b0 = initialBoxes[a];
                  held[b0] = true;
                  if (canOpen[b0] && !queued[b0]) { queued[b0] = true; q.push(b0); }
              }
              for (var h = 0; h < q.length; h++) {
                  var b = q[h];
                  total += candies[b];
                  for (var x = 0; x < keys[b].length; x++) {
                      var k = keys[b][x];
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = true; q.push(k); }
                  }
                  for (var y = 0; y < containedBoxes[b].length; y++) {
                      var c = containedBoxes[b][y];
                      held[c] = true;
                      if (canOpen[c] && !queued[c]) { queued[c] = true; q.push(c); }
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int maxCandies(int[] status, int[] candies, int[][] keys, int[][] containedBoxes, int[] initialBoxes) {
              int n = status.length, total = 0, head = 0, tail = 0;
              int[] canOpen = status.clone(), q = new int[n];
              boolean[] held = new boolean[n], queued = new boolean[n];
              for (int b : initialBoxes) {
                  held[b] = true;
                  if (canOpen[b] == 1 && !queued[b]) { queued[b] = true; q[tail++] = b; }
              }
              while (head < tail) {
                  int b = q[head++];
                  total += candies[b];
                  for (int k : keys[b]) {
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = true; q[tail++] = k; }
                  }
                  for (int c : containedBoxes[b]) {
                      held[c] = true;
                      if (canOpen[c] == 1 && !queued[c]) { queued[c] = true; q[tail++] = c; }
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int maxCandies(vector<int>& status, vector<int>& candies, vector<vector<int>>& keys, vector<vector<int>>& containedBoxes, vector<int>& initialBoxes) {
              int n = status.size(), total = 0;
              vector<int> canOpen = status;
              vector<bool> held(n, false), queued(n, false);
              queue<int> q;
              for (int b : initialBoxes) {
                  held[b] = true;
                  if (canOpen[b] && !queued[b]) { queued[b] = true; q.push(b); }
              }
              while (!q.empty()) {
                  int b = q.front(); q.pop();
                  total += candies[b];
                  for (int k : keys[b]) {
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = true; q.push(k); }
                  }
                  for (int c : containedBoxes[b]) {
                      held[c] = true;
                      if (canOpen[c] && !queued[c]) { queued[c] = true; q.push(c); }
                  }
              }
              return total;
          }
        `,
        c: code`
          int maxCandies(int* status, int statusSize, int* candies, int candiesSize, int** keys, int keysSize, int* keysColSize,
                         int** containedBoxes, int containedBoxesSize, int* containedBoxesColSize, int* initialBoxes, int initialBoxesSize) {
              int n = statusSize, total = 0, head = 0, tail = 0;
              int* canOpen = (int*)malloc(n * sizeof(int));
              int* held = (int*)calloc(n, sizeof(int));
              int* queued = (int*)calloc(n, sizeof(int));
              int* q = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) canOpen[i] = status[i];
              for (int i = 0; i < initialBoxesSize; i++) {
                  int b = initialBoxes[i];
                  held[b] = 1;
                  if (canOpen[b] && !queued[b]) { queued[b] = 1; q[tail++] = b; }
              }
              while (head < tail) {
                  int b = q[head++];
                  total += candies[b];
                  for (int j = 0; j < keysColSize[b]; j++) {
                      int k = keys[b][j];
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = 1; q[tail++] = k; }
                  }
                  for (int j = 0; j < containedBoxesColSize[b]; j++) {
                      int c = containedBoxes[b][j];
                      held[c] = 1;
                      if (canOpen[c] && !queued[c]) { queued[c] = 1; q[tail++] = c; }
                  }
              }
              free(canOpen); free(held); free(queued); free(q);
              return total;
          }
        `,
        csharp: code`
          public static int MaxCandies(int[] status, int[] candies, int[][] keys, int[][] containedBoxes, int[] initialBoxes)
          {
              int n = status.Length, total = 0;
              var canOpen = (int[])status.Clone();
              var held = new bool[n];
              var queued = new bool[n];
              var q = new Queue<int>();
              foreach (int b in initialBoxes)
              {
                  held[b] = true;
                  if (canOpen[b] == 1 && !queued[b]) { queued[b] = true; q.Enqueue(b); }
              }
              while (q.Count > 0)
              {
                  int b = q.Dequeue();
                  total += candies[b];
                  foreach (int k in keys[b])
                  {
                      canOpen[k] = 1;
                      if (held[k] && !queued[k]) { queued[k] = true; q.Enqueue(k); }
                  }
                  foreach (int c in containedBoxes[b])
                  {
                      held[c] = true;
                      if (canOpen[c] == 1 && !queued[c]) { queued[c] = true; q.Enqueue(c); }
                  }
              }
              return total;
          }
        `,
        go: code`
          func maxCandies(status []int, candies []int, keys [][]int, containedBoxes [][]int, initialBoxes []int) int {
              n := len(status)
              canOpen := append([]int{}, status...)
              held := make([]bool, n)
              queued := make([]bool, n)
              q := []int{}
              for _, b := range initialBoxes {
                  held[b] = true
                  if canOpen[b] == 1 && !queued[b] {
                      queued[b] = true
                      q = append(q, b)
                  }
              }
              total := 0
              for h := 0; h < len(q); h++ {
                  b := q[h]
                  total += candies[b]
                  for _, k := range keys[b] {
                      canOpen[k] = 1
                      if held[k] && !queued[k] {
                          queued[k] = true
                          q = append(q, k)
                      }
                  }
                  for _, c := range containedBoxes[b] {
                      held[c] = true
                      if canOpen[c] == 1 && !queued[c] {
                          queued[c] = true
                          q = append(q, c)
                      }
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun maxCandies(status: IntArray, candies: IntArray, keys: Array<IntArray>, containedBoxes: Array<IntArray>, initialBoxes: IntArray): Int {
              val n = status.size
              val canOpen = status.clone()
              val held = BooleanArray(n)
              val queued = BooleanArray(n)
              val q = IntArray(n)
              var head = 0
              var tail = 0
              for (b in initialBoxes) {
                  held[b] = true
                  if (canOpen[b] == 1 && !queued[b]) { queued[b] = true; q[tail++] = b }
              }
              var total = 0
              while (head < tail) {
                  val b = q[head++]
                  total += candies[b]
                  for (k in keys[b]) {
                      canOpen[k] = 1
                      if (held[k] && !queued[k]) { queued[k] = true; q[tail++] = k }
                  }
                  for (c in containedBoxes[b]) {
                      held[c] = true
                      if (canOpen[c] == 1 && !queued[c]) { queued[c] = true; q[tail++] = c }
                  }
              }
              return total
          }
        `,
        swift: code`
          func maxCandies(_ status: [Int], _ candies: [Int], _ keys: [[Int]], _ containedBoxes: [[Int]], _ initialBoxes: [Int]) -> Int {
              let n = status.count
              var canOpen = status
              var held = [Bool](repeating: false, count: n)
              var queued = [Bool](repeating: false, count: n)
              var q = [Int]()
              for b in initialBoxes {
                  held[b] = true
                  if canOpen[b] == 1 && !queued[b] { queued[b] = true; q.append(b) }
              }
              var total = 0, h = 0
              while h < q.count {
                  let b = q[h]
                  h += 1
                  total += candies[b]
                  for k in keys[b] {
                      canOpen[k] = 1
                      if held[k] && !queued[k] { queued[k] = true; q.append(k) }
                  }
                  for c in containedBoxes[b] {
                      held[c] = true
                      if canOpen[c] == 1 && !queued[c] { queued[c] = true; q.append(c) }
                  }
              }
              return total
          }
        `,
        rust: code`
          fn maxCandies(status: Vec<i32>, candies: Vec<i32>, keys: Vec<Vec<i32>>, contained_boxes: Vec<Vec<i32>>, initial_boxes: Vec<i32>) -> i32 {
              let n = status.len();
              let mut can_open = status.clone();
              let mut held = vec![false; n];
              let mut queued = vec![false; n];
              let mut q: Vec<usize> = Vec::new();
              for &b in initial_boxes.iter() {
                  let b = b as usize;
                  held[b] = true;
                  if can_open[b] == 1 && !queued[b] {
                      queued[b] = true;
                      q.push(b);
                  }
              }
              let mut total = 0;
              let mut h = 0;
              while h < q.len() {
                  let b = q[h];
                  h += 1;
                  total += candies[b];
                  for &k in keys[b].iter() {
                      let k = k as usize;
                      can_open[k] = 1;
                      if held[k] && !queued[k] {
                          queued[k] = true;
                          q.push(k);
                      }
                  }
                  for &c in contained_boxes[b].iter() {
                      let c = c as usize;
                      held[c] = true;
                      if can_open[c] == 1 && !queued[c] {
                          queued[c] = true;
                          q.push(c);
                      }
                  }
              }
              total
          }
        `,
        php: code`
          function maxCandies($status, $candies, $keys, $containedBoxes, $initialBoxes) {
              $n = count($status);
              $canOpen = $status;
              $held = array_fill(0, $n, false);
              $queued = array_fill(0, $n, false);
              $q = [];
              foreach ($initialBoxes as $b) {
                  $held[$b] = true;
                  if ($canOpen[$b] == 1 && !$queued[$b]) { $queued[$b] = true; $q[] = $b; }
              }
              $total = 0;
              for ($h = 0; $h < count($q); $h++) {
                  $b = $q[$h];
                  $total += $candies[$b];
                  foreach ($keys[$b] as $k) {
                      $canOpen[$k] = 1;
                      if ($held[$k] && !$queued[$k]) { $queued[$k] = true; $q[] = $k; }
                  }
                  foreach ($containedBoxes[$b] as $c) {
                      $held[$c] = true;
                      if ($canOpen[$c] == 1 && !$queued[$c]) { $queued[$c] = true; $q[] = $c; }
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def maxCandies(status, candies, keys, containedBoxes, initialBoxes)
            n = status.length
            can_open = status.dup
            held = Array.new(n, false)
            queued = Array.new(n, false)
            q = []
            initialBoxes.each do |b|
              held[b] = true
              if can_open[b] == 1 && !queued[b]
                queued[b] = true
                q << b
              end
            end
            total = 0
            h = 0
            while h < q.length
              b = q[h]
              h += 1
              total += candies[b]
              keys[b].each do |k|
                can_open[k] = 1
                if held[k] && !queued[k]
                  queued[k] = true
                  q << k
                end
              end
              containedBoxes[b].each do |c|
                held[c] = true
                if can_open[c] == 1 && !queued[c]
                  queued[c] = true
                  q << c
                end
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Validate Binary Tree Nodes (LC 1361) ────────────────────────
  (() => {
    // Union-find characterisation: n - 1 child links, no node with two
    // parents, and the links (as undirected edges) form no cycle.
    const ref = (n: number, left: number[], right: number[]) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      const indeg = new Array(n).fill(0);
      let links = 0;
      for (let i = 0; i < n; i++) for (const c of [left[i], right[i]]) {
        if (c === -1) continue;
        links++;
        if (++indeg[c] > 1) return false;
        const a = find(i), b = find(c);
        if (a === b) return false;
        parent[a] = b;
      }
      return links === n - 1;
    };
    return {
      slug: "validate-binary-tree-nodes",
      title: "Validate Binary Tree Nodes",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Meta"],
      signature: {
        funcName: "validateBinaryTreeNodes",
        params: [{ name: "n", type: "int" as const }, { name: "leftChild", type: "int[]" as const }, { name: "rightChild", type: "int[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You have `n` binary tree nodes numbered `0` to `n - 1`. Node `i` has left child `leftChild[i]` and right child `rightChild[i]`, where `-1` means the child is missing.\n\nReturn `true` if **all** the given nodes form **exactly one** valid binary tree, and `false` otherwise.\n\nThe nodes carry no values — only the links matter.",
        [
          { in: "n = 4, leftChild = [1,-1,3,-1], rightChild = [2,-1,-1,-1]", out: "true", note: "0 is the root with children 1 and 2; node 3 hangs under 2." },
          { in: "n = 4, leftChild = [1,-1,3,-1], rightChild = [2,3,-1,-1]", out: "false", note: "Node 3 has two parents, 1 and 2." },
          { in: "n = 2, leftChild = [1,0], rightChild = [-1,-1]", out: "false", note: "0 and 1 point at each other: a cycle with no root." },
        ],
        ["n == leftChild.length == rightChild.length", "1 <= n <= 10^4", "-1 <= leftChild[i], rightChild[i] <= n - 1"]),
      hints: [
        "In a valid tree exactly one node — the root — has no parent, and every other node has exactly one.",
        "Count each node's parents. Any node with two parents fails immediately; zero or several parentless nodes fail too.",
        "Parent counts alone miss a separate cycle (e.g. `1 → 2 → 1` beside a valid tree). From the unique root, traverse the children and check that all `n` nodes are reached.",
      ],
      editorial: explain({
        idea: "A valid binary tree is a rooted tree: one node with in-degree 0, every other node with in-degree 1, and everything reachable from the root. Check the degrees, then confirm reachability with one traversal.",
        steps: [
          "Compute the in-degree of every node from both child arrays. If any in-degree exceeds 1, return `false`.",
          "Find the nodes with in-degree 0. If there is not exactly one, return `false`; call it the root.",
          "BFS or DFS from the root along the child links, counting visited nodes.",
          "Return `true` exactly when all `n` nodes were visited.",
        ],
        why: "If every node has at most one parent and the root has none, the links form a forest of in-trees plus possibly cycles; a cycle's nodes all have a parent inside the cycle, so they are unreachable from the root. Reaching all `n` nodes from the single root therefore rules out cycles and extra components, leaving exactly one tree.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A node can be its own child (`leftChild[i] == i`) — in-degree and reachability still catch it.",
          "Both children of a node may point to the same node; that node then has in-degree 2.",
          "`n = 1` with no links is a valid one-node tree.",
        ],
      }),
      examples: [
        { input: "4\n[1,-1,3,-1]\n[2,-1,-1,-1]", expectedOutput: "true" },
        { input: "4\n[1,-1,3,-1]\n[2,3,-1,-1]", expectedOutput: "false" },
        { input: "2\n[1,0]\n[-1,-1]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 9, 14]));
        const left = new Array(n).fill(-1), right = new Array(n).fill(-1);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        for (let i = 1; i < n; i++) {
          const slots: number[][] = [];
          for (let j = 0; j < i; j++) {
            const p = order[j];
            if (left[p] === -1) slots.push([p, 0]);
            if (right[p] === -1) slots.push([p, 1]);
          }
          const [p, side] = pick(rng, slots);
          if (side === 0) left[p] = order[i]; else right[p] = order[i];
        }
        if (rng() < 0.55) {
          const kind = ri(rng, 0, 3);
          const node = ri(rng, 0, n - 1), target = ri(rng, 0, n - 1);
          const arr = rng() < 0.5 ? left : right;
          if (kind === 0) { if (arr[node] === -1) arr[node] = target; }
          else if (kind === 1) { const linked = [...Array(n).keys()].filter((x) => arr[x] !== -1); if (linked.length) arr[pick(rng, linked)] = -1; }
          else if (kind === 2) { const linked = [...Array(n).keys()].filter((x) => arr[x] !== -1); if (linked.length) arr[pick(rng, linked)] = target; }
          else { const leaf = order[n - 1]; if (left[leaf] === -1) left[leaf] = order[0]; }
        }
        return { input: `${n}\n${fmtIntArr(left)}\n${fmtIntArr(right)}`, expectedOutput: bool(ref(n, left, right)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validateBinaryTreeNodes(n: int, leftChild: List[int], rightChild: List[int]) -> bool:
              indeg = [0] * n
              for c in leftChild + rightChild:
                  if c != -1:
                      indeg[c] += 1
                      if indeg[c] > 1:
                          return False
              roots = [i for i in range(n) if indeg[i] == 0]
              if len(roots) != 1:
                  return False
              seen = [False] * n
              seen[roots[0]] = True
              stack = [roots[0]]
              count = 1
              while stack:
                  x = stack.pop()
                  for c in (leftChild[x], rightChild[x]):
                      if c != -1 and not seen[c]:
                          seen[c] = True
                          count += 1
                          stack.append(c)
              return count == n
        `,
        javascript: code`
          var validateBinaryTreeNodes = function(n, leftChild, rightChild) {
              var indeg = new Array(n).fill(0);
              for (var i = 0; i < n; i++) {
                  var kids = [leftChild[i], rightChild[i]];
                  for (var k = 0; k < 2; k++) {
                      if (kids[k] === -1) continue;
                      if (++indeg[kids[k]] > 1) return false;
                  }
              }
              var root = -1;
              for (var j = 0; j < n; j++) {
                  if (indeg[j] !== 0) continue;
                  if (root !== -1) return false;
                  root = j;
              }
              if (root === -1) return false;
              var seen = new Array(n).fill(false), stack = [root], count = 1;
              seen[root] = true;
              while (stack.length) {
                  var x = stack.pop(), ch = [leftChild[x], rightChild[x]];
                  for (var t = 0; t < 2; t++) {
                      var c = ch[t];
                      if (c !== -1 && !seen[c]) { seen[c] = true; count++; stack.push(c); }
                  }
              }
              return count === n;
          };
        `,
        typescript: code`
          function validateBinaryTreeNodes(n: number, leftChild: number[], rightChild: number[]): boolean {
              var indeg: number[] = [];
              for (var z = 0; z < n; z++) indeg.push(0);
              for (var i = 0; i < n; i++) {
                  var kids = [leftChild[i], rightChild[i]];
                  for (var k = 0; k < 2; k++) {
                      if (kids[k] === -1) continue;
                      if (++indeg[kids[k]] > 1) return false;
                  }
              }
              var root = -1;
              for (var j = 0; j < n; j++) {
                  if (indeg[j] !== 0) continue;
                  if (root !== -1) return false;
                  root = j;
              }
              if (root === -1) return false;
              var seen: boolean[] = [];
              for (var y = 0; y < n; y++) seen.push(false);
              var stack: number[] = [root], count = 1;
              seen[root] = true;
              while (stack.length) {
                  var x = stack.pop() as number, ch = [leftChild[x], rightChild[x]];
                  for (var t = 0; t < 2; t++) {
                      var c = ch[t];
                      if (c !== -1 && !seen[c]) { seen[c] = true; count++; stack.push(c); }
                  }
              }
              return count === n;
          }
        `,
        java: code`
          public static boolean validateBinaryTreeNodes(int n, int[] leftChild, int[] rightChild) {
              int[] indeg = new int[n];
              for (int i = 0; i < n; i++) {
                  if (leftChild[i] != -1 && ++indeg[leftChild[i]] > 1) return false;
                  if (rightChild[i] != -1 && ++indeg[rightChild[i]] > 1) return false;
              }
              int root = -1;
              for (int i = 0; i < n; i++) {
                  if (indeg[i] != 0) continue;
                  if (root != -1) return false;
                  root = i;
              }
              if (root == -1) return false;
              boolean[] seen = new boolean[n];
              int[] stack = new int[n];
              int top = 0, count = 1;
              seen[root] = true;
              stack[top++] = root;
              while (top > 0) {
                  int x = stack[--top];
                  for (int c : new int[]{leftChild[x], rightChild[x]}) {
                      if (c != -1 && !seen[c]) { seen[c] = true; count++; stack[top++] = c; }
                  }
              }
              return count == n;
          }
        `,
        cpp: code`
          bool validateBinaryTreeNodes(int n, vector<int>& leftChild, vector<int>& rightChild) {
              vector<int> indeg(n, 0);
              for (int i = 0; i < n; i++) {
                  if (leftChild[i] != -1 && ++indeg[leftChild[i]] > 1) return false;
                  if (rightChild[i] != -1 && ++indeg[rightChild[i]] > 1) return false;
              }
              int root = -1;
              for (int i = 0; i < n; i++) {
                  if (indeg[i] != 0) continue;
                  if (root != -1) return false;
                  root = i;
              }
              if (root == -1) return false;
              vector<bool> seen(n, false);
              vector<int> st{root};
              seen[root] = true;
              int count = 1;
              while (!st.empty()) {
                  int x = st.back(); st.pop_back();
                  for (int c : {leftChild[x], rightChild[x]}) {
                      if (c != -1 && !seen[c]) { seen[c] = true; count++; st.push_back(c); }
                  }
              }
              return count == n;
          }
        `,
        c: code`
          bool validateBinaryTreeNodes(int n, int* leftChild, int leftChildSize, int* rightChild, int rightChildSize) {
              int* indeg = (int*)calloc(n, sizeof(int));
              int* seen = (int*)calloc(n, sizeof(int));
              int* stack = (int*)malloc(n * sizeof(int));
              bool ok = true;
              int root = -1, count = 0, top = 0;
              for (int i = 0; i < n && ok; i++) {
                  if (leftChild[i] != -1 && ++indeg[leftChild[i]] > 1) ok = false;
                  if (rightChild[i] != -1 && ++indeg[rightChild[i]] > 1) ok = false;
              }
              for (int i = 0; i < n && ok; i++) {
                  if (indeg[i] != 0) continue;
                  if (root != -1) ok = false;
                  root = i;
              }
              if (ok && root == -1) ok = false;
              if (ok) {
                  seen[root] = 1;
                  stack[top++] = root;
                  count = 1;
                  while (top > 0) {
                      int x = stack[--top];
                      int kids[2] = {leftChild[x], rightChild[x]};
                      for (int k = 0; k < 2; k++) {
                          int c = kids[k];
                          if (c != -1 && !seen[c]) { seen[c] = 1; count++; stack[top++] = c; }
                      }
                  }
                  ok = count == n;
              }
              free(indeg); free(seen); free(stack);
              return ok;
          }
        `,
        csharp: code`
          public static bool ValidateBinaryTreeNodes(int n, int[] leftChild, int[] rightChild)
          {
              var indeg = new int[n];
              for (int i = 0; i < n; i++)
              {
                  if (leftChild[i] != -1 && ++indeg[leftChild[i]] > 1) return false;
                  if (rightChild[i] != -1 && ++indeg[rightChild[i]] > 1) return false;
              }
              int root = -1;
              for (int i = 0; i < n; i++)
              {
                  if (indeg[i] != 0) continue;
                  if (root != -1) return false;
                  root = i;
              }
              if (root == -1) return false;
              var seen = new bool[n];
              var stack = new Stack<int>();
              seen[root] = true;
              stack.Push(root);
              int count = 1;
              while (stack.Count > 0)
              {
                  int x = stack.Pop();
                  foreach (int c in new[] { leftChild[x], rightChild[x] })
                  {
                      if (c != -1 && !seen[c]) { seen[c] = true; count++; stack.Push(c); }
                  }
              }
              return count == n;
          }
        `,
        go: code`
          func validateBinaryTreeNodes(n int, leftChild []int, rightChild []int) bool {
              indeg := make([]int, n)
              for i := 0; i < n; i++ {
                  for _, c := range []int{leftChild[i], rightChild[i]} {
                      if c == -1 {
                          continue
                      }
                      indeg[c]++
                      if indeg[c] > 1 {
                          return false
                      }
                  }
              }
              root := -1
              for i := 0; i < n; i++ {
                  if indeg[i] != 0 {
                      continue
                  }
                  if root != -1 {
                      return false
                  }
                  root = i
              }
              if root == -1 {
                  return false
              }
              seen := make([]bool, n)
              seen[root] = true
              stack := []int{root}
              count := 1
              for len(stack) > 0 {
                  x := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  for _, c := range []int{leftChild[x], rightChild[x]} {
                      if c != -1 && !seen[c] {
                          seen[c] = true
                          count++
                          stack = append(stack, c)
                      }
                  }
              }
              return count == n
          }
        `,
        kotlin: code`
          fun validateBinaryTreeNodes(n: Int, leftChild: IntArray, rightChild: IntArray): Boolean {
              val indeg = IntArray(n)
              for (i in 0 until n) {
                  for (c in intArrayOf(leftChild[i], rightChild[i])) {
                      if (c == -1) continue
                      indeg[c]++
                      if (indeg[c] > 1) return false
                  }
              }
              var root = -1
              for (i in 0 until n) {
                  if (indeg[i] != 0) continue
                  if (root != -1) return false
                  root = i
              }
              if (root == -1) return false
              val seen = BooleanArray(n)
              val stack = ArrayList<Int>()
              seen[root] = true
              stack.add(root)
              var count = 1
              while (stack.isNotEmpty()) {
                  val x = stack.removeAt(stack.size - 1)
                  for (c in intArrayOf(leftChild[x], rightChild[x])) {
                      if (c != -1 && !seen[c]) { seen[c] = true; count++; stack.add(c) }
                  }
              }
              return count == n
          }
        `,
        swift: code`
          func validateBinaryTreeNodes(_ n: Int, _ leftChild: [Int], _ rightChild: [Int]) -> Bool {
              var indeg = [Int](repeating: 0, count: n)
              for i in 0..<n {
                  for c in [leftChild[i], rightChild[i]] where c != -1 {
                      indeg[c] += 1
                      if indeg[c] > 1 { return false }
                  }
              }
              var root = -1
              for i in 0..<n where indeg[i] == 0 {
                  if root != -1 { return false }
                  root = i
              }
              if root == -1 { return false }
              var seen = [Bool](repeating: false, count: n)
              seen[root] = true
              var stack = [root]
              var count = 1
              while let x = stack.popLast() {
                  for c in [leftChild[x], rightChild[x]] where c != -1 && !seen[c] {
                      seen[c] = true
                      count += 1
                      stack.append(c)
                  }
              }
              return count == n
          }
        `,
        rust: code`
          fn validateBinaryTreeNodes(n: i32, left_child: Vec<i32>, right_child: Vec<i32>) -> bool {
              let n = n as usize;
              let mut indeg = vec![0; n];
              for i in 0..n {
                  for &c in [left_child[i], right_child[i]].iter() {
                      if c == -1 {
                          continue;
                      }
                      indeg[c as usize] += 1;
                      if indeg[c as usize] > 1 {
                          return false;
                      }
                  }
              }
              let mut root = std::usize::MAX;
              for i in 0..n {
                  if indeg[i] != 0 {
                      continue;
                  }
                  if root != std::usize::MAX {
                      return false;
                  }
                  root = i;
              }
              if root == std::usize::MAX {
                  return false;
              }
              let mut seen = vec![false; n];
              seen[root] = true;
              let mut stack = vec![root];
              let mut count = 1;
              while let Some(x) = stack.pop() {
                  for &c in [left_child[x], right_child[x]].iter() {
                      if c != -1 && !seen[c as usize] {
                          seen[c as usize] = true;
                          count += 1;
                          stack.push(c as usize);
                      }
                  }
              }
              count == n
          }
        `,
        php: code`
          function validateBinaryTreeNodes($n, $leftChild, $rightChild) {
              $indeg = array_fill(0, $n, 0);
              for ($i = 0; $i < $n; $i++) {
                  foreach ([$leftChild[$i], $rightChild[$i]] as $c) {
                      if ($c == -1) continue;
                      if (++$indeg[$c] > 1) return false;
                  }
              }
              $root = -1;
              for ($i = 0; $i < $n; $i++) {
                  if ($indeg[$i] != 0) continue;
                  if ($root != -1) return false;
                  $root = $i;
              }
              if ($root == -1) return false;
              $seen = array_fill(0, $n, false);
              $seen[$root] = true;
              $stack = [$root];
              $count = 1;
              while ($stack) {
                  $x = array_pop($stack);
                  foreach ([$leftChild[$x], $rightChild[$x]] as $c) {
                      if ($c != -1 && !$seen[$c]) { $seen[$c] = true; $count++; $stack[] = $c; }
                  }
              }
              return $count == $n;
          }
        `,
        ruby: code`
          def validateBinaryTreeNodes(n, leftChild, rightChild)
            indeg = Array.new(n, 0)
            n.times do |i|
              [leftChild[i], rightChild[i]].each do |c|
                next if c == -1
                indeg[c] += 1
                return false if indeg[c] > 1
              end
            end
            roots = (0...n).select { |i| indeg[i] == 0 }
            return false if roots.length != 1
            seen = Array.new(n, false)
            seen[roots[0]] = true
            stack = [roots[0]]
            count = 1
            until stack.empty?
              x = stack.pop
              [leftChild[x], rightChild[x]].each do |c|
                next if c == -1 || seen[c]
                seen[c] = true
                count += 1
                stack << c
              end
            end
            count == n
          end
        `,
      },
    };
  })(),

  // ── Strange Printer II (LC 1591) ────────────────────────────────
  (() => {
    // Peel the printing backwards: repeatedly find a colour whose bounding
    // rectangle holds only that colour or already-peeled cells, and erase it.
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const g = grid.map((r) => r.slice());
      const colors = [...new Set(grid.flat())];
      const box = new Map<number, number[]>();
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        const v = grid[r][c];
        const b = box.get(v) || [m, -1, n, -1];
        box.set(v, [Math.min(b[0], r), Math.max(b[1], r), Math.min(b[2], c), Math.max(b[3], c)]);
      }
      const left = new Set(colors);
      for (let progress = true; progress && left.size;) {
        progress = false;
        for (const col of [...left]) {
          const [r0, r1, c0, c1] = box.get(col)!;
          let ok = true;
          for (let r = r0; r <= r1 && ok; r++) for (let c = c0; c <= c1; c++) if (g[r][c] !== col && g[r][c] !== 0) { ok = false; break; }
          if (!ok) continue;
          for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = 0;
          left.delete(col);
          progress = true;
        }
      }
      return left.size === 0;
    };
    return {
      slug: "strange-printer-ii",
      title: "Strange Printer II",
      difficulty: "HARD" as const,
      tags: ["Array", "Graph", "Topological Sort", "Matrix", "Google", "Amazon"],
      signature: { funcName: "isPrintable", params: [{ name: "targetGrid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "A strange printer works under two rules:\n\n- In one turn it prints a **solid rectangle** of a single colour, covering whatever colours were there before.\n- Once a colour has been used, it can **never** be used again.\n\nGiven an `m x n` matrix `targetGrid`, where `targetGrid[row][col]` is the colour at that cell, return `true` if the printer can produce `targetGrid` starting from a blank page, and `false` otherwise.",
        [
          { in: "targetGrid = [[1,1,1,1],[1,2,2,1],[1,2,2,1],[1,1,1,1]]", out: "true", note: "Print the whole page in colour 1, then the 2 x 2 square in colour 2." },
          { in: "targetGrid = [[1,1,1,1],[1,1,3,3],[1,1,3,4],[5,5,1,4]]", out: "true" },
          { in: "targetGrid = [[1,2,1],[2,1,2],[1,2,1]]", out: "false", note: "Colour 1's rectangle covers colour 2's cells and colour 2's covers colour 1's, so neither can be printed last." },
        ],
        ["m == targetGrid.length", "n == targetGrid[i].length", "1 <= m, n <= 60", "1 <= targetGrid[row][col] <= 60"]),
      hints: [
        "Since every colour is printed once as a rectangle, that rectangle must at least cover the colour's **bounding box** — the smallest rectangle containing all its cells.",
        "If a cell inside colour `a`'s bounding box shows colour `b`, then `b` must be printed **after** `a`. That gives a directed edge `a → b`.",
        "The grid is printable exactly when these \"must come before\" edges contain no cycle — check with a topological sort (Kahn's algorithm).",
      ],
      editorial: explain({
        idea: "Each colour's print must cover its bounding box, and anything visible inside that box but of another colour was printed later. Those ordering constraints form a directed graph on at most 60 colours; a valid printing order exists iff the graph is acyclic.",
        steps: [
          "For each colour present, compute its bounding box (min/max row and column).",
          "For each colour `a` and each cell in its box with colour `b != a`, add the edge `a → b` (once) and increase `b`'s in-degree.",
          "Run Kahn's algorithm: repeatedly remove a colour with in-degree 0 and decrement its successors.",
          "Return `true` if every colour present was removed.",
        ],
        why: "Necessity: printing `a` covers its whole box, so any other colour visible in the box must come later — the edges are forced, and a cycle makes printing impossible. Sufficiency: print colours in a topological order, each as exactly its bounding box. A cell showing colour `b` is covered last by `b`, because every other colour whose box contains the cell has an edge to `b` and is printed earlier.",
        time: "O(C · m · n + C^2) for C ≤ 60 colours",
        space: "O(C^2)",
        pitfalls: [
          "Add each edge only once, or in-degrees are inflated and Kahn's algorithm reports a false cycle.",
          "Only colours that actually appear take part — do not count absent colour numbers.",
          "Use the bounding box, not the cells themselves: a colour split into two separated regions still prints as one rectangle covering both.",
        ],
      }),
      examples: [
        { input: "[[1,1,1,1],[1,2,2,1],[1,2,2,1],[1,1,1,1]]", expectedOutput: "true" },
        { input: "[[1,1,1,1],[1,1,3,3],[1,1,3,4],[5,5,1,4]]", expectedOutput: "true" },
        { input: "[[1,2,1],[2,1,2],[1,2,1]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 6, 7]));
        const n = ri(rng, 1, pick(rng, [2, 4, 6, 7]));
        const palette = shuffle(rng, Array.from({ length: 60 }, (_, i) => i + 1));
        const grid = Array.from({ length: m }, () => new Array(n).fill(palette[0]));
        const prints = ri(rng, 0, pick(rng, [2, 5, 9]));
        for (let k = 1; k <= prints; k++) {
          const r0 = ri(rng, 0, m - 1), r1 = ri(rng, r0, m - 1), c0 = ri(rng, 0, n - 1), c1 = ri(rng, c0, n - 1);
          for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r][c] = palette[k];
        }
        const tweaks = rng() < 0.5 ? ri(rng, 1, 3) : 0;
        for (let t = 0; t < tweaks; t++) grid[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] = palette[ri(rng, 0, prints)];
        if (rng() < 0.15) for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) grid[r][c] = palette[ri(rng, 0, 2)];
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: code`
          from collections import deque
          from typing import List

          def isPrintable(targetGrid: List[List[int]]) -> bool:
              m, n = len(targetGrid), len(targetGrid[0])
              top, bottom, left, right = [m] * 61, [-1] * 61, [n] * 61, [-1] * 61
              for r in range(m):
                  for c in range(n):
                      v = targetGrid[r][c]
                      top[v] = min(top[v], r)
                      bottom[v] = max(bottom[v], r)
                      left[v] = min(left[v], c)
                      right[v] = max(right[v], c)
              present = [v for v in range(1, 61) if bottom[v] != -1]
              edge = [[False] * 61 for _ in range(61)]
              indeg = [0] * 61
              for a in present:
                  for r in range(top[a], bottom[a] + 1):
                      for c in range(left[a], right[a] + 1):
                          b = targetGrid[r][c]
                          if b != a and not edge[a][b]:
                              edge[a][b] = True
                              indeg[b] += 1
              q = deque(v for v in present if indeg[v] == 0)
              done = 0
              while q:
                  a = q.popleft()
                  done += 1
                  for b in present:
                      if edge[a][b]:
                          indeg[b] -= 1
                          if indeg[b] == 0:
                              q.append(b)
              return done == len(present)
        `,
        javascript: code`
          var isPrintable = function(targetGrid) {
              var m = targetGrid.length, n = targetGrid[0].length;
              var top = [], bottom = [], left = [], right = [], indeg = [], edge = [];
              for (var v = 0; v <= 60; v++) {
                  top.push(m); bottom.push(-1); left.push(n); right.push(-1); indeg.push(0);
                  edge.push(new Array(61).fill(false));
              }
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) {
                  var x = targetGrid[r][c];
                  top[x] = Math.min(top[x], r); bottom[x] = Math.max(bottom[x], r);
                  left[x] = Math.min(left[x], c); right[x] = Math.max(right[x], c);
              }
              var present = [];
              for (var p = 1; p <= 60; p++) if (bottom[p] !== -1) present.push(p);
              for (var i = 0; i < present.length; i++) {
                  var a = present[i];
                  for (var rr = top[a]; rr <= bottom[a]; rr++) for (var cc = left[a]; cc <= right[a]; cc++) {
                      var b = targetGrid[rr][cc];
                      if (b !== a && !edge[a][b]) { edge[a][b] = true; indeg[b]++; }
                  }
              }
              var q = [];
              for (var j = 0; j < present.length; j++) if (indeg[present[j]] === 0) q.push(present[j]);
              for (var h = 0; h < q.length; h++) {
                  for (var k = 0; k < present.length; k++) {
                      var d = present[k];
                      if (edge[q[h]][d] && --indeg[d] === 0) q.push(d);
                  }
              }
              return q.length === present.length;
          };
        `,
        typescript: code`
          function isPrintable(targetGrid: number[][]): boolean {
              var m = targetGrid.length, n = targetGrid[0].length;
              var top: number[] = [], bottom: number[] = [], left: number[] = [], right: number[] = [], indeg: number[] = [];
              var edge: boolean[][] = [];
              for (var v = 0; v <= 60; v++) {
                  top.push(m); bottom.push(-1); left.push(n); right.push(-1); indeg.push(0);
                  var row: boolean[] = [];
                  for (var w = 0; w <= 60; w++) row.push(false);
                  edge.push(row);
              }
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) {
                  var x = targetGrid[r][c];
                  top[x] = Math.min(top[x], r); bottom[x] = Math.max(bottom[x], r);
                  left[x] = Math.min(left[x], c); right[x] = Math.max(right[x], c);
              }
              var present: number[] = [];
              for (var p = 1; p <= 60; p++) if (bottom[p] !== -1) present.push(p);
              for (var i = 0; i < present.length; i++) {
                  var a = present[i];
                  for (var rr = top[a]; rr <= bottom[a]; rr++) for (var cc = left[a]; cc <= right[a]; cc++) {
                      var b = targetGrid[rr][cc];
                      if (b !== a && !edge[a][b]) { edge[a][b] = true; indeg[b]++; }
                  }
              }
              var q: number[] = [];
              for (var j = 0; j < present.length; j++) if (indeg[present[j]] === 0) q.push(present[j]);
              for (var h = 0; h < q.length; h++) {
                  for (var k = 0; k < present.length; k++) {
                      var d = present[k];
                      if (edge[q[h]][d] && --indeg[d] === 0) q.push(d);
                  }
              }
              return q.length === present.length;
          }
        `,
        java: code`
          public static boolean isPrintable(int[][] targetGrid) {
              int m = targetGrid.length, n = targetGrid[0].length;
              int[] top = new int[61], bottom = new int[61], left = new int[61], right = new int[61], indeg = new int[61];
              Arrays.fill(top, m); Arrays.fill(bottom, -1); Arrays.fill(left, n); Arrays.fill(right, -1);
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  int v = targetGrid[r][c];
                  top[v] = Math.min(top[v], r); bottom[v] = Math.max(bottom[v], r);
                  left[v] = Math.min(left[v], c); right[v] = Math.max(right[v], c);
              }
              boolean[][] edge = new boolean[61][61];
              int present = 0;
              for (int a = 1; a <= 60; a++) {
                  if (bottom[a] == -1) continue;
                  present++;
                  for (int r = top[a]; r <= bottom[a]; r++) for (int c = left[a]; c <= right[a]; c++) {
                      int b = targetGrid[r][c];
                      if (b != a && !edge[a][b]) { edge[a][b] = true; indeg[b]++; }
                  }
              }
              int[] q = new int[61];
              int head = 0, tail = 0;
              for (int a = 1; a <= 60; a++) if (bottom[a] != -1 && indeg[a] == 0) q[tail++] = a;
              while (head < tail) {
                  int a = q[head++];
                  for (int b = 1; b <= 60; b++) if (edge[a][b] && --indeg[b] == 0) q[tail++] = b;
              }
              return tail == present;
          }
        `,
        cpp: code`
          bool isPrintable(vector<vector<int>>& targetGrid) {
              int m = targetGrid.size(), n = targetGrid[0].size();
              vector<int> top(61, m), bottom(61, -1), left(61, n), right(61, -1), indeg(61, 0);
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  int v = targetGrid[r][c];
                  top[v] = min(top[v], r); bottom[v] = max(bottom[v], r);
                  left[v] = min(left[v], c); right[v] = max(right[v], c);
              }
              vector<vector<bool>> edge(61, vector<bool>(61, false));
              int present = 0;
              for (int a = 1; a <= 60; a++) {
                  if (bottom[a] == -1) continue;
                  present++;
                  for (int r = top[a]; r <= bottom[a]; r++) for (int c = left[a]; c <= right[a]; c++) {
                      int b = targetGrid[r][c];
                      if (b != a && !edge[a][b]) { edge[a][b] = true; indeg[b]++; }
                  }
              }
              vector<int> q;
              for (int a = 1; a <= 60; a++) if (bottom[a] != -1 && indeg[a] == 0) q.push_back(a);
              for (size_t h = 0; h < q.size(); h++) {
                  int a = q[h];
                  for (int b = 1; b <= 60; b++) if (edge[a][b] && --indeg[b] == 0) q.push_back(b);
              }
              return (int)q.size() == present;
          }
        `,
        c: code`
          bool isPrintable(int** targetGrid, int targetGridSize, int* targetGridColSize) {
              int m = targetGridSize, n = targetGridColSize[0];
              int top[61], bottom[61], left[61], right[61], indeg[61], q[61];
              static char edge[61][61];
              for (int v = 0; v <= 60; v++) { top[v] = m; bottom[v] = -1; left[v] = n; right[v] = -1; indeg[v] = 0; }
              memset(edge, 0, sizeof(edge));
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
                  int v = targetGrid[r][c];
                  if (r < top[v]) top[v] = r;
                  if (r > bottom[v]) bottom[v] = r;
                  if (c < left[v]) left[v] = c;
                  if (c > right[v]) right[v] = c;
              }
              int present = 0;
              for (int a = 1; a <= 60; a++) {
                  if (bottom[a] == -1) continue;
                  present++;
                  for (int r = top[a]; r <= bottom[a]; r++) for (int c = left[a]; c <= right[a]; c++) {
                      int b = targetGrid[r][c];
                      if (b != a && !edge[a][b]) { edge[a][b] = 1; indeg[b]++; }
                  }
              }
              int head = 0, tail = 0;
              for (int a = 1; a <= 60; a++) if (bottom[a] != -1 && indeg[a] == 0) q[tail++] = a;
              while (head < tail) {
                  int a = q[head++];
                  for (int b = 1; b <= 60; b++) if (edge[a][b] && --indeg[b] == 0) q[tail++] = b;
              }
              return tail == present;
          }
        `,
        csharp: code`
          public static bool IsPrintable(int[][] targetGrid)
          {
              int m = targetGrid.Length, n = targetGrid[0].Length;
              int[] top = new int[61], bottom = new int[61], left = new int[61], right = new int[61], indeg = new int[61];
              for (int v = 0; v <= 60; v++) { top[v] = m; bottom[v] = -1; left[v] = n; right[v] = -1; }
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++)
              {
                  int v = targetGrid[r][c];
                  top[v] = Math.Min(top[v], r); bottom[v] = Math.Max(bottom[v], r);
                  left[v] = Math.Min(left[v], c); right[v] = Math.Max(right[v], c);
              }
              var edge = new bool[61, 61];
              int present = 0;
              for (int a = 1; a <= 60; a++)
              {
                  if (bottom[a] == -1) continue;
                  present++;
                  for (int r = top[a]; r <= bottom[a]; r++) for (int c = left[a]; c <= right[a]; c++)
                  {
                      int b = targetGrid[r][c];
                      if (b != a && !edge[a, b]) { edge[a, b] = true; indeg[b]++; }
                  }
              }
              var q = new Queue<int>();
              for (int a = 1; a <= 60; a++) if (bottom[a] != -1 && indeg[a] == 0) q.Enqueue(a);
              int done = 0;
              while (q.Count > 0)
              {
                  int a = q.Dequeue();
                  done++;
                  for (int b = 1; b <= 60; b++) if (edge[a, b] && --indeg[b] == 0) q.Enqueue(b);
              }
              return done == present;
          }
        `,
        go: code`
          func isPrintable(targetGrid [][]int) bool {
              m, n := len(targetGrid), len(targetGrid[0])
              var top, bottom, left, right, indeg [61]int
              for v := 0; v <= 60; v++ {
                  top[v], bottom[v], left[v], right[v] = m, -1, n, -1
              }
              for r := 0; r < m; r++ {
                  for c := 0; c < n; c++ {
                      v := targetGrid[r][c]
                      if r < top[v] {
                          top[v] = r
                      }
                      if r > bottom[v] {
                          bottom[v] = r
                      }
                      if c < left[v] {
                          left[v] = c
                      }
                      if c > right[v] {
                          right[v] = c
                      }
                  }
              }
              var edge [61][61]bool
              present := 0
              for a := 1; a <= 60; a++ {
                  if bottom[a] == -1 {
                      continue
                  }
                  present++
                  for r := top[a]; r <= bottom[a]; r++ {
                      for c := left[a]; c <= right[a]; c++ {
                          b := targetGrid[r][c]
                          if b != a && !edge[a][b] {
                              edge[a][b] = true
                              indeg[b]++
                          }
                      }
                  }
              }
              q := []int{}
              for a := 1; a <= 60; a++ {
                  if bottom[a] != -1 && indeg[a] == 0 {
                      q = append(q, a)
                  }
              }
              for h := 0; h < len(q); h++ {
                  a := q[h]
                  for b := 1; b <= 60; b++ {
                      if edge[a][b] {
                          indeg[b]--
                          if indeg[b] == 0 {
                              q = append(q, b)
                          }
                      }
                  }
              }
              return len(q) == present
          }
        `,
        kotlin: code`
          fun isPrintable(targetGrid: Array<IntArray>): Boolean {
              val m = targetGrid.size
              val n = targetGrid[0].size
              val top = IntArray(61) { m }
              val bottom = IntArray(61) { -1 }
              val left = IntArray(61) { n }
              val right = IntArray(61) { -1 }
              val indeg = IntArray(61)
              for (r in 0 until m) for (c in 0 until n) {
                  val v = targetGrid[r][c]
                  top[v] = minOf(top[v], r); bottom[v] = maxOf(bottom[v], r)
                  left[v] = minOf(left[v], c); right[v] = maxOf(right[v], c)
              }
              val edge = Array(61) { BooleanArray(61) }
              var present = 0
              for (a in 1..60) {
                  if (bottom[a] == -1) continue
                  present++
                  for (r in top[a]..bottom[a]) for (c in left[a]..right[a]) {
                      val b = targetGrid[r][c]
                      if (b != a && !edge[a][b]) { edge[a][b] = true; indeg[b]++ }
                  }
              }
              val q = ArrayList<Int>()
              for (a in 1..60) if (bottom[a] != -1 && indeg[a] == 0) q.add(a)
              var h = 0
              while (h < q.size) {
                  val a = q[h++]
                  for (b in 1..60) if (edge[a][b] && --indeg[b] == 0) q.add(b)
              }
              return q.size == present
          }
        `,
        swift: code`
          func isPrintable(_ targetGrid: [[Int]]) -> Bool {
              let m = targetGrid.count, n = targetGrid[0].count
              var top = [Int](repeating: m, count: 61), bottom = [Int](repeating: -1, count: 61)
              var left = [Int](repeating: n, count: 61), right = [Int](repeating: -1, count: 61)
              var indeg = [Int](repeating: 0, count: 61)
              for r in 0..<m {
                  for c in 0..<n {
                      let v = targetGrid[r][c]
                      top[v] = min(top[v], r); bottom[v] = max(bottom[v], r)
                      left[v] = min(left[v], c); right[v] = max(right[v], c)
                  }
              }
              var edge = [[Bool]](repeating: [Bool](repeating: false, count: 61), count: 61)
              var present = 0
              for a in 1...60 where bottom[a] != -1 {
                  present += 1
                  for r in top[a]...bottom[a] {
                      for c in left[a]...right[a] {
                          let b = targetGrid[r][c]
                          if b != a && !edge[a][b] { edge[a][b] = true; indeg[b] += 1 }
                      }
                  }
              }
              var q = [Int]()
              for a in 1...60 where bottom[a] != -1 && indeg[a] == 0 { q.append(a) }
              var h = 0
              while h < q.count {
                  let a = q[h]
                  h += 1
                  for b in 1...60 where edge[a][b] {
                      indeg[b] -= 1
                      if indeg[b] == 0 { q.append(b) }
                  }
              }
              return q.count == present
          }
        `,
        rust: code`
          fn isPrintable(target_grid: Vec<Vec<i32>>) -> bool {
              let (m, n) = (target_grid.len() as i32, target_grid[0].len() as i32);
              let mut top = vec![m; 61];
              let mut bottom = vec![-1i32; 61];
              let mut left = vec![n; 61];
              let mut right = vec![-1i32; 61];
              let mut indeg = vec![0i32; 61];
              for r in 0..m {
                  for c in 0..n {
                      let v = target_grid[r as usize][c as usize] as usize;
                      top[v] = top[v].min(r);
                      bottom[v] = bottom[v].max(r);
                      left[v] = left[v].min(c);
                      right[v] = right[v].max(c);
                  }
              }
              let mut edge = vec![vec![false; 61]; 61];
              let mut present = 0;
              for a in 1..=60usize {
                  if bottom[a] == -1 {
                      continue;
                  }
                  present += 1;
                  for r in top[a]..=bottom[a] {
                      for c in left[a]..=right[a] {
                          let b = target_grid[r as usize][c as usize] as usize;
                          if b != a && !edge[a][b] {
                              edge[a][b] = true;
                              indeg[b] += 1;
                          }
                      }
                  }
              }
              let mut q: Vec<usize> = (1..=60).filter(|&a| bottom[a] != -1 && indeg[a] == 0).collect();
              let mut h = 0;
              while h < q.len() {
                  let a = q[h];
                  h += 1;
                  for b in 1..=60usize {
                      if edge[a][b] {
                          indeg[b] -= 1;
                          if indeg[b] == 0 {
                              q.push(b);
                          }
                      }
                  }
              }
              q.len() == present
          }
        `,
        php: code`
          function isPrintable($targetGrid) {
              $m = count($targetGrid);
              $n = count($targetGrid[0]);
              $top = array_fill(0, 61, $m);
              $bottom = array_fill(0, 61, -1);
              $left = array_fill(0, 61, $n);
              $right = array_fill(0, 61, -1);
              $indeg = array_fill(0, 61, 0);
              for ($r = 0; $r < $m; $r++)
                  for ($c = 0; $c < $n; $c++) {
                      $v = $targetGrid[$r][$c];
                      $top[$v] = min($top[$v], $r); $bottom[$v] = max($bottom[$v], $r);
                      $left[$v] = min($left[$v], $c); $right[$v] = max($right[$v], $c);
                  }
              $edge = [];
              $present = 0;
              for ($a = 1; $a <= 60; $a++) {
                  if ($bottom[$a] == -1) continue;
                  $present++;
                  for ($r = $top[$a]; $r <= $bottom[$a]; $r++)
                      for ($c = $left[$a]; $c <= $right[$a]; $c++) {
                          $b = $targetGrid[$r][$c];
                          if ($b != $a && !isset($edge[$a][$b])) { $edge[$a][$b] = true; $indeg[$b]++; }
                      }
              }
              $q = [];
              for ($a = 1; $a <= 60; $a++) if ($bottom[$a] != -1 && $indeg[$a] == 0) $q[] = $a;
              for ($h = 0; $h < count($q); $h++) {
                  $a = $q[$h];
                  if (!isset($edge[$a])) continue;
                  foreach ($edge[$a] as $b => $_) if (--$indeg[$b] == 0) $q[] = $b;
              }
              return count($q) == $present;
          }
        `,
        ruby: code`
          def isPrintable(targetGrid)
            m = targetGrid.length
            n = targetGrid[0].length
            top = Array.new(61, m)
            bottom = Array.new(61, -1)
            left = Array.new(61, n)
            right = Array.new(61, -1)
            indeg = Array.new(61, 0)
            m.times do |r|
              n.times do |c|
                v = targetGrid[r][c]
                top[v] = r if r < top[v]
                bottom[v] = r if r > bottom[v]
                left[v] = c if c < left[v]
                right[v] = c if c > right[v]
              end
            end
            edge = Array.new(61) { Array.new(61, false) }
            present = (1..60).select { |a| bottom[a] != -1 }
            present.each do |a|
              (top[a]..bottom[a]).each do |r|
                (left[a]..right[a]).each do |c|
                  b = targetGrid[r][c]
                  next if b == a || edge[a][b]
                  edge[a][b] = true
                  indeg[b] += 1
                end
              end
            end
            q = present.select { |a| indeg[a] == 0 }
            h = 0
            while h < q.length
              a = q[h]
              h += 1
              present.each do |b|
                next unless edge[a][b]
                indeg[b] -= 1
                q << b if indeg[b] == 0
              end
            end
            q.length == present.length
          end
        `,
      },
    };
  })(),

  // ── Lexicographically Smallest String After Applying Operations (LC 1625) ──
  (() => {
    const add = (s: string, a: number) => s.split("").map((ch, i) => (i % 2 === 1 ? String((Number(ch) + a) % 10) : ch)).join("");
    const rot = (s: string, b: number) => s.slice(s.length - b) + s.slice(0, s.length - b);
    const ref = (s: string, a: number, b: number) => {
      const seen = new Set<string>([s]);
      const q = [s];
      let best = s;
      for (let h = 0; h < q.length; h++) {
        const cur = q[h];
        if (cur < best) best = cur;
        for (const t of [add(cur, a), rot(cur, b)]) if (!seen.has(t)) { seen.add(t); q.push(t); }
      }
      return best;
    };
    return {
      slug: "lexicographically-smallest-string-after-applying-operations",
      title: "Lexicographically Smallest String After Applying Operations",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Depth-First Search", "Breadth-First Search", "Enumeration", "JPMorgan", "Amazon"],
      signature: {
        funcName: "findLexSmallestString",
        params: [{ name: "s", type: "string" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a string `s` of **even** length made of digits `0`–`9`, and two integers `a` and `b`. You may apply either operation any number of times, in any order:\n\n- **Add:** add `a` to every digit at an **odd** index (0-indexed); a digit past `9` wraps around to `0`. For example, `s = \"3456\"` with `a = 5` becomes `\"3951\"`.\n- **Rotate:** rotate `s` to the right by `b` positions. For example, `s = \"3456\"` with `b = 1` becomes `\"6345\"`.\n\nReturn the **lexicographically smallest** string you can obtain.",
        [
          { in: "s = \"5525\", a = 9, b = 2", out: "2050", note: "Rotate to \"2555\", add to get \"2454\", add again to \"2353\", rotate to \"5323\", then add repeatedly: \"5222\", \"5121\", \"5020\"; rotate to \"2050\"." },
          { in: "s = \"74\", a = 5, b = 1", out: "24", note: "Rotate to \"47\", add to get \"42\", rotate to \"24\"." },
          { in: "s = \"0011\", a = 4, b = 2", out: "0011", note: "Nothing beats the starting string." },
        ],
        ["2 <= s.length <= 100", "s.length is even", "s consists of digits from 0 to 9 only", "1 <= a <= 9", "1 <= b <= s.length - 1"]),
      hints: [
        "Every reachable string is a state, and the two operations are its edges. How many states can there be?",
        "Rotations give at most `n` arrangements, and the digits at odd positions can only be shifted by one of 10 amounts (with even positions too, if `b` is odd) — at most `100 · n` strings in all.",
        "So just explore everything: BFS or DFS from `s` with a visited set, and keep the smallest string seen.",
      ],
      editorial: explain({
        idea: "The space of reachable strings is small — at most `n` rotations times 10 shifts of the odd positions (times 10 for the even positions when `b` is odd) — so an exhaustive search over it is fast and obviously correct.",
        steps: [
          "Start a queue and a visited set with `s`; let `best = s`.",
          "Pop a string, update `best` if it is smaller.",
          "Generate its two neighbours — the add result and the rotate result — and push each one not yet visited.",
          "When the queue is empty, return `best`.",
        ],
        why: "The search visits exactly the strings reachable from `s` by any sequence of operations, so the minimum over them is the answer. Adding `a` ten times returns the digits to where they started and rotating returns after `n / gcd(n, b)` steps, which is why the set of states is finite and bounded by about `100 · n`.",
        time: "O(100 · n^2) — up to 100·n states, each copied in O(n)",
        space: "O(100 · n^2)",
        pitfalls: [
          "\"Odd indices\" are 1, 3, 5, … counting from 0, not the 1st, 3rd, … characters.",
          "When `b` is even, rotation keeps odd positions odd, so even-index digits never change; when `b` is odd they can be shifted too. The search handles both without special cases.",
          "Compare strings lexicographically, not as numbers — leading zeros matter.",
        ],
      }),
      examples: [
        { input: "\"5525\"\n9\n2", expectedOutput: "2050" },
        { input: "\"74\"\n5\n1", expectedOutput: "24" },
        { input: "\"0011\"\n4\n2", expectedOutput: "0011" },
      ],
      // Every case is a full BFS over up to 10 · 10 · n strings, so 5,000 cases
      // ran past Paiza's per-run limit in Python and Ruby (shrinking n barely
      // helped — the state count, not the length, is the cost); 2,000 fit.
      hiddenCount: 2000,
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, rng() < 0.1 ? 1 : 2, pick(rng, [2, 3, 4, 4]));
        const s = Array.from({ length: n }, () => String(ri(rng, 0, 9))).join("");
        const a = ri(rng, 1, 9), b = ri(rng, 1, n - 1);
        return { input: `"${s}"\n${a}\n${b}`, expectedOutput: ref(s, a, b) };
      },
      solutions: {
        python: code`
          from collections import deque

          def findLexSmallestString(s: str, a: int, b: int) -> str:
              n = len(s)
              seen = {s}
              q = deque([s])
              best = s
              while q:
                  cur = q.popleft()
                  if cur < best:
                      best = cur
                  added = ''.join(str((int(ch) + a) % 10) if i % 2 else ch for i, ch in enumerate(cur))
                  rotated = cur[n - b:] + cur[:n - b]
                  for t in (added, rotated):
                      if t not in seen:
                          seen.add(t)
                          q.append(t)
              return best
        `,
        javascript: code`
          var findLexSmallestString = function(s, a, b) {
              var n = s.length, seen = {}, q = [s], best = s;
              seen[s] = true;
              for (var h = 0; h < q.length; h++) {
                  var cur = q[h];
                  if (cur < best) best = cur;
                  var chars = cur.split("");
                  for (var i = 1; i < n; i += 2) chars[i] = String((chars[i].charCodeAt(0) - 48 + a) % 10);
                  var added = chars.join("");
                  var rotated = cur.substring(n - b) + cur.substring(0, n - b);
                  if (!seen[added]) { seen[added] = true; q.push(added); }
                  if (!seen[rotated]) { seen[rotated] = true; q.push(rotated); }
              }
              return best;
          };
        `,
        typescript: code`
          function findLexSmallestString(s: string, a: number, b: number): string {
              var n = s.length, q: string[] = [s], best = s;
              var seen: { [k: string]: boolean } = {};
              seen[s] = true;
              for (var h = 0; h < q.length; h++) {
                  var cur = q[h];
                  if (cur < best) best = cur;
                  var chars = cur.split("");
                  for (var i = 1; i < n; i += 2) chars[i] = String((chars[i].charCodeAt(0) - 48 + a) % 10);
                  var added = chars.join("");
                  var rotated = cur.substring(n - b) + cur.substring(0, n - b);
                  if (!seen[added]) { seen[added] = true; q.push(added); }
                  if (!seen[rotated]) { seen[rotated] = true; q.push(rotated); }
              }
              return best;
          }
        `,
        java: code`
          public static String findLexSmallestString(String s, int a, int b) {
              int n = s.length();
              Set<String> seen = new HashSet<>();
              ArrayDeque<String> q = new ArrayDeque<>();
              seen.add(s);
              q.add(s);
              String best = s;
              while (!q.isEmpty()) {
                  String cur = q.poll();
                  if (cur.compareTo(best) < 0) best = cur;
                  char[] chars = cur.toCharArray();
                  for (int i = 1; i < n; i += 2) chars[i] = (char) ('0' + (chars[i] - '0' + a) % 10);
                  String added = new String(chars);
                  String rotated = cur.substring(n - b) + cur.substring(0, n - b);
                  if (seen.add(added)) q.add(added);
                  if (seen.add(rotated)) q.add(rotated);
              }
              return best;
          }
        `,
        cpp: code`
          string findLexSmallestString(string s, int a, int b) {
              int n = s.size();
              unordered_set<string> seen{s};
              queue<string> q;
              q.push(s);
              string best = s;
              while (!q.empty()) {
                  string cur = q.front(); q.pop();
                  if (cur < best) best = cur;
                  string added = cur;
                  for (int i = 1; i < n; i += 2) added[i] = '0' + (added[i] - '0' + a) % 10;
                  string rotated = cur.substr(n - b) + cur.substr(0, n - b);
                  if (seen.insert(added).second) q.push(added);
                  if (seen.insert(rotated).second) q.push(rotated);
              }
              return best;
          }
        `,
        c: code`
          /* At most n rotations x 10 odd shifts x 10 even shifts = 100 n strings. */
          char* findLexSmallestString(const char* s, int a, int b) {
              int n = (int)strlen(s), cap = 100 * n + 4, tsize = 1;
              while (tsize < 2 * cap) tsize <<= 1;
              char* pool = (char*)malloc((size_t)cap * n);
              int* table = (int*)malloc(tsize * sizeof(int));
              for (int i = 0; i < tsize; i++) table[i] = -1;
              char* cand = (char*)malloc(2 * (size_t)n);
              int count = 0, best = 0;
              memcpy(pool, s, n);
              count = 1;
              {
                  unsigned h = 5381;
                  for (int i = 0; i < n; i++) h = h * 33u + (unsigned char)s[i];
                  table[h & (tsize - 1)] = 0;
              }
              for (int head = 0; head < count; head++) {
                  char* cur = pool + (size_t)head * n;
                  if (memcmp(cur, pool + (size_t)best * n, n) < 0) best = head;
                  memcpy(cand, cur, n);
                  for (int i = 1; i < n; i += 2) cand[i] = (char)('0' + (cand[i] - '0' + a) % 10);
                  memcpy(cand + n, cur + n - b, b);
                  memcpy(cand + n + b, cur, n - b);
                  for (int t = 0; t < 2; t++) {
                      char* x = cand + t * n;
                      unsigned h = 5381;
                      for (int i = 0; i < n; i++) h = h * 33u + (unsigned char)x[i];
                      int slot = (int)(h & (unsigned)(tsize - 1)), found = 0;
                      while (table[slot] != -1) {
                          if (memcmp(pool + (size_t)table[slot] * n, x, n) == 0) { found = 1; break; }
                          slot = (slot + 1) & (tsize - 1);
                      }
                      if (found) continue;
                      memcpy(pool + (size_t)count * n, x, n);
                      table[slot] = count++;
                      cur = pool + (size_t)head * n;
                  }
              }
              char* res = (char*)malloc(n + 1);
              memcpy(res, pool + (size_t)best * n, n);
              res[n] = '\0';
              free(pool); free(table); free(cand);
              return res;
          }
        `,
        csharp: code`
          public static string FindLexSmallestString(string s, int a, int b)
          {
              int n = s.Length;
              var seen = new HashSet<string> { s };
              var q = new Queue<string>();
              q.Enqueue(s);
              string best = s;
              while (q.Count > 0)
              {
                  string cur = q.Dequeue();
                  if (string.CompareOrdinal(cur, best) < 0) best = cur;
                  char[] chars = cur.ToCharArray();
                  for (int i = 1; i < n; i += 2) chars[i] = (char)('0' + (chars[i] - '0' + a) % 10);
                  string added = new string(chars);
                  string rotated = cur.Substring(n - b) + cur.Substring(0, n - b);
                  if (seen.Add(added)) q.Enqueue(added);
                  if (seen.Add(rotated)) q.Enqueue(rotated);
              }
              return best;
          }
        `,
        go: code`
          func findLexSmallestString(s string, a int, b int) string {
              n := len(s)
              seen := map[string]bool{s: true}
              q := []string{s}
              best := s
              for h := 0; h < len(q); h++ {
                  cur := q[h]
                  if cur < best {
                      best = cur
                  }
                  chars := []byte(cur)
                  for i := 1; i < n; i += 2 {
                      chars[i] = byte('0' + (int(chars[i]-'0')+a)%10)
                  }
                  added := string(chars)
                  rotated := cur[n-b:] + cur[:n-b]
                  for _, t := range []string{added, rotated} {
                      if !seen[t] {
                          seen[t] = true
                          q = append(q, t)
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun findLexSmallestString(s: String, a: Int, b: Int): String {
              val n = s.length
              val seen = HashSet<String>()
              seen.add(s)
              val q = ArrayList<String>()
              q.add(s)
              var best = s
              var h = 0
              while (h < q.size) {
                  val cur = q[h++]
                  if (cur < best) best = cur
                  val chars = cur.toCharArray()
                  for (i in 1 until n step 2) chars[i] = '0' + (chars[i] - '0' + a) % 10
                  val added = String(chars)
                  val rotated = cur.substring(n - b) + cur.substring(0, n - b)
                  if (seen.add(added)) q.add(added)
                  if (seen.add(rotated)) q.add(rotated)
              }
              return best
          }
        `,
        swift: code`
          func findLexSmallestString(_ s: String, _ a: Int, _ b: Int) -> String {
              let start = Array(s.utf8)
              let n = start.count
              var seen = Set<[UInt8]>([start])
              var q = [start]
              var best = start
              var h = 0
              while h < q.count {
                  let cur = q[h]
                  h += 1
                  if cur.lexicographicallyPrecedes(best) { best = cur }
                  var added = cur
                  var i = 1
                  while i < n {
                      added[i] = UInt8(48 + (Int(added[i]) - 48 + a) % 10)
                      i += 2
                  }
                  let rotated = Array(cur[(n - b)...]) + Array(cur[..<(n - b)])
                  for t in [added, rotated] where !seen.contains(t) {
                      seen.insert(t)
                      q.append(t)
                  }
              }
              return String(decoding: best, as: UTF8.self)
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn findLexSmallestString(s: String, a: i32, b: i32) -> String {
              let start: Vec<u8> = s.into_bytes();
              let n = start.len();
              let b = b as usize;
              let mut seen: HashSet<Vec<u8>> = HashSet::new();
              seen.insert(start.clone());
              let mut q = vec![start.clone()];
              let mut best = start;
              let mut h = 0;
              while h < q.len() {
                  let cur = q[h].clone();
                  h += 1;
                  if cur < best {
                      best = cur.clone();
                  }
                  let mut added = cur.clone();
                  let mut i = 1;
                  while i < n {
                      added[i] = b'0' + ((added[i] - b'0') as i32 + a) as u8 % 10;
                      i += 2;
                  }
                  let mut rotated = cur[n - b..].to_vec();
                  rotated.extend_from_slice(&cur[..n - b]);
                  for t in [added, rotated].iter() {
                      if seen.insert(t.clone()) {
                          q.push(t.clone());
                      }
                  }
              }
              String::from_utf8(best).unwrap()
          }
        `,
        php: code`
          function findLexSmallestString($s, $a, $b) {
              $n = strlen($s);
              $seen = [$s => true];
              $q = [$s];
              $best = $s;
              for ($h = 0; $h < count($q); $h++) {
                  $cur = $q[$h];
                  if (strcmp($cur, $best) < 0) $best = $cur;
                  $added = $cur;
                  for ($i = 1; $i < $n; $i += 2) $added[$i] = chr(48 + (ord($added[$i]) - 48 + $a) % 10);
                  $rotated = substr($cur, $n - $b) . substr($cur, 0, $n - $b);
                  foreach ([$added, $rotated] as $t) {
                      if (!isset($seen[$t])) { $seen[$t] = true; $q[] = $t; }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def findLexSmallestString(s, a, b)
            n = s.length
            seen = { s => true }
            q = [s]
            best = s
            h = 0
            while h < q.length
              cur = q[h]
              h += 1
              best = cur if cur < best
              added = cur.dup
              (1...n).step(2) { |i| added[i] = ((added[i].ord - 48 + a) % 10).to_s }
              rotated = cur[(n - b)..] + cur[0, n - b]
              [added, rotated].each do |t|
                next if seen[t]
                seen[t] = true
                q << t
              end
            end
            best
          end
        `,
      },
    };
  })(),
];
