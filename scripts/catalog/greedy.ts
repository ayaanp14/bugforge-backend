/** Greedy — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const GREEDY_PROBLEMS: CatalogProblem[] = [

  // ── Jump Game ───────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let reach = 0;
      for (let i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + nums[i]);
      }
      return true;
    };
    return {
      slug: "jump-game",
      title: "Jump Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Dynamic Programming"],
      signature: { funcName: "canJump", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `nums`. You start at the **first index**; each element is your **maximum jump length** from that position.\n\nReturn `true` if you can reach the last index.",
        [
          { in: "nums = [2,3,1,1,4]", out: "true", note: "Jump 1 step to index 1, then 3 steps to the end." },
          { in: "nums = [3,2,1,0,4]", out: "false", note: "You always land on index 3, whose jump length is 0." },
        ],
        ["1 <= nums.length <= 30", "0 <= nums[i] <= 5"]),
      hints: [
        "Track the furthest index reachable so far.",
        "If the current index is beyond that reach, you're stuck.",
      ],
      examples: [
        { input: "[2,3,1,1,4]", expectedOutput: "true" },
        { input: "[3,2,1,0,4]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => (rng() < 0.25 ? 0 : ri(rng, 1, 5)));
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef canJump(nums: List[int]) -> bool:\n    reach = 0\n    for i, x in enumerate(nums):\n        if i > reach:\n            return False\n        reach = max(reach, i + x)\n    return True`,
        javascript: `var canJump = function(nums) {\n    let reach = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (i > reach) return false;\n        reach = Math.max(reach, i + nums[i]);\n    }\n    return true;\n};`,
      },
    };
  })(),

  // ── Jump Game II ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let jumps = 0, end = 0, far = 0;
      for (let i = 0; i < nums.length - 1; i++) {
        far = Math.max(far, i + nums[i]);
        if (i === end) {
          jumps++;
          end = far;
        }
      }
      return jumps;
    };
    return {
      slug: "jump-game-ii",
      title: "Jump Game II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Dynamic Programming"],
      signature: { funcName: "jump", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You start at index 0 of array `nums`, where `nums[i]` is the maximum jump length from `i`. Return the **minimum number of jumps** to reach the last index. The tests guarantee you can always reach it.",
        [
          { in: "nums = [2,3,1,1,4]", out: "2", note: "Index 0 → 1 → 4." },
          { in: "nums = [2,3,0,1,4]", out: "2" },
        ],
        ["1 <= nums.length <= 30", "1 <= nums[i] <= 5", "Reaching the last index is always possible."]),
      hints: [
        "Think in BFS levels: everything reachable in j jumps forms a window.",
        "When you walk past the current window's end, you must take another jump.",
      ],
      examples: [
        { input: "[2,3,1,1,4]", expectedOutput: "2" },
        { input: "[2,3,0,1,4]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 5));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef jump(nums: List[int]) -> int:\n    jumps = 0\n    end = 0\n    far = 0\n    for i in range(len(nums) - 1):\n        far = max(far, i + nums[i])\n        if i == end:\n            jumps += 1\n            end = far\n    return jumps`,
        javascript: `var jump = function(nums) {\n    let jumps = 0, end = 0, far = 0;\n    for (let i = 0; i < nums.length - 1; i++) {\n        far = Math.max(far, i + nums[i]);\n        if (i === end) {\n            jumps++;\n            end = far;\n        }\n    }\n    return jumps;\n};`,
      },
    };
  })(),

  // ── Gas Station ─────────────────────────────────────────────────
  (() => {
    const ref = (gas: number[], cost: number[]) => {
      let total = 0, tank = 0, start = 0;
      for (let i = 0; i < gas.length; i++) {
        const d = gas[i] - cost[i];
        total += d;
        tank += d;
        if (tank < 0) {
          start = i + 1;
          tank = 0;
        }
      }
      return total < 0 ? -1 : start;
    };
    return {
      slug: "gas-station",
      title: "Gas Station",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy"],
      signature: { funcName: "canCompleteCircuit", params: [{ name: "gas", type: "int[]" as const }, { name: "cost", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` gas stations around a circular route; station `i` has `gas[i]` fuel, and driving to station `i+1` costs `cost[i]`. You start with an empty tank at some station.\n\nReturn the **starting station's index** from which you can travel around the circuit once clockwise — or `-1` if impossible. If a solution exists, it is **unique**.",
        [
          { in: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", out: "3" },
          { in: "gas = [2,3,4], cost = [3,4,3]", out: "-1" },
        ],
        ["1 <= gas.length == cost.length <= 30", "0 <= gas[i], cost[i] <= 20"]),
      hints: [
        "If total gas < total cost, the answer is -1; otherwise a unique start exists.",
        "If your tank goes negative arriving at i+1, no station ≤ i can be the start — restart from i+1.",
      ],
      examples: [
        { input: "[1,2,3,4,5]\n[3,4,5,1,2]", expectedOutput: "3" },
        { input: "[2,3,4]\n[3,4,3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const gas = Array.from({ length: n }, () => ri(rng, 0, 20));
        const cost = Array.from({ length: n }, () => ri(rng, 0, 20));
        return { input: `${fmtIntArr(gas)}\n${fmtIntArr(cost)}`, expectedOutput: String(ref(gas, cost)) };
      },
      solutions: {
        python: `from typing import List\n\ndef canCompleteCircuit(gas: List[int], cost: List[int]) -> int:\n    total = 0\n    tank = 0\n    start = 0\n    for i in range(len(gas)):\n        d = gas[i] - cost[i]\n        total += d\n        tank += d\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return -1 if total < 0 else start`,
        javascript: `var canCompleteCircuit = function(gas, cost) {\n    let total = 0, tank = 0, start = 0;\n    for (let i = 0; i < gas.length; i++) {\n        const d = gas[i] - cost[i];\n        total += d;\n        tank += d;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n};`,
      },
    };
  })(),

  // ── Hand of Straights ───────────────────────────────────────────
  (() => {
    const ref = (hand: number[], groupSize: number) => {
      if (hand.length % groupSize !== 0) return false;
      const count = new Map<number, number>();
      for (const c of hand) count.set(c, (count.get(c) || 0) + 1);
      const keys = [...count.keys()].sort((a, b) => a - b);
      for (const k of keys) {
        const need = count.get(k) || 0;
        if (need === 0) continue;
        for (let v = k; v < k + groupSize; v++) {
          const have = count.get(v) || 0;
          if (have < need) return false;
          count.set(v, have - need);
        }
      }
      return true;
    };
    return {
      slug: "hand-of-straights",
      title: "Hand of Straights",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Hash Table", "Sorting"],
      signature: { funcName: "isNStraightHand", params: [{ name: "hand", type: "int[]" as const }, { name: "groupSize", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Alice has cards with values `hand` and wants to rearrange them into groups of exactly `groupSize` **consecutive** cards. Return `true` if she can.",
        [
          { in: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3", out: "true", note: "[1,2,3], [2,3,4], [6,7,8]." },
          { in: "hand = [1,2,3,4,5], groupSize = 4", out: "false" },
        ],
        ["1 <= hand.length <= 24", "1 <= hand[i] <= 20", "1 <= groupSize <= 6"]),
      hints: [
        "If groupSize doesn't divide the hand size, it's impossible.",
        "Always start a group at the smallest remaining card — it has no other home.",
      ],
      examples: [
        { input: "[1,2,3,6,2,3,4,7,8]\n3", expectedOutput: "true" },
        { input: "[1,2,3,4,5]\n4", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const groupSize = ri(rng, 1, 6);
        let hand: number[];
        if (rng() < 0.5) {
          const groups = ri(rng, 1, 4);
          hand = [];
          for (let g = 0; g < groups; g++) {
            const start = ri(rng, 1, 14);
            for (let v = start; v < start + groupSize; v++) hand.push(v);
          }
          hand = shuffle(rng, hand);
          if (rng() < 0.3 && hand.length > 1) hand[0] = ri(rng, 1, 20);
        } else {
          hand = Array.from({ length: ri(rng, 1, 24) }, () => ri(rng, 1, 20));
        }
        return { input: `${fmtIntArr(hand)}\n${groupSize}`, expectedOutput: bool(ref(hand, groupSize)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef isNStraightHand(hand: List[int], groupSize: int) -> bool:\n    if len(hand) % groupSize != 0:\n        return False\n    count = Counter(hand)\n    for k in sorted(count):\n        need = count[k]\n        if need == 0:\n            continue\n        for v in range(k, k + groupSize):\n            if count[v] < need:\n                return False\n            count[v] -= need\n    return True`,
        javascript: `var isNStraightHand = function(hand, groupSize) {\n    if (hand.length % groupSize !== 0) return false;\n    const count = new Map();\n    for (const c of hand) count.set(c, (count.get(c) || 0) + 1);\n    const keys = Array.from(count.keys()).sort(function(a, b) { return a - b; });\n    for (const k of keys) {\n        const need = count.get(k) || 0;\n        if (need === 0) continue;\n        for (let v = k; v < k + groupSize; v++) {\n            const have = count.get(v) || 0;\n            if (have < need) return false;\n            count.set(v, have - need);\n        }\n    }\n    return true;\n};`,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock II ──────────────────────────
  (() => {
    const ref = (prices: number[]) => {
      let profit = 0;
      for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
      }
      return profit;
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-ii",
      title: "Best Time to Buy and Sell Stock II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Dynamic Programming"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given `prices` where `prices[i]` is a stock's price on day `i`. You may buy and sell on the same day, holding **at most one share** at a time, with unlimited transactions.\n\nReturn the **maximum total profit**.",
        [
          { in: "prices = [7,1,5,3,6,4]", out: "7", note: "Buy day 2, sell day 3 (+4); buy day 4, sell day 5 (+3)." },
          { in: "prices = [1,2,3,4,5]", out: "4" },
          { in: "prices = [7,6,4,3,1]", out: "0" },
        ],
        ["1 <= prices.length <= 30", "0 <= prices[i] <= 1000"]),
      hints: [
        "Every upward price movement can be captured independently.",
        "Sum all positive day-to-day differences.",
      ],
      examples: [
        { input: "[7,1,5,3,6,4]", expectedOutput: "7" },
        { input: "[1,2,3,4,5]", expectedOutput: "4" },
        { input: "[7,6,4,3,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, 1000));
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxProfit(prices: List[int]) -> int:\n    profit = 0\n    for i in range(1, len(prices)):\n        if prices[i] > prices[i - 1]:\n            profit += prices[i] - prices[i - 1]\n    return profit`,
        javascript: `var maxProfit = function(prices) {\n    let profit = 0;\n    for (let i = 1; i < prices.length; i++) {\n        if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n    }\n    return profit;\n};`,
      },
    };
  })(),

  // ── Boats to Save People ────────────────────────────────────────
  (() => {
    const ref = (people: number[], limit: number) => {
      const sorted = [...people].sort((a, b) => a - b);
      let i = 0, j = sorted.length - 1, boats = 0;
      while (i <= j) {
        if (sorted[i] + sorted[j] <= limit) i++;
        j--;
        boats++;
      }
      return boats;
    };
    return {
      slug: "boats-to-save-people",
      title: "Boats to Save People",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Two Pointers", "Sorting"],
      signature: { funcName: "numRescueBoats", params: [{ name: "people", type: "int[]" as const }, { name: "limit", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given weights `people` and a boat weight `limit`. Each boat carries **at most two people** whose combined weight is at most `limit`. Every person weighs at most `limit`.\n\nReturn the **minimum number of boats** needed to carry everyone.",
        [
          { in: "people = [1,2], limit = 3", out: "1" },
          { in: "people = [3,2,2,1], limit = 3", out: "3", note: "(1,2), (2), (3)." },
          { in: "people = [3,5,3,4], limit = 5", out: "4" },
        ],
        ["1 <= people.length <= 30", "1 <= people[i] <= limit <= 100"]),
      hints: [
        "Sort, then pair the heaviest remaining with the lightest if they fit.",
        "The heaviest person leaves on every boat — the only question is whether someone joins.",
      ],
      examples: [
        { input: "[1,2]\n3", expectedOutput: "1" },
        { input: "[3,2,2,1]\n3", expectedOutput: "3" },
        { input: "[3,5,3,4]\n5", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const limit = ri(rng, 1, 100);
        const people = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, limit));
        return { input: `${fmtIntArr(people)}\n${limit}`, expectedOutput: String(ref(people, limit)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numRescueBoats(people: List[int], limit: int) -> int:\n    people = sorted(people)\n    i, j = 0, len(people) - 1\n    boats = 0\n    while i <= j:\n        if people[i] + people[j] <= limit:\n            i += 1\n        j -= 1\n        boats += 1\n    return boats`,
        javascript: `var numRescueBoats = function(people, limit) {\n    const sorted = people.slice().sort(function(a, b) { return a - b; });\n    let i = 0, j = sorted.length - 1, boats = 0;\n    while (i <= j) {\n        if (sorted[i] + sorted[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n};`,
      },
    };
  })(),

  // ── Candy ───────────────────────────────────────────────────────
  (() => {
    const ref = (ratings: number[]) => {
      const n = ratings.length;
      const candies = new Array(n).fill(1);
      for (let i = 1; i < n; i++) {
        if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
      }
      for (let i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
      }
      return candies.reduce((a, b) => a + b, 0);
    };
    return {
      slug: "candy",
      title: "Candy",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy"],
      signature: { funcName: "candy", params: [{ name: "ratings", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`n` children stand in a line with `ratings`. You distribute candies such that:\n\n- Every child gets **at least one** candy.\n- A child with a higher rating than an adjacent child gets **more candies** than that neighbor.\n\nReturn the **minimum total** number of candies.",
        [
          { in: "ratings = [1,0,2]", out: "5", note: "Give 2, 1, 2 candies." },
          { in: "ratings = [1,2,2]", out: "4", note: "Give 1, 2, 1 — equal ratings need no relation." },
        ],
        ["1 <= ratings.length <= 30", "0 <= ratings[i] <= 100"]),
      hints: [
        "Two passes: left-to-right fixes rising edges, right-to-left fixes falling edges.",
        "Take the max of both constraints at each position.",
      ],
      examples: [
        { input: "[1,0,2]", expectedOutput: "5" },
        { input: "[1,2,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const ratings = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, 100));
        return { input: fmtIntArr(ratings), expectedOutput: String(ref(ratings)) };
      },
      solutions: {
        python: `from typing import List\n\ndef candy(ratings: List[int]) -> int:\n    n = len(ratings)\n    candies = [1] * n\n    for i in range(1, n):\n        if ratings[i] > ratings[i - 1]:\n            candies[i] = candies[i - 1] + 1\n    for i in range(n - 2, -1, -1):\n        if ratings[i] > ratings[i + 1]:\n            candies[i] = max(candies[i], candies[i + 1] + 1)\n    return sum(candies)`,
        javascript: `var candy = function(ratings) {\n    const n = ratings.length;\n    const candies = new Array(n).fill(1);\n    for (let i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;\n    }\n    for (let i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);\n    }\n    return candies.reduce(function(a, b) { return a + b; }, 0);\n};`,
      },
    };
  })(),

  // ── Partition Labels ────────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const last = new Map<string, number>();
      for (let i = 0; i < s.length; i++) last.set(s[i], i);
      const out: number[] = [];
      let start = 0, end = 0;
      for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last.get(s[i])!);
        if (i === end) {
          out.push(end - start + 1);
          start = i + 1;
        }
      }
      return out;
    };
    return {
      slug: "partition-labels",
      title: "Partition Labels",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Hash Table", "Two Pointers"],
      signature: { funcName: "partitionLabels", params: [{ name: "s", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "Partition the string `s` into as **many parts as possible** so that no letter appears in more than one part (concatenating the parts in order must reproduce `s`).\n\nReturn a list of the **sizes** of these parts.",
        [
          { in: 's = "ababcbacadefegdehijhklij"', out: "[9,7,8]", note: 'Parts: "ababcbaca", "defegde", "hijhklij".' },
          { in: 's = "eccbbbbdec"', out: "[10]" },
        ],
        ["1 <= s.length <= 40", "Lowercase English letters."]),
      hints: [
        "Record the last index of every letter.",
        "Extend the current part's end to the last occurrence of each letter you meet; cut when i reaches it.",
      ],
      examples: [
        { input: '"ababcbacadefegdehijhklij"', expectedOutput: "[9,7,8]" },
        { input: '"eccbbbbdec"', expectedOutput: "[10]" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abcdef");
        return { input: `"${s}"`, expectedOutput: fmtIntArr(ref(s)) };
      },
      solutions: {
        python: `from typing import List\n\ndef partitionLabels(s: str) -> List[int]:\n    last = {ch: i for i, ch in enumerate(s)}\n    out = []\n    start = 0\n    end = 0\n    for i, ch in enumerate(s):\n        end = max(end, last[ch])\n        if i == end:\n            out.append(end - start + 1)\n            start = i + 1\n    return out`,
        javascript: `var partitionLabels = function(s) {\n    const last = new Map();\n    for (let i = 0; i < s.length; i++) last.set(s[i], i);\n    const out = [];\n    let start = 0, end = 0;\n    for (let i = 0; i < s.length; i++) {\n        end = Math.max(end, last.get(s[i]));\n        if (i === end) {\n            out.push(end - start + 1);\n            start = i + 1;\n        }\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Task Scheduler ──────────────────────────────────────────────
  (() => {
    const ref = (tasks: string[], n: number) => {
      const count = new Map<string, number>();
      for (const t of tasks) count.set(t, (count.get(t) || 0) + 1);
      const freqs = [...count.values()];
      const maxFreq = Math.max(...freqs);
      const maxCount = freqs.filter((f) => f === maxFreq).length;
      return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount);
    };
    return {
      slug: "task-scheduler",
      title: "Task Scheduler",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Heap", "Counting"],
      signature: { funcName: "leastInterval", params: [{ name: "tasks", type: "string[]" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A CPU runs one task per interval (or idles). Identical tasks must be at least `n` intervals apart. Given `tasks` (letters `A`–`Z`) and the cooldown `n`, return the **minimum number of intervals** to finish all tasks.",
        [
          { in: 'tasks = ["A","A","A","B","B","B"], n = 2', out: "8", note: "A → B → idle → A → B → idle → A → B." },
          { in: 'tasks = ["A","A","A","B","B","B"], n = 0', out: "6" },
        ],
        ["1 <= tasks.length <= 30", "0 <= n <= 10", "tasks[i] is an uppercase letter."]),
      hints: [
        "Lay out the most frequent task first: (maxFreq-1) blocks of size n+1, plus the final row.",
        "The answer is max(tasks.length, (maxFreq-1)*(n+1) + count of tasks with maxFreq).",
      ],
      examples: [
        { input: '["A","A","A","B","B","B"]\n2', expectedOutput: "8" },
        { input: '["A","A","A","B","B","B"]\n0', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const kinds = ri(rng, 1, 5);
        const letters = "ABCDE".slice(0, kinds);
        const tasks = Array.from({ length: ri(rng, 1, 30) }, () => letters[ri(rng, 0, kinds - 1)]);
        const n = ri(rng, 0, 10);
        return { input: `${fmtStrArr(tasks)}\n${n}`, expectedOutput: String(ref(tasks, n)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef leastInterval(tasks: List[str], n: int) -> int:\n    count = Counter(tasks)\n    max_freq = max(count.values())\n    max_count = sum(1 for f in count.values() if f == max_freq)\n    return max(len(tasks), (max_freq - 1) * (n + 1) + max_count)`,
        javascript: `var leastInterval = function(tasks, n) {\n    const count = new Map();\n    for (const t of tasks) count.set(t, (count.get(t) || 0) + 1);\n    const freqs = Array.from(count.values());\n    const maxFreq = Math.max.apply(null, freqs);\n    const maxCount = freqs.filter(function(f) { return f === maxFreq; }).length;\n    return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount);\n};`,
      },
    };
  })(),

  // ── Lemonade Change ─────────────────────────────────────────────
  (() => {
    const ref = (bills: number[]) => {
      let fives = 0, tens = 0;
      for (const b of bills) {
        if (b === 5) fives++;
        else if (b === 10) {
          if (fives === 0) return false;
          fives--;
          tens++;
        } else {
          if (tens > 0 && fives > 0) { tens--; fives--; }
          else if (fives >= 3) fives -= 3;
          else return false;
        }
      }
      return true;
    };
    return {
      slug: "lemonade-change",
      title: "Lemonade Change",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy"],
      signature: { funcName: "lemonadeChange", params: [{ name: "bills", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Customers buy lemonade at **$5** each, paying with a `$5`, `$10`, or `$20` bill, one customer at a time in the order of `bills`. You start with no change.\n\nReturn `true` if you can give every customer correct change.",
        [
          { in: "bills = [5,5,5,10,20]", out: "true" },
          { in: "bills = [5,5,10,10,20]", out: "false" },
        ],
        ["1 <= bills.length <= 30", "bills[i] is 5, 10, or 20."]),
      hints: [
        "Track how many $5 and $10 bills you hold.",
        "For a $20, prefer giving $10+$5 over three $5s — fives are more versatile.",
      ],
      examples: [
        { input: "[5,5,5,10,20]", expectedOutput: "true" },
        { input: "[5,5,10,10,20]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const opts = [5, 5, 5, 10, 10, 20];
        const bills = Array.from({ length: ri(rng, 1, 30) }, () => opts[ri(rng, 0, opts.length - 1)]);
        return { input: fmtIntArr(bills), expectedOutput: bool(ref(bills)) };
      },
      solutions: {
        python: `from typing import List\n\ndef lemonadeChange(bills: List[int]) -> bool:\n    fives = 0\n    tens = 0\n    for b in bills:\n        if b == 5:\n            fives += 1\n        elif b == 10:\n            if fives == 0:\n                return False\n            fives -= 1\n            tens += 1\n        else:\n            if tens > 0 and fives > 0:\n                tens -= 1\n                fives -= 1\n            elif fives >= 3:\n                fives -= 3\n            else:\n                return False\n    return True`,
        javascript: `var lemonadeChange = function(bills) {\n    let fives = 0, tens = 0;\n    for (const b of bills) {\n        if (b === 5) {\n            fives++;\n        } else if (b === 10) {\n            if (fives === 0) return false;\n            fives--;\n            tens++;\n        } else {\n            if (tens > 0 && fives > 0) { tens--; fives--; }\n            else if (fives >= 3) fives -= 3;\n            else return false;\n        }\n    }\n    return true;\n};`,
      },
    };
  })(),

];
