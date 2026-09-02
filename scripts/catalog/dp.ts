/** Dynamic Programming — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      solutions: {
        python: `def climbStairs(n: int) -> int:\n    a, b = 1, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b`,
        javascript: `var climbStairs = function(n) {\n    let a = 1, b = 1;\n    for (let i = 2; i <= n; i++) {\n        const c = a + b;\n        a = b;\n        b = c;\n    }\n    return b;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef minCostClimbingStairs(cost: List[int]) -> int:\n    a, b = 0, 0\n    for i in range(2, len(cost) + 1):\n        a, b = b, min(b + cost[i - 1], a + cost[i - 2])\n    return b`,
        javascript: `var minCostClimbingStairs = function(cost) {\n    let a = 0, b = 0;\n    for (let i = 2; i <= cost.length; i++) {\n        const c = Math.min(b + cost[i - 1], a + cost[i - 2]);\n        a = b;\n        b = c;\n    }\n    return b;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef rob(nums: List[int]) -> int:\n    take, skip = 0, 0\n    for x in nums:\n        take, skip = skip + x, max(skip, take)\n    return max(take, skip)`,
        javascript: `var rob = function(nums) {\n    let take = 0, skip = 0;\n    for (const x of nums) {\n        const newTake = skip + x;\n        skip = Math.max(skip, take);\n        take = newTake;\n    }\n    return Math.max(take, skip);\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef rob(nums: List[int]) -> int:\n    def rob_line(row):\n        take, skip = 0, 0\n        for x in row:\n            take, skip = skip + x, max(skip, take)\n        return max(take, skip)\n\n    if len(nums) == 1:\n        return nums[0]\n    return max(rob_line(nums[1:]), rob_line(nums[:-1]))`,
        javascript: `var rob = function(nums) {\n    function robLine(row) {\n        let take = 0, skip = 0;\n        for (const x of row) {\n            const newTake = skip + x;\n            skip = Math.max(skip, take);\n            take = newTake;\n        }\n        return Math.max(take, skip);\n    }\n    if (nums.length === 1) return nums[0];\n    return Math.max(robLine(nums.slice(1)), robLine(nums.slice(0, -1)));\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef maxSubArray(nums: List[int]) -> int:\n    best = cur = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best`,
        javascript: `var maxSubArray = function(nums) {\n    let best = nums[0], cur = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        cur = Math.max(nums[i], cur + nums[i]);\n        best = Math.max(best, cur);\n    }\n    return best;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef coinChange(coins: List[int], amount: int) -> int:\n    INF = float("inf")\n    dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]:\n                dp[a] = dp[a - c] + 1\n    return -1 if dp[amount] == INF else dp[amount]`,
        javascript: `var coinChange = function(coins, amount) {\n    const dp = new Array(amount + 1).fill(Infinity);\n    dp[0] = 0;\n    for (let a = 1; a <= amount; a++) {\n        for (const c of coins) {\n            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n        }\n    }\n    return dp[amount] === Infinity ? -1 : dp[amount];\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef change(amount: int, coins: List[int]) -> int:\n    dp = [1] + [0] * amount\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] += dp[a - c]\n    return dp[amount]`,
        javascript: `var change = function(amount, coins) {\n    const dp = new Array(amount + 1).fill(0);\n    dp[0] = 1;\n    for (const c of coins) {\n        for (let a = c; a <= amount; a++) dp[a] += dp[a - c];\n    }\n    return dp[amount];\n};`,
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
      solutions: {
        python: `from typing import List\nimport bisect\n\ndef lengthOfLIS(nums: List[int]) -> int:\n    tails = []\n    for x in nums:\n        i = bisect.bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x\n    return len(tails)`,
        javascript: `var lengthOfLIS = function(nums) {\n    const tails = [];\n    for (const x of nums) {\n        let lo = 0, hi = tails.length;\n        while (lo < hi) {\n            const mid = (lo + hi) >> 1;\n            if (tails[mid] < x) lo = mid + 1;\n            else hi = mid;\n        }\n        tails[lo] = x;\n    }\n    return tails.length;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef wordBreak(s: str, wordDict: List[str]) -> bool:\n    words = set(wordDict)\n    dp = [True] + [False] * len(s)\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in words:\n                dp[i] = True\n                break\n    return dp[len(s)]`,
        javascript: `var wordBreak = function(s, wordDict) {\n    const words = new Set(wordDict);\n    const dp = new Array(s.length + 1).fill(false);\n    dp[0] = true;\n    for (let i = 1; i <= s.length; i++) {\n        for (let j = 0; j < i; j++) {\n            if (dp[j] && words.has(s.slice(j, i))) {\n                dp[i] = true;\n                break;\n            }\n        }\n    }\n    return dp[s.length];\n};`,
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
      solutions: {
        python: `def numDecodings(s: str) -> int:\n    if not s or s[0] == "0":\n        return 0\n    prev, cur = 1, 1\n    for i in range(1, len(s)):\n        nxt = 0\n        if s[i] != "0":\n            nxt += cur\n        two = int(s[i - 1:i + 1])\n        if 10 <= two <= 26:\n            nxt += prev\n        prev, cur = cur, nxt\n        if cur == 0:\n            return 0\n    return cur`,
        javascript: `var numDecodings = function(s) {\n    if (s.length === 0 || s[0] === "0") return 0;\n    let prev = 1, cur = 1;\n    for (let i = 1; i < s.length; i++) {\n        let next = 0;\n        if (s[i] !== "0") next += cur;\n        const two = parseInt(s.slice(i - 1, i + 1), 10);\n        if (two >= 10 && two <= 26) next += prev;\n        prev = cur;\n        cur = next;\n        if (cur === 0) return 0;\n    }\n    return cur;\n};`,
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
      solutions: {
        python: `def uniquePaths(m: int, n: int) -> int:\n    dp = [1] * n\n    for _ in range(1, m):\n        for j in range(1, n):\n            dp[j] += dp[j - 1]\n    return dp[n - 1]`,
        javascript: `var uniquePaths = function(m, n) {\n    const dp = new Array(n).fill(1);\n    for (let i = 1; i < m; i++) {\n        for (let j = 1; j < n; j++) dp[j] += dp[j - 1];\n    }\n    return dp[n - 1];\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef canPartition(nums: List[int]) -> bool:\n    total = sum(nums)\n    if total % 2 != 0:\n        return False\n    target = total // 2\n    dp = [True] + [False] * target\n    for x in nums:\n        for a in range(target, x - 1, -1):\n            if dp[a - x]:\n                dp[a] = True\n    return dp[target]`,
        javascript: `var canPartition = function(nums) {\n    const total = nums.reduce(function(a, b) { return a + b; }, 0);\n    if (total % 2 !== 0) return false;\n    const target = total / 2;\n    const dp = new Array(target + 1).fill(false);\n    dp[0] = true;\n    for (const x of nums) {\n        for (let a = target; a >= x; a--) {\n            if (dp[a - x]) dp[a] = true;\n        }\n    }\n    return dp[target];\n};`,
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
      solutions: {
        python: `def longestCommonSubsequence(text1: str, text2: str) -> int:\n    n, m = len(text1), len(text2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if text1[i - 1] == text2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[n][m]`,
        javascript: `var longestCommonSubsequence = function(text1, text2) {\n    const n = text1.length, m = text2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            dp[i][j] = text1[i - 1] === text2[j - 1]\n                ? dp[i - 1][j - 1] + 1\n                : Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n};`,
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
      solutions: {
        python: `def minDistance(word1: str, word2: str) -> int:\n    n, m = len(word1), len(word2)\n    dp = [[0] * (m + 1) for _ in range(n + 1)]\n    for i in range(n + 1):\n        dp[i][0] = i\n    for j in range(m + 1):\n        dp[0][j] = j\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if word1[i - 1] == word2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])\n    return dp[n][m]`,
        javascript: `var minDistance = function(word1, word2) {\n    const n = word1.length, m = word2.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) {\n        dp.push(new Array(m + 1).fill(0));\n        dp[i][0] = i;\n    }\n    for (let j = 0; j <= m; j++) dp[0][j] = j;\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            dp[i][j] = word1[i - 1] === word2[j - 1]\n                ? dp[i - 1][j - 1]\n                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return dp[n][m];\n};`,
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
      solutions: {
        python: `from typing import List\nfrom collections import defaultdict\n\ndef findTargetSumWays(nums: List[int], target: int) -> int:\n    counts = {0: 1}\n    for x in nums:\n        nxt = defaultdict(int)\n        for s, c in counts.items():\n            nxt[s + x] += c\n            nxt[s - x] += c\n        counts = nxt\n    return counts.get(target, 0)`,
        javascript: `var findTargetSumWays = function(nums, target) {\n    let counts = new Map([[0, 1]]);\n    for (const x of nums) {\n        const next = new Map();\n        for (const entry of counts) {\n            const sum = entry[0], c = entry[1];\n            next.set(sum + x, (next.get(sum + x) || 0) + c);\n            next.set(sum - x, (next.get(sum - x) || 0) + c);\n        }\n        counts = next;\n    }\n    return counts.get(target) || 0;\n};`,
      },
    };
  })(),

];
