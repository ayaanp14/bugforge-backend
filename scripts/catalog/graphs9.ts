/**
 * Graphs, trees, grids & union-find problems — wave 7, batch 07.
 * Real problems only: LeetCode numbered problems (recent weekly/biweekly
 * contests plus a few union-find classics). Worked examples are phrased for
 * CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h, and
 * the Rust judge is 1.40 (so `std::i32::MAX`, never `std::i32::MAX`).
 *
 * Trees arrive as undirected edge lists and every solution walks them with an
 * explicit BFS order (parent first, children after) instead of recursion: a
 * 10^5-node path would overflow the call stack in half the languages.
 *
 * Dijkstra appears several times. Languages without a priority queue on the
 * judge carry a small binary min-heap of plain integers, with the distance and
 * the node packed into one key — `dist * 2^k + node` with the node below 2^k —
 * which stays exact in a JavaScript double because every packed key here is
 * below 2^53. Wherever an answer could leave the int32 range the statement's
 * constraints are tightened (or the problem's own modulus is used), and the
 * typed languages keep 64-bit intermediates.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** A random labelled tree on `n` nodes as an edge list (random orientation and order). */
function randTree(rng: Rng, n: number): number[][] {
  const label = shuffle(rng, Array.from({ length: n }, (_, i) => i));
  const shape = pick(rng, ["random", "path", "star", "bushy"]);
  const edges: number[][] = [];
  for (let i = 1; i < n; i++) {
    const j = shape === "path" ? i - 1 : shape === "star" ? 0 : shape === "bushy" ? ri(rng, Math.max(0, i - 3), i - 1) : ri(rng, 0, i - 1);
    edges.push(rng() < 0.5 ? [label[i], label[j]] : [label[j], label[i]]);
  }
  return shuffle(rng, edges);
}

/** Adjacency lists of an undirected edge list. */
function adjOf(n: number, edges: number[][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  return adj;
}

/** Parent of every node and a BFS order, rooted at `root`. */
function rooted(adj: number[][], root: number): { parent: number[]; order: number[] } {
  const parent = new Array(adj.length).fill(-2);
  parent[root] = -1;
  const order = [root];
  for (let h = 0; h < order.length; h++) for (const v of adj[order[h]]) if (parent[v] === -2) { parent[v] = order[h]; order.push(v); }
  return { parent, order };
}

export const GRAPHS9_PROBLEMS: CatalogProblem[] = [

  // ── Time Taken to Mark All Nodes (LC 3241) ──────────────────────
  (() => {
    const ref = (edges: number[][]) => {
      const n = edges.length + 1;
      const adj = adjOf(n, edges);
      return Array.from({ length: n }, (_, s) => {
        const t = new Array(n).fill(-1);
        t[s] = 0;
        const q = [s];
        let best = 0;
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          best = Math.max(best, t[u]);
          for (const v of adj[u]) if (t[v] < 0) { t[v] = t[u] + (v % 2 === 1 ? 1 : 2); q.push(v); }
        }
        return best;
      });
    };
    return {
      slug: "time-taken-to-mark-all-nodes",
      title: "Time Taken to Mark All Nodes",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Graph", "Dynamic Programming", "Google"],
      signature: { funcName: "timeTaken", params: [{ name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1`; its `n - 1` edges are given in `edges`, each `[ui, vi]`.\n\nAt time `0` you mark exactly one node. From then on, every unmarked node gets marked by this rule:\n\n- an **odd** node `i` is marked at time `x` if at least one neighbour was marked at time `x - 1`;\n- an **even** node `i` is marked at time `x` if at least one neighbour was marked at time `x - 2`.\n\nReturn an array `times` where `times[i]` is the moment the **last** node gets marked when you start by marking node `i` alone at time `0`. Each `times[i]` is answered independently.",
        [
          { in: "edges = [[0,1],[0,2]]", out: "[2,4,3]", note: "Start at 0: node 1 (odd) is marked at 1, node 2 (even) at 2. Start at 1: node 0 (even) at 2, then node 2 (even) at 4. Start at 2: node 0 at 2, node 1 at 3." },
          { in: "edges = [[0,1]]", out: "[1,2]" },
          { in: "edges = [[2,4],[0,1],[2,3],[0,2]]", out: "[4,6,3,5,5]" },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= ui, vi <= n - 1", "the input is a valid tree"]),
      hints: [
        "Marking spreads along tree paths, and stepping into node `v` always costs the same: 1 if `v` is odd, 2 if it is even. So `times[i]` is the longest weighted path starting at `i`.",
        "Computing that from every start is O(n²). Root the tree once; the farthest node from `i` is either below `i` or reached by first going up to its parent.",
        "For each node keep the two best downward values coming from different children, so a child can ask its parent for the best path that does not come back through itself — then `up[child] = w(parent) + max(up[parent], best of parent excluding child)`.",
      ],
      editorial: explain({
        idea: "Put the cost on the node you step into: entering an odd node costs 1, an even node 2. Then `times[i]` is the maximum weighted distance from `i`, and the classic two-pass re-rooting DP gives every node's farthest distance in linear time.",
        steps: [
          "Root the tree at 0 and record a BFS order with parents.",
          "Bottom-up (reverse BFS order): for each child `c` of `p`, the candidate `down[c] + w(c)` updates `p`'s best and second-best downward values, remembering which child gave the best.",
          "Top-down (BFS order): for each child `c` of `p`, the best path from `c` that starts by stepping to `p` is `w(p) + max(up[p], other)`, where `other` is `p`'s best downward value from a child other than `c`.",
          "`times[u] = max(down[u], up[u])`.",
        ],
        why: "Every path from `u` either stays inside `u`'s subtree (covered by `down[u]`) or leaves through the parent. A path through the parent `p` then continues either further up (`up[p]`) or down into a sibling subtree — which is exactly the best child value of `p` not using `u`. Keeping the top two child values is enough because only one child is excluded at a time.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The cost depends on the node being **entered**, not on the node you leave — the start node itself costs nothing.",
          "When the best child of `p` is `c` itself, `c` must use `p`'s second-best value; otherwise it would count a path that walks back into its own subtree.",
          "Recursion over a 10^5-node path overflows the stack in several languages; use an explicit BFS order.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2]]", expectedOutput: "[2,4,3]" },
        { input: "[[0,1]]", expectedOutput: "[1,2]" },
        { input: "[[2,4],[0,1],[2,3],[0,2]]", expectedOutput: "[4,6,3,5,5]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 8, 12, 20, 30]);
        const edges = randTree(rng, n);
        return { input: fmtIntMat(edges), expectedOutput: fmtIntArr(ref(edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def timeTaken(edges: List[List[int]]) -> List[int]:
              n = len(edges) + 1
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-2] * n
              parent[0] = -1
              order = [0]
              for u in order:
                  for v in adj[u]:
                      if parent[v] == -2:
                          parent[v] = u
                          order.append(v)
              w = [1 if v % 2 == 1 else 2 for v in range(n)]
              d1 = [0] * n
              d2 = [0] * n
              c1 = [-1] * n
              for u in reversed(order):
                  p = parent[u]
                  if p >= 0:
                      val = d1[u] + w[u]
                      if val > d1[p]:
                          d2[p] = d1[p]
                          d1[p] = val
                          c1[p] = u
                      elif val > d2[p]:
                          d2[p] = val
              up = [0] * n
              for u in order:
                  p = parent[u]
                  if p >= 0:
                      other = d2[p] if c1[p] == u else d1[p]
                      up[u] = w[p] + max(up[p], other)
              return [max(d1[u], up[u]) for u in range(n)]
        `,
        javascript: code`
          var timeTaken = function(edges) {
              var n = edges.length + 1;
              var adj = [], parent = [], d1 = [], d2 = [], c1 = [], up = [], w = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); d1.push(0); d2.push(0); c1.push(-1); up.push(0); w.push(i % 2 === 1 ? 1 : 2); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              for (var t = n - 1; t > 0; t--) {
                  var c = order[t], p = parent[c];
                  var val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (var k = 1; k < n; k++) {
                  var x = order[k], q = parent[x];
                  var other = c1[q] === x ? d2[q] : d1[q];
                  up[x] = w[q] + Math.max(up[q], other);
              }
              var ans = [];
              for (var z = 0; z < n; z++) ans.push(Math.max(d1[z], up[z]));
              return ans;
          };
        `,
        typescript: code`
          function timeTaken(edges: number[][]): number[] {
              var n = edges.length + 1;
              var adj: number[][] = [], parent: number[] = [], d1: number[] = [], d2: number[] = [], c1: number[] = [], up: number[] = [], w: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); d1.push(0); d2.push(0); c1.push(-1); up.push(0); w.push(i % 2 === 1 ? 1 : 2); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              for (var t = n - 1; t > 0; t--) {
                  var c = order[t], p = parent[c];
                  var val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (var k = 1; k < n; k++) {
                  var x = order[k], q = parent[x];
                  var other = c1[q] === x ? d2[q] : d1[q];
                  up[x] = w[q] + Math.max(up[q], other);
              }
              var ans: number[] = [];
              for (var z = 0; z < n; z++) ans.push(Math.max(d1[z], up[z]));
              return ans;
          }
        `,
        java: code`
          public static int[] timeTaken(int[][] edges) {
              int n = edges.length + 1;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n], d1 = new int[n], d2 = new int[n], c1 = new int[n], up = new int[n], w = new int[n];
              for (int i = 0; i < n; i++) { parent[i] = -2; c1[i] = -1; w[i] = i % 2 == 1 ? 1 : 2; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int v : adj.get(u)) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              for (int t = n - 1; t > 0; t--) {
                  int c = order[t], p = parent[c];
                  int val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (int k = 1; k < n; k++) {
                  int x = order[k], q = parent[x];
                  int other = c1[q] == x ? d2[q] : d1[q];
                  up[x] = w[q] + Math.max(up[q], other);
              }
              int[] ans = new int[n];
              for (int z = 0; z < n; z++) ans[z] = Math.max(d1[z], up[z]);
              return ans;
          }
        `,
        cpp: code`
          vector<int> timeTaken(vector<vector<int>>& edges) {
              int n = edges.size() + 1;
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -2), d1(n, 0), d2(n, 0), c1(n, -1), up(n, 0), w(n), order;
              for (int i = 0; i < n; i++) w[i] = i % 2 == 1 ? 1 : 2;
              parent[0] = -1;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (parent[v] == -2) { parent[v] = u; order.push_back(v); }
              }
              for (int t = n - 1; t > 0; t--) {
                  int c = order[t], p = parent[c];
                  int val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (int k = 1; k < n; k++) {
                  int x = order[k], q = parent[x];
                  int other = c1[q] == x ? d2[q] : d1[q];
                  up[x] = w[q] + max(up[q], other);
              }
              vector<int> ans(n);
              for (int z = 0; z < n; z++) ans[z] = max(d1[z], up[z]);
              return ans;
          }
        `,
        c: code`
          int* timeTaken(int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
              int n = edgesSize + 1;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0] + 1]++; first[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* parent = (int*)malloc(n * sizeof(int));
              int* order = (int*)malloc(n * sizeof(int));
              int* d1 = (int*)calloc(n, sizeof(int));
              int* d2 = (int*)calloc(n, sizeof(int));
              int* c1 = (int*)malloc(n * sizeof(int));
              int* up = (int*)calloc(n, sizeof(int));
              int* w = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) { parent[i] = -2; c1[i] = -1; w[i] = i % 2 == 1 ? 1 : 2; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
                  }
              }
              for (int t = n - 1; t > 0; t--) {
                  int c = order[t], p = parent[c];
                  int val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (int k = 1; k < n; k++) {
                  int x = order[k], q = parent[x];
                  int other = c1[q] == x ? d2[q] : d1[q];
                  int best = up[q] > other ? up[q] : other;
                  up[x] = w[q] + best;
              }
              int* ans = (int*)malloc(n * sizeof(int));
              for (int z = 0; z < n; z++) ans[z] = d1[z] > up[z] ? d1[z] : up[z];
              free(first); free(fill); free(adj); free(parent); free(order);
              free(d1); free(d2); free(c1); free(up); free(w);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          public static int[] TimeTaken(int[][] edges)
          {
              int n = edges.Length + 1;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], order = new int[n], d1 = new int[n], d2 = new int[n], c1 = new int[n], up = new int[n], w = new int[n];
              for (int i = 0; i < n; i++) { parent[i] = -2; c1[i] = -1; w[i] = i % 2 == 1 ? 1 : 2; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
              {
                  int u = order[h];
                  foreach (int v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              for (int t = n - 1; t > 0; t--)
              {
                  int c = order[t], p = parent[c];
                  int val = d1[c] + w[c];
                  if (val > d1[p]) { d2[p] = d1[p]; d1[p] = val; c1[p] = c; }
                  else if (val > d2[p]) d2[p] = val;
              }
              for (int k = 1; k < n; k++)
              {
                  int x = order[k], q = parent[x];
                  int other = c1[q] == x ? d2[q] : d1[q];
                  up[x] = w[q] + Math.Max(up[q], other);
              }
              var ans = new int[n];
              for (int z = 0; z < n; z++) ans[z] = Math.Max(d1[z], up[z]);
              return ans;
          }
        `,
        go: code`
          func timeTaken(edges [][]int) []int {
          	n := len(edges) + 1
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	parent := make([]int, n)
          	d1 := make([]int, n)
          	d2 := make([]int, n)
          	c1 := make([]int, n)
          	up := make([]int, n)
          	w := make([]int, n)
          	for i := 0; i < n; i++ {
          		parent[i] = -2
          		c1[i] = -1
          		if i%2 == 1 {
          			w[i] = 1
          		} else {
          			w[i] = 2
          		}
          	}
          	parent[0] = -1
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		u := order[h]
          		for _, v := range adj[u] {
          			if parent[v] == -2 {
          				parent[v] = u
          				order = append(order, v)
          			}
          		}
          	}
          	for t := n - 1; t > 0; t-- {
          		c := order[t]
          		p := parent[c]
          		val := d1[c] + w[c]
          		if val > d1[p] {
          			d2[p] = d1[p]
          			d1[p] = val
          			c1[p] = c
          		} else if val > d2[p] {
          			d2[p] = val
          		}
          	}
          	for k := 1; k < n; k++ {
          		x := order[k]
          		q := parent[x]
          		other := d1[q]
          		if c1[q] == x {
          			other = d2[q]
          		}
          		if up[q] > other {
          			other = up[q]
          		}
          		up[x] = w[q] + other
          	}
          	ans := make([]int, n)
          	for z := 0; z < n; z++ {
          		ans[z] = d1[z]
          		if up[z] > ans[z] {
          			ans[z] = up[z]
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun timeTaken(edges: Array<IntArray>): IntArray {
              val n = edges.size + 1
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -2 }
              val d1 = IntArray(n)
              val d2 = IntArray(n)
              val c1 = IntArray(n) { -1 }
              val up = IntArray(n)
              val w = IntArray(n) { if (it % 2 == 1) 1 else 2 }
              val order = IntArray(n)
              parent[0] = -1
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  val u = order[h++]
                  for (v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v }
              }
              for (t in n - 1 downTo 1) {
                  val c = order[t]
                  val p = parent[c]
                  val cand = d1[c] + w[c]
                  if (cand > d1[p]) { d2[p] = d1[p]; d1[p] = cand; c1[p] = c }
                  else if (cand > d2[p]) d2[p] = cand
              }
              for (k in 1 until n) {
                  val x = order[k]
                  val q = parent[x]
                  val other = if (c1[q] == x) d2[q] else d1[q]
                  up[x] = w[q] + maxOf(up[q], other)
              }
              return IntArray(n) { maxOf(d1[it], up[it]) }
          }
        `,
        swift: code`
          func timeTaken(_ edges: [[Int]]) -> [Int] {
              let n = edges.count + 1
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -2, count: n)
              var d1 = [Int](repeating: 0, count: n)
              var d2 = [Int](repeating: 0, count: n)
              var c1 = [Int](repeating: -1, count: n)
              var up = [Int](repeating: 0, count: n)
              var w = [Int](repeating: 2, count: n)
              for i in 0..<n where i % 2 == 1 { w[i] = 1 }
              parent[0] = -1
              var order = [0]
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for v in adj[u] where parent[v] == -2 {
                      parent[v] = u
                      order.append(v)
                  }
              }
              var t = n - 1
              while t > 0 {
                  let c = order[t], p = parent[c]
                  let cand = d1[c] + w[c]
                  if cand > d1[p] { d2[p] = d1[p]; d1[p] = cand; c1[p] = c }
                  else if cand > d2[p] { d2[p] = cand }
                  t -= 1
              }
              for k in stride(from: 1, to: n, by: 1) {
                  let x = order[k], q = parent[x]
                  let other = c1[q] == x ? d2[q] : d1[q]
                  up[x] = w[q] + max(up[q], other)
              }
              var ans = [Int](repeating: 0, count: n)
              for z in 0..<n { ans[z] = max(d1[z], up[z]) }
              return ans
          }
        `,
        rust: code`
          fn timeTaken(edges: Vec<Vec<i32>>) -> Vec<i32> {
              let n = edges.len() + 1;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let none = std::usize::MAX;
              let mut parent = vec![none; n];
              let mut seen = vec![false; n];
              seen[0] = true;
              let mut order: Vec<usize> = vec![0];
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
              let w: Vec<i32> = (0..n).map(|v| if v % 2 == 1 { 1 } else { 2 }).collect();
              let mut d1 = vec![0i32; n];
              let mut d2 = vec![0i32; n];
              let mut c1 = vec![none; n];
              let mut up = vec![0i32; n];
              for t in (1..n).rev() {
                  let c = order[t];
                  let p = parent[c];
                  let val = d1[c] + w[c];
                  if val > d1[p] {
                      d2[p] = d1[p];
                      d1[p] = val;
                      c1[p] = c;
                  } else if val > d2[p] {
                      d2[p] = val;
                  }
              }
              for k in 1..n {
                  let x = order[k];
                  let q = parent[x];
                  let other = if c1[q] == x { d2[q] } else { d1[q] };
                  up[x] = w[q] + std::cmp::max(up[q], other);
              }
              (0..n).map(|z| std::cmp::max(d1[z], up[z])).collect()
          }
        `,
        php: code`
          function timeTaken($edges) {
              $n = count($edges) + 1;
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -2);
              $d1 = array_fill(0, $n, 0);
              $d2 = array_fill(0, $n, 0);
              $c1 = array_fill(0, $n, -1);
              $up = array_fill(0, $n, 0);
              $w = [];
              for ($i = 0; $i < $n; $i++) $w[] = $i % 2 == 1 ? 1 : 2;
              $parent[0] = -1;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) if ($parent[$v] == -2) { $parent[$v] = $u; $order[] = $v; }
              }
              for ($t = $n - 1; $t > 0; $t--) {
                  $c = $order[$t];
                  $p = $parent[$c];
                  $val = $d1[$c] + $w[$c];
                  if ($val > $d1[$p]) { $d2[$p] = $d1[$p]; $d1[$p] = $val; $c1[$p] = $c; }
                  elseif ($val > $d2[$p]) $d2[$p] = $val;
              }
              for ($k = 1; $k < $n; $k++) {
                  $x = $order[$k];
                  $q = $parent[$x];
                  $other = $c1[$q] == $x ? $d2[$q] : $d1[$q];
                  $up[$x] = $w[$q] + max($up[$q], $other);
              }
              $ans = [];
              for ($z = 0; $z < $n; $z++) $ans[] = max($d1[$z], $up[$z]);
              return $ans;
          }
        `,
        ruby: code`
          def timeTaken(edges)
            n = edges.length + 1
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -2)
            parent[0] = -1
            order = [0]
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v|
                next unless parent[v] == -2
                parent[v] = u
                order << v
              end
            end
            w = Array.new(n) { |i| i.odd? ? 1 : 2 }
            d1 = Array.new(n, 0)
            d2 = Array.new(n, 0)
            c1 = Array.new(n, -1)
            up = Array.new(n, 0)
            (n - 1).downto(1) do |t|
              c = order[t]
              pa = parent[c]
              val = d1[c] + w[c]
              if val > d1[pa]
                d2[pa] = d1[pa]
                d1[pa] = val
                c1[pa] = c
              elsif val > d2[pa]
                d2[pa] = val
              end
            end
            (1...n).each do |k|
              x = order[k]
              q = parent[x]
              other = c1[q] == x ? d2[q] : d1[q]
              up[x] = w[q] + [up[q], other].max
            end
            Array.new(n) { |z| [d1[z], up[z]].max }
          end
        `,
      },
    };
  })(),

  // ── Shortest Distance After Road Addition Queries I (LC 3243) ───
  (() => {
    const ref = (n: number, queries: number[][]) => {
      const out: number[][] = Array.from({ length: n }, (_, i) => (i + 1 < n ? [i + 1] : []));
      return queries.map(([u, v]) => {
        out[u].push(v);
        const dist = new Array(n).fill(-1);
        dist[0] = 0;
        const q = [0];
        for (let h = 0; h < q.length; h++) for (const y of out[q[h]]) if (dist[y] < 0) { dist[y] = dist[q[h]] + 1; q.push(y); }
        return dist[n - 1];
      });
    };
    return {
      slug: "shortest-distance-after-road-addition-queries-i",
      title: "Shortest Distance After Road Addition Queries I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Graph", "Google", "Amazon"],
      signature: { funcName: "shortestDistanceAfterQueries", params: [{ name: "n", type: "int" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` cities numbered `0` to `n - 1`. At the start, the only roads are one-way roads from city `i` to city `i + 1` for every `0 <= i < n - 1`.\n\nEach query `queries[i] = [ui, vi]` adds a new **one-way** road from `ui` to `vi`. Roads are never removed.\n\nReturn an array `answer` where `answer[i]` is the length (number of roads) of the shortest path from city `0` to city `n - 1` after the first `i + 1` queries have been applied.",
        [
          { in: "n = 5, queries = [[2,4],[0,2],[0,4]]", out: "[3,2,1]", note: "After [2,4] the route 0→1→2→4 uses 3 roads; after [0,2] the route 0→2→4 uses 2; after [0,4] one road is enough." },
          { in: "n = 4, queries = [[0,3],[0,2]]", out: "[1,1]", note: "The road 0→3 already gives length 1, and the second road cannot improve on it." },
          { in: "n = 3, queries = [[0,2]]", out: "[1]" },
        ],
        ["3 <= n <= 500", "1 <= queries.length <= 500", "queries[i].length == 2", "0 <= queries[i][0] < queries[i][1] < n", "1 < queries[i][1] - queries[i][0]", "no road is added twice"]),
      hints: [
        "With at most 500 cities and 500 queries you can afford to recompute the shortest path from scratch after every query.",
        "Every road goes from a smaller city to a larger one, so the cities in increasing order are already a topological order of the graph.",
        "Keep each city's outgoing roads in a list. After adding a road, set `dist[0] = 0`, walk the cities in order and relax `dist[y] = min(dist[y], dist[x] + 1)` along every road `x → y` (a BFS works just as well).",
      ],
      editorial: explain({
        idea: "The limits are small enough to rebuild the answer after each query. Because every road points forward, one pass over the cities in increasing order computes all shortest distances from city 0.",
        steps: [
          "Start with `out[i] = [i + 1]` for every city except the last.",
          "For each query `[u, v]`, append `v` to `out[u]`.",
          "Set `dist[0] = 0` and every other entry to infinity; for `x` from 0 to `n - 1`, relax `dist[y]` through each road `x → y`.",
          "Record `dist[n - 1]`.",
        ],
        why: "A road only leads to a larger city, so by the time city `x` is processed every road into it has already been relaxed and `dist[x]` is final — the usual DAG shortest-path argument. Since the original chain is always there, city `n - 1` is always reachable.",
        time: "O(q · (n + q))",
        space: "O(n + q)",
        pitfalls: [
          "Roads are one-way: a query `[u, v]` never helps you travel from `v` back to `u`.",
          "Adding a road can leave the answer unchanged, as in the second example — record the distance after every query anyway.",
        ],
      }),
      examples: [
        { input: "5\n[[2,4],[0,2],[0,4]]", expectedOutput: "[3,2,1]" },
        { input: "4\n[[0,3],[0,2]]", expectedOutput: "[1,1]" },
        { input: "3\n[[0,2]]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 4, 5, 7, 10, 15, 22, 30]);
        const cands: number[][] = [];
        for (let u = 0; u < n; u++) for (let v = u + 2; v < n; v++) cands.push([u, v]);
        shuffle(rng, cands);
        const k = ri(rng, 1, Math.min(cands.length, pick(rng, [2, 6, 15, 30])));
        const queries = cands.slice(0, k);
        return { input: `${n}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(n, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def shortestDistanceAfterQueries(n: int, queries: List[List[int]]) -> List[int]:
              out = [[i + 1] for i in range(n - 1)] + [[]]
              ans = []
              for u, v in queries:
                  out[u].append(v)
                  dist = [n] * n
                  dist[0] = 0
                  for x in range(n):
                      d = dist[x] + 1
                      for y in out[x]:
                          if d < dist[y]:
                              dist[y] = d
                  ans.append(dist[n - 1])
              return ans
        `,
        javascript: code`
          var shortestDistanceAfterQueries = function(n, queries) {
              var out = [];
              for (var i = 0; i < n; i++) out.push(i + 1 < n ? [i + 1] : []);
              var ans = [];
              for (var k = 0; k < queries.length; k++) {
                  out[queries[k][0]].push(queries[k][1]);
                  var dist = [];
                  for (var j = 0; j < n; j++) dist.push(n);
                  dist[0] = 0;
                  for (var x = 0; x < n; x++) {
                      var d = dist[x] + 1;
                      for (var t = 0; t < out[x].length; t++) if (d < dist[out[x][t]]) dist[out[x][t]] = d;
                  }
                  ans.push(dist[n - 1]);
              }
              return ans;
          };
        `,
        typescript: code`
          function shortestDistanceAfterQueries(n: number, queries: number[][]): number[] {
              var out: number[][] = [];
              for (var i = 0; i < n; i++) out.push(i + 1 < n ? [i + 1] : []);
              var ans: number[] = [];
              for (var k = 0; k < queries.length; k++) {
                  out[queries[k][0]].push(queries[k][1]);
                  var dist: number[] = [];
                  for (var j = 0; j < n; j++) dist.push(n);
                  dist[0] = 0;
                  for (var x = 0; x < n; x++) {
                      var d = dist[x] + 1;
                      for (var t = 0; t < out[x].length; t++) if (d < dist[out[x][t]]) dist[out[x][t]] = d;
                  }
                  ans.push(dist[n - 1]);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] shortestDistanceAfterQueries(int n, int[][] queries) {
              List<List<Integer>> out = new ArrayList<>();
              for (int i = 0; i < n; i++) {
                  out.add(new ArrayList<>());
                  if (i + 1 < n) out.get(i).add(i + 1);
              }
              int[] ans = new int[queries.length];
              int[] dist = new int[n];
              for (int k = 0; k < queries.length; k++) {
                  out.get(queries[k][0]).add(queries[k][1]);
                  Arrays.fill(dist, n);
                  dist[0] = 0;
                  for (int x = 0; x < n; x++) {
                      int d = dist[x] + 1;
                      for (int y : out.get(x)) if (d < dist[y]) dist[y] = d;
                  }
                  ans[k] = dist[n - 1];
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> shortestDistanceAfterQueries(int n, vector<vector<int>>& queries) {
              vector<vector<int>> out(n);
              for (int i = 0; i + 1 < n; i++) out[i].push_back(i + 1);
              vector<int> ans, dist(n);
              for (auto& q : queries) {
                  out[q[0]].push_back(q[1]);
                  fill(dist.begin(), dist.end(), n);
                  dist[0] = 0;
                  for (int x = 0; x < n; x++) {
                      int d = dist[x] + 1;
                      for (int y : out[x]) if (d < dist[y]) dist[y] = d;
                  }
                  ans.push_back(dist[n - 1]);
              }
              return ans;
          }
        `,
        c: code`
          int* shortestDistanceAfterQueries(int n, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int cap = n + queriesSize + 1;
              int* head = (int*)malloc(n * sizeof(int));
              int* nxt = (int*)malloc(cap * sizeof(int));
              int* to = (int*)malloc(cap * sizeof(int));
              int cnt = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int i = 0; i + 1 < n; i++) { to[cnt] = i + 1; nxt[cnt] = head[i]; head[i] = cnt++; }
              int* dist = (int*)malloc(n * sizeof(int));
              int* ans = (int*)malloc((queriesSize + 1) * sizeof(int));
              for (int k = 0; k < queriesSize; k++) {
                  int u = queries[k][0];
                  to[cnt] = queries[k][1]; nxt[cnt] = head[u]; head[u] = cnt++;
                  for (int j = 0; j < n; j++) dist[j] = n;
                  dist[0] = 0;
                  for (int x = 0; x < n; x++) {
                      int d = dist[x] + 1;
                      for (int e = head[x]; e != -1; e = nxt[e]) if (d < dist[to[e]]) dist[to[e]] = d;
                  }
                  ans[k] = dist[n - 1];
              }
              free(head); free(nxt); free(to); free(dist);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] ShortestDistanceAfterQueries(int n, int[][] queries)
          {
              var outRoads = new List<int>[n];
              for (int i = 0; i < n; i++)
              {
                  outRoads[i] = new List<int>();
                  if (i + 1 < n) outRoads[i].Add(i + 1);
              }
              var ans = new int[queries.Length];
              var dist = new int[n];
              for (int k = 0; k < queries.Length; k++)
              {
                  outRoads[queries[k][0]].Add(queries[k][1]);
                  for (int j = 0; j < n; j++) dist[j] = n;
                  dist[0] = 0;
                  for (int x = 0; x < n; x++)
                  {
                      int d = dist[x] + 1;
                      foreach (int y in outRoads[x]) if (d < dist[y]) dist[y] = d;
                  }
                  ans[k] = dist[n - 1];
              }
              return ans;
          }
        `,
        go: code`
          func shortestDistanceAfterQueries(n int, queries [][]int) []int {
          	out := make([][]int, n)
          	for i := 0; i+1 < n; i++ {
          		out[i] = append(out[i], i+1)
          	}
          	ans := make([]int, 0, len(queries))
          	dist := make([]int, n)
          	for _, q := range queries {
          		out[q[0]] = append(out[q[0]], q[1])
          		for j := range dist {
          			dist[j] = n
          		}
          		dist[0] = 0
          		for x := 0; x < n; x++ {
          			d := dist[x] + 1
          			for _, y := range out[x] {
          				if d < dist[y] {
          					dist[y] = d
          				}
          			}
          		}
          		ans = append(ans, dist[n-1])
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun shortestDistanceAfterQueries(n: Int, queries: Array<IntArray>): IntArray {
              val out = Array(n) { ArrayList<Int>() }
              for (i in 0 until n - 1) out[i].add(i + 1)
              val ans = IntArray(queries.size)
              val dist = IntArray(n)
              for (k in queries.indices) {
                  out[queries[k][0]].add(queries[k][1])
                  dist.fill(n)
                  dist[0] = 0
                  for (x in 0 until n) {
                      val d = dist[x] + 1
                      for (y in out[x]) if (d < dist[y]) dist[y] = d
                  }
                  ans[k] = dist[n - 1]
              }
              return ans
          }
        `,
        swift: code`
          func shortestDistanceAfterQueries(_ n: Int, _ queries: [[Int]]) -> [Int] {
              var out = [[Int]](repeating: [], count: n)
              for i in 0..<(n - 1) { out[i].append(i + 1) }
              var ans = [Int]()
              var dist = [Int](repeating: n, count: n)
              for q in queries {
                  out[q[0]].append(q[1])
                  for j in 0..<n { dist[j] = n }
                  dist[0] = 0
                  for x in 0..<n {
                      let d = dist[x] + 1
                      for y in out[x] where d < dist[y] { dist[y] = d }
                  }
                  ans.append(dist[n - 1])
              }
              return ans
          }
        `,
        rust: code`
          fn shortestDistanceAfterQueries(n: i32, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut out: Vec<Vec<usize>> = vec![Vec::new(); n];
              for i in 0..n - 1 {
                  out[i].push(i + 1);
              }
              let mut ans = Vec::with_capacity(queries.len());
              let mut dist = vec![0i32; n];
              for q in queries.iter() {
                  out[q[0] as usize].push(q[1] as usize);
                  for j in 0..n {
                      dist[j] = n as i32;
                  }
                  dist[0] = 0;
                  for x in 0..n {
                      let d = dist[x] + 1;
                      for &y in out[x].iter() {
                          if d < dist[y] {
                              dist[y] = d;
                          }
                      }
                  }
                  ans.push(dist[n - 1]);
              }
              ans
          }
        `,
        php: code`
          function shortestDistanceAfterQueries($n, $queries) {
              $out = array_fill(0, $n, []);
              for ($i = 0; $i + 1 < $n; $i++) $out[$i][] = $i + 1;
              $ans = [];
              foreach ($queries as $q) {
                  $out[$q[0]][] = $q[1];
                  $dist = array_fill(0, $n, $n);
                  $dist[0] = 0;
                  for ($x = 0; $x < $n; $x++) {
                      $d = $dist[$x] + 1;
                      foreach ($out[$x] as $y) if ($d < $dist[$y]) $dist[$y] = $d;
                  }
                  $ans[] = $dist[$n - 1];
              }
              return $ans;
          }
        `,
        ruby: code`
          def shortestDistanceAfterQueries(n, queries)
            out = Array.new(n) { |i| i + 1 < n ? [i + 1] : [] }
            queries.map do |u, v|
              out[u] << v
              dist = Array.new(n, n)
              dist[0] = 0
              n.times do |x|
                d = dist[x] + 1
                out[x].each { |y| dist[y] = d if d < dist[y] }
              end
              dist[n - 1]
            end
          end
        `,
      },
    };
  })(),

  // ── Shortest Distance After Road Addition Queries II (LC 3244) ──
  (() => {
    const ref = (n: number, queries: number[][]) => {
      const out: number[][] = Array.from({ length: n }, (_, i) => (i + 1 < n ? [i + 1] : []));
      return queries.map(([u, v]) => {
        out[u].push(v);
        const dist = new Array(n).fill(-1);
        dist[0] = 0;
        const q = [0];
        for (let h = 0; h < q.length; h++) for (const y of out[q[h]]) if (dist[y] < 0) { dist[y] = dist[q[h]] + 1; q.push(y); }
        return dist[n - 1];
      });
    };
    /** Random roads with no two crossing (never a < c < b < d) and none repeated. */
    const laminar = (rng: Rng, n: number, want: number) => {
      const got: number[][] = [];
      for (let attempt = 0; attempt < want * 6 && got.length < want; attempt++) {
        const u = ri(rng, 0, n - 3);
        const v = ri(rng, u + 2, n - 1);
        let ok = true;
        for (const [a, b] of got) {
          if ((a === u && b === v) || (a < u && u < b && b < v) || (u < a && a < v && v < b)) { ok = false; break; }
        }
        if (ok) got.push([u, v]);
      }
      return got;
    };
    return {
      slug: "shortest-distance-after-road-addition-queries-ii",
      title: "Shortest Distance After Road Addition Queries II",
      difficulty: "HARD" as const,
      tags: ["Array", "Graph", "Ordered Set", "Google"],
      signature: { funcName: "shortestDistanceAfterQueries", params: [{ name: "n", type: "int" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` cities numbered `0` to `n - 1`. At the start, the only roads are one-way roads from city `i` to city `i + 1` for every `0 <= i < n - 1`.\n\nEach query `queries[i] = [ui, vi]` adds a new **one-way** road from `ui` to `vi`. The queries never cross each other: there are no two queries `i` and `j` with `queries[i][0] < queries[j][0] < queries[i][1] < queries[j][1]`.\n\nReturn an array `answer` where `answer[i]` is the length (number of roads) of the shortest path from city `0` to city `n - 1` after the first `i + 1` queries have been applied.",
        [
          { in: "n = 5, queries = [[2,4],[0,2],[0,4]]", out: "[3,2,1]", note: "The shortest route becomes 0→1→2→4, then 0→2→4, then 0→4." },
          { in: "n = 4, queries = [[0,3],[0,2]]", out: "[1,1]", note: "The road 0→2 lies inside the stretch 0→3 already skips, so it changes nothing." },
          { in: "n = 6, queries = [[1,3],[3,5],[0,5]]", out: "[4,3,1]" },
        ],
        ["3 <= n <= 10^5", "1 <= queries.length <= 10^5", "queries[i].length == 2", "0 <= queries[i][0] < queries[i][1] < n", "1 < queries[i][1] - queries[i][0]", "no road is added twice", "no two queries cross as described above"]),
      hints: [
        "Because the new roads never cross, two roads are either disjoint or one lies entirely inside the other. A road nested inside a stretch that is already skipped can never help.",
        "So the shortest path is always the chain of cities that have not been jumped over yet. Keep, for every city on that chain, the next city on it.",
        "For a query `[u, v]`: if `u` is still on the chain and its next city is before `v`, remove every city strictly between `u` and `v` (each city is removed at most once) and point `u` at `v`. The answer is the number of roads left on the chain.",
      ],
      editorial: explain({
        idea: "Non-crossing roads make the best route a single forward chain: once a stretch is skipped, everything nested inside it is irrelevant. Maintain that chain as a linked list of `next` pointers and count its roads; each city leaves the chain at most once, so all queries together cost linear time.",
        steps: [
          "Set `next[i] = i + 1` for every city and `roads = n - 1`.",
          "For a query `[u, v]`: if `u` has been removed (`next[u] = -1`) or `next[u] >= v`, the road changes nothing.",
          "Otherwise walk `i = next[u]` while `i < v`: remember `next[i]`, mark `next[i] = -1`, decrement `roads`, move on. Then set `next[u] = v`.",
          "Append `roads` to the answer.",
        ],
        why: "Induction on the queries: the chain always holds the shortest route, and every skipped city lies strictly inside some road on the chain. A new road whose start was skipped lies inside that skipping road (crossing is forbidden), so it cannot shorten anything. A road from a chain city `u` lands on a chain city `v` for the same reason, so replacing the cities between them with one road is exactly the improvement it brings.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "A road starting at a removed city must be ignored — following its stale `next` pointer would corrupt the chain.",
          "If `next[u]` is already at or beyond `v`, the new road is shorter than one already used; do nothing.",
          "Recomputing a BFS per query, as in part I, is O(q · n) and too slow at 10^5.",
        ],
      }),
      examples: [
        { input: "5\n[[2,4],[0,2],[0,4]]", expectedOutput: "[3,2,1]" },
        { input: "4\n[[0,3],[0,2]]", expectedOutput: "[1,1]" },
        { input: "6\n[[1,3],[3,5],[0,5]]", expectedOutput: "[4,3,1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 4, 5, 7, 10, 15, 22, 30, 40]);
        const queries = shuffle(rng, laminar(rng, n, ri(rng, 1, pick(rng, [2, 5, 12, 30]))));
        return { input: `${n}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(n, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def shortestDistanceAfterQueries(n: int, queries: List[List[int]]) -> List[int]:
              nxt = list(range(1, n + 1))
              roads = n - 1
              ans = []
              for u, v in queries:
                  if nxt[u] != -1 and nxt[u] < v:
                      i = nxt[u]
                      while i < v:
                          j = nxt[i]
                          nxt[i] = -1
                          roads -= 1
                          i = j
                      nxt[u] = v
                  ans.append(roads)
              return ans
        `,
        javascript: code`
          var shortestDistanceAfterQueries = function(n, queries) {
              var nxt = [];
              for (var i = 0; i < n; i++) nxt.push(i + 1);
              var roads = n - 1;
              var ans = [];
              for (var k = 0; k < queries.length; k++) {
                  var u = queries[k][0], v = queries[k][1];
                  if (nxt[u] !== -1 && nxt[u] < v) {
                      var x = nxt[u];
                      while (x < v) {
                          var y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans.push(roads);
              }
              return ans;
          };
        `,
        typescript: code`
          function shortestDistanceAfterQueries(n: number, queries: number[][]): number[] {
              var nxt: number[] = [];
              for (var i = 0; i < n; i++) nxt.push(i + 1);
              var roads = n - 1;
              var ans: number[] = [];
              for (var k = 0; k < queries.length; k++) {
                  var u = queries[k][0], v = queries[k][1];
                  if (nxt[u] !== -1 && nxt[u] < v) {
                      var x = nxt[u];
                      while (x < v) {
                          var y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans.push(roads);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] shortestDistanceAfterQueries(int n, int[][] queries) {
              int[] nxt = new int[n];
              for (int i = 0; i < n; i++) nxt[i] = i + 1;
              int roads = n - 1;
              int[] ans = new int[queries.length];
              for (int k = 0; k < queries.length; k++) {
                  int u = queries[k][0], v = queries[k][1];
                  if (nxt[u] != -1 && nxt[u] < v) {
                      int x = nxt[u];
                      while (x < v) {
                          int y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans[k] = roads;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> shortestDistanceAfterQueries(int n, vector<vector<int>>& queries) {
              vector<int> nxt(n);
              for (int i = 0; i < n; i++) nxt[i] = i + 1;
              int roads = n - 1;
              vector<int> ans;
              for (auto& q : queries) {
                  int u = q[0], v = q[1];
                  if (nxt[u] != -1 && nxt[u] < v) {
                      int x = nxt[u];
                      while (x < v) {
                          int y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans.push_back(roads);
              }
              return ans;
          }
        `,
        c: code`
          int* shortestDistanceAfterQueries(int n, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* nxt = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) nxt[i] = i + 1;
              int roads = n - 1;
              int* ans = (int*)malloc((queriesSize + 1) * sizeof(int));
              for (int k = 0; k < queriesSize; k++) {
                  int u = queries[k][0], v = queries[k][1];
                  if (nxt[u] != -1 && nxt[u] < v) {
                      int x = nxt[u];
                      while (x < v) {
                          int y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans[k] = roads;
              }
              free(nxt);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] ShortestDistanceAfterQueries(int n, int[][] queries)
          {
              var nxt = new int[n];
              for (int i = 0; i < n; i++) nxt[i] = i + 1;
              int roads = n - 1;
              var ans = new int[queries.Length];
              for (int k = 0; k < queries.Length; k++)
              {
                  int u = queries[k][0], v = queries[k][1];
                  if (nxt[u] != -1 && nxt[u] < v)
                  {
                      int x = nxt[u];
                      while (x < v)
                      {
                          int y = nxt[x];
                          nxt[x] = -1;
                          roads--;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans[k] = roads;
              }
              return ans;
          }
        `,
        go: code`
          func shortestDistanceAfterQueries(n int, queries [][]int) []int {
          	nxt := make([]int, n)
          	for i := range nxt {
          		nxt[i] = i + 1
          	}
          	roads := n - 1
          	ans := make([]int, 0, len(queries))
          	for _, q := range queries {
          		u, v := q[0], q[1]
          		if nxt[u] != -1 && nxt[u] < v {
          			x := nxt[u]
          			for x < v {
          				y := nxt[x]
          				nxt[x] = -1
          				roads--
          				x = y
          			}
          			nxt[u] = v
          		}
          		ans = append(ans, roads)
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun shortestDistanceAfterQueries(n: Int, queries: Array<IntArray>): IntArray {
              val nxt = IntArray(n) { it + 1 }
              var roads = n - 1
              val ans = IntArray(queries.size)
              for (k in queries.indices) {
                  val u = queries[k][0]
                  val v = queries[k][1]
                  if (nxt[u] != -1 && nxt[u] < v) {
                      var x = nxt[u]
                      while (x < v) {
                          val y = nxt[x]
                          nxt[x] = -1
                          roads--
                          x = y
                      }
                      nxt[u] = v
                  }
                  ans[k] = roads
              }
              return ans
          }
        `,
        swift: code`
          func shortestDistanceAfterQueries(_ n: Int, _ queries: [[Int]]) -> [Int] {
              var nxt = [Int](repeating: 0, count: n)
              for i in 0..<n { nxt[i] = i + 1 }
              var roads = n - 1
              var ans = [Int]()
              for q in queries {
                  let u = q[0], v = q[1]
                  if nxt[u] != -1 && nxt[u] < v {
                      var x = nxt[u]
                      while x < v {
                          let y = nxt[x]
                          nxt[x] = -1
                          roads -= 1
                          x = y
                      }
                      nxt[u] = v
                  }
                  ans.append(roads)
              }
              return ans
          }
        `,
        rust: code`
          fn shortestDistanceAfterQueries(n: i32, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let mut nxt: Vec<i32> = (1..=n).collect();
              let mut roads = n - 1;
              let mut ans = Vec::with_capacity(queries.len());
              for q in queries.iter() {
                  let u = q[0] as usize;
                  let v = q[1];
                  if nxt[u] != -1 && nxt[u] < v {
                      let mut x = nxt[u];
                      while x < v {
                          let y = nxt[x as usize];
                          nxt[x as usize] = -1;
                          roads -= 1;
                          x = y;
                      }
                      nxt[u] = v;
                  }
                  ans.push(roads);
              }
              ans
          }
        `,
        php: code`
          function shortestDistanceAfterQueries($n, $queries) {
              $nxt = [];
              for ($i = 0; $i < $n; $i++) $nxt[] = $i + 1;
              $roads = $n - 1;
              $ans = [];
              foreach ($queries as $q) {
                  $u = $q[0];
                  $v = $q[1];
                  if ($nxt[$u] != -1 && $nxt[$u] < $v) {
                      $x = $nxt[$u];
                      while ($x < $v) {
                          $y = $nxt[$x];
                          $nxt[$x] = -1;
                          $roads--;
                          $x = $y;
                      }
                      $nxt[$u] = $v;
                  }
                  $ans[] = $roads;
              }
              return $ans;
          }
        `,
        ruby: code`
          def shortestDistanceAfterQueries(n, queries)
            nxt = Array.new(n) { |i| i + 1 }
            roads = n - 1
            queries.map do |u, v|
              if nxt[u] != -1 && nxt[u] < v
                x = nxt[u]
                while x < v
                  y = nxt[x]
                  nxt[x] = -1
                  roads -= 1
                  x = y
                end
                nxt[u] = v
              end
              roads
            end
          end
        `,
      },
    };
  })(),

  // ── Count the Number of Good Nodes (LC 3249) ────────────────────
  (() => {
    const ref = (edges: number[][]) => {
      const n = edges.length + 1;
      const adj = adjOf(n, edges);
      const { parent } = rooted(adj, 0);
      const sizeOf = (u: number, from: number): number => {
        let s = 1;
        for (const v of adj[u]) if (v !== from) s += sizeOf(v, u);
        return s;
      };
      let good = 0;
      for (let u = 0; u < n; u++) {
        const sizes = adj[u].filter((v) => v !== parent[u]).map((v) => sizeOf(v, u));
        if (sizes.every((s) => s === sizes[0])) good++;
      }
      return good;
    };
    return {
      slug: "count-the-number-of-good-nodes",
      title: "Count the Number of Good Nodes",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "countGoodNodes", params: [{ name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1` and is **rooted at node `0`**. Its `n - 1` edges are given in `edges`, each `[ai, bi]`.\n\nA node is **good** if all the subtrees rooted at its children have the same size (number of nodes). A leaf has no children, so it is always good.\n\nReturn the number of good nodes in the tree.",
        [
          { in: "edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]", out: "7", note: "Every node is good: node 0's two child subtrees both have 3 nodes, nodes 1 and 2 each have two leaf children, and the leaves are good." },
          { in: "edges = [[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8]]", out: "6", note: "Nodes 1, 2 and 3 have children of different subtree sizes; the other six are good." },
          { in: "edges = [[0,1],[1,2],[1,3],[1,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[9,12],[10,11]]", out: "12", note: "Only node 9 is not good: its children's subtrees have sizes 2 and 1." },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= ai, bi < n", "the input is a valid tree"]),
      hints: [
        "Whether a node is good depends only on the sizes of its children's subtrees, so compute every subtree size first.",
        "Subtree sizes come from one bottom-up pass: process nodes children-before-parents and add each node's size to its parent's.",
        "Then, for each node, compare the sizes of its children (all neighbours except the parent) with the first child's size.",
      ],
      editorial: explain({
        idea: "Compute every subtree size once, then check each node's children against each other. Each edge is looked at a constant number of times, so the whole thing is linear.",
        steps: [
          "Build adjacency lists and a BFS order from the root 0, recording each node's parent.",
          "Walk the BFS order backwards, adding `size[u]` to `size[parent[u]]` (every size starts at 1).",
          "For each node, scan its neighbours other than the parent; it is good if every such child has the same size as the first one (a leaf passes trivially).",
          "Return the count of good nodes.",
        ],
        why: "In reverse BFS order every child is finished before its parent, so `size` is exact when it is used. The goodness test is the definition applied directly.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The parent is a neighbour too — skip it, or the root's sizes get mixed with the whole tree's.",
          "A node with a single child is always good: one size is trivially equal to itself.",
          "Recursion over a long path can overflow the stack; the BFS order avoids it.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]", expectedOutput: "7" },
        { input: "[[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8]]", expectedOutput: "6" },
        { input: "[[0,1],[1,2],[1,3],[1,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[9,12],[10,11]]", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 7, 9, 13, 20, 30]);
        let edges: number[][];
        if (rng() < 0.3) {
          // A perfect-ish tree: every node gets the same number of children, so most nodes are good.
          const b = ri(rng, 1, 3);
          edges = [];
          for (let i = 1; i < n; i++) edges.push([Math.floor((i - 1) / b), i]);
          shuffle(rng, edges);
        } else edges = randTree(rng, n);
        return { input: fmtIntMat(edges), expectedOutput: String(ref(edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countGoodNodes(edges: List[List[int]]) -> int:
              n = len(edges) + 1
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-2] * n
              parent[0] = -1
              order = [0]
              for u in order:
                  for v in adj[u]:
                      if parent[v] == -2:
                          parent[v] = u
                          order.append(v)
              size = [1] * n
              for u in reversed(order):
                  if parent[u] >= 0:
                      size[parent[u]] += size[u]
              good = 0
              for u in range(n):
                  first = -1
                  ok = True
                  for v in adj[u]:
                      if v == parent[u]:
                          continue
                      if first == -1:
                          first = size[v]
                      elif size[v] != first:
                          ok = False
                          break
                  if ok:
                      good += 1
              return good
        `,
        javascript: code`
          var countGoodNodes = function(edges) {
              var n = edges.length + 1;
              var adj = [], parent = [], size = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); size.push(1); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              for (var t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              var good = 0;
              for (var x = 0; x < n; x++) {
                  var first = -1, ok = true;
                  for (var k = 0; k < adj[x].length; k++) {
                      var c = adj[x][k];
                      if (c === parent[x]) continue;
                      if (first === -1) first = size[c];
                      else if (size[c] !== first) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              return good;
          };
        `,
        typescript: code`
          function countGoodNodes(edges: number[][]): number {
              var n = edges.length + 1;
              var adj: number[][] = [], parent: number[] = [], size: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); size.push(1); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              for (var t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              var good = 0;
              for (var x = 0; x < n; x++) {
                  var first = -1, ok = true;
                  for (var k = 0; k < adj[x].length; k++) {
                      var c = adj[x][k];
                      if (c === parent[x]) continue;
                      if (first === -1) first = size[c];
                      else if (size[c] !== first) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              return good;
          }
        `,
        java: code`
          public static int countGoodNodes(int[][] edges) {
              int n = edges.length + 1;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n], size = new int[n];
              Arrays.fill(parent, -2);
              Arrays.fill(size, 1);
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int v : adj.get(u)) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              for (int t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              int good = 0;
              for (int x = 0; x < n; x++) {
                  int first = -1;
                  boolean ok = true;
                  for (int c : adj.get(x)) {
                      if (c == parent[x]) continue;
                      if (first == -1) first = size[c];
                      else if (size[c] != first) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              return good;
          }
        `,
        cpp: code`
          int countGoodNodes(vector<vector<int>>& edges) {
              int n = edges.size() + 1;
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -2), size(n, 1), order;
              parent[0] = -1;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (parent[v] == -2) { parent[v] = u; order.push_back(v); }
              }
              for (int t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              int good = 0;
              for (int x = 0; x < n; x++) {
                  int first = -1;
                  bool ok = true;
                  for (int c : adj[x]) {
                      if (c == parent[x]) continue;
                      if (first == -1) first = size[c];
                      else if (size[c] != first) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              return good;
          }
        `,
        c: code`
          int countGoodNodes(int** edges, int edgesSize, int* edgesColSize) {
              int n = edgesSize + 1;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0] + 1]++; first[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* parent = (int*)malloc(n * sizeof(int));
              int* order = (int*)malloc(n * sizeof(int));
              int* size = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) { parent[i] = -2; size[i] = 1; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
                  }
              }
              for (int t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              int good = 0;
              for (int x = 0; x < n; x++) {
                  int want = -1;
                  bool ok = true;
                  for (int k = first[x]; k < first[x + 1]; k++) {
                      int c = adj[k];
                      if (c == parent[x]) continue;
                      if (want == -1) want = size[c];
                      else if (size[c] != want) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              free(first); free(fill); free(adj); free(parent); free(order); free(size);
              return good;
          }
        `,
        csharp: code`
          public static int CountGoodNodes(int[][] edges)
          {
              int n = edges.Length + 1;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], order = new int[n], size = new int[n];
              for (int i = 0; i < n; i++) { parent[i] = -2; size[i] = 1; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
              {
                  int u = order[h];
                  foreach (int v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              for (int t = n - 1; t > 0; t--) size[parent[order[t]]] += size[order[t]];
              int good = 0;
              for (int x = 0; x < n; x++)
              {
                  int first = -1;
                  bool ok = true;
                  foreach (int c in adj[x])
                  {
                      if (c == parent[x]) continue;
                      if (first == -1) first = size[c];
                      else if (size[c] != first) { ok = false; break; }
                  }
                  if (ok) good++;
              }
              return good;
          }
        `,
        go: code`
          func countGoodNodes(edges [][]int) int {
          	n := len(edges) + 1
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	parent := make([]int, n)
          	size := make([]int, n)
          	for i := 0; i < n; i++ {
          		parent[i] = -2
          		size[i] = 1
          	}
          	parent[0] = -1
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		u := order[h]
          		for _, v := range adj[u] {
          			if parent[v] == -2 {
          				parent[v] = u
          				order = append(order, v)
          			}
          		}
          	}
          	for t := n - 1; t > 0; t-- {
          		size[parent[order[t]]] += size[order[t]]
          	}
          	good := 0
          	for x := 0; x < n; x++ {
          		first := -1
          		ok := true
          		for _, c := range adj[x] {
          			if c == parent[x] {
          				continue
          			}
          			if first == -1 {
          				first = size[c]
          			} else if size[c] != first {
          				ok = false
          				break
          			}
          		}
          		if ok {
          			good++
          		}
          	}
          	return good
          }
        `,
        kotlin: code`
          fun countGoodNodes(edges: Array<IntArray>): Int {
              val n = edges.size + 1
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -2 }
              val size = IntArray(n) { 1 }
              val order = IntArray(n)
              parent[0] = -1
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  val u = order[h++]
                  for (v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v }
              }
              for (t in n - 1 downTo 1) size[parent[order[t]]] += size[order[t]]
              var good = 0
              for (x in 0 until n) {
                  var first = -1
                  var ok = true
                  for (c in adj[x]) {
                      if (c == parent[x]) continue
                      if (first == -1) first = size[c]
                      else if (size[c] != first) { ok = false; break }
                  }
                  if (ok) good++
              }
              return good
          }
        `,
        swift: code`
          func countGoodNodes(_ edges: [[Int]]) -> Int {
              let n = edges.count + 1
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -2, count: n)
              var size = [Int](repeating: 1, count: n)
              parent[0] = -1
              var order = [0]
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for v in adj[u] where parent[v] == -2 {
                      parent[v] = u
                      order.append(v)
                  }
              }
              var t = n - 1
              while t > 0 {
                  size[parent[order[t]]] += size[order[t]]
                  t -= 1
              }
              var good = 0
              for x in 0..<n {
                  var first = -1
                  var ok = true
                  for c in adj[x] where c != parent[x] {
                      if first == -1 { first = size[c] }
                      else if size[c] != first { ok = false; break }
                  }
                  if ok { good += 1 }
              }
              return good
          }
        `,
        rust: code`
          fn countGoodNodes(edges: Vec<Vec<i32>>) -> i32 {
              let n = edges.len() + 1;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let none = std::usize::MAX;
              let mut parent = vec![none; n];
              let mut seen = vec![false; n];
              seen[0] = true;
              let mut order: Vec<usize> = vec![0];
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
              let mut size = vec![1i32; n];
              for t in (1..n).rev() {
                  let u = order[t];
                  size[parent[u]] += size[u];
              }
              let mut good = 0;
              for x in 0..n {
                  let mut first = -1;
                  let mut ok = true;
                  for &c in adj[x].iter() {
                      if c == parent[x] {
                          continue;
                      }
                      if first == -1 {
                          first = size[c];
                      } else if size[c] != first {
                          ok = false;
                          break;
                      }
                  }
                  if ok {
                      good += 1;
                  }
              }
              good
          }
        `,
        php: code`
          function countGoodNodes($edges) {
              $n = count($edges) + 1;
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -2);
              $size = array_fill(0, $n, 1);
              $parent[0] = -1;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) if ($parent[$v] == -2) { $parent[$v] = $u; $order[] = $v; }
              }
              for ($t = $n - 1; $t > 0; $t--) $size[$parent[$order[$t]]] += $size[$order[$t]];
              $good = 0;
              for ($x = 0; $x < $n; $x++) {
                  $first = -1;
                  $ok = true;
                  foreach ($adj[$x] as $c) {
                      if ($c == $parent[$x]) continue;
                      if ($first == -1) $first = $size[$c];
                      elseif ($size[$c] != $first) { $ok = false; break; }
                  }
                  if ($ok) $good++;
              }
              return $good;
          }
        `,
        ruby: code`
          def countGoodNodes(edges)
            n = edges.length + 1
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -2)
            parent[0] = -1
            order = [0]
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v|
                next unless parent[v] == -2
                parent[v] = u
                order << v
              end
            end
            size = Array.new(n, 1)
            (n - 1).downto(1) { |t| size[parent[order[t]]] += size[order[t]] }
            good = 0
            n.times do |x|
              first = -1
              ok = true
              adj[x].each do |c|
                next if c == parent[x]
                if first == -1
                  first = size[c]
                elsif size[c] != first
                  ok = false
                  break
                end
              end
              good += 1 if ok
            end
            good
          end
        `,
      },
    };
  })(),

  // ── Find a Safe Walk Through a Grid (LC 3286) ───────────────────
  (() => {
    const ref = (grid: number[][], health: number) => {
      const m = grid.length, n = grid[0].length;
      const best = grid.map((row) => row.map(() => Infinity));
      best[0][0] = grid[0][0];
      for (let changed = true; changed;) {
        changed = false;
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const pr = r + dr, pc = c + dc;
            if (pr < 0 || pr >= m || pc < 0 || pc >= n) continue;
            if (best[pr][pc] + grid[r][c] < best[r][c]) { best[r][c] = best[pr][pc] + grid[r][c]; changed = true; }
          }
        }
      }
      return health - best[m - 1][n - 1] >= 1;
    };
    return {
      slug: "find-a-safe-walk-through-a-grid",
      title: "Find a Safe Walk Through a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Graph", "Heap (Priority Queue)", "Matrix", "Shortest Path", "Google"],
      signature: { funcName: "findSafeWalk", params: [{ name: "grid", type: "int[][]" as const }, { name: "health", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given an `m x n` binary matrix `grid` and an integer `health`.\n\nYou start in the top-left cell `(0, 0)` and want to reach the bottom-right cell `(m - 1, n - 1)`, moving one step at a time up, down, left or right, never leaving the grid. A cell with `grid[i][j] = 1` is unsafe: every time you are in it — including the start and the destination — your health drops by 1.\n\nReturn `true` if you can reach the destination with health **at least 1**, and `false` otherwise.",
        [
          { in: "grid = [[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]], health = 1", out: "true", note: "Go down the left column, along the bottom to the middle, up and around through the top-right: every cell on that route is 0." },
          { in: "grid = [[0,1,1,0,0,0],[1,0,1,0,0,0],[0,1,1,1,0,1],[0,0,1,0,1,0]], health = 3", out: "false", note: "Every route crosses at least three unsafe cells, which would bring health to 0." },
          { in: "grid = [[1,1,1],[1,0,1],[1,1,1]], health = 5", out: "true", note: "Any shortest route steps on four unsafe cells (the start and the end included), leaving health 1." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "2 <= m * n", "1 <= health <= m + n", "grid[i][j] is 0 or 1"]),
      hints: [
        "Only the number of unsafe cells on the route matters, not its length — so find the route that visits the fewest 1-cells.",
        "That is a shortest path where entering a cell costs `grid[i][j]` (0 or 1), and the start cell's own value counts too.",
        "With edge weights 0 and 1, a 0-1 BFS (or Dijkstra) finds the minimum cost; the walk is safe exactly when that cost is less than `health`.",
      ],
      editorial: explain({
        idea: "Treat each cell's value as the price of standing in it. The best route minimises the total price, which is a shortest-path problem with weights 0 and 1, solved by 0-1 BFS in linear time.",
        steps: [
          "Set `cost[0][0] = grid[0][0]` and process cells level by level: the current level holds cells reached at cost `d`.",
          "From a cell at cost `d`, a neighbour costs `d + grid[neighbour]`. If that improves it, a 0-neighbour joins the current level and a 1-neighbour the next level.",
          "Move to the next level when the current one is exhausted.",
          "Return `cost[m - 1][n - 1] < health`.",
        ],
        why: "Processing costs in increasing order is Dijkstra's invariant: a cell taken from level `d` cannot be improved by anything processed later, because every later cell already costs at least `d` and edges never have negative weight. Two buckets are enough because an edge adds at most 1.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "The start and the destination count — a grid whose corner is 1 already costs health there.",
          "Health must stay **at least 1**, so the condition is `cost < health`, not `cost <= health`.",
          "A plain BFS counting steps finds the shortest route, not the safest one.",
        ],
      }),
      examples: [
        { input: "[[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]\n1", expectedOutput: "true" },
        { input: "[[0,1,1,0,0,0],[1,0,1,0,0,0],[0,1,1,1,0,1],[0,0,1,0,1,0]]\n3", expectedOutput: "false" },
        { input: "[[1,1,1],[1,0,1],[1,1,1]]\n5", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let m = ri(rng, 1, pick(rng, [2, 4, 7]));
        const n = ri(rng, 1, pick(rng, [2, 4, 7]));
        if (m * n < 2) m = 2;
        const p = pick(rng, [0, 0.2, 0.4, 0.6, 1]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        const health = ri(rng, 1, m + n);
        return { input: `${fmtIntMat(grid)}\n${health}`, expectedOutput: String(ref(grid, health)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findSafeWalk(grid: List[List[int]], health: int) -> bool:
              m, n = len(grid), len(grid[0])
              total = m * n
              cost = [total + 1] * total
              cost[0] = grid[0][0]
              cur = [0]
              d = cost[0]
              while cur:
                  nxt = []
                  i = 0
                  while i < len(cur):
                      x = cur[i]
                      i += 1
                      if cost[x] != d:
                          continue
                      r, c = divmod(x, n)
                      for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                          if 0 <= nr < m and 0 <= nc < n:
                              y = nr * n + nc
                              nd = d + grid[nr][nc]
                              if nd < cost[y]:
                                  cost[y] = nd
                                  (cur if grid[nr][nc] == 0 else nxt).append(y)
                  cur = nxt
                  d += 1
              return cost[total - 1] < health
        `,
        javascript: code`
          var findSafeWalk = function(grid, health) {
              var m = grid.length, n = grid[0].length, total = m * n;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var cost = [];
              for (var i = 0; i < total; i++) cost.push(total + 1);
              cost[0] = grid[0][0];
              var cur = [0], d = cost[0];
              while (cur.length > 0) {
                  var next = [];
                  for (var h = 0; h < cur.length; h++) {
                      var x = cur[h];
                      if (cost[x] !== d) continue;
                      var r = Math.floor(x / n), c = x % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          var y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y]) {
                              cost[y] = nd;
                              if (grid[nr][nc] === 0) cur.push(y); else next.push(y);
                          }
                      }
                  }
                  cur = next;
                  d++;
              }
              return cost[total - 1] < health;
          };
        `,
        typescript: code`
          function findSafeWalk(grid: number[][], health: number): boolean {
              var m = grid.length, n = grid[0].length, total = m * n;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var cost: number[] = [];
              for (var i = 0; i < total; i++) cost.push(total + 1);
              cost[0] = grid[0][0];
              var cur: number[] = [0], d = cost[0];
              while (cur.length > 0) {
                  var next: number[] = [];
                  for (var h = 0; h < cur.length; h++) {
                      var x = cur[h];
                      if (cost[x] !== d) continue;
                      var r = Math.floor(x / n), c = x % n;
                      for (var k = 0; k < 4; k++) {
                          var nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          var y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y]) {
                              cost[y] = nd;
                              if (grid[nr][nc] === 0) cur.push(y); else next.push(y);
                          }
                      }
                  }
                  cur = next;
                  d++;
              }
              return cost[total - 1] < health;
          }
        `,
        java: code`
          public static boolean findSafeWalk(int[][] grid, int health) {
              int m = grid.length, n = grid[0].length, total = m * n;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              int[] cost = new int[total];
              Arrays.fill(cost, total + 1);
              cost[0] = grid[0][0];
              int[] cur = new int[total + 1], next = new int[total + 1];
              int curLen = 0;
              cur[curLen++] = 0;
              int d = cost[0];
              while (curLen > 0) {
                  int nextLen = 0;
                  for (int h = 0; h < curLen; h++) {
                      int x = cur[h];
                      if (cost[x] != d) continue;
                      int r = x / n, c = x % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y]) {
                              cost[y] = nd;
                              if (grid[nr][nc] == 0) cur[curLen++] = y; else next[nextLen++] = y;
                          }
                      }
                  }
                  int[] t = cur; cur = next; next = t;
                  curLen = nextLen;
                  d++;
              }
              return cost[total - 1] < health;
          }
        `,
        cpp: code`
          bool findSafeWalk(vector<vector<int>>& grid, int health) {
              int m = grid.size(), n = grid[0].size(), total = m * n;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              vector<int> cost(total, total + 1);
              cost[0] = grid[0][0];
              vector<int> cur = {0};
              int d = cost[0];
              while (!cur.empty()) {
                  vector<int> next;
                  for (size_t h = 0; h < cur.size(); h++) {
                      int x = cur[h];
                      if (cost[x] != d) continue;
                      int r = x / n, c = x % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y]) {
                              cost[y] = nd;
                              if (grid[nr][nc] == 0) cur.push_back(y); else next.push_back(y);
                          }
                      }
                  }
                  cur.swap(next);
                  d++;
              }
              return cost[total - 1] < health;
          }
        `,
        c: code`
          bool findSafeWalk(int** grid, int gridSize, int* gridColSize, int health) {
              int m = gridSize, n = gridColSize[0], total = m * n;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              int* cost = (int*)malloc(total * sizeof(int));
              for (int i = 0; i < total; i++) cost[i] = total + 1;
              cost[0] = grid[0][0];
              int* cur = (int*)malloc((total + 1) * sizeof(int));
              int* next = (int*)malloc((total + 1) * sizeof(int));
              int curLen = 0;
              cur[curLen++] = 0;
              int d = cost[0];
              while (curLen > 0) {
                  int nextLen = 0;
                  for (int h = 0; h < curLen; h++) {
                      int x = cur[h];
                      if (cost[x] != d) continue;
                      int r = x / n, c = x % n;
                      for (int k = 0; k < 4; k++) {
                          int nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y]) {
                              cost[y] = nd;
                              if (grid[nr][nc] == 0) cur[curLen++] = y; else next[nextLen++] = y;
                          }
                      }
                  }
                  int* t = cur; cur = next; next = t;
                  curLen = nextLen;
                  d++;
              }
              bool ok = cost[total - 1] < health;
              free(cost); free(cur); free(next);
              return ok;
          }
        `,
        csharp: code`
          public static bool FindSafeWalk(int[][] grid, int health)
          {
              int m = grid.Length, n = grid[0].Length, total = m * n;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              var cost = new int[total];
              for (int i = 0; i < total; i++) cost[i] = total + 1;
              cost[0] = grid[0][0];
              var cur = new List<int> { 0 };
              int d = cost[0];
              while (cur.Count > 0)
              {
                  var next = new List<int>();
                  for (int h = 0; h < cur.Count; h++)
                  {
                      int x = cur[h];
                      if (cost[x] != d) continue;
                      int r = x / n, c = x % n;
                      for (int k = 0; k < 4; k++)
                      {
                          int nr = r + DR[k], nc = c + DC[k];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int y = nr * n + nc, nd = d + grid[nr][nc];
                          if (nd < cost[y])
                          {
                              cost[y] = nd;
                              if (grid[nr][nc] == 0) cur.Add(y); else next.Add(y);
                          }
                      }
                  }
                  cur = next;
                  d++;
              }
              return cost[total - 1] < health;
          }
        `,
        go: code`
          func findSafeWalk(grid [][]int, health int) bool {
          	m, n := len(grid), len(grid[0])
          	total := m * n
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	cost := make([]int, total)
          	for i := range cost {
          		cost[i] = total + 1
          	}
          	cost[0] = grid[0][0]
          	cur := []int{0}
          	d := cost[0]
          	for len(cur) > 0 {
          		next := []int{}
          		for h := 0; h < len(cur); h++ {
          			x := cur[h]
          			if cost[x] != d {
          				continue
          			}
          			r, c := x/n, x%n
          			for k := 0; k < 4; k++ {
          				nr, nc := r+DR[k], c+DC[k]
          				if nr < 0 || nr >= m || nc < 0 || nc >= n {
          					continue
          				}
          				y, nd := nr*n+nc, d+grid[nr][nc]
          				if nd < cost[y] {
          					cost[y] = nd
          					if grid[nr][nc] == 0 {
          						cur = append(cur, y)
          					} else {
          						next = append(next, y)
          					}
          				}
          			}
          		}
          		cur = next
          		d++
          	}
          	return cost[total-1] < health
          }
        `,
        kotlin: code`
          fun findSafeWalk(grid: Array<IntArray>, health: Int): Boolean {
              val m = grid.size
              val n = grid[0].size
              val total = m * n
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              val cost = IntArray(total) { total + 1 }
              cost[0] = grid[0][0]
              var cur = ArrayList<Int>()
              cur.add(0)
              var d = cost[0]
              while (cur.isNotEmpty()) {
                  val next = ArrayList<Int>()
                  var h = 0
                  while (h < cur.size) {
                      val x = cur[h++]
                      if (cost[x] != d) continue
                      val r = x / n
                      val c = x % n
                      for (k in 0 until 4) {
                          val nr = r + DR[k]
                          val nc = c + DC[k]
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue
                          val y = nr * n + nc
                          val nd = d + grid[nr][nc]
                          if (nd < cost[y]) {
                              cost[y] = nd
                              if (grid[nr][nc] == 0) cur.add(y) else next.add(y)
                          }
                      }
                  }
                  cur = next
                  d++
              }
              return cost[total - 1] < health
          }
        `,
        swift: code`
          func findSafeWalk(_ grid: [[Int]], _ health: Int) -> Bool {
              let m = grid.count, n = grid[0].count, total = m * n
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var cost = [Int](repeating: total + 1, count: total)
              cost[0] = grid[0][0]
              var cur = [0]
              var d = cost[0]
              while !cur.isEmpty {
                  var next = [Int]()
                  var h = 0
                  while h < cur.count {
                      let x = cur[h]
                      h += 1
                      if cost[x] != d { continue }
                      let r = x / n, c = x % n
                      for k in 0..<4 {
                          let nr = r + DR[k], nc = c + DC[k]
                          if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }
                          let y = nr * n + nc, nd = d + grid[nr][nc]
                          if nd < cost[y] {
                              cost[y] = nd
                              if grid[nr][nc] == 0 { cur.append(y) } else { next.append(y) }
                          }
                      }
                  }
                  cur = next
                  d += 1
              }
              return cost[total - 1] < health
          }
        `,
        rust: code`
          fn findSafeWalk(grid: Vec<Vec<i32>>, health: i32) -> bool {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let total = (m * n) as usize;
              let dr = [1, -1, 0, 0];
              let dc = [0, 0, 1, -1];
              let mut cost = vec![m * n + 1; total];
              cost[0] = grid[0][0];
              let mut cur: Vec<usize> = vec![0];
              let mut d = cost[0];
              while !cur.is_empty() {
                  let mut next: Vec<usize> = Vec::new();
                  let mut h = 0;
                  while h < cur.len() {
                      let x = cur[h];
                      h += 1;
                      if cost[x] != d {
                          continue;
                      }
                      let r = x as i32 / n;
                      let c = x as i32 % n;
                      for k in 0..4 {
                          let nr = r + dr[k];
                          let nc = c + dc[k];
                          if nr < 0 || nr >= m || nc < 0 || nc >= n {
                              continue;
                          }
                          let y = (nr * n + nc) as usize;
                          let cell = grid[nr as usize][nc as usize];
                          let nd = d + cell;
                          if nd < cost[y] {
                              cost[y] = nd;
                              if cell == 0 {
                                  cur.push(y);
                              } else {
                                  next.push(y);
                              }
                          }
                      }
                  }
                  cur = next;
                  d += 1;
              }
              cost[total - 1] < health
          }
        `,
        php: code`
          function findSafeWalk($grid, $health) {
              $m = count($grid);
              $n = count($grid[0]);
              $total = $m * $n;
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              $cost = array_fill(0, $total, $total + 1);
              $cost[0] = $grid[0][0];
              $cur = [0];
              $d = $cost[0];
              while (count($cur) > 0) {
                  $next = [];
                  for ($h = 0; $h < count($cur); $h++) {
                      $x = $cur[$h];
                      if ($cost[$x] != $d) continue;
                      $r = intdiv($x, $n);
                      $c = $x % $n;
                      for ($k = 0; $k < 4; $k++) {
                          $nr = $r + $DR[$k];
                          $nc = $c + $DC[$k];
                          if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;
                          $y = $nr * $n + $nc;
                          $nd = $d + $grid[$nr][$nc];
                          if ($nd < $cost[$y]) {
                              $cost[$y] = $nd;
                              if ($grid[$nr][$nc] == 0) $cur[] = $y; else $next[] = $y;
                          }
                      }
                  }
                  $cur = $next;
                  $d++;
              }
              return $cost[$total - 1] < $health;
          }
        `,
        ruby: code`
          def findSafeWalk(grid, health)
            m = grid.length
            n = grid[0].length
            total = m * n
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            cost = Array.new(total, total + 1)
            cost[0] = grid[0][0]
            cur = [0]
            d = cost[0]
            until cur.empty?
              nxt = []
              h = 0
              while h < cur.length
                x = cur[h]
                h += 1
                next if cost[x] != d
                r = x / n
                c = x % n
                dirs.each do |dr, dc|
                  nr = r + dr
                  nc = c + dc
                  next if nr < 0 || nr >= m || nc < 0 || nc >= n
                  y = nr * n + nc
                  nd = d + grid[nr][nc]
                  next unless nd < cost[y]
                  cost[y] = nd
                  if grid[nr][nc] == 0
                    cur << y
                  else
                    nxt << y
                  end
                end
              end
              cur = nxt
              d += 1
            end
            cost[total - 1] < health
          end
        `,
      },
    };
  })(),

  // ── Remove Methods From Project (LC 3310) ───────────────────────
  (() => {
    const ref = (n: number, k: number, invocations: number[][]) => {
      const sus = new Array(n).fill(false);
      sus[k] = true;
      for (let changed = true; changed;) {
        changed = false;
        for (const [a, b] of invocations) if (sus[a] && !sus[b]) { sus[b] = true; changed = true; }
      }
      const blocked = invocations.some(([a, b]) => !sus[a] && sus[b]);
      const out: number[] = [];
      for (let i = 0; i < n; i++) if (blocked || !sus[i]) out.push(i);
      return out;
    };
    return {
      slug: "remove-methods-from-project",
      title: "Remove Methods From Project",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Amazon"],
      signature: { funcName: "remainingMethods", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }, { name: "invocations", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A project has `n` methods numbered `0` to `n - 1`. Each `invocations[i] = [ai, bi]` means method `ai` calls method `bi`.\n\nMethod `k` has a known bug. It is **suspicious**, and so is every method it calls directly or indirectly.\n\nYou want to delete all suspicious methods together, but only if no method outside that group calls into it. If some non-suspicious method calls a suspicious one, nothing can be removed.\n\nReturn the methods that remain after deleting as much as the rule allows, **sorted in increasing order**.",
        [
          { in: "n = 4, k = 1, invocations = [[1,2],[0,1],[3,2]]", out: "[0,1,2,3]", note: "Methods 1 and 2 are suspicious, but method 0 calls 1 (and method 3 calls 2), so nothing is removed." },
          { in: "n = 5, k = 0, invocations = [[1,2],[0,2],[0,1],[3,4]]", out: "[3,4]", note: "Methods 0, 1 and 2 are suspicious and only call each other, so they are removed." },
          { in: "n = 3, k = 2, invocations = [[1,2],[0,1],[2,0]]", out: "[]", note: "Every method is reachable from 2, so all of them are removed." },
        ],
        ["1 <= n <= 10^5", "0 <= k <= n - 1", "0 <= invocations.length <= 2 * 10^5", "invocations[i] == [ai, bi]", "0 <= ai, bi <= n - 1", "ai != bi", "invocations[i] != invocations[j] for i != j"]),
      hints: [
        "First find the suspicious group: every method reachable from `k` along the call edges.",
        "A BFS or DFS from `k` over the directed edges marks the group in O(n + m).",
        "Then scan every call `a → b`: if `a` is outside the group and `b` inside it, nothing can be removed. Otherwise return the methods outside the group.",
      ],
      editorial: explain({
        idea: "The decision is all-or-nothing, so compute the suspicious set by reachability and then check a single condition: does any edge enter the set from outside?",
        steps: [
          "Build the directed adjacency lists of the calls.",
          "BFS from `k`, marking every method reached as suspicious.",
          "For each call `[a, b]`, if `a` is not suspicious but `b` is, return every method `0 … n - 1`.",
          "Otherwise return the non-suspicious methods in increasing order.",
        ],
        why: "The suspicious set is closed under calls by construction (anything a suspicious method calls is suspicious), so deleting it never breaks a call that starts inside it. The only calls that could break start outside the set and end inside, and those are exactly the ones the scan looks for.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Edges are directed: a method calling `k` is not suspicious, it is what blocks the removal.",
          "If removal is blocked the answer is **all** methods, including the suspicious ones.",
          "An empty answer is valid — when every method is suspicious.",
        ],
      }),
      examples: [
        { input: "4\n1\n[[1,2],[0,1],[3,2]]", expectedOutput: "[0,1,2,3]" },
        { input: "5\n0\n[[1,2],[0,2],[0,1],[3,4]]", expectedOutput: "[3,4]" },
        { input: "3\n2\n[[1,2],[0,1],[2,0]]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 4, 8, 15]));
        const k = ri(rng, 0, n - 1);
        const pairs: number[][] = [];
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b) pairs.push([a, b]);
        shuffle(rng, pairs);
        const invocations = pairs.slice(0, ri(rng, 0, Math.min(pairs.length, pick(rng, [2, n, 2 * n, 25]))));
        return { input: `${n}\n${k}\n${fmtIntMat(invocations)}`, expectedOutput: fmtIntArr(ref(n, k, invocations)) };
      },
      solutions: {
        python: code`
          from typing import List

          def remainingMethods(n: int, k: int, invocations: List[List[int]]) -> List[int]:
              adj = [[] for _ in range(n)]
              for a, b in invocations:
                  adj[a].append(b)
              sus = [False] * n
              sus[k] = True
              stack = [k]
              while stack:
                  u = stack.pop()
                  for v in adj[u]:
                      if not sus[v]:
                          sus[v] = True
                          stack.append(v)
              for a, b in invocations:
                  if not sus[a] and sus[b]:
                      return list(range(n))
              return [i for i in range(n) if not sus[i]]
        `,
        javascript: code`
          var remainingMethods = function(n, k, invocations) {
              var adj = [], sus = [];
              for (var i = 0; i < n; i++) { adj.push([]); sus.push(false); }
              for (var e = 0; e < invocations.length; e++) adj[invocations[e][0]].push(invocations[e][1]);
              sus[k] = true;
              var stack = [k];
              while (stack.length > 0) {
                  var u = stack.pop();
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!sus[v]) { sus[v] = true; stack.push(v); }
                  }
              }
              var blocked = false;
              for (var t = 0; t < invocations.length; t++) {
                  if (!sus[invocations[t][0]] && sus[invocations[t][1]]) { blocked = true; break; }
              }
              var out = [];
              for (var x = 0; x < n; x++) if (blocked || !sus[x]) out.push(x);
              return out;
          };
        `,
        typescript: code`
          function remainingMethods(n: number, k: number, invocations: number[][]): number[] {
              var adj: number[][] = [], sus: boolean[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); sus.push(false); }
              for (var e = 0; e < invocations.length; e++) adj[invocations[e][0]].push(invocations[e][1]);
              sus[k] = true;
              var stack: number[] = [k];
              while (stack.length > 0) {
                  var u = stack.pop() as number;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!sus[v]) { sus[v] = true; stack.push(v); }
                  }
              }
              var blocked = false;
              for (var t = 0; t < invocations.length; t++) {
                  if (!sus[invocations[t][0]] && sus[invocations[t][1]]) { blocked = true; break; }
              }
              var out: number[] = [];
              for (var x = 0; x < n; x++) if (blocked || !sus[x]) out.push(x);
              return out;
          }
        `,
        java: code`
          public static int[] remainingMethods(int n, int k, int[][] invocations) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : invocations) adj.get(e[0]).add(e[1]);
              boolean[] sus = new boolean[n];
              sus[k] = true;
              int[] stack = new int[n];
              int top = 0;
              stack[top++] = k;
              while (top > 0) {
                  int u = stack[--top];
                  for (int v : adj.get(u)) if (!sus[v]) { sus[v] = true; stack[top++] = v; }
              }
              boolean blocked = false;
              for (int[] e : invocations) if (!sus[e[0]] && sus[e[1]]) { blocked = true; break; }
              int cnt = 0;
              for (int i = 0; i < n; i++) if (blocked || !sus[i]) cnt++;
              int[] out = new int[cnt];
              int w = 0;
              for (int i = 0; i < n; i++) if (blocked || !sus[i]) out[w++] = i;
              return out;
          }
        `,
        cpp: code`
          vector<int> remainingMethods(int n, int k, vector<vector<int>>& invocations) {
              vector<vector<int>> adj(n);
              for (auto& e : invocations) adj[e[0]].push_back(e[1]);
              vector<bool> sus(n, false);
              sus[k] = true;
              vector<int> stack = {k};
              while (!stack.empty()) {
                  int u = stack.back();
                  stack.pop_back();
                  for (int v : adj[u]) if (!sus[v]) { sus[v] = true; stack.push_back(v); }
              }
              bool blocked = false;
              for (auto& e : invocations) if (!sus[e[0]] && sus[e[1]]) { blocked = true; break; }
              vector<int> out;
              for (int i = 0; i < n; i++) if (blocked || !sus[i]) out.push_back(i);
              return out;
          }
        `,
        c: code`
          int* remainingMethods(int n, int k, int** invocations, int invocationsSize, int* invocationsColSize, int* returnSize) {
              int* head = (int*)malloc(n * sizeof(int));
              int* nxt = (int*)malloc((invocationsSize + 1) * sizeof(int));
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < invocationsSize; e++) { nxt[e] = head[invocations[e][0]]; head[invocations[e][0]] = e; }
              bool* sus = (bool*)calloc(n, sizeof(bool));
              int* stack = (int*)malloc(n * sizeof(int));
              int top = 0;
              sus[k] = true;
              stack[top++] = k;
              while (top > 0) {
                  int u = stack[--top];
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = invocations[e][1];
                      if (!sus[v]) { sus[v] = true; stack[top++] = v; }
                  }
              }
              bool blocked = false;
              for (int e = 0; e < invocationsSize; e++) if (!sus[invocations[e][0]] && sus[invocations[e][1]]) { blocked = true; break; }
              int* out = (int*)malloc((n + 1) * sizeof(int));
              int cnt = 0;
              for (int i = 0; i < n; i++) if (blocked || !sus[i]) out[cnt++] = i;
              free(head); free(nxt); free(sus); free(stack);
              *returnSize = cnt;
              return out;
          }
        `,
        csharp: code`
          public static int[] RemainingMethods(int n, int k, int[][] invocations)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in invocations) adj[e[0]].Add(e[1]);
              var sus = new bool[n];
              sus[k] = true;
              var stack = new Stack<int>();
              stack.Push(k);
              while (stack.Count > 0)
              {
                  int u = stack.Pop();
                  foreach (int v in adj[u]) if (!sus[v]) { sus[v] = true; stack.Push(v); }
              }
              bool blocked = false;
              foreach (var e in invocations) if (!sus[e[0]] && sus[e[1]]) { blocked = true; break; }
              var res = new List<int>();
              for (int i = 0; i < n; i++) if (blocked || !sus[i]) res.Add(i);
              return res.ToArray();
          }
        `,
        go: code`
          func remainingMethods(n int, k int, invocations [][]int) []int {
          	adj := make([][]int, n)
          	for _, e := range invocations {
          		adj[e[0]] = append(adj[e[0]], e[1])
          	}
          	sus := make([]bool, n)
          	sus[k] = true
          	stack := []int{k}
          	for len(stack) > 0 {
          		u := stack[len(stack)-1]
          		stack = stack[:len(stack)-1]
          		for _, v := range adj[u] {
          			if !sus[v] {
          				sus[v] = true
          				stack = append(stack, v)
          			}
          		}
          	}
          	blocked := false
          	for _, e := range invocations {
          		if !sus[e[0]] && sus[e[1]] {
          			blocked = true
          			break
          		}
          	}
          	res := []int{}
          	for i := 0; i < n; i++ {
          		if blocked || !sus[i] {
          			res = append(res, i)
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun remainingMethods(n: Int, k: Int, invocations: Array<IntArray>): IntArray {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in invocations) adj[e[0]].add(e[1])
              val sus = BooleanArray(n)
              sus[k] = true
              val stack = IntArray(n)
              var top = 0
              stack[top++] = k
              while (top > 0) {
                  val u = stack[--top]
                  for (v in adj[u]) if (!sus[v]) { sus[v] = true; stack[top++] = v }
              }
              var blocked = false
              for (e in invocations) if (!sus[e[0]] && sus[e[1]]) { blocked = true; break }
              val res = ArrayList<Int>()
              for (i in 0 until n) if (blocked || !sus[i]) res.add(i)
              return res.toIntArray()
          }
        `,
        swift: code`
          func remainingMethods(_ n: Int, _ k: Int, _ invocations: [[Int]]) -> [Int] {
              var adj = [[Int]](repeating: [], count: n)
              for e in invocations { adj[e[0]].append(e[1]) }
              var sus = [Bool](repeating: false, count: n)
              sus[k] = true
              var stack = [k]
              while let u = stack.popLast() {
                  for v in adj[u] where !sus[v] {
                      sus[v] = true
                      stack.append(v)
                  }
              }
              var blocked = false
              for e in invocations where !sus[e[0]] && sus[e[1]] {
                  blocked = true
                  break
              }
              var res = [Int]()
              for i in 0..<n where blocked || !sus[i] { res.append(i) }
              return res
          }
        `,
        rust: code`
          fn remainingMethods(n: i32, k: i32, invocations: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in invocations.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
              }
              let mut sus = vec![false; n];
              sus[k as usize] = true;
              let mut stack: Vec<usize> = vec![k as usize];
              while let Some(u) = stack.pop() {
                  for &v in adj[u].iter() {
                      if !sus[v] {
                          sus[v] = true;
                          stack.push(v);
                      }
                  }
              }
              let blocked = invocations.iter().any(|e| !sus[e[0] as usize] && sus[e[1] as usize]);
              (0..n).filter(|&i| blocked || !sus[i]).map(|i| i as i32).collect()
          }
        `,
        php: code`
          function remainingMethods($n, $k, $invocations) {
              $adj = array_fill(0, $n, []);
              foreach ($invocations as $e) $adj[$e[0]][] = $e[1];
              $sus = array_fill(0, $n, false);
              $sus[$k] = true;
              $stack = [$k];
              while (count($stack) > 0) {
                  $u = array_pop($stack);
                  foreach ($adj[$u] as $v) if (!$sus[$v]) { $sus[$v] = true; $stack[] = $v; }
              }
              $blocked = false;
              foreach ($invocations as $e) if (!$sus[$e[0]] && $sus[$e[1]]) { $blocked = true; break; }
              $res = [];
              for ($i = 0; $i < $n; $i++) if ($blocked || !$sus[$i]) $res[] = $i;
              return $res;
          }
        `,
        ruby: code`
          def remainingMethods(n, k, invocations)
            adj = Array.new(n) { [] }
            invocations.each { |a, b| adj[a] << b }
            sus = Array.new(n, false)
            sus[k] = true
            stack = [k]
            until stack.empty?
              u = stack.pop
              adj[u].each do |v|
                next if sus[v]
                sus[v] = true
                stack << v
              end
            end
            blocked = invocations.any? { |a, b| !sus[a] && sus[b] }
            (0...n).select { |i| blocked || !sus[i] }
          end
        `,
      },
    };
  })(),

  // ── Find Subtree Sizes After Changes (LC 3331) ──────────────────
  (() => {
    const ref = (parent: number[], s: string) => {
      const n = parent.length;
      const np = parent.slice();
      for (let x = 1; x < n; x++) {
        for (let y = parent[x]; y !== -1; y = parent[y]) if (s[y] === s[x]) { np[x] = y; break; }
      }
      const size = new Array(n).fill(0);
      for (let x = 0; x < n; x++) for (let y = x; y !== -1; y = np[y]) size[y]++;
      return size;
    };
    return {
      slug: "find-subtree-sizes-after-changes",
      title: "Find Subtree Sizes After Changes",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Tree", "Depth-First Search", "Google"],
      signature: { funcName: "findSubtreeSizes", params: [{ name: "parent", type: "int[]" as const }, { name: "s", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "A tree has `n` nodes numbered `0` to `n - 1` and is rooted at node `0`. It is given by `parent`, where `parent[i]` is the parent of node `i` and `parent[0] = -1`. Node `i` carries the letter `s[i]`.\n\nAll at once, for every node `x` from `1` to `n - 1`: find the **closest** ancestor `y` of `x` (in the original tree) with `s[y] == s[x]`. If such a `y` exists, cut the edge between `x` and its parent and make `y` the new parent of `x`. If none exists, `x` keeps its parent.\n\nReturn an array `answer` of length `n` where `answer[i]` is the number of nodes in the subtree of node `i` in the **final** tree.",
        [
          { in: "parent = [-1,0,0,1,1,1], s = \"abaabc\"", out: "[6,3,1,1,1,1]", note: "Node 3 ('a') has the ancestor 0 ('a'), so it moves under node 0. Every other node keeps its parent." },
          { in: "parent = [-1,0,4,0,1], s = \"abbba\"", out: "[5,2,1,1,1]", note: "Node 4 ('a') moves under node 0 and node 2 ('b') moves under node 1; node 1 then holds nodes 1 and 2." },
          { in: "parent = [-1], s = \"z\"", out: "[1]" },
        ],
        ["n == parent.length == s.length", "1 <= n <= 10^5", "0 <= parent[i] <= n - 1 for all i >= 1", "parent[0] == -1", "parent represents a valid tree", "s consists only of lowercase English letters"]),
      hints: [
        "The changes are simultaneous and use the original tree, so every node's new parent can be decided independently.",
        "Walk the tree depth-first. If you keep, for every letter, the deepest node with that letter on the current root-to-node path, the closest matching ancestor is just a lookup.",
        "Remember the old entry when you overwrite a letter's slot on entering a node, and restore it when you leave. Then a new parent is always an old ancestor, so a reverse pre-order pass adds up the new subtree sizes.",
      ],
      editorial: explain({
        idea: "A depth-first walk keeps the current root-to-node path; a 26-slot table holding the deepest node of each letter on that path answers \"closest ancestor with the same letter\" in O(1). Since the new parent is an ancestor, the pre-order of the original tree still lists every new parent before its children.",
        steps: [
          "Build the children lists from `parent`.",
          "DFS from 0 with an explicit stack. On entering `x` (not the root): if `last[s[x]]` is set, the new parent of `x` is that node. Save the old `last[s[x]]`, set it to `x`, and record `x` in pre-order.",
          "On leaving `x`, restore `last[s[x]]` to the saved value.",
          "Set every size to 1 and walk the pre-order backwards, adding `size[x]` to `size[newParent[x]]`.",
        ],
        why: "When `x` is entered, the table holds exactly the nodes on the path from the root to `x`'s parent, the deepest one per letter, because every node leaving the path restores what it overwrote. So the lookup is the closest matching ancestor in the original tree, as the simultaneous rule requires. The new parent precedes `x` in pre-order, so the backward accumulation sees every child before its parent.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Do not apply the moves one at a time and look up ancestors in the changing tree — the rule is defined on the original tree.",
          "Forgetting to restore the letter slot on exit lets a node in one branch adopt a node from a sibling branch.",
          "The root never changes its parent.",
        ],
      }),
      examples: [
        { input: "[-1,0,0,1,1,1]\n\"abaabc\"", expectedOutput: "[6,3,1,1,1,1]" },
        { input: "[-1,0,4,0,1]\n\"abbba\"", expectedOutput: "[5,2,1,1,1]" },
        { input: "[-1]\n\"z\"", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 5, 8, 12, 20, 30]);
        // Build a tree on positions 0..n-1 with parents earlier, then relabel keeping 0 as root.
        const label = [0, ...shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1))];
        const parent = new Array(n).fill(-1);
        for (let i = 1; i < n; i++) {
          const j = rng() < 0.4 ? i - 1 : ri(rng, 0, i - 1);
          parent[label[i]] = label[j];
        }
        const alpha = pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        let s = "";
        for (let i = 0; i < n; i++) s += alpha[ri(rng, 0, alpha.length - 1)];
        return { input: `${fmtIntArr(parent)}\n"${s}"`, expectedOutput: fmtIntArr(ref(parent, s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findSubtreeSizes(parent: List[int], s: str) -> List[int]:
              n = len(parent)
              children = [[] for _ in range(n)]
              for i in range(1, n):
                  children[parent[i]].append(i)
              last = [-1] * 26
              saved = [-1] * n
              newp = parent[:]
              pre = []
              stack = [0]
              while stack:
                  x = stack.pop()
                  if x >= 0:
                      c = ord(s[x]) - 97
                      if x != 0 and last[c] != -1:
                          newp[x] = last[c]
                      saved[x] = last[c]
                      last[c] = x
                      pre.append(x)
                      stack.append(~x)
                      stack.extend(children[x])
                  else:
                      x = ~x
                      last[ord(s[x]) - 97] = saved[x]
              size = [1] * n
              for x in reversed(pre):
                  if x != 0:
                      size[newp[x]] += size[x]
              return size
        `,
        javascript: code`
          var findSubtreeSizes = function(parent, s) {
              var n = parent.length;
              var children = [], saved = [], newp = [], size = [];
              for (var i = 0; i < n; i++) { children.push([]); saved.push(-1); newp.push(parent[i]); size.push(1); }
              for (var j = 1; j < n; j++) children[parent[j]].push(j);
              var last = [];
              for (var c = 0; c < 26; c++) last.push(-1);
              var pre = [], stack = [0];
              while (stack.length > 0) {
                  var x = stack.pop();
                  if (x >= 0) {
                      var ch = s.charCodeAt(x) - 97;
                      if (x !== 0 && last[ch] !== -1) newp[x] = last[ch];
                      saved[x] = last[ch];
                      last[ch] = x;
                      pre.push(x);
                      stack.push(-x - 1);
                      for (var k = 0; k < children[x].length; k++) stack.push(children[x][k]);
                  } else {
                      var y = -x - 1;
                      last[s.charCodeAt(y) - 97] = saved[y];
                  }
              }
              for (var t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              return size;
          };
        `,
        typescript: code`
          function findSubtreeSizes(parent: number[], s: string): number[] {
              var n = parent.length;
              var children: number[][] = [], saved: number[] = [], newp: number[] = [], size: number[] = [];
              for (var i = 0; i < n; i++) { children.push([]); saved.push(-1); newp.push(parent[i]); size.push(1); }
              for (var j = 1; j < n; j++) children[parent[j]].push(j);
              var last: number[] = [];
              for (var c = 0; c < 26; c++) last.push(-1);
              var pre: number[] = [], stack: number[] = [0];
              while (stack.length > 0) {
                  var x = stack.pop() as number;
                  if (x >= 0) {
                      var ch = s.charCodeAt(x) - 97;
                      if (x !== 0 && last[ch] !== -1) newp[x] = last[ch];
                      saved[x] = last[ch];
                      last[ch] = x;
                      pre.push(x);
                      stack.push(-x - 1);
                      for (var k = 0; k < children[x].length; k++) stack.push(children[x][k]);
                  } else {
                      var y = -x - 1;
                      last[s.charCodeAt(y) - 97] = saved[y];
                  }
              }
              for (var t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              return size;
          }
        `,
        java: code`
          public static int[] findSubtreeSizes(int[] parent, String s) {
              int n = parent.length;
              List<List<Integer>> children = new ArrayList<>();
              for (int i = 0; i < n; i++) children.add(new ArrayList<>());
              for (int i = 1; i < n; i++) children.get(parent[i]).add(i);
              int[] last = new int[26];
              Arrays.fill(last, -1);
              int[] saved = new int[n], newp = parent.clone(), size = new int[n], pre = new int[n];
              Arrays.fill(size, 1);
              int[] stack = new int[2 * n + 1];
              int top = 0, cnt = 0;
              stack[top++] = 0;
              while (top > 0) {
                  int x = stack[--top];
                  if (x >= 0) {
                      int c = s.charAt(x) - 'a';
                      if (x != 0 && last[c] != -1) newp[x] = last[c];
                      saved[x] = last[c];
                      last[c] = x;
                      pre[cnt++] = x;
                      stack[top++] = -x - 1;
                      for (int y : children.get(x)) stack[top++] = y;
                  } else {
                      int y = -x - 1;
                      last[s.charAt(y) - 'a'] = saved[y];
                  }
              }
              for (int t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              return size;
          }
        `,
        cpp: code`
          vector<int> findSubtreeSizes(vector<int>& parent, string s) {
              int n = parent.size();
              vector<vector<int>> children(n);
              for (int i = 1; i < n; i++) children[parent[i]].push_back(i);
              vector<int> last(26, -1), saved(n, -1), newp(parent), size(n, 1), pre, stack = {0};
              while (!stack.empty()) {
                  int x = stack.back();
                  stack.pop_back();
                  if (x >= 0) {
                      int c = s[x] - 'a';
                      if (x != 0 && last[c] != -1) newp[x] = last[c];
                      saved[x] = last[c];
                      last[c] = x;
                      pre.push_back(x);
                      stack.push_back(-x - 1);
                      for (int y : children[x]) stack.push_back(y);
                  } else {
                      int y = -x - 1;
                      last[s[y] - 'a'] = saved[y];
                  }
              }
              for (int t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              return size;
          }
        `,
        c: code`
          int* findSubtreeSizes(int* parent, int parentSize, char* s, int* returnSize) {
              int n = parentSize;
              int* head = (int*)malloc(n * sizeof(int));
              int* nxt = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int i = n - 1; i >= 1; i--) { nxt[i] = head[parent[i]]; head[parent[i]] = i; }
              int last[26];
              for (int c = 0; c < 26; c++) last[c] = -1;
              int* saved = (int*)malloc(n * sizeof(int));
              int* newp = (int*)malloc(n * sizeof(int));
              int* size = (int*)malloc(n * sizeof(int));
              int* pre = (int*)malloc(n * sizeof(int));
              int* stack = (int*)malloc((2 * n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) { newp[i] = parent[i]; size[i] = 1; }
              int top = 0, cnt = 0;
              stack[top++] = 0;
              while (top > 0) {
                  int x = stack[--top];
                  if (x >= 0) {
                      int c = s[x] - 'a';
                      if (x != 0 && last[c] != -1) newp[x] = last[c];
                      saved[x] = last[c];
                      last[c] = x;
                      pre[cnt++] = x;
                      stack[top++] = -x - 1;
                      for (int y = head[x]; y != -1; y = nxt[y]) stack[top++] = y;
                  } else {
                      int y = -x - 1;
                      last[s[y] - 'a'] = saved[y];
                  }
              }
              for (int t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              free(head); free(nxt); free(saved); free(newp); free(pre); free(stack);
              *returnSize = n;
              return size;
          }
        `,
        csharp: code`
          public static int[] FindSubtreeSizes(int[] parent, string s)
          {
              int n = parent.Length;
              var children = new List<int>[n];
              for (int i = 0; i < n; i++) children[i] = new List<int>();
              for (int i = 1; i < n; i++) children[parent[i]].Add(i);
              var last = new int[26];
              for (int c = 0; c < 26; c++) last[c] = -1;
              var saved = new int[n];
              var newp = (int[])parent.Clone();
              var size = new int[n];
              for (int i = 0; i < n; i++) size[i] = 1;
              var pre = new List<int>();
              var stack = new Stack<int>();
              stack.Push(0);
              while (stack.Count > 0)
              {
                  int x = stack.Pop();
                  if (x >= 0)
                  {
                      int c = s[x] - 'a';
                      if (x != 0 && last[c] != -1) newp[x] = last[c];
                      saved[x] = last[c];
                      last[c] = x;
                      pre.Add(x);
                      stack.Push(-x - 1);
                      foreach (int y in children[x]) stack.Push(y);
                  }
                  else
                  {
                      int y = -x - 1;
                      last[s[y] - 'a'] = saved[y];
                  }
              }
              for (int t = n - 1; t > 0; t--) size[newp[pre[t]]] += size[pre[t]];
              return size;
          }
        `,
        go: code`
          func findSubtreeSizes(parent []int, s string) []int {
          	n := len(parent)
          	children := make([][]int, n)
          	for i := 1; i < n; i++ {
          		children[parent[i]] = append(children[parent[i]], i)
          	}
          	last := make([]int, 26)
          	for c := range last {
          		last[c] = -1
          	}
          	saved := make([]int, n)
          	newp := make([]int, n)
          	copy(newp, parent)
          	size := make([]int, n)
          	for i := range size {
          		size[i] = 1
          	}
          	pre := make([]int, 0, n)
          	stack := []int{0}
          	for len(stack) > 0 {
          		x := stack[len(stack)-1]
          		stack = stack[:len(stack)-1]
          		if x >= 0 {
          			c := int(s[x] - 'a')
          			if x != 0 && last[c] != -1 {
          				newp[x] = last[c]
          			}
          			saved[x] = last[c]
          			last[c] = x
          			pre = append(pre, x)
          			stack = append(stack, -x-1)
          			stack = append(stack, children[x]...)
          		} else {
          			y := -x - 1
          			last[int(s[y]-'a')] = saved[y]
          		}
          	}
          	for t := n - 1; t > 0; t-- {
          		size[newp[pre[t]]] += size[pre[t]]
          	}
          	return size
          }
        `,
        kotlin: code`
          fun findSubtreeSizes(parent: IntArray, s: String): IntArray {
              val n = parent.size
              val children = Array(n) { ArrayList<Int>() }
              for (i in 1 until n) children[parent[i]].add(i)
              val last = IntArray(26) { -1 }
              val saved = IntArray(n)
              val newp = parent.copyOf()
              val size = IntArray(n) { 1 }
              val pre = IntArray(n)
              val stack = IntArray(2 * n + 1)
              var top = 0
              var cnt = 0
              stack[top++] = 0
              while (top > 0) {
                  val x = stack[--top]
                  if (x >= 0) {
                      val c = s[x] - 'a'
                      if (x != 0 && last[c] != -1) newp[x] = last[c]
                      saved[x] = last[c]
                      last[c] = x
                      pre[cnt++] = x
                      stack[top++] = -x - 1
                      for (y in children[x]) stack[top++] = y
                  } else {
                      val y = -x - 1
                      last[s[y] - 'a'] = saved[y]
                  }
              }
              for (t in n - 1 downTo 1) size[newp[pre[t]]] += size[pre[t]]
              return size
          }
        `,
        swift: code`
          func findSubtreeSizes(_ parent: [Int], _ s: String) -> [Int] {
              let n = parent.count
              let chars = Array(s.utf8).map { Int($0) - 97 }
              var children = [[Int]](repeating: [], count: n)
              for i in stride(from: 1, to: n, by: 1) { children[parent[i]].append(i) }
              var last = [Int](repeating: -1, count: 26)
              var saved = [Int](repeating: -1, count: n)
              var newp = parent
              var size = [Int](repeating: 1, count: n)
              var pre = [Int]()
              var stack = [0]
              while let x = stack.popLast() {
                  if x >= 0 {
                      let c = chars[x]
                      if x != 0 && last[c] != -1 { newp[x] = last[c] }
                      saved[x] = last[c]
                      last[c] = x
                      pre.append(x)
                      stack.append(-x - 1)
                      stack.append(contentsOf: children[x])
                  } else {
                      let y = -x - 1
                      last[chars[y]] = saved[y]
                  }
              }
              var t = n - 1
              while t > 0 {
                  size[newp[pre[t]]] += size[pre[t]]
                  t -= 1
              }
              return size
          }
        `,
        rust: code`
          fn findSubtreeSizes(parent: Vec<i32>, s: String) -> Vec<i32> {
              let n = parent.len();
              let b = s.as_bytes();
              let mut children: Vec<Vec<i64>> = vec![Vec::new(); n];
              for i in 1..n {
                  children[parent[i] as usize].push(i as i64);
              }
              let mut last = vec![-1i64; 26];
              let mut saved = vec![-1i64; n];
              let mut newp: Vec<i64> = parent.iter().map(|&p| p as i64).collect();
              let mut size = vec![1i32; n];
              let mut pre: Vec<usize> = Vec::with_capacity(n);
              let mut stack: Vec<i64> = vec![0];
              while let Some(x) = stack.pop() {
                  if x >= 0 {
                      let xu = x as usize;
                      let c = (b[xu] - b'a') as usize;
                      if xu != 0 && last[c] != -1 {
                          newp[xu] = last[c];
                      }
                      saved[xu] = last[c];
                      last[c] = x;
                      pre.push(xu);
                      stack.push(-x - 1);
                      for &y in children[xu].iter() {
                          stack.push(y);
                      }
                  } else {
                      let y = (-x - 1) as usize;
                      last[(b[y] - b'a') as usize] = saved[y];
                  }
              }
              for t in (1..n).rev() {
                  let x = pre[t];
                  let p = newp[x] as usize;
                  size[p] += size[x];
              }
              size
          }
        `,
        php: code`
          function findSubtreeSizes($parent, $s) {
              $n = count($parent);
              $children = array_fill(0, $n, []);
              for ($i = 1; $i < $n; $i++) $children[$parent[$i]][] = $i;
              $last = array_fill(0, 26, -1);
              $saved = array_fill(0, $n, -1);
              $newp = $parent;
              $size = array_fill(0, $n, 1);
              $pre = [];
              $stack = [0];
              while (count($stack) > 0) {
                  $x = array_pop($stack);
                  if ($x >= 0) {
                      $c = ord($s[$x]) - 97;
                      if ($x != 0 && $last[$c] != -1) $newp[$x] = $last[$c];
                      $saved[$x] = $last[$c];
                      $last[$c] = $x;
                      $pre[] = $x;
                      $stack[] = -$x - 1;
                      foreach ($children[$x] as $y) $stack[] = $y;
                  } else {
                      $y = -$x - 1;
                      $last[ord($s[$y]) - 97] = $saved[$y];
                  }
              }
              for ($t = $n - 1; $t > 0; $t--) $size[$newp[$pre[$t]]] += $size[$pre[$t]];
              return $size;
          }
        `,
        ruby: code`
          def findSubtreeSizes(parent, s)
            n = parent.length
            codes = s.bytes.map { |b| b - 97 }
            children = Array.new(n) { [] }
            (1...n).each { |i| children[parent[i]] << i }
            last = Array.new(26, -1)
            saved = Array.new(n, -1)
            newp = parent.dup
            size = Array.new(n, 1)
            pre = []
            stack = [0]
            until stack.empty?
              x = stack.pop
              if x >= 0
                c = codes[x]
                newp[x] = last[c] if x != 0 && last[c] != -1
                saved[x] = last[c]
                last[c] = x
                pre << x
                stack << (-x - 1)
                stack.concat(children[x])
              else
                y = -x - 1
                last[codes[y]] = saved[y]
              end
            end
            (n - 1).downto(1) { |t| size[newp[pre[t]]] += size[pre[t]] }
            size
          end
        `,
      },
    };
  })(),

  // ── Find Minimum Time to Reach Last Room I (LC 3341) ────────────
  (() => {
    const ref = (moveTime: number[][]) => {
      const n = moveTime.length, m = moveTime[0].length;
      const at = moveTime.map((row) => row.map(() => Infinity));
      at[0][0] = 0;
      for (let changed = true; changed;) {
        changed = false;
        for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
          if (at[r][c] === Infinity) continue;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
            const t = Math.max(at[r][c], moveTime[nr][nc]) + 1;
            if (t < at[nr][nc]) { at[nr][nc] = t; changed = true; }
          }
        }
      }
      return at[n - 1][m - 1];
    };
    return {
      slug: "find-minimum-time-to-reach-last-room-i",
      title: "Find Minimum Time to Reach Last Room I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Heap (Priority Queue)", "Matrix", "Shortest Path", "Amazon", "Google"],
      signature: { funcName: "minTimeToReach", params: [{ name: "moveTime", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A dungeon has `n x m` rooms laid out as a grid. `moveTime[i][j]` is the earliest second at which you may **start moving into** room `(i, j)`.\n\nYou are in room `(0, 0)` at time `t = 0`. Moving between two rooms that share a wall takes exactly one second, and you may wait in a room as long as you like.\n\nReturn the minimum time at which you can arrive in room `(n - 1, m - 1)`.",
        [
          { in: "moveTime = [[0,4],[4,4]]", out: "6", note: "Wait until t = 4, move to (1,0) arriving at 5, then move to (1,1) arriving at 6." },
          { in: "moveTime = [[0,0,0],[0,0,0]]", out: "3", note: "No waiting is needed: three moves along any shortest route." },
          { in: "moveTime = [[0,1],[1,2]]", out: "3" },
        ],
        ["2 <= n == moveTime.length <= 50", "2 <= m == moveTime[i].length <= 50", "0 <= moveTime[i][j] <= 10^9"]),
      hints: [
        "If you reach a room at time `t`, the earliest you can arrive in a neighbour is `max(t, moveTime[neighbour]) + 1` — waiting never hurts.",
        "Arriving earlier is never worse, so this is a shortest-path problem where each edge's cost depends on the time you start it — but it is still monotone in the start time.",
        "Run Dijkstra from `(0, 0)` with the arrival time as the distance, relaxing each neighbour with `max(t, moveTime) + 1`.",
      ],
      editorial: explain({
        idea: "Earliest arrival times obey Dijkstra's rule: the transition `t → max(t, moveTime[v]) + 1` never decreases and never gets worse for a smaller `t`, so the room popped with the smallest time is final.",
        steps: [
          "Set `time[0][0] = 0` and push it onto a min-heap.",
          "Pop the room with the smallest time `t`; skip it if a smaller time was already recorded.",
          "For each neighbour `v`, compute `max(t, moveTime[v]) + 1` and relax it.",
          "Stop when the bottom-right room is popped and return its time.",
        ],
        why: "The arrival function is non-decreasing in the departure time and always adds at least one second, which is exactly what Dijkstra's correctness proof needs: once the smallest tentative time is popped, no other route can reach that room sooner.",
        time: "O(n · m · log(n · m))",
        space: "O(n · m)",
        pitfalls: [
          "`moveTime` limits when you **start** moving into a room, so the arrival is `max(t, moveTime) + 1`, not `max(t + 1, moveTime)`.",
          "Times reach about 10^9, so a packed heap key needs 64 bits.",
          "A plain BFS by step count ignores waiting and gives wrong answers.",
        ],
      }),
      examples: [
        { input: "[[0,4],[4,4]]", expectedOutput: "6" },
        { input: "[[0,0,0],[0,0,0]]", expectedOutput: "3" },
        { input: "[[0,1],[1,2]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 4, 7])), m = ri(rng, 2, pick(rng, [2, 4, 7]));
        const top = pick(rng, [0, 3, 10, 40, 1000000000]);
        const moveTime = Array.from({ length: n }, () => Array.from({ length: m }, () => ri(rng, 0, top)));
        if (rng() < 0.5) moveTime[0][0] = 0;
        return { input: fmtIntMat(moveTime), expectedOutput: String(ref(moveTime)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minTimeToReach(moveTime: List[List[int]]) -> int:
              n, m = len(moveTime), len(moveTime[0])
              INF = float("inf")
              dist = [[INF] * m for _ in range(n)]
              dist[0][0] = 0
              heap = [(0, 0, 0)]
              while heap:
                  t, r, c = heapq.heappop(heap)
                  if t > dist[r][c]:
                      continue
                  if r == n - 1 and c == m - 1:
                      return t
                  for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if 0 <= nr < n and 0 <= nc < m:
                          nt = max(t, moveTime[nr][nc]) + 1
                          if nt < dist[nr][nc]:
                              dist[nr][nc] = nt
                              heapq.heappush(heap, (nt, nr, nc))
              return -1
        `,
        javascript: code`
          var minTimeToReach = function(moveTime) {
              var n = moveTime.length, m = moveTime[0].length, total = n * m, SH = 1048576;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var dist = [];
              for (var i = 0; i < total; i++) dist.push(4e12);
              dist[0] = 0;
              var heap = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var idx = key % SH, t = (key - idx) / SH;
                  if (t > dist[idx]) continue;
                  if (idx === total - 1) return t;
                  var r = Math.floor(idx / m), c = idx % m;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      var nt = Math.max(t, moveTime[nr][nc]) + 1, ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
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

          function minTimeToReach(moveTime: number[][]): number {
              var n = moveTime.length, m = moveTime[0].length, total = n * m, SH = 1048576;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var dist: number[] = [];
              for (var i = 0; i < total; i++) dist.push(4e12);
              dist[0] = 0;
              var heap: number[] = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var idx = key % SH, t = (key - idx) / SH;
                  if (t > dist[idx]) continue;
                  if (idx === total - 1) return t;
                  var r = Math.floor(idx / m), c = idx % m;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      var nt = Math.max(t, moveTime[nr][nc]) + 1, ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minTimeToReach(int[][] moveTime) {
              int n = moveTime.length, m = moveTime[0].length, total = n * m;
              final long SH = 1048576L;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              long[] dist = new long[total];
              Arrays.fill(dist, Long.MAX_VALUE);
              dist[0] = 0;
              PriorityQueue<Long> heap = new PriorityQueue<>();
              heap.add(0L);
              while (!heap.isEmpty()) {
                  long key = heap.poll();
                  int idx = (int) (key % SH);
                  long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) return (int) t;
                  int r = idx / m, c = idx % m;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long nt = Math.max(t, (long) moveTime[nr][nc]) + 1;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heap.add(nt * SH + ni); }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minTimeToReach(vector<vector<int>>& moveTime) {
              int n = moveTime.size(), m = moveTime[0].size();
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              vector<long long> dist(n * m, LLONG_MAX);
              priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> heap;
              dist[0] = 0;
              heap.push(make_pair(0LL, 0));
              while (!heap.empty()) {
                  long long t = heap.top().first;
                  int idx = heap.top().second;
                  heap.pop();
                  if (t > dist[idx]) continue;
                  if (idx == n * m - 1) return (int) t;
                  int r = idx / m, c = idx % m;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long long nt = max(t, (long long) moveTime[nr][nc]) + 1;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heap.push(make_pair(nt, ni)); }
                  }
              }
              return -1;
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

          int minTimeToReach(int** moveTime, int moveTimeSize, int* moveTimeColSize) {
              int n = moveTimeSize, m = moveTimeColSize[0], total = n * m;
              const long long SH = 1048576LL;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              long long* dist = (long long*)malloc(total * sizeof(long long));
              for (int i = 0; i < total; i++) dist[i] = 4000000000000LL;
              long long* heap = (long long*)malloc((4 * total + 4) * sizeof(long long));
              int size = 0;
              dist[0] = 0;
              hpPush(heap, &size, 0);
              int ans = -1;
              while (size > 0) {
                  long long key = hpPop(heap, &size);
                  int idx = (int)(key % SH);
                  long long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) { ans = (int) t; break; }
                  int r = idx / m, c = idx % m;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long long nt = (t > moveTime[nr][nc] ? t : moveTime[nr][nc]) + 1;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; hpPush(heap, &size, nt * SH + ni); }
                  }
              }
              free(dist);
              free(heap);
              return ans;
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

          public static int MinTimeToReach(int[][] moveTime)
          {
              int n = moveTime.Length, m = moveTime[0].Length, total = n * m;
              const long SH = 1048576L;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              var dist = new long[total];
              for (int i = 0; i < total; i++) dist[i] = long.MaxValue;
              dist[0] = 0;
              var heap = new List<long> { 0 };
              while (heap.Count > 0)
              {
                  long key = HeapPop(heap);
                  int idx = (int)(key % SH);
                  long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) return (int) t;
                  int r = idx / m, c = idx % m;
                  for (int d = 0; d < 4; d++)
                  {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long nt = Math.Max(t, (long) moveTime[nr][nc]) + 1;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; HeapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
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

          func minTimeToReach(moveTime [][]int) int {
          	n, m := len(moveTime), len(moveTime[0])
          	total := n * m
          	const SH = 1048576
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	dist := make([]int, total)
          	for i := range dist {
          		dist[i] = 1 << 62
          	}
          	dist[0] = 0
          	heap := []int{0}
          	for len(heap) > 0 {
          		key := hpPop(&heap)
          		idx, t := key%SH, key/SH
          		if t > dist[idx] {
          			continue
          		}
          		if idx == total-1 {
          			return t
          		}
          		r, c := idx/m, idx%m
          		for d := 0; d < 4; d++ {
          			nr, nc := r+DR[d], c+DC[d]
          			if nr < 0 || nr >= n || nc < 0 || nc >= m {
          				continue
          			}
          			nt := t
          			if moveTime[nr][nc] > nt {
          				nt = moveTime[nr][nc]
          			}
          			nt++
          			ni := nr*m + nc
          			if nt < dist[ni] {
          				dist[ni] = nt
          				hpPush(&heap, nt*SH+ni)
          			}
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minTimeToReach(moveTime: Array<IntArray>): Int {
              val n = moveTime.size
              val m = moveTime[0].size
              val total = n * m
              val SH = 1048576L
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              val dist = LongArray(total) { Long.MAX_VALUE }
              dist[0] = 0L
              val heap = PriorityQueue<Long>()
              heap.add(0L)
              while (heap.isNotEmpty()) {
                  val key = heap.poll()
                  val idx = (key % SH).toInt()
                  val t = key / SH
                  if (t > dist[idx]) continue
                  if (idx == total - 1) return t.toInt()
                  val r = idx / m
                  val c = idx % m
                  for (d in 0 until 4) {
                      val nr = r + DR[d]
                      val nc = c + DC[d]
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue
                      val nt = maxOf(t, moveTime[nr][nc].toLong()) + 1
                      val ni = nr * m + nc
                      if (nt < dist[ni]) { dist[ni] = nt; heap.add(nt * SH + ni) }
                  }
              }
              return -1
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

          func minTimeToReach(_ moveTime: [[Int]]) -> Int {
              let n = moveTime.count, m = moveTime[0].count, total = n * m
              let SH = 1048576
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var dist = [Int](repeating: Int.max, count: total)
              dist[0] = 0
              var heap = [0]
              while !heap.isEmpty {
                  let key = hpPop(&heap)
                  let idx = key % SH, t = key / SH
                  if t > dist[idx] { continue }
                  if idx == total - 1 { return t }
                  let r = idx / m, c = idx % m
                  for d in 0..<4 {
                      let nr = r + DR[d], nc = c + DC[d]
                      if nr < 0 || nr >= n || nc < 0 || nc >= m { continue }
                      let nt = max(t, moveTime[nr][nc]) + 1
                      let ni = nr * m + nc
                      if nt < dist[ni] { dist[ni] = nt; hpPush(&heap, nt * SH + ni) }
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minTimeToReach(moveTime: Vec<Vec<i32>>) -> i32 {
              let n = moveTime.len() as i32;
              let m = moveTime[0].len() as i32;
              let total = (n * m) as usize;
              let dr = [1, -1, 0, 0];
              let dc = [0, 0, 1, -1];
              let mut dist = vec![std::i64::MAX; total];
              let mut heap = BinaryHeap::new();
              dist[0] = 0;
              heap.push(Reverse((0i64, 0usize)));
              while let Some(Reverse((t, idx))) = heap.pop() {
                  if t > dist[idx] {
                      continue;
                  }
                  if idx == total - 1 {
                      return t as i32;
                  }
                  let r = idx as i32 / m;
                  let c = idx as i32 % m;
                  for d in 0..4 {
                      let nr = r + dr[d];
                      let nc = c + dc[d];
                      if nr < 0 || nr >= n || nc < 0 || nc >= m {
                          continue;
                      }
                      let nt = std::cmp::max(t, moveTime[nr as usize][nc as usize] as i64) + 1;
                      let ni = (nr * m + nc) as usize;
                      if nt < dist[ni] {
                          dist[ni] = nt;
                          heap.push(Reverse((nt, ni)));
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minTimeToReach($moveTime) {
              $n = count($moveTime);
              $m = count($moveTime[0]);
              $total = $n * $m;
              $SH = 1048576;
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              $dist = array_fill(0, $total, PHP_INT_MAX);
              $dist[0] = 0;
              $heap = new \SplMinHeap();
              $heap->insert(0);
              while (!$heap->isEmpty()) {
                  $key = $heap->extract();
                  $idx = $key % $SH;
                  $t = intdiv($key, $SH);
                  if ($t > $dist[$idx]) continue;
                  if ($idx == $total - 1) return $t;
                  $r = intdiv($idx, $m);
                  $c = $idx % $m;
                  for ($d = 0; $d < 4; $d++) {
                      $nr = $r + $DR[$d];
                      $nc = $c + $DC[$d];
                      if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $m) continue;
                      $nt = max($t, $moveTime[$nr][$nc]) + 1;
                      $ni = $nr * $m + $nc;
                      if ($nt < $dist[$ni]) { $dist[$ni] = $nt; $heap->insert($nt * $SH + $ni); }
                  }
              }
              return -1;
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

          def minTimeToReach(moveTime)
            n = moveTime.length
            m = moveTime[0].length
            total = n * m
            sh = 1_048_576
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            dist = Array.new(total, Float::INFINITY)
            dist[0] = 0
            heap = [0]
            until heap.empty?
              key = hp_pop(heap)
              idx = key % sh
              t = key / sh
              next if t > dist[idx]
              return t if idx == total - 1
              r = idx / m
              c = idx % m
              dirs.each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next if nr < 0 || nr >= n || nc < 0 || nc >= m
                nt = [t, moveTime[nr][nc]].max + 1
                ni = nr * m + nc
                if nt < dist[ni]
                  dist[ni] = nt
                  hp_push(heap, nt * sh + ni)
                end
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Find Minimum Time to Reach Last Room II (LC 3342) ───────────
  (() => {
    const ref = (moveTime: number[][]) => {
      const n = moveTime.length, m = moveTime[0].length;
      const at = moveTime.map((row) => row.map(() => Infinity));
      at[0][0] = 0;
      for (let changed = true; changed;) {
        changed = false;
        for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) {
          if (at[r][c] === Infinity) continue;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
            const t = Math.max(at[r][c], moveTime[nr][nc]) + ((r + c) % 2) + 1;
            if (t < at[nr][nc]) { at[nr][nc] = t; changed = true; }
          }
        }
      }
      return at[n - 1][m - 1];
    };
    return {
      slug: "find-minimum-time-to-reach-last-room-ii",
      title: "Find Minimum Time to Reach Last Room II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Heap (Priority Queue)", "Matrix", "Shortest Path", "Amazon", "Google"],
      signature: { funcName: "minTimeToReach", params: [{ name: "moveTime", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A dungeon has `n x m` rooms laid out as a grid. `moveTime[i][j]` is the earliest second at which you may **start moving into** room `(i, j)`.\n\nYou are in room `(0, 0)` at time `t = 0`, and you may wait in a room as long as you like. Moves between rooms that share a wall alternate in length: your first move takes **one** second, the second move **two** seconds, the third one second again, and so on.\n\nReturn the minimum time at which you can arrive in room `(n - 1, m - 1)`.",
        [
          { in: "moveTime = [[0,4],[4,4]]", out: "7", note: "Wait until t = 4 and move to (1,0) in one second (arriving at 5), then move to (1,1) in two seconds, arriving at 7." },
          { in: "moveTime = [[0,0,0,0],[0,0,0,0]]", out: "6", note: "Four moves costing 1 + 2 + 1 + 2 seconds." },
          { in: "moveTime = [[0,1],[1,2]]", out: "4" },
        ],
        ["2 <= n == moveTime.length <= 750", "2 <= m == moveTime[i].length <= 750", "0 <= moveTime[i][j] <= 10^9"]),
      hints: [
        "Every move goes to a cell whose `row + column` parity is the opposite of the current one, and you start on an even cell. So the length of the next move is decided by where you stand, not by how you got there.",
        "Leaving a cell with `(i + j)` even takes one second; leaving one with `(i + j)` odd takes two.",
        "Run Dijkstra on arrival times, relaxing a neighbour with `max(t, moveTime[neighbour]) + cost(current cell)`.",
      ],
      editorial: explain({
        idea: "The alternation looks like it needs the number of moves in the state, but on a grid every move flips the parity of `row + column`, so the move count's parity equals the current cell's parity. The cost becomes a property of the cell and plain Dijkstra applies.",
        steps: [
          "Set `time[0][0] = 0` and push it onto a min-heap.",
          "Pop the cell `(r, c)` with the smallest time `t`; skip stale entries.",
          "Each move out of it costs `(r + c) % 2 + 1` seconds: relax every neighbour with `max(t, moveTime[neighbour]) + cost`.",
          "Return the time of the bottom-right cell when it is popped.",
        ],
        why: "From `(0, 0)` (parity 0) any walk reaches a cell of parity `p` after a number of moves with the same parity `p`, so the next move's length is fixed by the cell. With that, the arrival function is non-decreasing in the departure time and adds a positive amount — the conditions Dijkstra needs.",
        time: "O(n · m · log(n · m))",
        space: "O(n · m)",
        pitfalls: [
          "Do not add the move count to the state: it is unnecessary and doubles the work.",
          "The cost depends on the cell you **leave**: the first move, out of `(0, 0)`, costs one second.",
          "Times reach about 10^9, so a packed heap key needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[[0,4],[4,4]]", expectedOutput: "7" },
        { input: "[[0,0,0,0],[0,0,0,0]]", expectedOutput: "6" },
        { input: "[[0,1],[1,2]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 4, 7])), m = ri(rng, 2, pick(rng, [2, 4, 7]));
        const top = pick(rng, [0, 3, 10, 40, 1000000000]);
        const moveTime = Array.from({ length: n }, () => Array.from({ length: m }, () => ri(rng, 0, top)));
        if (rng() < 0.5) moveTime[0][0] = 0;
        return { input: fmtIntMat(moveTime), expectedOutput: String(ref(moveTime)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minTimeToReach(moveTime: List[List[int]]) -> int:
              n, m = len(moveTime), len(moveTime[0])
              INF = float("inf")
              dist = [[INF] * m for _ in range(n)]
              dist[0][0] = 0
              heap = [(0, 0, 0)]
              while heap:
                  t, r, c = heapq.heappop(heap)
                  if t > dist[r][c]:
                      continue
                  if r == n - 1 and c == m - 1:
                      return t
                  cost = (r + c) % 2 + 1
                  for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if 0 <= nr < n and 0 <= nc < m:
                          nt = max(t, moveTime[nr][nc]) + cost
                          if nt < dist[nr][nc]:
                              dist[nr][nc] = nt
                              heapq.heappush(heap, (nt, nr, nc))
              return -1
        `,
        javascript: code`
          var minTimeToReach = function(moveTime) {
              var n = moveTime.length, m = moveTime[0].length, total = n * m, SH = 1048576;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var dist = [];
              for (var i = 0; i < total; i++) dist.push(4e12);
              dist[0] = 0;
              var heap = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var idx = key % SH, t = (key - idx) / SH;
                  if (t > dist[idx]) continue;
                  if (idx === total - 1) return t;
                  var r = Math.floor(idx / m), c = idx % m, cost = (r + c) % 2 + 1;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      var nt = Math.max(t, moveTime[nr][nc]) + cost, ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
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

          function minTimeToReach(moveTime: number[][]): number {
              var n = moveTime.length, m = moveTime[0].length, total = n * m, SH = 1048576;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var dist: number[] = [];
              for (var i = 0; i < total; i++) dist.push(4e12);
              dist[0] = 0;
              var heap: number[] = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var idx = key % SH, t = (key - idx) / SH;
                  if (t > dist[idx]) continue;
                  if (idx === total - 1) return t;
                  var r = Math.floor(idx / m), c = idx % m, cost = (r + c) % 2 + 1;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      var nt = Math.max(t, moveTime[nr][nc]) + cost, ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minTimeToReach(int[][] moveTime) {
              int n = moveTime.length, m = moveTime[0].length, total = n * m;
              final long SH = 1048576L;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              long[] dist = new long[total];
              Arrays.fill(dist, Long.MAX_VALUE);
              dist[0] = 0;
              PriorityQueue<Long> heap = new PriorityQueue<>();
              heap.add(0L);
              while (!heap.isEmpty()) {
                  long key = heap.poll();
                  int idx = (int) (key % SH);
                  long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) return (int) t;
                  int r = idx / m, c = idx % m, cost = (r + c) % 2 + 1;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long nt = Math.max(t, (long) moveTime[nr][nc]) + cost;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heap.add(nt * SH + ni); }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minTimeToReach(vector<vector<int>>& moveTime) {
              int n = moveTime.size(), m = moveTime[0].size();
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              vector<long long> dist(n * m, LLONG_MAX);
              priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> heap;
              dist[0] = 0;
              heap.push(make_pair(0LL, 0));
              while (!heap.empty()) {
                  long long t = heap.top().first;
                  int idx = heap.top().second;
                  heap.pop();
                  if (t > dist[idx]) continue;
                  if (idx == n * m - 1) return (int) t;
                  int r = idx / m, c = idx % m, cost = (r + c) % 2 + 1;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long long nt = max(t, (long long) moveTime[nr][nc]) + cost;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; heap.push(make_pair(nt, ni)); }
                  }
              }
              return -1;
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

          int minTimeToReach(int** moveTime, int moveTimeSize, int* moveTimeColSize) {
              int n = moveTimeSize, m = moveTimeColSize[0], total = n * m;
              const long long SH = 1048576LL;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              long long* dist = (long long*)malloc(total * sizeof(long long));
              for (int i = 0; i < total; i++) dist[i] = 4000000000000LL;
              long long* heap = (long long*)malloc((4 * total + 4) * sizeof(long long));
              int size = 0;
              dist[0] = 0;
              hpPush(heap, &size, 0);
              int ans = -1;
              while (size > 0) {
                  long long key = hpPop(heap, &size);
                  int idx = (int)(key % SH);
                  long long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) { ans = (int) t; break; }
                  int r = idx / m, c = idx % m, cost = (r + c) % 2 + 1;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long long nt = (t > moveTime[nr][nc] ? t : moveTime[nr][nc]) + cost;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; hpPush(heap, &size, nt * SH + ni); }
                  }
              }
              free(dist);
              free(heap);
              return ans;
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

          public static int MinTimeToReach(int[][] moveTime)
          {
              int n = moveTime.Length, m = moveTime[0].Length, total = n * m;
              const long SH = 1048576L;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              var dist = new long[total];
              for (int i = 0; i < total; i++) dist[i] = long.MaxValue;
              dist[0] = 0;
              var heap = new List<long> { 0 };
              while (heap.Count > 0)
              {
                  long key = HeapPop(heap);
                  int idx = (int)(key % SH);
                  long t = key / SH;
                  if (t > dist[idx]) continue;
                  if (idx == total - 1) return (int) t;
                  int r = idx / m, c = idx % m, cost = (r + c) % 2 + 1;
                  for (int d = 0; d < 4; d++)
                  {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                      long nt = Math.Max(t, (long) moveTime[nr][nc]) + cost;
                      int ni = nr * m + nc;
                      if (nt < dist[ni]) { dist[ni] = nt; HeapPush(heap, nt * SH + ni); }
                  }
              }
              return -1;
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

          func minTimeToReach(moveTime [][]int) int {
          	n, m := len(moveTime), len(moveTime[0])
          	total := n * m
          	const SH = 1048576
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	dist := make([]int, total)
          	for i := range dist {
          		dist[i] = 1 << 62
          	}
          	dist[0] = 0
          	heap := []int{0}
          	for len(heap) > 0 {
          		key := hpPop(&heap)
          		idx, t := key%SH, key/SH
          		if t > dist[idx] {
          			continue
          		}
          		if idx == total-1 {
          			return t
          		}
          		r, c := idx/m, idx%m
          		cost := (r+c)%2 + 1
          		for d := 0; d < 4; d++ {
          			nr, nc := r+DR[d], c+DC[d]
          			if nr < 0 || nr >= n || nc < 0 || nc >= m {
          				continue
          			}
          			nt := t
          			if moveTime[nr][nc] > nt {
          				nt = moveTime[nr][nc]
          			}
          			nt += cost
          			ni := nr*m + nc
          			if nt < dist[ni] {
          				dist[ni] = nt
          				hpPush(&heap, nt*SH+ni)
          			}
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minTimeToReach(moveTime: Array<IntArray>): Int {
              val n = moveTime.size
              val m = moveTime[0].size
              val total = n * m
              val SH = 1048576L
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              val dist = LongArray(total) { Long.MAX_VALUE }
              dist[0] = 0L
              val heap = PriorityQueue<Long>()
              heap.add(0L)
              while (heap.isNotEmpty()) {
                  val key = heap.poll()
                  val idx = (key % SH).toInt()
                  val t = key / SH
                  if (t > dist[idx]) continue
                  if (idx == total - 1) return t.toInt()
                  val r = idx / m
                  val c = idx % m
                  val cost = (r + c) % 2 + 1
                  for (d in 0 until 4) {
                      val nr = r + DR[d]
                      val nc = c + DC[d]
                      if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue
                      val nt = maxOf(t, moveTime[nr][nc].toLong()) + cost
                      val ni = nr * m + nc
                      if (nt < dist[ni]) { dist[ni] = nt; heap.add(nt * SH + ni) }
                  }
              }
              return -1
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

          func minTimeToReach(_ moveTime: [[Int]]) -> Int {
              let n = moveTime.count, m = moveTime[0].count, total = n * m
              let SH = 1048576
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var dist = [Int](repeating: Int.max, count: total)
              dist[0] = 0
              var heap = [0]
              while !heap.isEmpty {
                  let key = hpPop(&heap)
                  let idx = key % SH, t = key / SH
                  if t > dist[idx] { continue }
                  if idx == total - 1 { return t }
                  let r = idx / m, c = idx % m, cost = (r + c) % 2 + 1
                  for d in 0..<4 {
                      let nr = r + DR[d], nc = c + DC[d]
                      if nr < 0 || nr >= n || nc < 0 || nc >= m { continue }
                      let nt = max(t, moveTime[nr][nc]) + cost
                      let ni = nr * m + nc
                      if nt < dist[ni] { dist[ni] = nt; hpPush(&heap, nt * SH + ni) }
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minTimeToReach(moveTime: Vec<Vec<i32>>) -> i32 {
              let n = moveTime.len() as i32;
              let m = moveTime[0].len() as i32;
              let total = (n * m) as usize;
              let dr = [1, -1, 0, 0];
              let dc = [0, 0, 1, -1];
              let mut dist = vec![std::i64::MAX; total];
              let mut heap = BinaryHeap::new();
              dist[0] = 0;
              heap.push(Reverse((0i64, 0usize)));
              while let Some(Reverse((t, idx))) = heap.pop() {
                  if t > dist[idx] {
                      continue;
                  }
                  if idx == total - 1 {
                      return t as i32;
                  }
                  let r = idx as i32 / m;
                  let c = idx as i32 % m;
                  let cost = ((r + c) % 2 + 1) as i64;
                  for d in 0..4 {
                      let nr = r + dr[d];
                      let nc = c + dc[d];
                      if nr < 0 || nr >= n || nc < 0 || nc >= m {
                          continue;
                      }
                      let nt = std::cmp::max(t, moveTime[nr as usize][nc as usize] as i64) + cost;
                      let ni = (nr * m + nc) as usize;
                      if nt < dist[ni] {
                          dist[ni] = nt;
                          heap.push(Reverse((nt, ni)));
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minTimeToReach($moveTime) {
              $n = count($moveTime);
              $m = count($moveTime[0]);
              $total = $n * $m;
              $SH = 1048576;
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              $dist = array_fill(0, $total, PHP_INT_MAX);
              $dist[0] = 0;
              $heap = new \SplMinHeap();
              $heap->insert(0);
              while (!$heap->isEmpty()) {
                  $key = $heap->extract();
                  $idx = $key % $SH;
                  $t = intdiv($key, $SH);
                  if ($t > $dist[$idx]) continue;
                  if ($idx == $total - 1) return $t;
                  $r = intdiv($idx, $m);
                  $c = $idx % $m;
                  $cost = ($r + $c) % 2 + 1;
                  for ($d = 0; $d < 4; $d++) {
                      $nr = $r + $DR[$d];
                      $nc = $c + $DC[$d];
                      if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $m) continue;
                      $nt = max($t, $moveTime[$nr][$nc]) + $cost;
                      $ni = $nr * $m + $nc;
                      if ($nt < $dist[$ni]) { $dist[$ni] = $nt; $heap->insert($nt * $SH + $ni); }
                  }
              }
              return -1;
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

          def minTimeToReach(moveTime)
            n = moveTime.length
            m = moveTime[0].length
            total = n * m
            sh = 1_048_576
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            dist = Array.new(total, Float::INFINITY)
            dist[0] = 0
            heap = [0]
            until heap.empty?
              key = hp_pop(heap)
              idx = key % sh
              t = key / sh
              next if t > dist[idx]
              return t if idx == total - 1
              r = idx / m
              c = idx % m
              cost = (r + c) % 2 + 1
              dirs.each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next if nr < 0 || nr >= n || nc < 0 || nc >= m
                nt = [t, moveTime[nr][nc]].max + cost
                ni = nr * m + nc
                if nt < dist[ni]
                  dist[ni] = nt
                  hp_push(heap, nt * sh + ni)
                end
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Maximize the Number of Target Nodes After Connecting Trees I (LC 3372) ──
  (() => {
    const within = (edges: number[][], lim: number) => {
      const n = edges.length + 1;
      const adj = adjOf(n, edges);
      return Array.from({ length: n }, (_, s) => {
        if (lim < 0) return 0;
        const d = new Array(n).fill(-1);
        d[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (d[v] < 0) { d[v] = d[q[h]] + 1; q.push(v); }
        return d.filter((x) => x >= 0 && x <= lim).length;
      });
    };
    const ref = (edges1: number[][], edges2: number[][], k: number) => {
      const a = within(edges1, k);
      const best = Math.max(...within(edges2, k - 1));
      return a.map((x) => x + best);
    };
    return {
      slug: "maximize-the-number-of-target-nodes-after-connecting-trees-i",
      title: "Maximize the Number of Target Nodes After Connecting Trees I",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google"],
      signature: { funcName: "maxTargetNodes", params: [{ name: "edges1", type: "int[][]" as const }, { name: "edges2", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "There are two undirected trees: the first has `n` nodes labelled `0` to `n - 1` with edges `edges1`, the second has `m` nodes labelled `0` to `m - 1` with edges `edges2`. You are also given an integer `k`.\n\nNode `u` is a **target** of node `v` if the path between them has at most `k` edges. A node is always a target of itself.\n\nFor every node `i` of the first tree, you may add **one** edge joining any node of the first tree to any node of the second tree, and then count the targets of `i` in the combined tree. Each `i` is answered independently — the added edge is removed before the next one.\n\nReturn an array `answer` of length `n` where `answer[i]` is the maximum possible number of targets of node `i`.",
        [
          { in: "edges1 = [[0,1],[0,2],[2,3],[2,4]], edges2 = [[0,1],[0,2],[0,3],[2,7],[1,4],[4,5],[4,6]], k = 2", out: "[9,7,9,8,8]", note: "Node 0 already reaches all 5 nodes of its tree within 2 edges; joining it to node 0 of the second tree adds the 4 nodes within 1 edge of that node." },
          { in: "edges1 = [[0,1],[0,2],[0,3],[0,4]], edges2 = [[0,1],[1,2],[2,3]], k = 1", out: "[6,3,3,3,3]", note: "The new edge costs one step, so only the second tree's endpoint itself can be reached." },
          { in: "edges1 = [[0,1]], edges2 = [[0,1]], k = 0", out: "[1,1]", note: "With k = 0 the only target is the node itself; the second tree is out of reach." },
        ],
        ["2 <= n, m <= 1000", "edges1.length == n - 1", "edges2.length == m - 1", "edges1[i].length == edges2[i].length == 2", "the inputs are valid trees", "0 <= k <= 1000"]),
      hints: [
        "The new edge is one step long, so from `i` you can reach second-tree nodes within `k - 1` steps of the endpoint you connect to.",
        "That makes the two trees independent: the best endpoint in the second tree is the same for every `i` — the node with the most nodes within distance `k - 1`.",
        "With at most 1000 nodes per tree, a BFS from every node (stopping at the distance limit) counts the nodes within reach. Connect `i` itself to the best second-tree node: `answer[i] = within1(i, k) + max within2(j, k - 1)`.",
      ],
      editorial: explain({
        idea: "Joining `i` directly to some node `j` of the second tree is always best, since any other attachment point only lengthens the paths into the second tree. The answer splits into two independent counts: targets inside the first tree, plus the best second-tree node's count of nodes within `k - 1`.",
        steps: [
          "For every node of the first tree, BFS up to depth `k` and count the nodes reached.",
          "If `k == 0`, the second tree contributes nothing. Otherwise BFS from every node of the second tree up to depth `k - 1` and take the maximum count.",
          "`answer[i] = count1[i] + best2`.",
        ],
        why: "Every path from `i` into the second tree crosses the new edge, which costs one step. Attaching that edge at `i` itself leaves `k - 1` steps for the second tree; attaching it elsewhere in the first tree only leaves fewer. Inside the first tree the new edge is useless (it leads away). So both parts are maximised independently.",
        time: "O(n² + m²)",
        space: "O(n + m)",
        pitfalls: [
          "With `k = 0` the second tree contributes 0, not 1 — reaching it takes one step.",
          "The second tree's budget is `k - 1`, not `k`.",
          "Stop each BFS at the depth limit, or the counts include nodes that are too far.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2],[2,3],[2,4]]\n[[0,1],[0,2],[0,3],[2,7],[1,4],[4,5],[4,6]]\n2", expectedOutput: "[9,7,9,8,8]" },
        { input: "[[0,1],[0,2],[0,3],[0,4]]\n[[0,1],[1,2],[2,3]]\n1", expectedOutput: "[6,3,3,3,3]" },
        { input: "[[0,1]]\n[[0,1]]\n0", expectedOutput: "[1,1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 6, 8, 11]), m = pick(rng, [2, 3, 4, 6, 8, 11]);
        const edges1 = randTree(rng, n), edges2 = randTree(rng, m);
        const k = pick(rng, [0, 1, 1, 2, 2, 3, 4, 6, 30]);
        return { input: `${fmtIntMat(edges1)}\n${fmtIntMat(edges2)}\n${k}`, expectedOutput: fmtIntArr(ref(edges1, edges2, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxTargetNodes(edges1: List[List[int]], edges2: List[List[int]], k: int) -> List[int]:
              best = max(_within(edges2, k - 1))
              return [x + best for x in _within(edges1, k)]

          def _within(edges: List[List[int]], lim: int) -> List[int]:
              n = len(edges) + 1
              res = [0] * n
              if lim < 0:
                  return res
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              for s in range(n):
                  dist = [-1] * n
                  dist[s] = 0
                  q = [s]
                  for u in q:
                      if dist[u] == lim:
                          continue
                      for v in adj[u]:
                          if dist[v] < 0:
                              dist[v] = dist[u] + 1
                              q.append(v)
                  res[s] = len(q)
              return res
        `,
        javascript: code`
          var maxTargetNodes = function(edges1, edges2, k) {
              var b = within(edges2, k - 1), best = 0;
              for (var i = 0; i < b.length; i++) if (b[i] > best) best = b[i];
              var a = within(edges1, k), ans = [];
              for (var j = 0; j < a.length; j++) ans.push(a[j] + best);
              return ans;
          };

          var within = function(edges, lim) {
              var n = edges.length + 1, res = [], adj = [], dist = [];
              for (var i = 0; i < n; i++) { res.push(0); adj.push([]); dist.push(-1); }
              if (lim < 0) return res;
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              for (var s = 0; s < n; s++) {
                  for (var z = 0; z < n; z++) dist[z] = -1;
                  dist[s] = 0;
                  var q = [s];
                  for (var h = 0; h < q.length; h++) {
                      var u = q[h];
                      if (dist[u] === lim) continue;
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }
                      }
                  }
                  res[s] = q.length;
              }
              return res;
          };
        `,
        typescript: code`
          function within(edges: number[][], lim: number): number[] {
              var n = edges.length + 1, res: number[] = [], adj: number[][] = [], dist: number[] = [];
              for (var i = 0; i < n; i++) { res.push(0); adj.push([]); dist.push(-1); }
              if (lim < 0) return res;
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              for (var s = 0; s < n; s++) {
                  for (var z = 0; z < n; z++) dist[z] = -1;
                  dist[s] = 0;
                  var q: number[] = [s];
                  for (var h = 0; h < q.length; h++) {
                      var u = q[h];
                      if (dist[u] === lim) continue;
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }
                      }
                  }
                  res[s] = q.length;
              }
              return res;
          }

          function maxTargetNodes(edges1: number[][], edges2: number[][], k: number): number[] {
              var b = within(edges2, k - 1), best = 0;
              for (var i = 0; i < b.length; i++) if (b[i] > best) best = b[i];
              var a = within(edges1, k), ans: number[] = [];
              for (var j = 0; j < a.length; j++) ans.push(a[j] + best);
              return ans;
          }
        `,
        java: code`
          static int[] within(int[][] edges, int lim) {
              int n = edges.length + 1;
              int[] res = new int[n];
              if (lim < 0) return res;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] dist = new int[n], q = new int[n];
              for (int s = 0; s < n; s++) {
                  Arrays.fill(dist, -1);
                  dist[s] = 0;
                  int tail = 0;
                  q[tail++] = s;
                  for (int h = 0; h < tail; h++) {
                      int u = q[h];
                      if (dist[u] == lim) continue;
                      for (int v : adj.get(u)) if (dist[v] < 0) { dist[v] = dist[u] + 1; q[tail++] = v; }
                  }
                  res[s] = tail;
              }
              return res;
          }

          public static int[] maxTargetNodes(int[][] edges1, int[][] edges2, int k) {
              int best = 0;
              for (int x : within(edges2, k - 1)) best = Math.max(best, x);
              int[] a = within(edges1, k);
              for (int i = 0; i < a.length; i++) a[i] += best;
              return a;
          }
        `,
        cpp: code`
          vector<int> within(vector<vector<int>>& edges, int lim) {
              int n = edges.size() + 1;
              vector<int> res(n, 0);
              if (lim < 0) return res;
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> dist(n), q(n);
              for (int s = 0; s < n; s++) {
                  fill(dist.begin(), dist.end(), -1);
                  dist[s] = 0;
                  int tail = 0;
                  q[tail++] = s;
                  for (int h = 0; h < tail; h++) {
                      int u = q[h];
                      if (dist[u] == lim) continue;
                      for (int v : adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q[tail++] = v; }
                  }
                  res[s] = tail;
              }
              return res;
          }

          vector<int> maxTargetNodes(vector<vector<int>>& edges1, vector<vector<int>>& edges2, int k) {
              vector<int> b = within(edges2, k - 1);
              int best = *max_element(b.begin(), b.end());
              vector<int> a = within(edges1, k);
              for (int& x : a) x += best;
              return a;
          }
        `,
        c: code`
          static int* within(int** edges, int edgesSize, int lim) {
              int n = edgesSize + 1;
              int* res = (int*)calloc(n, sizeof(int));
              if (lim < 0) return res;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0] + 1]++; first[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* dist = (int*)malloc(n * sizeof(int));
              int* q = (int*)malloc(n * sizeof(int));
              for (int s = 0; s < n; s++) {
                  for (int i = 0; i < n; i++) dist[i] = -1;
                  dist[s] = 0;
                  int tail = 0;
                  q[tail++] = s;
                  for (int h = 0; h < tail; h++) {
                      int u = q[h];
                      if (dist[u] == lim) continue;
                      for (int k = first[u]; k < first[u + 1]; k++) {
                          int v = adj[k];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; q[tail++] = v; }
                      }
                  }
                  res[s] = tail;
              }
              free(first); free(fill); free(adj); free(dist); free(q);
              return res;
          }

          int* maxTargetNodes(int** edges1, int edges1Size, int* edges1ColSize, int** edges2, int edges2Size, int* edges2ColSize, int k, int* returnSize) {
              int* b = within(edges2, edges2Size, k - 1);
              int best = 0;
              for (int i = 0; i <= edges2Size; i++) if (b[i] > best) best = b[i];
              free(b);
              int* a = within(edges1, edges1Size, k);
              for (int i = 0; i <= edges1Size; i++) a[i] += best;
              *returnSize = edges1Size + 1;
              return a;
          }
        `,
        csharp: code`
          static int[] Within(int[][] edges, int lim)
          {
              int n = edges.Length + 1;
              var res = new int[n];
              if (lim < 0) return res;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var dist = new int[n];
              var q = new int[n];
              for (int s = 0; s < n; s++)
              {
                  for (int i = 0; i < n; i++) dist[i] = -1;
                  dist[s] = 0;
                  int tail = 0;
                  q[tail++] = s;
                  for (int h = 0; h < tail; h++)
                  {
                      int u = q[h];
                      if (dist[u] == lim) continue;
                      foreach (int v in adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q[tail++] = v; }
                  }
                  res[s] = tail;
              }
              return res;
          }

          public static int[] MaxTargetNodes(int[][] edges1, int[][] edges2, int k)
          {
              int best = 0;
              foreach (int x in Within(edges2, k - 1)) best = Math.Max(best, x);
              var a = Within(edges1, k);
              for (int i = 0; i < a.Length; i++) a[i] += best;
              return a;
          }
        `,
        go: code`
          func within(edges [][]int, lim int) []int {
          	n := len(edges) + 1
          	res := make([]int, n)
          	if lim < 0 {
          		return res
          	}
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	dist := make([]int, n)
          	q := make([]int, n)
          	for s := 0; s < n; s++ {
          		for i := range dist {
          			dist[i] = -1
          		}
          		dist[s] = 0
          		tail := 0
          		q[tail] = s
          		tail++
          		for h := 0; h < tail; h++ {
          			u := q[h]
          			if dist[u] == lim {
          				continue
          			}
          			for _, v := range adj[u] {
          				if dist[v] < 0 {
          					dist[v] = dist[u] + 1
          					q[tail] = v
          					tail++
          				}
          			}
          		}
          		res[s] = tail
          	}
          	return res
          }

          func maxTargetNodes(edges1 [][]int, edges2 [][]int, k int) []int {
          	best := 0
          	for _, x := range within(edges2, k-1) {
          		if x > best {
          			best = x
          		}
          	}
          	a := within(edges1, k)
          	for i := range a {
          		a[i] += best
          	}
          	return a
          }
        `,
        kotlin: code`
          fun within(edges: Array<IntArray>, lim: Int): IntArray {
              val n = edges.size + 1
              val res = IntArray(n)
              if (lim < 0) return res
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val dist = IntArray(n)
              val q = IntArray(n)
              for (s in 0 until n) {
                  dist.fill(-1)
                  dist[s] = 0
                  var tail = 0
                  q[tail++] = s
                  var h = 0
                  while (h < tail) {
                      val u = q[h++]
                      if (dist[u] == lim) continue
                      for (v in adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q[tail++] = v }
                  }
                  res[s] = tail
              }
              return res
          }

          fun maxTargetNodes(edges1: Array<IntArray>, edges2: Array<IntArray>, k: Int): IntArray {
              var best = 0
              for (x in within(edges2, k - 1)) if (x > best) best = x
              val a = within(edges1, k)
              for (i in a.indices) a[i] += best
              return a
          }
        `,
        swift: code`
          func within(_ edges: [[Int]], _ lim: Int) -> [Int] {
              let n = edges.count + 1
              var res = [Int](repeating: 0, count: n)
              if lim < 0 { return res }
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var dist = [Int](repeating: -1, count: n)
              var q = [Int](repeating: 0, count: n)
              for s in 0..<n {
                  for i in 0..<n { dist[i] = -1 }
                  dist[s] = 0
                  var tail = 0
                  q[tail] = s
                  tail += 1
                  var h = 0
                  while h < tail {
                      let u = q[h]
                      h += 1
                      if dist[u] == lim { continue }
                      for v in adj[u] where dist[v] < 0 {
                          dist[v] = dist[u] + 1
                          q[tail] = v
                          tail += 1
                      }
                  }
                  res[s] = tail
              }
              return res
          }

          func maxTargetNodes(_ edges1: [[Int]], _ edges2: [[Int]], _ k: Int) -> [Int] {
              let best = within(edges2, k - 1).max() ?? 0
              return within(edges1, k).map { $0 + best }
          }
        `,
        rust: code`
          fn within(edges: &Vec<Vec<i32>>, lim: i32) -> Vec<i32> {
              let n = edges.len() + 1;
              let mut res = vec![0i32; n];
              if lim < 0 {
                  return res;
              }
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut dist = vec![-1i32; n];
              let mut q = vec![0usize; n];
              for s in 0..n {
                  for i in 0..n {
                      dist[i] = -1;
                  }
                  dist[s] = 0;
                  let mut tail = 0;
                  q[tail] = s;
                  tail += 1;
                  let mut h = 0;
                  while h < tail {
                      let u = q[h];
                      h += 1;
                      if dist[u] == lim {
                          continue;
                      }
                      for &v in adj[u].iter() {
                          if dist[v] < 0 {
                              dist[v] = dist[u] + 1;
                              q[tail] = v;
                              tail += 1;
                          }
                      }
                  }
                  res[s] = tail as i32;
              }
              res
          }

          fn maxTargetNodes(edges1: Vec<Vec<i32>>, edges2: Vec<Vec<i32>>, k: i32) -> Vec<i32> {
              let best = *within(&edges2, k - 1).iter().max().unwrap();
              within(&edges1, k).iter().map(|x| x + best).collect()
          }
        `,
        php: code`
          function within($edges, $lim) {
              $n = count($edges) + 1;
              $res = array_fill(0, $n, 0);
              if ($lim < 0) return $res;
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              for ($s = 0; $s < $n; $s++) {
                  $dist = array_fill(0, $n, -1);
                  $dist[$s] = 0;
                  $q = [$s];
                  for ($h = 0; $h < count($q); $h++) {
                      $u = $q[$h];
                      if ($dist[$u] == $lim) continue;
                      foreach ($adj[$u] as $v) if ($dist[$v] < 0) { $dist[$v] = $dist[$u] + 1; $q[] = $v; }
                  }
                  $res[$s] = count($q);
              }
              return $res;
          }

          function maxTargetNodes($edges1, $edges2, $k) {
              $best = max(within($edges2, $k - 1));
              $ans = [];
              foreach (within($edges1, $k) as $x) $ans[] = $x + $best;
              return $ans;
          }
        `,
        ruby: code`
          def within(edges, lim)
            n = edges.length + 1
            return Array.new(n, 0) if lim < 0
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            Array.new(n) do |s|
              dist = Array.new(n, -1)
              dist[s] = 0
              q = [s]
              h = 0
              while h < q.length
                u = q[h]
                h += 1
                next if dist[u] == lim
                adj[u].each do |v|
                  next if dist[v] >= 0
                  dist[v] = dist[u] + 1
                  q << v
                end
              end
              q.length
            end
          end

          def maxTargetNodes(edges1, edges2, k)
            best = within(edges2, k - 1).max
            within(edges1, k).map { |x| x + best }
          end
        `,
      },
    };
  })(),

  // ── Maximize the Number of Target Nodes After Connecting Trees II (LC 3373) ──
  (() => {
    const evenTargets = (edges: number[][]) => {
      const n = edges.length + 1;
      const adj = adjOf(n, edges);
      return Array.from({ length: n }, (_, s) => {
        const d = new Array(n).fill(-1);
        d[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (d[v] < 0) { d[v] = d[q[h]] + 1; q.push(v); }
        return d.filter((x) => x % 2 === 0).length;
      });
    };
    const ref = (edges1: number[][], edges2: number[][]) => {
      const m = edges2.length + 1;
      // In the second tree we want nodes at ODD distance from the endpoint (the new edge adds one).
      const best = Math.max(...evenTargets(edges2).map((e) => m - e));
      return evenTargets(edges1).map((x) => x + best);
    };
    return {
      slug: "maximize-the-number-of-target-nodes-after-connecting-trees-ii",
      title: "Maximize the Number of Target Nodes After Connecting Trees II",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google"],
      signature: { funcName: "maxTargetNodes", params: [{ name: "edges1", type: "int[][]" as const }, { name: "edges2", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "There are two undirected trees: the first has `n` nodes labelled `0` to `n - 1` with edges `edges1`, the second has `m` nodes labelled `0` to `m - 1` with edges `edges2`.\n\nNode `u` is a **target** of node `v` if the path between them has an **even** number of edges. A node is always a target of itself (zero edges).\n\nFor every node `i` of the first tree, you may add **one** edge joining any node of the first tree to any node of the second tree, and then count the targets of `i` in the combined tree. Each `i` is answered independently — the added edge is removed before the next one.\n\nReturn an array `answer` of length `n` where `answer[i]` is the maximum possible number of targets of node `i`.",
        [
          { in: "edges1 = [[0,1],[0,2],[2,3],[2,4]], edges2 = [[0,1],[0,2],[0,3],[2,7],[1,4],[4,5],[4,6]]", out: "[8,7,7,8,8]", note: "Node 0 has the even-distance nodes 0, 3 and 4 in its own tree; the best attachment adds 5 nodes of the second tree." },
          { in: "edges1 = [[0,1],[0,2],[0,3],[0,4]], edges2 = [[0,1],[1,2],[2,3]]", out: "[3,6,6,6,6]" },
          { in: "edges1 = [[0,1]], edges2 = [[0,1]]", out: "[2,2]", note: "Each node is its own target, and attaching it to one node of the second tree reaches the other at distance 2." },
        ],
        ["2 <= n, m <= 10^5", "edges1.length == n - 1", "edges2.length == m - 1", "edges1[i].length == edges2[i].length == 2", "the inputs are valid trees"]),
      hints: [
        "In a tree, the distance between two nodes is even exactly when their depths have the same parity. So 2-colour each tree by depth parity.",
        "Inside the first tree, the targets of `i` are the nodes with the same colour as `i`.",
        "Every path into the second tree crosses the new edge, which flips parity. Choosing the endpoint's colour well, you can always collect the larger colour class of the second tree: `answer[i] = |colour class of i| + max(class sizes of tree 2)`.",
      ],
      editorial: explain({
        idea: "Parity of a tree path equals the parity of the difference of the two depths, so a 2-colouring answers every \"even distance\" question at once. The second tree contributes its larger colour class regardless of `i`.",
        steps: [
          "BFS the first tree from 0, colouring each node by depth parity, and count both colours.",
          "BFS the second tree the same way and take `best = max(count0, count1)`.",
          "`answer[i] = count1[colour of i] + best`.",
        ],
        why: "Two nodes of one tree are at even distance iff they share a colour. A path from `i` into the second tree goes from `i` to the attachment point `a`, across the new edge to `b`, then to `w`. Attaching at `a = i` costs nothing, and the parity of the total is `1 + dist(b, w)`, so the targets are the nodes coloured opposite to `b`. Picking `b` in the smaller class hands you the larger one, and no choice can do better.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Running a BFS from every node is O(n²), too slow for 10^5 — the colour classes answer everything.",
          "The new edge adds one to every path into the second tree, so the endpoint itself is at odd distance.",
          "A node is its own target: count it in its colour class.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2],[2,3],[2,4]]\n[[0,1],[0,2],[0,3],[2,7],[1,4],[4,5],[4,6]]", expectedOutput: "[8,7,7,8,8]" },
        { input: "[[0,1],[0,2],[0,3],[0,4]]\n[[0,1],[1,2],[2,3]]", expectedOutput: "[3,6,6,6,6]" },
        { input: "[[0,1]]\n[[0,1]]", expectedOutput: "[2,2]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 5, 8, 12, 20, 30]), m = pick(rng, [2, 3, 5, 8, 12, 20, 30]);
        const edges1 = randTree(rng, n), edges2 = randTree(rng, m);
        return { input: `${fmtIntMat(edges1)}\n${fmtIntMat(edges2)}`, expectedOutput: fmtIntArr(ref(edges1, edges2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxTargetNodes(edges1: List[List[int]], edges2: List[List[int]]) -> List[int]:
              c2 = _colour(edges2)
              ones = sum(c2)
              best = max(ones, len(c2) - ones)
              c1 = _colour(edges1)
              cnt = [len(c1) - sum(c1), sum(c1)]
              return [cnt[c] + best for c in c1]

          def _colour(edges: List[List[int]]) -> List[int]:
              n = len(edges) + 1
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              col = [-1] * n
              col[0] = 0
              q = [0]
              for u in q:
                  for v in adj[u]:
                      if col[v] < 0:
                          col[v] = col[u] ^ 1
                          q.append(v)
              return col
        `,
        javascript: code`
          var maxTargetNodes = function(edges1, edges2) {
              var c2 = colour(edges2), ones = 0;
              for (var i = 0; i < c2.length; i++) ones += c2[i];
              var best = Math.max(ones, c2.length - ones);
              var c1 = colour(edges1), cnt = [0, 0];
              for (var j = 0; j < c1.length; j++) cnt[c1[j]]++;
              var ans = [];
              for (var k = 0; k < c1.length; k++) ans.push(cnt[c1[k]] + best);
              return ans;
          };

          var colour = function(edges) {
              var n = edges.length + 1, adj = [], col = [];
              for (var i = 0; i < n; i++) { adj.push([]); col.push(-1); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              col[0] = 0;
              var q = [0];
              for (var h = 0; h < q.length; h++) {
                  var u = q[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (col[v] < 0) { col[v] = col[u] ^ 1; q.push(v); }
                  }
              }
              return col;
          };
        `,
        typescript: code`
          function colour(edges: number[][]): number[] {
              var n = edges.length + 1, adj: number[][] = [], col: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); col.push(-1); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              col[0] = 0;
              var q: number[] = [0];
              for (var h = 0; h < q.length; h++) {
                  var u = q[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (col[v] < 0) { col[v] = col[u] ^ 1; q.push(v); }
                  }
              }
              return col;
          }

          function maxTargetNodes(edges1: number[][], edges2: number[][]): number[] {
              var c2 = colour(edges2), ones = 0;
              for (var i = 0; i < c2.length; i++) ones += c2[i];
              var best = Math.max(ones, c2.length - ones);
              var c1 = colour(edges1), cnt = [0, 0];
              for (var j = 0; j < c1.length; j++) cnt[c1[j]]++;
              var ans: number[] = [];
              for (var k = 0; k < c1.length; k++) ans.push(cnt[c1[k]] + best);
              return ans;
          }
        `,
        java: code`
          static int[] colour(int[][] edges) {
              int n = edges.length + 1;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] col = new int[n], q = new int[n];
              Arrays.fill(col, -1);
              col[0] = 0;
              int tail = 0;
              q[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = q[h];
                  for (int v : adj.get(u)) if (col[v] < 0) { col[v] = col[u] ^ 1; q[tail++] = v; }
              }
              return col;
          }

          public static int[] maxTargetNodes(int[][] edges1, int[][] edges2) {
              int[] c2 = colour(edges2);
              int ones = 0;
              for (int c : c2) ones += c;
              int best = Math.max(ones, c2.length - ones);
              int[] c1 = colour(edges1);
              int[] cnt = new int[2];
              for (int c : c1) cnt[c]++;
              int[] ans = new int[c1.length];
              for (int i = 0; i < c1.length; i++) ans[i] = cnt[c1[i]] + best;
              return ans;
          }
        `,
        cpp: code`
          vector<int> colour(vector<vector<int>>& edges) {
              int n = edges.size() + 1;
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> col(n, -1), q;
              col[0] = 0;
              q.push_back(0);
              for (size_t h = 0; h < q.size(); h++) {
                  int u = q[h];
                  for (int v : adj[u]) if (col[v] < 0) { col[v] = col[u] ^ 1; q.push_back(v); }
              }
              return col;
          }

          vector<int> maxTargetNodes(vector<vector<int>>& edges1, vector<vector<int>>& edges2) {
              vector<int> c2 = colour(edges2);
              int ones = 0;
              for (int c : c2) ones += c;
              int best = max(ones, (int) c2.size() - ones);
              vector<int> c1 = colour(edges1);
              int cnt[2] = {0, 0};
              for (int c : c1) cnt[c]++;
              vector<int> ans(c1.size());
              for (size_t i = 0; i < c1.size(); i++) ans[i] = cnt[c1[i]] + best;
              return ans;
          }
        `,
        c: code`
          static int* colour(int** edges, int edgesSize) {
              int n = edgesSize + 1;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0] + 1]++; first[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* col = (int*)malloc(n * sizeof(int));
              int* q = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) col[i] = -1;
              col[0] = 0;
              int tail = 0;
              q[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = q[h];
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (col[v] < 0) { col[v] = col[u] ^ 1; q[tail++] = v; }
                  }
              }
              free(first); free(fill); free(adj); free(q);
              return col;
          }

          int* maxTargetNodes(int** edges1, int edges1Size, int* edges1ColSize, int** edges2, int edges2Size, int* edges2ColSize, int* returnSize) {
              int m = edges2Size + 1, n = edges1Size + 1;
              int* c2 = colour(edges2, edges2Size);
              int ones = 0;
              for (int i = 0; i < m; i++) ones += c2[i];
              int best = ones > m - ones ? ones : m - ones;
              free(c2);
              int* c1 = colour(edges1, edges1Size);
              int cnt[2] = {0, 0};
              for (int i = 0; i < n; i++) cnt[c1[i]]++;
              for (int i = 0; i < n; i++) c1[i] = cnt[c1[i]] + best;
              *returnSize = n;
              return c1;
          }
        `,
        csharp: code`
          static int[] Colour(int[][] edges)
          {
              int n = edges.Length + 1;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var col = new int[n];
              var q = new int[n];
              for (int i = 0; i < n; i++) col[i] = -1;
              col[0] = 0;
              int tail = 0;
              q[tail++] = 0;
              for (int h = 0; h < tail; h++)
              {
                  int u = q[h];
                  foreach (int v in adj[u]) if (col[v] < 0) { col[v] = col[u] ^ 1; q[tail++] = v; }
              }
              return col;
          }

          public static int[] MaxTargetNodes(int[][] edges1, int[][] edges2)
          {
              var c2 = Colour(edges2);
              int ones = 0;
              foreach (int c in c2) ones += c;
              int best = Math.Max(ones, c2.Length - ones);
              var c1 = Colour(edges1);
              var cnt = new int[2];
              foreach (int c in c1) cnt[c]++;
              var ans = new int[c1.Length];
              for (int i = 0; i < c1.Length; i++) ans[i] = cnt[c1[i]] + best;
              return ans;
          }
        `,
        go: code`
          func colour(edges [][]int) []int {
          	n := len(edges) + 1
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	col := make([]int, n)
          	for i := range col {
          		col[i] = -1
          	}
          	col[0] = 0
          	q := []int{0}
          	for h := 0; h < len(q); h++ {
          		u := q[h]
          		for _, v := range adj[u] {
          			if col[v] < 0 {
          				col[v] = col[u] ^ 1
          				q = append(q, v)
          			}
          		}
          	}
          	return col
          }

          func maxTargetNodes(edges1 [][]int, edges2 [][]int) []int {
          	c2 := colour(edges2)
          	ones := 0
          	for _, c := range c2 {
          		ones += c
          	}
          	best := ones
          	if len(c2)-ones > best {
          		best = len(c2) - ones
          	}
          	c1 := colour(edges1)
          	cnt := [2]int{}
          	for _, c := range c1 {
          		cnt[c]++
          	}
          	ans := make([]int, len(c1))
          	for i, c := range c1 {
          		ans[i] = cnt[c] + best
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun colour(edges: Array<IntArray>): IntArray {
              val n = edges.size + 1
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val col = IntArray(n) { -1 }
              val q = IntArray(n)
              col[0] = 0
              var tail = 0
              q[tail++] = 0
              var h = 0
              while (h < tail) {
                  val u = q[h++]
                  for (v in adj[u]) if (col[v] < 0) { col[v] = col[u] xor 1; q[tail++] = v }
              }
              return col
          }

          fun maxTargetNodes(edges1: Array<IntArray>, edges2: Array<IntArray>): IntArray {
              val c2 = colour(edges2)
              val ones = c2.sum()
              val best = maxOf(ones, c2.size - ones)
              val c1 = colour(edges1)
              val cnt = IntArray(2)
              for (c in c1) cnt[c]++
              return IntArray(c1.size) { cnt[c1[it]] + best }
          }
        `,
        swift: code`
          func colour(_ edges: [[Int]]) -> [Int] {
              let n = edges.count + 1
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var col = [Int](repeating: -1, count: n)
              col[0] = 0
              var q = [0]
              var h = 0
              while h < q.count {
                  let u = q[h]
                  h += 1
                  for v in adj[u] where col[v] < 0 {
                      col[v] = col[u] ^ 1
                      q.append(v)
                  }
              }
              return col
          }

          func maxTargetNodes(_ edges1: [[Int]], _ edges2: [[Int]]) -> [Int] {
              let c2 = colour(edges2)
              let ones = c2.reduce(0, +)
              let best = max(ones, c2.count - ones)
              let c1 = colour(edges1)
              var cnt = [0, 0]
              for c in c1 { cnt[c] += 1 }
              return c1.map { cnt[$0] + best }
          }
        `,
        rust: code`
          fn colour(edges: &Vec<Vec<i32>>) -> Vec<usize> {
              let n = edges.len() + 1;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut col = vec![2usize; n];
              col[0] = 0;
              let mut q: Vec<usize> = vec![0];
              let mut h = 0;
              while h < q.len() {
                  let u = q[h];
                  h += 1;
                  for &v in adj[u].iter() {
                      if col[v] == 2 {
                          col[v] = col[u] ^ 1;
                          q.push(v);
                      }
                  }
              }
              col
          }

          fn maxTargetNodes(edges1: Vec<Vec<i32>>, edges2: Vec<Vec<i32>>) -> Vec<i32> {
              let c2 = colour(&edges2);
              let ones = c2.iter().sum::<usize>() as i32;
              let best = std::cmp::max(ones, c2.len() as i32 - ones);
              let c1 = colour(&edges1);
              let mut cnt = [0i32; 2];
              for &c in c1.iter() {
                  cnt[c] += 1;
              }
              c1.iter().map(|&c| cnt[c] + best).collect()
          }
        `,
        php: code`
          function colour($edges) {
              $n = count($edges) + 1;
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $col = array_fill(0, $n, -1);
              $col[0] = 0;
              $q = [0];
              for ($h = 0; $h < count($q); $h++) {
                  $u = $q[$h];
                  foreach ($adj[$u] as $v) if ($col[$v] < 0) { $col[$v] = $col[$u] ^ 1; $q[] = $v; }
              }
              return $col;
          }

          function maxTargetNodes($edges1, $edges2) {
              $c2 = colour($edges2);
              $ones = array_sum($c2);
              $best = max($ones, count($c2) - $ones);
              $c1 = colour($edges1);
              $cnt = [0, 0];
              foreach ($c1 as $c) $cnt[$c]++;
              $ans = [];
              foreach ($c1 as $c) $ans[] = $cnt[$c] + $best;
              return $ans;
          }
        `,
        ruby: code`
          def colour(edges)
            n = edges.length + 1
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            col = Array.new(n, -1)
            col[0] = 0
            q = [0]
            h = 0
            while h < q.length
              u = q[h]
              h += 1
              adj[u].each do |v|
                next if col[v] >= 0
                col[v] = col[u] ^ 1
                q << v
              end
            end
            col
          end

          def maxTargetNodes(edges1, edges2)
            c2 = colour(edges2)
            ones = c2.sum
            best = [ones, c2.length - ones].max
            c1 = colour(edges1)
            cnt = [0, 0]
            c1.each { |c| cnt[c] += 1 }
            c1.map { |c| cnt[c] + best }
          end
        `,
      },
    };
  })(),

  // ── Digit Operations to Make Two Integers Equal (LC 3377) ───────
  (() => {
    const ref = (n: number, m: number) => {
      const d = String(n).length;
      const lim = 10 ** d;
      const composite = new Array(lim).fill(false);
      composite[0] = composite[1] = true;
      for (let i = 2; i < lim; i++) {
        let prime = true;
        for (let j = 2; j * j <= i; j++) if (i % j === 0) { prime = false; break; }
        composite[i] = !prime;
      }
      if (!composite[n] || !composite[m]) return -1;
      const best = new Array(lim).fill(Infinity);
      best[n] = n;
      const q = [n];
      const inQ = new Array(lim).fill(false);
      inQ[n] = true;
      for (let h = 0; h < q.length; h++) {
        const x = q[h];
        inQ[x] = false;
        for (let p = 1, k = 0; k < d; k++, p *= 10) {
          const digit = Math.floor(x / p) % 10;
          for (const y of [digit < 9 ? x + p : -1, digit > 0 ? x - p : -1]) {
            if (y < 0 || !composite[y]) continue;
            if (best[x] + y < best[y]) { best[y] = best[x] + y; if (!inQ[y]) { inQ[y] = true; q.push(y); } }
          }
        }
      }
      return best[m] === Infinity ? -1 : best[m];
    };
    return {
      slug: "digit-operations-to-make-two-integers-equal",
      // Each case is a Dijkstra over up to 10^d states plus a sieve; 2,000 cases keep the slow judges well inside budget.
      hiddenCount: 2000,
      title: "Digit Operations to Make Two Integers Equal",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Graph", "Heap (Priority Queue)", "Number Theory", "Shortest Path", "Google"],
      signature: { funcName: "minOperations", params: [{ name: "n", type: "int" as const }, { name: "m", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given two integers `n` and `m` written with the same number of digits.\n\nYou may repeat either operation on `n` any number of times:\n\n- pick a digit of `n` that is not `9` and increase it by 1;\n- pick a digit of `n` that is not `0` and decrease it by 1.\n\n`n` keeps its number of digits throughout — a leading digit may drop to `0`, which simply makes the value smaller. The value of `n` must **never be a prime number**: not at the start, not after any operation, and not at the end.\n\nThe **cost** of a transformation is the sum of every value `n` takes, including its original value and its final value. Return the minimum cost to turn `n` into `m`, or `-1` if it is impossible.",
        [
          { in: "n = 10, m = 12", out: "85", note: "10 → 20 → 21 → 22 → 12 never visits a prime, and costs 10 + 20 + 21 + 22 + 12 = 85." },
          { in: "n = 4, m = 8", out: "-1", note: "Both neighbours of 4 (3 and 5) are prime, so `n` cannot move at all." },
          { in: "n = 6, m = 2", out: "-1", note: "The target 2 is prime." },
        ],
        ["1 <= n, m < 10^4", "n and m consist of the same number of digits"]),
      hints: [
        "Think of every number with the same digit count as a node, and an operation as an edge to a number that differs by `±10^k`.",
        "Entering a node costs its value, and the start counts too, so this is a shortest path with non-negative node weights: Dijkstra, starting with distance `n`.",
        "Sieve the primes below `10^d` first, never enter a prime node, and return `-1` up front if `n` or `m` is prime.",
      ],
      editorial: explain({
        idea: "The states are the at most `10^d` values with `d` digits, each operation is an edge, and the cost of a path is the sum of the node values on it. Dijkstra with \"entering `y` costs `y`\" finds the cheapest path.",
        steps: [
          "Let `d` be the digit count of `n`. Sieve primality for `0 … 10^d - 1` (0 and 1 are not prime).",
          "If `n` or `m` is prime, return `-1`.",
          "Run Dijkstra from `n` with `dist[n] = n`. From `x`, for each position `k` with digit `g`: if `g < 9`, `y = x + 10^k`; if `g > 0`, `y = x - 10^k`. Skip prime `y`; relax `dist[y] = dist[x] + y`.",
          "Return `dist[m]` when `m` is popped, or `-1` if the heap empties first.",
        ],
        why: "All node weights are positive, so moving the weight onto the edge that enters a node gives a graph with positive edge weights, where Dijkstra is exact. Forbidding prime nodes enforces the \"never prime\" rule at every step, and counting `n` in the initial distance includes the original value.",
        time: "O(10^d · d · log(10^d))",
        space: "O(10^d)",
        pitfalls: [
          "The original value and the final value both count in the cost.",
          "1 is not prime, so a path may pass through it; 2 is prime.",
          "If `n == m` and it is not prime, the answer is `n` itself, not 0.",
        ],
      }),
      examples: [
        { input: "10\n12", expectedOutput: "85" },
        { input: "4\n8", expectedOutput: "-1" },
        { input: "6\n2", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const d = roll < 0.35 ? 1 : roll < 0.85 ? 2 : roll < 0.997 ? 3 : 4;
        const lo = d === 1 ? 1 : 10 ** (d - 1), hi = 10 ** d - 1;
        const n = ri(rng, lo, hi);
        const m = rng() < 0.05 ? n : ri(rng, lo, hi);
        return { input: `${n}\n${m}`, expectedOutput: String(ref(n, m)) };
      },
      solutions: {
        python: code`
          import heapq

          def minOperations(n: int, m: int) -> int:
              d = len(str(n))
              lim = 10 ** d
              sieve = [True] * lim
              sieve[0] = False
              if lim > 1:
                  sieve[1] = False
              i = 2
              while i * i < lim:
                  if sieve[i]:
                      for j in range(i * i, lim, i):
                          sieve[j] = False
                  i += 1
              if sieve[n] or sieve[m]:
                  return -1
              dist = [float("inf")] * lim
              dist[n] = n
              heap = [(n, n)]
              while heap:
                  c, x = heapq.heappop(heap)
                  if c > dist[x]:
                      continue
                  if x == m:
                      return c
                  p = 1
                  for _ in range(d):
                      g = (x // p) % 10
                      for y in ((x + p) if g < 9 else -1, (x - p) if g > 0 else -1):
                          if y >= 0 and not sieve[y] and c + y < dist[y]:
                              dist[y] = c + y
                              heapq.heappush(heap, (c + y, y))
                      p *= 10
              return -1
        `,
        javascript: code`
          var minOperations = function(n, m) {
              var d = String(n).length, lim = 1, i, j;
              for (i = 0; i < d; i++) lim *= 10;
              var prime = [];
              for (i = 0; i < lim; i++) prime.push(i >= 2);
              for (i = 2; i * i < lim; i++) if (prime[i]) for (j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) return -1;
              var SH = 16384, dist = [];
              for (i = 0; i < lim; i++) dist.push(Infinity);
              dist[n] = n;
              var heap = [n * SH + n];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var x = key % SH, c = (key - x) / SH;
                  if (c > dist[x]) continue;
                  if (x === m) return c;
                  for (var p = 1, k = 0; k < d; k++, p *= 10) {
                      var g = Math.floor(x / p) % 10;
                      var cands = [g < 9 ? x + p : -1, g > 0 ? x - p : -1];
                      for (var t = 0; t < 2; t++) {
                          var y = cands[t];
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; heapPush(heap, (c + y) * SH + y); }
                      }
                  }
              }
              return -1;
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

          function minOperations(n: number, m: number): number {
              var d = String(n).length, lim = 1, i: number, j: number;
              for (i = 0; i < d; i++) lim *= 10;
              var prime: boolean[] = [];
              for (i = 0; i < lim; i++) prime.push(i >= 2);
              for (i = 2; i * i < lim; i++) if (prime[i]) for (j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) return -1;
              var SH = 16384, dist: number[] = [];
              for (i = 0; i < lim; i++) dist.push(Infinity);
              dist[n] = n;
              var heap: number[] = [n * SH + n];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var x = key % SH, c = (key - x) / SH;
                  if (c > dist[x]) continue;
                  if (x === m) return c;
                  for (var p = 1, k = 0; k < d; k++, p *= 10) {
                      var g = Math.floor(x / p) % 10;
                      var cands = [g < 9 ? x + p : -1, g > 0 ? x - p : -1];
                      for (var t = 0; t < 2; t++) {
                          var y = cands[t];
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; heapPush(heap, (c + y) * SH + y); }
                      }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minOperations(int n, int m) {
              int d = String.valueOf(n).length(), lim = 1;
              for (int i = 0; i < d; i++) lim *= 10;
              boolean[] prime = new boolean[lim];
              for (int i = 2; i < lim; i++) prime[i] = true;
              for (int i = 2; i * i < lim; i++) if (prime[i]) for (int j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) return -1;
              int[] dist = new int[lim];
              Arrays.fill(dist, Integer.MAX_VALUE);
              dist[n] = n;
              PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
              heap.add(new long[]{n, n});
              while (!heap.isEmpty()) {
                  long[] top = heap.poll();
                  int c = (int) top[0], x = (int) top[1];
                  if (c > dist[x]) continue;
                  if (x == m) return c;
                  for (int k = 0, p = 1; k < d; k++, p *= 10) {
                      int g = (x / p) % 10;
                      int[] cands = {g < 9 ? x + p : -1, g > 0 ? x - p : -1};
                      for (int y : cands) {
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; heap.add(new long[]{c + y, y}); }
                      }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minOperations(int n, int m) {
              int d = to_string(n).size(), lim = 1;
              for (int i = 0; i < d; i++) lim *= 10;
              vector<bool> prime(lim, true);
              prime[0] = false;
              if (lim > 1) prime[1] = false;
              for (int i = 2; i * i < lim; i++) if (prime[i]) for (int j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) return -1;
              vector<int> dist(lim, INT_MAX);
              priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
              dist[n] = n;
              heap.push(make_pair(n, n));
              while (!heap.empty()) {
                  int c = heap.top().first, x = heap.top().second;
                  heap.pop();
                  if (c > dist[x]) continue;
                  if (x == m) return c;
                  for (int k = 0, p = 1; k < d; k++, p *= 10) {
                      int g = (x / p) % 10;
                      int cands[2] = {g < 9 ? x + p : -1, g > 0 ? x - p : -1};
                      for (int y : cands) {
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; heap.push(make_pair(c + y, y)); }
                      }
                  }
              }
              return -1;
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

          int minOperations(int n, int m) {
              int d = 0, lim = 1;
              for (int t = n; t > 0; t /= 10) { d++; lim *= 10; }
              bool* prime = (bool*)malloc(lim * sizeof(bool));
              for (int i = 0; i < lim; i++) prime[i] = i >= 2;
              for (int i = 2; i * i < lim; i++) if (prime[i]) for (int j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) { free(prime); return -1; }
              const long long SH = 16384;
              int* dist = (int*)malloc(lim * sizeof(int));
              for (int i = 0; i < lim; i++) dist[i] = 2147483647;
              long long* heap = (long long*)malloc((2 * d * lim + 2) * sizeof(long long));
              int size = 0, ans = -1;
              dist[n] = n;
              hpPush(heap, &size, (long long) n * SH + n);
              while (size > 0) {
                  long long key = hpPop(heap, &size);
                  int x = (int)(key % SH), c = (int)(key / SH);
                  if (c > dist[x]) continue;
                  if (x == m) { ans = c; break; }
                  for (int k = 0, p = 1; k < d; k++, p *= 10) {
                      int g = (x / p) % 10;
                      int cands[2] = {g < 9 ? x + p : -1, g > 0 ? x - p : -1};
                      for (int t = 0; t < 2; t++) {
                          int y = cands[t];
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; hpPush(heap, &size, (long long)(c + y) * SH + y); }
                      }
                  }
              }
              free(prime); free(dist); free(heap);
              return ans;
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

          public static int MinOperations(int n, int m)
          {
              int d = n.ToString().Length, lim = 1;
              for (int i = 0; i < d; i++) lim *= 10;
              var prime = new bool[lim];
              for (int i = 2; i < lim; i++) prime[i] = true;
              for (int i = 2; i * i < lim; i++) if (prime[i]) for (int j = i * i; j < lim; j += i) prime[j] = false;
              if (prime[n] || prime[m]) return -1;
              const long SH = 16384;
              var dist = new int[lim];
              for (int i = 0; i < lim; i++) dist[i] = int.MaxValue;
              dist[n] = n;
              var heap = new List<long> { (long) n * SH + n };
              while (heap.Count > 0)
              {
                  long key = HeapPop(heap);
                  int x = (int)(key % SH), c = (int)(key / SH);
                  if (c > dist[x]) continue;
                  if (x == m) return c;
                  for (int k = 0, p = 1; k < d; k++, p *= 10)
                  {
                      int g = (x / p) % 10;
                      int[] cands = {g < 9 ? x + p : -1, g > 0 ? x - p : -1};
                      foreach (int y in cands)
                      {
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; HeapPush(heap, (long)(c + y) * SH + y); }
                      }
                  }
              }
              return -1;
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

          func minOperations(n int, m int) int {
          	d, lim := 0, 1
          	for t := n; t > 0; t /= 10 {
          		d++
          		lim *= 10
          	}
          	prime := make([]bool, lim)
          	for i := 2; i < lim; i++ {
          		prime[i] = true
          	}
          	for i := 2; i*i < lim; i++ {
          		if prime[i] {
          			for j := i * i; j < lim; j += i {
          				prime[j] = false
          			}
          		}
          	}
          	if prime[n] || prime[m] {
          		return -1
          	}
          	const SH = 16384
          	dist := make([]int, lim)
          	for i := range dist {
          		dist[i] = 1 << 62
          	}
          	dist[n] = n
          	heap := []int{n*SH + n}
          	for len(heap) > 0 {
          		key := hpPop(&heap)
          		x, c := key%SH, key/SH
          		if c > dist[x] {
          			continue
          		}
          		if x == m {
          			return c
          		}
          		for k, p := 0, 1; k < d; k, p = k+1, p*10 {
          			g := (x / p) % 10
          			cands := [2]int{-1, -1}
          			if g < 9 {
          				cands[0] = x + p
          			}
          			if g > 0 {
          				cands[1] = x - p
          			}
          			for _, y := range cands {
          				if y >= 0 && !prime[y] && c+y < dist[y] {
          					dist[y] = c + y
          					hpPush(&heap, (c+y)*SH+y)
          				}
          			}
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minOperations(n: Int, m: Int): Int {
              val d = n.toString().length
              var lim = 1
              repeat(d) { lim *= 10 }
              val prime = BooleanArray(lim) { it >= 2 }
              var i = 2
              while (i * i < lim) {
                  if (prime[i]) { var j = i * i; while (j < lim) { prime[j] = false; j += i } }
                  i++
              }
              if (prime[n] || prime[m]) return -1
              val SH = 16384L
              val dist = IntArray(lim) { Int.MAX_VALUE }
              dist[n] = n
              val heap = PriorityQueue<Long>()
              heap.add(n.toLong() * SH + n)
              while (heap.isNotEmpty()) {
                  val key = heap.poll()
                  val x = (key % SH).toInt()
                  val c = (key / SH).toInt()
                  if (c > dist[x]) continue
                  if (x == m) return c
                  var p = 1
                  for (k in 0 until d) {
                      val g = (x / p) % 10
                      val cands = intArrayOf(if (g < 9) x + p else -1, if (g > 0) x - p else -1)
                      for (y in cands) {
                          if (y >= 0 && !prime[y] && c + y < dist[y]) { dist[y] = c + y; heap.add((c + y).toLong() * SH + y) }
                      }
                      p *= 10
                  }
              }
              return -1
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

          func minOperations(_ n: Int, _ m: Int) -> Int {
              let d = String(n).count
              var lim = 1
              for _ in 0..<d { lim *= 10 }
              var prime = [Bool](repeating: false, count: lim)
              for i in 0..<lim where i >= 2 { prime[i] = true }
              var i = 2
              while i * i < lim {
                  if prime[i] { var j = i * i; while j < lim { prime[j] = false; j += i } }
                  i += 1
              }
              if prime[n] || prime[m] { return -1 }
              let SH = 16384
              var dist = [Int](repeating: Int.max, count: lim)
              dist[n] = n
              var heap = [n * SH + n]
              while !heap.isEmpty {
                  let key = hpPop(&heap)
                  let x = key % SH, c = key / SH
                  if c > dist[x] { continue }
                  if x == m { return c }
                  var p = 1
                  for _ in 0..<d {
                      let g = (x / p) % 10
                      for y in [g < 9 ? x + p : -1, g > 0 ? x - p : -1] where y >= 0 && !prime[y] && c + y < dist[y] {
                          dist[y] = c + y
                          hpPush(&heap, (c + y) * SH + y)
                      }
                      p *= 10
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minOperations(n: i32, m: i32) -> i32 {
              let d = n.to_string().len();
              let mut lim: i64 = 1;
              for _ in 0..d {
                  lim *= 10;
              }
              let lim = lim as usize;
              let mut prime = vec![true; lim];
              prime[0] = false;
              if lim > 1 {
                  prime[1] = false;
              }
              let mut i = 2;
              while i * i < lim {
                  if prime[i] {
                      let mut j = i * i;
                      while j < lim {
                          prime[j] = false;
                          j += i;
                      }
                  }
                  i += 1;
              }
              let (n, m) = (n as usize, m as usize);
              if prime[n] || prime[m] {
                  return -1;
              }
              let mut dist = vec![std::i64::MAX; lim];
              let mut heap = BinaryHeap::new();
              dist[n] = n as i64;
              heap.push(Reverse((n as i64, n)));
              while let Some(Reverse((c, x))) = heap.pop() {
                  if c > dist[x] {
                      continue;
                  }
                  if x == m {
                      return c as i32;
                  }
                  let mut p = 1usize;
                  for _ in 0..d {
                      let g = (x / p) % 10;
                      let mut cands: Vec<usize> = Vec::new();
                      if g < 9 {
                          cands.push(x + p);
                      }
                      if g > 0 {
                          cands.push(x - p);
                      }
                      for &y in cands.iter() {
                          let nc = c + y as i64;
                          if !prime[y] && nc < dist[y] {
                              dist[y] = nc;
                              heap.push(Reverse((nc, y)));
                          }
                      }
                      p *= 10;
                  }
              }
              -1
          }
        `,
        php: code`
          function minOperations($n, $m) {
              $d = strlen((string) $n);
              $lim = 10 ** $d;
              $prime = array_fill(0, $lim, true);
              $prime[0] = false;
              if ($lim > 1) $prime[1] = false;
              for ($i = 2; $i * $i < $lim; $i++) {
                  if ($prime[$i]) for ($j = $i * $i; $j < $lim; $j += $i) $prime[$j] = false;
              }
              if ($prime[$n] || $prime[$m]) return -1;
              $SH = 16384;
              $dist = array_fill(0, $lim, PHP_INT_MAX);
              $dist[$n] = $n;
              $heap = new \SplMinHeap();
              $heap->insert($n * $SH + $n);
              while (!$heap->isEmpty()) {
                  $key = $heap->extract();
                  $x = $key % $SH;
                  $c = intdiv($key, $SH);
                  if ($c > $dist[$x]) continue;
                  if ($x == $m) return $c;
                  for ($k = 0, $p = 1; $k < $d; $k++, $p *= 10) {
                      $g = intdiv($x, $p) % 10;
                      foreach ([$g < 9 ? $x + $p : -1, $g > 0 ? $x - $p : -1] as $y) {
                          if ($y >= 0 && !$prime[$y] && $c + $y < $dist[$y]) { $dist[$y] = $c + $y; $heap->insert(($c + $y) * $SH + $y); }
                      }
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minOperations(n, m)
            d = n.to_s.length
            lim = 10**d
            prime = Array.new(lim, true)
            prime[0] = false
            prime[1] = false if lim > 1
            i = 2
            while i * i < lim
              if prime[i]
                j = i * i
                while j < lim
                  prime[j] = false
                  j += i
                end
              end
              i += 1
            end
            return -1 if prime[n] || prime[m]
            sh = 16_384
            dist = Array.new(lim, Float::INFINITY)
            dist[n] = n
            heap = [n * sh + n]
            until heap.empty?
              key = hp_pop(heap)
              x = key % sh
              c = key / sh
              next if c > dist[x]
              return c if x == m
              p = 1
              d.times do
                g = (x / p) % 10
                [g < 9 ? x + p : -1, g > 0 ? x - p : -1].each do |y|
                  next unless y >= 0 && !prime[y] && c + y < dist[y]
                  dist[y] = c + y
                  hp_push(heap, (c + y) * sh + y)
                end
                p *= 10
              end
            end
            -1
          end

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
        `,
      },
    };
  })(),

  // ── Unit Conversion I (LC 3528) ─────────────────────────────────
  (() => {
    const MOD = 1000000007n;
    const ref = (conversions: number[][]) => {
      const n = conversions.length + 1;
      const val: (bigint | null)[] = new Array(n).fill(null);
      val[0] = 1n;
      for (let changed = true; changed;) {
        changed = false;
        for (const [s, t, f] of conversions) if (val[s] !== null && val[t] === null) { val[t] = (val[s]! * BigInt(f)) % MOD; changed = true; }
      }
      return val.map((v) => Number(v));
    };
    return {
      slug: "unit-conversion-i",
      title: "Unit Conversion I",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Amazon"],
      signature: { funcName: "baseUnitConversion", params: [{ name: "conversions", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` types of units numbered `0` to `n - 1`. You are given `n - 1` conversions; `conversions[i] = [sourceUnit, targetUnit, conversionFactor]` means that one unit of type `sourceUnit` equals `conversionFactor` units of type `targetUnit`.\n\nThe conversions are arranged so that, starting from unit `0` and following them in their given direction, every other unit can be reached in exactly one way.\n\nReturn an array `baseUnitConversion` of length `n` where `baseUnitConversion[i]` is the number of units of type `i` equal to one unit of type `0`. The numbers can be huge, so return each one **modulo** `10^9 + 7`.",
        [
          { in: "conversions = [[0,1,2],[1,2,3]]", out: "[1,2,6]", note: "One unit of type 0 is 2 units of type 1, and 2 · 3 = 6 units of type 2." },
          { in: "conversions = [[0,1,2],[0,2,3],[1,3,4],[1,4,5],[2,5,2],[4,6,3],[5,7,4]]", out: "[1,2,3,8,10,6,30,24]" },
          { in: "conversions = [[0,1,1000000000],[1,2,1000000000]]", out: "[1,1000000000,49]", note: "10^18 modulo 10^9 + 7 is 49." },
        ],
        ["2 <= n <= 10^5", "conversions.length == n - 1", "0 <= sourceUnit, targetUnit < n", "1 <= conversionFactor <= 10^9", "unit 0 can be converted into every other unit through exactly one chain of conversions"]),
      hints: [
        "Draw each conversion as a directed edge from source to target with the factor as its weight. The guarantee makes this a tree hanging from unit 0.",
        "The answer for a unit is the product of the factors along the path from 0 to it, so it is the parent's answer times the edge's factor.",
        "BFS or DFS from 0, multiplying as you go, and reduce modulo `10^9 + 7` after every multiplication — the product of two residues needs 64-bit arithmetic.",
      ],
      editorial: explain({
        idea: "The conversions form a tree rooted at unit 0, and converting along a path multiplies the factors. One traversal from the root fills in every product.",
        steps: [
          "Build directed adjacency lists `source → (target, factor)`.",
          "Set `ans[0] = 1` and traverse from 0 (BFS or an explicit stack).",
          "For an edge `u → v` with factor `f`, set `ans[v] = ans[u] · f mod (10^9 + 7)`.",
          "Return `ans`.",
        ],
        why: "One unit of type 0 equals `ans[u]` units of type `u`, and each of those equals `f` units of `v`, so it equals `ans[u] · f` units of `v`. The path from 0 to `v` is unique, so the value is well defined; taking it modulo the prime at each step is exact because multiplication commutes with the modulus.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Two factors near `10^9` multiply to about `10^18`: use 64-bit integers (or BigInt / a split multiplication in JavaScript, whose doubles lose precision past `2^53`).",
          "Edges are directed: follow them only from source to target.",
          "Reduce after every multiplication, not just at the end.",
        ],
      }),
      examples: [
        { input: "[[0,1,2],[1,2,3]]", expectedOutput: "[1,2,6]" },
        { input: "[[0,1,2],[0,2,3],[1,3,4],[1,4,5],[2,5,2],[4,6,3],[5,7,4]]", expectedOutput: "[1,2,3,8,10,6,30,24]" },
        { input: "[[0,1,1000000000],[1,2,1000000000]]", expectedOutput: "[1,1000000000,49]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 6, 10, 16, 25, 40]);
        const label = [0, ...shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1))];
        const top = pick(rng, [3, 10, 1000, 1000000000]);
        const conversions: number[][] = [];
        for (let i = 1; i < n; i++) {
          const j = rng() < 0.5 ? i - 1 : ri(rng, 0, i - 1);
          conversions.push([label[j], label[i], rng() < 0.2 ? top : ri(rng, 1, top)]);
        }
        shuffle(rng, conversions);
        return { input: fmtIntMat(conversions), expectedOutput: fmtIntArr(ref(conversions)) };
      },
      solutions: {
        python: code`
          from typing import List

          def baseUnitConversion(conversions: List[List[int]]) -> List[int]:
              MOD = 10**9 + 7
              n = len(conversions) + 1
              adj = [[] for _ in range(n)]
              for s, t, f in conversions:
                  adj[s].append((t, f))
              ans = [0] * n
              ans[0] = 1
              stack = [0]
              while stack:
                  u = stack.pop()
                  for v, f in adj[u]:
                      ans[v] = ans[u] * f % MOD
                      stack.append(v)
              return ans
        `,
        javascript: code`
          var baseUnitConversion = function(conversions) {
              var n = conversions.length + 1, adj = [], ans = [];
              for (var i = 0; i < n; i++) { adj.push([]); ans.push(0); }
              for (var e = 0; e < conversions.length; e++) adj[conversions[e][0]].push(e);
              ans[0] = 1;
              var stack = [0];
              while (stack.length > 0) {
                  var u = stack.pop();
                  for (var j = 0; j < adj[u].length; j++) {
                      var c = conversions[adj[u][j]];
                      ans[c[1]] = mulMod(ans[u], c[2]);
                      stack.push(c[1]);
                  }
              }
              return ans;
          };

          // a * b mod p without leaving the 2^53 range a double holds exactly.
          var mulMod = function(a, b) {
              var MOD = 1000000007;
              var hi = (a * Math.floor(b / 65536)) % MOD;
              return (hi * 65536 + a * (b % 65536)) % MOD;
          };
        `,
        typescript: code`
          function baseUnitConversion(conversions: number[][]): number[] {
              var n = conversions.length + 1, adj: number[][] = [], ans: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); ans.push(0); }
              for (var e = 0; e < conversions.length; e++) adj[conversions[e][0]].push(e);
              ans[0] = 1;
              var stack: number[] = [0];
              while (stack.length > 0) {
                  var u = stack.pop() as number;
                  for (var j = 0; j < adj[u].length; j++) {
                      var c = conversions[adj[u][j]];
                      ans[c[1]] = mulMod(ans[u], c[2]);
                      stack.push(c[1]);
                  }
              }
              return ans;
          }

          // a * b mod p without leaving the 2^53 range a double holds exactly.
          function mulMod(a: number, b: number): number {
              var MOD = 1000000007;
              var hi = (a * Math.floor(b / 65536)) % MOD;
              return (hi * 65536 + a * (b % 65536)) % MOD;
          }
        `,
        java: code`
          public static int[] baseUnitConversion(int[][] conversions) {
              final long MOD = 1000000007L;
              int n = conversions.length + 1;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int e = 0; e < conversions.length; e++) adj.get(conversions[e][0]).add(e);
              long[] val = new long[n];
              val[0] = 1;
              int[] stack = new int[n];
              int top = 0;
              stack[top++] = 0;
              while (top > 0) {
                  int u = stack[--top];
                  for (int e : adj.get(u)) {
                      int v = conversions[e][1];
                      val[v] = val[u] * conversions[e][2] % MOD;
                      stack[top++] = v;
                  }
              }
              int[] ans = new int[n];
              for (int i = 0; i < n; i++) ans[i] = (int) val[i];
              return ans;
          }
        `,
        cpp: code`
          vector<int> baseUnitConversion(vector<vector<int>>& conversions) {
              const long long MOD = 1000000007LL;
              int n = conversions.size() + 1;
              vector<vector<int>> adj(n);
              for (int e = 0; e < (int) conversions.size(); e++) adj[conversions[e][0]].push_back(e);
              vector<long long> val(n, 0);
              val[0] = 1;
              vector<int> stack = {0};
              while (!stack.empty()) {
                  int u = stack.back();
                  stack.pop_back();
                  for (int e : adj[u]) {
                      int v = conversions[e][1];
                      val[v] = val[u] * conversions[e][2] % MOD;
                      stack.push_back(v);
                  }
              }
              vector<int> ans(n);
              for (int i = 0; i < n; i++) ans[i] = (int) val[i];
              return ans;
          }
        `,
        c: code`
          int* baseUnitConversion(int** conversions, int conversionsSize, int* conversionsColSize, int* returnSize) {
              const long long MOD = 1000000007LL;
              int n = conversionsSize + 1;
              int* head = (int*)malloc(n * sizeof(int));
              int* nxt = (int*)malloc((conversionsSize + 1) * sizeof(int));
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < conversionsSize; e++) { nxt[e] = head[conversions[e][0]]; head[conversions[e][0]] = e; }
              long long* val = (long long*)calloc(n, sizeof(long long));
              int* stack = (int*)malloc(n * sizeof(int));
              int top = 0;
              val[0] = 1;
              stack[top++] = 0;
              while (top > 0) {
                  int u = stack[--top];
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = conversions[e][1];
                      val[v] = val[u] * conversions[e][2] % MOD;
                      stack[top++] = v;
                  }
              }
              int* ans = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) ans[i] = (int) val[i];
              free(head); free(nxt); free(val); free(stack);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          public static int[] BaseUnitConversion(int[][] conversions)
          {
              const long MOD = 1000000007L;
              int n = conversions.Length + 1;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              for (int e = 0; e < conversions.Length; e++) adj[conversions[e][0]].Add(e);
              var val = new long[n];
              val[0] = 1;
              var stack = new Stack<int>();
              stack.Push(0);
              while (stack.Count > 0)
              {
                  int u = stack.Pop();
                  foreach (int e in adj[u])
                  {
                      int v = conversions[e][1];
                      val[v] = val[u] * conversions[e][2] % MOD;
                      stack.Push(v);
                  }
              }
              var ans = new int[n];
              for (int i = 0; i < n; i++) ans[i] = (int) val[i];
              return ans;
          }
        `,
        go: code`
          func baseUnitConversion(conversions [][]int) []int {
          	const MOD = 1000000007
          	n := len(conversions) + 1
          	adj := make([][]int, n)
          	for e, c := range conversions {
          		adj[c[0]] = append(adj[c[0]], e)
          	}
          	ans := make([]int, n)
          	ans[0] = 1
          	stack := []int{0}
          	for len(stack) > 0 {
          		u := stack[len(stack)-1]
          		stack = stack[:len(stack)-1]
          		for _, e := range adj[u] {
          			v := conversions[e][1]
          			ans[v] = ans[u] * conversions[e][2] % MOD
          			stack = append(stack, v)
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun baseUnitConversion(conversions: Array<IntArray>): IntArray {
              val MOD = 1000000007L
              val n = conversions.size + 1
              val adj = Array(n) { ArrayList<Int>() }
              for (e in conversions.indices) adj[conversions[e][0]].add(e)
              val v = LongArray(n)
              v[0] = 1L
              val stack = IntArray(n)
              var top = 0
              stack[top++] = 0
              while (top > 0) {
                  val u = stack[--top]
                  for (e in adj[u]) {
                      val t = conversions[e][1]
                      v[t] = v[u] * conversions[e][2] % MOD
                      stack[top++] = t
                  }
              }
              return IntArray(n) { v[it].toInt() }
          }
        `,
        swift: code`
          func baseUnitConversion(_ conversions: [[Int]]) -> [Int] {
              let MOD = 1_000_000_007
              let n = conversions.count + 1
              var adj = [[Int]](repeating: [], count: n)
              for e in 0..<conversions.count { adj[conversions[e][0]].append(e) }
              var ans = [Int](repeating: 0, count: n)
              ans[0] = 1
              var stack = [0]
              while let u = stack.popLast() {
                  for e in adj[u] {
                      let v = conversions[e][1]
                      ans[v] = ans[u] * conversions[e][2] % MOD
                      stack.append(v)
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn baseUnitConversion(conversions: Vec<Vec<i32>>) -> Vec<i32> {
              const MOD: i64 = 1_000_000_007;
              let n = conversions.len() + 1;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for (e, c) in conversions.iter().enumerate() {
                  adj[c[0] as usize].push(e);
              }
              let mut val = vec![0i64; n];
              val[0] = 1;
              let mut stack: Vec<usize> = vec![0];
              while let Some(u) = stack.pop() {
                  for &e in adj[u].iter() {
                      let v = conversions[e][1] as usize;
                      val[v] = val[u] * conversions[e][2] as i64 % MOD;
                      stack.push(v);
                  }
              }
              val.iter().map(|&x| x as i32).collect()
          }
        `,
        php: code`
          function baseUnitConversion($conversions) {
              $MOD = 1000000007;
              $n = count($conversions) + 1;
              $adj = array_fill(0, $n, []);
              foreach ($conversions as $e => $c) $adj[$c[0]][] = $e;
              $ans = array_fill(0, $n, 0);
              $ans[0] = 1;
              $stack = [0];
              while (count($stack) > 0) {
                  $u = array_pop($stack);
                  foreach ($adj[$u] as $e) {
                      $v = $conversions[$e][1];
                      $ans[$v] = $ans[$u] * $conversions[$e][2] % $MOD;
                      $stack[] = $v;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def baseUnitConversion(conversions)
            mod = 1_000_000_007
            n = conversions.length + 1
            adj = Array.new(n) { [] }
            conversions.each { |s, t, f| adj[s] << [t, f] }
            ans = Array.new(n, 0)
            ans[0] = 1
            stack = [0]
            until stack.empty?
              u = stack.pop
              adj[u].each do |v, f|
                ans[v] = ans[u] * f % mod
                stack << v
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Increments to Equalize Leaf Paths (LC 3593) ─────────
  (() => {
    const ref = (n: number, edges: number[][], cost: number[]) => {
      const adj = adjOf(n, edges);
      let count = 0;
      const best = (u: number, from: number): number => {
        const kids = adj[u].filter((v) => v !== from).map((v) => best(v, u));
        if (kids.length === 0) return cost[u];
        const top = Math.max(...kids);
        count += kids.filter((k) => k < top).length;
        return cost[u] + top;
      };
      best(0, -1);
      return count;
    };
    return {
      slug: "minimum-increments-to-equalize-leaf-paths",
      title: "Minimum Increments to Equalize Leaf Paths",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Tree", "Depth-First Search", "Google"],
      signature: { funcName: "minIncrease", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "cost", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1` and is **rooted at node `0`**; its edges are given in `edges`, each `[ui, vi]`. Node `i` has a cost `cost[i]`.\n\nThe **score** of a path is the sum of the costs of the nodes on it. You may increase the cost of any nodes by any non-negative amounts, so that afterwards **every root-to-leaf path has the same score**.\n\nReturn the minimum number of nodes whose cost you must increase.",
        [
          { in: "n = 3, edges = [[0,1],[0,2]], cost = [2,1,3]", out: "1", note: "The paths score 3 and 5. Raising node 1's cost by 2 makes both 5." },
          { in: "n = 3, edges = [[0,1],[1,2]], cost = [5,1,4]", out: "0", note: "There is only one root-to-leaf path." },
          { in: "n = 5, edges = [[0,4],[0,1],[1,2],[1,3]], cost = [3,4,1,1,7]", out: "1", note: "The paths 0→4, 0→1→2 and 0→1→3 score 10, 8 and 8. Raising node 1 by 2 fixes both short paths at once." },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i] == [ui, vi]", "0 <= ui, vi < n", "the input is a valid tree", "cost.length == n", "1 <= cost[i] <= 10^9"]),
      hints: [
        "Every root-to-leaf score can only go up, so the final common score must be the current maximum. Work out, for each node, the best score from it down to a leaf.",
        "At a node, all the children's subtrees must end up with the same best score — the largest child's. A child whose best is smaller needs at least one increase somewhere in its subtree.",
        "Increasing that child itself fixes every path through it at once. So the answer is the number of (node, child) pairs where the child's best downward score is below the maximum among its siblings.",
      ],
      editorial: explain({
        idea: "Bottom-up, each node's subtree is made uniform first; then at the parent, every child whose uniform score falls short of the best sibling is raised once — at the child itself, which lifts its whole subtree together. That one increase per short child is unavoidable and enough.",
        steps: [
          "Root the tree at 0 and get a BFS order.",
          "In reverse BFS order compute `best[u] = cost[u] + max(best[child])` (just `cost[u]` for a leaf).",
          "At each node, let `top` be the maximum `best` among its children and count the children with `best[c] < top`.",
          "Return the total count.",
        ],
        why: "Within the subtree of a child `c` that falls short, every root-to-leaf path through `c` is too small, and those paths share only the nodes from `c` up — so some node on or below `c` must be increased; raising `c` alone by `top - best[c]` repairs all of them. Children already at `top` need nothing, and increasing a node never helps a sibling subtree, so the per-node counts add up to the optimum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Path scores reach about `10^14`; keep the `best` values in 64-bit integers.",
          "Compare children against each other, not against the parent's own cost.",
          "Recursion over a 10^5-node path can overflow the stack; use an explicit order.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1],[0,2]]\n[2,1,3]", expectedOutput: "1" },
        { input: "3\n[[0,1],[1,2]]\n[5,1,4]", expectedOutput: "0" },
        { input: "5\n[[0,4],[0,1],[1,2],[1,3]]\n[3,4,1,1,7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 6, 9, 14, 20, 30]);
        const edges = randTree(rng, n);
        const top = pick(rng, [1, 2, 3, 10, 1000000000]);
        const cost = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: `${n}\n${fmtIntMat(edges)}\n${fmtIntArr(cost)}`, expectedOutput: String(ref(n, edges, cost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minIncrease(n: int, edges: List[List[int]], cost: List[int]) -> int:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-2] * n
              parent[0] = -1
              order = [0]
              for u in order:
                  for v in adj[u]:
                      if parent[v] == -2:
                          parent[v] = u
                          order.append(v)
              best = [0] * n
              count = 0
              for u in reversed(order):
                  top = 0
                  for v in adj[u]:
                      if v != parent[u] and best[v] > top:
                          top = best[v]
                  for v in adj[u]:
                      if v != parent[u] and best[v] < top:
                          count += 1
                  best[u] = cost[u] + top
              return count
        `,
        javascript: code`
          var minIncrease = function(n, edges, cost) {
              var adj = [], parent = [], best = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); best.push(0); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              var count = 0;
              for (var t = n - 1; t >= 0; t--) {
                  var x = order[t], top = 0, k, c;
                  for (k = 0; k < adj[x].length; k++) {
                      c = adj[x][k];
                      if (c !== parent[x] && best[c] > top) top = best[c];
                  }
                  for (k = 0; k < adj[x].length; k++) {
                      c = adj[x][k];
                      if (c !== parent[x] && best[c] < top) count++;
                  }
                  best[x] = cost[x] + top;
              }
              return count;
          };
        `,
        typescript: code`
          function minIncrease(n: number, edges: number[][], cost: number[]): number {
              var adj: number[][] = [], parent: number[] = [], best: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); best.push(0); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              parent[0] = -1;
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; order.push(v); }
                  }
              }
              var count = 0;
              for (var t = n - 1; t >= 0; t--) {
                  var x = order[t], top = 0, k: number, c: number;
                  for (k = 0; k < adj[x].length; k++) {
                      c = adj[x][k];
                      if (c !== parent[x] && best[c] > top) top = best[c];
                  }
                  for (k = 0; k < adj[x].length; k++) {
                      c = adj[x][k];
                      if (c !== parent[x] && best[c] < top) count++;
                  }
                  best[x] = cost[x] + top;
              }
              return count;
          }
        `,
        java: code`
          public static int minIncrease(int n, int[][] edges, int[] cost) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              Arrays.fill(parent, -2);
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int v : adj.get(u)) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              long[] best = new long[n];
              int count = 0;
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t];
                  long top = 0;
                  for (int c : adj.get(x)) if (c != parent[x] && best[c] > top) top = best[c];
                  for (int c : adj.get(x)) if (c != parent[x] && best[c] < top) count++;
                  best[x] = cost[x] + top;
              }
              return count;
          }
        `,
        cpp: code`
          int minIncrease(int n, vector<vector<int>>& edges, vector<int>& cost) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -2), order;
              parent[0] = -1;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (parent[v] == -2) { parent[v] = u; order.push_back(v); }
              }
              vector<long long> best(n, 0);
              int count = 0;
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t];
                  long long top = 0;
                  for (int c : adj[x]) if (c != parent[x] && best[c] > top) top = best[c];
                  for (int c : adj[x]) if (c != parent[x] && best[c] < top) count++;
                  best[x] = cost[x] + top;
              }
              return count;
          }
        `,
        c: code`
          int minIncrease(int n, int** edges, int edgesSize, int* edgesColSize, int* cost, int costSize) {
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0] + 1]++; first[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* parent = (int*)malloc(n * sizeof(int));
              int* order = (int*)malloc(n * sizeof(int));
              for (int i = 0; i < n; i++) parent[i] = -2;
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
                  }
              }
              long long* best = (long long*)calloc(n, sizeof(long long));
              int count = 0;
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t];
                  long long top = 0;
                  for (int k = first[x]; k < first[x + 1]; k++) {
                      int c = adj[k];
                      if (c != parent[x] && best[c] > top) top = best[c];
                  }
                  for (int k = first[x]; k < first[x + 1]; k++) {
                      int c = adj[k];
                      if (c != parent[x] && best[c] < top) count++;
                  }
                  best[x] = cost[x] + top;
              }
              free(first); free(fill); free(adj); free(parent); free(order); free(best);
              return count;
          }
        `,
        csharp: code`
          public static int MinIncrease(int n, int[][] edges, int[] cost)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var parent = new int[n];
              var order = new int[n];
              for (int i = 0; i < n; i++) parent[i] = -2;
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
              {
                  int u = order[h];
                  foreach (int v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              var best = new long[n];
              int count = 0;
              for (int t = n - 1; t >= 0; t--)
              {
                  int x = order[t];
                  long top = 0;
                  foreach (int c in adj[x]) if (c != parent[x] && best[c] > top) top = best[c];
                  foreach (int c in adj[x]) if (c != parent[x] && best[c] < top) count++;
                  best[x] = cost[x] + top;
              }
              return count;
          }
        `,
        go: code`
          func minIncrease(n int, edges [][]int, cost []int) int {
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	parent := make([]int, n)
          	for i := range parent {
          		parent[i] = -2
          	}
          	parent[0] = -1
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		u := order[h]
          		for _, v := range adj[u] {
          			if parent[v] == -2 {
          				parent[v] = u
          				order = append(order, v)
          			}
          		}
          	}
          	best := make([]int, n)
          	count := 0
          	for t := n - 1; t >= 0; t-- {
          		x := order[t]
          		top := 0
          		for _, c := range adj[x] {
          			if c != parent[x] && best[c] > top {
          				top = best[c]
          			}
          		}
          		for _, c := range adj[x] {
          			if c != parent[x] && best[c] < top {
          				count++
          			}
          		}
          		best[x] = cost[x] + top
          	}
          	return count
          }
        `,
        kotlin: code`
          fun minIncrease(n: Int, edges: Array<IntArray>, cost: IntArray): Int {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -2 }
              val order = IntArray(n)
              parent[0] = -1
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  val u = order[h++]
                  for (v in adj[u]) if (parent[v] == -2) { parent[v] = u; order[tail++] = v }
              }
              val best = LongArray(n)
              var count = 0
              for (t in n - 1 downTo 0) {
                  val x = order[t]
                  var top = 0L
                  for (c in adj[x]) if (c != parent[x] && best[c] > top) top = best[c]
                  for (c in adj[x]) if (c != parent[x] && best[c] < top) count++
                  best[x] = cost[x] + top
              }
              return count
          }
        `,
        swift: code`
          func minIncrease(_ n: Int, _ edges: [[Int]], _ cost: [Int]) -> Int {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -2, count: n)
              parent[0] = -1
              var order = [0]
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for v in adj[u] where parent[v] == -2 {
                      parent[v] = u
                      order.append(v)
                  }
              }
              var best = [Int](repeating: 0, count: n)
              var count = 0
              for t in stride(from: n - 1, through: 0, by: -1) {
                  let x = order[t]
                  var top = 0
                  for c in adj[x] where c != parent[x] && best[c] > top { top = best[c] }
                  for c in adj[x] where c != parent[x] && best[c] < top { count += 1 }
                  best[x] = cost[x] + top
              }
              return count
          }
        `,
        rust: code`
          fn minIncrease(n: i32, edges: Vec<Vec<i32>>, cost: Vec<i32>) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let none = std::usize::MAX;
              let mut parent = vec![none; n];
              let mut seen = vec![false; n];
              seen[0] = true;
              let mut order: Vec<usize> = vec![0];
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
              let mut best = vec![0i64; n];
              let mut count = 0;
              for t in (0..n).rev() {
                  let x = order[t];
                  let mut top = 0i64;
                  for &c in adj[x].iter() {
                      if c != parent[x] && best[c] > top {
                          top = best[c];
                      }
                  }
                  for &c in adj[x].iter() {
                      if c != parent[x] && best[c] < top {
                          count += 1;
                      }
                  }
                  best[x] = cost[x] as i64 + top;
              }
              count
          }
        `,
        php: code`
          function minIncrease($n, $edges, $cost) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -2);
              $parent[0] = -1;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) if ($parent[$v] == -2) { $parent[$v] = $u; $order[] = $v; }
              }
              $best = array_fill(0, $n, 0);
              $count = 0;
              for ($t = $n - 1; $t >= 0; $t--) {
                  $x = $order[$t];
                  $top = 0;
                  foreach ($adj[$x] as $c) if ($c != $parent[$x] && $best[$c] > $top) $top = $best[$c];
                  foreach ($adj[$x] as $c) if ($c != $parent[$x] && $best[$c] < $top) $count++;
                  $best[$x] = $cost[$x] + $top;
              }
              return $count;
          }
        `,
        ruby: code`
          def minIncrease(n, edges, cost)
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -2)
            parent[0] = -1
            order = [0]
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v|
                next unless parent[v] == -2
                parent[v] = u
                order << v
              end
            end
            best = Array.new(n, 0)
            count = 0
            order.reverse_each do |x|
              kids = adj[x].reject { |c| c == parent[x] }
              top = kids.map { |c| best[c] }.max || 0
              count += kids.count { |c| best[c] < top }
              best[x] = cost[x] + top
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Reach Destination in Directed Graph (LC 3604) ──
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const at = new Array(n).fill(Infinity);
      at[0] = 0;
      for (let changed = true; changed;) {
        changed = false;
        for (const [u, v, s, e] of edges) {
          if (at[u] === Infinity || at[u] > e) continue;
          const t = Math.max(at[u], s) + 1;
          if (t < at[v]) { at[v] = t; changed = true; }
        }
      }
      return at[n - 1] === Infinity ? -1 : at[n - 1];
    };
    return {
      slug: "minimum-time-to-reach-destination-in-directed-graph",
      title: "Minimum Time to Reach Destination in Directed Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Heap (Priority Queue)", "Shortest Path", "Google"],
      signature: { funcName: "minTime", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A directed graph has `n` nodes numbered `0` to `n - 1`. Each `edges[i] = [ui, vi, starti, endi]` is a directed edge from `ui` to `vi` that can only be used at an integer time `t` with `starti <= t <= endi`; using it takes exactly one unit of time, so leaving `ui` at time `t` means arriving at `vi` at time `t + 1`.\n\nYou are at node `0` at time `0`. At any node you may wait for any amount of time.\n\nReturn the minimum time at which you can arrive at node `n - 1`, or `-1` if it cannot be reached.",
        [
          { in: "n = 3, edges = [[0,1,0,1],[1,2,2,5]]", out: "3", note: "Leave 0 at time 0 and reach 1 at time 1, wait until 2, then reach 2 at time 3." },
          { in: "n = 4, edges = [[0,1,0,3],[1,3,7,8],[0,2,1,5],[2,3,4,7]]", out: "5", note: "Waiting at 0 until time 1, going to 2 (time 2), waiting until 4 and taking the last edge arrives at 5; the route through 1 cannot arrive before 8." },
          { in: "n = 3, edges = [[1,0,1,3],[1,2,3,5]]", out: "-1", note: "No edge leaves node 0." },
        ],
        ["1 <= n <= 10^5", "0 <= edges.length <= 10^5", "edges[i] == [ui, vi, starti, endi]", "0 <= ui, vi <= n - 1", "ui != vi", "0 <= starti <= endi <= 10^9"]),
      hints: [
        "Arriving at a node earlier is never worse: you can always wait. So each node only needs its earliest arrival time.",
        "From a node reached at time `t`, an edge with window `[start, end]` is usable only if `t <= end`, and then it delivers you at `max(t, start) + 1`.",
        "That transition is monotone in `t`, so Dijkstra on arrival times works: pop the earliest node, relax its usable edges.",
      ],
      editorial: explain({
        idea: "Earliest-arrival search with time windows: because waiting is free, a later arrival can never open an option an earlier one lacks, so Dijkstra's greedy order is safe.",
        steps: [
          "Build adjacency lists of `(v, start, end)` per node.",
          "Set `time[0] = 0` and push node 0 onto a min-heap keyed by time.",
          "Pop the node `u` with the smallest time `t` (skip stale entries); if it is `n - 1`, return `t`.",
          "For each edge with `t <= end`, relax `v` with `max(t, start) + 1`.",
          "If the heap empties, return `-1`.",
        ],
        why: "For a fixed edge the arrival `max(t, start) + 1` is non-decreasing in the departure time `t`, and the set of usable edges only shrinks as `t` grows. Hence an earlier arrival at `u` dominates a later one, which is the property Dijkstra's exchange argument needs.",
        time: "O((n + E) log E)",
        space: "O(n + E)",
        pitfalls: [
          "An edge whose window has closed (`t > end`) is unusable even though you could have waited before it — you cannot go back in time.",
          "With `n = 1` you are already at the destination: the answer is 0.",
          "Times reach about 10^9, so a packed heap key needs 64 bits.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1,0,1],[1,2,2,5]]", expectedOutput: "3" },
        { input: "4\n[[0,1,0,3],[1,3,7,8],[0,2,1,5],[2,3,4,7]]", expectedOutput: "5" },
        { input: "3\n[[1,0,1,3],[1,2,3,5]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 4, 8, 15]));
        const big = rng() < 0.15;
        const m = n === 1 ? ri(rng, 0, 1) : ri(rng, 0, pick(rng, [n, 2 * n, 4 * n]));
        const edges: number[][] = [];
        for (let i = 0; i < m && n > 1; i++) {
          const u = ri(rng, 0, n - 1);
          let v = ri(rng, 0, n - 2);
          if (v >= u) v++;
          const s = big ? ri(rng, 0, 1000000000) : ri(rng, 0, 12);
          const e = big ? ri(rng, s, 1000000000) : s + ri(rng, 0, 8);
          edges.push([u, v, s, e]);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minTime(n: int, edges: List[List[int]]) -> int:
              adj = [[] for _ in range(n)]
              for u, v, s, e in edges:
                  adj[u].append((v, s, e))
              INF = float("inf")
              dist = [INF] * n
              dist[0] = 0
              heap = [(0, 0)]
              while heap:
                  t, u = heapq.heappop(heap)
                  if t > dist[u]:
                      continue
                  if u == n - 1:
                      return t
                  for v, s, e in adj[u]:
                      if t <= e:
                          nt = max(t, s) + 1
                          if nt < dist[v]:
                              dist[v] = nt
                              heapq.heappush(heap, (nt, v))
              return -1
        `,
        javascript: code`
          var minTime = function(n, edges) {
              var adj = [], dist = [], SH = 131072;
              for (var i = 0; i < n; i++) { adj.push([]); dist.push(Infinity); }
              for (var k = 0; k < edges.length; k++) adj[edges[k][0]].push(k);
              dist[0] = 0;
              var heap = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var u = key % SH, t = (key - u) / SH;
                  if (t > dist[u]) continue;
                  if (u === n - 1) return t;
                  for (var j = 0; j < adj[u].length; j++) {
                      var ed = edges[adj[u][j]];
                      if (t > ed[3]) continue;
                      var nt = Math.max(t, ed[2]) + 1, v = ed[1];
                      if (nt < dist[v]) { dist[v] = nt; heapPush(heap, nt * SH + v); }
                  }
              }
              return -1;
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

          function minTime(n: number, edges: number[][]): number {
              var adj: number[][] = [], dist: number[] = [], SH = 131072;
              for (var i = 0; i < n; i++) { adj.push([]); dist.push(Infinity); }
              for (var k = 0; k < edges.length; k++) adj[edges[k][0]].push(k);
              dist[0] = 0;
              var heap: number[] = [0];
              while (heap.length > 0) {
                  var key = heapPop(heap);
                  var u = key % SH, t = (key - u) / SH;
                  if (t > dist[u]) continue;
                  if (u === n - 1) return t;
                  for (var j = 0; j < adj[u].length; j++) {
                      var ed = edges[adj[u][j]];
                      if (t > ed[3]) continue;
                      var nt = Math.max(t, ed[2]) + 1, v = ed[1];
                      if (nt < dist[v]) { dist[v] = nt; heapPush(heap, nt * SH + v); }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minTime(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int k = 0; k < edges.length; k++) adj.get(edges[k][0]).add(k);
              final long SH = 131072L;
              long[] dist = new long[n];
              Arrays.fill(dist, Long.MAX_VALUE);
              dist[0] = 0;
              PriorityQueue<Long> heap = new PriorityQueue<>();
              heap.add(0L);
              while (!heap.isEmpty()) {
                  long key = heap.poll();
                  int u = (int) (key % SH);
                  long t = key / SH;
                  if (t > dist[u]) continue;
                  if (u == n - 1) return (int) t;
                  for (int k : adj.get(u)) {
                      int[] ed = edges[k];
                      if (t > ed[3]) continue;
                      long nt = Math.max(t, (long) ed[2]) + 1;
                      if (nt < dist[ed[1]]) { dist[ed[1]] = nt; heap.add(nt * SH + ed[1]); }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minTime(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n);
              for (int k = 0; k < (int) edges.size(); k++) adj[edges[k][0]].push_back(k);
              vector<long long> dist(n, LLONG_MAX);
              priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> heap;
              dist[0] = 0;
              heap.push(make_pair(0LL, 0));
              while (!heap.empty()) {
                  long long t = heap.top().first;
                  int u = heap.top().second;
                  heap.pop();
                  if (t > dist[u]) continue;
                  if (u == n - 1) return (int) t;
                  for (int k : adj[u]) {
                      vector<int>& ed = edges[k];
                      if (t > ed[3]) continue;
                      long long nt = max(t, (long long) ed[2]) + 1;
                      if (nt < dist[ed[1]]) { dist[ed[1]] = nt; heap.push(make_pair(nt, ed[1])); }
                  }
              }
              return -1;
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

          int minTime(int n, int** edges, int edgesSize, int* edgesColSize) {
              const long long SH = 131072LL;
              int* head = (int*)malloc(n * sizeof(int));
              int* nxt = (int*)malloc((edgesSize + 1) * sizeof(int));
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int k = 0; k < edgesSize; k++) { nxt[k] = head[edges[k][0]]; head[edges[k][0]] = k; }
              long long* dist = (long long*)malloc(n * sizeof(long long));
              for (int i = 0; i < n; i++) dist[i] = 4000000000000000LL;
              long long* heap = (long long*)malloc((edgesSize + 2) * sizeof(long long));
              int size = 0, ans = -1;
              dist[0] = 0;
              hpPush(heap, &size, 0);
              while (size > 0) {
                  long long key = hpPop(heap, &size);
                  int u = (int)(key % SH);
                  long long t = key / SH;
                  if (t > dist[u]) continue;
                  if (u == n - 1) { ans = (int) t; break; }
                  for (int k = head[u]; k != -1; k = nxt[k]) {
                      if (t > edges[k][3]) continue;
                      long long nt = (t > edges[k][2] ? t : edges[k][2]) + 1;
                      int v = edges[k][1];
                      if (nt < dist[v]) { dist[v] = nt; hpPush(heap, &size, nt * SH + v); }
                  }
              }
              free(head); free(nxt); free(dist); free(heap);
              return ans;
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

          public static int MinTime(int n, int[][] edges)
          {
              const long SH = 131072L;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              for (int k = 0; k < edges.Length; k++) adj[edges[k][0]].Add(k);
              var dist = new long[n];
              for (int i = 0; i < n; i++) dist[i] = long.MaxValue;
              dist[0] = 0;
              var heap = new List<long> { 0 };
              while (heap.Count > 0)
              {
                  long key = HeapPop(heap);
                  int u = (int)(key % SH);
                  long t = key / SH;
                  if (t > dist[u]) continue;
                  if (u == n - 1) return (int) t;
                  foreach (int k in adj[u])
                  {
                      var ed = edges[k];
                      if (t > ed[3]) continue;
                      long nt = Math.Max(t, (long) ed[2]) + 1;
                      if (nt < dist[ed[1]]) { dist[ed[1]] = nt; HeapPush(heap, nt * SH + ed[1]); }
                  }
              }
              return -1;
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

          func minTime(n int, edges [][]int) int {
          	const SH = 131072
          	adj := make([][]int, n)
          	for k, e := range edges {
          		adj[e[0]] = append(adj[e[0]], k)
          	}
          	dist := make([]int, n)
          	for i := range dist {
          		dist[i] = 1 << 62
          	}
          	dist[0] = 0
          	heap := []int{0}
          	for len(heap) > 0 {
          		key := hpPop(&heap)
          		u, t := key%SH, key/SH
          		if t > dist[u] {
          			continue
          		}
          		if u == n-1 {
          			return t
          		}
          		for _, k := range adj[u] {
          			ed := edges[k]
          			if t > ed[3] {
          				continue
          			}
          			nt := t
          			if ed[2] > nt {
          				nt = ed[2]
          			}
          			nt++
          			if nt < dist[ed[1]] {
          				dist[ed[1]] = nt
          				hpPush(&heap, nt*SH+ed[1])
          			}
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minTime(n: Int, edges: Array<IntArray>): Int {
              val SH = 131072L
              val adj = Array(n) { ArrayList<Int>() }
              for (k in edges.indices) adj[edges[k][0]].add(k)
              val dist = LongArray(n) { Long.MAX_VALUE }
              dist[0] = 0L
              val heap = PriorityQueue<Long>()
              heap.add(0L)
              while (heap.isNotEmpty()) {
                  val key = heap.poll()
                  val u = (key % SH).toInt()
                  val t = key / SH
                  if (t > dist[u]) continue
                  if (u == n - 1) return t.toInt()
                  for (k in adj[u]) {
                      val ed = edges[k]
                      if (t > ed[3]) continue
                      val nt = maxOf(t, ed[2].toLong()) + 1
                      if (nt < dist[ed[1]]) { dist[ed[1]] = nt; heap.add(nt * SH + ed[1]) }
                  }
              }
              return -1
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

          func minTime(_ n: Int, _ edges: [[Int]]) -> Int {
              let SH = 131072
              var adj = [[Int]](repeating: [], count: n)
              for k in 0..<edges.count { adj[edges[k][0]].append(k) }
              var dist = [Int](repeating: Int.max, count: n)
              dist[0] = 0
              var heap = [0]
              while !heap.isEmpty {
                  let key = hpPop(&heap)
                  let u = key % SH, t = key / SH
                  if t > dist[u] { continue }
                  if u == n - 1 { return t }
                  for k in adj[u] {
                      let ed = edges[k]
                      if t > ed[3] { continue }
                      let nt = max(t, ed[2]) + 1
                      if nt < dist[ed[1]] { dist[ed[1]] = nt; hpPush(&heap, nt * SH + ed[1]) }
                  }
              }
              return -1
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minTime(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for (k, e) in edges.iter().enumerate() {
                  adj[e[0] as usize].push(k);
              }
              let mut dist = vec![std::i64::MAX; n];
              let mut heap = BinaryHeap::new();
              dist[0] = 0;
              heap.push(Reverse((0i64, 0usize)));
              while let Some(Reverse((t, u))) = heap.pop() {
                  if t > dist[u] {
                      continue;
                  }
                  if u == n - 1 {
                      return t as i32;
                  }
                  for &k in adj[u].iter() {
                      let ed = &edges[k];
                      if t > ed[3] as i64 {
                          continue;
                      }
                      let nt = std::cmp::max(t, ed[2] as i64) + 1;
                      let v = ed[1] as usize;
                      if nt < dist[v] {
                          dist[v] = nt;
                          heap.push(Reverse((nt, v)));
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minTime($n, $edges) {
              $SH = 131072;
              $adj = array_fill(0, $n, []);
              foreach ($edges as $k => $e) $adj[$e[0]][] = $k;
              $dist = array_fill(0, $n, PHP_INT_MAX);
              $dist[0] = 0;
              $heap = new \SplMinHeap();
              $heap->insert(0);
              while (!$heap->isEmpty()) {
                  $key = $heap->extract();
                  $u = $key % $SH;
                  $t = intdiv($key, $SH);
                  if ($t > $dist[$u]) continue;
                  if ($u == $n - 1) return $t;
                  foreach ($adj[$u] as $k) {
                      $ed = $edges[$k];
                      if ($t > $ed[3]) continue;
                      $nt = max($t, $ed[2]) + 1;
                      if ($nt < $dist[$ed[1]]) { $dist[$ed[1]] = $nt; $heap->insert($nt * $SH + $ed[1]); }
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minTime(n, edges)
            sh = 131_072
            adj = Array.new(n) { [] }
            edges.each_with_index { |e, k| adj[e[0]] << k }
            dist = Array.new(n, Float::INFINITY)
            dist[0] = 0
            heap = [0]
            until heap.empty?
              key = hp_pop(heap)
              u = key % sh
              t = key / sh
              next if t > dist[u]
              return t if u == n - 1
              adj[u].each do |k|
                _, v, s, e = edges[k]
                next if t > e
                nt = [t, s].max + 1
                if nt < dist[v]
                  dist[v] = nt
                  hp_push(heap, nt * sh + v)
                end
              end
            end
            -1
          end

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
        `,
      },
    };
  })(),

  // ── Count Islands With Total Value Divisible by K (LC 3619) ─────
  (() => {
    const ref = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length;
      const seen = grid.map((row) => row.map(() => false));
      let count = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (grid[r][c] === 0 || seen[r][c]) continue;
        let sum = 0;
        const stack = [[r, c]];
        seen[r][c] = true;
        while (stack.length) {
          const [x, y] = stack.pop()!;
          sum += grid[x][y];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = x + dx, b = y + dy;
            if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a][b]) { seen[a][b] = true; stack.push([a, b]); }
          }
        }
        if (sum % k === 0) count++;
      }
      return count;
    };
    return {
      slug: "count-islands-with-total-value-divisible-by-k",
      title: "Count Islands With Total Value Divisible by K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon"],
      signature: { funcName: "countIslands", params: [{ name: "grid", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` matrix `grid` of non-negative integers and a positive integer `k`.\n\nAn **island** is a maximal group of cells holding **positive** values that are connected horizontally or vertically. The **total value** of an island is the sum of all its cells.\n\nReturn the number of islands whose total value is divisible by `k`.",
        [
          { in: "grid = [[0,2,1,0,0],[0,5,0,0,5],[0,0,1,0,0],[0,1,4,7,0],[0,2,0,0,8]], k = 5", out: "2", note: "The four islands total 8, 5, 15 and 8; only the ones totalling 5 and 15 are divisible by 5." },
          { in: "grid = [[3,0,3,0],[0,3,0,3],[3,0,3,0]], k = 3", out: "6", note: "Six single-cell islands of value 3, each divisible by 3." },
          { in: "grid = [[0,0],[0,0]], k = 4", out: "0", note: "There is no positive cell, so there are no islands." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "0 <= grid[i][j] <= 10^6", "1 <= k <= 10^6"]),
      hints: [
        "This is the classic island count with one extra number per island: its total value.",
        "Flood-fill each unvisited positive cell (BFS or an explicit stack), adding up the values as you go.",
        "An island can total about `10^11`, so either keep the sum in 64 bits or keep it modulo `k` while adding.",
      ],
      editorial: explain({
        idea: "Visit every island exactly once with a flood fill, accumulating its value, and test divisibility at the end of each fill.",
        steps: [
          "Scan the grid; at each positive cell not yet visited, start a flood fill.",
          "Pop cells from a stack, add their value (modulo `k`) and push their unvisited positive neighbours.",
          "When the stack is empty the island is complete: count it if the accumulated value is `0` modulo `k`.",
        ],
        why: "Each flood fill reaches exactly the cells connected to its start through positive cells, which is one island, and marking cells as visited guarantees no island is counted twice. Adding modulo `k` keeps the remainder exact.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Zero cells are water, not land of value 0.",
          "Diagonal neighbours do not connect islands.",
          "Recursive DFS over a 10^5-cell island can overflow the stack; use an explicit stack.",
        ],
      }),
      examples: [
        { input: "[[0,2,1,0,0],[0,5,0,0,5],[0,0,1,0,0],[0,1,4,7,0],[0,2,0,0,8]]\n5", expectedOutput: "2" },
        { input: "[[3,0,3,0],[0,3,0,3],[3,0,3,0]]\n3", expectedOutput: "6" },
        { input: "[[0,0],[0,0]]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 8])), n = ri(rng, 1, pick(rng, [2, 4, 8]));
        const p = pick(rng, [0.2, 0.4, 0.6, 0.9]);
        const top = pick(rng, [1, 5, 20, 1000000]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? ri(rng, 1, top) : 0)));
        const k = pick(rng, [1, 2, 3, 5, ri(rng, 1, 10), ri(rng, 1, 1000000)]);
        return { input: `${fmtIntMat(grid)}\n${k}`, expectedOutput: String(ref(grid, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countIslands(grid: List[List[int]], k: int) -> int:
              m, n = len(grid), len(grid[0])
              seen = [[False] * n for _ in range(m)]
              count = 0
              for r in range(m):
                  for c in range(n):
                      if grid[r][c] == 0 or seen[r][c]:
                          continue
                      seen[r][c] = True
                      stack = [(r, c)]
                      rem = 0
                      while stack:
                          x, y = stack.pop()
                          rem = (rem + grid[x][y]) % k
                          for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                              if 0 <= a < m and 0 <= b < n and grid[a][b] > 0 and not seen[a][b]:
                                  seen[a][b] = True
                                  stack.append((a, b))
                      if rem == 0:
                          count += 1
              return count
        `,
        javascript: code`
          var countIslands = function(grid, k) {
              var m = grid.length, n = grid[0].length;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var seen = [];
              for (var i = 0; i < m * n; i++) seen.push(false);
              var count = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (grid[r][c] === 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = true;
                      var stack = [r * n + c], rem = 0;
                      while (stack.length > 0) {
                          var cell = stack.pop(), x = Math.floor(cell / n), y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (var d = 0; d < 4; d++) {
                              var a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = true;
                                  stack.push(a * n + b);
                              }
                          }
                      }
                      if (rem === 0) count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function countIslands(grid: number[][], k: number): number {
              var m = grid.length, n = grid[0].length;
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var seen: boolean[] = [];
              for (var i = 0; i < m * n; i++) seen.push(false);
              var count = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (grid[r][c] === 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = true;
                      var stack: number[] = [r * n + c], rem = 0;
                      while (stack.length > 0) {
                          var cell = stack.pop() as number, x = Math.floor(cell / n), y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (var d = 0; d < 4; d++) {
                              var a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = true;
                                  stack.push(a * n + b);
                              }
                          }
                      }
                      if (rem === 0) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int countIslands(int[][] grid, int k) {
              int m = grid.length, n = grid[0].length;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              boolean[] seen = new boolean[m * n];
              int[] stack = new int[m * n];
              int count = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (grid[r][c] == 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = true;
                      int top = 0;
                      stack[top++] = r * n + c;
                      long rem = 0;
                      while (top > 0) {
                          int cell = stack[--top], x = cell / n, y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (int d = 0; d < 4; d++) {
                              int a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = true;
                                  stack[top++] = a * n + b;
                              }
                          }
                      }
                      if (rem == 0) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int countIslands(vector<vector<int>>& grid, int k) {
              int m = grid.size(), n = grid[0].size();
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              vector<char> seen(m * n, 0);
              vector<int> stack;
              int count = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (grid[r][c] == 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = 1;
                      stack.push_back(r * n + c);
                      long long rem = 0;
                      while (!stack.empty()) {
                          int cell = stack.back();
                          stack.pop_back();
                          int x = cell / n, y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (int d = 0; d < 4; d++) {
                              int a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = 1;
                                  stack.push_back(a * n + b);
                              }
                          }
                      }
                      if (rem == 0) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          int countIslands(int** grid, int gridSize, int* gridColSize, int k) {
              int m = gridSize, n = gridColSize[0];
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              char* seen = (char*)calloc(m * n, 1);
              int* stack = (int*)malloc(m * n * sizeof(int));
              int count = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (grid[r][c] == 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = 1;
                      int top = 0;
                      stack[top++] = r * n + c;
                      long long rem = 0;
                      while (top > 0) {
                          int cell = stack[--top], x = cell / n, y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (int d = 0; d < 4; d++) {
                              int a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = 1;
                                  stack[top++] = a * n + b;
                              }
                          }
                      }
                      if (rem == 0) count++;
                  }
              }
              free(seen);
              free(stack);
              return count;
          }
        `,
        csharp: code`
          public static int CountIslands(int[][] grid, int k)
          {
              int m = grid.Length, n = grid[0].Length;
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              var seen = new bool[m * n];
              var stack = new int[m * n];
              int count = 0;
              for (int r = 0; r < m; r++)
              {
                  for (int c = 0; c < n; c++)
                  {
                      if (grid[r][c] == 0 || seen[r * n + c]) continue;
                      seen[r * n + c] = true;
                      int top = 0;
                      stack[top++] = r * n + c;
                      long rem = 0;
                      while (top > 0)
                      {
                          int cell = stack[--top], x = cell / n, y = cell % n;
                          rem = (rem + grid[x][y]) % k;
                          for (int d = 0; d < 4; d++)
                          {
                              int a = x + DR[d], b = y + DC[d];
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b])
                              {
                                  seen[a * n + b] = true;
                                  stack[top++] = a * n + b;
                              }
                          }
                      }
                      if (rem == 0) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func countIslands(grid [][]int, k int) int {
          	m, n := len(grid), len(grid[0])
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	seen := make([]bool, m*n)
          	count := 0
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			if grid[r][c] == 0 || seen[r*n+c] {
          				continue
          			}
          			seen[r*n+c] = true
          			stack := []int{r*n + c}
          			rem := 0
          			for len(stack) > 0 {
          				cell := stack[len(stack)-1]
          				stack = stack[:len(stack)-1]
          				x, y := cell/n, cell%n
          				rem = (rem + grid[x][y]) % k
          				for d := 0; d < 4; d++ {
          					a, b := x+DR[d], y+DC[d]
          					if a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a*n+b] {
          						seen[a*n+b] = true
          						stack = append(stack, a*n+b)
          					}
          				}
          			}
          			if rem == 0 {
          				count++
          			}
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun countIslands(grid: Array<IntArray>, k: Int): Int {
              val m = grid.size
              val n = grid[0].size
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              val seen = BooleanArray(m * n)
              val stack = IntArray(m * n)
              var count = 0
              for (r in 0 until m) {
                  for (c in 0 until n) {
                      if (grid[r][c] == 0 || seen[r * n + c]) continue
                      seen[r * n + c] = true
                      var top = 0
                      stack[top++] = r * n + c
                      var rem = 0L
                      while (top > 0) {
                          val cell = stack[--top]
                          val x = cell / n
                          val y = cell % n
                          rem = (rem + grid[x][y]) % k
                          for (d in 0 until 4) {
                              val a = x + DR[d]
                              val b = y + DC[d]
                              if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]) {
                                  seen[a * n + b] = true
                                  stack[top++] = a * n + b
                              }
                          }
                      }
                      if (rem == 0L) count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func countIslands(_ grid: [[Int]], _ k: Int) -> Int {
              let m = grid.count, n = grid[0].count
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var seen = [Bool](repeating: false, count: m * n)
              var count = 0
              for r in 0..<m {
                  for c in 0..<n {
                      if grid[r][c] == 0 || seen[r * n + c] { continue }
                      seen[r * n + c] = true
                      var stack = [r * n + c]
                      var rem = 0
                      while let cell = stack.popLast() {
                          let x = cell / n, y = cell % n
                          rem = (rem + grid[x][y]) % k
                          for d in 0..<4 {
                              let a = x + DR[d], b = y + DC[d]
                              if a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b] {
                                  seen[a * n + b] = true
                                  stack.append(a * n + b)
                              }
                          }
                      }
                      if rem == 0 { count += 1 }
                  }
              }
              return count
          }
        `,
        rust: code`
          fn countIslands(grid: Vec<Vec<i32>>, k: i32) -> i32 {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let dr = [1, -1, 0, 0];
              let dc = [0, 0, 1, -1];
              let mut seen = vec![false; (m * n) as usize];
              let mut count = 0;
              for r in 0..m {
                  for c in 0..n {
                      if grid[r as usize][c as usize] == 0 || seen[(r * n + c) as usize] {
                          continue;
                      }
                      seen[(r * n + c) as usize] = true;
                      let mut stack: Vec<i32> = vec![r * n + c];
                      let mut rem: i64 = 0;
                      while let Some(cell) = stack.pop() {
                          let x = cell / n;
                          let y = cell % n;
                          rem = (rem + grid[x as usize][y as usize] as i64) % k as i64;
                          for d in 0..4 {
                              let a = x + dr[d];
                              let b = y + dc[d];
                              if a >= 0 && a < m && b >= 0 && b < n && grid[a as usize][b as usize] > 0 && !seen[(a * n + b) as usize] {
                                  seen[(a * n + b) as usize] = true;
                                  stack.push(a * n + b);
                              }
                          }
                      }
                      if rem == 0 {
                          count += 1;
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function countIslands($grid, $k) {
              $m = count($grid);
              $n = count($grid[0]);
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              $seen = array_fill(0, $m * $n, false);
              $count = 0;
              for ($r = 0; $r < $m; $r++) {
                  for ($c = 0; $c < $n; $c++) {
                      if ($grid[$r][$c] == 0 || $seen[$r * $n + $c]) continue;
                      $seen[$r * $n + $c] = true;
                      $stack = [$r * $n + $c];
                      $rem = 0;
                      while (count($stack) > 0) {
                          $cell = array_pop($stack);
                          $x = intdiv($cell, $n);
                          $y = $cell % $n;
                          $rem = ($rem + $grid[$x][$y]) % $k;
                          for ($d = 0; $d < 4; $d++) {
                              $a = $x + $DR[$d];
                              $b = $y + $DC[$d];
                              if ($a >= 0 && $a < $m && $b >= 0 && $b < $n && $grid[$a][$b] > 0 && !$seen[$a * $n + $b]) {
                                  $seen[$a * $n + $b] = true;
                                  $stack[] = $a * $n + $b;
                              }
                          }
                      }
                      if ($rem == 0) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def countIslands(grid, k)
            m = grid.length
            n = grid[0].length
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            seen = Array.new(m * n, false)
            count = 0
            m.times do |r|
              n.times do |c|
                next if grid[r][c] == 0 || seen[r * n + c]
                seen[r * n + c] = true
                stack = [r * n + c]
                rem = 0
                until stack.empty?
                  cell = stack.pop
                  x = cell / n
                  y = cell % n
                  rem = (rem + grid[x][y]) % k
                  dirs.each do |dx, dy|
                    a = x + dx
                    b = y + dy
                    next unless a >= 0 && a < m && b >= 0 && b < n && grid[a][b] > 0 && !seen[a * n + b]
                    seen[a * n + b] = true
                    stack << a * n + b
                  end
                end
                count += 1 if rem == 0
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Bricks Falling When Hit (LC 803) ────────────────────────────
  (() => {
    const ref = (grid: number[][], hits: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const g = grid.map((row) => row.slice());
      const stableCount = () => {
        const seen = g.map((row) => row.map(() => false));
        const stack: number[][] = [];
        for (let c = 0; c < n; c++) if (g[0][c] === 1) { seen[0][c] = true; stack.push([0, c]); }
        while (stack.length) {
          const [x, y] = stack.pop()!;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = x + dx, b = y + dy;
            if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] === 1 && !seen[a][b]) { seen[a][b] = true; stack.push([a, b]); }
          }
        }
        let fell = 0;
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (g[r][c] === 1 && !seen[r][c]) { g[r][c] = 0; fell++; }
        return fell;
      };
      return hits.map(([r, c]) => {
        if (g[r][c] === 0) return 0;
        g[r][c] = 0;
        return stableCount();
      });
    };
    return {
      slug: "bricks-falling-when-hit",
      title: "Bricks Falling When Hit",
      difficulty: "HARD" as const,
      tags: ["Array", "Union Find", "Matrix", "Google", "Amazon"],
      signature: { funcName: "hitBricks", params: [{ name: "grid", type: "int[][]" as const }, { name: "hits", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an `m x n` binary grid where `1` is a brick and `0` is empty space. A brick is **stable** if it is in the top row, or if it shares an edge with at least one stable brick.\n\nYou are also given `hits`, a sequence of cells to erase. For `hits[i] = [xi, yi]`, the brick at that cell (if there is one) disappears. Afterwards, every brick that is no longer stable falls at once and is removed from the grid; falling bricks never land on other bricks.\n\nReturn an array `result` where `result[i]` is the number of bricks that **fall** after the `i`-th erasure. The erased brick itself does not count.",
        [
          { in: "grid = [[1,0,0,0],[1,1,1,0]], hits = [[1,0]]", out: "[2]", note: "Erasing (1,0) leaves (1,1) and (1,2) with no path to the top row, so both fall." },
          { in: "grid = [[1,0,0,0],[1,1,0,0]], hits = [[1,1],[1,0]]", out: "[0,0]", note: "Each erasure removes a brick but leaves every remaining brick stable." },
          { in: "grid = [[1],[1],[1]], hits = [[1,0],[0,0]]", out: "[1,0]", note: "Erasing the middle brick drops the bottom one; the top brick is then erased with nothing below it." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 200", "grid[i][j] is 0 or 1", "1 <= hits.length <= 4 * 10^4", "hits[i].length == 2", "0 <= xi <= m - 1", "0 <= yi <= n - 1", "all (xi, yi) are unique", "every brick of grid is stable before the first erasure"]),
      hints: [
        "Erasing breaks connectivity, which is hard to maintain. Adding bricks only joins components — and that is what a union-find is good at. Can you play the hits backwards?",
        "Erase every hit cell first, union the remaining bricks, and connect the top row to a virtual \"roof\" node.",
        "Now restore the hits in reverse. When a brick is put back, the roof's component grows; the growth minus the restored brick itself is how many bricks that hit made fall. A hit on an empty cell made nothing fall.",
      ],
      editorial: explain({
        idea: "Run time backwards. In reverse, each hit adds a brick back, and the bricks that fell are exactly those that become attached to the roof by that addition. Union-find with component sizes measures this in near-constant time per hit.",
        steps: [
          "Copy the grid and erase every hit cell. Make one union-find node per cell plus a roof node.",
          "Union every remaining brick with its brick neighbours, and every top-row brick with the roof.",
          "For the hits from last to first: if the original cell was empty, the answer is 0. Otherwise record the roof component's size, restore the brick, union it with the roof (if in the top row) and with neighbouring bricks, and set the answer to `max(0, newSize - oldSize - 1)`.",
        ],
        why: "Running forward, the bricks that fall at hit `i` are those connected to the roof only through the brick removed at hit `i`. Running backward, adding that brick back attaches exactly those bricks (plus the brick itself) to the roof's component. When the restored brick does not touch the roof's component, the size does not change and the `max(0, …)` keeps the answer at 0.",
        time: "O((m · n + h) · α(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "A hit on an empty cell makes nothing fall — and it must not restore a brick that was never there.",
          "Subtract 1 for the restored brick itself; it was erased, it did not fall.",
          "Bricks that fell earlier are gone for good: in reverse they simply have not been attached yet.",
        ],
      }),
      examples: [
        { input: "[[1,0,0,0],[1,1,1,0]]\n[[1,0]]", expectedOutput: "[2]" },
        { input: "[[1,0,0,0],[1,1,0,0]]\n[[1,1],[1,0]]", expectedOutput: "[0,0]" },
        { input: "[[1],[1],[1]]\n[[1,0],[0,0]]", expectedOutput: "[1,0]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 6])), n = ri(rng, 1, pick(rng, [2, 4, 6]));
        const p = pick(rng, [0.5, 0.7, 0.9, 1]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        // The statement guarantees a stable starting grid: drop any brick not attached to the top row.
        const keep = grid.map((row) => row.map(() => false));
        const stack: number[][] = [];
        for (let c = 0; c < n; c++) if (grid[0][c] === 1) { keep[0][c] = true; stack.push([0, c]); }
        while (stack.length) {
          const [x, y] = stack.pop()!;
          for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] === 1 && !keep[a][b]) { keep[a][b] = true; stack.push([a, b]); }
          }
        }
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (!keep[r][c]) grid[r][c] = 0;
        const cells: number[][] = [];
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
        shuffle(rng, cells);
        const hits = cells.slice(0, ri(rng, 1, cells.length));
        return { input: `${fmtIntMat(grid)}\n${fmtIntMat(hits)}`, expectedOutput: fmtIntArr(ref(grid, hits)) };
      },
      solutions: {
        python: code`
          from typing import List

          def hitBricks(grid: List[List[int]], hits: List[List[int]]) -> List[int]:
              m, n = len(grid), len(grid[0])
              roof = m * n
              parent = list(range(m * n + 1))
              size = [1] * (m * n + 1)

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              def union(a, b):
                  ra, rb = find(a), find(b)
                  if ra == rb:
                      return
                  if size[ra] < size[rb]:
                      ra, rb = rb, ra
                  parent[rb] = ra
                  size[ra] += size[rb]

              g = [row[:] for row in grid]
              for r, c in hits:
                  g[r][c] = 0
              for r in range(m):
                  for c in range(n):
                      if g[r][c] == 1:
                          if r == 0:
                              union(c, roof)
                          if r > 0 and g[r - 1][c] == 1:
                              union(r * n + c, (r - 1) * n + c)
                          if c > 0 and g[r][c - 1] == 1:
                              union(r * n + c, r * n + c - 1)
              ans = [0] * len(hits)
              for i in range(len(hits) - 1, -1, -1):
                  r, c = hits[i]
                  if grid[r][c] == 0:
                      continue
                  before = size[find(roof)]
                  g[r][c] = 1
                  if r == 0:
                      union(c, roof)
                  for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if 0 <= a < m and 0 <= b < n and g[a][b] == 1:
                          union(r * n + c, a * n + b)
                  ans[i] = max(0, size[find(roof)] - before - 1)
              return ans
        `,
        javascript: code`
          var hitBricks = function(grid, hits) {
              var m = grid.length, n = grid[0].length, roof = m * n;
              var parent = [], size = [];
              for (var i = 0; i <= m * n; i++) { parent.push(i); size.push(1); }
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a, b) {
                  var ra = find(a), rb = find(b);
                  if (ra === rb) return;
                  if (size[ra] < size[rb]) { var t = ra; ra = rb; rb = t; }
                  parent[rb] = ra;
                  size[ra] += size[rb];
              };
              var g = [];
              for (var r0 = 0; r0 < m; r0++) g.push(grid[r0].slice());
              for (var h = 0; h < hits.length; h++) g[hits[h][0]][hits[h][1]] = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (g[r][c] !== 1) continue;
                      if (r === 0) union(c, roof);
                      if (r > 0 && g[r - 1][c] === 1) union(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r][c - 1] === 1) union(r * n + c, r * n + c - 1);
                  }
              }
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var ans = [];
              for (var z = 0; z < hits.length; z++) ans.push(0);
              for (var k = hits.length - 1; k >= 0; k--) {
                  var x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] === 0) continue;
                  var before = size[find(roof)];
                  g[x][y] = 1;
                  if (x === 0) union(y, roof);
                  for (var d = 0; d < 4; d++) {
                      var a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] === 1) union(x * n + y, a * n + b);
                  }
                  ans[k] = Math.max(0, size[find(roof)] - before - 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function hitBricks(grid: number[][], hits: number[][]): number[] {
              var m = grid.length, n = grid[0].length, roof = m * n;
              var parent: number[] = [], size: number[] = [];
              for (var i = 0; i <= m * n; i++) { parent.push(i); size.push(1); }
              var find = function(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a: number, b: number): void {
                  var ra = find(a), rb = find(b);
                  if (ra === rb) return;
                  if (size[ra] < size[rb]) { var t = ra; ra = rb; rb = t; }
                  parent[rb] = ra;
                  size[ra] += size[rb];
              };
              var g: number[][] = [];
              for (var r0 = 0; r0 < m; r0++) g.push(grid[r0].slice());
              for (var h = 0; h < hits.length; h++) g[hits[h][0]][hits[h][1]] = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (g[r][c] !== 1) continue;
                      if (r === 0) union(c, roof);
                      if (r > 0 && g[r - 1][c] === 1) union(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r][c - 1] === 1) union(r * n + c, r * n + c - 1);
                  }
              }
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              var ans: number[] = [];
              for (var z = 0; z < hits.length; z++) ans.push(0);
              for (var k = hits.length - 1; k >= 0; k--) {
                  var x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] === 0) continue;
                  var before = size[find(roof)];
                  g[x][y] = 1;
                  if (x === 0) union(y, roof);
                  for (var d = 0; d < 4; d++) {
                      var a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] === 1) union(x * n + y, a * n + b);
                  }
                  ans[k] = Math.max(0, size[find(roof)] - before - 1);
              }
              return ans;
          }
        `,
        java: code`
          static int[] par, sz;

          static int find(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void union(int a, int b) {
              int ra = find(a), rb = find(b);
              if (ra == rb) return;
              if (sz[ra] < sz[rb]) { int t = ra; ra = rb; rb = t; }
              par[rb] = ra;
              sz[ra] += sz[rb];
          }

          public static int[] hitBricks(int[][] grid, int[][] hits) {
              int m = grid.length, n = grid[0].length, roof = m * n;
              par = new int[m * n + 1];
              sz = new int[m * n + 1];
              for (int i = 0; i <= m * n; i++) { par[i] = i; sz[i] = 1; }
              int[][] g = new int[m][];
              for (int r = 0; r < m; r++) g[r] = grid[r].clone();
              for (int[] h : hits) g[h[0]][h[1]] = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (g[r][c] != 1) continue;
                      if (r == 0) union(c, roof);
                      if (r > 0 && g[r - 1][c] == 1) union(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r][c - 1] == 1) union(r * n + c, r * n + c - 1);
                  }
              }
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              int[] ans = new int[hits.length];
              for (int k = hits.length - 1; k >= 0; k--) {
                  int x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] == 0) continue;
                  int before = sz[find(roof)];
                  g[x][y] = 1;
                  if (x == 0) union(y, roof);
                  for (int d = 0; d < 4; d++) {
                      int a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1) union(x * n + y, a * n + b);
                  }
                  ans[k] = Math.max(0, sz[find(roof)] - before - 1);
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> par, sz;

          int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra == rb) return;
              if (sz[ra] < sz[rb]) swap(ra, rb);
              par[rb] = ra;
              sz[ra] += sz[rb];
          }

          vector<int> hitBricks(vector<vector<int>>& grid, vector<vector<int>>& hits) {
              int m = grid.size(), n = grid[0].size(), roof = m * n;
              par.assign(m * n + 1, 0);
              sz.assign(m * n + 1, 1);
              for (int i = 0; i <= m * n; i++) par[i] = i;
              vector<vector<int>> g = grid;
              for (auto& h : hits) g[h[0]][h[1]] = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (g[r][c] != 1) continue;
                      if (r == 0) unite(c, roof);
                      if (r > 0 && g[r - 1][c] == 1) unite(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r][c - 1] == 1) unite(r * n + c, r * n + c - 1);
                  }
              }
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              vector<int> ans(hits.size(), 0);
              for (int k = (int) hits.size() - 1; k >= 0; k--) {
                  int x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] == 0) continue;
                  int before = sz[findRoot(roof)];
                  g[x][y] = 1;
                  if (x == 0) unite(y, roof);
                  for (int d = 0; d < 4; d++) {
                      int a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1) unite(x * n + y, a * n + b);
                  }
                  ans[k] = max(0, sz[findRoot(roof)] - before - 1);
              }
              return ans;
          }
        `,
        c: code`
          static int* par;
          static int* sz;

          static int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra == rb) return;
              if (sz[ra] < sz[rb]) { int t = ra; ra = rb; rb = t; }
              par[rb] = ra;
              sz[ra] += sz[rb];
          }

          int* hitBricks(int** grid, int gridSize, int* gridColSize, int** hits, int hitsSize, int* hitsColSize, int* returnSize) {
              int m = gridSize, n = gridColSize[0], roof = m * n;
              par = (int*)malloc((m * n + 1) * sizeof(int));
              sz = (int*)malloc((m * n + 1) * sizeof(int));
              for (int i = 0; i <= m * n; i++) { par[i] = i; sz[i] = 1; }
              int* g = (int*)malloc(m * n * sizeof(int));
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) g[r * n + c] = grid[r][c];
              for (int h = 0; h < hitsSize; h++) g[hits[h][0] * n + hits[h][1]] = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      if (g[r * n + c] != 1) continue;
                      if (r == 0) unite(c, roof);
                      if (r > 0 && g[(r - 1) * n + c] == 1) unite(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r * n + c - 1] == 1) unite(r * n + c, r * n + c - 1);
                  }
              }
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              int* ans = (int*)calloc(hitsSize + 1, sizeof(int));
              for (int k = hitsSize - 1; k >= 0; k--) {
                  int x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] == 0) continue;
                  int before = sz[findRoot(roof)];
                  g[x * n + y] = 1;
                  if (x == 0) unite(y, roof);
                  for (int d = 0; d < 4; d++) {
                      int a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a * n + b] == 1) unite(x * n + y, a * n + b);
                  }
                  int fell = sz[findRoot(roof)] - before - 1;
                  ans[k] = fell > 0 ? fell : 0;
              }
              free(par); free(sz); free(g);
              *returnSize = hitsSize;
              return ans;
          }
        `,
        csharp: code`
          static int[] par, sz;

          static int Find(int x)
          {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void Union(int a, int b)
          {
              int ra = Find(a), rb = Find(b);
              if (ra == rb) return;
              if (sz[ra] < sz[rb]) { int t = ra; ra = rb; rb = t; }
              par[rb] = ra;
              sz[ra] += sz[rb];
          }

          public static int[] HitBricks(int[][] grid, int[][] hits)
          {
              int m = grid.Length, n = grid[0].Length, roof = m * n;
              par = new int[m * n + 1];
              sz = new int[m * n + 1];
              for (int i = 0; i <= m * n; i++) { par[i] = i; sz[i] = 1; }
              var g = new int[m][];
              for (int r = 0; r < m; r++) g[r] = (int[])grid[r].Clone();
              foreach (var h in hits) g[h[0]][h[1]] = 0;
              for (int r = 0; r < m; r++)
              {
                  for (int c = 0; c < n; c++)
                  {
                      if (g[r][c] != 1) continue;
                      if (r == 0) Union(c, roof);
                      if (r > 0 && g[r - 1][c] == 1) Union(r * n + c, (r - 1) * n + c);
                      if (c > 0 && g[r][c - 1] == 1) Union(r * n + c, r * n + c - 1);
                  }
              }
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              var ans = new int[hits.Length];
              for (int k = hits.Length - 1; k >= 0; k--)
              {
                  int x = hits[k][0], y = hits[k][1];
                  if (grid[x][y] == 0) continue;
                  int before = sz[Find(roof)];
                  g[x][y] = 1;
                  if (x == 0) Union(y, roof);
                  for (int d = 0; d < 4; d++)
                  {
                      int a = x + DR[d], b = y + DC[d];
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1) Union(x * n + y, a * n + b);
                  }
                  ans[k] = Math.Max(0, sz[Find(roof)] - before - 1);
              }
              return ans;
          }
        `,
        go: code`
          func hitBricks(grid [][]int, hits [][]int) []int {
          	m, n := len(grid), len(grid[0])
          	roof := m * n
          	parent := make([]int, m*n+1)
          	size := make([]int, m*n+1)
          	for i := range parent {
          		parent[i] = i
          		size[i] = 1
          	}
          	var find func(int) int
          	find = func(x int) int {
          		for parent[x] != x {
          			parent[x] = parent[parent[x]]
          			x = parent[x]
          		}
          		return x
          	}
          	union := func(a, b int) {
          		ra, rb := find(a), find(b)
          		if ra == rb {
          			return
          		}
          		if size[ra] < size[rb] {
          			ra, rb = rb, ra
          		}
          		parent[rb] = ra
          		size[ra] += size[rb]
          	}
          	g := make([][]int, m)
          	for r := range grid {
          		g[r] = append([]int{}, grid[r]...)
          	}
          	for _, h := range hits {
          		g[h[0]][h[1]] = 0
          	}
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			if g[r][c] != 1 {
          				continue
          			}
          			if r == 0 {
          				union(c, roof)
          			}
          			if r > 0 && g[r-1][c] == 1 {
          				union(r*n+c, (r-1)*n+c)
          			}
          			if c > 0 && g[r][c-1] == 1 {
          				union(r*n+c, r*n+c-1)
          			}
          		}
          	}
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	ans := make([]int, len(hits))
          	for k := len(hits) - 1; k >= 0; k-- {
          		x, y := hits[k][0], hits[k][1]
          		if grid[x][y] == 0 {
          			continue
          		}
          		before := size[find(roof)]
          		g[x][y] = 1
          		if x == 0 {
          			union(y, roof)
          		}
          		for d := 0; d < 4; d++ {
          			a, b := x+DR[d], y+DC[d]
          			if a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1 {
          				union(x*n+y, a*n+b)
          			}
          		}
          		fell := size[find(roof)] - before - 1
          		if fell > 0 {
          			ans[k] = fell
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun hitBricks(grid: Array<IntArray>, hits: Array<IntArray>): IntArray {
              val m = grid.size
              val n = grid[0].size
              val roof = m * n
              val parent = IntArray(m * n + 1) { it }
              val size = IntArray(m * n + 1) { 1 }
              fun find(start: Int): Int {
                  var x = start
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              fun union(a: Int, b: Int) {
                  var ra = find(a)
                  var rb = find(b)
                  if (ra == rb) return
                  if (size[ra] < size[rb]) { val t = ra; ra = rb; rb = t }
                  parent[rb] = ra
                  size[ra] += size[rb]
              }
              val g = Array(m) { grid[it].copyOf() }
              for (h in hits) g[h[0]][h[1]] = 0
              for (r in 0 until m) {
                  for (c in 0 until n) {
                      if (g[r][c] != 1) continue
                      if (r == 0) union(c, roof)
                      if (r > 0 && g[r - 1][c] == 1) union(r * n + c, (r - 1) * n + c)
                      if (c > 0 && g[r][c - 1] == 1) union(r * n + c, r * n + c - 1)
                  }
              }
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              val ans = IntArray(hits.size)
              for (k in hits.size - 1 downTo 0) {
                  val x = hits[k][0]
                  val y = hits[k][1]
                  if (grid[x][y] == 0) continue
                  val before = size[find(roof)]
                  g[x][y] = 1
                  if (x == 0) union(y, roof)
                  for (d in 0 until 4) {
                      val a = x + DR[d]
                      val b = y + DC[d]
                      if (a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1) union(x * n + y, a * n + b)
                  }
                  ans[k] = maxOf(0, size[find(roof)] - before - 1)
              }
              return ans
          }
        `,
        swift: code`
          func hitBricks(_ grid: [[Int]], _ hits: [[Int]]) -> [Int] {
              let m = grid.count, n = grid[0].count, roof = m * n
              var parent = Array(0...(m * n))
              var size = [Int](repeating: 1, count: m * n + 1)
              func find(_ start: Int) -> Int {
                  var x = start
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              func union(_ a: Int, _ b: Int) {
                  var ra = find(a), rb = find(b)
                  if ra == rb { return }
                  if size[ra] < size[rb] { swap(&ra, &rb) }
                  parent[rb] = ra
                  size[ra] += size[rb]
              }
              var g = grid
              for h in hits { g[h[0]][h[1]] = 0 }
              for r in 0..<m {
                  for c in 0..<n where g[r][c] == 1 {
                      if r == 0 { union(c, roof) }
                      if r > 0 && g[r - 1][c] == 1 { union(r * n + c, (r - 1) * n + c) }
                      if c > 0 && g[r][c - 1] == 1 { union(r * n + c, r * n + c - 1) }
                  }
              }
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var ans = [Int](repeating: 0, count: hits.count)
              for k in stride(from: hits.count - 1, through: 0, by: -1) {
                  let x = hits[k][0], y = hits[k][1]
                  if grid[x][y] == 0 { continue }
                  let before = size[find(roof)]
                  g[x][y] = 1
                  if x == 0 { union(y, roof) }
                  for d in 0..<4 {
                      let a = x + DR[d], b = y + DC[d]
                      if a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1 { union(x * n + y, a * n + b) }
                  }
                  ans[k] = max(0, size[find(roof)] - before - 1)
              }
              return ans
          }
        `,
        rust: code`
          fn find(parent: &mut Vec<usize>, start: usize) -> usize {
              let mut x = start;
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn unite(parent: &mut Vec<usize>, size: &mut Vec<i32>, a: usize, b: usize) {
              let mut ra = find(parent, a);
              let mut rb = find(parent, b);
              if ra == rb {
                  return;
              }
              if size[ra] < size[rb] {
                  std::mem::swap(&mut ra, &mut rb);
              }
              parent[rb] = ra;
              size[ra] += size[rb];
          }

          fn hitBricks(grid: Vec<Vec<i32>>, hits: Vec<Vec<i32>>) -> Vec<i32> {
              let m = grid.len();
              let n = grid[0].len();
              let roof = m * n;
              let mut parent: Vec<usize> = (0..=m * n).collect();
              let mut size = vec![1i32; m * n + 1];
              let mut g = grid.clone();
              for h in hits.iter() {
                  g[h[0] as usize][h[1] as usize] = 0;
              }
              for r in 0..m {
                  for c in 0..n {
                      if g[r][c] != 1 {
                          continue;
                      }
                      if r == 0 {
                          unite(&mut parent, &mut size, c, roof);
                      }
                      if r > 0 && g[r - 1][c] == 1 {
                          unite(&mut parent, &mut size, r * n + c, (r - 1) * n + c);
                      }
                      if c > 0 && g[r][c - 1] == 1 {
                          unite(&mut parent, &mut size, r * n + c, r * n + c - 1);
                      }
                  }
              }
              let dr = [1i32, -1, 0, 0];
              let dc = [0i32, 0, 1, -1];
              let mut ans = vec![0i32; hits.len()];
              for k in (0..hits.len()).rev() {
                  let x = hits[k][0] as usize;
                  let y = hits[k][1] as usize;
                  if grid[x][y] == 0 {
                      continue;
                  }
                  let rr = find(&mut parent, roof);
                  let before = size[rr];
                  g[x][y] = 1;
                  if x == 0 {
                      unite(&mut parent, &mut size, y, roof);
                  }
                  for d in 0..4 {
                      let a = x as i32 + dr[d];
                      let b = y as i32 + dc[d];
                      if a >= 0 && a < m as i32 && b >= 0 && b < n as i32 && g[a as usize][b as usize] == 1 {
                          unite(&mut parent, &mut size, x * n + y, a as usize * n + b as usize);
                      }
                  }
                  let rr = find(&mut parent, roof);
                  ans[k] = std::cmp::max(0, size[rr] - before - 1);
              }
              ans
          }
        `,
        php: code`
          function hitBricks($grid, $hits) {
              $m = count($grid);
              $n = count($grid[0]);
              $roof = $m * $n;
              $parent = range(0, $m * $n);
              $size = array_fill(0, $m * $n + 1, 1);
              $find = function ($x) use (&$parent) {
                  while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
                  return $x;
              };
              $union = function ($a, $b) use (&$parent, &$size, $find) {
                  $ra = $find($a);
                  $rb = $find($b);
                  if ($ra == $rb) return;
                  if ($size[$ra] < $size[$rb]) { $t = $ra; $ra = $rb; $rb = $t; }
                  $parent[$rb] = $ra;
                  $size[$ra] += $size[$rb];
              };
              $g = $grid;
              foreach ($hits as $h) $g[$h[0]][$h[1]] = 0;
              for ($r = 0; $r < $m; $r++) {
                  for ($c = 0; $c < $n; $c++) {
                      if ($g[$r][$c] != 1) continue;
                      if ($r == 0) $union($c, $roof);
                      if ($r > 0 && $g[$r - 1][$c] == 1) $union($r * $n + $c, ($r - 1) * $n + $c);
                      if ($c > 0 && $g[$r][$c - 1] == 1) $union($r * $n + $c, $r * $n + $c - 1);
                  }
              }
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              $ans = array_fill(0, count($hits), 0);
              for ($k = count($hits) - 1; $k >= 0; $k--) {
                  $x = $hits[$k][0];
                  $y = $hits[$k][1];
                  if ($grid[$x][$y] == 0) continue;
                  $before = $size[$find($roof)];
                  $g[$x][$y] = 1;
                  if ($x == 0) $union($y, $roof);
                  for ($d = 0; $d < 4; $d++) {
                      $a = $x + $DR[$d];
                      $b = $y + $DC[$d];
                      if ($a >= 0 && $a < $m && $b >= 0 && $b < $n && $g[$a][$b] == 1) $union($x * $n + $y, $a * $n + $b);
                  }
                  $ans[$k] = max(0, $size[$find($roof)] - $before - 1);
              }
              return $ans;
          }
        `,
        ruby: code`
          def hitBricks(grid, hits)
            m = grid.length
            n = grid[0].length
            roof = m * n
            parent = (0..m * n).to_a
            size = Array.new(m * n + 1, 1)
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            union = lambda do |a, b|
              ra = find.call(a)
              rb = find.call(b)
              return if ra == rb
              ra, rb = rb, ra if size[ra] < size[rb]
              parent[rb] = ra
              size[ra] += size[rb]
            end
            g = grid.map(&:dup)
            hits.each { |r, c| g[r][c] = 0 }
            m.times do |r|
              n.times do |c|
                next unless g[r][c] == 1
                union.call(c, roof) if r == 0
                union.call(r * n + c, (r - 1) * n + c) if r > 0 && g[r - 1][c] == 1
                union.call(r * n + c, r * n + c - 1) if c > 0 && g[r][c - 1] == 1
              end
            end
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            ans = Array.new(hits.length, 0)
            (hits.length - 1).downto(0) do |k|
              x, y = hits[k]
              next if grid[x][y] == 0
              before = size[find.call(roof)]
              g[x][y] = 1
              union.call(y, roof) if x == 0
              dirs.each do |dx, dy|
                a = x + dx
                b = y + dy
                union.call(x * n + y, a * n + b) if a >= 0 && a < m && b >= 0 && b < n && g[a][b] == 1
              end
              ans[k] = [0, size[find.call(roof)] - before - 1].max
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Last Day Where You Can Still Cross (LC 1970) ────────────────
  (() => {
    const ref = (row: number, col: number, cells: number[][]) => {
      const canCross = (day: number) => {
        const water = new Set(cells.slice(0, day).map(([r, c]) => (r - 1) * col + (c - 1)));
        const seen = new Set<number>();
        const stack: number[] = [];
        for (let c = 0; c < col; c++) if (!water.has(c)) { seen.add(c); stack.push(c); }
        while (stack.length) {
          const x = stack.pop()!;
          const r = Math.floor(x / col), c = x % col;
          if (r === row - 1) return true;
          for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
            const y = a * col + b;
            if (a >= 0 && a < row && b >= 0 && b < col && !water.has(y) && !seen.has(y)) { seen.add(y); stack.push(y); }
          }
        }
        return false;
      };
      let best = 0;
      for (let d = 0; d <= cells.length; d++) if (canCross(d)) best = d;
      return best;
    };
    return {
      slug: "last-day-where-you-can-still-cross",
      title: "Last Day Where You Can Still Cross",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Google", "Amazon"],
      signature: { funcName: "latestDayToCross", params: [{ name: "row", type: "int" as const }, { name: "col", type: "int" as const }, { name: "cells", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A `row x col` matrix of land floods one cell per day. On day `0` every cell is land. On day `i` (1-based) the cell `cells[i - 1] = [ri, ci]` becomes water — coordinates are **1-based**, so `[1, 1]` is the top-left cell.\n\nYou want to walk from **any** cell of the top row to **any** cell of the bottom row, stepping only on land and moving up, down, left or right.\n\nReturn the **last** day on which such a walk is still possible.",
        [
          { in: "row = 2, col = 2, cells = [[1,1],[2,1],[1,2],[2,2]]", out: "2", note: "After day 2 the right column is still land; on day 3 the top-right cell floods and the top row is all water." },
          { in: "row = 2, col = 2, cells = [[1,1],[1,2],[2,1],[2,2]]", out: "1" },
          { in: "row = 3, col = 3, cells = [[1,2],[2,1],[3,3],[2,2],[1,1],[1,3],[2,3],[3,2],[3,1]]", out: "3" },
        ],
        ["2 <= row, col <= 2 * 10^4", "4 <= row * col <= 2 * 10^4", "cells.length == row * col", "1 <= ri <= row", "1 <= ci <= col", "all the values of cells are unique"]),
      hints: [
        "If you can cross on day `d`, you can cross on every earlier day — fewer cells are flooded. So the answer is a threshold; binary search with a BFS per probe works.",
        "Alternatively, run time backwards: start from an all-water grid and turn cells back into land from the last day to the first.",
        "With a union-find plus two virtual nodes (top row, bottom row), the first moment going backwards that they become connected, after restoring `cells[i]`, means day `i` is the last crossable day.",
      ],
      editorial: explain({
        idea: "Flooding only removes land, which breaks connectivity; reversing time turns it into adding land, which only merges components — exactly what union-find does well. Two virtual nodes stand for \"the top row\" and \"the bottom row\".",
        steps: [
          "Create a union-find over the `row · col` cells plus a TOP and a BOTTOM node; start with every cell flooded.",
          "For `i` from `row · col - 1` down to 0: turn `cells[i]` into land, union it with TOP if it is in the first row, with BOTTOM if in the last row, and with every neighbouring land cell.",
          "As soon as TOP and BOTTOM share a root, return `i`: on day `i` exactly the cells `cells[i..]` are land.",
        ],
        why: "On day `d` the land is exactly `cells[d], cells[d+1], …`. Restoring cells in reverse order rebuilds those land sets for `d = n - 1, n - 2, …`, and a top-to-bottom walk exists iff TOP and BOTTOM are in one component. Since crossability is monotone in `d`, the first `d` met in this backward scan with a crossing is the largest such day.",
        time: "O(row · col · α(row · col))",
        space: "O(row · col)",
        pitfalls: [
          "Coordinates in `cells` are 1-based.",
          "Moves are 4-directional; diagonal land does not connect.",
          "Return the day, not the index of the cell that completed the crossing plus one: restoring `cells[i]` gives the land of day `i`.",
        ],
      }),
      examples: [
        { input: "2\n2\n[[1,1],[2,1],[1,2],[2,2]]", expectedOutput: "2" },
        { input: "2\n2\n[[1,1],[1,2],[2,1],[2,2]]", expectedOutput: "1" },
        { input: "3\n3\n[[1,2],[2,1],[3,3],[2,2],[1,1],[1,3],[2,3],[3,2],[3,1]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const row = ri(rng, 2, pick(rng, [2, 3, 5, 6])), col = ri(rng, 2, pick(rng, [2, 3, 5, 6]));
        const cells: number[][] = [];
        for (let r = 1; r <= row; r++) for (let c = 1; c <= col; c++) cells.push([r, c]);
        shuffle(rng, cells);
        return { input: `${row}\n${col}\n${fmtIntMat(cells)}`, expectedOutput: String(ref(row, col, cells)) };
      },
      solutions: {
        python: code`
          from typing import List

          def latestDayToCross(row: int, col: int, cells: List[List[int]]) -> int:
              total = row * col
              top, bottom = total, total + 1
              parent = list(range(total + 2))
              land = [False] * total

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              def union(a, b):
                  ra, rb = find(a), find(b)
                  if ra != rb:
                      parent[ra] = rb

              for i in range(total - 1, -1, -1):
                  r, c = cells[i][0] - 1, cells[i][1] - 1
                  x = r * col + c
                  land[x] = True
                  if r == 0:
                      union(x, top)
                  if r == row - 1:
                      union(x, bottom)
                  for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                      if 0 <= a < row and 0 <= b < col and land[a * col + b]:
                          union(x, a * col + b)
                  if find(top) == find(bottom):
                      return i
              return 0
        `,
        javascript: code`
          var latestDayToCross = function(row, col, cells) {
              var total = row * col, top = total, bottom = total + 1;
              var parent = [], land = [];
              for (var i = 0; i < total + 2; i++) { parent.push(i); land.push(false); }
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a, b) {
                  var ra = find(a), rb = find(b);
                  if (ra !== rb) parent[ra] = rb;
              };
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              for (var k = total - 1; k >= 0; k--) {
                  var r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = true;
                  if (r === 0) union(x, top);
                  if (r === row - 1) union(x, bottom);
                  for (var d = 0; d < 4; d++) {
                      var a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) union(x, a * col + b);
                  }
                  if (find(top) === find(bottom)) return k;
              }
              return 0;
          };
        `,
        typescript: code`
          function latestDayToCross(row: number, col: number, cells: number[][]): number {
              var total = row * col, top = total, bottom = total + 1;
              var parent: number[] = [], land: boolean[] = [];
              for (var i = 0; i < total + 2; i++) { parent.push(i); land.push(false); }
              var find = function(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a: number, b: number): void {
                  var ra = find(a), rb = find(b);
                  if (ra !== rb) parent[ra] = rb;
              };
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              for (var k = total - 1; k >= 0; k--) {
                  var r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = true;
                  if (r === 0) union(x, top);
                  if (r === row - 1) union(x, bottom);
                  for (var d = 0; d < 4; d++) {
                      var a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) union(x, a * col + b);
                  }
                  if (find(top) === find(bottom)) return k;
              }
              return 0;
          }
        `,
        java: code`
          static int[] par;

          static int find(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void union(int a, int b) {
              int ra = find(a), rb = find(b);
              if (ra != rb) par[ra] = rb;
          }

          public static int latestDayToCross(int row, int col, int[][] cells) {
              int total = row * col, top = total, bottom = total + 1;
              par = new int[total + 2];
              for (int i = 0; i < total + 2; i++) par[i] = i;
              boolean[] land = new boolean[total];
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              for (int k = total - 1; k >= 0; k--) {
                  int r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = true;
                  if (r == 0) union(x, top);
                  if (r == row - 1) union(x, bottom);
                  for (int d = 0; d < 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) union(x, a * col + b);
                  }
                  if (find(top) == find(bottom)) return k;
              }
              return 0;
          }
        `,
        cpp: code`
          vector<int> par;

          int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra != rb) par[ra] = rb;
          }

          int latestDayToCross(int row, int col, vector<vector<int>>& cells) {
              int total = row * col, top = total, bottom = total + 1;
              par.assign(total + 2, 0);
              for (int i = 0; i < total + 2; i++) par[i] = i;
              vector<char> land(total, 0);
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              for (int k = total - 1; k >= 0; k--) {
                  int r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = 1;
                  if (r == 0) unite(x, top);
                  if (r == row - 1) unite(x, bottom);
                  for (int d = 0; d < 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) unite(x, a * col + b);
                  }
                  if (findRoot(top) == findRoot(bottom)) return k;
              }
              return 0;
          }
        `,
        c: code`
          static int* par;

          static int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra != rb) par[ra] = rb;
          }

          int latestDayToCross(int row, int col, int** cells, int cellsSize, int* cellsColSize) {
              int total = row * col, top = total, bottom = total + 1;
              par = (int*)malloc((total + 2) * sizeof(int));
              for (int i = 0; i < total + 2; i++) par[i] = i;
              char* land = (char*)calloc(total, 1);
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              int ans = 0;
              for (int k = total - 1; k >= 0; k--) {
                  int r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = 1;
                  if (r == 0) unite(x, top);
                  if (r == row - 1) unite(x, bottom);
                  for (int d = 0; d < 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) unite(x, a * col + b);
                  }
                  if (findRoot(top) == findRoot(bottom)) { ans = k; break; }
              }
              free(par);
              free(land);
              return ans;
          }
        `,
        csharp: code`
          static int[] par;

          static int Find(int x)
          {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void Union(int a, int b)
          {
              int ra = Find(a), rb = Find(b);
              if (ra != rb) par[ra] = rb;
          }

          public static int LatestDayToCross(int row, int col, int[][] cells)
          {
              int total = row * col, top = total, bottom = total + 1;
              par = new int[total + 2];
              for (int i = 0; i < total + 2; i++) par[i] = i;
              var land = new bool[total];
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              for (int k = total - 1; k >= 0; k--)
              {
                  int r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c;
                  land[x] = true;
                  if (r == 0) Union(x, top);
                  if (r == row - 1) Union(x, bottom);
                  for (int d = 0; d < 4; d++)
                  {
                      int a = r + DR[d], b = c + DC[d];
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) Union(x, a * col + b);
                  }
                  if (Find(top) == Find(bottom)) return k;
              }
              return 0;
          }
        `,
        go: code`
          func latestDayToCross(row int, col int, cells [][]int) int {
          	total := row * col
          	top, bottom := total, total+1
          	parent := make([]int, total+2)
          	for i := range parent {
          		parent[i] = i
          	}
          	land := make([]bool, total)
          	find := func(x int) int {
          		for parent[x] != x {
          			parent[x] = parent[parent[x]]
          			x = parent[x]
          		}
          		return x
          	}
          	union := func(a, b int) {
          		ra, rb := find(a), find(b)
          		if ra != rb {
          			parent[ra] = rb
          		}
          	}
          	DR := []int{1, -1, 0, 0}
          	DC := []int{0, 0, 1, -1}
          	for k := total - 1; k >= 0; k-- {
          		r, c := cells[k][0]-1, cells[k][1]-1
          		x := r*col + c
          		land[x] = true
          		if r == 0 {
          			union(x, top)
          		}
          		if r == row-1 {
          			union(x, bottom)
          		}
          		for d := 0; d < 4; d++ {
          			a, b := r+DR[d], c+DC[d]
          			if a >= 0 && a < row && b >= 0 && b < col && land[a*col+b] {
          				union(x, a*col+b)
          			}
          		}
          		if find(top) == find(bottom) {
          			return k
          		}
          	}
          	return 0
          }
        `,
        kotlin: code`
          fun latestDayToCross(row: Int, col: Int, cells: Array<IntArray>): Int {
              val total = row * col
              val top = total
              val bottom = total + 1
              val parent = IntArray(total + 2) { it }
              val land = BooleanArray(total)
              fun find(start: Int): Int {
                  var x = start
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              fun union(a: Int, b: Int) {
                  val ra = find(a)
                  val rb = find(b)
                  if (ra != rb) parent[ra] = rb
              }
              val DR = intArrayOf(1, -1, 0, 0)
              val DC = intArrayOf(0, 0, 1, -1)
              for (k in total - 1 downTo 0) {
                  val r = cells[k][0] - 1
                  val c = cells[k][1] - 1
                  val x = r * col + c
                  land[x] = true
                  if (r == 0) union(x, top)
                  if (r == row - 1) union(x, bottom)
                  for (d in 0 until 4) {
                      val a = r + DR[d]
                      val b = c + DC[d]
                      if (a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]) union(x, a * col + b)
                  }
                  if (find(top) == find(bottom)) return k
              }
              return 0
          }
        `,
        swift: code`
          func latestDayToCross(_ row: Int, _ col: Int, _ cells: [[Int]]) -> Int {
              let total = row * col, top = total, bottom = total + 1
              var parent = Array(0..<(total + 2))
              var land = [Bool](repeating: false, count: total)
              func find(_ start: Int) -> Int {
                  var x = start
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              func union(_ a: Int, _ b: Int) {
                  let ra = find(a), rb = find(b)
                  if ra != rb { parent[ra] = rb }
              }
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              for k in stride(from: total - 1, through: 0, by: -1) {
                  let r = cells[k][0] - 1, c = cells[k][1] - 1, x = r * col + c
                  land[x] = true
                  if r == 0 { union(x, top) }
                  if r == row - 1 { union(x, bottom) }
                  for d in 0..<4 {
                      let a = r + DR[d], b = c + DC[d]
                      if a >= 0 && a < row && b >= 0 && b < col && land[a * col + b] { union(x, a * col + b) }
                  }
                  if find(top) == find(bottom) { return k }
              }
              return 0
          }
        `,
        rust: code`
          fn find(parent: &mut Vec<usize>, start: usize) -> usize {
              let mut x = start;
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn latestDayToCross(row: i32, col: i32, cells: Vec<Vec<i32>>) -> i32 {
              let total = (row * col) as usize;
              let (top, bottom) = (total, total + 1);
              let mut parent: Vec<usize> = (0..total + 2).collect();
              let mut land = vec![false; total];
              let dr = [1i32, -1, 0, 0];
              let dc = [0i32, 0, 1, -1];
              for k in (0..total).rev() {
                  let r = cells[k][0] - 1;
                  let c = cells[k][1] - 1;
                  let x = (r * col + c) as usize;
                  land[x] = true;
                  let mut links: Vec<usize> = Vec::new();
                  if r == 0 {
                      links.push(top);
                  }
                  if r == row - 1 {
                      links.push(bottom);
                  }
                  for d in 0..4 {
                      let a = r + dr[d];
                      let b = c + dc[d];
                      if a >= 0 && a < row && b >= 0 && b < col && land[(a * col + b) as usize] {
                          links.push((a * col + b) as usize);
                      }
                  }
                  for &y in links.iter() {
                      let ra = find(&mut parent, x);
                      let rb = find(&mut parent, y);
                      if ra != rb {
                          parent[ra] = rb;
                      }
                  }
                  if find(&mut parent, top) == find(&mut parent, bottom) {
                      return k as i32;
                  }
              }
              0
          }
        `,
        php: code`
          function latestDayToCross($row, $col, $cells) {
              $total = $row * $col;
              $top = $total;
              $bottom = $total + 1;
              $parent = range(0, $total + 1);
              $land = array_fill(0, $total, false);
              $find = function ($x) use (&$parent) {
                  while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
                  return $x;
              };
              $union = function ($a, $b) use (&$parent, $find) {
                  $ra = $find($a);
                  $rb = $find($b);
                  if ($ra != $rb) $parent[$ra] = $rb;
              };
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              for ($k = $total - 1; $k >= 0; $k--) {
                  $r = $cells[$k][0] - 1;
                  $c = $cells[$k][1] - 1;
                  $x = $r * $col + $c;
                  $land[$x] = true;
                  if ($r == 0) $union($x, $top);
                  if ($r == $row - 1) $union($x, $bottom);
                  for ($d = 0; $d < 4; $d++) {
                      $a = $r + $DR[$d];
                      $b = $c + $DC[$d];
                      if ($a >= 0 && $a < $row && $b >= 0 && $b < $col && $land[$a * $col + $b]) $union($x, $a * $col + $b);
                  }
                  if ($find($top) == $find($bottom)) return $k;
              }
              return 0;
          }
        `,
        ruby: code`
          def latestDayToCross(row, col, cells)
            total = row * col
            top = total
            bottom = total + 1
            parent = (0..total + 1).to_a
            land = Array.new(total, false)
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            union = lambda do |a, b|
              ra = find.call(a)
              rb = find.call(b)
              parent[ra] = rb if ra != rb
            end
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            (total - 1).downto(0) do |k|
              r = cells[k][0] - 1
              c = cells[k][1] - 1
              x = r * col + c
              land[x] = true
              union.call(x, top) if r == 0
              union.call(x, bottom) if r == row - 1
              dirs.each do |dr, dc|
                a = r + dr
                b = c + dc
                union.call(x, a * col + b) if a >= 0 && a < row && b >= 0 && b < col && land[a * col + b]
              end
              return k if find.call(top) == find.call(bottom)
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Rank Transform of a Matrix (LC 1632) ────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const rank = matrix.map((row) => row.map(() => 1));
      const fix = (r1: number, c1: number, r2: number, c2: number) => {
        const a = matrix[r1][c1], b = matrix[r2][c2];
        if (a < b && rank[r2][c2] < rank[r1][c1] + 1) { rank[r2][c2] = rank[r1][c1] + 1; return true; }
        if (a > b && rank[r1][c1] < rank[r2][c2] + 1) { rank[r1][c1] = rank[r2][c2] + 1; return true; }
        if (a === b && rank[r1][c1] !== rank[r2][c2]) { rank[r1][c1] = rank[r2][c2] = Math.max(rank[r1][c1], rank[r2][c2]); return true; }
        return false;
      };
      for (let changed = true; changed;) {
        changed = false;
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
          for (let c2 = c + 1; c2 < n; c2++) if (fix(r, c, r, c2)) changed = true;
          for (let r2 = r + 1; r2 < m; r2++) if (fix(r, c, r2, c)) changed = true;
        }
      }
      return rank;
    };
    return {
      slug: "rank-transform-of-a-matrix",
      title: "Rank Transform of a Matrix",
      difficulty: "HARD" as const,
      tags: ["Array", "Union Find", "Graph", "Topological Sort", "Sorting", "Matrix", "Google"],
      signature: { funcName: "matrixRankTransform", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an `m x n` integer `matrix`, return a new matrix `answer` where `answer[row][col]` is the **rank** of `matrix[row][col]`.\n\nRanks are positive integers chosen by these rules:\n\n- Within the same row or the same column, a smaller element gets a smaller rank, a larger element a larger rank, and equal elements the same rank: for two cells `p` and `q` that share a row or a column, `p < q` implies `rank(p) < rank(q)` and `p == q` implies `rank(p) == rank(q)`.\n- Every rank is as **small** as possible.\n\nThe rules determine the answer uniquely.",
        [
          { in: "matrix = [[1,2],[3,4]]", out: "[[1,2],[2,3]]", note: "1 is the smallest in its row and column (rank 1); 2 and 3 each sit beside the 1 (rank 2); 4 is larger than both 2 and 3 (rank 3)." },
          { in: "matrix = [[7,7],[7,7]]", out: "[[1,1],[1,1]]" },
          { in: "matrix = [[20,-21,14],[-19,4,19],[22,-47,24],[-19,4,19]]", out: "[[4,2,3],[1,3,4],[5,1,6],[1,3,4]]" },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 500", "-10^9 <= matrix[row][col] <= 10^9"]),
      hints: [
        "Process the values from smallest to largest. When a value is processed, its rank only depends on the largest rank already given in its row and in its column.",
        "Equal values in the same row or column must share a rank, and that sharing is transitive: they form groups. A union-find over rows and columns (row `r` and column `c` joined for every cell `(r, c)` of the current value) finds the groups.",
        "For each group, rank = 1 + max over its cells of `max(rowMax[r], colMax[c])`. Assign it to every cell of the group, then update `rowMax` and `colMax`.",
      ],
      editorial: explain({
        idea: "Sort cells by value and hand out ranks in increasing order, keeping the largest rank so far in every row and column. Cells of equal value that share a row or column — directly or through a chain — must receive one common rank, so they are grouped with a union-find on row and column ids.",
        steps: [
          "Sort all cells by value. Keep `rowMax[m]` and `colMax[n]`, initially 0.",
          "Take the next block of cells with equal value. For each cell `(r, c)` in it, union node `r` with node `m + c`.",
          "For each cell, fold `max(rowMax[r], colMax[c]) + 1` into the value stored at its group's root.",
          "Give every cell its root's value, set `rowMax[r]` and `colMax[c]` to it, then reset the union-find nodes the block touched.",
        ],
        why: "When a block is processed, every smaller value in a cell's row or column already has its final rank, and `rowMax`/`colMax` hold the largest of them, so a rank below `max + 1` would violate the ordering rule. Cells joined through shared rows or columns must be equal-ranked, so the group takes the maximum of its members' lower bounds — and that value satisfies every constraint, hence it is the smallest possible.",
        time: "O(m · n · log(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "Equal values in **different** rows and columns are independent: they may get different ranks.",
          "Grouping is transitive: (r1, c1) and (r2, c2) with r1 ≠ r2 and c1 ≠ c2 still share a rank if a third equal cell sits in row r1 and column c2.",
          "Reset only the union-find nodes the current block touched; resetting everything per block is quadratic.",
        ],
      }),
      examples: [
        { input: "[[1,2],[3,4]]", expectedOutput: "[[1,2],[2,3]]" },
        { input: "[[7,7],[7,7]]", expectedOutput: "[[1,1],[1,1]]" },
        { input: "[[20,-21,14],[-19,4,19],[22,-47,24],[-19,4,19]]", expectedOutput: "[[4,2,3],[1,3,4],[5,1,6],[1,3,4]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 3, 5])), n = ri(rng, 1, pick(rng, [2, 3, 5]));
        const span = pick(rng, [1, 3, 10, 1000000000]);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, -span, span)));
        return { input: fmtIntMat(matrix), expectedOutput: fmtIntMat(ref(matrix)) };
      },
      solutions: {
        python: code`
          from typing import List

          def matrixRankTransform(matrix: List[List[int]]) -> List[List[int]]:
              m, n = len(matrix), len(matrix[0])
              cells = sorted((matrix[r][c], r, c) for r in range(m) for c in range(n))
              parent = list(range(m + n))
              best = [0] * (m + n)
              row_max = [0] * m
              col_max = [0] * n
              ans = [[0] * n for _ in range(m)]

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              i, total = 0, m * n
              while i < total:
                  j = i
                  while j < total and cells[j][0] == cells[i][0]:
                      j += 1
                  for _, r, c in cells[i:j]:
                      a, b = find(r), find(m + c)
                      if a != b:
                          parent[a] = b
                  for _, r, c in cells[i:j]:
                      root = find(r)
                      best[root] = max(best[root], max(row_max[r], col_max[c]) + 1)
                  for _, r, c in cells[i:j]:
                      ans[r][c] = best[find(r)]
                  for _, r, c in cells[i:j]:
                      row_max[r] = ans[r][c]
                      col_max[c] = ans[r][c]
                      parent[r], parent[m + c] = r, m + c
                      best[r] = best[m + c] = 0
                  i = j
              return ans
        `,
        javascript: code`
          var matrixRankTransform = function(matrix) {
              var m = matrix.length, n = matrix[0].length, total = m * n, S = 262144;
              var keys = [];
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) keys.push((matrix[r][c] + 1000000000) * S + r * n + c);
              keys.sort(function(a, b) { return a - b; });
              var parent = [], best = [], rowMax = [], colMax = [], ans = [];
              for (var i = 0; i < m + n; i++) { parent.push(i); best.push(0); }
              for (var a = 0; a < m; a++) { rowMax.push(0); ans.push([]); for (var b = 0; b < n; b++) ans[a].push(0); }
              for (var b2 = 0; b2 < n; b2++) colMax.push(0);
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var lo = 0;
              while (lo < total) {
                  var v = Math.floor(keys[lo] / S), hi = lo, k, cell, x, y, root;
                  while (hi < total && Math.floor(keys[hi] / S) === v) hi++;
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      var p = find(x), q = find(m + y);
                      if (p !== q) parent[p] = q;
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      root = find(x);
                      best[root] = Math.max(best[root], Math.max(rowMax[x], colMax[y]) + 1);
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      ans[x][y] = best[find(x)];
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      parent[x] = x; parent[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              return ans;
          };
        `,
        typescript: code`
          function matrixRankTransform(matrix: number[][]): number[][] {
              var m = matrix.length, n = matrix[0].length, total = m * n, S = 262144;
              var keys: number[] = [];
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) keys.push((matrix[r][c] + 1000000000) * S + r * n + c);
              keys.sort(function(a, b) { return a - b; });
              var parent: number[] = [], best: number[] = [], rowMax: number[] = [], colMax: number[] = [], ans: number[][] = [];
              for (var i = 0; i < m + n; i++) { parent.push(i); best.push(0); }
              for (var a = 0; a < m; a++) { rowMax.push(0); ans.push([]); for (var b = 0; b < n; b++) ans[a].push(0); }
              for (var b2 = 0; b2 < n; b2++) colMax.push(0);
              var find = function(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var lo = 0;
              while (lo < total) {
                  var v = Math.floor(keys[lo] / S), hi = lo, k: number, cell: number, x: number, y: number, root: number;
                  while (hi < total && Math.floor(keys[hi] / S) === v) hi++;
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      var p = find(x), q = find(m + y);
                      if (p !== q) parent[p] = q;
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      root = find(x);
                      best[root] = Math.max(best[root], Math.max(rowMax[x], colMax[y]) + 1);
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      ans[x][y] = best[find(x)];
                  }
                  for (k = lo; k < hi; k++) {
                      cell = keys[k] % S; x = Math.floor(cell / n); y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      parent[x] = x; parent[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              return ans;
          }
        `,
        java: code`
          static int[] par;

          static int find(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          public static int[][] matrixRankTransform(int[][] matrix) {
              int m = matrix.length, n = matrix[0].length, total = m * n;
              final long S = 262144L;
              long[] keys = new long[total];
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) keys[r * n + c] = ((long) matrix[r][c] + 1000000000L) * S + r * n + c;
              Arrays.sort(keys);
              par = new int[m + n];
              int[] best = new int[m + n], rowMax = new int[m], colMax = new int[n];
              for (int i = 0; i < m + n; i++) par[i] = i;
              int[][] ans = new int[m][n];
              int lo = 0;
              while (lo < total) {
                  long v = keys[lo] / S;
                  int hi = lo;
                  while (hi < total && keys[hi] / S == v) hi++;
                  for (int k = lo; k < hi; k++) {
                      int cell = (int) (keys[k] % S), x = cell / n, y = cell % n;
                      int p = find(x), q = find(m + y);
                      if (p != q) par[p] = q;
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int) (keys[k] % S), x = cell / n, y = cell % n;
                      int root = find(x);
                      best[root] = Math.max(best[root], Math.max(rowMax[x], colMax[y]) + 1);
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int) (keys[k] % S), x = cell / n, y = cell % n;
                      ans[x][y] = best[find(x)];
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int) (keys[k] % S), x = cell / n, y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      par[x] = x; par[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> par;

          int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          vector<vector<int>> matrixRankTransform(vector<vector<int>>& matrix) {
              int m = matrix.size(), n = matrix[0].size(), total = m * n;
              const long long S = 262144LL;
              vector<long long> keys;
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) keys.push_back(((long long) matrix[r][c] + 1000000000LL) * S + r * n + c);
              sort(keys.begin(), keys.end());
              par.assign(m + n, 0);
              for (int i = 0; i < m + n; i++) par[i] = i;
              vector<int> best(m + n, 0), rowMax(m, 0), colMax(n, 0);
              vector<vector<int>> ans(m, vector<int>(n, 0));
              int lo = 0;
              while (lo < total) {
                  long long v = keys[lo] / S;
                  int hi = lo;
                  while (hi < total && keys[hi] / S == v) hi++;
                  for (int k = lo; k < hi; k++) {
                      int cell = keys[k] % S, x = cell / n, y = cell % n;
                      int p = findRoot(x), q = findRoot(m + y);
                      if (p != q) par[p] = q;
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = keys[k] % S, x = cell / n, y = cell % n;
                      int root = findRoot(x);
                      best[root] = max(best[root], max(rowMax[x], colMax[y]) + 1);
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = keys[k] % S, x = cell / n, y = cell % n;
                      ans[x][y] = best[findRoot(x)];
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = keys[k] % S, x = cell / n, y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      par[x] = x; par[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              return ans;
          }
        `,
        c: code`
          static int* par;

          static int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static int cmpKey(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return x < y ? -1 : (x > y ? 1 : 0);
          }

          int** matrixRankTransform(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {
              int m = matrixSize, n = matrixColSize[0], total = m * n;
              const long long S = 262144LL;
              long long* keys = (long long*)malloc(total * sizeof(long long));
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) keys[r * n + c] = ((long long) matrix[r][c] + 1000000000LL) * S + r * n + c;
              qsort(keys, total, sizeof(long long), cmpKey);
              par = (int*)malloc((m + n) * sizeof(int));
              int* best = (int*)calloc(m + n, sizeof(int));
              int* rowMax = (int*)calloc(m, sizeof(int));
              int* colMax = (int*)calloc(n, sizeof(int));
              for (int i = 0; i < m + n; i++) par[i] = i;
              int** ans = (int**)malloc(m * sizeof(int*));
              *returnColumnSizes = (int*)malloc(m * sizeof(int));
              for (int r = 0; r < m; r++) { ans[r] = (int*)calloc(n, sizeof(int)); (*returnColumnSizes)[r] = n; }
              int lo = 0;
              while (lo < total) {
                  long long v = keys[lo] / S;
                  int hi = lo;
                  while (hi < total && keys[hi] / S == v) hi++;
                  for (int k = lo; k < hi; k++) {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      int p = findRoot(x), q = findRoot(m + y);
                      if (p != q) par[p] = q;
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      int root = findRoot(x);
                      int need = (rowMax[x] > colMax[y] ? rowMax[x] : colMax[y]) + 1;
                      if (need > best[root]) best[root] = need;
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      ans[x][y] = best[findRoot(x)];
                  }
                  for (int k = lo; k < hi; k++) {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      par[x] = x; par[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              free(keys); free(par); free(best); free(rowMax); free(colMax);
              *returnSize = m;
              return ans;
          }
        `,
        csharp: code`
          static int[] par;

          static int Find(int x)
          {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          public static int[][] MatrixRankTransform(int[][] matrix)
          {
              int m = matrix.Length, n = matrix[0].Length, total = m * n;
              const long S = 262144L;
              var keys = new long[total];
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) keys[r * n + c] = ((long) matrix[r][c] + 1000000000L) * S + r * n + c;
              Array.Sort(keys);
              par = new int[m + n];
              for (int i = 0; i < m + n; i++) par[i] = i;
              var best = new int[m + n];
              var rowMax = new int[m];
              var colMax = new int[n];
              var ans = new int[m][];
              for (int r = 0; r < m; r++) ans[r] = new int[n];
              int lo = 0;
              while (lo < total)
              {
                  long v = keys[lo] / S;
                  int hi = lo;
                  while (hi < total && keys[hi] / S == v) hi++;
                  for (int k = lo; k < hi; k++)
                  {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      int p = Find(x), q = Find(m + y);
                      if (p != q) par[p] = q;
                  }
                  for (int k = lo; k < hi; k++)
                  {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      int root = Find(x);
                      best[root] = Math.Max(best[root], Math.Max(rowMax[x], colMax[y]) + 1);
                  }
                  for (int k = lo; k < hi; k++)
                  {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      ans[x][y] = best[Find(x)];
                  }
                  for (int k = lo; k < hi; k++)
                  {
                      int cell = (int)(keys[k] % S), x = cell / n, y = cell % n;
                      rowMax[x] = ans[x][y];
                      colMax[y] = ans[x][y];
                      par[x] = x; par[m + y] = m + y;
                      best[x] = 0; best[m + y] = 0;
                  }
                  lo = hi;
              }
              return ans;
          }
        `,
        go: code`
          func matrixRankTransform(matrix [][]int) [][]int {
          	m, n := len(matrix), len(matrix[0])
          	total := m * n
          	const S = 262144
          	keys := make([]int, 0, total)
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			keys = append(keys, (matrix[r][c]+1000000000)*S+r*n+c)
          		}
          	}
          	sort.Ints(keys)
          	parent := make([]int, m+n)
          	for i := range parent {
          		parent[i] = i
          	}
          	find := func(x int) int {
          		for parent[x] != x {
          			parent[x] = parent[parent[x]]
          			x = parent[x]
          		}
          		return x
          	}
          	best := make([]int, m+n)
          	rowMax := make([]int, m)
          	colMax := make([]int, n)
          	ans := make([][]int, m)
          	for r := range ans {
          		ans[r] = make([]int, n)
          	}
          	for lo := 0; lo < total; {
          		v := keys[lo] / S
          		hi := lo
          		for hi < total && keys[hi]/S == v {
          			hi++
          		}
          		for k := lo; k < hi; k++ {
          			cell := keys[k] % S
          			p, q := find(cell/n), find(m+cell%n)
          			if p != q {
          				parent[p] = q
          			}
          		}
          		for k := lo; k < hi; k++ {
          			cell := keys[k] % S
          			x, y := cell/n, cell%n
          			root := find(x)
          			need := rowMax[x]
          			if colMax[y] > need {
          				need = colMax[y]
          			}
          			if need+1 > best[root] {
          				best[root] = need + 1
          			}
          		}
          		for k := lo; k < hi; k++ {
          			cell := keys[k] % S
          			x, y := cell/n, cell%n
          			ans[x][y] = best[find(x)]
          		}
          		for k := lo; k < hi; k++ {
          			cell := keys[k] % S
          			x, y := cell/n, cell%n
          			rowMax[x] = ans[x][y]
          			colMax[y] = ans[x][y]
          			parent[x] = x
          			parent[m+y] = m + y
          			best[x] = 0
          			best[m+y] = 0
          		}
          		lo = hi
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun matrixRankTransform(matrix: Array<IntArray>): Array<IntArray> {
              val m = matrix.size
              val n = matrix[0].size
              val total = m * n
              val S = 262144L
              val keys = LongArray(total)
              for (r in 0 until m) for (c in 0 until n) keys[r * n + c] = (matrix[r][c].toLong() + 1000000000L) * S + r * n + c
              keys.sort()
              val parent = IntArray(m + n) { it }
              fun find(start: Int): Int {
                  var x = start
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              val best = IntArray(m + n)
              val rowMax = IntArray(m)
              val colMax = IntArray(n)
              val ans = Array(m) { IntArray(n) }
              var lo = 0
              while (lo < total) {
                  val v = keys[lo] / S
                  var hi = lo
                  while (hi < total && keys[hi] / S == v) hi++
                  for (k in lo until hi) {
                      val cell = (keys[k] % S).toInt()
                      val p = find(cell / n)
                      val q = find(m + cell % n)
                      if (p != q) parent[p] = q
                  }
                  for (k in lo until hi) {
                      val cell = (keys[k] % S).toInt()
                      val x = cell / n
                      val y = cell % n
                      val root = find(x)
                      best[root] = maxOf(best[root], maxOf(rowMax[x], colMax[y]) + 1)
                  }
                  for (k in lo until hi) {
                      val cell = (keys[k] % S).toInt()
                      ans[cell / n][cell % n] = best[find(cell / n)]
                  }
                  for (k in lo until hi) {
                      val cell = (keys[k] % S).toInt()
                      val x = cell / n
                      val y = cell % n
                      rowMax[x] = ans[x][y]
                      colMax[y] = ans[x][y]
                      parent[x] = x
                      parent[m + y] = m + y
                      best[x] = 0
                      best[m + y] = 0
                  }
                  lo = hi
              }
              return ans
          }
        `,
        swift: code`
          func matrixRankTransform(_ matrix: [[Int]]) -> [[Int]] {
              let m = matrix.count, n = matrix[0].count, total = m * n
              let S = 262144
              var keys = [Int]()
              for r in 0..<m { for c in 0..<n { keys.append((matrix[r][c] + 1_000_000_000) * S + r * n + c) } }
              keys.sort()
              var parent = Array(0..<(m + n))
              func find(_ start: Int) -> Int {
                  var x = start
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              var best = [Int](repeating: 0, count: m + n)
              var rowMax = [Int](repeating: 0, count: m)
              var colMax = [Int](repeating: 0, count: n)
              var ans = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
              var lo = 0
              while lo < total {
                  let v = keys[lo] / S
                  var hi = lo
                  while hi < total && keys[hi] / S == v { hi += 1 }
                  for k in lo..<hi {
                      let cell = keys[k] % S
                      let p = find(cell / n), q = find(m + cell % n)
                      if p != q { parent[p] = q }
                  }
                  for k in lo..<hi {
                      let cell = keys[k] % S
                      let x = cell / n, y = cell % n
                      let root = find(x)
                      best[root] = max(best[root], max(rowMax[x], colMax[y]) + 1)
                  }
                  for k in lo..<hi {
                      let cell = keys[k] % S
                      ans[cell / n][cell % n] = best[find(cell / n)]
                  }
                  for k in lo..<hi {
                      let cell = keys[k] % S
                      let x = cell / n, y = cell % n
                      rowMax[x] = ans[x][y]
                      colMax[y] = ans[x][y]
                      parent[x] = x
                      parent[m + y] = m + y
                      best[x] = 0
                      best[m + y] = 0
                  }
                  lo = hi
              }
              return ans
          }
        `,
        rust: code`
          fn find(parent: &mut Vec<usize>, start: usize) -> usize {
              let mut x = start;
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn matrixRankTransform(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let m = matrix.len();
              let n = matrix[0].len();
              let total = m * n;
              const S: i64 = 262144;
              let mut keys: Vec<i64> = Vec::with_capacity(total);
              for r in 0..m {
                  for c in 0..n {
                      keys.push((matrix[r][c] as i64 + 1_000_000_000) * S + (r * n + c) as i64);
                  }
              }
              keys.sort();
              let mut parent: Vec<usize> = (0..m + n).collect();
              let mut best = vec![0i32; m + n];
              let mut row_max = vec![0i32; m];
              let mut col_max = vec![0i32; n];
              let mut ans = vec![vec![0i32; n]; m];
              let mut lo = 0;
              while lo < total {
                  let v = keys[lo] / S;
                  let mut hi = lo;
                  while hi < total && keys[hi] / S == v {
                      hi += 1;
                  }
                  for k in lo..hi {
                      let cell = (keys[k] % S) as usize;
                      let p = find(&mut parent, cell / n);
                      let q = find(&mut parent, m + cell % n);
                      if p != q {
                          parent[p] = q;
                      }
                  }
                  for k in lo..hi {
                      let cell = (keys[k] % S) as usize;
                      let (x, y) = (cell / n, cell % n);
                      let root = find(&mut parent, x);
                      let need = std::cmp::max(row_max[x], col_max[y]) + 1;
                      if need > best[root] {
                          best[root] = need;
                      }
                  }
                  for k in lo..hi {
                      let cell = (keys[k] % S) as usize;
                      let (x, y) = (cell / n, cell % n);
                      let root = find(&mut parent, x);
                      ans[x][y] = best[root];
                  }
                  for k in lo..hi {
                      let cell = (keys[k] % S) as usize;
                      let (x, y) = (cell / n, cell % n);
                      row_max[x] = ans[x][y];
                      col_max[y] = ans[x][y];
                      parent[x] = x;
                      parent[m + y] = m + y;
                      best[x] = 0;
                      best[m + y] = 0;
                  }
                  lo = hi;
              }
              ans
          }
        `,
        php: code`
          function matrixRankTransform($matrix) {
              $m = count($matrix);
              $n = count($matrix[0]);
              $total = $m * $n;
              $S = 262144;
              $keys = [];
              for ($r = 0; $r < $m; $r++) for ($c = 0; $c < $n; $c++) $keys[] = ($matrix[$r][$c] + 1000000000) * $S + $r * $n + $c;
              sort($keys);
              $parent = range(0, $m + $n - 1);
              $find = function ($x) use (&$parent) {
                  while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
                  return $x;
              };
              $best = array_fill(0, $m + $n, 0);
              $rowMax = array_fill(0, $m, 0);
              $colMax = array_fill(0, $n, 0);
              $ans = array_fill(0, $m, array_fill(0, $n, 0));
              $lo = 0;
              while ($lo < $total) {
                  $v = intdiv($keys[$lo], $S);
                  $hi = $lo;
                  while ($hi < $total && intdiv($keys[$hi], $S) == $v) $hi++;
                  for ($k = $lo; $k < $hi; $k++) {
                      $cell = $keys[$k] % $S;
                      $p = $find(intdiv($cell, $n));
                      $q = $find($m + $cell % $n);
                      if ($p != $q) $parent[$p] = $q;
                  }
                  for ($k = $lo; $k < $hi; $k++) {
                      $cell = $keys[$k] % $S;
                      $x = intdiv($cell, $n);
                      $y = $cell % $n;
                      $root = $find($x);
                      $best[$root] = max($best[$root], max($rowMax[$x], $colMax[$y]) + 1);
                  }
                  for ($k = $lo; $k < $hi; $k++) {
                      $cell = $keys[$k] % $S;
                      $x = intdiv($cell, $n);
                      $ans[$x][$cell % $n] = $best[$find($x)];
                  }
                  for ($k = $lo; $k < $hi; $k++) {
                      $cell = $keys[$k] % $S;
                      $x = intdiv($cell, $n);
                      $y = $cell % $n;
                      $rowMax[$x] = $ans[$x][$y];
                      $colMax[$y] = $ans[$x][$y];
                      $parent[$x] = $x;
                      $parent[$m + $y] = $m + $y;
                      $best[$x] = 0;
                      $best[$m + $y] = 0;
                  }
                  $lo = $hi;
              }
              return $ans;
          }
        `,
        ruby: code`
          def matrixRankTransform(matrix)
            m = matrix.length
            n = matrix[0].length
            total = m * n
            s = 262_144
            keys = []
            m.times { |r| n.times { |c| keys << (matrix[r][c] + 1_000_000_000) * s + r * n + c } }
            keys.sort!
            parent = (0...m + n).to_a
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            best = Array.new(m + n, 0)
            row_max = Array.new(m, 0)
            col_max = Array.new(n, 0)
            ans = Array.new(m) { Array.new(n, 0) }
            lo = 0
            while lo < total
              v = keys[lo] / s
              hi = lo
              hi += 1 while hi < total && keys[hi] / s == v
              group = keys[lo...hi].map { |key| [(key % s) / n, (key % s) % n] }
              group.each do |x, y|
                p1 = find.call(x)
                q1 = find.call(m + y)
                parent[p1] = q1 if p1 != q1
              end
              group.each do |x, y|
                root = find.call(x)
                need = [row_max[x], col_max[y]].max + 1
                best[root] = need if need > best[root]
              end
              group.each { |x, y| ans[x][y] = best[find.call(x)] }
              group.each do |x, y|
                row_max[x] = ans[x][y]
                col_max[y] = ans[x][y]
                parent[x] = x
                parent[m + y] = m + y
                best[x] = 0
                best[m + y] = 0
              end
              lo = hi
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── GCD Sort of an Array (LC 1998) ──────────────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (nums: number[]) => {
      const n = nums.length;
      const comp = new Array(n).fill(-1);
      let id = 0;
      for (let s = 0; s < n; s++) {
        if (comp[s] >= 0) continue;
        comp[s] = id;
        const stack = [s];
        while (stack.length) {
          const i = stack.pop()!;
          for (let j = 0; j < n; j++) if (comp[j] < 0 && gcd(nums[i], nums[j]) > 1) { comp[j] = id; stack.push(j); }
        }
        id++;
      }
      // Within each component the values can be permuted freely: sort each component in place.
      const out = nums.slice();
      for (let c = 0; c < id; c++) {
        const idx = [];
        for (let i = 0; i < n; i++) if (comp[i] === c) idx.push(i);
        const vals = idx.map((i) => nums[i]).sort((a, b) => a - b);
        idx.forEach((i, k) => { out[i] = vals[k]; });
      }
      for (let i = 1; i < n; i++) if (out[i - 1] > out[i]) return false;
      return true;
    };
    return {
      slug: "gcd-sort-of-an-array",
      title: "GCD Sort of an Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Union Find", "Sorting", "Number Theory", "Google"],
      signature: { funcName: "gcdSort", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `nums`. You may swap two elements `nums[i]` and `nums[j]` whenever `gcd(nums[i], nums[j]) > 1`, as many times as you like.\n\nReturn `true` if these swaps can sort `nums` into non-decreasing order, and `false` otherwise.",
        [
          { in: "nums = [7,21,3]", out: "true", note: "Swap 7 and 21 (gcd 7) to get [21,7,3], then 21 and 3 (gcd 3) to get [3,7,21]." },
          { in: "nums = [5,2,6,2]", out: "false", note: "5 shares no factor with anything, so it can never leave the front, but it belongs in the last place." },
          { in: "nums = [10,5,9,3,15]", out: "true" },
        ],
        ["1 <= nums.length <= 3 * 10^4", "2 <= nums[i] <= 10^5"]),
      hints: [
        "Swaps compose: if a can swap with b and b with c, then a, b and c can be rearranged in any order. So what matters is which elements are connected through chains of shared factors.",
        "Connecting every pair is O(n²). Instead connect each number to its prime factors with a union-find: two numbers sharing a prime end up in one set.",
        "Compare `nums` with its sorted copy: the array can be sorted iff for every index `i`, `nums[i]` and `sorted[i]` are in the same set.",
      ],
      editorial: explain({
        idea: "Elements that can reach each other through gcd > 1 swaps form groups that can be permuted arbitrarily. Grouping goes through prime factors — a number joins the set of each of its primes — so union-find over values and primes builds the groups in near-linear time.",
        steps: [
          "Create a union-find over `0 … max(nums)`.",
          "Factor each number by trial division and union it with each of its prime factors.",
          "Sort a copy of `nums`.",
          "For every index `i`, check that `nums[i]` and `sorted[i]` have the same root; if any pair differs, return `false`.",
        ],
        why: "Within a connected group, adjacent-swap reasoning shows any permutation is reachable (swaps along a spanning tree generate every transposition). Sorting succeeds iff every position can receive the value the sorted array puts there, which happens exactly when that value comes from the same group as the value currently there — groups keep their multiset of positions, so the per-index check is necessary and sufficient.",
        time: "O(n · sqrt(V) + V)",
        space: "O(V)",
        pitfalls: [
          "Union numbers with primes, not with each other pairwise — O(n²) gcds time out at 3 · 10^4.",
          "After trial division up to `sqrt(x)`, a leftover `x > 1` is itself a prime factor.",
          "Equal values are interchangeable even when they cannot move: an index check against the sorted copy handles duplicates correctly.",
        ],
      }),
      examples: [
        { input: "[7,21,3]", expectedOutput: "true" },
        { input: "[5,2,6,2]", expectedOutput: "false" },
        { input: "[10,5,9,3,15]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 4, 8, 15]));
        const top = rng() < 0.005 ? 100000 : pick(rng, [6, 12, 30, 100, 1000]);
        let nums = Array.from({ length: n }, () => ri(rng, 2, top));
        if (rng() < 0.15) nums.sort((a, b) => a - b);
        if (rng() < 0.2) nums = nums.map((x) => { const f = pick(rng, [2, 3, 6]); return x * f <= 100000 ? x * f : x; });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def gcdSort(nums: List[int]) -> bool:
              parent = list(range(max(nums) + 1))

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              def union(a, b):
                  ra, rb = find(a), find(b)
                  if ra != rb:
                      parent[ra] = rb

              for v in nums:
                  x, p = v, 2
                  while p * p <= x:
                      if x % p == 0:
                          union(v, p)
                          while x % p == 0:
                              x //= p
                      p += 1
                  if x > 1:
                      union(v, x)
              s = sorted(nums)
              return all(find(a) == find(b) for a, b in zip(nums, s))
        `,
        javascript: code`
          var gcdSort = function(nums) {
              var mx = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
              var parent = [];
              for (var j = 0; j <= mx; j++) parent.push(j);
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a, b) {
                  var ra = find(a), rb = find(b);
                  if (ra !== rb) parent[ra] = rb;
              };
              for (var k = 0; k < nums.length; k++) {
                  var v = nums[k], x = v;
                  for (var p = 2; p * p <= x; p++) {
                      if (x % p === 0) {
                          union(v, p);
                          while (x % p === 0) x = x / p;
                      }
                  }
                  if (x > 1) union(v, x);
              }
              var s = nums.slice().sort(function(a, b) { return a - b; });
              for (var t = 0; t < nums.length; t++) if (find(nums[t]) !== find(s[t])) return false;
              return true;
          };
        `,
        typescript: code`
          function gcdSort(nums: number[]): boolean {
              var mx = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
              var parent: number[] = [];
              for (var j = 0; j <= mx; j++) parent.push(j);
              var find = function(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              var union = function(a: number, b: number): void {
                  var ra = find(a), rb = find(b);
                  if (ra !== rb) parent[ra] = rb;
              };
              for (var k = 0; k < nums.length; k++) {
                  var v = nums[k], x = v;
                  for (var p = 2; p * p <= x; p++) {
                      if (x % p === 0) {
                          union(v, p);
                          while (x % p === 0) x = x / p;
                      }
                  }
                  if (x > 1) union(v, x);
              }
              var s = nums.slice().sort(function(a, b) { return a - b; });
              for (var t = 0; t < nums.length; t++) if (find(nums[t]) !== find(s[t])) return false;
              return true;
          }
        `,
        java: code`
          static int[] par;

          static int find(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void union(int a, int b) {
              int ra = find(a), rb = find(b);
              if (ra != rb) par[ra] = rb;
          }

          public static boolean gcdSort(int[] nums) {
              int mx = 0;
              for (int v : nums) mx = Math.max(mx, v);
              par = new int[mx + 1];
              for (int i = 0; i <= mx; i++) par[i] = i;
              for (int v : nums) {
                  int x = v;
                  for (int p = 2; p * p <= x; p++) {
                      if (x % p == 0) {
                          union(v, p);
                          while (x % p == 0) x /= p;
                      }
                  }
                  if (x > 1) union(v, x);
              }
              int[] s = nums.clone();
              Arrays.sort(s);
              for (int i = 0; i < nums.length; i++) if (find(nums[i]) != find(s[i])) return false;
              return true;
          }
        `,
        cpp: code`
          vector<int> par;

          int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra != rb) par[ra] = rb;
          }

          bool gcdSort(vector<int>& nums) {
              int mx = *max_element(nums.begin(), nums.end());
              par.assign(mx + 1, 0);
              for (int i = 0; i <= mx; i++) par[i] = i;
              for (int v : nums) {
                  int x = v;
                  for (int p = 2; p * p <= x; p++) {
                      if (x % p == 0) {
                          unite(v, p);
                          while (x % p == 0) x /= p;
                      }
                  }
                  if (x > 1) unite(v, x);
              }
              vector<int> s = nums;
              sort(s.begin(), s.end());
              for (size_t i = 0; i < nums.size(); i++) if (findRoot(nums[i]) != findRoot(s[i])) return false;
              return true;
          }
        `,
        c: code`
          static int* par;

          static int findRoot(int x) {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void unite(int a, int b) {
              int ra = findRoot(a), rb = findRoot(b);
              if (ra != rb) par[ra] = rb;
          }

          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return x < y ? -1 : (x > y ? 1 : 0);
          }

          bool gcdSort(int* nums, int numsSize) {
              int mx = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > mx) mx = nums[i];
              par = (int*)malloc((mx + 1) * sizeof(int));
              for (int i = 0; i <= mx; i++) par[i] = i;
              for (int i = 0; i < numsSize; i++) {
                  int v = nums[i], x = v;
                  for (int p = 2; p * p <= x; p++) {
                      if (x % p == 0) {
                          unite(v, p);
                          while (x % p == 0) x /= p;
                      }
                  }
                  if (x > 1) unite(v, x);
              }
              int* s = (int*)malloc(numsSize * sizeof(int));
              for (int i = 0; i < numsSize; i++) s[i] = nums[i];
              qsort(s, numsSize, sizeof(int), cmpInt);
              bool ok = true;
              for (int i = 0; i < numsSize; i++) if (findRoot(nums[i]) != findRoot(s[i])) { ok = false; break; }
              free(par);
              free(s);
              return ok;
          }
        `,
        csharp: code`
          static int[] par;

          static int Find(int x)
          {
              while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; }
              return x;
          }

          static void Union(int a, int b)
          {
              int ra = Find(a), rb = Find(b);
              if (ra != rb) par[ra] = rb;
          }

          public static bool GcdSort(int[] nums)
          {
              int mx = nums.Max();
              par = new int[mx + 1];
              for (int i = 0; i <= mx; i++) par[i] = i;
              foreach (int v in nums)
              {
                  int x = v;
                  for (int p = 2; p * p <= x; p++)
                  {
                      if (x % p == 0)
                      {
                          Union(v, p);
                          while (x % p == 0) x /= p;
                      }
                  }
                  if (x > 1) Union(v, x);
              }
              var s = (int[])nums.Clone();
              Array.Sort(s);
              for (int i = 0; i < nums.Length; i++) if (Find(nums[i]) != Find(s[i])) return false;
              return true;
          }
        `,
        go: code`
          func gcdSort(nums []int) bool {
          	mx := 0
          	for _, v := range nums {
          		if v > mx {
          			mx = v
          		}
          	}
          	parent := make([]int, mx+1)
          	for i := range parent {
          		parent[i] = i
          	}
          	find := func(x int) int {
          		for parent[x] != x {
          			parent[x] = parent[parent[x]]
          			x = parent[x]
          		}
          		return x
          	}
          	union := func(a, b int) {
          		ra, rb := find(a), find(b)
          		if ra != rb {
          			parent[ra] = rb
          		}
          	}
          	for _, v := range nums {
          		x := v
          		for p := 2; p*p <= x; p++ {
          			if x%p == 0 {
          				union(v, p)
          				for x%p == 0 {
          					x /= p
          				}
          			}
          		}
          		if x > 1 {
          			union(v, x)
          		}
          	}
          	s := append([]int{}, nums...)
          	sort.Ints(s)
          	for i := range nums {
          		if find(nums[i]) != find(s[i]) {
          			return false
          		}
          	}
          	return true
          }
        `,
        kotlin: code`
          fun gcdSort(nums: IntArray): Boolean {
              var mx = 0
              for (v in nums) if (v > mx) mx = v
              val parent = IntArray(mx + 1) { it }
              fun find(start: Int): Int {
                  var x = start
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              fun union(a: Int, b: Int) {
                  val ra = find(a)
                  val rb = find(b)
                  if (ra != rb) parent[ra] = rb
              }
              for (v in nums) {
                  var x = v
                  var p = 2
                  while (p * p <= x) {
                      if (x % p == 0) {
                          union(v, p)
                          while (x % p == 0) x /= p
                      }
                      p++
                  }
                  if (x > 1) union(v, x)
              }
              val s = nums.copyOf()
              s.sort()
              for (i in nums.indices) if (find(nums[i]) != find(s[i])) return false
              return true
          }
        `,
        swift: code`
          func gcdSort(_ nums: [Int]) -> Bool {
              let mx = nums.max() ?? 0
              var parent = Array(0...mx)
              func find(_ start: Int) -> Int {
                  var x = start
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              func union(_ a: Int, _ b: Int) {
                  let ra = find(a), rb = find(b)
                  if ra != rb { parent[ra] = rb }
              }
              for v in nums {
                  var x = v
                  var p = 2
                  while p * p <= x {
                      if x % p == 0 {
                          union(v, p)
                          while x % p == 0 { x /= p }
                      }
                      p += 1
                  }
                  if x > 1 { union(v, x) }
              }
              let s = nums.sorted()
              for i in 0..<nums.count where find(nums[i]) != find(s[i]) { return false }
              return true
          }
        `,
        rust: code`
          fn find(parent: &mut Vec<usize>, start: usize) -> usize {
              let mut x = start;
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn gcdSort(nums: Vec<i32>) -> bool {
              let mx = *nums.iter().max().unwrap() as usize;
              let mut parent: Vec<usize> = (0..=mx).collect();
              for &v in nums.iter() {
                  let v = v as usize;
                  let mut x = v;
                  let mut p = 2usize;
                  while p * p <= x {
                      if x % p == 0 {
                          let (ra, rb) = (find(&mut parent, v), find(&mut parent, p));
                          if ra != rb {
                              parent[ra] = rb;
                          }
                          while x % p == 0 {
                              x /= p;
                          }
                      }
                      p += 1;
                  }
                  if x > 1 {
                      let (ra, rb) = (find(&mut parent, v), find(&mut parent, x));
                      if ra != rb {
                          parent[ra] = rb;
                      }
                  }
              }
              let mut s = nums.clone();
              s.sort();
              for i in 0..nums.len() {
                  if find(&mut parent, nums[i] as usize) != find(&mut parent, s[i] as usize) {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function gcdSort($nums) {
              $mx = max($nums);
              $parent = range(0, $mx);
              $find = function ($x) use (&$parent) {
                  while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
                  return $x;
              };
              $union = function ($a, $b) use (&$parent, $find) {
                  $ra = $find($a);
                  $rb = $find($b);
                  if ($ra != $rb) $parent[$ra] = $rb;
              };
              foreach ($nums as $v) {
                  $x = $v;
                  for ($p = 2; $p * $p <= $x; $p++) {
                      if ($x % $p == 0) {
                          $union($v, $p);
                          while ($x % $p == 0) $x = intdiv($x, $p);
                      }
                  }
                  if ($x > 1) $union($v, $x);
              }
              $s = $nums;
              sort($s);
              for ($i = 0; $i < count($nums); $i++) if ($find($nums[$i]) != $find($s[$i])) return false;
              return true;
          }
        `,
        ruby: code`
          def gcdSort(nums)
            parent = (0..nums.max).to_a
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            union = lambda do |a, b|
              ra = find.call(a)
              rb = find.call(b)
              parent[ra] = rb if ra != rb
            end
            nums.each do |v|
              x = v
              p = 2
              while p * p <= x
                if x % p == 0
                  union.call(v, p)
                  x /= p while x % p == 0
                end
                p += 1
              end
              union.call(v, x) if x > 1
            end
            s = nums.sort
            nums.each_index.all? { |i| find.call(nums[i]) == find.call(s[i]) }
          end
        `,
      },
    };
  })(),

];
