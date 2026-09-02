/** Graphs — hand-authored classics via edge lists / adjacency matrices (int[][]).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtIntMat, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      solutions: {
        python: `from typing import List\n\ndef findCenter(edges: List[List[int]]) -> int:\n    a, b = edges[0]\n    return a if a in edges[1] else b`,
        javascript: `var findCenter = function(edges) {\n    const a = edges[0][0], b = edges[0][1];\n    return (a === edges[1][0] || a === edges[1][1]) ? a : b;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findJudge(n: int, trust: List[List[int]]) -> int:\n    score = [0] * (n + 1)\n    for a, b in trust:\n        score[a] -= 1\n        score[b] += 1\n    for i in range(1, n + 1):\n        if score[i] == n - 1:\n            return i\n    return -1`,
        javascript: `var findJudge = function(n, trust) {\n    const score = new Array(n + 1).fill(0);\n    for (const t of trust) {\n        score[t[0]]--;\n        score[t[1]]++;\n    }\n    for (let i = 1; i <= n; i++) {\n        if (score[i] === n - 1) return i;\n    }\n    return -1;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findCircleNum(isConnected: List[List[int]]) -> int:\n    n = len(isConnected)\n    seen = [False] * n\n\n    def dfs(i):\n        seen[i] = True\n        for j in range(n):\n            if isConnected[i][j] == 1 and not seen[j]:\n                dfs(j)\n\n    count = 0\n    for i in range(n):\n        if not seen[i]:\n            count += 1\n            dfs(i)\n    return count`,
        javascript: `var findCircleNum = function(isConnected) {\n    const n = isConnected.length;\n    const seen = new Array(n).fill(false);\n    function dfs(i) {\n        seen[i] = true;\n        for (let j = 0; j < n; j++) {\n            if (isConnected[i][j] === 1 && !seen[j]) dfs(j);\n        }\n    }\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        if (!seen[i]) {\n            count++;\n            dfs(i);\n        }\n    }\n    return count;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef validPath(n: int, edges: List[List[int]], source: int, destination: int) -> bool:\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        parent[find(a)] = find(b)\n    return find(source) == find(destination)`,
        javascript: `var validPath = function(n, edges, source, destination) {\n    const parent = [];\n    for (let i = 0; i < n; i++) parent.push(i);\n    function find(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    for (const e of edges) {\n        parent[find(e[0])] = find(e[1]);\n    }\n    return find(source) === find(destination);\n};`,
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
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef canFinish(numCourses: int, prerequisites: List[List[int]]) -> bool:\n    indeg = [0] * numCourses\n    adj = [[] for _ in range(numCourses)]\n    for a, b in prerequisites:\n        adj[b].append(a)\n        indeg[a] += 1\n    queue = deque(i for i in range(numCourses) if indeg[i] == 0)\n    taken = 0\n    while queue:\n        c = queue.popleft()\n        taken += 1\n        for nxt in adj[c]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                queue.append(nxt)\n    return taken == numCourses`,
        javascript: `var canFinish = function(numCourses, prerequisites) {\n    const indeg = new Array(numCourses).fill(0);\n    const adj = [];\n    for (let i = 0; i < numCourses; i++) adj.push([]);\n    for (const p of prerequisites) {\n        adj[p[1]].push(p[0]);\n        indeg[p[0]]++;\n    }\n    const queue = [];\n    for (let i = 0; i < numCourses; i++) {\n        if (indeg[i] === 0) queue.push(i);\n    }\n    let taken = 0;\n    let head = 0;\n    while (head < queue.length) {\n        const c = queue[head++];\n        taken++;\n        for (const nxt of adj[c]) {\n            if (--indeg[nxt] === 0) queue.push(nxt);\n        }\n    }\n    return taken === numCourses;\n};`,
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
      solutions: {
        python: `from typing import List\nimport heapq\n\ndef findOrder(numCourses: int, prerequisites: List[List[int]]) -> List[int]:\n    indeg = [0] * numCourses\n    adj = [[] for _ in range(numCourses)]\n    for a, b in prerequisites:\n        adj[b].append(a)\n        indeg[a] += 1\n    heap = [i for i in range(numCourses) if indeg[i] == 0]\n    heapq.heapify(heap)\n    out = []\n    while heap:\n        c = heapq.heappop(heap)\n        out.append(c)\n        for nxt in adj[c]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                heapq.heappush(heap, nxt)\n    return out if len(out) == numCourses else []`,
        javascript: `var findOrder = function(numCourses, prerequisites) {\n    const indeg = new Array(numCourses).fill(0);\n    const adj = [];\n    for (let i = 0; i < numCourses; i++) adj.push([]);\n    for (const p of prerequisites) {\n        adj[p[1]].push(p[0]);\n        indeg[p[0]]++;\n    }\n    const avail = [];\n    for (let i = 0; i < numCourses; i++) {\n        if (indeg[i] === 0) avail.push(i);\n    }\n    const out = [];\n    while (avail.length > 0) {\n        avail.sort(function(a, b) { return a - b; });\n        const c = avail.shift();\n        out.push(c);\n        for (const nxt of adj[c]) {\n            if (--indeg[nxt] === 0) avail.push(nxt);\n        }\n    }\n    return out.length === numCourses ? out : [];\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findRedundantConnection(edges: List[List[int]]) -> List[int]:\n    n = len(edges)\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return [a, b]\n        parent[ra] = rb\n    return []`,
        javascript: `var findRedundantConnection = function(edges) {\n    const n = edges.length;\n    const parent = [];\n    for (let i = 0; i <= n; i++) parent.push(i);\n    function find(x) {\n        while (parent[x] !== x) {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        return x;\n    }\n    for (const e of edges) {\n        const ra = find(e[0]), rb = find(e[1]);\n        if (ra === rb) return [e[0], e[1]];\n        parent[ra] = rb;\n    }\n    return [];\n};`,
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
      solutions: {
        python: `from typing import List\nimport heapq\nfrom collections import defaultdict\n\ndef networkDelayTime(times: List[List[int]], n: int, k: int) -> int:\n    adj = defaultdict(list)\n    for u, v, w in times:\n        adj[u].append((v, w))\n    dist = {}\n    heap = [(0, k)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if u in dist:\n            continue\n        dist[u] = d\n        for v, w in adj[u]:\n            if v not in dist:\n                heapq.heappush(heap, (d + w, v))\n    if len(dist) != n:\n        return -1\n    return max(dist.values())`,
        javascript: `var networkDelayTime = function(times, n, k) {\n    const dist = new Array(n + 1).fill(Infinity);\n    dist[k] = 0;\n    const done = new Array(n + 1).fill(false);\n    for (let iter = 0; iter < n; iter++) {\n        let u = -1;\n        for (let v = 1; v <= n; v++) {\n            if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;\n        }\n        if (u === -1 || dist[u] === Infinity) break;\n        done[u] = true;\n        for (const t of times) {\n            if (t[0] === u && dist[u] + t[2] < dist[t[1]]) dist[t[1]] = dist[u] + t[2];\n        }\n    }\n    let best = 0;\n    for (let v = 1; v <= n; v++) {\n        if (dist[v] === Infinity) return -1;\n        best = Math.max(best, dist[v]);\n    }\n    return best;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findCheapestPrice(n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:\n    INF = float("inf")\n    dist = [INF] * n\n    dist[src] = 0\n    for _ in range(k + 1):\n        nxt = dist[:]\n        for u, v, w in flights:\n            if dist[u] + w < nxt[v]:\n                nxt[v] = dist[u] + w\n        dist = nxt\n    return -1 if dist[dst] == INF else dist[dst]`,
        javascript: `var findCheapestPrice = function(n, flights, src, dst, k) {\n    let dist = new Array(n).fill(Infinity);\n    dist[src] = 0;\n    for (let round = 0; round <= k; round++) {\n        const next = dist.slice();\n        for (const f of flights) {\n            if (dist[f[0]] + f[2] < next[f[1]]) next[f[1]] = dist[f[0]] + f[2];\n        }\n        dist = next;\n    }\n    return dist[dst] === Infinity ? -1 : dist[dst];\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef minCostConnectPoints(points: List[List[int]]) -> int:\n    n = len(points)\n    if n <= 1:\n        return 0\n    INF = float("inf")\n    in_tree = [False] * n\n    min_dist = [INF] * n\n    min_dist[0] = 0\n    total = 0\n    for _ in range(n):\n        u = -1\n        for v in range(n):\n            if not in_tree[v] and (u == -1 or min_dist[v] < min_dist[u]):\n                u = v\n        in_tree[u] = True\n        total += min_dist[u]\n        for v in range(n):\n            if not in_tree[v]:\n                d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])\n                if d < min_dist[v]:\n                    min_dist[v] = d\n    return total`,
        javascript: `var minCostConnectPoints = function(points) {\n    const n = points.length;\n    if (n <= 1) return 0;\n    const inTree = new Array(n).fill(false);\n    const minDist = new Array(n).fill(Infinity);\n    minDist[0] = 0;\n    let total = 0;\n    for (let iter = 0; iter < n; iter++) {\n        let u = -1;\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v] && (u === -1 || minDist[v] < minDist[u])) u = v;\n        }\n        inTree[u] = true;\n        total += minDist[u];\n        for (let v = 0; v < n; v++) {\n            if (!inTree[v]) {\n                const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);\n                if (d < minDist[v]) minDist[v] = d;\n            }\n        }\n    }\n    return total;\n};`,
      },
    };
  })(),

];
