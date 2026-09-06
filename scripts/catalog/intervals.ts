/** Intervals & sorting-based classics (int[][] support).
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const genIntervals = (rng: Rng, nMax: number, lo: number, hi: number, maxLen: number) =>
  Array.from({ length: ri(rng, 1, nMax) }, () => {
    const s = ri(rng, lo, hi);
    return [s, s + ri(rng, 0, maxLen)];
  });

export const INTERVAL_PROBLEMS: CatalogProblem[] = [

  // ── Merge Intervals ─────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[0] - b[0]);
      const out: number[][] = [];
      for (const [st, en] of s) {
        if (out.length > 0 && st <= out[out.length - 1][1]) {
          out[out.length - 1][1] = Math.max(out[out.length - 1][1], en);
        } else {
          out.push([st, en]);
        }
      }
      return out;
    };
    return {
      slug: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Intervals"],
      signature: { funcName: "merge", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array of `intervals` where `intervals[i] = [start, end]`, **merge all overlapping intervals** and return the non-overlapping intervals covering the same ranges, **sorted by start**.",
        [
          { in: "intervals = [[1,3],[2,6],[8,10],[15,18]]", out: "[[1,6],[8,10],[15,18]]", note: "[1,3] and [2,6] overlap." },
          { in: "intervals = [[1,4],[4,5]]", out: "[[1,5]]", note: "Touching intervals merge." },
        ],
        ["1 <= intervals.length <= 20", "0 <= start <= end <= 100"]),
      hints: [
        "Sort by start; overlapping intervals become adjacent.",
        "Extend the last merged interval while the next one starts before it ends.",
      ],
      examples: [
        { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]" },
        { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]" },
      ],
      gen: (rng: Rng) => {
        const intervals = genIntervals(rng, 20, 0, 90, 10);
        return { input: fmtIntMat(intervals), expectedOutput: fmtIntMat(ref(intervals)) };
      },
      editorial: explain({
        idea: "Overlap is a local property once the intervals are **sorted by start**: anything that overlaps a given interval must begin before it ends, and after sorting such intervals sit right next to each other. So a single sweep suffices — keep extending the last merged interval while the next one starts early enough, otherwise begin a new one.",
        steps: [
          "Sort the intervals by start.",
          "Seed the output with the first interval.",
          "For each subsequent interval, compare its start with the end of the last interval in the output.",
          "If `start <= lastEnd`, they touch or overlap — extend the last interval's end to `max(lastEnd, end)`.",
          "Otherwise there is a genuine gap, so append the interval as a new block.",
        ],
        why: "After sorting, every interval that could overlap the current block starts at or before the block's end, and any interval starting later cannot overlap this block *or any earlier one* — the starts only increase from here. So the decision at each step is local and final, and one pass produces exactly the merged set, already sorted because the starts were.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Extend with `max(lastEnd, end)`. A nested interval like `[1,10]` followed by `[2,3]` would otherwise shrink the block.",
          "Touching intervals merge here: the test is `start <= lastEnd`, not `<`.",
          "Sort by start, not by end — sorting by end breaks the adjacency argument.",
          "Compare against the **last merged** block's end, not the previous input interval's.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef merge(intervals: List[List[int]]) -> List[List[int]]:\n    s = sorted(intervals)\n    out = []\n    for st, en in s:\n        if out and st <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], en)\n        else:\n            out.append([st, en])\n    return out`,
        javascript: `var merge = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });\n    const out = [];\n    for (const iv of s) {\n        if (out.length > 0 && iv[0] <= out[out.length - 1][1]) {\n            out[out.length - 1][1] = Math.max(out[out.length - 1][1], iv[1]);\n        } else {\n            out.push([iv[0], iv[1]]);\n        }\n    }\n    return out;\n};`,
              typescript: `function merge(intervals: number[][]): number[][] {\n    const s = intervals.slice().sort(function (a, b) { return a[0] - b[0]; });\n    const out: number[][] = [];\n    for (let i = 0; i < s.length; i++) {\n        if (out.length > 0 && s[i][0] <= out[out.length - 1][1]) {\n            if (s[i][1] > out[out.length - 1][1]) out[out.length - 1][1] = s[i][1];\n        } else {\n            out.push([s[i][0], s[i][1]]);\n        }\n    }\n    return out;\n}`,
              java: `public static int[][] merge(int[][] intervals) {\n    int[][] s = new int[intervals.length][];\n    for (int i = 0; i < intervals.length; i++) s[i] = new int[]{intervals[i][0], intervals[i][1]};\n    Arrays.sort(s, (a, b) -> a[0] - b[0]);\n    List<int[]> out = new ArrayList<>();\n    for (int[] iv : s) {\n        if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1]) {\n            if (iv[1] > out.get(out.size() - 1)[1]) out.get(out.size() - 1)[1] = iv[1];\n        } else {\n            out.add(new int[]{iv[0], iv[1]});\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    vector<vector<int>> s = intervals;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });\n    vector<vector<int>> out;\n    for (const auto& iv : s) {\n        if (!out.empty() && iv[0] <= out.back()[1]) {\n            if (iv[1] > out.back()[1]) out.back()[1] = iv[1];\n        } else {\n            out.push_back(vector<int>{iv[0], iv[1]});\n        }\n    }\n    return out;\n}`,
              c: `static int cmpIvStart(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[0] > y[0]) - (x[0] < y[0]);\n}\n\nint** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {\n    int n = intervalsSize;\n    int** s = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    for (int i = 0; i < n; i++) {\n        s[i] = (int*) malloc(2 * sizeof(int));\n        s[i][0] = intervals[i][0];\n        s[i][1] = intervals[i][1];\n    }\n    qsort(s, n, sizeof(int*), cmpIvStart);\n    int** out = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    int* cols = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (count > 0 && s[i][0] <= out[count - 1][1]) {\n            if (s[i][1] > out[count - 1][1]) out[count - 1][1] = s[i][1];\n        } else {\n            int* iv = (int*) malloc(2 * sizeof(int));\n            iv[0] = s[i][0];\n            iv[1] = s[i][1];\n            out[count] = iv;\n            cols[count] = 2;\n            count++;\n        }\n    }\n    for (int i = 0; i < n; i++) free(s[i]);\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] Merge(int[][] intervals)\n{\n    var s = new List<int[]>();\n    foreach (int[] iv in intervals) s.Add(new int[] { iv[0], iv[1] });\n    s.Sort((a, b) => a[0].CompareTo(b[0]));\n    var res = new List<int[]>();\n    foreach (int[] iv in s)\n    {\n        if (res.Count > 0 && iv[0] <= res[res.Count - 1][1])\n        {\n            if (iv[1] > res[res.Count - 1][1]) res[res.Count - 1][1] = iv[1];\n        }\n        else\n        {\n            res.Add(new int[] { iv[0], iv[1] });\n        }\n    }\n    return res.ToArray();\n}`,
              go: `func merge(intervals [][]int) [][]int {\n	s := [][]int{}\n	for _, iv := range intervals {\n		s = append(s, []int{iv[0], iv[1]})\n	}\n	sort.Slice(s, func(a, b int) bool { return s[a][0] < s[b][0] })\n	out := [][]int{}\n	for _, iv := range s {\n		if len(out) > 0 && iv[0] <= out[len(out)-1][1] {\n			if iv[1] > out[len(out)-1][1] {\n				out[len(out)-1][1] = iv[1]\n			}\n		} else {\n			out = append(out, []int{iv[0], iv[1]})\n		}\n	}\n	return out\n}`,
              kotlin: `fun merge(intervals: Array<IntArray>): Array<IntArray> {\n    val s = intervals.map { intArrayOf(it[0], it[1]) }.sortedBy { it[0] }\n    val out = mutableListOf<IntArray>()\n    for (iv in s) {\n        if (out.isNotEmpty() && iv[0] <= out[out.size - 1][1]) {\n            if (iv[1] > out[out.size - 1][1]) out[out.size - 1][1] = iv[1]\n        } else {\n            out.add(intArrayOf(iv[0], iv[1]))\n        }\n    }\n    return out.toTypedArray()\n}`,
              swift: `func merge(_ intervals: [[Int]]) -> [[Int]] {\n    let s = intervals.sorted { $0[0] < $1[0] }\n    var out: [[Int]] = []\n    for iv in s {\n        if !out.isEmpty && iv[0] <= out[out.count - 1][1] {\n            if iv[1] > out[out.count - 1][1] { out[out.count - 1][1] = iv[1] }\n        } else {\n            out.append([iv[0], iv[1]])\n        }\n    }\n    return out\n}`,
              rust: `fn merge(intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut s = intervals.clone();\n    s.sort_by(|a, b| a[0].cmp(&b[0]));\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for iv in s.iter() {\n        let n = out.len();\n        if n > 0 && iv[0] <= out[n - 1][1] {\n            if iv[1] > out[n - 1][1] {\n                out[n - 1][1] = iv[1];\n            }\n        } else {\n            out.push(vec![iv[0], iv[1]]);\n        }\n    }\n    out\n}`,
              php: `function merge($intervals) {\n    $s = $intervals;\n    usort($s, function($a, $b) { return $a[0] - $b[0]; });\n    $out = array();\n    foreach ($s as $iv) {\n        $n = count($out);\n        if ($n > 0 && $iv[0] <= $out[$n - 1][1]) {\n            if ($iv[1] > $out[$n - 1][1]) $out[$n - 1][1] = $iv[1];\n        } else {\n            $out[] = array($iv[0], $iv[1]);\n        }\n    }\n    return $out;\n}`,
              ruby: `def merge(intervals)\n  s = intervals.sort_by { |iv| iv[0] }\n  out = []\n  s.each do |iv|\n    if !out.empty? && iv[0] <= out[-1][1]\n      out[-1][1] = iv[1] if iv[1] > out[-1][1]\n    else\n      out.push([iv[0], iv[1]])\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Insert Interval ─────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][], newInterval: number[]) => {
      const out: number[][] = [];
      let [ns, ne] = newInterval;
      let i = 0;
      while (i < intervals.length && intervals[i][1] < ns) out.push(intervals[i++]);
      while (i < intervals.length && intervals[i][0] <= ne) {
        ns = Math.min(ns, intervals[i][0]);
        ne = Math.max(ne, intervals[i][1]);
        i++;
      }
      out.push([ns, ne]);
      while (i < intervals.length) out.push(intervals[i++]);
      return out;
    };
    return {
      slug: "insert-interval",
      title: "Insert Interval",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Intervals"],
      signature: { funcName: "insert", params: [{ name: "intervals", type: "int[][]" as const }, { name: "newInterval", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given non-overlapping `intervals` sorted by start, and a `newInterval`. Insert `newInterval` so the result is still sorted and non-overlapping (merge where necessary), and return it.",
        [
          { in: "intervals = [[1,3],[6,9]], newInterval = [2,5]", out: "[[1,5],[6,9]]" },
          { in: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", out: "[[1,2],[3,10],[12,16]]" },
        ],
        ["0 <= intervals.length <= 20", "0 <= start <= end <= 100", "intervals is sorted and non-overlapping."]),
      hints: [
        "Three phases: intervals entirely before, the merge zone, intervals entirely after.",
        "In the merge zone, absorb every interval that overlaps the growing new interval.",
      ],
      examples: [
        { input: "[[1,3],[6,9]]\n[2,5]", expectedOutput: "[[1,5],[6,9]]" },
        { input: "[[1,2],[3,5],[6,7],[8,10],[12,16]]\n[4,8]", expectedOutput: "[[1,2],[3,10],[12,16]]" },
      ],
      gen: (rng: Rng) => {
        // Build sorted non-overlapping intervals.
        const intervals: number[][] = [];
        let cursor = ri(rng, 0, 5);
        const count = ri(rng, 0, 12);
        for (let i = 0; i < count && cursor < 95; i++) {
          const st = cursor + ri(rng, 1, 4);
          const en = st + ri(rng, 0, 6);
          intervals.push([st, en]);
          cursor = en;
        }
        const ns = ri(rng, 0, 90);
        const newInterval = [ns, ns + ri(rng, 0, 15)];
        return { input: `${fmtIntMat(intervals)}\n${fmtIntArr(newInterval)}`, expectedOutput: fmtIntMat(ref(intervals, newInterval)) };
      },
      editorial: explain({
        idea: "The existing intervals are already sorted and disjoint, so no sorting is needed. Walk them once and split into three phases: those that end **before** the new interval begins pass through untouched; those that overlap get **absorbed** into a growing interval; those that start **after** it ends pass through untouched too.",
        steps: [
          "Copy every interval whose end is strictly less than `newInterval` start — they finish before the new one starts.",
          "While an interval starts at or before the growing new interval's end, absorb it: take `min` of the starts and `max` of the ends.",
          "Append the merged interval.",
          "Copy every remaining interval unchanged.",
          "The result stays sorted because the three phases are emitted in order.",
        ],
        why: "Because the input is sorted and disjoint, the intervals overlapping the new one form a **contiguous run**, so the three phases really are consecutive and one pass covers them. Absorbing with `min`/`max` is exactly the union of two overlapping intervals, and repeating it collapses the whole run into a single interval whose bounds are correct however the intervals nest.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Touching counts as overlapping — the absorb test is `start <= newEnd`, so `[1,3]` and `[3,5]` merge into `[1,5]`.",
          "Take `max` of the ends when absorbing; a fully-nested interval must not shrink the result.",
          "An empty input list is valid: the answer is just the new interval.",
          "Do not re-sort — the input order is already correct and sorting only hides mistakes.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef insert(intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:\n    out = []\n    ns, ne = newInterval\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < ns:\n        out.append(intervals[i])\n        i += 1\n    while i < n and intervals[i][0] <= ne:\n        ns = min(ns, intervals[i][0])\n        ne = max(ne, intervals[i][1])\n        i += 1\n    out.append([ns, ne])\n    while i < n:\n        out.append(intervals[i])\n        i += 1\n    return out`,
        javascript: `var insert = function(intervals, newInterval) {\n    const out = [];\n    let ns = newInterval[0], ne = newInterval[1];\n    let i = 0;\n    while (i < intervals.length && intervals[i][1] < ns) out.push(intervals[i++]);\n    while (i < intervals.length && intervals[i][0] <= ne) {\n        ns = Math.min(ns, intervals[i][0]);\n        ne = Math.max(ne, intervals[i][1]);\n        i++;\n    }\n    out.push([ns, ne]);\n    while (i < intervals.length) out.push(intervals[i++]);\n    return out;\n};`,
              typescript: `function insert(intervals: number[][], newInterval: number[]): number[][] {\n    const out: number[][] = [];\n    let start = newInterval[0];\n    let end = newInterval[1];\n    let i = 0;\n    const n = intervals.length;\n    while (i < n && intervals[i][1] < start) {\n        out.push([intervals[i][0], intervals[i][1]]);\n        i++;\n    }\n    while (i < n && intervals[i][0] <= end) {\n        if (intervals[i][0] < start) start = intervals[i][0];\n        if (intervals[i][1] > end) end = intervals[i][1];\n        i++;\n    }\n    out.push([start, end]);\n    while (i < n) {\n        out.push([intervals[i][0], intervals[i][1]]);\n        i++;\n    }\n    return out;\n}`,
              java: `public static int[][] insert(int[][] intervals, int[] newInterval) {\n    List<int[]> out = new ArrayList<>();\n    int start = newInterval[0], end = newInterval[1];\n    int i = 0, n = intervals.length;\n    while (i < n && intervals[i][1] < start) {\n        out.add(new int[]{intervals[i][0], intervals[i][1]});\n        i++;\n    }\n    while (i < n && intervals[i][0] <= end) {\n        if (intervals[i][0] < start) start = intervals[i][0];\n        if (intervals[i][1] > end) end = intervals[i][1];\n        i++;\n    }\n    out.add(new int[]{start, end});\n    while (i < n) {\n        out.add(new int[]{intervals[i][0], intervals[i][1]});\n        i++;\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {\n    vector<vector<int>> out;\n    int start = newInterval[0], end = newInterval[1];\n    int i = 0, n = (int) intervals.size();\n    while (i < n && intervals[i][1] < start) {\n        out.push_back(vector<int>{intervals[i][0], intervals[i][1]});\n        i++;\n    }\n    while (i < n && intervals[i][0] <= end) {\n        if (intervals[i][0] < start) start = intervals[i][0];\n        if (intervals[i][1] > end) end = intervals[i][1];\n        i++;\n    }\n    out.push_back(vector<int>{start, end});\n    while (i < n) {\n        out.push_back(vector<int>{intervals[i][0], intervals[i][1]});\n        i++;\n    }\n    return out;\n}`,
              c: `int** insert(int** intervals, int intervalsSize, int* intervalsColSize, int* newInterval, int newIntervalSize, int* returnSize, int** returnColumnSizes) {\n    int n = intervalsSize;\n    int** out = (int**) malloc((n + 2) * sizeof(int*));\n    int* cols = (int*) malloc((n + 2) * sizeof(int));\n    int count = 0;\n    int start = newInterval[0];\n    int end = newInterval[1];\n    int i = 0;\n    while (i < n && intervals[i][1] < start) {\n        int* iv = (int*) malloc(2 * sizeof(int));\n        iv[0] = intervals[i][0];\n        iv[1] = intervals[i][1];\n        out[count] = iv;\n        cols[count] = 2;\n        count++;\n        i++;\n    }\n    while (i < n && intervals[i][0] <= end) {\n        if (intervals[i][0] < start) start = intervals[i][0];\n        if (intervals[i][1] > end) end = intervals[i][1];\n        i++;\n    }\n    int* mid = (int*) malloc(2 * sizeof(int));\n    mid[0] = start;\n    mid[1] = end;\n    out[count] = mid;\n    cols[count] = 2;\n    count++;\n    while (i < n) {\n        int* iv = (int*) malloc(2 * sizeof(int));\n        iv[0] = intervals[i][0];\n        iv[1] = intervals[i][1];\n        out[count] = iv;\n        cols[count] = 2;\n        count++;\n        i++;\n    }\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] Insert(int[][] intervals, int[] newInterval)\n{\n    var res = new List<int[]>();\n    int start = newInterval[0], end = newInterval[1];\n    int i = 0, n = intervals.Length;\n    while (i < n && intervals[i][1] < start)\n    {\n        res.Add(new int[] { intervals[i][0], intervals[i][1] });\n        i++;\n    }\n    while (i < n && intervals[i][0] <= end)\n    {\n        if (intervals[i][0] < start) start = intervals[i][0];\n        if (intervals[i][1] > end) end = intervals[i][1];\n        i++;\n    }\n    res.Add(new int[] { start, end });\n    while (i < n)\n    {\n        res.Add(new int[] { intervals[i][0], intervals[i][1] });\n        i++;\n    }\n    return res.ToArray();\n}`,
              go: `func insert(intervals [][]int, newInterval []int) [][]int {\n	out := [][]int{}\n	start, end := newInterval[0], newInterval[1]\n	i, n := 0, len(intervals)\n	for i < n && intervals[i][1] < start {\n		out = append(out, []int{intervals[i][0], intervals[i][1]})\n		i++\n	}\n	for i < n && intervals[i][0] <= end {\n		if intervals[i][0] < start {\n			start = intervals[i][0]\n		}\n		if intervals[i][1] > end {\n			end = intervals[i][1]\n		}\n		i++\n	}\n	out = append(out, []int{start, end})\n	for i < n {\n		out = append(out, []int{intervals[i][0], intervals[i][1]})\n		i++\n	}\n	return out\n}`,
              kotlin: `fun insert(intervals: Array<IntArray>, newInterval: IntArray): Array<IntArray> {\n    val out = mutableListOf<IntArray>()\n    var start = newInterval[0]\n    var end = newInterval[1]\n    var i = 0\n    val n = intervals.size\n    while (i < n && intervals[i][1] < start) {\n        out.add(intArrayOf(intervals[i][0], intervals[i][1]))\n        i++\n    }\n    while (i < n && intervals[i][0] <= end) {\n        if (intervals[i][0] < start) start = intervals[i][0]\n        if (intervals[i][1] > end) end = intervals[i][1]\n        i++\n    }\n    out.add(intArrayOf(start, end))\n    while (i < n) {\n        out.add(intArrayOf(intervals[i][0], intervals[i][1]))\n        i++\n    }\n    return out.toTypedArray()\n}`,
              swift: `func insert(_ intervals: [[Int]], _ newInterval: [Int]) -> [[Int]] {\n    var out: [[Int]] = []\n    var start = newInterval[0]\n    var end = newInterval[1]\n    var i = 0\n    let n = intervals.count\n    while i < n && intervals[i][1] < start {\n        out.append([intervals[i][0], intervals[i][1]])\n        i += 1\n    }\n    while i < n && intervals[i][0] <= end {\n        if intervals[i][0] < start { start = intervals[i][0] }\n        if intervals[i][1] > end { end = intervals[i][1] }\n        i += 1\n    }\n    out.append([start, end])\n    while i < n {\n        out.append([intervals[i][0], intervals[i][1]])\n        i += 1\n    }\n    return out\n}`,
              rust: `fn insert(intervals: Vec<Vec<i32>>, newInterval: Vec<i32>) -> Vec<Vec<i32>> {\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut start = newInterval[0];\n    let mut end = newInterval[1];\n    let n = intervals.len();\n    let mut i = 0;\n    while i < n && intervals[i][1] < start {\n        out.push(vec![intervals[i][0], intervals[i][1]]);\n        i += 1;\n    }\n    while i < n && intervals[i][0] <= end {\n        if intervals[i][0] < start {\n            start = intervals[i][0];\n        }\n        if intervals[i][1] > end {\n            end = intervals[i][1];\n        }\n        i += 1;\n    }\n    out.push(vec![start, end]);\n    while i < n {\n        out.push(vec![intervals[i][0], intervals[i][1]]);\n        i += 1;\n    }\n    out\n}`,
              php: `function insert($intervals, $newInterval) {\n    $out = array();\n    $start = $newInterval[0];\n    $end = $newInterval[1];\n    $i = 0;\n    $n = count($intervals);\n    while ($i < $n && $intervals[$i][1] < $start) {\n        $out[] = array($intervals[$i][0], $intervals[$i][1]);\n        $i++;\n    }\n    while ($i < $n && $intervals[$i][0] <= $end) {\n        if ($intervals[$i][0] < $start) $start = $intervals[$i][0];\n        if ($intervals[$i][1] > $end) $end = $intervals[$i][1];\n        $i++;\n    }\n    $out[] = array($start, $end);\n    while ($i < $n) {\n        $out[] = array($intervals[$i][0], $intervals[$i][1]);\n        $i++;\n    }\n    return $out;\n}`,
              ruby: `def insert(intervals, newInterval)\n  out = []\n  start = newInterval[0]\n  finish = newInterval[1]\n  i = 0\n  n = intervals.length\n  while i < n && intervals[i][1] < start\n    out.push([intervals[i][0], intervals[i][1]])\n    i += 1\n  end\n  while i < n && intervals[i][0] <= finish\n    start = intervals[i][0] if intervals[i][0] < start\n    finish = intervals[i][1] if intervals[i][1] > finish\n    i += 1\n  end\n  out.push([start, finish])\n  while i < n\n    out.push([intervals[i][0], intervals[i][1]])\n    i += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Non-overlapping Intervals ───────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[1] - b[1]);
      let kept = 0, end = -Infinity;
      for (const [st, en] of s) {
        if (st >= end) {
          kept++;
          end = en;
        }
      }
      return intervals.length - kept;
    };
    return {
      slug: "non-overlapping-intervals",
      title: "Non-overlapping Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Intervals"],
      signature: { funcName: "eraseOverlapIntervals", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of `intervals`, return the **minimum number of intervals to remove** so the rest are non-overlapping (intervals touching only at a point do not overlap).",
        [
          { in: "intervals = [[1,2],[2,3],[3,4],[1,3]]", out: "1", note: "Remove [1,3]." },
          { in: "intervals = [[1,2],[1,2],[1,2]]", out: "2" },
        ],
        ["1 <= intervals.length <= 20", "-50 <= start < end <= 50"]),
      hints: [
        "Equivalent to keeping the MAXIMUM number of non-overlapping intervals.",
        "Greedy: sort by end time and always keep the interval that ends earliest.",
      ],
      examples: [
        { input: "[[1,2],[2,3],[3,4],[1,3]]", expectedOutput: "1" },
        { input: "[[1,2],[1,2],[1,2]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, -50, 45);
          return [s, s + ri(rng, 1, 10)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      editorial: explain({
        idea: "Flip the question: minimising removals is the same as **keeping the most** non-overlapping intervals. That is the classic activity-selection problem, and the winning greedy is to sort by **end** time and always keep the interval that finishes earliest — finishing early leaves the most room for everything after it.",
        steps: [
          "Sort the intervals by their end value.",
          "Track `lastEnd`, initially minus infinity, and a counter of kept intervals.",
          "For each interval, if its start is `>= lastEnd`, it does not overlap what you have kept — keep it and set `lastEnd` to its end.",
          "Otherwise skip it; it would have to be removed.",
          "Return `n - kept`.",
        ],
        why: "Exchange argument: take any optimal selection and compare it with the greedy one at the first place they differ. The greedy interval ends no later than the optimal one — it was chosen precisely for finishing earliest among the compatible options — so substituting it keeps the selection valid and the same size. Repeating the swap transforms the optimum into the greedy solution, proving greedy is optimal. Sorting by **start** instead would fail: one long early interval could crowd out several short ones.",
        time: "O(n log n)",
        space: "O(1)",
        pitfalls: [
          "Sort by end, not start — this is the whole trick, and sorting by start gives wrong answers on nested intervals.",
          "Intervals that merely touch do **not** overlap, so the keep test is `start >= lastEnd`.",
          "The answer is the number **removed**; do not return the count kept.",
          "Identical duplicate intervals all overlap each other, so all but one must go.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef eraseOverlapIntervals(intervals: List[List[int]]) -> int:\n    s = sorted(intervals, key=lambda iv: iv[1])\n    kept = 0\n    end = float("-inf")\n    for st, en in s:\n        if st >= end:\n            kept += 1\n            end = en\n    return len(intervals) - kept`,
        javascript: `var eraseOverlapIntervals = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[1] - b[1]; });\n    let kept = 0, end = -Infinity;\n    for (const iv of s) {\n        if (iv[0] >= end) {\n            kept++;\n            end = iv[1];\n        }\n    }\n    return intervals.length - kept;\n};`,
              typescript: `function eraseOverlapIntervals(intervals: number[][]): number {\n    const s = intervals.slice().sort(function (a, b) { return a[1] - b[1]; });\n    let kept = 0;\n    let lastEnd = -1000000000;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i][0] >= lastEnd) {\n            kept++;\n            lastEnd = s[i][1];\n        }\n    }\n    return s.length - kept;\n}`,
              java: `public static int eraseOverlapIntervals(int[][] intervals) {\n    int[][] s = intervals.clone();\n    Arrays.sort(s, (a, b) -> a[1] - b[1]);\n    int kept = 0;\n    int lastEnd = -1000000000;\n    for (int[] iv : s) {\n        if (iv[0] >= lastEnd) {\n            kept++;\n            lastEnd = iv[1];\n        }\n    }\n    return s.length - kept;\n}`,
              cpp: `int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n    vector<vector<int>> s = intervals;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });\n    int kept = 0;\n    int lastEnd = -1000000000;\n    for (const auto& iv : s) {\n        if (iv[0] >= lastEnd) {\n            kept++;\n            lastEnd = iv[1];\n        }\n    }\n    return (int) s.size() - kept;\n}`,
              c: `static int cmpIvEnd(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint eraseOverlapIntervals(int** intervals, int intervalsSize, int* intervalsColSize) {\n    int n = intervalsSize;\n    int** s = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    for (int i = 0; i < n; i++) s[i] = intervals[i];\n    qsort(s, n, sizeof(int*), cmpIvEnd);\n    int kept = 0;\n    int lastEnd = -1000000000;\n    for (int i = 0; i < n; i++) {\n        if (s[i][0] >= lastEnd) {\n            kept++;\n            lastEnd = s[i][1];\n        }\n    }\n    free(s);\n    return n - kept;\n}`,
              csharp: `public static int EraseOverlapIntervals(int[][] intervals)\n{\n    var s = new List<int[]>(intervals);\n    s.Sort((a, b) => a[1].CompareTo(b[1]));\n    int kept = 0;\n    int lastEnd = -1000000000;\n    foreach (int[] iv in s)\n    {\n        if (iv[0] >= lastEnd)\n        {\n            kept++;\n            lastEnd = iv[1];\n        }\n    }\n    return s.Count - kept;\n}`,
              go: `func eraseOverlapIntervals(intervals [][]int) int {\n	s := append([][]int{}, intervals...)\n	sort.Slice(s, func(a, b int) bool { return s[a][1] < s[b][1] })\n	kept := 0\n	lastEnd := -1000000000\n	for _, iv := range s {\n		if iv[0] >= lastEnd {\n			kept++\n			lastEnd = iv[1]\n		}\n	}\n	return len(s) - kept\n}`,
              kotlin: `fun eraseOverlapIntervals(intervals: Array<IntArray>): Int {\n    val s = intervals.sortedBy { it[1] }\n    var kept = 0\n    var lastEnd = -1000000000\n    for (iv in s) {\n        if (iv[0] >= lastEnd) {\n            kept++\n            lastEnd = iv[1]\n        }\n    }\n    return s.size - kept\n}`,
              swift: `func eraseOverlapIntervals(_ intervals: [[Int]]) -> Int {\n    let s = intervals.sorted { $0[1] < $1[1] }\n    var kept = 0\n    var lastEnd = -1000000000\n    for iv in s {\n        if iv[0] >= lastEnd {\n            kept += 1\n            lastEnd = iv[1]\n        }\n    }\n    return s.count - kept\n}`,
              rust: `fn eraseOverlapIntervals(intervals: Vec<Vec<i32>>) -> i32 {\n    let mut s = intervals.clone();\n    s.sort_by(|a, b| a[1].cmp(&b[1]));\n    let mut kept = 0;\n    let mut last_end = -1000000000;\n    for iv in s.iter() {\n        if iv[0] >= last_end {\n            kept += 1;\n            last_end = iv[1];\n        }\n    }\n    s.len() as i32 - kept\n}`,
              php: `function eraseOverlapIntervals($intervals) {\n    $s = $intervals;\n    usort($s, function($a, $b) { return $a[1] - $b[1]; });\n    $kept = 0;\n    $lastEnd = -1000000000;\n    foreach ($s as $iv) {\n        if ($iv[0] >= $lastEnd) {\n            $kept++;\n            $lastEnd = $iv[1];\n        }\n    }\n    return count($s) - $kept;\n}`,
              ruby: `def eraseOverlapIntervals(intervals)\n  s = intervals.sort_by { |iv| iv[1] }\n  kept = 0\n  last_end = -1000000000\n  s.each do |iv|\n    if iv[0] >= last_end\n      kept += 1\n      last_end = iv[1]\n    end\n  end\n  s.length - kept\nend`,
      },
    };
  })(),

  // ── Meeting Rooms ───────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const s = [...intervals].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < s.length; i++) {
        if (s[i][0] < s[i - 1][1]) return false;
      }
      return true;
    };
    return {
      slug: "meeting-rooms",
      title: "Meeting Rooms",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Intervals"],
      signature: { funcName: "canAttendMeetings", params: [{ name: "intervals", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array of meeting time `intervals` (`[start, end)`), determine whether a person could **attend all meetings** — i.e. no two meetings overlap (a meeting may start exactly when another ends).",
        [
          { in: "intervals = [[0,30],[5,10],[15,20]]", out: "false" },
          { in: "intervals = [[7,10],[2,4]]", out: "true" },
        ],
        ["0 <= intervals.length <= 20", "0 <= start < end <= 100"]),
      hints: [
        "Sort by start time.",
        "Any meeting starting before the previous one ends is a conflict.",
      ],
      examples: [
        { input: "[[0,30],[5,10],[15,20]]", expectedOutput: "false" },
        { input: "[[7,10],[2,4]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 0, 20) }, () => {
          const s = ri(rng, 0, 90);
          return [s, s + ri(rng, 1, 10)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: bool(ref(intervals)) };
      },
      editorial: explain({
        idea: "Two meetings conflict when one starts before the other ends. After sorting by start time, any conflict must involve **adjacent** meetings, so a single scan comparing each meeting with its predecessor is enough — no need to compare every pair.",
        steps: [
          "Sort the meetings by start time.",
          "Walk from the second meeting onward.",
          "If a meeting starts **strictly before** the previous one ends, they overlap — return `false`.",
          "Surviving the scan means no conflict — return `true`.",
        ],
        why: "Suppose some pair overlaps. Sort them and consider the one that starts later: every meeting between them in sorted order also starts before the earlier meeting ends, so *some adjacent* pair overlaps too. Checking neighbours therefore catches every conflict, reducing the naive `O(n^2)` pairwise scan to one pass.",
        time: "O(n log n)",
        space: "O(1)",
        pitfalls: [
          "Intervals are half-open `[start, end)`, so a meeting starting exactly when another ends is fine — the test is strictly `<`.",
          "An empty schedule is valid and returns `true`.",
          "Sorting is required; adjacency only implies conflict after sorting.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef canAttendMeetings(intervals: List[List[int]]) -> bool:\n    s = sorted(intervals)\n    for i in range(1, len(s)):\n        if s[i][0] < s[i - 1][1]:\n            return False\n    return True`,
        javascript: `var canAttendMeetings = function(intervals) {\n    const s = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });\n    for (let i = 1; i < s.length; i++) {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n};`,
              typescript: `function canAttendMeetings(intervals: number[][]): boolean {\n    const s = intervals.slice().sort(function (a, b) { return a[0] - b[0]; });\n    for (let i = 1; i < s.length; i++) {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n}`,
              java: `public static boolean canAttendMeetings(int[][] intervals) {\n    int[][] s = intervals.clone();\n    Arrays.sort(s, (a, b) -> a[0] - b[0]);\n    for (int i = 1; i < s.length; i++) {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n}`,
              cpp: `bool canAttendMeetings(vector<vector<int>>& intervals) {\n    vector<vector<int>> s = intervals;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });\n    for (int i = 1; i < (int) s.size(); i++) {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n}`,
              c: `static int cmpMeetStart(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[0] > y[0]) - (x[0] < y[0]);\n}\n\nbool canAttendMeetings(int** intervals, int intervalsSize, int* intervalsColSize) {\n    int n = intervalsSize;\n    int** s = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    for (int i = 0; i < n; i++) s[i] = intervals[i];\n    qsort(s, n, sizeof(int*), cmpMeetStart);\n    bool ok = true;\n    for (int i = 1; i < n; i++) {\n        if (s[i][0] < s[i - 1][1]) {\n            ok = false;\n            break;\n        }\n    }\n    free(s);\n    return ok;\n}`,
              csharp: `public static bool CanAttendMeetings(int[][] intervals)\n{\n    var s = new List<int[]>(intervals);\n    s.Sort((a, b) => a[0].CompareTo(b[0]));\n    for (int i = 1; i < s.Count; i++)\n    {\n        if (s[i][0] < s[i - 1][1]) return false;\n    }\n    return true;\n}`,
              go: `func canAttendMeetings(intervals [][]int) bool {\n	s := append([][]int{}, intervals...)\n	sort.Slice(s, func(a, b int) bool { return s[a][0] < s[b][0] })\n	for i := 1; i < len(s); i++ {\n		if s[i][0] < s[i-1][1] {\n			return false\n		}\n	}\n	return true\n}`,
              kotlin: `fun canAttendMeetings(intervals: Array<IntArray>): Boolean {\n    val s = intervals.sortedBy { it[0] }\n    for (i in 1 until s.size) {\n        if (s[i][0] < s[i - 1][1]) return false\n    }\n    return true\n}`,
              swift: `func canAttendMeetings(_ intervals: [[Int]]) -> Bool {\n    let s = intervals.sorted { $0[0] < $1[0] }\n    var i = 1\n    while i < s.count {\n        if s[i][0] < s[i - 1][1] { return false }\n        i += 1\n    }\n    return true\n}`,
              rust: `fn canAttendMeetings(intervals: Vec<Vec<i32>>) -> bool {\n    let mut s = intervals.clone();\n    s.sort_by(|a, b| a[0].cmp(&b[0]));\n    for i in 1..s.len() {\n        if s[i][0] < s[i - 1][1] {\n            return false;\n        }\n    }\n    true\n}`,
              php: `function canAttendMeetings($intervals) {\n    $s = $intervals;\n    usort($s, function($a, $b) { return $a[0] - $b[0]; });\n    $n = count($s);\n    for ($i = 1; $i < $n; $i++) {\n        if ($s[$i][0] < $s[$i - 1][1]) return false;\n    }\n    return true;\n}`,
              ruby: `def canAttendMeetings(intervals)\n  s = intervals.sort_by { |iv| iv[0] }\n  (1...s.length).each do |i|\n    return false if s[i][0] < s[i - 1][1]\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Meeting Rooms II ────────────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const events: Array<[number, number]> = [];
      for (const [s, e] of intervals) {
        events.push([s, 1], [e, -1]);
      }
      events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let cur = 0, best = 0;
      for (const [, d] of events) {
        cur += d;
        best = Math.max(best, cur);
      }
      return best;
    };
    return {
      slug: "meeting-rooms-ii",
      title: "Meeting Rooms II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Heap", "Intervals"],
      signature: { funcName: "minMeetingRooms", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of meeting time `intervals` (`[start, end)`), return the **minimum number of conference rooms** required to host them all. A room freed at time `t` can host a meeting starting at `t`.",
        [
          { in: "intervals = [[0,30],[5,10],[15,20]]", out: "2" },
          { in: "intervals = [[7,10],[2,4]]", out: "1" },
        ],
        ["1 <= intervals.length <= 20", "0 <= start < end <= 100"]),
      hints: [
        "Think of +1 events at starts and -1 events at ends on a timeline.",
        "Sort events (ends before starts at the same time); the running sum's peak is the answer.",
      ],
      examples: [
        { input: "[[0,30],[5,10],[15,20]]", expectedOutput: "2" },
        { input: "[[7,10],[2,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, 0, 90);
          return [s, s + ri(rng, 1, 15)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      editorial: explain({
        idea: "Forget which meeting goes in which room — you only need the **peak concurrency**. Turn each meeting into two timeline events, `+1` at its start and `-1` at its end, sort them, and sweep. The running total is how many meetings are live at that instant, and its maximum is the number of rooms.",
        steps: [
          "Collect the start times and the end times into two sorted lists (or one list of signed events).",
          "Sweep with two pointers: whichever of the next start or next end comes first is processed next.",
          "A start increments the live count; an end decrements it.",
          "Track the largest live count seen.",
          "That maximum is the answer.",
        ],
        why: "A room is needed for each meeting running at the same moment, so the answer is the maximum number of intervals covering any single point — and that maximum can only change at an endpoint, which is why sampling the events suffices. It is achievable too: whenever a meeting ends, its room is genuinely free for the next one, so the peak is not just a lower bound but the exact requirement.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Process **ends before starts** at the same timestamp — a room freed at time `t` can host a meeting starting at `t`. Getting this backwards over-counts by one.",
          "You are matching sorted starts against sorted ends, not against their original pairs; the events are deliberately decoupled.",
          "Track the running maximum, not the final count — the count ends at zero.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef minMeetingRooms(intervals: List[List[int]]) -> int:\n    events = []\n    for s, e in intervals:\n        events.append((s, 1))\n        events.append((e, -1))\n    events.sort()\n    cur = 0\n    best = 0\n    for _, d in events:\n        cur += d\n        best = max(best, cur)\n    return best`,
        javascript: `var minMeetingRooms = function(intervals) {\n    const events = [];\n    for (const iv of intervals) {\n        events.push([iv[0], 1], [iv[1], -1]);\n    }\n    events.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1]; });\n    let cur = 0, best = 0;\n    for (const e of events) {\n        cur += e[1];\n        best = Math.max(best, cur);\n    }\n    return best;\n};`,
              typescript: `function minMeetingRooms(intervals: number[][]): number {\n    const starts: number[] = [];\n    const ends: number[] = [];\n    for (let i = 0; i < intervals.length; i++) {\n        starts.push(intervals[i][0]);\n        ends.push(intervals[i][1]);\n    }\n    starts.sort(function (a, b) { return a - b; });\n    ends.sort(function (a, b) { return a - b; });\n    let live = 0;\n    let best = 0;\n    let i = 0;\n    let j = 0;\n    while (i < starts.length) {\n        if (starts[i] < ends[j]) {\n            live++;\n            if (live > best) best = live;\n            i++;\n        } else {\n            live--;\n            j++;\n        }\n    }\n    return best;\n}`,
              java: `public static int minMeetingRooms(int[][] intervals) {\n    int n = intervals.length;\n    int[] starts = new int[n];\n    int[] ends = new int[n];\n    for (int i = 0; i < n; i++) {\n        starts[i] = intervals[i][0];\n        ends[i] = intervals[i][1];\n    }\n    Arrays.sort(starts);\n    Arrays.sort(ends);\n    int live = 0, best = 0, i = 0, j = 0;\n    while (i < n) {\n        if (starts[i] < ends[j]) {\n            live++;\n            if (live > best) best = live;\n            i++;\n        } else {\n            live--;\n            j++;\n        }\n    }\n    return best;\n}`,
              cpp: `int minMeetingRooms(vector<vector<int>>& intervals) {\n    int n = (int) intervals.size();\n    vector<int> starts, ends;\n    for (const auto& iv : intervals) {\n        starts.push_back(iv[0]);\n        ends.push_back(iv[1]);\n    }\n    sort(starts.begin(), starts.end());\n    sort(ends.begin(), ends.end());\n    int live = 0, best = 0, i = 0, j = 0;\n    while (i < n) {\n        if (starts[i] < ends[j]) {\n            live++;\n            if (live > best) best = live;\n            i++;\n        } else {\n            live--;\n            j++;\n        }\n    }\n    return best;\n}`,
              c: `static int cmpMrAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint minMeetingRooms(int** intervals, int intervalsSize, int* intervalsColSize) {\n    int n = intervalsSize;\n    int* starts = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int* ends = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        starts[i] = intervals[i][0];\n        ends[i] = intervals[i][1];\n    }\n    qsort(starts, n, sizeof(int), cmpMrAsc);\n    qsort(ends, n, sizeof(int), cmpMrAsc);\n    int live = 0, best = 0, i = 0, j = 0;\n    while (i < n) {\n        if (starts[i] < ends[j]) {\n            live++;\n            if (live > best) best = live;\n            i++;\n        } else {\n            live--;\n            j++;\n        }\n    }\n    free(starts);\n    free(ends);\n    return best;\n}`,
              csharp: `public static int MinMeetingRooms(int[][] intervals)\n{\n    int n = intervals.Length;\n    int[] starts = new int[n];\n    int[] ends = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        starts[i] = intervals[i][0];\n        ends[i] = intervals[i][1];\n    }\n    Array.Sort(starts);\n    Array.Sort(ends);\n    int live = 0, best = 0, a = 0, b = 0;\n    while (a < n)\n    {\n        if (starts[a] < ends[b])\n        {\n            live++;\n            if (live > best) best = live;\n            a++;\n        }\n        else\n        {\n            live--;\n            b++;\n        }\n    }\n    return best;\n}`,
              go: `func minMeetingRooms(intervals [][]int) int {\n	n := len(intervals)\n	starts := make([]int, n)\n	ends := make([]int, n)\n	for i, iv := range intervals {\n		starts[i] = iv[0]\n		ends[i] = iv[1]\n	}\n	sort.Ints(starts)\n	sort.Ints(ends)\n	live, best, i, j := 0, 0, 0, 0\n	for i < n {\n		if starts[i] < ends[j] {\n			live++\n			if live > best {\n				best = live\n			}\n			i++\n		} else {\n			live--\n			j++\n		}\n	}\n	return best\n}`,
              kotlin: `fun minMeetingRooms(intervals: Array<IntArray>): Int {\n    val n = intervals.size\n    val starts = IntArray(n) { intervals[it][0] }\n    val ends = IntArray(n) { intervals[it][1] }\n    starts.sort()\n    ends.sort()\n    var live = 0\n    var best = 0\n    var i = 0\n    var j = 0\n    while (i < n) {\n        if (starts[i] < ends[j]) {\n            live++\n            if (live > best) best = live\n            i++\n        } else {\n            live--\n            j++\n        }\n    }\n    return best\n}`,
              swift: `func minMeetingRooms(_ intervals: [[Int]]) -> Int {\n    let n = intervals.count\n    let starts = intervals.map { $0[0] }.sorted()\n    let ends = intervals.map { $0[1] }.sorted()\n    var live = 0\n    var best = 0\n    var i = 0\n    var j = 0\n    while i < n {\n        if starts[i] < ends[j] {\n            live += 1\n            if live > best { best = live }\n            i += 1\n        } else {\n            live -= 1\n            j += 1\n        }\n    }\n    return best\n}`,
              rust: `fn minMeetingRooms(intervals: Vec<Vec<i32>>) -> i32 {\n    let n = intervals.len();\n    let mut starts: Vec<i32> = intervals.iter().map(|iv| iv[0]).collect();\n    let mut ends: Vec<i32> = intervals.iter().map(|iv| iv[1]).collect();\n    starts.sort();\n    ends.sort();\n    let mut live = 0;\n    let mut best = 0;\n    let mut i = 0;\n    let mut j = 0;\n    while i < n {\n        if starts[i] < ends[j] {\n            live += 1;\n            if live > best {\n                best = live;\n            }\n            i += 1;\n        } else {\n            live -= 1;\n            j += 1;\n        }\n    }\n    best\n}`,
              php: `function minMeetingRooms($intervals) {\n    $n = count($intervals);\n    $starts = array();\n    $ends = array();\n    foreach ($intervals as $iv) {\n        $starts[] = $iv[0];\n        $ends[] = $iv[1];\n    }\n    sort($starts);\n    sort($ends);\n    $live = 0;\n    $best = 0;\n    $i = 0;\n    $j = 0;\n    while ($i < $n) {\n        if ($starts[$i] < $ends[$j]) {\n            $live++;\n            if ($live > $best) $best = $live;\n            $i++;\n        } else {\n            $live--;\n            $j++;\n        }\n    }\n    return $best;\n}`,
              ruby: `def minMeetingRooms(intervals)\n  n = intervals.length\n  starts = intervals.map { |iv| iv[0] }.sort\n  ends = intervals.map { |iv| iv[1] }.sort\n  live = 0\n  best = 0\n  i = 0\n  j = 0\n  while i < n\n    if starts[i] < ends[j]\n      live += 1\n      best = live if live > best\n      i += 1\n    else\n      live -= 1\n      j += 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Number of Arrows to Burst Balloons ──────────────────
  (() => {
    const ref = (points: number[][]) => {
      const s = [...points].sort((a, b) => a[1] - b[1]);
      let arrows = 0, x = -Infinity;
      for (const [st, en] of s) {
        if (st > x) {
          arrows++;
          x = en;
        }
      }
      return arrows;
    };
    return {
      slug: "minimum-number-of-arrows",
      title: "Minimum Number of Arrows to Burst Balloons",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Intervals"],
      signature: { funcName: "findMinArrowShots", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Balloons are horizontal segments `points[i] = [xstart, xend]`. An arrow shot vertically at `x` bursts every balloon with `xstart <= x <= xend`.\n\nReturn the **minimum number of arrows** to burst all balloons.",
        [
          { in: "points = [[10,16],[2,8],[1,6],[7,12]]", out: "2", note: "Arrows at x=6 and x=11." },
          { in: "points = [[1,2],[3,4],[5,6],[7,8]]", out: "4" },
        ],
        ["1 <= points.length <= 20", "-100 <= xstart <= xend <= 100"]),
      hints: [
        "Sort by right end; shoot at the first balloon's right edge.",
        "That arrow bursts every balloon starting before it — repeat for the rest.",
      ],
      examples: [
        { input: "[[10,16],[2,8],[1,6],[7,12]]", expectedOutput: "2" },
        { input: "[[1,2],[3,4],[5,6],[7,8]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const points = Array.from({ length: ri(rng, 1, 20) }, () => {
          const s = ri(rng, -100, 90);
          return [s, s + ri(rng, 0, 20)];
        });
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      editorial: explain({
        idea: "Exactly the activity-selection greedy again, wearing a different costume. Sort the balloons by their **right edge** and shoot at the first balloon's right edge — that arrow is as far right as it can be while still bursting that balloon, so it sweeps up as many others as possible. Skip everything it hits and repeat.",
        steps: [
          "Sort the balloons by `xend`.",
          "Shoot the first arrow at the first balloon's `xend` and count it.",
          "Walk the rest: any balloon whose `xstart` is at or before the current arrow position is already burst — skip it.",
          "The first balloon starting **after** the arrow needs a new one: shoot at its `xend` and count again.",
          "Return the number of arrows.",
        ],
        why: "The first balloon to end must be burst by some arrow, and that arrow cannot be positioned further right than its `xend`. Placing it exactly there is therefore optimal: any valid arrow for that balloon is at a position `<= xend`, so it bursts a subset of what the rightmost placement bursts. Removing all balloons hit leaves a smaller instance of the identical problem, so induction gives optimality.",
        time: "O(n log n)",
        space: "O(1)",
        pitfalls: [
          "Sort by the **right** edge. Sorting by the left edge breaks the argument and over-counts.",
          "A balloon touching the arrow exactly at its edge is burst, so the skip test is `xstart <= arrowX`.",
          "Compare against the current arrow's position, not the previous balloon's end.",
          "Coordinates can be negative; initialise the arrow position from the first balloon rather than from zero.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findMinArrowShots(points: List[List[int]]) -> int:\n    s = sorted(points, key=lambda p: p[1])\n    arrows = 0\n    x = float("-inf")\n    for st, en in s:\n        if st > x:\n            arrows += 1\n            x = en\n    return arrows`,
        javascript: `var findMinArrowShots = function(points) {\n    const s = points.slice().sort(function(a, b) { return a[1] - b[1]; });\n    let arrows = 0, x = -Infinity;\n    for (const p of s) {\n        if (p[0] > x) {\n            arrows++;\n            x = p[1];\n        }\n    }\n    return arrows;\n};`,
              typescript: `function findMinArrowShots(points: number[][]): number {\n    const s = points.slice().sort(function (a, b) { return a[1] - b[1]; });\n    let arrows = 0;\n    let arrowX = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (arrows === 0 || s[i][0] > arrowX) {\n            arrows++;\n            arrowX = s[i][1];\n        }\n    }\n    return arrows;\n}`,
              java: `public static int findMinArrowShots(int[][] points) {\n    int[][] s = points.clone();\n    Arrays.sort(s, (a, b) -> Integer.compare(a[1], b[1]));\n    int arrows = 0;\n    int arrowX = 0;\n    for (int[] p : s) {\n        if (arrows == 0 || p[0] > arrowX) {\n            arrows++;\n            arrowX = p[1];\n        }\n    }\n    return arrows;\n}`,
              cpp: `int findMinArrowShots(vector<vector<int>>& points) {\n    vector<vector<int>> s = points;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });\n    int arrows = 0;\n    int arrowX = 0;\n    for (const auto& p : s) {\n        if (arrows == 0 || p[0] > arrowX) {\n            arrows++;\n            arrowX = p[1];\n        }\n    }\n    return arrows;\n}`,
              c: `static int cmpArrowEnd(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint findMinArrowShots(int** points, int pointsSize, int* pointsColSize) {\n    int n = pointsSize;\n    int** s = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    for (int i = 0; i < n; i++) s[i] = points[i];\n    qsort(s, n, sizeof(int*), cmpArrowEnd);\n    int arrows = 0;\n    int arrowX = 0;\n    for (int i = 0; i < n; i++) {\n        if (arrows == 0 || s[i][0] > arrowX) {\n            arrows++;\n            arrowX = s[i][1];\n        }\n    }\n    free(s);\n    return arrows;\n}`,
              csharp: `public static int FindMinArrowShots(int[][] points)\n{\n    var s = new List<int[]>(points);\n    s.Sort((a, b) => a[1].CompareTo(b[1]));\n    int arrows = 0;\n    int arrowX = 0;\n    foreach (int[] p in s)\n    {\n        if (arrows == 0 || p[0] > arrowX)\n        {\n            arrows++;\n            arrowX = p[1];\n        }\n    }\n    return arrows;\n}`,
              go: `func findMinArrowShots(points [][]int) int {\n	s := append([][]int{}, points...)\n	sort.Slice(s, func(a, b int) bool { return s[a][1] < s[b][1] })\n	arrows := 0\n	arrowX := 0\n	for _, p := range s {\n		if arrows == 0 || p[0] > arrowX {\n			arrows++\n			arrowX = p[1]\n		}\n	}\n	return arrows\n}`,
              kotlin: `fun findMinArrowShots(points: Array<IntArray>): Int {\n    val s = points.sortedBy { it[1] }\n    var arrows = 0\n    var arrowX = 0\n    for (p in s) {\n        if (arrows == 0 || p[0] > arrowX) {\n            arrows++\n            arrowX = p[1]\n        }\n    }\n    return arrows\n}`,
              swift: `func findMinArrowShots(_ points: [[Int]]) -> Int {\n    let s = points.sorted { $0[1] < $1[1] }\n    var arrows = 0\n    var arrowX = 0\n    for p in s {\n        if arrows == 0 || p[0] > arrowX {\n            arrows += 1\n            arrowX = p[1]\n        }\n    }\n    return arrows\n}`,
              rust: `fn findMinArrowShots(points: Vec<Vec<i32>>) -> i32 {\n    let mut s = points.clone();\n    s.sort_by(|a, b| a[1].cmp(&b[1]));\n    let mut arrows = 0;\n    let mut arrow_x = 0;\n    for p in s.iter() {\n        if arrows == 0 || p[0] > arrow_x {\n            arrows += 1;\n            arrow_x = p[1];\n        }\n    }\n    arrows\n}`,
              php: `function findMinArrowShots($points) {\n    $s = $points;\n    usort($s, function($a, $b) { return $a[1] - $b[1]; });\n    $arrows = 0;\n    $arrowX = 0;\n    foreach ($s as $p) {\n        if ($arrows === 0 || $p[0] > $arrowX) {\n            $arrows++;\n            $arrowX = $p[1];\n        }\n    }\n    return $arrows;\n}`,
              ruby: `def findMinArrowShots(points)\n  s = points.sort_by { |p| p[1] }\n  arrows = 0\n  arrow_x = 0\n  s.each do |p|\n    if arrows == 0 || p[0] > arrow_x\n      arrows += 1\n      arrow_x = p[1]\n    end\n  end\n  arrows\nend`,
      },
    };
  })(),

  // ── Interval List Intersections ─────────────────────────────────
  (() => {
    const ref = (firstList: number[][], secondList: number[][]) => {
      const out: number[][] = [];
      let i = 0, j = 0;
      while (i < firstList.length && j < secondList.length) {
        const lo = Math.max(firstList[i][0], secondList[j][0]);
        const hi = Math.min(firstList[i][1], secondList[j][1]);
        if (lo <= hi) out.push([lo, hi]);
        if (firstList[i][1] < secondList[j][1]) i++;
        else j++;
      }
      return out;
    };
    const genSortedDisjoint = (rng: Rng) => {
      const out: number[][] = [];
      let cursor = ri(rng, 0, 5);
      const count = ri(rng, 0, 10);
      for (let k = 0; k < count && cursor < 95; k++) {
        const st = cursor + ri(rng, 1, 5);
        const en = st + ri(rng, 0, 8);
        out.push([st, en]);
        cursor = en;
      }
      return out;
    };
    return {
      slug: "interval-list-intersections",
      title: "Interval List Intersections",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Intervals"],
      signature: { funcName: "intervalIntersection", params: [{ name: "firstList", type: "int[][]" as const }, { name: "secondList", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given two lists of **closed** intervals, each sorted and pairwise disjoint. Return the **intersection** of the two lists — every interval common to both.",
        [
          { in: "firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]", out: "[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]" },
          { in: "firstList = [[1,3],[5,9]], secondList = []", out: "[]" },
        ],
        ["0 <= list lengths <= 12", "0 <= start <= end <= 100", "Each list is sorted and disjoint."]),
      hints: [
        "Two pointers: intersect the current pair as [max(starts), min(ends)].",
        "Advance the pointer of the interval that ends first.",
      ],
      examples: [
        { input: "[[0,2],[5,10],[13,23],[24,25]]\n[[1,5],[8,12],[15,24],[25,26]]", expectedOutput: "[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]" },
        { input: "[[1,3],[5,9]]\n[]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = genSortedDisjoint(rng);
        const b = genSortedDisjoint(rng);
        return { input: `${fmtIntMat(a)}\n${fmtIntMat(b)}`, expectedOutput: fmtIntMat(ref(a, b)) };
      },
      editorial: explain({
        idea: "Two intervals overlap in `[max(starts), min(ends)]` — that formula is the whole computation. The only question is which pairs to test, and because both lists are sorted and internally disjoint, a two-pointer walk visits every pair that could possibly intersect while skipping the rest.",
        steps: [
          "Point `i` at the first interval of `firstList` and `j` at the first of `secondList`.",
          "Compute the candidate overlap: `lo = max(a[i][0], b[j][0])` and `hi = min(a[i][1], b[j][1])`.",
          "If `lo <= hi`, that is a real intersection — record `[lo, hi]`.",
          "Advance the pointer whose interval **ends first**; it can never intersect anything later in the other list.",
          "Stop when either list runs out.",
        ],
        why: "The interval that ends first is finished with: every remaining interval in the other list starts at or after the current one, and they only move rightwards, so nothing further can reach back before its end. Discarding it therefore loses no intersections, and each step consumes one interval — giving a single linear pass over both lists combined. The `lo <= hi` test is exactly the condition for the candidate range to be non-empty.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "The intervals are **closed**, so a single shared endpoint counts: the test is `lo <= hi`, and `[5,5]` is a legitimate result.",
          "Advance based on which interval ends first, not on which starts first.",
          "Either list may be empty — the loop must simply not run.",
          "Advance exactly one pointer per iteration; advancing both can skip a valid intersection.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef intervalIntersection(firstList: List[List[int]], secondList: List[List[int]]) -> List[List[int]]:\n    out = []\n    i = j = 0\n    while i < len(firstList) and j < len(secondList):\n        lo = max(firstList[i][0], secondList[j][0])\n        hi = min(firstList[i][1], secondList[j][1])\n        if lo <= hi:\n            out.append([lo, hi])\n        if firstList[i][1] < secondList[j][1]:\n            i += 1\n        else:\n            j += 1\n    return out`,
        javascript: `var intervalIntersection = function(firstList, secondList) {\n    const out = [];\n    let i = 0, j = 0;\n    while (i < firstList.length && j < secondList.length) {\n        const lo = Math.max(firstList[i][0], secondList[j][0]);\n        const hi = Math.min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) out.push([lo, hi]);\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return out;\n};`,
              typescript: `function intervalIntersection(firstList: number[][], secondList: number[][]): number[][] {\n    const out: number[][] = [];\n    let i = 0;\n    let j = 0;\n    while (i < firstList.length && j < secondList.length) {\n        const lo = Math.max(firstList[i][0], secondList[j][0]);\n        const hi = Math.min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) out.push([lo, hi]);\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return out;\n}`,
              java: `public static int[][] intervalIntersection(int[][] firstList, int[][] secondList) {\n    List<int[]> out = new ArrayList<>();\n    int i = 0, j = 0;\n    while (i < firstList.length && j < secondList.length) {\n        int lo = Math.max(firstList[i][0], secondList[j][0]);\n        int hi = Math.min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) out.add(new int[]{lo, hi});\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> intervalIntersection(vector<vector<int>>& firstList, vector<vector<int>>& secondList) {\n    vector<vector<int>> out;\n    size_t i = 0, j = 0;\n    while (i < firstList.size() && j < secondList.size()) {\n        int lo = max(firstList[i][0], secondList[j][0]);\n        int hi = min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) out.push_back(vector<int>{lo, hi});\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return out;\n}`,
              c: `int** intervalIntersection(int** firstList, int firstListSize, int* firstListColSize, int** secondList, int secondListSize, int* secondListColSize, int* returnSize, int** returnColumnSizes) {\n    int cap = firstListSize + secondListSize + 1;\n    int** out = (int**) malloc(cap * sizeof(int*));\n    int* cols = (int*) malloc(cap * sizeof(int));\n    int count = 0;\n    int i = 0, j = 0;\n    while (i < firstListSize && j < secondListSize) {\n        int lo = firstList[i][0] > secondList[j][0] ? firstList[i][0] : secondList[j][0];\n        int hi = firstList[i][1] < secondList[j][1] ? firstList[i][1] : secondList[j][1];\n        if (lo <= hi) {\n            int* iv = (int*) malloc(2 * sizeof(int));\n            iv[0] = lo;\n            iv[1] = hi;\n            out[count] = iv;\n            cols[count] = 2;\n            count++;\n        }\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] IntervalIntersection(int[][] firstList, int[][] secondList)\n{\n    var res = new List<int[]>();\n    int i = 0, j = 0;\n    while (i < firstList.Length && j < secondList.Length)\n    {\n        int lo = Math.Max(firstList[i][0], secondList[j][0]);\n        int hi = Math.Min(firstList[i][1], secondList[j][1]);\n        if (lo <= hi) res.Add(new int[] { lo, hi });\n        if (firstList[i][1] < secondList[j][1]) i++;\n        else j++;\n    }\n    return res.ToArray();\n}`,
              go: `func intervalIntersection(firstList [][]int, secondList [][]int) [][]int {\n	out := [][]int{}\n	i, j := 0, 0\n	for i < len(firstList) && j < len(secondList) {\n		lo := firstList[i][0]\n		if secondList[j][0] > lo {\n			lo = secondList[j][0]\n		}\n		hi := firstList[i][1]\n		if secondList[j][1] < hi {\n			hi = secondList[j][1]\n		}\n		if lo <= hi {\n			out = append(out, []int{lo, hi})\n		}\n		if firstList[i][1] < secondList[j][1] {\n			i++\n		} else {\n			j++\n		}\n	}\n	return out\n}`,
              kotlin: `fun intervalIntersection(firstList: Array<IntArray>, secondList: Array<IntArray>): Array<IntArray> {\n    val out = mutableListOf<IntArray>()\n    var i = 0\n    var j = 0\n    while (i < firstList.size && j < secondList.size) {\n        val lo = maxOf(firstList[i][0], secondList[j][0])\n        val hi = minOf(firstList[i][1], secondList[j][1])\n        if (lo <= hi) out.add(intArrayOf(lo, hi))\n        if (firstList[i][1] < secondList[j][1]) i++ else j++\n    }\n    return out.toTypedArray()\n}`,
              swift: `func intervalIntersection(_ firstList: [[Int]], _ secondList: [[Int]]) -> [[Int]] {\n    var out: [[Int]] = []\n    var i = 0\n    var j = 0\n    while i < firstList.count && j < secondList.count {\n        let lo = max(firstList[i][0], secondList[j][0])\n        let hi = min(firstList[i][1], secondList[j][1])\n        if lo <= hi { out.append([lo, hi]) }\n        if firstList[i][1] < secondList[j][1] { i += 1 } else { j += 1 }\n    }\n    return out\n}`,
              rust: `fn intervalIntersection(firstList: Vec<Vec<i32>>, secondList: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut i = 0;\n    let mut j = 0;\n    while i < firstList.len() && j < secondList.len() {\n        let lo = if firstList[i][0] > secondList[j][0] { firstList[i][0] } else { secondList[j][0] };\n        let hi = if firstList[i][1] < secondList[j][1] { firstList[i][1] } else { secondList[j][1] };\n        if lo <= hi {\n            out.push(vec![lo, hi]);\n        }\n        if firstList[i][1] < secondList[j][1] {\n            i += 1;\n        } else {\n            j += 1;\n        }\n    }\n    out\n}`,
              php: `function intervalIntersection($firstList, $secondList) {\n    $out = array();\n    $i = 0;\n    $j = 0;\n    $n = count($firstList);\n    $m = count($secondList);\n    while ($i < $n && $j < $m) {\n        $lo = max($firstList[$i][0], $secondList[$j][0]);\n        $hi = min($firstList[$i][1], $secondList[$j][1]);\n        if ($lo <= $hi) $out[] = array($lo, $hi);\n        if ($firstList[$i][1] < $secondList[$j][1]) $i++;\n        else $j++;\n    }\n    return $out;\n}`,
              ruby: `def intervalIntersection(firstList, secondList)\n  out = []\n  i = 0\n  j = 0\n  while i < firstList.length && j < secondList.length\n    lo = [firstList[i][0], secondList[j][0]].max\n    hi = [firstList[i][1], secondList[j][1]].min\n    out.push([lo, hi]) if lo <= hi\n    if firstList[i][1] < secondList[j][1]\n      i += 1\n    else\n      j += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Car Pooling ─────────────────────────────────────────────────
  (() => {
    const ref = (trips: number[][], capacity: number) => {
      const diff = new Array(102).fill(0);
      for (const [num, from, to] of trips) {
        diff[from] += num;
        diff[to] -= num;
      }
      let cur = 0;
      for (const d of diff) {
        cur += d;
        if (cur > capacity) return false;
      }
      return true;
    };
    return {
      slug: "car-pooling",
      title: "Car Pooling",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Intervals", "Sorting"],
      signature: { funcName: "carPooling", params: [{ name: "trips", type: "int[][]" as const }, { name: "capacity", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A car with `capacity` seats drives east only. `trips[i] = [numPassengers, from, to]` picks up passengers at `from` and drops them at `to`.\n\nReturn `true` if all trips can be completed without ever exceeding capacity.",
        [
          { in: "trips = [[2,1,5],[3,3,7]], capacity = 4", out: "false" },
          { in: "trips = [[2,1,5],[3,3,7]], capacity = 5", out: "true" },
        ],
        ["1 <= trips.length <= 20", "1 <= numPassengers <= 10", "0 <= from < to <= 100", "1 <= capacity <= 30"]),
      hints: [
        "Difference array over positions: +num at pickup, -num at drop-off.",
        "The running prefix sum is the passenger count at each kilometer.",
      ],
      examples: [
        { input: "[[2,1,5],[3,3,7]]\n4", expectedOutput: "false" },
        { input: "[[2,1,5],[3,3,7]]\n5", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const trips = Array.from({ length: ri(rng, 1, 20) }, () => {
          const from = ri(rng, 0, 95);
          return [ri(rng, 1, 10), from, from + ri(rng, 1, 5)];
        });
        const capacity = ri(rng, 1, 30);
        return { input: `${fmtIntMat(trips)}\n${capacity}`, expectedOutput: bool(ref(trips, capacity)) };
      },
      editorial: explain({
        idea: "You do not need to track individual trips — only how many passengers are aboard at each kilometre. A **difference array** records changes rather than totals: add passengers at the pickup point, subtract them at the drop-off. A single prefix sum then replays the occupancy along the route.",
        steps: [
          "Make an array indexed by position, all zeros.",
          "For each trip `[num, from, to]`: add `num` at index `from`, subtract `num` at index `to`.",
          "Sweep positions left to right, maintaining a running sum — the passengers currently on board.",
          "If the running sum ever exceeds `capacity`, return `false`.",
          "Finishing the sweep means every point was within capacity.",
        ],
        why: "The running sum at position `p` counts exactly the trips with `from <= p < to` — each contributed `+num` at or before `p` and its matching `-num` only after — which is the set of passengers aboard at `p`. Since occupancy only changes at pickups and drop-offs, checking every index covers every moment. Subtracting **at** `to` rather than after it encodes that passengers leave before the car reaches the next segment, so a drop-off and a pickup at the same point do not conflict.",
        time: "O(n + maxPosition)",
        space: "O(maxPosition)",
        pitfalls: [
          "Subtract at `to`, not `to + 1`. Passengers get out at `to`, so that point is already free for someone else.",
          "The trips arrive in arbitrary order; the difference array makes that irrelevant, which is the point of using one.",
          "Size the array to cover the largest `to` value — indexing past the end silently loses drop-offs.",
          "Exceeding capacity is `> capacity`; being exactly full is allowed.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef carPooling(trips: List[List[int]], capacity: int) -> bool:\n    diff = [0] * 102\n    for num, frm, to in trips:\n        diff[frm] += num\n        diff[to] -= num\n    cur = 0\n    for d in diff:\n        cur += d\n        if cur > capacity:\n            return False\n    return True`,
        javascript: `var carPooling = function(trips, capacity) {\n    const diff = new Array(102).fill(0);\n    for (const t of trips) {\n        diff[t[1]] += t[0];\n        diff[t[2]] -= t[0];\n    }\n    let cur = 0;\n    for (const d of diff) {\n        cur += d;\n        if (cur > capacity) return false;\n    }\n    return true;\n};`,
              typescript: `function carPooling(trips: number[][], capacity: number): boolean {\n    const diff: number[] = [];\n    for (let i = 0; i < 1002; i++) diff.push(0);\n    for (let i = 0; i < trips.length; i++) {\n        diff[trips[i][1]] += trips[i][0];\n        diff[trips[i][2]] -= trips[i][0];\n    }\n    let onboard = 0;\n    for (let p = 0; p < 1002; p++) {\n        onboard += diff[p];\n        if (onboard > capacity) return false;\n    }\n    return true;\n}`,
              java: `public static boolean carPooling(int[][] trips, int capacity) {\n    int[] diff = new int[1002];\n    for (int[] t : trips) {\n        diff[t[1]] += t[0];\n        diff[t[2]] -= t[0];\n    }\n    int onboard = 0;\n    for (int p = 0; p < 1002; p++) {\n        onboard += diff[p];\n        if (onboard > capacity) return false;\n    }\n    return true;\n}`,
              cpp: `bool carPooling(vector<vector<int>>& trips, int capacity) {\n    vector<int> diff(1002, 0);\n    for (const auto& t : trips) {\n        diff[t[1]] += t[0];\n        diff[t[2]] -= t[0];\n    }\n    int onboard = 0;\n    for (int p = 0; p < 1002; p++) {\n        onboard += diff[p];\n        if (onboard > capacity) return false;\n    }\n    return true;\n}`,
              c: `bool carPooling(int** trips, int tripsSize, int* tripsColSize, int capacity) {\n    int diff[1002];\n    for (int i = 0; i < 1002; i++) diff[i] = 0;\n    for (int i = 0; i < tripsSize; i++) {\n        diff[trips[i][1]] += trips[i][0];\n        diff[trips[i][2]] -= trips[i][0];\n    }\n    int onboard = 0;\n    for (int p = 0; p < 1002; p++) {\n        onboard += diff[p];\n        if (onboard > capacity) return false;\n    }\n    return true;\n}`,
              csharp: `public static bool CarPooling(int[][] trips, int capacity)\n{\n    int[] diff = new int[1002];\n    foreach (int[] t in trips)\n    {\n        diff[t[1]] += t[0];\n        diff[t[2]] -= t[0];\n    }\n    int onboard = 0;\n    for (int p = 0; p < 1002; p++)\n    {\n        onboard += diff[p];\n        if (onboard > capacity) return false;\n    }\n    return true;\n}`,
              go: `func carPooling(trips [][]int, capacity int) bool {\n	diff := make([]int, 1002)\n	for _, t := range trips {\n		diff[t[1]] += t[0]\n		diff[t[2]] -= t[0]\n	}\n	onboard := 0\n	for p := 0; p < 1002; p++ {\n		onboard += diff[p]\n		if onboard > capacity {\n			return false\n		}\n	}\n	return true\n}`,
              kotlin: `fun carPooling(trips: Array<IntArray>, capacity: Int): Boolean {\n    val diff = IntArray(1002)\n    for (t in trips) {\n        diff[t[1]] += t[0]\n        diff[t[2]] -= t[0]\n    }\n    var onboard = 0\n    for (p in 0 until 1002) {\n        onboard += diff[p]\n        if (onboard > capacity) return false\n    }\n    return true\n}`,
              swift: `func carPooling(_ trips: [[Int]], _ capacity: Int) -> Bool {\n    var diff = [Int](repeating: 0, count: 1002)\n    for t in trips {\n        diff[t[1]] += t[0]\n        diff[t[2]] -= t[0]\n    }\n    var onboard = 0\n    for p in 0..<1002 {\n        onboard += diff[p]\n        if onboard > capacity { return false }\n    }\n    return true\n}`,
              rust: `fn carPooling(trips: Vec<Vec<i32>>, capacity: i32) -> bool {\n    let mut diff = vec![0i32; 1002];\n    for t in trips.iter() {\n        diff[t[1] as usize] += t[0];\n        diff[t[2] as usize] -= t[0];\n    }\n    let mut onboard = 0;\n    for p in 0..1002 {\n        onboard += diff[p];\n        if onboard > capacity {\n            return false;\n        }\n    }\n    true\n}`,
              php: `function carPooling($trips, $capacity) {\n    $diff = array_fill(0, 1002, 0);\n    foreach ($trips as $t) {\n        $diff[$t[1]] += $t[0];\n        $diff[$t[2]] -= $t[0];\n    }\n    $onboard = 0;\n    for ($p = 0; $p < 1002; $p++) {\n        $onboard += $diff[$p];\n        if ($onboard > $capacity) return false;\n    }\n    return true;\n}`,
              ruby: `def carPooling(trips, capacity)\n  diff = Array.new(1002, 0)\n  trips.each do |t|\n    diff[t[1]] += t[0]\n    diff[t[2]] -= t[0]\n  end\n  onboard = 0\n  (0...1002).each do |p|\n    onboard += diff[p]\n    return false if onboard > capacity\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Summary Ranges ──────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: string[] = [];
      let i = 0;
      while (i < nums.length) {
        let j = i;
        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
        out.push(i === j ? String(nums[i]) : `${nums[i]}->${nums[j]}`);
        i = j + 1;
      }
      return out;
    };
    return {
      slug: "summary-ranges",
      title: "Summary Ranges",
      difficulty: "EASY" as const,
      tags: ["Array"],
      signature: { funcName: "summaryRanges", params: [{ name: "nums", type: "int[]" as const }], returns: "string[]" as const },
      description: describe(
        'Given a **sorted, unique** integer array `nums`, return the smallest sorted list of ranges covering exactly the numbers in the array. Format each range as `"a->b"`, or `"a"` when the range is a single number.',
        [
          { in: "nums = [0,1,2,4,5,7]", out: '["0->2","4->5","7"]' },
          { in: "nums = [0,2,3,4,6,8,9]", out: '["0","2->4","6","8->9"]' },
        ],
        ["0 <= nums.length <= 20", "-100 <= nums[i] <= 100", "Sorted, all values unique."]),
      hints: [
        "Walk forward while consecutive numbers differ by exactly 1.",
        "Emit a->b for runs longer than one, else just a.",
      ],
      examples: [
        { input: "[0,1,2,4,5,7]", expectedOutput: '["0->2","4->5","7"]' },
        { input: "[0,2,3,4,6,8,9]", expectedOutput: '["0","2->4","6","8->9"]' },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 201 }, (_, i) => i - 100));
        const nums = pool.slice(0, ri(rng, 0, 20)).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtStrArr(ref(nums)) };
      },
      editorial: explain({
        idea: "The array is already sorted with no duplicates, so a range is simply a **maximal run of consecutive integers**. Walk forward, extend the run while each next value is exactly one more than the last, then emit it in the required format and start the next run where this one stopped.",
        steps: [
          "Set `i` to the start of a run.",
          "Advance `j` from `i` while `nums[j + 1] == nums[j] + 1`.",
          "If `i == j` the run is a single number — emit `\"a\"`.",
          "Otherwise emit `\"a->b\"` using the first and last values of the run.",
          "Continue from `j + 1` until the array is exhausted.",
        ],
        why: "Sorted, distinct input means a run breaks exactly when the gap between neighbours exceeds one, so \"maximal run\" is a purely local test and one pass finds every boundary. Extending greedily to the longest possible run also produces the *smallest* list of ranges, because any shorter split would need an extra range to cover the same numbers.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A single number is formatted `\"7\"`, not `\"7->7\"`.",
          "An empty array returns an empty list; the loop must simply not run.",
          "Values can be negative, so build the strings from the numbers rather than assuming a fixed width.",
          "Compare `nums[j + 1] == nums[j] + 1`, not just `>` — a jump of two starts a new range.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef summaryRanges(nums: List[int]) -> List[str]:\n    out = []\n    i = 0\n    while i < len(nums):\n        j = i\n        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:\n            j += 1\n        out.append(str(nums[i]) if i == j else f"{nums[i]}->{nums[j]}")\n        i = j + 1\n    return out`,
        javascript: `var summaryRanges = function(nums) {\n    const out = [];\n    let i = 0;\n    while (i < nums.length) {\n        let j = i;\n        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;\n        out.push(i === j ? String(nums[i]) : nums[i] + "->" + nums[j]);\n        i = j + 1;\n    }\n    return out;\n};`,
              typescript: `function summaryRanges(nums: number[]): string[] {\n    const out: string[] = [];\n    let i = 0;\n    while (i < nums.length) {\n        let j = i;\n        while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;\n        if (i === j) out.push(String(nums[i]));\n        else out.push(String(nums[i]) + "->" + String(nums[j]));\n        i = j + 1;\n    }\n    return out;\n}`,
              java: `public static String[] summaryRanges(int[] nums) {\n    List<String> out = new ArrayList<>();\n    int i = 0;\n    while (i < nums.length) {\n        int j = i;\n        while (j + 1 < nums.length && nums[j + 1] == nums[j] + 1) j++;\n        if (i == j) out.add(String.valueOf(nums[i]));\n        else out.add(nums[i] + "->" + nums[j]);\n        i = j + 1;\n    }\n    return out.toArray(new String[0]);\n}`,
              cpp: `vector<string> summaryRanges(vector<int>& nums) {\n    vector<string> out;\n    int n = (int) nums.size();\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j + 1 < n && nums[j + 1] == nums[j] + 1) j++;\n        if (i == j) out.push_back(to_string(nums[i]));\n        else out.push_back(to_string(nums[i]) + "->" + to_string(nums[j]));\n        i = j + 1;\n    }\n    return out;\n}`,
              c: `char** summaryRanges(int* nums, int numsSize, int* returnSize) {\n    char** out = (char**) malloc((numsSize > 0 ? numsSize : 1) * sizeof(char*));\n    int count = 0;\n    int i = 0;\n    while (i < numsSize) {\n        int j = i;\n        while (j + 1 < numsSize && nums[j + 1] == nums[j] + 1) j++;\n        char* buf = (char*) malloc(32);\n        if (i == j) sprintf(buf, "%d", nums[i]);\n        else sprintf(buf, "%d->%d", nums[i], nums[j]);\n        out[count++] = buf;\n        i = j + 1;\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static string[] SummaryRanges(int[] nums)\n{\n    var res = new List<string>();\n    int i = 0;\n    while (i < nums.Length)\n    {\n        int j = i;\n        while (j + 1 < nums.Length && nums[j + 1] == nums[j] + 1) j++;\n        if (i == j) res.Add(nums[i].ToString());\n        else res.Add(nums[i].ToString() + "->" + nums[j].ToString());\n        i = j + 1;\n    }\n    return res.ToArray();\n}`,
              go: `func summaryRanges(nums []int) []string {\n	out := []string{}\n	i := 0\n	for i < len(nums) {\n		j := i\n		for j+1 < len(nums) && nums[j+1] == nums[j]+1 {\n			j++\n		}\n		if i == j {\n			out = append(out, strconv.Itoa(nums[i]))\n		} else {\n			out = append(out, strconv.Itoa(nums[i])+"->"+strconv.Itoa(nums[j]))\n		}\n		i = j + 1\n	}\n	return out\n}`,
              kotlin: `fun summaryRanges(nums: IntArray): Array<String> {\n    val out = mutableListOf<String>()\n    var i = 0\n    while (i < nums.size) {\n        var j = i\n        while (j + 1 < nums.size && nums[j + 1] == nums[j] + 1) j++\n        if (i == j) out.add(nums[i].toString())\n        else out.add(nums[i].toString() + "->" + nums[j].toString())\n        i = j + 1\n    }\n    return out.toTypedArray()\n}`,
              swift: `func summaryRanges(_ nums: [Int]) -> [String] {\n    var out: [String] = []\n    var i = 0\n    while i < nums.count {\n        var j = i\n        while j + 1 < nums.count && nums[j + 1] == nums[j] + 1 { j += 1 }\n        if i == j { out.append(String(nums[i])) }\n        else { out.append(String(nums[i]) + "->" + String(nums[j])) }\n        i = j + 1\n    }\n    return out\n}`,
              rust: `fn summaryRanges(nums: Vec<i32>) -> Vec<String> {\n    let mut out: Vec<String> = Vec::new();\n    let n = nums.len();\n    let mut i = 0;\n    while i < n {\n        let mut j = i;\n        while j + 1 < n && nums[j + 1] == nums[j] + 1 {\n            j += 1;\n        }\n        if i == j {\n            out.push(nums[i].to_string());\n        } else {\n            out.push(format!("{}->{}", nums[i], nums[j]));\n        }\n        i = j + 1;\n    }\n    out\n}`,
              php: `function summaryRanges($nums) {\n    $out = array();\n    $n = count($nums);\n    $i = 0;\n    while ($i < $n) {\n        $j = $i;\n        while ($j + 1 < $n && $nums[$j + 1] === $nums[$j] + 1) $j++;\n        if ($i === $j) $out[] = strval($nums[$i]);\n        else $out[] = strval($nums[$i]) . "->" . strval($nums[$j]);\n        $i = $j + 1;\n    }\n    return $out;\n}`,
              ruby: `def summaryRanges(nums)\n  out = []\n  i = 0\n  n = nums.length\n  while i < n\n    j = i\n    j += 1 while j + 1 < n && nums[j + 1] == nums[j] + 1\n    if i == j\n      out.push(nums[i].to_s)\n    else\n      out.push("#{nums[i]}->#{nums[j]}")\n    end\n    i = j + 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── 3Sum ────────────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => a - b);
      const out: number[][] = [];
      for (let i = 0; i < s.length - 2; i++) {
        if (i > 0 && s[i] === s[i - 1]) continue;
        let l = i + 1, r = s.length - 1;
        while (l < r) {
          const sum = s[i] + s[l] + s[r];
          if (sum === 0) {
            out.push([s[i], s[l], s[r]]);
            while (l < r && s[l] === s[l + 1]) l++;
            while (l < r && s[r] === s[r - 1]) r--;
            l++;
            r--;
          } else if (sum < 0) l++;
          else r--;
        }
      }
      return out;
    };
    return {
      slug: "3sum",
      title: "3Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "threeSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an integer array `nums`, return **all unique triplets** `[a, b, c]` with `a + b + c = 0` (using three different indices).\n\nEach triplet must be sorted in **ascending order**, and the list of triplets sorted **lexicographically**.",
        [
          { in: "nums = [-1,0,1,2,-1,-4]", out: "[[-1,-1,2],[-1,0,1]]" },
          { in: "nums = [0,1,1]", out: "[]" },
          { in: "nums = [0,0,0]", out: "[[0,0,0]]" },
        ],
        ["0 <= nums.length <= 20", "-25 <= nums[i] <= 25"]),
      hints: [
        "Sort first — that makes both deduplication and ordering natural.",
        "Fix the smallest element, then two-pointer the remainder for the pair summing to its negation.",
      ],
      examples: [
        { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
        { input: "[0,1,1]", expectedOutput: "[]" },
        { input: "[0,0,0]", expectedOutput: "[[0,0,0]]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 0, 20) }, () => ri(rng, -25, 25));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      editorial: explain({
        idea: "Sorting first turns a three-way search into a one-way scan plus a two-pointer sweep, and — just as usefully — makes duplicates adjacent so they can be skipped cheaply. Fix the smallest element of the triplet, then look for a pair in the remaining suffix summing to its negation.",
        steps: [
          "Sort the array.",
          "Fix index `i` as the first element. Skip it if it equals the previous value — that triplet family was already produced.",
          "Set `l = i + 1` and `r = n - 1`.",
          "While `l < r`, look at `nums[i] + nums[l] + nums[r]`: too small means move `l` right, too big means move `r` left.",
          "On an exact zero, record the triplet, then move **both** pointers inward past any duplicate values before continuing.",
        ],
        why: "The two-pointer sweep is correct because the array is sorted: moving `l` right can only increase the sum and moving `r` left can only decrease it, so each comparison eliminates a whole family of pairs that cannot work — no pair is ever skipped wrongly. Deduplication is exact because equal values sit together after sorting, so skipping repeats at each of the three positions guarantees every distinct triplet appears once. The output is also lexicographically sorted for free, since `i` and then `l` both advance through non-decreasing values.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Three dedup points are needed — on `i`, on `l`, and on `r`. Missing any one produces repeated triplets.",
          "After recording a hit, advance both pointers; moving only one re-finds the same triplet.",
          "Skip duplicates of `i` by comparing with `nums[i - 1]`, not `nums[i + 1]`.",
          "Arrays shorter than three elements simply produce nothing — the loops must handle that without indexing errors.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef threeSum(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n    for i in range(len(s) - 2):\n        if i > 0 and s[i] == s[i - 1]:\n            continue\n        l, r = i + 1, len(s) - 1\n        while l < r:\n            total = s[i] + s[l] + s[r]\n            if total == 0:\n                out.append([s[i], s[l], s[r]])\n                while l < r and s[l] == s[l + 1]:\n                    l += 1\n                while l < r and s[r] == s[r - 1]:\n                    r -= 1\n                l += 1\n                r -= 1\n            elif total < 0:\n                l += 1\n            else:\n                r -= 1\n    return out`,
        javascript: `var threeSum = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    for (let i = 0; i < s.length - 2; i++) {\n        if (i > 0 && s[i] === s[i - 1]) continue;\n        let l = i + 1, r = s.length - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (sum === 0) {\n                out.push([s[i], s[l], s[r]]);\n                while (l < r && s[l] === s[l + 1]) l++;\n                while (l < r && s[r] === s[r - 1]) r--;\n                l++;\n                r--;\n            } else if (sum < 0) {\n                l++;\n            } else {\n                r--;\n            }\n        }\n    }\n    return out;\n};`,
              typescript: `function threeSum(nums: number[]): number[][] {\n    const s = nums.slice().sort(function (a, b) { return a - b; });\n    const out: number[][] = [];\n    const n = s.length;\n    for (let i = 0; i + 2 < n; i++) {\n        if (i > 0 && s[i] === s[i - 1]) continue;\n        let l = i + 1;\n        let r = n - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (sum < 0) l++;\n            else if (sum > 0) r--;\n            else {\n                out.push([s[i], s[l], s[r]]);\n                l++;\n                r--;\n                while (l < r && s[l] === s[l - 1]) l++;\n                while (l < r && s[r] === s[r + 1]) r--;\n            }\n        }\n    }\n    return out;\n}`,
              java: `public static int[][] threeSum(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    List<int[]> out = new ArrayList<>();\n    int n = s.length;\n    for (int i = 0; i + 2 < n; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            if (sum < 0) l++;\n            else if (sum > 0) r--;\n            else {\n                out.add(new int[]{s[i], s[l], s[r]});\n                l++;\n                r--;\n                while (l < r && s[l] == s[l - 1]) l++;\n                while (l < r && s[r] == s[r + 1]) r--;\n            }\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> threeSum(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    vector<vector<int>> out;\n    int n = (int) s.size();\n    for (int i = 0; i + 2 < n; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            if (sum < 0) l++;\n            else if (sum > 0) r--;\n            else {\n                out.push_back(vector<int>{s[i], s[l], s[r]});\n                l++;\n                r--;\n                while (l < r && s[l] == s[l - 1]) l++;\n                while (l < r && s[r] == s[r + 1]) r--;\n            }\n        }\n    }\n    return out;\n}`,
              c: `static int cmp3SumAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    int n = numsSize;\n    int* s = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = nums[i];\n    qsort(s, n, sizeof(int), cmp3SumAsc);\n    int cap = 2048;\n    int** out = (int**) malloc(cap * sizeof(int*));\n    int* cols = (int*) malloc(cap * sizeof(int));\n    int count = 0;\n    for (int i = 0; i + 2 < n; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            if (sum < 0) l++;\n            else if (sum > 0) r--;\n            else {\n                int* t = (int*) malloc(3 * sizeof(int));\n                t[0] = s[i];\n                t[1] = s[l];\n                t[2] = s[r];\n                out[count] = t;\n                cols[count] = 3;\n                count++;\n                l++;\n                r--;\n                while (l < r && s[l] == s[l - 1]) l++;\n                while (l < r && s[r] == s[r + 1]) r--;\n            }\n        }\n    }\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] ThreeSum(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    var res = new List<int[]>();\n    int n = s.Length;\n    for (int i = 0; i + 2 < n; i++)\n    {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        int l = i + 1, r = n - 1;\n        while (l < r)\n        {\n            int sum = s[i] + s[l] + s[r];\n            if (sum < 0) l++;\n            else if (sum > 0) r--;\n            else\n            {\n                res.Add(new int[] { s[i], s[l], s[r] });\n                l++;\n                r--;\n                while (l < r && s[l] == s[l - 1]) l++;\n                while (l < r && s[r] == s[r + 1]) r--;\n            }\n        }\n    }\n    return res.ToArray();\n}`,
              go: `func threeSum(nums []int) [][]int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	out := [][]int{}\n	n := len(s)\n	for i := 0; i+2 < n; i++ {\n		if i > 0 && s[i] == s[i-1] {\n			continue\n		}\n		l, r := i+1, n-1\n		for l < r {\n			sum := s[i] + s[l] + s[r]\n			if sum < 0 {\n				l++\n			} else if sum > 0 {\n				r--\n			} else {\n				out = append(out, []int{s[i], s[l], s[r]})\n				l++\n				r--\n				for l < r && s[l] == s[l-1] {\n					l++\n				}\n				for l < r && s[r] == s[r+1] {\n					r--\n				}\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun threeSum(nums: IntArray): Array<IntArray> {\n    val s = nums.sortedArray()\n    val out = mutableListOf<IntArray>()\n    val n = s.size\n    for (i in 0 until n - 2) {\n        if (i > 0 && s[i] == s[i - 1]) continue\n        var l = i + 1\n        var r = n - 1\n        while (l < r) {\n            val sum = s[i] + s[l] + s[r]\n            when {\n                sum < 0 -> l++\n                sum > 0 -> r--\n                else -> {\n                    out.add(intArrayOf(s[i], s[l], s[r]))\n                    l++\n                    r--\n                    while (l < r && s[l] == s[l - 1]) l++\n                    while (l < r && s[r] == s[r + 1]) r--\n                }\n            }\n        }\n    }\n    return out.toTypedArray()\n}`,
              swift: `func threeSum(_ nums: [Int]) -> [[Int]] {\n    let s = nums.sorted()\n    var out: [[Int]] = []\n    let n = s.count\n    var i = 0\n    while i + 2 < n {\n        if i > 0 && s[i] == s[i - 1] {\n            i += 1\n            continue\n        }\n        var l = i + 1\n        var r = n - 1\n        while l < r {\n            let sum = s[i] + s[l] + s[r]\n            if sum < 0 {\n                l += 1\n            } else if sum > 0 {\n                r -= 1\n            } else {\n                out.append([s[i], s[l], s[r]])\n                l += 1\n                r -= 1\n                while l < r && s[l] == s[l - 1] { l += 1 }\n                while l < r && s[r] == s[r + 1] { r -= 1 }\n            }\n        }\n        i += 1\n    }\n    return out\n}`,
              rust: `fn threeSum(nums: Vec<i32>) -> Vec<Vec<i32>> {\n    let mut s = nums.clone();\n    s.sort();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let n = s.len();\n    if n < 3 {\n        return out;\n    }\n    for i in 0..(n - 2) {\n        if i > 0 && s[i] == s[i - 1] {\n            continue;\n        }\n        let mut l = i + 1;\n        let mut r = n - 1;\n        while l < r {\n            let sum = s[i] + s[l] + s[r];\n            if sum < 0 {\n                l += 1;\n            } else if sum > 0 {\n                r -= 1;\n            } else {\n                out.push(vec![s[i], s[l], s[r]]);\n                l += 1;\n                r -= 1;\n                while l < r && s[l] == s[l - 1] {\n                    l += 1;\n                }\n                while l < r && s[r] == s[r + 1] {\n                    r -= 1;\n                }\n            }\n        }\n    }\n    out\n}`,
              php: `function threeSum($nums) {\n    $s = $nums;\n    sort($s);\n    $out = array();\n    $n = count($s);\n    for ($i = 0; $i + 2 < $n; $i++) {\n        if ($i > 0 && $s[$i] === $s[$i - 1]) continue;\n        $l = $i + 1;\n        $r = $n - 1;\n        while ($l < $r) {\n            $sum = $s[$i] + $s[$l] + $s[$r];\n            if ($sum < 0) {\n                $l++;\n            } elseif ($sum > 0) {\n                $r--;\n            } else {\n                $out[] = array($s[$i], $s[$l], $s[$r]);\n                $l++;\n                $r--;\n                while ($l < $r && $s[$l] === $s[$l - 1]) $l++;\n                while ($l < $r && $s[$r] === $s[$r + 1]) $r--;\n            }\n        }\n    }\n    return $out;\n}`,
              ruby: `def threeSum(nums)\n  s = nums.sort\n  out = []\n  n = s.length\n  i = 0\n  while i + 2 < n\n    if i > 0 && s[i] == s[i - 1]\n      i += 1\n      next\n    end\n    l = i + 1\n    r = n - 1\n    while l < r\n      sum = s[i] + s[l] + s[r]\n      if sum < 0\n        l += 1\n      elsif sum > 0\n        r -= 1\n      else\n        out.push([s[i], s[l], s[r]])\n        l += 1\n        r -= 1\n        l += 1 while l < r && s[l] == s[l - 1]\n        r -= 1 while l < r && s[r] == s[r + 1]\n      end\n    end\n    i += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── 3Sum Closest (unique answer guaranteed) ─────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const s = [...nums].sort((a, b) => a - b);
      let best = s[0] + s[1] + s[2];
      for (let i = 0; i < s.length - 2; i++) {
        let l = i + 1, r = s.length - 1;
        while (l < r) {
          const sum = s[i] + s[l] + s[r];
          if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;
          if (sum === target) return sum;
          if (sum < target) l++;
          else r--;
        }
      }
      return best;
    };
    const uniqueClosest = (nums: number[], target: number) => {
      const sums = new Set<number>();
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++)
          for (let k = j + 1; k < nums.length; k++)
            sums.add(nums[i] + nums[j] + nums[k]);
      let bestDist = Infinity, count = 0;
      for (const s of sums) {
        const d = Math.abs(s - target);
        if (d < bestDist) { bestDist = d; count = 1; }
        else if (d === bestDist) count++;
      }
      return count === 1;
    };
    return {
      slug: "3sum-closest",
      title: "3Sum Closest",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "threeSumClosest", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `target`, find three numbers in `nums` whose sum is **closest to `target`** and return that sum. Each input has **exactly one** closest sum.",
        [
          { in: "nums = [-1,2,1,-4], target = 1", out: "2", note: "(-1 + 2 + 1) = 2." },
          { in: "nums = [0,0,0], target = 1", out: "0" },
        ],
        ["3 <= nums.length <= 12", "-20 <= nums[i] <= 20", "-60 <= target <= 60"]),
      hints: [
        "Sort, fix one element, two-pointer the rest — like 3Sum but tracking the closest sum.",
        "Early-exit when the sum hits the target exactly.",
      ],
      examples: [
        { input: "[-1,2,1,-4]\n1", expectedOutput: "2" },
        { input: "[0,0,0]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        for (let attempt = 0; attempt < 80; attempt++) {
          const nums = Array.from({ length: ri(rng, 3, 12) }, () => ri(rng, -20, 20));
          const target = ri(rng, -60, 60);
          if (uniqueClosest(nums, target)) {
            return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
          }
        }
        return { input: "[-1,2,1,-4]\n1", expectedOutput: "2" };
      },
      editorial: explain({
        idea: "The same sorted two-pointer machinery as 3Sum, but instead of demanding an exact hit you keep the best near-miss. Sorting is what lets a single comparison tell you which way to move: if the current sum is below the target, the only way to grow it is to raise the smaller element.",
        steps: [
          "Sort the array and seed `best` with any valid triplet sum, such as the first three values.",
          "Fix `i`, then sweep `l = i + 1` and `r = n - 1` towards each other.",
          "At each step compute the sum and update `best` if it is closer to the target than the current best.",
          "If the sum is below the target move `l` right; if above, move `r` left.",
          "An exact match cannot be beaten — return it immediately.",
        ],
        why: "For a fixed `i`, sliding the pointers explores the pair sums monotonically, so the comparison against the target always points towards the region that could improve the answer — the discarded side is uniformly further away in the wrong direction. Every candidate that could be the closest is therefore examined, and tracking a running minimum of `|sum - target|` picks it out.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Seed `best` with a real triplet sum, not `0` or a huge sentinel — comparing distances against an unreachable value can never improve.",
          "Compare **absolute distances** to the target, not the raw sums.",
          "No deduplication is needed or wanted here; skipping repeats could skip the closest sum.",
          "Return the sum itself, not the distance.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef threeSumClosest(nums: List[int], target: int) -> int:\n    s = sorted(nums)\n    best = s[0] + s[1] + s[2]\n    for i in range(len(s) - 2):\n        l, r = i + 1, len(s) - 1\n        while l < r:\n            total = s[i] + s[l] + s[r]\n            if abs(total - target) < abs(best - target):\n                best = total\n            if total == target:\n                return total\n            if total < target:\n                l += 1\n            else:\n                r -= 1\n    return best`,
        javascript: `var threeSumClosest = function(nums, target) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    let best = s[0] + s[1] + s[2];\n    for (let i = 0; i < s.length - 2; i++) {\n        let l = i + 1, r = s.length - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;\n            if (sum === target) return sum;\n            if (sum < target) l++;\n            else r--;\n        }\n    }\n    return best;\n};`,
              typescript: `function threeSumClosest(nums: number[], target: number): number {\n    const s = nums.slice().sort(function (a, b) { return a - b; });\n    const n = s.length;\n    let best = s[0] + s[1] + s[2];\n    for (let i = 0; i + 2 < n; i++) {\n        let l = i + 1;\n        let r = n - 1;\n        while (l < r) {\n            const sum = s[i] + s[l] + s[r];\n            if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;\n            if (sum < target) l++;\n            else if (sum > target) r--;\n            else return sum;\n        }\n    }\n    return best;\n}`,
              java: `public static int threeSumClosest(int[] nums, int target) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int n = s.length;\n    int best = s[0] + s[1] + s[2];\n    for (int i = 0; i + 2 < n; i++) {\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            if (Math.abs(sum - target) < Math.abs(best - target)) best = sum;\n            if (sum < target) l++;\n            else if (sum > target) r--;\n            else return sum;\n        }\n    }\n    return best;\n}`,
              cpp: `int threeSumClosest(vector<int>& nums, int target) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    int best = s[0] + s[1] + s[2];\n    for (int i = 0; i + 2 < n; i++) {\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            if (abs(sum - target) < abs(best - target)) best = sum;\n            if (sum < target) l++;\n            else if (sum > target) r--;\n            else return sum;\n        }\n    }\n    return best;\n}`,
              c: `static int cmp3ClosestAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint threeSumClosest(int* nums, int numsSize, int target) {\n    int n = numsSize;\n    int* s = (int*) malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = nums[i];\n    qsort(s, n, sizeof(int), cmp3ClosestAsc);\n    int best = s[0] + s[1] + s[2];\n    for (int i = 0; i + 2 < n; i++) {\n        int l = i + 1, r = n - 1;\n        while (l < r) {\n            int sum = s[i] + s[l] + s[r];\n            int d1 = sum - target;\n            if (d1 < 0) d1 = -d1;\n            int d2 = best - target;\n            if (d2 < 0) d2 = -d2;\n            if (d1 < d2) best = sum;\n            if (sum < target) l++;\n            else if (sum > target) r--;\n            else {\n                free(s);\n                return sum;\n            }\n        }\n    }\n    free(s);\n    return best;\n}`,
              csharp: `public static int ThreeSumClosest(int[] nums, int target)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int n = s.Length;\n    int best = s[0] + s[1] + s[2];\n    for (int i = 0; i + 2 < n; i++)\n    {\n        int l = i + 1, r = n - 1;\n        while (l < r)\n        {\n            int sum = s[i] + s[l] + s[r];\n            if (Math.Abs(sum - target) < Math.Abs(best - target)) best = sum;\n            if (sum < target) l++;\n            else if (sum > target) r--;\n            else return sum;\n        }\n    }\n    return best;\n}`,
              go: `func threeSumClosest(nums []int, target int) int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	n := len(s)\n	best := s[0] + s[1] + s[2]\n	abs := func(x int) int {\n		if x < 0 {\n			return -x\n		}\n		return x\n	}\n	for i := 0; i+2 < n; i++ {\n		l, r := i+1, n-1\n		for l < r {\n			sum := s[i] + s[l] + s[r]\n			if abs(sum-target) < abs(best-target) {\n				best = sum\n			}\n			if sum < target {\n				l++\n			} else if sum > target {\n				r--\n			} else {\n				return sum\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun threeSumClosest(nums: IntArray, target: Int): Int {\n    val s = nums.sortedArray()\n    val n = s.size\n    var best = s[0] + s[1] + s[2]\n    for (i in 0 until n - 2) {\n        var l = i + 1\n        var r = n - 1\n        while (l < r) {\n            val sum = s[i] + s[l] + s[r]\n            if (Math.abs(sum - target) < Math.abs(best - target)) best = sum\n            when {\n                sum < target -> l++\n                sum > target -> r--\n                else -> return sum\n            }\n        }\n    }\n    return best\n}`,
              swift: `func threeSumClosest(_ nums: [Int], _ target: Int) -> Int {\n    let s = nums.sorted()\n    let n = s.count\n    var best = s[0] + s[1] + s[2]\n    var i = 0\n    while i + 2 < n {\n        var l = i + 1\n        var r = n - 1\n        while l < r {\n            let sum = s[i] + s[l] + s[r]\n            if abs(sum - target) < abs(best - target) { best = sum }\n            if sum < target {\n                l += 1\n            } else if sum > target {\n                r -= 1\n            } else {\n                return sum\n            }\n        }\n        i += 1\n    }\n    return best\n}`,
              rust: `fn threeSumClosest(nums: Vec<i32>, target: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let n = s.len();\n    let mut best = s[0] + s[1] + s[2];\n    for i in 0..(n - 2) {\n        let mut l = i + 1;\n        let mut r = n - 1;\n        while l < r {\n            let sum = s[i] + s[l] + s[r];\n            if (sum - target).abs() < (best - target).abs() {\n                best = sum;\n            }\n            if sum < target {\n                l += 1;\n            } else if sum > target {\n                r -= 1;\n            } else {\n                return sum;\n            }\n        }\n    }\n    best\n}`,
              php: `function threeSumClosest($nums, $target) {\n    $s = $nums;\n    sort($s);\n    $n = count($s);\n    $best = $s[0] + $s[1] + $s[2];\n    for ($i = 0; $i + 2 < $n; $i++) {\n        $l = $i + 1;\n        $r = $n - 1;\n        while ($l < $r) {\n            $sum = $s[$i] + $s[$l] + $s[$r];\n            if (abs($sum - $target) < abs($best - $target)) $best = $sum;\n            if ($sum < $target) {\n                $l++;\n            } elseif ($sum > $target) {\n                $r--;\n            } else {\n                return $sum;\n            }\n        }\n    }\n    return $best;\n}`,
              ruby: `def threeSumClosest(nums, target)\n  s = nums.sort\n  n = s.length\n  best = s[0] + s[1] + s[2]\n  i = 0\n  while i + 2 < n\n    l = i + 1\n    r = n - 1\n    while l < r\n      sum = s[i] + s[l] + s[r]\n      best = sum if (sum - target).abs < (best - target).abs\n      if sum < target\n        l += 1\n      elsif sum > target\n        r -= 1\n      else\n        return sum\n      end\n    end\n    i += 1\n  end\n  best\nend`,
      },
    };
  })(),

];
