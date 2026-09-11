/**
 * Dynamic programming — wave 3.
 *
 * Real problems only: LeetCode numbered classics that appear in Amazon,
 * Google, Microsoft and Adobe interview loops.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { describe, explain, fmtIntArr, fmtIntMat, ri, randLower, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const DP3_PROBLEMS: CatalogProblem[] = [

  // ── Paint Fence (LC 276) ────────────────────────────────────────
  (() => {
    const ref = (n: number, k: number) => {
      if (n === 0) return 0;
      if (n === 1) return k;
      let same = k, diff = k * (k - 1);
      for (let i = 3; i <= n; i++) {
        const prevDiff = diff;
        diff = (same + diff) * (k - 1);
        same = prevDiff;
      }
      return same + diff;
    };
    return {
      slug: "paint-fence",
      title: "Paint Fence",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "numWays",
        params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are painting a fence of `n` posts using `k` colours. Every post gets exactly one colour, and **no three consecutive posts** may share the same colour.\n\nReturn the number of ways to paint the fence.",
        [
          { in: "n = 3, k = 2", out: "6", note: "Only the two all-same paintings are forbidden out of 8." },
          { in: "n = 1, k = 1", out: "1" },
          { in: "n = 7, k = 2", out: "42" },
        ],
        ["1 <= n <= 50", "1 <= k <= 105", "The answer fits in a 32-bit integer."]),
      hints: [
        "Split the count by whether the last two posts match.",
        "`same[i]` needs post `i-1` and `i` equal, which forces post `i-2` to differ — so `same[i] = diff[i-1]`.",
        "`diff[i] = (same[i-1] + diff[i-1]) * (k - 1)`, since any previous state can be followed by a different colour.",
      ],
      editorial: explain({
        idea: "Track two running counts: paintings whose last two posts match, and paintings whose last two differ. The \"no three in a row\" rule turns into a one-step recurrence between them.",
        steps: [
          "Handle `n == 1` directly: `k` ways.",
          "Initialise `same = k` (both first posts the same colour) and `diff = k * (k - 1)`.",
          "For each further post: the new `diff` is `(same + diff) * (k - 1)`, and the new `same` is the **old** `diff`.",
          "Return `same + diff`.",
        ],
        why: "A painting ending in two matching posts can only be extended by a different colour, or it would create three in a row. A painting ending in two different posts can be extended by the same colour as the last post (giving a new `same`) or by any of the other `k - 1` colours.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Updating `same` from the *new* `diff` instead of the old one collapses the recurrence.",
          "`k = 1` works only for `n <= 2`; the formula already yields 0 beyond that.",
          "Intermediate products can exceed 32 bits — accumulate in 64.",
        ],
      }),
      examples: [
        { input: "3\n2", expectedOutput: "6" },
        { input: "1\n1", expectedOutput: "1" },
        { input: "7\n2", expectedOutput: "42" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const k = ri(rng, 1, 6);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def numWays(n: int, k: int) -> int:\n    if n == 0:\n        return 0\n    if n == 1:\n        return k\n    same = k\n    diff = k * (k - 1)\n    for _ in range(3, n + 1):\n        prev_diff = diff\n        diff = (same + diff) * (k - 1)\n        same = prev_diff\n    return same + diff`,
        javascript: `var numWays = function(n, k) {\n    if (n === 0) return 0;\n    if (n === 1) return k;\n    let same = k, diff = k * (k - 1);\n    for (let i = 3; i <= n; i++) {\n        const prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return same + diff;\n};`,
        typescript: `function numWays(n: number, k: number): number {\n    if (n === 0) return 0;\n    if (n === 1) return k;\n    var same = k, diff = k * (k - 1);\n    for (var i = 3; i <= n; i++) {\n        var prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return same + diff;\n}`,
        java: `public static int numWays(int n, int k) {\n    if (n == 0) return 0;\n    if (n == 1) return k;\n    long same = k;\n    long diff = (long) k * (k - 1);\n    for (int i = 3; i <= n; i++) {\n        long prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return (int) (same + diff);\n}`,
        cpp: `int numWays(int n, int k) {\n    if (n == 0) return 0;\n    if (n == 1) return k;\n    long long same = k;\n    long long diff = (long long) k * (k - 1);\n    for (int i = 3; i <= n; i++) {\n        long long prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return (int) (same + diff);\n}`,
        c: `int numWays(int n, int k) {\n    if (n == 0) return 0;\n    if (n == 1) return k;\n    long long same = k;\n    long long diff = (long long) k * (k - 1);\n    for (int i = 3; i <= n; i++) {\n        long long prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return (int) (same + diff);\n}`,
        csharp: `public static int NumWays(int n, int k)\n{\n    if (n == 0) return 0;\n    if (n == 1) return k;\n    long same = k;\n    long diff = (long) k * (k - 1);\n    for (int i = 3; i <= n; i++)\n    {\n        long prevDiff = diff;\n        diff = (same + diff) * (k - 1);\n        same = prevDiff;\n    }\n    return (int) (same + diff);\n}`,
        go: `func numWays(n int, k int) int {\n\tif n == 0 {\n\t\treturn 0\n\t}\n\tif n == 1 {\n\t\treturn k\n\t}\n\tsame := k\n\tdiff := k * (k - 1)\n\tfor i := 3; i <= n; i++ {\n\t\tprevDiff := diff\n\t\tdiff = (same + diff) * (k - 1)\n\t\tsame = prevDiff\n\t}\n\treturn same + diff\n}`,
        kotlin: `fun numWays(n: Int, k: Int): Int {\n    if (n == 0) return 0\n    if (n == 1) return k\n    var same = k.toLong()\n    var diff = k.toLong() * (k - 1)\n    for (i in 3..n) {\n        val prevDiff = diff\n        diff = (same + diff) * (k - 1)\n        same = prevDiff\n    }\n    return (same + diff).toInt()\n}`,
        swift: `func numWays(_ n: Int, _ k: Int) -> Int {\n    if n == 0 { return 0 }\n    if n == 1 { return k }\n    var same = k\n    var diff = k * (k - 1)\n    var i = 3\n    while i <= n {\n        let prevDiff = diff\n        diff = (same + diff) * (k - 1)\n        same = prevDiff\n        i += 1\n    }\n    return same + diff\n}`,
        rust: `fn numWays(n: i32, k: i32) -> i32 {\n    if n == 0 {\n        return 0;\n    }\n    if n == 1 {\n        return k;\n    }\n    let mut same: i64 = k as i64;\n    let mut diff: i64 = k as i64 * (k as i64 - 1);\n    for _ in 3..=n {\n        let prev_diff = diff;\n        diff = (same + diff) * (k as i64 - 1);\n        same = prev_diff;\n    }\n    (same + diff) as i32\n}`,
        php: `function numWays($n, $k) {\n    if ($n === 0) return 0;\n    if ($n === 1) return $k;\n    $same = $k;\n    $diff = $k * ($k - 1);\n    for ($i = 3; $i <= $n; $i++) {\n        $prevDiff = $diff;\n        $diff = ($same + $diff) * ($k - 1);\n        $same = $prevDiff;\n    }\n    return $same + $diff;\n}`,
        ruby: `def numWays(n, k)\n  return 0 if n == 0\n  return k if n == 1\n  same = k\n  diff = k * (k - 1)\n  (3..n).each do\n    prev_diff = diff\n    diff = (same + diff) * (k - 1)\n    same = prev_diff\n  end\n  same + diff\nend`,
      },
    };
  })(),

  // ── Paint House (LC 256) ────────────────────────────────────────
  (() => {
    const ref = (costs: number[][]) => {
      if (costs.length === 0) return 0;
      let r = costs[0][0], g = costs[0][1], b = costs[0][2];
      for (let i = 1; i < costs.length; i++) {
        const nr = costs[i][0] + Math.min(g, b);
        const ng = costs[i][1] + Math.min(r, b);
        const nb = costs[i][2] + Math.min(r, g);
        r = nr; g = ng; b = nb;
      }
      return Math.min(r, Math.min(g, b));
    };
    return {
      slug: "paint-house",
      title: "Paint House",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Facebook", "LinkedIn"],
      signature: { funcName: "minCost", params: [{ name: "costs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A row of `n` houses must each be painted red, blue or green. `costs[i] = [red, blue, green]` gives the cost of each colour for house `i`.\n\n**No two adjacent houses may share a colour.** Return the minimum total cost.",
        [
          { in: "costs = [[17,2,17],[16,16,5],[14,3,19]]", out: "10", note: "Blue, green, blue: 2 + 5 + 3 = 10." },
          { in: "costs = [[7,6,2]]", out: "2" },
          { in: "costs = [[1,2,3],[1,2,3]]", out: "3", note: "Red then blue: 1 + 2 = 3." },
        ],
        ["1 <= costs.length <= 100", "costs[i].length == 3", "1 <= costs[i][j] <= 20"]),
      hints: [
        "Track the best total for each possible colour of the current house.",
        "The cheapest way to end house `i` in red is `costs[i][0]` plus the cheaper of ending house `i-1` in blue or green.",
        "Three rolling values are enough — no table needed.",
      ],
      editorial: explain({
        idea: "The only thing the future needs to know about the past is the colour of the last house, so three running totals capture the whole state.",
        steps: [
          "Initialise `r`, `g`, `b` with the first house's three costs.",
          "For each later house, compute the new totals: each colour's cost plus the minimum of the other two previous totals.",
          "Update all three simultaneously — the new values must come from the old ones.",
          "Return the minimum of the three at the end.",
        ],
        why: "The adjacency rule only forbids repeating the immediately previous colour, so the optimal cost of ending at house `i` in a given colour depends solely on the two other colours at `i-1`. That is exactly the recurrence.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Overwriting `r` before computing `g` and `b` feeds the new value back into the same step.",
          "Greedily picking the cheapest colour per house ignores the adjacency constraint and is wrong.",
          "Note the column order here is [red, blue, green], matching the problem statement.",
        ],
      }),
      examples: [
        { input: "[[17,2,17],[16,16,5],[14,3,19]]", expectedOutput: "10" },
        { input: "[[7,6,2]]", expectedOutput: "2" },
        { input: "[[1,2,3],[1,2,3]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const costs = Array.from({ length: n }, () => [ri(rng, 1, 20), ri(rng, 1, 20), ri(rng, 1, 20)]);
        return { input: fmtIntMat(costs), expectedOutput: String(ref(costs)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minCost(costs: List[List[int]]) -> int:\n    if not costs:\n        return 0\n    r, g, b = costs[0]\n    for i in range(1, len(costs)):\n        r, g, b = (\n            costs[i][0] + min(g, b),\n            costs[i][1] + min(r, b),\n            costs[i][2] + min(r, g),\n        )\n    return min(r, g, b)`,
        javascript: `var minCost = function(costs) {\n    if (costs.length === 0) return 0;\n    let r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (let i = 1; i < costs.length; i++) {\n        const nr = costs[i][0] + Math.min(g, b);\n        const ng = costs[i][1] + Math.min(r, b);\n        const nb = costs[i][2] + Math.min(r, g);\n        r = nr; g = ng; b = nb;\n    }\n    return Math.min(r, Math.min(g, b));\n};`,
        typescript: `function minCost(costs: number[][]): number {\n    if (costs.length === 0) return 0;\n    var r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (var i = 1; i < costs.length; i++) {\n        var nr = costs[i][0] + Math.min(g, b);\n        var ng = costs[i][1] + Math.min(r, b);\n        var nb = costs[i][2] + Math.min(r, g);\n        r = nr; g = ng; b = nb;\n    }\n    return Math.min(r, Math.min(g, b));\n}`,
        java: `public static int minCost(int[][] costs) {\n    if (costs.length == 0) return 0;\n    int r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (int i = 1; i < costs.length; i++) {\n        int nr = costs[i][0] + Math.min(g, b);\n        int ng = costs[i][1] + Math.min(r, b);\n        int nb = costs[i][2] + Math.min(r, g);\n        r = nr; g = ng; b = nb;\n    }\n    return Math.min(r, Math.min(g, b));\n}`,
        cpp: `int minCost(vector<vector<int>>& costs) {\n    if (costs.empty()) return 0;\n    int r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (int i = 1; i < (int) costs.size(); i++) {\n        int nr = costs[i][0] + min(g, b);\n        int ng = costs[i][1] + min(r, b);\n        int nb = costs[i][2] + min(r, g);\n        r = nr; g = ng; b = nb;\n    }\n    return min(r, min(g, b));\n}`,
        c: `int minCost(int** costs, int costsSize, int* costsColSize) {\n    if (costsSize == 0) return 0;\n    int r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (int i = 1; i < costsSize; i++) {\n        int mgb = g < b ? g : b;\n        int mrb = r < b ? r : b;\n        int mrg = r < g ? r : g;\n        int nr = costs[i][0] + mgb;\n        int ng = costs[i][1] + mrb;\n        int nb = costs[i][2] + mrg;\n        r = nr; g = ng; b = nb;\n    }\n    int best = r < g ? r : g;\n    return best < b ? best : b;\n}`,
        csharp: `public static int MinCost(int[][] costs)\n{\n    if (costs.Length == 0) return 0;\n    int r = costs[0][0], g = costs[0][1], b = costs[0][2];\n    for (int i = 1; i < costs.Length; i++)\n    {\n        int nr = costs[i][0] + Math.Min(g, b);\n        int ng = costs[i][1] + Math.Min(r, b);\n        int nb = costs[i][2] + Math.Min(r, g);\n        r = nr; g = ng; b = nb;\n    }\n    return Math.Min(r, Math.Min(g, b));\n}`,
        go: `func minCost(costs [][]int) int {\n\tif len(costs) == 0 {\n\t\treturn 0\n\t}\n\tmin2 := func(a, b int) int {\n\t\tif a < b {\n\t\t\treturn a\n\t\t}\n\t\treturn b\n\t}\n\tr, g, b := costs[0][0], costs[0][1], costs[0][2]\n\tfor i := 1; i < len(costs); i++ {\n\t\tnr := costs[i][0] + min2(g, b)\n\t\tng := costs[i][1] + min2(r, b)\n\t\tnb := costs[i][2] + min2(r, g)\n\t\tr, g, b = nr, ng, nb\n\t}\n\treturn min2(r, min2(g, b))\n}`,
        kotlin: `fun minCost(costs: Array<IntArray>): Int {\n    if (costs.isEmpty()) return 0\n    var r = costs[0][0]\n    var g = costs[0][1]\n    var b = costs[0][2]\n    for (i in 1 until costs.size) {\n        val nr = costs[i][0] + minOf(g, b)\n        val ng = costs[i][1] + minOf(r, b)\n        val nb = costs[i][2] + minOf(r, g)\n        r = nr; g = ng; b = nb\n    }\n    return minOf(r, g, b)\n}`,
        swift: `func minCost(_ costs: [[Int]]) -> Int {\n    if costs.isEmpty { return 0 }\n    var r = costs[0][0]\n    var g = costs[0][1]\n    var b = costs[0][2]\n    var i = 1\n    while i < costs.count {\n        let nr = costs[i][0] + min(g, b)\n        let ng = costs[i][1] + min(r, b)\n        let nb = costs[i][2] + min(r, g)\n        r = nr; g = ng; b = nb\n        i += 1\n    }\n    return min(r, min(g, b))\n}`,
        rust: `fn minCost(costs: Vec<Vec<i32>>) -> i32 {\n    if costs.is_empty() {\n        return 0;\n    }\n    let mut r = costs[0][0];\n    let mut g = costs[0][1];\n    let mut b = costs[0][2];\n    for i in 1..costs.len() {\n        let nr = costs[i][0] + std::cmp::min(g, b);\n        let ng = costs[i][1] + std::cmp::min(r, b);\n        let nb = costs[i][2] + std::cmp::min(r, g);\n        r = nr;\n        g = ng;\n        b = nb;\n    }\n    std::cmp::min(r, std::cmp::min(g, b))\n}`,
        php: `function minCost($costs) {\n    if (count($costs) === 0) return 0;\n    $r = $costs[0][0]; $g = $costs[0][1]; $b = $costs[0][2];\n    for ($i = 1; $i < count($costs); $i++) {\n        $nr = $costs[$i][0] + min($g, $b);\n        $ng = $costs[$i][1] + min($r, $b);\n        $nb = $costs[$i][2] + min($r, $g);\n        $r = $nr; $g = $ng; $b = $nb;\n    }\n    return min($r, $g, $b);\n}`,
        ruby: `def minCost(costs)\n  return 0 if costs.empty?\n  r, g, b = costs[0]\n  (1...costs.length).each do |i|\n    nr = costs[i][0] + [g, b].min\n    ng = costs[i][1] + [r, b].min\n    nb = costs[i][2] + [r, g].min\n    r, g, b = nr, ng, nb\n  end\n  [r, g, b].min\nend`,
      },
    };
  })(),

  // ── Domino and Tromino Tiling (LC 790) ──────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number) => {
      if (n === 1) return 1;
      if (n === 2) return 2;
      const f = new Array(n + 1).fill(0);
      f[0] = 1; f[1] = 1; f[2] = 2;
      for (let i = 3; i <= n; i++) {
        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;
      }
      return f[n];
    };
    return {
      slug: "domino-and-tromino-tiling",
      title: "Domino and Tromino Tiling",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "numTilings", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have two tile shapes: a **2×1 domino** and an **L-shaped tromino** (three squares). Both may be rotated.\n\nReturn the number of ways to tile a `2 × n` board, modulo `10^9 + 7`. Two tilings differ if some pair of 4-directionally adjacent cells is covered by the same tile in one tiling and not the other.",
        [
          { in: "n = 3", out: "5" },
          { in: "n = 1", out: "1" },
          { in: "n = 4", out: "11" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Work out the first few values by hand: 1, 2, 5, 11, 24, …",
        "The clean recurrence is `f(n) = 2·f(n-1) + f(n-3)`.",
        "Seed it with `f(0) = 1`, `f(1) = 1` and `f(2) = 2`.",
      ],
      editorial: explain({
        idea: "Deriving the state machine over partially filled columns leads to a surprisingly compact closed recurrence: `f(n) = 2·f(n-1) + f(n-3)`.",
        steps: [
          "Handle `n = 1` and `n = 2` directly.",
          "Set `f[0] = 1`, `f[1] = 1`, `f[2] = 2`.",
          "For `i` from 3 to `n`, compute `f[i] = (2·f[i-1] + f[i-3]) mod (10^9+7)`.",
          "Return `f[n]`.",
        ],
        why: "The `2·f(n-1)` term covers extending a full tiling with a vertical domino and the mirror-image tromino continuations; the `f(n-3)` term accounts for the two-tromino block that spans three columns without being decomposable. Working the identity out from the two-state (full / jagged) formulation gives exactly this.",
        time: "O(n)",
        space: "O(n), reducible to O(1)",
        pitfalls: [
          "Forgetting the modulus overflows well before `n = 1000`.",
          "Seeding `f[0] = 0` breaks the recurrence — the empty board has exactly one tiling.",
          "The naive `f(n) = f(n-1) + f(n-2)` (dominoes only) misses every tromino tiling.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "5" },
        { input: "1", expectedOutput: "1" },
        { input: "4", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def numTilings(n: int) -> int:\n    MOD = 1000000007\n    if n == 1:\n        return 1\n    if n == 2:\n        return 2\n    f = [0] * (n + 1)\n    f[0], f[1], f[2] = 1, 1, 2\n    for i in range(3, n + 1):\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD\n    return f[n]`,
        javascript: `var numTilings = function(n) {\n    const MOD = 1000000007;\n    if (n === 1) return 1;\n    if (n === 2) return 2;\n    const f = new Array(n + 1).fill(0);\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (let i = 3; i <= n; i++) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    return f[n];\n};`,
        typescript: `function numTilings(n: number): number {\n    var MOD = 1000000007;\n    if (n === 1) return 1;\n    if (n === 2) return 2;\n    var f: number[] = [];\n    for (var k = 0; k <= n; k++) f.push(0);\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (var i = 3; i <= n; i++) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    return f[n];\n}`,
        java: `public static int numTilings(int n) {\n    long MOD = 1000000007L;\n    if (n == 1) return 1;\n    if (n == 2) return 2;\n    long[] f = new long[n + 1];\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (int i = 3; i <= n; i++) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    return (int) f[n];\n}`,
        cpp: `int numTilings(int n) {\n    const long long MOD = 1000000007LL;\n    if (n == 1) return 1;\n    if (n == 2) return 2;\n    vector<long long> f(n + 1, 0);\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (int i = 3; i <= n; i++) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    return (int) f[n];\n}`,
        c: `int numTilings(int n) {\n    const long long MOD = 1000000007LL;\n    if (n == 1) return 1;\n    if (n == 2) return 2;\n    long long* f = (long long*) malloc((n + 1) * sizeof(long long));\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (int i = 3; i <= n; i++) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    int result = (int) f[n];\n    free(f);\n    return result;\n}`,
        csharp: `public static int NumTilings(int n)\n{\n    const long MOD = 1000000007L;\n    if (n == 1) return 1;\n    if (n == 2) return 2;\n    long[] f = new long[n + 1];\n    f[0] = 1; f[1] = 1; f[2] = 2;\n    for (int i = 3; i <= n; i++)\n    {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    return (int) f[n];\n}`,
        go: `func numTilings(n int) int {\n\tconst MOD = 1000000007\n\tif n == 1 {\n\t\treturn 1\n\t}\n\tif n == 2 {\n\t\treturn 2\n\t}\n\tf := make([]int, n+1)\n\tf[0], f[1], f[2] = 1, 1, 2\n\tfor i := 3; i <= n; i++ {\n\t\tf[i] = (2*f[i-1] + f[i-3]) % MOD\n\t}\n\treturn f[n]\n}`,
        kotlin: `fun numTilings(n: Int): Int {\n    val MOD = 1000000007L\n    if (n == 1) return 1\n    if (n == 2) return 2\n    val f = LongArray(n + 1)\n    f[0] = 1; f[1] = 1; f[2] = 2\n    for (i in 3..n) {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD\n    }\n    return f[n].toInt()\n}`,
        swift: `func numTilings(_ n: Int) -> Int {\n    let MOD = 1000000007\n    if n == 1 { return 1 }\n    if n == 2 { return 2 }\n    var f = [Int](repeating: 0, count: n + 1)\n    f[0] = 1; f[1] = 1; f[2] = 2\n    var i = 3\n    while i <= n {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD\n        i += 1\n    }\n    return f[n]\n}`,
        rust: `fn numTilings(n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    if n == 1 {\n        return 1;\n    }\n    if n == 2 {\n        return 2;\n    }\n    let size = (n + 1) as usize;\n    let mut f = vec![0i64; size];\n    f[0] = 1;\n    f[1] = 1;\n    f[2] = 2;\n    for i in 3..size {\n        f[i] = (2 * f[i - 1] + f[i - 3]) % MOD;\n    }\n    f[n as usize] as i32\n}`,
        php: `function numTilings($n) {\n    $MOD = 1000000007;\n    if ($n === 1) return 1;\n    if ($n === 2) return 2;\n    $f = array_fill(0, $n + 1, 0);\n    $f[0] = 1; $f[1] = 1; $f[2] = 2;\n    for ($i = 3; $i <= $n; $i++) {\n        $f[$i] = (2 * $f[$i - 1] + $f[$i - 3]) % $MOD;\n    }\n    return $f[$n];\n}`,
        ruby: `def numTilings(n)\n  mod = 1000000007\n  return 1 if n == 1\n  return 2 if n == 2\n  f = Array.new(n + 1, 0)\n  f[0] = 1\n  f[1] = 1\n  f[2] = 2\n  (3..n).each do |i|\n    f[i] = (2 * f[i - 1] + f[i - 3]) % mod\n  end\n  f[n]\nend`,
      },
    };
  })(),

  // ── Unique Binary Search Trees (LC 96) ──────────────────────────
  (() => {
    const ref = (n: number) => {
      const g = new Array(n + 1).fill(0);
      g[0] = 1;
      for (let i = 1; i <= n; i++) {
        for (let root = 1; root <= i; root++) {
          g[i] += g[root - 1] * g[i - root];
        }
      }
      return g[n];
    };
    return {
      slug: "unique-binary-search-trees",
      title: "Unique Binary Search Trees",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Math", "Amazon", "Google", "Adobe"],
      signature: { funcName: "numTrees", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the number of **structurally distinct** binary search trees that hold exactly the values `1` through `n`.",
        [
          { in: "n = 3", out: "5" },
          { in: "n = 1", out: "1" },
          { in: "n = 5", out: "42" },
        ],
        ["1 <= n <= 19", "The answer fits in a 32-bit integer."]),
      hints: [
        "Fix which value sits at the root — say `k`.",
        "Everything below `k` forms the left subtree and everything above forms the right, independently.",
        "So `G(n) = Σ G(k-1) · G(n-k)` for `k` from 1 to `n`, with `G(0) = 1`.",
      ],
      editorial: explain({
        idea: "Choosing the root splits the value range into two independent sub-ranges. The count depends only on the *sizes* of those ranges, not on the actual values — which gives the Catalan recurrence.",
        steps: [
          "Set `G[0] = 1` (the empty tree counts as one shape).",
          "For each `i` from 1 to `n`, sum `G[root-1] * G[i-root]` over every possible root position.",
          "Return `G[n]`.",
        ],
        why: "A BST on `{1..n}` with root `k` has a left subtree over `{1..k-1}` and a right subtree over `{k+1..n}`. The shapes available depend only on how many values each side holds, so the counts multiply and the roots partition the possibilities.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "`G[0] = 0` collapses everything to zero — an empty subtree is one valid shape.",
          "At `n = 19` the answer is 1,767,263,190, just inside a signed 32-bit integer; larger `n` would overflow.",
          "The direct Catalan formula works too but needs care with integer division.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "5" },
        { input: "1", expectedOutput: "1" },
        { input: "5", expectedOutput: "42" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 19);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def numTrees(n: int) -> int:\n    g = [0] * (n + 1)\n    g[0] = 1\n    for i in range(1, n + 1):\n        for root in range(1, i + 1):\n            g[i] += g[root - 1] * g[i - root]\n    return g[n]`,
        javascript: `var numTrees = function(n) {\n    const g = new Array(n + 1).fill(0);\n    g[0] = 1;\n    for (let i = 1; i <= n; i++) {\n        for (let root = 1; root <= i; root++) {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    return g[n];\n};`,
        typescript: `function numTrees(n: number): number {\n    var g: number[] = [];\n    for (var k = 0; k <= n; k++) g.push(0);\n    g[0] = 1;\n    for (var i = 1; i <= n; i++) {\n        for (var root = 1; root <= i; root++) {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    return g[n];\n}`,
        java: `public static int numTrees(int n) {\n    long[] g = new long[n + 1];\n    g[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        for (int root = 1; root <= i; root++) {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    return (int) g[n];\n}`,
        cpp: `int numTrees(int n) {\n    vector<long long> g(n + 1, 0);\n    g[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        for (int root = 1; root <= i; root++) {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    return (int) g[n];\n}`,
        c: `int numTrees(int n) {\n    long long* g = (long long*) calloc(n + 1, sizeof(long long));\n    g[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        for (int root = 1; root <= i; root++) {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    int result = (int) g[n];\n    free(g);\n    return result;\n}`,
        csharp: `public static int NumTrees(int n)\n{\n    long[] g = new long[n + 1];\n    g[0] = 1;\n    for (int i = 1; i <= n; i++)\n    {\n        for (int root = 1; root <= i; root++)\n        {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    return (int) g[n];\n}`,
        go: `func numTrees(n int) int {\n\tg := make([]int, n+1)\n\tg[0] = 1\n\tfor i := 1; i <= n; i++ {\n\t\tfor root := 1; root <= i; root++ {\n\t\t\tg[i] += g[root-1] * g[i-root]\n\t\t}\n\t}\n\treturn g[n]\n}`,
        kotlin: `fun numTrees(n: Int): Int {\n    val g = LongArray(n + 1)\n    g[0] = 1\n    for (i in 1..n) {\n        for (root in 1..i) {\n            g[i] += g[root - 1] * g[i - root]\n        }\n    }\n    return g[n].toInt()\n}`,
        swift: `func numTrees(_ n: Int) -> Int {\n    var g = [Int](repeating: 0, count: n + 1)\n    g[0] = 1\n    for i in 1...max(n, 1) {\n        for root in 1...i {\n            g[i] += g[root - 1] * g[i - root]\n        }\n    }\n    return g[n]\n}`,
        rust: `fn numTrees(n: i32) -> i32 {\n    let size = (n + 1) as usize;\n    let mut g = vec![0i64; size];\n    g[0] = 1;\n    for i in 1..size {\n        for root in 1..=i {\n            g[i] += g[root - 1] * g[i - root];\n        }\n    }\n    g[n as usize] as i32\n}`,
        php: `function numTrees($n) {\n    $g = array_fill(0, $n + 1, 0);\n    $g[0] = 1;\n    for ($i = 1; $i <= $n; $i++) {\n        for ($root = 1; $root <= $i; $root++) {\n            $g[$i] += $g[$root - 1] * $g[$i - $root];\n        }\n    }\n    return $g[$n];\n}`,
        ruby: `def numTrees(n)\n  g = Array.new(n + 1, 0)\n  g[0] = 1\n  (1..n).each do |i|\n    (1..i).each do |root|\n      g[i] += g[root - 1] * g[i - root]\n    end\n  end\n  g[n]\nend`,
      },
    };
  })(),

  // ── Longest Palindromic Subsequence (LC 516) ────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        dp[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
          if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;
          else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
        }
      }
      return n === 0 ? 0 : dp[0][n - 1];
    };
    return {
      slug: "longest-palindromic-subsequence",
      title: "Longest Palindromic Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Uber", "Adobe"],
      signature: { funcName: "longestPalindromeSubseq", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the length of its longest **palindromic subsequence**.\n\nA subsequence is formed by deleting zero or more characters without reordering the rest.",
        [
          { in: 's = "bbbab"', out: "4", note: 'One answer is "bbbb".' },
          { in: 's = "cbbd"', out: "2", note: '"bb".' },
          { in: 's = "a"', out: "1" },
        ],
        ["1 <= s.length <= 300", "s consists of lowercase English letters."]),
      hints: [
        "Define `dp[i][j]` as the answer for the substring `s[i..j]`.",
        "If the ends match, they can both join a palindrome built from the inside: `dp[i+1][j-1] + 2`.",
        "Otherwise drop one end or the other and take the better result.",
      ],
      editorial: explain({
        idea: "Interval DP over substrings. Matching endpoints extend an inner palindrome by two; mismatched endpoints force a choice of which one to discard.",
        steps: [
          "Let `dp[i][j]` be the longest palindromic subsequence of `s[i..j]`, with `dp[i][i] = 1`.",
          "Fill `i` from `n-1` down to 0 so that `dp[i+1][…]` is already known.",
          "When `s[i] == s[j]`, set `dp[i][j] = dp[i+1][j-1] + 2`.",
          "Otherwise set `dp[i][j] = max(dp[i+1][j], dp[i][j-1])`.",
          "Return `dp[0][n-1]`.",
        ],
        why: "If the two ends match, there is always an optimal solution that uses both — swapping them in never shortens the answer. If they differ, at most one can appear in the palindrome, so the best solution omits one end.",
        time: "O(n²)",
        space: "O(n²), reducible to O(n)",
        pitfalls: [
          "Filling `i` upward reads `dp[i+1][j-1]` before it is computed.",
          "For a two-character match, `dp[i+1][j-1]` refers to an empty range and must be 0 — the zero-initialised table handles it.",
          "This is *not* the same as the longest palindromic **substring**, which must be contiguous.",
        ],
      }),
      examples: [
        { input: '"bbbab"', expectedOutput: "4" },
        { input: '"cbbd"', expectedOutput: "2" },
        { input: '"a"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 24, "abcd");
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def longestPalindromeSubseq(s: str) -> int:\n    n = len(s)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n - 1, -1, -1):\n        dp[i][i] = 1\n        for j in range(i + 1, n):\n            if s[i] == s[j]:\n                dp[i][j] = dp[i + 1][j - 1] + 2\n            else:\n                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])\n    return dp[0][n - 1] if n else 0`,
        javascript: `var longestPalindromeSubseq = function(s) {\n    const n = s.length;\n    if (n === 0) return 0;\n    const dp = [];\n    for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));\n    for (let i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (let j = i + 1; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n};`,
        typescript: `function longestPalindromeSubseq(s: string): number {\n    var n = s.length;\n    if (n === 0) return 0;\n    var dp: number[][] = [];\n    for (var a = 0; a < n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b < n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (var j = i + 1; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n}`,
        java: `public static int longestPalindromeSubseq(String s) {\n    int n = s.length();\n    if (n == 0) return 0;\n    int[][] dp = new int[n][n];\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s.charAt(i) == s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n}`,
        cpp: `int longestPalindromeSubseq(string s) {\n    int n = (int) s.size();\n    if (n == 0) return 0;\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s[i] == s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n}`,
        c: `int longestPalindromeSubseq(const char* s) {\n    int n = (int) strlen(s);\n    if (n == 0) return 0;\n    int* dp = (int*) calloc(n * n, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i * n + i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s[i] == s[j]) {\n                dp[i * n + j] = dp[(i + 1) * n + (j - 1)] + 2;\n            } else {\n                int a = dp[(i + 1) * n + j];\n                int b = dp[i * n + (j - 1)];\n                dp[i * n + j] = a > b ? a : b;\n            }\n        }\n    }\n    int result = dp[0 * n + (n - 1)];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int LongestPalindromeSubseq(string s)\n{\n    int n = s.Length;\n    if (n == 0) return 0;\n    int[,] dp = new int[n, n];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        dp[i, i] = 1;\n        for (int j = i + 1; j < n; j++)\n        {\n            if (s[i] == s[j]) dp[i, j] = dp[i + 1, j - 1] + 2;\n            else dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j - 1]);\n        }\n    }\n    return dp[0, n - 1];\n}`,
        go: `func longestPalindromeSubseq(s string) int {\n\tn := len(s)\n\tif n == 0 {\n\t\treturn 0\n\t}\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tdp[i][i] = 1\n\t\tfor j := i + 1; j < n; j++ {\n\t\t\tif s[i] == s[j] {\n\t\t\t\tdp[i][j] = dp[i+1][j-1] + 2\n\t\t\t} else if dp[i+1][j] > dp[i][j-1] {\n\t\t\t\tdp[i][j] = dp[i+1][j]\n\t\t\t} else {\n\t\t\t\tdp[i][j] = dp[i][j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0][n-1]\n}`,
        kotlin: `fun longestPalindromeSubseq(s: String): Int {\n    val n = s.length\n    if (n == 0) return 0\n    val dp = Array(n) { IntArray(n) }\n    for (i in n - 1 downTo 0) {\n        dp[i][i] = 1\n        for (j in i + 1 until n) {\n            dp[i][j] = if (s[i] == s[j]) dp[i + 1][j - 1] + 2\n            else maxOf(dp[i + 1][j], dp[i][j - 1])\n        }\n    }\n    return dp[0][n - 1]\n}`,
        swift: `func longestPalindromeSubseq(_ s: String) -> Int {\n    let a = Array(s)\n    let n = a.count\n    if n == 0 { return 0 }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    var i = n - 1\n    while i >= 0 {\n        dp[i][i] = 1\n        var j = i + 1\n        while j < n {\n            if a[i] == a[j] { dp[i][j] = dp[i + 1][j - 1] + 2 }\n            else { dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]) }\n            j += 1\n        }\n        i -= 1\n    }\n    return dp[0][n - 1]\n}`,
        rust: `fn longestPalindromeSubseq(s: String) -> i32 {\n    let a = s.as_bytes();\n    let n = a.len();\n    if n == 0 {\n        return 0;\n    }\n    let mut dp = vec![vec![0i32; n]; n];\n    for i in (0..n).rev() {\n        dp[i][i] = 1;\n        for j in (i + 1)..n {\n            if a[i] == a[j] {\n                dp[i][j] = dp[i + 1][j - 1] + 2;\n            } else {\n                dp[i][j] = std::cmp::max(dp[i + 1][j], dp[i][j - 1]);\n            }\n        }\n    }\n    dp[0][n - 1]\n}`,
        php: `function longestPalindromeSubseq($s) {\n    $n = strlen($s);\n    if ($n === 0) return 0;\n    $dp = array();\n    for ($i = 0; $i < $n; $i++) $dp[] = array_fill(0, $n, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $dp[$i][$i] = 1;\n        for ($j = $i + 1; $j < $n; $j++) {\n            if ($s[$i] === $s[$j]) $dp[$i][$j] = $dp[$i + 1][$j - 1] + 2;\n            else $dp[$i][$j] = max($dp[$i + 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $dp[0][$n - 1];\n}`,
        ruby: `def longestPalindromeSubseq(s)\n  n = s.length\n  return 0 if n == 0\n  dp = Array.new(n) { Array.new(n, 0) }\n  (n - 1).downto(0) do |i|\n    dp[i][i] = 1\n    ((i + 1)...n).each do |j|\n      if s[i] == s[j]\n        dp[i][j] = dp[i + 1][j - 1] + 2\n      else\n        dp[i][j] = [dp[i + 1][j], dp[i][j - 1]].max\n      end\n    end\n  end\n  dp[0][n - 1]\nend`,
      },
    };
  })(),

  // ── Minimum Insertion Steps to Make a String Palindrome (LC 1312)
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        dp[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
          if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;
          else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
        }
      }
      return n === 0 ? 0 : n - dp[0][n - 1];
    };
    return {
      slug: "minimum-insertion-steps-to-make-a-string-palindrome",
      title: "Minimum Insertion Steps to Make a String Palindrome",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "minInsertions", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, you may insert any character at any position in one step.\n\nReturn the **minimum number of insertions** needed to make `s` a palindrome.",
        [
          { in: 's = "zzazz"', out: "0", note: "Already a palindrome." },
          { in: 's = "mbadm"', out: "2", note: 'One answer is "mbdadbm".' },
          { in: 's = "leetcode"', out: "5" },
        ],
        ["1 <= s.length <= 500", "s consists of lowercase English letters."]),
      hints: [
        "Characters already forming a palindromic subsequence never need a partner inserted.",
        "Every other character needs exactly one insertion to mirror it.",
        "So the answer is `n - (longest palindromic subsequence)`.",
      ],
      editorial: explain({
        idea: "Insertions only ever add mirrors. The characters you keep untouched must themselves read as a palindrome, so the best you can do is preserve the longest palindromic subsequence and mirror everything else.",
        steps: [
          "Compute the longest palindromic subsequence with the standard interval DP.",
          "Return `n - lps`.",
        ],
        why: "Any palindrome containing `s` as a subsequence has length at least `2n - lps`, and that bound is achievable by inserting a mirror for each of the `n - lps` unmatched characters. So `n - lps` insertions are both necessary and sufficient.",
        time: "O(n²)",
        space: "O(n²), reducible to O(n)",
        pitfalls: [
          "Counting mismatched *pairs* rather than unmatched characters double-counts.",
          "The greedy \"reverse and diff\" idea is really the LPS in disguise — computing `n - LCS(s, reverse(s))` gives the same answer.",
          "Filling the interval table in the wrong direction reads uninitialised cells.",
        ],
      }),
      examples: [
        { input: '"zzazz"', expectedOutput: "0" },
        { input: '"mbadm"', expectedOutput: "2" },
        { input: '"leetcode"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 22, "abcd");
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minInsertions(s: str) -> int:\n    n = len(s)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n - 1, -1, -1):\n        dp[i][i] = 1\n        for j in range(i + 1, n):\n            if s[i] == s[j]:\n                dp[i][j] = dp[i + 1][j - 1] + 2\n            else:\n                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])\n    return n - dp[0][n - 1] if n else 0`,
        javascript: `var minInsertions = function(s) {\n    const n = s.length;\n    if (n === 0) return 0;\n    const dp = [];\n    for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));\n    for (let i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (let j = i + 1; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1];\n};`,
        typescript: `function minInsertions(s: string): number {\n    var n = s.length;\n    if (n === 0) return 0;\n    var dp: number[][] = [];\n    for (var a = 0; a < n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b < n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (var j = i + 1; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1];\n}`,
        java: `public static int minInsertions(String s) {\n    int n = s.length();\n    if (n == 0) return 0;\n    int[][] dp = new int[n][n];\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s.charAt(i) == s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1];\n}`,
        cpp: `int minInsertions(string s) {\n    int n = (int) s.size();\n    if (n == 0) return 0;\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i][i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s[i] == s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;\n            else dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1];\n}`,
        c: `int minInsertions(const char* s) {\n    int n = (int) strlen(s);\n    if (n == 0) return 0;\n    int* dp = (int*) calloc(n * n, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        dp[i * n + i] = 1;\n        for (int j = i + 1; j < n; j++) {\n            if (s[i] == s[j]) {\n                dp[i * n + j] = dp[(i + 1) * n + (j - 1)] + 2;\n            } else {\n                int a = dp[(i + 1) * n + j];\n                int b = dp[i * n + (j - 1)];\n                dp[i * n + j] = a > b ? a : b;\n            }\n        }\n    }\n    int result = n - dp[0 * n + (n - 1)];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int MinInsertions(string s)\n{\n    int n = s.Length;\n    if (n == 0) return 0;\n    int[,] dp = new int[n, n];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        dp[i, i] = 1;\n        for (int j = i + 1; j < n; j++)\n        {\n            if (s[i] == s[j]) dp[i, j] = dp[i + 1, j - 1] + 2;\n            else dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j - 1]);\n        }\n    }\n    return n - dp[0, n - 1];\n}`,
        go: `func minInsertions(s string) int {\n\tn := len(s)\n\tif n == 0 {\n\t\treturn 0\n\t}\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tdp[i][i] = 1\n\t\tfor j := i + 1; j < n; j++ {\n\t\t\tif s[i] == s[j] {\n\t\t\t\tdp[i][j] = dp[i+1][j-1] + 2\n\t\t\t} else if dp[i+1][j] > dp[i][j-1] {\n\t\t\t\tdp[i][j] = dp[i+1][j]\n\t\t\t} else {\n\t\t\t\tdp[i][j] = dp[i][j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn n - dp[0][n-1]\n}`,
        kotlin: `fun minInsertions(s: String): Int {\n    val n = s.length\n    if (n == 0) return 0\n    val dp = Array(n) { IntArray(n) }\n    for (i in n - 1 downTo 0) {\n        dp[i][i] = 1\n        for (j in i + 1 until n) {\n            dp[i][j] = if (s[i] == s[j]) dp[i + 1][j - 1] + 2\n            else maxOf(dp[i + 1][j], dp[i][j - 1])\n        }\n    }\n    return n - dp[0][n - 1]\n}`,
        swift: `func minInsertions(_ s: String) -> Int {\n    let a = Array(s)\n    let n = a.count\n    if n == 0 { return 0 }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    var i = n - 1\n    while i >= 0 {\n        dp[i][i] = 1\n        var j = i + 1\n        while j < n {\n            if a[i] == a[j] { dp[i][j] = dp[i + 1][j - 1] + 2 }\n            else { dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]) }\n            j += 1\n        }\n        i -= 1\n    }\n    return n - dp[0][n - 1]\n}`,
        rust: `fn minInsertions(s: String) -> i32 {\n    let a = s.as_bytes();\n    let n = a.len();\n    if n == 0 {\n        return 0;\n    }\n    let mut dp = vec![vec![0i32; n]; n];\n    for i in (0..n).rev() {\n        dp[i][i] = 1;\n        for j in (i + 1)..n {\n            if a[i] == a[j] {\n                dp[i][j] = dp[i + 1][j - 1] + 2;\n            } else {\n                dp[i][j] = std::cmp::max(dp[i + 1][j], dp[i][j - 1]);\n            }\n        }\n    }\n    n as i32 - dp[0][n - 1]\n}`,
        php: `function minInsertions($s) {\n    $n = strlen($s);\n    if ($n === 0) return 0;\n    $dp = array();\n    for ($i = 0; $i < $n; $i++) $dp[] = array_fill(0, $n, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $dp[$i][$i] = 1;\n        for ($j = $i + 1; $j < $n; $j++) {\n            if ($s[$i] === $s[$j]) $dp[$i][$j] = $dp[$i + 1][$j - 1] + 2;\n            else $dp[$i][$j] = max($dp[$i + 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $n - $dp[0][$n - 1];\n}`,
        ruby: `def minInsertions(s)\n  n = s.length\n  return 0 if n == 0\n  dp = Array.new(n) { Array.new(n, 0) }\n  (n - 1).downto(0) do |i|\n    dp[i][i] = 1\n    ((i + 1)...n).each do |j|\n      if s[i] == s[j]\n        dp[i][j] = dp[i + 1][j - 1] + 2\n      else\n        dp[i][j] = [dp[i + 1][j], dp[i][j - 1]].max\n      end\n    end\n  end\n  n - dp[0][n - 1]\nend`,
      },
    };
  })(),

  // ── Minimum ASCII Delete Sum for Two Strings (LC 712) ───────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const n = s1.length, m = s2.length;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + s1.charCodeAt(i - 1);
      for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + s2.charCodeAt(j - 1);
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
          else dp[i][j] = Math.min(dp[i - 1][j] + s1.charCodeAt(i - 1), dp[i][j - 1] + s2.charCodeAt(j - 1));
        }
      }
      return dp[n][m];
    };
    return {
      slug: "minimum-ascii-delete-sum-for-two-strings",
      title: "Minimum ASCII Delete Sum for Two Strings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "minimumDeleteSum",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `s1` and `s2`, delete characters from either until they are equal.\n\nReturn the **lowest possible sum of the ASCII values** of the deleted characters.",
        [
          { in: 's1 = "sea", s2 = "eat"', out: "231", note: "Delete s from s1 (115) and t from s2 (116) — 231 in total." },
          { in: 's1 = "delete", s2 = "leet"', out: "403" },
          { in: 's1 = "a", s2 = "a"', out: "0" },
        ],
        ["1 <= s1.length, s2.length <= 1000", "Both strings consist of lowercase English letters."]),
      hints: [
        "This is edit distance with weights: only deletions are allowed, and each costs the character's ASCII value.",
        "`dp[i][j]` is the cheapest way to equalise the first `i` characters of `s1` with the first `j` of `s2`.",
        "Matching characters cost nothing; otherwise delete from one side or the other.",
      ],
      editorial: explain({
        idea: "A weighted LCS. Rather than maximising what you keep, minimise the ASCII weight of what you throw away — which the table does directly.",
        steps: [
          "Let `dp[i][j]` be the minimum delete sum for the prefixes `s1[0..i)` and `s2[0..j)`.",
          "Seed the borders: emptying a prefix costs the sum of its ASCII values.",
          "If `s1[i-1] == s2[j-1]`, keep both: `dp[i][j] = dp[i-1][j-1]`.",
          "Otherwise take the cheaper of deleting `s1[i-1]` or `s2[j-1]`.",
          "Return `dp[n][m]`.",
        ],
        why: "Only the last characters of the two prefixes matter. If they match there is an optimal solution keeping both — swapping them in never costs more. If they differ, at least one must be deleted, and the recurrence tries both choices.",
        time: "O(n · m)",
        space: "O(n · m), reducible to O(m)",
        pitfalls: [
          "Zeroing the borders instead of accumulating ASCII sums makes deletions free at the edges.",
          "Maximising the kept LCS length is not the same as minimising the deleted ASCII weight — a long run of cheap characters can beat a short run of expensive ones.",
          "The totals reach roughly 122,000 at the limits, safely inside 32 bits.",
        ],
      }),
      examples: [
        { input: '"sea"\n"eat"', expectedOutput: "231" },
        { input: '"delete"\n"leet"', expectedOutput: "403" },
        { input: '"a"\n"a"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s1 = randLower(rng, 1, 14, "abcde");
        const s2 = randLower(rng, 1, 14, "abcde");
        return { input: `${JSON.stringify(s1)}\n${JSON.stringify(s2)}`, expectedOutput: String(ref(s1, s2)) };
      },
      solutions: {
        python: `def minimumDeleteSum(s1: str, s2: str) -> int:\n    n, m = len(s1), len(s2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        dp[i][0] = dp[i - 1][0] + ord(s1[i - 1])\n    for j in range(1, m + 1):\n        dp[0][j] = dp[0][j - 1] + ord(s2[j - 1])\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if s1[i - 1] == s2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = min(dp[i - 1][j] + ord(s1[i - 1]), dp[i][j - 1] + ord(s2[j - 1]))\n    return dp[n][m]`,
        javascript: `var minimumDeleteSum = function(s1, s2) {\n    const n = s1.length, m = s2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));\n    for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + s1.charCodeAt(i - 1);\n    for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + s2.charCodeAt(j - 1);\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            if (s1.charAt(i - 1) === s2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = Math.min(dp[i - 1][j] + s1.charCodeAt(i - 1), dp[i][j - 1] + s2.charCodeAt(j - 1));\n        }\n    }\n    return dp[n][m];\n};`,
        typescript: `function minimumDeleteSum(s1: string, s2: string): number {\n    var n = s1.length, m = s2.length;\n    var dp: number[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= m; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + s1.charCodeAt(i - 1);\n    for (var j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + s2.charCodeAt(j - 1);\n    for (var p = 1; p <= n; p++) {\n        for (var q = 1; q <= m; q++) {\n            if (s1.charAt(p - 1) === s2.charAt(q - 1)) dp[p][q] = dp[p - 1][q - 1];\n            else dp[p][q] = Math.min(dp[p - 1][q] + s1.charCodeAt(p - 1), dp[p][q - 1] + s2.charCodeAt(q - 1));\n        }\n    }\n    return dp[n][m];\n}`,
        java: `public static int minimumDeleteSum(String s1, String s2) {\n    int n = s1.length(), m = s2.length();\n    int[][] dp = new int[n + 1][m + 1];\n    for (int i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + s1.charAt(i - 1);\n    for (int j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + s2.charAt(j - 1);\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (s1.charAt(i - 1) == s2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = Math.min(dp[i - 1][j] + s1.charAt(i - 1), dp[i][j - 1] + s2.charAt(j - 1));\n        }\n    }\n    return dp[n][m];\n}`,
        cpp: `int minimumDeleteSum(string s1, string s2) {\n    int n = (int) s1.size(), m = (int) s2.size();\n    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));\n    for (int i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + s1[i - 1];\n    for (int j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + s2[j - 1];\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (s1[i - 1] == s2[j - 1]) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = min(dp[i - 1][j] + s1[i - 1], dp[i][j - 1] + s2[j - 1]);\n        }\n    }\n    return dp[n][m];\n}`,
        c: `int minimumDeleteSum(const char* s1, const char* s2) {\n    int n = (int) strlen(s1), m = (int) strlen(s2);\n    int w = m + 1;\n    int* dp = (int*) calloc((n + 1) * w, sizeof(int));\n    for (int i = 1; i <= n; i++) dp[i * w] = dp[(i - 1) * w] + s1[i - 1];\n    for (int j = 1; j <= m; j++) dp[j] = dp[j - 1] + s2[j - 1];\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (s1[i - 1] == s2[j - 1]) {\n                dp[i * w + j] = dp[(i - 1) * w + (j - 1)];\n            } else {\n                int a = dp[(i - 1) * w + j] + s1[i - 1];\n                int b = dp[i * w + (j - 1)] + s2[j - 1];\n                dp[i * w + j] = a < b ? a : b;\n            }\n        }\n    }\n    int result = dp[n * w + m];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int MinimumDeleteSum(string s1, string s2)\n{\n    int n = s1.Length, m = s2.Length;\n    int[,] dp = new int[n + 1, m + 1];\n    for (int i = 1; i <= n; i++) dp[i, 0] = dp[i - 1, 0] + s1[i - 1];\n    for (int j = 1; j <= m; j++) dp[0, j] = dp[0, j - 1] + s2[j - 1];\n    for (int i = 1; i <= n; i++)\n    {\n        for (int j = 1; j <= m; j++)\n        {\n            if (s1[i - 1] == s2[j - 1]) dp[i, j] = dp[i - 1, j - 1];\n            else dp[i, j] = Math.Min(dp[i - 1, j] + s1[i - 1], dp[i, j - 1] + s2[j - 1]);\n        }\n    }\n    return dp[n, m];\n}`,
        go: `func minimumDeleteSum(s1 string, s2 string) int {\n\tn, m := len(s1), len(s2)\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, m+1)\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\tdp[i][0] = dp[i-1][0] + int(s1[i-1])\n\t}\n\tfor j := 1; j <= m; j++ {\n\t\tdp[0][j] = dp[0][j-1] + int(s2[j-1])\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\tfor j := 1; j <= m; j++ {\n\t\t\tif s1[i-1] == s2[j-1] {\n\t\t\t\tdp[i][j] = dp[i-1][j-1]\n\t\t\t} else {\n\t\t\t\ta := dp[i-1][j] + int(s1[i-1])\n\t\t\t\tb := dp[i][j-1] + int(s2[j-1])\n\t\t\t\tif a < b {\n\t\t\t\t\tdp[i][j] = a\n\t\t\t\t} else {\n\t\t\t\t\tdp[i][j] = b\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n][m]\n}`,
        kotlin: `fun minimumDeleteSum(s1: String, s2: String): Int {\n    val n = s1.length\n    val m = s2.length\n    val dp = Array(n + 1) { IntArray(m + 1) }\n    for (i in 1..n) dp[i][0] = dp[i - 1][0] + s1[i - 1].toInt()\n    for (j in 1..m) dp[0][j] = dp[0][j - 1] + s2[j - 1].toInt()\n    for (i in 1..n) {\n        for (j in 1..m) {\n            dp[i][j] = if (s1[i - 1] == s2[j - 1]) dp[i - 1][j - 1]\n            else minOf(dp[i - 1][j] + s1[i - 1].toInt(), dp[i][j - 1] + s2[j - 1].toInt())\n        }\n    }\n    return dp[n][m]\n}`,
        swift: `func minimumDeleteSum(_ s1: String, _ s2: String) -> Int {\n    let a = Array(s1.unicodeScalars).map { Int($0.value) }\n    let b = Array(s2.unicodeScalars).map { Int($0.value) }\n    let n = a.count\n    let m = b.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: m + 1), count: n + 1)\n    for i in 1...max(n, 1) where n > 0 { dp[i][0] = dp[i - 1][0] + a[i - 1] }\n    for j in 1...max(m, 1) where m > 0 { dp[0][j] = dp[0][j - 1] + b[j - 1] }\n    if n == 0 || m == 0 { return dp[n][m] }\n    for i in 1...n {\n        for j in 1...m {\n            if a[i - 1] == b[j - 1] { dp[i][j] = dp[i - 1][j - 1] }\n            else { dp[i][j] = min(dp[i - 1][j] + a[i - 1], dp[i][j - 1] + b[j - 1]) }\n        }\n    }\n    return dp[n][m]\n}`,
        rust: `fn minimumDeleteSum(s1: String, s2: String) -> i32 {\n    let a = s1.as_bytes();\n    let b = s2.as_bytes();\n    let n = a.len();\n    let m = b.len();\n    let mut dp = vec![vec![0i32; m + 1]; n + 1];\n    for i in 1..=n {\n        dp[i][0] = dp[i - 1][0] + a[i - 1] as i32;\n    }\n    for j in 1..=m {\n        dp[0][j] = dp[0][j - 1] + b[j - 1] as i32;\n    }\n    for i in 1..=n {\n        for j in 1..=m {\n            if a[i - 1] == b[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1];\n            } else {\n                dp[i][j] = std::cmp::min(\n                    dp[i - 1][j] + a[i - 1] as i32,\n                    dp[i][j - 1] + b[j - 1] as i32,\n                );\n            }\n        }\n    }\n    dp[n][m]\n}`,
        php: `function minimumDeleteSum($s1, $s2) {\n    $n = strlen($s1); $m = strlen($s2);\n    $dp = array();\n    for ($i = 0; $i <= $n; $i++) $dp[] = array_fill(0, $m + 1, 0);\n    for ($i = 1; $i <= $n; $i++) $dp[$i][0] = $dp[$i - 1][0] + ord($s1[$i - 1]);\n    for ($j = 1; $j <= $m; $j++) $dp[0][$j] = $dp[0][$j - 1] + ord($s2[$j - 1]);\n    for ($i = 1; $i <= $n; $i++) {\n        for ($j = 1; $j <= $m; $j++) {\n            if ($s1[$i - 1] === $s2[$j - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1];\n            else $dp[$i][$j] = min($dp[$i - 1][$j] + ord($s1[$i - 1]), $dp[$i][$j - 1] + ord($s2[$j - 1]));\n        }\n    }\n    return $dp[$n][$m];\n}`,
        ruby: `def minimumDeleteSum(s1, s2)\n  n = s1.length\n  m = s2.length\n  dp = Array.new(n + 1) { Array.new(m + 1, 0) }\n  (1..n).each { |i| dp[i][0] = dp[i - 1][0] + s1[i - 1].ord }\n  (1..m).each { |j| dp[0][j] = dp[0][j - 1] + s2[j - 1].ord }\n  (1..n).each do |i|\n    (1..m).each do |j|\n      if s1[i - 1] == s2[j - 1]\n        dp[i][j] = dp[i - 1][j - 1]\n      else\n        dp[i][j] = [dp[i - 1][j] + s1[i - 1].ord, dp[i][j - 1] + s2[j - 1].ord].min\n      end\n    end\n  end\n  dp[n][m]\nend`,
      },
    };
  })(),

  // ── Uncrossed Lines (LC 1035) ───────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const n = a.length, m = b.length;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return dp[n][m];
    };
    return {
      slug: "uncrossed-lines",
      title: "Uncrossed Lines",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maxUncrossedLines",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Write `nums1` on one line and `nums2` on another. You may draw a connecting line between `nums1[i]` and `nums2[j]` when `nums1[i] == nums2[j]`, provided **no two lines cross** and each number is used at most once.\n\nReturn the maximum number of connecting lines.",
        [
          { in: "nums1 = [1,4,2], nums2 = [1,2,4]", out: "2", note: "Connect the 1s and then either the 4s or the 2s — connecting both would cross." },
          { in: "nums1 = [2,5,1,2,5], nums2 = [10,5,2,1,5,2]", out: "3" },
          { in: "nums1 = [1,3,7,1,7,5], nums2 = [1,9,2,5,1]", out: "2" },
        ],
        ["1 <= nums1.length, nums2.length <= 500", "1 <= nums1[i], nums2[j] <= 2000"]),
      hints: [
        "Non-crossing means the connected indices must increase together on both lines.",
        "That is precisely a common subsequence.",
        "So the answer is the length of the longest common subsequence of the two arrays.",
      ],
      editorial: explain({
        idea: "\"No two lines cross\" forces the matched index pairs to be increasing in both arrays — which is the definition of a common subsequence. The problem is LCS wearing a different hat.",
        steps: [
          "Let `dp[i][j]` be the answer for the prefixes `nums1[0..i)` and `nums2[0..j)`.",
          "If the last elements match, connect them: `dp[i][j] = dp[i-1][j-1] + 1`.",
          "Otherwise take the better of dropping one element from either side.",
          "Return `dp[n][m]`.",
        ],
        why: "Two lines `(i1, j1)` and `(i2, j2)` cross exactly when `i1 < i2` but `j1 > j2`. Forbidding that means the matched pairs form an increasing sequence in both index spaces — a common subsequence, whose maximum length the table computes.",
        time: "O(n · m)",
        space: "O(n · m), reducible to O(m)",
        pitfalls: [
          "Greedily connecting the first available equal pair can block a longer non-crossing set.",
          "Values may repeat, so counting shared values with a frequency map over-reports.",
          "The recurrence is the same as LCS on strings — the elements just happen to be integers.",
        ],
      }),
      examples: [
        { input: "[1,4,2]\n[1,2,4]", expectedOutput: "2" },
        { input: "[2,5,1,2,5]\n[10,5,2,1,5,2]", expectedOutput: "3" },
        { input: "[1,3,7,1,7,5]\n[1,9,2,5,1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const a = Array.from({ length: ri(rng, 1, 14) }, () => ri(rng, 1, 6));
        const b = Array.from({ length: ri(rng, 1, 14) }, () => ri(rng, 1, 6));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxUncrossedLines(nums1: List[int], nums2: List[int]) -> int:\n    n, m = len(nums1), len(nums2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if nums1[i - 1] == nums2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[n][m]`,
        javascript: `var maxUncrossedLines = function(nums1, nums2) {\n    const n = nums1.length, m = nums2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            if (nums1[i - 1] === nums2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n};`,
        typescript: `function maxUncrossedLines(nums1: number[], nums2: number[]): number {\n    var n = nums1.length, m = nums2.length;\n    var dp: number[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= m; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 1; i <= n; i++) {\n        for (var j = 1; j <= m; j++) {\n            if (nums1[i - 1] === nums2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n}`,
        java: `public static int maxUncrossedLines(int[] nums1, int[] nums2) {\n    int n = nums1.length, m = nums2.length;\n    int[][] dp = new int[n + 1][m + 1];\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n}`,
        cpp: `int maxUncrossedLines(vector<int>& nums1, vector<int>& nums2) {\n    int n = (int) nums1.size(), m = (int) nums2.size();\n    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n}`,
        c: `int maxUncrossedLines(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int w = nums2Size + 1;\n    int* dp = (int*) calloc((nums1Size + 1) * w, sizeof(int));\n    for (int i = 1; i <= nums1Size; i++) {\n        for (int j = 1; j <= nums2Size; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) {\n                dp[i * w + j] = dp[(i - 1) * w + (j - 1)] + 1;\n            } else {\n                int a = dp[(i - 1) * w + j];\n                int b = dp[i * w + (j - 1)];\n                dp[i * w + j] = a > b ? a : b;\n            }\n        }\n    }\n    int result = dp[nums1Size * w + nums2Size];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int MaxUncrossedLines(int[] nums1, int[] nums2)\n{\n    int n = nums1.Length, m = nums2.Length;\n    int[,] dp = new int[n + 1, m + 1];\n    for (int i = 1; i <= n; i++)\n    {\n        for (int j = 1; j <= m; j++)\n        {\n            if (nums1[i - 1] == nums2[j - 1]) dp[i, j] = dp[i - 1, j - 1] + 1;\n            else dp[i, j] = Math.Max(dp[i - 1, j], dp[i, j - 1]);\n        }\n    }\n    return dp[n, m];\n}`,
        go: `func maxUncrossedLines(nums1 []int, nums2 []int) int {\n\tn, m := len(nums1), len(nums2)\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, m+1)\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\tfor j := 1; j <= m; j++ {\n\t\t\tif nums1[i-1] == nums2[j-1] {\n\t\t\t\tdp[i][j] = dp[i-1][j-1] + 1\n\t\t\t} else if dp[i-1][j] > dp[i][j-1] {\n\t\t\t\tdp[i][j] = dp[i-1][j]\n\t\t\t} else {\n\t\t\t\tdp[i][j] = dp[i][j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n][m]\n}`,
        kotlin: `fun maxUncrossedLines(nums1: IntArray, nums2: IntArray): Int {\n    val n = nums1.size\n    val m = nums2.size\n    val dp = Array(n + 1) { IntArray(m + 1) }\n    for (i in 1..n) {\n        for (j in 1..m) {\n            dp[i][j] = if (nums1[i - 1] == nums2[j - 1]) dp[i - 1][j - 1] + 1\n            else maxOf(dp[i - 1][j], dp[i][j - 1])\n        }\n    }\n    return dp[n][m]\n}`,
        swift: `func maxUncrossedLines(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    let n = nums1.count\n    let m = nums2.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: m + 1), count: n + 1)\n    for i in 1...n {\n        for j in 1...m {\n            if nums1[i - 1] == nums2[j - 1] { dp[i][j] = dp[i - 1][j - 1] + 1 }\n            else { dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) }\n        }\n    }\n    return dp[n][m]\n}`,
        rust: `fn maxUncrossedLines(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let n = nums1.len();\n    let m = nums2.len();\n    let mut dp = vec![vec![0i32; m + 1]; n + 1];\n    for i in 1..=n {\n        for j in 1..=m {\n            if nums1[i - 1] == nums2[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n            } else {\n                dp[i][j] = std::cmp::max(dp[i - 1][j], dp[i][j - 1]);\n            }\n        }\n    }\n    dp[n][m]\n}`,
        php: `function maxUncrossedLines($nums1, $nums2) {\n    $n = count($nums1); $m = count($nums2);\n    $dp = array();\n    for ($i = 0; $i <= $n; $i++) $dp[] = array_fill(0, $m + 1, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        for ($j = 1; $j <= $m; $j++) {\n            if ($nums1[$i - 1] === $nums2[$j - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;\n            else $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $dp[$n][$m];\n}`,
        ruby: `def maxUncrossedLines(nums1, nums2)\n  n = nums1.length\n  m = nums2.length\n  dp = Array.new(n + 1) { Array.new(m + 1, 0) }\n  (1..n).each do |i|\n    (1..m).each do |j|\n      if nums1[i - 1] == nums2[j - 1]\n        dp[i][j] = dp[i - 1][j - 1] + 1\n      else\n        dp[i][j] = [dp[i - 1][j], dp[i][j - 1]].max\n      end\n    end\n  end\n  dp[n][m]\nend`,
      },
    };
  })(),

  // ── Max Dot Product of Two Subsequences (LC 1458) ──────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const n = a.length, m = b.length;
      const NEG = -1e15;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          const prod = a[i - 1] * b[j - 1];
          let best = prod;
          if (dp[i - 1][j - 1] > 0) best = Math.max(best, prod + dp[i - 1][j - 1]);
          best = Math.max(best, dp[i - 1][j]);
          best = Math.max(best, dp[i][j - 1]);
          dp[i][j] = best;
        }
      }
      return dp[n][m];
    };
    return {
      slug: "max-dot-product-of-two-subsequences",
      title: "Max Dot Product Between Two Subsequences",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maxDotProduct",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two arrays `nums1` and `nums2`, pick a **non-empty** subsequence from each with the **same length**, and return the maximum possible dot product between them.\n\nA subsequence keeps the original order but may skip elements.",
        [
          { in: "nums1 = [2,1,-2,5], nums2 = [3,0,-6]", out: "18", note: "Take [2,-2] and [3,-6]: 2·3 + (-2)·(-6) = 18." },
          { in: "nums1 = [3,-2], nums2 = [2,-6,7]", out: "21", note: "Take [3] and [7]." },
          { in: "nums1 = [-1,-1], nums2 = [1,1]", out: "-1", note: "Every product is negative; the best is a single pair." },
        ],
        ["1 <= nums1.length, nums2.length <= 500", "-1000 <= nums1[i], nums2[j] <= 1000"]),
      hints: [
        "Both subsequences must be non-empty, so the answer can be negative — you cannot start the table at 0.",
        "`dp[i][j]` is the best dot product using the prefixes `nums1[0..i)` and `nums2[0..j)`, with at least one pair chosen.",
        "At each cell, either pair the current elements (optionally on top of a positive earlier result) or skip one of them.",
      ],
      editorial: explain({
        idea: "A pairing DP, but with a twist: because both subsequences must be non-empty, the standard \"start from zero\" table would allow an empty pairing and lose negative-only cases. Pairing the current elements alone is always an option.",
        steps: [
          "Let `dp[i][j]` be the best dot product over the prefixes, requiring at least one pair.",
          "Compute `prod = nums1[i-1] * nums2[j-1]`.",
          "The candidates are: `prod` on its own; `prod + dp[i-1][j-1]` but **only if that earlier value is positive**; `dp[i-1][j]`; and `dp[i][j-1]`.",
          "Take the maximum and return `dp[n][m]`.",
        ],
        why: "Extending an earlier pairing is worth it only when that pairing contributes positively — otherwise starting fresh with just this product is better. Guarding on `> 0` encodes exactly that, and keeps the all-negative case honest.",
        time: "O(n · m)",
        space: "O(n · m)",
        pitfalls: [
          "Initialising the table to 0 silently permits an empty subsequence, giving 0 for `[-1,-1]` vs `[1,1]` instead of -1.",
          "Adding `dp[i-1][j-1]` unconditionally drags good pairs down with earlier negative totals.",
          "The sentinel must be smaller than any achievable dot product — 500 pairs of ±1,000,000 bound it well below 1e15.",
        ],
      }),
      examples: [
        { input: "[2,1,-2,5]\n[3,0,-6]", expectedOutput: "18" },
        { input: "[3,-2]\n[2,-6,7]", expectedOutput: "21" },
        { input: "[-1,-1]\n[1,1]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const a = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, -20, 20));
        const b = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, -20, 20));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxDotProduct(nums1: List[int], nums2: List[int]) -> int:\n    n, m = len(nums1), len(nums2)\n    NEG = -10 ** 15\n    dp = [[NEG] * (m + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            prod = nums1[i - 1] * nums2[j - 1]\n            best = prod\n            if dp[i - 1][j - 1] > 0:\n                best = max(best, prod + dp[i - 1][j - 1])\n            best = max(best, dp[i - 1][j], dp[i][j - 1])\n            dp[i][j] = best\n    return dp[n][m]`,
        javascript: `var maxDotProduct = function(nums1, nums2) {\n    const n = nums1.length, m = nums2.length;\n    const NEG = -1e15;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(NEG));\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            const prod = nums1[i - 1] * nums2[j - 1];\n            let best = prod;\n            if (dp[i - 1][j - 1] > 0) best = Math.max(best, prod + dp[i - 1][j - 1]);\n            best = Math.max(best, dp[i - 1][j]);\n            best = Math.max(best, dp[i][j - 1]);\n            dp[i][j] = best;\n        }\n    }\n    return dp[n][m];\n};`,
        typescript: `function maxDotProduct(nums1: number[], nums2: number[]): number {\n    var n = nums1.length, m = nums2.length;\n    var NEG = -1e15;\n    var dp: number[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= m; b++) row.push(NEG);\n        dp.push(row);\n    }\n    for (var i = 1; i <= n; i++) {\n        for (var j = 1; j <= m; j++) {\n            var prod = nums1[i - 1] * nums2[j - 1];\n            var best = prod;\n            if (dp[i - 1][j - 1] > 0) best = Math.max(best, prod + dp[i - 1][j - 1]);\n            best = Math.max(best, dp[i - 1][j]);\n            best = Math.max(best, dp[i][j - 1]);\n            dp[i][j] = best;\n        }\n    }\n    return dp[n][m];\n}`,
        java: `public static int maxDotProduct(int[] nums1, int[] nums2) {\n    int n = nums1.length, m = nums2.length;\n    long NEG = -1000000000000000L;\n    long[][] dp = new long[n + 1][m + 1];\n    for (long[] row : dp) Arrays.fill(row, NEG);\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            long prod = (long) nums1[i - 1] * nums2[j - 1];\n            long best = prod;\n            if (dp[i - 1][j - 1] > 0) best = Math.max(best, prod + dp[i - 1][j - 1]);\n            best = Math.max(best, dp[i - 1][j]);\n            best = Math.max(best, dp[i][j - 1]);\n            dp[i][j] = best;\n        }\n    }\n    return (int) dp[n][m];\n}`,
        cpp: `int maxDotProduct(vector<int>& nums1, vector<int>& nums2) {\n    int n = (int) nums1.size(), m = (int) nums2.size();\n    long long NEG = -1000000000000000LL;\n    vector<vector<long long>> dp(n + 1, vector<long long>(m + 1, NEG));\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            long long prod = (long long) nums1[i - 1] * nums2[j - 1];\n            long long best = prod;\n            if (dp[i - 1][j - 1] > 0) best = max(best, prod + dp[i - 1][j - 1]);\n            best = max(best, dp[i - 1][j]);\n            best = max(best, dp[i][j - 1]);\n            dp[i][j] = best;\n        }\n    }\n    return (int) dp[n][m];\n}`,
        c: `int maxDotProduct(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int w = nums2Size + 1;\n    long long NEG = -1000000000000000LL;\n    long long* dp = (long long*) malloc((nums1Size + 1) * w * sizeof(long long));\n    for (int i = 0; i < (nums1Size + 1) * w; i++) dp[i] = NEG;\n    for (int i = 1; i <= nums1Size; i++) {\n        for (int j = 1; j <= nums2Size; j++) {\n            long long prod = (long long) nums1[i - 1] * nums2[j - 1];\n            long long best = prod;\n            long long diag = dp[(i - 1) * w + (j - 1)];\n            if (diag > 0 && prod + diag > best) best = prod + diag;\n            if (dp[(i - 1) * w + j] > best) best = dp[(i - 1) * w + j];\n            if (dp[i * w + (j - 1)] > best) best = dp[i * w + (j - 1)];\n            dp[i * w + j] = best;\n        }\n    }\n    int result = (int) dp[nums1Size * w + nums2Size];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int MaxDotProduct(int[] nums1, int[] nums2)\n{\n    int n = nums1.Length, m = nums2.Length;\n    long NEG = -1000000000000000L;\n    long[,] dp = new long[n + 1, m + 1];\n    for (int i = 0; i <= n; i++)\n        for (int j = 0; j <= m; j++) dp[i, j] = NEG;\n    for (int i = 1; i <= n; i++)\n    {\n        for (int j = 1; j <= m; j++)\n        {\n            long prod = (long) nums1[i - 1] * nums2[j - 1];\n            long best = prod;\n            if (dp[i - 1, j - 1] > 0) best = Math.Max(best, prod + dp[i - 1, j - 1]);\n            best = Math.Max(best, dp[i - 1, j]);\n            best = Math.Max(best, dp[i, j - 1]);\n            dp[i, j] = best;\n        }\n    }\n    return (int) dp[n, m];\n}`,
        go: `func maxDotProduct(nums1 []int, nums2 []int) int {\n\tn, m := len(nums1), len(nums2)\n\tNEG := -1000000000000000\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, m+1)\n\t\tfor j := range dp[i] {\n\t\t\tdp[i][j] = NEG\n\t\t}\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\tfor j := 1; j <= m; j++ {\n\t\t\tprod := nums1[i-1] * nums2[j-1]\n\t\t\tbest := prod\n\t\t\tif dp[i-1][j-1] > 0 && prod+dp[i-1][j-1] > best {\n\t\t\t\tbest = prod + dp[i-1][j-1]\n\t\t\t}\n\t\t\tif dp[i-1][j] > best {\n\t\t\t\tbest = dp[i-1][j]\n\t\t\t}\n\t\t\tif dp[i][j-1] > best {\n\t\t\t\tbest = dp[i][j-1]\n\t\t\t}\n\t\t\tdp[i][j] = best\n\t\t}\n\t}\n\treturn dp[n][m]\n}`,
        kotlin: `fun maxDotProduct(nums1: IntArray, nums2: IntArray): Int {\n    val n = nums1.size\n    val m = nums2.size\n    val NEG = -1000000000000000L\n    val dp = Array(n + 1) { LongArray(m + 1) { NEG } }\n    for (i in 1..n) {\n        for (j in 1..m) {\n            val prod = nums1[i - 1].toLong() * nums2[j - 1]\n            var best = prod\n            if (dp[i - 1][j - 1] > 0) best = maxOf(best, prod + dp[i - 1][j - 1])\n            best = maxOf(best, dp[i - 1][j])\n            best = maxOf(best, dp[i][j - 1])\n            dp[i][j] = best\n        }\n    }\n    return dp[n][m].toInt()\n}`,
        swift: `func maxDotProduct(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    let n = nums1.count\n    let m = nums2.count\n    let NEG = -1000000000000000\n    var dp = [[Int]](repeating: [Int](repeating: NEG, count: m + 1), count: n + 1)\n    for i in 1...n {\n        for j in 1...m {\n            let prod = nums1[i - 1] * nums2[j - 1]\n            var best = prod\n            if dp[i - 1][j - 1] > 0 { best = max(best, prod + dp[i - 1][j - 1]) }\n            best = max(best, dp[i - 1][j])\n            best = max(best, dp[i][j - 1])\n            dp[i][j] = best\n        }\n    }\n    return dp[n][m]\n}`,
        rust: `fn maxDotProduct(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let n = nums1.len();\n    let m = nums2.len();\n    let neg: i64 = -1000000000000000;\n    let mut dp = vec![vec![neg; m + 1]; n + 1];\n    for i in 1..=n {\n        for j in 1..=m {\n            let prod = nums1[i - 1] as i64 * nums2[j - 1] as i64;\n            let mut best = prod;\n            if dp[i - 1][j - 1] > 0 {\n                best = std::cmp::max(best, prod + dp[i - 1][j - 1]);\n            }\n            best = std::cmp::max(best, dp[i - 1][j]);\n            best = std::cmp::max(best, dp[i][j - 1]);\n            dp[i][j] = best;\n        }\n    }\n    dp[n][m] as i32\n}`,
        php: `function maxDotProduct($nums1, $nums2) {\n    $n = count($nums1); $m = count($nums2);\n    $NEG = -1000000000000000;\n    $dp = array();\n    for ($i = 0; $i <= $n; $i++) $dp[] = array_fill(0, $m + 1, $NEG);\n    for ($i = 1; $i <= $n; $i++) {\n        for ($j = 1; $j <= $m; $j++) {\n            $prod = $nums1[$i - 1] * $nums2[$j - 1];\n            $best = $prod;\n            if ($dp[$i - 1][$j - 1] > 0) $best = max($best, $prod + $dp[$i - 1][$j - 1]);\n            $best = max($best, $dp[$i - 1][$j]);\n            $best = max($best, $dp[$i][$j - 1]);\n            $dp[$i][$j] = $best;\n        }\n    }\n    return $dp[$n][$m];\n}`,
        ruby: `def maxDotProduct(nums1, nums2)\n  n = nums1.length\n  m = nums2.length\n  neg = -10**15\n  dp = Array.new(n + 1) { Array.new(m + 1, neg) }\n  (1..n).each do |i|\n    (1..m).each do |j|\n      prod = nums1[i - 1] * nums2[j - 1]\n      best = prod\n      best = [best, prod + dp[i - 1][j - 1]].max if dp[i - 1][j - 1] > 0\n      best = [best, dp[i - 1][j], dp[i][j - 1]].max\n      dp[i][j] = best\n    end\n  end\n  dp[n][m]\nend`,
      },
    };
  })(),

  // ── Distinct Subsequences (LC 115) ──────────────────────────────
  (() => {
    const ref = (s: string, t: string) => {
      const n = s.length, m = t.length;
      const dp = new Array(m + 1).fill(0);
      dp[0] = 1;
      for (let i = 1; i <= n; i++) {
        for (let j = m; j >= 1; j--) {
          if (s[i - 1] === t[j - 1]) dp[j] += dp[j - 1];
        }
      }
      return dp[m];
    };
    return {
      slug: "distinct-subsequences",
      title: "Distinct Subsequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Bloomberg"],
      signature: {
        funcName: "numDistinct",
        params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `s` and `t`, return the number of **distinct subsequences of `s`** that equal `t`.\n\nSubsequences occurring at different index sets count separately.",
        [
          { in: 's = "rabbbit", t = "rabbit"', out: "3", note: "Any one of the three b's can be the one dropped." },
          { in: 's = "babgbag", t = "bag"', out: "5" },
          { in: 's = "abc", t = "abcd"', out: "0" },
        ],
        ["1 <= s.length, t.length <= 1000", "Both consist of English letters.", "The answer fits in a 32-bit signed integer."]),
      hints: [
        "`dp[i][j]` counts the ways to build `t[0..j)` from `s[0..i)`.",
        "You may always skip `s[i-1]`; when it matches `t[j-1]` you may also consume it.",
        "Rolling the table down to one row works if you iterate `j` **downwards**.",
      ],
      editorial: explain({
        idea: "Count matchings rather than searching for them. Each character of `s` either participates in the match or is skipped, and the two options add.",
        steps: [
          "Let `dp[j]` be the number of ways to form `t[0..j)` using the prefix of `s` processed so far; start with `dp[0] = 1`.",
          "For each character of `s`, sweep `j` from `m` down to 1.",
          "When `s[i-1] == t[j-1]`, add `dp[j-1]` to `dp[j]` — consuming this character to extend a shorter match.",
          "Return `dp[m]`.",
        ],
        why: "`dp[j]` before the update already counts matches that skip `s[i-1]`, so adding `dp[j-1]` folds in the matches that use it. Sweeping `j` downwards guarantees `dp[j-1]` still holds the previous row's value, which is what the recurrence needs.",
        time: "O(n · m)",
        space: "O(m)",
        pitfalls: [
          "Sweeping `j` upwards uses the already-updated `dp[j-1]` and counts the same character twice.",
          "`dp[0] = 1` is essential: there is exactly one way to form the empty string.",
          "Recursing without memoisation is exponential on inputs like `\"babgbag\"` scaled up.",
        ],
      }),
      examples: [
        { input: '"rabbbit"\n"rabbit"', expectedOutput: "3" },
        { input: '"babgbag"\n"bag"', expectedOutput: "5" },
        { input: '"abc"\n"abcd"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 14, "abc");
        const t = randLower(rng, 1, 4, "abc");
        return { input: `${JSON.stringify(s)}\n${JSON.stringify(t)}`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: `def numDistinct(s: str, t: str) -> int:\n    m = len(t)\n    dp = [0] * (m + 1)\n    dp[0] = 1\n    for ch in s:\n        for j in range(m, 0, -1):\n            if ch == t[j - 1]:\n                dp[j] += dp[j - 1]\n    return dp[m]`,
        javascript: `var numDistinct = function(s, t) {\n    const m = t.length;\n    const dp = new Array(m + 1).fill(0);\n    dp[0] = 1;\n    for (let i = 0; i < s.length; i++) {\n        for (let j = m; j >= 1; j--) {\n            if (s.charAt(i) === t.charAt(j - 1)) dp[j] += dp[j - 1];\n        }\n    }\n    return dp[m];\n};`,
        typescript: `function numDistinct(s: string, t: string): number {\n    var m = t.length;\n    var dp: number[] = [];\n    for (var k = 0; k <= m; k++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 0; i < s.length; i++) {\n        for (var j = m; j >= 1; j--) {\n            if (s.charAt(i) === t.charAt(j - 1)) dp[j] += dp[j - 1];\n        }\n    }\n    return dp[m];\n}`,
        java: `public static int numDistinct(String s, String t) {\n    int m = t.length();\n    long[] dp = new long[m + 1];\n    dp[0] = 1;\n    for (int i = 0; i < s.length(); i++) {\n        for (int j = m; j >= 1; j--) {\n            if (s.charAt(i) == t.charAt(j - 1)) dp[j] += dp[j - 1];\n        }\n    }\n    return (int) dp[m];\n}`,
        cpp: `int numDistinct(string s, string t) {\n    int m = (int) t.size();\n    vector<long long> dp(m + 1, 0);\n    dp[0] = 1;\n    for (int i = 0; i < (int) s.size(); i++) {\n        for (int j = m; j >= 1; j--) {\n            if (s[i] == t[j - 1]) dp[j] += dp[j - 1];\n        }\n    }\n    return (int) dp[m];\n}`,
        c: `int numDistinct(const char* s, const char* t) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(t);\n    long long* dp = (long long*) calloc(m + 1, sizeof(long long));\n    dp[0] = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = m; j >= 1; j--) {\n            if (s[i] == t[j - 1]) dp[j] += dp[j - 1];\n        }\n    }\n    int result = (int) dp[m];\n    free(dp);\n    return result;\n}`,
        csharp: `public static int NumDistinct(string s, string t)\n{\n    int m = t.Length;\n    long[] dp = new long[m + 1];\n    dp[0] = 1;\n    for (int i = 0; i < s.Length; i++)\n    {\n        for (int j = m; j >= 1; j--)\n        {\n            if (s[i] == t[j - 1]) dp[j] += dp[j - 1];\n        }\n    }\n    return (int) dp[m];\n}`,
        go: `func numDistinct(s string, t string) int {\n\tm := len(t)\n\tdp := make([]int, m+1)\n\tdp[0] = 1\n\tfor i := 0; i < len(s); i++ {\n\t\tfor j := m; j >= 1; j-- {\n\t\t\tif s[i] == t[j-1] {\n\t\t\t\tdp[j] += dp[j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[m]\n}`,
        kotlin: `fun numDistinct(s: String, t: String): Int {\n    val m = t.length\n    val dp = LongArray(m + 1)\n    dp[0] = 1\n    for (i in s.indices) {\n        for (j in m downTo 1) {\n            if (s[i] == t[j - 1]) dp[j] += dp[j - 1]\n        }\n    }\n    return dp[m].toInt()\n}`,
        swift: `func numDistinct(_ s: String, _ t: String) -> Int {\n    let a = Array(s)\n    let b = Array(t)\n    let m = b.count\n    var dp = [Int](repeating: 0, count: m + 1)\n    dp[0] = 1\n    for i in 0..<a.count {\n        var j = m\n        while j >= 1 {\n            if a[i] == b[j - 1] { dp[j] += dp[j - 1] }\n            j -= 1\n        }\n    }\n    return dp[m]\n}`,
        rust: `fn numDistinct(s: String, t: String) -> i32 {\n    let a = s.as_bytes();\n    let b = t.as_bytes();\n    let m = b.len();\n    let mut dp = vec![0i64; m + 1];\n    dp[0] = 1;\n    for i in 0..a.len() {\n        let mut j = m;\n        while j >= 1 {\n            if a[i] == b[j - 1] {\n                dp[j] += dp[j - 1];\n            }\n            j -= 1;\n        }\n    }\n    dp[m] as i32\n}`,
        php: `function numDistinct($s, $t) {\n    $m = strlen($t);\n    $dp = array_fill(0, $m + 1, 0);\n    $dp[0] = 1;\n    for ($i = 0; $i < strlen($s); $i++) {\n        for ($j = $m; $j >= 1; $j--) {\n            if ($s[$i] === $t[$j - 1]) $dp[$j] += $dp[$j - 1];\n        }\n    }\n    return $dp[$m];\n}`,
        ruby: `def numDistinct(s, t)\n  m = t.length\n  dp = Array.new(m + 1, 0)\n  dp[0] = 1\n  s.each_char do |ch|\n    m.downto(1) do |j|\n      dp[j] += dp[j - 1] if ch == t[j - 1]\n    end\n  end\n  dp[m]\nend`,
      },
    };
  })(),

  // ── Wildcard Matching (LC 44) ───────────────────────────────────
  (() => {
    const ref = (s: string, p: string) => {
      const n = s.length, m = p.length;
      const dp: boolean[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
      dp[0][0] = true;
      for (let j = 1; j <= m; j++) if (p[j - 1] === "*") dp[0][j] = dp[0][j - 1];
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (p[j - 1] === "*") dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
          else if (p[j - 1] === "?" || p[j - 1] === s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
        }
      }
      return dp[n][m];
    };
    return {
      slug: "wildcard-matching",
      title: "Wildcard Matching",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Greedy", "Amazon", "Google", "Facebook"],
      signature: {
        funcName: "isMatch",
        params: [{ name: "s", type: "string" as const }, { name: "p", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Implement wildcard pattern matching over the **whole** string:\n\n- `?` matches any single character.\n- `*` matches any sequence of characters, including the empty sequence.\n\nReturn `true` if `p` matches all of `s`.",
        [
          { in: 's = "aa", p = "a"', out: "false", note: "The pattern must cover the entire string." },
          { in: 's = "aa", p = "*"', out: "true" },
          { in: 's = "cb", p = "?a"', out: "false", note: "? matches c, but a does not match b." },
        ],
        ["0 <= s.length, p.length <= 2000", "s consists of lowercase English letters.", "p consists of lowercase English letters, '?' and '*'."]),
      hints: [
        "`dp[i][j]` = does `p[0..j)` match `s[0..i)`?",
        "A `*` either consumes one more character of `s` (`dp[i-1][j]`) or matches nothing (`dp[i][j-1]`).",
        "The first row needs care: a pattern of only stars matches the empty string.",
      ],
      editorial: explain({
        idea: "A two-dimensional boolean table over prefixes. The only branching character is `*`, which contributes exactly two transitions.",
        steps: [
          "Set `dp[0][0] = true`; the empty pattern matches the empty string.",
          "Fill row 0: `dp[0][j] = dp[0][j-1]` when `p[j-1]` is `*`, otherwise false.",
          "For each cell: if the pattern character is `*`, `dp[i][j] = dp[i-1][j] || dp[i][j-1]`.",
          "If it is `?` or equals `s[i-1]`, `dp[i][j] = dp[i-1][j-1]`.",
          "Otherwise leave it false. Return `dp[n][m]`.",
        ],
        why: "`dp[i-1][j]` means the star has already absorbed some characters and takes one more; `dp[i][j-1]` means the star absorbs nothing. Every other pattern character consumes exactly one string character, so it steps diagonally.",
        time: "O(n · m)",
        space: "O(n · m), reducible to O(m)",
        pitfalls: [
          "Forgetting the row-0 star handling rejects `s = \"\"` with `p = \"***\"`.",
          "Treating `*` like the regex `*` (which applies to the preceding character) is a different problem entirely — here it stands alone.",
          "A greedy two-pointer solution with backtracking also works and is O(1) space, but is much easier to get wrong.",
        ],
      }),
      examples: [
        { input: '"aa"\n"a"', expectedOutput: "false" },
        { input: '"aa"\n"*"', expectedOutput: "true" },
        { input: '"cb"\n"?a"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 0, 10, "abc");
        const alphabet = "abc?*";
        const plen = ri(rng, 0, 8);
        let p = "";
        for (let i = 0; i < plen; i++) p += alphabet[ri(rng, 0, alphabet.length - 1)];
        return { input: `${JSON.stringify(s)}\n${JSON.stringify(p)}`, expectedOutput: ref(s, p) ? "true" : "false" };
      },
      solutions: {
        python: `def isMatch(s: str, p: str) -> bool:\n    n, m = len(s), len(p)\n    dp = [[False] * (m + 1) for _ in range(n + 1)]\n    dp[0][0] = True\n    for j in range(1, m + 1):\n        if p[j - 1] == '*':\n            dp[0][j] = dp[0][j - 1]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if p[j - 1] == '*':\n                dp[i][j] = dp[i - 1][j] or dp[i][j - 1]\n            elif p[j - 1] == '?' or p[j - 1] == s[i - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n    return dp[n][m]`,
        javascript: `var isMatch = function(s, p) {\n    const n = s.length, m = p.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(false));\n    dp[0][0] = true;\n    for (let j = 1; j <= m; j++) {\n        if (p.charAt(j - 1) === "*") dp[0][j] = dp[0][j - 1];\n    }\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            const pc = p.charAt(j - 1);\n            if (pc === "*") dp[i][j] = dp[i - 1][j] || dp[i][j - 1];\n            else if (pc === "?" || pc === s.charAt(i - 1)) dp[i][j] = dp[i - 1][j - 1];\n        }\n    }\n    return dp[n][m];\n};`,
        typescript: `function isMatch(s: string, p: string): boolean {\n    var n = s.length, m = p.length;\n    var dp: boolean[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: boolean[] = [];\n        for (var b = 0; b <= m; b++) row.push(false);\n        dp.push(row);\n    }\n    dp[0][0] = true;\n    for (var j = 1; j <= m; j++) {\n        if (p.charAt(j - 1) === "*") dp[0][j] = dp[0][j - 1];\n    }\n    for (var i = 1; i <= n; i++) {\n        for (var k = 1; k <= m; k++) {\n            var pc = p.charAt(k - 1);\n            if (pc === "*") dp[i][k] = dp[i - 1][k] || dp[i][k - 1];\n            else if (pc === "?" || pc === s.charAt(i - 1)) dp[i][k] = dp[i - 1][k - 1];\n        }\n    }\n    return dp[n][m];\n}`,
        java: `public static boolean isMatch(String s, String p) {\n    int n = s.length(), m = p.length();\n    boolean[][] dp = new boolean[n + 1][m + 1];\n    dp[0][0] = true;\n    for (int j = 1; j <= m; j++) {\n        if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 1];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p.charAt(j - 1);\n            if (pc == '*') dp[i][j] = dp[i - 1][j] || dp[i][j - 1];\n            else if (pc == '?' || pc == s.charAt(i - 1)) dp[i][j] = dp[i - 1][j - 1];\n        }\n    }\n    return dp[n][m];\n}`,
        cpp: `bool isMatch(string s, string p) {\n    int n = (int) s.size(), m = (int) p.size();\n    vector<vector<char>> dp(n + 1, vector<char>(m + 1, 0));\n    dp[0][0] = 1;\n    for (int j = 1; j <= m; j++) {\n        if (p[j - 1] == '*') dp[0][j] = dp[0][j - 1];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p[j - 1];\n            if (pc == '*') dp[i][j] = (dp[i - 1][j] || dp[i][j - 1]) ? 1 : 0;\n            else if (pc == '?' || pc == s[i - 1]) dp[i][j] = dp[i - 1][j - 1];\n        }\n    }\n    return dp[n][m] != 0;\n}`,
        c: `bool isMatch(const char* s, const char* p) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(p);\n    int w = m + 1;\n    char* dp = (char*) calloc((n + 1) * w, sizeof(char));\n    dp[0] = 1;\n    for (int j = 1; j <= m; j++) {\n        if (p[j - 1] == '*') dp[j] = dp[j - 1];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p[j - 1];\n            if (pc == '*') {\n                dp[i * w + j] = (dp[(i - 1) * w + j] || dp[i * w + (j - 1)]) ? 1 : 0;\n            } else if (pc == '?' || pc == s[i - 1]) {\n                dp[i * w + j] = dp[(i - 1) * w + (j - 1)];\n            }\n        }\n    }\n    bool result = dp[n * w + m] != 0;\n    free(dp);\n    return result;\n}`,
        csharp: `public static bool IsMatch(string s, string p)\n{\n    int n = s.Length, m = p.Length;\n    bool[,] dp = new bool[n + 1, m + 1];\n    dp[0, 0] = true;\n    for (int j = 1; j <= m; j++)\n    {\n        if (p[j - 1] == '*') dp[0, j] = dp[0, j - 1];\n    }\n    for (int i = 1; i <= n; i++)\n    {\n        for (int j = 1; j <= m; j++)\n        {\n            char pc = p[j - 1];\n            if (pc == '*') dp[i, j] = dp[i - 1, j] || dp[i, j - 1];\n            else if (pc == '?' || pc == s[i - 1]) dp[i, j] = dp[i - 1, j - 1];\n        }\n    }\n    return dp[n, m];\n}`,
        go: `func isMatch(s string, p string) bool {\n\tn, m := len(s), len(p)\n\tdp := make([][]bool, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]bool, m+1)\n\t}\n\tdp[0][0] = true\n\tfor j := 1; j <= m; j++ {\n\t\tif p[j-1] == '*' {\n\t\t\tdp[0][j] = dp[0][j-1]\n\t\t}\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\tfor j := 1; j <= m; j++ {\n\t\t\tpc := p[j-1]\n\t\t\tif pc == '*' {\n\t\t\t\tdp[i][j] = dp[i-1][j] || dp[i][j-1]\n\t\t\t} else if pc == '?' || pc == s[i-1] {\n\t\t\t\tdp[i][j] = dp[i-1][j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n][m]\n}`,
        kotlin: `fun isMatch(s: String, p: String): Boolean {\n    val n = s.length\n    val m = p.length\n    val dp = Array(n + 1) { BooleanArray(m + 1) }\n    dp[0][0] = true\n    for (j in 1..m) {\n        if (p[j - 1] == '*') dp[0][j] = dp[0][j - 1]\n    }\n    for (i in 1..n) {\n        for (j in 1..m) {\n            val pc = p[j - 1]\n            if (pc == '*') dp[i][j] = dp[i - 1][j] || dp[i][j - 1]\n            else if (pc == '?' || pc == s[i - 1]) dp[i][j] = dp[i - 1][j - 1]\n        }\n    }\n    return dp[n][m]\n}`,
        swift: `func isMatch(_ s: String, _ p: String) -> Bool {\n    let a = Array(s)\n    let b = Array(p)\n    let n = a.count\n    let m = b.count\n    var dp = [[Bool]](repeating: [Bool](repeating: false, count: m + 1), count: n + 1)\n    dp[0][0] = true\n    var j = 1\n    while j <= m {\n        if b[j - 1] == "*" { dp[0][j] = dp[0][j - 1] }\n        j += 1\n    }\n    var i = 1\n    while i <= n {\n        var k = 1\n        while k <= m {\n            let pc = b[k - 1]\n            if pc == "*" { dp[i][k] = dp[i - 1][k] || dp[i][k - 1] }\n            else if pc == "?" || pc == a[i - 1] { dp[i][k] = dp[i - 1][k - 1] }\n            k += 1\n        }\n        i += 1\n    }\n    return dp[n][m]\n}`,
        rust: `fn isMatch(s: String, p: String) -> bool {\n    let a = s.as_bytes();\n    let b = p.as_bytes();\n    let n = a.len();\n    let m = b.len();\n    let mut dp = vec![vec![false; m + 1]; n + 1];\n    dp[0][0] = true;\n    for j in 1..=m {\n        if b[j - 1] == b'*' {\n            dp[0][j] = dp[0][j - 1];\n        }\n    }\n    for i in 1..=n {\n        for j in 1..=m {\n            let pc = b[j - 1];\n            if pc == b'*' {\n                dp[i][j] = dp[i - 1][j] || dp[i][j - 1];\n            } else if pc == b'?' || pc == a[i - 1] {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    dp[n][m]\n}`,
        php: `function isMatch($s, $p) {\n    $n = strlen($s); $m = strlen($p);\n    $dp = array();\n    for ($i = 0; $i <= $n; $i++) $dp[] = array_fill(0, $m + 1, false);\n    $dp[0][0] = true;\n    for ($j = 1; $j <= $m; $j++) {\n        if ($p[$j - 1] === '*') $dp[0][$j] = $dp[0][$j - 1];\n    }\n    for ($i = 1; $i <= $n; $i++) {\n        for ($j = 1; $j <= $m; $j++) {\n            $pc = $p[$j - 1];\n            if ($pc === '*') $dp[$i][$j] = $dp[$i - 1][$j] || $dp[$i][$j - 1];\n            else if ($pc === '?' || $pc === $s[$i - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1];\n        }\n    }\n    return $dp[$n][$m];\n}`,
        ruby: `def isMatch(s, p)\n  n = s.length\n  m = p.length\n  dp = Array.new(n + 1) { Array.new(m + 1, false) }\n  dp[0][0] = true\n  (1..m).each do |j|\n    dp[0][j] = dp[0][j - 1] if p[j - 1] == "*"\n  end\n  (1..n).each do |i|\n    (1..m).each do |j|\n      pc = p[j - 1]\n      if pc == "*"\n        dp[i][j] = dp[i - 1][j] || dp[i][j - 1]\n      elsif pc == "?" || pc == s[i - 1]\n        dp[i][j] = dp[i - 1][j - 1]\n      end\n    end\n  end\n  dp[n][m]\nend`,
      },
    };
  })(),

  // ── Palindrome Partitioning II (LC 132) ─────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      if (n === 0) return 0;
      const isPal: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = i; j < n; j++) {
          if (s[i] === s[j] && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;
        }
      }
      const cuts = new Array(n).fill(0);
      for (let j = 0; j < n; j++) {
        if (isPal[0][j]) { cuts[j] = 0; continue; }
        let best = j;
        for (let i = 1; i <= j; i++) {
          if (isPal[i][j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;
        }
        cuts[j] = best;
      }
      return cuts[n - 1];
    };
    return {
      slug: "palindrome-partitioning-ii",
      title: "Palindrome Partitioning II",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minCut", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, partition it so that **every** part is a palindrome.\n\nReturn the **minimum number of cuts** needed.",
        [
          { in: 's = "aab"', out: "1", note: 'One cut gives ["aa", "b"].' },
          { in: 's = "a"', out: "0" },
          { in: 's = "ab"', out: "1" },
        ],
        ["1 <= s.length <= 2000", "s consists of lowercase English letters."]),
      hints: [
        "Precompute which substrings are palindromes before worrying about cuts.",
        "`cuts[j]` = minimum cuts for the prefix ending at `j`.",
        "If `s[0..j]` is itself a palindrome, `cuts[j]` is 0; otherwise try every palindromic suffix ending at `j`.",
      ],
      editorial: explain({
        idea: "Two tables: one saying whether each substring is a palindrome, and one giving the minimum cuts per prefix. The second consults the first in O(1) per candidate split.",
        steps: [
          "Build `isPal[i][j]` bottom-up: true when the endpoints match and the interior is a palindrome (or is shorter than two characters).",
          "For each prefix end `j`: if `s[0..j]` is a palindrome, `cuts[j] = 0`.",
          "Otherwise, over every `i` from 1 to `j` where `s[i..j]` is a palindrome, take `min(cuts[i-1] + 1)`.",
          "Return `cuts[n-1]`.",
        ],
        why: "Any optimal partition of `s[0..j]` ends with some palindromic block `s[i..j]`. Splitting at its start reduces the problem to the already-solved prefix `s[0..i-1]` plus one cut, so the minimum over all valid `i` is exact.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Re-checking palindromes inside the cut loop makes it O(n³) and times out at `n = 2000`.",
          "Initialising `cuts[j]` to `j` (cut everywhere) matters — it is the worst case and a valid upper bound.",
          "The answer counts **cuts**, not parts: a single palindrome needs 0.",
        ],
      }),
      examples: [
        { input: '"aab"', expectedOutput: "1" },
        { input: '"a"', expectedOutput: "0" },
        { input: '"ab"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 22, "abc");
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minCut(s: str) -> int:\n    n = len(s)\n    if n == 0:\n        return 0\n    is_pal = [[False] * n for _ in range(n)]\n    for i in range(n - 1, -1, -1):\n        for j in range(i, n):\n            if s[i] == s[j] and (j - i < 2 or is_pal[i + 1][j - 1]):\n                is_pal[i][j] = True\n    cuts = [0] * n\n    for j in range(n):\n        if is_pal[0][j]:\n            cuts[j] = 0\n            continue\n        best = j\n        for i in range(1, j + 1):\n            if is_pal[i][j] and cuts[i - 1] + 1 < best:\n                best = cuts[i - 1] + 1\n        cuts[j] = best\n    return cuts[n - 1]`,
        javascript: `var minCut = function(s) {\n    const n = s.length;\n    if (n === 0) return 0;\n    const isPal = [];\n    for (let i = 0; i < n; i++) isPal.push(new Array(n).fill(false));\n    for (let i = n - 1; i >= 0; i--) {\n        for (let j = i; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j) && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;\n        }\n    }\n    const cuts = new Array(n).fill(0);\n    for (let j = 0; j < n; j++) {\n        if (isPal[0][j]) { cuts[j] = 0; continue; }\n        let best = j;\n        for (let i = 1; i <= j; i++) {\n            if (isPal[i][j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;\n        }\n        cuts[j] = best;\n    }\n    return cuts[n - 1];\n};`,
        typescript: `function minCut(s: string): number {\n    var n = s.length;\n    if (n === 0) return 0;\n    var isPal: boolean[][] = [];\n    for (var a = 0; a < n; a++) {\n        var row: boolean[] = [];\n        for (var b = 0; b < n; b++) row.push(false);\n        isPal.push(row);\n    }\n    for (var i = n - 1; i >= 0; i--) {\n        for (var j = i; j < n; j++) {\n            if (s.charAt(i) === s.charAt(j) && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;\n        }\n    }\n    var cuts: number[] = [];\n    for (var c = 0; c < n; c++) cuts.push(0);\n    for (var k = 0; k < n; k++) {\n        if (isPal[0][k]) { cuts[k] = 0; continue; }\n        var best = k;\n        for (var m = 1; m <= k; m++) {\n            if (isPal[m][k] && cuts[m - 1] + 1 < best) best = cuts[m - 1] + 1;\n        }\n        cuts[k] = best;\n    }\n    return cuts[n - 1];\n}`,
        java: `public static int minCut(String s) {\n    int n = s.length();\n    if (n == 0) return 0;\n    boolean[][] isPal = new boolean[n][n];\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = i; j < n; j++) {\n            if (s.charAt(i) == s.charAt(j) && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true;\n        }\n    }\n    int[] cuts = new int[n];\n    for (int j = 0; j < n; j++) {\n        if (isPal[0][j]) { cuts[j] = 0; continue; }\n        int best = j;\n        for (int i = 1; i <= j; i++) {\n            if (isPal[i][j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;\n        }\n        cuts[j] = best;\n    }\n    return cuts[n - 1];\n}`,
        cpp: `int minCut(string s) {\n    int n = (int) s.size();\n    if (n == 0) return 0;\n    vector<vector<char>> isPal(n, vector<char>(n, 0));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = i; j < n; j++) {\n            if (s[i] == s[j] && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = 1;\n        }\n    }\n    vector<int> cuts(n, 0);\n    for (int j = 0; j < n; j++) {\n        if (isPal[0][j]) { cuts[j] = 0; continue; }\n        int best = j;\n        for (int i = 1; i <= j; i++) {\n            if (isPal[i][j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;\n        }\n        cuts[j] = best;\n    }\n    return cuts[n - 1];\n}`,
        c: `int minCut(const char* s) {\n    int n = (int) strlen(s);\n    if (n == 0) return 0;\n    char* isPal = (char*) calloc(n * n, sizeof(char));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = i; j < n; j++) {\n            if (s[i] == s[j] && (j - i < 2 || isPal[(i + 1) * n + (j - 1)])) isPal[i * n + j] = 1;\n        }\n    }\n    int* cuts = (int*) calloc(n, sizeof(int));\n    for (int j = 0; j < n; j++) {\n        if (isPal[0 * n + j]) { cuts[j] = 0; continue; }\n        int best = j;\n        for (int i = 1; i <= j; i++) {\n            if (isPal[i * n + j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;\n        }\n        cuts[j] = best;\n    }\n    int result = cuts[n - 1];\n    free(isPal);\n    free(cuts);\n    return result;\n}`,
        csharp: `public static int MinCut(string s)\n{\n    int n = s.Length;\n    if (n == 0) return 0;\n    bool[,] isPal = new bool[n, n];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        for (int j = i; j < n; j++)\n        {\n            if (s[i] == s[j] && (j - i < 2 || isPal[i + 1, j - 1])) isPal[i, j] = true;\n        }\n    }\n    int[] cuts = new int[n];\n    for (int j = 0; j < n; j++)\n    {\n        if (isPal[0, j]) { cuts[j] = 0; continue; }\n        int best = j;\n        for (int i = 1; i <= j; i++)\n        {\n            if (isPal[i, j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1;\n        }\n        cuts[j] = best;\n    }\n    return cuts[n - 1];\n}`,
        go: `func minCut(s string) int {\n\tn := len(s)\n\tif n == 0 {\n\t\treturn 0\n\t}\n\tisPal := make([][]bool, n)\n\tfor i := range isPal {\n\t\tisPal[i] = make([]bool, n)\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tfor j := i; j < n; j++ {\n\t\t\tif s[i] == s[j] && (j-i < 2 || isPal[i+1][j-1]) {\n\t\t\t\tisPal[i][j] = true\n\t\t\t}\n\t\t}\n\t}\n\tcuts := make([]int, n)\n\tfor j := 0; j < n; j++ {\n\t\tif isPal[0][j] {\n\t\t\tcuts[j] = 0\n\t\t\tcontinue\n\t\t}\n\t\tbest := j\n\t\tfor i := 1; i <= j; i++ {\n\t\t\tif isPal[i][j] && cuts[i-1]+1 < best {\n\t\t\t\tbest = cuts[i-1] + 1\n\t\t\t}\n\t\t}\n\t\tcuts[j] = best\n\t}\n\treturn cuts[n-1]\n}`,
        kotlin: `fun minCut(s: String): Int {\n    val n = s.length\n    if (n == 0) return 0\n    val isPal = Array(n) { BooleanArray(n) }\n    for (i in n - 1 downTo 0) {\n        for (j in i until n) {\n            if (s[i] == s[j] && (j - i < 2 || isPal[i + 1][j - 1])) isPal[i][j] = true\n        }\n    }\n    val cuts = IntArray(n)\n    for (j in 0 until n) {\n        if (isPal[0][j]) {\n            cuts[j] = 0\n            continue\n        }\n        var best = j\n        for (i in 1..j) {\n            if (isPal[i][j] && cuts[i - 1] + 1 < best) best = cuts[i - 1] + 1\n        }\n        cuts[j] = best\n    }\n    return cuts[n - 1]\n}`,
        swift: `func minCut(_ s: String) -> Int {\n    let a = Array(s)\n    let n = a.count\n    if n == 0 { return 0 }\n    var isPal = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)\n    var i = n - 1\n    while i >= 0 {\n        var j = i\n        while j < n {\n            if a[i] == a[j] && (j - i < 2 || isPal[i + 1][j - 1]) { isPal[i][j] = true }\n            j += 1\n        }\n        i -= 1\n    }\n    var cuts = [Int](repeating: 0, count: n)\n    for j in 0..<n {\n        if isPal[0][j] {\n            cuts[j] = 0\n            continue\n        }\n        var best = j\n        var k = 1\n        while k <= j {\n            if isPal[k][j] && cuts[k - 1] + 1 < best { best = cuts[k - 1] + 1 }\n            k += 1\n        }\n        cuts[j] = best\n    }\n    return cuts[n - 1]\n}`,
        rust: `fn minCut(s: String) -> i32 {\n    let a = s.as_bytes();\n    let n = a.len();\n    if n == 0 {\n        return 0;\n    }\n    let mut is_pal = vec![vec![false; n]; n];\n    for i in (0..n).rev() {\n        for j in i..n {\n            if a[i] == a[j] && (j - i < 2 || is_pal[i + 1][j - 1]) {\n                is_pal[i][j] = true;\n            }\n        }\n    }\n    let mut cuts = vec![0i32; n];\n    for j in 0..n {\n        if is_pal[0][j] {\n            cuts[j] = 0;\n            continue;\n        }\n        let mut best = j as i32;\n        for i in 1..=j {\n            if is_pal[i][j] && cuts[i - 1] + 1 < best {\n                best = cuts[i - 1] + 1;\n            }\n        }\n        cuts[j] = best;\n    }\n    cuts[n - 1]\n}`,
        php: `function minCut($s) {\n    $n = strlen($s);\n    if ($n === 0) return 0;\n    $isPal = array();\n    for ($i = 0; $i < $n; $i++) $isPal[] = array_fill(0, $n, false);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        for ($j = $i; $j < $n; $j++) {\n            if ($s[$i] === $s[$j] && ($j - $i < 2 || $isPal[$i + 1][$j - 1])) $isPal[$i][$j] = true;\n        }\n    }\n    $cuts = array_fill(0, $n, 0);\n    for ($j = 0; $j < $n; $j++) {\n        if ($isPal[0][$j]) { $cuts[$j] = 0; continue; }\n        $best = $j;\n        for ($i = 1; $i <= $j; $i++) {\n            if ($isPal[$i][$j] && $cuts[$i - 1] + 1 < $best) $best = $cuts[$i - 1] + 1;\n        }\n        $cuts[$j] = $best;\n    }\n    return $cuts[$n - 1];\n}`,
        ruby: `def minCut(s)\n  n = s.length\n  return 0 if n == 0\n  is_pal = Array.new(n) { Array.new(n, false) }\n  (n - 1).downto(0) do |i|\n    (i...n).each do |j|\n      is_pal[i][j] = true if s[i] == s[j] && (j - i < 2 || is_pal[i + 1][j - 1])\n    end\n  end\n  cuts = Array.new(n, 0)\n  (0...n).each do |j|\n    if is_pal[0][j]\n      cuts[j] = 0\n      next\n    end\n    best = j\n    (1..j).each do |i|\n      best = cuts[i - 1] + 1 if is_pal[i][j] && cuts[i - 1] + 1 < best\n    end\n    cuts[j] = best\n  end\n  cuts[n - 1]\nend`,
      },
    };
  })(),

  // ── Count Number of Teams (LC 1395) ─────────────────────────────
  (() => {
    const ref = (rating: number[]) => {
      const n = rating.length;
      let total = 0;
      for (let j = 0; j < n; j++) {
        let lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;
        for (let i = 0; i < j; i++) {
          if (rating[i] < rating[j]) lessLeft++;
          else if (rating[i] > rating[j]) moreLeft++;
        }
        for (let k = j + 1; k < n; k++) {
          if (rating[k] < rating[j]) lessRight++;
          else if (rating[k] > rating[j]) moreRight++;
        }
        total += lessLeft * moreRight + moreLeft * lessRight;
      }
      return total;
    };
    return {
      slug: "count-number-of-teams",
      title: "Count Number of Teams",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "numTeams", params: [{ name: "rating", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` soldiers standing in a line with **distinct** ratings.\n\nA team is a triple of indices `i < j < k` whose ratings are either strictly increasing (`rating[i] < rating[j] < rating[k]`) or strictly decreasing.\n\nReturn the number of such teams.",
        [
          { in: "rating = [2,5,3,4,1]", out: "3", note: "(2,3,4), (5,4,1) and (5,3,1)." },
          { in: "rating = [2,1,3]", out: "0" },
          { in: "rating = [1,2,3,4]", out: "4" },
        ],
        ["3 <= rating.length <= 1000", "1 <= rating[i] <= 100000", "All ratings are distinct."]),
      hints: [
        "Enumerating all triples is O(n³) — too slow at `n = 1000`.",
        "Fix the **middle** soldier instead, and count what is available on each side.",
        "An increasing team through `j` is `(smaller on the left) × (larger on the right)`; the decreasing case mirrors it.",
      ],
      editorial: explain({
        idea: "Pivot on the middle element. Once `j` is fixed, the ends are independent, so the count is a product of two simple tallies.",
        steps: [
          "For each index `j`, count how many earlier ratings are smaller (`lessLeft`) and larger (`moreLeft`).",
          "Count how many later ratings are smaller (`lessRight`) and larger (`moreRight`).",
          "Add `lessLeft * moreRight` (increasing) plus `moreLeft * lessRight` (decreasing).",
          "Sum over every `j`.",
        ],
        why: "Every valid triple has exactly one middle element, so pivoting on it counts each team once. Given `j`, any qualifying left choice can pair with any qualifying right choice, which is why the counts multiply.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Pivoting on the first or last element makes the two sides dependent and breaks the product.",
          "Ratings are distinct, so `<` and `>` partition the comparisons — no equality case to handle.",
          "The totals stay well inside 32 bits at `n = 1000`.",
        ],
      }),
      examples: [
        { input: "[2,5,3,4,1]", expectedOutput: "3" },
        { input: "[2,1,3]", expectedOutput: "0" },
        { input: "[1,2,3,4]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 20);
        const vals = new Set<number>();
        while (vals.size < n) vals.add(ri(rng, 1, 200));
        const rating = shuffle(rng, Array.from(vals));
        return { input: fmtIntArr(rating), expectedOutput: String(ref(rating)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numTeams(rating: List[int]) -> int:\n    n = len(rating)\n    total = 0\n    for j in range(n):\n        less_left = sum(1 for i in range(j) if rating[i] < rating[j])\n        more_left = j - less_left\n        less_right = sum(1 for k in range(j + 1, n) if rating[k] < rating[j])\n        more_right = (n - j - 1) - less_right\n        total += less_left * more_right + more_left * less_right\n    return total`,
        javascript: `var numTeams = function(rating) {\n    const n = rating.length;\n    let total = 0;\n    for (let j = 0; j < n; j++) {\n        let lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (let i = 0; i < j; i++) {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (let k = j + 1; k < n; k++) {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n};`,
        typescript: `function numTeams(rating: number[]): number {\n    var n = rating.length;\n    var total = 0;\n    for (var j = 0; j < n; j++) {\n        var lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (var i = 0; i < j; i++) {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (var k = j + 1; k < n; k++) {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n}`,
        java: `public static int numTeams(int[] rating) {\n    int n = rating.length;\n    int total = 0;\n    for (int j = 0; j < n; j++) {\n        int lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (int i = 0; i < j; i++) {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (int k = j + 1; k < n; k++) {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n}`,
        cpp: `int numTeams(vector<int>& rating) {\n    int n = (int) rating.size();\n    int total = 0;\n    for (int j = 0; j < n; j++) {\n        int lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (int i = 0; i < j; i++) {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (int k = j + 1; k < n; k++) {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n}`,
        c: `int numTeams(int* rating, int ratingSize) {\n    int total = 0;\n    for (int j = 0; j < ratingSize; j++) {\n        int lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (int i = 0; i < j; i++) {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (int k = j + 1; k < ratingSize; k++) {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n}`,
        csharp: `public static int NumTeams(int[] rating)\n{\n    int n = rating.Length;\n    int total = 0;\n    for (int j = 0; j < n; j++)\n    {\n        int lessLeft = 0, moreLeft = 0, lessRight = 0, moreRight = 0;\n        for (int i = 0; i < j; i++)\n        {\n            if (rating[i] < rating[j]) lessLeft++;\n            else if (rating[i] > rating[j]) moreLeft++;\n        }\n        for (int k = j + 1; k < n; k++)\n        {\n            if (rating[k] < rating[j]) lessRight++;\n            else if (rating[k] > rating[j]) moreRight++;\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight;\n    }\n    return total;\n}`,
        go: `func numTeams(rating []int) int {\n\tn := len(rating)\n\ttotal := 0\n\tfor j := 0; j < n; j++ {\n\t\tlessLeft, moreLeft, lessRight, moreRight := 0, 0, 0, 0\n\t\tfor i := 0; i < j; i++ {\n\t\t\tif rating[i] < rating[j] {\n\t\t\t\tlessLeft++\n\t\t\t} else if rating[i] > rating[j] {\n\t\t\t\tmoreLeft++\n\t\t\t}\n\t\t}\n\t\tfor k := j + 1; k < n; k++ {\n\t\t\tif rating[k] < rating[j] {\n\t\t\t\tlessRight++\n\t\t\t} else if rating[k] > rating[j] {\n\t\t\t\tmoreRight++\n\t\t\t}\n\t\t}\n\t\ttotal += lessLeft*moreRight + moreLeft*lessRight\n\t}\n\treturn total\n}`,
        kotlin: `fun numTeams(rating: IntArray): Int {\n    val n = rating.size\n    var total = 0\n    for (j in 0 until n) {\n        var lessLeft = 0\n        var moreLeft = 0\n        var lessRight = 0\n        var moreRight = 0\n        for (i in 0 until j) {\n            if (rating[i] < rating[j]) lessLeft++\n            else if (rating[i] > rating[j]) moreLeft++\n        }\n        for (k in j + 1 until n) {\n            if (rating[k] < rating[j]) lessRight++\n            else if (rating[k] > rating[j]) moreRight++\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight\n    }\n    return total\n}`,
        swift: `func numTeams(_ rating: [Int]) -> Int {\n    let n = rating.count\n    var total = 0\n    for j in 0..<n {\n        var lessLeft = 0\n        var moreLeft = 0\n        var lessRight = 0\n        var moreRight = 0\n        for i in 0..<j {\n            if rating[i] < rating[j] { lessLeft += 1 }\n            else if rating[i] > rating[j] { moreLeft += 1 }\n        }\n        var k = j + 1\n        while k < n {\n            if rating[k] < rating[j] { lessRight += 1 }\n            else if rating[k] > rating[j] { moreRight += 1 }\n            k += 1\n        }\n        total += lessLeft * moreRight + moreLeft * lessRight\n    }\n    return total\n}`,
        rust: `fn numTeams(rating: Vec<i32>) -> i32 {\n    let n = rating.len();\n    let mut total = 0;\n    for j in 0..n {\n        let mut less_left = 0;\n        let mut more_left = 0;\n        let mut less_right = 0;\n        let mut more_right = 0;\n        for i in 0..j {\n            if rating[i] < rating[j] {\n                less_left += 1;\n            } else if rating[i] > rating[j] {\n                more_left += 1;\n            }\n        }\n        for k in (j + 1)..n {\n            if rating[k] < rating[j] {\n                less_right += 1;\n            } else if rating[k] > rating[j] {\n                more_right += 1;\n            }\n        }\n        total += less_left * more_right + more_left * less_right;\n    }\n    total\n}`,
        php: `function numTeams($rating) {\n    $n = count($rating);\n    $total = 0;\n    for ($j = 0; $j < $n; $j++) {\n        $lessLeft = 0; $moreLeft = 0; $lessRight = 0; $moreRight = 0;\n        for ($i = 0; $i < $j; $i++) {\n            if ($rating[$i] < $rating[$j]) $lessLeft++;\n            else if ($rating[$i] > $rating[$j]) $moreLeft++;\n        }\n        for ($k = $j + 1; $k < $n; $k++) {\n            if ($rating[$k] < $rating[$j]) $lessRight++;\n            else if ($rating[$k] > $rating[$j]) $moreRight++;\n        }\n        $total += $lessLeft * $moreRight + $moreLeft * $lessRight;\n    }\n    return $total;\n}`,
        ruby: `def numTeams(rating)\n  n = rating.length\n  total = 0\n  (0...n).each do |j|\n    less_left = (0...j).count { |i| rating[i] < rating[j] }\n    more_left = j - less_left\n    less_right = ((j + 1)...n).count { |k| rating[k] < rating[j] }\n    more_right = (n - j - 1) - less_right\n    total += less_left * more_right + more_left * less_right\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Stone Game III (LC 1406) ────────────────────────────────────
  (() => {
    const ref = (stoneValue: number[]) => {
      const n = stoneValue.length;
      const dp = new Array(n + 1).fill(0);
      for (let i = n - 1; i >= 0; i--) {
        let take = 0;
        let best = -Infinity;
        for (let k = 0; k < 3 && i + k < n; k++) {
          take += stoneValue[i + k];
          const cand = take - dp[i + k + 1];
          if (cand > best) best = cand;
        }
        dp[i] = best;
      }
      if (dp[0] > 0) return "Alice";
      if (dp[0] < 0) return "Bob";
      return "Tie";
    };
    return {
      slug: "stone-game-iii",
      title: "Stone Game III",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Game Theory", "Amazon", "Google"],
      signature: { funcName: "stoneGameIII", params: [{ name: "stoneValue", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "Alice and Bob take turns with a row of stones, Alice first. On a turn a player takes **1, 2 or 3** stones from the **front** of the row and adds their values to their score. Values may be negative.\n\nBoth play optimally to maximise their own score. Return `\"Alice\"`, `\"Bob\"` or `\"Tie\"`.",
        [
          { in: "stoneValue = [1,2,3,7]", out: "Bob", note: "Whatever Alice takes, Bob can take the 7." },
          { in: "stoneValue = [1,2,3,-9]", out: "Alice", note: "Alice takes all three positives and leaves Bob the -9." },
          { in: "stoneValue = [1,2,3,6]", out: "Tie" },
        ],
        ["1 <= stoneValue.length <= 50000", "-1000 <= stoneValue[i] <= 1000"]),
      hints: [
        "Track the **score difference** (current player minus opponent) rather than two separate scores.",
        "`dp[i]` = the best difference the player to move can force from position `i`.",
        "Taking `k` stones gives `sum(i..i+k-1) - dp[i+k]`, because the roles then swap.",
      ],
      editorial: explain({
        idea: "In a zero-sum turn game, one number per position is enough: the best achievable difference for whoever moves next. The opponent's optimal play appears as a subtraction.",
        steps: [
          "Let `dp[i]` be the maximum score difference the mover can achieve from index `i`, with `dp[n] = 0`.",
          "For `k` in 1..3, accumulate the take and evaluate `take - dp[i + k]`.",
          "Set `dp[i]` to the maximum of those candidates.",
          "Compare `dp[0]` with zero to name the winner.",
        ],
        why: "After the mover takes `k` stones, the opponent faces position `i + k` and will themselves force a difference of `dp[i+k]` — in their favour. Subtracting flips the perspective back, so maximising `take - dp[i+k]` is exactly optimal play.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Greedily taking the largest immediate sum ignores what it leaves behind.",
          "Negative values mean you cannot assume taking more is better — sometimes taking one stone is right.",
          "`dp[n] = 0` anchors the recurrence; the loop must run backwards.",
        ],
      }),
      examples: [
        { input: "[1,2,3,7]", expectedOutput: "Bob" },
        { input: "[1,2,3,-9]", expectedOutput: "Alice" },
        { input: "[1,2,3,6]", expectedOutput: "Tie" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const stones = Array.from({ length: n }, () => ri(rng, -10, 10));
        return { input: fmtIntArr(stones), expectedOutput: ref(stones) };
      },
      solutions: {
        python: `from typing import List\n\ndef stoneGameIII(stoneValue: List[int]) -> str:\n    n = len(stoneValue)\n    dp = [0] * (n + 1)\n    for i in range(n - 1, -1, -1):\n        take = 0\n        best = None\n        for k in range(3):\n            if i + k >= n:\n                break\n            take += stoneValue[i + k]\n            cand = take - dp[i + k + 1]\n            if best is None or cand > best:\n                best = cand\n        dp[i] = best\n    if dp[0] > 0:\n        return "Alice"\n    if dp[0] < 0:\n        return "Bob"\n    return "Tie"`,
        javascript: `var stoneGameIII = function(stoneValue) {\n    const n = stoneValue.length;\n    const dp = new Array(n + 1).fill(0);\n    for (let i = n - 1; i >= 0; i--) {\n        let take = 0;\n        let best = -Infinity;\n        for (let k = 0; k < 3 && i + k < n; k++) {\n            take += stoneValue[i + k];\n            const cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    if (dp[0] > 0) return "Alice";\n    if (dp[0] < 0) return "Bob";\n    return "Tie";\n};`,
        typescript: `function stoneGameIII(stoneValue: number[]): string {\n    var n = stoneValue.length;\n    var dp: number[] = [];\n    for (var a = 0; a <= n; a++) dp.push(0);\n    for (var i = n - 1; i >= 0; i--) {\n        var take = 0;\n        var best = -Infinity;\n        for (var k = 0; k < 3 && i + k < n; k++) {\n            take += stoneValue[i + k];\n            var cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    if (dp[0] > 0) return "Alice";\n    if (dp[0] < 0) return "Bob";\n    return "Tie";\n}`,
        java: `public static String stoneGameIII(int[] stoneValue) {\n    int n = stoneValue.length;\n    int[] dp = new int[n + 1];\n    for (int i = n - 1; i >= 0; i--) {\n        int take = 0;\n        int best = Integer.MIN_VALUE;\n        for (int k = 0; k < 3 && i + k < n; k++) {\n            take += stoneValue[i + k];\n            int cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    if (dp[0] > 0) return "Alice";\n    if (dp[0] < 0) return "Bob";\n    return "Tie";\n}`,
        cpp: `string stoneGameIII(vector<int>& stoneValue) {\n    int n = (int) stoneValue.size();\n    vector<int> dp(n + 1, 0);\n    for (int i = n - 1; i >= 0; i--) {\n        int take = 0;\n        int best = INT_MIN;\n        for (int k = 0; k < 3 && i + k < n; k++) {\n            take += stoneValue[i + k];\n            int cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    if (dp[0] > 0) return "Alice";\n    if (dp[0] < 0) return "Bob";\n    return "Tie";\n}`,
        c: `char* stoneGameIII(int* stoneValue, int stoneValueSize) {\n    int n = stoneValueSize;\n    int* dp = (int*) calloc(n + 1, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        int take = 0;\n        int best = -2000000000;\n        for (int k = 0; k < 3 && i + k < n; k++) {\n            take += stoneValue[i + k];\n            int cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    char* out = (char*) malloc(8);\n    if (dp[0] > 0) strcpy(out, "Alice");\n    else if (dp[0] < 0) strcpy(out, "Bob");\n    else strcpy(out, "Tie");\n    free(dp);\n    return out;\n}`,
        csharp: `public static string StoneGameIII(int[] stoneValue)\n{\n    int n = stoneValue.Length;\n    int[] dp = new int[n + 1];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        int take = 0;\n        int best = int.MinValue;\n        for (int k = 0; k < 3 && i + k < n; k++)\n        {\n            take += stoneValue[i + k];\n            int cand = take - dp[i + k + 1];\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    if (dp[0] > 0) return "Alice";\n    if (dp[0] < 0) return "Bob";\n    return "Tie";\n}`,
        go: `func stoneGameIII(stoneValue []int) string {\n\tn := len(stoneValue)\n\tdp := make([]int, n+1)\n\tfor i := n - 1; i >= 0; i-- {\n\t\ttake := 0\n\t\tbest := -2000000000\n\t\tfor k := 0; k < 3 && i+k < n; k++ {\n\t\t\ttake += stoneValue[i+k]\n\t\t\tcand := take - dp[i+k+1]\n\t\t\tif cand > best {\n\t\t\t\tbest = cand\n\t\t\t}\n\t\t}\n\t\tdp[i] = best\n\t}\n\tif dp[0] > 0 {\n\t\treturn "Alice"\n\t}\n\tif dp[0] < 0 {\n\t\treturn "Bob"\n\t}\n\treturn "Tie"\n}`,
        kotlin: `fun stoneGameIII(stoneValue: IntArray): String {\n    val n = stoneValue.size\n    val dp = IntArray(n + 1)\n    for (i in n - 1 downTo 0) {\n        var take = 0\n        var best = Int.MIN_VALUE\n        var k = 0\n        while (k < 3 && i + k < n) {\n            take += stoneValue[i + k]\n            val cand = take - dp[i + k + 1]\n            if (cand > best) best = cand\n            k++\n        }\n        dp[i] = best\n    }\n    return when {\n        dp[0] > 0 -> "Alice"\n        dp[0] < 0 -> "Bob"\n        else -> "Tie"\n    }\n}`,
        swift: `func stoneGameIII(_ stoneValue: [Int]) -> String {\n    let n = stoneValue.count\n    var dp = [Int](repeating: 0, count: n + 1)\n    var i = n - 1\n    while i >= 0 {\n        var take = 0\n        var best = Int.min\n        var k = 0\n        while k < 3 && i + k < n {\n            take += stoneValue[i + k]\n            let cand = take - dp[i + k + 1]\n            if cand > best { best = cand }\n            k += 1\n        }\n        dp[i] = best\n        i -= 1\n    }\n    if dp[0] > 0 { return "Alice" }\n    if dp[0] < 0 { return "Bob" }\n    return "Tie"\n}`,
        rust: `fn stoneGameIII(stoneValue: Vec<i32>) -> String {\n    let n = stoneValue.len();\n    let mut dp = vec![0i32; n + 1];\n    for i in (0..n).rev() {\n        let mut take = 0;\n        let mut best = std::i32::MIN;\n        let mut k = 0;\n        while k < 3 && i + k < n {\n            take += stoneValue[i + k];\n            let cand = take - dp[i + k + 1];\n            if cand > best {\n                best = cand;\n            }\n            k += 1;\n        }\n        dp[i] = best;\n    }\n    if dp[0] > 0 {\n        "Alice".to_string()\n    } else if dp[0] < 0 {\n        "Bob".to_string()\n    } else {\n        "Tie".to_string()\n    }\n}`,
        php: `function stoneGameIII($stoneValue) {\n    $n = count($stoneValue);\n    $dp = array_fill(0, $n + 1, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $take = 0;\n        $best = -2000000000;\n        for ($k = 0; $k < 3 && $i + $k < $n; $k++) {\n            $take += $stoneValue[$i + $k];\n            $cand = $take - $dp[$i + $k + 1];\n            if ($cand > $best) $best = $cand;\n        }\n        $dp[$i] = $best;\n    }\n    if ($dp[0] > 0) return "Alice";\n    if ($dp[0] < 0) return "Bob";\n    return "Tie";\n}`,
        ruby: `def stoneGameIII(stoneValue)\n  n = stoneValue.length\n  dp = Array.new(n + 1, 0)\n  (n - 1).downto(0) do |i|\n    take = 0\n    best = -2_000_000_000\n    k = 0\n    while k < 3 && i + k < n\n      take += stoneValue[i + k]\n      cand = take - dp[i + k + 1]\n      best = cand if cand > best\n      k += 1\n    end\n    dp[i] = best\n  end\n  return "Alice" if dp[0] > 0\n  return "Bob" if dp[0] < 0\n  "Tie"\nend`,
      },
    };
  })(),

  // ── Stone Game IV (LC 1510) ─────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const win = new Array(n + 1).fill(false);
      for (let i = 1; i <= n; i++) {
        for (let k = 1; k * k <= i; k++) {
          if (!win[i - k * k]) { win[i] = true; break; }
        }
      }
      return win[n];
    };
    return {
      slug: "stone-game-iv",
      title: "Stone Game IV",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Game Theory", "Amazon", "Google"],
      signature: { funcName: "winnerSquareGame", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Alice and Bob take turns with a pile of `n` stones, Alice first. On each turn a player must remove a **non-zero square number** of stones (1, 4, 9, 16, …).\n\nA player who cannot move loses. Both play optimally. Return `true` if Alice wins.",
        [
          { in: "n = 1", out: "true", note: "Alice removes the single stone." },
          { in: "n = 2", out: "false", note: "Alice must take 1, Bob takes the last one." },
          { in: "n = 4", out: "true", note: "Alice takes all four at once." },
        ],
        ["1 <= n <= 100000"]),
      hints: [
        "A position is winning if **some** move leads to a losing position for the opponent.",
        "The moves from `i` are `i - k²` for every `k` with `k² <= i`.",
        "Build the table upward from 0, which is a losing position.",
      ],
      editorial: explain({
        idea: "Classic win/lose game DP. Position 0 is a loss for whoever must move; every other position is a win exactly when it can reach a losing one.",
        steps: [
          "Let `win[i]` say whether the player to move at `i` stones wins; `win[0] = false`.",
          "For each `i` from 1 to `n`, try every square `k² <= i`.",
          "If any `win[i - k²]` is false, set `win[i] = true` and stop early.",
          "Return `win[n]`.",
        ],
        why: "Optimal play means a player wins if and only if they can hand the opponent a losing position. Since every move strictly decreases the pile, the recursion is well founded and the upward sweep computes it exactly.",
        time: "O(n · sqrt(n))",
        space: "O(n)",
        pitfalls: [
          "Requiring *all* moves to lead to a loss inverts the logic — one good move is enough.",
          "There is no simple parity shortcut here; patterns like \"multiples of 5 lose\" break down.",
          "The inner loop must include `k = 1`, so a single stone is always removable.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "true" },
        { input: "2", expectedOutput: "false" },
        { input: "4", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 20000);
        return { input: String(n), expectedOutput: ref(n) ? "true" : "false" };
      },
      solutions: {
        python: `def winnerSquareGame(n: int) -> bool:\n    win = [False] * (n + 1)\n    for i in range(1, n + 1):\n        k = 1\n        while k * k <= i:\n            if not win[i - k * k]:\n                win[i] = True\n                break\n            k += 1\n    return win[n]`,
        javascript: `var winnerSquareGame = function(n) {\n    const win = new Array(n + 1).fill(false);\n    for (let i = 1; i <= n; i++) {\n        for (let k = 1; k * k <= i; k++) {\n            if (!win[i - k * k]) { win[i] = true; break; }\n        }\n    }\n    return win[n];\n};`,
        typescript: `function winnerSquareGame(n: number): boolean {\n    var win: boolean[] = [];\n    for (var a = 0; a <= n; a++) win.push(false);\n    for (var i = 1; i <= n; i++) {\n        for (var k = 1; k * k <= i; k++) {\n            if (!win[i - k * k]) { win[i] = true; break; }\n        }\n    }\n    return win[n];\n}`,
        java: `public static boolean winnerSquareGame(int n) {\n    boolean[] win = new boolean[n + 1];\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            if (!win[i - k * k]) { win[i] = true; break; }\n        }\n    }\n    return win[n];\n}`,
        cpp: `bool winnerSquareGame(int n) {\n    vector<char> win(n + 1, 0);\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            if (!win[i - k * k]) { win[i] = 1; break; }\n        }\n    }\n    return win[n] != 0;\n}`,
        c: `bool winnerSquareGame(int n) {\n    char* win = (char*) calloc(n + 1, sizeof(char));\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            if (!win[i - k * k]) { win[i] = 1; break; }\n        }\n    }\n    bool result = win[n] != 0;\n    free(win);\n    return result;\n}`,
        csharp: `public static bool WinnerSquareGame(int n)\n{\n    bool[] win = new bool[n + 1];\n    for (int i = 1; i <= n; i++)\n    {\n        for (int k = 1; k * k <= i; k++)\n        {\n            if (!win[i - k * k]) { win[i] = true; break; }\n        }\n    }\n    return win[n];\n}`,
        go: `func winnerSquareGame(n int) bool {\n\twin := make([]bool, n+1)\n\tfor i := 1; i <= n; i++ {\n\t\tfor k := 1; k*k <= i; k++ {\n\t\t\tif !win[i-k*k] {\n\t\t\t\twin[i] = true\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n\treturn win[n]\n}`,
        kotlin: `fun winnerSquareGame(n: Int): Boolean {\n    val win = BooleanArray(n + 1)\n    for (i in 1..n) {\n        var k = 1\n        while (k * k <= i) {\n            if (!win[i - k * k]) {\n                win[i] = true\n                break\n            }\n            k++\n        }\n    }\n    return win[n]\n}`,
        swift: `func winnerSquareGame(_ n: Int) -> Bool {\n    var win = [Bool](repeating: false, count: n + 1)\n    for i in 1...max(n, 1) {\n        var k = 1\n        while k * k <= i {\n            if !win[i - k * k] {\n                win[i] = true\n                break\n            }\n            k += 1\n        }\n    }\n    return win[n]\n}`,
        rust: `fn winnerSquareGame(n: i32) -> bool {\n    let size = (n + 1) as usize;\n    let mut win = vec![false; size];\n    for i in 1..size {\n        let mut k = 1usize;\n        while k * k <= i {\n            if !win[i - k * k] {\n                win[i] = true;\n                break;\n            }\n            k += 1;\n        }\n    }\n    win[n as usize]\n}`,
        php: `function winnerSquareGame($n) {\n    $win = array_fill(0, $n + 1, false);\n    for ($i = 1; $i <= $n; $i++) {\n        for ($k = 1; $k * $k <= $i; $k++) {\n            if (!$win[$i - $k * $k]) { $win[$i] = true; break; }\n        }\n    }\n    return $win[$n];\n}`,
        ruby: `def winnerSquareGame(n)\n  win = Array.new(n + 1, false)\n  (1..n).each do |i|\n    k = 1\n    while k * k <= i\n      if !win[i - k * k]\n        win[i] = true\n        break\n      end\n      k += 1\n    end\n  end\n  win[n]\nend`,
      },
    };
  })(),

  // ── END DP3 ──
];
