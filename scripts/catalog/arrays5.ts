/**
 * Array problems — wave 5.
 * Real problems only: LeetCode numbered classics, drawn mostly from the 2600+
 * range that the earlier waves did not reach. Worked examples are phrased for
 * CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, so square roots and
 * powers are written as integer loops.
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

export const ARRAYS5_PROBLEMS: CatalogProblem[] = [

  // ── Split the Array (LC 3046) ───────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const c = (count.get(nums[i]) || 0) + 1;
        if (c > 2) return false;
        count.set(nums[i], c);
      }
      return true;
    };
    return {
      slug: "split-the-array",
      title: "Split the Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Google", "TCS"],
      signature: { funcName: "isPossibleToSplit", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "`nums` has an **even** length. Split it into two arrays `nums1` and `nums2` of equal length so that **each** of them holds only distinct values.\n\nReturn `true` if such a split exists.",
        [
          { in: "nums = [1,1,2,2,3,4]", out: "true", note: "`[1,2,3]` and `[1,2,4]`." },
          { in: "nums = [1,1,1,1]", out: "false", note: "The value 1 appears four times, so one half must repeat it." },
          { in: "nums = [5,5]", out: "true" },
        ],
        ["1 <= nums.length <= 100", "nums.length % 2 == 0", "1 <= nums[i] <= 100"]),
      hints: [
        "Each half may hold a given value at most once.",
        "So across both halves a value may appear at most twice.",
        "Count the occurrences and check none exceeds 2.",
      ],
      editorial: explain({
        idea: "A split exists exactly when no value occurs more than twice, because the two halves can hold at most one copy each.",
        steps: [
          "Count how often each value appears.",
          "Return `false` the moment a count reaches 3.",
          "Otherwise return `true`.",
        ],
        why: "The condition is not just necessary but sufficient: with every count at most 2, send one copy of each value to each half and the halves come out the same size, because the array's length is even and the leftovers pair up. So no construction is needed — counting decides it.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The limit is 2 across the whole array, not 2 per half.",
          "The length is guaranteed even, so the sizes never need checking.",
          "Sorting works too but is slower than counting.",
        ],
      }),
      examples: [
        { input: "[1,1,2,2,3,4]", expectedOutput: "true" },
        { input: "[1,1,1,1]", expectedOutput: "false" },
        { input: "[5,5]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const half = ri(rng, 1, 7);
        const span = pick(rng, [3, 6, 20]);
        const nums = Array.from({ length: half * 2 }, () => ri(rng, 1, span));
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef isPossibleToSplit(nums: List[int]) -> bool:\n    return all(c <= 2 for c in Counter(nums).values())`,
        javascript: `var isPossibleToSplit = function(nums) {\n    var count = new Map();\n    for (var i = 0; i < nums.length; i++) {\n        var cur = count.get(nums[i]);\n        var c = (cur === undefined ? 0 : cur) + 1;\n        if (c > 2) return false;\n        count.set(nums[i], c);\n    }\n    return true;\n};`,
        typescript: `function isPossibleToSplit(nums: number[]): boolean {\n    var count: { [k: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = "" + nums[i];\n        var cur = count[key];\n        var c = (cur === undefined ? 0 : cur) + 1;\n        if (c > 2) return false;\n        count[key] = c;\n    }\n    return true;\n}`,
        java: `public static boolean isPossibleToSplit(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int v : nums) {\n        int c = count.merge(v, 1, Integer::sum);\n        if (c > 2) return false;\n    }\n    return true;\n}`,
        cpp: `bool isPossibleToSplit(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int v : nums) {\n        if (++count[v] > 2) return false;\n    }\n    return true;\n}`,
        c: `bool isPossibleToSplit(int* nums, int numsSize) {\n    int count[101] = { 0 };\n    for (int i = 0; i < numsSize; i++) {\n        if (++count[nums[i]] > 2) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool IsPossibleToSplit(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (var v in nums)\n    {\n        count.TryGetValue(v, out int cur);\n        if (cur + 1 > 2) return false;\n        count[v] = cur + 1;\n    }\n    return true;\n}`,
        go: `func isPossibleToSplit(nums []int) bool {\n\tcount := map[int]int{}\n\tfor _, v := range nums {\n\t\tcount[v]++\n\t\tif count[v] > 2 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun isPossibleToSplit(nums: IntArray): Boolean {\n    val count = HashMap<Int, Int>()\n    for (v in nums) {\n        val c = (count[v] ?: 0) + 1\n        if (c > 2) return false\n        count[v] = c\n    }\n    return true\n}`,
        swift: `func isPossibleToSplit(_ nums: [Int]) -> Bool {\n    var count = [Int: Int]()\n    for v in nums {\n        let c = (count[v] ?? 0) + 1\n        if c > 2 { return false }\n        count[v] = c\n    }\n    return true\n}`,
        rust: `use std::collections::HashMap;\n\nfn isPossibleToSplit(nums: Vec<i32>) -> bool {\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &v in nums.iter() {\n        let c = count.entry(v).or_insert(0);\n        *c += 1;\n        if *c > 2 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function isPossibleToSplit($nums) {\n    $count = [];\n    foreach ($nums as $v) {\n        $count[$v] = (isset($count[$v]) ? $count[$v] : 0) + 1;\n        if ($count[$v] > 2) return false;\n    }\n    return true;\n}`,
        ruby: `def isPossibleToSplit(nums)\n  count = Hash.new(0)\n  nums.each do |v|\n    count[v] += 1\n    return false if count[v] > 2\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Minimum Time Visiting All Points (LC 1266) ──────────────────
  (() => {
    const ref = (points: number[][]) => {
      let total = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i][0] - points[i - 1][0]);
        const dy = Math.abs(points[i][1] - points[i - 1][1]);
        total += dx > dy ? dx : dy;
      }
      return total;
    };
    return {
      slug: "minimum-time-visiting-all-points",
      title: "Minimum Time Visiting All Points",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Geometry", "Amazon", "Google", "Wipro"],
      signature: { funcName: "minTimeToVisitAllPoints", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "On a plane you may move one unit vertically, one unit horizontally, or one unit **diagonally** — each move takes one second.\n\nVisit the given points **in the order they appear** and return the minimum number of seconds.",
        [
          { in: "points = [[1,1],[3,4],[-1,0]]", out: "7", note: "Three seconds from `(1,1)` to `(3,4)`, then four more to `(-1,0)`." },
          { in: "points = [[3,2],[-2,2]]", out: "5", note: "A straight horizontal run of five." },
          { in: "points = [[0,0],[0,0]]", out: "0" },
        ],
        ["points.length == n", "1 <= n <= 100", "points[i].length == 2", "-1000 <= points[i][0], points[i][1] <= 1000"]),
      hints: [
        "A diagonal move changes both coordinates at once, so it costs the same as a single step.",
        "Travelling between two points, the diagonal moves cover the smaller of the two gaps.",
        "That leaves the difference of the gaps to cover straight — which totals the larger gap.",
      ],
      editorial: explain({
        idea: "Between consecutive points the time is the **Chebyshev distance**: `max(|dx|, |dy|)`. Sum it over the consecutive pairs.",
        steps: [
          "For each consecutive pair, take `dx = |x2 - x1|` and `dy = |y2 - y1|`.",
          "Add `max(dx, dy)` to the total.",
        ],
        why: "Move diagonally `min(dx, dy)` times to close the smaller gap, then straight for the remaining `|dx - dy|` steps — that is `max(dx, dy)` moves in total, and no faster route exists because each move changes either coordinate by at most 1. The points must be visited in order, so the pairs are independent and simply add.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Manhattan distance (`dx + dy`) overcounts; diagonals are free extras.",
          "The order is fixed — this is not a travelling-salesman question.",
          "Coordinates can be negative, so take absolute differences.",
        ],
      }),
      examples: [
        { input: "[[1,1],[3,4],[-1,0]]", expectedOutput: "7" },
        { input: "[[3,2],[-2,2]]", expectedOutput: "5" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const points = Array.from({ length: n }, () => [ri(rng, -20, 20), ri(rng, -20, 20)]);
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minTimeToVisitAllPoints(points: List[List[int]]) -> int:\n    total = 0\n    for i in range(1, len(points)):\n        dx = abs(points[i][0] - points[i - 1][0])\n        dy = abs(points[i][1] - points[i - 1][1])\n        total += max(dx, dy)\n    return total`,
        javascript: `var minTimeToVisitAllPoints = function(points) {\n    var total = 0;\n    for (var i = 1; i < points.length; i++) {\n        var dx = Math.abs(points[i][0] - points[i - 1][0]);\n        var dy = Math.abs(points[i][1] - points[i - 1][1]);\n        total += dx > dy ? dx : dy;\n    }\n    return total;\n};`,
        typescript: `function minTimeToVisitAllPoints(points: number[][]): number {\n    var total = 0;\n    for (var i = 1; i < points.length; i++) {\n        var dx = Math.abs(points[i][0] - points[i - 1][0]);\n        var dy = Math.abs(points[i][1] - points[i - 1][1]);\n        total += dx > dy ? dx : dy;\n    }\n    return total;\n}`,
        java: `public static int minTimeToVisitAllPoints(int[][] points) {\n    int total = 0;\n    for (int i = 1; i < points.length; i++) {\n        int dx = Math.abs(points[i][0] - points[i - 1][0]);\n        int dy = Math.abs(points[i][1] - points[i - 1][1]);\n        total += Math.max(dx, dy);\n    }\n    return total;\n}`,
        cpp: `int minTimeToVisitAllPoints(vector<vector<int>>& points) {\n    int total = 0;\n    for (size_t i = 1; i < points.size(); i++) {\n        int dx = abs(points[i][0] - points[i - 1][0]);\n        int dy = abs(points[i][1] - points[i - 1][1]);\n        total += max(dx, dy);\n    }\n    return total;\n}`,
        c: `int minTimeToVisitAllPoints(int** points, int pointsSize, int* pointsColSize) {\n    (void) pointsColSize;\n    int total = 0;\n    for (int i = 1; i < pointsSize; i++) {\n        int dx = points[i][0] - points[i - 1][0];\n        int dy = points[i][1] - points[i - 1][1];\n        if (dx < 0) dx = -dx;\n        if (dy < 0) dy = -dy;\n        total += dx > dy ? dx : dy;\n    }\n    return total;\n}`,
        csharp: `public static int MinTimeToVisitAllPoints(int[][] points)\n{\n    int total = 0;\n    for (int i = 1; i < points.Length; i++)\n    {\n        int dx = Math.Abs(points[i][0] - points[i - 1][0]);\n        int dy = Math.Abs(points[i][1] - points[i - 1][1]);\n        total += Math.Max(dx, dy);\n    }\n    return total;\n}`,
        go: `func minTimeToVisitAllPoints(points [][]int) int {\n\ttotal := 0\n\tfor i := 1; i < len(points); i++ {\n\t\tdx := points[i][0] - points[i-1][0]\n\t\tdy := points[i][1] - points[i-1][1]\n\t\tif dx < 0 {\n\t\t\tdx = -dx\n\t\t}\n\t\tif dy < 0 {\n\t\t\tdy = -dy\n\t\t}\n\t\tif dx > dy {\n\t\t\ttotal += dx\n\t\t} else {\n\t\t\ttotal += dy\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun minTimeToVisitAllPoints(points: Array<IntArray>): Int {\n    var total = 0\n    for (i in 1 until points.size) {\n        val dx = Math.abs(points[i][0] - points[i - 1][0])\n        val dy = Math.abs(points[i][1] - points[i - 1][1])\n        total += maxOf(dx, dy)\n    }\n    return total\n}`,
        swift: `func minTimeToVisitAllPoints(_ points: [[Int]]) -> Int {\n    var total = 0\n    for i in 1..<max(1, points.count) where i < points.count {\n        let dx = abs(points[i][0] - points[i - 1][0])\n        let dy = abs(points[i][1] - points[i - 1][1])\n        total += max(dx, dy)\n    }\n    return total\n}`,
        rust: `fn minTimeToVisitAllPoints(points: Vec<Vec<i32>>) -> i32 {\n    let mut total = 0i32;\n    for i in 1..points.len() {\n        let dx = (points[i][0] - points[i - 1][0]).abs();\n        let dy = (points[i][1] - points[i - 1][1]).abs();\n        total += std::cmp::max(dx, dy);\n    }\n    total\n}`,
        php: `function minTimeToVisitAllPoints($points) {\n    $total = 0;\n    for ($i = 1; $i < count($points); $i++) {\n        $dx = abs($points[$i][0] - $points[$i - 1][0]);\n        $dy = abs($points[$i][1] - $points[$i - 1][1]);\n        $total += max($dx, $dy);\n    }\n    return $total;\n}`,
        ruby: `def minTimeToVisitAllPoints(points)\n  total = 0\n  (1...points.length).each do |i|\n    dx = (points[i][0] - points[i - 1][0]).abs\n    dy = (points[i][1] - points[i - 1][1]).abs\n    total += [dx, dy].max\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Find the Child Who Has the Ball After K Seconds (LC 3178) ───
  (() => {
    const ref = (n: number, k: number) => {
      const cycle = 2 * (n - 1);
      const at = k % cycle;
      return at < n ? at : cycle - at;
    };
    return {
      slug: "find-the-child-who-has-the-ball-after-k-seconds",
      title: "Find the Child Who Has the Ball After K Seconds",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "numberOfChild", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`n` children stand in a queue numbered `0 … n - 1`. Child `0` starts with a ball, and every second it passes to the next child in the current direction. When it reaches either end the direction **reverses**.\n\nReturn the number of the child holding the ball after exactly `k` seconds.",
        [
          { in: "n = 3, k = 5", out: "1", note: "0 → 1 → 2 → 1 → 0 → 1." },
          { in: "n = 5, k = 6", out: "2", note: "The ball reaches child 4 at second 4 and turns back." },
          { in: "n = 4, k = 2", out: "2" },
        ],
        ["2 <= n <= 50", "1 <= k <= 50"]),
      hints: [
        "The ball's path repeats: down the queue and back again.",
        "One full cycle takes `2 · (n - 1)` seconds.",
        "Reduce `k` modulo that cycle, then fold the position back if it has passed the end.",
      ],
      editorial: explain({
        idea: "The motion is a bounce with period `2 · (n - 1)`. Reduce `k` modulo the period; a position below `n` is the answer directly, and anything beyond is mirrored back.",
        steps: [
          "Let `cycle = 2 · (n - 1)` and `at = k mod cycle`.",
          "If `at < n`, the ball is on the outward leg and the answer is `at`.",
          "Otherwise it is on the return leg, at `cycle - at`.",
        ],
        why: "The outward leg takes `n - 1` seconds and the return leg the same, so the position is a triangle wave — which is exactly what the modulus plus the fold reproduces. Simulating second by second gives the same answer and is fine at `k <= 50`, but the closed form holds for any `k`.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "The cycle is `2 · (n - 1)`, not `2n` — the endpoints are not visited twice in a row.",
          "At `at == n - 1` the ball is exactly at the far end, which the first branch already covers.",
          "`n >= 2`, so the cycle is never zero.",
        ],
      }),
      examples: [
        { input: "3\n5", expectedOutput: "1" },
        { input: "5\n6", expectedOutput: "2" },
        { input: "4\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 50);
        const k = ri(rng, 1, 50);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def numberOfChild(n: int, k: int) -> int:\n    cycle = 2 * (n - 1)\n    at = k % cycle\n    return at if at < n else cycle - at`,
        javascript: `var numberOfChild = function(n, k) {\n    var cycle = 2 * (n - 1);\n    var at = k % cycle;\n    return at < n ? at : cycle - at;\n};`,
        typescript: `function numberOfChild(n: number, k: number): number {\n    var cycle = 2 * (n - 1);\n    var at = k % cycle;\n    return at < n ? at : cycle - at;\n}`,
        java: `public static int numberOfChild(int n, int k) {\n    int cycle = 2 * (n - 1);\n    int at = k % cycle;\n    return at < n ? at : cycle - at;\n}`,
        cpp: `int numberOfChild(int n, int k) {\n    int cycle = 2 * (n - 1);\n    int at = k % cycle;\n    return at < n ? at : cycle - at;\n}`,
        c: `int numberOfChild(int n, int k) {\n    int cycle = 2 * (n - 1);\n    int at = k % cycle;\n    return at < n ? at : cycle - at;\n}`,
        csharp: `public static int NumberOfChild(int n, int k)\n{\n    int cycle = 2 * (n - 1);\n    int at = k % cycle;\n    return at < n ? at : cycle - at;\n}`,
        go: `func numberOfChild(n int, k int) int {\n\tcycle := 2 * (n - 1)\n\tat := k % cycle\n\tif at < n {\n\t\treturn at\n\t}\n\treturn cycle - at\n}`,
        kotlin: `fun numberOfChild(n: Int, k: Int): Int {\n    val cycle = 2 * (n - 1)\n    val at = k % cycle\n    return if (at < n) at else cycle - at\n}`,
        swift: `func numberOfChild(_ n: Int, _ k: Int) -> Int {\n    let cycle = 2 * (n - 1)\n    let at = k % cycle\n    return at < n ? at : cycle - at\n}`,
        rust: `fn numberOfChild(n: i32, k: i32) -> i32 {\n    let cycle = 2 * (n - 1);\n    let at = k % cycle;\n    if at < n {\n        at\n    } else {\n        cycle - at\n    }\n}`,
        php: `function numberOfChild($n, $k) {\n    $cycle = 2 * ($n - 1);\n    $at = $k % $cycle;\n    return $at < $n ? $at : $cycle - $at;\n}`,
        ruby: `def numberOfChild(n, k)\n  cycle = 2 * (n - 1)\n  at = k % cycle\n  at < n ? at : cycle - at\nend`,
      },
    };
  })(),

  // ── Separate the Digits in an Array (LC 2553) ───────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        const digits: number[] = [];
        let v = nums[i];
        while (v > 0) {
          digits.push(v % 10);
          v = Math.floor(v / 10);
        }
        for (let j = digits.length - 1; j >= 0; j--) out.push(digits[j]);
      }
      return out;
    };
    return {
      slug: "separate-the-digits-in-an-array",
      title: "Separate the Digits in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Google", "Capgemini"],
      signature: { funcName: "separateDigits", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Replace each number in `nums` by its digits, keeping both the order of the numbers and the order of the digits inside each one.\n\nReturn the resulting array.",
        [
          { in: "nums = [13,25,83,77]", out: "[1,3,2,5,8,3,7,7]" },
          { in: "nums = [7,1,3,9]", out: "[7,1,3,9]", note: "Single-digit numbers are unchanged." },
          { in: "nums = [100,5]", out: "[1,0,0,5]" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Peeling digits with `% 10` gives them **backwards**.",
        "So collect them and reverse before appending.",
        "Alternatively divide by the largest power of ten that fits and work downwards.",
      ],
      editorial: explain({
        idea: "For each number, peel its digits with repeated `% 10` and `/ 10`, then append them in reverse so the original order is preserved.",
        steps: [
          "For each number, push `v % 10` and divide by 10 until it reaches 0.",
          "Append that buffer to the output back to front.",
        ],
        why: "The `% 10` loop is the natural way to read digits, but it delivers the least significant one first — hence the reversal. Every value is at least 1, so the loop always produces at least one digit and no number contributes nothing.",
        time: "O(n · digits)",
        space: "O(n · digits) for the output",
        pitfalls: [
          "Appending the peeled digits directly reverses each number.",
          "A value of 0 would produce no digits, but the constraints keep every value at least 1.",
          "Converting to strings works but does more allocation than the arithmetic.",
        ],
      }),
      examples: [
        { input: "[13,25,83,77]", expectedOutput: "[1,3,2,5,8,3,7,7]" },
        { input: "[7,1,3,9]", expectedOutput: "[7,1,3,9]" },
        { input: "[100,5]", expectedOutput: "[1,0,0,5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const nums = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [9, 99, 100000])));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef separateDigits(nums: List[int]) -> List[int]:\n    out = []\n    for v in nums:\n        digits = []\n        while v > 0:\n            digits.append(v % 10)\n            v //= 10\n        out.extend(reversed(digits))\n    return out`,
        javascript: `var separateDigits = function(nums) {\n    var out = [];\n    for (var i = 0; i < nums.length; i++) {\n        var digits = [];\n        var v = nums[i];\n        while (v > 0) {\n            digits.push(v % 10);\n            v = Math.floor(v / 10);\n        }\n        for (var j = digits.length - 1; j >= 0; j--) out.push(digits[j]);\n    }\n    return out;\n};`,
        typescript: `function separateDigits(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        var digits: number[] = [];\n        var v = nums[i];\n        while (v > 0) {\n            digits.push(v % 10);\n            v = Math.floor(v / 10);\n        }\n        for (var j = digits.length - 1; j >= 0; j--) out.push(digits[j]);\n    }\n    return out;\n}`,
        java: `public static int[] separateDigits(int[] nums) {\n    List<Integer> out = new ArrayList<>();\n    for (int num : nums) {\n        List<Integer> digits = new ArrayList<>();\n        int v = num;\n        while (v > 0) {\n            digits.add(v % 10);\n            v /= 10;\n        }\n        for (int j = digits.size() - 1; j >= 0; j--) out.add(digits.get(j));\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
        cpp: `vector<int> separateDigits(vector<int>& nums) {\n    vector<int> out;\n    for (int num : nums) {\n        vector<int> digits;\n        int v = num;\n        while (v > 0) {\n            digits.push_back(v % 10);\n            v /= 10;\n        }\n        for (int j = (int) digits.size() - 1; j >= 0; j--) out.push_back(digits[j]);\n    }\n    return out;\n}`,
        c: `int* separateDigits(int* nums, int numsSize, int* returnSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int v = nums[i];\n        while (v > 0) { total++; v /= 10; }\n    }\n    int* out = (int*) malloc((size_t) (total > 0 ? total : 1) * sizeof(int));\n    int digits[12];\n    int cnt = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int len = 0;\n        int v = nums[i];\n        while (v > 0) {\n            digits[len++] = v % 10;\n            v /= 10;\n        }\n        for (int j = len - 1; j >= 0; j--) out[cnt++] = digits[j];\n    }\n    *returnSize = cnt;\n    return out;\n}`,
        csharp: `public static int[] SeparateDigits(int[] nums)\n{\n    var out_ = new List<int>();\n    foreach (var num in nums)\n    {\n        var digits = new List<int>();\n        int v = num;\n        while (v > 0)\n        {\n            digits.Add(v % 10);\n            v /= 10;\n        }\n        for (int j = digits.Count - 1; j >= 0; j--) out_.Add(digits[j]);\n    }\n    return out_.ToArray();\n}`,
        go: `func separateDigits(nums []int) []int {\n\tout := []int{}\n\tfor _, num := range nums {\n\t\tdigits := []int{}\n\t\tv := num\n\t\tfor v > 0 {\n\t\t\tdigits = append(digits, v%10)\n\t\t\tv /= 10\n\t\t}\n\t\tfor j := len(digits) - 1; j >= 0; j-- {\n\t\t\tout = append(out, digits[j])\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun separateDigits(nums: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    for (num in nums) {\n        val digits = ArrayList<Int>()\n        var v = num\n        while (v > 0) {\n            digits.add(v % 10)\n            v /= 10\n        }\n        for (j in digits.indices.reversed()) out.add(digits[j])\n    }\n    return out.toIntArray()\n}`,
        swift: `func separateDigits(_ nums: [Int]) -> [Int] {\n    var out = [Int]()\n    for num in nums {\n        var digits = [Int]()\n        var v = num\n        while v > 0 {\n            digits.append(v % 10)\n            v /= 10\n        }\n        out.append(contentsOf: digits.reversed())\n    }\n    return out\n}`,
        rust: `fn separateDigits(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for &num in nums.iter() {\n        let mut digits: Vec<i32> = Vec::new();\n        let mut v = num;\n        while v > 0 {\n            digits.push(v % 10);\n            v /= 10;\n        }\n        digits.reverse();\n        out.extend(digits);\n    }\n    out\n}`,
        php: `function separateDigits($nums) {\n    $out = [];\n    foreach ($nums as $num) {\n        $digits = [];\n        $v = $num;\n        while ($v > 0) {\n            $digits[] = $v % 10;\n            $v = intdiv($v, 10);\n        }\n        for ($j = count($digits) - 1; $j >= 0; $j--) $out[] = $digits[$j];\n    }\n    return $out;\n}`,
        ruby: `def separateDigits(nums)\n  out = []\n  nums.each do |num|\n    digits = []\n    v = num\n    while v > 0\n      digits << v % 10\n      v /= 10\n    end\n    out.concat(digits.reverse)\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Kids With the Greatest Number of Candies (LC 1431) ──────────
  (() => {
    const ref = (candies: number[], extraCandies: number) => {
      let mx = 0;
      for (let i = 0; i < candies.length; i++) if (candies[i] > mx) mx = candies[i];
      return candies.map((c) => (c + extraCandies >= mx ? 1 : 0));
    };
    return {
      slug: "kids-with-the-greatest-number-of-candies",
      title: "Kids With the Greatest Number of Candies",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "Infosys"],
      signature: { funcName: "kidsWithCandies", params: [{ name: "candies", type: "int[]" as const }, { name: "extraCandies", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "`candies[i]` is how many sweets kid `i` has, and you hold `extraCandies` more.\n\nFor each kid, answer `1` if giving them **all** the extra sweets would leave them with the **greatest** number among all the kids — possibly tied — and `0` otherwise.",
        [
          { in: "candies = [2,3,5,1,3], extraCandies = 3", out: "[1,1,1,0,1]", note: "Only the kid with 1 sweet still falls short of 5." },
          { in: "candies = [4,2,1,1,2], extraCandies = 1", out: "[1,0,0,0,0]", note: "The extra sweet is not enough for anyone else to catch up to 4." },
          { in: "candies = [12,1,12], extraCandies = 10", out: "[1,0,1]" },
        ],
        ["n == candies.length", "2 <= n <= 100", "1 <= candies[i] <= 100", "1 <= extraCandies <= 50"]),
      hints: [
        "The comparison is against the current maximum, which never changes.",
        "Find that maximum once, before answering any kid.",
        "\"Greatest\" allows ties, so the test is `>=`.",
      ],
      editorial: explain({
        idea: "Take the maximum once, then each kid's answer is `candies[i] + extraCandies >= max`.",
        steps: [
          "Scan for the largest value.",
          "For each kid, compare their total with that maximum.",
        ],
        why: "The extra sweets are handed to one kid at a time in each hypothetical, so the other kids' counts — and therefore the maximum — never move. That is what lets the maximum be computed once up front rather than per kid, turning an `O(n²)` check into `O(n)`.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Recomputing the maximum per kid is needless work.",
          "The comparison is `>=`: tying with the greatest still counts.",
          "The extra sweets are not shared; each kid is considered as if given all of them.",
        ],
      }),
      examples: [
        { input: "[2,3,5,1,3]\n3", expectedOutput: "[1,1,1,0,1]" },
        { input: "[4,2,1,1,2]\n1", expectedOutput: "[1,0,0,0,0]" },
        { input: "[12,1,12]\n10", expectedOutput: "[1,0,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 12);
        const candies = Array.from({ length: n }, () => ri(rng, 1, 100));
        const extraCandies = ri(rng, 1, 50);
        return { input: `${fmtIntArr(candies)}\n${extraCandies}`, expectedOutput: fmtIntArr(ref(candies, extraCandies)) };
      },
      solutions: {
        python: `from typing import List\n\ndef kidsWithCandies(candies: List[int], extraCandies: int) -> List[int]:\n    mx = max(candies)\n    return [1 if c + extraCandies >= mx else 0 for c in candies]`,
        javascript: `var kidsWithCandies = function(candies, extraCandies) {\n    var mx = 0, i;\n    for (i = 0; i < candies.length; i++) if (candies[i] > mx) mx = candies[i];\n    var out = [];\n    for (i = 0; i < candies.length; i++) out.push(candies[i] + extraCandies >= mx ? 1 : 0);\n    return out;\n};`,
        typescript: `function kidsWithCandies(candies: number[], extraCandies: number): number[] {\n    var mx = 0, i: number;\n    for (i = 0; i < candies.length; i++) if (candies[i] > mx) mx = candies[i];\n    var out: number[] = [];\n    for (i = 0; i < candies.length; i++) out.push(candies[i] + extraCandies >= mx ? 1 : 0);\n    return out;\n}`,
        java: `public static int[] kidsWithCandies(int[] candies, int extraCandies) {\n    int mx = 0;\n    for (int c : candies) mx = Math.max(mx, c);\n    int[] out = new int[candies.length];\n    for (int i = 0; i < candies.length; i++) out[i] = candies[i] + extraCandies >= mx ? 1 : 0;\n    return out;\n}`,
        cpp: `vector<int> kidsWithCandies(vector<int>& candies, int extraCandies) {\n    int mx = 0;\n    for (int c : candies) mx = max(mx, c);\n    vector<int> out;\n    for (int c : candies) out.push_back(c + extraCandies >= mx ? 1 : 0);\n    return out;\n}`,
        c: `int* kidsWithCandies(int* candies, int candiesSize, int extraCandies, int* returnSize) {\n    int mx = 0;\n    for (int i = 0; i < candiesSize; i++) if (candies[i] > mx) mx = candies[i];\n    int* out = (int*) malloc((size_t) candiesSize * sizeof(int));\n    for (int i = 0; i < candiesSize; i++) out[i] = candies[i] + extraCandies >= mx ? 1 : 0;\n    *returnSize = candiesSize;\n    return out;\n}`,
        csharp: `public static int[] KidsWithCandies(int[] candies, int extraCandies)\n{\n    int mx = 0;\n    foreach (var c in candies) mx = Math.Max(mx, c);\n    var out_ = new int[candies.Length];\n    for (int i = 0; i < candies.Length; i++) out_[i] = candies[i] + extraCandies >= mx ? 1 : 0;\n    return out_;\n}`,
        go: `func kidsWithCandies(candies []int, extraCandies int) []int {\n\tmx := 0\n\tfor _, c := range candies {\n\t\tif c > mx {\n\t\t\tmx = c\n\t\t}\n\t}\n\tout := make([]int, len(candies))\n\tfor i, c := range candies {\n\t\tif c+extraCandies >= mx {\n\t\t\tout[i] = 1\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun kidsWithCandies(candies: IntArray, extraCandies: Int): IntArray {\n    var mx = candies[0]\n    for (v in candies) if (v > mx) mx = v\n    return IntArray(candies.size) { if (candies[it] + extraCandies >= mx) 1 else 0 }\n}`,
        swift: `func kidsWithCandies(_ candies: [Int], _ extraCandies: Int) -> [Int] {\n    let mx = candies.max()!\n    return candies.map { $0 + extraCandies >= mx ? 1 : 0 }\n}`,
        rust: `fn kidsWithCandies(candies: Vec<i32>, extraCandies: i32) -> Vec<i32> {\n    let mx = *candies.iter().max().unwrap();\n    candies\n        .iter()\n        .map(|&c| if c + extraCandies >= mx { 1 } else { 0 })\n        .collect()\n}`,
        php: `function kidsWithCandies($candies, $extraCandies) {\n    $mx = max($candies);\n    $out = [];\n    foreach ($candies as $c) $out[] = $c + $extraCandies >= $mx ? 1 : 0;\n    return $out;\n}`,
        ruby: `def kidsWithCandies(candies, extraCandies)\n  mx = candies.max\n  candies.map { |c| c + extraCandies >= mx ? 1 : 0 }\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Exceed Threshold Value I (LC 3065) ────
  (() => {
    const ref = (nums: number[], k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] < k) count++;
      return count;
    };
    return {
      slug: "minimum-operations-to-exceed-threshold-value-i",
      title: "Minimum Operations to Exceed Threshold Value I",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "HCL"],
      signature: { funcName: "minOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In one operation you remove **one occurrence of the smallest** element of `nums`.\n\nReturn the minimum number of operations after which every remaining element is **greater than or equal to** `k`.",
        [
          { in: "nums = [2,11,10,1,3], k = 10", out: "3", note: "Remove 1, 2 and 3." },
          { in: "nums = [1,1,2,4,9], k = 1", out: "0", note: "Everything already reaches 1." },
          { in: "nums = [1,1,2,4,9], k = 9", out: "4" },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 10^9", "1 <= k <= 10^9", "The input is generated so that there is at least one element >= k."]),
      hints: [
        "Removing the smallest repeatedly removes exactly the elements below `k`.",
        "Their order does not matter.",
        "So the answer is simply how many elements are below `k`.",
      ],
      editorial: explain({
        idea: "Every element below `k` must go, and every element at or above `k` may stay. Since the operation always removes a smallest element, the ones below `k` are removed first — so the count of them is the answer.",
        steps: [
          "Count the elements strictly below `k`.",
          "Return that count.",
        ],
        why: "The rule \"remove the smallest\" never forces the removal of an element at or above `k` while anything smaller remains, so no operation is ever wasted. That is why no sorting or simulation is needed — the count alone is exact.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The threshold is `>= k`, so elements exactly equal to `k` stay.",
          "Sorting and simulating gives the same answer but does more work.",
          "The order of removals is irrelevant to the count.",
        ],
      }),
      examples: [
        { input: "[2,11,10,1,3]\n10", expectedOutput: "3" },
        { input: "[1,1,2,4,9]\n1", expectedOutput: "0" },
        { input: "[1,1,2,4,9]\n9", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const span = pick(rng, [10, 50, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, span));
        // The statement promises at least one element reaches k.
        const k = nums[ri(rng, 0, n - 1)];
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperations(nums: List[int], k: int) -> int:\n    return sum(1 for v in nums if v < k)`,
        javascript: `var minOperations = function(nums, k) {\n    var count = 0;\n    for (var i = 0; i < nums.length; i++) if (nums[i] < k) count++;\n    return count;\n};`,
        typescript: `function minOperations(nums: number[], k: number): number {\n    var count = 0;\n    for (var i = 0; i < nums.length; i++) if (nums[i] < k) count++;\n    return count;\n}`,
        java: `public static int minOperations(int[] nums, int k) {\n    int count = 0;\n    for (int v : nums) if (v < k) count++;\n    return count;\n}`,
        cpp: `int minOperations(vector<int>& nums, int k) {\n    int count = 0;\n    for (int v : nums) if (v < k) count++;\n    return count;\n}`,
        c: `int minOperations(int* nums, int numsSize, int k) {\n    int count = 0;\n    for (int i = 0; i < numsSize; i++) if (nums[i] < k) count++;\n    return count;\n}`,
        csharp: `public static int MinOperations(int[] nums, int k)\n{\n    int count = 0;\n    foreach (var v in nums) if (v < k) count++;\n    return count;\n}`,
        go: `func minOperations(nums []int, k int) int {\n\tcount := 0\n\tfor _, v := range nums {\n\t\tif v < k {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun minOperations(nums: IntArray, k: Int): Int {\n    return nums.count { it < k }\n}`,
        swift: `func minOperations(_ nums: [Int], _ k: Int) -> Int {\n    return nums.filter { $0 < k }.count\n}`,
        rust: `fn minOperations(nums: Vec<i32>, k: i32) -> i32 {\n    nums.iter().filter(|&&v| v < k).count() as i32\n}`,
        php: `function minOperations($nums, $k) {\n    $count = 0;\n    foreach ($nums as $v) if ($v < $k) $count++;\n    return $count;\n}`,
        ruby: `def minOperations(nums, k)\n  nums.count { |v| v < k }\nend`,
      },
    };
  })(),

  // ── Find the Integer Added to Array I (LC 3131) ─────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      let mn1 = nums1[0], mn2 = nums2[0];
      for (let i = 1; i < nums1.length; i++) if (nums1[i] < mn1) mn1 = nums1[i];
      for (let i = 1; i < nums2.length; i++) if (nums2[i] < mn2) mn2 = nums2[i];
      return mn2 - mn1;
    };
    return {
      slug: "find-the-integer-added-to-array-i",
      title: "Find the Integer Added to Array I",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Google", "Zoho"],
      signature: { funcName: "addedInteger", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums1` and `nums2` have the same length. Every element of `nums1` was increased — or decreased — by the **same** integer `x`, and the result, reordered, is `nums2`.\n\nReturn `x`.",
        [
          { in: "nums1 = [2,6,4], nums2 = [9,7,5]", out: "3", note: "Adding 3 turns `[2,6,4]` into `[5,9,7]`." },
          { in: "nums1 = [10], nums2 = [5]", out: "-5" },
          { in: "nums1 = [1,1,1,1], nums2 = [1,1,1,1]", out: "0" },
        ],
        ["1 <= nums1.length == nums2.length <= 100", "0 <= nums1[i], nums2[i] <= 1000", "The test cases are generated so that there is an integer x such that nums1 can become equal to nums2 by adding x to each element of nums1."]),
      hints: [
        "Adding the same value to everything shifts the whole array without changing its order.",
        "So the smallest element of `nums1` corresponds to the smallest of `nums2`.",
        "The answer is the difference between those two minima.",
      ],
      editorial: explain({
        idea: "A constant shift maps the minimum to the minimum, so `x` is `min(nums2) - min(nums1)`.",
        steps: [
          "Find the smallest value in each array.",
          "Return their difference.",
        ],
        why: "Adding a constant is order-preserving, which is exactly why the reordering in the statement is harmless: whatever permutation was applied, the smallest of `nums2` is still the image of the smallest of `nums1`. Comparing sums, or any other order statistic, works equally well for the same reason.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing element by element fails, because `nums2` may be in a different order.",
          "`x` can be negative — the elements may have been decreased.",
          "Sorting both arrays also works but is more than the problem needs.",
        ],
      }),
      examples: [
        { input: "[2,6,4]\n[9,7,5]", expectedOutput: "3" },
        { input: "[10]\n[5]", expectedOutput: "-5" },
        { input: "[1,1,1,1]\n[1,1,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const nums1 = Array.from({ length: n }, () => ri(rng, 0, 500));
        const x = ri(rng, -200, 200);
        // Shift, then shuffle: the statement allows nums2 in any order.
        const nums2 = shuffle(rng, nums1.map((v) => v + x));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef addedInteger(nums1: List[int], nums2: List[int]) -> int:\n    return min(nums2) - min(nums1)`,
        javascript: `var addedInteger = function(nums1, nums2) {\n    var mn1 = nums1[0], mn2 = nums2[0], i;\n    for (i = 1; i < nums1.length; i++) if (nums1[i] < mn1) mn1 = nums1[i];\n    for (i = 1; i < nums2.length; i++) if (nums2[i] < mn2) mn2 = nums2[i];\n    return mn2 - mn1;\n};`,
        typescript: `function addedInteger(nums1: number[], nums2: number[]): number {\n    var mn1 = nums1[0], mn2 = nums2[0], i: number;\n    for (i = 1; i < nums1.length; i++) if (nums1[i] < mn1) mn1 = nums1[i];\n    for (i = 1; i < nums2.length; i++) if (nums2[i] < mn2) mn2 = nums2[i];\n    return mn2 - mn1;\n}`,
        java: `public static int addedInteger(int[] nums1, int[] nums2) {\n    int mn1 = nums1[0], mn2 = nums2[0];\n    for (int v : nums1) mn1 = Math.min(mn1, v);\n    for (int v : nums2) mn2 = Math.min(mn2, v);\n    return mn2 - mn1;\n}`,
        cpp: `int addedInteger(vector<int>& nums1, vector<int>& nums2) {\n    int mn1 = *min_element(nums1.begin(), nums1.end());\n    int mn2 = *min_element(nums2.begin(), nums2.end());\n    return mn2 - mn1;\n}`,
        c: `int addedInteger(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int mn1 = nums1[0], mn2 = nums2[0];\n    for (int i = 1; i < nums1Size; i++) if (nums1[i] < mn1) mn1 = nums1[i];\n    for (int i = 1; i < nums2Size; i++) if (nums2[i] < mn2) mn2 = nums2[i];\n    return mn2 - mn1;\n}`,
        csharp: `public static int AddedInteger(int[] nums1, int[] nums2)\n{\n    int mn1 = nums1[0], mn2 = nums2[0];\n    foreach (var v in nums1) mn1 = Math.Min(mn1, v);\n    foreach (var v in nums2) mn2 = Math.Min(mn2, v);\n    return mn2 - mn1;\n}`,
        go: `func addedInteger(nums1 []int, nums2 []int) int {\n\tmn1, mn2 := nums1[0], nums2[0]\n\tfor _, v := range nums1 {\n\t\tif v < mn1 {\n\t\t\tmn1 = v\n\t\t}\n\t}\n\tfor _, v := range nums2 {\n\t\tif v < mn2 {\n\t\t\tmn2 = v\n\t\t}\n\t}\n\treturn mn2 - mn1\n}`,
        kotlin: `fun addedInteger(nums1: IntArray, nums2: IntArray): Int {\n    var a = nums1[0]\n    for (v in nums1) if (v < a) a = v\n    var b = nums2[0]\n    for (v in nums2) if (v < b) b = v\n    return b - a\n}`,
        swift: `func addedInteger(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    return nums2.min()! - nums1.min()!\n}`,
        rust: `fn addedInteger(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    nums2.iter().min().unwrap() - nums1.iter().min().unwrap()\n}`,
        php: `function addedInteger($nums1, $nums2) {\n    return min($nums2) - min($nums1);\n}`,
        ruby: `def addedInteger(nums1, nums2)\n  nums2.min - nums1.min\nend`,
      },
    };
  })(),

  // ── Minimum Sum of Mountain Triplets I (LC 2908) ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      if (n < 3) return -1;
      const pre = new Array(n).fill(0);
      const suf = new Array(n).fill(0);
      pre[0] = nums[0];
      for (let i = 1; i < n; i++) pre[i] = Math.min(pre[i - 1], nums[i]);
      suf[n - 1] = nums[n - 1];
      for (let i = n - 2; i >= 0; i--) suf[i] = Math.min(suf[i + 1], nums[i]);
      let best = -1;
      for (let j = 1; j + 1 < n; j++) {
        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {
          const s = pre[j - 1] + nums[j] + suf[j + 1];
          if (best < 0 || s < best) best = s;
        }
      }
      return best;
    };
    return {
      slug: "minimum-sum-of-mountain-triplets-i",
      title: "Minimum Sum of Mountain Triplets I",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google", "Mindtree"],
      signature: { funcName: "minimumSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Indices `i < j < k` form a **mountain** when `nums[i] < nums[j]` and `nums[k] < nums[j]`.\n\nReturn the minimum possible value of `nums[i] + nums[j] + nums[k]` over all mountains, or `-1` if there is none.",
        [
          { in: "nums = [8,6,1,5,3]", out: "9", note: "Indices 2, 3 and 4: `1 + 5 + 3`." },
          { in: "nums = [5,4,8,7,10,2]", out: "13", note: "Indices 1, 3 and 5: `4 + 7 + 2`." },
          { in: "nums = [6,5,4,3,4,5]", out: "-1", note: "No index has a smaller value on both sides." },
        ],
        ["3 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "Fix the peak `j` and the other two choices become independent.",
        "The best `i` is the smallest value to the left, and the best `k` the smallest to the right.",
        "Precompute prefix and suffix minima in one pass each.",
      ],
      editorial: explain({
        idea: "Treat each index as the peak. The cheapest mountain through it uses the smallest value on its left and the smallest on its right, so prefix and suffix minima answer every peak in O(1).",
        steps: [
          "Build `pre[i]` = the minimum of `nums[0 … i]` and `suf[i]` = the minimum of `nums[i … n-1]`.",
          "For each `j` from 1 to `n - 2`, check `pre[j-1] < nums[j]` and `suf[j+1] < nums[j]`.",
          "Track the smallest total; return `-1` if no peak qualifies.",
        ],
        why: "Fixing the peak decouples the two sides — the choice of `i` never constrains `k` — which is what turns an `O(n³)` scan over triples into two linear passes. Both inequalities are strict, so a flat plateau never forms a mountain.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Both comparisons are strict; equal neighbours do not make a peak.",
          "The first and last indices can never be the peak.",
          "Return `-1`, not 0, when no mountain exists.",
        ],
      }),
      examples: [
        { input: "[8,6,1,5,3]", expectedOutput: "9" },
        { input: "[5,4,8,7,10,2]", expectedOutput: "13" },
        { input: "[6,5,4,3,4,5]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 14);
        const nums = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [4, 12, 50])));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumSum(nums: List[int]) -> int:\n    n = len(nums)\n    pre = [0] * n\n    suf = [0] * n\n    pre[0] = nums[0]\n    for i in range(1, n):\n        pre[i] = min(pre[i - 1], nums[i])\n    suf[n - 1] = nums[n - 1]\n    for i in range(n - 2, -1, -1):\n        suf[i] = min(suf[i + 1], nums[i])\n    best = -1\n    for j in range(1, n - 1):\n        if pre[j - 1] < nums[j] and suf[j + 1] < nums[j]:\n            s = pre[j - 1] + nums[j] + suf[j + 1]\n            if best < 0 or s < best:\n                best = s\n    return best`,
        javascript: `var minimumSum = function(nums) {\n    var n = nums.length, i;\n    if (n < 3) return -1;\n    var pre = [], suf = [];\n    for (i = 0; i < n; i++) { pre.push(0); suf.push(0); }\n    pre[0] = nums[0];\n    for (i = 1; i < n; i++) pre[i] = Math.min(pre[i - 1], nums[i]);\n    suf[n - 1] = nums[n - 1];\n    for (i = n - 2; i >= 0; i--) suf[i] = Math.min(suf[i + 1], nums[i]);\n    var best = -1;\n    for (var j = 1; j + 1 < n; j++) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            var s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    return best;\n};`,
        typescript: `function minimumSum(nums: number[]): number {\n    var n = nums.length, i: number;\n    if (n < 3) return -1;\n    var pre: number[] = [], suf: number[] = [];\n    for (i = 0; i < n; i++) { pre.push(0); suf.push(0); }\n    pre[0] = nums[0];\n    for (i = 1; i < n; i++) pre[i] = Math.min(pre[i - 1], nums[i]);\n    suf[n - 1] = nums[n - 1];\n    for (i = n - 2; i >= 0; i--) suf[i] = Math.min(suf[i + 1], nums[i]);\n    var best = -1;\n    for (var j = 1; j + 1 < n; j++) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            var s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        java: `public static int minimumSum(int[] nums) {\n    int n = nums.length;\n    if (n < 3) return -1;\n    int[] pre = new int[n];\n    int[] suf = new int[n];\n    pre[0] = nums[0];\n    for (int i = 1; i < n; i++) pre[i] = Math.min(pre[i - 1], nums[i]);\n    suf[n - 1] = nums[n - 1];\n    for (int i = n - 2; i >= 0; i--) suf[i] = Math.min(suf[i + 1], nums[i]);\n    int best = -1;\n    for (int j = 1; j + 1 < n; j++) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            int s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        cpp: `int minimumSum(vector<int>& nums) {\n    int n = (int) nums.size();\n    if (n < 3) return -1;\n    vector<int> pre(n), suf(n);\n    pre[0] = nums[0];\n    for (int i = 1; i < n; i++) pre[i] = min(pre[i - 1], nums[i]);\n    suf[n - 1] = nums[n - 1];\n    for (int i = n - 2; i >= 0; i--) suf[i] = min(suf[i + 1], nums[i]);\n    int best = -1;\n    for (int j = 1; j + 1 < n; j++) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            int s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        c: `int minimumSum(int* nums, int numsSize) {\n    int n = numsSize;\n    if (n < 3) return -1;\n    int* pre = (int*) malloc((size_t) n * sizeof(int));\n    int* suf = (int*) malloc((size_t) n * sizeof(int));\n    pre[0] = nums[0];\n    for (int i = 1; i < n; i++) pre[i] = pre[i - 1] < nums[i] ? pre[i - 1] : nums[i];\n    suf[n - 1] = nums[n - 1];\n    for (int i = n - 2; i >= 0; i--) suf[i] = suf[i + 1] < nums[i] ? suf[i + 1] : nums[i];\n    int best = -1;\n    for (int j = 1; j + 1 < n; j++) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            int s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    free(pre);\n    free(suf);\n    return best;\n}`,
        csharp: `public static int MinimumSum(int[] nums)\n{\n    int n = nums.Length;\n    if (n < 3) return -1;\n    var pre = new int[n];\n    var suf = new int[n];\n    pre[0] = nums[0];\n    for (int i = 1; i < n; i++) pre[i] = Math.Min(pre[i - 1], nums[i]);\n    suf[n - 1] = nums[n - 1];\n    for (int i = n - 2; i >= 0; i--) suf[i] = Math.Min(suf[i + 1], nums[i]);\n    int best = -1;\n    for (int j = 1; j + 1 < n; j++)\n    {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j])\n        {\n            int s = pre[j - 1] + nums[j] + suf[j + 1];\n            if (best < 0 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        go: `func minimumSum(nums []int) int {\n\tn := len(nums)\n\tif n < 3 {\n\t\treturn -1\n\t}\n\tpre := make([]int, n)\n\tsuf := make([]int, n)\n\tpre[0] = nums[0]\n\tfor i := 1; i < n; i++ {\n\t\tpre[i] = pre[i-1]\n\t\tif nums[i] < pre[i] {\n\t\t\tpre[i] = nums[i]\n\t\t}\n\t}\n\tsuf[n-1] = nums[n-1]\n\tfor i := n - 2; i >= 0; i-- {\n\t\tsuf[i] = suf[i+1]\n\t\tif nums[i] < suf[i] {\n\t\t\tsuf[i] = nums[i]\n\t\t}\n\t}\n\tbest := -1\n\tfor j := 1; j+1 < n; j++ {\n\t\tif pre[j-1] < nums[j] && suf[j+1] < nums[j] {\n\t\t\ts := pre[j-1] + nums[j] + suf[j+1]\n\t\t\tif best < 0 || s < best {\n\t\t\t\tbest = s\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumSum(nums: IntArray): Int {\n    val n = nums.size\n    if (n < 3) return -1\n    val pre = IntArray(n)\n    val suf = IntArray(n)\n    pre[0] = nums[0]\n    for (i in 1 until n) pre[i] = minOf(pre[i - 1], nums[i])\n    suf[n - 1] = nums[n - 1]\n    for (i in n - 2 downTo 0) suf[i] = minOf(suf[i + 1], nums[i])\n    var best = -1\n    for (j in 1 until n - 1) {\n        if (pre[j - 1] < nums[j] && suf[j + 1] < nums[j]) {\n            val s = pre[j - 1] + nums[j] + suf[j + 1]\n            if (best < 0 || s < best) best = s\n        }\n    }\n    return best\n}`,
        swift: `func minimumSum(_ nums: [Int]) -> Int {\n    let n = nums.count\n    if n < 3 { return -1 }\n    var pre = [Int](repeating: 0, count: n)\n    var suf = [Int](repeating: 0, count: n)\n    pre[0] = nums[0]\n    for i in 1..<n { pre[i] = min(pre[i - 1], nums[i]) }\n    suf[n - 1] = nums[n - 1]\n    for i in stride(from: n - 2, through: 0, by: -1) { suf[i] = min(suf[i + 1], nums[i]) }\n    var best = -1\n    for j in 1..<(n - 1) {\n        if pre[j - 1] < nums[j] && suf[j + 1] < nums[j] {\n            let s = pre[j - 1] + nums[j] + suf[j + 1]\n            if best < 0 || s < best { best = s }\n        }\n    }\n    return best\n}`,
        rust: `fn minimumSum(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    if n < 3 {\n        return -1;\n    }\n    let mut pre = vec![0i32; n];\n    let mut suf = vec![0i32; n];\n    pre[0] = nums[0];\n    for i in 1..n {\n        pre[i] = std::cmp::min(pre[i - 1], nums[i]);\n    }\n    suf[n - 1] = nums[n - 1];\n    for i in (0..n - 1).rev() {\n        suf[i] = std::cmp::min(suf[i + 1], nums[i]);\n    }\n    let mut best = -1i32;\n    for j in 1..n - 1 {\n        if pre[j - 1] < nums[j] && suf[j + 1] < nums[j] {\n            let s = pre[j - 1] + nums[j] + suf[j + 1];\n            if best < 0 || s < best {\n                best = s;\n            }\n        }\n    }\n    best\n}`,
        php: `function minimumSum($nums) {\n    $n = count($nums);\n    if ($n < 3) return -1;\n    $pre = array_fill(0, $n, 0);\n    $suf = array_fill(0, $n, 0);\n    $pre[0] = $nums[0];\n    for ($i = 1; $i < $n; $i++) $pre[$i] = min($pre[$i - 1], $nums[$i]);\n    $suf[$n - 1] = $nums[$n - 1];\n    for ($i = $n - 2; $i >= 0; $i--) $suf[$i] = min($suf[$i + 1], $nums[$i]);\n    $best = -1;\n    for ($j = 1; $j + 1 < $n; $j++) {\n        if ($pre[$j - 1] < $nums[$j] && $suf[$j + 1] < $nums[$j]) {\n            $s = $pre[$j - 1] + $nums[$j] + $suf[$j + 1];\n            if ($best < 0 || $s < $best) $best = $s;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minimumSum(nums)\n  n = nums.length\n  return -1 if n < 3\n  pre = Array.new(n, 0)\n  suf = Array.new(n, 0)\n  pre[0] = nums[0]\n  (1...n).each { |i| pre[i] = [pre[i - 1], nums[i]].min }\n  suf[n - 1] = nums[n - 1]\n  (n - 2).downto(0) { |i| suf[i] = [suf[i + 1], nums[i]].min }\n  best = -1\n  (1...(n - 1)).each do |j|\n    next unless pre[j - 1] < nums[j] && suf[j + 1] < nums[j]\n    s = pre[j - 1] + nums[j] + suf[j + 1]\n    best = s if best < 0 || s < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximum Value of an Ordered Triplet II (LC 2874) ────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let best = 0, maxI = 0, maxDiff = 0;
      for (let k = 0; k < n; k++) {
        const v = maxDiff * nums[k];
        if (v > best) best = v;
        if (maxI - nums[k] > maxDiff) maxDiff = maxI - nums[k];
        if (nums[k] > maxI) maxI = nums[k];
      }
      return best;
    };
    return {
      slug: "maximum-value-of-an-ordered-triplet-ii",
      title: "Maximum Value of an Ordered Triplet II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maximumTripletValue", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **value** of the ordered triplet `i < j < k` is `(nums[i] - nums[j]) * nums[k]`.\n\nReturn the maximum value over all such triplets, or `0` if every triplet has a negative value.",
        [
          { in: "nums = [12,6,1,2,7]", out: "77", note: "Indices 0, 2 and 4: `(12 - 1) × 7`." },
          { in: "nums = [1,10,3,4,19]", out: "133", note: "Indices 1, 2 and 4: `(10 - 3) × 19`." },
          { in: "nums = [1,2,3]", out: "0", note: "The only triplet is negative." },
        ],
        ["3 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"]),
      hints: [
        "Sweep `k` from left to right and keep the best `(nums[i] - nums[j])` seen so far.",
        "That in turn needs the largest `nums[i]` seen before the current `j`.",
        "Two running maxima are enough — no nested loops.",
      ],
      editorial: explain({
        idea: "One pass, carrying two running values: the largest element seen so far, and the largest difference `nums[i] - nums[j]` over pairs seen so far. At each `k` the answer candidate is `maxDiff × nums[k]`.",
        steps: [
          "Sweep `k` from left to right.",
          "Score `maxDiff × nums[k]` against the best so far.",
          "Update `maxDiff` with `maxI - nums[k]`, treating the current element as a `j`.",
          "Update `maxI` with `nums[k]`, treating it as an `i`.",
        ],
        why: "The update order is the whole trick: scoring *before* the updates guarantees the `i` and `j` behind `maxDiff` both lie strictly before `k`. Because all values are positive, a negative `maxDiff` can never beat the initial `0`, which is exactly the fallback the statement asks for.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Updating the running maxima before scoring lets `k` be used as its own `i` or `j`.",
          "The answer is clamped at 0, so a wholly negative array answers 0.",
          "The products reach `10^4 × 10^4 = 10^8`, which fits an int but not with much room.",
        ],
      }),
      examples: [
        { input: "[12,6,1,2,7]", expectedOutput: "77" },
        { input: "[1,10,3,4,19]", expectedOutput: "133" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 14);
        const nums = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [8, 60, 400])));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumTripletValue(nums: List[int]) -> int:\n    best = 0\n    max_i = 0\n    max_diff = 0\n    for v in nums:\n        best = max(best, max_diff * v)\n        max_diff = max(max_diff, max_i - v)\n        max_i = max(max_i, v)\n    return best`,
        javascript: `var maximumTripletValue = function(nums) {\n    var best = 0, maxI = 0, maxDiff = 0;\n    for (var k = 0; k < nums.length; k++) {\n        var v = maxDiff * nums[k];\n        if (v > best) best = v;\n        if (maxI - nums[k] > maxDiff) maxDiff = maxI - nums[k];\n        if (nums[k] > maxI) maxI = nums[k];\n    }\n    return best;\n};`,
        typescript: `function maximumTripletValue(nums: number[]): number {\n    var best = 0, maxI = 0, maxDiff = 0;\n    for (var k = 0; k < nums.length; k++) {\n        var v = maxDiff * nums[k];\n        if (v > best) best = v;\n        if (maxI - nums[k] > maxDiff) maxDiff = maxI - nums[k];\n        if (nums[k] > maxI) maxI = nums[k];\n    }\n    return best;\n}`,
        java: `public static int maximumTripletValue(int[] nums) {\n    long best = 0;\n    long maxI = 0, maxDiff = 0;\n    for (int v : nums) {\n        best = Math.max(best, maxDiff * v);\n        maxDiff = Math.max(maxDiff, maxI - v);\n        maxI = Math.max(maxI, v);\n    }\n    return (int) best;\n}`,
        cpp: `int maximumTripletValue(vector<int>& nums) {\n    long long best = 0, maxI = 0, maxDiff = 0;\n    for (int v : nums) {\n        best = max(best, maxDiff * v);\n        maxDiff = max(maxDiff, maxI - v);\n        maxI = max(maxI, (long long) v);\n    }\n    return (int) best;\n}`,
        c: `int maximumTripletValue(int* nums, int numsSize) {\n    long long best = 0, maxI = 0, maxDiff = 0;\n    for (int k = 0; k < numsSize; k++) {\n        long long v = maxDiff * nums[k];\n        if (v > best) best = v;\n        if (maxI - nums[k] > maxDiff) maxDiff = maxI - nums[k];\n        if (nums[k] > maxI) maxI = nums[k];\n    }\n    return (int) best;\n}`,
        csharp: `public static int MaximumTripletValue(int[] nums)\n{\n    long best = 0, maxI = 0, maxDiff = 0;\n    foreach (var v in nums)\n    {\n        best = Math.Max(best, maxDiff * v);\n        maxDiff = Math.Max(maxDiff, maxI - v);\n        maxI = Math.Max(maxI, v);\n    }\n    return (int) best;\n}`,
        go: `func maximumTripletValue(nums []int) int {\n\tbest, maxI, maxDiff := 0, 0, 0\n\tfor _, v := range nums {\n\t\tif maxDiff*v > best {\n\t\t\tbest = maxDiff * v\n\t\t}\n\t\tif maxI-v > maxDiff {\n\t\t\tmaxDiff = maxI - v\n\t\t}\n\t\tif v > maxI {\n\t\t\tmaxI = v\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumTripletValue(nums: IntArray): Int {\n    var best = 0L\n    var maxI = 0L\n    var maxDiff = 0L\n    for (v in nums) {\n        best = maxOf(best, maxDiff * v)\n        maxDiff = maxOf(maxDiff, maxI - v)\n        maxI = maxOf(maxI, v.toLong())\n    }\n    return best.toInt()\n}`,
        swift: `func maximumTripletValue(_ nums: [Int]) -> Int {\n    var best = 0, maxI = 0, maxDiff = 0\n    for v in nums {\n        best = max(best, maxDiff * v)\n        maxDiff = max(maxDiff, maxI - v)\n        maxI = max(maxI, v)\n    }\n    return best\n}`,
        rust: `fn maximumTripletValue(nums: Vec<i32>) -> i32 {\n    let mut best: i64 = 0;\n    let mut max_i: i64 = 0;\n    let mut max_diff: i64 = 0;\n    for &v in nums.iter() {\n        let v = v as i64;\n        best = std::cmp::max(best, max_diff * v);\n        max_diff = std::cmp::max(max_diff, max_i - v);\n        max_i = std::cmp::max(max_i, v);\n    }\n    best as i32\n}`,
        php: `function maximumTripletValue($nums) {\n    $best = 0;\n    $maxI = 0;\n    $maxDiff = 0;\n    foreach ($nums as $v) {\n        $best = max($best, $maxDiff * $v);\n        $maxDiff = max($maxDiff, $maxI - $v);\n        $maxI = max($maxI, $v);\n    }\n    return $best;\n}`,
        ruby: `def maximumTripletValue(nums)\n  best = 0\n  max_i = 0\n  max_diff = 0\n  nums.each do |v|\n    best = [best, max_diff * v].max\n    max_diff = [max_diff, max_i - v].max\n    max_i = [max_i, v].max\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Distribute Elements Into Two Arrays I (LC 3069) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = [nums[0]], b = [nums[1]];
      for (let i = 2; i < nums.length; i++) {
        if (a[a.length - 1] > b[b.length - 1]) a.push(nums[i]);
        else b.push(nums[i]);
      }
      return a.concat(b);
    };
    return {
      slug: "distribute-elements-into-two-arrays-i",
      title: "Distribute Elements Into Two Arrays I",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Google", "Accenture"],
      signature: { funcName: "resultArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Distribute the elements of `nums` into two arrays `arr1` and `arr2` in `n` operations. The first element goes to `arr1` and the second to `arr2`.\n\nAfter that, element `i` goes to `arr1` if the **last** element of `arr1` is greater than the last element of `arr2`, and to `arr2` otherwise. Return `arr1` followed by `arr2`.",
        [
          { in: "nums = [2,1,3]", out: "[2,3,1]", note: "`arr1 = [2]`, `arr2 = [1]`; 2 > 1 so the 3 joins `arr1`." },
          { in: "nums = [5,4,3,8]", out: "[5,3,4,8]" },
          { in: "nums = [1,2]", out: "[1,2]" },
        ],
        ["2 <= nums.length <= 50", "1 <= nums[i] <= 100", "All elements in nums are distinct."]),
      hints: [
        "Simulate exactly as written; there is no shortcut.",
        "Only the **last** element of each array matters for the decision.",
        "Concatenate at the end, not as you go.",
      ],
      editorial: explain({
        idea: "Straight simulation. Seed the two arrays with the first two elements, then append each remaining element to whichever array currently ends larger, defaulting to `arr2` on a tie.",
        steps: [
          "Put `nums[0]` in `arr1` and `nums[1]` in `arr2`.",
          "For each later element, compare the two arrays' last values.",
          "Append to `arr1` when its last is strictly greater, otherwise to `arr2`.",
          "Return `arr1` concatenated with `arr2`.",
        ],
        why: "Only the tails matter, so each step is O(1) and the whole thing is one pass. The elements are distinct, so the `>` test never actually ties — but writing the fallback as `arr2` matches the statement exactly and keeps the code honest if that guarantee were relaxed.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The decision uses the last element, not the maximum or the length.",
          "The first two placements are fixed and not decided by the rule.",
          "Concatenating in the wrong order reverses the answer.",
        ],
      }),
      examples: [
        { input: "[2,1,3]", expectedOutput: "[2,3,1]" },
        { input: "[5,4,3,8]", expectedOutput: "[5,3,4,8]" },
        { input: "[1,2]", expectedOutput: "[1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 12);
        // The statement says the values are distinct, so draw without repeats.
        const nums = shuffle(rng, Array.from({ length: 100 }, (_, i) => i + 1)).slice(0, n);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef resultArray(nums: List[int]) -> List[int]:\n    a = [nums[0]]\n    b = [nums[1]]\n    for v in nums[2:]:\n        if a[-1] > b[-1]:\n            a.append(v)\n        else:\n            b.append(v)\n    return a + b`,
        javascript: `var resultArray = function(nums) {\n    var a = [nums[0]], b = [nums[1]];\n    for (var i = 2; i < nums.length; i++) {\n        if (a[a.length - 1] > b[b.length - 1]) a.push(nums[i]);\n        else b.push(nums[i]);\n    }\n    return a.concat(b);\n};`,
        typescript: `function resultArray(nums: number[]): number[] {\n    var a: number[] = [nums[0]], b: number[] = [nums[1]];\n    for (var i = 2; i < nums.length; i++) {\n        if (a[a.length - 1] > b[b.length - 1]) a.push(nums[i]);\n        else b.push(nums[i]);\n    }\n    return a.concat(b);\n}`,
        java: `public static int[] resultArray(int[] nums) {\n    List<Integer> a = new ArrayList<>();\n    List<Integer> b = new ArrayList<>();\n    a.add(nums[0]);\n    b.add(nums[1]);\n    for (int i = 2; i < nums.length; i++) {\n        if (a.get(a.size() - 1) > b.get(b.size() - 1)) a.add(nums[i]);\n        else b.add(nums[i]);\n    }\n    int[] out = new int[nums.length];\n    int k = 0;\n    for (int v : a) out[k++] = v;\n    for (int v : b) out[k++] = v;\n    return out;\n}`,
        cpp: `vector<int> resultArray(vector<int>& nums) {\n    vector<int> a = { nums[0] }, b = { nums[1] };\n    for (size_t i = 2; i < nums.size(); i++) {\n        if (a.back() > b.back()) a.push_back(nums[i]);\n        else b.push_back(nums[i]);\n    }\n    a.insert(a.end(), b.begin(), b.end());\n    return a;\n}`,
        c: `int* resultArray(int* nums, int numsSize, int* returnSize) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    int* b = (int*) malloc((size_t) numsSize * sizeof(int));\n    int an = 0, bn = 0;\n    a[an++] = nums[0];\n    b[bn++] = nums[1];\n    for (int i = 2; i < numsSize; i++) {\n        if (a[an - 1] > b[bn - 1]) a[an++] = nums[i];\n        else b[bn++] = nums[i];\n    }\n    int* out = (int*) malloc((size_t) numsSize * sizeof(int));\n    int k = 0;\n    for (int i = 0; i < an; i++) out[k++] = a[i];\n    for (int i = 0; i < bn; i++) out[k++] = b[i];\n    free(a);\n    free(b);\n    *returnSize = numsSize;\n    return out;\n}`,
        csharp: `public static int[] ResultArray(int[] nums)\n{\n    var a = new List<int> { nums[0] };\n    var b = new List<int> { nums[1] };\n    for (int i = 2; i < nums.Length; i++)\n    {\n        if (a[a.Count - 1] > b[b.Count - 1]) a.Add(nums[i]);\n        else b.Add(nums[i]);\n    }\n    a.AddRange(b);\n    return a.ToArray();\n}`,
        go: `func resultArray(nums []int) []int {\n\ta := []int{nums[0]}\n\tb := []int{nums[1]}\n\tfor i := 2; i < len(nums); i++ {\n\t\tif a[len(a)-1] > b[len(b)-1] {\n\t\t\ta = append(a, nums[i])\n\t\t} else {\n\t\t\tb = append(b, nums[i])\n\t\t}\n\t}\n\treturn append(a, b...)\n}`,
        kotlin: `fun resultArray(nums: IntArray): IntArray {\n    val a = arrayListOf(nums[0])\n    val b = arrayListOf(nums[1])\n    for (i in 2 until nums.size) {\n        if (a[a.size - 1] > b[b.size - 1]) a.add(nums[i]) else b.add(nums[i])\n    }\n    a.addAll(b)\n    return a.toIntArray()\n}`,
        swift: `func resultArray(_ nums: [Int]) -> [Int] {\n    var a = [nums[0]]\n    var b = [nums[1]]\n    for i in 2..<max(2, nums.count) where i < nums.count {\n        if a[a.count - 1] > b[b.count - 1] { a.append(nums[i]) } else { b.append(nums[i]) }\n    }\n    return a + b\n}`,
        rust: `fn resultArray(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = vec![nums[0]];\n    let mut b = vec![nums[1]];\n    for i in 2..nums.len() {\n        if a[a.len() - 1] > b[b.len() - 1] {\n            a.push(nums[i]);\n        } else {\n            b.push(nums[i]);\n        }\n    }\n    a.extend(b);\n    a\n}`,
        php: `function resultArray($nums) {\n    $a = [$nums[0]];\n    $b = [$nums[1]];\n    for ($i = 2; $i < count($nums); $i++) {\n        if ($a[count($a) - 1] > $b[count($b) - 1]) $a[] = $nums[$i];\n        else $b[] = $nums[$i];\n    }\n    return array_merge($a, $b);\n}`,
        ruby: `def resultArray(nums)\n  a = [nums[0]]\n  b = [nums[1]]\n  (2...nums.length).each do |i|\n    if a[-1] > b[-1]\n      a << nums[i]\n    else\n      b << nums[i]\n    end\n  end\n  a + b\nend`,
      },
    };
  })(),

  // ── Alternating Groups I (LC 3206) ──────────────────────────────
  (() => {
    const ref = (colors: number[]) => {
      const n = colors.length;
      let count = 0;
      for (let i = 0; i < n; i++) {
        const left = colors[(i - 1 + n) % n];
        const right = colors[(i + 1) % n];
        if (colors[i] !== left && colors[i] !== right) count++;
      }
      return count;
    };
    return {
      slug: "alternating-groups-i",
      title: "Alternating Groups I",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google", "Paytm"],
      signature: { funcName: "numberOfAlternatingGroups", params: [{ name: "colors", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Tiles are arranged in a **circle**, coloured red (`0`) or blue (`1`). An **alternating group** is three contiguous tiles — wrapping around the circle — whose middle tile differs in colour from both of its neighbours.\n\nReturn the number of alternating groups.",
        [
          { in: "colors = [1,1,1]", out: "0", note: "Every tile matches its neighbours." },
          { in: "colors = [0,1,0,0,1]", out: "3" },
          { in: "colors = [0,1,0,1]", out: "4", note: "A fully alternating circle: every tile is the middle of a group." },
        ],
        ["3 <= colors.length <= 100", "colors[i] is either 0 or 1."]),
      hints: [
        "Centre a window on each tile in turn.",
        "Wrapping is handled by indexing modulo the length.",
        "A group is alternating exactly when the middle differs from both sides.",
      ],
      editorial: explain({
        idea: "Every tile is the middle of exactly one group, so scan the tiles and count those that differ from both neighbours, indexing modulo `n` to close the circle.",
        steps: [
          "For each index `i`, read `colors[(i - 1 + n) % n]` and `colors[(i + 1) % n]`.",
          "Count `i` when its colour differs from both.",
        ],
        why: "Adding `n` before the modulus is what keeps the left index correct at `i == 0`, since a plain `-1 % n` is negative in most languages. Counting by middle tile rather than by window start makes each group counted exactly once.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A plain `(i - 1) % n` goes negative at the start of the array.",
          "With only two colours, \"differs from both neighbours\" also means the neighbours match each other.",
          "The circle means there are `n` groups to consider, not `n - 2`.",
        ],
      }),
      examples: [
        { input: "[1,1,1]", expectedOutput: "0" },
        { input: "[0,1,0,0,1]", expectedOutput: "3" },
        { input: "[0,1,0,1]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 16);
        const colors = Array.from({ length: n }, () => ri(rng, 0, 1));
        return { input: fmtIntArr(colors), expectedOutput: String(ref(colors)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfAlternatingGroups(colors: List[int]) -> int:\n    n = len(colors)\n    count = 0\n    for i in range(n):\n        left = colors[(i - 1) % n]\n        right = colors[(i + 1) % n]\n        if colors[i] != left and colors[i] != right:\n            count += 1\n    return count`,
        javascript: `var numberOfAlternatingGroups = function(colors) {\n    var n = colors.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        var left = colors[(i - 1 + n) % n];\n        var right = colors[(i + 1) % n];\n        if (colors[i] !== left && colors[i] !== right) count++;\n    }\n    return count;\n};`,
        typescript: `function numberOfAlternatingGroups(colors: number[]): number {\n    var n = colors.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        var left = colors[(i - 1 + n) % n];\n        var right = colors[(i + 1) % n];\n        if (colors[i] !== left && colors[i] !== right) count++;\n    }\n    return count;\n}`,
        java: `public static int numberOfAlternatingGroups(int[] colors) {\n    int n = colors.length, count = 0;\n    for (int i = 0; i < n; i++) {\n        int left = colors[(i - 1 + n) % n];\n        int right = colors[(i + 1) % n];\n        if (colors[i] != left && colors[i] != right) count++;\n    }\n    return count;\n}`,
        cpp: `int numberOfAlternatingGroups(vector<int>& colors) {\n    int n = (int) colors.size(), count = 0;\n    for (int i = 0; i < n; i++) {\n        int left = colors[(i - 1 + n) % n];\n        int right = colors[(i + 1) % n];\n        if (colors[i] != left && colors[i] != right) count++;\n    }\n    return count;\n}`,
        c: `int numberOfAlternatingGroups(int* colors, int colorsSize) {\n    int n = colorsSize, count = 0;\n    for (int i = 0; i < n; i++) {\n        int left = colors[(i - 1 + n) % n];\n        int right = colors[(i + 1) % n];\n        if (colors[i] != left && colors[i] != right) count++;\n    }\n    return count;\n}`,
        csharp: `public static int NumberOfAlternatingGroups(int[] colors)\n{\n    int n = colors.Length, count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int left = colors[(i - 1 + n) % n];\n        int right = colors[(i + 1) % n];\n        if (colors[i] != left && colors[i] != right) count++;\n    }\n    return count;\n}`,
        go: `func numberOfAlternatingGroups(colors []int) int {\n\tn := len(colors)\n\tcount := 0\n\tfor i := 0; i < n; i++ {\n\t\tleft := colors[(i-1+n)%n]\n\t\tright := colors[(i+1)%n]\n\t\tif colors[i] != left && colors[i] != right {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numberOfAlternatingGroups(colors: IntArray): Int {\n    val n = colors.size\n    var count = 0\n    for (i in 0 until n) {\n        val left = colors[(i - 1 + n) % n]\n        val right = colors[(i + 1) % n]\n        if (colors[i] != left && colors[i] != right) count++\n    }\n    return count\n}`,
        swift: `func numberOfAlternatingGroups(_ colors: [Int]) -> Int {\n    let n = colors.count\n    var count = 0\n    for i in 0..<n {\n        let left = colors[(i - 1 + n) % n]\n        let right = colors[(i + 1) % n]\n        if colors[i] != left && colors[i] != right { count += 1 }\n    }\n    return count\n}`,
        rust: `fn numberOfAlternatingGroups(colors: Vec<i32>) -> i32 {\n    let n = colors.len();\n    let mut count = 0i32;\n    for i in 0..n {\n        let left = colors[(i + n - 1) % n];\n        let right = colors[(i + 1) % n];\n        if colors[i] != left && colors[i] != right {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function numberOfAlternatingGroups($colors) {\n    $n = count($colors);\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $left = $colors[($i - 1 + $n) % $n];\n        $right = $colors[($i + 1) % $n];\n        if ($colors[$i] !== $left && $colors[$i] !== $right) $count++;\n    }\n    return $count;\n}`,
        ruby: `def numberOfAlternatingGroups(colors)\n  n = colors.length\n  count = 0\n  (0...n).each do |i|\n    left = colors[(i - 1 + n) % n]\n    right = colors[(i + 1) % n]\n    count += 1 if colors[i] != left && colors[i] != right\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Neither Minimum nor Maximum (LC 2733) ───────────────────────
  (() => {
    const ref = (nums: number[]) => {
      if (nums.length < 3) return -1;
      let mn = nums[0], mx = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] < mn) mn = nums[i];
        if (nums[i] > mx) mx = nums[i];
      }
      let best = -1;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === mn || nums[i] === mx) continue;
        if (best < 0 || nums[i] < best) best = nums[i];
      }
      return best;
    };
    return {
      slug: "neither-minimum-nor-maximum",
      title: "Neither Minimum nor Maximum",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Amazon", "Google", "Wipro"],
      signature: { funcName: "findNonMinOrMax", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` holds **distinct** positive integers. Return the **smallest** number in it that is neither the minimum nor the maximum of the array.\n\nIf no such number exists, return `-1`.",
        [
          { in: "nums = [3,2,1,4]", out: "2", note: "The minimum is 1 and the maximum 4; the smallest of what is left is 2." },
          { in: "nums = [1,2]", out: "-1", note: "Every element is either the minimum or the maximum." },
          { in: "nums = [2,1,3]", out: "2" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100", "All values of nums are distinct.", "Among the qualifying numbers, the smallest is returned."]),
      hints: [
        "With fewer than three distinct values there is nothing left over.",
        "Find the minimum and the maximum in one pass.",
        "Then take the smallest value that is neither.",
      ],
      editorial: explain({
        idea: "Find the extremes, then scan again for the smallest value that is neither.",
        steps: [
          "Return `-1` immediately when the array is shorter than three.",
          "Find the minimum and maximum.",
          "Scan for the smallest value different from both.",
        ],
        why: "Distinctness is what makes the two-pass approach exact: with repeats, a value equal to the minimum might still be a different element, and the `!=` test would wrongly exclude it. Sorting and reading index 1 is the classic one-liner, but the two passes are linear.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Arrays of length 1 or 2 always answer `-1`.",
          "Returning the *second* element of the unsorted array is not the same as the second smallest.",
          "The problem asks for a value, not an index.",
        ],
      }),
      examples: [
        { input: "[3,2,1,4]", expectedOutput: "2" },
        { input: "[1,2]", expectedOutput: "-1" },
        { input: "[2,1,3]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums = shuffle(rng, Array.from({ length: 100 }, (_, i) => i + 1)).slice(0, n);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findNonMinOrMax(nums: List[int]) -> int:\n    if len(nums) < 3:\n        return -1\n    mn, mx = min(nums), max(nums)\n    rest = [v for v in nums if v != mn and v != mx]\n    return min(rest) if rest else -1`,
        javascript: `var findNonMinOrMax = function(nums) {\n    if (nums.length < 3) return -1;\n    var mn = nums[0], mx = nums[0], i;\n    for (i = 1; i < nums.length; i++) {\n        if (nums[i] < mn) mn = nums[i];\n        if (nums[i] > mx) mx = nums[i];\n    }\n    var best = -1;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] === mn || nums[i] === mx) continue;\n        if (best < 0 || nums[i] < best) best = nums[i];\n    }\n    return best;\n};`,
        typescript: `function findNonMinOrMax(nums: number[]): number {\n    if (nums.length < 3) return -1;\n    var mn = nums[0], mx = nums[0], i: number;\n    for (i = 1; i < nums.length; i++) {\n        if (nums[i] < mn) mn = nums[i];\n        if (nums[i] > mx) mx = nums[i];\n    }\n    var best = -1;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] === mn || nums[i] === mx) continue;\n        if (best < 0 || nums[i] < best) best = nums[i];\n    }\n    return best;\n}`,
        java: `public static int findNonMinOrMax(int[] nums) {\n    if (nums.length < 3) return -1;\n    int mn = nums[0], mx = nums[0];\n    for (int v : nums) {\n        mn = Math.min(mn, v);\n        mx = Math.max(mx, v);\n    }\n    int best = -1;\n    for (int v : nums) {\n        if (v == mn || v == mx) continue;\n        if (best < 0 || v < best) best = v;\n    }\n    return best;\n}`,
        cpp: `int findNonMinOrMax(vector<int>& nums) {\n    if (nums.size() < 3) return -1;\n    int mn = *min_element(nums.begin(), nums.end());\n    int mx = *max_element(nums.begin(), nums.end());\n    int best = -1;\n    for (int v : nums) {\n        if (v == mn || v == mx) continue;\n        if (best < 0 || v < best) best = v;\n    }\n    return best;\n}`,
        c: `int findNonMinOrMax(int* nums, int numsSize) {\n    if (numsSize < 3) return -1;\n    int mn = nums[0], mx = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] < mn) mn = nums[i];\n        if (nums[i] > mx) mx = nums[i];\n    }\n    int best = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] == mn || nums[i] == mx) continue;\n        if (best < 0 || nums[i] < best) best = nums[i];\n    }\n    return best;\n}`,
        csharp: `public static int FindNonMinOrMax(int[] nums)\n{\n    if (nums.Length < 3) return -1;\n    int mn = nums[0], mx = nums[0];\n    foreach (var v in nums)\n    {\n        mn = Math.Min(mn, v);\n        mx = Math.Max(mx, v);\n    }\n    int best = -1;\n    foreach (var v in nums)\n    {\n        if (v == mn || v == mx) continue;\n        if (best < 0 || v < best) best = v;\n    }\n    return best;\n}`,
        go: `func findNonMinOrMax(nums []int) int {\n\tif len(nums) < 3 {\n\t\treturn -1\n\t}\n\tmn, mx := nums[0], nums[0]\n\tfor _, v := range nums {\n\t\tif v < mn {\n\t\t\tmn = v\n\t\t}\n\t\tif v > mx {\n\t\t\tmx = v\n\t\t}\n\t}\n\tbest := -1\n\tfor _, v := range nums {\n\t\tif v == mn || v == mx {\n\t\t\tcontinue\n\t\t}\n\t\tif best < 0 || v < best {\n\t\t\tbest = v\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findNonMinOrMax(nums: IntArray): Int {\n    if (nums.size < 3) return -1\n    var mn = nums[0]\n    var mx = nums[0]\n    for (v in nums) {\n        if (v < mn) mn = v\n        if (v > mx) mx = v\n    }\n    var best = -1\n    for (v in nums) {\n        if (v == mn || v == mx) continue\n        if (best < 0 || v < best) best = v\n    }\n    return best\n}`,
        swift: `func findNonMinOrMax(_ nums: [Int]) -> Int {\n    if nums.count < 3 { return -1 }\n    let mn = nums.min()!\n    let mx = nums.max()!\n    var best = -1\n    for v in nums {\n        if v == mn || v == mx { continue }\n        if best < 0 || v < best { best = v }\n    }\n    return best\n}`,
        rust: `fn findNonMinOrMax(nums: Vec<i32>) -> i32 {\n    if nums.len() < 3 {\n        return -1;\n    }\n    let mn = *nums.iter().min().unwrap();\n    let mx = *nums.iter().max().unwrap();\n    let mut best = -1i32;\n    for &v in nums.iter() {\n        if v == mn || v == mx {\n            continue;\n        }\n        if best < 0 || v < best {\n            best = v;\n        }\n    }\n    best\n}`,
        php: `function findNonMinOrMax($nums) {\n    if (count($nums) < 3) return -1;\n    $mn = min($nums);\n    $mx = max($nums);\n    $best = -1;\n    foreach ($nums as $v) {\n        if ($v === $mn || $v === $mx) continue;\n        if ($best < 0 || $v < $best) $best = $v;\n    }\n    return $best;\n}`,
        ruby: `def findNonMinOrMax(nums)\n  return -1 if nums.length < 3\n  mn = nums.min\n  mx = nums.max\n  rest = nums.reject { |v| v == mn || v == mx }\n  rest.empty? ? -1 : rest.min\nend`,
      },
    };
  })(),

  // ── Check if Array is Good (LC 2784) ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length - 1;
      if (n < 1) return false;
      const count = new Array(n + 1).fill(0);
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] < 1 || nums[i] > n) return false;
        count[nums[i]]++;
      }
      for (let v = 1; v < n; v++) if (count[v] !== 1) return false;
      return count[n] === 2;
    };
    return {
      slug: "check-if-array-is-good",
      title: "Check if Array is Good",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Amazon", "Google", "TCS"],
      signature: { funcName: "isGood", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "For an integer `n`, the array `base[n]` is `[1, 2, …, n - 1, n, n]` — the numbers `1` through `n` in order, with `n` appearing **twice**, so it has `n + 1` elements.\n\nReturn `true` if `nums` is a permutation of `base[n]` for some `n`.",
        [
          { in: "nums = [2,1,3]", out: "false", note: "Length 3 implies `n = 2`, so `base[2] = [1,2,2]`, which this is not." },
          { in: "nums = [1,3,3,2]", out: "true", note: "A permutation of `base[3] = [1,2,3,3]`." },
          { in: "nums = [1,1]", out: "true", note: "`base[1] = [1,1]`." },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 200"]),
      hints: [
        "The length fixes `n`: an array of `m` elements can only match `base[m - 1]`.",
        "Then every value from 1 to `n - 1` must appear once, and `n` twice.",
        "Any value outside `1 … n` disqualifies the array at once.",
      ],
      editorial: explain({
        idea: "The length determines `n = nums.length - 1`. Count the values and check the exact multiset: `1 … n - 1` once each and `n` twice.",
        steps: [
          "Set `n = nums.length - 1`; reject immediately if `n < 1`.",
          "Count occurrences, rejecting any value outside `1 … n`.",
          "Require `count[v] == 1` for `v` in `1 … n - 1` and `count[n] == 2`.",
        ],
        why: "Fixing `n` from the length first is what makes the check a single scan — without it there is no candidate to compare against. The range check inside the counting loop also keeps the count array in bounds, since values may be as large as 200 while `n` may be much smaller.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Values above `n` must be rejected, not silently ignored.",
          "`n = 1` is the special case `[1,1]`, where the \"once each\" range is empty.",
          "Sorting and comparing also works, but the counts are clearer.",
        ],
      }),
      examples: [
        { input: "[2,1,3]", expectedOutput: "false" },
        { input: "[1,3,3,2]", expectedOutput: "true" },
        { input: "[1,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        // Half the cases are genuine base[n] permutations, then sometimes
        // perturbed, so both answers appear.
        let nums: number[];
        if (rng() < 0.5) {
          const n = ri(rng, 1, 8);
          nums = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1).concat([n]));
          if (rng() < 0.4) nums[ri(rng, 0, nums.length - 1)] = ri(rng, 1, 10);
        } else {
          nums = Array.from({ length: ri(rng, 1, 8) }, () => ri(rng, 1, 8));
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef isGood(nums: List[int]) -> bool:\n    n = len(nums) - 1\n    if n < 1:\n        return False\n    count = Counter(nums)\n    if any(v < 1 or v > n for v in nums):\n        return False\n    for v in range(1, n):\n        if count[v] != 1:\n            return False\n    return count[n] == 2`,
        javascript: `var isGood = function(nums) {\n    var n = nums.length - 1, i;\n    if (n < 1) return false;\n    var count = [];\n    for (i = 0; i <= n; i++) count.push(0);\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] < 1 || nums[i] > n) return false;\n        count[nums[i]]++;\n    }\n    for (var v = 1; v < n; v++) if (count[v] !== 1) return false;\n    return count[n] === 2;\n};`,
        typescript: `function isGood(nums: number[]): boolean {\n    var n = nums.length - 1, i: number;\n    if (n < 1) return false;\n    var count: number[] = [];\n    for (i = 0; i <= n; i++) count.push(0);\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] < 1 || nums[i] > n) return false;\n        count[nums[i]]++;\n    }\n    for (var v = 1; v < n; v++) if (count[v] !== 1) return false;\n    return count[n] === 2;\n}`,
        java: `public static boolean isGood(int[] nums) {\n    int n = nums.length - 1;\n    if (n < 1) return false;\n    int[] count = new int[n + 1];\n    for (int v : nums) {\n        if (v < 1 || v > n) return false;\n        count[v]++;\n    }\n    for (int v = 1; v < n; v++) if (count[v] != 1) return false;\n    return count[n] == 2;\n}`,
        cpp: `bool isGood(vector<int>& nums) {\n    int n = (int) nums.size() - 1;\n    if (n < 1) return false;\n    vector<int> count(n + 1, 0);\n    for (int v : nums) {\n        if (v < 1 || v > n) return false;\n        count[v]++;\n    }\n    for (int v = 1; v < n; v++) if (count[v] != 1) return false;\n    return count[n] == 2;\n}`,
        c: `bool isGood(int* nums, int numsSize) {\n    int n = numsSize - 1;\n    if (n < 1) return false;\n    int* count = (int*) calloc((size_t) (n + 1), sizeof(int));\n    bool ok = true;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] < 1 || nums[i] > n) { ok = false; break; }\n        count[nums[i]]++;\n    }\n    if (ok) {\n        for (int v = 1; v < n; v++) {\n            if (count[v] != 1) { ok = false; break; }\n        }\n        if (ok) ok = count[n] == 2;\n    }\n    free(count);\n    return ok;\n}`,
        csharp: `public static bool IsGood(int[] nums)\n{\n    int n = nums.Length - 1;\n    if (n < 1) return false;\n    var count = new int[n + 1];\n    foreach (var v in nums)\n    {\n        if (v < 1 || v > n) return false;\n        count[v]++;\n    }\n    for (int v = 1; v < n; v++) if (count[v] != 1) return false;\n    return count[n] == 2;\n}`,
        go: `func isGood(nums []int) bool {\n\tn := len(nums) - 1\n\tif n < 1 {\n\t\treturn false\n\t}\n\tcount := make([]int, n+1)\n\tfor _, v := range nums {\n\t\tif v < 1 || v > n {\n\t\t\treturn false\n\t\t}\n\t\tcount[v]++\n\t}\n\tfor v := 1; v < n; v++ {\n\t\tif count[v] != 1 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn count[n] == 2\n}`,
        kotlin: `fun isGood(nums: IntArray): Boolean {\n    val n = nums.size - 1\n    if (n < 1) return false\n    val count = IntArray(n + 1)\n    for (v in nums) {\n        if (v < 1 || v > n) return false\n        count[v]++\n    }\n    for (v in 1 until n) if (count[v] != 1) return false\n    return count[n] == 2\n}`,
        swift: `func isGood(_ nums: [Int]) -> Bool {\n    let n = nums.count - 1\n    if n < 1 { return false }\n    var count = [Int](repeating: 0, count: n + 1)\n    for v in nums {\n        if v < 1 || v > n { return false }\n        count[v] += 1\n    }\n    for v in 1..<max(1, n) where v < n && count[v] != 1 { return false }\n    return count[n] == 2\n}`,
        rust: `fn isGood(nums: Vec<i32>) -> bool {\n    let n = nums.len() as i32 - 1;\n    if n < 1 {\n        return false;\n    }\n    let mut count = vec![0i32; (n + 1) as usize];\n    for &v in nums.iter() {\n        if v < 1 || v > n {\n            return false;\n        }\n        count[v as usize] += 1;\n    }\n    for v in 1..n {\n        if count[v as usize] != 1 {\n            return false;\n        }\n    }\n    count[n as usize] == 2\n}`,
        php: `function isGood($nums) {\n    $n = count($nums) - 1;\n    if ($n < 1) return false;\n    $count = array_fill(0, $n + 1, 0);\n    foreach ($nums as $v) {\n        if ($v < 1 || $v > $n) return false;\n        $count[$v]++;\n    }\n    for ($v = 1; $v < $n; $v++) if ($count[$v] !== 1) return false;\n    return $count[$n] === 2;\n}`,
        ruby: `def isGood(nums)\n  n = nums.length - 1\n  return false if n < 1\n  count = Array.new(n + 1, 0)\n  nums.each do |v|\n    return false if v < 1 || v > n\n    count[v] += 1\n  end\n  (1...n).each { |v| return false if count[v] != 1 }\n  count[n] == 2\nend`,
      },
    };
  })(),

  // ── Number of Beautiful Pairs (LC 2748) ─────────────────────────
  (() => {
    const gcd = (a: number, b: number): number => {
      while (b !== 0) {
        const t = a % b;
        a = b;
        b = t;
      }
      return a;
    };
    const ref = (nums: number[]) => {
      const n = nums.length;
      let count = 0;
      for (let i = 0; i < n; i++) {
        let first = nums[i];
        while (first >= 10) first = Math.floor(first / 10);
        for (let j = i + 1; j < n; j++) {
          if (gcd(first, nums[j] % 10) === 1) count++;
        }
      }
      return count;
    };
    return {
      slug: "number-of-beautiful-pairs",
      title: "Number of Beautiful Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Number Theory", "Amazon", "Google", "Infosys"],
      signature: { funcName: "countBeautifulPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A pair of indices `i < j` is **beautiful** when the **first digit** of `nums[i]` and the **last digit** of `nums[j]` are coprime — that is, their greatest common divisor is 1.\n\nReturn the number of beautiful pairs.",
        [
          { in: "nums = [2,5,1,4]", out: "5", note: "Every pair but `(0, 3)`, where `gcd(2, 4) = 2`." },
          { in: "nums = [11,21,12]", out: "2", note: "`gcd(2, 2) = 2` rules out the pair `(1, 2)`." },
          { in: "nums = [7]", out: "0", note: "A single element forms no pair." },
        ],
        ["2 <= nums.length <= 100", "1 <= nums[i] <= 9999", "nums[i] % 10 != 0"]),
      hints: [
        "The first digit comes from dividing by 10 until the number is below 10.",
        "The last digit is just `% 10`.",
        "Both digits are in `1 … 9`, so the gcd is cheap; a 9 × 9 table also works.",
      ],
      editorial: explain({
        idea: "Extract each number's first and last digit, then count the ordered pairs whose digits are coprime.",
        steps: [
          "For index `i`, strip `nums[i]` down to its leading digit by repeated division by 10.",
          "For each `j > i`, take `nums[j] % 10`.",
          "Count the pair when `gcd` of the two digits is 1.",
        ],
        why: "Both digits live in `1 … 9` — the constraint `nums[i] % 10 != 0` is what keeps the last digit non-zero — so there are only 81 distinct digit pairs. That means counting digits and combining them gives an `O(n + 81)` solution; the quadratic scan here is simply enough at `n <= 100`.",
        time: "O(n² · log) as written, or O(n + 81) by counting digits",
        space: "O(1)",
        pitfalls: [
          "The first digit is the leading one, not `nums[i] % 10`.",
          "Pairs are ordered by index: `(i, j)` with `i < j`, counted once.",
          "`gcd(1, x)` is 1, so a leading or trailing 1 always pairs.",
        ],
      }),
      examples: [
        { input: "[2,5,1,4]", expectedOutput: "5" },
        { input: "[11,21,12]", expectedOutput: "2" },
        { input: "[7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const nums = Array.from({ length: n }, () => {
          // The statement rules out a trailing zero.
          let v = ri(rng, 1, 9999);
          while (v % 10 === 0) v = ri(rng, 1, 9999);
          return v;
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\nfrom math import gcd\n\ndef countBeautifulPairs(nums: List[int]) -> int:\n    n = len(nums)\n    count = 0\n    for i in range(n):\n        first = nums[i]\n        while first >= 10:\n            first //= 10\n        for j in range(i + 1, n):\n            if gcd(first, nums[j] % 10) == 1:\n                count += 1\n    return count`,
        javascript: `var countBeautifulPairs = function(nums) {\n    var gcd = function(a, b) {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var n = nums.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        var first = nums[i];\n        while (first >= 10) first = Math.floor(first / 10);\n        for (var j = i + 1; j < n; j++) {\n            if (gcd(first, nums[j] % 10) === 1) count++;\n        }\n    }\n    return count;\n};`,
        typescript: `function countBeautifulPairs(nums: number[]): number {\n    var gcd = function(a: number, b: number): number {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var n = nums.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        var first = nums[i];\n        while (first >= 10) first = Math.floor(first / 10);\n        for (var j = i + 1; j < n; j++) {\n            if (gcd(first, nums[j] % 10) === 1) count++;\n        }\n    }\n    return count;\n}`,
        java: `private static int bpGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\npublic static int countBeautifulPairs(int[] nums) {\n    int n = nums.length, count = 0;\n    for (int i = 0; i < n; i++) {\n        int first = nums[i];\n        while (first >= 10) first /= 10;\n        for (int j = i + 1; j < n; j++) {\n            if (bpGcd(first, nums[j] % 10) == 1) count++;\n        }\n    }\n    return count;\n}`,
        cpp: `static int bpGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\nint countBeautifulPairs(vector<int>& nums) {\n    int n = (int) nums.size(), count = 0;\n    for (int i = 0; i < n; i++) {\n        int first = nums[i];\n        while (first >= 10) first /= 10;\n        for (int j = i + 1; j < n; j++) {\n            if (bpGcd(first, nums[j] % 10) == 1) count++;\n        }\n    }\n    return count;\n}`,
        c: `static int bpGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\nint countBeautifulPairs(int* nums, int numsSize) {\n    int count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int first = nums[i];\n        while (first >= 10) first /= 10;\n        for (int j = i + 1; j < numsSize; j++) {\n            if (bpGcd(first, nums[j] % 10) == 1) count++;\n        }\n    }\n    return count;\n}`,
        csharp: `private static int BpGcd(int a, int b)\n{\n    while (b != 0)\n    {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\npublic static int CountBeautifulPairs(int[] nums)\n{\n    int n = nums.Length, count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int first = nums[i];\n        while (first >= 10) first /= 10;\n        for (int j = i + 1; j < n; j++)\n        {\n            if (BpGcd(first, nums[j] % 10) == 1) count++;\n        }\n    }\n    return count;\n}`,
        go: `func countBeautifulPairs(nums []int) int {\n\tgcd := func(a, b int) int {\n\t\tfor b != 0 {\n\t\t\ta, b = b, a%b\n\t\t}\n\t\treturn a\n\t}\n\tn := len(nums)\n\tcount := 0\n\tfor i := 0; i < n; i++ {\n\t\tfirst := nums[i]\n\t\tfor first >= 10 {\n\t\t\tfirst /= 10\n\t\t}\n\t\tfor j := i + 1; j < n; j++ {\n\t\t\tif gcd(first, nums[j]%10) == 1 {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countBeautifulPairs(nums: IntArray): Int {\n    fun gcd(x: Int, y: Int): Int {\n        var a = x\n        var b = y\n        while (b != 0) {\n            val t = a % b\n            a = b\n            b = t\n        }\n        return a\n    }\n    val n = nums.size\n    var count = 0\n    for (i in 0 until n) {\n        var first = nums[i]\n        while (first >= 10) first /= 10\n        for (j in i + 1 until n) {\n            if (gcd(first, nums[j] % 10) == 1) count++\n        }\n    }\n    return count\n}`,
        swift: `func countBeautifulPairs(_ nums: [Int]) -> Int {\n    func gcd(_ x: Int, _ y: Int) -> Int {\n        var a = x, b = y\n        while b != 0 {\n            let t = a % b\n            a = b\n            b = t\n        }\n        return a\n    }\n    let n = nums.count\n    var count = 0\n    for i in 0..<n {\n        var first = nums[i]\n        while first >= 10 { first /= 10 }\n        for j in (i + 1)..<max(i + 1, n) where j < n {\n            if gcd(first, nums[j] % 10) == 1 { count += 1 }\n        }\n    }\n    return count\n}`,
        rust: `fn countBeautifulPairs(nums: Vec<i32>) -> i32 {\n    fn gcd(mut a: i32, mut b: i32) -> i32 {\n        while b != 0 {\n            let t = a % b;\n            a = b;\n            b = t;\n        }\n        a\n    }\n    let n = nums.len();\n    let mut count = 0i32;\n    for i in 0..n {\n        let mut first = nums[i];\n        while first >= 10 {\n            first /= 10;\n        }\n        for j in (i + 1)..n {\n            if gcd(first, nums[j] % 10) == 1 {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
        php: `function countBeautifulPairs($nums) {\n    $gcd = function($a, $b) {\n        while ($b !== 0) {\n            $t = $a % $b;\n            $a = $b;\n            $b = $t;\n        }\n        return $a;\n    };\n    $n = count($nums);\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $first = $nums[$i];\n        while ($first >= 10) $first = intdiv($first, 10);\n        for ($j = $i + 1; $j < $n; $j++) {\n            if ($gcd($first, $nums[$j] % 10) === 1) $count++;\n        }\n    }\n    return $count;\n}`,
        ruby: `def countBeautifulPairs(nums)\n  n = nums.length\n  count = 0\n  (0...n).each do |i|\n    first = nums[i]\n    first /= 10 while first >= 10\n    ((i + 1)...n).each do |j|\n      count += 1 if first.gcd(nums[j] % 10) == 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Apple Redistribution into Boxes (LC 3074) ───────────────────
  (() => {
    const ref = (apple: number[], capacity: number[]) => {
      let total = 0;
      for (let i = 0; i < apple.length; i++) total += apple[i];
      const sorted = capacity.slice().sort((a, b) => b - a);
      let used = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (total <= 0) break;
        total -= sorted[i];
        used++;
      }
      return used;
    };
    return {
      slug: "apple-redistribution-into-boxes",
      title: "Apple Redistribution into Boxes",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "minimumBoxes", params: [{ name: "apple", type: "int[]" as const }, { name: "capacity", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`apple[i]` apples are packed in the `i`-th pack, and `capacity[j]` is how many apples box `j` holds. A pack's apples may be **split across boxes**.\n\nReturn the minimum number of boxes needed to hold every apple. The input always allows a solution.",
        [
          { in: "apple = [1,3,2], capacity = [4,3,1,5,2]", out: "2", note: "Six apples fit in the boxes of size 5 and 4." },
          { in: "apple = [5,5,5], capacity = [2,4,2,7]", out: "4", note: "Fifteen apples need every box." },
          { in: "apple = [1], capacity = [10]", out: "1" },
        ],
        ["1 <= apple.length <= 50", "1 <= capacity.length <= 50", "1 <= apple[i], capacity[i] <= 50", "The input is generated so that it is possible to redistribute the apples."]),
      hints: [
        "Because packs can be split, only the **total** number of apples matters.",
        "To use as few boxes as possible, fill the largest ones first.",
        "Sort the capacities descending and take them until the total is covered.",
      ],
      editorial: explain({
        idea: "Splitting packs means only the total count matters, so sort the capacities largest-first and take boxes until their combined capacity reaches the total.",
        steps: [
          "Sum the apples.",
          "Sort `capacity` descending.",
          "Take boxes in that order, subtracting each capacity, until the remaining total is non-positive.",
          "Return how many boxes were taken.",
        ],
        why: "Splitting is what collapses this to a single number: without it, packs would have to be assigned whole and the problem would become bin packing. With it, any set of boxes whose capacities sum to at least the total works, so the greedy largest-first choice is optimal.",
        time: "O(m log m)",
        space: "O(m)",
        pitfalls: [
          "Sorting ascending uses more boxes than necessary.",
          "The individual pack sizes never matter, only the total.",
          "The loop must stop as soon as the total is covered.",
        ],
      }),
      examples: [
        { input: "[1,3,2]\n[4,3,1,5,2]", expectedOutput: "2" },
        { input: "[5,5,5]\n[2,4,2,7]", expectedOutput: "4" },
        { input: "[1]\n[10]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const apple = Array.from({ length: ri(rng, 1, 6) }, () => ri(rng, 1, 20));
        let total = 0;
        for (let i = 0; i < apple.length; i++) total += apple[i];
        // Keep adding boxes until they can hold everything, as the statement promises.
        const capacity: number[] = [];
        let have = 0;
        while (have < total) {
          const c = ri(rng, 1, 20);
          capacity.push(c);
          have += c;
        }
        for (let k = 0; k < ri(rng, 0, 3); k++) capacity.push(ri(rng, 1, 20));
        return { input: `${fmtIntArr(apple)}\n${fmtIntArr(shuffle(rng, capacity))}`, expectedOutput: String(ref(apple, capacity)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumBoxes(apple: List[int], capacity: List[int]) -> int:\n    total = sum(apple)\n    used = 0\n    for c in sorted(capacity, reverse=True):\n        if total <= 0:\n            break\n        total -= c\n        used += 1\n    return used`,
        javascript: `var minimumBoxes = function(apple, capacity) {\n    var total = 0, i;\n    for (i = 0; i < apple.length; i++) total += apple[i];\n    var sorted = capacity.slice();\n    sorted.sort(function(a, b) { return b - a; });\n    var used = 0;\n    for (i = 0; i < sorted.length; i++) {\n        if (total <= 0) break;\n        total -= sorted[i];\n        used++;\n    }\n    return used;\n};`,
        typescript: `function minimumBoxes(apple: number[], capacity: number[]): number {\n    var total = 0, i: number;\n    for (i = 0; i < apple.length; i++) total += apple[i];\n    var sorted = capacity.slice();\n    sorted.sort(function(a: number, b: number) { return b - a; });\n    var used = 0;\n    for (i = 0; i < sorted.length; i++) {\n        if (total <= 0) break;\n        total -= sorted[i];\n        used++;\n    }\n    return used;\n}`,
        java: `public static int minimumBoxes(int[] apple, int[] capacity) {\n    int total = 0;\n    for (int v : apple) total += v;\n    Integer[] sorted = new Integer[capacity.length];\n    for (int i = 0; i < capacity.length; i++) sorted[i] = capacity[i];\n    Arrays.sort(sorted, Comparator.reverseOrder());\n    int used = 0;\n    for (int c : sorted) {\n        if (total <= 0) break;\n        total -= c;\n        used++;\n    }\n    return used;\n}`,
        cpp: `int minimumBoxes(vector<int>& apple, vector<int>& capacity) {\n    int total = 0;\n    for (int v : apple) total += v;\n    vector<int> sorted = capacity;\n    sort(sorted.begin(), sorted.end(), greater<int>());\n    int used = 0;\n    for (int c : sorted) {\n        if (total <= 0) break;\n        total -= c;\n        used++;\n    }\n    return used;\n}`,
        c: `static int mbDesc(const void* a, const void* b) {\n    return *(const int*) b - *(const int*) a;\n}\n\nint minimumBoxes(int* apple, int appleSize, int* capacity, int capacitySize) {\n    int total = 0;\n    for (int i = 0; i < appleSize; i++) total += apple[i];\n    int* sorted = (int*) malloc((size_t) capacitySize * sizeof(int));\n    for (int i = 0; i < capacitySize; i++) sorted[i] = capacity[i];\n    qsort(sorted, (size_t) capacitySize, sizeof(int), mbDesc);\n    int used = 0;\n    for (int i = 0; i < capacitySize; i++) {\n        if (total <= 0) break;\n        total -= sorted[i];\n        used++;\n    }\n    free(sorted);\n    return used;\n}`,
        csharp: `public static int MinimumBoxes(int[] apple, int[] capacity)\n{\n    int total = 0;\n    foreach (var v in apple) total += v;\n    var sorted = (int[]) capacity.Clone();\n    Array.Sort(sorted);\n    Array.Reverse(sorted);\n    int used = 0;\n    foreach (var c in sorted)\n    {\n        if (total <= 0) break;\n        total -= c;\n        used++;\n    }\n    return used;\n}`,
        go: `func minimumBoxes(apple []int, capacity []int) int {\n\ttotal := 0\n\tfor _, v := range apple {\n\t\ttotal += v\n\t}\n\tsorted := make([]int, len(capacity))\n\tcopy(sorted, capacity)\n\tsort.Sort(sort.Reverse(sort.IntSlice(sorted)))\n\tused := 0\n\tfor _, c := range sorted {\n\t\tif total <= 0 {\n\t\t\tbreak\n\t\t}\n\t\ttotal -= c\n\t\tused++\n\t}\n\treturn used\n}`,
        kotlin: `fun minimumBoxes(apple: IntArray, capacity: IntArray): Int {\n    var total = apple.sum()\n    var used = 0\n    for (c in capacity.sortedDescending()) {\n        if (total <= 0) break\n        total -= c\n        used++\n    }\n    return used\n}`,
        swift: `func minimumBoxes(_ apple: [Int], _ capacity: [Int]) -> Int {\n    var total = apple.reduce(0, +)\n    var used = 0\n    for c in capacity.sorted(by: >) {\n        if total <= 0 { break }\n        total -= c\n        used += 1\n    }\n    return used\n}`,
        rust: `fn minimumBoxes(apple: Vec<i32>, capacity: Vec<i32>) -> i32 {\n    let mut total: i32 = apple.iter().sum();\n    let mut sorted = capacity.clone();\n    sorted.sort_unstable_by(|a, b| b.cmp(a));\n    let mut used = 0i32;\n    for &c in sorted.iter() {\n        if total <= 0 {\n            break;\n        }\n        total -= c;\n        used += 1;\n    }\n    used\n}`,
        php: `function minimumBoxes($apple, $capacity) {\n    $total = array_sum($apple);\n    $sorted = $capacity;\n    rsort($sorted);\n    $used = 0;\n    foreach ($sorted as $c) {\n        if ($total <= 0) break;\n        $total -= $c;\n        $used++;\n    }\n    return $used;\n}`,
        ruby: `def minimumBoxes(apple, capacity)\n  total = apple.sum\n  used = 0\n  capacity.sort.reverse.each do |c|\n    break if total <= 0\n    total -= c\n    used += 1\n  end\n  used\nend`,
      },
    };
  })(),

  // ── Find the Value of the Partition (LC 2740) ───────────────────
  (() => {
    const ref = (nums: number[]) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      let best = sorted[1] - sorted[0];
      for (let i = 2; i < sorted.length; i++) {
        const d = sorted[i] - sorted[i - 1];
        if (d < best) best = d;
      }
      return best;
    };
    return {
      slug: "find-the-value-of-the-partition",
      title: "Find the Value of the Partition",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findValueOfPartition", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Split `nums` into two **non-empty** arrays `nums1` and `nums2`, using every element exactly once. The **value** of a partition is `|max(nums1) - min(nums2)|`.\n\nReturn the minimum value over all partitions.",
        [
          { in: "nums = [1,3,2,4]", out: "1", note: "`nums1 = [1,2]` and `nums2 = [3,4]` give `|2 - 3| = 1`." },
          { in: "nums = [100,1,10]", out: "9", note: "`nums1 = [10]` and `nums2 = [100,1]`… the closest pair is 1 and 10." },
          { in: "nums = [5,5]", out: "0" },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9"]),
      hints: [
        "The value only depends on two elements: one maximum and one minimum.",
        "Sort, and the best pair must be adjacent in the sorted order.",
        "So the answer is the smallest gap between neighbours.",
      ],
      editorial: explain({
        idea: "Sort the array; the answer is the smallest difference between adjacent elements.",
        steps: [
          "Sort `nums`.",
          "Scan the adjacent differences and return the smallest.",
        ],
        why: "For any two values `a <= b`, the partition putting everything up to `a` in `nums1` and the rest in `nums2` achieves `b - a` — so every adjacent pair is reachable. And any partition's value is a difference between two elements, which is never smaller than the closest adjacent gap. Hence the minimum gap is both attainable and a lower bound.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Non-adjacent pairs can never beat the closest adjacent gap.",
          "Both parts must be non-empty, which the adjacent split always satisfies.",
          "Duplicates give a gap of 0, which is the smallest possible answer.",
        ],
      }),
      examples: [
        { input: "[1,3,2,4]", expectedOutput: "1" },
        { input: "[100,1,10]", expectedOutput: "9" },
        { input: "[5,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 14);
        const nums = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [10, 100, 100000])));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findValueOfPartition(nums: List[int]) -> int:\n    s = sorted(nums)\n    return min(s[i] - s[i - 1] for i in range(1, len(s)))`,
        javascript: `var findValueOfPartition = function(nums) {\n    var sorted = nums.slice();\n    sorted.sort(function(a, b) { return a - b; });\n    var best = sorted[1] - sorted[0];\n    for (var i = 2; i < sorted.length; i++) {\n        var d = sorted[i] - sorted[i - 1];\n        if (d < best) best = d;\n    }\n    return best;\n};`,
        typescript: `function findValueOfPartition(nums: number[]): number {\n    var sorted = nums.slice();\n    sorted.sort(function(a: number, b: number) { return a - b; });\n    var best = sorted[1] - sorted[0];\n    for (var i = 2; i < sorted.length; i++) {\n        var d = sorted[i] - sorted[i - 1];\n        if (d < best) best = d;\n    }\n    return best;\n}`,
        java: `public static int findValueOfPartition(int[] nums) {\n    int[] sorted = nums.clone();\n    Arrays.sort(sorted);\n    int best = sorted[1] - sorted[0];\n    for (int i = 2; i < sorted.length; i++) {\n        best = Math.min(best, sorted[i] - sorted[i - 1]);\n    }\n    return best;\n}`,
        cpp: `int findValueOfPartition(vector<int>& nums) {\n    vector<int> sorted = nums;\n    sort(sorted.begin(), sorted.end());\n    int best = sorted[1] - sorted[0];\n    for (size_t i = 2; i < sorted.size(); i++) {\n        best = min(best, sorted[i] - sorted[i - 1]);\n    }\n    return best;\n}`,
        c: `static int fvCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint findValueOfPartition(int* nums, int numsSize) {\n    int* sorted = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) sorted[i] = nums[i];\n    qsort(sorted, (size_t) numsSize, sizeof(int), fvCmp);\n    int best = sorted[1] - sorted[0];\n    for (int i = 2; i < numsSize; i++) {\n        int d = sorted[i] - sorted[i - 1];\n        if (d < best) best = d;\n    }\n    free(sorted);\n    return best;\n}`,
        csharp: `public static int FindValueOfPartition(int[] nums)\n{\n    var sorted = (int[]) nums.Clone();\n    Array.Sort(sorted);\n    int best = sorted[1] - sorted[0];\n    for (int i = 2; i < sorted.Length; i++)\n    {\n        best = Math.Min(best, sorted[i] - sorted[i - 1]);\n    }\n    return best;\n}`,
        go: `func findValueOfPartition(nums []int) int {\n\tsorted := make([]int, len(nums))\n\tcopy(sorted, nums)\n\tsort.Ints(sorted)\n\tbest := sorted[1] - sorted[0]\n\tfor i := 2; i < len(sorted); i++ {\n\t\tif d := sorted[i] - sorted[i-1]; d < best {\n\t\t\tbest = d\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findValueOfPartition(nums: IntArray): Int {\n    val sorted = nums.sortedArray()\n    var best = sorted[1] - sorted[0]\n    for (i in 2 until sorted.size) {\n        val d = sorted[i] - sorted[i - 1]\n        if (d < best) best = d\n    }\n    return best\n}`,
        swift: `func findValueOfPartition(_ nums: [Int]) -> Int {\n    let sorted = nums.sorted()\n    var best = sorted[1] - sorted[0]\n    for i in 2..<max(2, sorted.count) where i < sorted.count {\n        let d = sorted[i] - sorted[i - 1]\n        if d < best { best = d }\n    }\n    return best\n}`,
        rust: `fn findValueOfPartition(nums: Vec<i32>) -> i32 {\n    let mut sorted = nums.clone();\n    sorted.sort_unstable();\n    let mut best = sorted[1] - sorted[0];\n    for i in 2..sorted.len() {\n        let d = sorted[i] - sorted[i - 1];\n        if d < best {\n            best = d;\n        }\n    }\n    best\n}`,
        php: `function findValueOfPartition($nums) {\n    $sorted = $nums;\n    sort($sorted);\n    $best = $sorted[1] - $sorted[0];\n    for ($i = 2; $i < count($sorted); $i++) {\n        $d = $sorted[$i] - $sorted[$i - 1];\n        if ($d < $best) $best = $d;\n    }\n    return $best;\n}`,
        ruby: `def findValueOfPartition(nums)\n  s = nums.sort\n  (1...s.length).map { |i| s[i] - s[i - 1] }.min\nend`,
      },
    };
  })(),

  // ── Determine the Minimum Sum of a k-avoiding Array (LC 2829) ───
  (() => {
    const ref = (n: number, k: number) => {
      const used = new Set<number>();
      let sum = 0, v = 1, taken = 0;
      while (taken < n) {
        if (!used.has(k - v)) {
          used.add(v);
          sum += v;
          taken++;
        }
        v++;
      }
      return sum;
    };
    return {
      slug: "determine-the-minimum-sum-of-a-k-avoiding-array",
      title: "Determine the Minimum Sum of a k-avoiding Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Amazon", "Google", "Oracle"],
      signature: { funcName: "minimumSum", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An array of **distinct positive integers** is **k-avoiding** if no two different elements sum to `k`.\n\nReturn the minimum possible sum of a k-avoiding array of length `n`.",
        [
          { in: "n = 5, k = 4", out: "18", note: "`[1,2,4,5,6]` — 3 is skipped because `1 + 3 = 4`." },
          { in: "n = 2, k = 6", out: "3", note: "`[1,2]` sums to 3 and avoids 6." },
          { in: "n = 1, k = 1", out: "1" },
        ],
        ["1 <= n, k <= 50"]),
      hints: [
        "Take the smallest numbers you can, in order.",
        "A number `v` is blocked only if `k - v` has already been taken.",
        "Once past `k`, nothing is ever blocked again.",
      ],
      editorial: explain({
        idea: "Greedily take `1, 2, 3, …`, skipping any `v` whose partner `k - v` is already in the array. Stop once `n` numbers have been taken.",
        steps: [
          "Keep a set of chosen numbers and walk `v` upward from 1.",
          "Take `v` when `k - v` is not already chosen.",
          "Stop after `n` numbers and return their sum.",
        ],
        why: "Taking the smallest available number is safe because the numbers it blocks are all larger than it, so no cheaper option is ever lost. The pattern this produces is `1 … ⌊(k-1)/2⌋` followed by `k, k+1, …` — every pair inside the first block sums to less than `k`, and every number from `k` upward has a partner that is zero or negative.",
        time: "O(n + k)",
        space: "O(n)",
        pitfalls: [
          "The two elements of a forbidden pair must be different, so `k` being even does not rule out `k/2` on its own.",
          "Numbers at or above `k` are never blocked.",
          "The array must hold exactly `n` distinct numbers.",
        ],
      }),
      examples: [
        { input: "5\n4", expectedOutput: "18" },
        { input: "2\n6", expectedOutput: "3" },
        { input: "1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const k = ri(rng, 1, 50);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def minimumSum(n: int, k: int) -> int:\n    used = set()\n    total = 0\n    v = 1\n    while len(used) < n:\n        if k - v not in used:\n            used.add(v)\n            total += v\n        v += 1\n    return total`,
        javascript: `var minimumSum = function(n, k) {\n    var used = {};\n    var sum = 0, v = 1, taken = 0;\n    while (taken < n) {\n        if (!used["" + (k - v)]) {\n            used["" + v] = true;\n            sum += v;\n            taken++;\n        }\n        v++;\n    }\n    return sum;\n};`,
        typescript: `function minimumSum(n: number, k: number): number {\n    var used: { [key: string]: boolean } = {};\n    var sum = 0, v = 1, taken = 0;\n    while (taken < n) {\n        if (!used["" + (k - v)]) {\n            used["" + v] = true;\n            sum += v;\n            taken++;\n        }\n        v++;\n    }\n    return sum;\n}`,
        java: `public static int minimumSum(int n, int k) {\n    Set<Integer> used = new HashSet<>();\n    int sum = 0, v = 1;\n    while (used.size() < n) {\n        if (!used.contains(k - v)) {\n            used.add(v);\n            sum += v;\n        }\n        v++;\n    }\n    return sum;\n}`,
        cpp: `int minimumSum(int n, int k) {\n    unordered_set<int> used;\n    int sum = 0, v = 1;\n    while ((int) used.size() < n) {\n        if (used.find(k - v) == used.end()) {\n            used.insert(v);\n            sum += v;\n        }\n        v++;\n    }\n    return sum;\n}`,
        c: `int minimumSum(int n, int k) {\n    /* n and k are at most 50, so the chosen values never exceed about 150. */\n    char used[256] = { 0 };\n    int sum = 0, v = 1, taken = 0;\n    while (taken < n) {\n        int partner = k - v;\n        if (partner < 0 || partner > 255 || !used[partner]) {\n            used[v] = 1;\n            sum += v;\n            taken++;\n        }\n        v++;\n    }\n    return sum;\n}`,
        csharp: `public static int MinimumSum(int n, int k)\n{\n    var used = new HashSet<int>();\n    int sum = 0, v = 1;\n    while (used.Count < n)\n    {\n        if (!used.Contains(k - v))\n        {\n            used.Add(v);\n            sum += v;\n        }\n        v++;\n    }\n    return sum;\n}`,
        go: `func minimumSum(n int, k int) int {\n\tused := map[int]bool{}\n\tsum, v := 0, 1\n\tfor len(used) < n {\n\t\tif !used[k-v] {\n\t\t\tused[v] = true\n\t\t\tsum += v\n\t\t}\n\t\tv++\n\t}\n\treturn sum\n}`,
        kotlin: `fun minimumSum(n: Int, k: Int): Int {\n    val used = HashSet<Int>()\n    var sum = 0\n    var v = 1\n    while (used.size < n) {\n        if (!used.contains(k - v)) {\n            used.add(v)\n            sum += v\n        }\n        v++\n    }\n    return sum\n}`,
        swift: `func minimumSum(_ n: Int, _ k: Int) -> Int {\n    var used = Set<Int>()\n    var sum = 0\n    var v = 1\n    while used.count < n {\n        if !used.contains(k - v) {\n            used.insert(v)\n            sum += v\n        }\n        v += 1\n    }\n    return sum\n}`,
        rust: `use std::collections::HashSet;\n\nfn minimumSum(n: i32, k: i32) -> i32 {\n    let mut used: HashSet<i32> = HashSet::new();\n    let mut sum = 0i32;\n    let mut v = 1i32;\n    while (used.len() as i32) < n {\n        if !used.contains(&(k - v)) {\n            used.insert(v);\n            sum += v;\n        }\n        v += 1;\n    }\n    sum\n}`,
        php: `function minimumSum($n, $k) {\n    $used = [];\n    $sum = 0;\n    $v = 1;\n    while (count($used) < $n) {\n        if (!isset($used[$k - $v])) {\n            $used[$v] = true;\n            $sum += $v;\n        }\n        $v++;\n    }\n    return $sum;\n}`,
        ruby: `def minimumSum(n, k)\n  used = {}\n  sum = 0\n  v = 1\n  while used.size < n\n    unless used[k - v]\n      used[v] = true\n      sum += v\n    end\n    v += 1\n  end\n  sum\nend`,
      },
    };
  })(),

  // ── Find the XOR of Numbers Which Appear Twice (LC 2997) ────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) count.set(nums[i], (count.get(nums[i]) || 0) + 1);
      let out = 0;
      count.forEach((c, v) => {
        if (c === 2) out ^= v;
      });
      return out;
    };
    return {
      slug: "find-the-xor-of-numbers-which-appear-twice",
      title: "Find the XOR of Numbers Which Appear Twice",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Amazon", "Google", "Mindtree"],
      signature: { funcName: "duplicateNumbersXOR", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Each number in `nums` appears either **once or twice**.\n\nReturn the bitwise XOR of all the numbers that appear twice, or `0` if none does.",
        [
          { in: "nums = [1,2,1,3]", out: "1", note: "Only 1 appears twice." },
          { in: "nums = [1,2,3]", out: "0", note: "Nothing repeats." },
          { in: "nums = [1,2,2,1]", out: "3", note: "`1 XOR 2 = 3`." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50", "Each number in nums appears either once or twice."]),
      hints: [
        "Count how often each value appears.",
        "XOR together the values whose count is exactly 2.",
        "The empty XOR is 0, which is already the required fallback.",
      ],
      editorial: explain({
        idea: "Count the occurrences, then XOR the values that occur twice.",
        steps: [
          "Tally each value.",
          "XOR every value whose tally is 2 into a running result, starting from 0.",
        ],
        why: "Starting the accumulator at 0 gives the \"no duplicates\" case for free, since XOR's identity is 0. A one-pass variant also works: keep a `seen` set and XOR a value in the moment it is met for the second time — the values appear at most twice, so no third sighting can undo it.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "XOR-ing every element cancels the duplicates instead of collecting them.",
          "Values appearing once must be excluded.",
          "The answer for no duplicates is 0, not -1.",
        ],
      }),
      examples: [
        { input: "[1,2,1,3]", expectedOutput: "1" },
        { input: "[1,2,3]", expectedOutput: "0" },
        { input: "[1,2,2,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        // Build from distinct values, doubling some of them, so no value ever
        // appears three times.
        const pool = shuffle(rng, Array.from({ length: 50 }, (_, i) => i + 1)).slice(0, ri(rng, 1, 10));
        const nums: number[] = [];
        for (let i = 0; i < pool.length; i++) {
          nums.push(pool[i]);
          if (rng() < 0.4) nums.push(pool[i]);
        }
        return { input: fmtIntArr(shuffle(rng, nums)), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import Counter\n\ndef duplicateNumbersXOR(nums: List[int]) -> int:\n    out = 0\n    for v, c in Counter(nums).items():\n        if c == 2:\n            out ^= v\n    return out`,
        javascript: `var duplicateNumbersXOR = function(nums) {\n    var count = new Map(), i;\n    for (i = 0; i < nums.length; i++) {\n        var cur = count.get(nums[i]);\n        count.set(nums[i], (cur === undefined ? 0 : cur) + 1);\n    }\n    var out = 0;\n    count.forEach(function(c, v) {\n        if (c === 2) out ^= v;\n    });\n    return out;\n};`,
        typescript: `function duplicateNumbersXOR(nums: number[]): number {\n    var count: { [k: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = "" + nums[i];\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    var out = 0;\n    for (var k in count) {\n        if (count[k] === 2) out ^= parseInt(k, 10);\n    }\n    return out;\n}`,
        java: `public static int duplicateNumbersXOR(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int v : nums) count.merge(v, 1, Integer::sum);\n    int out = 0;\n    for (Map.Entry<Integer, Integer> e : count.entrySet()) {\n        if (e.getValue() == 2) out ^= e.getKey();\n    }\n    return out;\n}`,
        cpp: `int duplicateNumbersXOR(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int v : nums) count[v]++;\n    int out = 0;\n    for (auto& e : count) {\n        if (e.second == 2) out ^= e.first;\n    }\n    return out;\n}`,
        c: `int duplicateNumbersXOR(int* nums, int numsSize) {\n    int count[51] = { 0 };\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int out = 0;\n    for (int v = 1; v <= 50; v++) {\n        if (count[v] == 2) out ^= v;\n    }\n    return out;\n}`,
        csharp: `public static int DuplicateNumbersXOR(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (var v in nums)\n    {\n        count.TryGetValue(v, out int cur);\n        count[v] = cur + 1;\n    }\n    int out_ = 0;\n    foreach (var e in count)\n    {\n        if (e.Value == 2) out_ ^= e.Key;\n    }\n    return out_;\n}`,
        go: `func duplicateNumbersXOR(nums []int) int {\n\tcount := map[int]int{}\n\tfor _, v := range nums {\n\t\tcount[v]++\n\t}\n\tout := 0\n\tfor v, c := range count {\n\t\tif c == 2 {\n\t\t\tout ^= v\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun duplicateNumbersXOR(nums: IntArray): Int {\n    val count = HashMap<Int, Int>()\n    for (v in nums) count[v] = (count[v] ?: 0) + 1\n    var out = 0\n    for ((v, c) in count) {\n        if (c == 2) out = out xor v\n    }\n    return out\n}`,
        swift: `func duplicateNumbersXOR(_ nums: [Int]) -> Int {\n    var count = [Int: Int]()\n    for v in nums { count[v, default: 0] += 1 }\n    var out = 0\n    for (v, c) in count where c == 2 { out ^= v }\n    return out\n}`,
        rust: `use std::collections::HashMap;\n\nfn duplicateNumbersXOR(nums: Vec<i32>) -> i32 {\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &v in nums.iter() {\n        *count.entry(v).or_insert(0) += 1;\n    }\n    let mut out = 0i32;\n    for (&v, &c) in count.iter() {\n        if c == 2 {\n            out ^= v;\n        }\n    }\n    out\n}`,
        php: `function duplicateNumbersXOR($nums) {\n    $count = [];\n    foreach ($nums as $v) $count[$v] = (isset($count[$v]) ? $count[$v] : 0) + 1;\n    $out = 0;\n    foreach ($count as $v => $c) {\n        if ($c === 2) $out ^= $v;\n    }\n    return $out;\n}`,
        ruby: `def duplicateNumbersXOR(nums)\n  count = Hash.new(0)\n  nums.each { |v| count[v] += 1 }\n  out = 0\n  count.each { |v, c| out ^= v if c == 2 }\n  out\nend`,
      },
    };
  })(),

  // ── Number of Bit Changes to Make Two Integers Equal (LC 3226) ──
  (() => {
    const ref = (n: number, k: number) => {
      if ((n & k) !== k) return -1;
      let diff = n ^ k;
      let count = 0;
      while (diff > 0) {
        count += diff & 1;
        diff = Math.floor(diff / 2);
      }
      return count;
    };
    return {
      slug: "number-of-bit-changes-to-make-two-integers-equal",
      title: "Number of Bit Changes to Make Two Integers Equal",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Google", "Zoho"],
      signature: { funcName: "minChanges", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You may change any **set** bit of `n` to `0`, as many times as you like, but you may never turn a `0` into a `1`.\n\nReturn the number of changes needed to make `n` equal to `k`, or `-1` if it cannot be done.",
        [
          { in: "n = 13, k = 4", out: "2", note: "`13 = 1101` and `4 = 0100`; clear two bits." },
          { in: "n = 21, k = 21", out: "0", note: "Already equal." },
          { in: "n = 14, k = 13", out: "-1", note: "`13` needs bit 0 set, which `14` does not have." },
        ],
        ["1 <= n, k <= 10^6"]),
      hints: [
        "You can only clear bits, never set them.",
        "So every bit of `k` must already be set in `n`.",
        "When it is, the answer counts the bits `n` has that `k` does not.",
      ],
      editorial: explain({
        idea: "Clearing bits can only remove them, so `k` must be a **submask** of `n` — `n & k == k`. The number of changes is then the population count of `n XOR k`.",
        steps: [
          "Return `-1` unless `n & k == k`.",
          "Count the set bits of `n XOR k` and return that.",
        ],
        why: "`n & k == k` is exactly the statement that every bit of `k` is present in `n`, which is the only way the restricted operation can reach `k`. Once that holds, `n XOR k` picks out precisely the bits that must be cleared — nothing else differs — so its population count is the answer.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Counting the differing bits without the submask check reports a number for impossible cases.",
          "`k > n` is not the right test; the bits matter, not the magnitude.",
          "Equal inputs answer 0, not 1.",
        ],
      }),
      examples: [
        { input: "13\n4", expectedOutput: "2" },
        { input: "21\n21", expectedOutput: "0" },
        { input: "14\n13", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000000);
        // Half the cases clear a few of n's own bits, so the reachable branch
        // is exercised as often as the -1 one.
        let k: number;
        if (rng() < 0.5) {
          k = n;
          for (let b = 0; b < 20; b++) {
            if (rng() < 0.3) k &= ~(1 << b);
          }
          if (k < 1) k = n;
        } else {
          k = ri(rng, 1, 1000000);
        }
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def minChanges(n: int, k: int) -> int:\n    if n & k != k:\n        return -1\n    return bin(n ^ k).count('1')`,
        javascript: `var minChanges = function(n, k) {\n    if ((n & k) !== k) return -1;\n    var diff = n ^ k;\n    var count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff = Math.floor(diff / 2);\n    }\n    return count;\n};`,
        typescript: `function minChanges(n: number, k: number): number {\n    if ((n & k) !== k) return -1;\n    var diff = n ^ k;\n    var count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff = Math.floor(diff / 2);\n    }\n    return count;\n}`,
        java: `public static int minChanges(int n, int k) {\n    if ((n & k) != k) return -1;\n    return Integer.bitCount(n ^ k);\n}`,
        cpp: `int minChanges(int n, int k) {\n    if ((n & k) != k) return -1;\n    return __builtin_popcount(n ^ k);\n}`,
        c: `int minChanges(int n, int k) {\n    if ((n & k) != k) return -1;\n    int diff = n ^ k;\n    int count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n}`,
        csharp: `public static int MinChanges(int n, int k)\n{\n    if ((n & k) != k) return -1;\n    int diff = n ^ k;\n    int count = 0;\n    while (diff > 0)\n    {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n}`,
        go: `func minChanges(n int, k int) int {\n\tif n&k != k {\n\t\treturn -1\n\t}\n\treturn bits.OnesCount(uint(n ^ k))\n}`,
        kotlin: `fun minChanges(n: Int, k: Int): Int {\n    if (n and k != k) return -1\n    return Integer.bitCount(n xor k)\n}`,
        swift: `func minChanges(_ n: Int, _ k: Int) -> Int {\n    if n & k != k { return -1 }\n    return (n ^ k).nonzeroBitCount\n}`,
        rust: `fn minChanges(n: i32, k: i32) -> i32 {\n    if n & k != k {\n        return -1;\n    }\n    (n ^ k).count_ones() as i32\n}`,
        php: `function minChanges($n, $k) {\n    if (($n & $k) !== $k) return -1;\n    $diff = $n ^ $k;\n    $count = 0;\n    while ($diff > 0) {\n        $count += $diff & 1;\n        $diff >>= 1;\n    }\n    return $count;\n}`,
        ruby: `def minChanges(n, k)\n  return -1 if (n & k) != k\n  (n ^ k).to_s(2).count('1')\nend`,
      },
    };
  })(),

  // ── Water Bottles II (LC 3100) ──────────────────────────────────
  (() => {
    const ref = (numBottles: number, numExchange: number) => {
      let drunk = numBottles;
      let empty = numBottles;
      let ex = numExchange;
      while (empty >= ex) {
        empty -= ex;
        ex++;
        drunk++;
        empty++;
      }
      return drunk;
    };
    return {
      slug: "water-bottles-ii",
      title: "Water Bottles II",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Simulation", "Amazon", "Google", "Zoho"],
      signature: { funcName: "maxBottlesDrunk", params: [{ name: "numBottles", type: "int" as const }, { name: "numExchange", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `numBottles` full water bottles. Drinking one turns it into an empty bottle.\n\nYou may hand over `numExchange` empty bottles for **one** full bottle — and each time you do, `numExchange` **increases by one**. Return the maximum number of bottles you can drink.",
        [
          { in: "numBottles = 13, numExchange = 6", out: "15", note: "Two exchanges are possible before the empties run short." },
          { in: "numBottles = 10, numExchange = 3", out: "13", note: "Three exchanges, at costs 3, 4 and 5." },
          { in: "numBottles = 1, numExchange = 2", out: "1", note: "Never enough empties to trade." },
        ],
        ["1 <= numBottles <= 100", "1 <= numExchange <= 100"]),
      hints: [
        "Drink everything first; every bottle drunk becomes an empty.",
        "Each exchange costs the current `numExchange` empties and returns one full bottle — which becomes one more empty after drinking.",
        "The cost rises every time, so the loop terminates quickly.",
      ],
      editorial: explain({
        idea: "Simulate. Drink the initial bottles, then keep exchanging while you have enough empties, remembering that the price rises by one after each trade and that the bottle you win becomes another empty.",
        steps: [
          "Start `drunk` and `empty` at `numBottles`.",
          "While `empty >= numExchange`: pay the empties, raise the price, drink the new bottle and add its empty back.",
          "Return `drunk`.",
        ],
        why: "The rising price is what bounds the loop: the total spend grows quadratically, so with at most 100 bottles only a handful of trades are ever possible. Forgetting to add the new empty back under-counts, since the bottle you drink is still a bottle afterwards.",
        time: "O(√numBottles)",
        space: "O(1)",
        pitfalls: [
          "The exchanged bottle becomes an empty once drunk and can fund a later trade.",
          "The price increases **after** each exchange, not before the first.",
          "A fixed price would be the original Water Bottles problem, which has a closed form.",
        ],
      }),
      examples: [
        { input: "13\n6", expectedOutput: "15" },
        { input: "10\n3", expectedOutput: "13" },
        { input: "1\n2", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const numBottles = ri(rng, 1, 100);
        const numExchange = ri(rng, 1, 100);
        return { input: `${numBottles}\n${numExchange}`, expectedOutput: String(ref(numBottles, numExchange)) };
      },
      solutions: {
        python: `def maxBottlesDrunk(numBottles: int, numExchange: int) -> int:\n    drunk = numBottles\n    empty = numBottles\n    ex = numExchange\n    while empty >= ex:\n        empty -= ex\n        ex += 1\n        drunk += 1\n        empty += 1\n    return drunk`,
        javascript: `var maxBottlesDrunk = function(numBottles, numExchange) {\n    var drunk = numBottles;\n    var empty = numBottles;\n    var ex = numExchange;\n    while (empty >= ex) {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n};`,
        typescript: `function maxBottlesDrunk(numBottles: number, numExchange: number): number {\n    var drunk = numBottles;\n    var empty = numBottles;\n    var ex = numExchange;\n    while (empty >= ex) {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n}`,
        java: `public static int maxBottlesDrunk(int numBottles, int numExchange) {\n    int drunk = numBottles;\n    int empty = numBottles;\n    int ex = numExchange;\n    while (empty >= ex) {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n}`,
        cpp: `int maxBottlesDrunk(int numBottles, int numExchange) {\n    int drunk = numBottles;\n    int empty = numBottles;\n    int ex = numExchange;\n    while (empty >= ex) {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n}`,
        c: `int maxBottlesDrunk(int numBottles, int numExchange) {\n    int drunk = numBottles;\n    int empty = numBottles;\n    int ex = numExchange;\n    while (empty >= ex) {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n}`,
        csharp: `public static int MaxBottlesDrunk(int numBottles, int numExchange)\n{\n    int drunk = numBottles;\n    int empty = numBottles;\n    int ex = numExchange;\n    while (empty >= ex)\n    {\n        empty -= ex;\n        ex++;\n        drunk++;\n        empty++;\n    }\n    return drunk;\n}`,
        go: `func maxBottlesDrunk(numBottles int, numExchange int) int {\n\tdrunk := numBottles\n\tempty := numBottles\n\tex := numExchange\n\tfor empty >= ex {\n\t\tempty -= ex\n\t\tex++\n\t\tdrunk++\n\t\tempty++\n\t}\n\treturn drunk\n}`,
        kotlin: `fun maxBottlesDrunk(numBottles: Int, numExchange: Int): Int {\n    var drunk = numBottles\n    var empty = numBottles\n    var ex = numExchange\n    while (empty >= ex) {\n        empty -= ex\n        ex++\n        drunk++\n        empty++\n    }\n    return drunk\n}`,
        swift: `func maxBottlesDrunk(_ numBottles: Int, _ numExchange: Int) -> Int {\n    var drunk = numBottles\n    var empty = numBottles\n    var ex = numExchange\n    while empty >= ex {\n        empty -= ex\n        ex += 1\n        drunk += 1\n        empty += 1\n    }\n    return drunk\n}`,
        rust: `fn maxBottlesDrunk(numBottles: i32, numExchange: i32) -> i32 {\n    let mut drunk = numBottles;\n    let mut empty = numBottles;\n    let mut ex = numExchange;\n    while empty >= ex {\n        empty -= ex;\n        ex += 1;\n        drunk += 1;\n        empty += 1;\n    }\n    drunk\n}`,
        php: `function maxBottlesDrunk($numBottles, $numExchange) {\n    $drunk = $numBottles;\n    $empty = $numBottles;\n    $ex = $numExchange;\n    while ($empty >= $ex) {\n        $empty -= $ex;\n        $ex++;\n        $drunk++;\n        $empty++;\n    }\n    return $drunk;\n}`,
        ruby: `def maxBottlesDrunk(numBottles, numExchange)\n  drunk = numBottles\n  empty = numBottles\n  ex = numExchange\n  while empty >= ex\n    empty -= ex\n    ex += 1\n    drunk += 1\n    empty += 1\n  end\n  drunk\nend`,
      },
    };
  })(),

  // ── Find the Power of K-Size Subarrays I (LC 3254) ──────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const out: number[] = [];
      for (let i = 0; i + k <= n; i++) {
        let ok = true;
        for (let j = i + 1; j < i + k; j++) {
          if (nums[j] !== nums[j - 1] + 1) { ok = false; break; }
        }
        out.push(ok ? nums[i + k - 1] : -1);
      }
      return out;
    };
    return {
      slug: "find-the-power-of-k-size-subarrays-i",
      title: "Find the Power of K-Size Subarrays I",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google", "TCS"],
      signature: { funcName: "resultsArray", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "The **power** of a subarray is its maximum element if the subarray is **sorted ascending and consecutive** — each element exactly one more than the previous — and `-1` otherwise.\n\nReturn the power of every contiguous subarray of length `k`, in order.",
        [
          { in: "nums = [1,2,3,4,3,2,5], k = 3", out: "[3,4,-1,-1,-1]", note: "Only `[1,2,3]` and `[2,3,4]` run consecutively." },
          { in: "nums = [2,2,2,2,2], k = 4", out: "[-1,-1]", note: "Equal values are not consecutive." },
          { in: "nums = [3,2,3,2,3,2], k = 2", out: "[-1,3,-1,3,-1]" },
        ],
        ["1 <= n == nums.length <= 500", "1 <= nums[i] <= 10^5", "1 <= k <= n"]),
      hints: [
        "A window qualifies only if every adjacent pair inside it differs by exactly 1, increasing.",
        "When it does, the maximum is simply the last element.",
        "A single-element window (`k == 1`) always qualifies.",
      ],
      editorial: explain({
        idea: "Check each window of length `k` for the \"each element one more than the last\" property; if it holds, the last element is the maximum.",
        steps: [
          "Slide a window of length `k` across the array.",
          "Verify `nums[j] == nums[j-1] + 1` for every interior position.",
          "Record `nums[i + k - 1]` when it holds, and `-1` otherwise.",
        ],
        why: "The consecutive-and-increasing condition makes the last element the maximum for free — no scan for a max is needed. Keeping a running count of consecutive steps turns this into one linear pass, but at `n <= 500` the direct check per window is already comfortable.",
        time: "O(n · k), or O(n) with a running count",
        space: "O(n) for the output",
        pitfalls: [
          "Equal neighbours fail the test; the step must be exactly +1.",
          "The output has `n - k + 1` entries, not `n`.",
          "With `k == 1` every window trivially qualifies.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,3,2,5]\n3", expectedOutput: "[3,4,-1,-1,-1]" },
        { input: "[2,2,2,2,2]\n4", expectedOutput: "[-1,-1]" },
        { input: "[3,2,3,2,3,2]\n2", expectedOutput: "[-1,3,-1,3,-1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        // Often build runs of consecutive values so the non-(-1) branch shows up.
        const nums: number[] = [];
        while (nums.length < n) {
          let v = ri(rng, 1, 30);
          const run = ri(rng, 1, 4);
          for (let t = 0; t < run && nums.length < n; t++) nums.push(v++);
        }
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef resultsArray(nums: List[int], k: int) -> List[int]:\n    n = len(nums)\n    out = []\n    for i in range(n - k + 1):\n        ok = all(nums[j] == nums[j - 1] + 1 for j in range(i + 1, i + k))\n        out.append(nums[i + k - 1] if ok else -1)\n    return out`,
        javascript: `var resultsArray = function(nums, k) {\n    var n = nums.length;\n    var out = [];\n    for (var i = 0; i + k <= n; i++) {\n        var ok = true;\n        for (var j = i + 1; j < i + k; j++) {\n            if (nums[j] !== nums[j - 1] + 1) { ok = false; break; }\n        }\n        out.push(ok ? nums[i + k - 1] : -1);\n    }\n    return out;\n};`,
        typescript: `function resultsArray(nums: number[], k: number): number[] {\n    var n = nums.length;\n    var out: number[] = [];\n    for (var i = 0; i + k <= n; i++) {\n        var ok = true;\n        for (var j = i + 1; j < i + k; j++) {\n            if (nums[j] !== nums[j - 1] + 1) { ok = false; break; }\n        }\n        out.push(ok ? nums[i + k - 1] : -1);\n    }\n    return out;\n}`,
        java: `public static int[] resultsArray(int[] nums, int k) {\n    int n = nums.length;\n    int[] out = new int[n - k + 1];\n    for (int i = 0; i + k <= n; i++) {\n        boolean ok = true;\n        for (int j = i + 1; j < i + k; j++) {\n            if (nums[j] != nums[j - 1] + 1) { ok = false; break; }\n        }\n        out[i] = ok ? nums[i + k - 1] : -1;\n    }\n    return out;\n}`,
        cpp: `vector<int> resultsArray(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> out;\n    for (int i = 0; i + k <= n; i++) {\n        bool ok = true;\n        for (int j = i + 1; j < i + k; j++) {\n            if (nums[j] != nums[j - 1] + 1) { ok = false; break; }\n        }\n        out.push_back(ok ? nums[i + k - 1] : -1);\n    }\n    return out;\n}`,
        c: `int* resultsArray(int* nums, int numsSize, int k, int* returnSize) {\n    int n = numsSize;\n    int len = n - k + 1;\n    int* out = (int*) malloc((size_t) (len > 0 ? len : 1) * sizeof(int));\n    for (int i = 0; i + k <= n; i++) {\n        int ok = 1;\n        for (int j = i + 1; j < i + k; j++) {\n            if (nums[j] != nums[j - 1] + 1) { ok = 0; break; }\n        }\n        out[i] = ok ? nums[i + k - 1] : -1;\n    }\n    *returnSize = len;\n    return out;\n}`,
        csharp: `public static int[] ResultsArray(int[] nums, int k)\n{\n    int n = nums.Length;\n    var out_ = new int[n - k + 1];\n    for (int i = 0; i + k <= n; i++)\n    {\n        bool ok = true;\n        for (int j = i + 1; j < i + k; j++)\n        {\n            if (nums[j] != nums[j - 1] + 1) { ok = false; break; }\n        }\n        out_[i] = ok ? nums[i + k - 1] : -1;\n    }\n    return out_;\n}`,
        go: `func resultsArray(nums []int, k int) []int {\n\tn := len(nums)\n\tout := make([]int, 0, n-k+1)\n\tfor i := 0; i+k <= n; i++ {\n\t\tok := true\n\t\tfor j := i + 1; j < i+k; j++ {\n\t\t\tif nums[j] != nums[j-1]+1 {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tout = append(out, nums[i+k-1])\n\t\t} else {\n\t\t\tout = append(out, -1)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun resultsArray(nums: IntArray, k: Int): IntArray {\n    val n = nums.size\n    val out = IntArray(n - k + 1)\n    for (i in 0..n - k) {\n        var ok = true\n        for (j in i + 1 until i + k) {\n            if (nums[j] != nums[j - 1] + 1) {\n                ok = false\n                break\n            }\n        }\n        out[i] = if (ok) nums[i + k - 1] else -1\n    }\n    return out\n}`,
        swift: `func resultsArray(_ nums: [Int], _ k: Int) -> [Int] {\n    let n = nums.count\n    var out = [Int]()\n    var i = 0\n    while i + k <= n {\n        var ok = true\n        var j = i + 1\n        while j < i + k {\n            if nums[j] != nums[j - 1] + 1 {\n                ok = false\n                break\n            }\n            j += 1\n        }\n        out.append(ok ? nums[i + k - 1] : -1)\n        i += 1\n    }\n    return out\n}`,
        rust: `fn resultsArray(nums: Vec<i32>, k: i32) -> Vec<i32> {\n    let n = nums.len();\n    let k = k as usize;\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..=(n - k) {\n        let mut ok = true;\n        for j in (i + 1)..(i + k) {\n            if nums[j] != nums[j - 1] + 1 {\n                ok = false;\n                break;\n            }\n        }\n        out.push(if ok { nums[i + k - 1] } else { -1 });\n    }\n    out\n}`,
        php: `function resultsArray($nums, $k) {\n    $n = count($nums);\n    $out = [];\n    for ($i = 0; $i + $k <= $n; $i++) {\n        $ok = true;\n        for ($j = $i + 1; $j < $i + $k; $j++) {\n            if ($nums[$j] !== $nums[$j - 1] + 1) { $ok = false; break; }\n        }\n        $out[] = $ok ? $nums[$i + $k - 1] : -1;\n    }\n    return $out;\n}`,
        ruby: `def resultsArray(nums, k)\n  n = nums.length\n  out = []\n  (0..(n - k)).each do |i|\n    ok = ((i + 1)...(i + k)).all? { |j| nums[j] == nums[j - 1] + 1 }\n    out << (ok ? nums[i + k - 1] : -1)\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Count Days Without Meetings (LC 3169) ───────────────────────
  (() => {
    const ref = (days: number, meetings: number[][]) => {
      const sorted = meetings.slice().sort((a, b) => a[0] - b[0]);
      let covered = 0, reach = 0;
      for (let i = 0; i < sorted.length; i++) {
        const s = sorted[i][0] > reach + 1 ? sorted[i][0] : reach + 1;
        if (sorted[i][1] >= s) {
          covered += sorted[i][1] - s + 1;
          reach = sorted[i][1];
        }
      }
      return days - covered;
    };
    return {
      slug: "count-days-without-meetings",
      title: "Count Days Without Meetings",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "countDays", params: [{ name: "days", type: "int" as const }, { name: "meetings", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An employee is available for work on days `1` through `days`. `meetings[i] = [start, end]` is a meeting spanning those days inclusive; meetings may overlap.\n\nReturn the number of days with **no meeting scheduled**.",
        [
          { in: "days = 10, meetings = [[5,7],[1,3],[9,10]]", out: "2", note: "Days 4 and 8 are free." },
          { in: "days = 5, meetings = [[2,4],[1,3]]", out: "1", note: "The two meetings cover days 1 to 4." },
          { in: "days = 6, meetings = [[1,6]]", out: "0" },
        ],
        ["1 <= days <= 10^9", "1 <= meetings.length <= 10^5", "meetings[i].length == 2", "1 <= meetings[i][0] <= meetings[i][1] <= days"]),
      hints: [
        "`days` can be a billion, so the free days cannot be marked one by one.",
        "Sort by start and sweep, tracking the furthest day covered so far.",
        "Count covered days, then subtract from `days`.",
      ],
      editorial: explain({
        idea: "Sort the meetings by start and sweep, keeping `reach` — the furthest day covered so far. Each meeting adds only the part beyond `reach`, so the total covered count is exact even with overlaps.",
        steps: [
          "Sort the meetings by start day.",
          "For each, start counting from `max(start, reach + 1)`.",
          "If that is at most the meeting's end, add the span and advance `reach`.",
          "Return `days - covered`.",
        ],
        why: "Clamping each meeting's start to `reach + 1` is what makes overlapping and fully-nested meetings harmless — the overlap is simply not counted twice, and a meeting entirely inside an earlier one contributes nothing. Working with counts rather than a day-by-day array is what keeps this feasible at `days = 10^9`.",
        time: "O(m log m)",
        space: "O(m)",
        pitfalls: [
          "Marking each day individually is impossible at `10^9`.",
          "A meeting contained in an earlier one must add zero, not its full length.",
          "Both endpoints are inclusive, so a meeting `[x, x]` covers one day.",
        ],
      }),
      examples: [
        { input: "10\n[[5,7],[1,3],[9,10]]", expectedOutput: "2" },
        { input: "5\n[[2,4],[1,3]]", expectedOutput: "1" },
        { input: "6\n[[1,6]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const days = ri(rng, 1, 40);
        const count = ri(rng, 1, 8);
        const meetings = Array.from({ length: count }, () => {
          const s = ri(rng, 1, days);
          return [s, ri(rng, s, days)];
        });
        return { input: `${days}\n${fmtIntMat(meetings)}`, expectedOutput: String(ref(days, meetings)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countDays(days: int, meetings: List[List[int]]) -> int:\n    covered = 0\n    reach = 0\n    for start, end in sorted(meetings):\n        s = max(start, reach + 1)\n        if end >= s:\n            covered += end - s + 1\n            reach = end\n    return days - covered`,
        javascript: `var countDays = function(days, meetings) {\n    var sorted = meetings.slice();\n    sorted.sort(function(a, b) { return a[0] - b[0]; });\n    var covered = 0, reach = 0;\n    for (var i = 0; i < sorted.length; i++) {\n        var s = sorted[i][0] > reach + 1 ? sorted[i][0] : reach + 1;\n        if (sorted[i][1] >= s) {\n            covered += sorted[i][1] - s + 1;\n            reach = sorted[i][1];\n        }\n    }\n    return days - covered;\n};`,
        typescript: `function countDays(days: number, meetings: number[][]): number {\n    var sorted = meetings.slice();\n    sorted.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });\n    var covered = 0, reach = 0;\n    for (var i = 0; i < sorted.length; i++) {\n        var s = sorted[i][0] > reach + 1 ? sorted[i][0] : reach + 1;\n        if (sorted[i][1] >= s) {\n            covered += sorted[i][1] - s + 1;\n            reach = sorted[i][1];\n        }\n    }\n    return days - covered;\n}`,
        java: `public static int countDays(int days, int[][] meetings) {\n    int[][] sorted = meetings.clone();\n    Arrays.sort(sorted, (a, b) -> a[0] - b[0]);\n    long covered = 0;\n    int reach = 0;\n    for (int[] m : sorted) {\n        int s = Math.max(m[0], reach + 1);\n        if (m[1] >= s) {\n            covered += m[1] - s + 1;\n            reach = m[1];\n        }\n    }\n    return (int) (days - covered);\n}`,
        cpp: `int countDays(int days, vector<vector<int>>& meetings) {\n    vector<vector<int>> sorted = meetings;\n    sort(sorted.begin(), sorted.end());\n    long long covered = 0;\n    int reach = 0;\n    for (auto& m : sorted) {\n        int s = max(m[0], reach + 1);\n        if (m[1] >= s) {\n            covered += m[1] - s + 1;\n            reach = m[1];\n        }\n    }\n    return (int) (days - covered);\n}`,
        c: `static int cdCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return x[0] < y[0] ? -1 : (x[0] > y[0] ? 1 : 0);\n}\n\nint countDays(int days, int** meetings, int meetingsSize, int* meetingsColSize) {\n    (void) meetingsColSize;\n    int* flat = (int*) malloc((size_t) meetingsSize * 2 * sizeof(int));\n    for (int i = 0; i < meetingsSize; i++) {\n        flat[i * 2] = meetings[i][0];\n        flat[i * 2 + 1] = meetings[i][1];\n    }\n    qsort(flat, (size_t) meetingsSize, 2 * sizeof(int), cdCmp);\n    long long covered = 0;\n    int reach = 0;\n    for (int i = 0; i < meetingsSize; i++) {\n        int s = flat[i * 2] > reach + 1 ? flat[i * 2] : reach + 1;\n        if (flat[i * 2 + 1] >= s) {\n            covered += flat[i * 2 + 1] - s + 1;\n            reach = flat[i * 2 + 1];\n        }\n    }\n    free(flat);\n    return (int) (days - covered);\n}`,
        csharp: `public static int CountDays(int days, int[][] meetings)\n{\n    var sorted = (int[][]) meetings.Clone();\n    Array.Sort(sorted, (a, b) => a[0] - b[0]);\n    long covered = 0;\n    int reach = 0;\n    foreach (var m in sorted)\n    {\n        int s = Math.Max(m[0], reach + 1);\n        if (m[1] >= s)\n        {\n            covered += m[1] - s + 1;\n            reach = m[1];\n        }\n    }\n    return (int) (days - covered);\n}`,
        go: `func countDays(days int, meetings [][]int) int {\n\tsorted := make([][]int, len(meetings))\n\tcopy(sorted, meetings)\n\tsort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })\n\tcovered, reach := 0, 0\n\tfor _, m := range sorted {\n\t\ts := m[0]\n\t\tif reach+1 > s {\n\t\t\ts = reach + 1\n\t\t}\n\t\tif m[1] >= s {\n\t\t\tcovered += m[1] - s + 1\n\t\t\treach = m[1]\n\t\t}\n\t}\n\treturn days - covered\n}`,
        kotlin: `fun countDays(days: Int, meetings: Array<IntArray>): Int {\n    val sorted = meetings.sortedBy { it[0] }\n    var covered = 0L\n    var reach = 0\n    for (m in sorted) {\n        val s = maxOf(m[0], reach + 1)\n        if (m[1] >= s) {\n            covered += (m[1] - s + 1).toLong()\n            reach = m[1]\n        }\n    }\n    return (days - covered).toInt()\n}`,
        swift: `func countDays(_ days: Int, _ meetings: [[Int]]) -> Int {\n    let sorted = meetings.sorted { $0[0] < $1[0] }\n    var covered = 0\n    var reach = 0\n    for m in sorted {\n        let s = max(m[0], reach + 1)\n        if m[1] >= s {\n            covered += m[1] - s + 1\n            reach = m[1]\n        }\n    }\n    return days - covered\n}`,
        rust: `fn countDays(days: i32, meetings: Vec<Vec<i32>>) -> i32 {\n    let mut sorted = meetings.clone();\n    sorted.sort_by_key(|m| m[0]);\n    let mut covered: i64 = 0;\n    let mut reach = 0i32;\n    for m in sorted.iter() {\n        let s = std::cmp::max(m[0], reach + 1);\n        if m[1] >= s {\n            covered += (m[1] - s + 1) as i64;\n            reach = m[1];\n        }\n    }\n    (days as i64 - covered) as i32\n}`,
        php: `function countDays($days, $meetings) {\n    $sorted = $meetings;\n    usort($sorted, function($a, $b) { return $a[0] - $b[0]; });\n    $covered = 0;\n    $reach = 0;\n    foreach ($sorted as $m) {\n        $s = max($m[0], $reach + 1);\n        if ($m[1] >= $s) {\n            $covered += $m[1] - $s + 1;\n            $reach = $m[1];\n        }\n    }\n    return $days - $covered;\n}`,
        ruby: `def countDays(days, meetings)\n  covered = 0\n  reach = 0\n  meetings.sort_by { |m| m[0] }.each do |start, finish|\n    s = [start, reach + 1].max\n    if finish >= s\n      covered += finish - s + 1\n      reach = finish\n    end\n  end\n  days - covered\nend`,
      },
    };
  })(),

  // ── Modify the Matrix (LC 3033) ─────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const m = matrix.length, n = matrix[0].length;
      const colMax = new Array(n).fill(-1);
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < m; i++) if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j];
      }
      return matrix.map((row, i) => row.map((v, j) => (v === -1 ? colMax[j] : v)));
    };
    return {
      slug: "modify-the-matrix",
      title: "Modify the Matrix",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Amazon", "Google", "Capgemini"],
      signature: { funcName: "modifiedMatrix", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Replace every `-1` in the matrix with the **largest value in its own column**, and return the result. The original matrix is not changed.",
        [
          { in: "matrix = [[1,2,-1],[4,-1,6],[7,8,9]]", out: "[[1,2,9],[4,8,6],[7,8,9]]", note: "Column 2's maximum is 9 and column 1's is 8." },
          { in: "matrix = [[3,-1],[5,2]]", out: "[[3,2],[5,2]]" },
          { in: "matrix = [[1,2],[3,4]]", out: "[[1,2],[3,4]]", note: "Nothing to replace." },
        ],
        ["m == matrix.length", "n == matrix[i].length", "2 <= m, n <= 50", "-1 <= matrix[i][j] <= 100", "The input is generated so that each column contains at least one non-negative integer."]),
      hints: [
        "Compute each column's maximum before replacing anything.",
        "A `-1` is never the maximum, so it can be included in the scan harmlessly.",
        "Build a new matrix rather than modifying in place.",
      ],
      editorial: explain({
        idea: "Two passes: find each column's maximum, then build the answer, substituting the column maximum wherever a `-1` sits.",
        steps: [
          "For each column, scan down and record the largest value.",
          "Build the result, replacing `-1` with its column's maximum.",
        ],
        why: "The maxima must all be computed **before** any substitution: replacing in place would let a freshly written value become the maximum of a later column scan. Including the `-1`s in the max scan is harmless, since every column is promised at least one non-negative entry.",
        time: "O(m · n)",
        space: "O(m · n) for the output",
        pitfalls: [
          "Replacing in place while still computing maxima corrupts later columns.",
          "The maximum is per **column**, not per row or over the whole matrix.",
          "Start the running maximum at `-1`, not 0, since values may be 0.",
        ],
      }),
      examples: [
        { input: "[[1,2,-1],[4,-1,6],[7,8,9]]", expectedOutput: "[[1,2,9],[4,8,6],[7,8,9]]" },
        { input: "[[3,-1],[5,2]]", expectedOutput: "[[3,2],[5,2]]" },
        { input: "[[1,2],[3,4]]", expectedOutput: "[[1,2],[3,4]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6), n = ri(rng, 2, 6);
        const matrix = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => (rng() < 0.25 ? -1 : ri(rng, 0, 100))));
        // Every column needs a non-negative entry, as the statement promises.
        for (let j = 0; j < n; j++) matrix[ri(rng, 0, m - 1)][j] = ri(rng, 0, 100);
        return { input: fmtIntMat(matrix), expectedOutput: fmtIntMat(ref(matrix)) };
      },
      solutions: {
        python: `from typing import List\n\ndef modifiedMatrix(matrix: List[List[int]]) -> List[List[int]]:\n    m, n = len(matrix), len(matrix[0])\n    col_max = [max(matrix[i][j] for i in range(m)) for j in range(n)]\n    return [[col_max[j] if matrix[i][j] == -1 else matrix[i][j] for j in range(n)] for i in range(m)]`,
        javascript: `var modifiedMatrix = function(matrix) {\n    var m = matrix.length, n = matrix[0].length, i, j;\n    var colMax = [];\n    for (j = 0; j < n; j++) colMax.push(-1);\n    for (j = 0; j < n; j++) {\n        for (i = 0; i < m; i++) if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j];\n    }\n    var out = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(matrix[i][j] === -1 ? colMax[j] : matrix[i][j]);\n        out.push(row);\n    }\n    return out;\n};`,
        typescript: `function modifiedMatrix(matrix: number[][]): number[][] {\n    var m = matrix.length, n = matrix[0].length, i: number, j: number;\n    var colMax: number[] = [];\n    for (j = 0; j < n; j++) colMax.push(-1);\n    for (j = 0; j < n; j++) {\n        for (i = 0; i < m; i++) if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j];\n    }\n    var out: number[][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(matrix[i][j] === -1 ? colMax[j] : matrix[i][j]);\n        out.push(row);\n    }\n    return out;\n}`,
        java: `public static int[][] modifiedMatrix(int[][] matrix) {\n    int m = matrix.length, n = matrix[0].length;\n    int[] colMax = new int[n];\n    Arrays.fill(colMax, -1);\n    for (int j = 0; j < n; j++) {\n        for (int i = 0; i < m; i++) colMax[j] = Math.max(colMax[j], matrix[i][j]);\n    }\n    int[][] out = new int[m][n];\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) out[i][j] = matrix[i][j] == -1 ? colMax[j] : matrix[i][j];\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> modifiedMatrix(vector<vector<int>>& matrix) {\n    int m = (int) matrix.size(), n = (int) matrix[0].size();\n    vector<int> colMax(n, -1);\n    for (int j = 0; j < n; j++) {\n        for (int i = 0; i < m; i++) colMax[j] = max(colMax[j], matrix[i][j]);\n    }\n    vector<vector<int>> out(m, vector<int>(n));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) out[i][j] = matrix[i][j] == -1 ? colMax[j] : matrix[i][j];\n    }\n    return out;\n}`,
        c: `int** modifiedMatrix(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {\n    int m = matrixSize, n = matrixColSize[0];\n    int* colMax = (int*) malloc((size_t) n * sizeof(int));\n    for (int j = 0; j < n; j++) {\n        colMax[j] = -1;\n        for (int i = 0; i < m; i++) if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j];\n    }\n    int** out = (int**) malloc((size_t) m * sizeof(int*));\n    *returnColumnSizes = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < m; i++) {\n        out[i] = (int*) malloc((size_t) n * sizeof(int));\n        (*returnColumnSizes)[i] = n;\n        for (int j = 0; j < n; j++) out[i][j] = matrix[i][j] == -1 ? colMax[j] : matrix[i][j];\n    }\n    free(colMax);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[][] ModifiedMatrix(int[][] matrix)\n{\n    int m = matrix.Length, n = matrix[0].Length;\n    var colMax = new int[n];\n    for (int j = 0; j < n; j++)\n    {\n        colMax[j] = -1;\n        for (int i = 0; i < m; i++) colMax[j] = Math.Max(colMax[j], matrix[i][j]);\n    }\n    var out_ = new int[m][];\n    for (int i = 0; i < m; i++)\n    {\n        out_[i] = new int[n];\n        for (int j = 0; j < n; j++) out_[i][j] = matrix[i][j] == -1 ? colMax[j] : matrix[i][j];\n    }\n    return out_;\n}`,
        go: `func modifiedMatrix(matrix [][]int) [][]int {\n\tm, n := len(matrix), len(matrix[0])\n\tcolMax := make([]int, n)\n\tfor j := 0; j < n; j++ {\n\t\tcolMax[j] = -1\n\t\tfor i := 0; i < m; i++ {\n\t\t\tif matrix[i][j] > colMax[j] {\n\t\t\t\tcolMax[j] = matrix[i][j]\n\t\t\t}\n\t\t}\n\t}\n\tout := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tout[i] = make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif matrix[i][j] == -1 {\n\t\t\t\tout[i][j] = colMax[j]\n\t\t\t} else {\n\t\t\t\tout[i][j] = matrix[i][j]\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun modifiedMatrix(matrix: Array<IntArray>): Array<IntArray> {\n    val m = matrix.size\n    val n = matrix[0].size\n    val colMax = IntArray(n) { -1 }\n    for (j in 0 until n) {\n        for (i in 0 until m) if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j]\n    }\n    return Array(m) { i -> IntArray(n) { j -> if (matrix[i][j] == -1) colMax[j] else matrix[i][j] } }\n}`,
        swift: `func modifiedMatrix(_ matrix: [[Int]]) -> [[Int]] {\n    let m = matrix.count\n    let n = matrix[0].count\n    var colMax = [Int](repeating: -1, count: n)\n    for j in 0..<n {\n        for i in 0..<m where matrix[i][j] > colMax[j] { colMax[j] = matrix[i][j] }\n    }\n    var out = [[Int]]()\n    for i in 0..<m {\n        var row = [Int]()\n        for j in 0..<n { row.append(matrix[i][j] == -1 ? colMax[j] : matrix[i][j]) }\n        out.append(row)\n    }\n    return out\n}`,
        rust: `fn modifiedMatrix(matrix: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let m = matrix.len();\n    let n = matrix[0].len();\n    let mut col_max = vec![-1i32; n];\n    for j in 0..n {\n        for i in 0..m {\n            if matrix[i][j] > col_max[j] {\n                col_max[j] = matrix[i][j];\n            }\n        }\n    }\n    (0..m)\n        .map(|i| {\n            (0..n)\n                .map(|j| if matrix[i][j] == -1 { col_max[j] } else { matrix[i][j] })\n                .collect()\n        })\n        .collect()\n}`,
        php: `function modifiedMatrix($matrix) {\n    $m = count($matrix);\n    $n = count($matrix[0]);\n    $colMax = array_fill(0, $n, -1);\n    for ($j = 0; $j < $n; $j++) {\n        for ($i = 0; $i < $m; $i++) if ($matrix[$i][$j] > $colMax[$j]) $colMax[$j] = $matrix[$i][$j];\n    }\n    $out = [];\n    for ($i = 0; $i < $m; $i++) {\n        $row = [];\n        for ($j = 0; $j < $n; $j++) $row[] = $matrix[$i][$j] === -1 ? $colMax[$j] : $matrix[$i][$j];\n        $out[] = $row;\n    }\n    return $out;\n}`,
        ruby: `def modifiedMatrix(matrix)\n  m = matrix.length\n  n = matrix[0].length\n  col_max = (0...n).map { |j| (0...m).map { |i| matrix[i][j] }.max }\n  (0...m).map do |i|\n    (0...n).map { |j| matrix[i][j] == -1 ? col_max[j] : matrix[i][j] }\n  end\nend`,
      },
    };
  })(),

  // ── Minimum Sum of Mountain Triplets II (LC 2909) ───────────────
  (() => {
    const INF = 2000000000;
    const ref = (nums: number[]) => {
      const n = nums.length;
      const pre = new Array(n).fill(INF);
      const suf = new Array(n).fill(INF);
      let m = INF;
      for (let i = 0; i < n; i++) { pre[i] = m; if (nums[i] < m) m = nums[i]; }
      m = INF;
      for (let i = n - 1; i >= 0; i--) { suf[i] = m; if (nums[i] < m) m = nums[i]; }
      let best = -1;
      for (let j = 1; j < n - 1; j++) {
        if (pre[j] < nums[j] && suf[j] < nums[j]) {
          const s = pre[j] + nums[j] + suf[j];
          if (best === -1 || s < best) best = s;
        }
      }
      return best;
    };
    return {
      slug: "minimum-sum-of-mountain-triplets-ii",
      title: "Minimum Sum of Mountain Triplets II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "minimumSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Indices `i < j < k` form a **mountain triplet** when `nums[i] < nums[j]` and `nums[k] < nums[j]` — the middle value is the peak.\n\nReturn the minimum possible value of `nums[i] + nums[j] + nums[k]` over all mountain triplets, or `-1` if there are none.",
        [
          { in: "nums = [8,6,1,5,3]", out: "9", note: "Indices 2, 3, 4: `1 < 5` and `3 < 5`, summing to 9." },
          { in: "nums = [5,4,8,7,10,2]", out: "13", note: "Indices 1, 3, 5: `4 < 7` and `2 < 7`." },
          { in: "nums = [6,5,4,3,4,5]", out: "-1", note: "No value has a smaller value on both sides." },
        ],
        ["3 <= nums.length <= 10^5", "1 <= nums[i] <= 10^8"]),
      hints: [
        "Fix the peak `j`. The best `i` is the smallest value strictly left of `j`, and the best `k` the smallest strictly right.",
        "Precompute a prefix minimum and a suffix minimum so each peak is answered in constant time.",
        "Only accept a peak whose two minima are strictly smaller than it.",
      ],
      editorial: explain({
        idea: "Fix the peak. For a given middle index `j`, the cheapest triplet uses the smallest value to its left and the smallest to its right — so a prefix-minimum and a suffix-minimum array answer every peak in O(1).",
        steps: [
          "Build `pre[j]` = minimum of `nums[0..j-1]` and `suf[j]` = minimum of `nums[j+1..n-1]`, both with a large sentinel where the side is empty.",
          "For each `j` from 1 to n-2, if `pre[j] < nums[j]` and `suf[j] < nums[j]`, consider `pre[j] + nums[j] + suf[j]`.",
          "Return the best sum found, or `-1`.",
        ],
        why: "Both flanks are chosen independently once the peak is fixed, so taking the minimum on each side is optimal — there is no interaction between the choice of `i` and of `k` beyond both being smaller than the peak. This is what turns the O(n³) triple loop of version I into one linear pass, which is what the larger `n` here demands.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The comparisons are strict: an equal neighbour does not make a mountain.",
          "The sentinel must exceed every possible value, or an empty side would be mistaken for a valid flank.",
          "Return `-1`, not 0, when no triplet exists.",
        ],
      }),
      examples: [
        { input: "[8,6,1,5,3]", expectedOutput: "9" },
        { input: "[5,4,8,7,10,2]", expectedOutput: "13" },
        { input: "[6,5,4,3,4,5]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 14);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumSum(nums: List[int]) -> int:\n    n = len(nums)\n    INF = 2000000000\n    pre = [INF] * n\n    suf = [INF] * n\n    m = INF\n    for i in range(n):\n        pre[i] = m\n        m = min(m, nums[i])\n    m = INF\n    for i in range(n - 1, -1, -1):\n        suf[i] = m\n        m = min(m, nums[i])\n    best = -1\n    for j in range(1, n - 1):\n        if pre[j] < nums[j] and suf[j] < nums[j]:\n            s = pre[j] + nums[j] + suf[j]\n            if best == -1 or s < best:\n                best = s\n    return best`,
        javascript: `var minimumSum = function(nums) {\n    var n = nums.length, INF = 2000000000, i;\n    var pre = [], suf = [];\n    for (i = 0; i < n; i++) { pre.push(INF); suf.push(INF); }\n    var m = INF;\n    for (i = 0; i < n; i++) { pre[i] = m; if (nums[i] < m) m = nums[i]; }\n    m = INF;\n    for (i = n - 1; i >= 0; i--) { suf[i] = m; if (nums[i] < m) m = nums[i]; }\n    var best = -1;\n    for (var j = 1; j < n - 1; j++) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            var s = pre[j] + nums[j] + suf[j];\n            if (best === -1 || s < best) best = s;\n        }\n    }\n    return best;\n};`,
        typescript: `function minimumSum(nums: number[]): number {\n    var n = nums.length, INF = 2000000000, i: number;\n    var pre: number[] = [], suf: number[] = [];\n    for (i = 0; i < n; i++) { pre.push(INF); suf.push(INF); }\n    var m = INF;\n    for (i = 0; i < n; i++) { pre[i] = m; if (nums[i] < m) m = nums[i]; }\n    m = INF;\n    for (i = n - 1; i >= 0; i--) { suf[i] = m; if (nums[i] < m) m = nums[i]; }\n    var best = -1;\n    for (var j = 1; j < n - 1; j++) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            var s = pre[j] + nums[j] + suf[j];\n            if (best === -1 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        java: `public static int minimumSum(int[] nums) {\n    int n = nums.length;\n    final int INF = 2000000000;\n    int[] pre = new int[n];\n    int[] suf = new int[n];\n    int m = INF;\n    for (int i = 0; i < n; i++) {\n        pre[i] = m;\n        m = Math.min(m, nums[i]);\n    }\n    m = INF;\n    for (int i = n - 1; i >= 0; i--) {\n        suf[i] = m;\n        m = Math.min(m, nums[i]);\n    }\n    int best = -1;\n    for (int j = 1; j < n - 1; j++) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            int s = pre[j] + nums[j] + suf[j];\n            if (best == -1 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        cpp: `int minimumSum(vector<int>& nums) {\n    int n = (int) nums.size();\n    const int INF = 2000000000;\n    vector<int> pre(n, INF), suf(n, INF);\n    int m = INF;\n    for (int i = 0; i < n; i++) {\n        pre[i] = m;\n        m = min(m, nums[i]);\n    }\n    m = INF;\n    for (int i = n - 1; i >= 0; i--) {\n        suf[i] = m;\n        m = min(m, nums[i]);\n    }\n    int best = -1;\n    for (int j = 1; j < n - 1; j++) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            int s = pre[j] + nums[j] + suf[j];\n            if (best == -1 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        c: `int minimumSum(int* nums, int numsSize) {\n    int n = numsSize;\n    const int INF = 2000000000;\n    int* pre = (int*) malloc((size_t) n * sizeof(int));\n    int* suf = (int*) malloc((size_t) n * sizeof(int));\n    int m = INF;\n    for (int i = 0; i < n; i++) {\n        pre[i] = m;\n        if (nums[i] < m) m = nums[i];\n    }\n    m = INF;\n    for (int i = n - 1; i >= 0; i--) {\n        suf[i] = m;\n        if (nums[i] < m) m = nums[i];\n    }\n    int best = -1;\n    for (int j = 1; j < n - 1; j++) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            int s = pre[j] + nums[j] + suf[j];\n            if (best == -1 || s < best) best = s;\n        }\n    }\n    free(pre);\n    free(suf);\n    return best;\n}`,
        csharp: `public static int MinimumSum(int[] nums)\n{\n    int n = nums.Length;\n    const int INF = 2000000000;\n    var pre = new int[n];\n    var suf = new int[n];\n    int m = INF;\n    for (int i = 0; i < n; i++)\n    {\n        pre[i] = m;\n        m = Math.Min(m, nums[i]);\n    }\n    m = INF;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        suf[i] = m;\n        m = Math.Min(m, nums[i]);\n    }\n    int best = -1;\n    for (int j = 1; j < n - 1; j++)\n    {\n        if (pre[j] < nums[j] && suf[j] < nums[j])\n        {\n            int s = pre[j] + nums[j] + suf[j];\n            if (best == -1 || s < best) best = s;\n        }\n    }\n    return best;\n}`,
        go: `func minimumSum(nums []int) int {\n\tn := len(nums)\n\tconst INF = 2000000000\n\tpre := make([]int, n)\n\tsuf := make([]int, n)\n\tm := INF\n\tfor i := 0; i < n; i++ {\n\t\tpre[i] = m\n\t\tif nums[i] < m {\n\t\t\tm = nums[i]\n\t\t}\n\t}\n\tm = INF\n\tfor i := n - 1; i >= 0; i-- {\n\t\tsuf[i] = m\n\t\tif nums[i] < m {\n\t\t\tm = nums[i]\n\t\t}\n\t}\n\tbest := -1\n\tfor j := 1; j < n-1; j++ {\n\t\tif pre[j] < nums[j] && suf[j] < nums[j] {\n\t\t\ts := pre[j] + nums[j] + suf[j]\n\t\t\tif best == -1 || s < best {\n\t\t\t\tbest = s\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumSum(nums: IntArray): Int {\n    val n = nums.size\n    val INF = 2000000000\n    val pre = IntArray(n)\n    val suf = IntArray(n)\n    var m = INF\n    for (i in 0 until n) {\n        pre[i] = m\n        m = minOf(m, nums[i])\n    }\n    m = INF\n    for (i in n - 1 downTo 0) {\n        suf[i] = m\n        m = minOf(m, nums[i])\n    }\n    var best = -1\n    for (j in 1 until n - 1) {\n        if (pre[j] < nums[j] && suf[j] < nums[j]) {\n            val s = pre[j] + nums[j] + suf[j]\n            if (best == -1 || s < best) best = s\n        }\n    }\n    return best\n}`,
        swift: `func minimumSum(_ nums: [Int]) -> Int {\n    let n = nums.count\n    let INF = 2000000000\n    var pre = [Int](repeating: INF, count: n)\n    var suf = [Int](repeating: INF, count: n)\n    var m = INF\n    for i in 0..<n {\n        pre[i] = m\n        m = min(m, nums[i])\n    }\n    m = INF\n    for i in stride(from: n - 1, through: 0, by: -1) {\n        suf[i] = m\n        m = min(m, nums[i])\n    }\n    var best = -1\n    for j in 1..<(n - 1) {\n        if pre[j] < nums[j] && suf[j] < nums[j] {\n            let s = pre[j] + nums[j] + suf[j]\n            if best == -1 || s < best { best = s }\n        }\n    }\n    return best\n}`,
        rust: `fn minimumSum(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    const INF: i32 = 2000000000;\n    let mut pre = vec![INF; n];\n    let mut suf = vec![INF; n];\n    let mut m = INF;\n    for i in 0..n {\n        pre[i] = m;\n        m = m.min(nums[i]);\n    }\n    m = INF;\n    for i in (0..n).rev() {\n        suf[i] = m;\n        m = m.min(nums[i]);\n    }\n    let mut best = -1i32;\n    for j in 1..(n - 1) {\n        if pre[j] < nums[j] && suf[j] < nums[j] {\n            let s = pre[j] + nums[j] + suf[j];\n            if best == -1 || s < best {\n                best = s;\n            }\n        }\n    }\n    best\n}`,
        php: `function minimumSum($nums) {\n    $n = count($nums);\n    $INF = 2000000000;\n    $pre = array_fill(0, $n, $INF);\n    $suf = array_fill(0, $n, $INF);\n    $m = $INF;\n    for ($i = 0; $i < $n; $i++) {\n        $pre[$i] = $m;\n        if ($nums[$i] < $m) $m = $nums[$i];\n    }\n    $m = $INF;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $suf[$i] = $m;\n        if ($nums[$i] < $m) $m = $nums[$i];\n    }\n    $best = -1;\n    for ($j = 1; $j < $n - 1; $j++) {\n        if ($pre[$j] < $nums[$j] && $suf[$j] < $nums[$j]) {\n            $s = $pre[$j] + $nums[$j] + $suf[$j];\n            if ($best === -1 || $s < $best) $best = $s;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minimumSum(nums)\n  n = nums.length\n  inf = 2000000000\n  pre = Array.new(n, inf)\n  suf = Array.new(n, inf)\n  m = inf\n  (0...n).each do |i|\n    pre[i] = m\n    m = nums[i] if nums[i] < m\n  end\n  m = inf\n  (n - 1).downto(0) do |i|\n    suf[i] = m\n    m = nums[i] if nums[i] < m\n  end\n  best = -1\n  (1...(n - 1)).each do |j|\n    next unless pre[j] < nums[j] && suf[j] < nums[j]\n    s = pre[j] + nums[j] + suf[j]\n    best = s if best == -1 || s < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Alternating Groups II (LC 3208) ─────────────────────────────
  (() => {
    const ref = (colors: number[], k: number) => {
      const n = colors.length;
      let run = 1, count = 0;
      for (let i = 1; i < n + k - 1; i++) {
        if (colors[i % n] !== colors[(i - 1) % n]) run++; else run = 1;
        if (run >= k) count++;
      }
      return count;
    };
    return {
      slug: "alternating-groups-ii",
      title: "Alternating Groups II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "numberOfAlternatingGroups", params: [{ name: "colors", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There is a **circle** of tiles, `colors[i]` being `0` for a red tile and `1` for a blue one. The last tile and the first are neighbours.\n\nAn **alternating group** is a run of `k` consecutive tiles (going around the circle) in which every tile differs in colour from the one before it. Return how many alternating groups there are — one per starting position.",
        [
          { in: "colors = [0,1,0,1,0], k = 3", out: "3", note: "The groups starting at indices 0, 1 and 2." },
          { in: "colors = [0,1,0,0,1,0,1], k = 6", out: "2" },
          { in: "colors = [1,1,0,1], k = 4", out: "0", note: "The two leading blues break every window." },
        ],
        ["3 <= colors.length <= 10^5", "0 <= colors[i] <= 1", "3 <= k <= colors.length"]),
      hints: [
        "Walk the circle keeping a run length: the number of consecutive positions, ending here, that alternate.",
        "Every time the run reaches `k` or more, one new group ends at this position.",
        "To cover the wrap-around, continue for `k - 1` extra steps past the end, indexing modulo `n`.",
      ],
      editorial: explain({
        idea: "Keep a running \"alternating streak ending here\" length while walking the circle. Whenever the streak is at least `k`, the window ending at this tile is an alternating group. Walking `n + k - 2` steps with modular indexing covers every wrap-around window exactly once.",
        steps: [
          "Start `run = 1` at index 0.",
          "For `i` from 1 to `n + k - 2`: if `colors[i mod n]` differs from `colors[(i-1) mod n]`, extend the run; otherwise reset it to 1.",
          "Count a group whenever `run >= k`.",
        ],
        why: "Counting windows by their *end* is what makes one pass enough — a streak of length `L >= k` contributes exactly `L - k + 1` windows, and incrementing at every step where `run >= k` adds up to precisely that. The extra `k - 1` steps are the minimum needed to see every window that straddles the seam, and no more, so nothing is double-counted.",
        time: "O(n + k)",
        space: "O(1)",
        pitfalls: [
          "Stopping at index `n - 1` misses every group that crosses the seam.",
          "Walking a full `2n` steps would count the wrap-around windows twice when `k` is small.",
          "Reset the run to 1, not 0 — the current tile always starts a fresh streak.",
        ],
      }),
      examples: [
        { input: "[0,1,0,1,0]\n3", expectedOutput: "3" },
        { input: "[0,1,0,0,1,0,1]\n6", expectedOutput: "2" },
        { input: "[1,1,0,1]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 14);
        const colors: number[] = [];
        // Mix long alternating stretches with repeats so both branches appear.
        let v = ri(rng, 0, 1);
        while (colors.length < n) {
          if (rng() < 0.7) { colors.push(v); v = 1 - v; } else colors.push(v);
        }
        const k = ri(rng, 3, n);
        return { input: `${fmtIntArr(colors)}\n${k}`, expectedOutput: String(ref(colors, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfAlternatingGroups(colors: List[int], k: int) -> int:\n    n = len(colors)\n    run = 1\n    count = 0\n    for i in range(1, n + k - 1):\n        if colors[i % n] != colors[(i - 1) % n]:\n            run += 1\n        else:\n            run = 1\n        if run >= k:\n            count += 1\n    return count`,
        javascript: `var numberOfAlternatingGroups = function(colors, k) {\n    var n = colors.length, run = 1, count = 0;\n    for (var i = 1; i < n + k - 1; i++) {\n        if (colors[i % n] !== colors[(i - 1) % n]) run++; else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n};`,
        typescript: `function numberOfAlternatingGroups(colors: number[], k: number): number {\n    var n = colors.length, run = 1, count = 0;\n    for (var i = 1; i < n + k - 1; i++) {\n        if (colors[i % n] !== colors[(i - 1) % n]) run++; else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n}`,
        java: `public static int numberOfAlternatingGroups(int[] colors, int k) {\n    int n = colors.length, run = 1, count = 0;\n    for (int i = 1; i < n + k - 1; i++) {\n        if (colors[i % n] != colors[(i - 1) % n]) run++;\n        else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n}`,
        cpp: `int numberOfAlternatingGroups(vector<int>& colors, int k) {\n    int n = (int) colors.size(), run = 1, count = 0;\n    for (int i = 1; i < n + k - 1; i++) {\n        if (colors[i % n] != colors[(i - 1) % n]) run++;\n        else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n}`,
        c: `int numberOfAlternatingGroups(int* colors, int colorsSize, int k) {\n    int n = colorsSize, run = 1, count = 0;\n    for (int i = 1; i < n + k - 1; i++) {\n        if (colors[i % n] != colors[(i - 1) % n]) run++;\n        else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n}`,
        csharp: `public static int NumberOfAlternatingGroups(int[] colors, int k)\n{\n    int n = colors.Length, run = 1, count = 0;\n    for (int i = 1; i < n + k - 1; i++)\n    {\n        if (colors[i % n] != colors[(i - 1) % n]) run++;\n        else run = 1;\n        if (run >= k) count++;\n    }\n    return count;\n}`,
        go: `func numberOfAlternatingGroups(colors []int, k int) int {\n\tn := len(colors)\n\trun, count := 1, 0\n\tfor i := 1; i < n+k-1; i++ {\n\t\tif colors[i%n] != colors[(i-1)%n] {\n\t\t\trun++\n\t\t} else {\n\t\t\trun = 1\n\t\t}\n\t\tif run >= k {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numberOfAlternatingGroups(colors: IntArray, k: Int): Int {\n    val n = colors.size\n    var run = 1\n    var count = 0\n    for (i in 1 until n + k - 1) {\n        if (colors[i % n] != colors[(i - 1) % n]) run++ else run = 1\n        if (run >= k) count++\n    }\n    return count\n}`,
        swift: `func numberOfAlternatingGroups(_ colors: [Int], _ k: Int) -> Int {\n    let n = colors.count\n    var run = 1\n    var count = 0\n    var i = 1\n    while i < n + k - 1 {\n        if colors[i % n] != colors[(i - 1) % n] { run += 1 } else { run = 1 }\n        if run >= k { count += 1 }\n        i += 1\n    }\n    return count\n}`,
        rust: `fn numberOfAlternatingGroups(colors: Vec<i32>, k: i32) -> i32 {\n    let n = colors.len();\n    let k = k as usize;\n    let mut run = 1usize;\n    let mut count = 0i32;\n    for i in 1..(n + k - 1) {\n        if colors[i % n] != colors[(i - 1) % n] {\n            run += 1;\n        } else {\n            run = 1;\n        }\n        if run >= k {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function numberOfAlternatingGroups($colors, $k) {\n    $n = count($colors);\n    $run = 1;\n    $count = 0;\n    for ($i = 1; $i < $n + $k - 1; $i++) {\n        if ($colors[$i % $n] !== $colors[($i - 1) % $n]) $run++; else $run = 1;\n        if ($run >= $k) $count++;\n    }\n    return $count;\n}`,
        ruby: `def numberOfAlternatingGroups(colors, k)\n  n = colors.length\n  run = 1\n  count = 0\n  (1...(n + k - 1)).each do |i|\n    if colors[i % n] != colors[(i - 1) % n]\n      run += 1\n    else\n      run = 1\n    end\n    count += 1 if run >= k\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Sum of Digit Differences of All Pairs (LC 3153) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const work = nums.slice();
      let digits = 0;
      for (let v = nums[0]; v > 0; v = Math.floor(v / 10)) digits++;
      if (digits === 0) digits = 1;
      let total = 0;
      for (let p = 0; p < digits; p++) {
        const cnt = new Array(10).fill(0);
        for (let i = 0; i < n; i++) {
          cnt[work[i] % 10]++;
          work[i] = Math.floor(work[i] / 10);
        }
        let same = 0;
        for (let d = 0; d < 10; d++) same += (cnt[d] * (cnt[d] - 1)) / 2;
        total += (n * (n - 1)) / 2 - same;
      }
      return total;
    };
    return {
      slug: "sum-of-digit-differences-of-all-pairs",
      title: "Sum of Digit Differences of All Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Amazon", "Google", "Infosys"],
      signature: { funcName: "sumDigitDifferences", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Every integer in `nums` has the **same number of digits**. The **digit difference** of two integers is the count of positions at which their digits differ.\n\nReturn the sum of the digit differences over all pairs of integers in `nums`.",
        [
          { in: "nums = [13,23,12]", out: "4", note: "`13`/`23` differ in 1 place, `13`/`12` in 1, `23`/`12` in 2." },
          { in: "nums = [10,10,10,10]", out: "0", note: "Identical numbers differ nowhere." },
          { in: "nums = [797,420,797]", out: "6", note: "The two `797`s cost nothing; each against `420` costs 3." },
        ],
        ["2 <= nums.length <= 1000", "1 <= nums[i] < 10^9", "All integers in nums have the same number of digits."]),
      hints: [
        "The positions are independent — total the differences one digit position at a time.",
        "At one position, count how many numbers show each digit 0 through 9.",
        "Pairs that agree there are the ones to subtract from the total pair count.",
      ],
      editorial: explain({
        idea: "Handle each digit position separately. At one position, count how many numbers carry each of the ten digits; the pairs that **differ** there are all pairs minus the pairs that agree, and the agreeing pairs are `C(c, 2)` summed over each digit's count `c`.",
        steps: [
          "Find the shared digit count from the first number.",
          "For each position, peel the last digit of every number with `% 10` and tally the ten digits, then divide each number by 10.",
          "Add `C(n, 2) - Σ C(count[d], 2)` to the running total.",
        ],
        why: "Counting the agreeing pairs instead of the differing ones is what avoids the O(n²) pairwise comparison: the tally is a single pass per position, and there are at most ten digits to combine. Peeling from the least significant end reuses the same array, so no string conversion is needed at all.",
        time: "O(n · d) where d is the number of digits",
        space: "O(1) beyond a copy of the input",
        pitfalls: [
          "Comparing every pair directly is O(n² · d) and far slower.",
          "`C(c, 2)` is `c * (c - 1) / 2`; using `c²` counts ordered pairs and self-pairs.",
          "Peel digits from a copy — the input should not be destroyed if the caller still needs it.",
        ],
      }),
      examples: [
        { input: "[13,23,12]", expectedOutput: "4" },
        { input: "[10,10,10,10]", expectedOutput: "0" },
        { input: "[797,420,797]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const digits = ri(rng, 1, 4);
        const lo = digits === 1 ? 1 : Math.pow(10, digits - 1);
        const hi = Math.pow(10, digits) - 1;
        const n = ri(rng, 2, 12);
        const nums = Array.from({ length: n }, () => ri(rng, lo, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumDigitDifferences(nums: List[int]) -> int:\n    n = len(nums)\n    work = nums[:]\n    digits = len(str(nums[0]))\n    total = 0\n    for _ in range(digits):\n        cnt = [0] * 10\n        for i in range(n):\n            cnt[work[i] % 10] += 1\n            work[i] //= 10\n        same = sum(c * (c - 1) // 2 for c in cnt)\n        total += n * (n - 1) // 2 - same\n    return total`,
        javascript: `var sumDigitDifferences = function(nums) {\n    var n = nums.length, i, d;\n    var work = nums.slice();\n    var digits = 0;\n    for (var v = nums[0]; v > 0; v = Math.floor(v / 10)) digits++;\n    if (digits === 0) digits = 1;\n    var total = 0;\n    for (var p = 0; p < digits; p++) {\n        var cnt = [];\n        for (d = 0; d < 10; d++) cnt.push(0);\n        for (i = 0; i < n; i++) {\n            cnt[work[i] % 10]++;\n            work[i] = Math.floor(work[i] / 10);\n        }\n        var same = 0;\n        for (d = 0; d < 10; d++) same += cnt[d] * (cnt[d] - 1) / 2;\n        total += n * (n - 1) / 2 - same;\n    }\n    return total;\n};`,
        typescript: `function sumDigitDifferences(nums: number[]): number {\n    var n = nums.length, i: number, d: number;\n    var work = nums.slice();\n    var digits = 0;\n    for (var v = nums[0]; v > 0; v = Math.floor(v / 10)) digits++;\n    if (digits === 0) digits = 1;\n    var total = 0;\n    for (var p = 0; p < digits; p++) {\n        var cnt: number[] = [];\n        for (d = 0; d < 10; d++) cnt.push(0);\n        for (i = 0; i < n; i++) {\n            cnt[work[i] % 10]++;\n            work[i] = Math.floor(work[i] / 10);\n        }\n        var same = 0;\n        for (d = 0; d < 10; d++) same += cnt[d] * (cnt[d] - 1) / 2;\n        total += n * (n - 1) / 2 - same;\n    }\n    return total;\n}`,
        java: `public static int sumDigitDifferences(int[] nums) {\n    int n = nums.length;\n    int[] work = nums.clone();\n    int digits = 0;\n    for (int v = nums[0]; v > 0; v /= 10) digits++;\n    if (digits == 0) digits = 1;\n    long total = 0;\n    for (int p = 0; p < digits; p++) {\n        int[] cnt = new int[10];\n        for (int i = 0; i < n; i++) {\n            cnt[work[i] % 10]++;\n            work[i] /= 10;\n        }\n        long same = 0;\n        for (int d = 0; d < 10; d++) same += (long) cnt[d] * (cnt[d] - 1) / 2;\n        total += (long) n * (n - 1) / 2 - same;\n    }\n    return (int) total;\n}`,
        cpp: `int sumDigitDifferences(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> work = nums;\n    int digits = 0;\n    for (int v = nums[0]; v > 0; v /= 10) digits++;\n    if (digits == 0) digits = 1;\n    long long total = 0;\n    for (int p = 0; p < digits; p++) {\n        int cnt[10] = {0};\n        for (int i = 0; i < n; i++) {\n            cnt[work[i] % 10]++;\n            work[i] /= 10;\n        }\n        long long same = 0;\n        for (int d = 0; d < 10; d++) same += (long long) cnt[d] * (cnt[d] - 1) / 2;\n        total += (long long) n * (n - 1) / 2 - same;\n    }\n    return (int) total;\n}`,
        c: `int sumDigitDifferences(int* nums, int numsSize) {\n    int n = numsSize;\n    int* work = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) work[i] = nums[i];\n    int digits = 0;\n    for (int v = nums[0]; v > 0; v /= 10) digits++;\n    if (digits == 0) digits = 1;\n    long long total = 0;\n    for (int p = 0; p < digits; p++) {\n        int cnt[10];\n        for (int d = 0; d < 10; d++) cnt[d] = 0;\n        for (int i = 0; i < n; i++) {\n            cnt[work[i] % 10]++;\n            work[i] /= 10;\n        }\n        long long same = 0;\n        for (int d = 0; d < 10; d++) same += (long long) cnt[d] * (cnt[d] - 1) / 2;\n        total += (long long) n * (n - 1) / 2 - same;\n    }\n    free(work);\n    return (int) total;\n}`,
        csharp: `public static int SumDigitDifferences(int[] nums)\n{\n    int n = nums.Length;\n    var work = (int[]) nums.Clone();\n    int digits = 0;\n    for (int v = nums[0]; v > 0; v /= 10) digits++;\n    if (digits == 0) digits = 1;\n    long total = 0;\n    for (int p = 0; p < digits; p++)\n    {\n        var cnt = new int[10];\n        for (int i = 0; i < n; i++)\n        {\n            cnt[work[i] % 10]++;\n            work[i] /= 10;\n        }\n        long same = 0;\n        for (int d = 0; d < 10; d++) same += (long) cnt[d] * (cnt[d] - 1) / 2;\n        total += (long) n * (n - 1) / 2 - same;\n    }\n    return (int) total;\n}`,
        go: `func sumDigitDifferences(nums []int) int {\n\tn := len(nums)\n\twork := make([]int, n)\n\tcopy(work, nums)\n\tdigits := 0\n\tfor v := nums[0]; v > 0; v /= 10 {\n\t\tdigits++\n\t}\n\tif digits == 0 {\n\t\tdigits = 1\n\t}\n\ttotal := 0\n\tfor p := 0; p < digits; p++ {\n\t\tvar cnt [10]int\n\t\tfor i := 0; i < n; i++ {\n\t\t\tcnt[work[i]%10]++\n\t\t\twork[i] /= 10\n\t\t}\n\t\tsame := 0\n\t\tfor d := 0; d < 10; d++ {\n\t\t\tsame += cnt[d] * (cnt[d] - 1) / 2\n\t\t}\n\t\ttotal += n*(n-1)/2 - same\n\t}\n\treturn total\n}`,
        kotlin: `fun sumDigitDifferences(nums: IntArray): Int {\n    val n = nums.size\n    val work = nums.copyOf()\n    var digits = 0\n    var v = nums[0]\n    while (v > 0) {\n        digits++\n        v /= 10\n    }\n    if (digits == 0) digits = 1\n    var total = 0L\n    for (p in 0 until digits) {\n        val cnt = IntArray(10)\n        for (i in 0 until n) {\n            cnt[work[i] % 10]++\n            work[i] /= 10\n        }\n        var same = 0L\n        for (d in 0 until 10) same += cnt[d].toLong() * (cnt[d] - 1) / 2\n        total += n.toLong() * (n - 1) / 2 - same\n    }\n    return total.toInt()\n}`,
        swift: `func sumDigitDifferences(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var work = nums\n    var digits = 0\n    var v = nums[0]\n    while v > 0 {\n        digits += 1\n        v /= 10\n    }\n    if digits == 0 { digits = 1 }\n    var total = 0\n    for _ in 0..<digits {\n        var cnt = [Int](repeating: 0, count: 10)\n        for i in 0..<n {\n            cnt[work[i] % 10] += 1\n            work[i] /= 10\n        }\n        var same = 0\n        for d in 0..<10 { same += cnt[d] * (cnt[d] - 1) / 2 }\n        total += n * (n - 1) / 2 - same\n    }\n    return total\n}`,
        rust: `fn sumDigitDifferences(nums: Vec<i32>) -> i32 {\n    let n = nums.len() as i64;\n    let mut work = nums.clone();\n    let mut digits = 0;\n    let mut v = nums[0];\n    while v > 0 {\n        digits += 1;\n        v /= 10;\n    }\n    if digits == 0 {\n        digits = 1;\n    }\n    let mut total: i64 = 0;\n    for _ in 0..digits {\n        let mut cnt = [0i64; 10];\n        for x in work.iter_mut() {\n            cnt[(*x % 10) as usize] += 1;\n            *x /= 10;\n        }\n        let mut same: i64 = 0;\n        for d in 0..10 {\n            same += cnt[d] * (cnt[d] - 1) / 2;\n        }\n        total += n * (n - 1) / 2 - same;\n    }\n    total as i32\n}`,
        php: `function sumDigitDifferences($nums) {\n    $n = count($nums);\n    $work = $nums;\n    $digits = 0;\n    for ($v = $nums[0]; $v > 0; $v = intdiv($v, 10)) $digits++;\n    if ($digits === 0) $digits = 1;\n    $total = 0;\n    for ($p = 0; $p < $digits; $p++) {\n        $cnt = array_fill(0, 10, 0);\n        for ($i = 0; $i < $n; $i++) {\n            $cnt[$work[$i] % 10]++;\n            $work[$i] = intdiv($work[$i], 10);\n        }\n        $same = 0;\n        for ($d = 0; $d < 10; $d++) $same += intdiv($cnt[$d] * ($cnt[$d] - 1), 2);\n        $total += intdiv($n * ($n - 1), 2) - $same;\n    }\n    return $total;\n}`,
        ruby: `def sumDigitDifferences(nums)\n  n = nums.length\n  work = nums.dup\n  digits = nums[0].to_s.length\n  total = 0\n  digits.times do\n    cnt = Array.new(10, 0)\n    (0...n).each do |i|\n      cnt[work[i] % 10] += 1\n      work[i] /= 10\n    end\n    same = cnt.sum { |c| c * (c - 1) / 2 }\n    total += n * (n - 1) / 2 - same\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count the Number of Incremovable Subarrays I (LC 2970) ──────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let count = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          let ok = true;
          let prev = -1;
          for (let t = 0; t < n && ok; t++) {
            if (t >= i && t <= j) continue;
            if (prev !== -1 && nums[t] <= prev) ok = false;
            prev = nums[t];
          }
          if (ok) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-the-number-of-incremovable-subarrays-i",
      title: "Count the Number of Incremovable Subarrays I",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Enumeration", "Amazon", "Google", "Wipro"],
      signature: { funcName: "incremovableSubarrayCount", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **incremovable** if removing it leaves the array **strictly increasing**. The empty array counts as strictly increasing, and a subarray must be non-empty and contiguous.\n\nReturn the number of incremovable subarrays of `nums`.",
        [
          { in: "nums = [1,2,3,4]", out: "10", note: "Already increasing, so every one of the 10 subarrays qualifies." },
          { in: "nums = [6,5,7,8]", out: "7", note: "Removing `[7]`, `[7,8]` or `[8]` leaves the `6,5` descent in place." },
          { in: "nums = [8,7,6,6]", out: "3", note: "Only `[8,7,6]`, `[8,7,6,6]` and `[7,6,6]` work." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "With `n <= 50` there are at most 1275 subarrays — each one can simply be tested.",
        "After removing `nums[i..j]`, the remainder is the prefix before `i` followed by the suffix after `j`.",
        "Removing everything leaves the empty array, which counts.",
      ],
      editorial: explain({
        idea: "Enumerate every subarray `[i..j]` and check whether the concatenation of the untouched prefix and suffix is strictly increasing. At `n <= 50` this direct check is fast enough, and it is the version of the problem where clarity beats cleverness.",
        steps: [
          "For each pair `i <= j`, walk the array skipping indices `i` through `j`.",
          "Track the previous surviving value and fail as soon as a value is not strictly greater.",
          "Count the pairs that survive.",
        ],
        why: "Walking the array with the removed range skipped avoids building a new array per candidate, so the inner check is a single pass with no allocation. The linear-time solution required by version II instead finds the longest increasing prefix and suffix and pairs them with two pointers — but at this size the cubic enumeration is under 150 000 steps.",
        time: "O(n³)",
        space: "O(1)",
        pitfalls: [
          "The whole array is a valid subarray, and removing it leaves the empty array — which counts.",
          "\"Strictly\" increasing: equal adjacent survivors fail.",
          "The prefix and suffix must also be increasing **across** the join, not just internally.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "10" },
        { input: "[6,5,7,8]", expectedOutput: "7" },
        { input: "[8,7,6,6]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 12));
        if (rng() < 0.3) nums.sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef incremovableSubarrayCount(nums: List[int]) -> int:\n    n = len(nums)\n    count = 0\n    for i in range(n):\n        for j in range(i, n):\n            ok = True\n            prev = -1\n            for t in range(n):\n                if i <= t <= j:\n                    continue\n                if prev != -1 and nums[t] <= prev:\n                    ok = False\n                    break\n                prev = nums[t]\n            if ok:\n                count += 1\n    return count`,
        javascript: `var incremovableSubarrayCount = function(nums) {\n    var n = nums.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        for (var j = i; j < n; j++) {\n            var ok = true, prev = -1;\n            for (var t = 0; t < n; t++) {\n                if (t >= i && t <= j) continue;\n                if (prev !== -1 && nums[t] <= prev) { ok = false; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n};`,
        typescript: `function incremovableSubarrayCount(nums: number[]): number {\n    var n = nums.length, count = 0;\n    for (var i = 0; i < n; i++) {\n        for (var j = i; j < n; j++) {\n            var ok = true, prev = -1;\n            for (var t = 0; t < n; t++) {\n                if (t >= i && t <= j) continue;\n                if (prev !== -1 && nums[t] <= prev) { ok = false; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n}`,
        java: `public static int incremovableSubarrayCount(int[] nums) {\n    int n = nums.length, count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            boolean ok = true;\n            int prev = -1;\n            for (int t = 0; t < n; t++) {\n                if (t >= i && t <= j) continue;\n                if (prev != -1 && nums[t] <= prev) { ok = false; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n}`,
        cpp: `int incremovableSubarrayCount(vector<int>& nums) {\n    int n = (int) nums.size(), count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            bool ok = true;\n            int prev = -1;\n            for (int t = 0; t < n; t++) {\n                if (t >= i && t <= j) continue;\n                if (prev != -1 && nums[t] <= prev) { ok = false; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n}`,
        c: `int incremovableSubarrayCount(int* nums, int numsSize) {\n    int n = numsSize, count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            int ok = 1, prev = -1;\n            for (int t = 0; t < n; t++) {\n                if (t >= i && t <= j) continue;\n                if (prev != -1 && nums[t] <= prev) { ok = 0; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int IncremovableSubarrayCount(int[] nums)\n{\n    int n = nums.Length, count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = i; j < n; j++)\n        {\n            bool ok = true;\n            int prev = -1;\n            for (int t = 0; t < n; t++)\n            {\n                if (t >= i && t <= j) continue;\n                if (prev != -1 && nums[t] <= prev) { ok = false; break; }\n                prev = nums[t];\n            }\n            if (ok) count++;\n        }\n    }\n    return count;\n}`,
        go: `func incremovableSubarrayCount(nums []int) int {\n\tn := len(nums)\n\tcount := 0\n\tfor i := 0; i < n; i++ {\n\t\tfor j := i; j < n; j++ {\n\t\t\tok := true\n\t\t\tprev := -1\n\t\t\tfor t := 0; t < n; t++ {\n\t\t\t\tif t >= i && t <= j {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif prev != -1 && nums[t] <= prev {\n\t\t\t\t\tok = false\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t\tprev = nums[t]\n\t\t\t}\n\t\t\tif ok {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun incremovableSubarrayCount(nums: IntArray): Int {\n    val n = nums.size\n    var count = 0\n    for (i in 0 until n) {\n        for (j in i until n) {\n            var ok = true\n            var prev = -1\n            for (t in 0 until n) {\n                if (t in i..j) continue\n                if (prev != -1 && nums[t] <= prev) {\n                    ok = false\n                    break\n                }\n                prev = nums[t]\n            }\n            if (ok) count++\n        }\n    }\n    return count\n}`,
        swift: `func incremovableSubarrayCount(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var count = 0\n    for i in 0..<n {\n        for j in i..<n {\n            var ok = true\n            var prev = -1\n            for t in 0..<n {\n                if t >= i && t <= j { continue }\n                if prev != -1 && nums[t] <= prev {\n                    ok = false\n                    break\n                }\n                prev = nums[t]\n            }\n            if ok { count += 1 }\n        }\n    }\n    return count\n}`,
        rust: `fn incremovableSubarrayCount(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut count = 0;\n    for i in 0..n {\n        for j in i..n {\n            let mut ok = true;\n            let mut prev = -1i32;\n            for t in 0..n {\n                if t >= i && t <= j {\n                    continue;\n                }\n                if prev != -1 && nums[t] <= prev {\n                    ok = false;\n                    break;\n                }\n                prev = nums[t];\n            }\n            if ok {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
        php: `function incremovableSubarrayCount($nums) {\n    $n = count($nums);\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i; $j < $n; $j++) {\n            $ok = true;\n            $prev = -1;\n            for ($t = 0; $t < $n; $t++) {\n                if ($t >= $i && $t <= $j) continue;\n                if ($prev !== -1 && $nums[$t] <= $prev) { $ok = false; break; }\n                $prev = $nums[$t];\n            }\n            if ($ok) $count++;\n        }\n    }\n    return $count;\n}`,
        ruby: `def incremovableSubarrayCount(nums)\n  n = nums.length\n  count = 0\n  (0...n).each do |i|\n    (i...n).each do |j|\n      ok = true\n      prev = -1\n      (0...n).each do |t|\n        next if t >= i && t <= j\n        if prev != -1 && nums[t] <= prev\n          ok = false\n          break\n        end\n        prev = nums[t]\n      end\n      count += 1 if ok\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Exceed Threshold Value II (LC 3066) ───
  (() => {
    const combineAll = (nums: number[]) => {
      const h = nums.slice().sort((a, b) => a - b);
      while (h.length > 1) {
        const x = h.shift() as number;
        const y = h.shift() as number;
        const v = 2 * x + y;
        let lo = 0, hi = h.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (h[mid] < v) lo = mid + 1; else hi = mid; }
        h.splice(lo, 0, v);
      }
      return h[0];
    };
    const ref = (nums: number[], k: number) => {
      const h = nums.slice().sort((a, b) => a - b);
      let ops = 0;
      while (h.length > 1 && h[0] < k) {
        const x = h.shift() as number;
        const y = h.shift() as number;
        const v = 2 * x + y;
        let lo = 0, hi = h.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (h[mid] < v) lo = mid + 1; else hi = mid; }
        h.splice(lo, 0, v);
        ops++;
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-exceed-threshold-value-ii",
      title: "Minimum Operations to Exceed Threshold Value II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Heap (Priority Queue)", "Simulation", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "minOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In one operation you take the **two smallest** values `x` and `y` in `nums`, remove both, and add `min(x, y) * 2 + max(x, y)` back.\n\nReturn the minimum number of operations needed until every value in `nums` is at least `k`. The input guarantees this is reachable.",
        [
          { in: "nums = [2,11,10,1,3], k = 10", out: "2", note: "`1,2` become 4; then `3,4` become 10, leaving `[10,10,11]`." },
          { in: "nums = [1,1,2,4,9], k = 20", out: "4", note: "Four merges take the array to `[33]`." },
          { in: "nums = [1,2], k = 3", out: "1", note: "One merge gives 4." },
        ],
        ["2 <= nums.length <= 1000", "1 <= nums[i] <= 10^5", "1 <= k <= 10^5", "The input is generated such that an answer always exists."]),
      hints: [
        "You never gain by merging anything other than the two smallest values.",
        "A min-heap gives you both in O(log n) and puts the result back just as cheaply.",
        "Stop as soon as the heap's minimum reaches `k` — everything else is already at least that.",
      ],
      editorial: explain({
        idea: "Greedily merge the two smallest values with a min-heap, counting operations until the heap's smallest value reaches `k`.",
        steps: [
          "Heapify `nums` as a min-heap.",
          "While the root is below `k`, pop twice, push `2 * min + max`, and count the operation.",
          "Return the count.",
        ],
        why: "The two smallest are always the right pair to merge: any value below `k` must eventually be consumed, and consuming it alongside the next-smallest is the cheapest way to lift it, since the result grows with whatever it is paired against. Checking only the root is enough — a heap's minimum reaching `k` means every element has.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`min(x, y) * 2 + max(x, y)` is not symmetric — doubling the larger value gives a different, wrong result.",
          "The merged value goes back into the heap and can be merged again.",
          "Re-sorting the whole array after each merge is O(n² log n) and needlessly slow.",
        ],
      }),
      examples: [
        { input: "[2,11,10,1,3]\n10", expectedOutput: "2" },
        { input: "[1,1,2,4,9]\n20", expectedOutput: "4" },
        { input: "[1,2]\n3", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 10);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 30));
        // Cap k at the value everything collapses to, so an answer always exists.
        const k = ri(rng, 1, combineAll(nums));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `import heapq\nfrom typing import List\n\ndef minOperations(nums: List[int], k: int) -> int:\n    heap = nums[:]\n    heapq.heapify(heap)\n    ops = 0\n    while len(heap) > 1 and heap[0] < k:\n        x = heapq.heappop(heap)\n        y = heapq.heappop(heap)\n        heapq.heappush(heap, x * 2 + y)\n        ops += 1\n    return ops`,
        javascript: `var minOperations = function(nums, k) {\n    var heap = nums.slice();\n    var sift = function(j) {\n        for (;;) {\n            var l = 2 * j + 1, r = l + 1, s = j;\n            if (l < heap.length && heap[l] < heap[s]) s = l;\n            if (r < heap.length && heap[r] < heap[s]) s = r;\n            if (s === j) break;\n            var t = heap[s]; heap[s] = heap[j]; heap[j] = t;\n            j = s;\n        }\n    };\n    var push = function(v) {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] <= heap[i]) break;\n            var t = heap[p]; heap[p] = heap[i]; heap[i] = t;\n            i = p;\n        }\n    };\n    var pop = function() {\n        var top = heap[0];\n        var last = heap.pop();\n        if (heap.length > 0) { heap[0] = last; sift(0); }\n        return top;\n    };\n    for (var i = Math.floor(heap.length / 2) - 1; i >= 0; i--) sift(i);\n    var ops = 0;\n    while (heap.length > 1 && heap[0] < k) {\n        var x = pop(), y = pop();\n        push(x * 2 + y);\n        ops++;\n    }\n    return ops;\n};`,
        typescript: `function minOperations(nums: number[], k: number): number {\n    var heap = nums.slice();\n    var sift = function(j: number) {\n        for (;;) {\n            var l = 2 * j + 1, r = l + 1, s = j;\n            if (l < heap.length && heap[l] < heap[s]) s = l;\n            if (r < heap.length && heap[r] < heap[s]) s = r;\n            if (s === j) break;\n            var t = heap[s]; heap[s] = heap[j]; heap[j] = t;\n            j = s;\n        }\n    };\n    var push = function(v: number) {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] <= heap[i]) break;\n            var t = heap[p]; heap[p] = heap[i]; heap[i] = t;\n            i = p;\n        }\n    };\n    var pop = function(): number {\n        var top = heap[0];\n        var last = heap.pop() as number;\n        if (heap.length > 0) { heap[0] = last; sift(0); }\n        return top;\n    };\n    for (var i = Math.floor(heap.length / 2) - 1; i >= 0; i--) sift(i);\n    var ops = 0;\n    while (heap.length > 1 && heap[0] < k) {\n        var x = pop(), y = pop();\n        push(x * 2 + y);\n        ops++;\n    }\n    return ops;\n}`,
        java: `public static int minOperations(int[] nums, int k) {\n    PriorityQueue<Integer> heap = new PriorityQueue<>();\n    for (int v : nums) heap.add(v);\n    int ops = 0;\n    while (heap.size() > 1 && heap.peek() < k) {\n        int x = heap.poll();\n        int y = heap.poll();\n        heap.add(x * 2 + y);\n        ops++;\n    }\n    return ops;\n}`,
        cpp: `int minOperations(vector<int>& nums, int k) {\n    priority_queue<int, vector<int>, greater<int>> heap(nums.begin(), nums.end());\n    int ops = 0;\n    while ((int) heap.size() > 1 && heap.top() < k) {\n        int x = heap.top(); heap.pop();\n        int y = heap.top(); heap.pop();\n        heap.push(x * 2 + y);\n        ops++;\n    }\n    return ops;\n}`,
        c: `static void moSift(int* heap, int size, int j) {\n    for (;;) {\n        int l = 2 * j + 1, r = l + 1, s = j;\n        if (l < size && heap[l] < heap[s]) s = l;\n        if (r < size && heap[r] < heap[s]) s = r;\n        if (s == j) break;\n        int t = heap[s]; heap[s] = heap[j]; heap[j] = t;\n        j = s;\n    }\n}\n\nint minOperations(int* nums, int numsSize, int k) {\n    int* heap = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) heap[i] = nums[i];\n    int size = numsSize;\n    for (int i = size / 2 - 1; i >= 0; i--) moSift(heap, size, i);\n    int ops = 0;\n    while (size > 1 && heap[0] < k) {\n        int x = heap[0];\n        heap[0] = heap[--size];\n        moSift(heap, size, 0);\n        int y = heap[0];\n        heap[0] = x * 2 + y;\n        moSift(heap, size, 0);\n        ops++;\n    }\n    free(heap);\n    return ops;\n}`,
        csharp: `private static void MoSift(int[] heap, int size, int j)\n{\n    for (;;)\n    {\n        int l = 2 * j + 1, r = l + 1, s = j;\n        if (l < size && heap[l] < heap[s]) s = l;\n        if (r < size && heap[r] < heap[s]) s = r;\n        if (s == j) break;\n        int t = heap[s]; heap[s] = heap[j]; heap[j] = t;\n        j = s;\n    }\n}\n\npublic static int MinOperations(int[] nums, int k)\n{\n    var heap = (int[]) nums.Clone();\n    int size = heap.Length;\n    for (int i = size / 2 - 1; i >= 0; i--) MoSift(heap, size, i);\n    int ops = 0;\n    while (size > 1 && heap[0] < k)\n    {\n        int x = heap[0];\n        size--;\n        heap[0] = heap[size];\n        MoSift(heap, size, 0);\n        int y = heap[0];\n        heap[0] = x * 2 + y;\n        MoSift(heap, size, 0);\n        ops++;\n    }\n    return ops;\n}`,
        go: `type moHeap []int\n\nfunc (h moHeap) Len() int            { return len(h) }\nfunc (h moHeap) Less(i, j int) bool  { return h[i] < h[j] }\nfunc (h moHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }\nfunc (h *moHeap) Push(x interface{}) { *h = append(*h, x.(int)) }\nfunc (h *moHeap) Pop() interface{} {\n\told := *h\n\tn := len(old)\n\tv := old[n-1]\n\t*h = old[:n-1]\n\treturn v\n}\n\nfunc minOperations(nums []int, k int) int {\n\th := make(moHeap, len(nums))\n\tcopy(h, nums)\n\theap.Init(&h)\n\tops := 0\n\tfor h.Len() > 1 && h[0] < k {\n\t\tx := heap.Pop(&h).(int)\n\t\ty := heap.Pop(&h).(int)\n\t\theap.Push(&h, x*2+y)\n\t\tops++\n\t}\n\treturn ops\n}`,
        kotlin: `fun minOperations(nums: IntArray, k: Int): Int {\n    val heap = java.util.PriorityQueue<Int>()\n    for (v in nums) heap.add(v)\n    var ops = 0\n    while (heap.size > 1 && heap.peek() < k) {\n        val x = heap.poll()\n        val y = heap.poll()\n        heap.add(x * 2 + y)\n        ops++\n    }\n    return ops\n}`,
        swift: `func minOperations(_ nums: [Int], _ k: Int) -> Int {\n    var heap = nums\n    var size = heap.count\n    func sift(_ start: Int) {\n        var j = start\n        while true {\n            let l = 2 * j + 1\n            let r = l + 1\n            var s = j\n            if l < size && heap[l] < heap[s] { s = l }\n            if r < size && heap[r] < heap[s] { s = r }\n            if s == j { break }\n            heap.swapAt(s, j)\n            j = s\n        }\n    }\n    var i = size / 2 - 1\n    while i >= 0 {\n        sift(i)\n        i -= 1\n    }\n    var ops = 0\n    while size > 1 && heap[0] < k {\n        let x = heap[0]\n        size -= 1\n        heap[0] = heap[size]\n        sift(0)\n        let y = heap[0]\n        heap[0] = x * 2 + y\n        sift(0)\n        ops += 1\n    }\n    return ops\n}`,
        rust: `fn minOperations(nums: Vec<i32>, k: i32) -> i32 {\n    use std::collections::BinaryHeap;\n    use std::cmp::Reverse;\n    let mut heap: BinaryHeap<Reverse<i32>> = nums.into_iter().map(Reverse).collect();\n    let mut ops = 0;\n    while heap.len() > 1 {\n        if let Some(&Reverse(top)) = heap.peek() {\n            if top >= k {\n                break;\n            }\n        }\n        let Reverse(x) = heap.pop().unwrap();\n        let Reverse(y) = heap.pop().unwrap();\n        heap.push(Reverse(x * 2 + y));\n        ops += 1;\n    }\n    ops\n}`,
        php: `function minOperations($nums, $k) {\n    $heap = new \\SplMinHeap();\n    foreach ($nums as $v) $heap->insert($v);\n    $ops = 0;\n    while ($heap->count() > 1 && $heap->top() < $k) {\n        $x = $heap->extract();\n        $y = $heap->extract();\n        $heap->insert($x * 2 + $y);\n        $ops++;\n    }\n    return $ops;\n}`,
        ruby: `def minOperations(nums, k)\n  heap = nums.dup\n  size = heap.length\n  sift = lambda do |start|\n    j = start\n    loop do\n      l = 2 * j + 1\n      r = l + 1\n      s = j\n      s = l if l < size && heap[l] < heap[s]\n      s = r if r < size && heap[r] < heap[s]\n      break if s == j\n      heap[s], heap[j] = heap[j], heap[s]\n      j = s\n    end\n  end\n  (size / 2 - 1).downto(0) { |i| sift.call(i) }\n  ops = 0\n  while size > 1 && heap[0] < k\n    x = heap[0]\n    size -= 1\n    heap[0] = heap[size]\n    sift.call(0)\n    y = heap[0]\n    heap[0] = x * 2 + y\n    sift.call(0)\n    ops += 1\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Find the Integer Added to Array II (LC 3132) ────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      const a = nums1.slice().sort((p, q) => p - q);
      const b = nums2.slice().sort((p, q) => p - q);
      let best = 0, found = false;
      for (let i = 0; i < 3; i++) {
        const x = b[0] - a[i];
        let j = 0;
        for (let t = 0; t < a.length && j < b.length; t++) {
          if (a[t] + x === b[j]) j++;
        }
        if (j === b.length && (!found || x < best)) { best = x; found = true; }
      }
      return best;
    };
    return {
      slug: "find-the-integer-added-to-array-ii",
      title: "Find the Integer Added to Array II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Enumeration", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minimumAddedInteger", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums1` holds exactly two more elements than `nums2`. Remove **two** elements from `nums1` and then add the same integer `x` — possibly negative — to every remaining element. `nums1` and `nums2` are then **equal** when both are treated as multisets: the same values with the same counts, in any order.\n\nReturn the **minimum** possible `x`. The input guarantees at least one choice works.",
        [
          { in: "nums1 = [4,20,16,12,8], nums2 = [14,18,10]", out: "-2", note: "Drop 4 and 8, then `12,16,20` shift down by 2." },
          { in: "nums1 = [3,5,5,3], nums2 = [7,7]", out: "2", note: "Drop the two 3s and shift the 5s up by 2." },
          { in: "nums1 = [2,3,1], nums2 = [1]", out: "-2", note: "Keep only the 3 and shift it down by 2." },
        ],
        ["3 <= nums1.length <= 200", "nums2.length == nums1.length - 2", "0 <= nums1[i], nums2[i] <= 1000", "The test cases are generated in a way that there is an integer x such that nums1 can become equal to nums2 by removing two elements and adding x to each element of nums1."]),
      hints: [
        "Sort both arrays. The smallest surviving element of `nums1` must map to the smallest element of `nums2`.",
        "Only two elements are dropped, so that survivor is one of the first three of the sorted `nums1`.",
        "For each of those three candidates, `x` is forced — then check it greedily with two pointers.",
      ],
      editorial: explain({
        idea: "Sort both arrays. Whatever two elements are dropped, the smallest survivor is among the first three of the sorted `nums1`, so there are only three candidate values of `x` — one per choice. Test each with a greedy two-pointer match and keep the smallest that works.",
        steps: [
          "Sort `nums1` and `nums2` ascending.",
          "For `i` in 0, 1, 2: set `x = nums2[0] - nums1[i]`.",
          "Walk `nums1` left to right with a pointer into `nums2`, advancing it whenever `nums1[t] + x` equals the current target.",
          "If the pointer reaches the end of `nums2`, the candidate is valid; return the smallest valid `x`.",
        ],
        why: "Sorting is what makes the greedy match correct: with both arrays ascending, matching each target against the earliest element that fits never blocks a later match, because any element that could serve a later target could also have served this one. And bounding the search to three candidates is the whole trick — only two elements are removed, so at most two can precede the smallest survivor.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`x` may be negative; do not assume the arrays only grow.",
          "Testing only `nums2[0] - nums1[0]` misses the cases where the smallest one or two elements are the ones dropped.",
          "Duplicate values make a set-based comparison wrong — the match must respect multiplicities.",
        ],
      }),
      examples: [
        { input: "[4,20,16,12,8]\n[14,18,10]", expectedOutput: "-2" },
        { input: "[3,5,5,3]\n[7,7]", expectedOutput: "2" },
        { input: "[2,3,1]\n[1]", expectedOutput: "-2" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 8);
        const x = ri(rng, -20, 20);
        const kept = Array.from({ length: m }, () => ri(rng, 30, 80));
        const nums2 = kept.map((v) => v + x);
        const nums1 = shuffle(rng, kept.concat([ri(rng, 30, 80), ri(rng, 30, 80)]));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumAddedInteger(nums1: List[int], nums2: List[int]) -> int:\n    a = sorted(nums1)\n    b = sorted(nums2)\n    best = None\n    for i in range(3):\n        x = b[0] - a[i]\n        j = 0\n        for v in a:\n            if j < len(b) and v + x == b[j]:\n                j += 1\n        if j == len(b) and (best is None or x < best):\n            best = x\n    return best`,
        javascript: `var minimumAddedInteger = function(nums1, nums2) {\n    var a = nums1.slice().sort(function(p, q) { return p - q; });\n    var b = nums2.slice().sort(function(p, q) { return p - q; });\n    var best = 0, found = false;\n    for (var i = 0; i < 3; i++) {\n        var x = b[0] - a[i];\n        var j = 0;\n        for (var t = 0; t < a.length && j < b.length; t++) {\n            if (a[t] + x === b[j]) j++;\n        }\n        if (j === b.length && (!found || x < best)) { best = x; found = true; }\n    }\n    return best;\n};`,
        typescript: `function minimumAddedInteger(nums1: number[], nums2: number[]): number {\n    var a = nums1.slice().sort(function(p: number, q: number) { return p - q; });\n    var b = nums2.slice().sort(function(p: number, q: number) { return p - q; });\n    var best = 0, found = false;\n    for (var i = 0; i < 3; i++) {\n        var x = b[0] - a[i];\n        var j = 0;\n        for (var t = 0; t < a.length && j < b.length; t++) {\n            if (a[t] + x === b[j]) j++;\n        }\n        if (j === b.length && (!found || x < best)) { best = x; found = true; }\n    }\n    return best;\n}`,
        java: `public static int minimumAddedInteger(int[] nums1, int[] nums2) {\n    int[] a = nums1.clone();\n    int[] b = nums2.clone();\n    Arrays.sort(a);\n    Arrays.sort(b);\n    int best = 0;\n    boolean found = false;\n    for (int i = 0; i < 3; i++) {\n        int x = b[0] - a[i];\n        int j = 0;\n        for (int t = 0; t < a.length && j < b.length; t++) {\n            if (a[t] + x == b[j]) j++;\n        }\n        if (j == b.length && (!found || x < best)) {\n            best = x;\n            found = true;\n        }\n    }\n    return best;\n}`,
        cpp: `int minimumAddedInteger(vector<int>& nums1, vector<int>& nums2) {\n    vector<int> a = nums1, b = nums2;\n    sort(a.begin(), a.end());\n    sort(b.begin(), b.end());\n    int best = 0;\n    bool found = false;\n    for (int i = 0; i < 3; i++) {\n        int x = b[0] - a[i];\n        size_t j = 0;\n        for (size_t t = 0; t < a.size() && j < b.size(); t++) {\n            if (a[t] + x == b[j]) j++;\n        }\n        if (j == b.size() && (!found || x < best)) {\n            best = x;\n            found = true;\n        }\n    }\n    return best;\n}`,
        c: `static int maiCmp(const void* p, const void* q) {\n    int x = *(const int*) p;\n    int y = *(const int*) q;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint minimumAddedInteger(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int* a = (int*) malloc((size_t) nums1Size * sizeof(int));\n    int* b = (int*) malloc((size_t) nums2Size * sizeof(int));\n    for (int i = 0; i < nums1Size; i++) a[i] = nums1[i];\n    for (int i = 0; i < nums2Size; i++) b[i] = nums2[i];\n    qsort(a, (size_t) nums1Size, sizeof(int), maiCmp);\n    qsort(b, (size_t) nums2Size, sizeof(int), maiCmp);\n    int best = 0, found = 0;\n    for (int i = 0; i < 3; i++) {\n        int x = b[0] - a[i];\n        int j = 0;\n        for (int t = 0; t < nums1Size && j < nums2Size; t++) {\n            if (a[t] + x == b[j]) j++;\n        }\n        if (j == nums2Size && (!found || x < best)) {\n            best = x;\n            found = 1;\n        }\n    }\n    free(a);\n    free(b);\n    return best;\n}`,
        csharp: `public static int MinimumAddedInteger(int[] nums1, int[] nums2)\n{\n    var a = (int[]) nums1.Clone();\n    var b = (int[]) nums2.Clone();\n    Array.Sort(a);\n    Array.Sort(b);\n    int best = 0;\n    bool found = false;\n    for (int i = 0; i < 3; i++)\n    {\n        int x = b[0] - a[i];\n        int j = 0;\n        for (int t = 0; t < a.Length && j < b.Length; t++)\n        {\n            if (a[t] + x == b[j]) j++;\n        }\n        if (j == b.Length && (!found || x < best))\n        {\n            best = x;\n            found = true;\n        }\n    }\n    return best;\n}`,
        go: `func minimumAddedInteger(nums1 []int, nums2 []int) int {\n\ta := make([]int, len(nums1))\n\tb := make([]int, len(nums2))\n\tcopy(a, nums1)\n\tcopy(b, nums2)\n\tsort.Ints(a)\n\tsort.Ints(b)\n\tbest, found := 0, false\n\tfor i := 0; i < 3; i++ {\n\t\tx := b[0] - a[i]\n\t\tj := 0\n\t\tfor t := 0; t < len(a) && j < len(b); t++ {\n\t\t\tif a[t]+x == b[j] {\n\t\t\t\tj++\n\t\t\t}\n\t\t}\n\t\tif j == len(b) && (!found || x < best) {\n\t\t\tbest = x\n\t\t\tfound = true\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumAddedInteger(nums1: IntArray, nums2: IntArray): Int {\n    val a = nums1.sortedArray()\n    val b = nums2.sortedArray()\n    var best = 0\n    var found = false\n    for (i in 0 until 3) {\n        val x = b[0] - a[i]\n        var j = 0\n        var t = 0\n        while (t < a.size && j < b.size) {\n            if (a[t] + x == b[j]) j++\n            t++\n        }\n        if (j == b.size && (!found || x < best)) {\n            best = x\n            found = true\n        }\n    }\n    return best\n}`,
        swift: `func minimumAddedInteger(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    let a = nums1.sorted()\n    let b = nums2.sorted()\n    var best = 0\n    var found = false\n    for i in 0..<3 {\n        let x = b[0] - a[i]\n        var j = 0\n        var t = 0\n        while t < a.count && j < b.count {\n            if a[t] + x == b[j] { j += 1 }\n            t += 1\n        }\n        if j == b.count && (!found || x < best) {\n            best = x\n            found = true\n        }\n    }\n    return best\n}`,
        rust: `fn minimumAddedInteger(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let mut a = nums1.clone();\n    let mut b = nums2.clone();\n    a.sort();\n    b.sort();\n    let mut best = 0i32;\n    let mut found = false;\n    for i in 0..3 {\n        let x = b[0] - a[i];\n        let mut j = 0usize;\n        let mut t = 0usize;\n        while t < a.len() && j < b.len() {\n            if a[t] + x == b[j] {\n                j += 1;\n            }\n            t += 1;\n        }\n        if j == b.len() && (!found || x < best) {\n            best = x;\n            found = true;\n        }\n    }\n    best\n}`,
        php: `function minimumAddedInteger($nums1, $nums2) {\n    $a = $nums1;\n    $b = $nums2;\n    sort($a);\n    sort($b);\n    $best = 0;\n    $found = false;\n    for ($i = 0; $i < 3; $i++) {\n        $x = $b[0] - $a[$i];\n        $j = 0;\n        $n = count($a);\n        $m = count($b);\n        for ($t = 0; $t < $n && $j < $m; $t++) {\n            if ($a[$t] + $x === $b[$j]) $j++;\n        }\n        if ($j === $m && (!$found || $x < $best)) {\n            $best = $x;\n            $found = true;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minimumAddedInteger(nums1, nums2)\n  a = nums1.sort\n  b = nums2.sort\n  best = nil\n  (0...3).each do |i|\n    x = b[0] - a[i]\n    j = 0\n    a.each do |v|\n      j += 1 if j < b.length && v + x == b[j]\n    end\n    best = x if j == b.length && (best.nil? || x < best)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Apply Operations to Maximize Score (LC 2818) ────────────────
  (() => {
    const MOD = 1000000007;
    const mulmod = (a: number, b: number) => {
      // Splitting `a` keeps every partial product under 2^53, which a plain
      // a * b % MOD would blow past once both sides approach 10^9.
      const ah = Math.floor(a / 65536), al = a % 65536;
      return ((ah * b % MOD) * 65536 + al * b) % MOD;
    };
    const powmod = (base: number, exp: number) => {
      let result = 1, b = base % MOD, e = exp;
      while (e > 0) {
        if (e % 2 === 1) result = mulmod(result, b);
        b = mulmod(b, b);
        e = Math.floor(e / 2);
      }
      return result;
    };
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      let maxv = 0;
      for (let i = 0; i < n; i++) if (nums[i] > maxv) maxv = nums[i];
      const sieve = new Array(maxv + 1).fill(0);
      for (let p = 2; p <= maxv; p++) {
        if (sieve[p] === 0) for (let q = p; q <= maxv; q += p) sieve[q]++;
      }
      const s = nums.map((v) => sieve[v]);
      const left = new Array(n).fill(-1);
      const right = new Array(n).fill(n);
      const stack: number[] = [];
      for (let i = 0; i < n; i++) {
        while (stack.length > 0 && s[stack[stack.length - 1]] < s[i]) stack.pop();
        left[i] = stack.length > 0 ? stack[stack.length - 1] : -1;
        stack.push(i);
      }
      stack.length = 0;
      for (let i = n - 1; i >= 0; i--) {
        while (stack.length > 0 && s[stack[stack.length - 1]] <= s[i]) stack.pop();
        right[i] = stack.length > 0 ? stack[stack.length - 1] : n;
        stack.push(i);
      }
      const order = Array.from({ length: n }, (_, i) => i).sort((p, q) => nums[q] - nums[p]);
      let remaining = k, ans = 1;
      for (let t = 0; t < n && remaining > 0; t++) {
        const i = order[t];
        const count = (i - left[i]) * (right[i] - i);
        const take = count < remaining ? count : remaining;
        ans = mulmod(ans, powmod(nums[i], take));
        remaining -= take;
      }
      return ans;
    };
    return {
      slug: "apply-operations-to-maximize-score",
      title: "Apply Operations to Maximize Score",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Stack", "Greedy", "Sorting", "Monotonic Stack", "Number Theory", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maximumScore", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **prime score** of an integer is its number of **distinct** prime factors — the prime score of 300 is 3, since 300 is 2² · 3 · 5².\n\nYour score starts at 1. You may apply the following operation **at most k times**:\n\n- Pick a subarray `nums[l..r]` that you have **not picked before**.\n- Within it, choose the element with the highest prime score; on a tie, choose the one with the **smallest index**.\n- Multiply your score by that element.\n\nReturn the maximum score, **modulo 10⁹ + 7**.",
        [
          { in: "nums = [8,3,9,3,8], k = 2", out: "81", note: "Every value has prime score 1, and `9` wins three different subarrays — so it can be taken twice." },
          { in: "nums = [19,12,14,6,10,18], k = 3", out: "4788", note: "`19` has prime score 1 so it wins only `[19]`; `18`, then `14`, are the next best. 19 · 18 · 14 = 4788." },
          { in: "nums = [2,3,5], k = 1", out: "5" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5", "1 <= k <= min(n * (n + 1) / 2, 10^9)"]),
      hints: [
        "First work out, for each index, **how many** subarrays would choose it. Then it is a pure greedy: spend `k` on the largest values first.",
        "Index `i` wins a subarray `[l, r]` exactly when everything strictly left of it inside the window has a smaller prime score, and everything right has a score no greater.",
        "That is two monotonic stacks: the previous index with score ≥, and the next index with score >. The product of the two gaps is the count.",
      ],
      editorial: explain({
        idea: "Separate the two halves of the problem. First count, for each index, how many subarrays would select it — a classic \"contribution of each element as the window maximum\" computed with two monotonic stacks. Then the operations are unconstrained: sort the values descending and spend `k` on the largest, up to each one's count, accumulating the product with fast exponentiation.",
        steps: [
          "Sieve the distinct-prime-factor count up to `max(nums)`: for each prime `p`, add one to every multiple of `p`.",
          "With a monotonic stack left to right, find `left[i]` — the nearest index before `i` whose score is **≥** `s[i]` (the tie-break sends ties left).",
          "With a stack right to left, find `right[i]` — the nearest index after `i` whose score is strictly **>** `s[i]`.",
          "`count[i] = (i - left[i]) * (right[i] - i)`.",
          "Sort indices by `nums[i]` descending; for each, take `min(k, count[i])` copies via `powmod`, multiply into the answer and reduce `k`.",
          "Stop as soon as `k` reaches 0.",
        ],
        why: "The asymmetry between `≥` on the left and `>` on the right is exactly the leftmost-on-tie rule: an equal score to the left would beat `i`, so it blocks; an equal score to the right would lose, so it does not. Getting this backwards double-counts subarrays whenever two equal scores sit side by side. Once the counts are known the greedy is safe, because every operation is independent — nothing you take restricts what you can take next, so the largest available value is always the right choice.",
        time: "O(n log n + M log log M) where M is max(nums)",
        space: "O(n + M)",
        pitfalls: [
          "`count[i]` can reach about 5 · 10⁹, so it must be held in a 64-bit integer even though the answer fits an int after the modulo.",
          "Multiplying two residues near 10⁹ overflows 53-bit floats — split the multiplication or use 64-bit integers.",
          "Take the product modulo 10⁹ + 7 throughout; the running score is astronomically large otherwise.",
          "Prime score counts **distinct** primes: 8 = 2³ scores 1, not 3.",
        ],
      }),
      examples: [
        { input: "[8,3,9,3,8]\n2", expectedOutput: "81" },
        { input: "[19,12,14,6,10,18]\n3", expectedOutput: "4788" },
        { input: "[2,3,5]\n1", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 60));
        const total = (n * (n + 1)) / 2;
        const k = ri(rng, 1, total < 25 ? total : 25);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumScore(nums: List[int], k: int) -> int:\n    MOD = 10**9 + 7\n    n = len(nums)\n    maxv = max(nums)\n    sieve = [0] * (maxv + 1)\n    for p in range(2, maxv + 1):\n        if sieve[p] == 0:\n            for q in range(p, maxv + 1, p):\n                sieve[q] += 1\n    s = [sieve[v] for v in nums]\n    left = [-1] * n\n    right = [n] * n\n    stack = []\n    for i in range(n):\n        while stack and s[stack[-1]] < s[i]:\n            stack.pop()\n        left[i] = stack[-1] if stack else -1\n        stack.append(i)\n    stack = []\n    for i in range(n - 1, -1, -1):\n        while stack and s[stack[-1]] <= s[i]:\n            stack.pop()\n        right[i] = stack[-1] if stack else n\n        stack.append(i)\n    order = sorted(range(n), key=lambda i: -nums[i])\n    ans = 1\n    for i in order:\n        if k == 0:\n            break\n        count = (i - left[i]) * (right[i] - i)\n        take = min(count, k)\n        ans = ans * pow(nums[i], take, MOD) % MOD\n        k -= take\n    return ans`,
        javascript: `var maximumScore = function(nums, k) {\n    var MOD = 1000000007;\n    var mulmod = function(a, b) {\n        var ah = Math.floor(a / 65536), al = a % 65536;\n        return ((ah * b % MOD) * 65536 + al * b) % MOD;\n    };\n    var powmod = function(base, exp) {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var n = nums.length, i, maxv = 0;\n    for (i = 0; i < n; i++) if (nums[i] > maxv) maxv = nums[i];\n    var sieve = [];\n    for (i = 0; i <= maxv; i++) sieve.push(0);\n    for (var p = 2; p <= maxv; p++) {\n        if (sieve[p] === 0) for (var q = p; q <= maxv; q += p) sieve[q]++;\n    }\n    var s = [], left = [], right = [];\n    for (i = 0; i < n; i++) { s.push(sieve[nums[i]]); left.push(-1); right.push(n); }\n    var stack = [];\n    for (i = 0; i < n; i++) {\n        while (stack.length > 0 && s[stack[stack.length - 1]] < s[i]) stack.pop();\n        left[i] = stack.length > 0 ? stack[stack.length - 1] : -1;\n        stack.push(i);\n    }\n    stack = [];\n    for (i = n - 1; i >= 0; i--) {\n        while (stack.length > 0 && s[stack[stack.length - 1]] <= s[i]) stack.pop();\n        right[i] = stack.length > 0 ? stack[stack.length - 1] : n;\n        stack.push(i);\n    }\n    var order = [];\n    for (i = 0; i < n; i++) order.push(i);\n    order.sort(function(a, b) { return nums[b] - nums[a]; });\n    var remaining = k, ans = 1;\n    for (var t = 0; t < n && remaining > 0; t++) {\n        var idx = order[t];\n        var count = (idx - left[idx]) * (right[idx] - idx);\n        var take = count < remaining ? count : remaining;\n        ans = mulmod(ans, powmod(nums[idx], take));\n        remaining -= take;\n    }\n    return ans;\n};`,
        typescript: `function maximumScore(nums: number[], k: number): number {\n    var MOD = 1000000007;\n    var mulmod = function(a: number, b: number): number {\n        var ah = Math.floor(a / 65536), al = a % 65536;\n        return ((ah * b % MOD) * 65536 + al * b) % MOD;\n    };\n    var powmod = function(base: number, exp: number): number {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var n = nums.length, i: number, maxv = 0;\n    for (i = 0; i < n; i++) if (nums[i] > maxv) maxv = nums[i];\n    var sieve: number[] = [];\n    for (i = 0; i <= maxv; i++) sieve.push(0);\n    for (var p = 2; p <= maxv; p++) {\n        if (sieve[p] === 0) for (var q = p; q <= maxv; q += p) sieve[q]++;\n    }\n    var s: number[] = [], left: number[] = [], right: number[] = [];\n    for (i = 0; i < n; i++) { s.push(sieve[nums[i]]); left.push(-1); right.push(n); }\n    var stack: number[] = [];\n    for (i = 0; i < n; i++) {\n        while (stack.length > 0 && s[stack[stack.length - 1]] < s[i]) stack.pop();\n        left[i] = stack.length > 0 ? stack[stack.length - 1] : -1;\n        stack.push(i);\n    }\n    stack = [];\n    for (i = n - 1; i >= 0; i--) {\n        while (stack.length > 0 && s[stack[stack.length - 1]] <= s[i]) stack.pop();\n        right[i] = stack.length > 0 ? stack[stack.length - 1] : n;\n        stack.push(i);\n    }\n    var order: number[] = [];\n    for (i = 0; i < n; i++) order.push(i);\n    order.sort(function(a: number, b: number) { return nums[b] - nums[a]; });\n    var remaining = k, ans = 1;\n    for (var t = 0; t < n && remaining > 0; t++) {\n        var idx = order[t];\n        var count = (idx - left[idx]) * (right[idx] - idx);\n        var take = count < remaining ? count : remaining;\n        ans = mulmod(ans, powmod(nums[idx], take));\n        remaining -= take;\n    }\n    return ans;\n}`,
        java: `public static int maximumScore(int[] nums, int k) {\n    final long MOD = 1000000007L;\n    int n = nums.length;\n    int maxv = 0;\n    for (int v : nums) maxv = Math.max(maxv, v);\n    int[] sieve = new int[maxv + 1];\n    for (int p = 2; p <= maxv; p++) {\n        if (sieve[p] == 0) {\n            for (int q = p; q <= maxv; q += p) sieve[q]++;\n        }\n    }\n    int[] s = new int[n];\n    for (int i = 0; i < n; i++) s[i] = sieve[nums[i]];\n    int[] left = new int[n];\n    int[] right = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && s[stack.peek()] < s[i]) stack.pop();\n        left[i] = stack.isEmpty() ? -1 : stack.peek();\n        stack.push(i);\n    }\n    stack.clear();\n    for (int i = n - 1; i >= 0; i--) {\n        while (!stack.isEmpty() && s[stack.peek()] <= s[i]) stack.pop();\n        right[i] = stack.isEmpty() ? n : stack.peek();\n        stack.push(i);\n    }\n    Integer[] order = new Integer[n];\n    for (int i = 0; i < n; i++) order[i] = i;\n    Arrays.sort(order, (a, b) -> nums[b] - nums[a]);\n    long remaining = k;\n    long ans = 1;\n    for (int t = 0; t < n && remaining > 0; t++) {\n        int i = order[t];\n        long count = (long) (i - left[i]) * (right[i] - i);\n        long take = Math.min(count, remaining);\n        long base = nums[i] % MOD;\n        long e = take;\n        long cur = 1;\n        while (e > 0) {\n            if ((e & 1L) == 1L) cur = cur * base % MOD;\n            base = base * base % MOD;\n            e >>= 1;\n        }\n        ans = ans * cur % MOD;\n        remaining -= take;\n    }\n    return (int) ans;\n}`,
        cpp: `int maximumScore(vector<int>& nums, int k) {\n    const long long MOD = 1000000007LL;\n    int n = (int) nums.size();\n    int maxv = 0;\n    for (int v : nums) maxv = max(maxv, v);\n    vector<int> sieve(maxv + 1, 0);\n    for (int p = 2; p <= maxv; p++) {\n        if (sieve[p] == 0) {\n            for (int q = p; q <= maxv; q += p) sieve[q]++;\n        }\n    }\n    vector<int> s(n), lft(n, -1), rgt(n, n);\n    for (int i = 0; i < n; i++) s[i] = sieve[nums[i]];\n    vector<int> stk;\n    for (int i = 0; i < n; i++) {\n        while (!stk.empty() && s[stk.back()] < s[i]) stk.pop_back();\n        lft[i] = stk.empty() ? -1 : stk.back();\n        stk.push_back(i);\n    }\n    stk.clear();\n    for (int i = n - 1; i >= 0; i--) {\n        while (!stk.empty() && s[stk.back()] <= s[i]) stk.pop_back();\n        rgt[i] = stk.empty() ? n : stk.back();\n        stk.push_back(i);\n    }\n    vector<int> order(n);\n    for (int i = 0; i < n; i++) order[i] = i;\n    sort(order.begin(), order.end(), [&](int a, int b) { return nums[a] > nums[b]; });\n    long long remaining = k, ans = 1;\n    for (int t = 0; t < n && remaining > 0; t++) {\n        int i = order[t];\n        long long count = (long long) (i - lft[i]) * (rgt[i] - i);\n        long long take = min(count, remaining);\n        long long base = nums[i] % MOD, e = take, cur = 1;\n        while (e > 0) {\n            if (e & 1LL) cur = cur * base % MOD;\n            base = base * base % MOD;\n            e >>= 1;\n        }\n        ans = ans * cur % MOD;\n        remaining -= take;\n    }\n    return (int) ans;\n}`,
        c: `static int aomCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return y[0] - x[0];\n}\n\nint maximumScore(int* nums, int numsSize, int k) {\n    const long long MOD = 1000000007LL;\n    int n = numsSize;\n    int maxv = 0;\n    for (int i = 0; i < n; i++) if (nums[i] > maxv) maxv = nums[i];\n    int* sieve = (int*) calloc((size_t) (maxv + 1), sizeof(int));\n    for (int p = 2; p <= maxv; p++) {\n        if (sieve[p] == 0) {\n            for (int q = p; q <= maxv; q += p) sieve[q]++;\n        }\n    }\n    int* s = (int*) malloc((size_t) n * sizeof(int));\n    int* left = (int*) malloc((size_t) n * sizeof(int));\n    int* right = (int*) malloc((size_t) n * sizeof(int));\n    int* stack = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = sieve[nums[i]];\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        while (top > 0 && s[stack[top - 1]] < s[i]) top--;\n        left[i] = top > 0 ? stack[top - 1] : -1;\n        stack[top++] = i;\n    }\n    top = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        while (top > 0 && s[stack[top - 1]] <= s[i]) top--;\n        right[i] = top > 0 ? stack[top - 1] : n;\n        stack[top++] = i;\n    }\n    int* pairs = (int*) malloc((size_t) n * 2 * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        pairs[i * 2] = nums[i];\n        pairs[i * 2 + 1] = i;\n    }\n    qsort(pairs, (size_t) n, 2 * sizeof(int), aomCmp);\n    long long remaining = k, ans = 1;\n    for (int t = 0; t < n && remaining > 0; t++) {\n        int i = pairs[t * 2 + 1];\n        long long count = (long long) (i - left[i]) * (right[i] - i);\n        long long take = count < remaining ? count : remaining;\n        long long base = nums[i] % MOD, e = take, cur = 1;\n        while (e > 0) {\n            if (e & 1LL) cur = cur * base % MOD;\n            base = base * base % MOD;\n            e >>= 1;\n        }\n        ans = ans * cur % MOD;\n        remaining -= take;\n    }\n    free(sieve);\n    free(s);\n    free(left);\n    free(right);\n    free(stack);\n    free(pairs);\n    return (int) ans;\n}`,
        csharp: `public static int MaximumScore(int[] nums, int k)\n{\n    const long MOD = 1000000007L;\n    int n = nums.Length;\n    int maxv = 0;\n    foreach (var v in nums) maxv = Math.Max(maxv, v);\n    var sieve = new int[maxv + 1];\n    for (int p = 2; p <= maxv; p++)\n    {\n        if (sieve[p] == 0)\n        {\n            for (int q = p; q <= maxv; q += p) sieve[q]++;\n        }\n    }\n    var s = new int[n];\n    for (int i = 0; i < n; i++) s[i] = sieve[nums[i]];\n    var left = new int[n];\n    var right = new int[n];\n    var stack = new Stack<int>();\n    for (int i = 0; i < n; i++)\n    {\n        while (stack.Count > 0 && s[stack.Peek()] < s[i]) stack.Pop();\n        left[i] = stack.Count > 0 ? stack.Peek() : -1;\n        stack.Push(i);\n    }\n    stack.Clear();\n    for (int i = n - 1; i >= 0; i--)\n    {\n        while (stack.Count > 0 && s[stack.Peek()] <= s[i]) stack.Pop();\n        right[i] = stack.Count > 0 ? stack.Peek() : n;\n        stack.Push(i);\n    }\n    var order = new int[n];\n    for (int i = 0; i < n; i++) order[i] = i;\n    Array.Sort(order, (a, b) => nums[b] - nums[a]);\n    long remaining = k;\n    long ans = 1;\n    for (int t = 0; t < n && remaining > 0; t++)\n    {\n        int i = order[t];\n        long count = (long) (i - left[i]) * (right[i] - i);\n        long take = Math.Min(count, remaining);\n        long bse = nums[i] % MOD, e = take, cur = 1;\n        while (e > 0)\n        {\n            if ((e & 1L) == 1L) cur = cur * bse % MOD;\n            bse = bse * bse % MOD;\n            e >>= 1;\n        }\n        ans = ans * cur % MOD;\n        remaining -= take;\n    }\n    return (int) ans;\n}`,
        go: `func maximumScore(nums []int, k int) int {\n\tconst MOD = 1000000007\n\tn := len(nums)\n\tmaxv := 0\n\tfor _, v := range nums {\n\t\tif v > maxv {\n\t\t\tmaxv = v\n\t\t}\n\t}\n\tsieve := make([]int, maxv+1)\n\tfor p := 2; p <= maxv; p++ {\n\t\tif sieve[p] == 0 {\n\t\t\tfor q := p; q <= maxv; q += p {\n\t\t\t\tsieve[q]++\n\t\t\t}\n\t\t}\n\t}\n\ts := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\ts[i] = sieve[nums[i]]\n\t}\n\tleft := make([]int, n)\n\tright := make([]int, n)\n\tstack := []int{}\n\tfor i := 0; i < n; i++ {\n\t\tfor len(stack) > 0 && s[stack[len(stack)-1]] < s[i] {\n\t\t\tstack = stack[:len(stack)-1]\n\t\t}\n\t\tif len(stack) > 0 {\n\t\t\tleft[i] = stack[len(stack)-1]\n\t\t} else {\n\t\t\tleft[i] = -1\n\t\t}\n\t\tstack = append(stack, i)\n\t}\n\tstack = stack[:0]\n\tfor i := n - 1; i >= 0; i-- {\n\t\tfor len(stack) > 0 && s[stack[len(stack)-1]] <= s[i] {\n\t\t\tstack = stack[:len(stack)-1]\n\t\t}\n\t\tif len(stack) > 0 {\n\t\t\tright[i] = stack[len(stack)-1]\n\t\t} else {\n\t\t\tright[i] = n\n\t\t}\n\t\tstack = append(stack, i)\n\t}\n\torder := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\torder[i] = i\n\t}\n\tsort.Slice(order, func(a, b int) bool { return nums[order[a]] > nums[order[b]] })\n\tremaining := k\n\tans := 1\n\tfor t := 0; t < n && remaining > 0; t++ {\n\t\ti := order[t]\n\t\tcount := (i - left[i]) * (right[i] - i)\n\t\ttake := count\n\t\tif remaining < take {\n\t\t\ttake = remaining\n\t\t}\n\t\tbase, e, cur := nums[i]%MOD, take, 1\n\t\tfor e > 0 {\n\t\t\tif e&1 == 1 {\n\t\t\t\tcur = cur * base % MOD\n\t\t\t}\n\t\t\tbase = base * base % MOD\n\t\t\te >>= 1\n\t\t}\n\t\tans = ans * cur % MOD\n\t\tremaining -= take\n\t}\n\treturn ans\n}`,
        kotlin: `fun maximumScore(nums: IntArray, k: Int): Int {\n    val MOD = 1000000007L\n    val n = nums.size\n    var maxv = 0\n    for (v in nums) if (v > maxv) maxv = v\n    val sieve = IntArray(maxv + 1)\n    for (p in 2..maxv) {\n        if (sieve[p] == 0) {\n            var q = p\n            while (q <= maxv) {\n                sieve[q]++\n                q += p\n            }\n        }\n    }\n    val s = IntArray(n) { sieve[nums[it]] }\n    val left = IntArray(n)\n    val right = IntArray(n)\n    val stack = java.util.ArrayDeque<Int>()\n    for (i in 0 until n) {\n        while (stack.isNotEmpty() && s[stack.peek()] < s[i]) stack.pop()\n        left[i] = if (stack.isEmpty()) -1 else stack.peek()\n        stack.push(i)\n    }\n    stack.clear()\n    for (i in n - 1 downTo 0) {\n        while (stack.isNotEmpty() && s[stack.peek()] <= s[i]) stack.pop()\n        right[i] = if (stack.isEmpty()) n else stack.peek()\n        stack.push(i)\n    }\n    val order = (0 until n).sortedByDescending { nums[it] }\n    var remaining = k.toLong()\n    var ans = 1L\n    for (i in order) {\n        if (remaining <= 0L) break\n        val count = (i - left[i]).toLong() * (right[i] - i)\n        val take = minOf(count, remaining)\n        var base = nums[i].toLong() % MOD\n        var e = take\n        var cur = 1L\n        while (e > 0) {\n            if (e and 1L == 1L) cur = cur * base % MOD\n            base = base * base % MOD\n            e = e shr 1\n        }\n        ans = ans * cur % MOD\n        remaining -= take\n    }\n    return ans.toInt()\n}`,
        swift: `func maximumScore(_ nums: [Int], _ k: Int) -> Int {\n    let MOD = 1000000007\n    let n = nums.count\n    var maxv = 0\n    for v in nums where v > maxv { maxv = v }\n    var sieve = [Int](repeating: 0, count: maxv + 1)\n    var p = 2\n    while p <= maxv {\n        if sieve[p] == 0 {\n            var q = p\n            while q <= maxv {\n                sieve[q] += 1\n                q += p\n            }\n        }\n        p += 1\n    }\n    let s = nums.map { sieve[$0] }\n    var left = [Int](repeating: -1, count: n)\n    var right = [Int](repeating: n, count: n)\n    var stack = [Int]()\n    for i in 0..<n {\n        while let last = stack.last, s[last] < s[i] { stack.removeLast() }\n        left[i] = stack.last ?? -1\n        stack.append(i)\n    }\n    stack.removeAll()\n    for i in stride(from: n - 1, through: 0, by: -1) {\n        while let last = stack.last, s[last] <= s[i] { stack.removeLast() }\n        right[i] = stack.last ?? n\n        stack.append(i)\n    }\n    let order = (0..<n).sorted { nums[$0] > nums[$1] }\n    var remaining = k\n    var ans = 1\n    for i in order {\n        if remaining <= 0 { break }\n        let count = (i - left[i]) * (right[i] - i)\n        let take = min(count, remaining)\n        var base = nums[i] % MOD\n        var e = take\n        var cur = 1\n        while e > 0 {\n            if e & 1 == 1 { cur = cur * base % MOD }\n            base = base * base % MOD\n            e >>= 1\n        }\n        ans = ans * cur % MOD\n        remaining -= take\n    }\n    return ans\n}`,
        rust: `fn maximumScore(nums: Vec<i32>, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let n = nums.len();\n    let maxv = *nums.iter().max().unwrap() as usize;\n    let mut sieve = vec![0i32; maxv + 1];\n    for p in 2..=maxv {\n        if sieve[p] == 0 {\n            let mut q = p;\n            while q <= maxv {\n                sieve[q] += 1;\n                q += p;\n            }\n        }\n    }\n    let s: Vec<i32> = nums.iter().map(|&v| sieve[v as usize]).collect();\n    let mut left = vec![-1i64; n];\n    let mut right = vec![n as i64; n];\n    let mut stack: Vec<usize> = Vec::new();\n    for i in 0..n {\n        while let Some(&top) = stack.last() {\n            if s[top] < s[i] {\n                stack.pop();\n            } else {\n                break;\n            }\n        }\n        left[i] = stack.last().map(|&t| t as i64).unwrap_or(-1);\n        stack.push(i);\n    }\n    stack.clear();\n    for i in (0..n).rev() {\n        while let Some(&top) = stack.last() {\n            if s[top] <= s[i] {\n                stack.pop();\n            } else {\n                break;\n            }\n        }\n        right[i] = stack.last().map(|&t| t as i64).unwrap_or(n as i64);\n        stack.push(i);\n    }\n    let mut order: Vec<usize> = (0..n).collect();\n    order.sort_by(|&a, &b| nums[b].cmp(&nums[a]));\n    let mut remaining = k as i64;\n    let mut ans: i64 = 1;\n    for &i in order.iter() {\n        if remaining <= 0 {\n            break;\n        }\n        let count = (i as i64 - left[i]) * (right[i] - i as i64);\n        let take = count.min(remaining);\n        let mut base = nums[i] as i64 % MOD;\n        let mut e = take;\n        let mut cur: i64 = 1;\n        while e > 0 {\n            if e & 1 == 1 {\n                cur = cur * base % MOD;\n            }\n            base = base * base % MOD;\n            e >>= 1;\n        }\n        ans = ans * cur % MOD;\n        remaining -= take;\n    }\n    ans as i32\n}`,
        php: `function maximumScore($nums, $k) {\n    $MOD = 1000000007;\n    $n = count($nums);\n    $maxv = max($nums);\n    $sieve = array_fill(0, $maxv + 1, 0);\n    for ($p = 2; $p <= $maxv; $p++) {\n        if ($sieve[$p] === 0) {\n            for ($q = $p; $q <= $maxv; $q += $p) $sieve[$q]++;\n        }\n    }\n    $s = [];\n    for ($i = 0; $i < $n; $i++) $s[] = $sieve[$nums[$i]];\n    $left = array_fill(0, $n, -1);\n    $right = array_fill(0, $n, $n);\n    $stack = [];\n    for ($i = 0; $i < $n; $i++) {\n        while (count($stack) > 0 && $s[$stack[count($stack) - 1]] < $s[$i]) array_pop($stack);\n        $left[$i] = count($stack) > 0 ? $stack[count($stack) - 1] : -1;\n        $stack[] = $i;\n    }\n    $stack = [];\n    for ($i = $n - 1; $i >= 0; $i--) {\n        while (count($stack) > 0 && $s[$stack[count($stack) - 1]] <= $s[$i]) array_pop($stack);\n        $right[$i] = count($stack) > 0 ? $stack[count($stack) - 1] : $n;\n        $stack[] = $i;\n    }\n    $order = range(0, $n - 1);\n    usort($order, function($a, $b) use ($nums) { return $nums[$b] - $nums[$a]; });\n    $remaining = $k;\n    $ans = 1;\n    foreach ($order as $i) {\n        if ($remaining <= 0) break;\n        $count = ($i - $left[$i]) * ($right[$i] - $i);\n        $take = min($count, $remaining);\n        $base = $nums[$i] % $MOD;\n        $e = $take;\n        $cur = 1;\n        while ($e > 0) {\n            if ($e % 2 === 1) $cur = $cur * $base % $MOD;\n            $base = $base * $base % $MOD;\n            $e = intdiv($e, 2);\n        }\n        $ans = $ans * $cur % $MOD;\n        $remaining -= $take;\n    }\n    return $ans;\n}`,
        ruby: `def maximumScore(nums, k)\n  mod = 1000000007\n  n = nums.length\n  maxv = nums.max\n  sieve = Array.new(maxv + 1, 0)\n  (2..maxv).each do |p|\n    next unless sieve[p] == 0\n    q = p\n    while q <= maxv\n      sieve[q] += 1\n      q += p\n    end\n  end\n  s = nums.map { |v| sieve[v] }\n  left = Array.new(n, -1)\n  right = Array.new(n, n)\n  stack = []\n  (0...n).each do |i|\n    stack.pop while !stack.empty? && s[stack[-1]] < s[i]\n    left[i] = stack.empty? ? -1 : stack[-1]\n    stack << i\n  end\n  stack = []\n  (n - 1).downto(0) do |i|\n    stack.pop while !stack.empty? && s[stack[-1]] <= s[i]\n    right[i] = stack.empty? ? n : stack[-1]\n    stack << i\n  end\n  order = (0...n).sort_by { |i| -nums[i] }\n  remaining = k\n  ans = 1\n  order.each do |i|\n    break if remaining <= 0\n    count = (i - left[i]) * (right[i] - i)\n    take = [count, remaining].min\n    ans = ans * nums[i].pow(take, mod) % mod\n    remaining -= take\n  end\n  ans\nend`,
      },
    };
  })(),
];
