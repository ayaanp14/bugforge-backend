/** Greedy — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "You never need to know *which* jumps to take — only how far it is possible to get. Sweep left to right carrying a single number, `reach`, the furthest index any sequence of jumps could land on so far. If the sweep ever reaches an index beyond `reach`, that index is unreachable and the answer is no.",
        steps: [
          "Start with `reach = 0`.",
          "Walk `i` from `0` to the last index.",
          "If `i > reach`, no jump sequence can get here — return `false`.",
          "Otherwise update `reach = max(reach, i + nums[i])`.",
          "Surviving the whole walk means the last index was reachable — return `true`.",
        ],
        why: "The set of reachable indices is a **prefix**: if you can reach index `i`, you can reach every index below it, because a jump of length `nums[i]` allows any shorter hop too. So the reachable set is fully described by its maximum, `reach`, and a single number is enough state. Since `i <= reach` means `i` is genuinely reachable, extending with `i + nums[i]` is legitimate, and the first `i` exceeding `reach` is a real wall — everything beyond it is cut off as well.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A `0` in the array is only fatal if it sits exactly at the current `reach` — zeros you can jump over are harmless.",
          "Check `i > reach` **before** using `nums[i]`, or you extend the reach from a position you never actually got to.",
          "A single-element array is trivially `true`: you are already at the last index.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef canJump(nums: List[int]) -> bool:\n    reach = 0\n    for i, x in enumerate(nums):\n        if i > reach:\n            return False\n        reach = max(reach, i + x)\n    return True`,
        javascript: `var canJump = function(nums) {\n    let reach = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (i > reach) return false;\n        reach = Math.max(reach, i + nums[i]);\n    }\n    return true;\n};`,
              typescript: `function canJump(nums: number[]): boolean {\n    let reach = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (i > reach) return false;\n        if (i + nums[i] > reach) reach = i + nums[i];\n    }\n    return true;\n}`,
              java: `public static boolean canJump(int[] nums) {\n    int reach = 0;\n    for (int i = 0; i < nums.length; i++) {\n        if (i > reach) return false;\n        if (i + nums[i] > reach) reach = i + nums[i];\n    }\n    return true;\n}`,
              cpp: `bool canJump(vector<int>& nums) {\n    int reach = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (i > reach) return false;\n        if (i + nums[i] > reach) reach = i + nums[i];\n    }\n    return true;\n}`,
              c: `bool canJump(int* nums, int numsSize) {\n    int reach = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (i > reach) return false;\n        if (i + nums[i] > reach) reach = i + nums[i];\n    }\n    return true;\n}`,
              csharp: `public static bool CanJump(int[] nums)\n{\n    int reach = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (i > reach) return false;\n        if (i + nums[i] > reach) reach = i + nums[i];\n    }\n    return true;\n}`,
              go: `func canJump(nums []int) bool {\n	reach := 0\n	for i := 0; i < len(nums); i++ {\n		if i > reach {\n			return false\n		}\n		if i+nums[i] > reach {\n			reach = i + nums[i]\n		}\n	}\n	return true\n}`,
              kotlin: `fun canJump(nums: IntArray): Boolean {\n    var reach = 0\n    for (i in nums.indices) {\n        if (i > reach) return false\n        if (i + nums[i] > reach) reach = i + nums[i]\n    }\n    return true\n}`,
              swift: `func canJump(_ nums: [Int]) -> Bool {\n    var reach = 0\n    for i in 0..<nums.count {\n        if i > reach { return false }\n        if i + nums[i] > reach { reach = i + nums[i] }\n    }\n    return true\n}`,
              rust: `fn canJump(nums: Vec<i32>) -> bool {\n    let mut reach: i32 = 0;\n    for i in 0..nums.len() {\n        if i as i32 > reach {\n            return false;\n        }\n        if i as i32 + nums[i] > reach {\n            reach = i as i32 + nums[i];\n        }\n    }\n    true\n}`,
              php: `function canJump($nums) {\n    $reach = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        if ($i > $reach) return false;\n        if ($i + $nums[$i] > $reach) $reach = $i + $nums[$i];\n    }\n    return true;\n}`,
              ruby: `def canJump(nums)\n  reach = 0\n  nums.each_with_index do |v, i|\n    return false if i > reach\n    reach = i + v if i + v > reach\n  end\n  true\nend`,
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
      editorial: explain({
        idea: "Think of it as breadth-first search on a line. Everything you can reach in exactly one jump forms a contiguous window; everything reachable in two jumps forms the next window, and so on. You never need a queue — just track where the current window ends and how far the next one will stretch.",
        steps: [
          "Track `jumps`, `curEnd` (the last index of the current window) and `farthest` (the furthest index reachable from anything seen so far).",
          "Walk `i` from `0` up to but **not including** the last index.",
          "Update `farthest = max(farthest, i + nums[i])`.",
          "When `i == curEnd`, you have exhausted the current window: take a jump, and let the next window end at `farthest`.",
          "`jumps` is the minimum count when the walk finishes.",
        ],
        why: "This is BFS with the levels collapsed into indices. Reachability from a window is monotone — the union of what its members reach is itself a contiguous range ending at `farthest` — so a level is fully described by its endpoint. Since BFS visits nodes in non-decreasing distance, the level at which the last index first falls inside the window is its shortest jump count.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Stop the loop **before** the last index. Including it counts one jump too many when the last index happens to close a window.",
          "Bump `jumps` when `i` reaches `curEnd`, not when `i` reaches `farthest`.",
          "A single-element array needs `0` jumps, which falls out because the loop never runs.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef jump(nums: List[int]) -> int:\n    jumps = 0\n    end = 0\n    far = 0\n    for i in range(len(nums) - 1):\n        far = max(far, i + nums[i])\n        if i == end:\n            jumps += 1\n            end = far\n    return jumps`,
        javascript: `var jump = function(nums) {\n    let jumps = 0, end = 0, far = 0;\n    for (let i = 0; i < nums.length - 1; i++) {\n        far = Math.max(far, i + nums[i]);\n        if (i === end) {\n            jumps++;\n            end = far;\n        }\n    }\n    return jumps;\n};`,
              typescript: `function jump(nums: number[]): number {\n    let jumps = 0;\n    let curEnd = 0;\n    let farthest = 0;\n    for (let i = 0; i + 1 < nums.length; i++) {\n        if (i + nums[i] > farthest) farthest = i + nums[i];\n        if (i === curEnd) {\n            jumps++;\n            curEnd = farthest;\n        }\n    }\n    return jumps;\n}`,
              java: `public static int jump(int[] nums) {\n    int jumps = 0, curEnd = 0, farthest = 0;\n    for (int i = 0; i + 1 < nums.length; i++) {\n        if (i + nums[i] > farthest) farthest = i + nums[i];\n        if (i == curEnd) {\n            jumps++;\n            curEnd = farthest;\n        }\n    }\n    return jumps;\n}`,
              cpp: `int jump(vector<int>& nums) {\n    int jumps = 0, curEnd = 0, farthest = 0;\n    for (int i = 0; i + 1 < (int) nums.size(); i++) {\n        if (i + nums[i] > farthest) farthest = i + nums[i];\n        if (i == curEnd) {\n            jumps++;\n            curEnd = farthest;\n        }\n    }\n    return jumps;\n}`,
              c: `int jump(int* nums, int numsSize) {\n    int jumps = 0, curEnd = 0, farthest = 0;\n    for (int i = 0; i + 1 < numsSize; i++) {\n        if (i + nums[i] > farthest) farthest = i + nums[i];\n        if (i == curEnd) {\n            jumps++;\n            curEnd = farthest;\n        }\n    }\n    return jumps;\n}`,
              csharp: `public static int Jump(int[] nums)\n{\n    int jumps = 0, curEnd = 0, farthest = 0;\n    for (int i = 0; i + 1 < nums.Length; i++)\n    {\n        if (i + nums[i] > farthest) farthest = i + nums[i];\n        if (i == curEnd)\n        {\n            jumps++;\n            curEnd = farthest;\n        }\n    }\n    return jumps;\n}`,
              go: `func jump(nums []int) int {\n	jumps, curEnd, farthest := 0, 0, 0\n	for i := 0; i+1 < len(nums); i++ {\n		if i+nums[i] > farthest {\n			farthest = i + nums[i]\n		}\n		if i == curEnd {\n			jumps++\n			curEnd = farthest\n		}\n	}\n	return jumps\n}`,
              kotlin: `fun jump(nums: IntArray): Int {\n    var jumps = 0\n    var curEnd = 0\n    var farthest = 0\n    for (i in 0 until nums.size - 1) {\n        if (i + nums[i] > farthest) farthest = i + nums[i]\n        if (i == curEnd) {\n            jumps++\n            curEnd = farthest\n        }\n    }\n    return jumps\n}`,
              swift: `func jump(_ nums: [Int]) -> Int {\n    var jumps = 0\n    var curEnd = 0\n    var farthest = 0\n    var i = 0\n    while i + 1 < nums.count {\n        if i + nums[i] > farthest { farthest = i + nums[i] }\n        if i == curEnd {\n            jumps += 1\n            curEnd = farthest\n        }\n        i += 1\n    }\n    return jumps\n}`,
              rust: `fn jump(nums: Vec<i32>) -> i32 {\n    let mut jumps = 0;\n    let mut cur_end: i32 = 0;\n    let mut farthest: i32 = 0;\n    let n = nums.len();\n    let mut i: i32 = 0;\n    while (i as usize) + 1 < n {\n        if i + nums[i as usize] > farthest {\n            farthest = i + nums[i as usize];\n        }\n        if i == cur_end {\n            jumps += 1;\n            cur_end = farthest;\n        }\n        i += 1;\n    }\n    jumps\n}`,
              php: `function jump($nums) {\n    $jumps = 0;\n    $curEnd = 0;\n    $farthest = 0;\n    $n = count($nums);\n    for ($i = 0; $i + 1 < $n; $i++) {\n        if ($i + $nums[$i] > $farthest) $farthest = $i + $nums[$i];\n        if ($i === $curEnd) {\n            $jumps++;\n            $curEnd = $farthest;\n        }\n    }\n    return $jumps;\n}`,
              ruby: `def jump(nums)\n  jumps = 0\n  cur_end = 0\n  farthest = 0\n  i = 0\n  while i + 1 < nums.length\n    farthest = i + nums[i] if i + nums[i] > farthest\n    if i == cur_end\n      jumps += 1\n      cur_end = farthest\n    end\n    i += 1\n  end\n  jumps\nend`,
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
      editorial: explain({
        idea: "Two independent facts settle this in one pass. First, a full loop is possible **iff** total gas is at least total cost — otherwise you run dry somewhere no matter where you begin. Second, if the tank goes negative on the way from `start` to `i + 1`, then **no** station in `start..i` can be the answer, so the search can skip straight past all of them.",
        steps: [
          "Track `total` (overall gas minus cost) and `tank` (fuel since the current candidate start).",
          "For each station `i`, add `gas[i] - cost[i]` to both.",
          "If `tank` drops below zero, discard the current candidate: set `start = i + 1` and reset `tank = 0`.",
          "After the sweep, return `-1` if `total < 0`, otherwise `start`.",
        ],
        why: "The skip is the interesting half. Suppose starting at `start` fails on the way to `i + 1`. Any station `j` strictly between `start` and `i` begins with an empty tank, whereas a run from `start` arrives at `j` with a non-negative tank — otherwise it would have failed earlier. So starting at `j` is no better and fails too. That lets one linear scan rule out whole blocks at once. And when `total >= 0`, the last surviving candidate must work, because every prefix discarded before it had negative sum, forcing the remainder to be non-negative throughout.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "You need **both** accumulators: `tank` finds the candidate, `total` decides whether an answer exists at all.",
          "Reset the tank to `0`, not to the negative value, when moving the candidate start.",
          "Do not wrap around and simulate the circle — one linear pass is enough, and simulating is `O(n^2)`.",
          "The problem guarantees uniqueness, so there is no tie to break.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef canCompleteCircuit(gas: List[int], cost: List[int]) -> int:\n    total = 0\n    tank = 0\n    start = 0\n    for i in range(len(gas)):\n        d = gas[i] - cost[i]\n        total += d\n        tank += d\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return -1 if total < 0 else start`,
        javascript: `var canCompleteCircuit = function(gas, cost) {\n    let total = 0, tank = 0, start = 0;\n    for (let i = 0; i < gas.length; i++) {\n        const d = gas[i] - cost[i];\n        total += d;\n        tank += d;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n};`,
              typescript: `function canCompleteCircuit(gas: number[], cost: number[]): number {\n    let total = 0;\n    let tank = 0;\n    let start = 0;\n    for (let i = 0; i < gas.length; i++) {\n        const diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n}`,
              java: `public static int canCompleteCircuit(int[] gas, int[] cost) {\n    int total = 0, tank = 0, start = 0;\n    for (int i = 0; i < gas.length; i++) {\n        int diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n}`,
              cpp: `int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n    int total = 0, tank = 0, start = 0;\n    for (int i = 0; i < (int) gas.size(); i++) {\n        int diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n}`,
              c: `int canCompleteCircuit(int* gas, int gasSize, int* cost, int costSize) {\n    int total = 0, tank = 0, start = 0;\n    for (int i = 0; i < gasSize; i++) {\n        int diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if (tank < 0) {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n}`,
              csharp: `public static int CanCompleteCircuit(int[] gas, int[] cost)\n{\n    int total = 0, tank = 0, start = 0;\n    for (int i = 0; i < gas.Length; i++)\n    {\n        int diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if (tank < 0)\n        {\n            start = i + 1;\n            tank = 0;\n        }\n    }\n    return total < 0 ? -1 : start;\n}`,
              go: `func canCompleteCircuit(gas []int, cost []int) int {\n	total, tank, start := 0, 0, 0\n	for i := 0; i < len(gas); i++ {\n		diff := gas[i] - cost[i]\n		total += diff\n		tank += diff\n		if tank < 0 {\n			start = i + 1\n			tank = 0\n		}\n	}\n	if total < 0 {\n		return -1\n	}\n	return start\n}`,
              kotlin: `fun canCompleteCircuit(gas: IntArray, cost: IntArray): Int {\n    var total = 0\n    var tank = 0\n    var start = 0\n    for (i in gas.indices) {\n        val diff = gas[i] - cost[i]\n        total += diff\n        tank += diff\n        if (tank < 0) {\n            start = i + 1\n            tank = 0\n        }\n    }\n    return if (total < 0) -1 else start\n}`,
              swift: `func canCompleteCircuit(_ gas: [Int], _ cost: [Int]) -> Int {\n    var total = 0\n    var tank = 0\n    var start = 0\n    for i in 0..<gas.count {\n        let diff = gas[i] - cost[i]\n        total += diff\n        tank += diff\n        if tank < 0 {\n            start = i + 1\n            tank = 0\n        }\n    }\n    return total < 0 ? -1 : start\n}`,
              rust: `fn canCompleteCircuit(gas: Vec<i32>, cost: Vec<i32>) -> i32 {\n    let mut total = 0;\n    let mut tank = 0;\n    let mut start = 0;\n    for i in 0..gas.len() {\n        let diff = gas[i] - cost[i];\n        total += diff;\n        tank += diff;\n        if tank < 0 {\n            start = (i + 1) as i32;\n            tank = 0;\n        }\n    }\n    if total < 0 { -1 } else { start }\n}`,
              php: `function canCompleteCircuit($gas, $cost) {\n    $total = 0;\n    $tank = 0;\n    $start = 0;\n    $n = count($gas);\n    for ($i = 0; $i < $n; $i++) {\n        $diff = $gas[$i] - $cost[$i];\n        $total += $diff;\n        $tank += $diff;\n        if ($tank < 0) {\n            $start = $i + 1;\n            $tank = 0;\n        }\n    }\n    return $total < 0 ? -1 : $start;\n}`,
              ruby: `def canCompleteCircuit(gas, cost)\n  total = 0\n  tank = 0\n  start = 0\n  (0...gas.length).each do |i|\n    diff = gas[i] - cost[i]\n    total += diff\n    tank += diff\n    if tank < 0\n      start = i + 1\n      tank = 0\n    end\n  end\n  total < 0 ? -1 : start\nend`,
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
      editorial: explain({
        idea: "The **smallest remaining card** has no freedom: it cannot sit in the middle or at the end of a run, because that would need a smaller card, and none exists. So it must start a group, which forces the whole group. Repeat, and the entire arrangement is determined — no search required.",
        steps: [
          "If `hand.length` is not divisible by `groupSize`, return `false` immediately.",
          "Count how many of each card value you hold.",
          "Walk the values in ascending order. Let `c` be the remaining count of the smallest value `v` with `c > 0`.",
          "Those `c` cards must each start a group, so you need `c` copies of `v+1, v+2, …, v+groupSize-1` too.",
          "If any of those is short, return `false`; otherwise subtract `c` from each and continue. Surviving the walk means `true`.",
        ],
        why: "The forcing argument makes greedy exact. Because the smallest remaining value can only ever be a group's first card, taking all `c` copies as group starts is not a choice but a necessity — any valid arrangement must do the same. Each step therefore either matches the unique possibility or proves none exists, so the algorithm never has to backtrack.",
        time: "O(n log n + d · groupSize)",
        space: "O(d)",
        pitfalls: [
          "The divisibility check first — otherwise a leftover partial group slips through.",
          "Consume **all `c` copies at once**. Handling one card at a time works but is slower and easier to get wrong.",
          "Values are not contiguous: skip values whose count has already fallen to zero rather than assuming `v+1` exists.",
          "`groupSize = 1` makes everything trivially true; the loop must handle it without special-casing.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef isNStraightHand(hand: List[int], groupSize: int) -> bool:\n    if len(hand) % groupSize != 0:\n        return False\n    count = Counter(hand)\n    for k in sorted(count):\n        need = count[k]\n        if need == 0:\n            continue\n        for v in range(k, k + groupSize):\n            if count[v] < need:\n                return False\n            count[v] -= need\n    return True`,
        javascript: `var isNStraightHand = function(hand, groupSize) {\n    if (hand.length % groupSize !== 0) return false;\n    const count = new Map();\n    for (const c of hand) count.set(c, (count.get(c) || 0) + 1);\n    const keys = Array.from(count.keys()).sort(function(a, b) { return a - b; });\n    for (const k of keys) {\n        const need = count.get(k) || 0;\n        if (need === 0) continue;\n        for (let v = k; v < k + groupSize; v++) {\n            const have = count.get(v) || 0;\n            if (have < need) return false;\n            count.set(v, have - need);\n        }\n    }\n    return true;\n};`,
              typescript: `function isNStraightHand(hand: number[], groupSize: number): boolean {\n    const n = hand.length;\n    if (n % groupSize !== 0) return false;\n    const count: { [v: number]: number } = {};\n    for (let i = 0; i < n; i++) {\n        count[hand[i]] = (count[hand[i]] === undefined ? 0 : count[hand[i]]) + 1;\n    }\n    const values = hand.slice().sort(function (a, b) { return a - b; });\n    for (let i = 0; i < values.length; i++) {\n        const v = values[i];\n        const c = count[v];\n        if (c === 0) continue;\n        for (let j = 0; j < groupSize; j++) {\n            const w = v + j;\n            if (count[w] === undefined || count[w] < c) return false;\n            count[w] -= c;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean isNStraightHand(int[] hand, int groupSize) {\n    int n = hand.length;\n    if (n % groupSize != 0) return false;\n    TreeMap<Integer, Integer> count = new TreeMap<>();\n    for (int x : hand) count.put(x, count.getOrDefault(x, 0) + 1);\n    for (int v : new ArrayList<>(count.keySet())) {\n        int c = count.getOrDefault(v, 0);\n        if (c == 0) continue;\n        for (int j = 0; j < groupSize; j++) {\n            int w = v + j;\n            int have = count.getOrDefault(w, 0);\n            if (have < c) return false;\n            count.put(w, have - c);\n        }\n    }\n    return true;\n}`,
              cpp: `bool isNStraightHand(vector<int>& hand, int groupSize) {\n    int n = (int) hand.size();\n    if (n % groupSize != 0) return false;\n    map<int, int> count;\n    for (int x : hand) count[x]++;\n    vector<int> values;\n    for (const auto& e : count) values.push_back(e.first);\n    for (int v : values) {\n        int c = count[v];\n        if (c == 0) continue;\n        for (int j = 0; j < groupSize; j++) {\n            int w = v + j;\n            if (count[w] < c) return false;\n            count[w] -= c;\n        }\n    }\n    return true;\n}`,
              c: `bool isNStraightHand(int* hand, int handSize, int groupSize) {\n    if (handSize % groupSize != 0) return false;\n    int count[64];\n    for (int i = 0; i < 64; i++) count[i] = 0;\n    for (int i = 0; i < handSize; i++) count[hand[i]]++;\n    for (int v = 0; v < 64; v++) {\n        int c = count[v];\n        if (c == 0) continue;\n        for (int j = 0; j < groupSize; j++) {\n            int w = v + j;\n            if (w >= 64 || count[w] < c) return false;\n            count[w] -= c;\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool IsNStraightHand(int[] hand, int groupSize)\n{\n    int n = hand.Length;\n    if (n % groupSize != 0) return false;\n    var count = new Dictionary<int, int>();\n    foreach (int x in hand)\n    {\n        if (!count.ContainsKey(x)) count[x] = 0;\n        count[x]++;\n    }\n    var values = new List<int>(count.Keys);\n    values.Sort();\n    foreach (int v in values)\n    {\n        int c = count.ContainsKey(v) ? count[v] : 0;\n        if (c == 0) continue;\n        for (int j = 0; j < groupSize; j++)\n        {\n            int w = v + j;\n            int have = count.ContainsKey(w) ? count[w] : 0;\n            if (have < c) return false;\n            count[w] = have - c;\n        }\n    }\n    return true;\n}`,
              go: `func isNStraightHand(hand []int, groupSize int) bool {\n	n := len(hand)\n	if n%groupSize != 0 {\n		return false\n	}\n	count := map[int]int{}\n	for _, x := range hand {\n		count[x]++\n	}\n	values := []int{}\n	for v := range count {\n		values = append(values, v)\n	}\n	sort.Ints(values)\n	for _, v := range values {\n		c := count[v]\n		if c == 0 {\n			continue\n		}\n		for j := 0; j < groupSize; j++ {\n			w := v + j\n			if count[w] < c {\n				return false\n			}\n			count[w] -= c\n		}\n	}\n	return true\n}`,
              kotlin: `fun isNStraightHand(hand: IntArray, groupSize: Int): Boolean {\n    val n = hand.size\n    if (n % groupSize != 0) return false\n    val count = HashMap<Int, Int>()\n    for (x in hand) count[x] = (count[x] ?: 0) + 1\n    val values = count.keys.sorted()\n    for (v in values) {\n        val c = count[v] ?: 0\n        if (c == 0) continue\n        for (j in 0 until groupSize) {\n            val w = v + j\n            val have = count[w] ?: 0\n            if (have < c) return false\n            count[w] = have - c\n        }\n    }\n    return true\n}`,
              swift: `func isNStraightHand(_ hand: [Int], _ groupSize: Int) -> Bool {\n    let n = hand.count\n    if n % groupSize != 0 { return false }\n    var count: [Int: Int] = [:]\n    for x in hand { count[x, default: 0] += 1 }\n    let values = count.keys.sorted()\n    for v in values {\n        let c = count[v] ?? 0\n        if c == 0 { continue }\n        for j in 0..<groupSize {\n            let w = v + j\n            let have = count[w] ?? 0\n            if have < c { return false }\n            count[w] = have - c\n        }\n    }\n    return true\n}`,
              rust: `fn isNStraightHand(hand: Vec<i32>, groupSize: i32) -> bool {\n    use std::collections::HashMap;\n    let n = hand.len() as i32;\n    if n % groupSize != 0 {\n        return false;\n    }\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in hand.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut values: Vec<i32> = count.keys().cloned().collect();\n    values.sort();\n    for v in values {\n        let c = *count.get(&v).unwrap_or(&0);\n        if c == 0 {\n            continue;\n        }\n        for j in 0..groupSize {\n            let w = v + j;\n            let have = *count.get(&w).unwrap_or(&0);\n            if have < c {\n                return false;\n            }\n            count.insert(w, have - c);\n        }\n    }\n    true\n}`,
              php: `function isNStraightHand($hand, $groupSize) {\n    $n = count($hand);\n    if ($n % $groupSize !== 0) return false;\n    $count = array();\n    foreach ($hand as $x) {\n        if (!array_key_exists($x, $count)) $count[$x] = 0;\n        $count[$x]++;\n    }\n    $values = array_keys($count);\n    sort($values);\n    foreach ($values as $v) {\n        $c = $count[$v];\n        if ($c === 0) continue;\n        for ($j = 0; $j < $groupSize; $j++) {\n            $w = $v + $j;\n            $have = array_key_exists($w, $count) ? $count[$w] : 0;\n            if ($have < $c) return false;\n            $count[$w] = $have - $c;\n        }\n    }\n    return true;\n}`,
              ruby: `def isNStraightHand(hand, groupSize)\n  return false if hand.length % groupSize != 0\n  count = Hash.new(0)\n  hand.each { |x| count[x] += 1 }\n  count.keys.sort.each do |v|\n    c = count[v]\n    next if c == 0\n    (0...groupSize).each do |j|\n      w = v + j\n      return false if count[w] < c\n      count[w] -= c\n    end\n  end\n  true\nend`,
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
      editorial: explain({
        idea: "With unlimited transactions and same-day trading allowed, there is nothing to plan. Any profitable multi-day hold can be split into its individual daily moves without losing a penny, so the best possible total is simply the sum of **every upward step** in the price series.",
        steps: [
          "Walk the prices from the second day onwards.",
          "If today's price is higher than yesterday's, add the difference to the total.",
          "Ignore every day where the price fell or stayed flat.",
          "The accumulated total is the maximum profit.",
        ],
        why: "Two directions. It is **achievable**: buying at the start of every rising run and selling at its top yields exactly the sum of the positive steps, since a hold from `i` to `j` earns `prices[j] - prices[i]`, which telescopes into the daily differences along the way. It is also an **upper bound**: any set of non-overlapping holds earns the sum of its own telescoped differences, and each of those is at most the sum of the positive steps it covers, because the negative steps only subtract. So the two meet.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Do not try to find the global minimum and maximum — that solves the single-transaction problem and undercounts here.",
          "A strictly falling series earns `0`, not a negative number: only positive differences are added.",
          "Flat days contribute nothing, so `>` versus `>=` makes no difference to the total.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxProfit(prices: List[int]) -> int:\n    profit = 0\n    for i in range(1, len(prices)):\n        if prices[i] > prices[i - 1]:\n            profit += prices[i] - prices[i - 1]\n    return profit`,
        javascript: `var maxProfit = function(prices) {\n    let profit = 0;\n    for (let i = 1; i < prices.length; i++) {\n        if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n    }\n    return profit;\n};`,
              typescript: `function maxProfit(prices: number[]): number {\n    let total = 0;\n    for (let i = 1; i < prices.length; i++) {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];\n    }\n    return total;\n}`,
              java: `public static int maxProfit(int[] prices) {\n    int total = 0;\n    for (int i = 1; i < prices.length; i++) {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];\n    }\n    return total;\n}`,
              cpp: `int maxProfit(vector<int>& prices) {\n    int total = 0;\n    for (int i = 1; i < (int) prices.size(); i++) {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];\n    }\n    return total;\n}`,
              c: `int maxProfit(int* prices, int pricesSize) {\n    int total = 0;\n    for (int i = 1; i < pricesSize; i++) {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];\n    }\n    return total;\n}`,
              csharp: `public static int MaxProfit(int[] prices)\n{\n    int total = 0;\n    for (int i = 1; i < prices.Length; i++)\n    {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];\n    }\n    return total;\n}`,
              go: `func maxProfit(prices []int) int {\n	total := 0\n	for i := 1; i < len(prices); i++ {\n		if prices[i] > prices[i-1] {\n			total += prices[i] - prices[i-1]\n		}\n	}\n	return total\n}`,
              kotlin: `fun maxProfit(prices: IntArray): Int {\n    var total = 0\n    for (i in 1 until prices.size) {\n        if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1]\n    }\n    return total\n}`,
              swift: `func maxProfit(_ prices: [Int]) -> Int {\n    var total = 0\n    var i = 1\n    while i < prices.count {\n        if prices[i] > prices[i - 1] { total += prices[i] - prices[i - 1] }\n        i += 1\n    }\n    return total\n}`,
              rust: `fn maxProfit(prices: Vec<i32>) -> i32 {\n    let mut total = 0;\n    for i in 1..prices.len() {\n        if prices[i] > prices[i - 1] {\n            total += prices[i] - prices[i - 1];\n        }\n    }\n    total\n}`,
              php: `function maxProfit($prices) {\n    $total = 0;\n    $n = count($prices);\n    for ($i = 1; $i < $n; $i++) {\n        if ($prices[$i] > $prices[$i - 1]) $total += $prices[$i] - $prices[$i - 1];\n    }\n    return $total;\n}`,
              ruby: `def maxProfit(prices)\n  total = 0\n  (1...prices.length).each do |i|\n    total += prices[i] - prices[i - 1] if prices[i] > prices[i - 1]\n  end\n  total\nend`,
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
      editorial: explain({
        idea: "The heaviest remaining person leaves on the next boat no matter what — they can never be left behind, and no one heavier exists to pair with. The only decision is whether anyone joins them, and the best companion is the **lightest** remaining person: if even they do not fit, nobody does.",
        steps: [
          "Sort the weights ascending.",
          "Put one pointer `i` at the lightest person and one pointer `j` at the heaviest.",
          "Launch a boat for person `j`.",
          "If `people[i] + people[j] <= limit`, the lightest person rides along — advance `i`.",
          "Move `j` down either way, and repeat while `i <= j`.",
        ],
        why: "Pairing the heaviest with the lightest is optimal by exchange: if an optimal plan puts the heaviest with someone else — or alone while the lightest travels elsewhere — swapping in the lightest keeps every boat within the limit, since the lightest is no heavier than whoever they replace. Repeating the swap turns any optimum into this one, so greedy is never worse. And when the pair does not fit, the heaviest must sail alone in *any* plan, so taking that boat costs nothing.",
        time: "O(n log n)",
        space: "O(1)",
        pitfalls: [
          "The loop condition is `i <= j`, not `i < j` — when the pointers meet, that last person still needs a boat.",
          "Decrement `j` on every iteration; a boat always carries the heaviest, whether or not it is shared.",
          "Only advance `i` when the pair actually fits.",
          "Each boat holds at most **two** people, so a greedy \"fill until full\" approach is a different (and wrong) problem.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef numRescueBoats(people: List[int], limit: int) -> int:\n    people = sorted(people)\n    i, j = 0, len(people) - 1\n    boats = 0\n    while i <= j:\n        if people[i] + people[j] <= limit:\n            i += 1\n        j -= 1\n        boats += 1\n    return boats`,
        javascript: `var numRescueBoats = function(people, limit) {\n    const sorted = people.slice().sort(function(a, b) { return a - b; });\n    let i = 0, j = sorted.length - 1, boats = 0;\n    while (i <= j) {\n        if (sorted[i] + sorted[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n};`,
              typescript: `function numRescueBoats(people: number[], limit: number): number {\n    const s = people.slice().sort(function (a, b) { return a - b; });\n    let i = 0;\n    let j = s.length - 1;\n    let boats = 0;\n    while (i <= j) {\n        if (s[i] + s[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n}`,
              java: `public static int numRescueBoats(int[] people, int limit) {\n    int[] s = people.clone();\n    Arrays.sort(s);\n    int i = 0, j = s.length - 1, boats = 0;\n    while (i <= j) {\n        if (s[i] + s[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n}`,
              cpp: `int numRescueBoats(vector<int>& people, int limit) {\n    vector<int> s = people;\n    sort(s.begin(), s.end());\n    int i = 0, j = (int) s.size() - 1, boats = 0;\n    while (i <= j) {\n        if (s[i] + s[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n}`,
              c: `static int cmpBoatAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint numRescueBoats(int* people, int peopleSize, int limit) {\n    int* s = (int*) malloc((peopleSize > 0 ? peopleSize : 1) * sizeof(int));\n    for (int i = 0; i < peopleSize; i++) s[i] = people[i];\n    qsort(s, peopleSize, sizeof(int), cmpBoatAsc);\n    int i = 0, j = peopleSize - 1, boats = 0;\n    while (i <= j) {\n        if (s[i] + s[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    free(s);\n    return boats;\n}`,
              csharp: `public static int NumRescueBoats(int[] people, int limit)\n{\n    int[] s = (int[]) people.Clone();\n    Array.Sort(s);\n    int i = 0, j = s.Length - 1, boats = 0;\n    while (i <= j)\n    {\n        if (s[i] + s[j] <= limit) i++;\n        j--;\n        boats++;\n    }\n    return boats;\n}`,
              go: `func numRescueBoats(people []int, limit int) int {\n	s := append([]int{}, people...)\n	sort.Ints(s)\n	i, j, boats := 0, len(s)-1, 0\n	for i <= j {\n		if s[i]+s[j] <= limit {\n			i++\n		}\n		j--\n		boats++\n	}\n	return boats\n}`,
              kotlin: `fun numRescueBoats(people: IntArray, limit: Int): Int {\n    val s = people.sortedArray()\n    var i = 0\n    var j = s.size - 1\n    var boats = 0\n    while (i <= j) {\n        if (s[i] + s[j] <= limit) i++\n        j--\n        boats++\n    }\n    return boats\n}`,
              swift: `func numRescueBoats(_ people: [Int], _ limit: Int) -> Int {\n    let s = people.sorted()\n    var i = 0\n    var j = s.count - 1\n    var boats = 0\n    while i <= j {\n        if s[i] + s[j] <= limit { i += 1 }\n        j -= 1\n        boats += 1\n    }\n    return boats\n}`,
              rust: `fn numRescueBoats(people: Vec<i32>, limit: i32) -> i32 {\n    let mut s = people.clone();\n    s.sort();\n    let mut i: i32 = 0;\n    let mut j: i32 = s.len() as i32 - 1;\n    let mut boats = 0;\n    while i <= j {\n        if s[i as usize] + s[j as usize] <= limit {\n            i += 1;\n        }\n        j -= 1;\n        boats += 1;\n    }\n    boats\n}`,
              php: `function numRescueBoats($people, $limit) {\n    $s = $people;\n    sort($s);\n    $i = 0;\n    $j = count($s) - 1;\n    $boats = 0;\n    while ($i <= $j) {\n        if ($s[$i] + $s[$j] <= $limit) $i++;\n        $j--;\n        $boats++;\n    }\n    return $boats;\n}`,
              ruby: `def numRescueBoats(people, limit)\n  s = people.sort\n  i = 0\n  j = s.length - 1\n  boats = 0\n  while i <= j\n    i += 1 if s[i] + s[j] <= limit\n    j -= 1\n    boats += 1\n  end\n  boats\nend`,
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
      editorial: explain({
        idea: "Each child faces two separate demands: beat the neighbour on the left if you outrank them, and beat the neighbour on the right if you outrank them. Trying to satisfy both at once in a single pass is where this problem traps people. Handle them in **two independent sweeps** and take the larger requirement at each position.",
        steps: [
          "Give every child `1` candy — the floor everyone is entitled to.",
          "Sweep left to right: if `ratings[i] > ratings[i-1]`, set `candy[i] = candy[i-1] + 1`. This satisfies every rising edge.",
          "Sweep right to left: if `ratings[i] > ratings[i+1]`, set `candy[i] = max(candy[i], candy[i+1] + 1)`. This satisfies every falling edge.",
          "Sum the array.",
        ],
        why: "The `max` is what makes the two sweeps compose. The left sweep produces the smallest values satisfying all left-neighbour constraints; the right sweep does the same on the right. Taking the maximum satisfies both, and cannot be lowered anywhere — each value is forced by one of the two constraints or is the minimum of `1`. So the result is simultaneously valid and minimal at every index, hence minimal in total. Crucially the second sweep never breaks the first, because it only ever *increases* values, and raising a child never violates a constraint that says they must exceed a neighbour.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The right-to-left sweep must take a `max`, not an assignment — plain assignment destroys the left sweep's work on peaks.",
          "**Equal** ratings impose no constraint at all; both children may hold `1`.",
          "One combined pass cannot work: a rising run's height depends on how far back it started, which you only learn later.",
          "Start everyone at `1`, not `0` — every child must get at least one candy.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef candy(ratings: List[int]) -> int:\n    n = len(ratings)\n    candies = [1] * n\n    for i in range(1, n):\n        if ratings[i] > ratings[i - 1]:\n            candies[i] = candies[i - 1] + 1\n    for i in range(n - 2, -1, -1):\n        if ratings[i] > ratings[i + 1]:\n            candies[i] = max(candies[i], candies[i + 1] + 1)\n    return sum(candies)`,
        javascript: `var candy = function(ratings) {\n    const n = ratings.length;\n    const candies = new Array(n).fill(1);\n    for (let i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;\n    }\n    for (let i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);\n    }\n    return candies.reduce(function(a, b) { return a + b; }, 0);\n};`,
              typescript: `function candy(ratings: number[]): number {\n    const n = ratings.length;\n    const give: number[] = [];\n    for (let i = 0; i < n; i++) give.push(1);\n    for (let i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;\n    }\n    for (let i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;\n    }\n    let total = 0;\n    for (let i = 0; i < n; i++) total += give[i];\n    return total;\n}`,
              java: `public static int candy(int[] ratings) {\n    int n = ratings.length;\n    int[] give = new int[n];\n    Arrays.fill(give, 1);\n    for (int i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;\n    }\n    for (int i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) total += give[i];\n    return total;\n}`,
              cpp: `int candy(vector<int>& ratings) {\n    int n = (int) ratings.size();\n    vector<int> give(n, 1);\n    for (int i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;\n    }\n    for (int i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) total += give[i];\n    return total;\n}`,
              c: `int candy(int* ratings, int ratingsSize) {\n    int n = ratingsSize;\n    int* give = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) give[i] = 1;\n    for (int i = 1; i < n; i++) {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;\n    }\n    for (int i = n - 2; i >= 0; i--) {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) total += give[i];\n    free(give);\n    return total;\n}`,
              csharp: `public static int Candy(int[] ratings)\n{\n    int n = ratings.Length;\n    int[] give = new int[n];\n    for (int i = 0; i < n; i++) give[i] = 1;\n    for (int i = 1; i < n; i++)\n    {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;\n    }\n    for (int i = n - 2; i >= 0; i--)\n    {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1;\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) total += give[i];\n    return total;\n}`,
              go: `func candy(ratings []int) int {\n	n := len(ratings)\n	give := make([]int, n)\n	for i := range give {\n		give[i] = 1\n	}\n	for i := 1; i < n; i++ {\n		if ratings[i] > ratings[i-1] {\n			give[i] = give[i-1] + 1\n		}\n	}\n	for i := n - 2; i >= 0; i-- {\n		if ratings[i] > ratings[i+1] && give[i] <= give[i+1] {\n			give[i] = give[i+1] + 1\n		}\n	}\n	total := 0\n	for _, g := range give {\n		total += g\n	}\n	return total\n}`,
              kotlin: `fun candy(ratings: IntArray): Int {\n    val n = ratings.size\n    val give = IntArray(n) { 1 }\n    for (i in 1 until n) {\n        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1\n    }\n    for (i in n - 2 downTo 0) {\n        if (ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]) give[i] = give[i + 1] + 1\n    }\n    return give.sum()\n}`,
              swift: `func candy(_ ratings: [Int]) -> Int {\n    let n = ratings.count\n    var give = [Int](repeating: 1, count: n)\n    var i = 1\n    while i < n {\n        if ratings[i] > ratings[i - 1] { give[i] = give[i - 1] + 1 }\n        i += 1\n    }\n    i = n - 2\n    while i >= 0 {\n        if ratings[i] > ratings[i + 1] && give[i] <= give[i + 1] { give[i] = give[i + 1] + 1 }\n        i -= 1\n    }\n    var total = 0\n    for g in give { total += g }\n    return total\n}`,
              rust: `fn candy(ratings: Vec<i32>) -> i32 {\n    let n = ratings.len();\n    let mut give = vec![1i32; n];\n    for i in 1..n {\n        if ratings[i] > ratings[i - 1] {\n            give[i] = give[i - 1] + 1;\n        }\n    }\n    let mut i = n as i32 - 2;\n    while i >= 0 {\n        let u = i as usize;\n        if ratings[u] > ratings[u + 1] && give[u] <= give[u + 1] {\n            give[u] = give[u + 1] + 1;\n        }\n        i -= 1;\n    }\n    give.iter().sum()\n}`,
              php: `function candy($ratings) {\n    $n = count($ratings);\n    $give = array_fill(0, $n, 1);\n    for ($i = 1; $i < $n; $i++) {\n        if ($ratings[$i] > $ratings[$i - 1]) $give[$i] = $give[$i - 1] + 1;\n    }\n    for ($i = $n - 2; $i >= 0; $i--) {\n        if ($ratings[$i] > $ratings[$i + 1] && $give[$i] <= $give[$i + 1]) $give[$i] = $give[$i + 1] + 1;\n    }\n    return array_sum($give);\n}`,
              ruby: `def candy(ratings)\n  n = ratings.length\n  give = Array.new(n, 1)\n  (1...n).each do |i|\n    give[i] = give[i - 1] + 1 if ratings[i] > ratings[i - 1]\n  end\n  (n - 2).downto(0) do |i|\n    give[i] = give[i + 1] + 1 if ratings[i] > ratings[i + 1] && give[i] <= give[i + 1]\n  end\n  give.sum\nend`,
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
      editorial: explain({
        idea: "A part can only end where every letter inside it has finished for good. So precompute the **last index** of each letter, then sweep: the current part must stretch at least to the last occurrence of every letter met so far. The moment the walking index catches up with that frontier, the part is closed.",
        steps: [
          "Record the last index at which each letter appears.",
          "Track `start` (where the current part began) and `end` (how far it must stretch).",
          "For each index `i`, extend `end = max(end, last[s[i]])`.",
          "When `i == end`, no letter inside can appear later — cut here, record the length `end - start + 1`, and set `start = i + 1`.",
          "The recorded lengths are the answer.",
        ],
        why: "Cutting at the earliest legal point is what maximises the number of parts. The invariant is that `end` is the smallest index at which the current part *could* legally close, given the letters seen so far; closing any earlier would strand a letter across two parts. Since every cut is taken as early as the constraints permit, no alternative partition can produce more parts — and the greedy choice never blocks a later one, because the remaining suffix is an independent instance of the same problem.",
        time: "O(n)",
        space: "O(1) — the table holds at most 26 letters",
        pitfalls: [
          "`end` must be a running maximum, not just the last occurrence of the current character.",
          "The part length is `end - start + 1`; forgetting the `+1` yields lengths one short.",
          "Reset `start` to `i + 1` right after a cut.",
          "Build the last-occurrence table in a separate first pass — you cannot know a letter's final position while still scanning.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef partitionLabels(s: str) -> List[int]:\n    last = {ch: i for i, ch in enumerate(s)}\n    out = []\n    start = 0\n    end = 0\n    for i, ch in enumerate(s):\n        end = max(end, last[ch])\n        if i == end:\n            out.append(end - start + 1)\n            start = i + 1\n    return out`,
        javascript: `var partitionLabels = function(s) {\n    const last = new Map();\n    for (let i = 0; i < s.length; i++) last.set(s[i], i);\n    const out = [];\n    let start = 0, end = 0;\n    for (let i = 0; i < s.length; i++) {\n        end = Math.max(end, last.get(s[i]));\n        if (i === end) {\n            out.push(end - start + 1);\n            start = i + 1;\n        }\n    }\n    return out;\n};`,
              typescript: `function partitionLabels(s: string): number[] {\n    const last: { [ch: string]: number } = {};\n    for (let i = 0; i < s.length; i++) last[s[i]] = i;\n    const out: number[] = [];\n    let start = 0;\n    let end = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (last[s[i]] > end) end = last[s[i]];\n        if (i === end) {\n            out.push(end - start + 1);\n            start = i + 1;\n        }\n    }\n    return out;\n}`,
              java: `public static int[] partitionLabels(String s) {\n    int[] last = new int[128];\n    for (int i = 0; i < s.length(); i++) last[s.charAt(i)] = i;\n    List<Integer> parts = new ArrayList<>();\n    int start = 0, end = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (last[s.charAt(i)] > end) end = last[s.charAt(i)];\n        if (i == end) {\n            parts.add(end - start + 1);\n            start = i + 1;\n        }\n    }\n    int[] out = new int[parts.size()];\n    for (int i = 0; i < parts.size(); i++) out[i] = parts.get(i);\n    return out;\n}`,
              cpp: `vector<int> partitionLabels(string s) {\n    int last[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    for (int i = 0; i < (int) s.size(); i++) last[(int) s[i]] = i;\n    vector<int> out;\n    int start = 0, end = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (last[(int) s[i]] > end) end = last[(int) s[i]];\n        if (i == end) {\n            out.push_back(end - start + 1);\n            start = i + 1;\n        }\n    }\n    return out;\n}`,
              c: `int* partitionLabels(const char* s, int* returnSize) {\n    int n = (int) strlen(s);\n    int last[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    for (int i = 0; i < n; i++) last[(unsigned char) s[i]] = i;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    int start = 0, end = 0;\n    for (int i = 0; i < n; i++) {\n        int lastIdx = last[(unsigned char) s[i]];\n        if (lastIdx > end) end = lastIdx;\n        if (i == end) {\n            out[count++] = end - start + 1;\n            start = i + 1;\n        }\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] PartitionLabels(string s)\n{\n    int[] last = new int[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    for (int i = 0; i < s.Length; i++) last[s[i]] = i;\n    var parts = new List<int>();\n    int start = 0, end = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (last[s[i]] > end) end = last[s[i]];\n        if (i == end)\n        {\n            parts.Add(end - start + 1);\n            start = i + 1;\n        }\n    }\n    return parts.ToArray();\n}`,
              go: `func partitionLabels(s string) []int {\n	last := make([]int, 128)\n	for i := range last {\n		last[i] = -1\n	}\n	for i := 0; i < len(s); i++ {\n		last[s[i]] = i\n	}\n	out := []int{}\n	start, end := 0, 0\n	for i := 0; i < len(s); i++ {\n		if last[s[i]] > end {\n			end = last[s[i]]\n		}\n		if i == end {\n			out = append(out, end-start+1)\n			start = i + 1\n		}\n	}\n	return out\n}`,
              kotlin: `fun partitionLabels(s: String): IntArray {\n    val last = IntArray(128) { -1 }\n    for (i in s.indices) last[s[i].toInt()] = i\n    val parts = mutableListOf<Int>()\n    var start = 0\n    var end = 0\n    for (i in s.indices) {\n        val lastIdx = last[s[i].toInt()]\n        if (lastIdx > end) end = lastIdx\n        if (i == end) {\n            parts.add(end - start + 1)\n            start = i + 1\n        }\n    }\n    return parts.toIntArray()\n}`,
              swift: `func partitionLabels(_ s: String) -> [Int] {\n    let chars = Array(s)\n    var last: [Character: Int] = [:]\n    for (i, ch) in chars.enumerated() { last[ch] = i }\n    var out: [Int] = []\n    var start = 0\n    var end = 0\n    for i in 0..<chars.count {\n        if let l = last[chars[i]], l > end { end = l }\n        if i == end {\n            out.append(end - start + 1)\n            start = i + 1\n        }\n    }\n    return out\n}`,
              rust: `fn partitionLabels(s: String) -> Vec<i32> {\n    let bytes: Vec<u8> = s.bytes().collect();\n    let mut last = [-1i32; 128];\n    for (i, b) in bytes.iter().enumerate() {\n        last[*b as usize] = i as i32;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    let mut start: i32 = 0;\n    let mut end: i32 = 0;\n    for i in 0..bytes.len() {\n        let l = last[bytes[i] as usize];\n        if l > end {\n            end = l;\n        }\n        if i as i32 == end {\n            out.push(end - start + 1);\n            start = i as i32 + 1;\n        }\n    }\n    out\n}`,
              php: `function partitionLabels($s) {\n    $n = strlen($s);\n    $last = array();\n    for ($i = 0; $i < $n; $i++) $last[$s[$i]] = $i;\n    $out = array();\n    $start = 0;\n    $end = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($last[$s[$i]] > $end) $end = $last[$s[$i]];\n        if ($i === $end) {\n            $out[] = $end - $start + 1;\n            $start = $i + 1;\n        }\n    }\n    return $out;\n}`,
              ruby: `def partitionLabels(s)\n  last = {}\n  s.each_char.with_index { |ch, i| last[ch] = i }\n  out = []\n  start = 0\n  finish = 0\n  s.each_char.with_index do |ch, i|\n    finish = last[ch] if last[ch] > finish\n    if i == finish\n      out.push(finish - start + 1)\n      start = i + 1\n    end\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "The schedule's length is dictated by the **most frequent** task — it is the one that keeps forcing idle time. Lay it out first: `maxFreq` copies split the timeline into `maxFreq - 1` blocks of width `n + 1`, plus a final row. Every other task then slots into the gaps. The only twist is that several tasks may tie for `maxFreq`, and each of them adds one slot to that final row.",
        steps: [
          "Count how often each task appears.",
          "Find `maxFreq`, the largest count, and `numMax`, how many tasks achieve it.",
          "Compute the skeleton length: `(maxFreq - 1) * (n + 1) + numMax`.",
          "Answer `max(tasks.length, skeleton)`.",
        ],
        why: "The skeleton is a genuine lower bound: between consecutive runs of the most frequent task there must be at least `n` other intervals, giving `maxFreq - 1` blocks of `n + 1`, and the tail holds one slot for each task tied at `maxFreq`. It is also achievable — filling the gaps column by column never places the same task twice within a block. When there are many distinct tasks the gaps overflow and no idling is needed at all, in which case the answer is simply the number of tasks; taking the `max` covers both regimes.",
        time: "O(n)",
        space: "O(1) — 26 counters",
        pitfalls: [
          "Forgetting `numMax` under-counts whenever several tasks tie for the highest frequency.",
          "The `max` against `tasks.length` is essential — with many distinct tasks the formula alone is too small.",
          "`n = 0` means no cooldown, and the formula correctly collapses to `tasks.length`.",
          "Blocks are `n + 1` wide (the task itself plus `n` cooldown slots), not `n`.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef leastInterval(tasks: List[str], n: int) -> int:\n    count = Counter(tasks)\n    max_freq = max(count.values())\n    max_count = sum(1 for f in count.values() if f == max_freq)\n    return max(len(tasks), (max_freq - 1) * (n + 1) + max_count)`,
        javascript: `var leastInterval = function(tasks, n) {\n    const count = new Map();\n    for (const t of tasks) count.set(t, (count.get(t) || 0) + 1);\n    const freqs = Array.from(count.values());\n    const maxFreq = Math.max.apply(null, freqs);\n    const maxCount = freqs.filter(function(f) { return f === maxFreq; }).length;\n    return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount);\n};`,
              typescript: `function leastInterval(tasks: string[], n: number): number {\n    const count: { [t: string]: number } = {};\n    for (let i = 0; i < tasks.length; i++) {\n        count[tasks[i]] = (count[tasks[i]] === undefined ? 0 : count[tasks[i]]) + 1;\n    }\n    let maxFreq = 0;\n    let numMax = 0;\n    for (const key in count) {\n        if (count[key] > maxFreq) {\n            maxFreq = count[key];\n            numMax = 1;\n        } else if (count[key] === maxFreq) {\n            numMax++;\n        }\n    }\n    const skeleton = (maxFreq - 1) * (n + 1) + numMax;\n    return Math.max(tasks.length, skeleton);\n}`,
              java: `public static int leastInterval(String[] tasks, int n) {\n    int[] count = new int[26];\n    for (String t : tasks) count[t.charAt(0) - 'A']++;\n    int maxFreq = 0, numMax = 0;\n    for (int c : count) {\n        if (c > maxFreq) {\n            maxFreq = c;\n            numMax = 1;\n        } else if (c == maxFreq && c > 0) {\n            numMax++;\n        }\n    }\n    int skeleton = (maxFreq - 1) * (n + 1) + numMax;\n    return Math.max(tasks.length, skeleton);\n}`,
              cpp: `int leastInterval(vector<string>& tasks, int n) {\n    int count[26];\n    for (int i = 0; i < 26; i++) count[i] = 0;\n    for (const string& t : tasks) count[t[0] - 'A']++;\n    int maxFreq = 0, numMax = 0;\n    for (int i = 0; i < 26; i++) {\n        if (count[i] > maxFreq) {\n            maxFreq = count[i];\n            numMax = 1;\n        } else if (count[i] == maxFreq && count[i] > 0) {\n            numMax++;\n        }\n    }\n    int skeleton = (maxFreq - 1) * (n + 1) + numMax;\n    return max((int) tasks.size(), skeleton);\n}`,
              c: `int leastInterval(char** tasks, int tasksSize, int n) {\n    int count[26];\n    for (int i = 0; i < 26; i++) count[i] = 0;\n    for (int i = 0; i < tasksSize; i++) count[tasks[i][0] - 'A']++;\n    int maxFreq = 0, numMax = 0;\n    for (int i = 0; i < 26; i++) {\n        if (count[i] > maxFreq) {\n            maxFreq = count[i];\n            numMax = 1;\n        } else if (count[i] == maxFreq && count[i] > 0) {\n            numMax++;\n        }\n    }\n    int skeleton = (maxFreq - 1) * (n + 1) + numMax;\n    return tasksSize > skeleton ? tasksSize : skeleton;\n}`,
              csharp: `public static int LeastInterval(string[] tasks, int n)\n{\n    int[] count = new int[26];\n    foreach (string t in tasks) count[t[0] - 'A']++;\n    int maxFreq = 0, numMax = 0;\n    foreach (int c in count)\n    {\n        if (c > maxFreq)\n        {\n            maxFreq = c;\n            numMax = 1;\n        }\n        else if (c == maxFreq && c > 0)\n        {\n            numMax++;\n        }\n    }\n    int skeleton = (maxFreq - 1) * (n + 1) + numMax;\n    return Math.Max(tasks.Length, skeleton);\n}`,
              go: `func leastInterval(tasks []string, n int) int {\n	count := make([]int, 26)\n	for _, t := range tasks {\n		count[t[0]-'A']++\n	}\n	maxFreq, numMax := 0, 0\n	for _, c := range count {\n		if c > maxFreq {\n			maxFreq = c\n			numMax = 1\n		} else if c == maxFreq && c > 0 {\n			numMax++\n		}\n	}\n	skeleton := (maxFreq-1)*(n+1) + numMax\n	if len(tasks) > skeleton {\n		return len(tasks)\n	}\n	return skeleton\n}`,
              kotlin: `fun leastInterval(tasks: Array<String>, n: Int): Int {\n    val count = IntArray(26)\n    for (t in tasks) count[t[0] - 'A']++\n    var maxFreq = 0\n    var numMax = 0\n    for (c in count) {\n        if (c > maxFreq) {\n            maxFreq = c\n            numMax = 1\n        } else if (c == maxFreq && c > 0) {\n            numMax++\n        }\n    }\n    val skeleton = (maxFreq - 1) * (n + 1) + numMax\n    return maxOf(tasks.size, skeleton)\n}`,
              swift: `func leastInterval(_ tasks: [String], _ n: Int) -> Int {\n    var count = [Int](repeating: 0, count: 26)\n    for t in tasks {\n        let idx = Int(t.unicodeScalars.first!.value) - 65\n        count[idx] += 1\n    }\n    var maxFreq = 0\n    var numMax = 0\n    for c in count {\n        if c > maxFreq {\n            maxFreq = c\n            numMax = 1\n        } else if c == maxFreq && c > 0 {\n            numMax += 1\n        }\n    }\n    let skeleton = (maxFreq - 1) * (n + 1) + numMax\n    return max(tasks.count, skeleton)\n}`,
              rust: `fn leastInterval(tasks: Vec<String>, n: i32) -> i32 {\n    let mut count = [0i32; 26];\n    for t in tasks.iter() {\n        let b = t.as_bytes()[0];\n        count[(b - b'A') as usize] += 1;\n    }\n    let mut max_freq = 0;\n    let mut num_max = 0;\n    for c in count.iter() {\n        if *c > max_freq {\n            max_freq = *c;\n            num_max = 1;\n        } else if *c == max_freq && *c > 0 {\n            num_max += 1;\n        }\n    }\n    let skeleton = (max_freq - 1) * (n + 1) + num_max;\n    let len = tasks.len() as i32;\n    if len > skeleton { len } else { skeleton }\n}`,
              php: `function leastInterval($tasks, $n) {\n    $count = array_fill(0, 26, 0);\n    foreach ($tasks as $t) {\n        $count[ord($t[0]) - ord('A')]++;\n    }\n    $maxFreq = 0;\n    $numMax = 0;\n    foreach ($count as $c) {\n        if ($c > $maxFreq) {\n            $maxFreq = $c;\n            $numMax = 1;\n        } elseif ($c === $maxFreq && $c > 0) {\n            $numMax++;\n        }\n    }\n    $skeleton = ($maxFreq - 1) * ($n + 1) + $numMax;\n    return max(count($tasks), $skeleton);\n}`,
              ruby: `def leastInterval(tasks, n)\n  count = Hash.new(0)\n  tasks.each { |t| count[t] += 1 }\n  max_freq = count.values.max\n  num_max = count.values.count { |c| c == max_freq }\n  skeleton = (max_freq - 1) * (n + 1) + num_max\n  [tasks.length, skeleton].max\nend`,
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
      editorial: explain({
        idea: "Only two denominations are ever handed back, so the whole state is *how many $5s and $10s you hold*. The one real decision is how to change a $20, and it should always be `$10 + $5` when possible: a $10 can only ever be part of a $20's change, whereas a $5 is needed for both $10 and $20 customers. Spend the inflexible bill first.",
        steps: [
          "Track counts of `$5` and `$10` bills.",
          "A `$5` customer needs no change — just bank the note.",
          "A `$10` customer needs one `$5`; fail if you have none.",
          "A `$20` customer needs `$15`: prefer one `$10` plus one `$5`; otherwise use three `$5`s; if neither works, fail.",
          "Surviving every customer means `true`.",
        ],
        why: "An exchange argument justifies the preference. Suppose an optimal run pays a $20 with three $5s while a $10 was available. Swapping to `$10 + $5` leaves you with two more $5s and one fewer $10 — and since a $10 is *only* ever usable for a $20's change, while those $5s serve both customer types, the swapped state can satisfy every future request the original could. So greedy never forfeits a solution that existed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying three $5s before `$10 + $5` is the classic failure — it burns the flexible bills and strands the $10s.",
          "$20 notes are never given as change, so there is no reason to count them.",
          "Check availability **before** decrementing, or the counts go negative and later customers appear serviceable.",
          "Order matters: the customers must be processed exactly as given.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef lemonadeChange(bills: List[int]) -> bool:\n    fives = 0\n    tens = 0\n    for b in bills:\n        if b == 5:\n            fives += 1\n        elif b == 10:\n            if fives == 0:\n                return False\n            fives -= 1\n            tens += 1\n        else:\n            if tens > 0 and fives > 0:\n                tens -= 1\n                fives -= 1\n            elif fives >= 3:\n                fives -= 3\n            else:\n                return False\n    return True`,
        javascript: `var lemonadeChange = function(bills) {\n    let fives = 0, tens = 0;\n    for (const b of bills) {\n        if (b === 5) {\n            fives++;\n        } else if (b === 10) {\n            if (fives === 0) return false;\n            fives--;\n            tens++;\n        } else {\n            if (tens > 0 && fives > 0) { tens--; fives--; }\n            else if (fives >= 3) fives -= 3;\n            else return false;\n        }\n    }\n    return true;\n};`,
              typescript: `function lemonadeChange(bills: number[]): boolean {\n    let five = 0;\n    let ten = 0;\n    for (let i = 0; i < bills.length; i++) {\n        const b = bills[i];\n        if (b === 5) {\n            five++;\n        } else if (b === 10) {\n            if (five === 0) return false;\n            five--;\n            ten++;\n        } else {\n            if (ten > 0 && five > 0) {\n                ten--;\n                five--;\n            } else if (five >= 3) {\n                five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              java: `public static boolean lemonadeChange(int[] bills) {\n    int five = 0, ten = 0;\n    for (int b : bills) {\n        if (b == 5) {\n            five++;\n        } else if (b == 10) {\n            if (five == 0) return false;\n            five--;\n            ten++;\n        } else {\n            if (ten > 0 && five > 0) {\n                ten--;\n                five--;\n            } else if (five >= 3) {\n                five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              cpp: `bool lemonadeChange(vector<int>& bills) {\n    int five = 0, ten = 0;\n    for (int b : bills) {\n        if (b == 5) {\n            five++;\n        } else if (b == 10) {\n            if (five == 0) return false;\n            five--;\n            ten++;\n        } else {\n            if (ten > 0 && five > 0) {\n                ten--;\n                five--;\n            } else if (five >= 3) {\n                five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              c: `bool lemonadeChange(int* bills, int billsSize) {\n    int five = 0, ten = 0;\n    for (int i = 0; i < billsSize; i++) {\n        int b = bills[i];\n        if (b == 5) {\n            five++;\n        } else if (b == 10) {\n            if (five == 0) return false;\n            five--;\n            ten++;\n        } else {\n            if (ten > 0 && five > 0) {\n                ten--;\n                five--;\n            } else if (five >= 3) {\n                five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool LemonadeChange(int[] bills)\n{\n    int five = 0, ten = 0;\n    foreach (int b in bills)\n    {\n        if (b == 5)\n        {\n            five++;\n        }\n        else if (b == 10)\n        {\n            if (five == 0) return false;\n            five--;\n            ten++;\n        }\n        else\n        {\n            if (ten > 0 && five > 0)\n            {\n                ten--;\n                five--;\n            }\n            else if (five >= 3)\n            {\n                five -= 3;\n            }\n            else\n            {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              go: `func lemonadeChange(bills []int) bool {\n	five, ten := 0, 0\n	for _, b := range bills {\n		if b == 5 {\n			five++\n		} else if b == 10 {\n			if five == 0 {\n				return false\n			}\n			five--\n			ten++\n		} else {\n			if ten > 0 && five > 0 {\n				ten--\n				five--\n			} else if five >= 3 {\n				five -= 3\n			} else {\n				return false\n			}\n		}\n	}\n	return true\n}`,
              kotlin: `fun lemonadeChange(bills: IntArray): Boolean {\n    var five = 0\n    var ten = 0\n    for (b in bills) {\n        when {\n            b == 5 -> five++\n            b == 10 -> {\n                if (five == 0) return false\n                five--\n                ten++\n            }\n            else -> {\n                if (ten > 0 && five > 0) {\n                    ten--\n                    five--\n                } else if (five >= 3) {\n                    five -= 3\n                } else {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}`,
              swift: `func lemonadeChange(_ bills: [Int]) -> Bool {\n    var five = 0\n    var ten = 0\n    for b in bills {\n        if b == 5 {\n            five += 1\n        } else if b == 10 {\n            if five == 0 { return false }\n            five -= 1\n            ten += 1\n        } else {\n            if ten > 0 && five > 0 {\n                ten -= 1\n                five -= 1\n            } else if five >= 3 {\n                five -= 3\n            } else {\n                return false\n            }\n        }\n    }\n    return true\n}`,
              rust: `fn lemonadeChange(bills: Vec<i32>) -> bool {\n    let mut five = 0;\n    let mut ten = 0;\n    for &b in bills.iter() {\n        if b == 5 {\n            five += 1;\n        } else if b == 10 {\n            if five == 0 {\n                return false;\n            }\n            five -= 1;\n            ten += 1;\n        } else {\n            if ten > 0 && five > 0 {\n                ten -= 1;\n                five -= 1;\n            } else if five >= 3 {\n                five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    true\n}`,
              php: `function lemonadeChange($bills) {\n    $five = 0;\n    $ten = 0;\n    foreach ($bills as $b) {\n        if ($b === 5) {\n            $five++;\n        } elseif ($b === 10) {\n            if ($five === 0) return false;\n            $five--;\n            $ten++;\n        } else {\n            if ($ten > 0 && $five > 0) {\n                $ten--;\n                $five--;\n            } elseif ($five >= 3) {\n                $five -= 3;\n            } else {\n                return false;\n            }\n        }\n    }\n    return true;\n}`,
              ruby: `def lemonadeChange(bills)\n  five = 0\n  ten = 0\n  bills.each do |b|\n    if b == 5\n      five += 1\n    elsif b == 10\n      return false if five == 0\n      five -= 1\n      ten += 1\n    else\n      if ten > 0 && five > 0\n        ten -= 1\n        five -= 1\n      elsif five >= 3\n        five -= 3\n      else\n        return false\n      end\n    end\n  end\n  true\nend`,
      },
    };
  })(),

];
