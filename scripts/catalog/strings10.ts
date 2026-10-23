/**
 * Strings, graphs & simulation problems — wave 7, batch 08.
 * Real problems only: LeetCode numbered problems, from the 2025 union-find
 * trio (Power Grid Maintenance, Minimum Time for K Connected Components,
 * Minimize Maximum Component Cost) to string classics such as Longest
 * Uncommon Subsequence, Repeated String Match and Longest Chunked Palindrome
 * Decomposition. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * int32: Maximum Product of the Length of Two Palindromic Substrings caps
 * `s.length` at 9 * 10^4 (LeetCode allows 10^5), so the product of two
 * disjoint lengths stays below (9 * 10^4 / 2)^2 = 2.025 * 10^9. Apply
 * Discount to Prices keeps LeetCode's ten-digit prices: the string answer is
 * built from a price times `100 - discount` in 64-bit integers (exact in a
 * JavaScript double too, below 10^12), never from a floating-point product.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** Distinct undirected pairs over 0..n-1 (or 1..n with `base` 1), shuffled. */
const randomPairs = (rng: Rng, n: number, count: number, base = 0): number[][] => {
  const all: number[][] = [];
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) all.push(rng() < 0.5 ? [u + base, v + base] : [v + base, u + base]);
  shuffle(rng, all);
  return all.slice(0, Math.min(count, all.length));
};

/** Components of an undirected graph over 0..n-1 using only the given edges. */
const componentsOf = (n: number, edges: number[][]): number => {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let comps = n;
  for (const [u, v] of edges) {
    const a = find(u), b = find(v);
    if (a !== b) { parent[a] = b; comps--; }
  }
  return comps;
};

export const STRINGS10_PROBLEMS: CatalogProblem[] = [

  // ── Power Grid Maintenance (LC 3607) ────────────────────────────
  (() => {
    const ref = (c: number, connections: number[][], queries: number[][]): number[] => {
      const adj: number[][] = Array.from({ length: c + 1 }, () => []);
      for (const [u, v] of connections) { adj[u].push(v); adj[v].push(u); }
      const online = new Array(c + 1).fill(true);
      const out: number[] = [];
      for (const [t, x] of queries) {
        if (t === 2) { online[x] = false; continue; }
        if (online[x]) { out.push(x); continue; }
        const seen = new Array(c + 1).fill(false);
        const stack = [x];
        seen[x] = true;
        let best = -1;
        while (stack.length) {
          const u = stack.pop()!;
          if (online[u] && (best === -1 || u < best)) best = u;
          for (const w of adj[u]) if (!seen[w]) { seen[w] = true; stack.push(w); }
        }
        out.push(best);
      }
      return out;
    };
    return {
      slug: "power-grid-maintenance",
      title: "Power Grid Maintenance",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Heap (Priority Queue)", "Ordered Set", "Amazon"],
      signature: {
        funcName: "processQueries",
        params: [{ name: "c", type: "int" as const }, { name: "connections", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A power network has `c` stations numbered `1` to `c`. The bidirectional cables `connections[i] = [u, v]` join station `u` to station `v`; stations that can reach each other through cables form one **power grid**. At the start every station is **online**.\n\n" +
        "Process `queries` in order:\n\n" +
        "- `[1, x]` — a maintenance check is sent to station `x`. If `x` is online, it handles the check itself and the answer is `x`. Otherwise the answer is the **smallest id** of an online station in the same power grid as `x`, or `-1` if that grid has no online station left.\n" +
        "- `[2, x]` — station `x` goes offline for good. A station that is offline still belongs to its grid: cables are never cut, so it keeps connecting the stations around it.\n\n" +
        "Return the answers to the `[1, x]` queries, in the order they were asked.",
        [
          {
            in: "c = 5, connections = [[1,2],[2,3],[4,5]], queries = [[1,2],[2,1],[1,1],[2,4],[1,4],[2,5],[1,5]]", out: "[2,2,5,-1]",
            note: "Grids are {1,2,3} and {4,5}. Station 2 is online. After 1 goes offline, its grid's smallest online station is 2. After 4 goes offline, its grid answers with 5; once 5 is offline too, the grid answers -1.",
          },
          { in: "c = 3, connections = [], queries = [[1,1],[2,1],[1,1]]", out: "[1,-1]", note: "Without cables every station is a grid of its own." },
          { in: "c = 4, connections = [[1,2],[2,3],[3,4]], queries = [[2,2],[1,3],[2,1],[1,2]]", out: "[3,3]", note: "Offline station 2 still links 1 to 3, so the grid stays {1,2,3,4}." },
        ],
        [
          "1 <= c <= 10^5",
          "0 <= connections.length <= min(10^5, c * (c - 1) / 2)",
          "connections[i].length == 2",
          "1 <= u, v <= c, u != v",
          "all connections are distinct",
          "1 <= queries.length <= 2 * 10^5",
          "queries[i].length == 2",
          "queries[i][0] is 1 or 2",
          "1 <= queries[i][1] <= c",
        ]),
      hints: [
        "Cables never disappear, so the grids are fixed from the start — only which stations are online changes.",
        "Find the grids once with union-find (or a DFS) and list each grid's stations in increasing order.",
        "A station never comes back online, so each grid only needs a pointer into its sorted list that moves forward past offline stations.",
      ],
      editorial: explain({
        idea: "The grid structure is static and stations only ever switch off, so each grid's answer is the first online entry of its sorted member list — a pointer that only moves forward finds it in amortised constant time.",
        steps: [
          "Union every cable's endpoints in a disjoint-set forest, then record `root[s]` for every station.",
          "Walk the stations `1..c` in increasing order and append each to its root's list; every list comes out sorted.",
          "Keep `ptr[root]`, initially 0, and an `online` flag per station.",
          "For `[2, x]`, clear `online[x]`.",
          "For `[1, x]`: if `x` is online answer `x`; otherwise advance `ptr[root[x]]` past offline stations and answer the station it rests on, or `-1` if it ran off the end.",
        ],
        why: "An offline station never returns, so a station the pointer skipped can never be the answer again; the first online station in a sorted list is exactly the smallest online id in that grid.",
        time: "O((c + n) α(c) + q) — every pointer moves at most `c` steps in total",
        space: "O(c)",
        pitfalls: [
          "Going offline does not split a grid — do not remove the station's cables.",
          "Answer `x` itself whenever it is online, even if a smaller online station exists in its grid.",
          "A `[2, x]` on a station that is already offline changes nothing.",
        ],
      }),
      examples: [
        { input: "5\n[[1,2],[2,3],[4,5]]\n[[1,2],[2,1],[1,1],[2,4],[1,4],[2,5],[1,5]]", expectedOutput: "[2,2,5,-1]" },
        { input: "3\n[]\n[[1,1],[2,1],[1,1]]", expectedOutput: "[1,-1]" },
        { input: "4\n[[1,2],[2,3],[3,4]]\n[[2,2],[1,3],[2,1],[1,2]]", expectedOutput: "[3,3]" },
      ],
      gen: (rng: Rng) => {
        const c = ri(rng, 1, pick(rng, [1, 3, 8, 20, 30]));
        const maxPairs = (c * (c - 1)) / 2;
        const connections = randomPairs(rng, c, ri(rng, 0, Math.min(maxPairs, pick(rng, [0, 3, c, 2 * c]))), 1);
        const q = ri(rng, 1, pick(rng, [3, 15, 40]));
        const pTwo = pick(rng, [0.2, 0.4, 0.6]);
        const queries: number[][] = [];
        for (let i = 0; i < q; i++) queries.push([rng() < pTwo ? 2 : 1, ri(rng, 1, c)]);
        return { input: `${c}\n${fmtIntMat(connections)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(c, connections, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def processQueries(c: int, connections: List[List[int]], queries: List[List[int]]) -> List[int]:
              parent = list(range(c + 1))

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              for u, v in connections:
                  a, b = find(u), find(v)
                  if a != b:
                      parent[a] = b
              root = [find(s) for s in range(c + 1)]
              members = [[] for _ in range(c + 1)]
              for s in range(1, c + 1):
                  members[root[s]].append(s)  # increasing ids, so each list is sorted
              ptr = [0] * (c + 1)
              online = [True] * (c + 1)
              res = []
              for t, x in queries:
                  if t == 2:
                      online[x] = False
                  elif online[x]:
                      res.append(x)
                  else:
                      r = root[x]
                      lst = members[r]
                      p = ptr[r]
                      while p < len(lst) and not online[lst[p]]:
                          p += 1
                      ptr[r] = p
                      res.append(lst[p] if p < len(lst) else -1)
              return res
        `,
        javascript: code`
          var processQueries = function(c, connections, queries) {
              var parent = [];
              for (var i = 0; i <= c; i++) parent.push(i);
              var find = function(x) {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              for (var e = 0; e < connections.length; e++) {
                  var a = find(connections[e][0]), b = find(connections[e][1]);
                  if (a !== b) parent[a] = b;
              }
              var root = [], members = [], ptr = [], online = [];
              for (var s = 0; s <= c; s++) {
                  root.push(find(s));
                  members.push([]);
                  ptr.push(0);
                  online.push(true);
              }
              for (var st = 1; st <= c; st++) members[root[st]].push(st);
              var res = [];
              for (var q = 0; q < queries.length; q++) {
                  var t = queries[q][0], x = queries[q][1];
                  if (t === 2) { online[x] = false; continue; }
                  if (online[x]) { res.push(x); continue; }
                  var r = root[x], list = members[r], p = ptr[r];
                  while (p < list.length && !online[list[p]]) p++;
                  ptr[r] = p;
                  res.push(p < list.length ? list[p] : -1);
              }
              return res;
          };
        `,
        typescript: code`
          function processQueries(c: number, connections: number[][], queries: number[][]): number[] {
              var parent: number[] = [];
              for (var i = 0; i <= c; i++) parent.push(i);
              var find = function(x: number): number {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              for (var e = 0; e < connections.length; e++) {
                  var a = find(connections[e][0]), b = find(connections[e][1]);
                  if (a !== b) parent[a] = b;
              }
              var root: number[] = [], members: number[][] = [], ptr: number[] = [], online: boolean[] = [];
              for (var s = 0; s <= c; s++) {
                  root.push(find(s));
                  members.push([]);
                  ptr.push(0);
                  online.push(true);
              }
              for (var st = 1; st <= c; st++) members[root[st]].push(st);
              var res: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var t = queries[q][0], x = queries[q][1];
                  if (t === 2) { online[x] = false; continue; }
                  if (online[x]) { res.push(x); continue; }
                  var r = root[x], list = members[r], p = ptr[r];
                  while (p < list.length && !online[list[p]]) p++;
                  ptr[r] = p;
                  res.push(p < list.length ? list[p] : -1);
              }
              return res;
          }
        `,
        java: code`
          static int pgFind(int[] parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int[] processQueries(int c, int[][] connections, int[][] queries) {
              int[] parent = new int[c + 1];
              for (int i = 0; i <= c; i++) parent[i] = i;
              for (int[] e : connections) {
                  int a = pgFind(parent, e[0]), b = pgFind(parent, e[1]);
                  if (a != b) parent[a] = b;
              }
              int[] root = new int[c + 1];
              List<List<Integer>> members = new ArrayList<>();
              for (int s = 0; s <= c; s++) {
                  root[s] = pgFind(parent, s);
                  members.add(new ArrayList<>());
              }
              for (int s = 1; s <= c; s++) members.get(root[s]).add(s);
              int[] ptr = new int[c + 1];
              boolean[] offline = new boolean[c + 1];
              List<Integer> res = new ArrayList<>();
              for (int[] q : queries) {
                  int x = q[1];
                  if (q[0] == 2) { offline[x] = true; continue; }
                  if (!offline[x]) { res.add(x); continue; }
                  int r = root[x];
                  List<Integer> list = members.get(r);
                  int p = ptr[r];
                  while (p < list.size() && offline[list.get(p)]) p++;
                  ptr[r] = p;
                  res.add(p < list.size() ? list.get(p) : -1);
              }
              int[] out = new int[res.size()];
              for (int i = 0; i < out.length; i++) out[i] = res.get(i);
              return out;
          }
        `,
        cpp: code`
          static int pgFind(vector<int>& parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          vector<int> processQueries(int c, vector<vector<int>>& connections, vector<vector<int>>& queries) {
              vector<int> parent(c + 1);
              for (int i = 0; i <= c; i++) parent[i] = i;
              for (auto& e : connections) {
                  int a = pgFind(parent, e[0]), b = pgFind(parent, e[1]);
                  if (a != b) parent[a] = b;
              }
              vector<int> root(c + 1);
              vector<vector<int>> members(c + 1);
              for (int s = 0; s <= c; s++) root[s] = pgFind(parent, s);
              for (int s = 1; s <= c; s++) members[root[s]].push_back(s);
              vector<int> ptr(c + 1, 0);
              vector<bool> offline(c + 1, false);
              vector<int> res;
              for (auto& q : queries) {
                  int x = q[1];
                  if (q[0] == 2) { offline[x] = true; continue; }
                  if (!offline[x]) { res.push_back(x); continue; }
                  int r = root[x];
                  vector<int>& list = members[r];
                  int p = ptr[r];
                  while (p < (int) list.size() && offline[list[p]]) p++;
                  ptr[r] = p;
                  res.push_back(p < (int) list.size() ? list[p] : -1);
              }
              return res;
          }
        `,
        c: code`
          static int pgFind(int* parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          int* processQueries(int c, int** connections, int connectionsSize, int* connectionsColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* parent = (int*) malloc((size_t) (c + 1) * sizeof(int));
              for (int i = 0; i <= c; i++) parent[i] = i;
              for (int e = 0; e < connectionsSize; e++) {
                  int a = pgFind(parent, connections[e][0]), b = pgFind(parent, connections[e][1]);
                  if (a != b) parent[a] = b;
              }
              // Members of each grid laid out contiguously, grid r in order[start[r] .. start[r + 1]).
              int* root = (int*) malloc((size_t) (c + 1) * sizeof(int));
              int* start = (int*) calloc((size_t) (c + 2), sizeof(int));
              for (int s = 1; s <= c; s++) {
                  root[s] = pgFind(parent, s);
                  start[root[s] + 1]++;
              }
              for (int r = 0; r <= c; r++) start[r + 1] += start[r];
              int* ptr = (int*) malloc((size_t) (c + 1) * sizeof(int));
              for (int r = 0; r <= c; r++) ptr[r] = start[r];
              int* order = (int*) malloc((size_t) (c + 1) * sizeof(int));
              for (int s = 1; s <= c; s++) order[ptr[root[s]]++] = s;
              for (int r = 0; r <= c; r++) ptr[r] = start[r];
              char* offline = (char*) calloc((size_t) (c + 1), 1);
              int* res = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              int n = 0;
              for (int q = 0; q < queriesSize; q++) {
                  int x = queries[q][1];
                  if (queries[q][0] == 2) { offline[x] = 1; continue; }
                  if (!offline[x]) { res[n++] = x; continue; }
                  int r = root[x], p = ptr[r], end = start[r + 1];
                  while (p < end && offline[order[p]]) p++;
                  ptr[r] = p;
                  res[n++] = p < end ? order[p] : -1;
              }
              free(parent); free(root); free(start); free(ptr); free(order); free(offline);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          static int PgFind(int[] parent, int x)
          {
              while (parent[x] != x)
              {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int[] ProcessQueries(int c, int[][] connections, int[][] queries)
          {
              var parent = new int[c + 1];
              for (int i = 0; i <= c; i++) parent[i] = i;
              foreach (var e in connections)
              {
                  int a = PgFind(parent, e[0]), b = PgFind(parent, e[1]);
                  if (a != b) parent[a] = b;
              }
              var root = new int[c + 1];
              var members = new List<int>[c + 1];
              for (int s = 0; s <= c; s++)
              {
                  root[s] = PgFind(parent, s);
                  members[s] = new List<int>();
              }
              for (int s = 1; s <= c; s++) members[root[s]].Add(s);
              var ptr = new int[c + 1];
              var offline = new bool[c + 1];
              var res = new List<int>();
              foreach (var q in queries)
              {
                  int x = q[1];
                  if (q[0] == 2) { offline[x] = true; continue; }
                  if (!offline[x]) { res.Add(x); continue; }
                  int r = root[x];
                  var list = members[r];
                  int p = ptr[r];
                  while (p < list.Count && offline[list[p]]) p++;
                  ptr[r] = p;
                  res.Add(p < list.Count ? list[p] : -1);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func pgFind(parent []int, x int) int {
              for parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func processQueries(c int, connections [][]int, queries [][]int) []int {
              parent := make([]int, c+1)
              for i := range parent {
                  parent[i] = i
              }
              for _, e := range connections {
                  a, b := pgFind(parent, e[0]), pgFind(parent, e[1])
                  if a != b {
                      parent[a] = b
                  }
              }
              root := make([]int, c+1)
              members := make([][]int, c+1)
              for s := 0; s <= c; s++ {
                  root[s] = pgFind(parent, s)
              }
              for s := 1; s <= c; s++ {
                  members[root[s]] = append(members[root[s]], s)
              }
              ptr := make([]int, c+1)
              offline := make([]bool, c+1)
              res := []int{}
              for _, q := range queries {
                  x := q[1]
                  if q[0] == 2 {
                      offline[x] = true
                      continue
                  }
                  if !offline[x] {
                      res = append(res, x)
                      continue
                  }
                  r := root[x]
                  list := members[r]
                  p := ptr[r]
                  for p < len(list) && offline[list[p]] {
                      p++
                  }
                  ptr[r] = p
                  if p < len(list) {
                      res = append(res, list[p])
                  } else {
                      res = append(res, -1)
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun pgFind(parent: IntArray, start: Int): Int {
              var x = start
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          fun processQueries(c: Int, connections: Array<IntArray>, queries: Array<IntArray>): IntArray {
              val parent = IntArray(c + 1) { it }
              for (e in connections) {
                  val a = pgFind(parent, e[0])
                  val b = pgFind(parent, e[1])
                  if (a != b) parent[a] = b
              }
              val root = IntArray(c + 1) { pgFind(parent, it) }
              val members = Array(c + 1) { ArrayList<Int>() }
              for (s in 1..c) members[root[s]].add(s)
              val ptr = IntArray(c + 1)
              val offline = BooleanArray(c + 1)
              val res = ArrayList<Int>()
              for (q in queries) {
                  val x = q[1]
                  if (q[0] == 2) { offline[x] = true; continue }
                  if (!offline[x]) { res.add(x); continue }
                  val r = root[x]
                  val list = members[r]
                  var p = ptr[r]
                  while (p < list.size && offline[list[p]]) p++
                  ptr[r] = p
                  res.add(if (p < list.size) list[p] else -1)
              }
              return res.toIntArray()
          }
        `,
        swift: code`
          func pgFind(_ parent: inout [Int], _ start: Int) -> Int {
              var x = start
              while parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func processQueries(_ c: Int, _ connections: [[Int]], _ queries: [[Int]]) -> [Int] {
              var parent = Array(0...c)
              for e in connections {
                  let a = pgFind(&parent, e[0]), b = pgFind(&parent, e[1])
                  if a != b { parent[a] = b }
              }
              var root = [Int](repeating: 0, count: c + 1)
              for s in 0...c { root[s] = pgFind(&parent, s) }
              var members = [[Int]](repeating: [], count: c + 1)
              if c >= 1 {
                  for s in 1...c { members[root[s]].append(s) }
              }
              var ptr = [Int](repeating: 0, count: c + 1)
              var offline = [Bool](repeating: false, count: c + 1)
              var res: [Int] = []
              for q in queries {
                  let x = q[1]
                  if q[0] == 2 { offline[x] = true; continue }
                  if !offline[x] { res.append(x); continue }
                  let r = root[x]
                  var p = ptr[r]
                  while p < members[r].count && offline[members[r][p]] { p += 1 }
                  ptr[r] = p
                  res.append(p < members[r].count ? members[r][p] : -1)
              }
              return res
          }
        `,
        rust: code`
          fn pg_find(parent: &mut Vec<usize>, mut x: usize) -> usize {
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn processQueries(c: i32, connections: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let c = c as usize;
              let mut parent: Vec<usize> = (0..=c).collect();
              for e in connections.iter() {
                  let a = pg_find(&mut parent, e[0] as usize);
                  let b = pg_find(&mut parent, e[1] as usize);
                  if a != b {
                      parent[a] = b;
                  }
              }
              let mut root = vec![0usize; c + 1];
              for s in 0..=c {
                  root[s] = pg_find(&mut parent, s);
              }
              let mut members: Vec<Vec<usize>> = vec![Vec::new(); c + 1];
              for s in 1..=c {
                  members[root[s]].push(s);
              }
              let mut ptr = vec![0usize; c + 1];
              let mut offline = vec![false; c + 1];
              let mut res: Vec<i32> = Vec::new();
              for q in queries.iter() {
                  let x = q[1] as usize;
                  if q[0] == 2 {
                      offline[x] = true;
                      continue;
                  }
                  if !offline[x] {
                      res.push(x as i32);
                      continue;
                  }
                  let r = root[x];
                  let list = &members[r];
                  let mut p = ptr[r];
                  while p < list.len() && offline[list[p]] {
                      p += 1;
                  }
                  ptr[r] = p;
                  res.push(if p < list.len() { list[p] as i32 } else { -1 });
              }
              res
          }
        `,
        php: code`
          function pgFind(&$parent, $x) {
              while ($parent[$x] != $x) {
                  $parent[$x] = $parent[$parent[$x]];
                  $x = $parent[$x];
              }
              return $x;
          }

          function processQueries($c, $connections, $queries) {
              $parent = range(0, $c);
              foreach ($connections as $e) {
                  $a = pgFind($parent, $e[0]);
                  $b = pgFind($parent, $e[1]);
                  if ($a != $b) $parent[$a] = $b;
              }
              $root = [];
              $members = [];
              for ($s = 0; $s <= $c; $s++) {
                  $root[$s] = pgFind($parent, $s);
                  $members[$s] = [];
              }
              for ($s = 1; $s <= $c; $s++) $members[$root[$s]][] = $s;
              $ptr = array_fill(0, $c + 1, 0);
              $offline = array_fill(0, $c + 1, false);
              $res = [];
              foreach ($queries as $q) {
                  $x = $q[1];
                  if ($q[0] == 2) { $offline[$x] = true; continue; }
                  if (!$offline[$x]) { $res[] = $x; continue; }
                  $r = $root[$x];
                  $len = count($members[$r]);
                  $p = $ptr[$r];
                  while ($p < $len && $offline[$members[$r][$p]]) $p++;
                  $ptr[$r] = $p;
                  $res[] = $p < $len ? $members[$r][$p] : -1;
              }
              return $res;
          }
        `,
        ruby: code`
          def pg_find(parent, x)
            while parent[x] != x
              parent[x] = parent[parent[x]]
              x = parent[x]
            end
            x
          end

          def processQueries(c, connections, queries)
            parent = (0..c).to_a
            connections.each do |u, v|
              a = pg_find(parent, u)
              b = pg_find(parent, v)
              parent[a] = b if a != b
            end
            root = (0..c).map { |s| pg_find(parent, s) }
            members = Array.new(c + 1) { [] }
            (1..c).each { |s| members[root[s]] << s }
            ptr = Array.new(c + 1, 0)
            offline = Array.new(c + 1, false)
            res = []
            queries.each do |t, x|
              if t == 2
                offline[x] = true
              elsif !offline[x]
                res << x
              else
                r = root[x]
                list = members[r]
                p = ptr[r]
                p += 1 while p < list.length && offline[list[p]]
                ptr[r] = p
                res << (p < list.length ? list[p] : -1)
              end
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Minimum Time for K Connected Components (LC 3608) ───────────
  (() => {
    const ref = (n: number, edges: number[][], k: number): number => {
      const cands = [0, ...Array.from(new Set(edges.map((e) => e[2]))).sort((a, b) => a - b)];
      for (const t of cands) if (componentsOf(n, edges.filter((e) => e[2] > t)) >= k) return t;
      return -1;
    };
    return {
      slug: "minimum-time-for-k-connected-components",
      title: "Minimum Time for K Connected Components",
      difficulty: "MEDIUM" as const,
      tags: ["Binary Search", "Union Find", "Graph", "Sorting", "Google"],
      signature: {
        funcName: "minTime",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected graph has `n` nodes labelled `0` to `n - 1`. Each `edges[i] = [u, v, time]` is an edge between `u` and `v` that **disappears** at moment `time`: once the clock reads `t`, every edge with `time <= t` is gone.\n\n" +
        "Return the **smallest** integer `t >= 0` such that, after removing every edge with `time <= t`, the graph has **at least** `k` connected components.",
        [
          {
            in: "n = 4, edges = [[0,1,3],[1,2,7],[2,3,5]], k = 2", out: "3",
            note: "At t = 3 only the edges timed 7 and 5 remain: components {0} and {1,2,3}. At any t < 3 all three edges survive and the graph is one component.",
          },
          { in: "n = 3, edges = [[0,1,2],[1,2,4]], k = 3", out: "4", note: "Three components need every edge gone, which first happens at t = 4." },
          { in: "n = 3, edges = [[0,2,5]], k = 2", out: "0", note: "Node 1 is already alone, so there are two components at t = 0." },
        ],
        [
          "1 <= n <= 10^5",
          "0 <= edges.length <= 10^5",
          "edges[i] = [u, v, time]",
          "0 <= u, v < n, u != v",
          "1 <= time <= 10^9",
          "1 <= k <= n",
          "there are no duplicate edges",
        ]),
      hints: [
        "The number of components only grows as `t` grows, so the answer is monotone — binary search over `t` would work.",
        "Look at it backwards: start from an empty graph and add edges from the latest-disappearing to the earliest.",
        "With union-find, the first edge whose union would leave fewer than `k` components cannot survive — its `time` is the answer. If no such edge exists, the answer is `0`.",
      ],
      editorial: explain({
        idea: "Removing edges with `time <= t` keeps exactly the edges with `time > t`. Adding edges in decreasing order of time builds those graphs from large `t` down to small, and union-find counts components as we go.",
        steps: [
          "Sort the edges by `time`, largest first.",
          "Start with `n` singleton components.",
          "For each edge `[u, v, time]`: if `u` and `v` are already joined, skip it. Otherwise, if merging would leave `components - 1 < k`, return `time`. Else merge and decrement the count.",
          "If every edge was added without dropping below `k`, return `0`.",
        ],
        why: "When the loop returns `time = T`, every edge with a larger time is already in and the graph still has at least `k` components, so `t = T` (which removes this edge and everything not later) works. Any `t < T` keeps this edge as well, and the edges already added, so the components fall below `k` — merging only lowers the count further.",
        time: "O(m log m + m α(n))",
        space: "O(n + m)",
        pitfalls: [
          "Edges with the same time disappear together; returning that shared time is still correct because the answer is the edge's time, not one less.",
          "The answer can be `0` — when the graph already has `k` or more components.",
          "An edge between two nodes already connected never changes the count, so it must not trigger a return.",
        ],
      }),
      examples: [
        { input: "4\n[[0,1,3],[1,2,7],[2,3,5]]\n2", expectedOutput: "3" },
        { input: "3\n[[0,1,2],[1,2,4]]\n3", expectedOutput: "4" },
        { input: "3\n[[0,2,5]]\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 10, 20, 30]));
        const maxPairs = (n * (n - 1)) / 2;
        const top = pick(rng, [3, 10, 1000000000]);
        const edges = randomPairs(rng, n, ri(rng, 0, Math.min(maxPairs, pick(rng, [n, 2 * n, 40])))).map((e) => [e[0], e[1], ri(rng, 1, top)]);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${fmtIntMat(edges)}\n${k}`, expectedOutput: String(ref(n, edges, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minTime(n: int, edges: List[List[int]], k: int) -> int:
              parent = list(range(n))

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              comps = n
              for u, v, t in sorted(edges, key=lambda e: -e[2]):
                  a, b = find(u), find(v)
                  if a == b:
                      continue
                  if comps - 1 < k:
                      return t
                  parent[a] = b
                  comps -= 1
              return 0
        `,
        javascript: code`
          var minTime = function(n, edges, k) {
              var parent = [];
              for (var i = 0; i < n; i++) parent.push(i);
              var find = function(x) {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              var sorted = edges.slice().sort(function(p, q) { return q[2] - p[2]; });
              var comps = n;
              for (var e = 0; e < sorted.length; e++) {
                  var a = find(sorted[e][0]), b = find(sorted[e][1]);
                  if (a === b) continue;
                  if (comps - 1 < k) return sorted[e][2];
                  parent[a] = b;
                  comps--;
              }
              return 0;
          };
        `,
        typescript: code`
          function minTime(n: number, edges: number[][], k: number): number {
              var parent: number[] = [];
              for (var i = 0; i < n; i++) parent.push(i);
              var find = function(x: number): number {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              var sorted = edges.slice().sort(function(p, q) { return q[2] - p[2]; });
              var comps = n;
              for (var e = 0; e < sorted.length; e++) {
                  var a = find(sorted[e][0]), b = find(sorted[e][1]);
                  if (a === b) continue;
                  if (comps - 1 < k) return sorted[e][2];
                  parent[a] = b;
                  comps--;
              }
              return 0;
          }
        `,
        java: code`
          static int mtFind(int[] parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int minTime(int n, int[][] edges, int k) {
              int[] parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              int[][] sorted = edges.clone();
              Arrays.sort(sorted, (p, q) -> Integer.compare(q[2], p[2]));
              int comps = n;
              for (int[] e : sorted) {
                  int a = mtFind(parent, e[0]), b = mtFind(parent, e[1]);
                  if (a == b) continue;
                  if (comps - 1 < k) return e[2];
                  parent[a] = b;
                  comps--;
              }
              return 0;
          }
        `,
        cpp: code`
          static int mtFind(vector<int>& parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          int minTime(int n, vector<vector<int>>& edges, int k) {
              vector<int> parent(n);
              for (int i = 0; i < n; i++) parent[i] = i;
              vector<vector<int>> sorted = edges;
              sort(sorted.begin(), sorted.end(), [](const vector<int>& p, const vector<int>& q) { return p[2] > q[2]; });
              int comps = n;
              for (auto& e : sorted) {
                  int a = mtFind(parent, e[0]), b = mtFind(parent, e[1]);
                  if (a == b) continue;
                  if (comps - 1 < k) return e[2];
                  parent[a] = b;
                  comps--;
              }
              return 0;
          }
        `,
        c: code`
          static int mtFind(int* parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          static int mtByTimeDesc(const void* p, const void* q) {
              int a = (*(int* const*) p)[2], b = (*(int* const*) q)[2];
              return (a < b) - (a > b);
          }

          int minTime(int n, int** edges, int edgesSize, int* edgesColSize, int k) {
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) parent[i] = i;
              int** sorted = (int**) malloc((size_t) (edgesSize + 1) * sizeof(int*));
              for (int i = 0; i < edgesSize; i++) sorted[i] = edges[i];
              qsort(sorted, (size_t) edgesSize, sizeof(int*), mtByTimeDesc);
              int comps = n, answer = 0;
              for (int i = 0; i < edgesSize; i++) {
                  int a = mtFind(parent, sorted[i][0]), b = mtFind(parent, sorted[i][1]);
                  if (a == b) continue;
                  if (comps - 1 < k) { answer = sorted[i][2]; break; }
                  parent[a] = b;
                  comps--;
              }
              free(parent);
              free(sorted);
              return answer;
          }
        `,
        csharp: code`
          static int MtFind(int[] parent, int x)
          {
              while (parent[x] != x)
              {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int MinTime(int n, int[][] edges, int k)
          {
              var parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              var sorted = (int[][]) edges.Clone();
              Array.Sort(sorted, (p, q) => q[2].CompareTo(p[2]));
              int comps = n;
              foreach (var e in sorted)
              {
                  int a = MtFind(parent, e[0]), b = MtFind(parent, e[1]);
                  if (a == b) continue;
                  if (comps - 1 < k) return e[2];
                  parent[a] = b;
                  comps--;
              }
              return 0;
          }
        `,
        go: code`
          func mtFind(parent []int, x int) int {
              for parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func minTime(n int, edges [][]int, k int) int {
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = i
              }
              sorted := make([][]int, len(edges))
              copy(sorted, edges)
              sort.Slice(sorted, func(i, j int) bool { return sorted[i][2] > sorted[j][2] })
              comps := n
              for _, e := range sorted {
                  a, b := mtFind(parent, e[0]), mtFind(parent, e[1])
                  if a == b {
                      continue
                  }
                  if comps-1 < k {
                      return e[2]
                  }
                  parent[a] = b
                  comps--
              }
              return 0
          }
        `,
        kotlin: code`
          fun mtFind(parent: IntArray, start: Int): Int {
              var x = start
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          fun minTime(n: Int, edges: Array<IntArray>, k: Int): Int {
              val parent = IntArray(n) { it }
              val sorted = edges.sortedByDescending { it[2] }
              var comps = n
              for (e in sorted) {
                  val a = mtFind(parent, e[0])
                  val b = mtFind(parent, e[1])
                  if (a == b) continue
                  if (comps - 1 < k) return e[2]
                  parent[a] = b
                  comps--
              }
              return 0
          }
        `,
        swift: code`
          func mtFind(_ parent: inout [Int], _ start: Int) -> Int {
              var x = start
              while parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func minTime(_ n: Int, _ edges: [[Int]], _ k: Int) -> Int {
              var parent = Array(0..<n)
              let sorted = edges.sorted { $0[2] > $1[2] }
              var comps = n
              for e in sorted {
                  let a = mtFind(&parent, e[0]), b = mtFind(&parent, e[1])
                  if a == b { continue }
                  if comps - 1 < k { return e[2] }
                  parent[a] = b
                  comps -= 1
              }
              return 0
          }
        `,
        rust: code`
          fn mt_find(parent: &mut Vec<usize>, mut x: usize) -> usize {
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn minTime(n: i32, edges: Vec<Vec<i32>>, k: i32) -> i32 {
              let mut parent: Vec<usize> = (0..n as usize).collect();
              let mut sorted = edges.clone();
              sorted.sort_by(|p, q| q[2].cmp(&p[2]));
              let mut comps = n;
              for e in sorted.iter() {
                  let a = mt_find(&mut parent, e[0] as usize);
                  let b = mt_find(&mut parent, e[1] as usize);
                  if a == b {
                      continue;
                  }
                  if comps - 1 < k {
                      return e[2];
                  }
                  parent[a] = b;
                  comps -= 1;
              }
              0
          }
        `,
        php: code`
          function mtFind(&$parent, $x) {
              while ($parent[$x] != $x) {
                  $parent[$x] = $parent[$parent[$x]];
                  $x = $parent[$x];
              }
              return $x;
          }

          function minTime($n, $edges, $k) {
              $parent = range(0, max(0, $n - 1));
              usort($edges, function ($p, $q) { return $q[2] <=> $p[2]; });
              $comps = $n;
              foreach ($edges as $e) {
                  $a = mtFind($parent, $e[0]);
                  $b = mtFind($parent, $e[1]);
                  if ($a == $b) continue;
                  if ($comps - 1 < $k) return $e[2];
                  $parent[$a] = $b;
                  $comps--;
              }
              return 0;
          }
        `,
        ruby: code`
          def mt_find(parent, x)
            while parent[x] != x
              parent[x] = parent[parent[x]]
              x = parent[x]
            end
            x
          end

          def minTime(n, edges, k)
            parent = (0...n).to_a
            comps = n
            edges.sort_by { |e| -e[2] }.each do |u, v, t|
              a = mt_find(parent, u)
              b = mt_find(parent, v)
              next if a == b
              return t if comps - 1 < k
              parent[a] = b
              comps -= 1
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Minimize Maximum Component Cost (LC 3613) ───────────────────
  (() => {
    const ref = (n: number, edges: number[][], k: number): number => {
      const cands = [0, ...Array.from(new Set(edges.map((e) => e[2]))).sort((a, b) => a - b)];
      for (const t of cands) if (componentsOf(n, edges.filter((e) => e[2] <= t)) <= k) return t;
      return -1;
    };
    return {
      slug: "minimize-maximum-component-cost",
      title: "Minimize Maximum Component Cost",
      difficulty: "MEDIUM" as const,
      tags: ["Binary Search", "Union Find", "Graph", "Sorting", "Minimum Spanning Tree", "Amazon"],
      signature: {
        funcName: "minCost",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A **connected** undirected graph has `n` nodes labelled `0` to `n - 1`; each `edges[i] = [u, v, w]` joins `u` and `v` with weight `w`.\n\n" +
        "You may delete any number of edges (possibly none), as long as the graph that remains has **at most** `k` connected components. The **cost** of a component is the largest edge weight inside it, or `0` if it has no edges.\n\n" +
        "Return the **minimum** possible value of the largest component cost after your deletions.",
        [
          {
            in: "n = 5, edges = [[0,1,4],[1,2,3],[1,3,2],[3,4,6]], k = 2", out: "4",
            note: "Delete the edge of weight 6: components {0,1,2,3} (cost 4) and {4} (cost 0). Keeping only edges of weight below 4 leaves three components, too many.",
          },
          { in: "n = 4, edges = [[0,1,5],[1,2,5],[2,3,5]], k = 1", out: "5", note: "One component needs every node joined, and every edge weighs 5." },
          { in: "n = 3, edges = [[0,1,9],[1,2,1]], k = 3", out: "0", note: "Three components are allowed, so every edge can go." },
        ],
        [
          "1 <= n <= 5 * 10^4",
          "0 <= edges.length <= 10^5",
          "edges[i] = [u, v, w]",
          "0 <= u, v < n, u != v",
          "0 <= w <= 10^6",
          "1 <= k <= n",
          "the input graph is connected",
        ]),
      hints: [
        "Fix a limit `L` and keep every edge of weight at most `L`: the largest component cost is then at most `L`, and keeping more edges only merges components.",
        "So the question is the smallest `L` for which the edges of weight `<= L` leave at most `k` components.",
        "Kruskal's algorithm answers it directly: add edges in increasing weight and stop the moment the component count reaches `k`.",
      ],
      editorial: explain({
        idea: "This is a minimum spanning forest cut short: adding edges cheapest-first with union-find, the weight of the edge that brings the count down to `k` components is the smallest possible maximum.",
        steps: [
          "If `n <= k`, delete everything and return `0`.",
          "Sort the edges by weight, smallest first, and start with `n` components.",
          "For each edge that joins two different components, merge them and decrement the count; when it reaches `k`, return that edge's weight.",
        ],
        why: "For any limit `L`, keeping all edges of weight `<= L` is the best you can do with that limit — dropping some only splits components. The component count with that edge set is the count Kruskal reaches after processing every edge of weight `<= L`, and it first hits `k` exactly at the returned weight; any smaller limit leaves more than `k` components.",
        time: "O(m log m + m α(n))",
        space: "O(n + m)",
        pitfalls: [
          "Return `0` when `k >= n` — no edge is needed at all.",
          "Edges that close a cycle do not reduce the count and must not end the loop.",
          "The answer is the weight of the last *useful* edge, not the largest weight seen so far among skipped ones.",
        ],
      }),
      examples: [
        { input: "5\n[[0,1,4],[1,2,3],[1,3,2],[3,4,6]]\n2", expectedOutput: "4" },
        { input: "4\n[[0,1,5],[1,2,5],[2,3,5]]\n1", expectedOutput: "5" },
        { input: "3\n[[0,1,9],[1,2,1]]\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 20, 30]));
        const top = pick(rng, [0, 5, 20, 1000000]);
        const used = new Set<string>();
        const edges: number[][] = [];
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        for (let i = 1; i < n; i++) {
          const u = order[i], v = order[ri(rng, 0, i - 1)];
          used.add(`${Math.min(u, v)},${Math.max(u, v)}`);
          edges.push([u, v, ri(rng, 0, top)]);
        }
        const extra = ri(rng, 0, pick(rng, [0, n, 2 * n]));
        for (const [u, v] of randomPairs(rng, n, extra)) {
          const key = `${Math.min(u, v)},${Math.max(u, v)}`;
          if (used.has(key)) continue;
          used.add(key);
          edges.push([u, v, ri(rng, 0, top)]);
        }
        shuffle(rng, edges);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${fmtIntMat(edges)}\n${k}`, expectedOutput: String(ref(n, edges, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minCost(n: int, edges: List[List[int]], k: int) -> int:
              if n <= k:
                  return 0
              parent = list(range(n))

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              comps = n
              for u, v, w in sorted(edges, key=lambda e: e[2]):
                  a, b = find(u), find(v)
                  if a == b:
                      continue
                  parent[a] = b
                  comps -= 1
                  if comps <= k:
                      return w
              return 0
        `,
        javascript: code`
          var minCost = function(n, edges, k) {
              if (n <= k) return 0;
              var parent = [];
              for (var i = 0; i < n; i++) parent.push(i);
              var find = function(x) {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              var sorted = edges.slice().sort(function(p, q) { return p[2] - q[2]; });
              var comps = n;
              for (var e = 0; e < sorted.length; e++) {
                  var a = find(sorted[e][0]), b = find(sorted[e][1]);
                  if (a === b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) return sorted[e][2];
              }
              return 0;
          };
        `,
        typescript: code`
          function minCost(n: number, edges: number[][], k: number): number {
              if (n <= k) return 0;
              var parent: number[] = [];
              for (var i = 0; i < n; i++) parent.push(i);
              var find = function(x: number): number {
                  while (parent[x] !== x) {
                      parent[x] = parent[parent[x]];
                      x = parent[x];
                  }
                  return x;
              };
              var sorted = edges.slice().sort(function(p, q) { return p[2] - q[2]; });
              var comps = n;
              for (var e = 0; e < sorted.length; e++) {
                  var a = find(sorted[e][0]), b = find(sorted[e][1]);
                  if (a === b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) return sorted[e][2];
              }
              return 0;
          }
        `,
        java: code`
          static int mcFind(int[] parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int minCost(int n, int[][] edges, int k) {
              if (n <= k) return 0;
              int[] parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              int[][] sorted = edges.clone();
              Arrays.sort(sorted, (p, q) -> Integer.compare(p[2], q[2]));
              int comps = n;
              for (int[] e : sorted) {
                  int a = mcFind(parent, e[0]), b = mcFind(parent, e[1]);
                  if (a == b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) return e[2];
              }
              return 0;
          }
        `,
        cpp: code`
          static int mcFind(vector<int>& parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          int minCost(int n, vector<vector<int>>& edges, int k) {
              if (n <= k) return 0;
              vector<int> parent(n);
              for (int i = 0; i < n; i++) parent[i] = i;
              vector<vector<int>> sorted = edges;
              sort(sorted.begin(), sorted.end(), [](const vector<int>& p, const vector<int>& q) { return p[2] < q[2]; });
              int comps = n;
              for (auto& e : sorted) {
                  int a = mcFind(parent, e[0]), b = mcFind(parent, e[1]);
                  if (a == b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) return e[2];
              }
              return 0;
          }
        `,
        c: code`
          static int mcFind(int* parent, int x) {
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          static int mcByWeight(const void* p, const void* q) {
              int a = (*(int* const*) p)[2], b = (*(int* const*) q)[2];
              return (a > b) - (a < b);
          }

          int minCost(int n, int** edges, int edgesSize, int* edgesColSize, int k) {
              if (n <= k) return 0;
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) parent[i] = i;
              int** sorted = (int**) malloc((size_t) (edgesSize + 1) * sizeof(int*));
              for (int i = 0; i < edgesSize; i++) sorted[i] = edges[i];
              qsort(sorted, (size_t) edgesSize, sizeof(int*), mcByWeight);
              int comps = n, answer = 0;
              for (int i = 0; i < edgesSize; i++) {
                  int a = mcFind(parent, sorted[i][0]), b = mcFind(parent, sorted[i][1]);
                  if (a == b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) { answer = sorted[i][2]; break; }
              }
              free(parent);
              free(sorted);
              return answer;
          }
        `,
        csharp: code`
          static int McFind(int[] parent, int x)
          {
              while (parent[x] != x)
              {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              return x;
          }

          public static int MinCost(int n, int[][] edges, int k)
          {
              if (n <= k) return 0;
              var parent = new int[n];
              for (int i = 0; i < n; i++) parent[i] = i;
              var sorted = (int[][]) edges.Clone();
              Array.Sort(sorted, (p, q) => p[2].CompareTo(q[2]));
              int comps = n;
              foreach (var e in sorted)
              {
                  int a = McFind(parent, e[0]), b = McFind(parent, e[1]);
                  if (a == b) continue;
                  parent[a] = b;
                  comps--;
                  if (comps <= k) return e[2];
              }
              return 0;
          }
        `,
        go: code`
          func mcFind(parent []int, x int) int {
              for parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func minCost(n int, edges [][]int, k int) int {
              if n <= k {
                  return 0
              }
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = i
              }
              sorted := make([][]int, len(edges))
              copy(sorted, edges)
              sort.Slice(sorted, func(i, j int) bool { return sorted[i][2] < sorted[j][2] })
              comps := n
              for _, e := range sorted {
                  a, b := mcFind(parent, e[0]), mcFind(parent, e[1])
                  if a == b {
                      continue
                  }
                  parent[a] = b
                  comps--
                  if comps <= k {
                      return e[2]
                  }
              }
              return 0
          }
        `,
        kotlin: code`
          fun mcFind(parent: IntArray, start: Int): Int {
              var x = start
              while (parent[x] != x) {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          fun minCost(n: Int, edges: Array<IntArray>, k: Int): Int {
              if (n <= k) return 0
              val parent = IntArray(n) { it }
              var comps = n
              for (e in edges.sortedBy { it[2] }) {
                  val a = mcFind(parent, e[0])
                  val b = mcFind(parent, e[1])
                  if (a == b) continue
                  parent[a] = b
                  comps--
                  if (comps <= k) return e[2]
              }
              return 0
          }
        `,
        swift: code`
          func mcFind(_ parent: inout [Int], _ start: Int) -> Int {
              var x = start
              while parent[x] != x {
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              }
              return x
          }

          func minCost(_ n: Int, _ edges: [[Int]], _ k: Int) -> Int {
              if n <= k { return 0 }
              var parent = Array(0..<n)
              var comps = n
              for e in edges.sorted(by: { $0[2] < $1[2] }) {
                  let a = mcFind(&parent, e[0]), b = mcFind(&parent, e[1])
                  if a == b { continue }
                  parent[a] = b
                  comps -= 1
                  if comps <= k { return e[2] }
              }
              return 0
          }
        `,
        rust: code`
          fn mc_find(parent: &mut Vec<usize>, mut x: usize) -> usize {
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn minCost(n: i32, edges: Vec<Vec<i32>>, k: i32) -> i32 {
              if n <= k {
                  return 0;
              }
              let mut parent: Vec<usize> = (0..n as usize).collect();
              let mut sorted = edges.clone();
              sorted.sort_by(|p, q| p[2].cmp(&q[2]));
              let mut comps = n;
              for e in sorted.iter() {
                  let a = mc_find(&mut parent, e[0] as usize);
                  let b = mc_find(&mut parent, e[1] as usize);
                  if a == b {
                      continue;
                  }
                  parent[a] = b;
                  comps -= 1;
                  if comps <= k {
                      return e[2];
                  }
              }
              0
          }
        `,
        php: code`
          function mcFind(&$parent, $x) {
              while ($parent[$x] != $x) {
                  $parent[$x] = $parent[$parent[$x]];
                  $x = $parent[$x];
              }
              return $x;
          }

          function minCost($n, $edges, $k) {
              if ($n <= $k) return 0;
              $parent = range(0, $n - 1);
              usort($edges, function ($p, $q) { return $p[2] <=> $q[2]; });
              $comps = $n;
              foreach ($edges as $e) {
                  $a = mcFind($parent, $e[0]);
                  $b = mcFind($parent, $e[1]);
                  if ($a == $b) continue;
                  $parent[$a] = $b;
                  $comps--;
                  if ($comps <= $k) return $e[2];
              }
              return 0;
          }
        `,
        ruby: code`
          def mc_find(parent, x)
            while parent[x] != x
              parent[x] = parent[parent[x]]
              x = parent[x]
            end
            x
          end

          def minCost(n, edges, k)
            return 0 if n <= k
            parent = (0...n).to_a
            comps = n
            edges.sort_by { |e| e[2] }.each do |u, v, w|
              a = mc_find(parent, u)
              b = mc_find(parent, v)
              next if a == b
              parent[a] = b
              comps -= 1
              return w if comps <= k
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Longest Uncommon Subsequence I (LC 521) ─────────────────────
  (() => {
    const ref = (a: string, b: string): number => (a === b ? -1 : Math.max(a.length, b.length));
    return {
      slug: "longest-uncommon-subsequence-i",
      title: "Longest Uncommon Subsequence I",
      difficulty: "EASY" as const,
      tags: ["String", "Brainteaser", "Google", "Amazon"],
      signature: {
        funcName: "findLUSlength",
        params: [{ name: "a", type: "string" as const }, { name: "b", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `a` and `b`, return the length of their **longest uncommon subsequence**, or `-1` if there is none.\n\n" +
        "An **uncommon subsequence** of two strings is a string that is a subsequence of **exactly one** of them. A subsequence is what remains after deleting any number of characters (possibly none) without changing the order of the rest.",
        [
          { in: 'a = "code", b = "kairo"', out: "5", note: '`"kairo"` is a subsequence of `b` but not of `a`.' },
          { in: 'a = "abc", b = "xbz"', out: "3" },
          { in: 'a = "aaa", b = "aaa"', out: "-1", note: "Every subsequence of one string is a subsequence of the other." },
        ],
        ["1 <= a.length, b.length <= 100", "a and b consist of lowercase English letters"]),
      hints: [
        "Can a whole string be an uncommon subsequence? When is `a` itself **not** a subsequence of `b`?",
        "If the strings differ, the longer one cannot be a subsequence of the shorter one — and if they have equal length but differ, neither is a subsequence of the other.",
        "So the answer is `max(len(a), len(b))` unless `a == b`, in which case it is `-1`.",
      ],
      editorial: explain({
        idea: "A subsequence of a string is never longer than the string, so the best conceivable answer is a whole string — and a whole string works whenever the two strings differ.",
        steps: [
          "If `a == b`, return `-1`.",
          "Otherwise return `max(len(a), len(b))`.",
        ],
        why: "If `a != b`, take the longer string (either one if the lengths are equal). It cannot be a subsequence of the other: a longer string never fits inside a shorter one, and a string of the same length is a subsequence only of itself. Nothing longer exists, so it is optimal. If `a == b`, any subsequence of one is a subsequence of the other, so no uncommon subsequence exists.",
        time: "O(|a| + |b|) for the comparison",
        space: "O(1)",
        pitfalls: [
          "Searching subsequences is unnecessary — the problem is a trick question about whole strings.",
          "Equal lengths do not mean equal strings: `\"abc\"` and `\"xbz\"` give 3.",
        ],
      }),
      examples: [
        { input: '"code"\n"kairo"', expectedOutput: "5" },
        { input: '"abc"\n"xbz"', expectedOutput: "3" },
        { input: '"aaa"\n"aaa"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const a = randLower(rng, 1, pick(rng, [1, 3, 8, 100]), alpha);
        const roll = rng();
        const b = roll < 0.3 ? a : roll < 0.45 ? a.slice(0, ri(rng, 1, a.length)) : randLower(rng, 1, pick(rng, [1, 3, 8, 100]), alpha);
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          def findLUSlength(a: str, b: str) -> int:
              return -1 if a == b else max(len(a), len(b))
        `,
        javascript: code`
          var findLUSlength = function(a, b) {
              return a === b ? -1 : Math.max(a.length, b.length);
          };
        `,
        typescript: code`
          function findLUSlength(a: string, b: string): number {
              return a === b ? -1 : Math.max(a.length, b.length);
          }
        `,
        java: code`
          public static int findLUSlength(String a, String b) {
              return a.equals(b) ? -1 : Math.max(a.length(), b.length());
          }
        `,
        cpp: code`
          int findLUSlength(string a, string b) {
              return a == b ? -1 : (int) max(a.size(), b.size());
          }
        `,
        c: code`
          int findLUSlength(const char* a, const char* b) {
              if (strcmp(a, b) == 0) return -1;
              int la = (int) strlen(a), lb = (int) strlen(b);
              return la > lb ? la : lb;
          }
        `,
        csharp: code`
          public static int FindLUSlength(string a, string b)
          {
              return a == b ? -1 : Math.Max(a.Length, b.Length);
          }
        `,
        go: code`
          func findLUSlength(a string, b string) int {
              if a == b {
                  return -1
              }
              if len(a) > len(b) {
                  return len(a)
              }
              return len(b)
          }
        `,
        kotlin: code`
          fun findLUSlength(a: String, b: String): Int {
              return if (a == b) -1 else maxOf(a.length, b.length)
          }
        `,
        swift: code`
          func findLUSlength(_ a: String, _ b: String) -> Int {
              return a == b ? -1 : max(a.utf8.count, b.utf8.count)
          }
        `,
        rust: code`
          fn findLUSlength(a: String, b: String) -> i32 {
              if a == b {
                  -1
              } else {
                  a.len().max(b.len()) as i32
              }
          }
        `,
        php: code`
          function findLUSlength($a, $b) {
              return $a === $b ? -1 : max(strlen($a), strlen($b));
          }
        `,
        ruby: code`
          def findLUSlength(a, b)
            a == b ? -1 : [a.length, b.length].max
          end
        `,
      },
    };
  })(),

  // ── Longest Uncommon Subsequence II (LC 522) ────────────────────
  (() => {
    const isSub = (s: string, t: string) => {
      let i = 0;
      for (let j = 0; j < t.length && i < s.length; j++) if (s[i] === t[j]) i++;
      return i === s.length;
    };
    // Brute force: try every subsequence of every string.
    const ref = (strs: string[]): number => {
      let best = -1;
      strs.forEach((s, i) => {
        for (let mask = 1; mask < 1 << s.length; mask++) {
          let sub = "";
          for (let b = 0; b < s.length; b++) if (mask & (1 << b)) sub += s[b];
          if (sub.length <= best) continue;
          if (strs.every((t, j) => j === i || !isSub(sub, t))) best = sub.length;
        }
      });
      return best;
    };
    return {
      slug: "longest-uncommon-subsequence-ii",
      title: "Longest Uncommon Subsequence II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "String", "Sorting", "Google"],
      signature: {
        funcName: "findLUSlength",
        params: [{ name: "strs", type: "string[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an array of strings `strs`, return the length of the **longest uncommon subsequence** among them, or `-1` if none exists.\n\n" +
        "An **uncommon subsequence** is a string that is a subsequence of **one** string of the array but **not** a subsequence of any of the others. A subsequence is obtained by deleting any number of characters (possibly none) without reordering the rest. Equal strings at two different positions count as two different strings.",
        [
          { in: 'strs = ["aba","cdc","eae"]', out: "3", note: "Each whole string is a subsequence of no other string." },
          { in: 'strs = ["code","kairo","kairo","co"]', out: "4", note: '`"code"` is not a subsequence of `"kairo"` or `"co"`; each `"kairo"` is a subsequence of the other one.' },
          { in: 'strs = ["aaa","aaa","aa"]', out: "-1" },
        ],
        ["2 <= strs.length <= 50", "1 <= strs[i].length <= 10", "strs[i] consists of lowercase English letters"]),
      hints: [
        "If some subsequence `x` of `strs[i]` is uncommon, then `strs[i]` itself is uncommon too — any string containing `strs[i]` as a subsequence would contain `x` as well.",
        "So only the whole strings are candidates: check each one against all the others.",
        "A two-pointer scan tells whether `s` is a subsequence of `t` in `O(|t|)`. Return the longest candidate that is a subsequence of no other string.",
      ],
      editorial: explain({
        idea: "The answer, if it exists, is the length of a whole input string: extending an uncommon subsequence of `strs[i]` to all of `strs[i]` keeps it uncommon and only makes it longer.",
        steps: [
          "For every index `i`, check `strs[i]` against every `strs[j]` with `j != i` using a two-pointer subsequence test.",
          "If `strs[i]` is a subsequence of none of them, it is uncommon: update the answer with its length.",
          "Return the best length found, or `-1`.",
        ],
        why: "Suppose `x` is an uncommon subsequence of `strs[i]`. If `strs[i]` were a subsequence of some other `strs[j]`, then `x` (a subsequence of `strs[i]`) would also be a subsequence of `strs[j]` — a contradiction. So `strs[i]` is uncommon and at least as long as `x`; checking whole strings loses nothing.",
        time: "O(n^2 · L) for `n` strings of length up to `L`",
        space: "O(1)",
        pitfalls: [
          "A duplicated string is a subsequence of its copy, so neither copy counts.",
          "Compare by index, not by value — skip only `j == i`, not every equal string.",
          "Return `-1`, not `0`, when nothing qualifies.",
        ],
      }),
      examples: [
        { input: '["aba","cdc","eae"]', expectedOutput: "3" },
        { input: '["code","kairo","kairo","co"]', expectedOutput: "4" },
        { input: '["aaa","aaa","aa"]', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcd"]);
        const n = ri(rng, 2, pick(rng, [2, 4, 8]));
        const strs: string[] = [];
        for (let i = 0; i < n; i++) {
          if (strs.length && rng() < 0.3) strs.push(pick(rng, strs));
          else strs.push(randLower(rng, 1, pick(rng, [2, 5, 8]), alpha));
        }
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findLUSlength(strs: List[str]) -> int:
              def is_sub(s, t):
                  i = 0
                  for ch in t:
                      if i < len(s) and s[i] == ch:
                          i += 1
                  return i == len(s)

              best = -1
              for i, s in enumerate(strs):
                  if len(s) <= best:
                      continue
                  if all(j == i or not is_sub(s, t) for j, t in enumerate(strs)):
                      best = len(s)
              return best
        `,
        javascript: code`
          var findLUSlength = function(strs) {
              var isSub = function(s, t) {
                  var i = 0;
                  for (var j = 0; j < t.length && i < s.length; j++) if (s[i] === t[j]) i++;
                  return i === s.length;
              };
              var best = -1;
              for (var i = 0; i < strs.length; i++) {
                  if (strs[i].length <= best) continue;
                  var ok = true;
                  for (var j = 0; j < strs.length && ok; j++) if (j !== i && isSub(strs[i], strs[j])) ok = false;
                  if (ok) best = strs[i].length;
              }
              return best;
          };
        `,
        typescript: code`
          function findLUSlength(strs: string[]): number {
              var isSub = function(s: string, t: string): boolean {
                  var i = 0;
                  for (var j = 0; j < t.length && i < s.length; j++) if (s[i] === t[j]) i++;
                  return i === s.length;
              };
              var best = -1;
              for (var i = 0; i < strs.length; i++) {
                  if (strs[i].length <= best) continue;
                  var ok = true;
                  for (var j = 0; j < strs.length && ok; j++) if (j !== i && isSub(strs[i], strs[j])) ok = false;
                  if (ok) best = strs[i].length;
              }
              return best;
          }
        `,
        java: code`
          static boolean lusIsSub(String s, String t) {
              int i = 0;
              for (int j = 0; j < t.length() && i < s.length(); j++) if (s.charAt(i) == t.charAt(j)) i++;
              return i == s.length();
          }

          public static int findLUSlength(String[] strs) {
              int best = -1;
              for (int i = 0; i < strs.length; i++) {
                  if (strs[i].length() <= best) continue;
                  boolean ok = true;
                  for (int j = 0; j < strs.length && ok; j++) if (j != i && lusIsSub(strs[i], strs[j])) ok = false;
                  if (ok) best = strs[i].length();
              }
              return best;
          }
        `,
        cpp: code`
          static bool lusIsSub(const string& s, const string& t) {
              size_t i = 0;
              for (size_t j = 0; j < t.size() && i < s.size(); j++) if (s[i] == t[j]) i++;
              return i == s.size();
          }

          int findLUSlength(vector<string>& strs) {
              int best = -1;
              for (size_t i = 0; i < strs.size(); i++) {
                  if ((int) strs[i].size() <= best) continue;
                  bool ok = true;
                  for (size_t j = 0; j < strs.size() && ok; j++) if (j != i && lusIsSub(strs[i], strs[j])) ok = false;
                  if (ok) best = (int) strs[i].size();
              }
              return best;
          }
        `,
        c: code`
          static bool lusIsSub(const char* s, const char* t) {
              int i = 0;
              for (int j = 0; t[j] != '\0' && s[i] != '\0'; j++) if (s[i] == t[j]) i++;
              return s[i] == '\0';
          }

          int findLUSlength(char** strs, int strsSize) {
              int best = -1;
              for (int i = 0; i < strsSize; i++) {
                  int len = (int) strlen(strs[i]);
                  if (len <= best) continue;
                  bool ok = true;
                  for (int j = 0; j < strsSize && ok; j++) if (j != i && lusIsSub(strs[i], strs[j])) ok = false;
                  if (ok) best = len;
              }
              return best;
          }
        `,
        csharp: code`
          static bool LusIsSub(string s, string t)
          {
              int i = 0;
              for (int j = 0; j < t.Length && i < s.Length; j++) if (s[i] == t[j]) i++;
              return i == s.Length;
          }

          public static int FindLUSlength(string[] strs)
          {
              int best = -1;
              for (int i = 0; i < strs.Length; i++)
              {
                  if (strs[i].Length <= best) continue;
                  bool ok = true;
                  for (int j = 0; j < strs.Length && ok; j++) if (j != i && LusIsSub(strs[i], strs[j])) ok = false;
                  if (ok) best = strs[i].Length;
              }
              return best;
          }
        `,
        go: code`
          func lusIsSub(s, t string) bool {
              i := 0
              for j := 0; j < len(t) && i < len(s); j++ {
                  if s[i] == t[j] {
                      i++
                  }
              }
              return i == len(s)
          }

          func findLUSlength(strs []string) int {
              best := -1
              for i, s := range strs {
                  if len(s) <= best {
                      continue
                  }
                  ok := true
                  for j, t := range strs {
                      if j != i && lusIsSub(s, t) {
                          ok = false
                          break
                      }
                  }
                  if ok {
                      best = len(s)
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun lusIsSub(s: String, t: String): Boolean {
              var i = 0
              var j = 0
              while (j < t.length && i < s.length) {
                  if (s[i] == t[j]) i++
                  j++
              }
              return i == s.length
          }

          fun findLUSlength(strs: Array<String>): Int {
              var best = -1
              for (i in strs.indices) {
                  if (strs[i].length <= best) continue
                  var ok = true
                  for (j in strs.indices) {
                      if (j != i && lusIsSub(strs[i], strs[j])) { ok = false; break }
                  }
                  if (ok) best = strs[i].length
              }
              return best
          }
        `,
        swift: code`
          func lusIsSub(_ s: [UInt8], _ t: [UInt8]) -> Bool {
              var i = 0
              var j = 0
              while j < t.count && i < s.count {
                  if s[i] == t[j] { i += 1 }
                  j += 1
              }
              return i == s.count
          }

          func findLUSlength(_ strs: [String]) -> Int {
              let words = strs.map { Array($0.utf8) }
              var best = -1
              for i in 0..<words.count {
                  if words[i].count <= best { continue }
                  var ok = true
                  for j in 0..<words.count where j != i {
                      if lusIsSub(words[i], words[j]) { ok = false; break }
                  }
                  if ok { best = words[i].count }
              }
              return best
          }
        `,
        rust: code`
          fn lus_is_sub(s: &[u8], t: &[u8]) -> bool {
              let mut i = 0;
              for &c in t.iter() {
                  if i < s.len() && s[i] == c {
                      i += 1;
                  }
              }
              i == s.len()
          }

          fn findLUSlength(strs: Vec<String>) -> i32 {
              let mut best: i32 = -1;
              for i in 0..strs.len() {
                  let s = strs[i].as_bytes();
                  if (s.len() as i32) <= best {
                      continue;
                  }
                  let ok = (0..strs.len()).all(|j| j == i || !lus_is_sub(s, strs[j].as_bytes()));
                  if ok {
                      best = s.len() as i32;
                  }
              }
              best
          }
        `,
        php: code`
          function lusIsSub($s, $t) {
              $i = 0;
              $n = strlen($s);
              $m = strlen($t);
              for ($j = 0; $j < $m && $i < $n; $j++) if ($s[$i] === $t[$j]) $i++;
              return $i == $n;
          }

          function findLUSlength($strs) {
              $best = -1;
              $n = count($strs);
              for ($i = 0; $i < $n; $i++) {
                  $len = strlen($strs[$i]);
                  if ($len <= $best) continue;
                  $ok = true;
                  for ($j = 0; $j < $n && $ok; $j++) if ($j != $i && lusIsSub($strs[$i], $strs[$j])) $ok = false;
                  if ($ok) $best = $len;
              }
              return $best;
          }
        `,
        ruby: code`
          def lus_is_sub(s, t)
            i = 0
            t.each_char { |ch| i += 1 if i < s.length && s[i] == ch }
            i == s.length
          end

          def findLUSlength(strs)
            best = -1
            strs.each_with_index do |s, i|
              next if s.length <= best
              ok = strs.each_with_index.all? { |t, j| j == i || !lus_is_sub(s, t) }
              best = s.length if ok
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Robot Return to Origin (LC 657) ─────────────────────────────
  (() => {
    const ref = (moves: string): boolean => {
      let x = 0, y = 0;
      for (const ch of moves) {
        if (ch === "U") y++; else if (ch === "D") y--; else if (ch === "L") x--; else x++;
      }
      return x === 0 && y === 0;
    };
    return {
      slug: "robot-return-to-origin",
      title: "Robot Return to Origin",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "judgeCircle", params: [{ name: "moves", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A robot starts at the origin `(0, 0)` of a grid. The string `moves` lists its moves in order: `'U'` (up), `'D'` (down), `'L'` (left) and `'R'` (right), each of exactly one unit.\n\n" +
        "Return `true` if the robot is back at the origin after the last move, and `false` otherwise. Which way the robot faces does not matter.",
        [
          { in: 'moves = "UD"', out: "true", note: "One step up, one step down." },
          { in: 'moves = "LL"', out: "false", note: "The robot ends two units left of the origin." },
          { in: 'moves = "RRDLUL"', out: "true" },
        ],
        ["1 <= moves.length <= 2 * 10^4", "moves only contains the characters 'U', 'D', 'L' and 'R'"]),
      hints: [
        "Only the final position matters, not the path.",
        "Track the horizontal and vertical offsets separately.",
        "The robot is home exactly when the number of `U` equals the number of `D` and the number of `L` equals the number of `R`.",
      ],
      editorial: explain({
        idea: "The moves commute: the final position is (#R − #L, #U − #D), whatever the order.",
        steps: [
          "Keep `x = y = 0`.",
          "For each move, adjust `x` for `L`/`R` and `y` for `U`/`D`.",
          "Return whether `x == 0` and `y == 0`.",
        ],
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Both coordinates must be zero — balancing only `U`/`D` is not enough.",
        ],
      }),
      examples: [
        { input: '"UD"', expectedOutput: "true" },
        { input: '"LL"', expectedOutput: "false" },
        { input: '"RRDLUL"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let moves: string;
        if (rng() < 0.45) {
          const h = ri(rng, 0, 8), v = ri(rng, 0, 8);
          const arr = [..."L".repeat(h), ..."R".repeat(h), ..."U".repeat(v), ..."D".repeat(v)];
          if (!arr.length) arr.push("U", "D");
          if (rng() < 0.2) arr[ri(rng, 0, arr.length - 1)] = pick(rng, ["U", "D", "L", "R"]);
          moves = shuffle(rng, arr).join("");
        } else moves = randLower(rng, 1, pick(rng, [1, 4, 12, 30]), "UDLR");
        return { input: `"${moves}"`, expectedOutput: bool(ref(moves)) };
      },
      solutions: {
        python: code`
          def judgeCircle(moves: str) -> bool:
              return moves.count("U") == moves.count("D") and moves.count("L") == moves.count("R")
        `,
        javascript: code`
          var judgeCircle = function(moves) {
              var x = 0, y = 0;
              for (var i = 0; i < moves.length; i++) {
                  var c = moves[i];
                  if (c === "U") y++;
                  else if (c === "D") y--;
                  else if (c === "L") x--;
                  else x++;
              }
              return x === 0 && y === 0;
          };
        `,
        typescript: code`
          function judgeCircle(moves: string): boolean {
              var x = 0, y = 0;
              for (var i = 0; i < moves.length; i++) {
                  var c = moves[i];
                  if (c === "U") y++;
                  else if (c === "D") y--;
                  else if (c === "L") x--;
                  else x++;
              }
              return x === 0 && y === 0;
          }
        `,
        java: code`
          public static boolean judgeCircle(String moves) {
              int x = 0, y = 0;
              for (int i = 0; i < moves.length(); i++) {
                  char c = moves.charAt(i);
                  if (c == 'U') y++;
                  else if (c == 'D') y--;
                  else if (c == 'L') x--;
                  else x++;
              }
              return x == 0 && y == 0;
          }
        `,
        cpp: code`
          bool judgeCircle(string moves) {
              int x = 0, y = 0;
              for (char c : moves) {
                  if (c == 'U') y++;
                  else if (c == 'D') y--;
                  else if (c == 'L') x--;
                  else x++;
              }
              return x == 0 && y == 0;
          }
        `,
        c: code`
          bool judgeCircle(const char* moves) {
              int x = 0, y = 0;
              for (const char* p = moves; *p; p++) {
                  if (*p == 'U') y++;
                  else if (*p == 'D') y--;
                  else if (*p == 'L') x--;
                  else x++;
              }
              return x == 0 && y == 0;
          }
        `,
        csharp: code`
          public static bool JudgeCircle(string moves)
          {
              int x = 0, y = 0;
              foreach (char c in moves)
              {
                  if (c == 'U') y++;
                  else if (c == 'D') y--;
                  else if (c == 'L') x--;
                  else x++;
              }
              return x == 0 && y == 0;
          }
        `,
        go: code`
          func judgeCircle(moves string) bool {
              x, y := 0, 0
              for i := 0; i < len(moves); i++ {
                  switch moves[i] {
                  case 'U':
                      y++
                  case 'D':
                      y--
                  case 'L':
                      x--
                  default:
                      x++
                  }
              }
              return x == 0 && y == 0
          }
        `,
        kotlin: code`
          fun judgeCircle(moves: String): Boolean {
              var x = 0
              var y = 0
              for (c in moves) {
                  when (c) {
                      'U' -> y++
                      'D' -> y--
                      'L' -> x--
                      else -> x++
                  }
              }
              return x == 0 && y == 0
          }
        `,
        swift: code`
          func judgeCircle(_ moves: String) -> Bool {
              var x = 0, y = 0
              for c in moves.utf8 {
                  switch c {
                  case 85: y += 1   // U
                  case 68: y -= 1   // D
                  case 76: x -= 1   // L
                  default: x += 1   // R
                  }
              }
              return x == 0 && y == 0
          }
        `,
        rust: code`
          fn judgeCircle(moves: String) -> bool {
              let (mut x, mut y) = (0i32, 0i32);
              for c in moves.bytes() {
                  match c {
                      b'U' => y += 1,
                      b'D' => y -= 1,
                      b'L' => x -= 1,
                      _ => x += 1,
                  }
              }
              x == 0 && y == 0
          }
        `,
        php: code`
          function judgeCircle($moves) {
              return substr_count($moves, 'U') == substr_count($moves, 'D')
                  && substr_count($moves, 'L') == substr_count($moves, 'R');
          }
        `,
        ruby: code`
          def judgeCircle(moves)
            moves.count("U") == moves.count("D") && moves.count("L") == moves.count("R")
          end
        `,
      },
    };
  })(),

  // ── Repeated String Match (LC 686) ──────────────────────────────
  (() => {
    const ref = (a: string, b: string): number => {
      const limit = Math.floor(b.length / a.length) + 2;
      for (let k = 1; k <= limit; k++) if (a.repeat(k).includes(b)) return k;
      return -1;
    };
    return {
      slug: "repeated-string-match",
      title: "Repeated String Match",
      difficulty: "MEDIUM" as const,
      tags: ["String", "String Matching", "Rolling Hash", "Google", "Amazon"],
      signature: {
        funcName: "repeatedStringMatch",
        params: [{ name: "a", type: "string" as const }, { name: "b", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `a` and `b`, return the **minimum** number of times `a` must be repeated (written end to end) so that `b` becomes a **substring** of the result. If no number of repetitions works, return `-1`.\n\n" +
        "Repeating `\"abc\"` zero times gives `\"\"`, once gives `\"abc\"`, twice gives `\"abcabc\"`.",
        [
          { in: 'a = "kai", b = "aikaik"', out: "3", note: '`"kaikaikai"` contains `"aikaik"` starting at index 1; `"kaikai"` is too short to.' },
          { in: 'a = "z", b = "zzzz"', out: "4" },
          { in: 'a = "abc", b = "acb"', out: "-1", note: "In any repetition of `a`, the letter after `a` is always `b`." },
        ],
        ["1 <= a.length, b.length <= 10^4", "a and b consist of lowercase English letters"]),
      hints: [
        "The repeated string must at least be as long as `b`, so you need at least `q = ceil(|b| / |a|)` copies.",
        "If `b` occurs at all, it starts inside the first copy of `a`. Starting there, it ends within `q + 1` copies.",
        "So only two candidates matter: check `a` repeated `q` times, then `q + 1` times; otherwise answer `-1`.",
      ],
      editorial: explain({
        idea: "Any occurrence of `b` in a long repetition of `a` can be shifted left by whole copies until it starts in the first copy, and from there it spans at most `q + 1` copies, where `q = ceil(|b| / |a|)`.",
        steps: [
          "Build `s` by appending `a` until `|s| >= |b|`; let `q` be the number of copies used.",
          "If `b` is a substring of `s`, return `q`.",
          "Append one more `a`; if `b` is now a substring, return `q + 1`.",
          "Otherwise return `-1`.",
        ],
        why: "Fewer than `q` copies are shorter than `b`, so `q` is a lower bound. If `b` occurs in some repetition, shift the occurrence left by multiples of `|a|` (the string is periodic) until it starts at an offset `o < |a|`; it then ends before `o + |b| < |a| + q·|a|`, inside `q + 1` copies. Hence if neither candidate contains `b`, no repetition does.",
        time: "O(|a| + |b|) with a linear-time matcher (KMP / Z); a library substring search is fine in practice",
        space: "O(|a| + |b|)",
        pitfalls: [
          "Checking only `q` copies misses cases like `a = \"abcd\"`, `b = \"cdab\"`, which need one extra copy.",
          "Looping on more and more copies without a bound never terminates when the answer is `-1`.",
        ],
      }),
      examples: [
        { input: '"kai"\n"aikaik"', expectedOutput: "3" },
        { input: '"z"\n"zzzz"', expectedOutput: "4" },
        { input: '"abc"\n"acb"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const a = randLower(rng, 1, pick(rng, [1, 3, 6]), alpha);
        let b: string;
        if (rng() < 0.65) {
          const big = a.repeat(Math.ceil(40 / a.length) + 2);
          const start = ri(rng, 0, a.length - 1);
          const len = ri(rng, 1, pick(rng, [3, 10, 30]));
          b = big.slice(start, start + len);
          if (rng() < 0.2) {
            const i = ri(rng, 0, b.length - 1);
            b = b.slice(0, i) + pick(rng, [...alpha]) + b.slice(i + 1);
          }
        } else b = randLower(rng, 1, pick(rng, [1, 4, 10]), alpha);
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          def repeatedStringMatch(a: str, b: str) -> int:
              q = -(-len(b) // len(a))  # ceil
              s = a * q
              if b in s:
                  return q
              if b in s + a:
                  return q + 1
              return -1
        `,
        javascript: code`
          var repeatedStringMatch = function(a, b) {
              var q = Math.ceil(b.length / a.length);
              var s = "";
              for (var i = 0; i < q; i++) s += a;
              if (s.indexOf(b) !== -1) return q;
              if ((s + a).indexOf(b) !== -1) return q + 1;
              return -1;
          };
        `,
        typescript: code`
          function repeatedStringMatch(a: string, b: string): number {
              var q = Math.ceil(b.length / a.length);
              var s = "";
              for (var i = 0; i < q; i++) s += a;
              if (s.indexOf(b) !== -1) return q;
              if ((s + a).indexOf(b) !== -1) return q + 1;
              return -1;
          }
        `,
        java: code`
          public static int repeatedStringMatch(String a, String b) {
              int q = (b.length() + a.length() - 1) / a.length();
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < q; i++) sb.append(a);
              if (sb.indexOf(b) != -1) return q;
              sb.append(a);
              if (sb.indexOf(b) != -1) return q + 1;
              return -1;
          }
        `,
        cpp: code`
          int repeatedStringMatch(string a, string b) {
              int q = ((int) b.size() + (int) a.size() - 1) / (int) a.size();
              string s;
              for (int i = 0; i < q; i++) s += a;
              if (s.find(b) != string::npos) return q;
              s += a;
              if (s.find(b) != string::npos) return q + 1;
              return -1;
          }
        `,
        c: code`
          int repeatedStringMatch(const char* a, const char* b) {
              int la = (int) strlen(a), lb = (int) strlen(b);
              int q = (lb + la - 1) / la;
              char* s = (char*) malloc((size_t) (q + 1) * la + 1);
              s[0] = '\0';
              for (int i = 0; i < q; i++) memcpy(s + (size_t) i * la, a, (size_t) la);
              s[(size_t) q * la] = '\0';
              int answer = -1;
              if (strstr(s, b) != NULL) {
                  answer = q;
              } else {
                  memcpy(s + (size_t) q * la, a, (size_t) la);
                  s[(size_t) (q + 1) * la] = '\0';
                  if (strstr(s, b) != NULL) answer = q + 1;
              }
              free(s);
              return answer;
          }
        `,
        csharp: code`
          public static int RepeatedStringMatch(string a, string b)
          {
              int q = (b.Length + a.Length - 1) / a.Length;
              var sb = new System.Text.StringBuilder();
              for (int i = 0; i < q; i++) sb.Append(a);
              if (sb.ToString().IndexOf(b, StringComparison.Ordinal) >= 0) return q;
              sb.Append(a);
              if (sb.ToString().IndexOf(b, StringComparison.Ordinal) >= 0) return q + 1;
              return -1;
          }
        `,
        go: code`
          func repeatedStringMatch(a string, b string) int {
              q := (len(b) + len(a) - 1) / len(a)
              s := strings.Repeat(a, q)
              if strings.Contains(s, b) {
                  return q
              }
              if strings.Contains(s+a, b) {
                  return q + 1
              }
              return -1
          }
        `,
        kotlin: code`
          fun repeatedStringMatch(a: String, b: String): Int {
              val q = (b.length + a.length - 1) / a.length
              val s = a.repeat(q)
              if (s.contains(b)) return q
              if ((s + a).contains(b)) return q + 1
              return -1
          }
        `,
        swift: code`
          func repeatedStringMatch(_ a: String, _ b: String) -> Int {
              let la = a.utf8.count, lb = b.utf8.count
              let q = (lb + la - 1) / la
              let s = String(repeating: a, count: q)
              if s.range(of: b) != nil { return q }
              if (s + a).range(of: b) != nil { return q + 1 }
              return -1
          }
        `,
        rust: code`
          fn repeatedStringMatch(a: String, b: String) -> i32 {
              let q = (b.len() + a.len() - 1) / a.len();
              let mut s = a.repeat(q);
              if s.contains(b.as_str()) {
                  return q as i32;
              }
              s.push_str(&a);
              if s.contains(b.as_str()) {
                  return (q + 1) as i32;
              }
              -1
          }
        `,
        php: code`
          function repeatedStringMatch($a, $b) {
              $q = intdiv(strlen($b) + strlen($a) - 1, strlen($a));
              $s = str_repeat($a, $q);
              if (strpos($s, $b) !== false) return $q;
              if (strpos($s . $a, $b) !== false) return $q + 1;
              return -1;
          }
        `,
        ruby: code`
          def repeatedStringMatch(a, b)
            q = (b.length + a.length - 1) / a.length
            s = a * q
            return q if s.include?(b)
            return q + 1 if (s + a).include?(b)
            -1
          end
        `,
      },
    };
  })(),

  // ── Shifting Letters (LC 848) ───────────────────────────────────
  (() => {
    const ref = (s: string, shifts: number[]): string => {
      let out = "";
      for (let i = 0; i < s.length; i++) {
        let total = 0;
        for (let j = i; j < shifts.length; j++) total = (total + shifts[j]) % 26;
        out += String.fromCharCode(97 + ((s.charCodeAt(i) - 97 + total) % 26));
      }
      return out;
    };
    return {
      slug: "shifting-letters",
      title: "Shifting Letters",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "shiftingLetters",
        params: [{ name: "s", type: "string" as const }, { name: "shifts", type: "int[]" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a lowercase string `s` and an integer array `shifts` of the same length.\n\n" +
        "**Shifting** a letter moves it to the next letter of the alphabet, wrapping around so that `'z'` becomes `'a'`. For every `i`, shift the **first `i + 1` letters** of `s` by `shifts[i]` positions.\n\n" +
        "Return the string after all the shifts have been applied.",
        [
          { in: 's = "kai", shifts = [1,2,3]', out: "qfl", note: "Letter 0 is shifted 1 + 2 + 3 = 6 times, letter 1 is shifted 2 + 3 = 5 times, letter 2 is shifted 3 times." },
          { in: 's = "zz", shifts = [1,26]', out: "az", note: "The first `z` moves 27 positions — one full lap plus one." },
          { in: 's = "a", shifts = [1000000000]', out: "m", note: "10^9 leaves remainder 12 when divided by 26." },
        ],
        ["1 <= s.length <= 10^5", "s consists of lowercase English letters", "shifts.length == s.length", "0 <= shifts[i] <= 10^9"]),
      hints: [
        "Letter `i` is affected by `shifts[i]`, `shifts[i + 1]`, …, `shifts[n - 1]` — every shift whose prefix covers it.",
        "So letter `i` moves by the **suffix sum** of `shifts` starting at `i`. Walk from the right to build it in one pass.",
        "The sums can reach 10^14, but only their value modulo 26 matters — reduce as you go.",
      ],
      editorial: explain({
        idea: "The total shift applied to position `i` is `shifts[i] + shifts[i + 1] + … + shifts[n - 1]`, so one right-to-left pass keeping a running sum modulo 26 shifts every letter.",
        steps: [
          "Set `total = 0`.",
          "For `i` from `n - 1` down to `0`: `total = (total + shifts[i]) mod 26`, then replace `s[i]` with the letter `(s[i] - 'a' + total) mod 26` places after `'a'`.",
          "Return the rebuilt string.",
        ],
        why: "The operation for index `j` touches letters `0..j`, so letter `i` receives exactly the shifts with `j >= i`. Shifting by `x` and by `x mod 26` land on the same letter because the alphabet wraps every 26 steps.",
        time: "O(n)",
        space: "O(n) for the output string",
        pitfalls: [
          "Without the modulo the running sum overflows 32-bit integers (10^5 · 10^9).",
          "Shifting prefixes one by one is `O(n^2)` and too slow for `n = 10^5`.",
        ],
      }),
      examples: [
        { input: '"kai"\n[1,2,3]', expectedOutput: "qfl" },
        { input: '"zz"\n[1,26]', expectedOutput: "az" },
        { input: '"a"\n[1000000000]', expectedOutput: "m" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 5, 15, 30]), pick(rng, ["z", "xyz", "abcdefghijklmnopqrstuvwxyz"]));
        const top = pick(rng, [0, 3, 26, 1000000000]);
        const shifts = Array.from({ length: s.length }, () => ri(rng, 0, top));
        return { input: `"${s}"\n${fmtIntArr(shifts)}`, expectedOutput: ref(s, shifts) };
      },
      solutions: {
        python: code`
          from typing import List

          def shiftingLetters(s: str, shifts: List[int]) -> str:
              out = list(s)
              total = 0
              for i in range(len(s) - 1, -1, -1):
                  total = (total + shifts[i]) % 26
                  out[i] = chr(97 + (ord(s[i]) - 97 + total) % 26)
              return "".join(out)
        `,
        javascript: code`
          var shiftingLetters = function(s, shifts) {
              var out = new Array(s.length);
              var total = 0;
              for (var i = s.length - 1; i >= 0; i--) {
                  total = (total + shifts[i]) % 26;
                  out[i] = String.fromCharCode(97 + (s.charCodeAt(i) - 97 + total) % 26);
              }
              return out.join("");
          };
        `,
        typescript: code`
          function shiftingLetters(s: string, shifts: number[]): string {
              var out: string[] = new Array(s.length);
              var total = 0;
              for (var i = s.length - 1; i >= 0; i--) {
                  total = (total + shifts[i]) % 26;
                  out[i] = String.fromCharCode(97 + (s.charCodeAt(i) - 97 + total) % 26);
              }
              return out.join("");
          }
        `,
        java: code`
          public static String shiftingLetters(String s, int[] shifts) {
              char[] out = s.toCharArray();
              int total = 0;
              for (int i = out.length - 1; i >= 0; i--) {
                  total = (total + shifts[i] % 26) % 26;
                  out[i] = (char) ('a' + (out[i] - 'a' + total) % 26);
              }
              return new String(out);
          }
        `,
        cpp: code`
          string shiftingLetters(string s, vector<int>& shifts) {
              int total = 0;
              for (int i = (int) s.size() - 1; i >= 0; i--) {
                  total = (total + shifts[i] % 26) % 26;
                  s[i] = (char) ('a' + (s[i] - 'a' + total) % 26);
              }
              return s;
          }
        `,
        c: code`
          char* shiftingLetters(const char* s, int* shifts, int shiftsSize) {
              int n = (int) strlen(s);
              char* out = (char*) malloc((size_t) n + 1);
              int total = 0;
              for (int i = n - 1; i >= 0; i--) {
                  total = (total + shifts[i] % 26) % 26;
                  out[i] = (char) ('a' + (s[i] - 'a' + total) % 26);
              }
              out[n] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string ShiftingLetters(string s, int[] shifts)
          {
              char[] output = s.ToCharArray();
              int total = 0;
              for (int i = output.Length - 1; i >= 0; i--)
              {
                  total = (total + shifts[i] % 26) % 26;
                  output[i] = (char)('a' + (output[i] - 'a' + total) % 26);
              }
              return new string(output);
          }
        `,
        go: code`
          func shiftingLetters(s string, shifts []int) string {
              out := []byte(s)
              total := 0
              for i := len(out) - 1; i >= 0; i-- {
                  total = (total + shifts[i]%26) % 26
                  out[i] = byte('a' + (int(out[i]-'a')+total)%26)
              }
              return string(out)
          }
        `,
        kotlin: code`
          fun shiftingLetters(s: String, shifts: IntArray): String {
              val out = s.toCharArray()
              var total = 0
              for (i in out.indices.reversed()) {
                  total = (total + shifts[i] % 26) % 26
                  out[i] = 'a' + (out[i] - 'a' + total) % 26
              }
              return String(out)
          }
        `,
        swift: code`
          func shiftingLetters(_ s: String, _ shifts: [Int]) -> String {
              var out = Array(s.utf8)
              var total = 0
              var i = out.count - 1
              while i >= 0 {
                  total = (total + shifts[i]) % 26
                  out[i] = UInt8(97 + (Int(out[i]) - 97 + total) % 26)
                  i -= 1
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn shiftingLetters(s: String, shifts: Vec<i32>) -> String {
              let mut out = s.into_bytes();
              let mut total: i32 = 0;
              for i in (0..out.len()).rev() {
                  total = (total + shifts[i] % 26) % 26;
                  out[i] = b'a' + (((out[i] - b'a') as i32 + total) % 26) as u8;
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function shiftingLetters($s, $shifts) {
              $out = $s;
              $total = 0;
              for ($i = strlen($s) - 1; $i >= 0; $i--) {
                  $total = ($total + $shifts[$i]) % 26;
                  $out[$i] = chr(97 + (ord($s[$i]) - 97 + $total) % 26);
              }
              return $out;
          }
        `,
        ruby: code`
          def shiftingLetters(s, shifts)
            out = s.dup
            total = 0
            (s.length - 1).downto(0) do |i|
              total = (total + shifts[i]) % 26
              out[i] = (97 + (s[i].ord - 97 + total) % 26).chr
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Largest Time for Given Digits (LC 949) ──────────────────────
  (() => {
    const ref = (arr: number[]): string => {
      const want = arr.slice().sort().join("");
      for (let h = 23; h >= 0; h--) {
        for (let m = 59; m >= 0; m--) {
          const d = [Math.floor(h / 10), h % 10, Math.floor(m / 10), m % 10];
          if (d.sort().join("") === want) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
      return "";
    };
    return {
      slug: "largest-time-for-given-digits",
      title: "Largest Time for Given Digits",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Enumeration", "Google", "Amazon"],
      signature: { funcName: "largestTimeFromDigits", params: [{ name: "arr", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "You are given four digits in `arr`. Using **each digit exactly once**, form a 24-hour time `\"HH:MM\"`, where `HH` is between `00` and `23` and `MM` is between `00` and `59`.\n\n" +
        "Return the **latest** valid time you can form, as a string of the form `\"HH:MM\"`. If no valid time can be formed, return the empty string.",
        [
          { in: "arr = [2,0,6,6]", out: "06:26", note: "Any hour starting with 2 would need two digits from {0, 6, 6} for minutes, and 66 is too large." },
          { in: "arr = [1,9,4,7]", out: "19:47" },
          { in: "arr = [5,5,5,5]", out: "", note: "55 is not an hour, so nothing is valid (the expected output is an empty line)." },
        ],
        ["arr.length == 4", "0 <= arr[i] <= 9"]),
      hints: [
        "There are only `4! = 24` ways to order four digits.",
        "For each ordering, the first two digits form the hour and the last two the minutes; keep it if the hour is below 24 and the minutes below 60.",
        "Compare candidates by `hour * 60 + minutes` and format the best one with leading zeros.",
      ],
      editorial: explain({
        idea: "With four digits there are 24 orderings — try them all, keep the valid ones, and pick the latest.",
        steps: [
          "Loop over every choice of distinct positions `i, j, k` for the hour's tens, the hour's ones and the minutes' tens; the remaining position `l = 6 - i - j - k` is the minutes' ones.",
          "Let `h = 10·arr[i] + arr[j]` and `m = 10·arr[k] + arr[l]`. Skip unless `h < 24` and `m < 60`.",
          "Track the largest `h * 60 + m`.",
          "If nothing was valid return `\"\"`; otherwise format it as `\"HH:MM\"` with leading zeros.",
        ],
        why: "Every assignment of the four digits to the four time positions is one of the 24 orderings, and comparing minutes since midnight orders times correctly.",
        time: "O(1) — 24 candidates",
        space: "O(1)",
        pitfalls: [
          "Greedily taking the largest digit first fails: for `[2,0,6,6]` an hour of `2x` leaves `66` for the minutes.",
          "Keep the leading zeros: `6:26` must be written `06:26`.",
          "`00:00` is a valid answer, distinct from the empty string.",
        ],
      }),
      examples: [
        { input: "[2,0,6,6]", expectedOutput: "06:26" },
        { input: "[1,9,4,7]", expectedOutput: "19:47" },
        { input: "[5,5,5,5]", expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [2, 3, 5, 6, 9, 9]);
        const arr = Array.from({ length: 4 }, () => ri(rng, 0, top));
        return { input: fmtIntArr(arr), expectedOutput: ref(arr) };
      },
      solutions: {
        python: code`
          from typing import List
          from itertools import permutations

          def largestTimeFromDigits(arr: List[int]) -> str:
              best = -1
              for a, b, c, d in permutations(arr):
                  h, m = a * 10 + b, c * 10 + d
                  if h < 24 and m < 60:
                      best = max(best, h * 60 + m)
              if best < 0:
                  return ""
              return "%02d:%02d" % (best // 60, best % 60)
        `,
        javascript: code`
          var largestTimeFromDigits = function(arr) {
              var best = -1;
              for (var i = 0; i < 4; i++) {
                  for (var j = 0; j < 4; j++) {
                      for (var k = 0; k < 4; k++) {
                          if (i === j || j === k || i === k) continue;
                          var l = 6 - i - j - k;
                          var h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60 && h * 60 + m > best) best = h * 60 + m;
                      }
                  }
              }
              if (best < 0) return "";
              var hh = Math.floor(best / 60), mm = best % 60;
              return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
          };
        `,
        typescript: code`
          function largestTimeFromDigits(arr: number[]): string {
              var best = -1;
              for (var i = 0; i < 4; i++) {
                  for (var j = 0; j < 4; j++) {
                      for (var k = 0; k < 4; k++) {
                          if (i === j || j === k || i === k) continue;
                          var l = 6 - i - j - k;
                          var h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60 && h * 60 + m > best) best = h * 60 + m;
                      }
                  }
              }
              if (best < 0) return "";
              var hh = Math.floor(best / 60), mm = best % 60;
              return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
          }
        `,
        java: code`
          public static String largestTimeFromDigits(int[] arr) {
              int best = -1;
              for (int i = 0; i < 4; i++)
                  for (int j = 0; j < 4; j++)
                      for (int k = 0; k < 4; k++) {
                          if (i == j || j == k || i == k) continue;
                          int l = 6 - i - j - k;
                          int h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60) best = Math.max(best, h * 60 + m);
                      }
              if (best < 0) return "";
              return String.format("%02d:%02d", best / 60, best % 60);
          }
        `,
        cpp: code`
          string largestTimeFromDigits(vector<int>& arr) {
              int best = -1;
              for (int i = 0; i < 4; i++)
                  for (int j = 0; j < 4; j++)
                      for (int k = 0; k < 4; k++) {
                          if (i == j || j == k || i == k) continue;
                          int l = 6 - i - j - k;
                          int h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60) best = max(best, h * 60 + m);
                      }
              if (best < 0) return "";
              char buf[8];
              snprintf(buf, sizeof(buf), "%02d:%02d", best / 60, best % 60);
              return string(buf);
          }
        `,
        c: code`
          char* largestTimeFromDigits(int* arr, int arrSize) {
              int best = -1;
              for (int i = 0; i < 4; i++)
                  for (int j = 0; j < 4; j++)
                      for (int k = 0; k < 4; k++) {
                          if (i == j || j == k || i == k) continue;
                          int l = 6 - i - j - k;
                          int h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60 && h * 60 + m > best) best = h * 60 + m;
                      }
              char* out = (char*) malloc(8);
              if (best < 0) {
                  out[0] = '\0';
              } else {
                  snprintf(out, 8, "%02d:%02d", best / 60, best % 60);
              }
              return out;
          }
        `,
        csharp: code`
          public static string LargestTimeFromDigits(int[] arr)
          {
              int best = -1;
              for (int i = 0; i < 4; i++)
                  for (int j = 0; j < 4; j++)
                      for (int k = 0; k < 4; k++)
                      {
                          if (i == j || j == k || i == k) continue;
                          int l = 6 - i - j - k;
                          int h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l];
                          if (h < 24 && m < 60) best = Math.Max(best, h * 60 + m);
                      }
              if (best < 0) return "";
              return (best / 60).ToString("D2") + ":" + (best % 60).ToString("D2");
          }
        `,
        go: code`
          func largestTimeFromDigits(arr []int) string {
              best := -1
              for i := 0; i < 4; i++ {
                  for j := 0; j < 4; j++ {
                      for k := 0; k < 4; k++ {
                          if i == j || j == k || i == k {
                              continue
                          }
                          l := 6 - i - j - k
                          h, m := arr[i]*10+arr[j], arr[k]*10+arr[l]
                          if h < 24 && m < 60 && h*60+m > best {
                              best = h*60 + m
                          }
                      }
                  }
              }
              if best < 0 {
                  return ""
              }
              return fmt.Sprintf("%02d:%02d", best/60, best%60)
          }
        `,
        kotlin: code`
          fun largestTimeFromDigits(arr: IntArray): String {
              var best = -1
              for (i in 0 until 4) for (j in 0 until 4) for (k in 0 until 4) {
                  if (i == j || j == k || i == k) continue
                  val l = 6 - i - j - k
                  val h = arr[i] * 10 + arr[j]
                  val m = arr[k] * 10 + arr[l]
                  if (h < 24 && m < 60) best = maxOf(best, h * 60 + m)
              }
              if (best < 0) return ""
              return String.format("%02d:%02d", best / 60, best % 60)
          }
        `,
        swift: code`
          func largestTimeFromDigits(_ arr: [Int]) -> String {
              var best = -1
              for i in 0..<4 {
                  for j in 0..<4 {
                      for k in 0..<4 {
                          if i == j || j == k || i == k { continue }
                          let l = 6 - i - j - k
                          let h = arr[i] * 10 + arr[j], m = arr[k] * 10 + arr[l]
                          if h < 24 && m < 60 { best = max(best, h * 60 + m) }
                      }
                  }
              }
              if best < 0 { return "" }
              let hh = best / 60, mm = best % 60
              return (hh < 10 ? "0" : "") + String(hh) + ":" + (mm < 10 ? "0" : "") + String(mm)
          }
        `,
        rust: code`
          fn largestTimeFromDigits(arr: Vec<i32>) -> String {
              let mut best: i32 = -1;
              for i in 0..4 {
                  for j in 0..4 {
                      for k in 0..4 {
                          if i == j || j == k || i == k {
                              continue;
                          }
                          let l = 6 - i - j - k;
                          let h = arr[i] * 10 + arr[j];
                          let m = arr[k] * 10 + arr[l];
                          if h < 24 && m < 60 {
                              best = best.max(h * 60 + m);
                          }
                      }
                  }
              }
              if best < 0 {
                  return String::new();
              }
              format!("{:02}:{:02}", best / 60, best % 60)
          }
        `,
        php: code`
          function largestTimeFromDigits($arr) {
              $best = -1;
              for ($i = 0; $i < 4; $i++)
                  for ($j = 0; $j < 4; $j++)
                      for ($k = 0; $k < 4; $k++) {
                          if ($i == $j || $j == $k || $i == $k) continue;
                          $l = 6 - $i - $j - $k;
                          $h = $arr[$i] * 10 + $arr[$j];
                          $m = $arr[$k] * 10 + $arr[$l];
                          if ($h < 24 && $m < 60) $best = max($best, $h * 60 + $m);
                      }
              if ($best < 0) return "";
              return sprintf("%02d:%02d", intdiv($best, 60), $best % 60);
          }
        `,
        ruby: code`
          def largestTimeFromDigits(arr)
            best = -1
            arr.permutation.each do |a, b, c, d|
              h = a * 10 + b
              m = c * 10 + d
              best = [best, h * 60 + m].max if h < 24 && m < 60
            end
            return "" if best < 0
            format("%02d:%02d", best / 60, best % 60)
          end
        `,
      },
    };
  })(),

  // ── Binary String With Substrings Representing 1 To N (LC 1016) ─
  (() => {
    const ref = (s: string, n: number): boolean => {
      // Plain check of every number; it stops at the first one missing, and
      // a string of at most 30 characters always misses one below 64.
      for (let i = 1; i <= n; i++) if (!s.includes(i.toString(2))) return false;
      return true;
    };
    return {
      slug: "binary-string-with-substrings-representing-1-to-n",
      title: "Binary String With Substrings Representing 1 To N",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Bit Manipulation", "Sliding Window", "Google"],
      signature: {
        funcName: "queryString",
        params: [{ name: "s", type: "string" as const }, { name: "n", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given a binary string `s` and a positive integer `n`, return `true` if, for **every** integer `x` in the range `[1, n]`, the binary representation of `x` (without leading zeros) appears as a **substring** of `s`. Otherwise return `false`.",
        [
          { in: 's = "1101", n = 3', out: "true", note: '`1` = "1", `2` = "10" and `3` = "11" all occur in `"1101"`.' },
          { in: 's = "1101", n = 4', out: "false", note: '`4` = "100" does not occur.' },
          { in: 's = "1", n = 1000000000', out: "false" },
        ],
        ["1 <= s.length <= 1000", "s[i] is either '0' or '1'", "1 <= n <= 10^9"]),
      hints: [
        "If the binary form of `x` occurs in `s`, so does the binary form of `x / 2` — it is a prefix of it. So only numbers greater than `n / 2` need checking.",
        "A string of length `L` has at most `L - k + 1` distinct substrings of length `k`. If `n` is large, the numbers in `(n / 2, n]` cannot all fit.",
        "So check `x` from `n` down to `n / 2 + 1` and stop at the first one missing — the loop either ends quickly with `false` or `n` is small.",
      ],
      editorial: explain({
        idea: "Only the upper half of the range matters (every smaller number is a prefix of a number in it), and that half fails fast once `n` is large, so a direct substring check of each number in `(n/2, n]` is efficient.",
        steps: [
          "For `x` from `n` down to `floor(n / 2) + 1`, write `x` in binary.",
          "If that binary string is not a substring of `s`, return `false`.",
          "If the loop finishes, return `true`.",
        ],
        why: "For `x <= n / 2`, the binary form of `2x` is the binary form of `x` followed by `0`, and `2x` lies in `(n/2, n]` after doubling enough times; so if all of the upper half occurs, everything does. Every number in the upper half has one of at most two bit lengths, and `s` has at most 1000 distinct substrings of each length, so when the half holds more than about 2000 numbers some are missing — the loop meets one within roughly 2000 checks.",
        time: "O(min(n, |s|) · |s|) substring checks of strings up to 30 characters",
        space: "O(1) extra (the binary string of `x`)",
        pitfalls: [
          "Looping all the way from 1 to `n` is fine only because of the early exit; never build a set of all `n` numbers when `n` is 10^9.",
          "Binary forms have no leading zeros, but `s` may contain zeros anywhere.",
        ],
      }),
      examples: [
        { input: '"1101"\n3', expectedOutput: "true" },
        { input: '"1101"\n4', expectedOutput: "false" },
        { input: '"1"\n1000000000', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let s: string, n: number;
        if (rng() < 0.55) {
          const m = ri(rng, 1, 9);
          const parts = shuffle(rng, Array.from({ length: m }, (_, i) => (i + 1).toString(2)));
          s = parts.join("");
          if (rng() < 0.3) s = randLower(rng, 0, 3, "01") + s + randLower(rng, 0, 3, "01");
          n = Math.max(1, m + ri(rng, -2, 2));
        } else {
          s = randLower(rng, 1, pick(rng, [1, 6, 20, 30]), "01");
          n = rng() < 0.85 ? ri(rng, 1, pick(rng, [3, 10, 40])) : ri(rng, 1, 1000000000);
        }
        return { input: `"${s}"\n${n}`, expectedOutput: bool(ref(s, n)) };
      },
      solutions: {
        python: code`
          def queryString(s: str, n: int) -> bool:
              for x in range(n, n // 2, -1):
                  if bin(x)[2:] not in s:
                      return False
              return True
        `,
        javascript: code`
          var queryString = function(s, n) {
              for (var x = n; x > Math.floor(n / 2); x--) {
                  if (s.indexOf(x.toString(2)) === -1) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function queryString(s: string, n: number): boolean {
              for (var x = n; x > Math.floor(n / 2); x--) {
                  if (s.indexOf(x.toString(2)) === -1) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean queryString(String s, int n) {
              for (int x = n; x > n / 2; x--) {
                  if (!s.contains(Integer.toBinaryString(x))) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool queryString(string s, int n) {
              for (int x = n; x > n / 2; x--) {
                  string b;
                  for (int v = x; v > 0; v >>= 1) b += (char) ('0' + (v & 1));
                  reverse(b.begin(), b.end());
                  if (s.find(b) == string::npos) return false;
              }
              return true;
          }
        `,
        c: code`
          bool queryString(const char* s, int n) {
              char buf[40];
              for (int x = n; x > n / 2; x--) {
                  int len = 0;
                  for (int v = x; v > 0; v >>= 1) len++;
                  for (int i = 0, v = x; i < len; i++, v >>= 1) buf[len - 1 - i] = (char) ('0' + (v & 1));
                  buf[len] = '\0';
                  if (strstr(s, buf) == NULL) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool QueryString(string s, int n)
          {
              for (int x = n; x > n / 2; x--)
              {
                  if (s.IndexOf(Convert.ToString(x, 2), StringComparison.Ordinal) < 0) return false;
              }
              return true;
          }
        `,
        go: code`
          func queryString(s string, n int) bool {
              for x := n; x > n/2; x-- {
                  if !strings.Contains(s, strconv.FormatInt(int64(x), 2)) {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun queryString(s: String, n: Int): Boolean {
              var x = n
              while (x > n / 2) {
                  if (!s.contains(Integer.toBinaryString(x))) return false
                  x--
              }
              return true
          }
        `,
        swift: code`
          func queryString(_ s: String, _ n: Int) -> Bool {
              var x = n
              while x > n / 2 {
                  if s.range(of: String(x, radix: 2)) == nil { return false }
                  x -= 1
              }
              return true
          }
        `,
        rust: code`
          fn queryString(s: String, n: i32) -> bool {
              let mut x = n;
              while x > n / 2 {
                  if !s.contains(format!("{:b}", x).as_str()) {
                      return false;
                  }
                  x -= 1;
              }
              true
          }
        `,
        php: code`
          function queryString($s, $n) {
              for ($x = $n; $x > intdiv($n, 2); $x--) {
                  if (strpos($s, decbin($x)) === false) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def queryString(s, n)
            x = n
            while x > n / 2
              return false unless s.include?(x.to_s(2))
              x -= 1
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Longest Chunked Palindrome Decomposition (LC 1147) ──────────
  (() => {
    // Exhaustive DP over the outer chunk length (the state is the prefix eaten).
    const ref = (text: string): number => {
      const n = text.length;
      const memo = new Map<number, number>();
      const f = (l: number): number => {
        const r = n - l;
        if (l >= r) return 0;
        if (memo.has(l)) return memo.get(l)!;
        let best = 1;
        for (let len = 1; 2 * len <= r - l; len++) {
          if (text.slice(l, l + len) === text.slice(r - len, r)) best = Math.max(best, 2 + f(l + len));
        }
        memo.set(l, best);
        return best;
      };
      return f(0);
    };
    return {
      slug: "longest-chunked-palindrome-decomposition",
      title: "Longest Chunked Palindrome Decomposition",
      difficulty: "HARD" as const,
      tags: ["Two Pointers", "String", "Dynamic Programming", "Greedy", "Rolling Hash", "Google"],
      signature: { funcName: "longestDecomposition", params: [{ name: "text", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Split `text` into `k` non-empty pieces `subtext1, subtext2, …, subtextk` whose concatenation, in order, is `text`, such that the pieces read the same from both ends: `subtext_i == subtext_(k - i + 1)` for every `1 <= i <= k`.\n\n" +
        "Each **piece** is compared as a whole string — the letters inside a piece are not reversed. Return the **largest** possible `k`.",
        [
          { in: 'text = "kaicodekai"', out: "3", note: '`(kai)(code)(kai)` — the middle piece `code` cannot be split further.' },
          { in: 'text = "merchant"', out: "1", note: "No proper prefix equals the suffix of the same length, so the whole string is one piece." },
          { in: 'text = "aaa"', out: "3", note: '`(a)(a)(a)`.' },
        ],
        ["1 <= text.length <= 1000", "text consists only of lowercase English letters"]),
      hints: [
        "Look at the outermost pair of pieces: the first piece must equal the last piece.",
        "Take the **shortest** prefix that equals the suffix of the same length — cutting it off early never hurts, so a greedy choice works.",
        "Repeat on what remains in the middle; if no prefix matches a suffix there, the remaining middle is one last piece.",
      ],
      editorial: explain({
        idea: "Peel the shortest matching prefix/suffix pair off both ends, count 2, and repeat; whatever cannot be peeled is a single middle piece.",
        steps: [
          "Keep `start = 0` (the left edge of the unmatched middle) and `count = 0`.",
          "For `i` from `0` to `n - 1`, let `len = i - start + 1` and compare `text[start .. i]` with the length-`len` block ending at `n - 1 - start`, i.e. `text[n - 1 - i .. n - 1 - start]`.",
          "On a match, add 1 and set `start = i + 1`. Scanning over the whole string counts each outer pair twice (once from each side) and the middle once.",
          "Return the count.",
        ],
        why: "Exchange argument: if the shortest matching prefix `P` (length `p`) is shorter than the first piece `Q` of an optimal decomposition, then `P` is both a prefix and a suffix of `Q`. Replacing the outer pair `Q … Q` by `P, Q', P` around a middle gives at least as many pieces when `|Q| >= 2p`, and when `p < |Q| < 2p` the overlap makes `Q` periodic so splitting still works; hence taking `P` is safe. Recursing on the middle finishes the induction.",
        time: "O(n^2) with direct comparisons (O(n) with rolling hashes)",
        space: "O(1)",
        pitfalls: [
          "Pieces are compared as whole strings, not mirrored character by character: `\"abab\"` splits as `(ab)(ab)`.",
          "When the two scans meet in the middle with no match, that middle still counts as one piece.",
          "Taking the longest matching prefix instead of the shortest loses pieces (`\"aaa\"` would give 1).",
        ],
      }),
      examples: [
        { input: '"kaicodekai"', expectedOutput: "3" },
        { input: '"merchant"', expectedOutput: "1" },
        { input: '"aaa"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcd"]);
        let text: string;
        if (rng() < 0.6) {
          const chunks: string[] = [];
          const m = ri(rng, 0, 4);
          for (let i = 0; i < m; i++) chunks.push(randLower(rng, 1, 4, alpha));
          const middle = rng() < 0.4 ? "" : randLower(rng, 1, 5, alpha);
          text = chunks.join("") + middle + chunks.slice().reverse().join("");
          if (!text.length) text = randLower(rng, 1, 3, alpha);
        } else text = randLower(rng, 1, pick(rng, [3, 10, 30]), alpha);
        return { input: `"${text}"`, expectedOutput: String(ref(text)) };
      },
      solutions: {
        python: code`
          def longestDecomposition(text: str) -> int:
              n = len(text)
              count = 0
              start = 0
              for i in range(n):
                  length = i - start + 1
                  if text[start:i + 1] == text[n - 1 - i:n - 1 - i + length]:
                      count += 1
                      start = i + 1
              return count
        `,
        javascript: code`
          var longestDecomposition = function(text) {
              var n = text.length, count = 0, start = 0;
              for (var i = 0; i < n; i++) {
                  var len = i - start + 1;
                  if (text.substr(start, len) === text.substr(n - 1 - i, len)) {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function longestDecomposition(text: string): number {
              var n = text.length, count = 0, start = 0;
              for (var i = 0; i < n; i++) {
                  var len = i - start + 1;
                  if (text.substr(start, len) === text.substr(n - 1 - i, len)) {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int longestDecomposition(String text) {
              int n = text.length(), count = 0, start = 0;
              for (int i = 0; i < n; i++) {
                  int len = i - start + 1;
                  if (text.regionMatches(start, text, n - 1 - i, len)) {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int longestDecomposition(string text) {
              int n = text.size(), count = 0, start = 0;
              for (int i = 0; i < n; i++) {
                  int len = i - start + 1;
                  if (text.compare(start, len, text, n - 1 - i, len) == 0) {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          }
        `,
        c: code`
          int longestDecomposition(const char* text) {
              int n = (int) strlen(text), count = 0, start = 0;
              for (int i = 0; i < n; i++) {
                  int len = i - start + 1;
                  if (memcmp(text + start, text + (n - 1 - i), (size_t) len) == 0) {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          public static int LongestDecomposition(string text)
          {
              int n = text.Length, count = 0, start = 0;
              for (int i = 0; i < n; i++)
              {
                  int len = i - start + 1;
                  if (string.CompareOrdinal(text, start, text, n - 1 - i, len) == 0)
                  {
                      count++;
                      start = i + 1;
                  }
              }
              return count;
          }
        `,
        go: code`
          func longestDecomposition(text string) int {
              n, count, start := len(text), 0, 0
              for i := 0; i < n; i++ {
                  l := i - start + 1
                  if text[start:start+l] == text[n-1-i:n-1-i+l] {
                      count++
                      start = i + 1
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun longestDecomposition(text: String): Int {
              val n = text.length
              var count = 0
              var start = 0
              for (i in 0 until n) {
                  val len = i - start + 1
                  if (text.regionMatches(start, text, n - 1 - i, len)) {
                      count++
                      start = i + 1
                  }
              }
              return count
          }
        `,
        swift: code`
          func longestDecomposition(_ text: String) -> Int {
              let a = Array(text.utf8)
              let n = a.count
              var count = 0, start = 0
              for i in 0..<n {
                  let len = i - start + 1
                  if a[start..<(start + len)] == a[(n - 1 - i)..<(n - 1 - i + len)] {
                      count += 1
                      start = i + 1
                  }
              }
              return count
          }
        `,
        rust: code`
          fn longestDecomposition(text: String) -> i32 {
              let a = text.as_bytes();
              let n = a.len();
              let (mut count, mut start) = (0i32, 0usize);
              for i in 0..n {
                  let len = i - start + 1;
                  if a[start..start + len] == a[n - 1 - i..n - 1 - i + len] {
                      count += 1;
                      start = i + 1;
                  }
              }
              count
          }
        `,
        php: code`
          function longestDecomposition($text) {
              $n = strlen($text);
              $count = 0;
              $start = 0;
              for ($i = 0; $i < $n; $i++) {
                  $len = $i - $start + 1;
                  if (substr_compare($text, substr($text, $n - 1 - $i, $len), $start, $len) === 0) {
                      $count++;
                      $start = $i + 1;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def longestDecomposition(text)
            n = text.length
            count = 0
            start = 0
            (0...n).each do |i|
              len = i - start + 1
              if text[start, len] == text[n - 1 - i, len]
                count += 1
                start = i + 1
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Invalid Transactions (LC 1169) ──────────────────────────────
  (() => {
    const ref = (transactions: string[]): string[] => {
      const p = transactions.map((t) => {
        const [name, time, amount, city] = t.split(",");
        return { name, time: Number(time), amount: Number(amount), city };
      });
      return transactions.filter((_, i) =>
        p[i].amount > 1000 ||
        p.some((q, j) => j !== i && q.name === p[i].name && q.city !== p[i].city && Math.abs(q.time - p[i].time) <= 60));
    };
    return {
      slug: "invalid-transactions",
      title: "Invalid Transactions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Sorting", "Bloomberg", "Amazon"],
      signature: {
        funcName: "invalidTransactions",
        params: [{ name: "transactions", type: "string[]" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "Each entry of `transactions` is a string `\"name,time,amount,city\"`: who paid, the minute it happened, the amount and the city.\n\n" +
        "A transaction is **possibly invalid** if either:\n\n" +
        "- its amount is **greater than** `1000`, or\n" +
        "- it happens within (and including) `60` minutes of **another** transaction with the **same name** in a **different city**.\n\n" +
        "Return every possibly invalid transaction, **in the order they appear in `transactions`**. Identical strings at different positions are separate transactions and are reported separately.",
        [
          {
            in: 'transactions = ["kai,20,800,pune","kai,75,100,delhi","ravi,30,1500,pune"]', out: '["kai,20,800,pune","kai,75,100,delhi","ravi,30,1500,pune"]',
            note: "The two `kai` transactions are 55 minutes apart in different cities, so both are flagged; `ravi` spent more than 1000.",
          },
          { in: 'transactions = ["kai,20,800,pune","kai,81,100,delhi"]', out: "[]", note: "61 minutes apart is outside the window." },
          { in: 'transactions = ["asha,10,1001,goa","asha,10,1000,goa"]', out: '["asha,10,1001,goa"]', note: "Same city, and 1000 itself is allowed." },
        ],
        [
          "1 <= transactions.length <= 1000",
          "each transactions[i] has the form \"{name},{time},{amount},{city}\"",
          "each {name} and {city} is 1 to 10 lowercase English letters",
          "each {time} is an integer in [0, 1000]",
          "each {amount} is an integer in [0, 2000]",
        ]),
      hints: [
        "Parse every string once into its four fields.",
        "With at most 1000 transactions, comparing every pair is fast enough: `10^6` checks.",
        "Transaction `i` is flagged if its amount exceeds 1000, or if some `j` has the same name, a different city and `|time_i - time_j| <= 60`. Keep the original strings so you can return them in input order.",
      ],
      editorial: explain({
        idea: "Both rules are local to a transaction and one other transaction, so parse once and test every pair — `n <= 1000` makes the quadratic scan cheap and keeps the output in input order for free.",
        steps: [
          "Split each string on commas into `name`, `time`, `amount`, `city` (converting the numbers).",
          "For each `i`: mark it if `amount > 1000`; otherwise scan all `j` for the same name, a different city and `|time_i - time_j| <= 60`.",
          "Collect the original strings of the marked transactions, in index order.",
        ],
        why: "The two conditions are exactly the definition, and every transaction is checked against every other one, so nothing is missed. The `j != i` case is excluded automatically because a transaction never differs from itself in city.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Both transactions of a conflicting pair are invalid, not just the later one.",
          "The window is inclusive: exactly 60 minutes apart still counts.",
          "Do not de-duplicate — two identical strings are two transactions.",
          "An amount of exactly 1000 is fine; only strictly greater is invalid.",
        ],
      }),
      examples: [
        { input: '["kai,20,800,pune","kai,75,100,delhi","ravi,30,1500,pune"]', expectedOutput: '["kai,20,800,pune","kai,75,100,delhi","ravi,30,1500,pune"]' },
        { input: '["kai,20,800,pune","kai,81,100,delhi"]', expectedOutput: "[]" },
        { input: '["asha,10,1001,goa","asha,10,1000,goa"]', expectedOutput: '["asha,10,1001,goa"]' },
      ],
      gen: (rng: Rng) => {
        const names = ["kai", "asha", "ravi", "bob", "meera"].slice(0, ri(rng, 1, 5));
        const cities = ["pune", "goa", "delhi", "mtv", "beijing"].slice(0, ri(rng, 1, 4));
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25]));
        const span = pick(rng, [60, 200, 1000]);
        const base = ri(rng, 0, 1000 - span);
        const out: string[] = [];
        for (let i = 0; i < n; i++) {
          if (out.length && rng() < 0.1) { out.push(pick(rng, out)); continue; }
          const amount = rng() < 0.15 ? ri(rng, 999, 1002) : ri(rng, 0, pick(rng, [1000, 2000]));
          out.push(`${pick(rng, names)},${base + ri(rng, 0, span)},${amount},${pick(rng, cities)}`);
        }
        return { input: fmtStrArr(out), expectedOutput: fmtStrArr(ref(out)) };
      },
      solutions: {
        python: code`
          from typing import List

          def invalidTransactions(transactions: List[str]) -> List[str]:
              parsed = []
              for t in transactions:
                  name, time, amount, city = t.split(",")
                  parsed.append((name, int(time), int(amount), city))
              res = []
              for i, (name, time, amount, city) in enumerate(parsed):
                  bad = amount > 1000
                  if not bad:
                      for n2, t2, _, c2 in parsed:
                          if n2 == name and c2 != city and abs(t2 - time) <= 60:
                              bad = True
                              break
                  if bad:
                      res.append(transactions[i])
              return res
        `,
        javascript: code`
          var invalidTransactions = function(transactions) {
              var p = [];
              for (var k = 0; k < transactions.length; k++) {
                  var f = transactions[k].split(",");
                  p.push({ name: f[0], time: parseInt(f[1], 10), amount: parseInt(f[2], 10), city: f[3] });
              }
              var res = [];
              for (var i = 0; i < p.length; i++) {
                  var bad = p[i].amount > 1000;
                  for (var j = 0; j < p.length && !bad; j++) {
                      if (p[j].name === p[i].name && p[j].city !== p[i].city && Math.abs(p[j].time - p[i].time) <= 60) bad = true;
                  }
                  if (bad) res.push(transactions[i]);
              }
              return res;
          };
        `,
        typescript: code`
          function invalidTransactions(transactions: string[]): string[] {
              var names: string[] = [], cities: string[] = [], times: number[] = [], amounts: number[] = [];
              for (var k = 0; k < transactions.length; k++) {
                  var f = transactions[k].split(",");
                  names.push(f[0]);
                  times.push(parseInt(f[1], 10));
                  amounts.push(parseInt(f[2], 10));
                  cities.push(f[3]);
              }
              var res: string[] = [];
              for (var i = 0; i < transactions.length; i++) {
                  var bad = amounts[i] > 1000;
                  for (var j = 0; j < transactions.length && !bad; j++) {
                      if (names[j] === names[i] && cities[j] !== cities[i] && Math.abs(times[j] - times[i]) <= 60) bad = true;
                  }
                  if (bad) res.push(transactions[i]);
              }
              return res;
          }
        `,
        java: code`
          public static String[] invalidTransactions(String[] transactions) {
              int n = transactions.length;
              String[] names = new String[n], cities = new String[n];
              int[] times = new int[n], amounts = new int[n];
              for (int k = 0; k < n; k++) {
                  String[] f = transactions[k].split(",");
                  names[k] = f[0];
                  times[k] = Integer.parseInt(f[1]);
                  amounts[k] = Integer.parseInt(f[2]);
                  cities[k] = f[3];
              }
              List<String> res = new ArrayList<>();
              for (int i = 0; i < n; i++) {
                  boolean bad = amounts[i] > 1000;
                  for (int j = 0; j < n && !bad; j++) {
                      if (names[j].equals(names[i]) && !cities[j].equals(cities[i]) && Math.abs(times[j] - times[i]) <= 60) bad = true;
                  }
                  if (bad) res.add(transactions[i]);
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> invalidTransactions(vector<string>& transactions) {
              int n = transactions.size();
              vector<string> names(n), cities(n);
              vector<int> times(n), amounts(n);
              for (int k = 0; k < n; k++) {
                  stringstream ss(transactions[k]);
                  string part;
                  getline(ss, names[k], ',');
                  getline(ss, part, ',');
                  times[k] = stoi(part);
                  getline(ss, part, ',');
                  amounts[k] = stoi(part);
                  getline(ss, cities[k], ',');
              }
              vector<string> res;
              for (int i = 0; i < n; i++) {
                  bool bad = amounts[i] > 1000;
                  for (int j = 0; j < n && !bad; j++) {
                      if (names[j] == names[i] && cities[j] != cities[i] && abs(times[j] - times[i]) <= 60) bad = true;
                  }
                  if (bad) res.push_back(transactions[i]);
              }
              return res;
          }
        `,
        c: code`
          typedef struct {
              char name[16];
              char city[16];
              int time;
              int amount;
          } ItTxn;

          char** invalidTransactions(char** transactions, int transactionsSize, int* returnSize) {
              int n = transactionsSize;
              ItTxn* p = (ItTxn*) malloc(sizeof(ItTxn) * (size_t) (n > 0 ? n : 1));
              for (int k = 0; k < n; k++) {
                  sscanf(transactions[k], "%15[^,],%d,%d,%15s", p[k].name, &p[k].time, &p[k].amount, p[k].city);
              }
              char** res = (char**) malloc(sizeof(char*) * (size_t) (n > 0 ? n : 1));
              int cnt = 0;
              for (int i = 0; i < n; i++) {
                  bool bad = p[i].amount > 1000;
                  for (int j = 0; j < n && !bad; j++) {
                      int gap = p[j].time - p[i].time;
                      if (gap < 0) gap = -gap;
                      if (gap <= 60 && strcmp(p[j].name, p[i].name) == 0 && strcmp(p[j].city, p[i].city) != 0) bad = true;
                  }
                  if (bad) res[cnt++] = transactions[i];
              }
              free(p);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] InvalidTransactions(string[] transactions)
          {
              int n = transactions.Length;
              var names = new string[n];
              var cities = new string[n];
              var times = new int[n];
              var amounts = new int[n];
              for (int k = 0; k < n; k++)
              {
                  var f = transactions[k].Split(',');
                  names[k] = f[0];
                  times[k] = int.Parse(f[1]);
                  amounts[k] = int.Parse(f[2]);
                  cities[k] = f[3];
              }
              var res = new List<string>();
              for (int i = 0; i < n; i++)
              {
                  bool bad = amounts[i] > 1000;
                  for (int j = 0; j < n && !bad; j++)
                  {
                      if (names[j] == names[i] && cities[j] != cities[i] && Math.Abs(times[j] - times[i]) <= 60) bad = true;
                  }
                  if (bad) res.Add(transactions[i]);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func invalidTransactions(transactions []string) []string {
              n := len(transactions)
              names := make([]string, n)
              cities := make([]string, n)
              times := make([]int, n)
              amounts := make([]int, n)
              for k, t := range transactions {
                  f := strings.Split(t, ",")
                  names[k] = f[0]
                  times[k], _ = strconv.Atoi(f[1])
                  amounts[k], _ = strconv.Atoi(f[2])
                  cities[k] = f[3]
              }
              res := []string{}
              for i := 0; i < n; i++ {
                  bad := amounts[i] > 1000
                  for j := 0; j < n && !bad; j++ {
                      gap := times[j] - times[i]
                      if gap < 0 {
                          gap = -gap
                      }
                      if names[j] == names[i] && cities[j] != cities[i] && gap <= 60 {
                          bad = true
                      }
                  }
                  if bad {
                      res = append(res, transactions[i])
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun invalidTransactions(transactions: Array<String>): Array<String> {
              val parts = transactions.map { it.split(",") }
              val res = ArrayList<String>()
              for (i in transactions.indices) {
                  val a = parts[i]
                  var bad = a[2].toInt() > 1000
                  if (!bad) {
                      for (b in parts) {
                          if (b[0] == a[0] && b[3] != a[3] && Math.abs(b[1].toInt() - a[1].toInt()) <= 60) { bad = true; break }
                      }
                  }
                  if (bad) res.add(transactions[i])
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func invalidTransactions(_ transactions: [String]) -> [String] {
              let parts = transactions.map { $0.split(separator: ",").map(String.init) }
              let times = parts.map { Int($0[1])! }
              let amounts = parts.map { Int($0[2])! }
              var res: [String] = []
              for i in 0..<transactions.count {
                  var bad = amounts[i] > 1000
                  var j = 0
                  while !bad && j < transactions.count {
                      if parts[j][0] == parts[i][0] && parts[j][3] != parts[i][3] && abs(times[j] - times[i]) <= 60 { bad = true }
                      j += 1
                  }
                  if bad { res.append(transactions[i]) }
              }
              return res
          }
        `,
        rust: code`
          fn invalidTransactions(transactions: Vec<String>) -> Vec<String> {
              let parts: Vec<Vec<&str>> = transactions.iter().map(|t| t.split(',').collect()).collect();
              let times: Vec<i32> = parts.iter().map(|p| p[1].parse().unwrap()).collect();
              let amounts: Vec<i32> = parts.iter().map(|p| p[2].parse().unwrap()).collect();
              let n = transactions.len();
              let mut res: Vec<String> = Vec::new();
              for i in 0..n {
                  let mut bad = amounts[i] > 1000;
                  let mut j = 0;
                  while !bad && j < n {
                      if parts[j][0] == parts[i][0] && parts[j][3] != parts[i][3] && (times[j] - times[i]).abs() <= 60 {
                          bad = true;
                      }
                      j += 1;
                  }
                  if bad {
                      res.push(transactions[i].clone());
                  }
              }
              res
          }
        `,
        php: code`
          function invalidTransactions($transactions) {
              $p = [];
              foreach ($transactions as $t) $p[] = explode(',', $t);
              $n = count($p);
              $res = [];
              for ($i = 0; $i < $n; $i++) {
                  $bad = (int) $p[$i][2] > 1000;
                  for ($j = 0; $j < $n && !$bad; $j++) {
                      if ($p[$j][0] === $p[$i][0] && $p[$j][3] !== $p[$i][3] && abs((int) $p[$j][1] - (int) $p[$i][1]) <= 60) $bad = true;
                  }
                  if ($bad) $res[] = $transactions[$i];
              }
              return $res;
          }
        `,
        ruby: code`
          def invalidTransactions(transactions)
            p = transactions.map do |t|
              name, time, amount, city = t.split(",")
              [name, time.to_i, amount.to_i, city]
            end
            res = []
            p.each_with_index do |(name, time, amount, city), i|
              bad = amount > 1000 || p.any? { |n2, t2, _, c2| n2 == name && c2 != city && (t2 - time).abs <= 60 }
              res << transactions[i] if bad
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Remove Sub-Folders from the Filesystem (LC 1233) ────────────
  (() => {
    const ref = (folder: string[]): string[] =>
      folder.filter((f) => !folder.some((g) => f.startsWith(g + "/"))).sort();
    return {
      slug: "remove-sub-folders-from-the-filesystem",
      title: "Remove Sub-Folders from the Filesystem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Depth-First Search", "Trie", "Google", "Amazon", "Meta"],
      signature: {
        funcName: "removeSubfolders",
        params: [{ name: "folder", type: "string[]" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "You are given a list of distinct folder paths `folder`. Remove every folder that is a **sub-folder** of another folder in the list, and return the folders that remain **sorted in lexicographic order** (plain character-code order, in which `'/'` comes before every letter).\n\n" +
        "Folder `x` is a sub-folder of folder `y` when `x` starts with `y` followed by a `'/'`. For example `\"/a/b\"` is a sub-folder of `\"/a\"`, but `\"/b\"` is not a sub-folder of `\"/a/b/c\"`, and `\"/ab\"` is not a sub-folder of `\"/a\"`.\n\n" +
        "A path is one or more segments, each a `'/'` followed by one or more lowercase letters.",
        [
          { in: 'folder = ["/kai","/kai/ro","/code/x","/code/x/y","/code/z"]', out: '["/code/x","/code/z","/kai"]', note: '`"/kai/ro"` lives inside `"/kai"` and `"/code/x/y"` inside `"/code/x"`.' },
          { in: 'folder = ["/a","/a/b/c","/a/b/d"]', out: '["/a"]' },
          { in: 'folder = ["/a/b/c","/a/b/ca","/a/b/d"]', out: '["/a/b/c","/a/b/ca","/a/b/d"]', note: '`"/a/b/ca"` starts with `"/a/b/c"` but not with `"/a/b/c/"`.' },
        ],
        [
          "1 <= folder.length <= 4 * 10^4",
          "2 <= folder[i].length <= 100",
          "folder[i] contains only lowercase letters and '/'",
          "folder[i] always starts with the character '/'",
          "each folder name is unique",
        ]),
      hints: [
        "After sorting, every sub-folder comes right after its parent (or after another sub-folder of the same parent).",
        "So walk the sorted list and remember the last folder you **kept**.",
        "A folder is a sub-folder exactly when it starts with that kept folder plus `'/'` — the slash stops `\"/ab\"` from matching `\"/a\"`.",
      ],
      editorial: explain({
        idea: "Sorting puts every folder's descendants directly after it, so one pass that compares each folder with the most recently kept one decides everything.",
        steps: [
          "Sort `folder` lexicographically.",
          "Walk the list; let `last` be the most recently kept folder.",
          "If the current folder starts with `last + '/'`, skip it; otherwise keep it and make it the new `last`.",
          "The kept folders are already in sorted order — return them.",
        ],
        why: "All strings with prefix `y + '/'` are contiguous in sorted order and come right after `y` (any string between `y` and them would have to share the prefix `y` too, and `'/'` sorts before every letter). A folder whose parent is in the list therefore meets a kept ancestor as `last` before any unrelated folder is kept; a top-level folder never starts with `last + '/'`.",
        time: "O(n · L · log n) for the sort, where `L` is the path length",
        space: "O(n) for the output",
        pitfalls: [
          "Checking `startsWith(last)` without the trailing `'/'` wrongly removes `\"/ab\"` after `\"/a\"`.",
          "Compare with the last *kept* folder, not the previous folder in the list.",
          "Sort by character code; a locale-aware sort can order `'/'` differently.",
        ],
      }),
      examples: [
        { input: '["/kai","/kai/ro","/code/x","/code/x/y","/code/z"]', expectedOutput: '["/code/x","/code/z","/kai"]' },
        { input: '["/a","/a/b/c","/a/b/d"]', expectedOutput: '["/a"]' },
        { input: '["/a/b/c","/a/b/ca","/a/b/d"]', expectedOutput: '["/a/b/c","/a/b/ca","/a/b/d"]' },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "xyz"]);
        const set = new Set<string>();
        const want = ri(rng, 1, pick(rng, [1, 4, 10, 20]));
        let guard = 0;
        while (set.size < want && guard++ < 200) {
          const existing = [...set];
          let path: string;
          if (existing.length && rng() < 0.45) path = pick(rng, existing) + "/" + randLower(rng, 1, 2, alpha);
          else {
            path = "";
            const depth = ri(rng, 1, 3);
            for (let d = 0; d < depth; d++) path += "/" + randLower(rng, 1, 2, alpha);
          }
          set.add(path);
        }
        const folder = shuffle(rng, [...set]);
        return { input: fmtStrArr(folder), expectedOutput: fmtStrArr(ref(folder)) };
      },
      solutions: {
        python: code`
          from typing import List

          def removeSubfolders(folder: List[str]) -> List[str]:
              res = []
              for f in sorted(folder):
                  if res and f.startswith(res[-1] + "/"):
                      continue
                  res.append(f)
              return res
        `,
        javascript: code`
          var removeSubfolders = function(folder) {
              var sorted = folder.slice().sort();
              var res = [];
              for (var i = 0; i < sorted.length; i++) {
                  var f = sorted[i];
                  if (res.length) {
                      var last = res[res.length - 1] + "/";
                      if (f.substring(0, last.length) === last) continue;
                  }
                  res.push(f);
              }
              return res;
          };
        `,
        typescript: code`
          function removeSubfolders(folder: string[]): string[] {
              var sorted = folder.slice().sort();
              var res: string[] = [];
              for (var i = 0; i < sorted.length; i++) {
                  var f = sorted[i];
                  if (res.length) {
                      var last = res[res.length - 1] + "/";
                      if (f.substring(0, last.length) === last) continue;
                  }
                  res.push(f);
              }
              return res;
          }
        `,
        java: code`
          public static String[] removeSubfolders(String[] folder) {
              String[] sorted = folder.clone();
              Arrays.sort(sorted);
              List<String> res = new ArrayList<>();
              for (String f : sorted) {
                  if (!res.isEmpty() && f.startsWith(res.get(res.size() - 1) + "/")) continue;
                  res.add(f);
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> removeSubfolders(vector<string>& folder) {
              vector<string> sorted = folder;
              sort(sorted.begin(), sorted.end());
              vector<string> res;
              for (const string& f : sorted) {
                  if (!res.empty()) {
                      const string& last = res.back();
                      if (f.size() > last.size() && f.compare(0, last.size(), last) == 0 && f[last.size()] == '/') continue;
                  }
                  res.push_back(f);
              }
              return res;
          }
        `,
        c: code`
          static int rsfCmp(const void* a, const void* b) {
              return strcmp(*(char* const*) a, *(char* const*) b);
          }

          char** removeSubfolders(char** folder, int folderSize, int* returnSize) {
              char** sorted = (char**) malloc(sizeof(char*) * (size_t) (folderSize > 0 ? folderSize : 1));
              memcpy(sorted, folder, sizeof(char*) * (size_t) folderSize);
              qsort(sorted, (size_t) folderSize, sizeof(char*), rsfCmp);
              char** res = (char**) malloc(sizeof(char*) * (size_t) (folderSize > 0 ? folderSize : 1));
              int cnt = 0;
              for (int i = 0; i < folderSize; i++) {
                  const char* f = sorted[i];
                  if (cnt > 0) {
                      const char* last = res[cnt - 1];
                      size_t len = strlen(last);
                      if (strncmp(f, last, len) == 0 && f[len] == '/') continue;
                  }
                  res[cnt++] = sorted[i];
              }
              free(sorted);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] RemoveSubfolders(string[] folder)
          {
              var sorted = (string[]) folder.Clone();
              Array.Sort(sorted, StringComparer.Ordinal);
              var res = new List<string>();
              foreach (var f in sorted)
              {
                  if (res.Count > 0 && f.StartsWith(res[res.Count - 1] + "/", StringComparison.Ordinal)) continue;
                  res.Add(f);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func removeSubfolders(folder []string) []string {
              sorted := make([]string, len(folder))
              copy(sorted, folder)
              sort.Strings(sorted)
              res := []string{}
              for _, f := range sorted {
                  if len(res) > 0 && strings.HasPrefix(f, res[len(res)-1]+"/") {
                      continue
                  }
                  res = append(res, f)
              }
              return res
          }
        `,
        kotlin: code`
          fun removeSubfolders(folder: Array<String>): Array<String> {
              val res = ArrayList<String>()
              for (f in folder.sorted()) {
                  if (res.isNotEmpty() && f.startsWith(res[res.size - 1] + "/")) continue
                  res.add(f)
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func removeSubfolders(_ folder: [String]) -> [String] {
              let sorted = folder.sorted { Array($0.utf8).lexicographicallyPrecedes(Array($1.utf8)) }
              var res: [String] = []
              for f in sorted {
                  if let last = res.last, f.hasPrefix(last + "/") { continue }
                  res.append(f)
              }
              return res
          }
        `,
        rust: code`
          fn removeSubfolders(folder: Vec<String>) -> Vec<String> {
              let mut sorted = folder.clone();
              sorted.sort();
              let mut res: Vec<String> = Vec::new();
              for f in sorted.into_iter() {
                  if let Some(last) = res.last() {
                      if f.len() > last.len() && f.starts_with(last.as_str()) && f.as_bytes()[last.len()] == b'/' {
                          continue;
                      }
                  }
                  res.push(f);
              }
              res
          }
        `,
        php: code`
          function removeSubfolders($folder) {
              sort($folder, SORT_STRING);
              $res = [];
              foreach ($folder as $f) {
                  if (count($res) > 0) {
                      $last = $res[count($res) - 1] . '/';
                      if (strncmp($f, $last, strlen($last)) === 0) continue;
                  }
                  $res[] = $f;
              }
              return $res;
          }
        `,
        ruby: code`
          def removeSubfolders(folder)
            res = []
            folder.sort.each do |f|
              next if !res.empty? && f.start_with?(res[-1] + "/")
              res << f
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Sum of Beauty of All Substrings (LC 1781) ───────────────────
  (() => {
    const ref = (s: string): number => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        for (let j = i + 1; j <= s.length; j++) {
          const cnt = new Map<string, number>();
          for (const ch of s.slice(i, j)) cnt.set(ch, (cnt.get(ch) || 0) + 1);
          const vals = [...cnt.values()];
          total += Math.max(...vals) - Math.min(...vals);
        }
      }
      return total;
    };
    return {
      slug: "sum-of-beauty-of-all-substrings",
      title: "Sum of Beauty of All Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: { funcName: "beautySum", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The **beauty** of a string is the difference between the number of times its most frequent character appears and the number of times its least frequent character appears — counting only characters that **do** appear.\n\n" +
        "For example, the beauty of `\"abaacc\"` is `3 - 1 = 2` (`a` appears three times, `b` once).\n\n" +
        "Given a string `s`, return the sum of the beauty of **all** of its substrings.",
        [
          { in: 's = "kaaik"', out: "5", note: '`"kaa"`, `"kaai"`, `"kaaik"`, `"aai"` and `"aaik"` each have beauty 1; every other substring has beauty 0.' },
          { in: 's = "abcab"', out: "3", note: '`"abca"`, `"bcab"` and `"abcab"` have beauty 1.' },
          { in: 's = "zz"', out: "0" },
        ],
        ["1 <= s.length <= 500", "s consists of only lowercase English letters"]),
      hints: [
        "There are about `n^2 / 2` substrings — with `n <= 500` you can afford to look at every one, but not to recount each from scratch.",
        "Fix the start `i` and extend the end `j` one character at a time, updating a 26-entry count array.",
        "After each extension, the beauty is the max count minus the smallest **non-zero** count — a 26-step scan.",
      ],
      editorial: explain({
        idea: "Enumerate substrings by start and end, maintaining character counts incrementally so each substring costs only a scan of the 26 counters.",
        steps: [
          "For each start `i`, reset a 26-entry count array.",
          "For each end `j >= i`, increment the count of `s[j]`.",
          "Scan the counts: the largest value minus the smallest non-zero value is this substring's beauty; add it to the total.",
        ],
        why: "Every substring is `s[i..j]` for exactly one pair `i <= j`, and the count array after processing `j` holds exactly the frequencies of `s[i..j]`.",
        time: "O(26 · n^2)",
        space: "O(26)",
        pitfalls: [
          "The minimum ignores letters with count 0 — otherwise every substring missing a letter would look beautiful.",
          "Recounting each substring from scratch is `O(n^3)`.",
        ],
      }),
      examples: [
        { input: '"kaaik"', expectedOutput: "5" },
        { input: '"abcab"', expectedOutput: "3" },
        { input: '"zz"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 5, 15, 30]), pick(rng, ["a", "ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def beautySum(s: str) -> int:
              total = 0
              n = len(s)
              codes = [ord(c) - 97 for c in s]
              for i in range(n):
                  cnt = [0] * 26
                  for j in range(i, n):
                      cnt[codes[j]] += 1
                      total += max(cnt) - min(v for v in cnt if v)
              return total
        `,
        javascript: code`
          var beautySum = function(s) {
              var total = 0, n = s.length;
              for (var i = 0; i < n; i++) {
                  var cnt = new Array(26).fill(0);
                  for (var j = i; j < n; j++) {
                      cnt[s.charCodeAt(j) - 97]++;
                      var mx = 0, mn = n + 1;
                      for (var c = 0; c < 26; c++) {
                          if (cnt[c] === 0) continue;
                          if (cnt[c] > mx) mx = cnt[c];
                          if (cnt[c] < mn) mn = cnt[c];
                      }
                      total += mx - mn;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function beautySum(s: string): number {
              var total = 0, n = s.length;
              for (var i = 0; i < n; i++) {
                  var cnt: number[] = [];
                  for (var z = 0; z < 26; z++) cnt.push(0);
                  for (var j = i; j < n; j++) {
                      cnt[s.charCodeAt(j) - 97]++;
                      var mx = 0, mn = n + 1;
                      for (var c = 0; c < 26; c++) {
                          if (cnt[c] === 0) continue;
                          if (cnt[c] > mx) mx = cnt[c];
                          if (cnt[c] < mn) mn = cnt[c];
                      }
                      total += mx - mn;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int beautySum(String s) {
              int n = s.length(), total = 0;
              for (int i = 0; i < n; i++) {
                  int[] cnt = new int[26];
                  for (int j = i; j < n; j++) {
                      cnt[s.charAt(j) - 'a']++;
                      int mx = 0, mn = Integer.MAX_VALUE;
                      for (int v : cnt) {
                          if (v == 0) continue;
                          mx = Math.max(mx, v);
                          mn = Math.min(mn, v);
                      }
                      total += mx - mn;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int beautySum(string s) {
              int n = s.size(), total = 0;
              for (int i = 0; i < n; i++) {
                  int cnt[26] = {0};
                  for (int j = i; j < n; j++) {
                      cnt[s[j] - 'a']++;
                      int mx = 0, mn = INT_MAX;
                      for (int v : cnt) {
                          if (v == 0) continue;
                          mx = max(mx, v);
                          mn = min(mn, v);
                      }
                      total += mx - mn;
                  }
              }
              return total;
          }
        `,
        c: code`
          int beautySum(const char* s) {
              int n = (int) strlen(s), total = 0;
              for (int i = 0; i < n; i++) {
                  int cnt[26] = {0};
                  for (int j = i; j < n; j++) {
                      cnt[s[j] - 'a']++;
                      int mx = 0, mn = 2147483647;
                      for (int c = 0; c < 26; c++) {
                          if (cnt[c] == 0) continue;
                          if (cnt[c] > mx) mx = cnt[c];
                          if (cnt[c] < mn) mn = cnt[c];
                      }
                      total += mx - mn;
                  }
              }
              return total;
          }
        `,
        csharp: code`
          public static int BeautySum(string s)
          {
              int n = s.Length, total = 0;
              for (int i = 0; i < n; i++)
              {
                  var cnt = new int[26];
                  for (int j = i; j < n; j++)
                  {
                      cnt[s[j] - 'a']++;
                      int mx = 0, mn = int.MaxValue;
                      foreach (int v in cnt)
                      {
                          if (v == 0) continue;
                          if (v > mx) mx = v;
                          if (v < mn) mn = v;
                      }
                      total += mx - mn;
                  }
              }
              return total;
          }
        `,
        go: code`
          func beautySum(s string) int {
              n, total := len(s), 0
              for i := 0; i < n; i++ {
                  var cnt [26]int
                  for j := i; j < n; j++ {
                      cnt[s[j]-'a']++
                      mx, mn := 0, n+1
                      for _, v := range cnt {
                          if v == 0 {
                              continue
                          }
                          if v > mx {
                              mx = v
                          }
                          if v < mn {
                              mn = v
                          }
                      }
                      total += mx - mn
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun beautySum(s: String): Int {
              val n = s.length
              var total = 0
              for (i in 0 until n) {
                  val cnt = IntArray(26)
                  for (j in i until n) {
                      cnt[s[j] - 'a']++
                      var mx = 0
                      var mn = Int.MAX_VALUE
                      for (v in cnt) {
                          if (v == 0) continue
                          if (v > mx) mx = v
                          if (v < mn) mn = v
                      }
                      total += mx - mn
                  }
              }
              return total
          }
        `,
        swift: code`
          func beautySum(_ s: String) -> Int {
              let a = Array(s.utf8).map { Int($0) - 97 }
              let n = a.count
              var total = 0
              for i in 0..<n {
                  var cnt = [Int](repeating: 0, count: 26)
                  for j in i..<n {
                      cnt[a[j]] += 1
                      var mx = 0, mn = Int.max
                      for v in cnt where v > 0 {
                          if v > mx { mx = v }
                          if v < mn { mn = v }
                      }
                      total += mx - mn
                  }
              }
              return total
          }
        `,
        rust: code`
          fn beautySum(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let mut total: i32 = 0;
              for i in 0..n {
                  let mut cnt = [0i32; 26];
                  for j in i..n {
                      cnt[(a[j] - b'a') as usize] += 1;
                      let mut mx = 0;
                      let mut mn = std::i32::MAX;
                      for &v in cnt.iter() {
                          if v == 0 {
                              continue;
                          }
                          mx = mx.max(v);
                          mn = mn.min(v);
                      }
                      total += mx - mn;
                  }
              }
              total
          }
        `,
        php: code`
          function beautySum($s) {
              $n = strlen($s);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  $cnt = array_fill(0, 26, 0);
                  for ($j = $i; $j < $n; $j++) {
                      $cnt[ord($s[$j]) - 97]++;
                      $mx = 0;
                      $mn = PHP_INT_MAX;
                      foreach ($cnt as $v) {
                          if ($v == 0) continue;
                          if ($v > $mx) $mx = $v;
                          if ($v < $mn) $mn = $v;
                      }
                      $total += $mx - $mn;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def beautySum(s)
            codes = s.bytes.map { |b| b - 97 }
            n = codes.length
            total = 0
            (0...n).each do |i|
              cnt = Array.new(26, 0)
              (i...n).each do |j|
                cnt[codes[j]] += 1
                mx = 0
                mn = n + 1
                cnt.each do |v|
                  next if v == 0
                  mx = v if v > mx
                  mn = v if v < mn
                end
                total += mx - mn
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Product of the Length of Two Palindromic Substrings (LC 1960)
  (() => {
    const ref = (s: string): number => {
      const n = s.length;
      const isPal = (a: number, b: number) => { while (a < b) { if (s[a] !== s[b]) return false; a++; b--; } return true; };
      const left = new Array(n).fill(0), right = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = i; j < n; j += 2) if (isPal(i, j)) {
        left[j] = Math.max(left[j], j - i + 1);
        right[i] = Math.max(right[i], j - i + 1);
      }
      for (let i = 1; i < n; i++) left[i] = Math.max(left[i], left[i - 1]);
      for (let i = n - 2; i >= 0; i--) right[i] = Math.max(right[i], right[i + 1]);
      let best = 0;
      for (let i = 0; i + 1 < n; i++) best = Math.max(best, left[i] * right[i + 1]);
      return best;
    };
    return {
      slug: "maximum-product-of-the-length-of-two-palindromic-substrings",
      title: "Maximum Product of the Length of Two Palindromic Substrings",
      difficulty: "HARD" as const,
      tags: ["String", "Rolling Hash", "Hash Table", "Dynamic Programming", "Google"],
      signature: { funcName: "maxProduct", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, choose two **non-overlapping** palindromic substrings, both of **odd** length, and return the **maximum** possible product of their lengths.\n\n" +
        "Formally, pick indices `i <= j < k <= l` such that `s[i..j]` and `s[k..l]` are palindromes and `j - i + 1` and `l - k + 1` are odd; maximise `(j - i + 1) * (l - k + 1)`.\n\n" +
        "A palindrome reads the same forwards and backwards.",
        [
          { in: 's = "kayakaba"', out: "15", note: '`"kayak"` (length 5) and `"aba"` (length 3) do not overlap.' },
          { in: 's = "racecarlevel"', out: "35", note: '`"racecar"` × `"level"` = 7 × 5.' },
          { in: 's = "ab"', out: "1", note: "Two single letters." },
        ],
        ["2 <= s.length <= 9 * 10^4 (LeetCode allows 10^5; capped so the product fits a 32-bit integer)", "s consists of lowercase English letters"]),
      hints: [
        "Split the string at a boundary: the answer is the best odd palindrome entirely left of it times the best one entirely right of it, maximised over all boundaries.",
        "Manacher's algorithm gives, for every centre, the radius of the longest odd palindrome around it in `O(n)` total.",
        "A palindrome of length `L` ending at `e` also gives one of length `L - 2` ending at `e - 1`. Mark each centre's longest palindrome at its end, sweep right-to-left with `-2`, then take prefix maxima; do the mirror for starts.",
      ],
      editorial: explain({
        idea: "Compute `pref[i]` = the longest odd palindrome inside `s[0..i]` and `suf[i]` = the longest inside `s[i..n-1]`; the answer is `max pref[i] · suf[i + 1]`. Manacher's radii make both arrays linear.",
        steps: [
          "Run Manacher's odd-length pass: `d[i]` is the number of characters on each side of centre `i` (counting `i`), so the palindrome there has length `2·d[i] - 1`.",
          "For each centre set `pref[i + d[i] - 1] = max(…, 2·d[i] - 1)` and `suf[i - d[i] + 1] = max(…, 2·d[i] - 1)`.",
          "Sweep `pref` from right to left with `pref[i] = max(pref[i], pref[i + 1] - 2)`, then left to right with prefix maxima. Mirror both sweeps for `suf`.",
          "Return the maximum of `pref[i] · suf[i + 1]` over `0 <= i < n - 1`, using 64-bit arithmetic for the product.",
        ],
        why: "Two non-overlapping substrings are separated by some boundary between `i` and `i + 1`, and for a fixed boundary the best choice on each side is independent. Trimming one character from each end of an odd palindrome leaves an odd palindrome, which is what the `-2` sweeps propagate: after them, `pref[e]` is the longest odd palindrome ending exactly at `e`, and the prefix maxima extend it to anything ending at or before `e`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Only the longest palindrome per centre is recorded; shorter palindromes ending later than another centre's are recovered only by the `-2` sweep — skipping it gives wrong answers.",
          "Both palindromes must have odd length; even palindromes such as `\"bb\"` do not count.",
          "The product can exceed `2^31 - 1` on LeetCode's full limits; compute it in 64 bits.",
        ],
      }),
      examples: [
        { input: '"kayakaba"', expectedOutput: "15" },
        { input: '"racecarlevel"', expectedOutput: "35" },
        { input: '"ab"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        let s: string;
        if (rng() < 0.5) {
          const pal = () => { const h = randLower(rng, 0, 5, alpha); const mid = randLower(rng, 1, 1, alpha); return h + mid + [...h].reverse().join(""); };
          s = randLower(rng, 0, 3, alpha) + pal() + randLower(rng, 0, 3, alpha) + pal() + randLower(rng, 0, 3, alpha);
        } else s = randLower(rng, 2, pick(rng, [2, 6, 15, 30]), alpha);
        if (s.length < 2) s += alpha[0];
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maxProduct(s: str) -> int:
              n = len(s)
              d = [0] * n
              l, r = 0, -1
              for i in range(n):
                  k = 1 if i > r else min(d[l + r - i], r - i + 1)
                  while i - k >= 0 and i + k < n and s[i - k] == s[i + k]:
                      k += 1
                  d[i] = k
                  if i + k - 1 > r:
                      l, r = i - k + 1, i + k - 1
              pref = [0] * n
              suf = [0] * n
              for i in range(n):
                  length = 2 * d[i] - 1
                  e = i + d[i] - 1
                  b = i - d[i] + 1
                  if length > pref[e]:
                      pref[e] = length
                  if length > suf[b]:
                      suf[b] = length
              for i in range(n - 2, -1, -1):
                  pref[i] = max(pref[i], pref[i + 1] - 2)
              for i in range(1, n):
                  pref[i] = max(pref[i], pref[i - 1])
              for i in range(1, n):
                  suf[i] = max(suf[i], suf[i - 1] - 2)
              for i in range(n - 2, -1, -1):
                  suf[i] = max(suf[i], suf[i + 1])
              return max(pref[i] * suf[i + 1] for i in range(n - 1))
        `,
        javascript: code`
          var maxProduct = function(s) {
              var n = s.length, d = new Array(n).fill(0), l = 0, r = -1, i;
              for (i = 0; i < n; i++) {
                  var k = i > r ? 1 : Math.min(d[l + r - i], r - i + 1);
                  while (i - k >= 0 && i + k < n && s[i - k] === s[i + k]) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              var pref = new Array(n).fill(0), suf = new Array(n).fill(0);
              for (i = 0; i < n; i++) {
                  var len = 2 * d[i] - 1, e = i + d[i] - 1, b = i - d[i] + 1;
                  if (len > pref[e]) pref[e] = len;
                  if (len > suf[b]) suf[b] = len;
              }
              for (i = n - 2; i >= 0; i--) pref[i] = Math.max(pref[i], pref[i + 1] - 2);
              for (i = 1; i < n; i++) pref[i] = Math.max(pref[i], pref[i - 1]);
              for (i = 1; i < n; i++) suf[i] = Math.max(suf[i], suf[i - 1] - 2);
              for (i = n - 2; i >= 0; i--) suf[i] = Math.max(suf[i], suf[i + 1]);
              var best = 0;
              for (i = 0; i + 1 < n; i++) best = Math.max(best, pref[i] * suf[i + 1]);
              return best;
          };
        `,
        typescript: code`
          function maxProduct(s: string): number {
              var n = s.length, l = 0, r = -1, i: number;
              var d: number[] = [], pref: number[] = [], suf: number[] = [];
              for (i = 0; i < n; i++) { d.push(0); pref.push(0); suf.push(0); }
              for (i = 0; i < n; i++) {
                  var k = i > r ? 1 : Math.min(d[l + r - i], r - i + 1);
                  while (i - k >= 0 && i + k < n && s.charCodeAt(i - k) === s.charCodeAt(i + k)) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              for (i = 0; i < n; i++) {
                  var len = 2 * d[i] - 1, e = i + d[i] - 1, b = i - d[i] + 1;
                  if (len > pref[e]) pref[e] = len;
                  if (len > suf[b]) suf[b] = len;
              }
              for (i = n - 2; i >= 0; i--) pref[i] = Math.max(pref[i], pref[i + 1] - 2);
              for (i = 1; i < n; i++) pref[i] = Math.max(pref[i], pref[i - 1]);
              for (i = 1; i < n; i++) suf[i] = Math.max(suf[i], suf[i - 1] - 2);
              for (i = n - 2; i >= 0; i--) suf[i] = Math.max(suf[i], suf[i + 1]);
              var best = 0;
              for (i = 0; i + 1 < n; i++) best = Math.max(best, pref[i] * suf[i + 1]);
              return best;
          }
        `,
        java: code`
          public static int maxProduct(String s) {
              int n = s.length();
              int[] d = new int[n];
              for (int i = 0, l = 0, r = -1; i < n; i++) {
                  int k = i > r ? 1 : Math.min(d[l + r - i], r - i + 1);
                  while (i - k >= 0 && i + k < n && s.charAt(i - k) == s.charAt(i + k)) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              int[] pref = new int[n], suf = new int[n];
              for (int i = 0; i < n; i++) {
                  int len = 2 * d[i] - 1;
                  pref[i + d[i] - 1] = Math.max(pref[i + d[i] - 1], len);
                  suf[i - d[i] + 1] = Math.max(suf[i - d[i] + 1], len);
              }
              for (int i = n - 2; i >= 0; i--) pref[i] = Math.max(pref[i], pref[i + 1] - 2);
              for (int i = 1; i < n; i++) pref[i] = Math.max(pref[i], pref[i - 1]);
              for (int i = 1; i < n; i++) suf[i] = Math.max(suf[i], suf[i - 1] - 2);
              for (int i = n - 2; i >= 0; i--) suf[i] = Math.max(suf[i], suf[i + 1]);
              long best = 0;
              for (int i = 0; i + 1 < n; i++) best = Math.max(best, (long) pref[i] * suf[i + 1]);
              return (int) best;
          }
        `,
        cpp: code`
          int maxProduct(string s) {
              int n = s.size();
              vector<int> d(n, 0);
              for (int i = 0, l = 0, r = -1; i < n; i++) {
                  int k = i > r ? 1 : min(d[l + r - i], r - i + 1);
                  while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              vector<int> pref(n, 0), suf(n, 0);
              for (int i = 0; i < n; i++) {
                  int len = 2 * d[i] - 1;
                  pref[i + d[i] - 1] = max(pref[i + d[i] - 1], len);
                  suf[i - d[i] + 1] = max(suf[i - d[i] + 1], len);
              }
              for (int i = n - 2; i >= 0; i--) pref[i] = max(pref[i], pref[i + 1] - 2);
              for (int i = 1; i < n; i++) pref[i] = max(pref[i], pref[i - 1]);
              for (int i = 1; i < n; i++) suf[i] = max(suf[i], suf[i - 1] - 2);
              for (int i = n - 2; i >= 0; i--) suf[i] = max(suf[i], suf[i + 1]);
              long long best = 0;
              for (int i = 0; i + 1 < n; i++) best = max(best, (long long) pref[i] * suf[i + 1]);
              return (int) best;
          }
        `,
        c: code`
          int maxProduct(const char* s) {
              int n = (int) strlen(s);
              int* d = (int*) calloc((size_t) n, sizeof(int));
              int* pref = (int*) calloc((size_t) n, sizeof(int));
              int* suf = (int*) calloc((size_t) n, sizeof(int));
              for (int i = 0, l = 0, r = -1; i < n; i++) {
                  int k = 1;
                  if (i <= r) {
                      k = d[l + r - i];
                      if (r - i + 1 < k) k = r - i + 1;
                  }
                  while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              for (int i = 0; i < n; i++) {
                  int len = 2 * d[i] - 1, e = i + d[i] - 1, b = i - d[i] + 1;
                  if (len > pref[e]) pref[e] = len;
                  if (len > suf[b]) suf[b] = len;
              }
              for (int i = n - 2; i >= 0; i--) if (pref[i + 1] - 2 > pref[i]) pref[i] = pref[i + 1] - 2;
              for (int i = 1; i < n; i++) if (pref[i - 1] > pref[i]) pref[i] = pref[i - 1];
              for (int i = 1; i < n; i++) if (suf[i - 1] - 2 > suf[i]) suf[i] = suf[i - 1] - 2;
              for (int i = n - 2; i >= 0; i--) if (suf[i + 1] > suf[i]) suf[i] = suf[i + 1];
              long long best = 0;
              for (int i = 0; i + 1 < n; i++) {
                  long long p = (long long) pref[i] * suf[i + 1];
                  if (p > best) best = p;
              }
              free(d); free(pref); free(suf);
              return (int) best;
          }
        `,
        csharp: code`
          public static int MaxProduct(string s)
          {
              int n = s.Length;
              var d = new int[n];
              for (int i = 0, l = 0, r = -1; i < n; i++)
              {
                  int k = i > r ? 1 : Math.Min(d[l + r - i], r - i + 1);
                  while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
                  d[i] = k;
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1; }
              }
              var pref = new int[n];
              var suf = new int[n];
              for (int i = 0; i < n; i++)
              {
                  int len = 2 * d[i] - 1;
                  pref[i + d[i] - 1] = Math.Max(pref[i + d[i] - 1], len);
                  suf[i - d[i] + 1] = Math.Max(suf[i - d[i] + 1], len);
              }
              for (int i = n - 2; i >= 0; i--) pref[i] = Math.Max(pref[i], pref[i + 1] - 2);
              for (int i = 1; i < n; i++) pref[i] = Math.Max(pref[i], pref[i - 1]);
              for (int i = 1; i < n; i++) suf[i] = Math.Max(suf[i], suf[i - 1] - 2);
              for (int i = n - 2; i >= 0; i--) suf[i] = Math.Max(suf[i], suf[i + 1]);
              long best = 0;
              for (int i = 0; i + 1 < n; i++) best = Math.Max(best, (long) pref[i] * suf[i + 1]);
              return (int) best;
          }
        `,
        go: code`
          func maxProduct(s string) int {
              n := len(s)
              d := make([]int, n)
              l, r := 0, -1
              for i := 0; i < n; i++ {
                  k := 1
                  if i <= r {
                      k = d[l+r-i]
                      if r-i+1 < k {
                          k = r - i + 1
                      }
                  }
                  for i-k >= 0 && i+k < n && s[i-k] == s[i+k] {
                      k++
                  }
                  d[i] = k
                  if i+k-1 > r {
                      l, r = i-k+1, i+k-1
                  }
              }
              pref := make([]int, n)
              suf := make([]int, n)
              for i := 0; i < n; i++ {
                  length, e, b := 2*d[i]-1, i+d[i]-1, i-d[i]+1
                  if length > pref[e] {
                      pref[e] = length
                  }
                  if length > suf[b] {
                      suf[b] = length
                  }
              }
              for i := n - 2; i >= 0; i-- {
                  if pref[i+1]-2 > pref[i] {
                      pref[i] = pref[i+1] - 2
                  }
              }
              for i := 1; i < n; i++ {
                  if pref[i-1] > pref[i] {
                      pref[i] = pref[i-1]
                  }
              }
              for i := 1; i < n; i++ {
                  if suf[i-1]-2 > suf[i] {
                      suf[i] = suf[i-1] - 2
                  }
              }
              for i := n - 2; i >= 0; i-- {
                  if suf[i+1] > suf[i] {
                      suf[i] = suf[i+1]
                  }
              }
              best := 0
              for i := 0; i+1 < n; i++ {
                  if pref[i]*suf[i+1] > best {
                      best = pref[i] * suf[i+1]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxProduct(s: String): Int {
              val n = s.length
              val d = IntArray(n)
              var l = 0
              var r = -1
              for (i in 0 until n) {
                  var k = if (i > r) 1 else minOf(d[l + r - i], r - i + 1)
                  while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++
                  d[i] = k
                  if (i + k - 1 > r) { l = i - k + 1; r = i + k - 1 }
              }
              val pref = IntArray(n)
              val suf = IntArray(n)
              for (i in 0 until n) {
                  val len = 2 * d[i] - 1
                  pref[i + d[i] - 1] = maxOf(pref[i + d[i] - 1], len)
                  suf[i - d[i] + 1] = maxOf(suf[i - d[i] + 1], len)
              }
              for (i in n - 2 downTo 0) pref[i] = maxOf(pref[i], pref[i + 1] - 2)
              for (i in 1 until n) pref[i] = maxOf(pref[i], pref[i - 1])
              for (i in 1 until n) suf[i] = maxOf(suf[i], suf[i - 1] - 2)
              for (i in n - 2 downTo 0) suf[i] = maxOf(suf[i], suf[i + 1])
              var best = 0L
              for (i in 0 until n - 1) best = maxOf(best, pref[i].toLong() * suf[i + 1])
              return best.toInt()
          }
        `,
        swift: code`
          func maxProduct(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              var d = [Int](repeating: 0, count: n)
              var l = 0, r = -1
              for i in 0..<n {
                  var k = i > r ? 1 : min(d[l + r - i], r - i + 1)
                  while i - k >= 0 && i + k < n && a[i - k] == a[i + k] { k += 1 }
                  d[i] = k
                  if i + k - 1 > r { l = i - k + 1; r = i + k - 1 }
              }
              var pref = [Int](repeating: 0, count: n)
              var suf = [Int](repeating: 0, count: n)
              for i in 0..<n {
                  let len = 2 * d[i] - 1
                  pref[i + d[i] - 1] = max(pref[i + d[i] - 1], len)
                  suf[i - d[i] + 1] = max(suf[i - d[i] + 1], len)
              }
              var i = n - 2
              while i >= 0 { pref[i] = max(pref[i], pref[i + 1] - 2); i -= 1 }
              for j in 1..<n { pref[j] = max(pref[j], pref[j - 1]) }
              for j in 1..<n { suf[j] = max(suf[j], suf[j - 1] - 2) }
              i = n - 2
              while i >= 0 { suf[i] = max(suf[i], suf[i + 1]); i -= 1 }
              var best = 0
              for j in 0..<(n - 1) { best = max(best, pref[j] * suf[j + 1]) }
              return best
          }
        `,
        rust: code`
          fn maxProduct(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len() as i64;
              let mut d = vec![0i64; n as usize];
              let (mut l, mut r) = (0i64, -1i64);
              for i in 0..n {
                  let mut k = if i > r { 1 } else { d[(l + r - i) as usize].min(r - i + 1) };
                  while i - k >= 0 && i + k < n && a[(i - k) as usize] == a[(i + k) as usize] {
                      k += 1;
                  }
                  d[i as usize] = k;
                  if i + k - 1 > r {
                      l = i - k + 1;
                      r = i + k - 1;
                  }
              }
              let nu = n as usize;
              let mut pref = vec![0i64; nu];
              let mut suf = vec![0i64; nu];
              for i in 0..nu {
                  let len = 2 * d[i] - 1;
                  let e = i + d[i] as usize - 1;
                  let b = i + 1 - d[i] as usize;
                  pref[e] = pref[e].max(len);
                  suf[b] = suf[b].max(len);
              }
              for i in (0..nu - 1).rev() {
                  pref[i] = pref[i].max(pref[i + 1] - 2);
              }
              for i in 1..nu {
                  pref[i] = pref[i].max(pref[i - 1]);
              }
              for i in 1..nu {
                  suf[i] = suf[i].max(suf[i - 1] - 2);
              }
              for i in (0..nu - 1).rev() {
                  suf[i] = suf[i].max(suf[i + 1]);
              }
              let mut best = 0i64;
              for i in 0..nu - 1 {
                  best = best.max(pref[i] * suf[i + 1]);
              }
              best as i32
          }
        `,
        php: code`
          function maxProduct($s) {
              $n = strlen($s);
              $d = array_fill(0, $n, 0);
              $l = 0;
              $r = -1;
              for ($i = 0; $i < $n; $i++) {
                  $k = $i > $r ? 1 : min($d[$l + $r - $i], $r - $i + 1);
                  while ($i - $k >= 0 && $i + $k < $n && $s[$i - $k] === $s[$i + $k]) $k++;
                  $d[$i] = $k;
                  if ($i + $k - 1 > $r) { $l = $i - $k + 1; $r = $i + $k - 1; }
              }
              $pref = array_fill(0, $n, 0);
              $suf = array_fill(0, $n, 0);
              for ($i = 0; $i < $n; $i++) {
                  $len = 2 * $d[$i] - 1;
                  $e = $i + $d[$i] - 1;
                  $b = $i - $d[$i] + 1;
                  if ($len > $pref[$e]) $pref[$e] = $len;
                  if ($len > $suf[$b]) $suf[$b] = $len;
              }
              for ($i = $n - 2; $i >= 0; $i--) $pref[$i] = max($pref[$i], $pref[$i + 1] - 2);
              for ($i = 1; $i < $n; $i++) $pref[$i] = max($pref[$i], $pref[$i - 1]);
              for ($i = 1; $i < $n; $i++) $suf[$i] = max($suf[$i], $suf[$i - 1] - 2);
              for ($i = $n - 2; $i >= 0; $i--) $suf[$i] = max($suf[$i], $suf[$i + 1]);
              $best = 0;
              for ($i = 0; $i + 1 < $n; $i++) $best = max($best, $pref[$i] * $suf[$i + 1]);
              return $best;
          }
        `,
        ruby: code`
          def maxProduct(s)
            n = s.length
            d = Array.new(n, 0)
            l = 0
            r = -1
            (0...n).each do |i|
              k = i > r ? 1 : [d[l + r - i], r - i + 1].min
              k += 1 while i - k >= 0 && i + k < n && s[i - k] == s[i + k]
              d[i] = k
              if i + k - 1 > r
                l = i - k + 1
                r = i + k - 1
              end
            end
            pref = Array.new(n, 0)
            suf = Array.new(n, 0)
            (0...n).each do |i|
              len = 2 * d[i] - 1
              e = i + d[i] - 1
              b = i - d[i] + 1
              pref[e] = len if len > pref[e]
              suf[b] = len if len > suf[b]
            end
            (n - 2).downto(0) { |i| pref[i] = [pref[i], pref[i + 1] - 2].max }
            (1...n).each { |i| pref[i] = [pref[i], pref[i - 1]].max }
            (1...n).each { |i| suf[i] = [suf[i], suf[i - 1] - 2].max }
            (n - 2).downto(0) { |i| suf[i] = [suf[i], suf[i + 1]].max }
            (0...n - 1).map { |i| pref[i] * suf[i + 1] }.max
          end
        `,
      },
    };
  })(),

  // ── Counting Words With a Given Prefix (LC 2185) ────────────────
  (() => {
    const ref = (words: string[], pref: string): number => words.filter((w) => w.startsWith(pref)).length;
    return {
      slug: "counting-words-with-a-given-prefix",
      title: "Counting Words With a Given Prefix",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "String Matching", "Amazon", "Google"],
      signature: {
        funcName: "prefixCount",
        params: [{ name: "words", type: "string[]" as const }, { name: "pref", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array of strings `words` and a string `pref`.\n\n" +
        "Return the number of strings in `words` that have `pref` as a **prefix** — that is, that begin with `pref`. A string is a prefix of itself.",
        [
          { in: 'words = ["kairo","kai","code","kaizen"], pref = "kai"', out: "3", note: '`"kairo"`, `"kai"` and `"kaizen"` start with `"kai"`.' },
          { in: 'words = ["leetcode","win","loops","success"], pref = "code"', out: "0", note: "`\"code\"` appears inside `\"leetcode\"` but not at its start." },
          { in: 'words = ["abc"], pref = "abcd"', out: "0", note: "A prefix cannot be longer than the word." },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length, pref.length <= 100", "words[i] and pref consist of lowercase English letters"]),
      hints: [
        "Each word can be checked on its own.",
        "A word has the prefix when it is at least as long as `pref` and its first `|pref|` characters equal `pref`.",
        "Most languages have a built-in `startsWith` for exactly this.",
      ],
      editorial: explain({
        idea: "Test every word with a prefix comparison and count the matches.",
        steps: [
          "Set `count = 0`.",
          "For each word, if it starts with `pref`, increment `count`.",
          "Return `count`.",
        ],
        time: "O(n · |pref|)",
        space: "O(1)",
        pitfalls: [
          "A substring match anywhere in the word is not enough — it must be at the start.",
          "Guard the length when comparing manually: a word shorter than `pref` never matches.",
        ],
      }),
      examples: [
        { input: '["kairo","kai","code","kaizen"]\n"kai"', expectedOutput: "3" },
        { input: '["leetcode","win","loops","success"]\n"code"', expectedOutput: "0" },
        { input: '["abc"]\n"abcd"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc"]);
        const pref = randLower(rng, 1, pick(rng, [1, 2, 4]), alpha);
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const words = Array.from({ length: n }, () => (rng() < 0.4 ? pref + randLower(rng, 0, 4, alpha) : randLower(rng, 1, 6, alpha)));
        return { input: `${fmtStrArr(words)}\n"${pref}"`, expectedOutput: String(ref(words, pref)) };
      },
      solutions: {
        python: code`
          from typing import List

          def prefixCount(words: List[str], pref: str) -> int:
              return sum(1 for w in words if w.startswith(pref))
        `,
        javascript: code`
          var prefixCount = function(words, pref) {
              var count = 0;
              for (var i = 0; i < words.length; i++) {
                  if (words[i].substring(0, pref.length) === pref) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function prefixCount(words: string[], pref: string): number {
              var count = 0;
              for (var i = 0; i < words.length; i++) {
                  if (words[i].substring(0, pref.length) === pref) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int prefixCount(String[] words, String pref) {
              int count = 0;
              for (String w : words) if (w.startsWith(pref)) count++;
              return count;
          }
        `,
        cpp: code`
          int prefixCount(vector<string>& words, string pref) {
              int count = 0;
              for (const string& w : words) {
                  if (w.size() >= pref.size() && w.compare(0, pref.size(), pref) == 0) count++;
              }
              return count;
          }
        `,
        c: code`
          int prefixCount(char** words, int wordsSize, const char* pref) {
              size_t len = strlen(pref);
              int count = 0;
              for (int i = 0; i < wordsSize; i++) {
                  if (strncmp(words[i], pref, len) == 0) count++;
              }
              return count;
          }
        `,
        csharp: code`
          public static int PrefixCount(string[] words, string pref)
          {
              int count = 0;
              foreach (var w in words) if (w.StartsWith(pref, StringComparison.Ordinal)) count++;
              return count;
          }
        `,
        go: code`
          func prefixCount(words []string, pref string) int {
              count := 0
              for _, w := range words {
                  if strings.HasPrefix(w, pref) {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun prefixCount(words: Array<String>, pref: String): Int {
              return words.count { it.startsWith(pref) }
          }
        `,
        swift: code`
          func prefixCount(_ words: [String], _ pref: String) -> Int {
              return words.filter { $0.hasPrefix(pref) }.count
          }
        `,
        rust: code`
          fn prefixCount(words: Vec<String>, pref: String) -> i32 {
              words.iter().filter(|w| w.starts_with(pref.as_str())).count() as i32
          }
        `,
        php: code`
          function prefixCount($words, $pref) {
              $count = 0;
              $len = strlen($pref);
              foreach ($words as $w) {
                  if (strncmp($w, $pref, $len) === 0) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          def prefixCount(words, pref)
            words.count { |w| w.start_with?(pref) }
          end
        `,
      },
    };
  })(),

  // ── Cells in a Range on an Excel Sheet (LC 2194) ────────────────
  (() => {
    const ref = (s: string): string[] => {
      const out: string[] = [];
      for (let c = s.charCodeAt(0); c <= s.charCodeAt(3); c++) {
        for (let r = Number(s[1]); r <= Number(s[4]); r++) out.push(String.fromCharCode(c) + r);
      }
      return out;
    };
    return {
      slug: "cells-in-a-range-on-an-excel-sheet",
      title: "Cells in a Range on an Excel Sheet",
      difficulty: "EASY" as const,
      tags: ["String", "Microsoft", "Amazon"],
      signature: { funcName: "cellsInRange", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "A spreadsheet cell is named by its column letter followed by its row number, like `\"B3\"` (column `B`, row `3`).\n\n" +
        "You are given a range `s = \"<col1><row1>:<col2><row2>\"`, with `col1 <= col2` and `row1 <= row2`. Return every cell `x` with `col1 <= column(x) <= col2` and `row1 <= row(x) <= row2`, as strings, ordered **first by column and then by row**.",
        [
          { in: 's = "B2:C3"', out: '["B2","B3","C2","C3"]', note: "Column B's cells come first, top to bottom, then column C's." },
          { in: 's = "A1:F1"', out: '["A1","B1","C1","D1","E1","F1"]' },
          { in: 's = "Z9:Z9"', out: '["Z9"]' },
        ],
        ["s.length == 5", "'A' <= s[0] <= s[3] <= 'Z'", "'1' <= s[1] <= s[4] <= '9'", "s[2] == ':'", "s consists of uppercase English letters, digits and ':'"]),
      hints: [
        "Read the four characters that matter: the two column letters at indices 0 and 3, and the two row digits at indices 1 and 4.",
        "Two nested loops cover the rectangle — which loop goes outside decides the order.",
        "Columns must change slowest, so loop over columns on the outside and rows inside.",
      ],
      editorial: explain({
        idea: "The range is a rectangle of letters × digits; enumerate it with the column loop outermost so the output is column-major.",
        steps: [
          "For each letter `c` from `s[0]` to `s[3]`:",
          "For each digit `r` from `s[1]` to `s[4]`, append the two-character string `c + r`.",
          "Return the list.",
        ],
        time: "O((col2 - col1 + 1) · (row2 - row1 + 1))",
        space: "O(1) beyond the output",
        pitfalls: [
          "Looping rows on the outside produces row-major order, which is wrong here.",
          "Rows are single digits `1`–`9`, so each cell name is exactly two characters.",
        ],
      }),
      examples: [
        { input: '"B2:C3"', expectedOutput: '["B2","B3","C2","C3"]' },
        { input: '"A1:F1"', expectedOutput: '["A1","B1","C1","D1","E1","F1"]' },
        { input: '"Z9:Z9"', expectedOutput: '["Z9"]' },
      ],
      gen: (rng: Rng) => {
        const c1 = ri(rng, 0, 25), c2 = Math.min(25, c1 + ri(rng, 0, pick(rng, [0, 2, 6, 25])));
        const r1 = ri(rng, 1, 9), r2 = Math.min(9, r1 + ri(rng, 0, pick(rng, [0, 2, 8])));
        const s = `${String.fromCharCode(65 + c1)}${r1}:${String.fromCharCode(65 + c2)}${r2}`;
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def cellsInRange(s: str) -> List[str]:
              return [chr(c) + str(r)
                      for c in range(ord(s[0]), ord(s[3]) + 1)
                      for r in range(int(s[1]), int(s[4]) + 1)]
        `,
        javascript: code`
          var cellsInRange = function(s) {
              var out = [];
              for (var c = s.charCodeAt(0); c <= s.charCodeAt(3); c++) {
                  for (var r = s.charCodeAt(1); r <= s.charCodeAt(4); r++) {
                      out.push(String.fromCharCode(c) + String.fromCharCode(r));
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function cellsInRange(s: string): string[] {
              var out: string[] = [];
              for (var c = s.charCodeAt(0); c <= s.charCodeAt(3); c++) {
                  for (var r = s.charCodeAt(1); r <= s.charCodeAt(4); r++) {
                      out.push(String.fromCharCode(c) + String.fromCharCode(r));
                  }
              }
              return out;
          }
        `,
        java: code`
          public static String[] cellsInRange(String s) {
              List<String> out = new ArrayList<>();
              for (char c = s.charAt(0); c <= s.charAt(3); c++) {
                  for (char r = s.charAt(1); r <= s.charAt(4); r++) {
                      out.add("" + c + r);
                  }
              }
              return out.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> cellsInRange(string s) {
              vector<string> out;
              for (char c = s[0]; c <= s[3]; c++) {
                  for (char r = s[1]; r <= s[4]; r++) {
                      out.push_back(string{c, r});
                  }
              }
              return out;
          }
        `,
        c: code`
          char** cellsInRange(const char* s, int* returnSize) {
              int cols = s[3] - s[0] + 1, rows = s[4] - s[1] + 1;
              char** out = (char**) malloc(sizeof(char*) * (size_t) (cols * rows));
              int n = 0;
              for (char c = s[0]; c <= s[3]; c++) {
                  for (char r = s[1]; r <= s[4]; r++) {
                      char* cell = (char*) malloc(3);
                      cell[0] = c;
                      cell[1] = r;
                      cell[2] = '\0';
                      out[n++] = cell;
                  }
              }
              *returnSize = n;
              return out;
          }
        `,
        csharp: code`
          public static string[] CellsInRange(string s)
          {
              var output = new List<string>();
              for (char c = s[0]; c <= s[3]; c++)
              {
                  for (char r = s[1]; r <= s[4]; r++)
                  {
                      output.Add(new string(new[] { c, r }));
                  }
              }
              return output.ToArray();
          }
        `,
        go: code`
          func cellsInRange(s string) []string {
              out := []string{}
              for c := s[0]; c <= s[3]; c++ {
                  for r := s[1]; r <= s[4]; r++ {
                      out = append(out, string([]byte{c, r}))
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun cellsInRange(s: String): Array<String> {
              val out = ArrayList<String>()
              for (c in s[0]..s[3]) {
                  for (r in s[1]..s[4]) out.add("" + c + r)
              }
              return out.toTypedArray()
          }
        `,
        swift: code`
          func cellsInRange(_ s: String) -> [String] {
              let a = Array(s.utf8)
              var out: [String] = []
              for c in a[0]...a[3] {
                  for r in a[1]...a[4] {
                      out.append(String(decoding: [c, r], as: UTF8.self))
                  }
              }
              return out
          }
        `,
        rust: code`
          fn cellsInRange(s: String) -> Vec<String> {
              let a = s.as_bytes();
              let mut out: Vec<String> = Vec::new();
              for c in a[0]..=a[3] {
                  for r in a[1]..=a[4] {
                      out.push(String::from_utf8(vec![c, r]).unwrap());
                  }
              }
              out
          }
        `,
        php: code`
          function cellsInRange($s) {
              $out = [];
              for ($c = ord($s[0]); $c <= ord($s[3]); $c++) {
                  for ($r = ord($s[1]); $r <= ord($s[4]); $r++) {
                      $out[] = chr($c) . chr($r);
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def cellsInRange(s)
            (s[0]..s[3]).flat_map { |c| (s[1]..s[4]).map { |r| c + r } }
          end
        `,
      },
    };
  })(),

  // ── Apply Discount to Prices (LC 2288) ──────────────────────────
  (() => {
    const ref = (sentence: string, discount: number): string =>
      sentence.split(" ").map((w) => {
        if (!/^\$\d+$/.test(w)) return w;
        const cents = BigInt(w.slice(1)) * BigInt(100 - discount);
        return `$${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, "0")}`;
      }).join(" ");
    return {
      slug: "apply-discount-to-prices",
      title: "Apply Discount to Prices",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Amazon"],
      signature: {
        funcName: "discountPrices",
        params: [{ name: "sentence", type: "string" as const }, { name: "discount", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A **sentence** is a list of words separated by single spaces. A word is a **price** if it is a dollar sign `'$'` followed by one or more digits and nothing else — `\"$100\"`, `\"$23\"` and `\"$6\"` are prices, while `\"100\"`, `\"$\"`, `\"$$5\"` and `\"$1e5\"` are not.\n\n" +
        "Given `sentence` and an integer `discount` (a percentage), apply the discount to every price: replace it with the discounted price written with **exactly two** digits after the decimal point. Leave every other word unchanged and return the new sentence.",
        [
          { in: 'sentence = "pay $250 for 2 kai items $$9", discount = 20', out: "pay $200.00 for 2 kai items $$9", note: "Only `$250` is a price; `$$9` has two dollar signs." },
          { in: 'sentence = "1 2 $3 4 $5 $6 7 8$ $9 $10$", discount = 100', out: "1 2 $0.00 4 $0.00 $0.00 7 8$ $0.00 $10$" },
          { in: 'sentence = "$9999999999 off", discount = 1', out: "$9899999999.01 off", note: "Prices can have ten digits, more than a 32-bit integer holds." },
        ],
        [
          "1 <= sentence.length <= 10^5",
          "sentence consists of lowercase English letters, digits, ' ' and '$'",
          "sentence has no leading or trailing spaces, and words are separated by a single space",
          "every price is a positive number without leading zeros",
          "every price has at most 10 digits",
          "0 <= discount <= 100",
        ]),
      hints: [
        "Split the sentence on spaces and treat each word independently.",
        "A word is a price only if its first character is `'$'`, it has at least one more character, and every remaining character is a digit.",
        "Avoid floating point: `price · (100 - discount)` is the new price in **cents**, an exact integer (up to about 10^12, so use 64 bits). Print `cents / 100`, a dot, and `cents % 100` padded to two digits.",
      ],
      editorial: explain({
        idea: "Recognise prices word by word, and compute the discounted price exactly as an integer number of cents so formatting with two decimals never suffers rounding error.",
        steps: [
          "Split `sentence` on single spaces.",
          "For each word, check that it is `'$'` followed by at least one digit and only digits.",
          "For a price `p`, compute `cents = p · (100 - discount)` in 64-bit arithmetic and rewrite the word as `'$' + (cents / 100) + '.' + two-digit (cents % 100)`.",
          "Join the words back with single spaces.",
        ],
        why: "`p · (100 - discount) / 100` dollars equals `p · (100 - discount)` cents exactly, because both factors are integers — so the two decimals are exact and need no rounding.",
        time: "O(|sentence|)",
        space: "O(|sentence|)",
        pitfalls: [
          "A ten-digit price overflows a 32-bit integer; with a discount it reaches about 10^12 cents.",
          "Floating-point multiplication such as `9999999999 * 0.99` can print the wrong last digit.",
          "`\"$\"` on its own, `\"$$5\"`, `\"5$\"` and `\"$1a\"` are not prices.",
        ],
      }),
      examples: [
        { input: '"pay $250 for 2 kai items $$9"\n20', expectedOutput: "pay $200.00 for 2 kai items $$9" },
        { input: '"1 2 $3 4 $5 $6 7 8$ $9 $10$"\n100', expectedOutput: "1 2 $0.00 4 $0.00 $0.00 7 8$ $0.00 $10$" },
        { input: '"$9999999999 off"\n1', expectedOutput: "$9899999999.01 off" },
      ],
      gen: (rng: Rng) => {
        const price = () => {
          const digits = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
          let p = String(ri(rng, 1, 9));
          for (let i = 1; i < digits; i++) p += String(ri(rng, 0, 9));
          return "$" + p;
        };
        const other = () => pick(rng, [
          () => randLower(rng, 1, 6),
          () => String(ri(rng, 0, 999)),
          () => "$",
          () => "$$" + ri(rng, 0, 99),
          () => ri(rng, 0, 99) + "$",
          () => "$" + ri(rng, 1, 99) + randLower(rng, 1, 2),
          () => randLower(rng, 1, 2) + "$" + ri(rng, 1, 9),
        ])();
        const n = ri(rng, 1, pick(rng, [1, 4, 12]));
        const words = Array.from({ length: n }, () => (rng() < 0.45 ? price() : other()));
        const discount = pick(rng, [0, 100, ri(rng, 0, 100), ri(rng, 0, 100)]);
        const sentence = words.join(" ");
        return { input: `"${sentence}"\n${discount}`, expectedOutput: ref(sentence, discount) };
      },
      solutions: {
        python: code`
          def discountPrices(sentence: str, discount: int) -> str:
              words = sentence.split(" ")
              for i, w in enumerate(words):
                  if len(w) >= 2 and w[0] == "$" and w[1:].isdigit():
                      cents = int(w[1:]) * (100 - discount)
                      words[i] = "$%d.%02d" % (cents // 100, cents % 100)
              return " ".join(words)
        `,
        javascript: code`
          var discountPrices = function(sentence, discount) {
              var words = sentence.split(" ");
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  if (w.length < 2 || w[0] !== "$") continue;
                  var digits = true;
                  for (var j = 1; j < w.length; j++) {
                      if (w[j] < "0" || w[j] > "9") { digits = false; break; }
                  }
                  if (!digits) continue;
                  // At most 10^10 * 100 = 10^12 cents: exact in a double.
                  var cents = Number(w.substring(1)) * (100 - discount);
                  var frac = cents % 100;
                  words[i] = "$" + ((cents - frac) / 100) + "." + (frac < 10 ? "0" : "") + frac;
              }
              return words.join(" ");
          };
        `,
        typescript: code`
          function discountPrices(sentence: string, discount: number): string {
              var words = sentence.split(" ");
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  if (w.length < 2 || w.charAt(0) !== "$") continue;
                  var digits = true;
                  for (var j = 1; j < w.length; j++) {
                      var ch = w.charCodeAt(j);
                      if (ch < 48 || ch > 57) { digits = false; break; }
                  }
                  if (!digits) continue;
                  var cents = Number(w.substring(1)) * (100 - discount);
                  var frac = cents % 100;
                  words[i] = "$" + ((cents - frac) / 100) + "." + (frac < 10 ? "0" : "") + frac;
              }
              return words.join(" ");
          }
        `,
        java: code`
          public static String discountPrices(String sentence, int discount) {
              String[] words = sentence.split(" ");
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < words.length; i++) {
                  if (i > 0) sb.append(' ');
                  String w = words[i];
                  boolean price = w.length() >= 2 && w.charAt(0) == '$';
                  for (int j = 1; j < w.length() && price; j++) if (!Character.isDigit(w.charAt(j))) price = false;
                  if (!price) {
                      sb.append(w);
                      continue;
                  }
                  long cents = Long.parseLong(w.substring(1)) * (100 - discount);
                  sb.append(String.format("$%d.%02d", cents / 100, cents % 100));
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string discountPrices(string sentence, int discount) {
              stringstream ss(sentence);
              string w, out;
              bool first = true;
              while (ss >> w) {
                  if (!first) out += ' ';
                  first = false;
                  bool price = w.size() >= 2 && w[0] == '$';
                  for (size_t j = 1; j < w.size() && price; j++) if (!isdigit((unsigned char) w[j])) price = false;
                  if (!price) {
                      out += w;
                      continue;
                  }
                  long long cents = stoll(w.substr(1)) * (100 - discount);
                  char buf[32];
                  snprintf(buf, sizeof(buf), "$%lld.%02lld", cents / 100, cents % 100);
                  out += buf;
              }
              return out;
          }
        `,
        c: code`
          char* discountPrices(const char* sentence, int discount) {
              size_t n = strlen(sentence);
              char* out = (char*) malloc(n * 3 + 32);
              size_t o = 0, i = 0;
              while (i <= n) {
                  size_t j = i;
                  while (j < n && sentence[j] != ' ') j++;
                  // the word is sentence[i .. j)
                  int price = j - i >= 2 && sentence[i] == '$';
                  for (size_t k = i + 1; k < j && price; k++) if (sentence[k] < '0' || sentence[k] > '9') price = 0;
                  if (price) {
                      long long p = 0;
                      for (size_t k = i + 1; k < j; k++) p = p * 10 + (sentence[k] - '0');
                      long long cents = p * (100 - discount);
                      o += (size_t) sprintf(out + o, "$%lld.%02lld", cents / 100, cents % 100);
                  } else {
                      memcpy(out + o, sentence + i, j - i);
                      o += j - i;
                  }
                  if (j < n) out[o++] = ' ';
                  i = j + 1;
              }
              out[o] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string DiscountPrices(string sentence, int discount)
          {
              var words = sentence.Split(' ');
              for (int i = 0; i < words.Length; i++)
              {
                  string w = words[i];
                  bool price = w.Length >= 2 && w[0] == '$';
                  for (int j = 1; j < w.Length && price; j++) if (w[j] < '0' || w[j] > '9') price = false;
                  if (!price) continue;
                  long cents = long.Parse(w.Substring(1)) * (100 - discount);
                  words[i] = "$" + (cents / 100) + "." + (cents % 100).ToString("D2");
              }
              return string.Join(" ", words);
          }
        `,
        go: code`
          func discountPrices(sentence string, discount int) string {
              words := strings.Split(sentence, " ")
              for i, w := range words {
                  if len(w) < 2 || w[0] != '$' {
                      continue
                  }
                  price := true
                  for j := 1; j < len(w); j++ {
                      if w[j] < '0' || w[j] > '9' {
                          price = false
                          break
                      }
                  }
                  if !price {
                      continue
                  }
                  p, _ := strconv.ParseInt(w[1:], 10, 64)
                  cents := p * int64(100-discount)
                  words[i] = fmt.Sprintf("$%d.%02d", cents/100, cents%100)
              }
              return strings.Join(words, " ")
          }
        `,
        kotlin: code`
          fun discountPrices(sentence: String, discount: Int): String {
              val words = sentence.split(" ").toMutableList()
              for (i in words.indices) {
                  val w = words[i]
                  if (w.length < 2 || w[0] != '$' || !w.substring(1).all { it in '0'..'9' }) continue
                  val cents = w.substring(1).toLong() * (100 - discount)
                  val sb = StringBuilder()
                  sb.append('$').append(cents / 100).append('.')
                  if (cents % 100 < 10) sb.append('0')
                  sb.append(cents % 100)
                  words[i] = sb.toString()
              }
              return words.joinToString(" ")
          }
        `,
        swift: code`
          func discountPrices(_ sentence: String, _ discount: Int) -> String {
              var words = sentence.split(separator: " ", omittingEmptySubsequences: false).map(String.init)
              for i in 0..<words.count {
                  let w = Array(words[i].utf8)
                  if w.count < 2 || w[0] != 36 { continue }   // 36 is '$'
                  var p = 0
                  var price = true
                  for k in 1..<w.count {
                      if w[k] < 48 || w[k] > 57 { price = false; break }
                      p = p * 10 + Int(w[k] - 48)
                  }
                  if !price { continue }
                  let cents = p * (100 - discount)
                  let frac = cents % 100
                  words[i] = "$" + String(cents / 100) + "." + (frac < 10 ? "0" : "") + String(frac)
              }
              return words.joined(separator: " ")
          }
        `,
        rust: code`
          fn discountPrices(sentence: String, discount: i32) -> String {
              let words: Vec<String> = sentence
                  .split(' ')
                  .map(|w| {
                      let b = w.as_bytes();
                      if b.len() < 2 || b[0] != b'$' || !b[1..].iter().all(|c| c.is_ascii_digit()) {
                          return w.to_string();
                      }
                      let p: i64 = w[1..].parse().unwrap();
                      let cents = p * (100 - discount) as i64;
                      let mut s = String::from("$");
                      s.push_str(&format!("{}.{:02}", cents / 100, cents % 100));
                      s
                  })
                  .collect();
              words.join(" ")
          }
        `,
        php: code`
          function discountPrices($sentence, $discount) {
              $words = explode(' ', $sentence);
              foreach ($words as $i => $w) {
                  if (preg_match('/^\$[0-9]+$/', $w)) {
                      $cents = intval(substr($w, 1)) * (100 - $discount);
                      $words[$i] = sprintf('$%d.%02d', intdiv($cents, 100), $cents % 100);
                  }
              }
              return implode(' ', $words);
          }
        `,
        ruby: code`
          def discountPrices(sentence, discount)
            sentence.split(" ", -1).map do |w|
              if w =~ /\A\$\d+\z/
                cents = w[1..].to_i * (100 - discount)
                format('$%d.%02d', cents / 100, cents % 100)
              else
                w
              end
            end.join(" ")
          end
        `,
      },
    };
  })(),

  // ── Number of Valid Clock Times (LC 2437) ───────────────────────
  (() => {
    const ref = (time: string): number => {
      let count = 0;
      for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m++) {
        const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        let ok = true;
        for (let i = 0; i < 5; i++) if (time[i] !== "?" && time[i] !== t[i]) ok = false;
        if (ok) count++;
      }
      return count;
    };
    return {
      slug: "number-of-valid-clock-times",
      title: "Number of Valid Clock Times",
      difficulty: "EASY" as const,
      tags: ["String", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "countTime", params: [{ name: "time", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `time` of length 5 in the form `\"hh:mm\"`, where some of the digits may have been replaced by `'?'`. The earliest possible time is `\"00:00\"` and the latest is `\"23:59\"`.\n\n" +
        "Return the number of valid clock times that can be produced by replacing every `'?'` with a digit from `0` to `9`.",
        [
          { in: 'time = "?5:00"', out: "2", note: "`05:00` and `15:00` are valid; `25:00` is not." },
          { in: 'time = "0?:0?"', out: "100", note: "10 choices for each `?`." },
          { in: 'time = "??:??"', out: "1440", note: "Every minute of the day: 24 × 60." },
        ],
        ["time is a valid string of length 5 in the format \"hh:mm\"", "\"00\" <= hh <= \"23\"", "\"00\" <= mm <= \"59\"", "some of the digits might be replaced with '?'"]),
      hints: [
        "The hour and the minutes are independent: the answer is (number of valid hours) × (number of valid minutes).",
        "Minutes: a `?` in the tens place has 6 choices (0–5), a `?` in the ones place has 10.",
        "Hours are the tricky part — the ones digit is limited to 0–3 when the tens digit is 2. Or simply try all 24 hours and see which match the pattern.",
      ],
      editorial: explain({
        idea: "Count matching hours and matching minutes separately and multiply — the two halves of the clock do not constrain each other.",
        steps: [
          "Count the hours `h` in `0..23` whose two digits match `time[0..1]` (a `?` matches any digit).",
          "Count the minutes `m` in `0..59` whose two digits match `time[3..4]`.",
          "Return the product.",
        ],
        why: "A time is valid exactly when its hour part is a valid hour and its minute part a valid minute, and the `?` positions of the two parts are disjoint, so the choices multiply.",
        time: "O(24 + 60)",
        space: "O(1)",
        pitfalls: [
          "`\"2?\"` allows only 20–23 (4 choices), while `\"?4\"` allows only 04 and 14 (2 choices).",
          "`\"??\"` for the hour is 24 choices, not 3 × 10.",
        ],
      }),
      examples: [
        { input: '"?5:00"', expectedOutput: "2" },
        { input: '"0?:0?"', expectedOutput: "100" },
        { input: '"??:??"', expectedOutput: "1440" },
      ],
      gen: (rng: Rng) => {
        const h = ri(rng, 0, 23), m = ri(rng, 0, 59);
        const chars = [...`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`];
        const p = pick(rng, [0.2, 0.5, 0.8]);
        for (const i of [0, 1, 3, 4]) if (rng() < p) chars[i] = "?";
        const time = chars.join("");
        return { input: `"${time}"`, expectedOutput: String(ref(time)) };
      },
      solutions: {
        python: code`
          def countTime(time: str) -> int:
              def matches(value, pattern):
                  s = "%02d" % value
                  return all(p == "?" or p == c for p, c in zip(pattern, s))

              hours = sum(1 for h in range(24) if matches(h, time[:2]))
              minutes = sum(1 for m in range(60) if matches(m, time[3:]))
              return hours * minutes
        `,
        javascript: code`
          var countTime = function(time) {
              var fits = function(value, a, b) {
                  var t = String(Math.floor(value / 10)), o = String(value % 10);
                  return (a === "?" || a === t) && (b === "?" || b === o);
              };
              var hours = 0, minutes = 0;
              for (var h = 0; h < 24; h++) if (fits(h, time[0], time[1])) hours++;
              for (var m = 0; m < 60; m++) if (fits(m, time[3], time[4])) minutes++;
              return hours * minutes;
          };
        `,
        typescript: code`
          function countTime(time: string): number {
              var fits = function(value: number, a: string, b: string): boolean {
                  var t = String(Math.floor(value / 10)), o = String(value % 10);
                  return (a === "?" || a === t) && (b === "?" || b === o);
              };
              var hours = 0, minutes = 0;
              for (var h = 0; h < 24; h++) if (fits(h, time.charAt(0), time.charAt(1))) hours++;
              for (var m = 0; m < 60; m++) if (fits(m, time.charAt(3), time.charAt(4))) minutes++;
              return hours * minutes;
          }
        `,
        java: code`
          static boolean ctFits(int value, char a, char b) {
              return (a == '?' || a - '0' == value / 10) && (b == '?' || b - '0' == value % 10);
          }

          public static int countTime(String time) {
              int hours = 0, minutes = 0;
              for (int h = 0; h < 24; h++) if (ctFits(h, time.charAt(0), time.charAt(1))) hours++;
              for (int m = 0; m < 60; m++) if (ctFits(m, time.charAt(3), time.charAt(4))) minutes++;
              return hours * minutes;
          }
        `,
        cpp: code`
          static bool ctFits(int value, char a, char b) {
              return (a == '?' || a - '0' == value / 10) && (b == '?' || b - '0' == value % 10);
          }

          int countTime(string time) {
              int hours = 0, minutes = 0;
              for (int h = 0; h < 24; h++) if (ctFits(h, time[0], time[1])) hours++;
              for (int m = 0; m < 60; m++) if (ctFits(m, time[3], time[4])) minutes++;
              return hours * minutes;
          }
        `,
        c: code`
          static bool ctFits(int value, char a, char b) {
              return (a == '?' || a - '0' == value / 10) && (b == '?' || b - '0' == value % 10);
          }

          int countTime(const char* time) {
              int hours = 0, minutes = 0;
              for (int h = 0; h < 24; h++) if (ctFits(h, time[0], time[1])) hours++;
              for (int m = 0; m < 60; m++) if (ctFits(m, time[3], time[4])) minutes++;
              return hours * minutes;
          }
        `,
        csharp: code`
          static bool CtFits(int value, char a, char b)
          {
              return (a == '?' || a - '0' == value / 10) && (b == '?' || b - '0' == value % 10);
          }

          public static int CountTime(string time)
          {
              int hours = 0, minutes = 0;
              for (int h = 0; h < 24; h++) if (CtFits(h, time[0], time[1])) hours++;
              for (int m = 0; m < 60; m++) if (CtFits(m, time[3], time[4])) minutes++;
              return hours * minutes;
          }
        `,
        go: code`
          func ctFits(value int, a, b byte) bool {
              return (a == '?' || int(a-'0') == value/10) && (b == '?' || int(b-'0') == value%10)
          }

          func countTime(time string) int {
              hours, minutes := 0, 0
              for h := 0; h < 24; h++ {
                  if ctFits(h, time[0], time[1]) {
                      hours++
                  }
              }
              for m := 0; m < 60; m++ {
                  if ctFits(m, time[3], time[4]) {
                      minutes++
                  }
              }
              return hours * minutes
          }
        `,
        kotlin: code`
          fun ctFits(value: Int, a: Char, b: Char): Boolean {
              return (a == '?' || a - '0' == value / 10) && (b == '?' || b - '0' == value % 10)
          }

          fun countTime(time: String): Int {
              val hours = (0 until 24).count { ctFits(it, time[0], time[1]) }
              val minutes = (0 until 60).count { ctFits(it, time[3], time[4]) }
              return hours * minutes
          }
        `,
        swift: code`
          func ctFits(_ value: Int, _ a: UInt8, _ b: UInt8) -> Bool {
              // 63 is '?', 48 is '0'
              return (a == 63 || Int(a) - 48 == value / 10) && (b == 63 || Int(b) - 48 == value % 10)
          }

          func countTime(_ time: String) -> Int {
              let t = Array(time.utf8)
              let hours = (0..<24).filter { ctFits($0, t[0], t[1]) }.count
              let minutes = (0..<60).filter { ctFits($0, t[3], t[4]) }.count
              return hours * minutes
          }
        `,
        rust: code`
          fn ct_fits(value: i32, a: u8, b: u8) -> bool {
              (a == b'?' || (a - b'0') as i32 == value / 10) && (b == b'?' || (b - b'0') as i32 == value % 10)
          }

          fn countTime(time: String) -> i32 {
              let t = time.as_bytes();
              let hours = (0..24).filter(|&h| ct_fits(h, t[0], t[1])).count() as i32;
              let minutes = (0..60).filter(|&m| ct_fits(m, t[3], t[4])).count() as i32;
              hours * minutes
          }
        `,
        php: code`
          function ctFits($value, $a, $b) {
              return ($a === '?' || intval($a) === intdiv($value, 10)) && ($b === '?' || intval($b) === $value % 10);
          }

          function countTime($time) {
              $hours = 0;
              $minutes = 0;
              for ($h = 0; $h < 24; $h++) if (ctFits($h, $time[0], $time[1])) $hours++;
              for ($m = 0; $m < 60; $m++) if (ctFits($m, $time[3], $time[4])) $minutes++;
              return $hours * $minutes;
          }
        `,
        ruby: code`
          def ct_fits(value, a, b)
            (a == "?" || a.to_i == value / 10) && (b == "?" || b.to_i == value % 10)
          end

          def countTime(time)
            hours = (0...24).count { |h| ct_fits(h, time[0], time[1]) }
            minutes = (0...60).count { |m| ct_fits(m, time[3], time[4]) }
            hours * minutes
          end
        `,
      },
    };
  })(),

  // ── Determine if Two Events Have Conflict (LC 2446) ─────────────
  (() => {
    const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const ref = (e1: string[], e2: string[]): boolean => {
      for (let t = mins(e1[0]); t <= mins(e1[1]); t++) if (t >= mins(e2[0]) && t <= mins(e2[1])) return true;
      return false;
    };
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    return {
      slug: "determine-if-two-events-have-conflict",
      title: "Determine if Two Events Have Conflict",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google"],
      signature: {
        funcName: "haveConflict",
        params: [{ name: "event1", type: "string[]" as const }, { name: "event2", type: "string[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Two events happen on the same day: `event1 = [startTime1, endTime1]` and `event2 = [startTime2, endTime2]`, with every time written as `\"HH:MM\"` in 24-hour format. Both ends are **inclusive**.\n\n" +
        "Two events **conflict** when they share at least one moment. Return `true` if the events conflict and `false` otherwise.",
        [
          { in: 'event1 = ["09:30","10:00"], event2 = ["10:00","11:15"]', out: "true", note: "They touch at exactly 10:00, and both ends are inclusive." },
          { in: 'event1 = ["08:00","09:00"], event2 = ["08:45","08:50"]', out: "true", note: "The second event lies inside the first." },
          { in: 'event1 = ["13:00","14:00"], event2 = ["14:01","15:00"]', out: "false" },
        ],
        [
          "event1.length == event2.length == 2",
          "event1[i].length == event2[i].length == 5",
          "startTime1 <= endTime1",
          "startTime2 <= endTime2",
          "all times are valid 24-hour times \"HH:MM\"",
        ]),
      hints: [
        "It is easier to decide when two intervals do **not** overlap.",
        "They are disjoint exactly when one ends before the other starts: `end1 < start2` or `end2 < start1`.",
        "Zero-padded `\"HH:MM\"` strings compare in the same order as the times themselves, so no parsing is needed.",
      ],
      editorial: explain({
        idea: "Two closed intervals overlap unless one finishes strictly before the other begins; fixed-width time strings can be compared directly.",
        steps: [
          "If `endTime1 < startTime2`, the first event is over before the second starts — return `false`.",
          "If `endTime2 < startTime1`, the reverse — return `false`.",
          "Otherwise return `true`.",
        ],
        why: "If neither event ends before the other starts, then `max(start1, start2) <= min(end1, end2)`, and that moment belongs to both. Because every time has the same `HH:MM` width with leading zeros, lexicographic order equals chronological order.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "The ends are inclusive: events that touch at one minute conflict.",
          "Checking only whether a start lies inside the other interval misses the case where one event contains the other — unless both directions are checked.",
        ],
      }),
      examples: [
        { input: '["09:30","10:00"]\n["10:00","11:15"]', expectedOutput: "true" },
        { input: '["08:00","09:00"]\n["08:45","08:50"]', expectedOutput: "true" },
        { input: '["13:00","14:00"]\n["14:01","15:00"]', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [5, 120, 1439]);
        const base = ri(rng, 0, 1439 - span);
        const ev = () => {
          let a = base + ri(rng, 0, span), b = base + ri(rng, 0, span);
          if (a > b) [a, b] = [b, a];
          return [fmt(a), fmt(b)];
        };
        const e1 = ev(), e2 = ev();
        return { input: `${fmtStrArr(e1)}\n${fmtStrArr(e2)}`, expectedOutput: bool(ref(e1, e2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def haveConflict(event1: List[str], event2: List[str]) -> bool:
              return not (event1[1] < event2[0] or event2[1] < event1[0])
        `,
        javascript: code`
          var haveConflict = function(event1, event2) {
              return !(event1[1] < event2[0] || event2[1] < event1[0]);
          };
        `,
        typescript: code`
          function haveConflict(event1: string[], event2: string[]): boolean {
              return !(event1[1] < event2[0] || event2[1] < event1[0]);
          }
        `,
        java: code`
          public static boolean haveConflict(String[] event1, String[] event2) {
              return !(event1[1].compareTo(event2[0]) < 0 || event2[1].compareTo(event1[0]) < 0);
          }
        `,
        cpp: code`
          bool haveConflict(vector<string>& event1, vector<string>& event2) {
              return !(event1[1] < event2[0] || event2[1] < event1[0]);
          }
        `,
        c: code`
          bool haveConflict(char** event1, int event1Size, char** event2, int event2Size) {
              return !(strcmp(event1[1], event2[0]) < 0 || strcmp(event2[1], event1[0]) < 0);
          }
        `,
        csharp: code`
          public static bool HaveConflict(string[] event1, string[] event2)
          {
              return !(string.CompareOrdinal(event1[1], event2[0]) < 0 || string.CompareOrdinal(event2[1], event1[0]) < 0);
          }
        `,
        go: code`
          func haveConflict(event1 []string, event2 []string) bool {
              return !(event1[1] < event2[0] || event2[1] < event1[0])
          }
        `,
        kotlin: code`
          fun haveConflict(event1: Array<String>, event2: Array<String>): Boolean {
              return !(event1[1] < event2[0] || event2[1] < event1[0])
          }
        `,
        swift: code`
          func haveConflict(_ event1: [String], _ event2: [String]) -> Bool {
              return !(event1[1] < event2[0] || event2[1] < event1[0])
          }
        `,
        rust: code`
          fn haveConflict(event1: Vec<String>, event2: Vec<String>) -> bool {
              !(event1[1] < event2[0] || event2[1] < event1[0])
          }
        `,
        php: code`
          function haveConflict($event1, $event2) {
              return !(strcmp($event1[1], $event2[0]) < 0 || strcmp($event2[1], $event1[0]) < 0);
          }
        `,
        ruby: code`
          def haveConflict(event1, event2)
            !(event1[1] < event2[0] || event2[1] < event1[0])
          end
        `,
      },
    };
  })(),
];
