/**
 * Graph and traversal problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * graph set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h. Several problems
 * here have their node counts tightened from the upstream limits so that every
 * answer stays inside a 32-bit int in all thirteen languages.
 */
import {
  bool,
  describe,
  explain,
  fmtIntArr,
  fmtIntMat,
  fmtStrArr,
  pick,
  randLower,
  ri,
  shuffle,
  type CatalogProblem,
  type Rng,
} from "./types.js";

export const GRAPHS4_PROBLEMS: CatalogProblem[] = [

  // ── Find Champion I (LC 2923) ───────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      for (let i = 0; i < n; i++) {
        let beaten = false;
        for (let j = 0; j < n; j++) if (j !== i && grid[j][i] === 1) beaten = true;
        if (!beaten) return i;
      }
      return -1;
    };
    return {
      slug: "find-champion-i",
      title: "Find Champion I",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Graph", "Amazon", "Google", "Infosys"],
      signature: { funcName: "findChampion", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`n` teams play a CodeKairo tournament. `grid[i][j] == 1` means team `i` is stronger than team `j`, and `grid[j][i] == 0`; every pair has exactly one winner, and `grid[i][i] == 0`.\n\nThe **champion** is the team no other team is stronger than. Return its index — it is guaranteed to be unique.",
        [
          { in: "grid = [[0,1],[0,0]]", out: "0", note: "Team 0 beats team 1, so nobody is above team 0." },
          { in: "grid = [[0,0,1],[1,0,1],[0,0,0]]", out: "1", note: "Team 1 is stronger than both others." },
          { in: "grid = [[0]]", out: "0" },
        ],
        ["n == grid.length == grid[i].length", "2 <= n <= 100", "grid[i][j] is 0 or 1", "For all i, grid[i][i] == 0", "For all distinct i and j, exactly one of grid[i][j] and grid[j][i] is 1", "The champion is unique."]),
      hints: [
        "A team is the champion when nothing beats it.",
        "Column `i` records who is stronger than team `i`.",
        "So look for the column that is all zeros.",
      ],
      editorial: explain({
        idea: "Reading the matrix by column answers the question directly: column `i` holds a `1` at row `j` exactly when team `j` beats team `i`. The champion's column is therefore all zeros.",
        steps: [
          "For each team `i`, scan column `i`.",
          "If no other row holds a `1` there, `i` is the champion.",
        ],
        why: "Because every pair is decided and the champion is promised to exist and be unique, exactly one column is all zeros. Equivalently, the champion is the team with `n - 1` wins in its own row — the two tests agree, and the column reading needs no count.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Scanning the *row* for all ones also works, but then the diagonal zero must be excluded from the count.",
          "`grid[i][i]` is always 0 and must not be read as a loss.",
          "The champion is an index, not a win count.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,0]]", expectedOutput: "0" },
        { input: "[[0,0,1],[1,0,1],[0,0,0]]", expectedOutput: "1" },
        { input: "[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        // Build a strict ranking, then write the tournament it implies: that
        // guarantees exactly one champion, as the statement promises.
        const n = ri(rng, 1, 8);
        const rank = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const pos = new Array(n).fill(0);
        for (let i = 0; i < n; i++) pos[rank[i]] = i;
        const grid = Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => (i !== j && pos[i] < pos[j] ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findChampion(grid: List[List[int]]) -> int:\n    n = len(grid)\n    for i in range(n):\n        if all(grid[j][i] == 0 for j in range(n) if j != i):\n            return i\n    return -1`,
        javascript: `var findChampion = function(grid) {\n    var n = grid.length;\n    for (var i = 0; i < n; i++) {\n        var beaten = false;\n        for (var j = 0; j < n; j++) {\n            if (j !== i && grid[j][i] === 1) beaten = true;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n};`,
        typescript: `function findChampion(grid: number[][]): number {\n    var n = grid.length;\n    for (var i = 0; i < n; i++) {\n        var beaten = false;\n        for (var j = 0; j < n; j++) {\n            if (j !== i && grid[j][i] === 1) beaten = true;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n}`,
        java: `public static int findChampion(int[][] grid) {\n    int n = grid.length;\n    for (int i = 0; i < n; i++) {\n        boolean beaten = false;\n        for (int j = 0; j < n; j++) {\n            if (j != i && grid[j][i] == 1) beaten = true;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n}`,
        cpp: `int findChampion(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    for (int i = 0; i < n; i++) {\n        bool beaten = false;\n        for (int j = 0; j < n; j++) {\n            if (j != i && grid[j][i] == 1) beaten = true;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n}`,
        c: `int findChampion(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    (void) gridColSize;\n    for (int i = 0; i < n; i++) {\n        int beaten = 0;\n        for (int j = 0; j < n; j++) {\n            if (j != i && grid[j][i] == 1) beaten = 1;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n}`,
        csharp: `public static int FindChampion(int[][] grid)\n{\n    int n = grid.Length;\n    for (int i = 0; i < n; i++)\n    {\n        bool beaten = false;\n        for (int j = 0; j < n; j++)\n        {\n            if (j != i && grid[j][i] == 1) beaten = true;\n        }\n        if (!beaten) return i;\n    }\n    return -1;\n}`,
        go: `func findChampion(grid [][]int) int {\n\tn := len(grid)\n\tfor i := 0; i < n; i++ {\n\t\tbeaten := false\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif j != i && grid[j][i] == 1 {\n\t\t\t\tbeaten = true\n\t\t\t}\n\t\t}\n\t\tif !beaten {\n\t\t\treturn i\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun findChampion(grid: Array<IntArray>): Int {\n    val n = grid.size\n    for (i in 0 until n) {\n        var beaten = false\n        for (j in 0 until n) {\n            if (j != i && grid[j][i] == 1) beaten = true\n        }\n        if (!beaten) return i\n    }\n    return -1\n}`,
        swift: `func findChampion(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    for i in 0..<n {\n        var beaten = false\n        for j in 0..<n where j != i && grid[j][i] == 1 { beaten = true }\n        if !beaten { return i }\n    }\n    return -1\n}`,
        rust: `fn findChampion(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    for i in 0..n {\n        let mut beaten = false;\n        for j in 0..n {\n            if j != i && grid[j][i] == 1 {\n                beaten = true;\n            }\n        }\n        if !beaten {\n            return i as i32;\n        }\n    }\n    -1\n}`,
        php: `function findChampion($grid) {\n    $n = count($grid);\n    for ($i = 0; $i < $n; $i++) {\n        $beaten = false;\n        for ($j = 0; $j < $n; $j++) {\n            if ($j !== $i && $grid[$j][$i] === 1) $beaten = true;\n        }\n        if (!$beaten) return $i;\n    }\n    return -1;\n}`,
        ruby: `def findChampion(grid)\n  n = grid.length\n  (0...n).each do |i|\n    beaten = false\n    (0...n).each do |j|\n      beaten = true if j != i && grid[j][i] == 1\n    end\n    return i unless beaten\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Find Champion II (LC 2924) ──────────────────────────────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const indeg = new Array(n).fill(0);
      for (let i = 0; i < edges.length; i++) indeg[edges[i][1]]++;
      let champ = -1;
      for (let i = 0; i < n; i++) {
        if (indeg[i] !== 0) continue;
        if (champ >= 0) return -1;
        champ = i;
      }
      return champ;
    };
    return {
      slug: "find-champion-ii",
      title: "Find Champion II",
      difficulty: "EASY" as const,
      tags: ["Graph", "Amazon", "Google", "Wipro"],
      signature: { funcName: "findChampion", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`n` teams form a directed acyclic graph: an edge `[u, v]` means team `u` is stronger than team `v`.\n\nA team is the **champion** if no other team is stronger than it. Return the champion's index if there is exactly one, and `-1` if there is none or more than one.",
        [
          { in: "n = 3, edges = [[0,1],[1,2]]", out: "0", note: "Nothing points at team 0." },
          { in: "n = 4, edges = [[0,2],[1,3],[1,2]]", out: "-1", note: "Both team 0 and team 1 have nothing above them." },
          { in: "n = 2, edges = [[1,0]]", out: "1" },
        ],
        ["1 <= n <= 100", "m == edges.length", "0 <= m <= n * (n - 1) / 2", "edges[i].length == 2", "0 <= edges[i][j] <= n - 1", "edges[i][0] != edges[i][1]", "The input is a directed acyclic graph with no repeated edges."]),
      hints: [
        "\"No team is stronger than it\" means no edge points *into* it.",
        "Count the in-degree of every node.",
        "Exactly one node of in-degree zero gives the answer; zero or several give `-1`.",
      ],
      editorial: explain({
        idea: "The champion is a node with in-degree 0, so one pass over the edges and one pass over the nodes settles it.",
        steps: [
          "Count `indeg[v]` for every edge `[u, v]`.",
          "Scan the nodes for in-degree zero.",
          "Return the single such node, or `-1` if the count is not exactly one.",
        ],
        why: "The graph being acyclic guarantees at least one node of in-degree zero, so `-1` only ever comes from an *ambiguous* answer, never an absent one. A second such node means neither is comparable to the other, so no single team is above everything.",
        time: "O(n + m)",
        space: "O(n)",
        pitfalls: [
          "Out-degree is not the test; a team with many wins may still lose to someone.",
          "Two zero-in-degree nodes must answer `-1`, not the first one found.",
          "A graph with no edges and `n > 1` answers `-1`.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1],[1,2]]", expectedOutput: "0" },
        { input: "4\n[[0,2],[1,3],[1,2]]", expectedOutput: "-1" },
        { input: "2\n[[1,0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        // Orient every chosen pair along a random ranking, so the graph is
        // always acyclic and free of repeated edges.
        const n = ri(rng, 1, 7);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const edges: number[][] = [];
        for (let a = 0; a < n; a++) {
          for (let b = a + 1; b < n; b++) {
            if (rng() < 0.45) edges.push([order[a], order[b]]);
          }
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findChampion(n: int, edges: List[List[int]]) -> int:\n    indeg = [0] * n\n    for _, v in edges:\n        indeg[v] += 1\n    champ = -1\n    for i in range(n):\n        if indeg[i] != 0:\n            continue\n        if champ >= 0:\n            return -1\n        champ = i\n    return champ`,
        javascript: `var findChampion = function(n, edges) {\n    var indeg = [];\n    for (var i = 0; i < n; i++) indeg.push(0);\n    for (i = 0; i < edges.length; i++) indeg[edges[i][1]]++;\n    var champ = -1;\n    for (i = 0; i < n; i++) {\n        if (indeg[i] !== 0) continue;\n        if (champ >= 0) return -1;\n        champ = i;\n    }\n    return champ;\n};`,
        typescript: `function findChampion(n: number, edges: number[][]): number {\n    var indeg: number[] = [];\n    for (var i = 0; i < n; i++) indeg.push(0);\n    for (i = 0; i < edges.length; i++) indeg[edges[i][1]]++;\n    var champ = -1;\n    for (i = 0; i < n; i++) {\n        if (indeg[i] !== 0) continue;\n        if (champ >= 0) return -1;\n        champ = i;\n    }\n    return champ;\n}`,
        java: `public static int findChampion(int n, int[][] edges) {\n    int[] indeg = new int[n];\n    for (int[] e : edges) indeg[e[1]]++;\n    int champ = -1;\n    for (int i = 0; i < n; i++) {\n        if (indeg[i] != 0) continue;\n        if (champ >= 0) return -1;\n        champ = i;\n    }\n    return champ;\n}`,
        cpp: `int findChampion(int n, vector<vector<int>>& edges) {\n    vector<int> indeg(n, 0);\n    for (auto& e : edges) indeg[e[1]]++;\n    int champ = -1;\n    for (int i = 0; i < n; i++) {\n        if (indeg[i] != 0) continue;\n        if (champ >= 0) return -1;\n        champ = i;\n    }\n    return champ;\n}`,
        c: `int findChampion(int n, int** edges, int edgesSize, int* edgesColSize) {\n    (void) edgesColSize;\n    int* indeg = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < edgesSize; i++) indeg[edges[i][1]]++;\n    int champ = -1;\n    for (int i = 0; i < n; i++) {\n        if (indeg[i] != 0) continue;\n        if (champ >= 0) { champ = -1; break; }\n        champ = i;\n    }\n    free(indeg);\n    return champ;\n}`,
        csharp: `public static int FindChampion(int n, int[][] edges)\n{\n    var indeg = new int[n];\n    foreach (var e in edges) indeg[e[1]]++;\n    int champ = -1;\n    for (int i = 0; i < n; i++)\n    {\n        if (indeg[i] != 0) continue;\n        if (champ >= 0) return -1;\n        champ = i;\n    }\n    return champ;\n}`,
        go: `func findChampion(n int, edges [][]int) int {\n\tindeg := make([]int, n)\n\tfor _, e := range edges {\n\t\tindeg[e[1]]++\n\t}\n\tchamp := -1\n\tfor i := 0; i < n; i++ {\n\t\tif indeg[i] != 0 {\n\t\t\tcontinue\n\t\t}\n\t\tif champ >= 0 {\n\t\t\treturn -1\n\t\t}\n\t\tchamp = i\n\t}\n\treturn champ\n}`,
        kotlin: `fun findChampion(n: Int, edges: Array<IntArray>): Int {\n    val indeg = IntArray(n)\n    for (e in edges) indeg[e[1]]++\n    var champ = -1\n    for (i in 0 until n) {\n        if (indeg[i] != 0) continue\n        if (champ >= 0) return -1\n        champ = i\n    }\n    return champ\n}`,
        swift: `func findChampion(_ n: Int, _ edges: [[Int]]) -> Int {\n    var indeg = [Int](repeating: 0, count: n)\n    for e in edges { indeg[e[1]] += 1 }\n    var champ = -1\n    for i in 0..<n {\n        if indeg[i] != 0 { continue }\n        if champ >= 0 { return -1 }\n        champ = i\n    }\n    return champ\n}`,
        rust: `fn findChampion(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut indeg = vec![0i32; n];\n    for e in edges.iter() {\n        indeg[e[1] as usize] += 1;\n    }\n    let mut champ = -1i32;\n    for i in 0..n {\n        if indeg[i] != 0 {\n            continue;\n        }\n        if champ >= 0 {\n            return -1;\n        }\n        champ = i as i32;\n    }\n    champ\n}`,
        php: `function findChampion($n, $edges) {\n    $indeg = array_fill(0, $n, 0);\n    foreach ($edges as $e) $indeg[$e[1]]++;\n    $champ = -1;\n    for ($i = 0; $i < $n; $i++) {\n        if ($indeg[$i] !== 0) continue;\n        if ($champ >= 0) return -1;\n        $champ = $i;\n    }\n    return $champ;\n}`,
        ruby: `def findChampion(n, edges)\n  indeg = Array.new(n, 0)\n  edges.each { |_, v| indeg[v] += 1 }\n  champ = -1\n  (0...n).each do |i|\n    next if indeg[i] != 0\n    return -1 if champ >= 0\n    champ = i\n  end\n  champ\nend`,
      },
    };
  })(),

  // ── Reachable Nodes With Restrictions (LC 2368) ─────────────────
  (() => {
    const ref = (n: number, edges: number[][], restricted: number[]) => {
      const blocked = new Array(n).fill(false);
      for (let i = 0; i < restricted.length; i++) blocked[restricted[i]] = true;
      const head = new Array(n).fill(-1);
      const nxt = new Array(edges.length * 2).fill(-1);
      const to = new Array(edges.length * 2).fill(0);
      let cnt = 0;
      const addEdge = (u: number, v: number) => {
        to[cnt] = v;
        nxt[cnt] = head[u];
        head[u] = cnt;
        cnt++;
      };
      for (let i = 0; i < edges.length; i++) {
        addEdge(edges[i][0], edges[i][1]);
        addEdge(edges[i][1], edges[i][0]);
      }
      if (blocked[0]) return 0;
      const seen = new Array(n).fill(false);
      seen[0] = true;
      const stack = [0];
      let total = 0;
      while (stack.length > 0) {
        const u = stack.pop() as number;
        total++;
        for (let e = head[u]; e >= 0; e = nxt[e]) {
          const v = to[e];
          if (seen[v] || blocked[v]) continue;
          seen[v] = true;
          stack.push(v);
        }
      }
      return total;
    };
    return {
      slug: "reachable-nodes-with-restrictions",
      title: "Reachable Nodes With Restrictions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Tree", "Graph", "Depth-First Search", "Breadth-First Search", "Union Find", "Amazon", "Google", "Accenture"],
      signature: { funcName: "reachableNodes", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "restricted", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An undirected **tree** has `n` nodes labelled `0 … n - 1` and `n - 1` edges. Some nodes are listed in `restricted` and may not be visited.\n\nReturn how many nodes can be reached from node `0`, counting node `0` itself. Node `0` is never restricted.",
        [
          { in: "n = 7, edges = [[0,1],[1,2],[3,1],[4,0],[0,5],[5,6]], restricted = [4,5]", out: "4", note: "Nodes 0, 1, 2 and 3; the branches through 4 and 5 are cut off." },
          { in: "n = 7, edges = [[0,1],[0,2],[0,5],[0,4],[3,2],[6,5]], restricted = [4,2,1]", out: "3", note: "Only nodes 0, 5 and 6 remain reachable." },
          { in: "n = 2, edges = [[0,1]], restricted = [1]", out: "1" },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] < n", "edges represents a valid tree", "1 <= restricted.length < n", "1 <= restricted[i] < n", "All the values of restricted are unique."]),
      hints: [
        "Mark the restricted nodes in a boolean array first.",
        "Then it is an ordinary traversal from node 0 that simply refuses to step onto a marked node.",
        "Removing a restricted node from a tree disconnects everything behind it.",
      ],
      editorial: explain({
        idea: "Mark the restricted nodes, then run a depth-first or breadth-first search from node 0 that skips them, and count what it visits.",
        steps: [
          "Fill a `blocked` array from `restricted`.",
          "Build the adjacency list from the edges, both directions.",
          "Traverse from node 0, never entering a blocked node.",
          "Return the number of nodes visited.",
        ],
        why: "In a tree there is exactly one path between any two nodes, so a restricted node on that path makes the far end unreachable — the traversal needs no special handling for cut branches, it simply never walks into one. An iterative stack is used rather than recursion because `n` reaches 100 000 and a path-shaped tree would blow the call stack.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A `restricted` list searched linearly per step is `O(n · restricted)`; mark it in an array instead.",
          "Edges are undirected, so both directions go into the adjacency list.",
          "Node 0 counts towards the answer.",
        ],
      }),
      examples: [
        { input: "7\n[[0,1],[1,2],[3,1],[4,0],[0,5],[5,6]]\n[4,5]", expectedOutput: "4" },
        { input: "7\n[[0,1],[0,2],[0,5],[0,4],[3,2],[6,5]]\n[4,2,1]", expectedOutput: "3" },
        { input: "2\n[[0,1]]\n[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        // A random parent for every node above 0 is always a valid tree.
        const n = ri(rng, 2, 10);
        const edges: number[][] = [];
        for (let v = 1; v < n; v++) edges.push([ri(rng, 0, v - 1), v]);
        const pool = shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1));
        const restricted = pool.slice(0, ri(rng, 1, n - 1));
        return {
          input: `${n}\n${fmtIntMat(edges)}\n${fmtIntArr(restricted)}`,
          expectedOutput: String(ref(n, edges, restricted)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef reachableNodes(n: int, edges: List[List[int]], restricted: List[int]) -> int:\n    blocked = [False] * n\n    for r in restricted:\n        blocked[r] = True\n    adj = [[] for _ in range(n)]\n    for u, v in edges:\n        adj[u].append(v)\n        adj[v].append(u)\n    if blocked[0]:\n        return 0\n    seen = [False] * n\n    seen[0] = True\n    stack = [0]\n    total = 0\n    while stack:\n        u = stack.pop()\n        total += 1\n        for v in adj[u]:\n            if seen[v] or blocked[v]:\n                continue\n            seen[v] = True\n            stack.append(v)\n    return total`,
        javascript: `var reachableNodes = function(n, edges, restricted) {\n    var i;\n    var blocked = [], adj = [];\n    for (i = 0; i < n; i++) { blocked.push(false); adj.push([]); }\n    for (i = 0; i < restricted.length; i++) blocked[restricted[i]] = true;\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push(edges[i][1]);\n        adj[edges[i][1]].push(edges[i][0]);\n    }\n    if (blocked[0]) return 0;\n    var seen = [];\n    for (i = 0; i < n; i++) seen.push(false);\n    seen[0] = true;\n    var stack = [0];\n    var total = 0;\n    while (stack.length > 0) {\n        var u = stack.pop();\n        total++;\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v] || blocked[v]) continue;\n            seen[v] = true;\n            stack.push(v);\n        }\n    }\n    return total;\n};`,
        typescript: `function reachableNodes(n: number, edges: number[][], restricted: number[]): number {\n    var i: number;\n    var blocked: boolean[] = [], adj: number[][] = [];\n    for (i = 0; i < n; i++) { blocked.push(false); adj.push([]); }\n    for (i = 0; i < restricted.length; i++) blocked[restricted[i]] = true;\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push(edges[i][1]);\n        adj[edges[i][1]].push(edges[i][0]);\n    }\n    if (blocked[0]) return 0;\n    var seen: boolean[] = [];\n    for (i = 0; i < n; i++) seen.push(false);\n    seen[0] = true;\n    var stack: number[] = [0];\n    var total = 0;\n    while (stack.length > 0) {\n        var u = stack.pop() as number;\n        total++;\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v] || blocked[v]) continue;\n            seen[v] = true;\n            stack.push(v);\n        }\n    }\n    return total;\n}`,
        java: `public static int reachableNodes(int n, int[][] edges, int[] restricted) {\n    boolean[] blocked = new boolean[n];\n    for (int r : restricted) blocked[r] = true;\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    for (int[] e : edges) {\n        adj.get(e[0]).add(e[1]);\n        adj.get(e[1]).add(e[0]);\n    }\n    if (blocked[0]) return 0;\n    boolean[] seen = new boolean[n];\n    seen[0] = true;\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(0);\n    int total = 0;\n    while (!stack.isEmpty()) {\n        int u = stack.pop();\n        total++;\n        for (int v : adj.get(u)) {\n            if (seen[v] || blocked[v]) continue;\n            seen[v] = true;\n            stack.push(v);\n        }\n    }\n    return total;\n}`,
        cpp: `int reachableNodes(int n, vector<vector<int>>& edges, vector<int>& restricted) {\n    vector<char> blocked(n, 0);\n    for (int r : restricted) blocked[r] = 1;\n    vector<vector<int>> adj(n);\n    for (auto& e : edges) {\n        adj[e[0]].push_back(e[1]);\n        adj[e[1]].push_back(e[0]);\n    }\n    if (blocked[0]) return 0;\n    vector<char> seen(n, 0);\n    seen[0] = 1;\n    vector<int> stack = { 0 };\n    int total = 0;\n    while (!stack.empty()) {\n        int u = stack.back();\n        stack.pop_back();\n        total++;\n        for (int v : adj[u]) {\n            if (seen[v] || blocked[v]) continue;\n            seen[v] = 1;\n            stack.push_back(v);\n        }\n    }\n    return total;\n}`,
        c: `int reachableNodes(int n, int** edges, int edgesSize, int* edgesColSize, int* restricted, int restrictedSize) {\n    (void) edgesColSize;\n    char* blocked = (char*) calloc((size_t) n, 1);\n    for (int i = 0; i < restrictedSize; i++) blocked[restricted[i]] = 1;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = edgesSize * 2 > 0 ? edgesSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int cnt = 0;\n    for (int i = 0; i < edgesSize; i++) {\n        int u = edges[i][0], v = edges[i][1];\n        to[cnt] = v; nxt[cnt] = head[u]; head[u] = cnt; cnt++;\n        to[cnt] = u; nxt[cnt] = head[v]; head[v] = cnt; cnt++;\n    }\n    int total = 0;\n    if (!blocked[0]) {\n        char* seen = (char*) calloc((size_t) n, 1);\n        int* stack = (int*) malloc((size_t) n * sizeof(int));\n        int top = 0;\n        seen[0] = 1;\n        stack[top++] = 0;\n        while (top > 0) {\n            int u = stack[--top];\n            total++;\n            for (int e = head[u]; e >= 0; e = nxt[e]) {\n                int v = to[e];\n                if (seen[v] || blocked[v]) continue;\n                seen[v] = 1;\n                stack[top++] = v;\n            }\n        }\n        free(seen);\n        free(stack);\n    }\n    free(blocked);\n    free(head);\n    free(nxt);\n    free(to);\n    return total;\n}`,
        csharp: `public static int ReachableNodes(int n, int[][] edges, int[] restricted)\n{\n    var blocked = new bool[n];\n    foreach (var r in restricted) blocked[r] = true;\n    var adj = new List<int>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int>();\n    foreach (var e in edges)\n    {\n        adj[e[0]].Add(e[1]);\n        adj[e[1]].Add(e[0]);\n    }\n    if (blocked[0]) return 0;\n    var seen = new bool[n];\n    seen[0] = true;\n    var stack = new Stack<int>();\n    stack.Push(0);\n    int total = 0;\n    while (stack.Count > 0)\n    {\n        int u = stack.Pop();\n        total++;\n        foreach (var v in adj[u])\n        {\n            if (seen[v] || blocked[v]) continue;\n            seen[v] = true;\n            stack.Push(v);\n        }\n    }\n    return total;\n}`,
        go: `func reachableNodes(n int, edges [][]int, restricted []int) int {\n\tblocked := make([]bool, n)\n\tfor _, r := range restricted {\n\t\tblocked[r] = true\n\t}\n\tadj := make([][]int, n)\n\tfor _, e := range edges {\n\t\tadj[e[0]] = append(adj[e[0]], e[1])\n\t\tadj[e[1]] = append(adj[e[1]], e[0])\n\t}\n\tif blocked[0] {\n\t\treturn 0\n\t}\n\tseen := make([]bool, n)\n\tseen[0] = true\n\tstack := []int{0}\n\ttotal := 0\n\tfor len(stack) > 0 {\n\t\tu := stack[len(stack)-1]\n\t\tstack = stack[:len(stack)-1]\n\t\ttotal++\n\t\tfor _, v := range adj[u] {\n\t\t\tif seen[v] || blocked[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[v] = true\n\t\t\tstack = append(stack, v)\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun reachableNodes(n: Int, edges: Array<IntArray>, restricted: IntArray): Int {\n    val blocked = BooleanArray(n)\n    for (r in restricted) blocked[r] = true\n    val adj = Array(n) { ArrayList<Int>() }\n    for (e in edges) {\n        adj[e[0]].add(e[1])\n        adj[e[1]].add(e[0])\n    }\n    if (blocked[0]) return 0\n    val seen = BooleanArray(n)\n    seen[0] = true\n    val stack = ArrayList<Int>()\n    stack.add(0)\n    var total = 0\n    while (stack.isNotEmpty()) {\n        val u = stack.removeAt(stack.size - 1)\n        total++\n        for (v in adj[u]) {\n            if (seen[v] || blocked[v]) continue\n            seen[v] = true\n            stack.add(v)\n        }\n    }\n    return total\n}`,
        swift: `func reachableNodes(_ n: Int, _ edges: [[Int]], _ restricted: [Int]) -> Int {\n    var blocked = [Bool](repeating: false, count: n)\n    for r in restricted { blocked[r] = true }\n    var adj = [[Int]](repeating: [], count: n)\n    for e in edges {\n        adj[e[0]].append(e[1])\n        adj[e[1]].append(e[0])\n    }\n    if blocked[0] { return 0 }\n    var seen = [Bool](repeating: false, count: n)\n    seen[0] = true\n    var stack = [0]\n    var total = 0\n    while let u = stack.popLast() {\n        total += 1\n        for v in adj[u] {\n            if seen[v] || blocked[v] { continue }\n            seen[v] = true\n            stack.append(v)\n        }\n    }\n    return total\n}`,
        rust: `fn reachableNodes(n: i32, edges: Vec<Vec<i32>>, restricted: Vec<i32>) -> i32 {\n    let n = n as usize;\n    let mut blocked = vec![false; n];\n    for &r in restricted.iter() {\n        blocked[r as usize] = true;\n    }\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    for e in edges.iter() {\n        adj[e[0] as usize].push(e[1] as usize);\n        adj[e[1] as usize].push(e[0] as usize);\n    }\n    if blocked[0] {\n        return 0;\n    }\n    let mut seen = vec![false; n];\n    seen[0] = true;\n    let mut stack = vec![0usize];\n    let mut total = 0i32;\n    while let Some(u) = stack.pop() {\n        total += 1;\n        for &v in adj[u].iter() {\n            if seen[v] || blocked[v] {\n                continue;\n            }\n            seen[v] = true;\n            stack.push(v);\n        }\n    }\n    total\n}`,
        php: `function reachableNodes($n, $edges, $restricted) {\n    $blocked = array_fill(0, $n, false);\n    foreach ($restricted as $r) $blocked[$r] = true;\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    foreach ($edges as $e) {\n        $adj[$e[0]][] = $e[1];\n        $adj[$e[1]][] = $e[0];\n    }\n    if ($blocked[0]) return 0;\n    $seen = array_fill(0, $n, false);\n    $seen[0] = true;\n    $stack = [0];\n    $total = 0;\n    while (count($stack) > 0) {\n        $u = array_pop($stack);\n        $total++;\n        foreach ($adj[$u] as $v) {\n            if ($seen[$v] || $blocked[$v]) continue;\n            $seen[$v] = true;\n            $stack[] = $v;\n        }\n    }\n    return $total;\n}`,
        ruby: `def reachableNodes(n, edges, restricted)\n  blocked = Array.new(n, false)\n  restricted.each { |r| blocked[r] = true }\n  adj = Array.new(n) { [] }\n  edges.each do |u, v|\n    adj[u] << v\n    adj[v] << u\n  end\n  return 0 if blocked[0]\n  seen = Array.new(n, false)\n  seen[0] = true\n  stack = [0]\n  total = 0\n  until stack.empty?\n    u = stack.pop\n    total += 1\n    adj[u].each do |v|\n      next if seen[v] || blocked[v]\n      seen[v] = true\n      stack << v\n    end\n  end\n  total\nend`,
      },
    };
  })(),


  // ── Minimum Score of a Path Between Two Cities (LC 2492) ─────────
  (() => {
    const ref = (n: number, roads: number[][]) => {
      const parent = Array.from({ length: n + 1 }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      for (let i = 0; i < roads.length; i++) {
        const a = find(roads[i][0]), b = find(roads[i][1]);
        if (a !== b) parent[b] = a;
      }
      const root = find(1);
      let best = 1000000000;
      for (let i = 0; i < roads.length; i++) {
        if (find(roads[i][0]) !== root) continue;
        if (roads[i][2] < best) best = roads[i][2];
      }
      return best;
    };
    return {
      slug: "minimum-score-of-a-path-between-two-cities",
      title: "Minimum Score of a Path Between Two Cities",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Union Find", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Oracle"],
      signature: { funcName: "minScore", params: [{ name: "n", type: "int" as const }, { name: "roads", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`n` cities numbered `1 … n` are joined by bidirectional roads; `roads[i] = [a, b, distance]`.\n\nThe **score** of a path is the minimum distance among the roads it uses. A path may revisit cities and reuse roads, and need not be the shortest. Return the minimum possible score of any path from city `1` to city `n`. City `n` is reachable from city `1`.",
        [
          { in: "roads = [[1,2,9],[2,3,6],[2,4,5],[1,4,7]], n = 4", out: "5", note: "Walk 1 → 2 → 4 → 2 → 4: the road of length 5 is on the path." },
          { in: "roads = [[1,2,2],[1,3,4],[3,4,7]], n = 4", out: "2", note: "Detour over the road of length 2 and come back." },
          { in: "roads = [[1,2,3]], n = 2", out: "3" },
        ],
        ["2 <= n <= 10^5", "1 <= roads.length <= 10^5", "roads[i].length == 3", "1 <= a, b <= n", "a != b", "1 <= distance <= 10^4", "There are no repeated edges.", "City n is reachable from city 1."]),
      hints: [
        "A path may wander freely and reuse roads, so it can take in **any** road in the connected component it starts from.",
        "So the shape of the path is irrelevant — only which roads are reachable.",
        "Find the component holding city 1 and return the smallest road weight inside it.",
      ],
      editorial: explain({
        idea: "Because a path can revisit cities and reuse roads, it can detour to any road in city 1's connected component and come back. So the answer is simply the minimum weight among the component's roads.",
        steps: [
          "Union the endpoints of every road.",
          "Find the component root of city 1 — city `n` is in it by assumption.",
          "Scan the roads and take the minimum weight among those inside that component.",
        ],
        why: "This is why no shortest-path algorithm appears: the usual trade-off between path length and edge weights vanishes once revisiting is free. Detouring along the component's lightest road, then walking on to city `n`, gives a path whose minimum is that weight — and no path can beat it, since every road it uses lies in the component.",
        time: "O(n + m · α(n))",
        space: "O(n)",
        pitfalls: [
          "Dijkstra's algorithm answers a different question and gives the wrong result here.",
          "Roads outside city 1's component must be ignored, however light.",
          "Cities are numbered from 1, so size the union-find arrays accordingly.",
        ],
      }),
      examples: [
        { input: "4\n[[1,2,9],[2,3,6],[2,4,5],[1,4,7]]", expectedOutput: "5" },
        { input: "4\n[[1,2,2],[1,3,4],[3,4,7]]", expectedOutput: "2" },
        { input: "2\n[[1,2,3]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 9);
        const roads: number[][] = [];
        const seen = new Set<number>();
        // A spanning path keeps city n reachable from city 1, as promised.
        const order = shuffle(rng, Array.from({ length: n - 2 }, (_, i) => i + 2));
        const chain = [1].concat(order, [n]);
        for (let i = 0; i + 1 < chain.length; i++) {
          const a = chain[i], b = chain[i + 1];
          seen.add(Math.min(a, b) * (n + 1) + Math.max(a, b));
          roads.push([a, b, ri(rng, 1, 40)]);
        }
        for (let k = 0; k < 5; k++) {
          const a = ri(rng, 1, n), b = ri(rng, 1, n);
          if (a === b) continue;
          const key = Math.min(a, b) * (n + 1) + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          roads.push([a, b, ri(rng, 1, 40)]);
        }
        return { input: `${n}\n${fmtIntMat(roads)}`, expectedOutput: String(ref(n, roads)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minScore(n: int, roads: List[List[int]]) -> int:\n    parent = list(range(n + 1))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b, _ in roads:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[rb] = ra\n    root = find(1)\n    return min(d for a, _, d in roads if find(a) == root)`,
        javascript: `var minScore = function(n, roads) {\n    var i;\n    var parent = [];\n    for (i = 0; i <= n; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < roads.length; i++) {\n        var a = find(roads[i][0]), b = find(roads[i][1]);\n        if (a !== b) parent[b] = a;\n    }\n    var root = find(1);\n    var best = 1000000000;\n    for (i = 0; i < roads.length; i++) {\n        if (find(roads[i][0]) !== root) continue;\n        if (roads[i][2] < best) best = roads[i][2];\n    }\n    return best;\n};`,
        typescript: `function minScore(n: number, roads: number[][]): number {\n    var i: number;\n    var parent: number[] = [];\n    for (i = 0; i <= n; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < roads.length; i++) {\n        var a = find(roads[i][0]), b = find(roads[i][1]);\n        if (a !== b) parent[b] = a;\n    }\n    var root = find(1);\n    var best = 1000000000;\n    for (i = 0; i < roads.length; i++) {\n        if (find(roads[i][0]) !== root) continue;\n        if (roads[i][2] < best) best = roads[i][2];\n    }\n    return best;\n}`,
        java: `private static int[] msParent;\n\nprivate static int msFind(int x) {\n    while (msParent[x] != x) {\n        msParent[x] = msParent[msParent[x]];\n        x = msParent[x];\n    }\n    return x;\n}\n\npublic static int minScore(int n, int[][] roads) {\n    msParent = new int[n + 1];\n    for (int i = 0; i <= n; i++) msParent[i] = i;\n    for (int[] r : roads) {\n        int a = msFind(r[0]), b = msFind(r[1]);\n        if (a != b) msParent[b] = a;\n    }\n    int root = msFind(1);\n    int best = Integer.MAX_VALUE;\n    for (int[] r : roads) {\n        if (msFind(r[0]) != root) continue;\n        best = Math.min(best, r[2]);\n    }\n    return best;\n}`,
        cpp: `int minScore(int n, vector<vector<int>>& roads) {\n    vector<int> parent(n + 1);\n    for (int i = 0; i <= n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (auto& r : roads) {\n        int a = find(r[0]), b = find(r[1]);\n        if (a != b) parent[b] = a;\n    }\n    int root = find(1);\n    int best = INT_MAX;\n    for (auto& r : roads) {\n        if (find(r[0]) != root) continue;\n        best = min(best, r[2]);\n    }\n    return best;\n}`,
        c: `static int* msParent;\n\nstatic int msFind(int x) {\n    while (msParent[x] != x) {\n        msParent[x] = msParent[msParent[x]];\n        x = msParent[x];\n    }\n    return x;\n}\n\nint minScore(int n, int** roads, int roadsSize, int* roadsColSize) {\n    (void) roadsColSize;\n    msParent = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int i = 0; i <= n; i++) msParent[i] = i;\n    for (int i = 0; i < roadsSize; i++) {\n        int a = msFind(roads[i][0]), b = msFind(roads[i][1]);\n        if (a != b) msParent[b] = a;\n    }\n    int root = msFind(1);\n    int best = 1000000000;\n    for (int i = 0; i < roadsSize; i++) {\n        if (msFind(roads[i][0]) != root) continue;\n        if (roads[i][2] < best) best = roads[i][2];\n    }\n    free(msParent);\n    return best;\n}`,
        csharp: `public static int MinScore(int n, int[][] roads)\n{\n    var parent = new int[n + 1];\n    for (int i = 0; i <= n; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    foreach (var r in roads)\n    {\n        int a = Find(r[0]), b = Find(r[1]);\n        if (a != b) parent[b] = a;\n    }\n    int root = Find(1);\n    int best = int.MaxValue;\n    foreach (var r in roads)\n    {\n        if (Find(r[0]) != root) continue;\n        best = Math.Min(best, r[2]);\n    }\n    return best;\n}`,
        go: `func minScore(n int, roads [][]int) int {\n\tparent := make([]int, n+1)\n\tfor i := 0; i <= n; i++ {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tfor _, r := range roads {\n\t\ta, b := find(r[0]), find(r[1])\n\t\tif a != b {\n\t\t\tparent[b] = a\n\t\t}\n\t}\n\troot := find(1)\n\tbest := 1000000000\n\tfor _, r := range roads {\n\t\tif find(r[0]) != root {\n\t\t\tcontinue\n\t\t}\n\t\tif r[2] < best {\n\t\t\tbest = r[2]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minScore(n: Int, roads: Array<IntArray>): Int {\n    val parent = IntArray(n + 1) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for (r in roads) {\n        val a = find(r[0])\n        val b = find(r[1])\n        if (a != b) parent[b] = a\n    }\n    val root = find(1)\n    var best = Int.MAX_VALUE\n    for (r in roads) {\n        if (find(r[0]) != root) continue\n        if (r[2] < best) best = r[2]\n    }\n    return best\n}`,
        swift: `func minScore(_ n: Int, _ roads: [[Int]]) -> Int {\n    var parent = Array(0...n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for r in roads {\n        let a = find(r[0]), b = find(r[1])\n        if a != b { parent[b] = a }\n    }\n    let root = find(1)\n    var best = Int.max\n    for r in roads {\n        if find(r[0]) != root { continue }\n        best = min(best, r[2])\n    }\n    return best\n}`,
        rust: `fn minScore(n: i32, roads: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut parent: Vec<usize> = (0..=n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    for r in roads.iter() {\n        let a = find(&mut parent, r[0] as usize);\n        let b = find(&mut parent, r[1] as usize);\n        if a != b {\n            parent[b] = a;\n        }\n    }\n    let root = find(&mut parent, 1);\n    let mut best = std::i32::MAX;\n    for r in roads.iter() {\n        if find(&mut parent, r[0] as usize) != root {\n            continue;\n        }\n        if r[2] < best {\n            best = r[2];\n        }\n    }\n    best\n}`,
        php: `function minScore($n, $roads) {\n    $parent = range(0, $n);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    foreach ($roads as $r) {\n        $a = $find($r[0]);\n        $b = $find($r[1]);\n        if ($a !== $b) $parent[$b] = $a;\n    }\n    $root = $find(1);\n    $best = 1000000000;\n    foreach ($roads as $r) {\n        if ($find($r[0]) !== $root) continue;\n        if ($r[2] < $best) $best = $r[2];\n    }\n    return $best;\n}`,
        ruby: `def minScore(n, roads)\n  parent = (0..n).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  roads.each do |a, b, _|\n    ra = find.call(a)\n    rb = find.call(b)\n    parent[rb] = ra if ra != rb\n  end\n  root = find.call(1)\n  roads.select { |a, _, _| find.call(a) == root }.map { |_, _, d| d }.min\nend`,
      },
    };
  })(),

  // ── Count the Number of Complete Components (LC 2685) ───────────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      for (let i = 0; i < edges.length; i++) {
        const a = find(edges[i][0]), b = find(edges[i][1]);
        if (a !== b) parent[b] = a;
      }
      const nodes = new Array(n).fill(0);
      const links = new Array(n).fill(0);
      for (let i = 0; i < n; i++) nodes[find(i)]++;
      for (let i = 0; i < edges.length; i++) links[find(edges[i][0])]++;
      let count = 0;
      for (let i = 0; i < n; i++) {
        if (find(i) !== i) continue;
        if (links[i] * 2 === nodes[i] * (nodes[i] - 1)) count++;
      }
      return count;
    };
    return {
      slug: "count-the-number-of-complete-components",
      title: "Count the Number of Complete Components",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Union Find", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "countCompleteComponents", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected graph has `n` vertices labelled `0 … n - 1`. A connected component is **complete** when every pair of its vertices is joined by an edge.\n\nReturn the number of complete connected components.",
        [
          { in: "n = 6, edges = [[0,1],[0,2],[1,2],[3,4]]", out: "3", note: "The triangle `{0,1,2}`, the pair `{3,4}` and the lone vertex `5`." },
          { in: "n = 6, edges = [[0,1],[0,2],[1,2],[3,4],[3,5]]", out: "1", note: "`{3,4,5}` is a path, not a triangle." },
          { in: "n = 1, edges = []", out: "1", note: "A single vertex is complete on its own." },
        ],
        ["1 <= n <= 50", "0 <= edges.length <= n * (n - 1) / 2", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] <= n - 1", "edges[i][0] != edges[i][1]", "There are no repeated edges."]),
      hints: [
        "A component with `s` vertices is complete exactly when it holds `s · (s - 1) / 2` edges.",
        "So you only need each component's vertex count and edge count.",
        "Union-find gives both in one pass over the edges.",
      ],
      editorial: explain({
        idea: "Reduce \"every pair joined\" to a count. A complete graph on `s` vertices has exactly `s · (s - 1) / 2` edges, so tally vertices and edges per component and compare.",
        steps: [
          "Union the endpoints of every edge.",
          "Count `nodes[root]` over the vertices and `links[root]` over the edges.",
          "A root is complete when `2 · links == nodes · (nodes - 1)`.",
        ],
        why: "The edge count is sufficient because the graph has no repeated edges: with `s` vertices and no duplicates the maximum possible edge count is `s · (s - 1) / 2`, and reaching it forces every pair to be present. Comparing `2 · links` to `nodes · (nodes - 1)` keeps the test in integers with no division.",
        time: "O(n + m · α(n))",
        space: "O(n)",
        pitfalls: [
          "A component of size 1 has 0 edges, and `1 * 0 == 0` makes the test pass without a special case.",
          "An isolated vertex is a complete component of size 1 with 0 edges.",
          "Dividing by 2 invites a rounding bug; multiply the other side instead.",
        ],
      }),
      examples: [
        { input: "6\n[[0,1],[0,2],[1,2],[3,4]]", expectedOutput: "3" },
        { input: "6\n[[0,1],[0,2],[1,2],[3,4],[3,5]]", expectedOutput: "1" },
        { input: "1\n[]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        // Partition the vertices into blocks; each block is either wired up
        // completely or thinned out, so both branches of the test get exercised.
        const n = ri(rng, 1, 10);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const edges: number[][] = [];
        let at = 0;
        while (at < n) {
          const take = Math.min(n - at, ri(rng, 1, 4));
          const block = order.slice(at, at + take);
          const full = rng() < 0.55;
          for (let a = 0; a < block.length; a++) {
            for (let b = a + 1; b < block.length; b++) {
              if (full || rng() < 0.5) edges.push([block[a], block[b]]);
            }
          }
          at += take;
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countCompleteComponents(n: int, edges: List[List[int]]) -> int:\n    parent = list(range(n))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for u, v in edges:\n        a, b = find(u), find(v)\n        if a != b:\n            parent[b] = a\n    nodes = [0] * n\n    links = [0] * n\n    for i in range(n):\n        nodes[find(i)] += 1\n    for u, _ in edges:\n        links[find(u)] += 1\n    count = 0\n    for i in range(n):\n        if find(i) != i:\n            continue\n        if links[i] * 2 == nodes[i] * (nodes[i] - 1):\n            count += 1\n    return count`,
        javascript: `var countCompleteComponents = function(n, edges) {\n    var i;\n    var parent = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < edges.length; i++) {\n        var a = find(edges[i][0]), b = find(edges[i][1]);\n        if (a !== b) parent[b] = a;\n    }\n    var nodes = [], links = [];\n    for (i = 0; i < n; i++) { nodes.push(0); links.push(0); }\n    for (i = 0; i < n; i++) nodes[find(i)]++;\n    for (i = 0; i < edges.length; i++) links[find(edges[i][0])]++;\n    var count = 0;\n    for (i = 0; i < n; i++) {\n        if (find(i) !== i) continue;\n        if (links[i] * 2 === nodes[i] * (nodes[i] - 1)) count++;\n    }\n    return count;\n};`,
        typescript: `function countCompleteComponents(n: number, edges: number[][]): number {\n    var i: number;\n    var parent: number[] = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < edges.length; i++) {\n        var a = find(edges[i][0]), b = find(edges[i][1]);\n        if (a !== b) parent[b] = a;\n    }\n    var nodes: number[] = [], links: number[] = [];\n    for (i = 0; i < n; i++) { nodes.push(0); links.push(0); }\n    for (i = 0; i < n; i++) nodes[find(i)]++;\n    for (i = 0; i < edges.length; i++) links[find(edges[i][0])]++;\n    var count = 0;\n    for (i = 0; i < n; i++) {\n        if (find(i) !== i) continue;\n        if (links[i] * 2 === nodes[i] * (nodes[i] - 1)) count++;\n    }\n    return count;\n}`,
        java: `private static int[] ccParent;\n\nprivate static int ccFind(int x) {\n    while (ccParent[x] != x) {\n        ccParent[x] = ccParent[ccParent[x]];\n        x = ccParent[x];\n    }\n    return x;\n}\n\npublic static int countCompleteComponents(int n, int[][] edges) {\n    ccParent = new int[n];\n    for (int i = 0; i < n; i++) ccParent[i] = i;\n    for (int[] e : edges) {\n        int a = ccFind(e[0]), b = ccFind(e[1]);\n        if (a != b) ccParent[b] = a;\n    }\n    int[] nodes = new int[n];\n    int[] links = new int[n];\n    for (int i = 0; i < n; i++) nodes[ccFind(i)]++;\n    for (int[] e : edges) links[ccFind(e[0])]++;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (ccFind(i) != i) continue;\n        if (links[i] * 2 == nodes[i] * (nodes[i] - 1)) count++;\n    }\n    return count;\n}`,
        cpp: `int countCompleteComponents(int n, vector<vector<int>>& edges) {\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (auto& e : edges) {\n        int a = find(e[0]), b = find(e[1]);\n        if (a != b) parent[b] = a;\n    }\n    vector<int> nodes(n, 0), links(n, 0);\n    for (int i = 0; i < n; i++) nodes[find(i)]++;\n    for (auto& e : edges) links[find(e[0])]++;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (find(i) != i) continue;\n        if (links[i] * 2 == nodes[i] * (nodes[i] - 1)) count++;\n    }\n    return count;\n}`,
        c: `static int* ccParent;\n\nstatic int ccFind(int x) {\n    while (ccParent[x] != x) {\n        ccParent[x] = ccParent[ccParent[x]];\n        x = ccParent[x];\n    }\n    return x;\n}\n\nint countCompleteComponents(int n, int** edges, int edgesSize, int* edgesColSize) {\n    (void) edgesColSize;\n    ccParent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) ccParent[i] = i;\n    for (int i = 0; i < edgesSize; i++) {\n        int a = ccFind(edges[i][0]), b = ccFind(edges[i][1]);\n        if (a != b) ccParent[b] = a;\n    }\n    int* nodes = (int*) calloc((size_t) n, sizeof(int));\n    int* links = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) nodes[ccFind(i)]++;\n    for (int i = 0; i < edgesSize; i++) links[ccFind(edges[i][0])]++;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (ccFind(i) != i) continue;\n        if (links[i] * 2 == nodes[i] * (nodes[i] - 1)) count++;\n    }\n    free(ccParent);\n    free(nodes);\n    free(links);\n    return count;\n}`,
        csharp: `public static int CountCompleteComponents(int n, int[][] edges)\n{\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    foreach (var e in edges)\n    {\n        int a = Find(e[0]), b = Find(e[1]);\n        if (a != b) parent[b] = a;\n    }\n    var nodes = new int[n];\n    var links = new int[n];\n    for (int i = 0; i < n; i++) nodes[Find(i)]++;\n    foreach (var e in edges) links[Find(e[0])]++;\n    int count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (Find(i) != i) continue;\n        if (links[i] * 2 == nodes[i] * (nodes[i] - 1)) count++;\n    }\n    return count;\n}`,
        go: `func countCompleteComponents(n int, edges [][]int) int {\n\tparent := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tfor _, e := range edges {\n\t\ta, b := find(e[0]), find(e[1])\n\t\tif a != b {\n\t\t\tparent[b] = a\n\t\t}\n\t}\n\tnodes := make([]int, n)\n\tlinks := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tnodes[find(i)]++\n\t}\n\tfor _, e := range edges {\n\t\tlinks[find(e[0])]++\n\t}\n\tcount := 0\n\tfor i := 0; i < n; i++ {\n\t\tif find(i) != i {\n\t\t\tcontinue\n\t\t}\n\t\tif links[i]*2 == nodes[i]*(nodes[i]-1) {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countCompleteComponents(n: Int, edges: Array<IntArray>): Int {\n    val parent = IntArray(n) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for (e in edges) {\n        val a = find(e[0])\n        val b = find(e[1])\n        if (a != b) parent[b] = a\n    }\n    val nodes = IntArray(n)\n    val links = IntArray(n)\n    for (i in 0 until n) nodes[find(i)]++\n    for (e in edges) links[find(e[0])]++\n    var count = 0\n    for (i in 0 until n) {\n        if (find(i) != i) continue\n        if (links[i] * 2 == nodes[i] * (nodes[i] - 1)) count++\n    }\n    return count\n}`,
        swift: `func countCompleteComponents(_ n: Int, _ edges: [[Int]]) -> Int {\n    var parent = Array(0..<n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for e in edges {\n        let a = find(e[0]), b = find(e[1])\n        if a != b { parent[b] = a }\n    }\n    var nodes = [Int](repeating: 0, count: n)\n    var links = [Int](repeating: 0, count: n)\n    for i in 0..<n { nodes[find(i)] += 1 }\n    for e in edges { links[find(e[0])] += 1 }\n    var count = 0\n    for i in 0..<n {\n        if find(i) != i { continue }\n        if links[i] * 2 == nodes[i] * (nodes[i] - 1) { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countCompleteComponents(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut parent: Vec<usize> = (0..n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    for e in edges.iter() {\n        let a = find(&mut parent, e[0] as usize);\n        let b = find(&mut parent, e[1] as usize);\n        if a != b {\n            parent[b] = a;\n        }\n    }\n    let mut nodes = vec![0i64; n];\n    let mut links = vec![0i64; n];\n    for i in 0..n {\n        let r = find(&mut parent, i);\n        nodes[r] += 1;\n    }\n    for e in edges.iter() {\n        let r = find(&mut parent, e[0] as usize);\n        links[r] += 1;\n    }\n    let mut count = 0i32;\n    for i in 0..n {\n        if find(&mut parent, i) != i {\n            continue;\n        }\n        if links[i] * 2 == nodes[i] * (nodes[i] - 1) {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countCompleteComponents($n, $edges) {\n    $parent = range(0, $n - 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    foreach ($edges as $e) {\n        $a = $find($e[0]);\n        $b = $find($e[1]);\n        if ($a !== $b) $parent[$b] = $a;\n    }\n    $nodes = array_fill(0, $n, 0);\n    $links = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $nodes[$find($i)]++;\n    foreach ($edges as $e) $links[$find($e[0])]++;\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($find($i) !== $i) continue;\n        if ($links[$i] * 2 === $nodes[$i] * ($nodes[$i] - 1)) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countCompleteComponents(n, edges)\n  parent = (0...n).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  edges.each do |u, v|\n    a = find.call(u)\n    b = find.call(v)\n    parent[b] = a if a != b\n  end\n  nodes = Array.new(n, 0)\n  links = Array.new(n, 0)\n  (0...n).each { |i| nodes[find.call(i)] += 1 }\n  edges.each { |u, _| links[find.call(u)] += 1 }\n  count = 0\n  (0...n).each do |i|\n    next if find.call(i) != i\n    count += 1 if links[i] * 2 == nodes[i] * (nodes[i] - 1)\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum Star Sum of a Graph (LC 2497) ───────────────────────
  (() => {
    const ref = (vals: number[], edges: number[][], k: number) => {
      const n = vals.length;
      const nb: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < edges.length; i++) {
        nb[edges[i][0]].push(vals[edges[i][1]]);
        nb[edges[i][1]].push(vals[edges[i][0]]);
      }
      let best = -2000000000;
      for (let i = 0; i < n; i++) {
        const pos = nb[i].filter((v) => v > 0).sort((a, b) => b - a);
        let sum = vals[i];
        const take = k < pos.length ? k : pos.length;
        for (let t = 0; t < take; t++) sum += pos[t];
        if (sum > best) best = sum;
      }
      return best;
    };
    return {
      slug: "maximum-star-sum-of-a-graph",
      title: "Maximum Star Sum of a Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Greedy", "Sorting", "Heap (Priority Queue)", "Amazon", "Google", "Ola"],
      signature: { funcName: "maxStarSum", params: [{ name: "vals", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An undirected graph has `n` nodes, and `vals[i]` is the value of node `i`.\n\nA **star graph** is a subgraph made of a centre node and zero or more of its direct neighbours; its star sum is the total of the values in it. Return the maximum star sum over all star graphs containing **at most `k`** edges.",
        [
          { in: "vals = [1,2,3,4,10,-10,-20], edges = [[0,1],[1,2],[1,3],[3,4],[3,5],[3,6]], k = 2", out: "16", note: "Centre node 3 with neighbours 4 and 1: `4 + 10 + 2`." },
          { in: "vals = [-5], edges = [], k = 0", out: "-5", note: "A lone centre is a valid star." },
          { in: "vals = [3,-1,-2], edges = [[0,1],[0,2]], k = 2", out: "3", note: "Both neighbours are negative, so take neither." },
        ],
        ["n == vals.length", "1 <= n <= 10^5", "-10^4 <= vals[i] <= 10^4", "0 <= edges.length <= min(n * (n - 1) / 2, 10^5)", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] <= n - 1", "edges[i][0] != edges[i][1]", "0 <= k <= n - 1"]),
      hints: [
        "Try every node as the centre.",
        "For a fixed centre, which neighbours would you add?",
        "Only the positive ones, largest first, and at most `k` of them.",
      ],
      editorial: explain({
        idea: "The centres are independent, so evaluate each one. For a given centre the choice is greedy: adding a neighbour changes the sum by exactly that neighbour's value, so take the largest positive ones up to the budget.",
        steps: [
          "Collect, for every node, the values of its neighbours.",
          "For each centre, keep only the positive neighbour values and sort them descending.",
          "Add the first `min(k, count)` of them to the centre's own value.",
          "Return the largest total.",
        ],
        why: "Each edge's contribution is independent of the others, so no interaction can make a negative neighbour worth taking — the greedy choice is exactly optimal. Note the centre's own value is always included even when negative: a star must have a centre, which is why an all-negative graph answers with its largest single value rather than zero.",
        time: "O(n + m + Σ deg · log deg)",
        space: "O(n + m)",
        pitfalls: [
          "The centre's value is mandatory; only the neighbours are optional.",
          "Taking a negative neighbour to fill the budget lowers the sum — `k` is a cap, not a quota.",
          "`k` may be 0, which leaves only the isolated centres.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,10,-10,-20]\n[[0,1],[1,2],[1,3],[3,4],[3,5],[3,6]]\n2", expectedOutput: "16" },
        { input: "[-5]\n[]\n0", expectedOutput: "-5" },
        { input: "[3,-1,-2]\n[[0,1],[0,2]]\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const vals = Array.from({ length: n }, () => ri(rng, -20, 20));
        const seen = new Set<number>();
        const edges: number[][] = [];
        const count = ri(rng, 0, Math.min(14, (n * (n - 1)) / 2));
        for (let t = 0; t < count; t++) {
          const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          if (a === b) continue;
          const key = Math.min(a, b) * n + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push([a, b]);
        }
        const k = ri(rng, 0, Math.max(0, n - 1));
        return { input: `${fmtIntArr(vals)}\n${fmtIntMat(edges)}\n${k}`, expectedOutput: String(ref(vals, edges, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxStarSum(vals: List[int], edges: List[List[int]], k: int) -> int:\n    n = len(vals)\n    nb = [[] for _ in range(n)]\n    for u, v in edges:\n        nb[u].append(vals[v])\n        nb[v].append(vals[u])\n    best = None\n    for i in range(n):\n        pos = sorted((v for v in nb[i] if v > 0), reverse=True)\n        total = vals[i] + sum(pos[:k])\n        if best is None or total > best:\n            best = total\n    return best`,
        javascript: `var maxStarSum = function(vals, edges, k) {\n    var n = vals.length, i;\n    var nb = [];\n    for (i = 0; i < n; i++) nb.push([]);\n    for (i = 0; i < edges.length; i++) {\n        nb[edges[i][0]].push(vals[edges[i][1]]);\n        nb[edges[i][1]].push(vals[edges[i][0]]);\n    }\n    var best = -2000000000;\n    for (i = 0; i < n; i++) {\n        var pos = nb[i].filter(function(v) { return v > 0; });\n        pos.sort(function(a, b) { return b - a; });\n        var sum = vals[i];\n        var take = k < pos.length ? k : pos.length;\n        for (var t = 0; t < take; t++) sum += pos[t];\n        if (sum > best) best = sum;\n    }\n    return best;\n};`,
        typescript: `function maxStarSum(vals: number[], edges: number[][], k: number): number {\n    var n = vals.length, i: number;\n    var nb: number[][] = [];\n    for (i = 0; i < n; i++) nb.push([]);\n    for (i = 0; i < edges.length; i++) {\n        nb[edges[i][0]].push(vals[edges[i][1]]);\n        nb[edges[i][1]].push(vals[edges[i][0]]);\n    }\n    var best = -2000000000;\n    for (i = 0; i < n; i++) {\n        var pos = nb[i].filter(function(v: number) { return v > 0; });\n        pos.sort(function(a: number, b: number) { return b - a; });\n        var sum = vals[i];\n        var take = k < pos.length ? k : pos.length;\n        for (var t = 0; t < take; t++) sum += pos[t];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        java: `public static int maxStarSum(int[] vals, int[][] edges, int k) {\n    int n = vals.length;\n    List<List<Integer>> nb = new ArrayList<>();\n    for (int i = 0; i < n; i++) nb.add(new ArrayList<>());\n    for (int[] e : edges) {\n        nb.get(e[0]).add(vals[e[1]]);\n        nb.get(e[1]).add(vals[e[0]]);\n    }\n    int best = Integer.MIN_VALUE;\n    for (int i = 0; i < n; i++) {\n        List<Integer> pos = new ArrayList<>();\n        for (int v : nb.get(i)) if (v > 0) pos.add(v);\n        pos.sort(Comparator.reverseOrder());\n        int sum = vals[i];\n        int take = Math.min(k, pos.size());\n        for (int t = 0; t < take; t++) sum += pos.get(t);\n        best = Math.max(best, sum);\n    }\n    return best;\n}`,
        cpp: `int maxStarSum(vector<int>& vals, vector<vector<int>>& edges, int k) {\n    int n = (int) vals.size();\n    vector<vector<int>> nb(n);\n    for (auto& e : edges) {\n        nb[e[0]].push_back(vals[e[1]]);\n        nb[e[1]].push_back(vals[e[0]]);\n    }\n    int best = INT_MIN;\n    for (int i = 0; i < n; i++) {\n        vector<int> pos;\n        for (int v : nb[i]) if (v > 0) pos.push_back(v);\n        sort(pos.begin(), pos.end(), greater<int>());\n        int sum = vals[i];\n        int take = min((int) pos.size(), k);\n        for (int t = 0; t < take; t++) sum += pos[t];\n        best = max(best, sum);\n    }\n    return best;\n}`,
        c: `static int msDesc(const void* a, const void* b) {\n    return (*(const int*) b) - (*(const int*) a);\n}\n\nint maxStarSum(int* vals, int valsSize, int** edges, int edgesSize, int* edgesColSize, int k) {\n    (void) edgesColSize;\n    int n = valsSize;\n    int* deg = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < edgesSize; i++) {\n        deg[edges[i][0]]++;\n        deg[edges[i][1]]++;\n    }\n    int* start = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    start[0] = 0;\n    for (int i = 0; i < n; i++) start[i + 1] = start[i] + deg[i];\n    int* fill = (int*) calloc((size_t) n, sizeof(int));\n    int* flat = (int*) malloc((size_t) (2 * edgesSize > 0 ? 2 * edgesSize : 1) * sizeof(int));\n    for (int i = 0; i < edgesSize; i++) {\n        int u = edges[i][0], v = edges[i][1];\n        flat[start[u] + fill[u]++] = vals[v];\n        flat[start[v] + fill[v]++] = vals[u];\n    }\n    int best = -2000000000;\n    int* pos = (int*) malloc((size_t) (2 * edgesSize > 0 ? 2 * edgesSize : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int cnt = 0;\n        for (int t = start[i]; t < start[i + 1]; t++) if (flat[t] > 0) pos[cnt++] = flat[t];\n        qsort(pos, (size_t) cnt, sizeof(int), msDesc);\n        int sum = vals[i];\n        int take = k < cnt ? k : cnt;\n        for (int t = 0; t < take; t++) sum += pos[t];\n        if (sum > best) best = sum;\n    }\n    free(deg);\n    free(start);\n    free(fill);\n    free(flat);\n    free(pos);\n    return best;\n}`,
        csharp: `public static int MaxStarSum(int[] vals, int[][] edges, int k)\n{\n    int n = vals.Length;\n    var nb = new List<int>[n];\n    for (int i = 0; i < n; i++) nb[i] = new List<int>();\n    foreach (var e in edges)\n    {\n        nb[e[0]].Add(vals[e[1]]);\n        nb[e[1]].Add(vals[e[0]]);\n    }\n    int best = int.MinValue;\n    for (int i = 0; i < n; i++)\n    {\n        var pos = new List<int>();\n        foreach (var v in nb[i]) if (v > 0) pos.Add(v);\n        pos.Sort((a, b) => b - a);\n        int sum = vals[i];\n        int take = Math.Min(k, pos.Count);\n        for (int t = 0; t < take; t++) sum += pos[t];\n        best = Math.Max(best, sum);\n    }\n    return best;\n}`,
        go: `func maxStarSum(vals []int, edges [][]int, k int) int {\n\tn := len(vals)\n\tnb := make([][]int, n)\n\tfor _, e := range edges {\n\t\tnb[e[0]] = append(nb[e[0]], vals[e[1]])\n\t\tnb[e[1]] = append(nb[e[1]], vals[e[0]])\n\t}\n\tbest := -2000000000\n\tfor i := 0; i < n; i++ {\n\t\tpos := []int{}\n\t\tfor _, v := range nb[i] {\n\t\t\tif v > 0 {\n\t\t\t\tpos = append(pos, v)\n\t\t\t}\n\t\t}\n\t\tsort.Sort(sort.Reverse(sort.IntSlice(pos)))\n\t\tsum := vals[i]\n\t\ttake := k\n\t\tif len(pos) < take {\n\t\t\ttake = len(pos)\n\t\t}\n\t\tfor t := 0; t < take; t++ {\n\t\t\tsum += pos[t]\n\t\t}\n\t\tif sum > best {\n\t\t\tbest = sum\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxStarSum(vals: IntArray, edges: Array<IntArray>, k: Int): Int {\n    val n = vals.size\n    val nb = Array(n) { ArrayList<Int>() }\n    for (e in edges) {\n        nb[e[0]].add(vals[e[1]])\n        nb[e[1]].add(vals[e[0]])\n    }\n    var best = Int.MIN_VALUE\n    for (i in 0 until n) {\n        val pos = nb[i].filter { it > 0 }.sortedDescending()\n        var sum = vals[i]\n        val take = minOf(k, pos.size)\n        for (t in 0 until take) sum += pos[t]\n        if (sum > best) best = sum\n    }\n    return best\n}`,
        swift: `func maxStarSum(_ vals: [Int], _ edges: [[Int]], _ k: Int) -> Int {\n    let n = vals.count\n    var nb = [[Int]](repeating: [], count: n)\n    for e in edges {\n        nb[e[0]].append(vals[e[1]])\n        nb[e[1]].append(vals[e[0]])\n    }\n    var best = Int.min\n    for i in 0..<n {\n        let pos = nb[i].filter { $0 > 0 }.sorted(by: >)\n        var sum = vals[i]\n        let take = min(k, pos.count)\n        for t in 0..<take { sum += pos[t] }\n        best = max(best, sum)\n    }\n    return best\n}`,
        rust: `fn maxStarSum(vals: Vec<i32>, edges: Vec<Vec<i32>>, k: i32) -> i32 {\n    let n = vals.len();\n    let mut nb: Vec<Vec<i32>> = vec![Vec::new(); n];\n    for e in edges.iter() {\n        nb[e[0] as usize].push(vals[e[1] as usize]);\n        nb[e[1] as usize].push(vals[e[0] as usize]);\n    }\n    let mut best = std::i32::MIN;\n    for i in 0..n {\n        let mut pos: Vec<i32> = nb[i].iter().cloned().filter(|&v| v > 0).collect();\n        pos.sort_unstable_by(|a, b| b.cmp(a));\n        let mut sum = vals[i];\n        let take = std::cmp::min(k as usize, pos.len());\n        for t in 0..take {\n            sum += pos[t];\n        }\n        if sum > best {\n            best = sum;\n        }\n    }\n    best\n}`,
        php: `function maxStarSum($vals, $edges, $k) {\n    $n = count($vals);\n    $nb = [];\n    for ($i = 0; $i < $n; $i++) $nb[$i] = [];\n    foreach ($edges as $e) {\n        $nb[$e[0]][] = $vals[$e[1]];\n        $nb[$e[1]][] = $vals[$e[0]];\n    }\n    $best = -2000000000;\n    for ($i = 0; $i < $n; $i++) {\n        $pos = array_values(array_filter($nb[$i], function($v) { return $v > 0; }));\n        rsort($pos);\n        $sum = $vals[$i];\n        $take = min($k, count($pos));\n        for ($t = 0; $t < $take; $t++) $sum += $pos[$t];\n        if ($sum > $best) $best = $sum;\n    }\n    return $best;\n}`,
        ruby: `def maxStarSum(vals, edges, k)\n  n = vals.length\n  nb = Array.new(n) { [] }\n  edges.each do |u, v|\n    nb[u] << vals[v]\n    nb[v] << vals[u]\n  end\n  best = nil\n  (0...n).each do |i|\n    pos = nb[i].select { |v| v > 0 }.sort.reverse\n    sum = vals[i] + pos.first(k).sum\n    best = sum if best.nil? || sum > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Fuel Cost to Report to the Capital (LC 2477) ────────
  (() => {
    const ref = (roads: number[][], seats: number) => {
      const n = roads.length + 1;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < roads.length; i++) {
        adj[roads[i][0]].push(roads[i][1]);
        adj[roads[i][1]].push(roads[i][0]);
      }
      const parent = new Array(n).fill(-1);
      const order: number[] = [];
      const seen = new Array(n).fill(false);
      const stack = [0];
      seen[0] = true;
      while (stack.length > 0) {
        const u = stack.pop() as number;
        order.push(u);
        for (let i = 0; i < adj[u].length; i++) {
          const v = adj[u][i];
          if (seen[v]) continue;
          seen[v] = true;
          parent[v] = u;
          stack.push(v);
        }
      }
      const cnt = new Array(n).fill(1);
      let fuel = 0;
      for (let i = order.length - 1; i >= 1; i--) {
        const u = order[i];
        cnt[parent[u]] += cnt[u];
        fuel += Math.floor((cnt[u] + seats - 1) / seats);
      }
      return fuel;
    };
    return {
      slug: "minimum-fuel-cost-to-report-to-the-capital",
      title: "Minimum Fuel Cost to Report to the Capital",
      difficulty: "MEDIUM" as const,
      tags: ["Tree", "Graph", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Uber"],
      signature: { funcName: "minimumFuelCost", params: [{ name: "roads", type: "int[][]" as const }, { name: "seats", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A country has `n` cities numbered `0 … n - 1` joined by `n - 1` bidirectional roads, forming a tree. City `0` is the capital, and every other city has one representative who must reach it.\n\nEach representative starts with a car that seats `seats` people. A car burns **one litre of fuel per road it drives**, and representatives who meet in a city may share a car — as long as no car carries more than `seats` people. Return the minimum litres needed for everyone to reach the capital.",
        [
          { in: "roads = [[0,1],[0,2],[0,3]], seats = 5", out: "3", note: "Three representatives each drive one road." },
          { in: "roads = [[3,1],[3,2],[1,0],[0,4],[0,5],[4,6]], seats = 2", out: "7" },
          { in: "roads = [], seats = 1", out: "0", note: "Only the capital exists." },
        ],
        ["1 <= n <= 1000", "roads.length == n - 1", "roads[i].length == 2", "0 <= roads[i][0], roads[i][1] < n", "roads represents a valid tree", "1 <= seats <= 100"]),
      hints: [
        "Every representative in a subtree must cross the single road joining that subtree to its parent.",
        "So the cost of that road is decided only by how many people are behind it.",
        "Carrying `p` people over one road needs `ceil(p / seats)` cars, hence that many litres.",
      ],
      editorial: explain({
        idea: "Root the tree at the capital. The edge above a node is crossed by exactly the people in its subtree, and ferrying `p` people across one road costs `ceil(p / seats)` litres. Sum that over every edge.",
        steps: [
          "Build the tree and record a traversal order with each node's parent.",
          "Walk the order backwards so children are finished before their parent, accumulating subtree sizes.",
          "For each non-root node add `ceil(size / seats)` to the answer.",
        ],
        why: "The edges decouple completely because the graph is a tree: there is exactly one road out of each subtree, so its traffic is fixed at the subtree's population no matter how the cars are arranged. Once traffic is fixed, filling cars to capacity is optimal on every edge independently, which is why a greedy sum over edges is exact and no search is needed.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The root has no edge above it and contributes nothing.",
          "Use `(size + seats - 1) / seats` rather than floating-point division.",
          "An iterative traversal avoids a deep recursion on a path-shaped tree.",
        ],
      }),
      examples: [
        { input: "[[0,1],[0,2],[0,3]]\n5", expectedOutput: "3" },
        { input: "[[3,1],[3,2],[1,0],[0,4],[0,5],[4,6]]\n2", expectedOutput: "7" },
        { input: "[]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const roads: number[][] = [];
        for (let v = 1; v < n; v++) {
          const p = ri(rng, 0, v - 1);
          roads.push(rng() < 0.5 ? [p, v] : [v, p]);
        }
        const seats = ri(rng, 1, 5);
        return { input: `${fmtIntMat(roads)}\n${seats}`, expectedOutput: String(ref(roads, seats)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumFuelCost(roads: List[List[int]], seats: int) -> int:\n    n = len(roads) + 1\n    adj = [[] for _ in range(n)]\n    for u, v in roads:\n        adj[u].append(v)\n        adj[v].append(u)\n    parent = [-1] * n\n    order = []\n    seen = [False] * n\n    seen[0] = True\n    stack = [0]\n    while stack:\n        u = stack.pop()\n        order.append(u)\n        for v in adj[u]:\n            if seen[v]:\n                continue\n            seen[v] = True\n            parent[v] = u\n            stack.append(v)\n    cnt = [1] * n\n    fuel = 0\n    for i in range(len(order) - 1, 0, -1):\n        u = order[i]\n        cnt[parent[u]] += cnt[u]\n        fuel += (cnt[u] + seats - 1) // seats\n    return fuel`,
        javascript: `var minimumFuelCost = function(roads, seats) {\n    var n = roads.length + 1, i;\n    var adj = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < roads.length; i++) {\n        adj[roads[i][0]].push(roads[i][1]);\n        adj[roads[i][1]].push(roads[i][0]);\n    }\n    var parent = [], seen = [];\n    for (i = 0; i < n; i++) { parent.push(-1); seen.push(false); }\n    var order = [];\n    var stack = [0];\n    seen[0] = true;\n    while (stack.length > 0) {\n        var u = stack.pop();\n        order.push(u);\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    var cnt = [];\n    for (i = 0; i < n; i++) cnt.push(1);\n    var fuel = 0;\n    for (i = order.length - 1; i >= 1; i--) {\n        var w = order[i];\n        cnt[parent[w]] += cnt[w];\n        fuel += Math.floor((cnt[w] + seats - 1) / seats);\n    }\n    return fuel;\n};`,
        typescript: `function minimumFuelCost(roads: number[][], seats: number): number {\n    var n = roads.length + 1, i: number;\n    var adj: number[][] = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < roads.length; i++) {\n        adj[roads[i][0]].push(roads[i][1]);\n        adj[roads[i][1]].push(roads[i][0]);\n    }\n    var parent: number[] = [], seen: boolean[] = [];\n    for (i = 0; i < n; i++) { parent.push(-1); seen.push(false); }\n    var order: number[] = [];\n    var stack: number[] = [0];\n    seen[0] = true;\n    while (stack.length > 0) {\n        var u = stack.pop() as number;\n        order.push(u);\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    var cnt: number[] = [];\n    for (i = 0; i < n; i++) cnt.push(1);\n    var fuel = 0;\n    for (i = order.length - 1; i >= 1; i--) {\n        var w = order[i];\n        cnt[parent[w]] += cnt[w];\n        fuel += Math.floor((cnt[w] + seats - 1) / seats);\n    }\n    return fuel;\n}`,
        java: `public static int minimumFuelCost(int[][] roads, int seats) {\n    int n = roads.length + 1;\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    for (int[] r : roads) {\n        adj.get(r[0]).add(r[1]);\n        adj.get(r[1]).add(r[0]);\n    }\n    int[] parent = new int[n];\n    Arrays.fill(parent, -1);\n    boolean[] seen = new boolean[n];\n    int[] order = new int[n];\n    int cntOrder = 0;\n    int[] stack = new int[n];\n    int top = 0;\n    stack[top++] = 0;\n    seen[0] = true;\n    while (top > 0) {\n        int u = stack[--top];\n        order[cntOrder++] = u;\n        for (int v : adj.get(u)) {\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    int[] cnt = new int[n];\n    Arrays.fill(cnt, 1);\n    int fuel = 0;\n    for (int i = cntOrder - 1; i >= 1; i--) {\n        int u = order[i];\n        cnt[parent[u]] += cnt[u];\n        fuel += (cnt[u] + seats - 1) / seats;\n    }\n    return fuel;\n}`,
        cpp: `int minimumFuelCost(vector<vector<int>>& roads, int seats) {\n    int n = (int) roads.size() + 1;\n    vector<vector<int>> adj(n);\n    for (auto& r : roads) {\n        adj[r[0]].push_back(r[1]);\n        adj[r[1]].push_back(r[0]);\n    }\n    vector<int> parent(n, -1), order;\n    vector<char> seen(n, 0);\n    vector<int> stack = { 0 };\n    seen[0] = 1;\n    while (!stack.empty()) {\n        int u = stack.back();\n        stack.pop_back();\n        order.push_back(u);\n        for (int v : adj[u]) {\n            if (seen[v]) continue;\n            seen[v] = 1;\n            parent[v] = u;\n            stack.push_back(v);\n        }\n    }\n    vector<int> cnt(n, 1);\n    int fuel = 0;\n    for (int i = (int) order.size() - 1; i >= 1; i--) {\n        int u = order[i];\n        cnt[parent[u]] += cnt[u];\n        fuel += (cnt[u] + seats - 1) / seats;\n    }\n    return fuel;\n}`,
        c: `int minimumFuelCost(int** roads, int roadsSize, int* roadsColSize, int seats) {\n    (void) roadsColSize;\n    int n = roadsSize + 1;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = roadsSize * 2 > 0 ? roadsSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < roadsSize; i++) {\n        int u = roads[i][0], v = roads[i][1];\n        to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec++;\n        to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec++;\n    }\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    char* seen = (char*) calloc((size_t) n, 1);\n    int* order = (int*) malloc((size_t) n * sizeof(int));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = -1;\n    int top = 0, cnt2 = 0;\n    stack[top++] = 0;\n    seen[0] = 1;\n    while (top > 0) {\n        int u = stack[--top];\n        order[cnt2++] = u;\n        for (int e = head[u]; e >= 0; e = nxt[e]) {\n            int v = to[e];\n            if (seen[v]) continue;\n            seen[v] = 1;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    int* cnt = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) cnt[i] = 1;\n    int fuel = 0;\n    for (int i = cnt2 - 1; i >= 1; i--) {\n        int u = order[i];\n        cnt[parent[u]] += cnt[u];\n        fuel += (cnt[u] + seats - 1) / seats;\n    }\n    free(head); free(nxt); free(to); free(parent);\n    free(seen); free(order); free(stack); free(cnt);\n    return fuel;\n}`,
        csharp: `public static int MinimumFuelCost(int[][] roads, int seats)\n{\n    int n = roads.Length + 1;\n    var adj = new List<int>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int>();\n    foreach (var r in roads)\n    {\n        adj[r[0]].Add(r[1]);\n        adj[r[1]].Add(r[0]);\n    }\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = -1;\n    var seen = new bool[n];\n    var order = new int[n];\n    int cntOrder = 0;\n    var stack = new int[n];\n    int top = 0;\n    stack[top++] = 0;\n    seen[0] = true;\n    while (top > 0)\n    {\n        int u = stack[--top];\n        order[cntOrder++] = u;\n        foreach (var v in adj[u])\n        {\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    var cnt = new int[n];\n    for (int i = 0; i < n; i++) cnt[i] = 1;\n    int fuel = 0;\n    for (int i = cntOrder - 1; i >= 1; i--)\n    {\n        int u = order[i];\n        cnt[parent[u]] += cnt[u];\n        fuel += (cnt[u] + seats - 1) / seats;\n    }\n    return fuel;\n}`,
        go: `func minimumFuelCost(roads [][]int, seats int) int {\n\tn := len(roads) + 1\n\tadj := make([][]int, n)\n\tfor _, r := range roads {\n\t\tadj[r[0]] = append(adj[r[0]], r[1])\n\t\tadj[r[1]] = append(adj[r[1]], r[0])\n\t}\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = -1\n\t}\n\tseen := make([]bool, n)\n\torder := make([]int, 0, n)\n\tstack := []int{0}\n\tseen[0] = true\n\tfor len(stack) > 0 {\n\t\tu := stack[len(stack)-1]\n\t\tstack = stack[:len(stack)-1]\n\t\torder = append(order, u)\n\t\tfor _, v := range adj[u] {\n\t\t\tif seen[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[v] = true\n\t\t\tparent[v] = u\n\t\t\tstack = append(stack, v)\n\t\t}\n\t}\n\tcnt := make([]int, n)\n\tfor i := range cnt {\n\t\tcnt[i] = 1\n\t}\n\tfuel := 0\n\tfor i := len(order) - 1; i >= 1; i-- {\n\t\tu := order[i]\n\t\tcnt[parent[u]] += cnt[u]\n\t\tfuel += (cnt[u] + seats - 1) / seats\n\t}\n\treturn fuel\n}`,
        kotlin: `fun minimumFuelCost(roads: Array<IntArray>, seats: Int): Int {\n    val n = roads.size + 1\n    val adj = Array(n) { ArrayList<Int>() }\n    for (r in roads) {\n        adj[r[0]].add(r[1])\n        adj[r[1]].add(r[0])\n    }\n    val parent = IntArray(n) { -1 }\n    val seen = BooleanArray(n)\n    val order = IntArray(n)\n    var cntOrder = 0\n    val stack = IntArray(n)\n    var top = 0\n    stack[top++] = 0\n    seen[0] = true\n    while (top > 0) {\n        val u = stack[--top]\n        order[cntOrder++] = u\n        for (v in adj[u]) {\n            if (seen[v]) continue\n            seen[v] = true\n            parent[v] = u\n            stack[top++] = v\n        }\n    }\n    val cnt = IntArray(n) { 1 }\n    var fuel = 0\n    for (i in cntOrder - 1 downTo 1) {\n        val u = order[i]\n        cnt[parent[u]] += cnt[u]\n        fuel += (cnt[u] + seats - 1) / seats\n    }\n    return fuel\n}`,
        swift: `func minimumFuelCost(_ roads: [[Int]], _ seats: Int) -> Int {\n    let n = roads.count + 1\n    var adj = [[Int]](repeating: [], count: n)\n    for r in roads {\n        adj[r[0]].append(r[1])\n        adj[r[1]].append(r[0])\n    }\n    var parent = [Int](repeating: -1, count: n)\n    var seen = [Bool](repeating: false, count: n)\n    var order = [Int]()\n    var stack = [0]\n    seen[0] = true\n    while let u = stack.popLast() {\n        order.append(u)\n        for v in adj[u] {\n            if seen[v] { continue }\n            seen[v] = true\n            parent[v] = u\n            stack.append(v)\n        }\n    }\n    var cnt = [Int](repeating: 1, count: n)\n    var fuel = 0\n    var i = order.count - 1\n    while i >= 1 {\n        let u = order[i]\n        cnt[parent[u]] += cnt[u]\n        fuel += (cnt[u] + seats - 1) / seats\n        i -= 1\n    }\n    return fuel\n}`,
        rust: `fn minimumFuelCost(roads: Vec<Vec<i32>>, seats: i32) -> i32 {\n    let n = roads.len() + 1;\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    for r in roads.iter() {\n        adj[r[0] as usize].push(r[1] as usize);\n        adj[r[1] as usize].push(r[0] as usize);\n    }\n    let mut parent = vec![std::usize::MAX; n];\n    let mut seen = vec![false; n];\n    let mut order: Vec<usize> = Vec::new();\n    let mut stack = vec![0usize];\n    seen[0] = true;\n    while let Some(u) = stack.pop() {\n        order.push(u);\n        for &v in adj[u].iter() {\n            if seen[v] {\n                continue;\n            }\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    let mut cnt = vec![1i32; n];\n    let mut fuel = 0i32;\n    for i in (1..order.len()).rev() {\n        let u = order[i];\n        cnt[parent[u]] += cnt[u];\n        fuel += (cnt[u] + seats - 1) / seats;\n    }\n    fuel\n}`,
        php: `function minimumFuelCost($roads, $seats) {\n    $n = count($roads) + 1;\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    foreach ($roads as $r) {\n        $adj[$r[0]][] = $r[1];\n        $adj[$r[1]][] = $r[0];\n    }\n    $parent = array_fill(0, $n, -1);\n    $seen = array_fill(0, $n, false);\n    $order = [];\n    $stack = [0];\n    $seen[0] = true;\n    while (count($stack) > 0) {\n        $u = array_pop($stack);\n        $order[] = $u;\n        foreach ($adj[$u] as $v) {\n            if ($seen[$v]) continue;\n            $seen[$v] = true;\n            $parent[$v] = $u;\n            $stack[] = $v;\n        }\n    }\n    $cnt = array_fill(0, $n, 1);\n    $fuel = 0;\n    for ($i = count($order) - 1; $i >= 1; $i--) {\n        $u = $order[$i];\n        $cnt[$parent[$u]] += $cnt[$u];\n        $fuel += intdiv($cnt[$u] + $seats - 1, $seats);\n    }\n    return $fuel;\n}`,
        ruby: `def minimumFuelCost(roads, seats)\n  n = roads.length + 1\n  adj = Array.new(n) { [] }\n  roads.each do |u, v|\n    adj[u] << v\n    adj[v] << u\n  end\n  parent = Array.new(n, -1)\n  seen = Array.new(n, false)\n  order = []\n  stack = [0]\n  seen[0] = true\n  until stack.empty?\n    u = stack.pop\n    order << u\n    adj[u].each do |v|\n      next if seen[v]\n      seen[v] = true\n      parent[v] = u\n      stack << v\n    end\n  end\n  cnt = Array.new(n, 1)\n  fuel = 0\n  (order.length - 1).downto(1) do |i|\n    u = order[i]\n    cnt[parent[u]] += cnt[u]\n    fuel += (cnt[u] + seats - 1) / seats\n  end\n  fuel\nend`,
      },
    };
  })(),

  // ── Number of Nodes in the Sub-Tree With the Same Label (LC 1519) ──
  (() => {
    const ref = (n: number, edges: number[][], labels: string) => {
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < edges.length; i++) {
        adj[edges[i][0]].push(edges[i][1]);
        adj[edges[i][1]].push(edges[i][0]);
      }
      const parent = new Array(n).fill(-1);
      const order: number[] = [];
      const seen = new Array(n).fill(false);
      const stack = [0];
      seen[0] = true;
      while (stack.length > 0) {
        const u = stack.pop() as number;
        order.push(u);
        for (let i = 0; i < adj[u].length; i++) {
          const v = adj[u][i];
          if (seen[v]) continue;
          seen[v] = true;
          parent[v] = u;
          stack.push(v);
        }
      }
      const cnt = Array.from({ length: n }, () => new Array(26).fill(0));
      for (let i = 0; i < n; i++) cnt[i][labels.charCodeAt(i) - 97] = 1;
      const out = new Array(n).fill(0);
      for (let i = order.length - 1; i >= 0; i--) {
        const u = order[i];
        out[u] = cnt[u][labels.charCodeAt(u) - 97];
        if (parent[u] >= 0) {
          for (let c = 0; c < 26; c++) cnt[parent[u]][c] += cnt[u][c];
        }
      }
      return out;
    };
    return {
      slug: "number-of-nodes-in-the-sub-tree-with-the-same-label",
      title: "Number of Nodes in the Sub-Tree With the Same Label",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Tree", "Graph", "Depth-First Search", "Breadth-First Search", "Counting", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "countSubTrees", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "labels", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "A tree of `n` nodes is rooted at node `0`, given by `n - 1` undirected edges. `labels[i]` is the lowercase letter on node `i`.\n\nReturn an array where entry `i` is the number of nodes in the subtree of node `i` that carry the **same label as node `i`** — including node `i` itself.",
        [
          { in: 'n = 7, edges = [[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]], labels = "abaedcd"', out: "[2,1,1,1,1,1,1]", note: "Node 0 is labelled `a`, and its subtree holds one more `a` (node 2)." },
          { in: 'n = 4, edges = [[0,1],[1,2],[0,3]], labels = "bbbb"', out: "[4,2,1,1]" },
          { in: 'n = 5, edges = [[0,1],[0,2],[1,3],[0,4]], labels = "aabab"', out: "[3,2,1,1,1]" },
        ],
        ["1 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] < n", "labels.length == n", "labels is made of lowercase English letters."]),
      hints: [
        "A node's answer depends only on the letter counts of its subtree.",
        "There are only 26 letters, so carry a 26-slot tally up the tree.",
        "Merge each child's tally into its parent's after the child is finished.",
      ],
      editorial: explain({
        idea: "Give each node a 26-entry letter tally of its subtree. Process nodes children-first, folding each child's tally into its parent; the answer for a node is its own letter's entry once the fold is complete.",
        steps: [
          "Root the tree at 0 and record a traversal order with parents.",
          "Seed every node's tally with 1 in its own letter.",
          "Walk the order backwards: read the node's answer, then add its tally into its parent's.",
          "Reading before merging is what keeps a node's tally to its own subtree.",
        ],
        why: "The alphabet's fixed size is what makes this linear: a tally is 26 numbers regardless of subtree size, so merging a child costs O(26) rather than O(subtree). Processing in reverse traversal order guarantees a node is read only after every descendant has been folded in, and before it is folded into its own parent.",
        time: "O(26 · n)",
        space: "O(26 · n)",
        pitfalls: [
          "Merging a node into its parent *before* reading its answer mixes in siblings.",
          "The tree is given as undirected edges; the root must be fixed at node 0.",
          "Recursion can reach depth `n`; an explicit stack is safer at 100 000 nodes.",
        ],
      }),
      examples: [
        { input: '7\n[[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]]\n"abaedcd"', expectedOutput: "[2,1,1,1,1,1,1]" },
        { input: '4\n[[0,1],[1,2],[0,3]]\n"bbbb"', expectedOutput: "[4,2,1,1]" },
        { input: '5\n[[0,1],[0,2],[1,3],[0,4]]\n"aabab"', expectedOutput: "[3,2,1,1,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const edges: number[][] = [];
        for (let v = 1; v < n; v++) edges.push([ri(rng, 0, v - 1), v]);
        const alphabet = ri(rng, 1, 4);
        let labels = "";
        for (let i = 0; i < n; i++) labels += String.fromCharCode(97 + ri(rng, 0, alphabet - 1));
        return {
          input: `${n}\n${fmtIntMat(edges)}\n"${labels}"`,
          expectedOutput: fmtIntArr(ref(n, edges, labels)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef countSubTrees(n: int, edges: List[List[int]], labels: str) -> List[int]:\n    adj = [[] for _ in range(n)]\n    for u, v in edges:\n        adj[u].append(v)\n        adj[v].append(u)\n    parent = [-1] * n\n    order = []\n    seen = [False] * n\n    seen[0] = True\n    stack = [0]\n    while stack:\n        u = stack.pop()\n        order.append(u)\n        for v in adj[u]:\n            if seen[v]:\n                continue\n            seen[v] = True\n            parent[v] = u\n            stack.append(v)\n    cnt = [[0] * 26 for _ in range(n)]\n    for i in range(n):\n        cnt[i][ord(labels[i]) - 97] = 1\n    out = [0] * n\n    for i in range(len(order) - 1, -1, -1):\n        u = order[i]\n        out[u] = cnt[u][ord(labels[u]) - 97]\n        p = parent[u]\n        if p >= 0:\n            for c in range(26):\n                cnt[p][c] += cnt[u][c]\n    return out`,
        javascript: `var countSubTrees = function(n, edges, labels) {\n    var i, c;\n    var adj = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push(edges[i][1]);\n        adj[edges[i][1]].push(edges[i][0]);\n    }\n    var parent = [], seen = [];\n    for (i = 0; i < n; i++) { parent.push(-1); seen.push(false); }\n    var order = [];\n    var stack = [0];\n    seen[0] = true;\n    while (stack.length > 0) {\n        var u = stack.pop();\n        order.push(u);\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    var cnt = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (c = 0; c < 26; c++) row.push(0);\n        row[labels.charCodeAt(i) - 97] = 1;\n        cnt.push(row);\n    }\n    var out = [];\n    for (i = 0; i < n; i++) out.push(0);\n    for (i = order.length - 1; i >= 0; i--) {\n        var w = order[i];\n        out[w] = cnt[w][labels.charCodeAt(w) - 97];\n        var p = parent[w];\n        if (p >= 0) {\n            for (c = 0; c < 26; c++) cnt[p][c] += cnt[w][c];\n        }\n    }\n    return out;\n};`,
        typescript: `function countSubTrees(n: number, edges: number[][], labels: string): number[] {\n    var i: number, c: number;\n    var adj: number[][] = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push(edges[i][1]);\n        adj[edges[i][1]].push(edges[i][0]);\n    }\n    var parent: number[] = [], seen: boolean[] = [];\n    for (i = 0; i < n; i++) { parent.push(-1); seen.push(false); }\n    var order: number[] = [];\n    var stack: number[] = [0];\n    seen[0] = true;\n    while (stack.length > 0) {\n        var u = stack.pop() as number;\n        order.push(u);\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    var cnt: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (c = 0; c < 26; c++) row.push(0);\n        row[labels.charCodeAt(i) - 97] = 1;\n        cnt.push(row);\n    }\n    var out: number[] = [];\n    for (i = 0; i < n; i++) out.push(0);\n    for (i = order.length - 1; i >= 0; i--) {\n        var w = order[i];\n        out[w] = cnt[w][labels.charCodeAt(w) - 97];\n        var p = parent[w];\n        if (p >= 0) {\n            for (c = 0; c < 26; c++) cnt[p][c] += cnt[w][c];\n        }\n    }\n    return out;\n}`,
        java: `public static int[] countSubTrees(int n, int[][] edges, String labels) {\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    for (int[] e : edges) {\n        adj.get(e[0]).add(e[1]);\n        adj.get(e[1]).add(e[0]);\n    }\n    int[] parent = new int[n];\n    Arrays.fill(parent, -1);\n    boolean[] seen = new boolean[n];\n    int[] order = new int[n];\n    int cntOrder = 0;\n    int[] stack = new int[n];\n    int top = 0;\n    stack[top++] = 0;\n    seen[0] = true;\n    while (top > 0) {\n        int u = stack[--top];\n        order[cntOrder++] = u;\n        for (int v : adj.get(u)) {\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    int[][] cnt = new int[n][26];\n    for (int i = 0; i < n; i++) cnt[i][labels.charAt(i) - 'a'] = 1;\n    int[] out = new int[n];\n    for (int i = cntOrder - 1; i >= 0; i--) {\n        int u = order[i];\n        out[u] = cnt[u][labels.charAt(u) - 'a'];\n        int p = parent[u];\n        if (p >= 0) {\n            for (int c = 0; c < 26; c++) cnt[p][c] += cnt[u][c];\n        }\n    }\n    return out;\n}`,
        cpp: `vector<int> countSubTrees(int n, vector<vector<int>>& edges, string labels) {\n    vector<vector<int>> adj(n);\n    for (auto& e : edges) {\n        adj[e[0]].push_back(e[1]);\n        adj[e[1]].push_back(e[0]);\n    }\n    vector<int> parent(n, -1), order;\n    vector<char> seen(n, 0);\n    vector<int> stack = { 0 };\n    seen[0] = 1;\n    while (!stack.empty()) {\n        int u = stack.back();\n        stack.pop_back();\n        order.push_back(u);\n        for (int v : adj[u]) {\n            if (seen[v]) continue;\n            seen[v] = 1;\n            parent[v] = u;\n            stack.push_back(v);\n        }\n    }\n    vector<vector<int>> cnt(n, vector<int>(26, 0));\n    for (int i = 0; i < n; i++) cnt[i][labels[i] - 'a'] = 1;\n    vector<int> out(n, 0);\n    for (int i = (int) order.size() - 1; i >= 0; i--) {\n        int u = order[i];\n        out[u] = cnt[u][labels[u] - 'a'];\n        int p = parent[u];\n        if (p >= 0) {\n            for (int c = 0; c < 26; c++) cnt[p][c] += cnt[u][c];\n        }\n    }\n    return out;\n}`,
        c: `int* countSubTrees(int n, int** edges, int edgesSize, int* edgesColSize, char* labels, int* returnSize) {\n    (void) edgesColSize;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = edgesSize * 2 > 0 ? edgesSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < edgesSize; i++) {\n        int u = edges[i][0], v = edges[i][1];\n        to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec++;\n        to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec++;\n    }\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    char* seen = (char*) calloc((size_t) n, 1);\n    int* order = (int*) malloc((size_t) n * sizeof(int));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = -1;\n    int top = 0, oc = 0;\n    stack[top++] = 0;\n    seen[0] = 1;\n    while (top > 0) {\n        int u = stack[--top];\n        order[oc++] = u;\n        for (int e = head[u]; e >= 0; e = nxt[e]) {\n            int v = to[e];\n            if (seen[v]) continue;\n            seen[v] = 1;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    int* cnt = (int*) calloc((size_t) n * 26, sizeof(int));\n    for (int i = 0; i < n; i++) cnt[i * 26 + (labels[i] - 'a')] = 1;\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = oc - 1; i >= 0; i--) {\n        int u = order[i];\n        out[u] = cnt[u * 26 + (labels[u] - 'a')];\n        int p = parent[u];\n        if (p >= 0) {\n            for (int c = 0; c < 26; c++) cnt[p * 26 + c] += cnt[u * 26 + c];\n        }\n    }\n    free(head); free(nxt); free(to); free(parent);\n    free(seen); free(order); free(stack); free(cnt);\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] CountSubTrees(int n, int[][] edges, string labels)\n{\n    var adj = new List<int>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int>();\n    foreach (var e in edges)\n    {\n        adj[e[0]].Add(e[1]);\n        adj[e[1]].Add(e[0]);\n    }\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = -1;\n    var seen = new bool[n];\n    var order = new int[n];\n    int cntOrder = 0;\n    var stack = new int[n];\n    int top = 0;\n    stack[top++] = 0;\n    seen[0] = true;\n    while (top > 0)\n    {\n        int u = stack[--top];\n        order[cntOrder++] = u;\n        foreach (var v in adj[u])\n        {\n            if (seen[v]) continue;\n            seen[v] = true;\n            parent[v] = u;\n            stack[top++] = v;\n        }\n    }\n    var cnt = new int[n, 26];\n    for (int i = 0; i < n; i++) cnt[i, labels[i] - 'a'] = 1;\n    var out_ = new int[n];\n    for (int i = cntOrder - 1; i >= 0; i--)\n    {\n        int u = order[i];\n        out_[u] = cnt[u, labels[u] - 'a'];\n        int p = parent[u];\n        if (p >= 0)\n        {\n            for (int c = 0; c < 26; c++) cnt[p, c] += cnt[u, c];\n        }\n    }\n    return out_;\n}`,
        go: `func countSubTrees(n int, edges [][]int, labels string) []int {\n\tadj := make([][]int, n)\n\tfor _, e := range edges {\n\t\tadj[e[0]] = append(adj[e[0]], e[1])\n\t\tadj[e[1]] = append(adj[e[1]], e[0])\n\t}\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = -1\n\t}\n\tseen := make([]bool, n)\n\torder := make([]int, 0, n)\n\tstack := []int{0}\n\tseen[0] = true\n\tfor len(stack) > 0 {\n\t\tu := stack[len(stack)-1]\n\t\tstack = stack[:len(stack)-1]\n\t\torder = append(order, u)\n\t\tfor _, v := range adj[u] {\n\t\t\tif seen[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[v] = true\n\t\t\tparent[v] = u\n\t\t\tstack = append(stack, v)\n\t\t}\n\t}\n\tcnt := make([][26]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tcnt[i][labels[i]-'a'] = 1\n\t}\n\tout := make([]int, n)\n\tfor i := len(order) - 1; i >= 0; i-- {\n\t\tu := order[i]\n\t\tout[u] = cnt[u][labels[u]-'a']\n\t\tp := parent[u]\n\t\tif p >= 0 {\n\t\t\tfor c := 0; c < 26; c++ {\n\t\t\t\tcnt[p][c] += cnt[u][c]\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun countSubTrees(n: Int, edges: Array<IntArray>, labels: String): IntArray {\n    val adj = Array(n) { ArrayList<Int>() }\n    for (e in edges) {\n        adj[e[0]].add(e[1])\n        adj[e[1]].add(e[0])\n    }\n    val parent = IntArray(n) { -1 }\n    val seen = BooleanArray(n)\n    val order = IntArray(n)\n    var cntOrder = 0\n    val stack = IntArray(n)\n    var top = 0\n    stack[top++] = 0\n    seen[0] = true\n    while (top > 0) {\n        val u = stack[--top]\n        order[cntOrder++] = u\n        for (v in adj[u]) {\n            if (seen[v]) continue\n            seen[v] = true\n            parent[v] = u\n            stack[top++] = v\n        }\n    }\n    val cnt = Array(n) { IntArray(26) }\n    for (i in 0 until n) cnt[i][labels[i] - 'a'] = 1\n    val out = IntArray(n)\n    for (i in cntOrder - 1 downTo 0) {\n        val u = order[i]\n        out[u] = cnt[u][labels[u] - 'a']\n        val p = parent[u]\n        if (p >= 0) {\n            for (c in 0 until 26) cnt[p][c] += cnt[u][c]\n        }\n    }\n    return out\n}`,
        swift: `func countSubTrees(_ n: Int, _ edges: [[Int]], _ labels: String) -> [Int] {\n    let chars = Array(labels.unicodeScalars).map { Int($0.value) - 97 }\n    var adj = [[Int]](repeating: [], count: n)\n    for e in edges {\n        adj[e[0]].append(e[1])\n        adj[e[1]].append(e[0])\n    }\n    var parent = [Int](repeating: -1, count: n)\n    var seen = [Bool](repeating: false, count: n)\n    var order = [Int]()\n    var stack = [0]\n    seen[0] = true\n    while let u = stack.popLast() {\n        order.append(u)\n        for v in adj[u] {\n            if seen[v] { continue }\n            seen[v] = true\n            parent[v] = u\n            stack.append(v)\n        }\n    }\n    var cnt = [[Int]](repeating: [Int](repeating: 0, count: 26), count: n)\n    for i in 0..<n { cnt[i][chars[i]] = 1 }\n    var out = [Int](repeating: 0, count: n)\n    var i = order.count - 1\n    while i >= 0 {\n        let u = order[i]\n        out[u] = cnt[u][chars[u]]\n        let p = parent[u]\n        if p >= 0 {\n            for c in 0..<26 { cnt[p][c] += cnt[u][c] }\n        }\n        i -= 1\n    }\n    return out\n}`,
        rust: `fn countSubTrees(n: i32, edges: Vec<Vec<i32>>, labels: String) -> Vec<i32> {\n    let n = n as usize;\n    let chars: Vec<usize> = labels.bytes().map(|b| (b - b'a') as usize).collect();\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    for e in edges.iter() {\n        adj[e[0] as usize].push(e[1] as usize);\n        adj[e[1] as usize].push(e[0] as usize);\n    }\n    let mut parent = vec![std::usize::MAX; n];\n    let mut seen = vec![false; n];\n    let mut order: Vec<usize> = Vec::new();\n    let mut stack = vec![0usize];\n    seen[0] = true;\n    while let Some(u) = stack.pop() {\n        order.push(u);\n        for &v in adj[u].iter() {\n            if seen[v] {\n                continue;\n            }\n            seen[v] = true;\n            parent[v] = u;\n            stack.push(v);\n        }\n    }\n    let mut cnt = vec![[0i32; 26]; n];\n    for i in 0..n {\n        cnt[i][chars[i]] = 1;\n    }\n    let mut out = vec![0i32; n];\n    for i in (0..order.len()).rev() {\n        let u = order[i];\n        out[u] = cnt[u][chars[u]];\n        let p = parent[u];\n        if p != std::usize::MAX {\n            for c in 0..26 {\n                cnt[p][c] += cnt[u][c];\n            }\n        }\n    }\n    out\n}`,
        php: `function countSubTrees($n, $edges, $labels) {\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    foreach ($edges as $e) {\n        $adj[$e[0]][] = $e[1];\n        $adj[$e[1]][] = $e[0];\n    }\n    $parent = array_fill(0, $n, -1);\n    $seen = array_fill(0, $n, false);\n    $order = [];\n    $stack = [0];\n    $seen[0] = true;\n    while (count($stack) > 0) {\n        $u = array_pop($stack);\n        $order[] = $u;\n        foreach ($adj[$u] as $v) {\n            if ($seen[$v]) continue;\n            $seen[$v] = true;\n            $parent[$v] = $u;\n            $stack[] = $v;\n        }\n    }\n    $cnt = [];\n    for ($i = 0; $i < $n; $i++) {\n        $cnt[$i] = array_fill(0, 26, 0);\n        $cnt[$i][ord($labels[$i]) - 97] = 1;\n    }\n    $out = array_fill(0, $n, 0);\n    for ($i = count($order) - 1; $i >= 0; $i--) {\n        $u = $order[$i];\n        $out[$u] = $cnt[$u][ord($labels[$u]) - 97];\n        $p = $parent[$u];\n        if ($p >= 0) {\n            for ($c = 0; $c < 26; $c++) $cnt[$p][$c] += $cnt[$u][$c];\n        }\n    }\n    return $out;\n}`,
        ruby: `def countSubTrees(n, edges, labels)\n  adj = Array.new(n) { [] }\n  edges.each do |u, v|\n    adj[u] << v\n    adj[v] << u\n  end\n  parent = Array.new(n, -1)\n  seen = Array.new(n, false)\n  order = []\n  stack = [0]\n  seen[0] = true\n  until stack.empty?\n    u = stack.pop\n    order << u\n    adj[u].each do |v|\n      next if seen[v]\n      seen[v] = true\n      parent[v] = u\n      stack << v\n    end\n  end\n  cnt = Array.new(n) { Array.new(26, 0) }\n  (0...n).each { |i| cnt[i][labels[i].ord - 97] = 1 }\n  out = Array.new(n, 0)\n  (order.length - 1).downto(0) do |i|\n    u = order[i]\n    out[u] = cnt[u][labels[u].ord - 97]\n    p = parent[u]\n    if p >= 0\n      (0...26).each { |c| cnt[p][c] += cnt[u][c] }\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Shortest Path with Alternating Colors (LC 1129) ─────────────
  (() => {
    const ref = (n: number, redEdges: number[][], blueEdges: number[][]) => {
      const adj: number[][][] = [
        Array.from({ length: n }, () => []),
        Array.from({ length: n }, () => []),
      ];
      for (let i = 0; i < redEdges.length; i++) adj[0][redEdges[i][0]].push(redEdges[i][1]);
      for (let i = 0; i < blueEdges.length; i++) adj[1][blueEdges[i][0]].push(blueEdges[i][1]);
      const dist = [new Array(n).fill(-1), new Array(n).fill(-1)];
      dist[0][0] = 0;
      dist[1][0] = 0;
      const q: number[] = [0, 1];
      let head = 0;
      while (head < q.length) {
        const key = q[head++];
        const u = key >> 1, c = key & 1;
        const nc = 1 - c;
        for (let i = 0; i < adj[nc][u].length; i++) {
          const v = adj[nc][u][i];
          if (dist[nc][v] >= 0) continue;
          dist[nc][v] = dist[c][u] + 1;
          q.push((v << 1) | nc);
        }
      }
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const a = dist[0][i], b = dist[1][i];
        if (a < 0) out.push(b);
        else if (b < 0) out.push(a);
        else out.push(a < b ? a : b);
      }
      return out;
    };
    return {
      slug: "shortest-path-with-alternating-colors",
      title: "Shortest Path with Alternating Colors",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "shortestAlternatingPaths", params: [{ name: "n", type: "int" as const }, { name: "redEdges", type: "int[][]" as const }, { name: "blueEdges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A directed graph on `n` nodes has red edges and blue edges, each given as a list of `[from, to]` pairs. Edges may repeat, and a red and a blue edge may join the same pair.\n\nReturn an array where entry `i` is the length of the shortest path from node `0` to node `i` whose edge colours **alternate**, or `-1` if no such path exists.",
        [
          { in: "n = 3, redEdges = [[0,1],[1,2]], blueEdges = []", out: "[0,1,-1]", note: "Reaching node 2 would need two reds in a row." },
          { in: "n = 3, redEdges = [[0,1]], blueEdges = [[2,1]]", out: "[0,1,-1]" },
          { in: "n = 3, redEdges = [[0,1]], blueEdges = [[1,2]]", out: "[0,1,2]" },
        ],
        ["1 <= n <= 100", "0 <= redEdges.length, blueEdges.length <= 400", "redEdges[i].length == blueEdges[j].length == 2", "0 <= redEdges[i][0], redEdges[i][1], blueEdges[j][0], blueEdges[j][1] < n"]),
      hints: [
        "A node's distance alone is not enough state — the colour you arrived by decides what you may use next.",
        "So search over `(node, lastColour)` pairs, doubling the state space.",
        "Node 0 starts in both states, since the first edge may be either colour.",
      ],
      editorial: explain({
        idea: "Breadth-first search over `(node, colour-just-used)` states. From a state the only legal moves use the other colour, so the alternation is built into the transition instead of being checked afterwards.",
        steps: [
          "Build two adjacency lists, one per colour.",
          "Seed the queue with `(0, red)` and `(0, blue)`, both at distance 0.",
          "From `(u, c)` follow edges of colour `1 - c` to unvisited states.",
          "Each node's answer is the smaller of its two state distances, or `-1` if neither was reached.",
        ],
        why: "Carrying the colour in the state is what keeps BFS correct here: on the plain node graph the first arrival at a node may leave it in the wrong colour to continue, so plain BFS can report a distance that cannot actually be extended. With the colour in the state each is explored independently, and BFS's layer order still gives shortest distances.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Visiting by node instead of by `(node, colour)` throws away the state that matters.",
          "Node 0 answers 0 regardless of colours.",
          "Duplicate and parallel edges are allowed and change nothing.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1],[1,2]]\n[]", expectedOutput: "[0,1,-1]" },
        { input: "3\n[[0,1]]\n[[2,1]]", expectedOutput: "[0,1,-1]" },
        { input: "3\n[[0,1]]\n[[1,2]]", expectedOutput: "[0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const make = () => {
          const list: number[][] = [];
          const count = ri(rng, 0, 6);
          for (let k = 0; k < count; k++) list.push([ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
          return list;
        };
        const redEdges = make(), blueEdges = make();
        return {
          input: `${n}\n${fmtIntMat(redEdges)}\n${fmtIntMat(blueEdges)}`,
          expectedOutput: fmtIntArr(ref(n, redEdges, blueEdges)),
        };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef shortestAlternatingPaths(n: int, redEdges: List[List[int]], blueEdges: List[List[int]]) -> List[int]:\n    adj = [[[] for _ in range(n)], [[] for _ in range(n)]]\n    for u, v in redEdges:\n        adj[0][u].append(v)\n    for u, v in blueEdges:\n        adj[1][u].append(v)\n    dist = [[-1] * n, [-1] * n]\n    dist[0][0] = 0\n    dist[1][0] = 0\n    q = deque([(0, 0), (0, 1)])\n    while q:\n        u, c = q.popleft()\n        nc = 1 - c\n        for v in adj[nc][u]:\n            if dist[nc][v] >= 0:\n                continue\n            dist[nc][v] = dist[c][u] + 1\n            q.append((v, nc))\n    out = []\n    for i in range(n):\n        a, b = dist[0][i], dist[1][i]\n        if a < 0:\n            out.append(b)\n        elif b < 0:\n            out.append(a)\n        else:\n            out.append(min(a, b))\n    return out`,
        javascript: `var shortestAlternatingPaths = function(n, redEdges, blueEdges) {\n    var i;\n    var adj = [[], []];\n    for (i = 0; i < n; i++) { adj[0].push([]); adj[1].push([]); }\n    for (i = 0; i < redEdges.length; i++) adj[0][redEdges[i][0]].push(redEdges[i][1]);\n    for (i = 0; i < blueEdges.length; i++) adj[1][blueEdges[i][0]].push(blueEdges[i][1]);\n    var dist = [[], []];\n    for (i = 0; i < n; i++) { dist[0].push(-1); dist[1].push(-1); }\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    var q = [0, 1];\n    var head = 0;\n    while (head < q.length) {\n        var key = q[head++];\n        var u = key >> 1, c = key & 1;\n        var nc = 1 - c;\n        for (i = 0; i < adj[nc][u].length; i++) {\n            var v = adj[nc][u][i];\n            if (dist[nc][v] >= 0) continue;\n            dist[nc][v] = dist[c][u] + 1;\n            q.push((v << 1) | nc);\n        }\n    }\n    var out = [];\n    for (i = 0; i < n; i++) {\n        var a = dist[0][i], b = dist[1][i];\n        if (a < 0) out.push(b);\n        else if (b < 0) out.push(a);\n        else out.push(a < b ? a : b);\n    }\n    return out;\n};`,
        typescript: `function shortestAlternatingPaths(n: number, redEdges: number[][], blueEdges: number[][]): number[] {\n    var i: number;\n    var adj: number[][][] = [[], []];\n    for (i = 0; i < n; i++) { adj[0].push([]); adj[1].push([]); }\n    for (i = 0; i < redEdges.length; i++) adj[0][redEdges[i][0]].push(redEdges[i][1]);\n    for (i = 0; i < blueEdges.length; i++) adj[1][blueEdges[i][0]].push(blueEdges[i][1]);\n    var dist: number[][] = [[], []];\n    for (i = 0; i < n; i++) { dist[0].push(-1); dist[1].push(-1); }\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    var q: number[] = [0, 1];\n    var head = 0;\n    while (head < q.length) {\n        var key = q[head++];\n        var u = key >> 1, c = key & 1;\n        var nc = 1 - c;\n        for (i = 0; i < adj[nc][u].length; i++) {\n            var v = adj[nc][u][i];\n            if (dist[nc][v] >= 0) continue;\n            dist[nc][v] = dist[c][u] + 1;\n            q.push((v << 1) | nc);\n        }\n    }\n    var out: number[] = [];\n    for (i = 0; i < n; i++) {\n        var a = dist[0][i], b = dist[1][i];\n        if (a < 0) out.push(b);\n        else if (b < 0) out.push(a);\n        else out.push(a < b ? a : b);\n    }\n    return out;\n}`,
        java: `public static int[] shortestAlternatingPaths(int n, int[][] redEdges, int[][] blueEdges) {\n    List<List<List<Integer>>> adj = new ArrayList<>();\n    for (int c = 0; c < 2; c++) {\n        List<List<Integer>> side = new ArrayList<>();\n        for (int i = 0; i < n; i++) side.add(new ArrayList<>());\n        adj.add(side);\n    }\n    for (int[] e : redEdges) adj.get(0).get(e[0]).add(e[1]);\n    for (int[] e : blueEdges) adj.get(1).get(e[0]).add(e[1]);\n    int[][] dist = new int[2][n];\n    for (int c = 0; c < 2; c++) Arrays.fill(dist[c], -1);\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    Deque<int[]> q = new ArrayDeque<>();\n    q.add(new int[] { 0, 0 });\n    q.add(new int[] { 0, 1 });\n    while (!q.isEmpty()) {\n        int[] cur = q.poll();\n        int u = cur[0], c = cur[1], nc = 1 - c;\n        for (int v : adj.get(nc).get(u)) {\n            if (dist[nc][v] >= 0) continue;\n            dist[nc][v] = dist[c][u] + 1;\n            q.add(new int[] { v, nc });\n        }\n    }\n    int[] out = new int[n];\n    for (int i = 0; i < n; i++) {\n        int a = dist[0][i], b = dist[1][i];\n        if (a < 0) out[i] = b;\n        else if (b < 0) out[i] = a;\n        else out[i] = Math.min(a, b);\n    }\n    return out;\n}`,
        cpp: `vector<int> shortestAlternatingPaths(int n, vector<vector<int>>& redEdges, vector<vector<int>>& blueEdges) {\n    vector<vector<vector<int>>> adj(2, vector<vector<int>>(n));\n    for (auto& e : redEdges) adj[0][e[0]].push_back(e[1]);\n    for (auto& e : blueEdges) adj[1][e[0]].push_back(e[1]);\n    vector<vector<int>> dist(2, vector<int>(n, -1));\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    vector<pair<int,int>> q = { { 0, 0 }, { 0, 1 } };\n    for (size_t head = 0; head < q.size(); head++) {\n        int u = q[head].first, c = q[head].second, nc = 1 - c;\n        for (int v : adj[nc][u]) {\n            if (dist[nc][v] >= 0) continue;\n            dist[nc][v] = dist[c][u] + 1;\n            q.push_back({ v, nc });\n        }\n    }\n    vector<int> out(n);\n    for (int i = 0; i < n; i++) {\n        int a = dist[0][i], b = dist[1][i];\n        if (a < 0) out[i] = b;\n        else if (b < 0) out[i] = a;\n        else out[i] = min(a, b);\n    }\n    return out;\n}`,
        c: `int* shortestAlternatingPaths(int n, int** redEdges, int redEdgesSize, int* redEdgesColSize, int** blueEdges, int blueEdgesSize, int* blueEdgesColSize, int* returnSize) {\n    (void) redEdgesColSize;\n    (void) blueEdgesColSize;\n    int total = redEdgesSize + blueEdgesSize;\n    int cap = total > 0 ? total : 1;\n    int* head = (int*) malloc((size_t) (2 * n) * sizeof(int));\n    for (int i = 0; i < 2 * n; i++) head[i] = -1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < redEdgesSize; i++) {\n        int u = redEdges[i][0];\n        to[ec] = redEdges[i][1]; nxt[ec] = head[0 * n + u]; head[0 * n + u] = ec; ec++;\n    }\n    for (int i = 0; i < blueEdgesSize; i++) {\n        int u = blueEdges[i][0];\n        to[ec] = blueEdges[i][1]; nxt[ec] = head[1 * n + u]; head[1 * n + u] = ec; ec++;\n    }\n    int* dist = (int*) malloc((size_t) (2 * n) * sizeof(int));\n    for (int i = 0; i < 2 * n; i++) dist[i] = -1;\n    dist[0] = 0;\n    dist[n] = 0;\n    int* q = (int*) malloc((size_t) (2 * n) * sizeof(int));\n    int qh = 0, qt = 0;\n    q[qt++] = 0 * n + 0;\n    q[qt++] = 1 * n + 0;\n    while (qh < qt) {\n        int key = q[qh++];\n        int c = key / n, u = key % n, nc = 1 - c;\n        for (int e = head[nc * n + u]; e >= 0; e = nxt[e]) {\n            int v = to[e];\n            if (dist[nc * n + v] >= 0) continue;\n            dist[nc * n + v] = dist[key] + 1;\n            q[qt++] = nc * n + v;\n        }\n    }\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int a = dist[i], b = dist[n + i];\n        if (a < 0) out[i] = b;\n        else if (b < 0) out[i] = a;\n        else out[i] = a < b ? a : b;\n    }\n    free(head); free(nxt); free(to); free(dist); free(q);\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] ShortestAlternatingPaths(int n, int[][] redEdges, int[][] blueEdges)\n{\n    var adj = new List<int>[2][];\n    for (int c = 0; c < 2; c++)\n    {\n        adj[c] = new List<int>[n];\n        for (int i = 0; i < n; i++) adj[c][i] = new List<int>();\n    }\n    foreach (var e in redEdges) adj[0][e[0]].Add(e[1]);\n    foreach (var e in blueEdges) adj[1][e[0]].Add(e[1]);\n    var dist = new int[2][];\n    for (int c = 0; c < 2; c++)\n    {\n        dist[c] = new int[n];\n        for (int i = 0; i < n; i++) dist[c][i] = -1;\n    }\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    var q = new Queue<int[]>();\n    q.Enqueue(new int[] { 0, 0 });\n    q.Enqueue(new int[] { 0, 1 });\n    while (q.Count > 0)\n    {\n        var cur = q.Dequeue();\n        int u = cur[0], c = cur[1], nc = 1 - c;\n        foreach (var v in adj[nc][u])\n        {\n            if (dist[nc][v] >= 0) continue;\n            dist[nc][v] = dist[c][u] + 1;\n            q.Enqueue(new int[] { v, nc });\n        }\n    }\n    var out_ = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        int a = dist[0][i], b = dist[1][i];\n        if (a < 0) out_[i] = b;\n        else if (b < 0) out_[i] = a;\n        else out_[i] = Math.Min(a, b);\n    }\n    return out_;\n}`,
        go: `func shortestAlternatingPaths(n int, redEdges [][]int, blueEdges [][]int) []int {\n\tadj := [2][][]int{make([][]int, n), make([][]int, n)}\n\tfor _, e := range redEdges {\n\t\tadj[0][e[0]] = append(adj[0][e[0]], e[1])\n\t}\n\tfor _, e := range blueEdges {\n\t\tadj[1][e[0]] = append(adj[1][e[0]], e[1])\n\t}\n\tdist := [2][]int{make([]int, n), make([]int, n)}\n\tfor c := 0; c < 2; c++ {\n\t\tfor i := range dist[c] {\n\t\t\tdist[c][i] = -1\n\t\t}\n\t}\n\tdist[0][0] = 0\n\tdist[1][0] = 0\n\tq := [][2]int{{0, 0}, {0, 1}}\n\tfor head := 0; head < len(q); head++ {\n\t\tu, c := q[head][0], q[head][1]\n\t\tnc := 1 - c\n\t\tfor _, v := range adj[nc][u] {\n\t\t\tif dist[nc][v] >= 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdist[nc][v] = dist[c][u] + 1\n\t\t\tq = append(q, [2]int{v, nc})\n\t\t}\n\t}\n\tout := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\ta, b := dist[0][i], dist[1][i]\n\t\tif a < 0 {\n\t\t\tout[i] = b\n\t\t} else if b < 0 {\n\t\t\tout[i] = a\n\t\t} else if a < b {\n\t\t\tout[i] = a\n\t\t} else {\n\t\t\tout[i] = b\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun shortestAlternatingPaths(n: Int, redEdges: Array<IntArray>, blueEdges: Array<IntArray>): IntArray {\n    val adj = Array(2) { Array(n) { ArrayList<Int>() } }\n    for (e in redEdges) adj[0][e[0]].add(e[1])\n    for (e in blueEdges) adj[1][e[0]].add(e[1])\n    val dist = Array(2) { IntArray(n) { -1 } }\n    dist[0][0] = 0\n    dist[1][0] = 0\n    val q = ArrayList<IntArray>()\n    q.add(intArrayOf(0, 0))\n    q.add(intArrayOf(0, 1))\n    var head = 0\n    while (head < q.size) {\n        val cur = q[head++]\n        val u = cur[0]\n        val c = cur[1]\n        val nc = 1 - c\n        for (v in adj[nc][u]) {\n            if (dist[nc][v] >= 0) continue\n            dist[nc][v] = dist[c][u] + 1\n            q.add(intArrayOf(v, nc))\n        }\n    }\n    return IntArray(n) { i ->\n        val a = dist[0][i]\n        val b = dist[1][i]\n        if (a < 0) b else if (b < 0) a else minOf(a, b)\n    }\n}`,
        swift: `func shortestAlternatingPaths(_ n: Int, _ redEdges: [[Int]], _ blueEdges: [[Int]]) -> [Int] {\n    var adj = [[[Int]]](repeating: [[Int]](repeating: [], count: n), count: 2)\n    for e in redEdges { adj[0][e[0]].append(e[1]) }\n    for e in blueEdges { adj[1][e[0]].append(e[1]) }\n    var dist = [[Int]](repeating: [Int](repeating: -1, count: n), count: 2)\n    dist[0][0] = 0\n    dist[1][0] = 0\n    var q: [(Int, Int)] = [(0, 0), (0, 1)]\n    var head = 0\n    while head < q.count {\n        let (u, c) = q[head]\n        head += 1\n        let nc = 1 - c\n        for v in adj[nc][u] {\n            if dist[nc][v] >= 0 { continue }\n            dist[nc][v] = dist[c][u] + 1\n            q.append((v, nc))\n        }\n    }\n    var out = [Int]()\n    for i in 0..<n {\n        let a = dist[0][i], b = dist[1][i]\n        if a < 0 { out.append(b) }\n        else if b < 0 { out.append(a) }\n        else { out.append(min(a, b)) }\n    }\n    return out\n}`,
        rust: `fn shortestAlternatingPaths(n: i32, redEdges: Vec<Vec<i32>>, blueEdges: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = n as usize;\n    let mut adj: Vec<Vec<Vec<usize>>> = vec![vec![Vec::new(); n]; 2];\n    for e in redEdges.iter() {\n        adj[0][e[0] as usize].push(e[1] as usize);\n    }\n    for e in blueEdges.iter() {\n        adj[1][e[0] as usize].push(e[1] as usize);\n    }\n    let mut dist = vec![vec![-1i32; n]; 2];\n    dist[0][0] = 0;\n    dist[1][0] = 0;\n    let mut q: Vec<(usize, usize)> = vec![(0, 0), (0, 1)];\n    let mut head = 0usize;\n    while head < q.len() {\n        let (u, c) = q[head];\n        head += 1;\n        let nc = 1 - c;\n        for idx in 0..adj[nc][u].len() {\n            let v = adj[nc][u][idx];\n            if dist[nc][v] >= 0 {\n                continue;\n            }\n            dist[nc][v] = dist[c][u] + 1;\n            q.push((v, nc));\n        }\n    }\n    let mut out = Vec::with_capacity(n);\n    for i in 0..n {\n        let a = dist[0][i];\n        let b = dist[1][i];\n        out.push(if a < 0 {\n            b\n        } else if b < 0 {\n            a\n        } else {\n            std::cmp::min(a, b)\n        });\n    }\n    out\n}`,
        php: `function shortestAlternatingPaths($n, $redEdges, $blueEdges) {\n    $adj = [[], []];\n    for ($i = 0; $i < $n; $i++) { $adj[0][$i] = []; $adj[1][$i] = []; }\n    foreach ($redEdges as $e) $adj[0][$e[0]][] = $e[1];\n    foreach ($blueEdges as $e) $adj[1][$e[0]][] = $e[1];\n    $dist = [array_fill(0, $n, -1), array_fill(0, $n, -1)];\n    $dist[0][0] = 0;\n    $dist[1][0] = 0;\n    $q = [[0, 0], [0, 1]];\n    for ($head = 0; $head < count($q); $head++) {\n        $u = $q[$head][0];\n        $c = $q[$head][1];\n        $nc = 1 - $c;\n        foreach ($adj[$nc][$u] as $v) {\n            if ($dist[$nc][$v] >= 0) continue;\n            $dist[$nc][$v] = $dist[$c][$u] + 1;\n            $q[] = [$v, $nc];\n        }\n    }\n    $out = [];\n    for ($i = 0; $i < $n; $i++) {\n        $a = $dist[0][$i];\n        $b = $dist[1][$i];\n        if ($a < 0) $out[] = $b;\n        elseif ($b < 0) $out[] = $a;\n        else $out[] = min($a, $b);\n    }\n    return $out;\n}`,
        ruby: `def shortestAlternatingPaths(n, redEdges, blueEdges)\n  adj = [Array.new(n) { [] }, Array.new(n) { [] }]\n  redEdges.each { |u, v| adj[0][u] << v }\n  blueEdges.each { |u, v| adj[1][u] << v }\n  dist = [Array.new(n, -1), Array.new(n, -1)]\n  dist[0][0] = 0\n  dist[1][0] = 0\n  q = [[0, 0], [0, 1]]\n  head = 0\n  while head < q.length\n    u, c = q[head]\n    head += 1\n    nc = 1 - c\n    adj[nc][u].each do |v|\n      next if dist[nc][v] >= 0\n      dist[nc][v] = dist[c][u] + 1\n      q << [v, nc]\n    end\n  end\n  (0...n).map do |i|\n    a = dist[0][i]\n    b = dist[1][i]\n    if a < 0 then b\n    elsif b < 0 then a\n    else [a, b].min\n    end\n  end\nend`,
      },
    };
  })(),

  // ── Loud and Rich (LC 851) ──────────────────────────────────────
  (() => {
    const ref = (richer: number[][], quiet: number[]) => {
      const n = quiet.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      const indeg = new Array(n).fill(0);
      for (let i = 0; i < richer.length; i++) {
        adj[richer[i][0]].push(richer[i][1]);
        indeg[richer[i][1]]++;
      }
      const ans = Array.from({ length: n }, (_, i) => i);
      const q: number[] = [];
      for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
      let head = 0;
      while (head < q.length) {
        const u = q[head++];
        for (let i = 0; i < adj[u].length; i++) {
          const v = adj[u][i];
          if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];
          indeg[v]--;
          if (indeg[v] === 0) q.push(v);
        }
      }
      return ans;
    };
    return {
      slug: "loud-and-rich",
      title: "Loud and Rich",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Topological Sort", "Depth-First Search", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "loudAndRich", params: [{ name: "richer", type: "int[][]" as const }, { name: "quiet", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` people numbered `0 … n - 1`. `richer[i] = [a, b]` means person `a` has more money than person `b`, and `quiet[i]` is how quiet person `i` is — all the quietness values are different.\n\nReturn an array where entry `x` is the person `y` who is the **quietest** among everybody with at least as much money as `x` (including `x` itself). The information in `richer` is logically consistent.",
        [
          { in: "richer = [[1,0],[2,1],[3,1],[3,7],[4,3],[5,3],[6,3]], quiet = [3,2,5,4,6,1,7,0]", out: "[5,5,2,5,4,5,6,7]", note: "Person 0 is beaten on quietness by person 5, who is richer via 1 ← 3 ← 5." },
          { in: "richer = [], quiet = [0]", out: "[0]" },
          { in: "richer = [[0,1]], quiet = [0,1]", out: "[0,0]", note: "Person 0 is both richer and quieter, so they answer for themselves and for person 1." },
        ],
        ["n == quiet.length", "1 <= n <= 500", "0 <= quiet[i] < n", "All the values of quiet are unique.", "0 <= richer.length <= n * (n - 1) / 2", "0 <= richer[i][0], richer[i][1] < n", "richer[i][0] != richer[i][1]", "All the pairs of richer are unique.", "The observations in richer are all logically consistent."]),
      hints: [
        "Draw an edge from each richer person to each poorer one. Consistency means the graph is acyclic.",
        "A person's answer is the best among their own quietness and the answers of everyone richer than them.",
        "Process people in topological order, richest first, pushing answers downhill.",
      ],
      editorial: explain({
        idea: "Orient each `richer` pair from the richer person to the poorer one. The answer for a person is the quietest among themselves and everyone upstream, so sweep the DAG in topological order and relax each edge forward.",
        steps: [
          "Build the edges richer → poorer and count in-degrees.",
          "Start every answer as the person themselves and queue the in-degree-zero people.",
          "When popping `u`, offer `ans[u]` to each poorer neighbour `v`, keeping whichever is quieter.",
          "Decrement `v`'s in-degree and queue it when it reaches zero.",
        ],
        why: "Topological order is what makes one pass enough: a person is only popped after every richer person has already offered their answer, so `ans[u]` is final before it propagates. \"At least as much money\" is a transitive relation, and relaxing along single edges composes into exactly that closure without ever enumerating it.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Compare quietness values, but return the *person*, not the value.",
          "Everyone starts as their own answer; a person with nobody richer keeps it.",
          "Relaxing before a node's in-degree hits zero can propagate a half-finished answer.",
        ],
      }),
      examples: [
        { input: "[[1,0],[2,1],[3,1],[3,7],[4,3],[5,3],[6,3]]\n[3,2,5,4,6,1,7,0]", expectedOutput: "[5,5,2,5,4,5,6,7]" },
        { input: "[]\n[0]", expectedOutput: "[0]" },
        { input: "[[0,1]]\n[0,1]", expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        // Orient each pair along a hidden wealth ranking, so `richer` is always
        // acyclic and therefore consistent.
        const n = ri(rng, 1, 9);
        const wealth = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const richer: number[][] = [];
        for (let a = 0; a < n; a++) {
          for (let b = a + 1; b < n; b++) {
            if (rng() < 0.4) richer.push([wealth[a], wealth[b]]);
          }
        }
        const quiet = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        return { input: `${fmtIntMat(richer)}\n${fmtIntArr(quiet)}`, expectedOutput: fmtIntArr(ref(richer, quiet)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef loudAndRich(richer: List[List[int]], quiet: List[int]) -> List[int]:\n    n = len(quiet)\n    adj = [[] for _ in range(n)]\n    indeg = [0] * n\n    for a, b in richer:\n        adj[a].append(b)\n        indeg[b] += 1\n    ans = list(range(n))\n    q = deque(i for i in range(n) if indeg[i] == 0)\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if quiet[ans[u]] < quiet[ans[v]]:\n                ans[v] = ans[u]\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                q.append(v)\n    return ans`,
        javascript: `var loudAndRich = function(richer, quiet) {\n    var n = quiet.length, i;\n    var adj = [], indeg = [], ans = [];\n    for (i = 0; i < n; i++) { adj.push([]); indeg.push(0); ans.push(i); }\n    for (i = 0; i < richer.length; i++) {\n        adj[richer[i][0]].push(richer[i][1]);\n        indeg[richer[i][1]]++;\n    }\n    var q = [];\n    for (i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);\n    var head = 0;\n    while (head < q.length) {\n        var u = q[head++];\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            indeg[v]--;\n            if (indeg[v] === 0) q.push(v);\n        }\n    }\n    return ans;\n};`,
        typescript: `function loudAndRich(richer: number[][], quiet: number[]): number[] {\n    var n = quiet.length, i: number;\n    var adj: number[][] = [], indeg: number[] = [], ans: number[] = [];\n    for (i = 0; i < n; i++) { adj.push([]); indeg.push(0); ans.push(i); }\n    for (i = 0; i < richer.length; i++) {\n        adj[richer[i][0]].push(richer[i][1]);\n        indeg[richer[i][1]]++;\n    }\n    var q: number[] = [];\n    for (i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);\n    var head = 0;\n    while (head < q.length) {\n        var u = q[head++];\n        for (i = 0; i < adj[u].length; i++) {\n            var v = adj[u][i];\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            indeg[v]--;\n            if (indeg[v] === 0) q.push(v);\n        }\n    }\n    return ans;\n}`,
        java: `public static int[] loudAndRich(int[][] richer, int[] quiet) {\n    int n = quiet.length;\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    int[] indeg = new int[n];\n    for (int[] r : richer) {\n        adj.get(r[0]).add(r[1]);\n        indeg[r[1]]++;\n    }\n    int[] ans = new int[n];\n    for (int i = 0; i < n; i++) ans[i] = i;\n    int[] q = new int[n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) if (indeg[i] == 0) q[tail++] = i;\n    while (head < tail) {\n        int u = q[head++];\n        for (int v : adj.get(u)) {\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            if (--indeg[v] == 0) q[tail++] = v;\n        }\n    }\n    return ans;\n}`,
        cpp: `vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {\n    int n = (int) quiet.size();\n    vector<vector<int>> adj(n);\n    vector<int> indeg(n, 0), ans(n);\n    for (int i = 0; i < n; i++) ans[i] = i;\n    for (auto& r : richer) {\n        adj[r[0]].push_back(r[1]);\n        indeg[r[1]]++;\n    }\n    vector<int> q;\n    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push_back(i);\n    for (size_t head = 0; head < q.size(); head++) {\n        int u = q[head];\n        for (int v : adj[u]) {\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            if (--indeg[v] == 0) q.push_back(v);\n        }\n    }\n    return ans;\n}`,
        c: `int* loudAndRich(int** richer, int richerSize, int* richerColSize, int* quiet, int quietSize, int* returnSize) {\n    (void) richerColSize;\n    int n = quietSize;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = richerSize > 0 ? richerSize : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int* indeg = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < richerSize; i++) {\n        int a = richer[i][0], b = richer[i][1];\n        to[i] = b; nxt[i] = head[a]; head[a] = i;\n        indeg[b]++;\n    }\n    int* ans = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) ans[i] = i;\n    int* q = (int*) malloc((size_t) n * sizeof(int));\n    int qh = 0, qt = 0;\n    for (int i = 0; i < n; i++) if (indeg[i] == 0) q[qt++] = i;\n    while (qh < qt) {\n        int u = q[qh++];\n        for (int e = head[u]; e >= 0; e = nxt[e]) {\n            int v = to[e];\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            if (--indeg[v] == 0) q[qt++] = v;\n        }\n    }\n    free(head); free(nxt); free(to); free(indeg); free(q);\n    *returnSize = n;\n    return ans;\n}`,
        csharp: `public static int[] LoudAndRich(int[][] richer, int[] quiet)\n{\n    int n = quiet.Length;\n    var adj = new List<int>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int>();\n    var indeg = new int[n];\n    foreach (var r in richer)\n    {\n        adj[r[0]].Add(r[1]);\n        indeg[r[1]]++;\n    }\n    var ans = new int[n];\n    for (int i = 0; i < n; i++) ans[i] = i;\n    var q = new int[n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) if (indeg[i] == 0) q[tail++] = i;\n    while (head < tail)\n    {\n        int u = q[head++];\n        foreach (var v in adj[u])\n        {\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u];\n            if (--indeg[v] == 0) q[tail++] = v;\n        }\n    }\n    return ans;\n}`,
        go: `func loudAndRich(richer [][]int, quiet []int) []int {\n\tn := len(quiet)\n\tadj := make([][]int, n)\n\tindeg := make([]int, n)\n\tfor _, r := range richer {\n\t\tadj[r[0]] = append(adj[r[0]], r[1])\n\t\tindeg[r[1]]++\n\t}\n\tans := make([]int, n)\n\tfor i := range ans {\n\t\tans[i] = i\n\t}\n\tq := []int{}\n\tfor i := 0; i < n; i++ {\n\t\tif indeg[i] == 0 {\n\t\t\tq = append(q, i)\n\t\t}\n\t}\n\tfor head := 0; head < len(q); head++ {\n\t\tu := q[head]\n\t\tfor _, v := range adj[u] {\n\t\t\tif quiet[ans[u]] < quiet[ans[v]] {\n\t\t\t\tans[v] = ans[u]\n\t\t\t}\n\t\t\tindeg[v]--\n\t\t\tif indeg[v] == 0 {\n\t\t\t\tq = append(q, v)\n\t\t\t}\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun loudAndRich(richer: Array<IntArray>, quiet: IntArray): IntArray {\n    val n = quiet.size\n    val adj = Array(n) { ArrayList<Int>() }\n    val indeg = IntArray(n)\n    for (r in richer) {\n        adj[r[0]].add(r[1])\n        indeg[r[1]]++\n    }\n    val ans = IntArray(n) { it }\n    val q = IntArray(n)\n    var head = 0\n    var tail = 0\n    for (i in 0 until n) if (indeg[i] == 0) q[tail++] = i\n    while (head < tail) {\n        val u = q[head++]\n        for (v in adj[u]) {\n            if (quiet[ans[u]] < quiet[ans[v]]) ans[v] = ans[u]\n            if (--indeg[v] == 0) q[tail++] = v\n        }\n    }\n    return ans\n}`,
        swift: `func loudAndRich(_ richer: [[Int]], _ quiet: [Int]) -> [Int] {\n    let n = quiet.count\n    var adj = [[Int]](repeating: [], count: n)\n    var indeg = [Int](repeating: 0, count: n)\n    for r in richer {\n        adj[r[0]].append(r[1])\n        indeg[r[1]] += 1\n    }\n    var ans = Array(0..<n)\n    var q = [Int]()\n    for i in 0..<n where indeg[i] == 0 { q.append(i) }\n    var head = 0\n    while head < q.count {\n        let u = q[head]\n        head += 1\n        for v in adj[u] {\n            if quiet[ans[u]] < quiet[ans[v]] { ans[v] = ans[u] }\n            indeg[v] -= 1\n            if indeg[v] == 0 { q.append(v) }\n        }\n    }\n    return ans\n}`,
        rust: `fn loudAndRich(richer: Vec<Vec<i32>>, quiet: Vec<i32>) -> Vec<i32> {\n    let n = quiet.len();\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    let mut indeg = vec![0i32; n];\n    for r in richer.iter() {\n        adj[r[0] as usize].push(r[1] as usize);\n        indeg[r[1] as usize] += 1;\n    }\n    let mut ans: Vec<usize> = (0..n).collect();\n    let mut q: Vec<usize> = (0..n).filter(|&i| indeg[i] == 0).collect();\n    let mut head = 0usize;\n    while head < q.len() {\n        let u = q[head];\n        head += 1;\n        for idx in 0..adj[u].len() {\n            let v = adj[u][idx];\n            if quiet[ans[u]] < quiet[ans[v]] {\n                ans[v] = ans[u];\n            }\n            indeg[v] -= 1;\n            if indeg[v] == 0 {\n                q.push(v);\n            }\n        }\n    }\n    ans.iter().map(|&x| x as i32).collect()\n}`,
        php: `function loudAndRich($richer, $quiet) {\n    $n = count($quiet);\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    $indeg = array_fill(0, $n, 0);\n    foreach ($richer as $r) {\n        $adj[$r[0]][] = $r[1];\n        $indeg[$r[1]]++;\n    }\n    $ans = range(0, $n - 1);\n    $q = [];\n    for ($i = 0; $i < $n; $i++) if ($indeg[$i] === 0) $q[] = $i;\n    for ($head = 0; $head < count($q); $head++) {\n        $u = $q[$head];\n        foreach ($adj[$u] as $v) {\n            if ($quiet[$ans[$u]] < $quiet[$ans[$v]]) $ans[$v] = $ans[$u];\n            $indeg[$v]--;\n            if ($indeg[$v] === 0) $q[] = $v;\n        }\n    }\n    return $ans;\n}`,
        ruby: `def loudAndRich(richer, quiet)\n  n = quiet.length\n  adj = Array.new(n) { [] }\n  indeg = Array.new(n, 0)\n  richer.each do |a, b|\n    adj[a] << b\n    indeg[b] += 1\n  end\n  ans = (0...n).to_a\n  q = (0...n).select { |i| indeg[i] == 0 }\n  head = 0\n  while head < q.length\n    u = q[head]\n    head += 1\n    adj[u].each do |v|\n      ans[v] = ans[u] if quiet[ans[u]] < quiet[ans[v]]\n      indeg[v] -= 1\n      q << v if indeg[v] == 0\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Open the Lock (LC 752) ──────────────────────────────────────
  (() => {
    const ref = (deadends: string[], target: string) => {
      const blocked = new Array(10000).fill(false);
      for (let i = 0; i < deadends.length; i++) blocked[parseInt(deadends[i], 10)] = true;
      const goal = parseInt(target, 10);
      if (blocked[0]) return -1;
      if (goal === 0) return 0;
      const dist = new Array(10000).fill(-1);
      dist[0] = 0;
      const q = [0];
      let head = 0;
      const pow = [1, 10, 100, 1000];
      while (head < q.length) {
        const cur = q[head++];
        for (let p = 0; p < 4; p++) {
          const digit = Math.floor(cur / pow[p]) % 10;
          for (let d = -1; d <= 1; d += 2) {
            const nd = (digit + d + 10) % 10;
            const next = cur + (nd - digit) * pow[p];
            if (blocked[next] || dist[next] >= 0) continue;
            dist[next] = dist[cur] + 1;
            if (next === goal) return dist[next];
            q.push(next);
          }
        }
      }
      return -1;
    };
    return {
      slug: "open-the-lock",
      title: "Open the Lock",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Breadth-First Search", "Amazon", "Google", "Uber"],
      signature: { funcName: "openLock", params: [{ name: "deadends", type: "string[]" as const }, { name: "target", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A lock has four circular wheels, each showing one of `'0' … '9'`. A wheel wraps around, so `'9'` turns to `'0'` and back. One move turns exactly one wheel by one notch.\n\nThe lock starts at `\"0000\"`. If it ever shows one of the `deadends`, the wheels jam and it can never be turned again. Return the smallest number of moves that reaches `target`, or `-1` if that is impossible.",
        [
          { in: 'deadends = ["0201","0101","0102","1212","2002"], target = "0202"', out: "6", note: 'Via "0000" → "1000" → "1100" → "1200" → "1201" → "1202" → "0202"; the direct route runs into a deadend.' },
          { in: 'deadends = ["8888"], target = "0009"', out: "1", note: "Turn the last wheel down one notch." },
          { in: 'deadends = ["8887","8889","8878","8898","8788","8988","7888","9888"], target = "8888"', out: "-1", note: "The target is walled in by deadends." },
        ],
        ["1 <= deadends.length <= 500", "deadends[i].length == 4", "target.length == 4", "target is not in the list deadends.", "target and deadends[i] consist of digits only."]),
      hints: [
        "There are only 10 000 possible readings, so the whole state space fits in memory.",
        "Each reading has eight neighbours: four wheels, each turned up or down.",
        "Breadth-first search from `\"0000\"` gives the fewest moves.",
      ],
      editorial: explain({
        idea: "Treat each four-digit reading as a node with eight neighbours and run a breadth-first search from `0000`. Deadends are simply nodes that are never entered.",
        steps: [
          "Mark the deadends. If `0000` is one, the answer is `-1` at once.",
          "BFS from `0000`, generating the eight single-notch neighbours of each reading.",
          "Skip deadends and readings already visited.",
          "Return the distance when the target is generated, or `-1` if the queue runs dry.",
        ],
        why: "Every move has the same cost, which is exactly when BFS gives shortest distances — no priority queue is needed. Working with the reading as an integer `0 … 9999` and stepping a digit with `(digit ± 1 + 10) % 10` keeps both the wrap-around and the visited array trivial. The graph is undirected, so the search covers everything reachable in at most 10 000 pops.",
        time: "O(10^4 · 8)",
        space: "O(10^4)",
        pitfalls: [
          "`\"0000\"` being a deadend must be checked before the search starts.",
          "A target of `\"0000\"` answers 0.",
          "The wheels wrap, so `'0'` and `'9'` are neighbours.",
        ],
      }),
      examples: [
        { input: '["0201","0101","0102","1212","2002"]\n"0202"', expectedOutput: "6" },
        { input: '["8888"]\n"0009"', expectedOutput: "1" },
        { input: '["8887","8889","8878","8898","8788","8988","7888","9888"]\n"8888"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const four = (v: number) => {
          let s = String(v);
          while (s.length < 4) s = "0" + s;
          return s;
        };
        // Keep the digits in a small window so the deadends often matter.
        const span = pick(rng, [2, 3, 10]);
        const draw = () => {
          let v = 0;
          for (let p = 0; p < 4; p++) v = v * 10 + ri(rng, 0, span - 1);
          return v;
        };
        const goal = draw();
        const set = new Set<number>();
        const count = ri(rng, 1, 8);
        for (let k = 0; k < count; k++) {
          const v = draw();
          if (v === goal) continue;
          set.add(v);
        }
        if (set.size === 0) set.add(goal === 9999 ? 9998 : 9999);
        const deadends = Array.from(set).map(four);
        return {
          input: `${fmtStrArr(deadends)}\n"${four(goal)}"`,
          expectedOutput: String(ref(deadends, four(goal))),
        };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef openLock(deadends: List[str], target: str) -> int:\n    blocked = [False] * 10000\n    for d in deadends:\n        blocked[int(d)] = True\n    goal = int(target)\n    if blocked[0]:\n        return -1\n    if goal == 0:\n        return 0\n    dist = [-1] * 10000\n    dist[0] = 0\n    q = deque([0])\n    powers = (1, 10, 100, 1000)\n    while q:\n        cur = q.popleft()\n        for p in powers:\n            digit = cur // p % 10\n            for step in (-1, 1):\n                nd = (digit + step) % 10\n                nxt = cur + (nd - digit) * p\n                if blocked[nxt] or dist[nxt] >= 0:\n                    continue\n                dist[nxt] = dist[cur] + 1\n                if nxt == goal:\n                    return dist[nxt]\n                q.append(nxt)\n    return -1`,
        javascript: `var openLock = function(deadends, target) {\n    var i;\n    var blocked = [], dist = [];\n    for (i = 0; i < 10000; i++) { blocked.push(false); dist.push(-1); }\n    for (i = 0; i < deadends.length; i++) blocked[parseInt(deadends[i], 10)] = true;\n    var goal = parseInt(target, 10);\n    if (blocked[0]) return -1;\n    if (goal === 0) return 0;\n    dist[0] = 0;\n    var q = [0];\n    var head = 0;\n    var pow = [1, 10, 100, 1000];\n    while (head < q.length) {\n        var cur = q[head++];\n        for (var p = 0; p < 4; p++) {\n            var digit = Math.floor(cur / pow[p]) % 10;\n            for (var d = -1; d <= 1; d += 2) {\n                var nd = (digit + d + 10) % 10;\n                var next = cur + (nd - digit) * pow[p];\n                if (blocked[next] || dist[next] >= 0) continue;\n                dist[next] = dist[cur] + 1;\n                if (next === goal) return dist[next];\n                q.push(next);\n            }\n        }\n    }\n    return -1;\n};`,
        typescript: `function openLock(deadends: string[], target: string): number {\n    var i: number;\n    var blocked: boolean[] = [], dist: number[] = [];\n    for (i = 0; i < 10000; i++) { blocked.push(false); dist.push(-1); }\n    for (i = 0; i < deadends.length; i++) blocked[parseInt(deadends[i], 10)] = true;\n    var goal = parseInt(target, 10);\n    if (blocked[0]) return -1;\n    if (goal === 0) return 0;\n    dist[0] = 0;\n    var q: number[] = [0];\n    var head = 0;\n    var pow = [1, 10, 100, 1000];\n    while (head < q.length) {\n        var cur = q[head++];\n        for (var p = 0; p < 4; p++) {\n            var digit = Math.floor(cur / pow[p]) % 10;\n            for (var d = -1; d <= 1; d += 2) {\n                var nd = (digit + d + 10) % 10;\n                var next = cur + (nd - digit) * pow[p];\n                if (blocked[next] || dist[next] >= 0) continue;\n                dist[next] = dist[cur] + 1;\n                if (next === goal) return dist[next];\n                q.push(next);\n            }\n        }\n    }\n    return -1;\n}`,
        java: `public static int openLock(String[] deadends, String target) {\n    boolean[] blocked = new boolean[10000];\n    for (String d : deadends) blocked[Integer.parseInt(d)] = true;\n    int goal = Integer.parseInt(target);\n    if (blocked[0]) return -1;\n    if (goal == 0) return 0;\n    int[] dist = new int[10000];\n    Arrays.fill(dist, -1);\n    dist[0] = 0;\n    int[] q = new int[10000];\n    int head = 0, tail = 0;\n    q[tail++] = 0;\n    int[] pow = { 1, 10, 100, 1000 };\n    while (head < tail) {\n        int cur = q[head++];\n        for (int p = 0; p < 4; p++) {\n            int digit = cur / pow[p] % 10;\n            for (int d = -1; d <= 1; d += 2) {\n                int nd = (digit + d + 10) % 10;\n                int next = cur + (nd - digit) * pow[p];\n                if (blocked[next] || dist[next] >= 0) continue;\n                dist[next] = dist[cur] + 1;\n                if (next == goal) return dist[next];\n                q[tail++] = next;\n            }\n        }\n    }\n    return -1;\n}`,
        cpp: `int openLock(vector<string>& deadends, string target) {\n    vector<char> blocked(10000, 0);\n    for (auto& d : deadends) blocked[stoi(d)] = 1;\n    int goal = stoi(target);\n    if (blocked[0]) return -1;\n    if (goal == 0) return 0;\n    vector<int> dist(10000, -1), q;\n    dist[0] = 0;\n    q.push_back(0);\n    int pw[4] = { 1, 10, 100, 1000 };\n    for (size_t head = 0; head < q.size(); head++) {\n        int cur = q[head];\n        for (int p = 0; p < 4; p++) {\n            int digit = cur / pw[p] % 10;\n            for (int d = -1; d <= 1; d += 2) {\n                int nd = (digit + d + 10) % 10;\n                int next = cur + (nd - digit) * pw[p];\n                if (blocked[next] || dist[next] >= 0) continue;\n                dist[next] = dist[cur] + 1;\n                if (next == goal) return dist[next];\n                q.push_back(next);\n            }\n        }\n    }\n    return -1;\n}`,
        c: `int openLock(char** deadends, int deadendsSize, char* target) {\n    char* blocked = (char*) calloc(10000, 1);\n    for (int i = 0; i < deadendsSize; i++) blocked[atoi(deadends[i])] = 1;\n    int goal = atoi(target);\n    int ans = -1;\n    if (!blocked[0]) {\n        if (goal == 0) {\n            free(blocked);\n            return 0;\n        }\n        int* dist = (int*) malloc(10000 * sizeof(int));\n        for (int i = 0; i < 10000; i++) dist[i] = -1;\n        int* q = (int*) malloc(10000 * sizeof(int));\n        int qh = 0, qt = 0;\n        dist[0] = 0;\n        q[qt++] = 0;\n        int pw[4] = { 1, 10, 100, 1000 };\n        while (qh < qt && ans < 0) {\n            int cur = q[qh++];\n            for (int p = 0; p < 4 && ans < 0; p++) {\n                int digit = cur / pw[p] % 10;\n                for (int d = -1; d <= 1; d += 2) {\n                    int nd = (digit + d + 10) % 10;\n                    int next = cur + (nd - digit) * pw[p];\n                    if (blocked[next] || dist[next] >= 0) continue;\n                    dist[next] = dist[cur] + 1;\n                    if (next == goal) { ans = dist[next]; break; }\n                    q[qt++] = next;\n                }\n            }\n        }\n        free(dist);\n        free(q);\n    }\n    free(blocked);\n    return ans;\n}`,
        csharp: `public static int OpenLock(string[] deadends, string target)\n{\n    var blocked = new bool[10000];\n    foreach (var d in deadends) blocked[int.Parse(d)] = true;\n    int goal = int.Parse(target);\n    if (blocked[0]) return -1;\n    if (goal == 0) return 0;\n    var dist = new int[10000];\n    for (int i = 0; i < 10000; i++) dist[i] = -1;\n    dist[0] = 0;\n    var q = new int[10000];\n    int head = 0, tail = 0;\n    q[tail++] = 0;\n    int[] pow = { 1, 10, 100, 1000 };\n    while (head < tail)\n    {\n        int cur = q[head++];\n        for (int p = 0; p < 4; p++)\n        {\n            int digit = cur / pow[p] % 10;\n            for (int d = -1; d <= 1; d += 2)\n            {\n                int nd = (digit + d + 10) % 10;\n                int next = cur + (nd - digit) * pow[p];\n                if (blocked[next] || dist[next] >= 0) continue;\n                dist[next] = dist[cur] + 1;\n                if (next == goal) return dist[next];\n                q[tail++] = next;\n            }\n        }\n    }\n    return -1;\n}`,
        go: `func openLock(deadends []string, target string) int {\n\tblocked := make([]bool, 10000)\n\tfor _, d := range deadends {\n\t\tv, _ := strconv.Atoi(d)\n\t\tblocked[v] = true\n\t}\n\tgoal, _ := strconv.Atoi(target)\n\tif blocked[0] {\n\t\treturn -1\n\t}\n\tif goal == 0 {\n\t\treturn 0\n\t}\n\tdist := make([]int, 10000)\n\tfor i := range dist {\n\t\tdist[i] = -1\n\t}\n\tdist[0] = 0\n\tq := []int{0}\n\tpw := []int{1, 10, 100, 1000}\n\tfor head := 0; head < len(q); head++ {\n\t\tcur := q[head]\n\t\tfor p := 0; p < 4; p++ {\n\t\t\tdigit := cur / pw[p] % 10\n\t\t\tfor d := -1; d <= 1; d += 2 {\n\t\t\t\tnd := (digit + d + 10) % 10\n\t\t\t\tnext := cur + (nd-digit)*pw[p]\n\t\t\t\tif blocked[next] || dist[next] >= 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tdist[next] = dist[cur] + 1\n\t\t\t\tif next == goal {\n\t\t\t\t\treturn dist[next]\n\t\t\t\t}\n\t\t\t\tq = append(q, next)\n\t\t\t}\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun openLock(deadends: Array<String>, target: String): Int {\n    val blocked = BooleanArray(10000)\n    for (d in deadends) blocked[d.toInt()] = true\n    val goal = target.toInt()\n    if (blocked[0]) return -1\n    if (goal == 0) return 0\n    val dist = IntArray(10000) { -1 }\n    dist[0] = 0\n    val q = IntArray(10000)\n    var head = 0\n    var tail = 0\n    q[tail++] = 0\n    val pw = intArrayOf(1, 10, 100, 1000)\n    while (head < tail) {\n        val cur = q[head++]\n        for (p in 0 until 4) {\n            val digit = cur / pw[p] % 10\n            var d = -1\n            while (d <= 1) {\n                val nd = (digit + d + 10) % 10\n                val next = cur + (nd - digit) * pw[p]\n                if (!blocked[next] && dist[next] < 0) {\n                    dist[next] = dist[cur] + 1\n                    if (next == goal) return dist[next]\n                    q[tail++] = next\n                }\n                d += 2\n            }\n        }\n    }\n    return -1\n}`,
        swift: `func openLock(_ deadends: [String], _ target: String) -> Int {\n    var blocked = [Bool](repeating: false, count: 10000)\n    for d in deadends { blocked[Int(d)!] = true }\n    let goal = Int(target)!\n    if blocked[0] { return -1 }\n    if goal == 0 { return 0 }\n    var dist = [Int](repeating: -1, count: 10000)\n    dist[0] = 0\n    var q = [0]\n    var head = 0\n    let pw = [1, 10, 100, 1000]\n    while head < q.count {\n        let cur = q[head]\n        head += 1\n        for p in 0..<4 {\n            let digit = cur / pw[p] % 10\n            for step in [-1, 1] {\n                let nd = (digit + step + 10) % 10\n                let next = cur + (nd - digit) * pw[p]\n                if blocked[next] || dist[next] >= 0 { continue }\n                dist[next] = dist[cur] + 1\n                if next == goal { return dist[next] }\n                q.append(next)\n            }\n        }\n    }\n    return -1\n}`,
        rust: `fn openLock(deadends: Vec<String>, target: String) -> i32 {\n    let mut blocked = vec![false; 10000];\n    for d in deadends.iter() {\n        blocked[d.parse::<usize>().unwrap()] = true;\n    }\n    let goal: usize = target.parse().unwrap();\n    if blocked[0] {\n        return -1;\n    }\n    if goal == 0 {\n        return 0;\n    }\n    let mut dist = vec![-1i32; 10000];\n    dist[0] = 0;\n    let mut q: Vec<usize> = vec![0];\n    let mut head = 0usize;\n    let pw = [1usize, 10, 100, 1000];\n    while head < q.len() {\n        let cur = q[head];\n        head += 1;\n        for p in 0..4 {\n            let digit = (cur / pw[p] % 10) as i32;\n            for step in [-1i32, 1] {\n                let nd = (digit + step + 10) % 10;\n                let next = (cur as i32 + (nd - digit) * pw[p] as i32) as usize;\n                if blocked[next] || dist[next] >= 0 {\n                    continue;\n                }\n                dist[next] = dist[cur] + 1;\n                if next == goal {\n                    return dist[next];\n                }\n                q.push(next);\n            }\n        }\n    }\n    -1\n}`,
        php: `function openLock($deadends, $target) {\n    $blocked = array_fill(0, 10000, false);\n    foreach ($deadends as $d) $blocked[intval($d)] = true;\n    $goal = intval($target);\n    if ($blocked[0]) return -1;\n    if ($goal === 0) return 0;\n    $dist = array_fill(0, 10000, -1);\n    $dist[0] = 0;\n    $q = [0];\n    $pw = [1, 10, 100, 1000];\n    for ($head = 0; $head < count($q); $head++) {\n        $cur = $q[$head];\n        for ($p = 0; $p < 4; $p++) {\n            $digit = intdiv($cur, $pw[$p]) % 10;\n            for ($d = -1; $d <= 1; $d += 2) {\n                $nd = ($digit + $d + 10) % 10;\n                $next = $cur + ($nd - $digit) * $pw[$p];\n                if ($blocked[$next] || $dist[$next] >= 0) continue;\n                $dist[$next] = $dist[$cur] + 1;\n                if ($next === $goal) return $dist[$next];\n                $q[] = $next;\n            }\n        }\n    }\n    return -1;\n}`,
        ruby: `def openLock(deadends, target)\n  blocked = Array.new(10000, false)\n  deadends.each { |d| blocked[d.to_i] = true }\n  goal = target.to_i\n  return -1 if blocked[0]\n  return 0 if goal == 0\n  dist = Array.new(10000, -1)\n  dist[0] = 0\n  q = [0]\n  head = 0\n  pw = [1, 10, 100, 1000]\n  while head < q.length\n    cur = q[head]\n    head += 1\n    (0...4).each do |p|\n      digit = cur / pw[p] % 10\n      [-1, 1].each do |step|\n        nd = (digit + step + 10) % 10\n        nxt = cur + (nd - digit) * pw[p]\n        next if blocked[nxt] || dist[nxt] >= 0\n        dist[nxt] = dist[cur] + 1\n        return dist[nxt] if nxt == goal\n        q << nxt\n      end\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Jump Game IV (LC 1345) ──────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      if (n <= 1) return 0;
      const byVal = new Map<number, number[]>();
      for (let i = 0; i < n; i++) {
        const list = byVal.get(arr[i]);
        if (list) list.push(i);
        else byVal.set(arr[i], [i]);
      }
      const dist = new Array(n).fill(-1);
      dist[0] = 0;
      const q = [0];
      let head = 0;
      while (head < q.length) {
        const u = q[head++];
        if (u === n - 1) return dist[u];
        const bucket = byVal.get(arr[u]);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            const v = bucket[i];
            if (dist[v] >= 0) continue;
            dist[v] = dist[u] + 1;
            q.push(v);
          }
          byVal.delete(arr[u]);
        }
        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q.push(u - 1); }
        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q.push(u + 1); }
      }
      return -1;
    };
    return {
      slug: "jump-game-iv",
      title: "Jump Game IV",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Breadth-First Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minJumps", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You start at index `0` of an array. From index `i` you may jump to `i + 1`, to `i - 1`, or to **any** index `j` with `arr[i] == arr[j]`, as long as the destination is inside the array.\n\nReturn the minimum number of jumps needed to reach the last index.",
        [
          { in: "arr = [100,-23,-23,404,100,23,23,23,3,404]", out: "3", note: "Jump 0 → 4 (both 100), then 4 → 3, then 3 → 9 (both 404)." },
          { in: "arr = [7]", out: "0", note: "You already are at the last index." },
          { in: "arr = [7,6,9,6,9,6,9,7]", out: "1", note: "Jump straight from the first 7 to the last." },
        ],
        ["1 <= arr.length <= 5 * 10^4", "-10^8 <= arr[i] <= 10^8"]),
      hints: [
        "Every jump costs 1, so this is a shortest-path problem — breadth-first search.",
        "Group the indices by value so the \"same value\" jumps are found in O(1).",
        "Once a value's group has been used, it can never help again; clear it.",
      ],
      editorial: explain({
        idea: "Model indices as nodes and jumps as unit edges, then BFS. Grouping indices by value gives the value-jumps cheaply, and clearing each group after it is expanded keeps the whole search linear.",
        steps: [
          "Bucket the indices by their value.",
          "BFS from index 0. When popping `u`, enqueue every unvisited index in `arr[u]`'s bucket, then **delete the bucket**.",
          "Also enqueue `u - 1` and `u + 1` if they are in range and unvisited.",
          "Return the distance when the last index is popped.",
        ],
        why: "Clearing the bucket is what stops the algorithm from being quadratic: a value shared by 50 000 indices would otherwise be scanned once per member. It is safe because the first time the group is expanded every member gets its final (minimum) distance, so a later visit could never improve anything — the group's whole usefulness is spent in one go.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Without clearing the buckets a long run of equal values is O(n²) and times out.",
          "A single-element array answers 0.",
          "Mark visited on enqueue; marking on dequeue lets duplicates pile up.",
        ],
      }),
      examples: [
        { input: "[100,-23,-23,404,100,23,23,23,3,404]", expectedOutput: "3" },
        { input: "[7]", expectedOutput: "0" },
        { input: "[7,6,9,6,9,6,9,7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const span = pick(rng, [2, 4, 30]);
        const arr = Array.from({ length: n }, () => ri(rng, -span, span));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict, deque\n\ndef minJumps(arr: List[int]) -> int:\n    n = len(arr)\n    if n <= 1:\n        return 0\n    by_val = defaultdict(list)\n    for i, v in enumerate(arr):\n        by_val[v].append(i)\n    dist = [-1] * n\n    dist[0] = 0\n    q = deque([0])\n    while q:\n        u = q.popleft()\n        if u == n - 1:\n            return dist[u]\n        if arr[u] in by_val:\n            for v in by_val[arr[u]]:\n                if dist[v] < 0:\n                    dist[v] = dist[u] + 1\n                    q.append(v)\n            del by_val[arr[u]]\n        for v in (u - 1, u + 1):\n            if 0 <= v < n and dist[v] < 0:\n                dist[v] = dist[u] + 1\n                q.append(v)\n    return -1`,
        javascript: `var minJumps = function(arr) {\n    var n = arr.length, i;\n    if (n <= 1) return 0;\n    var byVal = new Map();\n    for (i = 0; i < n; i++) {\n        var list = byVal.get(arr[i]);\n        if (list) list.push(i);\n        else byVal.set(arr[i], [i]);\n    }\n    var dist = [];\n    for (i = 0; i < n; i++) dist.push(-1);\n    dist[0] = 0;\n    var q = [0];\n    var head = 0;\n    while (head < q.length) {\n        var u = q[head++];\n        if (u === n - 1) return dist[u];\n        var bucket = byVal.get(arr[u]);\n        if (bucket) {\n            for (i = 0; i < bucket.length; i++) {\n                var v = bucket[i];\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q.push(v);\n            }\n            byVal["delete"](arr[u]);\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q.push(u - 1); }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q.push(u + 1); }\n    }\n    return -1;\n};`,
        typescript: `function minJumps(arr: number[]): number {\n    var n = arr.length, i: number;\n    if (n <= 1) return 0;\n    var byVal: { [k: string]: number[] } = {};\n    for (i = 0; i < n; i++) {\n        var key = "" + arr[i];\n        if (byVal[key]) byVal[key].push(i);\n        else byVal[key] = [i];\n    }\n    var dist: number[] = [];\n    for (i = 0; i < n; i++) dist.push(-1);\n    dist[0] = 0;\n    var q: number[] = [0];\n    var head = 0;\n    while (head < q.length) {\n        var u = q[head++];\n        if (u === n - 1) return dist[u];\n        var k = "" + arr[u];\n        var bucket = byVal[k];\n        if (bucket) {\n            for (i = 0; i < bucket.length; i++) {\n                var v = bucket[i];\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q.push(v);\n            }\n            byVal[k] = [];\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q.push(u - 1); }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q.push(u + 1); }\n    }\n    return -1;\n}`,
        java: `public static int minJumps(int[] arr) {\n    int n = arr.length;\n    if (n <= 1) return 0;\n    Map<Integer, List<Integer>> byVal = new HashMap<>();\n    for (int i = 0; i < n; i++) byVal.computeIfAbsent(arr[i], x -> new ArrayList<>()).add(i);\n    int[] dist = new int[n];\n    Arrays.fill(dist, -1);\n    dist[0] = 0;\n    int[] q = new int[n];\n    int head = 0, tail = 0;\n    q[tail++] = 0;\n    while (head < tail) {\n        int u = q[head++];\n        if (u == n - 1) return dist[u];\n        List<Integer> bucket = byVal.remove(arr[u]);\n        if (bucket != null) {\n            for (int v : bucket) {\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q[tail++] = v;\n            }\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q[tail++] = u - 1; }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q[tail++] = u + 1; }\n    }\n    return -1;\n}`,
        cpp: `int minJumps(vector<int>& arr) {\n    int n = (int) arr.size();\n    if (n <= 1) return 0;\n    unordered_map<int, vector<int>> byVal;\n    for (int i = 0; i < n; i++) byVal[arr[i]].push_back(i);\n    vector<int> dist(n, -1), q;\n    dist[0] = 0;\n    q.push_back(0);\n    for (size_t head = 0; head < q.size(); head++) {\n        int u = q[head];\n        if (u == n - 1) return dist[u];\n        auto it = byVal.find(arr[u]);\n        if (it != byVal.end()) {\n            for (int v : it->second) {\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q.push_back(v);\n            }\n            byVal.erase(it);\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q.push_back(u - 1); }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q.push_back(u + 1); }\n    }\n    return -1;\n}`,
        c: `static int mjCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    if (x[0] != y[0]) return x[0] < y[0] ? -1 : 1;\n    return x[1] - y[1];\n}\n\nint minJumps(int* arr, int arrSize) {\n    int n = arrSize;\n    if (n <= 1) return 0;\n    /* Sort (value, index) pairs so each value's indices sit in one contiguous\n       run; a binary search then locates a value's run without a hash map. */\n    int* pairs = (int*) malloc((size_t) n * 2 * sizeof(int));\n    for (int i = 0; i < n; i++) { pairs[i * 2] = arr[i]; pairs[i * 2 + 1] = i; }\n    qsort(pairs, (size_t) n, 2 * sizeof(int), mjCmp);\n    char* spent = (char*) calloc((size_t) n, 1);\n    int* dist = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) dist[i] = -1;\n    dist[0] = 0;\n    int* q = (int*) malloc((size_t) n * sizeof(int));\n    int qh = 0, qt = 0;\n    q[qt++] = 0;\n    int ans = -1;\n    while (qh < qt) {\n        int u = q[qh++];\n        if (u == n - 1) { ans = dist[u]; break; }\n        int lo = 0, hi = n - 1, at = -1;\n        while (lo <= hi) {\n            int mid = (lo + hi) / 2;\n            if (pairs[mid * 2] < arr[u]) lo = mid + 1;\n            else { if (pairs[mid * 2] == arr[u]) at = mid; hi = mid - 1; }\n        }\n        if (at >= 0 && !spent[at]) {\n            for (int t = at; t < n && pairs[t * 2] == arr[u]; t++) {\n                spent[t] = 1;\n                int v = pairs[t * 2 + 1];\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q[qt++] = v;\n            }\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q[qt++] = u - 1; }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q[qt++] = u + 1; }\n    }\n    free(pairs); free(spent); free(dist); free(q);\n    return ans;\n}`,
        csharp: `public static int MinJumps(int[] arr)\n{\n    int n = arr.Length;\n    if (n <= 1) return 0;\n    var byVal = new Dictionary<int, List<int>>();\n    for (int i = 0; i < n; i++)\n    {\n        if (!byVal.TryGetValue(arr[i], out var list))\n        {\n            list = new List<int>();\n            byVal[arr[i]] = list;\n        }\n        list.Add(i);\n    }\n    var dist = new int[n];\n    for (int i = 0; i < n; i++) dist[i] = -1;\n    dist[0] = 0;\n    var q = new int[n];\n    int head = 0, tail = 0;\n    q[tail++] = 0;\n    while (head < tail)\n    {\n        int u = q[head++];\n        if (u == n - 1) return dist[u];\n        if (byVal.TryGetValue(arr[u], out var bucket))\n        {\n            foreach (var v in bucket)\n            {\n                if (dist[v] >= 0) continue;\n                dist[v] = dist[u] + 1;\n                q[tail++] = v;\n            }\n            byVal.Remove(arr[u]);\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q[tail++] = u - 1; }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q[tail++] = u + 1; }\n    }\n    return -1;\n}`,
        go: `func minJumps(arr []int) int {\n\tn := len(arr)\n\tif n <= 1 {\n\t\treturn 0\n\t}\n\tbyVal := map[int][]int{}\n\tfor i, v := range arr {\n\t\tbyVal[v] = append(byVal[v], i)\n\t}\n\tdist := make([]int, n)\n\tfor i := range dist {\n\t\tdist[i] = -1\n\t}\n\tdist[0] = 0\n\tq := []int{0}\n\tfor head := 0; head < len(q); head++ {\n\t\tu := q[head]\n\t\tif u == n-1 {\n\t\t\treturn dist[u]\n\t\t}\n\t\tif bucket, ok := byVal[arr[u]]; ok {\n\t\t\tfor _, v := range bucket {\n\t\t\t\tif dist[v] >= 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tdist[v] = dist[u] + 1\n\t\t\t\tq = append(q, v)\n\t\t\t}\n\t\t\tdelete(byVal, arr[u])\n\t\t}\n\t\tif u-1 >= 0 && dist[u-1] < 0 {\n\t\t\tdist[u-1] = dist[u] + 1\n\t\t\tq = append(q, u-1)\n\t\t}\n\t\tif u+1 < n && dist[u+1] < 0 {\n\t\t\tdist[u+1] = dist[u] + 1\n\t\t\tq = append(q, u+1)\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun minJumps(arr: IntArray): Int {\n    val n = arr.size\n    if (n <= 1) return 0\n    val byVal = HashMap<Int, ArrayList<Int>>()\n    for (i in 0 until n) byVal.getOrPut(arr[i]) { ArrayList() }.add(i)\n    val dist = IntArray(n) { -1 }\n    dist[0] = 0\n    val q = IntArray(n)\n    var head = 0\n    var tail = 0\n    q[tail++] = 0\n    while (head < tail) {\n        val u = q[head++]\n        if (u == n - 1) return dist[u]\n        val bucket = byVal.remove(arr[u])\n        if (bucket != null) {\n            for (v in bucket) {\n                if (dist[v] >= 0) continue\n                dist[v] = dist[u] + 1\n                q[tail++] = v\n            }\n        }\n        if (u - 1 >= 0 && dist[u - 1] < 0) { dist[u - 1] = dist[u] + 1; q[tail++] = u - 1 }\n        if (u + 1 < n && dist[u + 1] < 0) { dist[u + 1] = dist[u] + 1; q[tail++] = u + 1 }\n    }\n    return -1\n}`,
        swift: `func minJumps(_ arr: [Int]) -> Int {\n    let n = arr.count\n    if n <= 1 { return 0 }\n    var byVal = [Int: [Int]]()\n    for i in 0..<n { byVal[arr[i], default: []].append(i) }\n    var dist = [Int](repeating: -1, count: n)\n    dist[0] = 0\n    var q = [0]\n    var head = 0\n    while head < q.count {\n        let u = q[head]\n        head += 1\n        if u == n - 1 { return dist[u] }\n        if let bucket = byVal.removeValue(forKey: arr[u]) {\n            for v in bucket {\n                if dist[v] >= 0 { continue }\n                dist[v] = dist[u] + 1\n                q.append(v)\n            }\n        }\n        if u - 1 >= 0 && dist[u - 1] < 0 { dist[u - 1] = dist[u] + 1; q.append(u - 1) }\n        if u + 1 < n && dist[u + 1] < 0 { dist[u + 1] = dist[u] + 1; q.append(u + 1) }\n    }\n    return -1\n}`,
        rust: `use std::collections::HashMap;\n\nfn minJumps(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    if n <= 1 {\n        return 0;\n    }\n    let mut by_val: HashMap<i32, Vec<usize>> = HashMap::new();\n    for i in 0..n {\n        by_val.entry(arr[i]).or_insert_with(Vec::new).push(i);\n    }\n    let mut dist = vec![-1i32; n];\n    dist[0] = 0;\n    let mut q: Vec<usize> = vec![0];\n    let mut head = 0usize;\n    while head < q.len() {\n        let u = q[head];\n        head += 1;\n        if u == n - 1 {\n            return dist[u];\n        }\n        if let Some(bucket) = by_val.remove(&arr[u]) {\n            for v in bucket {\n                if dist[v] >= 0 {\n                    continue;\n                }\n                dist[v] = dist[u] + 1;\n                q.push(v);\n            }\n        }\n        if u >= 1 && dist[u - 1] < 0 {\n            dist[u - 1] = dist[u] + 1;\n            q.push(u - 1);\n        }\n        if u + 1 < n && dist[u + 1] < 0 {\n            dist[u + 1] = dist[u] + 1;\n            q.push(u + 1);\n        }\n    }\n    -1\n}`,
        php: `function minJumps($arr) {\n    $n = count($arr);\n    if ($n <= 1) return 0;\n    $byVal = [];\n    for ($i = 0; $i < $n; $i++) $byVal[$arr[$i]][] = $i;\n    $dist = array_fill(0, $n, -1);\n    $dist[0] = 0;\n    $q = [0];\n    for ($head = 0; $head < count($q); $head++) {\n        $u = $q[$head];\n        if ($u === $n - 1) return $dist[$u];\n        if (isset($byVal[$arr[$u]])) {\n            foreach ($byVal[$arr[$u]] as $v) {\n                if ($dist[$v] >= 0) continue;\n                $dist[$v] = $dist[$u] + 1;\n                $q[] = $v;\n            }\n            unset($byVal[$arr[$u]]);\n        }\n        if ($u - 1 >= 0 && $dist[$u - 1] < 0) { $dist[$u - 1] = $dist[$u] + 1; $q[] = $u - 1; }\n        if ($u + 1 < $n && $dist[$u + 1] < 0) { $dist[$u + 1] = $dist[$u] + 1; $q[] = $u + 1; }\n    }\n    return -1;\n}`,
        ruby: `def minJumps(arr)\n  n = arr.length\n  return 0 if n <= 1\n  by_val = Hash.new { |h, k| h[k] = [] }\n  arr.each_with_index { |v, i| by_val[v] << i }\n  dist = Array.new(n, -1)\n  dist[0] = 0\n  q = [0]\n  head = 0\n  while head < q.length\n    u = q[head]\n    head += 1\n    return dist[u] if u == n - 1\n    if by_val.key?(arr[u])\n      by_val[arr[u]].each do |v|\n        next if dist[v] >= 0\n        dist[v] = dist[u] + 1\n        q << v\n      end\n      by_val.delete(arr[u])\n    end\n    if u - 1 >= 0 && dist[u - 1] < 0\n      dist[u - 1] = dist[u] + 1\n      q << u - 1\n    end\n    if u + 1 < n && dist[u + 1] < 0\n      dist[u + 1] = dist[u] + 1\n      q << u + 1\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Sliding Puzzle (LC 773) ─────────────────────────────────────
  (() => {
    const NBRS = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]];
    const ref = (board: number[][]) => {
      const enc = (a: number[]) => {
        let v = 0;
        for (let i = 0; i < 6; i++) v = v * 6 + a[i];
        return v;
      };
      const dec = (v: number) => {
        const a = new Array(6).fill(0);
        for (let i = 5; i >= 0; i--) { a[i] = v % 6; v = Math.floor(v / 6); }
        return a;
      };
      const start = enc([board[0][0], board[0][1], board[0][2], board[1][0], board[1][1], board[1][2]]);
      const goal = enc([1, 2, 3, 4, 5, 0]);
      if (start === goal) return 0;
      const dist = new Array(46656).fill(-1);
      dist[start] = 0;
      const q = [start];
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const a = dec(cur);
        let z = 0;
        for (let i = 0; i < 6; i++) if (a[i] === 0) z = i;
        for (let k = 0; k < NBRS[z].length; k++) {
          const j = NBRS[z][k];
          const b = a.slice();
          b[z] = b[j];
          b[j] = 0;
          const nv = enc(b);
          if (dist[nv] >= 0) continue;
          dist[nv] = dist[cur] + 1;
          if (nv === goal) return dist[nv];
          q.push(nv);
        }
      }
      return -1;
    };
    return {
      slug: "sliding-puzzle",
      title: "Sliding Puzzle",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Breadth-First Search", "Google", "Amazon", "Apple"],
      signature: { funcName: "slidingPuzzle", params: [{ name: "board", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A `2 × 3` board holds the tiles `1 … 5` and one empty square written as `0`. A move swaps the `0` with a tile directly above, below, left or right of it.\n\nThe board is solved when it reads `[[1,2,3],[4,5,0]]`. Return the least number of moves that solves it, or `-1` if it cannot be solved.",
        [
          { in: "board = [[1,2,3],[4,0,5]]", out: "1", note: "Swap the `0` with the `5`." },
          { in: "board = [[1,2,3],[5,4,0]]", out: "-1", note: "This arrangement cannot be reached from the solved one." },
          { in: "board = [[4,1,2],[5,0,3]]", out: "5" },
        ],
        ["board.length == 2", "board[i].length == 3", "0 <= board[i][j] <= 5", "Each value of board is unique."]),
      hints: [
        "There are only `6! = 720` arrangements, so the entire state space can be searched.",
        "Encode a board as a short sequence of six digits and breadth-first search over those states.",
        "Precompute which squares each position can swap with — the board never changes shape.",
      ],
      editorial: explain({
        idea: "Treat each arrangement as a node and each legal swap as a unit edge, then breadth-first search from the given board to the solved one.",
        steps: [
          "Flatten the board to six digits and encode it as a single integer in base 6.",
          "Use a fixed adjacency table for the six positions of a 2 × 3 grid.",
          "BFS: locate the `0`, swap it with each neighbouring position, and enqueue unvisited results.",
          "Return the distance on reaching the solved encoding, or `-1` when the queue empties.",
        ],
        why: "Exactly half of the 720 arrangements are reachable from the solved board — sliding puzzles preserve permutation parity — which is why `-1` is a genuine outcome rather than a missed search. BFS explores the reachable half in full, so an empty queue is a proof of unsolvability, not a timeout.",
        time: "O(6! · 6)",
        space: "O(6^6) for the flat visited table",
        pitfalls: [
          "The goal is `[[1,2,3],[4,5,0]]`, with the blank last — not `[[0,1,2],[3,4,5]]`.",
          "Base-6 encoding wastes a little space (6^6 slots for 720 states) but makes the visited table a plain array.",
          "An already-solved board answers 0.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,0,5]]", expectedOutput: "1" },
        { input: "[[1,2,3],[5,4,0]]", expectedOutput: "-1" },
        { input: "[[4,1,2],[5,0,3]]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const flat = shuffle(rng, [0, 1, 2, 3, 4, 5]);
        const board = [[flat[0], flat[1], flat[2]], [flat[3], flat[4], flat[5]]];
        return { input: fmtIntMat(board), expectedOutput: String(ref(board)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\nNBRS = ((1, 3), (0, 2, 4), (1, 5), (0, 4), (1, 3, 5), (2, 4))\n\ndef slidingPuzzle(board: List[List[int]]) -> int:\n    start = tuple(board[0] + board[1])\n    goal = (1, 2, 3, 4, 5, 0)\n    if start == goal:\n        return 0\n    seen = {start: 0}\n    q = deque([start])\n    while q:\n        cur = q.popleft()\n        z = cur.index(0)\n        for j in NBRS[z]:\n            nxt = list(cur)\n            nxt[z], nxt[j] = nxt[j], 0\n            nxt = tuple(nxt)\n            if nxt in seen:\n                continue\n            seen[nxt] = seen[cur] + 1\n            if nxt == goal:\n                return seen[nxt]\n            q.append(nxt)\n    return -1`,
        javascript: `var slidingPuzzle = function(board) {\n    var NBRS = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]];\n    var enc = function(a) {\n        var v = 0;\n        for (var i = 0; i < 6; i++) v = v * 6 + a[i];\n        return v;\n    };\n    var dec = function(v) {\n        var a = [0, 0, 0, 0, 0, 0];\n        for (var i = 5; i >= 0; i--) { a[i] = v % 6; v = Math.floor(v / 6); }\n        return a;\n    };\n    var start = enc([board[0][0], board[0][1], board[0][2], board[1][0], board[1][1], board[1][2]]);\n    var goal = enc([1, 2, 3, 4, 5, 0]);\n    if (start === goal) return 0;\n    var dist = [];\n    for (var i = 0; i < 46656; i++) dist.push(-1);\n    dist[start] = 0;\n    var q = [start];\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var a = dec(cur);\n        var z = 0;\n        for (i = 0; i < 6; i++) if (a[i] === 0) z = i;\n        for (var k = 0; k < NBRS[z].length; k++) {\n            var j = NBRS[z][k];\n            var b = a.slice();\n            b[z] = b[j];\n            b[j] = 0;\n            var nv = enc(b);\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv === goal) return dist[nv];\n            q.push(nv);\n        }\n    }\n    return -1;\n};`,
        typescript: `function slidingPuzzle(board: number[][]): number {\n    var NBRS = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]];\n    var enc = function(a: number[]): number {\n        var v = 0;\n        for (var i = 0; i < 6; i++) v = v * 6 + a[i];\n        return v;\n    };\n    var dec = function(v: number): number[] {\n        var a = [0, 0, 0, 0, 0, 0];\n        for (var i = 5; i >= 0; i--) { a[i] = v % 6; v = Math.floor(v / 6); }\n        return a;\n    };\n    var start = enc([board[0][0], board[0][1], board[0][2], board[1][0], board[1][1], board[1][2]]);\n    var goal = enc([1, 2, 3, 4, 5, 0]);\n    if (start === goal) return 0;\n    var dist: number[] = [];\n    for (var i = 0; i < 46656; i++) dist.push(-1);\n    dist[start] = 0;\n    var q: number[] = [start];\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var a = dec(cur);\n        var z = 0;\n        for (i = 0; i < 6; i++) if (a[i] === 0) z = i;\n        for (var k = 0; k < NBRS[z].length; k++) {\n            var j = NBRS[z][k];\n            var b = a.slice();\n            b[z] = b[j];\n            b[j] = 0;\n            var nv = enc(b);\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv === goal) return dist[nv];\n            q.push(nv);\n        }\n    }\n    return -1;\n}`,
        java: `public static int slidingPuzzle(int[][] board) {\n    int[][] nbrs = { {1,3}, {0,2,4}, {1,5}, {0,4}, {1,3,5}, {2,4} };\n    int start = 0;\n    for (int i = 0; i < 6; i++) start = start * 6 + board[i / 3][i % 3];\n    int goal = 0;\n    int[] g = { 1, 2, 3, 4, 5, 0 };\n    for (int i = 0; i < 6; i++) goal = goal * 6 + g[i];\n    if (start == goal) return 0;\n    int[] dist = new int[46656];\n    Arrays.fill(dist, -1);\n    dist[start] = 0;\n    int[] q = new int[46656];\n    int head = 0, tail = 0;\n    q[tail++] = start;\n    while (head < tail) {\n        int cur = q[head++];\n        int[] a = new int[6];\n        int tmp = cur;\n        for (int i = 5; i >= 0; i--) { a[i] = tmp % 6; tmp /= 6; }\n        int z = 0;\n        for (int i = 0; i < 6; i++) if (a[i] == 0) z = i;\n        for (int j : nbrs[z]) {\n            int[] b = a.clone();\n            b[z] = b[j];\n            b[j] = 0;\n            int nv = 0;\n            for (int i = 0; i < 6; i++) nv = nv * 6 + b[i];\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv == goal) return dist[nv];\n            q[tail++] = nv;\n        }\n    }\n    return -1;\n}`,
        cpp: `int slidingPuzzle(vector<vector<int>>& board) {\n    vector<vector<int>> nbrs = { {1,3}, {0,2,4}, {1,5}, {0,4}, {1,3,5}, {2,4} };\n    int start = 0;\n    for (int i = 0; i < 6; i++) start = start * 6 + board[i / 3][i % 3];\n    int g[6] = { 1, 2, 3, 4, 5, 0 };\n    int goal = 0;\n    for (int i = 0; i < 6; i++) goal = goal * 6 + g[i];\n    if (start == goal) return 0;\n    vector<int> dist(46656, -1), q;\n    dist[start] = 0;\n    q.push_back(start);\n    for (size_t head = 0; head < q.size(); head++) {\n        int cur = q[head];\n        int a[6], tmp = cur;\n        for (int i = 5; i >= 0; i--) { a[i] = tmp % 6; tmp /= 6; }\n        int z = 0;\n        for (int i = 0; i < 6; i++) if (a[i] == 0) z = i;\n        for (int j : nbrs[z]) {\n            int b[6];\n            for (int i = 0; i < 6; i++) b[i] = a[i];\n            b[z] = b[j];\n            b[j] = 0;\n            int nv = 0;\n            for (int i = 0; i < 6; i++) nv = nv * 6 + b[i];\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv == goal) return dist[nv];\n            q.push_back(nv);\n        }\n    }\n    return -1;\n}`,
        c: `int slidingPuzzle(int** board, int boardSize, int* boardColSize) {\n    (void) boardSize;\n    (void) boardColSize;\n    int nbrs[6][4] = { {1,3,-1,-1}, {0,2,4,-1}, {1,5,-1,-1}, {0,4,-1,-1}, {1,3,5,-1}, {2,4,-1,-1} };\n    int start = 0;\n    for (int i = 0; i < 6; i++) start = start * 6 + board[i / 3][i % 3];\n    int g[6] = { 1, 2, 3, 4, 5, 0 };\n    int goal = 0;\n    for (int i = 0; i < 6; i++) goal = goal * 6 + g[i];\n    if (start == goal) return 0;\n    int* dist = (int*) malloc(46656 * sizeof(int));\n    for (int i = 0; i < 46656; i++) dist[i] = -1;\n    int* q = (int*) malloc(46656 * sizeof(int));\n    int qh = 0, qt = 0, ans = -1;\n    dist[start] = 0;\n    q[qt++] = start;\n    while (qh < qt && ans < 0) {\n        int cur = q[qh++];\n        int a[6], tmp = cur;\n        for (int i = 5; i >= 0; i--) { a[i] = tmp % 6; tmp /= 6; }\n        int z = 0;\n        for (int i = 0; i < 6; i++) if (a[i] == 0) z = i;\n        for (int k = 0; k < 4 && nbrs[z][k] >= 0; k++) {\n            int j = nbrs[z][k];\n            int b[6];\n            for (int i = 0; i < 6; i++) b[i] = a[i];\n            b[z] = b[j];\n            b[j] = 0;\n            int nv = 0;\n            for (int i = 0; i < 6; i++) nv = nv * 6 + b[i];\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv == goal) { ans = dist[nv]; break; }\n            q[qt++] = nv;\n        }\n    }\n    free(dist);\n    free(q);\n    return ans;\n}`,
        csharp: `public static int SlidingPuzzle(int[][] board)\n{\n    int[][] nbrs = { new[]{1,3}, new[]{0,2,4}, new[]{1,5}, new[]{0,4}, new[]{1,3,5}, new[]{2,4} };\n    int start = 0;\n    for (int i = 0; i < 6; i++) start = start * 6 + board[i / 3][i % 3];\n    int[] g = { 1, 2, 3, 4, 5, 0 };\n    int goal = 0;\n    for (int i = 0; i < 6; i++) goal = goal * 6 + g[i];\n    if (start == goal) return 0;\n    var dist = new int[46656];\n    for (int i = 0; i < 46656; i++) dist[i] = -1;\n    dist[start] = 0;\n    var q = new int[46656];\n    int head = 0, tail = 0;\n    q[tail++] = start;\n    while (head < tail)\n    {\n        int cur = q[head++];\n        var a = new int[6];\n        int tmp = cur;\n        for (int i = 5; i >= 0; i--) { a[i] = tmp % 6; tmp /= 6; }\n        int z = 0;\n        for (int i = 0; i < 6; i++) if (a[i] == 0) z = i;\n        foreach (var j in nbrs[z])\n        {\n            var b = (int[]) a.Clone();\n            b[z] = b[j];\n            b[j] = 0;\n            int nv = 0;\n            for (int i = 0; i < 6; i++) nv = nv * 6 + b[i];\n            if (dist[nv] >= 0) continue;\n            dist[nv] = dist[cur] + 1;\n            if (nv == goal) return dist[nv];\n            q[tail++] = nv;\n        }\n    }\n    return -1;\n}`,
        go: `func slidingPuzzle(board [][]int) int {\n\tnbrs := [][]int{{1, 3}, {0, 2, 4}, {1, 5}, {0, 4}, {1, 3, 5}, {2, 4}}\n\tstart := 0\n\tfor i := 0; i < 6; i++ {\n\t\tstart = start*6 + board[i/3][i%3]\n\t}\n\tg := []int{1, 2, 3, 4, 5, 0}\n\tgoal := 0\n\tfor i := 0; i < 6; i++ {\n\t\tgoal = goal*6 + g[i]\n\t}\n\tif start == goal {\n\t\treturn 0\n\t}\n\tdist := make([]int, 46656)\n\tfor i := range dist {\n\t\tdist[i] = -1\n\t}\n\tdist[start] = 0\n\tq := []int{start}\n\tfor head := 0; head < len(q); head++ {\n\t\tcur := q[head]\n\t\tvar a [6]int\n\t\ttmp := cur\n\t\tfor i := 5; i >= 0; i-- {\n\t\t\ta[i] = tmp % 6\n\t\t\ttmp /= 6\n\t\t}\n\t\tz := 0\n\t\tfor i := 0; i < 6; i++ {\n\t\t\tif a[i] == 0 {\n\t\t\t\tz = i\n\t\t\t}\n\t\t}\n\t\tfor _, j := range nbrs[z] {\n\t\t\tb := a\n\t\t\tb[z] = b[j]\n\t\t\tb[j] = 0\n\t\t\tnv := 0\n\t\t\tfor i := 0; i < 6; i++ {\n\t\t\t\tnv = nv*6 + b[i]\n\t\t\t}\n\t\t\tif dist[nv] >= 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdist[nv] = dist[cur] + 1\n\t\t\tif nv == goal {\n\t\t\t\treturn dist[nv]\n\t\t\t}\n\t\t\tq = append(q, nv)\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun slidingPuzzle(board: Array<IntArray>): Int {\n    val nbrs = arrayOf(intArrayOf(1, 3), intArrayOf(0, 2, 4), intArrayOf(1, 5), intArrayOf(0, 4), intArrayOf(1, 3, 5), intArrayOf(2, 4))\n    var start = 0\n    for (i in 0 until 6) start = start * 6 + board[i / 3][i % 3]\n    val g = intArrayOf(1, 2, 3, 4, 5, 0)\n    var goal = 0\n    for (i in 0 until 6) goal = goal * 6 + g[i]\n    if (start == goal) return 0\n    val dist = IntArray(46656) { -1 }\n    dist[start] = 0\n    val q = IntArray(46656)\n    var head = 0\n    var tail = 0\n    q[tail++] = start\n    while (head < tail) {\n        val cur = q[head++]\n        val a = IntArray(6)\n        var tmp = cur\n        for (i in 5 downTo 0) {\n            a[i] = tmp % 6\n            tmp /= 6\n        }\n        var z = 0\n        for (i in 0 until 6) if (a[i] == 0) z = i\n        for (j in nbrs[z]) {\n            val b = a.copyOf()\n            b[z] = b[j]\n            b[j] = 0\n            var nv = 0\n            for (i in 0 until 6) nv = nv * 6 + b[i]\n            if (dist[nv] >= 0) continue\n            dist[nv] = dist[cur] + 1\n            if (nv == goal) return dist[nv]\n            q[tail++] = nv\n        }\n    }\n    return -1\n}`,
        swift: `func slidingPuzzle(_ board: [[Int]]) -> Int {\n    let nbrs = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]]\n    var start = 0\n    for i in 0..<6 { start = start * 6 + board[i / 3][i % 3] }\n    let g = [1, 2, 3, 4, 5, 0]\n    var goal = 0\n    for i in 0..<6 { goal = goal * 6 + g[i] }\n    if start == goal { return 0 }\n    var dist = [Int](repeating: -1, count: 46656)\n    dist[start] = 0\n    var q = [start]\n    var head = 0\n    while head < q.count {\n        let cur = q[head]\n        head += 1\n        var a = [Int](repeating: 0, count: 6)\n        var tmp = cur\n        for i in stride(from: 5, through: 0, by: -1) {\n            a[i] = tmp % 6\n            tmp /= 6\n        }\n        var z = 0\n        for i in 0..<6 where a[i] == 0 { z = i }\n        for j in nbrs[z] {\n            var b = a\n            b[z] = b[j]\n            b[j] = 0\n            var nv = 0\n            for i in 0..<6 { nv = nv * 6 + b[i] }\n            if dist[nv] >= 0 { continue }\n            dist[nv] = dist[cur] + 1\n            if nv == goal { return dist[nv] }\n            q.append(nv)\n        }\n    }\n    return -1\n}`,
        rust: `fn slidingPuzzle(board: Vec<Vec<i32>>) -> i32 {\n    let nbrs: Vec<Vec<usize>> = vec![vec![1, 3], vec![0, 2, 4], vec![1, 5], vec![0, 4], vec![1, 3, 5], vec![2, 4]];\n    let mut start = 0usize;\n    for i in 0..6 {\n        start = start * 6 + board[i / 3][i % 3] as usize;\n    }\n    let g = [1usize, 2, 3, 4, 5, 0];\n    let mut goal = 0usize;\n    for i in 0..6 {\n        goal = goal * 6 + g[i];\n    }\n    if start == goal {\n        return 0;\n    }\n    let mut dist = vec![-1i32; 46656];\n    dist[start] = 0;\n    let mut q: Vec<usize> = vec![start];\n    let mut head = 0usize;\n    while head < q.len() {\n        let cur = q[head];\n        head += 1;\n        let mut a = [0usize; 6];\n        let mut tmp = cur;\n        for i in (0..6).rev() {\n            a[i] = tmp % 6;\n            tmp /= 6;\n        }\n        let mut z = 0usize;\n        for i in 0..6 {\n            if a[i] == 0 {\n                z = i;\n            }\n        }\n        for &j in nbrs[z].iter() {\n            let mut b = a;\n            b[z] = b[j];\n            b[j] = 0;\n            let mut nv = 0usize;\n            for i in 0..6 {\n                nv = nv * 6 + b[i];\n            }\n            if dist[nv] >= 0 {\n                continue;\n            }\n            dist[nv] = dist[cur] + 1;\n            if nv == goal {\n                return dist[nv];\n            }\n            q.push(nv);\n        }\n    }\n    -1\n}`,
        php: `function slidingPuzzle($board) {\n    $nbrs = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]];\n    $start = 0;\n    for ($i = 0; $i < 6; $i++) $start = $start * 6 + $board[intdiv($i, 3)][$i % 3];\n    $g = [1, 2, 3, 4, 5, 0];\n    $goal = 0;\n    for ($i = 0; $i < 6; $i++) $goal = $goal * 6 + $g[$i];\n    if ($start === $goal) return 0;\n    $dist = array_fill(0, 46656, -1);\n    $dist[$start] = 0;\n    $q = [$start];\n    for ($head = 0; $head < count($q); $head++) {\n        $cur = $q[$head];\n        $a = array_fill(0, 6, 0);\n        $tmp = $cur;\n        for ($i = 5; $i >= 0; $i--) { $a[$i] = $tmp % 6; $tmp = intdiv($tmp, 6); }\n        $z = 0;\n        for ($i = 0; $i < 6; $i++) if ($a[$i] === 0) $z = $i;\n        foreach ($nbrs[$z] as $j) {\n            $b = $a;\n            $b[$z] = $b[$j];\n            $b[$j] = 0;\n            $nv = 0;\n            for ($i = 0; $i < 6; $i++) $nv = $nv * 6 + $b[$i];\n            if ($dist[$nv] >= 0) continue;\n            $dist[$nv] = $dist[$cur] + 1;\n            if ($nv === $goal) return $dist[$nv];\n            $q[] = $nv;\n        }\n    }\n    return -1;\n}`,
        ruby: `def slidingPuzzle(board)\n  nbrs = [[1, 3], [0, 2, 4], [1, 5], [0, 4], [1, 3, 5], [2, 4]]\n  start = 0\n  (0...6).each { |i| start = start * 6 + board[i / 3][i % 3] }\n  g = [1, 2, 3, 4, 5, 0]\n  goal = 0\n  (0...6).each { |i| goal = goal * 6 + g[i] }\n  return 0 if start == goal\n  dist = Array.new(46656, -1)\n  dist[start] = 0\n  q = [start]\n  head = 0\n  while head < q.length\n    cur = q[head]\n    head += 1\n    a = Array.new(6, 0)\n    tmp = cur\n    5.downto(0) do |i|\n      a[i] = tmp % 6\n      tmp /= 6\n    end\n    z = 0\n    (0...6).each { |i| z = i if a[i] == 0 }\n    nbrs[z].each do |j|\n      b = a.dup\n      b[z] = b[j]\n      b[j] = 0\n      nv = 0\n      (0...6).each { |i| nv = nv * 6 + b[i] }\n      next if dist[nv] >= 0\n      dist[nv] = dist[cur] + 1\n      return dist[nv] if nv == goal\n      q << nv\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── The Maze II (LC 505) ────────────────────────────────────────
  (() => {
    const BIG = 1000000000;
    const ref = (maze: number[][], start: number[], destination: number[]) => {
      const m = maze.length, n = maze[0].length;
      const cells = m * n;
      const dist = new Array(cells).fill(BIG);
      const done = new Array(cells).fill(false);
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      dist[start[0] * n + start[1]] = 0;
      for (let it = 0; it < cells; it++) {
        let u = -1, best = BIG;
        for (let i = 0; i < cells; i++) {
          if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
        }
        if (u < 0) break;
        done[u] = true;
        const r = Math.floor(u / n), c = u % n;
        for (let d = 0; d < 4; d++) {
          let nr = r, nc = c, steps = 0;
          while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n
            && maze[nr + dr[d]][nc + dc[d]] === 0) {
            nr += dr[d];
            nc += dc[d];
            steps++;
          }
          const v = nr * n + nc;
          if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;
        }
      }
      const t = destination[0] * n + destination[1];
      return dist[t] >= BIG ? -1 : dist[t];
    };
    return {
      slug: "the-maze-ii",
      title: "The Maze II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Graph", "Breadth-First Search", "Shortest Path", "Google", "Amazon", "Facebook"],
      signature: { funcName: "shortestDistance", params: [{ name: "maze", type: "int[][]" as const }, { name: "start", type: "int[]" as const }, { name: "destination", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A ball rolls through a maze of empty spaces (`0`) and walls (`1`). When it starts rolling in one of the four directions it does **not stop until it hits a wall**; only then may it pick a new direction.\n\nGiven the ball's `start` and a `destination`, return the shortest distance the ball travels to stop at the destination, or `-1` if it can never stop there. Distance counts empty cells travelled, not including the starting cell.",
        [
          { in: "maze = [[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]], start = [0,4], destination = [4,4]", out: "12", note: "Left, down, left, down covers 12 cells." },
          { in: "maze = [[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]], start = [0,4], destination = [3,2]", out: "-1", note: "The ball rolls past that cell but never stops on it." },
          { in: "maze = [[0,0],[0,0]], start = [0,0], destination = [1,1]", out: "2" },
        ],
        ["m == maze.length", "n == maze[i].length", "1 <= m, n <= 100", "maze[i][j] is 0 or 1", "start.length == destination.length == 2", "0 <= start[0], destination[0] < m", "0 <= start[1], destination[1] < n", "Both the ball and the destination sit on an empty cell.", "The maze is surrounded by walls in the sense that the ball stops at the border."]),
      hints: [
        "The ball's stopping places are the nodes; one roll is one edge.",
        "That edge's weight is the number of cells rolled, which varies — so this is not plain breadth-first search.",
        "Dijkstra's algorithm over stopping places gives the shortest total distance.",
      ],
      editorial: explain({
        idea: "The graph's nodes are the cells the ball can come to rest on, and an edge is one full roll whose weight is its length. Because the weights differ, use Dijkstra's algorithm rather than BFS.",
        steps: [
          "Set every distance to infinity except the start, which is 0.",
          "Repeatedly take the unfinished cell with the smallest distance.",
          "For each of the four directions, roll until the next cell would be a wall or off the grid, counting steps.",
          "Relax the stopping cell with `dist[u] + steps`.",
        ],
        why: "Plain BFS is wrong here because it counts *rolls*, not cells: a route of two long rolls would beat a route of three short ones even when it travels further. Dijkstra's algorithm orders by accumulated distance instead, which is what the question asks for. Note the destination only counts if the ball **stops** there, so rolling through it is not an arrival.",
        time: "O((m · n)² ) with a linear scan, or O(m · n · log(m · n)) with a heap",
        space: "O(m · n)",
        pitfalls: [
          "Passing over the destination does not count; the ball must come to rest there.",
          "A roll of length 0 happens when a wall is immediately adjacent; it relaxes nothing new.",
          "Treating every roll as cost 1 answers a different question.",
        ],
      }),
      examples: [
        { input: "[[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]]\n[0,4]\n[4,4]", expectedOutput: "12" },
        { input: "[[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]]\n[0,4]\n[3,2]", expectedOutput: "-1" },
        { input: "[[0,0],[0,0]]\n[0,0]\n[1,1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const maze = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.25 ? 1 : 0)));
        const a = ri(rng, 0, m - 1), b = ri(rng, 0, n - 1);
        const c = ri(rng, 0, m - 1), d = ri(rng, 0, n - 1);
        // Both endpoints must sit on an empty cell, as the statement promises.
        maze[a][b] = 0;
        maze[c][d] = 0;
        return {
          input: `${fmtIntMat(maze)}\n${fmtIntArr([a, b])}\n${fmtIntArr([c, d])}`,
          expectedOutput: String(ref(maze, [a, b], [c, d])),
        };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef shortestDistance(maze: List[List[int]], start: List[int], destination: List[int]) -> int:\n    m, n = len(maze), len(maze[0])\n    BIG = float('inf')\n    dist = [[BIG] * n for _ in range(m)]\n    dist[start[0]][start[1]] = 0\n    heap = [(0, start[0], start[1])]\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    while heap:\n        d, r, c = heapq.heappop(heap)\n        if d > dist[r][c]:\n            continue\n        for di, dj in dirs:\n            nr, nc, steps = r, c, 0\n            while 0 <= nr + di < m and 0 <= nc + dj < n and maze[nr + di][nc + dj] == 0:\n                nr += di\n                nc += dj\n                steps += 1\n            if d + steps < dist[nr][nc]:\n                dist[nr][nc] = d + steps\n                heapq.heappush(heap, (d + steps, nr, nc))\n    best = dist[destination[0]][destination[1]]\n    return -1 if best == BIG else best`,
        javascript: `var shortestDistance = function(maze, start, destination) {\n    var BIG = 1000000000;\n    var m = maze.length, n = maze[0].length, i;\n    var cells = m * n;\n    var dist = [], done = [];\n    for (i = 0; i < cells; i++) { dist.push(BIG); done.push(false); }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[start[0] * n + start[1]] = 0;\n    for (var it = 0; it < cells; it++) {\n        var u = -1, best = BIG;\n        for (i = 0; i < cells; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        var r = Math.floor(u / n), c = u % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                && maze[nr + dr[d]][nc + dc[d]] === 0) {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            var v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    var t = destination[0] * n + destination[1];\n    return dist[t] >= BIG ? -1 : dist[t];\n};`,
        typescript: `function shortestDistance(maze: number[][], start: number[], destination: number[]): number {\n    var BIG = 1000000000;\n    var m = maze.length, n = maze[0].length, i: number;\n    var cells = m * n;\n    var dist: number[] = [], done: boolean[] = [];\n    for (i = 0; i < cells; i++) { dist.push(BIG); done.push(false); }\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[start[0] * n + start[1]] = 0;\n    for (var it = 0; it < cells; it++) {\n        var u = -1, best = BIG;\n        for (i = 0; i < cells; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        var r = Math.floor(u / n), c = u % n;\n        for (var d = 0; d < 4; d++) {\n            var nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                && maze[nr + dr[d]][nc + dc[d]] === 0) {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            var v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    var t = destination[0] * n + destination[1];\n    return dist[t] >= BIG ? -1 : dist[t];\n}`,
        java: `public static int shortestDistance(int[][] maze, int[] start, int[] destination) {\n    final int BIG = 1000000000;\n    int m = maze.length, n = maze[0].length;\n    int cells = m * n;\n    int[] dist = new int[cells];\n    boolean[] done = new boolean[cells];\n    Arrays.fill(dist, BIG);\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    dist[start[0] * n + start[1]] = 0;\n    for (int it = 0; it < cells; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < cells; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        int r = u / n, c = u % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                    && maze[nr + dr[d]][nc + dc[d]] == 0) {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            int v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    int t = destination[0] * n + destination[1];\n    return dist[t] >= BIG ? -1 : dist[t];\n}`,
        cpp: `int shortestDistance(vector<vector<int>>& maze, vector<int>& start, vector<int>& destination) {\n    const int BIG = 1000000000;\n    int m = (int) maze.size(), n = (int) maze[0].size();\n    int cells = m * n;\n    vector<int> dist(cells, BIG);\n    vector<char> done(cells, 0);\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    dist[start[0] * n + start[1]] = 0;\n    for (int it = 0; it < cells; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < cells; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        int r = u / n, c = u % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                    && maze[nr + dr[d]][nc + dc[d]] == 0) {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            int v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    int t = destination[0] * n + destination[1];\n    return dist[t] >= BIG ? -1 : dist[t];\n}`,
        c: `int shortestDistance(int** maze, int mazeSize, int* mazeColSize, int* start, int startSize, int* destination, int destinationSize) {\n    (void) startSize;\n    (void) destinationSize;\n    const int BIG = 1000000000;\n    int m = mazeSize, n = mazeColSize[0];\n    int cells = m * n;\n    int* dist = (int*) malloc((size_t) cells * sizeof(int));\n    char* done = (char*) calloc((size_t) cells, 1);\n    for (int i = 0; i < cells; i++) dist[i] = BIG;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    dist[start[0] * n + start[1]] = 0;\n    for (int it = 0; it < cells; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < cells; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        int r = u / n, c = u % n;\n        for (int d = 0; d < 4; d++) {\n            int nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                    && maze[nr + dr[d]][nc + dc[d]] == 0) {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            int v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    int t = destination[0] * n + destination[1];\n    int ans = dist[t] >= BIG ? -1 : dist[t];\n    free(dist);\n    free(done);\n    return ans;\n}`,
        csharp: `public static int ShortestDistance(int[][] maze, int[] start, int[] destination)\n{\n    const int BIG = 1000000000;\n    int m = maze.Length, n = maze[0].Length;\n    int cells = m * n;\n    var dist = new int[cells];\n    var done = new bool[cells];\n    for (int i = 0; i < cells; i++) dist[i] = BIG;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    dist[start[0] * n + start[1]] = 0;\n    for (int it = 0; it < cells; it++)\n    {\n        int u = -1, best = BIG;\n        for (int i = 0; i < cells; i++)\n        {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        int r = u / n, c = u % n;\n        for (int d = 0; d < 4; d++)\n        {\n            int nr = r, nc = c, steps = 0;\n            while (nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                    && maze[nr + dr[d]][nc + dc[d]] == 0)\n            {\n                nr += dr[d];\n                nc += dc[d];\n                steps++;\n            }\n            int v = nr * n + nc;\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps;\n        }\n    }\n    int t = destination[0] * n + destination[1];\n    return dist[t] >= BIG ? -1 : dist[t];\n}`,
        go: `func shortestDistance(maze [][]int, start []int, destination []int) int {\n\tconst BIG = 1000000000\n\tm, n := len(maze), len(maze[0])\n\tcells := m * n\n\tdist := make([]int, cells)\n\tdone := make([]bool, cells)\n\tfor i := range dist {\n\t\tdist[i] = BIG\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tdist[start[0]*n+start[1]] = 0\n\tfor it := 0; it < cells; it++ {\n\t\tu, best := -1, BIG\n\t\tfor i := 0; i < cells; i++ {\n\t\t\tif !done[i] && dist[i] < best {\n\t\t\t\tbest = dist[i]\n\t\t\t\tu = i\n\t\t\t}\n\t\t}\n\t\tif u < 0 {\n\t\t\tbreak\n\t\t}\n\t\tdone[u] = true\n\t\tr, c := u/n, u%n\n\t\tfor d := 0; d < 4; d++ {\n\t\t\tnr, nc, steps := r, c, 0\n\t\t\tfor nr+dr[d] >= 0 && nr+dr[d] < m && nc+dc[d] >= 0 && nc+dc[d] < n && maze[nr+dr[d]][nc+dc[d]] == 0 {\n\t\t\t\tnr += dr[d]\n\t\t\t\tnc += dc[d]\n\t\t\t\tsteps++\n\t\t\t}\n\t\t\tv := nr*n + nc\n\t\t\tif dist[u]+steps < dist[v] {\n\t\t\t\tdist[v] = dist[u] + steps\n\t\t\t}\n\t\t}\n\t}\n\tt := destination[0]*n + destination[1]\n\tif dist[t] >= BIG {\n\t\treturn -1\n\t}\n\treturn dist[t]\n}`,
        kotlin: `fun shortestDistance(maze: Array<IntArray>, start: IntArray, destination: IntArray): Int {\n    val BIG = 1000000000\n    val m = maze.size\n    val n = maze[0].size\n    val cells = m * n\n    val dist = IntArray(cells) { BIG }\n    val done = BooleanArray(cells)\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    dist[start[0] * n + start[1]] = 0\n    for (it2 in 0 until cells) {\n        var u = -1\n        var best = BIG\n        for (i in 0 until cells) {\n            if (!done[i] && dist[i] < best) {\n                best = dist[i]\n                u = i\n            }\n        }\n        if (u < 0) break\n        done[u] = true\n        val r = u / n\n        val c = u % n\n        for (d in 0 until 4) {\n            var nr = r\n            var nc = c\n            var steps = 0\n            while (nr + dr[d] in 0 until m && nc + dc[d] in 0 until n && maze[nr + dr[d]][nc + dc[d]] == 0) {\n                nr += dr[d]\n                nc += dc[d]\n                steps++\n            }\n            val v = nr * n + nc\n            if (dist[u] + steps < dist[v]) dist[v] = dist[u] + steps\n        }\n    }\n    val t = destination[0] * n + destination[1]\n    return if (dist[t] >= BIG) -1 else dist[t]\n}`,
        swift: `func shortestDistance(_ maze: [[Int]], _ start: [Int], _ destination: [Int]) -> Int {\n    let BIG = 1000000000\n    let m = maze.count\n    let n = maze[0].count\n    let cells = m * n\n    var dist = [Int](repeating: BIG, count: cells)\n    var done = [Bool](repeating: false, count: cells)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    dist[start[0] * n + start[1]] = 0\n    for _ in 0..<cells {\n        var u = -1\n        var best = BIG\n        for i in 0..<cells where !done[i] && dist[i] < best {\n            best = dist[i]\n            u = i\n        }\n        if u < 0 { break }\n        done[u] = true\n        let r = u / n, c = u % n\n        for d in 0..<4 {\n            var nr = r, nc = c, steps = 0\n            while nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n\n                && maze[nr + dr[d]][nc + dc[d]] == 0 {\n                nr += dr[d]\n                nc += dc[d]\n                steps += 1\n            }\n            let v = nr * n + nc\n            if dist[u] + steps < dist[v] { dist[v] = dist[u] + steps }\n        }\n    }\n    let t = destination[0] * n + destination[1]\n    return dist[t] >= BIG ? -1 : dist[t]\n}`,
        rust: `fn shortestDistance(maze: Vec<Vec<i32>>, start: Vec<i32>, destination: Vec<i32>) -> i32 {\n    const BIG: i32 = 1000000000;\n    let m = maze.len() as i32;\n    let n = maze[0].len() as i32;\n    let cells = (m * n) as usize;\n    let mut dist = vec![BIG; cells];\n    let mut done = vec![false; cells];\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    dist[(start[0] * n + start[1]) as usize] = 0;\n    for _ in 0..cells {\n        let mut u: i32 = -1;\n        let mut best = BIG;\n        for i in 0..cells {\n            if !done[i] && dist[i] < best {\n                best = dist[i];\n                u = i as i32;\n            }\n        }\n        if u < 0 {\n            break;\n        }\n        let ui = u as usize;\n        done[ui] = true;\n        let r = u / n;\n        let c = u % n;\n        for d in 0..4 {\n            let mut nr = r;\n            let mut nc = c;\n            let mut steps = 0i32;\n            while nr + dr[d] >= 0\n                && nr + dr[d] < m\n                && nc + dc[d] >= 0\n                && nc + dc[d] < n\n                && maze[(nr + dr[d]) as usize][(nc + dc[d]) as usize] == 0\n            {\n                nr += dr[d];\n                nc += dc[d];\n                steps += 1;\n            }\n            let v = (nr * n + nc) as usize;\n            if dist[ui] + steps < dist[v] {\n                dist[v] = dist[ui] + steps;\n            }\n        }\n    }\n    let t = (destination[0] * n + destination[1]) as usize;\n    if dist[t] >= BIG {\n        -1\n    } else {\n        dist[t]\n    }\n}`,
        php: `function shortestDistance($maze, $start, $destination) {\n    $BIG = 1000000000;\n    $m = count($maze);\n    $n = count($maze[0]);\n    $cells = $m * $n;\n    $dist = array_fill(0, $cells, $BIG);\n    $done = array_fill(0, $cells, false);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $dist[$start[0] * $n + $start[1]] = 0;\n    for ($it = 0; $it < $cells; $it++) {\n        $u = -1;\n        $best = $BIG;\n        for ($i = 0; $i < $cells; $i++) {\n            if (!$done[$i] && $dist[$i] < $best) { $best = $dist[$i]; $u = $i; }\n        }\n        if ($u < 0) break;\n        $done[$u] = true;\n        $r = intdiv($u, $n);\n        $c = $u % $n;\n        for ($d = 0; $d < 4; $d++) {\n            $nr = $r; $nc = $c; $steps = 0;\n            while ($nr + $dr[$d] >= 0 && $nr + $dr[$d] < $m && $nc + $dc[$d] >= 0 && $nc + $dc[$d] < $n\n                && $maze[$nr + $dr[$d]][$nc + $dc[$d]] === 0) {\n                $nr += $dr[$d];\n                $nc += $dc[$d];\n                $steps++;\n            }\n            $v = $nr * $n + $nc;\n            if ($dist[$u] + $steps < $dist[$v]) $dist[$v] = $dist[$u] + $steps;\n        }\n    }\n    $t = $destination[0] * $n + $destination[1];\n    return $dist[$t] >= $BIG ? -1 : $dist[$t];\n}`,
        ruby: `def shortestDistance(maze, start, destination)\n  big = 1000000000\n  m = maze.length\n  n = maze[0].length\n  cells = m * n\n  dist = Array.new(cells, big)\n  done = Array.new(cells, false)\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  dist[start[0] * n + start[1]] = 0\n  cells.times do\n    u = -1\n    best = big\n    (0...cells).each do |i|\n      if !done[i] && dist[i] < best\n        best = dist[i]\n        u = i\n      end\n    end\n    break if u < 0\n    done[u] = true\n    r = u / n\n    c = u % n\n    (0...4).each do |d|\n      nr = r\n      nc = c\n      steps = 0\n      while nr + dr[d] >= 0 && nr + dr[d] < m && nc + dc[d] >= 0 && nc + dc[d] < n &&\n            maze[nr + dr[d]][nc + dc[d]] == 0\n        nr += dr[d]\n        nc += dc[d]\n        steps += 1\n      end\n      v = nr * n + nc\n      dist[v] = dist[u] + steps if dist[u] + steps < dist[v]\n    end\n  end\n  t = destination[0] * n + destination[1]\n  dist[t] >= big ? -1 : dist[t]\nend`,
      },
    };
  })(),

  // ── Detonate the Maximum Bombs (LC 2101) ────────────────────────
  (() => {
    const ref = (bombs: number[][]) => {
      const n = bombs.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = bombs[i][0] - bombs[j][0];
          const dy = bombs[i][1] - bombs[j][1];
          const r = bombs[i][2];
          if (dx * dx + dy * dy <= r * r) adj[i].push(j);
        }
      }
      let best = 0;
      for (let s = 0; s < n; s++) {
        const seen = new Array(n).fill(false);
        seen[s] = true;
        const stack = [s];
        let count = 0;
        while (stack.length > 0) {
          const u = stack.pop() as number;
          count++;
          for (let k = 0; k < adj[u].length; k++) {
            const v = adj[u][k];
            if (seen[v]) continue;
            seen[v] = true;
            stack.push(v);
          }
        }
        if (count > best) best = count;
      }
      return best;
    };
    return {
      slug: "detonate-the-maximum-bombs",
      title: "Detonate the Maximum Bombs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Graph", "Depth-First Search", "Breadth-First Search", "Geometry", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maximumDetonation", params: [{ name: "bombs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`bombs[i] = [x, y, r]` places a bomb at `(x, y)` whose blast is a circle of radius `r`. Detonating a bomb sets off every bomb **whose centre lies inside or on** its blast circle, and those set off more in turn.\n\nYou may detonate exactly one bomb by hand. Return the maximum number of bombs that can go off.",
        [
          { in: "bombs = [[2,1,3],[6,1,4]]", out: "2", note: "Bomb 1's range reaches bomb 0, but not the other way round." },
          { in: "bombs = [[1,1,5],[10,10,5]]", out: "1", note: "Neither reaches the other." },
          { in: "bombs = [[1,2,3],[2,3,1],[3,4,2],[4,5,3],[5,6,4]]", out: "5" },
        ],
        ["1 <= bombs.length <= 100", "bombs[i].length == 3", "1 <= x, y, r <= 10^4"]),
      hints: [
        "\"Bomb `i` sets off bomb `j`\" is a **directed** relation — reach is not symmetric when the radii differ.",
        "Build that directed graph, then the answer is the largest set reachable from a single node.",
        "Compare squared distances so no square root is needed.",
      ],
      editorial: explain({
        idea: "Draw a directed edge `i → j` when `j`'s centre is within `i`'s radius. The answer is the size of the largest reachable set from any single starting node, found by running a traversal from each bomb.",
        steps: [
          "For each ordered pair, add the edge when `dx² + dy² <= r_i²`.",
          "From each bomb, run a depth-first or breadth-first search and count what it reaches.",
          "Return the largest count.",
        ],
        why: "The relation is directed, which is the whole trap: a big bomb can trigger a small one without the reverse being true, so connected components are the wrong tool and each start must be explored separately. Squaring both sides keeps the comparison in exact integers — with `x, y, r <= 10^4` the largest value is `2 · (10^4)²`, comfortably inside a 32-bit int.",
        time: "O(n³) in the worst case — `n` traversals over `n²` edges",
        space: "O(n²)",
        pitfalls: [
          "Treating the reach as symmetric collapses the graph and over-counts.",
          "Using `sqrt` invites floating-point error at the boundary; compare squares.",
          "A bomb inside its own radius is not an extra bomb; skip `i == j`.",
        ],
      }),
      examples: [
        { input: "[[2,1,3],[6,1,4]]", expectedOutput: "2" },
        { input: "[[1,1,5],[10,10,5]]", expectedOutput: "1" },
        { input: "[[1,2,3],[2,3,1],[3,4,2],[4,5,3],[5,6,4]]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const span = pick(rng, [6, 12, 30]);
        const bombs = Array.from({ length: n }, () => [ri(rng, 1, span), ri(rng, 1, span), ri(rng, 1, Math.max(1, Math.floor(span / 2)))]);
        return { input: fmtIntMat(bombs), expectedOutput: String(ref(bombs)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumDetonation(bombs: List[List[int]]) -> int:\n    n = len(bombs)\n    adj = [[] for _ in range(n)]\n    for i in range(n):\n        xi, yi, ri = bombs[i]\n        for j in range(n):\n            if i == j:\n                continue\n            dx = xi - bombs[j][0]\n            dy = yi - bombs[j][1]\n            if dx * dx + dy * dy <= ri * ri:\n                adj[i].append(j)\n    best = 0\n    for s in range(n):\n        seen = [False] * n\n        seen[s] = True\n        stack = [s]\n        count = 0\n        while stack:\n            u = stack.pop()\n            count += 1\n            for v in adj[u]:\n                if seen[v]:\n                    continue\n                seen[v] = True\n                stack.append(v)\n        best = max(best, count)\n    return best`,
        javascript: `var maximumDetonation = function(bombs) {\n    var n = bombs.length, i, j;\n    var adj = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (i === j) continue;\n            var dx = bombs[i][0] - bombs[j][0];\n            var dy = bombs[i][1] - bombs[j][1];\n            var r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) adj[i].push(j);\n        }\n    }\n    var best = 0;\n    for (var s = 0; s < n; s++) {\n        var seen = [];\n        for (i = 0; i < n; i++) seen.push(false);\n        seen[s] = true;\n        var stack = [s];\n        var count = 0;\n        while (stack.length > 0) {\n            var u = stack.pop();\n            count++;\n            for (i = 0; i < adj[u].length; i++) {\n                var v = adj[u][i];\n                if (seen[v]) continue;\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        if (count > best) best = count;\n    }\n    return best;\n};`,
        typescript: `function maximumDetonation(bombs: number[][]): number {\n    var n = bombs.length, i: number, j: number;\n    var adj: number[][] = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (i === j) continue;\n            var dx = bombs[i][0] - bombs[j][0];\n            var dy = bombs[i][1] - bombs[j][1];\n            var r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) adj[i].push(j);\n        }\n    }\n    var best = 0;\n    for (var s = 0; s < n; s++) {\n        var seen: boolean[] = [];\n        for (i = 0; i < n; i++) seen.push(false);\n        seen[s] = true;\n        var stack: number[] = [s];\n        var count = 0;\n        while (stack.length > 0) {\n            var u = stack.pop() as number;\n            count++;\n            for (i = 0; i < adj[u].length; i++) {\n                var v = adj[u][i];\n                if (seen[v]) continue;\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        if (count > best) best = count;\n    }\n    return best;\n}`,
        java: `public static int maximumDetonation(int[][] bombs) {\n    int n = bombs.length;\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            long dx = bombs[i][0] - bombs[j][0];\n            long dy = bombs[i][1] - bombs[j][1];\n            long r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) adj.get(i).add(j);\n        }\n    }\n    int best = 0;\n    int[] stack = new int[n];\n    for (int s = 0; s < n; s++) {\n        boolean[] seen = new boolean[n];\n        seen[s] = true;\n        int top = 0, count = 0;\n        stack[top++] = s;\n        while (top > 0) {\n            int u = stack[--top];\n            count++;\n            for (int v : adj.get(u)) {\n                if (seen[v]) continue;\n                seen[v] = true;\n                stack[top++] = v;\n            }\n        }\n        best = Math.max(best, count);\n    }\n    return best;\n}`,
        cpp: `int maximumDetonation(vector<vector<int>>& bombs) {\n    int n = (int) bombs.size();\n    vector<vector<int>> adj(n);\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            long long dx = bombs[i][0] - bombs[j][0];\n            long long dy = bombs[i][1] - bombs[j][1];\n            long long r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) adj[i].push_back(j);\n        }\n    }\n    int best = 0;\n    for (int s = 0; s < n; s++) {\n        vector<char> seen(n, 0);\n        seen[s] = 1;\n        vector<int> stack = { s };\n        int count = 0;\n        while (!stack.empty()) {\n            int u = stack.back();\n            stack.pop_back();\n            count++;\n            for (int v : adj[u]) {\n                if (seen[v]) continue;\n                seen[v] = 1;\n                stack.push_back(v);\n            }\n        }\n        best = max(best, count);\n    }\n    return best;\n}`,
        c: `int maximumDetonation(int** bombs, int bombsSize, int* bombsColSize) {\n    (void) bombsColSize;\n    int n = bombsSize;\n    char* edge = (char*) calloc((size_t) n * (size_t) n, 1);\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            long long dx = bombs[i][0] - bombs[j][0];\n            long long dy = bombs[i][1] - bombs[j][1];\n            long long r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) edge[i * n + j] = 1;\n        }\n    }\n    char* seen = (char*) malloc((size_t) n);\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    int best = 0;\n    for (int s = 0; s < n; s++) {\n        for (int i = 0; i < n; i++) seen[i] = 0;\n        seen[s] = 1;\n        int top = 0, count = 0;\n        stack[top++] = s;\n        while (top > 0) {\n            int u = stack[--top];\n            count++;\n            for (int v = 0; v < n; v++) {\n                if (!edge[u * n + v] || seen[v]) continue;\n                seen[v] = 1;\n                stack[top++] = v;\n            }\n        }\n        if (count > best) best = count;\n    }\n    free(edge);\n    free(seen);\n    free(stack);\n    return best;\n}`,
        csharp: `public static int MaximumDetonation(int[][] bombs)\n{\n    int n = bombs.Length;\n    var adj = new List<int>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (i == j) continue;\n            long dx = bombs[i][0] - bombs[j][0];\n            long dy = bombs[i][1] - bombs[j][1];\n            long r = bombs[i][2];\n            if (dx * dx + dy * dy <= r * r) adj[i].Add(j);\n        }\n    }\n    int best = 0;\n    var stack = new int[n];\n    for (int s = 0; s < n; s++)\n    {\n        var seen = new bool[n];\n        seen[s] = true;\n        int top = 0, count = 0;\n        stack[top++] = s;\n        while (top > 0)\n        {\n            int u = stack[--top];\n            count++;\n            foreach (var v in adj[u])\n            {\n                if (seen[v]) continue;\n                seen[v] = true;\n                stack[top++] = v;\n            }\n        }\n        best = Math.Max(best, count);\n    }\n    return best;\n}`,
        go: `func maximumDetonation(bombs [][]int) int {\n\tn := len(bombs)\n\tadj := make([][]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif i == j {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdx := bombs[i][0] - bombs[j][0]\n\t\t\tdy := bombs[i][1] - bombs[j][1]\n\t\t\tr := bombs[i][2]\n\t\t\tif dx*dx+dy*dy <= r*r {\n\t\t\t\tadj[i] = append(adj[i], j)\n\t\t\t}\n\t\t}\n\t}\n\tbest := 0\n\tfor s := 0; s < n; s++ {\n\t\tseen := make([]bool, n)\n\t\tseen[s] = true\n\t\tstack := []int{s}\n\t\tcount := 0\n\t\tfor len(stack) > 0 {\n\t\t\tu := stack[len(stack)-1]\n\t\t\tstack = stack[:len(stack)-1]\n\t\t\tcount++\n\t\t\tfor _, v := range adj[u] {\n\t\t\t\tif seen[v] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tseen[v] = true\n\t\t\t\tstack = append(stack, v)\n\t\t\t}\n\t\t}\n\t\tif count > best {\n\t\t\tbest = count\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumDetonation(bombs: Array<IntArray>): Int {\n    val n = bombs.size\n    val adj = Array(n) { ArrayList<Int>() }\n    for (i in 0 until n) {\n        for (j in 0 until n) {\n            if (i == j) continue\n            val dx = (bombs[i][0] - bombs[j][0]).toLong()\n            val dy = (bombs[i][1] - bombs[j][1]).toLong()\n            val r = bombs[i][2].toLong()\n            if (dx * dx + dy * dy <= r * r) adj[i].add(j)\n        }\n    }\n    var best = 0\n    val stack = IntArray(n)\n    for (s in 0 until n) {\n        val seen = BooleanArray(n)\n        seen[s] = true\n        var top = 0\n        var count = 0\n        stack[top++] = s\n        while (top > 0) {\n            val u = stack[--top]\n            count++\n            for (v in adj[u]) {\n                if (seen[v]) continue\n                seen[v] = true\n                stack[top++] = v\n            }\n        }\n        if (count > best) best = count\n    }\n    return best\n}`,
        swift: `func maximumDetonation(_ bombs: [[Int]]) -> Int {\n    let n = bombs.count\n    var adj = [[Int]](repeating: [], count: n)\n    for i in 0..<n {\n        for j in 0..<n where i != j {\n            let dx = bombs[i][0] - bombs[j][0]\n            let dy = bombs[i][1] - bombs[j][1]\n            let r = bombs[i][2]\n            if dx * dx + dy * dy <= r * r { adj[i].append(j) }\n        }\n    }\n    var best = 0\n    for s in 0..<n {\n        var seen = [Bool](repeating: false, count: n)\n        seen[s] = true\n        var stack = [s]\n        var count = 0\n        while let u = stack.popLast() {\n            count += 1\n            for v in adj[u] {\n                if seen[v] { continue }\n                seen[v] = true\n                stack.append(v)\n            }\n        }\n        best = max(best, count)\n    }\n    return best\n}`,
        rust: `fn maximumDetonation(bombs: Vec<Vec<i32>>) -> i32 {\n    let n = bombs.len();\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    for i in 0..n {\n        for j in 0..n {\n            if i == j {\n                continue;\n            }\n            let dx = (bombs[i][0] - bombs[j][0]) as i64;\n            let dy = (bombs[i][1] - bombs[j][1]) as i64;\n            let r = bombs[i][2] as i64;\n            if dx * dx + dy * dy <= r * r {\n                adj[i].push(j);\n            }\n        }\n    }\n    let mut best = 0i32;\n    for s in 0..n {\n        let mut seen = vec![false; n];\n        seen[s] = true;\n        let mut stack = vec![s];\n        let mut count = 0i32;\n        while let Some(u) = stack.pop() {\n            count += 1;\n            for idx in 0..adj[u].len() {\n                let v = adj[u][idx];\n                if seen[v] {\n                    continue;\n                }\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        if count > best {\n            best = count;\n        }\n    }\n    best\n}`,
        php: `function maximumDetonation($bombs) {\n    $n = count($bombs);\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($i === $j) continue;\n            $dx = $bombs[$i][0] - $bombs[$j][0];\n            $dy = $bombs[$i][1] - $bombs[$j][1];\n            $r = $bombs[$i][2];\n            if ($dx * $dx + $dy * $dy <= $r * $r) $adj[$i][] = $j;\n        }\n    }\n    $best = 0;\n    for ($s = 0; $s < $n; $s++) {\n        $seen = array_fill(0, $n, false);\n        $seen[$s] = true;\n        $stack = [$s];\n        $count = 0;\n        while (count($stack) > 0) {\n            $u = array_pop($stack);\n            $count++;\n            foreach ($adj[$u] as $v) {\n                if ($seen[$v]) continue;\n                $seen[$v] = true;\n                $stack[] = $v;\n            }\n        }\n        if ($count > $best) $best = $count;\n    }\n    return $best;\n}`,
        ruby: `def maximumDetonation(bombs)\n  n = bombs.length\n  adj = Array.new(n) { [] }\n  (0...n).each do |i|\n    (0...n).each do |j|\n      next if i == j\n      dx = bombs[i][0] - bombs[j][0]\n      dy = bombs[i][1] - bombs[j][1]\n      r = bombs[i][2]\n      adj[i] << j if dx * dx + dy * dy <= r * r\n    end\n  end\n  best = 0\n  (0...n).each do |s|\n    seen = Array.new(n, false)\n    seen[s] = true\n    stack = [s]\n    count = 0\n    until stack.empty?\n      u = stack.pop\n      count += 1\n      adj[u].each do |v|\n        next if seen[v]\n        seen[v] = true\n        stack << v\n      end\n    end\n    best = count if count > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Parallel Courses (LC 1136) ──────────────────────────────────
  (() => {
    const ref = (n: number, relations: number[][]) => {
      const adj: number[][] = Array.from({ length: n + 1 }, () => []);
      const indeg = new Array(n + 1).fill(0);
      for (let i = 0; i < relations.length; i++) {
        adj[relations[i][0]].push(relations[i][1]);
        indeg[relations[i][1]]++;
      }
      let q: number[] = [];
      for (let i = 1; i <= n; i++) if (indeg[i] === 0) q.push(i);
      let taken = 0, sem = 0;
      while (q.length > 0) {
        sem++;
        const nq: number[] = [];
        for (let k = 0; k < q.length; k++) {
          const u = q[k];
          taken++;
          for (let t = 0; t < adj[u].length; t++) {
            const v = adj[u][t];
            indeg[v]--;
            if (indeg[v] === 0) nq.push(v);
          }
        }
        q = nq;
      }
      return taken === n ? sem : -1;
    };
    return {
      slug: "parallel-courses",
      title: "Parallel Courses",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Topological Sort", "Breadth-First Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minimumSemesters", params: [{ name: "n", type: "int" as const }, { name: "relations", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` courses numbered `1 … n`. `relations[i] = [prev, next]` means course `prev` must be taken before course `next`.\n\nIn one semester you may take **any number** of courses, as long as every prerequisite of each was taken in an earlier semester. Return the minimum number of semesters needed to take all `n` courses, or `-1` if that is impossible.",
        [
          { in: "n = 3, relations = [[1,3],[2,3]]", out: "2", note: "Take courses 1 and 2 together, then course 3." },
          { in: "n = 3, relations = [[1,2],[2,3],[3,1]]", out: "-1", note: "The prerequisites form a cycle." },
          { in: "n = 4, relations = []", out: "1", note: "Everything can be taken at once." },
        ],
        ["1 <= n <= 5000", "1 <= relations.length <= 5000", "relations[i].length == 2", "1 <= prev, next <= n", "prev != next", "All the pairs are unique."]),
      hints: [
        "Because a semester holds any number of courses, take **everything** whose prerequisites are done.",
        "That is a topological sort processed one whole layer at a time.",
        "If some course is never freed, the prerequisites contain a cycle.",
      ],
      editorial: explain({
        idea: "Run Kahn's algorithm, but peel a whole layer per round. The number of rounds is the number of semesters; if fewer than `n` courses are ever taken, a cycle blocks the rest.",
        steps: [
          "Count in-degrees and queue every course with none.",
          "Each round, take the entire current queue as one semester and decrement its successors' in-degrees.",
          "Courses reaching in-degree 0 form the next round's queue.",
          "Return the round count if all `n` courses were taken, and `-1` otherwise.",
        ],
        why: "Taking every available course immediately is optimal because a course can never be a reason to *delay* another — courses are free and unlimited, so there is no trade-off to weigh. That makes the layered peel a lower bound as well as achievable, and the layer number of a course is the length of its longest prerequisite chain.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Courses are numbered from 1; size the arrays accordingly.",
          "A cycle shows as a shortfall in the taken count, not as an error during the sweep.",
          "Peeling one course at a time counts courses, not semesters.",
        ],
      }),
      examples: [
        { input: "3\n[[1,3],[2,3]]", expectedOutput: "2" },
        { input: "3\n[[1,2],[2,3],[3,1]]", expectedOutput: "-1" },
        { input: "4\n[]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const seen = new Set<number>();
        const relations: number[][] = [];
        // Half the cases are oriented along a ranking (acyclic); the rest are
        // free-for-all, so the -1 branch shows up too.
        const acyclic = rng() < 0.5;
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const count = ri(rng, 0, 10);
        for (let k = 0; k < count; k++) {
          let a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          if (a === b) continue;
          if (acyclic && a > b) { const t = a; a = b; b = t; }
          const u = order[a], v = order[b];
          const key = u * (n + 1) + v;
          if (seen.has(key)) continue;
          seen.add(key);
          relations.push([u, v]);
        }
        return { input: `${n}\n${fmtIntMat(relations)}`, expectedOutput: String(ref(n, relations)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumSemesters(n: int, relations: List[List[int]]) -> int:\n    adj = [[] for _ in range(n + 1)]\n    indeg = [0] * (n + 1)\n    for a, b in relations:\n        adj[a].append(b)\n        indeg[b] += 1\n    q = [i for i in range(1, n + 1) if indeg[i] == 0]\n    taken = 0\n    sem = 0\n    while q:\n        sem += 1\n        nq = []\n        for u in q:\n            taken += 1\n            for v in adj[u]:\n                indeg[v] -= 1\n                if indeg[v] == 0:\n                    nq.append(v)\n        q = nq\n    return sem if taken == n else -1`,
        javascript: `var minimumSemesters = function(n, relations) {\n    var i;\n    var adj = [], indeg = [];\n    for (i = 0; i <= n; i++) { adj.push([]); indeg.push(0); }\n    for (i = 0; i < relations.length; i++) {\n        adj[relations[i][0]].push(relations[i][1]);\n        indeg[relations[i][1]]++;\n    }\n    var q = [];\n    for (i = 1; i <= n; i++) if (indeg[i] === 0) q.push(i);\n    var taken = 0, sem = 0;\n    while (q.length > 0) {\n        sem++;\n        var nq = [];\n        for (var k = 0; k < q.length; k++) {\n            var u = q[k];\n            taken++;\n            for (var t = 0; t < adj[u].length; t++) {\n                var v = adj[u][t];\n                indeg[v]--;\n                if (indeg[v] === 0) nq.push(v);\n            }\n        }\n        q = nq;\n    }\n    return taken === n ? sem : -1;\n};`,
        typescript: `function minimumSemesters(n: number, relations: number[][]): number {\n    var i: number;\n    var adj: number[][] = [], indeg: number[] = [];\n    for (i = 0; i <= n; i++) { adj.push([]); indeg.push(0); }\n    for (i = 0; i < relations.length; i++) {\n        adj[relations[i][0]].push(relations[i][1]);\n        indeg[relations[i][1]]++;\n    }\n    var q: number[] = [];\n    for (i = 1; i <= n; i++) if (indeg[i] === 0) q.push(i);\n    var taken = 0, sem = 0;\n    while (q.length > 0) {\n        sem++;\n        var nq: number[] = [];\n        for (var k = 0; k < q.length; k++) {\n            var u = q[k];\n            taken++;\n            for (var t = 0; t < adj[u].length; t++) {\n                var v = adj[u][t];\n                indeg[v]--;\n                if (indeg[v] === 0) nq.push(v);\n            }\n        }\n        q = nq;\n    }\n    return taken === n ? sem : -1;\n}`,
        java: `public static int minimumSemesters(int n, int[][] relations) {\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());\n    int[] indeg = new int[n + 1];\n    for (int[] r : relations) {\n        adj.get(r[0]).add(r[1]);\n        indeg[r[1]]++;\n    }\n    List<Integer> q = new ArrayList<>();\n    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.add(i);\n    int taken = 0, sem = 0;\n    while (!q.isEmpty()) {\n        sem++;\n        List<Integer> nq = new ArrayList<>();\n        for (int u : q) {\n            taken++;\n            for (int v : adj.get(u)) {\n                if (--indeg[v] == 0) nq.add(v);\n            }\n        }\n        q = nq;\n    }\n    return taken == n ? sem : -1;\n}`,
        cpp: `int minimumSemesters(int n, vector<vector<int>>& relations) {\n    vector<vector<int>> adj(n + 1);\n    vector<int> indeg(n + 1, 0);\n    for (auto& r : relations) {\n        adj[r[0]].push_back(r[1]);\n        indeg[r[1]]++;\n    }\n    vector<int> q;\n    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push_back(i);\n    int taken = 0, sem = 0;\n    while (!q.empty()) {\n        sem++;\n        vector<int> nq;\n        for (int u : q) {\n            taken++;\n            for (int v : adj[u]) {\n                if (--indeg[v] == 0) nq.push_back(v);\n            }\n        }\n        q = nq;\n    }\n    return taken == n ? sem : -1;\n}`,
        c: `int minimumSemesters(int n, int** relations, int relationsSize, int* relationsColSize) {\n    (void) relationsColSize;\n    int* head = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int i = 0; i <= n; i++) head[i] = -1;\n    int cap = relationsSize > 0 ? relationsSize : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int* indeg = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < relationsSize; i++) {\n        int a = relations[i][0], b = relations[i][1];\n        to[i] = b; nxt[i] = head[a]; head[a] = i;\n        indeg[b]++;\n    }\n    int* q = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int qh = 0, qt = 0;\n    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q[qt++] = i;\n    int taken = 0, sem = 0;\n    while (qh < qt) {\n        sem++;\n        int end = qt;\n        while (qh < end) {\n            int u = q[qh++];\n            taken++;\n            for (int e = head[u]; e >= 0; e = nxt[e]) {\n                int v = to[e];\n                if (--indeg[v] == 0) q[qt++] = v;\n            }\n        }\n    }\n    free(head); free(nxt); free(to); free(indeg); free(q);\n    return taken == n ? sem : -1;\n}`,
        csharp: `public static int MinimumSemesters(int n, int[][] relations)\n{\n    var adj = new List<int>[n + 1];\n    for (int i = 0; i <= n; i++) adj[i] = new List<int>();\n    var indeg = new int[n + 1];\n    foreach (var r in relations)\n    {\n        adj[r[0]].Add(r[1]);\n        indeg[r[1]]++;\n    }\n    var q = new List<int>();\n    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.Add(i);\n    int taken = 0, sem = 0;\n    while (q.Count > 0)\n    {\n        sem++;\n        var nq = new List<int>();\n        foreach (var u in q)\n        {\n            taken++;\n            foreach (var v in adj[u])\n            {\n                if (--indeg[v] == 0) nq.Add(v);\n            }\n        }\n        q = nq;\n    }\n    return taken == n ? sem : -1;\n}`,
        go: `func minimumSemesters(n int, relations [][]int) int {\n\tadj := make([][]int, n+1)\n\tindeg := make([]int, n+1)\n\tfor _, r := range relations {\n\t\tadj[r[0]] = append(adj[r[0]], r[1])\n\t\tindeg[r[1]]++\n\t}\n\tq := []int{}\n\tfor i := 1; i <= n; i++ {\n\t\tif indeg[i] == 0 {\n\t\t\tq = append(q, i)\n\t\t}\n\t}\n\ttaken, sem := 0, 0\n\tfor len(q) > 0 {\n\t\tsem++\n\t\tnq := []int{}\n\t\tfor _, u := range q {\n\t\t\ttaken++\n\t\t\tfor _, v := range adj[u] {\n\t\t\t\tindeg[v]--\n\t\t\t\tif indeg[v] == 0 {\n\t\t\t\t\tnq = append(nq, v)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tq = nq\n\t}\n\tif taken == n {\n\t\treturn sem\n\t}\n\treturn -1\n}`,
        kotlin: `fun minimumSemesters(n: Int, relations: Array<IntArray>): Int {\n    val adj = Array(n + 1) { ArrayList<Int>() }\n    val indeg = IntArray(n + 1)\n    for (r in relations) {\n        adj[r[0]].add(r[1])\n        indeg[r[1]]++\n    }\n    var q = ArrayList<Int>()\n    for (i in 1..n) if (indeg[i] == 0) q.add(i)\n    var taken = 0\n    var sem = 0\n    while (q.isNotEmpty()) {\n        sem++\n        val nq = ArrayList<Int>()\n        for (u in q) {\n            taken++\n            for (v in adj[u]) {\n                if (--indeg[v] == 0) nq.add(v)\n            }\n        }\n        q = nq\n    }\n    return if (taken == n) sem else -1\n}`,
        swift: `func minimumSemesters(_ n: Int, _ relations: [[Int]]) -> Int {\n    var adj = [[Int]](repeating: [], count: n + 1)\n    var indeg = [Int](repeating: 0, count: n + 1)\n    for r in relations {\n        adj[r[0]].append(r[1])\n        indeg[r[1]] += 1\n    }\n    var q = [Int]()\n    for i in 1...max(1, n) where i <= n && indeg[i] == 0 { q.append(i) }\n    var taken = 0\n    var sem = 0\n    while !q.isEmpty {\n        sem += 1\n        var nq = [Int]()\n        for u in q {\n            taken += 1\n            for v in adj[u] {\n                indeg[v] -= 1\n                if indeg[v] == 0 { nq.append(v) }\n            }\n        }\n        q = nq\n    }\n    return taken == n ? sem : -1\n}`,
        rust: `fn minimumSemesters(n: i32, relations: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n + 1];\n    let mut indeg = vec![0i32; n + 1];\n    for r in relations.iter() {\n        adj[r[0] as usize].push(r[1] as usize);\n        indeg[r[1] as usize] += 1;\n    }\n    let mut q: Vec<usize> = (1..=n).filter(|&i| indeg[i] == 0).collect();\n    let mut taken = 0usize;\n    let mut sem = 0i32;\n    while !q.is_empty() {\n        sem += 1;\n        let mut nq: Vec<usize> = Vec::new();\n        for &u in q.iter() {\n            taken += 1;\n            for idx in 0..adj[u].len() {\n                let v = adj[u][idx];\n                indeg[v] -= 1;\n                if indeg[v] == 0 {\n                    nq.push(v);\n                }\n            }\n        }\n        q = nq;\n    }\n    if taken == n {\n        sem\n    } else {\n        -1\n    }\n}`,
        php: `function minimumSemesters($n, $relations) {\n    $adj = [];\n    for ($i = 0; $i <= $n; $i++) $adj[$i] = [];\n    $indeg = array_fill(0, $n + 1, 0);\n    foreach ($relations as $r) {\n        $adj[$r[0]][] = $r[1];\n        $indeg[$r[1]]++;\n    }\n    $q = [];\n    for ($i = 1; $i <= $n; $i++) if ($indeg[$i] === 0) $q[] = $i;\n    $taken = 0;\n    $sem = 0;\n    while (count($q) > 0) {\n        $sem++;\n        $nq = [];\n        foreach ($q as $u) {\n            $taken++;\n            foreach ($adj[$u] as $v) {\n                $indeg[$v]--;\n                if ($indeg[$v] === 0) $nq[] = $v;\n            }\n        }\n        $q = $nq;\n    }\n    return $taken === $n ? $sem : -1;\n}`,
        ruby: `def minimumSemesters(n, relations)\n  adj = Array.new(n + 1) { [] }\n  indeg = Array.new(n + 1, 0)\n  relations.each do |a, b|\n    adj[a] << b\n    indeg[b] += 1\n  end\n  q = (1..n).select { |i| indeg[i] == 0 }\n  taken = 0\n  sem = 0\n  until q.empty?\n    sem += 1\n    nq = []\n    q.each do |u|\n      taken += 1\n      adj[u].each do |v|\n        indeg[v] -= 1\n        nq << v if indeg[v] == 0\n      end\n    end\n    q = nq\n  end\n  taken == n ? sem : -1\nend`,
      },
    };
  })(),

  // ── Course Schedule IV (LC 1462) ────────────────────────────────
  (() => {
    const ref = (numCourses: number, prerequisites: number[][], queries: number[][]) => {
      const reach = Array.from({ length: numCourses }, () => new Array(numCourses).fill(false));
      for (let i = 0; i < prerequisites.length; i++) {
        reach[prerequisites[i][0]][prerequisites[i][1]] = true;
      }
      for (let k = 0; k < numCourses; k++) {
        for (let i = 0; i < numCourses; i++) {
          if (!reach[i][k]) continue;
          for (let j = 0; j < numCourses; j++) {
            if (reach[k][j]) reach[i][j] = true;
          }
        }
      }
      const out: number[] = [];
      for (let i = 0; i < queries.length; i++) {
        out.push(reach[queries[i][0]][queries[i][1]] ? 1 : 0);
      }
      return out;
    };
    return {
      slug: "course-schedule-iv",
      title: "Course Schedule IV",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Topological Sort", "Depth-First Search", "Breadth-First Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "checkIfPrerequisite", params: [{ name: "numCourses", type: "int" as const }, { name: "prerequisites", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "`numCourses` courses are numbered `0 … numCourses - 1`, and `prerequisites[i] = [a, b]` means `a` must be taken before `b`.\n\nPrerequisites are **transitive**: if `a` comes before `b` and `b` before `c`, then `a` comes before `c`. For each `queries[j] = [u, v]`, answer `1` if `u` is a prerequisite of `v` and `0` otherwise.",
        [
          { in: "numCourses = 2, prerequisites = [[1,0]], queries = [[0,1],[1,0]]", out: "[0,1]", note: "Course 1 comes before course 0, not the other way round." },
          { in: "numCourses = 2, prerequisites = [], queries = [[1,0],[0,1]]", out: "[0,0]", note: "No prerequisites at all." },
          { in: "numCourses = 3, prerequisites = [[1,2],[1,0],[2,0]], queries = [[1,0],[1,2]]", out: "[1,1]" },
        ],
        ["2 <= numCourses <= 100", "0 <= prerequisites.length <= numCourses * (numCourses - 1) / 2", "prerequisites[i].length == 2", "0 <= a, b < numCourses", "a != b", "All the pairs of prerequisites are unique.", "The prerequisites graph has no cycles.", "1 <= queries.length <= 10^4", "0 <= u, v < numCourses", "u != v"]),
      hints: [
        "The queries ask about **reachability**, not direct edges.",
        "With at most 100 courses, the whole reachability matrix fits easily.",
        "Compute the transitive closure once, then answer every query in O(1).",
      ],
      editorial: explain({
        idea: "Build the `numCourses × numCourses` reachability matrix once with a Floyd–Warshall-style triple loop, then each query is a single lookup.",
        steps: [
          "Seed `reach[a][b] = true` for every direct prerequisite.",
          "For each intermediate `k`, if `i` reaches `k` and `k` reaches `j`, mark `i` reaches `j`.",
          "Answer each query from the matrix.",
        ],
        why: "With `numCourses <= 100` the closure is only `10^6` boolean updates, while there may be `10^4` queries — so precomputing once beats a search per query by a wide margin. The `k` loop must be outermost: that is what lets paths through several intermediates build up, one hop at a time.",
        time: "O(numCourses³ + queries)",
        space: "O(numCourses²)",
        pitfalls: [
          "Checking only direct edges misses every transitive prerequisite.",
          "The `k` loop must be the outer one; reordering breaks the closure.",
          "The relation is directed: `reach[u][v]` and `reach[v][u]` are different questions.",
        ],
      }),
      examples: [
        { input: "2\n[[1,0]]\n[[0,1],[1,0]]", expectedOutput: "[0,1]" },
        { input: "2\n[]\n[[1,0],[0,1]]", expectedOutput: "[0,0]" },
        { input: "3\n[[1,2],[1,0],[2,0]]\n[[1,0],[1,2]]", expectedOutput: "[1,1]" },
      ],
      gen: (rng: Rng) => {
        const numCourses = ri(rng, 2, 8);
        // Orient along a ranking so the prerequisite graph is always acyclic.
        const order = shuffle(rng, Array.from({ length: numCourses }, (_, i) => i));
        const prerequisites: number[][] = [];
        for (let a = 0; a < numCourses; a++) {
          for (let b = a + 1; b < numCourses; b++) {
            if (rng() < 0.35) prerequisites.push([order[a], order[b]]);
          }
        }
        const queries: number[][] = [];
        const qCount = ri(rng, 1, 6);
        for (let k = 0; k < qCount; k++) {
          const u = ri(rng, 0, numCourses - 1);
          const v = (u + ri(rng, 1, numCourses - 1)) % numCourses;
          queries.push([u, v]);
        }
        return {
          input: `${numCourses}\n${fmtIntMat(prerequisites)}\n${fmtIntMat(queries)}`,
          expectedOutput: fmtIntArr(ref(numCourses, prerequisites, queries)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef checkIfPrerequisite(numCourses: int, prerequisites: List[List[int]], queries: List[List[int]]) -> List[int]:\n    reach = [[False] * numCourses for _ in range(numCourses)]\n    for a, b in prerequisites:\n        reach[a][b] = True\n    for k in range(numCourses):\n        for i in range(numCourses):\n            if not reach[i][k]:\n                continue\n            for j in range(numCourses):\n                if reach[k][j]:\n                    reach[i][j] = True\n    return [1 if reach[u][v] else 0 for u, v in queries]`,
        javascript: `var checkIfPrerequisite = function(numCourses, prerequisites, queries) {\n    var i, j, k;\n    var reach = [];\n    for (i = 0; i < numCourses; i++) {\n        var row = [];\n        for (j = 0; j < numCourses; j++) row.push(false);\n        reach.push(row);\n    }\n    for (i = 0; i < prerequisites.length; i++) {\n        reach[prerequisites[i][0]][prerequisites[i][1]] = true;\n    }\n    for (k = 0; k < numCourses; k++) {\n        for (i = 0; i < numCourses; i++) {\n            if (!reach[i][k]) continue;\n            for (j = 0; j < numCourses; j++) {\n                if (reach[k][j]) reach[i][j] = true;\n            }\n        }\n    }\n    var out = [];\n    for (i = 0; i < queries.length; i++) {\n        out.push(reach[queries[i][0]][queries[i][1]] ? 1 : 0);\n    }\n    return out;\n};`,
        typescript: `function checkIfPrerequisite(numCourses: number, prerequisites: number[][], queries: number[][]): number[] {\n    var i: number, j: number, k: number;\n    var reach: boolean[][] = [];\n    for (i = 0; i < numCourses; i++) {\n        var row: boolean[] = [];\n        for (j = 0; j < numCourses; j++) row.push(false);\n        reach.push(row);\n    }\n    for (i = 0; i < prerequisites.length; i++) {\n        reach[prerequisites[i][0]][prerequisites[i][1]] = true;\n    }\n    for (k = 0; k < numCourses; k++) {\n        for (i = 0; i < numCourses; i++) {\n            if (!reach[i][k]) continue;\n            for (j = 0; j < numCourses; j++) {\n                if (reach[k][j]) reach[i][j] = true;\n            }\n        }\n    }\n    var out: number[] = [];\n    for (i = 0; i < queries.length; i++) {\n        out.push(reach[queries[i][0]][queries[i][1]] ? 1 : 0);\n    }\n    return out;\n}`,
        java: `public static int[] checkIfPrerequisite(int numCourses, int[][] prerequisites, int[][] queries) {\n    boolean[][] reach = new boolean[numCourses][numCourses];\n    for (int[] p : prerequisites) reach[p[0]][p[1]] = true;\n    for (int k = 0; k < numCourses; k++) {\n        for (int i = 0; i < numCourses; i++) {\n            if (!reach[i][k]) continue;\n            for (int j = 0; j < numCourses; j++) {\n                if (reach[k][j]) reach[i][j] = true;\n            }\n        }\n    }\n    int[] out = new int[queries.length];\n    for (int i = 0; i < queries.length; i++) {\n        out[i] = reach[queries[i][0]][queries[i][1]] ? 1 : 0;\n    }\n    return out;\n}`,
        cpp: `vector<int> checkIfPrerequisite(int numCourses, vector<vector<int>>& prerequisites, vector<vector<int>>& queries) {\n    vector<vector<char>> reach(numCourses, vector<char>(numCourses, 0));\n    for (auto& p : prerequisites) reach[p[0]][p[1]] = 1;\n    for (int k = 0; k < numCourses; k++) {\n        for (int i = 0; i < numCourses; i++) {\n            if (!reach[i][k]) continue;\n            for (int j = 0; j < numCourses; j++) {\n                if (reach[k][j]) reach[i][j] = 1;\n            }\n        }\n    }\n    vector<int> out;\n    for (auto& q : queries) out.push_back(reach[q[0]][q[1]] ? 1 : 0);\n    return out;\n}`,
        c: `int* checkIfPrerequisite(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {\n    (void) prerequisitesColSize;\n    (void) queriesColSize;\n    int n = numCourses;\n    char* reach = (char*) calloc((size_t) n * (size_t) n, 1);\n    for (int i = 0; i < prerequisitesSize; i++) {\n        reach[prerequisites[i][0] * n + prerequisites[i][1]] = 1;\n    }\n    for (int k = 0; k < n; k++) {\n        for (int i = 0; i < n; i++) {\n            if (!reach[i * n + k]) continue;\n            for (int j = 0; j < n; j++) {\n                if (reach[k * n + j]) reach[i * n + j] = 1;\n            }\n        }\n    }\n    int* out = (int*) malloc((size_t) (queriesSize > 0 ? queriesSize : 1) * sizeof(int));\n    for (int i = 0; i < queriesSize; i++) {\n        out[i] = reach[queries[i][0] * n + queries[i][1]] ? 1 : 0;\n    }\n    free(reach);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] CheckIfPrerequisite(int numCourses, int[][] prerequisites, int[][] queries)\n{\n    var reach = new bool[numCourses, numCourses];\n    foreach (var p in prerequisites) reach[p[0], p[1]] = true;\n    for (int k = 0; k < numCourses; k++)\n    {\n        for (int i = 0; i < numCourses; i++)\n        {\n            if (!reach[i, k]) continue;\n            for (int j = 0; j < numCourses; j++)\n            {\n                if (reach[k, j]) reach[i, j] = true;\n            }\n        }\n    }\n    var out_ = new int[queries.Length];\n    for (int i = 0; i < queries.Length; i++)\n    {\n        out_[i] = reach[queries[i][0], queries[i][1]] ? 1 : 0;\n    }\n    return out_;\n}`,
        go: `func checkIfPrerequisite(numCourses int, prerequisites [][]int, queries [][]int) []int {\n\treach := make([][]bool, numCourses)\n\tfor i := range reach {\n\t\treach[i] = make([]bool, numCourses)\n\t}\n\tfor _, p := range prerequisites {\n\t\treach[p[0]][p[1]] = true\n\t}\n\tfor k := 0; k < numCourses; k++ {\n\t\tfor i := 0; i < numCourses; i++ {\n\t\t\tif !reach[i][k] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfor j := 0; j < numCourses; j++ {\n\t\t\t\tif reach[k][j] {\n\t\t\t\t\treach[i][j] = true\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\tout := make([]int, len(queries))\n\tfor i, q := range queries {\n\t\tif reach[q[0]][q[1]] {\n\t\t\tout[i] = 1\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun checkIfPrerequisite(numCourses: Int, prerequisites: Array<IntArray>, queries: Array<IntArray>): IntArray {\n    val reach = Array(numCourses) { BooleanArray(numCourses) }\n    for (p in prerequisites) reach[p[0]][p[1]] = true\n    for (k in 0 until numCourses) {\n        for (i in 0 until numCourses) {\n            if (!reach[i][k]) continue\n            for (j in 0 until numCourses) {\n                if (reach[k][j]) reach[i][j] = true\n            }\n        }\n    }\n    return IntArray(queries.size) { if (reach[queries[it][0]][queries[it][1]]) 1 else 0 }\n}`,
        swift: `func checkIfPrerequisite(_ numCourses: Int, _ prerequisites: [[Int]], _ queries: [[Int]]) -> [Int] {\n    var reach = [[Bool]](repeating: [Bool](repeating: false, count: numCourses), count: numCourses)\n    for p in prerequisites { reach[p[0]][p[1]] = true }\n    for k in 0..<numCourses {\n        for i in 0..<numCourses {\n            if !reach[i][k] { continue }\n            for j in 0..<numCourses where reach[k][j] { reach[i][j] = true }\n        }\n    }\n    return queries.map { reach[$0[0]][$0[1]] ? 1 : 0 }\n}`,
        rust: `fn checkIfPrerequisite(numCourses: i32, prerequisites: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = numCourses as usize;\n    let mut reach = vec![vec![false; n]; n];\n    for p in prerequisites.iter() {\n        reach[p[0] as usize][p[1] as usize] = true;\n    }\n    for k in 0..n {\n        for i in 0..n {\n            if !reach[i][k] {\n                continue;\n            }\n            for j in 0..n {\n                if reach[k][j] {\n                    reach[i][j] = true;\n                }\n            }\n        }\n    }\n    queries\n        .iter()\n        .map(|q| if reach[q[0] as usize][q[1] as usize] { 1 } else { 0 })\n        .collect()\n}`,
        php: `function checkIfPrerequisite($numCourses, $prerequisites, $queries) {\n    $reach = [];\n    for ($i = 0; $i < $numCourses; $i++) $reach[$i] = array_fill(0, $numCourses, false);\n    foreach ($prerequisites as $p) $reach[$p[0]][$p[1]] = true;\n    for ($k = 0; $k < $numCourses; $k++) {\n        for ($i = 0; $i < $numCourses; $i++) {\n            if (!$reach[$i][$k]) continue;\n            for ($j = 0; $j < $numCourses; $j++) {\n                if ($reach[$k][$j]) $reach[$i][$j] = true;\n            }\n        }\n    }\n    $out = [];\n    foreach ($queries as $q) $out[] = $reach[$q[0]][$q[1]] ? 1 : 0;\n    return $out;\n}`,
        ruby: `def checkIfPrerequisite(numCourses, prerequisites, queries)\n  reach = Array.new(numCourses) { Array.new(numCourses, false) }\n  prerequisites.each { |a, b| reach[a][b] = true }\n  (0...numCourses).each do |k|\n    (0...numCourses).each do |i|\n      next unless reach[i][k]\n      (0...numCourses).each do |j|\n        reach[i][j] = true if reach[k][j]\n      end\n    end\n  end\n  queries.map { |u, v| reach[u][v] ? 1 : 0 }\nend`,
      },
    };
  })(),

  // ── Number of Restricted Paths From First to Last Node (LC 1786) ──
  (() => {
    const MOD = 1000000007;
    const BIG = 1000000000;
    const ref = (n: number, edges: number[][]) => {
      const adj: number[][][] = Array.from({ length: n + 1 }, () => []);
      for (let i = 0; i < edges.length; i++) {
        adj[edges[i][0]].push([edges[i][1], edges[i][2]]);
        adj[edges[i][1]].push([edges[i][0], edges[i][2]]);
      }
      const dist = new Array(n + 1).fill(BIG);
      const done = new Array(n + 1).fill(false);
      dist[n] = 0;
      for (let it = 0; it < n; it++) {
        let u = -1, best = BIG;
        for (let i = 1; i <= n; i++) {
          if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
        }
        if (u < 0) break;
        done[u] = true;
        for (let k = 0; k < adj[u].length; k++) {
          const v = adj[u][k][0], w = adj[u][k][1];
          if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
        }
      }
      const order = Array.from({ length: n }, (_, i) => i + 1).sort((a, b) => dist[a] - dist[b]);
      const ways = new Array(n + 1).fill(0);
      ways[n] = 1;
      for (let i = 0; i < order.length; i++) {
        const u = order[i];
        if (u === n) continue;
        let total = 0;
        for (let k = 0; k < adj[u].length; k++) {
          const v = adj[u][k][0];
          if (dist[v] < dist[u]) total = (total + ways[v]) % MOD;
        }
        ways[u] = total;
      }
      return ways[1];
    };
    return {
      slug: "number-of-restricted-paths-from-first-to-last-node",
      title: "Number of Restricted Paths From First to Last Node",
      difficulty: "HARD" as const,
      tags: ["Graph", "Dynamic Programming", "Shortest Path", "Heap (Priority Queue)", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countRestrictedPaths", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected weighted connected graph has `n` nodes numbered `1 … n`, with `edges[i] = [u, v, weight]`. Let `distanceToLastNode(x)` be the shortest distance from node `x` to node `n`.\n\nA path `z1 → z2 → … → zk` is **restricted** when `distanceToLastNode(z1) > distanceToLastNode(z2) > … > distanceToLastNode(zk)`. Return the number of restricted paths from node `1` to node `n`, modulo `10^9 + 7`.",
        [
          { in: "n = 5, edges = [[1,2,3],[1,3,3],[2,3,1],[1,4,2],[5,2,2],[3,5,1],[5,4,10]]", out: "3" },
          { in: "n = 7, edges = [[1,3,1],[4,1,2],[7,3,4],[2,5,3],[5,6,1],[6,7,2],[7,5,3],[2,6,4]]", out: "1", note: "Only `1 → 3 → 7` keeps the distances strictly decreasing." },
          { in: "n = 2, edges = [[1,2,5]]", out: "1" },
        ],
        ["1 <= n <= 1000", "n - 1 <= edges.length <= 2 * 10^4", "edges[i].length == 3", "1 <= u, v <= n", "u != v", "1 <= weight <= 1000", "There is at most one edge between any two nodes.", "There is at least one path between every pair of nodes."]),
      hints: [
        "First compute the shortest distance from **every** node to node `n` with one run of Dijkstra's algorithm.",
        "The \"strictly decreasing\" rule makes the allowed moves a DAG, so paths can be counted by dynamic programming.",
        "Process nodes in increasing order of their distance to `n`.",
      ],
      editorial: explain({
        idea: "Run Dijkstra from node `n` to get every node's distance, then count paths with `ways[u] = Σ ways[v]` over neighbours `v` that are strictly closer to `n`. Processing nodes in increasing distance makes every `ways[v]` final before it is used.",
        steps: [
          "Dijkstra from node `n` gives `dist[x]` for all `x`.",
          "Set `ways[n] = 1` — the empty path ending at `n`.",
          "Sort the nodes by `dist` ascending and sweep them.",
          "For node `u`, sum `ways[v]` over neighbours with `dist[v] < dist[u]`, modulo `10^9 + 7`.",
          "Return `ways[1]`.",
        ],
        why: "The strict inequality is what makes counting possible at all: it forbids cycles, turning the allowed moves into a DAG whose topological order is exactly \"sorted by distance\". Ties in `dist` never create an edge, since a move needs a *strict* drop, so equal-distance nodes can be processed in any relative order.",
        time: "O(n² + m) with a plain Dijkstra, or O(m log n) with a heap",
        space: "O(n + m)",
        pitfalls: [
          "Dijkstra must run from node `n`, not from node `1`.",
          "`ways[n] = 1` is the base case; forgetting it makes every answer 0.",
          "Take the modulus while summing, not only at the end.",
        ],
      }),
      examples: [
        { input: "5\n[[1,2,3],[1,3,3],[2,3,1],[1,4,2],[5,2,2],[3,5,1],[5,4,10]]", expectedOutput: "3" },
        { input: "7\n[[1,3,1],[4,1,2],[7,3,4],[2,5,3],[5,6,1],[6,7,2],[7,5,3],[2,6,4]]", expectedOutput: "1" },
        { input: "2\n[[1,2,5]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        // A spanning path guarantees connectivity, which the statement promises.
        const n = ri(rng, 1, 8);
        const seen = new Set<number>();
        const edges: number[][] = [];
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        for (let i = 0; i + 1 < order.length; i++) {
          const a = order[i], b = order[i + 1];
          seen.add(Math.min(a, b) * (n + 1) + Math.max(a, b));
          edges.push([a, b, ri(rng, 1, 12)]);
        }
        for (let k = 0; k < 8; k++) {
          const a = ri(rng, 1, n), b = ri(rng, 1, n);
          if (a === b) continue;
          const key = Math.min(a, b) * (n + 1) + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push([a, b, ri(rng, 1, 12)]);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef countRestrictedPaths(n: int, edges: List[List[int]]) -> int:\n    MOD = 1000000007\n    adj = [[] for _ in range(n + 1)]\n    for u, v, w in edges:\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n    BIG = float('inf')\n    dist = [BIG] * (n + 1)\n    dist[n] = 0\n    heap = [(0, n)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        for v, w in adj[u]:\n            if d + w < dist[v]:\n                dist[v] = d + w\n                heapq.heappush(heap, (dist[v], v))\n    ways = [0] * (n + 1)\n    ways[n] = 1\n    for u in sorted(range(1, n + 1), key=lambda x: dist[x]):\n        if u == n:\n            continue\n        total = 0\n        for v, _ in adj[u]:\n            if dist[v] < dist[u]:\n                total = (total + ways[v]) % MOD\n        ways[u] = total\n    return ways[1]`,
        javascript: `var countRestrictedPaths = function(n, edges) {\n    var MOD = 1000000007, BIG = 1000000000, i, k;\n    var adj = [];\n    for (i = 0; i <= n; i++) adj.push([]);\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push([edges[i][1], edges[i][2]]);\n        adj[edges[i][1]].push([edges[i][0], edges[i][2]]);\n    }\n    var dist = [], done = [];\n    for (i = 0; i <= n; i++) { dist.push(BIG); done.push(false); }\n    dist[n] = 0;\n    for (var it = 0; it < n; it++) {\n        var u = -1, best = BIG;\n        for (i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (k = 0; k < adj[u].length; k++) {\n            var v = adj[u][k][0], w = adj[u][k][1];\n            if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n        }\n    }\n    var order = [];\n    for (i = 1; i <= n; i++) order.push(i);\n    order.sort(function(a, b) { return dist[a] - dist[b]; });\n    var ways = [];\n    for (i = 0; i <= n; i++) ways.push(0);\n    ways[n] = 1;\n    for (i = 0; i < order.length; i++) {\n        var node = order[i];\n        if (node === n) continue;\n        var total = 0;\n        for (k = 0; k < adj[node].length; k++) {\n            var nb = adj[node][k][0];\n            if (dist[nb] < dist[node]) total = (total + ways[nb]) % MOD;\n        }\n        ways[node] = total;\n    }\n    return ways[1];\n};`,
        typescript: `function countRestrictedPaths(n: number, edges: number[][]): number {\n    var MOD = 1000000007, BIG = 1000000000, i: number, k: number;\n    var adj: number[][][] = [];\n    for (i = 0; i <= n; i++) adj.push([]);\n    for (i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push([edges[i][1], edges[i][2]]);\n        adj[edges[i][1]].push([edges[i][0], edges[i][2]]);\n    }\n    var dist: number[] = [], done: boolean[] = [];\n    for (i = 0; i <= n; i++) { dist.push(BIG); done.push(false); }\n    dist[n] = 0;\n    for (var it = 0; it < n; it++) {\n        var u = -1, best = BIG;\n        for (i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (k = 0; k < adj[u].length; k++) {\n            var v = adj[u][k][0], w = adj[u][k][1];\n            if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n        }\n    }\n    var order: number[] = [];\n    for (i = 1; i <= n; i++) order.push(i);\n    order.sort(function(a: number, b: number) { return dist[a] - dist[b]; });\n    var ways: number[] = [];\n    for (i = 0; i <= n; i++) ways.push(0);\n    ways[n] = 1;\n    for (i = 0; i < order.length; i++) {\n        var node = order[i];\n        if (node === n) continue;\n        var total = 0;\n        for (k = 0; k < adj[node].length; k++) {\n            var nb = adj[node][k][0];\n            if (dist[nb] < dist[node]) total = (total + ways[nb]) % MOD;\n        }\n        ways[node] = total;\n    }\n    return ways[1];\n}`,
        java: `public static int countRestrictedPaths(int n, int[][] edges) {\n    final int MOD = 1000000007;\n    final int BIG = 1000000000;\n    List<List<int[]>> adj = new ArrayList<>();\n    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());\n    for (int[] e : edges) {\n        adj.get(e[0]).add(new int[] { e[1], e[2] });\n        adj.get(e[1]).add(new int[] { e[0], e[2] });\n    }\n    int[] dist = new int[n + 1];\n    boolean[] done = new boolean[n + 1];\n    Arrays.fill(dist, BIG);\n    dist[n] = 0;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (int[] e : adj.get(u)) {\n            if (dist[u] + e[1] < dist[e[0]]) dist[e[0]] = dist[u] + e[1];\n        }\n    }\n    Integer[] order = new Integer[n];\n    for (int i = 0; i < n; i++) order[i] = i + 1;\n    final int[] d = dist;\n    Arrays.sort(order, (a, b) -> d[a] - d[b]);\n    long[] ways = new long[n + 1];\n    ways[n] = 1;\n    for (int node : order) {\n        if (node == n) continue;\n        long total = 0;\n        for (int[] e : adj.get(node)) {\n            if (dist[e[0]] < dist[node]) total = (total + ways[e[0]]) % MOD;\n        }\n        ways[node] = total;\n    }\n    return (int) ways[1];\n}`,
        cpp: `int countRestrictedPaths(int n, vector<vector<int>>& edges) {\n    const long long MOD = 1000000007;\n    const int BIG = 1000000000;\n    vector<vector<pair<int,int>>> adj(n + 1);\n    for (auto& e : edges) {\n        adj[e[0]].push_back({ e[1], e[2] });\n        adj[e[1]].push_back({ e[0], e[2] });\n    }\n    vector<int> dist(n + 1, BIG);\n    vector<char> done(n + 1, 0);\n    dist[n] = 0;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        for (auto& p : adj[u]) {\n            if (dist[u] + p.second < dist[p.first]) dist[p.first] = dist[u] + p.second;\n        }\n    }\n    vector<int> order(n);\n    for (int i = 0; i < n; i++) order[i] = i + 1;\n    sort(order.begin(), order.end(), [&](int a, int b) { return dist[a] < dist[b]; });\n    vector<long long> ways(n + 1, 0);\n    ways[n] = 1;\n    for (int node : order) {\n        if (node == n) continue;\n        long long total = 0;\n        for (auto& p : adj[node]) {\n            if (dist[p.first] < dist[node]) total = (total + ways[p.first]) % MOD;\n        }\n        ways[node] = total;\n    }\n    return (int) ways[1];\n}`,
        c: `static int* crpDist;\n\nstatic int crpCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return crpDist[x] - crpDist[y];\n}\n\nint countRestrictedPaths(int n, int** edges, int edgesSize, int* edgesColSize) {\n    (void) edgesColSize;\n    const long long MOD = 1000000007;\n    const int BIG = 1000000000;\n    int* head = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int i = 0; i <= n; i++) head[i] = -1;\n    int cap = edgesSize * 2 > 0 ? edgesSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int* wt = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < edgesSize; i++) {\n        int u = edges[i][0], v = edges[i][1], w = edges[i][2];\n        to[ec] = v; wt[ec] = w; nxt[ec] = head[u]; head[u] = ec; ec++;\n        to[ec] = u; wt[ec] = w; nxt[ec] = head[v]; head[v] = ec; ec++;\n    }\n    int* dist = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    char* done = (char*) calloc((size_t) (n + 1), 1);\n    for (int i = 0; i <= n; i++) dist[i] = BIG;\n    dist[n] = 0;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 1; i <= n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        for (int e = head[u]; e >= 0; e = nxt[e]) {\n            if (dist[u] + wt[e] < dist[to[e]]) dist[to[e]] = dist[u] + wt[e];\n        }\n    }\n    int* order = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) order[i] = i + 1;\n    crpDist = dist;\n    qsort(order, (size_t) n, sizeof(int), crpCmp);\n    long long* ways = (long long*) calloc((size_t) (n + 1), sizeof(long long));\n    ways[n] = 1;\n    for (int i = 0; i < n; i++) {\n        int node = order[i];\n        if (node == n) continue;\n        long long total = 0;\n        for (int e = head[node]; e >= 0; e = nxt[e]) {\n            if (dist[to[e]] < dist[node]) total = (total + ways[to[e]]) % MOD;\n        }\n        ways[node] = total;\n    }\n    int ans = (int) ways[1];\n    free(head); free(nxt); free(to); free(wt);\n    free(dist); free(done); free(order); free(ways);\n    return ans;\n}`,
        csharp: `public static int CountRestrictedPaths(int n, int[][] edges)\n{\n    const long MOD = 1000000007;\n    const int BIG = 1000000000;\n    var adj = new List<int[]>[n + 1];\n    for (int i = 0; i <= n; i++) adj[i] = new List<int[]>();\n    foreach (var e in edges)\n    {\n        adj[e[0]].Add(new int[] { e[1], e[2] });\n        adj[e[1]].Add(new int[] { e[0], e[2] });\n    }\n    var dist = new int[n + 1];\n    var done = new bool[n + 1];\n    for (int i = 0; i <= n; i++) dist[i] = BIG;\n    dist[n] = 0;\n    for (int it = 0; it < n; it++)\n    {\n        int u = -1, best = BIG;\n        for (int i = 1; i <= n; i++)\n        {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        foreach (var e in adj[u])\n        {\n            if (dist[u] + e[1] < dist[e[0]]) dist[e[0]] = dist[u] + e[1];\n        }\n    }\n    var order = new int[n];\n    for (int i = 0; i < n; i++) order[i] = i + 1;\n    Array.Sort(order, (a, b) => dist[a] - dist[b]);\n    var ways = new long[n + 1];\n    ways[n] = 1;\n    foreach (var node in order)\n    {\n        if (node == n) continue;\n        long total = 0;\n        foreach (var e in adj[node])\n        {\n            if (dist[e[0]] < dist[node]) total = (total + ways[e[0]]) % MOD;\n        }\n        ways[node] = total;\n    }\n    return (int) ways[1];\n}`,
        go: `func countRestrictedPaths(n int, edges [][]int) int {\n\tconst MOD = 1000000007\n\tconst BIG = 1000000000\n\tadj := make([][][2]int, n+1)\n\tfor _, e := range edges {\n\t\tadj[e[0]] = append(adj[e[0]], [2]int{e[1], e[2]})\n\t\tadj[e[1]] = append(adj[e[1]], [2]int{e[0], e[2]})\n\t}\n\tdist := make([]int, n+1)\n\tdone := make([]bool, n+1)\n\tfor i := range dist {\n\t\tdist[i] = BIG\n\t}\n\tdist[n] = 0\n\tfor it := 0; it < n; it++ {\n\t\tu, best := -1, BIG\n\t\tfor i := 1; i <= n; i++ {\n\t\t\tif !done[i] && dist[i] < best {\n\t\t\t\tbest = dist[i]\n\t\t\t\tu = i\n\t\t\t}\n\t\t}\n\t\tif u < 0 {\n\t\t\tbreak\n\t\t}\n\t\tdone[u] = true\n\t\tfor _, p := range adj[u] {\n\t\t\tif dist[u]+p[1] < dist[p[0]] {\n\t\t\t\tdist[p[0]] = dist[u] + p[1]\n\t\t\t}\n\t\t}\n\t}\n\torder := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\torder[i] = i + 1\n\t}\n\tsort.Slice(order, func(a, b int) bool { return dist[order[a]] < dist[order[b]] })\n\tways := make([]int, n+1)\n\tways[n] = 1\n\tfor _, node := range order {\n\t\tif node == n {\n\t\t\tcontinue\n\t\t}\n\t\ttotal := 0\n\t\tfor _, p := range adj[node] {\n\t\t\tif dist[p[0]] < dist[node] {\n\t\t\t\ttotal = (total + ways[p[0]]) % MOD\n\t\t\t}\n\t\t}\n\t\tways[node] = total\n\t}\n\treturn ways[1]\n}`,
        kotlin: `fun countRestrictedPaths(n: Int, edges: Array<IntArray>): Int {\n    val MOD = 1000000007L\n    val BIG = 1000000000\n    val adj = Array(n + 1) { ArrayList<IntArray>() }\n    for (e in edges) {\n        adj[e[0]].add(intArrayOf(e[1], e[2]))\n        adj[e[1]].add(intArrayOf(e[0], e[2]))\n    }\n    val dist = IntArray(n + 1) { BIG }\n    val done = BooleanArray(n + 1)\n    dist[n] = 0\n    for (it2 in 0 until n) {\n        var u = -1\n        var best = BIG\n        for (i in 1..n) {\n            if (!done[i] && dist[i] < best) {\n                best = dist[i]\n                u = i\n            }\n        }\n        if (u < 0) break\n        done[u] = true\n        for (e in adj[u]) {\n            if (dist[u] + e[1] < dist[e[0]]) dist[e[0]] = dist[u] + e[1]\n        }\n    }\n    val order = (1..n).sortedBy { dist[it] }\n    val ways = LongArray(n + 1)\n    ways[n] = 1\n    for (node in order) {\n        if (node == n) continue\n        var total = 0L\n        for (e in adj[node]) {\n            if (dist[e[0]] < dist[node]) total = (total + ways[e[0]]) % MOD\n        }\n        ways[node] = total\n    }\n    return ways[1].toInt()\n}`,
        swift: `func countRestrictedPaths(_ n: Int, _ edges: [[Int]]) -> Int {\n    let MOD = 1000000007\n    let BIG = 1000000000\n    var adj = [[(Int, Int)]](repeating: [], count: n + 1)\n    for e in edges {\n        adj[e[0]].append((e[1], e[2]))\n        adj[e[1]].append((e[0], e[2]))\n    }\n    var dist = [Int](repeating: BIG, count: n + 1)\n    var done = [Bool](repeating: false, count: n + 1)\n    dist[n] = 0\n    for _ in 0..<n {\n        var u = -1\n        var best = BIG\n        for i in 1...max(1, n) where i <= n && !done[i] && dist[i] < best {\n            best = dist[i]\n            u = i\n        }\n        if u < 0 { break }\n        done[u] = true\n        for (v, w) in adj[u] where dist[u] + w < dist[v] {\n            dist[v] = dist[u] + w\n        }\n    }\n    let order = (1...max(1, n)).filter { $0 <= n }.sorted { dist[$0] < dist[$1] }\n    var ways = [Int](repeating: 0, count: n + 1)\n    ways[n] = 1\n    for node in order {\n        if node == n { continue }\n        var total = 0\n        for (v, _) in adj[node] where dist[v] < dist[node] {\n            total = (total + ways[v]) % MOD\n        }\n        ways[node] = total\n    }\n    return ways[1]\n}`,
        rust: `fn countRestrictedPaths(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    const MOD: i64 = 1000000007;\n    const BIG: i32 = 1000000000;\n    let n = n as usize;\n    let mut adj: Vec<Vec<(usize, i32)>> = vec![Vec::new(); n + 1];\n    for e in edges.iter() {\n        adj[e[0] as usize].push((e[1] as usize, e[2]));\n        adj[e[1] as usize].push((e[0] as usize, e[2]));\n    }\n    let mut dist = vec![BIG; n + 1];\n    let mut done = vec![false; n + 1];\n    dist[n] = 0;\n    for _ in 0..n {\n        let mut u: i32 = -1;\n        let mut best = BIG;\n        for i in 1..=n {\n            if !done[i] && dist[i] < best {\n                best = dist[i];\n                u = i as i32;\n            }\n        }\n        if u < 0 {\n            break;\n        }\n        let ui = u as usize;\n        done[ui] = true;\n        for idx in 0..adj[ui].len() {\n            let (v, w) = adj[ui][idx];\n            if dist[ui] + w < dist[v] {\n                dist[v] = dist[ui] + w;\n            }\n        }\n    }\n    let mut order: Vec<usize> = (1..=n).collect();\n    order.sort_by_key(|&x| dist[x]);\n    let mut ways = vec![0i64; n + 1];\n    ways[n] = 1;\n    for &node in order.iter() {\n        if node == n {\n            continue;\n        }\n        let mut total = 0i64;\n        for idx in 0..adj[node].len() {\n            let (v, _) = adj[node][idx];\n            if dist[v] < dist[node] {\n                total = (total + ways[v]) % MOD;\n            }\n        }\n        ways[node] = total;\n    }\n    ways[1] as i32\n}`,
        php: `function countRestrictedPaths($n, $edges) {\n    $MOD = 1000000007;\n    $BIG = 1000000000;\n    $adj = [];\n    for ($i = 0; $i <= $n; $i++) $adj[$i] = [];\n    foreach ($edges as $e) {\n        $adj[$e[0]][] = [$e[1], $e[2]];\n        $adj[$e[1]][] = [$e[0], $e[2]];\n    }\n    $dist = array_fill(0, $n + 1, $BIG);\n    $done = array_fill(0, $n + 1, false);\n    $dist[$n] = 0;\n    for ($it = 0; $it < $n; $it++) {\n        $u = -1;\n        $best = $BIG;\n        for ($i = 1; $i <= $n; $i++) {\n            if (!$done[$i] && $dist[$i] < $best) { $best = $dist[$i]; $u = $i; }\n        }\n        if ($u < 0) break;\n        $done[$u] = true;\n        foreach ($adj[$u] as $p) {\n            if ($dist[$u] + $p[1] < $dist[$p[0]]) $dist[$p[0]] = $dist[$u] + $p[1];\n        }\n    }\n    $order = range(1, $n);\n    usort($order, function($a, $b) use ($dist) { return $dist[$a] - $dist[$b]; });\n    $ways = array_fill(0, $n + 1, 0);\n    $ways[$n] = 1;\n    foreach ($order as $node) {\n        if ($node === $n) continue;\n        $total = 0;\n        foreach ($adj[$node] as $p) {\n            if ($dist[$p[0]] < $dist[$node]) $total = ($total + $ways[$p[0]]) % $MOD;\n        }\n        $ways[$node] = $total;\n    }\n    return $ways[1];\n}`,
        ruby: `def countRestrictedPaths(n, edges)\n  mod = 1000000007\n  big = 1000000000\n  adj = Array.new(n + 1) { [] }\n  edges.each do |u, v, w|\n    adj[u] << [v, w]\n    adj[v] << [u, w]\n  end\n  dist = Array.new(n + 1, big)\n  done = Array.new(n + 1, false)\n  dist[n] = 0\n  n.times do\n    u = -1\n    best = big\n    (1..n).each do |i|\n      if !done[i] && dist[i] < best\n        best = dist[i]\n        u = i\n      end\n    end\n    break if u < 0\n    done[u] = true\n    adj[u].each do |v, w|\n      dist[v] = dist[u] + w if dist[u] + w < dist[v]\n    end\n  end\n  order = (1..n).sort_by { |x| dist[x] }\n  ways = Array.new(n + 1, 0)\n  ways[n] = 1\n  order.each do |node|\n    next if node == n\n    total = 0\n    adj[node].each do |v, _|\n      total = (total + ways[v]) % mod if dist[v] < dist[node]\n    end\n    ways[node] = total\n  end\n  ways[1]\nend`,
      },
    };
  })(),

  // ── Bus Routes (LC 815) ─────────────────────────────────────────
  (() => {
    const ref = (routes: number[][], source: number, target: number) => {
      if (source === target) return 0;
      const stopToRoutes = new Map<number, number[]>();
      for (let r = 0; r < routes.length; r++) {
        for (let i = 0; i < routes[r].length; i++) {
          const s = routes[r][i];
          const list = stopToRoutes.get(s);
          if (list) list.push(r);
          else stopToRoutes.set(s, [r]);
        }
      }
      const usedRoute = new Array(routes.length).fill(false);
      const seenStop = new Set<number>([source]);
      let q = [source];
      let buses = 0;
      while (q.length > 0) {
        buses++;
        const nq: number[] = [];
        for (let k = 0; k < q.length; k++) {
          const rs = stopToRoutes.get(q[k]);
          if (!rs) continue;
          for (let a = 0; a < rs.length; a++) {
            const r = rs[a];
            if (usedRoute[r]) continue;
            usedRoute[r] = true;
            for (let b = 0; b < routes[r].length; b++) {
              const s = routes[r][b];
              if (s === target) return buses;
              if (seenStop.has(s)) continue;
              seenStop.add(s);
              nq.push(s);
            }
          }
        }
        q = nq;
      }
      return -1;
    };
    return {
      slug: "bus-routes",
      title: "Bus Routes",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Breadth-First Search", "Amazon", "Google", "Uber"],
      signature: { funcName: "numBusesToDestination", params: [{ name: "routes", type: "int[][]" as const }, { name: "source", type: "int" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`routes[i]` is the repeating loop of stops that bus `i` drives, for ever. For example a bus with route `[1, 5, 7]` drives `1 → 5 → 7 → 1 → 5 → 7 → …`.\n\nYou start at the stop `source` — not on any bus — and want to reach the stop `target`. Return the **fewest buses you must ride**, or `-1` if the target cannot be reached. You may walk nowhere; travel only by bus.",
        [
          { in: "routes = [[1,2,7],[3,6,7]], source = 1, target = 6", out: "2", note: "Ride the first bus from stop 1 to stop 7, then the second from stop 7 to stop 6." },
          { in: "routes = [[7,12],[4,5,15],[6],[15,19],[9,12,13]], source = 15, target = 12", out: "-1" },
          { in: "routes = [[1,2,7]], source = 1, target = 1", out: "0", note: "You are already there." },
        ],
        ["1 <= routes.length <= 500", "1 <= routes[i].length <= 10^5", "All the values of routes[i] are unique.", "sum(routes[i].length) <= 10^5", "0 <= routes[i][j] < 10^6", "0 <= source, target < 10^6"]),
      hints: [
        "Counting buses, not stops, is the whole point — so the search should move one **route** at a time.",
        "Build a map from each stop to the routes that serve it.",
        "Breadth-first search over stops, where one level is one bus ride, and never board the same route twice.",
      ],
      editorial: explain({
        idea: "Level-by-level BFS over stops where each level is one bus ride. Standing at any stop of a route, you can reach every other stop on that route for a single fare, so expanding a route means adding all of its stops at once.",
        steps: [
          "Map each stop to the list of routes serving it.",
          "Seed the queue with `source`; if it is already `target`, answer 0.",
          "For each level, increment the bus count, then for every stop in the level take each unused route through it, mark the route used, and enqueue its unseen stops.",
          "Return the count when `target` appears, or `-1` when the queue empties.",
        ],
        why: "Marking a *route* as used, rather than only its stops, is what keeps the search linear in the total input size: a route with 100 000 stops is expanded once, no matter how many of its stops the search meets. It is safe because the first time the route is boarded is the cheapest, so re-boarding it later could never shorten a journey.",
        time: "O(total stops + routes²) in the worst case",
        space: "O(total stops)",
        pitfalls: [
          "`source == target` costs 0 buses, not 1.",
          "Counting stops travelled instead of routes boarded answers a different question.",
          "Without marking routes used, overlapping routes are re-expanded and the search blows up.",
        ],
      }),
      examples: [
        { input: "[[1,2,7],[3,6,7]]\n1\n6", expectedOutput: "2" },
        { input: "[[7,12],[4,5,15],[6],[15,19],[9,12,13]]\n15\n12", expectedOutput: "-1" },
        { input: "[[1,2,7]]\n1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const stops = ri(rng, 2, 12);
        const count = ri(rng, 1, 5);
        const routes: number[][] = [];
        for (let r = 0; r < count; r++) {
          const pool = shuffle(rng, Array.from({ length: stops }, (_, i) => i));
          routes.push(pool.slice(0, ri(rng, 1, Math.min(4, stops))).sort((a, b) => a - b));
        }
        const source = ri(rng, 0, stops - 1);
        const target = ri(rng, 0, stops - 1);
        return { input: `${fmtIntMat(routes)}\n${source}\n${target}`, expectedOutput: String(ref(routes, source, target)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict\n\ndef numBusesToDestination(routes: List[List[int]], source: int, target: int) -> int:\n    if source == target:\n        return 0\n    stop_to_routes = defaultdict(list)\n    for r, route in enumerate(routes):\n        for s in route:\n            stop_to_routes[s].append(r)\n    used_route = [False] * len(routes)\n    seen_stop = {source}\n    q = [source]\n    buses = 0\n    while q:\n        buses += 1\n        nq = []\n        for stop in q:\n            for r in stop_to_routes.get(stop, ()):\n                if used_route[r]:\n                    continue\n                used_route[r] = True\n                for s in routes[r]:\n                    if s == target:\n                        return buses\n                    if s in seen_stop:\n                        continue\n                    seen_stop.add(s)\n                    nq.append(s)\n        q = nq\n    return -1`,
        javascript: `var numBusesToDestination = function(routes, source, target) {\n    if (source === target) return 0;\n    var r, i;\n    var stopToRoutes = new Map();\n    for (r = 0; r < routes.length; r++) {\n        for (i = 0; i < routes[r].length; i++) {\n            var s = routes[r][i];\n            var list = stopToRoutes.get(s);\n            if (list) list.push(r);\n            else stopToRoutes.set(s, [r]);\n        }\n    }\n    var usedRoute = [];\n    for (r = 0; r < routes.length; r++) usedRoute.push(false);\n    var seenStop = new Set();\n    seenStop.add(source);\n    var q = [source];\n    var buses = 0;\n    while (q.length > 0) {\n        buses++;\n        var nq = [];\n        for (var k = 0; k < q.length; k++) {\n            var rs = stopToRoutes.get(q[k]);\n            if (!rs) continue;\n            for (var a = 0; a < rs.length; a++) {\n                var rt = rs[a];\n                if (usedRoute[rt]) continue;\n                usedRoute[rt] = true;\n                for (var b = 0; b < routes[rt].length; b++) {\n                    var stop = routes[rt][b];\n                    if (stop === target) return buses;\n                    if (seenStop.has(stop)) continue;\n                    seenStop.add(stop);\n                    nq.push(stop);\n                }\n            }\n        }\n        q = nq;\n    }\n    return -1;\n};`,
        typescript: `function numBusesToDestination(routes: number[][], source: number, target: number): number {\n    if (source === target) return 0;\n    var r: number, i: number;\n    var stopToRoutes: { [k: string]: number[] } = {};\n    for (r = 0; r < routes.length; r++) {\n        for (i = 0; i < routes[r].length; i++) {\n            var key = "" + routes[r][i];\n            if (stopToRoutes[key]) stopToRoutes[key].push(r);\n            else stopToRoutes[key] = [r];\n        }\n    }\n    var usedRoute: boolean[] = [];\n    for (r = 0; r < routes.length; r++) usedRoute.push(false);\n    var seenStop: { [k: string]: boolean } = {};\n    seenStop["" + source] = true;\n    var q: number[] = [source];\n    var buses = 0;\n    while (q.length > 0) {\n        buses++;\n        var nq: number[] = [];\n        for (var k = 0; k < q.length; k++) {\n            var rs = stopToRoutes["" + q[k]];\n            if (!rs) continue;\n            for (var a = 0; a < rs.length; a++) {\n                var rt = rs[a];\n                if (usedRoute[rt]) continue;\n                usedRoute[rt] = true;\n                for (var b = 0; b < routes[rt].length; b++) {\n                    var stop = routes[rt][b];\n                    if (stop === target) return buses;\n                    if (seenStop["" + stop]) continue;\n                    seenStop["" + stop] = true;\n                    nq.push(stop);\n                }\n            }\n        }\n        q = nq;\n    }\n    return -1;\n}`,
        java: `public static int numBusesToDestination(int[][] routes, int source, int target) {\n    if (source == target) return 0;\n    Map<Integer, List<Integer>> stopToRoutes = new HashMap<>();\n    for (int r = 0; r < routes.length; r++) {\n        for (int s : routes[r]) stopToRoutes.computeIfAbsent(s, x -> new ArrayList<>()).add(r);\n    }\n    boolean[] usedRoute = new boolean[routes.length];\n    Set<Integer> seenStop = new HashSet<>();\n    seenStop.add(source);\n    List<Integer> q = new ArrayList<>();\n    q.add(source);\n    int buses = 0;\n    while (!q.isEmpty()) {\n        buses++;\n        List<Integer> nq = new ArrayList<>();\n        for (int stop : q) {\n            List<Integer> rs = stopToRoutes.get(stop);\n            if (rs == null) continue;\n            for (int r : rs) {\n                if (usedRoute[r]) continue;\n                usedRoute[r] = true;\n                for (int s : routes[r]) {\n                    if (s == target) return buses;\n                    if (!seenStop.add(s)) continue;\n                    nq.add(s);\n                }\n            }\n        }\n        q = nq;\n    }\n    return -1;\n}`,
        cpp: `int numBusesToDestination(vector<vector<int>>& routes, int source, int target) {\n    if (source == target) return 0;\n    unordered_map<int, vector<int>> stopToRoutes;\n    for (int r = 0; r < (int) routes.size(); r++) {\n        for (int s : routes[r]) stopToRoutes[s].push_back(r);\n    }\n    vector<char> usedRoute(routes.size(), 0);\n    unordered_set<int> seenStop;\n    seenStop.insert(source);\n    vector<int> q = { source };\n    int buses = 0;\n    while (!q.empty()) {\n        buses++;\n        vector<int> nq;\n        for (int stop : q) {\n            auto it = stopToRoutes.find(stop);\n            if (it == stopToRoutes.end()) continue;\n            for (int r : it->second) {\n                if (usedRoute[r]) continue;\n                usedRoute[r] = 1;\n                for (int s : routes[r]) {\n                    if (s == target) return buses;\n                    if (!seenStop.insert(s).second) continue;\n                    nq.push_back(s);\n                }\n            }\n        }\n        q = nq;\n    }\n    return -1;\n}`,
        c: `int numBusesToDestination(int** routes, int routesSize, int* routesColSize, int source, int target) {\n    if (source == target) return 0;\n    /* Stop ids go up to 10^6, so a flat visited array beats a hash table. */\n    const int LIM = 1000001;\n    char* seenStop = (char*) calloc((size_t) LIM, 1);\n    char* usedRoute = (char*) calloc((size_t) routesSize, 1);\n    int total = 0;\n    for (int r = 0; r < routesSize; r++) total += routesColSize[r];\n    int* q = (int*) malloc((size_t) (total + 1) * sizeof(int));\n    int qh = 0, qt = 0;\n    seenStop[source] = 1;\n    q[qt++] = source;\n    int buses = 0, ans = -1;\n    while (qh < qt && ans < 0) {\n        buses++;\n        int end = qt;\n        while (qh < end && ans < 0) {\n            int stop = q[qh++];\n            for (int r = 0; r < routesSize && ans < 0; r++) {\n                if (usedRoute[r]) continue;\n                int onIt = 0;\n                for (int i = 0; i < routesColSize[r]; i++) {\n                    if (routes[r][i] == stop) { onIt = 1; break; }\n                }\n                if (!onIt) continue;\n                usedRoute[r] = 1;\n                for (int i = 0; i < routesColSize[r]; i++) {\n                    int s = routes[r][i];\n                    if (s == target) { ans = buses; break; }\n                    if (seenStop[s]) continue;\n                    seenStop[s] = 1;\n                    q[qt++] = s;\n                }\n            }\n        }\n    }\n    free(seenStop);\n    free(usedRoute);\n    free(q);\n    return ans;\n}`,
        csharp: `public static int NumBusesToDestination(int[][] routes, int source, int target)\n{\n    if (source == target) return 0;\n    var stopToRoutes = new Dictionary<int, List<int>>();\n    for (int r = 0; r < routes.Length; r++)\n    {\n        foreach (var s in routes[r])\n        {\n            if (!stopToRoutes.TryGetValue(s, out var list))\n            {\n                list = new List<int>();\n                stopToRoutes[s] = list;\n            }\n            list.Add(r);\n        }\n    }\n    var usedRoute = new bool[routes.Length];\n    var seenStop = new HashSet<int> { source };\n    var q = new List<int> { source };\n    int buses = 0;\n    while (q.Count > 0)\n    {\n        buses++;\n        var nq = new List<int>();\n        foreach (var stop in q)\n        {\n            if (!stopToRoutes.TryGetValue(stop, out var rs)) continue;\n            foreach (var r in rs)\n            {\n                if (usedRoute[r]) continue;\n                usedRoute[r] = true;\n                foreach (var s in routes[r])\n                {\n                    if (s == target) return buses;\n                    if (!seenStop.Add(s)) continue;\n                    nq.Add(s);\n                }\n            }\n        }\n        q = nq;\n    }\n    return -1;\n}`,
        go: `func numBusesToDestination(routes [][]int, source int, target int) int {\n\tif source == target {\n\t\treturn 0\n\t}\n\tstopToRoutes := map[int][]int{}\n\tfor r, route := range routes {\n\t\tfor _, s := range route {\n\t\t\tstopToRoutes[s] = append(stopToRoutes[s], r)\n\t\t}\n\t}\n\tusedRoute := make([]bool, len(routes))\n\tseenStop := map[int]bool{source: true}\n\tq := []int{source}\n\tbuses := 0\n\tfor len(q) > 0 {\n\t\tbuses++\n\t\tnq := []int{}\n\t\tfor _, stop := range q {\n\t\t\tfor _, r := range stopToRoutes[stop] {\n\t\t\t\tif usedRoute[r] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tusedRoute[r] = true\n\t\t\t\tfor _, s := range routes[r] {\n\t\t\t\t\tif s == target {\n\t\t\t\t\t\treturn buses\n\t\t\t\t\t}\n\t\t\t\t\tif seenStop[s] {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tseenStop[s] = true\n\t\t\t\t\tnq = append(nq, s)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tq = nq\n\t}\n\treturn -1\n}`,
        kotlin: `fun numBusesToDestination(routes: Array<IntArray>, source: Int, target: Int): Int {\n    if (source == target) return 0\n    val stopToRoutes = HashMap<Int, ArrayList<Int>>()\n    for (r in routes.indices) {\n        for (s in routes[r]) stopToRoutes.getOrPut(s) { ArrayList() }.add(r)\n    }\n    val usedRoute = BooleanArray(routes.size)\n    val seenStop = HashSet<Int>()\n    seenStop.add(source)\n    var q = arrayListOf(source)\n    var buses = 0\n    while (q.isNotEmpty()) {\n        buses++\n        val nq = ArrayList<Int>()\n        for (stop in q) {\n            val rs = stopToRoutes[stop] ?: continue\n            for (r in rs) {\n                if (usedRoute[r]) continue\n                usedRoute[r] = true\n                for (s in routes[r]) {\n                    if (s == target) return buses\n                    if (!seenStop.add(s)) continue\n                    nq.add(s)\n                }\n            }\n        }\n        q = nq\n    }\n    return -1\n}`,
        swift: `func numBusesToDestination(_ routes: [[Int]], _ source: Int, _ target: Int) -> Int {\n    if source == target { return 0 }\n    var stopToRoutes = [Int: [Int]]()\n    for r in 0..<routes.count {\n        for s in routes[r] { stopToRoutes[s, default: []].append(r) }\n    }\n    var usedRoute = [Bool](repeating: false, count: routes.count)\n    var seenStop = Set<Int>([source])\n    var q = [source]\n    var buses = 0\n    while !q.isEmpty {\n        buses += 1\n        var nq = [Int]()\n        for stop in q {\n            guard let rs = stopToRoutes[stop] else { continue }\n            for r in rs {\n                if usedRoute[r] { continue }\n                usedRoute[r] = true\n                for s in routes[r] {\n                    if s == target { return buses }\n                    if !seenStop.insert(s).inserted { continue }\n                    nq.append(s)\n                }\n            }\n        }\n        q = nq\n    }\n    return -1\n}`,
        rust: `use std::collections::{HashMap, HashSet};\n\nfn numBusesToDestination(routes: Vec<Vec<i32>>, source: i32, target: i32) -> i32 {\n    if source == target {\n        return 0;\n    }\n    let mut stop_to_routes: HashMap<i32, Vec<usize>> = HashMap::new();\n    for r in 0..routes.len() {\n        for &s in routes[r].iter() {\n            stop_to_routes.entry(s).or_insert_with(Vec::new).push(r);\n        }\n    }\n    let mut used_route = vec![false; routes.len()];\n    let mut seen_stop: HashSet<i32> = HashSet::new();\n    seen_stop.insert(source);\n    let mut q = vec![source];\n    let mut buses = 0i32;\n    while !q.is_empty() {\n        buses += 1;\n        let mut nq: Vec<i32> = Vec::new();\n        for &stop in q.iter() {\n            if let Some(rs) = stop_to_routes.get(&stop) {\n                for &r in rs.iter() {\n                    if used_route[r] {\n                        continue;\n                    }\n                    used_route[r] = true;\n                    for &s in routes[r].iter() {\n                        if s == target {\n                            return buses;\n                        }\n                        if !seen_stop.insert(s) {\n                            continue;\n                        }\n                        nq.push(s);\n                    }\n                }\n            }\n        }\n        q = nq;\n    }\n    -1\n}`,
        php: `function numBusesToDestination($routes, $source, $target) {\n    if ($source === $target) return 0;\n    $stopToRoutes = [];\n    foreach ($routes as $r => $route) {\n        foreach ($route as $s) $stopToRoutes[$s][] = $r;\n    }\n    $usedRoute = array_fill(0, count($routes), false);\n    $seenStop = [$source => true];\n    $q = [$source];\n    $buses = 0;\n    while (count($q) > 0) {\n        $buses++;\n        $nq = [];\n        foreach ($q as $stop) {\n            if (!isset($stopToRoutes[$stop])) continue;\n            foreach ($stopToRoutes[$stop] as $r) {\n                if ($usedRoute[$r]) continue;\n                $usedRoute[$r] = true;\n                foreach ($routes[$r] as $s) {\n                    if ($s === $target) return $buses;\n                    if (isset($seenStop[$s])) continue;\n                    $seenStop[$s] = true;\n                    $nq[] = $s;\n                }\n            }\n        }\n        $q = $nq;\n    }\n    return -1;\n}`,
        ruby: `def numBusesToDestination(routes, source, target)\n  return 0 if source == target\n  stop_to_routes = Hash.new { |h, k| h[k] = [] }\n  routes.each_with_index do |route, r|\n    route.each { |s| stop_to_routes[s] << r }\n  end\n  used_route = Array.new(routes.length, false)\n  seen_stop = { source => true }\n  q = [source]\n  buses = 0\n  until q.empty?\n    buses += 1\n    nq = []\n    q.each do |stop|\n      next unless stop_to_routes.key?(stop)\n      stop_to_routes[stop].each do |r|\n        next if used_route[r]\n        used_route[r] = true\n        routes[r].each do |s|\n          return buses if s == target\n          next if seen_stop[s]\n          seen_stop[s] = true\n          nq << s\n        end\n      end\n    end\n    q = nq\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Critical Connections in a Network (LC 1192) ─────────────────
  (() => {
    const ref = (n: number, connections: number[][]) => {
      const head = new Array(n).fill(-1);
      const cap = Math.max(1, connections.length * 2);
      const nxt = new Array(cap).fill(-1);
      const to = new Array(cap).fill(0);
      let ec = 0;
      for (let i = 0; i < connections.length; i++) {
        const u = connections[i][0], v = connections[i][1];
        to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec++;
        to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec++;
      }
      const disc = new Array(n).fill(-1);
      const low = new Array(n).fill(0);
      let timer = 0;
      const bridges: number[][] = [];
      const stackNode: number[] = [], stackEdge: number[] = [], stackIter: number[] = [];
      for (let s = 0; s < n; s++) {
        if (disc[s] >= 0) continue;
        disc[s] = low[s] = timer++;
        stackNode.push(s);
        stackEdge.push(-1);
        stackIter.push(head[s]);
        while (stackNode.length > 0) {
          const u = stackNode[stackNode.length - 1];
          const e = stackIter[stackIter.length - 1];
          if (e >= 0) {
            stackIter[stackIter.length - 1] = nxt[e];
            const inEdge = stackEdge[stackEdge.length - 1];
            // Skip the reverse of the edge we entered on, but not a second
            // parallel edge to the same neighbour.
            if (inEdge >= 0 && (e ^ 1) === inEdge) continue;
            const v = to[e];
            if (disc[v] < 0) {
              disc[v] = low[v] = timer++;
              stackNode.push(v);
              stackEdge.push(e);
              stackIter.push(head[v]);
            } else if (disc[v] < low[u]) {
              low[u] = disc[v];
            }
          } else {
            stackNode.pop();
            stackEdge.pop();
            stackIter.pop();
            if (stackNode.length > 0) {
              const p = stackNode[stackNode.length - 1];
              if (low[u] < low[p]) low[p] = low[u];
              if (low[u] > disc[p]) {
                bridges.push([Math.min(p, u), Math.max(p, u)]);
              }
            }
          }
        }
      }
      bridges.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]));
      return bridges;
    };
    return {
      slug: "critical-connections-in-a-network",
      title: "Critical Connections in a Network",
      difficulty: "HARD" as const,
      tags: ["Graph", "Depth-First Search", "Biconnected Component", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "criticalConnections", params: [{ name: "n", type: "int" as const }, { name: "connections", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "`n` CodeKairo servers numbered `0 … n - 1` are joined by undirected `connections`, forming one network in which every server can reach every other.\n\nA connection is **critical** if removing it leaves some server unable to reach some other. Return all critical connections, each written as `[smaller, larger]`, sorted in increasing order.",
        [
          { in: "n = 4, connections = [[0,1],[1,2],[2,0],[1,3]]", out: "[[1,3]]", note: "The triangle `0-1-2` survives any single removal; the link to server 3 does not." },
          { in: "n = 2, connections = [[0,1]]", out: "[[0,1]]" },
          { in: "n = 3, connections = [[0,1],[1,2],[2,0]]", out: "[]", note: "A cycle has no critical connection." },
        ],
        ["2 <= n <= 10^5", "n - 1 <= connections.length <= 10^5", "0 <= connections[i][0], connections[i][1] < n", "connections[i][0] != connections[i][1]", "There are no repeated connections.", "The answer is returned as [smaller, larger] pairs in increasing order."]),
      hints: [
        "A critical connection is a **bridge**: an edge that lies on no cycle.",
        "Depth-first search and record, for each node, the earliest discovery time reachable from its subtree.",
        "Edge `(p, u)` is a bridge exactly when nothing in `u`'s subtree can reach back past `p`.",
      ],
      editorial: explain({
        idea: "Tarjan's bridge algorithm. During a depth-first search, give each node a discovery time `disc` and a value `low` — the earliest discovery time reachable from its subtree using at most one back edge. The tree edge `(p, u)` is a bridge when `low[u] > disc[p]`.",
        steps: [
          "Depth-first search from each unvisited node, stamping `disc` and initialising `low` to it.",
          "On a tree edge to `v`, recurse and then `low[p] = min(low[p], low[v])`.",
          "On a back edge to an already-seen `v`, `low[u] = min(low[u], disc[v])`.",
          "Record `(p, u)` when `low[u] > disc[p]`, then sort the results.",
        ],
        why: "`low[u] > disc[p]` says nothing under `u` has a second way back to `p` or above it, so cutting that edge disconnects the subtree — which is exactly what \"critical\" means. The one subtlety is skipping the edge you arrived on: skipping by *neighbour* would wrongly ignore a genuine parallel edge, so the search skips the specific edge index instead. The traversal here is written with an explicit stack because `n` reaches 100 000 and a path-shaped network would overflow the call stack.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Comparing `low[u]` against `low[p]` instead of `disc[p]` misses bridges.",
          "Skipping every edge back to the parent node hides parallel edges; skip the one edge index.",
          "The back-edge update uses `disc[v]`, not `low[v]`.",
        ],
      }),
      examples: [
        { input: "4\n[[0,1],[1,2],[2,0],[1,3]]", expectedOutput: "[[1,3]]" },
        { input: "2\n[[0,1]]", expectedOutput: "[[0,1]]" },
        { input: "3\n[[0,1],[1,2],[2,0]]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        // A random spanning tree keeps the network connected, then extra edges
        // create the cycles that make some links non-critical.
        const n = ri(rng, 2, 10);
        const seen = new Set<number>();
        const connections: number[][] = [];
        for (let v = 1; v < n; v++) {
          const p = ri(rng, 0, v - 1);
          seen.add(Math.min(p, v) * n + Math.max(p, v));
          connections.push([p, v]);
        }
        const extra = ri(rng, 0, 4);
        for (let k = 0; k < extra; k++) {
          const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          if (a === b) continue;
          const key = Math.min(a, b) * n + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          connections.push([a, b]);
        }
        return { input: `${n}\n${fmtIntMat(connections)}`, expectedOutput: fmtIntMat(ref(n, connections)) };
      },
      solutions: {
        python: `from typing import List\nimport sys\n\ndef criticalConnections(n: int, connections: List[List[int]]) -> List[List[int]]:\n    head = [-1] * n\n    cap = max(1, len(connections) * 2)\n    nxt = [-1] * cap\n    to = [0] * cap\n    ec = 0\n    for u, v in connections:\n        to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec += 1\n        to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec += 1\n    disc = [-1] * n\n    low = [0] * n\n    timer = 0\n    bridges = []\n    for s in range(n):\n        if disc[s] >= 0:\n            continue\n        disc[s] = low[s] = timer\n        timer += 1\n        stack = [(s, -1, head[s])]\n        while stack:\n            u, in_edge, e = stack[-1]\n            if e >= 0:\n                stack[-1] = (u, in_edge, nxt[e])\n                if in_edge >= 0 and (e ^ 1) == in_edge:\n                    continue\n                v = to[e]\n                if disc[v] < 0:\n                    disc[v] = low[v] = timer\n                    timer += 1\n                    stack.append((v, e, head[v]))\n                elif disc[v] < low[u]:\n                    low[u] = disc[v]\n            else:\n                stack.pop()\n                if stack:\n                    p = stack[-1][0]\n                    if low[u] < low[p]:\n                        low[p] = low[u]\n                    if low[u] > disc[p]:\n                        bridges.append([min(p, u), max(p, u)])\n    bridges.sort()\n    return bridges`,
        javascript: `var criticalConnections = function(n, connections) {\n    var i;\n    var head = [];\n    for (i = 0; i < n; i++) head.push(-1);\n    var cap = Math.max(1, connections.length * 2);\n    var nxt = [], to = [];\n    for (i = 0; i < cap; i++) { nxt.push(-1); to.push(0); }\n    var ec = 0;\n    for (i = 0; i < connections.length; i++) {\n        var u0 = connections[i][0], v0 = connections[i][1];\n        to[ec] = v0; nxt[ec] = head[u0]; head[u0] = ec; ec++;\n        to[ec] = u0; nxt[ec] = head[v0]; head[v0] = ec; ec++;\n    }\n    var disc = [], low = [];\n    for (i = 0; i < n; i++) { disc.push(-1); low.push(0); }\n    var timer = 0;\n    var bridges = [];\n    var stackNode = [], stackEdge = [], stackIter = [];\n    for (var s = 0; s < n; s++) {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        stackNode.push(s);\n        stackEdge.push(-1);\n        stackIter.push(head[s]);\n        while (stackNode.length > 0) {\n            var u = stackNode[stackNode.length - 1];\n            var e = stackIter[stackIter.length - 1];\n            if (e >= 0) {\n                stackIter[stackIter.length - 1] = nxt[e];\n                var inEdge = stackEdge[stackEdge.length - 1];\n                if (inEdge >= 0 && (e ^ 1) === inEdge) continue;\n                var v = to[e];\n                if (disc[v] < 0) {\n                    disc[v] = low[v] = timer++;\n                    stackNode.push(v);\n                    stackEdge.push(e);\n                    stackIter.push(head[v]);\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v];\n                }\n            } else {\n                stackNode.pop();\n                stackEdge.pop();\n                stackIter.pop();\n                if (stackNode.length > 0) {\n                    var p = stackNode[stackNode.length - 1];\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p]) {\n                        bridges.push([Math.min(p, u), Math.max(p, u)]);\n                    }\n                }\n            }\n        }\n    }\n    bridges.sort(function(x, y) { return (x[0] - y[0]) || (x[1] - y[1]); });\n    return bridges;\n};`,
        typescript: `function criticalConnections(n: number, connections: number[][]): number[][] {\n    var i: number;\n    var head: number[] = [];\n    for (i = 0; i < n; i++) head.push(-1);\n    var cap = Math.max(1, connections.length * 2);\n    var nxt: number[] = [], to: number[] = [];\n    for (i = 0; i < cap; i++) { nxt.push(-1); to.push(0); }\n    var ec = 0;\n    for (i = 0; i < connections.length; i++) {\n        var u0 = connections[i][0], v0 = connections[i][1];\n        to[ec] = v0; nxt[ec] = head[u0]; head[u0] = ec; ec++;\n        to[ec] = u0; nxt[ec] = head[v0]; head[v0] = ec; ec++;\n    }\n    var disc: number[] = [], low: number[] = [];\n    for (i = 0; i < n; i++) { disc.push(-1); low.push(0); }\n    var timer = 0;\n    var bridges: number[][] = [];\n    var stackNode: number[] = [], stackEdge: number[] = [], stackIter: number[] = [];\n    for (var s = 0; s < n; s++) {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        stackNode.push(s);\n        stackEdge.push(-1);\n        stackIter.push(head[s]);\n        while (stackNode.length > 0) {\n            var u = stackNode[stackNode.length - 1];\n            var e = stackIter[stackIter.length - 1];\n            if (e >= 0) {\n                stackIter[stackIter.length - 1] = nxt[e];\n                var inEdge = stackEdge[stackEdge.length - 1];\n                if (inEdge >= 0 && (e ^ 1) === inEdge) continue;\n                var v = to[e];\n                if (disc[v] < 0) {\n                    disc[v] = low[v] = timer++;\n                    stackNode.push(v);\n                    stackEdge.push(e);\n                    stackIter.push(head[v]);\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v];\n                }\n            } else {\n                stackNode.pop();\n                stackEdge.pop();\n                stackIter.pop();\n                if (stackNode.length > 0) {\n                    var p = stackNode[stackNode.length - 1];\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p]) {\n                        bridges.push([Math.min(p, u), Math.max(p, u)]);\n                    }\n                }\n            }\n        }\n    }\n    bridges.sort(function(x: number[], y: number[]) { return (x[0] - y[0]) || (x[1] - y[1]); });\n    return bridges;\n}`,
        java: `public static int[][] criticalConnections(int n, int[][] connections) {\n    int[] head = new int[n];\n    Arrays.fill(head, -1);\n    int cap = Math.max(1, connections.length * 2);\n    int[] nxt = new int[cap];\n    int[] to = new int[cap];\n    int ec = 0;\n    for (int[] c : connections) {\n        to[ec] = c[1]; nxt[ec] = head[c[0]]; head[c[0]] = ec; ec++;\n        to[ec] = c[0]; nxt[ec] = head[c[1]]; head[c[1]] = ec; ec++;\n    }\n    int[] disc = new int[n];\n    int[] low = new int[n];\n    Arrays.fill(disc, -1);\n    int timer = 0;\n    List<int[]> bridges = new ArrayList<>();\n    int[] stackNode = new int[n + 1];\n    int[] stackEdge = new int[n + 1];\n    int[] stackIter = new int[n + 1];\n    for (int s = 0; s < n; s++) {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        int top = 0;\n        stackNode[top] = s;\n        stackEdge[top] = -1;\n        stackIter[top] = head[s];\n        top++;\n        while (top > 0) {\n            int u = stackNode[top - 1];\n            int e = stackIter[top - 1];\n            if (e >= 0) {\n                stackIter[top - 1] = nxt[e];\n                int inEdge = stackEdge[top - 1];\n                if (inEdge >= 0 && (e ^ 1) == inEdge) continue;\n                int v = to[e];\n                if (disc[v] < 0) {\n                    disc[v] = low[v] = timer++;\n                    stackNode[top] = v;\n                    stackEdge[top] = e;\n                    stackIter[top] = head[v];\n                    top++;\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v];\n                }\n            } else {\n                top--;\n                if (top > 0) {\n                    int p = stackNode[top - 1];\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p]) {\n                        bridges.add(new int[] { Math.min(p, u), Math.max(p, u) });\n                    }\n                }\n            }\n        }\n    }\n    bridges.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);\n    return bridges.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {\n    vector<int> head(n, -1);\n    int cap = max(1, (int) connections.size() * 2);\n    vector<int> nxt(cap, -1), to(cap, 0);\n    int ec = 0;\n    for (auto& c : connections) {\n        to[ec] = c[1]; nxt[ec] = head[c[0]]; head[c[0]] = ec; ec++;\n        to[ec] = c[0]; nxt[ec] = head[c[1]]; head[c[1]] = ec; ec++;\n    }\n    vector<int> disc(n, -1), low(n, 0);\n    int timer = 0;\n    vector<vector<int>> bridges;\n    vector<int> stackNode, stackEdge, stackIter;\n    for (int s = 0; s < n; s++) {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        stackNode.push_back(s);\n        stackEdge.push_back(-1);\n        stackIter.push_back(head[s]);\n        while (!stackNode.empty()) {\n            int u = stackNode.back();\n            int e = stackIter.back();\n            if (e >= 0) {\n                stackIter.back() = nxt[e];\n                int inEdge = stackEdge.back();\n                if (inEdge >= 0 && (e ^ 1) == inEdge) continue;\n                int v = to[e];\n                if (disc[v] < 0) {\n                    disc[v] = low[v] = timer++;\n                    stackNode.push_back(v);\n                    stackEdge.push_back(e);\n                    stackIter.push_back(head[v]);\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v];\n                }\n            } else {\n                stackNode.pop_back();\n                stackEdge.pop_back();\n                stackIter.pop_back();\n                if (!stackNode.empty()) {\n                    int p = stackNode.back();\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p]) {\n                        bridges.push_back({ min(p, u), max(p, u) });\n                    }\n                }\n            }\n        }\n    }\n    sort(bridges.begin(), bridges.end());\n    return bridges;\n}`,
        c: `static int ccCmp(const void* a, const void* b) {\n    int* const* x = (int* const*) a;\n    int* const* y = (int* const*) b;\n    if ((*x)[0] != (*y)[0]) return (*x)[0] - (*y)[0];\n    return (*x)[1] - (*y)[1];\n}\n\nint** criticalConnections(int n, int** connections, int connectionsSize, int* connectionsColSize, int* returnSize, int** returnColumnSizes) {\n    (void) connectionsColSize;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = connectionsSize * 2 > 0 ? connectionsSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < connectionsSize; i++) {\n        int u = connections[i][0], v = connections[i][1];\n        to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec++;\n        to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec++;\n    }\n    int* disc = (int*) malloc((size_t) n * sizeof(int));\n    int* low = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) disc[i] = -1;\n    int timer = 0, cnt = 0;\n    int** bridges = (int**) malloc((size_t) (connectionsSize > 0 ? connectionsSize : 1) * sizeof(int*));\n    int* sNode = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int* sEdge = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int* sIter = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int s = 0; s < n; s++) {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        int top = 0;\n        sNode[top] = s; sEdge[top] = -1; sIter[top] = head[s]; top++;\n        while (top > 0) {\n            int u = sNode[top - 1];\n            int e = sIter[top - 1];\n            if (e >= 0) {\n                sIter[top - 1] = nxt[e];\n                int inEdge = sEdge[top - 1];\n                if (inEdge >= 0 && (e ^ 1) == inEdge) continue;\n                int v = to[e];\n                if (disc[v] < 0) {\n                    disc[v] = low[v] = timer++;\n                    sNode[top] = v; sEdge[top] = e; sIter[top] = head[v]; top++;\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v];\n                }\n            } else {\n                top--;\n                if (top > 0) {\n                    int p = sNode[top - 1];\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p]) {\n                        bridges[cnt] = (int*) malloc(2 * sizeof(int));\n                        bridges[cnt][0] = p < u ? p : u;\n                        bridges[cnt][1] = p < u ? u : p;\n                        cnt++;\n                    }\n                }\n            }\n        }\n    }\n    qsort(bridges, (size_t) cnt, sizeof(int*), ccCmp);\n    *returnColumnSizes = (int*) malloc((size_t) (cnt > 0 ? cnt : 1) * sizeof(int));\n    for (int i = 0; i < cnt; i++) (*returnColumnSizes)[i] = 2;\n    free(head); free(nxt); free(to); free(disc); free(low);\n    free(sNode); free(sEdge); free(sIter);\n    *returnSize = cnt;\n    return bridges;\n}`,
        csharp: `public static int[][] CriticalConnections(int n, int[][] connections)\n{\n    var head = new int[n];\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = Math.Max(1, connections.Length * 2);\n    var nxt = new int[cap];\n    var to = new int[cap];\n    int ec = 0;\n    foreach (var c in connections)\n    {\n        to[ec] = c[1]; nxt[ec] = head[c[0]]; head[c[0]] = ec; ec++;\n        to[ec] = c[0]; nxt[ec] = head[c[1]]; head[c[1]] = ec; ec++;\n    }\n    var disc = new int[n];\n    var low = new int[n];\n    for (int i = 0; i < n; i++) disc[i] = -1;\n    int timer = 0;\n    var bridges = new List<int[]>();\n    var sNode = new int[n + 1];\n    var sEdge = new int[n + 1];\n    var sIter = new int[n + 1];\n    for (int s = 0; s < n; s++)\n    {\n        if (disc[s] >= 0) continue;\n        disc[s] = low[s] = timer++;\n        int top = 0;\n        sNode[top] = s; sEdge[top] = -1; sIter[top] = head[s]; top++;\n        while (top > 0)\n        {\n            int u = sNode[top - 1];\n            int e = sIter[top - 1];\n            if (e >= 0)\n            {\n                sIter[top - 1] = nxt[e];\n                int inEdge = sEdge[top - 1];\n                if (inEdge >= 0 && (e ^ 1) == inEdge) continue;\n                int v = to[e];\n                if (disc[v] < 0)\n                {\n                    disc[v] = low[v] = timer++;\n                    sNode[top] = v; sEdge[top] = e; sIter[top] = head[v]; top++;\n                }\n                else if (disc[v] < low[u])\n                {\n                    low[u] = disc[v];\n                }\n            }\n            else\n            {\n                top--;\n                if (top > 0)\n                {\n                    int p = sNode[top - 1];\n                    if (low[u] < low[p]) low[p] = low[u];\n                    if (low[u] > disc[p])\n                    {\n                        bridges.Add(new int[] { Math.Min(p, u), Math.Max(p, u) });\n                    }\n                }\n            }\n        }\n    }\n    bridges.Sort((a, b) => a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);\n    return bridges.ToArray();\n}`,
        go: `func criticalConnections(n int, connections [][]int) [][]int {\n\thead := make([]int, n)\n\tfor i := range head {\n\t\thead[i] = -1\n\t}\n\tcap2 := len(connections) * 2\n\tif cap2 < 1 {\n\t\tcap2 = 1\n\t}\n\tnxt := make([]int, cap2)\n\tto := make([]int, cap2)\n\tec := 0\n\tfor _, c := range connections {\n\t\tto[ec] = c[1]\n\t\tnxt[ec] = head[c[0]]\n\t\thead[c[0]] = ec\n\t\tec++\n\t\tto[ec] = c[0]\n\t\tnxt[ec] = head[c[1]]\n\t\thead[c[1]] = ec\n\t\tec++\n\t}\n\tdisc := make([]int, n)\n\tlow := make([]int, n)\n\tfor i := range disc {\n\t\tdisc[i] = -1\n\t}\n\ttimer := 0\n\tbridges := [][]int{}\n\tsNode := []int{}\n\tsEdge := []int{}\n\tsIter := []int{}\n\tfor s := 0; s < n; s++ {\n\t\tif disc[s] >= 0 {\n\t\t\tcontinue\n\t\t}\n\t\tdisc[s] = timer\n\t\tlow[s] = timer\n\t\ttimer++\n\t\tsNode = append(sNode, s)\n\t\tsEdge = append(sEdge, -1)\n\t\tsIter = append(sIter, head[s])\n\t\tfor len(sNode) > 0 {\n\t\t\tu := sNode[len(sNode)-1]\n\t\t\te := sIter[len(sIter)-1]\n\t\t\tif e >= 0 {\n\t\t\t\tsIter[len(sIter)-1] = nxt[e]\n\t\t\t\tinEdge := sEdge[len(sEdge)-1]\n\t\t\t\tif inEdge >= 0 && (e^1) == inEdge {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tv := to[e]\n\t\t\t\tif disc[v] < 0 {\n\t\t\t\t\tdisc[v] = timer\n\t\t\t\t\tlow[v] = timer\n\t\t\t\t\ttimer++\n\t\t\t\t\tsNode = append(sNode, v)\n\t\t\t\t\tsEdge = append(sEdge, e)\n\t\t\t\t\tsIter = append(sIter, head[v])\n\t\t\t\t} else if disc[v] < low[u] {\n\t\t\t\t\tlow[u] = disc[v]\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\tsNode = sNode[:len(sNode)-1]\n\t\t\t\tsEdge = sEdge[:len(sEdge)-1]\n\t\t\t\tsIter = sIter[:len(sIter)-1]\n\t\t\t\tif len(sNode) > 0 {\n\t\t\t\t\tp := sNode[len(sNode)-1]\n\t\t\t\t\tif low[u] < low[p] {\n\t\t\t\t\t\tlow[p] = low[u]\n\t\t\t\t\t}\n\t\t\t\t\tif low[u] > disc[p] {\n\t\t\t\t\t\ta, b := p, u\n\t\t\t\t\t\tif a > b {\n\t\t\t\t\t\t\ta, b = b, a\n\t\t\t\t\t\t}\n\t\t\t\t\t\tbridges = append(bridges, []int{a, b})\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\tsort.Slice(bridges, func(i, j int) bool {\n\t\tif bridges[i][0] != bridges[j][0] {\n\t\t\treturn bridges[i][0] < bridges[j][0]\n\t\t}\n\t\treturn bridges[i][1] < bridges[j][1]\n\t})\n\treturn bridges\n}`,
        kotlin: `fun criticalConnections(n: Int, connections: Array<IntArray>): Array<IntArray> {\n    val head = IntArray(n) { -1 }\n    val cap = maxOf(1, connections.size * 2)\n    val nxt = IntArray(cap) { -1 }\n    val to = IntArray(cap)\n    var ec = 0\n    for (c in connections) {\n        to[ec] = c[1]; nxt[ec] = head[c[0]]; head[c[0]] = ec; ec++\n        to[ec] = c[0]; nxt[ec] = head[c[1]]; head[c[1]] = ec; ec++\n    }\n    val disc = IntArray(n) { -1 }\n    val low = IntArray(n)\n    var timer = 0\n    val bridges = ArrayList<IntArray>()\n    val sNode = IntArray(n + 1)\n    val sEdge = IntArray(n + 1)\n    val sIter = IntArray(n + 1)\n    for (s in 0 until n) {\n        if (disc[s] >= 0) continue\n        disc[s] = timer\n        low[s] = timer\n        timer++\n        var top = 0\n        sNode[top] = s; sEdge[top] = -1; sIter[top] = head[s]; top++\n        while (top > 0) {\n            val u = sNode[top - 1]\n            val e = sIter[top - 1]\n            if (e >= 0) {\n                sIter[top - 1] = nxt[e]\n                val inEdge = sEdge[top - 1]\n                if (inEdge >= 0 && (e xor 1) == inEdge) continue\n                val v = to[e]\n                if (disc[v] < 0) {\n                    disc[v] = timer\n                    low[v] = timer\n                    timer++\n                    sNode[top] = v; sEdge[top] = e; sIter[top] = head[v]; top++\n                } else if (disc[v] < low[u]) {\n                    low[u] = disc[v]\n                }\n            } else {\n                top--\n                if (top > 0) {\n                    val p = sNode[top - 1]\n                    if (low[u] < low[p]) low[p] = low[u]\n                    if (low[u] > disc[p]) {\n                        bridges.add(intArrayOf(minOf(p, u), maxOf(p, u)))\n                    }\n                }\n            }\n        }\n    }\n    bridges.sortWith(compareBy({ it[0] }, { it[1] }))\n    return bridges.toTypedArray()\n}`,
        swift: `func criticalConnections(_ n: Int, _ connections: [[Int]]) -> [[Int]] {\n    var head = [Int](repeating: -1, count: n)\n    let cap = max(1, connections.count * 2)\n    var nxt = [Int](repeating: -1, count: cap)\n    var to = [Int](repeating: 0, count: cap)\n    var ec = 0\n    for c in connections {\n        to[ec] = c[1]; nxt[ec] = head[c[0]]; head[c[0]] = ec; ec += 1\n        to[ec] = c[0]; nxt[ec] = head[c[1]]; head[c[1]] = ec; ec += 1\n    }\n    var disc = [Int](repeating: -1, count: n)\n    var low = [Int](repeating: 0, count: n)\n    var timer = 0\n    var bridges = [[Int]]()\n    var sNode = [Int](), sEdge = [Int](), sIter = [Int]()\n    for s in 0..<n {\n        if disc[s] >= 0 { continue }\n        disc[s] = timer\n        low[s] = timer\n        timer += 1\n        sNode.append(s); sEdge.append(-1); sIter.append(head[s])\n        while !sNode.isEmpty {\n            let u = sNode[sNode.count - 1]\n            let e = sIter[sIter.count - 1]\n            if e >= 0 {\n                sIter[sIter.count - 1] = nxt[e]\n                let inEdge = sEdge[sEdge.count - 1]\n                if inEdge >= 0 && (e ^ 1) == inEdge { continue }\n                let v = to[e]\n                if disc[v] < 0 {\n                    disc[v] = timer\n                    low[v] = timer\n                    timer += 1\n                    sNode.append(v); sEdge.append(e); sIter.append(head[v])\n                } else if disc[v] < low[u] {\n                    low[u] = disc[v]\n                }\n            } else {\n                sNode.removeLast(); sEdge.removeLast(); sIter.removeLast()\n                if !sNode.isEmpty {\n                    let p = sNode[sNode.count - 1]\n                    if low[u] < low[p] { low[p] = low[u] }\n                    if low[u] > disc[p] {\n                        bridges.append([min(p, u), max(p, u)])\n                    }\n                }\n            }\n        }\n    }\n    bridges.sort { $0[0] != $1[0] ? $0[0] < $1[0] : $0[1] < $1[1] }\n    return bridges\n}`,
        rust: `fn criticalConnections(n: i32, connections: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let n = n as usize;\n    let mut head = vec![-1i32; n];\n    let cap = std::cmp::max(1, connections.len() * 2);\n    let mut nxt = vec![-1i32; cap];\n    let mut to = vec![0usize; cap];\n    let mut ec = 0i32;\n    for c in connections.iter() {\n        let (u, v) = (c[0] as usize, c[1] as usize);\n        to[ec as usize] = v;\n        nxt[ec as usize] = head[u];\n        head[u] = ec;\n        ec += 1;\n        to[ec as usize] = u;\n        nxt[ec as usize] = head[v];\n        head[v] = ec;\n        ec += 1;\n    }\n    let mut disc = vec![-1i32; n];\n    let mut low = vec![0i32; n];\n    let mut timer = 0i32;\n    let mut bridges: Vec<Vec<i32>> = Vec::new();\n    let mut s_node: Vec<usize> = Vec::new();\n    let mut s_edge: Vec<i32> = Vec::new();\n    let mut s_iter: Vec<i32> = Vec::new();\n    for s in 0..n {\n        if disc[s] >= 0 {\n            continue;\n        }\n        disc[s] = timer;\n        low[s] = timer;\n        timer += 1;\n        s_node.push(s);\n        s_edge.push(-1);\n        s_iter.push(head[s]);\n        while !s_node.is_empty() {\n            let u = s_node[s_node.len() - 1];\n            let e = s_iter[s_iter.len() - 1];\n            if e >= 0 {\n                let last = s_iter.len() - 1;\n                s_iter[last] = nxt[e as usize];\n                let in_edge = s_edge[s_edge.len() - 1];\n                if in_edge >= 0 && (e ^ 1) == in_edge {\n                    continue;\n                }\n                let v = to[e as usize];\n                if disc[v] < 0 {\n                    disc[v] = timer;\n                    low[v] = timer;\n                    timer += 1;\n                    s_node.push(v);\n                    s_edge.push(e);\n                    s_iter.push(head[v]);\n                } else if disc[v] < low[u] {\n                    low[u] = disc[v];\n                }\n            } else {\n                s_node.pop();\n                s_edge.pop();\n                s_iter.pop();\n                if !s_node.is_empty() {\n                    let p = s_node[s_node.len() - 1];\n                    if low[u] < low[p] {\n                        low[p] = low[u];\n                    }\n                    if low[u] > disc[p] {\n                        let a = std::cmp::min(p, u) as i32;\n                        let b = std::cmp::max(p, u) as i32;\n                        bridges.push(vec![a, b]);\n                    }\n                }\n            }\n        }\n    }\n    bridges.sort();\n    bridges\n}`,
        php: `function criticalConnections($n, $connections) {\n    $head = array_fill(0, $n, -1);\n    $cap = max(1, count($connections) * 2);\n    $nxt = array_fill(0, $cap, -1);\n    $to = array_fill(0, $cap, 0);\n    $ec = 0;\n    foreach ($connections as $c) {\n        $to[$ec] = $c[1]; $nxt[$ec] = $head[$c[0]]; $head[$c[0]] = $ec; $ec++;\n        $to[$ec] = $c[0]; $nxt[$ec] = $head[$c[1]]; $head[$c[1]] = $ec; $ec++;\n    }\n    $disc = array_fill(0, $n, -1);\n    $low = array_fill(0, $n, 0);\n    $timer = 0;\n    $bridges = [];\n    for ($s = 0; $s < $n; $s++) {\n        if ($disc[$s] >= 0) continue;\n        $disc[$s] = $low[$s] = $timer++;\n        $sNode = [$s];\n        $sEdge = [-1];\n        $sIter = [$head[$s]];\n        while (count($sNode) > 0) {\n            $u = $sNode[count($sNode) - 1];\n            $e = $sIter[count($sIter) - 1];\n            if ($e >= 0) {\n                $sIter[count($sIter) - 1] = $nxt[$e];\n                $inEdge = $sEdge[count($sEdge) - 1];\n                if ($inEdge >= 0 && ($e ^ 1) === $inEdge) continue;\n                $v = $to[$e];\n                if ($disc[$v] < 0) {\n                    $disc[$v] = $low[$v] = $timer++;\n                    $sNode[] = $v;\n                    $sEdge[] = $e;\n                    $sIter[] = $head[$v];\n                } elseif ($disc[$v] < $low[$u]) {\n                    $low[$u] = $disc[$v];\n                }\n            } else {\n                array_pop($sNode);\n                array_pop($sEdge);\n                array_pop($sIter);\n                if (count($sNode) > 0) {\n                    $p = $sNode[count($sNode) - 1];\n                    if ($low[$u] < $low[$p]) $low[$p] = $low[$u];\n                    if ($low[$u] > $disc[$p]) {\n                        $bridges[] = [min($p, $u), max($p, $u)];\n                    }\n                }\n            }\n        }\n    }\n    usort($bridges, function($a, $b) {\n        return $a[0] !== $b[0] ? $a[0] - $b[0] : $a[1] - $b[1];\n    });\n    return $bridges;\n}`,
        ruby: `def criticalConnections(n, connections)\n  head = Array.new(n, -1)\n  cap = [1, connections.length * 2].max\n  nxt = Array.new(cap, -1)\n  to = Array.new(cap, 0)\n  ec = 0\n  connections.each do |u, v|\n    to[ec] = v; nxt[ec] = head[u]; head[u] = ec; ec += 1\n    to[ec] = u; nxt[ec] = head[v]; head[v] = ec; ec += 1\n  end\n  disc = Array.new(n, -1)\n  low = Array.new(n, 0)\n  timer = 0\n  bridges = []\n  (0...n).each do |s|\n    next if disc[s] >= 0\n    disc[s] = low[s] = timer\n    timer += 1\n    s_node = [s]\n    s_edge = [-1]\n    s_iter = [head[s]]\n    until s_node.empty?\n      u = s_node[-1]\n      e = s_iter[-1]\n      if e >= 0\n        s_iter[-1] = nxt[e]\n        in_edge = s_edge[-1]\n        next if in_edge >= 0 && (e ^ 1) == in_edge\n        v = to[e]\n        if disc[v] < 0\n          disc[v] = low[v] = timer\n          timer += 1\n          s_node << v\n          s_edge << e\n          s_iter << head[v]\n        elsif disc[v] < low[u]\n          low[u] = disc[v]\n        end\n      else\n        s_node.pop\n        s_edge.pop\n        s_iter.pop\n        unless s_node.empty?\n          p = s_node[-1]\n          low[p] = low[u] if low[u] < low[p]\n          bridges << [[p, u].min, [p, u].max] if low[u] > disc[p]\n        end\n      end\n    end\n  end\n  bridges.sort\nend`,
      },
    };
  })(),

  // ── Largest Component Size by Common Factor (LC 952) ────────────
  (() => {
    const ref = (nums: number[]) => {
      let mx = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
      const parent = Array.from({ length: mx + 1 }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      const uni = (a: number, b: number) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[rb] = ra;
      };
      for (let i = 0; i < nums.length; i++) {
        let x = nums[i];
        for (let p = 2; p * p <= x; p++) {
          if (x % p !== 0) continue;
          uni(nums[i], p);
          while (x % p === 0) x = Math.floor(x / p);
        }
        if (x > 1) uni(nums[i], x);
      }
      const count = new Map<number, number>();
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        const r = find(nums[i]);
        const c = (count.get(r) || 0) + 1;
        count.set(r, c);
        if (c > best) best = c;
      }
      return best;
    };
    return {
      slug: "largest-component-size-by-common-factor",
      title: "Largest Component Size by Common Factor",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Union Find", "Number Theory", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "largestComponentSize", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of **distinct** positive integers. Build a graph whose nodes are those numbers, joining two of them whenever they share a common factor greater than 1.\n\nReturn the size of the largest connected component.",
        [
          { in: "nums = [4,6,15,35]", out: "4", note: "`4-6` share 2, `6-15` share 3, `15-35` share 5 — one chain of four." },
          { in: "nums = [20,50,9,63]", out: "2", note: "`{20,50}` share 2 and 5; `{9,63}` share 3." },
          { in: "nums = [2,3,6,7,4,12,21,39]", out: "8" },
        ],
        ["1 <= nums.length <= 20000", "1 <= nums[i] <= 100000", "All the values of nums are unique."]),
      hints: [
        "Comparing every pair is `O(n²)` gcd calls — far too slow.",
        "Two numbers are connected exactly when they share a **prime** factor.",
        "So union each number with each of its prime factors, and let the primes act as the glue.",
      ],
      editorial: explain({
        idea: "Instead of joining numbers to numbers, join each number to its prime factors in a union-find. Two numbers sharing a prime then land in the same set automatically, and a final pass counts the numbers per set.",
        steps: [
          "Size the union-find to hold both the numbers and every prime up to the maximum.",
          "Factorise each number by trial division up to its square root, unioning it with each distinct prime.",
          "If a factor larger than the square root remains, it is prime; union with it too.",
          "Tally how many *input numbers* fall in each set and return the largest tally.",
        ],
        why: "Using primes as intermediaries replaces up to `n²` pairwise tests with `n · number-of-prime-factors` unions — and a number below 100 000 has at most six distinct primes. The final tally must count only the input numbers, never the prime helper nodes, which are scaffolding rather than members of the graph.",
        time: "O(n · √maxValue · α)",
        space: "O(maxValue)",
        pitfalls: [
          "Counting the prime nodes as members inflates every component.",
          "After dividing out the small primes, any remainder above 1 is itself a prime factor.",
          "`nums[i] == 1` has no prime factors and stays a component of size 1.",
        ],
      }),
      examples: [
        { input: "[4,6,15,35]", expectedOutput: "4" },
        { input: "[20,50,9,63]", expectedOutput: "2" },
        { input: "[2,3,6,7,4,12,21,39]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [20, 60, 200]);
        const pool = shuffle(rng, Array.from({ length: hi }, (_, i) => i + 1));
        const nums = pool.slice(0, ri(rng, 1, Math.min(14, hi)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestComponentSize(nums: List[int]) -> int:\n    mx = max(nums)\n    parent = list(range(mx + 1))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    def uni(a: int, b: int) -> None:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[rb] = ra\n\n    for v in nums:\n        x = v\n        p = 2\n        while p * p <= x:\n            if x % p == 0:\n                uni(v, p)\n                while x % p == 0:\n                    x //= p\n            p += 1\n        if x > 1:\n            uni(v, x)\n    count = {}\n    best = 0\n    for v in nums:\n        r = find(v)\n        count[r] = count.get(r, 0) + 1\n        best = max(best, count[r])\n    return best`,
        javascript: `var largestComponentSize = function(nums) {\n    var i, mx = 0;\n    for (i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];\n    var parent = [];\n    for (i = 0; i <= mx; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var uni = function(a, b) {\n        var ra = find(a), rb = find(b);\n        if (ra !== rb) parent[rb] = ra;\n    };\n    for (i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        for (var p = 2; p * p <= x; p++) {\n            if (x % p !== 0) continue;\n            uni(nums[i], p);\n            while (x % p === 0) x = Math.floor(x / p);\n        }\n        if (x > 1) uni(nums[i], x);\n    }\n    var count = new Map();\n    var best = 0;\n    for (i = 0; i < nums.length; i++) {\n        var r = find(nums[i]);\n        var cur = count.get(r);\n        var c = (cur === undefined ? 0 : cur) + 1;\n        count.set(r, c);\n        if (c > best) best = c;\n    }\n    return best;\n};`,
        typescript: `function largestComponentSize(nums: number[]): number {\n    var i: number, mx = 0;\n    for (i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];\n    var parent: number[] = [];\n    for (i = 0; i <= mx; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var uni = function(a: number, b: number): void {\n        var ra = find(a), rb = find(b);\n        if (ra !== rb) parent[rb] = ra;\n    };\n    for (i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        for (var p = 2; p * p <= x; p++) {\n            if (x % p !== 0) continue;\n            uni(nums[i], p);\n            while (x % p === 0) x = Math.floor(x / p);\n        }\n        if (x > 1) uni(nums[i], x);\n    }\n    var count: { [k: string]: number } = {};\n    var best = 0;\n    for (i = 0; i < nums.length; i++) {\n        var key = "" + find(nums[i]);\n        var cur = count[key];\n        var c = (cur === undefined ? 0 : cur) + 1;\n        count[key] = c;\n        if (c > best) best = c;\n    }\n    return best;\n}`,
        java: `private static int[] lcParent;\n\nprivate static int lcFind(int x) {\n    while (lcParent[x] != x) {\n        lcParent[x] = lcParent[lcParent[x]];\n        x = lcParent[x];\n    }\n    return x;\n}\n\nprivate static void lcUni(int a, int b) {\n    int ra = lcFind(a), rb = lcFind(b);\n    if (ra != rb) lcParent[rb] = ra;\n}\n\npublic static int largestComponentSize(int[] nums) {\n    int mx = 0;\n    for (int v : nums) mx = Math.max(mx, v);\n    lcParent = new int[mx + 1];\n    for (int i = 0; i <= mx; i++) lcParent[i] = i;\n    for (int v : nums) {\n        int x = v;\n        for (int p = 2; (long) p * p <= x; p++) {\n            if (x % p != 0) continue;\n            lcUni(v, p);\n            while (x % p == 0) x /= p;\n        }\n        if (x > 1) lcUni(v, x);\n    }\n    Map<Integer, Integer> count = new HashMap<>();\n    int best = 0;\n    for (int v : nums) {\n        int r = lcFind(v);\n        int c = count.merge(r, 1, Integer::sum);\n        best = Math.max(best, c);\n    }\n    return best;\n}`,
        cpp: `int largestComponentSize(vector<int>& nums) {\n    int mx = 0;\n    for (int v : nums) mx = max(mx, v);\n    vector<int> parent(mx + 1);\n    for (int i = 0; i <= mx; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    auto uni = [&](int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra != rb) parent[rb] = ra;\n    };\n    for (int v : nums) {\n        int x = v;\n        for (int p = 2; (long long) p * p <= x; p++) {\n            if (x % p != 0) continue;\n            uni(v, p);\n            while (x % p == 0) x /= p;\n        }\n        if (x > 1) uni(v, x);\n    }\n    unordered_map<int, int> count;\n    int best = 0;\n    for (int v : nums) {\n        int c = ++count[find(v)];\n        best = max(best, c);\n    }\n    return best;\n}`,
        c: `static int* lcParent;\n\nstatic int lcFind(int x) {\n    while (lcParent[x] != x) {\n        lcParent[x] = lcParent[lcParent[x]];\n        x = lcParent[x];\n    }\n    return x;\n}\n\nstatic void lcUni(int a, int b) {\n    int ra = lcFind(a), rb = lcFind(b);\n    if (ra != rb) lcParent[rb] = ra;\n}\n\nint largestComponentSize(int* nums, int numsSize) {\n    int mx = 0;\n    for (int i = 0; i < numsSize; i++) if (nums[i] > mx) mx = nums[i];\n    lcParent = (int*) malloc((size_t) (mx + 1) * sizeof(int));\n    for (int i = 0; i <= mx; i++) lcParent[i] = i;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        for (int p = 2; (long long) p * p <= x; p++) {\n            if (x % p != 0) continue;\n            lcUni(nums[i], p);\n            while (x % p == 0) x /= p;\n        }\n        if (x > 1) lcUni(nums[i], x);\n    }\n    int* tally = (int*) calloc((size_t) (mx + 1), sizeof(int));\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int r = lcFind(nums[i]);\n        tally[r]++;\n        if (tally[r] > best) best = tally[r];\n    }\n    free(lcParent);\n    free(tally);\n    return best;\n}`,
        csharp: `public static int LargestComponentSize(int[] nums)\n{\n    int mx = 0;\n    foreach (var v in nums) mx = Math.Max(mx, v);\n    var parent = new int[mx + 1];\n    for (int i = 0; i <= mx; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    void Uni(int a, int b)\n    {\n        int ra = Find(a), rb = Find(b);\n        if (ra != rb) parent[rb] = ra;\n    }\n    foreach (var v in nums)\n    {\n        int x = v;\n        for (int p = 2; (long) p * p <= x; p++)\n        {\n            if (x % p != 0) continue;\n            Uni(v, p);\n            while (x % p == 0) x /= p;\n        }\n        if (x > 1) Uni(v, x);\n    }\n    var count = new Dictionary<int, int>();\n    int best = 0;\n    foreach (var v in nums)\n    {\n        int r = Find(v);\n        count.TryGetValue(r, out int cur);\n        count[r] = cur + 1;\n        best = Math.Max(best, cur + 1);\n    }\n    return best;\n}`,
        go: `func largestComponentSize(nums []int) int {\n\tmx := 0\n\tfor _, v := range nums {\n\t\tif v > mx {\n\t\t\tmx = v\n\t\t}\n\t}\n\tparent := make([]int, mx+1)\n\tfor i := range parent {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tuni := func(a, b int) {\n\t\tra, rb := find(a), find(b)\n\t\tif ra != rb {\n\t\t\tparent[rb] = ra\n\t\t}\n\t}\n\tfor _, v := range nums {\n\t\tx := v\n\t\tfor p := 2; p*p <= x; p++ {\n\t\t\tif x%p != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tuni(v, p)\n\t\t\tfor x%p == 0 {\n\t\t\t\tx /= p\n\t\t\t}\n\t\t}\n\t\tif x > 1 {\n\t\t\tuni(v, x)\n\t\t}\n\t}\n\tcount := map[int]int{}\n\tbest := 0\n\tfor _, v := range nums {\n\t\tr := find(v)\n\t\tcount[r]++\n\t\tif count[r] > best {\n\t\t\tbest = count[r]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun largestComponentSize(nums: IntArray): Int {\n    var mx = nums[0]\n    for (v in nums) if (v > mx) mx = v\n    val parent = IntArray(mx + 1) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    fun uni(a: Int, b: Int) {\n        val ra = find(a)\n        val rb = find(b)\n        if (ra != rb) parent[rb] = ra\n    }\n    for (v in nums) {\n        var x = v\n        var p = 2\n        while (p * p <= x) {\n            if (x % p == 0) {\n                uni(v, p)\n                while (x % p == 0) x /= p\n            }\n            p++\n        }\n        if (x > 1) uni(v, x)\n    }\n    val count = HashMap<Int, Int>()\n    var best = 0\n    for (v in nums) {\n        val r = find(v)\n        val c = (count[r] ?: 0) + 1\n        count[r] = c\n        if (c > best) best = c\n    }\n    return best\n}`,
        swift: `func largestComponentSize(_ nums: [Int]) -> Int {\n    let mx = nums.max()!\n    var parent = Array(0...mx)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    func uni(_ a: Int, _ b: Int) {\n        let ra = find(a), rb = find(b)\n        if ra != rb { parent[rb] = ra }\n    }\n    for v in nums {\n        var x = v\n        var p = 2\n        while p * p <= x {\n            if x % p == 0 {\n                uni(v, p)\n                while x % p == 0 { x /= p }\n            }\n            p += 1\n        }\n        if x > 1 { uni(v, x) }\n    }\n    var count = [Int: Int]()\n    var best = 0\n    for v in nums {\n        let r = find(v)\n        let c = (count[r] ?? 0) + 1\n        count[r] = c\n        best = max(best, c)\n    }\n    return best\n}`,
        rust: `use std::collections::HashMap;\n\nfn largestComponentSize(nums: Vec<i32>) -> i32 {\n    let mx = *nums.iter().max().unwrap() as usize;\n    let mut parent: Vec<usize> = (0..=mx).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    for &v in nums.iter() {\n        let value = v as usize;\n        let mut x = value;\n        let mut p = 2usize;\n        while p * p <= x {\n            if x % p == 0 {\n                let ra = find(&mut parent, value);\n                let rb = find(&mut parent, p);\n                if ra != rb {\n                    parent[rb] = ra;\n                }\n                while x % p == 0 {\n                    x /= p;\n                }\n            }\n            p += 1;\n        }\n        if x > 1 {\n            let ra = find(&mut parent, value);\n            let rb = find(&mut parent, x);\n            if ra != rb {\n                parent[rb] = ra;\n            }\n        }\n    }\n    let mut count: HashMap<usize, i32> = HashMap::new();\n    let mut best = 0i32;\n    for &v in nums.iter() {\n        let r = find(&mut parent, v as usize);\n        let c = count.entry(r).or_insert(0);\n        *c += 1;\n        if *c > best {\n            best = *c;\n        }\n    }\n    best\n}`,
        php: `function largestComponentSize($nums) {\n    $mx = max($nums);\n    $parent = range(0, $mx);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    $uni = function($a, $b) use (&$parent, $find) {\n        $ra = $find($a);\n        $rb = $find($b);\n        if ($ra !== $rb) $parent[$rb] = $ra;\n    };\n    foreach ($nums as $v) {\n        $x = $v;\n        for ($p = 2; $p * $p <= $x; $p++) {\n            if ($x % $p !== 0) continue;\n            $uni($v, $p);\n            while ($x % $p === 0) $x = intdiv($x, $p);\n        }\n        if ($x > 1) $uni($v, $x);\n    }\n    $count = [];\n    $best = 0;\n    foreach ($nums as $v) {\n        $r = $find($v);\n        $count[$r] = (isset($count[$r]) ? $count[$r] : 0) + 1;\n        if ($count[$r] > $best) $best = $count[$r];\n    }\n    return $best;\n}`,
        ruby: `def largestComponentSize(nums)\n  mx = nums.max\n  parent = (0..mx).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  uni = lambda do |a, b|\n    ra = find.call(a)\n    rb = find.call(b)\n    parent[rb] = ra if ra != rb\n  end\n  nums.each do |v|\n    x = v\n    p = 2\n    while p * p <= x\n      if x % p == 0\n        uni.call(v, p)\n        x /= p while x % p == 0\n      end\n      p += 1\n    end\n    uni.call(v, x) if x > 1\n  end\n  count = Hash.new(0)\n  best = 0\n  nums.each do |v|\n    r = find.call(v)\n    count[r] += 1\n    best = count[r] if count[r] > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number of Good Paths (LC 2421) ──────────────────────────────
  (() => {
    const ref = (vals: number[], edges: number[][]) => {
      const n = vals.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      const best = vals.slice();
      const cnt = new Array(n).fill(1);
      const sorted = edges.slice().sort((a, b) =>
        Math.max(vals[a[0]], vals[a[1]]) - Math.max(vals[b[0]], vals[b[1]]));
      let ans = n;
      for (let i = 0; i < sorted.length; i++) {
        const ru = find(sorted[i][0]), rv = find(sorted[i][1]);
        if (ru === rv) continue;
        let newBest: number, newCnt: number;
        if (best[ru] === best[rv]) {
          ans += cnt[ru] * cnt[rv];
          newBest = best[ru];
          newCnt = cnt[ru] + cnt[rv];
        } else if (best[ru] > best[rv]) {
          newBest = best[ru];
          newCnt = cnt[ru];
        } else {
          newBest = best[rv];
          newCnt = cnt[rv];
        }
        parent[rv] = ru;
        best[ru] = newBest;
        cnt[ru] = newCnt;
      }
      return ans;
    };
    return {
      slug: "number-of-good-paths",
      title: "Number of Good Paths",
      difficulty: "HARD" as const,
      tags: ["Array", "Tree", "Graph", "Union Find", "Sorting", "Amazon", "Google", "Uber"],
      signature: { funcName: "numberOfGoodPaths", params: [{ name: "vals", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A tree of `n` nodes has value `vals[i]` on node `i`. A **good path** is a simple path where the two endpoints carry the **same** value and no node strictly between them carries a larger one.\n\nReturn the number of good paths. A single node is a good path of length 0, and a path and its reverse count once.",
        [
          { in: "vals = [1,3,2,1,3], edges = [[0,1],[0,2],[2,3],[2,4]]", out: "6", note: "The five single nodes, plus `1 → 0 → 2 → 3`." },
          { in: "vals = [1,1,2,2,3], edges = [[0,1],[1,2],[2,3],[2,4]]", out: "7" },
          { in: "vals = [1], edges = []", out: "1", note: "One node is one good path." },
        ],
        ["n == vals.length", "1 <= n <= 30000", "0 <= vals[i] <= 100000", "edges.length == n - 1", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] < n", "edges represents a valid tree"]),
      hints: [
        "Add the edges in increasing order of the larger of their two endpoint values.",
        "At every moment, each union-find component is a region where every node is at most the current threshold.",
        "When two components whose maxima are equal merge, every pair of their maximum-valued nodes forms a good path.",
      ],
      editorial: explain({
        idea: "Grow the tree edge by edge in increasing order of `max(vals[u], vals[v])`. Track, per component, its maximum value and how many nodes hold it. When two components with equal maxima join, they contribute `cntA · cntB` new good paths.",
        steps: [
          "Start with every node its own component: `best = vals[i]`, `cnt = 1`, and an answer of `n` for the single-node paths.",
          "Sort the edges by the larger endpoint value and union them in that order.",
          "If the two components' maxima are equal, add `cntA · cntB` and keep the combined count; otherwise keep only the larger side's maximum and count.",
        ],
        why: "The sorted order guarantees every node already merged is at most the current threshold, so nothing on the path between two maximum-valued nodes can exceed them — which is exactly the good-path condition. Pairs are counted at the moment two components merge, which is the first time such a path exists, so nothing is double counted.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The `n` single-node paths are part of the answer.",
          "When the maxima differ, the smaller side's count is discarded, not added.",
          "Sorting by a single endpoint rather than by the larger one lets a bigger value sneak into the middle of a path.",
        ],
      }),
      examples: [
        { input: "[1,3,2,1,3]\n[[0,1],[0,2],[2,3],[2,4]]", expectedOutput: "6" },
        { input: "[1,1,2,2,3]\n[[0,1],[1,2],[2,3],[2,4]]", expectedOutput: "7" },
        { input: "[1]\n[]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const vals = Array.from({ length: n }, () => ri(rng, 0, pick(rng, [2, 4, 12])));
        const edges: number[][] = [];
        for (let v = 1; v < n; v++) edges.push([ri(rng, 0, v - 1), v]);
        return { input: `${fmtIntArr(vals)}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(vals, edges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfGoodPaths(vals: List[int], edges: List[List[int]]) -> int:\n    n = len(vals)\n    parent = list(range(n))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    best = vals[:]\n    cnt = [1] * n\n    ans = n\n    for u, v in sorted(edges, key=lambda e: max(vals[e[0]], vals[e[1]])):\n        ru, rv = find(u), find(v)\n        if ru == rv:\n            continue\n        if best[ru] == best[rv]:\n            ans += cnt[ru] * cnt[rv]\n            new_best, new_cnt = best[ru], cnt[ru] + cnt[rv]\n        elif best[ru] > best[rv]:\n            new_best, new_cnt = best[ru], cnt[ru]\n        else:\n            new_best, new_cnt = best[rv], cnt[rv]\n        parent[rv] = ru\n        best[ru] = new_best\n        cnt[ru] = new_cnt\n    return ans`,
        javascript: `var numberOfGoodPaths = function(vals, edges) {\n    var n = vals.length, i;\n    var parent = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var best = vals.slice();\n    var cnt = [];\n    for (i = 0; i < n; i++) cnt.push(1);\n    var sorted = edges.slice();\n    sorted.sort(function(a, b) {\n        return Math.max(vals[a[0]], vals[a[1]]) - Math.max(vals[b[0]], vals[b[1]]);\n    });\n    var ans = n;\n    for (i = 0; i < sorted.length; i++) {\n        var ru = find(sorted[i][0]), rv = find(sorted[i][1]);\n        if (ru === rv) continue;\n        var newBest, newCnt;\n        if (best[ru] === best[rv]) {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        } else {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        parent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    return ans;\n};`,
        typescript: `function numberOfGoodPaths(vals: number[], edges: number[][]): number {\n    var n = vals.length, i: number;\n    var parent: number[] = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var best = vals.slice();\n    var cnt: number[] = [];\n    for (i = 0; i < n; i++) cnt.push(1);\n    var sorted = edges.slice();\n    sorted.sort(function(a: number[], b: number[]) {\n        return Math.max(vals[a[0]], vals[a[1]]) - Math.max(vals[b[0]], vals[b[1]]);\n    });\n    var ans = n;\n    for (i = 0; i < sorted.length; i++) {\n        var ru = find(sorted[i][0]), rv = find(sorted[i][1]);\n        if (ru === rv) continue;\n        var newBest: number, newCnt: number;\n        if (best[ru] === best[rv]) {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        } else {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        parent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    return ans;\n}`,
        java: `private static int[] gpParent;\n\nprivate static int gpFind(int x) {\n    while (gpParent[x] != x) {\n        gpParent[x] = gpParent[gpParent[x]];\n        x = gpParent[x];\n    }\n    return x;\n}\n\npublic static int numberOfGoodPaths(int[] vals, int[][] edges) {\n    int n = vals.length;\n    gpParent = new int[n];\n    for (int i = 0; i < n; i++) gpParent[i] = i;\n    int[] best = vals.clone();\n    int[] cnt = new int[n];\n    Arrays.fill(cnt, 1);\n    int[][] sorted = edges.clone();\n    Arrays.sort(sorted, (a, b) ->\n        Math.max(vals[a[0]], vals[a[1]]) - Math.max(vals[b[0]], vals[b[1]]));\n    int ans = n;\n    for (int[] e : sorted) {\n        int ru = gpFind(e[0]), rv = gpFind(e[1]);\n        if (ru == rv) continue;\n        int newBest, newCnt;\n        if (best[ru] == best[rv]) {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        } else {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        gpParent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    return ans;\n}`,
        cpp: `int numberOfGoodPaths(vector<int>& vals, vector<vector<int>>& edges) {\n    int n = (int) vals.size();\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    vector<int> best = vals, cnt(n, 1);\n    vector<vector<int>> sorted = edges;\n    sort(sorted.begin(), sorted.end(), [&](const vector<int>& a, const vector<int>& b) {\n        return max(vals[a[0]], vals[a[1]]) < max(vals[b[0]], vals[b[1]]);\n    });\n    int ans = n;\n    for (auto& e : sorted) {\n        int ru = find(e[0]), rv = find(e[1]);\n        if (ru == rv) continue;\n        int newBest, newCnt;\n        if (best[ru] == best[rv]) {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        } else {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        parent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    return ans;\n}`,
        c: `static int* gpParent;\nstatic int* gpVals;\n\nstatic int gpFind(int x) {\n    while (gpParent[x] != x) {\n        gpParent[x] = gpParent[gpParent[x]];\n        x = gpParent[x];\n    }\n    return x;\n}\n\nstatic int gpCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    int mx = gpVals[x[0]] > gpVals[x[1]] ? gpVals[x[0]] : gpVals[x[1]];\n    int my = gpVals[y[0]] > gpVals[y[1]] ? gpVals[y[0]] : gpVals[y[1]];\n    return mx - my;\n}\n\nint numberOfGoodPaths(int* vals, int valsSize, int** edges, int edgesSize, int* edgesColSize) {\n    (void) edgesColSize;\n    int n = valsSize;\n    gpParent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) gpParent[i] = i;\n    int* best = (int*) malloc((size_t) n * sizeof(int));\n    int* cnt = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) { best[i] = vals[i]; cnt[i] = 1; }\n    int* flat = (int*) malloc((size_t) (edgesSize > 0 ? edgesSize : 1) * 2 * sizeof(int));\n    for (int i = 0; i < edgesSize; i++) {\n        flat[i * 2] = edges[i][0];\n        flat[i * 2 + 1] = edges[i][1];\n    }\n    gpVals = vals;\n    qsort(flat, (size_t) edgesSize, 2 * sizeof(int), gpCmp);\n    int ans = n;\n    for (int i = 0; i < edgesSize; i++) {\n        int ru = gpFind(flat[i * 2]), rv = gpFind(flat[i * 2 + 1]);\n        if (ru == rv) continue;\n        int newBest, newCnt;\n        if (best[ru] == best[rv]) {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        } else {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        gpParent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    free(gpParent); free(best); free(cnt); free(flat);\n    return ans;\n}`,
        csharp: `public static int NumberOfGoodPaths(int[] vals, int[][] edges)\n{\n    int n = vals.Length;\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    var best = (int[]) vals.Clone();\n    var cnt = new int[n];\n    for (int i = 0; i < n; i++) cnt[i] = 1;\n    var sorted = (int[][]) edges.Clone();\n    Array.Sort(sorted, (a, b) =>\n        Math.Max(vals[a[0]], vals[a[1]]) - Math.Max(vals[b[0]], vals[b[1]]));\n    int ans = n;\n    foreach (var e in sorted)\n    {\n        int ru = Find(e[0]), rv = Find(e[1]);\n        if (ru == rv) continue;\n        int newBest, newCnt;\n        if (best[ru] == best[rv])\n        {\n            ans += cnt[ru] * cnt[rv];\n            newBest = best[ru];\n            newCnt = cnt[ru] + cnt[rv];\n        }\n        else if (best[ru] > best[rv])\n        {\n            newBest = best[ru];\n            newCnt = cnt[ru];\n        }\n        else\n        {\n            newBest = best[rv];\n            newCnt = cnt[rv];\n        }\n        parent[rv] = ru;\n        best[ru] = newBest;\n        cnt[ru] = newCnt;\n    }\n    return ans;\n}`,
        go: `func numberOfGoodPaths(vals []int, edges [][]int) int {\n\tn := len(vals)\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tbest := make([]int, n)\n\tcnt := make([]int, n)\n\tcopy(best, vals)\n\tfor i := range cnt {\n\t\tcnt[i] = 1\n\t}\n\tsorted := make([][]int, len(edges))\n\tcopy(sorted, edges)\n\tmaxOf := func(a, b int) int {\n\t\tif a > b {\n\t\t\treturn a\n\t\t}\n\t\treturn b\n\t}\n\tsort.Slice(sorted, func(i, j int) bool {\n\t\treturn maxOf(vals[sorted[i][0]], vals[sorted[i][1]]) < maxOf(vals[sorted[j][0]], vals[sorted[j][1]])\n\t})\n\tans := n\n\tfor _, e := range sorted {\n\t\tru, rv := find(e[0]), find(e[1])\n\t\tif ru == rv {\n\t\t\tcontinue\n\t\t}\n\t\tvar newBest, newCnt int\n\t\tif best[ru] == best[rv] {\n\t\t\tans += cnt[ru] * cnt[rv]\n\t\t\tnewBest = best[ru]\n\t\t\tnewCnt = cnt[ru] + cnt[rv]\n\t\t} else if best[ru] > best[rv] {\n\t\t\tnewBest = best[ru]\n\t\t\tnewCnt = cnt[ru]\n\t\t} else {\n\t\t\tnewBest = best[rv]\n\t\t\tnewCnt = cnt[rv]\n\t\t}\n\t\tparent[rv] = ru\n\t\tbest[ru] = newBest\n\t\tcnt[ru] = newCnt\n\t}\n\treturn ans\n}`,
        kotlin: `fun numberOfGoodPaths(vals: IntArray, edges: Array<IntArray>): Int {\n    val n = vals.size\n    val parent = IntArray(n) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    val best = vals.copyOf()\n    val cnt = IntArray(n) { 1 }\n    val sorted = edges.sortedBy { maxOf(vals[it[0]], vals[it[1]]) }\n    var ans = n\n    for (e in sorted) {\n        val ru = find(e[0])\n        val rv = find(e[1])\n        if (ru == rv) continue\n        val newBest: Int\n        val newCnt: Int\n        if (best[ru] == best[rv]) {\n            ans += cnt[ru] * cnt[rv]\n            newBest = best[ru]\n            newCnt = cnt[ru] + cnt[rv]\n        } else if (best[ru] > best[rv]) {\n            newBest = best[ru]\n            newCnt = cnt[ru]\n        } else {\n            newBest = best[rv]\n            newCnt = cnt[rv]\n        }\n        parent[rv] = ru\n        best[ru] = newBest\n        cnt[ru] = newCnt\n    }\n    return ans\n}`,
        swift: `func numberOfGoodPaths(_ vals: [Int], _ edges: [[Int]]) -> Int {\n    let n = vals.count\n    var parent = Array(0..<n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    var best = vals\n    var cnt = [Int](repeating: 1, count: n)\n    let sorted = edges.sorted { max(vals[$0[0]], vals[$0[1]]) < max(vals[$1[0]], vals[$1[1]]) }\n    var ans = n\n    for e in sorted {\n        let ru = find(e[0]), rv = find(e[1])\n        if ru == rv { continue }\n        var newBest = 0\n        var newCnt = 0\n        if best[ru] == best[rv] {\n            ans += cnt[ru] * cnt[rv]\n            newBest = best[ru]\n            newCnt = cnt[ru] + cnt[rv]\n        } else if best[ru] > best[rv] {\n            newBest = best[ru]\n            newCnt = cnt[ru]\n        } else {\n            newBest = best[rv]\n            newCnt = cnt[rv]\n        }\n        parent[rv] = ru\n        best[ru] = newBest\n        cnt[ru] = newCnt\n    }\n    return ans\n}`,
        rust: `fn numberOfGoodPaths(vals: Vec<i32>, edges: Vec<Vec<i32>>) -> i32 {\n    let n = vals.len();\n    let mut parent: Vec<usize> = (0..n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    let mut best = vals.clone();\n    let mut cnt = vec![1i32; n];\n    let mut sorted = edges.clone();\n    sorted.sort_by_key(|e| std::cmp::max(vals[e[0] as usize], vals[e[1] as usize]));\n    let mut ans = n as i32;\n    for e in sorted.iter() {\n        let ru = find(&mut parent, e[0] as usize);\n        let rv = find(&mut parent, e[1] as usize);\n        if ru == rv {\n            continue;\n        }\n        let new_best;\n        let new_cnt;\n        if best[ru] == best[rv] {\n            ans += cnt[ru] * cnt[rv];\n            new_best = best[ru];\n            new_cnt = cnt[ru] + cnt[rv];\n        } else if best[ru] > best[rv] {\n            new_best = best[ru];\n            new_cnt = cnt[ru];\n        } else {\n            new_best = best[rv];\n            new_cnt = cnt[rv];\n        }\n        parent[rv] = ru;\n        best[ru] = new_best;\n        cnt[ru] = new_cnt;\n    }\n    ans\n}`,
        php: `function numberOfGoodPaths($vals, $edges) {\n    $n = count($vals);\n    $parent = range(0, $n - 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    $best = $vals;\n    $cnt = array_fill(0, $n, 1);\n    $sorted = $edges;\n    usort($sorted, function($a, $b) use ($vals) {\n        return max($vals[$a[0]], $vals[$a[1]]) - max($vals[$b[0]], $vals[$b[1]]);\n    });\n    $ans = $n;\n    foreach ($sorted as $e) {\n        $ru = $find($e[0]);\n        $rv = $find($e[1]);\n        if ($ru === $rv) continue;\n        if ($best[$ru] === $best[$rv]) {\n            $ans += $cnt[$ru] * $cnt[$rv];\n            $newBest = $best[$ru];\n            $newCnt = $cnt[$ru] + $cnt[$rv];\n        } elseif ($best[$ru] > $best[$rv]) {\n            $newBest = $best[$ru];\n            $newCnt = $cnt[$ru];\n        } else {\n            $newBest = $best[$rv];\n            $newCnt = $cnt[$rv];\n        }\n        $parent[$rv] = $ru;\n        $best[$ru] = $newBest;\n        $cnt[$ru] = $newCnt;\n    }\n    return $ans;\n}`,
        ruby: `def numberOfGoodPaths(vals, edges)\n  n = vals.length\n  parent = (0...n).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  best = vals.dup\n  cnt = Array.new(n, 1)\n  sorted = edges.sort_by { |u, v| [vals[u], vals[v]].max }\n  ans = n\n  sorted.each do |u, v|\n    ru = find.call(u)\n    rv = find.call(v)\n    next if ru == rv\n    if best[ru] == best[rv]\n      ans += cnt[ru] * cnt[rv]\n      new_best = best[ru]\n      new_cnt = cnt[ru] + cnt[rv]\n    elsif best[ru] > best[rv]\n      new_best = best[ru]\n      new_cnt = cnt[ru]\n    else\n      new_best = best[rv]\n      new_cnt = cnt[rv]\n    end\n    parent[rv] = ru\n    best[ru] = new_best\n    cnt[ru] = new_cnt\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Number of Ways to Arrive at Destination (LC 1976) ───────────
  (() => {
    const MOD = 1000000007;
    const BIG = 1000000000;
    const ref = (n: number, roads: number[][]) => {
      const adj: number[][][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < roads.length; i++) {
        adj[roads[i][0]].push([roads[i][1], roads[i][2]]);
        adj[roads[i][1]].push([roads[i][0], roads[i][2]]);
      }
      const dist = new Array(n).fill(BIG);
      const ways = new Array(n).fill(0);
      const done = new Array(n).fill(false);
      dist[0] = 0;
      ways[0] = 1;
      for (let it = 0; it < n; it++) {
        let u = -1, best = BIG;
        for (let i = 0; i < n; i++) {
          if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
        }
        if (u < 0) break;
        done[u] = true;
        for (let k = 0; k < adj[u].length; k++) {
          const v = adj[u][k][0], t = adj[u][k][1];
          if (done[v]) continue;
          const nd = dist[u] + t;
          if (nd < dist[v]) {
            dist[v] = nd;
            ways[v] = ways[u];
          } else if (nd === dist[v]) {
            ways[v] = (ways[v] + ways[u]) % MOD;
          }
        }
      }
      return ways[n - 1];
    };
    return {
      slug: "number-of-ways-to-arrive-at-destination",
      title: "Number of Ways to Arrive at Destination",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Dynamic Programming", "Shortest Path", "Topological Sort", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countPaths", params: [{ name: "n", type: "int" as const }, { name: "roads", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A city has `n` intersections numbered `0 … n - 1` joined by bidirectional roads; `roads[i] = [u, v, time]` gives the time to drive that road.\n\nYou start at intersection `0` and want to reach intersection `n - 1` **in the shortest possible time**. Return how many different routes achieve that time, modulo `10^9 + 7`.",
        [
          { in: "n = 7, roads = [[0,6,7],[0,1,2],[1,2,3],[1,3,3],[6,3,3],[3,5,1],[6,5,1],[2,5,1],[0,4,5],[4,6,2]]", out: "4", note: "Four different routes all take 7 minutes." },
          { in: "n = 2, roads = [[1,0,10]]", out: "1", note: "Only one road." },
          { in: "n = 3, roads = [[0,1,1],[1,2,1],[0,2,2]]", out: "2", note: "Two routes both take 2 minutes." },
        ],
        ["1 <= n <= 200", "n - 1 <= roads.length <= n * (n - 1) / 2", "roads[i].length == 3", "0 <= u, v <= n - 1", "1 <= time <= 1000", "u != v", "There is at most one road connecting any two intersections.", "You can reach any intersection from any other intersection."]),
      hints: [
        "Run Dijkstra's algorithm, but carry a second number alongside the distance.",
        "When you find a strictly shorter route to a node, its count is replaced by the count of the node you came from.",
        "When you find an equally short route, the counts are added.",
      ],
      editorial: explain({
        idea: "Dijkstra's algorithm with path counting. Alongside `dist[v]`, keep `ways[v]`: when relaxing an edge, a strictly better distance replaces the count, and an equal distance adds to it.",
        steps: [
          "Set `dist[0] = 0` and `ways[0] = 1`; everything else is infinity with 0 ways.",
          "Repeatedly finalise the unfinished node with the smallest distance.",
          "Relaxing `u → v`: if `dist[u] + t < dist[v]`, set `dist[v]` and `ways[v] = ways[u]`; if equal, add `ways[u]` into `ways[v]` modulo `10^9 + 7`.",
          "Return `ways[n - 1]`.",
        ],
        why: "Counting works because a node's distance is final when it is popped: since every road takes positive time, no later discovery can shorten it, so every contribution it makes afterwards is genuinely on a shortest route. Only `ways` needs the modulus — `dist` is a real time and must stay exact, or comparisons between routes would go wrong.",
        time: "O(n²  + m) with a plain Dijkstra",
        space: "O(n + m)",
        pitfalls: [
          "Reducing `dist` under the modulus destroys the comparisons; only `ways` is reduced.",
          "Equal-distance routes must *add* counts, not overwrite them.",
          "Roads are bidirectional, so each one goes into both adjacency lists.",
        ],
      }),
      examples: [
        { input: "7\n[[0,6,7],[0,1,2],[1,2,3],[1,3,3],[6,3,3],[3,5,1],[6,5,1],[2,5,1],[0,4,5],[4,6,2]]", expectedOutput: "4" },
        { input: "2\n[[1,0,10]]", expectedOutput: "1" },
        { input: "3\n[[0,1,1],[1,2,1],[0,2,2]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const seen = new Set<number>();
        const roads: number[][] = [];
        // A spanning path keeps every intersection reachable, as promised.
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        for (let i = 0; i + 1 < order.length; i++) {
          const a = order[i], b = order[i + 1];
          seen.add(Math.min(a, b) * n + Math.max(a, b));
          roads.push([a, b, ri(rng, 1, 6)]);
        }
        for (let k = 0; k < 8; k++) {
          const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          if (a === b) continue;
          const key = Math.min(a, b) * n + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          roads.push([a, b, ri(rng, 1, 6)]);
        }
        return { input: `${n}\n${fmtIntMat(roads)}`, expectedOutput: String(ref(n, roads)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef countPaths(n: int, roads: List[List[int]]) -> int:\n    MOD = 1000000007\n    adj = [[] for _ in range(n)]\n    for u, v, t in roads:\n        adj[u].append((v, t))\n        adj[v].append((u, t))\n    BIG = float('inf')\n    dist = [BIG] * n\n    ways = [0] * n\n    dist[0] = 0\n    ways[0] = 1\n    heap = [(0, 0)]\n    done = [False] * n\n    while heap:\n        d, u = heapq.heappop(heap)\n        if done[u]:\n            continue\n        done[u] = True\n        for v, t in adj[u]:\n            if done[v]:\n                continue\n            nd = d + t\n            if nd < dist[v]:\n                dist[v] = nd\n                ways[v] = ways[u]\n                heapq.heappush(heap, (nd, v))\n            elif nd == dist[v]:\n                ways[v] = (ways[v] + ways[u]) % MOD\n    return ways[n - 1]`,
        javascript: `var countPaths = function(n, roads) {\n    var MOD = 1000000007, BIG = 1000000000, i, k;\n    var adj = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < roads.length; i++) {\n        adj[roads[i][0]].push([roads[i][1], roads[i][2]]);\n        adj[roads[i][1]].push([roads[i][0], roads[i][2]]);\n    }\n    var dist = [], ways = [], done = [];\n    for (i = 0; i < n; i++) { dist.push(BIG); ways.push(0); done.push(false); }\n    dist[0] = 0;\n    ways[0] = 1;\n    for (var it = 0; it < n; it++) {\n        var u = -1, best = BIG;\n        for (i = 0; i < n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (k = 0; k < adj[u].length; k++) {\n            var v = adj[u][k][0], t = adj[u][k][1];\n            if (done[v]) continue;\n            var nd = dist[u] + t;\n            if (nd < dist[v]) {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            } else if (nd === dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    return ways[n - 1];\n};`,
        typescript: `function countPaths(n: number, roads: number[][]): number {\n    var MOD = 1000000007, BIG = 1000000000, i: number, k: number;\n    var adj: number[][][] = [];\n    for (i = 0; i < n; i++) adj.push([]);\n    for (i = 0; i < roads.length; i++) {\n        adj[roads[i][0]].push([roads[i][1], roads[i][2]]);\n        adj[roads[i][1]].push([roads[i][0], roads[i][2]]);\n    }\n    var dist: number[] = [], ways: number[] = [], done: boolean[] = [];\n    for (i = 0; i < n; i++) { dist.push(BIG); ways.push(0); done.push(false); }\n    dist[0] = 0;\n    ways[0] = 1;\n    for (var it = 0; it < n; it++) {\n        var u = -1, best = BIG;\n        for (i = 0; i < n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (k = 0; k < adj[u].length; k++) {\n            var v = adj[u][k][0], t = adj[u][k][1];\n            if (done[v]) continue;\n            var nd = dist[u] + t;\n            if (nd < dist[v]) {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            } else if (nd === dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    return ways[n - 1];\n}`,
        java: `public static int countPaths(int n, int[][] roads) {\n    final int MOD = 1000000007;\n    final int BIG = 1000000000;\n    List<List<int[]>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n    for (int[] r : roads) {\n        adj.get(r[0]).add(new int[] { r[1], r[2] });\n        adj.get(r[1]).add(new int[] { r[0], r[2] });\n    }\n    int[] dist = new int[n];\n    long[] ways = new long[n];\n    boolean[] done = new boolean[n];\n    Arrays.fill(dist, BIG);\n    dist[0] = 0;\n    ways[0] = 1;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        for (int[] e : adj.get(u)) {\n            int v = e[0], t = e[1];\n            if (done[v]) continue;\n            int nd = dist[u] + t;\n            if (nd < dist[v]) {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            } else if (nd == dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    return (int) ways[n - 1];\n}`,
        cpp: `int countPaths(int n, vector<vector<int>>& roads) {\n    const long long MOD = 1000000007;\n    const int BIG = 1000000000;\n    vector<vector<pair<int,int>>> adj(n);\n    for (auto& r : roads) {\n        adj[r[0]].push_back({ r[1], r[2] });\n        adj[r[1]].push_back({ r[0], r[2] });\n    }\n    vector<int> dist(n, BIG);\n    vector<long long> ways(n, 0);\n    vector<char> done(n, 0);\n    dist[0] = 0;\n    ways[0] = 1;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        for (auto& e : adj[u]) {\n            int v = e.first, t = e.second;\n            if (done[v]) continue;\n            int nd = dist[u] + t;\n            if (nd < dist[v]) {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            } else if (nd == dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    return (int) ways[n - 1];\n}`,
        c: `int countPaths(int n, int** roads, int roadsSize, int* roadsColSize) {\n    (void) roadsColSize;\n    const long long MOD = 1000000007;\n    const int BIG = 1000000000;\n    int* head = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) head[i] = -1;\n    int cap = roadsSize * 2 > 0 ? roadsSize * 2 : 1;\n    int* nxt = (int*) malloc((size_t) cap * sizeof(int));\n    int* to = (int*) malloc((size_t) cap * sizeof(int));\n    int* wt = (int*) malloc((size_t) cap * sizeof(int));\n    int ec = 0;\n    for (int i = 0; i < roadsSize; i++) {\n        int u = roads[i][0], v = roads[i][1], t = roads[i][2];\n        to[ec] = v; wt[ec] = t; nxt[ec] = head[u]; head[u] = ec; ec++;\n        to[ec] = u; wt[ec] = t; nxt[ec] = head[v]; head[v] = ec; ec++;\n    }\n    int* dist = (int*) malloc((size_t) n * sizeof(int));\n    long long* ways = (long long*) calloc((size_t) n, sizeof(long long));\n    char* done = (char*) calloc((size_t) n, 1);\n    for (int i = 0; i < n; i++) dist[i] = BIG;\n    dist[0] = 0;\n    ways[0] = 1;\n    for (int it = 0; it < n; it++) {\n        int u = -1, best = BIG;\n        for (int i = 0; i < n; i++) {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = 1;\n        for (int e = head[u]; e >= 0; e = nxt[e]) {\n            int v = to[e];\n            if (done[v]) continue;\n            int nd = dist[u] + wt[e];\n            if (nd < dist[v]) {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            } else if (nd == dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    int ans = (int) ways[n - 1];\n    free(head); free(nxt); free(to); free(wt); free(dist); free(ways); free(done);\n    return ans;\n}`,
        csharp: `public static int CountPaths(int n, int[][] roads)\n{\n    const long MOD = 1000000007;\n    const int BIG = 1000000000;\n    var adj = new List<int[]>[n];\n    for (int i = 0; i < n; i++) adj[i] = new List<int[]>();\n    foreach (var r in roads)\n    {\n        adj[r[0]].Add(new int[] { r[1], r[2] });\n        adj[r[1]].Add(new int[] { r[0], r[2] });\n    }\n    var dist = new int[n];\n    var ways = new long[n];\n    var done = new bool[n];\n    for (int i = 0; i < n; i++) dist[i] = BIG;\n    dist[0] = 0;\n    ways[0] = 1;\n    for (int it = 0; it < n; it++)\n    {\n        int u = -1, best = BIG;\n        for (int i = 0; i < n; i++)\n        {\n            if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }\n        }\n        if (u < 0) break;\n        done[u] = true;\n        foreach (var e in adj[u])\n        {\n            int v = e[0], t = e[1];\n            if (done[v]) continue;\n            int nd = dist[u] + t;\n            if (nd < dist[v])\n            {\n                dist[v] = nd;\n                ways[v] = ways[u];\n            }\n            else if (nd == dist[v])\n            {\n                ways[v] = (ways[v] + ways[u]) % MOD;\n            }\n        }\n    }\n    return (int) ways[n - 1];\n}`,
        go: `func countPaths(n int, roads [][]int) int {\n\tconst MOD = 1000000007\n\tconst BIG = 1000000000\n\tadj := make([][][2]int, n)\n\tfor _, r := range roads {\n\t\tadj[r[0]] = append(adj[r[0]], [2]int{r[1], r[2]})\n\t\tadj[r[1]] = append(adj[r[1]], [2]int{r[0], r[2]})\n\t}\n\tdist := make([]int, n)\n\tways := make([]int, n)\n\tdone := make([]bool, n)\n\tfor i := range dist {\n\t\tdist[i] = BIG\n\t}\n\tdist[0] = 0\n\tways[0] = 1\n\tfor it := 0; it < n; it++ {\n\t\tu, best := -1, BIG\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif !done[i] && dist[i] < best {\n\t\t\t\tbest = dist[i]\n\t\t\t\tu = i\n\t\t\t}\n\t\t}\n\t\tif u < 0 {\n\t\t\tbreak\n\t\t}\n\t\tdone[u] = true\n\t\tfor _, e := range adj[u] {\n\t\t\tv, t := e[0], e[1]\n\t\t\tif done[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tnd := dist[u] + t\n\t\t\tif nd < dist[v] {\n\t\t\t\tdist[v] = nd\n\t\t\t\tways[v] = ways[u]\n\t\t\t} else if nd == dist[v] {\n\t\t\t\tways[v] = (ways[v] + ways[u]) % MOD\n\t\t\t}\n\t\t}\n\t}\n\treturn ways[n-1]\n}`,
        kotlin: `fun countPaths(n: Int, roads: Array<IntArray>): Int {\n    val MOD = 1000000007L\n    val BIG = 1000000000\n    val adj = Array(n) { ArrayList<IntArray>() }\n    for (r in roads) {\n        adj[r[0]].add(intArrayOf(r[1], r[2]))\n        adj[r[1]].add(intArrayOf(r[0], r[2]))\n    }\n    val dist = IntArray(n) { BIG }\n    val ways = LongArray(n)\n    val done = BooleanArray(n)\n    dist[0] = 0\n    ways[0] = 1\n    for (it2 in 0 until n) {\n        var u = -1\n        var best = BIG\n        for (i in 0 until n) {\n            if (!done[i] && dist[i] < best) {\n                best = dist[i]\n                u = i\n            }\n        }\n        if (u < 0) break\n        done[u] = true\n        for (e in adj[u]) {\n            val v = e[0]\n            val t = e[1]\n            if (done[v]) continue\n            val nd = dist[u] + t\n            if (nd < dist[v]) {\n                dist[v] = nd\n                ways[v] = ways[u]\n            } else if (nd == dist[v]) {\n                ways[v] = (ways[v] + ways[u]) % MOD\n            }\n        }\n    }\n    return ways[n - 1].toInt()\n}`,
        swift: `func countPaths(_ n: Int, _ roads: [[Int]]) -> Int {\n    let MOD = 1000000007\n    let BIG = 1000000000\n    var adj = [[(Int, Int)]](repeating: [], count: n)\n    for r in roads {\n        adj[r[0]].append((r[1], r[2]))\n        adj[r[1]].append((r[0], r[2]))\n    }\n    var dist = [Int](repeating: BIG, count: n)\n    var ways = [Int](repeating: 0, count: n)\n    var done = [Bool](repeating: false, count: n)\n    dist[0] = 0\n    ways[0] = 1\n    for _ in 0..<n {\n        var u = -1\n        var best = BIG\n        for i in 0..<n where !done[i] && dist[i] < best {\n            best = dist[i]\n            u = i\n        }\n        if u < 0 { break }\n        done[u] = true\n        for (v, t) in adj[u] {\n            if done[v] { continue }\n            let nd = dist[u] + t\n            if nd < dist[v] {\n                dist[v] = nd\n                ways[v] = ways[u]\n            } else if nd == dist[v] {\n                ways[v] = (ways[v] + ways[u]) % MOD\n            }\n        }\n    }\n    return ways[n - 1]\n}`,
        rust: `fn countPaths(n: i32, roads: Vec<Vec<i32>>) -> i32 {\n    const MOD: i64 = 1000000007;\n    const BIG: i32 = 1000000000;\n    let n = n as usize;\n    let mut adj: Vec<Vec<(usize, i32)>> = vec![Vec::new(); n];\n    for r in roads.iter() {\n        adj[r[0] as usize].push((r[1] as usize, r[2]));\n        adj[r[1] as usize].push((r[0] as usize, r[2]));\n    }\n    let mut dist = vec![BIG; n];\n    let mut ways = vec![0i64; n];\n    let mut done = vec![false; n];\n    dist[0] = 0;\n    ways[0] = 1;\n    for _ in 0..n {\n        let mut u: i32 = -1;\n        let mut best = BIG;\n        for i in 0..n {\n            if !done[i] && dist[i] < best {\n                best = dist[i];\n                u = i as i32;\n            }\n        }\n        if u < 0 {\n            break;\n        }\n        let ui = u as usize;\n        done[ui] = true;\n        for idx in 0..adj[ui].len() {\n            let (v, t) = adj[ui][idx];\n            if done[v] {\n                continue;\n            }\n            let nd = dist[ui] + t;\n            if nd < dist[v] {\n                dist[v] = nd;\n                ways[v] = ways[ui];\n            } else if nd == dist[v] {\n                ways[v] = (ways[v] + ways[ui]) % MOD;\n            }\n        }\n    }\n    ways[n - 1] as i32\n}`,
        php: `function countPaths($n, $roads) {\n    $MOD = 1000000007;\n    $BIG = 1000000000;\n    $adj = [];\n    for ($i = 0; $i < $n; $i++) $adj[$i] = [];\n    foreach ($roads as $r) {\n        $adj[$r[0]][] = [$r[1], $r[2]];\n        $adj[$r[1]][] = [$r[0], $r[2]];\n    }\n    $dist = array_fill(0, $n, $BIG);\n    $ways = array_fill(0, $n, 0);\n    $done = array_fill(0, $n, false);\n    $dist[0] = 0;\n    $ways[0] = 1;\n    for ($it = 0; $it < $n; $it++) {\n        $u = -1;\n        $best = $BIG;\n        for ($i = 0; $i < $n; $i++) {\n            if (!$done[$i] && $dist[$i] < $best) { $best = $dist[$i]; $u = $i; }\n        }\n        if ($u < 0) break;\n        $done[$u] = true;\n        foreach ($adj[$u] as $e) {\n            $v = $e[0];\n            $t = $e[1];\n            if ($done[$v]) continue;\n            $nd = $dist[$u] + $t;\n            if ($nd < $dist[$v]) {\n                $dist[$v] = $nd;\n                $ways[$v] = $ways[$u];\n            } elseif ($nd === $dist[$v]) {\n                $ways[$v] = ($ways[$v] + $ways[$u]) % $MOD;\n            }\n        }\n    }\n    return $ways[$n - 1];\n}`,
        ruby: `def countPaths(n, roads)\n  mod = 1000000007\n  big = 1000000000\n  adj = Array.new(n) { [] }\n  roads.each do |u, v, t|\n    adj[u] << [v, t]\n    adj[v] << [u, t]\n  end\n  dist = Array.new(n, big)\n  ways = Array.new(n, 0)\n  done = Array.new(n, false)\n  dist[0] = 0\n  ways[0] = 1\n  n.times do\n    u = -1\n    best = big\n    (0...n).each do |i|\n      if !done[i] && dist[i] < best\n        best = dist[i]\n        u = i\n      end\n    end\n    break if u < 0\n    done[u] = true\n    adj[u].each do |v, t|\n      next if done[v]\n      nd = dist[u] + t\n      if nd < dist[v]\n        dist[v] = nd\n        ways[v] = ways[u]\n      elsif nd == dist[v]\n        ways[v] = (ways[v] + ways[u]) % mod\n      end\n    end\n  end\n  ways[n - 1]\nend`,
      },
    };
  })(),

  // ── Minimum Obstacle Removal to Reach Corner (LC 2290) ──────────
  (() => {
    const BIG = 1000000000;
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const dist = new Array(m * n).fill(BIG);
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      dist[0] = 0;
      let d = 0;
      let cur = [0];
      while (cur.length > 0) {
        const nxt: number[] = [];
        // `cur` grows while it is walked: a zero-weight step stays on this level.
        for (let i = 0; i < cur.length; i++) {
          const u = cur[i];
          if (dist[u] < d) continue;
          const r = Math.floor(u / n), c = u % n;
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            const v = nr * n + nc;
            const nd = d + grid[nr][nc];
            if (nd >= dist[v]) continue;
            dist[v] = nd;
            if (grid[nr][nc] === 0) cur.push(v);
            else nxt.push(v);
          }
        }
        cur = nxt;
        d++;
      }
      return dist[m * n - 1];
    };
    return {
      slug: "minimum-obstacle-removal-to-reach-corner",
      title: "Minimum Obstacle Removal to Reach Corner",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Graph", "Breadth-First Search", "Shortest Path", "Heap (Priority Queue)", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minimumObstacles", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A grid holds `0` for an empty cell and `1` for an obstacle. You may move up, down, left or right between adjacent cells, and you may **remove** obstacles.\n\nReturn the minimum number of obstacles to remove so that you can walk from the top-left cell `(0, 0)` to the bottom-right cell `(m - 1, n - 1)`. Both corners are empty.",
        [
          { in: "grid = [[0,1,1],[1,1,0],[1,1,0]]", out: "2", note: "Remove the obstacles at `(0,1)` and `(0,2)`." },
          { in: "grid = [[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]", out: "0", note: "A clear route already exists." },
          { in: "grid = [[0,1],[1,0]]", out: "1" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10^5", "2 <= m * n <= 10^5", "grid[i][j] is 0 or 1", "grid[0][0] == grid[m - 1][n - 1] == 0"]),
      hints: [
        "Stepping onto an empty cell is free; stepping onto an obstacle costs 1.",
        "So this is a shortest path where every edge weight is 0 or 1.",
        "That is exactly what 0-1 BFS is for — no priority queue needed.",
      ],
      editorial: explain({
        idea: "Give each move a cost equal to the destination cell's value and find the cheapest route. With only the weights 0 and 1, a 0-1 BFS finds it in linear time: zero-cost steps stay on the current level, one-cost steps go to the next.",
        steps: [
          "Set every distance to infinity except `(0, 0)`, which is 0.",
          "Process the current level, which holds exactly the cells at distance `d`.",
          "Relaxing onto an empty cell keeps the distance, so append it to the **current** level.",
          "Relaxing onto an obstacle costs one more, so it goes to the next level.",
          "Return the distance of the bottom-right cell.",
        ],
        why: "The current level can be appended to while it is being walked, and that is precisely what makes 0-1 BFS correct: everything in it still has distance `d`, so the invariant \"this level holds exactly the distance-`d` cells\" survives. It gives Dijkstra's answer at BFS's cost, which matters at `10^5` cells.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Plain BFS counts steps, not obstacles, and answers a different question.",
          "The cost belongs to the cell being entered, not the one being left.",
          "A stale queue entry — one whose distance has since improved — must be skipped.",
        ],
      }),
      examples: [
        { input: "[[0,1,1],[1,1,0],[1,1,0]]", expectedOutput: "2" },
        { input: "[[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]", expectedOutput: "0" },
        { input: "[[0,1],[1,0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const p = pick(rng, [0.3, 0.5, 0.7]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        // Both corners are empty, as the statement promises.
        grid[0][0] = 0;
        grid[m - 1][n - 1] = 0;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef minimumObstacles(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    BIG = float('inf')\n    dist = [BIG] * (m * n)\n    dist[0] = 0\n    dq = deque([0])\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    while dq:\n        u = dq.popleft()\n        r, c = divmod(u, n)\n        for di, dj in dirs:\n            nr, nc = r + di, c + dj\n            if not (0 <= nr < m and 0 <= nc < n):\n                continue\n            v = nr * n + nc\n            nd = dist[u] + grid[nr][nc]\n            if nd >= dist[v]:\n                continue\n            dist[v] = nd\n            if grid[nr][nc] == 0:\n                dq.appendleft(v)\n            else:\n                dq.append(v)\n    return dist[m * n - 1]`,
        javascript: `var minimumObstacles = function(grid) {\n    var BIG = 1000000000;\n    var m = grid.length, n = grid[0].length, i;\n    var dist = [];\n    for (i = 0; i < m * n; i++) dist.push(BIG);\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[0] = 0;\n    var d = 0;\n    var cur = [0];\n    while (cur.length > 0) {\n        var nxt = [];\n        for (i = 0; i < cur.length; i++) {\n            var u = cur[i];\n            if (dist[u] < d) continue;\n            var r = Math.floor(u / n), c = u % n;\n            for (var k = 0; k < 4; k++) {\n                var nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                var v = nr * n + nc;\n                var nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] === 0) cur.push(v);\n                else nxt.push(v);\n            }\n        }\n        cur = nxt;\n        d++;\n    }\n    return dist[m * n - 1];\n};`,
        typescript: `function minimumObstacles(grid: number[][]): number {\n    var BIG = 1000000000;\n    var m = grid.length, n = grid[0].length, i: number;\n    var dist: number[] = [];\n    for (i = 0; i < m * n; i++) dist.push(BIG);\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[0] = 0;\n    var d = 0;\n    var cur: number[] = [0];\n    while (cur.length > 0) {\n        var nxt: number[] = [];\n        for (i = 0; i < cur.length; i++) {\n            var u = cur[i];\n            if (dist[u] < d) continue;\n            var r = Math.floor(u / n), c = u % n;\n            for (var k = 0; k < 4; k++) {\n                var nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                var v = nr * n + nc;\n                var nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] === 0) cur.push(v);\n                else nxt.push(v);\n            }\n        }\n        cur = nxt;\n        d++;\n    }\n    return dist[m * n - 1];\n}`,
        java: `public static int minimumObstacles(int[][] grid) {\n    final int BIG = 1000000000;\n    int m = grid.length, n = grid[0].length;\n    int[] dist = new int[m * n];\n    Arrays.fill(dist, BIG);\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    dist[0] = 0;\n    int d = 0;\n    List<Integer> cur = new ArrayList<>();\n    cur.add(0);\n    while (!cur.isEmpty()) {\n        List<Integer> nxt = new ArrayList<>();\n        for (int i = 0; i < cur.size(); i++) {\n            int u = cur.get(i);\n            if (dist[u] < d) continue;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++) {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                int nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] == 0) cur.add(v);\n                else nxt.add(v);\n            }\n        }\n        cur = nxt;\n        d++;\n    }\n    return dist[m * n - 1];\n}`,
        cpp: `int minimumObstacles(vector<vector<int>>& grid) {\n    const int BIG = 1000000000;\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<int> dist(m * n, BIG);\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    dist[0] = 0;\n    int d = 0;\n    vector<int> cur = { 0 };\n    while (!cur.empty()) {\n        vector<int> nxt;\n        for (size_t i = 0; i < cur.size(); i++) {\n            int u = cur[i];\n            if (dist[u] < d) continue;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++) {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                int nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] == 0) cur.push_back(v);\n                else nxt.push_back(v);\n            }\n        }\n        cur = nxt;\n        d++;\n    }\n    return dist[m * n - 1];\n}`,
        c: `int minimumObstacles(int** grid, int gridSize, int* gridColSize) {\n    const int BIG = 1000000000;\n    int m = gridSize, n = gridColSize[0];\n    int cells = m * n;\n    int* dist = (int*) malloc((size_t) cells * sizeof(int));\n    for (int i = 0; i < cells; i++) dist[i] = BIG;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    dist[0] = 0;\n    int* cur = (int*) malloc((size_t) cells * sizeof(int));\n    int* nxt = (int*) malloc((size_t) cells * sizeof(int));\n    int curLen = 1, nxtLen = 0, d = 0;\n    cur[0] = 0;\n    while (curLen > 0) {\n        nxtLen = 0;\n        for (int i = 0; i < curLen; i++) {\n            int u = cur[i];\n            if (dist[u] < d) continue;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++) {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                int nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] == 0) cur[curLen++] = v;\n                else nxt[nxtLen++] = v;\n            }\n        }\n        for (int i = 0; i < nxtLen; i++) cur[i] = nxt[i];\n        curLen = nxtLen;\n        d++;\n    }\n    int ans = dist[cells - 1];\n    free(dist); free(cur); free(nxt);\n    return ans;\n}`,
        csharp: `public static int MinimumObstacles(int[][] grid)\n{\n    const int BIG = 1000000000;\n    int m = grid.Length, n = grid[0].Length;\n    var dist = new int[m * n];\n    for (int i = 0; i < m * n; i++) dist[i] = BIG;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    dist[0] = 0;\n    int d = 0;\n    var cur = new List<int> { 0 };\n    while (cur.Count > 0)\n    {\n        var nxt = new List<int>();\n        for (int i = 0; i < cur.Count; i++)\n        {\n            int u = cur[i];\n            if (dist[u] < d) continue;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++)\n            {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                int nd = d + grid[nr][nc];\n                if (nd >= dist[v]) continue;\n                dist[v] = nd;\n                if (grid[nr][nc] == 0) cur.Add(v);\n                else nxt.Add(v);\n            }\n        }\n        cur = nxt;\n        d++;\n    }\n    return dist[m * n - 1];\n}`,
        go: `func minimumObstacles(grid [][]int) int {\n\tconst BIG = 1000000000\n\tm, n := len(grid), len(grid[0])\n\tdist := make([]int, m*n)\n\tfor i := range dist {\n\t\tdist[i] = BIG\n\t}\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tdist[0] = 0\n\td := 0\n\tcur := []int{0}\n\tfor len(cur) > 0 {\n\t\tnxt := []int{}\n\t\tfor i := 0; i < len(cur); i++ {\n\t\t\tu := cur[i]\n\t\t\tif dist[u] < d {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tr, c := u/n, u%n\n\t\t\tfor k := 0; k < 4; k++ {\n\t\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tv := nr*n + nc\n\t\t\t\tnd := d + grid[nr][nc]\n\t\t\t\tif nd >= dist[v] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tdist[v] = nd\n\t\t\t\tif grid[nr][nc] == 0 {\n\t\t\t\t\tcur = append(cur, v)\n\t\t\t\t} else {\n\t\t\t\t\tnxt = append(nxt, v)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tcur = nxt\n\t\td++\n\t}\n\treturn dist[m*n-1]\n}`,
        kotlin: `fun minimumObstacles(grid: Array<IntArray>): Int {\n    val BIG = 1000000000\n    val m = grid.size\n    val n = grid[0].size\n    val dist = IntArray(m * n) { BIG }\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    dist[0] = 0\n    var d = 0\n    var cur = ArrayList<Int>()\n    cur.add(0)\n    while (cur.isNotEmpty()) {\n        val nxt = ArrayList<Int>()\n        var i = 0\n        while (i < cur.size) {\n            val u = cur[i]\n            i++\n            if (dist[u] < d) continue\n            val r = u / n\n            val c = u % n\n            for (k in 0 until 4) {\n                val nr = r + dr[k]\n                val nc = c + dc[k]\n                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                val v = nr * n + nc\n                val nd = d + grid[nr][nc]\n                if (nd >= dist[v]) continue\n                dist[v] = nd\n                if (grid[nr][nc] == 0) cur.add(v) else nxt.add(v)\n            }\n        }\n        cur = nxt\n        d++\n    }\n    return dist[m * n - 1]\n}`,
        swift: `func minimumObstacles(_ grid: [[Int]]) -> Int {\n    let BIG = 1000000000\n    let m = grid.count\n    let n = grid[0].count\n    var dist = [Int](repeating: BIG, count: m * n)\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    dist[0] = 0\n    var d = 0\n    var cur = [0]\n    while !cur.isEmpty {\n        var nxt = [Int]()\n        var i = 0\n        while i < cur.count {\n            let u = cur[i]\n            i += 1\n            if dist[u] < d { continue }\n            let r = u / n, c = u % n\n            for k in 0..<4 {\n                let nr = r + dr[k], nc = c + dc[k]\n                if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                let v = nr * n + nc\n                let nd = d + grid[nr][nc]\n                if nd >= dist[v] { continue }\n                dist[v] = nd\n                if grid[nr][nc] == 0 { cur.append(v) } else { nxt.append(v) }\n            }\n        }\n        cur = nxt\n        d += 1\n    }\n    return dist[m * n - 1]\n}`,
        rust: `fn minimumObstacles(grid: Vec<Vec<i32>>) -> i32 {\n    const BIG: i32 = 1000000000;\n    let m = grid.len();\n    let n = grid[0].len();\n    let mut dist = vec![BIG; m * n];\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    dist[0] = 0;\n    let mut d = 0i32;\n    let mut cur: Vec<usize> = vec![0];\n    while !cur.is_empty() {\n        let mut nxt: Vec<usize> = Vec::new();\n        let mut i = 0usize;\n        while i < cur.len() {\n            let u = cur[i];\n            i += 1;\n            if dist[u] < d {\n                continue;\n            }\n            let r = (u / n) as i32;\n            let c = (u % n) as i32;\n            for k in 0..4 {\n                let nr = r + dr[k];\n                let nc = c + dc[k];\n                if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                    continue;\n                }\n                let v = nr as usize * n + nc as usize;\n                let nd = d + grid[nr as usize][nc as usize];\n                if nd >= dist[v] {\n                    continue;\n                }\n                dist[v] = nd;\n                if grid[nr as usize][nc as usize] == 0 {\n                    cur.push(v);\n                } else {\n                    nxt.push(v);\n                }\n            }\n        }\n        cur = nxt;\n        d += 1;\n    }\n    dist[m * n - 1]\n}`,
        php: `function minimumObstacles($grid) {\n    $BIG = 1000000000;\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dist = array_fill(0, $m * $n, $BIG);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $dist[0] = 0;\n    $d = 0;\n    $cur = [0];\n    while (count($cur) > 0) {\n        $nxt = [];\n        for ($i = 0; $i < count($cur); $i++) {\n            $u = $cur[$i];\n            if ($dist[$u] < $d) continue;\n            $r = intdiv($u, $n);\n            $c = $u % $n;\n            for ($k = 0; $k < 4; $k++) {\n                $nr = $r + $dr[$k];\n                $nc = $c + $dc[$k];\n                if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                $v = $nr * $n + $nc;\n                $nd = $d + $grid[$nr][$nc];\n                if ($nd >= $dist[$v]) continue;\n                $dist[$v] = $nd;\n                if ($grid[$nr][$nc] === 0) $cur[] = $v;\n                else $nxt[] = $v;\n            }\n        }\n        $cur = $nxt;\n        $d++;\n    }\n    return $dist[$m * $n - 1];\n}`,
        ruby: `def minimumObstacles(grid)\n  big = 1000000000\n  m = grid.length\n  n = grid[0].length\n  dist = Array.new(m * n, big)\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  dist[0] = 0\n  d = 0\n  cur = [0]\n  until cur.empty?\n    nxt = []\n    i = 0\n    while i < cur.length\n      u = cur[i]\n      i += 1\n      next if dist[u] < d\n      r = u / n\n      c = u % n\n      (0...4).each do |k|\n        nr = r + dr[k]\n        nc = c + dc[k]\n        next if nr < 0 || nr >= m || nc < 0 || nc >= n\n        v = nr * n + nc\n        nd = d + grid[nr][nc]\n        next if nd >= dist[v]\n        dist[v] = nd\n        if grid[nr][nc] == 0\n          cur << v\n        else\n          nxt << v\n        end\n      end\n    end\n    cur = nxt\n    d += 1\n  end\n  dist[m * n - 1]\nend`,
      },
    };
  })(),

  // ── Find All People With Secret (LC 2092) ───────────────────────
  (() => {
    const ref = (n: number, meetings: number[][], firstPerson: number) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      const uni = (a: number, b: number) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[rb] = ra;
      };
      uni(0, firstPerson);
      const sorted = meetings.slice().sort((a, b) => a[2] - b[2]);
      let i = 0;
      while (i < sorted.length) {
        let j = i;
        while (j < sorted.length && sorted[j][2] === sorted[i][2]) j++;
        const people: number[] = [];
        for (let k = i; k < j; k++) {
          people.push(sorted[k][0]);
          people.push(sorted[k][1]);
          uni(sorted[k][0], sorted[k][1]);
        }
        const root = find(0);
        for (let k = 0; k < people.length; k++) {
          if (find(people[k]) !== root) parent[people[k]] = people[k];
        }
        i = j;
      }
      const out: number[] = [];
      const root = find(0);
      for (let p = 0; p < n; p++) if (find(p) === root) out.push(p);
      return out;
    };
    return {
      slug: "find-all-people-with-secret",
      title: "Find All People With Secret",
      difficulty: "HARD" as const,
      tags: ["Graph", "Union Find", "Depth-First Search", "Breadth-First Search", "Sorting", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "findAllPeople", params: [{ name: "n", type: "int" as const }, { name: "meetings", type: "int[][]" as const }, { name: "firstPerson", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` people labelled `0 … n - 1`. Person `0` holds a secret and shares it with `firstPerson` at time `0`.\n\n`meetings[i] = [x, y, time]` says persons `x` and `y` meet at that time. People who meet share the secret **immediately**, so a person who learns it during a meeting can pass it on in any other meeting happening at the **same** time. Meetings may happen at the same time, and a person may attend several of them.\n\nReturn everyone who ends up knowing the secret, in **increasing order**.",
        [
          { in: "n = 6, meetings = [[1,2,5],[2,3,8],[1,5,10]], firstPerson = 1", out: "[0,1,2,3,5]", note: "Person 4 never meets anyone who knows." },
          { in: "n = 4, meetings = [[3,1,3],[1,2,2],[0,3,3]], firstPerson = 3", out: "[0,1,3]", note: "Person 2's meeting with 1 happens *before* 1 learns anything." },
          { in: "n = 5, meetings = [[3,4,2],[1,2,1],[2,3,1]], firstPerson = 1", out: "[0,1,2,3,4]" },
        ],
        ["2 <= n <= 10^5", "1 <= meetings.length <= 10^5", "meetings[i].length == 3", "0 <= x, y <= n - 1", "x != y", "1 <= time <= 10^5", "1 <= firstPerson <= n - 1", "The answer is returned in increasing order."]),
      hints: [
        "Meetings at the same instant form one group, and the secret can travel freely inside it.",
        "So process the meetings in batches of equal time, using a union-find.",
        "After each batch, anyone in it who is **not** connected to person 0 must be disconnected again — they learned nothing.",
      ],
      editorial: explain({
        idea: "Sort the meetings by time and process each equal-time batch together. Within a batch, union every pair; afterwards, anyone in the batch not joined to person 0's component is reset to a singleton so a later meeting does not wrongly spread the secret through them.",
        steps: [
          "Union person 0 with `firstPerson`.",
          "Sort the meetings by time and walk them in equal-time runs.",
          "Union both attendees of each meeting in the run.",
          "For each person in the run, if their root is not person 0's root, reset their parent to themselves.",
          "Finally collect every person sharing person 0's root.",
        ],
        why: "The reset is the whole problem: without it, two people who merely met earlier would stay connected, so a secret arriving at one of them later would appear to have reached the other backwards in time. Resetting only the batch's participants is safe because, by induction, every component is either person 0's or a singleton before the batch begins.",
        time: "O(m log m + n)",
        space: "O(n)",
        pitfalls: [
          "Processing meetings one at a time misses the secret hopping between simultaneous meetings.",
          "Forgetting the reset lets the secret travel backwards in time.",
          "The output must be sorted; walking the people in order gives that for free.",
        ],
      }),
      examples: [
        { input: "6\n[[1,2,5],[2,3,8],[1,5,10]]\n1", expectedOutput: "[0,1,2,3,5]" },
        { input: "4\n[[3,1,3],[1,2,2],[0,3,3]]\n3", expectedOutput: "[0,1,3]" },
        { input: "5\n[[3,4,2],[1,2,1],[2,3,1]]\n1", expectedOutput: "[0,1,2,3,4]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 9);
        const count = ri(rng, 1, 10);
        const meetings: number[][] = [];
        for (let k = 0; k < count; k++) {
          const x = ri(rng, 0, n - 1);
          const y = (x + ri(rng, 1, n - 1)) % n;
          // A narrow time range makes simultaneous meetings common.
          meetings.push([x, y, ri(rng, 1, 4)]);
        }
        const firstPerson = ri(rng, 1, n - 1);
        return {
          input: `${n}\n${fmtIntMat(meetings)}\n${firstPerson}`,
          expectedOutput: fmtIntArr(ref(n, meetings, firstPerson)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef findAllPeople(n: int, meetings: List[List[int]], firstPerson: int) -> List[int]:\n    parent = list(range(n))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    def uni(a: int, b: int) -> None:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[rb] = ra\n\n    uni(0, firstPerson)\n    ordered = sorted(meetings, key=lambda m: m[2])\n    i = 0\n    while i < len(ordered):\n        j = i\n        while j < len(ordered) and ordered[j][2] == ordered[i][2]:\n            j += 1\n        people = []\n        for k in range(i, j):\n            people.append(ordered[k][0])\n            people.append(ordered[k][1])\n            uni(ordered[k][0], ordered[k][1])\n        root = find(0)\n        for p in people:\n            if find(p) != root:\n                parent[p] = p\n        i = j\n    root = find(0)\n    return [p for p in range(n) if find(p) == root]`,
        javascript: `var findAllPeople = function(n, meetings, firstPerson) {\n    var i, k;\n    var parent = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var uni = function(a, b) {\n        var ra = find(a), rb = find(b);\n        if (ra !== rb) parent[rb] = ra;\n    };\n    uni(0, firstPerson);\n    var sorted = meetings.slice();\n    sorted.sort(function(a, b) { return a[2] - b[2]; });\n    i = 0;\n    while (i < sorted.length) {\n        var j = i;\n        while (j < sorted.length && sorted[j][2] === sorted[i][2]) j++;\n        var people = [];\n        for (k = i; k < j; k++) {\n            people.push(sorted[k][0]);\n            people.push(sorted[k][1]);\n            uni(sorted[k][0], sorted[k][1]);\n        }\n        var root = find(0);\n        for (k = 0; k < people.length; k++) {\n            if (find(people[k]) !== root) parent[people[k]] = people[k];\n        }\n        i = j;\n    }\n    var out = [];\n    var finalRoot = find(0);\n    for (var p = 0; p < n; p++) if (find(p) === finalRoot) out.push(p);\n    return out;\n};`,
        typescript: `function findAllPeople(n: number, meetings: number[][], firstPerson: number): number[] {\n    var i: number, k: number;\n    var parent: number[] = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var uni = function(a: number, b: number): void {\n        var ra = find(a), rb = find(b);\n        if (ra !== rb) parent[rb] = ra;\n    };\n    uni(0, firstPerson);\n    var sorted = meetings.slice();\n    sorted.sort(function(a: number[], b: number[]) { return a[2] - b[2]; });\n    i = 0;\n    while (i < sorted.length) {\n        var j = i;\n        while (j < sorted.length && sorted[j][2] === sorted[i][2]) j++;\n        var people: number[] = [];\n        for (k = i; k < j; k++) {\n            people.push(sorted[k][0]);\n            people.push(sorted[k][1]);\n            uni(sorted[k][0], sorted[k][1]);\n        }\n        var root = find(0);\n        for (k = 0; k < people.length; k++) {\n            if (find(people[k]) !== root) parent[people[k]] = people[k];\n        }\n        i = j;\n    }\n    var out: number[] = [];\n    var finalRoot = find(0);\n    for (var p = 0; p < n; p++) if (find(p) === finalRoot) out.push(p);\n    return out;\n}`,
        java: `private static int[] fpParent;\n\nprivate static int fpFind(int x) {\n    while (fpParent[x] != x) {\n        fpParent[x] = fpParent[fpParent[x]];\n        x = fpParent[x];\n    }\n    return x;\n}\n\nprivate static void fpUni(int a, int b) {\n    int ra = fpFind(a), rb = fpFind(b);\n    if (ra != rb) fpParent[rb] = ra;\n}\n\npublic static int[] findAllPeople(int n, int[][] meetings, int firstPerson) {\n    fpParent = new int[n];\n    for (int i = 0; i < n; i++) fpParent[i] = i;\n    fpUni(0, firstPerson);\n    int[][] sorted = meetings.clone();\n    Arrays.sort(sorted, (a, b) -> a[2] - b[2]);\n    int i = 0;\n    while (i < sorted.length) {\n        int j = i;\n        while (j < sorted.length && sorted[j][2] == sorted[i][2]) j++;\n        List<Integer> people = new ArrayList<>();\n        for (int k = i; k < j; k++) {\n            people.add(sorted[k][0]);\n            people.add(sorted[k][1]);\n            fpUni(sorted[k][0], sorted[k][1]);\n        }\n        int root = fpFind(0);\n        for (int p : people) {\n            if (fpFind(p) != root) fpParent[p] = p;\n        }\n        i = j;\n    }\n    List<Integer> out = new ArrayList<>();\n    int finalRoot = fpFind(0);\n    for (int p = 0; p < n; p++) if (fpFind(p) == finalRoot) out.add(p);\n    int[] res = new int[out.size()];\n    for (int k = 0; k < res.length; k++) res[k] = out.get(k);\n    return res;\n}`,
        cpp: `vector<int> findAllPeople(int n, vector<vector<int>>& meetings, int firstPerson) {\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    auto uni = [&](int a, int b) {\n        int ra = find(a), rb = find(b);\n        if (ra != rb) parent[rb] = ra;\n    };\n    uni(0, firstPerson);\n    vector<vector<int>> sorted = meetings;\n    sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) {\n        return a[2] < b[2];\n    });\n    size_t i = 0;\n    while (i < sorted.size()) {\n        size_t j = i;\n        while (j < sorted.size() && sorted[j][2] == sorted[i][2]) j++;\n        vector<int> people;\n        for (size_t k = i; k < j; k++) {\n            people.push_back(sorted[k][0]);\n            people.push_back(sorted[k][1]);\n            uni(sorted[k][0], sorted[k][1]);\n        }\n        int root = find(0);\n        for (int p : people) {\n            if (find(p) != root) parent[p] = p;\n        }\n        i = j;\n    }\n    vector<int> out;\n    int finalRoot = find(0);\n    for (int p = 0; p < n; p++) if (find(p) == finalRoot) out.push_back(p);\n    return out;\n}`,
        c: `static int* fpParent;\n\nstatic int fpFind(int x) {\n    while (fpParent[x] != x) {\n        fpParent[x] = fpParent[fpParent[x]];\n        x = fpParent[x];\n    }\n    return x;\n}\n\nstatic void fpUni(int a, int b) {\n    int ra = fpFind(a), rb = fpFind(b);\n    if (ra != rb) fpParent[rb] = ra;\n}\n\nstatic int fpCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return x[2] - y[2];\n}\n\nint* findAllPeople(int n, int** meetings, int meetingsSize, int* meetingsColSize, int firstPerson, int* returnSize) {\n    (void) meetingsColSize;\n    fpParent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) fpParent[i] = i;\n    fpUni(0, firstPerson);\n    int cap = meetingsSize > 0 ? meetingsSize : 1;\n    int* flat = (int*) malloc((size_t) cap * 3 * sizeof(int));\n    for (int i = 0; i < meetingsSize; i++) {\n        flat[i * 3] = meetings[i][0];\n        flat[i * 3 + 1] = meetings[i][1];\n        flat[i * 3 + 2] = meetings[i][2];\n    }\n    qsort(flat, (size_t) meetingsSize, 3 * sizeof(int), fpCmp);\n    int* people = (int*) malloc((size_t) cap * 2 * sizeof(int));\n    int i = 0;\n    while (i < meetingsSize) {\n        int j = i;\n        while (j < meetingsSize && flat[j * 3 + 2] == flat[i * 3 + 2]) j++;\n        int cnt = 0;\n        for (int k = i; k < j; k++) {\n            people[cnt++] = flat[k * 3];\n            people[cnt++] = flat[k * 3 + 1];\n            fpUni(flat[k * 3], flat[k * 3 + 1]);\n        }\n        int root = fpFind(0);\n        for (int k = 0; k < cnt; k++) {\n            if (fpFind(people[k]) != root) fpParent[people[k]] = people[k];\n        }\n        i = j;\n    }\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    int cnt = 0;\n    int finalRoot = fpFind(0);\n    for (int p = 0; p < n; p++) if (fpFind(p) == finalRoot) out[cnt++] = p;\n    free(fpParent); free(flat); free(people);\n    *returnSize = cnt;\n    return out;\n}`,
        csharp: `public static int[] FindAllPeople(int n, int[][] meetings, int firstPerson)\n{\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    void Uni(int a, int b)\n    {\n        int ra = Find(a), rb = Find(b);\n        if (ra != rb) parent[rb] = ra;\n    }\n    Uni(0, firstPerson);\n    var sorted = (int[][]) meetings.Clone();\n    Array.Sort(sorted, (a, b) => a[2] - b[2]);\n    int idx = 0;\n    while (idx < sorted.Length)\n    {\n        int j = idx;\n        while (j < sorted.Length && sorted[j][2] == sorted[idx][2]) j++;\n        var people = new List<int>();\n        for (int k = idx; k < j; k++)\n        {\n            people.Add(sorted[k][0]);\n            people.Add(sorted[k][1]);\n            Uni(sorted[k][0], sorted[k][1]);\n        }\n        int root = Find(0);\n        foreach (var p in people)\n        {\n            if (Find(p) != root) parent[p] = p;\n        }\n        idx = j;\n    }\n    var res = new List<int>();\n    int finalRoot = Find(0);\n    for (int p = 0; p < n; p++) if (Find(p) == finalRoot) res.Add(p);\n    return res.ToArray();\n}`,
        go: `func findAllPeople(n int, meetings [][]int, firstPerson int) []int {\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tuni := func(a, b int) {\n\t\tra, rb := find(a), find(b)\n\t\tif ra != rb {\n\t\t\tparent[rb] = ra\n\t\t}\n\t}\n\tuni(0, firstPerson)\n\tsorted := make([][]int, len(meetings))\n\tcopy(sorted, meetings)\n\tsort.Slice(sorted, func(i, j int) bool { return sorted[i][2] < sorted[j][2] })\n\ti := 0\n\tfor i < len(sorted) {\n\t\tj := i\n\t\tfor j < len(sorted) && sorted[j][2] == sorted[i][2] {\n\t\t\tj++\n\t\t}\n\t\tpeople := []int{}\n\t\tfor k := i; k < j; k++ {\n\t\t\tpeople = append(people, sorted[k][0], sorted[k][1])\n\t\t\tuni(sorted[k][0], sorted[k][1])\n\t\t}\n\t\troot := find(0)\n\t\tfor _, p := range people {\n\t\t\tif find(p) != root {\n\t\t\t\tparent[p] = p\n\t\t\t}\n\t\t}\n\t\ti = j\n\t}\n\tout := []int{}\n\tfinalRoot := find(0)\n\tfor p := 0; p < n; p++ {\n\t\tif find(p) == finalRoot {\n\t\t\tout = append(out, p)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findAllPeople(n: Int, meetings: Array<IntArray>, firstPerson: Int): IntArray {\n    val parent = IntArray(n) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    fun uni(a: Int, b: Int) {\n        val ra = find(a)\n        val rb = find(b)\n        if (ra != rb) parent[rb] = ra\n    }\n    uni(0, firstPerson)\n    val sorted = meetings.sortedBy { it[2] }\n    var i = 0\n    while (i < sorted.size) {\n        var j = i\n        while (j < sorted.size && sorted[j][2] == sorted[i][2]) j++\n        val people = ArrayList<Int>()\n        for (k in i until j) {\n            people.add(sorted[k][0])\n            people.add(sorted[k][1])\n            uni(sorted[k][0], sorted[k][1])\n        }\n        val root = find(0)\n        for (p in people) {\n            if (find(p) != root) parent[p] = p\n        }\n        i = j\n    }\n    val finalRoot = find(0)\n    return (0 until n).filter { find(it) == finalRoot }.toIntArray()\n}`,
        swift: `func findAllPeople(_ n: Int, _ meetings: [[Int]], _ firstPerson: Int) -> [Int] {\n    var parent = Array(0..<n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    func uni(_ a: Int, _ b: Int) {\n        let ra = find(a), rb = find(b)\n        if ra != rb { parent[rb] = ra }\n    }\n    uni(0, firstPerson)\n    let sorted = meetings.sorted { $0[2] < $1[2] }\n    var i = 0\n    while i < sorted.count {\n        var j = i\n        while j < sorted.count && sorted[j][2] == sorted[i][2] { j += 1 }\n        var people = [Int]()\n        for k in i..<j {\n            people.append(sorted[k][0])\n            people.append(sorted[k][1])\n            uni(sorted[k][0], sorted[k][1])\n        }\n        let root = find(0)\n        for p in people where find(p) != root { parent[p] = p }\n        i = j\n    }\n    let finalRoot = find(0)\n    return (0..<n).filter { find($0) == finalRoot }\n}`,
        rust: `fn findAllPeople(n: i32, meetings: Vec<Vec<i32>>, firstPerson: i32) -> Vec<i32> {\n    let n = n as usize;\n    let mut parent: Vec<usize> = (0..n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    let ra = find(&mut parent, 0);\n    let rb = find(&mut parent, firstPerson as usize);\n    if ra != rb {\n        parent[rb] = ra;\n    }\n    let mut sorted = meetings.clone();\n    sorted.sort_by_key(|m| m[2]);\n    let mut i = 0usize;\n    while i < sorted.len() {\n        let mut j = i;\n        while j < sorted.len() && sorted[j][2] == sorted[i][2] {\n            j += 1;\n        }\n        let mut people: Vec<usize> = Vec::new();\n        for k in i..j {\n            let a = sorted[k][0] as usize;\n            let b = sorted[k][1] as usize;\n            people.push(a);\n            people.push(b);\n            let ra = find(&mut parent, a);\n            let rb = find(&mut parent, b);\n            if ra != rb {\n                parent[rb] = ra;\n            }\n        }\n        let root = find(&mut parent, 0);\n        for &p in people.iter() {\n            if find(&mut parent, p) != root {\n                parent[p] = p;\n            }\n        }\n        i = j;\n    }\n    let final_root = find(&mut parent, 0);\n    (0..n)\n        .filter(|&p| find(&mut parent, p) == final_root)\n        .map(|p| p as i32)\n        .collect()\n}`,
        php: `function findAllPeople($n, $meetings, $firstPerson) {\n    $parent = range(0, $n - 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    $uni = function($a, $b) use (&$parent, $find) {\n        $ra = $find($a);\n        $rb = $find($b);\n        if ($ra !== $rb) $parent[$rb] = $ra;\n    };\n    $uni(0, $firstPerson);\n    $sorted = $meetings;\n    usort($sorted, function($a, $b) { return $a[2] - $b[2]; });\n    $i = 0;\n    while ($i < count($sorted)) {\n        $j = $i;\n        while ($j < count($sorted) && $sorted[$j][2] === $sorted[$i][2]) $j++;\n        $people = [];\n        for ($k = $i; $k < $j; $k++) {\n            $people[] = $sorted[$k][0];\n            $people[] = $sorted[$k][1];\n            $uni($sorted[$k][0], $sorted[$k][1]);\n        }\n        $root = $find(0);\n        foreach ($people as $p) {\n            if ($find($p) !== $root) $parent[$p] = $p;\n        }\n        $i = $j;\n    }\n    $out = [];\n    $finalRoot = $find(0);\n    for ($p = 0; $p < $n; $p++) if ($find($p) === $finalRoot) $out[] = $p;\n    return $out;\n}`,
        ruby: `def findAllPeople(n, meetings, firstPerson)\n  parent = (0...n).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  uni = lambda do |a, b|\n    ra = find.call(a)\n    rb = find.call(b)\n    parent[rb] = ra if ra != rb\n  end\n  uni.call(0, firstPerson)\n  sorted = meetings.sort_by { |m| m[2] }\n  i = 0\n  while i < sorted.length\n    j = i\n    j += 1 while j < sorted.length && sorted[j][2] == sorted[i][2]\n    people = []\n    (i...j).each do |k|\n      people << sorted[k][0] << sorted[k][1]\n      uni.call(sorted[k][0], sorted[k][1])\n    end\n    root = find.call(0)\n    people.each { |p| parent[p] = p if find.call(p) != root }\n    i = j\n  end\n  final_root = find.call(0)\n  (0...n).select { |p| find.call(p) == final_root }\nend`,
      },
    };
  })(),

  // ── Checking Existence of Edge Length Limited Paths (LC 1697) ───
  (() => {
    const ref = (n: number, edgeList: number[][], queries: number[][]) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      const es = edgeList.slice().sort((a, b) => a[2] - b[2]);
      const order = queries.map((_, i) => i).sort((a, b) => queries[a][2] - queries[b][2]);
      const out = new Array(queries.length).fill(0);
      let e = 0;
      for (let k = 0; k < order.length; k++) {
        const idx = order[k];
        const limit = queries[idx][2];
        while (e < es.length && es[e][2] < limit) {
          const ra = find(es[e][0]), rb = find(es[e][1]);
          if (ra !== rb) parent[rb] = ra;
          e++;
        }
        out[idx] = find(queries[idx][0]) === find(queries[idx][1]) ? 1 : 0;
      }
      return out;
    };
    return {
      slug: "checking-existence-of-edge-length-limited-paths",
      title: "Checking Existence of Edge Length Limited Paths",
      difficulty: "HARD" as const,
      tags: ["Array", "Union Find", "Graph", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "distanceLimitedPathsExist", params: [{ name: "n", type: "int" as const }, { name: "edgeList", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "An undirected graph on `n` nodes is given by `edgeList[i] = [u, v, distance]`; there may be several edges between the same pair, and some nodes may be unreachable from others.\n\nFor each `queries[j] = [p, q, limit]`, answer `1` if there is a path from `p` to `q` using **only** edges of distance **strictly less than** `limit`, and `0` otherwise.",
        [
          { in: "n = 3, edgeList = [[0,1,2],[1,2,4],[2,0,8],[1,0,16]], queries = [[0,1,2],[0,2,5]]", out: "[0,1]", note: "The first query's limit of 2 excludes the only 0–1 edge; the second reaches 2 via `0 → 1 → 2`." },
          { in: "n = 5, edgeList = [[0,1,10],[1,2,5],[2,3,9],[3,4,13]], queries = [[0,4,14],[1,4,13]]", out: "[1,0]" },
          { in: "n = 2, edgeList = [[0,1,1]], queries = [[0,1,1]]", out: "[0]", note: "The limit is strict, so a distance of exactly 1 does not qualify." },
        ],
        ["2 <= n <= 10^5", "1 <= edgeList.length, queries.length <= 10^5", "edgeList[i].length == 3", "queries[j].length == 3", "0 <= u, v, p, q <= n - 1", "u != v", "p != q", "1 <= distance, limit <= 10^9", "There may be multiple edges between two nodes."]),
      hints: [
        "Answering each query with its own search is far too slow.",
        "Answer the queries **offline**, in increasing order of their limit.",
        "Then a union-find only ever gains edges, never loses them.",
      ],
      editorial: explain({
        idea: "Sort the edges by distance and the queries by limit, then sweep. Before answering a query, add every edge shorter than its limit to a union-find; the answer is whether the two nodes now share a root.",
        steps: [
          "Sort the edges ascending by distance.",
          "Sort the query **indices** by limit, keeping the original positions for the output.",
          "For each query in that order, union in all remaining edges with distance `< limit`.",
          "Record whether the two endpoints share a root, writing into the original position.",
        ],
        why: "Processing queries in increasing limit means the edge pointer only ever moves forward, so every edge is added at most once across all queries — that is what makes the whole sweep near-linear. It also means the union-find is never asked to remove an edge, which it cannot do.",
        time: "O((m + q) log(m + q) · α(n))",
        space: "O(n + q)",
        pitfalls: [
          "The limit is **strict**: an edge of distance exactly `limit` must not be used.",
          "Answers must be written back in the queries' original order.",
          "Multiple edges between the same pair are harmless — the union simply has no effect the second time.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1,2],[1,2,4],[2,0,8],[1,0,16]]\n[[0,1,2],[0,2,5]]", expectedOutput: "[0,1]" },
        { input: "5\n[[0,1,10],[1,2,5],[2,3,9],[3,4,13]]\n[[0,4,14],[1,4,13]]", expectedOutput: "[1,0]" },
        { input: "2\n[[0,1,1]]\n[[0,1,1]]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 9);
        const edgeList: number[][] = [];
        const count = ri(rng, 1, 10);
        for (let k = 0; k < count; k++) {
          const u = ri(rng, 0, n - 1);
          const v = (u + ri(rng, 1, n - 1)) % n;
          edgeList.push([u, v, ri(rng, 1, 12)]);
        }
        const queries: number[][] = [];
        const qCount = ri(rng, 1, 6);
        for (let k = 0; k < qCount; k++) {
          const p = ri(rng, 0, n - 1);
          const q = (p + ri(rng, 1, n - 1)) % n;
          queries.push([p, q, ri(rng, 1, 14)]);
        }
        return {
          input: `${n}\n${fmtIntMat(edgeList)}\n${fmtIntMat(queries)}`,
          expectedOutput: fmtIntArr(ref(n, edgeList, queries)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef distanceLimitedPathsExist(n: int, edgeList: List[List[int]], queries: List[List[int]]) -> List[int]:\n    parent = list(range(n))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    es = sorted(edgeList, key=lambda e: e[2])\n    order = sorted(range(len(queries)), key=lambda i: queries[i][2])\n    out = [0] * len(queries)\n    e = 0\n    for idx in order:\n        p, q, limit = queries[idx]\n        while e < len(es) and es[e][2] < limit:\n            ra, rb = find(es[e][0]), find(es[e][1])\n            if ra != rb:\n                parent[rb] = ra\n            e += 1\n        out[idx] = 1 if find(p) == find(q) else 0\n    return out`,
        javascript: `var distanceLimitedPathsExist = function(n, edgeList, queries) {\n    var i;\n    var parent = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var es = edgeList.slice();\n    es.sort(function(a, b) { return a[2] - b[2]; });\n    var order = [];\n    for (i = 0; i < queries.length; i++) order.push(i);\n    order.sort(function(a, b) { return queries[a][2] - queries[b][2]; });\n    var out = [];\n    for (i = 0; i < queries.length; i++) out.push(0);\n    var e = 0;\n    for (var k = 0; k < order.length; k++) {\n        var idx = order[k];\n        var limit = queries[idx][2];\n        while (e < es.length && es[e][2] < limit) {\n            var ra = find(es[e][0]), rb = find(es[e][1]);\n            if (ra !== rb) parent[rb] = ra;\n            e++;\n        }\n        out[idx] = find(queries[idx][0]) === find(queries[idx][1]) ? 1 : 0;\n    }\n    return out;\n};`,
        typescript: `function distanceLimitedPathsExist(n: number, edgeList: number[][], queries: number[][]): number[] {\n    var i: number;\n    var parent: number[] = [];\n    for (i = 0; i < n; i++) parent.push(i);\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    var es = edgeList.slice();\n    es.sort(function(a: number[], b: number[]) { return a[2] - b[2]; });\n    var order: number[] = [];\n    for (i = 0; i < queries.length; i++) order.push(i);\n    order.sort(function(a: number, b: number) { return queries[a][2] - queries[b][2]; });\n    var out: number[] = [];\n    for (i = 0; i < queries.length; i++) out.push(0);\n    var e = 0;\n    for (var k = 0; k < order.length; k++) {\n        var idx = order[k];\n        var limit = queries[idx][2];\n        while (e < es.length && es[e][2] < limit) {\n            var ra = find(es[e][0]), rb = find(es[e][1]);\n            if (ra !== rb) parent[rb] = ra;\n            e++;\n        }\n        out[idx] = find(queries[idx][0]) === find(queries[idx][1]) ? 1 : 0;\n    }\n    return out;\n}`,
        java: `private static int[] elParent;\n\nprivate static int elFind(int x) {\n    while (elParent[x] != x) {\n        elParent[x] = elParent[elParent[x]];\n        x = elParent[x];\n    }\n    return x;\n}\n\npublic static int[] distanceLimitedPathsExist(int n, int[][] edgeList, int[][] queries) {\n    elParent = new int[n];\n    for (int i = 0; i < n; i++) elParent[i] = i;\n    int[][] es = edgeList.clone();\n    Arrays.sort(es, (a, b) -> Integer.compare(a[2], b[2]));\n    Integer[] order = new Integer[queries.length];\n    for (int i = 0; i < queries.length; i++) order[i] = i;\n    Arrays.sort(order, (a, b) -> Integer.compare(queries[a][2], queries[b][2]));\n    int[] out = new int[queries.length];\n    int e = 0;\n    for (int idx : order) {\n        int limit = queries[idx][2];\n        while (e < es.length && es[e][2] < limit) {\n            int ra = elFind(es[e][0]), rb = elFind(es[e][1]);\n            if (ra != rb) elParent[rb] = ra;\n            e++;\n        }\n        out[idx] = elFind(queries[idx][0]) == elFind(queries[idx][1]) ? 1 : 0;\n    }\n    return out;\n}`,
        cpp: `vector<int> distanceLimitedPathsExist(int n, vector<vector<int>>& edgeList, vector<vector<int>>& queries) {\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    vector<vector<int>> es = edgeList;\n    sort(es.begin(), es.end(), [](const vector<int>& a, const vector<int>& b) { return a[2] < b[2]; });\n    vector<int> order(queries.size());\n    for (size_t i = 0; i < order.size(); i++) order[i] = (int) i;\n    sort(order.begin(), order.end(), [&](int a, int b) { return queries[a][2] < queries[b][2]; });\n    vector<int> out(queries.size(), 0);\n    size_t e = 0;\n    for (int idx : order) {\n        int limit = queries[idx][2];\n        while (e < es.size() && es[e][2] < limit) {\n            int ra = find(es[e][0]), rb = find(es[e][1]);\n            if (ra != rb) parent[rb] = ra;\n            e++;\n        }\n        out[idx] = find(queries[idx][0]) == find(queries[idx][1]) ? 1 : 0;\n    }\n    return out;\n}`,
        c: `static int* elParent;\nstatic int** elQueries;\n\nstatic int elFind(int x) {\n    while (elParent[x] != x) {\n        elParent[x] = elParent[elParent[x]];\n        x = elParent[x];\n    }\n    return x;\n}\n\nstatic int elEdgeCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return x[2] < y[2] ? -1 : (x[2] > y[2] ? 1 : 0);\n}\n\nstatic int elQueryCmp(const void* a, const void* b) {\n    int i = *(const int*) a;\n    int j = *(const int*) b;\n    int li = elQueries[i][2], lj = elQueries[j][2];\n    return li < lj ? -1 : (li > lj ? 1 : 0);\n}\n\nint* distanceLimitedPathsExist(int n, int** edgeList, int edgeListSize, int* edgeListColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {\n    (void) edgeListColSize;\n    (void) queriesColSize;\n    elParent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) elParent[i] = i;\n    int* es = (int*) malloc((size_t) (edgeListSize > 0 ? edgeListSize : 1) * 3 * sizeof(int));\n    for (int i = 0; i < edgeListSize; i++) {\n        es[i * 3] = edgeList[i][0];\n        es[i * 3 + 1] = edgeList[i][1];\n        es[i * 3 + 2] = edgeList[i][2];\n    }\n    qsort(es, (size_t) edgeListSize, 3 * sizeof(int), elEdgeCmp);\n    int* order = (int*) malloc((size_t) (queriesSize > 0 ? queriesSize : 1) * sizeof(int));\n    for (int i = 0; i < queriesSize; i++) order[i] = i;\n    elQueries = queries;\n    qsort(order, (size_t) queriesSize, sizeof(int), elQueryCmp);\n    int* out = (int*) calloc((size_t) (queriesSize > 0 ? queriesSize : 1), sizeof(int));\n    int e = 0;\n    for (int k = 0; k < queriesSize; k++) {\n        int idx = order[k];\n        int limit = queries[idx][2];\n        while (e < edgeListSize && es[e * 3 + 2] < limit) {\n            int ra = elFind(es[e * 3]), rb = elFind(es[e * 3 + 1]);\n            if (ra != rb) elParent[rb] = ra;\n            e++;\n        }\n        out[idx] = elFind(queries[idx][0]) == elFind(queries[idx][1]) ? 1 : 0;\n    }\n    free(elParent); free(es); free(order);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] DistanceLimitedPathsExist(int n, int[][] edgeList, int[][] queries)\n{\n    var parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    var es = (int[][]) edgeList.Clone();\n    Array.Sort(es, (a, b) => a[2].CompareTo(b[2]));\n    var order = new int[queries.Length];\n    for (int i = 0; i < queries.Length; i++) order[i] = i;\n    Array.Sort(order, (a, b) => queries[a][2].CompareTo(queries[b][2]));\n    var out_ = new int[queries.Length];\n    int e = 0;\n    foreach (var idx in order)\n    {\n        int limit = queries[idx][2];\n        while (e < es.Length && es[e][2] < limit)\n        {\n            int ra = Find(es[e][0]), rb = Find(es[e][1]);\n            if (ra != rb) parent[rb] = ra;\n            e++;\n        }\n        out_[idx] = Find(queries[idx][0]) == Find(queries[idx][1]) ? 1 : 0;\n    }\n    return out_;\n}`,
        go: `func distanceLimitedPathsExist(n int, edgeList [][]int, queries [][]int) []int {\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tes := make([][]int, len(edgeList))\n\tcopy(es, edgeList)\n\tsort.Slice(es, func(i, j int) bool { return es[i][2] < es[j][2] })\n\torder := make([]int, len(queries))\n\tfor i := range order {\n\t\torder[i] = i\n\t}\n\tsort.Slice(order, func(a, b int) bool { return queries[order[a]][2] < queries[order[b]][2] })\n\tout := make([]int, len(queries))\n\te := 0\n\tfor _, idx := range order {\n\t\tlimit := queries[idx][2]\n\t\tfor e < len(es) && es[e][2] < limit {\n\t\t\tra, rb := find(es[e][0]), find(es[e][1])\n\t\t\tif ra != rb {\n\t\t\t\tparent[rb] = ra\n\t\t\t}\n\t\t\te++\n\t\t}\n\t\tif find(queries[idx][0]) == find(queries[idx][1]) {\n\t\t\tout[idx] = 1\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun distanceLimitedPathsExist(n: Int, edgeList: Array<IntArray>, queries: Array<IntArray>): IntArray {\n    val parent = IntArray(n) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    val es = edgeList.sortedBy { it[2] }\n    val order = queries.indices.sortedBy { queries[it][2] }\n    val out = IntArray(queries.size)\n    var e = 0\n    for (idx in order) {\n        val limit = queries[idx][2]\n        while (e < es.size && es[e][2] < limit) {\n            val ra = find(es[e][0])\n            val rb = find(es[e][1])\n            if (ra != rb) parent[rb] = ra\n            e++\n        }\n        out[idx] = if (find(queries[idx][0]) == find(queries[idx][1])) 1 else 0\n    }\n    return out\n}`,
        swift: `func distanceLimitedPathsExist(_ n: Int, _ edgeList: [[Int]], _ queries: [[Int]]) -> [Int] {\n    var parent = Array(0..<n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    let es = edgeList.sorted { $0[2] < $1[2] }\n    let order = Array(0..<queries.count).sorted { queries[$0][2] < queries[$1][2] }\n    var out = [Int](repeating: 0, count: queries.count)\n    var e = 0\n    for idx in order {\n        let limit = queries[idx][2]\n        while e < es.count && es[e][2] < limit {\n            let ra = find(es[e][0]), rb = find(es[e][1])\n            if ra != rb { parent[rb] = ra }\n            e += 1\n        }\n        out[idx] = find(queries[idx][0]) == find(queries[idx][1]) ? 1 : 0\n    }\n    return out\n}`,
        rust: `fn distanceLimitedPathsExist(n: i32, edgeList: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = n as usize;\n    let mut parent: Vec<usize> = (0..n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    let mut es = edgeList.clone();\n    es.sort_by_key(|e| e[2]);\n    let mut order: Vec<usize> = (0..queries.len()).collect();\n    order.sort_by_key(|&i| queries[i][2]);\n    let mut out = vec![0i32; queries.len()];\n    let mut e = 0usize;\n    for &idx in order.iter() {\n        let limit = queries[idx][2];\n        while e < es.len() && es[e][2] < limit {\n            let ra = find(&mut parent, es[e][0] as usize);\n            let rb = find(&mut parent, es[e][1] as usize);\n            if ra != rb {\n                parent[rb] = ra;\n            }\n            e += 1;\n        }\n        let a = find(&mut parent, queries[idx][0] as usize);\n        let b = find(&mut parent, queries[idx][1] as usize);\n        out[idx] = if a == b { 1 } else { 0 };\n    }\n    out\n}`,
        php: `function distanceLimitedPathsExist($n, $edgeList, $queries) {\n    $parent = range(0, $n - 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    $es = $edgeList;\n    usort($es, function($a, $b) { return $a[2] <=> $b[2]; });\n    $order = range(0, count($queries) - 1);\n    usort($order, function($a, $b) use ($queries) { return $queries[$a][2] <=> $queries[$b][2]; });\n    $out = array_fill(0, count($queries), 0);\n    $e = 0;\n    foreach ($order as $idx) {\n        $limit = $queries[$idx][2];\n        while ($e < count($es) && $es[$e][2] < $limit) {\n            $ra = $find($es[$e][0]);\n            $rb = $find($es[$e][1]);\n            if ($ra !== $rb) $parent[$rb] = $ra;\n            $e++;\n        }\n        $out[$idx] = $find($queries[$idx][0]) === $find($queries[$idx][1]) ? 1 : 0;\n    }\n    return $out;\n}`,
        ruby: `def distanceLimitedPathsExist(n, edgeList, queries)\n  parent = (0...n).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  es = edgeList.sort_by { |e| e[2] }\n  order = (0...queries.length).sort_by { |i| queries[i][2] }\n  out = Array.new(queries.length, 0)\n  e = 0\n  order.each do |idx|\n    limit = queries[idx][2]\n    while e < es.length && es[e][2] < limit\n      ra = find.call(es[e][0])\n      rb = find.call(es[e][1])\n      parent[rb] = ra if ra != rb\n      e += 1\n    end\n    out[idx] = find.call(queries[idx][0]) == find.call(queries[idx][1]) ? 1 : 0\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Number of Increasing Paths in a Grid (LC 2328) ──────────────
  (() => {
    const MOD = 1000000007;
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      const order = Array.from({ length: m * n }, (_, i) => i)
        .sort((a, b) => grid[Math.floor(b / n)][b % n] - grid[Math.floor(a / n)][a % n]);
      const ways = new Array(m * n).fill(0);
      let total = 0;
      for (let t = 0; t < order.length; t++) {
        const u = order[t];
        const r = Math.floor(u / n), c = u % n;
        let sum = 1;
        for (let k = 0; k < 4; k++) {
          const nr = r + dr[k], nc = c + dc[k];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
          if (grid[nr][nc] <= grid[r][c]) continue;
          sum = (sum + ways[nr * n + nc]) % MOD;
        }
        ways[u] = sum;
        total = (total + sum) % MOD;
      }
      return total;
    };
    return {
      slug: "number-of-increasing-paths-in-a-grid",
      title: "Number of Increasing Paths in a Grid",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Depth-First Search", "Topological Sort", "Memoization", "Amazon", "Google", "Adobe"],
      signature: { funcName: "countPaths", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "From any cell of a grid you may move to an adjacent cell — up, down, left or right — whose value is **strictly greater**.\n\nReturn the number of strictly increasing paths, starting from any cell and of any length (a single cell counts as a path), modulo `10^9 + 7`. Two paths differ if they visit a different sequence of cells.",
        [
          { in: "grid = [[1,1],[3,4]]", out: "8", note: "The four single cells, plus `1 → 3`, `1 → 4`, `3 → 4` and `1 → 3 → 4`." },
          { in: "grid = [[1],[2]]", out: "3", note: "Two single cells and `1 → 2`." },
          { in: "grid = [[5,5],[5,5]]", out: "4", note: "No move is ever possible, so only the single cells count." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "1 <= grid[i][j] <= 10^5"]),
      hints: [
        "Let `ways[cell]` be the number of increasing paths **starting** at that cell.",
        "Then `ways[cell] = 1 + Σ ways[neighbour]` over strictly greater neighbours.",
        "Process the cells in decreasing order of value so every neighbour is already finished.",
      ],
      editorial: explain({
        idea: "Count paths by their starting cell. A path from a cell is either the cell alone or a step to a strictly greater neighbour followed by a path from there, which gives a clean recurrence.",
        steps: [
          "Sort the cells by value, largest first.",
          "For each cell, start at 1 and add `ways[neighbour]` for every strictly greater neighbour.",
          "Accumulate every `ways[cell]` into the answer, modulo `10^9 + 7`.",
        ],
        why: "The strict increase forbids cycles, so the recurrence is well founded, and descending value order is a topological order for it: a strictly greater neighbour always comes earlier. That also means no explicit memoisation table is needed beyond `ways` itself — each cell is computed exactly once.",
        time: "O(m · n · log(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "Equal neighbours are not moves; the increase is strict.",
          "Every single cell is a path, which is where the `1` in the recurrence comes from.",
          "Reduce modulo `10^9 + 7` while summing, not only at the end.",
        ],
      }),
      examples: [
        { input: "[[1,1],[3,4]]", expectedOutput: "8" },
        { input: "[[1],[2]]", expectedOutput: "3" },
        { input: "[[5,5],[5,5]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const hi = pick(rng, [2, 5, 25]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPaths(grid: List[List[int]]) -> int:\n    MOD = 1000000007\n    m, n = len(grid), len(grid[0])\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    order = sorted(range(m * n), key=lambda u: -grid[u // n][u % n])\n    ways = [0] * (m * n)\n    total = 0\n    for u in order:\n        r, c = divmod(u, n)\n        s = 1\n        for di, dj in dirs:\n            nr, nc = r + di, c + dj\n            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > grid[r][c]:\n                s = (s + ways[nr * n + nc]) % MOD\n        ways[u] = s\n        total = (total + s) % MOD\n    return total`,
        javascript: `var countPaths = function(grid) {\n    var MOD = 1000000007;\n    var m = grid.length, n = grid[0].length, i;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var order = [];\n    for (i = 0; i < m * n; i++) order.push(i);\n    order.sort(function(a, b) {\n        return grid[Math.floor(b / n)][b % n] - grid[Math.floor(a / n)][a % n];\n    });\n    var ways = [];\n    for (i = 0; i < m * n; i++) ways.push(0);\n    var total = 0;\n    for (var t = 0; t < order.length; t++) {\n        var u = order[t];\n        var r = Math.floor(u / n), c = u % n;\n        var sum = 1;\n        for (var k = 0; k < 4; k++) {\n            var nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    return total;\n};`,
        typescript: `function countPaths(grid: number[][]): number {\n    var MOD = 1000000007;\n    var m = grid.length, n = grid[0].length, i: number;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var order: number[] = [];\n    for (i = 0; i < m * n; i++) order.push(i);\n    order.sort(function(a: number, b: number) {\n        return grid[Math.floor(b / n)][b % n] - grid[Math.floor(a / n)][a % n];\n    });\n    var ways: number[] = [];\n    for (i = 0; i < m * n; i++) ways.push(0);\n    var total = 0;\n    for (var t = 0; t < order.length; t++) {\n        var u = order[t];\n        var r = Math.floor(u / n), c = u % n;\n        var sum = 1;\n        for (var k = 0; k < 4; k++) {\n            var nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    return total;\n}`,
        java: `public static int countPaths(int[][] grid) {\n    final int MOD = 1000000007;\n    int m = grid.length, n = grid[0].length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    Integer[] order = new Integer[m * n];\n    for (int i = 0; i < m * n; i++) order[i] = i;\n    Arrays.sort(order, (a, b) -> grid[b / n][b % n] - grid[a / n][a % n]);\n    long[] ways = new long[m * n];\n    long total = 0;\n    for (int u : order) {\n        int r = u / n, c = u % n;\n        long sum = 1;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    return (int) total;\n}`,
        cpp: `int countPaths(vector<vector<int>>& grid) {\n    const long long MOD = 1000000007;\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    vector<int> order(m * n);\n    for (int i = 0; i < m * n; i++) order[i] = i;\n    sort(order.begin(), order.end(), [&](int a, int b) {\n        return grid[a / n][a % n] > grid[b / n][b % n];\n    });\n    vector<long long> ways(m * n, 0);\n    long long total = 0;\n    for (int u : order) {\n        int r = u / n, c = u % n;\n        long long sum = 1;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    return (int) total;\n}`,
        c: `static int** cpGrid;\nstatic int cpN;\n\nstatic int cpCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return cpGrid[y / cpN][y % cpN] - cpGrid[x / cpN][x % cpN];\n}\n\nint countPaths(int** grid, int gridSize, int* gridColSize) {\n    const long long MOD = 1000000007;\n    int m = gridSize, n = gridColSize[0];\n    int cells = m * n;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int* order = (int*) malloc((size_t) cells * sizeof(int));\n    for (int i = 0; i < cells; i++) order[i] = i;\n    cpGrid = grid;\n    cpN = n;\n    qsort(order, (size_t) cells, sizeof(int), cpCmp);\n    long long* ways = (long long*) calloc((size_t) cells, sizeof(long long));\n    long long total = 0;\n    for (int t = 0; t < cells; t++) {\n        int u = order[t];\n        int r = u / n, c = u % n;\n        long long sum = 1;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    free(order);\n    free(ways);\n    return (int) total;\n}`,
        csharp: `public static int CountPaths(int[][] grid)\n{\n    const long MOD = 1000000007;\n    int m = grid.Length, n = grid[0].Length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var order = new int[m * n];\n    for (int i = 0; i < m * n; i++) order[i] = i;\n    Array.Sort(order, (a, b) => grid[b / n][b % n] - grid[a / n][a % n]);\n    var ways = new long[m * n];\n    long total = 0;\n    foreach (var u in order)\n    {\n        int r = u / n, c = u % n;\n        long sum = 1;\n        for (int k = 0; k < 4; k++)\n        {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            if (grid[nr][nc] <= grid[r][c]) continue;\n            sum = (sum + ways[nr * n + nc]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    return (int) total;\n}`,
        go: `func countPaths(grid [][]int) int {\n\tconst MOD = 1000000007\n\tm, n := len(grid), len(grid[0])\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\torder := make([]int, m*n)\n\tfor i := range order {\n\t\torder[i] = i\n\t}\n\tsort.Slice(order, func(a, b int) bool {\n\t\tu, v := order[a], order[b]\n\t\treturn grid[u/n][u%n] > grid[v/n][v%n]\n\t})\n\tways := make([]int, m*n)\n\ttotal := 0\n\tfor _, u := range order {\n\t\tr, c := u/n, u%n\n\t\tsum := 1\n\t\tfor k := 0; k < 4; k++ {\n\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif grid[nr][nc] <= grid[r][c] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tsum = (sum + ways[nr*n+nc]) % MOD\n\t\t}\n\t\tways[u] = sum\n\t\ttotal = (total + sum) % MOD\n\t}\n\treturn total\n}`,
        kotlin: `fun countPaths(grid: Array<IntArray>): Int {\n    val MOD = 1000000007L\n    val m = grid.size\n    val n = grid[0].size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val order = (0 until m * n).sortedByDescending { grid[it / n][it % n] }\n    val ways = LongArray(m * n)\n    var total = 0L\n    for (u in order) {\n        val r = u / n\n        val c = u % n\n        var sum = 1L\n        for (k in 0 until 4) {\n            val nr = r + dr[k]\n            val nc = c + dc[k]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n            if (grid[nr][nc] <= grid[r][c]) continue\n            sum = (sum + ways[nr * n + nc]) % MOD\n        }\n        ways[u] = sum\n        total = (total + sum) % MOD\n    }\n    return total.toInt()\n}`,
        swift: `func countPaths(_ grid: [[Int]]) -> Int {\n    let MOD = 1000000007\n    let m = grid.count\n    let n = grid[0].count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    let order = Array(0..<(m * n)).sorted { grid[$0 / n][$0 % n] > grid[$1 / n][$1 % n] }\n    var ways = [Int](repeating: 0, count: m * n)\n    var total = 0\n    for u in order {\n        let r = u / n, c = u % n\n        var sum = 1\n        for k in 0..<4 {\n            let nr = r + dr[k], nc = c + dc[k]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n            if grid[nr][nc] <= grid[r][c] { continue }\n            sum = (sum + ways[nr * n + nc]) % MOD\n        }\n        ways[u] = sum\n        total = (total + sum) % MOD\n    }\n    return total\n}`,
        rust: `fn countPaths(grid: Vec<Vec<i32>>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let m = grid.len();\n    let n = grid[0].len();\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut order: Vec<usize> = (0..m * n).collect();\n    order.sort_by(|&a, &b| grid[b / n][b % n].cmp(&grid[a / n][a % n]));\n    let mut ways = vec![0i64; m * n];\n    let mut total = 0i64;\n    for &u in order.iter() {\n        let r = (u / n) as i32;\n        let c = (u % n) as i32;\n        let mut sum = 1i64;\n        for k in 0..4 {\n            let nr = r + dr[k];\n            let nc = c + dc[k];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            if grid[nr as usize][nc as usize] <= grid[r as usize][c as usize] {\n                continue;\n            }\n            sum = (sum + ways[nr as usize * n + nc as usize]) % MOD;\n        }\n        ways[u] = sum;\n        total = (total + sum) % MOD;\n    }\n    total as i32\n}`,
        php: `function countPaths($grid) {\n    $MOD = 1000000007;\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $order = range(0, $m * $n - 1);\n    usort($order, function($a, $b) use ($grid, $n) {\n        return $grid[intdiv($b, $n)][$b % $n] - $grid[intdiv($a, $n)][$a % $n];\n    });\n    $ways = array_fill(0, $m * $n, 0);\n    $total = 0;\n    foreach ($order as $u) {\n        $r = intdiv($u, $n);\n        $c = $u % $n;\n        $sum = 1;\n        for ($k = 0; $k < 4; $k++) {\n            $nr = $r + $dr[$k];\n            $nc = $c + $dc[$k];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n            if ($grid[$nr][$nc] <= $grid[$r][$c]) continue;\n            $sum = ($sum + $ways[$nr * $n + $nc]) % $MOD;\n        }\n        $ways[$u] = $sum;\n        $total = ($total + $sum) % $MOD;\n    }\n    return $total;\n}`,
        ruby: `def countPaths(grid)\n  mod = 1000000007\n  m = grid.length\n  n = grid[0].length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  order = (0...(m * n)).sort_by { |u| -grid[u / n][u % n] }\n  ways = Array.new(m * n, 0)\n  total = 0\n  order.each do |u|\n    r = u / n\n    c = u % n\n    sum = 1\n    (0...4).each do |k|\n      nr = r + dr[k]\n      nc = c + dc[k]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n\n      next if grid[nr][nc] <= grid[r][c]\n      sum = (sum + ways[nr * n + nc]) % mod\n    end\n    ways[u] = sum\n    total = (total + sum) % mod\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Number of Days to Disconnect Island (LC 1568) ───────
  (() => {
    const islands = (g: number[][]) => {
      const m = g.length, n = g[0].length;
      const seen = Array.from({ length: m }, () => new Array(n).fill(false));
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      let count = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (g[i][j] !== 1 || seen[i][j]) continue;
          count++;
          const stack = [i * n + j];
          seen[i][j] = true;
          while (stack.length > 0) {
            const cur = stack.pop() as number;
            const r = Math.floor(cur / n), c = cur % n;
            for (let k = 0; k < 4; k++) {
              const nr = r + dr[k], nc = c + dc[k];
              if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
              if (g[nr][nc] !== 1 || seen[nr][nc]) continue;
              seen[nr][nc] = true;
              stack.push(nr * n + nc);
            }
          }
        }
      }
      return count;
    };
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      if (islands(grid) !== 1) return 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] !== 1) continue;
          grid[i][j] = 0;
          const cnt = islands(grid);
          grid[i][j] = 1;
          if (cnt !== 1) return 1;
        }
      }
      return 2;
    };
    return {
      slug: "minimum-number-of-days-to-disconnect-island",
      title: "Minimum Number of Days to Disconnect Island",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Depth-First Search", "Breadth-First Search", "Biconnected Component", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minDays", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A binary grid holds `1` for land and `0` for water. An **island** is a group of land cells connected 4-directionally, and the grid is **connected** when it holds exactly one island.\n\nIn one day you may turn any single land cell into water. Return the minimum number of days needed to leave the grid disconnected — either with no island at all, or with two or more.",
        [
          { in: "grid = [[0,1,1,0],[0,1,1,0],[0,0,0,0]]", out: "2", note: "Remove any single cell and the 2 × 2 block stays one island; two removals split it." },
          { in: "grid = [[1,1]]", out: "2", note: "Removing one cell leaves a single land cell — still one island." },
          { in: "grid = [[1,0,1,0]]", out: "0", note: "Already two islands." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 30", "grid[i][j] is 0 or 1"]),
      hints: [
        "Check first whether the grid is already disconnected — that costs 0 days.",
        "Try turning each single land cell to water and re-count the islands.",
        "If no single removal works, is more than two days ever needed?",
      ],
      editorial: explain({
        idea: "The answer is always 0, 1 or 2. Test 0 by counting islands, test 1 by trying every single removal, and otherwise answer 2.",
        steps: [
          "Count the islands; if the count is not exactly 1, the grid is already disconnected — return 0.",
          "For each land cell, set it to water, re-count, and restore it. If any removal leaves a count other than 1, return 1.",
          "Otherwise return 2.",
        ],
        why: "Two days always suffice: take any corner-most land cell of the island; it has at most two land neighbours, and removing them isolates or erases it. So the search never needs to go past 2, which is what makes brute force over single removals a complete algorithm rather than a heuristic.",
        time: "O((m · n)²)",
        space: "O(m · n)",
        pitfalls: [
          "A grid with **no** land is already disconnected and answers 0.",
          "Removing a cell can also leave zero islands — that counts as disconnected.",
          "Restore the cell after each trial or later trials see a corrupted grid.",
        ],
      }),
      examples: [
        { input: "[[0,1,1,0],[0,1,1,0],[0,0,0,0]]", expectedOutput: "2" },
        { input: "[[1,1]]", expectedOutput: "2" },
        { input: "[[1,0,1,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 5), n = ri(rng, 1, 5);
        const p = pick(rng, [0.4, 0.6, 0.85]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minDays(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n\n    def islands() -> int:\n        seen = [[False] * n for _ in range(m)]\n        count = 0\n        for i in range(m):\n            for j in range(n):\n                if grid[i][j] != 1 or seen[i][j]:\n                    continue\n                count += 1\n                stack = [(i, j)]\n                seen[i][j] = True\n                while stack:\n                    r, c = stack.pop()\n                    for di, dj in dirs:\n                        nr, nc = r + di, c + dj\n                        if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 1 and not seen[nr][nc]:\n                            seen[nr][nc] = True\n                            stack.append((nr, nc))\n        return count\n\n    if islands() != 1:\n        return 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] != 1:\n                continue\n            grid[i][j] = 0\n            cnt = islands()\n            grid[i][j] = 1\n            if cnt != 1:\n                return 1\n    return 2`,
        javascript: `var minDays = function(grid) {\n    var m = grid.length, n = grid[0].length;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var islands = function() {\n        var seen = [], i, j;\n        for (i = 0; i < m; i++) {\n            var row = [];\n            for (j = 0; j < n; j++) row.push(false);\n            seen.push(row);\n        }\n        var count = 0;\n        for (i = 0; i < m; i++) {\n            for (j = 0; j < n; j++) {\n                if (grid[i][j] !== 1 || seen[i][j]) continue;\n                count++;\n                var stack = [i * n + j];\n                seen[i][j] = true;\n                while (stack.length > 0) {\n                    var cur = stack.pop();\n                    var r = Math.floor(cur / n), c = cur % n;\n                    for (var k = 0; k < 4; k++) {\n                        var nr = r + dr[k], nc = c + dc[k];\n                        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                        if (grid[nr][nc] !== 1 || seen[nr][nc]) continue;\n                        seen[nr][nc] = true;\n                        stack.push(nr * n + nc);\n                    }\n                }\n            }\n        }\n        return count;\n    };\n    if (islands() !== 1) return 0;\n    for (var i = 0; i < m; i++) {\n        for (var j = 0; j < n; j++) {\n            if (grid[i][j] !== 1) continue;\n            grid[i][j] = 0;\n            var cnt = islands();\n            grid[i][j] = 1;\n            if (cnt !== 1) return 1;\n        }\n    }\n    return 2;\n};`,
        typescript: `function minDays(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var islands = function(): number {\n        var seen: boolean[][] = [], i: number, j: number;\n        for (i = 0; i < m; i++) {\n            var row: boolean[] = [];\n            for (j = 0; j < n; j++) row.push(false);\n            seen.push(row);\n        }\n        var count = 0;\n        for (i = 0; i < m; i++) {\n            for (j = 0; j < n; j++) {\n                if (grid[i][j] !== 1 || seen[i][j]) continue;\n                count++;\n                var stack: number[] = [i * n + j];\n                seen[i][j] = true;\n                while (stack.length > 0) {\n                    var cur = stack.pop() as number;\n                    var r = Math.floor(cur / n), c = cur % n;\n                    for (var k = 0; k < 4; k++) {\n                        var nr = r + dr[k], nc = c + dc[k];\n                        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                        if (grid[nr][nc] !== 1 || seen[nr][nc]) continue;\n                        seen[nr][nc] = true;\n                        stack.push(nr * n + nc);\n                    }\n                }\n            }\n        }\n        return count;\n    };\n    if (islands() !== 1) return 0;\n    for (var i = 0; i < m; i++) {\n        for (var j = 0; j < n; j++) {\n            if (grid[i][j] !== 1) continue;\n            grid[i][j] = 0;\n            var cnt = islands();\n            grid[i][j] = 1;\n            if (cnt !== 1) return 1;\n        }\n    }\n    return 2;\n}`,
        java: `private static int mdIslands(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    boolean[][] seen = new boolean[m][n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int count = 0;\n    int[] stack = new int[m * n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || seen[i][j]) continue;\n            count++;\n            int top = 0;\n            stack[top++] = i * n + j;\n            seen[i][j] = true;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                for (int k = 0; k < 4; k++) {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = true;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n        }\n    }\n    return count;\n}\n\npublic static int minDays(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    if (mdIslands(grid) != 1) return 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            grid[i][j] = 0;\n            int cnt = mdIslands(grid);\n            grid[i][j] = 1;\n            if (cnt != 1) return 1;\n        }\n    }\n    return 2;\n}`,
        cpp: `static int mdIslands(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<char>> seen(m, vector<char>(n, 0));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int count = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || seen[i][j]) continue;\n            count++;\n            vector<int> stack = { i * n + j };\n            seen[i][j] = 1;\n            while (!stack.empty()) {\n                int cur = stack.back();\n                stack.pop_back();\n                int r = cur / n, c = cur % n;\n                for (int k = 0; k < 4; k++) {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || seen[nr][nc]) continue;\n                    seen[nr][nc] = 1;\n                    stack.push_back(nr * n + nc);\n                }\n            }\n        }\n    }\n    return count;\n}\n\nint minDays(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    if (mdIslands(grid) != 1) return 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            grid[i][j] = 0;\n            int cnt = mdIslands(grid);\n            grid[i][j] = 1;\n            if (cnt != 1) return 1;\n        }\n    }\n    return 2;\n}`,
        c: `static int mdIslands(int** grid, int m, int n) {\n    char* seen = (char*) calloc((size_t) (m * n), 1);\n    int* stack = (int*) malloc((size_t) (m * n) * sizeof(int));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int count = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1 || seen[i * n + j]) continue;\n            count++;\n            int top = 0;\n            stack[top++] = i * n + j;\n            seen[i * n + j] = 1;\n            while (top > 0) {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                for (int k = 0; k < 4; k++) {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || seen[nr * n + nc]) continue;\n                    seen[nr * n + nc] = 1;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n        }\n    }\n    free(seen);\n    free(stack);\n    return count;\n}\n\nint minDays(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    if (mdIslands(grid, m, n) != 1) return 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] != 1) continue;\n            grid[i][j] = 0;\n            int cnt = mdIslands(grid, m, n);\n            grid[i][j] = 1;\n            if (cnt != 1) return 1;\n        }\n    }\n    return 2;\n}`,
        csharp: `private static int MdIslands(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var seen = new bool[m, n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int count = 0;\n    var stack = new int[m * n];\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] != 1 || seen[i, j]) continue;\n            count++;\n            int top = 0;\n            stack[top++] = i * n + j;\n            seen[i, j] = true;\n            while (top > 0)\n            {\n                int cur = stack[--top];\n                int r = cur / n, c = cur % n;\n                for (int k = 0; k < 4; k++)\n                {\n                    int nr = r + dr[k], nc = c + dc[k];\n                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n                    if (grid[nr][nc] != 1 || seen[nr, nc]) continue;\n                    seen[nr, nc] = true;\n                    stack[top++] = nr * n + nc;\n                }\n            }\n        }\n    }\n    return count;\n}\n\npublic static int MinDays(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    if (MdIslands(grid) != 1) return 0;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] != 1) continue;\n            grid[i][j] = 0;\n            int cnt = MdIslands(grid);\n            grid[i][j] = 1;\n            if (cnt != 1) return 1;\n        }\n    }\n    return 2;\n}`,
        go: `func minDays(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tislands := func() int {\n\t\tseen := make([][]bool, m)\n\t\tfor i := range seen {\n\t\t\tseen[i] = make([]bool, n)\n\t\t}\n\t\tcount := 0\n\t\tfor i := 0; i < m; i++ {\n\t\t\tfor j := 0; j < n; j++ {\n\t\t\t\tif grid[i][j] != 1 || seen[i][j] {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tcount++\n\t\t\t\tstack := []int{i*n + j}\n\t\t\t\tseen[i][j] = true\n\t\t\t\tfor len(stack) > 0 {\n\t\t\t\t\tcur := stack[len(stack)-1]\n\t\t\t\t\tstack = stack[:len(stack)-1]\n\t\t\t\t\tr, c := cur/n, cur%n\n\t\t\t\t\tfor k := 0; k < 4; k++ {\n\t\t\t\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\t\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\t\t\t\tcontinue\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif grid[nr][nc] != 1 || seen[nr][nc] {\n\t\t\t\t\t\t\tcontinue\n\t\t\t\t\t\t}\n\t\t\t\t\t\tseen[nr][nc] = true\n\t\t\t\t\t\tstack = append(stack, nr*n+nc)\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\treturn count\n\t}\n\tif islands() != 1 {\n\t\treturn 0\n\t}\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] != 1 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tgrid[i][j] = 0\n\t\t\tcnt := islands()\n\t\t\tgrid[i][j] = 1\n\t\t\tif cnt != 1 {\n\t\t\t\treturn 1\n\t\t\t}\n\t\t}\n\t}\n\treturn 2\n}`,
        kotlin: `fun minDays(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    fun islands(): Int {\n        val seen = Array(m) { BooleanArray(n) }\n        var count = 0\n        val stack = IntArray(m * n)\n        for (i in 0 until m) {\n            for (j in 0 until n) {\n                if (grid[i][j] != 1 || seen[i][j]) continue\n                count++\n                var top = 0\n                stack[top++] = i * n + j\n                seen[i][j] = true\n                while (top > 0) {\n                    val cur = stack[--top]\n                    val r = cur / n\n                    val c = cur % n\n                    for (k in 0 until 4) {\n                        val nr = r + dr[k]\n                        val nc = c + dc[k]\n                        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n                        if (grid[nr][nc] != 1 || seen[nr][nc]) continue\n                        seen[nr][nc] = true\n                        stack[top++] = nr * n + nc\n                    }\n                }\n            }\n        }\n        return count\n    }\n    if (islands() != 1) return 0\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (grid[i][j] != 1) continue\n            grid[i][j] = 0\n            val cnt = islands()\n            grid[i][j] = 1\n            if (cnt != 1) return 1\n        }\n    }\n    return 2\n}`,
        swift: `func minDays(_ grid: [[Int]]) -> Int {\n    var g = grid\n    let m = g.count\n    let n = g[0].count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    func islands() -> Int {\n        var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)\n        var count = 0\n        for i in 0..<m {\n            for j in 0..<n {\n                if g[i][j] != 1 || seen[i][j] { continue }\n                count += 1\n                var stack = [i * n + j]\n                seen[i][j] = true\n                while let cur = stack.popLast() {\n                    let r = cur / n, c = cur % n\n                    for k in 0..<4 {\n                        let nr = r + dr[k], nc = c + dc[k]\n                        if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n                        if g[nr][nc] != 1 || seen[nr][nc] { continue }\n                        seen[nr][nc] = true\n                        stack.append(nr * n + nc)\n                    }\n                }\n            }\n        }\n        return count\n    }\n    if islands() != 1 { return 0 }\n    for i in 0..<m {\n        for j in 0..<n {\n            if g[i][j] != 1 { continue }\n            g[i][j] = 0\n            let cnt = islands()\n            g[i][j] = 1\n            if cnt != 1 { return 1 }\n        }\n    }\n    return 2\n}`,
        rust: `fn minDays(grid: Vec<Vec<i32>>) -> i32 {\n    let mut g = grid;\n    let m = g.len();\n    let n = g[0].len();\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    fn islands(g: &Vec<Vec<i32>>, dr: &[i32; 4], dc: &[i32; 4]) -> i32 {\n        let m = g.len();\n        let n = g[0].len();\n        let mut seen = vec![vec![false; n]; m];\n        let mut count = 0i32;\n        for i in 0..m {\n            for j in 0..n {\n                if g[i][j] != 1 || seen[i][j] {\n                    continue;\n                }\n                count += 1;\n                let mut stack = vec![i * n + j];\n                seen[i][j] = true;\n                while let Some(cur) = stack.pop() {\n                    let r = (cur / n) as i32;\n                    let c = (cur % n) as i32;\n                    for k in 0..4 {\n                        let nr = r + dr[k];\n                        let nc = c + dc[k];\n                        if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                            continue;\n                        }\n                        let (nr, nc) = (nr as usize, nc as usize);\n                        if g[nr][nc] != 1 || seen[nr][nc] {\n                            continue;\n                        }\n                        seen[nr][nc] = true;\n                        stack.push(nr * n + nc);\n                    }\n                }\n            }\n        }\n        count\n    }\n    if islands(&g, &dr, &dc) != 1 {\n        return 0;\n    }\n    for i in 0..m {\n        for j in 0..n {\n            if g[i][j] != 1 {\n                continue;\n            }\n            g[i][j] = 0;\n            let cnt = islands(&g, &dr, &dc);\n            g[i][j] = 1;\n            if cnt != 1 {\n                return 1;\n            }\n        }\n    }\n    2\n}`,
        php: `function minDays($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $islands = function($g) use ($m, $n, $dr, $dc) {\n        $seen = [];\n        for ($i = 0; $i < $m; $i++) $seen[$i] = array_fill(0, $n, false);\n        $count = 0;\n        for ($i = 0; $i < $m; $i++) {\n            for ($j = 0; $j < $n; $j++) {\n                if ($g[$i][$j] !== 1 || $seen[$i][$j]) continue;\n                $count++;\n                $stack = [$i * $n + $j];\n                $seen[$i][$j] = true;\n                while (count($stack) > 0) {\n                    $cur = array_pop($stack);\n                    $r = intdiv($cur, $n);\n                    $c = $cur % $n;\n                    for ($k = 0; $k < 4; $k++) {\n                        $nr = $r + $dr[$k];\n                        $nc = $c + $dc[$k];\n                        if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n                        if ($g[$nr][$nc] !== 1 || $seen[$nr][$nc]) continue;\n                        $seen[$nr][$nc] = true;\n                        $stack[] = $nr * $n + $nc;\n                    }\n                }\n            }\n        }\n        return $count;\n    };\n    if ($islands($grid) !== 1) return 0;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] !== 1) continue;\n            $grid[$i][$j] = 0;\n            $cnt = $islands($grid);\n            $grid[$i][$j] = 1;\n            if ($cnt !== 1) return 1;\n        }\n    }\n    return 2;\n}`,
        ruby: `def minDays(grid)\n  m = grid.length\n  n = grid[0].length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  islands = lambda do\n    seen = Array.new(m) { Array.new(n, false) }\n    count = 0\n    (0...m).each do |i|\n      (0...n).each do |j|\n        next if grid[i][j] != 1 || seen[i][j]\n        count += 1\n        stack = [i * n + j]\n        seen[i][j] = true\n        until stack.empty?\n          cur = stack.pop\n          r = cur / n\n          c = cur % n\n          (0...4).each do |k|\n            nr = r + dr[k]\n            nc = c + dc[k]\n            next if nr < 0 || nr >= m || nc < 0 || nc >= n\n            next if grid[nr][nc] != 1 || seen[nr][nc]\n            seen[nr][nc] = true\n            stack << nr * n + nc\n          end\n        end\n      end\n    end\n    count\n  end\n  return 0 if islands.call != 1\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next if grid[i][j] != 1\n      grid[i][j] = 0\n      cnt = islands.call\n      grid[i][j] = 1\n      return 1 if cnt != 1\n    end\n  end\n  2\nend`,
      },
    };
  })(),

  // ── Minimum Time to Visit a Cell In a Grid (LC 2577) ────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      if (grid[0][1] > 1 && grid[1][0] > 1) return -1;
      const BIG = 2000000000;
      const dist = new Array(m * n).fill(BIG);
      const heap: number[] = [];
      const push = (v: number) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p] <= heap[i]) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop() as number;
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let s = i;
            if (l < heap.length && heap[l] < heap[s]) s = l;
            if (r < heap.length && heap[r] < heap[s]) s = r;
            if (s === i) break;
            const t = heap[s]; heap[s] = heap[i]; heap[i] = t;
            i = s;
          }
        }
        return top;
      };
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      dist[0] = 0;
      push(0);
      while (heap.length > 0) {
        const key = pop();
        const time = Math.floor(key / 10000);
        const cell = key % 10000;
        if (time > dist[cell]) continue;
        const r = Math.floor(cell / n), c = cell % n;
        if (r === m - 1 && c === n - 1) return time;
        for (let k = 0; k < 4; k++) {
          const nr = r + dr[k], nc = c + dc[k];
          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
          let t = time + 1;
          if (grid[nr][nc] > t) {
            // Step back and forth to burn time; each round trip is 2 seconds,
            // so the arrival parity is fixed.
            t = grid[nr][nc];
            if ((t - (time + 1)) % 2 !== 0) t++;
          }
          const v = nr * n + nc;
          if (t >= dist[v]) continue;
          dist[v] = t;
          push(t * 10000 + v);
        }
      }
      return -1;
    };
    return {
      slug: "minimum-time-to-visit-a-cell-in-a-grid",
      title: "Minimum Time to Visit a Cell In a Grid",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Graph", "Breadth-First Search", "Shortest Path", "Heap (Priority Queue)", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minimumTime", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`grid[row][col]` is the **earliest second** at which you may step onto that cell. You start at the top-left cell at second `0`, and each move to an adjacent cell — up, down, left or right — takes exactly one second.\n\nReturn the minimum second at which you can reach the bottom-right cell, or `-1` if it cannot be reached.",
        [
          { in: "grid = [[0,1,3,2],[5,1,2,5],[4,3,8,6]]", out: "7" },
          { in: "grid = [[0,2,4],[3,2,1],[1,0,4]]", out: "-1", note: "Both cells next to the start open too late to ever be entered." },
          { in: "grid = [[0,1],[1,2]]", out: "2" },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 100", "0 <= grid[i][j] <= 10^5", "grid[0][0] == 0"]),
      hints: [
        "If both cells next to the start open later than second 1, you can never take a first step.",
        "Otherwise you can always waste time by stepping back and forth — but each round trip costs **two** seconds.",
        "So arrival times have a fixed parity per cell; run Dijkstra's algorithm with that adjustment.",
      ],
      editorial: explain({
        idea: "Dijkstra's algorithm over cells, where the cost of entering a cell is `max(now + 1, its opening time)` — corrected upward by one if the parity is wrong, because waiting is only possible in units of two seconds.",
        steps: [
          "If `grid[0][1] > 1` and `grid[1][0] > 1`, the first move is impossible — return `-1`.",
          "Otherwise run Dijkstra from the start with time 0.",
          "Entering a neighbour: `t = now + 1`; if the cell opens later, jump `t` to the opening time and add 1 when `t - (now + 1)` is odd.",
          "Return the time at which the bottom-right cell is finalised.",
        ],
        why: "Waiting is done by stepping to a neighbour and back, which always costs two seconds, so the set of times a given cell can be entered is fixed modulo 2 — that parity correction is the whole trick. Once the first move is possible, every cell is reachable, so `-1` can only come from the initial check.",
        time: "O(m · n · log(m · n))",
        space: "O(m · n)",
        pitfalls: [
          "Ignoring parity gives answers one second too small.",
          "The `-1` case is decided entirely by the two cells beside the start.",
          "A stale heap entry — one whose time has since improved — must be skipped.",
        ],
      }),
      examples: [
        { input: "[[0,1,3,2],[5,1,2,5],[4,3,8,6]]", expectedOutput: "7" },
        { input: "[[0,2,4],[3,2,1],[1,0,4]]", expectedOutput: "-1" },
        { input: "[[0,1],[1,2]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6), n = ri(rng, 2, 6);
        const hi = pick(rng, [3, 8, 30]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, hi)));
        grid[0][0] = 0;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef minimumTime(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    if grid[0][1] > 1 and grid[1][0] > 1:\n        return -1\n    BIG = float('inf')\n    dist = [[BIG] * n for _ in range(m)]\n    dist[0][0] = 0\n    heap = [(0, 0, 0)]\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    while heap:\n        time, r, c = heapq.heappop(heap)\n        if time > dist[r][c]:\n            continue\n        if r == m - 1 and c == n - 1:\n            return time\n        for di, dj in dirs:\n            nr, nc = r + di, c + dj\n            if not (0 <= nr < m and 0 <= nc < n):\n                continue\n            t = time + 1\n            if grid[nr][nc] > t:\n                t = grid[nr][nc]\n                if (t - (time + 1)) % 2 != 0:\n                    t += 1\n            if t < dist[nr][nc]:\n                dist[nr][nc] = t\n                heapq.heappush(heap, (t, nr, nc))\n    return -1`,
        javascript: `var minimumTime = function(grid) {\n    var m = grid.length, n = grid[0].length, i;\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    var BIG = 2000000000;\n    var dist = [];\n    for (i = 0; i < m * n; i++) dist.push(BIG);\n    // Heap keys are time * 10000 + cell; m * n <= 10000 keeps that exact.\n    var heap = [];\n    var push = function(v) {\n        heap.push(v);\n        var k = heap.length - 1;\n        while (k > 0) {\n            var p = (k - 1) >> 1;\n            if (heap[p] <= heap[k]) break;\n            var t = heap[p]; heap[p] = heap[k]; heap[k] = t;\n            k = p;\n        }\n    };\n    var pop = function() {\n        var top = heap[0];\n        var last = heap.pop();\n        if (heap.length > 0) {\n            heap[0] = last;\n            var k = 0;\n            for (;;) {\n                var l = 2 * k + 1, r = l + 1, s = k;\n                if (l < heap.length && heap[l] < heap[s]) s = l;\n                if (r < heap.length && heap[r] < heap[s]) s = r;\n                if (s === k) break;\n                var t = heap[s]; heap[s] = heap[k]; heap[k] = t;\n                k = s;\n            }\n        }\n        return top;\n    };\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[0] = 0;\n    push(0);\n    while (heap.length > 0) {\n        var key = pop();\n        var time = Math.floor(key / 10000);\n        var cell = key % 10000;\n        if (time > dist[cell]) continue;\n        var cr = Math.floor(cell / n), cc = cell % n;\n        if (cr === m - 1 && cc === n - 1) return time;\n        for (var k2 = 0; k2 < 4; k2++) {\n            var nr = cr + dr[k2], nc = cc + dc[k2];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            var t2 = time + 1;\n            if (grid[nr][nc] > t2) {\n                t2 = grid[nr][nc];\n                if ((t2 - (time + 1)) % 2 !== 0) t2++;\n            }\n            var v = nr * n + nc;\n            if (t2 >= dist[v]) continue;\n            dist[v] = t2;\n            push(t2 * 10000 + v);\n        }\n    }\n    return -1;\n};`,
        typescript: `function minimumTime(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, i: number;\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    var BIG = 2000000000;\n    var dist: number[] = [];\n    for (i = 0; i < m * n; i++) dist.push(BIG);\n    var heap: number[] = [];\n    var push = function(v: number): void {\n        heap.push(v);\n        var k = heap.length - 1;\n        while (k > 0) {\n            var p = (k - 1) >> 1;\n            if (heap[p] <= heap[k]) break;\n            var t = heap[p]; heap[p] = heap[k]; heap[k] = t;\n            k = p;\n        }\n    };\n    var pop = function(): number {\n        var top = heap[0];\n        var last = heap.pop() as number;\n        if (heap.length > 0) {\n            heap[0] = last;\n            var k = 0;\n            for (;;) {\n                var l = 2 * k + 1, r = l + 1, s = k;\n                if (l < heap.length && heap[l] < heap[s]) s = l;\n                if (r < heap.length && heap[r] < heap[s]) s = r;\n                if (s === k) break;\n                var t = heap[s]; heap[s] = heap[k]; heap[k] = t;\n                k = s;\n            }\n        }\n        return top;\n    };\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    dist[0] = 0;\n    push(0);\n    while (heap.length > 0) {\n        var key = pop();\n        var time = Math.floor(key / 10000);\n        var cell = key % 10000;\n        if (time > dist[cell]) continue;\n        var cr = Math.floor(cell / n), cc = cell % n;\n        if (cr === m - 1 && cc === n - 1) return time;\n        for (var k2 = 0; k2 < 4; k2++) {\n            var nr = cr + dr[k2], nc = cc + dc[k2];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            var t2 = time + 1;\n            if (grid[nr][nc] > t2) {\n                t2 = grid[nr][nc];\n                if ((t2 - (time + 1)) % 2 !== 0) t2++;\n            }\n            var v = nr * n + nc;\n            if (t2 >= dist[v]) continue;\n            dist[v] = t2;\n            push(t2 * 10000 + v);\n        }\n    }\n    return -1;\n}`,
        java: `public static int minimumTime(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    final int BIG = Integer.MAX_VALUE;\n    int[][] dist = new int[m][n];\n    for (int[] row : dist) Arrays.fill(row, BIG);\n    dist[0][0] = 0;\n    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);\n    heap.add(new int[] { 0, 0, 0 });\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (!heap.isEmpty()) {\n        int[] cur = heap.poll();\n        int time = cur[0], r = cur[1], c = cur[2];\n        if (time > dist[r][c]) continue;\n        if (r == m - 1 && c == n - 1) return time;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int t = time + 1;\n            if (grid[nr][nc] > t) {\n                t = grid[nr][nc];\n                if ((t - (time + 1)) % 2 != 0) t++;\n            }\n            if (t < dist[nr][nc]) {\n                dist[nr][nc] = t;\n                heap.add(new int[] { t, nr, nc });\n            }\n        }\n    }\n    return -1;\n}`,
        cpp: `int minimumTime(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    const int BIG = 2000000000;\n    vector<vector<int>> dist(m, vector<int>(n, BIG));\n    dist[0][0] = 0;\n    priority_queue<array<int,3>, vector<array<int,3>>, greater<array<int,3>>> heap;\n    heap.push({ 0, 0, 0 });\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    while (!heap.empty()) {\n        auto cur = heap.top();\n        heap.pop();\n        int time = cur[0], r = cur[1], c = cur[2];\n        if (time > dist[r][c]) continue;\n        if (r == m - 1 && c == n - 1) return time;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int t = time + 1;\n            if (grid[nr][nc] > t) {\n                t = grid[nr][nc];\n                if ((t - (time + 1)) % 2 != 0) t++;\n            }\n            if (t < dist[nr][nc]) {\n                dist[nr][nc] = t;\n                heap.push({ t, nr, nc });\n            }\n        }\n    }\n    return -1;\n}`,
        c: `static void mtPush(int* h, int* size, int v) {\n    int k = (*size)++;\n    h[k] = v;\n    while (k > 0) {\n        int p = (k - 1) / 2;\n        if (h[p] <= h[k]) break;\n        int t = h[p];\n        h[p] = h[k];\n        h[k] = t;\n        k = p;\n    }\n}\n\nstatic int mtPop(int* h, int* size) {\n    int top = h[0];\n    h[0] = h[--(*size)];\n    int k = 0;\n    for (;;) {\n        int l = 2 * k + 1, r = l + 1, s = k;\n        if (l < *size && h[l] < h[s]) s = l;\n        if (r < *size && h[r] < h[s]) s = r;\n        if (s == k) break;\n        int t = h[s];\n        h[s] = h[k];\n        h[k] = t;\n        k = s;\n    }\n    return top;\n}\n\nint minimumTime(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    const int BIG = 2000000000;\n    int cells = m * n;\n    int* dist = (int*) malloc((size_t) cells * sizeof(int));\n    for (int i = 0; i < cells; i++) dist[i] = BIG;\n    int capacity = cells * 8 + 16;\n    int* heap = (int*) malloc((size_t) capacity * sizeof(int));\n    int size = 0;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    dist[0] = 0;\n    mtPush(heap, &size, 0);\n    int ans = -1;\n    while (size > 0) {\n        int key = mtPop(heap, &size);\n        int time = key / 10000;\n        int cell = key % 10000;\n        if (time > dist[cell]) continue;\n        int r = cell / n, c = cell % n;\n        if (r == m - 1 && c == n - 1) { ans = time; break; }\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int t = time + 1;\n            if (grid[nr][nc] > t) {\n                t = grid[nr][nc];\n                if ((t - (time + 1)) % 2 != 0) t++;\n            }\n            int v = nr * n + nc;\n            if (t >= dist[v]) continue;\n            dist[v] = t;\n            mtPush(heap, &size, t * 10000 + v);\n        }\n    }\n    free(dist);\n    free(heap);\n    return ans;\n}`,
        csharp: `public static int MinimumTime(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1;\n    const int BIG = 2000000000;\n    var dist = new int[m * n];\n    for (int i = 0; i < m * n; i++) dist[i] = BIG;\n    // Keys are time * 10000 + cell and each cell is pushed with a strictly\n    // smaller time each go, so the keys stay distinct.\n    var heap = new SortedSet<int>();\n    dist[0] = 0;\n    heap.Add(0);\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    while (heap.Count > 0)\n    {\n        int key = heap.Min;\n        heap.Remove(key);\n        int time = key / 10000;\n        int cell = key % 10000;\n        if (time > dist[cell]) continue;\n        int r = cell / n, c = cell % n;\n        if (r == m - 1 && c == n - 1) return time;\n        for (int k = 0; k < 4; k++)\n        {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;\n            int t = time + 1;\n            if (grid[nr][nc] > t)\n            {\n                t = grid[nr][nc];\n                if ((t - (time + 1)) % 2 != 0) t++;\n            }\n            int v = nr * n + nc;\n            if (t >= dist[v]) continue;\n            dist[v] = t;\n            heap.Add(t * 10000 + v);\n        }\n    }\n    return -1;\n}`,
        go: `type timeHeap []int\n\nfunc (h timeHeap) Len() int            { return len(h) }\nfunc (h timeHeap) Less(i, j int) bool  { return h[i] < h[j] }\nfunc (h timeHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }\nfunc (h *timeHeap) Push(x interface{}) { *h = append(*h, x.(int)) }\nfunc (h *timeHeap) Pop() interface{} {\n\told := *h\n\tn := len(old)\n\tv := old[n-1]\n\t*h = old[:n-1]\n\treturn v\n}\n\nfunc minimumTime(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tif grid[0][1] > 1 && grid[1][0] > 1 {\n\t\treturn -1\n\t}\n\tconst BIG = 2000000000\n\tdist := make([]int, m*n)\n\tfor i := range dist {\n\t\tdist[i] = BIG\n\t}\n\th := &timeHeap{}\n\theap.Init(h)\n\tdist[0] = 0\n\theap.Push(h, 0)\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tfor h.Len() > 0 {\n\t\tkey := heap.Pop(h).(int)\n\t\ttime := key / 10000\n\t\tcell := key % 10000\n\t\tif time > dist[cell] {\n\t\t\tcontinue\n\t\t}\n\t\tr, c := cell/n, cell%n\n\t\tif r == m-1 && c == n-1 {\n\t\t\treturn time\n\t\t}\n\t\tfor k := 0; k < 4; k++ {\n\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\tif nr < 0 || nr >= m || nc < 0 || nc >= n {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tt := time + 1\n\t\t\tif grid[nr][nc] > t {\n\t\t\t\tt = grid[nr][nc]\n\t\t\t\tif (t-(time+1))%2 != 0 {\n\t\t\t\t\tt++\n\t\t\t\t}\n\t\t\t}\n\t\t\tv := nr*n + nc\n\t\t\tif t >= dist[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdist[v] = t\n\t\t\theap.Push(h, t*10000+v)\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `import java.util.PriorityQueue\n\nfun minimumTime(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    if (grid[0][1] > 1 && grid[1][0] > 1) return -1\n    val BIG = 2000000000\n    val dist = IntArray(m * n) { BIG }\n    val heap = PriorityQueue<Int>()\n    dist[0] = 0\n    heap.add(0)\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    while (heap.isNotEmpty()) {\n        val key = heap.poll()\n        val time = key / 10000\n        val cell = key % 10000\n        if (time > dist[cell]) continue\n        val r = cell / n\n        val c = cell % n\n        if (r == m - 1 && c == n - 1) return time\n        for (k in 0 until 4) {\n            val nr = r + dr[k]\n            val nc = c + dc[k]\n            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue\n            var t = time + 1\n            if (grid[nr][nc] > t) {\n                t = grid[nr][nc]\n                if ((t - (time + 1)) % 2 != 0) t++\n            }\n            val v = nr * n + nc\n            if (t >= dist[v]) continue\n            dist[v] = t\n            heap.add(t * 10000 + v)\n        }\n    }\n    return -1\n}`,
        swift: `func minimumTime(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    if grid[0][1] > 1 && grid[1][0] > 1 { return -1 }\n    let BIG = 2000000000\n    var dist = [Int](repeating: BIG, count: m * n)\n    var heap = [Int]()\n    func push(_ v: Int) {\n        heap.append(v)\n        var k = heap.count - 1\n        while k > 0 {\n            let p = (k - 1) / 2\n            if heap[p] <= heap[k] { break }\n            heap.swapAt(p, k)\n            k = p\n        }\n    }\n    func pop() -> Int {\n        let top = heap[0]\n        let last = heap.removeLast()\n        if !heap.isEmpty {\n            heap[0] = last\n            var k = 0\n            while true {\n                let l = 2 * k + 1, r = l + 1\n                var s = k\n                if l < heap.count && heap[l] < heap[s] { s = l }\n                if r < heap.count && heap[r] < heap[s] { s = r }\n                if s == k { break }\n                heap.swapAt(s, k)\n                k = s\n            }\n        }\n        return top\n    }\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    dist[0] = 0\n    push(0)\n    while !heap.isEmpty {\n        let key = pop()\n        let time = key / 10000\n        let cell = key % 10000\n        if time > dist[cell] { continue }\n        let r = cell / n, c = cell % n\n        if r == m - 1 && c == n - 1 { return time }\n        for k in 0..<4 {\n            let nr = r + dr[k], nc = c + dc[k]\n            if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }\n            var t = time + 1\n            if grid[nr][nc] > t {\n                t = grid[nr][nc]\n                if (t - (time + 1)) % 2 != 0 { t += 1 }\n            }\n            let v = nr * n + nc\n            if t >= dist[v] { continue }\n            dist[v] = t\n            push(t * 10000 + v)\n        }\n    }\n    return -1\n}`,
        rust: `use std::collections::BinaryHeap;\nuse std::cmp::Reverse;\n\nfn minimumTime(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    if grid[0][1] > 1 && grid[1][0] > 1 {\n        return -1;\n    }\n    const BIG: i32 = 2000000000;\n    let mut dist = vec![BIG; m * n];\n    let mut heap: BinaryHeap<Reverse<(i32, usize, usize)>> = BinaryHeap::new();\n    dist[0] = 0;\n    heap.push(Reverse((0, 0, 0)));\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    while let Some(Reverse((time, r, c))) = heap.pop() {\n        if time > dist[r * n + c] {\n            continue;\n        }\n        if r == m - 1 && c == n - 1 {\n            return time;\n        }\n        for k in 0..4 {\n            let nr = r as i32 + dr[k];\n            let nc = c as i32 + dc[k];\n            if nr < 0 || nr >= m as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            let (nr, nc) = (nr as usize, nc as usize);\n            let mut t = time + 1;\n            if grid[nr][nc] > t {\n                t = grid[nr][nc];\n                if (t - (time + 1)) % 2 != 0 {\n                    t += 1;\n                }\n            }\n            if t >= dist[nr * n + nc] {\n                continue;\n            }\n            dist[nr * n + nc] = t;\n            heap.push(Reverse((t, nr, nc)));\n        }\n    }\n    -1\n}`,
        php: `function minimumTime($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    if ($grid[0][1] > 1 && $grid[1][0] > 1) return -1;\n    $BIG = 2000000000;\n    $dist = array_fill(0, $m * $n, $BIG);\n    $heap = new \\SplMinHeap();\n    $dist[0] = 0;\n    $heap->insert(0);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    while (!$heap->isEmpty()) {\n        $key = $heap->extract();\n        $time = intdiv($key, 10000);\n        $cell = $key % 10000;\n        if ($time > $dist[$cell]) continue;\n        $r = intdiv($cell, $n);\n        $c = $cell % $n;\n        if ($r === $m - 1 && $c === $n - 1) return $time;\n        for ($k = 0; $k < 4; $k++) {\n            $nr = $r + $dr[$k];\n            $nc = $c + $dc[$k];\n            if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;\n            $t = $time + 1;\n            if ($grid[$nr][$nc] > $t) {\n                $t = $grid[$nr][$nc];\n                if (($t - ($time + 1)) % 2 !== 0) $t++;\n            }\n            $v = $nr * $n + $nc;\n            if ($t >= $dist[$v]) continue;\n            $dist[$v] = $t;\n            $heap->insert($t * 10000 + $v);\n        }\n    }\n    return -1;\n}`,
        ruby: `def minimumTime(grid)\n  m = grid.length\n  n = grid[0].length\n  return -1 if grid[0][1] > 1 && grid[1][0] > 1\n  big = 2000000000\n  dist = Array.new(m * n, big)\n  heap = []\n  push = lambda do |v|\n    heap << v\n    k = heap.length - 1\n    while k > 0\n      p = (k - 1) / 2\n      break if heap[p] <= heap[k]\n      heap[p], heap[k] = heap[k], heap[p]\n      k = p\n    end\n  end\n  pop = lambda do\n    top = heap[0]\n    last = heap.pop\n    unless heap.empty?\n      heap[0] = last\n      k = 0\n      loop do\n        l = 2 * k + 1\n        r = l + 1\n        s = k\n        s = l if l < heap.length && heap[l] < heap[s]\n        s = r if r < heap.length && heap[r] < heap[s]\n        break if s == k\n        heap[s], heap[k] = heap[k], heap[s]\n        k = s\n      end\n    end\n    top\n  end\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  dist[0] = 0\n  push.call(0)\n  until heap.empty?\n    key = pop.call\n    time = key / 10000\n    cell = key % 10000\n    next if time > dist[cell]\n    r = cell / n\n    c = cell % n\n    return time if r == m - 1 && c == n - 1\n    (0...4).each do |k|\n      nr = r + dr[k]\n      nc = c + dc[k]\n      next if nr < 0 || nr >= m || nc < 0 || nc >= n\n      t = time + 1\n      if grid[nr][nc] > t\n        t = grid[nr][nc]\n        t += 1 if (t - (time + 1)) % 2 != 0\n      end\n      v = nr * n + nc\n      next if t >= dist[v]\n      dist[v] = t\n      push.call(t * 10000 + v)\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Find the Safest Path in a Grid (LC 2812) ────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
      // Multi-source BFS from every thief gives each cell its safeness factor.
      const safe = new Array(n * n).fill(-1);
      const q: number[] = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] === 1) { safe[i * n + j] = 0; q.push(i * n + j); }
        }
      }
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const r = Math.floor(cur / n), c = cur % n;
        for (let k = 0; k < 4; k++) {
          const nr = r + dr[k], nc = c + dc[k];
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          if (safe[nr * n + nc] >= 0) continue;
          safe[nr * n + nc] = safe[cur] + 1;
          q.push(nr * n + nc);
        }
      }
      if (q.length === 0) return 2 * n;
      const canDo = (need: number) => {
        if (safe[0] < need || safe[n * n - 1] < need) return false;
        const seen = new Array(n * n).fill(false);
        seen[0] = true;
        const stack = [0];
        while (stack.length > 0) {
          const cur = stack.pop() as number;
          if (cur === n * n - 1) return true;
          const r = Math.floor(cur / n), c = cur % n;
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            const v = nr * n + nc;
            if (seen[v] || safe[v] < need) continue;
            seen[v] = true;
            stack.push(v);
          }
        }
        return false;
      };
      let lo = 0, hi = 2 * n;
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo + 1) / 2);
        if (canDo(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "find-the-safest-path-in-a-grid",
      title: "Find the Safest Path in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Binary Search", "Breadth-First Search", "Union Find", "Heap (Priority Queue)", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maximumSafenessFactor", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An `n × n` grid holds `1` where a thief stands and `0` everywhere else. The **safeness factor** of a path from the top-left cell to the bottom-right cell is the smallest Manhattan distance from any cell on the path to any thief.\n\nMoving only up, down, left or right, return the maximum safeness factor of any such path.",
        [
          { in: "grid = [[1,0,0],[0,0,0],[0,0,1]]", out: "0", note: "Both corners hold a thief, so every path touches distance 0." },
          { in: "grid = [[0,0,1],[0,0,0],[0,0,0]]", out: "2", note: "Going down the left edge and along the bottom keeps a distance of 2." },
          { in: "grid = [[0,0,0,1],[0,0,0,0],[0,0,0,0],[1,0,0,0]]", out: "2" },
        ],
        ["1 <= grid.length == n <= 400", "grid[i].length == n", "grid[i][j] is 0 or 1", "There is at least one thief in the grid."]),
      hints: [
        "First find each cell's distance to the nearest thief with a multi-source breadth-first search.",
        "The answer is the largest `s` such that some path uses only cells of safeness `>= s`.",
        "That property is monotone in `s`, so binary search it.",
      ],
      editorial: explain({
        idea: "Two stages. A multi-source BFS from all thieves labels each cell with its distance to the nearest one — which is exactly its safeness. Then binary search the threshold `s`, testing each with an ordinary search restricted to cells of safeness at least `s`.",
        steps: [
          "BFS from every thief at once to fill the safeness grid.",
          "For a candidate `s`, check that both corners have safeness `>= s` and that a search from the start reaches the end using only such cells.",
          "Binary search the largest `s` that passes.",
        ],
        why: "The multi-source BFS gives Manhattan distance for free, because 4-directional BFS distance in an obstacle-free grid *is* Manhattan distance to the nearest source. The check is monotone — a path safe at `s` is safe at every smaller threshold — which is what licenses the binary search; `2n` is a safe upper bound since no two cells of an `n × n` grid are further apart.",
        time: "O(n² log n)",
        space: "O(n²)",
        pitfalls: [
          "The safeness of a path is the minimum over its cells, not a sum or an average.",
          "Both endpoints count towards the path's safeness.",
          "A thief on a corner forces the answer to 0.",
        ],
      }),
      examples: [
        { input: "[[1,0,0],[0,0,0],[0,0,1]]", expectedOutput: "0" },
        { input: "[[0,0,1],[0,0,0],[0,0,0]]", expectedOutput: "2" },
        { input: "[[0,0,0,1],[0,0,0,0],[0,0,0,0],[1,0,0,0]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < 0.15 ? 1 : 0)));
        // The statement promises at least one thief.
        grid[ri(rng, 0, n - 1)][ri(rng, 0, n - 1)] = 1;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef maximumSafenessFactor(grid: List[List[int]]) -> int:\n    n = len(grid)\n    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))\n    safe = [-1] * (n * n)\n    q = deque()\n    for i in range(n):\n        for j in range(n):\n            if grid[i][j] == 1:\n                safe[i * n + j] = 0\n                q.append((i, j))\n    while q:\n        r, c = q.popleft()\n        for di, dj in dirs:\n            nr, nc = r + di, c + dj\n            if 0 <= nr < n and 0 <= nc < n and safe[nr * n + nc] < 0:\n                safe[nr * n + nc] = safe[r * n + c] + 1\n                q.append((nr, nc))\n\n    def can_do(need: int) -> bool:\n        if safe[0] < need or safe[n * n - 1] < need:\n            return False\n        seen = [False] * (n * n)\n        seen[0] = True\n        stack = [0]\n        while stack:\n            cur = stack.pop()\n            if cur == n * n - 1:\n                return True\n            r, c = divmod(cur, n)\n            for di, dj in dirs:\n                nr, nc = r + di, c + dj\n                if not (0 <= nr < n and 0 <= nc < n):\n                    continue\n                v = nr * n + nc\n                if seen[v] or safe[v] < need:\n                    continue\n                seen[v] = True\n                stack.append(v)\n        return False\n\n    lo, hi = 0, 2 * n\n    while lo < hi:\n        mid = lo + (hi - lo + 1) // 2\n        if can_do(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maximumSafenessFactor = function(grid) {\n    var n = grid.length, i, j, k;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var safe = [];\n    for (i = 0; i < n * n; i++) safe.push(-1);\n    var q = [];\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 1) { safe[i * n + j] = 0; q.push(i * n + j); }\n        }\n    }\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (k = 0; k < 4; k++) {\n            var nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (safe[nr * n + nc] >= 0) continue;\n            safe[nr * n + nc] = safe[cur] + 1;\n            q.push(nr * n + nc);\n        }\n    }\n    var canDo = function(need) {\n        if (safe[0] < need || safe[n * n - 1] < need) return false;\n        var seen = [];\n        for (var t = 0; t < n * n; t++) seen.push(false);\n        seen[0] = true;\n        var stack = [0];\n        while (stack.length > 0) {\n            var u = stack.pop();\n            if (u === n * n - 1) return true;\n            var ur = Math.floor(u / n), uc = u % n;\n            for (var d = 0; d < 4; d++) {\n                var ar = ur + dr[d], ac = uc + dc[d];\n                if (ar < 0 || ar >= n || ac < 0 || ac >= n) continue;\n                var v = ar * n + ac;\n                if (seen[v] || safe[v] < need) continue;\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        return false;\n    };\n    var lo = 0, hi = 2 * n;\n    while (lo < hi) {\n        var mid = lo + Math.floor((hi - lo + 1) / 2);\n        if (canDo(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maximumSafenessFactor(grid: number[][]): number {\n    var n = grid.length, i: number, j: number, k: number;\n    var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];\n    var safe: number[] = [];\n    for (i = 0; i < n * n; i++) safe.push(-1);\n    var q: number[] = [];\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            if (grid[i][j] === 1) { safe[i * n + j] = 0; q.push(i * n + j); }\n        }\n    }\n    var head = 0;\n    while (head < q.length) {\n        var cur = q[head++];\n        var r = Math.floor(cur / n), c = cur % n;\n        for (k = 0; k < 4; k++) {\n            var nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (safe[nr * n + nc] >= 0) continue;\n            safe[nr * n + nc] = safe[cur] + 1;\n            q.push(nr * n + nc);\n        }\n    }\n    var canDo = function(need: number): boolean {\n        if (safe[0] < need || safe[n * n - 1] < need) return false;\n        var seen: boolean[] = [];\n        for (var t = 0; t < n * n; t++) seen.push(false);\n        seen[0] = true;\n        var stack: number[] = [0];\n        while (stack.length > 0) {\n            var u = stack.pop() as number;\n            if (u === n * n - 1) return true;\n            var ur = Math.floor(u / n), uc = u % n;\n            for (var d = 0; d < 4; d++) {\n                var ar = ur + dr[d], ac = uc + dc[d];\n                if (ar < 0 || ar >= n || ac < 0 || ac >= n) continue;\n                var v = ar * n + ac;\n                if (seen[v] || safe[v] < need) continue;\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        return false;\n    };\n    var lo = 0, hi = 2 * n;\n    while (lo < hi) {\n        var mid = lo + Math.floor((hi - lo + 1) / 2);\n        if (canDo(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `private static int[] sfSafe;\nprivate static int sfN;\n\nprivate static boolean sfCanDo(int need) {\n    int n = sfN;\n    if (sfSafe[0] < need || sfSafe[n * n - 1] < need) return false;\n    boolean[] seen = new boolean[n * n];\n    int[] stack = new int[n * n];\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int top = 0;\n    seen[0] = true;\n    stack[top++] = 0;\n    while (top > 0) {\n        int u = stack[--top];\n        if (u == n * n - 1) return true;\n        int r = u / n, c = u % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            int v = nr * n + nc;\n            if (seen[v] || sfSafe[v] < need) continue;\n            seen[v] = true;\n            stack[top++] = v;\n        }\n    }\n    return false;\n}\n\npublic static int maximumSafenessFactor(int[][] grid) {\n    int n = grid.length;\n    sfN = n;\n    sfSafe = new int[n * n];\n    Arrays.fill(sfSafe, -1);\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    int[] q = new int[n * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { sfSafe[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (sfSafe[nr * n + nc] >= 0) continue;\n            sfSafe[nr * n + nc] = sfSafe[cur] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    int lo = 0, hi = 2 * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (sfCanDo(mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `int maximumSafenessFactor(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    vector<int> safe(n * n, -1), q;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { safe[i * n + j] = 0; q.push_back(i * n + j); }\n        }\n    }\n    for (size_t head = 0; head < q.size(); head++) {\n        int cur = q[head];\n        int r = cur / n, c = cur % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (safe[nr * n + nc] >= 0) continue;\n            safe[nr * n + nc] = safe[cur] + 1;\n            q.push_back(nr * n + nc);\n        }\n    }\n    auto canDo = [&](int need) {\n        if (safe[0] < need || safe[n * n - 1] < need) return false;\n        vector<char> seen(n * n, 0);\n        vector<int> stack = { 0 };\n        seen[0] = 1;\n        while (!stack.empty()) {\n            int u = stack.back();\n            stack.pop_back();\n            if (u == n * n - 1) return true;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++) {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                if (seen[v] || safe[v] < need) continue;\n                seen[v] = 1;\n                stack.push_back(v);\n            }\n        }\n        return false;\n    };\n    int lo = 0, hi = 2 * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canDo(mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `static int sfCanDo(int* safe, int n, int need) {\n    if (safe[0] < need || safe[n * n - 1] < need) return 0;\n    char* seen = (char*) calloc((size_t) (n * n), 1);\n    int* stack = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int top = 0, ok = 0;\n    seen[0] = 1;\n    stack[top++] = 0;\n    while (top > 0) {\n        int u = stack[--top];\n        if (u == n * n - 1) { ok = 1; break; }\n        int r = u / n, c = u % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            int v = nr * n + nc;\n            if (seen[v] || safe[v] < need) continue;\n            seen[v] = 1;\n            stack[top++] = v;\n        }\n    }\n    free(seen);\n    free(stack);\n    return ok;\n}\n\nint maximumSafenessFactor(int** grid, int gridSize, int* gridColSize) {\n    (void) gridColSize;\n    int n = gridSize;\n    int dr[4] = { 1, -1, 0, 0 };\n    int dc[4] = { 0, 0, 1, -1 };\n    int* safe = (int*) malloc((size_t) (n * n) * sizeof(int));\n    for (int i = 0; i < n * n; i++) safe[i] = -1;\n    int* q = (int*) malloc((size_t) (n * n) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { safe[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail) {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (safe[nr * n + nc] >= 0) continue;\n            safe[nr * n + nc] = safe[cur] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    int lo = 0, hi = 2 * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (sfCanDo(safe, n, mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    free(safe);\n    free(q);\n    return lo;\n}`,
        csharp: `public static int MaximumSafenessFactor(int[][] grid)\n{\n    int n = grid.Length;\n    int[] dr = { 1, -1, 0, 0 };\n    int[] dc = { 0, 0, 1, -1 };\n    var safe = new int[n * n];\n    for (int i = 0; i < n * n; i++) safe[i] = -1;\n    var q = new int[n * n];\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (grid[i][j] == 1) { safe[i * n + j] = 0; q[tail++] = i * n + j; }\n        }\n    }\n    while (head < tail)\n    {\n        int cur = q[head++];\n        int r = cur / n, c = cur % n;\n        for (int k = 0; k < 4; k++)\n        {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n            if (safe[nr * n + nc] >= 0) continue;\n            safe[nr * n + nc] = safe[cur] + 1;\n            q[tail++] = nr * n + nc;\n        }\n    }\n    bool CanDo(int need)\n    {\n        if (safe[0] < need || safe[n * n - 1] < need) return false;\n        var seen = new bool[n * n];\n        var stack = new int[n * n];\n        int top = 0;\n        seen[0] = true;\n        stack[top++] = 0;\n        while (top > 0)\n        {\n            int u = stack[--top];\n            if (u == n * n - 1) return true;\n            int r = u / n, c = u % n;\n            for (int k = 0; k < 4; k++)\n            {\n                int nr = r + dr[k], nc = c + dc[k];\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;\n                int v = nr * n + nc;\n                if (seen[v] || safe[v] < need) continue;\n                seen[v] = true;\n                stack[top++] = v;\n            }\n        }\n        return false;\n    }\n    int lo = 0, hi = 2 * n;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (CanDo(mid)) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func maximumSafenessFactor(grid [][]int) int {\n\tn := len(grid)\n\tdr := []int{1, -1, 0, 0}\n\tdc := []int{0, 0, 1, -1}\n\tsafe := make([]int, n*n)\n\tfor i := range safe {\n\t\tsafe[i] = -1\n\t}\n\tq := []int{}\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif grid[i][j] == 1 {\n\t\t\t\tsafe[i*n+j] = 0\n\t\t\t\tq = append(q, i*n+j)\n\t\t\t}\n\t\t}\n\t}\n\tfor head := 0; head < len(q); head++ {\n\t\tcur := q[head]\n\t\tr, c := cur/n, cur%n\n\t\tfor k := 0; k < 4; k++ {\n\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\tif nr < 0 || nr >= n || nc < 0 || nc >= n {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif safe[nr*n+nc] >= 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tsafe[nr*n+nc] = safe[cur] + 1\n\t\t\tq = append(q, nr*n+nc)\n\t\t}\n\t}\n\tcanDo := func(need int) bool {\n\t\tif safe[0] < need || safe[n*n-1] < need {\n\t\t\treturn false\n\t\t}\n\t\tseen := make([]bool, n*n)\n\t\tseen[0] = true\n\t\tstack := []int{0}\n\t\tfor len(stack) > 0 {\n\t\t\tu := stack[len(stack)-1]\n\t\t\tstack = stack[:len(stack)-1]\n\t\t\tif u == n*n-1 {\n\t\t\t\treturn true\n\t\t\t}\n\t\t\tr, c := u/n, u%n\n\t\t\tfor k := 0; k < 4; k++ {\n\t\t\t\tnr, nc := r+dr[k], c+dc[k]\n\t\t\t\tif nr < 0 || nr >= n || nc < 0 || nc >= n {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tv := nr*n + nc\n\t\t\t\tif seen[v] || safe[v] < need {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tseen[v] = true\n\t\t\t\tstack = append(stack, v)\n\t\t\t}\n\t\t}\n\t\treturn false\n\t}\n\tlo, hi := 0, 2*n\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif canDo(mid) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun maximumSafenessFactor(grid: Array<IntArray>): Int {\n    val n = grid.size\n    val dr = intArrayOf(1, -1, 0, 0)\n    val dc = intArrayOf(0, 0, 1, -1)\n    val safe = IntArray(n * n) { -1 }\n    val q = IntArray(n * n)\n    var head = 0\n    var tail = 0\n    for (i in 0 until n) {\n        for (j in 0 until n) {\n            if (grid[i][j] == 1) {\n                safe[i * n + j] = 0\n                q[tail++] = i * n + j\n            }\n        }\n    }\n    while (head < tail) {\n        val cur = q[head++]\n        val r = cur / n\n        val c = cur % n\n        for (k in 0 until 4) {\n            val nr = r + dr[k]\n            val nc = c + dc[k]\n            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue\n            if (safe[nr * n + nc] >= 0) continue\n            safe[nr * n + nc] = safe[cur] + 1\n            q[tail++] = nr * n + nc\n        }\n    }\n    fun canDo(need: Int): Boolean {\n        if (safe[0] < need || safe[n * n - 1] < need) return false\n        val seen = BooleanArray(n * n)\n        val stack = IntArray(n * n)\n        var top = 0\n        seen[0] = true\n        stack[top++] = 0\n        while (top > 0) {\n            val u = stack[--top]\n            if (u == n * n - 1) return true\n            val r = u / n\n            val c = u % n\n            for (k in 0 until 4) {\n                val nr = r + dr[k]\n                val nc = c + dc[k]\n                if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue\n                val v = nr * n + nc\n                if (seen[v] || safe[v] < need) continue\n                seen[v] = true\n                stack[top++] = v\n            }\n        }\n        return false\n    }\n    var lo = 0\n    var hi = 2 * n\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (canDo(mid)) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func maximumSafenessFactor(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    let dr = [1, -1, 0, 0]\n    let dc = [0, 0, 1, -1]\n    var safe = [Int](repeating: -1, count: n * n)\n    var q = [Int]()\n    for i in 0..<n {\n        for j in 0..<n where grid[i][j] == 1 {\n            safe[i * n + j] = 0\n            q.append(i * n + j)\n        }\n    }\n    var head = 0\n    while head < q.count {\n        let cur = q[head]\n        head += 1\n        let r = cur / n, c = cur % n\n        for k in 0..<4 {\n            let nr = r + dr[k], nc = c + dc[k]\n            if nr < 0 || nr >= n || nc < 0 || nc >= n { continue }\n            if safe[nr * n + nc] >= 0 { continue }\n            safe[nr * n + nc] = safe[cur] + 1\n            q.append(nr * n + nc)\n        }\n    }\n    func canDo(_ need: Int) -> Bool {\n        if safe[0] < need || safe[n * n - 1] < need { return false }\n        var seen = [Bool](repeating: false, count: n * n)\n        seen[0] = true\n        var stack = [0]\n        while let u = stack.popLast() {\n            if u == n * n - 1 { return true }\n            let r = u / n, c = u % n\n            for k in 0..<4 {\n                let nr = r + dr[k], nc = c + dc[k]\n                if nr < 0 || nr >= n || nc < 0 || nc >= n { continue }\n                let v = nr * n + nc\n                if seen[v] || safe[v] < need { continue }\n                seen[v] = true\n                stack.append(v)\n            }\n        }\n        return false\n    }\n    var lo = 0\n    var hi = 2 * n\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if canDo(mid) { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maximumSafenessFactor(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let dr = [1i32, -1, 0, 0];\n    let dc = [0i32, 0, 1, -1];\n    let mut safe = vec![-1i32; n * n];\n    let mut q: Vec<usize> = Vec::new();\n    for i in 0..n {\n        for j in 0..n {\n            if grid[i][j] == 1 {\n                safe[i * n + j] = 0;\n                q.push(i * n + j);\n            }\n        }\n    }\n    let mut head = 0usize;\n    while head < q.len() {\n        let cur = q[head];\n        head += 1;\n        let r = (cur / n) as i32;\n        let c = (cur % n) as i32;\n        for k in 0..4 {\n            let nr = r + dr[k];\n            let nc = c + dc[k];\n            if nr < 0 || nr >= n as i32 || nc < 0 || nc >= n as i32 {\n                continue;\n            }\n            let v = nr as usize * n + nc as usize;\n            if safe[v] >= 0 {\n                continue;\n            }\n            safe[v] = safe[cur] + 1;\n            q.push(v);\n        }\n    }\n    let can_do = |need: i32| -> bool {\n        if safe[0] < need || safe[n * n - 1] < need {\n            return false;\n        }\n        let mut seen = vec![false; n * n];\n        seen[0] = true;\n        let mut stack = vec![0usize];\n        while let Some(u) = stack.pop() {\n            if u == n * n - 1 {\n                return true;\n            }\n            let r = (u / n) as i32;\n            let c = (u % n) as i32;\n            for k in 0..4 {\n                let nr = r + dr[k];\n                let nc = c + dc[k];\n                if nr < 0 || nr >= n as i32 || nc < 0 || nc >= n as i32 {\n                    continue;\n                }\n                let v = nr as usize * n + nc as usize;\n                if seen[v] || safe[v] < need {\n                    continue;\n                }\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n        false\n    };\n    let mut lo = 0i32;\n    let mut hi = 2 * n as i32;\n    while lo < hi {\n        let mid = lo + (hi + 1 - lo) / 2;\n        if can_do(mid) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo\n}`,
        php: `function maximumSafenessFactor($grid) {\n    $n = count($grid);\n    $dr = [1, -1, 0, 0];\n    $dc = [0, 0, 1, -1];\n    $safe = array_fill(0, $n * $n, -1);\n    $q = [];\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($grid[$i][$j] === 1) {\n                $safe[$i * $n + $j] = 0;\n                $q[] = $i * $n + $j;\n            }\n        }\n    }\n    for ($head = 0; $head < count($q); $head++) {\n        $cur = $q[$head];\n        $r = intdiv($cur, $n);\n        $c = $cur % $n;\n        for ($k = 0; $k < 4; $k++) {\n            $nr = $r + $dr[$k];\n            $nc = $c + $dc[$k];\n            if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $n) continue;\n            if ($safe[$nr * $n + $nc] >= 0) continue;\n            $safe[$nr * $n + $nc] = $safe[$cur] + 1;\n            $q[] = $nr * $n + $nc;\n        }\n    }\n    $canDo = function($need) use ($safe, $n, $dr, $dc) {\n        if ($safe[0] < $need || $safe[$n * $n - 1] < $need) return false;\n        $seen = array_fill(0, $n * $n, false);\n        $seen[0] = true;\n        $stack = [0];\n        while (count($stack) > 0) {\n            $u = array_pop($stack);\n            if ($u === $n * $n - 1) return true;\n            $r = intdiv($u, $n);\n            $c = $u % $n;\n            for ($k = 0; $k < 4; $k++) {\n                $nr = $r + $dr[$k];\n                $nc = $c + $dc[$k];\n                if ($nr < 0 || $nr >= $n || $nc < 0 || $nc >= $n) continue;\n                $v = $nr * $n + $nc;\n                if ($seen[$v] || $safe[$v] < $need) continue;\n                $seen[$v] = true;\n                $stack[] = $v;\n            }\n        }\n        return false;\n    };\n    $lo = 0;\n    $hi = 2 * $n;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($canDo($mid)) $lo = $mid;\n        else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maximumSafenessFactor(grid)\n  n = grid.length\n  dr = [1, -1, 0, 0]\n  dc = [0, 0, 1, -1]\n  safe = Array.new(n * n, -1)\n  q = []\n  (0...n).each do |i|\n    (0...n).each do |j|\n      if grid[i][j] == 1\n        safe[i * n + j] = 0\n        q << i * n + j\n      end\n    end\n  end\n  head = 0\n  while head < q.length\n    cur = q[head]\n    head += 1\n    r = cur / n\n    c = cur % n\n    (0...4).each do |k|\n      nr = r + dr[k]\n      nc = c + dc[k]\n      next if nr < 0 || nr >= n || nc < 0 || nc >= n\n      next if safe[nr * n + nc] >= 0\n      safe[nr * n + nc] = safe[cur] + 1\n      q << nr * n + nc\n    end\n  end\n  can_do = lambda do |need|\n    next false if safe[0] < need || safe[n * n - 1] < need\n    seen = Array.new(n * n, false)\n    seen[0] = true\n    stack = [0]\n    until stack.empty?\n      u = stack.pop\n      return true if u == n * n - 1\n      r = u / n\n      c = u % n\n      (0...4).each do |k|\n        nr = r + dr[k]\n        nc = c + dc[k]\n        next if nr < 0 || nr >= n || nc < 0 || nc >= n\n        v = nr * n + nc\n        next if seen[v] || safe[v] < need\n        seen[v] = true\n        stack << v\n      end\n    end\n    false\n  end\n  lo = 0\n  hi = 2 * n\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if can_do.call(mid)\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),
];
