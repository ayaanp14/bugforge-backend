/**
 * Mixed problems — wave 4.
 *
 * The topics the earlier waves of this batch did not have a file for:
 * simulation, counting, intervals, number theory, merge-sort counting,
 * union-find and a few knapsack variants. Real LeetCode problems only, with
 * the worked examples phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=`, because the
 * JS/Python driver's parseArgs reads `<ident>=` as a named argument
 * (src/lib/judge0.ts), and no input or output may hold a `__CODEXA_` sentinel.
 * Every return value stays inside a 32-bit int — counting problems answer
 * modulo 10^9 + 7 and the rest have their upstream constraints tightened where
 * the original would overflow.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at(), .flat() or
 * .flatMap(). The C harness has string.h but no math.h, so roots and powers
 * are written as integer loops.
 */

import {
  bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr,
  pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/**
 * Exact modular multiply for the reference implementations. A plain
 * `a * b % MOD` loses precision in JavaScript once both sides approach 10^9,
 * and a generator's output is what the hidden test cases are judged against.
 */
const MODX = 1000000007;
const mulModX = (a: number, b: number) => {
  const hi = Math.floor(a / 65536), lo = a % 65536;
  return ((hi * b % MODX) * 65536 + lo * b) % MODX;
};

export const MISC4_PROBLEMS: CatalogProblem[] = [

  // ── Most Frequent Even Element (LC 2404) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const counts: Record<string, number> = {};
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] % 2 !== 0) continue;
        const key = String(nums[i]);
        counts[key] = (counts[key] === undefined ? 0 : counts[key]) + 1;
      }
      let best = -1, bestCount = 0;
      const keys = Object.keys(counts);
      for (let i = 0; i < keys.length; i++) {
        const v = parseInt(keys[i], 10);
        const c = counts[keys[i]];
        if (c > bestCount || (c === bestCount && v < best)) { best = v; bestCount = c; }
      }
      return best;
    };
    return {
      slug: "most-frequent-even-element",
      title: "Most Frequent Even Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Google", "Infosys"],
      signature: { funcName: "mostFrequentEven", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return the **most frequent even** element of `nums`. If several even elements tie, return the **smallest** of them. If there is no even element, return `-1`.",
        [
          { in: "nums = [0,1,2,2,4,4,1]", out: "2", note: "`2` and `4` both appear twice; `2` is smaller." },
          { in: "nums = [4,4,4,9,2,4]", out: "4", note: "`4` appears four times." },
          { in: "nums = [29,47,21,41,13,37,25,7]", out: "-1", note: "No even element at all." },
        ],
        ["1 <= nums.length <= 2000", "0 <= nums[i] <= 10^5"]),
      hints: [
        "Count only the even values — odd ones never matter.",
        "Scan the counts once, keeping the best (count, value) pair.",
        "On a tie, prefer the smaller value.",
      ],
      editorial: explain({
        idea: "Tally the even elements, then pick the entry with the largest count, breaking ties toward the smaller value.",
        steps: [
          "Walk `nums`, incrementing a counter for each even value.",
          "Walk the counters, keeping the value with the highest count and, on equal counts, the smaller value.",
          "Return `-1` if nothing was counted.",
        ],
        why: "The tie-break has to be checked explicitly — iterating a hash map gives no useful order, so \"first seen with this count\" is not the same as \"smallest\". Scanning candidates in ascending value order is the other way to get it right, and is why a sorted map or an array indexed by value is a natural fit here.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "0 is even and a perfectly valid answer.",
          "The tie-break is by value, not by position.",
          "`-1` means \"no even element\", not \"no repeat\".",
        ],
      }),
      examples: [
        { input: "[0,1,2,2,4,4,1]", expectedOutput: "2" },
        { input: "[4,4,4,9,2,4]", expectedOutput: "4" },
        { input: "[29,47,21,41,13,37,25,7]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const nums = Array.from({ length: n }, () => ri(rng, 0, 12));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from collections import Counter\nfrom typing import List\n\ndef mostFrequentEven(nums: List[int]) -> int:\n    counts = Counter(v for v in nums if v % 2 == 0)\n    best, best_count = -1, 0\n    for v, c in counts.items():\n        if c > best_count or (c == best_count and v < best):\n            best, best_count = v, c\n    return best`,
        javascript: `var mostFrequentEven = function(nums) {\n    var counts = {}, i;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 !== 0) continue;\n        var key = String(nums[i]);\n        counts[key] = (counts[key] === undefined ? 0 : counts[key]) + 1;\n    }\n    var best = -1, bestCount = 0;\n    var keys = Object.keys(counts);\n    for (i = 0; i < keys.length; i++) {\n        var v = parseInt(keys[i], 10);\n        var c = counts[keys[i]];\n        if (c > bestCount || (c === bestCount && v < best)) { best = v; bestCount = c; }\n    }\n    return best;\n};`,
        typescript: `function mostFrequentEven(nums: number[]): number {\n    var counts: { [k: string]: number } = {}, i: number;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 !== 0) continue;\n        var key = String(nums[i]);\n        counts[key] = (counts[key] === undefined ? 0 : counts[key]) + 1;\n    }\n    var best = -1, bestCount = 0;\n    var keys = Object.keys(counts);\n    for (i = 0; i < keys.length; i++) {\n        var v = parseInt(keys[i], 10);\n        var c = counts[keys[i]];\n        if (c > bestCount || (c === bestCount && v < best)) { best = v; bestCount = c; }\n    }\n    return best;\n}`,
        java: `public static int mostFrequentEven(int[] nums) {\n    Map<Integer, Integer> counts = new HashMap<>();\n    for (int v : nums) {\n        if (v % 2 != 0) continue;\n        counts.put(v, counts.getOrDefault(v, 0) + 1);\n    }\n    int best = -1, bestCount = 0;\n    for (Map.Entry<Integer, Integer> e : counts.entrySet()) {\n        int v = e.getKey(), c = e.getValue();\n        if (c > bestCount || (c == bestCount && v < best)) {\n            best = v;\n            bestCount = c;\n        }\n    }\n    return best;\n}`,
        cpp: `int mostFrequentEven(vector<int>& nums) {\n    unordered_map<int, int> counts;\n    for (int v : nums) {\n        if (v % 2 != 0) continue;\n        counts[v]++;\n    }\n    int best = -1, bestCount = 0;\n    for (auto& e : counts) {\n        if (e.second > bestCount || (e.second == bestCount && e.first < best)) {\n            best = e.first;\n            bestCount = e.second;\n        }\n    }\n    return best;\n}`,
        c: `int mostFrequentEven(int* nums, int numsSize) {\n    int maxv = 0;\n    for (int i = 0; i < numsSize; i++) if (nums[i] > maxv) maxv = nums[i];\n    int* counts = (int*) calloc((size_t) (maxv + 1), sizeof(int));\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] % 2 == 0) counts[nums[i]]++;\n    }\n    int best = -1, bestCount = 0;\n    for (int v = 0; v <= maxv; v += 2) {\n        if (counts[v] > bestCount) {\n            best = v;\n            bestCount = counts[v];\n        }\n    }\n    free(counts);\n    return best;\n}`,
        csharp: `public static int MostFrequentEven(int[] nums)\n{\n    var counts = new Dictionary<int, int>();\n    foreach (var v in nums)\n    {\n        if (v % 2 != 0) continue;\n        counts[v] = counts.ContainsKey(v) ? counts[v] + 1 : 1;\n    }\n    int best = -1, bestCount = 0;\n    foreach (var e in counts)\n    {\n        if (e.Value > bestCount || (e.Value == bestCount && e.Key < best))\n        {\n            best = e.Key;\n            bestCount = e.Value;\n        }\n    }\n    return best;\n}`,
        go: `func mostFrequentEven(nums []int) int {\n\tcounts := map[int]int{}\n\tfor _, v := range nums {\n\t\tif v%2 == 0 {\n\t\t\tcounts[v]++\n\t\t}\n\t}\n\tbest, bestCount := -1, 0\n\tfor v, c := range counts {\n\t\tif c > bestCount || (c == bestCount && v < best) {\n\t\t\tbest, bestCount = v, c\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun mostFrequentEven(nums: IntArray): Int {\n    val counts = HashMap<Int, Int>()\n    for (v in nums) {\n        if (v % 2 != 0) continue\n        counts[v] = (counts[v] ?: 0) + 1\n    }\n    var best = -1\n    var bestCount = 0\n    for ((v, c) in counts) {\n        if (c > bestCount || (c == bestCount && v < best)) {\n            best = v\n            bestCount = c\n        }\n    }\n    return best\n}`,
        swift: `func mostFrequentEven(_ nums: [Int]) -> Int {\n    var counts = [Int: Int]()\n    for v in nums where v % 2 == 0 {\n        counts[v, default: 0] += 1\n    }\n    var best = -1\n    var bestCount = 0\n    for (v, c) in counts {\n        if c > bestCount || (c == bestCount && v < best) {\n            best = v\n            bestCount = c\n        }\n    }\n    return best\n}`,
        rust: `fn mostFrequentEven(nums: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut counts: HashMap<i32, i32> = HashMap::new();\n    for &v in nums.iter() {\n        if v % 2 == 0 {\n            *counts.entry(v).or_insert(0) += 1;\n        }\n    }\n    let mut best = -1i32;\n    let mut best_count = 0i32;\n    for (&v, &c) in counts.iter() {\n        if c > best_count || (c == best_count && v < best) {\n            best = v;\n            best_count = c;\n        }\n    }\n    best\n}`,
        php: `function mostFrequentEven($nums) {\n    $counts = [];\n    foreach ($nums as $v) {\n        if ($v % 2 !== 0) continue;\n        $counts[$v] = isset($counts[$v]) ? $counts[$v] + 1 : 1;\n    }\n    $best = -1;\n    $bestCount = 0;\n    foreach ($counts as $v => $c) {\n        if ($c > $bestCount || ($c === $bestCount && $v < $best)) {\n            $best = $v;\n            $bestCount = $c;\n        }\n    }\n    return $best;\n}`,
        ruby: `def mostFrequentEven(nums)\n  counts = Hash.new(0)\n  nums.each { |v| counts[v] += 1 if v.even? }\n  best = -1\n  best_count = 0\n  counts.each do |v, c|\n    if c > best_count || (c == best_count && v < best)\n      best = v\n      best_count = c\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Calculate Delayed Arrival Time (LC 2651) ────────────────────
  (() => {
    const ref = (arrivalTime: number, delayedTime: number) => (arrivalTime + delayedTime) % 24;
    return {
      slug: "calculate-delayed-arrival-time",
      title: "Calculate Delayed Arrival Time",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Google", "TCS"],
      signature: { funcName: "findDelayedArrivalTime", params: [{ name: "arrivalTime", type: "int" as const }, { name: "delayedTime", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A train was scheduled to arrive at hour `arrivalTime` on a **24-hour clock** but is `delayedTime` hours late.\n\nReturn the hour it actually arrives, again on the 24-hour clock.",
        [
          { in: "arrivalTime = 15, delayedTime = 5", out: "20" },
          { in: "arrivalTime = 13, delayedTime = 11", out: "0", note: "24 wraps around to 0, not 24." },
          { in: "arrivalTime = 0, delayedTime = 0", out: "0" },
        ],
        ["1 <= arrivaltime < 24", "1 <= delayedTime <= 24"]),
      hints: [
        "Add the two hours together.",
        "Take the result modulo 24.",
        "Hour 24 is written as 0.",
      ],
      editorial: explain({
        idea: "Add the delay to the scheduled hour and reduce modulo 24.",
        steps: [
          "Compute `arrivalTime + delayedTime`.",
          "Return that modulo 24.",
        ],
        why: "The only real content is that the 24-hour clock is the integers modulo 24 — hour 24 is hour 0, not a 25th hour. With both inputs under 25 the sum never exceeds 47, so a single modulo is exact and no loop or conditional subtraction is needed.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Returning 24 instead of 0 for an exact wrap.",
          "Subtracting 24 once is enough here, but the modulo says so unconditionally.",
          "The clock has no minutes — everything is whole hours.",
        ],
      }),
      examples: [
        { input: "15\n5", expectedOutput: "20" },
        { input: "13\n11", expectedOutput: "0" },
        { input: "0\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const arrivalTime = ri(rng, 0, 23);
        const delayedTime = ri(rng, 1, 24);
        return { input: `${arrivalTime}\n${delayedTime}`, expectedOutput: String(ref(arrivalTime, delayedTime)) };
      },
      solutions: {
        python: `def findDelayedArrivalTime(arrivalTime: int, delayedTime: int) -> int:\n    return (arrivalTime + delayedTime) % 24`,
        javascript: `var findDelayedArrivalTime = function(arrivalTime, delayedTime) {\n    return (arrivalTime + delayedTime) % 24;\n};`,
        typescript: `function findDelayedArrivalTime(arrivalTime: number, delayedTime: number): number {\n    return (arrivalTime + delayedTime) % 24;\n}`,
        java: `public static int findDelayedArrivalTime(int arrivalTime, int delayedTime) {\n    return (arrivalTime + delayedTime) % 24;\n}`,
        cpp: `int findDelayedArrivalTime(int arrivalTime, int delayedTime) {\n    return (arrivalTime + delayedTime) % 24;\n}`,
        c: `int findDelayedArrivalTime(int arrivalTime, int delayedTime) {\n    return (arrivalTime + delayedTime) % 24;\n}`,
        csharp: `public static int FindDelayedArrivalTime(int arrivalTime, int delayedTime)\n{\n    return (arrivalTime + delayedTime) % 24;\n}`,
        go: `func findDelayedArrivalTime(arrivalTime int, delayedTime int) int {\n\treturn (arrivalTime + delayedTime) % 24\n}`,
        kotlin: `fun findDelayedArrivalTime(arrivalTime: Int, delayedTime: Int): Int {\n    return (arrivalTime + delayedTime) % 24\n}`,
        swift: `func findDelayedArrivalTime(_ arrivalTime: Int, _ delayedTime: Int) -> Int {\n    return (arrivalTime + delayedTime) % 24\n}`,
        rust: `fn findDelayedArrivalTime(arrivalTime: i32, delayedTime: i32) -> i32 {\n    (arrivalTime + delayedTime) % 24\n}`,
        php: `function findDelayedArrivalTime($arrivalTime, $delayedTime) {\n    return ($arrivalTime + $delayedTime) % 24;\n}`,
        ruby: `def findDelayedArrivalTime(arrivalTime, delayedTime)\n  (arrivalTime + delayedTime) % 24\nend`,
      },
    };
  })(),

  // ── The Employee That Worked on the Longest Task (LC 2432) ──────
  (() => {
    const ref = (n: number, logs: number[][]) => {
      let best = logs[0][0], bestTime = logs[0][1];
      for (let i = 1; i < logs.length; i++) {
        const span = logs[i][1] - logs[i - 1][1];
        if (span > bestTime || (span === bestTime && logs[i][0] < best)) {
          best = logs[i][0];
          bestTime = span;
        }
      }
      return best;
    };
    return {
      slug: "the-employee-that-worked-on-the-longest-task",
      title: "The Employee That Worked on the Longest Task",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "Wipro"],
      signature: { funcName: "hardestWorker", params: [{ name: "n", type: "int" as const }, { name: "logs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` employees, numbered 0 to `n - 1`. `logs[i] = [id, leaveTime]` records that employee `id` **finished** a task at `leaveTime`. The logs are sorted by `leaveTime`, tasks run back to back, and the first task started at time 0.\n\nReturn the id of the employee whose **single task** took the longest. On a tie, return the **smallest** id.",
        [
          { in: "n = 10, logs = [[0,3],[2,5],[0,9],[1,15]]", out: "1", note: "The durations are 3, 2, 4 and 6; the 6 belongs to employee 1." },
          { in: "n = 26, logs = [[1,1],[3,7],[2,12],[7,17]] ", out: "3", note: "Durations 1, 6, 5 and 5 — employee 3 worked 6." },
          { in: "n = 2, logs = [[0,10],[1,20]]", out: "0", note: "Both worked 10; the smaller id wins." },
        ],
        ["2 <= n <= 500", "1 <= logs.length <= 500", "logs[i].length == 2", "0 <= idi <= n - 1", "1 <= leaveTimei <= 500", "idi != idi+1", "leaveTimei are sorted in a strictly increasing order."]),
      hints: [
        "A task's duration is the gap between its own leave time and the previous one.",
        "The very first task started at 0, so its duration is its leave time.",
        "Track the longest duration and break ties toward the smaller id.",
      ],
      editorial: explain({
        idea: "Each log entry's task duration is `leaveTime[i] - leaveTime[i-1]`, with the first task measured from 0. One pass keeps the longest and applies the tie-break.",
        steps: [
          "Seed the answer with the first log: duration `logs[0][1]`, id `logs[0][0]`.",
          "For each later entry, compute the gap from the previous leave time.",
          "Replace the best when the gap is longer, or equal with a smaller id.",
        ],
        why: "The \"tasks run back to back\" wording is what makes the gap the duration — there is no idle time to account for, so no start times are needed. The tie-break must be checked on every equal duration, not only the first, which is the single place a one-pass loop usually goes wrong here.",
        time: "O(m)",
        space: "O(1)",
        pitfalls: [
          "The first task's duration is its leave time, not zero.",
          "The smallest **id** wins a tie, not the earliest task.",
          "`n` is only there to bound the ids; it plays no part in the computation.",
        ],
      }),
      examples: [
        { input: "10\n[[0,3],[2,5],[0,9],[1,15]]", expectedOutput: "1" },
        { input: "26\n[[1,1],[3,7],[2,12],[7,17]]", expectedOutput: "3" },
        { input: "2\n[[0,10],[1,20]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 8);
        const count = ri(rng, 1, 8);
        const logs: number[][] = [];
        let t = 0, prevId = -1;
        for (let i = 0; i < count; i++) {
          t += ri(rng, 1, 6);
          let id = ri(rng, 0, n - 1);
          // Consecutive entries must name different employees.
          if (id === prevId) id = (id + 1) % n;
          logs.push([id, t]);
          prevId = id;
        }
        return { input: `${n}\n${fmtIntMat(logs)}`, expectedOutput: String(ref(n, logs)) };
      },
      solutions: {
        python: `from typing import List\n\ndef hardestWorker(n: int, logs: List[List[int]]) -> int:\n    best, best_time = logs[0][0], logs[0][1]\n    for i in range(1, len(logs)):\n        span = logs[i][1] - logs[i - 1][1]\n        if span > best_time or (span == best_time and logs[i][0] < best):\n            best, best_time = logs[i][0], span\n    return best`,
        javascript: `var hardestWorker = function(n, logs) {\n    var best = logs[0][0], bestTime = logs[0][1];\n    for (var i = 1; i < logs.length; i++) {\n        var span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span === bestTime && logs[i][0] < best)) {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n};`,
        typescript: `function hardestWorker(n: number, logs: number[][]): number {\n    var best = logs[0][0], bestTime = logs[0][1];\n    for (var i = 1; i < logs.length; i++) {\n        var span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span === bestTime && logs[i][0] < best)) {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n}`,
        java: `public static int hardestWorker(int n, int[][] logs) {\n    int best = logs[0][0], bestTime = logs[0][1];\n    for (int i = 1; i < logs.length; i++) {\n        int span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span == bestTime && logs[i][0] < best)) {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n}`,
        cpp: `int hardestWorker(int n, vector<vector<int>>& logs) {\n    int best = logs[0][0], bestTime = logs[0][1];\n    for (int i = 1; i < (int) logs.size(); i++) {\n        int span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span == bestTime && logs[i][0] < best)) {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n}`,
        c: `int hardestWorker(int n, int** logs, int logsSize, int* logsColSize) {\n    (void) n;\n    (void) logsColSize;\n    int best = logs[0][0], bestTime = logs[0][1];\n    for (int i = 1; i < logsSize; i++) {\n        int span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span == bestTime && logs[i][0] < best)) {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int HardestWorker(int n, int[][] logs)\n{\n    int best = logs[0][0], bestTime = logs[0][1];\n    for (int i = 1; i < logs.Length; i++)\n    {\n        int span = logs[i][1] - logs[i - 1][1];\n        if (span > bestTime || (span == bestTime && logs[i][0] < best))\n        {\n            best = logs[i][0];\n            bestTime = span;\n        }\n    }\n    return best;\n}`,
        go: `func hardestWorker(n int, logs [][]int) int {\n\tbest, bestTime := logs[0][0], logs[0][1]\n\tfor i := 1; i < len(logs); i++ {\n\t\tspan := logs[i][1] - logs[i-1][1]\n\t\tif span > bestTime || (span == bestTime && logs[i][0] < best) {\n\t\t\tbest, bestTime = logs[i][0], span\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun hardestWorker(n: Int, logs: Array<IntArray>): Int {\n    var best = logs[0][0]\n    var bestTime = logs[0][1]\n    for (i in 1 until logs.size) {\n        val span = logs[i][1] - logs[i - 1][1]\n        if (span > bestTime || (span == bestTime && logs[i][0] < best)) {\n            best = logs[i][0]\n            bestTime = span\n        }\n    }\n    return best\n}`,
        swift: `func hardestWorker(_ n: Int, _ logs: [[Int]]) -> Int {\n    var best = logs[0][0]\n    var bestTime = logs[0][1]\n    for i in 1..<max(logs.count, 1) where i < logs.count {\n        let span = logs[i][1] - logs[i - 1][1]\n        if span > bestTime || (span == bestTime && logs[i][0] < best) {\n            best = logs[i][0]\n            bestTime = span\n        }\n    }\n    return best\n}`,
        rust: `fn hardestWorker(n: i32, logs: Vec<Vec<i32>>) -> i32 {\n    let _ = n;\n    let mut best = logs[0][0];\n    let mut best_time = logs[0][1];\n    for i in 1..logs.len() {\n        let span = logs[i][1] - logs[i - 1][1];\n        if span > best_time || (span == best_time && logs[i][0] < best) {\n            best = logs[i][0];\n            best_time = span;\n        }\n    }\n    best\n}`,
        php: `function hardestWorker($n, $logs) {\n    $best = $logs[0][0];\n    $bestTime = $logs[0][1];\n    for ($i = 1; $i < count($logs); $i++) {\n        $span = $logs[$i][1] - $logs[$i - 1][1];\n        if ($span > $bestTime || ($span === $bestTime && $logs[$i][0] < $best)) {\n            $best = $logs[$i][0];\n            $bestTime = $span;\n        }\n    }\n    return $best;\n}`,
        ruby: `def hardestWorker(n, logs)\n  best = logs[0][0]\n  best_time = logs[0][1]\n  (1...logs.length).each do |i|\n    span = logs[i][1] - logs[i - 1][1]\n    if span > best_time || (span == best_time && logs[i][0] < best)\n      best = logs[i][0]\n      best_time = span\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Delete Greatest Value in Each Row (LC 2500) ─────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const rows = grid.map((r) => r.slice().sort((a, b) => a - b));
      const m = rows.length, n = rows[0].length;
      let total = 0;
      for (let col = 0; col < n; col++) {
        let best = 0;
        for (let i = 0; i < m; i++) if (rows[i][col] > best) best = rows[i][col];
        total += best;
      }
      return total;
    };
    return {
      slug: "delete-greatest-value-in-each-row",
      title: "Delete Greatest Value in Each Row",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Sorting", "Simulation", "Amazon", "Google", "Accenture"],
      signature: { funcName: "deleteGreatestValue", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Repeat until the grid is empty:\n\n- delete the **greatest** value from **each** row (on a tie within a row, delete any one of them);\n- add the **largest** of the deleted values to your answer.\n\nReturn the final answer.",
        [
          { in: "grid = [[1,2,4],[3,3,1]]", out: "8", note: "Rounds delete `{4,3}`, `{2,3}` and `{1,1}`, adding 4 + 3 + 1." },
          { in: "grid = [[10]]", out: "10" },
          { in: "grid = [[1,2],[3,4]]", out: "7", note: "Delete `{2,4}` for 4, then `{1,3}` for 3." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "1 <= grid[i][j] <= 100"]),
      hints: [
        "In round `k`, each row gives up its `k`-th largest value.",
        "So sorting every row turns the simulation into a column scan.",
        "Sum the column maxima of the sorted grid.",
      ],
      editorial: explain({
        idea: "Sort every row. Round `k` then deletes exactly the `k`-th largest of each row — that is, one column of the sorted grid — so the answer is the sum of the column maxima.",
        steps: [
          "Sort each row ascending.",
          "For each column, take the maximum down the column.",
          "Sum those maxima.",
        ],
        why: "Sorting is what removes the simulation: rounds proceed in lockstep and a row always yields its next-largest remaining value, so which values meet in a round is fixed in advance by rank. Direction does not matter — summing column maxima of the ascending sort visits the same multiset of rounds as descending, just in the other order.",
        time: "O(m · n log n)",
        space: "O(m · n)",
        pitfalls: [
          "Each row loses **one** value per round, not just the global maximum.",
          "Ties inside a row are irrelevant — the values are equal.",
          "The answer accumulates one value per round, which is `n` in total.",
        ],
      }),
      examples: [
        { input: "[[1,2,4],[3,3,1]]", expectedOutput: "8" },
        { input: "[[10]]", expectedOutput: "10" },
        { input: "[[1,2],[3,4]]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6), n = ri(rng, 1, 6);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => ri(rng, 1, 50)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef deleteGreatestValue(grid: List[List[int]]) -> int:\n    rows = [sorted(r) for r in grid]\n    return sum(max(col) for col in zip(*rows))`,
        javascript: `var deleteGreatestValue = function(grid) {\n    var rows = [];\n    for (var i = 0; i < grid.length; i++) {\n        var r = grid[i].slice();\n        r.sort(function(a, b) { return a - b; });\n        rows.push(r);\n    }\n    var m = rows.length, n = rows[0].length, total = 0;\n    for (var col = 0; col < n; col++) {\n        var best = 0;\n        for (i = 0; i < m; i++) if (rows[i][col] > best) best = rows[i][col];\n        total += best;\n    }\n    return total;\n};`,
        typescript: `function deleteGreatestValue(grid: number[][]): number {\n    var rows: number[][] = [];\n    for (var i = 0; i < grid.length; i++) {\n        var r = grid[i].slice();\n        r.sort(function(a: number, b: number) { return a - b; });\n        rows.push(r);\n    }\n    var m = rows.length, n = rows[0].length, total = 0;\n    for (var col = 0; col < n; col++) {\n        var best = 0;\n        for (i = 0; i < m; i++) if (rows[i][col] > best) best = rows[i][col];\n        total += best;\n    }\n    return total;\n}`,
        java: `public static int deleteGreatestValue(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    int[][] rows = new int[m][];\n    for (int i = 0; i < m; i++) {\n        rows[i] = grid[i].clone();\n        Arrays.sort(rows[i]);\n    }\n    int total = 0;\n    for (int col = 0; col < n; col++) {\n        int best = 0;\n        for (int i = 0; i < m; i++) best = Math.max(best, rows[i][col]);\n        total += best;\n    }\n    return total;\n}`,
        cpp: `int deleteGreatestValue(vector<vector<int>>& grid) {\n    vector<vector<int>> rows = grid;\n    for (auto& r : rows) sort(r.begin(), r.end());\n    int m = (int) rows.size(), n = (int) rows[0].size();\n    int total = 0;\n    for (int col = 0; col < n; col++) {\n        int best = 0;\n        for (int i = 0; i < m; i++) best = max(best, rows[i][col]);\n        total += best;\n    }\n    return total;\n}`,
        c: `static int dgvCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint deleteGreatestValue(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int* rows = (int*) malloc((size_t) m * (size_t) n * sizeof(int));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) rows[i * n + j] = grid[i][j];\n        qsort(rows + i * n, (size_t) n, sizeof(int), dgvCmp);\n    }\n    int total = 0;\n    for (int col = 0; col < n; col++) {\n        int best = 0;\n        for (int i = 0; i < m; i++) {\n            if (rows[i * n + col] > best) best = rows[i * n + col];\n        }\n        total += best;\n    }\n    free(rows);\n    return total;\n}`,
        csharp: `public static int DeleteGreatestValue(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    var rows = new int[m][];\n    for (int i = 0; i < m; i++)\n    {\n        rows[i] = (int[]) grid[i].Clone();\n        Array.Sort(rows[i]);\n    }\n    int total = 0;\n    for (int col = 0; col < n; col++)\n    {\n        int best = 0;\n        for (int i = 0; i < m; i++) best = Math.Max(best, rows[i][col]);\n        total += best;\n    }\n    return total;\n}`,
        go: `func deleteGreatestValue(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\trows := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\trows[i] = make([]int, n)\n\t\tcopy(rows[i], grid[i])\n\t\tsort.Ints(rows[i])\n\t}\n\ttotal := 0\n\tfor col := 0; col < n; col++ {\n\t\tbest := 0\n\t\tfor i := 0; i < m; i++ {\n\t\t\tif rows[i][col] > best {\n\t\t\t\tbest = rows[i][col]\n\t\t\t}\n\t\t}\n\t\ttotal += best\n\t}\n\treturn total\n}`,
        kotlin: `fun deleteGreatestValue(grid: Array<IntArray>): Int {\n    val rows = grid.map { it.sortedArray() }\n    val m = rows.size\n    val n = rows[0].size\n    var total = 0\n    for (col in 0 until n) {\n        var best = 0\n        for (i in 0 until m) best = maxOf(best, rows[i][col])\n        total += best\n    }\n    return total\n}`,
        swift: `func deleteGreatestValue(_ grid: [[Int]]) -> Int {\n    let rows = grid.map { $0.sorted() }\n    let m = rows.count\n    let n = rows[0].count\n    var total = 0\n    for col in 0..<n {\n        var best = 0\n        for i in 0..<m { best = max(best, rows[i][col]) }\n        total += best\n    }\n    return total\n}`,
        rust: `fn deleteGreatestValue(grid: Vec<Vec<i32>>) -> i32 {\n    let rows: Vec<Vec<i32>> = grid\n        .iter()\n        .map(|r| {\n            let mut v = r.clone();\n            v.sort();\n            v\n        })\n        .collect();\n    let m = rows.len();\n    let n = rows[0].len();\n    let mut total = 0;\n    for col in 0..n {\n        let mut best = 0;\n        for i in 0..m {\n            if rows[i][col] > best {\n                best = rows[i][col];\n            }\n        }\n        total += best;\n    }\n    total\n}`,
        php: `function deleteGreatestValue($grid) {\n    $rows = [];\n    foreach ($grid as $r) {\n        $copy = $r;\n        sort($copy);\n        $rows[] = $copy;\n    }\n    $m = count($rows);\n    $n = count($rows[0]);\n    $total = 0;\n    for ($col = 0; $col < $n; $col++) {\n        $best = 0;\n        for ($i = 0; $i < $m; $i++) if ($rows[$i][$col] > $best) $best = $rows[$i][$col];\n        $total += $best;\n    }\n    return $total;\n}`,
        ruby: `def deleteGreatestValue(grid)\n  rows = grid.map(&:sort)\n  (0...rows[0].length).sum { |col| rows.map { |r| r[col] }.max }\nend`,
      },
    };
  })(),

  // ── Form Smallest Number From Two Digit Arrays (LC 2605) ────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      let shared = 10;
      for (let i = 0; i < nums1.length; i++) {
        for (let j = 0; j < nums2.length; j++) {
          if (nums1[i] === nums2[j] && nums1[i] < shared) shared = nums1[i];
        }
      }
      if (shared < 10) return shared;
      let a = 10, b = 10;
      for (let i = 0; i < nums1.length; i++) if (nums1[i] < a) a = nums1[i];
      for (let j = 0; j < nums2.length; j++) if (nums2[j] < b) b = nums2[j];
      const first = a * 10 + b;
      const second = b * 10 + a;
      return first < second ? first : second;
    };
    return {
      slug: "form-smallest-number-from-two-digit-arrays",
      title: "Form Smallest Number From Two Digit Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Amazon", "Google", "Capgemini"],
      signature: { funcName: "minNumber", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums1` and `nums2` each hold **distinct** digits from 1 to 9.\n\nReturn the **smallest** positive integer that contains at least one digit from `nums1` and at least one digit from `nums2`.",
        [
          { in: "nums1 = [4,1,3], nums2 = [5,7]", out: "15", note: "No shared digit, so pair the two smallest: `15` beats `51`." },
          { in: "nums1 = [3,5,2,6], nums2 = [3,1,7]", out: "3", note: "`3` is in both arrays, so one digit suffices." },
          { in: "nums1 = [9], nums2 = [2]", out: "29" },
        ],
        ["1 <= nums1.length, nums2.length <= 9", "1 <= nums1[i], nums2[i] <= 9", "All digits in each array are unique."]),
      hints: [
        "If any digit appears in both arrays, a one-digit answer is possible — take the smallest such digit.",
        "Otherwise the answer has exactly two digits, one from each array.",
        "Use the smallest digit of each and try both orders.",
      ],
      editorial: explain({
        idea: "A shared digit gives a one-digit answer, and one digit always beats two — so take the smallest common digit if there is one. Otherwise pick the smallest digit from each array and return the smaller of the two arrangements.",
        steps: [
          "Find the smallest digit present in both arrays; return it if one exists.",
          "Otherwise take `a = min(nums1)` and `b = min(nums2)`.",
          "Return `min(10a + b, 10b + a)`.",
        ],
        why: "Fewer digits always wins for positive integers, which is why the shared-digit case is checked first and needs no comparison against any two-digit candidate. In the two-digit case, using anything but the minimum of each array can only make one of the two positions larger, so the smallest digits are forced and only their order is a real choice.",
        time: "O(n · m), or O(n + m) with a set",
        space: "O(1)",
        pitfalls: [
          "A shared digit beats every two-digit answer, however small the digits.",
          "Both orders must be tried: `min(nums1)` is not always the leading digit.",
          "The digits are 1–9, so there is no leading-zero case to worry about.",
        ],
      }),
      examples: [
        { input: "[4,1,3]\n[5,7]", expectedOutput: "15" },
        { input: "[3,5,2,6]\n[3,1,7]", expectedOutput: "3" },
        { input: "[9]\n[2]", expectedOutput: "29" },
      ],
      gen: (rng: Rng) => {
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const nums1 = shuffle(rng, digits.slice()).slice(0, ri(rng, 1, 4));
        const nums2 = shuffle(rng, digits.slice()).slice(0, ri(rng, 1, 4));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minNumber(nums1: List[int], nums2: List[int]) -> int:\n    shared = set(nums1) & set(nums2)\n    if shared:\n        return min(shared)\n    a, b = min(nums1), min(nums2)\n    return min(a * 10 + b, b * 10 + a)`,
        javascript: `var minNumber = function(nums1, nums2) {\n    var shared = 10, i, j;\n    for (i = 0; i < nums1.length; i++) {\n        for (j = 0; j < nums2.length; j++) {\n            if (nums1[i] === nums2[j] && nums1[i] < shared) shared = nums1[i];\n        }\n    }\n    if (shared < 10) return shared;\n    var a = 10, b = 10;\n    for (i = 0; i < nums1.length; i++) if (nums1[i] < a) a = nums1[i];\n    for (j = 0; j < nums2.length; j++) if (nums2[j] < b) b = nums2[j];\n    var first = a * 10 + b, second = b * 10 + a;\n    return first < second ? first : second;\n};`,
        typescript: `function minNumber(nums1: number[], nums2: number[]): number {\n    var shared = 10, i: number, j: number;\n    for (i = 0; i < nums1.length; i++) {\n        for (j = 0; j < nums2.length; j++) {\n            if (nums1[i] === nums2[j] && nums1[i] < shared) shared = nums1[i];\n        }\n    }\n    if (shared < 10) return shared;\n    var a = 10, b = 10;\n    for (i = 0; i < nums1.length; i++) if (nums1[i] < a) a = nums1[i];\n    for (j = 0; j < nums2.length; j++) if (nums2[j] < b) b = nums2[j];\n    var first = a * 10 + b, second = b * 10 + a;\n    return first < second ? first : second;\n}`,
        java: `public static int minNumber(int[] nums1, int[] nums2) {\n    int shared = 10;\n    for (int x : nums1) {\n        for (int y : nums2) {\n            if (x == y && x < shared) shared = x;\n        }\n    }\n    if (shared < 10) return shared;\n    int a = 10, b = 10;\n    for (int x : nums1) a = Math.min(a, x);\n    for (int y : nums2) b = Math.min(b, y);\n    return Math.min(a * 10 + b, b * 10 + a);\n}`,
        cpp: `int minNumber(vector<int>& nums1, vector<int>& nums2) {\n    int shared = 10;\n    for (int x : nums1) {\n        for (int y : nums2) {\n            if (x == y && x < shared) shared = x;\n        }\n    }\n    if (shared < 10) return shared;\n    int a = 10, b = 10;\n    for (int x : nums1) a = min(a, x);\n    for (int y : nums2) b = min(b, y);\n    return min(a * 10 + b, b * 10 + a);\n}`,
        c: `int minNumber(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int shared = 10;\n    for (int i = 0; i < nums1Size; i++) {\n        for (int j = 0; j < nums2Size; j++) {\n            if (nums1[i] == nums2[j] && nums1[i] < shared) shared = nums1[i];\n        }\n    }\n    if (shared < 10) return shared;\n    int a = 10, b = 10;\n    for (int i = 0; i < nums1Size; i++) if (nums1[i] < a) a = nums1[i];\n    for (int j = 0; j < nums2Size; j++) if (nums2[j] < b) b = nums2[j];\n    int first = a * 10 + b;\n    int second = b * 10 + a;\n    return first < second ? first : second;\n}`,
        csharp: `public static int MinNumber(int[] nums1, int[] nums2)\n{\n    int shared = 10;\n    foreach (var x in nums1)\n    {\n        foreach (var y in nums2)\n        {\n            if (x == y && x < shared) shared = x;\n        }\n    }\n    if (shared < 10) return shared;\n    int a = 10, b = 10;\n    foreach (var x in nums1) a = Math.Min(a, x);\n    foreach (var y in nums2) b = Math.Min(b, y);\n    return Math.Min(a * 10 + b, b * 10 + a);\n}`,
        go: `func minNumber(nums1 []int, nums2 []int) int {\n\tshared := 10\n\tfor _, x := range nums1 {\n\t\tfor _, y := range nums2 {\n\t\t\tif x == y && x < shared {\n\t\t\t\tshared = x\n\t\t\t}\n\t\t}\n\t}\n\tif shared < 10 {\n\t\treturn shared\n\t}\n\ta, b := 10, 10\n\tfor _, x := range nums1 {\n\t\tif x < a {\n\t\t\ta = x\n\t\t}\n\t}\n\tfor _, y := range nums2 {\n\t\tif y < b {\n\t\t\tb = y\n\t\t}\n\t}\n\tfirst, second := a*10+b, b*10+a\n\tif first < second {\n\t\treturn first\n\t}\n\treturn second\n}`,
        kotlin: `fun minNumber(nums1: IntArray, nums2: IntArray): Int {\n    var shared = 10\n    for (x in nums1) {\n        for (y in nums2) {\n            if (x == y && x < shared) shared = x\n        }\n    }\n    if (shared < 10) return shared\n    val a = nums1.min()\n    val b = nums2.min()\n    return minOf(a * 10 + b, b * 10 + a)\n}`,
        swift: `func minNumber(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    var shared = 10\n    for x in nums1 {\n        for y in nums2 where x == y && x < shared {\n            shared = x\n        }\n    }\n    if shared < 10 { return shared }\n    let a = nums1.min()!\n    let b = nums2.min()!\n    return min(a * 10 + b, b * 10 + a)\n}`,
        rust: `fn minNumber(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let mut shared = 10;\n    for &x in nums1.iter() {\n        for &y in nums2.iter() {\n            if x == y && x < shared {\n                shared = x;\n            }\n        }\n    }\n    if shared < 10 {\n        return shared;\n    }\n    let a = *nums1.iter().min().unwrap();\n    let b = *nums2.iter().min().unwrap();\n    std::cmp::min(a * 10 + b, b * 10 + a)\n}`,
        php: `function minNumber($nums1, $nums2) {\n    $shared = 10;\n    foreach ($nums1 as $x) {\n        foreach ($nums2 as $y) {\n            if ($x === $y && $x < $shared) $shared = $x;\n        }\n    }\n    if ($shared < 10) return $shared;\n    $a = min($nums1);\n    $b = min($nums2);\n    return min($a * 10 + $b, $b * 10 + $a);\n}`,
        ruby: `def minNumber(nums1, nums2)\n  shared = nums1 & nums2\n  return shared.min unless shared.empty?\n  a = nums1.min\n  b = nums2.min\n  [a * 10 + b, b * 10 + a].min\nend`,
      },
    };
  })(),

  // ── Find the Losers of the Circular Game (LC 2682) ──────────────
  (() => {
    const ref = (n: number, k: number) => {
      const seen = new Array(n + 1).fill(false);
      let pos = 1, turn = 1;
      while (!seen[pos]) {
        seen[pos] = true;
        pos = ((pos - 1 + turn * k) % n) + 1;
        turn++;
      }
      const losers: number[] = [];
      for (let i = 1; i <= n; i++) if (!seen[i]) losers.push(i);
      return losers;
    };
    return {
      slug: "find-the-losers-of-the-circular-game",
      title: "Find the Losers of the Circular Game",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Simulation", "Amazon", "Google", "Zoho"],
      signature: { funcName: "circularGameLosers", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "`n` friends sit in a circle, numbered 1 to `n` clockwise. Friend 1 starts with a ball and passes it `k` steps clockwise. The receiver passes it `2k` steps, the next `3k` steps, and so on.\n\nThe game ends when someone receives the ball for the **second** time. Return the friends who **never** received it, in increasing order.",
        [
          { in: "n = 5, k = 2", out: "[4,5]", note: "The ball visits 1 → 3 → 2 → 3, so 4 and 5 never touch it." },
          { in: "n = 4, k = 4", out: "[2,3,4]", note: "Every pass returns to friend 1." },
          { in: "n = 2, k = 1", out: "[]", note: "Both friends receive the ball." },
        ],
        ["1 <= k <= n <= 50"]),
      hints: [
        "Simulate: on turn `t` the ball moves `t · k` steps clockwise.",
        "Positions are 1-based, so convert down, take the modulo, and convert back up.",
        "Stop the moment a position repeats, then list the unvisited ones.",
      ],
      editorial: explain({
        idea: "Direct simulation. Mark each position as it receives the ball; on turn `t`, move `t · k` steps clockwise with modular arithmetic. The first repeat ends the game, and the unmarked positions are the losers.",
        steps: [
          "Track a `seen` flag per friend, starting at position 1 and turn 1.",
          "While the current position is unseen, mark it and move to `((pos - 1 + turn · k) mod n) + 1`, incrementing the turn.",
          "Collect the unmarked friends in increasing order.",
        ],
        why: "The `-1 … +1` dance is what makes 1-based seating work with a 0-based modulo — doing the modulo directly on 1-based positions lands on 0, which is nobody. The game is guaranteed to end because there are only `n` positions, so a repeat must occur within `n` passes.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The step size grows each turn: it is `t · k`, not a constant `k`.",
          "Positions are 1-based; a naive `pos % n` produces 0.",
          "The result may legitimately be empty.",
        ],
      }),
      examples: [
        { input: "5\n2", expectedOutput: "[4,5]" },
        { input: "4\n4", expectedOutput: "[2,3,4]" },
        { input: "2\n1", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${k}`, expectedOutput: fmtIntArr(ref(n, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef circularGameLosers(n: int, k: int) -> List[int]:\n    seen = [False] * (n + 1)\n    pos, turn = 1, 1\n    while not seen[pos]:\n        seen[pos] = True\n        pos = (pos - 1 + turn * k) % n + 1\n        turn += 1\n    return [i for i in range(1, n + 1) if not seen[i]]`,
        javascript: `var circularGameLosers = function(n, k) {\n    var seen = [], i;\n    for (i = 0; i <= n; i++) seen.push(false);\n    var pos = 1, turn = 1;\n    while (!seen[pos]) {\n        seen[pos] = true;\n        pos = ((pos - 1 + turn * k) % n) + 1;\n        turn++;\n    }\n    var losers = [];\n    for (i = 1; i <= n; i++) if (!seen[i]) losers.push(i);\n    return losers;\n};`,
        typescript: `function circularGameLosers(n: number, k: number): number[] {\n    var seen: boolean[] = [], i: number;\n    for (i = 0; i <= n; i++) seen.push(false);\n    var pos = 1, turn = 1;\n    while (!seen[pos]) {\n        seen[pos] = true;\n        pos = ((pos - 1 + turn * k) % n) + 1;\n        turn++;\n    }\n    var losers: number[] = [];\n    for (i = 1; i <= n; i++) if (!seen[i]) losers.push(i);\n    return losers;\n}`,
        java: `public static int[] circularGameLosers(int n, int k) {\n    boolean[] seen = new boolean[n + 1];\n    int pos = 1, turn = 1;\n    while (!seen[pos]) {\n        seen[pos] = true;\n        pos = (pos - 1 + turn * k) % n + 1;\n        turn++;\n    }\n    List<Integer> losers = new ArrayList<>();\n    for (int i = 1; i <= n; i++) {\n        if (!seen[i]) losers.add(i);\n    }\n    int[] out = new int[losers.size()];\n    for (int i = 0; i < out.length; i++) out[i] = losers.get(i);\n    return out;\n}`,
        cpp: `vector<int> circularGameLosers(int n, int k) {\n    vector<bool> seen(n + 1, false);\n    int pos = 1, turn = 1;\n    while (!seen[pos]) {\n        seen[pos] = true;\n        pos = (pos - 1 + turn * k) % n + 1;\n        turn++;\n    }\n    vector<int> losers;\n    for (int i = 1; i <= n; i++) {\n        if (!seen[i]) losers.push_back(i);\n    }\n    return losers;\n}`,
        c: `int* circularGameLosers(int n, int k, int* returnSize) {\n    int* seen = (int*) calloc((size_t) (n + 1), sizeof(int));\n    int pos = 1, turn = 1;\n    while (!seen[pos]) {\n        seen[pos] = 1;\n        pos = (pos - 1 + turn * k) % n + 1;\n        turn++;\n    }\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    int count = 0;\n    for (int i = 1; i <= n; i++) {\n        if (!seen[i]) out[count++] = i;\n    }\n    free(seen);\n    *returnSize = count;\n    return out;\n}`,
        csharp: `public static int[] CircularGameLosers(int n, int k)\n{\n    var seen = new bool[n + 1];\n    int pos = 1, turn = 1;\n    while (!seen[pos])\n    {\n        seen[pos] = true;\n        pos = (pos - 1 + turn * k) % n + 1;\n        turn++;\n    }\n    var losers = new List<int>();\n    for (int i = 1; i <= n; i++)\n    {\n        if (!seen[i]) losers.Add(i);\n    }\n    return losers.ToArray();\n}`,
        go: `func circularGameLosers(n int, k int) []int {\n\tseen := make([]bool, n+1)\n\tpos, turn := 1, 1\n\tfor !seen[pos] {\n\t\tseen[pos] = true\n\t\tpos = (pos-1+turn*k)%n + 1\n\t\tturn++\n\t}\n\tlosers := []int{}\n\tfor i := 1; i <= n; i++ {\n\t\tif !seen[i] {\n\t\t\tlosers = append(losers, i)\n\t\t}\n\t}\n\treturn losers\n}`,
        kotlin: `fun circularGameLosers(n: Int, k: Int): IntArray {\n    val seen = BooleanArray(n + 1)\n    var pos = 1\n    var turn = 1\n    while (!seen[pos]) {\n        seen[pos] = true\n        pos = (pos - 1 + turn * k) % n + 1\n        turn++\n    }\n    return (1..n).filter { !seen[it] }.toIntArray()\n}`,
        swift: `func circularGameLosers(_ n: Int, _ k: Int) -> [Int] {\n    var seen = [Bool](repeating: false, count: n + 1)\n    var pos = 1\n    var turn = 1\n    while !seen[pos] {\n        seen[pos] = true\n        pos = (pos - 1 + turn * k) % n + 1\n        turn += 1\n    }\n    return (1...n).filter { !seen[$0] }\n}`,
        rust: `fn circularGameLosers(n: i32, k: i32) -> Vec<i32> {\n    let size = n as usize;\n    let mut seen = vec![false; size + 1];\n    let mut pos = 1i32;\n    let mut turn = 1i32;\n    while !seen[pos as usize] {\n        seen[pos as usize] = true;\n        pos = (pos - 1 + turn * k) % n + 1;\n        turn += 1;\n    }\n    (1..=n).filter(|&i| !seen[i as usize]).collect()\n}`,
        php: `function circularGameLosers($n, $k) {\n    $seen = array_fill(0, $n + 1, false);\n    $pos = 1;\n    $turn = 1;\n    while (!$seen[$pos]) {\n        $seen[$pos] = true;\n        $pos = ($pos - 1 + $turn * $k) % $n + 1;\n        $turn++;\n    }\n    $losers = [];\n    for ($i = 1; $i <= $n; $i++) {\n        if (!$seen[$i]) $losers[] = $i;\n    }\n    return $losers;\n}`,
        ruby: `def circularGameLosers(n, k)\n  seen = Array.new(n + 1, false)\n  pos = 1\n  turn = 1\n  until seen[pos]\n    seen[pos] = true\n    pos = (pos - 1 + turn * k) % n + 1\n    turn += 1\n  end\n  (1..n).reject { |i| seen[i] }\nend`,
      },
    };
  })(),

  // ── Type of Triangle (LC 3024) ──────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = nums.slice().sort((a, b) => a - b);
      if (s[0] + s[1] <= s[2]) return "none";
      if (s[0] === s[1] && s[1] === s[2]) return "equilateral";
      if (s[0] === s[1] || s[1] === s[2]) return "isosceles";
      return "scalene";
    };
    return {
      slug: "type-of-triangle",
      title: "Type of Triangle",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Sorting", "Amazon", "Google", "Infosys"],
      signature: { funcName: "triangleType", params: [{ name: "nums", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "`nums` holds the three side lengths of a candidate triangle. Return:\n\n- `\"equilateral\"` if all three sides are equal;\n- `\"isosceles\"` if exactly two are equal;\n- `\"scalene\"` if all three differ;\n- `\"none\"` if the sides cannot form a triangle at all.",
        [
          { in: "nums = [3,3,3]", out: "equilateral" },
          { in: "nums = [3,4,5]", out: "scalene" },
          { in: "nums = [1,1,3]", out: "none", note: "1 + 1 is not greater than 3." },
        ],
        ["nums.length == 3", "1 <= nums[i] <= 100"]),
      hints: [
        "Check validity **first**: the two shorter sides must sum to strictly more than the longest.",
        "Sorting makes that a single comparison.",
        "Then count the equal sides.",
      ],
      editorial: explain({
        idea: "Sort the three sides. The triangle inequality then reduces to `a + b > c` for the sorted sides; if it fails the answer is `\"none\"`. Otherwise classify by how many sides are equal.",
        steps: [
          "Sort the three values ascending.",
          "Return `\"none\"` if `s[0] + s[1] <= s[2]`.",
          "Return `\"equilateral\"` if all three match, `\"isosceles\"` if one adjacent pair matches, else `\"scalene\"`.",
        ],
        why: "Sorting collapses three triangle-inequality checks into one — the other two hold automatically once the longest side is identified. And the validity test must come first: `[1,1,3]` has two equal sides but is not a triangle, so classifying before checking would wrongly call it isosceles.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "The inequality is strict: `1 + 2 = 3` is degenerate and counts as `\"none\"`.",
          "Validity is checked before the equal-sides classification.",
          "After sorting, equality only needs to be tested between adjacent sides.",
        ],
      }),
      examples: [
        { input: "[3,3,3]", expectedOutput: "equilateral" },
        { input: "[3,4,5]", expectedOutput: "scalene" },
        { input: "[1,1,3]", expectedOutput: "none" },
      ],
      gen: (rng: Rng) => {
        const nums = [ri(rng, 1, 12), ri(rng, 1, 12), ri(rng, 1, 12)];
        return { input: fmtIntArr(nums), expectedOutput: ref(nums) };
      },
      solutions: {
        python: `from typing import List\n\ndef triangleType(nums: List[int]) -> str:\n    s = sorted(nums)\n    if s[0] + s[1] <= s[2]:\n        return "none"\n    if s[0] == s[1] == s[2]:\n        return "equilateral"\n    if s[0] == s[1] or s[1] == s[2]:\n        return "isosceles"\n    return "scalene"`,
        javascript: `var triangleType = function(nums) {\n    var s = nums.slice();\n    s.sort(function(a, b) { return a - b; });\n    if (s[0] + s[1] <= s[2]) return "none";\n    if (s[0] === s[1] && s[1] === s[2]) return "equilateral";\n    if (s[0] === s[1] || s[1] === s[2]) return "isosceles";\n    return "scalene";\n};`,
        typescript: `function triangleType(nums: number[]): string {\n    var s = nums.slice();\n    s.sort(function(a: number, b: number) { return a - b; });\n    if (s[0] + s[1] <= s[2]) return "none";\n    if (s[0] === s[1] && s[1] === s[2]) return "equilateral";\n    if (s[0] === s[1] || s[1] === s[2]) return "isosceles";\n    return "scalene";\n}`,
        java: `public static String triangleType(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    if (s[0] + s[1] <= s[2]) return "none";\n    if (s[0] == s[1] && s[1] == s[2]) return "equilateral";\n    if (s[0] == s[1] || s[1] == s[2]) return "isosceles";\n    return "scalene";\n}`,
        cpp: `string triangleType(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    if (s[0] + s[1] <= s[2]) return "none";\n    if (s[0] == s[1] && s[1] == s[2]) return "equilateral";\n    if (s[0] == s[1] || s[1] == s[2]) return "isosceles";\n    return "scalene";\n}`,
        c: `static int ttCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nchar* triangleType(int* nums, int numsSize) {\n    (void) numsSize;\n    int s[3];\n    for (int i = 0; i < 3; i++) s[i] = nums[i];\n    qsort(s, 3, sizeof(int), ttCmp);\n    const char* answer;\n    if (s[0] + s[1] <= s[2]) answer = "none";\n    else if (s[0] == s[1] && s[1] == s[2]) answer = "equilateral";\n    else if (s[0] == s[1] || s[1] == s[2]) answer = "isosceles";\n    else answer = "scalene";\n    char* out = (char*) malloc(strlen(answer) + 1);\n    strcpy(out, answer);\n    return out;\n}`,
        csharp: `public static string TriangleType(int[] nums)\n{\n    var s = (int[]) nums.Clone();\n    Array.Sort(s);\n    if (s[0] + s[1] <= s[2]) return "none";\n    if (s[0] == s[1] && s[1] == s[2]) return "equilateral";\n    if (s[0] == s[1] || s[1] == s[2]) return "isosceles";\n    return "scalene";\n}`,
        go: `func triangleType(nums []int) string {\n\ts := make([]int, len(nums))\n\tcopy(s, nums)\n\tsort.Ints(s)\n\tif s[0]+s[1] <= s[2] {\n\t\treturn "none"\n\t}\n\tif s[0] == s[1] && s[1] == s[2] {\n\t\treturn "equilateral"\n\t}\n\tif s[0] == s[1] || s[1] == s[2] {\n\t\treturn "isosceles"\n\t}\n\treturn "scalene"\n}`,
        kotlin: `fun triangleType(nums: IntArray): String {\n    val s = nums.sortedArray()\n    if (s[0] + s[1] <= s[2]) return "none"\n    if (s[0] == s[1] && s[1] == s[2]) return "equilateral"\n    if (s[0] == s[1] || s[1] == s[2]) return "isosceles"\n    return "scalene"\n}`,
        swift: `func triangleType(_ nums: [Int]) -> String {\n    let s = nums.sorted()\n    if s[0] + s[1] <= s[2] { return "none" }\n    if s[0] == s[1] && s[1] == s[2] { return "equilateral" }\n    if s[0] == s[1] || s[1] == s[2] { return "isosceles" }\n    return "scalene"\n}`,
        rust: `fn triangleType(nums: Vec<i32>) -> String {\n    let mut s = nums.clone();\n    s.sort();\n    if s[0] + s[1] <= s[2] {\n        return "none".to_string();\n    }\n    if s[0] == s[1] && s[1] == s[2] {\n        return "equilateral".to_string();\n    }\n    if s[0] == s[1] || s[1] == s[2] {\n        return "isosceles".to_string();\n    }\n    "scalene".to_string()\n}`,
        php: `function triangleType($nums) {\n    $s = $nums;\n    sort($s);\n    if ($s[0] + $s[1] <= $s[2]) return "none";\n    if ($s[0] === $s[1] && $s[1] === $s[2]) return "equilateral";\n    if ($s[0] === $s[1] || $s[1] === $s[2]) return "isosceles";\n    return "scalene";\n}`,
        ruby: `def triangleType(nums)\n  s = nums.sort\n  return "none" if s[0] + s[1] <= s[2]\n  return "equilateral" if s[0] == s[1] && s[1] == s[2]\n  return "isosceles" if s[0] == s[1] || s[1] == s[2]\n  "scalene"\nend`,
      },
    };
  })(),

  // ── Special Array I (LC 3151) ───────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      for (let i = 1; i < nums.length; i++) {
        if ((nums[i] % 2) === (nums[i - 1] % 2)) return false;
      }
      return true;
    };
    return {
      slug: "special-array-i",
      title: "Special Array I",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "isArraySpecial", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "An array is **special** when every pair of **adjacent** elements has **different parity** — one odd and one even.\n\nReturn whether `nums` is special. An array of one element is special.",
        [
          { in: "nums = [1]", out: "true", note: "A single element has no adjacent pair." },
          { in: "nums = [2,1,4]", out: "true", note: "even, odd, even." },
          { in: "nums = [4,3,1,6]", out: "false", note: "3 and 1 are both odd." },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "Parity is just `value % 2`.",
        "Compare each element's parity with the previous one's.",
        "Return false at the first match.",
      ],
      editorial: explain({
        idea: "Walk the array comparing each element's parity with its predecessor's; a single match makes the array non-special.",
        steps: [
          "For each index from 1 onward, compare `nums[i] % 2` with `nums[i-1] % 2`.",
          "Return false on the first equal pair, true otherwise.",
        ],
        why: "Comparing parities rather than the values themselves is the whole point — two different numbers of the same parity still break the rule. Using `(a ^ b) & 1` is the same test written with bit operations, which is what the follow-up version of this problem needs when the queries come in ranges.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The rule is about parity, not about the values differing.",
          "A one-element array is special by definition.",
          "Only adjacent pairs matter, not all pairs.",
        ],
      }),
      examples: [
        { input: "[1]", expectedOutput: "true" },
        { input: "[2,1,4]", expectedOutput: "true" },
        { input: "[4,3,1,6]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums: number[] = [];
        let parity = ri(rng, 0, 1);
        for (let i = 0; i < n; i++) {
          // Alternate most of the time so both answers turn up.
          if (rng() < 0.75) parity = 1 - parity;
          let v = ri(rng, 1, 50);
          if (v % 2 !== parity) v = v === 50 ? 49 : v + 1;
          parity = v % 2;
          nums.push(v);
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef isArraySpecial(nums: List[int]) -> bool:\n    return all(nums[i] % 2 != nums[i - 1] % 2 for i in range(1, len(nums)))`,
        javascript: `var isArraySpecial = function(nums) {\n    for (var i = 1; i < nums.length; i++) {\n        if ((nums[i] % 2) === (nums[i - 1] % 2)) return false;\n    }\n    return true;\n};`,
        typescript: `function isArraySpecial(nums: number[]): boolean {\n    for (var i = 1; i < nums.length; i++) {\n        if ((nums[i] % 2) === (nums[i - 1] % 2)) return false;\n    }\n    return true;\n}`,
        java: `public static boolean isArraySpecial(int[] nums) {\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] % 2 == nums[i - 1] % 2) return false;\n    }\n    return true;\n}`,
        cpp: `bool isArraySpecial(vector<int>& nums) {\n    for (size_t i = 1; i < nums.size(); i++) {\n        if (nums[i] % 2 == nums[i - 1] % 2) return false;\n    }\n    return true;\n}`,
        c: `bool isArraySpecial(int* nums, int numsSize) {\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] % 2 == nums[i - 1] % 2) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool IsArraySpecial(int[] nums)\n{\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] % 2 == nums[i - 1] % 2) return false;\n    }\n    return true;\n}`,
        go: `func isArraySpecial(nums []int) bool {\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i]%2 == nums[i-1]%2 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun isArraySpecial(nums: IntArray): Boolean {\n    for (i in 1 until nums.size) {\n        if (nums[i] % 2 == nums[i - 1] % 2) return false\n    }\n    return true\n}`,
        swift: `func isArraySpecial(_ nums: [Int]) -> Bool {\n    for i in 1..<max(nums.count, 1) where i < nums.count {\n        if nums[i] % 2 == nums[i - 1] % 2 { return false }\n    }\n    return true\n}`,
        rust: `fn isArraySpecial(nums: Vec<i32>) -> bool {\n    for i in 1..nums.len() {\n        if nums[i] % 2 == nums[i - 1] % 2 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function isArraySpecial($nums) {\n    for ($i = 1; $i < count($nums); $i++) {\n        if ($nums[$i] % 2 === $nums[$i - 1] % 2) return false;\n    }\n    return true;\n}`,
        ruby: `def isArraySpecial(nums)\n  (1...nums.length).all? { |i| nums[i] % 2 != nums[i - 1] % 2 }\nend`,
      },
    };
  })(),

  // ── Find the Original Typed String I (LC 3330) ──────────────────
  (() => {
    const ref = (word: string) => {
      let total = 1;
      for (let i = 1; i < word.length; i++) {
        if (word.charAt(i) === word.charAt(i - 1)) total++;
      }
      return total;
    };
    return {
      slug: "find-the-original-typed-string-i",
      title: "Find the Original Typed String I",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "Accenture"],
      signature: { funcName: "possibleStringCount", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A typist may have held **one** key down too long, repeating a single character extra times — but this happened **at most once** in the whole word.\n\nGiven the string `word` that appeared on screen, return the number of strings that could have been intended.",
        [
          { in: 'word = "abbcccc"', out: "5", note: "The word itself, plus `abcccc`, `abbccc`, `abbcc` and `abbc`." },
          { in: 'word = "abcd"', out: "1", note: "Nothing repeats, so nothing was held down." },
          { in: 'word = "aaaa"', out: "4", note: "The original could have been 1, 2, 3 or 4 `a`s." },
        ],
        ["1 <= word.length <= 100", "word consists of lowercase English letters."]),
      hints: [
        "If the long press happened in a run of length `L`, the original had that run at any length from 1 to `L`.",
        "That is `L - 1` shortened possibilities per run, plus the one where nothing was held down.",
        "Summing `L - 1` over every run is the same as counting adjacent equal pairs.",
      ],
      editorial: explain({
        idea: "Exactly one run may have been stretched. A run of length `L` yields `L - 1` shorter originals, and one more possibility covers \"no long press at all\". Summing `L - 1` across the runs is precisely the number of adjacent equal character pairs.",
        steps: [
          "Start the count at 1 — the word as typed.",
          "Add one for each index where the character equals its predecessor.",
        ],
        why: "The \"at most once\" clause is what makes the runs independent rather than multiplicative: you pick one run and one shortened length, so the possibilities **add** rather than multiply. Counting adjacent equal pairs is the same sum written without ever identifying the run boundaries.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adding 1 for the untouched word is easy to forget, and it is always a possibility.",
          "The runs add, not multiply — only one key was held.",
          "A run of length 1 contributes nothing.",
        ],
      }),
      examples: [
        { input: '"abbcccc"', expectedOutput: "5" },
        { input: '"abcd"', expectedOutput: "1" },
        { input: '"aaaa"', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 14);
        let word = "";
        let c = alphabet.charAt(ri(rng, 0, 2));
        for (let i = 0; i < n; i++) {
          if (rng() < 0.4) c = alphabet.charAt(ri(rng, 0, 2));
          word += c;
        }
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def possibleStringCount(word: str) -> int:\n    return 1 + sum(1 for i in range(1, len(word)) if word[i] == word[i - 1])`,
        javascript: `var possibleStringCount = function(word) {\n    var total = 1;\n    for (var i = 1; i < word.length; i++) {\n        if (word.charAt(i) === word.charAt(i - 1)) total++;\n    }\n    return total;\n};`,
        typescript: `function possibleStringCount(word: string): number {\n    var total = 1;\n    for (var i = 1; i < word.length; i++) {\n        if (word.charAt(i) === word.charAt(i - 1)) total++;\n    }\n    return total;\n}`,
        java: `public static int possibleStringCount(String word) {\n    int total = 1;\n    for (int i = 1; i < word.length(); i++) {\n        if (word.charAt(i) == word.charAt(i - 1)) total++;\n    }\n    return total;\n}`,
        cpp: `int possibleStringCount(string word) {\n    int total = 1;\n    for (size_t i = 1; i < word.size(); i++) {\n        if (word[i] == word[i - 1]) total++;\n    }\n    return total;\n}`,
        c: `int possibleStringCount(char* word) {\n    int total = 1;\n    for (int i = 1; word[i] != '\\0'; i++) {\n        if (word[i] == word[i - 1]) total++;\n    }\n    return total;\n}`,
        csharp: `public static int PossibleStringCount(string word)\n{\n    int total = 1;\n    for (int i = 1; i < word.Length; i++)\n    {\n        if (word[i] == word[i - 1]) total++;\n    }\n    return total;\n}`,
        go: `func possibleStringCount(word string) int {\n\ttotal := 1\n\tfor i := 1; i < len(word); i++ {\n\t\tif word[i] == word[i-1] {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun possibleStringCount(word: String): Int {\n    var total = 1\n    for (i in 1 until word.length) {\n        if (word[i] == word[i - 1]) total++\n    }\n    return total\n}`,
        swift: `func possibleStringCount(_ word: String) -> Int {\n    let chars = Array(word)\n    var total = 1\n    for i in 1..<max(chars.count, 1) where i < chars.count {\n        if chars[i] == chars[i - 1] { total += 1 }\n    }\n    return total\n}`,
        rust: `fn possibleStringCount(word: String) -> i32 {\n    let b = word.as_bytes();\n    let mut total = 1;\n    for i in 1..b.len() {\n        if b[i] == b[i - 1] {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function possibleStringCount($word) {\n    $total = 1;\n    for ($i = 1; $i < strlen($word); $i++) {\n        if ($word[$i] === $word[$i - 1]) $total++;\n    }\n    return $total;\n}`,
        ruby: `def possibleStringCount(word)\n  1 + (1...word.length).count { |i| word[i] == word[i - 1] }\nend`,
      },
    };
  })(),

  // ── Longest Subsequence With Limited Sum (LC 2389) ──────────────
  (() => {
    const ref = (nums: number[], queries: number[]) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      const pre = new Array(sorted.length + 1).fill(0);
      for (let i = 0; i < sorted.length; i++) pre[i + 1] = pre[i] + sorted[i];
      return queries.map((q) => {
        let lo = 0, hi = sorted.length;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (pre[mid] <= q) lo = mid; else hi = mid - 1;
        }
        return lo;
      });
    };
    return {
      slug: "longest-subsequence-with-limited-sum",
      title: "Longest Subsequence With Limited Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Prefix Sum", "Amazon", "Google", "Adobe"],
      signature: { funcName: "answerQueries", params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For each value in `queries`, find the **maximum length** of a subsequence of `nums` whose sum is at most that value.\n\nReturn those lengths in order.",
        [
          { in: "nums = [4,5,2,1], queries = [3,10,21]", out: "[2,3,4]", note: "`[2,1]`, `[4,2,1]` and the whole array." },
          { in: "nums = [2,3,4,5], queries = [1]", out: "[0]", note: "Even the smallest element exceeds 1." },
          { in: "nums = [1,1,1], queries = [2,5]", out: "[2,3]" },
        ],
        ["n == nums.length", "m == queries.length", "1 <= n, m <= 1000", "1 <= nums[i], queries[i] <= 10^6"]),
      hints: [
        "Order does not matter for a subsequence's sum, so to fit the most elements, take the smallest ones.",
        "Sort `nums` and build prefix sums; the answer for a query is how far into the prefix you can go.",
        "That last step is a binary search on the prefix sums, which are increasing.",
      ],
      editorial: explain({
        idea: "Since a subsequence's sum ignores order, the longest one under a budget is always a prefix of the **sorted** array. Sort, build prefix sums, and binary-search each query for the largest prefix whose sum fits.",
        steps: [
          "Sort `nums` ascending and compute `pre[i]` = sum of the first `i` elements.",
          "For each query, binary-search the largest `i` with `pre[i] <= query`.",
          "Collect those indices as the answers.",
        ],
        why: "The exchange argument is immediate: if an optimal selection omits a smaller element while including a larger one, swapping them keeps the length and lowers the sum. So taking the smallest elements first is optimal, and the prefix sums are increasing — which is exactly what makes the binary search valid.",
        time: "O(n log n + m log n)",
        space: "O(n)",
        pitfalls: [
          "The queries are independent; the array is not consumed between them.",
          "A subsequence need not be contiguous, which is what licenses the sort.",
          "An answer of 0 is valid when even the smallest element does not fit.",
        ],
      }),
      examples: [
        { input: "[4,5,2,1]\n[3,10,21]", expectedOutput: "[2,3,4]" },
        { input: "[2,3,4,5]\n[1]", expectedOutput: "[0]" },
        { input: "[1,1,1]\n[2,5]", expectedOutput: "[2,3]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 20));
        const m = ri(rng, 1, 5);
        const queries = Array.from({ length: m }, () => ri(rng, 1, 80));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: `from bisect import bisect_right\nfrom typing import List\n\ndef answerQueries(nums: List[int], queries: List[int]) -> List[int]:\n    s = sorted(nums)\n    pre = [0]\n    for v in s:\n        pre.append(pre[-1] + v)\n    return [bisect_right(pre, q) - 1 for q in queries]`,
        javascript: `var answerQueries = function(nums, queries) {\n    var sorted = nums.slice();\n    sorted.sort(function(a, b) { return a - b; });\n    var pre = [0], i;\n    for (i = 0; i < sorted.length; i++) pre.push(pre[i] + sorted[i]);\n    var out = [];\n    for (i = 0; i < queries.length; i++) {\n        var lo = 0, hi = sorted.length;\n        while (lo < hi) {\n            var mid = (lo + hi + 1) >> 1;\n            if (pre[mid] <= queries[i]) lo = mid; else hi = mid - 1;\n        }\n        out.push(lo);\n    }\n    return out;\n};`,
        typescript: `function answerQueries(nums: number[], queries: number[]): number[] {\n    var sorted = nums.slice();\n    sorted.sort(function(a: number, b: number) { return a - b; });\n    var pre: number[] = [0], i: number;\n    for (i = 0; i < sorted.length; i++) pre.push(pre[i] + sorted[i]);\n    var out: number[] = [];\n    for (i = 0; i < queries.length; i++) {\n        var lo = 0, hi = sorted.length;\n        while (lo < hi) {\n            var mid = (lo + hi + 1) >> 1;\n            if (pre[mid] <= queries[i]) lo = mid; else hi = mid - 1;\n        }\n        out.push(lo);\n    }\n    return out;\n}`,
        java: `public static int[] answerQueries(int[] nums, int[] queries) {\n    int[] sorted = nums.clone();\n    Arrays.sort(sorted);\n    int n = sorted.length;\n    int[] pre = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + sorted[i];\n    int[] out = new int[queries.length];\n    for (int q = 0; q < queries.length; q++) {\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi + 1) >>> 1;\n            if (pre[mid] <= queries[q]) lo = mid;\n            else hi = mid - 1;\n        }\n        out[q] = lo;\n    }\n    return out;\n}`,
        cpp: `vector<int> answerQueries(vector<int>& nums, vector<int>& queries) {\n    vector<int> sorted = nums;\n    sort(sorted.begin(), sorted.end());\n    int n = (int) sorted.size();\n    vector<int> pre(n + 1, 0);\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + sorted[i];\n    vector<int> out;\n    for (int q : queries) {\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi + 1) / 2;\n            if (pre[mid] <= q) lo = mid;\n            else hi = mid - 1;\n        }\n        out.push_back(lo);\n    }\n    return out;\n}`,
        c: `static int aqCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint* answerQueries(int* nums, int numsSize, int* queries, int queriesSize, int* returnSize) {\n    int n = numsSize;\n    int* sorted = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) sorted[i] = nums[i];\n    qsort(sorted, (size_t) n, sizeof(int), aqCmp);\n    int* pre = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + sorted[i];\n    int* out = (int*) malloc((size_t) queriesSize * sizeof(int));\n    for (int q = 0; q < queriesSize; q++) {\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi + 1) / 2;\n            if (pre[mid] <= queries[q]) lo = mid;\n            else hi = mid - 1;\n        }\n        out[q] = lo;\n    }\n    free(sorted);\n    free(pre);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] AnswerQueries(int[] nums, int[] queries)\n{\n    var sorted = (int[]) nums.Clone();\n    Array.Sort(sorted);\n    int n = sorted.Length;\n    var pre = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + sorted[i];\n    var outArr = new int[queries.Length];\n    for (int q = 0; q < queries.Length; q++)\n    {\n        int lo = 0, hi = n;\n        while (lo < hi)\n        {\n            int mid = (lo + hi + 1) / 2;\n            if (pre[mid] <= queries[q]) lo = mid;\n            else hi = mid - 1;\n        }\n        outArr[q] = lo;\n    }\n    return outArr;\n}`,
        go: `func answerQueries(nums []int, queries []int) []int {\n\tn := len(nums)\n\tsorted := make([]int, n)\n\tcopy(sorted, nums)\n\tsort.Ints(sorted)\n\tpre := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tpre[i+1] = pre[i] + sorted[i]\n\t}\n\tout := make([]int, len(queries))\n\tfor q, want := range queries {\n\t\tlo, hi := 0, n\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi + 1) / 2\n\t\t\tif pre[mid] <= want {\n\t\t\t\tlo = mid\n\t\t\t} else {\n\t\t\t\thi = mid - 1\n\t\t\t}\n\t\t}\n\t\tout[q] = lo\n\t}\n\treturn out\n}`,
        kotlin: `fun answerQueries(nums: IntArray, queries: IntArray): IntArray {\n    val sorted = nums.sortedArray()\n    val n = sorted.size\n    val pre = IntArray(n + 1)\n    for (i in 0 until n) pre[i + 1] = pre[i] + sorted[i]\n    return IntArray(queries.size) { q ->\n        var lo = 0\n        var hi = n\n        while (lo < hi) {\n            val mid = (lo + hi + 1) / 2\n            if (pre[mid] <= queries[q]) lo = mid else hi = mid - 1\n        }\n        lo\n    }\n}`,
        swift: `func answerQueries(_ nums: [Int], _ queries: [Int]) -> [Int] {\n    let sorted = nums.sorted()\n    let n = sorted.count\n    var pre = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { pre[i + 1] = pre[i] + sorted[i] }\n    return queries.map { want in\n        var lo = 0\n        var hi = n\n        while lo < hi {\n            let mid = (lo + hi + 1) / 2\n            if pre[mid] <= want { lo = mid } else { hi = mid - 1 }\n        }\n        return lo\n    }\n}`,
        rust: `fn answerQueries(nums: Vec<i32>, queries: Vec<i32>) -> Vec<i32> {\n    let mut sorted = nums.clone();\n    sorted.sort();\n    let n = sorted.len();\n    let mut pre = vec![0i32; n + 1];\n    for i in 0..n {\n        pre[i + 1] = pre[i] + sorted[i];\n    }\n    queries\n        .iter()\n        .map(|&want| {\n            let mut lo = 0usize;\n            let mut hi = n;\n            while lo < hi {\n                let mid = (lo + hi + 1) / 2;\n                if pre[mid] <= want {\n                    lo = mid;\n                } else {\n                    hi = mid - 1;\n                }\n            }\n            lo as i32\n        })\n        .collect()\n}`,
        php: `function answerQueries($nums, $queries) {\n    $sorted = $nums;\n    sort($sorted);\n    $n = count($sorted);\n    $pre = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $sorted[$i];\n    $out = [];\n    foreach ($queries as $want) {\n        $lo = 0;\n        $hi = $n;\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi + 1, 2);\n            if ($pre[$mid] <= $want) $lo = $mid;\n            else $hi = $mid - 1;\n        }\n        $out[] = $lo;\n    }\n    return $out;\n}`,
        ruby: `def answerQueries(nums, queries)\n  sorted = nums.sort\n  pre = [0]\n  sorted.each { |v| pre << pre[-1] + v }\n  queries.map do |want|\n    lo = 0\n    hi = sorted.length\n    while lo < hi\n      mid = (lo + hi + 1) / 2\n      if pre[mid] <= want\n        lo = mid\n      else\n        hi = mid - 1\n      end\n    end\n    lo\n  end\nend`,
      },
    };
  })(),

  // ── Find the Winner of the Circular Game (LC 1823) ──────────────
  (() => {
    const ref = (n: number, k: number) => {
      let winner = 0;
      for (let i = 2; i <= n; i++) winner = (winner + k) % i;
      return winner + 1;
    };
    return {
      slug: "find-the-winner-of-the-circular-game",
      title: "Find the Winner of the Circular Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Recursion", "Simulation", "Queue", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "findTheWinner", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`n` friends sit in a circle numbered 1 to `n` clockwise. Starting at friend 1, count `k` friends clockwise — including the one you start on — and the `k`-th leaves the circle. Counting then restarts from the friend immediately after the one who left.\n\nReturn the number of the last friend remaining.",
        [
          { in: "n = 5, k = 2", out: "3", note: "Friends leave in the order 2, 4, 1, 5." },
          { in: "n = 6, k = 5", out: "1" },
          { in: "n = 1, k = 1", out: "1" },
        ],
        ["1 <= k <= n <= 500"]),
      hints: [
        "This is the Josephus problem.",
        "Solve it for a circle of `i` people from the answer for `i - 1`: after one elimination the circle is the same shape, just rotated by `k`.",
        "`f(1) = 0` and `f(i) = (f(i-1) + k) mod i`, with the answer being `f(n) + 1`.",
      ],
      editorial: explain({
        idea: "The Josephus recurrence. Working 0-indexed, a circle of one person has the survivor at position 0. Adding a person shifts the survivor's position by `k`, modulo the new circle size — so `f(i) = (f(i-1) + k) mod i`. Convert back to 1-indexed at the end.",
        steps: [
          "Start `winner = 0`, the survivor's 0-based seat in a circle of one.",
          "For `i` from 2 to `n`, set `winner = (winner + k) mod i`.",
          "Return `winner + 1`.",
        ],
        why: "After the first elimination in a circle of `i`, what remains is a circle of `i - 1` with the count restarting at a seat `k` positions along — so the survivor of the smaller circle, shifted by `k` and wrapped, is the survivor of the larger one. That is the whole recurrence, and it replaces an O(n · k) queue simulation with O(n) arithmetic.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The count includes the friend you start on, which is what makes the shift `k` and not `k - 1`.",
          "The recurrence is 0-based; the answer needs a `+ 1`.",
          "The modulus is the **current** circle size `i`, not `n`.",
        ],
      }),
      examples: [
        { input: "5\n2", expectedOutput: "3" },
        { input: "6\n5", expectedOutput: "1" },
        { input: "1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def findTheWinner(n: int, k: int) -> int:\n    winner = 0\n    for i in range(2, n + 1):\n        winner = (winner + k) % i\n    return winner + 1`,
        javascript: `var findTheWinner = function(n, k) {\n    var winner = 0;\n    for (var i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n};`,
        typescript: `function findTheWinner(n: number, k: number): number {\n    var winner = 0;\n    for (var i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n}`,
        java: `public static int findTheWinner(int n, int k) {\n    int winner = 0;\n    for (int i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n}`,
        cpp: `int findTheWinner(int n, int k) {\n    int winner = 0;\n    for (int i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n}`,
        c: `int findTheWinner(int n, int k) {\n    int winner = 0;\n    for (int i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n}`,
        csharp: `public static int FindTheWinner(int n, int k)\n{\n    int winner = 0;\n    for (int i = 2; i <= n; i++) winner = (winner + k) % i;\n    return winner + 1;\n}`,
        go: `func findTheWinner(n int, k int) int {\n\twinner := 0\n\tfor i := 2; i <= n; i++ {\n\t\twinner = (winner + k) % i\n\t}\n\treturn winner + 1\n}`,
        kotlin: `fun findTheWinner(n: Int, k: Int): Int {\n    var winner = 0\n    for (i in 2..n) winner = (winner + k) % i\n    return winner + 1\n}`,
        swift: `func findTheWinner(_ n: Int, _ k: Int) -> Int {\n    var winner = 0\n    if n >= 2 {\n        for i in 2...n { winner = (winner + k) % i }\n    }\n    return winner + 1\n}`,
        rust: `fn findTheWinner(n: i32, k: i32) -> i32 {\n    let mut winner = 0;\n    for i in 2..=n {\n        winner = (winner + k) % i;\n    }\n    winner + 1\n}`,
        php: `function findTheWinner($n, $k) {\n    $winner = 0;\n    for ($i = 2; $i <= $n; $i++) $winner = ($winner + $k) % $i;\n    return $winner + 1;\n}`,
        ruby: `def findTheWinner(n, k)\n  winner = 0\n  (2..n).each { |i| winner = (winner + k) % i }\n  winner + 1\nend`,
      },
    };
  })(),

  // ── Corporate Flight Bookings (LC 1109) ─────────────────────────
  (() => {
    const ref = (bookings: number[][], n: number) => {
      const diff = new Array(n + 1).fill(0);
      for (let i = 0; i < bookings.length; i++) {
        const first = bookings[i][0], last = bookings[i][1], seats = bookings[i][2];
        diff[first - 1] += seats;
        diff[last] -= seats;
      }
      const out = new Array(n).fill(0);
      let running = 0;
      for (let i = 0; i < n; i++) {
        running += diff[i];
        out[i] = running;
      }
      return out;
    };
    return {
      slug: "corporate-flight-bookings",
      title: "Corporate Flight Bookings",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "corpFlightBookings", params: [{ name: "bookings", type: "int[][]" as const }, { name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` flights numbered 1 to `n`. `bookings[i] = [first, last, seats]` means `seats` seats were reserved on **every** flight from `first` to `last` inclusive.\n\nReturn an array where entry `i` is the total number of seats reserved on flight `i + 1`.",
        [
          { in: "bookings = [[1,2,10],[2,3,20],[2,5,25]], n = 5", out: "[10,55,45,25,25]" },
          { in: "bookings = [[1,2,10],[2,2,15]], n = 2", out: "[10,25]" },
          { in: "bookings = [[1,1,5]], n = 3", out: "[5,0,0]" },
        ],
        ["1 <= n <= 2 * 10^4", "1 <= bookings.length <= 2 * 10^4", "bookings[i].length == 3", "1 <= firsti <= lasti <= n", "1 <= seatsi <= 10^4"]),
      hints: [
        "Applying each booking flight by flight is O(bookings · n) and too slow.",
        "Record only the **change**: add at the first flight and subtract just past the last.",
        "A running total over that difference array reconstructs the answer.",
      ],
      editorial: explain({
        idea: "A difference array. Each booking touches a contiguous range, so record `+seats` at its start and `-seats` one past its end; a prefix sum over those deltas then yields every flight's total in one pass.",
        steps: [
          "Create `diff` of length `n + 1`, all zeros.",
          "For each booking, do `diff[first - 1] += seats` and `diff[last] -= seats`.",
          "Sweep a running total across `diff`, writing it into the output.",
        ],
        why: "The trick is that a range update is two point updates on the derivative — the cost of a booking becomes O(1) regardless of how many flights it spans. The `+1` slot is what lets a booking ending at flight `n` subtract somewhere harmless instead of running off the array.",
        time: "O(bookings + n)",
        space: "O(n)",
        pitfalls: [
          "Flights are 1-indexed, so the start offset is `first - 1`.",
          "The subtraction goes at `last`, not `last - 1` — the range is inclusive.",
          "`diff` needs one extra slot for bookings that end on the last flight.",
        ],
      }),
      examples: [
        { input: "[[1,2,10],[2,3,20],[2,5,25]]\n5", expectedOutput: "[10,55,45,25,25]" },
        { input: "[[1,2,10],[2,2,15]]\n2", expectedOutput: "[10,25]" },
        { input: "[[1,1,5]]\n3", expectedOutput: "[5,0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const count = ri(rng, 1, 6);
        const bookings = Array.from({ length: count }, () => {
          const first = ri(rng, 1, n);
          return [first, ri(rng, first, n), ri(rng, 1, 40)];
        });
        return { input: `${fmtIntMat(bookings)}\n${n}`, expectedOutput: fmtIntArr(ref(bookings, n)) };
      },
      solutions: {
        python: `from typing import List\n\ndef corpFlightBookings(bookings: List[List[int]], n: int) -> List[int]:\n    diff = [0] * (n + 1)\n    for first, last, seats in bookings:\n        diff[first - 1] += seats\n        diff[last] -= seats\n    out = []\n    running = 0\n    for i in range(n):\n        running += diff[i]\n        out.append(running)\n    return out`,
        javascript: `var corpFlightBookings = function(bookings, n) {\n    var diff = [], i;\n    for (i = 0; i <= n; i++) diff.push(0);\n    for (i = 0; i < bookings.length; i++) {\n        diff[bookings[i][0] - 1] += bookings[i][2];\n        diff[bookings[i][1]] -= bookings[i][2];\n    }\n    var out = [], running = 0;\n    for (i = 0; i < n; i++) {\n        running += diff[i];\n        out.push(running);\n    }\n    return out;\n};`,
        typescript: `function corpFlightBookings(bookings: number[][], n: number): number[] {\n    var diff: number[] = [], i: number;\n    for (i = 0; i <= n; i++) diff.push(0);\n    for (i = 0; i < bookings.length; i++) {\n        diff[bookings[i][0] - 1] += bookings[i][2];\n        diff[bookings[i][1]] -= bookings[i][2];\n    }\n    var out: number[] = [], running = 0;\n    for (i = 0; i < n; i++) {\n        running += diff[i];\n        out.push(running);\n    }\n    return out;\n}`,
        java: `public static int[] corpFlightBookings(int[][] bookings, int n) {\n    int[] diff = new int[n + 1];\n    for (int[] b : bookings) {\n        diff[b[0] - 1] += b[2];\n        diff[b[1]] -= b[2];\n    }\n    int[] out = new int[n];\n    int running = 0;\n    for (int i = 0; i < n; i++) {\n        running += diff[i];\n        out[i] = running;\n    }\n    return out;\n}`,
        cpp: `vector<int> corpFlightBookings(vector<vector<int>>& bookings, int n) {\n    vector<int> diff(n + 1, 0);\n    for (auto& b : bookings) {\n        diff[b[0] - 1] += b[2];\n        diff[b[1]] -= b[2];\n    }\n    vector<int> out(n, 0);\n    int running = 0;\n    for (int i = 0; i < n; i++) {\n        running += diff[i];\n        out[i] = running;\n    }\n    return out;\n}`,
        c: `int* corpFlightBookings(int** bookings, int bookingsSize, int* bookingsColSize, int n, int* returnSize) {\n    (void) bookingsColSize;\n    int* diff = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < bookingsSize; i++) {\n        diff[bookings[i][0] - 1] += bookings[i][2];\n        diff[bookings[i][1]] -= bookings[i][2];\n    }\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    int running = 0;\n    for (int i = 0; i < n; i++) {\n        running += diff[i];\n        out[i] = running;\n    }\n    free(diff);\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] CorpFlightBookings(int[][] bookings, int n)\n{\n    var diff = new int[n + 1];\n    foreach (var b in bookings)\n    {\n        diff[b[0] - 1] += b[2];\n        diff[b[1]] -= b[2];\n    }\n    var outArr = new int[n];\n    int running = 0;\n    for (int i = 0; i < n; i++)\n    {\n        running += diff[i];\n        outArr[i] = running;\n    }\n    return outArr;\n}`,
        go: `func corpFlightBookings(bookings [][]int, n int) []int {\n\tdiff := make([]int, n+1)\n\tfor _, b := range bookings {\n\t\tdiff[b[0]-1] += b[2]\n\t\tdiff[b[1]] -= b[2]\n\t}\n\tout := make([]int, n)\n\trunning := 0\n\tfor i := 0; i < n; i++ {\n\t\trunning += diff[i]\n\t\tout[i] = running\n\t}\n\treturn out\n}`,
        kotlin: `fun corpFlightBookings(bookings: Array<IntArray>, n: Int): IntArray {\n    val diff = IntArray(n + 1)\n    for (b in bookings) {\n        diff[b[0] - 1] += b[2]\n        diff[b[1]] -= b[2]\n    }\n    val out = IntArray(n)\n    var running = 0\n    for (i in 0 until n) {\n        running += diff[i]\n        out[i] = running\n    }\n    return out\n}`,
        swift: `func corpFlightBookings(_ bookings: [[Int]], _ n: Int) -> [Int] {\n    var diff = [Int](repeating: 0, count: n + 1)\n    for b in bookings {\n        diff[b[0] - 1] += b[2]\n        diff[b[1]] -= b[2]\n    }\n    var out = [Int](repeating: 0, count: n)\n    var running = 0\n    for i in 0..<n {\n        running += diff[i]\n        out[i] = running\n    }\n    return out\n}`,
        rust: `fn corpFlightBookings(bookings: Vec<Vec<i32>>, n: i32) -> Vec<i32> {\n    let n = n as usize;\n    let mut diff = vec![0i32; n + 1];\n    for b in bookings.iter() {\n        diff[(b[0] - 1) as usize] += b[2];\n        diff[b[1] as usize] -= b[2];\n    }\n    let mut out = vec![0i32; n];\n    let mut running = 0;\n    for i in 0..n {\n        running += diff[i];\n        out[i] = running;\n    }\n    out\n}`,
        php: `function corpFlightBookings($bookings, $n) {\n    $diff = array_fill(0, $n + 1, 0);\n    foreach ($bookings as $b) {\n        $diff[$b[0] - 1] += $b[2];\n        $diff[$b[1]] -= $b[2];\n    }\n    $out = [];\n    $running = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $running += $diff[$i];\n        $out[] = $running;\n    }\n    return $out;\n}`,
        ruby: `def corpFlightBookings(bookings, n)\n  diff = Array.new(n + 1, 0)\n  bookings.each do |first, last, seats|\n    diff[first - 1] += seats\n    diff[last] -= seats\n  end\n  running = 0\n  (0...n).map do |i|\n    running += diff[i]\n    running\n  end\nend`,
      },
    };
  })(),

  // ── Queries on a Permutation With Key (LC 1409) ─────────────────
  (() => {
    const ref = (queries: number[], m: number) => {
      const perm: number[] = [];
      for (let i = 1; i <= m; i++) perm.push(i);
      const out: number[] = [];
      for (let q = 0; q < queries.length; q++) {
        let idx = 0;
        while (perm[idx] !== queries[q]) idx++;
        out.push(idx);
        perm.splice(idx, 1);
        perm.unshift(queries[q]);
      }
      return out;
    };
    return {
      slug: "queries-on-a-permutation-with-key",
      title: "Queries on a Permutation With Key",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Indexed Tree", "Simulation", "Amazon", "Google", "Oracle"],
      signature: { funcName: "processQueries", params: [{ name: "queries", type: "int[]" as const }, { name: "m", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Start with the permutation `P = [1, 2, 3, …, m]`. For each value in `queries`, in order:\n\n- record its current **0-based index** in `P`;\n- move it to the **front** of `P`, leaving the relative order of everything else unchanged.\n\nReturn the recorded indices.",
        [
          { in: "queries = [3,1,2,1], m = 5", out: "[2,1,2,1]", note: "`P` becomes `[3,1,2,4,5]`, `[1,3,2,4,5]`, `[2,1,3,4,5]`, `[1,2,3,4,5]`." },
          { in: "queries = [4,1,2,2], m = 4", out: "[3,1,2,0]", note: "The last query is already at the front." },
          { in: "queries = [7,5,5,8,3], m = 8", out: "[6,5,0,7,5]" },
        ],
        ["1 <= m <= 10^3", "1 <= queries.length <= m", "1 <= queries[i] <= m"]),
      hints: [
        "At these sizes a direct simulation of the list is fast enough.",
        "Find the value, record its index, remove it, and put it back at the front.",
        "The scalable version keeps positions in a Fenwick tree and prepends into a reserved prefix.",
      ],
      editorial: explain({
        idea: "Simulate the list directly: scan for the queried value, record its index, then move it to the front. With `m` and the query count both at most 1000, the O(m) work per query is comfortable.",
        steps: [
          "Build `P = [1..m]`.",
          "For each query, scan for its position and record it.",
          "Remove the value from that position and insert it at index 0.",
        ],
        why: "The quadratic simulation is the right answer at these bounds and is easy to get exactly right, which matters because the index is 0-based and recorded **before** the move. The Fenwick-tree solution exists for the same problem at scale: reserve `m` empty slots in front, keep each value's slot, and count the occupied slots before it to get the index in O(log m).",
        time: "O(q · m)",
        space: "O(m)",
        pitfalls: [
          "The index is recorded before the value is moved, not after.",
          "Indices are 0-based.",
          "Everything else keeps its relative order — only the queried value jumps.",
        ],
      }),
      examples: [
        { input: "[3,1,2,1]\n5", expectedOutput: "[2,1,2,1]" },
        { input: "[4,1,2,2]\n4", expectedOutput: "[3,1,2,0]" },
        { input: "[7,5,5,8,3]\n8", expectedOutput: "[6,5,0,7,5]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 10);
        const count = ri(rng, 1, m);
        const queries = Array.from({ length: count }, () => ri(rng, 1, m));
        return { input: `${fmtIntArr(queries)}\n${m}`, expectedOutput: fmtIntArr(ref(queries, m)) };
      },
      solutions: {
        python: `from typing import List\n\ndef processQueries(queries: List[int], m: int) -> List[int]:\n    perm = list(range(1, m + 1))\n    out = []\n    for q in queries:\n        idx = perm.index(q)\n        out.append(idx)\n        perm.pop(idx)\n        perm.insert(0, q)\n    return out`,
        javascript: `var processQueries = function(queries, m) {\n    var perm = [], i;\n    for (i = 1; i <= m; i++) perm.push(i);\n    var out = [];\n    for (var q = 0; q < queries.length; q++) {\n        var idx = 0;\n        while (perm[idx] !== queries[q]) idx++;\n        out.push(idx);\n        perm.splice(idx, 1);\n        perm.unshift(queries[q]);\n    }\n    return out;\n};`,
        typescript: `function processQueries(queries: number[], m: number): number[] {\n    var perm: number[] = [], i: number;\n    for (i = 1; i <= m; i++) perm.push(i);\n    var out: number[] = [];\n    for (var q = 0; q < queries.length; q++) {\n        var idx = 0;\n        while (perm[idx] !== queries[q]) idx++;\n        out.push(idx);\n        perm.splice(idx, 1);\n        perm.unshift(queries[q]);\n    }\n    return out;\n}`,
        java: `public static int[] processQueries(int[] queries, int m) {\n    List<Integer> perm = new ArrayList<>();\n    for (int i = 1; i <= m; i++) perm.add(i);\n    int[] out = new int[queries.length];\n    for (int q = 0; q < queries.length; q++) {\n        int idx = perm.indexOf(queries[q]);\n        out[q] = idx;\n        perm.remove(idx);\n        perm.add(0, queries[q]);\n    }\n    return out;\n}`,
        cpp: `vector<int> processQueries(vector<int>& queries, int m) {\n    vector<int> perm;\n    for (int i = 1; i <= m; i++) perm.push_back(i);\n    vector<int> out;\n    for (int q : queries) {\n        int idx = 0;\n        while (perm[idx] != q) idx++;\n        out.push_back(idx);\n        perm.erase(perm.begin() + idx);\n        perm.insert(perm.begin(), q);\n    }\n    return out;\n}`,
        c: `int* processQueries(int* queries, int queriesSize, int m, int* returnSize) {\n    int* perm = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < m; i++) perm[i] = i + 1;\n    int* out = (int*) malloc((size_t) queriesSize * sizeof(int));\n    for (int q = 0; q < queriesSize; q++) {\n        int idx = 0;\n        while (perm[idx] != queries[q]) idx++;\n        out[q] = idx;\n        for (int i = idx; i > 0; i--) perm[i] = perm[i - 1];\n        perm[0] = queries[q];\n    }\n    free(perm);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] ProcessQueries(int[] queries, int m)\n{\n    var perm = new List<int>();\n    for (int i = 1; i <= m; i++) perm.Add(i);\n    var outArr = new int[queries.Length];\n    for (int q = 0; q < queries.Length; q++)\n    {\n        int idx = perm.IndexOf(queries[q]);\n        outArr[q] = idx;\n        perm.RemoveAt(idx);\n        perm.Insert(0, queries[q]);\n    }\n    return outArr;\n}`,
        go: `func processQueries(queries []int, m int) []int {\n\tperm := make([]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tperm[i] = i + 1\n\t}\n\tout := make([]int, len(queries))\n\tfor q, want := range queries {\n\t\tidx := 0\n\t\tfor perm[idx] != want {\n\t\t\tidx++\n\t\t}\n\t\tout[q] = idx\n\t\tfor i := idx; i > 0; i-- {\n\t\t\tperm[i] = perm[i-1]\n\t\t}\n\t\tperm[0] = want\n\t}\n\treturn out\n}`,
        kotlin: `fun processQueries(queries: IntArray, m: Int): IntArray {\n    val perm = IntArray(m) { it + 1 }\n    val out = IntArray(queries.size)\n    for (q in queries.indices) {\n        var idx = 0\n        while (perm[idx] != queries[q]) idx++\n        out[q] = idx\n        for (i in idx downTo 1) perm[i] = perm[i - 1]\n        perm[0] = queries[q]\n    }\n    return out\n}`,
        swift: `func processQueries(_ queries: [Int], _ m: Int) -> [Int] {\n    var perm = Array(1...m)\n    var out = [Int]()\n    for want in queries {\n        var idx = 0\n        while perm[idx] != want { idx += 1 }\n        out.append(idx)\n        perm.remove(at: idx)\n        perm.insert(want, at: 0)\n    }\n    return out\n}`,
        rust: `fn processQueries(queries: Vec<i32>, m: i32) -> Vec<i32> {\n    let mut perm: Vec<i32> = (1..=m).collect();\n    let mut out: Vec<i32> = Vec::new();\n    for &want in queries.iter() {\n        let idx = perm.iter().position(|&v| v == want).unwrap();\n        out.push(idx as i32);\n        perm.remove(idx);\n        perm.insert(0, want);\n    }\n    out\n}`,
        php: `function processQueries($queries, $m) {\n    $perm = range(1, $m);\n    $out = [];\n    foreach ($queries as $want) {\n        $idx = array_search($want, $perm, true);\n        $out[] = $idx;\n        array_splice($perm, $idx, 1);\n        array_unshift($perm, $want);\n    }\n    return $out;\n}`,
        ruby: `def processQueries(queries, m)\n  perm = (1..m).to_a\n  queries.map do |want|\n    idx = perm.index(want)\n    perm.delete_at(idx)\n    perm.unshift(want)\n    idx\n  end\nend`,
      },
    };
  })(),

  // ── Find the Winner of an Array Game (LC 1535) ──────────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      let cur = arr[0], wins = 0;
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] > cur) { cur = arr[i]; wins = 1; } else wins++;
        if (wins === k) return cur;
      }
      return cur;
    };
    return {
      slug: "find-the-winner-of-an-array-game",
      title: "Find the Winner of an Array Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Simulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "getWinner", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`arr` holds **distinct** integers. Repeatedly compare `arr[0]` with `arr[1]`: the larger stays at position 0 and the smaller is moved to the **end** of the array.\n\nReturn the first integer to win `k` **consecutive** rounds.",
        [
          { in: "arr = [2,1,3,5,4,6,7], k = 2", out: "5", note: "5 takes the front by beating 3, then beats 4 — two rounds in a row." },
          { in: "arr = [3,2,1], k = 10", out: "3", note: "Once the maximum reaches the front it wins every round, so it wins any `k`." },
          { in: "arr = [1,11,22,33,44,55,66,77,88,99], k = 1000000000", out: "99" },
        ],
        ["2 <= arr.length <= 10^5", "1 <= arr[i] <= 10^6", "arr contains distinct integers.", "1 <= k <= 10^9"]),
      hints: [
        "Never simulate the rotation — `k` can be a billion.",
        "One pass is enough: carry the current champion and a streak counter.",
        "If nobody reaches `k` during that pass, the array maximum has reached the front and wins forever.",
      ],
      editorial: explain({
        idea: "Sweep once, carrying the current champion and its consecutive-win count. A larger element takes over with a streak of 1; anything smaller extends the streak. If the streak reaches `k`, that element is the answer; otherwise the maximum has surfaced and wins every round from then on.",
        steps: [
          "Start with `cur = arr[0]` and `wins = 0`.",
          "For each later element: if it is larger, it becomes `cur` with `wins = 1`; otherwise increment `wins`.",
          "Return `cur` as soon as `wins == k`.",
          "After the sweep, return `cur` — by then it is the array maximum.",
        ],
        why: "The rotation never needs to be simulated because the elements pushed to the back are, in order, exactly the ones the sweep has already passed — so the first pass sees every challenger in the order it would arrive. And once the maximum is at the front nothing can dislodge it, so a `k` larger than the array is answered by the maximum without any extra work.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`k` can exceed the array length, so a simulation must be bounded or avoided.",
          "A new champion starts its streak at 1 — it just won a round.",
          "The elements are distinct, so there are no ties to resolve.",
        ],
      }),
      examples: [
        { input: "[2,1,3,5,4,6,7]\n2", expectedOutput: "5" },
        { input: "[3,2,1]\n10", expectedOutput: "3" },
        { input: "[1,11,22,33,44,55,66,77,88,99]\n1000000000", expectedOutput: "99" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 12);
        const pool: number[] = [];
        for (let v = 1; v <= 40; v++) pool.push(v);
        const arr = shuffle(rng, pool).slice(0, n);
        const k = ri(rng, 1, 20);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getWinner(arr: List[int], k: int) -> int:\n    cur, wins = arr[0], 0\n    for v in arr[1:]:\n        if v > cur:\n            cur, wins = v, 1\n        else:\n            wins += 1\n        if wins == k:\n            return cur\n    return cur`,
        javascript: `var getWinner = function(arr, k) {\n    var cur = arr[0], wins = 0;\n    for (var i = 1; i < arr.length; i++) {\n        if (arr[i] > cur) { cur = arr[i]; wins = 1; } else wins++;\n        if (wins === k) return cur;\n    }\n    return cur;\n};`,
        typescript: `function getWinner(arr: number[], k: number): number {\n    var cur = arr[0], wins = 0;\n    for (var i = 1; i < arr.length; i++) {\n        if (arr[i] > cur) { cur = arr[i]; wins = 1; } else wins++;\n        if (wins === k) return cur;\n    }\n    return cur;\n}`,
        java: `public static int getWinner(int[] arr, int k) {\n    int cur = arr[0], wins = 0;\n    for (int i = 1; i < arr.length; i++) {\n        if (arr[i] > cur) {\n            cur = arr[i];\n            wins = 1;\n        } else {\n            wins++;\n        }\n        if (wins == k) return cur;\n    }\n    return cur;\n}`,
        cpp: `int getWinner(vector<int>& arr, int k) {\n    int cur = arr[0], wins = 0;\n    for (size_t i = 1; i < arr.size(); i++) {\n        if (arr[i] > cur) {\n            cur = arr[i];\n            wins = 1;\n        } else {\n            wins++;\n        }\n        if (wins == k) return cur;\n    }\n    return cur;\n}`,
        c: `int getWinner(int* arr, int arrSize, int k) {\n    int cur = arr[0], wins = 0;\n    for (int i = 1; i < arrSize; i++) {\n        if (arr[i] > cur) {\n            cur = arr[i];\n            wins = 1;\n        } else {\n            wins++;\n        }\n        if (wins == k) return cur;\n    }\n    return cur;\n}`,
        csharp: `public static int GetWinner(int[] arr, int k)\n{\n    int cur = arr[0], wins = 0;\n    for (int i = 1; i < arr.Length; i++)\n    {\n        if (arr[i] > cur)\n        {\n            cur = arr[i];\n            wins = 1;\n        }\n        else\n        {\n            wins++;\n        }\n        if (wins == k) return cur;\n    }\n    return cur;\n}`,
        go: `func getWinner(arr []int, k int) int {\n\tcur, wins := arr[0], 0\n\tfor i := 1; i < len(arr); i++ {\n\t\tif arr[i] > cur {\n\t\t\tcur, wins = arr[i], 1\n\t\t} else {\n\t\t\twins++\n\t\t}\n\t\tif wins == k {\n\t\t\treturn cur\n\t\t}\n\t}\n\treturn cur\n}`,
        kotlin: `fun getWinner(arr: IntArray, k: Int): Int {\n    var cur = arr[0]\n    var wins = 0\n    for (i in 1 until arr.size) {\n        if (arr[i] > cur) {\n            cur = arr[i]\n            wins = 1\n        } else {\n            wins++\n        }\n        if (wins == k) return cur\n    }\n    return cur\n}`,
        swift: `func getWinner(_ arr: [Int], _ k: Int) -> Int {\n    var cur = arr[0]\n    var wins = 0\n    for i in 1..<arr.count {\n        if arr[i] > cur {\n            cur = arr[i]\n            wins = 1\n        } else {\n            wins += 1\n        }\n        if wins == k { return cur }\n    }\n    return cur\n}`,
        rust: `fn getWinner(arr: Vec<i32>, k: i32) -> i32 {\n    let mut cur = arr[0];\n    let mut wins = 0;\n    for i in 1..arr.len() {\n        if arr[i] > cur {\n            cur = arr[i];\n            wins = 1;\n        } else {\n            wins += 1;\n        }\n        if wins == k {\n            return cur;\n        }\n    }\n    cur\n}`,
        php: `function getWinner($arr, $k) {\n    $cur = $arr[0];\n    $wins = 0;\n    for ($i = 1; $i < count($arr); $i++) {\n        if ($arr[$i] > $cur) {\n            $cur = $arr[$i];\n            $wins = 1;\n        } else {\n            $wins++;\n        }\n        if ($wins === $k) return $cur;\n    }\n    return $cur;\n}`,
        ruby: `def getWinner(arr, k)\n  cur = arr[0]\n  wins = 0\n  (1...arr.length).each do |i|\n    if arr[i] > cur\n      cur = arr[i]\n      wins = 1\n    else\n      wins += 1\n    end\n    return cur if wins == k\n  end\n  cur\nend`,
      },
    };
  })(),

  // ── Minimum Increments on Subarrays to Form a Target (LC 1526) ──
  (() => {
    const ref = (target: number[]) => {
      let total = target[0];
      for (let i = 1; i < target.length; i++) {
        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];
      }
      return total;
    };
    return {
      slug: "minimum-number-of-increments-on-subarrays-to-form-a-target-array",
      title: "Minimum Number of Increments on Subarrays to Form a Target Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Dynamic Programming", "Stack", "Monotonic Stack", "Amazon", "Google", "Meta"],
      signature: { funcName: "minNumberOperations", params: [{ name: "target", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You start with an array of zeros the same length as `target`. In one operation you may pick **any subarray** and increment every element in it by one.\n\nReturn the minimum number of operations needed to turn the zero array into `target`.",
        [
          { in: "target = [1,2,3,2,1]", out: "3", note: "Increment the whole array, then the middle three, then the middle one." },
          { in: "target = [3,1,1,2]", out: "4", note: "3 for the leading peak plus 1 for the final rise." },
          { in: "target = [1,1,1,1]", out: "1", note: "One operation over the whole array." },
        ],
        ["1 <= target.length <= 10^5", "1 <= target[i] <= 10^5"]),
      hints: [
        "An operation covers a contiguous range, so a **rise** in the target must start a new operation.",
        "A fall costs nothing — an operation can simply end there.",
        "Add the first element plus every positive difference between consecutive elements.",
      ],
      editorial: explain({
        idea: "Sweep left to right. The first element needs `target[0]` operations to start. After that, every time the target rises you must begin `target[i] - target[i-1]` fresh operations; a fall is free, since operations can just end. The answer is `target[0] + Σ max(0, target[i] - target[i-1])`.",
        steps: [
          "Start the total at `target[0]`.",
          "For each later index, add the difference from the previous element when it is positive.",
        ],
        why: "Operations are intervals, so the count at any position is the number of intervals covering it. Moving right, the covering count can drop for free — an interval simply ends — but it can only rise by starting new intervals, one per unit of increase. Summing the rises is therefore both necessary and sufficient, which is why the greedy is exactly optimal and no DP is needed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Falls contribute nothing — using `|difference|` roughly doubles the answer.",
          "The first element is a rise from an implicit 0 and must be counted.",
          "The total can reach about 10¹⁰ only if the constraints are loosened; at these bounds it stays inside a 32-bit int.",
        ],
      }),
      examples: [
        { input: "[1,2,3,2,1]", expectedOutput: "3" },
        { input: "[3,1,1,2]", expectedOutput: "4" },
        { input: "[1,1,1,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const target = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: fmtIntArr(target), expectedOutput: String(ref(target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minNumberOperations(target: List[int]) -> int:\n    total = target[0]\n    for i in range(1, len(target)):\n        total += max(0, target[i] - target[i - 1])\n    return total`,
        javascript: `var minNumberOperations = function(target) {\n    var total = target[0];\n    for (var i = 1; i < target.length; i++) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n};`,
        typescript: `function minNumberOperations(target: number[]): number {\n    var total = target[0];\n    for (var i = 1; i < target.length; i++) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n}`,
        java: `public static int minNumberOperations(int[] target) {\n    int total = target[0];\n    for (int i = 1; i < target.length; i++) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n}`,
        cpp: `int minNumberOperations(vector<int>& target) {\n    int total = target[0];\n    for (size_t i = 1; i < target.size(); i++) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n}`,
        c: `int minNumberOperations(int* target, int targetSize) {\n    int total = target[0];\n    for (int i = 1; i < targetSize; i++) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n}`,
        csharp: `public static int MinNumberOperations(int[] target)\n{\n    int total = target[0];\n    for (int i = 1; i < target.Length; i++)\n    {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1];\n    }\n    return total;\n}`,
        go: `func minNumberOperations(target []int) int {\n\ttotal := target[0]\n\tfor i := 1; i < len(target); i++ {\n\t\tif target[i] > target[i-1] {\n\t\t\ttotal += target[i] - target[i-1]\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun minNumberOperations(target: IntArray): Int {\n    var total = target[0]\n    for (i in 1 until target.size) {\n        if (target[i] > target[i - 1]) total += target[i] - target[i - 1]\n    }\n    return total\n}`,
        swift: `func minNumberOperations(_ target: [Int]) -> Int {\n    var total = target[0]\n    for i in 1..<max(target.count, 1) where i < target.count {\n        if target[i] > target[i - 1] { total += target[i] - target[i - 1] }\n    }\n    return total\n}`,
        rust: `fn minNumberOperations(target: Vec<i32>) -> i32 {\n    let mut total = target[0];\n    for i in 1..target.len() {\n        if target[i] > target[i - 1] {\n            total += target[i] - target[i - 1];\n        }\n    }\n    total\n}`,
        php: `function minNumberOperations($target) {\n    $total = $target[0];\n    for ($i = 1; $i < count($target); $i++) {\n        if ($target[$i] > $target[$i - 1]) $total += $target[$i] - $target[$i - 1];\n    }\n    return $total;\n}`,
        ruby: `def minNumberOperations(target)\n  total = target[0]\n  (1...target.length).each do |i|\n    total += target[i] - target[i - 1] if target[i] > target[i - 1]\n  end\n  total\nend`,
      },
    };
  })(),


  // ── Make Three Strings Equal (LC 2937) ──────────────────────────
  (() => {
    const ref = (s1: string, s2: string, s3: string) => {
      const limit = Math.min(s1.length, Math.min(s2.length, s3.length));
      let common = 0;
      while (common < limit
        && s1.charAt(common) === s2.charAt(common)
        && s2.charAt(common) === s3.charAt(common)) common++;
      if (common === 0) return -1;
      return s1.length + s2.length + s3.length - 3 * common;
    };
    return {
      slug: "make-three-strings-equal",
      title: "Make Three Strings Equal",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "findMinimumOperations", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }, { name: "s3", type: "string" as const }], returns: "int" as const },
      description: describe(
        "In one operation you pick one of the three strings — it must have length at least 2 — and delete its **rightmost** character.\n\nReturn the minimum number of operations that makes all three strings equal, or `-1` if that is impossible.",
        [
          { in: 's1 = "abc", s2 = "abb", s3 = "ab"', out: "2", note: "Trim `abc` and `abb` down to `ab`." },
          { in: 's1 = "dac", s2 = "bac", s3 = "cac"', out: "-1", note: "The first characters already differ, and only the right end can be trimmed." },
          { in: 's1 = "aab", s2 = "aa", s3 = "aaa"', out: "2", note: "All three trim to `aa`." },
        ],
        ["1 <= s1.length, s2.length, s3.length <= 100", "s1, s2 and s3 consist only of lowercase English letters."]),
      hints: [
        "Deleting from the right means every string can only become one of its own **prefixes**.",
        "So the final common string is the longest common prefix of all three.",
        "If that prefix is empty the answer is `-1`.",
      ],
      editorial: explain({
        idea: "Only right-hand deletions are allowed, so each string can only shrink to one of its prefixes. The three can therefore meet only at a common prefix, and the cheapest meeting point is the **longest** one. The cost is the total length minus three times that prefix's length.",
        steps: [
          "Walk the three strings in lockstep while all three characters agree.",
          "Return `-1` if not even the first characters match.",
          "Otherwise return `len1 + len2 + len3 - 3 · common`.",
        ],
        why: "Longest is cheapest because every extra shared character saves three deletions — one per string — so there is no trade-off to weigh. The `-1` case is exactly an empty common prefix, since a string of length 1 cannot be trimmed further and an empty target is unreachable.",
        time: "O(min length)",
        space: "O(1)",
        pitfalls: [
          "The common **prefix** matters, not the common subsequence or suffix.",
          "The operation requires length ≥ 2, so no string can be emptied — an empty common prefix means `-1`.",
          "The cost counts deletions across all three strings.",
        ],
      }),
      examples: [
        { input: '"abc"\n"abb"\n"ab"', expectedOutput: "2" },
        { input: '"dac"\n"bac"\n"cac"', expectedOutput: "-1" },
        { input: '"aab"\n"aa"\n"aaa"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "ab";
        const make = () => {
          let out = "";
          const len = ri(rng, 1, 8);
          for (let i = 0; i < len; i++) out += alphabet.charAt(ri(rng, 0, 1));
          return out;
        };
        const s1 = make(), s2 = make(), s3 = make();
        return { input: `"${s1}"\n"${s2}"\n"${s3}"`, expectedOutput: String(ref(s1, s2, s3)) };
      },
      solutions: {
        python: `def findMinimumOperations(s1: str, s2: str, s3: str) -> int:\n    limit = min(len(s1), len(s2), len(s3))\n    common = 0\n    while common < limit and s1[common] == s2[common] == s3[common]:\n        common += 1\n    if common == 0:\n        return -1\n    return len(s1) + len(s2) + len(s3) - 3 * common`,
        javascript: `var findMinimumOperations = function(s1, s2, s3) {\n    var limit = Math.min(s1.length, Math.min(s2.length, s3.length));\n    var common = 0;\n    while (common < limit\n        && s1.charAt(common) === s2.charAt(common)\n        && s2.charAt(common) === s3.charAt(common)) common++;\n    if (common === 0) return -1;\n    return s1.length + s2.length + s3.length - 3 * common;\n};`,
        typescript: `function findMinimumOperations(s1: string, s2: string, s3: string): number {\n    var limit = Math.min(s1.length, Math.min(s2.length, s3.length));\n    var common = 0;\n    while (common < limit\n        && s1.charAt(common) === s2.charAt(common)\n        && s2.charAt(common) === s3.charAt(common)) common++;\n    if (common === 0) return -1;\n    return s1.length + s2.length + s3.length - 3 * common;\n}`,
        java: `public static int findMinimumOperations(String s1, String s2, String s3) {\n    int limit = Math.min(s1.length(), Math.min(s2.length(), s3.length()));\n    int common = 0;\n    while (common < limit\n            && s1.charAt(common) == s2.charAt(common)\n            && s2.charAt(common) == s3.charAt(common)) common++;\n    if (common == 0) return -1;\n    return s1.length() + s2.length() + s3.length() - 3 * common;\n}`,
        cpp: `int findMinimumOperations(string s1, string s2, string s3) {\n    size_t limit = min(s1.size(), min(s2.size(), s3.size()));\n    size_t common = 0;\n    while (common < limit && s1[common] == s2[common] && s2[common] == s3[common]) common++;\n    if (common == 0) return -1;\n    return (int) (s1.size() + s2.size() + s3.size() - 3 * common);\n}`,
        c: `int findMinimumOperations(char* s1, char* s2, char* s3) {\n    int l1 = (int) strlen(s1), l2 = (int) strlen(s2), l3 = (int) strlen(s3);\n    int limit = l1 < l2 ? l1 : l2;\n    if (l3 < limit) limit = l3;\n    int common = 0;\n    while (common < limit && s1[common] == s2[common] && s2[common] == s3[common]) common++;\n    if (common == 0) return -1;\n    return l1 + l2 + l3 - 3 * common;\n}`,
        csharp: `public static int FindMinimumOperations(string s1, string s2, string s3)\n{\n    int limit = Math.Min(s1.Length, Math.Min(s2.Length, s3.Length));\n    int common = 0;\n    while (common < limit && s1[common] == s2[common] && s2[common] == s3[common]) common++;\n    if (common == 0) return -1;\n    return s1.Length + s2.Length + s3.Length - 3 * common;\n}`,
        go: `func findMinimumOperations(s1 string, s2 string, s3 string) int {\n\tlimit := len(s1)\n\tif len(s2) < limit {\n\t\tlimit = len(s2)\n\t}\n\tif len(s3) < limit {\n\t\tlimit = len(s3)\n\t}\n\tcommon := 0\n\tfor common < limit && s1[common] == s2[common] && s2[common] == s3[common] {\n\t\tcommon++\n\t}\n\tif common == 0 {\n\t\treturn -1\n\t}\n\treturn len(s1) + len(s2) + len(s3) - 3*common\n}`,
        kotlin: `fun findMinimumOperations(s1: String, s2: String, s3: String): Int {\n    val limit = minOf(s1.length, s2.length, s3.length)\n    var common = 0\n    while (common < limit && s1[common] == s2[common] && s2[common] == s3[common]) common++\n    if (common == 0) return -1\n    return s1.length + s2.length + s3.length - 3 * common\n}`,
        swift: `func findMinimumOperations(_ s1: String, _ s2: String, _ s3: String) -> Int {\n    let a = Array(s1)\n    let b = Array(s2)\n    let c = Array(s3)\n    let limit = min(a.count, min(b.count, c.count))\n    var common = 0\n    while common < limit && a[common] == b[common] && b[common] == c[common] { common += 1 }\n    if common == 0 { return -1 }\n    return a.count + b.count + c.count - 3 * common\n}`,
        rust: `fn findMinimumOperations(s1: String, s2: String, s3: String) -> i32 {\n    let a = s1.as_bytes();\n    let b = s2.as_bytes();\n    let c = s3.as_bytes();\n    let limit = a.len().min(b.len()).min(c.len());\n    let mut common = 0usize;\n    while common < limit && a[common] == b[common] && b[common] == c[common] {\n        common += 1;\n    }\n    if common == 0 {\n        return -1;\n    }\n    (a.len() + b.len() + c.len() - 3 * common) as i32\n}`,
        php: `function findMinimumOperations($s1, $s2, $s3) {\n    $l1 = strlen($s1);\n    $l2 = strlen($s2);\n    $l3 = strlen($s3);\n    $limit = min($l1, $l2, $l3);\n    $common = 0;\n    while ($common < $limit && $s1[$common] === $s2[$common] && $s2[$common] === $s3[$common]) $common++;\n    if ($common === 0) return -1;\n    return $l1 + $l2 + $l3 - 3 * $common;\n}`,
        ruby: `def findMinimumOperations(s1, s2, s3)\n  limit = [s1.length, s2.length, s3.length].min\n  common = 0\n  common += 1 while common < limit && s1[common] == s2[common] && s2[common] == s3[common]\n  return -1 if common == 0\n  s1.length + s2.length + s3.length - 3 * common\nend`,
      },
    };
  })(),

  // ── Reverse Pairs (LC 493) ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const work = nums.slice();
      const buffer = new Array(work.length).fill(0);
      const sortCount = (lo: number, hi: number): number => {
        if (hi - lo <= 1) return 0;
        const mid = (lo + hi) >> 1;
        let total = sortCount(lo, mid) + sortCount(mid, hi);
        // Both halves are sorted, so the j-pointer only ever moves forward.
        let j = mid;
        for (let i = lo; i < mid; i++) {
          while (j < hi && work[i] > 2 * work[j]) j++;
          total += j - mid;
        }
        let a = lo, b = mid, w = lo;
        while (a < mid || b < hi) {
          if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];
          else buffer[w++] = work[b++];
        }
        for (let t = lo; t < hi; t++) work[t] = buffer[t];
        return total;
      };
      return sortCount(0, work.length);
    };
    return {
      slug: "reverse-pairs",
      title: "Reverse Pairs",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Divide and Conquer", "Binary Indexed Tree", "Merge Sort", "Google", "Amazon", "Meta"],
      signature: { funcName: "reversePairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **reverse pair** is a pair of indices `i < j` with `nums[i] > 2 · nums[j]`.\n\nReturn the number of reverse pairs in `nums`.",
        [
          { in: "nums = [1,3,2,3,1]", out: "2", note: "`(1,4)` with 3 > 2 and `(3,4)` with 3 > 2." },
          { in: "nums = [2,4,3,5,1]", out: "3", note: "`(1,4)`, `(2,4)` and `(3,4)`." },
          { in: "nums = [5,4,3,2,1]", out: "4" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9"]),
      hints: [
        "The quadratic scan is too slow — the pairs have to be counted during a divide and conquer.",
        "Inside a merge sort, count the pairs whose left index is in the left half and right index in the right half.",
        "Because both halves are already sorted, that count is a single forward sweep before the merge.",
      ],
      editorial: explain({
        idea: "Merge sort with a counting step. After both halves are sorted, count the cross pairs `i` in the left, `j` in the right with `nums[i] > 2 · nums[j]`; because both halves are sorted, a single pointer over the right half suffices. Then merge and return the total.",
        steps: [
          "Recurse on `[lo, mid)` and `[mid, hi)`, summing their counts.",
          "Sweep `i` across the left half, advancing `j` in the right half while `work[i] > 2 · work[j]`; add `j - mid` for each `i`.",
          "Merge the two halves back into sorted order.",
        ],
        why: "The counting sweep is linear rather than quadratic because both halves are sorted: as `i` moves right its value grows, so the threshold `j` only ever moves right too — it never backtracks. Counting before the merge is essential, since the merge destroys the separation between the halves that the pair definition relies on.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`2 · nums[j]` overflows a 32-bit integer at the upstream bounds — the comparison needs 64-bit arithmetic there.",
          "The count must be taken **before** merging the halves.",
          "The `j` pointer is shared across the whole sweep; resetting it per `i` makes the step quadratic again.",
        ],
      }),
      examples: [
        { input: "[1,3,2,3,1]", expectedOutput: "2" },
        { input: "[2,4,3,5,1]", expectedOutput: "3" },
        { input: "[5,4,3,2,1]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const nums = Array.from({ length: n }, () => ri(rng, -20, 20));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef reversePairs(nums: List[int]) -> int:\n    work = nums[:]\n\n    def sort_count(lo: int, hi: int) -> int:\n        if hi - lo <= 1:\n            return 0\n        mid = (lo + hi) // 2\n        total = sort_count(lo, mid) + sort_count(mid, hi)\n        j = mid\n        for i in range(lo, mid):\n            while j < hi and work[i] > 2 * work[j]:\n                j += 1\n            total += j - mid\n        work[lo:hi] = sorted(work[lo:hi])\n        return total\n\n    return sort_count(0, len(work))`,
        javascript: `var reversePairs = function(nums) {\n    var work = nums.slice();\n    var buffer = [];\n    for (var t = 0; t < work.length; t++) buffer.push(0);\n    var sortCount = function(lo, hi) {\n        if (hi - lo <= 1) return 0;\n        var mid = (lo + hi) >> 1;\n        var total = sortCount(lo, mid) + sortCount(mid, hi);\n        var j = mid, i;\n        for (i = lo; i < mid; i++) {\n            while (j < hi && work[i] > 2 * work[j]) j++;\n            total += j - mid;\n        }\n        var a = lo, b = mid, w = lo;\n        while (a < mid || b < hi) {\n            if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n            else buffer[w++] = work[b++];\n        }\n        for (i = lo; i < hi; i++) work[i] = buffer[i];\n        return total;\n    };\n    return sortCount(0, work.length);\n};`,
        typescript: `function reversePairs(nums: number[]): number {\n    var work = nums.slice();\n    var buffer: number[] = [];\n    for (var t = 0; t < work.length; t++) buffer.push(0);\n    var sortCount = function(lo: number, hi: number): number {\n        if (hi - lo <= 1) return 0;\n        var mid = (lo + hi) >> 1;\n        var total = sortCount(lo, mid) + sortCount(mid, hi);\n        var j = mid, i: number;\n        for (i = lo; i < mid; i++) {\n            while (j < hi && work[i] > 2 * work[j]) j++;\n            total += j - mid;\n        }\n        var a = lo, b = mid, w = lo;\n        while (a < mid || b < hi) {\n            if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n            else buffer[w++] = work[b++];\n        }\n        for (i = lo; i < hi; i++) work[i] = buffer[i];\n        return total;\n    };\n    return sortCount(0, work.length);\n}`,
        java: `public static int reversePairs(int[] nums) {\n    int[] work = nums.clone();\n    int[] buffer = new int[work.length];\n    return rpSortCount(work, buffer, 0, work.length);\n}\n\nprivate static int rpSortCount(int[] work, int[] buffer, int lo, int hi) {\n    if (hi - lo <= 1) return 0;\n    int mid = (lo + hi) >>> 1;\n    int total = rpSortCount(work, buffer, lo, mid) + rpSortCount(work, buffer, mid, hi);\n    int j = mid;\n    for (int i = lo; i < mid; i++) {\n        while (j < hi && (long) work[i] > 2L * work[j]) j++;\n        total += j - mid;\n    }\n    int a = lo, b = mid, w = lo;\n    while (a < mid || b < hi) {\n        if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n        else buffer[w++] = work[b++];\n    }\n    for (int i = lo; i < hi; i++) work[i] = buffer[i];\n    return total;\n}`,
        cpp: `static int rpSortCount(vector<int>& work, vector<int>& buffer, int lo, int hi) {\n    if (hi - lo <= 1) return 0;\n    int mid = (lo + hi) / 2;\n    int total = rpSortCount(work, buffer, lo, mid) + rpSortCount(work, buffer, mid, hi);\n    int j = mid;\n    for (int i = lo; i < mid; i++) {\n        while (j < hi && (long long) work[i] > 2LL * work[j]) j++;\n        total += j - mid;\n    }\n    int a = lo, b = mid, w = lo;\n    while (a < mid || b < hi) {\n        if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n        else buffer[w++] = work[b++];\n    }\n    for (int i = lo; i < hi; i++) work[i] = buffer[i];\n    return total;\n}\n\nint reversePairs(vector<int>& nums) {\n    vector<int> work = nums;\n    vector<int> buffer(work.size(), 0);\n    return rpSortCount(work, buffer, 0, (int) work.size());\n}`,
        c: `static int rpSortCount(int* work, int* buffer, int lo, int hi) {\n    if (hi - lo <= 1) return 0;\n    int mid = (lo + hi) / 2;\n    int total = rpSortCount(work, buffer, lo, mid) + rpSortCount(work, buffer, mid, hi);\n    int j = mid;\n    for (int i = lo; i < mid; i++) {\n        while (j < hi && (long long) work[i] > 2LL * work[j]) j++;\n        total += j - mid;\n    }\n    int a = lo, b = mid, w = lo;\n    while (a < mid || b < hi) {\n        if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n        else buffer[w++] = work[b++];\n    }\n    for (int i = lo; i < hi; i++) work[i] = buffer[i];\n    return total;\n}\n\nint reversePairs(int* nums, int numsSize) {\n    int* work = (int*) malloc((size_t) numsSize * sizeof(int));\n    int* buffer = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) work[i] = nums[i];\n    int answer = rpSortCount(work, buffer, 0, numsSize);\n    free(work);\n    free(buffer);\n    return answer;\n}`,
        csharp: `public static int ReversePairs(int[] nums)\n{\n    var work = (int[]) nums.Clone();\n    var buffer = new int[work.Length];\n    return RpSortCount(work, buffer, 0, work.Length);\n}\n\nprivate static int RpSortCount(int[] work, int[] buffer, int lo, int hi)\n{\n    if (hi - lo <= 1) return 0;\n    int mid = (lo + hi) / 2;\n    int total = RpSortCount(work, buffer, lo, mid) + RpSortCount(work, buffer, mid, hi);\n    int j = mid;\n    for (int i = lo; i < mid; i++)\n    {\n        while (j < hi && (long) work[i] > 2L * work[j]) j++;\n        total += j - mid;\n    }\n    int a = lo, b = mid, w = lo;\n    while (a < mid || b < hi)\n    {\n        if (b >= hi || (a < mid && work[a] <= work[b])) buffer[w++] = work[a++];\n        else buffer[w++] = work[b++];\n    }\n    for (int i = lo; i < hi; i++) work[i] = buffer[i];\n    return total;\n}`,
        go: `func reversePairs(nums []int) int {\n\twork := make([]int, len(nums))\n\tcopy(work, nums)\n\tbuffer := make([]int, len(nums))\n\tvar sortCount func(lo, hi int) int\n\tsortCount = func(lo, hi int) int {\n\t\tif hi-lo <= 1 {\n\t\t\treturn 0\n\t\t}\n\t\tmid := (lo + hi) / 2\n\t\ttotal := sortCount(lo, mid) + sortCount(mid, hi)\n\t\tj := mid\n\t\tfor i := lo; i < mid; i++ {\n\t\t\tfor j < hi && work[i] > 2*work[j] {\n\t\t\t\tj++\n\t\t\t}\n\t\t\ttotal += j - mid\n\t\t}\n\t\ta, b, w := lo, mid, lo\n\t\tfor a < mid || b < hi {\n\t\t\tif b >= hi || (a < mid && work[a] <= work[b]) {\n\t\t\t\tbuffer[w] = work[a]\n\t\t\t\ta++\n\t\t\t} else {\n\t\t\t\tbuffer[w] = work[b]\n\t\t\t\tb++\n\t\t\t}\n\t\t\tw++\n\t\t}\n\t\tfor i := lo; i < hi; i++ {\n\t\t\twork[i] = buffer[i]\n\t\t}\n\t\treturn total\n\t}\n\treturn sortCount(0, len(work))\n}`,
        kotlin: `fun reversePairs(nums: IntArray): Int {\n    val work = nums.copyOf()\n    val buffer = IntArray(work.size)\n    fun sortCount(lo: Int, hi: Int): Int {\n        if (hi - lo <= 1) return 0\n        val mid = (lo + hi) / 2\n        var total = sortCount(lo, mid) + sortCount(mid, hi)\n        var j = mid\n        for (i in lo until mid) {\n            while (j < hi && work[i].toLong() > 2L * work[j]) j++\n            total += j - mid\n        }\n        var a = lo\n        var b = mid\n        var w = lo\n        while (a < mid || b < hi) {\n            if (b >= hi || (a < mid && work[a] <= work[b])) {\n                buffer[w] = work[a]\n                a++\n            } else {\n                buffer[w] = work[b]\n                b++\n            }\n            w++\n        }\n        for (i in lo until hi) work[i] = buffer[i]\n        return total\n    }\n    return sortCount(0, work.size)\n}`,
        swift: `func reversePairs(_ nums: [Int]) -> Int {\n    var work = nums\n    var buffer = [Int](repeating: 0, count: nums.count)\n    func sortCount(_ lo: Int, _ hi: Int) -> Int {\n        if hi - lo <= 1 { return 0 }\n        let mid = (lo + hi) / 2\n        var total = sortCount(lo, mid) + sortCount(mid, hi)\n        var j = mid\n        for i in lo..<mid {\n            while j < hi && work[i] > 2 * work[j] { j += 1 }\n            total += j - mid\n        }\n        var a = lo\n        var b = mid\n        var w = lo\n        while a < mid || b < hi {\n            if b >= hi || (a < mid && work[a] <= work[b]) {\n                buffer[w] = work[a]\n                a += 1\n            } else {\n                buffer[w] = work[b]\n                b += 1\n            }\n            w += 1\n        }\n        for i in lo..<hi { work[i] = buffer[i] }\n        return total\n    }\n    return sortCount(0, work.count)\n}`,
        rust: `fn reversePairs(nums: Vec<i32>) -> i32 {\n    fn sort_count(work: &mut Vec<i32>, buffer: &mut Vec<i32>, lo: usize, hi: usize) -> i32 {\n        if hi - lo <= 1 {\n            return 0;\n        }\n        let mid = (lo + hi) / 2;\n        let mut total = sort_count(work, buffer, lo, mid) + sort_count(work, buffer, mid, hi);\n        let mut j = mid;\n        for i in lo..mid {\n            while j < hi && work[i] as i64 > 2i64 * work[j] as i64 {\n                j += 1;\n            }\n            total += (j - mid) as i32;\n        }\n        let (mut a, mut b, mut w) = (lo, mid, lo);\n        while a < mid || b < hi {\n            if b >= hi || (a < mid && work[a] <= work[b]) {\n                buffer[w] = work[a];\n                a += 1;\n            } else {\n                buffer[w] = work[b];\n                b += 1;\n            }\n            w += 1;\n        }\n        for i in lo..hi {\n            work[i] = buffer[i];\n        }\n        total\n    }\n    let mut work = nums.clone();\n    let mut buffer = vec![0i32; work.len()];\n    let n = work.len();\n    sort_count(&mut work, &mut buffer, 0, n)\n}`,
        php: `function rpSortCount(&$work, &$buffer, $lo, $hi) {\n    if ($hi - $lo <= 1) return 0;\n    $mid = intdiv($lo + $hi, 2);\n    $total = rpSortCount($work, $buffer, $lo, $mid) + rpSortCount($work, $buffer, $mid, $hi);\n    $j = $mid;\n    for ($i = $lo; $i < $mid; $i++) {\n        while ($j < $hi && $work[$i] > 2 * $work[$j]) $j++;\n        $total += $j - $mid;\n    }\n    $a = $lo; $b = $mid; $w = $lo;\n    while ($a < $mid || $b < $hi) {\n        if ($b >= $hi || ($a < $mid && $work[$a] <= $work[$b])) {\n            $buffer[$w++] = $work[$a++];\n        } else {\n            $buffer[$w++] = $work[$b++];\n        }\n    }\n    for ($i = $lo; $i < $hi; $i++) $work[$i] = $buffer[$i];\n    return $total;\n}\n\nfunction reversePairs($nums) {\n    $work = $nums;\n    $buffer = array_fill(0, count($nums), 0);\n    return rpSortCount($work, $buffer, 0, count($work));\n}`,
        ruby: `def reversePairs(nums)\n  work = nums.dup\n  buffer = Array.new(nums.length, 0)\n  sort_count = lambda do |lo, hi|\n    return 0 if hi - lo <= 1\n    mid = (lo + hi) / 2\n    total = sort_count.call(lo, mid) + sort_count.call(mid, hi)\n    j = mid\n    (lo...mid).each do |i|\n      j += 1 while j < hi && work[i] > 2 * work[j]\n      total += j - mid\n    end\n    a = lo\n    b = mid\n    w = lo\n    while a < mid || b < hi\n      if b >= hi || (a < mid && work[a] <= work[b])\n        buffer[w] = work[a]\n        a += 1\n      else\n        buffer[w] = work[b]\n        b += 1\n      end\n      w += 1\n    end\n    (lo...hi).each { |i| work[i] = buffer[i] }\n    total\n  end\n  sort_count.call(0, work.length)\nend`,
      },
    };
  })(),

  // ── Painting the Walls (LC 2742) ────────────────────────────────
  (() => {
    const ref = (cost: number[], time: number[]) => {
      const n = cost.length;
      const INF = 1000000000;
      const dp = new Array(n + 1).fill(INF);
      dp[0] = 0;
      for (let i = 0; i < n; i++) {
        const reach = time[i] + 1;
        for (let j = n; j >= 1; j--) {
          const prev = j - reach > 0 ? j - reach : 0;
          if (dp[prev] === INF) continue;
          const cand = dp[prev] + cost[i];
          if (cand < dp[j]) dp[j] = cand;
        }
      }
      return dp[n];
    };
    return {
      slug: "painting-the-walls",
      title: "Painting the Walls",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "paintWalls", params: [{ name: "cost", type: "int[]" as const }, { name: "time", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` walls. A **paid** painter takes `time[i]` units to paint wall `i` and charges `cost[i]`. A **free** painter paints any wall in 1 unit for nothing, but may only work while the paid painter is **busy**.\n\nReturn the minimum amount you must pay to get all `n` walls painted.",
        [
          { in: "cost = [1,2,3,2], time = [1,2,3,2]", out: "3", note: "Pay for walls 0 and 1 (2 + 1 = 3 units of time), letting the free painter cover the other two." },
          { in: "cost = [2,3,4,2], time = [1,1,1,1]", out: "4", note: "Pay for two walls of cost 2 each." },
          { in: "cost = [5], time = [1]", out: "5", note: "With one wall there is nothing for a free painter to do." },
        ],
        ["1 <= cost.length <= 500", "cost.length == time.length", "1 <= cost[i] <= 10^6", "1 <= time[i] <= 500"]),
      hints: [
        "Paying for wall `i` occupies `time[i]` units, during which the free painter finishes `time[i]` other walls.",
        "So choosing wall `i` \"covers\" `time[i] + 1` walls in total — itself plus the free ones.",
        "That is a knapsack: pick a subset whose total coverage reaches `n`, at minimum cost.",
      ],
      editorial: explain({
        idea: "Choosing to pay for wall `i` accounts for `time[i] + 1` walls: the one being painted plus the `time[i]` the free painter finishes meanwhile. The problem becomes a minimum-cost knapsack — cover at least `n` walls — with `dp[j]` the cheapest way to cover `j` of them.",
        steps: [
          "Set `dp[0] = 0` and everything else to infinity.",
          "For each wall `i`, sweep `j` from `n` down to 1 and relax `dp[j]` with `dp[max(0, j - (time[i] + 1))] + cost[i]`.",
          "Return `dp[n]`.",
        ],
        why: "Clamping the predecessor index at 0 is what turns \"at least\" into \"exactly\": over-covering is free, so any surplus collapses into the `dp[0]` bucket rather than being lost. And the downward sweep is the standard 0/1 knapsack discipline — sweeping upward would let one paid wall be chosen twice, which the painter cannot do.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "The coverage is `time[i] + 1`, not `time[i]` — the paid wall counts itself.",
          "The `j` loop must run downward, or a wall is reused.",
          "The free painter is idle unless the paid one is working, so at least one wall must always be paid for.",
        ],
      }),
      examples: [
        { input: "[1,2,3,2]\n[1,2,3,2]", expectedOutput: "3" },
        { input: "[2,3,4,2]\n[1,1,1,1]", expectedOutput: "4" },
        { input: "[5]\n[1]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const cost = Array.from({ length: n }, () => ri(rng, 1, 30));
        const time = Array.from({ length: n }, () => ri(rng, 1, 5));
        return { input: `${fmtIntArr(cost)}\n${fmtIntArr(time)}`, expectedOutput: String(ref(cost, time)) };
      },
      solutions: {
        python: `from typing import List\n\ndef paintWalls(cost: List[int], time: List[int]) -> int:\n    n = len(cost)\n    INF = 10**9\n    dp = [INF] * (n + 1)\n    dp[0] = 0\n    for i in range(n):\n        reach = time[i] + 1\n        for j in range(n, 0, -1):\n            prev = max(0, j - reach)\n            if dp[prev] == INF:\n                continue\n            dp[j] = min(dp[j], dp[prev] + cost[i])\n    return dp[n]`,
        javascript: `var paintWalls = function(cost, time) {\n    var n = cost.length, INF = 1000000000, j;\n    var dp = [];\n    for (j = 0; j <= n; j++) dp.push(INF);\n    dp[0] = 0;\n    for (var i = 0; i < n; i++) {\n        var reach = time[i] + 1;\n        for (j = n; j >= 1; j--) {\n            var prev = j - reach > 0 ? j - reach : 0;\n            if (dp[prev] === INF) continue;\n            var cand = dp[prev] + cost[i];\n            if (cand < dp[j]) dp[j] = cand;\n        }\n    }\n    return dp[n];\n};`,
        typescript: `function paintWalls(cost: number[], time: number[]): number {\n    var n = cost.length, INF = 1000000000, j: number;\n    var dp: number[] = [];\n    for (j = 0; j <= n; j++) dp.push(INF);\n    dp[0] = 0;\n    for (var i = 0; i < n; i++) {\n        var reach = time[i] + 1;\n        for (j = n; j >= 1; j--) {\n            var prev = j - reach > 0 ? j - reach : 0;\n            if (dp[prev] === INF) continue;\n            var cand = dp[prev] + cost[i];\n            if (cand < dp[j]) dp[j] = cand;\n        }\n    }\n    return dp[n];\n}`,
        java: `public static int paintWalls(int[] cost, int[] time) {\n    int n = cost.length;\n    final int INF = 1000000000;\n    int[] dp = new int[n + 1];\n    Arrays.fill(dp, INF);\n    dp[0] = 0;\n    for (int i = 0; i < n; i++) {\n        int reach = time[i] + 1;\n        for (int j = n; j >= 1; j--) {\n            int prev = Math.max(0, j - reach);\n            if (dp[prev] == INF) continue;\n            dp[j] = Math.min(dp[j], dp[prev] + cost[i]);\n        }\n    }\n    return dp[n];\n}`,
        cpp: `int paintWalls(vector<int>& cost, vector<int>& time) {\n    int n = (int) cost.size();\n    const int INF = 1000000000;\n    vector<int> dp(n + 1, INF);\n    dp[0] = 0;\n    for (int i = 0; i < n; i++) {\n        int reach = time[i] + 1;\n        for (int j = n; j >= 1; j--) {\n            int prev = max(0, j - reach);\n            if (dp[prev] == INF) continue;\n            dp[j] = min(dp[j], dp[prev] + cost[i]);\n        }\n    }\n    return dp[n];\n}`,
        c: `int paintWalls(int* cost, int costSize, int* time, int timeSize) {\n    (void) timeSize;\n    int n = costSize;\n    const int INF = 1000000000;\n    int* dp = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int j = 0; j <= n; j++) dp[j] = INF;\n    dp[0] = 0;\n    for (int i = 0; i < n; i++) {\n        int reach = time[i] + 1;\n        for (int j = n; j >= 1; j--) {\n            int prev = j - reach > 0 ? j - reach : 0;\n            if (dp[prev] == INF) continue;\n            int cand = dp[prev] + cost[i];\n            if (cand < dp[j]) dp[j] = cand;\n        }\n    }\n    int answer = dp[n];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int PaintWalls(int[] cost, int[] time)\n{\n    int n = cost.Length;\n    const int INF = 1000000000;\n    var dp = new int[n + 1];\n    for (int j = 0; j <= n; j++) dp[j] = INF;\n    dp[0] = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int reach = time[i] + 1;\n        for (int j = n; j >= 1; j--)\n        {\n            int prev = Math.Max(0, j - reach);\n            if (dp[prev] == INF) continue;\n            dp[j] = Math.Min(dp[j], dp[prev] + cost[i]);\n        }\n    }\n    return dp[n];\n}`,
        go: `func paintWalls(cost []int, time []int) int {\n\tn := len(cost)\n\tconst INF = 1000000000\n\tdp := make([]int, n+1)\n\tfor j := range dp {\n\t\tdp[j] = INF\n\t}\n\tdp[0] = 0\n\tfor i := 0; i < n; i++ {\n\t\treach := time[i] + 1\n\t\tfor j := n; j >= 1; j-- {\n\t\t\tprev := j - reach\n\t\t\tif prev < 0 {\n\t\t\t\tprev = 0\n\t\t\t}\n\t\t\tif dp[prev] == INF {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif cand := dp[prev] + cost[i]; cand < dp[j] {\n\t\t\t\tdp[j] = cand\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n]\n}`,
        kotlin: `fun paintWalls(cost: IntArray, time: IntArray): Int {\n    val n = cost.size\n    val INF = 1000000000\n    val dp = IntArray(n + 1) { INF }\n    dp[0] = 0\n    for (i in 0 until n) {\n        val reach = time[i] + 1\n        for (j in n downTo 1) {\n            val prev = maxOf(0, j - reach)\n            if (dp[prev] == INF) continue\n            dp[j] = minOf(dp[j], dp[prev] + cost[i])\n        }\n    }\n    return dp[n]\n}`,
        swift: `func paintWalls(_ cost: [Int], _ time: [Int]) -> Int {\n    let n = cost.count\n    let INF = 1000000000\n    var dp = [Int](repeating: INF, count: n + 1)\n    dp[0] = 0\n    for i in 0..<n {\n        let reach = time[i] + 1\n        var j = n\n        while j >= 1 {\n            let prev = max(0, j - reach)\n            if dp[prev] != INF {\n                dp[j] = min(dp[j], dp[prev] + cost[i])\n            }\n            j -= 1\n        }\n    }\n    return dp[n]\n}`,
        rust: `fn paintWalls(cost: Vec<i32>, time: Vec<i32>) -> i32 {\n    let n = cost.len();\n    const INF: i32 = 1000000000;\n    let mut dp = vec![INF; n + 1];\n    dp[0] = 0;\n    for i in 0..n {\n        let reach = (time[i] + 1) as usize;\n        for j in (1..=n).rev() {\n            let prev = if j > reach { j - reach } else { 0 };\n            if dp[prev] == INF {\n                continue;\n            }\n            let cand = dp[prev] + cost[i];\n            if cand < dp[j] {\n                dp[j] = cand;\n            }\n        }\n    }\n    dp[n]\n}`,
        php: `function paintWalls($cost, $time) {\n    $n = count($cost);\n    $INF = 1000000000;\n    $dp = array_fill(0, $n + 1, $INF);\n    $dp[0] = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $reach = $time[$i] + 1;\n        for ($j = $n; $j >= 1; $j--) {\n            $prev = max(0, $j - $reach);\n            if ($dp[$prev] === $INF) continue;\n            $cand = $dp[$prev] + $cost[$i];\n            if ($cand < $dp[$j]) $dp[$j] = $cand;\n        }\n    }\n    return $dp[$n];\n}`,
        ruby: `def paintWalls(cost, time)\n  n = cost.length\n  inf = 1000000000\n  dp = Array.new(n + 1, inf)\n  dp[0] = 0\n  (0...n).each do |i|\n    reach = time[i] + 1\n    n.downto(1) do |j|\n      prev = [0, j - reach].max\n      next if dp[prev] == inf\n      cand = dp[prev] + cost[i]\n      dp[j] = cand if cand < dp[j]\n    end\n  end\n  dp[n]\nend`,
      },
    };
  })(),

  // ── Create Sorted Array Through Instructions (LC 1649) ──────────
  (() => {
    const ref = (instructions: number[]) => {
      let maxv = 0;
      for (let i = 0; i < instructions.length; i++) if (instructions[i] > maxv) maxv = instructions[i];
      const tree = new Array(maxv + 1).fill(0);
      const add = (i: number) => { for (let x = i; x <= maxv; x += x & -x) tree[x]++; };
      const query = (i: number) => { let s = 0; for (let x = i; x > 0; x -= x & -x) s += tree[x]; return s; };
      let total = 0;
      for (let i = 0; i < instructions.length; i++) {
        const v = instructions[i];
        const less = query(v - 1);
        const greater = i - query(v);
        total = (total + (less < greater ? less : greater)) % MODX;
        add(v);
      }
      return total;
    };
    return {
      slug: "create-sorted-array-through-instructions",
      title: "Create Sorted Array Through Instructions",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Divide and Conquer", "Binary Indexed Tree", "Segment Tree", "Merge Sort", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "createSortedArray", params: [{ name: "instructions", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Insert the values of `instructions` one at a time, left to right, into an initially empty array that is always kept **sorted**. Inserting a value costs the **minimum** of:\n\n- the number of already-inserted elements **strictly less** than it, and\n- the number **strictly greater** than it.\n\nReturn the total cost, **modulo 10⁹ + 7**.",
        [
          { in: "instructions = [1,5,6,2]", out: "1", note: "Only inserting 2 costs anything: one element is smaller, two are larger." },
          { in: "instructions = [1,2,3,6,5,4]", out: "3", note: "0 + 0 + 0 + 0 + 1 + 2." },
          { in: "instructions = [1,3,3,3,2,4,2,1,2]", out: "4", note: "Equal values cost nothing against each other." },
        ],
        ["1 <= instructions.length <= 10^5", "1 <= instructions[i] <= 10^5"]),
      hints: [
        "Both counts are order-statistics over the values inserted so far.",
        "A Fenwick (binary indexed) tree over the **value** range answers \"how many are at most v\" in O(log V).",
        "Elements equal to the new value count as neither smaller nor larger.",
      ],
      editorial: explain({
        idea: "Keep a Fenwick tree indexed by value, counting how many of each value have been inserted. For a new value `v`, the smaller count is `query(v - 1)` and the larger count is `i - query(v)` where `i` is how many have been inserted; add the minimum and then record `v`.",
        steps: [
          "Size the tree to the maximum value in `instructions`.",
          "For each value in order: compute `less = query(v - 1)` and `greater = i - query(v)`.",
          "Add `min(less, greater)` to the running total modulo 10⁹ + 7.",
          "Insert `v` into the tree.",
        ],
        why: "Using `i - query(v)` rather than `query(maxV) - query(v)` is the detail that makes equal values behave: `query(v)` includes the copies equal to `v`, so subtracting it from the insertion count leaves exactly the strictly-greater ones. A merge-sort counting pass computes the same thing offline, but the Fenwick tree keeps the cost available at the moment each insertion happens, which is what the running total needs.",
        time: "O(n log V)",
        space: "O(V)",
        pitfalls: [
          "Both counts are **strict**, so equal values must be excluded from each.",
          "The total exceeds a 32-bit integer before the modulo — reduce as you accumulate.",
          "The Fenwick tree is indexed by value, not by position.",
        ],
      }),
      examples: [
        { input: "[1,5,6,2]", expectedOutput: "1" },
        { input: "[1,2,3,6,5,4]", expectedOutput: "3" },
        { input: "[1,3,3,3,2,4,2,1,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const instructions = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: fmtIntArr(instructions), expectedOutput: String(ref(instructions)) };
      },
      solutions: {
        python: `from typing import List\n\ndef createSortedArray(instructions: List[int]) -> int:\n    MOD = 10**9 + 7\n    maxv = max(instructions)\n    tree = [0] * (maxv + 1)\n\n    def add(i: int) -> None:\n        while i <= maxv:\n            tree[i] += 1\n            i += i & -i\n\n    def query(i: int) -> int:\n        s = 0\n        while i > 0:\n            s += tree[i]\n            i -= i & -i\n        return s\n\n    total = 0\n    for i, v in enumerate(instructions):\n        total = (total + min(query(v - 1), i - query(v))) % MOD\n        add(v)\n    return total`,
        javascript: `var createSortedArray = function(instructions) {\n    var MOD = 1000000007, i;\n    var maxv = 0;\n    for (i = 0; i < instructions.length; i++) if (instructions[i] > maxv) maxv = instructions[i];\n    var tree = [];\n    for (i = 0; i <= maxv; i++) tree.push(0);\n    var add = function(idx) {\n        for (var x = idx; x <= maxv; x += x & (-x)) tree[x]++;\n    };\n    var query = function(idx) {\n        var s = 0;\n        for (var x = idx; x > 0; x -= x & (-x)) s += tree[x];\n        return s;\n    };\n    var total = 0;\n    for (i = 0; i < instructions.length; i++) {\n        var v = instructions[i];\n        var less = query(v - 1);\n        var greater = i - query(v);\n        total = (total + (less < greater ? less : greater)) % MOD;\n        add(v);\n    }\n    return total;\n};`,
        typescript: `function createSortedArray(instructions: number[]): number {\n    var MOD = 1000000007, i: number;\n    var maxv = 0;\n    for (i = 0; i < instructions.length; i++) if (instructions[i] > maxv) maxv = instructions[i];\n    var tree: number[] = [];\n    for (i = 0; i <= maxv; i++) tree.push(0);\n    var add = function(idx: number) {\n        for (var x = idx; x <= maxv; x += x & (-x)) tree[x]++;\n    };\n    var query = function(idx: number): number {\n        var s = 0;\n        for (var x = idx; x > 0; x -= x & (-x)) s += tree[x];\n        return s;\n    };\n    var total = 0;\n    for (i = 0; i < instructions.length; i++) {\n        var v = instructions[i];\n        var less = query(v - 1);\n        var greater = i - query(v);\n        total = (total + (less < greater ? less : greater)) % MOD;\n        add(v);\n    }\n    return total;\n}`,
        java: `public static int createSortedArray(int[] instructions) {\n    final int MOD = 1000000007;\n    int maxv = 0;\n    for (int v : instructions) maxv = Math.max(maxv, v);\n    int[] tree = new int[maxv + 1];\n    int total = 0;\n    for (int i = 0; i < instructions.length; i++) {\n        int v = instructions[i];\n        int less = csaQuery(tree, v - 1);\n        int greater = i - csaQuery(tree, v);\n        total = (total + Math.min(less, greater)) % MOD;\n        for (int x = v; x <= maxv; x += x & (-x)) tree[x]++;\n    }\n    return total;\n}\n\nprivate static int csaQuery(int[] tree, int idx) {\n    int s = 0;\n    for (int x = idx; x > 0; x -= x & (-x)) s += tree[x];\n    return s;\n}`,
        cpp: `static int csaQuery(vector<int>& tree, int idx) {\n    int s = 0;\n    for (int x = idx; x > 0; x -= x & (-x)) s += tree[x];\n    return s;\n}\n\nint createSortedArray(vector<int>& instructions) {\n    const int MOD = 1000000007;\n    int maxv = 0;\n    for (int v : instructions) maxv = max(maxv, v);\n    vector<int> tree(maxv + 1, 0);\n    int total = 0;\n    for (int i = 0; i < (int) instructions.size(); i++) {\n        int v = instructions[i];\n        int less = csaQuery(tree, v - 1);\n        int greater = i - csaQuery(tree, v);\n        total = (total + min(less, greater)) % MOD;\n        for (int x = v; x <= maxv; x += x & (-x)) tree[x]++;\n    }\n    return total;\n}`,
        c: `static int csaQuery(int* tree, int idx) {\n    int s = 0;\n    for (int x = idx; x > 0; x -= x & (-x)) s += tree[x];\n    return s;\n}\n\nint createSortedArray(int* instructions, int instructionsSize) {\n    const int MOD = 1000000007;\n    int maxv = 0;\n    for (int i = 0; i < instructionsSize; i++) {\n        if (instructions[i] > maxv) maxv = instructions[i];\n    }\n    int* tree = (int*) calloc((size_t) (maxv + 1), sizeof(int));\n    int total = 0;\n    for (int i = 0; i < instructionsSize; i++) {\n        int v = instructions[i];\n        int less = csaQuery(tree, v - 1);\n        int greater = i - csaQuery(tree, v);\n        int cost = less < greater ? less : greater;\n        total = (total + cost) % MOD;\n        for (int x = v; x <= maxv; x += x & (-x)) tree[x]++;\n    }\n    free(tree);\n    return total;\n}`,
        csharp: `public static int CreateSortedArray(int[] instructions)\n{\n    const int MOD = 1000000007;\n    int maxv = 0;\n    foreach (var v in instructions) maxv = Math.Max(maxv, v);\n    var tree = new int[maxv + 1];\n    int total = 0;\n    for (int i = 0; i < instructions.Length; i++)\n    {\n        int v = instructions[i];\n        int less = CsaQuery(tree, v - 1);\n        int greater = i - CsaQuery(tree, v);\n        total = (total + Math.Min(less, greater)) % MOD;\n        for (int x = v; x <= maxv; x += x & (-x)) tree[x]++;\n    }\n    return total;\n}\n\nprivate static int CsaQuery(int[] tree, int idx)\n{\n    int s = 0;\n    for (int x = idx; x > 0; x -= x & (-x)) s += tree[x];\n    return s;\n}`,
        go: `func createSortedArray(instructions []int) int {\n\tconst MOD = 1000000007\n\tmaxv := 0\n\tfor _, v := range instructions {\n\t\tif v > maxv {\n\t\t\tmaxv = v\n\t\t}\n\t}\n\ttree := make([]int, maxv+1)\n\tquery := func(idx int) int {\n\t\ts := 0\n\t\tfor x := idx; x > 0; x -= x & (-x) {\n\t\t\ts += tree[x]\n\t\t}\n\t\treturn s\n\t}\n\ttotal := 0\n\tfor i, v := range instructions {\n\t\tless := query(v - 1)\n\t\tgreater := i - query(v)\n\t\tcost := less\n\t\tif greater < cost {\n\t\t\tcost = greater\n\t\t}\n\t\ttotal = (total + cost) % MOD\n\t\tfor x := v; x <= maxv; x += x & (-x) {\n\t\t\ttree[x]++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun createSortedArray(instructions: IntArray): Int {\n    val mod = 1000000007\n    var maxv = 0\n    for (v in instructions) if (v > maxv) maxv = v\n    val tree = IntArray(maxv + 1)\n    fun query(idx: Int): Int {\n        var s = 0\n        var x = idx\n        while (x > 0) {\n            s += tree[x]\n            x -= x and (-x)\n        }\n        return s\n    }\n    var total = 0\n    for (i in instructions.indices) {\n        val v = instructions[i]\n        val less = query(v - 1)\n        val greater = i - query(v)\n        total = (total + minOf(less, greater)) % mod\n        var x = v\n        while (x <= maxv) {\n            tree[x]++\n            x += x and (-x)\n        }\n    }\n    return total\n}`,
        swift: `func createSortedArray(_ instructions: [Int]) -> Int {\n    let mod = 1000000007\n    var maxv = 0\n    for v in instructions where v > maxv { maxv = v }\n    var tree = [Int](repeating: 0, count: maxv + 1)\n    func query(_ idx: Int) -> Int {\n        var s = 0\n        var x = idx\n        while x > 0 {\n            s += tree[x]\n            x -= x & (-x)\n        }\n        return s\n    }\n    var total = 0\n    for (i, v) in instructions.enumerated() {\n        let less = query(v - 1)\n        let greater = i - query(v)\n        total = (total + min(less, greater)) % mod\n        var x = v\n        while x <= maxv {\n            tree[x] += 1\n            x += x & (-x)\n        }\n    }\n    return total\n}`,
        rust: `fn createSortedArray(instructions: Vec<i32>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let maxv = *instructions.iter().max().unwrap() as usize;\n    let mut tree = vec![0i32; maxv + 1];\n    fn query(tree: &Vec<i32>, idx: i32) -> i32 {\n        let mut s = 0;\n        let mut x = idx;\n        while x > 0 {\n            s += tree[x as usize];\n            x -= x & (-x);\n        }\n        s\n    }\n    let mut total: i64 = 0;\n    for (i, &v) in instructions.iter().enumerate() {\n        let less = query(&tree, v - 1);\n        let greater = i as i32 - query(&tree, v);\n        total = (total + less.min(greater) as i64) % MOD;\n        let mut x = v;\n        while (x as usize) <= maxv {\n            tree[x as usize] += 1;\n            x += x & (-x);\n        }\n    }\n    total as i32\n}`,
        php: `function createSortedArray($instructions) {\n    $MOD = 1000000007;\n    $maxv = max($instructions);\n    $tree = array_fill(0, $maxv + 1, 0);\n    $total = 0;\n    foreach ($instructions as $i => $v) {\n        $less = 0;\n        for ($x = $v - 1; $x > 0; $x -= $x & (-$x)) $less += $tree[$x];\n        $atMost = 0;\n        for ($x = $v; $x > 0; $x -= $x & (-$x)) $atMost += $tree[$x];\n        $greater = $i - $atMost;\n        $total = ($total + min($less, $greater)) % $MOD;\n        for ($x = $v; $x <= $maxv; $x += $x & (-$x)) $tree[$x]++;\n    }\n    return $total;\n}`,
        ruby: `def createSortedArray(instructions)\n  mod = 1000000007\n  maxv = instructions.max\n  tree = Array.new(maxv + 1, 0)\n  query = lambda do |idx|\n    s = 0\n    x = idx\n    while x > 0\n      s += tree[x]\n      x -= x & (-x)\n    end\n    s\n  end\n  total = 0\n  instructions.each_with_index do |v, i|\n    less = query.call(v - 1)\n    greater = i - query.call(v)\n    total = (total + [less, greater].min) % mod\n    x = v\n    while x <= maxv\n      tree[x] += 1\n      x += x & (-x)\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Replacements to Sort the Array (LC 2366) ────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let limit = nums[n - 1], ops = 0;
      for (let i = n - 2; i >= 0; i--) {
        const parts = Math.ceil(nums[i] / limit);
        ops += parts - 1;
        limit = Math.floor(nums[i] / parts);
      }
      return ops;
    };
    return {
      slug: "minimum-replacements-to-sort-the-array",
      title: "Minimum Replacements to Sort the Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Greedy", "Google", "Amazon", "Meta"],
      signature: { funcName: "minimumReplacement", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "In one operation you may replace any element with **two** positive integers that sum to it, inserted in its place.\n\nReturn the minimum number of operations that makes `nums` **non-decreasing**.",
        [
          { in: "nums = [3,9,3]", out: "2", note: "Split the 9 into `3,3,3`, giving `[3,3,3,3,3]` in two operations." },
          { in: "nums = [1,2,3,4,5]", out: "0", note: "Already non-decreasing." },
          { in: "nums = [10,4]", out: "2", note: "Split the 10 into `3,3,4`." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Work **right to left**: the last element is fixed, and everything to its left must end no larger than the smallest piece to its right.",
        "To split `v` so every piece is at most `limit`, you need `ceil(v / limit)` pieces — and that is `pieces - 1` operations.",
        "Splitting as evenly as possible maximises the smallest piece, which is `floor(v / pieces)` — and that becomes the new limit.",
      ],
      editorial: explain({
        idea: "Sweep right to left carrying `limit`, the largest value the current element's pieces may take. Splitting `v` into `p = ceil(v / limit)` pieces costs `p - 1` operations, and the best achievable smallest piece is `floor(v / p)`, which becomes the limit for the element to its left.",
        steps: [
          "Start with `limit = nums[n-1]` and `ops = 0`.",
          "For `i` from `n-2` down to 0: set `p = ceil(nums[i] / limit)`, add `p - 1` to `ops`.",
          "Update `limit = floor(nums[i] / p)`.",
          "Return `ops`.",
        ],
        why: "Two greedy facts carry it. First, `ceil(v / limit)` is the fewest pieces that can all fit under `limit` — fewer pieces would force one above it. Second, given that piece count, splitting as evenly as possible makes the **smallest** piece as large as it can be, and only the smallest piece constrains what comes further left. Sweeping left to right cannot work, because the pieces you choose depend on what follows.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The direction matters: the rightmost element is never split.",
          "The new limit is `floor(v / p)`, not `limit` — an even split may leave headroom.",
          "At the upstream bounds the answer exceeds a 32-bit integer; here the constraints keep it inside one.",
        ],
      }),
      examples: [
        { input: "[3,9,3]", expectedOutput: "2" },
        { input: "[1,2,3,4,5]", expectedOutput: "0" },
        { input: "[10,4]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 40));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumReplacement(nums: List[int]) -> int:\n    limit = nums[-1]\n    ops = 0\n    for i in range(len(nums) - 2, -1, -1):\n        parts = -(-nums[i] // limit)\n        ops += parts - 1\n        limit = nums[i] // parts\n    return ops`,
        javascript: `var minimumReplacement = function(nums) {\n    var n = nums.length;\n    var limit = nums[n - 1], ops = 0;\n    for (var i = n - 2; i >= 0; i--) {\n        var parts = Math.ceil(nums[i] / limit);\n        ops += parts - 1;\n        limit = Math.floor(nums[i] / parts);\n    }\n    return ops;\n};`,
        typescript: `function minimumReplacement(nums: number[]): number {\n    var n = nums.length;\n    var limit = nums[n - 1], ops = 0;\n    for (var i = n - 2; i >= 0; i--) {\n        var parts = Math.ceil(nums[i] / limit);\n        ops += parts - 1;\n        limit = Math.floor(nums[i] / parts);\n    }\n    return ops;\n}`,
        java: `public static int minimumReplacement(int[] nums) {\n    int n = nums.length;\n    int limit = nums[n - 1];\n    int ops = 0;\n    for (int i = n - 2; i >= 0; i--) {\n        int parts = (nums[i] + limit - 1) / limit;\n        ops += parts - 1;\n        limit = nums[i] / parts;\n    }\n    return ops;\n}`,
        cpp: `int minimumReplacement(vector<int>& nums) {\n    int n = (int) nums.size();\n    int limit = nums[n - 1];\n    int ops = 0;\n    for (int i = n - 2; i >= 0; i--) {\n        int parts = (nums[i] + limit - 1) / limit;\n        ops += parts - 1;\n        limit = nums[i] / parts;\n    }\n    return ops;\n}`,
        c: `int minimumReplacement(int* nums, int numsSize) {\n    int n = numsSize;\n    int limit = nums[n - 1];\n    int ops = 0;\n    for (int i = n - 2; i >= 0; i--) {\n        int parts = (nums[i] + limit - 1) / limit;\n        ops += parts - 1;\n        limit = nums[i] / parts;\n    }\n    return ops;\n}`,
        csharp: `public static int MinimumReplacement(int[] nums)\n{\n    int n = nums.Length;\n    int limit = nums[n - 1];\n    int ops = 0;\n    for (int i = n - 2; i >= 0; i--)\n    {\n        int parts = (nums[i] + limit - 1) / limit;\n        ops += parts - 1;\n        limit = nums[i] / parts;\n    }\n    return ops;\n}`,
        go: `func minimumReplacement(nums []int) int {\n\tn := len(nums)\n\tlimit := nums[n-1]\n\tops := 0\n\tfor i := n - 2; i >= 0; i-- {\n\t\tparts := (nums[i] + limit - 1) / limit\n\t\tops += parts - 1\n\t\tlimit = nums[i] / parts\n\t}\n\treturn ops\n}`,
        kotlin: `fun minimumReplacement(nums: IntArray): Int {\n    val n = nums.size\n    var limit = nums[n - 1]\n    var ops = 0\n    for (i in n - 2 downTo 0) {\n        val parts = (nums[i] + limit - 1) / limit\n        ops += parts - 1\n        limit = nums[i] / parts\n    }\n    return ops\n}`,
        swift: `func minimumReplacement(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var limit = nums[n - 1]\n    var ops = 0\n    var i = n - 2\n    while i >= 0 {\n        let parts = (nums[i] + limit - 1) / limit\n        ops += parts - 1\n        limit = nums[i] / parts\n        i -= 1\n    }\n    return ops\n}`,
        rust: `fn minimumReplacement(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut limit = nums[n - 1];\n    let mut ops = 0;\n    for i in (0..n - 1).rev() {\n        let parts = (nums[i] + limit - 1) / limit;\n        ops += parts - 1;\n        limit = nums[i] / parts;\n    }\n    ops\n}`,
        php: `function minimumReplacement($nums) {\n    $n = count($nums);\n    $limit = $nums[$n - 1];\n    $ops = 0;\n    for ($i = $n - 2; $i >= 0; $i--) {\n        $parts = intdiv($nums[$i] + $limit - 1, $limit);\n        $ops += $parts - 1;\n        $limit = intdiv($nums[$i], $parts);\n    }\n    return $ops;\n}`,
        ruby: `def minimumReplacement(nums)\n  limit = nums[-1]\n  ops = 0\n  (nums.length - 2).downto(0) do |i|\n    parts = (nums[i] + limit - 1) / limit\n    ops += parts - 1\n    limit = nums[i] / parts\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Maximum Number of Events That Can Be Attended II (LC 1751) ──
  (() => {
    const ref = (events: number[][], k: number) => {
      const sorted = events.slice().sort((a, b) => a[0] - b[0]);
      const n = sorted.length;
      // nextFree[i] = first event starting after event i ends.
      const nextFree = new Array(n).fill(n);
      for (let i = 0; i < n; i++) {
        let lo = i + 1, hi = n;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (sorted[mid][0] > sorted[i][1]) hi = mid; else lo = mid + 1;
        }
        nextFree[i] = lo;
      }
      const dp: number[][] = [];
      for (let i = 0; i <= n; i++) dp.push(new Array(k + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = 1; j <= k; j++) {
          const skip = dp[i + 1][j];
          const take = sorted[i][2] + dp[nextFree[i]][j - 1];
          dp[i][j] = skip > take ? skip : take;
        }
      }
      return dp[0][k];
    };
    return {
      slug: "maximum-number-of-events-that-can-be-attended-ii",
      title: "Maximum Number of Events That Can Be Attended II",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maxValue", params: [{ name: "events", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`events[i] = [start, end, value]` describes an event running from day `start` to day `end` **inclusive**, worth `value`. Attending an event means attending it in full, and you cannot attend two events that share **any** day — the next event must start **strictly after** the previous one ends.\n\nAttend at most `k` events and return the maximum total value.",
        [
          { in: "events = [[1,2,4],[3,4,3],[2,3,1]], k = 2", out: "7", note: "Attend `[1,2,4]` and `[3,4,3]`." },
          { in: "events = [[1,2,4],[3,4,3],[2,3,10]], k = 2", out: "10", note: "The single event worth 10 beats any pair." },
          { in: "events = [[1,1,1],[2,2,2],[3,3,3],[4,4,4]], k = 3", out: "9", note: "Take the three most valuable." },
        ],
        ["1 <= k <= events.length <= 10^6", "1 <= k * events.length <= 10^6", "1 <= starti <= endi <= 10^9", "1 <= valuei <= 10^6"]),
      hints: [
        "Sort the events by start day, then the choice at each event is simply take or skip.",
        "Taking event `i` jumps to the first event starting after `end[i]` — a binary search.",
        "`dp[i][j]` = the best value from event `i` onward using at most `j` attendances.",
      ],
      editorial: explain({
        idea: "Sort by start day. For each event precompute `nextFree[i]`, the index of the first event starting strictly after event `i` ends. Then `dp[i][j] = max(dp[i+1][j], value[i] + dp[nextFree[i]][j-1])` — skip or take.",
        steps: [
          "Sort the events by start day.",
          "Binary-search each `nextFree[i]` over the sorted starts.",
          "Fill `dp` backwards over `i` and forwards over `j`, taking the better of skip and take.",
          "Return `dp[0][k]`.",
        ],
        why: "Sorting by start is what makes `nextFree` a forward jump rather than a search over the whole set — every compatible successor lies in a contiguous suffix, so one binary search names the whole set of them. The `j - 1` on the take branch is the attendance budget, which is why the DP needs two dimensions rather than the single one a plain weighted-interval-scheduling problem would use.",
        time: "O(n log n + n · k)",
        space: "O(n · k)",
        pitfalls: [
          "The events are inclusive at both ends, so the successor must start **strictly after** the end day.",
          "Sorting by end day instead makes the jump index wrong.",
          "At most `k` — fewer is allowed, which the skip branch already covers.",
        ],
      }),
      examples: [
        { input: "[[1,2,4],[3,4,3],[2,3,1]]\n2", expectedOutput: "7" },
        { input: "[[1,2,4],[3,4,3],[2,3,10]]\n2", expectedOutput: "10" },
        { input: "[[1,1,1],[2,2,2],[3,3,3],[4,4,4]]\n3", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const events = Array.from({ length: n }, () => {
          const start = ri(rng, 1, 10);
          return [start, ri(rng, start, Math.min(12, start + 3)), ri(rng, 1, 20)];
        });
        const k = ri(rng, 1, n);
        return { input: `${fmtIntMat(events)}\n${k}`, expectedOutput: String(ref(events, k)) };
      },
      solutions: {
        python: `from bisect import bisect_right\nfrom typing import List\n\ndef maxValue(events: List[List[int]], k: int) -> int:\n    events = sorted(events)\n    n = len(events)\n    starts = [e[0] for e in events]\n    next_free = [bisect_right(starts, e[1]) for e in events]\n    dp = [[0] * (k + 1) for _ in range(n + 1)]\n    for i in range(n - 1, -1, -1):\n        for j in range(1, k + 1):\n            dp[i][j] = max(dp[i + 1][j], events[i][2] + dp[next_free[i]][j - 1])\n    return dp[0][k]`,
        javascript: `var maxValue = function(events, k) {\n    var sorted = events.slice();\n    sorted.sort(function(a, b) { return a[0] - b[0]; });\n    var n = sorted.length, i, j;\n    var nextFree = [];\n    for (i = 0; i < n; i++) {\n        var lo = i + 1, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (sorted[mid][0] > sorted[i][1]) hi = mid; else lo = mid + 1;\n        }\n        nextFree.push(lo);\n    }\n    var dp = [];\n    for (i = 0; i <= n; i++) {\n        var row = [];\n        for (j = 0; j <= k; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (j = 1; j <= k; j++) {\n            var skip = dp[i + 1][j];\n            var take = sorted[i][2] + dp[nextFree[i]][j - 1];\n            dp[i][j] = skip > take ? skip : take;\n        }\n    }\n    return dp[0][k];\n};`,
        typescript: `function maxValue(events: number[][], k: number): number {\n    var sorted = events.slice();\n    sorted.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });\n    var n = sorted.length, i: number, j: number;\n    var nextFree: number[] = [];\n    for (i = 0; i < n; i++) {\n        var lo = i + 1, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (sorted[mid][0] > sorted[i][1]) hi = mid; else lo = mid + 1;\n        }\n        nextFree.push(lo);\n    }\n    var dp: number[][] = [];\n    for (i = 0; i <= n; i++) {\n        var row: number[] = [];\n        for (j = 0; j <= k; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (j = 1; j <= k; j++) {\n            var skip = dp[i + 1][j];\n            var take = sorted[i][2] + dp[nextFree[i]][j - 1];\n            dp[i][j] = skip > take ? skip : take;\n        }\n    }\n    return dp[0][k];\n}`,
        java: `public static int maxValue(int[][] events, int k) {\n    int[][] sorted = events.clone();\n    Arrays.sort(sorted, (a, b) -> a[0] - b[0]);\n    int n = sorted.length;\n    int[] nextFree = new int[n];\n    for (int i = 0; i < n; i++) {\n        int lo = i + 1, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) >>> 1;\n            if (sorted[mid][0] > sorted[i][1]) hi = mid;\n            else lo = mid + 1;\n        }\n        nextFree[i] = lo;\n    }\n    int[][] dp = new int[n + 1][k + 1];\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 1; j <= k; j++) {\n            dp[i][j] = Math.max(dp[i + 1][j], sorted[i][2] + dp[nextFree[i]][j - 1]);\n        }\n    }\n    return dp[0][k];\n}`,
        cpp: `int maxValue(vector<vector<int>>& events, int k) {\n    vector<vector<int>> sorted = events;\n    sort(sorted.begin(), sorted.end());\n    int n = (int) sorted.size();\n    vector<int> nextFree(n, n);\n    for (int i = 0; i < n; i++) {\n        int lo = i + 1, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (sorted[mid][0] > sorted[i][1]) hi = mid;\n            else lo = mid + 1;\n        }\n        nextFree[i] = lo;\n    }\n    vector<vector<int>> dp(n + 1, vector<int>(k + 1, 0));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 1; j <= k; j++) {\n            dp[i][j] = max(dp[i + 1][j], sorted[i][2] + dp[nextFree[i]][j - 1]);\n        }\n    }\n    return dp[0][k];\n}`,
        c: `static int mvCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return x[0] < y[0] ? -1 : (x[0] > y[0] ? 1 : 0);\n}\n\nint maxValue(int** events, int eventsSize, int* eventsColSize, int k) {\n    (void) eventsColSize;\n    int n = eventsSize;\n    int* flat = (int*) malloc((size_t) n * 3 * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        flat[i * 3] = events[i][0];\n        flat[i * 3 + 1] = events[i][1];\n        flat[i * 3 + 2] = events[i][2];\n    }\n    qsort(flat, (size_t) n, 3 * sizeof(int), mvCmp);\n    int* nextFree = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int lo = i + 1, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (flat[mid * 3] > flat[i * 3 + 1]) hi = mid;\n            else lo = mid + 1;\n        }\n        nextFree[i] = lo;\n    }\n    int width = k + 1;\n    int* dp = (int*) calloc((size_t) (n + 1) * (size_t) width, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 1; j <= k; j++) {\n            int skip = dp[(i + 1) * width + j];\n            int take = flat[i * 3 + 2] + dp[nextFree[i] * width + (j - 1)];\n            dp[i * width + j] = skip > take ? skip : take;\n        }\n    }\n    int answer = dp[0 * width + k];\n    free(flat);\n    free(nextFree);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int MaxValue(int[][] events, int k)\n{\n    var sorted = (int[][]) events.Clone();\n    Array.Sort(sorted, (a, b) => a[0] - b[0]);\n    int n = sorted.Length;\n    var nextFree = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        int lo = i + 1, hi = n;\n        while (lo < hi)\n        {\n            int mid = (lo + hi) / 2;\n            if (sorted[mid][0] > sorted[i][1]) hi = mid;\n            else lo = mid + 1;\n        }\n        nextFree[i] = lo;\n    }\n    var dp = new int[n + 1, k + 1];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        for (int j = 1; j <= k; j++)\n        {\n            dp[i, j] = Math.Max(dp[i + 1, j], sorted[i][2] + dp[nextFree[i], j - 1]);\n        }\n    }\n    return dp[0, k];\n}`,
        go: `func maxValue(events [][]int, k int) int {\n\tsorted := make([][]int, len(events))\n\tcopy(sorted, events)\n\tsort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })\n\tn := len(sorted)\n\tnextFree := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tlo, hi := i+1, n\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\tif sorted[mid][0] > sorted[i][1] {\n\t\t\t\thi = mid\n\t\t\t} else {\n\t\t\t\tlo = mid + 1\n\t\t\t}\n\t\t}\n\t\tnextFree[i] = lo\n\t}\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, k+1)\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tfor j := 1; j <= k; j++ {\n\t\t\tskip := dp[i+1][j]\n\t\t\ttake := sorted[i][2] + dp[nextFree[i]][j-1]\n\t\t\tif skip > take {\n\t\t\t\tdp[i][j] = skip\n\t\t\t} else {\n\t\t\t\tdp[i][j] = take\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0][k]\n}`,
        kotlin: `fun maxValue(events: Array<IntArray>, k: Int): Int {\n    val sorted = events.sortedBy { it[0] }\n    val n = sorted.size\n    val nextFree = IntArray(n)\n    for (i in 0 until n) {\n        var lo = i + 1\n        var hi = n\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (sorted[mid][0] > sorted[i][1]) hi = mid else lo = mid + 1\n        }\n        nextFree[i] = lo\n    }\n    val dp = Array(n + 1) { IntArray(k + 1) }\n    for (i in n - 1 downTo 0) {\n        for (j in 1..k) {\n            dp[i][j] = maxOf(dp[i + 1][j], sorted[i][2] + dp[nextFree[i]][j - 1])\n        }\n    }\n    return dp[0][k]\n}`,
        swift: `func maxValue(_ events: [[Int]], _ k: Int) -> Int {\n    let sorted = events.sorted { $0[0] < $1[0] }\n    let n = sorted.count\n    var nextFree = [Int](repeating: n, count: n)\n    for i in 0..<n {\n        var lo = i + 1\n        var hi = n\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if sorted[mid][0] > sorted[i][1] { hi = mid } else { lo = mid + 1 }\n        }\n        nextFree[i] = lo\n    }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: k + 1), count: n + 1)\n    var i = n - 1\n    while i >= 0 {\n        for j in 1...k {\n            dp[i][j] = max(dp[i + 1][j], sorted[i][2] + dp[nextFree[i]][j - 1])\n        }\n        i -= 1\n    }\n    return dp[0][k]\n}`,
        rust: `fn maxValue(events: Vec<Vec<i32>>, k: i32) -> i32 {\n    let mut sorted = events.clone();\n    sorted.sort_by_key(|e| e[0]);\n    let n = sorted.len();\n    let k = k as usize;\n    let mut next_free = vec![n; n];\n    for i in 0..n {\n        let mut lo = i + 1;\n        let mut hi = n;\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if sorted[mid][0] > sorted[i][1] {\n                hi = mid;\n            } else {\n                lo = mid + 1;\n            }\n        }\n        next_free[i] = lo;\n    }\n    let mut dp = vec![vec![0i32; k + 1]; n + 1];\n    for i in (0..n).rev() {\n        for j in 1..=k {\n            let skip = dp[i + 1][j];\n            let take = sorted[i][2] + dp[next_free[i]][j - 1];\n            dp[i][j] = skip.max(take);\n        }\n    }\n    dp[0][k]\n}`,
        php: `function maxValue($events, $k) {\n    $sorted = $events;\n    usort($sorted, function($a, $b) { return $a[0] - $b[0]; });\n    $n = count($sorted);\n    $nextFree = [];\n    for ($i = 0; $i < $n; $i++) {\n        $lo = $i + 1;\n        $hi = $n;\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            if ($sorted[$mid][0] > $sorted[$i][1]) $hi = $mid;\n            else $lo = $mid + 1;\n        }\n        $nextFree[] = $lo;\n    }\n    $dp = [];\n    for ($i = 0; $i <= $n; $i++) $dp[$i] = array_fill(0, $k + 1, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        for ($j = 1; $j <= $k; $j++) {\n            $skip = $dp[$i + 1][$j];\n            $take = $sorted[$i][2] + $dp[$nextFree[$i]][$j - 1];\n            $dp[$i][$j] = $skip > $take ? $skip : $take;\n        }\n    }\n    return $dp[0][$k];\n}`,
        ruby: `def maxValue(events, k)\n  sorted = events.sort_by { |e| e[0] }\n  n = sorted.length\n  next_free = (0...n).map do |i|\n    lo = i + 1\n    hi = n\n    while lo < hi\n      mid = (lo + hi) / 2\n      if sorted[mid][0] > sorted[i][1]\n        hi = mid\n      else\n        lo = mid + 1\n      end\n    end\n    lo\n  end\n  dp = Array.new(n + 1) { Array.new(k + 1, 0) }\n  (n - 1).downto(0) do |i|\n    (1..k).each do |j|\n      dp[i][j] = [dp[i + 1][j], sorted[i][2] + dp[next_free[i]][j - 1]].max\n    end\n  end\n  dp[0][k]\nend`,
      },
    };
  })(),

  // ── Odd Even Jump (LC 975) ──────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const makeNext = (order: number[]) => {
        const res = new Array(n).fill(-1);
        const stack: number[] = [];
        for (let t = 0; t < order.length; t++) {
          const i = order[t];
          while (stack.length > 0 && i > stack[stack.length - 1]) res[stack.pop() as number] = i;
          stack.push(i);
        }
        return res;
      };
      const asc = Array.from({ length: n }, (_, i) => i).sort((a, b) => (arr[a] - arr[b]) || (a - b));
      const desc = Array.from({ length: n }, (_, i) => i).sort((a, b) => (arr[b] - arr[a]) || (a - b));
      const nextHigher = makeNext(asc);
      const nextLower = makeNext(desc);
      const odd = new Array(n).fill(false);
      const even = new Array(n).fill(false);
      odd[n - 1] = true;
      even[n - 1] = true;
      let count = 1;
      for (let i = n - 2; i >= 0; i--) {
        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];
        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];
        if (odd[i]) count++;
      }
      return count;
    };
    return {
      slug: "odd-even-jump",
      title: "Odd Even Jump",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Stack", "Monotonic Stack", "Ordered Set", "Google", "Amazon", "Meta"],
      signature: { funcName: "oddEvenJumps", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "From index `i` you may jump forward. Jumps are numbered from 1, and:\n\n- on an **odd**-numbered jump you move to the smallest index `j > i` such that `arr[j]` is the **smallest value that is at least** `arr[i]`;\n- on an **even**-numbered jump you move to the smallest index `j > i` such that `arr[j]` is the **largest value that is at most** `arr[i]`.\n\nIf no such `j` exists the jump cannot be made. An index is **good** if, starting there, you can reach the last index by some sequence of jumps.\n\nReturn the number of good starting indices.",
        [
          { in: "arr = [10,13,12,14,15]", out: "2", note: "Only indices 3 and 4 work." },
          { in: "arr = [2,3,1,1,4]", out: "3", note: "Indices 1, 3 and 4." },
          { in: "arr = [5,1,3,4,2]", out: "3", note: "Indices 1, 2 and 4." },
        ],
        ["1 <= arr.length <= 2 * 10^4", "0 <= arr[i] < 10^5"]),
      hints: [
        "Work backwards: the last index is good, and whether `i` is good depends only on where its **next** jump lands.",
        "You need two arrays: for each `i`, the target of an odd jump and the target of an even jump.",
        "Both come from a monotonic stack over the indices sorted by value — ascending for odd jumps, descending for even.",
      ],
      editorial: explain({
        idea: "Precompute `nextHigher[i]` and `nextLower[i]` — where an odd and an even jump from `i` land — then sweep backwards. `odd[i]` is true when an odd jump from `i` reaches a position that is good on an **even** jump, and vice versa; the last index is good on both.",
        steps: [
          "Sort the indices by `(value, index)` ascending; a monotonic stack over that order yields `nextHigher`.",
          "Sort by `(value descending, index ascending)`; the same stack pass yields `nextLower`.",
          "Set `odd[n-1] = even[n-1] = true`.",
          "For `i` from `n-2` down: `odd[i] = even[nextHigher[i]]` and `even[i] = odd[nextLower[i]]` where the targets exist.",
          "Count the true entries of `odd`.",
        ],
        why: "The tie-breaks are why the sorts differ: an odd jump wants the smallest qualifying **value** and then the smallest index, which is exactly the `(value, index)` order; an even jump wants the largest value and then the smallest index, which is `(−value, index)`. The stack pass turns each order into \"next greater index\" in linear time, and the parity alternation is what forces two boolean arrays rather than one.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Odd and even jumps swap roles at each step, so the recurrence crosses between the two arrays.",
          "Both jump kinds require a **later** index; equal values at an earlier index do not count.",
          "The last index is good regardless of parity and seeds the whole sweep.",
        ],
      }),
      examples: [
        { input: "[10,13,12,14,15]", expectedOutput: "2" },
        { input: "[2,3,1,1,4]", expectedOutput: "3" },
        { input: "[5,1,3,4,2]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const arr = Array.from({ length: n }, () => ri(rng, 0, 15));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef oddEvenJumps(arr: List[int]) -> int:\n    n = len(arr)\n\n    def make_next(order):\n        res = [-1] * n\n        stack = []\n        for i in order:\n            while stack and i > stack[-1]:\n                res[stack.pop()] = i\n            stack.append(i)\n        return res\n\n    asc = sorted(range(n), key=lambda i: (arr[i], i))\n    desc = sorted(range(n), key=lambda i: (-arr[i], i))\n    next_higher = make_next(asc)\n    next_lower = make_next(desc)\n    odd = [False] * n\n    even = [False] * n\n    odd[n - 1] = even[n - 1] = True\n    count = 1\n    for i in range(n - 2, -1, -1):\n        if next_higher[i] >= 0:\n            odd[i] = even[next_higher[i]]\n        if next_lower[i] >= 0:\n            even[i] = odd[next_lower[i]]\n        if odd[i]:\n            count += 1\n    return count`,
        javascript: `var oddEvenJumps = function(arr) {\n    var n = arr.length, i;\n    var makeNext = function(order) {\n        var res = [];\n        for (var t = 0; t < n; t++) res.push(-1);\n        var stack = [];\n        for (t = 0; t < order.length; t++) {\n            var idx = order[t];\n            while (stack.length > 0 && idx > stack[stack.length - 1]) res[stack.pop()] = idx;\n            stack.push(idx);\n        }\n        return res;\n    };\n    var base = [];\n    for (i = 0; i < n; i++) base.push(i);\n    var asc = base.slice();\n    asc.sort(function(a, b) { return arr[a] !== arr[b] ? arr[a] - arr[b] : a - b; });\n    var desc = base.slice();\n    desc.sort(function(a, b) { return arr[a] !== arr[b] ? arr[b] - arr[a] : a - b; });\n    var nextHigher = makeNext(asc);\n    var nextLower = makeNext(desc);\n    var odd = [], even = [];\n    for (i = 0; i < n; i++) { odd.push(false); even.push(false); }\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    var count = 1;\n    for (i = n - 2; i >= 0; i--) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    return count;\n};`,
        typescript: `function oddEvenJumps(arr: number[]): number {\n    var n = arr.length, i: number;\n    var makeNext = function(order: number[]): number[] {\n        var res: number[] = [];\n        for (var t = 0; t < n; t++) res.push(-1);\n        var stack: number[] = [];\n        for (t = 0; t < order.length; t++) {\n            var idx = order[t];\n            while (stack.length > 0 && idx > stack[stack.length - 1]) res[stack.pop() as number] = idx;\n            stack.push(idx);\n        }\n        return res;\n    };\n    var base: number[] = [];\n    for (i = 0; i < n; i++) base.push(i);\n    var asc = base.slice();\n    asc.sort(function(a: number, b: number) { return arr[a] !== arr[b] ? arr[a] - arr[b] : a - b; });\n    var desc = base.slice();\n    desc.sort(function(a: number, b: number) { return arr[a] !== arr[b] ? arr[b] - arr[a] : a - b; });\n    var nextHigher = makeNext(asc);\n    var nextLower = makeNext(desc);\n    var odd: boolean[] = [], even: boolean[] = [];\n    for (i = 0; i < n; i++) { odd.push(false); even.push(false); }\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    var count = 1;\n    for (i = n - 2; i >= 0; i--) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    return count;\n}`,
        java: `public static int oddEvenJumps(int[] arr) {\n    int n = arr.length;\n    Integer[] asc = new Integer[n];\n    Integer[] desc = new Integer[n];\n    for (int i = 0; i < n; i++) {\n        asc[i] = i;\n        desc[i] = i;\n    }\n    Arrays.sort(asc, (a, b) -> arr[a] != arr[b] ? arr[a] - arr[b] : a - b);\n    Arrays.sort(desc, (a, b) -> arr[a] != arr[b] ? arr[b] - arr[a] : a - b);\n    int[] nextHigher = oejNext(asc, n);\n    int[] nextLower = oejNext(desc, n);\n    boolean[] odd = new boolean[n];\n    boolean[] even = new boolean[n];\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    int count = 1;\n    for (int i = n - 2; i >= 0; i--) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    return count;\n}\n\nprivate static int[] oejNext(Integer[] order, int n) {\n    int[] res = new int[n];\n    Arrays.fill(res, -1);\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int idx : order) {\n        while (!stack.isEmpty() && idx > stack.peek()) res[stack.pop()] = idx;\n        stack.push(idx);\n    }\n    return res;\n}`,
        cpp: `static vector<int> oejNext(vector<int>& order, int n) {\n    vector<int> res(n, -1);\n    vector<int> stack;\n    for (int idx : order) {\n        while (!stack.empty() && idx > stack.back()) {\n            res[stack.back()] = idx;\n            stack.pop_back();\n        }\n        stack.push_back(idx);\n    }\n    return res;\n}\n\nint oddEvenJumps(vector<int>& arr) {\n    int n = (int) arr.size();\n    vector<int> asc(n), desc(n);\n    for (int i = 0; i < n; i++) {\n        asc[i] = i;\n        desc[i] = i;\n    }\n    sort(asc.begin(), asc.end(), [&](int a, int b) { return arr[a] != arr[b] ? arr[a] < arr[b] : a < b; });\n    sort(desc.begin(), desc.end(), [&](int a, int b) { return arr[a] != arr[b] ? arr[a] > arr[b] : a < b; });\n    vector<int> nextHigher = oejNext(asc, n);\n    vector<int> nextLower = oejNext(desc, n);\n    vector<bool> odd(n, false), even(n, false);\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    int count = 1;\n    for (int i = n - 2; i >= 0; i--) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    return count;\n}`,
        c: `static const int* oejArr;\n\nstatic int oejAsc(const void* a, const void* b) {\n    int x = *(const int*) a, y = *(const int*) b;\n    if (oejArr[x] != oejArr[y]) return oejArr[x] < oejArr[y] ? -1 : 1;\n    return x < y ? -1 : 1;\n}\n\nstatic int oejDesc(const void* a, const void* b) {\n    int x = *(const int*) a, y = *(const int*) b;\n    if (oejArr[x] != oejArr[y]) return oejArr[x] > oejArr[y] ? -1 : 1;\n    return x < y ? -1 : 1;\n}\n\nstatic void oejNext(int* order, int n, int* res, int* stack) {\n    for (int i = 0; i < n; i++) res[i] = -1;\n    int top = 0;\n    for (int t = 0; t < n; t++) {\n        int idx = order[t];\n        while (top > 0 && idx > stack[top - 1]) {\n            res[stack[top - 1]] = idx;\n            top--;\n        }\n        stack[top++] = idx;\n    }\n}\n\nint oddEvenJumps(int* arr, int arrSize) {\n    int n = arrSize;\n    oejArr = arr;\n    int* asc = (int*) malloc((size_t) n * sizeof(int));\n    int* desc = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        asc[i] = i;\n        desc[i] = i;\n    }\n    qsort(asc, (size_t) n, sizeof(int), oejAsc);\n    qsort(desc, (size_t) n, sizeof(int), oejDesc);\n    int* nextHigher = (int*) malloc((size_t) n * sizeof(int));\n    int* nextLower = (int*) malloc((size_t) n * sizeof(int));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    oejNext(asc, n, nextHigher, stack);\n    oejNext(desc, n, nextLower, stack);\n    char* odd = (char*) calloc((size_t) n, sizeof(char));\n    char* even = (char*) calloc((size_t) n, sizeof(char));\n    odd[n - 1] = 1;\n    even[n - 1] = 1;\n    int count = 1;\n    for (int i = n - 2; i >= 0; i--) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    free(asc);\n    free(desc);\n    free(nextHigher);\n    free(nextLower);\n    free(stack);\n    free(odd);\n    free(even);\n    return count;\n}`,
        csharp: `public static int OddEvenJumps(int[] arr)\n{\n    int n = arr.Length;\n    var asc = new int[n];\n    var desc = new int[n];\n    for (int i = 0; i < n; i++) { asc[i] = i; desc[i] = i; }\n    Array.Sort(asc, (a, b) => arr[a] != arr[b] ? arr[a] - arr[b] : a - b);\n    Array.Sort(desc, (a, b) => arr[a] != arr[b] ? arr[b] - arr[a] : a - b);\n    var nextHigher = OejNext(asc, n);\n    var nextLower = OejNext(desc, n);\n    var odd = new bool[n];\n    var even = new bool[n];\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    int count = 1;\n    for (int i = n - 2; i >= 0; i--)\n    {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]];\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]];\n        if (odd[i]) count++;\n    }\n    return count;\n}\n\nprivate static int[] OejNext(int[] order, int n)\n{\n    var res = new int[n];\n    for (int i = 0; i < n; i++) res[i] = -1;\n    var stack = new Stack<int>();\n    foreach (int idx in order)\n    {\n        while (stack.Count > 0 && idx > stack.Peek()) res[stack.Pop()] = idx;\n        stack.Push(idx);\n    }\n    return res;\n}`,
        go: `func oddEvenJumps(arr []int) int {\n\tn := len(arr)\n\tmakeNext := func(order []int) []int {\n\t\tres := make([]int, n)\n\t\tfor i := range res {\n\t\t\tres[i] = -1\n\t\t}\n\t\tstack := []int{}\n\t\tfor _, idx := range order {\n\t\t\tfor len(stack) > 0 && idx > stack[len(stack)-1] {\n\t\t\t\tres[stack[len(stack)-1]] = idx\n\t\t\t\tstack = stack[:len(stack)-1]\n\t\t\t}\n\t\t\tstack = append(stack, idx)\n\t\t}\n\t\treturn res\n\t}\n\tasc := make([]int, n)\n\tdesc := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tasc[i] = i\n\t\tdesc[i] = i\n\t}\n\tsort.Slice(asc, func(a, b int) bool {\n\t\tif arr[asc[a]] != arr[asc[b]] {\n\t\t\treturn arr[asc[a]] < arr[asc[b]]\n\t\t}\n\t\treturn asc[a] < asc[b]\n\t})\n\tsort.Slice(desc, func(a, b int) bool {\n\t\tif arr[desc[a]] != arr[desc[b]] {\n\t\t\treturn arr[desc[a]] > arr[desc[b]]\n\t\t}\n\t\treturn desc[a] < desc[b]\n\t})\n\tnextHigher := makeNext(asc)\n\tnextLower := makeNext(desc)\n\todd := make([]bool, n)\n\teven := make([]bool, n)\n\todd[n-1] = true\n\teven[n-1] = true\n\tcount := 1\n\tfor i := n - 2; i >= 0; i-- {\n\t\tif nextHigher[i] >= 0 {\n\t\t\todd[i] = even[nextHigher[i]]\n\t\t}\n\t\tif nextLower[i] >= 0 {\n\t\t\teven[i] = odd[nextLower[i]]\n\t\t}\n\t\tif odd[i] {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun oddEvenJumps(arr: IntArray): Int {\n    val n = arr.size\n    fun makeNext(order: List<Int>): IntArray {\n        val res = IntArray(n) { -1 }\n        val stack = java.util.ArrayDeque<Int>()\n        for (idx in order) {\n            while (stack.isNotEmpty() && idx > stack.peek()) res[stack.pop()] = idx\n            stack.push(idx)\n        }\n        return res\n    }\n    val asc = (0 until n).sortedWith(compareBy({ arr[it] }, { it }))\n    val desc = (0 until n).sortedWith(compareBy({ -arr[it] }, { it }))\n    val nextHigher = makeNext(asc)\n    val nextLower = makeNext(desc)\n    val odd = BooleanArray(n)\n    val even = BooleanArray(n)\n    odd[n - 1] = true\n    even[n - 1] = true\n    var count = 1\n    for (i in n - 2 downTo 0) {\n        if (nextHigher[i] >= 0) odd[i] = even[nextHigher[i]]\n        if (nextLower[i] >= 0) even[i] = odd[nextLower[i]]\n        if (odd[i]) count++\n    }\n    return count\n}`,
        swift: `func oddEvenJumps(_ arr: [Int]) -> Int {\n    let n = arr.count\n    func makeNext(_ order: [Int]) -> [Int] {\n        var res = [Int](repeating: -1, count: n)\n        var stack = [Int]()\n        for idx in order {\n            while let last = stack.last, idx > last {\n                res[last] = idx\n                stack.removeLast()\n            }\n            stack.append(idx)\n        }\n        return res\n    }\n    let asc = (0..<n).sorted { arr[$0] != arr[$1] ? arr[$0] < arr[$1] : $0 < $1 }\n    let desc = (0..<n).sorted { arr[$0] != arr[$1] ? arr[$0] > arr[$1] : $0 < $1 }\n    let nextHigher = makeNext(asc)\n    let nextLower = makeNext(desc)\n    var odd = [Bool](repeating: false, count: n)\n    var even = [Bool](repeating: false, count: n)\n    odd[n - 1] = true\n    even[n - 1] = true\n    var count = 1\n    var i = n - 2\n    while i >= 0 {\n        if nextHigher[i] >= 0 { odd[i] = even[nextHigher[i]] }\n        if nextLower[i] >= 0 { even[i] = odd[nextLower[i]] }\n        if odd[i] { count += 1 }\n        i -= 1\n    }\n    return count\n}`,
        rust: `fn oddEvenJumps(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    let make_next = |order: &Vec<usize>| -> Vec<i32> {\n        let mut res = vec![-1i32; n];\n        let mut stack: Vec<usize> = Vec::new();\n        for &idx in order.iter() {\n            while let Some(&last) = stack.last() {\n                if idx > last {\n                    res[last] = idx as i32;\n                    stack.pop();\n                } else {\n                    break;\n                }\n            }\n            stack.push(idx);\n        }\n        res\n    };\n    let mut asc: Vec<usize> = (0..n).collect();\n    let mut desc: Vec<usize> = (0..n).collect();\n    asc.sort_by(|&a, &b| arr[a].cmp(&arr[b]).then(a.cmp(&b)));\n    desc.sort_by(|&a, &b| arr[b].cmp(&arr[a]).then(a.cmp(&b)));\n    let next_higher = make_next(&asc);\n    let next_lower = make_next(&desc);\n    let mut odd = vec![false; n];\n    let mut even = vec![false; n];\n    odd[n - 1] = true;\n    even[n - 1] = true;\n    let mut count = 1;\n    for i in (0..n - 1).rev() {\n        if next_higher[i] >= 0 {\n            odd[i] = even[next_higher[i] as usize];\n        }\n        if next_lower[i] >= 0 {\n            even[i] = odd[next_lower[i] as usize];\n        }\n        if odd[i] {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function oejNext($order, $n) {\n    $res = array_fill(0, $n, -1);\n    $stack = [];\n    foreach ($order as $idx) {\n        while (count($stack) > 0 && $idx > $stack[count($stack) - 1]) {\n            $res[array_pop($stack)] = $idx;\n        }\n        $stack[] = $idx;\n    }\n    return $res;\n}\n\nfunction oddEvenJumps($arr) {\n    $n = count($arr);\n    $asc = range(0, $n - 1);\n    $desc = range(0, $n - 1);\n    usort($asc, function($a, $b) use ($arr) {\n        return $arr[$a] !== $arr[$b] ? $arr[$a] - $arr[$b] : $a - $b;\n    });\n    usort($desc, function($a, $b) use ($arr) {\n        return $arr[$a] !== $arr[$b] ? $arr[$b] - $arr[$a] : $a - $b;\n    });\n    $nextHigher = oejNext($asc, $n);\n    $nextLower = oejNext($desc, $n);\n    $odd = array_fill(0, $n, false);\n    $even = array_fill(0, $n, false);\n    $odd[$n - 1] = true;\n    $even[$n - 1] = true;\n    $count = 1;\n    for ($i = $n - 2; $i >= 0; $i--) {\n        if ($nextHigher[$i] >= 0) $odd[$i] = $even[$nextHigher[$i]];\n        if ($nextLower[$i] >= 0) $even[$i] = $odd[$nextLower[$i]];\n        if ($odd[$i]) $count++;\n    }\n    return $count;\n}`,
        ruby: `def oddEvenJumps(arr)\n  n = arr.length\n  make_next = lambda do |order|\n    res = Array.new(n, -1)\n    stack = []\n    order.each do |idx|\n      res[stack.pop] = idx while !stack.empty? && idx > stack[-1]\n      stack << idx\n    end\n    res\n  end\n  asc = (0...n).sort_by { |i| [arr[i], i] }\n  desc = (0...n).sort_by { |i| [-arr[i], i] }\n  next_higher = make_next.call(asc)\n  next_lower = make_next.call(desc)\n  odd = Array.new(n, false)\n  even = Array.new(n, false)\n  odd[n - 1] = true\n  even[n - 1] = true\n  count = 1\n  (n - 2).downto(0) do |i|\n    odd[i] = even[next_higher[i]] if next_higher[i] >= 0\n    even[i] = odd[next_lower[i]] if next_lower[i] >= 0\n    count += 1 if odd[i]\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Make Array Strictly Increasing (LC 1187) ────────────────────
  (() => {
    const ref = (arr1: number[], arr2: number[]) => {
      const pool = arr2.slice().sort((a, b) => a - b);
      const INF = 1000000000;
      // Map from "value the prefix now ends on" to the fewest operations used.
      let dp: Record<string, number> = { "-1": 0 };
      for (let i = 0; i < arr1.length; i++) {
        const next: Record<string, number> = {};
        const keys = Object.keys(dp);
        for (let t = 0; t < keys.length; t++) {
          const prev = parseInt(keys[t], 10);
          const ops = dp[keys[t]];
          if (arr1[i] > prev) {
            const key = String(arr1[i]);
            if (next[key] === undefined || ops < next[key]) next[key] = ops;
          }
          // Smallest replacement strictly greater than prev.
          let lo = 0, hi = pool.length;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (pool[mid] > prev) hi = mid; else lo = mid + 1;
          }
          if (lo < pool.length) {
            const key = String(pool[lo]);
            if (next[key] === undefined || ops + 1 < next[key]) next[key] = ops + 1;
          }
        }
        dp = next;
      }
      let best = INF;
      const keys = Object.keys(dp);
      for (let t = 0; t < keys.length; t++) if (dp[keys[t]] < best) best = dp[keys[t]];
      return best === INF ? -1 : best;
    };
    return {
      slug: "make-array-strictly-increasing",
      title: "Make Array Strictly Increasing",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sorting", "Google", "Amazon", "Meta"],
      signature: { funcName: "makeArrayIncreasing", params: [{ name: "arr1", type: "int[]" as const }, { name: "arr2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "In one operation you may replace any element of `arr1` with any element of `arr2` — elements of `arr2` may be reused.\n\nReturn the minimum number of operations that makes `arr1` **strictly increasing**, or `-1` if that is impossible.",
        [
          { in: "arr1 = [1,5,3,6,7], arr2 = [1,3,2,4]", out: "1", note: "Replace the 5 with 2." },
          { in: "arr1 = [1,5,3,6,7], arr2 = [4,3,1]", out: "2", note: "Replace the 5 with 3 and the 3 with 4." },
          { in: "arr1 = [1,5,3,6,7], arr2 = [1,6,3,3]", out: "-1" },
        ],
        ["1 <= arr1.length, arr2.length <= 2000", "0 <= arr1[i], arr2[i] <= 10^9"]),
      hints: [
        "The only thing the future depends on is the value the prefix currently **ends** on, and how many operations got you there.",
        "So keep a map from that ending value to the fewest operations.",
        "At each step either keep `arr1[i]` (if it is larger than the previous value) or replace it with the **smallest** element of `arr2` that is larger.",
      ],
      editorial: explain({
        idea: "A DP over \"what value does the prefix end on\". Carry a map from ending value to the minimum operations used. For each position, extend every state two ways: keep `arr1[i]` when it exceeds the previous value, or replace it with the smallest element of the sorted `arr2` that exceeds the previous value.",
        steps: [
          "Sort `arr2` once.",
          "Start from the single state `{-1: 0}` — nothing placed yet, using a sentinel below every value.",
          "For each element of `arr1`, build the next map from both transitions, keeping the smaller operation count per ending value.",
          "The answer is the smallest value in the final map, or `-1` if it is empty.",
        ],
        why: "Only the **smallest** valid replacement ever needs considering: a larger one costs the same operation but leaves less room for what follows, so it is dominated. That collapses the branching from `|arr2|` to 1 per state, and the state count stays small because the reachable ending values are always either `arr1[i]` or an element of `arr2`.",
        time: "O(n · m log m)",
        space: "O(m)",
        pitfalls: [
          "\"Strictly\" increasing — equal neighbours are not allowed, so the search is for a value strictly greater.",
          "Elements of `arr2` may be reused any number of times.",
          "An empty state map means the array cannot be fixed, which is the `-1` case.",
        ],
      }),
      examples: [
        { input: "[1,5,3,6,7]\n[1,3,2,4]", expectedOutput: "1" },
        { input: "[1,5,3,6,7]\n[4,3,1]", expectedOutput: "2" },
        { input: "[1,5,3,6,7]\n[1,6,3,3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const arr1 = Array.from({ length: ri(rng, 1, 8) }, () => ri(rng, 0, 15));
        const arr2 = Array.from({ length: ri(rng, 1, 8) }, () => ri(rng, 0, 15));
        return { input: `${fmtIntArr(arr1)}\n${fmtIntArr(arr2)}`, expectedOutput: String(ref(arr1, arr2)) };
      },
      solutions: {
        python: `from bisect import bisect_right\nfrom typing import List\n\ndef makeArrayIncreasing(arr1: List[int], arr2: List[int]) -> int:\n    pool = sorted(arr2)\n    dp = {-1: 0}\n    for v in arr1:\n        nxt = {}\n        for prev, ops in dp.items():\n            if v > prev:\n                if v not in nxt or ops < nxt[v]:\n                    nxt[v] = ops\n            j = bisect_right(pool, prev)\n            if j < len(pool):\n                cand = pool[j]\n                if cand not in nxt or ops + 1 < nxt[cand]:\n                    nxt[cand] = ops + 1\n        dp = nxt\n    return min(dp.values()) if dp else -1`,
        javascript: `var makeArrayIncreasing = function(arr1, arr2) {\n    var pool = arr2.slice();\n    pool.sort(function(a, b) { return a - b; });\n    var INF = 1000000000;\n    var dp = { "-1": 0 };\n    for (var i = 0; i < arr1.length; i++) {\n        var next = {};\n        var keys = Object.keys(dp);\n        for (var t = 0; t < keys.length; t++) {\n            var prev = parseInt(keys[t], 10);\n            var ops = dp[keys[t]];\n            if (arr1[i] > prev) {\n                var k1 = String(arr1[i]);\n                if (next[k1] === undefined || ops < next[k1]) next[k1] = ops;\n            }\n            var lo = 0, hi = pool.length;\n            while (lo < hi) {\n                var mid = (lo + hi) >> 1;\n                if (pool[mid] > prev) hi = mid; else lo = mid + 1;\n            }\n            if (lo < pool.length) {\n                var k2 = String(pool[lo]);\n                if (next[k2] === undefined || ops + 1 < next[k2]) next[k2] = ops + 1;\n            }\n        }\n        dp = next;\n    }\n    var best = INF;\n    var finalKeys = Object.keys(dp);\n    for (t = 0; t < finalKeys.length; t++) if (dp[finalKeys[t]] < best) best = dp[finalKeys[t]];\n    return best === INF ? -1 : best;\n};`,
        typescript: `function makeArrayIncreasing(arr1: number[], arr2: number[]): number {\n    var pool = arr2.slice();\n    pool.sort(function(a: number, b: number) { return a - b; });\n    var INF = 1000000000;\n    var dp: { [k: string]: number } = { "-1": 0 };\n    for (var i = 0; i < arr1.length; i++) {\n        var next: { [k: string]: number } = {};\n        var keys = Object.keys(dp);\n        for (var t = 0; t < keys.length; t++) {\n            var prev = parseInt(keys[t], 10);\n            var ops = dp[keys[t]];\n            if (arr1[i] > prev) {\n                var k1 = String(arr1[i]);\n                if (next[k1] === undefined || ops < next[k1]) next[k1] = ops;\n            }\n            var lo = 0, hi = pool.length;\n            while (lo < hi) {\n                var mid = (lo + hi) >> 1;\n                if (pool[mid] > prev) hi = mid; else lo = mid + 1;\n            }\n            if (lo < pool.length) {\n                var k2 = String(pool[lo]);\n                if (next[k2] === undefined || ops + 1 < next[k2]) next[k2] = ops + 1;\n            }\n        }\n        dp = next;\n    }\n    var best = INF;\n    var finalKeys = Object.keys(dp);\n    for (t = 0; t < finalKeys.length; t++) if (dp[finalKeys[t]] < best) best = dp[finalKeys[t]];\n    return best === INF ? -1 : best;\n}`,
        java: `public static int makeArrayIncreasing(int[] arr1, int[] arr2) {\n    int[] pool = arr2.clone();\n    Arrays.sort(pool);\n    Map<Integer, Integer> dp = new HashMap<>();\n    dp.put(-1, 0);\n    for (int v : arr1) {\n        Map<Integer, Integer> next = new HashMap<>();\n        for (Map.Entry<Integer, Integer> e : dp.entrySet()) {\n            int prev = e.getKey(), ops = e.getValue();\n            if (v > prev) {\n                Integer cur = next.get(v);\n                if (cur == null || ops < cur) next.put(v, ops);\n            }\n            int lo = 0, hi = pool.length;\n            while (lo < hi) {\n                int mid = (lo + hi) >>> 1;\n                if (pool[mid] > prev) hi = mid;\n                else lo = mid + 1;\n            }\n            if (lo < pool.length) {\n                Integer cur = next.get(pool[lo]);\n                if (cur == null || ops + 1 < cur) next.put(pool[lo], ops + 1);\n            }\n        }\n        dp = next;\n    }\n    int best = Integer.MAX_VALUE;\n    for (int ops : dp.values()) best = Math.min(best, ops);\n    return best == Integer.MAX_VALUE ? -1 : best;\n}`,
        cpp: `int makeArrayIncreasing(vector<int>& arr1, vector<int>& arr2) {\n    vector<int> pool = arr2;\n    sort(pool.begin(), pool.end());\n    map<int, int> dp;\n    dp[-1] = 0;\n    for (int v : arr1) {\n        map<int, int> next;\n        for (auto& e : dp) {\n            int prev = e.first, ops = e.second;\n            if (v > prev) {\n                if (!next.count(v) || ops < next[v]) next[v] = ops;\n            }\n            auto it = upper_bound(pool.begin(), pool.end(), prev);\n            if (it != pool.end()) {\n                int cand = *it;\n                if (!next.count(cand) || ops + 1 < next[cand]) next[cand] = ops + 1;\n            }\n        }\n        dp = next;\n    }\n    int best = INT_MAX;\n    for (auto& e : dp) best = min(best, e.second);\n    return best == INT_MAX ? -1 : best;\n}`,
        c: `static int maiPoolCmp(const void* a, const void* b) {\n    int x = *(const int*) a, y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint makeArrayIncreasing(int* arr1, int arr1Size, int* arr2, int arr2Size) {\n    const int INF = 1000000000;\n    int* pool = (int*) malloc((size_t) arr2Size * sizeof(int));\n    for (int i = 0; i < arr2Size; i++) pool[i] = arr2[i];\n    qsort(pool, (size_t) arr2Size, sizeof(int), maiPoolCmp);\n    int cap = arr2Size + 2;\n    int* keys = (int*) malloc((size_t) cap * sizeof(int));\n    int* vals = (int*) malloc((size_t) cap * sizeof(int));\n    int* nkeys = (int*) malloc((size_t) cap * sizeof(int));\n    int* nvals = (int*) malloc((size_t) cap * sizeof(int));\n    int count = 1;\n    keys[0] = -1;\n    vals[0] = 0;\n    for (int i = 0; i < arr1Size; i++) {\n        int ncount = 0;\n        for (int t = 0; t < count; t++) {\n            int prev = keys[t], ops = vals[t];\n            int cands[2];\n            int costs[2];\n            int total = 0;\n            if (arr1[i] > prev) {\n                cands[total] = arr1[i];\n                costs[total] = ops;\n                total++;\n            }\n            int lo = 0, hi = arr2Size;\n            while (lo < hi) {\n                int mid = (lo + hi) / 2;\n                if (pool[mid] > prev) hi = mid;\n                else lo = mid + 1;\n            }\n            if (lo < arr2Size) {\n                cands[total] = pool[lo];\n                costs[total] = ops + 1;\n                total++;\n            }\n            for (int c = 0; c < total; c++) {\n                int found = -1;\n                for (int u = 0; u < ncount; u++) {\n                    if (nkeys[u] == cands[c]) { found = u; break; }\n                }\n                if (found < 0) {\n                    nkeys[ncount] = cands[c];\n                    nvals[ncount] = costs[c];\n                    ncount++;\n                } else if (costs[c] < nvals[found]) {\n                    nvals[found] = costs[c];\n                }\n            }\n        }\n        for (int t = 0; t < ncount; t++) {\n            keys[t] = nkeys[t];\n            vals[t] = nvals[t];\n        }\n        count = ncount;\n    }\n    int best = INF;\n    for (int t = 0; t < count; t++) if (vals[t] < best) best = vals[t];\n    free(pool);\n    free(keys);\n    free(vals);\n    free(nkeys);\n    free(nvals);\n    return best == INF ? -1 : best;\n}`,
        csharp: `public static int MakeArrayIncreasing(int[] arr1, int[] arr2)\n{\n    var pool = (int[]) arr2.Clone();\n    Array.Sort(pool);\n    var dp = new Dictionary<int, int> { { -1, 0 } };\n    foreach (int v in arr1)\n    {\n        var next = new Dictionary<int, int>();\n        foreach (var e in dp)\n        {\n            int prev = e.Key, ops = e.Value;\n            if (v > prev)\n            {\n                if (!next.ContainsKey(v) || ops < next[v]) next[v] = ops;\n            }\n            int lo = 0, hi = pool.Length;\n            while (lo < hi)\n            {\n                int mid = (lo + hi) / 2;\n                if (pool[mid] > prev) hi = mid;\n                else lo = mid + 1;\n            }\n            if (lo < pool.Length)\n            {\n                int cand = pool[lo];\n                if (!next.ContainsKey(cand) || ops + 1 < next[cand]) next[cand] = ops + 1;\n            }\n        }\n        dp = next;\n    }\n    int best = int.MaxValue;\n    foreach (int ops in dp.Values) best = Math.Min(best, ops);\n    return best == int.MaxValue ? -1 : best;\n}`,
        go: `func makeArrayIncreasing(arr1 []int, arr2 []int) int {\n\tpool := make([]int, len(arr2))\n\tcopy(pool, arr2)\n\tsort.Ints(pool)\n\tconst INF = 1000000000\n\tdp := map[int]int{-1: 0}\n\tfor _, v := range arr1 {\n\t\tnext := map[int]int{}\n\t\tfor prev, ops := range dp {\n\t\t\tif v > prev {\n\t\t\t\tif cur, ok := next[v]; !ok || ops < cur {\n\t\t\t\t\tnext[v] = ops\n\t\t\t\t}\n\t\t\t}\n\t\t\tlo, hi := 0, len(pool)\n\t\t\tfor lo < hi {\n\t\t\t\tmid := (lo + hi) / 2\n\t\t\t\tif pool[mid] > prev {\n\t\t\t\t\thi = mid\n\t\t\t\t} else {\n\t\t\t\t\tlo = mid + 1\n\t\t\t\t}\n\t\t\t}\n\t\t\tif lo < len(pool) {\n\t\t\t\tcand := pool[lo]\n\t\t\t\tif cur, ok := next[cand]; !ok || ops+1 < cur {\n\t\t\t\t\tnext[cand] = ops + 1\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\tbest := INF\n\tfor _, ops := range dp {\n\t\tif ops < best {\n\t\t\tbest = ops\n\t\t}\n\t}\n\tif best == INF {\n\t\treturn -1\n\t}\n\treturn best\n}`,
        kotlin: `fun makeArrayIncreasing(arr1: IntArray, arr2: IntArray): Int {\n    val pool = arr2.sortedArray()\n    var dp = HashMap<Int, Int>()\n    dp[-1] = 0\n    for (v in arr1) {\n        val next = HashMap<Int, Int>()\n        for ((prev, ops) in dp) {\n            if (v > prev) {\n                val cur = next[v]\n                if (cur == null || ops < cur) next[v] = ops\n            }\n            var lo = 0\n            var hi = pool.size\n            while (lo < hi) {\n                val mid = (lo + hi) / 2\n                if (pool[mid] > prev) hi = mid else lo = mid + 1\n            }\n            if (lo < pool.size) {\n                val cand = pool[lo]\n                val cur = next[cand]\n                if (cur == null || ops + 1 < cur) next[cand] = ops + 1\n            }\n        }\n        dp = next\n    }\n    var best = Int.MAX_VALUE\n    for (ops in dp.values) best = minOf(best, ops)\n    return if (best == Int.MAX_VALUE) -1 else best\n}`,
        swift: `func makeArrayIncreasing(_ arr1: [Int], _ arr2: [Int]) -> Int {\n    let pool = arr2.sorted()\n    var dp: [Int: Int] = [-1: 0]\n    for v in arr1 {\n        var next = [Int: Int]()\n        for (prev, ops) in dp {\n            if v > prev {\n                if next[v] == nil || ops < next[v]! { next[v] = ops }\n            }\n            var lo = 0\n            var hi = pool.count\n            while lo < hi {\n                let mid = (lo + hi) / 2\n                if pool[mid] > prev { hi = mid } else { lo = mid + 1 }\n            }\n            if lo < pool.count {\n                let cand = pool[lo]\n                if next[cand] == nil || ops + 1 < next[cand]! { next[cand] = ops + 1 }\n            }\n        }\n        dp = next\n    }\n    return dp.values.min() ?? -1\n}`,
        rust: `fn makeArrayIncreasing(arr1: Vec<i32>, arr2: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut pool = arr2.clone();\n    pool.sort();\n    let mut dp: HashMap<i32, i32> = HashMap::new();\n    dp.insert(-1, 0);\n    for &v in arr1.iter() {\n        let mut next: HashMap<i32, i32> = HashMap::new();\n        for (&prev, &ops) in dp.iter() {\n            if v > prev {\n                let e = next.entry(v).or_insert(std::i32::MAX);\n                if ops < *e {\n                    *e = ops;\n                }\n            }\n            let mut lo = 0usize;\n            let mut hi = pool.len();\n            while lo < hi {\n                let mid = (lo + hi) / 2;\n                if pool[mid] > prev {\n                    hi = mid;\n                } else {\n                    lo = mid + 1;\n                }\n            }\n            if lo < pool.len() {\n                let cand = pool[lo];\n                let e = next.entry(cand).or_insert(std::i32::MAX);\n                if ops + 1 < *e {\n                    *e = ops + 1;\n                }\n            }\n        }\n        dp = next;\n    }\n    match dp.values().min() {\n        Some(&best) => best,\n        None => -1,\n    }\n}`,
        php: `function makeArrayIncreasing($arr1, $arr2) {\n    $pool = $arr2;\n    sort($pool);\n    $INF = 1000000000;\n    $dp = [-1 => 0];\n    foreach ($arr1 as $v) {\n        $next = [];\n        foreach ($dp as $prev => $ops) {\n            if ($v > $prev) {\n                if (!isset($next[$v]) || $ops < $next[$v]) $next[$v] = $ops;\n            }\n            $lo = 0;\n            $hi = count($pool);\n            while ($lo < $hi) {\n                $mid = intdiv($lo + $hi, 2);\n                if ($pool[$mid] > $prev) $hi = $mid;\n                else $lo = $mid + 1;\n            }\n            if ($lo < count($pool)) {\n                $cand = $pool[$lo];\n                if (!isset($next[$cand]) || $ops + 1 < $next[$cand]) $next[$cand] = $ops + 1;\n            }\n        }\n        $dp = $next;\n    }\n    $best = $INF;\n    foreach ($dp as $ops) if ($ops < $best) $best = $ops;\n    return $best === $INF ? -1 : $best;\n}`,
        ruby: `def makeArrayIncreasing(arr1, arr2)\n  pool = arr2.sort\n  dp = { -1 => 0 }\n  arr1.each do |v|\n    nxt = {}\n    dp.each do |prev, ops|\n      if v > prev && (nxt[v].nil? || ops < nxt[v])\n        nxt[v] = ops\n      end\n      lo = 0\n      hi = pool.length\n      while lo < hi\n        mid = (lo + hi) / 2\n        if pool[mid] > prev\n          hi = mid\n        else\n          lo = mid + 1\n        end\n      end\n      if lo < pool.length\n        cand = pool[lo]\n        nxt[cand] = ops + 1 if nxt[cand].nil? || ops + 1 < nxt[cand]\n      end\n    end\n    dp = nxt\n  end\n  dp.empty? ? -1 : dp.values.min\nend`,
      },
    };
  })(),

  // ── Number of Ways to Reorder Array to Get Same BST (LC 1569) ───
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      // Pascal's triangle keeps every binomial exact without modular inverses.
      const binom: number[][] = [];
      for (let i = 0; i <= n; i++) {
        const row = new Array(i + 1).fill(1);
        for (let j = 1; j < i; j++) row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MODX;
        binom.push(row);
      }
      const count = (seq: number[]): number => {
        if (seq.length <= 2) return 1;
        const root = seq[0];
        const left: number[] = [], right: number[] = [];
        for (let i = 1; i < seq.length; i++) {
          if (seq[i] < root) left.push(seq[i]); else right.push(seq[i]);
        }
        let ways = binom[seq.length - 1][left.length];
        ways = mulModX(ways, count(left));
        ways = mulModX(ways, count(right));
        return ways;
      };
      return (count(nums) - 1 + MODX) % MODX;
    };
    return {
      slug: "number-of-ways-to-reorder-array-to-get-same-bst",
      title: "Number of Ways to Reorder Array to Get Same BST",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Divide and Conquer", "Dynamic Programming", "Combinatorics", "Google", "Amazon", "Meta"],
      signature: { funcName: "numOfWays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` is a permutation of distinct integers. Inserting them left to right into an empty binary search tree produces some tree.\n\nReturn the number of **other** orderings of `nums` that produce the **identical** tree, **modulo 10⁹ + 7**.",
        [
          { in: "nums = [2,1,3]", out: "1", note: "`[2,3,1]` builds the same tree." },
          { in: "nums = [3,4,5,1,2]", out: "5" },
          { in: "nums = [1,2,3]", out: "0", note: "The tree is a right chain, so the order is forced." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= nums.length", "All integers in nums are distinct."]),
      hints: [
        "The first element must stay first — it is the root.",
        "The elements smaller than the root form the left subtree, the rest the right, and **their relative orders** are each fixed independently.",
        "So the count is `C(n-1, leftSize)` times the counts for the two subtrees.",
      ],
      editorial: explain({
        idea: "Recursive counting. The root is forced to come first. The remaining `n - 1` elements split into the left and right subtrees, and any interleaving of the two sequences produces the same tree — `C(n-1, |left|)` of them — while the internal order of each side is counted recursively. Subtract 1 at the end to exclude the original ordering.",
        steps: [
          "Build Pascal's triangle up to `n` for the binomials.",
          "Recursively: a sequence of length at most 2 has exactly one arrangement.",
          "Otherwise split on the first element, and return `C(len-1, |left|) · count(left) · count(right)`.",
          "Return `count(nums) - 1` modulo 10⁹ + 7.",
        ],
        why: "Interleaving is free because insertion into a BST routes each value by comparison with the root — a left-subtree value and a right-subtree value never interact, so their relative order between the two groups is irrelevant. Building the binomials with Pascal's triangle sidesteps modular inverses entirely, which at `n <= 1000` costs a megabyte of additions and nothing else.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "The answer excludes the original ordering, hence the `- 1`.",
          "That subtraction can go negative under the modulus — add the modulus back.",
          "Multiplying two residues near 10⁹ needs 64-bit arithmetic, or a split multiply in JavaScript.",
        ],
      }),
      examples: [
        { input: "[2,1,3]", expectedOutput: "1" },
        { input: "[3,4,5,1,2]", expectedOutput: "5" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const pool: number[] = [];
        for (let v = 1; v <= n; v++) pool.push(v);
        const nums = shuffle(rng, pool);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from math import comb\nfrom typing import List\n\ndef numOfWays(nums: List[int]) -> int:\n    MOD = 10**9 + 7\n\n    def count(seq: List[int]) -> int:\n        if len(seq) <= 2:\n            return 1\n        root = seq[0]\n        left = [v for v in seq[1:] if v < root]\n        right = [v for v in seq[1:] if v > root]\n        return comb(len(seq) - 1, len(left)) * count(left) % MOD * count(right) % MOD\n\n    return (count(nums) - 1) % MOD`,
        javascript: `var numOfWays = function(nums) {\n    var MOD = 1000000007;\n    var n = nums.length, i, j;\n    var mulmod = function(a, b) {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var binom = [];\n    for (i = 0; i <= n; i++) {\n        var row = [];\n        for (j = 0; j <= i; j++) row.push(1);\n        for (j = 1; j < i; j++) row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n        binom.push(row);\n    }\n    var count = function(seq) {\n        if (seq.length <= 2) return 1;\n        var root = seq[0];\n        var left = [], right = [];\n        for (var t = 1; t < seq.length; t++) {\n            if (seq[t] < root) left.push(seq[t]); else right.push(seq[t]);\n        }\n        var ways = binom[seq.length - 1][left.length];\n        ways = mulmod(ways, count(left));\n        ways = mulmod(ways, count(right));\n        return ways;\n    };\n    return (count(nums) - 1 + MOD) % MOD;\n};`,
        typescript: `function numOfWays(nums: number[]): number {\n    var MOD = 1000000007;\n    var n = nums.length, i: number, j: number;\n    var mulmod = function(a: number, b: number): number {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var binom: number[][] = [];\n    for (i = 0; i <= n; i++) {\n        var row: number[] = [];\n        for (j = 0; j <= i; j++) row.push(1);\n        for (j = 1; j < i; j++) row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n        binom.push(row);\n    }\n    var count = function(seq: number[]): number {\n        if (seq.length <= 2) return 1;\n        var root = seq[0];\n        var left: number[] = [], right: number[] = [];\n        for (var t = 1; t < seq.length; t++) {\n            if (seq[t] < root) left.push(seq[t]); else right.push(seq[t]);\n        }\n        var ways = binom[seq.length - 1][left.length];\n        ways = mulmod(ways, count(left));\n        ways = mulmod(ways, count(right));\n        return ways;\n    };\n    return (count(nums) - 1 + MOD) % MOD;\n}`,
        java: `public static int numOfWays(int[] nums) {\n    final long MOD = 1000000007L;\n    int n = nums.length;\n    long[][] binom = new long[n + 1][];\n    for (int i = 0; i <= n; i++) {\n        binom[i] = new long[i + 1];\n        Arrays.fill(binom[i], 1);\n        for (int j = 1; j < i; j++) binom[i][j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n    }\n    List<Integer> seq = new ArrayList<>();\n    for (int v : nums) seq.add(v);\n    long total = nowCount(seq, binom, MOD);\n    return (int) ((total - 1 + MOD) % MOD);\n}\n\nprivate static long nowCount(List<Integer> seq, long[][] binom, long MOD) {\n    if (seq.size() <= 2) return 1;\n    int root = seq.get(0);\n    List<Integer> left = new ArrayList<>();\n    List<Integer> right = new ArrayList<>();\n    for (int i = 1; i < seq.size(); i++) {\n        if (seq.get(i) < root) left.add(seq.get(i));\n        else right.add(seq.get(i));\n    }\n    long ways = binom[seq.size() - 1][left.size()];\n    ways = ways * nowCount(left, binom, MOD) % MOD;\n    ways = ways * nowCount(right, binom, MOD) % MOD;\n    return ways;\n}`,
        cpp: `static long long nowCount(vector<int>& seq, vector<vector<long long>>& binom, long long MOD) {\n    if (seq.size() <= 2) return 1;\n    int root = seq[0];\n    vector<int> left, right;\n    for (size_t i = 1; i < seq.size(); i++) {\n        if (seq[i] < root) left.push_back(seq[i]);\n        else right.push_back(seq[i]);\n    }\n    long long ways = binom[seq.size() - 1][left.size()];\n    ways = ways * nowCount(left, binom, MOD) % MOD;\n    ways = ways * nowCount(right, binom, MOD) % MOD;\n    return ways;\n}\n\nint numOfWays(vector<int>& nums) {\n    const long long MOD = 1000000007LL;\n    int n = (int) nums.size();\n    vector<vector<long long>> binom(n + 1);\n    for (int i = 0; i <= n; i++) {\n        binom[i].assign(i + 1, 1);\n        for (int j = 1; j < i; j++) binom[i][j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n    }\n    vector<int> seq = nums;\n    long long total = nowCount(seq, binom, MOD);\n    return (int) ((total - 1 + MOD) % MOD);\n}`,
        c: `static long long** nowBinom;\nstatic const long long NOW_MOD = 1000000007LL;\n\nstatic long long nowCount(int* seq, int len) {\n    if (len <= 2) return 1;\n    int root = seq[0];\n    int* left = (int*) malloc((size_t) len * sizeof(int));\n    int* right = (int*) malloc((size_t) len * sizeof(int));\n    int ln = 0, rn = 0;\n    for (int i = 1; i < len; i++) {\n        if (seq[i] < root) left[ln++] = seq[i];\n        else right[rn++] = seq[i];\n    }\n    long long ways = nowBinom[len - 1][ln];\n    ways = ways * nowCount(left, ln) % NOW_MOD;\n    ways = ways * nowCount(right, rn) % NOW_MOD;\n    free(left);\n    free(right);\n    return ways;\n}\n\nint numOfWays(int* nums, int numsSize) {\n    int n = numsSize;\n    nowBinom = (long long**) malloc((size_t) (n + 1) * sizeof(long long*));\n    for (int i = 0; i <= n; i++) {\n        nowBinom[i] = (long long*) malloc((size_t) (i + 1) * sizeof(long long));\n        for (int j = 0; j <= i; j++) nowBinom[i][j] = 1;\n        for (int j = 1; j < i; j++) {\n            nowBinom[i][j] = (nowBinom[i - 1][j - 1] + nowBinom[i - 1][j]) % NOW_MOD;\n        }\n    }\n    long long total = nowCount(nums, n);\n    for (int i = 0; i <= n; i++) free(nowBinom[i]);\n    free(nowBinom);\n    return (int) ((total - 1 + NOW_MOD) % NOW_MOD);\n}`,
        csharp: `public static int NumOfWays(int[] nums)\n{\n    const long MOD = 1000000007L;\n    int n = nums.Length;\n    var binom = new long[n + 1][];\n    for (int i = 0; i <= n; i++)\n    {\n        binom[i] = new long[i + 1];\n        for (int j = 0; j <= i; j++) binom[i][j] = 1;\n        for (int j = 1; j < i; j++) binom[i][j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n    }\n    long total = NowCount(new List<int>(nums), binom, MOD);\n    return (int) ((total - 1 + MOD) % MOD);\n}\n\nprivate static long NowCount(List<int> seq, long[][] binom, long MOD)\n{\n    if (seq.Count <= 2) return 1;\n    int root = seq[0];\n    var left = new List<int>();\n    var right = new List<int>();\n    for (int i = 1; i < seq.Count; i++)\n    {\n        if (seq[i] < root) left.Add(seq[i]);\n        else right.Add(seq[i]);\n    }\n    long ways = binom[seq.Count - 1][left.Count];\n    ways = ways * NowCount(left, binom, MOD) % MOD;\n    ways = ways * NowCount(right, binom, MOD) % MOD;\n    return ways;\n}`,
        go: `func numOfWays(nums []int) int {\n\tconst MOD = 1000000007\n\tn := len(nums)\n\tbinom := make([][]int, n+1)\n\tfor i := 0; i <= n; i++ {\n\t\tbinom[i] = make([]int, i+1)\n\t\tfor j := 0; j <= i; j++ {\n\t\t\tbinom[i][j] = 1\n\t\t}\n\t\tfor j := 1; j < i; j++ {\n\t\t\tbinom[i][j] = (binom[i-1][j-1] + binom[i-1][j]) % MOD\n\t\t}\n\t}\n\tvar count func(seq []int) int\n\tcount = func(seq []int) int {\n\t\tif len(seq) <= 2 {\n\t\t\treturn 1\n\t\t}\n\t\troot := seq[0]\n\t\tleft := []int{}\n\t\tright := []int{}\n\t\tfor _, v := range seq[1:] {\n\t\t\tif v < root {\n\t\t\t\tleft = append(left, v)\n\t\t\t} else {\n\t\t\t\tright = append(right, v)\n\t\t\t}\n\t\t}\n\t\tways := binom[len(seq)-1][len(left)]\n\t\tways = ways * count(left) % MOD\n\t\tways = ways * count(right) % MOD\n\t\treturn ways\n\t}\n\treturn (count(nums) - 1 + MOD) % MOD\n}`,
        kotlin: `fun numOfWays(nums: IntArray): Int {\n    val mod = 1000000007L\n    val n = nums.size\n    val binom = Array(n + 1) { i -> LongArray(i + 1) { 1L } }\n    for (i in 0..n) {\n        for (j in 1 until i) binom[i][j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % mod\n    }\n    fun count(seq: List<Int>): Long {\n        if (seq.size <= 2) return 1L\n        val root = seq[0]\n        val left = seq.drop(1).filter { it < root }\n        val right = seq.drop(1).filter { it > root }\n        var ways = binom[seq.size - 1][left.size]\n        ways = ways * count(left) % mod\n        ways = ways * count(right) % mod\n        return ways\n    }\n    return ((count(nums.toList()) - 1 + mod) % mod).toInt()\n}`,
        swift: `func numOfWays(_ nums: [Int]) -> Int {\n    let mod = 1000000007\n    let n = nums.count\n    var binom = [[Int]]()\n    for i in 0...n {\n        var row = [Int](repeating: 1, count: i + 1)\n        if i >= 2 {\n            for j in 1..<i { row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % mod }\n        }\n        binom.append(row)\n    }\n    func count(_ seq: [Int]) -> Int {\n        if seq.count <= 2 { return 1 }\n        let root = seq[0]\n        let rest = Array(seq[1...])\n        let left = rest.filter { $0 < root }\n        let right = rest.filter { $0 > root }\n        var ways = binom[seq.count - 1][left.count]\n        ways = ways * count(left) % mod\n        ways = ways * count(right) % mod\n        return ways\n    }\n    return (count(nums) - 1 + mod) % mod\n}`,
        rust: `fn numOfWays(nums: Vec<i32>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let n = nums.len();\n    let mut binom: Vec<Vec<i64>> = Vec::new();\n    for i in 0..=n {\n        let mut row = vec![1i64; i + 1];\n        for j in 1..i {\n            row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % MOD;\n        }\n        binom.push(row);\n    }\n    fn count(seq: &[i32], binom: &Vec<Vec<i64>>) -> i64 {\n        if seq.len() <= 2 {\n            return 1;\n        }\n        let root = seq[0];\n        let left: Vec<i32> = seq[1..].iter().cloned().filter(|&v| v < root).collect();\n        let right: Vec<i32> = seq[1..].iter().cloned().filter(|&v| v > root).collect();\n        let mut ways = binom[seq.len() - 1][left.len()];\n        ways = ways * count(&left, binom) % MOD;\n        ways = ways * count(&right, binom) % MOD;\n        ways\n    }\n    (((count(&nums, &binom) - 1) % MOD + MOD) % MOD) as i32\n}`,
        php: `function nowCount($seq, &$binom, $MOD) {\n    if (count($seq) <= 2) return 1;\n    $root = $seq[0];\n    $left = [];\n    $right = [];\n    for ($i = 1; $i < count($seq); $i++) {\n        if ($seq[$i] < $root) $left[] = $seq[$i];\n        else $right[] = $seq[$i];\n    }\n    $ways = $binom[count($seq) - 1][count($left)];\n    $ways = $ways * nowCount($left, $binom, $MOD) % $MOD;\n    $ways = $ways * nowCount($right, $binom, $MOD) % $MOD;\n    return $ways;\n}\n\nfunction numOfWays($nums) {\n    $MOD = 1000000007;\n    $n = count($nums);\n    $binom = [];\n    for ($i = 0; $i <= $n; $i++) {\n        $binom[$i] = array_fill(0, $i + 1, 1);\n        for ($j = 1; $j < $i; $j++) {\n            $binom[$i][$j] = ($binom[$i - 1][$j - 1] + $binom[$i - 1][$j]) % $MOD;\n        }\n    }\n    return (nowCount($nums, $binom, $MOD) - 1 + $MOD) % $MOD;\n}`,
        ruby: `def numOfWays(nums)\n  mod = 1000000007\n  n = nums.length\n  binom = []\n  (0..n).each do |i|\n    row = Array.new(i + 1, 1)\n    (1...i).each { |j| row[j] = (binom[i - 1][j - 1] + binom[i - 1][j]) % mod }\n    binom << row\n  end\n  count = lambda do |seq|\n    next 1 if seq.length <= 2\n    root = seq[0]\n    rest = seq[1..]\n    left = rest.select { |v| v < root }\n    right = rest.select { |v| v > root }\n    ways = binom[seq.length - 1][left.length]\n    ways = ways * count.call(left) % mod\n    ways * count.call(right) % mod\n  end\n  (count.call(nums) - 1 + mod) % mod\nend`,
      },
    };
  })(),

  // ── The Number of Good Subsets (LC 1994) ────────────────────────
  (() => {
    const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    const ref = (nums: number[]) => {
      const count = new Array(31).fill(0);
      for (let i = 0; i < nums.length; i++) count[nums[i]]++;
      const maskOf = new Array(31).fill(-1);
      for (let v = 2; v <= 30; v++) {
        let m = 0, t = v, ok = true;
        for (let p = 0; p < PRIMES.length; p++) {
          if (t % PRIMES[p] === 0) {
            t = t / PRIMES[p];
            if (t % PRIMES[p] === 0) { ok = false; break; }
            m |= 1 << p;
          }
        }
        if (ok && t === 1) maskOf[v] = m;
      }
      const dp = new Array(1024).fill(0);
      dp[0] = 1;
      for (let v = 2; v <= 30; v++) {
        if (count[v] === 0 || maskOf[v] < 0) continue;
        const m = maskOf[v];
        for (let state = 1023; state >= 0; state--) {
          if ((state & m) !== 0 || dp[state] === 0) continue;
          dp[state | m] = (dp[state | m] + mulModX(dp[state], count[v])) % MODX;
        }
      }
      let total = 0;
      for (let state = 1; state < 1024; state++) total = (total + dp[state]) % MODX;
      for (let i = 0; i < count[1]; i++) total = (total * 2) % MODX;
      return total;
    };
    return {
      slug: "the-number-of-good-subsets",
      title: "The Number of Good Subsets",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Google", "Amazon", "Meta"],
      signature: { funcName: "numberOfGoodSubsets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subset of `nums` is **good** if it is non-empty and the product of its elements can be written as a product of **distinct primes** — that is, the product is square-free.\n\nReturn the number of good subsets, **modulo 10⁹ + 7**. Two subsets differ if they use different **indices**, even when the values match.",
        [
          { in: "nums = [1,2,3,4]", out: "6", note: "`{1}` is not good, but `{2}`, `{3}`, `{2,3}` each combine with including or excluding the 1." },
          { in: "nums = [4,2,3,15]", out: "5", note: "`{2}`, `{3}`, `{15}`, `{2,3}` and `{2,15}`." },
          { in: "nums = [4,8,9]", out: "0", note: "Every value has a squared prime factor." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 30"]),
      hints: [
        "Values above 30 never appear, so only the ten primes up to 29 matter — a 10-bit mask.",
        "A value with a repeated prime factor (4, 8, 9, 12, …) can never be in a good subset.",
        "1 multiplies the product by nothing, so each 1 can be included or not: multiply the answer by 2 per 1.",
      ],
      editorial: explain({
        idea: "Only values 1 to 30 appear, so each usable value maps to a 10-bit mask of its distinct primes; values with a squared factor are unusable. A subset-sum DP over those masks counts the good subsets among values 2 to 30, and the count of 1s contributes an independent factor of 2 each.",
        steps: [
          "Tally the values and build, for each 2..30, its prime mask — or mark it unusable when a prime repeats.",
          "Run `dp[mask]` over the 1024 states, processing each usable value once and multiplying by how many copies it has.",
          "Sum `dp[mask]` over all non-zero masks.",
          "Multiply by `2^(count of 1s)`.",
        ],
        why: "Multiplying by `count[v]` rather than looping over copies is what makes duplicates cheap: any one of the `count[v]` indices holding `v` gives a distinct subset, and since a good subset uses each **value** at most once, the copies never interact. The 1s factor out entirely because they change neither the product's primes nor the mask.",
        time: "O(30 · 2¹⁰ + n)",
        space: "O(2¹⁰)",
        pitfalls: [
          "The all-ones subset is not good — the empty prime mask is excluded from the sum.",
          "Values like 4, 8, 9, 12, 16, 18, 20, 24, 25, 27 and 28 have a squared prime and are unusable.",
          "Subsets are counted by index, so duplicate values multiply the count.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "6" },
        { input: "[4,2,3,15]", expectedOutput: "5" },
        { input: "[4,8,9]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 30));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from collections import Counter\nfrom typing import List\n\ndef numberOfGoodSubsets(nums: List[int]) -> int:\n    MOD = 10**9 + 7\n    primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n    count = Counter(nums)\n    mask_of = {}\n    for v in range(2, 31):\n        m, t, ok = 0, v, True\n        for i, p in enumerate(primes):\n            if t % p == 0:\n                t //= p\n                if t % p == 0:\n                    ok = False\n                    break\n                m |= 1 << i\n        if ok and t == 1:\n            mask_of[v] = m\n    dp = [0] * 1024\n    dp[0] = 1\n    for v in range(2, 31):\n        if count[v] == 0 or v not in mask_of:\n            continue\n        m = mask_of[v]\n        for state in range(1023, -1, -1):\n            if state & m or dp[state] == 0:\n                continue\n            dp[state | m] = (dp[state | m] + dp[state] * count[v]) % MOD\n    total = sum(dp[1:]) % MOD\n    return total * pow(2, count[1], MOD) % MOD`,
        javascript: `var numberOfGoodSubsets = function(nums) {\n    var MOD = 1000000007;\n    var PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    var mulmod = function(a, b) {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var count = [], v, i;\n    for (v = 0; v <= 30; v++) count.push(0);\n    for (i = 0; i < nums.length; i++) count[nums[i]]++;\n    var maskOf = [];\n    for (v = 0; v <= 30; v++) maskOf.push(-1);\n    for (v = 2; v <= 30; v++) {\n        var m = 0, t = v, ok = true;\n        for (var p = 0; p < PRIMES.length; p++) {\n            if (t % PRIMES[p] === 0) {\n                t = t / PRIMES[p];\n                if (t % PRIMES[p] === 0) { ok = false; break; }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t === 1) maskOf[v] = m;\n    }\n    var dp = [];\n    for (i = 0; i < 1024; i++) dp.push(0);\n    dp[0] = 1;\n    for (v = 2; v <= 30; v++) {\n        if (count[v] === 0 || maskOf[v] < 0) continue;\n        var mv = maskOf[v];\n        for (var state = 1023; state >= 0; state--) {\n            if ((state & mv) !== 0 || dp[state] === 0) continue;\n            dp[state | mv] = (dp[state | mv] + mulmod(dp[state], count[v])) % MOD;\n        }\n    }\n    var total = 0;\n    for (state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (i = 0; i < count[1]; i++) total = (total * 2) % MOD;\n    return total;\n};`,
        typescript: `function numberOfGoodSubsets(nums: number[]): number {\n    var MOD = 1000000007;\n    var PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    var mulmod = function(a: number, b: number): number {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var count: number[] = [], v: number, i: number;\n    for (v = 0; v <= 30; v++) count.push(0);\n    for (i = 0; i < nums.length; i++) count[nums[i]]++;\n    var maskOf: number[] = [];\n    for (v = 0; v <= 30; v++) maskOf.push(-1);\n    for (v = 2; v <= 30; v++) {\n        var m = 0, t = v, ok = true;\n        for (var p = 0; p < PRIMES.length; p++) {\n            if (t % PRIMES[p] === 0) {\n                t = t / PRIMES[p];\n                if (t % PRIMES[p] === 0) { ok = false; break; }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t === 1) maskOf[v] = m;\n    }\n    var dp: number[] = [];\n    for (i = 0; i < 1024; i++) dp.push(0);\n    dp[0] = 1;\n    for (v = 2; v <= 30; v++) {\n        if (count[v] === 0 || maskOf[v] < 0) continue;\n        var mv = maskOf[v];\n        for (var state = 1023; state >= 0; state--) {\n            if ((state & mv) !== 0 || dp[state] === 0) continue;\n            dp[state | mv] = (dp[state | mv] + mulmod(dp[state], count[v])) % MOD;\n        }\n    }\n    var total = 0;\n    for (state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (i = 0; i < count[1]; i++) total = (total * 2) % MOD;\n    return total;\n}`,
        java: `public static int numberOfGoodSubsets(int[] nums) {\n    final long MOD = 1000000007L;\n    int[] primes = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29};\n    int[] count = new int[31];\n    for (int v : nums) count[v]++;\n    int[] maskOf = new int[31];\n    Arrays.fill(maskOf, -1);\n    for (int v = 2; v <= 30; v++) {\n        int m = 0, t = v;\n        boolean ok = true;\n        for (int p = 0; p < primes.length; p++) {\n            if (t % primes[p] == 0) {\n                t /= primes[p];\n                if (t % primes[p] == 0) {\n                    ok = false;\n                    break;\n                }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t == 1) maskOf[v] = m;\n    }\n    long[] dp = new long[1024];\n    dp[0] = 1;\n    for (int v = 2; v <= 30; v++) {\n        if (count[v] == 0 || maskOf[v] < 0) continue;\n        int mv = maskOf[v];\n        for (int state = 1023; state >= 0; state--) {\n            if ((state & mv) != 0 || dp[state] == 0) continue;\n            dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % MOD;\n        }\n    }\n    long total = 0;\n    for (int state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (int i = 0; i < count[1]; i++) total = total * 2 % MOD;\n    return (int) total;\n}`,
        cpp: `int numberOfGoodSubsets(vector<int>& nums) {\n    const long long MOD = 1000000007LL;\n    int primes[10] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29};\n    vector<int> count(31, 0);\n    for (int v : nums) count[v]++;\n    vector<int> maskOf(31, -1);\n    for (int v = 2; v <= 30; v++) {\n        int m = 0, t = v;\n        bool ok = true;\n        for (int p = 0; p < 10; p++) {\n            if (t % primes[p] == 0) {\n                t /= primes[p];\n                if (t % primes[p] == 0) {\n                    ok = false;\n                    break;\n                }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t == 1) maskOf[v] = m;\n    }\n    vector<long long> dp(1024, 0);\n    dp[0] = 1;\n    for (int v = 2; v <= 30; v++) {\n        if (count[v] == 0 || maskOf[v] < 0) continue;\n        int mv = maskOf[v];\n        for (int state = 1023; state >= 0; state--) {\n            if ((state & mv) != 0 || dp[state] == 0) continue;\n            dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % MOD;\n        }\n    }\n    long long total = 0;\n    for (int state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (int i = 0; i < count[1]; i++) total = total * 2 % MOD;\n    return (int) total;\n}`,
        c: `int numberOfGoodSubsets(int* nums, int numsSize) {\n    const long long MOD = 1000000007LL;\n    int primes[10] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29};\n    int count[31];\n    for (int v = 0; v <= 30; v++) count[v] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int maskOf[31];\n    for (int v = 0; v <= 30; v++) maskOf[v] = -1;\n    for (int v = 2; v <= 30; v++) {\n        int m = 0, t = v, ok = 1;\n        for (int p = 0; p < 10; p++) {\n            if (t % primes[p] == 0) {\n                t /= primes[p];\n                if (t % primes[p] == 0) { ok = 0; break; }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t == 1) maskOf[v] = m;\n    }\n    long long* dp = (long long*) calloc(1024, sizeof(long long));\n    dp[0] = 1;\n    for (int v = 2; v <= 30; v++) {\n        if (count[v] == 0 || maskOf[v] < 0) continue;\n        int mv = maskOf[v];\n        for (int state = 1023; state >= 0; state--) {\n            if ((state & mv) != 0 || dp[state] == 0) continue;\n            dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % MOD;\n        }\n    }\n    long long total = 0;\n    for (int state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (int i = 0; i < count[1]; i++) total = total * 2 % MOD;\n    free(dp);\n    return (int) total;\n}`,
        csharp: `public static int NumberOfGoodSubsets(int[] nums)\n{\n    const long MOD = 1000000007L;\n    int[] primes = { 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };\n    var count = new int[31];\n    foreach (var v in nums) count[v]++;\n    var maskOf = new int[31];\n    for (int v = 0; v <= 30; v++) maskOf[v] = -1;\n    for (int v = 2; v <= 30; v++)\n    {\n        int m = 0, t = v;\n        bool ok = true;\n        for (int p = 0; p < primes.Length; p++)\n        {\n            if (t % primes[p] == 0)\n            {\n                t /= primes[p];\n                if (t % primes[p] == 0) { ok = false; break; }\n                m |= 1 << p;\n            }\n        }\n        if (ok && t == 1) maskOf[v] = m;\n    }\n    var dp = new long[1024];\n    dp[0] = 1;\n    for (int v = 2; v <= 30; v++)\n    {\n        if (count[v] == 0 || maskOf[v] < 0) continue;\n        int mv = maskOf[v];\n        for (int state = 1023; state >= 0; state--)\n        {\n            if ((state & mv) != 0 || dp[state] == 0) continue;\n            dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % MOD;\n        }\n    }\n    long total = 0;\n    for (int state = 1; state < 1024; state++) total = (total + dp[state]) % MOD;\n    for (int i = 0; i < count[1]; i++) total = total * 2 % MOD;\n    return (int) total;\n}`,
        go: `func numberOfGoodSubsets(nums []int) int {\n\tconst MOD = 1000000007\n\tprimes := []int{2, 3, 5, 7, 11, 13, 17, 19, 23, 29}\n\tvar count [31]int\n\tfor _, v := range nums {\n\t\tcount[v]++\n\t}\n\tvar maskOf [31]int\n\tfor v := range maskOf {\n\t\tmaskOf[v] = -1\n\t}\n\tfor v := 2; v <= 30; v++ {\n\t\tm, t, ok := 0, v, true\n\t\tfor p, prime := range primes {\n\t\t\tif t%prime == 0 {\n\t\t\t\tt /= prime\n\t\t\t\tif t%prime == 0 {\n\t\t\t\t\tok = false\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t\tm |= 1 << p\n\t\t\t}\n\t\t}\n\t\tif ok && t == 1 {\n\t\t\tmaskOf[v] = m\n\t\t}\n\t}\n\tdp := make([]int, 1024)\n\tdp[0] = 1\n\tfor v := 2; v <= 30; v++ {\n\t\tif count[v] == 0 || maskOf[v] < 0 {\n\t\t\tcontinue\n\t\t}\n\t\tmv := maskOf[v]\n\t\tfor state := 1023; state >= 0; state-- {\n\t\t\tif state&mv != 0 || dp[state] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdp[state|mv] = (dp[state|mv] + dp[state]*count[v]) % MOD\n\t\t}\n\t}\n\ttotal := 0\n\tfor state := 1; state < 1024; state++ {\n\t\ttotal = (total + dp[state]) % MOD\n\t}\n\tfor i := 0; i < count[1]; i++ {\n\t\ttotal = total * 2 % MOD\n\t}\n\treturn total\n}`,
        kotlin: `fun numberOfGoodSubsets(nums: IntArray): Int {\n    val mod = 1000000007L\n    val primes = intArrayOf(2, 3, 5, 7, 11, 13, 17, 19, 23, 29)\n    val count = IntArray(31)\n    for (v in nums) count[v]++\n    val maskOf = IntArray(31) { -1 }\n    for (v in 2..30) {\n        var m = 0\n        var t = v\n        var ok = true\n        for (p in primes.indices) {\n            if (t % primes[p] == 0) {\n                t /= primes[p]\n                if (t % primes[p] == 0) {\n                    ok = false\n                    break\n                }\n                m = m or (1 shl p)\n            }\n        }\n        if (ok && t == 1) maskOf[v] = m\n    }\n    val dp = LongArray(1024)\n    dp[0] = 1\n    for (v in 2..30) {\n        if (count[v] == 0 || maskOf[v] < 0) continue\n        val mv = maskOf[v]\n        for (state in 1023 downTo 0) {\n            if (state and mv != 0 || dp[state] == 0L) continue\n            dp[state or mv] = (dp[state or mv] + dp[state] * count[v]) % mod\n        }\n    }\n    var total = 0L\n    for (state in 1 until 1024) total = (total + dp[state]) % mod\n    repeat(count[1]) { total = total * 2 % mod }\n    return total.toInt()\n}`,
        swift: `func numberOfGoodSubsets(_ nums: [Int]) -> Int {\n    let mod = 1000000007\n    let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n    var count = [Int](repeating: 0, count: 31)\n    for v in nums { count[v] += 1 }\n    var maskOf = [Int](repeating: -1, count: 31)\n    for v in 2...30 {\n        var m = 0\n        var t = v\n        var ok = true\n        for p in 0..<primes.count where t % primes[p] == 0 {\n            t /= primes[p]\n            if t % primes[p] == 0 {\n                ok = false\n                break\n            }\n            m |= 1 << p\n        }\n        if ok && t == 1 { maskOf[v] = m }\n    }\n    var dp = [Int](repeating: 0, count: 1024)\n    dp[0] = 1\n    for v in 2...30 {\n        if count[v] == 0 || maskOf[v] < 0 { continue }\n        let mv = maskOf[v]\n        var state = 1023\n        while state >= 0 {\n            if state & mv == 0 && dp[state] != 0 {\n                dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % mod\n            }\n            state -= 1\n        }\n    }\n    var total = 0\n    for state in 1..<1024 { total = (total + dp[state]) % mod }\n    for _ in 0..<count[1] { total = total * 2 % mod }\n    return total\n}`,
        rust: `fn numberOfGoodSubsets(nums: Vec<i32>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    let mut count = [0i64; 31];\n    for &v in nums.iter() {\n        count[v as usize] += 1;\n    }\n    let mut mask_of = [-1i32; 31];\n    for v in 2..=30usize {\n        let mut m = 0i32;\n        let mut t = v;\n        let mut ok = true;\n        for (p, &prime) in primes.iter().enumerate() {\n            if t % prime == 0 {\n                t /= prime;\n                if t % prime == 0 {\n                    ok = false;\n                    break;\n                }\n                m |= 1 << p;\n            }\n        }\n        if ok && t == 1 {\n            mask_of[v] = m;\n        }\n    }\n    let mut dp = vec![0i64; 1024];\n    dp[0] = 1;\n    for v in 2..=30usize {\n        if count[v] == 0 || mask_of[v] < 0 {\n            continue;\n        }\n        let mv = mask_of[v] as usize;\n        for state in (0..1024usize).rev() {\n            if state & mv != 0 || dp[state] == 0 {\n                continue;\n            }\n            dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % MOD;\n        }\n    }\n    let mut total: i64 = 0;\n    for state in 1..1024 {\n        total = (total + dp[state]) % MOD;\n    }\n    for _ in 0..count[1] {\n        total = total * 2 % MOD;\n    }\n    total as i32\n}`,
        php: `function numberOfGoodSubsets($nums) {\n    $MOD = 1000000007;\n    $primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    $count = array_fill(0, 31, 0);\n    foreach ($nums as $v) $count[$v]++;\n    $maskOf = array_fill(0, 31, -1);\n    for ($v = 2; $v <= 30; $v++) {\n        $m = 0;\n        $t = $v;\n        $ok = true;\n        foreach ($primes as $p => $prime) {\n            if ($t % $prime === 0) {\n                $t = intdiv($t, $prime);\n                if ($t % $prime === 0) { $ok = false; break; }\n                $m |= 1 << $p;\n            }\n        }\n        if ($ok && $t === 1) $maskOf[$v] = $m;\n    }\n    $dp = array_fill(0, 1024, 0);\n    $dp[0] = 1;\n    for ($v = 2; $v <= 30; $v++) {\n        if ($count[$v] === 0 || $maskOf[$v] < 0) continue;\n        $mv = $maskOf[$v];\n        for ($state = 1023; $state >= 0; $state--) {\n            if (($state & $mv) !== 0 || $dp[$state] === 0) continue;\n            $dp[$state | $mv] = ($dp[$state | $mv] + $dp[$state] * $count[$v]) % $MOD;\n        }\n    }\n    $total = 0;\n    for ($state = 1; $state < 1024; $state++) $total = ($total + $dp[$state]) % $MOD;\n    for ($i = 0; $i < $count[1]; $i++) $total = $total * 2 % $MOD;\n    return $total;\n}`,
        ruby: `def numberOfGoodSubsets(nums)\n  mod = 1000000007\n  primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n  count = Array.new(31, 0)\n  nums.each { |v| count[v] += 1 }\n  mask_of = Array.new(31, -1)\n  (2..30).each do |v|\n    m = 0\n    t = v\n    ok = true\n    primes.each_with_index do |prime, p|\n      next unless t % prime == 0\n      t /= prime\n      if t % prime == 0\n        ok = false\n        break\n      end\n      m |= 1 << p\n    end\n    mask_of[v] = m if ok && t == 1\n  end\n  dp = Array.new(1024, 0)\n  dp[0] = 1\n  (2..30).each do |v|\n    next if count[v] == 0 || mask_of[v] < 0\n    mv = mask_of[v]\n    1023.downto(0) do |state|\n      next if state & mv != 0 || dp[state] == 0\n      dp[state | mv] = (dp[state | mv] + dp[state] * count[v]) % mod\n    end\n  end\n  total = (1...1024).sum { |state| dp[state] } % mod\n  total * 2.pow(count[1], mod) % mod\nend`,
      },
    };
  })(),

  // ── Rearrange Sticks With K Sticks Visible (LC 1866) ────────────
  (() => {
    const ref = (n: number, k: number) => {
      // dp[j] over one row at a time: dp[i][j] = dp[i-1][j-1] + (i-1) * dp[i-1][j].
      let dp = new Array(k + 1).fill(0);
      dp[0] = 1;
      for (let i = 1; i <= n; i++) {
        const next = new Array(k + 1).fill(0);
        for (let j = 1; j <= k && j <= i; j++) {
          next[j] = (dp[j - 1] + mulModX(dp[j], i - 1)) % MODX;
        }
        dp = next;
      }
      return dp[k];
    };
    return {
      slug: "number-of-ways-to-rearrange-sticks-with-k-sticks-visible",
      title: "Number of Ways to Rearrange Sticks With K Sticks Visible",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Google", "Amazon", "Meta"],
      signature: { funcName: "rearrangeSticks", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` sticks of distinct lengths 1 through `n`. Arrange them in a row; a stick is **visible from the left** when every stick before it is shorter.\n\nReturn the number of arrangements in which exactly `k` sticks are visible, **modulo 10⁹ + 7**.",
        [
          { in: "n = 3, k = 2", out: "3", note: "`[1,3,2]`, `[2,3,1]` and `[2,1,3]`." },
          { in: "n = 5, k = 5", out: "1", note: "Only the fully sorted arrangement shows all five." },
          { in: "n = 20, k = 11", out: "647427950" },
        ],
        ["1 <= n <= 1000", "1 <= k <= n"]),
      hints: [
        "Think about where the **longest** stick goes. If it is first, it is visible and the rest is a smaller instance needing `k - 1`.",
        "If it is anywhere else, it hides nothing that was already visible — and there are `n - 1` positions for it.",
        "`dp[i][j] = dp[i-1][j-1] + (i-1) · dp[i-1][j]` — the unsigned Stirling numbers of the first kind.",
      ],
      editorial: explain({
        idea: "Condition on the **longest** stick. Placed first it is visible and the remaining `n - 1` sticks must show `k - 1`; placed in any of the other `n - 1` positions it is never visible and the remaining sticks must still show `k`. That gives `dp[i][j] = dp[i-1][j-1] + (i-1) · dp[i-1][j]`.",
        steps: [
          "Set `dp[0][0] = 1`.",
          "Roll forward one row at a time: `next[j] = dp[j-1] + (i-1) · dp[j]`, modulo 10⁹ + 7.",
          "Return `dp[n][k]`.",
        ],
        why: "Conditioning on the longest stick rather than the first position is what makes the recurrence clean: the longest stick is always visible when first, and always hidden otherwise, so the two branches are exhaustive and disjoint with no case analysis on the other sticks. These are the unsigned Stirling numbers of the first kind, which is why the row-rolling form is both natural and O(n · k).",
        time: "O(n · k)",
        space: "O(k)",
        pitfalls: [
          "The multiplier is `i - 1`, the number of non-first positions, not `i`.",
          "`dp[0][0] = 1` seeds the recurrence; every other entry of row 0 is 0.",
          "`j` cannot exceed `i` — you cannot see more sticks than there are.",
        ],
      }),
      examples: [
        { input: "3\n2", expectedOutput: "3" },
        { input: "5\n5", expectedOutput: "1" },
        { input: "20\n11", expectedOutput: "647427950" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def rearrangeSticks(n: int, k: int) -> int:\n    MOD = 10**9 + 7\n    dp = [0] * (k + 1)\n    dp[0] = 1\n    for i in range(1, n + 1):\n        nxt = [0] * (k + 1)\n        for j in range(1, min(k, i) + 1):\n            nxt[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD\n        dp = nxt\n    return dp[k]`,
        javascript: `var rearrangeSticks = function(n, k) {\n    var MOD = 1000000007, j;\n    var dp = [];\n    for (j = 0; j <= k; j++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 1; i <= n; i++) {\n        var next = [];\n        for (j = 0; j <= k; j++) next.push(0);\n        for (j = 1; j <= k && j <= i; j++) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        dp = next;\n    }\n    return dp[k];\n};`,
        typescript: `function rearrangeSticks(n: number, k: number): number {\n    var MOD = 1000000007, j: number;\n    var dp: number[] = [];\n    for (j = 0; j <= k; j++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 1; i <= n; i++) {\n        var next: number[] = [];\n        for (j = 0; j <= k; j++) next.push(0);\n        for (j = 1; j <= k && j <= i; j++) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        dp = next;\n    }\n    return dp[k];\n}`,
        java: `public static int rearrangeSticks(int n, int k) {\n    final long MOD = 1000000007L;\n    long[] dp = new long[k + 1];\n    dp[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        long[] next = new long[k + 1];\n        for (int j = 1; j <= k && j <= i; j++) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        dp = next;\n    }\n    return (int) dp[k];\n}`,
        cpp: `int rearrangeSticks(int n, int k) {\n    const long long MOD = 1000000007LL;\n    vector<long long> dp(k + 1, 0);\n    dp[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        vector<long long> next(k + 1, 0);\n        for (int j = 1; j <= k && j <= i; j++) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        dp = next;\n    }\n    return (int) dp[k];\n}`,
        c: `int rearrangeSticks(int n, int k) {\n    const long long MOD = 1000000007LL;\n    long long* dp = (long long*) calloc((size_t) (k + 1), sizeof(long long));\n    long long* next = (long long*) calloc((size_t) (k + 1), sizeof(long long));\n    dp[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        for (int j = 0; j <= k; j++) next[j] = 0;\n        for (int j = 1; j <= k && j <= i; j++) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        for (int j = 0; j <= k; j++) dp[j] = next[j];\n    }\n    int answer = (int) dp[k];\n    free(dp);\n    free(next);\n    return answer;\n}`,
        csharp: `public static int RearrangeSticks(int n, int k)\n{\n    const long MOD = 1000000007L;\n    var dp = new long[k + 1];\n    dp[0] = 1;\n    for (int i = 1; i <= n; i++)\n    {\n        var next = new long[k + 1];\n        for (int j = 1; j <= k && j <= i; j++)\n        {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % MOD;\n        }\n        dp = next;\n    }\n    return (int) dp[k];\n}`,
        go: `func rearrangeSticks(n int, k int) int {\n\tconst MOD = 1000000007\n\tdp := make([]int, k+1)\n\tdp[0] = 1\n\tfor i := 1; i <= n; i++ {\n\t\tnext := make([]int, k+1)\n\t\tfor j := 1; j <= k && j <= i; j++ {\n\t\t\tnext[j] = (dp[j-1] + dp[j]*(i-1)) % MOD\n\t\t}\n\t\tdp = next\n\t}\n\treturn dp[k]\n}`,
        kotlin: `fun rearrangeSticks(n: Int, k: Int): Int {\n    val mod = 1000000007L\n    var dp = LongArray(k + 1)\n    dp[0] = 1\n    for (i in 1..n) {\n        val next = LongArray(k + 1)\n        var j = 1\n        while (j <= k && j <= i) {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % mod\n            j++\n        }\n        dp = next\n    }\n    return dp[k].toInt()\n}`,
        swift: `func rearrangeSticks(_ n: Int, _ k: Int) -> Int {\n    let mod = 1000000007\n    var dp = [Int](repeating: 0, count: k + 1)\n    dp[0] = 1\n    for i in 1...n {\n        var next = [Int](repeating: 0, count: k + 1)\n        var j = 1\n        while j <= k && j <= i {\n            next[j] = (dp[j - 1] + dp[j] * (i - 1)) % mod\n            j += 1\n        }\n        dp = next\n    }\n    return dp[k]\n}`,
        rust: `fn rearrangeSticks(n: i32, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let k = k as usize;\n    let mut dp = vec![0i64; k + 1];\n    dp[0] = 1;\n    for i in 1..=n {\n        let mut next = vec![0i64; k + 1];\n        let mut j = 1usize;\n        while j <= k && j <= i as usize {\n            next[j] = (dp[j - 1] + dp[j] * (i as i64 - 1)) % MOD;\n            j += 1;\n        }\n        dp = next;\n    }\n    dp[k] as i32\n}`,
        php: `function rearrangeSticks($n, $k) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, $k + 1, 0);\n    $dp[0] = 1;\n    for ($i = 1; $i <= $n; $i++) {\n        $next = array_fill(0, $k + 1, 0);\n        for ($j = 1; $j <= $k && $j <= $i; $j++) {\n            $next[$j] = ($dp[$j - 1] + $dp[$j] * ($i - 1)) % $MOD;\n        }\n        $dp = $next;\n    }\n    return $dp[$k];\n}`,
        ruby: `def rearrangeSticks(n, k)\n  mod = 1000000007\n  dp = Array.new(k + 1, 0)\n  dp[0] = 1\n  (1..n).each do |i|\n    nxt = Array.new(k + 1, 0)\n    j = 1\n    while j <= k && j <= i\n      nxt[j] = (dp[j - 1] + dp[j] * (i - 1)) % mod\n      j += 1\n    end\n    dp = nxt\n  end\n  dp[k]\nend`,
      },
    };
  })(),

  // ── Count the Number of Ideal Arrays (LC 2338) ──────────────────
  (() => {
    const powMod = (base: number, exp: number) => {
      let result = 1, b = base % MODX, e = exp;
      while (e > 0) {
        if (e % 2 === 1) result = mulModX(result, b);
        b = mulModX(b, b);
        e = Math.floor(e / 2);
      }
      return result;
    };
    // Exponents never exceed 13, since 2^14 already passes the 10^4 ceiling.
    const MAXE = 14;
    const invFact = (() => {
      const fact = new Array(MAXE + 1).fill(1);
      for (let i = 1; i <= MAXE; i++) fact[i] = mulModX(fact[i - 1], i);
      const inv = new Array(MAXE + 1).fill(1);
      inv[MAXE] = powMod(fact[MAXE], MODX - 2);
      for (let i = MAXE; i >= 1; i--) inv[i - 1] = mulModX(inv[i], i);
      return inv;
    })();
    const choose = (n: number, e: number) => {
      // C(n - 1 + e, e) = n * (n+1) * ... * (n+e-1) / e!
      let num = 1;
      for (let t = 0; t < e; t++) num = mulModX(num, (n + t) % MODX);
      return mulModX(num, invFact[e]);
    };
    const ref = (n: number, maxValue: number) => {
      const spf = new Array(maxValue + 1).fill(0);
      for (let p = 2; p <= maxValue; p++) {
        if (spf[p] !== 0) continue;
        for (let q = p; q <= maxValue; q += p) if (spf[q] === 0) spf[q] = p;
      }
      let total = 0;
      for (let x = 1; x <= maxValue; x++) {
        let ways = 1, t = x;
        while (t > 1) {
          const p = spf[t];
          let e = 0;
          while (t % p === 0) { t = t / p; e++; }
          ways = mulModX(ways, choose(n, e));
        }
        total = (total + ways) % MODX;
      }
      return total;
    };
    return {
      slug: "count-the-number-of-ideal-arrays",
      title: "Count the Number of Ideal Arrays",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Number Theory", "Google", "Amazon", "Meta"],
      signature: { funcName: "idealArrays", params: [{ name: "n", type: "int" as const }, { name: "maxValue", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An array of length `n` is **ideal** when every entry lies in `[1, maxValue]` and each entry from the second onward is **divisible by the one before it**.\n\nReturn the number of ideal arrays, **modulo 10⁹ + 7**.",
        [
          { in: "n = 2, maxValue = 5", out: "10", note: "`[1,1]`, `[1,2]`, `[1,3]`, `[1,4]`, `[1,5]`, `[2,2]`, `[2,4]`, `[3,3]`, `[4,4]`, `[5,5]`." },
          { in: "n = 5, maxValue = 3", out: "11", note: "The all-ones array, plus five placements each for a run of 2s and a run of 3s." },
          { in: "n = 3, maxValue = 1", out: "1" },
        ],
        ["2 <= n <= 10^4", "1 <= maxValue <= 10^4"]),
      hints: [
        "Group the arrays by their **final** value `x`. The array is then a chain of divisors ending at `x`.",
        "Each prime of `x` is distributed independently: its exponent `e` has to be split across the `n` positions as a non-decreasing run.",
        "That is `C(n - 1 + e, e)` ways per prime, and the primes multiply.",
      ],
      editorial: explain({
        idea: "Classify by the array's last value `x`. Building the array means deciding, for each prime power `p^e` dividing `x`, at which of the `n` positions each of the `e` factors of `p` is introduced — a multiset choice of `e` from `n`, which is `C(n - 1 + e, e)`. The primes are independent, so the count for `x` is their product, and the answer sums over `x`.",
        steps: [
          "Sieve the smallest prime factor up to `maxValue`.",
          "Precompute the inverse factorials for exponents up to 13 — no exponent can exceed that below 10⁴.",
          "For each `x`, factorize it and multiply `C(n - 1 + e, e)` over its prime exponents.",
          "Sum the products modulo 10⁹ + 7.",
        ],
        why: "The primes factor apart because divisibility is decided prime by prime — a chain of divisors is just a non-decreasing exponent vector per prime, and those choices never interact. `C(n - 1 + e, e)` is the stars-and-bars count of ways to distribute `e` indistinguishable increments across `n` ordered positions, which is exactly where each factor of `p` enters the chain.",
        time: "O(maxValue · log maxValue)",
        space: "O(maxValue)",
        pitfalls: [
          "The binomial's top is `n - 1 + e`, not `n + e` — the first position is where the chain starts.",
          "`x = 1` contributes exactly 1 (the all-ones array) and has no primes to multiply.",
          "The exponents are tiny, so the binomials need only a handful of inverse factorials rather than a full table up to `n`.",
        ],
      }),
      examples: [
        { input: "2\n5", expectedOutput: "10" },
        { input: "5\n3", expectedOutput: "11" },
        { input: "3\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 60);
        const maxValue = ri(rng, 1, 300);
        return { input: `${n}\n${maxValue}`, expectedOutput: String(ref(n, maxValue)) };
      },
      solutions: {
        python: `def idealArrays(n: int, maxValue: int) -> int:\n    MOD = 10**9 + 7\n    MAXE = 14\n    fact = [1] * (MAXE + 1)\n    for i in range(1, MAXE + 1):\n        fact[i] = fact[i - 1] * i % MOD\n    inv_fact = [1] * (MAXE + 1)\n    inv_fact[MAXE] = pow(fact[MAXE], MOD - 2, MOD)\n    for i in range(MAXE, 0, -1):\n        inv_fact[i - 1] = inv_fact[i] * i % MOD\n\n    def choose(top: int, e: int) -> int:\n        num = 1\n        for t in range(e):\n            num = num * ((top + t) % MOD) % MOD\n        return num * inv_fact[e] % MOD\n\n    spf = [0] * (maxValue + 1)\n    for p in range(2, maxValue + 1):\n        if spf[p]:\n            continue\n        for q in range(p, maxValue + 1, p):\n            if spf[q] == 0:\n                spf[q] = p\n    total = 0\n    for x in range(1, maxValue + 1):\n        ways = 1\n        t = x\n        while t > 1:\n            p = spf[t]\n            e = 0\n            while t % p == 0:\n                t //= p\n                e += 1\n            ways = ways * choose(n, e) % MOD\n        total = (total + ways) % MOD\n    return total`,
        javascript: `var idealArrays = function(n, maxValue) {\n    var MOD = 1000000007, i;\n    var mulmod = function(a, b) {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var powmod = function(base, exp) {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var MAXE = 14;\n    var fact = [1];\n    for (i = 1; i <= MAXE; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact = [];\n    for (i = 0; i <= MAXE; i++) invFact.push(1);\n    invFact[MAXE] = powmod(fact[MAXE], MOD - 2);\n    for (i = MAXE; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var choose = function(top, e) {\n        var num = 1;\n        for (var t = 0; t < e; t++) num = mulmod(num, (top + t) % MOD);\n        return mulmod(num, invFact[e]);\n    };\n    var spf = [];\n    for (i = 0; i <= maxValue; i++) spf.push(0);\n    for (var p = 2; p <= maxValue; p++) {\n        if (spf[p] !== 0) continue;\n        for (var q = p; q <= maxValue; q += p) if (spf[q] === 0) spf[q] = p;\n    }\n    var total = 0;\n    for (var x = 1; x <= maxValue; x++) {\n        var ways = 1, t = x;\n        while (t > 1) {\n            var pf = spf[t];\n            var e = 0;\n            while (t % pf === 0) { t = t / pf; e++; }\n            ways = mulmod(ways, choose(n, e));\n        }\n        total = (total + ways) % MOD;\n    }\n    return total;\n};`,
        typescript: `function idealArrays(n: number, maxValue: number): number {\n    var MOD = 1000000007, i: number;\n    var mulmod = function(a: number, b: number): number {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var powmod = function(base: number, exp: number): number {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var MAXE = 14;\n    var fact: number[] = [1];\n    for (i = 1; i <= MAXE; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact: number[] = [];\n    for (i = 0; i <= MAXE; i++) invFact.push(1);\n    invFact[MAXE] = powmod(fact[MAXE], MOD - 2);\n    for (i = MAXE; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var choose = function(top: number, e: number): number {\n        var num = 1;\n        for (var t = 0; t < e; t++) num = mulmod(num, (top + t) % MOD);\n        return mulmod(num, invFact[e]);\n    };\n    var spf: number[] = [];\n    for (i = 0; i <= maxValue; i++) spf.push(0);\n    for (var p = 2; p <= maxValue; p++) {\n        if (spf[p] !== 0) continue;\n        for (var q = p; q <= maxValue; q += p) if (spf[q] === 0) spf[q] = p;\n    }\n    var total = 0;\n    for (var x = 1; x <= maxValue; x++) {\n        var ways = 1, t = x;\n        while (t > 1) {\n            var pf = spf[t];\n            var e = 0;\n            while (t % pf === 0) { t = t / pf; e++; }\n            ways = mulmod(ways, choose(n, e));\n        }\n        total = (total + ways) % MOD;\n    }\n    return total;\n}`,
        java: `public static int idealArrays(int n, int maxValue) {\n    final long MOD = 1000000007L;\n    final int MAXE = 14;\n    long[] fact = new long[MAXE + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long[] invFact = new long[MAXE + 1];\n    long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if ((e & 1L) == 1L) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    int[] spf = new int[maxValue + 1];\n    for (int p = 2; p <= maxValue; p++) {\n        if (spf[p] != 0) continue;\n        for (int q = p; q <= maxValue; q += p) {\n            if (spf[q] == 0) spf[q] = p;\n        }\n    }\n    long total = 0;\n    for (int x = 1; x <= maxValue; x++) {\n        long ways = 1;\n        int t = x;\n        while (t > 1) {\n            int p = spf[t];\n            int exp = 0;\n            while (t % p == 0) {\n                t /= p;\n                exp++;\n            }\n            long num = 1;\n            for (int s = 0; s < exp; s++) num = num * ((n + s) % MOD) % MOD;\n            ways = ways * (num * invFact[exp] % MOD) % MOD;\n        }\n        total = (total + ways) % MOD;\n    }\n    return (int) total;\n}`,
        cpp: `int idealArrays(int n, int maxValue) {\n    const long long MOD = 1000000007LL;\n    const int MAXE = 14;\n    vector<long long> fact(MAXE + 1, 1), invFact(MAXE + 1, 1);\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    vector<int> spf(maxValue + 1, 0);\n    for (int p = 2; p <= maxValue; p++) {\n        if (spf[p] != 0) continue;\n        for (int q = p; q <= maxValue; q += p) {\n            if (spf[q] == 0) spf[q] = p;\n        }\n    }\n    long long total = 0;\n    for (int x = 1; x <= maxValue; x++) {\n        long long ways = 1;\n        int t = x;\n        while (t > 1) {\n            int p = spf[t];\n            int exp = 0;\n            while (t % p == 0) {\n                t /= p;\n                exp++;\n            }\n            long long num = 1;\n            for (int s = 0; s < exp; s++) num = num * ((n + s) % MOD) % MOD;\n            ways = ways * (num * invFact[exp] % MOD) % MOD;\n        }\n        total = (total + ways) % MOD;\n    }\n    return (int) total;\n}`,
        c: `int idealArrays(int n, int maxValue) {\n    const long long MOD = 1000000007LL;\n    const int MAXE = 14;\n    long long fact[15], invFact[15];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    int* spf = (int*) calloc((size_t) (maxValue + 1), sizeof(int));\n    for (int p = 2; p <= maxValue; p++) {\n        if (spf[p] != 0) continue;\n        for (int q = p; q <= maxValue; q += p) {\n            if (spf[q] == 0) spf[q] = p;\n        }\n    }\n    long long total = 0;\n    for (int x = 1; x <= maxValue; x++) {\n        long long ways = 1;\n        int t = x;\n        while (t > 1) {\n            int p = spf[t];\n            int exp = 0;\n            while (t % p == 0) {\n                t /= p;\n                exp++;\n            }\n            long long num = 1;\n            for (int s = 0; s < exp; s++) num = num * ((n + s) % MOD) % MOD;\n            ways = ways * (num * invFact[exp] % MOD) % MOD;\n        }\n        total = (total + ways) % MOD;\n    }\n    free(spf);\n    return (int) total;\n}`,
        csharp: `public static int IdealArrays(int n, int maxValue)\n{\n    const long MOD = 1000000007L;\n    const int MAXE = 14;\n    var fact = new long[MAXE + 1];\n    var invFact = new long[MAXE + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long bse = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0)\n    {\n        if ((e & 1L) == 1L) cur = cur * bse % MOD;\n        bse = bse * bse % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    var spf = new int[maxValue + 1];\n    for (int p = 2; p <= maxValue; p++)\n    {\n        if (spf[p] != 0) continue;\n        for (int q = p; q <= maxValue; q += p)\n        {\n            if (spf[q] == 0) spf[q] = p;\n        }\n    }\n    long total = 0;\n    for (int x = 1; x <= maxValue; x++)\n    {\n        long ways = 1;\n        int t = x;\n        while (t > 1)\n        {\n            int p = spf[t];\n            int exp = 0;\n            while (t % p == 0)\n            {\n                t /= p;\n                exp++;\n            }\n            long num = 1;\n            for (int s = 0; s < exp; s++) num = num * ((n + s) % MOD) % MOD;\n            ways = ways * (num * invFact[exp] % MOD) % MOD;\n        }\n        total = (total + ways) % MOD;\n    }\n    return (int) total;\n}`,
        go: `func idealArrays(n int, maxValue int) int {\n\tconst MOD = 1000000007\n\tconst MAXE = 14\n\tfact := make([]int, MAXE+1)\n\tinvFact := make([]int, MAXE+1)\n\tfact[0] = 1\n\tfor i := 1; i <= MAXE; i++ {\n\t\tfact[i] = fact[i-1] * i % MOD\n\t}\n\tbase, e, cur := fact[MAXE], MOD-2, 1\n\tfor e > 0 {\n\t\tif e&1 == 1 {\n\t\t\tcur = cur * base % MOD\n\t\t}\n\t\tbase = base * base % MOD\n\t\te >>= 1\n\t}\n\tinvFact[MAXE] = cur\n\tfor i := MAXE; i >= 1; i-- {\n\t\tinvFact[i-1] = invFact[i] * i % MOD\n\t}\n\tspf := make([]int, maxValue+1)\n\tfor p := 2; p <= maxValue; p++ {\n\t\tif spf[p] != 0 {\n\t\t\tcontinue\n\t\t}\n\t\tfor q := p; q <= maxValue; q += p {\n\t\t\tif spf[q] == 0 {\n\t\t\t\tspf[q] = p\n\t\t\t}\n\t\t}\n\t}\n\ttotal := 0\n\tfor x := 1; x <= maxValue; x++ {\n\t\tways := 1\n\t\tt := x\n\t\tfor t > 1 {\n\t\t\tp := spf[t]\n\t\t\texp := 0\n\t\t\tfor t%p == 0 {\n\t\t\t\tt /= p\n\t\t\t\texp++\n\t\t\t}\n\t\t\tnum := 1\n\t\t\tfor s := 0; s < exp; s++ {\n\t\t\t\tnum = num * ((n + s) % MOD) % MOD\n\t\t\t}\n\t\t\tways = ways * (num * invFact[exp] % MOD) % MOD\n\t\t}\n\t\ttotal = (total + ways) % MOD\n\t}\n\treturn total\n}`,
        kotlin: `fun idealArrays(n: Int, maxValue: Int): Int {\n    val mod = 1000000007L\n    val maxE = 14\n    val fact = LongArray(maxE + 1)\n    val invFact = LongArray(maxE + 1)\n    fact[0] = 1\n    for (i in 1..maxE) fact[i] = fact[i - 1] * i % mod\n    var base = fact[maxE]\n    var e = mod - 2\n    var cur = 1L\n    while (e > 0) {\n        if (e and 1L == 1L) cur = cur * base % mod\n        base = base * base % mod\n        e = e shr 1\n    }\n    invFact[maxE] = cur\n    for (i in maxE downTo 1) invFact[i - 1] = invFact[i] * i % mod\n    val spf = IntArray(maxValue + 1)\n    for (p in 2..maxValue) {\n        if (spf[p] != 0) continue\n        var q = p\n        while (q <= maxValue) {\n            if (spf[q] == 0) spf[q] = p\n            q += p\n        }\n    }\n    var total = 0L\n    for (x in 1..maxValue) {\n        var ways = 1L\n        var t = x\n        while (t > 1) {\n            val p = spf[t]\n            var exp = 0\n            while (t % p == 0) {\n                t /= p\n                exp++\n            }\n            var num = 1L\n            for (s in 0 until exp) num = num * ((n + s).toLong() % mod) % mod\n            ways = ways * (num * invFact[exp] % mod) % mod\n        }\n        total = (total + ways) % mod\n    }\n    return total.toInt()\n}`,
        swift: `func idealArrays(_ n: Int, _ maxValue: Int) -> Int {\n    let mod = 1000000007\n    let maxE = 14\n    var fact = [Int](repeating: 1, count: maxE + 1)\n    for i in 1...maxE { fact[i] = fact[i - 1] * i % mod }\n    var invFact = [Int](repeating: 1, count: maxE + 1)\n    var base = fact[maxE]\n    var e = mod - 2\n    var cur = 1\n    while e > 0 {\n        if e & 1 == 1 { cur = cur * base % mod }\n        base = base * base % mod\n        e >>= 1\n    }\n    invFact[maxE] = cur\n    var i = maxE\n    while i >= 1 {\n        invFact[i - 1] = invFact[i] * i % mod\n        i -= 1\n    }\n    var spf = [Int](repeating: 0, count: maxValue + 1)\n    if maxValue >= 2 {\n        for p in 2...maxValue where spf[p] == 0 {\n            var q = p\n            while q <= maxValue {\n                if spf[q] == 0 { spf[q] = p }\n                q += p\n            }\n        }\n    }\n    var total = 0\n    for x in 1...maxValue {\n        var ways = 1\n        var t = x\n        while t > 1 {\n            let p = spf[t]\n            var exp = 0\n            while t % p == 0 {\n                t /= p\n                exp += 1\n            }\n            var num = 1\n            for s in 0..<exp { num = num * ((n + s) % mod) % mod }\n            ways = ways * (num * invFact[exp] % mod) % mod\n        }\n        total = (total + ways) % mod\n    }\n    return total\n}`,
        rust: `fn idealArrays(n: i32, maxValue: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    const MAXE: usize = 14;\n    let mut fact = [1i64; MAXE + 1];\n    for i in 1..=MAXE {\n        fact[i] = fact[i - 1] * i as i64 % MOD;\n    }\n    let mut inv_fact = [1i64; MAXE + 1];\n    let mut base = fact[MAXE];\n    let mut e = MOD - 2;\n    let mut cur: i64 = 1;\n    while e > 0 {\n        if e & 1 == 1 {\n            cur = cur * base % MOD;\n        }\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    inv_fact[MAXE] = cur;\n    for i in (1..=MAXE).rev() {\n        inv_fact[i - 1] = inv_fact[i] * i as i64 % MOD;\n    }\n    let mv = maxValue as usize;\n    let mut spf = vec![0usize; mv + 1];\n    for p in 2..=mv {\n        if spf[p] != 0 {\n            continue;\n        }\n        let mut q = p;\n        while q <= mv {\n            if spf[q] == 0 {\n                spf[q] = p;\n            }\n            q += p;\n        }\n    }\n    let mut total: i64 = 0;\n    for x in 1..=mv {\n        let mut ways: i64 = 1;\n        let mut t = x;\n        while t > 1 {\n            let p = spf[t];\n            let mut exp = 0usize;\n            while t % p == 0 {\n                t /= p;\n                exp += 1;\n            }\n            let mut num: i64 = 1;\n            for s in 0..exp {\n                num = num * ((n as i64 + s as i64) % MOD) % MOD;\n            }\n            ways = ways * (num * inv_fact[exp] % MOD) % MOD;\n        }\n        total = (total + ways) % MOD;\n    }\n    total as i32\n}`,
        php: `function idealArrays($n, $maxValue) {\n    $MOD = 1000000007;\n    $MAXE = 14;\n    $fact = array_fill(0, $MAXE + 1, 1);\n    for ($i = 1; $i <= $MAXE; $i++) $fact[$i] = $fact[$i - 1] * $i % $MOD;\n    $invFact = array_fill(0, $MAXE + 1, 1);\n    $base = $fact[$MAXE];\n    $e = $MOD - 2;\n    $cur = 1;\n    while ($e > 0) {\n        if ($e % 2 === 1) $cur = $cur * $base % $MOD;\n        $base = $base * $base % $MOD;\n        $e = intdiv($e, 2);\n    }\n    $invFact[$MAXE] = $cur;\n    for ($i = $MAXE; $i >= 1; $i--) $invFact[$i - 1] = $invFact[$i] * $i % $MOD;\n    $spf = array_fill(0, $maxValue + 1, 0);\n    for ($p = 2; $p <= $maxValue; $p++) {\n        if ($spf[$p] !== 0) continue;\n        for ($q = $p; $q <= $maxValue; $q += $p) {\n            if ($spf[$q] === 0) $spf[$q] = $p;\n        }\n    }\n    $total = 0;\n    for ($x = 1; $x <= $maxValue; $x++) {\n        $ways = 1;\n        $t = $x;\n        while ($t > 1) {\n            $p = $spf[$t];\n            $exp = 0;\n            while ($t % $p === 0) {\n                $t = intdiv($t, $p);\n                $exp++;\n            }\n            $num = 1;\n            for ($s = 0; $s < $exp; $s++) $num = $num * (($n + $s) % $MOD) % $MOD;\n            $ways = $ways * ($num * $invFact[$exp] % $MOD) % $MOD;\n        }\n        $total = ($total + $ways) % $MOD;\n    }\n    return $total;\n}`,
        ruby: `def idealArrays(n, maxValue)\n  mod = 1000000007\n  max_e = 14\n  fact = Array.new(max_e + 1, 1)\n  (1..max_e).each { |i| fact[i] = fact[i - 1] * i % mod }\n  inv_fact = Array.new(max_e + 1, 1)\n  inv_fact[max_e] = fact[max_e].pow(mod - 2, mod)\n  max_e.downto(1) { |i| inv_fact[i - 1] = inv_fact[i] * i % mod }\n  spf = Array.new(maxValue + 1, 0)\n  (2..maxValue).each do |p|\n    next if spf[p] != 0\n    q = p\n    while q <= maxValue\n      spf[q] = p if spf[q] == 0\n      q += p\n    end\n  end\n  total = 0\n  (1..maxValue).each do |x|\n    ways = 1\n    t = x\n    while t > 1\n      p = spf[t]\n      exp = 0\n      while t % p == 0\n        t /= p\n        exp += 1\n      end\n      num = 1\n      (0...exp).each { |s| num = num * ((n + s) % mod) % mod }\n      ways = ways * (num * inv_fact[exp] % mod) % mod\n    end\n    total = (total + ways) % mod\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count Ways to Make Array With Product (LC 1735) ─────────────
  (() => {
    const powMod = (base: number, exp: number) => {
      let result = 1, b = base % MODX, e = exp;
      while (e > 0) {
        if (e % 2 === 1) result = mulModX(result, b);
        b = mulModX(b, b);
        e = Math.floor(e / 2);
      }
      return result;
    };
    const MAXE = 14;
    const invFact = (() => {
      const fact = new Array(MAXE + 1).fill(1);
      for (let i = 1; i <= MAXE; i++) fact[i] = mulModX(fact[i - 1], i);
      const inv = new Array(MAXE + 1).fill(1);
      inv[MAXE] = powMod(fact[MAXE], MODX - 2);
      for (let i = MAXE; i >= 1; i--) inv[i - 1] = mulModX(inv[i], i);
      return inv;
    })();
    const ref = (queries: number[][]) => {
      return queries.map((q) => {
        const n = q[0];
        let k = q[1], answer = 1;
        for (let p = 2; p * p <= k; p++) {
          if (k % p !== 0) continue;
          let e = 0;
          while (k % p === 0) { k = k / p; e++; }
          let num = 1;
          for (let t = 0; t < e; t++) num = mulModX(num, (n + t) % MODX);
          answer = mulModX(answer, mulModX(num, invFact[e]));
        }
        if (k > 1) answer = mulModX(answer, n % MODX);
        return answer;
      });
    };
    return {
      slug: "count-ways-to-make-array-with-product",
      title: "Count Ways to Make Array With Product",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Combinatorics", "Number Theory", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "waysToFillArray", params: [{ name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Each query `queries[i] = [n, k]` asks: how many arrays of `n` **positive** integers have a product of exactly `k`?\n\nReturn the answers in order, each **modulo 10⁹ + 7**.",
        [
          { in: "queries = [[2,6],[5,1],[73,660]]", out: "[4,1,50734910]", note: "For `[2,6]`: `[1,6]`, `[2,3]`, `[3,2]`, `[6,1]`." },
          { in: "queries = [[1,1],[2,2],[3,3],[4,4],[5,5]]", out: "[1,2,3,10,5]" },
          { in: "queries = [[3,8]]", out: "[10]", note: "8 = 2³, and three factors of 2 spread over three slots is `C(5,3)`." },
        ],
        ["1 <= queries.length <= 10^4", "1 <= n_i, k_i <= 10^4"]),
      hints: [
        "Factorise `k`. Each prime's exponent is distributed across the `n` slots independently.",
        "Spreading `e` identical factors over `n` ordered slots is stars and bars: `C(n - 1 + e, e)`.",
        "Multiply those binomials across the primes of `k`.",
      ],
      editorial: explain({
        idea: "An array with product `k` is determined by how each prime's exponent is split across the `n` positions. For a prime with exponent `e` that is a stars-and-bars count, `C(n - 1 + e, e)`, and the primes are independent so the counts multiply.",
        steps: [
          "Precompute inverse factorials for exponents up to 13 — no exponent exceeds that below 10⁴.",
          "For each query, trial-divide `k` up to its square root, collecting each prime's exponent.",
          "For each exponent `e`, multiply in `C(n - 1 + e, e)`, computed as `n · (n+1) · … · (n+e-1) · invFact[e]`.",
          "If a prime factor above the square root remains, it has exponent 1 and contributes a factor of `n`.",
        ],
        why: "Independence across primes is what turns a product constraint into a product of counts: choosing where the 2s go never restricts where the 3s go. Computing the binomial from the falling product rather than a full factorial table is what keeps it cheap — the exponent is at most 13, so each binomial is a dozen multiplications and one small inverse.",
        time: "O(q · √k)",
        space: "O(1) beyond the answers",
        pitfalls: [
          "`k = 1` has no primes, so the answer is 1 — the all-ones array.",
          "A leftover factor above √k is prime with exponent 1, contributing `C(n, 1) = n`.",
          "The binomial's top is `n - 1 + e`; using `n + e` counts an extra slot that does not exist.",
        ],
      }),
      examples: [
        { input: "[[2,6],[5,1],[73,660]]", expectedOutput: "[4,1,50734910]" },
        { input: "[[1,1],[2,2],[3,3],[4,4],[5,5]]", expectedOutput: "[1,2,3,10,5]" },
        { input: "[[3,8]]", expectedOutput: "[10]" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 5);
        const queries = Array.from({ length: count }, () => [ri(rng, 1, 40), ri(rng, 1, 400)]);
        return { input: fmtIntMat(queries), expectedOutput: fmtIntArr(ref(queries)) };
      },
      solutions: {
        python: `from typing import List\n\ndef waysToFillArray(queries: List[List[int]]) -> List[int]:\n    MOD = 10**9 + 7\n    MAXE = 14\n    fact = [1] * (MAXE + 1)\n    for i in range(1, MAXE + 1):\n        fact[i] = fact[i - 1] * i % MOD\n    inv_fact = [1] * (MAXE + 1)\n    inv_fact[MAXE] = pow(fact[MAXE], MOD - 2, MOD)\n    for i in range(MAXE, 0, -1):\n        inv_fact[i - 1] = inv_fact[i] * i % MOD\n    out = []\n    for n, k in queries:\n        answer = 1\n        p = 2\n        while p * p <= k:\n            if k % p == 0:\n                e = 0\n                while k % p == 0:\n                    k //= p\n                    e += 1\n                num = 1\n                for t in range(e):\n                    num = num * ((n + t) % MOD) % MOD\n                answer = answer * (num * inv_fact[e] % MOD) % MOD\n            p += 1\n        if k > 1:\n            answer = answer * (n % MOD) % MOD\n        out.append(answer)\n    return out`,
        javascript: `var waysToFillArray = function(queries) {\n    var MOD = 1000000007, i;\n    var mulmod = function(a, b) {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var powmod = function(base, exp) {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var MAXE = 14;\n    var fact = [1];\n    for (i = 1; i <= MAXE; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact = [];\n    for (i = 0; i <= MAXE; i++) invFact.push(1);\n    invFact[MAXE] = powmod(fact[MAXE], MOD - 2);\n    for (i = MAXE; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var out = [];\n    for (var q = 0; q < queries.length; q++) {\n        var n = queries[q][0], k = queries[q][1], answer = 1;\n        for (var p = 2; p * p <= k; p++) {\n            if (k % p !== 0) continue;\n            var e = 0;\n            while (k % p === 0) { k = k / p; e++; }\n            var num = 1;\n            for (var t = 0; t < e; t++) num = mulmod(num, (n + t) % MOD);\n            answer = mulmod(answer, mulmod(num, invFact[e]));\n        }\n        if (k > 1) answer = mulmod(answer, n % MOD);\n        out.push(answer);\n    }\n    return out;\n};`,
        typescript: `function waysToFillArray(queries: number[][]): number[] {\n    var MOD = 1000000007, i: number;\n    var mulmod = function(a: number, b: number): number {\n        var hi = Math.floor(a / 65536), lo = a % 65536;\n        return ((hi * b % MOD) * 65536 + lo * b) % MOD;\n    };\n    var powmod = function(base: number, exp: number): number {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var MAXE = 14;\n    var fact: number[] = [1];\n    for (i = 1; i <= MAXE; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact: number[] = [];\n    for (i = 0; i <= MAXE; i++) invFact.push(1);\n    invFact[MAXE] = powmod(fact[MAXE], MOD - 2);\n    for (i = MAXE; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var out: number[] = [];\n    for (var q = 0; q < queries.length; q++) {\n        var n = queries[q][0], k = queries[q][1], answer = 1;\n        for (var p = 2; p * p <= k; p++) {\n            if (k % p !== 0) continue;\n            var e = 0;\n            while (k % p === 0) { k = k / p; e++; }\n            var num = 1;\n            for (var t = 0; t < e; t++) num = mulmod(num, (n + t) % MOD);\n            answer = mulmod(answer, mulmod(num, invFact[e]));\n        }\n        if (k > 1) answer = mulmod(answer, n % MOD);\n        out.push(answer);\n    }\n    return out;\n}`,
        java: `public static int[] waysToFillArray(int[][] queries) {\n    final long MOD = 1000000007L;\n    final int MAXE = 14;\n    long[] fact = new long[MAXE + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long[] invFact = new long[MAXE + 1];\n    long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if ((e & 1L) == 1L) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    int[] out = new int[queries.length];\n    for (int q = 0; q < queries.length; q++) {\n        int n = queries[q][0], k = queries[q][1];\n        long answer = 1;\n        for (int p = 2; (long) p * p <= k; p++) {\n            if (k % p != 0) continue;\n            int exp = 0;\n            while (k % p == 0) {\n                k /= p;\n                exp++;\n            }\n            long num = 1;\n            for (int t = 0; t < exp; t++) num = num * ((n + t) % MOD) % MOD;\n            answer = answer * (num * invFact[exp] % MOD) % MOD;\n        }\n        if (k > 1) answer = answer * (n % MOD) % MOD;\n        out[q] = (int) answer;\n    }\n    return out;\n}`,
        cpp: `vector<int> waysToFillArray(vector<vector<int>>& queries) {\n    const long long MOD = 1000000007LL;\n    const int MAXE = 14;\n    vector<long long> fact(MAXE + 1, 1), invFact(MAXE + 1, 1);\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    vector<int> out;\n    for (auto& q : queries) {\n        int n = q[0], k = q[1];\n        long long answer = 1;\n        for (int p = 2; (long long) p * p <= k; p++) {\n            if (k % p != 0) continue;\n            int exp = 0;\n            while (k % p == 0) {\n                k /= p;\n                exp++;\n            }\n            long long num = 1;\n            for (int t = 0; t < exp; t++) num = num * ((n + t) % MOD) % MOD;\n            answer = answer * (num * invFact[exp] % MOD) % MOD;\n        }\n        if (k > 1) answer = answer * (n % MOD) % MOD;\n        out.push_back((int) answer);\n    }\n    return out;\n}`,
        c: `int* waysToFillArray(int** queries, int queriesSize, int* queriesColSize, int* returnSize) {\n    (void) queriesColSize;\n    const long long MOD = 1000000007LL;\n    const int MAXE = 14;\n    long long fact[15], invFact[15];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    int* out = (int*) malloc((size_t) queriesSize * sizeof(int));\n    for (int q = 0; q < queriesSize; q++) {\n        int n = queries[q][0], k = queries[q][1];\n        long long answer = 1;\n        for (int p = 2; (long long) p * p <= k; p++) {\n            if (k % p != 0) continue;\n            int exp = 0;\n            while (k % p == 0) {\n                k /= p;\n                exp++;\n            }\n            long long num = 1;\n            for (int t = 0; t < exp; t++) num = num * ((n + t) % MOD) % MOD;\n            answer = answer * (num * invFact[exp] % MOD) % MOD;\n        }\n        if (k > 1) answer = answer * (n % MOD) % MOD;\n        out[q] = (int) answer;\n    }\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] WaysToFillArray(int[][] queries)\n{\n    const long MOD = 1000000007L;\n    const int MAXE = 14;\n    var fact = new long[MAXE + 1];\n    var invFact = new long[MAXE + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= MAXE; i++) fact[i] = fact[i - 1] * i % MOD;\n    long bse = fact[MAXE], e = MOD - 2, cur = 1;\n    while (e > 0)\n    {\n        if ((e & 1L) == 1L) cur = cur * bse % MOD;\n        bse = bse * bse % MOD;\n        e >>= 1;\n    }\n    invFact[MAXE] = cur;\n    for (int i = MAXE; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    var outArr = new int[queries.Length];\n    for (int q = 0; q < queries.Length; q++)\n    {\n        int n = queries[q][0], k = queries[q][1];\n        long answer = 1;\n        for (int p = 2; (long) p * p <= k; p++)\n        {\n            if (k % p != 0) continue;\n            int exp = 0;\n            while (k % p == 0)\n            {\n                k /= p;\n                exp++;\n            }\n            long num = 1;\n            for (int t = 0; t < exp; t++) num = num * ((n + t) % MOD) % MOD;\n            answer = answer * (num * invFact[exp] % MOD) % MOD;\n        }\n        if (k > 1) answer = answer * (n % MOD) % MOD;\n        outArr[q] = (int) answer;\n    }\n    return outArr;\n}`,
        go: `func waysToFillArray(queries [][]int) []int {\n\tconst MOD = 1000000007\n\tconst MAXE = 14\n\tfact := make([]int, MAXE+1)\n\tinvFact := make([]int, MAXE+1)\n\tfact[0] = 1\n\tfor i := 1; i <= MAXE; i++ {\n\t\tfact[i] = fact[i-1] * i % MOD\n\t}\n\tbase, e, cur := fact[MAXE], MOD-2, 1\n\tfor e > 0 {\n\t\tif e&1 == 1 {\n\t\t\tcur = cur * base % MOD\n\t\t}\n\t\tbase = base * base % MOD\n\t\te >>= 1\n\t}\n\tinvFact[MAXE] = cur\n\tfor i := MAXE; i >= 1; i-- {\n\t\tinvFact[i-1] = invFact[i] * i % MOD\n\t}\n\tout := make([]int, len(queries))\n\tfor q, query := range queries {\n\t\tn, k := query[0], query[1]\n\t\tanswer := 1\n\t\tfor p := 2; p*p <= k; p++ {\n\t\t\tif k%p != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\texp := 0\n\t\t\tfor k%p == 0 {\n\t\t\t\tk /= p\n\t\t\t\texp++\n\t\t\t}\n\t\t\tnum := 1\n\t\t\tfor t := 0; t < exp; t++ {\n\t\t\t\tnum = num * ((n + t) % MOD) % MOD\n\t\t\t}\n\t\t\tanswer = answer * (num * invFact[exp] % MOD) % MOD\n\t\t}\n\t\tif k > 1 {\n\t\t\tanswer = answer * (n % MOD) % MOD\n\t\t}\n\t\tout[q] = answer\n\t}\n\treturn out\n}`,
        kotlin: `fun waysToFillArray(queries: Array<IntArray>): IntArray {\n    val mod = 1000000007L\n    val maxE = 14\n    val fact = LongArray(maxE + 1)\n    val invFact = LongArray(maxE + 1)\n    fact[0] = 1\n    for (i in 1..maxE) fact[i] = fact[i - 1] * i % mod\n    var base = fact[maxE]\n    var e = mod - 2\n    var cur = 1L\n    while (e > 0) {\n        if (e and 1L == 1L) cur = cur * base % mod\n        base = base * base % mod\n        e = e shr 1\n    }\n    invFact[maxE] = cur\n    for (i in maxE downTo 1) invFact[i - 1] = invFact[i] * i % mod\n    return IntArray(queries.size) { q ->\n        val n = queries[q][0]\n        var k = queries[q][1]\n        var answer = 1L\n        var p = 2\n        while (p * p <= k) {\n            if (k % p == 0) {\n                var exp = 0\n                while (k % p == 0) {\n                    k /= p\n                    exp++\n                }\n                var num = 1L\n                for (t in 0 until exp) num = num * ((n + t).toLong() % mod) % mod\n                answer = answer * (num * invFact[exp] % mod) % mod\n            }\n            p++\n        }\n        if (k > 1) answer = answer * (n.toLong() % mod) % mod\n        answer.toInt()\n    }\n}`,
        swift: `func waysToFillArray(_ queries: [[Int]]) -> [Int] {\n    let mod = 1000000007\n    let maxE = 14\n    var fact = [Int](repeating: 1, count: maxE + 1)\n    for i in 1...maxE { fact[i] = fact[i - 1] * i % mod }\n    var invFact = [Int](repeating: 1, count: maxE + 1)\n    var base = fact[maxE]\n    var e = mod - 2\n    var cur = 1\n    while e > 0 {\n        if e & 1 == 1 { cur = cur * base % mod }\n        base = base * base % mod\n        e >>= 1\n    }\n    invFact[maxE] = cur\n    var i = maxE\n    while i >= 1 {\n        invFact[i - 1] = invFact[i] * i % mod\n        i -= 1\n    }\n    return queries.map { query in\n        let n = query[0]\n        var k = query[1]\n        var answer = 1\n        var p = 2\n        while p * p <= k {\n            if k % p == 0 {\n                var exp = 0\n                while k % p == 0 {\n                    k /= p\n                    exp += 1\n                }\n                var num = 1\n                for t in 0..<exp { num = num * ((n + t) % mod) % mod }\n                answer = answer * (num * invFact[exp] % mod) % mod\n            }\n            p += 1\n        }\n        if k > 1 { answer = answer * (n % mod) % mod }\n        return answer\n    }\n}`,
        rust: `fn waysToFillArray(queries: Vec<Vec<i32>>) -> Vec<i32> {\n    const MOD: i64 = 1000000007;\n    const MAXE: usize = 14;\n    let mut fact = [1i64; MAXE + 1];\n    for i in 1..=MAXE {\n        fact[i] = fact[i - 1] * i as i64 % MOD;\n    }\n    let mut inv_fact = [1i64; MAXE + 1];\n    let mut base = fact[MAXE];\n    let mut e = MOD - 2;\n    let mut cur: i64 = 1;\n    while e > 0 {\n        if e & 1 == 1 {\n            cur = cur * base % MOD;\n        }\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    inv_fact[MAXE] = cur;\n    for i in (1..=MAXE).rev() {\n        inv_fact[i - 1] = inv_fact[i] * i as i64 % MOD;\n    }\n    queries\n        .iter()\n        .map(|q| {\n            let n = q[0] as i64;\n            let mut k = q[1];\n            let mut answer: i64 = 1;\n            let mut p = 2i32;\n            while p * p <= k {\n                if k % p == 0 {\n                    let mut exp = 0usize;\n                    while k % p == 0 {\n                        k /= p;\n                        exp += 1;\n                    }\n                    let mut num: i64 = 1;\n                    for t in 0..exp {\n                        num = num * ((n + t as i64) % MOD) % MOD;\n                    }\n                    answer = answer * (num * inv_fact[exp] % MOD) % MOD;\n                }\n                p += 1;\n            }\n            if k > 1 {\n                answer = answer * (n % MOD) % MOD;\n            }\n            answer as i32\n        })\n        .collect()\n}`,
        php: `function waysToFillArray($queries) {\n    $MOD = 1000000007;\n    $MAXE = 14;\n    $fact = array_fill(0, $MAXE + 1, 1);\n    for ($i = 1; $i <= $MAXE; $i++) $fact[$i] = $fact[$i - 1] * $i % $MOD;\n    $invFact = array_fill(0, $MAXE + 1, 1);\n    $base = $fact[$MAXE];\n    $e = $MOD - 2;\n    $cur = 1;\n    while ($e > 0) {\n        if ($e % 2 === 1) $cur = $cur * $base % $MOD;\n        $base = $base * $base % $MOD;\n        $e = intdiv($e, 2);\n    }\n    $invFact[$MAXE] = $cur;\n    for ($i = $MAXE; $i >= 1; $i--) $invFact[$i - 1] = $invFact[$i] * $i % $MOD;\n    $out = [];\n    foreach ($queries as $query) {\n        $n = $query[0];\n        $k = $query[1];\n        $answer = 1;\n        for ($p = 2; $p * $p <= $k; $p++) {\n            if ($k % $p !== 0) continue;\n            $exp = 0;\n            while ($k % $p === 0) {\n                $k = intdiv($k, $p);\n                $exp++;\n            }\n            $num = 1;\n            for ($t = 0; $t < $exp; $t++) $num = $num * (($n + $t) % $MOD) % $MOD;\n            $answer = $answer * ($num * $invFact[$exp] % $MOD) % $MOD;\n        }\n        if ($k > 1) $answer = $answer * ($n % $MOD) % $MOD;\n        $out[] = $answer;\n    }\n    return $out;\n}`,
        ruby: `def waysToFillArray(queries)\n  mod = 1000000007\n  max_e = 14\n  fact = Array.new(max_e + 1, 1)\n  (1..max_e).each { |i| fact[i] = fact[i - 1] * i % mod }\n  inv_fact = Array.new(max_e + 1, 1)\n  inv_fact[max_e] = fact[max_e].pow(mod - 2, mod)\n  max_e.downto(1) { |i| inv_fact[i - 1] = inv_fact[i] * i % mod }\n  queries.map do |n, k|\n    answer = 1\n    p = 2\n    while p * p <= k\n      if k % p == 0\n        exp = 0\n        while k % p == 0\n          k /= p\n          exp += 1\n        end\n        num = 1\n        (0...exp).each { |t| num = num * ((n + t) % mod) % mod }\n        answer = answer * (num * inv_fact[exp] % mod) % mod\n      end\n      p += 1\n    end\n    answer = answer * (n % mod) % mod if k > 1\n    answer\n  end\nend`,
      },
    };
  })(),
];
