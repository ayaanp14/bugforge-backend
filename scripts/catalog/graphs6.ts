/**
 * Graph problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Graphs arrive as edge lists or adjacency matrices (int[][]). Every generator
 * builds the graph the statement promises — trees are trees, DAGs are acyclic,
 * "connected" means connected — and keeps sizes small: the judge runs all
 * 5,000 cases of a problem in one process, and Python/Ruby/PHP pay ~30× V8.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** A random tree on nodes `base .. base+n-1` as an edge list (parent first). */
const randomTreeEdges = (rng: Rng, n: number, base: number): number[][] => {
  const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + base));
  const edges: number[][] = [];
  for (let i = 1; i < n; i++) edges.push([order[ri(rng, 0, i - 1)], order[i]]);
  return edges;
};

/** Every unordered pair [u, v] (u < v) of nodes `base .. base+n-1`, shuffled. */
const allPairs = (rng: Rng, n: number, base: number): number[][] => {
  const out: number[][] = [];
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) out.push([u + base, v + base]);
  return shuffle(rng, out);
};

/** A connected simple undirected graph: a random tree plus up to `extra` new edges. */
const connectedEdges = (rng: Rng, n: number, extra: number, base: number): number[][] => {
  const edges = randomTreeEdges(rng, n, base);
  const has = new Set(edges.map((e) => Math.min(e[0], e[1]) + "," + Math.max(e[0], e[1])));
  let added = 0;
  for (const p of allPairs(rng, n, base)) {
    if (added >= extra) break;
    if (has.has(p[0] + "," + p[1])) continue;
    edges.push(p);
    added++;
  }
  return shuffle(rng, edges.map((e) => (rng() < 0.5 ? [e[1], e[0]] : e)));
};

/** A simple undirected graph with min(m, n(n-1)/2) random edges (may be disconnected). */
const randomSimpleEdges = (rng: Rng, n: number, m: number, base: number): number[][] =>
  allPairs(rng, n, base).slice(0, m).map((e) => (rng() < 0.5 ? [e[1], e[0]] : e));

export const GRAPHS6_PROBLEMS: CatalogProblem[] = [

  // ── Redundant Connection II (LC 685) ────────────────────────────
  (() => {
    const ref = (edges: number[][]) => {
      const n = edges.length;
      for (let skip = n - 1; skip >= 0; skip--) {
        const indeg = new Array(n + 1).fill(0);
        const adj: number[][] = Array.from({ length: n + 1 }, () => []);
        for (let i = 0; i < n; i++) {
          if (i === skip) continue;
          indeg[edges[i][1]]++;
          adj[edges[i][0]].push(edges[i][1]);
        }
        let root = -1, ok = true;
        for (let v = 1; v <= n; v++) {
          if (indeg[v] === 0) { if (root !== -1) ok = false; root = v; } else if (indeg[v] > 1) ok = false;
        }
        if (!ok || root === -1) continue;
        const seen = new Array(n + 1).fill(false);
        const st = [root];
        seen[root] = true;
        let cnt = 1;
        while (st.length) {
          const u = st.pop()!;
          for (const v of adj[u]) if (!seen[v]) { seen[v] = true; cnt++; st.push(v); }
        }
        if (cnt === n) return edges[skip];
      }
      return [];
    };
    return {
      slug: "redundant-connection-ii",
      title: "Redundant Connection II",
      difficulty: "HARD" as const,
      tags: ["Graph", "Union Find", "Depth-First Search", "Google", "Amazon", "Uber"],
      signature: { funcName: "findRedundantDirectedConnection", params: [{ name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A **rooted tree** is a directed graph with one root node that every other node descends from; every node except the root has exactly one parent, and the root has none.\n\nThe CodeKairo mentorship chart started as a rooted tree on `n` people labelled `1` to `n`, with each edge `[u, v]` meaning `u` mentors `v`. Then one extra directed edge was added between two different people; it was not already in the chart. You receive the resulting `n` edges as `edges`.\n\nReturn an edge whose removal turns the graph back into a rooted tree on all `n` nodes. If several edges qualify, return the one that appears **last** in `edges`.",
        [
          { in: "edges = [[1,2],[1,3],[3,2]]", out: "[3,2]", note: "Node 2 has two parents; dropping the later edge `[3,2]` leaves the tree rooted at 1." },
          { in: "edges = [[2,3],[3,1],[1,4],[4,2]]", out: "[4,2]", note: "No node has two parents, but the four edges form a cycle. Removing any cycle edge works; `[4,2]` is the last one listed." },
          { in: "edges = [[3,1],[1,2],[2,3],[4,2]]", out: "[1,2]", note: "Node 2 has parents 1 and 4, and 3 → 1 → 2 → 3 is a cycle. Only removing `[1,2]` leaves a tree (rooted at 4)." },
        ],
        ["n == edges.length", "3 <= n <= 1000", "edges[i].length == 2", "1 <= ui, vi <= n", "ui != vi", "the input is a rooted tree plus one extra edge"]),
      hints: [
        "Adding one directed edge to a rooted tree can break it in two ways: some node gets a second parent, or a cycle appears — or both at once.",
        "If a node has two parents, the answer is one of its two incoming edges. Which one? Try leaving the later one out and see whether a cycle remains.",
        "Union-find over the edges (skipping the second incoming edge, if any) detects the cycle. A cycle left over means the first incoming edge was the culprit; no cycle means the second one was; no double parent means the edge that closes the cycle.",
      ],
      editorial: explain({
        idea: "The extra edge either gives some node a second parent, closes a cycle, or does both. Spotting the double parent first narrows the answer to two candidates, and a union-find pass decides between them.",
        steps: [
          "Scan the edges, recording each node's first parent. If an edge `[u, v]` arrives for a `v` that already has a parent, remember the earlier edge as `cand1` and this edge as `cand2`.",
          "Run union-find over the edges in order, skipping `cand2` if it exists.",
          "If some edge `[u, v]` joins two nodes already in the same set, a cycle exists: return `cand1` if there was a double parent, otherwise return `[u, v]`.",
          "If the pass finishes without a cycle, return `cand2`.",
        ],
        why: "With a double parent, exactly one of the two incoming edges must go. Skipping `cand2`: if the remaining graph still has a cycle, `cand2` cannot be the fix, so `cand1` (which lies on that cycle) is; if no cycle remains, removing `cand2` already yields a tree, and since `cand2` comes later it is the required answer. Without a double parent, the extra edge points at the root and closes a cycle; removing any cycle edge leaves a tree, and union-find reports exactly the cycle edge that appears last in the list, because the earlier cycle edges only form a path.",
        time: "O(n · α(n))",
        space: "O(n)",
        pitfalls: [
          "Union-find alone fails when a node has two parents but the cycle is closed by a different edge — the double-parent check must come first.",
          "When both candidates would produce a tree, the later one (`cand2`) must be returned.",
          "Union by undirected connectivity is enough for cycle detection here; no direction-aware traversal is needed.",
        ],
      }),
      examples: [
        { input: "[[1,2],[1,3],[3,2]]", expectedOutput: "[3,2]" },
        { input: "[[2,3],[3,1],[1,4],[4,2]]", expectedOutput: "[4,2]" },
        { input: "[[3,1],[1,2],[2,3],[4,2]]", expectedOutput: "[1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 3, 4, 4, 5, 6, 7, 8, 10, 12, 16, 24, 40]);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const edges: number[][] = [];
        const has = new Set<string>();
        for (let i = 1; i < n; i++) {
          const p = order[ri(rng, 0, i - 1)];
          edges.push([p, order[i]]);
          has.add(p + "," + order[i]);
        }
        if (rng() < 0.3) {
          edges.push([order[ri(rng, 1, n - 1)], order[0]]);
        } else {
          for (;;) {
            const u = ri(rng, 1, n), v = ri(rng, 1, n);
            if (u !== v && !has.has(u + "," + v)) { edges.push([u, v]); break; }
          }
        }
        shuffle(rng, edges);
        return { input: fmtIntMat(edges), expectedOutput: fmtIntArr(ref(edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findRedundantDirectedConnection(edges: List[List[int]]) -> List[int]:
              n = len(edges)
              parent = [0] * (n + 1)
              cand1 = None
              cand2 = None
              for u, v in edges:
                  if parent[v] != 0:
                      cand1 = [parent[v], v]
                      cand2 = [u, v]
                  else:
                      parent[v] = u
              root = list(range(n + 1))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              for u, v in edges:
                  if cand2 is not None and u == cand2[0] and v == cand2[1]:
                      continue
                  ru, rv = find(u), find(v)
                  if ru == rv:
                      return cand1 if cand1 is not None else [u, v]
                  root[rv] = ru
              return cand2
        `,
        javascript: code`
          var findRedundantDirectedConnection = function(edges) {
              var n = edges.length;
              var parent = [], root = [];
              for (var k = 0; k <= n; k++) { parent.push(0); root.push(k); }
              var cand1 = null, cand2 = null;
              for (var i = 0; i < n; i++) {
                  var u = edges[i][0], v = edges[i][1];
                  if (parent[v] !== 0) { cand1 = [parent[v], v]; cand2 = [u, v]; }
                  else parent[v] = u;
              }
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              for (var j = 0; j < n; j++) {
                  var a = edges[j][0], b = edges[j][1];
                  if (cand2 !== null && a === cand2[0] && b === cand2[1]) continue;
                  var ra = find(a), rb = find(b);
                  if (ra === rb) return cand1 !== null ? cand1 : [a, b];
                  root[rb] = ra;
              }
              return cand2;
          };
        `,
        typescript: code`
          function findRedundantDirectedConnection(edges: number[][]): number[] {
              var n = edges.length;
              var parent: number[] = [];
              var root: number[] = [];
              for (var k = 0; k <= n; k++) { parent.push(0); root.push(k); }
              var cand1: number[] = [];
              var cand2: number[] = [];
              for (var i = 0; i < n; i++) {
                  var u = edges[i][0], v = edges[i][1];
                  if (parent[v] !== 0) { cand1 = [parent[v], v]; cand2 = [u, v]; }
                  else parent[v] = u;
              }
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              for (var j = 0; j < n; j++) {
                  var a = edges[j][0], b = edges[j][1];
                  if (cand2.length > 0 && a === cand2[0] && b === cand2[1]) continue;
                  var ra = find(a), rb = find(b);
                  if (ra === rb) return cand1.length > 0 ? cand1 : [a, b];
                  root[rb] = ra;
              }
              return cand2;
          }
        `,
        java: code`
          public static int[] findRedundantDirectedConnection(int[][] edges) {
              int n = edges.length;
              int[] parent = new int[n + 1];
              int[] root = new int[n + 1];
              for (int k = 0; k <= n; k++) root[k] = k;
              int[] cand1 = null, cand2 = null;
              for (int[] e : edges) {
                  if (parent[e[1]] != 0) { cand1 = new int[]{parent[e[1]], e[1]}; cand2 = new int[]{e[0], e[1]}; }
                  else parent[e[1]] = e[0];
              }
              for (int[] e : edges) {
                  if (cand2 != null && e[0] == cand2[0] && e[1] == cand2[1]) continue;
                  int ra = rcFind(root, e[0]), rb = rcFind(root, e[1]);
                  if (ra == rb) return cand1 != null ? cand1 : new int[]{e[0], e[1]};
                  root[rb] = ra;
              }
              return cand2;
          }

          static int rcFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        cpp: code`
          static int rcFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {
              int n = edges.size();
              vector<int> parent(n + 1, 0), root(n + 1);
              for (int k = 0; k <= n; k++) root[k] = k;
              vector<int> cand1, cand2;
              for (auto& e : edges) {
                  if (parent[e[1]] != 0) { cand1 = {parent[e[1]], e[1]}; cand2 = {e[0], e[1]}; }
                  else parent[e[1]] = e[0];
              }
              for (auto& e : edges) {
                  if (!cand2.empty() && e[0] == cand2[0] && e[1] == cand2[1]) continue;
                  int ra = rcFind(root, e[0]), rb = rcFind(root, e[1]);
                  if (ra == rb) return !cand1.empty() ? cand1 : vector<int>{e[0], e[1]};
                  root[rb] = ra;
              }
              return cand2;
          }
        `,
        c: code`
          static int rcFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int* findRedundantDirectedConnection(int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
              int n = edgesSize;
              int* parent = (int*)calloc(n + 1, sizeof(int));
              int* root = (int*)malloc((n + 1) * sizeof(int));
              for (int k = 0; k <= n; k++) root[k] = k;
              int c1u = -1, c1v = -1, c2u = -1, c2v = -1;
              for (int i = 0; i < n; i++) {
                  int u = edges[i][0], v = edges[i][1];
                  if (parent[v] != 0) { c1u = parent[v]; c1v = v; c2u = u; c2v = v; }
                  else parent[v] = u;
              }
              int* res = (int*)malloc(2 * sizeof(int));
              *returnSize = 2;
              res[0] = c2u; res[1] = c2v;
              for (int i = 0; i < n; i++) {
                  int u = edges[i][0], v = edges[i][1];
                  if (c2u != -1 && u == c2u && v == c2v) continue;
                  int ra = rcFind(root, u), rb = rcFind(root, v);
                  if (ra == rb) {
                      if (c1u != -1) { res[0] = c1u; res[1] = c1v; }
                      else { res[0] = u; res[1] = v; }
                      break;
                  }
                  root[rb] = ra;
              }
              free(parent);
              free(root);
              return res;
          }
        `,
        csharp: code`
          public static int[] FindRedundantDirectedConnection(int[][] edges)
          {
              int n = edges.Length;
              int[] parent = new int[n + 1];
              int[] root = new int[n + 1];
              for (int k = 0; k <= n; k++) root[k] = k;
              int[] cand1 = null, cand2 = null;
              foreach (var e in edges)
              {
                  if (parent[e[1]] != 0) { cand1 = new int[] { parent[e[1]], e[1] }; cand2 = new int[] { e[0], e[1] }; }
                  else parent[e[1]] = e[0];
              }
              foreach (var e in edges)
              {
                  if (cand2 != null && e[0] == cand2[0] && e[1] == cand2[1]) continue;
                  int ra = RcFind(root, e[0]), rb = RcFind(root, e[1]);
                  if (ra == rb) return cand1 != null ? cand1 : new int[] { e[0], e[1] };
                  root[rb] = ra;
              }
              return cand2;
          }

          static int RcFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        go: code`
          func rcFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func findRedundantDirectedConnection(edges [][]int) []int {
          	n := len(edges)
          	parent := make([]int, n+1)
          	root := make([]int, n+1)
          	for k := 0; k <= n; k++ {
          		root[k] = k
          	}
          	var cand1, cand2 []int
          	for _, e := range edges {
          		if parent[e[1]] != 0 {
          			cand1 = []int{parent[e[1]], e[1]}
          			cand2 = []int{e[0], e[1]}
          		} else {
          			parent[e[1]] = e[0]
          		}
          	}
          	for _, e := range edges {
          		if cand2 != nil && e[0] == cand2[0] && e[1] == cand2[1] {
          			continue
          		}
          		ra, rb := rcFind(root, e[0]), rcFind(root, e[1])
          		if ra == rb {
          			if cand1 != nil {
          				return cand1
          			}
          			return []int{e[0], e[1]}
          		}
          		root[rb] = ra
          	}
          	return cand2
          }
        `,
        kotlin: code`
          fun rcFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun findRedundantDirectedConnection(edges: Array<IntArray>): IntArray {
              val n = edges.size
              val parent = IntArray(n + 1)
              val root = IntArray(n + 1) { it }
              var cand1: IntArray? = null
              var cand2: IntArray? = null
              for (e in edges) {
                  if (parent[e[1]] != 0) { cand1 = intArrayOf(parent[e[1]], e[1]); cand2 = intArrayOf(e[0], e[1]) }
                  else parent[e[1]] = e[0]
              }
              for (e in edges) {
                  val c2 = cand2
                  if (c2 != null && e[0] == c2[0] && e[1] == c2[1]) continue
                  val ra = rcFind(root, e[0])
                  val rb = rcFind(root, e[1])
                  if (ra == rb) {
                      val c1 = cand1
                      return c1 ?: intArrayOf(e[0], e[1])
                  }
                  root[rb] = ra
              }
              return cand2!!
          }
        `,
        swift: code`
          func rcFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func findRedundantDirectedConnection(_ edges: [[Int]]) -> [Int] {
              let n = edges.count
              var parent = [Int](repeating: 0, count: n + 1)
              var root = Array(0...n)
              var cand1: [Int]? = nil
              var cand2: [Int]? = nil
              for e in edges {
                  if parent[e[1]] != 0 { cand1 = [parent[e[1]], e[1]]; cand2 = [e[0], e[1]] }
                  else { parent[e[1]] = e[0] }
              }
              for e in edges {
                  if let c2 = cand2, e[0] == c2[0] && e[1] == c2[1] { continue }
                  let ra = rcFind(&root, e[0])
                  let rb = rcFind(&root, e[1])
                  if ra == rb { return cand1 ?? [e[0], e[1]] }
                  root[rb] = ra
              }
              return cand2!
          }
        `,
        rust: code`
          fn rc_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn findRedundantDirectedConnection(edges: Vec<Vec<i32>>) -> Vec<i32> {
              let n = edges.len();
              let mut parent = vec![0i32; n + 1];
              let mut root: Vec<usize> = (0..=n).collect();
              let mut cand1: Option<Vec<i32>> = None;
              let mut cand2: Option<Vec<i32>> = None;
              for e in edges.iter() {
                  let v = e[1] as usize;
                  if parent[v] != 0 {
                      cand1 = Some(vec![parent[v], e[1]]);
                      cand2 = Some(vec![e[0], e[1]]);
                  } else {
                      parent[v] = e[0];
                  }
              }
              for e in edges.iter() {
                  if let Some(ref c2) = cand2 {
                      if e[0] == c2[0] && e[1] == c2[1] {
                          continue;
                      }
                  }
                  let ra = rc_find(&mut root, e[0] as usize);
                  let rb = rc_find(&mut root, e[1] as usize);
                  if ra == rb {
                      return match cand1 {
                          Some(c) => c,
                          None => vec![e[0], e[1]],
                      };
                  }
                  root[rb] = ra;
              }
              cand2.unwrap()
          }
        `,
        php: code`
          function findRedundantDirectedConnection($edges) {
              $n = count($edges);
              $parent = array_fill(0, $n + 1, 0);
              $root = range(0, $n);
              $cand1 = null;
              $cand2 = null;
              foreach ($edges as $e) {
                  if ($parent[$e[1]] != 0) { $cand1 = [$parent[$e[1]], $e[1]]; $cand2 = [$e[0], $e[1]]; }
                  else $parent[$e[1]] = $e[0];
              }
              foreach ($edges as $e) {
                  if ($cand2 !== null && $e[0] == $cand2[0] && $e[1] == $cand2[1]) continue;
                  $ra = rcFind($root, $e[0]);
                  $rb = rcFind($root, $e[1]);
                  if ($ra == $rb) return $cand1 !== null ? $cand1 : [$e[0], $e[1]];
                  $root[$rb] = $ra;
              }
              return $cand2;
          }

          function rcFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def findRedundantDirectedConnection(edges)
            n = edges.length
            parent = Array.new(n + 1, 0)
            root = (0..n).to_a
            cand1 = nil
            cand2 = nil
            edges.each do |u, v|
              if parent[v] != 0
                cand1 = [parent[v], v]
                cand2 = [u, v]
              else
                parent[v] = u
              end
            end
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            edges.each do |u, v|
              next if cand2 && u == cand2[0] && v == cand2[1]
              ra = find.call(u)
              rb = find.call(v)
              return (cand1 || [u, v]) if ra == rb
              root[rb] = ra
            end
            cand2
          end
        `,
      },
    };
  })(),

  // ── Most Stones Removed with Same Row or Column (LC 947) ────────
  (() => {
    const ref = (stones: number[][]) => {
      const n = stones.length;
      const seen = new Array(n).fill(false);
      let comps = 0;
      for (let s = 0; s < n; s++) {
        if (seen[s]) continue;
        comps++;
        seen[s] = true;
        const q = [s];
        for (let h = 0; h < q.length; h++) {
          const a = q[h];
          for (let b = 0; b < n; b++) {
            if (!seen[b] && (stones[a][0] === stones[b][0] || stones[a][1] === stones[b][1])) { seen[b] = true; q.push(b); }
          }
        }
      }
      return n - comps;
    };
    return {
      slug: "most-stones-removed-with-same-row-or-column",
      title: "Most Stones Removed with Same Row or Column",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Union Find", "Depth-First Search", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "removeStones", params: [{ name: "stones", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Stones sit on distinct integer points of a 2D board; `stones[i] = [xi, yi]` is the position of stone `i`.\n\nA stone may be removed if at least one **other stone that is still on the board** shares its row (same `x`) or its column (same `y`). Remove stones one at a time, in any order you like.\n\nReturn the largest number of stones that can be removed.",
        [
          { in: "stones = [[0,0],[0,2],[1,1],[2,1],[2,2]]", out: "4", note: "All five stones are linked through shared rows and columns, so all but one can go." },
          { in: "stones = [[3,4],[3,7],[5,5]]", out: "1", note: "`[3,4]` and `[3,7]` share row 3, so one of them can be removed; `[5,5]` shares nothing." },
          { in: "stones = [[0,0]]", out: "0" },
        ],
        ["1 <= stones.length <= 1000", "0 <= xi, yi <= 10^4", "no two stones are at the same point"]),
      hints: [
        "Connect two stones when they share a row or a column. What do the connected groups look like?",
        "Inside one connected group you can always remove stones until exactly one is left — remove leaves of a spanning tree first.",
        "The answer is the number of stones minus the number of connected groups; count the groups with union-find or a graph search.",
      ],
      editorial: explain({
        idea: "Treat stones as nodes joined when they share a row or column. Each connected component can be whittled down to a single stone, and no component can lose its last stone, so the answer is `n − components`.",
        steps: [
          "Start a union-find with one set per stone and a component count of `n`.",
          "For every pair of stones that share an `x` or a `y`, union them; each successful union lowers the count by one.",
          "Return `n` minus the final component count.",
        ],
        why: "Take a spanning tree of a component and repeatedly remove a leaf: a leaf still has its tree neighbour on the board, which shares its row or column, so the removal is legal — this empties the component down to one stone. Conversely, the last stone of a component has no partner left in its row or column (any such partner would be in the same component), so it can never be removed. Components never interact, so the total is the sum over components of `size − 1`.",
        time: "O(n² · α(n))",
        space: "O(n)",
        pitfalls: [
          "The removal order matters for a single sequence but not for the maximum — don't try to simulate greedy removals.",
          "Two stones in the same component need not share a row or column directly; connectivity is transitive.",
          "Rows and columns can also be unioned as nodes themselves (offsetting columns) for an O(n) variant; the pairwise version is fine for n ≤ 1000.",
        ],
      }),
      examples: [
        { input: "[[0,0],[0,2],[1,1],[2,1],[2,2]]", expectedOutput: "4" },
        { input: "[[3,4],[3,7],[5,5]]", expectedOutput: "1" },
        { input: "[[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 5, 8, 12, 16, 20, 25]);
        const span = pick(rng, [1, 2, 3, 4, 6, 10, 10000]);
        const cap = (span + 1) * (span + 1);
        const target = Math.min(n, cap);
        const seen = new Set<string>();
        const stones: number[][] = [];
        while (stones.length < target) {
          const x = ri(rng, 0, span), y = ri(rng, 0, span);
          if (seen.has(x + "," + y)) continue;
          seen.add(x + "," + y);
          stones.push([x, y]);
        }
        return { input: fmtIntMat(stones), expectedOutput: String(ref(stones)) };
      },
      solutions: {
        python: code`
          from typing import List

          def removeStones(stones: List[List[int]]) -> int:
              n = len(stones)
              root = list(range(n))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              comps = n
              for i in range(n):
                  for j in range(i + 1, n):
                      if stones[i][0] == stones[j][0] or stones[i][1] == stones[j][1]:
                          a, b = find(i), find(j)
                          if a != b:
                              root[a] = b
                              comps -= 1
              return n - comps
        `,
        javascript: code`
          var removeStones = function(stones) {
              var n = stones.length;
              var root = [];
              for (var i = 0; i < n; i++) root.push(i);
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              var comps = n;
              for (var a = 0; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      if (stones[a][0] === stones[b][0] || stones[a][1] === stones[b][1]) {
                          var ra = find(a), rb = find(b);
                          if (ra !== rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              return n - comps;
          };
        `,
        typescript: code`
          function removeStones(stones: number[][]): number {
              var n = stones.length;
              var root: number[] = [];
              for (var i = 0; i < n; i++) root.push(i);
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              var comps = n;
              for (var a = 0; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      if (stones[a][0] === stones[b][0] || stones[a][1] === stones[b][1]) {
                          var ra = find(a), rb = find(b);
                          if (ra !== rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              return n - comps;
          }
        `,
        java: code`
          public static int removeStones(int[][] stones) {
              int n = stones.length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              int comps = n;
              for (int a = 0; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      if (stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1]) {
                          int ra = stFind(root, a), rb = stFind(root, b);
                          if (ra != rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              return n - comps;
          }

          static int stFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        cpp: code`
          static int stFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int removeStones(vector<vector<int>>& stones) {
              int n = stones.size();
              vector<int> root(n);
              for (int i = 0; i < n; i++) root[i] = i;
              int comps = n;
              for (int a = 0; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      if (stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1]) {
                          int ra = stFind(root, a), rb = stFind(root, b);
                          if (ra != rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              return n - comps;
          }
        `,
        c: code`
          static int stFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int removeStones(int** stones, int stonesSize, int* stonesColSize) {
              int n = stonesSize;
              int* root = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) root[i] = i;
              int comps = n;
              for (int a = 0; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      if (stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1]) {
                          int ra = stFind(root, a), rb = stFind(root, b);
                          if (ra != rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              free(root);
              return n - comps;
          }
        `,
        csharp: code`
          public static int RemoveStones(int[][] stones)
          {
              int n = stones.Length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              int comps = n;
              for (int a = 0; a < n; a++)
              {
                  for (int b = a + 1; b < n; b++)
                  {
                      if (stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1])
                      {
                          int ra = StFind(root, a), rb = StFind(root, b);
                          if (ra != rb) { root[ra] = rb; comps--; }
                      }
                  }
              }
              return n - comps;
          }

          static int StFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        go: code`
          func stFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func removeStones(stones [][]int) int {
          	n := len(stones)
          	root := make([]int, n)
          	for i := 0; i < n; i++ {
          		root[i] = i
          	}
          	comps := n
          	for a := 0; a < n; a++ {
          		for b := a + 1; b < n; b++ {
          			if stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1] {
          				ra, rb := stFind(root, a), stFind(root, b)
          				if ra != rb {
          					root[ra] = rb
          					comps--
          				}
          			}
          		}
          	}
          	return n - comps
          }
        `,
        kotlin: code`
          fun stFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun removeStones(stones: Array<IntArray>): Int {
              val n = stones.size
              val root = IntArray(n) { it }
              var comps = n
              for (a in 0 until n) {
                  for (b in a + 1 until n) {
                      if (stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1]) {
                          val ra = stFind(root, a)
                          val rb = stFind(root, b)
                          if (ra != rb) { root[ra] = rb; comps-- }
                      }
                  }
              }
              return n - comps
          }
        `,
        swift: code`
          func stFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func removeStones(_ stones: [[Int]]) -> Int {
              let n = stones.count
              var root = Array(0..<n)
              var comps = n
              for a in 0..<n {
                  for b in (a + 1)..<n {
                      if stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1] {
                          let ra = stFind(&root, a)
                          let rb = stFind(&root, b)
                          if ra != rb { root[ra] = rb; comps -= 1 }
                      }
                  }
              }
              return n - comps
          }
        `,
        rust: code`
          fn st_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn removeStones(stones: Vec<Vec<i32>>) -> i32 {
              let n = stones.len();
              let mut root: Vec<usize> = (0..n).collect();
              let mut comps = n;
              for a in 0..n {
                  for b in (a + 1)..n {
                      if stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1] {
                          let ra = st_find(&mut root, a);
                          let rb = st_find(&mut root, b);
                          if ra != rb {
                              root[ra] = rb;
                              comps -= 1;
                          }
                      }
                  }
              }
              (n - comps) as i32
          }
        `,
        php: code`
          function removeStones($stones) {
              $n = count($stones);
              $root = $n > 0 ? range(0, $n - 1) : [];
              $comps = $n;
              for ($a = 0; $a < $n; $a++) {
                  for ($b = $a + 1; $b < $n; $b++) {
                      if ($stones[$a][0] == $stones[$b][0] || $stones[$a][1] == $stones[$b][1]) {
                          $ra = stFind($root, $a);
                          $rb = stFind($root, $b);
                          if ($ra != $rb) { $root[$ra] = $rb; $comps--; }
                      }
                  }
              }
              return $n - $comps;
          }

          function stFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def removeStones(stones)
            n = stones.length
            root = (0...n).to_a
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            comps = n
            (0...n).each do |a|
              ((a + 1)...n).each do |b|
                if stones[a][0] == stones[b][0] || stones[a][1] == stones[b][1]
                  ra = find.call(a)
                  rb = find.call(b)
                  if ra != rb
                    root[ra] = rb
                    comps -= 1
                  end
                end
              end
            end
            n - comps
          end
        `,
      },
    };
  })(),

  // ── Find the City With the Smallest Number of Neighbors at a Threshold Distance (LC 1334) ──
  (() => {
    const ref = (n: number, edges: number[][], threshold: number) => {
      // Dijkstra (array scan) from every city — independent of Floyd–Warshall.
      let best = -1, bestCount = Infinity;
      for (let s = 0; s < n; s++) {
        const dist = new Array(n).fill(Infinity);
        const done = new Array(n).fill(false);
        dist[s] = 0;
        for (let it = 0; it < n; it++) {
          let u = -1;
          for (let v = 0; v < n; v++) if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
          if (dist[u] === Infinity) break;
          done[u] = true;
          for (const [a, b, w] of edges) {
            if (a === u && dist[u] + w < dist[b]) dist[b] = dist[u] + w;
            if (b === u && dist[u] + w < dist[a]) dist[a] = dist[u] + w;
          }
        }
        let cnt = 0;
        for (let v = 0; v < n; v++) if (v !== s && dist[v] <= threshold) cnt++;
        if (cnt <= bestCount) { bestCount = cnt; best = s; }
      }
      return best;
    };
    return {
      slug: "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance",
      title: "Find the City With the Smallest Number of Neighbors at a Threshold Distance",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Shortest Path", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: {
        funcName: "findTheCity",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "distanceThreshold", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` cities numbered `0` to `n - 1`. Each `edges[i] = [from, to, weight]` is a two-way road of length `weight` between cities `from` and `to`.\n\nFor a city `c`, count the other cities whose **shortest** road distance from `c` is at most `distanceThreshold`.\n\nReturn the city with the **smallest** such count. If several cities tie, return the one with the **largest** number.",
        [
          { in: "n = 4, edges = [[0,1,2],[1,2,2],[2,3,5],[0,3,9]], distanceThreshold = 5", out: "3", note: "Within distance 5: city 0 reaches {1, 2}, city 1 reaches {0, 2}, city 2 reaches {0, 1, 3}, city 3 reaches only {2}." },
          { in: "n = 3, edges = [[0,1,1],[1,2,1]], distanceThreshold = 1", out: "2", note: "Cities 0 and 2 both reach one neighbour; the larger number wins the tie." },
        ],
        ["2 <= n <= 100", "1 <= edges.length <= n * (n - 1) / 2", "edges[i].length == 3", "0 <= from < to < n", "1 <= weight, distanceThreshold <= 10^4", "all pairs (from, to) are distinct"]),
      hints: [
        "You need shortest distances between every pair of cities, not just from one source.",
        "With n ≤ 100, Floyd–Warshall (three nested loops over an intermediate city) is fast enough and short to write.",
        "Then count, per city, how many others are within the threshold; scan cities in increasing order and use `<=` when comparing counts so the largest index wins ties.",
      ],
      editorial: explain({
        idea: "Compute all-pairs shortest paths, then pick the city with the fewest others within reach, breaking ties toward the larger index.",
        steps: [
          "Fill an `n × n` distance table with 0 on the diagonal, the road weight for each road, and a large sentinel elsewhere.",
          "Floyd–Warshall: for every intermediate `k`, and every pair `(i, j)`, relax `d[i][j]` with `d[i][k] + d[k][j]`.",
          "For each city count the others with `d[c][j] <= distanceThreshold`.",
          "Scan cities from 0 upward, replacing the answer whenever the count is less than **or equal to** the best so far.",
        ],
        why: "After processing intermediates `0..k`, `d[i][j]` holds the shortest path that only passes through those cities, so after all `n` rounds it is the true shortest distance. Scanning in increasing order with `<=` makes the last city achieving the minimum — the largest index — the answer.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "Pick a sentinel whose double still fits in a 32-bit int (for example 10^8), or guard the addition.",
          "Roads are two-way: set both `d[u][v]` and `d[v][u]`.",
          "Ties go to the larger city number — using `<` instead of `<=` returns the smallest.",
        ],
      }),
      examples: [
        { input: "4\n[[0,1,2],[1,2,2],[2,3,5],[0,3,9]]\n5", expectedOutput: "3" },
        { input: "3\n[[0,1,1],[1,2,1]]\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
        const cap = (n * (n - 1)) / 2;
        const m = ri(rng, 1, Math.min(cap, pick(rng, [n - 1, n, 2 * n, cap])));
        const W = pick(rng, [3, 10, 100, 10000]);
        const raw = randomSimpleEdges(rng, n, m, 0);
        const edges = raw.map((e) => [Math.min(e[0], e[1]), Math.max(e[0], e[1]), ri(rng, 1, W)]);
        const threshold = ri(rng, 1, Math.min(10000, W * pick(rng, [1, 2, 4])));
        return { input: `${n}\n${fmtIntMat(edges)}\n${threshold}`, expectedOutput: String(ref(n, edges, threshold)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findTheCity(n: int, edges: List[List[int]], distanceThreshold: int) -> int:
              INF = 10 ** 8
              d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
              for u, v, w in edges:
                  if w < d[u][v]:
                      d[u][v] = w
                      d[v][u] = w
              for k in range(n):
                  dk = d[k]
                  for i in range(n):
                      di = d[i]
                      dik = di[k]
                      if dik == INF:
                          continue
                      for j in range(n):
                          if dik + dk[j] < di[j]:
                              di[j] = dik + dk[j]
              best, best_count = -1, n + 1
              for c in range(n):
                  cnt = sum(1 for j in range(n) if j != c and d[c][j] <= distanceThreshold)
                  if cnt <= best_count:
                      best_count = cnt
                      best = c
              return best
        `,
        javascript: code`
          var findTheCity = function(n, edges, distanceThreshold) {
              var INF = 100000000;
              var d = [];
              for (var i = 0; i < n; i++) {
                  d.push([]);
                  for (var j = 0; j < n; j++) d[i].push(i === j ? 0 : INF);
              }
              for (var e = 0; e < edges.length; e++) {
                  var u = edges[e][0], v = edges[e][1], w = edges[e][2];
                  if (w < d[u][v]) { d[u][v] = w; d[v][u] = w; }
              }
              for (var k = 0; k < n; k++)
                  for (var a = 0; a < n; a++)
                      for (var b = 0; b < n; b++)
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
              var best = -1, bestCount = n + 1;
              for (var c = 0; c < n; c++) {
                  var cnt = 0;
                  for (var t = 0; t < n; t++) if (t !== c && d[c][t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              return best;
          };
        `,
        typescript: code`
          function findTheCity(n: number, edges: number[][], distanceThreshold: number): number {
              var INF = 100000000;
              var d: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(i === j ? 0 : INF);
                  d.push(row);
              }
              for (var e = 0; e < edges.length; e++) {
                  var u = edges[e][0], v = edges[e][1], w = edges[e][2];
                  if (w < d[u][v]) { d[u][v] = w; d[v][u] = w; }
              }
              for (var k = 0; k < n; k++)
                  for (var a = 0; a < n; a++)
                      for (var b = 0; b < n; b++)
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
              var best = -1, bestCount = n + 1;
              for (var c = 0; c < n; c++) {
                  var cnt = 0;
                  for (var t = 0; t < n; t++) if (t !== c && d[c][t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              return best;
          }
        `,
        java: code`
          public static int findTheCity(int n, int[][] edges, int distanceThreshold) {
              final int INF = 100000000;
              int[][] d = new int[n][n];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) d[i][j] = i == j ? 0 : INF;
              for (int[] e : edges) {
                  if (e[2] < d[e[0]][e[1]]) { d[e[0]][e[1]] = e[2]; d[e[1]][e[0]] = e[2]; }
              }
              for (int k = 0; k < n; k++)
                  for (int a = 0; a < n; a++)
                      for (int b = 0; b < n; b++)
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
              int best = -1, bestCount = n + 1;
              for (int c = 0; c < n; c++) {
                  int cnt = 0;
                  for (int t = 0; t < n; t++) if (t != c && d[c][t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              return best;
          }
        `,
        cpp: code`
          int findTheCity(int n, vector<vector<int>>& edges, int distanceThreshold) {
              const int INF = 100000000;
              vector<vector<int>> d(n, vector<int>(n, INF));
              for (int i = 0; i < n; i++) d[i][i] = 0;
              for (auto& e : edges) {
                  if (e[2] < d[e[0]][e[1]]) { d[e[0]][e[1]] = e[2]; d[e[1]][e[0]] = e[2]; }
              }
              for (int k = 0; k < n; k++)
                  for (int a = 0; a < n; a++)
                      for (int b = 0; b < n; b++)
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
              int best = -1, bestCount = n + 1;
              for (int c = 0; c < n; c++) {
                  int cnt = 0;
                  for (int t = 0; t < n; t++) if (t != c && d[c][t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              return best;
          }
        `,
        c: code`
          int findTheCity(int n, int** edges, int edgesSize, int* edgesColSize, int distanceThreshold) {
              const int INF = 100000000;
              int* d = (int*)malloc(n * n * sizeof(int));
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) d[i * n + j] = i == j ? 0 : INF;
              for (int e = 0; e < edgesSize; e++) {
                  int u = edges[e][0], v = edges[e][1], w = edges[e][2];
                  if (w < d[u * n + v]) { d[u * n + v] = w; d[v * n + u] = w; }
              }
              for (int k = 0; k < n; k++)
                  for (int a = 0; a < n; a++)
                      for (int b = 0; b < n; b++)
                          if (d[a * n + k] + d[k * n + b] < d[a * n + b]) d[a * n + b] = d[a * n + k] + d[k * n + b];
              int best = -1, bestCount = n + 1;
              for (int c = 0; c < n; c++) {
                  int cnt = 0;
                  for (int t = 0; t < n; t++) if (t != c && d[c * n + t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              free(d);
              return best;
          }
        `,
        csharp: code`
          public static int FindTheCity(int n, int[][] edges, int distanceThreshold)
          {
              const int INF = 100000000;
              int[,] d = new int[n, n];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) d[i, j] = i == j ? 0 : INF;
              foreach (var e in edges)
              {
                  if (e[2] < d[e[0], e[1]]) { d[e[0], e[1]] = e[2]; d[e[1], e[0]] = e[2]; }
              }
              for (int k = 0; k < n; k++)
                  for (int a = 0; a < n; a++)
                      for (int b = 0; b < n; b++)
                          if (d[a, k] + d[k, b] < d[a, b]) d[a, b] = d[a, k] + d[k, b];
              int best = -1, bestCount = n + 1;
              for (int c = 0; c < n; c++)
              {
                  int cnt = 0;
                  for (int t = 0; t < n; t++) if (t != c && d[c, t] <= distanceThreshold) cnt++;
                  if (cnt <= bestCount) { bestCount = cnt; best = c; }
              }
              return best;
          }
        `,
        go: code`
          func findTheCity(n int, edges [][]int, distanceThreshold int) int {
          	const INF = 100000000
          	d := make([][]int, n)
          	for i := 0; i < n; i++ {
          		d[i] = make([]int, n)
          		for j := 0; j < n; j++ {
          			if i != j {
          				d[i][j] = INF
          			}
          		}
          	}
          	for _, e := range edges {
          		if e[2] < d[e[0]][e[1]] {
          			d[e[0]][e[1]] = e[2]
          			d[e[1]][e[0]] = e[2]
          		}
          	}
          	for k := 0; k < n; k++ {
          		for a := 0; a < n; a++ {
          			for b := 0; b < n; b++ {
          				if d[a][k]+d[k][b] < d[a][b] {
          					d[a][b] = d[a][k] + d[k][b]
          				}
          			}
          		}
          	}
          	best, bestCount := -1, n+1
          	for c := 0; c < n; c++ {
          		cnt := 0
          		for t := 0; t < n; t++ {
          			if t != c && d[c][t] <= distanceThreshold {
          				cnt++
          			}
          		}
          		if cnt <= bestCount {
          			bestCount = cnt
          			best = c
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun findTheCity(n: Int, edges: Array<IntArray>, distanceThreshold: Int): Int {
              val inf = 100000000
              val d = Array(n) { i -> IntArray(n) { j -> if (i == j) 0 else inf } }
              for (e in edges) {
                  if (e[2] < d[e[0]][e[1]]) { d[e[0]][e[1]] = e[2]; d[e[1]][e[0]] = e[2] }
              }
              for (k in 0 until n)
                  for (a in 0 until n)
                      for (b in 0 until n)
                          if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b]
              var best = -1
              var bestCount = n + 1
              for (c in 0 until n) {
                  var cnt = 0
                  for (t in 0 until n) if (t != c && d[c][t] <= distanceThreshold) cnt++
                  if (cnt <= bestCount) { bestCount = cnt; best = c }
              }
              return best
          }
        `,
        swift: code`
          func findTheCity(_ n: Int, _ edges: [[Int]], _ distanceThreshold: Int) -> Int {
              let inf = 100000000
              var d = [[Int]](repeating: [Int](repeating: inf, count: n), count: n)
              for i in 0..<n { d[i][i] = 0 }
              for e in edges {
                  if e[2] < d[e[0]][e[1]] { d[e[0]][e[1]] = e[2]; d[e[1]][e[0]] = e[2] }
              }
              for k in 0..<n {
                  for a in 0..<n {
                      for b in 0..<n {
                          if d[a][k] + d[k][b] < d[a][b] { d[a][b] = d[a][k] + d[k][b] }
                      }
                  }
              }
              var best = -1
              var bestCount = n + 1
              for c in 0..<n {
                  var cnt = 0
                  for t in 0..<n where t != c && d[c][t] <= distanceThreshold { cnt += 1 }
                  if cnt <= bestCount { bestCount = cnt; best = c }
              }
              return best
          }
        `,
        rust: code`
          fn findTheCity(n: i32, edges: Vec<Vec<i32>>, distanceThreshold: i32) -> i32 {
              let n = n as usize;
              let inf = 100000000i32;
              let mut d = vec![vec![inf; n]; n];
              for i in 0..n {
                  d[i][i] = 0;
              }
              for e in edges.iter() {
                  let (u, v, w) = (e[0] as usize, e[1] as usize, e[2]);
                  if w < d[u][v] {
                      d[u][v] = w;
                      d[v][u] = w;
                  }
              }
              for k in 0..n {
                  for a in 0..n {
                      for b in 0..n {
                          let via = d[a][k] + d[k][b];
                          if via < d[a][b] {
                              d[a][b] = via;
                          }
                      }
                  }
              }
              let mut best = -1i32;
              let mut best_count = n + 1;
              for c in 0..n {
                  let mut cnt = 0usize;
                  for t in 0..n {
                      if t != c && d[c][t] <= distanceThreshold {
                          cnt += 1;
                      }
                  }
                  if cnt <= best_count {
                      best_count = cnt;
                      best = c as i32;
                  }
              }
              best
          }
        `,
        php: code`
          function findTheCity($n, $edges, $distanceThreshold) {
              $INF = 100000000;
              $d = [];
              for ($i = 0; $i < $n; $i++) {
                  $d[] = array_fill(0, $n, $INF);
                  $d[$i][$i] = 0;
              }
              foreach ($edges as $e) {
                  if ($e[2] < $d[$e[0]][$e[1]]) { $d[$e[0]][$e[1]] = $e[2]; $d[$e[1]][$e[0]] = $e[2]; }
              }
              for ($k = 0; $k < $n; $k++)
                  for ($a = 0; $a < $n; $a++) {
                      $dak = $d[$a][$k];
                      if ($dak >= $INF) continue;
                      for ($b = 0; $b < $n; $b++)
                          if ($dak + $d[$k][$b] < $d[$a][$b]) $d[$a][$b] = $dak + $d[$k][$b];
                  }
              $best = -1;
              $bestCount = $n + 1;
              for ($c = 0; $c < $n; $c++) {
                  $cnt = 0;
                  for ($t = 0; $t < $n; $t++) if ($t != $c && $d[$c][$t] <= $distanceThreshold) $cnt++;
                  if ($cnt <= $bestCount) { $bestCount = $cnt; $best = $c; }
              }
              return $best;
          }
        `,
        ruby: code`
          def findTheCity(n, edges, distanceThreshold)
            inf = 100_000_000
            d = Array.new(n) { |i| Array.new(n) { |j| i == j ? 0 : inf } }
            edges.each do |u, v, w|
              if w < d[u][v]
                d[u][v] = w
                d[v][u] = w
              end
            end
            n.times do |k|
              dk = d[k]
              n.times do |a|
                da = d[a]
                dak = da[k]
                next if dak >= inf
                n.times do |b|
                  via = dak + dk[b]
                  da[b] = via if via < da[b]
                end
              end
            end
            best = -1
            best_count = n + 1
            n.times do |c|
              cnt = 0
              n.times { |t| cnt += 1 if t != c && d[c][t] <= distanceThreshold }
              if cnt <= best_count
                best_count = cnt
                best = c
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Check if There is a Valid Path in a Grid (LC 1391) ──────────
  (() => {
    // Openings as bits: up 1, right 2, down 4, left 8 (street types 1..6).
    const MASKS = [0, 10, 5, 12, 6, 9, 3];
    const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const seen = Array.from({ length: m }, () => new Array(n).fill(false));
      const stack: number[][] = [[0, 0]];
      seen[0][0] = true;
      while (stack.length) {
        const [r, c] = stack.pop()!;
        if (r === m - 1 && c === n - 1) return true;
        for (let d = 0; d < 4; d++) {
          if (!(MASKS[grid[r][c]] & (1 << d))) continue;
          const nr = r + DR[d], nc = c + DC[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;
          if (!(MASKS[grid[nr][nc]] & (1 << ((d + 2) % 4)))) continue;
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
      return false;
    };
    const plantPath = (rng: Rng, m: number, n: number): number[] => {
      const seen = new Array(m * n).fill(false);
      const path: number[] = [];
      const go = (id: number): boolean => {
        seen[id] = true;
        path.push(id);
        if (id === m * n - 1) return true;
        const r = Math.floor(id / n), c = id % n;
        for (const d of shuffle(rng, [0, 1, 2, 3])) {
          const nr = r + DR[d], nc = c + DC[d];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
          const nid = nr * n + nc;
          if (!seen[nid] && go(nid)) return true;
        }
        path.pop();
        return false;
      };
      go(0);
      return path;
    };
    const dirTo = (a: number, b: number, n: number) => {
      const dr = Math.floor(b / n) - Math.floor(a / n), dc = (b % n) - (a % n);
      for (let d = 0; d < 4; d++) if (DR[d] === dr && DC[d] === dc) return d;
      return -1;
    };
    return {
      slug: "check-if-there-is-a-valid-path-in-a-grid",
      title: "Check if There is a Valid Path in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Matrix", "Breadth-First Search", "Depth-First Search", "Union Find", "Google", "Amazon"],
      signature: { funcName: "hasValidPath", params: [{ name: "grid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Every cell of an `m x n` grid holds one street piece, given as a number from `1` to `6`:\n\n- `1` joins the **left** and **right** neighbours.\n- `2` joins the **upper** and **lower** neighbours.\n- `3` joins the **left** and **lower** neighbours.\n- `4` joins the **right** and **lower** neighbours.\n- `5` joins the **left** and **upper** neighbours.\n- `6` joins the **right** and **upper** neighbours.\n\nYou may step from a cell to an adjacent one only if the street in your cell opens toward that neighbour **and** the neighbour's street opens back toward you. Streets cannot be rotated.\n\nStarting at the top-left cell `(0, 0)`, return `true` if the streets lead you to the bottom-right cell `(m - 1, n - 1)`.",
        [
          { in: "grid = [[4,1,3],[6,1,5]]", out: "true", note: "(0,0) opens right into the straight piece at (0,1), then (0,2) turns down into (1,2), which opens upward." },
          { in: "grid = [[1,2],[2,1]]", out: "false", note: "(0,0) opens only left and right, but (0,1) is a vertical piece that does not open to the left." },
          { in: "grid = [[5]]", out: "true", note: "The start is already the destination." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "1 <= grid[i][j] <= 6"]),
      hints: [
        "Model each street type as the set of directions it opens toward.",
        "A move between neighbours is allowed only when both cells open toward each other — check the neighbour for the opposite direction.",
        "Run a BFS or DFS from (0, 0) using that rule and report whether (m − 1, n − 1) is visited.",
      ],
      editorial: explain({
        idea: "The grid is a graph whose edges exist only between neighbouring cells that open toward each other; the question is plain reachability from the top-left to the bottom-right.",
        steps: [
          "Encode each street type as a 4-bit mask of openings (up, right, down, left).",
          "BFS from `(0, 0)`. From cell `(r, c)` try every direction `d` its mask contains.",
          "Move to the neighbour if it is inside the grid, unvisited, and its mask contains the opposite direction `(d + 2) mod 4`.",
          "Return `true` as soon as `(m − 1, n − 1)` is reached; `false` when the queue empties.",
        ],
        why: "Two cells are connected by a usable street exactly when both openings face each other, so the mutual-opening test reproduces the street graph precisely. BFS visits every cell reachable in that graph, so the destination is reached if and only if a valid path exists.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Checking only the current cell's opening lets you walk into a piece that does not connect back.",
          "A 1 × 1 grid is trivially `true`.",
          "Paths may wind up and left as well as down and right — do not restrict the search to monotone moves.",
        ],
      }),
      examples: [
        { input: "[[4,1,3],[6,1,5]]", expectedOutput: "true" },
        { input: "[[1,2],[2,1]]", expectedOutput: "false" },
        { input: "[[5]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 5, 8])), n = ri(rng, 1, pick(rng, [1, 3, 5, 8]));
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, 6)));
        if (rng() < 0.55) {
          const path = plantPath(rng, m, n);
          for (let k = 0; k < path.length; k++) {
            let need = 0;
            if (k > 0) need |= 1 << dirTo(path[k], path[k - 1], n);
            if (k < path.length - 1) need |= 1 << dirTo(path[k], path[k + 1], n);
            const options: number[] = [];
            for (let t = 1; t <= 6; t++) if ((MASKS[t] & need) === need) options.push(t);
            grid[Math.floor(path[k] / n)][path[k] % n] = pick(rng, options);
          }
        }
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def hasValidPath(grid: List[List[int]]) -> bool:
              m, n = len(grid), len(grid[0])
              masks = [0, 10, 5, 12, 6, 9, 3]
              dr = [-1, 0, 1, 0]
              dc = [0, 1, 0, -1]
              seen = [[False] * n for _ in range(m)]
              seen[0][0] = True
              q = deque([(0, 0)])
              while q:
                  r, c = q.popleft()
                  if r == m - 1 and c == n - 1:
                      return True
                  mk = masks[grid[r][c]]
                  for d in range(4):
                      if not (mk >> d) & 1:
                          continue
                      nr, nc = r + dr[d], c + dc[d]
                      if nr < 0 or nr >= m or nc < 0 or nc >= n or seen[nr][nc]:
                          continue
                      if not (masks[grid[nr][nc]] >> ((d + 2) % 4)) & 1:
                          continue
                      seen[nr][nc] = True
                      q.append((nr, nc))
              return False
        `,
        javascript: code`
          var hasValidPath = function(grid) {
              var m = grid.length, n = grid[0].length;
              var masks = [0, 10, 5, 12, 6, 9, 3];
              var dr = [-1, 0, 1, 0], dc = [0, 1, 0, -1];
              var seen = [];
              for (var i = 0; i < m * n; i++) seen.push(false);
              var queue = [0];
              seen[0] = true;
              for (var h = 0; h < queue.length; h++) {
                  var r = Math.floor(queue[h] / n), c = queue[h] % n;
                  if (r === m - 1 && c === n - 1) return true;
                  var mk = masks[grid[r][c]];
                  for (var d = 0; d < 4; d++) {
                      if ((mk & (1 << d)) === 0) continue;
                      var nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) === 0) continue;
                      var id = nr * n + nc;
                      if (!seen[id]) { seen[id] = true; queue.push(id); }
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function hasValidPath(grid: number[][]): boolean {
              var m = grid.length, n = grid[0].length;
              var masks = [0, 10, 5, 12, 6, 9, 3];
              var dr = [-1, 0, 1, 0], dc = [0, 1, 0, -1];
              var seen: boolean[] = [];
              for (var i = 0; i < m * n; i++) seen.push(false);
              var queue: number[] = [0];
              seen[0] = true;
              for (var h = 0; h < queue.length; h++) {
                  var r = Math.floor(queue[h] / n), c = queue[h] % n;
                  if (r === m - 1 && c === n - 1) return true;
                  var mk = masks[grid[r][c]];
                  for (var d = 0; d < 4; d++) {
                      if ((mk & (1 << d)) === 0) continue;
                      var nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) === 0) continue;
                      var id = nr * n + nc;
                      if (!seen[id]) { seen[id] = true; queue.push(id); }
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean hasValidPath(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[] masks = {0, 10, 5, 12, 6, 9, 3};
              int[] dr = {-1, 0, 1, 0}, dc = {0, 1, 0, -1};
              boolean[] seen = new boolean[m * n];
              int[] queue = new int[m * n];
              int head = 0, tail = 0;
              queue[tail++] = 0;
              seen[0] = true;
              while (head < tail) {
                  int id = queue[head++];
                  int r = id / n, c = id % n;
                  if (r == m - 1 && c == n - 1) return true;
                  int mk = masks[grid[r][c]];
                  for (int d = 0; d < 4; d++) {
                      if ((mk & (1 << d)) == 0) continue;
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) == 0) continue;
                      int nid = nr * n + nc;
                      if (!seen[nid]) { seen[nid] = true; queue[tail++] = nid; }
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool hasValidPath(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              int masks[7] = {0, 10, 5, 12, 6, 9, 3};
              int dr[4] = {-1, 0, 1, 0}, dc[4] = {0, 1, 0, -1};
              vector<char> seen(m * n, 0);
              vector<int> queue;
              queue.push_back(0);
              seen[0] = 1;
              for (size_t h = 0; h < queue.size(); h++) {
                  int r = queue[h] / n, c = queue[h] % n;
                  if (r == m - 1 && c == n - 1) return true;
                  int mk = masks[grid[r][c]];
                  for (int d = 0; d < 4; d++) {
                      if ((mk & (1 << d)) == 0) continue;
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) == 0) continue;
                      int nid = nr * n + nc;
                      if (!seen[nid]) { seen[nid] = 1; queue.push_back(nid); }
                  }
              }
              return false;
          }
        `,
        c: code`
          bool hasValidPath(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              int masks[7] = {0, 10, 5, 12, 6, 9, 3};
              int dr[4] = {-1, 0, 1, 0}, dc[4] = {0, 1, 0, -1};
              char* seen = (char*)calloc(m * n, 1);
              int* queue = (int*)malloc(m * n * sizeof(int));
              int head = 0, tail = 0;
              bool found = false;
              queue[tail++] = 0;
              seen[0] = 1;
              while (head < tail) {
                  int id = queue[head++];
                  int r = id / n, c = id % n;
                  if (r == m - 1 && c == n - 1) { found = true; break; }
                  int mk = masks[grid[r][c]];
                  for (int d = 0; d < 4; d++) {
                      if ((mk & (1 << d)) == 0) continue;
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) == 0) continue;
                      int nid = nr * n + nc;
                      if (!seen[nid]) { seen[nid] = 1; queue[tail++] = nid; }
                  }
              }
              free(seen);
              free(queue);
              return found;
          }
        `,
        csharp: code`
          public static bool HasValidPath(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              int[] masks = { 0, 10, 5, 12, 6, 9, 3 };
              int[] dr = { -1, 0, 1, 0 }, dc = { 0, 1, 0, -1 };
              bool[] seen = new bool[m * n];
              int[] queue = new int[m * n];
              int head = 0, tail = 0;
              queue[tail++] = 0;
              seen[0] = true;
              while (head < tail)
              {
                  int id = queue[head++];
                  int r = id / n, c = id % n;
                  if (r == m - 1 && c == n - 1) return true;
                  int mk = masks[grid[r][c]];
                  for (int d = 0; d < 4; d++)
                  {
                      if ((mk & (1 << d)) == 0) continue;
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      if ((masks[grid[nr][nc]] & (1 << ((d + 2) % 4))) == 0) continue;
                      int nid = nr * n + nc;
                      if (!seen[nid]) { seen[nid] = true; queue[tail++] = nid; }
                  }
              }
              return false;
          }
        `,
        go: code`
          func hasValidPath(grid [][]int) bool {
          	m, n := len(grid), len(grid[0])
          	masks := []int{0, 10, 5, 12, 6, 9, 3}
          	dr := []int{-1, 0, 1, 0}
          	dc := []int{0, 1, 0, -1}
          	seen := make([]bool, m*n)
          	queue := []int{0}
          	seen[0] = true
          	for h := 0; h < len(queue); h++ {
          		r, c := queue[h]/n, queue[h]%n
          		if r == m-1 && c == n-1 {
          			return true
          		}
          		mk := masks[grid[r][c]]
          		for d := 0; d < 4; d++ {
          			if mk&(1<<uint(d)) == 0 {
          				continue
          			}
          			nr, nc := r+dr[d], c+dc[d]
          			if nr < 0 || nr >= m || nc < 0 || nc >= n {
          				continue
          			}
          			if masks[grid[nr][nc]]&(1<<uint((d+2)%4)) == 0 {
          				continue
          			}
          			nid := nr*n + nc
          			if !seen[nid] {
          				seen[nid] = true
          				queue = append(queue, nid)
          			}
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          fun hasValidPath(grid: Array<IntArray>): Boolean {
              val m = grid.size
              val n = grid[0].size
              val masks = intArrayOf(0, 10, 5, 12, 6, 9, 3)
              val dr = intArrayOf(-1, 0, 1, 0)
              val dc = intArrayOf(0, 1, 0, -1)
              val seen = BooleanArray(m * n)
              val queue = IntArray(m * n)
              var head = 0
              var tail = 0
              queue[tail++] = 0
              seen[0] = true
              while (head < tail) {
                  val id = queue[head++]
                  val r = id / n
                  val c = id % n
                  if (r == m - 1 && c == n - 1) return true
                  val mk = masks[grid[r][c]]
                  for (d in 0 until 4) {
                      if (mk and (1 shl d) == 0) continue
                      val nr = r + dr[d]
                      val nc = c + dc[d]
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue
                      if (masks[grid[nr][nc]] and (1 shl ((d + 2) % 4)) == 0) continue
                      val nid = nr * n + nc
                      if (!seen[nid]) { seen[nid] = true; queue[tail++] = nid }
                  }
              }
              return false
          }
        `,
        swift: code`
          func hasValidPath(_ grid: [[Int]]) -> Bool {
              let m = grid.count, n = grid[0].count
              let masks = [0, 10, 5, 12, 6, 9, 3]
              let dr = [-1, 0, 1, 0], dc = [0, 1, 0, -1]
              var seen = [Bool](repeating: false, count: m * n)
              var queue = [0]
              seen[0] = true
              var h = 0
              while h < queue.count {
                  let r = queue[h] / n, c = queue[h] % n
                  h += 1
                  if r == m - 1 && c == n - 1 { return true }
                  let mk = masks[grid[r][c]]
                  for d in 0..<4 {
                      if mk & (1 << d) == 0 { continue }
                      let nr = r + dr[d], nc = c + dc[d]
                      if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }
                      if masks[grid[nr][nc]] & (1 << ((d + 2) % 4)) == 0 { continue }
                      let nid = nr * n + nc
                      if !seen[nid] { seen[nid] = true; queue.append(nid) }
                  }
              }
              return false
          }
        `,
        rust: code`
          fn hasValidPath(grid: Vec<Vec<i32>>) -> bool {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let masks = [0i32, 10, 5, 12, 6, 9, 3];
              let dr = [-1i32, 0, 1, 0];
              let dc = [0i32, 1, 0, -1];
              let mut seen = vec![false; (m * n) as usize];
              let mut queue: Vec<i32> = vec![0];
              seen[0] = true;
              let mut h = 0;
              while h < queue.len() {
                  let id = queue[h];
                  h += 1;
                  let r = id / n;
                  let c = id % n;
                  if r == m - 1 && c == n - 1 {
                      return true;
                  }
                  let mk = masks[grid[r as usize][c as usize] as usize];
                  for d in 0..4usize {
                      if mk & (1 << d) == 0 {
                          continue;
                      }
                      let nr = r + dr[d];
                      let nc = c + dc[d];
                      if nr < 0 || nr >= m || nc < 0 || nc >= n {
                          continue;
                      }
                      if masks[grid[nr as usize][nc as usize] as usize] & (1 << ((d + 2) % 4)) == 0 {
                          continue;
                      }
                      let nid = (nr * n + nc) as usize;
                      if !seen[nid] {
                          seen[nid] = true;
                          queue.push(nid as i32);
                      }
                  }
              }
              false
          }
        `,
        php: code`
          function hasValidPath($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $masks = [0, 10, 5, 12, 6, 9, 3];
              $dr = [-1, 0, 1, 0];
              $dc = [0, 1, 0, -1];
              $seen = array_fill(0, $m * $n, false);
              $queue = [0];
              $seen[0] = true;
              for ($h = 0; $h < count($queue); $h++) {
                  $r = intdiv($queue[$h], $n);
                  $c = $queue[$h] % $n;
                  if ($r == $m - 1 && $c == $n - 1) return true;
                  $mk = $masks[$grid[$r][$c]];
                  for ($d = 0; $d < 4; $d++) {
                      if (($mk & (1 << $d)) == 0) continue;
                      $nr = $r + $dr[$d];
                      $nc = $c + $dc[$d];
                      if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;
                      if (($masks[$grid[$nr][$nc]] & (1 << (($d + 2) % 4))) == 0) continue;
                      $nid = $nr * $n + $nc;
                      if (!$seen[$nid]) { $seen[$nid] = true; $queue[] = $nid; }
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def hasValidPath(grid)
            m = grid.length
            n = grid[0].length
            masks = [0, 10, 5, 12, 6, 9, 3]
            dr = [-1, 0, 1, 0]
            dc = [0, 1, 0, -1]
            seen = Array.new(m * n, false)
            queue = [0]
            seen[0] = true
            h = 0
            while h < queue.length
              r = queue[h] / n
              c = queue[h] % n
              h += 1
              return true if r == m - 1 && c == n - 1
              mk = masks[grid[r][c]]
              4.times do |d|
                next if mk & (1 << d) == 0
                nr = r + dr[d]
                nc = c + dc[d]
                next if nr < 0 || nr >= m || nc < 0 || nc >= n
                next if masks[grid[nr][nc]] & (1 << ((d + 2) % 4)) == 0
                nid = nr * n + nc
                unless seen[nid]
                  seen[nid] = true
                  queue << nid
                end
              end
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Minimize Hamming Distance After Swap Operations (LC 1722) ───
  (() => {
    const ref = (source: number[], target: number[], swaps: number[][]) => {
      const n = source.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of swaps) { adj[a].push(b); adj[b].push(a); }
      const comp = new Array(n).fill(-1);
      let total = 0;
      for (let s = 0; s < n; s++) {
        if (comp[s] !== -1) continue;
        const members = [s];
        comp[s] = s;
        for (let h = 0; h < members.length; h++) {
          for (const v of adj[members[h]]) if (comp[v] === -1) { comp[v] = s; members.push(v); }
        }
        const cs = new Map<number, number>(), ct = new Map<number, number>();
        for (const i of members) {
          cs.set(source[i], (cs.get(source[i]) || 0) + 1);
          ct.set(target[i], (ct.get(target[i]) || 0) + 1);
        }
        let common = 0;
        for (const [v, c] of cs) common += Math.min(c, ct.get(v) || 0);
        total += members.length - common;
      }
      return total;
    };
    return {
      slug: "minimize-hamming-distance-after-swap-operations",
      title: "Minimize Hamming Distance After Swap Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Union Find", "Depth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "minimumHammingDistance",
        params: [{ name: "source", type: "int[]" as const }, { name: "target", type: "int[]" as const }, { name: "allowedSwaps", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two integer arrays `source` and `target` of the same length `n`, and a list `allowedSwaps` where `allowedSwaps[i] = [ai, bi]` lets you swap the elements at indices `ai` and `bi` of `source`. Each allowed swap may be used any number of times, in any order.\n\nThe **Hamming distance** of two equal-length arrays is the number of indices `i` where they differ.\n\nReturn the smallest Hamming distance between `source` and `target` you can reach after performing any sequence of allowed swaps on `source`.",
        [
          { in: "source = [5,1,2,4], target = [1,5,4,3], allowedSwaps = [[0,1],[2,3]]", out: "1", note: "Swap indices 0, 1 and then 2, 3 to get `[1,5,4,2]`; only index 3 still differs." },
          { in: "source = [1,2,3,4], target = [1,3,2,4], allowedSwaps = []", out: "2" },
          { in: "source = [3,1,2,2,5], target = [2,3,5,2,1], allowedSwaps = [[0,4],[4,2],[1,3],[1,4]]", out: "0", note: "All indices are linked, so `source` can be rearranged freely into `target`." },
        ],
        ["n == source.length == target.length", "1 <= n <= 10^5", "1 <= source[i], target[i] <= 10^5", "0 <= allowedSwaps.length <= 10^5", "allowedSwaps[i].length == 2", "0 <= ai, bi <= n - 1", "ai != bi"]),
      hints: [
        "If index a can swap with b, and b with c, then the values at a, b and c can be arranged in any order.",
        "So the swaps split the indices into groups (connected components); inside a group the values of `source` can be permuted freely.",
        "Per group, count how many values of `source` can be matched with equal values of `target` at the group's indices; everything unmatched adds to the distance.",
      ],
      editorial: explain({
        idea: "Allowed swaps connect indices; within a connected group any permutation is reachable, so each group contributes `size − (multiset overlap of its source and target values)`.",
        steps: [
          "Union the two indices of every allowed swap in a union-find.",
          "For each index `i`, add the pair `(root(i), source[i])` to a counter.",
          "For each index `i`, look up `(root(i), target[i])`: if the counter is positive, decrement it (a match); otherwise the index will stay different, so add 1 to the answer.",
        ],
        why: "Transpositions along the edges of a connected graph generate every permutation of its vertices, so inside a component the source values can be placed anywhere. The best placement then matches as many target values as the two multisets have in common, which the greedy counter computes exactly; components are independent of each other.",
        time: "O((n + s) · α(n))",
        space: "O(n)",
        pitfalls: [
          "Swaps are transitive — handling each listed pair in isolation undercounts what can be rearranged.",
          "Key the counter by component **and** value; a value matching in a different component does not count.",
          "`allowedSwaps` may be empty: then the answer is the plain Hamming distance.",
        ],
      }),
      examples: [
        { input: "[5,1,2,4]\n[1,5,4,3]\n[[0,1],[2,3]]", expectedOutput: "1" },
        { input: "[1,2,3,4]\n[1,3,2,4]\n[]", expectedOutput: "2" },
        { input: "[3,1,2,2,5]\n[2,3,5,2,1]\n[[0,4],[4,2],[1,3],[1,4]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 4, 6, 8, 10, 14, 20]);
        const V = pick(rng, [2, 3, 5, 10, 100000]);
        const source = Array.from({ length: n }, () => ri(rng, 1, V));
        let target: number[];
        if (rng() < 0.5) {
          target = shuffle(rng, source.slice());
          for (let k = ri(rng, 0, 2); k > 0; k--) target[ri(rng, 0, n - 1)] = ri(rng, 1, V);
        } else {
          target = Array.from({ length: n }, () => ri(rng, 1, V));
        }
        const m = n < 2 ? 0 : ri(rng, 0, pick(rng, [1, n, 2 * n]));
        const swaps = randomSimpleEdges(rng, n, m, 0);
        return { input: `${fmtIntArr(source)}\n${fmtIntArr(target)}\n${fmtIntMat(swaps)}`, expectedOutput: String(ref(source, target, swaps)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def minimumHammingDistance(source: List[int], target: List[int], allowedSwaps: List[List[int]]) -> int:
              n = len(source)
              root = list(range(n))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              for a, b in allowedSwaps:
                  ra, rb = find(a), find(b)
                  if ra != rb:
                      root[ra] = rb
              count = Counter()
              for i in range(n):
                  count[(find(i), source[i])] += 1
              dist = 0
              for i in range(n):
                  key = (find(i), target[i])
                  if count[key] > 0:
                      count[key] -= 1
                  else:
                      dist += 1
              return dist
        `,
        javascript: code`
          var minimumHammingDistance = function(source, target, allowedSwaps) {
              var n = source.length;
              var root = [];
              for (var i = 0; i < n; i++) root.push(i);
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              for (var s = 0; s < allowedSwaps.length; s++) {
                  var ra = find(allowedSwaps[s][0]), rb = find(allowedSwaps[s][1]);
                  if (ra !== rb) root[ra] = rb;
              }
              var count = new Map();
              for (var j = 0; j < n; j++) {
                  var key = find(j) * 100001 + source[j];
                  count.set(key, (count.get(key) || 0) + 1);
              }
              var dist = 0;
              for (var k = 0; k < n; k++) {
                  var key2 = find(k) * 100001 + target[k];
                  var c = count.get(key2) || 0;
                  if (c > 0) count.set(key2, c - 1);
                  else dist++;
              }
              return dist;
          };
        `,
        typescript: code`
          function minimumHammingDistance(source: number[], target: number[], allowedSwaps: number[][]): number {
              var n = source.length;
              var root: number[] = [];
              for (var i = 0; i < n; i++) root.push(i);
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              for (var s = 0; s < allowedSwaps.length; s++) {
                  var ra = find(allowedSwaps[s][0]), rb = find(allowedSwaps[s][1]);
                  if (ra !== rb) root[ra] = rb;
              }
              var count: { [k: string]: number } = {};
              for (var j = 0; j < n; j++) {
                  var key = find(j) + "," + source[j];
                  count[key] = (count[key] === undefined ? 0 : count[key]) + 1;
              }
              var dist = 0;
              for (var k = 0; k < n; k++) {
                  var key2 = find(k) + "," + target[k];
                  if (count[key2] !== undefined && count[key2] > 0) count[key2]--;
                  else dist++;
              }
              return dist;
          }
        `,
        java: code`
          public static int minimumHammingDistance(int[] source, int[] target, int[][] allowedSwaps) {
              int n = source.length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              for (int[] s : allowedSwaps) {
                  int ra = mhFind(root, s[0]), rb = mhFind(root, s[1]);
                  if (ra != rb) root[ra] = rb;
              }
              Map<Long, Integer> count = new HashMap<>();
              for (int i = 0; i < n; i++) count.merge((long) mhFind(root, i) * 100001L + source[i], 1, Integer::sum);
              int dist = 0;
              for (int i = 0; i < n; i++) {
                  long key = (long) mhFind(root, i) * 100001L + target[i];
                  Integer c = count.get(key);
                  if (c != null && c > 0) count.put(key, c - 1);
                  else dist++;
              }
              return dist;
          }

          static int mhFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        cpp: code`
          static int mhFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int minimumHammingDistance(vector<int>& source, vector<int>& target, vector<vector<int>>& allowedSwaps) {
              int n = source.size();
              vector<int> root(n);
              for (int i = 0; i < n; i++) root[i] = i;
              for (auto& s : allowedSwaps) {
                  int ra = mhFind(root, s[0]), rb = mhFind(root, s[1]);
                  if (ra != rb) root[ra] = rb;
              }
              unordered_map<long long, int> count;
              for (int i = 0; i < n; i++) count[(long long)mhFind(root, i) * 100001LL + source[i]]++;
              int dist = 0;
              for (int i = 0; i < n; i++) {
                  long long key = (long long)mhFind(root, i) * 100001LL + target[i];
                  auto it = count.find(key);
                  if (it != count.end() && it->second > 0) it->second--;
                  else dist++;
              }
              return dist;
          }
        `,
        c: code`
          static int mhFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int mhCmp(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return (x > y) - (x < y);
          }

          int minimumHammingDistance(int* source, int sourceSize, int* target, int targetSize, int** allowedSwaps, int allowedSwapsSize, int* allowedSwapsColSize) {
              int n = sourceSize;
              int* root = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) root[i] = i;
              for (int s = 0; s < allowedSwapsSize; s++) {
                  int ra = mhFind(root, allowedSwaps[s][0]), rb = mhFind(root, allowedSwaps[s][1]);
                  if (ra != rb) root[ra] = rb;
              }
              /* Sort (component, value) keys of both arrays and count the multiset overlap. */
              long long* ks = (long long*)malloc((n + 1) * sizeof(long long));
              long long* kt = (long long*)malloc((n + 1) * sizeof(long long));
              for (int i = 0; i < n; i++) {
                  long long r = mhFind(root, i);
                  ks[i] = r * 100001LL + source[i];
                  kt[i] = r * 100001LL + target[i];
              }
              qsort(ks, n, sizeof(long long), mhCmp);
              qsort(kt, n, sizeof(long long), mhCmp);
              int i = 0, j = 0, matched = 0;
              while (i < n && j < n) {
                  if (ks[i] == kt[j]) { matched++; i++; j++; }
                  else if (ks[i] < kt[j]) i++;
                  else j++;
              }
              free(root);
              free(ks);
              free(kt);
              return n - matched;
          }
        `,
        csharp: code`
          public static int MinimumHammingDistance(int[] source, int[] target, int[][] allowedSwaps)
          {
              int n = source.Length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              foreach (var s in allowedSwaps)
              {
                  int ra = MhFind(root, s[0]), rb = MhFind(root, s[1]);
                  if (ra != rb) root[ra] = rb;
              }
              var count = new Dictionary<long, int>();
              for (int i = 0; i < n; i++)
              {
                  long key = (long)MhFind(root, i) * 100001L + source[i];
                  int cur;
                  count.TryGetValue(key, out cur);
                  count[key] = cur + 1;
              }
              int dist = 0;
              for (int i = 0; i < n; i++)
              {
                  long key = (long)MhFind(root, i) * 100001L + target[i];
                  int cur;
                  if (count.TryGetValue(key, out cur) && cur > 0) count[key] = cur - 1;
                  else dist++;
              }
              return dist;
          }

          static int MhFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        go: code`
          func mhFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func minimumHammingDistance(source []int, target []int, allowedSwaps [][]int) int {
          	n := len(source)
          	root := make([]int, n)
          	for i := range root {
          		root[i] = i
          	}
          	for _, s := range allowedSwaps {
          		ra, rb := mhFind(root, s[0]), mhFind(root, s[1])
          		if ra != rb {
          			root[ra] = rb
          		}
          	}
          	count := map[int]int{}
          	for i := 0; i < n; i++ {
          		count[mhFind(root, i)*100001+source[i]]++
          	}
          	dist := 0
          	for i := 0; i < n; i++ {
          		key := mhFind(root, i)*100001 + target[i]
          		if count[key] > 0 {
          			count[key]--
          		} else {
          			dist++
          		}
          	}
          	return dist
          }
        `,
        kotlin: code`
          fun mhFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun minimumHammingDistance(source: IntArray, target: IntArray, allowedSwaps: Array<IntArray>): Int {
              val n = source.size
              val root = IntArray(n) { it }
              for (s in allowedSwaps) {
                  val ra = mhFind(root, s[0])
                  val rb = mhFind(root, s[1])
                  if (ra != rb) root[ra] = rb
              }
              val count = HashMap<Long, Int>()
              for (i in 0 until n) {
                  val key = mhFind(root, i).toLong() * 100001L + source[i]
                  count[key] = (count[key] ?: 0) + 1
              }
              var dist = 0
              for (i in 0 until n) {
                  val key = mhFind(root, i).toLong() * 100001L + target[i]
                  val c = count[key] ?: 0
                  if (c > 0) count[key] = c - 1 else dist++
              }
              return dist
          }
        `,
        swift: code`
          func mhFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func minimumHammingDistance(_ source: [Int], _ target: [Int], _ allowedSwaps: [[Int]]) -> Int {
              let n = source.count
              var root = Array(0..<n)
              for s in allowedSwaps {
                  let ra = mhFind(&root, s[0])
                  let rb = mhFind(&root, s[1])
                  if ra != rb { root[ra] = rb }
              }
              var count = [Int: Int]()
              for i in 0..<n {
                  let key = mhFind(&root, i) * 100001 + source[i]
                  count[key, default: 0] += 1
              }
              var dist = 0
              for i in 0..<n {
                  let key = mhFind(&root, i) * 100001 + target[i]
                  if let c = count[key], c > 0 { count[key] = c - 1 } else { dist += 1 }
              }
              return dist
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn mh_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn minimumHammingDistance(source: Vec<i32>, target: Vec<i32>, allowedSwaps: Vec<Vec<i32>>) -> i32 {
              let n = source.len();
              let mut root: Vec<usize> = (0..n).collect();
              for s in allowedSwaps.iter() {
                  let ra = mh_find(&mut root, s[0] as usize);
                  let rb = mh_find(&mut root, s[1] as usize);
                  if ra != rb {
                      root[ra] = rb;
                  }
              }
              let mut count: HashMap<i64, i32> = HashMap::new();
              for i in 0..n {
                  let key = mh_find(&mut root, i) as i64 * 100001 + source[i] as i64;
                  *count.entry(key).or_insert(0) += 1;
              }
              let mut dist = 0;
              for i in 0..n {
                  let key = mh_find(&mut root, i) as i64 * 100001 + target[i] as i64;
                  let c = count.entry(key).or_insert(0);
                  if *c > 0 {
                      *c -= 1;
                  } else {
                      dist += 1;
                  }
              }
              dist
          }
        `,
        php: code`
          function minimumHammingDistance($source, $target, $allowedSwaps) {
              $n = count($source);
              $root = range(0, $n - 1);
              foreach ($allowedSwaps as $s) {
                  $ra = mhFind($root, $s[0]);
                  $rb = mhFind($root, $s[1]);
                  if ($ra != $rb) $root[$ra] = $rb;
              }
              $cnt = [];
              for ($i = 0; $i < $n; $i++) {
                  $key = mhFind($root, $i) * 100001 + $source[$i];
                  $cnt[$key] = (isset($cnt[$key]) ? $cnt[$key] : 0) + 1;
              }
              $dist = 0;
              for ($i = 0; $i < $n; $i++) {
                  $key = mhFind($root, $i) * 100001 + $target[$i];
                  if (isset($cnt[$key]) && $cnt[$key] > 0) $cnt[$key]--;
                  else $dist++;
              }
              return $dist;
          }

          function mhFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def minimumHammingDistance(source, target, allowedSwaps)
            n = source.length
            root = (0...n).to_a
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            allowedSwaps.each do |a, b|
              ra = find.call(a)
              rb = find.call(b)
              root[ra] = rb if ra != rb
            end
            count = Hash.new(0)
            n.times { |i| count[find.call(i) * 100001 + source[i]] += 1 }
            dist = 0
            n.times do |i|
              key = find.call(i) * 100001 + target[i]
              if count[key] > 0
                count[key] -= 1
              else
                dist += 1
              end
            end
            dist
          end
        `,
      },
    };
  })(),

  // ── Largest Color Value in a Directed Graph (LC 1857) ───────────
  (() => {
    const ref = (colors: string, edges: number[][]) => {
      const n = colors.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) adj[a].push(b);
      const state = new Array(n).fill(0);
      let cyclic = false;
      const visit = (u: number) => {
        state[u] = 1;
        for (const v of adj[u]) {
          if (state[v] === 1) cyclic = true;
          else if (state[v] === 0) visit(v);
        }
        state[u] = 2;
      };
      for (let i = 0; i < n; i++) if (state[i] === 0) visit(i);
      if (cyclic) return -1;
      let best = 0;
      for (let c = 0; c < 26; c++) {
        const ch = String.fromCharCode(97 + c);
        const memo = new Array(n).fill(-1);
        const most = (u: number): number => {
          if (memo[u] >= 0) return memo[u];
          let sub = 0;
          for (const v of adj[u]) sub = Math.max(sub, most(v));
          return (memo[u] = sub + (colors[u] === ch ? 1 : 0));
        };
        for (let i = 0; i < n; i++) best = Math.max(best, most(i));
      }
      return best;
    };
    return {
      slug: "largest-color-value-in-a-directed-graph",
      title: "Largest Color Value in a Directed Graph",
      difficulty: "HARD" as const,
      tags: ["Graph", "Topological Sort", "Dynamic Programming", "Memoization", "Google", "Amazon"],
      signature: {
        funcName: "largestPathValue",
        params: [{ name: "colors", type: "string" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A directed graph has `n` nodes numbered `0` to `n - 1`, where `n == colors.length`. Node `i` has the colour `colors[i]`, a lowercase letter. Each `edges[j] = [aj, bj]` is a directed edge from `aj` to `bj`.\n\nA **path** is a sequence of nodes `x1 → x2 → … → xk` in which every consecutive pair is joined by an edge in that direction. The **colour value** of a path is the number of nodes on it that carry its most frequent colour.\n\nReturn the largest colour value of any path in the graph, or `-1` if the graph contains a cycle.",
        [
          { in: "colors = \"xyxzx\", edges = [[0,1],[1,2],[0,2],[2,3],[2,4]]", out: "3", note: "The path 0 → 1 → 2 → 4 holds colour `x` three times." },
          { in: "colors = \"abc\", edges = [[0,1],[1,2],[2,1]]", out: "-1", note: "Nodes 1 and 2 form a cycle." },
          { in: "colors = \"a\", edges = []", out: "1" },
        ],
        ["n == colors.length", "1 <= n <= 10^5", "0 <= edges.length <= 10^5", "colors consists of lowercase English letters", "0 <= aj, bj < n"]),
      hints: [
        "If there is a cycle, the answer is -1 — a topological sort detects that for free.",
        "For a DAG, think of a DP indexed by node and colour: the most nodes of colour c on any path ending at this node.",
        "Process nodes in topological order (Kahn's algorithm), pushing each node's 26 counts forward along its out-edges and adding 1 for its own colour.",
      ],
      editorial: explain({
        idea: "Run Kahn's topological sort while carrying, for every node, the best count of each of the 26 colours over all paths that end there.",
        steps: [
          "Build adjacency lists and in-degrees; start a queue with every node of in-degree 0.",
          "Pop a node `u`, add 1 to `dp[u][colour(u)]`, and update the answer with the largest entry of `dp[u]`.",
          "For each edge `u → v`, set `dp[v][c] = max(dp[v][c], dp[u][c])` for every colour, decrement `v`'s in-degree, and enqueue it when it reaches 0.",
          "If fewer than `n` nodes were popped, a cycle blocked the sort: return -1. Otherwise return the answer.",
        ],
        why: "A node is popped only after all its predecessors, so by then `dp[v][c]` already holds the maximum count of colour `c` over every path that reaches `v` from a predecessor; adding `v`'s own colour completes the value for paths ending at `v`. Every path ends somewhere, so the maximum over all nodes and colours is the answer. Nodes on (or downstream of) a cycle never reach in-degree 0, which is exactly how the cycle is detected.",
        time: "O(26 · (n + m))",
        space: "O(26 · n + m)",
        pitfalls: [
          "A self-loop `[i, i]` is a cycle too; Kahn's algorithm handles it because the node's in-degree never drops to 0.",
          "Recursive DFS on 10^5 nodes can overflow the stack in some languages — the queue-based version avoids that.",
          "Increment a node's own colour exactly once, when it is popped, not when it is pushed or relaxed.",
        ],
      }),
      examples: [
        { input: "\"xyxzx\"\n[[0,1],[1,2],[0,2],[2,3],[2,4]]", expectedOutput: "3" },
        { input: "\"abc\"\n[[0,1],[1,2],[2,1]]", expectedOutput: "-1" },
        { input: "\"a\"\n[]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 4, 6, 8, 10, 12, 15, 15]);
        const alphabet = pick(rng, ["ab", "ab", "abc", "abcd", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const colors = randLower(rng, n, n, alphabet);
        const edges: number[][] = [];
        const has = new Set<string>();
        const m = ri(rng, 0, Math.min(n * (n - 1) / 2, pick(rng, [n, 2 * n, 3 * n])));
        if (rng() < 0.6) {
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          for (let t = 0; t < m * 4 && edges.length < m; t++) {
            const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
            if (i >= j || has.has(i + "," + j)) continue;
            has.add(i + "," + j);
            edges.push([order[i], order[j]]);
          }
        } else {
          for (let t = 0; t < m * 4 && edges.length < m; t++) {
            const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
            if ((a === b && rng() < 0.9) || has.has(a + "," + b)) continue;
            has.add(a + "," + b);
            edges.push([a, b]);
          }
        }
        shuffle(rng, edges);
        return { input: `"${colors}"\n${fmtIntMat(edges)}`, expectedOutput: String(ref(colors, edges)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def largestPathValue(colors: str, edges: List[List[int]]) -> int:
              n = len(colors)
              adj = [[] for _ in range(n)]
              indeg = [0] * n
              for a, b in edges:
                  adj[a].append(b)
                  indeg[b] += 1
              col = [ord(ch) - 97 for ch in colors]
              dp = [[0] * 26 for _ in range(n)]
              q = deque(i for i in range(n) if indeg[i] == 0)
              seen = 0
              best = 0
              while q:
                  u = q.popleft()
                  seen += 1
                  du = dp[u]
                  du[col[u]] += 1
                  top = max(du)
                  if top > best:
                      best = top
                  for v in adj[u]:
                      dv = dp[v]
                      for c in range(26):
                          if du[c] > dv[c]:
                              dv[c] = du[c]
                      indeg[v] -= 1
                      if indeg[v] == 0:
                          q.append(v)
              return best if seen == n else -1
        `,
        javascript: code`
          var largestPathValue = function(colors, edges) {
              var n = colors.length;
              var adj = [], indeg = [], dp = [];
              for (var i = 0; i < n; i++) {
                  adj.push([]);
                  indeg.push(0);
                  var row = [];
                  for (var c = 0; c < 26; c++) row.push(0);
                  dp.push(row);
              }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  indeg[edges[e][1]]++;
              }
              var queue = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              var best = 0;
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  dp[u][colors.charCodeAt(u) - 97]++;
                  for (var k = 0; k < 26; k++) if (dp[u][k] > best) best = dp[u][k];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      for (var t = 0; t < 26; t++) if (dp[u][t] > dp[v][t]) dp[v][t] = dp[u][t];
                      if (--indeg[v] === 0) queue.push(v);
                  }
              }
              return queue.length === n ? best : -1;
          };
        `,
        typescript: code`
          function largestPathValue(colors: string, edges: number[][]): number {
              var n = colors.length;
              var adj: number[][] = [], indeg: number[] = [], dp: number[][] = [];
              for (var i = 0; i < n; i++) {
                  adj.push([]);
                  indeg.push(0);
                  var row: number[] = [];
                  for (var c = 0; c < 26; c++) row.push(0);
                  dp.push(row);
              }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  indeg[edges[e][1]]++;
              }
              var queue: number[] = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              var best = 0;
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  dp[u][colors.charCodeAt(u) - 97]++;
                  for (var k = 0; k < 26; k++) if (dp[u][k] > best) best = dp[u][k];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      for (var t = 0; t < 26; t++) if (dp[u][t] > dp[v][t]) dp[v][t] = dp[u][t];
                      if (--indeg[v] === 0) queue.push(v);
                  }
              }
              return queue.length === n ? best : -1;
          }
        `,
        java: code`
          public static int largestPathValue(String colors, int[][] edges) {
              int n = colors.length();
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              int[] indeg = new int[n];
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); indeg[e[1]]++; }
              int[][] dp = new int[n][26];
              int[] queue = new int[n];
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              int best = 0;
              while (head < tail) {
                  int u = queue[head++];
                  dp[u][colors.charAt(u) - 'a']++;
                  for (int c = 0; c < 26; c++) best = Math.max(best, dp[u][c]);
                  for (int v : adj.get(u)) {
                      for (int c = 0; c < 26; c++) if (dp[u][c] > dp[v][c]) dp[v][c] = dp[u][c];
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              return tail == n ? best : -1;
          }
        `,
        cpp: code`
          int largestPathValue(string colors, vector<vector<int>>& edges) {
              int n = colors.size();
              vector<vector<int>> adj(n);
              vector<int> indeg(n, 0);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); indeg[e[1]]++; }
              vector<array<int, 26>> dp(n);
              for (auto& row : dp) row.fill(0);
              vector<int> queue;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
              int best = 0;
              for (size_t h = 0; h < queue.size(); h++) {
                  int u = queue[h];
                  dp[u][colors[u] - 'a']++;
                  for (int c = 0; c < 26; c++) best = max(best, dp[u][c]);
                  for (int v : adj[u]) {
                      for (int c = 0; c < 26; c++) if (dp[u][c] > dp[v][c]) dp[v][c] = dp[u][c];
                      if (--indeg[v] == 0) queue.push_back(v);
                  }
              }
              return (int)queue.size() == n ? best : -1;
          }
        `,
        c: code`
          int largestPathValue(const char* colors, int** edges, int edgesSize, int* edgesColSize) {
              int n = (int)strlen(colors);
              int* indeg = (int*)calloc(n + 1, sizeof(int));
              int* start = (int*)calloc(n + 2, sizeof(int));
              int* adj = (int*)malloc((edgesSize + 1) * sizeof(int));
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) { start[edges[e][0] + 1]++; indeg[edges[e][1]]++; }
              for (int i = 0; i < n; i++) start[i + 1] += start[i];
              for (int i = 0; i < n; i++) fill[i] = start[i];
              for (int e = 0; e < edgesSize; e++) adj[fill[edges[e][0]]++] = edges[e][1];
              int* dp = (int*)calloc((size_t)n * 26 + 1, sizeof(int));
              int* queue = (int*)malloc((n + 1) * sizeof(int));
              int head = 0, tail = 0, best = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              while (head < tail) {
                  int u = queue[head++];
                  dp[u * 26 + (colors[u] - 'a')]++;
                  for (int c = 0; c < 26; c++) if (dp[u * 26 + c] > best) best = dp[u * 26 + c];
                  for (int k = start[u]; k < start[u + 1]; k++) {
                      int v = adj[k];
                      for (int c = 0; c < 26; c++) if (dp[u * 26 + c] > dp[v * 26 + c]) dp[v * 26 + c] = dp[u * 26 + c];
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              int res = tail == n ? best : -1;
              free(indeg);
              free(start);
              free(adj);
              free(fill);
              free(dp);
              free(queue);
              return res;
          }
        `,
        csharp: code`
          public static int LargestPathValue(string colors, int[][] edges)
          {
              int n = colors.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              int[] indeg = new int[n];
              foreach (var e in edges) { adj[e[0]].Add(e[1]); indeg[e[1]]++; }
              int[,] dp = new int[n, 26];
              int[] queue = new int[n];
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              int best = 0;
              while (head < tail)
              {
                  int u = queue[head++];
                  dp[u, colors[u] - 'a']++;
                  for (int c = 0; c < 26; c++) best = Math.Max(best, dp[u, c]);
                  foreach (int v in adj[u])
                  {
                      for (int c = 0; c < 26; c++) if (dp[u, c] > dp[v, c]) dp[v, c] = dp[u, c];
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              return tail == n ? best : -1;
          }
        `,
        go: code`
          func largestPathValue(colors string, edges [][]int) int {
          	n := len(colors)
          	adj := make([][]int, n)
          	indeg := make([]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		indeg[e[1]]++
          	}
          	dp := make([][26]int, n)
          	queue := []int{}
          	for i := 0; i < n; i++ {
          		if indeg[i] == 0 {
          			queue = append(queue, i)
          		}
          	}
          	best := 0
          	for h := 0; h < len(queue); h++ {
          		u := queue[h]
          		dp[u][colors[u]-'a']++
          		for c := 0; c < 26; c++ {
          			if dp[u][c] > best {
          				best = dp[u][c]
          			}
          		}
          		for _, v := range adj[u] {
          			for c := 0; c < 26; c++ {
          				if dp[u][c] > dp[v][c] {
          					dp[v][c] = dp[u][c]
          				}
          			}
          			indeg[v]--
          			if indeg[v] == 0 {
          				queue = append(queue, v)
          			}
          		}
          	}
          	if len(queue) < n {
          		return -1
          	}
          	return best
          }
        `,
        kotlin: code`
          fun largestPathValue(colors: String, edges: Array<IntArray>): Int {
              val n = colors.length
              val adj = Array(n) { ArrayList<Int>() }
              val indeg = IntArray(n)
              for (e in edges) { adj[e[0]].add(e[1]); indeg[e[1]]++ }
              val dp = Array(n) { IntArray(26) }
              val queue = IntArray(n)
              var head = 0
              var tail = 0
              for (i in 0 until n) if (indeg[i] == 0) queue[tail++] = i
              var best = 0
              while (head < tail) {
                  val u = queue[head++]
                  dp[u][colors[u] - 'a']++
                  for (c in 0 until 26) if (dp[u][c] > best) best = dp[u][c]
                  for (v in adj[u]) {
                      for (c in 0 until 26) if (dp[u][c] > dp[v][c]) dp[v][c] = dp[u][c]
                      indeg[v]--
                      if (indeg[v] == 0) queue[tail++] = v
                  }
              }
              return if (tail == n) best else -1
          }
        `,
        swift: code`
          func largestPathValue(_ colors: String, _ edges: [[Int]]) -> Int {
              let col = colors.utf8.map { Int($0) - 97 }
              let n = col.count
              var adj = [[Int]](repeating: [], count: n)
              var indeg = [Int](repeating: 0, count: n)
              for e in edges { adj[e[0]].append(e[1]); indeg[e[1]] += 1 }
              var dp = [[Int]](repeating: [Int](repeating: 0, count: 26), count: n)
              var queue = [Int]()
              for i in 0..<n where indeg[i] == 0 { queue.append(i) }
              var best = 0
              var h = 0
              while h < queue.count {
                  let u = queue[h]
                  h += 1
                  dp[u][col[u]] += 1
                  let du = dp[u]
                  for c in 0..<26 where du[c] > best { best = du[c] }
                  for v in adj[u] {
                      for c in 0..<26 where du[c] > dp[v][c] { dp[v][c] = du[c] }
                      indeg[v] -= 1
                      if indeg[v] == 0 { queue.append(v) }
                  }
              }
              return queue.count == n ? best : -1
          }
        `,
        rust: code`
          fn largestPathValue(colors: String, edges: Vec<Vec<i32>>) -> i32 {
              let col: Vec<usize> = colors.bytes().map(|b| (b - b'a') as usize).collect();
              let n = col.len();
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              let mut indeg = vec![0usize; n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  indeg[e[1] as usize] += 1;
              }
              let mut dp = vec![[0i32; 26]; n];
              let mut queue: Vec<usize> = Vec::new();
              for i in 0..n {
                  if indeg[i] == 0 {
                      queue.push(i);
                  }
              }
              let mut best = 0;
              let mut h = 0;
              while h < queue.len() {
                  let u = queue[h];
                  h += 1;
                  dp[u][col[u]] += 1;
                  let du = dp[u];
                  for c in 0..26 {
                      if du[c] > best {
                          best = du[c];
                      }
                  }
                  for &v in adj[u].iter() {
                      for c in 0..26 {
                          if du[c] > dp[v][c] {
                              dp[v][c] = du[c];
                          }
                      }
                      indeg[v] -= 1;
                      if indeg[v] == 0 {
                          queue.push(v);
                      }
                  }
              }
              if queue.len() == n { best } else { -1 }
          }
        `,
        php: code`
          function largestPathValue($colors, $edges) {
              $n = strlen($colors);
              $adj = array_fill(0, $n, []);
              $indeg = array_fill(0, $n, 0);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $indeg[$e[1]]++; }
              $dp = array_fill(0, $n, array_fill(0, 26, 0));
              $queue = [];
              for ($i = 0; $i < $n; $i++) if ($indeg[$i] == 0) $queue[] = $i;
              $best = 0;
              for ($h = 0; $h < count($queue); $h++) {
                  $u = $queue[$h];
                  $dp[$u][ord($colors[$u]) - 97]++;
                  $du = $dp[$u];
                  for ($c = 0; $c < 26; $c++) if ($du[$c] > $best) $best = $du[$c];
                  foreach ($adj[$u] as $v) {
                      for ($c = 0; $c < 26; $c++) if ($du[$c] > $dp[$v][$c]) $dp[$v][$c] = $du[$c];
                      $indeg[$v]--;
                      if ($indeg[$v] == 0) $queue[] = $v;
                  }
              }
              return count($queue) == $n ? $best : -1;
          }
        `,
        ruby: code`
          def largestPathValue(colors, edges)
            n = colors.length
            adj = Array.new(n) { [] }
            indeg = Array.new(n, 0)
            edges.each do |a, b|
              adj[a] << b
              indeg[b] += 1
            end
            col = colors.bytes.map { |b| b - 97 }
            dp = Array.new(n) { Array.new(26, 0) }
            queue = (0...n).select { |i| indeg[i] == 0 }
            best = 0
            h = 0
            while h < queue.length
              u = queue[h]
              h += 1
              du = dp[u]
              du[col[u]] += 1
              top = du.max
              best = top if top > best
              adj[u].each do |v|
                dv = dp[v]
                26.times { |c| dv[c] = du[c] if du[c] > dv[c] }
                indeg[v] -= 1
                queue << v if indeg[v] == 0
              end
            end
            queue.length == n ? best : -1
          end
        `,
      },
    };
  })(),

  // ── Nearest Exit from Entrance in Maze (LC 1926) ────────────────
  (() => {
    const ref = (maze: string[], entrance: number[]) => {
      const m = maze.length, n = maze[0].length;
      const dist = Array.from({ length: m }, () => new Array(n).fill(-1));
      dist[entrance[0]][entrance[1]] = 0;
      const q = [entrance];
      let best = -1;
      for (let h = 0; h < q.length; h++) {
        const [r, c] = q[h];
        const onBorder = r === 0 || c === 0 || r === m - 1 || c === n - 1;
        if (onBorder && dist[r][c] > 0 && (best === -1 || dist[r][c] < best)) best = dist[r][c];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= m || nc >= n || maze[nr][nc] !== "." || dist[nr][nc] !== -1) continue;
          dist[nr][nc] = dist[r][c] + 1;
          q.push([nr, nc]);
        }
      }
      return best;
    };
    return {
      slug: "nearest-exit-from-entrance-in-maze",
      title: "Nearest Exit from Entrance in Maze",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Breadth-First Search", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "nearestExit",
        params: [{ name: "maze", type: "string[]" as const }, { name: "entrance", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A maze of `m` rows and `n` columns is given as `maze`, one string per row: `'.'` is an open cell and `'+'` is a wall. You stand at the open cell `entrance = [row, col]`.\n\nEach step moves you one cell up, down, left or right; you cannot enter a wall or leave the grid. An **exit** is any open cell on the outer border of the maze — **except** the entrance itself.\n\nReturn the number of steps on the shortest route from the entrance to the nearest exit, or `-1` if no exit can be reached.",
        [
          { in: "maze = [\"+++++\",\"+...+\",\"+.+.+\",\"+...+\",\"++.++\"], entrance = [1,1]", out: "4", note: "The only exit is (4,2), reached via (2,1), (3,1) and (3,2)." },
          { in: "maze = [\"+.+\",\"...\",\"+.+\"], entrance = [1,0]", out: "2", note: "The entrance lies on the border but does not count; (0,1), (2,1) and (1,2) are each two steps away." },
          { in: "maze = [\".+.\"], entrance = [0,0]", out: "-1" },
        ],
        ["maze.length == m", "maze[i].length == n", "1 <= m, n <= 100", "maze[i][j] is '.' or '+'", "entrance.length == 2", "0 <= entrance[0] < m", "0 <= entrance[1] < n", "entrance is an open cell"]),
      hints: [
        "Every step costs the same, so the shortest route is found by breadth-first search.",
        "Start the BFS at the entrance and mark it visited so it is never mistaken for an exit.",
        "The first open border cell the BFS discovers is the nearest exit — return its distance immediately.",
      ],
      editorial: explain({
        idea: "Breadth-first search from the entrance explores cells in order of distance, so the first border cell it reaches is the nearest exit.",
        steps: [
          "Mark the entrance visited and push it with distance 0.",
          "Pop a cell; for each of its four neighbours that is inside the grid, open and unvisited:",
          "if the neighbour lies on the border, return the current distance + 1; otherwise mark it and push it with distance + 1.",
          "If the queue runs dry, return -1.",
        ],
        why: "BFS dequeues cells in non-decreasing distance order, and each neighbour is discovered at distance (parent + 1), which is its true shortest distance. Checking the exit condition at discovery time therefore returns the minimum over all exits. The entrance is visited from the start, so it can never be reported as an exit even when it sits on the border.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "An entrance on the border is not an exit — a check made when popping the start would wrongly return 0.",
          "Mark cells visited when they are pushed, not when popped, or the queue can hold the same cell many times.",
          "A 1 × 1 maze has no exit at all.",
        ],
      }),
      examples: [
        { input: "[\"+++++\",\"+...+\",\"+.+.+\",\"+...+\",\"++.++\"]\n[1,1]", expectedOutput: "4" },
        { input: "[\"+.+\",\"...\",\"+.+\"]\n[1,0]", expectedOutput: "2" },
        { input: "[\".+.\"]\n[0,0]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.15;
        const m = small ? ri(rng, 1, 3) : ri(rng, 4, 12), n = small ? ri(rng, 1, 3) : ri(rng, 4, 12);
        const wall = pick(rng, [0, 0.15, 0.3, 0.45]);
        const cells = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < wall ? "+" : ".")));
        if (m >= 3 && n >= 3 && rng() < 0.6) {
          // Walled-in maze with a few gates: exits are scarce and far away.
          const border: number[][] = [];
          for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (r === 0 || c === 0 || r === m - 1 || c === n - 1) border.push([r, c]);
          for (const [r, c] of border) cells[r][c] = "+";
          for (let k = ri(rng, 0, 3); k > 0; k--) { const [r, c] = pick(rng, border); cells[r][c] = "."; }
        }
        const interior = m >= 3 && n >= 3 && rng() < 0.8;
        const entrance = interior ? [ri(rng, 1, m - 2), ri(rng, 1, n - 2)] : [ri(rng, 0, m - 1), ri(rng, 0, n - 1)];
        cells[entrance[0]][entrance[1]] = ".";
        const maze = cells.map((row) => row.join(""));
        return { input: `${fmtStrArr(maze)}\n${fmtIntArr(entrance)}`, expectedOutput: String(ref(maze, entrance)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def nearestExit(maze: List[str], entrance: List[int]) -> int:
              m, n = len(maze), len(maze[0])
              seen = [[False] * n for _ in range(m)]
              sr, sc = entrance
              seen[sr][sc] = True
              q = deque([(sr, sc, 0)])
              while q:
                  r, c, d = q.popleft()
                  for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                      nr, nc = r + dr, c + dc
                      if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc] and maze[nr][nc] == '.':
                          if nr == 0 or nr == m - 1 or nc == 0 or nc == n - 1:
                              return d + 1
                          seen[nr][nc] = True
                          q.append((nr, nc, d + 1))
              return -1
        `,
        javascript: code`
          var nearestExit = function(maze, entrance) {
              var m = maze.length, n = maze[0].length;
              var dist = [];
              for (var i = 0; i < m * n; i++) dist.push(-1);
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              var queue = [start];
              for (var h = 0; h < queue.length; h++) {
                  var r = Math.floor(queue[h] / n), c = queue[h] % n;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] !== '.') continue;
                      var id = nr * n + nc;
                      if (dist[id] !== -1) continue;
                      dist[id] = dist[queue[h]] + 1;
                      if (nr === 0 || nr === m - 1 || nc === 0 || nc === n - 1) return dist[id];
                      queue.push(id);
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function nearestExit(maze: string[], entrance: number[]): number {
              var m = maze.length, n = maze[0].length;
              var dist: number[] = [];
              for (var i = 0; i < m * n; i++) dist.push(-1);
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              var queue: number[] = [start];
              for (var h = 0; h < queue.length; h++) {
                  var r = Math.floor(queue[h] / n), c = queue[h] % n;
                  for (var d = 0; d < 4; d++) {
                      var nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr].charAt(nc) !== '.') continue;
                      var id = nr * n + nc;
                      if (dist[id] !== -1) continue;
                      dist[id] = dist[queue[h]] + 1;
                      if (nr === 0 || nr === m - 1 || nc === 0 || nc === n - 1) return dist[id];
                      queue.push(id);
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int nearestExit(String[] maze, int[] entrance) {
              int m = maze.length, n = maze[0].length();
              int[] dist = new int[m * n];
              Arrays.fill(dist, -1);
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              int[] queue = new int[m * n];
              int head = 0, tail = 0;
              int start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              queue[tail++] = start;
              while (head < tail) {
                  int cur = queue[head++];
                  int r = cur / n, c = cur % n;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr].charAt(nc) != '.') continue;
                      int id = nr * n + nc;
                      if (dist[id] != -1) continue;
                      dist[id] = dist[cur] + 1;
                      if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return dist[id];
                      queue[tail++] = id;
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int nearestExit(vector<string>& maze, vector<int>& entrance) {
              int m = maze.size(), n = maze[0].size();
              vector<int> dist(m * n, -1);
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              vector<int> queue;
              queue.push_back(start);
              for (size_t h = 0; h < queue.size(); h++) {
                  int cur = queue[h];
                  int r = cur / n, c = cur % n;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.') continue;
                      int id = nr * n + nc;
                      if (dist[id] != -1) continue;
                      dist[id] = dist[cur] + 1;
                      if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return dist[id];
                      queue.push_back(id);
                  }
              }
              return -1;
          }
        `,
        c: code`
          int nearestExit(char** maze, int mazeSize, int* entrance, int entranceSize) {
              int m = mazeSize, n = (int)strlen(maze[0]);
              int* dist = (int*)malloc(m * n * sizeof(int));
              int* queue = (int*)malloc(m * n * sizeof(int));
              for (int i = 0; i < m * n; i++) dist[i] = -1;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int head = 0, tail = 0, ans = -1;
              int start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              queue[tail++] = start;
              while (head < tail && ans == -1) {
                  int cur = queue[head++];
                  int r = cur / n, c = cur % n;
                  for (int d = 0; d < 4; d++) {
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.') continue;
                      int id = nr * n + nc;
                      if (dist[id] != -1) continue;
                      dist[id] = dist[cur] + 1;
                      if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) { ans = dist[id]; break; }
                      queue[tail++] = id;
                  }
              }
              free(dist);
              free(queue);
              return ans;
          }
        `,
        csharp: code`
          public static int NearestExit(string[] maze, int[] entrance)
          {
              int m = maze.Length, n = maze[0].Length;
              int[] dist = new int[m * n];
              for (int i = 0; i < m * n; i++) dist[i] = -1;
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              int[] queue = new int[m * n];
              int head = 0, tail = 0;
              int start = entrance[0] * n + entrance[1];
              dist[start] = 0;
              queue[tail++] = start;
              while (head < tail)
              {
                  int cur = queue[head++];
                  int r = cur / n, c = cur % n;
                  for (int d = 0; d < 4; d++)
                  {
                      int nr = r + dr[d], nc = c + dc[d];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.') continue;
                      int id = nr * n + nc;
                      if (dist[id] != -1) continue;
                      dist[id] = dist[cur] + 1;
                      if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return dist[id];
                      queue[tail++] = id;
                  }
              }
              return -1;
          }
        `,
        go: code`
          func nearestExit(maze []string, entrance []int) int {
          	m, n := len(maze), len(maze[0])
          	dist := make([]int, m*n)
          	for i := range dist {
          		dist[i] = -1
          	}
          	dr := []int{1, -1, 0, 0}
          	dc := []int{0, 0, 1, -1}
          	start := entrance[0]*n + entrance[1]
          	dist[start] = 0
          	queue := []int{start}
          	for h := 0; h < len(queue); h++ {
          		cur := queue[h]
          		r, c := cur/n, cur%n
          		for d := 0; d < 4; d++ {
          			nr, nc := r+dr[d], c+dc[d]
          			if nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.' {
          				continue
          			}
          			id := nr*n + nc
          			if dist[id] != -1 {
          				continue
          			}
          			dist[id] = dist[cur] + 1
          			if nr == 0 || nr == m-1 || nc == 0 || nc == n-1 {
          				return dist[id]
          			}
          			queue = append(queue, id)
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun nearestExit(maze: Array<String>, entrance: IntArray): Int {
              val m = maze.size
              val n = maze[0].length
              val dist = IntArray(m * n) { -1 }
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              val queue = IntArray(m * n)
              var head = 0
              var tail = 0
              val start = entrance[0] * n + entrance[1]
              dist[start] = 0
              queue[tail++] = start
              while (head < tail) {
                  val cur = queue[head++]
                  val r = cur / n
                  val c = cur % n
                  for (d in 0 until 4) {
                      val nr = r + dr[d]
                      val nc = c + dc[d]
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.') continue
                      val id = nr * n + nc
                      if (dist[id] != -1) continue
                      dist[id] = dist[cur] + 1
                      if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return dist[id]
                      queue[tail++] = id
                  }
              }
              return -1
          }
        `,
        swift: code`
          func nearestExit(_ maze: [String], _ entrance: [Int]) -> Int {
              let grid = maze.map { Array($0.utf8) }
              let m = grid.count, n = grid[0].count
              let dot = UInt8(ascii: ".")
              var dist = [Int](repeating: -1, count: m * n)
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              let start = entrance[0] * n + entrance[1]
              dist[start] = 0
              var queue = [start]
              var h = 0
              while h < queue.count {
                  let cur = queue[h]
                  h += 1
                  let r = cur / n, c = cur % n
                  for d in 0..<4 {
                      let nr = r + dr[d], nc = c + dc[d]
                      if nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != dot { continue }
                      let id = nr * n + nc
                      if dist[id] != -1 { continue }
                      dist[id] = dist[cur] + 1
                      if nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1 { return dist[id] }
                      queue.append(id)
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn nearestExit(maze: Vec<String>, entrance: Vec<i32>) -> i32 {
              let grid: Vec<Vec<u8>> = maze.iter().map(|s| s.as_bytes().to_vec()).collect();
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let mut dist = vec![-1i32; (m * n) as usize];
              let dr = [1i32, -1, 0, 0];
              let dc = [0i32, 0, 1, -1];
              let start = (entrance[0] * n + entrance[1]) as usize;
              dist[start] = 0;
              let mut queue: Vec<usize> = vec![start];
              let mut h = 0;
              while h < queue.len() {
                  let cur = queue[h];
                  h += 1;
                  let r = cur as i32 / n;
                  let c = cur as i32 % n;
                  for d in 0..4 {
                      let nr = r + dr[d];
                      let nc = c + dc[d];
                      if nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr as usize][nc as usize] != b'.' {
                          continue;
                      }
                      let id = (nr * n + nc) as usize;
                      if dist[id] != -1 {
                          continue;
                      }
                      dist[id] = dist[cur] + 1;
                      if nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1 {
                          return dist[id];
                      }
                      queue.push(id);
                  }
              }
              -1
          }
        `,
        php: code`
          function nearestExit($maze, $entrance) {
              $m = count($maze);
              $n = strlen($maze[0]);
              $dist = array_fill(0, $m * $n, -1);
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $start = $entrance[0] * $n + $entrance[1];
              $dist[$start] = 0;
              $queue = [$start];
              for ($h = 0; $h < count($queue); $h++) {
                  $cur = $queue[$h];
                  $r = intdiv($cur, $n);
                  $c = $cur % $n;
                  for ($d = 0; $d < 4; $d++) {
                      $nr = $r + $dr[$d];
                      $nc = $c + $dc[$d];
                      if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n || $maze[$nr][$nc] !== '.') continue;
                      $id = $nr * $n + $nc;
                      if ($dist[$id] != -1) continue;
                      $dist[$id] = $dist[$cur] + 1;
                      if ($nr == 0 || $nr == $m - 1 || $nc == 0 || $nc == $n - 1) return $dist[$id];
                      $queue[] = $id;
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def nearestExit(maze, entrance)
            m = maze.length
            n = maze[0].length
            dist = Array.new(m * n, -1)
            dr = [1, -1, 0, 0]
            dc = [0, 0, 1, -1]
            start = entrance[0] * n + entrance[1]
            dist[start] = 0
            queue = [start]
            h = 0
            while h < queue.length
              cur = queue[h]
              h += 1
              r = cur / n
              c = cur % n
              4.times do |d|
                nr = r + dr[d]
                nc = c + dc[d]
                next if nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] != '.'
                id = nr * n + nc
                next if dist[id] != -1
                dist[id] = dist[cur] + 1
                return dist[id] if nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1
                queue << id
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── The Time When the Network Becomes Idle (LC 2039) ────────────
  (() => {
    const ref = (edges: number[][], patience: number[]) => {
      const n = patience.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      const dist = new Array(n).fill(-1);
      dist[0] = 0;
      const q = [0];
      for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (dist[v] < 0) { dist[v] = dist[q[h]] + 1; q.push(v); }
      let idle = 0;
      for (let i = 1; i < n; i++) {
        const trip = 2 * dist[i];
        let lastSend = 0;
        for (let t = patience[i]; t < trip; t += patience[i]) lastSend = t; // resend while no reply yet
        idle = Math.max(idle, lastSend + trip);
      }
      return idle + 1;
    };
    return {
      slug: "the-time-when-the-network-becomes-idle",
      title: "The Time When the Network Becomes Idle",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Breadth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "networkBecomesIdle",
        params: [{ name: "edges", type: "int[][]" as const }, { name: "patience", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A network has `n` servers labelled `0` to `n - 1`, joined by the two-way links in `edges` (each `[ui, vi]`); every server can reach every other. Server `0` is the **master**; the rest are data servers. A message crosses one link per second, and every message always takes a shortest route.\n\nAt second `0`, each data server sends a message to the master. The master processes messages instantly and sends each reply straight back along a shortest route.\n\nData server `i` checks at the start of every second: if its reply has not arrived and `patience[i]` seconds have passed since it last sent, it **resends** the message. Once its reply arrives, it stops sending. The master never sends anything on its own.\n\nThe network is **idle** at the first second when no message or reply is travelling or arriving. Return that second.",
        [
          { in: "edges = [[0,1],[1,2],[1,3]], patience = [0,3,2,5]", out: "7", note: "Server 2 is two links away, so its reply takes 4 seconds; it resends at second 2, whose reply lands at second 6. Nothing travels at second 7." },
          { in: "edges = [[0,1],[0,2]], patience = [0,1,4]", out: "4" },
        ],
        ["n == patience.length", "2 <= n <= 10^5", "patience[0] == 0", "1 <= patience[i] <= 10^5 for i >= 1", "1 <= edges.length <= min(10^5, n * (n - 1) / 2)", "edges[i].length == 2", "0 <= ui, vi < n", "ui != vi", "no duplicate edges; every server can reach every other"]),
      hints: [
        "A server's first reply returns after `2 · d` seconds, where `d` is its BFS distance from the master.",
        "Messages sent before that moment are each answered `2 · d` seconds after they are sent. Which is the last message sent?",
        "The last resend happens at the largest multiple of `patience[i]` that is strictly less than `2 · d`, i.e. `((2d − 1) / patience[i]) · patience[i]` with integer division; its reply lands `2d` seconds later. Take the maximum over all servers and add 1.",
      ],
      editorial: explain({
        idea: "Each server behaves independently: once you know its distance to the master, you can compute exactly when its final reply arrives.",
        steps: [
          "BFS from server 0 to get every server's distance `d`.",
          "For server `i`, the round trip is `t = 2d`. It resends at multiples of `patience[i]` that fall strictly before `t`, so its last send is at `((t − 1) / patience[i]) · patience[i]`.",
          "That message's reply arrives at `last + t`; the network goes quiet one second after the latest such arrival.",
          "Return `max(last + t over all i) + 1`.",
        ],
        why: "Messages are routed along shortest paths and never interfere, so every message from server `i` takes exactly `t` seconds to come back. The server stops resending at second `t`, when the first reply arrives; any multiple of `patience[i]` below `t` triggers a resend. The latest event in the whole network is therefore the latest reply among all servers, and the next second is the first idle one.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "A resend at exactly second `t` does not happen — the reply arrives at that moment; hence `t − 1` in the formula.",
          "Answer the first idle second, which is one more than the last arrival.",
          "The master's `patience[0]` is 0 — skip server 0 to avoid dividing by zero.",
        ],
      }),
      examples: [
        { input: "[[0,1],[1,2],[1,3]]\n[0,3,2,5]", expectedOutput: "7" },
        { input: "[[0,1],[0,2]]\n[0,1,4]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 2, 3, 4, 5, 7, 10, 14, 20]);
        const edges = connectedEdges(rng, n, ri(rng, 0, pick(rng, [0, 2, n])), 0);
        const P = pick(rng, [1, 3, 10, 100000]);
        const patience = Array.from({ length: n }, (_, i) => (i === 0 ? 0 : ri(rng, 1, P)));
        return { input: `${fmtIntMat(edges)}\n${fmtIntArr(patience)}`, expectedOutput: String(ref(edges, patience)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def networkBecomesIdle(edges: List[List[int]], patience: List[int]) -> int:
              n = len(patience)
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              dist = [-1] * n
              dist[0] = 0
              q = deque([0])
              while q:
                  u = q.popleft()
                  for v in adj[u]:
                      if dist[v] < 0:
                          dist[v] = dist[u] + 1
                          q.append(v)
              ans = 0
              for i in range(1, n):
                  t = 2 * dist[i]
                  last = (t - 1) // patience[i] * patience[i]
                  ans = max(ans, last + t)
              return ans + 1
        `,
        javascript: code`
          var networkBecomesIdle = function(edges, patience) {
              var n = patience.length;
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var dist = [];
              for (var k = 0; k < n; k++) dist.push(-1);
              dist[0] = 0;
              var queue = [0];
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push(v); }
                  }
              }
              var ans = 0;
              for (var s = 1; s < n; s++) {
                  var t = 2 * dist[s];
                  var last = Math.floor((t - 1) / patience[s]) * patience[s];
                  if (last + t > ans) ans = last + t;
              }
              return ans + 1;
          };
        `,
        typescript: code`
          function networkBecomesIdle(edges: number[][], patience: number[]): number {
              var n = patience.length;
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var dist: number[] = [];
              for (var k = 0; k < n; k++) dist.push(-1);
              dist[0] = 0;
              var queue: number[] = [0];
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push(v); }
                  }
              }
              var ans = 0;
              for (var s = 1; s < n; s++) {
                  var t = 2 * dist[s];
                  var last = Math.floor((t - 1) / patience[s]) * patience[s];
                  if (last + t > ans) ans = last + t;
              }
              return ans + 1;
          }
        `,
        java: code`
          public static int networkBecomesIdle(int[][] edges, int[] patience) {
              int n = patience.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] dist = new int[n];
              Arrays.fill(dist, -1);
              dist[0] = 0;
              int[] queue = new int[n];
              int head = 0, tail = 0;
              queue[tail++] = 0;
              while (head < tail) {
                  int u = queue[head++];
                  for (int v : adj.get(u)) if (dist[v] < 0) { dist[v] = dist[u] + 1; queue[tail++] = v; }
              }
              int ans = 0;
              for (int i = 1; i < n; i++) {
                  int t = 2 * dist[i];
                  int last = (t - 1) / patience[i] * patience[i];
                  ans = Math.max(ans, last + t);
              }
              return ans + 1;
          }
        `,
        cpp: code`
          int networkBecomesIdle(vector<vector<int>>& edges, vector<int>& patience) {
              int n = patience.size();
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> dist(n, -1);
              dist[0] = 0;
              vector<int> queue;
              queue.push_back(0);
              for (size_t h = 0; h < queue.size(); h++) {
                  int u = queue[h];
                  for (int v : adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push_back(v); }
              }
              int ans = 0;
              for (int i = 1; i < n; i++) {
                  int t = 2 * dist[i];
                  int last = (t - 1) / patience[i] * patience[i];
                  ans = max(ans, last + t);
              }
              return ans + 1;
          }
        `,
        c: code`
          int networkBecomesIdle(int** edges, int edgesSize, int* edgesColSize, int* patience, int patienceSize) {
              int n = patienceSize;
              int* deg = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { deg[edges[e][0] + 1]++; deg[edges[e][1] + 1]++; }
              for (int i = 0; i < n; i++) deg[i + 1] += deg[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = deg[i];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* dist = (int*)malloc((n + 1) * sizeof(int));
              int* queue = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) dist[i] = -1;
              int head = 0, tail = 0;
              dist[0] = 0;
              queue[tail++] = 0;
              while (head < tail) {
                  int u = queue[head++];
                  for (int k = deg[u]; k < deg[u + 1]; k++) {
                      int v = adj[k];
                      if (dist[v] < 0) { dist[v] = dist[u] + 1; queue[tail++] = v; }
                  }
              }
              int ans = 0;
              for (int i = 1; i < n; i++) {
                  int t = 2 * dist[i];
                  int last = (t - 1) / patience[i] * patience[i];
                  if (last + t > ans) ans = last + t;
              }
              free(deg);
              free(fill);
              free(adj);
              free(dist);
              free(queue);
              return ans + 1;
          }
        `,
        csharp: code`
          public static int NetworkBecomesIdle(int[][] edges, int[] patience)
          {
              int n = patience.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] dist = new int[n];
              for (int i = 0; i < n; i++) dist[i] = -1;
              dist[0] = 0;
              var queue = new Queue<int>();
              queue.Enqueue(0);
              while (queue.Count > 0)
              {
                  int u = queue.Dequeue();
                  foreach (int v in adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.Enqueue(v); }
              }
              int ans = 0;
              for (int i = 1; i < n; i++)
              {
                  int t = 2 * dist[i];
                  int last = (t - 1) / patience[i] * patience[i];
                  ans = Math.Max(ans, last + t);
              }
              return ans + 1;
          }
        `,
        go: code`
          func networkBecomesIdle(edges [][]int, patience []int) int {
          	n := len(patience)
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	dist := make([]int, n)
          	for i := range dist {
          		dist[i] = -1
          	}
          	dist[0] = 0
          	queue := []int{0}
          	for h := 0; h < len(queue); h++ {
          		u := queue[h]
          		for _, v := range adj[u] {
          			if dist[v] < 0 {
          				dist[v] = dist[u] + 1
          				queue = append(queue, v)
          			}
          		}
          	}
          	ans := 0
          	for i := 1; i < n; i++ {
          		t := 2 * dist[i]
          		last := (t - 1) / patience[i] * patience[i]
          		if last+t > ans {
          			ans = last + t
          		}
          	}
          	return ans + 1
          }
        `,
        kotlin: code`
          fun networkBecomesIdle(edges: Array<IntArray>, patience: IntArray): Int {
              val n = patience.size
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val dist = IntArray(n) { -1 }
              dist[0] = 0
              val queue = IntArray(n)
              var head = 0
              var tail = 0
              queue[tail++] = 0
              while (head < tail) {
                  val u = queue[head++]
                  for (v in adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; queue[tail++] = v }
              }
              var ans = 0
              for (i in 1 until n) {
                  val t = 2 * dist[i]
                  val last = (t - 1) / patience[i] * patience[i]
                  ans = maxOf(ans, last + t)
              }
              return ans + 1
          }
        `,
        swift: code`
          func networkBecomesIdle(_ edges: [[Int]], _ patience: [Int]) -> Int {
              let n = patience.count
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var dist = [Int](repeating: -1, count: n)
              dist[0] = 0
              var queue = [0]
              var h = 0
              while h < queue.count {
                  let u = queue[h]
                  h += 1
                  for v in adj[u] where dist[v] < 0 {
                      dist[v] = dist[u] + 1
                      queue.append(v)
                  }
              }
              var ans = 0
              for i in 1..<n {
                  let t = 2 * dist[i]
                  let last = (t - 1) / patience[i] * patience[i]
                  ans = max(ans, last + t)
              }
              return ans + 1
          }
        `,
        rust: code`
          fn networkBecomesIdle(edges: Vec<Vec<i32>>, patience: Vec<i32>) -> i32 {
              let n = patience.len();
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut dist = vec![-1i32; n];
              dist[0] = 0;
              let mut queue: Vec<usize> = vec![0];
              let mut h = 0;
              while h < queue.len() {
                  let u = queue[h];
                  h += 1;
                  for &v in adj[u].iter() {
                      if dist[v] < 0 {
                          dist[v] = dist[u] + 1;
                          queue.push(v);
                      }
                  }
              }
              let mut ans = 0;
              for i in 1..n {
                  let t = 2 * dist[i];
                  let last = (t - 1) / patience[i] * patience[i];
                  if last + t > ans {
                      ans = last + t;
                  }
              }
              ans + 1
          }
        `,
        php: code`
          function networkBecomesIdle($edges, $patience) {
              $n = count($patience);
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $dist = array_fill(0, $n, -1);
              $dist[0] = 0;
              $queue = [0];
              for ($h = 0; $h < count($queue); $h++) {
                  $u = $queue[$h];
                  foreach ($adj[$u] as $v) {
                      if ($dist[$v] < 0) { $dist[$v] = $dist[$u] + 1; $queue[] = $v; }
                  }
              }
              $ans = 0;
              for ($i = 1; $i < $n; $i++) {
                  $t = 2 * $dist[$i];
                  $last = intdiv($t - 1, $patience[$i]) * $patience[$i];
                  if ($last + $t > $ans) $ans = $last + $t;
              }
              return $ans + 1;
          }
        `,
        ruby: code`
          def networkBecomesIdle(edges, patience)
            n = patience.length
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            dist = Array.new(n, -1)
            dist[0] = 0
            queue = [0]
            h = 0
            while h < queue.length
              u = queue[h]
              h += 1
              adj[u].each do |v|
                if dist[v] < 0
                  dist[v] = dist[u] + 1
                  queue << v
                end
              end
            end
            ans = 0
            (1...n).each do |i|
              t = 2 * dist[i]
              last = (t - 1) / patience[i] * patience[i]
              ans = last + t if last + t > ans
            end
            ans + 1
          end
        `,
      },
    };
  })(),

  // ── Parallel Courses III (LC 2050) ──────────────────────────────
  (() => {
    const ref = (n: number, relations: number[][], time: number[]) => {
      const pre: number[][] = Array.from({ length: n + 1 }, () => []);
      for (const [a, b] of relations) pre[b].push(a);
      const memo = new Array(n + 1).fill(-1);
      const finish = (v: number): number => {
        if (memo[v] >= 0) return memo[v];
        let ready = 0;
        for (const p of pre[v]) ready = Math.max(ready, finish(p));
        return (memo[v] = ready + time[v - 1]);
      };
      let best = 0;
      for (let v = 1; v <= n; v++) best = Math.max(best, finish(v));
      return best;
    };
    return {
      slug: "parallel-courses-iii",
      title: "Parallel Courses III",
      difficulty: "HARD" as const,
      tags: ["Array", "Graph", "Topological Sort", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "minimumTime",
        params: [{ name: "n", type: "int" as const }, { name: "relations", type: "int[][]" as const }, { name: "time", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A CodeKairo track has `n` courses labelled `1` to `n`. Each `relations[j] = [prevCourse, nextCourse]` says `prevCourse` must be **finished** before `nextCourse` can start. Course `i` takes `time[i - 1]` months.\n\nYou may start any course as soon as all its prerequisites are finished, and you may take any number of courses at the same time.\n\nReturn the minimum number of months needed to finish every course. The prerequisites are guaranteed to form a directed acyclic graph, so finishing is always possible.",
        [
          { in: "n = 4, relations = [[1,2],[1,3],[2,4],[3,4]], time = [2,5,3,1]", out: "8", note: "Course 1 ends at month 2, course 2 at 7, course 3 at 5, so course 4 starts at 7 and ends at 8." },
          { in: "n = 3, relations = [], time = [4,9,2]", out: "9", note: "Everything runs in parallel; the longest course decides." },
          { in: "n = 5, relations = [[2,1],[3,1],[4,3]], time = [1,6,2,7,3]", out: "10" },
        ],
        ["1 <= n <= 5 * 10^4", "0 <= relations.length <= min(n * (n - 1) / 2, 5 * 10^4)", "relations[j].length == 2", "1 <= prevCourse, nextCourse <= n", "prevCourse != nextCourse", "all pairs [prevCourse, nextCourse] are unique", "time.length == n", "1 <= time[i] <= 10^4", "the relations form a directed acyclic graph"]),
      hints: [
        "A course can finish no earlier than its own duration plus the latest finish time among its prerequisites.",
        "Compute finish times in an order where every prerequisite is handled before the courses that depend on it.",
        "Kahn's topological sort gives that order: when a course is popped, push its finish time forward to each dependent course as that course's earliest start. The answer is the largest finish time.",
      ],
      editorial: explain({
        idea: "With unlimited parallelism the schedule is the critical path of the DAG: `finish(v) = time(v) + max(finish(p))` over prerequisites `p`, computed in topological order.",
        steps: [
          "Build adjacency lists and in-degrees from `relations`; let `start[v] = 0` for all courses.",
          "Queue every course with in-degree 0.",
          "Pop `u`; its finish time is `start[u] + time[u]`. For each dependent `v`, set `start[v] = max(start[v], finish(u))`, decrement its in-degree and queue it at 0.",
          "Return the largest finish time seen.",
        ],
        why: "When a course is popped, all its prerequisites were popped before it, so `start[u]` already equals the latest finish among them — the earliest moment it may begin. Starting every course at that moment is optimal since nothing is gained by waiting, and the whole program ends when the last course does.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Courses are 1-indexed in `relations` but `time` is 0-indexed.",
          "The answer is the maximum finish over all courses, not the finish of the last course popped.",
          "Courses with no relations at all still count — they run from month 0.",
        ],
      }),
      examples: [
        { input: "4\n[[1,2],[1,3],[2,4],[3,4]]\n[2,5,3,1]", expectedOutput: "8" },
        { input: "3\n[]\n[4,9,2]", expectedOutput: "9" },
        { input: "5\n[[2,1],[3,1],[4,3]]\n[1,6,2,7,3]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 5, 7, 10, 12, 15]);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const cap = (n * (n - 1)) / 2;
        const m = ri(rng, 0, Math.min(cap, pick(rng, [0, n, 2 * n, cap])));
        const relations = allPairs(rng, n, 0).slice(0, m).map(([i, j]) => [order[i], order[j]]);
        const T = pick(rng, [1, 10, 10000]);
        const time = Array.from({ length: n }, () => ri(rng, 1, T));
        return { input: `${n}\n${fmtIntMat(relations)}\n${fmtIntArr(time)}`, expectedOutput: String(ref(n, relations, time)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minimumTime(n: int, relations: List[List[int]], time: List[int]) -> int:
              adj = [[] for _ in range(n)]
              indeg = [0] * n
              for a, b in relations:
                  adj[a - 1].append(b - 1)
                  indeg[b - 1] += 1
              start = [0] * n
              q = deque(i for i in range(n) if indeg[i] == 0)
              best = 0
              while q:
                  u = q.popleft()
                  finish = start[u] + time[u]
                  if finish > best:
                      best = finish
                  for v in adj[u]:
                      if finish > start[v]:
                          start[v] = finish
                      indeg[v] -= 1
                      if indeg[v] == 0:
                          q.append(v)
              return best
        `,
        javascript: code`
          var minimumTime = function(n, relations, time) {
              var adj = [], indeg = [], start = [];
              for (var i = 0; i < n; i++) { adj.push([]); indeg.push(0); start.push(0); }
              for (var r = 0; r < relations.length; r++) {
                  adj[relations[r][0] - 1].push(relations[r][1] - 1);
                  indeg[relations[r][1] - 1]++;
              }
              var queue = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              var best = 0;
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  var finish = start[u] + time[u];
                  if (finish > best) best = finish;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] === 0) queue.push(v);
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumTime(n: number, relations: number[][], time: number[]): number {
              var adj: number[][] = [], indeg: number[] = [], start: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); indeg.push(0); start.push(0); }
              for (var r = 0; r < relations.length; r++) {
                  adj[relations[r][0] - 1].push(relations[r][1] - 1);
                  indeg[relations[r][1] - 1]++;
              }
              var queue: number[] = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              var best = 0;
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h];
                  var finish = start[u] + time[u];
                  if (finish > best) best = finish;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] === 0) queue.push(v);
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumTime(int n, int[][] relations, int[] time) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              int[] indeg = new int[n];
              for (int[] r : relations) { adj.get(r[0] - 1).add(r[1] - 1); indeg[r[1] - 1]++; }
              int[] start = new int[n];
              int[] queue = new int[n];
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              int best = 0;
              while (head < tail) {
                  int u = queue[head++];
                  int finish = start[u] + time[u];
                  best = Math.max(best, finish);
                  for (int v : adj.get(u)) {
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int minimumTime(int n, vector<vector<int>>& relations, vector<int>& time) {
              vector<vector<int>> adj(n);
              vector<int> indeg(n, 0), start(n, 0), queue;
              for (auto& r : relations) { adj[r[0] - 1].push_back(r[1] - 1); indeg[r[1] - 1]++; }
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
              int best = 0;
              for (size_t h = 0; h < queue.size(); h++) {
                  int u = queue[h];
                  int finish = start[u] + time[u];
                  best = max(best, finish);
                  for (int v : adj[u]) {
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] == 0) queue.push_back(v);
                  }
              }
              return best;
          }
        `,
        c: code`
          int minimumTime(int n, int** relations, int relationsSize, int* relationsColSize, int* time, int timeSize) {
              int* indeg = (int*)calloc(n + 1, sizeof(int));
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int r = 0; r < relationsSize; r++) { first[relations[r][0]]++; indeg[relations[r][1] - 1]++; }
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((relationsSize + 1) * sizeof(int));
              for (int r = 0; r < relationsSize; r++) adj[fill[relations[r][0] - 1]++] = relations[r][1] - 1;
              int* start = (int*)calloc(n + 1, sizeof(int));
              int* queue = (int*)malloc((n + 1) * sizeof(int));
              int head = 0, tail = 0, best = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              while (head < tail) {
                  int u = queue[head++];
                  int finish = start[u] + time[u];
                  if (finish > best) best = finish;
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              free(indeg);
              free(first);
              free(fill);
              free(adj);
              free(start);
              free(queue);
              return best;
          }
        `,
        csharp: code`
          public static int MinimumTime(int n, int[][] relations, int[] time)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              int[] indeg = new int[n];
              foreach (var r in relations) { adj[r[0] - 1].Add(r[1] - 1); indeg[r[1] - 1]++; }
              int[] start = new int[n];
              int[] queue = new int[n];
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              int best = 0;
              while (head < tail)
              {
                  int u = queue[head++];
                  int finish = start[u] + time[u];
                  best = Math.Max(best, finish);
                  foreach (int v in adj[u])
                  {
                      if (finish > start[v]) start[v] = finish;
                      if (--indeg[v] == 0) queue[tail++] = v;
                  }
              }
              return best;
          }
        `,
        go: code`
          func minimumTime(n int, relations [][]int, time []int) int {
          	adj := make([][]int, n)
          	indeg := make([]int, n)
          	for _, r := range relations {
          		adj[r[0]-1] = append(adj[r[0]-1], r[1]-1)
          		indeg[r[1]-1]++
          	}
          	start := make([]int, n)
          	queue := []int{}
          	for i := 0; i < n; i++ {
          		if indeg[i] == 0 {
          			queue = append(queue, i)
          		}
          	}
          	best := 0
          	for h := 0; h < len(queue); h++ {
          		u := queue[h]
          		finish := start[u] + time[u]
          		if finish > best {
          			best = finish
          		}
          		for _, v := range adj[u] {
          			if finish > start[v] {
          				start[v] = finish
          			}
          			indeg[v]--
          			if indeg[v] == 0 {
          				queue = append(queue, v)
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minimumTime(n: Int, relations: Array<IntArray>, time: IntArray): Int {
              val adj = Array(n) { ArrayList<Int>() }
              val indeg = IntArray(n)
              for (r in relations) { adj[r[0] - 1].add(r[1] - 1); indeg[r[1] - 1]++ }
              val start = IntArray(n)
              val queue = IntArray(n)
              var head = 0
              var tail = 0
              for (i in 0 until n) if (indeg[i] == 0) queue[tail++] = i
              var best = 0
              while (head < tail) {
                  val u = queue[head++]
                  val finish = start[u] + time[u]
                  if (finish > best) best = finish
                  for (v in adj[u]) {
                      if (finish > start[v]) start[v] = finish
                      indeg[v]--
                      if (indeg[v] == 0) queue[tail++] = v
                  }
              }
              return best
          }
        `,
        swift: code`
          func minimumTime(_ n: Int, _ relations: [[Int]], _ time: [Int]) -> Int {
              var adj = [[Int]](repeating: [], count: n)
              var indeg = [Int](repeating: 0, count: n)
              for r in relations { adj[r[0] - 1].append(r[1] - 1); indeg[r[1] - 1] += 1 }
              var start = [Int](repeating: 0, count: n)
              var queue = [Int]()
              for i in 0..<n where indeg[i] == 0 { queue.append(i) }
              var best = 0
              var h = 0
              while h < queue.count {
                  let u = queue[h]
                  h += 1
                  let finish = start[u] + time[u]
                  if finish > best { best = finish }
                  for v in adj[u] {
                      if finish > start[v] { start[v] = finish }
                      indeg[v] -= 1
                      if indeg[v] == 0 { queue.append(v) }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumTime(n: i32, relations: Vec<Vec<i32>>, time: Vec<i32>) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              let mut indeg = vec![0usize; n];
              for r in relations.iter() {
                  adj[(r[0] - 1) as usize].push((r[1] - 1) as usize);
                  indeg[(r[1] - 1) as usize] += 1;
              }
              let mut start = vec![0i32; n];
              let mut queue: Vec<usize> = Vec::new();
              for i in 0..n {
                  if indeg[i] == 0 {
                      queue.push(i);
                  }
              }
              let mut best = 0;
              let mut h = 0;
              while h < queue.len() {
                  let u = queue[h];
                  h += 1;
                  let finish = start[u] + time[u];
                  if finish > best {
                      best = finish;
                  }
                  for &v in adj[u].iter() {
                      if finish > start[v] {
                          start[v] = finish;
                      }
                      indeg[v] -= 1;
                      if indeg[v] == 0 {
                          queue.push(v);
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function minimumTime($n, $relations, $time) {
              $adj = array_fill(0, $n, []);
              $indeg = array_fill(0, $n, 0);
              foreach ($relations as $r) { $adj[$r[0] - 1][] = $r[1] - 1; $indeg[$r[1] - 1]++; }
              $start = array_fill(0, $n, 0);
              $queue = [];
              for ($i = 0; $i < $n; $i++) if ($indeg[$i] == 0) $queue[] = $i;
              $best = 0;
              for ($h = 0; $h < count($queue); $h++) {
                  $u = $queue[$h];
                  $finish = $start[$u] + $time[$u];
                  if ($finish > $best) $best = $finish;
                  foreach ($adj[$u] as $v) {
                      if ($finish > $start[$v]) $start[$v] = $finish;
                      $indeg[$v]--;
                      if ($indeg[$v] == 0) $queue[] = $v;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumTime(n, relations, time)
            adj = Array.new(n) { [] }
            indeg = Array.new(n, 0)
            relations.each do |a, b|
              adj[a - 1] << b - 1
              indeg[b - 1] += 1
            end
            start = Array.new(n, 0)
            queue = (0...n).select { |i| indeg[i] == 0 }
            best = 0
            h = 0
            while h < queue.length
              u = queue[h]
              h += 1
              finish = start[u] + time[u]
              best = finish if finish > best
              adj[u].each do |v|
                start[v] = finish if finish > start[v]
                indeg[v] -= 1
                queue << v if indeg[v] == 0
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Second Minimum Time to Reach Destination (LC 2045) ──────────
  (() => {
    const travel = (edgesUsed: number, time: number, change: number) => {
      let t = 0;
      for (let k = 0; k < edgesUsed; k++) {
        if (Math.floor(t / change) % 2 === 1) t = (Math.floor(t / change) + 1) * change;
        t += time;
      }
      return t;
    };
    const ref = (n: number, edges: number[][], time: number, change: number) => {
      // Walk lengths by layered reachability: the set of nodes reachable by walks of exactly k edges.
      const adj: number[][] = Array.from({ length: n + 1 }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      let cur = new Array(n + 1).fill(false);
      cur[1] = true;
      let first = -1;
      for (let k = 0; ; k++) {
        if (cur[n]) {
          if (first === -1) first = k;
          else return travel(k, time, change);
        }
        const nxt = new Array(n + 1).fill(false);
        for (let u = 1; u <= n; u++) if (cur[u]) for (const v of adj[u]) nxt[v] = true;
        cur = nxt;
      }
    };
    return {
      slug: "second-minimum-time-to-reach-destination",
      title: "Second Minimum Time to Reach Destination",
      difficulty: "HARD" as const,
      tags: ["Graph", "Breadth-First Search", "Shortest Path", "Google", "Amazon"],
      signature: {
        funcName: "secondMinimum",
        params: [
          { name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const },
          { name: "time", type: "int" as const }, { name: "change", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A city has `n` junctions labelled `1` to `n`, joined by the two-way roads in `edges` (each `[ui, vi]`). The road network is connected, has no duplicate roads and no road from a junction to itself. Crossing any road takes exactly `time` minutes.\n\nEvery junction has a traffic signal. All signals switch together every `change` minutes, alternating green and red, and they all turn **green** at minute `0`. You may arrive at a junction at any moment, but you may **leave** it only while its signal is green — and if it is green you must leave at once rather than wait.\n\nThe **second minimum time** is the smallest journey time from junction `1` to junction `n` that is **strictly larger** than the minimum. Junctions (including `1` and `n`) may be revisited. Return the second minimum time.",
        [
          { in: "n = 4, edges = [[1,2],[2,4],[1,3],[3,4],[2,3]], time = 2, change = 3", out: "8", note: "The fastest route 1 → 2 → 4 takes 4 minutes. The next is 1 → 2 → 3 → 4: you reach 3 at minute 4, while signals are red (minutes 3–5), leave at 6 and arrive at 8." },
          { in: "n = 2, edges = [[1,2]], time = 4, change = 7", out: "18", note: "Go 1 → 2 → 1 → 2: arrive at 4 and 8, wait for green until 14, arrive at 18." },
        ],
        ["2 <= n <= 10^4", "n - 1 <= edges.length <= min(2 * 10^4, n * (n - 1) / 2)", "edges[i].length == 2", "1 <= ui, vi <= n", "ui != vi", "no duplicate edges; the graph is connected", "1 <= time, change <= 10^3"]),
      hints: [
        "Every road takes the same time and the signals are global, so the journey time depends only on the number of roads crossed — and it grows with that number.",
        "So find the second smallest number of roads on a walk from 1 to n (strictly more than the smallest). It is always at most the smallest plus 2, by stepping back and forth on a road.",
        "Run a BFS that records up to two distinct distances per junction (the best and the strictly second best), then simulate the signals for that many roads.",
      ],
      editorial: explain({
        idea: "Because all roads cost the same and the signals are synchronised, the arrival time is a strictly increasing function of the number of roads used. The problem becomes: find the second-smallest walk length from 1 to n, then convert it to minutes.",
        steps: [
          "BFS from junction 1 keeping two labels per node: `d1` (shortest) and `d2` (smallest length strictly greater than `d1`).",
          "When relaxing a neighbour with length `L`: if `L < d1`, set `d1 = L` and enqueue; else if `d1 < L < d2`, set `d2 = L` and enqueue.",
          "Take `k = d2[n]` and simulate: before each road, if `floor(t / change)` is odd the signal is red, so jump to the next multiple of `change`; then add `time`.",
          "Return the resulting `t`.",
        ],
        why: "Lengths are popped in non-decreasing order, so each node is finalised with its two smallest distinct walk lengths after at most two visits. The waiting rule depends only on the current minute, so `k` roads always take the same total time, and more roads never take less time; hence the second minimum time comes from the second minimum walk length.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "The second length must be strictly greater — record a node a second time only for a different length.",
          "Walks may revisit nodes, so the second shortest can be the shortest plus 2 (bounce on a road).",
          "Do not wait at the destination: the time counts when you arrive at `n`, so only signals before each departure matter.",
        ],
      }),
      examples: [
        { input: "4\n[[1,2],[2,4],[1,3],[3,4],[2,3]]\n2\n3", expectedOutput: "8" },
        { input: "2\n[[1,2]]\n4\n7", expectedOutput: "18" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 2, 3, 4, 5, 6, 8, 10, 12]);
        const edges = connectedEdges(rng, n, ri(rng, 0, pick(rng, [0, 2, n])), 1);
        const time = ri(rng, 1, pick(rng, [3, 10, 1000]));
        const change = ri(rng, 1, pick(rng, [3, 10, 1000]));
        return { input: `${n}\n${fmtIntMat(edges)}\n${time}\n${change}`, expectedOutput: String(ref(n, edges, time, change)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def secondMinimum(n: int, edges: List[List[int]], time: int, change: int) -> int:
              adj = [[] for _ in range(n + 1)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              INF = 10 ** 9
              d1 = [INF] * (n + 1)
              d2 = [INF] * (n + 1)
              d1[1] = 0
              q = deque([(1, 0)])
              while q:
                  u, d = q.popleft()
                  nd = d + 1
                  for v in adj[u]:
                      if nd < d1[v]:
                          d1[v] = nd
                          q.append((v, nd))
                      elif d1[v] < nd < d2[v]:
                          d2[v] = nd
                          q.append((v, nd))
              t = 0
              for _ in range(d2[n]):
                  if (t // change) % 2 == 1:
                      t = (t // change + 1) * change
                  t += time
              return t
        `,
        javascript: code`
          var secondMinimum = function(n, edges, time, change) {
              var adj = [];
              for (var i = 0; i <= n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var INF = 1000000000;
              var d1 = [], d2 = [];
              for (var k = 0; k <= n; k++) { d1.push(INF); d2.push(INF); }
              d1[1] = 0;
              var qn = [1], qd = [0];
              for (var h = 0; h < qn.length; h++) {
                  var u = qn[h], nd = qd[h] + 1;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (nd < d1[v]) { d1[v] = nd; qn.push(v); qd.push(nd); }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn.push(v); qd.push(nd); }
                  }
              }
              var t = 0;
              for (var s = 0; s < d2[n]; s++) {
                  if (Math.floor(t / change) % 2 === 1) t = (Math.floor(t / change) + 1) * change;
                  t += time;
              }
              return t;
          };
        `,
        typescript: code`
          function secondMinimum(n: number, edges: number[][], time: number, change: number): number {
              var adj: number[][] = [];
              for (var i = 0; i <= n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var INF = 1000000000;
              var d1: number[] = [], d2: number[] = [];
              for (var k = 0; k <= n; k++) { d1.push(INF); d2.push(INF); }
              d1[1] = 0;
              var qn: number[] = [1], qd: number[] = [0];
              for (var h = 0; h < qn.length; h++) {
                  var u = qn[h], nd = qd[h] + 1;
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (nd < d1[v]) { d1[v] = nd; qn.push(v); qd.push(nd); }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn.push(v); qd.push(nd); }
                  }
              }
              var t = 0;
              for (var s = 0; s < d2[n]; s++) {
                  if (Math.floor(t / change) % 2 === 1) t = (Math.floor(t / change) + 1) * change;
                  t += time;
              }
              return t;
          }
        `,
        java: code`
          public static int secondMinimum(int n, int[][] edges, int time, int change) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              final int INF = Integer.MAX_VALUE;
              int[] d1 = new int[n + 1], d2 = new int[n + 1];
              Arrays.fill(d1, INF);
              Arrays.fill(d2, INF);
              d1[1] = 0;
              int[] qn = new int[2 * n + 2], qd = new int[2 * n + 2];
              int head = 0, tail = 0;
              qn[tail] = 1;
              qd[tail++] = 0;
              while (head < tail) {
                  int u = qn[head], nd = qd[head] + 1;
                  head++;
                  for (int v : adj.get(u)) {
                      if (nd < d1[v]) { d1[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                  }
              }
              int t = 0;
              for (int s = 0; s < d2[n]; s++) {
                  if ((t / change) % 2 == 1) t = (t / change + 1) * change;
                  t += time;
              }
              return t;
          }
        `,
        cpp: code`
          int secondMinimum(int n, vector<vector<int>>& edges, int time, int change) {
              vector<vector<int>> adj(n + 1);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              const int INF = INT_MAX;
              vector<int> d1(n + 1, INF), d2(n + 1, INF), qn, qd;
              d1[1] = 0;
              qn.push_back(1);
              qd.push_back(0);
              for (size_t h = 0; h < qn.size(); h++) {
                  int u = qn[h], nd = qd[h] + 1;
                  for (int v : adj[u]) {
                      if (nd < d1[v]) { d1[v] = nd; qn.push_back(v); qd.push_back(nd); }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn.push_back(v); qd.push_back(nd); }
                  }
              }
              int t = 0;
              for (int s = 0; s < d2[n]; s++) {
                  if ((t / change) % 2 == 1) t = (t / change + 1) * change;
                  t += time;
              }
              return t;
          }
        `,
        c: code`
          int secondMinimum(int n, int** edges, int edgesSize, int* edgesColSize, int time, int change) {
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0]]++; first[edges[e][1]]++; }
              /* first[v] becomes the start of v's slice (nodes 1..n) */
              int acc = 0;
              for (int v = 0; v <= n + 1; v++) { int c = first[v]; first[v] = acc; acc += c; }
              int* fill = (int*)malloc((n + 2) * sizeof(int));
              for (int v = 0; v <= n + 1; v++) fill[v] = first[v];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              const int INF = 2147483647;
              int* d1 = (int*)malloc((n + 1) * sizeof(int));
              int* d2 = (int*)malloc((n + 1) * sizeof(int));
              for (int v = 0; v <= n; v++) { d1[v] = INF; d2[v] = INF; }
              int* qn = (int*)malloc((2 * n + 2) * sizeof(int));
              int* qd = (int*)malloc((2 * n + 2) * sizeof(int));
              int head = 0, tail = 0;
              d1[1] = 0;
              qn[tail] = 1;
              qd[tail++] = 0;
              while (head < tail) {
                  int u = qn[head], nd = qd[head] + 1;
                  head++;
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (nd < d1[v]) { d1[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                  }
              }
              int t = 0;
              for (int s = 0; s < d2[n]; s++) {
                  if ((t / change) % 2 == 1) t = (t / change + 1) * change;
                  t += time;
              }
              free(first);
              free(fill);
              free(adj);
              free(d1);
              free(d2);
              free(qn);
              free(qd);
              return t;
          }
        `,
        csharp: code`
          public static int SecondMinimum(int n, int[][] edges, int time, int change)
          {
              var adj = new List<int>[n + 1];
              for (int i = 0; i <= n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int INF = int.MaxValue;
              int[] d1 = new int[n + 1], d2 = new int[n + 1];
              for (int i = 0; i <= n; i++) { d1[i] = INF; d2[i] = INF; }
              d1[1] = 0;
              int[] qn = new int[2 * n + 2], qd = new int[2 * n + 2];
              int head = 0, tail = 0;
              qn[tail] = 1;
              qd[tail++] = 0;
              while (head < tail)
              {
                  int u = qn[head], nd = qd[head] + 1;
                  head++;
                  foreach (int v in adj[u])
                  {
                      if (nd < d1[v]) { d1[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn[tail] = v; qd[tail++] = nd; }
                  }
              }
              int t = 0;
              for (int s = 0; s < d2[n]; s++)
              {
                  if ((t / change) % 2 == 1) t = (t / change + 1) * change;
                  t += time;
              }
              return t;
          }
        `,
        go: code`
          func secondMinimum(n int, edges [][]int, time int, change int) int {
          	adj := make([][]int, n+1)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	const INF = 1 << 30
          	d1 := make([]int, n+1)
          	d2 := make([]int, n+1)
          	for i := 0; i <= n; i++ {
          		d1[i] = INF
          		d2[i] = INF
          	}
          	d1[1] = 0
          	qn := []int{1}
          	qd := []int{0}
          	for h := 0; h < len(qn); h++ {
          		u, nd := qn[h], qd[h]+1
          		for _, v := range adj[u] {
          			if nd < d1[v] {
          				d1[v] = nd
          				qn = append(qn, v)
          				qd = append(qd, nd)
          			} else if nd > d1[v] && nd < d2[v] {
          				d2[v] = nd
          				qn = append(qn, v)
          				qd = append(qd, nd)
          			}
          		}
          	}
          	t := 0
          	for s := 0; s < d2[n]; s++ {
          		if (t/change)%2 == 1 {
          			t = (t/change + 1) * change
          		}
          		t += time
          	}
          	return t
          }
        `,
        kotlin: code`
          fun secondMinimum(n: Int, edges: Array<IntArray>, time: Int, change: Int): Int {
              val adj = Array(n + 1) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val inf = Int.MAX_VALUE
              val d1 = IntArray(n + 1) { inf }
              val d2 = IntArray(n + 1) { inf }
              d1[1] = 0
              val qn = IntArray(2 * n + 2)
              val qd = IntArray(2 * n + 2)
              var head = 0
              var tail = 0
              qn[tail] = 1
              qd[tail++] = 0
              while (head < tail) {
                  val u = qn[head]
                  val nd = qd[head] + 1
                  head++
                  for (v in adj[u]) {
                      if (nd < d1[v]) { d1[v] = nd; qn[tail] = v; qd[tail++] = nd }
                      else if (nd > d1[v] && nd < d2[v]) { d2[v] = nd; qn[tail] = v; qd[tail++] = nd }
                  }
              }
              var t = 0
              for (s in 0 until d2[n]) {
                  if ((t / change) % 2 == 1) t = (t / change + 1) * change
                  t += time
              }
              return t
          }
        `,
        swift: code`
          func secondMinimum(_ n: Int, _ edges: [[Int]], _ time: Int, _ change: Int) -> Int {
              var adj = [[Int]](repeating: [], count: n + 1)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              let inf = Int.max
              var d1 = [Int](repeating: inf, count: n + 1)
              var d2 = [Int](repeating: inf, count: n + 1)
              d1[1] = 0
              var qn = [1], qd = [0]
              var h = 0
              while h < qn.count {
                  let u = qn[h], nd = qd[h] + 1
                  h += 1
                  for v in adj[u] {
                      if nd < d1[v] { d1[v] = nd; qn.append(v); qd.append(nd) }
                      else if nd > d1[v] && nd < d2[v] { d2[v] = nd; qn.append(v); qd.append(nd) }
                  }
              }
              var t = 0
              for _ in 0..<d2[n] {
                  if (t / change) % 2 == 1 { t = (t / change + 1) * change }
                  t += time
              }
              return t
          }
        `,
        rust: code`
          fn secondMinimum(n: i32, edges: Vec<Vec<i32>>, time: i32, change: i32) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n + 1];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let inf = std::i32::MAX;
              let mut d1 = vec![inf; n + 1];
              let mut d2 = vec![inf; n + 1];
              d1[1] = 0;
              let mut qn: Vec<usize> = vec![1];
              let mut qd: Vec<i32> = vec![0];
              let mut h = 0;
              while h < qn.len() {
                  let u = qn[h];
                  let nd = qd[h] + 1;
                  h += 1;
                  for &v in adj[u].iter() {
                      if nd < d1[v] {
                          d1[v] = nd;
                          qn.push(v);
                          qd.push(nd);
                      } else if nd > d1[v] && nd < d2[v] {
                          d2[v] = nd;
                          qn.push(v);
                          qd.push(nd);
                      }
                  }
              }
              let mut t = 0i32;
              for _ in 0..d2[n] {
                  if (t / change) % 2 == 1 {
                      t = (t / change + 1) * change;
                  }
                  t += time;
              }
              t
          }
        `,
        php: code`
          function secondMinimum($n, $edges, $time, $change) {
              $adj = array_fill(0, $n + 1, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $INF = PHP_INT_MAX;
              $d1 = array_fill(0, $n + 1, $INF);
              $d2 = array_fill(0, $n + 1, $INF);
              $d1[1] = 0;
              $qn = [1];
              $qd = [0];
              for ($h = 0; $h < count($qn); $h++) {
                  $u = $qn[$h];
                  $nd = $qd[$h] + 1;
                  foreach ($adj[$u] as $v) {
                      if ($nd < $d1[$v]) { $d1[$v] = $nd; $qn[] = $v; $qd[] = $nd; }
                      elseif ($nd > $d1[$v] && $nd < $d2[$v]) { $d2[$v] = $nd; $qn[] = $v; $qd[] = $nd; }
                  }
              }
              $t = 0;
              for ($s = 0; $s < $d2[$n]; $s++) {
                  if (intdiv($t, $change) % 2 == 1) $t = (intdiv($t, $change) + 1) * $change;
                  $t += $time;
              }
              return $t;
          }
        `,
        ruby: code`
          def secondMinimum(n, edges, time, change)
            adj = Array.new(n + 1) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            inf = 1 << 40
            d1 = Array.new(n + 1, inf)
            d2 = Array.new(n + 1, inf)
            d1[1] = 0
            qn = [1]
            qd = [0]
            h = 0
            while h < qn.length
              u = qn[h]
              nd = qd[h] + 1
              h += 1
              adj[u].each do |v|
                if nd < d1[v]
                  d1[v] = nd
                  qn << v
                  qd << nd
                elsif nd > d1[v] && nd < d2[v]
                  d2[v] = nd
                  qn << v
                  qd << nd
                end
              end
            end
            t = 0
            d2[n].times do
              t = (t / change + 1) * change if (t / change).odd?
              t += time
            end
            t
          end
        `,
      },
    };
  })(),

  // ── Maximum Employees to Be Invited to a Meeting (LC 2127) ──────
  (() => {
    const ref = (fav: number[]) => {
      // Cycle structure by walking, chains by recursion over the reverse forest
      // (checked offline against an all-arrangements brute force for n <= 6).
      const n = fav.length;
      const children: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) children[fav[i]].push(i);
      const onCycle = new Array(n).fill(false);
      for (let i = 0; i < n; i++) {
        let x = fav[i];
        for (let s = 0; s < n && x !== i; s++) x = fav[x];
        if (x === i) onCycle[i] = true;
      }
      const longestInto = (x: number): number => {
        let best = 0;
        for (const y of children[x]) if (!onCycle[y]) best = Math.max(best, 1 + longestInto(y));
        return best;
      };
      let bigCycle = 0, pairSum = 0;
      const done = new Array(n).fill(false);
      for (let i = 0; i < n; i++) {
        if (!onCycle[i] || done[i]) continue;
        let len = 0, x = i;
        do { done[x] = true; len++; x = fav[x]; } while (x !== i);
        if (len === 2) pairSum += 2 + longestInto(i) + longestInto(fav[i]);
        else bigCycle = Math.max(bigCycle, len);
      }
      return Math.max(bigCycle, pairSum);
    };
    return {
      slug: "maximum-employees-to-be-invited-to-a-meeting",
      title: "Maximum Employees to Be Invited to a Meeting",
      difficulty: "HARD" as const,
      tags: ["Graph", "Topological Sort", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "maximumInvitations", params: [{ name: "favorite", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A company is planning a meeting at a large **round** table that can seat any number of people. Its `n` employees are numbered `0` to `n - 1`, and employee `i` has exactly one favourite colleague, `favorite[i]`, who is never `i` themself.\n\nAn employee attends only if they can sit **directly next to** their favourite colleague (on either side).\n\nReturn the maximum number of employees who can be invited.",
        [
          { in: "favorite = [1,0,0,1,3]", out: "5", note: "0 and 1 favour each other. Seat them together with 2 beside 0 and the chain 4 → 3 beside 1: 2, 0, 1, 3, 4 around the table works for everyone." },
          { in: "favorite = [1,2,3,0,0]", out: "4", note: "0 → 1 → 2 → 3 → 0 must sit as a closed loop, which leaves no seat next to 0 for employee 4." },
          { in: "favorite = [1,2,0]", out: "3" },
        ],
        ["n == favorite.length", "2 <= n <= 10^5", "0 <= favorite[i] <= n - 1", "favorite[i] != i"]),
      hints: [
        "Draw an edge from each employee to their favourite. Every component of this graph is one cycle with trees hanging into it.",
        "A cycle of length 3 or more can only be seated on its own, as exactly that cycle. A pair of mutual favourites (a 2-cycle) is different: each side can extend with a chain of people leading into it.",
        "So the answer is the larger of: the longest cycle (length ≥ 3), or the sum over all mutual pairs of 2 + the longest chain into each partner. Peel the trees off with a topological sort to get the chain lengths.",
      ],
      editorial: explain({
        idea: "The favourite graph is functional, so each component is a cycle plus in-trees. A long cycle fills the table alone; mutual pairs, each with the longest chain leading into either partner, can all be laid side by side around the table.",
        steps: [
          "Count in-degrees and queue everyone nobody favours (in-degree 0).",
          "Pop `u`, let `v = favorite[u]`, set `depth[v] = max(depth[v], depth[u] + 1)`, decrement `v`'s in-degree and queue it at 0. Whatever is never popped lies on a cycle.",
          "Walk each remaining cycle once to get its length. For a 2-cycle `(a, b)` add `2 + depth[a] + depth[b]` to a running pair total; for longer cycles track the maximum length.",
          "Return the larger of the longest cycle and the pair total.",
        ],
        why: "In a cycle of length ≥ 3 each member's two neighbours are forced (its favourite and whoever favours it on the cycle), so the table holds exactly that cycle and nobody else. In a mutual pair both partners are already satisfied by each other, leaving their outer sides free for a chain leading in — but only one chain per side, the longest. Such open-ended segments can be concatenated around the table without conflict, so all pairs contribute together. The topological peel computes, for every cycle node, the longest chain of tree nodes ending at it.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Treating 2-cycles like long cycles (taking only the maximum) undercounts — pairs add up.",
          "Only one chain per partner of a pair can be seated, so use the deepest chain, not the whole tree.",
          "Chains into a long cycle are useless, since nobody on that cycle has a free side.",
        ],
      }),
      examples: [
        { input: "[1,0,0,1,3]", expectedOutput: "5" },
        { input: "[1,2,3,0,0]", expectedOutput: "4" },
        { input: "[1,2,0]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 6, 8, 10, 14, 20]);
        let fav: number[];
        if (rng() < 0.45) {
          fav = Array.from({ length: n }, (_, i) => {
            let f = ri(rng, 0, n - 2);
            if (f >= i) f++;
            return f;
          });
        } else {
          // Mutual pairs (and maybe one longer cycle) with chains and trees feeding into them.
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          fav = new Array(n).fill(-1);
          let used = 0;
          const pairs = ri(rng, 1, Math.max(1, Math.floor(n / 3)));
          for (let p = 0; p < pairs && used + 2 <= n; p++) {
            fav[order[used]] = order[used + 1];
            fav[order[used + 1]] = order[used];
            used += 2;
          }
          if (used + 3 <= n && rng() < 0.5) {
            const L = ri(rng, 3, Math.min(n - used, 8));
            for (let k = 0; k < L; k++) fav[order[used + k]] = order[used + ((k + 1) % L)];
            used += L;
          }
          for (let k = used; k < n; k++) fav[order[k]] = order[rng() < 0.6 ? k - 1 : ri(rng, 0, k - 1)];
        }
        return { input: fmtIntArr(fav), expectedOutput: String(ref(fav)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def maximumInvitations(favorite: List[int]) -> int:
              n = len(favorite)
              indeg = [0] * n
              for f in favorite:
                  indeg[f] += 1
              depth = [0] * n
              q = deque(i for i in range(n) if indeg[i] == 0)
              while q:
                  u = q.popleft()
                  v = favorite[u]
                  if depth[u] + 1 > depth[v]:
                      depth[v] = depth[u] + 1
                  indeg[v] -= 1
                  if indeg[v] == 0:
                      q.append(v)
              longest_cycle = 0
              pairs = 0
              for i in range(n):
                  if indeg[i] == 0:
                      continue
                  length = 0
                  j = i
                  while indeg[j] != 0:
                      indeg[j] = 0
                      length += 1
                      j = favorite[j]
                  if length == 2:
                      pairs += 2 + depth[i] + depth[favorite[i]]
                  else:
                      longest_cycle = max(longest_cycle, length)
              return max(longest_cycle, pairs)
        `,
        javascript: code`
          var maximumInvitations = function(favorite) {
              var n = favorite.length;
              var indeg = [], depth = [];
              for (var i = 0; i < n; i++) { indeg.push(0); depth.push(0); }
              for (var k = 0; k < n; k++) indeg[favorite[k]]++;
              var queue = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h], v = favorite[u];
                  if (depth[u] + 1 > depth[v]) depth[v] = depth[u] + 1;
                  if (--indeg[v] === 0) queue.push(v);
              }
              var longestCycle = 0, pairs = 0;
              for (var a = 0; a < n; a++) {
                  if (indeg[a] === 0) continue;
                  var len = 0, j = a;
                  while (indeg[j] !== 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len === 2) pairs += 2 + depth[a] + depth[favorite[a]];
                  else if (len > longestCycle) longestCycle = len;
              }
              return Math.max(longestCycle, pairs);
          };
        `,
        typescript: code`
          function maximumInvitations(favorite: number[]): number {
              var n = favorite.length;
              var indeg: number[] = [], depth: number[] = [];
              for (var i = 0; i < n; i++) { indeg.push(0); depth.push(0); }
              for (var k = 0; k < n; k++) indeg[favorite[k]]++;
              var queue: number[] = [];
              for (var s = 0; s < n; s++) if (indeg[s] === 0) queue.push(s);
              for (var h = 0; h < queue.length; h++) {
                  var u = queue[h], v = favorite[u];
                  if (depth[u] + 1 > depth[v]) depth[v] = depth[u] + 1;
                  if (--indeg[v] === 0) queue.push(v);
              }
              var longestCycle = 0, pairs = 0;
              for (var a = 0; a < n; a++) {
                  if (indeg[a] === 0) continue;
                  var len = 0, j = a;
                  while (indeg[j] !== 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len === 2) pairs += 2 + depth[a] + depth[favorite[a]];
                  else if (len > longestCycle) longestCycle = len;
              }
              return Math.max(longestCycle, pairs);
          }
        `,
        java: code`
          public static int maximumInvitations(int[] favorite) {
              int n = favorite.length;
              int[] indeg = new int[n], depth = new int[n], queue = new int[n];
              for (int f : favorite) indeg[f]++;
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              while (head < tail) {
                  int u = queue[head++], v = favorite[u];
                  depth[v] = Math.max(depth[v], depth[u] + 1);
                  if (--indeg[v] == 0) queue[tail++] = v;
              }
              int longestCycle = 0, pairs = 0;
              for (int i = 0; i < n; i++) {
                  if (indeg[i] == 0) continue;
                  int len = 0, j = i;
                  while (indeg[j] != 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len == 2) pairs += 2 + depth[i] + depth[favorite[i]];
                  else longestCycle = Math.max(longestCycle, len);
              }
              return Math.max(longestCycle, pairs);
          }
        `,
        cpp: code`
          int maximumInvitations(vector<int>& favorite) {
              int n = favorite.size();
              vector<int> indeg(n, 0), depth(n, 0), queue;
              for (int f : favorite) indeg[f]++;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
              for (size_t h = 0; h < queue.size(); h++) {
                  int u = queue[h], v = favorite[u];
                  depth[v] = max(depth[v], depth[u] + 1);
                  if (--indeg[v] == 0) queue.push_back(v);
              }
              int longestCycle = 0, pairs = 0;
              for (int i = 0; i < n; i++) {
                  if (indeg[i] == 0) continue;
                  int len = 0, j = i;
                  while (indeg[j] != 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len == 2) pairs += 2 + depth[i] + depth[favorite[i]];
                  else longestCycle = max(longestCycle, len);
              }
              return max(longestCycle, pairs);
          }
        `,
        c: code`
          int maximumInvitations(int* favorite, int favoriteSize) {
              int n = favoriteSize;
              int* indeg = (int*)calloc(n + 1, sizeof(int));
              int* depth = (int*)calloc(n + 1, sizeof(int));
              int* queue = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) indeg[favorite[i]]++;
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              while (head < tail) {
                  int u = queue[head++], v = favorite[u];
                  if (depth[u] + 1 > depth[v]) depth[v] = depth[u] + 1;
                  if (--indeg[v] == 0) queue[tail++] = v;
              }
              int longestCycle = 0, pairs = 0;
              for (int i = 0; i < n; i++) {
                  if (indeg[i] == 0) continue;
                  int len = 0, j = i;
                  while (indeg[j] != 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len == 2) pairs += 2 + depth[i] + depth[favorite[i]];
                  else if (len > longestCycle) longestCycle = len;
              }
              free(indeg);
              free(depth);
              free(queue);
              return longestCycle > pairs ? longestCycle : pairs;
          }
        `,
        csharp: code`
          public static int MaximumInvitations(int[] favorite)
          {
              int n = favorite.Length;
              int[] indeg = new int[n], depth = new int[n], queue = new int[n];
              foreach (int f in favorite) indeg[f]++;
              int head = 0, tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
              while (head < tail)
              {
                  int u = queue[head++], v = favorite[u];
                  depth[v] = Math.Max(depth[v], depth[u] + 1);
                  if (--indeg[v] == 0) queue[tail++] = v;
              }
              int longestCycle = 0, pairs = 0;
              for (int i = 0; i < n; i++)
              {
                  if (indeg[i] == 0) continue;
                  int len = 0, j = i;
                  while (indeg[j] != 0) { indeg[j] = 0; len++; j = favorite[j]; }
                  if (len == 2) pairs += 2 + depth[i] + depth[favorite[i]];
                  else longestCycle = Math.Max(longestCycle, len);
              }
              return Math.Max(longestCycle, pairs);
          }
        `,
        go: code`
          func maximumInvitations(favorite []int) int {
          	n := len(favorite)
          	indeg := make([]int, n)
          	depth := make([]int, n)
          	for _, f := range favorite {
          		indeg[f]++
          	}
          	queue := []int{}
          	for i := 0; i < n; i++ {
          		if indeg[i] == 0 {
          			queue = append(queue, i)
          		}
          	}
          	for h := 0; h < len(queue); h++ {
          		u := queue[h]
          		v := favorite[u]
          		if depth[u]+1 > depth[v] {
          			depth[v] = depth[u] + 1
          		}
          		indeg[v]--
          		if indeg[v] == 0 {
          			queue = append(queue, v)
          		}
          	}
          	longestCycle, pairs := 0, 0
          	for i := 0; i < n; i++ {
          		if indeg[i] == 0 {
          			continue
          		}
          		length, j := 0, i
          		for indeg[j] != 0 {
          			indeg[j] = 0
          			length++
          			j = favorite[j]
          		}
          		if length == 2 {
          			pairs += 2 + depth[i] + depth[favorite[i]]
          		} else if length > longestCycle {
          			longestCycle = length
          		}
          	}
          	if longestCycle > pairs {
          		return longestCycle
          	}
          	return pairs
          }
        `,
        kotlin: code`
          fun maximumInvitations(favorite: IntArray): Int {
              val n = favorite.size
              val indeg = IntArray(n)
              val depth = IntArray(n)
              val queue = IntArray(n)
              for (f in favorite) indeg[f]++
              var head = 0
              var tail = 0
              for (i in 0 until n) if (indeg[i] == 0) queue[tail++] = i
              while (head < tail) {
                  val u = queue[head++]
                  val v = favorite[u]
                  if (depth[u] + 1 > depth[v]) depth[v] = depth[u] + 1
                  indeg[v]--
                  if (indeg[v] == 0) queue[tail++] = v
              }
              var longestCycle = 0
              var pairs = 0
              for (i in 0 until n) {
                  if (indeg[i] == 0) continue
                  var len = 0
                  var j = i
                  while (indeg[j] != 0) { indeg[j] = 0; len++; j = favorite[j] }
                  if (len == 2) pairs += 2 + depth[i] + depth[favorite[i]]
                  else if (len > longestCycle) longestCycle = len
              }
              return maxOf(longestCycle, pairs)
          }
        `,
        swift: code`
          func maximumInvitations(_ favorite: [Int]) -> Int {
              let n = favorite.count
              var indeg = [Int](repeating: 0, count: n)
              var depth = [Int](repeating: 0, count: n)
              for f in favorite { indeg[f] += 1 }
              var queue = [Int]()
              for i in 0..<n where indeg[i] == 0 { queue.append(i) }
              var h = 0
              while h < queue.count {
                  let u = queue[h]
                  h += 1
                  let v = favorite[u]
                  if depth[u] + 1 > depth[v] { depth[v] = depth[u] + 1 }
                  indeg[v] -= 1
                  if indeg[v] == 0 { queue.append(v) }
              }
              var longestCycle = 0, pairs = 0
              for i in 0..<n {
                  if indeg[i] == 0 { continue }
                  var len = 0, j = i
                  while indeg[j] != 0 { indeg[j] = 0; len += 1; j = favorite[j] }
                  if len == 2 { pairs += 2 + depth[i] + depth[favorite[i]] }
                  else if len > longestCycle { longestCycle = len }
              }
              return max(longestCycle, pairs)
          }
        `,
        rust: code`
          fn maximumInvitations(favorite: Vec<i32>) -> i32 {
              let n = favorite.len();
              let fav: Vec<usize> = favorite.iter().map(|&f| f as usize).collect();
              let mut indeg = vec![0usize; n];
              let mut depth = vec![0i32; n];
              for &f in fav.iter() {
                  indeg[f] += 1;
              }
              let mut queue: Vec<usize> = Vec::new();
              for i in 0..n {
                  if indeg[i] == 0 {
                      queue.push(i);
                  }
              }
              let mut h = 0;
              while h < queue.len() {
                  let u = queue[h];
                  h += 1;
                  let v = fav[u];
                  if depth[u] + 1 > depth[v] {
                      depth[v] = depth[u] + 1;
                  }
                  indeg[v] -= 1;
                  if indeg[v] == 0 {
                      queue.push(v);
                  }
              }
              let mut longest_cycle = 0i32;
              let mut pairs = 0i32;
              for i in 0..n {
                  if indeg[i] == 0 {
                      continue;
                  }
                  let mut len = 0i32;
                  let mut j = i;
                  while indeg[j] != 0 {
                      indeg[j] = 0;
                      len += 1;
                      j = fav[j];
                  }
                  if len == 2 {
                      pairs += 2 + depth[i] + depth[fav[i]];
                  } else if len > longest_cycle {
                      longest_cycle = len;
                  }
              }
              if longest_cycle > pairs { longest_cycle } else { pairs }
          }
        `,
        php: code`
          function maximumInvitations($favorite) {
              $n = count($favorite);
              $indeg = array_fill(0, $n, 0);
              $depth = array_fill(0, $n, 0);
              foreach ($favorite as $f) $indeg[$f]++;
              $queue = [];
              for ($i = 0; $i < $n; $i++) if ($indeg[$i] == 0) $queue[] = $i;
              for ($h = 0; $h < count($queue); $h++) {
                  $u = $queue[$h];
                  $v = $favorite[$u];
                  if ($depth[$u] + 1 > $depth[$v]) $depth[$v] = $depth[$u] + 1;
                  $indeg[$v]--;
                  if ($indeg[$v] == 0) $queue[] = $v;
              }
              $longestCycle = 0;
              $pairs = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($indeg[$i] == 0) continue;
                  $len = 0;
                  $j = $i;
                  while ($indeg[$j] != 0) { $indeg[$j] = 0; $len++; $j = $favorite[$j]; }
                  if ($len == 2) $pairs += 2 + $depth[$i] + $depth[$favorite[$i]];
                  elseif ($len > $longestCycle) $longestCycle = $len;
              }
              return $longestCycle > $pairs ? $longestCycle : $pairs;
          }
        `,
        ruby: code`
          def maximumInvitations(favorite)
            n = favorite.length
            indeg = Array.new(n, 0)
            depth = Array.new(n, 0)
            favorite.each { |f| indeg[f] += 1 }
            queue = (0...n).select { |i| indeg[i] == 0 }
            h = 0
            while h < queue.length
              u = queue[h]
              h += 1
              v = favorite[u]
              depth[v] = depth[u] + 1 if depth[u] + 1 > depth[v]
              indeg[v] -= 1
              queue << v if indeg[v] == 0
            end
            longest_cycle = 0
            pairs = 0
            n.times do |i|
              next if indeg[i] == 0
              len = 0
              j = i
              while indeg[j] != 0
                indeg[j] = 0
                len += 1
                j = favorite[j]
              end
              if len == 2
                pairs += 2 + depth[i] + depth[favorite[i]]
              elsif len > longest_cycle
                longest_cycle = len
              end
            end
            [longest_cycle, pairs].max
          end
        `,
      },
    };
  })(),

  // ── All Ancestors of a Node in a Directed Acyclic Graph (LC 2192) ──
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const reach = Array.from({ length: n }, () => new Array(n).fill(false));
      for (const [a, b] of edges) reach[a][b] = true;
      for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (reach[i][k]) for (let j = 0; j < n; j++) if (reach[k][j]) reach[i][j] = true;
      return Array.from({ length: n }, (_, v) => {
        const out: number[] = [];
        for (let u = 0; u < n; u++) if (reach[u][v]) out.push(u);
        return out;
      });
    };
    return {
      slug: "all-ancestors-of-a-node-in-a-directed-acyclic-graph",
      title: "All Ancestors of a Node in a Directed Acyclic Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Depth-First Search", "Breadth-First Search", "Topological Sort", "Amazon", "Google"],
      signature: {
        funcName: "getAncestors",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "A directed acyclic graph has `n` nodes numbered `0` to `n - 1`; each `edges[i] = [fromi, toi]` is a one-way edge from `fromi` to `toi`.\n\nNode `u` is an **ancestor** of node `v` if `v` can be reached from `u` by following one or more edges.\n\nReturn a list `answer` where `answer[i]` holds every ancestor of node `i`, sorted in **ascending** order.",
        [
          { in: "n = 5, edges = [[0,2],[1,2],[2,3],[3,4],[1,4]]", out: "[[],[],[0,1],[0,1,2],[0,1,2,3]]" },
          { in: "n = 4, edges = [[3,0],[2,1]]", out: "[[3],[2],[],[]]" },
          { in: "n = 1, edges = []", out: "[[]]" },
        ],
        ["1 <= n <= 1000", "0 <= edges.length <= min(2000, n * (n - 1) / 2)", "edges[i].length == 2", "0 <= fromi, toi <= n - 1", "fromi != toi", "there are no duplicate edges", "the graph is directed and acyclic"]),
      hints: [
        "u is an ancestor of v exactly when a search starting at u reaches v.",
        "Run a DFS or BFS from every node and record the source in the list of each node it reaches.",
        "If you launch the searches from node 0, 1, 2, … in order, every list is filled in ascending order already — no sorting needed.",
      ],
      editorial: explain({
        idea: "Instead of searching backwards from each node, search forwards from each potential ancestor: every node a search from `s` reaches gets `s` appended to its list.",
        steps: [
          "Build forward adjacency lists.",
          "For `s = 0, 1, …, n − 1`: run an iterative DFS from `s` with a fresh visited array.",
          "Every newly visited node `v` (other than `s`) gets `s` appended to `answer[v]`.",
          "Return `answer`.",
        ],
        why: "`s` is appended to `answer[v]` exactly when `v` is reachable from `s`, which is the definition of an ancestor; the visited array ensures it is appended once. Because sources are processed in increasing order, each list receives its entries in increasing order.",
        time: "O(n · (n + m))",
        space: "O(n + m) plus the output",
        pitfalls: [
          "Reset the visited marks for each new source, or later sources miss nodes an earlier search already saw.",
          "Nodes with no ancestors still need an (empty) entry in the answer.",
          "Collecting ancestors by merging parents' sets also works but needs deduplication and sorting.",
        ],
      }),
      examples: [
        { input: "5\n[[0,2],[1,2],[2,3],[3,4],[1,4]]", expectedOutput: "[[],[],[0,1],[0,1,2],[0,1,2,3]]" },
        { input: "4\n[[3,0],[2,1]]", expectedOutput: "[[3],[2],[],[]]" },
        { input: "1\n[]", expectedOutput: "[[]]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 5, 7, 10, 12, 15]);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const cap = (n * (n - 1)) / 2;
        const m = ri(rng, 0, Math.min(cap, pick(rng, [n, 2 * n, cap])));
        const edges = allPairs(rng, n, 0).slice(0, m).map(([i, j]) => [order[i], order[j]]);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntMat(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getAncestors(n: int, edges: List[List[int]]) -> List[List[int]]:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
              ans = [[] for _ in range(n)]
              for s in range(n):
                  seen = [False] * n
                  seen[s] = True
                  stack = [s]
                  while stack:
                      u = stack.pop()
                      for v in adj[u]:
                          if not seen[v]:
                              seen[v] = True
                              ans[v].append(s)
                              stack.append(v)
              return ans
        `,
        javascript: code`
          var getAncestors = function(n, edges) {
              var adj = [], ans = [];
              for (var i = 0; i < n; i++) { adj.push([]); ans.push([]); }
              for (var e = 0; e < edges.length; e++) adj[edges[e][0]].push(edges[e][1]);
              for (var s = 0; s < n; s++) {
                  var seen = [];
                  for (var k = 0; k < n; k++) seen.push(false);
                  seen[s] = true;
                  var stack = [s];
                  while (stack.length > 0) {
                      var u = stack.pop();
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (!seen[v]) { seen[v] = true; ans[v].push(s); stack.push(v); }
                      }
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function getAncestors(n: number, edges: number[][]): number[][] {
              var adj: number[][] = [], ans: number[][] = [];
              for (var i = 0; i < n; i++) { adj.push([]); ans.push([]); }
              for (var e = 0; e < edges.length; e++) adj[edges[e][0]].push(edges[e][1]);
              for (var s = 0; s < n; s++) {
                  var seen: boolean[] = [];
                  for (var k = 0; k < n; k++) seen.push(false);
                  seen[s] = true;
                  var stack: number[] = [s];
                  while (stack.length > 0) {
                      var u = stack.pop() as number;
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (!seen[v]) { seen[v] = true; ans[v].push(s); stack.push(v); }
                      }
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int[][] getAncestors(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>(), anc = new ArrayList<>();
              for (int i = 0; i < n; i++) { adj.add(new ArrayList<>()); anc.add(new ArrayList<>()); }
              for (int[] e : edges) adj.get(e[0]).add(e[1]);
              int[] stack = new int[n + 1];
              for (int s = 0; s < n; s++) {
                  boolean[] seen = new boolean[n];
                  seen[s] = true;
                  int top = 0;
                  stack[top++] = s;
                  while (top > 0) {
                      int u = stack[--top];
                      for (int v : adj.get(u)) {
                          if (!seen[v]) { seen[v] = true; anc.get(v).add(s); stack[top++] = v; }
                      }
                  }
              }
              int[][] res = new int[n][];
              for (int v = 0; v < n; v++) {
                  res[v] = new int[anc.get(v).size()];
                  for (int k = 0; k < res[v].length; k++) res[v][k] = anc.get(v).get(k);
              }
              return res;
          }
        `,
        cpp: code`
          vector<vector<int>> getAncestors(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n), ans(n);
              for (auto& e : edges) adj[e[0]].push_back(e[1]);
              vector<int> stack;
              for (int s = 0; s < n; s++) {
                  vector<char> seen(n, 0);
                  seen[s] = 1;
                  stack.assign(1, s);
                  while (!stack.empty()) {
                      int u = stack.back();
                      stack.pop_back();
                      for (int v : adj[u]) {
                          if (!seen[v]) { seen[v] = 1; ans[v].push_back(s); stack.push_back(v); }
                      }
                  }
              }
              return ans;
          }
        `,
        c: code`
          int** getAncestors(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize, int** returnColumnSizes) {
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) first[edges[e][0] + 1]++;
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* adj = (int*)malloc((edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) adj[fill[edges[e][0]]++] = edges[e][1];
              /* reach[s * n + v] == 1 when s is an ancestor of v */
              char* reach = (char*)calloc((size_t)n * n + 1, 1);
              int* stack = (int*)malloc((n + 1) * sizeof(int));
              for (int s = 0; s < n; s++) {
                  int top = 0;
                  stack[top++] = s;
                  while (top > 0) {
                      int u = stack[--top];
                      for (int k = first[u]; k < first[u + 1]; k++) {
                          int v = adj[k];
                          if (v != s && !reach[(size_t)s * n + v]) { reach[(size_t)s * n + v] = 1; stack[top++] = v; }
                      }
                  }
              }
              int** res = (int**)malloc((n + 1) * sizeof(int*));
              int* cols = (int*)malloc((n + 1) * sizeof(int));
              for (int v = 0; v < n; v++) {
                  int c = 0;
                  for (int s = 0; s < n; s++) if (reach[(size_t)s * n + v]) c++;
                  res[v] = (int*)malloc((c + 1) * sizeof(int));
                  cols[v] = 0;
                  for (int s = 0; s < n; s++) if (reach[(size_t)s * n + v]) res[v][cols[v]++] = s;
              }
              free(first);
              free(fill);
              free(adj);
              free(reach);
              free(stack);
              *returnSize = n;
              *returnColumnSizes = cols;
              return res;
          }
        `,
        csharp: code`
          public static int[][] GetAncestors(int n, int[][] edges)
          {
              var adj = new List<int>[n];
              var anc = new List<int>[n];
              for (int i = 0; i < n; i++) { adj[i] = new List<int>(); anc[i] = new List<int>(); }
              foreach (var e in edges) adj[e[0]].Add(e[1]);
              int[] stack = new int[n + 1];
              for (int s = 0; s < n; s++)
              {
                  bool[] seen = new bool[n];
                  seen[s] = true;
                  int top = 0;
                  stack[top++] = s;
                  while (top > 0)
                  {
                      int u = stack[--top];
                      foreach (int v in adj[u])
                      {
                          if (!seen[v]) { seen[v] = true; anc[v].Add(s); stack[top++] = v; }
                      }
                  }
              }
              int[][] res = new int[n][];
              for (int v = 0; v < n; v++) res[v] = anc[v].ToArray();
              return res;
          }
        `,
        go: code`
          func getAncestors(n int, edges [][]int) [][]int {
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          	}
          	ans := make([][]int, n)
          	for i := range ans {
          		ans[i] = []int{}
          	}
          	for s := 0; s < n; s++ {
          		seen := make([]bool, n)
          		seen[s] = true
          		stack := []int{s}
          		for len(stack) > 0 {
          			u := stack[len(stack)-1]
          			stack = stack[:len(stack)-1]
          			for _, v := range adj[u] {
          				if !seen[v] {
          					seen[v] = true
          					ans[v] = append(ans[v], s)
          					stack = append(stack, v)
          				}
          			}
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun getAncestors(n: Int, edges: Array<IntArray>): Array<IntArray> {
              val adj = Array(n) { ArrayList<Int>() }
              val anc = Array(n) { ArrayList<Int>() }
              for (e in edges) adj[e[0]].add(e[1])
              val stack = IntArray(n + 1)
              for (s in 0 until n) {
                  val seen = BooleanArray(n)
                  seen[s] = true
                  var top = 0
                  stack[top++] = s
                  while (top > 0) {
                      val u = stack[--top]
                      for (v in adj[u]) {
                          if (!seen[v]) { seen[v] = true; anc[v].add(s); stack[top++] = v }
                      }
                  }
              }
              return Array(n) { anc[it].toIntArray() }
          }
        `,
        swift: code`
          func getAncestors(_ n: Int, _ edges: [[Int]]) -> [[Int]] {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]) }
              var ans = [[Int]](repeating: [], count: n)
              for s in 0..<n {
                  var seen = [Bool](repeating: false, count: n)
                  seen[s] = true
                  var stack = [s]
                  while let u = stack.popLast() {
                      for v in adj[u] where !seen[v] {
                          seen[v] = true
                          ans[v].append(s)
                          stack.append(v)
                      }
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn getAncestors(n: i32, edges: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
              }
              let mut ans: Vec<Vec<i32>> = vec![Vec::new(); n];
              for s in 0..n {
                  let mut seen = vec![false; n];
                  seen[s] = true;
                  let mut stack = vec![s];
                  while let Some(u) = stack.pop() {
                      for &v in adj[u].iter() {
                          if !seen[v] {
                              seen[v] = true;
                              ans[v].push(s as i32);
                              stack.push(v);
                          }
                      }
                  }
              }
              ans
          }
        `,
        php: code`
          function getAncestors($n, $edges) {
              $adj = array_fill(0, $n, []);
              $ans = array_fill(0, $n, []);
              foreach ($edges as $e) $adj[$e[0]][] = $e[1];
              for ($s = 0; $s < $n; $s++) {
                  $seen = array_fill(0, $n, false);
                  $seen[$s] = true;
                  $stack = [$s];
                  while (count($stack) > 0) {
                      $u = array_pop($stack);
                      foreach ($adj[$u] as $v) {
                          if (!$seen[$v]) { $seen[$v] = true; $ans[$v][] = $s; $stack[] = $v; }
                      }
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def getAncestors(n, edges)
            adj = Array.new(n) { [] }
            edges.each { |a, b| adj[a] << b }
            ans = Array.new(n) { [] }
            n.times do |s|
              seen = Array.new(n, false)
              seen[s] = true
              stack = [s]
              until stack.empty?
                u = stack.pop
                adj[u].each do |v|
                  next if seen[v]
                  seen[v] = true
                  ans[v] << s
                  stack << v
                end
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Longest Path With Different Adjacent Characters (LC 2246) ───
  (() => {
    const ref = (parent: number[], s: string) => {
      // From every start, walk the tree using only edges whose ends differ.
      const n = parent.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 1; i < n; i++) if (s[i] !== s[parent[i]]) { adj[i].push(parent[i]); adj[parent[i]].push(i); }
      let best = 1;
      for (let st = 0; st < n; st++) {
        const dist = new Array(n).fill(-1);
        dist[st] = 1;
        const stack = [st];
        while (stack.length) {
          const u = stack.pop()!;
          best = Math.max(best, dist[u]);
          for (const v of adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; stack.push(v); }
        }
      }
      return best;
    };
    return {
      slug: "longest-path-with-different-adjacent-characters",
      title: "Longest Path With Different Adjacent Characters",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Tree", "Depth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "longestPath",
        params: [{ name: "parent", type: "int[]" as const }, { name: "s", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A tree has `n` nodes numbered `0` to `n - 1` and is rooted at node `0`. It is given by the array `parent`, where `parent[i]` is the parent of node `i`; the root has `parent[0] == -1`. Node `i` is labelled with the character `s[i]`.\n\nA path is a sequence of distinct nodes in which each consecutive pair is joined by a tree edge (it may go up and then down). Return the number of nodes on the **longest** path in which **no two adjacent nodes** carry the same character.",
        [
          { in: "parent = [-1,0,0,1,1,2], s = \"kairok\"", out: "5", note: "Every edge joins different letters, so the longest path 3 → 1 → 0 → 2 → 5 counts." },
          { in: "parent = [-1,0,1,2], s = \"abba\"", out: "2", note: "The edge between nodes 1 and 2 joins two `b`s, splitting the chain." },
          { in: "parent = [-1], s = \"z\"", out: "1" },
        ],
        ["n == parent.length == s.length", "1 <= n <= 10^5", "0 <= parent[i] <= n - 1 for all i >= 1", "parent[0] == -1", "parent represents a valid tree", "s consists of only lowercase English letters"]),
      hints: [
        "Throw away every edge whose two ends have the same letter — the answer is the longest path (diameter, counted in nodes) in what remains.",
        "Root the tree at 0. For every node, compute the longest valid downward chain starting at it.",
        "A best path bends at its highest node: combine that node with its two longest child chains (only children whose letter differs). Process nodes children-first, e.g. in reverse BFS order, to avoid deep recursion.",
      ],
      editorial: explain({
        idea: "This is a tree-diameter computation where an edge counts only if its endpoints differ. Every path has a unique highest node, where it joins at most two downward chains.",
        steps: [
          "Build child lists from `parent` and produce a BFS order from the root.",
          "Walk the order backwards (children before parents). For node `u`, look at children `v` with `s[v] != s[u]` and keep the two largest values of `chain[v]`.",
          "Set `chain[u] = 1 + top1`, and update the answer with `1 + top1 + top2`.",
          "Return the best value found (at least 1).",
        ],
        why: "Any valid path has a highest node `u`; the parts below `u` are downward chains through two different children (or fewer), each starting at a child whose letter differs from `u`'s. The longest such chains are exactly `top1` and `top2`, so `1 + top1 + top2` is the best path whose top is `u`; maximising over all `u` covers every path. Reverse BFS order guarantees each child's chain is final before its parent reads it.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A child with the same letter contributes nothing to `u`, but its own subtree can still hold the answer — never skip visiting it.",
          "`parent[i] < i` is not guaranteed, so you cannot simply loop indices downward; use a real traversal order.",
          "Recursion depth can reach 10^5 on a chain — prefer an iterative order.",
        ],
      }),
      examples: [
        { input: "[-1,0,0,1,1,2]\n\"kairok\"", expectedOutput: "5" },
        { input: "[-1,0,1,2]\n\"abba\"", expectedOutput: "2" },
        { input: "[-1]\n\"z\"", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 5, 8, 12, 16, 22, 30]);
        const order = [0].concat(shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1)));
        const parent = new Array(n).fill(-1);
        const chainy = rng() < 0.4;
        for (let i = 1; i < n; i++) parent[order[i]] = order[chainy ? Math.max(0, i - ri(rng, 1, 2)) : ri(rng, 0, i - 1)];
        const alphabet = pick(rng, ["a", "ab", "ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, n, n, alphabet);
        return { input: `${fmtIntArr(parent)}\n"${s}"`, expectedOutput: String(ref(parent, s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestPath(parent: List[int], s: str) -> int:
              n = len(parent)
              children = [[] for _ in range(n)]
              for i in range(1, n):
                  children[parent[i]].append(i)
              order = [0]
              for u in order:
                  order.extend(children[u])
              chain = [1] * n
              best = 1
              for u in reversed(order):
                  top1 = top2 = 0
                  for v in children[u]:
                      if s[v] != s[u]:
                          c = chain[v]
                          if c > top1:
                              top1, top2 = c, top1
                          elif c > top2:
                              top2 = c
                  chain[u] = 1 + top1
                  if 1 + top1 + top2 > best:
                      best = 1 + top1 + top2
              return best
        `,
        javascript: code`
          var longestPath = function(parent, s) {
              var n = parent.length;
              var children = [];
              for (var i = 0; i < n; i++) children.push([]);
              for (var k = 1; k < n; k++) children[parent[k]].push(k);
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var kids = children[order[h]];
                  for (var j = 0; j < kids.length; j++) order.push(kids[j]);
              }
              var chain = [];
              for (var c = 0; c < n; c++) chain.push(1);
              var best = 1;
              for (var t = n - 1; t >= 0; t--) {
                  var u = order[t], top1 = 0, top2 = 0;
                  for (var q = 0; q < children[u].length; q++) {
                      var v = children[u][q];
                      if (s.charAt(v) === s.charAt(u)) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  if (1 + top1 + top2 > best) best = 1 + top1 + top2;
              }
              return best;
          };
        `,
        typescript: code`
          function longestPath(parent: number[], s: string): number {
              var n = parent.length;
              var children: number[][] = [];
              for (var i = 0; i < n; i++) children.push([]);
              for (var k = 1; k < n; k++) children[parent[k]].push(k);
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var kids = children[order[h]];
                  for (var j = 0; j < kids.length; j++) order.push(kids[j]);
              }
              var chain: number[] = [];
              for (var c = 0; c < n; c++) chain.push(1);
              var best = 1;
              for (var t = n - 1; t >= 0; t--) {
                  var u = order[t], top1 = 0, top2 = 0;
                  for (var q = 0; q < children[u].length; q++) {
                      var v = children[u][q];
                      if (s.charAt(v) === s.charAt(u)) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  if (1 + top1 + top2 > best) best = 1 + top1 + top2;
              }
              return best;
          }
        `,
        java: code`
          public static int longestPath(int[] parent, String s) {
              int n = parent.length;
              List<List<Integer>> children = new ArrayList<>();
              for (int i = 0; i < n; i++) children.add(new ArrayList<>());
              for (int i = 1; i < n; i++) children.get(parent[i]).add(i);
              int[] order = new int[n];
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) for (int v : children.get(order[h])) order[tail++] = v;
              int[] chain = new int[n];
              int best = 1;
              for (int t = n - 1; t >= 0; t--) {
                  int u = order[t], top1 = 0, top2 = 0;
                  for (int v : children.get(u)) {
                      if (s.charAt(v) == s.charAt(u)) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  best = Math.max(best, 1 + top1 + top2);
              }
              return best;
          }
        `,
        cpp: code`
          int longestPath(vector<int>& parent, string s) {
              int n = parent.size();
              vector<vector<int>> children(n);
              for (int i = 1; i < n; i++) children[parent[i]].push_back(i);
              vector<int> order;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) for (int v : children[order[h]]) order.push_back(v);
              vector<int> chain(n, 1);
              int best = 1;
              for (int t = n - 1; t >= 0; t--) {
                  int u = order[t], top1 = 0, top2 = 0;
                  for (int v : children[u]) {
                      if (s[v] == s[u]) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  best = max(best, 1 + top1 + top2);
              }
              return best;
          }
        `,
        c: code`
          int longestPath(int* parent, int parentSize, const char* s) {
              int n = parentSize;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int i = 1; i < n; i++) first[parent[i] + 1]++;
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* kids = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 1; i < n; i++) kids[fill[parent[i]]++] = i;
              int* order = (int*)malloc((n + 1) * sizeof(int));
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
                  for (int k = first[order[h]]; k < first[order[h] + 1]; k++) order[tail++] = kids[k];
              int* chain = (int*)malloc((n + 1) * sizeof(int));
              int best = 1;
              for (int t = n - 1; t >= 0; t--) {
                  int u = order[t], top1 = 0, top2 = 0;
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = kids[k];
                      if (s[v] == s[u]) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  if (1 + top1 + top2 > best) best = 1 + top1 + top2;
              }
              free(first);
              free(fill);
              free(kids);
              free(order);
              free(chain);
              return best;
          }
        `,
        csharp: code`
          public static int LongestPath(int[] parent, string s)
          {
              int n = parent.Length;
              var children = new List<int>[n];
              for (int i = 0; i < n; i++) children[i] = new List<int>();
              for (int i = 1; i < n; i++) children[parent[i]].Add(i);
              int[] order = new int[n];
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) foreach (int v in children[order[h]]) order[tail++] = v;
              int[] chain = new int[n];
              int best = 1;
              for (int t = n - 1; t >= 0; t--)
              {
                  int u = order[t], top1 = 0, top2 = 0;
                  foreach (int v in children[u])
                  {
                      if (s[v] == s[u]) continue;
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v]; }
                      else if (chain[v] > top2) top2 = chain[v];
                  }
                  chain[u] = 1 + top1;
                  best = Math.Max(best, 1 + top1 + top2);
              }
              return best;
          }
        `,
        go: code`
          func longestPath(parent []int, s string) int {
          	n := len(parent)
          	children := make([][]int, n)
          	for i := 1; i < n; i++ {
          		children[parent[i]] = append(children[parent[i]], i)
          	}
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		order = append(order, children[order[h]]...)
          	}
          	chain := make([]int, n)
          	best := 1
          	for t := n - 1; t >= 0; t-- {
          		u := order[t]
          		top1, top2 := 0, 0
          		for _, v := range children[u] {
          			if s[v] == s[u] {
          				continue
          			}
          			if chain[v] > top1 {
          				top2 = top1
          				top1 = chain[v]
          			} else if chain[v] > top2 {
          				top2 = chain[v]
          			}
          		}
          		chain[u] = 1 + top1
          		if 1+top1+top2 > best {
          			best = 1 + top1 + top2
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun longestPath(parent: IntArray, s: String): Int {
              val n = parent.size
              val children = Array(n) { ArrayList<Int>() }
              for (i in 1 until n) children[parent[i]].add(i)
              val order = IntArray(n)
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  for (v in children[order[h]]) order[tail++] = v
                  h++
              }
              val chain = IntArray(n)
              var best = 1
              for (t in n - 1 downTo 0) {
                  val u = order[t]
                  var top1 = 0
                  var top2 = 0
                  for (v in children[u]) {
                      if (s[v] == s[u]) continue
                      if (chain[v] > top1) { top2 = top1; top1 = chain[v] }
                      else if (chain[v] > top2) top2 = chain[v]
                  }
                  chain[u] = 1 + top1
                  best = maxOf(best, 1 + top1 + top2)
              }
              return best
          }
        `,
        swift: code`
          func longestPath(_ parent: [Int], _ s: String) -> Int {
              let n = parent.count
              let chars = Array(s.utf8)
              var children = [[Int]](repeating: [], count: n)
              for i in 1..<max(n, 1) { children[parent[i]].append(i) }
              var order = [0]
              var h = 0
              while h < order.count {
                  order.append(contentsOf: children[order[h]])
                  h += 1
              }
              var chain = [Int](repeating: 1, count: n)
              var best = 1
              for t in stride(from: n - 1, through: 0, by: -1) {
                  let u = order[t]
                  var top1 = 0, top2 = 0
                  for v in children[u] where chars[v] != chars[u] {
                      if chain[v] > top1 { top2 = top1; top1 = chain[v] }
                      else if chain[v] > top2 { top2 = chain[v] }
                  }
                  chain[u] = 1 + top1
                  best = max(best, 1 + top1 + top2)
              }
              return best
          }
        `,
        rust: code`
          fn longestPath(parent: Vec<i32>, s: String) -> i32 {
              let n = parent.len();
              let ch = s.as_bytes();
              let mut children: Vec<Vec<usize>> = vec![Vec::new(); n];
              for i in 1..n {
                  children[parent[i] as usize].push(i);
              }
              let mut order: Vec<usize> = vec![0];
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  for &v in children[u].iter() {
                      order.push(v);
                  }
                  h += 1;
              }
              let mut chain = vec![1i32; n];
              let mut best = 1;
              for t in (0..n).rev() {
                  let u = order[t];
                  let mut top1 = 0;
                  let mut top2 = 0;
                  for &v in children[u].iter() {
                      if ch[v] == ch[u] {
                          continue;
                      }
                      if chain[v] > top1 {
                          top2 = top1;
                          top1 = chain[v];
                      } else if chain[v] > top2 {
                          top2 = chain[v];
                      }
                  }
                  chain[u] = 1 + top1;
                  if 1 + top1 + top2 > best {
                      best = 1 + top1 + top2;
                  }
              }
              best
          }
        `,
        php: code`
          function longestPath($parent, $s) {
              $n = count($parent);
              $children = array_fill(0, $n, []);
              for ($i = 1; $i < $n; $i++) $children[$parent[$i]][] = $i;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  foreach ($children[$order[$h]] as $v) $order[] = $v;
              }
              $chain = array_fill(0, $n, 1);
              $best = 1;
              for ($t = $n - 1; $t >= 0; $t--) {
                  $u = $order[$t];
                  $top1 = 0;
                  $top2 = 0;
                  foreach ($children[$u] as $v) {
                      if ($s[$v] === $s[$u]) continue;
                      if ($chain[$v] > $top1) { $top2 = $top1; $top1 = $chain[$v]; }
                      elseif ($chain[$v] > $top2) $top2 = $chain[$v];
                  }
                  $chain[$u] = 1 + $top1;
                  if (1 + $top1 + $top2 > $best) $best = 1 + $top1 + $top2;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestPath(parent, s)
            n = parent.length
            children = Array.new(n) { [] }
            (1...n).each { |i| children[parent[i]] << i }
            order = [0]
            h = 0
            while h < order.length
              order.concat(children[order[h]])
              h += 1
            end
            chain = Array.new(n, 1)
            best = 1
            order.reverse_each do |u|
              top1 = 0
              top2 = 0
              children[u].each do |v|
                next if s[v] == s[u]
                if chain[v] > top1
                  top2 = top1
                  top1 = chain[v]
                elsif chain[v] > top2
                  top2 = chain[v]
                end
              end
              chain[u] = 1 + top1
              best = 1 + top1 + top2 if 1 + top1 + top2 > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Divide Nodes Into the Maximum Number of Groups (LC 2493) ────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // All-pairs distances; a component works iff no edge has both ends at the same
      // distance from one of its nodes, and then it splits into (diameter + 1) groups.
      const INF = 1e9;
      const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === j ? 0 : INF)));
      for (const [a, b] of edges) { d[a][b] = 1; d[b][a] = 1; }
      for (let k = 1; k <= n; k++) for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
      const done = new Array(n + 1).fill(false);
      let total = 0;
      for (let r = 1; r <= n; r++) {
        if (done[r]) continue;
        const members: number[] = [];
        for (let v = 1; v <= n; v++) if (d[r][v] < INF) { members.push(v); done[v] = true; }
        for (const [a, b] of edges) if (d[r][a] < INF && d[r][a] === d[r][b]) return -1;
        let diam = 0;
        for (const u of members) for (const v of members) diam = Math.max(diam, d[u][v]);
        total += diam + 1;
      }
      return total;
    };
    return {
      slug: "divide-nodes-into-the-maximum-number-of-groups",
      title: "Divide Nodes Into the Maximum Number of Groups",
      difficulty: "HARD" as const,
      tags: ["Graph", "Breadth-First Search", "Union Find", "Google", "Amazon"],
      signature: {
        funcName: "magnificentSets",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected graph has `n` nodes labelled `1` to `n` and the edges in `edges` (each `[ai, bi]`). The graph may be disconnected.\n\nSplit the nodes into `m` groups, indexed `1` to `m`, so that every node belongs to exactly one group and, for **every** edge `[ai, bi]`, if `ai` is in group `x` and `bi` is in group `y`, then `|y - x| == 1`.\n\nReturn the **maximum** number of groups `m` for which such a split exists, or `-1` if no split is possible.",
        [
          { in: "n = 5, edges = [[1,2],[2,3],[3,4],[1,4],[5,2]]", out: "4", note: "Groups {5}, {2}, {1,3}, {4}: every edge joins consecutive groups." },
          { in: "n = 5, edges = [[1,2],[3,4]]", out: "5", note: "Each piece is laid out separately: {1},{2} then {3},{4} then {5}." },
          { in: "n = 4, edges = [[2,3],[3,4],[4,2],[1,2]]", out: "-1", note: "Nodes 2, 3, 4 form a triangle, and an odd cycle can never alternate between consecutive groups." },
        ],
        ["1 <= n <= 500", "1 <= edges.length <= 10^4", "edges[i].length == 2", "1 <= ai, bi <= n", "ai != bi", "there is at most one edge between any pair of vertices"]),
      hints: [
        "Connected components are independent: their group sequences can be stacked one after another, so the answer is a sum over components.",
        "Within a component, consecutive-group edges mean the graph must be bipartite; any odd cycle makes the task impossible.",
        "If you fix the node placed in the first group, BFS layers are the best you can do. Try every node as the start, keep the deepest layering per component, and return -1 if any BFS finds an edge inside one layer.",
      ],
      editorial: explain({
        idea: "Groups behave like BFS layers. For a bipartite component the best layering starts from the node with the greatest eccentricity, giving `eccentricity + 1` groups; any edge inside a layer means an odd cycle and the answer is -1.",
        steps: [
          "Label connected components.",
          "From every node `s`, BFS and record the number of layers (`maximum distance + 1`). If an edge joins two nodes at the same distance, return -1.",
          "For each component keep the maximum layer count over its nodes.",
          "Return the sum over all components.",
        ],
        why: "In any valid grouping, adjacent nodes sit in consecutive groups, so the group numbers of a component span at most `ecc(s) + 1` values when measured from the node `s` in the lowest group — distances bound the spread. BFS layering from `s` achieves exactly that bound and is valid whenever no edge stays inside a layer, which holds precisely for bipartite components. Separate components can occupy disjoint ranges of group indices, so their counts add.",
        time: "O(n · (n + m))",
        space: "O(n + m)",
        pitfalls: [
          "Taking only one BFS per component (from an arbitrary node) can undercount — the start node matters.",
          "Remember isolated nodes: each contributes one group.",
          "Components are summed, not maximised.",
        ],
      }),
      examples: [
        { input: "5\n[[1,2],[2,3],[3,4],[1,4],[5,2]]", expectedOutput: "4" },
        { input: "5\n[[1,2],[3,4]]", expectedOutput: "5" },
        { input: "4\n[[2,3],[3,4],[4,2],[1,2]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
        const cap = (n * (n - 1)) / 2;
        const m = ri(rng, 1, Math.min(cap, pick(rng, [n - 1, n, 2 * n])));
        let edges: number[][];
        if (rng() < 0.65) {
          const side = Array.from({ length: n + 1 }, () => ri(rng, 0, 1));
          const pairs = allPairs(rng, n, 1).filter(([a, b]) => side[a] !== side[b]);
          edges = pairs.length ? pairs.slice(0, Math.max(1, Math.min(m, pairs.length))) : [[1, 2]];
        } else {
          edges = randomSimpleEdges(rng, n, m, 1);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def magnificentSets(n: int, edges: List[List[int]]) -> int:
              adj = [[] for _ in range(n + 1)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              comp = [0] * (n + 1)
              cid = 0
              for i in range(1, n + 1):
                  if comp[i] == 0:
                      cid += 1
                      comp[i] = cid
                      stack = [i]
                      while stack:
                          u = stack.pop()
                          for v in adj[u]:
                              if comp[v] == 0:
                                  comp[v] = cid
                                  stack.append(v)
              best = [0] * (cid + 1)
              for s in range(1, n + 1):
                  dist = [-1] * (n + 1)
                  dist[s] = 0
                  q = deque([s])
                  far = 0
                  while q:
                      u = q.popleft()
                      far = dist[u]
                      for v in adj[u]:
                          if dist[v] < 0:
                              dist[v] = dist[u] + 1
                              q.append(v)
                          elif dist[v] == dist[u]:
                              return -1
                  if far + 1 > best[comp[s]]:
                      best[comp[s]] = far + 1
              return sum(best)
        `,
        javascript: code`
          var magnificentSets = function(n, edges) {
              var adj = [];
              for (var i = 0; i <= n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var comp = [], cid = 0;
              for (var k = 0; k <= n; k++) comp.push(0);
              for (var r = 1; r <= n; r++) {
                  if (comp[r] !== 0) continue;
                  cid++;
                  comp[r] = cid;
                  var stack = [r];
                  while (stack.length > 0) {
                      var x = stack.pop();
                      for (var j = 0; j < adj[x].length; j++) {
                          var y = adj[x][j];
                          if (comp[y] === 0) { comp[y] = cid; stack.push(y); }
                      }
                  }
              }
              var best = [];
              for (var c = 0; c <= cid; c++) best.push(0);
              for (var s = 1; s <= n; s++) {
                  var dist = [];
                  for (var t = 0; t <= n; t++) dist.push(-1);
                  dist[s] = 0;
                  var queue = [s], far = 0;
                  for (var h = 0; h < queue.length; h++) {
                      var u = queue[h];
                      far = dist[u];
                      for (var q = 0; q < adj[u].length; q++) {
                          var v = adj[u][q];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push(v); }
                          else if (dist[v] === dist[u]) return -1;
                      }
                  }
                  if (far + 1 > best[comp[s]]) best[comp[s]] = far + 1;
              }
              var total = 0;
              for (var b = 1; b <= cid; b++) total += best[b];
              return total;
          };
        `,
        typescript: code`
          function magnificentSets(n: number, edges: number[][]): number {
              var adj: number[][] = [];
              for (var i = 0; i <= n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var comp: number[] = [], cid = 0;
              for (var k = 0; k <= n; k++) comp.push(0);
              for (var r = 1; r <= n; r++) {
                  if (comp[r] !== 0) continue;
                  cid++;
                  comp[r] = cid;
                  var stack: number[] = [r];
                  while (stack.length > 0) {
                      var x = stack.pop() as number;
                      for (var j = 0; j < adj[x].length; j++) {
                          var y = adj[x][j];
                          if (comp[y] === 0) { comp[y] = cid; stack.push(y); }
                      }
                  }
              }
              var best: number[] = [];
              for (var c = 0; c <= cid; c++) best.push(0);
              for (var s = 1; s <= n; s++) {
                  var dist: number[] = [];
                  for (var t = 0; t <= n; t++) dist.push(-1);
                  dist[s] = 0;
                  var queue: number[] = [s], far = 0;
                  for (var h = 0; h < queue.length; h++) {
                      var u = queue[h];
                      far = dist[u];
                      for (var q = 0; q < adj[u].length; q++) {
                          var v = adj[u][q];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; queue.push(v); }
                          else if (dist[v] === dist[u]) return -1;
                      }
                  }
                  if (far + 1 > best[comp[s]]) best[comp[s]] = far + 1;
              }
              var total = 0;
              for (var b = 1; b <= cid; b++) total += best[b];
              return total;
          }
        `,
        java: code`
          public static int magnificentSets(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] comp = new int[n + 1];
              int[] buf = new int[n + 1];
              int cid = 0;
              for (int r = 1; r <= n; r++) {
                  if (comp[r] != 0) continue;
                  comp[r] = ++cid;
                  int top = 0;
                  buf[top++] = r;
                  while (top > 0) {
                      int x = buf[--top];
                      for (int y : adj.get(x)) if (comp[y] == 0) { comp[y] = cid; buf[top++] = y; }
                  }
              }
              int[] best = new int[cid + 1];
              int[] dist = new int[n + 1];
              for (int s = 1; s <= n; s++) {
                  Arrays.fill(dist, -1);
                  dist[s] = 0;
                  int head = 0, tail = 0, far = 0;
                  buf[tail++] = s;
                  while (head < tail) {
                      int u = buf[head++];
                      far = dist[u];
                      for (int v : adj.get(u)) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; buf[tail++] = v; }
                          else if (dist[v] == dist[u]) return -1;
                      }
                  }
                  best[comp[s]] = Math.max(best[comp[s]], far + 1);
              }
              int total = 0;
              for (int c = 1; c <= cid; c++) total += best[c];
              return total;
          }
        `,
        cpp: code`
          int magnificentSets(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n + 1);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> comp(n + 1, 0), buf;
              int cid = 0;
              for (int r = 1; r <= n; r++) {
                  if (comp[r] != 0) continue;
                  comp[r] = ++cid;
                  buf.assign(1, r);
                  while (!buf.empty()) {
                      int x = buf.back();
                      buf.pop_back();
                      for (int y : adj[x]) if (comp[y] == 0) { comp[y] = cid; buf.push_back(y); }
                  }
              }
              vector<int> best(cid + 1, 0), dist(n + 1);
              for (int s = 1; s <= n; s++) {
                  fill(dist.begin(), dist.end(), -1);
                  dist[s] = 0;
                  buf.assign(1, s);
                  int far = 0;
                  for (size_t h = 0; h < buf.size(); h++) {
                      int u = buf[h];
                      far = dist[u];
                      for (int v : adj[u]) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; buf.push_back(v); }
                          else if (dist[v] == dist[u]) return -1;
                      }
                  }
                  best[comp[s]] = max(best[comp[s]], far + 1);
              }
              int total = 0;
              for (int c = 1; c <= cid; c++) total += best[c];
              return total;
          }
        `,
        c: code`
          int magnificentSets(int n, int** edges, int edgesSize, int* edgesColSize) {
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int e = 0; e < edgesSize; e++) { first[edges[e][0]]++; first[edges[e][1]]++; }
              int acc = 0;
              for (int v = 0; v <= n + 1; v++) { int c = first[v]; first[v] = acc; acc += c; }
              int* fill = (int*)malloc((n + 2) * sizeof(int));
              for (int v = 0; v <= n + 1; v++) fill[v] = first[v];
              int* adj = (int*)malloc((2 * edgesSize + 1) * sizeof(int));
              for (int e = 0; e < edgesSize; e++) {
                  adj[fill[edges[e][0]]++] = edges[e][1];
                  adj[fill[edges[e][1]]++] = edges[e][0];
              }
              int* comp = (int*)calloc(n + 1, sizeof(int));
              int* buf = (int*)malloc((n + 1) * sizeof(int));
              int* dist = (int*)malloc((n + 1) * sizeof(int));
              int cid = 0;
              for (int r = 1; r <= n; r++) {
                  if (comp[r] != 0) continue;
                  comp[r] = ++cid;
                  int top = 0;
                  buf[top++] = r;
                  while (top > 0) {
                      int x = buf[--top];
                      for (int k = first[x]; k < first[x + 1]; k++) {
                          int y = adj[k];
                          if (comp[y] == 0) { comp[y] = cid; buf[top++] = y; }
                      }
                  }
              }
              int* best = (int*)calloc(cid + 1, sizeof(int));
              int result = 0;
              for (int s = 1; s <= n && result != -1; s++) {
                  for (int v = 0; v <= n; v++) dist[v] = -1;
                  dist[s] = 0;
                  int head = 0, tail = 0, far = 0;
                  buf[tail++] = s;
                  while (head < tail && result != -1) {
                      int u = buf[head++];
                      far = dist[u];
                      for (int k = first[u]; k < first[u + 1]; k++) {
                          int v = adj[k];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; buf[tail++] = v; }
                          else if (dist[v] == dist[u]) { result = -1; break; }
                      }
                  }
                  if (result != -1 && far + 1 > best[comp[s]]) best[comp[s]] = far + 1;
              }
              if (result != -1) for (int c = 1; c <= cid; c++) result += best[c];
              free(first);
              free(fill);
              free(adj);
              free(comp);
              free(buf);
              free(dist);
              free(best);
              return result;
          }
        `,
        csharp: code`
          public static int MagnificentSets(int n, int[][] edges)
          {
              var adj = new List<int>[n + 1];
              for (int i = 0; i <= n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] comp = new int[n + 1];
              int[] buf = new int[n + 1];
              int cid = 0;
              for (int r = 1; r <= n; r++)
              {
                  if (comp[r] != 0) continue;
                  comp[r] = ++cid;
                  int top = 0;
                  buf[top++] = r;
                  while (top > 0)
                  {
                      int x = buf[--top];
                      foreach (int y in adj[x]) if (comp[y] == 0) { comp[y] = cid; buf[top++] = y; }
                  }
              }
              int[] best = new int[cid + 1];
              int[] dist = new int[n + 1];
              for (int s = 1; s <= n; s++)
              {
                  for (int v = 0; v <= n; v++) dist[v] = -1;
                  dist[s] = 0;
                  int head = 0, tail = 0, far = 0;
                  buf[tail++] = s;
                  while (head < tail)
                  {
                      int u = buf[head++];
                      far = dist[u];
                      foreach (int v in adj[u])
                      {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; buf[tail++] = v; }
                          else if (dist[v] == dist[u]) return -1;
                      }
                  }
                  best[comp[s]] = Math.Max(best[comp[s]], far + 1);
              }
              int total = 0;
              for (int c = 1; c <= cid; c++) total += best[c];
              return total;
          }
        `,
        go: code`
          func magnificentSets(n int, edges [][]int) int {
          	adj := make([][]int, n+1)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	comp := make([]int, n+1)
          	cid := 0
          	for r := 1; r <= n; r++ {
          		if comp[r] != 0 {
          			continue
          		}
          		cid++
          		comp[r] = cid
          		stack := []int{r}
          		for len(stack) > 0 {
          			x := stack[len(stack)-1]
          			stack = stack[:len(stack)-1]
          			for _, y := range adj[x] {
          				if comp[y] == 0 {
          					comp[y] = cid
          					stack = append(stack, y)
          				}
          			}
          		}
          	}
          	best := make([]int, cid+1)
          	dist := make([]int, n+1)
          	for s := 1; s <= n; s++ {
          		for v := range dist {
          			dist[v] = -1
          		}
          		dist[s] = 0
          		queue := []int{s}
          		far := 0
          		for h := 0; h < len(queue); h++ {
          			u := queue[h]
          			far = dist[u]
          			for _, v := range adj[u] {
          				if dist[v] < 0 {
          					dist[v] = dist[u] + 1
          					queue = append(queue, v)
          				} else if dist[v] == dist[u] {
          					return -1
          				}
          			}
          		}
          		if far+1 > best[comp[s]] {
          			best[comp[s]] = far + 1
          		}
          	}
          	total := 0
          	for c := 1; c <= cid; c++ {
          		total += best[c]
          	}
          	return total
          }
        `,
        kotlin: code`
          fun magnificentSets(n: Int, edges: Array<IntArray>): Int {
              val adj = Array(n + 1) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val comp = IntArray(n + 1)
              val buf = IntArray(n + 1)
              var cid = 0
              for (r in 1..n) {
                  if (comp[r] != 0) continue
                  cid++
                  comp[r] = cid
                  var top = 0
                  buf[top++] = r
                  while (top > 0) {
                      val x = buf[--top]
                      for (y in adj[x]) if (comp[y] == 0) { comp[y] = cid; buf[top++] = y }
                  }
              }
              val best = IntArray(cid + 1)
              val dist = IntArray(n + 1)
              for (s in 1..n) {
                  java.util.Arrays.fill(dist, -1)
                  dist[s] = 0
                  var head = 0
                  var tail = 0
                  var far = 0
                  buf[tail++] = s
                  while (head < tail) {
                      val u = buf[head++]
                      far = dist[u]
                      for (v in adj[u]) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; buf[tail++] = v }
                          else if (dist[v] == dist[u]) return -1
                      }
                  }
                  if (far + 1 > best[comp[s]]) best[comp[s]] = far + 1
              }
              var total = 0
              for (c in 1..cid) total += best[c]
              return total
          }
        `,
        swift: code`
          func magnificentSets(_ n: Int, _ edges: [[Int]]) -> Int {
              var adj = [[Int]](repeating: [], count: n + 1)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var comp = [Int](repeating: 0, count: n + 1)
              var cid = 0
              for r in 1...n where comp[r] == 0 {
                  cid += 1
                  comp[r] = cid
                  var stack = [r]
                  while let x = stack.popLast() {
                      for y in adj[x] where comp[y] == 0 {
                          comp[y] = cid
                          stack.append(y)
                      }
                  }
              }
              var best = [Int](repeating: 0, count: cid + 1)
              for s in 1...n {
                  var dist = [Int](repeating: -1, count: n + 1)
                  dist[s] = 0
                  var queue = [s]
                  var h = 0
                  var far = 0
                  while h < queue.count {
                      let u = queue[h]
                      h += 1
                      far = dist[u]
                      for v in adj[u] {
                          if dist[v] < 0 { dist[v] = dist[u] + 1; queue.append(v) }
                          else if dist[v] == dist[u] { return -1 }
                      }
                  }
                  best[comp[s]] = max(best[comp[s]], far + 1)
              }
              return best.reduce(0, +)
          }
        `,
        rust: code`
          fn magnificentSets(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n + 1];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut comp = vec![0usize; n + 1];
              let mut cid = 0usize;
              for r in 1..=n {
                  if comp[r] != 0 {
                      continue;
                  }
                  cid += 1;
                  comp[r] = cid;
                  let mut stack = vec![r];
                  while let Some(x) = stack.pop() {
                      for &y in adj[x].iter() {
                          if comp[y] == 0 {
                              comp[y] = cid;
                              stack.push(y);
                          }
                      }
                  }
              }
              let mut best = vec![0i32; cid + 1];
              for s in 1..=n {
                  let mut dist = vec![-1i32; n + 1];
                  dist[s] = 0;
                  let mut queue = vec![s];
                  let mut h = 0;
                  let mut far = 0;
                  while h < queue.len() {
                      let u = queue[h];
                      h += 1;
                      far = dist[u];
                      for &v in adj[u].iter() {
                          if dist[v] < 0 {
                              dist[v] = dist[u] + 1;
                              queue.push(v);
                          } else if dist[v] == dist[u] {
                              return -1;
                          }
                      }
                  }
                  if far + 1 > best[comp[s]] {
                      best[comp[s]] = far + 1;
                  }
              }
              best.iter().sum()
          }
        `,
        php: code`
          function magnificentSets($n, $edges) {
              $adj = array_fill(0, $n + 1, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $comp = array_fill(0, $n + 1, 0);
              $cid = 0;
              for ($r = 1; $r <= $n; $r++) {
                  if ($comp[$r] != 0) continue;
                  $cid++;
                  $comp[$r] = $cid;
                  $stack = [$r];
                  while (count($stack) > 0) {
                      $x = array_pop($stack);
                      foreach ($adj[$x] as $y) if ($comp[$y] == 0) { $comp[$y] = $cid; $stack[] = $y; }
                  }
              }
              $best = array_fill(0, $cid + 1, 0);
              for ($s = 1; $s <= $n; $s++) {
                  $dist = array_fill(0, $n + 1, -1);
                  $dist[$s] = 0;
                  $queue = [$s];
                  $far = 0;
                  for ($h = 0; $h < count($queue); $h++) {
                      $u = $queue[$h];
                      $far = $dist[$u];
                      foreach ($adj[$u] as $v) {
                          if ($dist[$v] < 0) { $dist[$v] = $dist[$u] + 1; $queue[] = $v; }
                          elseif ($dist[$v] == $dist[$u]) return -1;
                      }
                  }
                  if ($far + 1 > $best[$comp[$s]]) $best[$comp[$s]] = $far + 1;
              }
              return array_sum($best);
          }
        `,
        ruby: code`
          def magnificentSets(n, edges)
            adj = Array.new(n + 1) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            comp = Array.new(n + 1, 0)
            cid = 0
            (1..n).each do |r|
              next if comp[r] != 0
              cid += 1
              comp[r] = cid
              stack = [r]
              until stack.empty?
                x = stack.pop
                adj[x].each do |y|
                  next if comp[y] != 0
                  comp[y] = cid
                  stack << y
                end
              end
            end
            best = Array.new(cid + 1, 0)
            (1..n).each do |s|
              dist = Array.new(n + 1, -1)
              dist[s] = 0
              queue = [s]
              h = 0
              far = 0
              while h < queue.length
                u = queue[h]
                h += 1
                far = dist[u]
                adj[u].each do |v|
                  if dist[v] < 0
                    dist[v] = dist[u] + 1
                    queue << v
                  elsif dist[v] == dist[u]
                    return -1
                  end
                end
              end
              best[comp[s]] = far + 1 if far + 1 > best[comp[s]]
            end
            best.sum
          end
        `,
      },
    };
  })(),

  // ── Shortest Cycle in a Graph (LC 2608) ─────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // For each edge, the shortest detour between its ends without it closes a cycle.
      let best = Infinity;
      for (let skip = 0; skip < edges.length; skip++) {
        const adj: number[][] = Array.from({ length: n }, () => []);
        edges.forEach(([a, b], i) => { if (i !== skip) { adj[a].push(b); adj[b].push(a); } });
        const [s, t] = edges[skip];
        const dist = new Array(n).fill(-1);
        dist[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (dist[v] < 0) { dist[v] = dist[q[h]] + 1; q.push(v); }
        if (dist[t] >= 0) best = Math.min(best, dist[t] + 1);
      }
      return best === Infinity ? -1 : best;
    };
    return {
      slug: "shortest-cycle-in-a-graph",
      title: "Shortest Cycle in a Graph",
      difficulty: "HARD" as const,
      tags: ["Graph", "Breadth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "findShortestCycle",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected graph has `n` vertices labelled `0` to `n - 1` and the edges in `edges`, each `[ui, vi]`. There is at most one edge between any pair of vertices and no edge from a vertex to itself.\n\nA **cycle** is a path that starts and ends at the same vertex and uses each edge at most once (and repeats no vertex other than the start). Return the length (number of edges) of the **shortest** cycle in the graph, or `-1` if the graph has no cycle.",
        [
          { in: "n = 6, edges = [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,3]]", out: "3", note: "The square 0-1-2-3 has length 4, the triangle 3-4-5 has length 3." },
          { in: "n = 5, edges = [[0,1],[1,2],[2,3],[3,4],[4,0]]", out: "5" },
          { in: "n = 4, edges = [[0,1],[1,2],[1,3]]", out: "-1", note: "The graph is a tree." },
        ],
        ["2 <= n <= 1000", "1 <= edges.length <= 1000", "edges[i].length == 2", "0 <= ui, vi < n", "ui != vi", "there are no repeated edges"]),
      hints: [
        "Breadth-first search from a vertex s finds shortest distances; a non-tree edge (u, v) met during that search reveals a closed walk through s of length dist[u] + dist[v] + 1.",
        "That walk may not be a simple cycle through s, but it always contains a cycle no longer than it — so it is a valid upper bound.",
        "Run the BFS from every vertex and take the minimum: when s lies on a shortest cycle, the bound is exactly that cycle's length.",
      ],
      editorial: explain({
        idea: "BFS from every vertex. During a BFS from `s`, any edge `(u, v)` that is not the tree edge into `u` closes a walk of length `dist[u] + dist[v] + 1`; the smallest such value over all starts is the girth.",
        steps: [
          "Build adjacency lists.",
          "For each start `s`, BFS recording `dist` and the BFS parent of every vertex.",
          "When scanning `u`'s neighbour `v`: if `v` is unvisited, set its distance and parent; otherwise, if `v` is not `u`'s parent, update the answer with `dist[u] + dist[v] + 1`.",
          "Return the answer, or -1 if it was never updated.",
        ],
        why: "Each candidate is the length of a closed walk built from two BFS-tree paths and one extra edge; such a walk always contains a simple cycle of at most that length, so no candidate is below the true shortest cycle. Conversely, if `s` lies on a shortest cycle `C` of length `L`, BFS from `s` reaches the vertices of `C` along `C` itself (a shorter route would create a shorter cycle), and the edge of `C` opposite `s` produces a candidate equal to `L`. So the minimum over all starts is exact.",
        time: "O(n · (n + m))",
        space: "O(n + m)",
        pitfalls: [
          "Ignore only the edge back to `u`'s BFS parent; any other visited neighbour gives a candidate.",
          "A single BFS from one vertex is not enough — it can overestimate cycles that do not pass through it.",
          "The graph may be disconnected; every vertex must be tried as a start.",
        ],
      }),
      examples: [
        { input: "6\n[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,3]]", expectedOutput: "3" },
        { input: "5\n[[0,1],[1,2],[2,3],[3,4],[4,0]]", expectedOutput: "5" },
        { input: "4\n[[0,1],[1,2],[1,3]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 6, 7, 9, 12]);
        const mode = rng();
        let edges: number[][];
        if (mode < 0.15) {
          edges = randomTreeEdges(rng, n, 0);
          if (!edges.length) edges = [[0, 1]];
        } else if (mode < 0.55) {
          // One ring plus a few chords; the vertices off the ring stay isolated.
          const len = ri(rng, Math.min(3, n), n);
          const ring = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, len);
          const has = new Set<string>();
          edges = [];
          const add = (a: number, b: number) => {
            const key = Math.min(a, b) + "," + Math.max(a, b);
            if (a !== b && !has.has(key)) { has.add(key); edges.push([a, b]); }
          };
          for (let k = 0; k < len; k++) add(ring[k], ring[(k + 1) % len]);
          for (let k = ri(rng, 0, 2); k > 0; k--) add(pick(rng, ring), pick(rng, ring));
        } else {
          const cap = (n * (n - 1)) / 2;
          edges = randomSimpleEdges(rng, n, ri(rng, Math.min(cap, n - 1), Math.min(cap, pick(rng, [n, 2 * n]))), 0);
        }
        shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def findShortestCycle(n: int, edges: List[List[int]]) -> int:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              INF = 10 ** 9
              best = INF
              for s in range(n):
                  dist = [-1] * n
                  par = [-1] * n
                  dist[s] = 0
                  q = deque([s])
                  while q:
                      u = q.popleft()
                      for v in adj[u]:
                          if dist[v] < 0:
                              dist[v] = dist[u] + 1
                              par[v] = u
                              q.append(v)
                          elif par[u] != v:
                              best = min(best, dist[u] + dist[v] + 1)
              return -1 if best == INF else best
        `,
        javascript: code`
          var findShortestCycle = function(n, edges) {
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var INF = 1000000000, best = INF;
              for (var s = 0; s < n; s++) {
                  var dist = [], par = [];
                  for (var k = 0; k < n; k++) { dist.push(-1); par.push(-1); }
                  dist[s] = 0;
                  var queue = [s];
                  for (var h = 0; h < queue.length; h++) {
                      var u = queue[h];
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue.push(v); }
                          else if (par[u] !== v && dist[u] + dist[v] + 1 < best) best = dist[u] + dist[v] + 1;
                      }
                  }
              }
              return best === INF ? -1 : best;
          };
        `,
        typescript: code`
          function findShortestCycle(n: number, edges: number[][]): number {
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var INF = 1000000000, best = INF;
              for (var s = 0; s < n; s++) {
                  var dist: number[] = [], par: number[] = [];
                  for (var k = 0; k < n; k++) { dist.push(-1); par.push(-1); }
                  dist[s] = 0;
                  var queue: number[] = [s];
                  for (var h = 0; h < queue.length; h++) {
                      var u = queue[h];
                      for (var j = 0; j < adj[u].length; j++) {
                          var v = adj[u][j];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue.push(v); }
                          else if (par[u] !== v && dist[u] + dist[v] + 1 < best) best = dist[u] + dist[v] + 1;
                      }
                  }
              }
              return best === INF ? -1 : best;
          }
        `,
        java: code`
          public static int findShortestCycle(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              final int INF = Integer.MAX_VALUE;
              int best = INF;
              int[] dist = new int[n], par = new int[n], queue = new int[n];
              for (int s = 0; s < n; s++) {
                  Arrays.fill(dist, -1);
                  Arrays.fill(par, -1);
                  dist[s] = 0;
                  int head = 0, tail = 0;
                  queue[tail++] = s;
                  while (head < tail) {
                      int u = queue[head++];
                      for (int v : adj.get(u)) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue[tail++] = v; }
                          else if (par[u] != v) best = Math.min(best, dist[u] + dist[v] + 1);
                      }
                  }
              }
              return best == INF ? -1 : best;
          }
        `,
        cpp: code`
          int findShortestCycle(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              const int INF = INT_MAX;
              int best = INF;
              vector<int> dist(n), par(n), queue;
              for (int s = 0; s < n; s++) {
                  fill(dist.begin(), dist.end(), -1);
                  fill(par.begin(), par.end(), -1);
                  dist[s] = 0;
                  queue.assign(1, s);
                  for (size_t h = 0; h < queue.size(); h++) {
                      int u = queue[h];
                      for (int v : adj[u]) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue.push_back(v); }
                          else if (par[u] != v) best = min(best, dist[u] + dist[v] + 1);
                      }
                  }
              }
              return best == INF ? -1 : best;
          }
        `,
        c: code`
          int findShortestCycle(int n, int** edges, int edgesSize, int* edgesColSize) {
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
              int* dist = (int*)malloc((n + 1) * sizeof(int));
              int* par = (int*)malloc((n + 1) * sizeof(int));
              int* queue = (int*)malloc((n + 1) * sizeof(int));
              const int INF = 2147483647;
              int best = INF;
              for (int s = 0; s < n; s++) {
                  for (int i = 0; i < n; i++) { dist[i] = -1; par[i] = -1; }
                  dist[s] = 0;
                  int head = 0, tail = 0;
                  queue[tail++] = s;
                  while (head < tail) {
                      int u = queue[head++];
                      for (int k = first[u]; k < first[u + 1]; k++) {
                          int v = adj[k];
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue[tail++] = v; }
                          else if (par[u] != v && dist[u] + dist[v] + 1 < best) best = dist[u] + dist[v] + 1;
                      }
                  }
              }
              free(first);
              free(fill);
              free(adj);
              free(dist);
              free(par);
              free(queue);
              return best == INF ? -1 : best;
          }
        `,
        csharp: code`
          public static int FindShortestCycle(int n, int[][] edges)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int INF = int.MaxValue, best = INF;
              int[] dist = new int[n], par = new int[n], queue = new int[n];
              for (int s = 0; s < n; s++)
              {
                  for (int i = 0; i < n; i++) { dist[i] = -1; par[i] = -1; }
                  dist[s] = 0;
                  int head = 0, tail = 0;
                  queue[tail++] = s;
                  while (head < tail)
                  {
                      int u = queue[head++];
                      foreach (int v in adj[u])
                      {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue[tail++] = v; }
                          else if (par[u] != v) best = Math.Min(best, dist[u] + dist[v] + 1);
                      }
                  }
              }
              return best == INF ? -1 : best;
          }
        `,
        go: code`
          func findShortestCycle(n int, edges [][]int) int {
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	const INF = 1 << 30
          	best := INF
          	dist := make([]int, n)
          	par := make([]int, n)
          	for s := 0; s < n; s++ {
          		for i := 0; i < n; i++ {
          			dist[i] = -1
          			par[i] = -1
          		}
          		dist[s] = 0
          		queue := []int{s}
          		for h := 0; h < len(queue); h++ {
          			u := queue[h]
          			for _, v := range adj[u] {
          				if dist[v] < 0 {
          					dist[v] = dist[u] + 1
          					par[v] = u
          					queue = append(queue, v)
          				} else if par[u] != v && dist[u]+dist[v]+1 < best {
          					best = dist[u] + dist[v] + 1
          				}
          			}
          		}
          	}
          	if best == INF {
          		return -1
          	}
          	return best
          }
        `,
        kotlin: code`
          fun findShortestCycle(n: Int, edges: Array<IntArray>): Int {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val inf = Int.MAX_VALUE
              var best = inf
              val dist = IntArray(n)
              val par = IntArray(n)
              val queue = IntArray(n)
              for (s in 0 until n) {
                  java.util.Arrays.fill(dist, -1)
                  java.util.Arrays.fill(par, -1)
                  dist[s] = 0
                  var head = 0
                  var tail = 0
                  queue[tail++] = s
                  while (head < tail) {
                      val u = queue[head++]
                      for (v in adj[u]) {
                          if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue[tail++] = v }
                          else if (par[u] != v) best = minOf(best, dist[u] + dist[v] + 1)
                      }
                  }
              }
              return if (best == inf) -1 else best
          }
        `,
        swift: code`
          func findShortestCycle(_ n: Int, _ edges: [[Int]]) -> Int {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              let inf = Int.max
              var best = inf
              for s in 0..<n {
                  var dist = [Int](repeating: -1, count: n)
                  var par = [Int](repeating: -1, count: n)
                  dist[s] = 0
                  var queue = [s]
                  var h = 0
                  while h < queue.count {
                      let u = queue[h]
                      h += 1
                      for v in adj[u] {
                          if dist[v] < 0 { dist[v] = dist[u] + 1; par[v] = u; queue.append(v) }
                          else if par[u] != v { best = min(best, dist[u] + dist[v] + 1) }
                      }
                  }
              }
              return best == inf ? -1 : best
          }
        `,
        rust: code`
          fn findShortestCycle(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let inf = std::i32::MAX;
              let mut best = inf;
              for s in 0..n {
                  let mut dist = vec![-1i32; n];
                  let mut par = vec![usize::max_value(); n];
                  dist[s] = 0;
                  let mut queue = vec![s];
                  let mut h = 0;
                  while h < queue.len() {
                      let u = queue[h];
                      h += 1;
                      for &v in adj[u].iter() {
                          if dist[v] < 0 {
                              dist[v] = dist[u] + 1;
                              par[v] = u;
                              queue.push(v);
                          } else if par[u] != v && dist[u] + dist[v] + 1 < best {
                              best = dist[u] + dist[v] + 1;
                          }
                      }
                  }
              }
              if best == inf { -1 } else { best }
          }
        `,
        php: code`
          function findShortestCycle($n, $edges) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $INF = PHP_INT_MAX;
              $best = $INF;
              for ($s = 0; $s < $n; $s++) {
                  $dist = array_fill(0, $n, -1);
                  $par = array_fill(0, $n, -1);
                  $dist[$s] = 0;
                  $queue = [$s];
                  for ($h = 0; $h < count($queue); $h++) {
                      $u = $queue[$h];
                      foreach ($adj[$u] as $v) {
                          if ($dist[$v] < 0) { $dist[$v] = $dist[$u] + 1; $par[$v] = $u; $queue[] = $v; }
                          elseif ($par[$u] != $v && $dist[$u] + $dist[$v] + 1 < $best) $best = $dist[$u] + $dist[$v] + 1;
                      }
                  }
              }
              return $best == $INF ? -1 : $best;
          }
        `,
        ruby: code`
          def findShortestCycle(n, edges)
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            best = nil
            n.times do |s|
              dist = Array.new(n, -1)
              par = Array.new(n, -1)
              dist[s] = 0
              queue = [s]
              h = 0
              while h < queue.length
                u = queue[h]
                h += 1
                adj[u].each do |v|
                  if dist[v] < 0
                    dist[v] = dist[u] + 1
                    par[v] = u
                    queue << v
                  elsif par[u] != v
                    len = dist[u] + dist[v] + 1
                    best = len if best.nil? || len < best
                  end
                end
              end
            end
            best.nil? ? -1 : best
          end
        `,
      },
    };
  })(),

  // ── Most Profitable Path in a Tree (LC 2467) ────────────────────
  (() => {
    const ref = (edges: number[][], bob: number, amount: number[]) => {
      // Step-by-step simulation of Alice towards every leaf against Bob towards the root.
      const n = amount.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      const parent = new Array(n).fill(-1);
      const seen = new Array(n).fill(false);
      seen[0] = true;
      const q = [0];
      for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (!seen[v]) { seen[v] = true; parent[v] = q[h]; q.push(v); }
      const bobPath: number[] = [];
      for (let x = bob; x !== -1; x = parent[x]) bobPath.push(x);
      let best = -Infinity;
      for (let leaf = 1; leaf < n; leaf++) {
        if (adj[leaf].length !== 1) continue;
        const alicePath: number[] = [];
        for (let x = leaf; x !== -1; x = parent[x]) alicePath.push(x);
        alicePath.reverse();
        const opened = new Array(n).fill(false);
        let income = 0;
        for (let t = 0; t < alicePath.length; t++) {
          const a = alicePath[t];
          const b = t < bobPath.length ? bobPath[t] : -1;
          if (!opened[a]) income += a === b ? amount[a] / 2 : amount[a];
          opened[a] = true;
          if (b !== -1) opened[b] = true;
        }
        best = Math.max(best, income);
      }
      return best;
    };
    return {
      slug: "most-profitable-path-in-a-tree",
      title: "Most Profitable Path in a Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Tree", "Depth-First Search", "Graph", "Amazon", "Google"],
      signature: {
        funcName: "mostProfitablePath",
        params: [{ name: "edges", type: "int[][]" as const }, { name: "bob", type: "int" as const }, { name: "amount", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1`, rooted at node `0`, with edges `edges`. Every node holds a gate. `amount[i]` is even: a negative value is the **price** to open the gate at node `i`, a positive value is the **reward** for opening it.\n\nAlice starts at node `0` and Bob at node `bob`. Every second, Alice moves one step toward some **leaf** of her choice, and Bob moves one step toward node `0`. When either reaches a node whose gate is still closed, they open it and pay or collect `amount[i]`. If they reach the **same** node at the **same** second, they share it: each pays or collects `amount[i] / 2`. A gate that is already open gives nothing. Alice stops at her leaf; Bob stops at node `0`.\n\nReturn Alice's maximum possible net income over her choice of leaf.",
        [
          { in: "edges = [[0,1],[0,2],[2,3],[2,4]], bob = 4, amount = [2,-6,8,10,-4]", out: "16", note: "Alice goes 0 → 2 → 3: she takes 2 at node 0, shares node 2 with Bob (+4), and takes 10 at node 3." },
          { in: "edges = [[0,1]], bob = 1, amount = [-4,6]", out: "-4", note: "Bob opens node 1 at second 0, so Alice only pays for node 0." },
          { in: "edges = [[0,1],[1,2],[2,3]], bob = 3, amount = [4,-2,6,8]", out: "2" },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= ai, bi < n", "ai != bi", "edges represents a valid tree", "1 <= bob < n", "amount.length == n", "amount[i] is an even integer in the range [-10^4, 10^4]"]),
      hints: [
        "Bob's route is forced: the unique path from his node up to the root. Record the second at which he reaches each node on it.",
        "Alice reaches node x at second depth(x). Compare with Bob's arrival time at x: earlier means the full amount, equal means half, later means nothing.",
        "Accumulate Alice's income from the root downward (BFS or DFS) and take the maximum over the leaves (nodes other than 0 with a single neighbour).",
      ],
      editorial: explain({
        idea: "Bob's moves are fixed, so for every node we know when (if ever) he opens it. Alice's income along any root-to-leaf path is then a simple prefix sum.",
        steps: [
          "BFS from node 0 to get every node's parent and depth.",
          "Walk from `bob` to the root through the parents, giving each node on the way its Bob time `t = 0, 1, 2, …`; every other node has Bob time ∞.",
          "Process nodes in BFS order: Alice's gain at `x` is `amount[x]` if `depth[x] < bobTime[x]`, `amount[x] / 2` if they are equal, else 0. Add it to the parent's running income.",
          "Return the largest running income among leaves (nodes ≠ 0 with degree 1).",
        ],
        why: "Alice moves away from the root one level per second, so she stands on node `x` exactly at second `depth[x]`; Bob stands on the nodes of his path at known seconds and never elsewhere. Comparing the two arrival times decides who opens each gate, independent of Alice's later choices, so the income of a leaf is the sum of per-node gains on its root path.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The root is not a leaf even when it has a single neighbour.",
          "Bob's own path includes node 0; Alice always reaches node 0 first (at second 0), so she takes its full amount.",
          "The best income may be negative — do not start the maximum at 0.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2],[2,3],[2,4]]\n4\n[2,-6,8,10,-4]", expectedOutput: "16" },
        { input: "[[0,1]]\n1\n[-4,6]", expectedOutput: "-4" },
        { input: "[[0,1],[1,2],[2,3]]\n3\n[4,-2,6,8]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 6, 8, 12, 16, 25]);
        const edges = connectedEdges(rng, n, 0, 0);
        const bob = ri(rng, 1, n - 1);
        const A = pick(rng, [1, 10, 5000]);
        const amount = Array.from({ length: n }, () => 2 * ri(rng, -A, A));
        return { input: `${fmtIntMat(edges)}\n${bob}\n${fmtIntArr(amount)}`, expectedOutput: String(ref(edges, bob, amount)) };
      },
      solutions: {
        python: code`
          from typing import List

          def mostProfitablePath(edges: List[List[int]], bob: int, amount: List[int]) -> int:
              n = len(amount)
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              depth = [0] * n
              seen = [False] * n
              seen[0] = True
              order = [0]
              for u in order:
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          depth[v] = depth[u] + 1
                          order.append(v)
              INF = 10 ** 9
              bob_time = [INF] * n
              x, t = bob, 0
              while x != -1:
                  bob_time[x] = t
                  t += 1
                  x = parent[x]
              income = [0] * n
              best = None
              for u in order:
                  if depth[u] < bob_time[u]:
                      gain = amount[u]
                  elif depth[u] == bob_time[u]:
                      gain = amount[u] // 2
                  else:
                      gain = 0
                  income[u] = gain + (income[parent[u]] if u != 0 else 0)
                  if u != 0 and len(adj[u]) == 1 and (best is None or income[u] > best):
                      best = income[u]
              return best
        `,
        javascript: code`
          var mostProfitablePath = function(edges, bob, amount) {
              var n = amount.length;
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var parent = [], depth = [], bobTime = [], income = [];
              for (var k = 0; k < n; k++) { parent.push(-2); depth.push(0); bobTime.push(1000000000); income.push(0); }
              parent[0] = -1;
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; depth[v] = depth[u] + 1; order.push(v); }
                  }
              }
              for (var x = bob, t = 0; x !== -1; x = parent[x], t++) bobTime[x] = t;
              var best = null;
              for (var q = 0; q < n; q++) {
                  var w = order[q];
                  var gain = depth[w] < bobTime[w] ? amount[w] : depth[w] === bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w === 0 ? 0 : income[parent[w]]);
                  if (w !== 0 && adj[w].length === 1 && (best === null || income[w] > best)) best = income[w];
              }
              return best;
          };
        `,
        typescript: code`
          function mostProfitablePath(edges: number[][], bob: number, amount: number[]): number {
              var n = amount.length;
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1]);
                  adj[edges[e][1]].push(edges[e][0]);
              }
              var parent: number[] = [], depth: number[] = [], bobTime: number[] = [], income: number[] = [];
              for (var k = 0; k < n; k++) { parent.push(-2); depth.push(0); bobTime.push(1000000000); income.push(0); }
              parent[0] = -1;
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (parent[v] === -2) { parent[v] = u; depth[v] = depth[u] + 1; order.push(v); }
                  }
              }
              for (var x = bob, t = 0; x !== -1; x = parent[x], t++) bobTime[x] = t;
              var best = 0, found = false;
              for (var q = 0; q < n; q++) {
                  var w = order[q];
                  var gain = depth[w] < bobTime[w] ? amount[w] : depth[w] === bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w === 0 ? 0 : income[parent[w]]);
                  if (w !== 0 && adj[w].length === 1 && (!found || income[w] > best)) { best = income[w]; found = true; }
              }
              return best;
          }
        `,
        java: code`
          public static int mostProfitablePath(int[][] edges, int bob, int[] amount) {
              int n = amount.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], depth = new int[n], order = new int[n], bobTime = new int[n], income = new int[n];
              Arrays.fill(parent, -2);
              Arrays.fill(bobTime, Integer.MAX_VALUE);
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int v : adj.get(u)) if (parent[v] == -2) { parent[v] = u; depth[v] = depth[u] + 1; order[tail++] = v; }
              }
              for (int x = bob, t = 0; x != -1; x = parent[x], t++) bobTime[x] = t;
              int best = Integer.MIN_VALUE;
              for (int q = 0; q < n; q++) {
                  int w = order[q];
                  int gain = depth[w] < bobTime[w] ? amount[w] : depth[w] == bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w == 0 ? 0 : income[parent[w]]);
                  if (w != 0 && adj.get(w).size() == 1) best = Math.max(best, income[w]);
              }
              return best;
          }
        `,
        cpp: code`
          int mostProfitablePath(vector<vector<int>>& edges, int bob, vector<int>& amount) {
              int n = amount.size();
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -2), depth(n, 0), bobTime(n, INT_MAX), income(n, 0), order;
              parent[0] = -1;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (parent[v] == -2) { parent[v] = u; depth[v] = depth[u] + 1; order.push_back(v); }
              }
              for (int x = bob, t = 0; x != -1; x = parent[x], t++) bobTime[x] = t;
              int best = INT_MIN;
              for (int w : order) {
                  int gain = depth[w] < bobTime[w] ? amount[w] : depth[w] == bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w == 0 ? 0 : income[parent[w]]);
                  if (w != 0 && adj[w].size() == 1) best = max(best, income[w]);
              }
              return best;
          }
        `,
        c: code`
          int mostProfitablePath(int** edges, int edgesSize, int* edgesColSize, int bob, int* amount, int amountSize) {
              int n = amountSize;
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
              int* parent = (int*)malloc((n + 1) * sizeof(int));
              int* depth = (int*)calloc(n + 1, sizeof(int));
              int* order = (int*)malloc((n + 1) * sizeof(int));
              int* bobTime = (int*)malloc((n + 1) * sizeof(int));
              int* income = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < n; i++) { parent[i] = -2; bobTime[i] = 2147483647; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int k = first[u]; k < first[u + 1]; k++) {
                      int v = adj[k];
                      if (parent[v] == -2) { parent[v] = u; depth[v] = depth[u] + 1; order[tail++] = v; }
                  }
              }
              for (int x = bob, t = 0; x != -1; x = parent[x], t++) bobTime[x] = t;
              int best = 0, found = 0;
              for (int q = 0; q < n; q++) {
                  int w = order[q];
                  int gain = depth[w] < bobTime[w] ? amount[w] : depth[w] == bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w == 0 ? 0 : income[parent[w]]);
                  if (w != 0 && first[w + 1] - first[w] == 1 && (!found || income[w] > best)) { best = income[w]; found = 1; }
              }
              free(first);
              free(fill);
              free(adj);
              free(parent);
              free(depth);
              free(order);
              free(bobTime);
              free(income);
              return best;
          }
        `,
        csharp: code`
          public static int MostProfitablePath(int[][] edges, int bob, int[] amount)
          {
              int n = amount.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], depth = new int[n], order = new int[n], bobTime = new int[n], income = new int[n];
              for (int i = 0; i < n; i++) { parent[i] = -2; bobTime[i] = int.MaxValue; }
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
              {
                  int u = order[h];
                  foreach (int v in adj[u]) if (parent[v] == -2) { parent[v] = u; depth[v] = depth[u] + 1; order[tail++] = v; }
              }
              for (int x = bob, t = 0; x != -1; x = parent[x], t++) bobTime[x] = t;
              int best = int.MinValue;
              for (int q = 0; q < n; q++)
              {
                  int w = order[q];
                  int gain = depth[w] < bobTime[w] ? amount[w] : depth[w] == bobTime[w] ? amount[w] / 2 : 0;
                  income[w] = gain + (w == 0 ? 0 : income[parent[w]]);
                  if (w != 0 && adj[w].Count == 1) best = Math.Max(best, income[w]);
              }
              return best;
          }
        `,
        go: code`
          func mostProfitablePath(edges [][]int, bob int, amount []int) int {
          	n := len(amount)
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	parent := make([]int, n)
          	depth := make([]int, n)
          	bobTime := make([]int, n)
          	income := make([]int, n)
          	for i := 0; i < n; i++ {
          		parent[i] = -2
          		bobTime[i] = 1 << 30
          	}
          	parent[0] = -1
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		u := order[h]
          		for _, v := range adj[u] {
          			if parent[v] == -2 {
          				parent[v] = u
          				depth[v] = depth[u] + 1
          				order = append(order, v)
          			}
          		}
          	}
          	for x, t := bob, 0; x != -1; x, t = parent[x], t+1 {
          		bobTime[x] = t
          	}
          	best, found := 0, false
          	for _, w := range order {
          		gain := 0
          		if depth[w] < bobTime[w] {
          			gain = amount[w]
          		} else if depth[w] == bobTime[w] {
          			gain = amount[w] / 2
          		}
          		income[w] = gain
          		if w != 0 {
          			income[w] += income[parent[w]]
          		}
          		if w != 0 && len(adj[w]) == 1 && (!found || income[w] > best) {
          			best = income[w]
          			found = true
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun mostProfitablePath(edges: Array<IntArray>, bob: Int, amount: IntArray): Int {
              val n = amount.size
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -2 }
              val depth = IntArray(n)
              val bobTime = IntArray(n) { Int.MAX_VALUE }
              val income = IntArray(n)
              val order = IntArray(n)
              parent[0] = -1
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  val u = order[h++]
                  for (v in adj[u]) if (parent[v] == -2) { parent[v] = u; depth[v] = depth[u] + 1; order[tail++] = v }
              }
              var x = bob
              var t = 0
              while (x != -1) { bobTime[x] = t; t++; x = parent[x] }
              var best = Int.MIN_VALUE
              for (q in 0 until n) {
                  val w = order[q]
                  val gain = if (depth[w] < bobTime[w]) amount[w] else if (depth[w] == bobTime[w]) amount[w] / 2 else 0
                  income[w] = gain + (if (w == 0) 0 else income[parent[w]])
                  if (w != 0 && adj[w].size == 1) best = maxOf(best, income[w])
              }
              return best
          }
        `,
        swift: code`
          func mostProfitablePath(_ edges: [[Int]], _ bob: Int, _ amount: [Int]) -> Int {
              let n = amount.count
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -2, count: n)
              var depth = [Int](repeating: 0, count: n)
              var bobTime = [Int](repeating: Int.max, count: n)
              var income = [Int](repeating: 0, count: n)
              parent[0] = -1
              var order = [0]
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for v in adj[u] where parent[v] == -2 {
                      parent[v] = u
                      depth[v] = depth[u] + 1
                      order.append(v)
                  }
              }
              var x = bob, t = 0
              while x != -1 { bobTime[x] = t; t += 1; x = parent[x] }
              var best = Int.min
              for w in order {
                  let gain = depth[w] < bobTime[w] ? amount[w] : (depth[w] == bobTime[w] ? amount[w] / 2 : 0)
                  income[w] = gain + (w == 0 ? 0 : income[parent[w]])
                  if w != 0 && adj[w].count == 1 { best = max(best, income[w]) }
              }
              return best
          }
        `,
        rust: code`
          fn mostProfitablePath(edges: Vec<Vec<i32>>, bob: i32, amount: Vec<i32>) -> i32 {
              let n = amount.len();
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent: Vec<i64> = vec![-2; n];
              let mut depth = vec![0i32; n];
              let mut bob_time = vec![std::i32::MAX; n];
              let mut income = vec![0i32; n];
              parent[0] = -1;
              let mut order: Vec<usize> = vec![0];
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  h += 1;
                  for &v in adj[u].iter() {
                      if parent[v] == -2 {
                          parent[v] = u as i64;
                          depth[v] = depth[u] + 1;
                          order.push(v);
                      }
                  }
              }
              let mut x = bob as i64;
              let mut t = 0i32;
              while x != -1 {
                  bob_time[x as usize] = t;
                  t += 1;
                  x = parent[x as usize];
              }
              let mut best = std::i32::MIN;
              for &w in order.iter() {
                  let gain = if depth[w] < bob_time[w] {
                      amount[w]
                  } else if depth[w] == bob_time[w] {
                      amount[w] / 2
                  } else {
                      0
                  };
                  income[w] = gain + if w == 0 { 0 } else { income[parent[w] as usize] };
                  if w != 0 && adj[w].len() == 1 && income[w] > best {
                      best = income[w];
                  }
              }
              best
          }
        `,
        php: code`
          function mostProfitablePath($edges, $bob, $amount) {
              $n = count($amount);
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -2);
              $depth = array_fill(0, $n, 0);
              $bobTime = array_fill(0, $n, PHP_INT_MAX);
              $income = array_fill(0, $n, 0);
              $parent[0] = -1;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) {
                      if ($parent[$v] == -2) { $parent[$v] = $u; $depth[$v] = $depth[$u] + 1; $order[] = $v; }
                  }
              }
              for ($x = $bob, $t = 0; $x != -1; $x = $parent[$x], $t++) $bobTime[$x] = $t;
              $best = null;
              foreach ($order as $w) {
                  if ($depth[$w] < $bobTime[$w]) $gain = $amount[$w];
                  elseif ($depth[$w] == $bobTime[$w]) $gain = intdiv($amount[$w], 2);
                  else $gain = 0;
                  $income[$w] = $gain + ($w == 0 ? 0 : $income[$parent[$w]]);
                  if ($w != 0 && count($adj[$w]) == 1 && ($best === null || $income[$w] > $best)) $best = $income[$w];
              }
              return $best;
          }
        `,
        ruby: code`
          def mostProfitablePath(edges, bob, amount)
            n = amount.length
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -2)
            depth = Array.new(n, 0)
            bob_time = Array.new(n, 1 << 40)
            income = Array.new(n, 0)
            parent[0] = -1
            order = [0]
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v|
                next unless parent[v] == -2
                parent[v] = u
                depth[v] = depth[u] + 1
                order << v
              end
            end
            x = bob
            t = 0
            while x != -1
              bob_time[x] = t
              t += 1
              x = parent[x]
            end
            best = nil
            order.each do |w|
              gain = if depth[w] < bob_time[w]
                       amount[w]
                     elsif depth[w] == bob_time[w]
                       amount[w] / 2
                     else
                       0
                     end
              income[w] = gain + (w == 0 ? 0 : income[parent[w]])
              best = income[w] if w != 0 && adj[w].length == 1 && (best.nil? || income[w] > best)
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Sum of Distances in Tree (LC 834) ───────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      return Array.from({ length: n }, (_, s) => {
        const dist = new Array(n).fill(-1);
        dist[s] = 0;
        const q = [s];
        let total = 0;
        for (let h = 0; h < q.length; h++) {
          total += dist[q[h]];
          for (const v of adj[q[h]]) if (dist[v] < 0) { dist[v] = dist[q[h]] + 1; q.push(v); }
        }
        return total;
      });
    };
    return {
      slug: "sum-of-distances-in-tree",
      title: "Sum of Distances in Tree",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Graph", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "sumOfDistancesInTree",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "An undirected, connected tree has `n` nodes labelled `0` to `n - 1` and the `n - 1` edges in `edges`, each `[ai, bi]`.\n\nReturn an array `answer` of length `n` where `answer[i]` is the sum of the distances (numbers of edges) between node `i` and every other node.",
        [
          { in: "n = 5, edges = [[0,1],[1,2],[1,3],[3,4]]", out: "[8,5,8,6,9]", note: "From node 1 the distances are 1, 1, 1 and 2, which add up to 5." },
          { in: "n = 1, edges = []", out: "[0]" },
          { in: "n = 3, edges = [[2,0],[2,1]]", out: "[3,3,2]" },
        ],
        ["1 <= n <= 3 * 10^4", "edges.length == n - 1", "edges[i].length == 2", "0 <= ai, bi < n", "ai != bi", "the given input represents a valid tree"]),
      hints: [
        "One BFS per node is O(n²) — too slow for 3 · 10^4 nodes. Can one node's answer be derived from its neighbour's?",
        "Root the tree at 0 and compute subtree sizes. When you move the 'viewpoint' from a parent p to its child c, the nodes in c's subtree get 1 closer and all the others get 1 farther.",
        "So answer[c] = answer[p] − size[c] + (n − size[c]). Compute answer[0] with one post-order pass, then fill in the rest top-down.",
      ],
      editorial: explain({
        idea: "Re-rooting: compute the answer for the root directly, then shift the root across each edge, adjusting by how many nodes move closer and how many move farther.",
        steps: [
          "Root at node 0 and get a BFS order and parents.",
          "In reverse BFS order, accumulate `count[u]` (subtree size) and `sub[u]` (sum of distances from `u` to its subtree): `count[p] += count[c]`, `sub[p] += sub[c] + count[c]`.",
          "`answer[0] = sub[0]`.",
          "In BFS order, for every child `c` of `p`: `answer[c] = answer[p] − count[c] + (n − count[c])`.",
        ],
        why: "Moving from `p` to its child `c` shortens the distance to each of the `count[c]` nodes in `c`'s subtree by one and lengthens the distance to each of the other `n − count[c]` nodes by one; nothing else changes. Starting from the exact root value and applying this along every edge gives every node's exact sum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Recursive DFS over a 3 · 10^4-node path can overflow the call stack; a BFS order avoids recursion.",
          "`sub[p]` must add `count[c]` as well as `sub[c]` — every node of the child subtree is one edge farther from `p`.",
          "n = 1 has no edges; the answer is `[0]`.",
        ],
      }),
      examples: [
        { input: "5\n[[0,1],[1,2],[1,3],[3,4]]", expectedOutput: "[8,5,8,6,9]" },
        { input: "1\n[]", expectedOutput: "[0]" },
        { input: "3\n[[2,0],[2,1]]", expectedOutput: "[3,3,2]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 4, 6, 9, 14, 20, 30]);
        const edges = connectedEdges(rng, n, 0, 0);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntArr(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfDistancesInTree(n: int, edges: List[List[int]]) -> List[int]:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              seen = [False] * n
              seen[0] = True
              order = [0]
              for u in order:
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          order.append(v)
              count = [1] * n
              sub = [0] * n
              for u in reversed(order):
                  p = parent[u]
                  if p >= 0:
                      count[p] += count[u]
                      sub[p] += sub[u] + count[u]
              ans = [0] * n
              ans[0] = sub[0]
              for u in order:
                  if u != 0:
                      ans[u] = ans[parent[u]] - count[u] + (n - count[u])
              return ans
        `,
        javascript: code`
          var sumOfDistancesInTree = function(n, edges) {
              var adj = [], parent = [], count = [], sub = [], ans = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); count.push(1); sub.push(0); ans.push(0); }
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
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (var k = 1; k < n; k++) {
                  var w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              return ans;
          };
        `,
        typescript: code`
          function sumOfDistancesInTree(n: number, edges: number[][]): number[] {
              var adj: number[][] = [], parent: number[] = [], count: number[] = [], sub: number[] = [], ans: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); parent.push(-2); count.push(1); sub.push(0); ans.push(0); }
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
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (var k = 1; k < n; k++) {
                  var w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] sumOfDistancesInTree(int n, int[][] edges) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n], count = new int[n], sub = new int[n], ans = new int[n];
              Arrays.fill(parent, -2);
              Arrays.fill(count, 1);
              parent[0] = -1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) {
                  int u = order[h];
                  for (int v : adj.get(u)) if (parent[v] == -2) { parent[v] = u; order[tail++] = v; }
              }
              for (int t = n - 1; t > 0; t--) {
                  int c = order[t], p = parent[c];
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (int k = 1; k < n; k++) {
                  int w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> sumOfDistancesInTree(int n, vector<vector<int>>& edges) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -2), count(n, 1), sub(n, 0), ans(n, 0), order;
              parent[0] = -1;
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (parent[v] == -2) { parent[v] = u; order.push_back(v); }
              }
              for (int t = n - 1; t > 0; t--) {
                  int c = order[t], p = parent[c];
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (int k = 1; k < n; k++) {
                  int w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              return ans;
          }
        `,
        c: code`
          int* sumOfDistancesInTree(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
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
              int* parent = (int*)malloc((n + 1) * sizeof(int));
              int* order = (int*)malloc((n + 1) * sizeof(int));
              int* count = (int*)malloc((n + 1) * sizeof(int));
              int* sub = (int*)calloc(n + 1, sizeof(int));
              int* ans = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) { parent[i] = -2; count[i] = 1; }
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
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (int k = 1; k < n; k++) {
                  int w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              free(first);
              free(fill);
              free(adj);
              free(parent);
              free(order);
              free(count);
              free(sub);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          public static int[] SumOfDistancesInTree(int n, int[][] edges)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], order = new int[n], count = new int[n], sub = new int[n], ans = new int[n];
              for (int i = 0; i < n; i++) { parent[i] = -2; count[i] = 1; }
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
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for (int k = 1; k < n; k++)
              {
                  int w = order[k];
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w]);
              }
              return ans;
          }
        `,
        go: code`
          func sumOfDistancesInTree(n int, edges [][]int) []int {
          	adj := make([][]int, n)
          	for _, e := range edges {
          		adj[e[0]] = append(adj[e[0]], e[1])
          		adj[e[1]] = append(adj[e[1]], e[0])
          	}
          	parent := make([]int, n)
          	count := make([]int, n)
          	sub := make([]int, n)
          	ans := make([]int, n)
          	for i := 0; i < n; i++ {
          		parent[i] = -2
          		count[i] = 1
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
          		count[p] += count[c]
          		sub[p] += sub[c] + count[c]
          	}
          	ans[0] = sub[0]
          	for k := 1; k < n; k++ {
          		w := order[k]
          		ans[w] = ans[parent[w]] - count[w] + (n - count[w])
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun sumOfDistancesInTree(n: Int, edges: Array<IntArray>): IntArray {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -2 }
              val count = IntArray(n) { 1 }
              val sub = IntArray(n)
              val ans = IntArray(n)
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
                  count[p] += count[c]
                  sub[p] += sub[c] + count[c]
              }
              ans[0] = sub[0]
              for (k in 1 until n) {
                  val w = order[k]
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w])
              }
              return ans
          }
        `,
        swift: code`
          func sumOfDistancesInTree(_ n: Int, _ edges: [[Int]]) -> [Int] {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -2, count: n)
              var count = [Int](repeating: 1, count: n)
              var sub = [Int](repeating: 0, count: n)
              var ans = [Int](repeating: 0, count: n)
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
                  count[p] += count[c]
                  sub[p] += sub[c] + count[c]
                  t -= 1
              }
              ans[0] = sub[0]
              for k in stride(from: 1, to: n, by: 1) {
                  let w = order[k]
                  ans[w] = ans[parent[w]] - count[w] + (n - count[w])
              }
              return ans
          }
        `,
        rust: code`
          fn sumOfDistancesInTree(n: i32, edges: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent: Vec<i64> = vec![-2; n];
              let mut count = vec![1i32; n];
              let mut sub = vec![0i32; n];
              let mut ans = vec![0i32; n];
              parent[0] = -1;
              let mut order: Vec<usize> = vec![0];
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  h += 1;
                  for &v in adj[u].iter() {
                      if parent[v] == -2 {
                          parent[v] = u as i64;
                          order.push(v);
                      }
                  }
              }
              for t in (1..n).rev() {
                  let c = order[t];
                  let p = parent[c] as usize;
                  count[p] += count[c];
                  sub[p] += sub[c] + count[c];
              }
              ans[0] = sub[0];
              for k in 1..n {
                  let w = order[k];
                  ans[w] = ans[parent[w] as usize] - count[w] + (n as i32 - count[w]);
              }
              ans
          }
        `,
        php: code`
          function sumOfDistancesInTree($n, $edges) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -2);
              $count = array_fill(0, $n, 1);
              $sub = array_fill(0, $n, 0);
              $ans = array_fill(0, $n, 0);
              $parent[0] = -1;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) if ($parent[$v] == -2) { $parent[$v] = $u; $order[] = $v; }
              }
              for ($t = $n - 1; $t > 0; $t--) {
                  $c = $order[$t];
                  $p = $parent[$c];
                  $count[$p] += $count[$c];
                  $sub[$p] += $sub[$c] + $count[$c];
              }
              $ans[0] = $sub[0];
              for ($k = 1; $k < $n; $k++) {
                  $w = $order[$k];
                  $ans[$w] = $ans[$parent[$w]] - $count[$w] + ($n - $count[$w]);
              }
              return $ans;
          }
        `,
        ruby: code`
          def sumOfDistancesInTree(n, edges)
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -2)
            count = Array.new(n, 1)
            sub = Array.new(n, 0)
            ans = Array.new(n, 0)
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
            (n - 1).downto(1) do |t|
              c = order[t]
              p = parent[c]
              count[p] += count[c]
              sub[p] += sub[c] + count[c]
            end
            ans[0] = sub[0]
            (1...n).each do |k|
              w = order[k]
              ans[w] = ans[parent[w]] - count[w] + (n - count[w])
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Count Nodes With the Highest Score (LC 2049) ────────────────
  (() => {
    const ref = (parents: number[]) => {
      const n = parents.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 1; i < n; i++) { adj[i].push(parents[i]); adj[parents[i]].push(i); }
      const scores = Array.from({ length: n }, (_, cut) => {
        const seen = new Array(n).fill(false);
        seen[cut] = true;
        let product = 1;
        for (let s = 0; s < n; s++) {
          if (seen[s]) continue;
          let size = 0;
          const st = [s];
          seen[s] = true;
          while (st.length) {
            const u = st.pop()!;
            size++;
            for (const v of adj[u]) if (!seen[v]) { seen[v] = true; st.push(v); }
          }
          product *= size;
        }
        return product;
      });
      const best = Math.max(...scores);
      return scores.filter((x) => x === best).length;
    };
    return {
      slug: "count-nodes-with-the-highest-score",
      title: "Count Nodes With the Highest Score",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Tree", "Depth-First Search", "Binary Search", "Amazon", "Google"],
      signature: { funcName: "countHighestScoreNodes", params: [{ name: "parents", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **binary** tree has `n` nodes numbered `0` to `n - 1` and root `0`. It is given by `parents`, where `parents[i]` is the parent of node `i` and `parents[0] == -1`.\n\nThe **score** of a node is found by deleting that node together with its edges: the tree falls apart into one or more non-empty subtrees, and the score is the **product** of their sizes (a node whose removal leaves nothing behind cannot occur, since `n >= 2`).\n\nReturn the number of nodes that share the **highest** score.",
        [
          { in: "parents = [-1,0,0,1,1]", out: "3", note: "Node 0 scores 3 × 1 = 3, node 1 scores 1 × 1 × 2 = 2, and nodes 2, 3 and 4 each score 4." },
          { in: "parents = [-1,0]", out: "2", note: "Removing either node leaves a single node, so both score 1." },
        ],
        ["n == parents.length", "2 <= n <= 10^5", "parents[0] == -1", "0 <= parents[i] <= n - 1 for i != 0", "parents represents a valid binary tree"]),
      hints: [
        "Removing node u leaves at most three pieces: its left subtree, its right subtree, and everything above it.",
        "Subtree sizes give the first two directly; the piece above has n − size(u) nodes (absent for the root).",
        "Compute all subtree sizes in one bottom-up pass, then multiply the non-empty piece sizes per node — with 64-bit arithmetic, since a product can reach about (n/3)³.",
      ],
      editorial: explain({
        idea: "A node's score is the product of its children's subtree sizes and the size of the rest of the tree, so one subtree-size pass is enough.",
        steps: [
          "Build child lists from `parents` and a BFS order from the root.",
          "Walk the order backwards to accumulate `size[u] = 1 + Σ size(child)`.",
          "For each node, multiply the sizes of its children, and also `n − size[u]` unless `u` is the root.",
          "Track the maximum score and how many nodes reach it.",
        ],
        why: "Deleting `u` disconnects exactly its child subtrees from each other and from the part of the tree outside `u`'s subtree; those pieces have sizes `size(child)` and `n − size(u)`. Empty pieces are skipped, matching the definition, so the product is exactly the score.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The product can exceed 32 bits (around 3.7 · 10^13 for n = 10^5); use 64-bit integers.",
          "Leave out the upper piece for the root rather than multiplying by 0.",
          "`parents[i] < i` is not guaranteed, so compute sizes in a real traversal order.",
        ],
      }),
      examples: [
        { input: "[-1,0,0,1,1]", expectedOutput: "3" },
        { input: "[-1,0]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 7, 10, 14, 20, 30]);
        const order = [0].concat(shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1)));
        const parents = new Array(n).fill(-1);
        const kids = new Array(n).fill(0);
        const chainy = rng() < 0.3;
        for (let i = 1; i < n; i++) {
          let j = chainy ? i - 1 : ri(rng, 0, i - 1);
          while (kids[order[j]] >= 2) j = ri(rng, 0, i - 1);
          kids[order[j]]++;
          parents[order[i]] = order[j];
        }
        return { input: fmtIntArr(parents), expectedOutput: String(ref(parents)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countHighestScoreNodes(parents: List[int]) -> int:
              n = len(parents)
              children = [[] for _ in range(n)]
              for i in range(1, n):
                  children[parents[i]].append(i)
              order = [0]
              for u in order:
                  order.extend(children[u])
              size = [1] * n
              for u in reversed(order):
                  if u != 0:
                      size[parents[u]] += size[u]
              best, cnt = -1, 0
              for u in range(n):
                  score = 1
                  for c in children[u]:
                      score *= size[c]
                  if u != 0:
                      score *= n - size[u]
                  if score > best:
                      best, cnt = score, 1
                  elif score == best:
                      cnt += 1
              return cnt
        `,
        javascript: code`
          var countHighestScoreNodes = function(parents) {
              var n = parents.length;
              var children = [], size = [];
              for (var i = 0; i < n; i++) { children.push([]); size.push(1); }
              for (var k = 1; k < n; k++) children[parents[k]].push(k);
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var kids = children[order[h]];
                  for (var j = 0; j < kids.length; j++) order.push(kids[j]);
              }
              for (var t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              var best = -1, cnt = 0;
              for (var u = 0; u < n; u++) {
                  var score = 1;
                  for (var c = 0; c < children[u].length; c++) score *= size[children[u][c]];
                  if (u !== 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score === best) cnt++;
              }
              return cnt;
          };
        `,
        typescript: code`
          function countHighestScoreNodes(parents: number[]): number {
              var n = parents.length;
              var children: number[][] = [], size: number[] = [];
              for (var i = 0; i < n; i++) { children.push([]); size.push(1); }
              for (var k = 1; k < n; k++) children[parents[k]].push(k);
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var kids = children[order[h]];
                  for (var j = 0; j < kids.length; j++) order.push(kids[j]);
              }
              for (var t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              var best = -1, cnt = 0;
              for (var u = 0; u < n; u++) {
                  var score = 1;
                  for (var c = 0; c < children[u].length; c++) score *= size[children[u][c]];
                  if (u !== 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score === best) cnt++;
              }
              return cnt;
          }
        `,
        java: code`
          public static int countHighestScoreNodes(int[] parents) {
              int n = parents.length;
              List<List<Integer>> children = new ArrayList<>();
              for (int i = 0; i < n; i++) children.add(new ArrayList<>());
              for (int i = 1; i < n; i++) children.get(parents[i]).add(i);
              int[] order = new int[n], size = new int[n];
              Arrays.fill(size, 1);
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) for (int v : children.get(order[h])) order[tail++] = v;
              for (int t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              long best = -1;
              int cnt = 0;
              for (int u = 0; u < n; u++) {
                  long score = 1;
                  for (int c : children.get(u)) score *= size[c];
                  if (u != 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score == best) cnt++;
              }
              return cnt;
          }
        `,
        cpp: code`
          int countHighestScoreNodes(vector<int>& parents) {
              int n = parents.size();
              vector<vector<int>> children(n);
              for (int i = 1; i < n; i++) children[parents[i]].push_back(i);
              vector<int> order, size(n, 1);
              order.push_back(0);
              for (size_t h = 0; h < order.size(); h++) for (int v : children[order[h]]) order.push_back(v);
              for (int t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              long long best = -1;
              int cnt = 0;
              for (int u = 0; u < n; u++) {
                  long long score = 1;
                  for (int c : children[u]) score *= size[c];
                  if (u != 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score == best) cnt++;
              }
              return cnt;
          }
        `,
        c: code`
          int countHighestScoreNodes(int* parents, int parentsSize) {
              int n = parentsSize;
              int* first = (int*)calloc(n + 2, sizeof(int));
              for (int i = 1; i < n; i++) first[parents[i] + 1]++;
              for (int i = 0; i < n; i++) first[i + 1] += first[i];
              int* fill = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) fill[i] = first[i];
              int* kids = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 1; i < n; i++) kids[fill[parents[i]]++] = i;
              int* order = (int*)malloc((n + 1) * sizeof(int));
              int* size = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) size[i] = 1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++)
                  for (int k = first[order[h]]; k < first[order[h] + 1]; k++) order[tail++] = kids[k];
              for (int t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              long long best = -1;
              int cnt = 0;
              for (int u = 0; u < n; u++) {
                  long long score = 1;
                  for (int k = first[u]; k < first[u + 1]; k++) score *= size[kids[k]];
                  if (u != 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score == best) cnt++;
              }
              free(first);
              free(fill);
              free(kids);
              free(order);
              free(size);
              return cnt;
          }
        `,
        csharp: code`
          public static int CountHighestScoreNodes(int[] parents)
          {
              int n = parents.Length;
              var children = new List<int>[n];
              for (int i = 0; i < n; i++) children[i] = new List<int>();
              for (int i = 1; i < n; i++) children[parents[i]].Add(i);
              int[] order = new int[n], size = new int[n];
              for (int i = 0; i < n; i++) size[i] = 1;
              int tail = 0;
              order[tail++] = 0;
              for (int h = 0; h < tail; h++) foreach (int v in children[order[h]]) order[tail++] = v;
              for (int t = n - 1; t > 0; t--) size[parents[order[t]]] += size[order[t]];
              long best = -1;
              int cnt = 0;
              for (int u = 0; u < n; u++)
              {
                  long score = 1;
                  foreach (int c in children[u]) score *= size[c];
                  if (u != 0) score *= n - size[u];
                  if (score > best) { best = score; cnt = 1; }
                  else if (score == best) cnt++;
              }
              return cnt;
          }
        `,
        go: code`
          func countHighestScoreNodes(parents []int) int {
          	n := len(parents)
          	children := make([][]int, n)
          	for i := 1; i < n; i++ {
          		children[parents[i]] = append(children[parents[i]], i)
          	}
          	order := []int{0}
          	for h := 0; h < len(order); h++ {
          		order = append(order, children[order[h]]...)
          	}
          	size := make([]int, n)
          	for i := range size {
          		size[i] = 1
          	}
          	for t := n - 1; t > 0; t-- {
          		size[parents[order[t]]] += size[order[t]]
          	}
          	best, cnt := int64(-1), 0
          	for u := 0; u < n; u++ {
          		score := int64(1)
          		for _, c := range children[u] {
          			score *= int64(size[c])
          		}
          		if u != 0 {
          			score *= int64(n - size[u])
          		}
          		if score > best {
          			best = score
          			cnt = 1
          		} else if score == best {
          			cnt++
          		}
          	}
          	return cnt
          }
        `,
        kotlin: code`
          fun countHighestScoreNodes(parents: IntArray): Int {
              val n = parents.size
              val children = Array(n) { ArrayList<Int>() }
              for (i in 1 until n) children[parents[i]].add(i)
              val order = IntArray(n)
              val size = IntArray(n) { 1 }
              var tail = 0
              order[tail++] = 0
              var h = 0
              while (h < tail) {
                  for (v in children[order[h]]) order[tail++] = v
                  h++
              }
              for (t in n - 1 downTo 1) size[parents[order[t]]] += size[order[t]]
              var best = -1L
              var cnt = 0
              for (u in 0 until n) {
                  var score = 1L
                  for (c in children[u]) score *= size[c].toLong()
                  if (u != 0) score *= (n - size[u]).toLong()
                  if (score > best) { best = score; cnt = 1 }
                  else if (score == best) cnt++
              }
              return cnt
          }
        `,
        swift: code`
          func countHighestScoreNodes(_ parents: [Int]) -> Int {
              let n = parents.count
              var children = [[Int]](repeating: [], count: n)
              for i in 1..<n { children[parents[i]].append(i) }
              var order = [0]
              var h = 0
              while h < order.count {
                  order.append(contentsOf: children[order[h]])
                  h += 1
              }
              var size = [Int](repeating: 1, count: n)
              var t = n - 1
              while t > 0 {
                  size[parents[order[t]]] += size[order[t]]
                  t -= 1
              }
              var best = -1, cnt = 0
              for u in 0..<n {
                  var score = 1
                  for c in children[u] { score *= size[c] }
                  if u != 0 { score *= n - size[u] }
                  if score > best { best = score; cnt = 1 }
                  else if score == best { cnt += 1 }
              }
              return cnt
          }
        `,
        rust: code`
          fn countHighestScoreNodes(parents: Vec<i32>) -> i32 {
              let n = parents.len();
              let mut children: Vec<Vec<usize>> = vec![Vec::new(); n];
              for i in 1..n {
                  children[parents[i] as usize].push(i);
              }
              let mut order: Vec<usize> = vec![0];
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  for &v in children[u].iter() {
                      order.push(v);
                  }
                  h += 1;
              }
              let mut size = vec![1i64; n];
              for t in (1..n).rev() {
                  let u = order[t];
                  let p = parents[u] as usize;
                  size[p] += size[u];
              }
              let mut best: i64 = -1;
              let mut cnt = 0;
              for u in 0..n {
                  let mut score: i64 = 1;
                  for &c in children[u].iter() {
                      score *= size[c];
                  }
                  if u != 0 {
                      score *= n as i64 - size[u];
                  }
                  if score > best {
                      best = score;
                      cnt = 1;
                  } else if score == best {
                      cnt += 1;
                  }
              }
              cnt
          }
        `,
        php: code`
          function countHighestScoreNodes($parents) {
              $n = count($parents);
              $children = array_fill(0, $n, []);
              for ($i = 1; $i < $n; $i++) $children[$parents[$i]][] = $i;
              $order = [0];
              for ($h = 0; $h < count($order); $h++) {
                  foreach ($children[$order[$h]] as $v) $order[] = $v;
              }
              $size = array_fill(0, $n, 1);
              for ($t = $n - 1; $t > 0; $t--) $size[$parents[$order[$t]]] += $size[$order[$t]];
              $best = -1;
              $cnt = 0;
              for ($u = 0; $u < $n; $u++) {
                  $score = 1;
                  foreach ($children[$u] as $c) $score *= $size[$c];
                  if ($u != 0) $score *= $n - $size[$u];
                  if ($score > $best) { $best = $score; $cnt = 1; }
                  elseif ($score == $best) $cnt++;
              }
              return $cnt;
          }
        `,
        ruby: code`
          def countHighestScoreNodes(parents)
            n = parents.length
            children = Array.new(n) { [] }
            (1...n).each { |i| children[parents[i]] << i }
            order = [0]
            h = 0
            while h < order.length
              order.concat(children[order[h]])
              h += 1
            end
            size = Array.new(n, 1)
            (n - 1).downto(1) { |t| size[parents[order[t]]] += size[order[t]] }
            best = -1
            cnt = 0
            n.times do |u|
              score = 1
              children[u].each { |c| score *= size[c] }
              score *= n - size[u] if u != 0
              if score > best
                best = score
                cnt = 1
              elsif score == best
                cnt += 1
              end
            end
            cnt
          end
        `,
      },
    };
  })(),

  // ── Minimum Jumps to Reach Home (LC 1654) ───────────────────────
  (() => {
    const ref = (forbidden: number[], a: number, b: number, x: number) => {
      // Plain BFS over (position, last jump was backward) with a deliberately loose bound.
      const limit = 4 * (Math.max(...forbidden) + x + a + b) + 10;
      const blocked = new Set(forbidden);
      const seen = new Set<string>(["0,0"]);
      const q: number[][] = [[0, 0, 0]];
      for (let h = 0; h < q.length; h++) {
        const [p, back, s] = q[h];
        if (p === x) return s;
        const f = p + a;
        if (f <= limit && !blocked.has(f) && !seen.has(f + ",0")) { seen.add(f + ",0"); q.push([f, 0, s + 1]); }
        if (!back) {
          const g = p - b;
          if (g >= 0 && !blocked.has(g) && !seen.has(g + ",1")) { seen.add(g + ",1"); q.push([g, 1, s + 1]); }
        }
      }
      return -1;
    };
    return {
      slug: "minimum-jumps-to-reach-home",
      title: "Minimum Jumps to Reach Home",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Breadth-First Search", "Amazon", "Google"],
      signature: {
        funcName: "minimumJumps",
        params: [
          { name: "forbidden", type: "int[]" as const }, { name: "a", type: "int" as const },
          { name: "b", type: "int" as const }, { name: "x", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A bug starts at position `0` on the x-axis and wants to reach its home at position `x`. Each jump is one of:\n\n- exactly `a` positions **forward** (to the right), or\n- exactly `b` positions **backward** (to the left).\n\nThe bug may not jump backward **twice in a row**, may never land on a negative position, and may never land on any position listed in `forbidden`. It may jump past its home.\n\nReturn the minimum number of jumps needed to land exactly on `x`, or `-1` if it is impossible.",
        [
          { in: "forbidden = [1,2,3], a = 4, b = 3, x = 5", out: "3", note: "0 → 4 → 8 → 5: two jumps forward, one back." },
          { in: "forbidden = [5,9,2], a = 4, b = 3, x = 6", out: "-1", note: "Position 6 can only be entered from 2 or 9, and both are forbidden." },
          { in: "forbidden = [8], a = 3, b = 2, x = 0", out: "0" },
        ],
        ["1 <= forbidden.length <= 1000", "1 <= a, b, forbidden[i] <= 2000", "0 <= x <= 2000", "all values in forbidden are distinct", "x is not forbidden"]),
      hints: [
        "Every jump costs one, so BFS finds the fewest jumps — but the state must also remember whether the previous jump went backward.",
        "The search space looks infinite to the right. It is enough to explore positions up to max(x, max(forbidden)) + a + b; beyond that, going further right never helps.",
        "BFS over states (position, lastWasBackward) within that bound, marking each state visited once.",
      ],
      editorial: explain({
        idea: "Breadth-first search over states `(position, previous jump was backward)`, with positions capped at `max(x, max(forbidden)) + a + b`.",
        steps: [
          "Put the forbidden positions in a set and compute `limit = max(x, max(forbidden)) + a + b`.",
          "BFS from `(0, false)` with distance 0.",
          "From `(p, back)`: the forward jump to `p + a` is allowed if it is within `limit` and not forbidden; the backward jump to `p − b` is allowed if `back` is false and the target is non-negative and not forbidden.",
          "Return the distance of the first state whose position equals `x`; if the queue empties, return -1.",
        ],
        why: "The rule about consecutive backward jumps depends only on the last move, so the pair (position, last move) captures everything that matters and BFS gives shortest jump counts. The cap is safe: past every forbidden cell and past `x`, the axis is free, and a shortest route never needs to stray more than one forward and one backward jump beyond the largest of `x` and the forbidden positions (a known bound for this problem); within the cap the state space is finite, so BFS terminates.",
        time: "O(max(x, max(forbidden)) + a + b)",
        space: "O(max(x, max(forbidden)) + a + b)",
        pitfalls: [
          "Visiting a position after a backward jump is a different state from visiting it after a forward jump — keep two visited flags per position.",
          "Two backward jumps in a row are illegal even if both targets are free.",
          "Without an upper bound the forward jumps run forever when `x` is unreachable.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n4\n3\n5", expectedOutput: "3" },
        { input: "[5,9,2]\n4\n3\n6", expectedOutput: "-1" },
        { input: "[8]\n3\n2\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const V = pick(rng, [10, 30, 80, 200]);
        const A = pick(rng, [4, 12, 40]);
        const a = ri(rng, 1, A), b = ri(rng, 1, A);
        const want = ri(rng, 1, pick(rng, [1, 4, 12]));
        const avoid = new Set<number>([0]);
        let x: number;
        if (rng() < 0.5) {
          // Plant a legal route and keep the forbidden cells off it, so home is reachable.
          let pos = 0, back = false;
          for (let s = ri(rng, 0, 10); s > 0; s--) {
            if (!back && pos - b >= 0 && rng() < 0.4) { pos -= b; back = true; } else { pos += a; back = false; }
            avoid.add(pos);
          }
          x = pos;
        } else {
          x = ri(rng, 0, V);
        }
        avoid.add(x);
        const cells = shuffle(rng, Array.from({ length: Math.max(V, x) + 2 * A }, (_, i) => i + 1)).filter((v) => !avoid.has(v));
        const forbidden = cells.slice(0, Math.max(1, Math.min(want, cells.length)));
        return {
          input: `${fmtIntArr(forbidden)}\n${a}\n${b}\n${x}`,
          expectedOutput: String(ref(forbidden, a, b, x)),
        };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minimumJumps(forbidden: List[int], a: int, b: int, x: int) -> int:
              limit = max(x, max(forbidden)) + a + b
              blocked = set(forbidden)
              seen = [[False, False] for _ in range(limit + 1)]
              seen[0][0] = True
              q = deque([(0, 0, 0)])
              while q:
                  pos, back, steps = q.popleft()
                  if pos == x:
                      return steps
                  nxt = pos + a
                  if nxt <= limit and nxt not in blocked and not seen[nxt][0]:
                      seen[nxt][0] = True
                      q.append((nxt, 0, steps + 1))
                  if back == 0:
                      nxt = pos - b
                      if nxt >= 0 and nxt not in blocked and not seen[nxt][1]:
                          seen[nxt][1] = True
                          q.append((nxt, 1, steps + 1))
              return -1
        `,
        javascript: code`
          var minimumJumps = function(forbidden, a, b, x) {
              var top = x;
              for (var i = 0; i < forbidden.length; i++) if (forbidden[i] > top) top = forbidden[i];
              var limit = top + a + b;
              var blocked = [], seen = [];
              for (var k = 0; k <= limit; k++) blocked.push(false);
              for (var f = 0; f < forbidden.length; f++) blocked[forbidden[f]] = true;
              for (var s = 0; s < 2 * (limit + 1); s++) seen.push(false);
              var qp = [0], qb = [0], qs = [0];
              seen[0] = true;
              for (var h = 0; h < qp.length; h++) {
                  var pos = qp[h], back = qb[h], steps = qs[h];
                  if (pos === x) return steps;
                  var fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd]) {
                      seen[2 * fwd] = true;
                      qp.push(fwd); qb.push(0); qs.push(steps + 1);
                  }
                  var bwd = pos - b;
                  if (back === 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]) {
                      seen[2 * bwd + 1] = true;
                      qp.push(bwd); qb.push(1); qs.push(steps + 1);
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function minimumJumps(forbidden: number[], a: number, b: number, x: number): number {
              var top = x;
              for (var i = 0; i < forbidden.length; i++) if (forbidden[i] > top) top = forbidden[i];
              var limit = top + a + b;
              var blocked: boolean[] = [], seen: boolean[] = [];
              for (var k = 0; k <= limit; k++) blocked.push(false);
              for (var f = 0; f < forbidden.length; f++) blocked[forbidden[f]] = true;
              for (var s = 0; s < 2 * (limit + 1); s++) seen.push(false);
              var qp: number[] = [0], qb: number[] = [0], qs: number[] = [0];
              seen[0] = true;
              for (var h = 0; h < qp.length; h++) {
                  var pos = qp[h], back = qb[h], steps = qs[h];
                  if (pos === x) return steps;
                  var fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd]) {
                      seen[2 * fwd] = true;
                      qp.push(fwd); qb.push(0); qs.push(steps + 1);
                  }
                  var bwd = pos - b;
                  if (back === 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]) {
                      seen[2 * bwd + 1] = true;
                      qp.push(bwd); qb.push(1); qs.push(steps + 1);
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minimumJumps(int[] forbidden, int a, int b, int x) {
              int top = x;
              for (int f : forbidden) top = Math.max(top, f);
              int limit = top + a + b;
              boolean[] blocked = new boolean[limit + 1];
              for (int f : forbidden) blocked[f] = true;
              boolean[][] seen = new boolean[limit + 1][2];
              int cap = 2 * (limit + 1) + 1;
              int[] qp = new int[cap], qb = new int[cap], qs = new int[cap];
              int head = 0, tail = 0;
              qp[tail] = 0; qb[tail] = 0; qs[tail++] = 0;
              seen[0][0] = true;
              while (head < tail) {
                  int pos = qp[head], back = qb[head], steps = qs[head];
                  head++;
                  if (pos == x) return steps;
                  int fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[fwd][0]) {
                      seen[fwd][0] = true;
                      qp[tail] = fwd; qb[tail] = 0; qs[tail++] = steps + 1;
                  }
                  int bwd = pos - b;
                  if (back == 0 && bwd >= 0 && !blocked[bwd] && !seen[bwd][1]) {
                      seen[bwd][1] = true;
                      qp[tail] = bwd; qb[tail] = 1; qs[tail++] = steps + 1;
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minimumJumps(vector<int>& forbidden, int a, int b, int x) {
              int top = x;
              for (int f : forbidden) top = max(top, f);
              int limit = top + a + b;
              vector<char> blocked(limit + 1, 0), seen(2 * (limit + 1), 0);
              for (int f : forbidden) blocked[f] = 1;
              vector<int> qp, qb, qs;
              qp.push_back(0); qb.push_back(0); qs.push_back(0);
              seen[0] = 1;
              for (size_t h = 0; h < qp.size(); h++) {
                  int pos = qp[h], back = qb[h], steps = qs[h];
                  if (pos == x) return steps;
                  int fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd]) {
                      seen[2 * fwd] = 1;
                      qp.push_back(fwd); qb.push_back(0); qs.push_back(steps + 1);
                  }
                  int bwd = pos - b;
                  if (back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]) {
                      seen[2 * bwd + 1] = 1;
                      qp.push_back(bwd); qb.push_back(1); qs.push_back(steps + 1);
                  }
              }
              return -1;
          }
        `,
        c: code`
          int minimumJumps(int* forbidden, int forbiddenSize, int a, int b, int x) {
              int top = x;
              for (int i = 0; i < forbiddenSize; i++) if (forbidden[i] > top) top = forbidden[i];
              int limit = top + a + b;
              char* blocked = (char*)calloc(limit + 1, 1);
              char* seen = (char*)calloc(2 * (limit + 1), 1);
              for (int i = 0; i < forbiddenSize; i++) blocked[forbidden[i]] = 1;
              int cap = 2 * (limit + 1) + 1;
              int* qp = (int*)malloc(cap * sizeof(int));
              int* qb = (int*)malloc(cap * sizeof(int));
              int* qs = (int*)malloc(cap * sizeof(int));
              int head = 0, tail = 0, ans = -1;
              qp[tail] = 0; qb[tail] = 0; qs[tail++] = 0;
              seen[0] = 1;
              while (head < tail) {
                  int pos = qp[head], back = qb[head], steps = qs[head];
                  head++;
                  if (pos == x) { ans = steps; break; }
                  int fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd]) {
                      seen[2 * fwd] = 1;
                      qp[tail] = fwd; qb[tail] = 0; qs[tail++] = steps + 1;
                  }
                  int bwd = pos - b;
                  if (back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]) {
                      seen[2 * bwd + 1] = 1;
                      qp[tail] = bwd; qb[tail] = 1; qs[tail++] = steps + 1;
                  }
              }
              free(blocked);
              free(seen);
              free(qp);
              free(qb);
              free(qs);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumJumps(int[] forbidden, int a, int b, int x)
          {
              int top = x;
              foreach (int f in forbidden) top = Math.Max(top, f);
              int limit = top + a + b;
              bool[] blocked = new bool[limit + 1];
              foreach (int f in forbidden) blocked[f] = true;
              bool[] seen = new bool[2 * (limit + 1)];
              var queue = new Queue<int[]>();
              queue.Enqueue(new int[] { 0, 0, 0 });
              seen[0] = true;
              while (queue.Count > 0)
              {
                  int[] cur = queue.Dequeue();
                  int pos = cur[0], back = cur[1], steps = cur[2];
                  if (pos == x) return steps;
                  int fwd = pos + a;
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd])
                  {
                      seen[2 * fwd] = true;
                      queue.Enqueue(new int[] { fwd, 0, steps + 1 });
                  }
                  int bwd = pos - b;
                  if (back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1])
                  {
                      seen[2 * bwd + 1] = true;
                      queue.Enqueue(new int[] { bwd, 1, steps + 1 });
                  }
              }
              return -1;
          }
        `,
        go: code`
          func minimumJumps(forbidden []int, a int, b int, x int) int {
          	top := x
          	for _, f := range forbidden {
          		if f > top {
          			top = f
          		}
          	}
          	limit := top + a + b
          	blocked := make([]bool, limit+1)
          	for _, f := range forbidden {
          		blocked[f] = true
          	}
          	seen := make([]bool, 2*(limit+1))
          	qp, qb, qs := []int{0}, []int{0}, []int{0}
          	seen[0] = true
          	for h := 0; h < len(qp); h++ {
          		pos, back, steps := qp[h], qb[h], qs[h]
          		if pos == x {
          			return steps
          		}
          		fwd := pos + a
          		if fwd <= limit && !blocked[fwd] && !seen[2*fwd] {
          			seen[2*fwd] = true
          			qp = append(qp, fwd)
          			qb = append(qb, 0)
          			qs = append(qs, steps+1)
          		}
          		bwd := pos - b
          		if back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2*bwd+1] {
          			seen[2*bwd+1] = true
          			qp = append(qp, bwd)
          			qb = append(qb, 1)
          			qs = append(qs, steps+1)
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun minimumJumps(forbidden: IntArray, a: Int, b: Int, x: Int): Int {
              var top = x
              for (f in forbidden) if (f > top) top = f
              val limit = top + a + b
              val blocked = BooleanArray(limit + 1)
              for (f in forbidden) blocked[f] = true
              val seen = BooleanArray(2 * (limit + 1))
              val cap = 2 * (limit + 1) + 1
              val qp = IntArray(cap)
              val qb = IntArray(cap)
              val qs = IntArray(cap)
              var head = 0
              var tail = 1
              seen[0] = true
              while (head < tail) {
                  val pos = qp[head]
                  val back = qb[head]
                  val steps = qs[head]
                  head++
                  if (pos == x) return steps
                  val fwd = pos + a
                  if (fwd <= limit && !blocked[fwd] && !seen[2 * fwd]) {
                      seen[2 * fwd] = true
                      qp[tail] = fwd; qb[tail] = 0; qs[tail] = steps + 1; tail++
                  }
                  val bwd = pos - b
                  if (back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]) {
                      seen[2 * bwd + 1] = true
                      qp[tail] = bwd; qb[tail] = 1; qs[tail] = steps + 1; tail++
                  }
              }
              return -1
          }
        `,
        swift: code`
          func minimumJumps(_ forbidden: [Int], _ a: Int, _ b: Int, _ x: Int) -> Int {
              var top = x
              for f in forbidden where f > top { top = f }
              let limit = top + a + b
              var blocked = [Bool](repeating: false, count: limit + 1)
              for f in forbidden { blocked[f] = true }
              var seen = [Bool](repeating: false, count: 2 * (limit + 1))
              var qp = [0], qb = [0], qs = [0]
              seen[0] = true
              var h = 0
              while h < qp.count {
                  let pos = qp[h], back = qb[h], steps = qs[h]
                  h += 1
                  if pos == x { return steps }
                  let fwd = pos + a
                  if fwd <= limit && !blocked[fwd] && !seen[2 * fwd] {
                      seen[2 * fwd] = true
                      qp.append(fwd); qb.append(0); qs.append(steps + 1)
                  }
                  let bwd = pos - b
                  if back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1] {
                      seen[2 * bwd + 1] = true
                      qp.append(bwd); qb.append(1); qs.append(steps + 1)
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn minimumJumps(forbidden: Vec<i32>, a: i32, b: i32, x: i32) -> i32 {
              let mut top = x;
              for &f in forbidden.iter() {
                  if f > top {
                      top = f;
                  }
              }
              let limit = top + a + b;
              let mut blocked = vec![false; (limit + 1) as usize];
              for &f in forbidden.iter() {
                  blocked[f as usize] = true;
              }
              let mut seen = vec![false; (2 * (limit + 1)) as usize];
              let mut qp: Vec<i32> = vec![0];
              let mut qb: Vec<i32> = vec![0];
              let mut qs: Vec<i32> = vec![0];
              seen[0] = true;
              let mut h = 0;
              while h < qp.len() {
                  let pos = qp[h];
                  let back = qb[h];
                  let steps = qs[h];
                  h += 1;
                  if pos == x {
                      return steps;
                  }
                  let fwd = pos + a;
                  if fwd <= limit && !blocked[fwd as usize] && !seen[(2 * fwd) as usize] {
                      seen[(2 * fwd) as usize] = true;
                      qp.push(fwd);
                      qb.push(0);
                      qs.push(steps + 1);
                  }
                  let bwd = pos - b;
                  if back == 0 && bwd >= 0 && !blocked[bwd as usize] && !seen[(2 * bwd + 1) as usize] {
                      seen[(2 * bwd + 1) as usize] = true;
                      qp.push(bwd);
                      qb.push(1);
                      qs.push(steps + 1);
                  }
              }
              -1
          }
        `,
        php: code`
          function minimumJumps($forbidden, $a, $b, $x) {
              $top = $x;
              foreach ($forbidden as $f) if ($f > $top) $top = $f;
              $limit = $top + $a + $b;
              $blocked = array_fill(0, $limit + 1, false);
              foreach ($forbidden as $f) $blocked[$f] = true;
              $seen = array_fill(0, 2 * ($limit + 1), false);
              $qp = [0];
              $qb = [0];
              $qs = [0];
              $seen[0] = true;
              for ($h = 0; $h < count($qp); $h++) {
                  $pos = $qp[$h];
                  $back = $qb[$h];
                  $steps = $qs[$h];
                  if ($pos == $x) return $steps;
                  $fwd = $pos + $a;
                  if ($fwd <= $limit && !$blocked[$fwd] && !$seen[2 * $fwd]) {
                      $seen[2 * $fwd] = true;
                      $qp[] = $fwd; $qb[] = 0; $qs[] = $steps + 1;
                  }
                  $bwd = $pos - $b;
                  if ($back == 0 && $bwd >= 0 && !$blocked[$bwd] && !$seen[2 * $bwd + 1]) {
                      $seen[2 * $bwd + 1] = true;
                      $qp[] = $bwd; $qb[] = 1; $qs[] = $steps + 1;
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minimumJumps(forbidden, a, b, x)
            limit = [x, forbidden.max].max + a + b
            blocked = Array.new(limit + 1, false)
            forbidden.each { |f| blocked[f] = true }
            seen = Array.new(2 * (limit + 1), false)
            qp = [0]
            qb = [0]
            qs = [0]
            seen[0] = true
            h = 0
            while h < qp.length
              pos = qp[h]
              back = qb[h]
              steps = qs[h]
              h += 1
              return steps if pos == x
              fwd = pos + a
              if fwd <= limit && !blocked[fwd] && !seen[2 * fwd]
                seen[2 * fwd] = true
                qp << fwd
                qb << 0
                qs << steps + 1
              end
              bwd = pos - b
              if back == 0 && bwd >= 0 && !blocked[bwd] && !seen[2 * bwd + 1]
                seen[2 * bwd + 1] = true
                qp << bwd
                qb << 1
                qs << steps + 1
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Lexicographically Smallest Equivalent String (LC 1061) ──────
  (() => {
    const ref = (s1: string, s2: string, base: string) => {
      // Closure of the equivalence relation by repeated relaxation over the 26 letters.
      const rep = Array.from({ length: 26 }, (_, i) => i);
      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i < s1.length; i++) {
          const x = s1.charCodeAt(i) - 97, y = s2.charCodeAt(i) - 97;
          const m = Math.min(rep[x], rep[y]);
          if (rep[x] !== m || rep[y] !== m) { rep[x] = m; rep[y] = m; changed = true; }
        }
        for (let c = 0; c < 26; c++) if (rep[rep[c]] < rep[c]) { rep[c] = rep[rep[c]]; changed = true; }
      }
      return base.split("").map((ch) => String.fromCharCode(97 + rep[ch.charCodeAt(0) - 97])).join("");
    };
    return {
      slug: "lexicographically-smallest-equivalent-string",
      title: "Lexicographically Smallest Equivalent String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Union Find", "Amazon", "Google"],
      signature: {
        funcName: "smallestEquivalentString",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }, { name: "baseStr", type: "string" as const }],
        returns: "string" as const,
      },
      description: describe(
        "Two strings `s1` and `s2` of equal length declare letter equivalences: for every index `i`, `s1[i]` and `s2[i]` are equivalent.\n\nThese equivalences behave as you would expect: every letter is equivalent to itself, equivalence is symmetric, and it is transitive (if `a ~ b` and `b ~ c`, then `a ~ c`).\n\nUsing them, you may replace any letter of `baseStr` with any letter equivalent to it. Return the **lexicographically smallest** string you can obtain.",
        [
          { in: "s1 = \"kairo\", s2 = \"codek\", baseStr = \"rock\"", out: "eaaa", note: "The classes are {a, c, k, o}, {d, i} and {e, r}; each letter becomes the smallest of its class." },
          { in: "s1 = \"abc\", s2 = \"bcd\", baseStr = \"dxb\"", out: "axa", note: "`x` is only equivalent to itself." },
        ],
        ["1 <= s1.length, s2.length, baseStr.length <= 1000", "s1.length == s2.length", "s1, s2 and baseStr consist of lowercase English letters"]),
      hints: [
        "The equivalences split the 26 letters into groups; any letter can be swapped for any other letter of its group.",
        "To minimise the string, replace every character independently by the smallest letter of its group.",
        "Use union-find over the 26 letters, always keeping the smaller letter as the root, so `find(c)` is the group's smallest letter.",
      ],
      editorial: explain({
        idea: "Union-find on the alphabet: merge `s1[i]` with `s2[i]` for every index, keep the smallest letter as each set's root, then map each character of `baseStr` to its root.",
        steps: [
          "Initialise `root[c] = c` for the 26 letters.",
          "For each index `i`, find the roots of `s1[i]` and `s2[i]` and attach the larger root under the smaller one.",
          "Build the answer by replacing every character of `baseStr` with `find(character)`.",
        ],
        why: "The equivalence classes are exactly the connected components of the graph whose edges are the pairs `(s1[i], s2[i])`, which union-find computes. Characters of `baseStr` can be changed independently, so the lexicographically smallest result picks the minimum letter of each character's class at every position — and attaching the larger root under the smaller keeps that minimum at the root.",
        time: "O((n + m) · α(26))",
        space: "O(26)",
        pitfalls: [
          "Union by smaller **root**, not by smaller letter of the pair — the pair's letters may not be their sets' roots.",
          "Letters that never appear in `s1`/`s2` stay as they are.",
          "Equivalence is transitive: `a ~ b` and `b ~ c` means `c` can become `a` even though they never appear together.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n\"codek\"\n\"rock\"", expectedOutput: "eaaa" },
        { input: "\"abc\"\n\"bcd\"\n\"dxb\"", expectedOutput: "axa" },
      ],
      gen: (rng: Rng) => {
        const alphabet = pick(rng, ["abcde", "abcdefgh", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const L = ri(rng, 1, pick(rng, [1, 3, 6, 12]));
        const s1 = randLower(rng, L, L, alphabet), s2 = randLower(rng, L, L, alphabet);
        const base = randLower(rng, 1, pick(rng, [3, 8, 15]), rng() < 0.7 ? alphabet : "abcdefghijklmnopqrstuvwxyz");
        return { input: `"${s1}"\n"${s2}"\n"${base}"`, expectedOutput: ref(s1, s2, base) };
      },
      solutions: {
        python: code`
          def smallestEquivalentString(s1: str, s2: str, baseStr: str) -> str:
              root = list(range(26))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              for c1, c2 in zip(s1, s2):
                  r1, r2 = find(ord(c1) - 97), find(ord(c2) - 97)
                  if r1 < r2:
                      root[r2] = r1
                  elif r2 < r1:
                      root[r1] = r2
              return "".join(chr(find(ord(c) - 97) + 97) for c in baseStr)
        `,
        javascript: code`
          var smallestEquivalentString = function(s1, s2, baseStr) {
              var root = [];
              for (var i = 0; i < 26; i++) root.push(i);
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              for (var k = 0; k < s1.length; k++) {
                  var r1 = find(s1.charCodeAt(k) - 97), r2 = find(s2.charCodeAt(k) - 97);
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              var out = [];
              for (var j = 0; j < baseStr.length; j++) out.push(String.fromCharCode(find(baseStr.charCodeAt(j) - 97) + 97));
              return out.join("");
          };
        `,
        typescript: code`
          function smallestEquivalentString(s1: string, s2: string, baseStr: string): string {
              var root: number[] = [];
              for (var i = 0; i < 26; i++) root.push(i);
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              for (var k = 0; k < s1.length; k++) {
                  var r1 = find(s1.charCodeAt(k) - 97), r2 = find(s2.charCodeAt(k) - 97);
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              var out: string[] = [];
              for (var j = 0; j < baseStr.length; j++) out.push(String.fromCharCode(find(baseStr.charCodeAt(j) - 97) + 97));
              return out.join("");
          }
        `,
        java: code`
          public static String smallestEquivalentString(String s1, String s2, String baseStr) {
              int[] root = new int[26];
              for (int i = 0; i < 26; i++) root[i] = i;
              for (int k = 0; k < s1.length(); k++) {
                  int r1 = lsFind(root, s1.charAt(k) - 'a'), r2 = lsFind(root, s2.charAt(k) - 'a');
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              StringBuilder sb = new StringBuilder();
              for (int j = 0; j < baseStr.length(); j++) sb.append((char) ('a' + lsFind(root, baseStr.charAt(j) - 'a')));
              return sb.toString();
          }

          static int lsFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        cpp: code`
          static int lsFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          string smallestEquivalentString(string s1, string s2, string baseStr) {
              int root[26];
              for (int i = 0; i < 26; i++) root[i] = i;
              for (size_t k = 0; k < s1.size(); k++) {
                  int r1 = lsFind(root, s1[k] - 'a'), r2 = lsFind(root, s2[k] - 'a');
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              string out = baseStr;
              for (size_t j = 0; j < out.size(); j++) out[j] = (char)('a' + lsFind(root, baseStr[j] - 'a'));
              return out;
          }
        `,
        c: code`
          static int lsFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          char* smallestEquivalentString(const char* s1, const char* s2, const char* baseStr) {
              int root[26];
              for (int i = 0; i < 26; i++) root[i] = i;
              int len = (int)strlen(s1);
              for (int k = 0; k < len; k++) {
                  int r1 = lsFind(root, s1[k] - 'a'), r2 = lsFind(root, s2[k] - 'a');
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              int m = (int)strlen(baseStr);
              char* out = (char*)malloc(m + 1);
              for (int j = 0; j < m; j++) out[j] = (char)('a' + lsFind(root, baseStr[j] - 'a'));
              out[m] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string SmallestEquivalentString(string s1, string s2, string baseStr)
          {
              int[] root = new int[26];
              for (int i = 0; i < 26; i++) root[i] = i;
              for (int k = 0; k < s1.Length; k++)
              {
                  int r1 = LsFind(root, s1[k] - 'a'), r2 = LsFind(root, s2[k] - 'a');
                  if (r1 < r2) root[r2] = r1;
                  else if (r2 < r1) root[r1] = r2;
              }
              var sb = new System.Text.StringBuilder();
              foreach (char c in baseStr) sb.Append((char)('a' + LsFind(root, c - 'a')));
              return sb.ToString();
          }

          static int LsFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        go: code`
          func lsFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func smallestEquivalentString(s1 string, s2 string, baseStr string) string {
          	root := make([]int, 26)
          	for i := range root {
          		root[i] = i
          	}
          	for k := 0; k < len(s1); k++ {
          		r1, r2 := lsFind(root, int(s1[k]-'a')), lsFind(root, int(s2[k]-'a'))
          		if r1 < r2 {
          			root[r2] = r1
          		} else if r2 < r1 {
          			root[r1] = r2
          		}
          	}
          	out := make([]byte, len(baseStr))
          	for j := 0; j < len(baseStr); j++ {
          		out[j] = byte('a' + lsFind(root, int(baseStr[j]-'a')))
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun lsFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun smallestEquivalentString(s1: String, s2: String, baseStr: String): String {
              val root = IntArray(26) { it }
              for (k in s1.indices) {
                  val r1 = lsFind(root, s1[k] - 'a')
                  val r2 = lsFind(root, s2[k] - 'a')
                  if (r1 < r2) root[r2] = r1
                  else if (r2 < r1) root[r1] = r2
              }
              val sb = StringBuilder()
              for (c in baseStr) sb.append('a' + lsFind(root, c - 'a'))
              return sb.toString()
          }
        `,
        swift: code`
          func lsFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func smallestEquivalentString(_ s1: String, _ s2: String, _ baseStr: String) -> String {
              var root = Array(0..<26)
              let a = Array(s1.utf8), b = Array(s2.utf8)
              for k in 0..<a.count {
                  let r1 = lsFind(&root, Int(a[k]) - 97)
                  let r2 = lsFind(&root, Int(b[k]) - 97)
                  if r1 < r2 { root[r2] = r1 } else if r2 < r1 { root[r1] = r2 }
              }
              var out = [Character]()
              for c in baseStr.utf8 {
                  out.append(Character(UnicodeScalar(UInt8(97 + lsFind(&root, Int(c) - 97)))))
              }
              return String(out)
          }
        `,
        rust: code`
          fn ls_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn smallestEquivalentString(s1: String, s2: String, baseStr: String) -> String {
              let mut root: Vec<usize> = (0..26).collect();
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              for k in 0..a.len() {
                  let r1 = ls_find(&mut root, (a[k] - b'a') as usize);
                  let r2 = ls_find(&mut root, (b[k] - b'a') as usize);
                  if r1 < r2 {
                      root[r2] = r1;
                  } else if r2 < r1 {
                      root[r1] = r2;
                  }
              }
              let mut out = String::new();
              for &c in baseStr.as_bytes().iter() {
                  out.push((b'a' + ls_find(&mut root, (c - b'a') as usize) as u8) as char);
              }
              out
          }
        `,
        php: code`
          function smallestEquivalentString($s1, $s2, $baseStr) {
              $root = range(0, 25);
              $len = strlen($s1);
              for ($k = 0; $k < $len; $k++) {
                  $r1 = lsFind($root, ord($s1[$k]) - 97);
                  $r2 = lsFind($root, ord($s2[$k]) - 97);
                  if ($r1 < $r2) $root[$r2] = $r1;
                  elseif ($r2 < $r1) $root[$r1] = $r2;
              }
              $out = "";
              $m = strlen($baseStr);
              for ($j = 0; $j < $m; $j++) $out .= chr(97 + lsFind($root, ord($baseStr[$j]) - 97));
              return $out;
          }

          function lsFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def smallestEquivalentString(s1, s2, baseStr)
            root = (0...26).to_a
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            s1.length.times do |k|
              r1 = find.call(s1.getbyte(k) - 97)
              r2 = find.call(s2.getbyte(k) - 97)
              if r1 < r2
                root[r2] = r1
              elsif r2 < r1
                root[r1] = r2
              end
            end
            baseStr.bytes.map { |c| (97 + find.call(c - 97)).chr }.join
          end
        `,
      },
    };
  })(),

  // ── Similar String Groups (LC 839) ──────────────────────────────
  (() => {
    const swapsInto = (a: string, b: string) => {
      if (a === b) return true;
      const s = a.split("");
      for (let i = 0; i < s.length; i++) {
        for (let j = i + 1; j < s.length; j++) {
          [s[i], s[j]] = [s[j], s[i]];
          if (s.join("") === b) return true;
          [s[i], s[j]] = [s[j], s[i]];
        }
      }
      return false;
    };
    const ref = (strs: string[]) => {
      const n = strs.length;
      const seen = new Array(n).fill(false);
      let groups = 0;
      for (let s = 0; s < n; s++) {
        if (seen[s]) continue;
        groups++;
        seen[s] = true;
        const q = [s];
        for (let h = 0; h < q.length; h++) {
          for (let v = 0; v < n; v++) if (!seen[v] && swapsInto(strs[q[h]], strs[v])) { seen[v] = true; q.push(v); }
        }
      }
      return groups;
    };
    return {
      slug: "similar-string-groups",
      title: "Similar String Groups",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "String", "Union Find", "Google", "Amazon"],
      signature: { funcName: "numSimilarGroups", params: [{ name: "strs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Two strings `X` and `Y` are **similar** if they are equal, or if swapping the letters at two positions of `X` turns it into `Y`. For example, `\"kairo\"` and `\"akiro\"` are similar (swap positions 0 and 1), while `\"kairo\"` and `\"rokai\"` are not.\n\nSimilarity links strings into **groups**: a string belongs to a group if it is similar to at least one other string in that group, so two strings can share a group without being similar to each other directly.\n\nYou are given `strs`, where every string is an **anagram** of every other. Return the number of groups.",
        [
          { in: "strs = [\"kairo\",\"akiro\",\"akior\",\"rokai\"]", out: "2", note: "`kairo`–`akiro`–`akior` chain together; `rokai` is similar to none of them." },
          { in: "strs = [\"abc\",\"abc\"]", out: "1", note: "Equal strings are similar." },
          { in: "strs = [\"abcd\",\"badc\",\"dcba\"]", out: "3" },
        ],
        ["1 <= strs.length <= 300", "1 <= strs[i].length <= 300", "strs[i] consists of lowercase letters only", "all words in strs have the same length and are anagrams of each other"]),
      hints: [
        "Treat each string as a node and connect similar pairs; the answer is the number of connected components.",
        "Because all strings are anagrams of each other, two of them are similar exactly when they differ in 0 or 2 positions — no need to try the swap.",
        "Compare every pair once (stopping a comparison as soon as a third difference appears) and merge similar pairs with union-find.",
      ],
      editorial: explain({
        idea: "Groups are connected components of the similarity graph. For anagrams, similarity is just 'differ in zero or exactly two positions', so a pairwise scan with union-find counts the components.",
        steps: [
          "Start with `n` singleton sets and a group count of `n`.",
          "For every pair `(i, j)` in different sets, count mismatched positions, bailing out after the third.",
          "If the count is 0 or 2, union the pair and decrease the group count.",
          "Return the group count.",
        ],
        why: "If two anagrams differ in exactly two positions `p` and `q`, the multisets force `X[p] = Y[q]` and `X[q] = Y[p]`, so swapping `p` and `q` in `X` gives `Y`; one mismatch is impossible for anagrams, and three or more cannot be fixed by one swap. Union-find then merges exactly the similar pairs, and connected components are the groups by definition.",
        time: "O(n² · L)",
        space: "O(n)",
        pitfalls: [
          "Groups are transitive closures — two strings in one group need not be similar to each other.",
          "Identical strings count as similar.",
          "Skip pairs already in the same set to save the comparison.",
        ],
      }),
      examples: [
        { input: "[\"kairo\",\"akiro\",\"akior\",\"rokai\"]", expectedOutput: "2" },
        { input: "[\"abc\",\"abc\"]", expectedOutput: "1" },
        { input: "[\"abcd\",\"badc\",\"dcba\"]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const L = pick(rng, [1, 2, 4, 5, 6, 7, 8, 8, 10, 12]);
        const base = rng() < 0.6
          ? shuffle(rng, "abcdefghijklmnopqrstuvwxyz".split("")).slice(0, L)
          : randLower(rng, L, L, pick(rng, ["ab", "abc", "kairo"])).split("");
        const n = pick(rng, [1, 2, 4, 6, 8, 12, 12]);
        const strs: string[] = [];
        const scramble = pick(rng, [1, 3, 6, 10]);
        for (let k = 0; k < n; k++) {
          // Either one swap away from an earlier word (chains groups together) or a fresh scramble of the base.
          const chain = k > 0 && rng() < 0.2;
          const s = chain ? strs[ri(rng, 0, k - 1)].split("") : base.slice();
          for (let t = chain ? 1 : ri(rng, rng() < 0.1 ? 0 : 1, scramble); t > 0 && L > 1; t--) {
            const i = ri(rng, 0, L - 2);
            const j = ri(rng, i + 1, L - 1);
            [s[i], s[j]] = [s[j], s[i]];
          }
          strs.push(s.join(""));
        }
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numSimilarGroups(strs: List[str]) -> int:
              n = len(strs)
              root = list(range(n))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              def similar(a, b):
                  diff = 0
                  for x, y in zip(a, b):
                      if x != y:
                          diff += 1
                          if diff > 2:
                              return False
                  return diff != 1

              groups = n
              for i in range(n):
                  for j in range(i + 1, n):
                      ra, rb = find(i), find(j)
                      if ra != rb and similar(strs[i], strs[j]):
                          root[ra] = rb
                          groups -= 1
              return groups
        `,
        javascript: code`
          var numSimilarGroups = function(strs) {
              var n = strs.length;
              var root = [];
              for (var i = 0; i < n; i++) root.push(i);
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              var similar = function(a, b) {
                  var diff = 0;
                  for (var k = 0; k < a.length; k++) {
                      if (a.charCodeAt(k) !== b.charCodeAt(k) && ++diff > 2) return false;
                  }
                  return diff !== 1;
              };
              var groups = n;
              for (var p = 0; p < n; p++) {
                  for (var q = p + 1; q < n; q++) {
                      var rp = find(p), rq = find(q);
                      if (rp !== rq && similar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              return groups;
          };
        `,
        typescript: code`
          function numSimilarGroups(strs: string[]): number {
              var n = strs.length;
              var root: number[] = [];
              for (var i = 0; i < n; i++) root.push(i);
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              function similar(a: string, b: string): boolean {
                  var diff = 0;
                  for (var k = 0; k < a.length; k++) {
                      if (a.charCodeAt(k) !== b.charCodeAt(k) && ++diff > 2) return false;
                  }
                  return diff !== 1;
              }
              var groups = n;
              for (var p = 0; p < n; p++) {
                  for (var q = p + 1; q < n; q++) {
                      var rp = find(p), rq = find(q);
                      if (rp !== rq && similar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              return groups;
          }
        `,
        java: code`
          public static int numSimilarGroups(String[] strs) {
              int n = strs.length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              int groups = n;
              for (int p = 0; p < n; p++) {
                  for (int q = p + 1; q < n; q++) {
                      int rp = sgFind(root, p), rq = sgFind(root, q);
                      if (rp != rq && sgSimilar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              return groups;
          }

          static int sgFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static boolean sgSimilar(String a, String b) {
              int diff = 0;
              for (int k = 0; k < a.length(); k++) {
                  if (a.charAt(k) != b.charAt(k) && ++diff > 2) return false;
              }
              return diff != 1;
          }
        `,
        cpp: code`
          static int sgFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static bool sgSimilar(const string& a, const string& b) {
              int diff = 0;
              for (size_t k = 0; k < a.size(); k++) {
                  if (a[k] != b[k] && ++diff > 2) return false;
              }
              return diff != 1;
          }

          int numSimilarGroups(vector<string>& strs) {
              int n = strs.size();
              vector<int> root(n);
              for (int i = 0; i < n; i++) root[i] = i;
              int groups = n;
              for (int p = 0; p < n; p++) {
                  for (int q = p + 1; q < n; q++) {
                      int rp = sgFind(root, p), rq = sgFind(root, q);
                      if (rp != rq && sgSimilar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              return groups;
          }
        `,
        c: code`
          static int sgFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int sgSimilar(const char* a, const char* b) {
              int diff = 0;
              for (int k = 0; a[k] != '\0'; k++) {
                  if (a[k] != b[k] && ++diff > 2) return 0;
              }
              return diff != 1;
          }

          int numSimilarGroups(char** strs, int strsSize) {
              int n = strsSize;
              int* root = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) root[i] = i;
              int groups = n;
              for (int p = 0; p < n; p++) {
                  for (int q = p + 1; q < n; q++) {
                      int rp = sgFind(root, p), rq = sgFind(root, q);
                      if (rp != rq && sgSimilar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              free(root);
              return groups;
          }
        `,
        csharp: code`
          public static int NumSimilarGroups(string[] strs)
          {
              int n = strs.Length;
              int[] root = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              int groups = n;
              for (int p = 0; p < n; p++)
              {
                  for (int q = p + 1; q < n; q++)
                  {
                      int rp = SgFind(root, p), rq = SgFind(root, q);
                      if (rp != rq && SgSimilar(strs[p], strs[q])) { root[rp] = rq; groups--; }
                  }
              }
              return groups;
          }

          static int SgFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static bool SgSimilar(string a, string b)
          {
              int diff = 0;
              for (int k = 0; k < a.Length; k++)
              {
                  if (a[k] != b[k] && ++diff > 2) return false;
              }
              return diff != 1;
          }
        `,
        go: code`
          func sgFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func sgSimilar(a string, b string) bool {
          	diff := 0
          	for k := 0; k < len(a); k++ {
          		if a[k] != b[k] {
          			diff++
          			if diff > 2 {
          				return false
          			}
          		}
          	}
          	return diff != 1
          }

          func numSimilarGroups(strs []string) int {
          	n := len(strs)
          	root := make([]int, n)
          	for i := range root {
          		root[i] = i
          	}
          	groups := n
          	for p := 0; p < n; p++ {
          		for q := p + 1; q < n; q++ {
          			rp, rq := sgFind(root, p), sgFind(root, q)
          			if rp != rq && sgSimilar(strs[p], strs[q]) {
          				root[rp] = rq
          				groups--
          			}
          		}
          	}
          	return groups
          }
        `,
        kotlin: code`
          fun sgFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun sgSimilar(a: String, b: String): Boolean {
              var diff = 0
              for (k in a.indices) {
                  if (a[k] != b[k]) {
                      diff++
                      if (diff > 2) return false
                  }
              }
              return diff != 1
          }

          fun numSimilarGroups(strs: Array<String>): Int {
              val n = strs.size
              val root = IntArray(n) { it }
              var groups = n
              for (p in 0 until n) {
                  for (q in p + 1 until n) {
                      val rp = sgFind(root, p)
                      val rq = sgFind(root, q)
                      if (rp != rq && sgSimilar(strs[p], strs[q])) { root[rp] = rq; groups-- }
                  }
              }
              return groups
          }
        `,
        swift: code`
          func sgFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func numSimilarGroups(_ strs: [String]) -> Int {
              let words = strs.map { Array($0.utf8) }
              let n = words.count
              var root = Array(0..<n)
              var groups = n
              for p in 0..<n {
                  for q in (p + 1)..<n {
                      let rp = sgFind(&root, p), rq = sgFind(&root, q)
                      if rp == rq { continue }
                      var diff = 0
                      for k in 0..<words[p].count where words[p][k] != words[q][k] {
                          diff += 1
                          if diff > 2 { break }
                      }
                      if diff == 0 || diff == 2 { root[rp] = rq; groups -= 1 }
                  }
              }
              return groups
          }
        `,
        rust: code`
          fn sg_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn sg_similar(a: &[u8], b: &[u8]) -> bool {
              let mut diff = 0;
              for k in 0..a.len() {
                  if a[k] != b[k] {
                      diff += 1;
                      if diff > 2 {
                          return false;
                      }
                  }
              }
              diff != 1
          }

          fn numSimilarGroups(strs: Vec<String>) -> i32 {
              let n = strs.len();
              let mut root: Vec<usize> = (0..n).collect();
              let mut groups = n as i32;
              for p in 0..n {
                  for q in (p + 1)..n {
                      let rp = sg_find(&mut root, p);
                      let rq = sg_find(&mut root, q);
                      if rp != rq && sg_similar(strs[p].as_bytes(), strs[q].as_bytes()) {
                          root[rp] = rq;
                          groups -= 1;
                      }
                  }
              }
              groups
          }
        `,
        php: code`
          function numSimilarGroups($strs) {
              $n = count($strs);
              $root = range(0, $n - 1);
              $groups = $n;
              for ($p = 0; $p < $n; $p++) {
                  for ($q = $p + 1; $q < $n; $q++) {
                      $rp = sgFind($root, $p);
                      $rq = sgFind($root, $q);
                      if ($rp != $rq && sgSimilar($strs[$p], $strs[$q])) { $root[$rp] = $rq; $groups--; }
                  }
              }
              return $groups;
          }

          function sgFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }

          function sgSimilar($a, $b) {
              $diff = 0;
              $len = strlen($a);
              for ($k = 0; $k < $len; $k++) {
                  if ($a[$k] !== $b[$k] && ++$diff > 2) return false;
              }
              return $diff != 1;
          }
        `,
        ruby: code`
          def numSimilarGroups(strs)
            n = strs.length
            root = (0...n).to_a
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            similar = lambda do |a, b|
              diff = 0
              a.length.times do |k|
                next if a.getbyte(k) == b.getbyte(k)
                diff += 1
                return false if diff > 2
              end
              diff != 1
            end
            groups = n
            (0...n).each do |p|
              ((p + 1)...n).each do |q|
                rp = find.call(p)
                rq = find.call(q)
                if rp != rq && similar.call(strs[p], strs[q])
                  root[rp] = rq
                  groups -= 1
                end
              end
            end
            groups
          end
        `,
      },
    };
  })(),

  // ── Minimize Malware Spread (LC 924) ────────────────────────────
  (() => {
    const ref = (graph: number[][], initial: number[]) => {
      const n = graph.length;
      const spread = (sources: number[]) => {
        const hit = new Array(n).fill(false);
        const q: number[] = [];
        for (const s of sources) if (!hit[s]) { hit[s] = true; q.push(s); }
        for (let h = 0; h < q.length; h++) for (let v = 0; v < n; v++) if (graph[q[h]][v] === 1 && !hit[v]) { hit[v] = true; q.push(v); }
        return q.length;
      };
      let best = -1, bestCount = Infinity;
      for (const cand of initial) {
        const cnt = spread(initial.filter((x) => x !== cand));
        if (cnt < bestCount || (cnt === bestCount && cand < best)) { bestCount = cnt; best = cand; }
      }
      return best;
    };
    return {
      slug: "minimize-malware-spread",
      title: "Minimize Malware Spread",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Graph", "Union Find", "Depth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "minMalwareSpread",
        params: [{ name: "graph", type: "int[][]" as const }, { name: "initial", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A network of `n` machines is given as an `n x n` adjacency matrix `graph`, where `graph[i][j] == 1` means machines `i` and `j` are directly connected (the matrix is symmetric and `graph[i][i] == 1`).\n\nThe machines listed in `initial` start out infected by malware. Whenever two directly connected machines include an infected one, the other becomes infected too; this continues until no more machines can be infected. Let `M(initial)` be the final number of infected machines.\n\nYou may remove **exactly one** machine from the `initial` list (it starts clean, but it can still be infected later through its connections). Return the machine whose removal minimises `M(initial)`. If several machines tie, return the one with the **smallest** index.",
        [
          { in: "graph = [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]], initial = [3,0,2]", out: "0", note: "Removing 0 saves the whole component {0, 1}; machines 2 and 3 would still infect each other." },
          { in: "graph = [[1,0,0],[0,1,1],[0,1,1]], initial = [2,0]", out: "2", note: "Removing 2 saves two machines, removing 0 saves only one." },
          { in: "graph = [[1,1,1],[1,1,1],[1,1,1]], initial = [2,1]", out: "1", note: "Either removal leaves everything infected; the smaller index wins." },
        ],
        ["n == graph.length", "n == graph[i].length", "2 <= n <= 300", "graph[i][j] is 0 or 1", "graph[i][j] == graph[j][i]", "graph[i][i] == 1", "1 <= initial.length <= n", "0 <= initial[i] <= n - 1", "all the integers in initial are unique"]),
      hints: [
        "Malware fills a whole connected component as soon as one of its machines is infected.",
        "Removing a machine from `initial` helps only if it is the **only** initially infected machine in its component — then the entire component stays clean.",
        "Find components with union-find, count component sizes and initial machines per component, and pick the uniquely-infected component of largest size (ties: smallest index; no such component: smallest index in `initial`).",
      ],
      editorial: explain({
        idea: "Infection saturates connected components. Cleaning one initial machine saves its component only when no other initial machine shares it, and then it saves the whole component.",
        steps: [
          "Union every connected pair from the matrix and compute each component's size.",
          "Count how many initial machines fall in each component.",
          "For every initial machine, its saving is the component size if that component holds exactly one initial machine, else 0.",
          "Return the machine with the largest saving, breaking ties by smallest index (this also covers the case where every saving is 0).",
        ],
        why: "The final infected set is the union of the components containing initial machines. Removing machine `v` changes that set only if `v`'s component has no other initial machine, in which case exactly that component disappears from the union. So minimising `M` is maximising the saving, which these counts give directly.",
        time: "O(n² · α(n))",
        space: "O(n)",
        pitfalls: [
          "A removed machine is still in the network — if another initial machine shares its component, it gets reinfected and nothing is saved.",
          "When no removal saves anything, the answer is the smallest index in `initial`, which need not be its first element.",
          "Read connections from the matrix, not from `initial` alone.",
        ],
      }),
      examples: [
        { input: "[[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]]\n[3,0,2]", expectedOutput: "0" },
        { input: "[[1,0,0],[0,1,1],[0,1,1]]\n[2,0]", expectedOutput: "2" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]\n[2,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 7, 9, 12]);
        const graph = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
        const blocks = ri(rng, 1, n);
        const block = Array.from({ length: n }, () => ri(rng, 0, blocks - 1));
        const pIn = pick(rng, [0.3, 0.6, 1]), pOut = pick(rng, [0, 0, 0.05]);
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            if (rng() < (block[i] === block[j] ? pIn : pOut)) { graph[i][j] = 1; graph[j][i] = 1; }
          }
        }
        const k = ri(rng, 1, Math.min(n, pick(rng, [1, 2, 3, n])));
        const initial = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, k);
        return { input: `${fmtIntMat(graph)}\n${fmtIntArr(initial)}`, expectedOutput: String(ref(graph, initial)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minMalwareSpread(graph: List[List[int]], initial: List[int]) -> int:
              n = len(graph)
              root = list(range(n))

              def find(x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              for i in range(n):
                  for j in range(i + 1, n):
                      if graph[i][j] == 1:
                          a, b = find(i), find(j)
                          if a != b:
                              root[a] = b
              size = [0] * n
              for i in range(n):
                  size[find(i)] += 1
              infected = [0] * n
              for v in initial:
                  infected[find(v)] += 1
              best, best_save = -1, -1
              for v in sorted(initial):
                  r = find(v)
                  save = size[r] if infected[r] == 1 else 0
                  if save > best_save:
                      best, best_save = v, save
              return best
        `,
        javascript: code`
          var minMalwareSpread = function(graph, initial) {
              var n = graph.length;
              var root = [], size = [], infected = [];
              for (var i = 0; i < n; i++) { root.push(i); size.push(0); infected.push(0); }
              var find = function(x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              for (var a = 0; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      if (graph[a][b] === 1) {
                          var ra = find(a), rb = find(b);
                          if (ra !== rb) root[ra] = rb;
                      }
                  }
              }
              for (var v = 0; v < n; v++) size[find(v)]++;
              for (var t = 0; t < initial.length; t++) infected[find(initial[t])]++;
              var best = -1, bestSave = -1;
              for (var s = 0; s < initial.length; s++) {
                  var node = initial[s], r = find(node);
                  var save = infected[r] === 1 ? size[r] : 0;
                  if (save > bestSave || (save === bestSave && node < best)) { bestSave = save; best = node; }
              }
              return best;
          };
        `,
        typescript: code`
          function minMalwareSpread(graph: number[][], initial: number[]): number {
              var n = graph.length;
              var root: number[] = [], size: number[] = [], infected: number[] = [];
              for (var i = 0; i < n; i++) { root.push(i); size.push(0); infected.push(0); }
              function find(x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              for (var a = 0; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      if (graph[a][b] === 1) {
                          var ra = find(a), rb = find(b);
                          if (ra !== rb) root[ra] = rb;
                      }
                  }
              }
              for (var v = 0; v < n; v++) size[find(v)]++;
              for (var t = 0; t < initial.length; t++) infected[find(initial[t])]++;
              var best = -1, bestSave = -1;
              for (var s = 0; s < initial.length; s++) {
                  var node = initial[s], r = find(node);
                  var save = infected[r] === 1 ? size[r] : 0;
                  if (save > bestSave || (save === bestSave && node < best)) { bestSave = save; best = node; }
              }
              return best;
          }
        `,
        java: code`
          public static int minMalwareSpread(int[][] graph, int[] initial) {
              int n = graph.length;
              int[] root = new int[n], size = new int[n], infected = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              for (int a = 0; a < n; a++)
                  for (int b = a + 1; b < n; b++)
                      if (graph[a][b] == 1) {
                          int ra = mwFind(root, a), rb = mwFind(root, b);
                          if (ra != rb) root[ra] = rb;
                      }
              for (int v = 0; v < n; v++) size[mwFind(root, v)]++;
              for (int v : initial) infected[mwFind(root, v)]++;
              int best = -1, bestSave = -1;
              for (int node : initial) {
                  int r = mwFind(root, node);
                  int save = infected[r] == 1 ? size[r] : 0;
                  if (save > bestSave || (save == bestSave && node < best)) { bestSave = save; best = node; }
              }
              return best;
          }

          static int mwFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        cpp: code`
          static int mwFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int minMalwareSpread(vector<vector<int>>& graph, vector<int>& initial) {
              int n = graph.size();
              vector<int> root(n), size(n, 0), infected(n, 0);
              for (int i = 0; i < n; i++) root[i] = i;
              for (int a = 0; a < n; a++)
                  for (int b = a + 1; b < n; b++)
                      if (graph[a][b] == 1) {
                          int ra = mwFind(root, a), rb = mwFind(root, b);
                          if (ra != rb) root[ra] = rb;
                      }
              for (int v = 0; v < n; v++) size[mwFind(root, v)]++;
              for (int v : initial) infected[mwFind(root, v)]++;
              int best = -1, bestSave = -1;
              for (int node : initial) {
                  int r = mwFind(root, node);
                  int save = infected[r] == 1 ? size[r] : 0;
                  if (save > bestSave || (save == bestSave && node < best)) { bestSave = save; best = node; }
              }
              return best;
          }
        `,
        c: code`
          static int mwFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          int minMalwareSpread(int** graph, int graphSize, int* graphColSize, int* initial, int initialSize) {
              int n = graphSize;
              int* root = (int*)malloc((n + 1) * sizeof(int));
              int* size = (int*)calloc(n + 1, sizeof(int));
              int* infected = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < n; i++) root[i] = i;
              for (int a = 0; a < n; a++)
                  for (int b = a + 1; b < n; b++)
                      if (graph[a][b] == 1) {
                          int ra = mwFind(root, a), rb = mwFind(root, b);
                          if (ra != rb) root[ra] = rb;
                      }
              for (int v = 0; v < n; v++) size[mwFind(root, v)]++;
              for (int t = 0; t < initialSize; t++) infected[mwFind(root, initial[t])]++;
              int best = -1, bestSave = -1;
              for (int t = 0; t < initialSize; t++) {
                  int node = initial[t], r = mwFind(root, node);
                  int save = infected[r] == 1 ? size[r] : 0;
                  if (save > bestSave || (save == bestSave && node < best)) { bestSave = save; best = node; }
              }
              free(root);
              free(size);
              free(infected);
              return best;
          }
        `,
        csharp: code`
          public static int MinMalwareSpread(int[][] graph, int[] initial)
          {
              int n = graph.Length;
              int[] root = new int[n], size = new int[n], infected = new int[n];
              for (int i = 0; i < n; i++) root[i] = i;
              for (int a = 0; a < n; a++)
                  for (int b = a + 1; b < n; b++)
                      if (graph[a][b] == 1)
                      {
                          int ra = MwFind(root, a), rb = MwFind(root, b);
                          if (ra != rb) root[ra] = rb;
                      }
              for (int v = 0; v < n; v++) size[MwFind(root, v)]++;
              foreach (int v in initial) infected[MwFind(root, v)]++;
              int best = -1, bestSave = -1;
              foreach (int node in initial)
              {
                  int r = MwFind(root, node);
                  int save = infected[r] == 1 ? size[r] : 0;
                  if (save > bestSave || (save == bestSave && node < best)) { bestSave = save; best = node; }
              }
              return best;
          }

          static int MwFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }
        `,
        go: code`
          func mwFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func minMalwareSpread(graph [][]int, initial []int) int {
          	n := len(graph)
          	root := make([]int, n)
          	size := make([]int, n)
          	infected := make([]int, n)
          	for i := range root {
          		root[i] = i
          	}
          	for a := 0; a < n; a++ {
          		for b := a + 1; b < n; b++ {
          			if graph[a][b] == 1 {
          				ra, rb := mwFind(root, a), mwFind(root, b)
          				if ra != rb {
          					root[ra] = rb
          				}
          			}
          		}
          	}
          	for v := 0; v < n; v++ {
          		size[mwFind(root, v)]++
          	}
          	for _, v := range initial {
          		infected[mwFind(root, v)]++
          	}
          	best, bestSave := -1, -1
          	for _, node := range initial {
          		r := mwFind(root, node)
          		save := 0
          		if infected[r] == 1 {
          			save = size[r]
          		}
          		if save > bestSave || (save == bestSave && node < best) {
          			bestSave = save
          			best = node
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun mwFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun minMalwareSpread(graph: Array<IntArray>, initial: IntArray): Int {
              val n = graph.size
              val root = IntArray(n) { it }
              val size = IntArray(n)
              val infected = IntArray(n)
              for (a in 0 until n)
                  for (b in a + 1 until n)
                      if (graph[a][b] == 1) {
                          val ra = mwFind(root, a)
                          val rb = mwFind(root, b)
                          if (ra != rb) root[ra] = rb
                      }
              for (v in 0 until n) size[mwFind(root, v)]++
              for (v in initial) infected[mwFind(root, v)]++
              var best = -1
              var bestSave = -1
              for (node in initial) {
                  val r = mwFind(root, node)
                  val save = if (infected[r] == 1) size[r] else 0
                  if (save > bestSave || (save == bestSave && node < best)) { bestSave = save; best = node }
              }
              return best
          }
        `,
        swift: code`
          func mwFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func minMalwareSpread(_ graph: [[Int]], _ initial: [Int]) -> Int {
              let n = graph.count
              var root = Array(0..<n)
              var size = [Int](repeating: 0, count: n)
              var infected = [Int](repeating: 0, count: n)
              for a in 0..<n {
                  for b in (a + 1)..<n where graph[a][b] == 1 {
                      let ra = mwFind(&root, a), rb = mwFind(&root, b)
                      if ra != rb { root[ra] = rb }
                  }
              }
              for v in 0..<n { size[mwFind(&root, v)] += 1 }
              for v in initial { infected[mwFind(&root, v)] += 1 }
              var best = -1, bestSave = -1
              for node in initial {
                  let r = mwFind(&root, node)
                  let save = infected[r] == 1 ? size[r] : 0
                  if save > bestSave || (save == bestSave && node < best) { bestSave = save; best = node }
              }
              return best
          }
        `,
        rust: code`
          fn mw_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn minMalwareSpread(graph: Vec<Vec<i32>>, initial: Vec<i32>) -> i32 {
              let n = graph.len();
              let mut root: Vec<usize> = (0..n).collect();
              let mut size = vec![0i32; n];
              let mut infected = vec![0i32; n];
              for a in 0..n {
                  for b in (a + 1)..n {
                      if graph[a][b] == 1 {
                          let ra = mw_find(&mut root, a);
                          let rb = mw_find(&mut root, b);
                          if ra != rb {
                              root[ra] = rb;
                          }
                      }
                  }
              }
              for v in 0..n {
                  let r = mw_find(&mut root, v);
                  size[r] += 1;
              }
              for &v in initial.iter() {
                  let r = mw_find(&mut root, v as usize);
                  infected[r] += 1;
              }
              let mut best = -1i32;
              let mut best_save = -1i32;
              for &node in initial.iter() {
                  let r = mw_find(&mut root, node as usize);
                  let save = if infected[r] == 1 { size[r] } else { 0 };
                  if save > best_save || (save == best_save && node < best) {
                      best_save = save;
                      best = node;
                  }
              }
              best
          }
        `,
        php: code`
          function minMalwareSpread($graph, $initial) {
              $n = count($graph);
              $root = range(0, $n - 1);
              $size = array_fill(0, $n, 0);
              $infected = array_fill(0, $n, 0);
              for ($a = 0; $a < $n; $a++)
                  for ($b = $a + 1; $b < $n; $b++)
                      if ($graph[$a][$b] == 1) {
                          $ra = mwFind($root, $a);
                          $rb = mwFind($root, $b);
                          if ($ra != $rb) $root[$ra] = $rb;
                      }
              for ($v = 0; $v < $n; $v++) $size[mwFind($root, $v)]++;
              foreach ($initial as $v) $infected[mwFind($root, $v)]++;
              $best = -1;
              $bestSave = -1;
              foreach ($initial as $node) {
                  $r = mwFind($root, $node);
                  $save = $infected[$r] == 1 ? $size[$r] : 0;
                  if ($save > $bestSave || ($save == $bestSave && $node < $best)) { $bestSave = $save; $best = $node; }
              }
              return $best;
          }

          function mwFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }
        `,
        ruby: code`
          def minMalwareSpread(graph, initial)
            n = graph.length
            root = (0...n).to_a
            find = lambda do |x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            (0...n).each do |a|
              ((a + 1)...n).each do |b|
                next unless graph[a][b] == 1
                ra = find.call(a)
                rb = find.call(b)
                root[ra] = rb if ra != rb
              end
            end
            size = Array.new(n, 0)
            n.times { |v| size[find.call(v)] += 1 }
            infected = Array.new(n, 0)
            initial.each { |v| infected[find.call(v)] += 1 }
            best = -1
            best_save = -1
            initial.each do |node|
              r = find.call(node)
              save = infected[r] == 1 ? size[r] : 0
              if save > best_save || (save == best_save && node < best)
                best_save = save
                best = node
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Shortest Path to Get All Keys (LC 864) ──────────────────────
  (() => {
    const ref = (grid: string[]) => {
      // BFS over (cell, keys held) with string-keyed visited set.
      const m = grid.length, n = grid[0].length;
      let sr = 0, sc = 0, total = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (grid[r][c] === "@") { sr = r; sc = c; }
        if (/[a-f]/.test(grid[r][c])) total++;
      }
      const full = (1 << total) - 1;
      const seen = new Set<string>([sr + "," + sc + ",0"]);
      let layer = [[sr, sc, 0]];
      for (let d = 0; layer.length; d++) {
        const next: number[][] = [];
        for (const [r, c, mk] of layer) {
          if (mk === full) return d;
          for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
            const ch = grid[nr][nc];
            if (ch === "#") continue;
            if (/[A-F]/.test(ch) && !(mk & (1 << (ch.charCodeAt(0) - 65)))) continue;
            const nm = /[a-f]/.test(ch) ? mk | (1 << (ch.charCodeAt(0) - 97)) : mk;
            const key = nr + "," + nc + "," + nm;
            if (seen.has(key)) continue;
            seen.add(key);
            next.push([nr, nc, nm]);
          }
        }
        layer = next;
      }
      return -1;
    };
    return {
      slug: "shortest-path-to-get-all-keys",
      title: "Shortest Path to Get All Keys",
      difficulty: "HARD" as const,
      tags: ["Array", "Bit Manipulation", "Breadth-First Search", "Matrix", "Google", "Amazon"],
      signature: { funcName: "shortestPathAllKeys", params: [{ name: "grid", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` grid as a list of strings, one per row:\n\n- `'.'` is an empty cell and `'#'` is a wall,\n- `'@'` is the starting point (there is exactly one),\n- lowercase letters `'a'`–`'f'` are keys and uppercase letters `'A'`–`'F'` are locks.\n\nEach move goes one cell up, down, left or right. You cannot leave the grid or enter a wall. Walking onto a key picks it up; you may enter a lock only if you already hold its matching key.\n\nThe grid holds `k` keys (`1 <= k <= 6`), and they are exactly the first `k` letters of the alphabet, each with exactly one matching lock. Return the fewest moves needed to collect **all** keys, or `-1` if that is impossible.",
        [
          { in: "grid = [\"@.#b\",\"a.A.\",\"#..B\"]", out: "5", note: "Take `a` (1 move), then go (1,1) → (1,2) through lock `A` → (1,3) → (0,3) for `b`." },
          { in: "grid = [\"@#a\"]", out: "-1", note: "The wall cuts the start off from the only key." },
          { in: "grid = [\"Aa@bB\"]", out: "3" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 30", "grid[i][j] is an English letter, '.', '#' or '@'", "there is exactly one '@' in the grid", "the number of keys is in the range [1, 6]", "each key is unique and has a matching lock", "the keys and locks are the first k letters of the alphabet"]),
      hints: [
        "Where you can go depends on which keys you hold, so the position alone is not a full state.",
        "Make the state (row, column, set of keys held). With at most six keys, the set fits in a 6-bit mask.",
        "Run a BFS over these states: a lock cell is passable only if its bit is set, a key cell sets its bit, and the first state holding every key gives the answer.",
      ],
      editorial: explain({
        idea: "Breadth-first search over the augmented state `(cell, key mask)`; every move costs 1, so the first time the mask is full is the shortest route.",
        steps: [
          "Find the start and the number of keys `k`; the goal mask is `2^k − 1`.",
          "BFS from `(start, 0)`, marking states visited in an `m × n × 2^k` table.",
          "From a state, try the four neighbours: skip walls, skip a lock whose key bit is clear, and OR in the bit of a key.",
          "Return `distance + 1` as soon as a new state has the full mask; return -1 if the BFS ends.",
        ],
        why: "Carrying the key set in the state makes the move rules depend only on the state, so the problem is an unweighted shortest path in a finite graph of at most `m · n · 64` states, which BFS solves exactly. Revisiting a cell with a different key set is allowed and necessary — that is how routes that fetch a key and come back are found.",
        time: "O(m · n · 2^k)",
        space: "O(m · n · 2^k)",
        pitfalls: [
          "Marking a cell visited regardless of the key mask blocks the back-tracking routes the puzzle needs.",
          "A lock without its key is a wall for now, not forever.",
          "The goal is all keys, not any particular cell — check the mask, not the position.",
        ],
      }),
      examples: [
        { input: "[\"@.#b\",\"a.A.\",\"#..B\"]", expectedOutput: "5" },
        { input: "[\"@#a\"]", expectedOutput: "-1" },
        { input: "[\"Aa@bB\"]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const m = ri(rng, 1, pick(rng, [3, 5, 6])), n = ri(rng, 1, pick(rng, [3, 5, 6]));
          const k = ri(rng, 1, pick(rng, [2, 3, 4, 6]));
          if (m * n < 1 + 2 * k) continue;
          const wall = pick(rng, [0, 0.15, 0.3]);
          const cells: string[][] = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < wall ? "#" : ".")));
          const spots = shuffle(rng, Array.from({ length: m * n }, (_, i) => i));
          const place = (idx: number, ch: string) => { cells[Math.floor(spots[idx] / n)][spots[idx] % n] = ch; };
          place(0, "@");
          for (let i = 0; i < k; i++) {
            place(1 + 2 * i, String.fromCharCode(97 + i));
            place(2 + 2 * i, String.fromCharCode(65 + i));
          }
          const grid = cells.map((row) => row.join(""));
          return { input: fmtStrArr(grid), expectedOutput: String(ref(grid)) };
        }
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def shortestPathAllKeys(grid: List[str]) -> int:
              m, n = len(grid), len(grid[0])
              keys = 0
              sr = sc = 0
              for r in range(m):
                  for c in range(n):
                      ch = grid[r][c]
                      if ch == '@':
                          sr, sc = r, c
                      elif 'a' <= ch <= 'f':
                          keys = max(keys, ord(ch) - 96)
              full = (1 << keys) - 1
              seen = [[[False] * (1 << keys) for _ in range(n)] for _ in range(m)]
              seen[sr][sc][0] = True
              q = deque([(sr, sc, 0, 0)])
              while q:
                  r, c, mask, d = q.popleft()
                  for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                      nr, nc = r + dr, c + dc
                      if nr < 0 or nr >= m or nc < 0 or nc >= n:
                          continue
                      ch = grid[nr][nc]
                      if ch == '#':
                          continue
                      if 'A' <= ch <= 'F' and not (mask >> (ord(ch) - 65)) & 1:
                          continue
                      nm = mask
                      if 'a' <= ch <= 'f':
                          nm |= 1 << (ord(ch) - 97)
                      if seen[nr][nc][nm]:
                          continue
                      if nm == full:
                          return d + 1
                      seen[nr][nc][nm] = True
                      q.append((nr, nc, nm, d + 1))
              return -1
        `,
        javascript: code`
          var shortestPathAllKeys = function(grid) {
              var m = grid.length, n = grid[0].length, keys = 0, start = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      var ch = grid[r].charCodeAt(c);
                      if (ch === 64) start = r * n + c;
                      else if (ch >= 97 && ch <= 102 && ch - 96 > keys) keys = ch - 96;
                  }
              }
              var full = (1 << keys) - 1;
              var seen = [];
              for (var i = 0; i < m * n * 64; i++) seen.push(false);
              var qc = [start], qm = [0], qd = [0];
              seen[start * 64] = true;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              for (var h = 0; h < qc.length; h++) {
                  var cr = Math.floor(qc[h] / n), cc = qc[h] % n, mask = qm[h], d = qd[h];
                  for (var k = 0; k < 4; k++) {
                      var nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      var x = grid[nr].charCodeAt(nc);
                      if (x === 35) continue;
                      if (x >= 65 && x <= 70 && ((mask >> (x - 65)) & 1) === 0) continue;
                      var nm = mask;
                      if (x >= 97 && x <= 102) nm |= 1 << (x - 97);
                      var id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm === full) return d + 1;
                      seen[id] = true;
                      qc.push(nr * n + nc); qm.push(nm); qd.push(d + 1);
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function shortestPathAllKeys(grid: string[]): number {
              var m = grid.length, n = grid[0].length, keys = 0, start = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      var ch = grid[r].charCodeAt(c);
                      if (ch === 64) start = r * n + c;
                      else if (ch >= 97 && ch <= 102 && ch - 96 > keys) keys = ch - 96;
                  }
              }
              var full = (1 << keys) - 1;
              var seen: boolean[] = [];
              for (var i = 0; i < m * n * 64; i++) seen.push(false);
              var qc: number[] = [start], qm: number[] = [0], qd: number[] = [0];
              seen[start * 64] = true;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              for (var h = 0; h < qc.length; h++) {
                  var cr = Math.floor(qc[h] / n), cc = qc[h] % n, mask = qm[h], d = qd[h];
                  for (var k = 0; k < 4; k++) {
                      var nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      var x = grid[nr].charCodeAt(nc);
                      if (x === 35) continue;
                      if (x >= 65 && x <= 70 && ((mask >> (x - 65)) & 1) === 0) continue;
                      var nm = mask;
                      if (x >= 97 && x <= 102) nm |= 1 << (x - 97);
                      var id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm === full) return d + 1;
                      seen[id] = true;
                      qc.push(nr * n + nc); qm.push(nm); qd.push(d + 1);
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int shortestPathAllKeys(String[] grid) {
              int m = grid.length, n = grid[0].length(), keys = 0, start = 0;
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) {
                      char ch = grid[r].charAt(c);
                      if (ch == '@') start = r * n + c;
                      else if (ch >= 'a' && ch <= 'f') keys = Math.max(keys, ch - 'a' + 1);
                  }
              int full = (1 << keys) - 1;
              boolean[] seen = new boolean[m * n * 64];
              int cap = m * n * 64 + 1;
              int[] qc = new int[cap], qm = new int[cap], qd = new int[cap];
              int head = 0, tail = 0;
              qc[tail] = start; qm[tail] = 0; qd[tail++] = 0;
              seen[start * 64] = true;
              int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
              while (head < tail) {
                  int cell = qc[head], mask = qm[head], d = qd[head];
                  head++;
                  int cr = cell / n, cc = cell % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      char x = grid[nr].charAt(nc);
                      if (x == '#') continue;
                      if (x >= 'A' && x <= 'F' && ((mask >> (x - 'A')) & 1) == 0) continue;
                      int nm = mask;
                      if (x >= 'a' && x <= 'f') nm |= 1 << (x - 'a');
                      int id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm == full) return d + 1;
                      seen[id] = true;
                      qc[tail] = nr * n + nc; qm[tail] = nm; qd[tail++] = d + 1;
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int shortestPathAllKeys(vector<string>& grid) {
              int m = grid.size(), n = grid[0].size(), keys = 0, start = 0;
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) {
                      char ch = grid[r][c];
                      if (ch == '@') start = r * n + c;
                      else if (ch >= 'a' && ch <= 'f') keys = max(keys, ch - 'a' + 1);
                  }
              int full = (1 << keys) - 1;
              vector<char> seen(m * n * 64, 0);
              vector<int> qc, qm, qd;
              qc.push_back(start); qm.push_back(0); qd.push_back(0);
              seen[start * 64] = 1;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              for (size_t h = 0; h < qc.size(); h++) {
                  int cr = qc[h] / n, cc = qc[h] % n, mask = qm[h], d = qd[h];
                  for (int k = 0; k < 4; k++) {
                      int nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      char x = grid[nr][nc];
                      if (x == '#') continue;
                      if (x >= 'A' && x <= 'F' && ((mask >> (x - 'A')) & 1) == 0) continue;
                      int nm = mask;
                      if (x >= 'a' && x <= 'f') nm |= 1 << (x - 'a');
                      int id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm == full) return d + 1;
                      seen[id] = 1;
                      qc.push_back(nr * n + nc); qm.push_back(nm); qd.push_back(d + 1);
                  }
              }
              return -1;
          }
        `,
        c: code`
          int shortestPathAllKeys(char** grid, int gridSize) {
              int m = gridSize, n = (int)strlen(grid[0]), keys = 0, start = 0;
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) {
                      char ch = grid[r][c];
                      if (ch == '@') start = r * n + c;
                      else if (ch >= 'a' && ch <= 'f' && ch - 'a' + 1 > keys) keys = ch - 'a' + 1;
                  }
              int full = (1 << keys) - 1;
              int cap = m * n * 64 + 1;
              char* seen = (char*)calloc(cap, 1);
              int* qc = (int*)malloc(cap * sizeof(int));
              int* qm = (int*)malloc(cap * sizeof(int));
              int* qd = (int*)malloc(cap * sizeof(int));
              int head = 0, tail = 0, ans = -1;
              qc[tail] = start; qm[tail] = 0; qd[tail++] = 0;
              seen[start * 64] = 1;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              while (head < tail && ans == -1) {
                  int cell = qc[head], mask = qm[head], d = qd[head];
                  head++;
                  int cr = cell / n, cc = cell % n;
                  for (int k = 0; k < 4; k++) {
                      int nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      char x = grid[nr][nc];
                      if (x == '#') continue;
                      if (x >= 'A' && x <= 'F' && ((mask >> (x - 'A')) & 1) == 0) continue;
                      int nm = mask;
                      if (x >= 'a' && x <= 'f') nm |= 1 << (x - 'a');
                      int id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm == full) { ans = d + 1; break; }
                      seen[id] = 1;
                      qc[tail] = nr * n + nc; qm[tail] = nm; qd[tail++] = d + 1;
                  }
              }
              free(seen);
              free(qc);
              free(qm);
              free(qd);
              return ans;
          }
        `,
        csharp: code`
          public static int ShortestPathAllKeys(string[] grid)
          {
              int m = grid.Length, n = grid[0].Length, keys = 0, start = 0;
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                  {
                      char ch = grid[r][c];
                      if (ch == '@') start = r * n + c;
                      else if (ch >= 'a' && ch <= 'f') keys = Math.Max(keys, ch - 'a' + 1);
                  }
              int full = (1 << keys) - 1;
              bool[] seen = new bool[m * n * 64];
              int cap = m * n * 64 + 1;
              int[] qc = new int[cap], qm = new int[cap], qd = new int[cap];
              int head = 0, tail = 0;
              qc[tail] = start; qm[tail] = 0; qd[tail++] = 0;
              seen[start * 64] = true;
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              while (head < tail)
              {
                  int cell = qc[head], mask = qm[head], d = qd[head];
                  head++;
                  int cr = cell / n, cc = cell % n;
                  for (int k = 0; k < 4; k++)
                  {
                      int nr = cr + dr[k], nc = cc + dc[k];
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                      char x = grid[nr][nc];
                      if (x == '#') continue;
                      if (x >= 'A' && x <= 'F' && ((mask >> (x - 'A')) & 1) == 0) continue;
                      int nm = mask;
                      if (x >= 'a' && x <= 'f') nm |= 1 << (x - 'a');
                      int id = (nr * n + nc) * 64 + nm;
                      if (seen[id]) continue;
                      if (nm == full) return d + 1;
                      seen[id] = true;
                      qc[tail] = nr * n + nc; qm[tail] = nm; qd[tail++] = d + 1;
                  }
              }
              return -1;
          }
        `,
        go: code`
          func shortestPathAllKeys(grid []string) int {
          	m, n := len(grid), len(grid[0])
          	keys, start := 0, 0
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			ch := grid[r][c]
          			if ch == '@' {
          				start = r*n + c
          			} else if ch >= 'a' && ch <= 'f' && int(ch-'a')+1 > keys {
          				keys = int(ch-'a') + 1
          			}
          		}
          	}
          	full := (1 << uint(keys)) - 1
          	seen := make([]bool, m*n*64)
          	qc, qm, qd := []int{start}, []int{0}, []int{0}
          	seen[start*64] = true
          	dr := []int{1, -1, 0, 0}
          	dc := []int{0, 0, 1, -1}
          	for h := 0; h < len(qc); h++ {
          		cr, cc, mask, d := qc[h]/n, qc[h]%n, qm[h], qd[h]
          		for k := 0; k < 4; k++ {
          			nr, nc := cr+dr[k], cc+dc[k]
          			if nr < 0 || nr >= m || nc < 0 || nc >= n {
          				continue
          			}
          			x := grid[nr][nc]
          			if x == '#' {
          				continue
          			}
          			if x >= 'A' && x <= 'F' && (mask>>uint(x-'A'))&1 == 0 {
          				continue
          			}
          			nm := mask
          			if x >= 'a' && x <= 'f' {
          				nm |= 1 << uint(x-'a')
          			}
          			id := (nr*n+nc)*64 + nm
          			if seen[id] {
          				continue
          			}
          			if nm == full {
          				return d + 1
          			}
          			seen[id] = true
          			qc = append(qc, nr*n+nc)
          			qm = append(qm, nm)
          			qd = append(qd, d+1)
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun shortestPathAllKeys(grid: Array<String>): Int {
              val m = grid.size
              val n = grid[0].length
              var keys = 0
              var start = 0
              for (r in 0 until m) for (c in 0 until n) {
                  val ch = grid[r][c]
                  if (ch == '@') start = r * n + c
                  else if (ch in 'a'..'f') keys = maxOf(keys, ch - 'a' + 1)
              }
              val full = (1 shl keys) - 1
              val seen = BooleanArray(m * n * 64)
              val cap = m * n * 64 + 1
              val qc = IntArray(cap)
              val qm = IntArray(cap)
              val qd = IntArray(cap)
              var head = 0
              var tail = 0
              qc[tail] = start; qm[tail] = 0; qd[tail] = 0; tail++
              seen[start * 64] = true
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              while (head < tail) {
                  val cell = qc[head]
                  val mask = qm[head]
                  val d = qd[head]
                  head++
                  val cr = cell / n
                  val cc = cell % n
                  for (k in 0 until 4) {
                      val nr = cr + dr[k]
                      val nc = cc + dc[k]
                      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue
                      val x = grid[nr][nc]
                      if (x == '#') continue
                      if (x in 'A'..'F' && (mask shr (x - 'A')) and 1 == 0) continue
                      var nm = mask
                      if (x in 'a'..'f') nm = nm or (1 shl (x - 'a'))
                      val id = (nr * n + nc) * 64 + nm
                      if (seen[id]) continue
                      if (nm == full) return d + 1
                      seen[id] = true
                      qc[tail] = nr * n + nc; qm[tail] = nm; qd[tail] = d + 1; tail++
                  }
              }
              return -1
          }
        `,
        swift: code`
          func shortestPathAllKeys(_ grid: [String]) -> Int {
              let g = grid.map { Array($0.utf8).map { Int($0) } }
              let m = g.count, n = g[0].count
              var keys = 0, start = 0
              for r in 0..<m {
                  for c in 0..<n {
                      let ch = g[r][c]
                      if ch == 64 { start = r * n + c }
                      else if ch >= 97 && ch <= 102 && ch - 96 > keys { keys = ch - 96 }
                  }
              }
              let full = (1 << keys) - 1
              var seen = [Bool](repeating: false, count: m * n * 64)
              var qc = [start], qm = [0], qd = [0]
              seen[start * 64] = true
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              var h = 0
              while h < qc.count {
                  let cr = qc[h] / n, cc = qc[h] % n, mask = qm[h], d = qd[h]
                  h += 1
                  for k in 0..<4 {
                      let nr = cr + dr[k], nc = cc + dc[k]
                      if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }
                      let x = g[nr][nc]
                      if x == 35 { continue }
                      if x >= 65 && x <= 70 && (mask >> (x - 65)) & 1 == 0 { continue }
                      var nm = mask
                      if x >= 97 && x <= 102 { nm |= 1 << (x - 97) }
                      let id = (nr * n + nc) * 64 + nm
                      if seen[id] { continue }
                      if nm == full { return d + 1 }
                      seen[id] = true
                      qc.append(nr * n + nc); qm.append(nm); qd.append(d + 1)
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn shortestPathAllKeys(grid: Vec<String>) -> i32 {
              let g: Vec<Vec<u8>> = grid.iter().map(|s| s.as_bytes().to_vec()).collect();
              let m = g.len() as i32;
              let n = g[0].len() as i32;
              let mut keys = 0i32;
              let mut start = 0i32;
              for r in 0..m {
                  for c in 0..n {
                      let ch = g[r as usize][c as usize];
                      if ch == b'@' {
                          start = r * n + c;
                      } else if ch >= b'a' && ch <= b'f' && (ch - b'a') as i32 + 1 > keys {
                          keys = (ch - b'a') as i32 + 1;
                      }
                  }
              }
              let full = (1i32 << keys) - 1;
              let mut seen = vec![false; (m * n * 64) as usize];
              let mut qc: Vec<i32> = vec![start];
              let mut qm: Vec<i32> = vec![0];
              let mut qd: Vec<i32> = vec![0];
              seen[(start * 64) as usize] = true;
              let dr = [1i32, -1, 0, 0];
              let dc = [0i32, 0, 1, -1];
              let mut h = 0;
              while h < qc.len() {
                  let cr = qc[h] / n;
                  let cc = qc[h] % n;
                  let mask = qm[h];
                  let d = qd[h];
                  h += 1;
                  for k in 0..4 {
                      let nr = cr + dr[k];
                      let nc = cc + dc[k];
                      if nr < 0 || nr >= m || nc < 0 || nc >= n {
                          continue;
                      }
                      let x = g[nr as usize][nc as usize];
                      if x == b'#' {
                          continue;
                      }
                      if x >= b'A' && x <= b'F' && (mask >> (x - b'A') as i32) & 1 == 0 {
                          continue;
                      }
                      let mut nm = mask;
                      if x >= b'a' && x <= b'f' {
                          nm |= 1 << (x - b'a') as i32;
                      }
                      let id = ((nr * n + nc) * 64 + nm) as usize;
                      if seen[id] {
                          continue;
                      }
                      if nm == full {
                          return d + 1;
                      }
                      seen[id] = true;
                      qc.push(nr * n + nc);
                      qm.push(nm);
                      qd.push(d + 1);
                  }
              }
              -1
          }
        `,
        php: code`
          function shortestPathAllKeys($grid) {
              $m = count($grid);
              $n = strlen($grid[0]);
              $keys = 0;
              $start = 0;
              for ($r = 0; $r < $m; $r++)
                  for ($c = 0; $c < $n; $c++) {
                      $ch = ord($grid[$r][$c]);
                      if ($ch == 64) $start = $r * $n + $c;
                      elseif ($ch >= 97 && $ch <= 102 && $ch - 96 > $keys) $keys = $ch - 96;
                  }
              $full = (1 << $keys) - 1;
              $seen = [];
              $qc = [$start];
              $qm = [0];
              $qd = [0];
              $seen[$start * 64] = true;
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              for ($h = 0; $h < count($qc); $h++) {
                  $cr = intdiv($qc[$h], $n);
                  $cc = $qc[$h] % $n;
                  $mask = $qm[$h];
                  $d = $qd[$h];
                  for ($k = 0; $k < 4; $k++) {
                      $nr = $cr + $dr[$k];
                      $nc = $cc + $dc[$k];
                      if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;
                      $x = ord($grid[$nr][$nc]);
                      if ($x == 35) continue;
                      if ($x >= 65 && $x <= 70 && (($mask >> ($x - 65)) & 1) == 0) continue;
                      $nm = $mask;
                      if ($x >= 97 && $x <= 102) $nm |= 1 << ($x - 97);
                      $id = ($nr * $n + $nc) * 64 + $nm;
                      if (isset($seen[$id])) continue;
                      if ($nm == $full) return $d + 1;
                      $seen[$id] = true;
                      $qc[] = $nr * $n + $nc;
                      $qm[] = $nm;
                      $qd[] = $d + 1;
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def shortestPathAllKeys(grid)
            m = grid.length
            n = grid[0].length
            keys = 0
            start = 0
            m.times do |r|
              n.times do |c|
                ch = grid[r].getbyte(c)
                if ch == 64
                  start = r * n + c
                elsif ch >= 97 && ch <= 102 && ch - 96 > keys
                  keys = ch - 96
                end
              end
            end
            full = (1 << keys) - 1
            seen = Array.new(m * n * 64, false)
            qc = [start]
            qm = [0]
            qd = [0]
            seen[start * 64] = true
            dr = [1, -1, 0, 0]
            dc = [0, 0, 1, -1]
            h = 0
            while h < qc.length
              cr = qc[h] / n
              cc = qc[h] % n
              mask = qm[h]
              d = qd[h]
              h += 1
              4.times do |k|
                nr = cr + dr[k]
                nc = cc + dc[k]
                next if nr < 0 || nr >= m || nc < 0 || nc >= n
                x = grid[nr].getbyte(nc)
                next if x == 35
                next if x >= 65 && x <= 70 && (mask >> (x - 65)) & 1 == 0
                nm = mask
                nm |= 1 << (x - 97) if x >= 97 && x <= 102
                id = (nr * n + nc) * 64 + nm
                next if seen[id]
                return d + 1 if nm == full
                seen[id] = true
                qc << nr * n + nc
                qm << nm
                qd << d + 1
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree (LC 1489) ──
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // Enumerate every spanning tree (n − 1 acyclic edges) and keep the cheapest ones.
      const m = edges.length;
      let best = Infinity;
      let msts: number[] = [];
      for (let mask = 0; mask < 1 << m; mask++) {
        let bits = 0;
        for (let i = 0; i < m; i++) if (mask & (1 << i)) bits++;
        if (bits !== n - 1) continue;
        const root = Array.from({ length: n }, (_, i) => i);
        const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x])));
        let ok = true, w = 0;
        for (let i = 0; i < m && ok; i++) {
          if (!(mask & (1 << i))) continue;
          const a = find(edges[i][0]), b = find(edges[i][1]);
          if (a === b) ok = false;
          else { root[a] = b; w += edges[i][2]; }
        }
        if (!ok) continue;
        if (w < best) { best = w; msts = []; }
        if (w === best) msts.push(mask);
      }
      const critical: number[] = [], pseudo: number[] = [];
      for (let i = 0; i < m; i++) {
        const inCount = msts.filter((mk) => mk & (1 << i)).length;
        if (inCount === msts.length) critical.push(i);
        else if (inCount > 0) pseudo.push(i);
      }
      return [critical, pseudo];
    };
    return {
      slug: "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree",
      title: "Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree",
      difficulty: "HARD" as const,
      tags: ["Graph", "Union Find", "Minimum Spanning Tree", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "findCriticalAndPseudoCriticalEdges",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "A connected, weighted, undirected graph has `n` vertices numbered `0` to `n - 1`. Edge `i` is `edges[i] = [ai, bi, weighti]`. A **minimum spanning tree (MST)** is a subset of the edges that connects all vertices without cycles and has the smallest possible total weight.\n\n- An edge is **critical** if deleting it from the graph would make every remaining spanning tree heavier (it belongs to every MST).\n- An edge is **pseudo-critical** if it belongs to some MSTs but not to all of them.\n\nReturn `[critical, pseudo]`: the indices of the critical edges and of the pseudo-critical edges, each list in **ascending** order.",
        [
          { in: "n = 4, edges = [[0,1,1],[1,2,2],[2,3,1],[0,3,3],[1,3,2]]", out: "[[0,2],[1,4]]", note: "Every MST weighs 4 and uses edges 0 and 2 plus one of edges 1 and 4; edge 3 is never used." },
          { in: "n = 3, edges = [[0,1,5],[1,2,5],[0,2,5]]", out: "[[],[0,1,2]]", note: "Any two of the three equal edges form an MST." },
          { in: "n = 2, edges = [[0,1,7]]", out: "[[0],[]]" },
        ],
        ["2 <= n <= 100", "1 <= edges.length <= min(200, n * (n - 1) / 2)", "edges[i].length == 3", "0 <= ai < bi < n", "1 <= weighti <= 1000", "all pairs (ai, bi) are distinct", "the graph is connected"]),
      hints: [
        "First compute the MST weight with Kruskal's algorithm.",
        "An edge is critical exactly when leaving it out makes the best spanning tree heavier (or disconnects the graph).",
        "An edge that is not critical is pseudo-critical exactly when forcing it into the tree first still allows a spanning tree of the MST weight. Rerun Kruskal for each edge, twice.",
      ],
      editorial: explain({
        idea: "Use Kruskal as a subroutine that can skip one edge or force one edge in, and compare its result with the true MST weight.",
        steps: [
          "Sort edge indices by weight. `mst(skip, force)` runs Kruskal with a fresh union-find: it first adds the forced edge (if any), then scans the sorted edges, ignoring `skip`; it returns the total weight, or ∞ if fewer than `n − 1` edges were taken.",
          "Let `base = mst(none, none)`.",
          "For every edge `i`: if `mst(skip = i) > base`, edge `i` is critical.",
          "Otherwise, if `mst(force = i) == base`, edge `i` is pseudo-critical.",
          "Return both lists, collected in increasing index order.",
        ],
        why: "If some MST avoids edge `i`, Kruskal without `i` finds a tree of weight `base`; if none does, every spanning tree without `i` is heavier — that is exactly criticality. For a non-critical edge, forcing it in and completing greedily yields the cheapest spanning tree that contains `i` (the cut/cycle properties make greedy completion optimal); it weighs `base` exactly when some MST contains `i`.",
        time: "O(m² · α(n) + m log m)",
        space: "O(n + m)",
        pitfalls: [
          "Removing an edge can disconnect the graph — treat that as an infinitely heavy tree, which makes the edge critical.",
          "Check criticality first: a critical edge also passes the forced-in test but must not be listed as pseudo-critical.",
          "Indices refer to the original order of `edges`, not the sorted order.",
        ],
      }),
      examples: [
        { input: "4\n[[0,1,1],[1,2,2],[2,3,1],[0,3,3],[1,3,2]]", expectedOutput: "[[0,2],[1,4]]" },
        { input: "3\n[[0,1,5],[1,2,5],[0,2,5]]", expectedOutput: "[[],[0,1,2]]" },
        { input: "2\n[[0,1,7]]", expectedOutput: "[[0],[]]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 4, 5, 5, 6, 6]);
        const cap = (n * (n - 1)) / 2;
        const extra = ri(rng, 0, Math.min(cap, 10) - (n - 1));
        const W = pick(rng, [1, 2, 3, 5, 1000]);
        const edges = connectedEdges(rng, n, extra, 0).map((e) => [Math.min(e[0], e[1]), Math.max(e[0], e[1]), ri(rng, 1, W)]);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntMat(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findCriticalAndPseudoCriticalEdges(n: int, edges: List[List[int]]) -> List[List[int]]:
              m = len(edges)
              order = sorted(range(m), key=lambda i: edges[i][2])
              INF = 10 ** 9

              def mst(skip, force):
                  root = list(range(n))

                  def find(x):
                      while root[x] != x:
                          root[x] = root[root[x]]
                          x = root[x]
                      return x

                  total = 0
                  used = 0
                  if force >= 0:
                      a, b, w = edges[force]
                      root[find(a)] = find(b)
                      total += w
                      used += 1
                  for i in order:
                      if i == skip:
                          continue
                      a, b, w = edges[i]
                      ra, rb = find(a), find(b)
                      if ra != rb:
                          root[ra] = rb
                          total += w
                          used += 1
                  return total if used == n - 1 else INF

              base = mst(-1, -1)
              critical, pseudo = [], []
              for i in range(m):
                  if mst(i, -1) > base:
                      critical.append(i)
                  elif mst(-1, i) == base:
                      pseudo.append(i)
              return [critical, pseudo]
        `,
        javascript: code`
          var findCriticalAndPseudoCriticalEdges = function(n, edges) {
              var m = edges.length;
              var order = [];
              for (var i = 0; i < m; i++) order.push(i);
              order.sort(function(p, q) { return edges[p][2] - edges[q][2]; });
              var INF = 1000000000;
              var mst = function(skip, force) {
                  var root = [];
                  for (var k = 0; k < n; k++) root.push(k);
                  var find = function(x) {
                      while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                      return x;
                  };
                  var total = 0, used = 0;
                  if (force >= 0) {
                      root[find(edges[force][0])] = find(edges[force][1]);
                      total += edges[force][2];
                      used++;
                  }
                  for (var t = 0; t < m; t++) {
                      var e = order[t];
                      if (e === skip) continue;
                      var ra = find(edges[e][0]), rb = find(edges[e][1]);
                      if (ra !== rb) { root[ra] = rb; total += edges[e][2]; used++; }
                  }
                  return used === n - 1 ? total : INF;
              };
              var base = mst(-1, -1);
              var critical = [], pseudo = [];
              for (var j = 0; j < m; j++) {
                  if (mst(j, -1) > base) critical.push(j);
                  else if (mst(-1, j) === base) pseudo.push(j);
              }
              return [critical, pseudo];
          };
        `,
        typescript: code`
          function findCriticalAndPseudoCriticalEdges(n: number, edges: number[][]): number[][] {
              var m = edges.length;
              var order: number[] = [];
              for (var i = 0; i < m; i++) order.push(i);
              order.sort(function(p: number, q: number) { return edges[p][2] - edges[q][2]; });
              var INF = 1000000000;
              function mst(skip: number, force: number): number {
                  var root: number[] = [];
                  for (var k = 0; k < n; k++) root.push(k);
                  function find(x: number): number {
                      while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                      return x;
                  }
                  var total = 0, used = 0;
                  if (force >= 0) {
                      root[find(edges[force][0])] = find(edges[force][1]);
                      total += edges[force][2];
                      used++;
                  }
                  for (var t = 0; t < m; t++) {
                      var e = order[t];
                      if (e === skip) continue;
                      var ra = find(edges[e][0]), rb = find(edges[e][1]);
                      if (ra !== rb) { root[ra] = rb; total += edges[e][2]; used++; }
                  }
                  return used === n - 1 ? total : INF;
              }
              var base = mst(-1, -1);
              var critical: number[] = [], pseudo: number[] = [];
              for (var j = 0; j < m; j++) {
                  if (mst(j, -1) > base) critical.push(j);
                  else if (mst(-1, j) === base) pseudo.push(j);
              }
              return [critical, pseudo];
          }
        `,
        java: code`
          public static int[][] findCriticalAndPseudoCriticalEdges(int n, int[][] edges) {
              int m = edges.length;
              Integer[] boxed = new Integer[m];
              for (int i = 0; i < m; i++) boxed[i] = i;
              Arrays.sort(boxed, (p, q) -> Integer.compare(edges[p][2], edges[q][2]));
              int[] order = new int[m];
              for (int i = 0; i < m; i++) order[i] = boxed[i];
              int base = cpMst(n, edges, order, -1, -1);
              List<Integer> critical = new ArrayList<>(), pseudo = new ArrayList<>();
              for (int i = 0; i < m; i++) {
                  if (cpMst(n, edges, order, i, -1) > base) critical.add(i);
                  else if (cpMst(n, edges, order, -1, i) == base) pseudo.add(i);
              }
              int[][] res = new int[2][];
              res[0] = new int[critical.size()];
              for (int k = 0; k < res[0].length; k++) res[0][k] = critical.get(k);
              res[1] = new int[pseudo.size()];
              for (int k = 0; k < res[1].length; k++) res[1][k] = pseudo.get(k);
              return res;
          }

          static int cpFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int cpMst(int n, int[][] edges, int[] order, int skip, int force) {
              int[] root = new int[n];
              for (int k = 0; k < n; k++) root[k] = k;
              int total = 0, used = 0;
              if (force >= 0) {
                  root[cpFind(root, edges[force][0])] = cpFind(root, edges[force][1]);
                  total += edges[force][2];
                  used++;
              }
              for (int e : order) {
                  if (e == skip) continue;
                  int ra = cpFind(root, edges[e][0]), rb = cpFind(root, edges[e][1]);
                  if (ra != rb) { root[ra] = rb; total += edges[e][2]; used++; }
              }
              return used == n - 1 ? total : Integer.MAX_VALUE;
          }
        `,
        cpp: code`
          static int cpFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int cpMst(int n, vector<vector<int>>& edges, vector<int>& order, int skip, int force) {
              vector<int> root(n);
              for (int k = 0; k < n; k++) root[k] = k;
              int total = 0, used = 0;
              if (force >= 0) {
                  root[cpFind(root, edges[force][0])] = cpFind(root, edges[force][1]);
                  total += edges[force][2];
                  used++;
              }
              for (int e : order) {
                  if (e == skip) continue;
                  int ra = cpFind(root, edges[e][0]), rb = cpFind(root, edges[e][1]);
                  if (ra != rb) { root[ra] = rb; total += edges[e][2]; used++; }
              }
              return used == n - 1 ? total : INT_MAX;
          }

          vector<vector<int>> findCriticalAndPseudoCriticalEdges(int n, vector<vector<int>>& edges) {
              int m = edges.size();
              vector<int> order(m);
              for (int i = 0; i < m; i++) order[i] = i;
              stable_sort(order.begin(), order.end(), [&](int p, int q) { return edges[p][2] < edges[q][2]; });
              int base = cpMst(n, edges, order, -1, -1);
              vector<vector<int>> res(2);
              for (int i = 0; i < m; i++) {
                  if (cpMst(n, edges, order, i, -1) > base) res[0].push_back(i);
                  else if (cpMst(n, edges, order, -1, i) == base) res[1].push_back(i);
              }
              return res;
          }
        `,
        c: code`
          static int cpFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int cpMst(int n, int** edges, int* order, int m, int skip, int force, int* root) {
              for (int k = 0; k < n; k++) root[k] = k;
              int total = 0, used = 0;
              if (force >= 0) {
                  root[cpFind(root, edges[force][0])] = cpFind(root, edges[force][1]);
                  total += edges[force][2];
                  used++;
              }
              for (int t = 0; t < m; t++) {
                  int e = order[t];
                  if (e == skip) continue;
                  int ra = cpFind(root, edges[e][0]), rb = cpFind(root, edges[e][1]);
                  if (ra != rb) { root[ra] = rb; total += edges[e][2]; used++; }
              }
              return used == n - 1 ? total : 2147483647;
          }

          int** findCriticalAndPseudoCriticalEdges(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize, int** returnColumnSizes) {
              int m = edgesSize;
              int* order = (int*)malloc((m + 1) * sizeof(int));
              for (int i = 0; i < m; i++) order[i] = i;
              /* insertion sort by weight (m <= 200) */
              for (int i = 1; i < m; i++) {
                  int cur = order[i], j = i - 1;
                  while (j >= 0 && edges[order[j]][2] > edges[cur][2]) { order[j + 1] = order[j]; j--; }
                  order[j + 1] = cur;
              }
              int* root = (int*)malloc((n + 1) * sizeof(int));
              int base = cpMst(n, edges, order, m, -1, -1, root);
              int** res = (int**)malloc(2 * sizeof(int*));
              int* cols = (int*)calloc(2, sizeof(int));
              res[0] = (int*)malloc((m + 1) * sizeof(int));
              res[1] = (int*)malloc((m + 1) * sizeof(int));
              for (int i = 0; i < m; i++) {
                  if (cpMst(n, edges, order, m, i, -1, root) > base) res[0][cols[0]++] = i;
                  else if (cpMst(n, edges, order, m, -1, i, root) == base) res[1][cols[1]++] = i;
              }
              free(order);
              free(root);
              *returnSize = 2;
              *returnColumnSizes = cols;
              return res;
          }
        `,
        csharp: code`
          public static int[][] FindCriticalAndPseudoCriticalEdges(int n, int[][] edges)
          {
              int m = edges.Length;
              int[] order = new int[m];
              for (int i = 0; i < m; i++) order[i] = i;
              int[] weights = new int[m];
              for (int i = 0; i < m; i++) weights[i] = edges[i][2];
              Array.Sort((int[])weights.Clone(), order);
              int baseWeight = CpMst(n, edges, order, -1, -1);
              var critical = new List<int>();
              var pseudo = new List<int>();
              for (int i = 0; i < m; i++)
              {
                  if (CpMst(n, edges, order, i, -1) > baseWeight) critical.Add(i);
                  else if (CpMst(n, edges, order, -1, i) == baseWeight) pseudo.Add(i);
              }
              return new int[][] { critical.ToArray(), pseudo.ToArray() };
          }

          static int CpFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int CpMst(int n, int[][] edges, int[] order, int skip, int force)
          {
              int[] root = new int[n];
              for (int k = 0; k < n; k++) root[k] = k;
              int total = 0, used = 0;
              if (force >= 0)
              {
                  root[CpFind(root, edges[force][0])] = CpFind(root, edges[force][1]);
                  total += edges[force][2];
                  used++;
              }
              foreach (int e in order)
              {
                  if (e == skip) continue;
                  int ra = CpFind(root, edges[e][0]), rb = CpFind(root, edges[e][1]);
                  if (ra != rb) { root[ra] = rb; total += edges[e][2]; used++; }
              }
              return used == n - 1 ? total : int.MaxValue;
          }
        `,
        go: code`
          func cpFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func cpMst(n int, edges [][]int, order []int, skip int, force int) int {
          	root := make([]int, n)
          	for k := range root {
          		root[k] = k
          	}
          	total, used := 0, 0
          	if force >= 0 {
          		root[cpFind(root, edges[force][0])] = cpFind(root, edges[force][1])
          		total += edges[force][2]
          		used++
          	}
          	for _, e := range order {
          		if e == skip {
          			continue
          		}
          		ra, rb := cpFind(root, edges[e][0]), cpFind(root, edges[e][1])
          		if ra != rb {
          			root[ra] = rb
          			total += edges[e][2]
          			used++
          		}
          	}
          	if used != n-1 {
          		return 1 << 30
          	}
          	return total
          }

          func findCriticalAndPseudoCriticalEdges(n int, edges [][]int) [][]int {
          	m := len(edges)
          	order := make([]int, m)
          	for i := range order {
          		order[i] = i
          	}
          	sort.SliceStable(order, func(p, q int) bool { return edges[order[p]][2] < edges[order[q]][2] })
          	base := cpMst(n, edges, order, -1, -1)
          	critical, pseudo := []int{}, []int{}
          	for i := 0; i < m; i++ {
          		if cpMst(n, edges, order, i, -1) > base {
          			critical = append(critical, i)
          		} else if cpMst(n, edges, order, -1, i) == base {
          			pseudo = append(pseudo, i)
          		}
          	}
          	return [][]int{critical, pseudo}
          }
        `,
        kotlin: code`
          fun cpFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun cpMst(n: Int, edges: Array<IntArray>, order: List<Int>, skip: Int, force: Int): Int {
              val root = IntArray(n) { it }
              var total = 0
              var used = 0
              if (force >= 0) {
                  root[cpFind(root, edges[force][0])] = cpFind(root, edges[force][1])
                  total += edges[force][2]
                  used++
              }
              for (e in order) {
                  if (e == skip) continue
                  val ra = cpFind(root, edges[e][0])
                  val rb = cpFind(root, edges[e][1])
                  if (ra != rb) { root[ra] = rb; total += edges[e][2]; used++ }
              }
              return if (used == n - 1) total else Int.MAX_VALUE
          }

          fun findCriticalAndPseudoCriticalEdges(n: Int, edges: Array<IntArray>): Array<IntArray> {
              val m = edges.size
              val order = (0 until m).sortedBy { edges[it][2] }
              val base = cpMst(n, edges, order, -1, -1)
              val critical = ArrayList<Int>()
              val pseudo = ArrayList<Int>()
              for (i in 0 until m) {
                  if (cpMst(n, edges, order, i, -1) > base) critical.add(i)
                  else if (cpMst(n, edges, order, -1, i) == base) pseudo.add(i)
              }
              return arrayOf(critical.toIntArray(), pseudo.toIntArray())
          }
        `,
        swift: code`
          func cpFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func cpMst(_ n: Int, _ edges: [[Int]], _ order: [Int], _ skip: Int, _ force: Int) -> Int {
              var root = Array(0..<n)
              var total = 0, used = 0
              if force >= 0 {
                  let ra = cpFind(&root, edges[force][0])
                  let rb = cpFind(&root, edges[force][1])
                  root[ra] = rb
                  total += edges[force][2]
                  used += 1
              }
              for e in order where e != skip {
                  let ra = cpFind(&root, edges[e][0])
                  let rb = cpFind(&root, edges[e][1])
                  if ra != rb { root[ra] = rb; total += edges[e][2]; used += 1 }
              }
              return used == n - 1 ? total : Int.max
          }

          func findCriticalAndPseudoCriticalEdges(_ n: Int, _ edges: [[Int]]) -> [[Int]] {
              let m = edges.count
              let order = (0..<m).sorted { edges[$0][2] < edges[$1][2] }
              let base = cpMst(n, edges, order, -1, -1)
              var critical = [Int](), pseudo = [Int]()
              for i in 0..<m {
                  if cpMst(n, edges, order, i, -1) > base { critical.append(i) }
                  else if cpMst(n, edges, order, -1, i) == base { pseudo.append(i) }
              }
              return [critical, pseudo]
          }
        `,
        rust: code`
          fn cp_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn cp_mst(n: usize, edges: &Vec<Vec<i32>>, order: &Vec<usize>, skip: i32, force: i32) -> i32 {
              let mut root: Vec<usize> = (0..n).collect();
              let mut total = 0i32;
              let mut used = 0usize;
              if force >= 0 {
                  let f = force as usize;
                  let ra = cp_find(&mut root, edges[f][0] as usize);
                  let rb = cp_find(&mut root, edges[f][1] as usize);
                  root[ra] = rb;
                  total += edges[f][2];
                  used += 1;
              }
              for &e in order.iter() {
                  if e as i32 == skip {
                      continue;
                  }
                  let ra = cp_find(&mut root, edges[e][0] as usize);
                  let rb = cp_find(&mut root, edges[e][1] as usize);
                  if ra != rb {
                      root[ra] = rb;
                      total += edges[e][2];
                      used += 1;
                  }
              }
              if used + 1 == n { total } else { std::i32::MAX }
          }

          fn findCriticalAndPseudoCriticalEdges(n: i32, edges: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let n = n as usize;
              let m = edges.len();
              let mut order: Vec<usize> = (0..m).collect();
              order.sort_by_key(|&i| edges[i][2]);
              let base = cp_mst(n, &edges, &order, -1, -1);
              let mut critical: Vec<i32> = Vec::new();
              let mut pseudo: Vec<i32> = Vec::new();
              for i in 0..m {
                  if cp_mst(n, &edges, &order, i as i32, -1) > base {
                      critical.push(i as i32);
                  } else if cp_mst(n, &edges, &order, -1, i as i32) == base {
                      pseudo.push(i as i32);
                  }
              }
              vec![critical, pseudo]
          }
        `,
        php: code`
          function findCriticalAndPseudoCriticalEdges($n, $edges) {
              $m = count($edges);
              $order = range(0, $m - 1);
              usort($order, function ($p, $q) use ($edges) { return $edges[$p][2] - $edges[$q][2]; });
              $base = cpMst($n, $edges, $order, -1, -1);
              $critical = [];
              $pseudo = [];
              for ($i = 0; $i < $m; $i++) {
                  if (cpMst($n, $edges, $order, $i, -1) > $base) $critical[] = $i;
                  elseif (cpMst($n, $edges, $order, -1, $i) == $base) $pseudo[] = $i;
              }
              return [$critical, $pseudo];
          }

          function cpFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }

          function cpMst($n, $edges, $order, $skip, $force) {
              $root = range(0, $n - 1);
              $total = 0;
              $used = 0;
              if ($force >= 0) {
                  $ra = cpFind($root, $edges[$force][0]);
                  $rb = cpFind($root, $edges[$force][1]);
                  $root[$ra] = $rb;
                  $total += $edges[$force][2];
                  $used++;
              }
              foreach ($order as $e) {
                  if ($e == $skip) continue;
                  $ra = cpFind($root, $edges[$e][0]);
                  $rb = cpFind($root, $edges[$e][1]);
                  if ($ra != $rb) { $root[$ra] = $rb; $total += $edges[$e][2]; $used++; }
              }
              return $used == $n - 1 ? $total : PHP_INT_MAX;
          }
        `,
        ruby: code`
          def findCriticalAndPseudoCriticalEdges(n, edges)
            m = edges.length
            order = (0...m).sort_by { |i| [edges[i][2], i] }
            mst = lambda do |skip, force|
              root = (0...n).to_a
              find = lambda do |x|
                while root[x] != x
                  root[x] = root[root[x]]
                  x = root[x]
                end
                x
              end
              total = 0
              used = 0
              if force >= 0
                ra = find.call(edges[force][0])
                rb = find.call(edges[force][1])
                root[ra] = rb
                total += edges[force][2]
                used += 1
              end
              order.each do |e|
                next if e == skip
                ra = find.call(edges[e][0])
                rb = find.call(edges[e][1])
                next if ra == rb
                root[ra] = rb
                total += edges[e][2]
                used += 1
              end
              used == n - 1 ? total : Float::INFINITY
            end
            base = mst.call(-1, -1)
            critical = []
            pseudo = []
            m.times do |i|
              if mst.call(i, -1) > base
                critical << i
              elsif mst.call(-1, i) == base
                pseudo << i
              end
            end
            [critical, pseudo]
          end
        `,
      },
    };
  })(),

  // ── Remove Max Number of Edges to Keep Graph Fully Traversable (LC 1579) ──
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // Smallest subset of edges that keeps both Alice and Bob connected, by brute force.
      const m = edges.length;
      const connected = (mask: number, who: number) => {
        const root = Array.from({ length: n + 1 }, (_, i) => i);
        const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x])));
        let comps = n;
        for (let i = 0; i < m; i++) {
          if (!(mask & (1 << i))) continue;
          const [t, u, v] = edges[i];
          if (t !== 3 && t !== who) continue;
          const a = find(u), b = find(v);
          if (a !== b) { root[a] = b; comps--; }
        }
        return comps === 1;
      };
      let best = -1;
      for (let mask = 0; mask < 1 << m; mask++) {
        let bits = 0;
        for (let i = 0; i < m; i++) if (mask & (1 << i)) bits++;
        if (best !== -1 && bits >= best) continue;
        if (connected(mask, 1) && connected(mask, 2)) best = bits;
      }
      return best === -1 ? -1 : m - best;
    };
    return {
      slug: "remove-max-number-of-edges-to-keep-graph-fully-traversable",
      title: "Remove Max Number of Edges to Keep Graph Fully Traversable",
      difficulty: "HARD" as const,
      tags: ["Graph", "Union Find", "Greedy", "Google", "Amazon"],
      signature: {
        funcName: "maxNumEdgesToRemove",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Alice and Bob share an undirected graph of `n` nodes numbered `1` to `n`. Each `edges[i] = [typei, ui, vi]` is an edge between `ui` and `vi` of one of three types:\n\n- type `1`: only Alice can use it,\n- type `2`: only Bob can use it,\n- type `3`: both can use it.\n\nThe graph is **fully traversable** for a person if, using only the edges they may use, they can get from any node to any other node.\n\nReturn the **maximum** number of edges you can remove so that the graph stays fully traversable for **both** Alice and Bob, or `-1` if it is not fully traversable for both to begin with.",
        [
          { in: "n = 3, edges = [[3,1,2],[1,2,3],[2,2,3],[1,1,3],[3,2,3]]", out: "3", note: "The two shared edges `[3,1,2]` and `[3,2,3]` already connect everything for both; the other three can go." },
          { in: "n = 4, edges = [[3,1,2],[1,2,3],[2,3,4],[1,3,4],[2,2,3]]", out: "0" },
          { in: "n = 3, edges = [[1,1,2],[2,2,3],[3,1,2]]", out: "-1", note: "Alice can never reach node 3." },
        ],
        ["1 <= n <= 10^5", "1 <= edges.length <= min(10^5, 3 * n * (n - 1) / 2)", "edges[i].length == 3", "1 <= typei <= 3", "1 <= ui < vi <= n", "all tuples (typei, ui, vi) are distinct"]),
      hints: [
        "Count the edges you must keep instead of the ones you remove: the answer is `edges.length` minus the fewest edges that keep both people connected.",
        "A shared (type 3) edge does the work of two private edges, so it should be preferred whenever it joins two separate pieces.",
        "Keep two union-finds. Add type-3 edges first to both, then type-1 edges to Alice's and type-2 edges to Bob's, counting only the edges that actually merge two sets. If either structure is still split, return -1.",
      ],
      editorial: explain({
        idea: "Greedy union-find: take shared edges first (each can serve both people), then private edges only where still needed; every edge that merges nothing is removable.",
        steps: [
          "Create union-finds for Alice and Bob over nodes `1..n`.",
          "For each type-3 edge, union it in both structures if it merges two of Alice's sets (Bob's structure is identical at this point); count it as kept.",
          "For each type-1 edge, union it in Alice's structure, counting it if it merges; likewise type-2 edges in Bob's structure.",
          "If either structure has more than one component, return -1; otherwise return `edges.length − kept`.",
        ],
        why: "Each person needs a spanning forest of exactly `n − 1` edges. Let `s` be the number of shared edges used; then the kept total is `s + (n − 1 − s) + (n − 1 − s) = 2(n − 1) − s`, so maximising `s` is the whole game. Adding all useful type-3 edges first yields a spanning forest of the type-3 subgraph, which has the maximum possible number of shared edges; the private edges then complete each person's tree independently, using the minimum number for each.",
        time: "O(m · α(n))",
        space: "O(n)",
        pitfalls: [
          "Processing edges in input order instead of type 3 first can waste private edges where a shared edge would have done.",
          "A type-3 edge that merges nothing for Alice also merges nothing for Bob — they share the same history at that stage.",
          "Check both people's connectivity at the end; either one failing means -1.",
        ],
      }),
      examples: [
        { input: "3\n[[3,1,2],[1,2,3],[2,2,3],[1,1,3],[3,2,3]]", expectedOutput: "3" },
        { input: "4\n[[3,1,2],[1,2,3],[2,3,4],[1,3,4],[2,2,3]]", expectedOutput: "0" },
        { input: "3\n[[1,1,2],[2,2,3],[3,1,2]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 3, 4, 4, 5, 6]);
        const all: number[][] = [];
        for (let t = 1; t <= 3; t++) for (let u = 1; u <= n; u++) for (let v = u + 1; v <= n; v++) all.push([t, u, v]);
        shuffle(rng, all);
        const m = ri(rng, 1, Math.min(all.length, pick(rng, [n, 2 * n, 9])));
        let edges = all.slice(0, m);
        if (rng() < 0.5) {
          // Make it likely that both are connected: lay a shared or doubled spanning tree first.
          const tree = randomTreeEdges(rng, n, 1).map((e) => [Math.min(e[0], e[1]), Math.max(e[0], e[1])]);
          const forced: number[][] = [];
          for (const [u, v] of tree) {
            if (rng() < 0.5) forced.push([3, u, v]);
            else { forced.push([1, u, v]); forced.push([2, u, v]); }
          }
          const keys = new Set(forced.map((e) => e.join(",")));
          edges = forced.concat(edges.filter((e) => !keys.has(e.join(",")))).slice(0, 9);
          shuffle(rng, edges);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxNumEdgesToRemove(n: int, edges: List[List[int]]) -> int:
              alice = list(range(n + 1))
              bob = list(range(n + 1))

              def find(root, x):
                  while root[x] != x:
                      root[x] = root[root[x]]
                      x = root[x]
                  return x

              def union(root, a, b):
                  ra, rb = find(root, a), find(root, b)
                  if ra == rb:
                      return False
                  root[ra] = rb
                  return True

              used = 0
              comps_a = comps_b = n
              for t, u, v in edges:
                  if t == 3 and union(alice, u, v):
                      union(bob, u, v)
                      used += 1
                      comps_a -= 1
                      comps_b -= 1
              for t, u, v in edges:
                  if t == 1 and union(alice, u, v):
                      used += 1
                      comps_a -= 1
                  elif t == 2 and union(bob, u, v):
                      used += 1
                      comps_b -= 1
              if comps_a != 1 or comps_b != 1:
                  return -1
              return len(edges) - used
        `,
        javascript: code`
          var maxNumEdgesToRemove = function(n, edges) {
              var alice = [], bob = [];
              for (var i = 0; i <= n; i++) { alice.push(i); bob.push(i); }
              var find = function(root, x) {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              };
              var union = function(root, a, b) {
                  var ra = find(root, a), rb = find(root, b);
                  if (ra === rb) return false;
                  root[ra] = rb;
                  return true;
              };
              var used = 0, compsA = n, compsB = n;
              for (var k = 0; k < edges.length; k++) {
                  var e = edges[k];
                  if (e[0] === 3 && union(alice, e[1], e[2])) { union(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              for (var j = 0; j < edges.length; j++) {
                  var f = edges[j];
                  if (f[0] === 1 && union(alice, f[1], f[2])) { used++; compsA--; }
                  else if (f[0] === 2 && union(bob, f[1], f[2])) { used++; compsB--; }
              }
              if (compsA !== 1 || compsB !== 1) return -1;
              return edges.length - used;
          };
        `,
        typescript: code`
          function maxNumEdgesToRemove(n: number, edges: number[][]): number {
              var alice: number[] = [], bob: number[] = [];
              for (var i = 0; i <= n; i++) { alice.push(i); bob.push(i); }
              function find(root: number[], x: number): number {
                  while (root[x] !== x) { root[x] = root[root[x]]; x = root[x]; }
                  return x;
              }
              function union(root: number[], a: number, b: number): boolean {
                  var ra = find(root, a), rb = find(root, b);
                  if (ra === rb) return false;
                  root[ra] = rb;
                  return true;
              }
              var used = 0, compsA = n, compsB = n;
              for (var k = 0; k < edges.length; k++) {
                  var e = edges[k];
                  if (e[0] === 3 && union(alice, e[1], e[2])) { union(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              for (var j = 0; j < edges.length; j++) {
                  var f = edges[j];
                  if (f[0] === 1 && union(alice, f[1], f[2])) { used++; compsA--; }
                  else if (f[0] === 2 && union(bob, f[1], f[2])) { used++; compsB--; }
              }
              if (compsA !== 1 || compsB !== 1) return -1;
              return edges.length - used;
          }
        `,
        java: code`
          public static int maxNumEdgesToRemove(int n, int[][] edges) {
              int[] alice = new int[n + 1], bob = new int[n + 1];
              for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
              int used = 0, compsA = n, compsB = n;
              for (int[] e : edges) {
                  if (e[0] == 3 && rmUnion(alice, e[1], e[2])) { rmUnion(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              for (int[] e : edges) {
                  if (e[0] == 1 && rmUnion(alice, e[1], e[2])) { used++; compsA--; }
                  else if (e[0] == 2 && rmUnion(bob, e[1], e[2])) { used++; compsB--; }
              }
              if (compsA != 1 || compsB != 1) return -1;
              return edges.length - used;
          }

          static int rmFind(int[] root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static boolean rmUnion(int[] root, int a, int b) {
              int ra = rmFind(root, a), rb = rmFind(root, b);
              if (ra == rb) return false;
              root[ra] = rb;
              return true;
          }
        `,
        cpp: code`
          static int rmFind(vector<int>& root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static bool rmUnion(vector<int>& root, int a, int b) {
              int ra = rmFind(root, a), rb = rmFind(root, b);
              if (ra == rb) return false;
              root[ra] = rb;
              return true;
          }

          int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
              vector<int> alice(n + 1), bob(n + 1);
              for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
              int used = 0, compsA = n, compsB = n;
              for (auto& e : edges) {
                  if (e[0] == 3 && rmUnion(alice, e[1], e[2])) { rmUnion(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              for (auto& e : edges) {
                  if (e[0] == 1 && rmUnion(alice, e[1], e[2])) { used++; compsA--; }
                  else if (e[0] == 2 && rmUnion(bob, e[1], e[2])) { used++; compsB--; }
              }
              if (compsA != 1 || compsB != 1) return -1;
              return (int)edges.size() - used;
          }
        `,
        c: code`
          static int rmFind(int* root, int x) {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static int rmUnion(int* root, int a, int b) {
              int ra = rmFind(root, a), rb = rmFind(root, b);
              if (ra == rb) return 0;
              root[ra] = rb;
              return 1;
          }

          int maxNumEdgesToRemove(int n, int** edges, int edgesSize, int* edgesColSize) {
              int* alice = (int*)malloc((n + 1) * sizeof(int));
              int* bob = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
              int used = 0, compsA = n, compsB = n;
              for (int k = 0; k < edgesSize; k++) {
                  int* e = edges[k];
                  if (e[0] == 3 && rmUnion(alice, e[1], e[2])) { rmUnion(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              for (int k = 0; k < edgesSize; k++) {
                  int* e = edges[k];
                  if (e[0] == 1 && rmUnion(alice, e[1], e[2])) { used++; compsA--; }
                  else if (e[0] == 2 && rmUnion(bob, e[1], e[2])) { used++; compsB--; }
              }
              free(alice);
              free(bob);
              if (compsA != 1 || compsB != 1) return -1;
              return edgesSize - used;
          }
        `,
        csharp: code`
          public static int MaxNumEdgesToRemove(int n, int[][] edges)
          {
              int[] alice = new int[n + 1], bob = new int[n + 1];
              for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
              int used = 0, compsA = n, compsB = n;
              foreach (var e in edges)
              {
                  if (e[0] == 3 && RmUnion(alice, e[1], e[2])) { RmUnion(bob, e[1], e[2]); used++; compsA--; compsB--; }
              }
              foreach (var e in edges)
              {
                  if (e[0] == 1 && RmUnion(alice, e[1], e[2])) { used++; compsA--; }
                  else if (e[0] == 2 && RmUnion(bob, e[1], e[2])) { used++; compsB--; }
              }
              if (compsA != 1 || compsB != 1) return -1;
              return edges.Length - used;
          }

          static int RmFind(int[] root, int x)
          {
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x]; }
              return x;
          }

          static bool RmUnion(int[] root, int a, int b)
          {
              int ra = RmFind(root, a), rb = RmFind(root, b);
              if (ra == rb) return false;
              root[ra] = rb;
              return true;
          }
        `,
        go: code`
          func rmFind(root []int, x int) int {
          	for root[x] != x {
          		root[x] = root[root[x]]
          		x = root[x]
          	}
          	return x
          }

          func rmUnion(root []int, a int, b int) bool {
          	ra, rb := rmFind(root, a), rmFind(root, b)
          	if ra == rb {
          		return false
          	}
          	root[ra] = rb
          	return true
          }

          func maxNumEdgesToRemove(n int, edges [][]int) int {
          	alice := make([]int, n+1)
          	bob := make([]int, n+1)
          	for i := 0; i <= n; i++ {
          		alice[i] = i
          		bob[i] = i
          	}
          	used, compsA, compsB := 0, n, n
          	for _, e := range edges {
          		if e[0] == 3 && rmUnion(alice, e[1], e[2]) {
          			rmUnion(bob, e[1], e[2])
          			used++
          			compsA--
          			compsB--
          		}
          	}
          	for _, e := range edges {
          		if e[0] == 1 && rmUnion(alice, e[1], e[2]) {
          			used++
          			compsA--
          		} else if e[0] == 2 && rmUnion(bob, e[1], e[2]) {
          			used++
          			compsB--
          		}
          	}
          	if compsA != 1 || compsB != 1 {
          		return -1
          	}
          	return len(edges) - used
          }
        `,
        kotlin: code`
          fun rmFind(root: IntArray, x0: Int): Int {
              var x = x0
              while (root[x] != x) { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          fun rmUnion(root: IntArray, a: Int, b: Int): Boolean {
              val ra = rmFind(root, a)
              val rb = rmFind(root, b)
              if (ra == rb) return false
              root[ra] = rb
              return true
          }

          fun maxNumEdgesToRemove(n: Int, edges: Array<IntArray>): Int {
              val alice = IntArray(n + 1) { it }
              val bob = IntArray(n + 1) { it }
              var used = 0
              var compsA = n
              var compsB = n
              for (e in edges) {
                  if (e[0] == 3 && rmUnion(alice, e[1], e[2])) { rmUnion(bob, e[1], e[2]); used++; compsA--; compsB-- }
              }
              for (e in edges) {
                  if (e[0] == 1 && rmUnion(alice, e[1], e[2])) { used++; compsA-- }
                  else if (e[0] == 2 && rmUnion(bob, e[1], e[2])) { used++; compsB-- }
              }
              if (compsA != 1 || compsB != 1) return -1
              return edges.size - used
          }
        `,
        swift: code`
          func rmFind(_ root: inout [Int], _ x0: Int) -> Int {
              var x = x0
              while root[x] != x { root[x] = root[root[x]]; x = root[x] }
              return x
          }

          func rmUnion(_ root: inout [Int], _ a: Int, _ b: Int) -> Bool {
              let ra = rmFind(&root, a), rb = rmFind(&root, b)
              if ra == rb { return false }
              root[ra] = rb
              return true
          }

          func maxNumEdgesToRemove(_ n: Int, _ edges: [[Int]]) -> Int {
              var alice = Array(0...n), bob = Array(0...n)
              var used = 0, compsA = n, compsB = n
              for e in edges where e[0] == 3 {
                  if rmUnion(&alice, e[1], e[2]) {
                      _ = rmUnion(&bob, e[1], e[2])
                      used += 1
                      compsA -= 1
                      compsB -= 1
                  }
              }
              for e in edges {
                  if e[0] == 1 && rmUnion(&alice, e[1], e[2]) { used += 1; compsA -= 1 }
                  else if e[0] == 2 && rmUnion(&bob, e[1], e[2]) { used += 1; compsB -= 1 }
              }
              if compsA != 1 || compsB != 1 { return -1 }
              return edges.count - used
          }
        `,
        rust: code`
          fn rm_find(root: &mut Vec<usize>, x0: usize) -> usize {
              let mut x = x0;
              while root[x] != x {
                  let up = root[root[x]];
                  root[x] = up;
                  x = up;
              }
              x
          }

          fn rm_union(root: &mut Vec<usize>, a: usize, b: usize) -> bool {
              let ra = rm_find(root, a);
              let rb = rm_find(root, b);
              if ra == rb {
                  return false;
              }
              root[ra] = rb;
              true
          }

          fn maxNumEdgesToRemove(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut alice: Vec<usize> = (0..=n).collect();
              let mut bob: Vec<usize> = (0..=n).collect();
              let mut used = 0i32;
              let mut comps_a = n;
              let mut comps_b = n;
              for e in edges.iter() {
                  if e[0] == 3 && rm_union(&mut alice, e[1] as usize, e[2] as usize) {
                      rm_union(&mut bob, e[1] as usize, e[2] as usize);
                      used += 1;
                      comps_a -= 1;
                      comps_b -= 1;
                  }
              }
              for e in edges.iter() {
                  if e[0] == 1 && rm_union(&mut alice, e[1] as usize, e[2] as usize) {
                      used += 1;
                      comps_a -= 1;
                  } else if e[0] == 2 && rm_union(&mut bob, e[1] as usize, e[2] as usize) {
                      used += 1;
                      comps_b -= 1;
                  }
              }
              if comps_a != 1 || comps_b != 1 {
                  return -1;
              }
              edges.len() as i32 - used
          }
        `,
        php: code`
          function maxNumEdgesToRemove($n, $edges) {
              $alice = range(0, $n);
              $bob = range(0, $n);
              $used = 0;
              $compsA = $n;
              $compsB = $n;
              foreach ($edges as $e) {
                  if ($e[0] == 3 && rmUnion($alice, $e[1], $e[2])) { rmUnion($bob, $e[1], $e[2]); $used++; $compsA--; $compsB--; }
              }
              foreach ($edges as $e) {
                  if ($e[0] == 1 && rmUnion($alice, $e[1], $e[2])) { $used++; $compsA--; }
                  elseif ($e[0] == 2 && rmUnion($bob, $e[1], $e[2])) { $used++; $compsB--; }
              }
              if ($compsA != 1 || $compsB != 1) return -1;
              return count($edges) - $used;
          }

          function rmFind(&$root, $x) {
              while ($root[$x] != $x) { $root[$x] = $root[$root[$x]]; $x = $root[$x]; }
              return $x;
          }

          function rmUnion(&$root, $a, $b) {
              $ra = rmFind($root, $a);
              $rb = rmFind($root, $b);
              if ($ra == $rb) return false;
              $root[$ra] = $rb;
              return true;
          }
        `,
        ruby: code`
          def maxNumEdgesToRemove(n, edges)
            alice = (0..n).to_a
            bob = (0..n).to_a
            find = lambda do |root, x|
              while root[x] != x
                root[x] = root[root[x]]
                x = root[x]
              end
              x
            end
            unite = lambda do |root, a, b|
              ra = find.call(root, a)
              rb = find.call(root, b)
              return false if ra == rb
              root[ra] = rb
              true
            end
            used = 0
            comps_a = n
            comps_b = n
            edges.each do |t, u, v|
              next unless t == 3 && unite.call(alice, u, v)
              unite.call(bob, u, v)
              used += 1
              comps_a -= 1
              comps_b -= 1
            end
            edges.each do |t, u, v|
              if t == 1 && unite.call(alice, u, v)
                used += 1
                comps_a -= 1
              elsif t == 2 && unite.call(bob, u, v)
                used += 1
                comps_b -= 1
              end
            end
            return -1 if comps_a != 1 || comps_b != 1
            edges.length - used
          end
        `,
      },
    };
  })(),

];
