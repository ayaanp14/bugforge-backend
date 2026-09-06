/** Graphs — hand-authored classics via edge lists / adjacency matrices (int[][]).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtIntMat, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const GRAPH_PROBLEMS: CatalogProblem[] = [

  // ── Find Center of Star Graph ───────────────────────────────────
  (() => {
    const ref = (edges: number[][]) =>
      edges[0][0] === edges[1][0] || edges[0][0] === edges[1][1] ? edges[0][0] : edges[0][1];
    return {
      slug: "find-center-of-star-graph",
      title: "Find Center of Star Graph",
      difficulty: "EASY" as const,
      tags: ["Graph"],
      signature: { funcName: "findCenter", params: [{ name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A **star graph** of `n` nodes has one center connected to every other node by exactly one edge. Given its edge list, return the **center node**.",
        [
          { in: "edges = [[1,2],[2,3],[4,2]]", out: "2" },
          { in: "edges = [[1,2],[5,1],[1,3],[1,4]]", out: "1" },
        ],
        ["3 <= n <= 20", "edges.length == n - 1", "The given edges form a valid star graph."]),
      hints: [
        "The center appears in EVERY edge.",
        "Compare just the first two edges — the common endpoint is the center.",
      ],
      examples: [
        { input: "[[1,2],[2,3],[4,2]]", expectedOutput: "2" },
        { input: "[[1,2],[5,1],[1,3],[1,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 20);
        const center = ri(rng, 1, n);
        const others = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1).filter((x) => x !== center));
        const edges = others.map((o) => (rng() < 0.5 ? [center, o] : [o, center]));
        return { input: fmtIntMat(edges), expectedOutput: String(center) };
      },
      editorial: explain({
        idea: "In a star every edge touches the centre, and no edge joins two leaves. So the centre is the one node the edges have in common — and you only need **two** edges to find it. Whichever endpoint of the first edge also appears in the second must be the centre, because a leaf appears in exactly one edge.",
        steps: [
          "Take the two endpoints `a` and `b` of `edges[0]`.",
          "Check whether `a` appears in `edges[1]`.",
          "If it does, `a` is the centre; otherwise it is `b`.",
          "No traversal, no counting, no scan of the rest of the list.",
        ],
        why: "A star with `n` nodes has `n - 1` edges, each connecting the centre to a distinct leaf. Every leaf therefore has degree 1 and sits in exactly one edge, while the centre sits in all of them. Since `n >= 3` there are at least two edges, and the only node they can share is the centre — two distinct leaves never share an edge.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Counting degrees over the whole edge list works but is `O(n)` for no reason — two edges settle it.",
          "The centre may appear as either endpoint, so check `a` against **both** entries of the second edge.",
          "`n >= 3` guarantees a second edge exists; with only one edge the centre would be genuinely ambiguous.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findCenter(edges: List[List[int]]) -> int:\n    a, b = edges[0]\n    return a if a in edges[1] else b`,
        javascript: `var findCenter = function(edges) {\n    const a = edges[0][0], b = edges[0][1];\n    return (a === edges[1][0] || a === edges[1][1]) ? a : b;\n};`,
              typescript: `function findCenter(edges: number[][]): number {\n    const a = edges[0][0];\n    const b = edges[0][1];\n    return (a === edges[1][0] || a === edges[1][1]) ? a : b;\n}`,
              java: `public static int findCenter(int[][] edges) {\n    int a = edges[0][0];\n    int b = edges[0][1];\n    return (a == edges[1][0] || a == edges[1][1]) ? a : b;\n}`,
              cpp: `int findCenter(vector<vector<int>>& edges) {\n    int a = edges[0][0];\n    int b = edges[0][1];\n    return (a == edges[1][0] || a == edges[1][1]) ? a : b;\n}`,
              c: `int findCenter(int** edges, int edgesSize, int* edgesColSize) {\n    int a = edges[0][0];\n    int b = edges[0][1];\n    if (a == edges[1][0] || a == edges[1][1]) return a;\n    return b;\n}`,
              csharp: `public static int FindCenter(int[][] edges)\n{\n    int a = edges[0][0];\n    int b = edges[0][1];\n    return (a == edges[1][0] || a == edges[1][1]) ? a : b;\n}`,
              go: `func findCenter(edges [][]int) int {\n	a := edges[0][0]\n	b := edges[0][1]\n	if a == edges[1][0] || a == edges[1][1] {\n		return a\n	}\n	return b\n}`,
              kotlin: `fun findCenter(edges: Array<IntArray>): Int {\n    val a = edges[0][0]\n    val b = edges[0][1]\n    return if (a == edges[1][0] || a == edges[1][1]) a else b\n}`,
              swift: `func findCenter(_ edges: [[Int]]) -> Int {\n    let a = edges[0][0]\n    let b = edges[0][1]\n    return (a == edges[1][0] || a == edges[1][1]) ? a : b\n}`,
              rust: `fn findCenter(edges: Vec<Vec<i32>>) -> i32 {\n    let a = edges[0][0];\n    let b = edges[0][1];\n    if a == edges[1][0] || a == edges[1][1] { a } else { b }\n}`,
              php: `function findCenter($edges) {\n    $a = $edges[0][0];\n    $b = $edges[0][1];\n    return ($a === $edges[1][0] || $a === $edges[1][1]) ? $a : $b;\n}`,
              ruby: `def findCenter(edges)\n  a = edges[0][0]\n  b = edges[0][1]\n  (a == edges[1][0] || a == edges[1][1]) ? a : b\nend`,
      },
    };
  })(),

  // ── Find the Town Judge ─────────────────────────────────────────
  (() => {
    const ref = (n: number, trust: number[][]) => {
      const score = new Array(n + 1).fill(0);
      for (const [a, b] of trust) {
        score[a]--;
        score[b]++;
      }
      for (let i = 1; i <= n; i++) {
        if (score[i] === n - 1) return i;
      }
      return -1;
    };
    return {
      slug: "find-the-town-judge",
      title: "Find the Town Judge",
      difficulty: "EASY" as const,
      tags: ["Graph", "Hash Table"],
      signature: { funcName: "findJudge", params: [{ name: "n", type: "int" as const }, { name: "trust", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "In a town of `n` people (labelled `1..n`), the **town judge** trusts nobody and is trusted by everyone else. `trust[i] = [a, b]` means person `a` trusts person `b`.\n\nReturn the judge's label, or `-1` if no judge exists.",
        [
          { in: "n = 2, trust = [[1,2]]", out: "2" },
          { in: "n = 3, trust = [[1,3],[2,3],[3,1]]", out: "-1", note: "Person 3 trusts someone." },
        ],
        ["1 <= n <= 15", "0 <= trust.length <= 60", "All trust pairs are distinct, a != b."]),
      hints: [
        "Think in-degree minus out-degree.",
        "The judge scores exactly n-1: trusted by all, trusting none.",
      ],
      examples: [
        { input: "2\n[[1,2]]", expectedOutput: "2" },
        { input: "3\n[[1,3],[2,3],[3,1]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 15);
        const pairs = new Set<string>();
        const trust: number[][] = [];
        if (rng() < 0.5 && n >= 2) {
          const judge = ri(rng, 1, n);
          for (let p = 1; p <= n; p++) {
            if (p !== judge) {
              trust.push([p, judge]);
              pairs.add(`${p},${judge}`);
            }
          }
        }
        const extra = ri(rng, 0, 10);
        for (let e = 0; e < extra && n >= 2; e++) {
          const a = ri(rng, 1, n);
          let b = ri(rng, 1, n);
          if (a === b) b = (b % n) + 1;
          if (a !== b && !pairs.has(`${a},${b}`)) {
            pairs.add(`${a},${b}`);
            trust.push([a, b]);
          }
        }
        return { input: `${n}\n${fmtIntMat(shuffle(rng, trust))}`, expectedOutput: String(ref(n, trust)) };
      },
      editorial: explain({
        idea: "The judge is defined purely by degrees: in-degree `n - 1` (everyone trusts them) and out-degree `0` (they trust nobody). Combine the two into a single score — `+1` for being trusted, `-1` for trusting — and the judge is the unique person scoring exactly `n - 1`. No graph traversal needed.",
        steps: [
          "Keep a score per person, all starting at `0`.",
          "For each pair `[a, b]`: decrement `score[a]` (a trusts someone) and increment `score[b]` (b is trusted).",
          "Scan people `1..n` for one whose score equals `n - 1`.",
          "Return that label, or `-1` if nobody qualifies.",
        ],
        why: "Score is in-degree minus out-degree, which is at most `n - 1` for anyone: in-degree cannot exceed `n - 1` (no self-trust) and out-degree is non-negative. Hitting the maximum therefore forces in-degree to be exactly `n - 1` **and** out-degree exactly `0` — precisely the judge's definition. That also proves uniqueness: two people both trusted by everyone else would have to trust each other, contradicting out-degree `0`.",
        time: "O(n + m)",
        space: "O(n)",
        pitfalls: [
          "Size the score array `n + 1` — people are labelled from `1`, not `0`.",
          "The single combined score is what makes this work; checking in-degree alone wrongly accepts someone who is trusted by all *and* trusts someone.",
          "`n = 1` with no trust pairs is a valid town: person 1 scores `0 == n - 1` and is the judge.",
          "An empty trust list is allowed, so guard the scan rather than assuming an answer exists.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findJudge(n: int, trust: List[List[int]]) -> int:\n    score = [0] * (n + 1)\n    for a, b in trust:\n        score[a] -= 1\n        score[b] += 1\n    for i in range(1, n + 1):\n        if score[i] == n - 1:\n            return i\n    return -1`,
        javascript: `var findJudge = function(n, trust) {\n    const score = new Array(n + 1).fill(0);\n    for (const t of trust) {\n        score[t[0]]--;\n        score[t[1]]++;\n    }\n    for (let i = 1; i <= n; i++) {\n        if (score[i] === n - 1) return i;\n    }\n    return -1;\n};`,
              typescript: `function findJudge(n: number, trust: number[][]): number {\n    const score: number[] = [];\n    for (let i = 0; i <= n; i++) score.push(0);\n    for (let i = 0; i < trust.length; i++) {\n        score[trust[i][0]]--;\n        score[trust[i][1]]++;\n    }\n    for (let i = 1; i <= n; i++) {\n        if (score[i] === n - 1) return i;\n    }\n    return -1;\n}`,
              java: `public static int findJudge(int n, int[][] trust) {\n    int[] score = new int[n + 1];\n    for (int[] t : trust) {\n        score[t[0]]--;\n        score[t[1]]++;\n    }\n    for (int i = 1; i <= n; i++) {\n        if (score[i] == n - 1) return i;\n    }\n    return -1;\n}`,
              cpp: `int findJudge(int n, vector<vector<int>>& trust) {\n    vector<int> score(n + 1, 0);\n    for (const auto& t : trust) {\n        score[t[0]]--;\n        score[t[1]]++;\n    }\n    for (int i = 1; i <= n; i++) {\n        if (score[i] == n - 1) return i;\n    }\n    return -1;\n}`,
              c: `int findJudge(int n, int** trust, int trustSize, int* trustColSize) {\n    int* score = (int*) calloc(n + 2, sizeof(int));\n    for (int i = 0; i < trustSize; i++) {\n        score[trust[i][0]]--;\n        score[trust[i][1]]++;\n    }\n    int ans = -1;\n    for (int i = 1; i <= n; i++) {\n        if (score[i] == n - 1) {\n            ans = i;\n            break;\n        }\n    }\n    free(score);\n    return ans;\n}`,
              csharp: `public static int FindJudge(int n, int[][] trust)\n{\n    int[] score = new int[n + 1];\n    foreach (int[] t in trust)\n    {\n        score[t[0]]--;\n        score[t[1]]++;\n    }\n    for (int i = 1; i <= n; i++)\n    {\n        if (score[i] == n - 1) return i;\n    }\n    return -1;\n}`,
              go: `func findJudge(n int, trust [][]int) int {\n	score := make([]int, n+1)\n	for _, t := range trust {\n		score[t[0]]--\n		score[t[1]]++\n	}\n	for i := 1; i <= n; i++ {\n		if score[i] == n-1 {\n			return i\n		}\n	}\n	return -1\n}`,
              kotlin: `fun findJudge(n: Int, trust: Array<IntArray>): Int {\n    val score = IntArray(n + 1)\n    for (t in trust) {\n        score[t[0]]--\n        score[t[1]]++\n    }\n    for (i in 1..n) {\n        if (score[i] == n - 1) return i\n    }\n    return -1\n}`,
              swift: `func findJudge(_ n: Int, _ trust: [[Int]]) -> Int {\n    var score = [Int](repeating: 0, count: n + 1)\n    for t in trust {\n        score[t[0]] -= 1\n        score[t[1]] += 1\n    }\n    for i in 1...max(n, 1) {\n        if i <= n && score[i] == n - 1 { return i }\n    }\n    return -1\n}`,
              rust: `fn findJudge(n: i32, trust: Vec<Vec<i32>>) -> i32 {\n    let mut score = vec![0i32; (n + 1) as usize];\n    for t in trust.iter() {\n        score[t[0] as usize] -= 1;\n        score[t[1] as usize] += 1;\n    }\n    for i in 1..=n {\n        if score[i as usize] == n - 1 {\n            return i;\n        }\n    }\n    -1\n}`,
              php: `function findJudge($n, $trust) {\n    $score = array_fill(0, $n + 1, 0);\n    foreach ($trust as $t) {\n        $score[$t[0]]--;\n        $score[$t[1]]++;\n    }\n    for ($i = 1; $i <= $n; $i++) {\n        if ($score[$i] === $n - 1) return $i;\n    }\n    return -1;\n}`,
              ruby: `def findJudge(n, trust)\n  score = Array.new(n + 1, 0)\n  trust.each do |t|\n    score[t[0]] -= 1\n    score[t[1]] += 1\n  end\n  (1..n).each do |i|\n    return i if score[i] == n - 1\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Number of Provinces ─────────────────────────────────────────
  (() => {
    const ref = (isConnected: number[][]) => {
      const n = isConnected.length;
      const seen = new Array(n).fill(false);
      let count = 0;
      const dfs = (i: number) => {
        seen[i] = true;
        for (let j = 0; j < n; j++) {
          if (isConnected[i][j] === 1 && !seen[j]) dfs(j);
        }
      };
      for (let i = 0; i < n; i++) {
        if (!seen[i]) {
          count++;
          dfs(i);
        }
      }
      return count;
    };
    return {
      slug: "number-of-provinces",
      title: "Number of Provinces",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Depth-First Search", "Union Find"],
      signature: { funcName: "findCircleNum", params: [{ name: "isConnected", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` cities; `isConnected[i][j] = 1` means cities `i` and `j` are directly connected. A **province** is a group of directly or indirectly connected cities.\n\nGiven the `n x n` symmetric matrix `isConnected`, return the **number of provinces**.",
        [
          { in: "isConnected = [[1,1,0],[1,1,0],[0,0,1]]", out: "2" },
          { in: "isConnected = [[1,0,0],[0,1,0],[0,0,1]]", out: "3" },
        ],
        ["1 <= n <= 10", "isConnected[i][i] == 1; the matrix is symmetric."]),
      hints: [
        "Each unvisited city starts a new province — DFS/BFS marks its whole component.",
        "Union-Find also works: count the remaining roots.",
      ],
      examples: [
        { input: "[[1,1,0],[1,1,0],[0,0,1]]", expectedOutput: "2" },
        { input: "[[1,0,0],[0,1,0],[0,0,1]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const m = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          m[i][i] = 1;
          for (let j = i + 1; j < n; j++) {
            if (rng() < 0.25) {
              m[i][j] = 1;
              m[j][i] = 1;
            }
          }
        }
        return { input: fmtIntMat(m), expectedOutput: String(ref(m)) };
      },
      editorial: explain({
        idea: "A province is a connected component of the graph described by the adjacency matrix. Counting components is a standard sweep: walk the cities, and every time you meet one you have not visited yet, that city must belong to a component nobody has counted — so increment the answer and flood-fill everything reachable from it.",
        steps: [
          "Keep a `seen` flag per city and a component counter at `0`.",
          "For each city `i` not yet seen: increment the counter, then start a DFS or BFS from `i`.",
          "In the traversal, from city `u` visit every `v` with `isConnected[u][v] == 1` that is not yet seen, marking it seen.",
          "When the traversal drains, the whole province has been marked; continue the outer scan.",
          "The counter is the number of provinces.",
        ],
        why: "Marking cities as seen the moment they are queued means each city is processed exactly once, so the traversal from `i` reaches precisely the cities connected to `i` and no others. The outer loop therefore starts a new traversal exactly once per component — never twice for the same one, because the second city of a component is already marked by the time the loop reaches it.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Mark a city as seen when you **push** it, not when you pop it, or the same city can be queued many times.",
          "The diagonal is always `1`; a self-loop is harmless here but must not be mistaken for a connection to another city.",
          "Union-Find is an equally good fit — count the distinct roots at the end rather than the traversals.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findCircleNum(isConnected: List[List[int]]) -> int:\n    n = len(isConnected)\n    seen = [False] * n\n\n    def dfs(i):\n        seen[i] = True\n        for j in range(n):\n            if isConnected[i][j] == 1 and not seen[j]:\n                dfs(j)\n\n    count = 0\n    for i in range(n):\n        if not seen[i]:\n            count += 1\n            dfs(i)\n    return count`,
        javascript: `var findCircleNum = function(isConnected) {\n    const n = isConnected.length;\n    const seen = new Array(n).fill(false);\n    function dfs(i) {\n        seen[i] = true;\n        for (let j = 0; j < n; j++) {\n            if (isConnected[i][j] === 1 && !seen[j]) dfs(j);\n        }\n    }\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        if (!seen[i]) {\n            count++;\n            dfs(i);\n        }\n    }\n    return count;\n};`,
              typescript: `function findCircleNum(isConnected: number[][]): number {\n    const n = isConnected.length;\n    const seen: boolean[] = [];\n    for (let i = 0; i < n; i++) seen.push(false);\n    let provinces = 0;\n    for (let i = 0; i < n; i++) {\n        if (seen[i]) continue;\n        provinces++;\n        const stack: number[] = [i];\n        seen[i] = true;\n        while (stack.length > 0) {\n            const u = stack.pop() as number;\n            for (let v = 0; v < n; v++) {\n                if (isConnected[u][v] === 1 && !seen[v]) {\n                    seen[v] = true;\n                    stack.push(v);\n                }\n            }\n        }\n    }\n    return provinces;\n}`,
              java: `public static int findCircleNum(int[][] isConnected) {\n    int n = isConnected.length;\n    boolean[] seen = new boolean[n];\n    int provinces = 0;\n    for (int i = 0; i < n; i++) {\n        if (seen[i]) continue;\n        provinces++;\n        Deque<Integer> stack = new ArrayDeque<>();\n        stack.push(i);\n        seen[i] = true;\n        while (!stack.isEmpty()) {\n            int u = stack.pop();\n            for (int v = 0; v < n; v++) {\n                if (isConnected[u][v] == 1 && !seen[v]) {\n                    seen[v] = true;\n                    stack.push(v);\n                }\n            }\n        }\n    }\n    return provinces;\n}`,
              cpp: `int findCircleNum(vector<vector<int>>& isConnected) {\n    int n = (int) isConnected.size();\n    vector<bool> seen(n, false);\n    int provinces = 0;\n    for (int i = 0; i < n; i++) {\n        if (seen[i]) continue;\n        provinces++;\n        vector<int> stack;\n        stack.push_back(i);\n        seen[i] = true;\n        while (!stack.empty()) {\n            int u = stack.back();\n            stack.pop_back();\n            for (int v = 0; v < n; v++) {\n                if (isConnected[u][v] == 1 && !seen[v]) {\n                    seen[v] = true;\n                    stack.push_back(v);\n                }\n            }\n        }\n    }\n    return provinces;\n}`,
              c: `int findCircleNum(int** isConnected, int isConnectedSize, int* isConnectedColSize) {\n    int n = isConnectedSize;\n    int* seen = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    int* stack = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int provinces = 0;\n    for (int i = 0; i < n; i++) {\n        if (seen[i]) continue;\n        provinces++;\n        int top = 0;\n        stack[top++] = i;\n        seen[i] = 1;\n        while (top > 0) {\n            int u = stack[--top];\n            for (int v = 0; v < n; v++) {\n                if (isConnected[u][v] == 1 && !seen[v]) {\n                    seen[v] = 1;\n                    stack[top++] = v;\n                }\n            }\n        }\n    }\n    free(seen);\n    free(stack);\n    return provinces;\n}`,
              csharp: `public static int FindCircleNum(int[][] isConnected)\n{\n    int n = isConnected.Length;\n    bool[] seen = new bool[n];\n    int provinces = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (seen[i]) continue;\n        provinces++;\n        var stack = new Stack<int>();\n        stack.Push(i);\n        seen[i] = true;\n        while (stack.Count > 0)\n        {\n            int u = stack.Pop();\n            for (int v = 0; v < n; v++)\n            {\n                if (isConnected[u][v] == 1 && !seen[v])\n                {\n                    seen[v] = true;\n                    stack.Push(v);\n                }\n            }\n        }\n    }\n    return provinces;\n}`,
              go: `func findCircleNum(isConnected [][]int) int {\n	n := len(isConnected)\n	seen := make([]bool, n)\n	provinces := 0\n	for i := 0; i < n; i++ {\n		if seen[i] {\n			continue\n		}\n		provinces++\n		stack := []int{i}\n		seen[i] = true\n		for len(stack) > 0 {\n			u := stack[len(stack)-1]\n			stack = stack[:len(stack)-1]\n			for v := 0; v < n; v++ {\n				if isConnected[u][v] == 1 && !seen[v] {\n					seen[v] = true\n					stack = append(stack, v)\n				}\n			}\n		}\n	}\n	return provinces\n}`,
              kotlin: `fun findCircleNum(isConnected: Array<IntArray>): Int {\n    val n = isConnected.size\n    val seen = BooleanArray(n)\n    var provinces = 0\n    for (i in 0 until n) {\n        if (seen[i]) continue\n        provinces++\n        val stack = mutableListOf(i)\n        seen[i] = true\n        while (stack.isNotEmpty()) {\n            val u = stack.removeAt(stack.size - 1)\n            for (v in 0 until n) {\n                if (isConnected[u][v] == 1 && !seen[v]) {\n                    seen[v] = true\n                    stack.add(v)\n                }\n            }\n        }\n    }\n    return provinces\n}`,
              swift: `func findCircleNum(_ isConnected: [[Int]]) -> Int {\n    let n = isConnected.count\n    var seen = [Bool](repeating: false, count: n)\n    var provinces = 0\n    for i in 0..<n {\n        if seen[i] { continue }\n        provinces += 1\n        var stack = [i]\n        seen[i] = true\n        while !stack.isEmpty {\n            let u = stack.removeLast()\n            for v in 0..<n {\n                if isConnected[u][v] == 1 && !seen[v] {\n                    seen[v] = true\n                    stack.append(v)\n                }\n            }\n        }\n    }\n    return provinces\n}`,
              rust: `fn findCircleNum(isConnected: Vec<Vec<i32>>) -> i32 {\n    let n = isConnected.len();\n    let mut seen = vec![false; n];\n    let mut provinces = 0;\n    for i in 0..n {\n        if seen[i] {\n            continue;\n        }\n        provinces += 1;\n        let mut stack: Vec<usize> = vec![i];\n        seen[i] = true;\n        while let Some(u) = stack.pop() {\n            for v in 0..n {\n                if isConnected[u][v] == 1 && !seen[v] {\n                    seen[v] = true;\n                    stack.push(v);\n                }\n            }\n        }\n    }\n    provinces\n}`,
              php: `function findCircleNum($isConnected) {\n    $n = count($isConnected);\n    $seen = array_fill(0, $n, false);\n    $provinces = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($seen[$i]) continue;\n        $provinces++;\n        $stack = array($i);\n        $seen[$i] = true;\n        while (count($stack) > 0) {\n            $u = array_pop($stack);\n            for ($v = 0; $v < $n; $v++) {\n                if ($isConnected[$u][$v] === 1 && !$seen[$v]) {\n                    $seen[$v] = true;\n                    array_push($stack, $v);\n                }\n            }\n        }\n    }\n    return $provinces;\n}`,
              ruby: `def findCircleNum(isConnected)\n  n = isConnected.length\n  seen = Array.new(n, false)\n  provinces = 0\n  (0...n).each do |i|\n    next if seen[i]\n    provinces += 1\n    stack = [i]\n    seen[i] = true\n    while !stack.empty?\n      u = stack.pop\n      (0...n).each do |v|\n        if isConnected[u][v] == 1 && !seen[v]\n          seen[v] = true\n          stack.push(v)\n        end\n      end\n    end\n  end\n  provinces\nend`,
      },
    };
  })(),

  // ── Find if Path Exists in Graph ────────────────────────────────
  (() => {
    const ref = (n: number, edges: number[][], source: number, destination: number) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      for (const [a, b] of edges) parent[find(a)] = find(b);
      return find(source) === find(destination);
    };
    return {
      slug: "find-if-path-exists-in-graph",
      title: "Find if Path Exists in Graph",
      difficulty: "EASY" as const,
      tags: ["Graph", "Union Find", "Breadth-First Search"],
      signature: {
        funcName: "validPath",
        params: [
          { name: "n", type: "int" as const },
          { name: "edges", type: "int[][]" as const },
          { name: "source", type: "int" as const },
          { name: "destination", type: "int" as const },
        ],
        returns: "bool" as const,
      },
      description: describe(
        "There is a bidirectional graph with `n` vertices labelled `0..n-1` and an edge list `edges`. Determine whether there is a **valid path** from `source` to `destination`.",
        [
          { in: "n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2", out: "true" },
          { in: "n = 6, edges = [[0,1],[0,2],[3,5],[5,4],[4,3]], source = 0, destination = 5", out: "false" },
        ],
        ["1 <= n <= 15", "0 <= edges.length <= 40", "0 <= source, destination < n"]),
      hints: [
        "BFS/DFS from source, or Union-Find.",
        "With Union-Find the answer is just find(source) == find(destination).",
      ],
      examples: [
        { input: "3\n[[0,1],[1,2],[2,0]]\n0\n2", expectedOutput: "true" },
        { input: "6\n[[0,1],[0,2],[3,5],[5,4],[4,3]]\n0\n5", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 15);
        const edges = Array.from({ length: ri(rng, 0, 20) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        const source = ri(rng, 0, n - 1);
        const destination = ri(rng, 0, n - 1);
        return {
          input: `${n}\n${fmtIntMat(edges)}\n${source}\n${destination}`,
          expectedOutput: bool(ref(n, edges, source, destination)),
        };
      },
      editorial: explain({
        idea: "Reachability in an undirected graph is just \"is `destination` in the connected component of `source`\". Build an adjacency list, then flood-fill from `source` and see whether you ever land on `destination`.",
        steps: [
          "Answer `true` immediately if `source == destination` — the empty path counts.",
          "Build an adjacency list, adding each edge in **both** directions since the graph is undirected.",
          "Traverse from `source` with a stack (DFS) or queue (BFS), marking each node seen when it is pushed.",
          "Return `true` the moment `destination` is reached.",
          "If the traversal drains without finding it, the two nodes are in different components — return `false`.",
        ],
        why: "Marking on push means every node enters the frontier at most once, so the traversal terminates and visits exactly the component containing `source`. Reachability in an undirected graph is symmetric and transitive, so being in that component is the same as a path existing. Union-Find gives the same answer even more directly: unite every edge, then ask whether the two nodes share a root.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Add both directions for each edge. Treating the list as directed silently gives wrong `false` answers.",
          "Handle `source == destination` explicitly — with `n = 1` and no edges the answer is still `true`.",
          "The input may contain self-loops and duplicate edges; the `seen` check absorbs both.",
          "Marking as seen on pop instead of push can blow the frontier up on dense graphs.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef validPath(n: int, edges: List[List[int]], source: int, destination: int) -> bool:\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        parent[find(a)] = find(b)\n    return find(source) == find(destination)`,
        javascript: `var validPath = function(n, edges, source, destination) {\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    function find(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    for (const e of edges) {\n        parent[find(e[0])] = find(e[1]);\n    }\n    return find(source) === find(destination);\n};`,
              typescript: `function validPath(n: number, edges: number[][], source: number, destination: number): boolean {\n    if (source === destination) return true;\n    const adj: number[][] = [];\n    for (let i = 0; i < n; i++) adj.push([]);\n    for (let i = 0; i < edges.length; i++) {\n        adj[edges[i][0]].push(edges[i][1]);\n        adj[edges[i][1]].push(edges[i][0]);\n    }\n    const seen: boolean[] = [];\n    for (let i = 0; i < n; i++) seen.push(false);\n    const stack: number[] = [source];\n    seen[source] = true;\n    while (stack.length > 0) {\n        const u = stack.pop() as number;\n        if (u === destination) return true;\n        for (let i = 0; i < adj[u].length; i++) {\n            const v = adj[u][i];\n            if (!seen[v]) {\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n    }\n    return false;\n}`,
              java: `public static boolean validPath(int n, int[][] edges, int source, int destination) {\n    if (source == destination) return true;\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i = 0; i < n; i++) adj.add(new ArrayList<Integer>());\n    for (int[] e : edges) {\n        adj.get(e[0]).add(e[1]);\n        adj.get(e[1]).add(e[0]);\n    }\n    boolean[] seen = new boolean[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(source);\n    seen[source] = true;\n    while (!stack.isEmpty()) {\n        int u = stack.pop();\n        if (u == destination) return true;\n        for (int v : adj.get(u)) {\n            if (!seen[v]) {\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n    }\n    return false;\n}`,
              cpp: `bool validPath(int n, vector<vector<int>>& edges, int source, int destination) {\n    if (source == destination) return true;\n    vector<vector<int>> adj(n);\n    for (const auto& e : edges) {\n        adj[e[0]].push_back(e[1]);\n        adj[e[1]].push_back(e[0]);\n    }\n    vector<bool> seen(n, false);\n    vector<int> stack;\n    stack.push_back(source);\n    seen[source] = true;\n    while (!stack.empty()) {\n        int u = stack.back();\n        stack.pop_back();\n        if (u == destination) return true;\n        for (int v : adj[u]) {\n            if (!seen[v]) {\n                seen[v] = true;\n                stack.push_back(v);\n            }\n        }\n    }\n    return false;\n}`,
              c: `bool validPath(int n, int** edges, int edgesSize, int* edgesColSize, int source, int destination) {\n    if (source == destination) return true;\n    int* seen = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    int* stack = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    stack[top++] = source;\n    seen[source] = 1;\n    bool found = false;\n    while (top > 0) {\n        int u = stack[--top];\n        if (u == destination) {\n            found = true;\n            break;\n        }\n        for (int i = 0; i < edgesSize; i++) {\n            int a = edges[i][0];\n            int b = edges[i][1];\n            int v = -1;\n            if (a == u) v = b;\n            else if (b == u) v = a;\n            if (v >= 0 && !seen[v]) {\n                seen[v] = 1;\n                stack[top++] = v;\n            }\n        }\n    }\n    free(seen);\n    free(stack);\n    return found;\n}`,
              csharp: `public static bool ValidPath(int n, int[][] edges, int source, int destination)\n{\n    if (source == destination) return true;\n    var adj = new List<List<int>>();\n    for (int i = 0; i < n; i++) adj.Add(new List<int>());\n    foreach (int[] e in edges)\n    {\n        adj[e[0]].Add(e[1]);\n        adj[e[1]].Add(e[0]);\n    }\n    bool[] seen = new bool[n];\n    var stack = new Stack<int>();\n    stack.Push(source);\n    seen[source] = true;\n    while (stack.Count > 0)\n    {\n        int u = stack.Pop();\n        if (u == destination) return true;\n        foreach (int v in adj[u])\n        {\n            if (!seen[v])\n            {\n                seen[v] = true;\n                stack.Push(v);\n            }\n        }\n    }\n    return false;\n}`,
              go: `func validPath(n int, edges [][]int, source int, destination int) bool {\n	if source == destination {\n		return true\n	}\n	adj := make([][]int, n)\n	for _, e := range edges {\n		adj[e[0]] = append(adj[e[0]], e[1])\n		adj[e[1]] = append(adj[e[1]], e[0])\n	}\n	seen := make([]bool, n)\n	stack := []int{source}\n	seen[source] = true\n	for len(stack) > 0 {\n		u := stack[len(stack)-1]\n		stack = stack[:len(stack)-1]\n		if u == destination {\n			return true\n		}\n		for _, v := range adj[u] {\n			if !seen[v] {\n				seen[v] = true\n				stack = append(stack, v)\n			}\n		}\n	}\n	return false\n}`,
              kotlin: `fun validPath(n: Int, edges: Array<IntArray>, source: Int, destination: Int): Boolean {\n    if (source == destination) return true\n    val adj = Array(n) { mutableListOf<Int>() }\n    for (e in edges) {\n        adj[e[0]].add(e[1])\n        adj[e[1]].add(e[0])\n    }\n    val seen = BooleanArray(n)\n    val stack = mutableListOf(source)\n    seen[source] = true\n    while (stack.isNotEmpty()) {\n        val u = stack.removeAt(stack.size - 1)\n        if (u == destination) return true\n        for (v in adj[u]) {\n            if (!seen[v]) {\n                seen[v] = true\n                stack.add(v)\n            }\n        }\n    }\n    return false\n}`,
              swift: `func validPath(_ n: Int, _ edges: [[Int]], _ source: Int, _ destination: Int) -> Bool {\n    if source == destination { return true }\n    var adj = [[Int]](repeating: [], count: n)\n    for e in edges {\n        adj[e[0]].append(e[1])\n        adj[e[1]].append(e[0])\n    }\n    var seen = [Bool](repeating: false, count: n)\n    var stack = [source]\n    seen[source] = true\n    while !stack.isEmpty {\n        let u = stack.removeLast()\n        if u == destination { return true }\n        for v in adj[u] {\n            if !seen[v] {\n                seen[v] = true\n                stack.append(v)\n            }\n        }\n    }\n    return false\n}`,
              rust: `fn validPath(n: i32, edges: Vec<Vec<i32>>, source: i32, destination: i32) -> bool {\n    if source == destination {\n        return true;\n    }\n    let n = n as usize;\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    for e in edges.iter() {\n        adj[e[0] as usize].push(e[1] as usize);\n        adj[e[1] as usize].push(e[0] as usize);\n    }\n    let mut seen = vec![false; n];\n    let mut stack: Vec<usize> = vec![source as usize];\n    seen[source as usize] = true;\n    while let Some(u) = stack.pop() {\n        if u == destination as usize {\n            return true;\n        }\n        for &v in adj[u].iter() {\n            if !seen[v] {\n                seen[v] = true;\n                stack.push(v);\n            }\n        }\n    }\n    false\n}`,
              php: `function validPath($n, $edges, $source, $destination) {\n    if ($source === $destination) return true;\n    $adj = array_fill(0, $n, array());\n    foreach ($edges as $e) {\n        $adj[$e[0]][] = $e[1];\n        $adj[$e[1]][] = $e[0];\n    }\n    $seen = array_fill(0, $n, false);\n    $stack = array($source);\n    $seen[$source] = true;\n    while (count($stack) > 0) {\n        $u = array_pop($stack);\n        if ($u === $destination) return true;\n        foreach ($adj[$u] as $v) {\n            if (!$seen[$v]) {\n                $seen[$v] = true;\n                array_push($stack, $v);\n            }\n        }\n    }\n    return false;\n}`,
              ruby: `def validPath(n, edges, source, destination)\n  return true if source == destination\n  adj = Array.new(n) { [] }\n  edges.each do |e|\n    adj[e[0]].push(e[1])\n    adj[e[1]].push(e[0])\n  end\n  seen = Array.new(n, false)\n  stack = [source]\n  seen[source] = true\n  while !stack.empty?\n    u = stack.pop\n    return true if u == destination\n    adj[u].each do |v|\n      unless seen[v]\n        seen[v] = true\n        stack.push(v)\n      end\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Course Schedule ─────────────────────────────────────────────
  (() => {
    const ref = (numCourses: number, prerequisites: number[][]) => {
      const indeg = new Array(numCourses).fill(0);
      const adj: number[][] = Array.from({ length: numCourses }, () => []);
      for (const [a, b] of prerequisites) {
        adj[b].push(a);
        indeg[a]++;
      }
      const queue: number[] = [];
      for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
      let taken = 0;
      while (queue.length > 0) {
        const c = queue.shift()!;
        taken++;
        for (const nxt of adj[c]) {
          if (--indeg[nxt] === 0) queue.push(nxt);
        }
      }
      return taken === numCourses;
    };
    return {
      slug: "course-schedule",
      title: "Course Schedule",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Topological Sort", "Depth-First Search"],
      signature: { funcName: "canFinish", params: [{ name: "numCourses", type: "int" as const }, { name: "prerequisites", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "There are `numCourses` courses labelled `0..numCourses-1`. `prerequisites[i] = [a, b]` means you must take course `b` before course `a`.\n\nReturn `true` if you can finish **all** courses (i.e. the prerequisite graph has no cycle).",
        [
          { in: "numCourses = 2, prerequisites = [[1,0]]", out: "true" },
          { in: "numCourses = 2, prerequisites = [[1,0],[0,1]]", out: "false", note: "0 and 1 require each other." },
        ],
        ["1 <= numCourses <= 10", "0 <= prerequisites.length <= 20"]),
      hints: [
        "This is cycle detection in a directed graph.",
        "Kahn's algorithm: repeatedly remove nodes with in-degree 0; a leftover node means a cycle.",
      ],
      examples: [
        { input: "2\n[[1,0]]", expectedOutput: "true" },
        { input: "2\n[[1,0],[0,1]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const prereqs = Array.from({ length: ri(rng, 0, 20) }, () => {
          const a = ri(rng, 0, n - 1);
          let b = ri(rng, 0, n - 1);
          if (a === b) b = (b + 1) % n;
          return [a, b];
        }).filter(([a, b]) => a !== b);
        return { input: `${n}\n${fmtIntMat(prereqs)}`, expectedOutput: bool(ref(n, prereqs)) };
      },
      editorial: explain({
        idea: "You can finish every course exactly when the prerequisite graph has **no cycle** — a cycle is a set of courses each waiting on another, so none can ever be taken first. Kahn's algorithm detects that by repeatedly removing courses with nothing left to wait for; whatever cannot be removed is trapped in a cycle.",
        steps: [
          "Build the graph with an edge `b -> a` for each pair `[a, b]` (b must come first), and count each course's in-degree.",
          "Seed a queue with every course of in-degree `0` — those have no unmet prerequisites.",
          "Pop a course, count it as taken, and decrement the in-degree of each course depending on it.",
          "Any course whose in-degree drops to `0` becomes available; push it.",
          "If the number taken equals `numCourses`, everything was schedulable — otherwise a cycle blocked the rest.",
        ],
        why: "A course leaves the queue only once all of its prerequisites have already left, so the pop order is a valid schedule. If the graph is acyclic, every course eventually reaches in-degree `0` — a directed acyclic graph always has a source — so all are taken. If a cycle exists, none of its members ever reaches in-degree `0`, since each is waiting on another member, so the count falls short. The comparison is therefore an exact cycle test.",
        time: "O(V + E)",
        space: "O(V + E)",
        pitfalls: [
          "Mind the edge direction: `[a, b]` means `b` comes **before** `a`, so the edge runs `b -> a` and it is `a`'s in-degree that grows.",
          "Compare the count taken against `numCourses`, not against the number of edges.",
          "Courses with no prerequisites at all must still be seeded into the queue.",
          "Duplicate prerequisite pairs are fine as long as in-degree and adjacency stay consistent — count the duplicate in both.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef canFinish(numCourses: int, prerequisites: List[List[int]]) -> bool:\n    indeg = [0] * numCourses\n    adj = [[] for _ in range(numCourses)]\n    for a, b in prerequisites:\n        adj[b].append(a)\n        indeg[a] += 1\n    queue = deque(i for i in range(numCourses) if indeg[i] == 0)\n    taken = 0\n    while queue:\n        c = queue.popleft()\n        taken += 1\n        for nxt in adj[c]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                queue.append(nxt)\n    return taken == numCourses`,
        javascript: `var canFinish = function(numCourses, prerequisites) {\n    const indeg = new Array(numCourses).fill(0);\n    const adj = [];\n    for (let i = 0; i < numCourses; i++) adj.push([]);\n    for (const p of prerequisites) {\n        adj[p[1]].push(p[0]);\n        indeg[p[0]]++;\n    }\n    const queue = [];\n    for (let i = 0; i < numCourses; i++) {\n        if (indeg[i] === 0) queue.push(i);\n    }\n    let taken = 0;\n    let head = 0;\n    while (head < queue.length) {\n        const c = queue[head++];\n        taken++;\n        for (const nxt of adj[c]) {\n            if (--indeg[nxt] === 0) queue.push(nxt);\n        }\n    }\n    return taken === numCourses;\n};`,
              typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n    const adj: number[][] = [];\n    const indeg: number[] = [];\n    for (let i = 0; i < numCourses; i++) {\n        adj.push([]);\n        indeg.push(0);\n    }\n    for (let i = 0; i < prerequisites.length; i++) {\n        const a = prerequisites[i][0];\n        const b = prerequisites[i][1];\n        adj[b].push(a);\n        indeg[a]++;\n    }\n    const queue: number[] = [];\n    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);\n    let done = 0;\n    let head = 0;\n    while (head < queue.length) {\n        const u = queue[head++];\n        done++;\n        for (let i = 0; i < adj[u].length; i++) {\n            const v = adj[u][i];\n            indeg[v]--;\n            if (indeg[v] === 0) queue.push(v);\n        }\n    }\n    return done === numCourses;\n}`,
              java: `public static boolean canFinish(int numCourses, int[][] prerequisites) {\n    List<List<Integer>> adj = new ArrayList<>();\n    int[] indeg = new int[numCourses];\n    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<Integer>());\n    for (int[] p : prerequisites) {\n        adj.get(p[1]).add(p[0]);\n        indeg[p[0]]++;\n    }\n    Deque<Integer> queue = new ArrayDeque<>();\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.add(i);\n    int done = 0;\n    while (!queue.isEmpty()) {\n        int u = queue.poll();\n        done++;\n        for (int v : adj.get(u)) {\n            indeg[v]--;\n            if (indeg[v] == 0) queue.add(v);\n        }\n    }\n    return done == numCourses;\n}`,
              cpp: `bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    vector<vector<int>> adj(numCourses);\n    vector<int> indeg(numCourses, 0);\n    for (const auto& p : prerequisites) {\n        adj[p[1]].push_back(p[0]);\n        indeg[p[0]]++;\n    }\n    vector<int> queue;\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.push_back(i);\n    int done = 0;\n    size_t head = 0;\n    while (head < queue.size()) {\n        int u = queue[head++];\n        done++;\n        for (int v : adj[u]) {\n            indeg[v]--;\n            if (indeg[v] == 0) queue.push_back(v);\n        }\n    }\n    return done == numCourses;\n}`,
              c: `bool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {\n    int n = numCourses;\n    int* indeg = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    for (int i = 0; i < prerequisitesSize; i++) indeg[prerequisites[i][0]]++;\n    int* queue = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;\n    int done = 0;\n    while (head < tail) {\n        int u = queue[head++];\n        done++;\n        for (int i = 0; i < prerequisitesSize; i++) {\n            if (prerequisites[i][1] != u) continue;\n            int v = prerequisites[i][0];\n            indeg[v]--;\n            if (indeg[v] == 0) queue[tail++] = v;\n        }\n    }\n    free(indeg);\n    free(queue);\n    return done == n;\n}`,
              csharp: `public static bool CanFinish(int numCourses, int[][] prerequisites)\n{\n    var adj = new List<List<int>>();\n    int[] indeg = new int[numCourses];\n    for (int i = 0; i < numCourses; i++) adj.Add(new List<int>());\n    foreach (int[] p in prerequisites)\n    {\n        adj[p[1]].Add(p[0]);\n        indeg[p[0]]++;\n    }\n    var queue = new Queue<int>();\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.Enqueue(i);\n    int done = 0;\n    while (queue.Count > 0)\n    {\n        int u = queue.Dequeue();\n        done++;\n        foreach (int v in adj[u])\n        {\n            indeg[v]--;\n            if (indeg[v] == 0) queue.Enqueue(v);\n        }\n    }\n    return done == numCourses;\n}`,
              go: `func canFinish(numCourses int, prerequisites [][]int) bool {\n	adj := make([][]int, numCourses)\n	indeg := make([]int, numCourses)\n	for _, p := range prerequisites {\n		adj[p[1]] = append(adj[p[1]], p[0])\n		indeg[p[0]]++\n	}\n	queue := []int{}\n	for i := 0; i < numCourses; i++ {\n		if indeg[i] == 0 {\n			queue = append(queue, i)\n		}\n	}\n	done := 0\n	for head := 0; head < len(queue); head++ {\n		u := queue[head]\n		done++\n		for _, v := range adj[u] {\n			indeg[v]--\n			if indeg[v] == 0 {\n				queue = append(queue, v)\n			}\n		}\n	}\n	return done == numCourses\n}`,
              kotlin: `fun canFinish(numCourses: Int, prerequisites: Array<IntArray>): Boolean {\n    val adj = Array(numCourses) { mutableListOf<Int>() }\n    val indeg = IntArray(numCourses)\n    for (p in prerequisites) {\n        adj[p[1]].add(p[0])\n        indeg[p[0]]++\n    }\n    val queue = mutableListOf<Int>()\n    for (i in 0 until numCourses) if (indeg[i] == 0) queue.add(i)\n    var done = 0\n    var head = 0\n    while (head < queue.size) {\n        val u = queue[head++]\n        done++\n        for (v in adj[u]) {\n            indeg[v]--\n            if (indeg[v] == 0) queue.add(v)\n        }\n    }\n    return done == numCourses\n}`,
              swift: `func canFinish(_ numCourses: Int, _ prerequisites: [[Int]]) -> Bool {\n    var adj = [[Int]](repeating: [], count: numCourses)\n    var indeg = [Int](repeating: 0, count: numCourses)\n    for p in prerequisites {\n        adj[p[1]].append(p[0])\n        indeg[p[0]] += 1\n    }\n    var queue: [Int] = []\n    for i in 0..<numCourses where indeg[i] == 0 { queue.append(i) }\n    var done = 0\n    var head = 0\n    while head < queue.count {\n        let u = queue[head]\n        head += 1\n        done += 1\n        for v in adj[u] {\n            indeg[v] -= 1\n            if indeg[v] == 0 { queue.append(v) }\n        }\n    }\n    return done == numCourses\n}`,
              rust: `fn canFinish(numCourses: i32, prerequisites: Vec<Vec<i32>>) -> bool {\n    let n = numCourses as usize;\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    let mut indeg = vec![0i32; n];\n    for p in prerequisites.iter() {\n        adj[p[1] as usize].push(p[0] as usize);\n        indeg[p[0] as usize] += 1;\n    }\n    let mut queue: Vec<usize> = Vec::new();\n    for i in 0..n {\n        if indeg[i] == 0 {\n            queue.push(i);\n        }\n    }\n    let mut done = 0;\n    let mut head = 0;\n    while head < queue.len() {\n        let u = queue[head];\n        head += 1;\n        done += 1;\n        for k in 0..adj[u].len() {\n            let v = adj[u][k];\n            indeg[v] -= 1;\n            if indeg[v] == 0 {\n                queue.push(v);\n            }\n        }\n    }\n    done == n\n}`,
              php: `function canFinish($numCourses, $prerequisites) {\n    $adj = array_fill(0, $numCourses, array());\n    $indeg = array_fill(0, $numCourses, 0);\n    foreach ($prerequisites as $p) {\n        $adj[$p[1]][] = $p[0];\n        $indeg[$p[0]]++;\n    }\n    $queue = array();\n    for ($i = 0; $i < $numCourses; $i++) if ($indeg[$i] === 0) $queue[] = $i;\n    $done = 0;\n    $head = 0;\n    while ($head < count($queue)) {\n        $u = $queue[$head];\n        $head++;\n        $done++;\n        foreach ($adj[$u] as $v) {\n            $indeg[$v]--;\n            if ($indeg[$v] === 0) $queue[] = $v;\n        }\n    }\n    return $done === $numCourses;\n}`,
              ruby: `def canFinish(numCourses, prerequisites)\n  adj = Array.new(numCourses) { [] }\n  indeg = Array.new(numCourses, 0)\n  prerequisites.each do |p|\n    adj[p[1]].push(p[0])\n    indeg[p[0]] += 1\n  end\n  queue = []\n  (0...numCourses).each { |i| queue.push(i) if indeg[i] == 0 }\n  done = 0\n  head = 0\n  while head < queue.length\n    u = queue[head]\n    head += 1\n    done += 1\n    adj[u].each do |v|\n      indeg[v] -= 1\n      queue.push(v) if indeg[v] == 0\n    end\n  end\n  done == numCourses\nend`,
      },
    };
  })(),

  // ── Course Schedule II (lexicographically smallest order) ───────
  (() => {
    const ref = (numCourses: number, prerequisites: number[][]) => {
      const indeg = new Array(numCourses).fill(0);
      const adj: number[][] = Array.from({ length: numCourses }, () => []);
      for (const [a, b] of prerequisites) {
        adj[b].push(a);
        indeg[a]++;
      }
      const out: number[] = [];
      const avail = new Set<number>();
      for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) avail.add(i);
      while (avail.size > 0) {
        const c = Math.min(...avail);
        avail.delete(c);
        out.push(c);
        for (const nxt of adj[c]) {
          if (--indeg[nxt] === 0) avail.add(nxt);
        }
      }
      return out.length === numCourses ? out : [];
    };
    return {
      slug: "course-schedule-ii",
      title: "Course Schedule II",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Topological Sort", "Heap"],
      signature: { funcName: "findOrder", params: [{ name: "numCourses", type: "int" as const }, { name: "prerequisites", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `numCourses` courses; `prerequisites[i] = [a, b]` means course `b` comes before course `a`. Return a valid order to take all courses — specifically the **lexicographically smallest** valid order. If finishing all courses is impossible, return an empty array.",
        [
          { in: "numCourses = 2, prerequisites = [[1,0]]", out: "[0,1]" },
          { in: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", out: "[0,1,2,3]" },
          { in: "numCourses = 2, prerequisites = [[1,0],[0,1]]", out: "[]" },
        ],
        ["1 <= numCourses <= 10", "0 <= prerequisites.length <= 20"]),
      hints: [
        "Kahn's algorithm, but pick the SMALLEST available course each step (a min-heap).",
        "If the produced order is shorter than numCourses, there was a cycle.",
      ],
      examples: [
        { input: "2\n[[1,0]]", expectedOutput: "[0,1]" },
        { input: "4\n[[1,0],[2,0],[3,1],[3,2]]", expectedOutput: "[0,1,2,3]" },
        { input: "2\n[[1,0],[0,1]]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const prereqs = Array.from({ length: ri(rng, 0, 20) }, () => {
          const a = ri(rng, 0, n - 1);
          let b = ri(rng, 0, n - 1);
          if (a === b) b = (b + 1) % n;
          return [a, b];
        }).filter(([a, b]) => a !== b);
        return { input: `${n}\n${fmtIntMat(prereqs)}`, expectedOutput: fmtIntArr(ref(n, prereqs)) };
      },
      editorial: explain({
        idea: "Same topological sort as the yes/no version, but now the order itself is the answer — and among all valid orders you must return the lexicographically smallest. Kahn's algorithm leaves you free to pick *any* available course at each step, so exploit that freedom: always take the **smallest-numbered** course currently available.",
        steps: [
          "Build edges `b -> a` for each `[a, b]` and count in-degrees.",
          "Collect every course with in-degree `0` into an available set.",
          "Repeatedly take the **smallest** available course, append it to the order, and decrement its dependants' in-degrees.",
          "Any dependant reaching in-degree `0` joins the available set.",
          "If the finished order is shorter than `numCourses`, a cycle blocked the rest — return an empty array.",
        ],
        why: "Greedily taking the smallest available course is optimal for lexicographic order: at each position the candidates are exactly the available courses, taking a larger one can only make the sequence bigger at that index, and choosing the smallest never removes a later option — a course's availability depends only on which courses have been taken, not on their order. Shortness of the result is still an exact cycle test, for the same reason as in the decision version.",
        time: "O(V^2 + E) with a linear scan for the minimum, O((V + E) log V) with a heap",
        space: "O(V + E)",
        pitfalls: [
          "A plain FIFO queue gives *a* valid order but not the lexicographically smallest — the selection must be by value.",
          "Return an empty array on a cycle, not a partial order.",
          "Edge direction again: `[a, b]` means `b` first, so the edge is `b -> a`.",
          "Re-select the minimum after every step; the newly freed courses may be smaller than what was already waiting.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef findOrder(numCourses: int, prerequisites: List[List[int]]) -> List[int]:\n    indeg = [0] * numCourses\n    adj = [[] for _ in range(numCourses)]\n    for a, b in prerequisites:\n        adj[b].append(a)\n        indeg[a] += 1\n    heap = [i for i in range(numCourses) if indeg[i] == 0]\n    heapq.heapify(heap)\n    out = []\n    while heap:\n        c = heapq.heappop(heap)\n        out.append(c)\n        for nxt in adj[c]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                heapq.heappush(heap, nxt)\n    return out if len(out) == numCourses else []`,
        javascript: `var findOrder = function(numCourses, prerequisites) {\n    const indeg = new Array(numCourses).fill(0);\n    const adj = [];\n    for (let i = 0; i < numCourses; i++) adj.push([]);\n    for (const p of prerequisites) {\n        adj[p[1]].push(p[0]);\n        indeg[p[0]]++;\n    }\n    const avail = [];\n    for (let i = 0; i < numCourses; i++) {\n        if (indeg[i] === 0) avail.push(i);\n    }\n    const out = [];\n    while (avail.length > 0) {\n        avail.sort(function(a, b) { return a - b; });\n        const c = avail.shift();\n        out.push(c);\n        for (const nxt of adj[c]) {\n            if (--indeg[nxt] === 0) avail.push(nxt);\n        }\n    }\n    return out.length === numCourses ? out : [];\n};`,
              typescript: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {\n    const adj: number[][] = [];\n    const indeg: number[] = [];\n    for (let i = 0; i < numCourses; i++) {\n        adj.push([]);\n        indeg.push(0);\n    }\n    for (let i = 0; i < prerequisites.length; i++) {\n        adj[prerequisites[i][1]].push(prerequisites[i][0]);\n        indeg[prerequisites[i][0]]++;\n    }\n    const avail: number[] = [];\n    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) avail.push(i);\n    const out: number[] = [];\n    while (avail.length > 0) {\n        avail.sort(function (a, b) { return a - b; });\n        const u = avail.shift() as number;\n        out.push(u);\n        for (let i = 0; i < adj[u].length; i++) {\n            const v = adj[u][i];\n            indeg[v]--;\n            if (indeg[v] === 0) avail.push(v);\n        }\n    }\n    return out.length === numCourses ? out : [];\n}`,
              java: `public static int[] findOrder(int numCourses, int[][] prerequisites) {\n    List<List<Integer>> adj = new ArrayList<>();\n    int[] indeg = new int[numCourses];\n    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<Integer>());\n    for (int[] p : prerequisites) {\n        adj.get(p[1]).add(p[0]);\n        indeg[p[0]]++;\n    }\n    PriorityQueue<Integer> avail = new PriorityQueue<>();\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) avail.add(i);\n    List<Integer> order = new ArrayList<>();\n    while (!avail.isEmpty()) {\n        int u = avail.poll();\n        order.add(u);\n        for (int v : adj.get(u)) {\n            indeg[v]--;\n            if (indeg[v] == 0) avail.add(v);\n        }\n    }\n    if (order.size() != numCourses) return new int[0];\n    int[] out = new int[order.size()];\n    for (int i = 0; i < order.size(); i++) out[i] = order.get(i);\n    return out;\n}`,
              cpp: `vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n    vector<vector<int>> adj(numCourses);\n    vector<int> indeg(numCourses, 0);\n    for (const auto& p : prerequisites) {\n        adj[p[1]].push_back(p[0]);\n        indeg[p[0]]++;\n    }\n    priority_queue<int, vector<int>, greater<int>> avail;\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) avail.push(i);\n    vector<int> out;\n    while (!avail.empty()) {\n        int u = avail.top();\n        avail.pop();\n        out.push_back(u);\n        for (int v : adj[u]) {\n            indeg[v]--;\n            if (indeg[v] == 0) avail.push(v);\n        }\n    }\n    if ((int) out.size() != numCourses) return vector<int>();\n    return out;\n}`,
              c: `int* findOrder(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize, int* returnSize) {\n    int n = numCourses;\n    int* indeg = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    for (int i = 0; i < prerequisitesSize; i++) indeg[prerequisites[i][0]]++;\n    int* avail = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    for (int i = 0; i < n; i++) avail[i] = (indeg[i] == 0) ? 1 : 0;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    while (1) {\n        int u = -1;\n        for (int i = 0; i < n; i++) {\n            if (avail[i] == 1) { u = i; break; }\n        }\n        if (u == -1) break;\n        avail[u] = 2;\n        out[count++] = u;\n        for (int i = 0; i < prerequisitesSize; i++) {\n            if (prerequisites[i][1] != u) continue;\n            int v = prerequisites[i][0];\n            indeg[v]--;\n            if (indeg[v] == 0 && avail[v] == 0) avail[v] = 1;\n        }\n    }\n    free(indeg);\n    free(avail);\n    if (count != n) {\n        *returnSize = 0;\n        return out;\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] FindOrder(int numCourses, int[][] prerequisites)\n{\n    var adj = new List<List<int>>();\n    int[] indeg = new int[numCourses];\n    for (int i = 0; i < numCourses; i++) adj.Add(new List<int>());\n    foreach (int[] p in prerequisites)\n    {\n        adj[p[1]].Add(p[0]);\n        indeg[p[0]]++;\n    }\n    var avail = new List<int>();\n    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) avail.Add(i);\n    var order = new List<int>();\n    while (avail.Count > 0)\n    {\n        avail.Sort();\n        int u = avail[0];\n        avail.RemoveAt(0);\n        order.Add(u);\n        foreach (int v in adj[u])\n        {\n            indeg[v]--;\n            if (indeg[v] == 0) avail.Add(v);\n        }\n    }\n    if (order.Count != numCourses) return new int[0];\n    return order.ToArray();\n}`,
              go: `func findOrder(numCourses int, prerequisites [][]int) []int {\n	adj := make([][]int, numCourses)\n	indeg := make([]int, numCourses)\n	for _, p := range prerequisites {\n		adj[p[1]] = append(adj[p[1]], p[0])\n		indeg[p[0]]++\n	}\n	avail := []int{}\n	for i := 0; i < numCourses; i++ {\n		if indeg[i] == 0 {\n			avail = append(avail, i)\n		}\n	}\n	out := []int{}\n	for len(avail) > 0 {\n		sort.Ints(avail)\n		u := avail[0]\n		avail = avail[1:]\n		out = append(out, u)\n		for _, v := range adj[u] {\n			indeg[v]--\n			if indeg[v] == 0 {\n				avail = append(avail, v)\n			}\n		}\n	}\n	if len(out) != numCourses {\n		return []int{}\n	}\n	return out\n}`,
              kotlin: `fun findOrder(numCourses: Int, prerequisites: Array<IntArray>): IntArray {\n    val adj = Array(numCourses) { mutableListOf<Int>() }\n    val indeg = IntArray(numCourses)\n    for (p in prerequisites) {\n        adj[p[1]].add(p[0])\n        indeg[p[0]]++\n    }\n    val avail = java.util.PriorityQueue<Int>()\n    for (i in 0 until numCourses) if (indeg[i] == 0) avail.add(i)\n    val order = mutableListOf<Int>()\n    while (avail.isNotEmpty()) {\n        val u = avail.poll()\n        order.add(u)\n        for (v in adj[u]) {\n            indeg[v]--\n            if (indeg[v] == 0) avail.add(v)\n        }\n    }\n    if (order.size != numCourses) return IntArray(0)\n    return order.toIntArray()\n}`,
              swift: `func findOrder(_ numCourses: Int, _ prerequisites: [[Int]]) -> [Int] {\n    var adj = [[Int]](repeating: [], count: numCourses)\n    var indeg = [Int](repeating: 0, count: numCourses)\n    for p in prerequisites {\n        adj[p[1]].append(p[0])\n        indeg[p[0]] += 1\n    }\n    var avail: [Int] = []\n    for i in 0..<numCourses where indeg[i] == 0 { avail.append(i) }\n    var order: [Int] = []\n    while !avail.isEmpty {\n        avail.sort()\n        let u = avail.removeFirst()\n        order.append(u)\n        for v in adj[u] {\n            indeg[v] -= 1\n            if indeg[v] == 0 { avail.append(v) }\n        }\n    }\n    return order.count == numCourses ? order : []\n}`,
              rust: `fn findOrder(numCourses: i32, prerequisites: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = numCourses as usize;\n    let mut adj: Vec<Vec<usize>> = vec![Vec::new(); n];\n    let mut indeg = vec![0i32; n];\n    for p in prerequisites.iter() {\n        adj[p[1] as usize].push(p[0] as usize);\n        indeg[p[0] as usize] += 1;\n    }\n    let mut avail: Vec<usize> = Vec::new();\n    for i in 0..n {\n        if indeg[i] == 0 {\n            avail.push(i);\n        }\n    }\n    let mut order: Vec<i32> = Vec::new();\n    while !avail.is_empty() {\n        avail.sort();\n        let u = avail.remove(0);\n        order.push(u as i32);\n        for k in 0..adj[u].len() {\n            let v = adj[u][k];\n            indeg[v] -= 1;\n            if indeg[v] == 0 {\n                avail.push(v);\n            }\n        }\n    }\n    if order.len() != n { Vec::new() } else { order }\n}`,
              php: `function findOrder($numCourses, $prerequisites) {\n    $adj = array_fill(0, $numCourses, array());\n    $indeg = array_fill(0, $numCourses, 0);\n    foreach ($prerequisites as $p) {\n        $adj[$p[1]][] = $p[0];\n        $indeg[$p[0]]++;\n    }\n    $avail = array();\n    for ($i = 0; $i < $numCourses; $i++) if ($indeg[$i] === 0) $avail[] = $i;\n    $out = array();\n    while (count($avail) > 0) {\n        sort($avail);\n        $u = array_shift($avail);\n        $out[] = $u;\n        foreach ($adj[$u] as $v) {\n            $indeg[$v]--;\n            if ($indeg[$v] === 0) $avail[] = $v;\n        }\n    }\n    return count($out) === $numCourses ? $out : array();\n}`,
              ruby: `def findOrder(numCourses, prerequisites)\n  adj = Array.new(numCourses) { [] }\n  indeg = Array.new(numCourses, 0)\n  prerequisites.each do |p|\n    adj[p[1]].push(p[0])\n    indeg[p[0]] += 1\n  end\n  avail = []\n  (0...numCourses).each { |i| avail.push(i) if indeg[i] == 0 }\n  out = []\n  while !avail.empty?\n    avail.sort!\n    u = avail.shift\n    out.push(u)\n    adj[u].each do |v|\n      indeg[v] -= 1\n      avail.push(v) if indeg[v] == 0\n    end\n  end\n  out.length == numCourses ? out : []\nend`,
      },
    };
  })(),

  // ── Redundant Connection ────────────────────────────────────────
  (() => {
    const ref = (edges: number[][]) => {
      const n = edges.length;
      const parent = Array.from({ length: n + 1 }, (_, i) => i);
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      for (const [a, b] of edges) {
        const ra = find(a), rb = find(b);
        if (ra === rb) return [a, b];
        parent[ra] = rb;
      }
      return [];
    };
    return {
      slug: "redundant-connection",
      title: "Redundant Connection",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Union Find"],
      signature: { funcName: "findRedundantConnection", params: [{ name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A tree of `n` nodes (labelled `1..n`) had **one extra edge** added, creating exactly one cycle. Given the resulting edge list, return the edge that can be removed to restore a tree. If several answers exist, return the one that **occurs last** in the input.",
        [
          { in: "edges = [[1,2],[1,3],[2,3]]", out: "[2,3]" },
          { in: "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]", out: "[1,4]" },
        ],
        ["3 <= n <= 15", "edges.length == n", "The input is a tree plus one extra edge."]),
      hints: [
        "Union-Find: process edges in order, uniting endpoints.",
        "The first edge whose endpoints are already connected is the answer.",
      ],
      examples: [
        { input: "[[1,2],[1,3],[2,3]]", expectedOutput: "[2,3]" },
        { input: "[[1,2],[2,3],[3,4],[1,4],[1,5]]", expectedOutput: "[1,4]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 15);
        // Random tree: connect each node i (2..n) to a random earlier node.
        const treeEdges: number[][] = [];
        for (let v = 2; v <= n; v++) {
          treeEdges.push([ri(rng, 1, v - 1), v]);
        }
        // One extra edge that isn't already present.
        const present = new Set(treeEdges.map(([a, b]) => `${Math.min(a, b)},${Math.max(a, b)}`));
        let extra: number[] = [];
        for (let attempt = 0; attempt < 100; attempt++) {
          const a = ri(rng, 1, n);
          let b = ri(rng, 1, n);
          if (a === b) b = (b % n) + 1;
          const key = `${Math.min(a, b)},${Math.max(a, b)}`;
          if (a !== b && !present.has(key)) {
            extra = [a, b];
            break;
          }
        }
        if (extra.length === 0) extra = [1, n];
        const edges = shuffle(rng, [...treeEdges, extra]);
        return { input: fmtIntMat(edges), expectedOutput: fmtIntArr(ref(edges)) };
      },
      editorial: explain({
        idea: "A tree on `n` nodes has exactly `n - 1` edges and no cycle. Adding one more edge creates exactly one cycle, and the culprit is the edge that first joins two nodes **already connected**. Union-Find answers \"already connected?\" in near-constant time, so a single pass over the edges finds it.",
        steps: [
          "Start with every node in its own set.",
          "Process the edges in input order. For each, find the representative of both endpoints.",
          "If the representatives differ, the edge joins two separate pieces — unite them and move on.",
          "If they are the **same**, both endpoints were already connected, so this edge closes the cycle: return it.",
          "Exactly one edge triggers this, because the input is a tree plus one edge.",
        ],
        why: "Scanning in order, the structure stays a forest as long as each edge joins distinct components. The first edge whose endpoints already share a component must create a cycle — a path between them already exists. And it is automatically the answer the problem wants: if several edges lie on the cycle, the one appearing latest in the input is precisely the one that closes it, since the earlier ones were still joining separate pieces when they were processed.",
        time: "O(n α(n))",
        space: "O(n)",
        pitfalls: [
          "Nodes are labelled from `1`, so size the parent array `n + 1`.",
          "Compare the **roots**, not the raw labels — two nodes can be connected without pointing at each other.",
          "Return the edge in its original orientation, exactly as it appeared in the input.",
          "Process edges strictly in input order; sorting them destroys the \"occurs last\" guarantee.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findRedundantConnection(edges: List[List[int]]) -> List[int]:\n    n = len(edges)\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return [a, b]\n        parent[ra] = rb\n    return []`,
        javascript: `var findRedundantConnection = function(edges) {\n    const n = edges.length;\n    const parent = [];\n    for (let i = 0; i <= n; i++) parent.push(i);\n    function find(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    for (const e of edges) {\n        const ra = find(e[0]), rb = find(e[1]);\n        if (ra === rb) return [e[0], e[1]];\n        parent[ra] = rb;\n    }\n    return [];\n};`,
              typescript: `function findRedundantConnection(edges: number[][]): number[] {\n    const parent: number[] = [];\n    for (let i = 0; i <= edges.length; i++) parent.push(i);\n    function find(x: number): number {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    for (let i = 0; i < edges.length; i++) {\n        const a = find(edges[i][0]);\n        const b = find(edges[i][1]);\n        if (a === b) return [edges[i][0], edges[i][1]];\n        parent[a] = b;\n    }\n    return [];\n}`,
              java: `public static int[] findRedundantConnection(int[][] edges) {\n    int n = edges.length;\n    int[] parent = new int[n + 1];\n    for (int i = 0; i <= n; i++) parent[i] = i;\n    for (int[] e : edges) {\n        int a = findRoot(parent, e[0]);\n        int b = findRoot(parent, e[1]);\n        if (a == b) return new int[]{e[0], e[1]};\n        parent[a] = b;\n    }\n    return new int[0];\n}\n\nprivate static int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}`,
              cpp: `int findRootRC(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nvector<int> findRedundantConnection(vector<vector<int>>& edges) {\n    int n = (int) edges.size();\n    vector<int> parent(n + 1);\n    for (int i = 0; i <= n; i++) parent[i] = i;\n    for (const auto& e : edges) {\n        int a = findRootRC(parent, e[0]);\n        int b = findRootRC(parent, e[1]);\n        if (a == b) return vector<int>{e[0], e[1]};\n        parent[a] = b;\n    }\n    return vector<int>();\n}`,
              c: `static int findRootRC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint* findRedundantConnection(int** edges, int edgesSize, int* edgesColSize, int* returnSize) {\n    int n = edgesSize;\n    int* parent = (int*) malloc((n + 2) * sizeof(int));\n    for (int i = 0; i <= n + 1; i++) parent[i] = i;\n    int* out = (int*) malloc(2 * sizeof(int));\n    *returnSize = 0;\n    for (int i = 0; i < n; i++) {\n        int a = findRootRC(parent, edges[i][0]);\n        int b = findRootRC(parent, edges[i][1]);\n        if (a == b) {\n            out[0] = edges[i][0];\n            out[1] = edges[i][1];\n            *returnSize = 2;\n            break;\n        }\n        parent[a] = b;\n    }\n    free(parent);\n    return out;\n}`,
              csharp: `public static int[] FindRedundantConnection(int[][] edges)\n{\n    int n = edges.Length;\n    int[] parent = new int[n + 1];\n    for (int i = 0; i <= n; i++) parent[i] = i;\n    foreach (int[] e in edges)\n    {\n        int a = FindRootRC(parent, e[0]);\n        int b = FindRootRC(parent, e[1]);\n        if (a == b) return new int[] { e[0], e[1] };\n        parent[a] = b;\n    }\n    return new int[0];\n}\n\nprivate static int FindRootRC(int[] parent, int x)\n{\n    while (parent[x] != x)\n    {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}`,
              go: `func findRedundantConnection(edges [][]int) []int {\n	n := len(edges)\n	parent := make([]int, n+1)\n	for i := 0; i <= n; i++ {\n		parent[i] = i\n	}\n	var find func(x int) int\n	find = func(x int) int {\n		for parent[x] != x {\n			parent[x] = parent[parent[x]]\n			x = parent[x]\n		}\n		return x\n	}\n	for _, e := range edges {\n		a := find(e[0])\n		b := find(e[1])\n		if a == b {\n			return []int{e[0], e[1]}\n		}\n		parent[a] = b\n	}\n	return []int{}\n}`,
              kotlin: `fun findRedundantConnection(edges: Array<IntArray>): IntArray {\n    val n = edges.size\n    val parent = IntArray(n + 1) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for (e in edges) {\n        val a = find(e[0])\n        val b = find(e[1])\n        if (a == b) return intArrayOf(e[0], e[1])\n        parent[a] = b\n    }\n    return IntArray(0)\n}`,
              swift: `func findRedundantConnection(_ edges: [[Int]]) -> [Int] {\n    let n = edges.count\n    var parent = Array(0...(n + 1))\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for e in edges {\n        let a = find(e[0])\n        let b = find(e[1])\n        if a == b { return [e[0], e[1]] }\n        parent[a] = b\n    }\n    return []\n}`,
              rust: `fn findRedundantConnection(edges: Vec<Vec<i32>>) -> Vec<i32> {\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    let n = edges.len();\n    let mut parent: Vec<usize> = (0..=(n + 1)).collect();\n    for e in edges.iter() {\n        let a = find(&mut parent, e[0] as usize);\n        let b = find(&mut parent, e[1] as usize);\n        if a == b {\n            return vec![e[0], e[1]];\n        }\n        parent[a] = b;\n    }\n    Vec::new()\n}`,
              php: `function findRedundantConnection($edges) {\n    $n = count($edges);\n    $parent = range(0, $n + 1);\n    $out = array();\n    foreach ($edges as $e) {\n        $a = rcFindRoot($parent, $e[0]);\n        $b = rcFindRoot($parent, $e[1]);\n        if ($a === $b) return array($e[0], $e[1]);\n        $parent[$a] = $b;\n    }\n    return $out;\n}\n\nfunction rcFindRoot(&$parent, $x) {\n    while ($parent[$x] !== $x) {\n        $parent[$x] = $parent[$parent[$x]];\n        $x = $parent[$x];\n    }\n    return $x;\n}`,
              ruby: `def findRedundantConnection(edges)\n  n = edges.length\n  parent = (0..(n + 1)).to_a\n  find = lambda do |start|\n    x = start\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  edges.each do |e|\n    a = find.call(e[0])\n    b = find.call(e[1])\n    return [e[0], e[1]] if a == b\n    parent[a] = b\n  end\n  []\nend`,
      },
    };
  })(),

  // ── Network Delay Time ──────────────────────────────────────────
  (() => {
    const ref = (times: number[][], n: number, k: number) => {
      const dist = new Array(n + 1).fill(Infinity);
      dist[k] = 0;
      const done = new Array(n + 1).fill(false);
      for (let iter = 0; iter < n; iter++) {
        let u = -1;
        for (let v = 1; v <= n; v++) {
          if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
        }
        if (u === -1 || dist[u] === Infinity) break;
        done[u] = true;
        for (const [a, b, w] of times) {
          if (a === u && dist[u] + w < dist[b]) dist[b] = dist[u] + w;
        }
      }
      let best = 0;
      for (let v = 1; v <= n; v++) {
        if (dist[v] === Infinity) return -1;
        best = Math.max(best, dist[v]);
      }
      return best;
    };
    return {
      slug: "network-delay-time",
      title: "Network Delay Time",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Shortest Path", "Heap"],
      signature: {
        funcName: "networkDelayTime",
        params: [
          { name: "times", type: "int[][]" as const },
          { name: "n", type: "int" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A network has `n` nodes labelled `1..n`. `times[i] = [u, v, w]` means a signal takes `w` time to travel from `u` to `v` (directed). A signal is sent from node `k`.\n\nReturn the time for **all** nodes to receive it, or `-1` if some node never does.",
        [
          { in: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", out: "2" },
          { in: "times = [[1,2,1]], n = 2, k = 2", out: "-1" },
        ],
        ["1 <= n <= 10", "1 <= times.length <= 30", "1 <= w <= 50"]),
      hints: [
        "Single-source shortest paths — Dijkstra from k.",
        "The answer is the maximum shortest distance; Infinity anywhere means -1.",
      ],
      examples: [
        { input: "[[2,1,1],[2,3,1],[3,4,1]]\n4\n2", expectedOutput: "2" },
        { input: "[[1,2,1]]\n2\n2", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const times = Array.from({ length: ri(rng, 1, 30) }, () => {
          const u = ri(rng, 1, n);
          let v = ri(rng, 1, n);
          if (u === v) v = (v % n) + 1;
          return [u, v, ri(rng, 1, 50)];
        }).filter(([u, v]) => u !== v);
        if (times.length === 0) times.push([1, Math.max(1, n), 1]);
        const k = ri(rng, 1, n);
        return { input: `${fmtIntMat(times)}\n${n}\n${k}`, expectedOutput: String(ref(times, n, k)) };
      },
      editorial: explain({
        idea: "\"When has everyone received the signal?\" is the moment the **last** node receives it — and each node receives it along its shortest path from `k`. So compute single-source shortest paths from `k` and take the maximum. If any node is unreachable, the signal never fully propagates and the answer is `-1`.",
        steps: [
          "Set every distance to infinity except `dist[k] = 0`.",
          "Relax repeatedly: for each edge `u -> v` with weight `w`, if `dist[u] + w < dist[v]`, improve `dist[v]`.",
          "Repeat up to `n - 1` rounds, stopping early if a full round changes nothing.",
          "Scan all `n` nodes: if any is still infinite, return `-1`.",
          "Otherwise return the largest distance.",
        ],
        why: "A shortest path in a graph with `n` nodes visits at most `n - 1` edges, so `n - 1` rounds of relaxing every edge is enough for the correct distance to propagate outward one hop per round — this is Bellman-Ford. All weights are positive, so no negative cycles can distort it, and Dijkstra with a min-heap computes the same distances faster. The maximum is right because the signal reaches every node in parallel, so total time is set by the slowest arrival.",
        time: "O(V · E) with Bellman-Ford, O(E log V) with Dijkstra",
        space: "O(V)",
        pitfalls: [
          "Nodes are labelled `1..n`, so size the distance array `n + 1` and scan from `1`.",
          "Guard against relaxing from an unreachable node — adding a weight to \"infinity\" and storing it produces bogus finite distances.",
          "The answer is the **maximum** of the shortest distances, not their sum.",
          "The edges are directed; do not add the reverse.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport heapq\nfrom collections import defaultdict\n\ndef networkDelayTime(times: List[List[int]], n: int, k: int) -> int:\n    adj = defaultdict(list)\n    for u, v, w in times:\n        adj[u].append((v, w))\n    dist = {}\n    heap = [(0, k)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if u in dist:\n            continue\n        dist[u] = d\n        for v, w in adj[u]:\n            if v not in dist:\n                heapq.heappush(heap, (d + w, v))\n    if len(dist) != n:\n        return -1\n    return max(dist.values())`,
        javascript: `var networkDelayTime = function(times, n, k) {\n    const dist = new Array(n + 1).fill(Infinity);\n    dist[k] = 0;\n    const done = new Array(n + 1).fill(false);\n    for (let iter = 0; iter < n; iter++) {\n        let u = -1;\n        for (let v = 1; v <= n; v++) {\n            if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;\n        }\n        if (u === -1 || dist[u] === Infinity) break;\n        done[u] = true;\n        for (const t of times) {\n            if (t[0] === u && dist[u] + t[2] < dist[t[1]]) dist[t[1]] = dist[u] + t[2];\n        }\n    }\n    let best = 0;\n    for (let v = 1; v <= n; v++) {\n        if (dist[v] === Infinity) return -1;\n        best = Math.max(best, dist[v]);\n    }\n    return best;\n};`,
              typescript: `function networkDelayTime(times: number[][], n: number, k: number): number {\n    const INF = 1000000000;\n    const dist: number[] = [];\n    for (let i = 0; i <= n; i++) dist.push(INF);\n    dist[k] = 0;\n    for (let round = 0; round < n; round++) {\n        let changed = false;\n        for (let i = 0; i < times.length; i++) {\n            const u = times[i][0];\n            const v = times[i][1];\n            const w = times[i][2];\n            if (dist[u] !== INF && dist[u] + w < dist[v]) {\n                dist[v] = dist[u] + w;\n                changed = true;\n            }\n        }\n        if (!changed) break;\n    }\n    let worst = 0;\n    for (let i = 1; i <= n; i++) {\n        if (dist[i] === INF) return -1;\n        if (dist[i] > worst) worst = dist[i];\n    }\n    return worst;\n}`,
              java: `public static int networkDelayTime(int[][] times, int n, int k) {\n    final int INF = 1000000000;\n    int[] dist = new int[n + 1];\n    Arrays.fill(dist, INF);\n    dist[k] = 0;\n    for (int round = 0; round < n; round++) {\n        boolean changed = false;\n        for (int[] t : times) {\n            if (dist[t[0]] != INF && dist[t[0]] + t[2] < dist[t[1]]) {\n                dist[t[1]] = dist[t[0]] + t[2];\n                changed = true;\n            }\n        }\n        if (!changed) break;\n    }\n    int worst = 0;\n    for (int i = 1; i <= n; i++) {\n        if (dist[i] == INF) return -1;\n        if (dist[i] > worst) worst = dist[i];\n    }\n    return worst;\n}`,
              cpp: `int networkDelayTime(vector<vector<int>>& times, int n, int k) {\n    const int INF = 1000000000;\n    vector<int> dist(n + 1, INF);\n    dist[k] = 0;\n    for (int round = 0; round < n; round++) {\n        bool changed = false;\n        for (const auto& t : times) {\n            if (dist[t[0]] != INF && dist[t[0]] + t[2] < dist[t[1]]) {\n                dist[t[1]] = dist[t[0]] + t[2];\n                changed = true;\n            }\n        }\n        if (!changed) break;\n    }\n    int worst = 0;\n    for (int i = 1; i <= n; i++) {\n        if (dist[i] == INF) return -1;\n        if (dist[i] > worst) worst = dist[i];\n    }\n    return worst;\n}`,
              c: `int networkDelayTime(int** times, int timesSize, int* timesColSize, int n, int k) {\n    const int INF = 1000000000;\n    int* dist = (int*) malloc((n + 2) * sizeof(int));\n    for (int i = 0; i <= n + 1; i++) dist[i] = INF;\n    dist[k] = 0;\n    for (int round = 0; round < n; round++) {\n        int changed = 0;\n        for (int i = 0; i < timesSize; i++) {\n            int u = times[i][0];\n            int v = times[i][1];\n            int w = times[i][2];\n            if (dist[u] != INF && dist[u] + w < dist[v]) {\n                dist[v] = dist[u] + w;\n                changed = 1;\n            }\n        }\n        if (!changed) break;\n    }\n    int worst = 0;\n    int ans = 0;\n    for (int i = 1; i <= n; i++) {\n        if (dist[i] == INF) {\n            ans = -1;\n            break;\n        }\n        if (dist[i] > worst) worst = dist[i];\n    }\n    if (ans == 0) ans = worst;\n    free(dist);\n    return ans;\n}`,
              csharp: `public static int NetworkDelayTime(int[][] times, int n, int k)\n{\n    const int INF = 1000000000;\n    int[] dist = new int[n + 1];\n    for (int i = 0; i <= n; i++) dist[i] = INF;\n    dist[k] = 0;\n    for (int round = 0; round < n; round++)\n    {\n        bool changed = false;\n        foreach (int[] t in times)\n        {\n            if (dist[t[0]] != INF && dist[t[0]] + t[2] < dist[t[1]])\n            {\n                dist[t[1]] = dist[t[0]] + t[2];\n                changed = true;\n            }\n        }\n        if (!changed) break;\n    }\n    int worst = 0;\n    for (int i = 1; i <= n; i++)\n    {\n        if (dist[i] == INF) return -1;\n        if (dist[i] > worst) worst = dist[i];\n    }\n    return worst;\n}`,
              go: `func networkDelayTime(times [][]int, n int, k int) int {\n	const INF = 1000000000\n	dist := make([]int, n+1)\n	for i := range dist {\n		dist[i] = INF\n	}\n	dist[k] = 0\n	for round := 0; round < n; round++ {\n		changed := false\n		for _, t := range times {\n			if dist[t[0]] != INF && dist[t[0]]+t[2] < dist[t[1]] {\n				dist[t[1]] = dist[t[0]] + t[2]\n				changed = true\n			}\n		}\n		if !changed {\n			break\n		}\n	}\n	worst := 0\n	for i := 1; i <= n; i++ {\n		if dist[i] == INF {\n			return -1\n		}\n		if dist[i] > worst {\n			worst = dist[i]\n		}\n	}\n	return worst\n}`,
              kotlin: `fun networkDelayTime(times: Array<IntArray>, n: Int, k: Int): Int {\n    val INF = 1000000000\n    val dist = IntArray(n + 1) { INF }\n    dist[k] = 0\n    for (round in 0 until n) {\n        var changed = false\n        for (t in times) {\n            if (dist[t[0]] != INF && dist[t[0]] + t[2] < dist[t[1]]) {\n                dist[t[1]] = dist[t[0]] + t[2]\n                changed = true\n            }\n        }\n        if (!changed) break\n    }\n    var worst = 0\n    for (i in 1..n) {\n        if (dist[i] == INF) return -1\n        if (dist[i] > worst) worst = dist[i]\n    }\n    return worst\n}`,
              swift: `func networkDelayTime(_ times: [[Int]], _ n: Int, _ k: Int) -> Int {\n    let INF = 1000000000\n    var dist = [Int](repeating: INF, count: n + 1)\n    dist[k] = 0\n    for _ in 0..<n {\n        var changed = false\n        for t in times {\n            if dist[t[0]] != INF && dist[t[0]] + t[2] < dist[t[1]] {\n                dist[t[1]] = dist[t[0]] + t[2]\n                changed = true\n            }\n        }\n        if !changed { break }\n    }\n    var worst = 0\n    for i in 1...max(n, 1) {\n        if i > n { break }\n        if dist[i] == INF { return -1 }\n        if dist[i] > worst { worst = dist[i] }\n    }\n    return worst\n}`,
              rust: `fn networkDelayTime(times: Vec<Vec<i32>>, n: i32, k: i32) -> i32 {\n    let inf = 1000000000;\n    let mut dist = vec![inf; (n + 1) as usize];\n    dist[k as usize] = 0;\n    for _ in 0..n {\n        let mut changed = false;\n        for t in times.iter() {\n            let u = t[0] as usize;\n            let v = t[1] as usize;\n            if dist[u] != inf && dist[u] + t[2] < dist[v] {\n                dist[v] = dist[u] + t[2];\n                changed = true;\n            }\n        }\n        if !changed {\n            break;\n        }\n    }\n    let mut worst = 0;\n    for i in 1..=n {\n        let d = dist[i as usize];\n        if d == inf {\n            return -1;\n        }\n        if d > worst {\n            worst = d;\n        }\n    }\n    worst\n}`,
              php: `function networkDelayTime($times, $n, $k) {\n    $INF = 1000000000;\n    $dist = array_fill(0, $n + 1, $INF);\n    $dist[$k] = 0;\n    for ($round = 0; $round < $n; $round++) {\n        $changed = false;\n        foreach ($times as $t) {\n            if ($dist[$t[0]] !== $INF && $dist[$t[0]] + $t[2] < $dist[$t[1]]) {\n                $dist[$t[1]] = $dist[$t[0]] + $t[2];\n                $changed = true;\n            }\n        }\n        if (!$changed) break;\n    }\n    $worst = 0;\n    for ($i = 1; $i <= $n; $i++) {\n        if ($dist[$i] === $INF) return -1;\n        if ($dist[$i] > $worst) $worst = $dist[$i];\n    }\n    return $worst;\n}`,
              ruby: `def networkDelayTime(times, n, k)\n  inf = 1000000000\n  dist = Array.new(n + 1, inf)\n  dist[k] = 0\n  n.times do\n    changed = false\n    times.each do |t|\n      if dist[t[0]] != inf && dist[t[0]] + t[2] < dist[t[1]]\n        dist[t[1]] = dist[t[0]] + t[2]\n        changed = true\n      end\n    end\n    break unless changed\n  end\n  worst = 0\n  (1..n).each do |i|\n    return -1 if dist[i] == inf\n    worst = dist[i] if dist[i] > worst\n  end\n  worst\nend`,
      },
    };
  })(),

  // ── Cheapest Flights Within K Stops ─────────────────────────────
  (() => {
    const ref = (n: number, flights: number[][], src: number, dst: number, k: number) => {
      let dist = new Array(n).fill(Infinity);
      dist[src] = 0;
      for (let round = 0; round <= k; round++) {
        const next = [...dist];
        for (const [u, v, w] of flights) {
          if (dist[u] + w < next[v]) next[v] = dist[u] + w;
        }
        dist = next;
      }
      return dist[dst] === Infinity ? -1 : dist[dst];
    };
    return {
      slug: "cheapest-flights-within-k-stops",
      title: "Cheapest Flights Within K Stops",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Dynamic Programming", "Shortest Path"],
      signature: {
        funcName: "findCheapestPrice",
        params: [
          { name: "n", type: "int" as const },
          { name: "flights", type: "int[][]" as const },
          { name: "src", type: "int" as const },
          { name: "dst", type: "int" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` cities and directed `flights[i] = [from, to, price]`. Find the **cheapest price** from `src` to `dst` using **at most `k` stops** (intermediate cities). Return `-1` if no such route exists.",
        [
          { in: "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1", out: "700" },
          { in: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1", out: "200" },
          { in: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0", out: "500" },
        ],
        ["2 <= n <= 10", "0 <= flights.length <= 30", "1 <= price <= 500", "0 <= k < n"]),
      hints: [
        "Bellman-Ford limited to k+1 edge-relaxation rounds.",
        "Relax from a SNAPSHOT of distances each round so paths can't use extra edges.",
      ],
      examples: [
        { input: "4\n[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]\n0\n3\n1", expectedOutput: "700" },
        { input: "3\n[[0,1,100],[1,2,100],[0,2,500]]\n0\n2\n1", expectedOutput: "200" },
        { input: "3\n[[0,1,100],[1,2,100],[0,2,500]]\n0\n2\n0", expectedOutput: "500" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 10);
        const flights = Array.from({ length: ri(rng, 0, 30) }, () => {
          const u = ri(rng, 0, n - 1);
          let v = ri(rng, 0, n - 1);
          if (u === v) v = (v + 1) % n;
          return [u, v, ri(rng, 1, 500)];
        }).filter(([u, v]) => u !== v);
        const src = ri(rng, 0, n - 1);
        let dst = ri(rng, 0, n - 1);
        if (dst === src) dst = (dst + 1) % n;
        const k = ri(rng, 0, n - 1);
        return {
          input: `${n}\n${fmtIntMat(flights)}\n${src}\n${dst}\n${k}`,
          expectedOutput: String(ref(n, flights, src, dst, k)),
        };
      },
      editorial: explain({
        idea: "Plain Dijkstra fails here because the cheapest route may use too many hops — cost alone is not enough state, the **number of edges** matters too. Bellman-Ford fits perfectly: each relaxation round extends every route by exactly one more edge, so running `k + 1` rounds explores precisely the routes with at most `k` stops.",
        steps: [
          "Set every distance to infinity except `dist[src] = 0`.",
          "Repeat `k + 1` times — `k` stops means at most `k + 1` flights.",
          "At the start of each round take a **snapshot** of the distances.",
          "Relax every flight against the *snapshot*: `dist[to] = min(dist[to], snapshot[from] + price)`.",
          "After the rounds, return `dist[dst]`, or `-1` if it is still infinite.",
        ],
        why: "The snapshot is the crux. After round `r`, `dist[v]` is the cheapest route to `v` using at most `r` flights — relaxing against the snapshot means a route built this round can only extend a route that already existed at the end of the previous round, so it grows by exactly one edge. Relaxing against the live array would let a route grow by several edges within one round and quietly exceed the stop limit while looking cheaper.",
        time: "O(k · E)",
        space: "O(V)",
        pitfalls: [
          "Relaxing in place instead of from a snapshot is *the* bug in this problem: it produces answers that are too cheap because they use more stops than allowed.",
          "`k` counts intermediate stops, so the number of flights is `k + 1` — run one more round than you might expect.",
          "Skip relaxation from a node still at infinity.",
          "Unreachable within the limit must return `-1`, even if a longer route exists.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findCheapestPrice(n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:\n    INF = float("inf")\n    dist = [INF] * n\n    dist[src] = 0\n    for _ in range(k + 1):\n        nxt = dist[:]\n        for u, v, w in flights:\n            if dist[u] + w < nxt[v]:\n                nxt[v] = dist[u] + w\n        dist = nxt\n    return -1 if dist[dst] == INF else dist[dst]`,
        javascript: `var findCheapestPrice = function(n, flights, src, dst, k) {\n    let dist = new Array(n).fill(Infinity);\n    dist[src] = 0;\n    for (let round = 0; round <= k; round++) {\n        const next = dist.slice();\n        for (const f of flights) {\n            if (dist[f[0]] + f[2] < next[f[1]]) next[f[1]] = dist[f[0]] + f[2];\n        }\n        dist = next;\n    }\n    return dist[dst] === Infinity ? -1 : dist[dst];\n};`,
              typescript: `function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {\n    const INF = 1000000000;\n    const dist: number[] = [];\n    for (let i = 0; i < n; i++) dist.push(INF);\n    dist[src] = 0;\n    for (let round = 0; round <= k; round++) {\n        const snapshot = dist.slice();\n        for (let i = 0; i < flights.length; i++) {\n            const u = flights[i][0];\n            const v = flights[i][1];\n            const w = flights[i][2];\n            if (snapshot[u] !== INF && snapshot[u] + w < dist[v]) {\n                dist[v] = snapshot[u] + w;\n            }\n        }\n    }\n    return dist[dst] === INF ? -1 : dist[dst];\n}`,
              java: `public static int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {\n    final int INF = 1000000000;\n    int[] dist = new int[n];\n    Arrays.fill(dist, INF);\n    dist[src] = 0;\n    for (int round = 0; round <= k; round++) {\n        int[] snapshot = dist.clone();\n        for (int[] f : flights) {\n            if (snapshot[f[0]] != INF && snapshot[f[0]] + f[2] < dist[f[1]]) {\n                dist[f[1]] = snapshot[f[0]] + f[2];\n            }\n        }\n    }\n    return dist[dst] == INF ? -1 : dist[dst];\n}`,
              cpp: `int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {\n    const int INF = 1000000000;\n    vector<int> dist(n, INF);\n    dist[src] = 0;\n    for (int round = 0; round <= k; round++) {\n        vector<int> snapshot = dist;\n        for (const auto& f : flights) {\n            if (snapshot[f[0]] != INF && snapshot[f[0]] + f[2] < dist[f[1]]) {\n                dist[f[1]] = snapshot[f[0]] + f[2];\n            }\n        }\n    }\n    return dist[dst] == INF ? -1 : dist[dst];\n}`,
              c: `int findCheapestPrice(int n, int** flights, int flightsSize, int* flightsColSize, int src, int dst, int k) {\n    const int INF = 1000000000;\n    int* dist = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int* snapshot = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) dist[i] = INF;\n    dist[src] = 0;\n    for (int round = 0; round <= k; round++) {\n        for (int i = 0; i < n; i++) snapshot[i] = dist[i];\n        for (int i = 0; i < flightsSize; i++) {\n            int u = flights[i][0];\n            int v = flights[i][1];\n            int w = flights[i][2];\n            if (snapshot[u] != INF && snapshot[u] + w < dist[v]) {\n                dist[v] = snapshot[u] + w;\n            }\n        }\n    }\n    int ans = (dist[dst] == INF) ? -1 : dist[dst];\n    free(dist);\n    free(snapshot);\n    return ans;\n}`,
              csharp: `public static int FindCheapestPrice(int n, int[][] flights, int src, int dst, int k)\n{\n    const int INF = 1000000000;\n    int[] dist = new int[n];\n    for (int i = 0; i < n; i++) dist[i] = INF;\n    dist[src] = 0;\n    for (int round = 0; round <= k; round++)\n    {\n        int[] snapshot = (int[]) dist.Clone();\n        foreach (int[] f in flights)\n        {\n            if (snapshot[f[0]] != INF && snapshot[f[0]] + f[2] < dist[f[1]])\n            {\n                dist[f[1]] = snapshot[f[0]] + f[2];\n            }\n        }\n    }\n    return dist[dst] == INF ? -1 : dist[dst];\n}`,
              go: `func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {\n	const INF = 1000000000\n	dist := make([]int, n)\n	for i := range dist {\n		dist[i] = INF\n	}\n	dist[src] = 0\n	for round := 0; round <= k; round++ {\n		snapshot := append([]int{}, dist...)\n		for _, f := range flights {\n			if snapshot[f[0]] != INF && snapshot[f[0]]+f[2] < dist[f[1]] {\n				dist[f[1]] = snapshot[f[0]] + f[2]\n			}\n		}\n	}\n	if dist[dst] == INF {\n		return -1\n	}\n	return dist[dst]\n}`,
              kotlin: `fun findCheapestPrice(n: Int, flights: Array<IntArray>, src: Int, dst: Int, k: Int): Int {\n    val INF = 1000000000\n    val dist = IntArray(n) { INF }\n    dist[src] = 0\n    for (round in 0..k) {\n        val snapshot = dist.copyOf()\n        for (f in flights) {\n            if (snapshot[f[0]] != INF && snapshot[f[0]] + f[2] < dist[f[1]]) {\n                dist[f[1]] = snapshot[f[0]] + f[2]\n            }\n        }\n    }\n    return if (dist[dst] == INF) -1 else dist[dst]\n}`,
              swift: `func findCheapestPrice(_ n: Int, _ flights: [[Int]], _ src: Int, _ dst: Int, _ k: Int) -> Int {\n    let INF = 1000000000\n    var dist = [Int](repeating: INF, count: n)\n    dist[src] = 0\n    for _ in 0...k {\n        let snapshot = dist\n        for f in flights {\n            if snapshot[f[0]] != INF && snapshot[f[0]] + f[2] < dist[f[1]] {\n                dist[f[1]] = snapshot[f[0]] + f[2]\n            }\n        }\n    }\n    return dist[dst] == INF ? -1 : dist[dst]\n}`,
              rust: `fn findCheapestPrice(n: i32, flights: Vec<Vec<i32>>, src: i32, dst: i32, k: i32) -> i32 {\n    let inf = 1000000000;\n    let mut dist = vec![inf; n as usize];\n    dist[src as usize] = 0;\n    for _ in 0..=k {\n        let snapshot = dist.clone();\n        for f in flights.iter() {\n            let u = f[0] as usize;\n            let v = f[1] as usize;\n            if snapshot[u] != inf && snapshot[u] + f[2] < dist[v] {\n                dist[v] = snapshot[u] + f[2];\n            }\n        }\n    }\n    if dist[dst as usize] == inf { -1 } else { dist[dst as usize] }\n}`,
              php: `function findCheapestPrice($n, $flights, $src, $dst, $k) {\n    $INF = 1000000000;\n    $dist = array_fill(0, $n, $INF);\n    $dist[$src] = 0;\n    for ($round = 0; $round <= $k; $round++) {\n        $snapshot = $dist;\n        foreach ($flights as $f) {\n            if ($snapshot[$f[0]] !== $INF && $snapshot[$f[0]] + $f[2] < $dist[$f[1]]) {\n                $dist[$f[1]] = $snapshot[$f[0]] + $f[2];\n            }\n        }\n    }\n    return $dist[$dst] === $INF ? -1 : $dist[$dst];\n}`,
              ruby: `def findCheapestPrice(n, flights, src, dst, k)\n  inf = 1000000000\n  dist = Array.new(n, inf)\n  dist[src] = 0\n  (0..k).each do\n    snapshot = dist.dup\n    flights.each do |f|\n      if snapshot[f[0]] != inf && snapshot[f[0]] + f[2] < dist[f[1]]\n        dist[f[1]] = snapshot[f[0]] + f[2]\n      end\n    end\n  end\n  dist[dst] == inf ? -1 : dist[dst]\nend`,
      },
    };
  })(),

  // ── Min Cost to Connect All Points ──────────────────────────────
  (() => {
    const ref = (points: number[][]) => {
      const n = points.length;
      if (n <= 1) return 0;
      const inTree = new Array(n).fill(false);
      const minDist = new Array(n).fill(Infinity);
      minDist[0] = 0;
      let total = 0;
      for (let iter = 0; iter < n; iter++) {
        let u = -1;
        for (let v = 0; v < n; v++) {
          if (!inTree[v] && (u === -1 || minDist[v] < minDist[u])) u = v;
        }
        inTree[u] = true;
        total += minDist[u];
        for (let v = 0; v < n; v++) {
          if (!inTree[v]) {
            const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
            if (d < minDist[v]) minDist[v] = d;
          }
        }
      }
      return total;
    };
    return {
      slug: "min-cost-to-connect-all-points",
      title: "Min Cost to Connect All Points",
      difficulty: "MEDIUM" as const,
      tags: ["Graph", "Minimum Spanning Tree", "Union Find"],
      signature: { funcName: "minCostConnectPoints", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given 2D `points`. The cost of connecting two points is their **Manhattan distance** `|x1-x2| + |y1-y2|`.\n\nReturn the minimum total cost to make **all points connected** (exactly one simple path between every pair).",
        [
          { in: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]", out: "20" },
          { in: "points = [[3,12],[-2,5],[-4,1]]", out: "18" },
        ],
        ["1 <= points.length <= 10", "-100 <= coordinates <= 100"]),
      hints: [
        "This is a Minimum Spanning Tree on the complete graph of points.",
        "Prim's algorithm with an array of best-known distances is O(n²) — plenty here.",
      ],
      examples: [
        { input: "[[0,0],[2,2],[3,10],[5,2],[7,0]]", expectedOutput: "20" },
        { input: "[[3,12],[-2,5],[-4,1]]", expectedOutput: "18" },
      ],
      gen: (rng: Rng) => {
        const points = Array.from({ length: ri(rng, 1, 10) }, () => [ri(rng, -100, 100), ri(rng, -100, 100)]);
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      editorial: explain({
        idea: "Connecting all points with exactly one path between every pair means building a **spanning tree**, and \"minimum total cost\" makes it a Minimum Spanning Tree. Every pair of points is joinable, so the graph is complete — which makes Prim's algorithm with a simple array of best-known distances the natural fit at `O(n^2)`, with no edge list to build.",
        steps: [
          "Keep `inTree[v]` and `minDist[v]`, the cheapest known edge from the growing tree to `v`. Start with `minDist[0] = 0` and everything else infinite.",
          "Repeat `n` times: pick the point not yet in the tree with the smallest `minDist`.",
          "Add it to the tree and add its `minDist` to the running total.",
          "For every point still outside, recompute its Manhattan distance to the newly added point and keep it if it beats the current `minDist`.",
          "After `n` rounds every point is connected and the total is the MST cost.",
        ],
        why: "Prim's rests on the cut property: for any split of the points into \"in the tree\" and \"not yet\", the cheapest edge crossing that split belongs to some MST. Each round picks exactly that edge — `minDist` holds, for every outside point, the cost of the cheapest edge to the tree, so its minimum is the cheapest crossing edge. Growing the tree one safe edge at a time yields an MST after `n - 1` additions; the seed contributes `0`.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "A single point costs `0` — guard the trivial case so the loop does not add an infinite `minDist`.",
          "Update `minDist` **only** for points outside the tree; touching those already inside can corrupt the running minimum.",
          "The metric is Manhattan (`|dx| + |dy|`), not Euclidean.",
          "The seed's `minDist` must be `0`, otherwise the total is off by the first edge.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef minCostConnectPoints(points: List[List[int]]) -> int:\n    n = len(points)\n    if n <= 1:\n        return 0\n    INF = float("inf")\n    in_tree = [False] * n\n    min_dist = [INF] * n\n    min_dist[0] = 0\n    total = 0\n    for _ in range(n):\n        u = -1\n        for v in range(n):\n            if not in_tree[v] and (u == -1 or min_dist[v] < min_dist[u]):\n                u = v\n        in_tree[u] = True\n        total += min_dist[u]\n        for v in range(n):\n            if not in_tree[v]:\n                d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])\n                if d < min_dist[v]:\n                    min_dist[v] = d\n    return total`,
        javascript: `var minCostConnectPoints = function(points) {\n    const n = points.length;\n    if (n <= 1) return 0;\n    const inTree = new Array(n).fill(false);\n    const minDist = new Array(n).fill(Infinity);\n    minDist[0] = 0;\n    let total = 0;\n    for (let iter = 0; iter < n; iter++) {\n        let u = -1;\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v] && (u === -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n};`,
              typescript: `function minCostConnectPoints(points: number[][]): number {\n    const n = points.length;\n    if (n <= 1) return 0;\n    const INF = 1000000000;\n    const inTree: boolean[] = [];\n    const minDist: number[] = [];\n    for (let i = 0; i < n; i++) {\n        inTree.push(false);\n        minDist.push(INF);\n    }\n    minDist[0] = 0;\n    let total = 0;\n    for (let iter = 0; iter < n; iter++) {\n        let u = -1;\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v] && (u === -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n}`,
              java: `public static int minCostConnectPoints(int[][] points) {\n    int n = points.length;\n    if (n <= 1) return 0;\n    final int INF = 1000000000;\n    boolean[] inTree = new boolean[n];\n    int[] minDist = new int[n];\n    Arrays.fill(minDist, INF);\n    minDist[0] = 0;\n    int total = 0;\n    for (int iter = 0; iter < n; iter++) {\n        int u = -1;\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n}`,
              cpp: `int minCostConnectPoints(vector<vector<int>>& points) {\n    int n = (int) points.size();\n    if (n <= 1) return 0;\n    const int INF = 1000000000;\n    vector<bool> inTree(n, false);\n    vector<int> minDist(n, INF);\n    minDist[0] = 0;\n    int total = 0;\n    for (int iter = 0; iter < n; iter++) {\n        int u = -1;\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                int d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n}`,
              c: `int minCostConnectPoints(int** points, int pointsSize, int* pointsColSize) {\n    int n = pointsSize;\n    if (n <= 1) return 0;\n    const int INF = 1000000000;\n    int* inTree = (int*) calloc(n, sizeof(int));\n    int* minDist = (int*) malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) minDist[i] = INF;\n    minDist[0] = 0;\n    int total = 0;\n    for (int iter = 0; iter < n; iter++) {\n        int u = -1;\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = 1;\n        total += minDist[u];\n        for (int v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                int dx = points[u][0] - points[v][0];\n                int dy = points[u][1] - points[v][1];\n                if (dx < 0) dx = -dx;\n                if (dy < 0) dy = -dy;\n                int d = dx + dy;\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    free(inTree);\n    free(minDist);\n    return total;\n}`,
              csharp: `public static int MinCostConnectPoints(int[][] points)\n{\n    int n = points.Length;\n    if (n <= 1) return 0;\n    const int INF = 1000000000;\n    bool[] inTree = new bool[n];\n    int[] minDist = new int[n];\n    for (int i = 0; i < n; i++) minDist[i] = INF;\n    minDist[0] = 0;\n    int total = 0;\n    for (int iter = 0; iter < n; iter++)\n    {\n        int u = -1;\n        for (int v = 0; v < n; v++)\n        {\n            if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (int v = 0; v < n; v++)\n        {\n            if (!inTree[v])\n            {\n                int d = Math.Abs(points[u][0] - points[v][0]) + Math.Abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n}`,
              go: `func minCostConnectPoints(points [][]int) int {\n	n := len(points)\n	if n <= 1 {\n		return 0\n	}\n	const INF = 1000000000\n	inTree := make([]bool, n)\n	minDist := make([]int, n)\n	for i := range minDist {\n		minDist[i] = INF\n	}\n	minDist[0] = 0\n	total := 0\n	for iter := 0; iter < n; iter++ {\n		u := -1\n		for v := 0; v < n; v++ {\n			if !inTree[v] && (u == -1 || minDist[v] < minDist[u]) {\n				u = v\n			}\n		}\n		inTree[u] = true\n		total += minDist[u]\n		for v := 0; v < n; v++ {\n			if !inTree[v] {\n				dx := points[u][0] - points[v][0]\n				dy := points[u][1] - points[v][1]\n				if dx < 0 {\n					dx = -dx\n				}\n				if dy < 0 {\n					dy = -dy\n				}\n				if dx+dy < minDist[v] {\n					minDist[v] = dx + dy\n				}\n			}\n		}\n	}\n	return total\n}`,
              kotlin: `fun minCostConnectPoints(points: Array<IntArray>): Int {\n    val n = points.size\n    if (n <= 1) return 0\n    val INF = 1000000000\n    val inTree = BooleanArray(n)\n    val minDist = IntArray(n) { INF }\n    minDist[0] = 0\n    var total = 0\n    for (iter in 0 until n) {\n        var u = -1\n        for (v in 0 until n) {\n            if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v\n        }\n        inTree[u] = true\n        total += minDist[u]\n        for (v in 0 until n) {\n            if (!inTree[v]) {\n                val d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1])\n                if (d < minDist[v]) minDist[v] = d\n            }\n        }\n    }\n    return total\n}`,
              swift: `func minCostConnectPoints(_ points: [[Int]]) -> Int {\n    let n = points.count\n    if n <= 1 { return 0 }\n    let INF = 1000000000\n    var inTree = [Bool](repeating: false, count: n)\n    var minDist = [Int](repeating: INF, count: n)\n    minDist[0] = 0\n    var total = 0\n    for _ in 0..<n {\n        var u = -1\n        for v in 0..<n {\n            if !inTree[v] && (u == -1 || minDist[v] < minDist[u]) { u = v }\n        }\n        inTree[u] = true\n        total += minDist[u]\n        for v in 0..<n {\n            if !inTree[v] {\n                let d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])\n                if d < minDist[v] { minDist[v] = d }\n            }\n        }\n    }\n    return total\n}`,

        rust: `fn minCostConnectPoints(points: Vec<Vec<i32>>) -> i32 {\n    let n = points.len();\n    if n <= 1 {\n        return 0;\n    }\n    let inf = 1000000000;\n    let mut in_tree = vec![false; n];\n    let mut min_dist = vec![inf; n];\n    min_dist[0] = 0;\n    let mut total = 0;\n    for _ in 0..n {\n        // \`n\` is an out-of-range index, used here as "nothing picked yet".\n        let mut u = n;\n        for v in 0..n {\n            if !in_tree[v] && (u == n || min_dist[v] < min_dist[u]) {\n                u = v;\n            }\n        }\n        in_tree[u] = true;\n        total += min_dist[u];\n        for v in 0..n {\n            if !in_tree[v] {\n                let d = (points[u][0] - points[v][0]).abs() + (points[u][1] - points[v][1]).abs();\n                if d < min_dist[v] {\n                    min_dist[v] = d;\n                }\n            }\n        }\n    }\n    total\n}`,
              php: `function minCostConnectPoints($points) {\n    $n = count($points);\n    if ($n <= 1) return 0;\n    $INF = 1000000000;\n    $inTree = array_fill(0, $n, false);\n    $minDist = array_fill(0, $n, $INF);\n    $minDist[0] = 0;\n    $total = 0;\n    for ($iter = 0; $iter < $n; $iter++) {\n        $u = -1;\n        for ($v = 0; $v < $n; $v++) {\n            if (!$inTree[$v] && ($u === -1 || $minDist[$v] < $minDist[$u])) $u = $v;\n        }\n        $inTree[$u] = true;\n        $total += $minDist[$u];\n        for ($v = 0; $v < $n; $v++) {\n            if (!$inTree[$v]) {\n                $d = abs($points[$u][0] - $points[$v][0]) + abs($points[$u][1] - $points[$v][1]);\n                if ($d < $minDist[$v]) $minDist[$v] = $d;\n            }\n        }\n    }\n    return $total;\n}`,
              ruby: `def minCostConnectPoints(points)\n  n = points.length\n  return 0 if n <= 1\n  inf = 1000000000\n  in_tree = Array.new(n, false)\n  min_dist = Array.new(n, inf)\n  min_dist[0] = 0\n  total = 0\n  n.times do\n    u = -1\n    (0...n).each do |v|\n      u = v if !in_tree[v] && (u == -1 || min_dist[v] < min_dist[u])\n    end\n    in_tree[u] = true\n    total += min_dist[u]\n    (0...n).each do |v|\n      unless in_tree[v]\n        d = (points[u][0] - points[v][0]).abs + (points[u][1] - points[v][1]).abs\n        min_dist[v] = d if d < min_dist[v]\n      end\n    end\n  end\n  total\nend`,
      },
    };
  })(),

];
