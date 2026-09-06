/** Dynamic Programming — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const DP_PROBLEMS: CatalogProblem[] = [

  // ── Climbing Stairs ─────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let a = 1, b = 1;
      for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
      }
      return b;
    };
    return {
      slug: "climbing-stairs",
      title: "Climbing Stairs",
      difficulty: "EASY" as const,
      tags: ["Math", "Dynamic Programming", "Memoization"],
      signature: { funcName: "climbStairs", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are climbing a staircase with `n` steps. Each move climbs either **1 or 2 steps**. In how many **distinct ways** can you reach the top?",
        [
          { in: "n = 2", out: "2", note: "1+1 or 2." },
          { in: "n = 3", out: "3", note: "1+1+1, 1+2, or 2+1." },
        ],
        ["1 <= n <= 45"]),
      hints: [
        "Ways to reach step n = ways(n-1) + ways(n-2).",
        "That's the Fibonacci sequence — two rolling variables suffice.",
      ],
      examples: [
        { input: "2", expectedOutput: "2" },
        { input: "3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      editorial: explain({
        idea: "The last move onto step `n` was either a 1-step from `n-1` or a 2-step from `n-2`, and those two families of routes are disjoint and cover everything. So `ways(n) = ways(n-1) + ways(n-2)` — the Fibonacci recurrence, seeded with one way to stand at the bottom.",
        steps: [
          "There is `1` way to be at step 0 (do nothing) and `1` way to reach step 1.",
          "For each subsequent step, add the two previous counts.",
          "Only the last two values are ever needed, so keep two variables instead of an array.",
          "Return the count for step `n`.",
        ],
        why: "Every route to step `n` ends with exactly one final move, of size 1 or 2. Classifying routes by that final move partitions them into two groups with no overlap and nothing left out, and each group is in bijection with the routes to the step it came from. That is precisely the recurrence, and the two base cases pin it down.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The base case is `1` way to reach step 0, not `0` — otherwise every later count collapses.",
          "Naive recursion without memoisation is exponential and times out well before `n = 45`.",
          "At `n = 45` the answer is over 1.8 billion — close to the 32-bit limit, so a narrower type would overflow.",
          "Update the two rolling variables in the right order, or you fold a value into itself.",
        ],
      }),
      solutions: {
        python: `def climbStairs(n: int) -> int:\n    a, b = 1, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b`,
        javascript: `var climbStairs = function(n) {\n    let a = 1, b = 1;\n    for (let i = 2; i <= n; i++) {\n        const c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n};`,
              typescript: `function climbStairs(n: number): number {\n    let a = 1;\n    let b = 1;\n    for (let i = 2; i <= n; i++) {\n        const c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              java: `public static int climbStairs(int n) {\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              cpp: `int climbStairs(int n) {\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              c: `int climbStairs(int n) {\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              csharp: `public static int ClimbStairs(int n)\n{\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++)\n    {\n        int c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              go: `func climbStairs(n int) int {\n	a, b := 1, 1\n	for i := 2; i <= n; i++ {\n		a, b = b, a+b\n	}\n	return b\n}`,
              kotlin: `fun climbStairs(n: Int): Int {\n    var a = 1\n    var b = 1\n    for (i in 2..n) {\n        val c = a + b\n        a = b\n        b = c\n    }\n    return b\n}`,
              swift: `func climbStairs(_ n: Int) -> Int {\n    var a = 1\n    var b = 1\n    var i = 2\n    while i <= n {\n        let c = a + b\n        a = b\n        b = c\n        i += 1\n    }\n    return b\n}`,
              rust: `fn climbStairs(n: i32) -> i32 {\n    let mut a: i32 = 1;\n    let mut b: i32 = 1;\n    for _ in 2..=n {\n        let c = a + b;\n        a = b;\n        b = c;\n    }\n    b\n}`,
              php: `function climbStairs($n) {\n    $a = 1;\n    $b = 1;\n    for ($i = 2; $i <= $n; $i++) {\n        $c = $a + $b;\n        $a = $b;\n        $b = $c;\n    }\n    return $b;\n}`,
              ruby: `def climbStairs(n)\n  a = 1\n  b = 1\n  (2..n).each do\n    a, b = b, a + b\n  end\n  b\nend`,
      },
    };
  })(),

  // ── Min Cost Climbing Stairs ────────────────────────────────────
  (() => {
    const ref = (cost: number[]) => {
      let a = 0, b = 0;
      for (let i = 2; i <= cost.length; i++) {
        const c = Math.min(b + cost[i - 1], a + cost[i - 2]);
        a = b;
        b = c;
      }
      return b;
    };
    return {
      slug: "min-cost-climbing-stairs",
      title: "Min Cost Climbing Stairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "minCostClimbingStairs", params: [{ name: "cost", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`cost[i]` is the fee to step on stair `i`; after paying you may climb **1 or 2** stairs. You start from stair `0` or stair `1`.\n\nReturn the **minimum cost** to reach the top of the floor (just past the last stair).",
        [
          { in: "cost = [10,15,20]", out: "15", note: "Start at stair 1, pay 15, jump to the top." },
          { in: "cost = [1,100,1,1,1,100,1,1,100,1]", out: "6" },
        ],
        ["2 <= cost.length <= 30", "0 <= cost[i] <= 100"]),
      hints: [
        "minTo(i) = min(minTo(i-1) + cost[i-1], minTo(i-2) + cost[i-2]).",
        "Only two previous values are needed at any time.",
      ],
      examples: [
        { input: "[10,15,20]", expectedOutput: "15" },
        { input: "[1,100,1,1,1,100,1,1,100,1]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const cost = Array.from({ length: ri(rng, 2, 30) }, () => ri(rng, 0, 100));
        return { input: fmtIntArr(cost), expectedOutput: String(ref(cost)) };
      },
      editorial: explain({
        idea: "Let `best[i]` be the cheapest way to **reach** stair `i`. You arrive either from `i-1` (paying that stair's fee) or from `i-2` (paying its fee), so take the smaller. The target is the floor just past the last stair, index `n`, which you reach from the final two stairs.",
        steps: [
          "`best[0] = best[1] = 0` — starting on either of the first two stairs is free.",
          "For `i` from `2` to `n`, set `best[i] = min(best[i-2] + cost[i-2], best[i-1] + cost[i-1])`.",
          "Note that the fee is paid when you **leave** a stair, which is why the cost index trails the position index by one.",
          "Return `best[n]`, and keep only the last two values to stay in constant space.",
        ],
        why: "Reaching stair `i` is only possible from `i-1` or `i-2`, and those subproblems are independent of how you got to them — the future cost depends solely on where you stand. That is optimal substructure, so taking the minimum of the two options is safe at every step and the recurrence yields the global optimum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The goal is index `n`, one past the last stair — stopping at `n - 1` solves a different problem.",
          "You may start at stair 0 **or** stair 1, so both base cases are zero, not `cost[0]`.",
          "The index offset is the trap: reaching `i` from `i-1` costs `cost[i-1]`, not `cost[i]`.",
          "Fees can be `0`, which is fine and needs no special handling.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef minCostClimbingStairs(cost: List[int]) -> int:\n    a, b = 0, 0\n    for i in range(2, len(cost) + 1):\n        a, b = b, min(b + cost[i - 1], a + cost[i - 2])\n    return b`,
        javascript: `var minCostClimbingStairs = function(cost) {\n    let a = 0, b = 0;\n    for (let i = 2; i <= cost.length; i++) {\n        const c = Math.min(b + cost[i - 1], a + cost[i - 2]);\n        a = b;\n        b = c;\n    }\n    return b;\n};`,
              typescript: `function minCostClimbingStairs(cost: number[]): number {\n    const n = cost.length;\n    let a = 0;\n    let b = 0;\n    for (let i = 2; i <= n; i++) {\n        const c = Math.min(a + cost[i - 2], b + cost[i - 1]);\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              java: `public static int minCostClimbingStairs(int[] cost) {\n    int n = cost.length, a = 0, b = 0;\n    for (int i = 2; i <= n; i++) {\n        int c = Math.min(a + cost[i - 2], b + cost[i - 1]);\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              cpp: `int minCostClimbingStairs(vector<int>& cost) {\n    int n = (int) cost.size(), a = 0, b = 0;\n    for (int i = 2; i <= n; i++) {\n        int c = min(a + cost[i - 2], b + cost[i - 1]);\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              c: `int minCostClimbingStairs(int* cost, int costSize) {\n    int a = 0, b = 0;\n    for (int i = 2; i <= costSize; i++) {\n        int x = a + cost[i - 2];\n        int y = b + cost[i - 1];\n        int c = x < y ? x : y;\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              csharp: `public static int MinCostClimbingStairs(int[] cost)\n{\n    int n = cost.Length, a = 0, b = 0;\n    for (int i = 2; i <= n; i++)\n    {\n        int c = Math.Min(a + cost[i - 2], b + cost[i - 1]);\n        a = b;\n        b = c;\n    }\n    return b;\n}`,
              go: `func minCostClimbingStairs(cost []int) int {\n	n := len(cost)\n	a, b := 0, 0\n	for i := 2; i <= n; i++ {\n		x := a + cost[i-2]\n		y := b + cost[i-1]\n		c := x\n		if y < c {\n			c = y\n		}\n		a = b\n		b = c\n	}\n	return b\n}`,
              kotlin: `fun minCostClimbingStairs(cost: IntArray): Int {\n    val n = cost.size\n    var a = 0\n    var b = 0\n    for (i in 2..n) {\n        val c = minOf(a + cost[i - 2], b + cost[i - 1])\n        a = b\n        b = c\n    }\n    return b\n}`,
              swift: `func minCostClimbingStairs(_ cost: [Int]) -> Int {\n    let n = cost.count\n    var a = 0\n    var b = 0\n    var i = 2\n    while i <= n {\n        let c = min(a + cost[i - 2], b + cost[i - 1])\n        a = b\n        b = c\n        i += 1\n    }\n    return b\n}`,
              rust: `fn minCostClimbingStairs(cost: Vec<i32>) -> i32 {\n    let n = cost.len();\n    let mut a = 0;\n    let mut b = 0;\n    for i in 2..=n {\n        let x = a + cost[i - 2];\n        let y = b + cost[i - 1];\n        let c = if x < y { x } else { y };\n        a = b;\n        b = c;\n    }\n    b\n}`,
              php: `function minCostClimbingStairs($cost) {\n    $n = count($cost);\n    $a = 0;\n    $b = 0;\n    for ($i = 2; $i <= $n; $i++) {\n        $c = min($a + $cost[$i - 2], $b + $cost[$i - 1]);\n        $a = $b;\n        $b = $c;\n    }\n    return $b;\n}`,
              ruby: `def minCostClimbingStairs(cost)\n  n = cost.length\n  a = 0\n  b = 0\n  (2..n).each do |i|\n    c = [a + cost[i - 2], b + cost[i - 1]].min\n    a = b\n    b = c\n  end\n  b\nend`,
      },
    };
  })(),

  // ── House Robber ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let rob = 0, skip = 0;
      for (const x of nums) {
        const newRob = skip + x;
        skip = Math.max(skip, rob);
        rob = newRob;
      }
      return Math.max(rob, skip);
    };
    return {
      slug: "house-robber",
      title: "House Robber",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "rob", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You plan to rob houses along a street; `nums[i]` is the money in house `i`. You cannot rob **two adjacent houses** (alarms connect them).\n\nReturn the **maximum amount** you can rob.",
        [
          { in: "nums = [1,2,3,1]", out: "4", note: "Rob houses 0 and 2." },
          { in: "nums = [2,7,9,3,1]", out: "12", note: "Rob houses 0, 2 and 4." },
        ],
        ["1 <= nums.length <= 30", "0 <= nums[i] <= 400"]),
      hints: [
        "For each house: rob it (plus best excluding the previous) or skip it.",
        "Keep two running values: best if the last house was robbed, best if not.",
      ],
      examples: [
        { input: "[1,2,3,1]", expectedOutput: "4" },
        { input: "[2,7,9,3,1]", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, 400));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "At each house there are exactly two choices: rob it — which forbids the previous one, so you add its money to the best total from **two** houses back — or skip it and keep the best total from the previous house. Take the larger.",
        steps: [
          "Track two running values: the best total including up to the previous house, and the best up to the one before that.",
          "For each house, compute `max(skip, robTwoBack + money)`.",
          "Shift the two values forward and continue.",
          "The final value is the answer.",
        ],
        why: "The constraint is purely local — only adjacency matters — so the best plan for a prefix depends on nothing more than whether the last house was robbed. That collapses the state to two numbers. Every valid plan for the first `i` houses either uses house `i` or does not, and both branches are optimally solved by the smaller subproblems, giving optimal substructure with no overlap between the cases.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Add to the total from **two** houses back, not the previous one — that is the adjacency rule.",
          "Compute the new value before overwriting either variable, or you consume your own update.",
          "Houses can hold `0`, so the greedy \"rob every other house\" heuristic fails; the max is required.",
          "A single house is a valid answer on its own.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef rob(nums: List[int]) -> int:\n    take, skip = 0, 0\n    for x in nums:\n        take, skip = skip + x, max(skip, take)\n    return max(take, skip)`,
        javascript: `var rob = function(nums) {\n    let take = 0, skip = 0;\n    for (const x of nums) {\n        const newTake = skip + x;\n        skip = Math.max(skip, take);\n        take = newTake;\n    }\n    return Math.max(take, skip);\n};`,
              typescript: `function rob(nums: number[]): number {\n    let prev = 0;\n    let cur = 0;\n    for (let i = 0; i < nums.length; i++) {\n        const next = Math.max(cur, prev + nums[i]);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              java: `public static int rob(int[] nums) {\n    int prev = 0, cur = 0;\n    for (int x : nums) {\n        int next = Math.max(cur, prev + x);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              cpp: `int rob(vector<int>& nums) {\n    int prev = 0, cur = 0;\n    for (int x : nums) {\n        int next = max(cur, prev + x);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              c: `int rob(int* nums, int numsSize) {\n    int prev = 0, cur = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int cand = prev + nums[i];\n        int next = cur > cand ? cur : cand;\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              csharp: `public static int Rob(int[] nums)\n{\n    int prev = 0, cur = 0;\n    foreach (int x in nums)\n    {\n        int next = Math.Max(cur, prev + x);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              go: `func rob(nums []int) int {\n	prev, cur := 0, 0\n	for _, x := range nums {\n		next := cur\n		if prev+x > next {\n			next = prev + x\n		}\n		prev = cur\n		cur = next\n	}\n	return cur\n}`,
              kotlin: `fun rob(nums: IntArray): Int {\n    var prev = 0\n    var cur = 0\n    for (x in nums) {\n        val next = maxOf(cur, prev + x)\n        prev = cur\n        cur = next\n    }\n    return cur\n}`,
              swift: `func rob(_ nums: [Int]) -> Int {\n    var prev = 0\n    var cur = 0\n    for x in nums {\n        let next = max(cur, prev + x)\n        prev = cur\n        cur = next\n    }\n    return cur\n}`,
              rust: `fn rob(nums: Vec<i32>) -> i32 {\n    let mut prev = 0;\n    let mut cur = 0;\n    for &x in nums.iter() {\n        let next = if cur > prev + x { cur } else { prev + x };\n        prev = cur;\n        cur = next;\n    }\n    cur\n}`,
              php: `function rob($nums) {\n    $prev = 0;\n    $cur = 0;\n    foreach ($nums as $x) {\n        $next = max($cur, $prev + $x);\n        $prev = $cur;\n        $cur = $next;\n    }\n    return $cur;\n}`,
              ruby: `def rob(nums)\n  prev = 0\n  cur = 0\n  nums.each do |x|\n    nxt = [cur, prev + x].max\n    prev = cur\n    cur = nxt\n  end\n  cur\nend`,
      },
    };
  })(),

  // ── House Robber II ─────────────────────────────────────────────
  (() => {
    const robLine = (nums: number[]) => {
      let take = 0, skip = 0;
      for (const x of nums) {
        const newTake = skip + x;
        skip = Math.max(skip, take);
        take = newTake;
      }
      return Math.max(take, skip);
    };
    const ref = (nums: number[]) => {
      if (nums.length === 1) return nums[0];
      return Math.max(robLine(nums.slice(1)), robLine(nums.slice(0, -1)));
    };
    return {
      slug: "house-robber-ii",
      title: "House Robber II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "rob", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Same as House Robber, but the houses form a **circle** — the first and last houses are adjacent.\n\nReturn the maximum amount you can rob without alerting the police.",
        [
          { in: "nums = [2,3,2]", out: "3", note: "Houses 0 and 2 are adjacent in the circle." },
          { in: "nums = [1,2,3,1]", out: "4" },
          { in: "nums = [1,2,3]", out: "3" },
        ],
        ["1 <= nums.length <= 30", "0 <= nums[i] <= 400"]),
      hints: [
        "You can never rob BOTH the first and last house.",
        "Solve the linear problem twice: once without the first house, once without the last.",
      ],
      examples: [
        { input: "[2,3,2]", expectedOutput: "3" },
        { input: "[1,2,3,1]", expectedOutput: "4" },
        { input: "[1,2,3]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, 400));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "The circle adds exactly one new constraint: the first and last houses are now adjacent, so they cannot both be robbed. That splits the problem into **two linear instances** — one that excludes the last house, one that excludes the first — and the answer is the better of the two.",
        steps: [
          "Handle a single house directly: the answer is its money.",
          "Otherwise run the plain linear House Robber on `nums[0 .. n-2]`.",
          "Run it again on `nums[1 .. n-1]`.",
          "Return the maximum of the two results.",
        ],
        why: "Any valid circular plan must leave out the first house or the last one — it cannot include both. The first case is contained in the range `1 .. n-1` and the second in `0 .. n-2`, and both ranges are plain lines where the original algorithm applies. The two cases together cover every possibility, so the maximum is exact. Overlap between them is harmless: a plan counted twice is still valid.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A single house must be special-cased — otherwise both ranges are empty and the answer comes out as `0`.",
          "The two ranges must each omit exactly one endpoint; omitting neither reintroduces the forbidden pair.",
          "It is not necessary to force either endpoint to be robbed — merely allowing at most one of them is enough.",
          "Two houses works with the same split, each range holding one house.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef rob(nums: List[int]) -> int:\n    def rob_line(row):\n        take, skip = 0, 0\n        for x in row:\n            take, skip = skip + x, max(skip, take)\n        return max(take, skip)\n\n    if len(nums) == 1:\n        return nums[0]\n    return max(rob_line(nums[1:]), rob_line(nums[:-1]))`,
        javascript: `var rob = function(nums) {\n    function robLine(row) {\n        let take = 0, skip = 0;\n        for (const x of row) {\n            const newTake = skip + x;\n            skip = Math.max(skip, take);\n            take = newTake;\n        }\n        return Math.max(take, skip);\n    }\n    if (nums.length === 1) return nums[0];\n    return Math.max(robLine(nums.slice(1)), robLine(nums.slice(0, -1)));\n};`,
              typescript: `function rob(nums: number[]): number {\n    const n = nums.length;\n    if (n === 1) return nums[0];\n    function robRange(lo: number, hi: number): number {\n        let prev = 0;\n        let cur = 0;\n        for (let i = lo; i <= hi; i++) {\n            const next = Math.max(cur, prev + nums[i]);\n            prev = cur;\n            cur = next;\n        }\n        return cur;\n    }\n    return Math.max(robRange(0, n - 2), robRange(1, n - 1));\n}`,
              java: `public static int rob(int[] nums) {\n    int n = nums.length;\n    if (n == 1) return nums[0];\n    return Math.max(robRange(nums, 0, n - 2), robRange(nums, 1, n - 1));\n}\n\nprivate static int robRange(int[] nums, int lo, int hi) {\n    int prev = 0, cur = 0;\n    for (int i = lo; i <= hi; i++) {\n        int next = Math.max(cur, prev + nums[i]);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              cpp: `int robRange(vector<int>& nums, int lo, int hi) {\n    int prev = 0, cur = 0;\n    for (int i = lo; i <= hi; i++) {\n        int next = max(cur, prev + nums[i]);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}\n\nint rob(vector<int>& nums) {\n    int n = (int) nums.size();\n    if (n == 1) return nums[0];\n    return max(robRange(nums, 0, n - 2), robRange(nums, 1, n - 1));\n}`,
              c: `static int robRange(int* nums, int lo, int hi) {\n    int prev = 0, cur = 0;\n    for (int i = lo; i <= hi; i++) {\n        int cand = prev + nums[i];\n        int next = cur > cand ? cur : cand;\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}\n\nint rob(int* nums, int numsSize) {\n    if (numsSize == 1) return nums[0];\n    int a = robRange(nums, 0, numsSize - 2);\n    int b = robRange(nums, 1, numsSize - 1);\n    return a > b ? a : b;\n}`,
              csharp: `public static int Rob(int[] nums)\n{\n    int n = nums.Length;\n    if (n == 1) return nums[0];\n    return Math.Max(RobRange(nums, 0, n - 2), RobRange(nums, 1, n - 1));\n}\n\nprivate static int RobRange(int[] nums, int lo, int hi)\n{\n    int prev = 0, cur = 0;\n    for (int i = lo; i <= hi; i++)\n    {\n        int next = Math.Max(cur, prev + nums[i]);\n        prev = cur;\n        cur = next;\n    }\n    return cur;\n}`,
              go: `func rob(nums []int) int {\n	n := len(nums)\n	if n == 1 {\n		return nums[0]\n	}\n	robRange := func(lo int, hi int) int {\n		prev, cur := 0, 0\n		for i := lo; i <= hi; i++ {\n			next := cur\n			if prev+nums[i] > next {\n				next = prev + nums[i]\n			}\n			prev = cur\n			cur = next\n		}\n		return cur\n	}\n	a := robRange(0, n-2)\n	b := robRange(1, n-1)\n	if a > b {\n		return a\n	}\n	return b\n}`,
              kotlin: `fun rob(nums: IntArray): Int {\n    val n = nums.size\n    if (n == 1) return nums[0]\n    fun robRange(lo: Int, hi: Int): Int {\n        var prev = 0\n        var cur = 0\n        for (i in lo..hi) {\n            val next = maxOf(cur, prev + nums[i])\n            prev = cur\n            cur = next\n        }\n        return cur\n    }\n    return maxOf(robRange(0, n - 2), robRange(1, n - 1))\n}`,
              swift: `func rob(_ nums: [Int]) -> Int {\n    let n = nums.count\n    if n == 1 { return nums[0] }\n    func robRange(_ lo: Int, _ hi: Int) -> Int {\n        var prev = 0\n        var cur = 0\n        var i = lo\n        while i <= hi {\n            let next = max(cur, prev + nums[i])\n            prev = cur\n            cur = next\n            i += 1\n        }\n        return cur\n    }\n    return max(robRange(0, n - 2), robRange(1, n - 1))\n}`,
              rust: `fn rob(nums: Vec<i32>) -> i32 {\n    fn rob_range(nums: &Vec<i32>, lo: usize, hi: usize) -> i32 {\n        let mut prev = 0;\n        let mut cur = 0;\n        let mut i = lo;\n        while i <= hi {\n            let cand = prev + nums[i];\n            let next = if cur > cand { cur } else { cand };\n            prev = cur;\n            cur = next;\n            i += 1;\n        }\n        cur\n    }\n    let n = nums.len();\n    if n == 1 {\n        return nums[0];\n    }\n    let a = rob_range(&nums, 0, n - 2);\n    let b = rob_range(&nums, 1, n - 1);\n    if a > b { a } else { b }\n}`,
              php: `function rob($nums) {\n    $n = count($nums);\n    if ($n === 1) return $nums[0];\n    return max(robRangeHelper($nums, 0, $n - 2), robRangeHelper($nums, 1, $n - 1));\n}\n\nfunction robRangeHelper($nums, $lo, $hi) {\n    $prev = 0;\n    $cur = 0;\n    for ($i = $lo; $i <= $hi; $i++) {\n        $next = max($cur, $prev + $nums[$i]);\n        $prev = $cur;\n        $cur = $next;\n    }\n    return $cur;\n}`,
              ruby: `def rob(nums)\n  n = nums.length\n  return nums[0] if n == 1\n  rob_range = lambda do |lo, hi|\n    prev = 0\n    cur = 0\n    (lo..hi).each do |i|\n      nxt = [cur, prev + nums[i]].max\n      prev = cur\n      cur = nxt\n    end\n    cur\n  end\n  [rob_range.call(0, n - 2), rob_range.call(1, n - 1)].max\nend`,
      },
    };
  })(),

  // ── Maximum Subarray ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = nums[0], cur = nums[0];
      for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
      }
      return best;
    };
    return {
      slug: "maximum-subarray",
      title: "Maximum Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
      signature: { funcName: "maxSubArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, find the **contiguous subarray** (containing at least one number) with the largest sum, and return that sum.",
        [
          { in: "nums = [-2,1,-3,4,-1,2,1,-5,4]", out: "6", note: "[4,-1,2,1] sums to 6." },
          { in: "nums = [5,4,-1,7,8]", out: "23" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "Kadane: best subarray ending here = max(x, previous best ending + x).",
        "Track the global maximum as you sweep.",
      ],
      examples: [
        { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
        { input: "[5,4,-1,7,8]", expectedOutput: "23" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -100, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "Kadane's algorithm. Sweep the array asking one question at each position: is it better to **extend** the best subarray ending at the previous index, or to **start fresh** here? The answer is local — extend only if the running sum is still helping — and the global best is the largest of those per-position bests.",
        steps: [
          "Seed both the running sum and the best answer with the first element.",
          "For each later element, set `cur = max(element, cur + element)`.",
          "Update `best = max(best, cur)`.",
          "Return `best` after the sweep.",
        ],
        why: "`cur` is exactly the largest sum of a subarray **ending at the current index**. Such a subarray either is the single element or extends the best one ending at the previous index — nothing else is possible, since it must be contiguous. Taking the maximum of these values over all endpoints therefore covers every subarray exactly once, which is why one pass suffices. Restarting when the running sum turns negative is the same statement: a negative prefix can only hurt whatever follows.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Seed with `nums[0]`, not `0`. An all-negative array must return its largest (least negative) element, and a zero seed wrongly returns `0`.",
          "The subarray must be non-empty, which is what makes the seeding matter.",
          "Update `best` on every step, not only when restarting.",
          "`cur = max(element, cur + element)` — comparing against the element itself is what performs the restart.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxSubArray(nums: List[int]) -> int:\n    best = cur = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best`,
        javascript: `var maxSubArray = function(nums) {\n    let best = nums[0], cur = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        cur = Math.max(nums[i], cur + nums[i]);\n        best = Math.max(best, cur);\n    }\n    return best;\n};`,
              typescript: `function maxSubArray(nums: number[]): number {\n    let cur = nums[0];\n    let best = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        cur = Math.max(nums[i], cur + nums[i]);\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              java: `public static int maxSubArray(int[] nums) {\n    int cur = nums[0], best = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        cur = Math.max(nums[i], cur + nums[i]);\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              cpp: `int maxSubArray(vector<int>& nums) {\n    int cur = nums[0], best = nums[0];\n    for (int i = 1; i < (int) nums.size(); i++) {\n        cur = max(nums[i], cur + nums[i]);\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              c: `int maxSubArray(int* nums, int numsSize) {\n    int cur = nums[0], best = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        int ext = cur + nums[i];\n        cur = nums[i] > ext ? nums[i] : ext;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              csharp: `public static int MaxSubArray(int[] nums)\n{\n    int cur = nums[0], best = nums[0];\n    for (int i = 1; i < nums.Length; i++)\n    {\n        cur = Math.Max(nums[i], cur + nums[i]);\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              go: `func maxSubArray(nums []int) int {\n	cur := nums[0]\n	best := nums[0]\n	for i := 1; i < len(nums); i++ {\n		ext := cur + nums[i]\n		if nums[i] > ext {\n			cur = nums[i]\n		} else {\n			cur = ext\n		}\n		if cur > best {\n			best = cur\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxSubArray(nums: IntArray): Int {\n    var cur = nums[0]\n    var best = nums[0]\n    for (i in 1 until nums.size) {\n        cur = maxOf(nums[i], cur + nums[i])\n        if (cur > best) best = cur\n    }\n    return best\n}`,
              swift: `func maxSubArray(_ nums: [Int]) -> Int {\n    var cur = nums[0]\n    var best = nums[0]\n    var i = 1\n    while i < nums.count {\n        cur = max(nums[i], cur + nums[i])\n        if cur > best { best = cur }\n        i += 1\n    }\n    return best\n}`,
              rust: `fn maxSubArray(nums: Vec<i32>) -> i32 {\n    let mut cur = nums[0];\n    let mut best = nums[0];\n    for i in 1..nums.len() {\n        let ext = cur + nums[i];\n        cur = if nums[i] > ext { nums[i] } else { ext };\n        if cur > best {\n            best = cur;\n        }\n    }\n    best\n}`,
              php: `function maxSubArray($nums) {\n    $cur = $nums[0];\n    $best = $nums[0];\n    $n = count($nums);\n    for ($i = 1; $i < $n; $i++) {\n        $cur = max($nums[$i], $cur + $nums[$i]);\n        if ($cur > $best) $best = $cur;\n    }\n    return $best;\n}`,
              ruby: `def maxSubArray(nums)\n  cur = nums[0]\n  best = nums[0]\n  (1...nums.length).each do |i|\n    cur = [nums[i], cur + nums[i]].max\n    best = cur if cur > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Coin Change ─────────────────────────────────────────────────
  (() => {
    const ref = (coins: number[], amount: number) => {
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0;
      for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
          if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
      }
      return dp[amount] === Infinity ? -1 : dp[amount];
    };
    return {
      slug: "coin-change",
      title: "Coin Change",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Breadth-First Search"],
      signature: { funcName: "coinChange", params: [{ name: "coins", type: "int[]" as const }, { name: "amount", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given coin denominations `coins` (infinite supply of each) and a total `amount`, return the **fewest coins** needed to make up that amount, or `-1` if it cannot be made.",
        [
          { in: "coins = [1,2,5], amount = 11", out: "3", note: "5 + 5 + 1." },
          { in: "coins = [2], amount = 3", out: "-1" },
          { in: "coins = [1], amount = 0", out: "0" },
        ],
        ["1 <= coins.length <= 5", "1 <= coins[i] <= 25", "0 <= amount <= 100"]),
      hints: [
        "dp[a] = fewest coins for amount a; build up from 0.",
        "dp[a] = 1 + min(dp[a - c]) over all usable coins c.",
      ],
      examples: [
        { input: "[1,2,5]\n11", expectedOutput: "3" },
        { input: "[2]\n3", expectedOutput: "-1" },
        { input: "[1]\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 25 }, (_, i) => i + 1));
        const coins = pool.slice(0, ri(rng, 1, 5));
        const amount = ri(rng, 0, 100);
        return { input: `${fmtIntArr(coins)}\n${amount}`, expectedOutput: String(ref(coins, amount)) };
      },
      editorial: explain({
        idea: "Work upwards through every amount from `1` to the target. To make amount `a`, the last coin used was some `c`, leaving the subproblem `a - c` — already solved. So `best[a] = 1 + min(best[a - c])` over all coins that fit. This is an unbounded knapsack, and building it bottom-up means each amount is solved once.",
        steps: [
          "Create a table `best[0 .. amount]`, filled with a sentinel meaning \"unreachable\", and set `best[0] = 0`.",
          "For each amount `a` from `1` upwards, try every coin `c` that is at most `a`.",
          "If `a - c` is reachable, consider `best[a - c] + 1` and keep the smallest.",
          "After the sweep, return `best[amount]`, or `-1` if it is still unreachable.",
        ],
        why: "Every way of making `a` ends with some coin, and removing that coin leaves a valid — and independently optimal — way of making `a - c`; if it were not optimal you could substitute a better one and improve `a`. That is optimal substructure. Sweeping amounts in increasing order guarantees every `a - c` is final before `a` is computed, and because coins may repeat, `a - c` may itself already use `c` — which is exactly what unbounded reuse requires.",
        time: "O(amount · coins)",
        space: "O(amount)",
        pitfalls: [
          "Distinguish unreachable from zero. A sentinel like `amount + 1` works because no valid answer can exceed `amount`.",
          "Guard `a - c >= 0` before indexing.",
          "Greedy — always taking the largest coin — is wrong here: with coins `[1, 3, 4]` and amount `6` it gives 3 coins instead of 2.",
          "`amount = 0` must answer `0`, which the base case handles.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef coinChange(coins: List[int], amount: int) -> int:\n    INF = float("inf")\n    dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]:\n                dp[a] = dp[a - c] + 1\n    return -1 if dp[amount] == INF else dp[amount]`,
        javascript: `var coinChange = function(coins, amount) {\n    const dp = new Array(amount + 1).fill(Infinity);\n    dp[0] = 0;\n    for (let a = 1; a <= amount; a++) {\n        for (const c of coins) {\n            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n        }\n    }\n    return dp[amount] === Infinity ? -1 : dp[amount];\n};`,
              typescript: `function coinChange(coins: number[], amount: number): number {\n    const INF = amount + 1;\n    const best: number[] = [];\n    for (let a = 0; a <= amount; a++) best.push(INF);\n    best[0] = 0;\n    for (let a = 1; a <= amount; a++) {\n        for (let i = 0; i < coins.length; i++) {\n            const c = coins[i];\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;\n        }\n    }\n    return best[amount] > amount ? -1 : best[amount];\n}`,
              java: `public static int coinChange(int[] coins, int amount) {\n    int INF = amount + 1;\n    int[] best = new int[amount + 1];\n    Arrays.fill(best, INF);\n    best[0] = 0;\n    for (int a = 1; a <= amount; a++) {\n        for (int c : coins) {\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;\n        }\n    }\n    return best[amount] > amount ? -1 : best[amount];\n}`,
              cpp: `int coinChange(vector<int>& coins, int amount) {\n    int INF = amount + 1;\n    vector<int> best(amount + 1, INF);\n    best[0] = 0;\n    for (int a = 1; a <= amount; a++) {\n        for (int c : coins) {\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;\n        }\n    }\n    return best[amount] > amount ? -1 : best[amount];\n}`,
              c: `int coinChange(int* coins, int coinsSize, int amount) {\n    int INF = amount + 1;\n    int* best = (int*) malloc((amount + 1) * sizeof(int));\n    for (int a = 0; a <= amount; a++) best[a] = INF;\n    best[0] = 0;\n    for (int a = 1; a <= amount; a++) {\n        for (int i = 0; i < coinsSize; i++) {\n            int c = coins[i];\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;\n        }\n    }\n    int ans = best[amount] > amount ? -1 : best[amount];\n    free(best);\n    return ans;\n}`,
              csharp: `public static int CoinChange(int[] coins, int amount)\n{\n    int INF = amount + 1;\n    int[] best = new int[amount + 1];\n    for (int a = 0; a <= amount; a++) best[a] = INF;\n    best[0] = 0;\n    for (int a = 1; a <= amount; a++)\n    {\n        foreach (int c in coins)\n        {\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;\n        }\n    }\n    return best[amount] > amount ? -1 : best[amount];\n}`,
              go: `func coinChange(coins []int, amount int) int {\n	INF := amount + 1\n	best := make([]int, amount+1)\n	for a := range best {\n		best[a] = INF\n	}\n	best[0] = 0\n	for a := 1; a <= amount; a++ {\n		for _, c := range coins {\n			if c <= a && best[a-c]+1 < best[a] {\n				best[a] = best[a-c] + 1\n			}\n		}\n	}\n	if best[amount] > amount {\n		return -1\n	}\n	return best[amount]\n}`,
              kotlin: `fun coinChange(coins: IntArray, amount: Int): Int {\n    val INF = amount + 1\n    val best = IntArray(amount + 1) { INF }\n    best[0] = 0\n    for (a in 1..amount) {\n        for (c in coins) {\n            if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1\n        }\n    }\n    return if (best[amount] > amount) -1 else best[amount]\n}`,
              swift: `func coinChange(_ coins: [Int], _ amount: Int) -> Int {\n    let INF = amount + 1\n    var best = [Int](repeating: INF, count: amount + 1)\n    best[0] = 0\n    if amount >= 1 {\n        for a in 1...amount {\n            for c in coins {\n                if c <= a && best[a - c] + 1 < best[a] { best[a] = best[a - c] + 1 }\n            }\n        }\n    }\n    return best[amount] > amount ? -1 : best[amount]\n}`,
              rust: `fn coinChange(coins: Vec<i32>, amount: i32) -> i32 {\n    let amt = amount as usize;\n    let inf = amount + 1;\n    let mut best = vec![inf; amt + 1];\n    best[0] = 0;\n    for a in 1..=amt {\n        for &c in coins.iter() {\n            let cu = c as usize;\n            if cu <= a && best[a - cu] + 1 < best[a] {\n                best[a] = best[a - cu] + 1;\n            }\n        }\n    }\n    if best[amt] > amount { -1 } else { best[amt] }\n}`,
              php: `function coinChange($coins, $amount) {\n    $INF = $amount + 1;\n    $best = array_fill(0, $amount + 1, $INF);\n    $best[0] = 0;\n    for ($a = 1; $a <= $amount; $a++) {\n        foreach ($coins as $c) {\n            if ($c <= $a && $best[$a - $c] + 1 < $best[$a]) $best[$a] = $best[$a - $c] + 1;\n        }\n    }\n    return $best[$amount] > $amount ? -1 : $best[$amount];\n}`,
              ruby: `def coinChange(coins, amount)\n  inf = amount + 1\n  best = Array.new(amount + 1, inf)\n  best[0] = 0\n  (1..amount).each do |a|\n    coins.each do |c|\n      best[a] = best[a - c] + 1 if c <= a && best[a - c] + 1 < best[a]\n    end\n  end\n  best[amount] > amount ? -1 : best[amount]\nend`,
      },
    };
  })(),

  // ── Coin Change II ──────────────────────────────────────────────
  (() => {
    const ref = (amount: number, coins: number[]) => {
      const dp = new Array(amount + 1).fill(0);
      dp[0] = 1;
      for (const c of coins) {
        for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
      }
      return dp[amount];
    };
    return {
      slug: "coin-change-ii",
      title: "Coin Change II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "change", params: [{ name: "amount", type: "int" as const }, { name: "coins", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given distinct coin denominations `coins` (infinite supply) and a total `amount`, return the **number of combinations** that make up that amount (order does not matter). If it cannot be made, return `0`.",
        [
          { in: "amount = 5, coins = [1,2,5]", out: "4", note: "5, 2+2+1, 2+1+1+1, 1+1+1+1+1." },
          { in: "amount = 3, coins = [2]", out: "0" },
        ],
        ["1 <= coins.length <= 5", "1 <= coins[i] <= 20 (distinct)", "0 <= amount <= 60"]),
      hints: [
        "Loop coins on the OUTSIDE so each combination is counted once.",
        "dp[a] += dp[a - c] for each coin c.",
      ],
      examples: [
        { input: "5\n[1,2,5]", expectedOutput: "4" },
        { input: "3\n[2]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 20 }, (_, i) => i + 1));
        const coins = pool.slice(0, ri(rng, 1, 5));
        const amount = ri(rng, 0, 60);
        return { input: `${amount}\n${fmtIntArr(coins)}`, expectedOutput: String(ref(amount, coins)) };
      },
      editorial: explain({
        idea: "Counting **combinations** rather than permutations hinges entirely on loop order. Put the coins on the **outer** loop and the amounts on the inner one: that way each coin is considered once as a whole, so `[1,2]` and `[2,1]` are never counted as different answers.",
        steps: [
          "Create `ways[0 .. amount]`, all zero except `ways[0] = 1` — there is exactly one way to make nothing.",
          "For each coin `c` (outer loop):",
          "Sweep `a` from `c` up to `amount` and add `ways[a - c]` to `ways[a]`.",
          "Return `ways[amount]`.",
        ],
        why: "After processing the first `k` coins, `ways[a]` counts the combinations of `a` using only those coins — so no ordering is ever introduced, because a coin is only ever added to totals already built from coins earlier in the list. Sweeping the amount **upwards** within a coin is what permits reusing that coin any number of times: `ways[a - c]` may itself already include copies of `c`. Swapping the loops would instead count ordered sequences, the answer to a different problem.",
        time: "O(amount · coins)",
        space: "O(amount)",
        pitfalls: [
          "Coins outer, amounts inner. Reversing the loops counts permutations and inflates the answer.",
          "`ways[0] = 1` is the seed that makes everything else non-zero.",
          "Sweep the amount upwards (not downwards) — downwards would forbid reusing the coin, solving the 0/1 knapsack instead.",
          "An unmakeable amount naturally ends at `0`; no sentinel is needed.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef change(amount: int, coins: List[int]) -> int:\n    dp = [1] + [0] * amount\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] += dp[a - c]\n    return dp[amount]`,
        javascript: `var change = function(amount, coins) {\n    const dp = new Array(amount + 1).fill(0);\n    dp[0] = 1;\n    for (const c of coins) {\n        for (let a = c; a <= amount; a++) dp[a] += dp[a - c];\n    }\n    return dp[amount];\n};`,
              typescript: `function change(amount: number, coins: number[]): number {\n    const ways: number[] = [];\n    for (let a = 0; a <= amount; a++) ways.push(0);\n    ways[0] = 1;\n    for (let i = 0; i < coins.length; i++) {\n        const c = coins[i];\n        for (let a = c; a <= amount; a++) ways[a] += ways[a - c];\n    }\n    return ways[amount];\n}`,
              java: `public static int change(int amount, int[] coins) {\n    int[] ways = new int[amount + 1];\n    ways[0] = 1;\n    for (int c : coins) {\n        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];\n    }\n    return ways[amount];\n}`,
              cpp: `int change(int amount, vector<int>& coins) {\n    vector<int> ways(amount + 1, 0);\n    ways[0] = 1;\n    for (int c : coins) {\n        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];\n    }\n    return ways[amount];\n}`,
              c: `int change(int amount, int* coins, int coinsSize) {\n    int* ways = (int*) calloc(amount + 1, sizeof(int));\n    ways[0] = 1;\n    for (int i = 0; i < coinsSize; i++) {\n        int c = coins[i];\n        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];\n    }\n    int ans = ways[amount];\n    free(ways);\n    return ans;\n}`,
              csharp: `public static int Change(int amount, int[] coins)\n{\n    int[] ways = new int[amount + 1];\n    ways[0] = 1;\n    foreach (int c in coins)\n    {\n        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];\n    }\n    return ways[amount];\n}`,
              go: `func change(amount int, coins []int) int {\n	ways := make([]int, amount+1)\n	ways[0] = 1\n	for _, c := range coins {\n		for a := c; a <= amount; a++ {\n			ways[a] += ways[a-c]\n		}\n	}\n	return ways[amount]\n}`,
              kotlin: `fun change(amount: Int, coins: IntArray): Int {\n    val ways = IntArray(amount + 1)\n    ways[0] = 1\n    for (c in coins) {\n        for (a in c..amount) ways[a] += ways[a - c]\n    }\n    return ways[amount]\n}`,
              swift: `func change(_ amount: Int, _ coins: [Int]) -> Int {\n    var ways = [Int](repeating: 0, count: amount + 1)\n    ways[0] = 1\n    for c in coins {\n        if c > amount { continue }\n        for a in c...amount {\n            ways[a] += ways[a - c]\n        }\n    }\n    return ways[amount]\n}`,
              rust: `fn change(amount: i32, coins: Vec<i32>) -> i32 {\n    let amt = amount as usize;\n    let mut ways = vec![0i32; amt + 1];\n    ways[0] = 1;\n    for &c in coins.iter() {\n        let cu = c as usize;\n        if cu > amt {\n            continue;\n        }\n        for a in cu..=amt {\n            ways[a] += ways[a - cu];\n        }\n    }\n    ways[amt]\n}`,
              php: `function change($amount, $coins) {\n    $ways = array_fill(0, $amount + 1, 0);\n    $ways[0] = 1;\n    foreach ($coins as $c) {\n        for ($a = $c; $a <= $amount; $a++) $ways[$a] += $ways[$a - $c];\n    }\n    return $ways[$amount];\n}`,
              ruby: `def change(amount, coins)\n  ways = Array.new(amount + 1, 0)\n  ways[0] = 1\n  coins.each do |c|\n    (c..amount).each do |a|\n      ways[a] += ways[a - c]\n    end\n  end\n  ways[amount]\nend`,
      },
    };
  })(),

  // ── Longest Increasing Subsequence ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const tails: number[] = [];
      for (const x of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (tails[mid] < x) lo = mid + 1;
          else hi = mid;
        }
        tails[lo] = x;
      }
      return tails.length;
    };
    return {
      slug: "longest-increasing-subsequence",
      title: "Longest Increasing Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Binary Search"],
      signature: { funcName: "lengthOfLIS", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the length of the **longest strictly increasing subsequence**.",
        [
          { in: "nums = [10,9,2,5,3,7,101,18]", out: "4", note: "[2,3,7,101] (or [2,5,7,101])." },
          { in: "nums = [7,7,7,7,7,7,7]", out: "1" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"],
        "the O(n log n) 'patience sorting' solution keeps an array of smallest tail values."),
      hints: [
        "O(n²): dp[i] = 1 + max(dp[j]) over j < i with nums[j] < nums[i].",
        "O(n log n): maintain tails[k] = smallest tail of an increasing subsequence of length k+1; binary-search each element in.",
      ],
      examples: [
        { input: "[10,9,2,5,3,7,101,18]", expectedOutput: "4" },
        { input: "[7,7,7,7,7,7,7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -100, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "Let `best[i]` be the length of the longest increasing subsequence **ending exactly at index `i`**. Any such subsequence's second-to-last element sits at some earlier index `j` with a smaller value, so `best[i] = 1 + max(best[j])` over those `j`. The answer is the largest entry in the table.",
        steps: [
          "Set every `best[i]` to `1` — each element alone is a subsequence.",
          "For each `i`, scan all earlier `j`.",
          "If `nums[j] < nums[i]`, the subsequence ending at `j` can be extended: take `best[j] + 1` if it improves `best[i]`.",
          "Return the maximum value in `best`.",
        ],
        why: "Anchoring the state at the *ending index* is what removes the ambiguity — subsequences are not contiguous, so \"the best up to `i`\" is not enough information to extend correctly, but \"the best ending at `i`\" is. Every increasing subsequence has a unique last element, so scanning all endpoints covers each exactly once. An `O(n log n)` variant keeps a list of the smallest possible tail value for each length and binary-searches it, which matters at larger inputs.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "The comparison is **strict** (`<`); using `<=` counts equal values and turns this into non-decreasing subsequences.",
          "The answer is the maximum over the whole table, not `best[n-1]` — the longest run need not end at the last element.",
          "Initialise to `1`, not `0`; every element is a subsequence of length one.",
          "An all-equal array answers `1`, which is a good check of the strictness.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport bisect\n\ndef lengthOfLIS(nums: List[int]) -> int:\n    tails = []\n    for x in nums:\n        i = bisect.bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x\n    return len(tails)`,
        javascript: `var lengthOfLIS = function(nums) {\n    const tails = [];\n    for (const x of nums) {\n        let lo = 0, hi = tails.length;\n        while (lo < hi) {\n            const mid = (lo + hi) >> 1;\n            if (tails[mid] < x) lo = mid + 1;\n            else hi = mid;\n        }\n        tails[lo] = x;\n    }\n    return tails.length;\n};`,
              typescript: `function lengthOfLIS(nums: number[]): number {\n    const n = nums.length;\n    const best: number[] = [];\n    for (let i = 0; i < n; i++) best.push(1);\n    let answer = 1;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < i; j++) {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}`,
              java: `public static int lengthOfLIS(int[] nums) {\n    int n = nums.length;\n    int[] best = new int[n];\n    Arrays.fill(best, 1);\n    int answer = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}`,
              cpp: `int lengthOfLIS(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> best(n, 1);\n    int answer = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}`,
              c: `int lengthOfLIS(int* nums, int numsSize) {\n    int n = numsSize;\n    int* best = (int*) malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) best[i] = 1;\n    int answer = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    free(best);\n    return answer;\n}`,
              csharp: `public static int LengthOfLIS(int[] nums)\n{\n    int n = nums.Length;\n    int[] best = new int[n];\n    for (int i = 0; i < n; i++) best[i] = 1;\n    int answer = 1;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < i; j++)\n        {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}`,
              go: `func lengthOfLIS(nums []int) int {\n	n := len(nums)\n	best := make([]int, n)\n	for i := range best {\n		best[i] = 1\n	}\n	answer := 1\n	for i := 0; i < n; i++ {\n		for j := 0; j < i; j++ {\n			if nums[j] < nums[i] && best[j]+1 > best[i] {\n				best[i] = best[j] + 1\n			}\n		}\n		if best[i] > answer {\n			answer = best[i]\n		}\n	}\n	return answer\n}`,
              kotlin: `fun lengthOfLIS(nums: IntArray): Int {\n    val n = nums.size\n    val best = IntArray(n) { 1 }\n    var answer = 1\n    for (i in 0 until n) {\n        for (j in 0 until i) {\n            if (nums[j] < nums[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1\n        }\n        if (best[i] > answer) answer = best[i]\n    }\n    return answer\n}`,
              swift: `func lengthOfLIS(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var best = [Int](repeating: 1, count: n)\n    var answer = 1\n    for i in 0..<n {\n        for j in 0..<i {\n            if nums[j] < nums[i] && best[j] + 1 > best[i] { best[i] = best[j] + 1 }\n        }\n        if best[i] > answer { answer = best[i] }\n    }\n    return answer\n}`,
              rust: `fn lengthOfLIS(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut best = vec![1i32; n];\n    let mut answer = 1;\n    for i in 0..n {\n        for j in 0..i {\n            if nums[j] < nums[i] && best[j] + 1 > best[i] {\n                best[i] = best[j] + 1;\n            }\n        }\n        if best[i] > answer {\n            answer = best[i];\n        }\n    }\n    answer\n}`,
              php: `function lengthOfLIS($nums) {\n    $n = count($nums);\n    $best = array_fill(0, $n, 1);\n    $answer = 1;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $i; $j++) {\n            if ($nums[$j] < $nums[$i] && $best[$j] + 1 > $best[$i]) $best[$i] = $best[$j] + 1;\n        }\n        if ($best[$i] > $answer) $answer = $best[$i];\n    }\n    return $answer;\n}`,
              ruby: `def lengthOfLIS(nums)\n  n = nums.length\n  best = Array.new(n, 1)\n  answer = 1\n  (0...n).each do |i|\n    (0...i).each do |j|\n      best[i] = best[j] + 1 if nums[j] < nums[i] && best[j] + 1 > best[i]\n    end\n    answer = best[i] if best[i] > answer\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Word Break ──────────────────────────────────────────────────
  (() => {
    const ref = (s: string, wordDict: string[]) => {
      const words = new Set(wordDict);
      const dp = new Array(s.length + 1).fill(false);
      dp[0] = true;
      for (let i = 1; i <= s.length; i++) {
        for (let j = 0; j < i; j++) {
          if (dp[j] && words.has(s.slice(j, i))) {
            dp[i] = true;
            break;
          }
        }
      }
      return dp[s.length];
    };
    return {
      slug: "word-break",
      title: "Word Break",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Hash Table", "Trie"],
      signature: { funcName: "wordBreak", params: [{ name: "s", type: "string" as const }, { name: "wordDict", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s` and a dictionary `wordDict`, return `true` if `s` can be segmented into a **space-separated sequence** of one or more dictionary words (words may be reused).",
        [
          { in: 's = "leetcode", wordDict = ["leet","code"]', out: "true" },
          { in: 's = "applepenapple", wordDict = ["apple","pen"]', out: "true" },
          { in: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', out: "false" },
        ],
        ["1 <= s.length <= 20", "1 <= wordDict.length <= 8", "1 <= wordDict[i].length <= 5", "Lowercase letters; dictionary words are distinct."]),
      hints: [
        "dp[i]: can the prefix of length i be segmented?",
        "dp[i] is true if some j < i has dp[j] true and s[j..i) in the dictionary.",
      ],
      examples: [
        { input: '"leetcode"\n["leet","code"]', expectedOutput: "true" },
        { input: '"applepenapple"\n["apple","pen"]', expectedOutput: "true" },
        { input: '"catsandog"\n["cats","dog","sand","and","cat"]', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const dictSet = new Set<string>();
        const dictSize = ri(rng, 1, 8);
        while (dictSet.size < dictSize) dictSet.add(randLower(rng, 1, 5, "ab"));
        const wordDict = [...dictSet];
        let s: string;
        if (rng() < 0.55) {
          s = "";
          while (s.length < 12) s += wordDict[ri(rng, 0, wordDict.length - 1)];
          s = s.slice(0, 20);
          if (rng() < 0.3) s += "a";
        } else {
          s = randLower(rng, 1, 20, "ab");
        }
        return { input: `"${s}"\n${fmtStrArr(wordDict)}`, expectedOutput: bool(ref(s, wordDict)) };
      },
      editorial: explain({
        idea: "Let `ok[i]` mean \"the first `i` characters can be segmented\". The prefix of length `i` is segmentable when some dictionary word `w` ends exactly at `i` and the prefix before it, of length `i - |w|`, is itself segmentable. Build the flags left to right and every lookup is already resolved.",
        steps: [
          "Set `ok[0] = true` — the empty prefix is trivially segmentable.",
          "For each length `i` from `1` to `|s|`, try every dictionary word `w`.",
          "If `|w| <= i`, `ok[i - |w|]` is true, and `s` matches `w` at position `i - |w|`, then mark `ok[i]` and stop trying words for this `i`.",
          "Return `ok[|s|]`.",
        ],
        why: "Any segmentation has a unique final word, so splitting on that word covers every possibility without overlap — and the part before it must itself be a valid segmentation, which is the optimal-substructure property. Memoising the flags is what avoids the exponential blow-up of plain recursion: the same prefix would otherwise be re-explored once for every path that reaches it.",
        time: "O(|s| · |dict| · maxWordLength)",
        space: "O(|s|)",
        pitfalls: [
          "`ok[0] = true` is the seed; without it nothing is ever reachable.",
          "Words may be **reused** any number of times, so there is no bookkeeping of which words were consumed.",
          "Check `ok[i - |w|]` *before* the string comparison — a matching word after an unreachable prefix proves nothing.",
          "Greedily taking the longest matching word fails: `\"catsandog\"` with `[\"cats\",\"cat\",\"sand\",\"and\",\"dog\"]` needs the shorter `\"cat\"` first.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef wordBreak(s: str, wordDict: List[str]) -> bool:\n    words = set(wordDict)\n    dp = [True] + [False] * len(s)\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in words:\n                dp[i] = True\n                break\n    return dp[len(s)]`,
        javascript: `var wordBreak = function(s, wordDict) {\n    const words = new Set(wordDict);\n    const dp = new Array(s.length + 1).fill(false);\n    dp[0] = true;\n    for (let i = 1; i <= s.length; i++) {\n        for (let j = 0; j < i; j++) {\n            if (dp[j] && words.has(s.slice(j, i))) {\n                dp[i] = true;\n                break;\n            }\n        }\n    }\n    return dp[s.length];\n};`,
              typescript: `function wordBreak(s: string, wordDict: string[]): boolean {\n    const n = s.length;\n    const ok: boolean[] = [];\n    for (let i = 0; i <= n; i++) ok.push(false);\n    ok[0] = true;\n    for (let i = 1; i <= n; i++) {\n        for (let k = 0; k < wordDict.length; k++) {\n            const w = wordDict[k];\n            const L = w.length;\n            if (L <= i && ok[i - L] && s.substring(i - L, i) === w) {\n                ok[i] = true;\n                break;\n            }\n        }\n    }\n    return ok[n];\n}`,
              java: `public static boolean wordBreak(String s, String[] wordDict) {\n    int n = s.length();\n    boolean[] ok = new boolean[n + 1];\n    ok[0] = true;\n    for (int i = 1; i <= n; i++) {\n        for (String w : wordDict) {\n            int L = w.length();\n            if (L <= i && ok[i - L] && s.substring(i - L, i).equals(w)) {\n                ok[i] = true;\n                break;\n            }\n        }\n    }\n    return ok[n];\n}`,
              cpp: `bool wordBreak(string s, vector<string>& wordDict) {\n    int n = (int) s.size();\n    vector<bool> ok(n + 1, false);\n    ok[0] = true;\n    for (int i = 1; i <= n; i++) {\n        for (const string& w : wordDict) {\n            int L = (int) w.size();\n            if (L <= i && ok[i - L] && s.compare(i - L, L, w) == 0) {\n                ok[i] = true;\n                break;\n            }\n        }\n    }\n    return ok[n];\n}`,
              c: `bool wordBreak(const char* s, char** wordDict, int wordDictSize) {\n    int n = (int) strlen(s);\n    int* ok = (int*) calloc(n + 1, sizeof(int));\n    ok[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        for (int k = 0; k < wordDictSize; k++) {\n            int L = (int) strlen(wordDict[k]);\n            if (L <= i && ok[i - L] && strncmp(s + i - L, wordDict[k], L) == 0) {\n                ok[i] = 1;\n                break;\n            }\n        }\n    }\n    bool ans = ok[n] != 0;\n    free(ok);\n    return ans;\n}`,
              csharp: `public static bool WordBreak(string s, string[] wordDict)\n{\n    int n = s.Length;\n    bool[] ok = new bool[n + 1];\n    ok[0] = true;\n    for (int i = 1; i <= n; i++)\n    {\n        foreach (string w in wordDict)\n        {\n            int L = w.Length;\n            if (L <= i && ok[i - L] && s.Substring(i - L, L) == w)\n            {\n                ok[i] = true;\n                break;\n            }\n        }\n    }\n    return ok[n];\n}`,
              go: `func wordBreak(s string, wordDict []string) bool {\n	n := len(s)\n	ok := make([]bool, n+1)\n	ok[0] = true\n	for i := 1; i <= n; i++ {\n		for _, w := range wordDict {\n			L := len(w)\n			if L <= i && ok[i-L] && s[i-L:i] == w {\n				ok[i] = true\n				break\n			}\n		}\n	}\n	return ok[n]\n}`,
              kotlin: `fun wordBreak(s: String, wordDict: Array<String>): Boolean {\n    val n = s.length\n    val ok = BooleanArray(n + 1)\n    ok[0] = true\n    for (i in 1..n) {\n        for (w in wordDict) {\n            val L = w.length\n            if (L <= i && ok[i - L] && s.substring(i - L, i) == w) {\n                ok[i] = true\n                break\n            }\n        }\n    }\n    return ok[n]\n}`,
              swift: `func wordBreak(_ s: String, _ wordDict: [String]) -> Bool {\n    let chars = Array(s)\n    let n = chars.count\n    var ok = [Bool](repeating: false, count: n + 1)\n    ok[0] = true\n    let words = wordDict.map { Array($0) }\n    for i in 1...max(n, 1) {\n        if i > n { break }\n        for w in words {\n            let L = w.count\n            if L <= i && ok[i - L] {\n                var match = true\n                for k in 0..<L {\n                    if chars[i - L + k] != w[k] {\n                        match = false\n                        break\n                    }\n                }\n                if match {\n                    ok[i] = true\n                    break\n                }\n            }\n        }\n    }\n    return ok[n]\n}`,
              rust: `fn wordBreak(s: String, wordDict: Vec<String>) -> bool {\n    let b: Vec<u8> = s.bytes().collect();\n    let n = b.len();\n    let words: Vec<Vec<u8>> = wordDict.iter().map(|w| w.bytes().collect()).collect();\n    let mut ok = vec![false; n + 1];\n    ok[0] = true;\n    for i in 1..=n {\n        for w in words.iter() {\n            let l = w.len();\n            if l <= i && ok[i - l] && &b[i - l..i] == &w[..] {\n                ok[i] = true;\n                break;\n            }\n        }\n    }\n    ok[n]\n}`,
              php: `function wordBreak($s, $wordDict) {\n    $n = strlen($s);\n    $ok = array_fill(0, $n + 1, false);\n    $ok[0] = true;\n    for ($i = 1; $i <= $n; $i++) {\n        foreach ($wordDict as $w) {\n            $L = strlen($w);\n            if ($L <= $i && $ok[$i - $L] && substr($s, $i - $L, $L) === $w) {\n                $ok[$i] = true;\n                break;\n            }\n        }\n    }\n    return $ok[$n];\n}`,
              ruby: `def wordBreak(s, wordDict)\n  n = s.length\n  ok = Array.new(n + 1, false)\n  ok[0] = true\n  (1..n).each do |i|\n    wordDict.each do |w|\n      len = w.length\n      if len <= i && ok[i - len] && s[(i - len)...i] == w\n        ok[i] = true\n        break\n      end\n    end\n  end\n  ok[n]\nend`,
      },
    };
  })(),

  // ── Decode Ways ─────────────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      if (s.length === 0 || s[0] === "0") return s.length === 0 ? 0 : 0;
      let prev = 1, cur = 1;
      for (let i = 1; i < s.length; i++) {
        let next = 0;
        if (s[i] !== "0") next += cur;
        const two = parseInt(s.slice(i - 1, i + 1), 10);
        if (two >= 10 && two <= 26) next += prev;
        prev = cur;
        cur = next;
        if (cur === 0) return 0;
      }
      return cur;
    };
    return {
      slug: "decode-ways",
      title: "Decode Ways",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming"],
      signature: { funcName: "numDecodings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        'A message of letters A–Z is encoded with `A=1, B=2, … Z=26` and you receive only the digit string `s`. Return the **number of ways** to decode it (grouping digits into valid codes 1–26; codes with leading zeros are invalid).\n\nIf no decoding exists, return `0`.',
        [
          { in: 's = "12"', out: "2", note: '"AB" (1,2) or "L" (12).' },
          { in: 's = "226"', out: "3", note: '"BZ", "VF", or "BBF".' },
          { in: 's = "06"', out: "0", note: '"06" cannot map to any code.' },
        ],
        ["1 <= s.length <= 20", "s contains only digits."]),
      hints: [
        "dp over positions: ways(i) = ways(i-1) if s[i] != '0', plus ways(i-2) if s[i-1..i] is 10–26.",
        "A '0' must pair with a preceding 1 or 2, otherwise the count collapses to 0.",
      ],
      examples: [
        { input: '"12"', expectedOutput: "2" },
        { input: '"226"', expectedOutput: "3" },
        { input: '"06"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const digits = "1234567890";
        const s = Array.from({ length: ri(rng, 1, 20) }, () => digits[ri(rng, 0, rng() < 0.8 ? 8 : 9)]).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      editorial: explain({
        idea: "A decoding is built by consuming the string from the left, one or two digits at a time. So the number of decodings of a prefix of length `i` is the count for `i-1` (if the single digit `s[i-1]` is a valid code) plus the count for `i-2` (if the pair `s[i-2..i-1]` is between 10 and 26). It is Fibonacci with validity conditions attached.",
        steps: [
          "Return `0` immediately if the string starts with `'0'` — nothing can decode it.",
          "Seed `prev2 = 1` (empty prefix) and `prev1 = 1` (first character, known valid).",
          "For each `i` from `2` to `|s|`, start `cur` at zero.",
          "If `s[i-1]` is not `'0'`, add `prev1` — the digit stands alone.",
          "If the two-digit value `s[i-2..i-1]` lies in `10..26`, add `prev2`. Shift the window and continue; `prev1` ends as the answer.",
        ],
        why: "Every decoding has a unique final code, of length one or two, and stripping it leaves a decoding of a strictly shorter prefix. The two cases are disjoint (they consume different numbers of characters) and exhaustive, so adding their counts is exact. The validity guards are what make it more than Fibonacci: a `'0'` cannot stand alone, and a pair only counts if it names a real letter, which is why the leading digit of the pair must not be `'0'` either.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`\"06\"` is invalid — a two-digit code must not have a leading zero, so the range check must start at `10`, not `0`.",
          "A `'0'` can never be decoded alone; it only survives as the second digit of `10` or `20`.",
          "A string starting with `'0'` answers `0`, and so does any string containing an undecodable zero — which falls out because `cur` becomes `0` and propagates.",
          "Seed `prev2 = 1` for the empty prefix, or every two-digit code is undercounted.",
        ],
      }),
      solutions: {
        python: `def numDecodings(s: str) -> int:\n    if not s or s[0] == "0":\n        return 0\n    prev, cur = 1, 1\n    for i in range(1, len(s)):\n        nxt = 0\n        if s[i] != "0":\n            nxt += cur\n        two = int(s[i - 1:i + 1])\n        if 10 <= two <= 26:\n            nxt += prev\n        prev, cur = cur, nxt\n        if cur == 0:\n            return 0\n    return cur`,
        javascript: `var numDecodings = function(s) {\n    if (s.length === 0 || s[0] === "0") return 0;\n    let prev = 1, cur = 1;\n    for (let i = 1; i < s.length; i++) {\n        let next = 0;\n        if (s[i] !== "0") next += cur;\n        const two = parseInt(s.slice(i - 1, i + 1), 10);\n        if (two >= 10 && two <= 26) next += prev;\n        prev = cur;\n        cur = next;\n        if (cur === 0) return 0;\n    }\n    return cur;\n};`,
              typescript: `function numDecodings(s: string): number {\n    const n = s.length;\n    if (s.charAt(0) === "0") return 0;\n    let prev2 = 1;\n    let prev1 = 1;\n    for (let i = 2; i <= n; i++) {\n        let cur = 0;\n        if (s.charAt(i - 1) !== "0") cur += prev1;\n        const two = (s.charCodeAt(i - 2) - 48) * 10 + (s.charCodeAt(i - 1) - 48);\n        if (two >= 10 && two <= 26) cur += prev2;\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}`,
              java: `public static int numDecodings(String s) {\n    int n = s.length();\n    if (s.charAt(0) == '0') return 0;\n    int prev2 = 1, prev1 = 1;\n    for (int i = 2; i <= n; i++) {\n        int cur = 0;\n        if (s.charAt(i - 1) != '0') cur += prev1;\n        int two = (s.charAt(i - 2) - '0') * 10 + (s.charAt(i - 1) - '0');\n        if (two >= 10 && two <= 26) cur += prev2;\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}`,
              cpp: `int numDecodings(string s) {\n    int n = (int) s.size();\n    if (s[0] == '0') return 0;\n    int prev2 = 1, prev1 = 1;\n    for (int i = 2; i <= n; i++) {\n        int cur = 0;\n        if (s[i - 1] != '0') cur += prev1;\n        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');\n        if (two >= 10 && two <= 26) cur += prev2;\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}`,
              c: `int numDecodings(const char* s) {\n    int n = (int) strlen(s);\n    if (s[0] == '0') return 0;\n    int prev2 = 1, prev1 = 1;\n    for (int i = 2; i <= n; i++) {\n        int cur = 0;\n        if (s[i - 1] != '0') cur += prev1;\n        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');\n        if (two >= 10 && two <= 26) cur += prev2;\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}`,
              csharp: `public static int NumDecodings(string s)\n{\n    int n = s.Length;\n    if (s[0] == '0') return 0;\n    int prev2 = 1, prev1 = 1;\n    for (int i = 2; i <= n; i++)\n    {\n        int cur = 0;\n        if (s[i - 1] != '0') cur += prev1;\n        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');\n        if (two >= 10 && two <= 26) cur += prev2;\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}`,
              go: `func numDecodings(s string) int {\n	n := len(s)\n	if s[0] == '0' {\n		return 0\n	}\n	prev2, prev1 := 1, 1\n	for i := 2; i <= n; i++ {\n		cur := 0\n		if s[i-1] != '0' {\n			cur += prev1\n		}\n		two := int(s[i-2]-'0')*10 + int(s[i-1]-'0')\n		if two >= 10 && two <= 26 {\n			cur += prev2\n		}\n		prev2 = prev1\n		prev1 = cur\n	}\n	return prev1\n}`,
              kotlin: `fun numDecodings(s: String): Int {\n    val n = s.length\n    if (s[0] == '0') return 0\n    var prev2 = 1\n    var prev1 = 1\n    for (i in 2..n) {\n        var cur = 0\n        if (s[i - 1] != '0') cur += prev1\n        val two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0')\n        if (two in 10..26) cur += prev2\n        prev2 = prev1\n        prev1 = cur\n    }\n    return prev1\n}`,
              swift: `func numDecodings(_ s: String) -> Int {\n    let c = Array(s.unicodeScalars).map { Int($0.value) - 48 }\n    let n = c.count\n    if c[0] == 0 { return 0 }\n    var prev2 = 1\n    var prev1 = 1\n    var i = 2\n    while i <= n {\n        var cur = 0\n        if c[i - 1] != 0 { cur += prev1 }\n        let two = c[i - 2] * 10 + c[i - 1]\n        if two >= 10 && two <= 26 { cur += prev2 }\n        prev2 = prev1\n        prev1 = cur\n        i += 1\n    }\n    return prev1\n}`,
              rust: `fn numDecodings(s: String) -> i32 {\n    let c: Vec<i32> = s.bytes().map(|b| (b - b'0') as i32).collect();\n    let n = c.len();\n    if c[0] == 0 {\n        return 0;\n    }\n    let mut prev2 = 1;\n    let mut prev1 = 1;\n    for i in 2..=n {\n        let mut cur = 0;\n        if c[i - 1] != 0 {\n            cur += prev1;\n        }\n        let two = c[i - 2] * 10 + c[i - 1];\n        if two >= 10 && two <= 26 {\n            cur += prev2;\n        }\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    prev1\n}`,
              php: `function numDecodings($s) {\n    $n = strlen($s);\n    if ($s[0] === '0') return 0;\n    $prev2 = 1;\n    $prev1 = 1;\n    for ($i = 2; $i <= $n; $i++) {\n        $cur = 0;\n        if ($s[$i - 1] !== '0') $cur += $prev1;\n        $two = (ord($s[$i - 2]) - 48) * 10 + (ord($s[$i - 1]) - 48);\n        if ($two >= 10 && $two <= 26) $cur += $prev2;\n        $prev2 = $prev1;\n        $prev1 = $cur;\n    }\n    return $prev1;\n}`,
              ruby: `def numDecodings(s)\n  n = s.length\n  return 0 if s[0] == '0'\n  prev2 = 1\n  prev1 = 1\n  (2..n).each do |i|\n    cur = 0\n    cur += prev1 if s[i - 1] != '0'\n    two = (s[i - 2].ord - 48) * 10 + (s[i - 1].ord - 48)\n    cur += prev2 if two >= 10 && two <= 26\n    prev2 = prev1\n    prev1 = cur\n  end\n  prev1\nend`,
      },
    };
  })(),

  // ── Unique Paths ────────────────────────────────────────────────
  (() => {
    const ref = (m: number, n: number) => {
      const dp = new Array(n).fill(1);
      for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
      }
      return dp[n - 1];
    };
    return {
      slug: "unique-paths",
      title: "Unique Paths",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics"],
      signature: { funcName: "uniquePaths", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A robot starts at the **top-left** corner of an `m x n` grid and only moves **right or down**, aiming for the bottom-right corner.\n\nReturn the number of **unique paths**.",
        [
          { in: "m = 3, n = 7", out: "28" },
          { in: "m = 3, n = 2", out: "3", note: "Right→Down→Down, Down→Down→Right, Down→Right→Down." },
        ],
        ["1 <= m, n <= 12"]),
      hints: [
        "paths(i,j) = paths(i-1,j) + paths(i,j-1); the edges have exactly one path.",
        "It's also the binomial coefficient C(m+n-2, m-1).",
      ],
      examples: [
        { input: "3\n7", expectedOutput: "28" },
        { input: "3\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 12), n = ri(rng, 1, 12);
        return { input: `${m}\n${n}`, expectedOutput: String(ref(m, n)) };
      },
      editorial: explain({
        idea: "The robot reaches a cell only from directly above or directly to its left, so the number of paths to a cell is the sum of the paths to those two neighbours. The top row and left column each have exactly one path (straight along the edge), and filling the grid row by row gives the answer.",
        steps: [
          "Every cell in the first row and first column has exactly `1` path.",
          "For every other cell, `paths[i][j] = paths[i-1][j] + paths[i][j-1]`.",
          "Fill row by row so both predecessors are ready when needed.",
          "Only the previous row matters, so a single array of width `n` suffices — `row[j] += row[j-1]` updates in place.",
        ],
        why: "Each path arrives by a unique final move, from above or from the left, so the two sets of paths are disjoint and together exhaust every possibility — the sum is exact. The rolling-array trick works because when you reach `row[j]`, it still holds the value from the row above (the `paths[i-1][j]` term) while `row[j-1]` has already been updated for the current row (the `paths[i][j-1]` term). Combinatorially the answer is `C(m+n-2, m-1)`, choosing which of the moves go down.",
        time: "O(m · n)",
        space: "O(n)",
        pitfalls: [
          "Seed the first row and column to `1`, not `0`.",
          "With the rolling array, sweep `j` left to right — the in-place update depends on that order.",
          "A single row or column has exactly one path, which the seeding handles.",
          "The closed-form binomial is exact but needs care to avoid overflow in the intermediate factorials.",
        ],
      }),
      solutions: {
        python: `def uniquePaths(m: int, n: int) -> int:\n    dp = [1] * n\n    for _ in range(1, m):\n        for j in range(1, n):\n            dp[j] += dp[j - 1]\n    return dp[n - 1]`,
        javascript: `var uniquePaths = function(m, n) {\n    const dp = new Array(n).fill(1);\n    for (let i = 1; i < m; i++) {\n        for (let j = 1; j < n; j++) dp[j] += dp[j - 1];\n    }\n    return dp[n - 1];\n};`,
              typescript: `function uniquePaths(m: number, n: number): number {\n    const row: number[] = [];\n    for (let j = 0; j < n; j++) row.push(1);\n    for (let i = 1; i < m; i++) {\n        for (let j = 1; j < n; j++) row[j] += row[j - 1];\n    }\n    return row[n - 1];\n}`,
              java: `public static int uniquePaths(int m, int n) {\n    int[] row = new int[n];\n    Arrays.fill(row, 1);\n    for (int i = 1; i < m; i++) {\n        for (int j = 1; j < n; j++) row[j] += row[j - 1];\n    }\n    return row[n - 1];\n}`,
              cpp: `int uniquePaths(int m, int n) {\n    vector<int> row(n, 1);\n    for (int i = 1; i < m; i++) {\n        for (int j = 1; j < n; j++) row[j] += row[j - 1];\n    }\n    return row[n - 1];\n}`,
              c: `int uniquePaths(int m, int n) {\n    int* row = (int*) malloc(n * sizeof(int));\n    for (int j = 0; j < n; j++) row[j] = 1;\n    for (int i = 1; i < m; i++) {\n        for (int j = 1; j < n; j++) row[j] += row[j - 1];\n    }\n    int ans = row[n - 1];\n    free(row);\n    return ans;\n}`,
              csharp: `public static int UniquePaths(int m, int n)\n{\n    int[] row = new int[n];\n    for (int j = 0; j < n; j++) row[j] = 1;\n    for (int i = 1; i < m; i++)\n    {\n        for (int j = 1; j < n; j++) row[j] += row[j - 1];\n    }\n    return row[n - 1];\n}`,
              go: `func uniquePaths(m int, n int) int {\n	row := make([]int, n)\n	for j := range row {\n		row[j] = 1\n	}\n	for i := 1; i < m; i++ {\n		for j := 1; j < n; j++ {\n			row[j] += row[j-1]\n		}\n	}\n	return row[n-1]\n}`,
              kotlin: `fun uniquePaths(m: Int, n: Int): Int {\n    val row = IntArray(n) { 1 }\n    for (i in 1 until m) {\n        for (j in 1 until n) row[j] += row[j - 1]\n    }\n    return row[n - 1]\n}`,
              swift: `func uniquePaths(_ m: Int, _ n: Int) -> Int {\n    var row = [Int](repeating: 1, count: n)\n    var i = 1\n    while i < m {\n        var j = 1\n        while j < n {\n            row[j] += row[j - 1]\n            j += 1\n        }\n        i += 1\n    }\n    return row[n - 1]\n}`,
              rust: `fn uniquePaths(m: i32, n: i32) -> i32 {\n    let cols = n as usize;\n    let mut row = vec![1i32; cols];\n    for _ in 1..m {\n        for j in 1..cols {\n            row[j] += row[j - 1];\n        }\n    }\n    row[cols - 1]\n}`,
              php: `function uniquePaths($m, $n) {\n    $row = array_fill(0, $n, 1);\n    for ($i = 1; $i < $m; $i++) {\n        for ($j = 1; $j < $n; $j++) $row[$j] += $row[$j - 1];\n    }\n    return $row[$n - 1];\n}`,
              ruby: `def uniquePaths(m, n)\n  row = Array.new(n, 1)\n  (1...m).each do\n    (1...n).each do |j|\n      row[j] += row[j - 1]\n    end\n  end\n  row[n - 1]\nend`,
      },
    };
  })(),

  // ── Partition Equal Subset Sum ──────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % 2 !== 0) return false;
      const target = total / 2;
      const dp = new Array(target + 1).fill(false);
      dp[0] = true;
      for (const x of nums) {
        for (let a = target; a >= x; a--) {
          if (dp[a - x]) dp[a] = true;
        }
      }
      return dp[target];
    };
    return {
      slug: "partition-equal-subset-sum",
      title: "Partition Equal Subset Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "canPartition", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `nums`, return `true` if it can be partitioned into **two subsets with equal sums**.",
        [
          { in: "nums = [1,5,11,5]", out: "true", note: "[1,5,5] and [11]." },
          { in: "nums = [1,2,3,5]", out: "false" },
        ],
        ["1 <= nums.length <= 20", "1 <= nums[i] <= 25"]),
      hints: [
        "If the total sum is odd, it's impossible; otherwise look for a subset summing to total/2.",
        "0/1-knapsack over reachable sums — iterate amounts downward to use each number once.",
      ],
      examples: [
        { input: "[1,5,11,5]", expectedOutput: "true" },
        { input: "[1,2,3,5]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, 25));
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      editorial: explain({
        idea: "Two subsets with equal sums each hold exactly half the total, so the question reduces to: **is some subset's sum equal to `total / 2`?** That is a 0/1 subset-sum problem, answerable with a boolean table over reachable sums. An odd total is impossible outright.",
        steps: [
          "Sum the array; if the total is odd, return `false` immediately.",
          "Set `target = total / 2` and create `reachable[0 .. target]` with only `reachable[0] = true`.",
          "For each number `x`, sweep the sums **downwards** from `target` to `x`, setting `reachable[a] |= reachable[a - x]`.",
          "Return `reachable[target]`.",
        ],
        why: "Picking a subset summing to half forces its complement to sum to half as well, so one subset determines both — the two-way partition question really is a one-way subset-sum question. The **downward** sweep is what makes it 0/1 rather than unbounded: iterating high to low means `reachable[a - x]` still reflects the state *before* `x` was considered, so each number is used at most once. Sweeping upwards would let a number be reused and answer a different problem.",
        time: "O(n · total)",
        space: "O(total)",
        pitfalls: [
          "The downward sweep is essential; going upwards allows reusing an element and yields false positives.",
          "The odd-total shortcut is not just an optimisation — halving an odd number is meaningless.",
          "`reachable[0] = true` seeds everything: the empty subset sums to zero.",
          "All values are positive here, which is what makes the sum bound and the table size well defined.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef canPartition(nums: List[int]) -> bool:\n    total = sum(nums)\n    if total % 2 != 0:\n        return False\n    target = total // 2\n    dp = [True] + [False] * target\n    for x in nums:\n        for a in range(target, x - 1, -1):\n            if dp[a - x]:\n                dp[a] = True\n    return dp[target]`,
        javascript: `var canPartition = function(nums) {\n    const total = nums.reduce(function(a, b) { return a + b; }, 0);\n    if (total % 2 !== 0) return false;\n    const target = total / 2;\n    const dp = new Array(target + 1).fill(false);\n    dp[0] = true;\n    for (const x of nums) {\n        for (let a = target; a >= x; a--) {\n            if (dp[a - x]) dp[a] = true;\n        }\n    }\n    return dp[target];\n};`,
              typescript: `function canPartition(nums: number[]): boolean {\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) total += nums[i];\n    if (total % 2 !== 0) return false;\n    const target = total / 2;\n    const reachable: boolean[] = [];\n    for (let a = 0; a <= target; a++) reachable.push(false);\n    reachable[0] = true;\n    for (let i = 0; i < nums.length; i++) {\n        const x = nums[i];\n        for (let a = target; a >= x; a--) {\n            if (reachable[a - x]) reachable[a] = true;\n        }\n    }\n    return reachable[target];\n}`,
              java: `public static boolean canPartition(int[] nums) {\n    int total = 0;\n    for (int x : nums) total += x;\n    if (total % 2 != 0) return false;\n    int target = total / 2;\n    boolean[] reachable = new boolean[target + 1];\n    reachable[0] = true;\n    for (int x : nums) {\n        for (int a = target; a >= x; a--) {\n            if (reachable[a - x]) reachable[a] = true;\n        }\n    }\n    return reachable[target];\n}`,
              cpp: `bool canPartition(vector<int>& nums) {\n    int total = 0;\n    for (int x : nums) total += x;\n    if (total % 2 != 0) return false;\n    int target = total / 2;\n    vector<bool> reachable(target + 1, false);\n    reachable[0] = true;\n    for (int x : nums) {\n        for (int a = target; a >= x; a--) {\n            if (reachable[a - x]) reachable[a] = true;\n        }\n    }\n    return reachable[target];\n}`,
              c: `bool canPartition(int* nums, int numsSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) total += nums[i];\n    if (total % 2 != 0) return false;\n    int target = total / 2;\n    int* reachable = (int*) calloc(target + 1, sizeof(int));\n    reachable[0] = 1;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        for (int a = target; a >= x; a--) {\n            if (reachable[a - x]) reachable[a] = 1;\n        }\n    }\n    bool ans = reachable[target] != 0;\n    free(reachable);\n    return ans;\n}`,
              csharp: `public static bool CanPartition(int[] nums)\n{\n    int total = 0;\n    foreach (int x in nums) total += x;\n    if (total % 2 != 0) return false;\n    int target = total / 2;\n    bool[] reachable = new bool[target + 1];\n    reachable[0] = true;\n    foreach (int x in nums)\n    {\n        for (int a = target; a >= x; a--)\n        {\n            if (reachable[a - x]) reachable[a] = true;\n        }\n    }\n    return reachable[target];\n}`,
              go: `func canPartition(nums []int) bool {\n	total := 0\n	for _, x := range nums {\n		total += x\n	}\n	if total%2 != 0 {\n		return false\n	}\n	target := total / 2\n	reachable := make([]bool, target+1)\n	reachable[0] = true\n	for _, x := range nums {\n		for a := target; a >= x; a-- {\n			if reachable[a-x] {\n				reachable[a] = true\n			}\n		}\n	}\n	return reachable[target]\n}`,
              kotlin: `fun canPartition(nums: IntArray): Boolean {\n    val total = nums.sum()\n    if (total % 2 != 0) return false\n    val target = total / 2\n    val reachable = BooleanArray(target + 1)\n    reachable[0] = true\n    for (x in nums) {\n        for (a in target downTo x) {\n            if (reachable[a - x]) reachable[a] = true\n        }\n    }\n    return reachable[target]\n}`,
              swift: `func canPartition(_ nums: [Int]) -> Bool {\n    var total = 0\n    for x in nums { total += x }\n    if total % 2 != 0 { return false }\n    let target = total / 2\n    var reachable = [Bool](repeating: false, count: target + 1)\n    reachable[0] = true\n    for x in nums {\n        var a = target\n        while a >= x {\n            if reachable[a - x] { reachable[a] = true }\n            a -= 1\n        }\n    }\n    return reachable[target]\n}`,
              rust: `fn canPartition(nums: Vec<i32>) -> bool {\n    let total: i32 = nums.iter().sum();\n    if total % 2 != 0 {\n        return false;\n    }\n    let target = (total / 2) as usize;\n    let mut reachable = vec![false; target + 1];\n    reachable[0] = true;\n    for &x in nums.iter() {\n        let xu = x as usize;\n        let mut a = target;\n        while a >= xu {\n            if reachable[a - xu] {\n                reachable[a] = true;\n            }\n            if a == 0 {\n                break;\n            }\n            a -= 1;\n        }\n    }\n    reachable[target]\n}`,
              php: `function canPartition($nums) {\n    $total = array_sum($nums);\n    if ($total % 2 !== 0) return false;\n    $target = intdiv($total, 2);\n    $reachable = array_fill(0, $target + 1, false);\n    $reachable[0] = true;\n    foreach ($nums as $x) {\n        for ($a = $target; $a >= $x; $a--) {\n            if ($reachable[$a - $x]) $reachable[$a] = true;\n        }\n    }\n    return $reachable[$target];\n}`,
              ruby: `def canPartition(nums)\n  total = nums.sum\n  return false if total.odd?\n  target = total / 2\n  reachable = Array.new(target + 1, false)\n  reachable[0] = true\n  nums.each do |x|\n    target.downto(x) do |a|\n      reachable[a] = true if reachable[a - x]\n    end\n  end\n  reachable[target]\nend`,
      },
    };
  })(),

  // ── Longest Common Subsequence ──────────────────────────────────
  (() => {
    const ref = (text1: string, text2: string) => {
      const n = text1.length, m = text2.length;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          dp[i][j] = text1[i - 1] === text2[j - 1]
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return dp[n][m];
    };
    return {
      slug: "longest-common-subsequence",
      title: "Longest Common Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming"],
      signature: { funcName: "longestCommonSubsequence", params: [{ name: "text1", type: "string" as const }, { name: "text2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two strings, return the length of their **longest common subsequence** — the longest sequence of characters appearing in both strings in the same relative order (not necessarily contiguously). Return `0` if there is none.",
        [
          { in: 'text1 = "abcde", text2 = "ace"', out: "3", note: '"ace".' },
          { in: 'text1 = "abc", text2 = "def"', out: "0" },
        ],
        ["1 <= text1.length, text2.length <= 20", "Lowercase English letters."]),
      hints: [
        "dp[i][j]: LCS of the first i chars of text1 and first j of text2.",
        "Match → 1 + diagonal; otherwise max of dropping one character from either string.",
      ],
      examples: [
        { input: '"abcde"\n"ace"', expectedOutput: "3" },
        { input: '"abc"\n"def"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const a = randLower(rng, 1, 20, "abcd");
        const b = randLower(rng, 1, 20, "abcd");
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      editorial: explain({
        idea: "Compare the two strings position by position. If the current characters **match**, they can safely be paired up and the answer grows by one on top of both shorter prefixes. If they differ, at least one of the two characters is unused, so try dropping each and keep the better result.",
        steps: [
          "Let `dp[i][j]` be the LCS length of the first `i` characters of `text1` and the first `j` of `text2`.",
          "Any prefix against an empty string gives `0` — that is the base row and column.",
          "If `text1[i-1] == text2[j-1]`, set `dp[i][j] = dp[i-1][j-1] + 1`.",
          "Otherwise set `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.",
          "Return `dp[len1][len2]`.",
        ],
        why: "When the characters match, there is always an optimal LCS that pairs them: if some optimal solution used them separately or not at all, it can be rewritten to pair them without getting shorter. When they differ they cannot both be the final matched pair, so at least one is droppable — and the two branches cover both possibilities. Prefixes give overlapping subproblems, which is why the table pays for itself: the same prefix pair would otherwise be recomputed exponentially often.",
        time: "O(len1 · len2)",
        space: "O(len1 · len2)",
        pitfalls: [
          "Index the table by prefix **length**, so `dp[i][j]` uses `text1[i-1]` and `text2[j-1]` — the off-by-one here is the usual bug.",
          "Subsequences need not be contiguous; this is not the longest common *substring*, whose recurrence resets to `0` on a mismatch.",
          "The base row and column must both be zero-filled.",
          "The answer is at the bottom-right corner, not the table's maximum.",
        ],
      }),
      solutions: {
        python: `def longestCommonSubsequence(text1: str, text2: str) -> int:\n    n, m = len(text1), len(text2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if text1[i - 1] == text2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[n][m]`,
        javascript: `var longestCommonSubsequence = function(text1, text2) {\n    const n = text1.length, m = text2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            dp[i][j] = text1[i - 1] === text2[j - 1]\n                ? dp[i - 1][j - 1] + 1\n                : Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n};`,
              typescript: `function longestCommonSubsequence(text1: string, text2: string): number {\n    const n1 = text1.length;\n    const n2 = text2.length;\n    const dp: number[][] = [];\n    for (let i = 0; i <= n1; i++) {\n        const row: number[] = [];\n        for (let j = 0; j <= n2; j++) row.push(0);\n        dp.push(row);\n    }\n    for (let i = 1; i <= n1; i++) {\n        for (let j = 1; j <= n2; j++) {\n            if (text1.charAt(i - 1) === text2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n1][n2];\n}`,
              java: `public static int longestCommonSubsequence(String text1, String text2) {\n    int n1 = text1.length(), n2 = text2.length();\n    int[][] dp = new int[n1 + 1][n2 + 1];\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (text1.charAt(i - 1) == text2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n1][n2];\n}`,
              cpp: `int longestCommonSubsequence(string text1, string text2) {\n    int n1 = (int) text1.size(), n2 = (int) text2.size();\n    vector<vector<int>> dp(n1 + 1, vector<int>(n2 + 1, 0));\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n1][n2];\n}`,
              c: `int longestCommonSubsequence(const char* text1, const char* text2) {\n    int n1 = (int) strlen(text1);\n    int n2 = (int) strlen(text2);\n    int** dp = (int**) malloc((n1 + 1) * sizeof(int*));\n    for (int i = 0; i <= n1; i++) dp[i] = (int*) calloc(n2 + 1, sizeof(int));\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];\n        }\n    }\n    int ans = dp[n1][n2];\n    for (int i = 0; i <= n1; i++) free(dp[i]);\n    free(dp);\n    return ans;\n}`,
              csharp: `public static int LongestCommonSubsequence(string text1, string text2)\n{\n    int n1 = text1.Length, n2 = text2.Length;\n    int[,] dp = new int[n1 + 1, n2 + 1];\n    for (int i = 1; i <= n1; i++)\n    {\n        for (int j = 1; j <= n2; j++)\n        {\n            if (text1[i - 1] == text2[j - 1]) dp[i, j] = dp[i - 1, j - 1] + 1;\n            else dp[i, j] = Math.Max(dp[i - 1, j], dp[i, j - 1]);\n        }\n    }\n    return dp[n1, n2];\n}`,
              go: `func longestCommonSubsequence(text1 string, text2 string) int {\n	n1 := len(text1)\n	n2 := len(text2)\n	dp := make([][]int, n1+1)\n	for i := range dp {\n		dp[i] = make([]int, n2+1)\n	}\n	for i := 1; i <= n1; i++ {\n		for j := 1; j <= n2; j++ {\n			if text1[i-1] == text2[j-1] {\n				dp[i][j] = dp[i-1][j-1] + 1\n			} else if dp[i-1][j] > dp[i][j-1] {\n				dp[i][j] = dp[i-1][j]\n			} else {\n				dp[i][j] = dp[i][j-1]\n			}\n		}\n	}\n	return dp[n1][n2]\n}`,
              kotlin: `fun longestCommonSubsequence(text1: String, text2: String): Int {\n    val n1 = text1.length\n    val n2 = text2.length\n    val dp = Array(n1 + 1) { IntArray(n2 + 1) }\n    for (i in 1..n1) {\n        for (j in 1..n2) {\n            dp[i][j] = if (text1[i - 1] == text2[j - 1]) dp[i - 1][j - 1] + 1\n            else maxOf(dp[i - 1][j], dp[i][j - 1])\n        }\n    }\n    return dp[n1][n2]\n}`,
              swift: `func longestCommonSubsequence(_ text1: String, _ text2: String) -> Int {\n    let a = Array(text1)\n    let b = Array(text2)\n    let n1 = a.count\n    let n2 = b.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n2 + 1), count: n1 + 1)\n    if n1 == 0 || n2 == 0 { return 0 }\n    for i in 1...n1 {\n        for j in 1...n2 {\n            if a[i - 1] == b[j - 1] { dp[i][j] = dp[i - 1][j - 1] + 1 }\n            else { dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) }\n        }\n    }\n    return dp[n1][n2]\n}`,
              rust: `fn longestCommonSubsequence(text1: String, text2: String) -> i32 {\n    let a: Vec<u8> = text1.bytes().collect();\n    let b: Vec<u8> = text2.bytes().collect();\n    let n1 = a.len();\n    let n2 = b.len();\n    let mut dp = vec![vec![0i32; n2 + 1]; n1 + 1];\n    for i in 1..=n1 {\n        for j in 1..=n2 {\n            if a[i - 1] == b[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n            } else {\n                dp[i][j] = if dp[i - 1][j] > dp[i][j - 1] { dp[i - 1][j] } else { dp[i][j - 1] };\n            }\n        }\n    }\n    dp[n1][n2]\n}`,
              php: `function longestCommonSubsequence($text1, $text2) {\n    $n1 = strlen($text1);\n    $n2 = strlen($text2);\n    $dp = array();\n    for ($i = 0; $i <= $n1; $i++) $dp[] = array_fill(0, $n2 + 1, 0);\n    for ($i = 1; $i <= $n1; $i++) {\n        for ($j = 1; $j <= $n2; $j++) {\n            if ($text1[$i - 1] === $text2[$j - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;\n            else $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $dp[$n1][$n2];\n}`,
              ruby: `def longestCommonSubsequence(text1, text2)\n  n1 = text1.length\n  n2 = text2.length\n  dp = Array.new(n1 + 1) { Array.new(n2 + 1, 0) }\n  (1..n1).each do |i|\n    (1..n2).each do |j|\n      if text1[i - 1] == text2[j - 1]\n        dp[i][j] = dp[i - 1][j - 1] + 1\n      else\n        dp[i][j] = [dp[i - 1][j], dp[i][j - 1]].max\n      end\n    end\n  end\n  dp[n1][n2]\nend`,
      },
    };
  })(),

  // ── Edit Distance ───────────────────────────────────────────────
  (() => {
    const ref = (word1: string, word2: string) => {
      const n = word1.length, m = word2.length;
      const dp: number[][] = Array.from({ length: n + 1 }, (_, i) => {
        const row = new Array(m + 1).fill(0);
        row[0] = i;
        return row;
      });
      for (let j = 0; j <= m; j++) dp[0][j] = j;
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          dp[i][j] = word1[i - 1] === word2[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return dp[n][m];
    };
    return {
      slug: "edit-distance",
      title: "Edit Distance",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming"],
      signature: { funcName: "minDistance", params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two strings `word1` and `word2`, return the **minimum number of operations** to convert `word1` into `word2`, where one operation inserts, deletes, or replaces a single character.",
        [
          { in: 'word1 = "horse", word2 = "ros"', out: "3", note: "horse → rorse → rose → ros." },
          { in: 'word1 = "intention", word2 = "execution"', out: "5" },
        ],
        ["0 <= word1.length, word2.length <= 15", "Lowercase English letters."]),
      hints: [
        "dp[i][j]: edits to turn the first i chars of word1 into the first j of word2.",
        "Equal last chars cost nothing; otherwise 1 + min(replace, delete, insert).",
      ],
      examples: [
        { input: '"horse"\n"ros"', expectedOutput: "3" },
        { input: '"intention"\n"execution"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const a = randLower(rng, 0, 15, "abcd");
        const b = randLower(rng, 0, 15, "abcd");
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      editorial: explain({
        idea: "Levenshtein distance. Let `dp[i][j]` be the cheapest way to turn the first `i` characters of `word1` into the first `j` of `word2`. If the current characters agree, nothing needs doing and the cost carries over diagonally. If they differ, the last operation was an insert, a delete, or a replace — take the cheapest of those three and add one.",
        steps: [
          "Base cases: turning a prefix into the empty string costs one delete per character, so `dp[i][0] = i`; symmetrically `dp[0][j] = j`.",
          "If `word1[i-1] == word2[j-1]`, set `dp[i][j] = dp[i-1][j-1]`.",
          "Otherwise `dp[i][j] = 1 + min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j])`.",
          "Those three terms are replace, insert and delete respectively.",
          "Return `dp[len1][len2]`.",
        ],
        why: "Every edit sequence can be reordered so operations apply left to right, which means the final operation on the last characters is one of exactly three kinds — and each leaves a smaller prefix pair to solve. The cases are exhaustive and each subproblem is independent of how it was reached, giving optimal substructure. When the characters already match, spending an operation can never help, so the diagonal carry is safe.",
        time: "O(len1 · len2)",
        space: "O(len1 · len2)",
        pitfalls: [
          "The base row and column are `i` and `j`, not zeros — an empty target still costs one delete per character.",
          "Keep the three directions straight: diagonal is replace, left is insert, up is delete.",
          "On a match take the diagonal **without** adding one; adding one is the classic off-by-one here.",
          "Either word may be empty, and the base cases must cover that.",
        ],
      }),
      solutions: {
        python: `def minDistance(word1: str, word2: str) -> int:\n    n, m = len(word1), len(word2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(n + 1):\n        dp[i][0] = i\n    for j in range(m + 1):\n        dp[0][j] = j\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if word1[i - 1] == word2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])\n    return dp[n][m]`,
        javascript: `var minDistance = function(word1, word2) {\n    const n = word1.length, m = word2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) {\n        dp.push(new Array(m + 1).fill(0));\n        dp[i][0] = i;\n    }\n    for (let j = 0; j <= m; j++) dp[0][j] = j;\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            dp[i][j] = word1[i - 1] === word2[j - 1]\n                ? dp[i - 1][j - 1]\n                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n};`,
              typescript: `function minDistance(word1: string, word2: string): number {\n    const n1 = word1.length;\n    const n2 = word2.length;\n    const dp: number[][] = [];\n    for (let i = 0; i <= n1; i++) {\n        const row: number[] = [];\n        for (let j = 0; j <= n2; j++) row.push(0);\n        dp.push(row);\n    }\n    for (let i = 0; i <= n1; i++) dp[i][0] = i;\n    for (let j = 0; j <= n2; j++) dp[0][j] = j;\n    for (let i = 1; i <= n1; i++) {\n        for (let j = 1; j <= n2; j++) {\n            if (word1.charAt(i - 1) === word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i][j - 1], dp[i - 1][j]));\n        }\n    }\n    return dp[n1][n2];\n}`,
              java: `public static int minDistance(String word1, String word2) {\n    int n1 = word1.length(), n2 = word2.length();\n    int[][] dp = new int[n1 + 1][n2 + 1];\n    for (int i = 0; i <= n1; i++) dp[i][0] = i;\n    for (int j = 0; j <= n2; j++) dp[0][j] = j;\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i][j - 1], dp[i - 1][j]));\n        }\n    }\n    return dp[n1][n2];\n}`,
              cpp: `int minDistance(string word1, string word2) {\n    int n1 = (int) word1.size(), n2 = (int) word2.size();\n    vector<vector<int>> dp(n1 + 1, vector<int>(n2 + 1, 0));\n    for (int i = 0; i <= n1; i++) dp[i][0] = i;\n    for (int j = 0; j <= n2; j++) dp[0][j] = j;\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];\n            else dp[i][j] = 1 + min(dp[i - 1][j - 1], min(dp[i][j - 1], dp[i - 1][j]));\n        }\n    }\n    return dp[n1][n2];\n}`,
              c: `int minDistance(const char* word1, const char* word2) {\n    int n1 = (int) strlen(word1);\n    int n2 = (int) strlen(word2);\n    int** dp = (int**) malloc((n1 + 1) * sizeof(int*));\n    for (int i = 0; i <= n1; i++) dp[i] = (int*) calloc(n2 + 1, sizeof(int));\n    for (int i = 0; i <= n1; i++) dp[i][0] = i;\n    for (int j = 0; j <= n2; j++) dp[0][j] = j;\n    for (int i = 1; i <= n1; i++) {\n        for (int j = 1; j <= n2; j++) {\n            if (word1[i - 1] == word2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1];\n            } else {\n                int a = dp[i - 1][j - 1];\n                int b = dp[i][j - 1];\n                int c = dp[i - 1][j];\n                int m = a < b ? a : b;\n                if (c < m) m = c;\n                dp[i][j] = 1 + m;\n            }\n        }\n    }\n    int ans = dp[n1][n2];\n    for (int i = 0; i <= n1; i++) free(dp[i]);\n    free(dp);\n    return ans;\n}`,
              csharp: `public static int MinDistance(string word1, string word2)\n{\n    int n1 = word1.Length, n2 = word2.Length;\n    int[,] dp = new int[n1 + 1, n2 + 1];\n    for (int i = 0; i <= n1; i++) dp[i, 0] = i;\n    for (int j = 0; j <= n2; j++) dp[0, j] = j;\n    for (int i = 1; i <= n1; i++)\n    {\n        for (int j = 1; j <= n2; j++)\n        {\n            if (word1[i - 1] == word2[j - 1]) dp[i, j] = dp[i - 1, j - 1];\n            else dp[i, j] = 1 + Math.Min(dp[i - 1, j - 1], Math.Min(dp[i, j - 1], dp[i - 1, j]));\n        }\n    }\n    return dp[n1, n2];\n}`,
              go: `func minDistance(word1 string, word2 string) int {\n	n1 := len(word1)\n	n2 := len(word2)\n	dp := make([][]int, n1+1)\n	for i := range dp {\n		dp[i] = make([]int, n2+1)\n		dp[i][0] = i\n	}\n	for j := 0; j <= n2; j++ {\n		dp[0][j] = j\n	}\n	for i := 1; i <= n1; i++ {\n		for j := 1; j <= n2; j++ {\n			if word1[i-1] == word2[j-1] {\n				dp[i][j] = dp[i-1][j-1]\n			} else {\n				m := dp[i-1][j-1]\n				if dp[i][j-1] < m {\n					m = dp[i][j-1]\n				}\n				if dp[i-1][j] < m {\n					m = dp[i-1][j]\n				}\n				dp[i][j] = 1 + m\n			}\n		}\n	}\n	return dp[n1][n2]\n}`,
              kotlin: `fun minDistance(word1: String, word2: String): Int {\n    val n1 = word1.length\n    val n2 = word2.length\n    val dp = Array(n1 + 1) { IntArray(n2 + 1) }\n    for (i in 0..n1) dp[i][0] = i\n    for (j in 0..n2) dp[0][j] = j\n    for (i in 1..n1) {\n        for (j in 1..n2) {\n            dp[i][j] = if (word1[i - 1] == word2[j - 1]) dp[i - 1][j - 1]\n            else 1 + minOf(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j])\n        }\n    }\n    return dp[n1][n2]\n}`,
              swift: `func minDistance(_ word1: String, _ word2: String) -> Int {\n    let a = Array(word1)\n    let b = Array(word2)\n    let n1 = a.count\n    let n2 = b.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n2 + 1), count: n1 + 1)\n    for i in 0...n1 { dp[i][0] = i }\n    for j in 0...n2 { dp[0][j] = j }\n    if n1 == 0 || n2 == 0 { return dp[n1][n2] }\n    for i in 1...n1 {\n        for j in 1...n2 {\n            if a[i - 1] == b[j - 1] { dp[i][j] = dp[i - 1][j - 1] }\n            else { dp[i][j] = 1 + min(dp[i - 1][j - 1], min(dp[i][j - 1], dp[i - 1][j])) }\n        }\n    }\n    return dp[n1][n2]\n}`,
              rust: `fn minDistance(word1: String, word2: String) -> i32 {\n    let a: Vec<u8> = word1.bytes().collect();\n    let b: Vec<u8> = word2.bytes().collect();\n    let n1 = a.len();\n    let n2 = b.len();\n    let mut dp = vec![vec![0i32; n2 + 1]; n1 + 1];\n    for i in 0..=n1 {\n        dp[i][0] = i as i32;\n    }\n    for j in 0..=n2 {\n        dp[0][j] = j as i32;\n    }\n    for i in 1..=n1 {\n        for j in 1..=n2 {\n            if a[i - 1] == b[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1];\n            } else {\n                let mut m = dp[i - 1][j - 1];\n                if dp[i][j - 1] < m {\n                    m = dp[i][j - 1];\n                }\n                if dp[i - 1][j] < m {\n                    m = dp[i - 1][j];\n                }\n                dp[i][j] = 1 + m;\n            }\n        }\n    }\n    dp[n1][n2]\n}`,
              php: `function minDistance($word1, $word2) {\n    $n1 = strlen($word1);\n    $n2 = strlen($word2);\n    $dp = array();\n    for ($i = 0; $i <= $n1; $i++) $dp[] = array_fill(0, $n2 + 1, 0);\n    for ($i = 0; $i <= $n1; $i++) $dp[$i][0] = $i;\n    for ($j = 0; $j <= $n2; $j++) $dp[0][$j] = $j;\n    for ($i = 1; $i <= $n1; $i++) {\n        for ($j = 1; $j <= $n2; $j++) {\n            if ($word1[$i - 1] === $word2[$j - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1];\n            else $dp[$i][$j] = 1 + min($dp[$i - 1][$j - 1], $dp[$i][$j - 1], $dp[$i - 1][$j]);\n        }\n    }\n    return $dp[$n1][$n2];\n}`,
              ruby: `def minDistance(word1, word2)\n  n1 = word1.length\n  n2 = word2.length\n  dp = Array.new(n1 + 1) { Array.new(n2 + 1, 0) }\n  (0..n1).each { |i| dp[i][0] = i }\n  (0..n2).each { |j| dp[0][j] = j }\n  (1..n1).each do |i|\n    (1..n2).each do |j|\n      if word1[i - 1] == word2[j - 1]\n        dp[i][j] = dp[i - 1][j - 1]\n      else\n        dp[i][j] = 1 + [dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]].min\n      end\n    end\n  end\n  dp[n1][n2]\nend`,
      },
    };
  })(),

  // ── Target Sum ──────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      let counts = new Map<number, number>([[0, 1]]);
      for (const x of nums) {
        const next = new Map<number, number>();
        for (const [sum, c] of counts) {
          next.set(sum + x, (next.get(sum + x) || 0) + c);
          next.set(sum - x, (next.get(sum - x) || 0) + c);
        }
        counts = next;
      }
      return counts.get(target) || 0;
    };
    return {
      slug: "target-sum",
      title: "Target Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Backtracking"],
      signature: { funcName: "findTargetSumWays", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `target`. Build an expression by placing a `+` or `-` **before every number** and concatenating them.\n\nReturn the number of expressions that evaluate to `target`.",
        [
          { in: "nums = [1,1,1,1,1], target = 3", out: "5", note: "Five ways to place signs summing to 3." },
          { in: "nums = [1], target = 1", out: "1" },
        ],
        ["1 <= nums.length <= 15", "0 <= nums[i] <= 9", "-20 <= target <= 20"]),
      hints: [
        "Track a map from reachable sum → number of ways, one number at a time.",
        "The classic reduction: subset with sum (total+target)/2 — a 0/1 knapsack count.",
      ],
      examples: [
        { input: "[1,1,1,1,1]\n3", expectedOutput: "5" },
        { input: "[1]\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 15) }, () => ri(rng, 0, 9));
        const target = ri(rng, -20, 20);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      editorial: explain({
        idea: "Every number gets a sign, so after processing a prefix the only thing that matters is the **running total** — not which signs produced it. Carry a table mapping each reachable total to the number of ways to reach it, and extend it one number at a time, branching into `+x` and `-x`.",
        steps: [
          "Bound the totals: with all values at most 9 and at most 15 of them, any reachable sum lies within ±135. Index a counting array by `sum + offset`.",
          "Seed the table with one way to reach a total of `0` before any number is placed.",
          "For each number `x`, build a fresh table: every total `s` with `w` ways contributes `w` ways to `s + x` and `w` ways to `s - x`.",
          "After all numbers, read off the count at the target.",
        ],
        why: "Two different sign assignments that reach the same running total are interchangeable for everything that follows, so collapsing them into a single count loses nothing — that is what turns an exponential `2^n` enumeration into a linear sweep over a bounded table. Building a fresh table each round is what keeps each number used exactly once. Note that a `0` in the input legitimately doubles the count, since `+0` and `-0` are distinct assignments, and the counting handles that automatically.",
        time: "O(n · sumRange)",
        space: "O(sumRange)",
        pitfalls: [
          "Totals go negative, so offset the index — a raw sum cannot index an array.",
          "Build the next table from the previous one rather than updating in place, or a number can be applied twice in one round.",
          "Zeros double the answer; a set-based \"reachable sums\" approach silently loses that and undercounts.",
          "A target outside the reachable range answers `0`, not an error.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict\n\ndef findTargetSumWays(nums: List[int], target: int) -> int:\n    counts = {0: 1}\n    for x in nums:\n        nxt = defaultdict(int)\n        for s, c in counts.items():\n            nxt[s + x] += c\n            nxt[s - x] += c\n        counts = nxt\n    return counts.get(target, 0)`,
        javascript: `var findTargetSumWays = function(nums, target) {\n    let counts = new Map([[0, 1]]);\n    for (const x of nums) {\n        const next = new Map();\n        for (const entry of counts) {\n            const sum = entry[0], c = entry[1];\n            next.set(sum + x, (next.get(sum + x) || 0) + c);\n            next.set(sum - x, (next.get(sum - x) || 0) + c);\n        }\n        counts = next;\n    }\n    return counts.get(target) || 0;\n};`,
              typescript: `function findTargetSumWays(nums: number[], target: number): number {\n    const OFFSET = 135;\n    const SIZE = 271;\n    let ways: number[] = [];\n    for (let i = 0; i < SIZE; i++) ways.push(0);\n    ways[OFFSET] = 1;\n    for (let k = 0; k < nums.length; k++) {\n        const x = nums[k];\n        const next: number[] = [];\n        for (let i = 0; i < SIZE; i++) next.push(0);\n        for (let s = 0; s < SIZE; s++) {\n            if (ways[s] === 0) continue;\n            if (s + x < SIZE) next[s + x] += ways[s];\n            if (s - x >= 0) next[s - x] += ways[s];\n        }\n        ways = next;\n    }\n    const idx = target + OFFSET;\n    if (idx < 0 || idx >= SIZE) return 0;\n    return ways[idx];\n}`,
              java: `public static int findTargetSumWays(int[] nums, int target) {\n    final int OFFSET = 135, SIZE = 271;\n    int[] ways = new int[SIZE];\n    ways[OFFSET] = 1;\n    for (int x : nums) {\n        int[] next = new int[SIZE];\n        for (int s = 0; s < SIZE; s++) {\n            if (ways[s] == 0) continue;\n            if (s + x < SIZE) next[s + x] += ways[s];\n            if (s - x >= 0) next[s - x] += ways[s];\n        }\n        ways = next;\n    }\n    int idx = target + OFFSET;\n    if (idx < 0 || idx >= SIZE) return 0;\n    return ways[idx];\n}`,
              cpp: `int findTargetSumWays(vector<int>& nums, int target) {\n    const int OFFSET = 135, SIZE = 271;\n    vector<int> ways(SIZE, 0);\n    ways[OFFSET] = 1;\n    for (int x : nums) {\n        vector<int> next(SIZE, 0);\n        for (int s = 0; s < SIZE; s++) {\n            if (ways[s] == 0) continue;\n            if (s + x < SIZE) next[s + x] += ways[s];\n            if (s - x >= 0) next[s - x] += ways[s];\n        }\n        ways = next;\n    }\n    int idx = target + OFFSET;\n    if (idx < 0 || idx >= SIZE) return 0;\n    return ways[idx];\n}`,
              c: `int findTargetSumWays(int* nums, int numsSize, int target) {\n    const int OFFSET = 135;\n    const int SIZE = 271;\n    int* ways = (int*) calloc(SIZE, sizeof(int));\n    int* next = (int*) calloc(SIZE, sizeof(int));\n    ways[OFFSET] = 1;\n    for (int k = 0; k < numsSize; k++) {\n        int x = nums[k];\n        for (int i = 0; i < SIZE; i++) next[i] = 0;\n        for (int s = 0; s < SIZE; s++) {\n            if (ways[s] == 0) continue;\n            if (s + x < SIZE) next[s + x] += ways[s];\n            if (s - x >= 0) next[s - x] += ways[s];\n        }\n        for (int i = 0; i < SIZE; i++) ways[i] = next[i];\n    }\n    int idx = target + OFFSET;\n    int ans = (idx < 0 || idx >= SIZE) ? 0 : ways[idx];\n    free(ways);\n    free(next);\n    return ans;\n}`,
              csharp: `public static int FindTargetSumWays(int[] nums, int target)\n{\n    const int OFFSET = 135;\n    const int SIZE = 271;\n    int[] ways = new int[SIZE];\n    ways[OFFSET] = 1;\n    foreach (int x in nums)\n    {\n        int[] next = new int[SIZE];\n        for (int s = 0; s < SIZE; s++)\n        {\n            if (ways[s] == 0) continue;\n            if (s + x < SIZE) next[s + x] += ways[s];\n            if (s - x >= 0) next[s - x] += ways[s];\n        }\n        ways = next;\n    }\n    int idx = target + OFFSET;\n    if (idx < 0 || idx >= SIZE) return 0;\n    return ways[idx];\n}`,
              go: `func findTargetSumWays(nums []int, target int) int {\n	const OFFSET = 135\n	const SIZE = 271\n	ways := make([]int, SIZE)\n	ways[OFFSET] = 1\n	for _, x := range nums {\n		next := make([]int, SIZE)\n		for s := 0; s < SIZE; s++ {\n			if ways[s] == 0 {\n				continue\n			}\n			if s+x < SIZE {\n				next[s+x] += ways[s]\n			}\n			if s-x >= 0 {\n				next[s-x] += ways[s]\n			}\n		}\n		ways = next\n	}\n	idx := target + OFFSET\n	if idx < 0 || idx >= SIZE {\n		return 0\n	}\n	return ways[idx]\n}`,
              kotlin: `fun findTargetSumWays(nums: IntArray, target: Int): Int {\n    val offset = 135\n    val size = 271\n    var ways = IntArray(size)\n    ways[offset] = 1\n    for (x in nums) {\n        val next = IntArray(size)\n        for (s in 0 until size) {\n            if (ways[s] == 0) continue\n            if (s + x < size) next[s + x] += ways[s]\n            if (s - x >= 0) next[s - x] += ways[s]\n        }\n        ways = next\n    }\n    val idx = target + offset\n    return if (idx < 0 || idx >= size) 0 else ways[idx]\n}`,
              swift: `func findTargetSumWays(_ nums: [Int], _ target: Int) -> Int {\n    let offset = 135\n    let size = 271\n    var ways = [Int](repeating: 0, count: size)\n    ways[offset] = 1\n    for x in nums {\n        var next = [Int](repeating: 0, count: size)\n        for s in 0..<size {\n            if ways[s] == 0 { continue }\n            if s + x < size { next[s + x] += ways[s] }\n            if s - x >= 0 { next[s - x] += ways[s] }\n        }\n        ways = next\n    }\n    let idx = target + offset\n    if idx < 0 || idx >= size { return 0 }\n    return ways[idx]\n}`,
              rust: `fn findTargetSumWays(nums: Vec<i32>, target: i32) -> i32 {\n    let offset: i32 = 135;\n    let size: i32 = 271;\n    let mut ways = vec![0i32; size as usize];\n    ways[offset as usize] = 1;\n    for &x in nums.iter() {\n        let mut next = vec![0i32; size as usize];\n        for s in 0..size {\n            if ways[s as usize] == 0 {\n                continue;\n            }\n            if s + x < size {\n                next[(s + x) as usize] += ways[s as usize];\n            }\n            if s - x >= 0 {\n                next[(s - x) as usize] += ways[s as usize];\n            }\n        }\n        ways = next;\n    }\n    let idx = target + offset;\n    if idx < 0 || idx >= size { 0 } else { ways[idx as usize] }\n}`,
              php: `function findTargetSumWays($nums, $target) {\n    $OFFSET = 135;\n    $SIZE = 271;\n    $ways = array_fill(0, $SIZE, 0);\n    $ways[$OFFSET] = 1;\n    foreach ($nums as $x) {\n        $next = array_fill(0, $SIZE, 0);\n        for ($s = 0; $s < $SIZE; $s++) {\n            if ($ways[$s] === 0) continue;\n            if ($s + $x < $SIZE) $next[$s + $x] += $ways[$s];\n            if ($s - $x >= 0) $next[$s - $x] += $ways[$s];\n        }\n        $ways = $next;\n    }\n    $idx = $target + $OFFSET;\n    if ($idx < 0 || $idx >= $SIZE) return 0;\n    return $ways[$idx];\n}`,
              ruby: `def findTargetSumWays(nums, target)\n  offset = 135\n  size = 271\n  ways = Array.new(size, 0)\n  ways[offset] = 1\n  nums.each do |x|\n    nxt = Array.new(size, 0)\n    (0...size).each do |s|\n      next if ways[s] == 0\n      nxt[s + x] += ways[s] if s + x < size\n      nxt[s - x] += ways[s] if s - x >= 0\n    end\n    ways = nxt\n  end\n  idx = target + offset\n  return 0 if idx < 0 || idx >= size\n  ways[idx]\nend`,
      },
    };
  })(),

];
