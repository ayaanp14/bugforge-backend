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

  // ── Count Unreachable Pairs of Nodes in an Undirected Graph (LC 2316) ──
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
      const size = new Array(n).fill(1);
      for (let i = 0; i < edges.length; i++) {
        const a = find(edges[i][0]), b = find(edges[i][1]);
        if (a === b) continue;
        if (size[a] < size[b]) { parent[a] = b; size[b] += size[a]; }
        else { parent[b] = a; size[a] += size[b]; }
      }
      let done = 0, ans = 0;
      for (let i = 0; i < n; i++) {
        if (find(i) !== i) continue;
        ans += size[i] * done;
        done += size[i];
      }
      return ans;
    };
    return {
      slug: "count-unreachable-pairs-of-nodes-in-an-undirected-graph",
      title: "Count Unreachable Pairs of Nodes in an Undirected Graph",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Depth-First Search", "Breadth-First Search", "Union Find", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countPairs", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected graph has `n` nodes labelled `0 … n - 1`. Return the number of **unordered pairs** of different nodes that are unreachable from each other.",
        [
          { in: "n = 3, edges = [[0,1],[0,2]]", out: "0", note: "Everything is connected." },
          { in: "n = 7, edges = [[0,2],[0,5],[2,4],[1,6],[5,4]]", out: "14", note: "Components of sizes 4, 2 and 1." },
          { in: "n = 3, edges = []", out: "3", note: "Three isolated nodes give three pairs." },
        ],
        ["1 <= n <= 30000", "0 <= edges.length <= 10^5", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] < n", "edges[i][0] != edges[i][1]", "There are no repeated edges."]),
      hints: [
        "Two nodes are reachable from each other exactly when they sit in the same connected component.",
        "So the answer counts the pairs that straddle two different components.",
        "Find every component's size — union-find or a traversal — and combine them.",
      ],
      editorial: explain({
        idea: "Reachability is component membership, so the answer is the number of cross-component pairs. Find the component sizes, then add each component's size times the total of the components already counted.",
        steps: [
          "Union the endpoints of every edge, keeping the size of each set.",
          "Walk the component roots, keeping a running total `done` of nodes already seen.",
          "Add `size · done` for each component, then fold it into `done`.",
        ],
        why: "Pairing each component only against the ones before it counts every cross pair exactly once, which is also why no division by two appears. It keeps the arithmetic small: the running form never exceeds the answer, whereas `(n² - Σ size²) / 2` builds an intermediate near `n²` that overflows a 32-bit int well before the answer does.",
        time: "O(n + m · α(n))",
        space: "O(n)",
        pitfalls: [
          "Counting ordered pairs doubles the answer.",
          "`n²` overflows 32 bits long before the answer does; accumulate incrementally.",
          "Isolated nodes are components of size 1 and matter.",
        ],
      }),
      examples: [
        { input: "3\n[[0,1],[0,2]]", expectedOutput: "0" },
        { input: "7\n[[0,2],[0,5],[2,4],[1,6],[5,4]]", expectedOutput: "14" },
        { input: "3\n[]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const seen = new Set<number>();
        const edges: number[][] = [];
        const count = ri(rng, 0, Math.min(12, (n * (n - 1)) / 2));
        for (let k = 0; k < count; k++) {
          const a = ri(rng, 0, n - 1);
          const b = ri(rng, 0, n - 1);
          if (a === b) continue;
          const key = Math.min(a, b) * n + Math.max(a, b);
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push([a, b]);
        }
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPairs(n: int, edges: List[List[int]]) -> int:\n    parent = list(range(n))\n    size = [1] * n\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for u, v in edges:\n        a, b = find(u), find(v)\n        if a == b:\n            continue\n        if size[a] < size[b]:\n            a, b = b, a\n        parent[b] = a\n        size[a] += size[b]\n    done = 0\n    ans = 0\n    for i in range(n):\n        if find(i) != i:\n            continue\n        ans += size[i] * done\n        done += size[i]\n    return ans`,
        javascript: `var countPairs = function(n, edges) {\n    var i;\n    var parent = [], size = [];\n    for (i = 0; i < n; i++) { parent.push(i); size.push(1); }\n    var find = function(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < edges.length; i++) {\n        var a = find(edges[i][0]), b = find(edges[i][1]);\n        if (a === b) continue;\n        if (size[a] < size[b]) { var t = a; a = b; b = t; }\n        parent[b] = a;\n        size[a] += size[b];\n    }\n    var done = 0, ans = 0;\n    for (i = 0; i < n; i++) {\n        if (find(i) !== i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    return ans;\n};`,
        typescript: `function countPairs(n: number, edges: number[][]): number {\n    var i: number;\n    var parent: number[] = [], size: number[] = [];\n    for (i = 0; i < n; i++) { parent.push(i); size.push(1); }\n    var find = function(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (i = 0; i < edges.length; i++) {\n        var a = find(edges[i][0]), b = find(edges[i][1]);\n        if (a === b) continue;\n        if (size[a] < size[b]) { var t = a; a = b; b = t; }\n        parent[b] = a;\n        size[a] += size[b];\n    }\n    var done = 0, ans = 0;\n    for (i = 0; i < n; i++) {\n        if (find(i) !== i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    return ans;\n}`,
        java: `private static int[] cpParent;\n\nprivate static int cpFind(int x) {\n    while (cpParent[x] != x) {\n        cpParent[x] = cpParent[cpParent[x]];\n        x = cpParent[x];\n    }\n    return x;\n}\n\npublic static int countPairs(int n, int[][] edges) {\n    cpParent = new int[n];\n    int[] size = new int[n];\n    for (int i = 0; i < n; i++) { cpParent[i] = i; size[i] = 1; }\n    for (int[] e : edges) {\n        int a = cpFind(e[0]), b = cpFind(e[1]);\n        if (a == b) continue;\n        if (size[a] < size[b]) { int t = a; a = b; b = t; }\n        cpParent[b] = a;\n        size[a] += size[b];\n    }\n    int done = 0, ans = 0;\n    for (int i = 0; i < n; i++) {\n        if (cpFind(i) != i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    return ans;\n}`,
        cpp: `int countPairs(int n, vector<vector<int>>& edges) {\n    vector<int> parent(n), size(n, 1);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    function<int(int)> find = [&](int x) {\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    };\n    for (auto& e : edges) {\n        int a = find(e[0]), b = find(e[1]);\n        if (a == b) continue;\n        if (size[a] < size[b]) swap(a, b);\n        parent[b] = a;\n        size[a] += size[b];\n    }\n    int done = 0, ans = 0;\n    for (int i = 0; i < n; i++) {\n        if (find(i) != i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    return ans;\n}`,
        c: `static int* cpParent;\n\nstatic int cpFind(int x) {\n    while (cpParent[x] != x) {\n        cpParent[x] = cpParent[cpParent[x]];\n        x = cpParent[x];\n    }\n    return x;\n}\n\nint countPairs(int n, int** edges, int edgesSize, int* edgesColSize) {\n    (void) edgesColSize;\n    cpParent = (int*) malloc((size_t) n * sizeof(int));\n    int* size = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) { cpParent[i] = i; size[i] = 1; }\n    for (int i = 0; i < edgesSize; i++) {\n        int a = cpFind(edges[i][0]), b = cpFind(edges[i][1]);\n        if (a == b) continue;\n        if (size[a] < size[b]) { int t = a; a = b; b = t; }\n        cpParent[b] = a;\n        size[a] += size[b];\n    }\n    int done = 0, ans = 0;\n    for (int i = 0; i < n; i++) {\n        if (cpFind(i) != i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    free(cpParent);\n    free(size);\n    return ans;\n}`,
        csharp: `public static int CountPairs(int n, int[][] edges)\n{\n    var parent = new int[n];\n    var size = new int[n];\n    for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }\n    int Find(int x)\n    {\n        while (parent[x] != x)\n        {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    foreach (var e in edges)\n    {\n        int a = Find(e[0]), b = Find(e[1]);\n        if (a == b) continue;\n        if (size[a] < size[b]) { int t = a; a = b; b = t; }\n        parent[b] = a;\n        size[a] += size[b];\n    }\n    int done = 0, ans = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (Find(i) != i) continue;\n        ans += size[i] * done;\n        done += size[i];\n    }\n    return ans;\n}`,
        go: `func countPairs(n int, edges [][]int) int {\n\tparent := make([]int, n)\n\tsize := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tparent[i] = i\n\t\tsize[i] = 1\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tfor _, e := range edges {\n\t\ta, b := find(e[0]), find(e[1])\n\t\tif a == b {\n\t\t\tcontinue\n\t\t}\n\t\tif size[a] < size[b] {\n\t\t\ta, b = b, a\n\t\t}\n\t\tparent[b] = a\n\t\tsize[a] += size[b]\n\t}\n\tdone, ans := 0, 0\n\tfor i := 0; i < n; i++ {\n\t\tif find(i) != i {\n\t\t\tcontinue\n\t\t}\n\t\tans += size[i] * done\n\t\tdone += size[i]\n\t}\n\treturn ans\n}`,
        kotlin: `fun countPairs(n: Int, edges: Array<IntArray>): Int {\n    val parent = IntArray(n) { it }\n    val size = IntArray(n) { 1 }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for (e in edges) {\n        var a = find(e[0])\n        var b = find(e[1])\n        if (a == b) continue\n        if (size[a] < size[b]) {\n            val t = a\n            a = b\n            b = t\n        }\n        parent[b] = a\n        size[a] += size[b]\n    }\n    var done = 0\n    var ans = 0\n    for (i in 0 until n) {\n        if (find(i) != i) continue\n        ans += size[i] * done\n        done += size[i]\n    }\n    return ans\n}`,
        swift: `func countPairs(_ n: Int, _ edges: [[Int]]) -> Int {\n    var parent = Array(0..<n)\n    var size = [Int](repeating: 1, count: n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for e in edges {\n        var a = find(e[0])\n        var b = find(e[1])\n        if a == b { continue }\n        if size[a] < size[b] { swap(&a, &b) }\n        parent[b] = a\n        size[a] += size[b]\n    }\n    var done = 0\n    var ans = 0\n    for i in 0..<n {\n        if find(i) != i { continue }\n        ans += size[i] * done\n        done += size[i]\n    }\n    return ans\n}`,
        rust: `fn countPairs(n: i32, edges: Vec<Vec<i32>>) -> i32 {\n    let n = n as usize;\n    let mut parent: Vec<usize> = (0..n).collect();\n    let mut size = vec![1i32; n];\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    for e in edges.iter() {\n        let mut a = find(&mut parent, e[0] as usize);\n        let mut b = find(&mut parent, e[1] as usize);\n        if a == b {\n            continue;\n        }\n        if size[a] < size[b] {\n            std::mem::swap(&mut a, &mut b);\n        }\n        parent[b] = a;\n        size[a] += size[b];\n    }\n    let mut done = 0i32;\n    let mut ans = 0i32;\n    for i in 0..n {\n        if find(&mut parent, i) != i {\n            continue;\n        }\n        ans += size[i] * done;\n        done += size[i];\n    }\n    ans\n}`,
        php: `function countPairs($n, $edges) {\n    $parent = range(0, $n - 1);\n    $size = array_fill(0, $n, 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) {\n            $parent[$x] = $parent[$parent[$x]];\n            $x = $parent[$x];\n        }\n        return $x;\n    };\n    foreach ($edges as $e) {\n        $a = $find($e[0]);\n        $b = $find($e[1]);\n        if ($a === $b) continue;\n        if ($size[$a] < $size[$b]) { $t = $a; $a = $b; $b = $t; }\n        $parent[$b] = $a;\n        $size[$a] += $size[$b];\n    }\n    $done = 0;\n    $ans = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($find($i) !== $i) continue;\n        $ans += $size[$i] * $done;\n        $done += $size[$i];\n    }\n    return $ans;\n}`,
        ruby: `def countPairs(n, edges)\n  parent = (0...n).to_a\n  size = Array.new(n, 1)\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  edges.each do |u, v|\n    a = find.call(u)\n    b = find.call(v)\n    next if a == b\n    a, b = b, a if size[a] < size[b]\n    parent[b] = a\n    size[a] += size[b]\n  end\n  done = 0\n  ans = 0\n  (0...n).each do |i|\n    next if find.call(i) != i\n    ans += size[i] * done\n    done += size[i]\n  end\n  ans\nend`,
      },
    };
  })(),
];
