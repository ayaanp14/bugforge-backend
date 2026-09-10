/**
 * Graphs, grids and union-find, second wave — the BFS/DFS and connectivity
 * questions that dominate Amazon and Google onsites, plus the word-ladder
 * style shortest-path puzzles.
 * Company names ride in `tags`.
 *
 * Character grids arrive as `string[]` (one string per row) because the driver
 * has no char-matrix type; the questions are otherwise unchanged.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

/** A random 0/1 grid with fixed dimensions — ragged rows break the driver. */
const randGrid = (rng: Rng, rows: number, cols: number, lo: number, hi: number) =>
  Array.from({ length: rows }, () => randArr(rng, cols, lo, hi));

/** A random simple undirected edge list over n labelled nodes. */
const randEdges = (rng: Rng, n: number, maxEdges: number) => {
  const seen = new Set<string>();
  const edges: number[][] = [];
  let attempts = 0;
  while (edges.length < maxEdges && attempts < maxEdges * 4) {
    attempts++;
    const a = ri(rng, 0, n - 1);
    const b = ri(rng, 0, n - 1);
    if (a === b) continue;
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([a, b]);
  }
  return edges;
};

export const GRAPHS2_PROBLEMS: CatalogProblem[] = [

  // ── Number of Connected Components in an Undirected Graph ───────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const parent: number[] = [];
      for (let i = 0; i < n; i++) parent.push(i);
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        let c = x;
        while (parent[c] !== c) {
          const next = parent[c];
          parent[c] = r;
          c = next;
        }
        return r;
      };
      let components = n;
      for (let i = 0; i < edges.length; i++) {
        const a = find(edges[i][0]);
        const b = find(edges[i][1]);
        if (a !== b) {
          parent[a] = b;
          components--;
        }
      }
      return components;
    };
    return {
      slug: "number-of-connected-components-in-an-undirected-graph",
      title: "Number of Connected Components in an Undirected Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google", "Meta"],
      signature: { funcName: "countComponents", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` nodes labelled `0` through `n - 1` and a list of undirected `edges`, where `edges[i] = [a, b]` joins nodes `a` and `b`.\n\nReturn the number of connected components in the graph.",
        [
          { in: "n = 5, edges = [[0,1],[1,2],[3,4]]", out: "2" },
          { in: "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]", out: "1" },
          { in: "n = 3, edges = []", out: "3" },
        ],
        ["1 <= n <= 40", "0 <= edges.length <= 60", "There are no duplicate edges and no self-loops."]),
      hints: [
        "Start from `n` components and merge as you process edges.",
        "Union-find with path compression makes each merge nearly constant time.",
        "Every edge that joins two **different** roots reduces the component count by one.",
      ],
      examples: [
        { input: "5\n[[0,1],[1,2],[3,4]]", expectedOutput: "2" },
        { input: "5\n[[0,1],[1,2],[2,3],[3,4]]", expectedOutput: "1" },
        { input: "3\n[]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const edges = randEdges(rng, n, ri(rng, 0, Math.min(60, n * 2)));
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `def countComponents(n: int, edges) -> int:\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    components = n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n            components -= 1\n    return components`,
        javascript: `var countComponents = function(n, edges) {\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    const find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    let components = n;\n    for (let i = 0; i < edges.length; i++) {\n        const a = find(edges[i][0]);\n        const b = find(edges[i][1]);\n        if (a !== b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components;\n};`,
              typescript: `function countComponents(n: number, edges: number[][]): number {\n    var parent: number[] = [];\n    for (var i = 0; i < n; i++) parent.push(i);\n    var find = function (x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var components = n;\n    for (var j = 0; j < edges.length; j++) {\n        var a = find(edges[j][0]);\n        var b = find(edges[j][1]);\n        if (a !== b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components;\n}`,
              java: `public static int countComponents(int n, int[][] edges) {\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (int[] e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components;\n}\n\nprivate static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}`,
              cpp: `static int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countComponents(int n, vector<vector<int>>& edges) {\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (const auto& e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components;\n}`,
              c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countComponents(int n, int** edges, int edgesSize, int* edgesColSize) {\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (int i = 0; i < edgesSize; i++) {\n        int a = findRootC(parent, edges[i][0]);\n        int b = findRootC(parent, edges[i][1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    free(parent);\n    return components;\n}`,
              csharp: `private static int FindRoot(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int CountComponents(int n, int[][] edges)\n{\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    foreach (int[] e in edges)\n    {\n        int a = FindRoot(parent, e[0]);\n        int b = FindRoot(parent, e[1]);\n        if (a != b)\n        {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components;\n}`,
              go: `func findRoot(parent []int, x int) int {\n	for parent[x] != x {\n		parent[x] = parent[parent[x]]\n		x = parent[x]\n	}\n	return x\n}\n\nfunc countComponents(n int, edges [][]int) int {\n	parent := make([]int, n)\n	for i := range parent {\n		parent[i] = i\n	}\n	components := n\n	for _, e := range edges {\n		a := findRoot(parent, e[0])\n		b := findRoot(parent, e[1])\n		if a != b {\n			parent[a] = b\n			components--\n		}\n	}\n	return components\n}`,
              kotlin: `fun findRoot(parent: IntArray, start: Int): Int {\n    var x = start\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfun countComponents(n: Int, edges: Array<IntArray>): Int {\n    val parent = IntArray(n) { it }\n    var components = n\n    for (e in edges) {\n        val a = findRoot(parent, e[0])\n        val b = findRoot(parent, e[1])\n        if (a != b) {\n            parent[a] = b\n            components--\n        }\n    }\n    return components\n}`,
              swift: `func findRoot(_ parent: inout [Int], _ start: Int) -> Int {\n    var x = start\n    while parent[x] != x {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfunc countComponents(_ n: Int, _ edges: [[Int]]) -> Int {\n    var parent = Array(0..<n)\n    var components = n\n    for e in edges {\n        let a = findRoot(&parent, e[0])\n        let b = findRoot(&parent, e[1])\n        if a != b {\n            parent[a] = b\n            components -= 1\n        }\n    }\n    return components\n}`,
              rust: `fn find_root(parent: &mut Vec<usize>, start: usize) -> usize {\n    let mut x = start;\n    while parent[x] != x {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    x\n}\n\nfn countComponents(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    let size = n as usize;\n    let mut parent: Vec<usize> = (0..size).collect();\n    let mut components = n;\n    for e in edges.iter() {\n        let a = find_root(&mut parent, e[0] as usize);\n        let b = find_root(&mut parent, e[1] as usize);\n        if a != b {\n            parent[a] = b;\n            components -= 1;\n        }\n    }\n    components\n}`,
              php: `function findRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}\n\nfunction countComponents($n, $edges) {\n    $parent = range(0, max($n - 1, 0));\n    $components = $n;\n    foreach ($edges as $e) {\n        $a = findRoot($parent, $e[0]);\n        $b = findRoot($parent, $e[1]);\n        if ($a !== $b) {\n            $parent[$a] = $b;\n            $components--;\n        }\n    }\n    return $components;\n}`,
              ruby: `def find_root(parent, x)\n  while parent[x] != x\n    parent[x] = parent[parent[x]]\n    x = parent[x]\n  end\n  x\nend\n\ndef countComponents(n, edges)\n  parent = (0...n).to_a\n  components = n\n  edges.each do |e|\n    a = find_root(parent, e[0])\n    b = find_root(parent, e[1])\n    if a != b\n      parent[a] = b\n      components -= 1\n    end\n  end\n  components\nend`,
      },
    };
  })(),

  // ── Graph Valid Tree ────────────────────────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      if (edges.length !== n - 1) return false;
      const parent: number[] = [];
      for (let i = 0; i < n; i++) parent.push(i);
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        return r;
      };
      for (let i = 0; i < edges.length; i++) {
        const a = find(edges[i][0]);
        const b = find(edges[i][1]);
        if (a === b) return false;
        parent[a] = b;
      }
      return true;
    };
    return {
      slug: "graph-valid-tree",
      title: "Graph Valid Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google", "Meta", "LinkedIn"],
      signature: { funcName: "validTree", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "You have `n` nodes labelled `0` through `n - 1` and a list of undirected `edges`.\n\nReturn `true` if these edges make a valid **tree** — connected and acyclic.",
        [
          { in: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]", out: "true" },
          { in: "n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]", out: "false", note: "There is a cycle." },
          { in: "n = 4, edges = [[0,1],[2,3]]", out: "false", note: "Not connected." },
        ],
        ["1 <= n <= 40", "0 <= edges.length <= 60", "There are no duplicate edges and no self-loops."]),
      hints: [
        "A tree on `n` nodes has exactly `n - 1` edges — check that first and you rule out most inputs immediately.",
        "With the right edge count, connected and acyclic become the same condition.",
        "So union the edges and reject the moment one joins two nodes already in the same set.",
      ],
      examples: [
        { input: "5\n[[0,1],[0,2],[0,3],[1,4]]", expectedOutput: "true" },
        { input: "5\n[[0,1],[1,2],[2,3],[1,3],[1,4]]", expectedOutput: "false" },
        { input: "4\n[[0,1],[2,3]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        let edges: number[][];
        if (rng() < 0.45) {
          // Build a genuine random tree so "true" shows up often enough.
          edges = [];
          for (let v = 1; v < n; v++) edges.push([ri(rng, 0, v - 1), v]);
          edges = shuffle(rng, edges);
          if (rng() < 0.3 && edges.length > 0) edges.pop();
        } else {
          edges = randEdges(rng, n, ri(rng, 0, Math.min(60, n + 3)));
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: bool(ref(n, edges)) };
      },
      solutions: {
        python: `def validTree(n: int, edges) -> bool:\n    if len(edges) != n - 1:\n        return False\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return False\n        parent[ra] = rb\n    return True`,
        javascript: `var validTree = function(n, edges) {\n    if (edges.length !== n - 1) return false;\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    const find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (let i = 0; i < edges.length; i++) {\n        const a = find(edges[i][0]);\n        const b = find(edges[i][1]);\n        if (a === b) return false;\n        parent[a] = b;\n    }\n    return true;\n};`,
              typescript: `function validTree(n: number, edges: number[][]): boolean {\n    if (edges.length !== n - 1) return false;\n    var parent: number[] = [];\n    for (var i = 0; i < n; i++) parent.push(i);\n    var find = function (x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (var j = 0; j < edges.length; j++) {\n        var a = find(edges[j][0]);\n        var b = find(edges[j][1]);\n        if (a === b) return false;\n        parent[a] = b;\n    }\n    return true;\n}`,
              java: `private static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static boolean validTree(int n, int[][] edges) {\n    if (edges.length != n - 1) return false;\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (int[] e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a == b) return false;\n        parent[a] = b;\n    }\n    return true;\n}`,
              cpp: `static int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nbool validTree(int n, vector<vector<int>>& edges) {\n    if ((int) edges.size() != n - 1) return false;\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (const auto& e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a == b) return false;\n        parent[a] = b;\n    }\n    return true;\n}`,
              c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nbool validTree(int n, int** edges, int edgesSize, int* edgesColSize) {\n    if (edgesSize != n - 1) return false;\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (int i = 0; i < edgesSize; i++) {\n        int a = findRootC(parent, edges[i][0]);\n        int b = findRootC(parent, edges[i][1]);\n        if (a == b) {\n            free(parent);\n            return false;\n        }\n        parent[a] = b;\n    }\n    free(parent);\n    return true;\n}`,
              csharp: `private static int FindRoot(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static bool ValidTree(int n, int[][] edges)\n{\n    if (edges.Length != n - 1) return false;\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    foreach (int[] e in edges)\n    {\n        int a = FindRoot(parent, e[0]);\n        int b = FindRoot(parent, e[1]);\n        if (a == b) return false;\n        parent[a] = b;\n    }\n    return true;\n}`,
              go: `func findRoot(parent []int, x int) int {\n	for parent[x] != x {\n		parent[x] = parent[parent[x]]\n		x = parent[x]\n	}\n	return x\n}\n\nfunc validTree(n int, edges [][]int) bool {\n	if len(edges) != n-1 {\n		return false\n	}\n	parent := make([]int, n)\n	for i := range parent {\n		parent[i] = i\n	}\n	for _, e := range edges {\n		a := findRoot(parent, e[0])\n		b := findRoot(parent, e[1])\n		if a == b {\n			return false\n		}\n		parent[a] = b\n	}\n	return true\n}`,
              kotlin: `fun findRoot(parent: IntArray, start: Int): Int {\n    var x = start\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfun validTree(n: Int, edges: Array<IntArray>): Boolean {\n    if (edges.size != n - 1) return false\n    val parent = IntArray(n) { it }\n    for (e in edges) {\n        val a = findRoot(parent, e[0])\n        val b = findRoot(parent, e[1])\n        if (a == b) return false\n        parent[a] = b\n    }\n    return true\n}`,
              swift: `func findRoot(_ parent: inout [Int], _ start: Int) -> Int {\n    var x = start\n    while parent[x] != x {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfunc validTree(_ n: Int, _ edges: [[Int]]) -> Bool {\n    if edges.count != n - 1 { return false }\n    var parent = Array(0..<n)\n    for e in edges {\n        let a = findRoot(&parent, e[0])\n        let b = findRoot(&parent, e[1])\n        if a == b { return false }\n        parent[a] = b\n    }\n    return true\n}`,
              rust: `fn find_root(parent: &mut Vec<usize>, start: usize) -> usize {\n    let mut x = start;\n    while parent[x] != x {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    x\n}\n\nfn validTree(n: i32, edges: Vec<Vec<i32>>) -> bool {\n    if edges.len() as i32 != n - 1 {\n        return false;\n    }\n    let size = n as usize;\n    let mut parent: Vec<usize> = (0..size).collect();\n    for e in edges.iter() {\n        let a = find_root(&mut parent, e[0] as usize);\n        let b = find_root(&mut parent, e[1] as usize);\n        if a == b {\n            return false;\n        }\n        parent[a] = b;\n    }\n    true\n}`,
              php: `function findRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}\n\nfunction validTree($n, $edges) {\n    if (count($edges) !== $n - 1) return false;\n    $parent = range(0, max($n - 1, 0));\n    foreach ($edges as $e) {\n        $a = findRoot($parent, $e[0]);\n        $b = findRoot($parent, $e[1]);\n        if ($a === $b) return false;\n        $parent[$a] = $b;\n    }\n    return true;\n}`,
              ruby: `def find_root(parent, x)\n  while parent[x] != x\n    parent[x] = parent[parent[x]]\n    x = parent[x]\n  end\n  x\nend\n\ndef validTree(n, edges)\n  return false if edges.length != n - 1\n  parent = (0...n).to_a\n  edges.each do |e|\n    a = find_root(parent, e[0])\n    b = find_root(parent, e[1])\n    return false if a == b\n    parent[a] = b\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Is Graph Bipartite? ─────────────────────────────────────────
  (() => {
    const ref = (graph: number[][]) => {
      const n = graph.length;
      const color: number[] = [];
      for (let i = 0; i < n; i++) color.push(0);
      for (let start = 0; start < n; start++) {
        if (color[start] !== 0) continue;
        color[start] = 1;
        const queue: number[] = [start];
        let head = 0;
        while (head < queue.length) {
          const node = queue[head++];
          for (let i = 0; i < graph[node].length; i++) {
            const next = graph[node][i];
            if (color[next] === 0) {
              color[next] = -color[node];
              queue.push(next);
            } else if (color[next] === color[node]) {
              return false;
            }
          }
        }
      }
      return true;
    };
    return {
      slug: "is-graph-bipartite",
      title: "Is Graph Bipartite?",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google", "Meta"],
      signature: { funcName: "isBipartite", params: [{ name: "graph", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "An undirected graph is **bipartite** if its nodes can be split into two sets so that every edge joins a node in one set to a node in the other.\n\nYou are given the adjacency list `graph`, where `graph[u]` lists the neighbours of node `u`. Return `true` if the graph is bipartite.",
        [
          { in: "graph = [[1,3],[0,2],[1,3],[0,2]]", out: "true" },
          { in: "graph = [[1,2,3],[0,2],[0,1,3],[0,2]]", out: "false" },
          { in: "graph = [[]]", out: "true" },
        ],
        ["1 <= graph.length <= 30", "The graph is undirected and has no self-loops or repeated edges.", "It may be disconnected."]),
      hints: [
        "Two-colour the graph: give a start node one colour and every neighbour the other.",
        "BFS or DFS from every uncoloured node, since the graph may be disconnected.",
        "If you ever meet a neighbour that already has your own colour, it is not bipartite.",
      ],
      examples: [
        { input: "[[1,3],[0,2],[1,3],[0,2]]", expectedOutput: "true" },
        { input: "[[1,2,3],[0,2],[0,1,3],[0,2]]", expectedOutput: "false" },
        { input: "[[]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const adjacency: number[][] = Array.from({ length: n }, () => []);
        const bipartiteBuild = rng() < 0.45;
        const side = Array.from({ length: n }, () => (bipartiteBuild ? ri(rng, 0, 1) : 0));
        const seen = new Set<string>();
        const target = ri(rng, 0, Math.min(60, n * 2));
        let attempts = 0;
        while (seen.size < target && attempts < target * 5 + 10) {
          attempts++;
          const a = ri(rng, 0, n - 1);
          const b = ri(rng, 0, n - 1);
          if (a === b) continue;
          if (bipartiteBuild && side[a] === side[b]) continue;
          const key = a < b ? `${a},${b}` : `${b},${a}`;
          if (seen.has(key)) continue;
          seen.add(key);
          adjacency[a].push(b);
          adjacency[b].push(a);
        }
        return { input: fmtIntMat(adjacency), expectedOutput: bool(ref(adjacency)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef isBipartite(graph) -> bool:\n    n = len(graph)\n    color = [0] * n\n    for start in range(n):\n        if color[start] != 0:\n            continue\n        color[start] = 1\n        queue = deque([start])\n        while queue:\n            node = queue.popleft()\n            for nxt in graph[node]:\n                if color[nxt] == 0:\n                    color[nxt] = -color[node]\n                    queue.append(nxt)\n                elif color[nxt] == color[node]:\n                    return False\n    return True`,
        javascript: `var isBipartite = function(graph) {\n    const n = graph.length;\n    const color = [];\n    for (let i = 0; i < n; i++) color.push(0);\n    for (let start = 0; start < n; start++) {\n        if (color[start] !== 0) continue;\n        color[start] = 1;\n        const queue = [start];\n        let head = 0;\n        while (head < queue.length) {\n            const node = queue[head++];\n            for (let i = 0; i < graph[node].length; i++) {\n                const next = graph[node][i];\n                if (color[next] === 0) {\n                    color[next] = -color[node];\n                    queue.push(next);\n                } else if (color[next] === color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n};`,
              typescript: `function isBipartite(graph: number[][]): boolean {\n    var n = graph.length;\n    var color: number[] = [];\n    for (var i = 0; i < n; i++) color.push(0);\n    for (var start = 0; start < n; start++) {\n        if (color[start] !== 0) continue;\n        color[start] = 1;\n        var queue: number[] = [start];\n        var head = 0;\n        while (head < queue.length) {\n            var node = queue[head++];\n            for (var k = 0; k < graph[node].length; k++) {\n                var next = graph[node][k];\n                if (color[next] === 0) {\n                    color[next] = -color[node];\n                    queue.push(next);\n                } else if (color[next] === color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              java: `public static boolean isBipartite(int[][] graph) {\n    int n = graph.length;\n    int[] color = new int[n];\n    for (int start = 0; start < n; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        Deque<Integer> queue = new ArrayDeque<>();\n        queue.addLast(start);\n        while (!queue.isEmpty()) {\n            int node = queue.pollFirst();\n            for (int next : graph[node]) {\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue.addLast(next);\n                } else if (color[next] == color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              cpp: `bool isBipartite(vector<vector<int>>& graph) {\n    int n = (int) graph.size();\n    vector<int> color(n, 0);\n    for (int start = 0; start < n; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        vector<int> queue;\n        queue.push_back(start);\n        size_t head = 0;\n        while (head < queue.size()) {\n            int node = queue[head++];\n            for (int next : graph[node]) {\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue.push_back(next);\n                } else if (color[next] == color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              c: `bool isBipartite(int** graph, int graphSize, int* graphColSize) {\n    int n = graphSize;\n    int* color = (int*) calloc((size_t) (n > 0 ? n : 1), sizeof(int));\n    int* queue = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    for (int start = 0; start < n; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        int head = 0, tail = 0;\n        queue[tail++] = start;\n        while (head < tail) {\n            int node = queue[head++];\n            for (int k = 0; k < graphColSize[node]; k++) {\n                int next = graph[node][k];\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue[tail++] = next;\n                } else if (color[next] == color[node]) {\n                    free(color);\n                    free(queue);\n                    return false;\n                }\n            }\n        }\n    }\n    free(color);\n    free(queue);\n    return true;\n}`,
              csharp: `public static bool IsBipartite(int[][] graph)\n{\n    int n = graph.Length;\n    int[] color = new int[n];\n    for (int start = 0; start < n; start++)\n    {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        var queue = new Queue<int>();\n        queue.Enqueue(start);\n        while (queue.Count > 0)\n        {\n            int node = queue.Dequeue();\n            foreach (int next in graph[node])\n            {\n                if (color[next] == 0)\n                {\n                    color[next] = -color[node];\n                    queue.Enqueue(next);\n                }\n                else if (color[next] == color[node])\n                {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              go: `func isBipartite(graph [][]int) bool {\n	n := len(graph)\n	color := make([]int, n)\n	for start := 0; start < n; start++ {\n		if color[start] != 0 {\n			continue\n		}\n		color[start] = 1\n		queue := []int{start}\n		head := 0\n		for head < len(queue) {\n			node := queue[head]\n			head++\n			for _, next := range graph[node] {\n				if color[next] == 0 {\n					color[next] = -color[node]\n					queue = append(queue, next)\n				} else if color[next] == color[node] {\n					return false\n				}\n			}\n		}\n	}\n	return true\n}`,
              kotlin: `fun isBipartite(graph: Array<IntArray>): Boolean {\n    val n = graph.size\n    val color = IntArray(n)\n    for (start in 0 until n) {\n        if (color[start] != 0) continue\n        color[start] = 1\n        val queue = ArrayList<Int>()\n        queue.add(start)\n        var head = 0\n        while (head < queue.size) {\n            val node = queue[head++]\n            for (next in graph[node]) {\n                if (color[next] == 0) {\n                    color[next] = -color[node]\n                    queue.add(next)\n                } else if (color[next] == color[node]) {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}`,
              swift: `func isBipartite(_ graph: [[Int]]) -> Bool {\n    let n = graph.count\n    var color = [Int](repeating: 0, count: n)\n    for start in 0..<n {\n        if color[start] != 0 { continue }\n        color[start] = 1\n        var queue = [start]\n        var head = 0\n        while head < queue.count {\n            let node = queue[head]\n            head += 1\n            for next in graph[node] {\n                if color[next] == 0 {\n                    color[next] = -color[node]\n                    queue.append(next)\n                } else if color[next] == color[node] {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}`,
              rust: `fn isBipartite(graph: Vec<Vec<i32>>) -> bool {\n    let n = graph.len();\n    let mut color = vec![0i32; n];\n    for start in 0..n {\n        if color[start] != 0 {\n            continue;\n        }\n        color[start] = 1;\n        let mut queue: Vec<usize> = vec![start];\n        let mut head = 0usize;\n        while head < queue.len() {\n            let node = queue[head];\n            head += 1;\n            for next in graph[node].iter() {\n                let idx = *next as usize;\n                if color[idx] == 0 {\n                    color[idx] = -color[node];\n                    queue.push(idx);\n                } else if color[idx] == color[node] {\n                    return false;\n                }\n            }\n        }\n    }\n    true\n}`,
              php: `function isBipartite($graph) {\n    $n = count($graph);\n    $color = array_fill(0, max($n, 1), 0);\n    for ($start = 0; $start < $n; $start++) {\n        if ($color[$start] !== 0) continue;\n        $color[$start] = 1;\n        $queue = array($start);\n        $head = 0;\n        while ($head < count($queue)) {\n            $node = $queue[$head++];\n            foreach ($graph[$node] as $next) {\n                if ($color[$next] === 0) {\n                    $color[$next] = -$color[$node];\n                    $queue[] = $next;\n                } else if ($color[$next] === $color[$node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              ruby: `def isBipartite(graph)\n  n = graph.length\n  color = Array.new(n, 0)\n  (0...n).each do |start|\n    next if color[start] != 0\n    color[start] = 1\n    queue = [start]\n    head = 0\n    while head < queue.length\n      node = queue[head]\n      head += 1\n      graph[node].each do |nxt|\n        if color[nxt] == 0\n          color[nxt] = -color[node]\n          queue.push(nxt)\n        elsif color[nxt] == color[node]\n          return false\n        end\n      end\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Keys and Rooms ──────────────────────────────────────────────
  (() => {
    const ref = (rooms: number[][]) => {
      const n = rooms.length;
      const seen: boolean[] = [];
      for (let i = 0; i < n; i++) seen.push(false);
      seen[0] = true;
      const stack: number[] = [0];
      let visited = 1;
      while (stack.length > 0) {
        const room = stack.pop() as number;
        for (let i = 0; i < rooms[room].length; i++) {
          const key = rooms[room][i];
          if (!seen[key]) {
            seen[key] = true;
            visited++;
            stack.push(key);
          }
        }
      }
      return visited === n;
    };
    return {
      slug: "keys-and-rooms",
      title: "Keys and Rooms",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "canVisitAllRooms", params: [{ name: "rooms", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "There are `n` rooms labelled `0` through `n - 1`, all locked except room `0`. Room `i` contains the keys listed in `rooms[i]`, each opening one other room.\n\nStarting in room `0`, return `true` if you can visit every room.",
        [
          { in: "rooms = [[1],[2],[3],[]]", out: "true" },
          { in: "rooms = [[1,3],[3,0,1],[2],[0]]", out: "false", note: "Room 2 can never be opened." },
          { in: "rooms = [[]]", out: "true" },
        ],
        ["1 <= rooms.length <= 30", "0 <= rooms[i][j] < rooms.length", "All keys within one room are distinct."]),
      hints: [
        "This is plain reachability from node 0 in a directed graph.",
        "DFS or BFS, marking rooms as you enter them so you never revisit one.",
        "The answer is whether the number of rooms reached equals the total.",
      ],
      examples: [
        { input: "[[1],[2],[3],[]]", expectedOutput: "true" },
        { input: "[[1,3],[3,0,1],[2],[0]]", expectedOutput: "false" },
        { input: "[[]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const rooms: number[][] = Array.from({ length: n }, () => []);
        if (rng() < 0.4) {
          // Chain the rooms so every one is reachable, then add noise.
          for (let i = 1; i < n; i++) rooms[ri(rng, 0, i - 1)].push(i);
        }
        for (let i = 0; i < n; i++) {
          const extra = ri(rng, 0, 2);
          for (let j = 0; j < extra; j++) {
            const key = ri(rng, 0, n - 1);
            if (rooms[i].indexOf(key) < 0) rooms[i].push(key);
          }
        }
        return { input: fmtIntMat(rooms), expectedOutput: bool(ref(rooms)) };
      },
      solutions: {
        python: `def canVisitAllRooms(rooms) -> bool:\n    seen = [False] * len(rooms)\n    seen[0] = True\n    stack = [0]\n    visited = 1\n    while stack:\n        room = stack.pop()\n        for key in rooms[room]:\n            if not seen[key]:\n                seen[key] = True\n                visited += 1\n                stack.append(key)\n    return visited == len(rooms)`,
        javascript: `var canVisitAllRooms = function(rooms) {\n    const n = rooms.length;\n    const seen = [];\n    for (let i = 0; i < n; i++) seen.push(false);\n    seen[0] = true;\n    const stack = [0];\n    let visited = 1;\n    while (stack.length > 0) {\n        const room = stack.pop();\n        for (let i = 0; i < rooms[room].length; i++) {\n            const key = rooms[room][i];\n            if (!seen[key]) {\n                seen[key] = true;\n                visited++;\n                stack.push(key);\n            }\n        }\n    }\n    return visited === n;\n};`,
              typescript: `function canVisitAllRooms(rooms: number[][]): boolean {\n    var n = rooms.length;\n    var seen: boolean[] = [];\n    for (var i = 0; i < n; i++) seen.push(false);\n    seen[0] = true;\n    var stack: number[] = [0];\n    var visited = 1;\n    while (stack.length > 0) {\n        var room = stack.pop() as number;\n        for (var k = 0; k < rooms[room].length; k++) {\n            var key = rooms[room][k];\n            if (!seen[key]) {\n                seen[key] = true;\n                visited++;\n                stack.push(key);\n            }\n        }\n    }\n    return visited === n;\n}`,
              java: `public static boolean canVisitAllRooms(int[][] rooms) {\n    int n = rooms.length;\n    boolean[] seen = new boolean[n];\n    seen[0] = true;\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(0);\n    int visited = 1;\n    while (!stack.isEmpty()) {\n        int room = stack.pop();\n        for (int key : rooms[room]) {\n            if (!seen[key]) {\n                seen[key] = true;\n                visited++;\n                stack.push(key);\n            }\n        }\n    }\n    return visited == n;\n}`,
              cpp: `bool canVisitAllRooms(vector<vector<int>>& rooms) {\n    int n = (int) rooms.size();\n    vector<bool> seen(n, false);\n    seen[0] = true;\n    vector<int> stack;\n    stack.push_back(0);\n    int visited = 1;\n    while (!stack.empty()) {\n        int room = stack.back();\n        stack.pop_back();\n        for (int key : rooms[room]) {\n            if (!seen[key]) {\n                seen[key] = true;\n                visited++;\n                stack.push_back(key);\n            }\n        }\n    }\n    return visited == n;\n}`,
              c: `bool canVisitAllRooms(int** rooms, int roomsSize, int* roomsColSize) {\n    int n = roomsSize;\n    char* seen = (char*) calloc((size_t) n, sizeof(char));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    int top = 0;\n    seen[0] = 1;\n    stack[top++] = 0;\n    int visited = 1;\n    while (top > 0) {\n        int room = stack[--top];\n        for (int k = 0; k < roomsColSize[room]; k++) {\n            int key = rooms[room][k];\n            if (!seen[key]) {\n                seen[key] = 1;\n                visited++;\n                stack[top++] = key;\n            }\n        }\n    }\n    free(seen);\n    free(stack);\n    return visited == n;\n}`,
              csharp: `public static bool CanVisitAllRooms(int[][] rooms)\n{\n    int n = rooms.Length;\n    bool[] seen = new bool[n];\n    seen[0] = true;\n    var stack = new List<int>();\n    stack.Add(0);\n    int visited = 1;\n    while (stack.Count > 0)\n    {\n        int room = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        foreach (int key in rooms[room])\n        {\n            if (!seen[key])\n            {\n                seen[key] = true;\n                visited++;\n                stack.Add(key);\n            }\n        }\n    }\n    return visited == n;\n}`,
              go: `func canVisitAllRooms(rooms [][]int) bool {\n	n := len(rooms)\n	seen := make([]bool, n)\n	seen[0] = true\n	stack := []int{0}\n	visited := 1\n	for len(stack) > 0 {\n		room := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		for _, key := range rooms[room] {\n			if !seen[key] {\n				seen[key] = true\n				visited++\n				stack = append(stack, key)\n			}\n		}\n	}\n	return visited == n\n}`,
              kotlin: `fun canVisitAllRooms(rooms: Array<IntArray>): Boolean {\n    val n = rooms.size\n    val seen = BooleanArray(n)\n    seen[0] = true\n    val stack = ArrayList<Int>()\n    stack.add(0)\n    var visited = 1\n    while (stack.isNotEmpty()) {\n        val room = stack.removeAt(stack.size - 1)\n        for (key in rooms[room]) {\n            if (!seen[key]) {\n                seen[key] = true\n                visited++\n                stack.add(key)\n            }\n        }\n    }\n    return visited == n\n}`,
              swift: `func canVisitAllRooms(_ rooms: [[Int]]) -> Bool {\n    let n = rooms.count\n    var seen = [Bool](repeating: false, count: n)\n    seen[0] = true\n    var stack = [0]\n    var visited = 1\n    while let room = stack.popLast() {\n        for key in rooms[room] {\n            if !seen[key] {\n                seen[key] = true\n                visited += 1\n                stack.append(key)\n            }\n        }\n    }\n    return visited == n\n}`,
              rust: `fn canVisitAllRooms(rooms: Vec<Vec<i32>>) -> bool {\n    let n = rooms.len();\n    let mut seen = vec![false; n];\n    seen[0] = true;\n    let mut stack: Vec<usize> = vec![0];\n    let mut visited = 1;\n    while let Some(room) = stack.pop() {\n        for key in rooms[room].iter() {\n            let idx = *key as usize;\n            if !seen[idx] {\n                seen[idx] = true;\n                visited += 1;\n                stack.push(idx);\n            }\n        }\n    }\n    visited == n\n}`,
              php: `function canVisitAllRooms($rooms) {\n    $n = count($rooms);\n    $seen = array_fill(0, $n, false);\n    $seen[0] = true;\n    $stack = array(0);\n    $visited = 1;\n    while (count($stack) > 0) {\n        $room = array_pop($stack);\n        foreach ($rooms[$room] as $key) {\n            if (!$seen[$key]) {\n                $seen[$key] = true;\n                $visited++;\n                $stack[] = $key;\n            }\n        }\n    }\n    return $visited === $n;\n}`,
              ruby: `def canVisitAllRooms(rooms)\n  n = rooms.length\n  seen = Array.new(n, false)\n  seen[0] = true\n  stack = [0]\n  visited = 1\n  while !stack.empty?\n    room = stack.pop\n    rooms[room].each do |key|\n      unless seen[key]\n        seen[key] = true\n        visited += 1\n        stack.push(key)\n      end\n    end\n  end\n  visited == n\nend`,
      },
    };
  })(),

  // ── All Paths From Source to Target ─────────────────────────────
  (() => {
    const ref = (graph: number[][]) => {
      const target = graph.length - 1;
      const out: number[][] = [];
      const path: number[] = [0];
      const walk = (node: number) => {
        if (node === target) {
          out.push(path.slice());
          return;
        }
        for (let i = 0; i < graph[node].length; i++) {
          path.push(graph[node][i]);
          walk(graph[node][i]);
          path.pop();
        }
      };
      walk(0);
      return out;
    };
    return {
      slug: "all-paths-from-source-to-target",
      title: "All Paths From Source to Target",
      difficulty: "MEDIUM" as const,
      tags: ["Backtracking", "Depth-First Search", "Breadth-First Search", "Graph", "Amazon", "Google", "Meta"],
      signature: { funcName: "allPathsSourceTarget", params: [{ name: "graph", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given a **directed acyclic graph** of `n` nodes labelled `0` through `n - 1`, as an adjacency list where `graph[i]` lists the nodes reachable in one step from `i`.\n\nReturn every path from node `0` to node `n - 1`, in the order a depth-first search that follows each adjacency list left to right would find them.",
        [
          { in: "graph = [[1,2],[3],[3],[]]", out: "[[0,1,3],[0,2,3]]" },
          { in: "graph = [[4,3,1],[3,2,4],[3],[4],[]]", out: "[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]" },
          { in: "graph = [[]]", out: "[[0]]" },
        ],
        ["1 <= graph.length <= 12", "The graph is a DAG: every edge goes from a lower index to a higher one, except that node 0 may be a target of nothing.", "The total output stays small."]),
      hints: [
        "Depth-first search from node 0, carrying the path built so far.",
        "When you reach the last node, record a **copy** of the path — not the live array.",
        "Because the graph is acyclic you never need a visited set; just undo the last step when you return.",
      ],
      examples: [
        { input: "[[1,2],[3],[3],[]]", expectedOutput: "[[0,1,3],[0,2,3]]" },
        { input: "[[4,3,1],[3,2,4],[3],[4],[]]", expectedOutput: "[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]" },
        { input: "[[]]", expectedOutput: "[[0]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const graph: number[][] = Array.from({ length: n }, () => []);
        for (let i = 0; i < n - 1; i++) {
          const targets = shuffle(rng, Array.from({ length: n - 1 - i }, (_, k) => i + 1 + k));
          const take = ri(rng, 1, Math.min(3, targets.length));
          for (let j = 0; j < take; j++) graph[i].push(targets[j]);
        }
        return { input: fmtIntMat(graph), expectedOutput: fmtIntMat(ref(graph)) };
      },
      solutions: {
        python: `def allPathsSourceTarget(graph):\n    target = len(graph) - 1\n    out = []\n    path = [0]\n\n    def walk(node):\n        if node == target:\n            out.append(list(path))\n            return\n        for nxt in graph[node]:\n            path.append(nxt)\n            walk(nxt)\n            path.pop()\n\n    walk(0)\n    return out`,
        javascript: `var allPathsSourceTarget = function(graph) {\n    const target = graph.length - 1;\n    const out = [];\n    const path = [0];\n    const walk = function(node) {\n        if (node === target) {\n            out.push(path.slice());\n            return;\n        }\n        for (let i = 0; i < graph[node].length; i++) {\n            path.push(graph[node][i]);\n            walk(graph[node][i]);\n            path.pop();\n        }\n    };\n    walk(0);\n    return out;\n};`,
              typescript: `function allPathsSourceTarget(graph: number[][]): number[][] {\n    var target = graph.length - 1;\n    var out: number[][] = [];\n    var path: number[] = [0];\n    var walk = function (node: number) {\n        if (node === target) {\n            out.push(path.slice());\n            return;\n        }\n        for (var i = 0; i < graph[node].length; i++) {\n            path.push(graph[node][i]);\n            walk(graph[node][i]);\n            path.pop();\n        }\n    };\n    walk(0);\n    return out;\n}`,
              java: `private static void walkPaths(int[][] graph, int node, List<Integer> path, List<int[]> out) {\n    if (node == graph.length - 1) {\n        int[] copy = new int[path.size()];\n        for (int i = 0; i < path.size(); i++) copy[i] = path.get(i);\n        out.add(copy);\n        return;\n    }\n    for (int next : graph[node]) {\n        path.add(next);\n        walkPaths(graph, next, path, out);\n        path.remove(path.size() - 1);\n    }\n}\n\npublic static int[][] allPathsSourceTarget(int[][] graph) {\n    List<int[]> out = new ArrayList<>();\n    List<Integer> path = new ArrayList<>();\n    path.add(0);\n    walkPaths(graph, 0, path, out);\n    return out.toArray(new int[0][]);\n}`,
              cpp: `static void walkPaths(vector<vector<int>>& graph, int node, vector<int>& path, vector<vector<int>>& out) {\n    if (node == (int) graph.size() - 1) {\n        out.push_back(path);\n        return;\n    }\n    for (int next : graph[node]) {\n        path.push_back(next);\n        walkPaths(graph, next, path, out);\n        path.pop_back();\n    }\n}\n\nvector<vector<int>> allPathsSourceTarget(vector<vector<int>>& graph) {\n    vector<vector<int>> out;\n    vector<int> path;\n    path.push_back(0);\n    walkPaths(graph, 0, path, out);\n    return out;\n}`,
              c: `static int** gPaths;\nstatic int* gPathCols;\nstatic int gPathCount;\nstatic int gPathCap;\n\nstatic void walkPaths(int** graph, int graphSize, int* graphColSize, int node, int* path, int depth) {\n    if (node == graphSize - 1) {\n        if (gPathCount == gPathCap) {\n            gPathCap *= 2;\n            gPaths = (int**) realloc(gPaths, (size_t) gPathCap * sizeof(int*));\n            gPathCols = (int*) realloc(gPathCols, (size_t) gPathCap * sizeof(int));\n        }\n        int* copy = (int*) malloc((size_t) (depth + 1) * sizeof(int));\n        for (int i = 0; i <= depth; i++) copy[i] = path[i];\n        gPaths[gPathCount] = copy;\n        gPathCols[gPathCount] = depth + 1;\n        gPathCount++;\n        return;\n    }\n    for (int k = 0; k < graphColSize[node]; k++) {\n        path[depth + 1] = graph[node][k];\n        walkPaths(graph, graphSize, graphColSize, graph[node][k], path, depth + 1);\n    }\n}\n\nint** allPathsSourceTarget(int** graph, int graphSize, int* graphColSize, int* returnSize, int** returnColumnSizes) {\n    gPathCap = 64;\n    gPathCount = 0;\n    gPaths = (int**) malloc((size_t) gPathCap * sizeof(int*));\n    gPathCols = (int*) malloc((size_t) gPathCap * sizeof(int));\n    int* path = (int*) malloc((size_t) (graphSize + 2) * sizeof(int));\n    path[0] = 0;\n    walkPaths(graph, graphSize, graphColSize, 0, path, 0);\n    free(path);\n    *returnSize = gPathCount;\n    *returnColumnSizes = gPathCols;\n    return gPaths;\n}`,
              csharp: `private static void WalkPaths(int[][] graph, int node, List<int> path, List<int[]> outPaths)\n{\n    if (node == graph.Length - 1)\n    {\n        outPaths.Add(path.ToArray());\n        return;\n    }\n    foreach (int next in graph[node])\n    {\n        path.Add(next);\n        WalkPaths(graph, next, path, outPaths);\n        path.RemoveAt(path.Count - 1);\n    }\n}\n\npublic static int[][] AllPathsSourceTarget(int[][] graph)\n{\n    var outPaths = new List<int[]>();\n    var path = new List<int>();\n    path.Add(0);\n    WalkPaths(graph, 0, path, outPaths);\n    return outPaths.ToArray();\n}`,
              go: `func walkPaths(graph [][]int, node int, path []int, out *[][]int) {\n	if node == len(graph)-1 {\n		copied := make([]int, len(path))\n		copy(copied, path)\n		*out = append(*out, copied)\n		return\n	}\n	for _, next := range graph[node] {\n		walkPaths(graph, next, append(path, next), out)\n	}\n}\n\nfunc allPathsSourceTarget(graph [][]int) [][]int {\n	out := [][]int{}\n	walkPaths(graph, 0, []int{0}, &out)\n	return out\n}`,
              kotlin: `fun walkPaths(graph: Array<IntArray>, node: Int, path: ArrayList<Int>, out: ArrayList<IntArray>) {\n    if (node == graph.size - 1) {\n        out.add(path.toIntArray())\n        return\n    }\n    for (next in graph[node]) {\n        path.add(next)\n        walkPaths(graph, next, path, out)\n        path.removeAt(path.size - 1)\n    }\n}\n\nfun allPathsSourceTarget(graph: Array<IntArray>): Array<IntArray> {\n    val out = ArrayList<IntArray>()\n    val path = ArrayList<Int>()\n    path.add(0)\n    walkPaths(graph, 0, path, out)\n    return out.toTypedArray()\n}`,
              swift: `func walkPaths(_ graph: [[Int]], _ node: Int, _ path: inout [Int], _ out: inout [[Int]]) {\n    if node == graph.count - 1 {\n        out.append(path)\n        return\n    }\n    for next in graph[node] {\n        path.append(next)\n        walkPaths(graph, next, &path, &out)\n        path.removeLast()\n    }\n}\n\nfunc allPathsSourceTarget(_ graph: [[Int]]) -> [[Int]] {\n    var out: [[Int]] = []\n    var path: [Int] = [0]\n    walkPaths(graph, 0, &path, &out)\n    return out\n}`,
              rust: `fn walk_paths(graph: &Vec<Vec<i32>>, node: usize, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {\n    if node == graph.len() - 1 {\n        out.push(path.clone());\n        return;\n    }\n    for next in graph[node].clone().iter() {\n        path.push(*next);\n        walk_paths(graph, *next as usize, path, out);\n        path.pop();\n    }\n}\n\nfn allPathsSourceTarget(graph: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut path: Vec<i32> = vec![0];\n    walk_paths(&graph, 0, &mut path, &mut out);\n    out\n}`,
              php: `function walkPaths($graph, $node, $path, &$out) {\n    if ($node === count($graph) - 1) {\n        $out[] = $path;\n        return;\n    }\n    foreach ($graph[$node] as $next) {\n        $path[] = $next;\n        walkPaths($graph, $next, $path, $out);\n        array_pop($path);\n    }\n}\n\nfunction allPathsSourceTarget($graph) {\n    $out = array();\n    walkPaths($graph, 0, array(0), $out);\n    return $out;\n}`,
              ruby: `def walk_paths(graph, node, path, out)\n  if node == graph.length - 1\n    out.push(path.dup)\n    return\n  end\n  graph[node].each do |nxt|\n    path.push(nxt)\n    walk_paths(graph, nxt, path, out)\n    path.pop\n  end\nend\n\ndef allPathsSourceTarget(graph)\n  out = []\n  walk_paths(graph, 0, [0], out)\n  out\nend`,
      },
    };
  })(),

  // ── Find Eventual Safe States ───────────────────────────────────
  (() => {
    const ref = (graph: number[][]) => {
      const n = graph.length;
      // 0 = unvisited, 1 = on the current DFS stack, 2 = safe, 3 = unsafe
      const state: number[] = [];
      for (let i = 0; i < n; i++) state.push(0);
      const safe = (node: number): boolean => {
        if (state[node] === 2) return true;
        if (state[node] === 1 || state[node] === 3) return false;
        state[node] = 1;
        for (let i = 0; i < graph[node].length; i++) {
          if (!safe(graph[node][i])) {
            state[node] = 3;
            return false;
          }
        }
        state[node] = 2;
        return true;
      };
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        if (safe(i)) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-eventual-safe-states",
      title: "Find Eventual Safe States",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "eventualSafeNodes", params: [{ name: "graph", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a directed graph as an adjacency list, where `graph[i]` lists the nodes reachable in one step from `i`. A node is **terminal** if it has no outgoing edges, and **safe** if every path starting there reaches a terminal node.\n\nReturn all safe nodes in ascending order.",
        [
          { in: "graph = [[1,2],[2,3],[5],[0],[5],[],[]]", out: "[2,4,5,6]" },
          { in: "graph = [[1,2,3,4],[1,2],[3,4],[0,4],[]]", out: "[4]" },
          { in: "graph = [[]]", out: "[0]" },
        ],
        ["1 <= graph.length <= 30", "0 <= graph[i][j] < graph.length", "The graph may contain cycles."]),
      hints: [
        "A node is unsafe exactly when it can reach a cycle.",
        "Run a DFS with three colours: unvisited, on-stack, and finished — meeting an on-stack node means a cycle.",
        "Cache the verdict per node so each is explored once; alternatively, run a topological sort on the reversed graph.",
      ],
      examples: [
        { input: "[[1,2],[2,3],[5],[0],[5],[],[]]", expectedOutput: "[2,4,5,6]" },
        { input: "[[1,2,3,4],[1,2],[3,4],[0,4],[]]", expectedOutput: "[4]" },
        { input: "[[]]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const graph: number[][] = Array.from({ length: n }, () => []);
        for (let i = 0; i < n; i++) {
          const outDegree = ri(rng, 0, 3);
          for (let j = 0; j < outDegree; j++) {
            const target = ri(rng, 0, n - 1);
            if (target !== i && graph[i].indexOf(target) < 0) graph[i].push(target);
          }
          graph[i].sort((a, b) => a - b);
        }
        return { input: fmtIntMat(graph), expectedOutput: fmtIntArr(ref(graph)) };
      },
      solutions: {
        python: `import sys\n\ndef eventualSafeNodes(graph):\n    sys.setrecursionlimit(10000)\n    n = len(graph)\n    state = [0] * n\n\n    def safe(node):\n        if state[node] == 2:\n            return True\n        if state[node] in (1, 3):\n            return False\n        state[node] = 1\n        for nxt in graph[node]:\n            if not safe(nxt):\n                state[node] = 3\n                return False\n        state[node] = 2\n        return True\n\n    return [i for i in range(n) if safe(i)]`,
        javascript: `var eventualSafeNodes = function(graph) {\n    const n = graph.length;\n    const state = [];\n    for (let i = 0; i < n; i++) state.push(0);\n    const safe = function(node) {\n        if (state[node] === 2) return true;\n        if (state[node] === 1 || state[node] === 3) return false;\n        state[node] = 1;\n        for (let i = 0; i < graph[node].length; i++) {\n            if (!safe(graph[node][i])) {\n                state[node] = 3;\n                return false;\n            }\n        }\n        state[node] = 2;\n        return true;\n    };\n    const out = [];\n    for (let i = 0; i < n; i++) {\n        if (safe(i)) out.push(i);\n    }\n    return out;\n};`,
              typescript: `function eventualSafeNodes(graph: number[][]): number[] {\n    var n = graph.length;\n    var state: number[] = [];\n    for (var i = 0; i < n; i++) state.push(0);\n    var safe = function (node: number): boolean {\n        if (state[node] === 2) return true;\n        if (state[node] === 1 || state[node] === 3) return false;\n        state[node] = 1;\n        for (var k = 0; k < graph[node].length; k++) {\n            if (!safe(graph[node][k])) {\n                state[node] = 3;\n                return false;\n            }\n        }\n        state[node] = 2;\n        return true;\n    };\n    var out: number[] = [];\n    for (var j = 0; j < n; j++) {\n        if (safe(j)) out.push(j);\n    }\n    return out;\n}`,
              java: `private static boolean isSafe(int[][] graph, int[] state, int node) {\n    if (state[node] == 2) return true;\n    if (state[node] == 1 || state[node] == 3) return false;\n    state[node] = 1;\n    for (int next : graph[node]) {\n        if (!isSafe(graph, state, next)) {\n            state[node] = 3;\n            return false;\n        }\n    }\n    state[node] = 2;\n    return true;\n}\n\npublic static int[] eventualSafeNodes(int[][] graph) {\n    int n = graph.length;\n    int[] state = new int[n];\n    List<Integer> out = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n        if (isSafe(graph, state, i)) out.add(i);\n    }\n    int[] result = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) result[i] = out.get(i);\n    return result;\n}`,
              cpp: `static bool isSafe(vector<vector<int>>& graph, vector<int>& state, int node) {\n    if (state[node] == 2) return true;\n    if (state[node] == 1 || state[node] == 3) return false;\n    state[node] = 1;\n    for (int next : graph[node]) {\n        if (!isSafe(graph, state, next)) {\n            state[node] = 3;\n            return false;\n        }\n    }\n    state[node] = 2;\n    return true;\n}\n\nvector<int> eventualSafeNodes(vector<vector<int>>& graph) {\n    int n = (int) graph.size();\n    vector<int> state(n, 0);\n    vector<int> out;\n    for (int i = 0; i < n; i++) {\n        if (isSafe(graph, state, i)) out.push_back(i);\n    }\n    return out;\n}`,
              c: `static int isSafeNode(int** graph, int* graphColSize, int* state, int node) {\n    if (state[node] == 2) return 1;\n    if (state[node] == 1 || state[node] == 3) return 0;\n    state[node] = 1;\n    for (int k = 0; k < graphColSize[node]; k++) {\n        if (!isSafeNode(graph, graphColSize, state, graph[node][k])) {\n            state[node] = 3;\n            return 0;\n        }\n    }\n    state[node] = 2;\n    return 1;\n}\n\nint* eventualSafeNodes(int** graph, int graphSize, int* graphColSize, int* returnSize) {\n    int n = graphSize;\n    int* state = (int*) calloc((size_t) (n > 0 ? n : 1), sizeof(int));\n    int* out = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (isSafeNode(graph, graphColSize, state, i)) out[m++] = i;\n    }\n    free(state);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `private static bool IsSafe(int[][] graph, int[] state, int node)\n{\n    if (state[node] == 2) return true;\n    if (state[node] == 1 || state[node] == 3) return false;\n    state[node] = 1;\n    foreach (int next in graph[node])\n    {\n        if (!IsSafe(graph, state, next))\n        {\n            state[node] = 3;\n            return false;\n        }\n    }\n    state[node] = 2;\n    return true;\n}\n\npublic static int[] EventualSafeNodes(int[][] graph)\n{\n    int n = graph.Length;\n    int[] state = new int[n];\n    var out_ = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        if (IsSafe(graph, state, i)) out_.Add(i);\n    }\n    return out_.ToArray();\n}`,
              go: `func isSafe(graph [][]int, state []int, node int) bool {\n	if state[node] == 2 {\n		return true\n	}\n	if state[node] == 1 || state[node] == 3 {\n		return false\n	}\n	state[node] = 1\n	for _, next := range graph[node] {\n		if !isSafe(graph, state, next) {\n			state[node] = 3\n			return false\n		}\n	}\n	state[node] = 2\n	return true\n}\n\nfunc eventualSafeNodes(graph [][]int) []int {\n	n := len(graph)\n	state := make([]int, n)\n	out := []int{}\n	for i := 0; i < n; i++ {\n		if isSafe(graph, state, i) {\n			out = append(out, i)\n		}\n	}\n	return out\n}`,
              kotlin: `fun isSafe(graph: Array<IntArray>, state: IntArray, node: Int): Boolean {\n    if (state[node] == 2) return true\n    if (state[node] == 1 || state[node] == 3) return false\n    state[node] = 1\n    for (next in graph[node]) {\n        if (!isSafe(graph, state, next)) {\n            state[node] = 3\n            return false\n        }\n    }\n    state[node] = 2\n    return true\n}\n\nfun eventualSafeNodes(graph: Array<IntArray>): IntArray {\n    val n = graph.size\n    val state = IntArray(n)\n    val out = ArrayList<Int>()\n    for (i in 0 until n) {\n        if (isSafe(graph, state, i)) out.add(i)\n    }\n    return out.toIntArray()\n}`,
              swift: `func isSafe(_ graph: [[Int]], _ state: inout [Int], _ node: Int) -> Bool {\n    if state[node] == 2 { return true }\n    if state[node] == 1 || state[node] == 3 { return false }\n    state[node] = 1\n    for next in graph[node] {\n        if !isSafe(graph, &state, next) {\n            state[node] = 3\n            return false\n        }\n    }\n    state[node] = 2\n    return true\n}\n\nfunc eventualSafeNodes(_ graph: [[Int]]) -> [Int] {\n    let n = graph.count\n    var state = [Int](repeating: 0, count: n)\n    var out: [Int] = []\n    for i in 0..<n {\n        if isSafe(graph, &state, i) { out.append(i) }\n    }\n    return out\n}`,
              rust: `fn is_safe(graph: &Vec<Vec<i32>>, state: &mut Vec<i32>, node: usize) -> bool {\n    if state[node] == 2 {\n        return true;\n    }\n    if state[node] == 1 || state[node] == 3 {\n        return false;\n    }\n    state[node] = 1;\n    for next in graph[node].clone().iter() {\n        if !is_safe(graph, state, *next as usize) {\n            state[node] = 3;\n            return false;\n        }\n    }\n    state[node] = 2;\n    true\n}\n\nfn eventualSafeNodes(graph: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = graph.len();\n    let mut state = vec![0i32; n];\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..n {\n        if is_safe(&graph, &mut state, i) {\n            out.push(i as i32);\n        }\n    }\n    out\n}`,
              php: `function isSafeNode($graph, &$state, $node) {\n    if ($state[$node] === 2) return true;\n    if ($state[$node] === 1 || $state[$node] === 3) return false;\n    $state[$node] = 1;\n    foreach ($graph[$node] as $next) {\n        if (!isSafeNode($graph, $state, $next)) {\n            $state[$node] = 3;\n            return false;\n        }\n    }\n    $state[$node] = 2;\n    return true;\n}\n\nfunction eventualSafeNodes($graph) {\n    $n = count($graph);\n    $state = array_fill(0, max($n, 1), 0);\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        if (isSafeNode($graph, $state, $i)) $out[] = $i;\n    }\n    return $out;\n}`,
              ruby: `def is_safe(graph, state, node)\n  return true if state[node] == 2\n  return false if state[node] == 1 || state[node] == 3\n  state[node] = 1\n  graph[node].each do |nxt|\n    unless is_safe(graph, state, nxt)\n      state[node] = 3\n      return false\n    end\n  end\n  state[node] = 2\n  true\nend\n\ndef eventualSafeNodes(graph)\n  n = graph.length\n  state = Array.new(n, 0)\n  (0...n).select { |i| is_safe(graph, state, i) }\nend`,
      },
    };
  })(),

  // ── Minimum Number of Vertices to Reach All Nodes ───────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const hasIncoming: boolean[] = [];
      for (let i = 0; i < n; i++) hasIncoming.push(false);
      for (let i = 0; i < edges.length; i++) hasIncoming[edges[i][1]] = true;
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        if (!hasIncoming[i]) out.push(i);
      }
      return out;
    };
    return {
      slug: "minimum-number-of-vertices-to-reach-all-nodes",
      title: "Minimum Number of Vertices to Reach All Nodes",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Amazon", "Google"],
      signature: { funcName: "findSmallestSetOfVertices", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **directed acyclic graph** with `n` nodes labelled `0` through `n - 1` and an edge list where `edges[i] = [from, to]`, find the smallest set of vertices from which every node in the graph is reachable.\n\nReturn that set in ascending order; it is unique.",
        [
          { in: "n = 6, edges = [[0,1],[0,2],[2,5],[3,4],[4,2]]", out: "[0,3]" },
          { in: "n = 5, edges = [[0,1],[2,1],[3,1],[1,4],[2,4]]", out: "[0,2,3]" },
          { in: "n = 3, edges = []", out: "[0,1,2]" },
        ],
        ["1 <= n <= 40", "0 <= edges.length <= 60", "The graph is a DAG with no duplicate edges."]),
      hints: [
        "A node with an incoming edge is reachable from somewhere else, so it never has to be in the set.",
        "A node with **no** incoming edge cannot be reached at all, so it must be in the set.",
        "Since the graph is acyclic, those source nodes alone reach everything — just count in-degrees.",
      ],
      examples: [
        { input: "6\n[[0,1],[0,2],[2,5],[3,4],[4,2]]", expectedOutput: "[0,3]" },
        { input: "5\n[[0,1],[2,1],[3,1],[1,4],[2,4]]", expectedOutput: "[0,2,3]" },
        { input: "3\n[]", expectedOutput: "[0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const seen = new Set<string>();
        const edges: number[][] = [];
        const target = ri(rng, 0, Math.min(60, n * 2));
        let attempts = 0;
        while (edges.length < target && attempts < target * 4 + 10) {
          attempts++;
          const a = ri(rng, 0, n - 1);
          const b = ri(rng, 0, n - 1);
          if (a >= b) continue;
          const key = `${a},${b}`;
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push([a, b]);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntArr(ref(n, edges)) };
      },
      solutions: {
        python: `def findSmallestSetOfVertices(n: int, edges):\n    has_incoming = [False] * n\n    for _, to in edges:\n        has_incoming[to] = True\n    return [i for i in range(n) if not has_incoming[i]]`,
        javascript: `var findSmallestSetOfVertices = function(n, edges) {\n    const hasIncoming = [];\n    for (let i = 0; i < n; i++) hasIncoming.push(false);\n    for (let i = 0; i < edges.length; i++) hasIncoming[edges[i][1]] = true;\n    const out = [];\n    for (let i = 0; i < n; i++) {\n        if (!hasIncoming[i]) out.push(i);\n    }\n    return out;\n};`,
              typescript: `function findSmallestSetOfVertices(n: number, edges: number[][]): number[] {\n    var hasIncoming: boolean[] = [];\n    for (var i = 0; i < n; i++) hasIncoming.push(false);\n    for (var j = 0; j < edges.length; j++) hasIncoming[edges[j][1]] = true;\n    var out: number[] = [];\n    for (var k = 0; k < n; k++) {\n        if (!hasIncoming[k]) out.push(k);\n    }\n    return out;\n}`,
              java: `public static int[] findSmallestSetOfVertices(int n, int[][] edges) {\n    boolean[] hasIncoming = new boolean[n];\n    for (int[] e : edges) hasIncoming[e[1]] = true;\n    List<Integer> out = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n        if (!hasIncoming[i]) out.add(i);\n    }\n    int[] result = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) result[i] = out.get(i);\n    return result;\n}`,
              cpp: `vector<int> findSmallestSetOfVertices(int n, vector<vector<int>>& edges) {\n    vector<bool> hasIncoming(n, false);\n    for (const auto& e : edges) hasIncoming[e[1]] = true;\n    vector<int> out;\n    for (int i = 0; i < n; i++) {\n        if (!hasIncoming[i]) out.push_back(i);\n    }\n    return out;\n}`,
              c: `int* findSmallestSetOfVertices(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize) {\n    char* hasIncoming = (char*) calloc((size_t) n, sizeof(char));\n    for (int i = 0; i < edgesSize; i++) hasIncoming[edges[i][1]] = 1;\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (!hasIncoming[i]) out[m++] = i;\n    }\n    free(hasIncoming);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[] FindSmallestSetOfVertices(int n, int[][] edges)\n{\n    bool[] hasIncoming = new bool[n];\n    foreach (int[] e in edges) hasIncoming[e[1]] = true;\n    var out_ = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        if (!hasIncoming[i]) out_.Add(i);\n    }\n    return out_.ToArray();\n}`,
              go: `func findSmallestSetOfVertices(n int, edges [][]int) []int {\n	hasIncoming := make([]bool, n)\n	for _, e := range edges {\n		hasIncoming[e[1]] = true\n	}\n	out := []int{}\n	for i := 0; i < n; i++ {\n		if !hasIncoming[i] {\n			out = append(out, i)\n		}\n	}\n	return out\n}`,
              kotlin: `fun findSmallestSetOfVertices(n: Int, edges: Array<IntArray>): IntArray {\n    val hasIncoming = BooleanArray(n)\n    for (e in edges) hasIncoming[e[1]] = true\n    val out = ArrayList<Int>()\n    for (i in 0 until n) {\n        if (!hasIncoming[i]) out.add(i)\n    }\n    return out.toIntArray()\n}`,
              swift: `func findSmallestSetOfVertices(_ n: Int, _ edges: [[Int]]) -> [Int] {\n    var hasIncoming = [Bool](repeating: false, count: n)\n    for e in edges { hasIncoming[e[1]] = true }\n    var out: [Int] = []\n    for i in 0..<n where !hasIncoming[i] {\n        out.append(i)\n    }\n    return out\n}`,
              rust: `fn findSmallestSetOfVertices(n: i32, edges: Vec<Vec<i32>>) -> Vec<i32> {\n    let size = n as usize;\n    let mut has_incoming = vec![false; size];\n    for e in edges.iter() {\n        has_incoming[e[1] as usize] = true;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..size {\n        if !has_incoming[i] {\n            out.push(i as i32);\n        }\n    }\n    out\n}`,
              php: `function findSmallestSetOfVertices($n, $edges) {\n    $hasIncoming = array_fill(0, $n, false);\n    foreach ($edges as $e) $hasIncoming[$e[1]] = true;\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        if (!$hasIncoming[$i]) $out[] = $i;\n    }\n    return $out;\n}`,
              ruby: `def findSmallestSetOfVertices(n, edges)\n  has_incoming = Array.new(n, false)\n  edges.each { |e| has_incoming[e[1]] = true }\n  (0...n).reject { |i| has_incoming[i] }\nend`,
      },
    };
  })(),

  // ── Number of Enclaves ──────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const rows = grid.length;
      const cols = grid[0].length;
      const seen = grid.map((row) => row.map(() => false));
      const stack: number[][] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const onBorder = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
          if (onBorder && grid[r][c] === 1 && !seen[r][c]) {
            seen[r][c] = true;
            stack.push([r, c]);
          }
        }
      }
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      while (stack.length > 0) {
        const cell = stack.pop() as number[];
        for (let d = 0; d < 4; d++) {
          const nr = cell[0] + dr[d];
          const nc = cell[1] + dc[d];
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          if (grid[nr][nc] === 1 && !seen[nr][nc]) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 1 && !seen[r][c]) count++;
        }
      }
      return count;
    };
    return {
      slug: "number-of-enclaves",
      title: "Number of Enclaves",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google"],
      signature: { funcName: "numEnclaves", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary matrix `grid` where `0` is sea and `1` is land. A move takes you to an adjacent land cell (up, down, left or right) or off the edge of the grid.\n\nReturn the number of land cells from which you **cannot** walk off the boundary.",
        [
          { in: "grid = [[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]]", out: "3" },
          { in: "grid = [[0,1,1,0],[0,0,1,0],[0,0,1,0],[0,0,0,0]]", out: "0" },
          { in: "grid = [[1]]", out: "0" },
        ],
        ["1 <= grid.length, grid[i].length <= 12", "grid[i][j] is 0 or 1."]),
      hints: [
        "Instead of testing each cell, flood the land that touches the border.",
        "Start a DFS or BFS from every land cell on the four edges and mark everything it reaches.",
        "The answer is the number of land cells that stayed unmarked.",
      ],
      examples: [
        { input: "[[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]]", expectedOutput: "3" },
        { input: "[[0,1,1,0],[0,0,1,0],[0,0,1,0],[0,0,0,0]]", expectedOutput: "0" },
        { input: "[[1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 12);
        const cols = ri(rng, 1, 12);
        const grid = randGrid(rng, rows, cols, 0, 1);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def numEnclaves(grid) -> int:\n    rows, cols = len(grid), len(grid[0])\n    seen = [[False] * cols for _ in range(rows)]\n    stack = []\n    for r in range(rows):\n        for c in range(cols):\n            on_border = r == 0 or c == 0 or r == rows - 1 or c == cols - 1\n            if on_border and grid[r][c] == 1 and not seen[r][c]:\n                seen[r][c] = True\n                stack.append((r, c))\n    while stack:\n        r, c = stack.pop()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:\n                seen[nr][nc] = True\n                stack.append((nr, nc))\n    return sum(1 for r in range(rows) for c in range(cols) if grid[r][c] == 1 and not seen[r][c])`,
        javascript: `var numEnclaves = function(grid) {\n    const rows = grid.length, cols = grid[0].length;\n    const seen = [];\n    for (let r = 0; r < rows; r++) {\n        const row = [];\n        for (let c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    const stack = [];\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            const onBorder = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;\n            if (onBorder && grid[r][c] === 1 && !seen[r][c]) {\n                seen[r][c] = true;\n                stack.push([r, c]);\n            }\n        }\n    }\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    while (stack.length > 0) {\n        const cell = stack.pop();\n        for (let d = 0; d < 4; d++) {\n            const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] === 1 && !seen[nr][nc]) {\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n    }\n    let count = 0;\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (grid[r][c] === 1 && !seen[r][c]) count++;\n        }\n    }\n    return count;\n};`,
              typescript: `function numEnclaves(grid: number[][]): number {\n    var rows = grid.length;\n    var cols = grid[0].length;\n    var seen: boolean[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: boolean[] = [];\n        for (var c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    var stack: number[][] = [];\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            var onBorder = r2 === 0 || c2 === 0 || r2 === rows - 1 || c2 === cols - 1;\n            if (onBorder && grid[r2][c2] === 1 && !seen[r2][c2]) {\n                seen[r2][c2] = true;\n                stack.push([r2, c2]);\n            }\n        }\n    }\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    while (stack.length > 0) {\n        var cell = stack.pop() as number[];\n        for (var d = 0; d < 4; d++) {\n            var nr = cell[0] + dr[d];\n            var nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] === 1 && !seen[nr][nc]) {\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n    }\n    var count = 0;\n    for (var r3 = 0; r3 < rows; r3++) {\n        for (var c3 = 0; c3 < cols; c3++) {\n            if (grid[r3][c3] === 1 && !seen[r3][c3]) count++;\n        }\n    }\n    return count;\n}`,
              java: `public static int numEnclaves(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length;\n    boolean[][] seen = new boolean[rows][cols];\n    Deque<int[]> stack = new ArrayDeque<>();\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            boolean onBorder = r == 0 || c == 0 || r == rows - 1 || c == cols - 1;\n            if (onBorder && grid[r][c] == 1 && !seen[r][c]) {\n                seen[r][c] = true;\n                stack.push(new int[]{r, c});\n            }\n        }\n    }\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] == 1 && !seen[nr][nc]) {\n                seen[nr][nc] = true;\n                stack.push(new int[]{nr, nc});\n            }\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == 1 && !seen[r][c]) count++;\n        }\n    }\n    return count;\n}`,
              cpp: `int numEnclaves(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    vector<pair<int,int>> stack;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            bool onBorder = r == 0 || c == 0 || r == rows - 1 || c == cols - 1;\n            if (onBorder && grid[r][c] == 1 && !seen[r][c]) {\n                seen[r][c] = true;\n                stack.push_back(make_pair(r, c));\n            }\n        }\n    }\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (!stack.empty()) {\n        pair<int,int> cell = stack.back();\n        stack.pop_back();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] == 1 && !seen[nr][nc]) {\n                seen[nr][nc] = true;\n                stack.push_back(make_pair(nr, nc));\n            }\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == 1 && !seen[r][c]) count++;\n        }\n    }\n    return count;\n}`,
              c: `int numEnclaves(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize, cols = gridColSize[0];\n    char* seen = (char*) calloc((size_t) (rows * cols), sizeof(char));\n    int* stack = (int*) malloc((size_t) (rows * cols) * sizeof(int));\n    int top = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            int onBorder = (r == 0 || c == 0 || r == rows - 1 || c == cols - 1);\n            if (onBorder && grid[r][c] == 1 && !seen[r * cols + c]) {\n                seen[r * cols + c] = 1;\n                stack[top++] = r * cols + c;\n            }\n        }\n    }\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (top > 0) {\n        int cell = stack[--top];\n        int cr = cell / cols, cc = cell % cols;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] == 1 && !seen[nr * cols + nc]) {\n                seen[nr * cols + nc] = 1;\n                stack[top++] = nr * cols + nc;\n            }\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == 1 && !seen[r * cols + c]) count++;\n        }\n    }\n    free(seen);\n    free(stack);\n    return count;\n}`,
              csharp: `public static int NumEnclaves(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    var stack = new List<int[]>();\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            bool onBorder = r == 0 || c == 0 || r == rows - 1 || c == cols - 1;\n            if (onBorder && grid[r][c] == 1 && !seen[r, c])\n            {\n                seen[r, c] = true;\n                stack.Add(new int[] { r, c });\n            }\n        }\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (stack.Count > 0)\n    {\n        int[] cell = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n            if (grid[nr][nc] == 1 && !seen[nr, nc])\n            {\n                seen[nr, nc] = true;\n                stack.Add(new int[] { nr, nc });\n            }\n        }\n    }\n    int count = 0;\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (grid[r][c] == 1 && !seen[r, c]) count++;\n        }\n    }\n    return count;\n}`,
              go: `func numEnclaves(grid [][]int) int {\n	rows, cols := len(grid), len(grid[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	stack := [][2]int{}\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			onBorder := r == 0 || c == 0 || r == rows-1 || c == cols-1\n			if onBorder && grid[r][c] == 1 && !seen[r][c] {\n				seen[r][c] = true\n				stack = append(stack, [2]int{r, c})\n			}\n		}\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		for d := 0; d < 4; d++ {\n			nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= rows || nc >= cols {\n				continue\n			}\n			if grid[nr][nc] == 1 && !seen[nr][nc] {\n				seen[nr][nc] = true\n				stack = append(stack, [2]int{nr, nc})\n			}\n		}\n	}\n	count := 0\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if grid[r][c] == 1 && !seen[r][c] {\n				count++\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun numEnclaves(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    val seen = Array(rows) { BooleanArray(cols) }\n    val stack = ArrayList<IntArray>()\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            val onBorder = r == 0 || c == 0 || r == rows - 1 || c == cols - 1\n            if (onBorder && grid[r][c] == 1 && !seen[r][c]) {\n                seen[r][c] = true\n                stack.add(intArrayOf(r, c))\n            }\n        }\n    }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    while (stack.isNotEmpty()) {\n        val cell = stack.removeAt(stack.size - 1)\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue\n            if (grid[nr][nc] == 1 && !seen[nr][nc]) {\n                seen[nr][nc] = true\n                stack.add(intArrayOf(nr, nc))\n            }\n        }\n    }\n    var count = 0\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (grid[r][c] == 1 && !seen[r][c]) count++\n        }\n    }\n    return count\n}`,
              swift: `func numEnclaves(_ grid: [[Int]]) -> Int {\n    let rows = grid.count\n    let cols = grid[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    var stack: [[Int]] = []\n    for r in 0..<rows {\n        for c in 0..<cols {\n            let onBorder = r == 0 || c == 0 || r == rows - 1 || c == cols - 1\n            if onBorder && grid[r][c] == 1 && !seen[r][c] {\n                seen[r][c] = true\n                stack.append([r, c])\n            }\n        }\n    }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    while let cell = stack.popLast() {\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= rows || nc >= cols { continue }\n            if grid[nr][nc] == 1 && !seen[nr][nc] {\n                seen[nr][nc] = true\n                stack.append([nr, nc])\n            }\n        }\n    }\n    var count = 0\n    for r in 0..<rows {\n        for c in 0..<cols {\n            if grid[r][c] == 1 && !seen[r][c] { count += 1 }\n        }\n    }\n    return count\n}`,
              rust: `fn numEnclaves(grid: Vec<Vec<i32>>) -> i32 {\n    let rows = grid.len();\n    let cols = grid[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    let mut stack: Vec<(usize, usize)> = Vec::new();\n    for r in 0..rows {\n        for c in 0..cols {\n            let on_border = r == 0 || c == 0 || r == rows - 1 || c == cols - 1;\n            if on_border && grid[r][c] == 1 && !seen[r][c] {\n                seen[r][c] = true;\n                stack.push((r, c));\n            }\n        }\n    }\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    while let Some((cr, cc)) = stack.pop() {\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if grid[nru][ncu] == 1 && !seen[nru][ncu] {\n                seen[nru][ncu] = true;\n                stack.push((nru, ncu));\n            }\n        }\n    }\n    let mut count = 0;\n    for r in 0..rows {\n        for c in 0..cols {\n            if grid[r][c] == 1 && !seen[r][c] {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
              php: `function numEnclaves($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $stack = array();\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            $onBorder = ($r === 0 || $c === 0 || $r === $rows - 1 || $c === $cols - 1);\n            if ($onBorder && $grid[$r][$c] === 1 && !$seen[$r][$c]) {\n                $seen[$r][$c] = true;\n                $stack[] = array($r, $c);\n            }\n        }\n    }\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols) continue;\n            if ($grid[$nr][$nc] === 1 && !$seen[$nr][$nc]) {\n                $seen[$nr][$nc] = true;\n                $stack[] = array($nr, $nc);\n            }\n        }\n    }\n    $count = 0;\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if ($grid[$r][$c] === 1 && !$seen[$r][$c]) $count++;\n        }\n    }\n    return $count;\n}`,
              ruby: `def numEnclaves(grid)\n  rows = grid.length\n  cols = grid[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  stack = []\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      on_border = r == 0 || c == 0 || r == rows - 1 || c == cols - 1\n      if on_border && grid[r][c] == 1 && !seen[r][c]\n        seen[r][c] = true\n        stack.push([r, c])\n      end\n    end\n  end\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  while !stack.empty?\n    cell = stack.pop\n    (0...4).each do |d|\n      nr = cell[0] + dr[d]\n      nc = cell[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= rows || nc >= cols\n      if grid[nr][nc] == 1 && !seen[nr][nc]\n        seen[nr][nc] = true\n        stack.push([nr, nc])\n      end\n    end\n  end\n  count = 0\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      count += 1 if grid[r][c] == 1 && !seen[r][c]\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Shortest Path in Binary Matrix ──────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
      const dist = grid.map((row) => row.map(() => -1));
      dist[0][0] = 1;
      const queue: number[][] = [[0, 0]];
      let head = 0;
      while (head < queue.length) {
        const cell = queue[head++];
        if (cell[0] === n - 1 && cell[1] === n - 1) return dist[cell[0]][cell[1]];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = cell[0] + dr;
            const nc = cell[1] + dc;
            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
            if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
            queue.push([nr, nc]);
          }
        }
      }
      return -1;
    };
    return {
      slug: "shortest-path-in-binary-matrix",
      title: "Shortest Path in Binary Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Matrix", "Amazon", "Google", "Meta"],
      signature: { funcName: "shortestPathBinaryMatrix", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `n x n` binary matrix `grid`, return the length of the shortest **clear path** from the top-left cell to the bottom-right cell, or `-1` if none exists.\n\nA clear path visits only cells holding `0`, moves between cells that share a side **or a corner**, and its length is the number of cells it visits.",
        [
          { in: "grid = [[0,1],[1,0]]", out: "2" },
          { in: "grid = [[0,0,0],[1,1,0],[1,1,0]]", out: "4" },
          { in: "grid = [[1,0,0],[1,1,0],[1,1,0]]", out: "-1" },
        ],
        ["1 <= grid.length <= 12", "grid[i].length == grid.length", "grid[i][j] is 0 or 1."]),
      hints: [
        "Every move costs the same, so breadth-first search finds the shortest path.",
        "Eight directions, not four — diagonals count here.",
        "Reject immediately if either corner is blocked, and count cells rather than steps.",
      ],
      examples: [
        { input: "[[0,1],[1,0]]", expectedOutput: "2" },
        { input: "[[0,0,0],[1,1,0],[1,1,0]]", expectedOutput: "4" },
        { input: "[[1,0,0],[1,1,0],[1,1,0]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < 0.35 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef shortestPathBinaryMatrix(grid) -> int:\n    n = len(grid)\n    if grid[0][0] == 1 or grid[n - 1][n - 1] == 1:\n        return -1\n    dist = [[-1] * n for _ in range(n)]\n    dist[0][0] = 1\n    queue = deque([(0, 0)])\n    while queue:\n        r, c = queue.popleft()\n        if r == n - 1 and c == n - 1:\n            return dist[r][c]\n        for dr in (-1, 0, 1):\n            for dc in (-1, 0, 1):\n                if dr == 0 and dc == 0:\n                    continue\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and dist[nr][nc] == -1:\n                    dist[nr][nc] = dist[r][c] + 1\n                    queue.append((nr, nc))\n    return -1`,
        javascript: `var shortestPathBinaryMatrix = function(grid) {\n    const n = grid.length;\n    if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;\n    const dist = [];\n    for (let r = 0; r < n; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    dist[0][0] = 1;\n    const queue = [[0, 0]];\n    let head = 0;\n    while (head < queue.length) {\n        const cell = queue[head++];\n        if (cell[0] === n - 1 && cell[1] === n - 1) return dist[cell[0]][cell[1]];\n        for (let dr = -1; dr <= 1; dr++) {\n            for (let dc = -1; dc <= 1; dc++) {\n                if (dr === 0 && dc === 0) continue;\n                const nr = cell[0] + dr, nc = cell[1] + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.push([nr, nc]);\n            }\n        }\n    }\n    return -1;\n};`,
              typescript: `function shortestPathBinaryMatrix(grid: number[][]): number {\n    var n = grid.length;\n    if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;\n    var dist: number[][] = [];\n    for (var r = 0; r < n; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    dist[0][0] = 1;\n    var queue: number[][] = [[0, 0]];\n    var head = 0;\n    while (head < queue.length) {\n        var cell = queue[head++];\n        if (cell[0] === n - 1 && cell[1] === n - 1) return dist[cell[0]][cell[1]];\n        for (var dr = -1; dr <= 1; dr++) {\n            for (var dc = -1; dc <= 1; dc++) {\n                if (dr === 0 && dc === 0) continue;\n                var nr = cell[0] + dr;\n                var nc = cell[1] + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.push([nr, nc]);\n            }\n        }\n    }\n    return -1;\n}`,
              java: `public static int shortestPathBinaryMatrix(int[][] grid) {\n    int n = grid.length;\n    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;\n    int[][] dist = new int[n][n];\n    for (int[] row : dist) Arrays.fill(row, -1);\n    dist[0][0] = 1;\n    Deque<int[]> queue = new ArrayDeque<>();\n    queue.addLast(new int[]{0, 0});\n    while (!queue.isEmpty()) {\n        int[] cell = queue.pollFirst();\n        if (cell[0] == n - 1 && cell[1] == n - 1) return dist[cell[0]][cell[1]];\n        for (int dr = -1; dr <= 1; dr++) {\n            for (int dc = -1; dc <= 1; dc++) {\n                if (dr == 0 && dc == 0) continue;\n                int nr = cell[0] + dr, nc = cell[1] + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n                queue.addLast(new int[]{nr, nc});\n            }\n        }\n    }\n    return -1;\n}`,
              cpp: `int shortestPathBinaryMatrix(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;\n    vector<vector<int>> dist(n, vector<int>(n, -1));\n    dist[0][0] = 1;\n    vector<pair<int,int>> queue;\n    queue.push_back(make_pair(0, 0));\n    size_t head = 0;\n    while (head < queue.size()) {\n        pair<int,int> cell = queue[head++];\n        if (cell.first == n - 1 && cell.second == n - 1) return dist[cell.first][cell.second];\n        for (int dr = -1; dr <= 1; dr++) {\n            for (int dc = -1; dc <= 1; dc++) {\n                if (dr == 0 && dc == 0) continue;\n                int nr = cell.first + dr, nc = cell.second + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;\n                dist[nr][nc] = dist[cell.first][cell.second] + 1;\n                queue.push_back(make_pair(nr, nc));\n            }\n        }\n    }\n    return -1;\n}`,
              c: `int shortestPathBinaryMatrix(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;\n    int* dist = (int*) malloc((size_t) (n * n) * sizeof(int));\n    for (int i = 0; i < n * n; i++) dist[i] = -1;\n    int* queue = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int head = 0, tail = 0;\n    dist[0] = 1;\n    queue[tail++] = 0;\n    while (head < tail) {\n        int cell = queue[head++];\n        int cr = cell / n, cc = cell % n;\n        if (cr == n - 1 && cc == n - 1) {\n            int answer = dist[cell];\n            free(dist);\n            free(queue);\n            return answer;\n        }\n        for (int dr = -1; dr <= 1; dr++) {\n            for (int dc = -1; dc <= 1; dc++) {\n                if (dr == 0 && dc == 0) continue;\n                int nr = cr + dr, nc = cc + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] == 1 || dist[nr * n + nc] != -1) continue;\n                dist[nr * n + nc] = dist[cell] + 1;\n                queue[tail++] = nr * n + nc;\n            }\n        }\n    }\n    free(dist);\n    free(queue);\n    return -1;\n}`,
              csharp: `public static int ShortestPathBinaryMatrix(int[][] grid)\n{\n    int n = grid.Length;\n    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;\n    int[,] dist = new int[n, n];\n    for (int r = 0; r < n; r++)\n    {\n        for (int c = 0; c < n; c++) dist[r, c] = -1;\n    }\n    dist[0, 0] = 1;\n    var queue = new Queue<int[]>();\n    queue.Enqueue(new int[] { 0, 0 });\n    while (queue.Count > 0)\n    {\n        int[] cell = queue.Dequeue();\n        if (cell[0] == n - 1 && cell[1] == n - 1) return dist[cell[0], cell[1]];\n        for (int dr = -1; dr <= 1; dr++)\n        {\n            for (int dc = -1; dc <= 1; dc++)\n            {\n                if (dr == 0 && dc == 0) continue;\n                int nr = cell[0] + dr, nc = cell[1] + dc;\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                if (grid[nr][nc] == 1 || dist[nr, nc] != -1) continue;\n                dist[nr, nc] = dist[cell[0], cell[1]] + 1;\n                queue.Enqueue(new int[] { nr, nc });\n            }\n        }\n    }\n    return -1;\n}`,
              go: `func shortestPathBinaryMatrix(grid [][]int) int {\n	n := len(grid)\n	if grid[0][0] == 1 || grid[n-1][n-1] == 1 {\n		return -1\n	}\n	dist := make([][]int, n)\n	for i := range dist {\n		dist[i] = make([]int, n)\n		for j := range dist[i] {\n			dist[i][j] = -1\n		}\n	}\n	dist[0][0] = 1\n	queue := [][2]int{{0, 0}}\n	head := 0\n	for head < len(queue) {\n		cell := queue[head]\n		head++\n		if cell[0] == n-1 && cell[1] == n-1 {\n			return dist[cell[0]][cell[1]]\n		}\n		for dr := -1; dr <= 1; dr++ {\n			for dc := -1; dc <= 1; dc++ {\n				if dr == 0 && dc == 0 {\n					continue\n				}\n				nr, nc := cell[0]+dr, cell[1]+dc\n				if nr < 0 || nc < 0 || nr >= n || nc >= n {\n					continue\n				}\n				if grid[nr][nc] == 1 || dist[nr][nc] != -1 {\n					continue\n				}\n				dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n				queue = append(queue, [2]int{nr, nc})\n			}\n		}\n	}\n	return -1\n}`,
              kotlin: `fun shortestPathBinaryMatrix(grid: Array<IntArray>): Int {\n    val n = grid.size\n    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1\n    val dist = Array(n) { IntArray(n) { -1 } }\n    dist[0][0] = 1\n    val queue = ArrayList<IntArray>()\n    queue.add(intArrayOf(0, 0))\n    var head = 0\n    while (head < queue.size) {\n        val cell = queue[head++]\n        if (cell[0] == n - 1 && cell[1] == n - 1) return dist[cell[0]][cell[1]]\n        for (dr in -1..1) {\n            for (dc in -1..1) {\n                if (dr == 0 && dc == 0) continue\n                val nr = cell[0] + dr\n                val nc = cell[1] + dc\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue\n                if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n                queue.add(intArrayOf(nr, nc))\n            }\n        }\n    }\n    return -1\n}`,
              swift: `func shortestPathBinaryMatrix(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    if grid[0][0] == 1 || grid[n - 1][n - 1] == 1 { return -1 }\n    var dist = [[Int]](repeating: [Int](repeating: -1, count: n), count: n)\n    dist[0][0] = 1\n    var queue: [[Int]] = [[0, 0]]\n    var head = 0\n    while head < queue.count {\n        let cell = queue[head]\n        head += 1\n        if cell[0] == n - 1 && cell[1] == n - 1 { return dist[cell[0]][cell[1]] }\n        for dr in -1...1 {\n            for dc in -1...1 {\n                if dr == 0 && dc == 0 { continue }\n                let nr = cell[0] + dr\n                let nc = cell[1] + dc\n                if nr < 0 || nc < 0 || nr >= n || nc >= n { continue }\n                if grid[nr][nc] == 1 || dist[nr][nc] != -1 { continue }\n                dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n                queue.append([nr, nc])\n            }\n        }\n    }\n    return -1\n}`,
              rust: `fn shortestPathBinaryMatrix(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    if grid[0][0] == 1 || grid[n - 1][n - 1] == 1 {\n        return -1;\n    }\n    let mut dist = vec![vec![-1i32; n]; n];\n    dist[0][0] = 1;\n    let mut queue: Vec<(usize, usize)> = vec![(0, 0)];\n    let mut head = 0usize;\n    while head < queue.len() {\n        let (cr, cc) = queue[head];\n        head += 1;\n        if cr == n - 1 && cc == n - 1 {\n            return dist[cr][cc];\n        }\n        for dr in -1i32..=1 {\n            for dc in -1i32..=1 {\n                if dr == 0 && dc == 0 {\n                    continue;\n                }\n                let nr = cr as i32 + dr;\n                let nc = cc as i32 + dc;\n                if nr < 0 || nc < 0 || nr >= n as i32 || nc >= n as i32 {\n                    continue;\n                }\n                let (nru, ncu) = (nr as usize, nc as usize);\n                if grid[nru][ncu] == 1 || dist[nru][ncu] != -1 {\n                    continue;\n                }\n                dist[nru][ncu] = dist[cr][cc] + 1;\n                queue.push((nru, ncu));\n            }\n        }\n    }\n    -1\n}`,
              php: `function shortestPathBinaryMatrix($grid) {\n    $n = count($grid);\n    if ($grid[0][0] === 1 || $grid[$n - 1][$n - 1] === 1) return -1;\n    $dist = array();\n    for ($r = 0; $r < $n; $r++) $dist[] = array_fill(0, $n, -1);\n    $dist[0][0] = 1;\n    $queue = array(array(0, 0));\n    $head = 0;\n    while ($head < count($queue)) {\n        $cell = $queue[$head++];\n        if ($cell[0] === $n - 1 && $cell[1] === $n - 1) return $dist[$cell[0]][$cell[1]];\n        for ($dr = -1; $dr <= 1; $dr++) {\n            for ($dc = -1; $dc <= 1; $dc++) {\n                if ($dr === 0 && $dc === 0) continue;\n                $nr = $cell[0] + $dr;\n                $nc = $cell[1] + $dc;\n                if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n) continue;\n                if ($grid[$nr][$nc] === 1 || $dist[$nr][$nc] !== -1) continue;\n                $dist[$nr][$nc] = $dist[$cell[0]][$cell[1]] + 1;\n                $queue[] = array($nr, $nc);\n            }\n        }\n    }\n    return -1;\n}`,
              ruby: `def shortestPathBinaryMatrix(grid)\n  n = grid.length\n  return -1 if grid[0][0] == 1 || grid[n - 1][n - 1] == 1\n  dist = Array.new(n) { Array.new(n, -1) }\n  dist[0][0] = 1\n  queue = [[0, 0]]\n  head = 0\n  while head < queue.length\n    cell = queue[head]\n    head += 1\n    return dist[cell[0]][cell[1]] if cell[0] == n - 1 && cell[1] == n - 1\n    (-1..1).each do |dr|\n      (-1..1).each do |dc|\n        next if dr == 0 && dc == 0\n        nr = cell[0] + dr\n        nc = cell[1] + dc\n        next if nr < 0 || nc < 0 || nr >= n || nc >= n\n        next if grid[nr][nc] == 1 || dist[nr][nc] != -1\n        dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n        queue.push([nr, nc])\n      end\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── As Far from Land as Possible ────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const dist = grid.map((row) => row.map(() => -1));
      const queue: number[][] = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 1) {
            dist[r][c] = 0;
            queue.push([r, c]);
          }
        }
      }
      if (queue.length === 0 || queue.length === n * n) return -1;
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      let head = 0;
      let best = 0;
      while (head < queue.length) {
        const cell = queue[head++];
        for (let d = 0; d < 4; d++) {
          const nr = cell[0] + dr[d];
          const nc = cell[1] + dc[d];
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
          if (dist[nr][nc] !== -1) continue;
          dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
          if (dist[nr][nc] > best) best = dist[nr][nc];
          queue.push([nr, nc]);
        }
      }
      return best;
    };
    return {
      slug: "as-far-from-land-as-possible",
      title: "As Far from Land as Possible",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Breadth-First Search", "Matrix", "Amazon", "Google", "Uber"],
      signature: { funcName: "maxDistance", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `n x n` grid where `0` is water and `1` is land, find the water cell whose **Manhattan distance** to the nearest land cell is largest, and return that distance.\n\nIf the grid is all land or all water, return `-1`.",
        [
          { in: "grid = [[1,0,1],[0,0,0],[1,0,1]]", out: "2", note: "The centre is two steps from any land." },
          { in: "grid = [[1,0,0],[0,0,0],[0,0,0]]", out: "4" },
          { in: "grid = [[1,1],[1,1]]", out: "-1" },
        ],
        ["1 <= grid.length <= 12", "grid[i].length == grid.length", "grid[i][j] is 0 or 1."]),
      hints: [
        "Running a BFS from every water cell is wasteful — run one BFS from **all** land cells at once.",
        "Seed the queue with every land cell at distance 0 and expand outward.",
        "The last distance assigned is the answer; handle the all-land and all-water cases separately.",
      ],
      examples: [
        { input: "[[1,0,1],[0,0,0],[1,0,1]]", expectedOutput: "2" },
        { input: "[[1,0,0],[0,0,0],[0,0,0]]", expectedOutput: "4" },
        { input: "[[1,1],[1,1]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < 0.25 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef maxDistance(grid) -> int:\n    n = len(grid)\n    dist = [[-1] * n for _ in range(n)]\n    queue = deque()\n    for r in range(n):\n        for c in range(n):\n            if grid[r][c] == 1:\n                dist[r][c] = 0\n                queue.append((r, c))\n    if not queue or len(queue) == n * n:\n        return -1\n    best = 0\n    while queue:\n        r, c = queue.popleft()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < n and 0 <= nc < n and dist[nr][nc] == -1:\n                dist[nr][nc] = dist[r][c] + 1\n                best = max(best, dist[nr][nc])\n                queue.append((nr, nc))\n    return best`,
        javascript: `var maxDistance = function(grid) {\n    const n = grid.length;\n    const dist = [];\n    for (let r = 0; r < n; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    const queue = [];\n    for (let r = 0; r < n; r++) {\n        for (let c = 0; c < n; c++) {\n            if (grid[r][c] === 1) {\n                dist[r][c] = 0;\n                queue.push([r, c]);\n            }\n        }\n    }\n    if (queue.length === 0 || queue.length === n * n) return -1;\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    let head = 0, best = 0;\n    while (head < queue.length) {\n        const cell = queue[head++];\n        for (let d = 0; d < 4; d++) {\n            const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] !== -1) continue;\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n            if (dist[nr][nc] > best) best = dist[nr][nc];\n            queue.push([nr, nc]);\n        }\n    }\n    return best;\n};`,
              typescript: `function maxDistance(grid: number[][]): number {\n    var n = grid.length;\n    var dist: number[][] = [];\n    for (var r = 0; r < n; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    var queue: number[][] = [];\n    for (var r2 = 0; r2 < n; r2++) {\n        for (var c2 = 0; c2 < n; c2++) {\n            if (grid[r2][c2] === 1) {\n                dist[r2][c2] = 0;\n                queue.push([r2, c2]);\n            }\n        }\n    }\n    if (queue.length === 0 || queue.length === n * n) return -1;\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var head = 0;\n    var best = 0;\n    while (head < queue.length) {\n        var cell = queue[head++];\n        for (var d = 0; d < 4; d++) {\n            var nr = cell[0] + dr[d];\n            var nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] !== -1) continue;\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n            if (dist[nr][nc] > best) best = dist[nr][nc];\n            queue.push([nr, nc]);\n        }\n    }\n    return best;\n}`,
              java: `public static int maxDistance(int[][] grid) {\n    int n = grid.length;\n    int[][] dist = new int[n][n];\n    for (int[] row : dist) Arrays.fill(row, -1);\n    List<int[]> queue = new ArrayList<>();\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                dist[r][c] = 0;\n                queue.add(new int[]{r, c});\n            }\n        }\n    }\n    if (queue.isEmpty() || queue.size() == n * n) return -1;\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    int head = 0, best = 0;\n    while (head < queue.size()) {\n        int[] cell = queue.get(head++);\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] != -1) continue;\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n            best = Math.max(best, dist[nr][nc]);\n            queue.add(new int[]{nr, nc});\n        }\n    }\n    return best;\n}`,
              cpp: `int maxDistance(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    vector<vector<int>> dist(n, vector<int>(n, -1));\n    vector<pair<int,int>> queue;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                dist[r][c] = 0;\n                queue.push_back(make_pair(r, c));\n            }\n        }\n    }\n    if (queue.empty() || (int) queue.size() == n * n) return -1;\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    size_t head = 0;\n    int best = 0;\n    while (head < queue.size()) {\n        pair<int,int> cell = queue[head++];\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] != -1) continue;\n            dist[nr][nc] = dist[cell.first][cell.second] + 1;\n            best = max(best, dist[nr][nc]);\n            queue.push_back(make_pair(nr, nc));\n        }\n    }\n    return best;\n}`,
              c: `int maxDistance(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    int* dist = (int*) malloc((size_t) (n * n) * sizeof(int));\n    for (int i = 0; i < n * n; i++) dist[i] = -1;\n    int* queue = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            if (grid[r][c] == 1) {\n                dist[r * n + c] = 0;\n                queue[tail++] = r * n + c;\n            }\n        }\n    }\n    if (tail == 0 || tail == n * n) {\n        free(dist);\n        free(queue);\n        return -1;\n    }\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    int best = 0;\n    while (head < tail) {\n        int cell = queue[head++];\n        int cr = cell / n, cc = cell % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr * n + nc] != -1) continue;\n            dist[nr * n + nc] = dist[cell] + 1;\n            if (dist[nr * n + nc] > best) best = dist[nr * n + nc];\n            queue[tail++] = nr * n + nc;\n        }\n    }\n    free(dist);\n    free(queue);\n    return best;\n}`,
              csharp: `public static int MaxDistance(int[][] grid)\n{\n    int n = grid.Length;\n    int[,] dist = new int[n, n];\n    for (int r = 0; r < n; r++)\n    {\n        for (int c = 0; c < n; c++) dist[r, c] = -1;\n    }\n    var queue = new List<int[]>();\n    for (int r = 0; r < n; r++)\n    {\n        for (int c = 0; c < n; c++)\n        {\n            if (grid[r][c] == 1)\n            {\n                dist[r, c] = 0;\n                queue.Add(new int[] { r, c });\n            }\n        }\n    }\n    if (queue.Count == 0 || queue.Count == n * n) return -1;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int head = 0, best = 0;\n    while (head < queue.Count)\n    {\n        int[] cell = queue[head++];\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr, nc] != -1) continue;\n            dist[nr, nc] = dist[cell[0], cell[1]] + 1;\n            best = Math.Max(best, dist[nr, nc]);\n            queue.Add(new int[] { nr, nc });\n        }\n    }\n    return best;\n}`,
              go: `func maxDistance(grid [][]int) int {\n	n := len(grid)\n	dist := make([][]int, n)\n	for i := range dist {\n		dist[i] = make([]int, n)\n		for j := range dist[i] {\n			dist[i][j] = -1\n		}\n	}\n	queue := [][2]int{}\n	for r := 0; r < n; r++ {\n		for c := 0; c < n; c++ {\n			if grid[r][c] == 1 {\n				dist[r][c] = 0\n				queue = append(queue, [2]int{r, c})\n			}\n		}\n	}\n	if len(queue) == 0 || len(queue) == n*n {\n		return -1\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	head, best := 0, 0\n	for head < len(queue) {\n		cell := queue[head]\n		head++\n		for d := 0; d < 4; d++ {\n			nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= n || nc >= n {\n				continue\n			}\n			if dist[nr][nc] != -1 {\n				continue\n			}\n			dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n			if dist[nr][nc] > best {\n				best = dist[nr][nc]\n			}\n			queue = append(queue, [2]int{nr, nc})\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxDistance(grid: Array<IntArray>): Int {\n    val n = grid.size\n    val dist = Array(n) { IntArray(n) { -1 } }\n    val queue = ArrayList<IntArray>()\n    for (r in 0 until n) {\n        for (c in 0 until n) {\n            if (grid[r][c] == 1) {\n                dist[r][c] = 0\n                queue.add(intArrayOf(r, c))\n            }\n        }\n    }\n    if (queue.isEmpty() || queue.size == n * n) return -1\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var head = 0\n    var best = 0\n    while (head < queue.size) {\n        val cell = queue[head++]\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue\n            if (dist[nr][nc] != -1) continue\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n            if (dist[nr][nc] > best) best = dist[nr][nc]\n            queue.add(intArrayOf(nr, nc))\n        }\n    }\n    return best\n}`,
              swift: `func maxDistance(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var dist = [[Int]](repeating: [Int](repeating: -1, count: n), count: n)\n    var queue: [[Int]] = []\n    for r in 0..<n {\n        for c in 0..<n {\n            if grid[r][c] == 1 {\n                dist[r][c] = 0\n                queue.append([r, c])\n            }\n        }\n    }\n    if queue.isEmpty || queue.count == n * n { return -1 }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var head = 0\n    var best = 0\n    while head < queue.count {\n        let cell = queue[head]\n        head += 1\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= n || nc >= n { continue }\n            if dist[nr][nc] != -1 { continue }\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n            if dist[nr][nc] > best { best = dist[nr][nc] }\n            queue.append([nr, nc])\n        }\n    }\n    return best\n}`,
              rust: `fn maxDistance(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut dist = vec![vec![-1i32; n]; n];\n    let mut queue: Vec<(usize, usize)> = Vec::new();\n    for r in 0..n {\n        for c in 0..n {\n            if grid[r][c] == 1 {\n                dist[r][c] = 0;\n                queue.push((r, c));\n            }\n        }\n    }\n    if queue.is_empty() || queue.len() == n * n {\n        return -1;\n    }\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    let mut head = 0usize;\n    let mut best = 0i32;\n    while head < queue.len() {\n        let (cr, cc) = queue[head];\n        head += 1;\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= n as i32 || nc >= n as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if dist[nru][ncu] != -1 {\n                continue;\n            }\n            dist[nru][ncu] = dist[cr][cc] + 1;\n            if dist[nru][ncu] > best {\n                best = dist[nru][ncu];\n            }\n            queue.push((nru, ncu));\n        }\n    }\n    best\n}`,
              php: `function maxDistance($grid) {\n    $n = count($grid);\n    $dist = array();\n    for ($r = 0; $r < $n; $r++) $dist[] = array_fill(0, $n, -1);\n    $queue = array();\n    for ($r = 0; $r < $n; $r++) {\n        for ($c = 0; $c < $n; $c++) {\n            if ($grid[$r][$c] === 1) {\n                $dist[$r][$c] = 0;\n                $queue[] = array($r, $c);\n            }\n        }\n    }\n    if (count($queue) === 0 || count($queue) === $n * $n) return -1;\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    $head = 0;\n    $best = 0;\n    while ($head < count($queue)) {\n        $cell = $queue[$head++];\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n) continue;\n            if ($dist[$nr][$nc] !== -1) continue;\n            $dist[$nr][$nc] = $dist[$cell[0]][$cell[1]] + 1;\n            if ($dist[$nr][$nc] > $best) $best = $dist[$nr][$nc];\n            $queue[] = array($nr, $nc);\n        }\n    }\n    return $best;\n}`,
              ruby: `def maxDistance(grid)\n  n = grid.length\n  dist = Array.new(n) { Array.new(n, -1) }\n  queue = []\n  (0...n).each do |r|\n    (0...n).each do |c|\n      if grid[r][c] == 1\n        dist[r][c] = 0\n        queue.push([r, c])\n      end\n    end\n  end\n  return -1 if queue.empty? || queue.length == n * n\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  head = 0\n  best = 0\n  while head < queue.length\n    cell = queue[head]\n    head += 1\n    (0...4).each do |d|\n      nr = cell[0] + dr[d]\n      nc = cell[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= n || nc >= n\n      next if dist[nr][nc] != -1\n      dist[nr][nc] = dist[cell[0]][cell[1]] + 1\n      best = dist[nr][nc] if dist[nr][nc] > best\n      queue.push([nr, nc])\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Sub Islands ───────────────────────────────────────────
  (() => {
    const ref = (grid1: number[][], grid2: number[][]) => {
      const rows = grid2.length;
      const cols = grid2[0].length;
      const seen = grid2.map((row) => row.map(() => false));
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid2[r][c] !== 1 || seen[r][c]) continue;
          seen[r][c] = true;
          const stack: number[][] = [[r, c]];
          let contained = true;
          while (stack.length > 0) {
            const cell = stack.pop() as number[];
            if (grid1[cell[0]][cell[1]] !== 1) contained = false;
            for (let d = 0; d < 4; d++) {
              const nr = cell[0] + dr[d];
              const nc = cell[1] + dc[d];
              if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
              if (grid2[nr][nc] !== 1 || seen[nr][nc]) continue;
              seen[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
          if (contained) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-sub-islands",
      title: "Count Sub Islands",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google"],
      signature: { funcName: "countSubIslands", params: [{ name: "grid1", type: "int[][]" as const }, { name: "grid2", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given two binary matrices `grid1` and `grid2` of the same size, where `1` is land and `0` is water. An **island** is a maximal group of land cells connected up, down, left or right.\n\nAn island in `grid2` is a **sub-island** if every one of its cells is also land in `grid1`. Return the number of sub-islands.",
        [
          { in: "grid1 = [[1,1],[0,1]], grid2 = [[1,1],[0,0]]", out: "1" },
          { in: "grid1 = [[1,0],[0,1]], grid2 = [[1,0],[0,1]]", out: "2" },
          { in: "grid1 = [[0]], grid2 = [[1]]", out: "0" },
        ],
        ["1 <= grid1.length, grid1[i].length <= 12", "grid2 has the same dimensions as grid1.", "Cells are 0 or 1."]),
      hints: [
        "Walk each island of `grid2` once with a DFS or BFS.",
        "While walking, check every cell against `grid1` and remember whether any cell failed.",
        "Do **not** stop the traversal early on a failure — you still need to mark the whole island as visited.",
      ],
      examples: [
        { input: "[[1,1],[0,1]]\n[[1,1],[0,0]]", expectedOutput: "1" },
        { input: "[[1,0],[0,1]]\n[[1,0],[0,1]]", expectedOutput: "2" },
        { input: "[[0]]\n[[1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 12);
        const cols = ri(rng, 1, 12);
        const grid1 = randGrid(rng, rows, cols, 0, 1);
        const grid2 = randGrid(rng, rows, cols, 0, 1);
        return { input: `${fmtIntMat(grid1)}\n${fmtIntMat(grid2)}`, expectedOutput: String(ref(grid1, grid2)) };
      },
      solutions: {
        python: `def countSubIslands(grid1, grid2) -> int:\n    rows, cols = len(grid2), len(grid2[0])\n    seen = [[False] * cols for _ in range(rows)]\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid2[r][c] != 1 or seen[r][c]:\n                continue\n            seen[r][c] = True\n            stack = [(r, c)]\n            contained = True\n            while stack:\n                cr, cc = stack.pop()\n                if grid1[cr][cc] != 1:\n                    contained = False\n                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):\n                    if 0 <= nr < rows and 0 <= nc < cols and grid2[nr][nc] == 1 and not seen[nr][nc]:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n            if contained:\n                count += 1\n    return count`,
        javascript: `var countSubIslands = function(grid1, grid2) {\n    const rows = grid2.length, cols = grid2[0].length;\n    const seen = [];\n    for (let r = 0; r < rows; r++) {\n        const row = [];\n        for (let c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    let count = 0;\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (grid2[r][c] !== 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            const stack = [[r, c]];\n            let contained = true;\n            while (stack.length > 0) {\n                const cell = stack.pop();\n                if (grid1[cell[0]][cell[1]] !== 1) contained = false;\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] !== 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc]);\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    return count;\n};`,
              typescript: `function countSubIslands(grid1: number[][], grid2: number[][]): number {\n    var rows = grid2.length;\n    var cols = grid2[0].length;\n    var seen: boolean[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: boolean[] = [];\n        for (var c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var count = 0;\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            if (grid2[r2][c2] !== 1 || seen[r2][c2]) continue;\n            seen[r2][c2] = true;\n            var stack: number[][] = [[r2, c2]];\n            var contained = true;\n            while (stack.length > 0) {\n                var cell = stack.pop() as number[];\n                if (grid1[cell[0]][cell[1]] !== 1) contained = false;\n                for (var d = 0; d < 4; d++) {\n                    var nr = cell[0] + dr[d];\n                    var nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] !== 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc]);\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    return count;\n}`,
              java: `public static int countSubIslands(int[][] grid1, int[][] grid2) {\n    int rows = grid2.length, cols = grid2[0].length;\n    boolean[][] seen = new boolean[rows][cols];\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid2[r][c] != 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{r, c});\n            boolean contained = true;\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                if (grid1[cell[0]][cell[1]] != 1) contained = false;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push(new int[]{nr, nc});\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    return count;\n}`,
              cpp: `int countSubIslands(vector<vector<int>>& grid1, vector<vector<int>>& grid2) {\n    int rows = (int) grid2.size(), cols = (int) grid2[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid2[r][c] != 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            vector<pair<int,int>> stack;\n            stack.push_back(make_pair(r, c));\n            bool contained = true;\n            while (!stack.empty()) {\n                pair<int,int> cell = stack.back();\n                stack.pop_back();\n                if (grid1[cell.first][cell.second] != 1) contained = false;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push_back(make_pair(nr, nc));\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    return count;\n}`,
              c: `int countSubIslands(int** grid1, int grid1Size, int* grid1ColSize, int** grid2, int grid2Size, int* grid2ColSize) {\n    int rows = grid2Size, cols = grid2ColSize[0];\n    char* seen = (char*) calloc((size_t) (rows * cols), sizeof(char));\n    int* stack = (int*) malloc((size_t) (rows * cols) * sizeof(int));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid2[r][c] != 1 || seen[r * cols + c]) continue;\n            seen[r * cols + c] = 1;\n            int top = 0;\n            stack[top++] = r * cols + c;\n            int contained = 1;\n            while (top > 0) {\n                int cell = stack[--top];\n                int cr = cell / cols, cc = cell % cols;\n                if (grid1[cr][cc] != 1) contained = 0;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cr + dr[d], nc = cc + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] != 1 || seen[nr * cols + nc]) continue;\n                    seen[nr * cols + nc] = 1;\n                    stack[top++] = nr * cols + nc;\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    free(seen);\n    free(stack);\n    return count;\n}`,
              csharp: `public static int CountSubIslands(int[][] grid1, int[][] grid2)\n{\n    int rows = grid2.Length, cols = grid2[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int count = 0;\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (grid2[r][c] != 1 || seen[r, c]) continue;\n            seen[r, c] = true;\n            var stack = new List<int[]>();\n            stack.Add(new int[] { r, c });\n            bool contained = true;\n            while (stack.Count > 0)\n            {\n                int[] cell = stack[stack.Count - 1];\n                stack.RemoveAt(stack.Count - 1);\n                if (grid1[cell[0]][cell[1]] != 1) contained = false;\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid2[nr][nc] != 1 || seen[nr, nc]) continue;\n                    seen[nr, nc] = true;\n                    stack.Add(new int[] { nr, nc });\n                }\n            }\n            if (contained) count++;\n        }\n    }\n    return count;\n}`,
              go: `func countSubIslands(grid1 [][]int, grid2 [][]int) int {\n	rows, cols := len(grid2), len(grid2[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	count := 0\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if grid2[r][c] != 1 || seen[r][c] {\n				continue\n			}\n			seen[r][c] = true\n			stack := [][2]int{{r, c}}\n			contained := true\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				if grid1[cell[0]][cell[1]] != 1 {\n					contained = false\n				}\n				for d := 0; d < 4; d++ {\n					nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n					if nr < 0 || nc < 0 || nr >= rows || nc >= cols {\n						continue\n					}\n					if grid2[nr][nc] != 1 || seen[nr][nc] {\n						continue\n					}\n					seen[nr][nc] = true\n					stack = append(stack, [2]int{nr, nc})\n				}\n			}\n			if contained {\n				count++\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun countSubIslands(grid1: Array<IntArray>, grid2: Array<IntArray>): Int {\n    val rows = grid2.size\n    val cols = grid2[0].size\n    val seen = Array(rows) { BooleanArray(cols) }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    var count = 0\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (grid2[r][c] != 1 || seen[r][c]) continue\n            seen[r][c] = true\n            val stack = ArrayList<IntArray>()\n            stack.add(intArrayOf(r, c))\n            var contained = true\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                if (grid1[cell[0]][cell[1]] != 1) contained = false\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue\n                    if (grid2[nr][nc] != 1 || seen[nr][nc]) continue\n                    seen[nr][nc] = true\n                    stack.add(intArrayOf(nr, nc))\n                }\n            }\n            if (contained) count++\n        }\n    }\n    return count\n}`,
              swift: `func countSubIslands(_ grid1: [[Int]], _ grid2: [[Int]]) -> Int {\n    let rows = grid2.count\n    let cols = grid2[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var count = 0\n    for r in 0..<rows {\n        for c in 0..<cols {\n            if grid2[r][c] != 1 || seen[r][c] { continue }\n            seen[r][c] = true\n            var stack: [[Int]] = [[r, c]]\n            var contained = true\n            while let cell = stack.popLast() {\n                if grid1[cell[0]][cell[1]] != 1 { contained = false }\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr < 0 || nc < 0 || nr >= rows || nc >= cols { continue }\n                    if grid2[nr][nc] != 1 || seen[nr][nc] { continue }\n                    seen[nr][nc] = true\n                    stack.append([nr, nc])\n                }\n            }\n            if contained { count += 1 }\n        }\n    }\n    return count\n}`,
              rust: `fn countSubIslands(grid1: Vec<Vec<i32>>, grid2: Vec<Vec<i32>>) -> i32 {\n    let rows = grid2.len();\n    let cols = grid2[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    let mut count = 0;\n    for r in 0..rows {\n        for c in 0..cols {\n            if grid2[r][c] != 1 || seen[r][c] {\n                continue;\n            }\n            seen[r][c] = true;\n            let mut stack: Vec<(usize, usize)> = vec![(r, c)];\n            let mut contained = true;\n            while let Some((cr, cc)) = stack.pop() {\n                if grid1[cr][cc] != 1 {\n                    contained = false;\n                }\n                for d in 0..4 {\n                    let nr = cr as i32 + dr[d];\n                    let nc = cc as i32 + dc[d];\n                    if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                        continue;\n                    }\n                    let (nru, ncu) = (nr as usize, nc as usize);\n                    if grid2[nru][ncu] != 1 || seen[nru][ncu] {\n                        continue;\n                    }\n                    seen[nru][ncu] = true;\n                    stack.push((nru, ncu));\n                }\n            }\n            if contained {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
              php: `function countSubIslands($grid1, $grid2) {\n    $rows = count($grid2);\n    $cols = count($grid2[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    $count = 0;\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if ($grid2[$r][$c] !== 1 || $seen[$r][$c]) continue;\n            $seen[$r][$c] = true;\n            $stack = array(array($r, $c));\n            $contained = true;\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                if ($grid1[$cell[0]][$cell[1]] !== 1) $contained = false;\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols) continue;\n                    if ($grid2[$nr][$nc] !== 1 || $seen[$nr][$nc]) continue;\n                    $seen[$nr][$nc] = true;\n                    $stack[] = array($nr, $nc);\n                }\n            }\n            if ($contained) $count++;\n        }\n    }\n    return $count;\n}`,
              ruby: `def countSubIslands(grid1, grid2)\n  rows = grid2.length\n  cols = grid2[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  count = 0\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      next if grid2[r][c] != 1 || seen[r][c]\n      seen[r][c] = true\n      stack = [[r, c]]\n      contained = true\n      while !stack.empty?\n        cell = stack.pop\n        contained = false if grid1[cell[0]][cell[1]] != 1\n        (0...4).each do |d|\n          nr = cell[0] + dr[d]\n          nc = cell[1] + dc[d]\n          next if nr < 0 || nc < 0 || nr >= rows || nc >= cols\n          next if grid2[nr][nc] != 1 || seen[nr][nc]\n          seen[nr][nc] = true\n          stack.push([nr, nc])\n        end\n      end\n      count += 1 if contained\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Number of Operations to Make Network Connected ──────────────
  (() => {
    const ref = (n: number, connections: number[][]) => {
      if (connections.length < n - 1) return -1;
      const parent: number[] = [];
      for (let i = 0; i < n; i++) parent.push(i);
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        return r;
      };
      let components = n;
      for (let i = 0; i < connections.length; i++) {
        const a = find(connections[i][0]);
        const b = find(connections[i][1]);
        if (a !== b) {
          parent[a] = b;
          components--;
        }
      }
      return components - 1;
    };
    return {
      slug: "number-of-operations-to-make-network-connected",
      title: "Number of Operations to Make Network Connected",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "makeConnected", params: [{ name: "n", type: "int" as const }, { name: "connections", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` computers numbered `0` through `n - 1` joined by ethernet cables; `connections[i] = [a, b]` connects computers `a` and `b`.\n\nYou may unplug any cable and use it to connect a different pair. Return the minimum number of such moves that makes every computer reachable from every other, or `-1` if it is impossible.",
        [
          { in: "n = 4, connections = [[0,1],[0,2],[1,2]]", out: "1" },
          { in: "n = 6, connections = [[0,1],[0,2],[0,3],[1,2],[1,3]]", out: "2" },
          { in: "n = 6, connections = [[0,1],[0,2],[0,3],[1,2]]", out: "-1", note: "Only four cables for six computers." },
        ],
        ["1 <= n <= 40", "0 <= connections.length <= 60", "There are no duplicate connections and no self-loops."]),
      hints: [
        "Connecting `n` computers needs at least `n - 1` cables — fewer than that is impossible.",
        "With enough cables, every redundant one inside a component can be moved somewhere useful.",
        "Count the connected components with union-find; the answer is `components - 1`.",
      ],
      examples: [
        { input: "4\n[[0,1],[0,2],[1,2]]", expectedOutput: "1" },
        { input: "6\n[[0,1],[0,2],[0,3],[1,2],[1,3]]", expectedOutput: "2" },
        { input: "6\n[[0,1],[0,2],[0,3],[1,2]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const connections = randEdges(rng, n, ri(rng, 0, Math.min(60, n * 2)));
        return { input: `${n}\n${fmtIntMat(connections)}`, expectedOutput: String(ref(n, connections)) };
      },
      solutions: {
        python: `def makeConnected(n: int, connections) -> int:\n    if len(connections) < n - 1:\n        return -1\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    components = n\n    for a, b in connections:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n            components -= 1\n    return components - 1`,
        javascript: `var makeConnected = function(n, connections) {\n    if (connections.length < n - 1) return -1;\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    const find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    let components = n;\n    for (let i = 0; i < connections.length; i++) {\n        const a = find(connections[i][0]);\n        const b = find(connections[i][1]);\n        if (a !== b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components - 1;\n};`,
              typescript: `function makeConnected(n: number, connections: number[][]): number {\n    if (connections.length < n - 1) return -1;\n    var parent: number[] = [];\n    for (var i = 0; i < n; i++) parent.push(i);\n    var find = function (x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var components = n;\n    for (var j = 0; j < connections.length; j++) {\n        var a = find(connections[j][0]);\n        var b = find(connections[j][1]);\n        if (a !== b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components - 1;\n}`,
              java: `private static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int makeConnected(int n, int[][] connections) {\n    if (connections.length < n - 1) return -1;\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (int[] e : connections) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components - 1;\n}`,
              cpp: `static int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint makeConnected(int n, vector<vector<int>>& connections) {\n    if ((int) connections.size() < n - 1) return -1;\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (const auto& e : connections) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components - 1;\n}`,
              c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint makeConnected(int n, int** connections, int connectionsSize, int* connectionsColSize) {\n    if (connectionsSize < n - 1) return -1;\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    for (int i = 0; i < connectionsSize; i++) {\n        int a = findRootC(parent, connections[i][0]);\n        int b = findRootC(parent, connections[i][1]);\n        if (a != b) {\n            parent[a] = b;\n            components--;\n        }\n    }\n    free(parent);\n    return components - 1;\n}`,
              csharp: `private static int FindRoot(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int MakeConnected(int n, int[][] connections)\n{\n    if (connections.Length < n - 1) return -1;\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int components = n;\n    foreach (int[] e in connections)\n    {\n        int a = FindRoot(parent, e[0]);\n        int b = FindRoot(parent, e[1]);\n        if (a != b)\n        {\n            parent[a] = b;\n            components--;\n        }\n    }\n    return components - 1;\n}`,
              go: `func findRoot(parent []int, x int) int {\n	for parent[x] != x {\n		parent[x] = parent[parent[x]]\n		x = parent[x]\n	}\n	return x\n}\n\nfunc makeConnected(n int, connections [][]int) int {\n	if len(connections) < n-1 {\n		return -1\n	}\n	parent := make([]int, n)\n	for i := range parent {\n		parent[i] = i\n	}\n	components := n\n	for _, e := range connections {\n		a := findRoot(parent, e[0])\n		b := findRoot(parent, e[1])\n		if a != b {\n			parent[a] = b\n			components--\n		}\n	}\n	return components - 1\n}`,
              kotlin: `fun findRoot(parent: IntArray, start: Int): Int {\n    var x = start\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfun makeConnected(n: Int, connections: Array<IntArray>): Int {\n    if (connections.size < n - 1) return -1\n    val parent = IntArray(n) { it }\n    var components = n\n    for (e in connections) {\n        val a = findRoot(parent, e[0])\n        val b = findRoot(parent, e[1])\n        if (a != b) {\n            parent[a] = b\n            components--\n        }\n    }\n    return components - 1\n}`,
              swift: `func findRoot(_ parent: inout [Int], _ start: Int) -> Int {\n    var x = start\n    while parent[x] != x {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfunc makeConnected(_ n: Int, _ connections: [[Int]]) -> Int {\n    if connections.count < n - 1 { return -1 }\n    var parent = Array(0..<n)\n    var components = n\n    for e in connections {\n        let a = findRoot(&parent, e[0])\n        let b = findRoot(&parent, e[1])\n        if a != b {\n            parent[a] = b\n            components -= 1\n        }\n    }\n    return components - 1\n}`,
              rust: `fn find_root(parent: &mut Vec<usize>, start: usize) -> usize {\n    let mut x = start;\n    while parent[x] != x {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    x\n}\n\nfn makeConnected(n: i32, connections: Vec<Vec<i32>>) -> i32 {\n    if (connections.len() as i32) < n - 1 {\n        return -1;\n    }\n    let size = n as usize;\n    let mut parent: Vec<usize> = (0..size).collect();\n    let mut components = n;\n    for e in connections.iter() {\n        let a = find_root(&mut parent, e[0] as usize);\n        let b = find_root(&mut parent, e[1] as usize);\n        if a != b {\n            parent[a] = b;\n            components -= 1;\n        }\n    }\n    components - 1\n}`,
              php: `function findRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}\n\nfunction makeConnected($n, $connections) {\n    if (count($connections) < $n - 1) return -1;\n    $parent = range(0, max($n - 1, 0));\n    $components = $n;\n    foreach ($connections as $e) {\n        $a = findRoot($parent, $e[0]);\n        $b = findRoot($parent, $e[1]);\n        if ($a !== $b) {\n            $parent[$a] = $b;\n            $components--;\n        }\n    }\n    return $components - 1;\n}`,
              ruby: `def find_root(parent, x)\n  while parent[x] != x\n    parent[x] = parent[parent[x]]\n    x = parent[x]\n  end\n  x\nend\n\ndef makeConnected(n, connections)\n  return -1 if connections.length < n - 1\n  parent = (0...n).to_a\n  components = n\n  connections.each do |e|\n    a = find_root(parent, e[0])\n    b = find_root(parent, e[1])\n    if a != b\n      parent[a] = b\n      components -= 1\n    end\n  end\n  components - 1\nend`,
      },
    };
  })(),

  // ── The Earliest Moment When Everyone Become Friends ────────────
  (() => {
    const ref = (logs: number[][], n: number) => {
      const sorted = logs.slice().sort((a, b) => a[0] - b[0]);
      const parent: number[] = [];
      for (let i = 0; i < n; i++) parent.push(i);
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        return r;
      };
      let groups = n;
      for (let i = 0; i < sorted.length; i++) {
        const a = find(sorted[i][1]);
        const b = find(sorted[i][2]);
        if (a !== b) {
          parent[a] = b;
          groups--;
          if (groups === 1) return sorted[i][0];
        }
      }
      return groups === 1 ? 0 : -1;
    };
    return {
      slug: "the-earliest-moment-when-everyone-become-friends",
      title: "The Earliest Moment When Everyone Become Friends",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Union Find", "Sorting", "Amazon", "Google", "Meta"],
      signature: { funcName: "earliestAcq", params: [{ name: "logs", type: "int[][]" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In a group of `n` people numbered `0` through `n - 1`, `logs[i] = [timestamp, x, y]` records that `x` and `y` became friends at that time. Friendship is mutual and transitive: friends of friends are acquainted.\n\nReturn the earliest timestamp at which **everyone** is acquainted with everyone else, or `-1` if that never happens.",
        [
          { in: "logs = [[20190101,0,1],[20190104,3,4],[20190107,2,3],[20190211,1,5],[20190224,2,4],[20190301,0,3],[20190312,1,2],[20190322,4,5]], n = 6", out: "20190301" },
          { in: "logs = [[0,2,0],[1,0,1],[3,0,3],[4,1,2],[7,3,1]], n = 4", out: "3" },
          { in: "logs = [[0,0,1]], n = 3", out: "-1" },
        ],
        ["1 <= n <= 40", "1 <= logs.length <= 60", "All timestamps are distinct."],
        "Sorting dominates the running time. Can you keep the union-find part almost linear?"),
      hints: [
        "Process the friendships in chronological order, so sort the logs by timestamp first.",
        "Union-find tracks how many separate groups remain, starting at `n`.",
        "The moment the group count drops to 1 is the answer; if it never does, return `-1`.",
      ],
      examples: [
        { input: "[[20190101,0,1],[20190104,3,4],[20190107,2,3],[20190211,1,5],[20190224,2,4],[20190301,0,3],[20190312,1,2],[20190322,4,5]]\n6", expectedOutput: "20190301" },
        { input: "[[0,2,0],[1,0,1],[3,0,3],[4,1,2],[7,3,1]]\n4", expectedOutput: "3" },
        { input: "[[0,0,1]]\n3", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const count = ri(rng, 1, 60);
        const stamps = new Set<number>();
        while (stamps.size < count) stamps.add(ri(rng, 0, 1000000));
        const times = shuffle(rng, Array.from(stamps));
        const logs = times.map((t) => {
          let x = ri(rng, 0, n - 1);
          let y = ri(rng, 0, n - 1);
          if (n > 1) {
            while (y === x) y = ri(rng, 0, n - 1);
          }
          return [t, x, y];
        });
        return { input: `${fmtIntMat(logs)}\n${n}`, expectedOutput: String(ref(logs, n)) };
      },
      solutions: {
        python: `def earliestAcq(logs, n: int) -> int:\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    groups = n\n    for timestamp, x, y in sorted(logs):\n        rx, ry = find(x), find(y)\n        if rx != ry:\n            parent[rx] = ry\n            groups -= 1\n            if groups == 1:\n                return timestamp\n    return 0 if groups == 1 else -1`,
        javascript: `var earliestAcq = function(logs, n) {\n    const sorted = logs.slice().sort(function(a, b) { return a[0] - b[0]; });\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    const find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    let groups = n;\n    for (let i = 0; i < sorted.length; i++) {\n        const a = find(sorted[i][1]);\n        const b = find(sorted[i][2]);\n        if (a !== b) {\n            parent[a] = b;\n            groups--;\n            if (groups === 1) return sorted[i][0];\n        }\n    }\n    return groups === 1 ? 0 : -1;\n};`,
              typescript: `function earliestAcq(logs: number[][], n: number): number {\n    var sorted = logs.slice().sort(function (a, b) { return a[0] - b[0]; });\n    var parent: number[] = [];\n    for (var i = 0; i < n; i++) parent.push(i);\n    var find = function (x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var groups = n;\n    for (var j = 0; j < sorted.length; j++) {\n        var a = find(sorted[j][1]);\n        var b = find(sorted[j][2]);\n        if (a !== b) {\n            parent[a] = b;\n            groups--;\n            if (groups === 1) return sorted[j][0];\n        }\n    }\n    return groups === 1 ? 0 : -1;\n}`,
              java: `private static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int earliestAcq(int[][] logs, int n) {\n    int[][] sorted = logs.clone();\n    Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int groups = n;\n    for (int[] entry : sorted) {\n        int a = findRoot(parent, entry[1]);\n        int b = findRoot(parent, entry[2]);\n        if (a != b) {\n            parent[a] = b;\n            groups--;\n            if (groups == 1) return entry[0];\n        }\n    }\n    return groups == 1 ? 0 : -1;\n}`,
              cpp: `static int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint earliestAcq(vector<vector<int>>& logs, int n) {\n    vector<vector<int>> sorted = logs;\n    sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int groups = n;\n    for (const auto& entry : sorted) {\n        int a = findRoot(parent, entry[1]);\n        int b = findRoot(parent, entry[2]);\n        if (a != b) {\n            parent[a] = b;\n            groups--;\n            if (groups == 1) return entry[0];\n        }\n    }\n    return groups == 1 ? 0 : -1;\n}`,
              c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nstatic int cmpLogTime(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[0] > y[0]) - (x[0] < y[0]);\n}\n\nint earliestAcq(int** logs, int logsSize, int* logsColSize, int n) {\n    int** sorted = (int**) malloc((size_t) (logsSize > 0 ? logsSize : 1) * sizeof(int*));\n    for (int i = 0; i < logsSize; i++) sorted[i] = logs[i];\n    qsort(sorted, logsSize, sizeof(int*), cmpLogTime);\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int groups = n;\n    int answer = -1;\n    for (int i = 0; i < logsSize; i++) {\n        int a = findRootC(parent, sorted[i][1]);\n        int b = findRootC(parent, sorted[i][2]);\n        if (a != b) {\n            parent[a] = b;\n            groups--;\n            if (groups == 1) {\n                answer = sorted[i][0];\n                break;\n            }\n        }\n    }\n    if (answer == -1 && groups == 1) answer = 0;\n    free(sorted);\n    free(parent);\n    return answer;\n}`,
              csharp: `private static int FindRoot(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int EarliestAcq(int[][] logs, int n)\n{\n    var sorted = new List<int[]>(logs);\n    sorted.Sort((a, b) => a[0].CompareTo(b[0]));\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int groups = n;\n    foreach (int[] entry in sorted)\n    {\n        int a = FindRoot(parent, entry[1]);\n        int b = FindRoot(parent, entry[2]);\n        if (a != b)\n        {\n            parent[a] = b;\n            groups--;\n            if (groups == 1) return entry[0];\n        }\n    }\n    return groups == 1 ? 0 : -1;\n}`,
              go: `func findRoot(parent []int, x int) int {\n	for parent[x] != x {\n		parent[x] = parent[parent[x]]\n		x = parent[x]\n	}\n	return x\n}\n\nfunc earliestAcq(logs [][]int, n int) int {\n	sorted := append([][]int{}, logs...)\n	sort.Slice(sorted, func(a, b int) bool { return sorted[a][0] < sorted[b][0] })\n	parent := make([]int, n)\n	for i := range parent {\n		parent[i] = i\n	}\n	groups := n\n	for _, entry := range sorted {\n		a := findRoot(parent, entry[1])\n		b := findRoot(parent, entry[2])\n		if a != b {\n			parent[a] = b\n			groups--\n			if groups == 1 {\n				return entry[0]\n			}\n		}\n	}\n	if groups == 1 {\n		return 0\n	}\n	return -1\n}`,
              kotlin: `fun findRoot(parent: IntArray, start: Int): Int {\n    var x = start\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfun earliestAcq(logs: Array<IntArray>, n: Int): Int {\n    val sorted = logs.sortedBy { it[0] }\n    val parent = IntArray(n) { it }\n    var groups = n\n    for (entry in sorted) {\n        val a = findRoot(parent, entry[1])\n        val b = findRoot(parent, entry[2])\n        if (a != b) {\n            parent[a] = b\n            groups--\n            if (groups == 1) return entry[0]\n        }\n    }\n    return if (groups == 1) 0 else -1\n}`,
              swift: `func findRoot(_ parent: inout [Int], _ start: Int) -> Int {\n    var x = start\n    while parent[x] != x {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfunc earliestAcq(_ logs: [[Int]], _ n: Int) -> Int {\n    let sorted = logs.sorted { $0[0] < $1[0] }\n    var parent = Array(0..<n)\n    var groups = n\n    for entry in sorted {\n        let a = findRoot(&parent, entry[1])\n        let b = findRoot(&parent, entry[2])\n        if a != b {\n            parent[a] = b\n            groups -= 1\n            if groups == 1 { return entry[0] }\n        }\n    }\n    return groups == 1 ? 0 : -1\n}`,
              rust: `fn find_root(parent: &mut Vec<usize>, start: usize) -> usize {\n    let mut x = start;\n    while parent[x] != x {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    x\n}\n\nfn earliestAcq(logs: Vec<Vec<i32>>, n: i32) -> i32 {\n    let mut sorted = logs.clone();\n    sorted.sort_by(|a, b| a[0].cmp(&b[0]));\n    let size = n as usize;\n    let mut parent: Vec<usize> = (0..size).collect();\n    let mut groups = n;\n    for entry in sorted.iter() {\n        let a = find_root(&mut parent, entry[1] as usize);\n        let b = find_root(&mut parent, entry[2] as usize);\n        if a != b {\n            parent[a] = b;\n            groups -= 1;\n            if groups == 1 {\n                return entry[0];\n            }\n        }\n    }\n    if groups == 1 { 0 } else { -1 }\n}`,
              php: `function findRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}\n\nfunction earliestAcq($logs, $n) {\n    $sorted = $logs;\n    usort($sorted, function($a, $b) { return $a[0] - $b[0]; });\n    $parent = range(0, max($n - 1, 0));\n    $groups = $n;\n    foreach ($sorted as $entry) {\n        $a = findRoot($parent, $entry[1]);\n        $b = findRoot($parent, $entry[2]);\n        if ($a !== $b) {\n            $parent[$a] = $b;\n            $groups--;\n            if ($groups === 1) return $entry[0];\n        }\n    }\n    return $groups === 1 ? 0 : -1;\n}`,
              ruby: `def find_root(parent, x)\n  while parent[x] != x\n    parent[x] = parent[parent[x]]\n    x = parent[x]\n  end\n  x\nend\n\ndef earliestAcq(logs, n)\n  sorted = logs.sort_by { |entry| entry[0] }\n  parent = (0...n).to_a\n  groups = n\n  sorted.each do |entry|\n    a = find_root(parent, entry[1])\n    b = find_root(parent, entry[2])\n    if a != b\n      parent[a] = b\n      groups -= 1\n      return entry[0] if groups == 1\n    end\n  end\n  groups == 1 ? 0 : -1\nend`,
      },
    };
  })(),


  // ── Shortest Bridge ─────────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      const dist = grid.map((row) => row.map(() => -1));
      const queue: number[][] = [];
      // Flood the first island, seeding the BFS frontier with all its cells.
      let started = false;
      for (let r = 0; r < n && !started; r++) {
        for (let c = 0; c < n && !started; c++) {
          if (grid[r][c] !== 1) continue;
          started = true;
          dist[r][c] = 0;
          const stack: number[][] = [[r, c]];
          queue.push([r, c]);
          while (stack.length > 0) {
            const cell = stack.pop() as number[];
            for (let d = 0; d < 4; d++) {
              const nr = cell[0] + dr[d];
              const nc = cell[1] + dc[d];
              if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
              if (grid[nr][nc] !== 1 || dist[nr][nc] !== -1) continue;
              dist[nr][nc] = 0;
              stack.push([nr, nc]);
              queue.push([nr, nc]);
            }
          }
        }
      }
      let head = 0;
      while (head < queue.length) {
        const cell = queue[head++];
        for (let d = 0; d < 4; d++) {
          const nr = cell[0] + dr[d];
          const nc = cell[1] + dc[d];
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
          if (dist[nr][nc] !== -1) continue;
          if (grid[nr][nc] === 1) return dist[cell[0]][cell[1]];
          dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
          queue.push([nr, nc]);
        }
      }
      return -1;
    };
    return {
      slug: "shortest-bridge",
      title: "Shortest Bridge",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Matrix", "Amazon", "Google", "Meta"],
      signature: { funcName: "shortestBridge", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n x n` binary matrix `grid` containing **exactly two** islands, where an island is a maximal group of `1`s connected up, down, left or right.\n\nReturn the smallest number of `0`s you must flip to `1` to join the two islands.",
        [
          { in: "grid = [[0,1],[1,0]]", out: "1" },
          { in: "grid = [[0,1,0],[0,0,0],[0,0,1]]", out: "2" },
          { in: "grid = [[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]", out: "1" },
        ],
        ["2 <= grid.length <= 12", "grid[i].length == grid.length", "grid contains exactly two islands."]),
      hints: [
        "First find one island with a DFS or BFS and mark all of its cells at distance 0.",
        "Then run a multi-source BFS outward from every cell of that island at once.",
        "The first time the frontier touches a `1` that is not part of the first island, you have the answer.",
      ],
      examples: [
        { input: "[[0,1],[1,0]]", expectedOutput: "1" },
        { input: "[[0,1,0],[0,0,0],[0,0,1]]", expectedOutput: "2" },
        { input: "[[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        // Grow two disjoint blobs so the grid always holds exactly two islands.
        const n = ri(rng, 3, 12);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
        const dr = [1, -1, 0, 0];
        const dc = [0, 0, 1, -1];
        const touchesIsland = (r: number, c: number, tag: number) => {
          for (let d = 0; d < 4; d++) {
            const nr = r + dr[d];
            const nc = c + dc[d];
            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
            if (grid[nr][nc] !== 0 && grid[nr][nc] !== tag) return true;
          }
          return false;
        };
        const growIsland = (tag: number) => {
          for (let attempt = 0; attempt < 200; attempt++) {
            const r = ri(rng, 0, n - 1);
            const c = ri(rng, 0, n - 1);
            if (grid[r][c] !== 0 || touchesIsland(r, c, tag)) continue;
            grid[r][c] = tag;
            const cells = [[r, c]];
            const size = ri(rng, 1, 5);
            while (cells.length < size) {
              const base = cells[ri(rng, 0, cells.length - 1)];
              const d = ri(rng, 0, 3);
              const nr = base[0] + dr[d];
              const nc = base[1] + dc[d];
              if (nr < 0 || nc < 0 || nr >= n || nc >= n) break;
              if (grid[nr][nc] !== 0 || touchesIsland(nr, nc, tag)) break;
              grid[nr][nc] = tag;
              cells.push([nr, nc]);
            }
            return true;
          }
          return false;
        };
        if (!growIsland(1) || !growIsland(2)) {
          // Fall back to a guaranteed two-island layout in opposite corners.
          for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) grid[r][c] = 0;
          }
          grid[0][0] = 1;
          grid[n - 1][n - 1] = 2;
        }
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (grid[r][c] === 2) grid[r][c] = 1;
          }
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef shortestBridge(grid) -> int:\n    n = len(grid)\n    dist = [[-1] * n for _ in range(n)]\n    queue = deque()\n    start = None\n    for r in range(n):\n        for c in range(n):\n            if grid[r][c] == 1:\n                start = (r, c)\n                break\n        if start:\n            break\n    stack = [start]\n    dist[start[0]][start[1]] = 0\n    queue.append(start)\n    while stack:\n        r, c = stack.pop()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 1 and dist[nr][nc] == -1:\n                dist[nr][nc] = 0\n                stack.append((nr, nc))\n                queue.append((nr, nc))\n    while queue:\n        r, c = queue.popleft()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < n and 0 <= nc < n and dist[nr][nc] == -1:\n                if grid[nr][nc] == 1:\n                    return dist[r][c]\n                dist[nr][nc] = dist[r][c] + 1\n                queue.append((nr, nc))\n    return -1`,
        javascript: `var shortestBridge = function(grid) {\n    const n = grid.length;\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    const dist = [];\n    for (let r = 0; r < n; r++) {\n        const row = [];\n        for (let c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    const queue = [];\n    let started = false;\n    for (let r = 0; r < n && !started; r++) {\n        for (let c = 0; c < n && !started; c++) {\n            if (grid[r][c] !== 1) continue;\n            started = true;\n            dist[r][c] = 0;\n            const stack = [[r, c]];\n            queue.push([r, c]);\n            while (stack.length > 0) {\n                const cell = stack.pop();\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] !== 1 || dist[nr][nc] !== -1) continue;\n                    dist[nr][nc] = 0;\n                    stack.push([nr, nc]);\n                    queue.push([nr, nc]);\n                }\n            }\n        }\n    }\n    let head = 0;\n    while (head < queue.length) {\n        const cell = queue[head++];\n        for (let d = 0; d < 4; d++) {\n            const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] !== -1) continue;\n            if (grid[nr][nc] === 1) return dist[cell[0]][cell[1]];\n            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;\n            queue.push([nr, nc]);\n        }\n    }\n    return -1;\n};`,
              typescript: `function shortestBridge(grid: number[][]): number {\n    var n = grid.length;\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var dist: number[][] = [];\n    for (var r = 0; r < n; r++) {\n        var row: number[] = [];\n        for (var c = 0; c < n; c++) row.push(-1);\n        dist.push(row);\n    }\n    var queue: number[][] = [];\n    var started = false;\n    for (var r2 = 0; r2 < n && !started; r2++) {\n        for (var c2 = 0; c2 < n && !started; c2++) {\n            if (grid[r2][c2] !== 1) continue;\n            started = true;\n            dist[r2][c2] = 0;\n            var stack: number[][] = [[r2, c2]];\n            queue.push([r2, c2]);\n            while (stack.length > 0) {\n                var cell = stack.pop() as number[];\n                for (var d = 0; d < 4; d++) {\n                    var nr = cell[0] + dr[d];\n                    var nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] !== 1 || dist[nr][nc] !== -1) continue;\n                    dist[nr][nc] = 0;\n                    stack.push([nr, nc]);\n                    queue.push([nr, nc]);\n                }\n            }\n        }\n    }\n    var head = 0;\n    while (head < queue.length) {\n        var cur = queue[head++];\n        for (var d2 = 0; d2 < 4; d2++) {\n            var mr = cur[0] + dr[d2];\n            var mc = cur[1] + dc[d2];\n            if (mr < 0 || mc < 0 || mr >= n || mc >= n) continue;\n            if (dist[mr][mc] !== -1) continue;\n            if (grid[mr][mc] === 1) return dist[cur[0]][cur[1]];\n            dist[mr][mc] = dist[cur[0]][cur[1]] + 1;\n            queue.push([mr, mc]);\n        }\n    }\n    return -1;\n}`,
              java: `public static int shortestBridge(int[][] grid) {\n    int n = grid.length;\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    int[][] dist = new int[n][n];\n    for (int[] row : dist) Arrays.fill(row, -1);\n    List<int[]> queue = new ArrayList<>();\n    boolean started = false;\n    for (int r = 0; r < n && !started; r++) {\n        for (int c = 0; c < n && !started; c++) {\n            if (grid[r][c] != 1) continue;\n            started = true;\n            dist[r][c] = 0;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{r, c});\n            queue.add(new int[]{r, c});\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || dist[nr][nc] != -1) continue;\n                    dist[nr][nc] = 0;\n                    stack.push(new int[]{nr, nc});\n                    queue.add(new int[]{nr, nc});\n                }\n            }\n        }\n    }\n    int head = 0;\n    while (head < queue.size()) {\n        int[] cur = queue.get(head++);\n        for (int d = 0; d < 4; d++) {\n            int nr = cur[0] + dr[d], nc = cur[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] != -1) continue;\n            if (grid[nr][nc] == 1) return dist[cur[0]][cur[1]];\n            dist[nr][nc] = dist[cur[0]][cur[1]] + 1;\n            queue.add(new int[]{nr, nc});\n        }\n    }\n    return -1;\n}`,
              cpp: `int shortestBridge(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    vector<vector<int>> dist(n, vector<int>(n, -1));\n    vector<pair<int,int>> queue;\n    bool started = false;\n    for (int r = 0; r < n && !started; r++) {\n        for (int c = 0; c < n && !started; c++) {\n            if (grid[r][c] != 1) continue;\n            started = true;\n            dist[r][c] = 0;\n            vector<pair<int,int>> stack;\n            stack.push_back(make_pair(r, c));\n            queue.push_back(make_pair(r, c));\n            while (!stack.empty()) {\n                pair<int,int> cell = stack.back();\n                stack.pop_back();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || dist[nr][nc] != -1) continue;\n                    dist[nr][nc] = 0;\n                    stack.push_back(make_pair(nr, nc));\n                    queue.push_back(make_pair(nr, nc));\n                }\n            }\n        }\n    }\n    size_t head = 0;\n    while (head < queue.size()) {\n        pair<int,int> cur = queue[head++];\n        for (int d = 0; d < 4; d++) {\n            int nr = cur.first + dr[d], nc = cur.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr][nc] != -1) continue;\n            if (grid[nr][nc] == 1) return dist[cur.first][cur.second];\n            dist[nr][nc] = dist[cur.first][cur.second] + 1;\n            queue.push_back(make_pair(nr, nc));\n        }\n    }\n    return -1;\n}`,
              c: `int shortestBridge(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    int* dist = (int*) malloc((size_t) (n * n) * sizeof(int));\n    for (int i = 0; i < n * n; i++) dist[i] = -1;\n    int* queue = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int* stack = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int head = 0, tail = 0;\n    int started = 0;\n    for (int r = 0; r < n && !started; r++) {\n        for (int c = 0; c < n && !started; c++) {\n            if (grid[r][c] != 1) continue;\n            started = 1;\n            dist[r * n + c] = 0;\n            int top = 0;\n            stack[top++] = r * n + c;\n            queue[tail++] = r * n + c;\n            while (top > 0) {\n                int cell = stack[--top];\n                int cr = cell / n, cc = cell % n;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cr + dr[d], nc = cc + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || dist[nr * n + nc] != -1) continue;\n                    dist[nr * n + nc] = 0;\n                    stack[top++] = nr * n + nc;\n                    queue[tail++] = nr * n + nc;\n                }\n            }\n        }\n    }\n    int answer = -1;\n    while (head < tail && answer == -1) {\n        int cur = queue[head++];\n        int cr = cur / n, cc = cur % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr * n + nc] != -1) continue;\n            if (grid[nr][nc] == 1) {\n                answer = dist[cur];\n                break;\n            }\n            dist[nr * n + nc] = dist[cur] + 1;\n            queue[tail++] = nr * n + nc;\n        }\n    }\n    free(dist);\n    free(queue);\n    free(stack);\n    return answer;\n}`,
              csharp: `public static int ShortestBridge(int[][] grid)\n{\n    int n = grid.Length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[,] dist = new int[n, n];\n    for (int r = 0; r < n; r++)\n    {\n        for (int c = 0; c < n; c++) dist[r, c] = -1;\n    }\n    var queue = new List<int[]>();\n    bool started = false;\n    for (int r = 0; r < n && !started; r++)\n    {\n        for (int c = 0; c < n && !started; c++)\n        {\n            if (grid[r][c] != 1) continue;\n            started = true;\n            dist[r, c] = 0;\n            var stack = new List<int[]>();\n            stack.Add(new int[] { r, c });\n            queue.Add(new int[] { r, c });\n            while (stack.Count > 0)\n            {\n                int[] cell = stack[stack.Count - 1];\n                stack.RemoveAt(stack.Count - 1);\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || dist[nr, nc] != -1) continue;\n                    dist[nr, nc] = 0;\n                    stack.Add(new int[] { nr, nc });\n                    queue.Add(new int[] { nr, nc });\n                }\n            }\n        }\n    }\n    int head = 0;\n    while (head < queue.Count)\n    {\n        int[] cur = queue[head++];\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cur[0] + dr[d], nc = cur[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;\n            if (dist[nr, nc] != -1) continue;\n            if (grid[nr][nc] == 1) return dist[cur[0], cur[1]];\n            dist[nr, nc] = dist[cur[0], cur[1]] + 1;\n            queue.Add(new int[] { nr, nc });\n        }\n    }\n    return -1;\n}`,
              go: `func shortestBridge(grid [][]int) int {\n	n := len(grid)\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	dist := make([][]int, n)\n	for i := range dist {\n		dist[i] = make([]int, n)\n		for j := range dist[i] {\n			dist[i][j] = -1\n		}\n	}\n	queue := [][2]int{}\n	started := false\n	for r := 0; r < n && !started; r++ {\n		for c := 0; c < n && !started; c++ {\n			if grid[r][c] != 1 {\n				continue\n			}\n			started = true\n			dist[r][c] = 0\n			stack := [][2]int{{r, c}}\n			queue = append(queue, [2]int{r, c})\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				for d := 0; d < 4; d++ {\n					nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n					if nr < 0 || nc < 0 || nr >= n || nc >= n {\n						continue\n					}\n					if grid[nr][nc] != 1 || dist[nr][nc] != -1 {\n						continue\n					}\n					dist[nr][nc] = 0\n					stack = append(stack, [2]int{nr, nc})\n					queue = append(queue, [2]int{nr, nc})\n				}\n			}\n		}\n	}\n	head := 0\n	for head < len(queue) {\n		cur := queue[head]\n		head++\n		for d := 0; d < 4; d++ {\n			nr, nc := cur[0]+dr[d], cur[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= n || nc >= n {\n				continue\n			}\n			if dist[nr][nc] != -1 {\n				continue\n			}\n			if grid[nr][nc] == 1 {\n				return dist[cur[0]][cur[1]]\n			}\n			dist[nr][nc] = dist[cur[0]][cur[1]] + 1\n			queue = append(queue, [2]int{nr, nc})\n		}\n	}\n	return -1\n}`,
              kotlin: `fun shortestBridge(grid: Array<IntArray>): Int {\n    val n = grid.size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val dist = Array(n) { IntArray(n) { -1 } }\n    val queue = ArrayList<IntArray>()\n    var started = false\n    for (r in 0 until n) {\n        if (started) break\n        for (c in 0 until n) {\n            if (started) break\n            if (grid[r][c] != 1) continue\n            started = true\n            dist[r][c] = 0\n            val stack = ArrayList<IntArray>()\n            stack.add(intArrayOf(r, c))\n            queue.add(intArrayOf(r, c))\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue\n                    if (grid[nr][nc] != 1 || dist[nr][nc] != -1) continue\n                    dist[nr][nc] = 0\n                    stack.add(intArrayOf(nr, nc))\n                    queue.add(intArrayOf(nr, nc))\n                }\n            }\n        }\n    }\n    var head = 0\n    while (head < queue.size) {\n        val cur = queue[head++]\n        for (d in 0 until 4) {\n            val nr = cur[0] + dr[d]\n            val nc = cur[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue\n            if (dist[nr][nc] != -1) continue\n            if (grid[nr][nc] == 1) return dist[cur[0]][cur[1]]\n            dist[nr][nc] = dist[cur[0]][cur[1]] + 1\n            queue.add(intArrayOf(nr, nc))\n        }\n    }\n    return -1\n}`,
              swift: `func shortestBridge(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var dist = [[Int]](repeating: [Int](repeating: -1, count: n), count: n)\n    var queue: [[Int]] = []\n    var started = false\n    for r in 0..<n {\n        if started { break }\n        for c in 0..<n {\n            if started { break }\n            if grid[r][c] != 1 { continue }\n            started = true\n            dist[r][c] = 0\n            var stack: [[Int]] = [[r, c]]\n            queue.append([r, c])\n            while let cell = stack.popLast() {\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr < 0 || nc < 0 || nr >= n || nc >= n { continue }\n                    if grid[nr][nc] != 1 || dist[nr][nc] != -1 { continue }\n                    dist[nr][nc] = 0\n                    stack.append([nr, nc])\n                    queue.append([nr, nc])\n                }\n            }\n        }\n    }\n    var head = 0\n    while head < queue.count {\n        let cur = queue[head]\n        head += 1\n        for d in 0..<4 {\n            let nr = cur[0] + dr[d]\n            let nc = cur[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= n || nc >= n { continue }\n            if dist[nr][nc] != -1 { continue }\n            if grid[nr][nc] == 1 { return dist[cur[0]][cur[1]] }\n            dist[nr][nc] = dist[cur[0]][cur[1]] + 1\n            queue.append([nr, nc])\n        }\n    }\n    return -1\n}`,
              rust: `fn shortestBridge(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    let mut dist = vec![vec![-1i32; n]; n];\n    let mut queue: Vec<(usize, usize)> = Vec::new();\n    let mut started = false;\n    for r in 0..n {\n        if started {\n            break;\n        }\n        for c in 0..n {\n            if started {\n                break;\n            }\n            if grid[r][c] != 1 {\n                continue;\n            }\n            started = true;\n            dist[r][c] = 0;\n            let mut stack: Vec<(usize, usize)> = vec![(r, c)];\n            queue.push((r, c));\n            while let Some((cr, cc)) = stack.pop() {\n                for d in 0..4 {\n                    let nr = cr as i32 + dr[d];\n                    let nc = cc as i32 + dc[d];\n                    if nr < 0 || nc < 0 || nr >= n as i32 || nc >= n as i32 {\n                        continue;\n                    }\n                    let (nru, ncu) = (nr as usize, nc as usize);\n                    if grid[nru][ncu] != 1 || dist[nru][ncu] != -1 {\n                        continue;\n                    }\n                    dist[nru][ncu] = 0;\n                    stack.push((nru, ncu));\n                    queue.push((nru, ncu));\n                }\n            }\n        }\n    }\n    let mut head = 0usize;\n    while head < queue.len() {\n        let (cr, cc) = queue[head];\n        head += 1;\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= n as i32 || nc >= n as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if dist[nru][ncu] != -1 {\n                continue;\n            }\n            if grid[nru][ncu] == 1 {\n                return dist[cr][cc];\n            }\n            dist[nru][ncu] = dist[cr][cc] + 1;\n            queue.push((nru, ncu));\n        }\n    }\n    -1\n}`,
              php: `function shortestBridge($grid) {\n    $n = count($grid);\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    $dist = array();\n    for ($r = 0; $r < $n; $r++) $dist[] = array_fill(0, $n, -1);\n    $queue = array();\n    $started = false;\n    for ($r = 0; $r < $n && !$started; $r++) {\n        for ($c = 0; $c < $n && !$started; $c++) {\n            if ($grid[$r][$c] !== 1) continue;\n            $started = true;\n            $dist[$r][$c] = 0;\n            $stack = array(array($r, $c));\n            $queue[] = array($r, $c);\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n) continue;\n                    if ($grid[$nr][$nc] !== 1 || $dist[$nr][$nc] !== -1) continue;\n                    $dist[$nr][$nc] = 0;\n                    $stack[] = array($nr, $nc);\n                    $queue[] = array($nr, $nc);\n                }\n            }\n        }\n    }\n    $head = 0;\n    while ($head < count($queue)) {\n        $cur = $queue[$head++];\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cur[0] + $dr[$d];\n            $nc = $cur[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n) continue;\n            if ($dist[$nr][$nc] !== -1) continue;\n            if ($grid[$nr][$nc] === 1) return $dist[$cur[0]][$cur[1]];\n            $dist[$nr][$nc] = $dist[$cur[0]][$cur[1]] + 1;\n            $queue[] = array($nr, $nc);\n        }\n    }\n    return -1;\n}`,
              ruby: `def shortestBridge(grid)\n  n = grid.length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  dist = Array.new(n) { Array.new(n, -1) }\n  queue = []\n  started = false\n  (0...n).each do |r|\n    break if started\n    (0...n).each do |c|\n      break if started\n      next if grid[r][c] != 1\n      started = true\n      dist[r][c] = 0\n      stack = [[r, c]]\n      queue.push([r, c])\n      while !stack.empty?\n        cell = stack.pop\n        (0...4).each do |d|\n          nr = cell[0] + dr[d]\n          nc = cell[1] + dc[d]\n          next if nr < 0 || nc < 0 || nr >= n || nc >= n\n          next if grid[nr][nc] != 1 || dist[nr][nc] != -1\n          dist[nr][nc] = 0\n          stack.push([nr, nc])\n          queue.push([nr, nc])\n        end\n      end\n    end\n  end\n  head = 0\n  while head < queue.length\n    cur = queue[head]\n    head += 1\n    (0...4).each do |d|\n      nr = cur[0] + dr[d]\n      nc = cur[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= n || nc >= n\n      next if dist[nr][nc] != -1\n      return dist[cur[0]][cur[1]] if grid[nr][nc] == 1\n      dist[nr][nc] = dist[cur[0]][cur[1]] + 1\n      queue.push([nr, nc])\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Number of Distinct Islands ──────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const rows = grid.length;
      const cols = grid[0].length;
      const seen = grid.map((row) => row.map(() => false));
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      const shapes = new Set<string>();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] !== 1 || seen[r][c]) continue;
          seen[r][c] = true;
          const stack: number[][] = [[r, c]];
          const cells: string[] = [];
          while (stack.length > 0) {
            const cell = stack.pop() as number[];
            cells.push(`${cell[0] - r},${cell[1] - c}`);
            for (let d = 0; d < 4; d++) {
              const nr = cell[0] + dr[d];
              const nc = cell[1] + dc[d];
              if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
              if (grid[nr][nc] !== 1 || seen[nr][nc]) continue;
              seen[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
          cells.sort();
          shapes.add(cells.join("|"));
        }
      }
      return shapes.size;
    };
    return {
      slug: "number-of-distinct-islands",
      title: "Number of Distinct Islands",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google", "Meta"],
      signature: { funcName: "numDistinctIslands", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary matrix `grid`, an **island** is a maximal group of `1`s connected up, down, left or right.\n\nTwo islands are considered the same if one can be **translated** onto the other — rotations and reflections do not count. Return the number of distinct islands.",
        [
          { in: "grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,0,1,1]]", out: "1" },
          { in: "grid = [[1,1,0,1,1],[1,0,0,0,0],[0,0,0,0,1],[1,1,0,1,1]]", out: "3" },
          { in: "grid = [[0]]", out: "0" },
        ],
        ["1 <= grid.length, grid[i].length <= 12", "grid[i][j] is 0 or 1."]),
      hints: [
        "Walk each island once and record its cells **relative** to the first cell you entered.",
        "Sorting those relative coordinates gives a canonical shape independent of traversal order.",
        "Store the canonical shapes in a set and return its size.",
      ],
      examples: [
        { input: "[[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,0,1,1]]", expectedOutput: "1" },
        { input: "[[1,1,0,1,1],[1,0,0,0,0],[0,0,0,0,1],[1,1,0,1,1]]", expectedOutput: "3" },
        { input: "[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 12);
        const cols = ri(rng, 1, 12);
        const grid = randGrid(rng, rows, cols, 0, 1);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def numDistinctIslands(grid) -> int:\n    rows, cols = len(grid), len(grid[0])\n    seen = [[False] * cols for _ in range(rows)]\n    shapes = set()\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] != 1 or seen[r][c]:\n                continue\n            seen[r][c] = True\n            stack = [(r, c)]\n            cells = []\n            while stack:\n                cr, cc = stack.pop()\n                cells.append((cr - r, cc - c))\n                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):\n                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n            shapes.add(tuple(sorted(cells)))\n    return len(shapes)`,
        javascript: `var numDistinctIslands = function(grid) {\n    const rows = grid.length, cols = grid[0].length;\n    const seen = [];\n    for (let r = 0; r < rows; r++) {\n        const row = [];\n        for (let c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    const shapes = {};\n    let count = 0;\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (grid[r][c] !== 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            const stack = [[r, c]];\n            const cells = [];\n            while (stack.length > 0) {\n                const cell = stack.pop();\n                cells.push((cell[0] - r) + "," + (cell[1] - c));\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] !== 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc]);\n                }\n            }\n            cells.sort();\n            const key = cells.join("|");\n            if (shapes[key] !== true) {\n                shapes[key] = true;\n                count++;\n            }\n        }\n    }\n    return count;\n};`,
              typescript: `function numDistinctIslands(grid: number[][]): number {\n    var rows = grid.length;\n    var cols = grid[0].length;\n    var seen: boolean[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: boolean[] = [];\n        for (var c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var shapes: { [key: string]: boolean } = {};\n    var count = 0;\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            if (grid[r2][c2] !== 1 || seen[r2][c2]) continue;\n            seen[r2][c2] = true;\n            var stack: number[][] = [[r2, c2]];\n            var cells: string[] = [];\n            while (stack.length > 0) {\n                var cell = stack.pop() as number[];\n                cells.push((cell[0] - r2) + "," + (cell[1] - c2));\n                for (var d = 0; d < 4; d++) {\n                    var nr = cell[0] + dr[d];\n                    var nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] !== 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc]);\n                }\n            }\n            cells.sort();\n            var key = cells.join("|");\n            if (shapes[key] !== true) {\n                shapes[key] = true;\n                count++;\n            }\n        }\n    }\n    return count;\n}`,
              java: `public static int numDistinctIslands(int[][] grid) {\n    int rows = grid.length, cols = grid[0].length;\n    boolean[][] seen = new boolean[rows][cols];\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    Set<String> shapes = new HashSet<>();\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] != 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{r, c});\n            List<String> cells = new ArrayList<>();\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                cells.add((cell[0] - r) + "," + (cell[1] - c));\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push(new int[]{nr, nc});\n                }\n            }\n            Collections.sort(cells);\n            shapes.add(String.join("|", cells));\n        }\n    }\n    return shapes.size();\n}`,
              cpp: `int numDistinctIslands(vector<vector<int>>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    set<string> shapes;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] != 1 || seen[r][c]) continue;\n            seen[r][c] = true;\n            vector<pair<int,int>> stack;\n            stack.push_back(make_pair(r, c));\n            vector<string> cells;\n            while (!stack.empty()) {\n                pair<int,int> cell = stack.back();\n                stack.pop_back();\n                cells.push_back(to_string(cell.first - r) + "," + to_string(cell.second - c));\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell.first + dr[d], nc = cell.second + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack.push_back(make_pair(nr, nc));\n                }\n            }\n            sort(cells.begin(), cells.end());\n            string key;\n            for (size_t i = 0; i < cells.size(); i++) {\n                if (i > 0) key += "|";\n                key += cells[i];\n            }\n            shapes.insert(key);\n        }\n    }\n    return (int) shapes.size();\n}`,
              c: `static int cmpCellKey(const void* a, const void* b) {\n    return strcmp(*(const char**) a, *(const char**) b);\n}\n\nint numDistinctIslands(int** grid, int gridSize, int* gridColSize) {\n    int rows = gridSize, cols = gridColSize[0];\n    int total = rows * cols;\n    char* seen = (char*) calloc((size_t) total, sizeof(char));\n    int* stack = (int*) malloc((size_t) total * sizeof(int));\n    char** cells = (char**) malloc((size_t) total * sizeof(char*));\n    char** shapes = (char**) malloc((size_t) total * sizeof(char*));\n    int shapeCount = 0;\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (grid[r][c] != 1 || seen[r * cols + c]) continue;\n            seen[r * cols + c] = 1;\n            int top = 0, m = 0;\n            stack[top++] = r * cols + c;\n            while (top > 0) {\n                int cell = stack[--top];\n                int cr = cell / cols, cc = cell % cols;\n                cells[m] = (char*) malloc(16);\n                sprintf(cells[m], "%d,%d", cr - r, cc - c);\n                m++;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cr + dr[d], nc = cc + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != 1 || seen[nr * cols + nc]) continue;\n                    seen[nr * cols + nc] = 1;\n                    stack[top++] = nr * cols + nc;\n                }\n            }\n            qsort(cells, m, sizeof(char*), cmpCellKey);\n            char* key = (char*) malloc((size_t) (m * 17 + 2));\n            key[0] = '\\0';\n            for (int i = 0; i < m; i++) {\n                if (i > 0) strcat(key, "|");\n                strcat(key, cells[i]);\n                free(cells[i]);\n            }\n            int duplicate = 0;\n            for (int i = 0; i < shapeCount; i++) {\n                if (strcmp(shapes[i], key) == 0) {\n                    duplicate = 1;\n                    break;\n                }\n            }\n            if (duplicate) free(key);\n            else shapes[shapeCount++] = key;\n        }\n    }\n    for (int i = 0; i < shapeCount; i++) free(shapes[i]);\n    free(shapes);\n    free(cells);\n    free(stack);\n    free(seen);\n    return shapeCount;\n}`,
              csharp: `public static int NumDistinctIslands(int[][] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var shapes = new HashSet<string>();\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (grid[r][c] != 1 || seen[r, c]) continue;\n            seen[r, c] = true;\n            var stack = new List<int[]>();\n            stack.Add(new int[] { r, c });\n            var cells = new List<string>();\n            while (stack.Count > 0)\n            {\n                int[] cell = stack[stack.Count - 1];\n                stack.RemoveAt(stack.Count - 1);\n                cells.Add((cell[0] - r) + "," + (cell[1] - c));\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != 1 || seen[nr, nc]) continue;\n                    seen[nr, nc] = true;\n                    stack.Add(new int[] { nr, nc });\n                }\n            }\n            cells.Sort(string.CompareOrdinal);\n            shapes.Add(string.Join("|", cells));\n        }\n    }\n    return shapes.Count;\n}`,
              go: `func numDistinctIslands(grid [][]int) int {\n	rows, cols := len(grid), len(grid[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	shapes := map[string]bool{}\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if grid[r][c] != 1 || seen[r][c] {\n				continue\n			}\n			seen[r][c] = true\n			stack := [][2]int{{r, c}}\n			cells := []string{}\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				cells = append(cells, strconv.Itoa(cell[0]-r)+","+strconv.Itoa(cell[1]-c))\n				for d := 0; d < 4; d++ {\n					nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n					if nr < 0 || nc < 0 || nr >= rows || nc >= cols {\n						continue\n					}\n					if grid[nr][nc] != 1 || seen[nr][nc] {\n						continue\n					}\n					seen[nr][nc] = true\n					stack = append(stack, [2]int{nr, nc})\n				}\n			}\n			sort.Strings(cells)\n			shapes[strings.Join(cells, "|")] = true\n		}\n	}\n	return len(shapes)\n}`,
              kotlin: `fun numDistinctIslands(grid: Array<IntArray>): Int {\n    val rows = grid.size\n    val cols = grid[0].size\n    val seen = Array(rows) { BooleanArray(cols) }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val shapes = HashSet<String>()\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (grid[r][c] != 1 || seen[r][c]) continue\n            seen[r][c] = true\n            val stack = ArrayList<IntArray>()\n            stack.add(intArrayOf(r, c))\n            val cells = ArrayList<String>()\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                cells.add("" + (cell[0] - r) + "," + (cell[1] - c))\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue\n                    if (grid[nr][nc] != 1 || seen[nr][nc]) continue\n                    seen[nr][nc] = true\n                    stack.add(intArrayOf(nr, nc))\n                }\n            }\n            cells.sort()\n            shapes.add(cells.joinToString("|"))\n        }\n    }\n    return shapes.size\n}`,
              swift: `func numDistinctIslands(_ grid: [[Int]]) -> Int {\n    let rows = grid.count\n    let cols = grid[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var shapes = Set<String>()\n    for r in 0..<rows {\n        for c in 0..<cols {\n            if grid[r][c] != 1 || seen[r][c] { continue }\n            seen[r][c] = true\n            var stack: [[Int]] = [[r, c]]\n            var cells: [String] = []\n            while let cell = stack.popLast() {\n                cells.append("\\(cell[0] - r),\\(cell[1] - c)")\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr < 0 || nc < 0 || nr >= rows || nc >= cols { continue }\n                    if grid[nr][nc] != 1 || seen[nr][nc] { continue }\n                    seen[nr][nc] = true\n                    stack.append([nr, nc])\n                }\n            }\n            cells.sort()\n            shapes.insert(cells.joined(separator: "|"))\n        }\n    }\n    return shapes.count\n}`,
              rust: `use std::collections::HashSet;\n\nfn numDistinctIslands(grid: Vec<Vec<i32>>) -> i32 {\n    let rows = grid.len();\n    let cols = grid[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    let mut shapes: HashSet<String> = HashSet::new();\n    for r in 0..rows {\n        for c in 0..cols {\n            if grid[r][c] != 1 || seen[r][c] {\n                continue;\n            }\n            seen[r][c] = true;\n            let mut stack: Vec<(usize, usize)> = vec![(r, c)];\n            let mut cells: Vec<String> = Vec::new();\n            while let Some((cr, cc)) = stack.pop() {\n                cells.push(format!("{},{}", cr as i32 - r as i32, cc as i32 - c as i32));\n                for d in 0..4 {\n                    let nr = cr as i32 + dr[d];\n                    let nc = cc as i32 + dc[d];\n                    if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                        continue;\n                    }\n                    let (nru, ncu) = (nr as usize, nc as usize);\n                    if grid[nru][ncu] != 1 || seen[nru][ncu] {\n                        continue;\n                    }\n                    seen[nru][ncu] = true;\n                    stack.push((nru, ncu));\n                }\n            }\n            cells.sort();\n            shapes.insert(cells.join("|"));\n        }\n    }\n    shapes.len() as i32\n}`,
              php: `function numDistinctIslands($grid) {\n    $rows = count($grid);\n    $cols = count($grid[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    $shapes = array();\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if ($grid[$r][$c] !== 1 || $seen[$r][$c]) continue;\n            $seen[$r][$c] = true;\n            $stack = array(array($r, $c));\n            $cells = array();\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                $cells[] = ($cell[0] - $r) . "," . ($cell[1] - $c);\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols) continue;\n                    if ($grid[$nr][$nc] !== 1 || $seen[$nr][$nc]) continue;\n                    $seen[$nr][$nc] = true;\n                    $stack[] = array($nr, $nc);\n                }\n            }\n            sort($cells, SORT_STRING);\n            $shapes[implode("|", $cells)] = true;\n        }\n    }\n    return count($shapes);\n}`,
              ruby: `def numDistinctIslands(grid)\n  rows = grid.length\n  cols = grid[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  shapes = {}\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      next if grid[r][c] != 1 || seen[r][c]\n      seen[r][c] = true\n      stack = [[r, c]]\n      cells = []\n      while !stack.empty?\n        cell = stack.pop\n        cells.push("#{cell[0] - r},#{cell[1] - c}")\n        (0...4).each do |d|\n          nr = cell[0] + dr[d]\n          nc = cell[1] + dc[d]\n          next if nr < 0 || nc < 0 || nr >= rows || nc >= cols\n          next if grid[nr][nc] != 1 || seen[nr][nc]\n          seen[nr][nc] = true\n          stack.push([nr, nc])\n        end\n      end\n      shapes[cells.sort.join("|")] = true\n    end\n  end\n  shapes.length\nend`,
      },
    };
  })(),

  // ── Detect Cycles in 2D Grid ────────────────────────────────────
  (() => {
    const ref = (grid: string[]) => {
      const rows = grid.length;
      const cols = grid[0].length;
      const seen: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < cols; c++) row.push(false);
        seen.push(row);
      }
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (seen[r][c]) continue;
          const letter = grid[r][c];
          // Iterative DFS carrying the cell we came from, so we never treat the
          // immediate parent as a cycle.
          const stack: number[][] = [[r, c, -1, -1]];
          seen[r][c] = true;
          while (stack.length > 0) {
            const cell = stack.pop() as number[];
            for (let d = 0; d < 4; d++) {
              const nr = cell[0] + dr[d];
              const nc = cell[1] + dc[d];
              if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
              if (grid[nr][nc] !== letter) continue;
              if (nr === cell[2] && nc === cell[3]) continue;
              if (seen[nr][nc]) return true;
              seen[nr][nc] = true;
              stack.push([nr, nc, cell[0], cell[1]]);
            }
          }
        }
      }
      return false;
    };
    return {
      slug: "detect-cycles-in-2d-grid",
      title: "Detect Cycles in 2D Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "Amazon", "Google"],
      signature: { funcName: "containsCycle", params: [{ name: "grid", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given a grid of lowercase letters, one string per row. A **cycle** is a path of length 4 or more that starts and ends on the same cell, moves only between side-adjacent cells holding the **same letter**, and never steps straight back to the cell it just came from.\n\nReturn `true` if the grid contains any cycle.",
        [
          { in: 'grid = ["aaaa","abca","aada","aaaa"]', out: "true" },
          { in: 'grid = ["aaaa","abca","aaaa"]', out: "true" },
          { in: 'grid = ["ab","ba"]', out: "false" },
        ],
        ["1 <= grid.length <= 12", "All rows have the same length, between 1 and 12.", "The grid contains only lowercase English letters."]),
      hints: [
        "Explore each same-letter region with a DFS, carrying the cell you arrived from.",
        "Skip that parent cell so a simple back-and-forth is not mistaken for a cycle.",
        "Reaching an already-visited cell that is not the parent means a cycle exists.",
      ],
      examples: [
        { input: '["aaaa","abca","aada","aaaa"]', expectedOutput: "true" },
        { input: '["aaaa","abca","aaaa"]', expectedOutput: "true" },
        { input: '["ab","ba"]', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 12);
        const cols = ri(rng, 1, 12);
        const alphabet = rng() < 0.6 ? "ab" : "abc";
        const grid = Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("")
        );
        return { input: fmtStrArr(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: `def containsCycle(grid) -> bool:\n    rows, cols = len(grid), len(grid[0])\n    seen = [[False] * cols for _ in range(rows)]\n    for r in range(rows):\n        for c in range(cols):\n            if seen[r][c]:\n                continue\n            letter = grid[r][c]\n            stack = [(r, c, -1, -1)]\n            seen[r][c] = True\n            while stack:\n                cr, cc, pr, pc = stack.pop()\n                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):\n                    if not (0 <= nr < rows and 0 <= nc < cols):\n                        continue\n                    if grid[nr][nc] != letter or (nr == pr and nc == pc):\n                        continue\n                    if seen[nr][nc]:\n                        return True\n                    seen[nr][nc] = True\n                    stack.append((nr, nc, cr, cc))\n    return False`,
        javascript: `var containsCycle = function(grid) {\n    const rows = grid.length, cols = grid[0].length;\n    const seen = [];\n    for (let r = 0; r < rows; r++) {\n        const row = [];\n        for (let c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (seen[r][c]) continue;\n            const letter = grid[r].charAt(c);\n            const stack = [[r, c, -1, -1]];\n            seen[r][c] = true;\n            while (stack.length > 0) {\n                const cell = stack.pop();\n                for (let d = 0; d < 4; d++) {\n                    const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr].charAt(nc) !== letter) continue;\n                    if (nr === cell[2] && nc === cell[3]) continue;\n                    if (seen[nr][nc]) return true;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc, cell[0], cell[1]]);\n                }\n            }\n        }\n    }\n    return false;\n};`,
              typescript: `function containsCycle(grid: string[]): boolean {\n    var rows = grid.length;\n    var cols = grid[0].length;\n    var seen: boolean[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: boolean[] = [];\n        for (var c = 0; c < cols; c++) row.push(false);\n        seen.push(row);\n    }\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            if (seen[r2][c2]) continue;\n            var letter = grid[r2].charAt(c2);\n            var stack: number[][] = [[r2, c2, -1, -1]];\n            seen[r2][c2] = true;\n            while (stack.length > 0) {\n                var cell = stack.pop() as number[];\n                for (var d = 0; d < 4; d++) {\n                    var nr = cell[0] + dr[d];\n                    var nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr].charAt(nc) !== letter) continue;\n                    if (nr === cell[2] && nc === cell[3]) continue;\n                    if (seen[nr][nc]) return true;\n                    seen[nr][nc] = true;\n                    stack.push([nr, nc, cell[0], cell[1]]);\n                }\n            }\n        }\n    }\n    return false;\n}`,
              java: `public static boolean containsCycle(String[] grid) {\n    int rows = grid.length, cols = grid[0].length();\n    boolean[][] seen = new boolean[rows][cols];\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (seen[r][c]) continue;\n            char letter = grid[r].charAt(c);\n            Deque<int[]> stack = new ArrayDeque<>();\n            stack.push(new int[]{r, c, -1, -1});\n            seen[r][c] = true;\n            while (!stack.isEmpty()) {\n                int[] cell = stack.pop();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr].charAt(nc) != letter) continue;\n                    if (nr == cell[2] && nc == cell[3]) continue;\n                    if (seen[nr][nc]) return true;\n                    seen[nr][nc] = true;\n                    stack.push(new int[]{nr, nc, cell[0], cell[1]});\n                }\n            }\n        }\n    }\n    return false;\n}`,
              cpp: `bool containsCycle(vector<string>& grid) {\n    int rows = (int) grid.size(), cols = (int) grid[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (seen[r][c]) continue;\n            char letter = grid[r][c];\n            vector<array<int,4>> stack;\n            stack.push_back({r, c, -1, -1});\n            seen[r][c] = true;\n            while (!stack.empty()) {\n                array<int,4> cell = stack.back();\n                stack.pop_back();\n                for (int d = 0; d < 4; d++) {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != letter) continue;\n                    if (nr == cell[2] && nc == cell[3]) continue;\n                    if (seen[nr][nc]) return true;\n                    seen[nr][nc] = true;\n                    stack.push_back({nr, nc, cell[0], cell[1]});\n                }\n            }\n        }\n    }\n    return false;\n}`,
              c: `bool containsCycle(char** grid, int gridSize) {\n    int rows = gridSize;\n    int cols = (int) strlen(grid[0]);\n    int total = rows * cols;\n    char* seen = (char*) calloc((size_t) total, sizeof(char));\n    int* stack = (int*) malloc((size_t) total * 2 * sizeof(int));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (seen[r * cols + c]) continue;\n            char letter = grid[r][c];\n            int top = 0;\n            stack[top * 2] = r * cols + c;\n            stack[top * 2 + 1] = -1;\n            top++;\n            seen[r * cols + c] = 1;\n            while (top > 0) {\n                top--;\n                int cell = stack[top * 2];\n                int parent = stack[top * 2 + 1];\n                int cr = cell / cols, cc = cell % cols;\n                for (int d = 0; d < 4; d++) {\n                    int nr = cr + dr[d], nc = cc + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != letter) continue;\n                    if (nr * cols + nc == parent) continue;\n                    if (seen[nr * cols + nc]) {\n                        free(seen);\n                        free(stack);\n                        return true;\n                    }\n                    seen[nr * cols + nc] = 1;\n                    stack[top * 2] = nr * cols + nc;\n                    stack[top * 2 + 1] = cell;\n                    top++;\n                }\n            }\n        }\n    }\n    free(seen);\n    free(stack);\n    return false;\n}`,
              csharp: `public static bool ContainsCycle(string[] grid)\n{\n    int rows = grid.Length, cols = grid[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (seen[r, c]) continue;\n            char letter = grid[r][c];\n            var stack = new List<int[]>();\n            stack.Add(new int[] { r, c, -1, -1 });\n            seen[r, c] = true;\n            while (stack.Count > 0)\n            {\n                int[] cell = stack[stack.Count - 1];\n                stack.RemoveAt(stack.Count - 1);\n                for (int d = 0; d < 4; d++)\n                {\n                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;\n                    if (grid[nr][nc] != letter) continue;\n                    if (nr == cell[2] && nc == cell[3]) continue;\n                    if (seen[nr, nc]) return true;\n                    seen[nr, nc] = true;\n                    stack.Add(new int[] { nr, nc, cell[0], cell[1] });\n                }\n            }\n        }\n    }\n    return false;\n}`,
              go: `func containsCycle(grid []string) bool {\n	rows, cols := len(grid), len(grid[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if seen[r][c] {\n				continue\n			}\n			letter := grid[r][c]\n			stack := [][4]int{{r, c, -1, -1}}\n			seen[r][c] = true\n			for len(stack) > 0 {\n				cell := stack[len(stack)-1]\n				stack = stack[:len(stack)-1]\n				for d := 0; d < 4; d++ {\n					nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n					if nr < 0 || nc < 0 || nr >= rows || nc >= cols {\n						continue\n					}\n					if grid[nr][nc] != letter {\n						continue\n					}\n					if nr == cell[2] && nc == cell[3] {\n						continue\n					}\n					if seen[nr][nc] {\n						return true\n					}\n					seen[nr][nc] = true\n					stack = append(stack, [4]int{nr, nc, cell[0], cell[1]})\n				}\n			}\n		}\n	}\n	return false\n}`,
              kotlin: `fun containsCycle(grid: Array<String>): Boolean {\n    val rows = grid.size\n    val cols = grid[0].length\n    val seen = Array(rows) { BooleanArray(cols) }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (seen[r][c]) continue\n            val letter = grid[r][c]\n            val stack = ArrayList<IntArray>()\n            stack.add(intArrayOf(r, c, -1, -1))\n            seen[r][c] = true\n            while (stack.isNotEmpty()) {\n                val cell = stack.removeAt(stack.size - 1)\n                for (d in 0 until 4) {\n                    val nr = cell[0] + dr[d]\n                    val nc = cell[1] + dc[d]\n                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue\n                    if (grid[nr][nc] != letter) continue\n                    if (nr == cell[2] && nc == cell[3]) continue\n                    if (seen[nr][nc]) return true\n                    seen[nr][nc] = true\n                    stack.add(intArrayOf(nr, nc, cell[0], cell[1]))\n                }\n            }\n        }\n    }\n    return false\n}`,
              swift: `func containsCycle(_ grid: [String]) -> Bool {\n    let chars = grid.map { Array($0) }\n    let rows = chars.count\n    let cols = chars[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    for r in 0..<rows {\n        for c in 0..<cols {\n            if seen[r][c] { continue }\n            let letter = chars[r][c]\n            var stack: [[Int]] = [[r, c, -1, -1]]\n            seen[r][c] = true\n            while let cell = stack.popLast() {\n                for d in 0..<4 {\n                    let nr = cell[0] + dr[d]\n                    let nc = cell[1] + dc[d]\n                    if nr < 0 || nc < 0 || nr >= rows || nc >= cols { continue }\n                    if chars[nr][nc] != letter { continue }\n                    if nr == cell[2] && nc == cell[3] { continue }\n                    if seen[nr][nc] { return true }\n                    seen[nr][nc] = true\n                    stack.append([nr, nc, cell[0], cell[1]])\n                }\n            }\n        }\n    }\n    return false\n}`,
              rust: `fn containsCycle(grid: Vec<String>) -> bool {\n    let chars: Vec<Vec<u8>> = grid.iter().map(|row| row.bytes().collect()).collect();\n    let rows = chars.len();\n    let cols = chars[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    for r in 0..rows {\n        for c in 0..cols {\n            if seen[r][c] {\n                continue;\n            }\n            let letter = chars[r][c];\n            let mut stack: Vec<(usize, usize, i32, i32)> = vec![(r, c, -1, -1)];\n            seen[r][c] = true;\n            while let Some((cr, cc, pr, pc)) = stack.pop() {\n                for d in 0..4 {\n                    let nr = cr as i32 + dr[d];\n                    let nc = cc as i32 + dc[d];\n                    if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                        continue;\n                    }\n                    let (nru, ncu) = (nr as usize, nc as usize);\n                    if chars[nru][ncu] != letter {\n                        continue;\n                    }\n                    if nr == pr && nc == pc {\n                        continue;\n                    }\n                    if seen[nru][ncu] {\n                        return true;\n                    }\n                    seen[nru][ncu] = true;\n                    stack.push((nru, ncu, cr as i32, cc as i32));\n                }\n            }\n        }\n    }\n    false\n}`,
              php: `function containsCycle($grid) {\n    $rows = count($grid);\n    $cols = strlen($grid[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if ($seen[$r][$c]) continue;\n            $letter = $grid[$r][$c];\n            $stack = array(array($r, $c, -1, -1));\n            $seen[$r][$c] = true;\n            while (count($stack) > 0) {\n                $cell = array_pop($stack);\n                for ($d = 0; $d < 4; $d++) {\n                    $nr = $cell[0] + $dr[$d];\n                    $nc = $cell[1] + $dc[$d];\n                    if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols) continue;\n                    if ($grid[$nr][$nc] !== $letter) continue;\n                    if ($nr === $cell[2] && $nc === $cell[3]) continue;\n                    if ($seen[$nr][$nc]) return true;\n                    $seen[$nr][$nc] = true;\n                    $stack[] = array($nr, $nc, $cell[0], $cell[1]);\n                }\n            }\n        }\n    }\n    return false;\n}`,
              ruby: `def containsCycle(grid)\n  rows = grid.length\n  cols = grid[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      next if seen[r][c]\n      letter = grid[r][c]\n      stack = [[r, c, -1, -1]]\n      seen[r][c] = true\n      while !stack.empty?\n        cell = stack.pop\n        (0...4).each do |d|\n          nr = cell[0] + dr[d]\n          nc = cell[1] + dc[d]\n          next if nr < 0 || nc < 0 || nr >= rows || nc >= cols\n          next if grid[nr][nc] != letter\n          next if nr == cell[2] && nc == cell[3]\n          return true if seen[nr][nc]\n          seen[nr][nc] = true\n          stack.push([nr, nc, cell[0], cell[1]])\n        end\n      end\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Minimum Height Trees ────────────────────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      if (n === 1) return [0];
      const adjacency: number[][] = Array.from({ length: n }, () => []);
      const degree: number[] = [];
      for (let i = 0; i < n; i++) degree.push(0);
      for (let i = 0; i < edges.length; i++) {
        adjacency[edges[i][0]].push(edges[i][1]);
        adjacency[edges[i][1]].push(edges[i][0]);
        degree[edges[i][0]]++;
        degree[edges[i][1]]++;
      }
      let leaves: number[] = [];
      for (let i = 0; i < n; i++) {
        if (degree[i] === 1) leaves.push(i);
      }
      let remaining = n;
      while (remaining > 2) {
        remaining -= leaves.length;
        const next: number[] = [];
        for (let i = 0; i < leaves.length; i++) {
          const leaf = leaves[i];
          for (let j = 0; j < adjacency[leaf].length; j++) {
            const neighbour = adjacency[leaf][j];
            degree[neighbour]--;
            if (degree[neighbour] === 1) next.push(neighbour);
          }
        }
        leaves = next;
      }
      return leaves.slice().sort((a, b) => a - b);
    };
    return {
      slug: "minimum-height-trees",
      title: "Minimum Height Trees",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort", "Amazon", "Google", "Meta"],
      signature: { funcName: "findMinHeightTrees", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A tree has `n` nodes labelled `0` through `n - 1` and `n - 1` undirected `edges`. Rooting it at any node produces a tree of some height.\n\nReturn every root that yields the **minimum** possible height, in ascending order.",
        [
          { in: "n = 4, edges = [[1,0],[1,2],[1,3]]", out: "[1]" },
          { in: "n = 6, edges = [[3,0],[3,1],[3,2],[3,4],[5,4]]", out: "[3,4]" },
          { in: "n = 1, edges = []", out: "[0]" },
        ],
        ["1 <= n <= 40", "edges.length == n - 1", "The input is guaranteed to be a tree."],
        "There are at most two answers. Why can there never be three?"),
      hints: [
        "The best roots sit at the centre of the tree's longest path, so peel inward from the outside.",
        "Repeatedly strip off all current leaves, exactly like a topological sort on an undirected tree.",
        "Stop when 2 or fewer nodes remain — those are the centroids.",
      ],
      examples: [
        { input: "4\n[[1,0],[1,2],[1,3]]", expectedOutput: "[1]" },
        { input: "6\n[[3,0],[3,1],[3,2],[3,4],[5,4]]", expectedOutput: "[3,4]" },
        { input: "1\n[]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const edges: number[][] = [];
        for (let v = 1; v < n; v++) edges.push([ri(rng, 0, v - 1), v]);
        const shuffled = shuffle(rng, edges.map((e) => (rng() < 0.5 ? [e[0], e[1]] : [e[1], e[0]])));
        return { input: `${n}\n${fmtIntMat(shuffled)}`, expectedOutput: fmtIntArr(ref(n, shuffled)) };
      },
      solutions: {
        python: `def findMinHeightTrees(n: int, edges):\n    if n == 1:\n        return [0]\n    adjacency = [[] for _ in range(n)]\n    degree = [0] * n\n    for a, b in edges:\n        adjacency[a].append(b)\n        adjacency[b].append(a)\n        degree[a] += 1\n        degree[b] += 1\n    leaves = [i for i in range(n) if degree[i] == 1]\n    remaining = n\n    while remaining > 2:\n        remaining -= len(leaves)\n        nxt = []\n        for leaf in leaves:\n            for neighbour in adjacency[leaf]:\n                degree[neighbour] -= 1\n                if degree[neighbour] == 1:\n                    nxt.append(neighbour)\n        leaves = nxt\n    return sorted(leaves)`,
        javascript: `var findMinHeightTrees = function(n, edges) {\n    if (n === 1) return [0];\n    const adjacency = [];\n    const degree = [];\n    for (let i = 0; i < n; i++) {\n        adjacency.push([]);\n        degree.push(0);\n    }\n    for (let i = 0; i < edges.length; i++) {\n        adjacency[edges[i][0]].push(edges[i][1]);\n        adjacency[edges[i][1]].push(edges[i][0]);\n        degree[edges[i][0]]++;\n        degree[edges[i][1]]++;\n    }\n    let leaves = [];\n    for (let i = 0; i < n; i++) {\n        if (degree[i] === 1) leaves.push(i);\n    }\n    let remaining = n;\n    while (remaining > 2) {\n        remaining -= leaves.length;\n        const next = [];\n        for (let i = 0; i < leaves.length; i++) {\n            const leaf = leaves[i];\n            for (let j = 0; j < adjacency[leaf].length; j++) {\n                const neighbour = adjacency[leaf][j];\n                degree[neighbour]--;\n                if (degree[neighbour] === 1) next.push(neighbour);\n            }\n        }\n        leaves = next;\n    }\n    return leaves.slice().sort(function(a, b) { return a - b; });\n};`,
              typescript: `function findMinHeightTrees(n: number, edges: number[][]): number[] {\n    if (n === 1) return [0];\n    var adjacency: number[][] = [];\n    var degree: number[] = [];\n    for (var i = 0; i < n; i++) {\n        adjacency.push([]);\n        degree.push(0);\n    }\n    for (var j = 0; j < edges.length; j++) {\n        adjacency[edges[j][0]].push(edges[j][1]);\n        adjacency[edges[j][1]].push(edges[j][0]);\n        degree[edges[j][0]]++;\n        degree[edges[j][1]]++;\n    }\n    var leaves: number[] = [];\n    for (var k = 0; k < n; k++) {\n        if (degree[k] === 1) leaves.push(k);\n    }\n    var remaining = n;\n    while (remaining > 2) {\n        remaining -= leaves.length;\n        var next: number[] = [];\n        for (var m = 0; m < leaves.length; m++) {\n            var leaf = leaves[m];\n            for (var p = 0; p < adjacency[leaf].length; p++) {\n                var neighbour = adjacency[leaf][p];\n                degree[neighbour]--;\n                if (degree[neighbour] === 1) next.push(neighbour);\n            }\n        }\n        leaves = next;\n    }\n    return leaves.slice().sort(function (a, b) { return a - b; });\n}`,
              java: `public static int[] findMinHeightTrees(int n, int[][] edges) {\n    if (n == 1) return new int[]{0};\n    List<List<Integer>> adjacency = new ArrayList<>();\n    int[] degree = new int[n];\n    for (int i = 0; i < n; i++) adjacency.add(new ArrayList<>());\n    for (int[] e : edges) {\n        adjacency.get(e[0]).add(e[1]);\n        adjacency.get(e[1]).add(e[0]);\n        degree[e[0]]++;\n        degree[e[1]]++;\n    }\n    List<Integer> leaves = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n        if (degree[i] == 1) leaves.add(i);\n    }\n    int remaining = n;\n    while (remaining > 2) {\n        remaining -= leaves.size();\n        List<Integer> next = new ArrayList<>();\n        for (int leaf : leaves) {\n            for (int neighbour : adjacency.get(leaf)) {\n                degree[neighbour]--;\n                if (degree[neighbour] == 1) next.add(neighbour);\n            }\n        }\n        leaves = next;\n    }\n    Collections.sort(leaves);\n    int[] out = new int[leaves.size()];\n    for (int i = 0; i < leaves.size(); i++) out[i] = leaves.get(i);\n    return out;\n}`,
              cpp: `vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {\n    if (n == 1) return vector<int>{0};\n    vector<vector<int>> adjacency(n);\n    vector<int> degree(n, 0);\n    for (const auto& e : edges) {\n        adjacency[e[0]].push_back(e[1]);\n        adjacency[e[1]].push_back(e[0]);\n        degree[e[0]]++;\n        degree[e[1]]++;\n    }\n    vector<int> leaves;\n    for (int i = 0; i < n; i++) {\n        if (degree[i] == 1) leaves.push_back(i);\n    }\n    int remaining = n;\n    while (remaining > 2) {\n        remaining -= (int) leaves.size();\n        vector<int> next;\n        for (int leaf : leaves) {\n            for (int neighbour : adjacency[leaf]) {\n                degree[neighbour]--;\n                if (degree[neighbour] == 1) next.push_back(neighbour);\n            }\n        }\n        leaves = next;\n    }\n    sort(leaves.begin(), leaves.end());\n    return leaves;\n}`,
              c: `int* findMinHeightTrees(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize) {\n    if (n == 1) {\n        int* single = (int*) malloc(sizeof(int));\n        single[0] = 0;\n        *returnSize = 1;\n        return single;\n    }\n    int* degree = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < edgesSize; i++) {\n        degree[edges[i][0]]++;\n        degree[edges[i][1]]++;\n    }\n    int* offset = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) offset[i + 1] = offset[i] + degree[i];\n    int* fill = (int*) calloc((size_t) n, sizeof(int));\n    int* flat = (int*) malloc((size_t) (2 * edgesSize > 0 ? 2 * edgesSize : 1) * sizeof(int));\n    for (int i = 0; i < edgesSize; i++) {\n        int a = edges[i][0], b = edges[i][1];\n        flat[offset[a] + fill[a]++] = b;\n        flat[offset[b] + fill[b]++] = a;\n    }\n    int* leaves = (int*) malloc((size_t) n * sizeof(int));\n    int* next = (int*) malloc((size_t) n * sizeof(int));\n    int leafCount = 0;\n    for (int i = 0; i < n; i++) {\n        if (degree[i] == 1) leaves[leafCount++] = i;\n    }\n    int remaining = n;\n    while (remaining > 2) {\n        remaining -= leafCount;\n        int nextCount = 0;\n        for (int i = 0; i < leafCount; i++) {\n            int leaf = leaves[i];\n            for (int k = offset[leaf]; k < offset[leaf + 1]; k++) {\n                int neighbour = flat[k];\n                degree[neighbour]--;\n                if (degree[neighbour] == 1) next[nextCount++] = neighbour;\n            }\n        }\n        for (int i = 0; i < nextCount; i++) leaves[i] = next[i];\n        leafCount = nextCount;\n    }\n    for (int i = 0; i < leafCount; i++) {\n        for (int j = i + 1; j < leafCount; j++) {\n            if (leaves[j] < leaves[i]) {\n                int t = leaves[i];\n                leaves[i] = leaves[j];\n                leaves[j] = t;\n            }\n        }\n    }\n    free(degree);\n    free(offset);\n    free(fill);\n    free(flat);\n    free(next);\n    *returnSize = leafCount;\n    return leaves;\n}`,
              csharp: `public static int[] FindMinHeightTrees(int n, int[][] edges)\n{\n    if (n == 1) return new int[] { 0 };\n    var adjacency = new List<List<int>>();\n    int[] degree = new int[n];\n    for (int i = 0; i < n; i++) adjacency.Add(new List<int>());\n    foreach (int[] e in edges)\n    {\n        adjacency[e[0]].Add(e[1]);\n        adjacency[e[1]].Add(e[0]);\n        degree[e[0]]++;\n        degree[e[1]]++;\n    }\n    var leaves = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        if (degree[i] == 1) leaves.Add(i);\n    }\n    int remaining = n;\n    while (remaining > 2)\n    {\n        remaining -= leaves.Count;\n        var next = new List<int>();\n        foreach (int leaf in leaves)\n        {\n            foreach (int neighbour in adjacency[leaf])\n            {\n                degree[neighbour]--;\n                if (degree[neighbour] == 1) next.Add(neighbour);\n            }\n        }\n        leaves = next;\n    }\n    leaves.Sort();\n    return leaves.ToArray();\n}`,
              go: `func findMinHeightTrees(n int, edges [][]int) []int {\n	if n == 1 {\n		return []int{0}\n	}\n	adjacency := make([][]int, n)\n	degree := make([]int, n)\n	for _, e := range edges {\n		adjacency[e[0]] = append(adjacency[e[0]], e[1])\n		adjacency[e[1]] = append(adjacency[e[1]], e[0])\n		degree[e[0]]++\n		degree[e[1]]++\n	}\n	leaves := []int{}\n	for i := 0; i < n; i++ {\n		if degree[i] == 1 {\n			leaves = append(leaves, i)\n		}\n	}\n	remaining := n\n	for remaining > 2 {\n		remaining -= len(leaves)\n		next := []int{}\n		for _, leaf := range leaves {\n			for _, neighbour := range adjacency[leaf] {\n				degree[neighbour]--\n				if degree[neighbour] == 1 {\n					next = append(next, neighbour)\n				}\n			}\n		}\n		leaves = next\n	}\n	sort.Ints(leaves)\n	return leaves\n}`,
              kotlin: `fun findMinHeightTrees(n: Int, edges: Array<IntArray>): IntArray {\n    if (n == 1) return intArrayOf(0)\n    val adjacency = Array(n) { ArrayList<Int>() }\n    val degree = IntArray(n)\n    for (e in edges) {\n        adjacency[e[0]].add(e[1])\n        adjacency[e[1]].add(e[0])\n        degree[e[0]]++\n        degree[e[1]]++\n    }\n    var leaves = ArrayList<Int>()\n    for (i in 0 until n) {\n        if (degree[i] == 1) leaves.add(i)\n    }\n    var remaining = n\n    while (remaining > 2) {\n        remaining -= leaves.size\n        val next = ArrayList<Int>()\n        for (leaf in leaves) {\n            for (neighbour in adjacency[leaf]) {\n                degree[neighbour]--\n                if (degree[neighbour] == 1) next.add(neighbour)\n            }\n        }\n        leaves = next\n    }\n    leaves.sort()\n    return leaves.toIntArray()\n}`,
              swift: `func findMinHeightTrees(_ n: Int, _ edges: [[Int]]) -> [Int] {\n    if n == 1 { return [0] }\n    var adjacency = [[Int]](repeating: [], count: n)\n    var degree = [Int](repeating: 0, count: n)\n    for e in edges {\n        adjacency[e[0]].append(e[1])\n        adjacency[e[1]].append(e[0])\n        degree[e[0]] += 1\n        degree[e[1]] += 1\n    }\n    var leaves: [Int] = []\n    for i in 0..<n where degree[i] == 1 {\n        leaves.append(i)\n    }\n    var remaining = n\n    while remaining > 2 {\n        remaining -= leaves.count\n        var next: [Int] = []\n        for leaf in leaves {\n            for neighbour in adjacency[leaf] {\n                degree[neighbour] -= 1\n                if degree[neighbour] == 1 { next.append(neighbour) }\n            }\n        }\n        leaves = next\n    }\n    return leaves.sorted()\n}`,
              rust: `fn findMinHeightTrees(n: i32, edges: Vec<Vec<i32>>) -> Vec<i32> {\n    if n == 1 {\n        return vec![0];\n    }\n    let size = n as usize;\n    let mut adjacency: Vec<Vec<usize>> = vec![Vec::new(); size];\n    let mut degree = vec![0i32; size];\n    for e in edges.iter() {\n        let (a, b) = (e[0] as usize, e[1] as usize);\n        adjacency[a].push(b);\n        adjacency[b].push(a);\n        degree[a] += 1;\n        degree[b] += 1;\n    }\n    let mut leaves: Vec<usize> = Vec::new();\n    for i in 0..size {\n        if degree[i] == 1 {\n            leaves.push(i);\n        }\n    }\n    let mut remaining = n;\n    while remaining > 2 {\n        remaining -= leaves.len() as i32;\n        let mut next: Vec<usize> = Vec::new();\n        for leaf in leaves.iter() {\n            for neighbour in adjacency[*leaf].clone().iter() {\n                degree[*neighbour] -= 1;\n                if degree[*neighbour] == 1 {\n                    next.push(*neighbour);\n                }\n            }\n        }\n        leaves = next;\n    }\n    leaves.sort();\n    leaves.iter().map(|x| *x as i32).collect()\n}`,
              php: `function findMinHeightTrees($n, $edges) {\n    if ($n === 1) return array(0);\n    $adjacency = array();\n    $degree = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $adjacency[] = array();\n    foreach ($edges as $e) {\n        $adjacency[$e[0]][] = $e[1];\n        $adjacency[$e[1]][] = $e[0];\n        $degree[$e[0]]++;\n        $degree[$e[1]]++;\n    }\n    $leaves = array();\n    for ($i = 0; $i < $n; $i++) {\n        if ($degree[$i] === 1) $leaves[] = $i;\n    }\n    $remaining = $n;\n    while ($remaining > 2) {\n        $remaining -= count($leaves);\n        $next = array();\n        foreach ($leaves as $leaf) {\n            foreach ($adjacency[$leaf] as $neighbour) {\n                $degree[$neighbour]--;\n                if ($degree[$neighbour] === 1) $next[] = $neighbour;\n            }\n        }\n        $leaves = $next;\n    }\n    sort($leaves);\n    return $leaves;\n}`,
              ruby: `def findMinHeightTrees(n, edges)\n  return [0] if n == 1\n  adjacency = Array.new(n) { [] }\n  degree = Array.new(n, 0)\n  edges.each do |e|\n    adjacency[e[0]].push(e[1])\n    adjacency[e[1]].push(e[0])\n    degree[e[0]] += 1\n    degree[e[1]] += 1\n  end\n  leaves = (0...n).select { |i| degree[i] == 1 }\n  remaining = n\n  while remaining > 2\n    remaining -= leaves.length\n    nxt = []\n    leaves.each do |leaf|\n      adjacency[leaf].each do |neighbour|\n        degree[neighbour] -= 1\n        nxt.push(neighbour) if degree[neighbour] == 1\n      end\n    end\n    leaves = nxt\n  end\n  leaves.sort\nend`,
      },
    };
  })(),

  // ── Possible Bipartition ────────────────────────────────────────
  (() => {
    const ref = (n: number, dislikes: number[][]) => {
      const adjacency: number[][] = Array.from({ length: n + 1 }, () => []);
      for (let i = 0; i < dislikes.length; i++) {
        adjacency[dislikes[i][0]].push(dislikes[i][1]);
        adjacency[dislikes[i][1]].push(dislikes[i][0]);
      }
      const color: number[] = [];
      for (let i = 0; i <= n; i++) color.push(0);
      for (let start = 1; start <= n; start++) {
        if (color[start] !== 0) continue;
        color[start] = 1;
        const queue: number[] = [start];
        let head = 0;
        while (head < queue.length) {
          const node = queue[head++];
          for (let i = 0; i < adjacency[node].length; i++) {
            const next = adjacency[node][i];
            if (color[next] === 0) {
              color[next] = -color[node];
              queue.push(next);
            } else if (color[next] === color[node]) {
              return false;
            }
          }
        }
      }
      return true;
    };
    return {
      slug: "possible-bipartition",
      title: "Possible Bipartition",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google", "Meta"],
      signature: { funcName: "possibleBipartition", params: [{ name: "n", type: "int" as const }, { name: "dislikes", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "A group of `n` people labelled `1` through `n` must be split into two groups of any size. `dislikes[i] = [a, b]` means `a` and `b` refuse to be in the same group.\n\nReturn `true` if such a split is possible.",
        [
          { in: "n = 4, dislikes = [[1,2],[1,3],[2,4]]", out: "true", note: "Groups {1,4} and {2,3}." },
          { in: "n = 3, dislikes = [[1,2],[1,3],[2,3]]", out: "false" },
          { in: "n = 1, dislikes = []", out: "true" },
        ],
        ["1 <= n <= 30", "0 <= dislikes.length <= 60", "1 <= dislikes[i][0] < dislikes[i][1] <= n", "There are no duplicate pairs."]),
      hints: [
        "Build a graph where an edge means \"must be apart\" — the question is whether it is bipartite.",
        "Two-colour it with BFS or DFS, giving each neighbour the opposite colour.",
        "Start from every uncoloured person, since the dislike graph may be disconnected.",
      ],
      examples: [
        { input: "4\n[[1,2],[1,3],[2,4]]", expectedOutput: "true" },
        { input: "3\n[[1,2],[1,3],[2,3]]", expectedOutput: "false" },
        { input: "1\n[]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const bipartiteBuild = rng() < 0.45;
        const side = Array.from({ length: n + 1 }, () => (bipartiteBuild ? ri(rng, 0, 1) : 0));
        const seen = new Set<string>();
        const dislikes: number[][] = [];
        const target = ri(rng, 0, Math.min(60, n * 2));
        let attempts = 0;
        while (dislikes.length < target && attempts < target * 5 + 10) {
          attempts++;
          const a = ri(rng, 1, n);
          const b = ri(rng, 1, n);
          if (a >= b) continue;
          if (bipartiteBuild && side[a] === side[b]) continue;
          const key = `${a},${b}`;
          if (seen.has(key)) continue;
          seen.add(key);
          dislikes.push([a, b]);
        }
        return { input: `${n}\n${fmtIntMat(dislikes)}`, expectedOutput: bool(ref(n, dislikes)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef possibleBipartition(n: int, dislikes) -> bool:\n    adjacency = [[] for _ in range(n + 1)]\n    for a, b in dislikes:\n        adjacency[a].append(b)\n        adjacency[b].append(a)\n    color = [0] * (n + 1)\n    for start in range(1, n + 1):\n        if color[start] != 0:\n            continue\n        color[start] = 1\n        queue = deque([start])\n        while queue:\n            node = queue.popleft()\n            for nxt in adjacency[node]:\n                if color[nxt] == 0:\n                    color[nxt] = -color[node]\n                    queue.append(nxt)\n                elif color[nxt] == color[node]:\n                    return False\n    return True`,
        javascript: `var possibleBipartition = function(n, dislikes) {\n    const adjacency = [];\n    for (let i = 0; i <= n; i++) adjacency.push([]);\n    for (let i = 0; i < dislikes.length; i++) {\n        adjacency[dislikes[i][0]].push(dislikes[i][1]);\n        adjacency[dislikes[i][1]].push(dislikes[i][0]);\n    }\n    const color = [];\n    for (let i = 0; i <= n; i++) color.push(0);\n    for (let start = 1; start <= n; start++) {\n        if (color[start] !== 0) continue;\n        color[start] = 1;\n        const queue = [start];\n        let head = 0;\n        while (head < queue.length) {\n            const node = queue[head++];\n            for (let i = 0; i < adjacency[node].length; i++) {\n                const next = adjacency[node][i];\n                if (color[next] === 0) {\n                    color[next] = -color[node];\n                    queue.push(next);\n                } else if (color[next] === color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n};`,
              typescript: `function possibleBipartition(n: number, dislikes: number[][]): boolean {\n    var adjacency: number[][] = [];\n    for (var i = 0; i <= n; i++) adjacency.push([]);\n    for (var j = 0; j < dislikes.length; j++) {\n        adjacency[dislikes[j][0]].push(dislikes[j][1]);\n        adjacency[dislikes[j][1]].push(dislikes[j][0]);\n    }\n    var color: number[] = [];\n    for (var k = 0; k <= n; k++) color.push(0);\n    for (var start = 1; start <= n; start++) {\n        if (color[start] !== 0) continue;\n        color[start] = 1;\n        var queue: number[] = [start];\n        var head = 0;\n        while (head < queue.length) {\n            var node = queue[head++];\n            for (var m = 0; m < adjacency[node].length; m++) {\n                var next = adjacency[node][m];\n                if (color[next] === 0) {\n                    color[next] = -color[node];\n                    queue.push(next);\n                } else if (color[next] === color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              java: `public static boolean possibleBipartition(int n, int[][] dislikes) {\n    List<List<Integer>> adjacency = new ArrayList<>();\n    for (int i = 0; i <= n; i++) adjacency.add(new ArrayList<>());\n    for (int[] pair : dislikes) {\n        adjacency.get(pair[0]).add(pair[1]);\n        adjacency.get(pair[1]).add(pair[0]);\n    }\n    int[] color = new int[n + 1];\n    for (int start = 1; start <= n; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        Deque<Integer> queue = new ArrayDeque<>();\n        queue.addLast(start);\n        while (!queue.isEmpty()) {\n            int node = queue.pollFirst();\n            for (int next : adjacency.get(node)) {\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue.addLast(next);\n                } else if (color[next] == color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              cpp: `bool possibleBipartition(int n, vector<vector<int>>& dislikes) {\n    vector<vector<int>> adjacency(n + 1);\n    for (const auto& pair : dislikes) {\n        adjacency[pair[0]].push_back(pair[1]);\n        adjacency[pair[1]].push_back(pair[0]);\n    }\n    vector<int> color(n + 1, 0);\n    for (int start = 1; start <= n; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        vector<int> queue;\n        queue.push_back(start);\n        size_t head = 0;\n        while (head < queue.size()) {\n            int node = queue[head++];\n            for (int next : adjacency[node]) {\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue.push_back(next);\n                } else if (color[next] == color[node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              c: `bool possibleBipartition(int n, int** dislikes, int dislikesSize, int* dislikesColSize) {\n    int* degree = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < dislikesSize; i++) {\n        degree[dislikes[i][0]]++;\n        degree[dislikes[i][1]]++;\n    }\n    int* offset = (int*) calloc((size_t) (n + 2), sizeof(int));\n    for (int i = 0; i <= n; i++) offset[i + 1] = offset[i] + degree[i];\n    int* fill = (int*) calloc((size_t) (n + 1), sizeof(int));\n    int* flat = (int*) malloc((size_t) (2 * dislikesSize > 0 ? 2 * dislikesSize : 1) * sizeof(int));\n    for (int i = 0; i < dislikesSize; i++) {\n        int a = dislikes[i][0], b = dislikes[i][1];\n        flat[offset[a] + fill[a]++] = b;\n        flat[offset[b] + fill[b]++] = a;\n    }\n    int* color = (int*) calloc((size_t) (n + 1), sizeof(int));\n    int* queue = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    bool ok = true;\n    for (int start = 1; start <= n && ok; start++) {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        int head = 0, tail = 0;\n        queue[tail++] = start;\n        while (head < tail) {\n            int node = queue[head++];\n            for (int k = offset[node]; k < offset[node + 1]; k++) {\n                int next = flat[k];\n                if (color[next] == 0) {\n                    color[next] = -color[node];\n                    queue[tail++] = next;\n                } else if (color[next] == color[node]) {\n                    ok = false;\n                    break;\n                }\n            }\n            if (!ok) break;\n        }\n    }\n    free(degree);\n    free(offset);\n    free(fill);\n    free(flat);\n    free(color);\n    free(queue);\n    return ok;\n}`,
              csharp: `public static bool PossibleBipartition(int n, int[][] dislikes)\n{\n    var adjacency = new List<List<int>>();\n    for (int i = 0; i <= n; i++) adjacency.Add(new List<int>());\n    foreach (int[] pair in dislikes)\n    {\n        adjacency[pair[0]].Add(pair[1]);\n        adjacency[pair[1]].Add(pair[0]);\n    }\n    int[] color = new int[n + 1];\n    for (int start = 1; start <= n; start++)\n    {\n        if (color[start] != 0) continue;\n        color[start] = 1;\n        var queue = new Queue<int>();\n        queue.Enqueue(start);\n        while (queue.Count > 0)\n        {\n            int node = queue.Dequeue();\n            foreach (int next in adjacency[node])\n            {\n                if (color[next] == 0)\n                {\n                    color[next] = -color[node];\n                    queue.Enqueue(next);\n                }\n                else if (color[next] == color[node])\n                {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              go: `func possibleBipartition(n int, dislikes [][]int) bool {\n	adjacency := make([][]int, n+1)\n	for _, pair := range dislikes {\n		adjacency[pair[0]] = append(adjacency[pair[0]], pair[1])\n		adjacency[pair[1]] = append(adjacency[pair[1]], pair[0])\n	}\n	color := make([]int, n+1)\n	for start := 1; start <= n; start++ {\n		if color[start] != 0 {\n			continue\n		}\n		color[start] = 1\n		queue := []int{start}\n		head := 0\n		for head < len(queue) {\n			node := queue[head]\n			head++\n			for _, next := range adjacency[node] {\n				if color[next] == 0 {\n					color[next] = -color[node]\n					queue = append(queue, next)\n				} else if color[next] == color[node] {\n					return false\n				}\n			}\n		}\n	}\n	return true\n}`,
              kotlin: `fun possibleBipartition(n: Int, dislikes: Array<IntArray>): Boolean {\n    val adjacency = Array(n + 1) { ArrayList<Int>() }\n    for (pair in dislikes) {\n        adjacency[pair[0]].add(pair[1])\n        adjacency[pair[1]].add(pair[0])\n    }\n    val color = IntArray(n + 1)\n    for (start in 1..n) {\n        if (color[start] != 0) continue\n        color[start] = 1\n        val queue = ArrayList<Int>()\n        queue.add(start)\n        var head = 0\n        while (head < queue.size) {\n            val node = queue[head++]\n            for (next in adjacency[node]) {\n                if (color[next] == 0) {\n                    color[next] = -color[node]\n                    queue.add(next)\n                } else if (color[next] == color[node]) {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}`,
              swift: `func possibleBipartition(_ n: Int, _ dislikes: [[Int]]) -> Bool {\n    var adjacency = [[Int]](repeating: [], count: n + 1)\n    for pair in dislikes {\n        adjacency[pair[0]].append(pair[1])\n        adjacency[pair[1]].append(pair[0])\n    }\n    var color = [Int](repeating: 0, count: n + 1)\n    for start in 1...max(n, 1) where start <= n {\n        if color[start] != 0 { continue }\n        color[start] = 1\n        var queue = [start]\n        var head = 0\n        while head < queue.count {\n            let node = queue[head]\n            head += 1\n            for next in adjacency[node] {\n                if color[next] == 0 {\n                    color[next] = -color[node]\n                    queue.append(next)\n                } else if color[next] == color[node] {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}`,
              rust: `fn possibleBipartition(n: i32, dislikes: Vec<Vec<i32>>) -> bool {\n    let size = (n + 1) as usize;\n    let mut adjacency: Vec<Vec<usize>> = vec![Vec::new(); size];\n    for pair in dislikes.iter() {\n        let (a, b) = (pair[0] as usize, pair[1] as usize);\n        adjacency[a].push(b);\n        adjacency[b].push(a);\n    }\n    let mut color = vec![0i32; size];\n    for start in 1..size {\n        if color[start] != 0 {\n            continue;\n        }\n        color[start] = 1;\n        let mut queue: Vec<usize> = vec![start];\n        let mut head = 0usize;\n        while head < queue.len() {\n            let node = queue[head];\n            head += 1;\n            for next in adjacency[node].clone().iter() {\n                if color[*next] == 0 {\n                    color[*next] = -color[node];\n                    queue.push(*next);\n                } else if color[*next] == color[node] {\n                    return false;\n                }\n            }\n        }\n    }\n    true\n}`,
              php: `function possibleBipartition($n, $dislikes) {\n    $adjacency = array();\n    for ($i = 0; $i <= $n; $i++) $adjacency[] = array();\n    foreach ($dislikes as $pair) {\n        $adjacency[$pair[0]][] = $pair[1];\n        $adjacency[$pair[1]][] = $pair[0];\n    }\n    $color = array_fill(0, $n + 1, 0);\n    for ($start = 1; $start <= $n; $start++) {\n        if ($color[$start] !== 0) continue;\n        $color[$start] = 1;\n        $queue = array($start);\n        $head = 0;\n        while ($head < count($queue)) {\n            $node = $queue[$head++];\n            foreach ($adjacency[$node] as $next) {\n                if ($color[$next] === 0) {\n                    $color[$next] = -$color[$node];\n                    $queue[] = $next;\n                } else if ($color[$next] === $color[$node]) {\n                    return false;\n                }\n            }\n        }\n    }\n    return true;\n}`,
              ruby: `def possibleBipartition(n, dislikes)\n  adjacency = Array.new(n + 1) { [] }\n  dislikes.each do |pair|\n    adjacency[pair[0]].push(pair[1])\n    adjacency[pair[1]].push(pair[0])\n  end\n  color = Array.new(n + 1, 0)\n  (1..n).each do |start|\n    next if color[start] != 0\n    color[start] = 1\n    queue = [start]\n    head = 0\n    while head < queue.length\n      node = queue[head]\n      head += 1\n      adjacency[node].each do |nxt|\n        if color[nxt] == 0\n          color[nxt] = -color[node]\n          queue.push(nxt)\n        elsif color[nxt] == color[node]\n          return false\n        end\n      end\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Reorder Routes to Make All Paths Lead to the City Zero ──────
  (() => {
    const ref = (n: number, connections: number[][]) => {
      const adjacency: number[][][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < connections.length; i++) {
        adjacency[connections[i][0]].push([connections[i][1], 1]);
        adjacency[connections[i][1]].push([connections[i][0], 0]);
      }
      const seen: boolean[] = [];
      for (let i = 0; i < n; i++) seen.push(false);
      seen[0] = true;
      const stack: number[] = [0];
      let changes = 0;
      while (stack.length > 0) {
        const node = stack.pop() as number;
        for (let i = 0; i < adjacency[node].length; i++) {
          const next = adjacency[node][i][0];
          const away = adjacency[node][i][1];
          if (seen[next]) continue;
          seen[next] = true;
          changes += away;
          stack.push(next);
        }
      }
      return changes;
    };
    return {
      slug: "reorder-routes-to-make-all-paths-lead-to-the-city-zero",
      title: "Reorder Routes to Make All Paths Lead to the City Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minReorder", params: [{ name: "n", type: "int" as const }, { name: "connections", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` cities numbered `0` through `n - 1` and `n - 1` **one-way** roads; `connections[i] = [a, b]` is a road from `a` to `b`. Ignoring direction, the roads form a tree.\n\nReturn the minimum number of roads that must be reversed so that every city can reach city `0`.",
        [
          { in: "n = 6, connections = [[0,1],[1,3],[2,3],[4,0],[4,5]]", out: "3" },
          { in: "n = 5, connections = [[1,0],[1,2],[3,2],[3,4]]", out: "2" },
          { in: "n = 3, connections = [[1,0],[2,0]]", out: "0" },
        ],
        ["2 <= n <= 40", "connections.length == n - 1", "Ignoring direction, the roads form a tree."]),
      hints: [
        "Traverse the tree outward from city 0, walking roads in both directions.",
        "Store each road twice: once as it is, once reversed, tagging which is which.",
        "Every road you traverse in its **original** direction points away from city 0 and must be flipped.",
      ],
      examples: [
        { input: "6\n[[0,1],[1,3],[2,3],[4,0],[4,5]]", expectedOutput: "3" },
        { input: "5\n[[1,0],[1,2],[3,2],[3,4]]", expectedOutput: "2" },
        { input: "3\n[[1,0],[2,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const edges: number[][] = [];
        for (let v = 1; v < n; v++) {
          const parent = ri(rng, 0, v - 1);
          edges.push(rng() < 0.5 ? [parent, v] : [v, parent]);
        }
        const connections = shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(connections)}`, expectedOutput: String(ref(n, connections)) };
      },
      solutions: {
        python: `def minReorder(n: int, connections) -> int:\n    adjacency = [[] for _ in range(n)]\n    for a, b in connections:\n        adjacency[a].append((b, 1))\n        adjacency[b].append((a, 0))\n    seen = [False] * n\n    seen[0] = True\n    stack = [0]\n    changes = 0\n    while stack:\n        node = stack.pop()\n        for nxt, away in adjacency[node]:\n            if seen[nxt]:\n                continue\n            seen[nxt] = True\n            changes += away\n            stack.append(nxt)\n    return changes`,
        javascript: `var minReorder = function(n, connections) {\n    const adjacency = [];\n    for (let i = 0; i < n; i++) adjacency.push([]);\n    for (let i = 0; i < connections.length; i++) {\n        adjacency[connections[i][0]].push([connections[i][1], 1]);\n        adjacency[connections[i][1]].push([connections[i][0], 0]);\n    }\n    const seen = [];\n    for (let i = 0; i < n; i++) seen.push(false);\n    seen[0] = true;\n    const stack = [0];\n    let changes = 0;\n    while (stack.length > 0) {\n        const node = stack.pop();\n        for (let i = 0; i < adjacency[node].length; i++) {\n            const next = adjacency[node][i][0];\n            const away = adjacency[node][i][1];\n            if (seen[next]) continue;\n            seen[next] = true;\n            changes += away;\n            stack.push(next);\n        }\n    }\n    return changes;\n};`,
              typescript: `function minReorder(n: number, connections: number[][]): number {\n    var adjacency: number[][][] = [];\n    for (var i = 0; i < n; i++) adjacency.push([]);\n    for (var j = 0; j < connections.length; j++) {\n        adjacency[connections[j][0]].push([connections[j][1], 1]);\n        adjacency[connections[j][1]].push([connections[j][0], 0]);\n    }\n    var seen: boolean[] = [];\n    for (var k = 0; k < n; k++) seen.push(false);\n    seen[0] = true;\n    var stack: number[] = [0];\n    var changes = 0;\n    while (stack.length > 0) {\n        var node = stack.pop() as number;\n        for (var m = 0; m < adjacency[node].length; m++) {\n            var next = adjacency[node][m][0];\n            var away = adjacency[node][m][1];\n            if (seen[next]) continue;\n            seen[next] = true;\n            changes += away;\n            stack.push(next);\n        }\n    }\n    return changes;\n}`,
              java: `public static int minReorder(int n, int[][] connections) {\n    List<List<int[]>> adjacency = new ArrayList<>();\n    for (int i = 0; i < n; i++) adjacency.add(new ArrayList<>());\n    for (int[] e : connections) {\n        adjacency.get(e[0]).add(new int[]{e[1], 1});\n        adjacency.get(e[1]).add(new int[]{e[0], 0});\n    }\n    boolean[] seen = new boolean[n];\n    seen[0] = true;\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(0);\n    int changes = 0;\n    while (!stack.isEmpty()) {\n        int node = stack.pop();\n        for (int[] entry : adjacency.get(node)) {\n            if (seen[entry[0]]) continue;\n            seen[entry[0]] = true;\n            changes += entry[1];\n            stack.push(entry[0]);\n        }\n    }\n    return changes;\n}`,
              cpp: `int minReorder(int n, vector<vector<int>>& connections) {\n    vector<vector<pair<int,int>>> adjacency(n);\n    for (const auto& e : connections) {\n        adjacency[e[0]].push_back(make_pair(e[1], 1));\n        adjacency[e[1]].push_back(make_pair(e[0], 0));\n    }\n    vector<bool> seen(n, false);\n    seen[0] = true;\n    vector<int> stack;\n    stack.push_back(0);\n    int changes = 0;\n    while (!stack.empty()) {\n        int node = stack.back();\n        stack.pop_back();\n        for (const auto& entry : adjacency[node]) {\n            if (seen[entry.first]) continue;\n            seen[entry.first] = true;\n            changes += entry.second;\n            stack.push_back(entry.first);\n        }\n    }\n    return changes;\n}`,
              c: `int minReorder(int n, int** connections, int connectionsSize, int* connectionsColSize) {\n    int* degree = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < connectionsSize; i++) {\n        degree[connections[i][0]]++;\n        degree[connections[i][1]]++;\n    }\n    int* offset = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) offset[i + 1] = offset[i] + degree[i];\n    int* fill = (int*) calloc((size_t) n, sizeof(int));\n    int total = 2 * connectionsSize > 0 ? 2 * connectionsSize : 1;\n    int* targets = (int*) malloc((size_t) total * sizeof(int));\n    int* away = (int*) malloc((size_t) total * sizeof(int));\n    for (int i = 0; i < connectionsSize; i++) {\n        int a = connections[i][0], b = connections[i][1];\n        targets[offset[a] + fill[a]] = b;\n        away[offset[a] + fill[a]] = 1;\n        fill[a]++;\n        targets[offset[b] + fill[b]] = a;\n        away[offset[b] + fill[b]] = 0;\n        fill[b]++;\n    }\n    char* seen = (char*) calloc((size_t) n, sizeof(char));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    int top = 0;\n    seen[0] = 1;\n    stack[top++] = 0;\n    int changes = 0;\n    while (top > 0) {\n        int node = stack[--top];\n        for (int k = offset[node]; k < offset[node + 1]; k++) {\n            int next = targets[k];\n            if (seen[next]) continue;\n            seen[next] = 1;\n            changes += away[k];\n            stack[top++] = next;\n        }\n    }\n    free(degree);\n    free(offset);\n    free(fill);\n    free(targets);\n    free(away);\n    free(seen);\n    free(stack);\n    return changes;\n}`,
              csharp: `public static int MinReorder(int n, int[][] connections)\n{\n    var adjacency = new List<List<int[]>>();\n    for (int i = 0; i < n; i++) adjacency.Add(new List<int[]>());\n    foreach (int[] e in connections)\n    {\n        adjacency[e[0]].Add(new int[] { e[1], 1 });\n        adjacency[e[1]].Add(new int[] { e[0], 0 });\n    }\n    bool[] seen = new bool[n];\n    seen[0] = true;\n    var stack = new List<int>();\n    stack.Add(0);\n    int changes = 0;\n    while (stack.Count > 0)\n    {\n        int node = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        foreach (int[] entry in adjacency[node])\n        {\n            if (seen[entry[0]]) continue;\n            seen[entry[0]] = true;\n            changes += entry[1];\n            stack.Add(entry[0]);\n        }\n    }\n    return changes;\n}`,
              go: `func minReorder(n int, connections [][]int) int {\n	adjacency := make([][][2]int, n)\n	for _, e := range connections {\n		adjacency[e[0]] = append(adjacency[e[0]], [2]int{e[1], 1})\n		adjacency[e[1]] = append(adjacency[e[1]], [2]int{e[0], 0})\n	}\n	seen := make([]bool, n)\n	seen[0] = true\n	stack := []int{0}\n	changes := 0\n	for len(stack) > 0 {\n		node := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		for _, entry := range adjacency[node] {\n			if seen[entry[0]] {\n				continue\n			}\n			seen[entry[0]] = true\n			changes += entry[1]\n			stack = append(stack, entry[0])\n		}\n	}\n	return changes\n}`,
              kotlin: `fun minReorder(n: Int, connections: Array<IntArray>): Int {\n    val adjacency = Array(n) { ArrayList<IntArray>() }\n    for (e in connections) {\n        adjacency[e[0]].add(intArrayOf(e[1], 1))\n        adjacency[e[1]].add(intArrayOf(e[0], 0))\n    }\n    val seen = BooleanArray(n)\n    seen[0] = true\n    val stack = ArrayList<Int>()\n    stack.add(0)\n    var changes = 0\n    while (stack.isNotEmpty()) {\n        val node = stack.removeAt(stack.size - 1)\n        for (entry in adjacency[node]) {\n            if (seen[entry[0]]) continue\n            seen[entry[0]] = true\n            changes += entry[1]\n            stack.add(entry[0])\n        }\n    }\n    return changes\n}`,
              swift: `func minReorder(_ n: Int, _ connections: [[Int]]) -> Int {\n    var adjacency = [[[Int]]](repeating: [], count: n)\n    for e in connections {\n        adjacency[e[0]].append([e[1], 1])\n        adjacency[e[1]].append([e[0], 0])\n    }\n    var seen = [Bool](repeating: false, count: n)\n    seen[0] = true\n    var stack = [0]\n    var changes = 0\n    while let node = stack.popLast() {\n        for entry in adjacency[node] {\n            if seen[entry[0]] { continue }\n            seen[entry[0]] = true\n            changes += entry[1]\n            stack.append(entry[0])\n        }\n    }\n    return changes\n}`,
              rust: `fn minReorder(n: i32, connections: Vec<Vec<i32>>) -> i32 {\n    let size = n as usize;\n    let mut adjacency: Vec<Vec<(usize, i32)>> = vec![Vec::new(); size];\n    for e in connections.iter() {\n        let (a, b) = (e[0] as usize, e[1] as usize);\n        adjacency[a].push((b, 1));\n        adjacency[b].push((a, 0));\n    }\n    let mut seen = vec![false; size];\n    seen[0] = true;\n    let mut stack: Vec<usize> = vec![0];\n    let mut changes = 0;\n    while let Some(node) = stack.pop() {\n        for (next, away) in adjacency[node].clone().iter() {\n            if seen[*next] {\n                continue;\n            }\n            seen[*next] = true;\n            changes += *away;\n            stack.push(*next);\n        }\n    }\n    changes\n}`,
              php: `function minReorder($n, $connections) {\n    $adjacency = array();\n    for ($i = 0; $i < $n; $i++) $adjacency[] = array();\n    foreach ($connections as $e) {\n        $adjacency[$e[0]][] = array($e[1], 1);\n        $adjacency[$e[1]][] = array($e[0], 0);\n    }\n    $seen = array_fill(0, $n, false);\n    $seen[0] = true;\n    $stack = array(0);\n    $changes = 0;\n    while (count($stack) > 0) {\n        $node = array_pop($stack);\n        foreach ($adjacency[$node] as $entry) {\n            if ($seen[$entry[0]]) continue;\n            $seen[$entry[0]] = true;\n            $changes += $entry[1];\n            $stack[] = $entry[0];\n        }\n    }\n    return $changes;\n}`,
              ruby: `def minReorder(n, connections)\n  adjacency = Array.new(n) { [] }\n  connections.each do |e|\n    adjacency[e[0]].push([e[1], 1])\n    adjacency[e[1]].push([e[0], 0])\n  end\n  seen = Array.new(n, false)\n  seen[0] = true\n  stack = [0]\n  changes = 0\n  while !stack.empty?\n    node = stack.pop\n    adjacency[node].each do |entry|\n      next if seen[entry[0]]\n      seen[entry[0]] = true\n      changes += entry[1]\n      stack.push(entry[0])\n    end\n  end\n  changes\nend`,
      },
    };
  })(),

  // ── Time Needed to Inform All Employees ─────────────────────────
  (() => {
    const ref = (n: number, headID: number, manager: number[], informTime: number[]) => {
      const children: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        if (manager[i] !== -1) children[manager[i]].push(i);
      }
      let best = 0;
      const stack: number[][] = [[headID, 0]];
      while (stack.length > 0) {
        const entry = stack.pop() as number[];
        const node = entry[0];
        const elapsed = entry[1];
        if (elapsed > best) best = elapsed;
        for (let i = 0; i < children[node].length; i++) {
          stack.push([children[node][i], elapsed + informTime[node]]);
        }
      }
      return best;
    };
    return {
      slug: "time-needed-to-inform-all-employees",
      title: "Time Needed to Inform All Employees",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "numOfMinutes",
        params: [
          { name: "n", type: "int" as const },
          { name: "headID", type: "int" as const },
          { name: "manager", type: "int[]" as const },
          { name: "informTime", type: "int[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A company has `n` employees with unique ids `0` through `n - 1`. The head has id `headID`, and `manager[i]` is the direct manager of employee `i` (the head's entry is `-1`). Employee `i` needs `informTime[i]` minutes to pass news to **all** of their direct subordinates, who then start informing theirs.\n\nReturn the number of minutes until every employee has been informed.",
        [
          { in: "n = 1, headID = 0, manager = [-1], informTime = [0]", out: "0" },
          { in: "n = 6, headID = 2, manager = [2,2,-1,2,2,2], informTime = [0,0,1,0,0,0]", out: "1" },
          { in: "n = 4, headID = 2, manager = [3,3,-1,2], informTime = [0,0,162,914]", out: "1076" },
        ],
        ["1 <= n <= 40", "0 <= headID < n", "manager[headID] == -1 and the structure is a tree.", "0 <= informTime[i] <= 1000"]),
      hints: [
        "Invert `manager` into a children list so you can walk down the hierarchy.",
        "Depth-first search from the head, carrying the elapsed time on the path so far.",
        "The answer is the largest elapsed time reached at any employee.",
      ],
      examples: [
        { input: "1\n0\n[-1]\n[0]", expectedOutput: "0" },
        { input: "6\n2\n[2,2,-1,2,2,2]\n[0,0,1,0,0,0]", expectedOutput: "1" },
        { input: "4\n2\n[3,3,-1,2]\n[0,0,162,914]", expectedOutput: "1076" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const headID = order[0];
        const manager: number[] = [];
        for (let i = 0; i < n; i++) manager.push(-1);
        for (let i = 1; i < n; i++) manager[order[i]] = order[ri(rng, 0, i - 1)];
        const informTime = randArr(rng, n, 0, 1000);
        // A leaf's inform time never matters, but the real input still lists it.
        return {
          input: `${n}\n${headID}\n${fmtIntArr(manager)}\n${fmtIntArr(informTime)}`,
          expectedOutput: String(ref(n, headID, manager, informTime)),
        };
      },
      solutions: {
        python: `def numOfMinutes(n: int, headID: int, manager, informTime) -> int:\n    children = [[] for _ in range(n)]\n    for i in range(n):\n        if manager[i] != -1:\n            children[manager[i]].append(i)\n    best = 0\n    stack = [(headID, 0)]\n    while stack:\n        node, elapsed = stack.pop()\n        best = max(best, elapsed)\n        for child in children[node]:\n            stack.append((child, elapsed + informTime[node]))\n    return best`,
        javascript: `var numOfMinutes = function(n, headID, manager, informTime) {\n    const children = [];\n    for (let i = 0; i < n; i++) children.push([]);\n    for (let i = 0; i < n; i++) {\n        if (manager[i] !== -1) children[manager[i]].push(i);\n    }\n    let best = 0;\n    const stack = [[headID, 0]];\n    while (stack.length > 0) {\n        const entry = stack.pop();\n        const node = entry[0], elapsed = entry[1];\n        if (elapsed > best) best = elapsed;\n        for (let i = 0; i < children[node].length; i++) {\n            stack.push([children[node][i], elapsed + informTime[node]]);\n        }\n    }\n    return best;\n};`,
              typescript: `function numOfMinutes(n: number, headID: number, manager: number[], informTime: number[]): number {\n    var children: number[][] = [];\n    for (var i = 0; i < n; i++) children.push([]);\n    for (var j = 0; j < n; j++) {\n        if (manager[j] !== -1) children[manager[j]].push(j);\n    }\n    var best = 0;\n    var stack: number[][] = [[headID, 0]];\n    while (stack.length > 0) {\n        var entry = stack.pop() as number[];\n        var node = entry[0];\n        var elapsed = entry[1];\n        if (elapsed > best) best = elapsed;\n        for (var k = 0; k < children[node].length; k++) {\n            stack.push([children[node][k], elapsed + informTime[node]]);\n        }\n    }\n    return best;\n}`,
              java: `public static int numOfMinutes(int n, int headID, int[] manager, int[] informTime) {\n    List<List<Integer>> children = new ArrayList<>();\n    for (int i = 0; i < n; i++) children.add(new ArrayList<>());\n    for (int i = 0; i < n; i++) {\n        if (manager[i] != -1) children.get(manager[i]).add(i);\n    }\n    int best = 0;\n    Deque<int[]> stack = new ArrayDeque<>();\n    stack.push(new int[]{headID, 0});\n    while (!stack.isEmpty()) {\n        int[] entry = stack.pop();\n        best = Math.max(best, entry[1]);\n        for (int child : children.get(entry[0])) {\n            stack.push(new int[]{child, entry[1] + informTime[entry[0]]});\n        }\n    }\n    return best;\n}`,
              cpp: `int numOfMinutes(int n, int headID, vector<int>& manager, vector<int>& informTime) {\n    vector<vector<int>> children(n);\n    for (int i = 0; i < n; i++) {\n        if (manager[i] != -1) children[manager[i]].push_back(i);\n    }\n    int best = 0;\n    vector<pair<int,int>> stack;\n    stack.push_back(make_pair(headID, 0));\n    while (!stack.empty()) {\n        pair<int,int> entry = stack.back();\n        stack.pop_back();\n        best = max(best, entry.second);\n        for (int child : children[entry.first]) {\n            stack.push_back(make_pair(child, entry.second + informTime[entry.first]));\n        }\n    }\n    return best;\n}`,
              c: `int numOfMinutes(int n, int headID, int* manager, int managerSize, int* informTime, int informTimeSize) {\n    int* degree = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) {\n        if (manager[i] != -1) degree[manager[i]]++;\n    }\n    int* offset = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) offset[i + 1] = offset[i] + degree[i];\n    int* fill = (int*) calloc((size_t) n, sizeof(int));\n    int* flat = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        if (manager[i] != -1) {\n            int m = manager[i];\n            flat[offset[m] + fill[m]++] = i;\n        }\n    }\n    int* stackNode = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int* stackTime = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int top = 0;\n    stackNode[top] = headID;\n    stackTime[top] = 0;\n    top++;\n    int best = 0;\n    while (top > 0) {\n        top--;\n        int node = stackNode[top];\n        int elapsed = stackTime[top];\n        if (elapsed > best) best = elapsed;\n        for (int k = offset[node]; k < offset[node + 1]; k++) {\n            stackNode[top] = flat[k];\n            stackTime[top] = elapsed + informTime[node];\n            top++;\n        }\n    }\n    free(degree);\n    free(offset);\n    free(fill);\n    free(flat);\n    free(stackNode);\n    free(stackTime);\n    return best;\n}`,
              csharp: `public static int NumOfMinutes(int n, int headID, int[] manager, int[] informTime)\n{\n    var children = new List<List<int>>();\n    for (int i = 0; i < n; i++) children.Add(new List<int>());\n    for (int i = 0; i < n; i++)\n    {\n        if (manager[i] != -1) children[manager[i]].Add(i);\n    }\n    int best = 0;\n    var stack = new List<int[]>();\n    stack.Add(new int[] { headID, 0 });\n    while (stack.Count > 0)\n    {\n        int[] entry = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        best = Math.Max(best, entry[1]);\n        foreach (int child in children[entry[0]])\n        {\n            stack.Add(new int[] { child, entry[1] + informTime[entry[0]] });\n        }\n    }\n    return best;\n}`,
              go: `func numOfMinutes(n int, headID int, manager []int, informTime []int) int {\n	children := make([][]int, n)\n	for i := 0; i < n; i++ {\n		if manager[i] != -1 {\n			children[manager[i]] = append(children[manager[i]], i)\n		}\n	}\n	best := 0\n	stack := [][2]int{{headID, 0}}\n	for len(stack) > 0 {\n		entry := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		if entry[1] > best {\n			best = entry[1]\n		}\n		for _, child := range children[entry[0]] {\n			stack = append(stack, [2]int{child, entry[1] + informTime[entry[0]]})\n		}\n	}\n	return best\n}`,
              kotlin: `fun numOfMinutes(n: Int, headID: Int, manager: IntArray, informTime: IntArray): Int {\n    val children = Array(n) { ArrayList<Int>() }\n    for (i in 0 until n) {\n        if (manager[i] != -1) children[manager[i]].add(i)\n    }\n    var best = 0\n    val stack = ArrayList<IntArray>()\n    stack.add(intArrayOf(headID, 0))\n    while (stack.isNotEmpty()) {\n        val entry = stack.removeAt(stack.size - 1)\n        if (entry[1] > best) best = entry[1]\n        for (child in children[entry[0]]) {\n            stack.add(intArrayOf(child, entry[1] + informTime[entry[0]]))\n        }\n    }\n    return best\n}`,
              swift: `func numOfMinutes(_ n: Int, _ headID: Int, _ manager: [Int], _ informTime: [Int]) -> Int {\n    var children = [[Int]](repeating: [], count: n)\n    for i in 0..<n where manager[i] != -1 {\n        children[manager[i]].append(i)\n    }\n    var best = 0\n    var stack: [[Int]] = [[headID, 0]]\n    while let entry = stack.popLast() {\n        if entry[1] > best { best = entry[1] }\n        for child in children[entry[0]] {\n            stack.append([child, entry[1] + informTime[entry[0]]])\n        }\n    }\n    return best\n}`,
              rust: `fn numOfMinutes(n: i32, headID: i32, manager: Vec<i32>, informTime: Vec<i32>) -> i32 {\n    let size = n as usize;\n    let mut children: Vec<Vec<usize>> = vec![Vec::new(); size];\n    for i in 0..size {\n        if manager[i] != -1 {\n            children[manager[i] as usize].push(i);\n        }\n    }\n    let mut best = 0i32;\n    let mut stack: Vec<(usize, i32)> = vec![(headID as usize, 0)];\n    while let Some((node, elapsed)) = stack.pop() {\n        if elapsed > best {\n            best = elapsed;\n        }\n        for child in children[node].clone().iter() {\n            stack.push((*child, elapsed + informTime[node]));\n        }\n    }\n    best\n}`,
              php: `function numOfMinutes($n, $headID, $manager, $informTime) {\n    $children = array();\n    for ($i = 0; $i < $n; $i++) $children[] = array();\n    for ($i = 0; $i < $n; $i++) {\n        if ($manager[$i] !== -1) $children[$manager[$i]][] = $i;\n    }\n    $best = 0;\n    $stack = array(array($headID, 0));\n    while (count($stack) > 0) {\n        $entry = array_pop($stack);\n        if ($entry[1] > $best) $best = $entry[1];\n        foreach ($children[$entry[0]] as $child) {\n            $stack[] = array($child, $entry[1] + $informTime[$entry[0]]);\n        }\n    }\n    return $best;\n}`,
              ruby: `def numOfMinutes(n, headID, manager, informTime)\n  children = Array.new(n) { [] }\n  (0...n).each do |i|\n    children[manager[i]].push(i) if manager[i] != -1\n  end\n  best = 0\n  stack = [[headID, 0]]\n  while !stack.empty?\n    entry = stack.pop\n    best = entry[1] if entry[1] > best\n    children[entry[0]].each do |child|\n      stack.push([child, entry[1] + informTime[entry[0]]])\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Path With Minimum Effort ────────────────────────────────────
  (() => {
    const ref = (heights: number[][]) => {
      const rows = heights.length;
      const cols = heights[0].length;
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      const reachable = (limit: number) => {
        const seen: boolean[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: boolean[] = [];
          for (let c = 0; c < cols; c++) row.push(false);
          seen.push(row);
        }
        seen[0][0] = true;
        const stack: number[][] = [[0, 0]];
        while (stack.length > 0) {
          const cell = stack.pop() as number[];
          if (cell[0] === rows - 1 && cell[1] === cols - 1) return true;
          for (let d = 0; d < 4; d++) {
            const nr = cell[0] + dr[d];
            const nc = cell[1] + dc[d];
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;
            const diff = Math.abs(heights[nr][nc] - heights[cell[0]][cell[1]]);
            if (diff > limit) continue;
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
        return seen[rows - 1][cols - 1];
      };
      let lo = 0;
      let hi = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (heights[r][c] > hi) hi = heights[r][c];
        }
      }
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (reachable(mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "path-with-minimum-effort",
      title: "Path With Minimum Effort",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Depth-First Search", "Breadth-First Search", "Union Find", "Heap", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minimumEffortPath", params: [{ name: "heights", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are hiking across a terrain grid `heights`, starting at the top-left cell and aiming for the bottom-right cell, moving up, down, left or right.\n\nA route's **effort** is the maximum absolute height difference between two consecutive cells on it. Return the minimum effort of any route.",
        [
          { in: "heights = [[1,2,2],[3,8,2],[5,3,5]]", out: "2" },
          { in: "heights = [[1,2,3],[3,8,4],[5,3,5]]", out: "1" },
          { in: "heights = [[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]]", out: "0" },
        ],
        ["1 <= heights.length, heights[i].length <= 12", "1 <= heights[i][j] <= 1000000"],
        "Binary search on the answer gives O(mn log C). A Dijkstra variant reaches the same bound without the search."),
      hints: [
        "Ask a simpler question first: given a limit, is the destination reachable using only steps within it?",
        "That is a plain flood fill, so binary search the limit.",
        "Alternatively, run Dijkstra where a path's cost is the maximum edge rather than the sum.",
      ],
      examples: [
        { input: "[[1,2,2],[3,8,2],[5,3,5]]", expectedOutput: "2" },
        { input: "[[1,2,3],[3,8,4],[5,3,5]]", expectedOutput: "1" },
        { input: "[[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 12);
        const cols = ri(rng, 1, 12);
        const hi = rng() < 0.6 ? 10 : 1000000;
        const heights = randGrid(rng, rows, cols, 1, hi);
        return { input: fmtIntMat(heights), expectedOutput: String(ref(heights)) };
      },
      solutions: {
        python: `def minimumEffortPath(heights) -> int:\n    rows, cols = len(heights), len(heights[0])\n\n    def reachable(limit):\n        seen = [[False] * cols for _ in range(rows)]\n        seen[0][0] = True\n        stack = [(0, 0)]\n        while stack:\n            r, c = stack.pop()\n            if r == rows - 1 and c == cols - 1:\n                return True\n            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n                if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc]:\n                    if abs(heights[nr][nc] - heights[r][c]) <= limit:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n        return seen[rows - 1][cols - 1]\n\n    lo, hi = 0, max(max(row) for row in heights)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if reachable(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minimumEffortPath = function(heights) {\n    const rows = heights.length, cols = heights[0].length;\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    const reachable = function(limit) {\n        const seen = [];\n        for (let r = 0; r < rows; r++) {\n            const row = [];\n            for (let c = 0; c < cols; c++) row.push(false);\n            seen.push(row);\n        }\n        seen[0][0] = true;\n        const stack = [[0, 0]];\n        while (stack.length > 0) {\n            const cell = stack.pop();\n            if (cell[0] === rows - 1 && cell[1] === cols - 1) return true;\n            for (let d = 0; d < 4; d++) {\n                const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n                const diff = Math.abs(heights[nr][nc] - heights[cell[0]][cell[1]]);\n                if (diff > limit) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen[rows - 1][cols - 1];\n    };\n    let lo = 0, hi = 0;\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (heights[r][c] > hi) hi = heights[r][c];\n        }\n    }\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (reachable(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
              typescript: `function minimumEffortPath(heights: number[][]): number {\n    var rows = heights.length;\n    var cols = heights[0].length;\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var reachable = function (limit: number): boolean {\n        var seen: boolean[][] = [];\n        for (var r = 0; r < rows; r++) {\n            var row: boolean[] = [];\n            for (var c = 0; c < cols; c++) row.push(false);\n            seen.push(row);\n        }\n        seen[0][0] = true;\n        var stack: number[][] = [[0, 0]];\n        while (stack.length > 0) {\n            var cell = stack.pop() as number[];\n            if (cell[0] === rows - 1 && cell[1] === cols - 1) return true;\n            for (var d = 0; d < 4; d++) {\n                var nr = cell[0] + dr[d];\n                var nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n                var diff = Math.abs(heights[nr][nc] - heights[cell[0]][cell[1]]);\n                if (diff > limit) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen[rows - 1][cols - 1];\n    };\n    var lo = 0;\n    var hi = 0;\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            if (heights[r2][c2] > hi) hi = heights[r2][c2];\n        }\n    }\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (reachable(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              java: `private static boolean effortReachable(int[][] heights, int limit) {\n    int rows = heights.length, cols = heights[0].length;\n    boolean[][] seen = new boolean[rows][cols];\n    seen[0][0] = true;\n    Deque<int[]> stack = new ArrayDeque<>();\n    stack.push(new int[]{0, 0});\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        if (cell[0] == rows - 1 && cell[1] == cols - 1) return true;\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n            if (Math.abs(heights[nr][nc] - heights[cell[0]][cell[1]]) > limit) continue;\n            seen[nr][nc] = true;\n            stack.push(new int[]{nr, nc});\n        }\n    }\n    return seen[rows - 1][cols - 1];\n}\n\npublic static int minimumEffortPath(int[][] heights) {\n    int lo = 0, hi = 0;\n    for (int[] row : heights) {\n        for (int value : row) hi = Math.max(hi, value);\n    }\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (effortReachable(heights, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              cpp: `static bool effortReachable(vector<vector<int>>& heights, int limit) {\n    int rows = (int) heights.size(), cols = (int) heights[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    seen[0][0] = true;\n    vector<pair<int,int>> stack;\n    stack.push_back(make_pair(0, 0));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (!stack.empty()) {\n        pair<int,int> cell = stack.back();\n        stack.pop_back();\n        if (cell.first == rows - 1 && cell.second == cols - 1) return true;\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n            if (abs(heights[nr][nc] - heights[cell.first][cell.second]) > limit) continue;\n            seen[nr][nc] = true;\n            stack.push_back(make_pair(nr, nc));\n        }\n    }\n    return seen[rows - 1][cols - 1];\n}\n\nint minimumEffortPath(vector<vector<int>>& heights) {\n    int lo = 0, hi = 0;\n    for (const auto& row : heights) {\n        for (int value : row) hi = max(hi, value);\n    }\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (effortReachable(heights, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              c: `static int effortReachable(int** heights, int rows, int cols, int limit, char* seen, int* stack) {\n    for (int i = 0; i < rows * cols; i++) seen[i] = 0;\n    seen[0] = 1;\n    int top = 0;\n    stack[top++] = 0;\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (top > 0) {\n        int cell = stack[--top];\n        int cr = cell / cols, cc = cell % cols;\n        if (cr == rows - 1 && cc == cols - 1) return 1;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr * cols + nc]) continue;\n            int diff = heights[nr][nc] - heights[cr][cc];\n            if (diff < 0) diff = -diff;\n            if (diff > limit) continue;\n            seen[nr * cols + nc] = 1;\n            stack[top++] = nr * cols + nc;\n        }\n    }\n    return seen[(rows - 1) * cols + (cols - 1)];\n}\n\nint minimumEffortPath(int** heights, int heightsSize, int* heightsColSize) {\n    int rows = heightsSize, cols = heightsColSize[0];\n    char* seen = (char*) malloc((size_t) (rows * cols));\n    int* stack = (int*) malloc((size_t) (rows * cols) * sizeof(int));\n    int lo = 0, hi = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (heights[r][c] > hi) hi = heights[r][c];\n        }\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (effortReachable(heights, rows, cols, mid, seen, stack)) hi = mid;\n        else lo = mid + 1;\n    }\n    free(seen);\n    free(stack);\n    return lo;\n}`,
              csharp: `private static bool EffortReachable(int[][] heights, int limit)\n{\n    int rows = heights.Length, cols = heights[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    seen[0, 0] = true;\n    var stack = new List<int[]>();\n    stack.Add(new int[] { 0, 0 });\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (stack.Count > 0)\n    {\n        int[] cell = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        if (cell[0] == rows - 1 && cell[1] == cols - 1) return true;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr, nc]) continue;\n            if (Math.Abs(heights[nr][nc] - heights[cell[0]][cell[1]]) > limit) continue;\n            seen[nr, nc] = true;\n            stack.Add(new int[] { nr, nc });\n        }\n    }\n    return seen[rows - 1, cols - 1];\n}\n\npublic static int MinimumEffortPath(int[][] heights)\n{\n    int lo = 0, hi = 0;\n    foreach (int[] row in heights)\n    {\n        foreach (int value in row) hi = Math.Max(hi, value);\n    }\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (EffortReachable(heights, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              go: `func effortReachable(heights [][]int, limit int) bool {\n	rows, cols := len(heights), len(heights[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	seen[0][0] = true\n	stack := [][2]int{{0, 0}}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		if cell[0] == rows-1 && cell[1] == cols-1 {\n			return true\n		}\n		for d := 0; d < 4; d++ {\n			nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] {\n				continue\n			}\n			diff := heights[nr][nc] - heights[cell[0]][cell[1]]\n			if diff < 0 {\n				diff = -diff\n			}\n			if diff > limit {\n				continue\n			}\n			seen[nr][nc] = true\n			stack = append(stack, [2]int{nr, nc})\n		}\n	}\n	return seen[rows-1][cols-1]\n}\n\nfunc minimumEffortPath(heights [][]int) int {\n	lo, hi := 0, 0\n	for _, row := range heights {\n		for _, value := range row {\n			if value > hi {\n				hi = value\n			}\n		}\n	}\n	for lo < hi {\n		mid := (lo + hi) / 2\n		if effortReachable(heights, mid) {\n			hi = mid\n		} else {\n			lo = mid + 1\n		}\n	}\n	return lo\n}`,
              kotlin: `fun effortReachable(heights: Array<IntArray>, limit: Int): Boolean {\n    val rows = heights.size\n    val cols = heights[0].size\n    val seen = Array(rows) { BooleanArray(cols) }\n    seen[0][0] = true\n    val stack = ArrayList<IntArray>()\n    stack.add(intArrayOf(0, 0))\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    while (stack.isNotEmpty()) {\n        val cell = stack.removeAt(stack.size - 1)\n        if (cell[0] == rows - 1 && cell[1] == cols - 1) return true\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue\n            if (Math.abs(heights[nr][nc] - heights[cell[0]][cell[1]]) > limit) continue\n            seen[nr][nc] = true\n            stack.add(intArrayOf(nr, nc))\n        }\n    }\n    return seen[rows - 1][cols - 1]\n}\n\nfun minimumEffortPath(heights: Array<IntArray>): Int {\n    var lo = 0\n    var hi = 0\n    for (row in heights) {\n        for (value in row) {\n            if (value > hi) hi = value\n        }\n    }\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (effortReachable(heights, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
              swift: `func effortReachable(_ heights: [[Int]], _ limit: Int) -> Bool {\n    let rows = heights.count\n    let cols = heights[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    seen[0][0] = true\n    var stack: [[Int]] = [[0, 0]]\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    while let cell = stack.popLast() {\n        if cell[0] == rows - 1 && cell[1] == cols - 1 { return true }\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] { continue }\n            if abs(heights[nr][nc] - heights[cell[0]][cell[1]]) > limit { continue }\n            seen[nr][nc] = true\n            stack.append([nr, nc])\n        }\n    }\n    return seen[rows - 1][cols - 1]\n}\n\nfunc minimumEffortPath(_ heights: [[Int]]) -> Int {\n    var lo = 0\n    var hi = 0\n    for row in heights {\n        for value in row where value > hi { hi = value }\n    }\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if effortReachable(heights, mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
              rust: `fn effort_reachable(heights: &Vec<Vec<i32>>, limit: i32) -> bool {\n    let rows = heights.len();\n    let cols = heights[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    seen[0][0] = true;\n    let mut stack: Vec<(usize, usize)> = vec![(0, 0)];\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    while let Some((cr, cc)) = stack.pop() {\n        if cr == rows - 1 && cc == cols - 1 {\n            return true;\n        }\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if seen[nru][ncu] {\n                continue;\n            }\n            if (heights[nru][ncu] - heights[cr][cc]).abs() > limit {\n                continue;\n            }\n            seen[nru][ncu] = true;\n            stack.push((nru, ncu));\n        }\n    }\n    seen[rows - 1][cols - 1]\n}\n\nfn minimumEffortPath(heights: Vec<Vec<i32>>) -> i32 {\n    let mut lo = 0i32;\n    let mut hi = 0i32;\n    for row in heights.iter() {\n        for value in row.iter() {\n            if *value > hi {\n                hi = *value;\n            }\n        }\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if effort_reachable(&heights, mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
              php: `function effortReachable($heights, $limit) {\n    $rows = count($heights);\n    $cols = count($heights[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $seen[0][0] = true;\n    $stack = array(array(0, 0));\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        if ($cell[0] === $rows - 1 && $cell[1] === $cols - 1) return true;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols || $seen[$nr][$nc]) continue;\n            if (abs($heights[$nr][$nc] - $heights[$cell[0]][$cell[1]]) > $limit) continue;\n            $seen[$nr][$nc] = true;\n            $stack[] = array($nr, $nc);\n        }\n    }\n    return $seen[$rows - 1][$cols - 1];\n}\n\nfunction minimumEffortPath($heights) {\n    $lo = 0;\n    $hi = 0;\n    foreach ($heights as $row) {\n        foreach ($row as $value) {\n            if ($value > $hi) $hi = $value;\n        }\n    }\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if (effortReachable($heights, $mid)) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
              ruby: `def effort_reachable(heights, limit)\n  rows = heights.length\n  cols = heights[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  seen[0][0] = true\n  stack = [[0, 0]]\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  while !stack.empty?\n    cell = stack.pop\n    return true if cell[0] == rows - 1 && cell[1] == cols - 1\n    (0...4).each do |d|\n      nr = cell[0] + dr[d]\n      nc = cell[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]\n      next if (heights[nr][nc] - heights[cell[0]][cell[1]]).abs > limit\n      seen[nr][nc] = true\n      stack.push([nr, nc])\n    end\n  end\n  seen[rows - 1][cols - 1]\nend\n\ndef minimumEffortPath(heights)\n  lo = 0\n  hi = heights.map { |row| row.max }.max\n  while lo < hi\n    mid = (lo + hi) / 2\n    if effort_reachable(heights, mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Maximal Network Rank ────────────────────────────────────────
  (() => {
    const ref = (n: number, roads: number[][]) => {
      const degree: number[] = [];
      for (let i = 0; i < n; i++) degree.push(0);
      const connected = new Set<string>();
      for (let i = 0; i < roads.length; i++) {
        const a = roads[i][0];
        const b = roads[i][1];
        degree[a]++;
        degree[b]++;
        connected.add(a < b ? `${a},${b}` : `${b},${a}`);
      }
      let best = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let rank = degree[i] + degree[j];
          if (connected.has(`${i},${j}`)) rank--;
          if (rank > best) best = rank;
        }
      }
      return best;
    };
    return {
      slug: "maximal-network-rank",
      title: "Maximal Network Rank",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maximalNetworkRank", params: [{ name: "n", type: "int" as const }, { name: "roads", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` cities numbered `0` through `n - 1`, joined by bidirectional `roads`. The **network rank** of two different cities is the number of roads directly connected to either one, where a road linking the two counts only once.\n\nReturn the maximum network rank over all pairs of cities.",
        [
          { in: "n = 4, roads = [[0,1],[0,3],[1,2],[1,3]]", out: "4" },
          { in: "n = 5, roads = [[0,1],[0,3],[1,2],[1,3],[2,3],[2,4]]", out: "5" },
          { in: "n = 2, roads = []", out: "0" },
        ],
        ["2 <= n <= 40", "0 <= roads.length <= 60", "There are no duplicate roads and no self-loops."]),
      hints: [
        "The rank of a pair is `degree[a] + degree[b]`, minus one if they share a road.",
        "Count degrees first and store the road set for O(1) adjacency lookups.",
        "Then try every pair — with these bounds the quadratic scan is plenty fast.",
      ],
      examples: [
        { input: "4\n[[0,1],[0,3],[1,2],[1,3]]", expectedOutput: "4" },
        { input: "5\n[[0,1],[0,3],[1,2],[1,3],[2,3],[2,4]]", expectedOutput: "5" },
        { input: "2\n[]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const roads = randEdges(rng, n, ri(rng, 0, Math.min(60, n * 2)));
        return { input: `${n}\n${fmtIntMat(roads)}`, expectedOutput: String(ref(n, roads)) };
      },
      solutions: {
        python: `def maximalNetworkRank(n: int, roads) -> int:\n    degree = [0] * n\n    connected = set()\n    for a, b in roads:\n        degree[a] += 1\n        degree[b] += 1\n        connected.add((min(a, b), max(a, b)))\n    best = 0\n    for i in range(n):\n        for j in range(i + 1, n):\n            rank = degree[i] + degree[j]\n            if (i, j) in connected:\n                rank -= 1\n            best = max(best, rank)\n    return best`,
        javascript: `var maximalNetworkRank = function(n, roads) {\n    const degree = [];\n    for (let i = 0; i < n; i++) degree.push(0);\n    const connected = new Set();\n    for (let i = 0; i < roads.length; i++) {\n        const a = roads[i][0], b = roads[i][1];\n        degree[a]++;\n        degree[b]++;\n        connected.add(a < b ? a + "," + b : b + "," + a);\n    }\n    let best = 0;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            let rank = degree[i] + degree[j];\n            if (connected.has(i + "," + j)) rank--;\n            if (rank > best) best = rank;\n        }\n    }\n    return best;\n};`,
              typescript: `function maximalNetworkRank(n: number, roads: number[][]): number {\n    var degree: number[] = [];\n    for (var i = 0; i < n; i++) degree.push(0);\n    var connected: { [key: string]: boolean } = {};\n    for (var j = 0; j < roads.length; j++) {\n        var a = roads[j][0];\n        var b = roads[j][1];\n        degree[a]++;\n        degree[b]++;\n        connected[a < b ? a + "," + b : b + "," + a] = true;\n    }\n    var best = 0;\n    for (var p = 0; p < n; p++) {\n        for (var q = p + 1; q < n; q++) {\n            var rank = degree[p] + degree[q];\n            if (connected[p + "," + q] === true) rank--;\n            if (rank > best) best = rank;\n        }\n    }\n    return best;\n}`,
              java: `public static int maximalNetworkRank(int n, int[][] roads) {\n    int[] degree = new int[n];\n    boolean[][] connected = new boolean[n][n];\n    for (int[] road : roads) {\n        degree[road[0]]++;\n        degree[road[1]]++;\n        connected[road[0]][road[1]] = true;\n        connected[road[1]][road[0]] = true;\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            int rank = degree[i] + degree[j];\n            if (connected[i][j]) rank--;\n            best = Math.max(best, rank);\n        }\n    }\n    return best;\n}`,
              cpp: `int maximalNetworkRank(int n, vector<vector<int>>& roads) {\n    vector<int> degree(n, 0);\n    vector<vector<bool>> connected(n, vector<bool>(n, false));\n    for (const auto& road : roads) {\n        degree[road[0]]++;\n        degree[road[1]]++;\n        connected[road[0]][road[1]] = true;\n        connected[road[1]][road[0]] = true;\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            int rank = degree[i] + degree[j];\n            if (connected[i][j]) rank--;\n            best = max(best, rank);\n        }\n    }\n    return best;\n}`,
              c: `int maximalNetworkRank(int n, int** roads, int roadsSize, int* roadsColSize) {\n    int* degree = (int*) calloc((size_t) n, sizeof(int));\n    char* connected = (char*) calloc((size_t) (n * n), sizeof(char));\n    for (int i = 0; i < roadsSize; i++) {\n        int a = roads[i][0], b = roads[i][1];\n        degree[a]++;\n        degree[b]++;\n        connected[a * n + b] = 1;\n        connected[b * n + a] = 1;\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            int rank = degree[i] + degree[j];\n            if (connected[i * n + j]) rank--;\n            if (rank > best) best = rank;\n        }\n    }\n    free(degree);\n    free(connected);\n    return best;\n}`,
              csharp: `public static int MaximalNetworkRank(int n, int[][] roads)\n{\n    int[] degree = new int[n];\n    bool[,] connected = new bool[n, n];\n    foreach (int[] road in roads)\n    {\n        degree[road[0]]++;\n        degree[road[1]]++;\n        connected[road[0], road[1]] = true;\n        connected[road[1], road[0]] = true;\n    }\n    int best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = i + 1; j < n; j++)\n        {\n            int rank = degree[i] + degree[j];\n            if (connected[i, j]) rank--;\n            best = Math.Max(best, rank);\n        }\n    }\n    return best;\n}`,
              go: `func maximalNetworkRank(n int, roads [][]int) int {\n	degree := make([]int, n)\n	connected := make([][]bool, n)\n	for i := range connected {\n		connected[i] = make([]bool, n)\n	}\n	for _, road := range roads {\n		degree[road[0]]++\n		degree[road[1]]++\n		connected[road[0]][road[1]] = true\n		connected[road[1]][road[0]] = true\n	}\n	best := 0\n	for i := 0; i < n; i++ {\n		for j := i + 1; j < n; j++ {\n			rank := degree[i] + degree[j]\n			if connected[i][j] {\n				rank--\n			}\n			if rank > best {\n				best = rank\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun maximalNetworkRank(n: Int, roads: Array<IntArray>): Int {\n    val degree = IntArray(n)\n    val connected = Array(n) { BooleanArray(n) }\n    for (road in roads) {\n        degree[road[0]]++\n        degree[road[1]]++\n        connected[road[0]][road[1]] = true\n        connected[road[1]][road[0]] = true\n    }\n    var best = 0\n    for (i in 0 until n) {\n        for (j in i + 1 until n) {\n            var rank = degree[i] + degree[j]\n            if (connected[i][j]) rank--\n            if (rank > best) best = rank\n        }\n    }\n    return best\n}`,
              swift: `func maximalNetworkRank(_ n: Int, _ roads: [[Int]]) -> Int {\n    var degree = [Int](repeating: 0, count: n)\n    var connected = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)\n    for road in roads {\n        degree[road[0]] += 1\n        degree[road[1]] += 1\n        connected[road[0]][road[1]] = true\n        connected[road[1]][road[0]] = true\n    }\n    var best = 0\n    for i in 0..<n {\n        for j in (i + 1)..<max(n, i + 1) where j < n {\n            var rank = degree[i] + degree[j]\n            if connected[i][j] { rank -= 1 }\n            if rank > best { best = rank }\n        }\n    }\n    return best\n}`,
              rust: `fn maximalNetworkRank(n: i32, roads: Vec<Vec<i32>>) -> i32 {\n    let size = n as usize;\n    let mut degree = vec![0i32; size];\n    let mut connected = vec![vec![false; size]; size];\n    for road in roads.iter() {\n        let (a, b) = (road[0] as usize, road[1] as usize);\n        degree[a] += 1;\n        degree[b] += 1;\n        connected[a][b] = true;\n        connected[b][a] = true;\n    }\n    let mut best = 0i32;\n    for i in 0..size {\n        for j in (i + 1)..size {\n            let mut rank = degree[i] + degree[j];\n            if connected[i][j] {\n                rank -= 1;\n            }\n            if rank > best {\n                best = rank;\n            }\n        }\n    }\n    best\n}`,
              php: `function maximalNetworkRank($n, $roads) {\n    $degree = array_fill(0, $n, 0);\n    $connected = array();\n    for ($i = 0; $i < $n; $i++) $connected[] = array_fill(0, $n, false);\n    foreach ($roads as $road) {\n        $degree[$road[0]]++;\n        $degree[$road[1]]++;\n        $connected[$road[0]][$road[1]] = true;\n        $connected[$road[1]][$road[0]] = true;\n    }\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i + 1; $j < $n; $j++) {\n            $rank = $degree[$i] + $degree[$j];\n            if ($connected[$i][$j]) $rank--;\n            if ($rank > $best) $best = $rank;\n        }\n    }\n    return $best;\n}`,
              ruby: `def maximalNetworkRank(n, roads)\n  degree = Array.new(n, 0)\n  connected = Array.new(n) { Array.new(n, false) }\n  roads.each do |road|\n    degree[road[0]] += 1\n    degree[road[1]] += 1\n    connected[road[0]][road[1]] = true\n    connected[road[1]][road[0]] = true\n  end\n  best = 0\n  (0...n).each do |i|\n    ((i + 1)...n).each do |j|\n      rank = degree[i] + degree[j]\n      rank -= 1 if connected[i][j]\n      best = rank if rank > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Cycle in a Graph ────────────────────────────────────
  (() => {
    const ref = (edges: number[]) => {
      const n = edges.length;
      const visitedAt: number[] = [];
      for (let i = 0; i < n; i++) visitedAt.push(-1);
      let best = -1;
      let clock = 0;
      for (let i = 0; i < n; i++) {
        if (visitedAt[i] !== -1) continue;
        const walkStart = clock;
        let node = i;
        while (node !== -1 && visitedAt[node] === -1) {
          visitedAt[node] = clock++;
          node = edges[node];
        }
        if (node !== -1 && visitedAt[node] >= walkStart) {
          const length = clock - visitedAt[node];
          if (length > best) best = length;
        }
      }
      return best;
    };
    return {
      slug: "longest-cycle-in-a-graph",
      title: "Longest Cycle in a Graph",
      difficulty: "HARD" as const,
      tags: ["Depth-First Search", "Graph", "Topological Sort", "Amazon", "Google"],
      signature: { funcName: "longestCycle", params: [{ name: "edges", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a directed graph of `n` nodes where **each node has at most one outgoing edge**: `edges[i]` is the node that `i` points to, or `-1` if it points nowhere.\n\nReturn the length of the longest cycle, or `-1` if the graph has no cycle.",
        [
          { in: "edges = [3,3,4,2,3]", out: "3", note: "The cycle 2 → 4 → 3 → 2 has length 3." },
          { in: "edges = [2,-1,3,1]", out: "-1" },
          { in: "edges = [1,0]", out: "2" },
        ],
        ["1 <= edges.length <= 40", "-1 <= edges[i] < edges.length", "edges[i] != i"]),
      hints: [
        "With one outgoing edge per node, following the arrows from any start eventually repeats a node.",
        "Stamp each node with a global visit time as you walk, and stop when you reach something already stamped.",
        "If that node was stamped during the **current** walk, the cycle length is the difference between the current clock and its stamp.",
      ],
      examples: [
        { input: "[3,3,4,2,3]", expectedOutput: "3" },
        { input: "[2,-1,3,1]", expectedOutput: "-1" },
        { input: "[1,0]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const edges: number[] = [];
        for (let i = 0; i < n; i++) {
          if (n === 1 || rng() < 0.25) {
            edges.push(-1);
            continue;
          }
          let target = ri(rng, 0, n - 1);
          while (target === i) target = ri(rng, 0, n - 1);
          edges.push(target);
        }
        return { input: fmtIntArr(edges), expectedOutput: String(ref(edges)) };
      },
      solutions: {
        python: `def longestCycle(edges) -> int:\n    n = len(edges)\n    visited_at = [-1] * n\n    best = -1\n    clock = 0\n    for i in range(n):\n        if visited_at[i] != -1:\n            continue\n        walk_start = clock\n        node = i\n        while node != -1 and visited_at[node] == -1:\n            visited_at[node] = clock\n            clock += 1\n            node = edges[node]\n        if node != -1 and visited_at[node] >= walk_start:\n            best = max(best, clock - visited_at[node])\n    return best`,
        javascript: `var longestCycle = function(edges) {\n    const n = edges.length;\n    const visitedAt = [];\n    for (let i = 0; i < n; i++) visitedAt.push(-1);\n    let best = -1;\n    let clock = 0;\n    for (let i = 0; i < n; i++) {\n        if (visitedAt[i] !== -1) continue;\n        const walkStart = clock;\n        let node = i;\n        while (node !== -1 && visitedAt[node] === -1) {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node !== -1 && visitedAt[node] >= walkStart) {\n            const length = clock - visitedAt[node];\n            if (length > best) best = length;\n        }\n    }\n    return best;\n};`,
              typescript: `function longestCycle(edges: number[]): number {\n    var n = edges.length;\n    var visitedAt: number[] = [];\n    for (var i = 0; i < n; i++) visitedAt.push(-1);\n    var best = -1;\n    var clock = 0;\n    for (var j = 0; j < n; j++) {\n        if (visitedAt[j] !== -1) continue;\n        var walkStart = clock;\n        var node = j;\n        while (node !== -1 && visitedAt[node] === -1) {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node !== -1 && visitedAt[node] >= walkStart) {\n            var length = clock - visitedAt[node];\n            if (length > best) best = length;\n        }\n    }\n    return best;\n}`,
              java: `public static int longestCycle(int[] edges) {\n    int n = edges.length;\n    int[] visitedAt = new int[n];\n    Arrays.fill(visitedAt, -1);\n    int best = -1, clock = 0;\n    for (int i = 0; i < n; i++) {\n        if (visitedAt[i] != -1) continue;\n        int walkStart = clock;\n        int node = i;\n        while (node != -1 && visitedAt[node] == -1) {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node != -1 && visitedAt[node] >= walkStart) {\n            best = Math.max(best, clock - visitedAt[node]);\n        }\n    }\n    return best;\n}`,
              cpp: `int longestCycle(vector<int>& edges) {\n    int n = (int) edges.size();\n    vector<int> visitedAt(n, -1);\n    int best = -1, clock = 0;\n    for (int i = 0; i < n; i++) {\n        if (visitedAt[i] != -1) continue;\n        int walkStart = clock;\n        int node = i;\n        while (node != -1 && visitedAt[node] == -1) {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node != -1 && visitedAt[node] >= walkStart) {\n            best = max(best, clock - visitedAt[node]);\n        }\n    }\n    return best;\n}`,
              c: `int longestCycle(int* edges, int edgesSize) {\n    int n = edgesSize;\n    int* visitedAt = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) visitedAt[i] = -1;\n    int best = -1, clock = 0;\n    for (int i = 0; i < n; i++) {\n        if (visitedAt[i] != -1) continue;\n        int walkStart = clock;\n        int node = i;\n        while (node != -1 && visitedAt[node] == -1) {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node != -1 && visitedAt[node] >= walkStart) {\n            int length = clock - visitedAt[node];\n            if (length > best) best = length;\n        }\n    }\n    free(visitedAt);\n    return best;\n}`,
              csharp: `public static int LongestCycle(int[] edges)\n{\n    int n = edges.Length;\n    int[] visitedAt = new int[n];\n    for (int i = 0; i < n; i++) visitedAt[i] = -1;\n    int best = -1, clock = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (visitedAt[i] != -1) continue;\n        int walkStart = clock;\n        int node = i;\n        while (node != -1 && visitedAt[node] == -1)\n        {\n            visitedAt[node] = clock++;\n            node = edges[node];\n        }\n        if (node != -1 && visitedAt[node] >= walkStart)\n        {\n            best = Math.Max(best, clock - visitedAt[node]);\n        }\n    }\n    return best;\n}`,
              go: `func longestCycle(edges []int) int {\n	n := len(edges)\n	visitedAt := make([]int, n)\n	for i := range visitedAt {\n		visitedAt[i] = -1\n	}\n	best, clock := -1, 0\n	for i := 0; i < n; i++ {\n		if visitedAt[i] != -1 {\n			continue\n		}\n		walkStart := clock\n		node := i\n		for node != -1 && visitedAt[node] == -1 {\n			visitedAt[node] = clock\n			clock++\n			node = edges[node]\n		}\n		if node != -1 && visitedAt[node] >= walkStart {\n			length := clock - visitedAt[node]\n			if length > best {\n				best = length\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun longestCycle(edges: IntArray): Int {\n    val n = edges.size\n    val visitedAt = IntArray(n) { -1 }\n    var best = -1\n    var clock = 0\n    for (i in 0 until n) {\n        if (visitedAt[i] != -1) continue\n        val walkStart = clock\n        var node = i\n        while (node != -1 && visitedAt[node] == -1) {\n            visitedAt[node] = clock++\n            node = edges[node]\n        }\n        if (node != -1 && visitedAt[node] >= walkStart) {\n            val length = clock - visitedAt[node]\n            if (length > best) best = length\n        }\n    }\n    return best\n}`,
              swift: `func longestCycle(_ edges: [Int]) -> Int {\n    let n = edges.count\n    var visitedAt = [Int](repeating: -1, count: n)\n    var best = -1\n    var clock = 0\n    for i in 0..<n {\n        if visitedAt[i] != -1 { continue }\n        let walkStart = clock\n        var node = i\n        while node != -1 && visitedAt[node] == -1 {\n            visitedAt[node] = clock\n            clock += 1\n            node = edges[node]\n        }\n        if node != -1 && visitedAt[node] >= walkStart {\n            let length = clock - visitedAt[node]\n            if length > best { best = length }\n        }\n    }\n    return best\n}`,
              rust: `fn longestCycle(edges: Vec<i32>) -> i32 {\n    let n = edges.len();\n    let mut visited_at = vec![-1i32; n];\n    let mut best = -1i32;\n    let mut clock = 0i32;\n    for i in 0..n {\n        if visited_at[i] != -1 {\n            continue;\n        }\n        let walk_start = clock;\n        let mut node = i as i32;\n        while node != -1 && visited_at[node as usize] == -1 {\n            visited_at[node as usize] = clock;\n            clock += 1;\n            node = edges[node as usize];\n        }\n        if node != -1 && visited_at[node as usize] >= walk_start {\n            let length = clock - visited_at[node as usize];\n            if length > best {\n                best = length;\n            }\n        }\n    }\n    best\n}`,
              php: `function longestCycle($edges) {\n    $n = count($edges);\n    $visitedAt = array_fill(0, $n, -1);\n    $best = -1;\n    $clock = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($visitedAt[$i] !== -1) continue;\n        $walkStart = $clock;\n        $node = $i;\n        while ($node !== -1 && $visitedAt[$node] === -1) {\n            $visitedAt[$node] = $clock++;\n            $node = $edges[$node];\n        }\n        if ($node !== -1 && $visitedAt[$node] >= $walkStart) {\n            $length = $clock - $visitedAt[$node];\n            if ($length > $best) $best = $length;\n        }\n    }\n    return $best;\n}`,
              ruby: `def longestCycle(edges)\n  n = edges.length\n  visited_at = Array.new(n, -1)\n  best = -1\n  clock = 0\n  (0...n).each do |i|\n    next if visited_at[i] != -1\n    walk_start = clock\n    node = i\n    while node != -1 && visited_at[node] == -1\n      visited_at[node] = clock\n      clock += 1\n      node = edges[node]\n    end\n    if node != -1 && visited_at[node] >= walk_start\n      length = clock - visited_at[node]\n      best = length if length > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find Closest Node to Given Two Nodes ────────────────────────
  (() => {
    const walk = (edges: number[], start: number) => {
      const n = edges.length;
      const dist: number[] = [];
      for (let i = 0; i < n; i++) dist.push(-1);
      let node = start;
      let steps = 0;
      while (node !== -1 && dist[node] === -1) {
        dist[node] = steps++;
        node = edges[node];
      }
      return dist;
    };
    const ref = (edges: number[], node1: number, node2: number) => {
      const d1 = walk(edges, node1);
      const d2 = walk(edges, node2);
      let best = -1;
      let bestDistance = -1;
      for (let i = 0; i < edges.length; i++) {
        if (d1[i] === -1 || d2[i] === -1) continue;
        const worst = d1[i] > d2[i] ? d1[i] : d2[i];
        if (best === -1 || worst < bestDistance) {
          best = i;
          bestDistance = worst;
        }
      }
      return best;
    };
    return {
      slug: "find-closest-node-to-given-two-nodes",
      title: "Find Closest Node to Given Two Nodes",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Graph", "Amazon", "Google"],
      signature: {
        funcName: "closestMeetingNode",
        params: [
          { name: "edges", type: "int[]" as const },
          { name: "node1", type: "int" as const },
          { name: "node2", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given a directed graph of `n` nodes where each node has at most one outgoing edge: `edges[i]` is the node `i` points to, or `-1`.\n\nFind a node reachable from **both** `node1` and `node2` that minimises the larger of the two distances. If several qualify, return the smallest index; if none exists, return `-1`.",
        [
          { in: "edges = [2,2,3,-1], node1 = 0, node2 = 1", out: "2" },
          { in: "edges = [1,2,-1], node1 = 0, node2 = 2", out: "2" },
          { in: "edges = [-1,-1], node1 = 0, node2 = 1", out: "-1" },
        ],
        ["1 <= edges.length <= 40", "-1 <= edges[i] < edges.length", "edges[i] != i", "0 <= node1, node2 < edges.length"]),
      hints: [
        "From each start, follow the single outgoing edge and record the distance to every node you meet.",
        "The walk ends at `-1` or the moment it revisits a node, so it is linear.",
        "Scan the nodes reachable from both and keep the one with the smallest `max(d1, d2)`, breaking ties by index.",
      ],
      examples: [
        { input: "[2,2,3,-1]\n0\n1", expectedOutput: "2" },
        { input: "[1,2,-1]\n0\n2", expectedOutput: "2" },
        { input: "[-1,-1]\n0\n1", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const edges: number[] = [];
        for (let i = 0; i < n; i++) {
          if (n === 1 || rng() < 0.25) {
            edges.push(-1);
            continue;
          }
          let target = ri(rng, 0, n - 1);
          while (target === i) target = ri(rng, 0, n - 1);
          edges.push(target);
        }
        const node1 = ri(rng, 0, n - 1);
        const node2 = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(edges)}\n${node1}\n${node2}`, expectedOutput: String(ref(edges, node1, node2)) };
      },
      solutions: {
        python: `def closestMeetingNode(edges, node1: int, node2: int) -> int:\n    def walk(start):\n        dist = [-1] * len(edges)\n        node, steps = start, 0\n        while node != -1 and dist[node] == -1:\n            dist[node] = steps\n            steps += 1\n            node = edges[node]\n        return dist\n\n    d1, d2 = walk(node1), walk(node2)\n    best, best_distance = -1, -1\n    for i in range(len(edges)):\n        if d1[i] == -1 or d2[i] == -1:\n            continue\n        worst = max(d1[i], d2[i])\n        if best == -1 or worst < best_distance:\n            best, best_distance = i, worst\n    return best`,
        javascript: `var closestMeetingNode = function(edges, node1, node2) {\n    const walk = function(start) {\n        const dist = [];\n        for (let i = 0; i < edges.length; i++) dist.push(-1);\n        let node = start, steps = 0;\n        while (node !== -1 && dist[node] === -1) {\n            dist[node] = steps++;\n            node = edges[node];\n        }\n        return dist;\n    };\n    const d1 = walk(node1);\n    const d2 = walk(node2);\n    let best = -1, bestDistance = -1;\n    for (let i = 0; i < edges.length; i++) {\n        if (d1[i] === -1 || d2[i] === -1) continue;\n        const worst = d1[i] > d2[i] ? d1[i] : d2[i];\n        if (best === -1 || worst < bestDistance) {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    return best;\n};`,
              typescript: `function walkDistances(edges: number[], start: number): number[] {\n    var dist: number[] = [];\n    for (var i = 0; i < edges.length; i++) dist.push(-1);\n    var node = start;\n    var steps = 0;\n    while (node !== -1 && dist[node] === -1) {\n        dist[node] = steps++;\n        node = edges[node];\n    }\n    return dist;\n}\n\nfunction closestMeetingNode(edges: number[], node1: number, node2: number): number {\n    var d1 = walkDistances(edges, node1);\n    var d2 = walkDistances(edges, node2);\n    var best = -1;\n    var bestDistance = -1;\n    for (var i = 0; i < edges.length; i++) {\n        if (d1[i] === -1 || d2[i] === -1) continue;\n        var worst = d1[i] > d2[i] ? d1[i] : d2[i];\n        if (best === -1 || worst < bestDistance) {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    return best;\n}`,
              java: `private static int[] walkDistances(int[] edges, int start) {\n    int[] dist = new int[edges.length];\n    Arrays.fill(dist, -1);\n    int node = start, steps = 0;\n    while (node != -1 && dist[node] == -1) {\n        dist[node] = steps++;\n        node = edges[node];\n    }\n    return dist;\n}\n\npublic static int closestMeetingNode(int[] edges, int node1, int node2) {\n    int[] d1 = walkDistances(edges, node1);\n    int[] d2 = walkDistances(edges, node2);\n    int best = -1, bestDistance = -1;\n    for (int i = 0; i < edges.length; i++) {\n        if (d1[i] == -1 || d2[i] == -1) continue;\n        int worst = Math.max(d1[i], d2[i]);\n        if (best == -1 || worst < bestDistance) {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    return best;\n}`,
              cpp: `static vector<int> walkDistances(vector<int>& edges, int start) {\n    vector<int> dist(edges.size(), -1);\n    int node = start, steps = 0;\n    while (node != -1 && dist[node] == -1) {\n        dist[node] = steps++;\n        node = edges[node];\n    }\n    return dist;\n}\n\nint closestMeetingNode(vector<int>& edges, int node1, int node2) {\n    vector<int> d1 = walkDistances(edges, node1);\n    vector<int> d2 = walkDistances(edges, node2);\n    int best = -1, bestDistance = -1;\n    for (int i = 0; i < (int) edges.size(); i++) {\n        if (d1[i] == -1 || d2[i] == -1) continue;\n        int worst = max(d1[i], d2[i]);\n        if (best == -1 || worst < bestDistance) {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    return best;\n}`,
              c: `static void walkDistances(int* edges, int n, int start, int* dist) {\n    for (int i = 0; i < n; i++) dist[i] = -1;\n    int node = start, steps = 0;\n    while (node != -1 && dist[node] == -1) {\n        dist[node] = steps++;\n        node = edges[node];\n    }\n}\n\nint closestMeetingNode(int* edges, int edgesSize, int node1, int node2) {\n    int n = edgesSize;\n    int* d1 = (int*) malloc((size_t) n * sizeof(int));\n    int* d2 = (int*) malloc((size_t) n * sizeof(int));\n    walkDistances(edges, n, node1, d1);\n    walkDistances(edges, n, node2, d2);\n    int best = -1, bestDistance = -1;\n    for (int i = 0; i < n; i++) {\n        if (d1[i] == -1 || d2[i] == -1) continue;\n        int worst = d1[i] > d2[i] ? d1[i] : d2[i];\n        if (best == -1 || worst < bestDistance) {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    free(d1);\n    free(d2);\n    return best;\n}`,
              csharp: `private static int[] WalkDistances(int[] edges, int start)\n{\n    int[] dist = new int[edges.Length];\n    for (int i = 0; i < dist.Length; i++) dist[i] = -1;\n    int node = start, steps = 0;\n    while (node != -1 && dist[node] == -1)\n    {\n        dist[node] = steps++;\n        node = edges[node];\n    }\n    return dist;\n}\n\npublic static int ClosestMeetingNode(int[] edges, int node1, int node2)\n{\n    int[] d1 = WalkDistances(edges, node1);\n    int[] d2 = WalkDistances(edges, node2);\n    int best = -1, bestDistance = -1;\n    for (int i = 0; i < edges.Length; i++)\n    {\n        if (d1[i] == -1 || d2[i] == -1) continue;\n        int worst = Math.Max(d1[i], d2[i]);\n        if (best == -1 || worst < bestDistance)\n        {\n            best = i;\n            bestDistance = worst;\n        }\n    }\n    return best;\n}`,
              go: `func walkDistances(edges []int, start int) []int {\n	dist := make([]int, len(edges))\n	for i := range dist {\n		dist[i] = -1\n	}\n	node, steps := start, 0\n	for node != -1 && dist[node] == -1 {\n		dist[node] = steps\n		steps++\n		node = edges[node]\n	}\n	return dist\n}\n\nfunc closestMeetingNode(edges []int, node1 int, node2 int) int {\n	d1 := walkDistances(edges, node1)\n	d2 := walkDistances(edges, node2)\n	best, bestDistance := -1, -1\n	for i := 0; i < len(edges); i++ {\n		if d1[i] == -1 || d2[i] == -1 {\n			continue\n		}\n		worst := d1[i]\n		if d2[i] > worst {\n			worst = d2[i]\n		}\n		if best == -1 || worst < bestDistance {\n			best = i\n			bestDistance = worst\n		}\n	}\n	return best\n}`,
              kotlin: `fun walkDistances(edges: IntArray, start: Int): IntArray {\n    val dist = IntArray(edges.size) { -1 }\n    var node = start\n    var steps = 0\n    while (node != -1 && dist[node] == -1) {\n        dist[node] = steps++\n        node = edges[node]\n    }\n    return dist\n}\n\nfun closestMeetingNode(edges: IntArray, node1: Int, node2: Int): Int {\n    val d1 = walkDistances(edges, node1)\n    val d2 = walkDistances(edges, node2)\n    var best = -1\n    var bestDistance = -1\n    for (i in edges.indices) {\n        if (d1[i] == -1 || d2[i] == -1) continue\n        val worst = if (d1[i] > d2[i]) d1[i] else d2[i]\n        if (best == -1 || worst < bestDistance) {\n            best = i\n            bestDistance = worst\n        }\n    }\n    return best\n}`,
              swift: `func walkDistances(_ edges: [Int], _ start: Int) -> [Int] {\n    var dist = [Int](repeating: -1, count: edges.count)\n    var node = start\n    var steps = 0\n    while node != -1 && dist[node] == -1 {\n        dist[node] = steps\n        steps += 1\n        node = edges[node]\n    }\n    return dist\n}\n\nfunc closestMeetingNode(_ edges: [Int], _ node1: Int, _ node2: Int) -> Int {\n    let d1 = walkDistances(edges, node1)\n    let d2 = walkDistances(edges, node2)\n    var best = -1\n    var bestDistance = -1\n    for i in 0..<edges.count {\n        if d1[i] == -1 || d2[i] == -1 { continue }\n        let worst = max(d1[i], d2[i])\n        if best == -1 || worst < bestDistance {\n            best = i\n            bestDistance = worst\n        }\n    }\n    return best\n}`,
              rust: `fn walk_distances(edges: &Vec<i32>, start: i32) -> Vec<i32> {\n    let mut dist = vec![-1i32; edges.len()];\n    let mut node = start;\n    let mut steps = 0i32;\n    while node != -1 && dist[node as usize] == -1 {\n        dist[node as usize] = steps;\n        steps += 1;\n        node = edges[node as usize];\n    }\n    dist\n}\n\nfn closestMeetingNode(edges: Vec<i32>, node1: i32, node2: i32) -> i32 {\n    let d1 = walk_distances(&edges, node1);\n    let d2 = walk_distances(&edges, node2);\n    let mut best = -1i32;\n    let mut best_distance = -1i32;\n    for i in 0..edges.len() {\n        if d1[i] == -1 || d2[i] == -1 {\n            continue;\n        }\n        let worst = if d1[i] > d2[i] { d1[i] } else { d2[i] };\n        if best == -1 || worst < best_distance {\n            best = i as i32;\n            best_distance = worst;\n        }\n    }\n    best\n}`,
              php: `function walkDistances($edges, $start) {\n    $dist = array_fill(0, count($edges), -1);\n    $node = $start;\n    $steps = 0;\n    while ($node !== -1 && $dist[$node] === -1) {\n        $dist[$node] = $steps++;\n        $node = $edges[$node];\n    }\n    return $dist;\n}\n\nfunction closestMeetingNode($edges, $node1, $node2) {\n    $d1 = walkDistances($edges, $node1);\n    $d2 = walkDistances($edges, $node2);\n    $best = -1;\n    $bestDistance = -1;\n    for ($i = 0; $i < count($edges); $i++) {\n        if ($d1[$i] === -1 || $d2[$i] === -1) continue;\n        $worst = max($d1[$i], $d2[$i]);\n        if ($best === -1 || $worst < $bestDistance) {\n            $best = $i;\n            $bestDistance = $worst;\n        }\n    }\n    return $best;\n}`,
              ruby: `def walk_distances(edges, start)\n  dist = Array.new(edges.length, -1)\n  node = start\n  steps = 0\n  while node != -1 && dist[node] == -1\n    dist[node] = steps\n    steps += 1\n    node = edges[node]\n  end\n  dist\nend\n\ndef closestMeetingNode(edges, node1, node2)\n  d1 = walk_distances(edges, node1)\n  d2 = walk_distances(edges, node2)\n  best = -1\n  best_distance = -1\n  (0...edges.length).each do |i|\n    next if d1[i] == -1 || d2[i] == -1\n    worst = [d1[i], d2[i]].max\n    if best == -1 || worst < best_distance\n      best = i\n      best_distance = worst\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximum Total Importance of Roads ───────────────────────────
  (() => {
    const ref = (n: number, roads: number[][]) => {
      const degree: number[] = [];
      for (let i = 0; i < n; i++) degree.push(0);
      for (let i = 0; i < roads.length; i++) {
        degree[roads[i][0]]++;
        degree[roads[i][1]]++;
      }
      degree.sort((a, b) => a - b);
      let total = 0;
      for (let i = 0; i < n; i++) total += degree[i] * (i + 1);
      return total;
    };
    return {
      slug: "maximum-total-importance-of-roads",
      title: "Maximum Total Importance of Roads",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Greedy", "Sorting", "Heap", "Amazon", "Google"],
      signature: { funcName: "maximumImportance", params: [{ name: "n", type: "int" as const }, { name: "roads", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` cities and a list of bidirectional `roads`. Assign each city a **distinct** integer value from `1` to `n`. A road's importance is the sum of the values of the two cities it joins.\n\nReturn the maximum total importance over all assignments.",
        [
          { in: "n = 5, roads = [[0,1],[1,2],[2,3],[0,2],[1,3],[2,4]]", out: "43" },
          { in: "n = 5, roads = [[0,3],[2,4],[1,3]]", out: "20" },
          { in: "n = 2, roads = []", out: "0" },
        ],
        ["2 <= n <= 40", "0 <= roads.length <= 60", "There are no duplicate roads and no self-loops.", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Rewrite the total as a sum over **cities**: each city contributes `value * degree`.",
        "So the busiest city should get the largest value.",
        "Sort the degrees ascending and pair them with the values `1, 2, …, n`.",
      ],
      examples: [
        { input: "5\n[[0,1],[1,2],[2,3],[0,2],[1,3],[2,4]]", expectedOutput: "43" },
        { input: "5\n[[0,3],[2,4],[1,3]]", expectedOutput: "20" },
        { input: "2\n[]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const roads = randEdges(rng, n, ri(rng, 0, Math.min(60, n * 2)));
        return { input: `${n}\n${fmtIntMat(roads)}`, expectedOutput: String(ref(n, roads)) };
      },
      solutions: {
        python: `def maximumImportance(n: int, roads) -> int:\n    degree = [0] * n\n    for a, b in roads:\n        degree[a] += 1\n        degree[b] += 1\n    degree.sort()\n    return sum(d * (i + 1) for i, d in enumerate(degree))`,
        javascript: `var maximumImportance = function(n, roads) {\n    const degree = [];\n    for (let i = 0; i < n; i++) degree.push(0);\n    for (let i = 0; i < roads.length; i++) {\n        degree[roads[i][0]]++;\n        degree[roads[i][1]]++;\n    }\n    degree.sort(function(a, b) { return a - b; });\n    let total = 0;\n    for (let i = 0; i < n; i++) total += degree[i] * (i + 1);\n    return total;\n};`,
              typescript: `function maximumImportance(n: number, roads: number[][]): number {\n    var degree: number[] = [];\n    for (var i = 0; i < n; i++) degree.push(0);\n    for (var j = 0; j < roads.length; j++) {\n        degree[roads[j][0]]++;\n        degree[roads[j][1]]++;\n    }\n    degree.sort(function (a, b) { return a - b; });\n    var total = 0;\n    for (var k = 0; k < n; k++) total += degree[k] * (k + 1);\n    return total;\n}`,
              java: `public static int maximumImportance(int n, int[][] roads) {\n    int[] degree = new int[n];\n    for (int[] road : roads) {\n        degree[road[0]]++;\n        degree[road[1]]++;\n    }\n    Arrays.sort(degree);\n    int total = 0;\n    for (int i = 0; i < n; i++) total += degree[i] * (i + 1);\n    return total;\n}`,
              cpp: `int maximumImportance(int n, vector<vector<int>>& roads) {\n    vector<int> degree(n, 0);\n    for (const auto& road : roads) {\n        degree[road[0]]++;\n        degree[road[1]]++;\n    }\n    sort(degree.begin(), degree.end());\n    int total = 0;\n    for (int i = 0; i < n; i++) total += degree[i] * (i + 1);\n    return total;\n}`,
              c: `static int cmpDegreeAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maximumImportance(int n, int** roads, int roadsSize, int* roadsColSize) {\n    int* degree = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < roadsSize; i++) {\n        degree[roads[i][0]]++;\n        degree[roads[i][1]]++;\n    }\n    qsort(degree, n, sizeof(int), cmpDegreeAsc);\n    int total = 0;\n    for (int i = 0; i < n; i++) total += degree[i] * (i + 1);\n    free(degree);\n    return total;\n}`,
              csharp: `public static int MaximumImportance(int n, int[][] roads)\n{\n    int[] degree = new int[n];\n    foreach (int[] road in roads)\n    {\n        degree[road[0]]++;\n        degree[road[1]]++;\n    }\n    Array.Sort(degree);\n    int total = 0;\n    for (int i = 0; i < n; i++) total += degree[i] * (i + 1);\n    return total;\n}`,
              go: `func maximumImportance(n int, roads [][]int) int {\n	degree := make([]int, n)\n	for _, road := range roads {\n		degree[road[0]]++\n		degree[road[1]]++\n	}\n	sort.Ints(degree)\n	total := 0\n	for i := 0; i < n; i++ {\n		total += degree[i] * (i + 1)\n	}\n	return total\n}`,
              kotlin: `fun maximumImportance(n: Int, roads: Array<IntArray>): Int {\n    val degree = IntArray(n)\n    for (road in roads) {\n        degree[road[0]]++\n        degree[road[1]]++\n    }\n    degree.sort()\n    var total = 0\n    for (i in 0 until n) total += degree[i] * (i + 1)\n    return total\n}`,
              swift: `func maximumImportance(_ n: Int, _ roads: [[Int]]) -> Int {\n    var degree = [Int](repeating: 0, count: n)\n    for road in roads {\n        degree[road[0]] += 1\n        degree[road[1]] += 1\n    }\n    degree.sort()\n    var total = 0\n    for i in 0..<n { total += degree[i] * (i + 1) }\n    return total\n}`,
              rust: `fn maximumImportance(n: i32, roads: Vec<Vec<i32>>) -> i32 {\n    let size = n as usize;\n    let mut degree = vec![0i32; size];\n    for road in roads.iter() {\n        degree[road[0] as usize] += 1;\n        degree[road[1] as usize] += 1;\n    }\n    degree.sort();\n    let mut total = 0i32;\n    for i in 0..size {\n        total += degree[i] * (i as i32 + 1);\n    }\n    total\n}`,
              php: `function maximumImportance($n, $roads) {\n    $degree = array_fill(0, $n, 0);\n    foreach ($roads as $road) {\n        $degree[$road[0]]++;\n        $degree[$road[1]]++;\n    }\n    sort($degree);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) $total += $degree[$i] * ($i + 1);\n    return $total;\n}`,
              ruby: `def maximumImportance(n, roads)\n  degree = Array.new(n, 0)\n  roads.each do |road|\n    degree[road[0]] += 1\n    degree[road[1]] += 1\n  end\n  degree.sort.each_with_index.map { |d, i| d * (i + 1) }.sum\nend`,
      },
    };
  })(),

  // ── Count Unreachable Pairs of Nodes in an Undirected Graph ─────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const parent: number[] = [];
      const size: number[] = [];
      for (let i = 0; i < n; i++) {
        parent.push(i);
        size.push(1);
      }
      const find = (x: number): number => {
        let r = x;
        while (parent[r] !== r) r = parent[r];
        return r;
      };
      for (let i = 0; i < edges.length; i++) {
        const a = find(edges[i][0]);
        const b = find(edges[i][1]);
        if (a !== b) {
          parent[a] = b;
          size[b] += size[a];
        }
      }
      let unreachable = 0;
      let seenSoFar = 0;
      for (let i = 0; i < n; i++) {
        if (find(i) !== i) continue;
        unreachable += size[i] * seenSoFar;
        seenSoFar += size[i];
      }
      return unreachable;
    };
    return {
      slug: "count-unreachable-pairs-of-nodes-in-an-undirected-graph",
      title: "Count Unreachable Pairs of Nodes in an Undirected Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Breadth-First Search", "Union Find", "Graph", "Amazon", "Google"],
      signature: { funcName: "countPairs", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` nodes labelled `0` through `n - 1` and a list of undirected `edges`.\n\nReturn the number of pairs of **different** nodes that are unreachable from each other.",
        [
          { in: "n = 3, edges = [[0,1],[0,2],[1,2]]", out: "0" },
          { in: "n = 7, edges = [[0,2],[0,5],[2,4],[1,6],[5,4]]", out: "14" },
          { in: "n = 4, edges = []", out: "6" },
        ],
        ["1 <= n <= 60", "0 <= edges.length <= 90", "There are no duplicate edges and no self-loops.", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Two nodes are reachable exactly when they sit in the same connected component.",
        "So find the component sizes — union-find or a flood fill both work.",
        "Every pair drawn from two different components is unreachable; accumulate `size * (nodes counted so far)` as you sweep the components.",
      ],
      examples: [
        { input: "3\n[[0,1],[0,2],[1,2]]", expectedOutput: "0" },
        { input: "7\n[[0,2],[0,5],[2,4],[1,6],[5,4]]", expectedOutput: "14" },
        { input: "4\n[]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const edges = randEdges(rng, n, ri(rng, 0, Math.min(90, n * 2)));
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `def countPairs(n: int, edges) -> int:\n    parent = list(range(n))\n    size = [1] * n\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n            size[rb] += size[ra]\n    unreachable = 0\n    seen_so_far = 0\n    for i in range(n):\n        if find(i) != i:\n            continue\n        unreachable += size[i] * seen_so_far\n        seen_so_far += size[i]\n    return unreachable`,
        javascript: `var countPairs = function(n, edges) {\n    const parent = [], size = [];\n    for (let i = 0; i < n; i++) {\n        parent.push(i);\n        size.push(1);\n    }\n    const find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (let i = 0; i < edges.length; i++) {\n        const a = find(edges[i][0]);\n        const b = find(edges[i][1]);\n        if (a !== b) {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    let unreachable = 0, seenSoFar = 0;\n    for (let i = 0; i < n; i++) {\n        if (find(i) !== i) continue;\n        unreachable += size[i] * seenSoFar;\n        seenSoFar += size[i];\n    }\n    return unreachable;\n};`,
              typescript: `function countPairs(n: number, edges: number[][]): number {\n    var parent: number[] = [];\n    var size: number[] = [];\n    for (var i = 0; i < n; i++) {\n        parent.push(i);\n        size.push(1);\n    }\n    var find = function (x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (var j = 0; j < edges.length; j++) {\n        var a = find(edges[j][0]);\n        var b = find(edges[j][1]);\n        if (a !== b) {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    var unreachable = 0;\n    var seenSoFar = 0;\n    for (var k = 0; k < n; k++) {\n        if (find(k) !== k) continue;\n        unreachable += size[k] * seenSoFar;\n        seenSoFar += size[k];\n    }\n    return unreachable;\n}`,
              java: `private static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int countPairs(int n, int[][] edges) {\n    int[] parent = new int[n];\n    int[] size = new int[n];\n    for (int i = 0; i < n; i++) {\n        parent[i] = i;\n        size[i] = 1;\n    }\n    for (int[] e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    int unreachable = 0, seenSoFar = 0;\n    for (int i = 0; i < n; i++) {\n        if (findRoot(parent, i) != i) continue;\n        unreachable += size[i] * seenSoFar;\n        seenSoFar += size[i];\n    }\n    return unreachable;\n}`,
              cpp: `static int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countPairs(int n, vector<vector<int>>& edges) {\n    vector<int> parent(n), size(n, 1);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (const auto& e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a != b) {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    int unreachable = 0, seenSoFar = 0;\n    for (int i = 0; i < n; i++) {\n        if (findRoot(parent, i) != i) continue;\n        unreachable += size[i] * seenSoFar;\n        seenSoFar += size[i];\n    }\n    return unreachable;\n}`,
              c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countPairs(int n, int** edges, int edgesSize, int* edgesColSize) {\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    int* size = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        parent[i] = i;\n        size[i] = 1;\n    }\n    for (int i = 0; i < edgesSize; i++) {\n        int a = findRootC(parent, edges[i][0]);\n        int b = findRootC(parent, edges[i][1]);\n        if (a != b) {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    int unreachable = 0, seenSoFar = 0;\n    for (int i = 0; i < n; i++) {\n        if (findRootC(parent, i) != i) continue;\n        unreachable += size[i] * seenSoFar;\n        seenSoFar += size[i];\n    }\n    free(parent);\n    free(size);\n    return unreachable;\n}`,
              csharp: `private static int FindRoot(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\npublic static int CountPairs(int n, int[][] edges)\n{\n    int[] parent = new int[n];\n    int[] size = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        parent[i] = i;\n        size[i] = 1;\n    }\n    foreach (int[] e in edges)\n    {\n        int a = FindRoot(parent, e[0]);\n        int b = FindRoot(parent, e[1]);\n        if (a != b)\n        {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    int unreachable = 0, seenSoFar = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (FindRoot(parent, i) != i) continue;\n        unreachable += size[i] * seenSoFar;\n        seenSoFar += size[i];\n    }\n    return unreachable;\n}`,
              go: `func findRoot(parent []int, x int) int {\n	for parent[x] != x {\n		parent[x] = parent[parent[x]]\n		x = parent[x]\n	}\n	return x\n}\n\nfunc countPairs(n int, edges [][]int) int {\n	parent := make([]int, n)\n	size := make([]int, n)\n	for i := range parent {\n		parent[i] = i\n		size[i] = 1\n	}\n	for _, e := range edges {\n		a := findRoot(parent, e[0])\n		b := findRoot(parent, e[1])\n		if a != b {\n			parent[a] = b\n			size[b] += size[a]\n		}\n	}\n	unreachable, seenSoFar := 0, 0\n	for i := 0; i < n; i++ {\n		if findRoot(parent, i) != i {\n			continue\n		}\n		unreachable += size[i] * seenSoFar\n		seenSoFar += size[i]\n	}\n	return unreachable\n}`,
              kotlin: `fun findRoot(parent: IntArray, start: Int): Int {\n    var x = start\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfun countPairs(n: Int, edges: Array<IntArray>): Int {\n    val parent = IntArray(n) { it }\n    val size = IntArray(n) { 1 }\n    for (e in edges) {\n        val a = findRoot(parent, e[0])\n        val b = findRoot(parent, e[1])\n        if (a != b) {\n            parent[a] = b\n            size[b] += size[a]\n        }\n    }\n    var unreachable = 0\n    var seenSoFar = 0\n    for (i in 0 until n) {\n        if (findRoot(parent, i) != i) continue\n        unreachable += size[i] * seenSoFar\n        seenSoFar += size[i]\n    }\n    return unreachable\n}`,
              swift: `func findRoot(_ parent: inout [Int], _ start: Int) -> Int {\n    var x = start\n    while parent[x] != x {\n        parent[x] = parent[parent[x]]\n        x = parent[x]\n    }\n    return x\n}\n\nfunc countPairs(_ n: Int, _ edges: [[Int]]) -> Int {\n    var parent = Array(0..<n)\n    var size = [Int](repeating: 1, count: n)\n    for e in edges {\n        let a = findRoot(&parent, e[0])\n        let b = findRoot(&parent, e[1])\n        if a != b {\n            parent[a] = b\n            size[b] += size[a]\n        }\n    }\n    var unreachable = 0\n    var seenSoFar = 0\n    for i in 0..<n {\n        if findRoot(&parent, i) != i { continue }\n        unreachable += size[i] * seenSoFar\n        seenSoFar += size[i]\n    }\n    return unreachable\n}`,
              rust: `fn find_root(parent: &mut Vec<usize>, start: usize) -> usize {\n    let mut x = start;\n    while parent[x] != x {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    x\n}\n\nfn countPairs(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    let size_n = n as usize;\n    let mut parent: Vec<usize> = (0..size_n).collect();\n    let mut size = vec![1i32; size_n];\n    for e in edges.iter() {\n        let a = find_root(&mut parent, e[0] as usize);\n        let b = find_root(&mut parent, e[1] as usize);\n        if a != b {\n            parent[a] = b;\n            size[b] += size[a];\n        }\n    }\n    let mut unreachable = 0i32;\n    let mut seen_so_far = 0i32;\n    for i in 0..size_n {\n        if find_root(&mut parent, i) != i {\n            continue;\n        }\n        unreachable += size[i] * seen_so_far;\n        seen_so_far += size[i];\n    }\n    unreachable\n}`,
              php: `function findRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}\n\nfunction countPairs($n, $edges) {\n    $parent = range(0, max($n - 1, 0));\n    $size = array_fill(0, $n, 1);\n    foreach ($edges as $e) {\n        $a = findRoot($parent, $e[0]);\n        $b = findRoot($parent, $e[1]);\n        if ($a !== $b) {\n            $parent[$a] = $b;\n            $size[$b] += $size[$a];\n        }\n    }\n    $unreachable = 0;\n    $seenSoFar = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if (findRoot($parent, $i) !== $i) continue;\n        $unreachable += $size[$i] * $seenSoFar;\n        $seenSoFar += $size[$i];\n    }\n    return $unreachable;\n}`,
              ruby: `def find_root(parent, x)\n  while parent[x] != x\n    parent[x] = parent[parent[x]]\n    x = parent[x]\n  end\n  x\nend\n\ndef countPairs(n, edges)\n  parent = (0...n).to_a\n  size = Array.new(n, 1)\n  edges.each do |e|\n    a = find_root(parent, e[0])\n    b = find_root(parent, e[1])\n    if a != b\n      parent[a] = b\n      size[b] += size[a]\n    end\n  end\n  unreachable = 0\n  seen_so_far = 0\n  (0...n).each do |i|\n    next if find_root(parent, i) != i\n    unreachable += size[i] * seen_so_far\n    seen_so_far += size[i]\n  end\n  unreachable\nend`,
      },
    };
  })(),

  // ── Jump Game III ───────────────────────────────────────────────
  (() => {
    const ref = (arr: number[], start: number) => {
      const n = arr.length;
      const seen: boolean[] = [];
      for (let i = 0; i < n; i++) seen.push(false);
      seen[start] = true;
      const stack: number[] = [start];
      while (stack.length > 0) {
        const index = stack.pop() as number;
        if (arr[index] === 0) return true;
        const forward = index + arr[index];
        const backward = index - arr[index];
        if (forward < n && !seen[forward]) {
          seen[forward] = true;
          stack.push(forward);
        }
        if (backward >= 0 && !seen[backward]) {
          seen[backward] = true;
          stack.push(backward);
        }
      }
      return false;
    };
    return {
      slug: "jump-game-iii",
      title: "Jump Game III",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Meta"],
      signature: { funcName: "canReach", params: [{ name: "arr", type: "int[]" as const }, { name: "start", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an array of non-negative integers `arr` and a starting index `start`, you may jump from index `i` to `i + arr[i]` or `i - arr[i]`, provided you stay inside the array.\n\nReturn `true` if you can reach **any** index holding the value `0`.",
        [
          { in: "arr = [4,2,3,0,3,1,2], start = 5", out: "true" },
          { in: "arr = [4,2,3,0,3,1,2], start = 0", out: "true" },
          { in: "arr = [3,0,2,1,2], start = 2", out: "false" },
        ],
        ["1 <= arr.length <= 40", "0 <= arr[i] < arr.length", "0 <= start < arr.length"]),
      hints: [
        "Treat the indices as graph nodes with two outgoing edges each.",
        "Run a DFS or BFS from `start`, marking indices as you visit them.",
        "The marking is what keeps you out of an infinite loop when jumps bounce back and forth.",
      ],
      examples: [
        { input: "[4,2,3,0,3,1,2]\n5", expectedOutput: "true" },
        { input: "[4,2,3,0,3,1,2]\n0", expectedOutput: "true" },
        { input: "[3,0,2,1,2]\n2", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const arr = Array.from({ length: n }, () => (rng() < 0.2 ? 0 : ri(rng, 0, n - 1)));
        const start = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(arr)}\n${start}`, expectedOutput: bool(ref(arr, start)) };
      },
      solutions: {
        python: `def canReach(arr, start: int) -> bool:\n    n = len(arr)\n    seen = [False] * n\n    seen[start] = True\n    stack = [start]\n    while stack:\n        index = stack.pop()\n        if arr[index] == 0:\n            return True\n        for nxt in (index + arr[index], index - arr[index]):\n            if 0 <= nxt < n and not seen[nxt]:\n                seen[nxt] = True\n                stack.append(nxt)\n    return False`,
        javascript: `var canReach = function(arr, start) {\n    const n = arr.length;\n    const seen = [];\n    for (let i = 0; i < n; i++) seen.push(false);\n    seen[start] = true;\n    const stack = [start];\n    while (stack.length > 0) {\n        const index = stack.pop();\n        if (arr[index] === 0) return true;\n        const forward = index + arr[index];\n        const backward = index - arr[index];\n        if (forward < n && !seen[forward]) {\n            seen[forward] = true;\n            stack.push(forward);\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = true;\n            stack.push(backward);\n        }\n    }\n    return false;\n};`,
              typescript: `function canReach(arr: number[], start: number): boolean {\n    var n = arr.length;\n    var seen: boolean[] = [];\n    for (var i = 0; i < n; i++) seen.push(false);\n    seen[start] = true;\n    var stack: number[] = [start];\n    while (stack.length > 0) {\n        var index = stack.pop() as number;\n        if (arr[index] === 0) return true;\n        var forward = index + arr[index];\n        var backward = index - arr[index];\n        if (forward < n && !seen[forward]) {\n            seen[forward] = true;\n            stack.push(forward);\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = true;\n            stack.push(backward);\n        }\n    }\n    return false;\n}`,
              java: `public static boolean canReach(int[] arr, int start) {\n    int n = arr.length;\n    boolean[] seen = new boolean[n];\n    seen[start] = true;\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(start);\n    while (!stack.isEmpty()) {\n        int index = stack.pop();\n        if (arr[index] == 0) return true;\n        int forward = index + arr[index];\n        int backward = index - arr[index];\n        if (forward < n && !seen[forward]) {\n            seen[forward] = true;\n            stack.push(forward);\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = true;\n            stack.push(backward);\n        }\n    }\n    return false;\n}`,
              cpp: `bool canReach(vector<int>& arr, int start) {\n    int n = (int) arr.size();\n    vector<bool> seen(n, false);\n    seen[start] = true;\n    vector<int> stack;\n    stack.push_back(start);\n    while (!stack.empty()) {\n        int index = stack.back();\n        stack.pop_back();\n        if (arr[index] == 0) return true;\n        int forward = index + arr[index];\n        int backward = index - arr[index];\n        if (forward < n && !seen[forward]) {\n            seen[forward] = true;\n            stack.push_back(forward);\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = true;\n            stack.push_back(backward);\n        }\n    }\n    return false;\n}`,
              c: `bool canReach(int* arr, int arrSize, int start) {\n    int n = arrSize;\n    char* seen = (char*) calloc((size_t) n, sizeof(char));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    int top = 0;\n    seen[start] = 1;\n    stack[top++] = start;\n    bool found = false;\n    while (top > 0) {\n        int index = stack[--top];\n        if (arr[index] == 0) {\n            found = true;\n            break;\n        }\n        int forward = index + arr[index];\n        int backward = index - arr[index];\n        if (forward < n && !seen[forward]) {\n            seen[forward] = 1;\n            stack[top++] = forward;\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = 1;\n            stack[top++] = backward;\n        }\n    }\n    free(seen);\n    free(stack);\n    return found;\n}`,
              csharp: `public static bool CanReach(int[] arr, int start)\n{\n    int n = arr.Length;\n    bool[] seen = new bool[n];\n    seen[start] = true;\n    var stack = new List<int>();\n    stack.Add(start);\n    while (stack.Count > 0)\n    {\n        int index = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        if (arr[index] == 0) return true;\n        int forward = index + arr[index];\n        int backward = index - arr[index];\n        if (forward < n && !seen[forward])\n        {\n            seen[forward] = true;\n            stack.Add(forward);\n        }\n        if (backward >= 0 && !seen[backward])\n        {\n            seen[backward] = true;\n            stack.Add(backward);\n        }\n    }\n    return false;\n}`,
              go: `func canReach(arr []int, start int) bool {\n	n := len(arr)\n	seen := make([]bool, n)\n	seen[start] = true\n	stack := []int{start}\n	for len(stack) > 0 {\n		index := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		if arr[index] == 0 {\n			return true\n		}\n		forward := index + arr[index]\n		backward := index - arr[index]\n		if forward < n && !seen[forward] {\n			seen[forward] = true\n			stack = append(stack, forward)\n		}\n		if backward >= 0 && !seen[backward] {\n			seen[backward] = true\n			stack = append(stack, backward)\n		}\n	}\n	return false\n}`,
              kotlin: `fun canReach(arr: IntArray, start: Int): Boolean {\n    val n = arr.size\n    val seen = BooleanArray(n)\n    seen[start] = true\n    val stack = ArrayList<Int>()\n    stack.add(start)\n    while (stack.isNotEmpty()) {\n        val index = stack.removeAt(stack.size - 1)\n        if (arr[index] == 0) return true\n        val forward = index + arr[index]\n        val backward = index - arr[index]\n        if (forward < n && !seen[forward]) {\n            seen[forward] = true\n            stack.add(forward)\n        }\n        if (backward >= 0 && !seen[backward]) {\n            seen[backward] = true\n            stack.add(backward)\n        }\n    }\n    return false\n}`,
              swift: `func canReach(_ arr: [Int], _ start: Int) -> Bool {\n    let n = arr.count\n    var seen = [Bool](repeating: false, count: n)\n    seen[start] = true\n    var stack = [start]\n    while let index = stack.popLast() {\n        if arr[index] == 0 { return true }\n        let forward = index + arr[index]\n        let backward = index - arr[index]\n        if forward < n && !seen[forward] {\n            seen[forward] = true\n            stack.append(forward)\n        }\n        if backward >= 0 && !seen[backward] {\n            seen[backward] = true\n            stack.append(backward)\n        }\n    }\n    return false\n}`,
              rust: `fn canReach(arr: Vec<i32>, start: i32) -> bool {\n    let n = arr.len() as i32;\n    let mut seen = vec![false; arr.len()];\n    seen[start as usize] = true;\n    let mut stack: Vec<i32> = vec![start];\n    while let Some(index) = stack.pop() {\n        if arr[index as usize] == 0 {\n            return true;\n        }\n        let forward = index + arr[index as usize];\n        let backward = index - arr[index as usize];\n        if forward < n && !seen[forward as usize] {\n            seen[forward as usize] = true;\n            stack.push(forward);\n        }\n        if backward >= 0 && !seen[backward as usize] {\n            seen[backward as usize] = true;\n            stack.push(backward);\n        }\n    }\n    false\n}`,
              php: `function canReach($arr, $start) {\n    $n = count($arr);\n    $seen = array_fill(0, $n, false);\n    $seen[$start] = true;\n    $stack = array($start);\n    while (count($stack) > 0) {\n        $index = array_pop($stack);\n        if ($arr[$index] === 0) return true;\n        $forward = $index + $arr[$index];\n        $backward = $index - $arr[$index];\n        if ($forward < $n && !$seen[$forward]) {\n            $seen[$forward] = true;\n            $stack[] = $forward;\n        }\n        if ($backward >= 0 && !$seen[$backward]) {\n            $seen[$backward] = true;\n            $stack[] = $backward;\n        }\n    }\n    return false;\n}`,
              ruby: `def canReach(arr, start)\n  n = arr.length\n  seen = Array.new(n, false)\n  seen[start] = true\n  stack = [start]\n  while !stack.empty?\n    index = stack.pop\n    return true if arr[index] == 0\n    forward = index + arr[index]\n    backward = index - arr[index]\n    if forward < n && !seen[forward]\n      seen[forward] = true\n      stack.push(forward)\n    end\n    if backward >= 0 && !seen[backward]\n      seen[backward] = true\n      stack.push(backward)\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Minimum Genetic Mutation ────────────────────────────────────
  (() => {
    const ref = (startGene: string, endGene: string, bank: string[]) => {
      const used: boolean[] = bank.map(() => false);
      let frontier: string[] = [startGene];
      let level = 0;
      while (frontier.length > 0) {
        const next: string[] = [];
        for (let f = 0; f < frontier.length; f++) {
          for (let i = 0; i < bank.length; i++) {
            if (used[i]) continue;
            let diff = 0;
            for (let k = 0; k < bank[i].length; k++) {
              if (bank[i][k] !== frontier[f][k]) diff++;
            }
            if (diff !== 1) continue;
            if (bank[i] === endGene) return level + 1;
            used[i] = true;
            next.push(bank[i]);
          }
        }
        frontier = next;
        level++;
      }
      return startGene === endGene ? 0 : -1;
    };
    return {
      slug: "minimum-genetic-mutation",
      title: "Minimum Genetic Mutation",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "minMutation",
        params: [
          { name: "startGene", type: "string" as const },
          { name: "endGene", type: "string" as const },
          { name: "bank", type: "string[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A gene string is eight characters long, each one of `'A'`, `'C'`, `'G'` or `'T'`. A **mutation** changes exactly one character, and every intermediate gene must appear in `bank`.\n\nGiven `startGene`, `endGene` and `bank`, return the minimum number of mutations that turns the first into the second, or `-1` if it is impossible.",
        [
          { in: 'startGene = "AACCGGTT", endGene = "AACCGGTA", bank = ["AACCGGTA"]', out: "1" },
          { in: 'startGene = "AACCGGTT", endGene = "AAACGGTA", bank = ["AACCGGTA","AACCGCTA","AAACGGTA"]', out: "2" },
          { in: 'startGene = "AACCGGTT", endGene = "AACCGGTA", bank = []', out: "-1" },
        ],
        ["startGene.length == endGene.length == 8", "0 <= bank.length <= 10", "All genes use only the characters A, C, G and T."]),
      hints: [
        "Each gene is a node and a single-character change is an edge, so this is a shortest path on an unweighted graph.",
        "Breadth-first search from `startGene`, expanding only to bank genes one character away.",
        "Mark bank genes as used the moment you enqueue them so no gene is revisited.",
      ],
      examples: [
        { input: '"AACCGGTT"\n"AACCGGTA"\n["AACCGGTA"]', expectedOutput: "1" },
        { input: '"AACCGGTT"\n"AAACGGTA"\n["AACCGGTA","AACCGCTA","AAACGGTA"]', expectedOutput: "2" },
        { input: '"AACCGGTT"\n"AACCGGTA"\n[]', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const letters = "ACGT";
        const randGene = () => Array.from({ length: 8 }, () => letters[ri(rng, 0, 3)]).join("");
        const startGene = randGene();
        let endGene = randGene();
        const bank: string[] = [];
        if (rng() < 0.55) {
          // Lay down a genuine mutation chain so reachable cases appear.
          let current = startGene;
          const steps = ri(rng, 1, 4);
          for (let s = 0; s < steps; s++) {
            const chars = current.split("");
            const at = ri(rng, 0, 7);
            let replacement = letters[ri(rng, 0, 3)];
            while (replacement === chars[at]) replacement = letters[ri(rng, 0, 3)];
            chars[at] = replacement;
            current = chars.join("");
            bank.push(current);
          }
          endGene = current;
        }
        const noise = ri(rng, 0, Math.max(0, 10 - bank.length));
        for (let i = 0; i < noise; i++) bank.push(randGene());
        return {
          input: `"${startGene}"\n"${endGene}"\n${fmtStrArr(shuffle(rng, bank))}`,
          expectedOutput: String(ref(startGene, endGene, shuffle(rng, bank.slice()))),
        };
      },
      solutions: {
        python: `def minMutation(startGene: str, endGene: str, bank) -> int:\n    used = [False] * len(bank)\n    frontier = [startGene]\n    level = 0\n    while frontier:\n        nxt = []\n        for gene in frontier:\n            for i, candidate in enumerate(bank):\n                if used[i]:\n                    continue\n                diff = sum(1 for a, b in zip(candidate, gene) if a != b)\n                if diff != 1:\n                    continue\n                if candidate == endGene:\n                    return level + 1\n                used[i] = True\n                nxt.append(candidate)\n        frontier = nxt\n        level += 1\n    return 0 if startGene == endGene else -1`,
        javascript: `var minMutation = function(startGene, endGene, bank) {\n    const used = bank.map(function() { return false; });\n    let frontier = [startGene];\n    let level = 0;\n    while (frontier.length > 0) {\n        const next = [];\n        for (let f = 0; f < frontier.length; f++) {\n            for (let i = 0; i < bank.length; i++) {\n                if (used[i]) continue;\n                let diff = 0;\n                for (let k = 0; k < bank[i].length; k++) {\n                    if (bank[i].charAt(k) !== frontier[f].charAt(k)) diff++;\n                }\n                if (diff !== 1) continue;\n                if (bank[i] === endGene) return level + 1;\n                used[i] = true;\n                next.push(bank[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return startGene === endGene ? 0 : -1;\n};`,
              typescript: `function minMutation(startGene: string, endGene: string, bank: string[]): number {\n    var used: boolean[] = [];\n    for (var i = 0; i < bank.length; i++) used.push(false);\n    var frontier: string[] = [startGene];\n    var level = 0;\n    while (frontier.length > 0) {\n        var next: string[] = [];\n        for (var f = 0; f < frontier.length; f++) {\n            for (var j = 0; j < bank.length; j++) {\n                if (used[j]) continue;\n                var diff = 0;\n                for (var k = 0; k < bank[j].length; k++) {\n                    if (bank[j].charAt(k) !== frontier[f].charAt(k)) diff++;\n                }\n                if (diff !== 1) continue;\n                if (bank[j] === endGene) return level + 1;\n                used[j] = true;\n                next.push(bank[j]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return startGene === endGene ? 0 : -1;\n}`,
              java: `public static int minMutation(String startGene, String endGene, String[] bank) {\n    boolean[] used = new boolean[bank.length];\n    List<String> frontier = new ArrayList<>();\n    frontier.add(startGene);\n    int level = 0;\n    while (!frontier.isEmpty()) {\n        List<String> next = new ArrayList<>();\n        for (String gene : frontier) {\n            for (int i = 0; i < bank.length; i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; k < bank[i].length(); k++) {\n                    if (bank[i].charAt(k) != gene.charAt(k)) diff++;\n                }\n                if (diff != 1) continue;\n                if (bank[i].equals(endGene)) return level + 1;\n                used[i] = true;\n                next.add(bank[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return startGene.equals(endGene) ? 0 : -1;\n}`,
              cpp: `int minMutation(string startGene, string endGene, vector<string>& bank) {\n    vector<bool> used(bank.size(), false);\n    vector<string> frontier;\n    frontier.push_back(startGene);\n    int level = 0;\n    while (!frontier.empty()) {\n        vector<string> next;\n        for (const string& gene : frontier) {\n            for (size_t i = 0; i < bank.size(); i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (size_t k = 0; k < bank[i].size(); k++) {\n                    if (bank[i][k] != gene[k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (bank[i] == endGene) return level + 1;\n                used[i] = true;\n                next.push_back(bank[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return startGene == endGene ? 0 : -1;\n}`,
              c: `int minMutation(const char* startGene, const char* endGene, char** bank, int bankSize) {\n    char* used = (char*) calloc((size_t) (bankSize > 0 ? bankSize : 1), sizeof(char));\n    char** frontier = (char**) malloc((size_t) (bankSize + 2) * sizeof(char*));\n    char** next = (char**) malloc((size_t) (bankSize + 2) * sizeof(char*));\n    int frontierCount = 0;\n    frontier[frontierCount++] = (char*) startGene;\n    int level = 0;\n    int answer = -2;\n    while (frontierCount > 0 && answer == -2) {\n        int nextCount = 0;\n        for (int f = 0; f < frontierCount && answer == -2; f++) {\n            for (int i = 0; i < bankSize; i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; bank[i][k] != '\\0'; k++) {\n                    if (bank[i][k] != frontier[f][k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (strcmp(bank[i], endGene) == 0) {\n                    answer = level + 1;\n                    break;\n                }\n                used[i] = 1;\n                next[nextCount++] = bank[i];\n            }\n        }\n        if (answer != -2) break;\n        for (int i = 0; i < nextCount; i++) frontier[i] = next[i];\n        frontierCount = nextCount;\n        level++;\n    }\n    if (answer == -2) answer = (strcmp(startGene, endGene) == 0) ? 0 : -1;\n    free(used);\n    free(frontier);\n    free(next);\n    return answer;\n}`,
              csharp: `public static int MinMutation(string startGene, string endGene, string[] bank)\n{\n    bool[] used = new bool[bank.Length];\n    var frontier = new List<string>();\n    frontier.Add(startGene);\n    int level = 0;\n    while (frontier.Count > 0)\n    {\n        var next = new List<string>();\n        foreach (string gene in frontier)\n        {\n            for (int i = 0; i < bank.Length; i++)\n            {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; k < bank[i].Length; k++)\n                {\n                    if (bank[i][k] != gene[k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (bank[i] == endGene) return level + 1;\n                used[i] = true;\n                next.Add(bank[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return startGene == endGene ? 0 : -1;\n}`,
              go: `func minMutation(startGene string, endGene string, bank []string) int {\n	used := make([]bool, len(bank))\n	frontier := []string{startGene}\n	level := 0\n	for len(frontier) > 0 {\n		next := []string{}\n		for _, gene := range frontier {\n			for i := 0; i < len(bank); i++ {\n				if used[i] {\n					continue\n				}\n				diff := 0\n				for k := 0; k < len(bank[i]); k++ {\n					if bank[i][k] != gene[k] {\n						diff++\n					}\n				}\n				if diff != 1 {\n					continue\n				}\n				if bank[i] == endGene {\n					return level + 1\n				}\n				used[i] = true\n				next = append(next, bank[i])\n			}\n		}\n		frontier = next\n		level++\n	}\n	if startGene == endGene {\n		return 0\n	}\n	return -1\n}`,
              kotlin: `fun minMutation(startGene: String, endGene: String, bank: Array<String>): Int {\n    val used = BooleanArray(bank.size)\n    var frontier = ArrayList<String>()\n    frontier.add(startGene)\n    var level = 0\n    while (frontier.isNotEmpty()) {\n        val next = ArrayList<String>()\n        for (gene in frontier) {\n            for (i in bank.indices) {\n                if (used[i]) continue\n                var diff = 0\n                for (k in bank[i].indices) {\n                    if (bank[i][k] != gene[k]) diff++\n                }\n                if (diff != 1) continue\n                if (bank[i] == endGene) return level + 1\n                used[i] = true\n                next.add(bank[i])\n            }\n        }\n        frontier = next\n        level++\n    }\n    return if (startGene == endGene) 0 else -1\n}`,
              swift: `func minMutation(_ startGene: String, _ endGene: String, _ bank: [String]) -> Int {\n    let bankChars = bank.map { Array($0) }\n    var used = [Bool](repeating: false, count: bank.count)\n    var frontier: [[Character]] = [Array(startGene)]\n    var level = 0\n    while !frontier.isEmpty {\n        var next: [[Character]] = []\n        for gene in frontier {\n            for i in 0..<bank.count {\n                if used[i] { continue }\n                var diff = 0\n                for k in 0..<bankChars[i].count {\n                    if bankChars[i][k] != gene[k] { diff += 1 }\n                }\n                if diff != 1 { continue }\n                if bank[i] == endGene { return level + 1 }\n                used[i] = true\n                next.append(bankChars[i])\n            }\n        }\n        frontier = next\n        level += 1\n    }\n    return startGene == endGene ? 0 : -1\n}`,
              rust: `fn minMutation(startGene: String, endGene: String, bank: Vec<String>) -> i32 {\n    let mut used = vec![false; bank.len()];\n    let mut frontier: Vec<String> = vec![startGene.clone()];\n    let mut level = 0i32;\n    while !frontier.is_empty() {\n        let mut next: Vec<String> = Vec::new();\n        for gene in frontier.iter() {\n            let gene_bytes: Vec<u8> = gene.bytes().collect();\n            for i in 0..bank.len() {\n                if used[i] {\n                    continue;\n                }\n                let candidate: Vec<u8> = bank[i].bytes().collect();\n                let mut diff = 0;\n                for k in 0..candidate.len() {\n                    if candidate[k] != gene_bytes[k] {\n                        diff += 1;\n                    }\n                }\n                if diff != 1 {\n                    continue;\n                }\n                if bank[i] == endGene {\n                    return level + 1;\n                }\n                used[i] = true;\n                next.push(bank[i].clone());\n            }\n        }\n        frontier = next;\n        level += 1;\n    }\n    if startGene == endGene { 0 } else { -1 }\n}`,
              php: `function minMutation($startGene, $endGene, $bank) {\n    $used = array_fill(0, max(count($bank), 1), false);\n    $frontier = array($startGene);\n    $level = 0;\n    while (count($frontier) > 0) {\n        $next = array();\n        foreach ($frontier as $gene) {\n            for ($i = 0; $i < count($bank); $i++) {\n                if ($used[$i]) continue;\n                $diff = 0;\n                for ($k = 0; $k < strlen($bank[$i]); $k++) {\n                    if ($bank[$i][$k] !== $gene[$k]) $diff++;\n                }\n                if ($diff !== 1) continue;\n                if ($bank[$i] === $endGene) return $level + 1;\n                $used[$i] = true;\n                $next[] = $bank[$i];\n            }\n        }\n        $frontier = $next;\n        $level++;\n    }\n    return $startGene === $endGene ? 0 : -1;\n}`,
              ruby: `def minMutation(startGene, endGene, bank)\n  used = Array.new(bank.length, false)\n  frontier = [startGene]\n  level = 0\n  while !frontier.empty?\n    nxt = []\n    frontier.each do |gene|\n      bank.each_with_index do |candidate, i|\n        next if used[i]\n        diff = 0\n        (0...candidate.length).each { |k| diff += 1 if candidate[k] != gene[k] }\n        next if diff != 1\n        return level + 1 if candidate == endGene\n        used[i] = true\n        nxt.push(candidate)\n      end\n    end\n    frontier = nxt\n    level += 1\n  end\n  startGene == endGene ? 0 : -1\nend`,
      },
    };
  })(),

  // ── Word Ladder ─────────────────────────────────────────────────
  (() => {
    const ref = (beginWord: string, endWord: string, wordList: string[]) => {
      const used: boolean[] = wordList.map(() => false);
      let frontier: string[] = [beginWord];
      let level = 1;
      while (frontier.length > 0) {
        const next: string[] = [];
        for (let f = 0; f < frontier.length; f++) {
          for (let i = 0; i < wordList.length; i++) {
            if (used[i]) continue;
            let diff = 0;
            for (let k = 0; k < wordList[i].length; k++) {
              if (wordList[i][k] !== frontier[f][k]) diff++;
            }
            if (diff !== 1) continue;
            if (wordList[i] === endWord) return level + 1;
            used[i] = true;
            next.push(wordList[i]);
          }
        }
        frontier = next;
        level++;
      }
      return 0;
    };
    return {
      slug: "word-ladder",
      title: "Word Ladder",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Breadth-First Search", "Amazon", "Google", "Meta", "Microsoft", "LinkedIn"],
      signature: {
        funcName: "ladderLength",
        params: [
          { name: "beginWord", type: "string" as const },
          { name: "endWord", type: "string" as const },
          { name: "wordList", type: "string[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A **transformation sequence** from `beginWord` to `endWord` is a chain of words where every adjacent pair differs by exactly one letter and every word after the first appears in `wordList`.\n\nReturn the number of words in the shortest such sequence, or `0` if none exists.",
        [
          { in: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', out: "5" },
          { in: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', out: "0", note: "endWord is not in wordList." },
          { in: 'beginWord = "a", endWord = "c", wordList = ["a","b","c"]', out: "2" },
        ],
        ["1 <= beginWord.length <= 6", "All words have the same length.", "1 <= wordList.length <= 20", "beginWord != endWord", "All words consist of lowercase English letters."]),
      hints: [
        "Every transformation costs the same, so breadth-first search finds the shortest chain.",
        "Expand a word to every **unused** list entry that differs from it in exactly one position.",
        "Count words rather than steps: the answer is one more than the number of transformations.",
      ],
      examples: [
        { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', expectedOutput: "5" },
        { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log"]', expectedOutput: "0" },
        { input: '"a"\n"c"\n["a","b","c"]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const letters = "abcd";
        const length = ri(rng, 1, 5);
        const randWord = () => Array.from({ length }, () => letters[ri(rng, 0, letters.length - 1)]).join("");
        const beginWord = randWord();
        let endWord = randWord();
        const wordList: string[] = [];
        if (rng() < 0.55) {
          let current = beginWord;
          const steps = ri(rng, 1, 5);
          for (let s = 0; s < steps; s++) {
            const chars = current.split("");
            const at = ri(rng, 0, length - 1);
            let replacement = letters[ri(rng, 0, letters.length - 1)];
            while (replacement === chars[at]) replacement = letters[ri(rng, 0, letters.length - 1)];
            chars[at] = replacement;
            current = chars.join("");
            wordList.push(current);
          }
          endWord = current;
        }
        const noise = ri(rng, 0, Math.max(0, 20 - wordList.length));
        for (let i = 0; i < noise; i++) wordList.push(randWord());
        const finalList = shuffle(rng, wordList);
        if (beginWord === endWord) {
          // The problem guarantees the two ends differ.
          return { input: `"${beginWord}"\n"${endWord === letters[0].repeat(length) ? letters[1].repeat(length) : letters[0].repeat(length)}"\n${fmtStrArr(finalList)}`, expectedOutput: String(ref(beginWord, endWord === letters[0].repeat(length) ? letters[1].repeat(length) : letters[0].repeat(length), finalList)) };
        }
        return { input: `"${beginWord}"\n"${endWord}"\n${fmtStrArr(finalList)}`, expectedOutput: String(ref(beginWord, endWord, finalList)) };
      },
      solutions: {
        python: `def ladderLength(beginWord: str, endWord: str, wordList) -> int:\n    used = [False] * len(wordList)\n    frontier = [beginWord]\n    level = 1\n    while frontier:\n        nxt = []\n        for word in frontier:\n            for i, candidate in enumerate(wordList):\n                if used[i]:\n                    continue\n                diff = sum(1 for a, b in zip(candidate, word) if a != b)\n                if diff != 1:\n                    continue\n                if candidate == endWord:\n                    return level + 1\n                used[i] = True\n                nxt.append(candidate)\n        frontier = nxt\n        level += 1\n    return 0`,
        javascript: `var ladderLength = function(beginWord, endWord, wordList) {\n    const used = wordList.map(function() { return false; });\n    let frontier = [beginWord];\n    let level = 1;\n    while (frontier.length > 0) {\n        const next = [];\n        for (let f = 0; f < frontier.length; f++) {\n            for (let i = 0; i < wordList.length; i++) {\n                if (used[i]) continue;\n                let diff = 0;\n                for (let k = 0; k < wordList[i].length; k++) {\n                    if (wordList[i].charAt(k) !== frontier[f].charAt(k)) diff++;\n                }\n                if (diff !== 1) continue;\n                if (wordList[i] === endWord) return level + 1;\n                used[i] = true;\n                next.push(wordList[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return 0;\n};`,
              typescript: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {\n    var used: boolean[] = [];\n    for (var i = 0; i < wordList.length; i++) used.push(false);\n    var frontier: string[] = [beginWord];\n    var level = 1;\n    while (frontier.length > 0) {\n        var next: string[] = [];\n        for (var f = 0; f < frontier.length; f++) {\n            for (var j = 0; j < wordList.length; j++) {\n                if (used[j]) continue;\n                var diff = 0;\n                for (var k = 0; k < wordList[j].length; k++) {\n                    if (wordList[j].charAt(k) !== frontier[f].charAt(k)) diff++;\n                }\n                if (diff !== 1) continue;\n                if (wordList[j] === endWord) return level + 1;\n                used[j] = true;\n                next.push(wordList[j]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return 0;\n}`,
              java: `public static int ladderLength(String beginWord, String endWord, String[] wordList) {\n    boolean[] used = new boolean[wordList.length];\n    List<String> frontier = new ArrayList<>();\n    frontier.add(beginWord);\n    int level = 1;\n    while (!frontier.isEmpty()) {\n        List<String> next = new ArrayList<>();\n        for (String word : frontier) {\n            for (int i = 0; i < wordList.length; i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; k < wordList[i].length(); k++) {\n                    if (wordList[i].charAt(k) != word.charAt(k)) diff++;\n                }\n                if (diff != 1) continue;\n                if (wordList[i].equals(endWord)) return level + 1;\n                used[i] = true;\n                next.add(wordList[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return 0;\n}`,
              cpp: `int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n    vector<bool> used(wordList.size(), false);\n    vector<string> frontier;\n    frontier.push_back(beginWord);\n    int level = 1;\n    while (!frontier.empty()) {\n        vector<string> next;\n        for (const string& word : frontier) {\n            for (size_t i = 0; i < wordList.size(); i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (size_t k = 0; k < wordList[i].size(); k++) {\n                    if (wordList[i][k] != word[k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (wordList[i] == endWord) return level + 1;\n                used[i] = true;\n                next.push_back(wordList[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return 0;\n}`,
              c: `int ladderLength(const char* beginWord, const char* endWord, char** wordList, int wordListSize) {\n    char* used = (char*) calloc((size_t) (wordListSize > 0 ? wordListSize : 1), sizeof(char));\n    char** frontier = (char**) malloc((size_t) (wordListSize + 2) * sizeof(char*));\n    char** next = (char**) malloc((size_t) (wordListSize + 2) * sizeof(char*));\n    int frontierCount = 0;\n    frontier[frontierCount++] = (char*) beginWord;\n    int level = 1;\n    int answer = 0;\n    while (frontierCount > 0 && answer == 0) {\n        int nextCount = 0;\n        for (int f = 0; f < frontierCount && answer == 0; f++) {\n            for (int i = 0; i < wordListSize; i++) {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; wordList[i][k] != '\\0'; k++) {\n                    if (wordList[i][k] != frontier[f][k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (strcmp(wordList[i], endWord) == 0) {\n                    answer = level + 1;\n                    break;\n                }\n                used[i] = 1;\n                next[nextCount++] = wordList[i];\n            }\n        }\n        if (answer != 0) break;\n        for (int i = 0; i < nextCount; i++) frontier[i] = next[i];\n        frontierCount = nextCount;\n        level++;\n    }\n    free(used);\n    free(frontier);\n    free(next);\n    return answer;\n}`,
              csharp: `public static int LadderLength(string beginWord, string endWord, string[] wordList)\n{\n    bool[] used = new bool[wordList.Length];\n    var frontier = new List<string>();\n    frontier.Add(beginWord);\n    int level = 1;\n    while (frontier.Count > 0)\n    {\n        var next = new List<string>();\n        foreach (string word in frontier)\n        {\n            for (int i = 0; i < wordList.Length; i++)\n            {\n                if (used[i]) continue;\n                int diff = 0;\n                for (int k = 0; k < wordList[i].Length; k++)\n                {\n                    if (wordList[i][k] != word[k]) diff++;\n                }\n                if (diff != 1) continue;\n                if (wordList[i] == endWord) return level + 1;\n                used[i] = true;\n                next.Add(wordList[i]);\n            }\n        }\n        frontier = next;\n        level++;\n    }\n    return 0;\n}`,
              go: `func ladderLength(beginWord string, endWord string, wordList []string) int {\n	used := make([]bool, len(wordList))\n	frontier := []string{beginWord}\n	level := 1\n	for len(frontier) > 0 {\n		next := []string{}\n		for _, word := range frontier {\n			for i := 0; i < len(wordList); i++ {\n				if used[i] {\n					continue\n				}\n				diff := 0\n				for k := 0; k < len(wordList[i]); k++ {\n					if wordList[i][k] != word[k] {\n						diff++\n					}\n				}\n				if diff != 1 {\n					continue\n				}\n				if wordList[i] == endWord {\n					return level + 1\n				}\n				used[i] = true\n				next = append(next, wordList[i])\n			}\n		}\n		frontier = next\n		level++\n	}\n	return 0\n}`,
              kotlin: `fun ladderLength(beginWord: String, endWord: String, wordList: Array<String>): Int {\n    val used = BooleanArray(wordList.size)\n    var frontier = ArrayList<String>()\n    frontier.add(beginWord)\n    var level = 1\n    while (frontier.isNotEmpty()) {\n        val next = ArrayList<String>()\n        for (word in frontier) {\n            for (i in wordList.indices) {\n                if (used[i]) continue\n                var diff = 0\n                for (k in wordList[i].indices) {\n                    if (wordList[i][k] != word[k]) diff++\n                }\n                if (diff != 1) continue\n                if (wordList[i] == endWord) return level + 1\n                used[i] = true\n                next.add(wordList[i])\n            }\n        }\n        frontier = next\n        level++\n    }\n    return 0\n}`,
              swift: `func ladderLength(_ beginWord: String, _ endWord: String, _ wordList: [String]) -> Int {\n    let listChars = wordList.map { Array($0) }\n    var used = [Bool](repeating: false, count: wordList.count)\n    var frontier: [[Character]] = [Array(beginWord)]\n    var level = 1\n    while !frontier.isEmpty {\n        var next: [[Character]] = []\n        for word in frontier {\n            for i in 0..<wordList.count {\n                if used[i] { continue }\n                var diff = 0\n                for k in 0..<listChars[i].count {\n                    if listChars[i][k] != word[k] { diff += 1 }\n                }\n                if diff != 1 { continue }\n                if wordList[i] == endWord { return level + 1 }\n                used[i] = true\n                next.append(listChars[i])\n            }\n        }\n        frontier = next\n        level += 1\n    }\n    return 0\n}`,
              rust: `fn ladderLength(beginWord: String, endWord: String, wordList: Vec<String>) -> i32 {\n    let mut used = vec![false; wordList.len()];\n    let mut frontier: Vec<String> = vec![beginWord];\n    let mut level = 1i32;\n    while !frontier.is_empty() {\n        let mut next: Vec<String> = Vec::new();\n        for word in frontier.iter() {\n            let word_bytes: Vec<u8> = word.bytes().collect();\n            for i in 0..wordList.len() {\n                if used[i] {\n                    continue;\n                }\n                let candidate: Vec<u8> = wordList[i].bytes().collect();\n                let mut diff = 0;\n                for k in 0..candidate.len() {\n                    if candidate[k] != word_bytes[k] {\n                        diff += 1;\n                    }\n                }\n                if diff != 1 {\n                    continue;\n                }\n                if wordList[i] == endWord {\n                    return level + 1;\n                }\n                used[i] = true;\n                next.push(wordList[i].clone());\n            }\n        }\n        frontier = next;\n        level += 1;\n    }\n    0\n}`,
              php: `function ladderLength($beginWord, $endWord, $wordList) {\n    $used = array_fill(0, max(count($wordList), 1), false);\n    $frontier = array($beginWord);\n    $level = 1;\n    while (count($frontier) > 0) {\n        $next = array();\n        foreach ($frontier as $word) {\n            for ($i = 0; $i < count($wordList); $i++) {\n                if ($used[$i]) continue;\n                $diff = 0;\n                for ($k = 0; $k < strlen($wordList[$i]); $k++) {\n                    if ($wordList[$i][$k] !== $word[$k]) $diff++;\n                }\n                if ($diff !== 1) continue;\n                if ($wordList[$i] === $endWord) return $level + 1;\n                $used[$i] = true;\n                $next[] = $wordList[$i];\n            }\n        }\n        $frontier = $next;\n        $level++;\n    }\n    return 0;\n}`,
              ruby: `def ladderLength(beginWord, endWord, wordList)\n  used = Array.new(wordList.length, false)\n  frontier = [beginWord]\n  level = 1\n  while !frontier.empty?\n    nxt = []\n    frontier.each do |word|\n      wordList.each_with_index do |candidate, i|\n        next if used[i]\n        diff = 0\n        (0...candidate.length).each { |k| diff += 1 if candidate[k] != word[k] }\n        next if diff != 1\n        return level + 1 if candidate == endWord\n        used[i] = true\n        nxt.push(candidate)\n      end\n    end\n    frontier = nxt\n    level += 1\n  end\n  0\nend`,
      },
    };
  })(),

  // ── Snakes and Ladders ──────────────────────────────────────────
  (() => {
    const ref = (board: number[][]) => {
      const n = board.length;
      const target = n * n;
      const valueAt = (square: number) => {
        const quotient = Math.floor((square - 1) / n);
        const remainder = (square - 1) % n;
        const row = n - 1 - quotient;
        const col = quotient % 2 === 0 ? remainder : n - 1 - remainder;
        return board[row][col];
      };
      const dist: number[] = [];
      for (let i = 0; i <= target; i++) dist.push(-1);
      dist[1] = 0;
      const queue: number[] = [1];
      let head = 0;
      while (head < queue.length) {
        const square = queue[head++];
        if (square === target) return dist[square];
        for (let step = 1; step <= 6 && square + step <= target; step++) {
          const landing = square + step;
          const jump = valueAt(landing);
          const destination = jump === -1 ? landing : jump;
          if (dist[destination] === -1) {
            dist[destination] = dist[square] + 1;
            queue.push(destination);
          }
        }
      }
      return -1;
    };
    return {
      slug: "snakes-and-ladders",
      title: "Snakes and Ladders",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "snakesAndLadders", params: [{ name: "board", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n x n` board whose squares are numbered `1` to `n²` in **boustrophedon** order: starting at the bottom-left and alternating direction each row.\n\nFrom square `x` you may move to any of `x+1 … x+6` that exists. If that square holds a value other than `-1`, you are immediately carried to that square instead. Return the least number of moves needed to reach square `n²`, or `-1` if it is unreachable.",
        [
          { in: "board = [[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,35,-1,-1,13,-1],[-1,-1,-1,-1,-1,-1],[-1,15,-1,-1,-1,-1]]", out: "4" },
          { in: "board = [[-1,-1],[-1,3]]", out: "1" },
          { in: "board = [[-1,-1,-1],[-1,9,8],[-1,8,9]]", out: "1" },
        ],
        ["2 <= board.length <= 8", "board[i].length == board.length", "board[i][j] is -1 or in the range [1, n²]", "Squares 1 and n² never carry a snake or ladder."]),
      hints: [
        "Every move costs one, so breadth-first search over the squares finds the minimum.",
        "The trickiest part is the numbering — write a helper that maps a square number to its row and column.",
        "A snake or ladder is taken **once** on landing; do not follow a chain of them.",
      ],
      examples: [
        { input: "[[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[-1,35,-1,-1,13,-1],[-1,-1,-1,-1,-1,-1],[-1,15,-1,-1,-1,-1]]", expectedOutput: "4" },
        { input: "[[-1,-1],[-1,3]]", expectedOutput: "1" },
        { input: "[[-1,-1,-1],[-1,9,8],[-1,8,9]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 8);
        const total = n * n;
        const board = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < 0.3 ? ri(rng, 1, total) : -1)));
        // Squares 1 and n*n never carry a snake or ladder.
        const clear = (square: number) => {
          const quotient = Math.floor((square - 1) / n);
          const remainder = (square - 1) % n;
          const row = n - 1 - quotient;
          const col = quotient % 2 === 0 ? remainder : n - 1 - remainder;
          board[row][col] = -1;
        };
        clear(1);
        clear(total);
        return { input: fmtIntMat(board), expectedOutput: String(ref(board)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef snakesAndLadders(board) -> int:\n    n = len(board)\n    target = n * n\n\n    def value_at(square):\n        quotient, remainder = divmod(square - 1, n)\n        row = n - 1 - quotient\n        col = remainder if quotient % 2 == 0 else n - 1 - remainder\n        return board[row][col]\n\n    dist = [-1] * (target + 1)\n    dist[1] = 0\n    queue = deque([1])\n    while queue:\n        square = queue.popleft()\n        if square == target:\n            return dist[square]\n        for step in range(1, 7):\n            landing = square + step\n            if landing > target:\n                break\n            jump = value_at(landing)\n            destination = landing if jump == -1 else jump\n            if dist[destination] == -1:\n                dist[destination] = dist[square] + 1\n                queue.append(destination)\n    return -1`,
        javascript: `var snakesAndLadders = function(board) {\n    const n = board.length;\n    const target = n * n;\n    const valueAt = function(square) {\n        const quotient = Math.floor((square - 1) / n);\n        const remainder = (square - 1) % n;\n        const row = n - 1 - quotient;\n        const col = quotient % 2 === 0 ? remainder : n - 1 - remainder;\n        return board[row][col];\n    };\n    const dist = [];\n    for (let i = 0; i <= target; i++) dist.push(-1);\n    dist[1] = 0;\n    const queue = [1];\n    let head = 0;\n    while (head < queue.length) {\n        const square = queue[head++];\n        if (square === target) return dist[square];\n        for (let step = 1; step <= 6 && square + step <= target; step++) {\n            const landing = square + step;\n            const jump = valueAt(landing);\n            const destination = jump === -1 ? landing : jump;\n            if (dist[destination] === -1) {\n                dist[destination] = dist[square] + 1;\n                queue.push(destination);\n            }\n        }\n    }\n    return -1;\n};`,
              typescript: `function snakesAndLadders(board: number[][]): number {\n    var n = board.length;\n    var target = n * n;\n    var valueAt = function (square: number): number {\n        var quotient = Math.floor((square - 1) / n);\n        var remainder = (square - 1) % n;\n        var row = n - 1 - quotient;\n        var col = quotient % 2 === 0 ? remainder : n - 1 - remainder;\n        return board[row][col];\n    };\n    var dist: number[] = [];\n    for (var i = 0; i <= target; i++) dist.push(-1);\n    dist[1] = 0;\n    var queue: number[] = [1];\n    var head = 0;\n    while (head < queue.length) {\n        var square = queue[head++];\n        if (square === target) return dist[square];\n        for (var step = 1; step <= 6 && square + step <= target; step++) {\n            var landing = square + step;\n            var jump = valueAt(landing);\n            var destination = jump === -1 ? landing : jump;\n            if (dist[destination] === -1) {\n                dist[destination] = dist[square] + 1;\n                queue.push(destination);\n            }\n        }\n    }\n    return -1;\n}`,
              java: `public static int snakesAndLadders(int[][] board) {\n    int n = board.length;\n    int target = n * n;\n    int[] dist = new int[target + 1];\n    Arrays.fill(dist, -1);\n    dist[1] = 0;\n    Deque<Integer> queue = new ArrayDeque<>();\n    queue.addLast(1);\n    while (!queue.isEmpty()) {\n        int square = queue.pollFirst();\n        if (square == target) return dist[square];\n        for (int step = 1; step <= 6 && square + step <= target; step++) {\n            int landing = square + step;\n            int quotient = (landing - 1) / n;\n            int remainder = (landing - 1) % n;\n            int row = n - 1 - quotient;\n            int col = quotient % 2 == 0 ? remainder : n - 1 - remainder;\n            int jump = board[row][col];\n            int destination = jump == -1 ? landing : jump;\n            if (dist[destination] == -1) {\n                dist[destination] = dist[square] + 1;\n                queue.addLast(destination);\n            }\n        }\n    }\n    return -1;\n}`,
              cpp: `int snakesAndLadders(vector<vector<int>>& board) {\n    int n = (int) board.size();\n    int target = n * n;\n    vector<int> dist(target + 1, -1);\n    dist[1] = 0;\n    vector<int> queue;\n    queue.push_back(1);\n    size_t head = 0;\n    while (head < queue.size()) {\n        int square = queue[head++];\n        if (square == target) return dist[square];\n        for (int step = 1; step <= 6 && square + step <= target; step++) {\n            int landing = square + step;\n            int quotient = (landing - 1) / n;\n            int remainder = (landing - 1) % n;\n            int row = n - 1 - quotient;\n            int col = quotient % 2 == 0 ? remainder : n - 1 - remainder;\n            int jump = board[row][col];\n            int destination = jump == -1 ? landing : jump;\n            if (dist[destination] == -1) {\n                dist[destination] = dist[square] + 1;\n                queue.push_back(destination);\n            }\n        }\n    }\n    return -1;\n}`,
              c: `int snakesAndLadders(int** board, int boardSize, int* boardColSize) {\n    int n = boardSize;\n    int target = n * n;\n    int* dist = (int*) malloc((size_t) (target + 1) * sizeof(int));\n    for (int i = 0; i <= target; i++) dist[i] = -1;\n    int* queue = (int*) malloc((size_t) (target + 1) * sizeof(int));\n    int head = 0, tail = 0;\n    dist[1] = 0;\n    queue[tail++] = 1;\n    int answer = -1;\n    while (head < tail) {\n        int square = queue[head++];\n        if (square == target) {\n            answer = dist[square];\n            break;\n        }\n        for (int step = 1; step <= 6 && square + step <= target; step++) {\n            int landing = square + step;\n            int quotient = (landing - 1) / n;\n            int remainder = (landing - 1) % n;\n            int row = n - 1 - quotient;\n            int col = quotient % 2 == 0 ? remainder : n - 1 - remainder;\n            int jump = board[row][col];\n            int destination = jump == -1 ? landing : jump;\n            if (dist[destination] == -1) {\n                dist[destination] = dist[square] + 1;\n                queue[tail++] = destination;\n            }\n        }\n    }\n    free(dist);\n    free(queue);\n    return answer;\n}`,
              csharp: `public static int SnakesAndLadders(int[][] board)\n{\n    int n = board.Length;\n    int target = n * n;\n    int[] dist = new int[target + 1];\n    for (int i = 0; i <= target; i++) dist[i] = -1;\n    dist[1] = 0;\n    var queue = new Queue<int>();\n    queue.Enqueue(1);\n    while (queue.Count > 0)\n    {\n        int square = queue.Dequeue();\n        if (square == target) return dist[square];\n        for (int step = 1; step <= 6 && square + step <= target; step++)\n        {\n            int landing = square + step;\n            int quotient = (landing - 1) / n;\n            int remainder = (landing - 1) % n;\n            int row = n - 1 - quotient;\n            int col = quotient % 2 == 0 ? remainder : n - 1 - remainder;\n            int jump = board[row][col];\n            int destination = jump == -1 ? landing : jump;\n            if (dist[destination] == -1)\n            {\n                dist[destination] = dist[square] + 1;\n                queue.Enqueue(destination);\n            }\n        }\n    }\n    return -1;\n}`,
              go: `func snakesAndLadders(board [][]int) int {\n	n := len(board)\n	target := n * n\n	dist := make([]int, target+1)\n	for i := range dist {\n		dist[i] = -1\n	}\n	dist[1] = 0\n	queue := []int{1}\n	head := 0\n	for head < len(queue) {\n		square := queue[head]\n		head++\n		if square == target {\n			return dist[square]\n		}\n		for step := 1; step <= 6 && square+step <= target; step++ {\n			landing := square + step\n			quotient := (landing - 1) / n\n			remainder := (landing - 1) % n\n			row := n - 1 - quotient\n			col := remainder\n			if quotient%2 != 0 {\n				col = n - 1 - remainder\n			}\n			jump := board[row][col]\n			destination := landing\n			if jump != -1 {\n				destination = jump\n			}\n			if dist[destination] == -1 {\n				dist[destination] = dist[square] + 1\n				queue = append(queue, destination)\n			}\n		}\n	}\n	return -1\n}`,
              kotlin: `fun snakesAndLadders(board: Array<IntArray>): Int {\n    val n = board.size\n    val target = n * n\n    val dist = IntArray(target + 1) { -1 }\n    dist[1] = 0\n    val queue = ArrayList<Int>()\n    queue.add(1)\n    var head = 0\n    while (head < queue.size) {\n        val square = queue[head++]\n        if (square == target) return dist[square]\n        var step = 1\n        while (step <= 6 && square + step <= target) {\n            val landing = square + step\n            val quotient = (landing - 1) / n\n            val remainder = (landing - 1) % n\n            val row = n - 1 - quotient\n            val col = if (quotient % 2 == 0) remainder else n - 1 - remainder\n            val jump = board[row][col]\n            val destination = if (jump == -1) landing else jump\n            if (dist[destination] == -1) {\n                dist[destination] = dist[square] + 1\n                queue.add(destination)\n            }\n            step++\n        }\n    }\n    return -1\n}`,
              swift: `func snakesAndLadders(_ board: [[Int]]) -> Int {\n    let n = board.count\n    let target = n * n\n    var dist = [Int](repeating: -1, count: target + 1)\n    dist[1] = 0\n    var queue = [1]\n    var head = 0\n    while head < queue.count {\n        let square = queue[head]\n        head += 1\n        if square == target { return dist[square] }\n        var step = 1\n        while step <= 6 && square + step <= target {\n            let landing = square + step\n            let quotient = (landing - 1) / n\n            let remainder = (landing - 1) % n\n            let row = n - 1 - quotient\n            let col = quotient % 2 == 0 ? remainder : n - 1 - remainder\n            let jump = board[row][col]\n            let destination = jump == -1 ? landing : jump\n            if dist[destination] == -1 {\n                dist[destination] = dist[square] + 1\n                queue.append(destination)\n            }\n            step += 1\n        }\n    }\n    return -1\n}`,
              rust: `fn snakesAndLadders(board: Vec<Vec<i32>>) -> i32 {\n    let n = board.len() as i32;\n    let target = n * n;\n    let mut dist = vec![-1i32; (target + 1) as usize];\n    dist[1] = 0;\n    let mut queue: Vec<i32> = vec![1];\n    let mut head = 0usize;\n    while head < queue.len() {\n        let square = queue[head];\n        head += 1;\n        if square == target {\n            return dist[square as usize];\n        }\n        let mut step = 1i32;\n        while step <= 6 && square + step <= target {\n            let landing = square + step;\n            let quotient = (landing - 1) / n;\n            let remainder = (landing - 1) % n;\n            let row = (n - 1 - quotient) as usize;\n            let col = if quotient % 2 == 0 { remainder } else { n - 1 - remainder } as usize;\n            let jump = board[row][col];\n            let destination = if jump == -1 { landing } else { jump };\n            if dist[destination as usize] == -1 {\n                dist[destination as usize] = dist[square as usize] + 1;\n                queue.push(destination);\n            }\n            step += 1;\n        }\n    }\n    -1\n}`,
              php: `function snakesAndLadders($board) {\n    $n = count($board);\n    $target = $n * $n;\n    $dist = array_fill(0, $target + 1, -1);\n    $dist[1] = 0;\n    $queue = array(1);\n    $head = 0;\n    while ($head < count($queue)) {\n        $square = $queue[$head++];\n        if ($square === $target) return $dist[$square];\n        for ($step = 1; $step <= 6 && $square + $step <= $target; $step++) {\n            $landing = $square + $step;\n            $quotient = intdiv($landing - 1, $n);\n            $remainder = ($landing - 1) % $n;\n            $row = $n - 1 - $quotient;\n            $col = $quotient % 2 === 0 ? $remainder : $n - 1 - $remainder;\n            $jump = $board[$row][$col];\n            $destination = $jump === -1 ? $landing : $jump;\n            if ($dist[$destination] === -1) {\n                $dist[$destination] = $dist[$square] + 1;\n                $queue[] = $destination;\n            }\n        }\n    }\n    return -1;\n}`,
              ruby: `def snakesAndLadders(board)\n  n = board.length\n  target = n * n\n  dist = Array.new(target + 1, -1)\n  dist[1] = 0\n  queue = [1]\n  head = 0\n  while head < queue.length\n    square = queue[head]\n    head += 1\n    return dist[square] if square == target\n    step = 1\n    while step <= 6 && square + step <= target\n      landing = square + step\n      quotient = (landing - 1) / n\n      remainder = (landing - 1) % n\n      row = n - 1 - quotient\n      col = quotient.even? ? remainder : n - 1 - remainder\n      jump = board[row][col]\n      destination = jump == -1 ? landing : jump\n      if dist[destination] == -1\n        dist[destination] = dist[square] + 1\n        queue.push(destination)\n      end\n      step += 1\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Pacific Atlantic Water Flow ─────────────────────────────────
  (() => {
    const ref = (heights: number[][]) => {
      const rows = heights.length;
      const cols = heights[0].length;
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      const flow = (starts: number[][]) => {
        const seen: boolean[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: boolean[] = [];
          for (let c = 0; c < cols; c++) row.push(false);
          seen.push(row);
        }
        const stack: number[][] = [];
        for (let i = 0; i < starts.length; i++) {
          seen[starts[i][0]][starts[i][1]] = true;
          stack.push(starts[i]);
        }
        while (stack.length > 0) {
          const cell = stack.pop() as number[];
          for (let d = 0; d < 4; d++) {
            const nr = cell[0] + dr[d];
            const nc = cell[1] + dc[d];
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;
            if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue;
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
        return seen;
      };
      const pacificStarts: number[][] = [];
      const atlanticStarts: number[][] = [];
      for (let c = 0; c < cols; c++) {
        pacificStarts.push([0, c]);
        atlanticStarts.push([rows - 1, c]);
      }
      for (let r = 0; r < rows; r++) {
        pacificStarts.push([r, 0]);
        atlanticStarts.push([r, cols - 1]);
      }
      const pacific = flow(pacificStarts);
      const atlantic = flow(atlanticStarts);
      const out: number[][] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (pacific[r][c] && atlantic[r][c]) out.push([r, c]);
        }
      }
      return out;
    };
    return {
      slug: "pacific-atlantic-water-flow",
      title: "Pacific Atlantic Water Flow",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Breadth-First Search", "Matrix", "Amazon", "Google", "Meta", "Apple"],
      signature: { funcName: "pacificAtlantic", params: [{ name: "heights", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `m x n` matrix `heights` of island cell heights. The **Pacific** touches the top and left edges; the **Atlantic** touches the bottom and right edges.\n\nWater flows from a cell to a neighbouring cell (up, down, left or right) only if that neighbour is at the same height or lower. Return every cell from which water can reach **both** oceans, as `[row, col]` pairs sorted by row and then column.",
        [
          { in: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", out: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" },
          { in: "heights = [[1]]", out: "[[0,0]]" },
          { in: "heights = [[2,1],[1,2]]", out: "[[0,0],[0,1],[1,0],[1,1]]" },
        ],
        ["1 <= heights.length, heights[i].length <= 10", "0 <= heights[i][j] <= 100000"]),
      hints: [
        "Searching downhill from every cell is quadratic — search **uphill** from the oceans instead.",
        "Flood inward from all Pacific-edge cells at once, moving only to neighbours of equal or greater height, then repeat for the Atlantic.",
        "The answer is the intersection of the two reachable sets.",
      ],
      examples: [
        { input: "[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", expectedOutput: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" },
        { input: "[[1]]", expectedOutput: "[[0,0]]" },
        { input: "[[2,1],[1,2]]", expectedOutput: "[[0,0],[0,1],[1,0],[1,1]]" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 10);
        const cols = ri(rng, 1, 10);
        const hi = rng() < 0.6 ? 8 : 100000;
        const heights = randGrid(rng, rows, cols, 0, hi);
        return { input: fmtIntMat(heights), expectedOutput: fmtIntMat(ref(heights)) };
      },
      solutions: {
        python: `def pacificAtlantic(heights):\n    rows, cols = len(heights), len(heights[0])\n\n    def flow(starts):\n        seen = [[False] * cols for _ in range(rows)]\n        stack = []\n        for r, c in starts:\n            seen[r][c] = True\n            stack.append((r, c))\n        while stack:\n            r, c = stack.pop()\n            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n                if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc]:\n                    if heights[nr][nc] >= heights[r][c]:\n                        seen[nr][nc] = True\n                        stack.append((nr, nc))\n        return seen\n\n    pacific_starts = [(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)]\n    atlantic_starts = [(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)]\n    pacific = flow(pacific_starts)\n    atlantic = flow(atlantic_starts)\n    return [[r, c] for r in range(rows) for c in range(cols) if pacific[r][c] and atlantic[r][c]]`,
        javascript: `var pacificAtlantic = function(heights) {\n    const rows = heights.length, cols = heights[0].length;\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    const flow = function(starts) {\n        const seen = [];\n        for (let r = 0; r < rows; r++) {\n            const row = [];\n            for (let c = 0; c < cols; c++) row.push(false);\n            seen.push(row);\n        }\n        const stack = [];\n        for (let i = 0; i < starts.length; i++) {\n            seen[starts[i][0]][starts[i][1]] = true;\n            stack.push(starts[i]);\n        }\n        while (stack.length > 0) {\n            const cell = stack.pop();\n            for (let d = 0; d < 4; d++) {\n                const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n                if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen;\n    };\n    const pacificStarts = [], atlanticStarts = [];\n    for (let c = 0; c < cols; c++) {\n        pacificStarts.push([0, c]);\n        atlanticStarts.push([rows - 1, c]);\n    }\n    for (let r = 0; r < rows; r++) {\n        pacificStarts.push([r, 0]);\n        atlanticStarts.push([r, cols - 1]);\n    }\n    const pacific = flow(pacificStarts);\n    const atlantic = flow(atlanticStarts);\n    const out = [];\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (pacific[r][c] && atlantic[r][c]) out.push([r, c]);\n        }\n    }\n    return out;\n};`,
              typescript: `function pacificAtlantic(heights: number[][]): number[][] {\n    var rows = heights.length;\n    var cols = heights[0].length;\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var flow = function (starts: number[][]): boolean[][] {\n        var seen: boolean[][] = [];\n        for (var r = 0; r < rows; r++) {\n            var row: boolean[] = [];\n            for (var c = 0; c < cols; c++) row.push(false);\n            seen.push(row);\n        }\n        var stack: number[][] = [];\n        for (var i = 0; i < starts.length; i++) {\n            seen[starts[i][0]][starts[i][1]] = true;\n            stack.push(starts[i]);\n        }\n        while (stack.length > 0) {\n            var cell = stack.pop() as number[];\n            for (var d = 0; d < 4; d++) {\n                var nr = cell[0] + dr[d];\n                var nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n                if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen;\n    };\n    var pacificStarts: number[][] = [];\n    var atlanticStarts: number[][] = [];\n    for (var c2 = 0; c2 < cols; c2++) {\n        pacificStarts.push([0, c2]);\n        atlanticStarts.push([rows - 1, c2]);\n    }\n    for (var r2 = 0; r2 < rows; r2++) {\n        pacificStarts.push([r2, 0]);\n        atlanticStarts.push([r2, cols - 1]);\n    }\n    var pacific = flow(pacificStarts);\n    var atlantic = flow(atlanticStarts);\n    var out: number[][] = [];\n    for (var r3 = 0; r3 < rows; r3++) {\n        for (var c3 = 0; c3 < cols; c3++) {\n            if (pacific[r3][c3] && atlantic[r3][c3]) out.push([r3, c3]);\n        }\n    }\n    return out;\n}`,
              java: `private static boolean[][] oceanFlow(int[][] heights, List<int[]> starts) {\n    int rows = heights.length, cols = heights[0].length;\n    boolean[][] seen = new boolean[rows][cols];\n    Deque<int[]> stack = new ArrayDeque<>();\n    for (int[] s : starts) {\n        seen[s[0]][s[1]] = true;\n        stack.push(s);\n    }\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n            if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue;\n            seen[nr][nc] = true;\n            stack.push(new int[]{nr, nc});\n        }\n    }\n    return seen;\n}\n\npublic static int[][] pacificAtlantic(int[][] heights) {\n    int rows = heights.length, cols = heights[0].length;\n    List<int[]> pacificStarts = new ArrayList<>();\n    List<int[]> atlanticStarts = new ArrayList<>();\n    for (int c = 0; c < cols; c++) {\n        pacificStarts.add(new int[]{0, c});\n        atlanticStarts.add(new int[]{rows - 1, c});\n    }\n    for (int r = 0; r < rows; r++) {\n        pacificStarts.add(new int[]{r, 0});\n        atlanticStarts.add(new int[]{r, cols - 1});\n    }\n    boolean[][] pacific = oceanFlow(heights, pacificStarts);\n    boolean[][] atlantic = oceanFlow(heights, atlanticStarts);\n    List<int[]> out = new ArrayList<>();\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (pacific[r][c] && atlantic[r][c]) out.add(new int[]{r, c});\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `static vector<vector<bool>> oceanFlow(vector<vector<int>>& heights, vector<pair<int,int>>& starts) {\n    int rows = (int) heights.size(), cols = (int) heights[0].size();\n    vector<vector<bool>> seen(rows, vector<bool>(cols, false));\n    vector<pair<int,int>> stack;\n    for (const auto& s : starts) {\n        seen[s.first][s.second] = true;\n        stack.push_back(s);\n    }\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (!stack.empty()) {\n        pair<int,int> cell = stack.back();\n        stack.pop_back();\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue;\n            if (heights[nr][nc] < heights[cell.first][cell.second]) continue;\n            seen[nr][nc] = true;\n            stack.push_back(make_pair(nr, nc));\n        }\n    }\n    return seen;\n}\n\nvector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n    int rows = (int) heights.size(), cols = (int) heights[0].size();\n    vector<pair<int,int>> pacificStarts, atlanticStarts;\n    for (int c = 0; c < cols; c++) {\n        pacificStarts.push_back(make_pair(0, c));\n        atlanticStarts.push_back(make_pair(rows - 1, c));\n    }\n    for (int r = 0; r < rows; r++) {\n        pacificStarts.push_back(make_pair(r, 0));\n        atlanticStarts.push_back(make_pair(r, cols - 1));\n    }\n    vector<vector<bool>> pacific = oceanFlow(heights, pacificStarts);\n    vector<vector<bool>> atlantic = oceanFlow(heights, atlanticStarts);\n    vector<vector<int>> out;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (pacific[r][c] && atlantic[r][c]) out.push_back(vector<int>{r, c});\n        }\n    }\n    return out;\n}`,
              c: `static void oceanFlow(int** heights, int rows, int cols, int fromTopLeft, char* seen) {\n    int* stack = (int*) malloc((size_t) (rows * cols) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < rows * cols; i++) seen[i] = 0;\n    if (fromTopLeft) {\n        for (int c = 0; c < cols; c++) {\n            if (!seen[c]) {\n                seen[c] = 1;\n                stack[top++] = c;\n            }\n        }\n        for (int r = 0; r < rows; r++) {\n            if (!seen[r * cols]) {\n                seen[r * cols] = 1;\n                stack[top++] = r * cols;\n            }\n        }\n    } else {\n        for (int c = 0; c < cols; c++) {\n            int index = (rows - 1) * cols + c;\n            if (!seen[index]) {\n                seen[index] = 1;\n                stack[top++] = index;\n            }\n        }\n        for (int r = 0; r < rows; r++) {\n            int index = r * cols + (cols - 1);\n            if (!seen[index]) {\n                seen[index] = 1;\n                stack[top++] = index;\n            }\n        }\n    }\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (top > 0) {\n        int cell = stack[--top];\n        int cr = cell / cols, cc = cell % cols;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr * cols + nc]) continue;\n            if (heights[nr][nc] < heights[cr][cc]) continue;\n            seen[nr * cols + nc] = 1;\n            stack[top++] = nr * cols + nc;\n        }\n    }\n    free(stack);\n}\n\nint** pacificAtlantic(int** heights, int heightsSize, int* heightsColSize, int* returnSize, int** returnColumnSizes) {\n    int rows = heightsSize, cols = heightsColSize[0];\n    char* pacific = (char*) malloc((size_t) (rows * cols));\n    char* atlantic = (char*) malloc((size_t) (rows * cols));\n    oceanFlow(heights, rows, cols, 1, pacific);\n    oceanFlow(heights, rows, cols, 0, atlantic);\n    int** out = (int**) malloc((size_t) (rows * cols) * sizeof(int*));\n    int* cols_ = (int*) malloc((size_t) (rows * cols) * sizeof(int));\n    int count = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (pacific[r * cols + c] && atlantic[r * cols + c]) {\n                int* pair = (int*) malloc(2 * sizeof(int));\n                pair[0] = r;\n                pair[1] = c;\n                out[count] = pair;\n                cols_[count] = 2;\n                count++;\n            }\n        }\n    }\n    free(pacific);\n    free(atlantic);\n    *returnSize = count;\n    *returnColumnSizes = cols_;\n    return out;\n}`,
              csharp: `private static bool[,] OceanFlow(int[][] heights, List<int[]> starts)\n{\n    int rows = heights.Length, cols = heights[0].Length;\n    bool[,] seen = new bool[rows, cols];\n    var stack = new List<int[]>();\n    foreach (int[] s in starts)\n    {\n        seen[s[0], s[1]] = true;\n        stack.Add(s);\n    }\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (stack.Count > 0)\n    {\n        int[] cell = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr, nc]) continue;\n            if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue;\n            seen[nr, nc] = true;\n            stack.Add(new int[] { nr, nc });\n        }\n    }\n    return seen;\n}\n\npublic static int[][] PacificAtlantic(int[][] heights)\n{\n    int rows = heights.Length, cols = heights[0].Length;\n    var pacificStarts = new List<int[]>();\n    var atlanticStarts = new List<int[]>();\n    for (int c = 0; c < cols; c++)\n    {\n        pacificStarts.Add(new int[] { 0, c });\n        atlanticStarts.Add(new int[] { rows - 1, c });\n    }\n    for (int r = 0; r < rows; r++)\n    {\n        pacificStarts.Add(new int[] { r, 0 });\n        atlanticStarts.Add(new int[] { r, cols - 1 });\n    }\n    bool[,] pacific = OceanFlow(heights, pacificStarts);\n    bool[,] atlantic = OceanFlow(heights, atlanticStarts);\n    var out_ = new List<int[]>();\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (pacific[r, c] && atlantic[r, c]) out_.Add(new int[] { r, c });\n        }\n    }\n    return out_.ToArray();\n}`,
              go: `func oceanFlow(heights [][]int, starts [][2]int) [][]bool {\n	rows, cols := len(heights), len(heights[0])\n	seen := make([][]bool, rows)\n	for i := range seen {\n		seen[i] = make([]bool, cols)\n	}\n	stack := [][2]int{}\n	for _, s := range starts {\n		if !seen[s[0]][s[1]] {\n			seen[s[0]][s[1]] = true\n			stack = append(stack, s)\n		}\n	}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		for d := 0; d < 4; d++ {\n			nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] {\n				continue\n			}\n			if heights[nr][nc] < heights[cell[0]][cell[1]] {\n				continue\n			}\n			seen[nr][nc] = true\n			stack = append(stack, [2]int{nr, nc})\n		}\n	}\n	return seen\n}\n\nfunc pacificAtlantic(heights [][]int) [][]int {\n	rows, cols := len(heights), len(heights[0])\n	pacificStarts := [][2]int{}\n	atlanticStarts := [][2]int{}\n	for c := 0; c < cols; c++ {\n		pacificStarts = append(pacificStarts, [2]int{0, c})\n		atlanticStarts = append(atlanticStarts, [2]int{rows - 1, c})\n	}\n	for r := 0; r < rows; r++ {\n		pacificStarts = append(pacificStarts, [2]int{r, 0})\n		atlanticStarts = append(atlanticStarts, [2]int{r, cols - 1})\n	}\n	pacific := oceanFlow(heights, pacificStarts)\n	atlantic := oceanFlow(heights, atlanticStarts)\n	out := [][]int{}\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if pacific[r][c] && atlantic[r][c] {\n				out = append(out, []int{r, c})\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun oceanFlow(heights: Array<IntArray>, starts: List<IntArray>): Array<BooleanArray> {\n    val rows = heights.size\n    val cols = heights[0].size\n    val seen = Array(rows) { BooleanArray(cols) }\n    val stack = ArrayList<IntArray>()\n    for (s in starts) {\n        if (!seen[s[0]][s[1]]) {\n            seen[s[0]][s[1]] = true\n            stack.add(s)\n        }\n    }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    while (stack.isNotEmpty()) {\n        val cell = stack.removeAt(stack.size - 1)\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]) continue\n            if (heights[nr][nc] < heights[cell[0]][cell[1]]) continue\n            seen[nr][nc] = true\n            stack.add(intArrayOf(nr, nc))\n        }\n    }\n    return seen\n}\n\nfun pacificAtlantic(heights: Array<IntArray>): Array<IntArray> {\n    val rows = heights.size\n    val cols = heights[0].size\n    val pacificStarts = ArrayList<IntArray>()\n    val atlanticStarts = ArrayList<IntArray>()\n    for (c in 0 until cols) {\n        pacificStarts.add(intArrayOf(0, c))\n        atlanticStarts.add(intArrayOf(rows - 1, c))\n    }\n    for (r in 0 until rows) {\n        pacificStarts.add(intArrayOf(r, 0))\n        atlanticStarts.add(intArrayOf(r, cols - 1))\n    }\n    val pacific = oceanFlow(heights, pacificStarts)\n    val atlantic = oceanFlow(heights, atlanticStarts)\n    val out = ArrayList<IntArray>()\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (pacific[r][c] && atlantic[r][c]) out.add(intArrayOf(r, c))\n        }\n    }\n    return out.toTypedArray()\n}`,
              swift: `func oceanFlow(_ heights: [[Int]], _ starts: [[Int]]) -> [[Bool]] {\n    let rows = heights.count\n    let cols = heights[0].count\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    var stack: [[Int]] = []\n    for s in starts where !seen[s[0]][s[1]] {\n        seen[s[0]][s[1]] = true\n        stack.append(s)\n    }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    while let cell = stack.popLast() {\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] { continue }\n            if heights[nr][nc] < heights[cell[0]][cell[1]] { continue }\n            seen[nr][nc] = true\n            stack.append([nr, nc])\n        }\n    }\n    return seen\n}\n\nfunc pacificAtlantic(_ heights: [[Int]]) -> [[Int]] {\n    let rows = heights.count\n    let cols = heights[0].count\n    var pacificStarts: [[Int]] = []\n    var atlanticStarts: [[Int]] = []\n    for c in 0..<cols {\n        pacificStarts.append([0, c])\n        atlanticStarts.append([rows - 1, c])\n    }\n    for r in 0..<rows {\n        pacificStarts.append([r, 0])\n        atlanticStarts.append([r, cols - 1])\n    }\n    let pacific = oceanFlow(heights, pacificStarts)\n    let atlantic = oceanFlow(heights, atlanticStarts)\n    var out: [[Int]] = []\n    for r in 0..<rows {\n        for c in 0..<cols where pacific[r][c] && atlantic[r][c] {\n            out.append([r, c])\n        }\n    }\n    return out\n}`,
              rust: `fn ocean_flow(heights: &Vec<Vec<i32>>, starts: &Vec<(usize, usize)>) -> Vec<Vec<bool>> {\n    let rows = heights.len();\n    let cols = heights[0].len();\n    let mut seen = vec![vec![false; cols]; rows];\n    let mut stack: Vec<(usize, usize)> = Vec::new();\n    for s in starts.iter() {\n        if !seen[s.0][s.1] {\n            seen[s.0][s.1] = true;\n            stack.push(*s);\n        }\n    }\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    while let Some((cr, cc)) = stack.pop() {\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= rows as i32 || nc >= cols as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if seen[nru][ncu] || heights[nru][ncu] < heights[cr][cc] {\n                continue;\n            }\n            seen[nru][ncu] = true;\n            stack.push((nru, ncu));\n        }\n    }\n    seen\n}\n\nfn pacificAtlantic(heights: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let rows = heights.len();\n    let cols = heights[0].len();\n    let mut pacific_starts: Vec<(usize, usize)> = Vec::new();\n    let mut atlantic_starts: Vec<(usize, usize)> = Vec::new();\n    for c in 0..cols {\n        pacific_starts.push((0, c));\n        atlantic_starts.push((rows - 1, c));\n    }\n    for r in 0..rows {\n        pacific_starts.push((r, 0));\n        atlantic_starts.push((r, cols - 1));\n    }\n    let pacific = ocean_flow(&heights, &pacific_starts);\n    let atlantic = ocean_flow(&heights, &atlantic_starts);\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for r in 0..rows {\n        for c in 0..cols {\n            if pacific[r][c] && atlantic[r][c] {\n                out.push(vec![r as i32, c as i32]);\n            }\n        }\n    }\n    out\n}`,
              php: `function oceanFlow($heights, $starts) {\n    $rows = count($heights);\n    $cols = count($heights[0]);\n    $seen = array();\n    for ($r = 0; $r < $rows; $r++) $seen[] = array_fill(0, $cols, false);\n    $stack = array();\n    foreach ($starts as $s) {\n        if (!$seen[$s[0]][$s[1]]) {\n            $seen[$s[0]][$s[1]] = true;\n            $stack[] = $s;\n        }\n    }\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $rows || $nc >= $cols || $seen[$nr][$nc]) continue;\n            if ($heights[$nr][$nc] < $heights[$cell[0]][$cell[1]]) continue;\n            $seen[$nr][$nc] = true;\n            $stack[] = array($nr, $nc);\n        }\n    }\n    return $seen;\n}\n\nfunction pacificAtlantic($heights) {\n    $rows = count($heights);\n    $cols = count($heights[0]);\n    $pacificStarts = array();\n    $atlanticStarts = array();\n    for ($c = 0; $c < $cols; $c++) {\n        $pacificStarts[] = array(0, $c);\n        $atlanticStarts[] = array($rows - 1, $c);\n    }\n    for ($r = 0; $r < $rows; $r++) {\n        $pacificStarts[] = array($r, 0);\n        $atlanticStarts[] = array($r, $cols - 1);\n    }\n    $pacific = oceanFlow($heights, $pacificStarts);\n    $atlantic = oceanFlow($heights, $atlanticStarts);\n    $out = array();\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if ($pacific[$r][$c] && $atlantic[$r][$c]) $out[] = array($r, $c);\n        }\n    }\n    return $out;\n}`,
              ruby: `def ocean_flow(heights, starts)\n  rows = heights.length\n  cols = heights[0].length\n  seen = Array.new(rows) { Array.new(cols, false) }\n  stack = []\n  starts.each do |s|\n    unless seen[s[0]][s[1]]\n      seen[s[0]][s[1]] = true\n      stack.push(s)\n    end\n  end\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  while !stack.empty?\n    cell = stack.pop\n    (0...4).each do |d|\n      nr = cell[0] + dr[d]\n      nc = cell[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc]\n      next if heights[nr][nc] < heights[cell[0]][cell[1]]\n      seen[nr][nc] = true\n      stack.push([nr, nc])\n    end\n  end\n  seen\nend\n\ndef pacificAtlantic(heights)\n  rows = heights.length\n  cols = heights[0].length\n  pacific_starts = []\n  atlantic_starts = []\n  (0...cols).each do |c|\n    pacific_starts.push([0, c])\n    atlantic_starts.push([rows - 1, c])\n  end\n  (0...rows).each do |r|\n    pacific_starts.push([r, 0])\n    atlantic_starts.push([r, cols - 1])\n  end\n  pacific = ocean_flow(heights, pacific_starts)\n  atlantic = ocean_flow(heights, atlantic_starts)\n  out = []\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      out.push([r, c]) if pacific[r][c] && atlantic[r][c]\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Word Search ─────────────────────────────────────────────────
  (() => {
    const ref = (board: string[], word: string) => {
      const rows = board.length;
      const cols = board[0].length;
      const used: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < cols; c++) row.push(false);
        used.push(row);
      }
      const search = (r: number, c: number, index: number): boolean => {
        if (index === word.length) return true;
        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
        if (used[r][c] || board[r][c] !== word[index]) return false;
        used[r][c] = true;
        const found =
          search(r + 1, c, index + 1) ||
          search(r - 1, c, index + 1) ||
          search(r, c + 1, index + 1) ||
          search(r, c - 1, index + 1);
        used[r][c] = false;
        return found;
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (search(r, c, 0)) return true;
        }
      }
      return false;
    };
    return {
      slug: "word-search",
      title: "Word Search",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Backtracking", "Depth-First Search", "Matrix", "Amazon", "Microsoft", "Meta", "Google", "Bloomberg"],
      signature: { funcName: "exist", params: [{ name: "board", type: "string[]" as const }, { name: "word", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given a grid of letters as `board`, one string per row, and a string `word`.\n\nReturn `true` if `word` can be spelled out by a path of horizontally or vertically adjacent cells, where **no cell is used more than once** in the path.",
        [
          { in: 'board = ["abce","sfcs","adee"], word = "abcced"', out: "true" },
          { in: 'board = ["abce","sfcs","adee"], word = "see"', out: "true" },
          { in: 'board = ["abce","sfcs","adee"], word = "abcb"', out: "false", note: "The b cannot be reused." },
        ],
        ["1 <= board.length <= 4", "All rows have the same length, between 1 and 4.", "1 <= word.length <= 6", "board and word consist of lowercase English letters."]),
      hints: [
        "Try starting the match at every cell and grow it one letter at a time.",
        "Mark a cell as used before recursing and unmark it afterwards — that is the backtracking step.",
        "Bail out as soon as the current letter does not match; that pruning is what keeps the search tractable.",
      ],
      examples: [
        { input: '["abce","sfcs","adee"]\n"abcced"', expectedOutput: "true" },
        { input: '["abce","sfcs","adee"]\n"see"', expectedOutput: "true" },
        { input: '["abce","sfcs","adee"]\n"abcb"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const rows = ri(rng, 1, 4);
        const cols = ri(rng, 1, 4);
        const alphabet = "abc";
        const board = Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("")
        );
        let word: string;
        if (rng() < 0.5) {
          // Trace a genuine self-avoiding path so "true" appears often enough.
          const used: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
          let r = ri(rng, 0, rows - 1);
          let c = ri(rng, 0, cols - 1);
          used[r][c] = true;
          let built = board[r][c];
          const target = ri(rng, 1, 6);
          while (built.length < target) {
            const options: number[][] = [];
            const dr = [1, -1, 0, 0];
            const dc = [0, 0, 1, -1];
            for (let d = 0; d < 4; d++) {
              const nr = r + dr[d];
              const nc = c + dc[d];
              if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || used[nr][nc]) continue;
              options.push([nr, nc]);
            }
            if (options.length === 0) break;
            const pickCell = options[ri(rng, 0, options.length - 1)];
            r = pickCell[0];
            c = pickCell[1];
            used[r][c] = true;
            built += board[r][c];
          }
          word = built;
        } else {
          word = Array.from({ length: ri(rng, 1, 6) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        }
        return { input: `${fmtStrArr(board)}\n"${word}"`, expectedOutput: bool(ref(board, word)) };
      },
      solutions: {
        python: `def exist(board, word: str) -> bool:\n    rows, cols = len(board), len(board[0])\n    used = [[False] * cols for _ in range(rows)]\n\n    def search(r, c, index):\n        if index == len(word):\n            return True\n        if not (0 <= r < rows and 0 <= c < cols):\n            return False\n        if used[r][c] or board[r][c] != word[index]:\n            return False\n        used[r][c] = True\n        found = (search(r + 1, c, index + 1) or search(r - 1, c, index + 1)\n                 or search(r, c + 1, index + 1) or search(r, c - 1, index + 1))\n        used[r][c] = False\n        return found\n\n    return any(search(r, c, 0) for r in range(rows) for c in range(cols))`,
        javascript: `var exist = function(board, word) {\n    const rows = board.length, cols = board[0].length;\n    const used = [];\n    for (let r = 0; r < rows; r++) {\n        const row = [];\n        for (let c = 0; c < cols; c++) row.push(false);\n        used.push(row);\n    }\n    const search = function(r, c, index) {\n        if (index === word.length) return true;\n        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;\n        if (used[r][c] || board[r].charAt(c) !== word.charAt(index)) return false;\n        used[r][c] = true;\n        const found = search(r + 1, c, index + 1) || search(r - 1, c, index + 1) ||\n            search(r, c + 1, index + 1) || search(r, c - 1, index + 1);\n        used[r][c] = false;\n        return found;\n    };\n    for (let r = 0; r < rows; r++) {\n        for (let c = 0; c < cols; c++) {\n            if (search(r, c, 0)) return true;\n        }\n    }\n    return false;\n};`,
              typescript: `function exist(board: string[], word: string): boolean {\n    var rows = board.length;\n    var cols = board[0].length;\n    var used: boolean[][] = [];\n    for (var r = 0; r < rows; r++) {\n        var row: boolean[] = [];\n        for (var c = 0; c < cols; c++) row.push(false);\n        used.push(row);\n    }\n    var search = function (r: number, c: number, index: number): boolean {\n        if (index === word.length) return true;\n        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;\n        if (used[r][c] || board[r].charAt(c) !== word.charAt(index)) return false;\n        used[r][c] = true;\n        var found = search(r + 1, c, index + 1) || search(r - 1, c, index + 1) ||\n            search(r, c + 1, index + 1) || search(r, c - 1, index + 1);\n        used[r][c] = false;\n        return found;\n    };\n    for (var r2 = 0; r2 < rows; r2++) {\n        for (var c2 = 0; c2 < cols; c2++) {\n            if (search(r2, c2, 0)) return true;\n        }\n    }\n    return false;\n}`,
              java: `private static boolean searchWord(String[] board, String word, boolean[][] used, int r, int c, int index) {\n    if (index == word.length()) return true;\n    int rows = board.length, cols = board[0].length();\n    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;\n    if (used[r][c] || board[r].charAt(c) != word.charAt(index)) return false;\n    used[r][c] = true;\n    boolean found = searchWord(board, word, used, r + 1, c, index + 1)\n            || searchWord(board, word, used, r - 1, c, index + 1)\n            || searchWord(board, word, used, r, c + 1, index + 1)\n            || searchWord(board, word, used, r, c - 1, index + 1);\n    used[r][c] = false;\n    return found;\n}\n\npublic static boolean exist(String[] board, String word) {\n    int rows = board.length, cols = board[0].length();\n    boolean[][] used = new boolean[rows][cols];\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (searchWord(board, word, used, r, c, 0)) return true;\n        }\n    }\n    return false;\n}`,
              cpp: `static bool searchWord(vector<string>& board, const string& word, vector<vector<bool>>& used, int r, int c, int index) {\n    if (index == (int) word.size()) return true;\n    int rows = (int) board.size(), cols = (int) board[0].size();\n    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;\n    if (used[r][c] || board[r][c] != word[index]) return false;\n    used[r][c] = true;\n    bool found = searchWord(board, word, used, r + 1, c, index + 1)\n        || searchWord(board, word, used, r - 1, c, index + 1)\n        || searchWord(board, word, used, r, c + 1, index + 1)\n        || searchWord(board, word, used, r, c - 1, index + 1);\n    used[r][c] = false;\n    return found;\n}\n\nbool exist(vector<string>& board, string word) {\n    int rows = (int) board.size(), cols = (int) board[0].size();\n    vector<vector<bool>> used(rows, vector<bool>(cols, false));\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            if (searchWord(board, word, used, r, c, 0)) return true;\n        }\n    }\n    return false;\n}`,
              c: `static int searchWord(char** board, int rows, int cols, const char* word, int wordLen, char* used, int r, int c, int index) {\n    if (index == wordLen) return 1;\n    if (r < 0 || c < 0 || r >= rows || c >= cols) return 0;\n    if (used[r * cols + c] || board[r][c] != word[index]) return 0;\n    used[r * cols + c] = 1;\n    int found = searchWord(board, rows, cols, word, wordLen, used, r + 1, c, index + 1)\n        || searchWord(board, rows, cols, word, wordLen, used, r - 1, c, index + 1)\n        || searchWord(board, rows, cols, word, wordLen, used, r, c + 1, index + 1)\n        || searchWord(board, rows, cols, word, wordLen, used, r, c - 1, index + 1);\n    used[r * cols + c] = 0;\n    return found;\n}\n\nbool exist(char** board, int boardSize, const char* word) {\n    int rows = boardSize;\n    int cols = (int) strlen(board[0]);\n    int wordLen = (int) strlen(word);\n    char* used = (char*) calloc((size_t) (rows * cols), sizeof(char));\n    bool answer = false;\n    for (int r = 0; r < rows && !answer; r++) {\n        for (int c = 0; c < cols && !answer; c++) {\n            if (searchWord(board, rows, cols, word, wordLen, used, r, c, 0)) answer = true;\n        }\n    }\n    free(used);\n    return answer;\n}`,
              csharp: `private static bool SearchWord(string[] board, string word, bool[,] used, int r, int c, int index)\n{\n    if (index == word.Length) return true;\n    int rows = board.Length, cols = board[0].Length;\n    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;\n    if (used[r, c] || board[r][c] != word[index]) return false;\n    used[r, c] = true;\n    bool found = SearchWord(board, word, used, r + 1, c, index + 1)\n        || SearchWord(board, word, used, r - 1, c, index + 1)\n        || SearchWord(board, word, used, r, c + 1, index + 1)\n        || SearchWord(board, word, used, r, c - 1, index + 1);\n    used[r, c] = false;\n    return found;\n}\n\npublic static bool Exist(string[] board, string word)\n{\n    int rows = board.Length, cols = board[0].Length;\n    bool[,] used = new bool[rows, cols];\n    for (int r = 0; r < rows; r++)\n    {\n        for (int c = 0; c < cols; c++)\n        {\n            if (SearchWord(board, word, used, r, c, 0)) return true;\n        }\n    }\n    return false;\n}`,
              go: `func searchWord(board []string, word string, used [][]bool, r int, c int, index int) bool {\n	if index == len(word) {\n		return true\n	}\n	rows, cols := len(board), len(board[0])\n	if r < 0 || c < 0 || r >= rows || c >= cols {\n		return false\n	}\n	if used[r][c] || board[r][c] != word[index] {\n		return false\n	}\n	used[r][c] = true\n	found := searchWord(board, word, used, r+1, c, index+1) ||\n		searchWord(board, word, used, r-1, c, index+1) ||\n		searchWord(board, word, used, r, c+1, index+1) ||\n		searchWord(board, word, used, r, c-1, index+1)\n	used[r][c] = false\n	return found\n}\n\nfunc exist(board []string, word string) bool {\n	rows, cols := len(board), len(board[0])\n	used := make([][]bool, rows)\n	for i := range used {\n		used[i] = make([]bool, cols)\n	}\n	for r := 0; r < rows; r++ {\n		for c := 0; c < cols; c++ {\n			if searchWord(board, word, used, r, c, 0) {\n				return true\n			}\n		}\n	}\n	return false\n}`,
              kotlin: `fun searchWord(board: Array<String>, word: String, used: Array<BooleanArray>, r: Int, c: Int, index: Int): Boolean {\n    if (index == word.length) return true\n    val rows = board.size\n    val cols = board[0].length\n    if (r < 0 || c < 0 || r >= rows || c >= cols) return false\n    if (used[r][c] || board[r][c] != word[index]) return false\n    used[r][c] = true\n    val found = searchWord(board, word, used, r + 1, c, index + 1) ||\n        searchWord(board, word, used, r - 1, c, index + 1) ||\n        searchWord(board, word, used, r, c + 1, index + 1) ||\n        searchWord(board, word, used, r, c - 1, index + 1)\n    used[r][c] = false\n    return found\n}\n\nfun exist(board: Array<String>, word: String): Boolean {\n    val rows = board.size\n    val cols = board[0].length\n    val used = Array(rows) { BooleanArray(cols) }\n    for (r in 0 until rows) {\n        for (c in 0 until cols) {\n            if (searchWord(board, word, used, r, c, 0)) return true\n        }\n    }\n    return false\n}`,
              swift: `func searchWord(_ board: [[Character]], _ word: [Character], _ used: inout [[Bool]], _ r: Int, _ c: Int, _ index: Int) -> Bool {\n    if index == word.count { return true }\n    let rows = board.count\n    let cols = board[0].count\n    if r < 0 || c < 0 || r >= rows || c >= cols { return false }\n    if used[r][c] || board[r][c] != word[index] { return false }\n    used[r][c] = true\n    let found = searchWord(board, word, &used, r + 1, c, index + 1) ||\n        searchWord(board, word, &used, r - 1, c, index + 1) ||\n        searchWord(board, word, &used, r, c + 1, index + 1) ||\n        searchWord(board, word, &used, r, c - 1, index + 1)\n    used[r][c] = false\n    return found\n}\n\nfunc exist(_ board: [String], _ word: String) -> Bool {\n    let chars = board.map { Array($0) }\n    let target = Array(word)\n    let rows = chars.count\n    let cols = chars[0].count\n    var used = [[Bool]](repeating: [Bool](repeating: false, count: cols), count: rows)\n    for r in 0..<rows {\n        for c in 0..<cols {\n            if searchWord(chars, target, &used, r, c, 0) { return true }\n        }\n    }\n    return false\n}`,
              rust: `fn search_word(board: &Vec<Vec<u8>>, word: &Vec<u8>, used: &mut Vec<Vec<bool>>, r: i32, c: i32, index: usize) -> bool {\n    if index == word.len() {\n        return true;\n    }\n    let rows = board.len() as i32;\n    let cols = board[0].len() as i32;\n    if r < 0 || c < 0 || r >= rows || c >= cols {\n        return false;\n    }\n    let (ru, cu) = (r as usize, c as usize);\n    if used[ru][cu] || board[ru][cu] != word[index] {\n        return false;\n    }\n    used[ru][cu] = true;\n    let found = search_word(board, word, used, r + 1, c, index + 1)\n        || search_word(board, word, used, r - 1, c, index + 1)\n        || search_word(board, word, used, r, c + 1, index + 1)\n        || search_word(board, word, used, r, c - 1, index + 1);\n    used[ru][cu] = false;\n    found\n}\n\nfn exist(board: Vec<String>, word: String) -> bool {\n    let chars: Vec<Vec<u8>> = board.iter().map(|row| row.bytes().collect()).collect();\n    let target: Vec<u8> = word.bytes().collect();\n    let rows = chars.len();\n    let cols = chars[0].len();\n    let mut used = vec![vec![false; cols]; rows];\n    for r in 0..rows {\n        for c in 0..cols {\n            if search_word(&chars, &target, &mut used, r as i32, c as i32, 0) {\n                return true;\n            }\n        }\n    }\n    false\n}`,
              php: `function searchWord($board, $word, &$used, $r, $c, $index) {\n    if ($index === strlen($word)) return true;\n    $rows = count($board);\n    $cols = strlen($board[0]);\n    if ($r < 0 || $c < 0 || $r >= $rows || $c >= $cols) return false;\n    if ($used[$r][$c] || $board[$r][$c] !== $word[$index]) return false;\n    $used[$r][$c] = true;\n    $found = searchWord($board, $word, $used, $r + 1, $c, $index + 1)\n        || searchWord($board, $word, $used, $r - 1, $c, $index + 1)\n        || searchWord($board, $word, $used, $r, $c + 1, $index + 1)\n        || searchWord($board, $word, $used, $r, $c - 1, $index + 1);\n    $used[$r][$c] = false;\n    return $found;\n}\n\nfunction exist($board, $word) {\n    $rows = count($board);\n    $cols = strlen($board[0]);\n    $used = array();\n    for ($r = 0; $r < $rows; $r++) $used[] = array_fill(0, $cols, false);\n    for ($r = 0; $r < $rows; $r++) {\n        for ($c = 0; $c < $cols; $c++) {\n            if (searchWord($board, $word, $used, $r, $c, 0)) return true;\n        }\n    }\n    return false;\n}`,
              ruby: `def search_word(board, word, used, r, c, index)\n  return true if index == word.length\n  rows = board.length\n  cols = board[0].length\n  return false if r < 0 || c < 0 || r >= rows || c >= cols\n  return false if used[r][c] || board[r][c] != word[index]\n  used[r][c] = true\n  found = search_word(board, word, used, r + 1, c, index + 1) ||\n          search_word(board, word, used, r - 1, c, index + 1) ||\n          search_word(board, word, used, r, c + 1, index + 1) ||\n          search_word(board, word, used, r, c - 1, index + 1)\n  used[r][c] = false\n  found\nend\n\ndef exist(board, word)\n  rows = board.length\n  cols = board[0].length\n  used = Array.new(rows) { Array.new(cols, false) }\n  (0...rows).each do |r|\n    (0...cols).each do |c|\n      return true if search_word(board, word, used, r, c, 0)\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Swim in Rising Water ────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const dr = [1, -1, 0, 0];
      const dc = [0, 0, 1, -1];
      const reachable = (limit: number) => {
        if (grid[0][0] > limit) return false;
        const seen: boolean[][] = [];
        for (let r = 0; r < n; r++) {
          const row: boolean[] = [];
          for (let c = 0; c < n; c++) row.push(false);
          seen.push(row);
        }
        seen[0][0] = true;
        const stack: number[][] = [[0, 0]];
        while (stack.length > 0) {
          const cell = stack.pop() as number[];
          if (cell[0] === n - 1 && cell[1] === n - 1) return true;
          for (let d = 0; d < 4; d++) {
            const nr = cell[0] + dr[d];
            const nc = cell[1] + dc[d];
            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
            if (grid[nr][nc] > limit) continue;
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
        return seen[n - 1][n - 1];
      };
      let lo = grid[0][0] > grid[n - 1][n - 1] ? grid[0][0] : grid[n - 1][n - 1];
      let hi = n * n - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (reachable(mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "swim-in-rising-water",
      title: "Swim in Rising Water",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Depth-First Search", "Breadth-First Search", "Union Find", "Heap", "Matrix", "Amazon", "Google", "Meta"],
      signature: { funcName: "swimInWater", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n x n` grid where `grid[i][j]` is the elevation of that square. Rain raises the water level: at time `t` the water depth everywhere is `t`.\n\nYou start at the top-left square and may swim to any adjacent square (up, down, left or right) as long as **both** squares have elevation at most `t`. Swimming itself takes no time. Return the least time at which you can reach the bottom-right square.",
        [
          { in: "grid = [[0,2],[1,3]]", out: "3" },
          { in: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]", out: "16" },
          { in: "grid = [[0]]", out: "0" },
        ],
        ["1 <= grid.length <= 8", "grid[i].length == grid.length", "grid holds a permutation of 0 … n² - 1."],
        "Binary search on the time gives O(n² log n). A Dijkstra variant that minimises the maximum elevation on the path is the classic alternative."),
      hints: [
        "Ask the yes/no question first: at time `t`, can you reach the corner using only squares with elevation at most `t`?",
        "That is a plain flood fill, and the answer is monotone in `t` — so binary search it.",
        "The answer can never be below either corner's elevation, which gives a tight lower bound to start from.",
      ],
      examples: [
        { input: "[[0,2],[1,3]]", expectedOutput: "3" },
        { input: "[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]", expectedOutput: "16" },
        { input: "[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const values = shuffle(rng, Array.from({ length: n * n }, (_, i) => i));
        const grid: number[][] = [];
        for (let r = 0; r < n; r++) grid.push(values.slice(r * n, r * n + n));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `def swimInWater(grid) -> int:\n    n = len(grid)\n\n    def reachable(limit):\n        if grid[0][0] > limit:\n            return False\n        seen = [[False] * n for _ in range(n)]\n        seen[0][0] = True\n        stack = [(0, 0)]\n        while stack:\n            r, c = stack.pop()\n            if r == n - 1 and c == n - 1:\n                return True\n            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n                if 0 <= nr < n and 0 <= nc < n and not seen[nr][nc] and grid[nr][nc] <= limit:\n                    seen[nr][nc] = True\n                    stack.append((nr, nc))\n        return seen[n - 1][n - 1]\n\n    lo = max(grid[0][0], grid[n - 1][n - 1])\n    hi = n * n - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if reachable(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var swimInWater = function(grid) {\n    const n = grid.length;\n    const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    const reachable = function(limit) {\n        if (grid[0][0] > limit) return false;\n        const seen = [];\n        for (let r = 0; r < n; r++) {\n            const row = [];\n            for (let c = 0; c < n; c++) row.push(false);\n            seen.push(row);\n        }\n        seen[0][0] = true;\n        const stack = [[0, 0]];\n        while (stack.length > 0) {\n            const cell = stack.pop();\n            if (cell[0] === n - 1 && cell[1] === n - 1) return true;\n            for (let d = 0; d < 4; d++) {\n                const nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;\n                if (grid[nr][nc] > limit) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen[n - 1][n - 1];\n    };\n    let lo = grid[0][0] > grid[n - 1][n - 1] ? grid[0][0] : grid[n - 1][n - 1];\n    let hi = n * n - 1;\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (reachable(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
              typescript: `function swimInWater(grid: number[][]): number {\n    var n = grid.length;\n    var dr = [1, -1, 0, 0];\n    var dc = [0, 0, 1, -1];\n    var reachable = function (limit: number): boolean {\n        if (grid[0][0] > limit) return false;\n        var seen: boolean[][] = [];\n        for (var r = 0; r < n; r++) {\n            var row: boolean[] = [];\n            for (var c = 0; c < n; c++) row.push(false);\n            seen.push(row);\n        }\n        seen[0][0] = true;\n        var stack: number[][] = [[0, 0]];\n        while (stack.length > 0) {\n            var cell = stack.pop() as number[];\n            if (cell[0] === n - 1 && cell[1] === n - 1) return true;\n            for (var d = 0; d < 4; d++) {\n                var nr = cell[0] + dr[d];\n                var nc = cell[1] + dc[d];\n                if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;\n                if (grid[nr][nc] > limit) continue;\n                seen[nr][nc] = true;\n                stack.push([nr, nc]);\n            }\n        }\n        return seen[n - 1][n - 1];\n    };\n    var lo = grid[0][0] > grid[n - 1][n - 1] ? grid[0][0] : grid[n - 1][n - 1];\n    var hi = n * n - 1;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (reachable(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              java: `private static boolean swimReachable(int[][] grid, int limit) {\n    int n = grid.length;\n    if (grid[0][0] > limit) return false;\n    boolean[][] seen = new boolean[n][n];\n    seen[0][0] = true;\n    Deque<int[]> stack = new ArrayDeque<>();\n    stack.push(new int[]{0, 0});\n    int[] dr = {1, -1, 0, 0};\n    int[] dc = {0, 0, 1, -1};\n    while (!stack.isEmpty()) {\n        int[] cell = stack.pop();\n        if (cell[0] == n - 1 && cell[1] == n - 1) return true;\n        for (int d = 0; d < 4; d++) {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;\n            if (grid[nr][nc] > limit) continue;\n            seen[nr][nc] = true;\n            stack.push(new int[]{nr, nc});\n        }\n    }\n    return seen[n - 1][n - 1];\n}\n\npublic static int swimInWater(int[][] grid) {\n    int n = grid.length;\n    int lo = Math.max(grid[0][0], grid[n - 1][n - 1]);\n    int hi = n * n - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (swimReachable(grid, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              cpp: `static bool swimReachable(vector<vector<int>>& grid, int limit) {\n    int n = (int) grid.size();\n    if (grid[0][0] > limit) return false;\n    vector<vector<bool>> seen(n, vector<bool>(n, false));\n    seen[0][0] = true;\n    vector<pair<int,int>> stack;\n    stack.push_back(make_pair(0, 0));\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (!stack.empty()) {\n        pair<int,int> cell = stack.back();\n        stack.pop_back();\n        if (cell.first == n - 1 && cell.second == n - 1) return true;\n        for (int d = 0; d < 4; d++) {\n            int nr = cell.first + dr[d], nc = cell.second + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;\n            if (grid[nr][nc] > limit) continue;\n            seen[nr][nc] = true;\n            stack.push_back(make_pair(nr, nc));\n        }\n    }\n    return seen[n - 1][n - 1];\n}\n\nint swimInWater(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    int lo = max(grid[0][0], grid[n - 1][n - 1]);\n    int hi = n * n - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (swimReachable(grid, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              c: `static int swimReachable(int** grid, int n, int limit, char* seen, int* stack) {\n    if (grid[0][0] > limit) return 0;\n    for (int i = 0; i < n * n; i++) seen[i] = 0;\n    seen[0] = 1;\n    int top = 0;\n    stack[top++] = 0;\n    int dr[4] = {1, -1, 0, 0};\n    int dc[4] = {0, 0, 1, -1};\n    while (top > 0) {\n        int cell = stack[--top];\n        int cr = cell / n, cc = cell % n;\n        if (cr == n - 1 && cc == n - 1) return 1;\n        for (int d = 0; d < 4; d++) {\n            int nr = cr + dr[d], nc = cc + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr * n + nc]) continue;\n            if (grid[nr][nc] > limit) continue;\n            seen[nr * n + nc] = 1;\n            stack[top++] = nr * n + nc;\n        }\n    }\n    return seen[(n - 1) * n + (n - 1)];\n}\n\nint swimInWater(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    char* seen = (char*) malloc((size_t) (n * n));\n    int* stack = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int lo = grid[0][0] > grid[n - 1][n - 1] ? grid[0][0] : grid[n - 1][n - 1];\n    int hi = n * n - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (swimReachable(grid, n, mid, seen, stack)) hi = mid;\n        else lo = mid + 1;\n    }\n    free(seen);\n    free(stack);\n    return lo;\n}`,
              csharp: `private static bool SwimReachable(int[][] grid, int limit)\n{\n    int n = grid.Length;\n    if (grid[0][0] > limit) return false;\n    bool[,] seen = new bool[n, n];\n    seen[0, 0] = true;\n    var stack = new List<int[]>();\n    stack.Add(new int[] { 0, 0 });\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (stack.Count > 0)\n    {\n        int[] cell = stack[stack.Count - 1];\n        stack.RemoveAt(stack.Count - 1);\n        if (cell[0] == n - 1 && cell[1] == n - 1) return true;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr, nc]) continue;\n            if (grid[nr][nc] > limit) continue;\n            seen[nr, nc] = true;\n            stack.Add(new int[] { nr, nc });\n        }\n    }\n    return seen[n - 1, n - 1];\n}\n\npublic static int SwimInWater(int[][] grid)\n{\n    int n = grid.Length;\n    int lo = Math.Max(grid[0][0], grid[n - 1][n - 1]);\n    int hi = n * n - 1;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (SwimReachable(grid, mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              go: `func swimReachable(grid [][]int, limit int) bool {\n	n := len(grid)\n	if grid[0][0] > limit {\n		return false\n	}\n	seen := make([][]bool, n)\n	for i := range seen {\n		seen[i] = make([]bool, n)\n	}\n	seen[0][0] = true\n	stack := [][2]int{{0, 0}}\n	dr := []int{1, -1, 0, 0}\n	dc := []int{0, 0, 1, -1}\n	for len(stack) > 0 {\n		cell := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		if cell[0] == n-1 && cell[1] == n-1 {\n			return true\n		}\n		for d := 0; d < 4; d++ {\n			nr, nc := cell[0]+dr[d], cell[1]+dc[d]\n			if nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc] {\n				continue\n			}\n			if grid[nr][nc] > limit {\n				continue\n			}\n			seen[nr][nc] = true\n			stack = append(stack, [2]int{nr, nc})\n		}\n	}\n	return seen[n-1][n-1]\n}\n\nfunc swimInWater(grid [][]int) int {\n	n := len(grid)\n	lo := grid[0][0]\n	if grid[n-1][n-1] > lo {\n		lo = grid[n-1][n-1]\n	}\n	hi := n*n - 1\n	for lo < hi {\n		mid := (lo + hi) / 2\n		if swimReachable(grid, mid) {\n			hi = mid\n		} else {\n			lo = mid + 1\n		}\n	}\n	return lo\n}`,
              kotlin: `fun swimReachable(grid: Array<IntArray>, limit: Int): Boolean {\n    val n = grid.size\n    if (grid[0][0] > limit) return false\n    val seen = Array(n) { BooleanArray(n) }\n    seen[0][0] = true\n    val stack = ArrayList<IntArray>()\n    stack.add(intArrayOf(0, 0))\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    while (stack.isNotEmpty()) {\n        val cell = stack.removeAt(stack.size - 1)\n        if (cell[0] == n - 1 && cell[1] == n - 1) return true\n        for (d in 0 until 4) {\n            val nr = cell[0] + dr[d]\n            val nc = cell[1] + dc[d]\n            if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue\n            if (grid[nr][nc] > limit) continue\n            seen[nr][nc] = true\n            stack.add(intArrayOf(nr, nc))\n        }\n    }\n    return seen[n - 1][n - 1]\n}\n\nfun swimInWater(grid: Array<IntArray>): Int {\n    val n = grid.size\n    var lo = if (grid[0][0] > grid[n - 1][n - 1]) grid[0][0] else grid[n - 1][n - 1]\n    var hi = n * n - 1\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (swimReachable(grid, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
              swift: `func swimReachable(_ grid: [[Int]], _ limit: Int) -> Bool {\n    let n = grid.count\n    if grid[0][0] > limit { return false }\n    var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)\n    seen[0][0] = true\n    var stack: [[Int]] = [[0, 0]]\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    while let cell = stack.popLast() {\n        if cell[0] == n - 1 && cell[1] == n - 1 { return true }\n        for d in 0..<4 {\n            let nr = cell[0] + dr[d]\n            let nc = cell[1] + dc[d]\n            if nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc] { continue }\n            if grid[nr][nc] > limit { continue }\n            seen[nr][nc] = true\n            stack.append([nr, nc])\n        }\n    }\n    return seen[n - 1][n - 1]\n}\n\nfunc swimInWater(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var lo = max(grid[0][0], grid[n - 1][n - 1])\n    var hi = n * n - 1\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if swimReachable(grid, mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
              rust: `fn swim_reachable(grid: &Vec<Vec<i32>>, limit: i32) -> bool {\n    let n = grid.len();\n    if grid[0][0] > limit {\n        return false;\n    }\n    let mut seen = vec![vec![false; n]; n];\n    seen[0][0] = true;\n    let mut stack: Vec<(usize, usize)> = vec![(0, 0)];\n    let dr: [i32; 4] = [1, -1, 0, 0];\n    let dc: [i32; 4] = [0, 0, 1, -1];\n    while let Some((cr, cc)) = stack.pop() {\n        if cr == n - 1 && cc == n - 1 {\n            return true;\n        }\n        for d in 0..4 {\n            let nr = cr as i32 + dr[d];\n            let nc = cc as i32 + dc[d];\n            if nr < 0 || nc < 0 || nr >= n as i32 || nc >= n as i32 {\n                continue;\n            }\n            let (nru, ncu) = (nr as usize, nc as usize);\n            if seen[nru][ncu] || grid[nru][ncu] > limit {\n                continue;\n            }\n            seen[nru][ncu] = true;\n            stack.push((nru, ncu));\n        }\n    }\n    seen[n - 1][n - 1]\n}\n\nfn swimInWater(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut lo = if grid[0][0] > grid[n - 1][n - 1] { grid[0][0] } else { grid[n - 1][n - 1] };\n    let mut hi = (n * n - 1) as i32;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if swim_reachable(&grid, mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
              php: `function swimReachable($grid, $limit) {\n    $n = count($grid);\n    if ($grid[0][0] > $limit) return false;\n    $seen = array();\n    for ($r = 0; $r < $n; $r++) $seen[] = array_fill(0, $n, false);\n    $seen[0][0] = true;\n    $stack = array(array(0, 0));\n    $dr = array(1, -1, 0, 0);\n    $dc = array(0, 0, 1, -1);\n    while (count($stack) > 0) {\n        $cell = array_pop($stack);\n        if ($cell[0] === $n - 1 && $cell[1] === $n - 1) return true;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $cell[0] + $dr[$d];\n            $nc = $cell[1] + $dc[$d];\n            if ($nr < 0 || $nc < 0 || $nr >= $n || $nc >= $n || $seen[$nr][$nc]) continue;\n            if ($grid[$nr][$nc] > $limit) continue;\n            $seen[$nr][$nc] = true;\n            $stack[] = array($nr, $nc);\n        }\n    }\n    return $seen[$n - 1][$n - 1];\n}\n\nfunction swimInWater($grid) {\n    $n = count($grid);\n    $lo = max($grid[0][0], $grid[$n - 1][$n - 1]);\n    $hi = $n * $n - 1;\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if (swimReachable($grid, $mid)) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
              ruby: `def swim_reachable(grid, limit)\n  n = grid.length\n  return false if grid[0][0] > limit\n  seen = Array.new(n) { Array.new(n, false) }\n  seen[0][0] = true\n  stack = [[0, 0]]\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  while !stack.empty?\n    cell = stack.pop\n    return true if cell[0] == n - 1 && cell[1] == n - 1\n    (0...4).each do |d|\n      nr = cell[0] + dr[d]\n      nc = cell[1] + dc[d]\n      next if nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]\n      next if grid[nr][nc] > limit\n      seen[nr][nc] = true\n      stack.push([nr, nc])\n    end\n  end\n  seen[n - 1][n - 1]\nend\n\ndef swimInWater(grid)\n  n = grid.length\n  lo = [grid[0][0], grid[n - 1][n - 1]].max\n  hi = n * n - 1\n  while lo < hi\n    mid = (lo + hi) / 2\n    if swim_reachable(grid, mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),
];
