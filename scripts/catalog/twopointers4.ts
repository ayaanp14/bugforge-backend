/**
 * Two-pointer problems — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" two-pointer set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs in
 * src/lib/judge0.ts reads `<ident>=` as a named argument).
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const TWOPOINTERS4_PROBLEMS: CatalogProblem[] = [

  // ── Merge Two 2D Arrays by Summing Values (LC 2570) ─────────────
  (() => {
    const ref = (nums1: number[][], nums2: number[][]) => {
      const out: number[][] = [];
      let i = 0, j = 0;
      while (i < nums1.length && j < nums2.length) {
        if (nums1[i][0] === nums2[j][0]) { out.push([nums1[i][0], nums1[i][1] + nums2[j][1]]); i++; j++; }
        else if (nums1[i][0] < nums2[j][0]) { out.push([nums1[i][0], nums1[i][1]]); i++; }
        else { out.push([nums2[j][0], nums2[j][1]]); j++; }
      }
      while (i < nums1.length) { out.push([nums1[i][0], nums1[i][1]]); i++; }
      while (j < nums2.length) { out.push([nums2[j][0], nums2[j][1]]); j++; }
      return out;
    };
    return {
      slug: "merge-two-2d-arrays-by-summing-values",
      title: "Merge Two 2D Arrays by Summing Values",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "mergeArrays", params: [{ name: "nums1", type: "int[][]" as const }, { name: "nums2", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Each of `nums1` and `nums2` holds `[id, value]` pairs sorted by **strictly increasing** id, with no id repeated inside one array.\n\nMerge them: every id that appears in either array appears once in the result, carrying the sum of its values. Return the merged array sorted by id.",
        [
          { in: "nums1 = [[1,2],[2,3],[4,5]], nums2 = [[1,4],[3,2],[4,1]]", out: "[[1,6],[2,3],[3,2],[4,6]]", note: "Ids 1 and 4 appear in both, so their values add." },
          { in: "nums1 = [[2,4],[3,6]], nums2 = [[1,3],[4,3]]", out: "[[1,3],[2,4],[3,6],[4,3]]", note: "No id is shared." },
          { in: "nums1 = [[1,1]], nums2 = [[1,1]]", out: "[[1,2]]" },
        ],
        ["1 <= nums1.length, nums2.length <= 200", "Each inner array has length 2", "1 <= id <= 1000", "1 <= value <= 1000", "Ids within each array are strictly increasing."]),
      hints: [
        "Both inputs are already sorted by id, so this is the merge step of merge sort.",
        "When the two front ids match, emit their sum and advance both pointers.",
        "Otherwise emit the smaller id and advance only that pointer.",
      ],
      editorial: explain({
        idea: "Sorted inputs make a single linear merge sufficient: compare the two front ids and either combine them or take the smaller one.",
        steps: [
          "Walk `i` over `nums1` and `j` over `nums2`.",
          "On equal ids, push `[id, v1 + v2]` and advance both.",
          "Otherwise push the pair with the smaller id and advance that pointer.",
          "Append whatever remains of either array.",
        ],
        why: "Because each array's ids strictly increase, the smaller front id can never appear again later in the other array, so emitting it immediately is safe and the output stays sorted.",
        time: "O(n + m)",
        space: "O(n + m) for the output",
        pitfalls: [
          "Forgetting the tail loops drops the longer array's remainder.",
          "Advancing only one pointer on an equal id emits that id twice.",
          "Concatenating and sorting works but throws away the inputs' existing order.",
        ],
      }),
      examples: [
        { input: "[[1,2],[2,3],[4,5]]\n[[1,4],[3,2],[4,1]]", expectedOutput: "[[1,6],[2,3],[3,2],[4,6]]" },
        { input: "[[2,4],[3,6]]\n[[1,3],[4,3]]", expectedOutput: "[[1,3],[2,4],[3,6],[4,3]]" },
        { input: "[[1,1]]\n[[1,1]]", expectedOutput: "[[1,2]]" },
      ],
      gen: (rng: Rng) => {
        const mk = () => {
          const ids = shuffle(rng, Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, ri(rng, 1, 10)).sort((a, b) => a - b);
          return ids.map((id) => [id, ri(rng, 1, 1000)]);
        };
        const nums1 = mk(), nums2 = mk();
        return { input: `${fmtIntMat(nums1)}\n${fmtIntMat(nums2)}`, expectedOutput: fmtIntMat(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef mergeArrays(nums1: List[List[int]], nums2: List[List[int]]) -> List[List[int]]:\n    out = []\n    i = j = 0\n    while i < len(nums1) and j < len(nums2):\n        if nums1[i][0] == nums2[j][0]:\n            out.append([nums1[i][0], nums1[i][1] + nums2[j][1]])\n            i += 1\n            j += 1\n        elif nums1[i][0] < nums2[j][0]:\n            out.append(list(nums1[i]))\n            i += 1\n        else:\n            out.append(list(nums2[j]))\n            j += 1\n    while i < len(nums1):\n        out.append(list(nums1[i]))\n        i += 1\n    while j < len(nums2):\n        out.append(list(nums2[j]))\n        j += 1\n    return out`,
        javascript: `var mergeArrays = function(nums1, nums2) {\n    var out = [];\n    var i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i][0] === nums2[j][0]) {\n            out.push([nums1[i][0], nums1[i][1] + nums2[j][1]]);\n            i++;\n            j++;\n        } else if (nums1[i][0] < nums2[j][0]) {\n            out.push([nums1[i][0], nums1[i][1]]);\n            i++;\n        } else {\n            out.push([nums2[j][0], nums2[j][1]]);\n            j++;\n        }\n    }\n    while (i < nums1.length) { out.push([nums1[i][0], nums1[i][1]]); i++; }\n    while (j < nums2.length) { out.push([nums2[j][0], nums2[j][1]]); j++; }\n    return out;\n};`,
        typescript: `function mergeArrays(nums1: number[][], nums2: number[][]): number[][] {\n    var out: number[][] = [];\n    var i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i][0] === nums2[j][0]) {\n            out.push([nums1[i][0], nums1[i][1] + nums2[j][1]]);\n            i++;\n            j++;\n        } else if (nums1[i][0] < nums2[j][0]) {\n            out.push([nums1[i][0], nums1[i][1]]);\n            i++;\n        } else {\n            out.push([nums2[j][0], nums2[j][1]]);\n            j++;\n        }\n    }\n    while (i < nums1.length) { out.push([nums1[i][0], nums1[i][1]]); i++; }\n    while (j < nums2.length) { out.push([nums2[j][0], nums2[j][1]]); j++; }\n    return out;\n}`,
        java: `public static int[][] mergeArrays(int[][] nums1, int[][] nums2) {\n    List<int[]> out = new ArrayList<>();\n    int i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i][0] == nums2[j][0]) {\n            out.add(new int[] { nums1[i][0], nums1[i][1] + nums2[j][1] });\n            i++;\n            j++;\n        } else if (nums1[i][0] < nums2[j][0]) {\n            out.add(new int[] { nums1[i][0], nums1[i][1] });\n            i++;\n        } else {\n            out.add(new int[] { nums2[j][0], nums2[j][1] });\n            j++;\n        }\n    }\n    while (i < nums1.length) { out.add(new int[] { nums1[i][0], nums1[i][1] }); i++; }\n    while (j < nums2.length) { out.add(new int[] { nums2[j][0], nums2[j][1] }); j++; }\n    return out.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> mergeArrays(vector<vector<int>>& nums1, vector<vector<int>>& nums2) {\n    vector<vector<int>> out;\n    size_t i = 0, j = 0;\n    while (i < nums1.size() && j < nums2.size()) {\n        if (nums1[i][0] == nums2[j][0]) {\n            out.push_back({ nums1[i][0], nums1[i][1] + nums2[j][1] });\n            i++;\n            j++;\n        } else if (nums1[i][0] < nums2[j][0]) {\n            out.push_back({ nums1[i][0], nums1[i][1] });\n            i++;\n        } else {\n            out.push_back({ nums2[j][0], nums2[j][1] });\n            j++;\n        }\n    }\n    while (i < nums1.size()) { out.push_back({ nums1[i][0], nums1[i][1] }); i++; }\n    while (j < nums2.size()) { out.push_back({ nums2[j][0], nums2[j][1] }); j++; }\n    return out;\n}`,
        c: `int** mergeArrays(int** nums1, int nums1Size, int* nums1ColSize, int** nums2, int nums2Size, int* nums2ColSize, int* returnSize, int** returnColumnSizes) {\n    int cap = nums1Size + nums2Size;\n    int** out = (int**) malloc((size_t) cap * sizeof(int*));\n    int* cols = (int*) malloc((size_t) cap * sizeof(int));\n    int m = 0, i = 0, j = 0;\n    while (i < nums1Size && j < nums2Size) {\n        int* row = (int*) malloc(2 * sizeof(int));\n        if (nums1[i][0] == nums2[j][0]) {\n            row[0] = nums1[i][0];\n            row[1] = nums1[i][1] + nums2[j][1];\n            i++;\n            j++;\n        } else if (nums1[i][0] < nums2[j][0]) {\n            row[0] = nums1[i][0];\n            row[1] = nums1[i][1];\n            i++;\n        } else {\n            row[0] = nums2[j][0];\n            row[1] = nums2[j][1];\n            j++;\n        }\n        out[m] = row;\n        cols[m] = 2;\n        m++;\n    }\n    while (i < nums1Size) {\n        int* row = (int*) malloc(2 * sizeof(int));\n        row[0] = nums1[i][0];\n        row[1] = nums1[i][1];\n        out[m] = row;\n        cols[m] = 2;\n        m++;\n        i++;\n    }\n    while (j < nums2Size) {\n        int* row = (int*) malloc(2 * sizeof(int));\n        row[0] = nums2[j][0];\n        row[1] = nums2[j][1];\n        out[m] = row;\n        cols[m] = 2;\n        m++;\n        j++;\n    }\n    *returnSize = m;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] MergeArrays(int[][] nums1, int[][] nums2)\n{\n    var out_ = new List<int[]>();\n    int i = 0, j = 0;\n    while (i < nums1.Length && j < nums2.Length)\n    {\n        if (nums1[i][0] == nums2[j][0])\n        {\n            out_.Add(new int[] { nums1[i][0], nums1[i][1] + nums2[j][1] });\n            i++;\n            j++;\n        }\n        else if (nums1[i][0] < nums2[j][0])\n        {\n            out_.Add(new int[] { nums1[i][0], nums1[i][1] });\n            i++;\n        }\n        else\n        {\n            out_.Add(new int[] { nums2[j][0], nums2[j][1] });\n            j++;\n        }\n    }\n    while (i < nums1.Length) { out_.Add(new int[] { nums1[i][0], nums1[i][1] }); i++; }\n    while (j < nums2.Length) { out_.Add(new int[] { nums2[j][0], nums2[j][1] }); j++; }\n    return out_.ToArray();\n}`,
        go: `func mergeArrays(nums1 [][]int, nums2 [][]int) [][]int {\n\tout := [][]int{}\n\ti, j := 0, 0\n\tfor i < len(nums1) && j < len(nums2) {\n\t\tif nums1[i][0] == nums2[j][0] {\n\t\t\tout = append(out, []int{nums1[i][0], nums1[i][1] + nums2[j][1]})\n\t\t\ti++\n\t\t\tj++\n\t\t} else if nums1[i][0] < nums2[j][0] {\n\t\t\tout = append(out, []int{nums1[i][0], nums1[i][1]})\n\t\t\ti++\n\t\t} else {\n\t\t\tout = append(out, []int{nums2[j][0], nums2[j][1]})\n\t\t\tj++\n\t\t}\n\t}\n\tfor i < len(nums1) {\n\t\tout = append(out, []int{nums1[i][0], nums1[i][1]})\n\t\ti++\n\t}\n\tfor j < len(nums2) {\n\t\tout = append(out, []int{nums2[j][0], nums2[j][1]})\n\t\tj++\n\t}\n\treturn out\n}`,
        kotlin: `fun mergeArrays(nums1: Array<IntArray>, nums2: Array<IntArray>): Array<IntArray> {\n    val out = ArrayList<IntArray>()\n    var i = 0\n    var j = 0\n    while (i < nums1.size && j < nums2.size) {\n        if (nums1[i][0] == nums2[j][0]) {\n            out.add(intArrayOf(nums1[i][0], nums1[i][1] + nums2[j][1]))\n            i++\n            j++\n        } else if (nums1[i][0] < nums2[j][0]) {\n            out.add(intArrayOf(nums1[i][0], nums1[i][1]))\n            i++\n        } else {\n            out.add(intArrayOf(nums2[j][0], nums2[j][1]))\n            j++\n        }\n    }\n    while (i < nums1.size) {\n        out.add(intArrayOf(nums1[i][0], nums1[i][1]))\n        i++\n    }\n    while (j < nums2.size) {\n        out.add(intArrayOf(nums2[j][0], nums2[j][1]))\n        j++\n    }\n    return out.toTypedArray()\n}`,
        swift: `func mergeArrays(_ nums1: [[Int]], _ nums2: [[Int]]) -> [[Int]] {\n    var out: [[Int]] = []\n    var i = 0\n    var j = 0\n    while i < nums1.count && j < nums2.count {\n        if nums1[i][0] == nums2[j][0] {\n            out.append([nums1[i][0], nums1[i][1] + nums2[j][1]])\n            i += 1\n            j += 1\n        } else if nums1[i][0] < nums2[j][0] {\n            out.append([nums1[i][0], nums1[i][1]])\n            i += 1\n        } else {\n            out.append([nums2[j][0], nums2[j][1]])\n            j += 1\n        }\n    }\n    while i < nums1.count {\n        out.append([nums1[i][0], nums1[i][1]])\n        i += 1\n    }\n    while j < nums2.count {\n        out.append([nums2[j][0], nums2[j][1]])\n        j += 1\n    }\n    return out\n}`,
        rust: `fn mergeArrays(nums1: Vec<Vec<i32>>, nums2: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let (mut i, mut j) = (0usize, 0usize);\n    while i < nums1.len() && j < nums2.len() {\n        if nums1[i][0] == nums2[j][0] {\n            out.push(vec![nums1[i][0], nums1[i][1] + nums2[j][1]]);\n            i += 1;\n            j += 1;\n        } else if nums1[i][0] < nums2[j][0] {\n            out.push(vec![nums1[i][0], nums1[i][1]]);\n            i += 1;\n        } else {\n            out.push(vec![nums2[j][0], nums2[j][1]]);\n            j += 1;\n        }\n    }\n    while i < nums1.len() {\n        out.push(vec![nums1[i][0], nums1[i][1]]);\n        i += 1;\n    }\n    while j < nums2.len() {\n        out.push(vec![nums2[j][0], nums2[j][1]]);\n        j += 1;\n    }\n    out\n}`,
        php: `function mergeArrays($nums1, $nums2) {\n    $out = array();\n    $i = 0;\n    $j = 0;\n    while ($i < count($nums1) && $j < count($nums2)) {\n        if ($nums1[$i][0] === $nums2[$j][0]) {\n            $out[] = array($nums1[$i][0], $nums1[$i][1] + $nums2[$j][1]);\n            $i++;\n            $j++;\n        } else if ($nums1[$i][0] < $nums2[$j][0]) {\n            $out[] = array($nums1[$i][0], $nums1[$i][1]);\n            $i++;\n        } else {\n            $out[] = array($nums2[$j][0], $nums2[$j][1]);\n            $j++;\n        }\n    }\n    while ($i < count($nums1)) { $out[] = array($nums1[$i][0], $nums1[$i][1]); $i++; }\n    while ($j < count($nums2)) { $out[] = array($nums2[$j][0], $nums2[$j][1]); $j++; }\n    return $out;\n}`,
        ruby: `def mergeArrays(nums1, nums2)\n  out = []\n  i = 0\n  j = 0\n  while i < nums1.length && j < nums2.length\n    if nums1[i][0] == nums2[j][0]\n      out << [nums1[i][0], nums1[i][1] + nums2[j][1]]\n      i += 1\n      j += 1\n    elsif nums1[i][0] < nums2[j][0]\n      out << [nums1[i][0], nums1[i][1]]\n      i += 1\n    else\n      out << [nums2[j][0], nums2[j][1]]\n      j += 1\n    end\n  end\n  while i < nums1.length\n    out << [nums1[i][0], nums1[i][1]]\n    i += 1\n  end\n  while j < nums2.length\n    out << [nums2[j][0], nums2[j][1]]\n    j += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Find the Distance Value Between Two Arrays (LC 1385) ────────
  (() => {
    const ref = (arr1: number[], arr2: number[], d: number) => {
      let total = 0;
      for (const a of arr1) {
        let ok = true;
        for (const b of arr2) { if (Math.abs(a - b) <= d) { ok = false; break; } }
        if (ok) total++;
      }
      return total;
    };
    return {
      slug: "find-the-distance-value-between-two-arrays",
      title: "Find the Distance Value Between Two Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "TCS", "Wipro", "Amazon"],
      signature: { funcName: "findTheDistanceValue", params: [{ name: "arr1", type: "int[]" as const }, { name: "arr2", type: "int[]" as const }, { name: "d", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **distance value** is the number of elements `a` in `arr1` for which there is **no** element `b` in `arr2` with `|a - b| <= d`.\n\nReturn the distance value.",
        [
          { in: "arr1 = [4,5,8], arr2 = [10,9,1,8], d = 2", out: "2", note: "Only 8 has a neighbour within 2 (namely 8 and 9)." },
          { in: "arr1 = [1,4,2,3], arr2 = [-4,-3,6,10,20,30], d = 3", out: "2" },
          { in: "arr1 = [2,1,100,3], arr2 = [-5,-2,10,-3,7], d = 6", out: "1" },
        ],
        ["1 <= arr1.length, arr2.length <= 500", "-1000 <= arr1[i], arr2[j] <= 1000", "0 <= d <= 100"]),
      hints: [
        "The direct double loop is `O(n·m)` and fine at these sizes.",
        "The faster route sorts `arr2` and binary searches for the nearest value to each `a`.",
        "Only the closest element on each side can violate the condition.",
      ],
      editorial: explain({
        idea: "An element of `arr1` survives when the whole of `arr2` stays strictly further than `d` away from it. Checking that directly is a nested scan; sorting `arr2` lets a binary search test only the two nearest candidates.",
        steps: [
          "For each `a` in `arr1`, scan `arr2` for any `b` with `|a - b| <= d`.",
          "Count `a` when no such `b` exists.",
          "To speed it up: sort `arr2`, binary search for `a`, and test only the neighbour on each side.",
        ],
        why: "If any element of `arr2` lies within `d` of `a`, the closest one does — so testing the immediate predecessor and successor in sorted order is exhaustive.",
        time: "O(n · m), or O((n + m) log m) with sorting",
        space: "O(1)",
        pitfalls: [
          "`<= d` is inclusive, so a difference of exactly `d` disqualifies the element.",
          "Counting elements of `arr2` rather than `arr1` answers the mirror question.",
          "Negative values mean the absolute difference is essential.",
        ],
      }),
      examples: [
        { input: "[4,5,8]\n[10,9,1,8]\n2", expectedOutput: "2" },
        { input: "[1,4,2,3]\n[-4,-3,6,10,20,30]\n3", expectedOutput: "2" },
        { input: "[2,1,100,3]\n[-5,-2,10,-3,7]\n6", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const arr1 = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, -1000, 1000));
        const arr2 = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, -1000, 1000));
        const d = ri(rng, 0, 100);
        return { input: `${fmtIntArr(arr1)}\n${fmtIntArr(arr2)}\n${d}`, expectedOutput: String(ref(arr1, arr2, d)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findTheDistanceValue(arr1: List[int], arr2: List[int], d: int) -> int:\n    return sum(1 for a in arr1 if all(abs(a - b) > d for b in arr2))`,
        javascript: `var findTheDistanceValue = function(arr1, arr2, d) {\n    var total = 0;\n    for (var i = 0; i < arr1.length; i++) {\n        var ok = true;\n        for (var j = 0; j < arr2.length; j++) {\n            if (Math.abs(arr1[i] - arr2[j]) <= d) { ok = false; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n};`,
        typescript: `function findTheDistanceValue(arr1: number[], arr2: number[], d: number): number {\n    var total = 0;\n    for (var i = 0; i < arr1.length; i++) {\n        var ok = true;\n        for (var j = 0; j < arr2.length; j++) {\n            if (Math.abs(arr1[i] - arr2[j]) <= d) { ok = false; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n}`,
        java: `public static int findTheDistanceValue(int[] arr1, int[] arr2, int d) {\n    int total = 0;\n    for (int a : arr1) {\n        boolean ok = true;\n        for (int b : arr2) {\n            if (Math.abs(a - b) <= d) { ok = false; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n}`,
        cpp: `int findTheDistanceValue(vector<int>& arr1, vector<int>& arr2, int d) {\n    int total = 0;\n    for (int a : arr1) {\n        bool ok = true;\n        for (int b : arr2) {\n            if (abs(a - b) <= d) { ok = false; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n}`,
        c: `int findTheDistanceValue(int* arr1, int arr1Size, int* arr2, int arr2Size, int d) {\n    int total = 0;\n    for (int i = 0; i < arr1Size; i++) {\n        int ok = 1;\n        for (int j = 0; j < arr2Size; j++) {\n            int diff = arr1[i] - arr2[j];\n            if (diff < 0) diff = -diff;\n            if (diff <= d) { ok = 0; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n}`,
        csharp: `public static int FindTheDistanceValue(int[] arr1, int[] arr2, int d)\n{\n    int total = 0;\n    foreach (int a in arr1)\n    {\n        bool ok = true;\n        foreach (int b in arr2)\n        {\n            if (Math.Abs(a - b) <= d) { ok = false; break; }\n        }\n        if (ok) total++;\n    }\n    return total;\n}`,
        go: `func findTheDistanceValue(arr1 []int, arr2 []int, d int) int {\n\ttotal := 0\n\tfor _, a := range arr1 {\n\t\tok := true\n\t\tfor _, b := range arr2 {\n\t\t\tdiff := a - b\n\t\t\tif diff < 0 {\n\t\t\t\tdiff = -diff\n\t\t\t}\n\t\t\tif diff <= d {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun findTheDistanceValue(arr1: IntArray, arr2: IntArray, d: Int): Int {\n    var total = 0\n    for (a in arr1) {\n        var ok = true\n        for (b in arr2) {\n            if (Math.abs(a - b) <= d) {\n                ok = false\n                break\n            }\n        }\n        if (ok) total++\n    }\n    return total\n}`,
        swift: `func findTheDistanceValue(_ arr1: [Int], _ arr2: [Int], _ d: Int) -> Int {\n    var total = 0\n    for a in arr1 {\n        var ok = true\n        for b in arr2 where abs(a - b) <= d {\n            ok = false\n            break\n        }\n        if ok { total += 1 }\n    }\n    return total\n}`,
        rust: `fn findTheDistanceValue(arr1: Vec<i32>, arr2: Vec<i32>, d: i32) -> i32 {\n    let mut total = 0;\n    for &a in arr1.iter() {\n        let mut ok = true;\n        for &b in arr2.iter() {\n            if (a - b).abs() <= d {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function findTheDistanceValue($arr1, $arr2, $d) {\n    $total = 0;\n    foreach ($arr1 as $a) {\n        $ok = true;\n        foreach ($arr2 as $b) {\n            if (abs($a - $b) <= $d) { $ok = false; break; }\n        }\n        if ($ok) $total++;\n    }\n    return $total;\n}`,
        ruby: `def findTheDistanceValue(arr1, arr2, d)\n  arr1.count { |a| arr2.all? { |b| (a - b).abs > d } }\nend`,
      },
    };
  })(),

  // ── Two Sum Less Than K (LC 1099) ───────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      let lo = 0, hi = s.length - 1, best = -1;
      while (lo < hi) {
        const sum = s[lo] + s[hi];
        if (sum < k) { if (sum > best) best = sum; lo++; }
        else hi--;
      }
      return best;
    };
    return {
      slug: "two-sum-less-than-k",
      title: "Two Sum Less Than K",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Infosys", "Zoho"],
      signature: { funcName: "twoSumLessThanK", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Find two **distinct indices** `i < j` maximising `nums[i] + nums[j]` subject to the sum being strictly less than `k`.\n\nReturn that maximum sum, or `-1` if no pair qualifies.",
        [
          { in: "nums = [34,23,1,24,75,33,54,8], k = 60", out: "58", note: "24 + 34 = 58 is the largest sum below 60." },
          { in: "nums = [10,20,30], k = 15", out: "-1", note: "Every pair sums to at least 30." },
          { in: "nums = [1,2], k = 4", out: "3" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 1000", "1 <= k <= 2000"]),
      hints: [
        "Sort, then walk two pointers inward from the ends.",
        "If the current sum is already below `k`, it is the best for this left element — record it and move the left pointer up.",
        "Otherwise the sum is too big, so move the right pointer down.",
      ],
      editorial: explain({
        idea: "After sorting, the two-pointer sweep considers every left element paired with the largest partner that could work, which is exactly what maximising under an upper bound needs.",
        steps: [
          "Sort a copy of `nums`.",
          "Start `lo` at the front and `hi` at the back.",
          "If `s[lo] + s[hi] < k`, record it as a candidate and advance `lo` — no larger partner exists for this `lo`.",
          "Otherwise retreat `hi`.",
        ],
        why: "For a fixed `lo`, the sums decrease as `hi` decreases, so the first `hi` that brings the sum under `k` gives the best pair for that `lo`. Advancing `lo` afterwards is safe because every larger `hi` has already been ruled out for the remaining lefts.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Strictly less than `k`, so a sum equal to `k` does not count.",
          "Returning `0` when nothing qualifies — the sentinel is `-1`.",
          "A single-element array has no pair at all.",
        ],
      }),
      examples: [
        { input: "[34,23,1,24,75,33,54,8]\n60", expectedOutput: "58" },
        { input: "[10,20,30]\n15", expectedOutput: "-1" },
        { input: "[1,2]\n4", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 1000));
        const k = ri(rng, 1, 2000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef twoSumLessThanK(nums: List[int], k: int) -> int:\n    s = sorted(nums)\n    lo, hi = 0, len(s) - 1\n    best = -1\n    while lo < hi:\n        total = s[lo] + s[hi]\n        if total < k:\n            best = max(best, total)\n            lo += 1\n        else:\n            hi -= 1\n    return best`,
        javascript: `var twoSumLessThanK = function(nums, k) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, best = -1;\n    while (lo < hi) {\n        var sum = s[lo] + s[hi];\n        if (sum < k) {\n            if (sum > best) best = sum;\n            lo++;\n        } else hi--;\n    }\n    return best;\n};`,
        typescript: `function twoSumLessThanK(nums: number[], k: number): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, best = -1;\n    while (lo < hi) {\n        var sum = s[lo] + s[hi];\n        if (sum < k) {\n            if (sum > best) best = sum;\n            lo++;\n        } else hi--;\n    }\n    return best;\n}`,
        java: `public static int twoSumLessThanK(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int lo = 0, hi = s.length - 1, best = -1;\n    while (lo < hi) {\n        int sum = s[lo] + s[hi];\n        if (sum < k) {\n            best = Math.max(best, sum);\n            lo++;\n        } else hi--;\n    }\n    return best;\n}`,
        cpp: `int twoSumLessThanK(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int lo = 0, hi = (int) s.size() - 1, best = -1;\n    while (lo < hi) {\n        int sum = s[lo] + s[hi];\n        if (sum < k) {\n            best = max(best, sum);\n            lo++;\n        } else hi--;\n    }\n    return best;\n}`,
        c: `static int cmpTwoSumAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint twoSumLessThanK(int* nums, int numsSize, int k) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpTwoSumAsc);\n    int lo = 0, hi = numsSize - 1, best = -1;\n    while (lo < hi) {\n        int sum = s[lo] + s[hi];\n        if (sum < k) {\n            if (sum > best) best = sum;\n            lo++;\n        } else hi--;\n    }\n    free(s);\n    return best;\n}`,
        csharp: `public static int TwoSumLessThanK(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int lo = 0, hi = s.Length - 1, best = -1;\n    while (lo < hi)\n    {\n        int sum = s[lo] + s[hi];\n        if (sum < k)\n        {\n            if (sum > best) best = sum;\n            lo++;\n        }\n        else hi--;\n    }\n    return best;\n}`,
        go: `func twoSumLessThanK(nums []int, k int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tlo, hi, best := 0, len(s)-1, -1\n\tfor lo < hi {\n\t\tsum := s[lo] + s[hi]\n\t\tif sum < k {\n\t\t\tif sum > best {\n\t\t\t\tbest = sum\n\t\t\t}\n\t\t\tlo++\n\t\t} else {\n\t\t\thi--\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun twoSumLessThanK(nums: IntArray, k: Int): Int {\n    val s = nums.sortedArray()\n    var lo = 0\n    var hi = s.size - 1\n    var best = -1\n    while (lo < hi) {\n        val sum = s[lo] + s[hi]\n        if (sum < k) {\n            if (sum > best) best = sum\n            lo++\n        } else hi--\n    }\n    return best\n}`,
        swift: `func twoSumLessThanK(_ nums: [Int], _ k: Int) -> Int {\n    let s = nums.sorted()\n    var lo = 0\n    var hi = s.count - 1\n    var best = -1\n    while lo < hi {\n        let sum = s[lo] + s[hi]\n        if sum < k {\n            if sum > best { best = sum }\n            lo += 1\n        } else {\n            hi -= 1\n        }\n    }\n    return best\n}`,
        rust: `fn twoSumLessThanK(nums: Vec<i32>, k: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut lo: i32 = 0;\n    let mut hi: i32 = s.len() as i32 - 1;\n    let mut best = -1i32;\n    while lo < hi {\n        let sum = s[lo as usize] + s[hi as usize];\n        if sum < k {\n            if sum > best {\n                best = sum;\n            }\n            lo += 1;\n        } else {\n            hi -= 1;\n        }\n    }\n    best\n}`,
        php: `function twoSumLessThanK($nums, $k) {\n    $s = $nums;\n    sort($s);\n    $lo = 0;\n    $hi = count($s) - 1;\n    $best = -1;\n    while ($lo < $hi) {\n        $sum = $s[$lo] + $s[$hi];\n        if ($sum < $k) {\n            if ($sum > $best) $best = $sum;\n            $lo++;\n        } else {\n            $hi--;\n        }\n    }\n    return $best;\n}`,
        ruby: `def twoSumLessThanK(nums, k)\n  s = nums.sort\n  lo = 0\n  hi = s.length - 1\n  best = -1\n  while lo < hi\n    sum = s[lo] + s[hi]\n    if sum < k\n      best = sum if sum > best\n      lo += 1\n    else\n      hi -= 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── DI String Match (LC 942) ────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let lo = 0, hi = s.length;
      const out: number[] = [];
      for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "I") { out.push(lo); lo++; }
        else { out.push(hi); hi--; }
      }
      out.push(lo);
      return out;
    };
    return {
      slug: "di-string-match",
      title: "DI String Match",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Greedy", "String", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "diStringMatch", params: [{ name: "s", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "A string `s` of `n` characters, each `'I'` (increase) or `'D'` (decrease), describes a permutation `perm` of `0 … n`: `perm[i] < perm[i+1]` where `s[i]` is `'I'`, and `perm[i] > perm[i+1]` where it is `'D'`.\n\nReturn any valid `perm`. To make the answer unique, produce the one built by the greedy rule: emit the smallest unused value for `'I'` and the largest unused value for `'D'`.",
        [
          { in: 's = "IDID"', out: "[0,4,1,3,2]", note: "0 < 4 > 1 < 3 > 2." },
          { in: 's = "III"', out: "[0,1,2,3]" },
          { in: 's = "DDI"', out: "[3,2,0,1]" },
        ],
        ["1 <= s.length <= 100000", "s[i] is 'I' or 'D'."]),
      hints: [
        "Keep two counters: the smallest unused value and the largest unused value.",
        "An `'I'` should emit the smallest remaining value, so whatever comes next is certainly larger.",
        "A `'D'` should emit the largest remaining value, so whatever comes next is certainly smaller.",
      ],
      editorial: explain({
        idea: "Emitting the extreme value makes the next comparison automatic: after taking the minimum, every remaining value is bigger; after taking the maximum, every remaining value is smaller. That satisfies each constraint without ever looking ahead.",
        steps: [
          "Set `lo = 0` and `hi = n`.",
          "For each character: on `'I'` append `lo` and increment it; on `'D'` append `hi` and decrement it.",
          "After the loop, `lo` equals `hi`; append it as the final element.",
        ],
        why: "Each step consumes one value from an end of the untouched range `[lo, hi]`, so all `n + 1` values are used exactly once. The constraint at position `i` is satisfied because the value emitted is the extreme of the remaining range, and the next value is drawn from that range.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Forgetting the final append leaves the permutation one element short.",
          "Swapping the roles of `lo` and `hi` breaks every constraint.",
          "The answer is not unique in general; this statement pins down the greedy one.",
        ],
      }),
      examples: [
        { input: '"IDID"', expectedOutput: "[0,4,1,3,2]" },
        { input: '"III"', expectedOutput: "[0,1,2,3]" },
        { input: '"DDI"', expectedOutput: "[3,2,0,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const s = Array.from({ length: n }, () => (rng() < 0.5 ? "I" : "D")).join("");
        return { input: `"${s}"`, expectedOutput: fmtIntArr(ref(s)) };
      },
      solutions: {
        python: `from typing import List\n\ndef diStringMatch(s: str) -> List[int]:\n    lo, hi = 0, len(s)\n    out = []\n    for c in s:\n        if c == "I":\n            out.append(lo)\n            lo += 1\n        else:\n            out.append(hi)\n            hi -= 1\n    out.append(lo)\n    return out`,
        javascript: `var diStringMatch = function(s) {\n    var lo = 0, hi = s.length;\n    var out = [];\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "I") { out.push(lo); lo++; }\n        else { out.push(hi); hi--; }\n    }\n    out.push(lo);\n    return out;\n};`,
        typescript: `function diStringMatch(s: string): number[] {\n    var lo = 0, hi = s.length;\n    var out: number[] = [];\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "I") { out.push(lo); lo++; }\n        else { out.push(hi); hi--; }\n    }\n    out.push(lo);\n    return out;\n}`,
        java: `public static int[] diStringMatch(String s) {\n    int n = s.length();\n    int lo = 0, hi = n;\n    int[] out = new int[n + 1];\n    for (int i = 0; i < n; i++) {\n        if (s.charAt(i) == 'I') out[i] = lo++;\n        else out[i] = hi--;\n    }\n    out[n] = lo;\n    return out;\n}`,
        cpp: `vector<int> diStringMatch(string s) {\n    int n = (int) s.size();\n    int lo = 0, hi = n;\n    vector<int> out(n + 1);\n    for (int i = 0; i < n; i++) {\n        if (s[i] == 'I') out[i] = lo++;\n        else out[i] = hi--;\n    }\n    out[n] = lo;\n    return out;\n}`,
        c: `int* diStringMatch(char* s, int* returnSize) {\n    int n = (int) strlen(s);\n    int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int lo = 0, hi = n;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == 'I') out[i] = lo++;\n        else out[i] = hi--;\n    }\n    out[n] = lo;\n    *returnSize = n + 1;\n    return out;\n}`,
        csharp: `public static int[] DiStringMatch(string s)\n{\n    int n = s.Length;\n    int lo = 0, hi = n;\n    int[] out_ = new int[n + 1];\n    for (int i = 0; i < n; i++)\n    {\n        if (s[i] == 'I') out_[i] = lo++;\n        else out_[i] = hi--;\n    }\n    out_[n] = lo;\n    return out_;\n}`,
        go: `func diStringMatch(s string) []int {\n\tn := len(s)\n\tlo, hi := 0, n\n\tout := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tif s[i] == \'I\' {\n\t\t\tout[i] = lo\n\t\t\tlo++\n\t\t} else {\n\t\t\tout[i] = hi\n\t\t\thi--\n\t\t}\n\t}\n\tout[n] = lo\n\treturn out\n}`,
        kotlin: `fun diStringMatch(s: String): IntArray {\n    val n = s.length\n    var lo = 0\n    var hi = n\n    val out = IntArray(n + 1)\n    for (i in 0 until n) {\n        if (s[i] == \'I\') {\n            out[i] = lo\n            lo++\n        } else {\n            out[i] = hi\n            hi--\n        }\n    }\n    out[n] = lo\n    return out\n}`,
        swift: `func diStringMatch(_ s: String) -> [Int] {\n    let a = Array(s)\n    let n = a.count\n    var lo = 0\n    var hi = n\n    var out = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n {\n        if a[i] == "I" {\n            out[i] = lo\n            lo += 1\n        } else {\n            out[i] = hi\n            hi -= 1\n        }\n    }\n    out[n] = lo\n    return out\n}`,
        rust: `fn diStringMatch(s: String) -> Vec<i32> {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut lo = 0i32;\n    let mut hi = n as i32;\n    let mut out = vec![0i32; n + 1];\n    for i in 0..n {\n        if b[i] == b\'I\' {\n            out[i] = lo;\n            lo += 1;\n        } else {\n            out[i] = hi;\n            hi -= 1;\n        }\n    }\n    out[n] = lo;\n    out\n}`,
        php: `function diStringMatch($s) {\n    $n = strlen($s);\n    $lo = 0;\n    $hi = $n;\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "I") { $out[] = $lo; $lo++; }\n        else { $out[] = $hi; $hi--; }\n    }\n    $out[] = $lo;\n    return $out;\n}`,
        ruby: `def diStringMatch(s)\n  lo = 0\n  hi = s.length\n  out = []\n  s.each_char do |c|\n    if c == "I"\n      out << lo\n      lo += 1\n    else\n      out << hi\n      hi -= 1\n    end\n  end\n  out << lo\n  out\nend`,
      },
    };
  })(),

  // ── Intersection of Multiple Arrays (LC 2248) ───────────────────
  (() => {
    const ref = (nums: number[][]) => {
      const count: Record<string, number> = {};
      for (const row of nums) {
        const seen: Record<string, boolean> = {};
        for (const v of row) {
          const k = String(v);
          if (seen[k] === true) continue;
          seen[k] = true;
          count[k] = (count[k] === undefined ? 0 : count[k]) + 1;
        }
      }
      const out: number[] = [];
      for (const k of Object.keys(count)) { if (count[k] === nums.length) out.push(Number(k)); }
      out.sort((a, b) => a - b);
      return out;
    };
    return {
      slug: "intersection-of-multiple-arrays",
      title: "Intersection of Multiple Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "intersection", params: [{ name: "nums", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a list of integer arrays, return the values that appear in **every** one of them, sorted in ascending order.\n\nIf no value is common to all, return `[]`.",
        [
          { in: "nums = [[3,1,2,4,5],[1,2,3,4],[3,4,5,6]]", out: "[3,4]", note: "3 and 4 appear in all three lists." },
          { in: "nums = [[1,2,3],[4,5,6]]", out: "[]", note: "The lists are disjoint." },
          { in: "nums = [[7,7,7]]", out: "[7]", note: "With one list, every distinct value qualifies." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i].length <= 1000", "1 <= nums[i][j] <= 1000"]),
      hints: [
        "Count, for each value, in how many **distinct** lists it appears.",
        "Deduplicate within each list first, or a repeated value inflates its count.",
        "A value belongs to the answer exactly when its count equals the number of lists.",
      ],
      editorial: explain({
        idea: "Membership in the intersection is a per-value count: a value is common to all when the number of lists containing it equals the number of lists. Deduplicating within each list is what makes the count meaningful.",
        steps: [
          "For each list, walk it while deduplicating, and increment a global tally per distinct value.",
          "Collect the values whose tally equals `nums.length`.",
          "Sort the result ascending.",
        ],
        why: "The tally counts lists, not occurrences, so a value repeated inside one list still contributes 1. Reaching the full count therefore means the value appeared in every list.",
        time: "O(total elements + V log V)",
        space: "O(V)",
        pitfalls: [
          "Counting raw occurrences lets a value repeated three times in one list masquerade as appearing in three lists.",
          "Returning the values in insertion order rather than sorted.",
          "The values are bounded by 1000, so a counting array is simpler than a hash map here.",
        ],
      }),
      examples: [
        { input: "[[3,1,2,4,5],[1,2,3,4],[3,4,5,6]]", expectedOutput: "[3,4]" },
        { input: "[[1,2,3],[4,5,6]]", expectedOutput: "[]" },
        { input: "[[7,7,7]]", expectedOutput: "[7]" },
      ],
      gen: (rng: Rng) => {
        const lists = ri(rng, 1, 5);
        const hi = rng() < 0.6 ? 8 : 1000;
        const nums = Array.from({ length: lists }, () => Array.from({ length: ri(rng, 1, 10) }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef intersection(nums: List[List[int]]) -> List[int]:\n    count = {}\n    for row in nums:\n        for v in set(row):\n            count[v] = count.get(v, 0) + 1\n    return sorted(v for v, c in count.items() if c == len(nums))`,
        javascript: `var intersection = function(nums) {\n    var count = {};\n    for (var r = 0; r < nums.length; r++) {\n        var seen = {};\n        for (var i = 0; i < nums[r].length; i++) {\n            var k = String(nums[r][i]);\n            if (seen[k] === true) continue;\n            seen[k] = true;\n            count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n        }\n    }\n    var out = [];\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        if (count[keys[j]] === nums.length) out.push(Number(keys[j]));\n    }\n    out.sort(function(a, b) { return a - b; });\n    return out;\n};`,
        typescript: `function intersection(nums: number[][]): number[] {\n    var count: { [key: string]: number } = {};\n    for (var r = 0; r < nums.length; r++) {\n        var seen: { [key: string]: boolean } = {};\n        for (var i = 0; i < nums[r].length; i++) {\n            var k = String(nums[r][i]);\n            if (seen[k] === true) continue;\n            seen[k] = true;\n            count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n        }\n    }\n    var out: number[] = [];\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        if (count[keys[j]] === nums.length) out.push(Number(keys[j]));\n    }\n    out.sort(function(a, b) { return a - b; });\n    return out;\n}`,
        java: `public static int[] intersection(int[][] nums) {\n    int[] count = new int[1001];\n    for (int[] row : nums) {\n        boolean[] seen = new boolean[1001];\n        for (int v : row) {\n            if (seen[v]) continue;\n            seen[v] = true;\n            count[v]++;\n        }\n    }\n    List<Integer> out = new ArrayList<>();\n    for (int v = 1; v <= 1000; v++) {\n        if (count[v] == nums.length) out.add(v);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
        cpp: `vector<int> intersection(vector<vector<int>>& nums) {\n    vector<int> count(1001, 0);\n    for (auto& row : nums) {\n        vector<bool> seen(1001, false);\n        for (int v : row) {\n            if (seen[v]) continue;\n            seen[v] = true;\n            count[v]++;\n        }\n    }\n    vector<int> out;\n    for (int v = 1; v <= 1000; v++) {\n        if (count[v] == (int) nums.size()) out.push_back(v);\n    }\n    return out;\n}`,
        c: `int* intersection(int** nums, int numsSize, int* numsColSize, int* returnSize) {\n    int count[1001];\n    memset(count, 0, sizeof(count));\n    for (int r = 0; r < numsSize; r++) {\n        int seen[1001];\n        memset(seen, 0, sizeof(seen));\n        for (int i = 0; i < numsColSize[r]; i++) {\n            int v = nums[r][i];\n            if (seen[v]) continue;\n            seen[v] = 1;\n            count[v]++;\n        }\n    }\n    int* out = (int*) malloc(1001 * sizeof(int));\n    int m = 0;\n    for (int v = 1; v <= 1000; v++) {\n        if (count[v] == numsSize) out[m++] = v;\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] Intersection(int[][] nums)\n{\n    int[] count = new int[1001];\n    foreach (var row in nums)\n    {\n        bool[] seen = new bool[1001];\n        foreach (int v in row)\n        {\n            if (seen[v]) continue;\n            seen[v] = true;\n            count[v]++;\n        }\n    }\n    var out_ = new List<int>();\n    for (int v = 1; v <= 1000; v++)\n    {\n        if (count[v] == nums.Length) out_.Add(v);\n    }\n    return out_.ToArray();\n}`,
        go: `func intersection(nums [][]int) []int {\n\tcount := make([]int, 1001)\n\tfor _, row := range nums {\n\t\tseen := make([]bool, 1001)\n\t\tfor _, v := range row {\n\t\t\tif seen[v] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tseen[v] = true\n\t\t\tcount[v]++\n\t\t}\n\t}\n\tout := []int{}\n\tfor v := 1; v <= 1000; v++ {\n\t\tif count[v] == len(nums) {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun intersection(nums: Array<IntArray>): IntArray {\n    val count = IntArray(1001)\n    for (row in nums) {\n        val seen = BooleanArray(1001)\n        for (v in row) {\n            if (seen[v]) continue\n            seen[v] = true\n            count[v]++\n        }\n    }\n    val out = ArrayList<Int>()\n    for (v in 1..1000) {\n        if (count[v] == nums.size) out.add(v)\n    }\n    return out.toIntArray()\n}`,
        swift: `func intersection(_ nums: [[Int]]) -> [Int] {\n    var count = [Int](repeating: 0, count: 1001)\n    for row in nums {\n        var seen = [Bool](repeating: false, count: 1001)\n        for v in row {\n            if seen[v] { continue }\n            seen[v] = true\n            count[v] += 1\n        }\n    }\n    var out: [Int] = []\n    for v in 1...1000 where count[v] == nums.count { out.append(v) }\n    return out\n}`,
        rust: `fn intersection(nums: Vec<Vec<i32>>) -> Vec<i32> {\n    let mut count = vec![0i32; 1001];\n    for row in nums.iter() {\n        let mut seen = vec![false; 1001];\n        for &v in row.iter() {\n            let idx = v as usize;\n            if seen[idx] {\n                continue;\n            }\n            seen[idx] = true;\n            count[idx] += 1;\n        }\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for v in 1..=1000 {\n        if count[v] == nums.len() as i32 {\n            out.push(v as i32);\n        }\n    }\n    out\n}`,
        php: `function intersection($nums) {\n    $count = array_fill(0, 1001, 0);\n    foreach ($nums as $row) {\n        $seen = array();\n        foreach ($row as $v) {\n            if (isset($seen[$v])) continue;\n            $seen[$v] = true;\n            $count[$v]++;\n        }\n    }\n    $out = array();\n    for ($v = 1; $v <= 1000; $v++) {\n        if ($count[$v] === count($nums)) $out[] = $v;\n    }\n    return $out;\n}`,
        ruby: `def intersection(nums)\n  count = Hash.new(0)\n  nums.each { |row| row.uniq.each { |v| count[v] += 1 } }\n  count.select { |_, c| c == nums.length }.keys.sort\nend`,
      },
    };
  })(),

  // ── Shortest Distance to Target String in a Circular Array (LC 2515) ──
  (() => {
    const ref = (words: string[], target: string, startIndex: number) => {
      const n = words.length;
      let best = -1;
      for (let i = 0; i < n; i++) {
        if (words[i] !== target) continue;
        const forward = (i - startIndex + n) % n;
        const backward = (startIndex - i + n) % n;
        const d = Math.min(forward, backward);
        if (best < 0 || d < best) best = d;
      }
      return best;
    };
    return {
      slug: "shortest-distance-to-target-string-in-a-circular-array",
      title: "Shortest Distance to Target String in a Circular Array",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Two Pointers", "TCS", "Capgemini", "Amazon"],
      signature: { funcName: "closetTarget", params: [{ name: "words", type: "string[]" as const }, { name: "target", type: "string" as const }, { name: "startIndex", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The array `words` is **circular**: stepping right from the last index lands on index 0, and stepping left from index 0 lands on the last.\n\nStarting at `startIndex`, return the minimum number of steps needed to reach any index holding `target`, or `-1` if `target` does not appear.",
        [
          { in: 'words = ["kata","duel","codekairo","rank","codekairo"], target = "codekairo", startIndex = 1', out: "1", note: "One step right reaches index 2." },
          { in: 'words = ["a","b","codekairo"], target = "codekairo", startIndex = 0', out: "1", note: "One step left wraps to index 2." },
          { in: 'words = ["i","eat","kata"], target = "ate", startIndex = 0', out: "-1" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length, target.length <= 10", "0 <= startIndex < words.length", "Strings consist of lowercase English letters."]),
      hints: [
        "For each matching index, the distance is the smaller of going right and going left.",
        "Going right takes `(i - startIndex + n) % n` steps; going left takes `(startIndex - i + n) % n`.",
        "Take the minimum over all matches, or return `-1` if there are none.",
      ],
      editorial: explain({
        idea: "The circle gives two routes to any index, and their lengths are the two modular differences. Scanning every match and taking the smaller route is enough.",
        steps: [
          "Sweep the array for indices holding `target`.",
          "For each, compute the clockwise distance `(i - startIndex + n) % n` and the anticlockwise one `(startIndex - i + n) % n`.",
          "Keep the minimum of all those values, or `-1` if no match was found.",
        ],
        why: "On a cycle of length `n`, the two routes between two positions sum to `n` (or are both 0 when the positions coincide), so the shorter of the two modular differences is the graph distance.",
        time: "O(n · L)",
        space: "O(1)",
        pitfalls: [
          "Computing `|i - startIndex|` ignores the wrap and overstates distances near the ends.",
          "Adding `n` before the modulo is what keeps the result non-negative in languages where `%` can go negative.",
          "`startIndex` itself may hold the target, giving a distance of 0.",
        ],
      }),
      examples: [
        { input: '["kata","duel","codekairo","rank","codekairo"]\n"codekairo"\n1', expectedOutput: "1" },
        { input: '["a","b","codekairo"]\n"codekairo"\n0', expectedOutput: "1" },
        { input: '["i","eat","kata"]\n"ate"\n0', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const vocab = ["kata", "duel", "rank", "solve", "codekairo", "streak", "round"];
        const n = ri(rng, 1, 20);
        const words = Array.from({ length: n }, () => pick(rng, vocab));
        const target = pick(rng, vocab);
        const startIndex = ri(rng, 0, n - 1);
        return { input: `${fmtStrArr(words)}\n"${target}"\n${startIndex}`, expectedOutput: String(ref(words, target, startIndex)) };
      },
      solutions: {
        python: `from typing import List\n\ndef closetTarget(words: List[str], target: str, startIndex: int) -> int:\n    n = len(words)\n    best = -1\n    for i, w in enumerate(words):\n        if w != target:\n            continue\n        d = min((i - startIndex) % n, (startIndex - i) % n)\n        if best < 0 or d < best:\n            best = d\n    return best`,
        javascript: `var closetTarget = function(words, target, startIndex) {\n    var n = words.length, best = -1;\n    for (var i = 0; i < n; i++) {\n        if (words[i] !== target) continue;\n        var forward = (i - startIndex + n) % n;\n        var backward = (startIndex - i + n) % n;\n        var d = Math.min(forward, backward);\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n};`,
        typescript: `function closetTarget(words: string[], target: string, startIndex: number): number {\n    var n = words.length, best = -1;\n    for (var i = 0; i < n; i++) {\n        if (words[i] !== target) continue;\n        var forward = (i - startIndex + n) % n;\n        var backward = (startIndex - i + n) % n;\n        var d = Math.min(forward, backward);\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,
        java: `public static int closetTarget(String[] words, String target, int startIndex) {\n    int n = words.length, best = -1;\n    for (int i = 0; i < n; i++) {\n        if (!words[i].equals(target)) continue;\n        int forward = (i - startIndex + n) % n;\n        int backward = (startIndex - i + n) % n;\n        int d = Math.min(forward, backward);\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,
        cpp: `int closetTarget(vector<string>& words, string target, int startIndex) {\n    int n = (int) words.size(), best = -1;\n    for (int i = 0; i < n; i++) {\n        if (words[i] != target) continue;\n        int forward = (i - startIndex + n) % n;\n        int backward = (startIndex - i + n) % n;\n        int d = min(forward, backward);\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,
        c: `int closetTarget(char** words, int wordsSize, char* target, int startIndex) {\n    int n = wordsSize, best = -1;\n    for (int i = 0; i < n; i++) {\n        if (strcmp(words[i], target) != 0) continue;\n        int forward = (i - startIndex + n) % n;\n        int backward = (startIndex - i + n) % n;\n        int d = forward < backward ? forward : backward;\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,
        csharp: `public static int ClosetTarget(string[] words, string target, int startIndex)\n{\n    int n = words.Length, best = -1;\n    for (int i = 0; i < n; i++)\n    {\n        if (words[i] != target) continue;\n        int forward = (i - startIndex + n) % n;\n        int backward = (startIndex - i + n) % n;\n        int d = Math.Min(forward, backward);\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,
        go: `func closetTarget(words []string, target string, startIndex int) int {\n\tn := len(words)\n\tbest := -1\n\tfor i := 0; i < n; i++ {\n\t\tif words[i] != target {\n\t\t\tcontinue\n\t\t}\n\t\tforward := (i - startIndex + n) % n\n\t\tbackward := (startIndex - i + n) % n\n\t\td := forward\n\t\tif backward < d {\n\t\t\td = backward\n\t\t}\n\t\tif best < 0 || d < best {\n\t\t\tbest = d\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun closetTarget(words: Array<String>, target: String, startIndex: Int): Int {\n    val n = words.size\n    var best = -1\n    for (i in 0 until n) {\n        if (words[i] != target) continue\n        val forward = (i - startIndex + n) % n\n        val backward = (startIndex - i + n) % n\n        val d = minOf(forward, backward)\n        if (best < 0 || d < best) best = d\n    }\n    return best\n}`,
        swift: `func closetTarget(_ words: [String], _ target: String, _ startIndex: Int) -> Int {\n    let n = words.count\n    var best = -1\n    for i in 0..<n where words[i] == target {\n        let forward = (i - startIndex + n) % n\n        let backward = (startIndex - i + n) % n\n        let d = min(forward, backward)\n        if best < 0 || d < best { best = d }\n    }\n    return best\n}`,
        rust: `fn closetTarget(words: Vec<String>, target: String, startIndex: i32) -> i32 {\n    let n = words.len() as i32;\n    let mut best = -1i32;\n    for i in 0..words.len() {\n        if words[i] != target {\n            continue;\n        }\n        let idx = i as i32;\n        let forward = (idx - startIndex + n) % n;\n        let backward = (startIndex - idx + n) % n;\n        let d = forward.min(backward);\n        if best < 0 || d < best {\n            best = d;\n        }\n    }\n    best\n}`,
        php: `function closetTarget($words, $target, $startIndex) {\n    $n = count($words);\n    $best = -1;\n    for ($i = 0; $i < $n; $i++) {\n        if ($words[$i] !== $target) continue;\n        $forward = ($i - $startIndex + $n) % $n;\n        $backward = ($startIndex - $i + $n) % $n;\n        $d = min($forward, $backward);\n        if ($best < 0 || $d < $best) $best = $d;\n    }\n    return $best;\n}`,
        ruby: `def closetTarget(words, target, startIndex)\n  n = words.length\n  best = -1\n  words.each_with_index do |w, i|\n    next if w != target\n    d = [(i - startIndex) % n, (startIndex - i) % n].min\n    best = d if best < 0 || d < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Number of Pairs With Absolute Difference K (LC 2006) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (Math.abs(nums[i] - nums[j]) === k) total++;
        }
      }
      return total;
    };
    return {
      slug: "count-number-of-pairs-with-absolute-difference-k",
      title: "Count Number of Pairs With Absolute Difference K",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "TCS", "Wipro", "Zoho"],
      signature: { funcName: "countKDifference", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the pairs of indices `(i, j)` with `i < j` and `|nums[i] - nums[j]| == k`.",
        [
          { in: "nums = [1,2,2,1], k = 1", out: "4", note: "Each 1 pairs with each 2." },
          { in: "nums = [1,3], k = 3", out: "0" },
          { in: "nums = [3,2,1,5,4], k = 2", out: "3", note: "(3,1), (3,5) and (2,4)." },
        ],
        ["1 <= nums.length <= 200", "1 <= nums[i] <= 100", "1 <= k <= 99"]),
      hints: [
        "The double loop is fine at this size and is the clearest statement of the problem.",
        "The linear version keeps a frequency map and, for each element, adds the counts of `x - k` and `x + k` seen so far.",
        "Counting before inserting attributes each pair to its later index exactly once.",
      ],
      editorial: explain({
        idea: "Every pair is determined by its two indices, so the direct double loop is exhaustive. The faster route turns the absolute difference into two lookups per element.",
        steps: [
          "Loop over all `i < j` and count the pairs whose absolute difference is `k`.",
          "For the linear version: sweep once with a tally, adding `seen[x - k] + seen[x + k]` before inserting `x`.",
        ],
        why: "`|a - b| == k` splits into `a - b == k` or `b - a == k`, which is why the fast version needs exactly two lookups. Counting before inserting means each pair is attributed to its later index once.",
        time: "O(n²) directly, or O(n) with a tally",
        space: "O(1) directly, O(V) with a tally",
        pitfalls: [
          "Looking up only `x - k` halves the count.",
          "With `k = 0` the two lookups coincide and would double count; the constraints exclude it here.",
        ],
      }),
      examples: [
        { input: "[1,2,2,1]\n1", expectedOutput: "4" },
        { input: "[1,3]\n3", expectedOutput: "0" },
        { input: "[3,2,1,5,4]\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 1, rng() < 0.5 ? 8 : 100));
        const k = ri(rng, 1, 99);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countKDifference(nums: List[int], k: int) -> int:\n    seen = {}\n    total = 0\n    for x in nums:\n        total += seen.get(x - k, 0) + seen.get(x + k, 0)\n        seen[x] = seen.get(x, 0) + 1\n    return total`,
        javascript: `var countKDifference = function(nums, k) {\n    var seen = {}, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        var a = seen[String(x - k)];\n        var b = seen[String(x + k)];\n        if (a !== undefined) total += a;\n        if (b !== undefined) total += b;\n        var key = String(x);\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n};`,
        typescript: `function countKDifference(nums: number[], k: number): number {\n    var seen: { [key: string]: number } = {}, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        var a = seen[String(x - k)];\n        var b = seen[String(x + k)];\n        if (a !== undefined) total += a;\n        if (b !== undefined) total += b;\n        var key = String(x);\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n}`,
        java: `public static int countKDifference(int[] nums, int k) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    int total = 0;\n    for (int x : nums) {\n        total += seen.getOrDefault(x - k, 0) + seen.getOrDefault(x + k, 0);\n        seen.put(x, seen.getOrDefault(x, 0) + 1);\n    }\n    return total;\n}`,
        cpp: `int countKDifference(vector<int>& nums, int k) {\n    unordered_map<int, int> seen;\n    int total = 0;\n    for (int x : nums) {\n        total += seen[x - k] + seen[x + k];\n        seen[x]++;\n    }\n    return total;\n}`,
        c: `int countKDifference(int* nums, int numsSize, int k) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            int diff = nums[i] - nums[j];\n            if (diff < 0) diff = -diff;\n            if (diff == k) total++;\n        }\n    }\n    return total;\n}`,
        csharp: `public static int CountKDifference(int[] nums, int k)\n{\n    var seen = new Dictionary<int, int>();\n    int total = 0;\n    foreach (int x in nums)\n    {\n        int a, b;\n        if (seen.TryGetValue(x - k, out a)) total += a;\n        if (seen.TryGetValue(x + k, out b)) total += b;\n        int c;\n        seen[x] = (seen.TryGetValue(x, out c) ? c : 0) + 1;\n    }\n    return total;\n}`,
        go: `func countKDifference(nums []int, k int) int {\n\tseen := map[int]int{}\n\ttotal := 0\n\tfor _, x := range nums {\n\t\ttotal += seen[x-k] + seen[x+k]\n\t\tseen[x]++\n\t}\n\treturn total\n}`,
        kotlin: `fun countKDifference(nums: IntArray, k: Int): Int {\n    val seen = HashMap<Int, Int>()\n    var total = 0\n    for (x in nums) {\n        total += (seen[x - k] ?: 0) + (seen[x + k] ?: 0)\n        seen[x] = (seen[x] ?: 0) + 1\n    }\n    return total\n}`,
        swift: `func countKDifference(_ nums: [Int], _ k: Int) -> Int {\n    var seen: [Int: Int] = [:]\n    var total = 0\n    for x in nums {\n        total += (seen[x - k] ?? 0) + (seen[x + k] ?? 0)\n        seen[x] = (seen[x] ?? 0) + 1\n    }\n    return total\n}`,
        rust: `fn countKDifference(nums: Vec<i32>, k: i32) -> i32 {\n    let mut seen: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut total = 0i32;\n    for &x in nums.iter() {\n        total += *seen.get(&(x - k)).unwrap_or(&0) + *seen.get(&(x + k)).unwrap_or(&0);\n        *seen.entry(x).or_insert(0) += 1;\n    }\n    total\n}`,
        php: `function countKDifference($nums, $k) {\n    $seen = array();\n    $total = 0;\n    foreach ($nums as $x) {\n        if (isset($seen[$x - $k])) $total += $seen[$x - $k];\n        if (isset($seen[$x + $k])) $total += $seen[$x + $k];\n        $seen[$x] = isset($seen[$x]) ? $seen[$x] + 1 : 1;\n    }\n    return $total;\n}`,
        ruby: `def countKDifference(nums, k)\n  seen = Hash.new(0)\n  total = 0\n  nums.each do |x|\n    total += seen[x - k] + seen[x + k]\n    seen[x] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Pair With Given Difference (GFG) ────────────────────────────
  (() => {
    const ref = (arr: number[], diff: number) => {
      const s = arr.slice().sort((a, b) => a - b);
      let i = 0, j = 1;
      while (i < s.length && j < s.length) {
        if (i !== j && s[j] - s[i] === diff) return true;
        if (s[j] - s[i] < diff) j++;
        else i++;
        if (j <= i) j = i + 1;
      }
      return false;
    };
    return {
      slug: "pair-with-given-difference",
      title: "Pair With Given Difference",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "findPair", params: [{ name: "arr", type: "int[]" as const }, { name: "diff", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an array `arr` and a non-negative integer `diff`, decide whether two elements at **different indices** differ by exactly `diff`.\n\nReturn `true` if such a pair exists.",
        [
          { in: "arr = [5,20,3,2,50,80], diff = 78", out: "true", note: "80 - 2 = 78." },
          { in: "arr = [90,70,20,80,50], diff = 45", out: "false" },
          { in: "arr = [4,4,9], diff = 0", out: "true", note: "A difference of 0 needs a repeated value." },
        ],
        ["2 <= arr.length <= 100000", "-100000 <= arr[i] <= 100000", "0 <= diff <= 200000"]),
      hints: [
        "Sort first — then the difference between two positions is monotone as you move either pointer.",
        "Advance the right pointer while the gap is too small, and the left pointer while it is too large.",
        "Keep the two pointers at distinct positions, or `diff = 0` would match an element with itself.",
      ],
      editorial: explain({
        idea: "After sorting, sliding two pointers rightwards covers every candidate gap exactly once: widening by moving the right pointer increases the difference, and narrowing by moving the left pointer decreases it.",
        steps: [
          "Sort a copy of the array.",
          "Start `i = 0` and `j = 1`.",
          "If `s[j] - s[i]` equals `diff` (with `i != j`), report success.",
          "If the gap is too small, advance `j`; otherwise advance `i`, keeping `j` strictly ahead of `i`.",
        ],
        why: "In sorted order the gap `s[j] - s[i]` increases with `j` and decreases with `i`, so the sweep is a monotone search over all pairs. Keeping `j > i` is what enforces the distinct-index requirement, which matters exactly when `diff` is 0.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Allowing `i == j` makes every array answer `true` for `diff = 0`.",
          "A hash-set solution must likewise avoid matching an element with itself when `diff` is 0.",
          "Negative values are fine after sorting; the difference is taken in sorted order so it is never negative.",
        ],
      }),
      examples: [
        { input: "[5,20,3,2,50,80]\n78", expectedOutput: "true" },
        { input: "[90,70,20,80,50]\n45", expectedOutput: "false" },
        { input: "[4,4,9]\n0", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 30);
        const hi = rng() < 0.5 ? 20 : 100000;
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const diff = rng() < 0.5 ? Math.abs(arr[ri(rng, 0, n - 1)] - arr[ri(rng, 0, n - 1)]) : ri(rng, 0, 2 * hi);
        return { input: `${fmtIntArr(arr)}\n${diff}`, expectedOutput: bool(ref(arr, diff)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findPair(arr: List[int], diff: int) -> bool:\n    s = sorted(arr)\n    i, j = 0, 1\n    while i < len(s) and j < len(s):\n        if i != j and s[j] - s[i] == diff:\n            return True\n        if s[j] - s[i] < diff:\n            j += 1\n        else:\n            i += 1\n        if j <= i:\n            j = i + 1\n    return False`,
        javascript: `var findPair = function(arr, diff) {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var i = 0, j = 1;\n    while (i < s.length && j < s.length) {\n        if (i !== j && s[j] - s[i] === diff) return true;\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    return false;\n};`,
        typescript: `function findPair(arr: number[], diff: number): boolean {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var i = 0, j = 1;\n    while (i < s.length && j < s.length) {\n        if (i !== j && s[j] - s[i] === diff) return true;\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    return false;\n}`,
        java: `public static boolean findPair(int[] arr, int diff) {\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    int i = 0, j = 1;\n    while (i < s.length && j < s.length) {\n        if (i != j && s[j] - s[i] == diff) return true;\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    return false;\n}`,
        cpp: `bool findPair(vector<int>& arr, int diff) {\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    int i = 0, j = 1;\n    while (i < n && j < n) {\n        if (i != j && s[j] - s[i] == diff) return true;\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    return false;\n}`,
        c: `static int cmpPairAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nbool findPair(int* arr, int arrSize, int diff) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int t = 0; t < arrSize; t++) s[t] = arr[t];\n    qsort(s, (size_t) arrSize, sizeof(int), cmpPairAsc);\n    int i = 0, j = 1;\n    bool found = false;\n    while (i < arrSize && j < arrSize) {\n        if (i != j && s[j] - s[i] == diff) { found = true; break; }\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    free(s);\n    return found;\n}`,
        csharp: `public static bool FindPair(int[] arr, int diff)\n{\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    int i = 0, j = 1;\n    while (i < s.Length && j < s.Length)\n    {\n        if (i != j && s[j] - s[i] == diff) return true;\n        if (s[j] - s[i] < diff) j++;\n        else i++;\n        if (j <= i) j = i + 1;\n    }\n    return false;\n}`,
        go: `func findPair(arr []int, diff int) bool {\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\ti, j := 0, 1\n\tfor i < len(s) && j < len(s) {\n\t\tif i != j && s[j]-s[i] == diff {\n\t\t\treturn true\n\t\t}\n\t\tif s[j]-s[i] < diff {\n\t\t\tj++\n\t\t} else {\n\t\t\ti++\n\t\t}\n\t\tif j <= i {\n\t\t\tj = i + 1\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun findPair(arr: IntArray, diff: Int): Boolean {\n    val s = arr.sortedArray()\n    var i = 0\n    var j = 1\n    while (i < s.size && j < s.size) {\n        if (i != j && s[j] - s[i] == diff) return true\n        if (s[j] - s[i] < diff) j++ else i++\n        if (j <= i) j = i + 1\n    }\n    return false\n}`,
        swift: `func findPair(_ arr: [Int], _ diff: Int) -> Bool {\n    let s = arr.sorted()\n    var i = 0\n    var j = 1\n    while i < s.count && j < s.count {\n        if i != j && s[j] - s[i] == diff { return true }\n        if s[j] - s[i] < diff { j += 1 } else { i += 1 }\n        if j <= i { j = i + 1 }\n    }\n    return false\n}`,
        rust: `fn findPair(arr: Vec<i32>, diff: i32) -> bool {\n    let mut s = arr.clone();\n    s.sort();\n    let n = s.len();\n    let mut i = 0usize;\n    let mut j = 1usize;\n    while i < n && j < n {\n        if i != j && s[j] - s[i] == diff {\n            return true;\n        }\n        if s[j] - s[i] < diff {\n            j += 1;\n        } else {\n            i += 1;\n        }\n        if j <= i {\n            j = i + 1;\n        }\n    }\n    false\n}`,
        php: `function findPair($arr, $diff) {\n    $s = $arr;\n    sort($s);\n    $n = count($s);\n    $i = 0;\n    $j = 1;\n    while ($i < $n && $j < $n) {\n        if ($i !== $j && $s[$j] - $s[$i] === $diff) return true;\n        if ($s[$j] - $s[$i] < $diff) $j++;\n        else $i++;\n        if ($j <= $i) $j = $i + 1;\n    }\n    return false;\n}`,
        ruby: `def findPair(arr, diff)\n  s = arr.sort\n  i = 0\n  j = 1\n  while i < s.length && j < s.length\n    return true if i != j && s[j] - s[i] == diff\n    if s[j] - s[i] < diff\n      j += 1\n    else\n      i += 1\n    end\n    j = i + 1 if j <= i\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Find Indices With Index and Value Difference I (LC 2903) ────
  (() => {
    const ref = (nums: number[], indexDifference: number, valueDifference: number) => {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          if (j - i >= indexDifference && Math.abs(nums[i] - nums[j]) >= valueDifference) return [i, j];
        }
      }
      return [-1, -1];
    };
    return {
      slug: "find-indices-with-index-and-value-difference-i",
      title: "Find Indices With Index and Value Difference I",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "TCS", "Adobe", "Amazon"],
      signature: { funcName: "findIndices", params: [{ name: "nums", type: "int[]" as const }, { name: "indexDifference", type: "int" as const }, { name: "valueDifference", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Find indices `i` and `j` with `|i - j| >= indexDifference` and `|nums[i] - nums[j]| >= valueDifference`. The two indices may be equal.\n\nReturn such a pair as `[i, j]`, or `[-1,-1]` if none exists. To make the answer unique, return the lexicographically smallest pair with `i <= j`.",
        [
          { in: "nums = [5,1,4,1], indexDifference = 2, valueDifference = 4", out: "[0,3]", note: "Indices 0 and 3 are 3 apart and their values differ by 4." },
          { in: "nums = [2,1], indexDifference = 0, valueDifference = 0", out: "[0,0]", note: "Both differences may be zero, so an index paired with itself works." },
          { in: "nums = [1,2,3], indexDifference = 2, valueDifference = 4", out: "[-1,-1]" },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 50", "0 <= indexDifference <= 100", "0 <= valueDifference <= 50"]),
      hints: [
        "At this size the double loop over `i <= j` is exhaustive and cheap.",
        "Scanning `i` outer and `j` inner in increasing order naturally yields the lexicographically smallest pair first.",
        "The linear version keeps the running minimum and maximum among indices at least `indexDifference` behind `j`.",
      ],
      editorial: explain({
        idea: "Both conditions are simple comparisons, so enumerate the pairs in lexicographic order and return the first that satisfies them.",
        steps: [
          "Loop `i` from 0 upward and `j` from `i` upward.",
          "Check `j - i >= indexDifference` and `|nums[i] - nums[j]| >= valueDifference`.",
          "Return the first pair that passes; return `[-1,-1]` if none does.",
        ],
        why: "Scanning `i` then `j` in increasing order visits pairs in lexicographic order, so the first hit is the smallest. The faster `O(n)` version slides a gap and keeps the extreme values seen so far, since only the running minimum or maximum can maximise the value gap.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "`indexDifference` may be 0, so `i == j` is a legal answer.",
          "Restricting to `i < j` misses that case.",
          "The result is a pair, not a single index.",
        ],
      }),
      examples: [
        { input: "[5,1,4,1]\n2\n4", expectedOutput: "[0,3]" },
        { input: "[2,1]\n0\n0", expectedOutput: "[0,0]" },
        { input: "[1,2,3]\n2\n4", expectedOutput: "[-1,-1]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 0, 50));
        const indexDifference = ri(rng, 0, 12);
        const valueDifference = ri(rng, 0, 50);
        return { input: `${fmtIntArr(nums)}\n${indexDifference}\n${valueDifference}`, expectedOutput: fmtIntArr(ref(nums, indexDifference, valueDifference)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findIndices(nums: List[int], indexDifference: int, valueDifference: int) -> List[int]:\n    n = len(nums)\n    for i in range(n):\n        for j in range(i, n):\n            if j - i >= indexDifference and abs(nums[i] - nums[j]) >= valueDifference:\n                return [i, j]\n    return [-1, -1]`,
        javascript: `var findIndices = function(nums, indexDifference, valueDifference) {\n    for (var i = 0; i < nums.length; i++) {\n        for (var j = i; j < nums.length; j++) {\n            if (j - i >= indexDifference && Math.abs(nums[i] - nums[j]) >= valueDifference) return [i, j];\n        }\n    }\n    return [-1, -1];\n};`,
        typescript: `function findIndices(nums: number[], indexDifference: number, valueDifference: number): number[] {\n    for (var i = 0; i < nums.length; i++) {\n        for (var j = i; j < nums.length; j++) {\n            if (j - i >= indexDifference && Math.abs(nums[i] - nums[j]) >= valueDifference) return [i, j];\n        }\n    }\n    return [-1, -1];\n}`,
        java: `public static int[] findIndices(int[] nums, int indexDifference, int valueDifference) {\n    for (int i = 0; i < nums.length; i++) {\n        for (int j = i; j < nums.length; j++) {\n            if (j - i >= indexDifference && Math.abs(nums[i] - nums[j]) >= valueDifference) {\n                return new int[] { i, j };\n            }\n        }\n    }\n    return new int[] { -1, -1 };\n}`,
        cpp: `vector<int> findIndices(vector<int>& nums, int indexDifference, int valueDifference) {\n    int n = (int) nums.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            if (j - i >= indexDifference && abs(nums[i] - nums[j]) >= valueDifference) {\n                return { i, j };\n            }\n        }\n    }\n    return { -1, -1 };\n}`,
        c: `int* findIndices(int* nums, int numsSize, int indexDifference, int valueDifference, int* returnSize) {\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = -1;\n    out[1] = -1;\n    *returnSize = 2;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i; j < numsSize; j++) {\n            int diff = nums[i] - nums[j];\n            if (diff < 0) diff = -diff;\n            if (j - i >= indexDifference && diff >= valueDifference) {\n                out[0] = i;\n                out[1] = j;\n                return out;\n            }\n        }\n    }\n    return out;\n}`,
        csharp: `public static int[] FindIndices(int[] nums, int indexDifference, int valueDifference)\n{\n    for (int i = 0; i < nums.Length; i++)\n    {\n        for (int j = i; j < nums.Length; j++)\n        {\n            if (j - i >= indexDifference && Math.Abs(nums[i] - nums[j]) >= valueDifference)\n            {\n                return new int[] { i, j };\n            }\n        }\n    }\n    return new int[] { -1, -1 };\n}`,
        go: `func findIndices(nums []int, indexDifference int, valueDifference int) []int {\n\tfor i := 0; i < len(nums); i++ {\n\t\tfor j := i; j < len(nums); j++ {\n\t\t\tdiff := nums[i] - nums[j]\n\t\t\tif diff < 0 {\n\t\t\t\tdiff = -diff\n\t\t\t}\n\t\t\tif j-i >= indexDifference && diff >= valueDifference {\n\t\t\t\treturn []int{i, j}\n\t\t\t}\n\t\t}\n\t}\n\treturn []int{-1, -1}\n}`,
        kotlin: `fun findIndices(nums: IntArray, indexDifference: Int, valueDifference: Int): IntArray {\n    for (i in nums.indices) {\n        for (j in i until nums.size) {\n            if (j - i >= indexDifference && Math.abs(nums[i] - nums[j]) >= valueDifference) {\n                return intArrayOf(i, j)\n            }\n        }\n    }\n    return intArrayOf(-1, -1)\n}`,
        swift: `func findIndices(_ nums: [Int], _ indexDifference: Int, _ valueDifference: Int) -> [Int] {\n    for i in 0..<nums.count {\n        for j in i..<nums.count {\n            if j - i >= indexDifference && abs(nums[i] - nums[j]) >= valueDifference {\n                return [i, j]\n            }\n        }\n    }\n    return [-1, -1]\n}`,
        rust: `fn findIndices(nums: Vec<i32>, indexDifference: i32, valueDifference: i32) -> Vec<i32> {\n    for i in 0..nums.len() {\n        for j in i..nums.len() {\n            if (j - i) as i32 >= indexDifference && (nums[i] - nums[j]).abs() >= valueDifference {\n                return vec![i as i32, j as i32];\n            }\n        }\n    }\n    vec![-1, -1]\n}`,
        php: `function findIndices($nums, $indexDifference, $valueDifference) {\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i; $j < $n; $j++) {\n            if ($j - $i >= $indexDifference && abs($nums[$i] - $nums[$j]) >= $valueDifference) {\n                return array($i, $j);\n            }\n        }\n    }\n    return array(-1, -1);\n}`,
        ruby: `def findIndices(nums, indexDifference, valueDifference)\n  (0...nums.length).each do |i|\n    (i...nums.length).each do |j|\n      return [i, j] if j - i >= indexDifference && (nums[i] - nums[j]).abs >= valueDifference\n    end\n  end\n  [-1, -1]\nend`,
      },
    };
  })(),

  // ── Sum of Square Numbers (LC 633) ──────────────────────────────
  (() => {
    const ref = (c: number) => {
      let a = 0, b = 0;
      while ((b + 1) * (b + 1) <= c) b++;
      while (a <= b) {
        const sum = a * a + b * b;
        if (sum === c) return true;
        if (sum < c) a++;
        else b--;
      }
      return false;
    };
    return {
      slug: "sum-of-square-numbers",
      title: "Sum of Square Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Two Pointers", "Binary Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "judgeSquareSum", params: [{ name: "c", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given a non-negative integer `c`, decide whether there exist non-negative integers `a` and `b` with `a² + b² == c`.\n\nReturn `true` if such a pair exists.",
        [
          { in: "c = 5", out: "true", note: "1² + 2² = 5." },
          { in: "c = 3", out: "false" },
          { in: "c = 4", out: "true", note: "0² + 2² = 4." },
        ],
        ["0 <= c <= 10000000"]),
      hints: [
        "Both squares are at most `c`, so `a` and `b` lie between 0 and `floor(sqrt(c))`.",
        "Two pointers from the ends of that range work: the sum increases with `a` and decreases with `b`.",
        "Compute the integer square root by a loop rather than a floating-point `sqrt`.",
      ],
      editorial: explain({
        idea: "Search the pair `(a, b)` with `a <= b <= sqrt(c)` using two pointers. The sum `a² + b²` rises when `a` rises and falls when `b` falls, so every candidate is covered in one sweep.",
        steps: [
          "Find the largest `b` with `b² <= c` by an integer loop.",
          "Start `a` at 0 and compare `a² + b²` with `c`.",
          "Increase `a` when the sum is too small; decrease `b` when it is too large; report success on equality.",
          "Stop when the pointers cross.",
        ],
        why: "Any solution has `a <= b` after swapping, and both are at most `sqrt(c)`. The sweep is monotone in both directions, so it neither skips a solution nor revisits a pair.",
        time: "O(sqrt(c))",
        space: "O(1)",
        pitfalls: [
          "A floating-point `sqrt` can land one off on a perfect square, and the judge's C harness has no `math.h` — the integer loop avoids both.",
          "`a` and `b` may be zero, so `c = 0` and `c = 4` both answer `true`.",
          "`b * b` stays inside 32 bits at this limit, but at LeetCode's real bound it needs a wider type.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "true" },
        { input: "3", expectedOutput: "false" },
        { input: "4", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.4) {
          const a = ri(rng, 0, 2000);
          const b = ri(rng, 0, 2000);
          const c = a * a + b * b;
          if (c <= 10000000) return { input: String(c), expectedOutput: bool(ref(c)) };
        }
        const c = ri(rng, 0, 10000000);
        return { input: String(c), expectedOutput: bool(ref(c)) };
      },
      solutions: {
        python: `def judgeSquareSum(c: int) -> bool:\n    a, b = 0, 0\n    while (b + 1) * (b + 1) <= c:\n        b += 1\n    while a <= b:\n        total = a * a + b * b\n        if total == c:\n            return True\n        if total < c:\n            a += 1\n        else:\n            b -= 1\n    return False`,
        javascript: `var judgeSquareSum = function(c) {\n    var a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= c) b++;\n    while (a <= b) {\n        var sum = a * a + b * b;\n        if (sum === c) return true;\n        if (sum < c) a++;\n        else b--;\n    }\n    return false;\n};`,
        typescript: `function judgeSquareSum(c: number): boolean {\n    var a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= c) b++;\n    while (a <= b) {\n        var sum = a * a + b * b;\n        if (sum === c) return true;\n        if (sum < c) a++;\n        else b--;\n    }\n    return false;\n}`,
        java: `public static boolean judgeSquareSum(int c) {\n    long a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= c) b++;\n    while (a <= b) {\n        long sum = a * a + b * b;\n        if (sum == c) return true;\n        if (sum < c) a++;\n        else b--;\n    }\n    return false;\n}`,
        cpp: `bool judgeSquareSum(int c) {\n    long long a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= c) b++;\n    while (a <= b) {\n        long long sum = a * a + b * b;\n        if (sum == c) return true;\n        if (sum < c) a++;\n        else b--;\n    }\n    return false;\n}`,
        c: `bool judgeSquareSum(int c) {\n    long long a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= (long long) c) b++;\n    while (a <= b) {\n        long long sum = a * a + b * b;\n        if (sum == (long long) c) return true;\n        if (sum < (long long) c) a++;\n        else b--;\n    }\n    return false;\n}`,
        csharp: `public static bool JudgeSquareSum(int c)\n{\n    long a = 0, b = 0;\n    while ((b + 1) * (b + 1) <= c) b++;\n    while (a <= b)\n    {\n        long sum = a * a + b * b;\n        if (sum == c) return true;\n        if (sum < c) a++;\n        else b--;\n    }\n    return false;\n}`,
        go: `func judgeSquareSum(c int) bool {\n\ta, b := 0, 0\n\tfor (b+1)*(b+1) <= c {\n\t\tb++\n\t}\n\tfor a <= b {\n\t\tsum := a*a + b*b\n\t\tif sum == c {\n\t\t\treturn true\n\t\t}\n\t\tif sum < c {\n\t\t\ta++\n\t\t} else {\n\t\t\tb--\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun judgeSquareSum(c: Int): Boolean {\n    var a = 0L\n    var b = 0L\n    while ((b + 1) * (b + 1) <= c) b++\n    while (a <= b) {\n        val sum = a * a + b * b\n        if (sum == c.toLong()) return true\n        if (sum < c) a++ else b--\n    }\n    return false\n}`,
        swift: `func judgeSquareSum(_ c: Int) -> Bool {\n    var a = 0\n    var b = 0\n    while (b + 1) * (b + 1) <= c { b += 1 }\n    while a <= b {\n        let sum = a * a + b * b\n        if sum == c { return true }\n        if sum < c { a += 1 } else { b -= 1 }\n    }\n    return false\n}`,
        rust: `fn judgeSquareSum(c: i32) -> bool {\n    let target = c as i64;\n    let mut a: i64 = 0;\n    let mut b: i64 = 0;\n    while (b + 1) * (b + 1) <= target {\n        b += 1;\n    }\n    while a <= b {\n        let sum = a * a + b * b;\n        if sum == target {\n            return true;\n        }\n        if sum < target {\n            a += 1;\n        } else {\n            b -= 1;\n        }\n    }\n    false\n}`,
        php: `function judgeSquareSum($c) {\n    $a = 0;\n    $b = 0;\n    while (($b + 1) * ($b + 1) <= $c) $b++;\n    while ($a <= $b) {\n        $sum = $a * $a + $b * $b;\n        if ($sum === $c) return true;\n        if ($sum < $c) $a++;\n        else $b--;\n    }\n    return false;\n}`,
        ruby: `def judgeSquareSum(c)\n  a = 0\n  b = 0\n  b += 1 while (b + 1) * (b + 1) <= c\n  while a <= b\n    sum = a * a + b * b\n    return true if sum == c\n    if sum < c\n      a += 1\n    else\n      b -= 1\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Maximum Distance Between a Pair of Values (LC 1855) ─────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      let i = 0, j = 0, best = 0;
      while (i < nums1.length && j < nums2.length) {
        if (nums1[i] > nums2[j]) i++;
        else { if (j - i > best) best = j - i; j++; }
      }
      return best;
    };
    return {
      slug: "maximum-distance-between-a-pair-of-values",
      title: "Maximum Distance Between a Pair of Values",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maxDistance", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Both `nums1` and `nums2` are sorted in **non-increasing** order. A pair `(i, j)` is **valid** when `i <= j` and `nums1[i] <= nums2[j]`.\n\nReturn the maximum value of `j - i` over all valid pairs, or `0` if none exists.",
        [
          { in: "nums1 = [55,30,5,4,2], nums2 = [100,20,10,10,5]", out: "2", note: "The pair (2, 4) is valid since 5 <= 5, giving a distance of 2." },
          { in: "nums1 = [2,2,2], nums2 = [10,10,1]", out: "1", note: "(0, 1) is valid." },
          { in: "nums1 = [30,29,19,5], nums2 = [25,25,25,25,25]", out: "2", note: "(2, 4) is valid since 19 <= 25." },
        ],
        ["1 <= nums1.length, nums2.length <= 100000", "1 <= values <= 1000000000", "Both arrays are non-increasing."]),
      hints: [
        "Both arrays decrease, so once `nums1[i]` is too large for `nums2[j]`, it is too large for every later `j` too — advance `i`.",
        "Otherwise the pair is valid, so record `j - i` and try a larger `j`.",
        "Neither pointer ever moves backwards, which makes the sweep linear.",
      ],
      editorial: explain({
        idea: "Sweep both arrays with forward-only pointers. When the pair is invalid the left pointer must advance; when it is valid the right pointer can advance to look for a wider gap.",
        steps: [
          "Start `i` and `j` at 0 and `best` at 0.",
          "If `nums1[i] > nums2[j]`, the pair is invalid, so increment `i`.",
          "Otherwise the pair is valid: record `j - i` and increment `j`.",
          "Stop when either pointer runs off its array.",
        ],
        why: "Both arrays are non-increasing, so if `nums1[i] > nums2[j]` then `nums1[i] > nums2[j']` for every `j' >= j` — no valid pair uses this `i` with a larger `j`, and smaller `j` would only shrink the distance. Advancing `i` therefore loses nothing.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "`i <= j` is required, but the sweep maintains it automatically because `i` only advances while `i <= j`.",
          "Starting `best` above 0 breaks the 'no valid pair' case.",
          "The arrays are non-**increasing**, not non-decreasing; reversing the comparison breaks the invariant.",
        ],
      }),
      examples: [
        { input: "[55,30,5,4,2]\n[100,20,10,10,5]", expectedOutput: "2" },
        { input: "[2,2,2]\n[10,10,1]", expectedOutput: "1" },
        { input: "[30,29,19,5]\n[25,25,25,25,25]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 30 : 1000000000;
        const mk = (n: number) => Array.from({ length: n }, () => ri(rng, 1, hi)).sort((a, b) => b - a);
        const nums1 = mk(ri(rng, 1, 25));
        const nums2 = mk(ri(rng, 1, 25));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxDistance(nums1: List[int], nums2: List[int]) -> int:\n    i = j = best = 0\n    while i < len(nums1) and j < len(nums2):\n        if nums1[i] > nums2[j]:\n            i += 1\n        else:\n            best = max(best, j - i)\n            j += 1\n    return best`,
        javascript: `var maxDistance = function(nums1, nums2) {\n    var i = 0, j = 0, best = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] > nums2[j]) i++;\n        else {\n            if (j - i > best) best = j - i;\n            j++;\n        }\n    }\n    return best;\n};`,
        typescript: `function maxDistance(nums1: number[], nums2: number[]): number {\n    var i = 0, j = 0, best = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] > nums2[j]) i++;\n        else {\n            if (j - i > best) best = j - i;\n            j++;\n        }\n    }\n    return best;\n}`,
        java: `public static int maxDistance(int[] nums1, int[] nums2) {\n    int i = 0, j = 0, best = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] > nums2[j]) i++;\n        else {\n            best = Math.max(best, j - i);\n            j++;\n        }\n    }\n    return best;\n}`,
        cpp: `int maxDistance(vector<int>& nums1, vector<int>& nums2) {\n    int i = 0, j = 0, best = 0;\n    while (i < (int) nums1.size() && j < (int) nums2.size()) {\n        if (nums1[i] > nums2[j]) i++;\n        else {\n            best = max(best, j - i);\n            j++;\n        }\n    }\n    return best;\n}`,
        c: `int maxDistance(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int i = 0, j = 0, best = 0;\n    while (i < nums1Size && j < nums2Size) {\n        if (nums1[i] > nums2[j]) i++;\n        else {\n            if (j - i > best) best = j - i;\n            j++;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int MaxDistance(int[] nums1, int[] nums2)\n{\n    int i = 0, j = 0, best = 0;\n    while (i < nums1.Length && j < nums2.Length)\n    {\n        if (nums1[i] > nums2[j]) i++;\n        else\n        {\n            if (j - i > best) best = j - i;\n            j++;\n        }\n    }\n    return best;\n}`,
        go: `func maxDistance(nums1 []int, nums2 []int) int {\n\ti, j, best := 0, 0, 0\n\tfor i < len(nums1) && j < len(nums2) {\n\t\tif nums1[i] > nums2[j] {\n\t\t\ti++\n\t\t} else {\n\t\t\tif j-i > best {\n\t\t\t\tbest = j - i\n\t\t\t}\n\t\t\tj++\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxDistance(nums1: IntArray, nums2: IntArray): Int {\n    var i = 0\n    var j = 0\n    var best = 0\n    while (i < nums1.size && j < nums2.size) {\n        if (nums1[i] > nums2[j]) i++\n        else {\n            if (j - i > best) best = j - i\n            j++\n        }\n    }\n    return best\n}`,
        swift: `func maxDistance(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    var i = 0\n    var j = 0\n    var best = 0\n    while i < nums1.count && j < nums2.count {\n        if nums1[i] > nums2[j] {\n            i += 1\n        } else {\n            if j - i > best { best = j - i }\n            j += 1\n        }\n    }\n    return best\n}`,
        rust: `fn maxDistance(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let mut i = 0usize;\n    let mut j = 0usize;\n    let mut best = 0i32;\n    while i < nums1.len() && j < nums2.len() {\n        if nums1[i] > nums2[j] {\n            i += 1;\n        } else {\n            let d = (j - i) as i32;\n            if d > best {\n                best = d;\n            }\n            j += 1;\n        }\n    }\n    best\n}`,
        php: `function maxDistance($nums1, $nums2) {\n    $i = 0;\n    $j = 0;\n    $best = 0;\n    while ($i < count($nums1) && $j < count($nums2)) {\n        if ($nums1[$i] > $nums2[$j]) $i++;\n        else {\n            if ($j - $i > $best) $best = $j - $i;\n            $j++;\n        }\n    }\n    return $best;\n}`,
        ruby: `def maxDistance(nums1, nums2)\n  i = 0\n  j = 0\n  best = 0\n  while i < nums1.length && j < nums2.length\n    if nums1[i] > nums2[j]\n      i += 1\n    else\n      best = j - i if j - i > best\n      j += 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── 4Sum (LC 18) ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      const n = s.length;
      const out: number[][] = [];
      for (let i = 0; i < n - 3; i++) {
        if (i > 0 && s[i] === s[i - 1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
          if (j > i + 1 && s[j] === s[j - 1]) continue;
          let lo = j + 1, hi = n - 1;
          while (lo < hi) {
            const sum = s[i] + s[j] + s[lo] + s[hi];
            if (sum === target) {
              out.push([s[i], s[j], s[lo], s[hi]]);
              while (lo < hi && s[lo] === s[lo + 1]) lo++;
              while (lo < hi && s[hi] === s[hi - 1]) hi--;
              lo++;
              hi--;
            } else if (sum < target) lo++;
            else hi--;
          }
        }
      }
      return out;
    };
    return {
      slug: "4sum",
      title: "4Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "fourSum", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Return all **unique** quadruplets `[a, b, c, d]` drawn from distinct indices of `nums` whose sum is `target`.\n\nEach quadruplet must be sorted ascending, and the list of quadruplets must be sorted lexicographically.",
        [
          { in: "nums = [1,0,-1,0,-2,2], target = 0", out: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]" },
          { in: "nums = [2,2,2,2,2], target = 8", out: "[[2,2,2,2]]", note: "Only one distinct quadruplet exists even though many index choices give it." },
          { in: "nums = [1,2,3], target = 6", out: "[]", note: "Fewer than four elements." },
        ],
        ["1 <= nums.length <= 200", "-100000000 <= nums[i] <= 100000000", "-100000000 <= target <= 100000000"]),
      hints: [
        "Sort first: it makes the two inner pointers work and gives the required output order for free.",
        "Fix the two outer indices, then two-pointer the remaining suffix for the other pair.",
        "Skip a repeated value at each of the four positions, or the same quadruplet is emitted many times.",
      ],
      editorial: explain({
        idea: "Reduce to the familiar two-pointer pattern by fixing the two smallest members. Sorting makes both the inner sweep and the deduplication straightforward.",
        steps: [
          "Sort `nums`.",
          "Loop `i` and then `j` over the first two positions, skipping a value equal to the previous one at that position.",
          "Two-pointer `lo` and `hi` over the remaining suffix, moving `lo` up when the sum is short and `hi` down when it is long.",
          "On a hit, record the quadruplet and skip past duplicates on both inner pointers before advancing.",
        ],
        why: "Sorting makes the sum monotone in each pointer, so the inner sweep visits every viable pair for a fixed `(i, j)` in linear time. Skipping equal values at each position is what makes each distinct quadruplet appear exactly once, and the scan order produces them lexicographically.",
        time: "O(n³)",
        space: "O(n) beyond the output",
        pitfalls: [
          "Deduplicating only the outer indices still emits repeats when the inner pair has equal values.",
          "The four-way sum exceeds 32 bits at LeetCode's real limits — this version caps the values, but accumulating in 64 bits is the safe habit.",
          "Arrays shorter than four elements must produce an empty list rather than an out-of-range read.",
        ],
      }),
      examples: [
        { input: "[1,0,-1,0,-2,2]\n0", expectedOutput: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]" },
        { input: "[2,2,2,2,2]\n8", expectedOutput: "[[2,2,2,2]]" },
        { input: "[1,2,3]\n6", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 18);
        const hi = rng() < 0.6 ? 6 : 100000000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        let target: number;
        if (rng() < 0.5 && n >= 4) {
          const pickIdx = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, 4);
          target = pickIdx.reduce((acc, idx) => acc + nums[idx], 0);
        } else {
          target = ri(rng, -4 * hi, 4 * hi);
        }
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntMat(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef fourSum(nums: List[int], target: int) -> List[List[int]]:\n    s = sorted(nums)\n    n = len(s)\n    out = []\n    for i in range(n - 3):\n        if i > 0 and s[i] == s[i - 1]:\n            continue\n        for j in range(i + 1, n - 2):\n            if j > i + 1 and s[j] == s[j - 1]:\n                continue\n            lo, hi = j + 1, n - 1\n            while lo < hi:\n                total = s[i] + s[j] + s[lo] + s[hi]\n                if total == target:\n                    out.append([s[i], s[j], s[lo], s[hi]])\n                    while lo < hi and s[lo] == s[lo + 1]:\n                        lo += 1\n                    while lo < hi and s[hi] == s[hi - 1]:\n                        hi -= 1\n                    lo += 1\n                    hi -= 1\n                elif total < target:\n                    lo += 1\n                else:\n                    hi -= 1\n    return out`,
        javascript: `var fourSum = function(nums, target) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var n = s.length, out = [];\n    for (var i = 0; i < n - 3; i++) {\n        if (i > 0 && s[i] === s[i - 1]) continue;\n        for (var j = i + 1; j < n - 2; j++) {\n            if (j > i + 1 && s[j] === s[j - 1]) continue;\n            var lo = j + 1, hi = n - 1;\n            while (lo < hi) {\n                var sum = s[i] + s[j] + s[lo] + s[hi];\n                if (sum === target) {\n                    out.push([s[i], s[j], s[lo], s[hi]]);\n                    while (lo < hi && s[lo] === s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] === s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                } else if (sum < target) lo++;\n                else hi--;\n            }\n        }\n    }\n    return out;\n};`,
        typescript: `function fourSum(nums: number[], target: number): number[][] {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var n = s.length, out: number[][] = [];\n    for (var i = 0; i < n - 3; i++) {\n        if (i > 0 && s[i] === s[i - 1]) continue;\n        for (var j = i + 1; j < n - 2; j++) {\n            if (j > i + 1 && s[j] === s[j - 1]) continue;\n            var lo = j + 1, hi = n - 1;\n            while (lo < hi) {\n                var sum = s[i] + s[j] + s[lo] + s[hi];\n                if (sum === target) {\n                    out.push([s[i], s[j], s[lo], s[hi]]);\n                    while (lo < hi && s[lo] === s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] === s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                } else if (sum < target) lo++;\n                else hi--;\n            }\n        }\n    }\n    return out;\n}`,
        java: `public static int[][] fourSum(int[] nums, int target) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int n = s.length;\n    List<int[]> out = new ArrayList<>();\n    for (int i = 0; i < n - 3; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        for (int j = i + 1; j < n - 2; j++) {\n            if (j > i + 1 && s[j] == s[j - 1]) continue;\n            int lo = j + 1, hi = n - 1;\n            while (lo < hi) {\n                long sum = (long) s[i] + s[j] + s[lo] + s[hi];\n                if (sum == target) {\n                    out.add(new int[] { s[i], s[j], s[lo], s[hi] });\n                    while (lo < hi && s[lo] == s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] == s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                } else if (sum < target) lo++;\n                else hi--;\n            }\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> fourSum(vector<int>& nums, int target) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    vector<vector<int>> out;\n    for (int i = 0; i + 3 < n; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        for (int j = i + 1; j + 2 < n; j++) {\n            if (j > i + 1 && s[j] == s[j - 1]) continue;\n            int lo = j + 1, hi = n - 1;\n            while (lo < hi) {\n                long long sum = (long long) s[i] + s[j] + s[lo] + s[hi];\n                if (sum == target) {\n                    out.push_back({ s[i], s[j], s[lo], s[hi] });\n                    while (lo < hi && s[lo] == s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] == s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                } else if (sum < target) lo++;\n                else hi--;\n            }\n        }\n    }\n    return out;\n}`,
        c: `static int cmpFourAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint** fourSum(int* nums, int numsSize, int target, int* returnSize, int** returnColumnSizes) {\n    int n = numsSize;\n    int* s = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    for (int t = 0; t < n; t++) s[t] = nums[t];\n    qsort(s, (size_t) n, sizeof(int), cmpFourAsc);\n    int cap = 256;\n    int** out = (int**) malloc((size_t) cap * sizeof(int*));\n    int* cols = (int*) malloc((size_t) cap * sizeof(int));\n    int m = 0;\n    for (int i = 0; i + 3 < n; i++) {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        for (int j = i + 1; j + 2 < n; j++) {\n            if (j > i + 1 && s[j] == s[j - 1]) continue;\n            int lo = j + 1, hi = n - 1;\n            while (lo < hi) {\n                long long sum = (long long) s[i] + s[j] + s[lo] + s[hi];\n                if (sum == (long long) target) {\n                    if (m == cap) {\n                        cap *= 2;\n                        out = (int**) realloc(out, (size_t) cap * sizeof(int*));\n                        cols = (int*) realloc(cols, (size_t) cap * sizeof(int));\n                    }\n                    int* row = (int*) malloc(4 * sizeof(int));\n                    row[0] = s[i];\n                    row[1] = s[j];\n                    row[2] = s[lo];\n                    row[3] = s[hi];\n                    out[m] = row;\n                    cols[m] = 4;\n                    m++;\n                    while (lo < hi && s[lo] == s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] == s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                } else if (sum < (long long) target) lo++;\n                else hi--;\n            }\n        }\n    }\n    free(s);\n    *returnSize = m;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] FourSum(int[] nums, int target)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int n = s.Length;\n    var out_ = new List<int[]>();\n    for (int i = 0; i + 3 < n; i++)\n    {\n        if (i > 0 && s[i] == s[i - 1]) continue;\n        for (int j = i + 1; j + 2 < n; j++)\n        {\n            if (j > i + 1 && s[j] == s[j - 1]) continue;\n            int lo = j + 1, hi = n - 1;\n            while (lo < hi)\n            {\n                long sum = (long) s[i] + s[j] + s[lo] + s[hi];\n                if (sum == target)\n                {\n                    out_.Add(new int[] { s[i], s[j], s[lo], s[hi] });\n                    while (lo < hi && s[lo] == s[lo + 1]) lo++;\n                    while (lo < hi && s[hi] == s[hi - 1]) hi--;\n                    lo++;\n                    hi--;\n                }\n                else if (sum < target) lo++;\n                else hi--;\n            }\n        }\n    }\n    return out_.ToArray();\n}`,
        go: `func fourSum(nums []int, target int) [][]int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tn := len(s)\n\tout := [][]int{}\n\tfor i := 0; i+3 < n; i++ {\n\t\tif i > 0 && s[i] == s[i-1] {\n\t\t\tcontinue\n\t\t}\n\t\tfor j := i + 1; j+2 < n; j++ {\n\t\t\tif j > i+1 && s[j] == s[j-1] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tlo, hi := j+1, n-1\n\t\t\tfor lo < hi {\n\t\t\t\tsum := s[i] + s[j] + s[lo] + s[hi]\n\t\t\t\tif sum == target {\n\t\t\t\t\tout = append(out, []int{s[i], s[j], s[lo], s[hi]})\n\t\t\t\t\tfor lo < hi && s[lo] == s[lo+1] {\n\t\t\t\t\t\tlo++\n\t\t\t\t\t}\n\t\t\t\t\tfor lo < hi && s[hi] == s[hi-1] {\n\t\t\t\t\t\thi--\n\t\t\t\t\t}\n\t\t\t\t\tlo++\n\t\t\t\t\thi--\n\t\t\t\t} else if sum < target {\n\t\t\t\t\tlo++\n\t\t\t\t} else {\n\t\t\t\t\thi--\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun fourSum(nums: IntArray, target: Int): Array<IntArray> {\n    val s = nums.sortedArray()\n    val n = s.size\n    val out = ArrayList<IntArray>()\n    for (i in 0 until maxOf(n - 3, 0)) {\n        if (i > 0 && s[i] == s[i - 1]) continue\n        for (j in i + 1 until maxOf(n - 2, 0)) {\n            if (j > i + 1 && s[j] == s[j - 1]) continue\n            var lo = j + 1\n            var hi = n - 1\n            while (lo < hi) {\n                val sum = s[i].toLong() + s[j] + s[lo] + s[hi]\n                if (sum == target.toLong()) {\n                    out.add(intArrayOf(s[i], s[j], s[lo], s[hi]))\n                    while (lo < hi && s[lo] == s[lo + 1]) lo++\n                    while (lo < hi && s[hi] == s[hi - 1]) hi--\n                    lo++\n                    hi--\n                } else if (sum < target) lo++\n                else hi--\n            }\n        }\n    }\n    return out.toTypedArray()\n}`,
        swift: `func fourSum(_ nums: [Int], _ target: Int) -> [[Int]] {\n    let s = nums.sorted()\n    let n = s.count\n    var out: [[Int]] = []\n    if n < 4 { return out }\n    for i in 0...(n - 4) {\n        if i > 0 && s[i] == s[i - 1] { continue }\n        var j = i + 1\n        while j <= n - 3 {\n            if j > i + 1 && s[j] == s[j - 1] {\n                j += 1\n                continue\n            }\n            var lo = j + 1\n            var hi = n - 1\n            while lo < hi {\n                let sum = s[i] + s[j] + s[lo] + s[hi]\n                if sum == target {\n                    out.append([s[i], s[j], s[lo], s[hi]])\n                    while lo < hi && s[lo] == s[lo + 1] { lo += 1 }\n                    while lo < hi && s[hi] == s[hi - 1] { hi -= 1 }\n                    lo += 1\n                    hi -= 1\n                } else if sum < target {\n                    lo += 1\n                } else {\n                    hi -= 1\n                }\n            }\n            j += 1\n        }\n    }\n    return out\n}`,
        rust: `fn fourSum(nums: Vec<i32>, target: i32) -> Vec<Vec<i32>> {\n    let mut s = nums.clone();\n    s.sort();\n    let n = s.len();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    if n < 4 {\n        return out;\n    }\n    for i in 0..(n - 3) {\n        if i > 0 && s[i] == s[i - 1] {\n            continue;\n        }\n        for j in (i + 1)..(n - 2) {\n            if j > i + 1 && s[j] == s[j - 1] {\n                continue;\n            }\n            let mut lo = j + 1;\n            let mut hi = n - 1;\n            while lo < hi {\n                let sum = s[i] as i64 + s[j] as i64 + s[lo] as i64 + s[hi] as i64;\n                if sum == target as i64 {\n                    out.push(vec![s[i], s[j], s[lo], s[hi]]);\n                    while lo < hi && s[lo] == s[lo + 1] {\n                        lo += 1;\n                    }\n                    while lo < hi && s[hi] == s[hi - 1] {\n                        hi -= 1;\n                    }\n                    lo += 1;\n                    hi -= 1;\n                } else if sum < target as i64 {\n                    lo += 1;\n                } else {\n                    hi -= 1;\n                }\n            }\n        }\n    }\n    out\n}`,
        php: `function fourSum($nums, $target) {\n    $s = $nums;\n    sort($s);\n    $n = count($s);\n    $out = array();\n    for ($i = 0; $i + 3 < $n; $i++) {\n        if ($i > 0 && $s[$i] === $s[$i - 1]) continue;\n        for ($j = $i + 1; $j + 2 < $n; $j++) {\n            if ($j > $i + 1 && $s[$j] === $s[$j - 1]) continue;\n            $lo = $j + 1;\n            $hi = $n - 1;\n            while ($lo < $hi) {\n                $sum = $s[$i] + $s[$j] + $s[$lo] + $s[$hi];\n                if ($sum === $target) {\n                    $out[] = array($s[$i], $s[$j], $s[$lo], $s[$hi]);\n                    while ($lo < $hi && $s[$lo] === $s[$lo + 1]) $lo++;\n                    while ($lo < $hi && $s[$hi] === $s[$hi - 1]) $hi--;\n                    $lo++;\n                    $hi--;\n                } else if ($sum < $target) $lo++;\n                else $hi--;\n            }\n        }\n    }\n    return $out;\n}`,
        ruby: `def fourSum(nums, target)\n  s = nums.sort\n  n = s.length\n  out = []\n  (0...n).each do |i|\n    break if i + 3 >= n\n    next if i > 0 && s[i] == s[i - 1]\n    ((i + 1)...n).each do |j|\n      break if j + 2 >= n\n      next if j > i + 1 && s[j] == s[j - 1]\n      lo = j + 1\n      hi = n - 1\n      while lo < hi\n        sum = s[i] + s[j] + s[lo] + s[hi]\n        if sum == target\n          out << [s[i], s[j], s[lo], s[hi]]\n          lo += 1 while lo < hi && s[lo] == s[lo + 1]\n          hi -= 1 while lo < hi && s[hi] == s[hi - 1]\n          lo += 1\n          hi -= 1\n        elsif sum < target\n          lo += 1\n        else\n          hi -= 1\n        end\n      end\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Max Number of K-Sum Pairs (LC 1679) ─────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      let lo = 0, hi = s.length - 1, count = 0;
      while (lo < hi) {
        const sum = s[lo] + s[hi];
        if (sum === k) { count++; lo++; hi--; }
        else if (sum < k) lo++;
        else hi--;
      }
      return count;
    };
    return {
      slug: "max-number-of-k-sum-pairs",
      title: "Max Number of K-Sum Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Hash Table", "Sorting", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maxOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "One operation removes two elements whose sum is exactly `k`.\n\nReturn the maximum number of operations you can perform.",
        [
          { in: "nums = [1,2,3,4], k = 5", out: "2", note: "Remove 1 and 4, then 2 and 3." },
          { in: "nums = [3,1,3,4,3], k = 6", out: "1", note: "Only one pair of 3s can be removed." },
          { in: "nums = [2,2,2,2], k = 4", out: "2" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000", "1 <= k <= 1000000000"]),
      hints: [
        "Sort, then walk two pointers inward — this pairs each element with its only viable partner.",
        "On a match, consume both and move both pointers.",
        "A hash-map count works too: for each value pair it with `k - value` while both counts last.",
      ],
      editorial: explain({
        idea: "Sorting turns the pairing into a two-pointer sweep: a sum that is too small can only be fixed by raising the left value, and a sum that is too large by lowering the right one.",
        steps: [
          "Sort a copy of `nums`.",
          "Set `lo` at the front, `hi` at the back.",
          "On `s[lo] + s[hi] == k`, count an operation and move both pointers inward.",
          "Otherwise move `lo` up (sum too small) or `hi` down (sum too big).",
        ],
        why: "Each element has exactly one partner value, `k - x`. The sweep pairs the smallest available element with the largest that can still work, and discarding an element only happens when no remaining partner exists for it — so the count is maximal.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Moving only one pointer after a successful pair reuses an element.",
          "With a hash map, `2 * x == k` must be handled by pairing within the same bucket, halving the count.",
          "Elements are consumed, so a greedy that re-scans without removal overcounts.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]\n5", expectedOutput: "2" },
        { input: "[3,1,3,4,3]\n6", expectedOutput: "1" },
        { input: "[2,2,2,2]\n4", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 10 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 1, hi));
        const k = rng() < 0.5 ? nums[ri(rng, 0, nums.length - 1)] + nums[ri(rng, 0, nums.length - 1)] : ri(rng, 1, 2 * hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxOperations(nums: List[int], k: int) -> int:\n    s = sorted(nums)\n    lo, hi, count = 0, len(s) - 1, 0\n    while lo < hi:\n        total = s[lo] + s[hi]\n        if total == k:\n            count += 1\n            lo += 1\n            hi -= 1\n        elif total < k:\n            lo += 1\n        else:\n            hi -= 1\n    return count`,
        javascript: `var maxOperations = function(nums, k) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, count = 0;\n    while (lo < hi) {\n        var sum = s[lo] + s[hi];\n        if (sum === k) { count++; lo++; hi--; }\n        else if (sum < k) lo++;\n        else hi--;\n    }\n    return count;\n};`,
        typescript: `function maxOperations(nums: number[], k: number): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, count = 0;\n    while (lo < hi) {\n        var sum = s[lo] + s[hi];\n        if (sum === k) { count++; lo++; hi--; }\n        else if (sum < k) lo++;\n        else hi--;\n    }\n    return count;\n}`,
        java: `public static int maxOperations(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int lo = 0, hi = s.length - 1, count = 0;\n    while (lo < hi) {\n        long sum = (long) s[lo] + s[hi];\n        if (sum == k) { count++; lo++; hi--; }\n        else if (sum < k) lo++;\n        else hi--;\n    }\n    return count;\n}`,
        cpp: `int maxOperations(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int lo = 0, hi = (int) s.size() - 1, count = 0;\n    while (lo < hi) {\n        long long sum = (long long) s[lo] + s[hi];\n        if (sum == k) { count++; lo++; hi--; }\n        else if (sum < k) lo++;\n        else hi--;\n    }\n    return count;\n}`,
        c: `static int cmpKSumAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maxOperations(int* nums, int numsSize, int k) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpKSumAsc);\n    int lo = 0, hi = numsSize - 1, count = 0;\n    while (lo < hi) {\n        long long sum = (long long) s[lo] + s[hi];\n        if (sum == (long long) k) { count++; lo++; hi--; }\n        else if (sum < (long long) k) lo++;\n        else hi--;\n    }\n    free(s);\n    return count;\n}`,
        csharp: `public static int MaxOperations(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int lo = 0, hi = s.Length - 1, count = 0;\n    while (lo < hi)\n    {\n        long sum = (long) s[lo] + s[hi];\n        if (sum == k) { count++; lo++; hi--; }\n        else if (sum < k) lo++;\n        else hi--;\n    }\n    return count;\n}`,
        go: `func maxOperations(nums []int, k int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tlo, hi, count := 0, len(s)-1, 0\n\tfor lo < hi {\n\t\tsum := s[lo] + s[hi]\n\t\tif sum == k {\n\t\t\tcount++\n\t\t\tlo++\n\t\t\thi--\n\t\t} else if sum < k {\n\t\t\tlo++\n\t\t} else {\n\t\t\thi--\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun maxOperations(nums: IntArray, k: Int): Int {\n    val s = nums.sortedArray()\n    var lo = 0\n    var hi = s.size - 1\n    var count = 0\n    while (lo < hi) {\n        val sum = s[lo].toLong() + s[hi]\n        if (sum == k.toLong()) {\n            count++\n            lo++\n            hi--\n        } else if (sum < k) lo++\n        else hi--\n    }\n    return count\n}`,
        swift: `func maxOperations(_ nums: [Int], _ k: Int) -> Int {\n    let s = nums.sorted()\n    var lo = 0\n    var hi = s.count - 1\n    var count = 0\n    while lo < hi {\n        let sum = s[lo] + s[hi]\n        if sum == k {\n            count += 1\n            lo += 1\n            hi -= 1\n        } else if sum < k {\n            lo += 1\n        } else {\n            hi -= 1\n        }\n    }\n    return count\n}`,
        rust: `fn maxOperations(nums: Vec<i32>, k: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut lo: i32 = 0;\n    let mut hi: i32 = s.len() as i32 - 1;\n    let mut count = 0i32;\n    while lo < hi {\n        let sum = s[lo as usize] as i64 + s[hi as usize] as i64;\n        if sum == k as i64 {\n            count += 1;\n            lo += 1;\n            hi -= 1;\n        } else if sum < k as i64 {\n            lo += 1;\n        } else {\n            hi -= 1;\n        }\n    }\n    count\n}`,
        php: `function maxOperations($nums, $k) {\n    $s = $nums;\n    sort($s);\n    $lo = 0;\n    $hi = count($s) - 1;\n    $count = 0;\n    while ($lo < $hi) {\n        $sum = $s[$lo] + $s[$hi];\n        if ($sum === $k) { $count++; $lo++; $hi--; }\n        else if ($sum < $k) $lo++;\n        else $hi--;\n    }\n    return $count;\n}`,
        ruby: `def maxOperations(nums, k)\n  s = nums.sort\n  lo = 0\n  hi = s.length - 1\n  count = 0\n  while lo < hi\n    sum = s[lo] + s[hi]\n    if sum == k\n      count += 1\n      lo += 1\n      hi -= 1\n    elsif sum < k\n      lo += 1\n    else\n      hi -= 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Bag of Tokens (LC 948) ──────────────────────────────────────
  (() => {
    const ref = (tokens: number[], power: number) => {
      const s = tokens.slice().sort((a, b) => a - b);
      let lo = 0, hi = s.length - 1, score = 0, best = 0, p = power;
      while (lo <= hi) {
        if (p >= s[lo]) { p -= s[lo]; lo++; score++; if (score > best) best = score; }
        else if (score > 0) { p += s[hi]; hi--; score--; }
        else break;
      }
      return best;
    };
    return {
      slug: "bag-of-tokens",
      title: "Bag of Tokens",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "bagOfTokensScore", params: [{ name: "tokens", type: "int[]" as const }, { name: "power", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You start with `power` energy and a score of `0`. Each token may be played **once**, face up or face down:\n\n- face up: spend `tokens[i]` energy (you must have enough) and gain 1 score;\n- face down: gain `tokens[i]` energy and lose 1 score (you must have at least 1 score).\n\nReturn the maximum score reachable.",
        [
          { in: "tokens = [100], power = 50", out: "0", note: "Not enough energy to play the only token face up." },
          { in: "tokens = [200,100], power = 150", out: "1", note: "Play 100 face up; the remaining 50 energy cannot buy 200." },
          { in: "tokens = [100,200,300,400], power = 200", out: "2", note: "Play 100 up, 400 down, then 200 and 300 up." },
        ],
        ["0 <= tokens.length <= 1000", "0 <= tokens[i], power <= 10000"]),
      hints: [
        "Sort the tokens: spend energy on the cheapest and sell the most expensive.",
        "Two pointers — take from the front face up while you can afford it, otherwise sell from the back.",
        "Track the best score seen, since selling temporarily lowers the current score.",
      ],
      editorial: explain({
        idea: "Buying score should always be as cheap as possible and selling score as lucrative as possible, which after sorting means taking from the front and the back respectively.",
        steps: [
          "Sort the tokens ascending.",
          "While the pointers have not crossed: if the current energy covers the cheapest remaining token, play it face up, spending energy and gaining score.",
          "Otherwise, if the score is positive, play the most expensive remaining token face down, gaining energy and losing score.",
          "If neither move is possible, stop. Track the maximum score seen along the way.",
        ],
        why: "Exchange argument: replacing a face-up token by a cheaper unused one never costs more energy, and replacing a face-down token by a more expensive unused one never yields less. So the extremes are always safe choices. Recording the running maximum matters because a sell step lowers the score in the hope of buying two later.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Returning the final score rather than the best seen underreports whenever the last move was a sell.",
          "Selling with a score of 0 is illegal and would loop forever.",
          "An empty token list scores 0.",
        ],
      }),
      examples: [
        { input: "[100]\n50", expectedOutput: "0" },
        { input: "[200,100]\n150", expectedOutput: "1" },
        { input: "[100,200,300,400]\n200", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const tokens = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 0, 10000));
        const power = ri(rng, 0, 10000);
        return { input: `${fmtIntArr(tokens)}\n${power}`, expectedOutput: String(ref(tokens, power)) };
      },
      solutions: {
        python: `from typing import List\n\ndef bagOfTokensScore(tokens: List[int], power: int) -> int:\n    s = sorted(tokens)\n    lo, hi = 0, len(s) - 1\n    score = best = 0\n    while lo <= hi:\n        if power >= s[lo]:\n            power -= s[lo]\n            lo += 1\n            score += 1\n            best = max(best, score)\n        elif score > 0:\n            power += s[hi]\n            hi -= 1\n            score -= 1\n        else:\n            break\n    return best`,
        javascript: `var bagOfTokensScore = function(tokens, power) {\n    var s = tokens.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, score = 0, best = 0, p = power;\n    while (lo <= hi) {\n        if (p >= s[lo]) {\n            p -= s[lo];\n            lo++;\n            score++;\n            if (score > best) best = score;\n        } else if (score > 0) {\n            p += s[hi];\n            hi--;\n            score--;\n        } else break;\n    }\n    return best;\n};`,
        typescript: `function bagOfTokensScore(tokens: number[], power: number): number {\n    var s = tokens.slice().sort(function(a, b) { return a - b; });\n    var lo = 0, hi = s.length - 1, score = 0, best = 0, p = power;\n    while (lo <= hi) {\n        if (p >= s[lo]) {\n            p -= s[lo];\n            lo++;\n            score++;\n            if (score > best) best = score;\n        } else if (score > 0) {\n            p += s[hi];\n            hi--;\n            score--;\n        } else break;\n    }\n    return best;\n}`,
        java: `public static int bagOfTokensScore(int[] tokens, int power) {\n    int[] s = tokens.clone();\n    Arrays.sort(s);\n    int lo = 0, hi = s.length - 1, score = 0, best = 0;\n    while (lo <= hi) {\n        if (power >= s[lo]) {\n            power -= s[lo];\n            lo++;\n            score++;\n            best = Math.max(best, score);\n        } else if (score > 0) {\n            power += s[hi];\n            hi--;\n            score--;\n        } else break;\n    }\n    return best;\n}`,
        cpp: `int bagOfTokensScore(vector<int>& tokens, int power) {\n    vector<int> s = tokens;\n    sort(s.begin(), s.end());\n    int lo = 0, hi = (int) s.size() - 1, score = 0, best = 0;\n    while (lo <= hi) {\n        if (power >= s[lo]) {\n            power -= s[lo];\n            lo++;\n            score++;\n            best = max(best, score);\n        } else if (score > 0) {\n            power += s[hi];\n            hi--;\n            score--;\n        } else break;\n    }\n    return best;\n}`,
        c: `static int cmpTokenAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint bagOfTokensScore(int* tokens, int tokensSize, int power) {\n    int* s = (int*) malloc((size_t) (tokensSize > 0 ? tokensSize : 1) * sizeof(int));\n    for (int i = 0; i < tokensSize; i++) s[i] = tokens[i];\n    qsort(s, (size_t) tokensSize, sizeof(int), cmpTokenAsc);\n    int lo = 0, hi = tokensSize - 1, score = 0, best = 0;\n    while (lo <= hi) {\n        if (power >= s[lo]) {\n            power -= s[lo];\n            lo++;\n            score++;\n            if (score > best) best = score;\n        } else if (score > 0) {\n            power += s[hi];\n            hi--;\n            score--;\n        } else break;\n    }\n    free(s);\n    return best;\n}`,
        csharp: `public static int BagOfTokensScore(int[] tokens, int power)\n{\n    int[] s = (int[]) tokens.Clone();\n    Array.Sort(s);\n    int lo = 0, hi = s.Length - 1, score = 0, best = 0;\n    while (lo <= hi)\n    {\n        if (power >= s[lo])\n        {\n            power -= s[lo];\n            lo++;\n            score++;\n            if (score > best) best = score;\n        }\n        else if (score > 0)\n        {\n            power += s[hi];\n            hi--;\n            score--;\n        }\n        else break;\n    }\n    return best;\n}`,
        go: `func bagOfTokensScore(tokens []int, power int) int {\n\ts := append([]int{}, tokens...)\n\tsort.Ints(s)\n\tlo, hi, score, best := 0, len(s)-1, 0, 0\n\tfor lo <= hi {\n\t\tif power >= s[lo] {\n\t\t\tpower -= s[lo]\n\t\t\tlo++\n\t\t\tscore++\n\t\t\tif score > best {\n\t\t\t\tbest = score\n\t\t\t}\n\t\t} else if score > 0 {\n\t\t\tpower += s[hi]\n\t\t\thi--\n\t\t\tscore--\n\t\t} else {\n\t\t\tbreak\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun bagOfTokensScore(tokens: IntArray, power: Int): Int {\n    val s = tokens.sortedArray()\n    var lo = 0\n    var hi = s.size - 1\n    var score = 0\n    var best = 0\n    var p = power\n    while (lo <= hi) {\n        if (p >= s[lo]) {\n            p -= s[lo]\n            lo++\n            score++\n            if (score > best) best = score\n        } else if (score > 0) {\n            p += s[hi]\n            hi--\n            score--\n        } else break\n    }\n    return best\n}`,
        swift: `func bagOfTokensScore(_ tokens: [Int], _ power: Int) -> Int {\n    let s = tokens.sorted()\n    var lo = 0\n    var hi = s.count - 1\n    var score = 0\n    var best = 0\n    var p = power\n    while lo <= hi {\n        if p >= s[lo] {\n            p -= s[lo]\n            lo += 1\n            score += 1\n            if score > best { best = score }\n        } else if score > 0 {\n            p += s[hi]\n            hi -= 1\n            score -= 1\n        } else {\n            break\n        }\n    }\n    return best\n}`,
        rust: `fn bagOfTokensScore(tokens: Vec<i32>, power: i32) -> i32 {\n    let mut s = tokens.clone();\n    s.sort();\n    let mut lo: i32 = 0;\n    let mut hi: i32 = s.len() as i32 - 1;\n    let mut score = 0i32;\n    let mut best = 0i32;\n    let mut p = power;\n    while lo <= hi {\n        if p >= s[lo as usize] {\n            p -= s[lo as usize];\n            lo += 1;\n            score += 1;\n            if score > best {\n                best = score;\n            }\n        } else if score > 0 {\n            p += s[hi as usize];\n            hi -= 1;\n            score -= 1;\n        } else {\n            break;\n        }\n    }\n    best\n}`,
        php: `function bagOfTokensScore($tokens, $power) {\n    $s = $tokens;\n    sort($s);\n    $lo = 0;\n    $hi = count($s) - 1;\n    $score = 0;\n    $best = 0;\n    while ($lo <= $hi) {\n        if ($power >= $s[$lo]) {\n            $power -= $s[$lo];\n            $lo++;\n            $score++;\n            if ($score > $best) $best = $score;\n        } else if ($score > 0) {\n            $power += $s[$hi];\n            $hi--;\n            $score--;\n        } else break;\n    }\n    return $best;\n}`,
        ruby: `def bagOfTokensScore(tokens, power)\n  s = tokens.sort\n  lo = 0\n  hi = s.length - 1\n  score = 0\n  best = 0\n  p = power\n  while lo <= hi\n    if p >= s[lo]\n      p -= s[lo]\n      lo += 1\n      score += 1\n      best = score if score > best\n    elsif score > 0\n      p += s[hi]\n      hi -= 1\n      score -= 1\n    else\n      break\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Sort Transformed Array (LC 360) ─────────────────────────────
  (() => {
    const ref = (nums: number[], a: number, b: number, c: number) => {
      const f = (x: number) => a * x * x + b * x + c;
      const n = nums.length;
      const out = new Array(n).fill(0);
      let lo = 0, hi = n - 1;
      let idx = a >= 0 ? n - 1 : 0;
      while (lo <= hi) {
        const left = f(nums[lo]), right = f(nums[hi]);
        if (a >= 0) {
          if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }
          idx--;
        } else {
          if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }
          idx++;
        }
      }
      return out;
    };
    return {
      slug: "sort-transformed-array",
      title: "Sort Transformed Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Math", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "sortTransformedArray", params: [{ name: "nums", type: "int[]" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "c", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a **sorted** array `nums` and the quadratic `f(x) = a·x² + b·x + c`.\n\nApply `f` to every element and return the results in **sorted ascending order**.",
        [
          { in: "nums = [-4,-2,2,4], a = 1, b = 3, c = 5", out: "[3,9,15,33]", note: "The parabola opens upward, so the extremes of the input give the largest values." },
          { in: "nums = [-4,-2,2,4], a = -1, b = 3, c = 5", out: "[-23,-5,1,7]", note: "Opening downward reverses which ends are largest." },
          { in: "nums = [1,2,3], a = 0, b = 2, c = 1", out: "[3,5,7]", note: "With a = 0 the function is linear and increasing." },
        ],
        ["1 <= nums.length <= 200", "-100 <= nums[i], a, b, c <= 100", "nums is sorted in ascending order."]),
      hints: [
        "Sorting the transformed values costs an extra `log n`; two pointers get it in linear time.",
        "A parabola with `a > 0` takes its largest values at the ends of a sorted input, so fill the output from the back.",
        "With `a < 0` the largest values sit in the middle, so fill from the front taking the smaller end each time.",
      ],
      editorial: explain({
        idea: "A quadratic is monotone away from its vertex, so on a sorted input the extreme values always sit at the two ends. Which end wins depends on the sign of `a`, and a two-pointer sweep fills the output in the right direction.",
        steps: [
          "Evaluate `f` at the current left and right ends.",
          "If `a >= 0` the parabola opens upward: the larger of the two goes at the back of the output, and that pointer moves inward.",
          "If `a < 0` it opens downward: the smaller of the two goes at the front, and that pointer moves inward.",
          "Continue until the pointers cross.",
        ],
        why: "For `a > 0`, `f` decreases then increases, so along a sorted input the maximum over any contiguous stretch is at one of its ends. Repeatedly removing that end therefore emits the values in decreasing order, which filling the output backwards turns into ascending order. The `a < 0` case is the mirror image, and `a = 0` makes `f` monotone, which both branches handle correctly.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Assuming `a > 0` always puts the maximum at the right end — with a vertex inside the range, the left end can be larger.",
          "Treating `a = 0` as a separate case is unnecessary but harmless; the upward branch handles it.",
          "The values reach about `100 · 100² = 10^6`, comfortably inside `int`.",
        ],
      }),
      examples: [
        { input: "[-4,-2,2,4]\n1\n3\n5", expectedOutput: "[3,9,15,33]" },
        { input: "[-4,-2,2,4]\n-1\n3\n5", expectedOutput: "[-23,-5,1,7]" },
        { input: "[1,2,3]\n0\n2\n1", expectedOutput: "[3,5,7]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, -100, 100)).sort((x, y) => x - y);
        const a = ri(rng, -100, 100);
        const b = ri(rng, -100, 100);
        const c = ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${a}\n${b}\n${c}`, expectedOutput: fmtIntArr(ref(nums, a, b, c)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sortTransformedArray(nums: List[int], a: int, b: int, c: int) -> List[int]:\n    def f(x: int) -> int:\n        return a * x * x + b * x + c\n\n    n = len(nums)\n    out = [0] * n\n    lo, hi = 0, n - 1\n    idx = n - 1 if a >= 0 else 0\n    while lo <= hi:\n        left, right = f(nums[lo]), f(nums[hi])\n        if a >= 0:\n            if left >= right:\n                out[idx] = left\n                lo += 1\n            else:\n                out[idx] = right\n                hi -= 1\n            idx -= 1\n        else:\n            if left <= right:\n                out[idx] = left\n                lo += 1\n            else:\n                out[idx] = right\n                hi -= 1\n            idx += 1\n    return out`,
        javascript: `var sortTransformedArray = function(nums, a, b, c) {\n    var f = function(x) { return a * x * x + b * x + c; };\n    var n = nums.length;\n    var out = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    var lo = 0, hi = n - 1;\n    var idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi) {\n        var left = f(nums[lo]), right = f(nums[hi]);\n        if (a >= 0) {\n            if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx--;\n        } else {\n            if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    return out;\n};`,
        typescript: `function sortTransformedArray(nums: number[], a: number, b: number, c: number): number[] {\n    var f = function(x: number): number { return a * x * x + b * x + c; };\n    var n = nums.length;\n    var out: number[] = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    var lo = 0, hi = n - 1;\n    var idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi) {\n        var left = f(nums[lo]), right = f(nums[hi]);\n        if (a >= 0) {\n            if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx--;\n        } else {\n            if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    return out;\n}`,
        java: `public static int[] sortTransformedArray(int[] nums, int a, int b, int c) {\n    int n = nums.length;\n    int[] out = new int[n];\n    int lo = 0, hi = n - 1;\n    int idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi) {\n        int left = a * nums[lo] * nums[lo] + b * nums[lo] + c;\n        int right = a * nums[hi] * nums[hi] + b * nums[hi] + c;\n        if (a >= 0) {\n            if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx--;\n        } else {\n            if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    return out;\n}`,
        cpp: `vector<int> sortTransformedArray(vector<int>& nums, int a, int b, int c) {\n    int n = (int) nums.size();\n    vector<int> out(n);\n    int lo = 0, hi = n - 1;\n    int idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi) {\n        int left = a * nums[lo] * nums[lo] + b * nums[lo] + c;\n        int right = a * nums[hi] * nums[hi] + b * nums[hi] + c;\n        if (a >= 0) {\n            if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx--;\n        } else {\n            if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    return out;\n}`,
        c: `int* sortTransformedArray(int* nums, int numsSize, int a, int b, int c, int* returnSize) {\n    int n = numsSize;\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    int lo = 0, hi = n - 1;\n    int idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi) {\n        int left = a * nums[lo] * nums[lo] + b * nums[lo] + c;\n        int right = a * nums[hi] * nums[hi] + b * nums[hi] + c;\n        if (a >= 0) {\n            if (left >= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx--;\n        } else {\n            if (left <= right) { out[idx] = left; lo++; } else { out[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] SortTransformedArray(int[] nums, int a, int b, int c)\n{\n    int n = nums.Length;\n    int[] out_ = new int[n];\n    int lo = 0, hi = n - 1;\n    int idx = a >= 0 ? n - 1 : 0;\n    while (lo <= hi)\n    {\n        int left = a * nums[lo] * nums[lo] + b * nums[lo] + c;\n        int right = a * nums[hi] * nums[hi] + b * nums[hi] + c;\n        if (a >= 0)\n        {\n            if (left >= right) { out_[idx] = left; lo++; } else { out_[idx] = right; hi--; }\n            idx--;\n        }\n        else\n        {\n            if (left <= right) { out_[idx] = left; lo++; } else { out_[idx] = right; hi--; }\n            idx++;\n        }\n    }\n    return out_;\n}`,
        go: `func sortTransformedArray(nums []int, a int, b int, c int) []int {\n\tn := len(nums)\n\tout := make([]int, n)\n\tlo, hi := 0, n-1\n\tidx := 0\n\tif a >= 0 {\n\t\tidx = n - 1\n\t}\n\tfor lo <= hi {\n\t\tleft := a*nums[lo]*nums[lo] + b*nums[lo] + c\n\t\tright := a*nums[hi]*nums[hi] + b*nums[hi] + c\n\t\tif a >= 0 {\n\t\t\tif left >= right {\n\t\t\t\tout[idx] = left\n\t\t\t\tlo++\n\t\t\t} else {\n\t\t\t\tout[idx] = right\n\t\t\t\thi--\n\t\t\t}\n\t\t\tidx--\n\t\t} else {\n\t\t\tif left <= right {\n\t\t\t\tout[idx] = left\n\t\t\t\tlo++\n\t\t\t} else {\n\t\t\t\tout[idx] = right\n\t\t\t\thi--\n\t\t\t}\n\t\t\tidx++\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun sortTransformedArray(nums: IntArray, a: Int, b: Int, c: Int): IntArray {\n    val n = nums.size\n    val out = IntArray(n)\n    var lo = 0\n    var hi = n - 1\n    var idx = if (a >= 0) n - 1 else 0\n    while (lo <= hi) {\n        val left = a * nums[lo] * nums[lo] + b * nums[lo] + c\n        val right = a * nums[hi] * nums[hi] + b * nums[hi] + c\n        if (a >= 0) {\n            if (left >= right) {\n                out[idx] = left\n                lo++\n            } else {\n                out[idx] = right\n                hi--\n            }\n            idx--\n        } else {\n            if (left <= right) {\n                out[idx] = left\n                lo++\n            } else {\n                out[idx] = right\n                hi--\n            }\n            idx++\n        }\n    }\n    return out\n}`,
        swift: `func sortTransformedArray(_ nums: [Int], _ a: Int, _ b: Int, _ c: Int) -> [Int] {\n    let n = nums.count\n    var out = [Int](repeating: 0, count: n)\n    var lo = 0\n    var hi = n - 1\n    var idx = a >= 0 ? n - 1 : 0\n    while lo <= hi {\n        let left = a * nums[lo] * nums[lo] + b * nums[lo] + c\n        let right = a * nums[hi] * nums[hi] + b * nums[hi] + c\n        if a >= 0 {\n            if left >= right {\n                out[idx] = left\n                lo += 1\n            } else {\n                out[idx] = right\n                hi -= 1\n            }\n            idx -= 1\n        } else {\n            if left <= right {\n                out[idx] = left\n                lo += 1\n            } else {\n                out[idx] = right\n                hi -= 1\n            }\n            idx += 1\n        }\n    }\n    return out\n}`,
        rust: `fn sortTransformedArray(nums: Vec<i32>, a: i32, b: i32, c: i32) -> Vec<i32> {\n    let n = nums.len();\n    let mut out = vec![0i32; n];\n    let mut lo: i32 = 0;\n    let mut hi: i32 = n as i32 - 1;\n    let mut idx: i32 = if a >= 0 { n as i32 - 1 } else { 0 };\n    while lo <= hi {\n        let xl = nums[lo as usize];\n        let xr = nums[hi as usize];\n        let left = a * xl * xl + b * xl + c;\n        let right = a * xr * xr + b * xr + c;\n        if a >= 0 {\n            if left >= right {\n                out[idx as usize] = left;\n                lo += 1;\n            } else {\n                out[idx as usize] = right;\n                hi -= 1;\n            }\n            idx -= 1;\n        } else {\n            if left <= right {\n                out[idx as usize] = left;\n                lo += 1;\n            } else {\n                out[idx as usize] = right;\n                hi -= 1;\n            }\n            idx += 1;\n        }\n    }\n    out\n}`,
        php: `function sortTransformedArray($nums, $a, $b, $c) {\n    $n = count($nums);\n    $out = array_fill(0, $n, 0);\n    $lo = 0;\n    $hi = $n - 1;\n    $idx = $a >= 0 ? $n - 1 : 0;\n    while ($lo <= $hi) {\n        $left = $a * $nums[$lo] * $nums[$lo] + $b * $nums[$lo] + $c;\n        $right = $a * $nums[$hi] * $nums[$hi] + $b * $nums[$hi] + $c;\n        if ($a >= 0) {\n            if ($left >= $right) { $out[$idx] = $left; $lo++; }\n            else { $out[$idx] = $right; $hi--; }\n            $idx--;\n        } else {\n            if ($left <= $right) { $out[$idx] = $left; $lo++; }\n            else { $out[$idx] = $right; $hi--; }\n            $idx++;\n        }\n    }\n    return $out;\n}`,
        ruby: `def sortTransformedArray(nums, a, b, c)\n  f = lambda { |x| a * x * x + b * x + c }\n  n = nums.length\n  out = Array.new(n, 0)\n  lo = 0\n  hi = n - 1\n  idx = a >= 0 ? n - 1 : 0\n  while lo <= hi\n    left = f.call(nums[lo])\n    right = f.call(nums[hi])\n    if a >= 0\n      if left >= right\n        out[idx] = left\n        lo += 1\n      else\n        out[idx] = right\n        hi -= 1\n      end\n      idx -= 1\n    else\n      if left <= right\n        out[idx] = left\n        lo += 1\n      else\n        out[idx] = right\n        hi -= 1\n      end\n      idx += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Partition Array Such That Maximum Difference Is K (LC 2294) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      let groups = 0, start = -1;
      for (const x of s) {
        if (start < 0 || x - start > k) { groups++; start = x; }
      }
      return groups;
    };
    return {
      slug: "partition-array-such-that-maximum-difference-is-k",
      title: "Partition Array Such That Maximum Difference Is K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Two Pointers", "Amazon", "Google", "Walmart"],
      signature: { funcName: "partitionArray", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Split every element of `nums` into subsequences so that within each subsequence the difference between the largest and smallest value is at most `k`.\n\nReturn the minimum number of subsequences needed.",
        [
          { in: "nums = [3,6,1,2,5], k = 2", out: "2", note: "The groups [1,2,3] and [5,6] each span at most 2." },
          { in: "nums = [1,2,3], k = 1", out: "2", note: "[1,2] and [3]." },
          { in: "nums = [2,2,4,5], k = 0", out: "3", note: "With k = 0 each distinct value needs its own group." },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 100000", "0 <= k <= 100000"]),
      hints: [
        "Order inside a subsequence does not matter, so sort first.",
        "Once sorted, a greedy sweep works: open a group at the smallest unassigned value and admit everything within `k` of it.",
        "Close the group at the first value that exceeds `start + k`.",
      ],
      editorial: explain({
        idea: "Sorting makes the optimal grouping contiguous. Then a greedy scan opens a group at the smallest unassigned value and keeps admitting values until one falls outside the span.",
        steps: [
          "Sort a copy of `nums`.",
          "Track `start`, the smallest value of the open group.",
          "For each value, open a new group when it exceeds `start + k`, updating `start`.",
          "Return the number of groups opened.",
        ],
        why: "Exchange argument: in any optimal grouping, sorting the values and taking contiguous blocks is at least as good, because a group's span depends only on its minimum and maximum. Given contiguity, starting each group at the smallest remaining value and stretching as far as `k` allows is greedily optimal — delaying a value to a later group can never reduce the count.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Comparing against the previous element rather than the group's first element lets a group drift beyond `k`.",
          "`k = 0` is legal and means a group holds a single distinct value.",
          "Subsequences, not subarrays — which is exactly why sorting is allowed.",
        ],
      }),
      examples: [
        { input: "[3,6,1,2,5]\n2", expectedOutput: "2" },
        { input: "[1,2,3]\n1", expectedOutput: "2" },
        { input: "[2,2,4,5]\n0", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 100000;
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 0, hi));
        const k = rng() < 0.5 ? ri(rng, 0, 5) : ri(rng, 0, hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef partitionArray(nums: List[int], k: int) -> int:\n    s = sorted(nums)\n    groups = 0\n    start = None\n    for x in s:\n        if start is None or x - start > k:\n            groups += 1\n            start = x\n    return groups`,
        javascript: `var partitionArray = function(nums, k) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var groups = 0, start = -1, first = true;\n    for (var i = 0; i < s.length; i++) {\n        if (first || s[i] - start > k) { groups++; start = s[i]; first = false; }\n    }\n    return groups;\n};`,
        typescript: `function partitionArray(nums: number[], k: number): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var groups = 0, start = -1, first = true;\n    for (var i = 0; i < s.length; i++) {\n        if (first || s[i] - start > k) { groups++; start = s[i]; first = false; }\n    }\n    return groups;\n}`,
        java: `public static int partitionArray(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int groups = 0, start = 0;\n    boolean first = true;\n    for (int x : s) {\n        if (first || x - start > k) {\n            groups++;\n            start = x;\n            first = false;\n        }\n    }\n    return groups;\n}`,
        cpp: `int partitionArray(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int groups = 0, start = 0;\n    bool first = true;\n    for (int x : s) {\n        if (first || x - start > k) {\n            groups++;\n            start = x;\n            first = false;\n        }\n    }\n    return groups;\n}`,
        c: `static int cmpPartAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint partitionArray(int* nums, int numsSize, int k) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpPartAsc);\n    int groups = 0, start = 0, first = 1;\n    for (int i = 0; i < numsSize; i++) {\n        if (first || s[i] - start > k) {\n            groups++;\n            start = s[i];\n            first = 0;\n        }\n    }\n    free(s);\n    return groups;\n}`,
        csharp: `public static int PartitionArray(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int groups = 0, start = 0;\n    bool first = true;\n    foreach (int x in s)\n    {\n        if (first || x - start > k)\n        {\n            groups++;\n            start = x;\n            first = false;\n        }\n    }\n    return groups;\n}`,
        go: `func partitionArray(nums []int, k int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tgroups, start := 0, 0\n\tfirst := true\n\tfor _, x := range s {\n\t\tif first || x-start > k {\n\t\t\tgroups++\n\t\t\tstart = x\n\t\t\tfirst = false\n\t\t}\n\t}\n\treturn groups\n}`,
        kotlin: `fun partitionArray(nums: IntArray, k: Int): Int {\n    val s = nums.sortedArray()\n    var groups = 0\n    var start = 0\n    var first = true\n    for (x in s) {\n        if (first || x - start > k) {\n            groups++\n            start = x\n            first = false\n        }\n    }\n    return groups\n}`,
        swift: `func partitionArray(_ nums: [Int], _ k: Int) -> Int {\n    let s = nums.sorted()\n    var groups = 0\n    var start = 0\n    var first = true\n    for x in s {\n        if first || x - start > k {\n            groups += 1\n            start = x\n            first = false\n        }\n    }\n    return groups\n}`,
        rust: `fn partitionArray(nums: Vec<i32>, k: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut groups = 0i32;\n    let mut start = 0i32;\n    let mut first = true;\n    for &x in s.iter() {\n        if first || x - start > k {\n            groups += 1;\n            start = x;\n            first = false;\n        }\n    }\n    groups\n}`,
        php: `function partitionArray($nums, $k) {\n    $s = $nums;\n    sort($s);\n    $groups = 0;\n    $start = 0;\n    $first = true;\n    foreach ($s as $x) {\n        if ($first || $x - $start > $k) {\n            $groups++;\n            $start = $x;\n            $first = false;\n        }\n    }\n    return $groups;\n}`,
        ruby: `def partitionArray(nums, k)\n  s = nums.sort\n  groups = 0\n  start = nil\n  s.each do |x|\n    if start.nil? || x - start > k\n      groups += 1\n      start = x\n    end\n  end\n  groups\nend`,
      },
    };
  })(),

  // ── Shortest Word Distance (LC 243) ─────────────────────────────
  (() => {
    const ref = (wordsDict: string[], word1: string, word2: string) => {
      let i1 = -1, i2 = -1, best = -1;
      for (let i = 0; i < wordsDict.length; i++) {
        if (wordsDict[i] === word1) i1 = i;
        if (wordsDict[i] === word2) i2 = i;
        if (i1 >= 0 && i2 >= 0) {
          const d = Math.abs(i1 - i2);
          if (best < 0 || d < best) best = d;
        }
      }
      return best;
    };
    return {
      slug: "shortest-word-distance",
      title: "Shortest Word Distance",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Two Pointers", "Amazon", "Meta", "Infosys"],
      signature: { funcName: "shortestDistance", params: [{ name: "wordsDict", type: "string[]" as const }, { name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a list of words and two **different** words that both appear in it, return the shortest distance between their positions.",
        [
          { in: 'wordsDict = ["drill","makes","codekairo","kata","makes"], word1 = "kata", word2 = "drill"', out: "3", note: "Indices 3 and 0 are three apart." },
          { in: 'wordsDict = ["drill","makes","codekairo","kata","makes"], word1 = "makes", word2 = "kata"', out: "1", note: "Indices 4 and 3 are adjacent." },
          { in: 'wordsDict = ["a","b"], word1 = "a", word2 = "b"', out: "1" },
        ],
        ["2 <= wordsDict.length <= 30000", "1 <= word length <= 10", "word1 and word2 both appear in wordsDict and differ from each other."]),
      hints: [
        "One pass is enough: remember the most recent index of each word.",
        "Whenever both have been seen, their current indices give a candidate distance.",
        "The most recent occurrence is always the best partner for the word just encountered.",
      ],
      editorial: explain({
        idea: "Sweep once, keeping the latest position of each of the two words. Every time either is seen, the pair of latest positions is the closest pairing involving that occurrence.",
        steps: [
          "Track `i1` and `i2`, the most recent indices of `word1` and `word2`, both starting unset.",
          "Update the relevant index at each position.",
          "Once both are set, record `|i1 - i2|` and keep the minimum.",
        ],
        why: "For an occurrence at index `i`, the nearest occurrence of the other word to its left is the most recent one — anything earlier is further away. A nearer occurrence on the right will be considered when that position is reached, so scanning once covers every closest pair.",
        time: "O(n · L)",
        space: "O(1)",
        pitfalls: [
          "Collecting all indices of both words and comparing every pair is `O(n²)` in the worst case.",
          "Recording a distance before both words have been seen uses an unset index.",
          "The two words are guaranteed different, which is what makes `|i1 - i2|` never zero.",
        ],
      }),
      examples: [
        { input: '["drill","makes","codekairo","kata","makes"]\n"kata"\n"drill"', expectedOutput: "3" },
        { input: '["drill","makes","codekairo","kata","makes"]\n"makes"\n"kata"', expectedOutput: "1" },
        { input: '["a","b"]\n"a"\n"b"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const vocab = ["drill", "makes", "codekairo", "kata", "duel", "rank"];
        const n = ri(rng, 2, 30);
        const wordsDict = Array.from({ length: n }, () => pick(rng, vocab));
        const picks = shuffle(rng, vocab.slice()).slice(0, 2);
        // The statement promises both words occur, so plant them at two
        // distinct indices — a reject-and-retry loop spins forever once every
        // slot already holds word1.
        const a = ri(rng, 0, n - 1);
        const b = (a + ri(rng, 1, n - 1)) % n;
        wordsDict[a] = picks[0];
        wordsDict[b] = picks[1];
        return { input: `${fmtStrArr(wordsDict)}\n"${picks[0]}"\n"${picks[1]}"`, expectedOutput: String(ref(wordsDict, picks[0], picks[1])) };
      },
      solutions: {
        python: `from typing import List\n\ndef shortestDistance(wordsDict: List[str], word1: str, word2: str) -> int:\n    i1 = i2 = -1\n    best = -1\n    for i, w in enumerate(wordsDict):\n        if w == word1:\n            i1 = i\n        if w == word2:\n            i2 = i\n        if i1 >= 0 and i2 >= 0:\n            d = abs(i1 - i2)\n            if best < 0 or d < best:\n                best = d\n    return best`,
        javascript: `var shortestDistance = function(wordsDict, word1, word2) {\n    var i1 = -1, i2 = -1, best = -1;\n    for (var i = 0; i < wordsDict.length; i++) {\n        if (wordsDict[i] === word1) i1 = i;\n        if (wordsDict[i] === word2) i2 = i;\n        if (i1 >= 0 && i2 >= 0) {\n            var d = Math.abs(i1 - i2);\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n};`,
        typescript: `function shortestDistance(wordsDict: string[], word1: string, word2: string): number {\n    var i1 = -1, i2 = -1, best = -1;\n    for (var i = 0; i < wordsDict.length; i++) {\n        if (wordsDict[i] === word1) i1 = i;\n        if (wordsDict[i] === word2) i2 = i;\n        if (i1 >= 0 && i2 >= 0) {\n            var d = Math.abs(i1 - i2);\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        java: `public static int shortestDistance(String[] wordsDict, String word1, String word2) {\n    int i1 = -1, i2 = -1, best = -1;\n    for (int i = 0; i < wordsDict.length; i++) {\n        if (wordsDict[i].equals(word1)) i1 = i;\n        if (wordsDict[i].equals(word2)) i2 = i;\n        if (i1 >= 0 && i2 >= 0) {\n            int d = Math.abs(i1 - i2);\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        cpp: `int shortestDistance(vector<string>& wordsDict, string word1, string word2) {\n    int i1 = -1, i2 = -1, best = -1;\n    for (int i = 0; i < (int) wordsDict.size(); i++) {\n        if (wordsDict[i] == word1) i1 = i;\n        if (wordsDict[i] == word2) i2 = i;\n        if (i1 >= 0 && i2 >= 0) {\n            int d = abs(i1 - i2);\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        c: `int shortestDistance(char** wordsDict, int wordsDictSize, char* word1, char* word2) {\n    int i1 = -1, i2 = -1, best = -1;\n    for (int i = 0; i < wordsDictSize; i++) {\n        if (strcmp(wordsDict[i], word1) == 0) i1 = i;\n        if (strcmp(wordsDict[i], word2) == 0) i2 = i;\n        if (i1 >= 0 && i2 >= 0) {\n            int d = i1 - i2;\n            if (d < 0) d = -d;\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int ShortestDistance(string[] wordsDict, string word1, string word2)\n{\n    int i1 = -1, i2 = -1, best = -1;\n    for (int i = 0; i < wordsDict.Length; i++)\n    {\n        if (wordsDict[i] == word1) i1 = i;\n        if (wordsDict[i] == word2) i2 = i;\n        if (i1 >= 0 && i2 >= 0)\n        {\n            int d = Math.Abs(i1 - i2);\n            if (best < 0 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        go: `func shortestDistance(wordsDict []string, word1 string, word2 string) int {\n\ti1, i2, best := -1, -1, -1\n\tfor i, w := range wordsDict {\n\t\tif w == word1 {\n\t\t\ti1 = i\n\t\t}\n\t\tif w == word2 {\n\t\t\ti2 = i\n\t\t}\n\t\tif i1 >= 0 && i2 >= 0 {\n\t\t\td := i1 - i2\n\t\t\tif d < 0 {\n\t\t\t\td = -d\n\t\t\t}\n\t\t\tif best < 0 || d < best {\n\t\t\t\tbest = d\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun shortestDistance(wordsDict: Array<String>, word1: String, word2: String): Int {\n    var i1 = -1\n    var i2 = -1\n    var best = -1\n    for (i in wordsDict.indices) {\n        if (wordsDict[i] == word1) i1 = i\n        if (wordsDict[i] == word2) i2 = i\n        if (i1 >= 0 && i2 >= 0) {\n            val d = Math.abs(i1 - i2)\n            if (best < 0 || d < best) best = d\n        }\n    }\n    return best\n}`,
        swift: `func shortestDistance(_ wordsDict: [String], _ word1: String, _ word2: String) -> Int {\n    var i1 = -1\n    var i2 = -1\n    var best = -1\n    for i in 0..<wordsDict.count {\n        if wordsDict[i] == word1 { i1 = i }\n        if wordsDict[i] == word2 { i2 = i }\n        if i1 >= 0 && i2 >= 0 {\n            let d = abs(i1 - i2)\n            if best < 0 || d < best { best = d }\n        }\n    }\n    return best\n}`,
        rust: `fn shortestDistance(wordsDict: Vec<String>, word1: String, word2: String) -> i32 {\n    let mut i1: i32 = -1;\n    let mut i2: i32 = -1;\n    let mut best: i32 = -1;\n    for (i, w) in wordsDict.iter().enumerate() {\n        if *w == word1 {\n            i1 = i as i32;\n        }\n        if *w == word2 {\n            i2 = i as i32;\n        }\n        if i1 >= 0 && i2 >= 0 {\n            let d = (i1 - i2).abs();\n            if best < 0 || d < best {\n                best = d;\n            }\n        }\n    }\n    best\n}`,
        php: `function shortestDistance($wordsDict, $word1, $word2) {\n    $i1 = -1;\n    $i2 = -1;\n    $best = -1;\n    for ($i = 0; $i < count($wordsDict); $i++) {\n        if ($wordsDict[$i] === $word1) $i1 = $i;\n        if ($wordsDict[$i] === $word2) $i2 = $i;\n        if ($i1 >= 0 && $i2 >= 0) {\n            $d = abs($i1 - $i2);\n            if ($best < 0 || $d < $best) $best = $d;\n        }\n    }\n    return $best;\n}`,
        ruby: `def shortestDistance(wordsDict, word1, word2)\n  i1 = -1\n  i2 = -1\n  best = -1\n  wordsDict.each_with_index do |w, i|\n    i1 = i if w == word1\n    i2 = i if w == word2\n    if i1 >= 0 && i2 >= 0\n      d = (i1 - i2).abs\n      best = d if best < 0 || d < best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Mountain in Array (LC 845) ──────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      let best = 0, i = 1;
      while (i < n - 1) {
        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }
        let l = i - 1;
        while (l > 0 && arr[l - 1] < arr[l]) l--;
        let r = i + 1;
        while (r < n - 1 && arr[r] > arr[r + 1]) r++;
        if (r - l + 1 > best) best = r - l + 1;
        i = r;
      }
      return best;
    };
    return {
      slug: "longest-mountain-in-array",
      title: "Longest Mountain in Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "longestMountain", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **mountain** is a subarray of length at least 3 that strictly increases to a single peak and then strictly decreases. The peak may not be the first or last element of the subarray.\n\nReturn the length of the longest mountain, or `0` if there is none.",
        [
          { in: "arr = [2,1,4,7,3,2,5]", out: "5", note: "The mountain [1,4,7,3,2] has length 5." },
          { in: "arr = [2,2,2]", out: "0", note: "No strict increase anywhere." },
          { in: "arr = [0,1,0,1,0]", out: "3" },
        ],
        ["1 <= arr.length <= 10000", "0 <= arr[i] <= 10000"]),
      hints: [
        "Find the peaks first: an index that is strictly greater than both neighbours.",
        "From a peak, walk left while the values keep rising and right while they keep falling.",
        "Restart the outer scan at the right foot — mountains found this way never overlap.",
      ],
      editorial: explain({
        idea: "Every mountain has exactly one peak, so enumerate peaks and expand outwards. Because the descent of one mountain cannot be the ascent of another, resuming the outer scan at the right foot keeps the whole thing linear.",
        steps: [
          "Scan `i` over the interior indices looking for `arr[i-1] < arr[i] > arr[i+1]`.",
          "Walk `l` left while `arr[l-1] < arr[l]`, and `r` right while `arr[r] > arr[r+1]`.",
          "Record `r - l + 1` as a candidate and continue the outer scan from `r`.",
        ],
        why: "A mountain is determined by its peak, and the two walks find the maximal strictly monotone runs around it. Resuming at `r` is safe because any later mountain's ascent must begin at or after `r` — the stretch from the peak to `r` is strictly decreasing and so cannot be part of another ascent.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Plateaus break strictness, so `arr[i-1] <= arr[i]` is the wrong test.",
          "A mountain needs both a rise and a fall; a purely increasing run scores 0.",
          "Restarting the outer loop at `i + 1` still works but re-walks the descent, making it quadratic in the worst case.",
        ],
      }),
      examples: [
        { input: "[2,1,4,7,3,2,5]", expectedOutput: "5" },
        { input: "[2,2,2]", expectedOutput: "0" },
        { input: "[0,1,0,1,0]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 5 : 10000;
        const arr = Array.from({ length: ri(rng, 1, 50) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestMountain(arr: List[int]) -> int:\n    n = len(arr)\n    best = 0\n    i = 1\n    while i < n - 1:\n        if not (arr[i - 1] < arr[i] > arr[i + 1]):\n            i += 1\n            continue\n        l = i - 1\n        while l > 0 and arr[l - 1] < arr[l]:\n            l -= 1\n        r = i + 1\n        while r < n - 1 and arr[r] > arr[r + 1]:\n            r += 1\n        best = max(best, r - l + 1)\n        i = r\n    return best`,
        javascript: `var longestMountain = function(arr) {\n    var n = arr.length, best = 0, i = 1;\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        var l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        var r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        if (r - l + 1 > best) best = r - l + 1;\n        i = r;\n    }\n    return best;\n};`,
        typescript: `function longestMountain(arr: number[]): number {\n    var n = arr.length, best = 0, i = 1;\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        var l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        var r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        if (r - l + 1 > best) best = r - l + 1;\n        i = r;\n    }\n    return best;\n}`,
        java: `public static int longestMountain(int[] arr) {\n    int n = arr.length, best = 0, i = 1;\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        int l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        int r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        best = Math.max(best, r - l + 1);\n        i = r;\n    }\n    return best;\n}`,
        cpp: `int longestMountain(vector<int>& arr) {\n    int n = (int) arr.size(), best = 0, i = 1;\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        int l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        int r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        best = max(best, r - l + 1);\n        i = r;\n    }\n    return best;\n}`,
        c: `int longestMountain(int* arr, int arrSize) {\n    int n = arrSize, best = 0, i = 1;\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        int l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        int r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        if (r - l + 1 > best) best = r - l + 1;\n        i = r;\n    }\n    return best;\n}`,
        csharp: `public static int LongestMountain(int[] arr)\n{\n    int n = arr.Length, best = 0, i = 1;\n    while (i < n - 1)\n    {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) { i++; continue; }\n        int l = i - 1;\n        while (l > 0 && arr[l - 1] < arr[l]) l--;\n        int r = i + 1;\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++;\n        if (r - l + 1 > best) best = r - l + 1;\n        i = r;\n    }\n    return best;\n}`,
        go: `func longestMountain(arr []int) int {\n\tn := len(arr)\n\tbest := 0\n\ti := 1\n\tfor i < n-1 {\n\t\tif !(arr[i-1] < arr[i] && arr[i] > arr[i+1]) {\n\t\t\ti++\n\t\t\tcontinue\n\t\t}\n\t\tl := i - 1\n\t\tfor l > 0 && arr[l-1] < arr[l] {\n\t\t\tl--\n\t\t}\n\t\tr := i + 1\n\t\tfor r < n-1 && arr[r] > arr[r+1] {\n\t\t\tr++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t\ti = r\n\t}\n\treturn best\n}`,
        kotlin: `fun longestMountain(arr: IntArray): Int {\n    val n = arr.size\n    var best = 0\n    var i = 1\n    while (i < n - 1) {\n        if (!(arr[i - 1] < arr[i] && arr[i] > arr[i + 1])) {\n            i++\n            continue\n        }\n        var l = i - 1\n        while (l > 0 && arr[l - 1] < arr[l]) l--\n        var r = i + 1\n        while (r < n - 1 && arr[r] > arr[r + 1]) r++\n        if (r - l + 1 > best) best = r - l + 1\n        i = r\n    }\n    return best\n}`,
        swift: `func longestMountain(_ arr: [Int]) -> Int {\n    let n = arr.count\n    var best = 0\n    var i = 1\n    while i < n - 1 {\n        if !(arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {\n            i += 1\n            continue\n        }\n        var l = i - 1\n        while l > 0 && arr[l - 1] < arr[l] { l -= 1 }\n        var r = i + 1\n        while r < n - 1 && arr[r] > arr[r + 1] { r += 1 }\n        if r - l + 1 > best { best = r - l + 1 }\n        i = r\n    }\n    return best\n}`,
        rust: `fn longestMountain(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    let mut best = 0i32;\n    if n < 3 {\n        return 0;\n    }\n    let mut i = 1usize;\n    while i < n - 1 {\n        if !(arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {\n            i += 1;\n            continue;\n        }\n        let mut l = i - 1;\n        while l > 0 && arr[l - 1] < arr[l] {\n            l -= 1;\n        }\n        let mut r = i + 1;\n        while r < n - 1 && arr[r] > arr[r + 1] {\n            r += 1;\n        }\n        let len = (r - l + 1) as i32;\n        if len > best {\n            best = len;\n        }\n        i = r;\n    }\n    best\n}`,
        php: `function longestMountain($arr) {\n    $n = count($arr);\n    $best = 0;\n    $i = 1;\n    while ($i < $n - 1) {\n        if (!($arr[$i - 1] < $arr[$i] && $arr[$i] > $arr[$i + 1])) { $i++; continue; }\n        $l = $i - 1;\n        while ($l > 0 && $arr[$l - 1] < $arr[$l]) $l--;\n        $r = $i + 1;\n        while ($r < $n - 1 && $arr[$r] > $arr[$r + 1]) $r++;\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n        $i = $r;\n    }\n    return $best;\n}`,
        ruby: `def longestMountain(arr)\n  n = arr.length\n  best = 0\n  i = 1\n  while i < n - 1\n    unless arr[i - 1] < arr[i] && arr[i] > arr[i + 1]\n      i += 1\n      next\n    end\n    l = i - 1\n    l -= 1 while l > 0 && arr[l - 1] < arr[l]\n    r = i + 1\n    r += 1 while r < n - 1 && arr[r] > arr[r + 1]\n    best = r - l + 1 if r - l + 1 > best\n    i = r\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Push Dominoes (LC 838) ──────────────────────────────────────
  (() => {
    const ref = (dominoes: string) => {
      const s = "L" + dominoes + "R";
      const out: string[] = [];
      let prev = 0;
      for (let i = 1; i < s.length; i++) {
        if (s[i] === ".") continue;
        const gap = i - prev - 1;
        if (prev > 0) out.push(s[prev]);
        if (s[prev] === s[i]) {
          for (let t = 0; t < gap; t++) out.push(s[i]);
        } else if (s[prev] === "L" && s[i] === "R") {
          for (let t = 0; t < gap; t++) out.push(".");
        } else {
          const half = Math.floor(gap / 2);
          for (let t = 0; t < half; t++) out.push("R");
          if (gap % 2 === 1) out.push(".");
          for (let t = 0; t < half; t++) out.push("L");
        }
        prev = i;
      }
      return out.join("");
    };
    return {
      slug: "push-dominoes",
      title: "Push Dominoes",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers", "Dynamic Programming", "Simulation", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "pushDominoes", params: [{ name: "dominoes", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A row of dominoes is described by a string: `'L'` was pushed left, `'R'` was pushed right, and `'.'` is still standing.\n\nEach second, a falling domino pushes the adjacent standing one in the same direction. A standing domino with a falling domino on **both** sides stays upright, because the forces cancel.\n\nReturn the final state once nothing moves any more.",
        [
          { in: 'dominoes = "RR.L"', out: '"RR.L"', note: "The third domino is pushed left by the fourth; the second one was already down." },
          { in: 'dominoes = ".L.R...LR..L.."', out: '"LL.RR.LLRRLL.."', note: "In the run `R...L` the outer two meet in the middle and the exact centre stays standing." },
          { in: 'dominoes = "..."', out: '"..."', note: "Nothing was ever pushed." },
        ],
        ["1 <= dominoes.length <= 100000", "dominoes[i] is 'L', 'R' or '.'"]),
      hints: [
        "Every standing run is bounded by two pushed dominoes (or by the ends of the row).",
        "Pad the string with a virtual `'L'` on the left and `'R'` on the right so every run has two bounds.",
        "The four bound pairs behave differently: `L…L` all fall left, `R…R` all fall right, `L…R` nothing moves, `R…L` meets in the middle.",
      ],
      editorial: explain({
        idea: "The outcome of each maximal run of dots depends only on the two non-dot characters bounding it. Padding the row with a leftward push on the far left and a rightward push on the far right makes every run bounded, and then each of the four cases has a closed form.",
        steps: [
          "Form `s = \"L\" + dominoes + \"R\"`; the sentinels push away from the row, so they never disturb it.",
          "Walk `i` over the non-dot positions, keeping `prev` as the previous one.",
          "Emit `s[prev]` (unless it is the left sentinel) followed by the `gap = i - prev - 1` dots resolved by case: same characters fill with that character, `L…R` stays all dots, `R…L` fills half `R`, half `L`, with a single `.` in the middle when the gap is odd.",
        ],
        why: "Forces only travel along a run of standing dominoes, so a run's fate is decided by its two ends. With `R…L` the two waves advance at the same rate and meet after `gap/2` steps: an odd gap leaves a domino pushed equally from both sides, which the rules say stays up. The sentinels encode the true boundary behaviour — a leading `…L` really does drag everything before it down, and a trailing `R…` really does push everything after it.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Simulating second by second is `O(n²)` on a long row of dots.",
          "Forgetting the sentinels loses the leading and trailing runs.",
          "With an odd gap in `R…L`, the centre domino stays `'.'` — it is not pushed either way.",
        ],
      }),
      examples: [
        { input: '"RR.L"', expectedOutput: "RR.L" },
        { input: '".L.R...LR..L.."', expectedOutput: "LL.RR.LLRRLL.." },
        { input: '"..."', expectedOutput: "..." },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const dominoes = Array.from({ length: n }, () => (rng() < 0.6 ? "." : pick(rng, ["L", "R"]))).join("");
        return { input: `"${dominoes}"`, expectedOutput: ref(dominoes) };
      },
      solutions: {
        python: `def pushDominoes(dominoes: str) -> str:\n    s = "L" + dominoes + "R"\n    out = []\n    prev = 0\n    for i in range(1, len(s)):\n        if s[i] == ".":\n            continue\n        gap = i - prev - 1\n        if prev > 0:\n            out.append(s[prev])\n        if s[prev] == s[i]:\n            out.append(s[i] * gap)\n        elif s[prev] == "L" and s[i] == "R":\n            out.append("." * gap)\n        else:\n            out.append("R" * (gap // 2))\n            if gap % 2 == 1:\n                out.append(".")\n            out.append("L" * (gap // 2))\n        prev = i\n    return "".join(out)`,
        javascript: `var pushDominoes = function(dominoes) {\n    var s = "L" + dominoes + "R";\n    var out = [];\n    var prev = 0;\n    for (var i = 1; i < s.length; i++) {\n        if (s.charAt(i) === ".") continue;\n        var gap = i - prev - 1;\n        if (prev > 0) out.push(s.charAt(prev));\n        var t;\n        if (s.charAt(prev) === s.charAt(i)) {\n            for (t = 0; t < gap; t++) out.push(s.charAt(i));\n        } else if (s.charAt(prev) === "L" && s.charAt(i) === "R") {\n            for (t = 0; t < gap; t++) out.push(".");\n        } else {\n            var half = Math.floor(gap / 2);\n            for (t = 0; t < half; t++) out.push("R");\n            if (gap % 2 === 1) out.push(".");\n            for (t = 0; t < half; t++) out.push("L");\n        }\n        prev = i;\n    }\n    return out.join("");\n};`,
        typescript: `function pushDominoes(dominoes: string): string {\n    var s = "L" + dominoes + "R";\n    var out: string[] = [];\n    var prev = 0;\n    for (var i = 1; i < s.length; i++) {\n        if (s.charAt(i) === ".") continue;\n        var gap = i - prev - 1;\n        if (prev > 0) out.push(s.charAt(prev));\n        var t: number;\n        if (s.charAt(prev) === s.charAt(i)) {\n            for (t = 0; t < gap; t++) out.push(s.charAt(i));\n        } else if (s.charAt(prev) === "L" && s.charAt(i) === "R") {\n            for (t = 0; t < gap; t++) out.push(".");\n        } else {\n            var half = Math.floor(gap / 2);\n            for (t = 0; t < half; t++) out.push("R");\n            if (gap % 2 === 1) out.push(".");\n            for (t = 0; t < half; t++) out.push("L");\n        }\n        prev = i;\n    }\n    return out.join("");\n}`,
        java: `public static String pushDominoes(String dominoes) {\n    String s = "L" + dominoes + "R";\n    StringBuilder out = new StringBuilder();\n    int prev = 0;\n    for (int i = 1; i < s.length(); i++) {\n        if (s.charAt(i) == '.') continue;\n        int gap = i - prev - 1;\n        if (prev > 0) out.append(s.charAt(prev));\n        int t;\n        if (s.charAt(prev) == s.charAt(i)) {\n            for (t = 0; t < gap; t++) out.append(s.charAt(i));\n        } else if (s.charAt(prev) == 'L' && s.charAt(i) == 'R') {\n            for (t = 0; t < gap; t++) out.append('.');\n        } else {\n            for (t = 0; t < gap / 2; t++) out.append('R');\n            if (gap % 2 == 1) out.append('.');\n            for (t = 0; t < gap / 2; t++) out.append('L');\n        }\n        prev = i;\n    }\n    return out.toString();\n}`,
        cpp: `string pushDominoes(string dominoes) {\n    string s = "L" + dominoes + "R";\n    string out;\n    int prev = 0;\n    for (int i = 1; i < (int) s.size(); i++) {\n        if (s[i] == '.') continue;\n        int gap = i - prev - 1;\n        if (prev > 0) out += s[prev];\n        if (s[prev] == s[i]) {\n            out.append((size_t) gap, s[i]);\n        } else if (s[prev] == 'L' && s[i] == 'R') {\n            out.append((size_t) gap, '.');\n        } else {\n            out.append((size_t) (gap / 2), 'R');\n            if (gap % 2 == 1) out += '.';\n            out.append((size_t) (gap / 2), 'L');\n        }\n        prev = i;\n    }\n    return out;\n}`,
        c: `char* pushDominoes(char* dominoes) {\n    int n = (int) strlen(dominoes);\n    char* s = (char*) malloc((size_t) n + 3);\n    s[0] = 'L';\n    for (int i = 0; i < n; i++) s[i + 1] = dominoes[i];\n    s[n + 1] = 'R';\n    s[n + 2] = 0;\n    char* out = (char*) malloc((size_t) n + 1);\n    int m = 0, prev = 0;\n    for (int i = 1; i <= n + 1; i++) {\n        if (s[i] == '.') continue;\n        int gap = i - prev - 1, t;\n        if (prev > 0) out[m++] = s[prev];\n        if (s[prev] == s[i]) {\n            for (t = 0; t < gap; t++) out[m++] = s[i];\n        } else if (s[prev] == 'L' && s[i] == 'R') {\n            for (t = 0; t < gap; t++) out[m++] = '.';\n        } else {\n            for (t = 0; t < gap / 2; t++) out[m++] = 'R';\n            if (gap % 2 == 1) out[m++] = '.';\n            for (t = 0; t < gap / 2; t++) out[m++] = 'L';\n        }\n        prev = i;\n    }\n    out[m] = 0;\n    free(s);\n    return out;\n}`,
        csharp: `public static string PushDominoes(string dominoes)\n{\n    string s = "L" + dominoes + "R";\n    var out_ = new System.Text.StringBuilder();\n    int prev = 0;\n    for (int i = 1; i < s.Length; i++)\n    {\n        if (s[i] == '.') continue;\n        int gap = i - prev - 1;\n        if (prev > 0) out_.Append(s[prev]);\n        int t;\n        if (s[prev] == s[i])\n        {\n            for (t = 0; t < gap; t++) out_.Append(s[i]);\n        }\n        else if (s[prev] == 'L' && s[i] == 'R')\n        {\n            for (t = 0; t < gap; t++) out_.Append('.');\n        }\n        else\n        {\n            for (t = 0; t < gap / 2; t++) out_.Append('R');\n            if (gap % 2 == 1) out_.Append('.');\n            for (t = 0; t < gap / 2; t++) out_.Append('L');\n        }\n        prev = i;\n    }\n    return out_.ToString();\n}`,
        go: `func pushDominoes(dominoes string) string {\n\ts := "L" + dominoes + "R"\n\tout := make([]byte, 0, len(dominoes))\n\tprev := 0\n\tfor i := 1; i < len(s); i++ {\n\t\tif s[i] == '.' {\n\t\t\tcontinue\n\t\t}\n\t\tgap := i - prev - 1\n\t\tif prev > 0 {\n\t\t\tout = append(out, s[prev])\n\t\t}\n\t\tif s[prev] == s[i] {\n\t\t\tfor t := 0; t < gap; t++ {\n\t\t\t\tout = append(out, s[i])\n\t\t\t}\n\t\t} else if s[prev] == 'L' && s[i] == 'R' {\n\t\t\tfor t := 0; t < gap; t++ {\n\t\t\t\tout = append(out, '.')\n\t\t\t}\n\t\t} else {\n\t\t\tfor t := 0; t < gap/2; t++ {\n\t\t\t\tout = append(out, 'R')\n\t\t\t}\n\t\t\tif gap%2 == 1 {\n\t\t\t\tout = append(out, '.')\n\t\t\t}\n\t\t\tfor t := 0; t < gap/2; t++ {\n\t\t\t\tout = append(out, 'L')\n\t\t\t}\n\t\t}\n\t\tprev = i\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun pushDominoes(dominoes: String): String {\n    val s = "L" + dominoes + "R"\n    val out = StringBuilder()\n    var prev = 0\n    for (i in 1 until s.length) {\n        if (s[i] == '.') continue\n        val gap = i - prev - 1\n        if (prev > 0) out.append(s[prev])\n        if (s[prev] == s[i]) {\n            for (t in 0 until gap) out.append(s[i])\n        } else if (s[prev] == 'L' && s[i] == 'R') {\n            for (t in 0 until gap) out.append('.')\n        } else {\n            for (t in 0 until gap / 2) out.append('R')\n            if (gap % 2 == 1) out.append('.')\n            for (t in 0 until gap / 2) out.append('L')\n        }\n        prev = i\n    }\n    return out.toString()\n}`,
        swift: `func pushDominoes(_ dominoes: String) -> String {\n    let s = Array("L" + dominoes + "R")\n    var out = ""\n    var prev = 0\n    for i in 1..<s.count {\n        if s[i] == "." { continue }\n        let gap = i - prev - 1\n        if prev > 0 { out.append(s[prev]) }\n        if s[prev] == s[i] {\n            out += String(repeating: String(s[i]), count: gap)\n        } else if s[prev] == "L" && s[i] == "R" {\n            out += String(repeating: ".", count: gap)\n        } else {\n            out += String(repeating: "R", count: gap / 2)\n            if gap % 2 == 1 { out += "." }\n            out += String(repeating: "L", count: gap / 2)\n        }\n        prev = i\n    }\n    return out\n}`,
        rust: `fn pushDominoes(dominoes: String) -> String {\n    let s: Vec<u8> = format!("L{}R", dominoes).into_bytes();\n    let mut out = String::new();\n    let mut prev = 0usize;\n    for i in 1..s.len() {\n        if s[i] == b'.' {\n            continue;\n        }\n        let gap = i - prev - 1;\n        if prev > 0 {\n            out.push(s[prev] as char);\n        }\n        if s[prev] == s[i] {\n            for _ in 0..gap {\n                out.push(s[i] as char);\n            }\n        } else if s[prev] == b'L' && s[i] == b'R' {\n            for _ in 0..gap {\n                out.push('.');\n            }\n        } else {\n            for _ in 0..(gap / 2) {\n                out.push('R');\n            }\n            if gap % 2 == 1 {\n                out.push('.');\n            }\n            for _ in 0..(gap / 2) {\n                out.push('L');\n            }\n        }\n        prev = i;\n    }\n    out\n}`,
        php: `function pushDominoes($dominoes) {\n    $s = "L" . $dominoes . "R";\n    $out = "";\n    $prev = 0;\n    for ($i = 1; $i < strlen($s); $i++) {\n        if ($s[$i] === ".") continue;\n        $gap = $i - $prev - 1;\n        if ($prev > 0) $out .= $s[$prev];\n        if ($s[$prev] === $s[$i]) {\n            $out .= str_repeat($s[$i], $gap);\n        } elseif ($s[$prev] === "L" && $s[$i] === "R") {\n            $out .= str_repeat(".", $gap);\n        } else {\n            $out .= str_repeat("R", intdiv($gap, 2));\n            if ($gap % 2 === 1) $out .= ".";\n            $out .= str_repeat("L", intdiv($gap, 2));\n        }\n        $prev = $i;\n    }\n    return $out;\n}`,
        ruby: `def pushDominoes(dominoes)\n  s = "L" + dominoes + "R"\n  out = ""\n  prev = 0\n  (1...s.length).each do |i|\n    next if s[i] == "."\n    gap = i - prev - 1\n    out << s[prev] if prev > 0\n    if s[prev] == s[i]\n      out << s[i] * gap\n    elsif s[prev] == "L" && s[i] == "R"\n      out << "." * gap\n    else\n      out << "R" * (gap / 2)\n      out << "." if gap.odd?\n      out << "L" * (gap / 2)\n    end\n    prev = i\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Most Profit Assigning Work (LC 826) ─────────────────────────
  (() => {
    const ref = (difficulty: number[], profit: number[], worker: number[]) => {
      const jobs = difficulty.map((d, i) => [d, profit[i]]).sort((a, b) => a[0] - b[0]);
      const w = worker.slice().sort((a, b) => a - b);
      let total = 0, j = 0, best = 0;
      for (const cap of w) {
        while (j < jobs.length && jobs[j][0] <= cap) { if (jobs[j][1] > best) best = jobs[j][1]; j++; }
        total += best;
      }
      return total;
    };
    return {
      slug: "most-profit-assigning-work",
      title: "Most Profit Assigning Work",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google", "Zoho"],
      signature: { funcName: "maxProfitAssignment", params: [{ name: "difficulty", type: "int[]" as const }, { name: "profit", type: "int[]" as const }, { name: "worker", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Job `i` has difficulty `difficulty[i]` and pays `profit[i]`. Worker `j` can take any job whose difficulty is at most `worker[j]`.\n\nEach worker takes **at most one** job, but a job may be taken by any number of workers (or none). Return the maximum total profit.",
        [
          { in: "difficulty = [2,4,6,8,10], profit = [10,20,30,40,50], worker = [4,5,6,7]", out: "100", note: "The workers earn 20, 20, 30 and 30." },
          { in: "difficulty = [85,47,57], profit = [24,66,99], worker = [40,25,25]", out: "0", note: "No worker is strong enough for any job." },
          { in: "difficulty = [1,1,1], profit = [5,3,9], worker = [2]", out: "9", note: "The worker picks the best of the three equally easy jobs." },
        ],
        ["1 <= difficulty.length == profit.length <= 10000", "1 <= worker.length <= 10000", "1 <= difficulty[i], profit[i], worker[j] <= 100000"]),
      hints: [
        "Each worker independently wants the highest-paying job they can do — there is no competition for jobs.",
        "Sort the jobs by difficulty and the workers by strength, then sweep both together.",
        "Keep a running maximum of the profit among jobs already admitted; a stronger worker can only do more.",
      ],
      editorial: explain({
        idea: "Because a job can be taken any number of times, each worker's choice is independent: take the most profitable job within reach. Sorting both lists lets a single pointer accumulate the best profit reachable as the workers get stronger.",
        steps: [
          "Pair each difficulty with its profit and sort the pairs by difficulty.",
          "Sort the workers ascending.",
          "For each worker, advance the job pointer over every job they can do, keeping `best`, the maximum profit seen so far.",
          "Add `best` to the total.",
        ],
        why: "`best` is the maximum profit over all jobs of difficulty at most the current worker's strength, which is exactly what that worker can earn. Sorting the workers makes the set of reachable jobs grow monotonically, so the pointer never moves backwards and each job is admitted once.",
        time: "O(n log n + m log m)",
        space: "O(n)",
        pitfalls: [
          "A harder job is not necessarily better paid, so the maximum has to be carried forward rather than read off the last admitted job.",
          "Trying to assign each job to at most one worker is a different (matching) problem.",
          "The total reaches about `10^4 · 10^5 = 10^9`, which still fits `int` — but only just.",
        ],
      }),
      examples: [
        { input: "[2,4,6,8,10]\n[10,20,30,40,50]\n[4,5,6,7]", expectedOutput: "100" },
        { input: "[85,47,57]\n[24,66,99]\n[40,25,25]", expectedOutput: "0" },
        { input: "[1,1,1]\n[5,3,9]\n[2]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const hi = rng() < 0.6 ? 30 : 100000;
        const difficulty = Array.from({ length: n }, () => ri(rng, 1, hi));
        const profit = Array.from({ length: n }, () => ri(rng, 1, hi));
        const worker = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, hi));
        return { input: `${fmtIntArr(difficulty)}\n${fmtIntArr(profit)}\n${fmtIntArr(worker)}`, expectedOutput: String(ref(difficulty, profit, worker)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxProfitAssignment(difficulty: List[int], profit: List[int], worker: List[int]) -> int:\n    jobs = sorted(zip(difficulty, profit))\n    total = 0\n    j = 0\n    best = 0\n    for cap in sorted(worker):\n        while j < len(jobs) and jobs[j][0] <= cap:\n            best = max(best, jobs[j][1])\n            j += 1\n        total += best\n    return total`,
        javascript: `var maxProfitAssignment = function(difficulty, profit, worker) {\n    var jobs = [];\n    for (var i = 0; i < difficulty.length; i++) jobs.push([difficulty[i], profit[i]]);\n    jobs.sort(function(a, b) { return a[0] - b[0]; });\n    var w = worker.slice().sort(function(a, b) { return a - b; });\n    var total = 0, j = 0, best = 0;\n    for (var k = 0; k < w.length; k++) {\n        while (j < jobs.length && jobs[j][0] <= w[k]) {\n            if (jobs[j][1] > best) best = jobs[j][1];\n            j++;\n        }\n        total += best;\n    }\n    return total;\n};`,
        typescript: `function maxProfitAssignment(difficulty: number[], profit: number[], worker: number[]): number {\n    var jobs: number[][] = [];\n    for (var i = 0; i < difficulty.length; i++) jobs.push([difficulty[i], profit[i]]);\n    jobs.sort(function(a, b) { return a[0] - b[0]; });\n    var w = worker.slice().sort(function(a, b) { return a - b; });\n    var total = 0, j = 0, best = 0;\n    for (var k = 0; k < w.length; k++) {\n        while (j < jobs.length && jobs[j][0] <= w[k]) {\n            if (jobs[j][1] > best) best = jobs[j][1];\n            j++;\n        }\n        total += best;\n    }\n    return total;\n}`,
        java: `public static int maxProfitAssignment(int[] difficulty, int[] profit, int[] worker) {\n    int n = difficulty.length;\n    int[][] jobs = new int[n][2];\n    for (int i = 0; i < n; i++) {\n        jobs[i][0] = difficulty[i];\n        jobs[i][1] = profit[i];\n    }\n    Arrays.sort(jobs, (a, b) -> Integer.compare(a[0], b[0]));\n    int[] w = worker.clone();\n    Arrays.sort(w);\n    int total = 0, j = 0, best = 0;\n    for (int cap : w) {\n        while (j < n && jobs[j][0] <= cap) {\n            best = Math.max(best, jobs[j][1]);\n            j++;\n        }\n        total += best;\n    }\n    return total;\n}`,
        cpp: `int maxProfitAssignment(vector<int>& difficulty, vector<int>& profit, vector<int>& worker) {\n    int n = (int) difficulty.size();\n    vector<pair<int, int>> jobs(n);\n    for (int i = 0; i < n; i++) jobs[i] = make_pair(difficulty[i], profit[i]);\n    sort(jobs.begin(), jobs.end());\n    vector<int> w = worker;\n    sort(w.begin(), w.end());\n    int total = 0, j = 0, best = 0;\n    for (int cap : w) {\n        while (j < n && jobs[j].first <= cap) {\n            best = max(best, jobs[j].second);\n            j++;\n        }\n        total += best;\n    }\n    return total;\n}`,
        c: `static int cmpJobPair(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return (x[0] > y[0]) - (x[0] < y[0]);\n}\n\nstatic int cmpWorkerAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maxProfitAssignment(int* difficulty, int difficultySize, int* profit, int profitSize, int* worker, int workerSize) {\n    (void) profitSize;\n    int n = difficultySize;\n    int (*jobs)[2] = malloc((size_t) n * sizeof(*jobs));\n    for (int i = 0; i < n; i++) {\n        jobs[i][0] = difficulty[i];\n        jobs[i][1] = profit[i];\n    }\n    qsort(jobs, (size_t) n, sizeof(*jobs), cmpJobPair);\n    int* w = (int*) malloc((size_t) workerSize * sizeof(int));\n    for (int i = 0; i < workerSize; i++) w[i] = worker[i];\n    qsort(w, (size_t) workerSize, sizeof(int), cmpWorkerAsc);\n    int total = 0, j = 0, best = 0;\n    for (int k = 0; k < workerSize; k++) {\n        while (j < n && jobs[j][0] <= w[k]) {\n            if (jobs[j][1] > best) best = jobs[j][1];\n            j++;\n        }\n        total += best;\n    }\n    free(jobs);\n    free(w);\n    return total;\n}`,
        csharp: `public static int MaxProfitAssignment(int[] difficulty, int[] profit, int[] worker)\n{\n    int n = difficulty.Length;\n    var jobs = new int[n][];\n    for (int i = 0; i < n; i++) jobs[i] = new int[] { difficulty[i], profit[i] };\n    Array.Sort(jobs, (a, b) => a[0].CompareTo(b[0]));\n    int[] w = (int[]) worker.Clone();\n    Array.Sort(w);\n    int total = 0, j = 0, best = 0;\n    foreach (int cap in w)\n    {\n        while (j < n && jobs[j][0] <= cap)\n        {\n            if (jobs[j][1] > best) best = jobs[j][1];\n            j++;\n        }\n        total += best;\n    }\n    return total;\n}`,
        go: `func maxProfitAssignment(difficulty []int, profit []int, worker []int) int {\n\tn := len(difficulty)\n\tjobs := make([][2]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tjobs[i] = [2]int{difficulty[i], profit[i]}\n\t}\n\tsort.Slice(jobs, func(a, b int) bool { return jobs[a][0] < jobs[b][0] })\n\tw := append([]int{}, worker...)\n\tsort.Ints(w)\n\ttotal, j, best := 0, 0, 0\n\tfor _, cap := range w {\n\t\tfor j < n && jobs[j][0] <= cap {\n\t\t\tif jobs[j][1] > best {\n\t\t\t\tbest = jobs[j][1]\n\t\t\t}\n\t\t\tj++\n\t\t}\n\t\ttotal += best\n\t}\n\treturn total\n}`,
        kotlin: `fun maxProfitAssignment(difficulty: IntArray, profit: IntArray, worker: IntArray): Int {\n    val n = difficulty.size\n    val jobs = Array(n) { intArrayOf(difficulty[it], profit[it]) }\n    jobs.sortBy { it[0] }\n    val w = worker.sortedArray()\n    var total = 0\n    var j = 0\n    var best = 0\n    for (cap in w) {\n        while (j < n && jobs[j][0] <= cap) {\n            if (jobs[j][1] > best) best = jobs[j][1]\n            j++\n        }\n        total += best\n    }\n    return total\n}`,
        swift: `func maxProfitAssignment(_ difficulty: [Int], _ profit: [Int], _ worker: [Int]) -> Int {\n    let n = difficulty.count\n    var jobs = (0..<n).map { (difficulty[$0], profit[$0]) }\n    jobs.sort { $0.0 < $1.0 }\n    let w = worker.sorted()\n    var total = 0\n    var j = 0\n    var best = 0\n    for cap in w {\n        while j < n && jobs[j].0 <= cap {\n            if jobs[j].1 > best { best = jobs[j].1 }\n            j += 1\n        }\n        total += best\n    }\n    return total\n}`,
        rust: `fn maxProfitAssignment(difficulty: Vec<i32>, profit: Vec<i32>, worker: Vec<i32>) -> i32 {\n    let n = difficulty.len();\n    let mut jobs: Vec<(i32, i32)> = (0..n).map(|i| (difficulty[i], profit[i])).collect();\n    jobs.sort();\n    let mut w = worker.clone();\n    w.sort();\n    let mut total = 0i32;\n    let mut j = 0usize;\n    let mut best = 0i32;\n    for &cap in w.iter() {\n        while j < n && jobs[j].0 <= cap {\n            if jobs[j].1 > best {\n                best = jobs[j].1;\n            }\n            j += 1;\n        }\n        total += best;\n    }\n    total\n}`,
        php: `function maxProfitAssignment($difficulty, $profit, $worker) {\n    $n = count($difficulty);\n    $jobs = [];\n    for ($i = 0; $i < $n; $i++) $jobs[] = [$difficulty[$i], $profit[$i]];\n    usort($jobs, function($a, $b) { return $a[0] - $b[0]; });\n    $w = $worker;\n    sort($w);\n    $total = 0;\n    $j = 0;\n    $best = 0;\n    foreach ($w as $cap) {\n        while ($j < $n && $jobs[$j][0] <= $cap) {\n            if ($jobs[$j][1] > $best) $best = $jobs[$j][1];\n            $j++;\n        }\n        $total += $best;\n    }\n    return $total;\n}`,
        ruby: `def maxProfitAssignment(difficulty, profit, worker)\n  jobs = difficulty.each_with_index.map { |d, i| [d, profit[i]] }.sort_by { |p| p[0] }\n  total = 0\n  j = 0\n  best = 0\n  worker.sort.each do |cap|\n    while j < jobs.length && jobs[j][0] <= cap\n      best = jobs[j][1] if jobs[j][1] > best\n      j += 1\n    end\n    total += best\n  end\n  total\nend`,
      },
    };
  })(),

  // ── 3Sum With Multiplicity (LC 923) ─────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (arr: number[], target: number) => {
      const cnt = new Array(301).fill(0);
      for (const x of arr) cnt[x]++;
      let res = 0;
      for (let i = 0; i <= 300; i++) {
        for (let j = i; j <= 300; j++) {
          const k = target - i - j;
          if (k < j || k > 300) continue;
          if (cnt[i] === 0 || cnt[j] === 0 || cnt[k] === 0) continue;
          let ways: number;
          if (i === j && j === k) ways = (cnt[i] * (cnt[i] - 1) * (cnt[i] - 2)) / 6;
          else if (i === j) ways = ((cnt[i] * (cnt[i] - 1)) / 2) * cnt[k];
          else if (j === k) ways = cnt[i] * ((cnt[j] * (cnt[j] - 1)) / 2);
          else ways = cnt[i] * cnt[j] * cnt[k];
          res = (res + ways) % MOD;
        }
      }
      return res;
    };
    return {
      slug: "3sum-with-multiplicity",
      title: "3Sum With Multiplicity",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Counting", "Amazon", "Google", "Uber"],
      signature: { funcName: "threeSumMulti", params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the index triples `i < j < k` with `arr[i] + arr[j] + arr[k] == target`.\n\nBecause the count can be huge, return it modulo `10^9 + 7`.",
        [
          { in: "arr = [1,1,2,2,3,3,4,4,5,5], target = 8", out: "20", note: "The value patterns are (1,2,5), (1,3,4), (2,2,4) and (2,3,3)." },
          { in: "arr = [1,1,2,2,2,2], target = 5", out: "12", note: "Choosing one 1 and two 2s: 2 · C(4,2) = 12." },
          { in: "arr = [0,0,0], target = 0", out: "1" },
        ],
        ["3 <= arr.length <= 3000", "0 <= arr[i] <= 100", "0 <= target <= 300"]),
      hints: [
        "The values are tiny — at most 101 distinct ones — so count occurrences instead of scanning index triples.",
        "Enumerate value pairs `i <= j` and derive `k = target - i - j`; skip it unless `k >= j`.",
        "The three cases `i = j = k`, exactly two equal, and all distinct each have their own combination count.",
      ],
      editorial: explain({
        idea: "With only 101 possible values, counting by value collapses the `O(n³)` triple enumeration to a loop over value pairs. For each ordered value triple `i <= j <= k` the number of index triples is a small combinatorial formula over the occurrence counts.",
        steps: [
          "Tally `cnt[v]`, how often each value appears.",
          "For every `i <= j`, set `k = target - i - j` and skip unless `j <= k <= 300`.",
          "All three equal: `C(cnt[i], 3)`. Exactly `i = j`: `C(cnt[i], 2) · cnt[k]`. Exactly `j = k`: `cnt[i] · C(cnt[j], 2)`. All distinct: `cnt[i] · cnt[j] · cnt[k]`.",
          "Sum modulo `10^9 + 7`.",
        ],
        why: "Every index triple `i < j < k` has exactly one sorted value triple, and requiring `i <= j <= k` in the enumeration counts each value pattern once. Within a pattern, choosing which indices carry each value is a product of binomial coefficients — a combination when a value is used more than once, a plain count otherwise.",
        time: "O(n + V²) where V = 101",
        space: "O(V)",
        pitfalls: [
          "Enumerating unordered pairs without the `k >= j` guard counts each pattern several times.",
          "Using `cnt[i] · cnt[j] · cnt[k]` when two values coincide over-counts — the same index would be reused.",
          "The intermediate products reach about `3000³ / 6 ≈ 4.5 · 10^9`, so accumulate in 64-bit and reduce.",
        ],
      }),
      examples: [
        { input: "[1,1,2,2,3,3,4,4,5,5]\n8", expectedOutput: "20" },
        { input: "[1,1,2,2,2,2]\n5", expectedOutput: "12" },
        { input: "[0,0,0]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 6 : 100;
        const arr = Array.from({ length: ri(rng, 3, 60) }, () => ri(rng, 0, hi));
        const target = rng() < 0.6 ? ri(rng, 0, Math.min(300, hi * 3)) : ri(rng, 0, 300);
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: String(ref(arr, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef threeSumMulti(arr: List[int], target: int) -> int:\n    MOD = 1000000007\n    cnt = [0] * 301\n    for x in arr:\n        cnt[x] += 1\n    res = 0\n    for i in range(301):\n        for j in range(i, 301):\n            k = target - i - j\n            if k < j or k > 300:\n                continue\n            if cnt[i] == 0 or cnt[j] == 0 or cnt[k] == 0:\n                continue\n            if i == j == k:\n                ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) // 6\n            elif i == j:\n                ways = cnt[i] * (cnt[i] - 1) // 2 * cnt[k]\n            elif j == k:\n                ways = cnt[i] * (cnt[j] * (cnt[j] - 1) // 2)\n            else:\n                ways = cnt[i] * cnt[j] * cnt[k]\n            res = (res + ways) % MOD\n    return res`,
        javascript: `var threeSumMulti = function(arr, target) {\n    var MOD = 1000000007;\n    var cnt = [];\n    for (var t = 0; t <= 300; t++) cnt.push(0);\n    for (var a = 0; a < arr.length; a++) cnt[arr[a]]++;\n    var res = 0;\n    for (var i = 0; i <= 300; i++) {\n        if (cnt[i] === 0) continue;\n        for (var j = i; j <= 300; j++) {\n            if (cnt[j] === 0) continue;\n            var k = target - i - j;\n            if (k < j || k > 300 || cnt[k] === 0) continue;\n            var ways;\n            if (i === j && j === k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i === j) ways = (cnt[i] * (cnt[i] - 1) / 2) * cnt[k];\n            else if (j === k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return res;\n};`,
        typescript: `function threeSumMulti(arr: number[], target: number): number {\n    var MOD = 1000000007;\n    var cnt: number[] = [];\n    for (var t = 0; t <= 300; t++) cnt.push(0);\n    for (var a = 0; a < arr.length; a++) cnt[arr[a]]++;\n    var res = 0;\n    for (var i = 0; i <= 300; i++) {\n        if (cnt[i] === 0) continue;\n        for (var j = i; j <= 300; j++) {\n            if (cnt[j] === 0) continue;\n            var k = target - i - j;\n            if (k < j || k > 300 || cnt[k] === 0) continue;\n            var ways: number;\n            if (i === j && j === k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i === j) ways = (cnt[i] * (cnt[i] - 1) / 2) * cnt[k];\n            else if (j === k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return res;\n}`,
        java: `public static int threeSumMulti(int[] arr, int target) {\n    final long MOD = 1000000007L;\n    long[] cnt = new long[301];\n    for (int x : arr) cnt[x]++;\n    long res = 0;\n    for (int i = 0; i <= 300; i++) {\n        if (cnt[i] == 0) continue;\n        for (int j = i; j <= 300; j++) {\n            if (cnt[j] == 0) continue;\n            int k = target - i - j;\n            if (k < j || k > 300 || cnt[k] == 0) continue;\n            long ways;\n            if (i == j && j == k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i == j) ways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k];\n            else if (j == k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return (int) res;\n}`,
        cpp: `int threeSumMulti(vector<int>& arr, int target) {\n    const long long MOD = 1000000007LL;\n    vector<long long> cnt(301, 0);\n    for (int x : arr) cnt[x]++;\n    long long res = 0;\n    for (int i = 0; i <= 300; i++) {\n        if (cnt[i] == 0) continue;\n        for (int j = i; j <= 300; j++) {\n            if (cnt[j] == 0) continue;\n            int k = target - i - j;\n            if (k < j || k > 300 || cnt[k] == 0) continue;\n            long long ways;\n            if (i == j && j == k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i == j) ways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k];\n            else if (j == k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return (int) res;\n}`,
        c: `int threeSumMulti(int* arr, int arrSize, int target) {\n    const long long MOD = 1000000007LL;\n    long long cnt[301];\n    for (int t = 0; t <= 300; t++) cnt[t] = 0;\n    for (int a = 0; a < arrSize; a++) cnt[arr[a]]++;\n    long long res = 0;\n    for (int i = 0; i <= 300; i++) {\n        if (cnt[i] == 0) continue;\n        for (int j = i; j <= 300; j++) {\n            if (cnt[j] == 0) continue;\n            int k = target - i - j;\n            if (k < j || k > 300 || cnt[k] == 0) continue;\n            long long ways;\n            if (i == j && j == k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i == j) ways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k];\n            else if (j == k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return (int) res;\n}`,
        csharp: `public static int ThreeSumMulti(int[] arr, int target)\n{\n    const long MOD = 1000000007L;\n    long[] cnt = new long[301];\n    foreach (int x in arr) cnt[x]++;\n    long res = 0;\n    for (int i = 0; i <= 300; i++)\n    {\n        if (cnt[i] == 0) continue;\n        for (int j = i; j <= 300; j++)\n        {\n            if (cnt[j] == 0) continue;\n            int k = target - i - j;\n            if (k < j || k > 300 || cnt[k] == 0) continue;\n            long ways;\n            if (i == j && j == k) ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6;\n            else if (i == j) ways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k];\n            else if (j == k) ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2);\n            else ways = cnt[i] * cnt[j] * cnt[k];\n            res = (res + ways) % MOD;\n        }\n    }\n    return (int) res;\n}`,
        go: `func threeSumMulti(arr []int, target int) int {\n\tconst MOD = 1000000007\n\tcnt := make([]int64, 301)\n\tfor _, x := range arr {\n\t\tcnt[x]++\n\t}\n\tvar res int64 = 0\n\tfor i := 0; i <= 300; i++ {\n\t\tif cnt[i] == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tfor j := i; j <= 300; j++ {\n\t\t\tif cnt[j] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tk := target - i - j\n\t\t\tif k < j || k > 300 || cnt[k] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tvar ways int64\n\t\t\tif i == j && j == k {\n\t\t\t\tways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6\n\t\t\t} else if i == j {\n\t\t\t\tways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k]\n\t\t\t} else if j == k {\n\t\t\t\tways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2)\n\t\t\t} else {\n\t\t\t\tways = cnt[i] * cnt[j] * cnt[k]\n\t\t\t}\n\t\t\tres = (res + ways) % MOD\n\t\t}\n\t}\n\treturn int(res)\n}`,
        kotlin: `fun threeSumMulti(arr: IntArray, target: Int): Int {\n    val MOD = 1000000007L\n    val cnt = LongArray(301)\n    for (x in arr) cnt[x]++\n    var res = 0L\n    for (i in 0..300) {\n        if (cnt[i] == 0L) continue\n        for (j in i..300) {\n            if (cnt[j] == 0L) continue\n            val k = target - i - j\n            if (k < j || k > 300 || cnt[k] == 0L) continue\n            val ways: Long = when {\n                i == j && j == k -> cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6\n                i == j -> cnt[i] * (cnt[i] - 1) / 2 * cnt[k]\n                j == k -> cnt[i] * (cnt[j] * (cnt[j] - 1) / 2)\n                else -> cnt[i] * cnt[j] * cnt[k]\n            }\n            res = (res + ways) % MOD\n        }\n    }\n    return res.toInt()\n}`,
        swift: `func threeSumMulti(_ arr: [Int], _ target: Int) -> Int {\n    let MOD = 1000000007\n    var cnt = [Int](repeating: 0, count: 301)\n    for x in arr { cnt[x] += 1 }\n    var res = 0\n    for i in 0...300 {\n        if cnt[i] == 0 { continue }\n        for j in i...300 {\n            if cnt[j] == 0 { continue }\n            let k = target - i - j\n            if k < j || k > 300 || cnt[k] == 0 { continue }\n            var ways = 0\n            if i == j && j == k {\n                ways = cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6\n            } else if i == j {\n                ways = cnt[i] * (cnt[i] - 1) / 2 * cnt[k]\n            } else if j == k {\n                ways = cnt[i] * (cnt[j] * (cnt[j] - 1) / 2)\n            } else {\n                ways = cnt[i] * cnt[j] * cnt[k]\n            }\n            res = (res + ways) % MOD\n        }\n    }\n    return res\n}`,
        rust: `fn threeSumMulti(arr: Vec<i32>, target: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut cnt = vec![0i64; 301];\n    for &x in arr.iter() {\n        cnt[x as usize] += 1;\n    }\n    let mut res: i64 = 0;\n    for i in 0..=300i32 {\n        if cnt[i as usize] == 0 {\n            continue;\n        }\n        for j in i..=300i32 {\n            if cnt[j as usize] == 0 {\n                continue;\n            }\n            let k = target - i - j;\n            if k < j || k > 300 || cnt[k as usize] == 0 {\n                continue;\n            }\n            let (ci, cj, ck) = (cnt[i as usize], cnt[j as usize], cnt[k as usize]);\n            let ways: i64 = if i == j && j == k {\n                ci * (ci - 1) * (ci - 2) / 6\n            } else if i == j {\n                ci * (ci - 1) / 2 * ck\n            } else if j == k {\n                ci * (cj * (cj - 1) / 2)\n            } else {\n                ci * cj * ck\n            };\n            res = (res + ways) % MOD;\n        }\n    }\n    res as i32\n}`,
        php: `function threeSumMulti($arr, $target) {\n    $MOD = 1000000007;\n    $cnt = array_fill(0, 301, 0);\n    foreach ($arr as $x) $cnt[$x]++;\n    $res = 0;\n    for ($i = 0; $i <= 300; $i++) {\n        if ($cnt[$i] === 0) continue;\n        for ($j = $i; $j <= 300; $j++) {\n            if ($cnt[$j] === 0) continue;\n            $k = $target - $i - $j;\n            if ($k < $j || $k > 300 || $cnt[$k] === 0) continue;\n            if ($i === $j && $j === $k) $ways = intdiv($cnt[$i] * ($cnt[$i] - 1) * ($cnt[$i] - 2), 6);\n            elseif ($i === $j) $ways = intdiv($cnt[$i] * ($cnt[$i] - 1), 2) * $cnt[$k];\n            elseif ($j === $k) $ways = $cnt[$i] * intdiv($cnt[$j] * ($cnt[$j] - 1), 2);\n            else $ways = $cnt[$i] * $cnt[$j] * $cnt[$k];\n            $res = ($res + $ways) % $MOD;\n        }\n    }\n    return $res;\n}`,
        ruby: `def threeSumMulti(arr, target)\n  mod = 1000000007\n  cnt = Array.new(301, 0)\n  arr.each { |x| cnt[x] += 1 }\n  res = 0\n  (0..300).each do |i|\n    next if cnt[i] == 0\n    (i..300).each do |j|\n      next if cnt[j] == 0\n      k = target - i - j\n      next if k < j || k > 300 || cnt[k] == 0\n      ways = if i == j && j == k\n        cnt[i] * (cnt[i] - 1) * (cnt[i] - 2) / 6\n      elsif i == j\n        cnt[i] * (cnt[i] - 1) / 2 * cnt[k]\n      elsif j == k\n        cnt[i] * (cnt[j] * (cnt[j] - 1) / 2)\n      else\n        cnt[i] * cnt[j] * cnt[k]\n      end\n      res = (res + ways) % mod\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── The k Strongest Values in an Array (LC 1471) ────────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      const s = arr.slice().sort((a, b) => a - b);
      const m = s[Math.floor((s.length - 1) / 2)];
      const byStrength = arr.slice().sort((a, b) => {
        const da = Math.abs(a - m), db = Math.abs(b - m);
        if (da !== db) return db - da;
        return b - a;
      });
      return byStrength.slice(0, k);
    };
    return {
      slug: "the-k-strongest-values-in-an-array",
      title: "The k Strongest Values in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "getStrongest", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Let `m` be the median of `arr`, defined as the element at index `(n - 1) / 2` after sorting (integer division).\n\nA value `a` is **stronger** than `b` when `|a - m| > |b - m|`, or when the two distances tie and `a > b`.\n\nReturn the `k` strongest values, ordered from strongest to weakest.",
        [
          { in: "arr = [1,2,3,4,5], k = 2", out: "[5,1]", note: "m = 3. Both 5 and 1 sit two away, and 5 > 1, so 5 comes first." },
          { in: "arr = [1,1,3,5,5], k = 2", out: "[5,5]", note: "m = 3, and the two 5s are the furthest." },
          { in: "arr = [6,7,11,7,6,8], k = 5", out: "[11,8,6,6,7]", note: "Sorted it is [6,6,7,7,8,11], so m = 7." },
        ],
        ["1 <= arr.length <= 100000", "-100000 <= arr[i] <= 100000", "1 <= k <= arr.length"]),
      hints: [
        "The median is not the average — it is the element at index `(n - 1) / 2` of the sorted array.",
        "Once `m` is known, strength is a total order on values, so a single sort by that comparator answers the question.",
        "Linear alternative: after sorting, the strongest values are always at one of the two ends, so two pointers peel them off.",
      ],
      editorial: explain({
        idea: "Strength depends only on the distance to the median, with ties broken by the value itself. Both parts are decided once `m` is known, so the whole thing reduces to a sort by a custom comparator — or, after the sort that finds `m`, a linear two-pointer peel from both ends.",
        steps: [
          "Sort a copy and read `m = sorted[(n - 1) / 2]`.",
          "Sort the values by `|v - m|` descending, breaking ties by `v` descending.",
          "Return the first `k`.",
        ],
        why: "The comparator is a strict weak ordering: distances are compared first, and equal distances are broken by value, which is itself a total order. Sorting therefore lists the values from strongest to weakest, and the first `k` are exactly the answer. The two-pointer variant works because on a sorted array the furthest value from `m` is always at one end.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Using the arithmetic mean, or index `n / 2`, gives the wrong median for even lengths.",
          "Comparing distances with `>=` instead of splitting the tie on value gets the order wrong when two values are equidistant.",
          "Distances reach `2 · 10^5`, so plain `int` is fine.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[5,1]" },
        { input: "[1,1,3,5,5]\n2", expectedOutput: "[5,5]" },
        { input: "[6,7,11,7,6,8]\n5", expectedOutput: "[11,8,6,6,7]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 100000;
        const n = ri(rng, 1, 30);
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: fmtIntArr(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getStrongest(arr: List[int], k: int) -> List[int]:\n    s = sorted(arr)\n    m = s[(len(s) - 1) // 2]\n    order = sorted(arr, key=lambda v: (-abs(v - m), -v))\n    return order[:k]`,
        javascript: `var getStrongest = function(arr, k) {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var m = s[Math.floor((s.length - 1) / 2)];\n    var order = arr.slice().sort(function(a, b) {\n        var da = Math.abs(a - m), db = Math.abs(b - m);\n        if (da !== db) return db - da;\n        return b - a;\n    });\n    return order.slice(0, k);\n};`,
        typescript: `function getStrongest(arr: number[], k: number): number[] {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var m = s[Math.floor((s.length - 1) / 2)];\n    var order = arr.slice().sort(function(a, b) {\n        var da = Math.abs(a - m), db = Math.abs(b - m);\n        if (da !== db) return db - da;\n        return b - a;\n    });\n    return order.slice(0, k);\n}`,
        java: `public static int[] getStrongest(int[] arr, int k) {\n    int n = arr.length;\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    final int m = s[(n - 1) / 2];\n    Integer[] order = new Integer[n];\n    for (int i = 0; i < n; i++) order[i] = arr[i];\n    Arrays.sort(order, (a, b) -> {\n        int da = Math.abs(a - m), db = Math.abs(b - m);\n        if (da != db) return Integer.compare(db, da);\n        return Integer.compare(b, a);\n    });\n    int[] res = new int[k];\n    for (int i = 0; i < k; i++) res[i] = order[i];\n    return res;\n}`,
        cpp: `vector<int> getStrongest(vector<int>& arr, int k) {\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    int m = s[(int) (s.size() - 1) / 2];\n    vector<int> order = arr;\n    sort(order.begin(), order.end(), [m](int a, int b) {\n        int da = abs(a - m), db = abs(b - m);\n        if (da != db) return da > db;\n        return a > b;\n    });\n    return vector<int>(order.begin(), order.begin() + k);\n}`,
        c: `static int strongestMedian;\n\nstatic int cmpStrongAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int cmpByStrength(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    int dx = x - strongestMedian, dy = y - strongestMedian;\n    if (dx < 0) dx = -dx;\n    if (dy < 0) dy = -dy;\n    if (dx != dy) return (dy > dx) - (dy < dx);\n    return (y > x) - (y < x);\n}\n\nint* getStrongest(int* arr, int arrSize, int k, int* returnSize) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, (size_t) arrSize, sizeof(int), cmpStrongAsc);\n    strongestMedian = s[(arrSize - 1) / 2];\n    int* order = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) order[i] = arr[i];\n    qsort(order, (size_t) arrSize, sizeof(int), cmpByStrength);\n    int* res = (int*) malloc((size_t) k * sizeof(int));\n    for (int i = 0; i < k; i++) res[i] = order[i];\n    free(s);\n    free(order);\n    *returnSize = k;\n    return res;\n}`,
        csharp: `public static int[] GetStrongest(int[] arr, int k)\n{\n    int n = arr.Length;\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    int m = s[(n - 1) / 2];\n    int[] order = (int[]) arr.Clone();\n    Array.Sort(order, (a, b) =>\n    {\n        int da = Math.Abs(a - m), db = Math.Abs(b - m);\n        if (da != db) return db.CompareTo(da);\n        return b.CompareTo(a);\n    });\n    int[] res = new int[k];\n    Array.Copy(order, res, k);\n    return res;\n}`,
        go: `func getStrongest(arr []int, k int) []int {\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\tm := s[(len(s)-1)/2]\n\tabsOf := func(x int) int {\n\t\tif x < 0 {\n\t\t\treturn -x\n\t\t}\n\t\treturn x\n\t}\n\torder := append([]int{}, arr...)\n\tsort.Slice(order, func(a, b int) bool {\n\t\tda, db := absOf(order[a]-m), absOf(order[b]-m)\n\t\tif da != db {\n\t\t\treturn da > db\n\t\t}\n\t\treturn order[a] > order[b]\n\t})\n\treturn order[:k]\n}`,
        kotlin: `fun getStrongest(arr: IntArray, k: Int): IntArray {\n    val s = arr.sortedArray()\n    val m = s[(s.size - 1) / 2]\n    val order = arr.toTypedArray()\n    order.sortWith(Comparator { a, b ->\n        val da = Math.abs(a - m)\n        val db = Math.abs(b - m)\n        if (da != db) db.compareTo(da) else b.compareTo(a)\n    })\n    return IntArray(k) { order[it] }\n}`,
        swift: `func getStrongest(_ arr: [Int], _ k: Int) -> [Int] {\n    let s = arr.sorted()\n    let m = s[(s.count - 1) / 2]\n    let order = arr.sorted { a, b in\n        let da = abs(a - m)\n        let db = abs(b - m)\n        if da != db { return da > db }\n        return a > b\n    }\n    return Array(order.prefix(k))\n}`,
        rust: `fn getStrongest(arr: Vec<i32>, k: i32) -> Vec<i32> {\n    let mut s = arr.clone();\n    s.sort();\n    let m = s[(s.len() - 1) / 2];\n    let mut order = arr.clone();\n    order.sort_by(|a, b| {\n        let da = (a - m).abs();\n        let db = (b - m).abs();\n        if da != db {\n            db.cmp(&da)\n        } else {\n            b.cmp(a)\n        }\n    });\n    order.truncate(k as usize);\n    order\n}`,
        php: `function getStrongest($arr, $k) {\n    $s = $arr;\n    sort($s);\n    $m = $s[intdiv(count($s) - 1, 2)];\n    $order = $arr;\n    usort($order, function($a, $b) use ($m) {\n        $da = abs($a - $m);\n        $db = abs($b - $m);\n        if ($da !== $db) return $db - $da;\n        return $b - $a;\n    });\n    return array_slice($order, 0, $k);\n}`,
        ruby: `def getStrongest(arr, k)\n  s = arr.sort\n  m = s[(s.length - 1) / 2]\n  order = arr.sort_by { |v| [-(v - m).abs, -v] }\n  order[0, k]\nend`,
      },
    };
  })(),

  // ── Number of Subsequences That Satisfy the Given Sum Condition (LC 1498) ──
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[], target: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      const n = s.length;
      const pow2 = new Array(n).fill(1);
      for (let i = 1; i < n; i++) pow2[i] = (pow2[i - 1] * 2) % MOD;
      let lo = 0, hi = n - 1, res = 0;
      while (lo <= hi) {
        if (s[lo] + s[hi] > target) hi--;
        else { res = (res + pow2[hi - lo]) % MOD; lo++; }
      }
      return res;
    };
    return {
      slug: "number-of-subsequences-that-satisfy-the-given-sum-condition",
      title: "Number of Subsequences That Satisfy the Given Sum Condition",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Binary Search", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "numSubseq", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the non-empty subsequences of `nums` whose **smallest** and **largest** elements add up to at most `target`.\n\nReturn the count modulo `10^9 + 7`.",
        [
          { in: "nums = [3,5,6,7], target = 9", out: "4", note: "[3], [3,5], [3,5,6] and [3,6] qualify." },
          { in: "nums = [3,3,6,8], target = 10", out: "6", note: "The two 3s are distinguishable by position." },
          { in: "nums = [2,3,3,4,6,7], target = 12", out: "61" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000", "1 <= target <= 1000000"]),
      hints: [
        "Only the minimum and the maximum of a subsequence matter, so the order of `nums` is irrelevant — sort it.",
        "Fix the smallest element; every larger element within the budget can be freely included or excluded.",
        "If `nums[lo]` pairs with everything up to `nums[hi]`, there are `2^(hi - lo)` subsequences with `nums[lo]` as the minimum.",
      ],
      editorial: explain({
        idea: "A subsequence is characterised by its min and max, which are unaffected by order — so sort. Then for a fixed minimum at index `lo`, the valid maxima form a prefix of the remaining elements, and every subset of the values strictly between them is allowed.",
        steps: [
          "Sort `nums` and precompute `2^i mod 10^9+7` for `i` up to `n`.",
          "Run `lo` from the left and `hi` from the right. While `nums[lo] + nums[hi] > target`, shrink `hi`.",
          "Otherwise every subsequence whose minimum is `nums[lo]` and whose other elements come from `lo+1 … hi` is valid — that is `2^(hi - lo)` of them. Add it and advance `lo`.",
        ],
        why: "After sorting, `nums[lo] + nums[hi] <= target` means every element in `lo+1 … hi` can join, because each is at most `nums[hi]`. The `2^(hi - lo)` subsets of that window, each with `nums[lo]` forced in, are exactly the subsequences with that minimum. Since `hi` only moves left as `lo` moves right, the sweep is linear.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Enumerating subsets is exponential — the powers of two are the whole trick.",
          "Computing `2^(hi-lo)` with repeated multiplication inside the loop makes it `O(n²)`; precompute the table.",
          "`lo <= hi`, not `lo < hi` — a single-element subsequence is valid when `2 · nums[lo] <= target`.",
        ],
      }),
      examples: [
        { input: "[3,5,6,7]\n9", expectedOutput: "4" },
        { input: "[3,3,6,8]\n10", expectedOutput: "6" },
        { input: "[2,3,3,4,6,7]\n12", expectedOutput: "61" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000;
        const nums = Array.from({ length: ri(rng, 1, 60) }, () => ri(rng, 1, hi));
        const target = ri(rng, 1, hi * 2);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numSubseq(nums: List[int], target: int) -> int:\n    MOD = 1000000007\n    s = sorted(nums)\n    n = len(s)\n    pow2 = [1] * n\n    for i in range(1, n):\n        pow2[i] = pow2[i - 1] * 2 % MOD\n    lo, hi, res = 0, n - 1, 0\n    while lo <= hi:\n        if s[lo] + s[hi] > target:\n            hi -= 1\n        else:\n            res = (res + pow2[hi - lo]) % MOD\n            lo += 1\n    return res`,
        javascript: `var numSubseq = function(nums, target) {\n    var MOD = 1000000007;\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var n = s.length;\n    var pow2 = [1];\n    for (var i = 1; i < n; i++) pow2.push(pow2[i - 1] * 2 % MOD);\n    var lo = 0, hi = n - 1, res = 0;\n    while (lo <= hi) {\n        if (s[lo] + s[hi] > target) hi--;\n        else { res = (res + pow2[hi - lo]) % MOD; lo++; }\n    }\n    return res;\n};`,
        typescript: `function numSubseq(nums: number[], target: number): number {\n    var MOD = 1000000007;\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var n = s.length;\n    var pow2: number[] = [1];\n    for (var i = 1; i < n; i++) pow2.push(pow2[i - 1] * 2 % MOD);\n    var lo = 0, hi = n - 1, res = 0;\n    while (lo <= hi) {\n        if (s[lo] + s[hi] > target) hi--;\n        else { res = (res + pow2[hi - lo]) % MOD; lo++; }\n    }\n    return res;\n}`,
        java: `public static int numSubseq(int[] nums, int target) {\n    final int MOD = 1000000007;\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int n = s.length;\n    long[] pow2 = new long[n];\n    pow2[0] = 1;\n    for (int i = 1; i < n; i++) pow2[i] = pow2[i - 1] * 2 % MOD;\n    int lo = 0, hi = n - 1;\n    long res = 0;\n    while (lo <= hi) {\n        if (s[lo] + s[hi] > target) hi--;\n        else {\n            res = (res + pow2[hi - lo]) % MOD;\n            lo++;\n        }\n    }\n    return (int) res;\n}`,
        cpp: `int numSubseq(vector<int>& nums, int target) {\n    const long long MOD = 1000000007LL;\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    vector<long long> pow2(n, 1);\n    for (int i = 1; i < n; i++) pow2[i] = pow2[i - 1] * 2 % MOD;\n    int lo = 0, hi = n - 1;\n    long long res = 0;\n    while (lo <= hi) {\n        if (s[lo] + s[hi] > target) hi--;\n        else {\n            res = (res + pow2[hi - lo]) % MOD;\n            lo++;\n        }\n    }\n    return (int) res;\n}`,
        c: `static int cmpSubseqAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint numSubseq(int* nums, int numsSize, int target) {\n    const long long MOD = 1000000007LL;\n    int n = numsSize;\n    int* s = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = nums[i];\n    qsort(s, (size_t) n, sizeof(int), cmpSubseqAsc);\n    long long* pow2 = (long long*) malloc((size_t) n * sizeof(long long));\n    pow2[0] = 1;\n    for (int i = 1; i < n; i++) pow2[i] = pow2[i - 1] * 2 % MOD;\n    int lo = 0, hi = n - 1;\n    long long res = 0;\n    while (lo <= hi) {\n        if ((long long) s[lo] + s[hi] > target) hi--;\n        else {\n            res = (res + pow2[hi - lo]) % MOD;\n            lo++;\n        }\n    }\n    free(s);\n    free(pow2);\n    return (int) res;\n}`,
        csharp: `public static int NumSubseq(int[] nums, int target)\n{\n    const long MOD = 1000000007L;\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int n = s.Length;\n    long[] pow2 = new long[n];\n    pow2[0] = 1;\n    for (int i = 1; i < n; i++) pow2[i] = pow2[i - 1] * 2 % MOD;\n    int lo = 0, hi = n - 1;\n    long res = 0;\n    while (lo <= hi)\n    {\n        if ((long) s[lo] + s[hi] > target) hi--;\n        else\n        {\n            res = (res + pow2[hi - lo]) % MOD;\n            lo++;\n        }\n    }\n    return (int) res;\n}`,
        go: `func numSubseq(nums []int, target int) int {\n\tconst MOD = 1000000007\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tn := len(s)\n\tpow2 := make([]int64, n)\n\tpow2[0] = 1\n\tfor i := 1; i < n; i++ {\n\t\tpow2[i] = pow2[i-1] * 2 % MOD\n\t}\n\tlo, hi := 0, n-1\n\tvar res int64 = 0\n\tfor lo <= hi {\n\t\tif s[lo]+s[hi] > target {\n\t\t\thi--\n\t\t} else {\n\t\t\tres = (res + pow2[hi-lo]) % MOD\n\t\t\tlo++\n\t\t}\n\t}\n\treturn int(res)\n}`,
        kotlin: `fun numSubseq(nums: IntArray, target: Int): Int {\n    val MOD = 1000000007L\n    val s = nums.sortedArray()\n    val n = s.size\n    val pow2 = LongArray(n)\n    pow2[0] = 1\n    for (i in 1 until n) pow2[i] = pow2[i - 1] * 2 % MOD\n    var lo = 0\n    var hi = n - 1\n    var res = 0L\n    while (lo <= hi) {\n        if (s[lo].toLong() + s[hi] > target) {\n            hi--\n        } else {\n            res = (res + pow2[hi - lo]) % MOD\n            lo++\n        }\n    }\n    return res.toInt()\n}`,
        swift: `func numSubseq(_ nums: [Int], _ target: Int) -> Int {\n    let MOD = 1000000007\n    let s = nums.sorted()\n    let n = s.count\n    var pow2 = [Int](repeating: 1, count: n)\n    for i in 1..<max(n, 1) where n > 1 {\n        pow2[i] = pow2[i - 1] * 2 % MOD\n    }\n    var lo = 0\n    var hi = n - 1\n    var res = 0\n    while lo <= hi {\n        if s[lo] + s[hi] > target {\n            hi -= 1\n        } else {\n            res = (res + pow2[hi - lo]) % MOD\n            lo += 1\n        }\n    }\n    return res\n}`,
        rust: `fn numSubseq(nums: Vec<i32>, target: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut s = nums.clone();\n    s.sort();\n    let n = s.len();\n    let mut pow2 = vec![1i64; n];\n    for i in 1..n {\n        pow2[i] = pow2[i - 1] * 2 % MOD;\n    }\n    let mut lo: i32 = 0;\n    let mut hi: i32 = n as i32 - 1;\n    let mut res: i64 = 0;\n    while lo <= hi {\n        if s[lo as usize] + s[hi as usize] > target {\n            hi -= 1;\n        } else {\n            res = (res + pow2[(hi - lo) as usize]) % MOD;\n            lo += 1;\n        }\n    }\n    res as i32\n}`,
        php: `function numSubseq($nums, $target) {\n    $MOD = 1000000007;\n    $s = $nums;\n    sort($s);\n    $n = count($s);\n    $pow2 = array_fill(0, $n, 1);\n    for ($i = 1; $i < $n; $i++) $pow2[$i] = $pow2[$i - 1] * 2 % $MOD;\n    $lo = 0;\n    $hi = $n - 1;\n    $res = 0;\n    while ($lo <= $hi) {\n        if ($s[$lo] + $s[$hi] > $target) {\n            $hi--;\n        } else {\n            $res = ($res + $pow2[$hi - $lo]) % $MOD;\n            $lo++;\n        }\n    }\n    return $res;\n}`,
        ruby: `def numSubseq(nums, target)\n  mod = 1000000007\n  s = nums.sort\n  n = s.length\n  pow2 = Array.new(n, 1)\n  (1...n).each { |i| pow2[i] = pow2[i - 1] * 2 % mod }\n  lo = 0\n  hi = n - 1\n  res = 0\n  while lo <= hi\n    if s[lo] + s[hi] > target\n      hi -= 1\n    else\n      res = (res + pow2[hi - lo]) % mod\n      lo += 1\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Watering Plants II (LC 2105) ────────────────────────────────
  (() => {
    const ref = (plants: number[], capacityA: number, capacityB: number) => {
      let i = 0, j = plants.length - 1, a = capacityA, b = capacityB, refills = 0;
      while (i < j) {
        if (a < plants[i]) { refills++; a = capacityA; }
        a -= plants[i]; i++;
        if (b < plants[j]) { refills++; b = capacityB; }
        b -= plants[j]; j--;
      }
      if (i === j && Math.max(a, b) < plants[i]) refills++;
      return refills;
    };
    return {
      slug: "watering-plants-ii",
      title: "Watering Plants II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Simulation", "Amazon", "Google", "Paytm"],
      signature: { funcName: "minimumRefill", params: [{ name: "plants", type: "int[]" as const }, { name: "capacityA", type: "int" as const }, { name: "capacityB", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A row of plants needs watering. Alice starts at the left end with a can holding `capacityA`, Bob starts at the right end with `capacityB`. They water simultaneously — Alice moves right, Bob moves left — and plant `i` needs exactly `plants[i]` units.\n\nBefore watering a plant, a gardener whose can holds less than the plant needs refills it completely (a refill is instantaneous). If both reach the same plant, the one with **more** water in the can waters it; on a tie Alice does.\n\nReturn the total number of refills.",
        [
          { in: "plants = [2,2,3,3], capacityA = 5, capacityB = 5", out: "1", note: "Alice waters 2 and 2 (1 left), Bob waters 3 then refills for the second 3." },
          { in: "plants = [2,2,3,3], capacityA = 3, capacityB = 4", out: "2" },
          { in: "plants = [5], capacityA = 10, capacityB = 8", out: "0", note: "Alice has more water and can cover the single plant." },
        ],
        ["1 <= plants.length <= 100000", "1 <= plants[i] <= 1000000", "max(plants[i]) <= capacityA, capacityB <= 1000000000"]),
      hints: [
        "Alice and Bob never interfere before they meet, so simulate both pointers in lockstep.",
        "A refill is forced exactly when the remaining water is less than what the next plant needs.",
        "The odd-length case leaves one plant for whoever holds more water.",
      ],
      editorial: explain({
        idea: "The two gardeners are independent until they meet, so a single loop advancing both pointers is a faithful simulation. Only the middle plant of an odd-length row needs the tie rule.",
        steps: [
          "Keep `i` at the left, `j` at the right, and the two current can levels.",
          "While `i < j`, water `plants[i]` with Alice and `plants[j]` with Bob, refilling first whenever the level is short.",
          "If the pointers land on the same plant, refill once when neither can covers it — the one with more water tries.",
        ],
        why: "Refilling only when short is optimal because a refill always restores the can to full, so doing it earlier can never help and always costs one more. The problem guarantees every capacity is at least the largest plant, so one refill is always enough.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Refilling when the level merely *equals* the plant's need wastes a refill — the comparison is strict.",
          "For the shared middle plant only `max(a, b)` matters; whoever it is, the count goes up by at most one.",
          "Capacities reach `10^9`, so the levels fit `int` but leave no headroom for intermediate sums.",
        ],
      }),
      examples: [
        { input: "[2,2,3,3]\n5\n5", expectedOutput: "1" },
        { input: "[2,2,3,3]\n3\n4", expectedOutput: "2" },
        { input: "[5]\n10\n8", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.6 ? 10 : 1000000;
        const plants = Array.from({ length: n }, () => ri(rng, 1, hi));
        const maxNeed = Math.max(...plants);
        const capacityA = ri(rng, maxNeed, Math.max(maxNeed, hi * 3));
        const capacityB = ri(rng, maxNeed, Math.max(maxNeed, hi * 3));
        return { input: `${fmtIntArr(plants)}\n${capacityA}\n${capacityB}`, expectedOutput: String(ref(plants, capacityA, capacityB)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumRefill(plants: List[int], capacityA: int, capacityB: int) -> int:\n    i, j = 0, len(plants) - 1\n    a, b = capacityA, capacityB\n    refills = 0\n    while i < j:\n        if a < plants[i]:\n            refills += 1\n            a = capacityA\n        a -= plants[i]\n        i += 1\n        if b < plants[j]:\n            refills += 1\n            b = capacityB\n        b -= plants[j]\n        j -= 1\n    if i == j and max(a, b) < plants[i]:\n        refills += 1\n    return refills`,
        javascript: `var minimumRefill = function(plants, capacityA, capacityB) {\n    var i = 0, j = plants.length - 1;\n    var a = capacityA, b = capacityB, refills = 0;\n    while (i < j) {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i === j && Math.max(a, b) < plants[i]) refills++;\n    return refills;\n};`,
        typescript: `function minimumRefill(plants: number[], capacityA: number, capacityB: number): number {\n    var i = 0, j = plants.length - 1;\n    var a = capacityA, b = capacityB, refills = 0;\n    while (i < j) {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i === j && Math.max(a, b) < plants[i]) refills++;\n    return refills;\n}`,
        java: `public static int minimumRefill(int[] plants, int capacityA, int capacityB) {\n    int i = 0, j = plants.length - 1;\n    int a = capacityA, b = capacityB, refills = 0;\n    while (i < j) {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i == j && Math.max(a, b) < plants[i]) refills++;\n    return refills;\n}`,
        cpp: `int minimumRefill(vector<int>& plants, int capacityA, int capacityB) {\n    int i = 0, j = (int) plants.size() - 1;\n    int a = capacityA, b = capacityB, refills = 0;\n    while (i < j) {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i == j && max(a, b) < plants[i]) refills++;\n    return refills;\n}`,
        c: `int minimumRefill(int* plants, int plantsSize, int capacityA, int capacityB) {\n    int i = 0, j = plantsSize - 1;\n    int a = capacityA, b = capacityB, refills = 0;\n    while (i < j) {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i == j) {\n        int more = a > b ? a : b;\n        if (more < plants[i]) refills++;\n    }\n    return refills;\n}`,
        csharp: `public static int MinimumRefill(int[] plants, int capacityA, int capacityB)\n{\n    int i = 0, j = plants.Length - 1;\n    int a = capacityA, b = capacityB, refills = 0;\n    while (i < j)\n    {\n        if (a < plants[i]) { refills++; a = capacityA; }\n        a -= plants[i]; i++;\n        if (b < plants[j]) { refills++; b = capacityB; }\n        b -= plants[j]; j--;\n    }\n    if (i == j && Math.Max(a, b) < plants[i]) refills++;\n    return refills;\n}`,
        go: `func minimumRefill(plants []int, capacityA int, capacityB int) int {\n\ti, j := 0, len(plants)-1\n\ta, b, refills := capacityA, capacityB, 0\n\tfor i < j {\n\t\tif a < plants[i] {\n\t\t\trefills++\n\t\t\ta = capacityA\n\t\t}\n\t\ta -= plants[i]\n\t\ti++\n\t\tif b < plants[j] {\n\t\t\trefills++\n\t\t\tb = capacityB\n\t\t}\n\t\tb -= plants[j]\n\t\tj--\n\t}\n\tif i == j {\n\t\tmore := a\n\t\tif b > more {\n\t\t\tmore = b\n\t\t}\n\t\tif more < plants[i] {\n\t\t\trefills++\n\t\t}\n\t}\n\treturn refills\n}`,
        kotlin: `fun minimumRefill(plants: IntArray, capacityA: Int, capacityB: Int): Int {\n    var i = 0\n    var j = plants.size - 1\n    var a = capacityA\n    var b = capacityB\n    var refills = 0\n    while (i < j) {\n        if (a < plants[i]) {\n            refills++\n            a = capacityA\n        }\n        a -= plants[i]\n        i++\n        if (b < plants[j]) {\n            refills++\n            b = capacityB\n        }\n        b -= plants[j]\n        j--\n    }\n    if (i == j && maxOf(a, b) < plants[i]) refills++\n    return refills\n}`,
        swift: `func minimumRefill(_ plants: [Int], _ capacityA: Int, _ capacityB: Int) -> Int {\n    var i = 0\n    var j = plants.count - 1\n    var a = capacityA\n    var b = capacityB\n    var refills = 0\n    while i < j {\n        if a < plants[i] {\n            refills += 1\n            a = capacityA\n        }\n        a -= plants[i]\n        i += 1\n        if b < plants[j] {\n            refills += 1\n            b = capacityB\n        }\n        b -= plants[j]\n        j -= 1\n    }\n    if i == j && max(a, b) < plants[i] { refills += 1 }\n    return refills\n}`,
        rust: `fn minimumRefill(plants: Vec<i32>, capacityA: i32, capacityB: i32) -> i32 {\n    let mut i: i32 = 0;\n    let mut j: i32 = plants.len() as i32 - 1;\n    let mut a = capacityA;\n    let mut b = capacityB;\n    let mut refills = 0i32;\n    while i < j {\n        if a < plants[i as usize] {\n            refills += 1;\n            a = capacityA;\n        }\n        a -= plants[i as usize];\n        i += 1;\n        if b < plants[j as usize] {\n            refills += 1;\n            b = capacityB;\n        }\n        b -= plants[j as usize];\n        j -= 1;\n    }\n    if i == j && a.max(b) < plants[i as usize] {\n        refills += 1;\n    }\n    refills\n}`,
        php: `function minimumRefill($plants, $capacityA, $capacityB) {\n    $i = 0;\n    $j = count($plants) - 1;\n    $a = $capacityA;\n    $b = $capacityB;\n    $refills = 0;\n    while ($i < $j) {\n        if ($a < $plants[$i]) { $refills++; $a = $capacityA; }\n        $a -= $plants[$i];\n        $i++;\n        if ($b < $plants[$j]) { $refills++; $b = $capacityB; }\n        $b -= $plants[$j];\n        $j--;\n    }\n    if ($i === $j && max($a, $b) < $plants[$i]) $refills++;\n    return $refills;\n}`,
        ruby: `def minimumRefill(plants, capacityA, capacityB)\n  i = 0\n  j = plants.length - 1\n  a = capacityA\n  b = capacityB\n  refills = 0\n  while i < j\n    if a < plants[i]\n      refills += 1\n      a = capacityA\n    end\n    a -= plants[i]\n    i += 1\n    if b < plants[j]\n      refills += 1\n      b = capacityB\n    end\n    b -= plants[j]\n    j -= 1\n  end\n  refills += 1 if i == j && [a, b].max < plants[i]\n  refills\nend`,
      },
    };
  })(),

  // ── Sentence Similarity III (LC 1813) ───────────────────────────
  (() => {
    const ref = (sentence1: string, sentence2: string) => {
      const w1 = sentence1.split(" ");
      const w2 = sentence2.split(" ");
      let a = w1, b = w2;
      if (a.length > b.length) { const t = a; a = b; b = t; }
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      let j = 0;
      while (j < a.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
      return i + j >= a.length;
    };
    return {
      slug: "sentence-similarity-iii",
      title: "Sentence Similarity III",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers", "Array", "Amazon", "Meta", "Wipro"],
      signature: { funcName: "areSentencesSimilar", params: [{ name: "sentence1", type: "string" as const }, { name: "sentence2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Two sentences are **similar** when one can be turned into the other by inserting a single (possibly empty) sentence at some word boundary — the start, the end, or between two words.\n\nA sentence is a sequence of words separated by single spaces, with no leading or trailing space.\n\nReturn whether `sentence1` and `sentence2` are similar.",
        [
          { in: 'sentence1 = "CodeKairo runs a daily kata", sentence2 = "CodeKairo kata"', out: "true", note: 'Inserting "runs a daily" after the first word of the shorter sentence gives the longer one.' },
          { in: 'sentence1 = "of", sentence2 = "A lot of words"', out: "false", note: '"of" sits in the middle, so it is neither a prefix nor a suffix.' },
          { in: 'sentence1 = "Solving right now", sentence2 = "Solving"', out: "true", note: "The shorter sentence is a prefix of the longer one." },
        ],
        ["1 <= sentence length <= 100", "Words contain only English letters.", "Words are separated by single spaces with no leading or trailing space."]),
      hints: [
        "Compare words, not characters — split both sentences first.",
        "Whatever is inserted is contiguous, so the shorter sentence must survive as a prefix plus a suffix of the longer one.",
        "Match from the front until the words differ, then from the back, and check the two runs together cover the shorter sentence.",
      ],
      editorial: explain({
        idea: "Inserting one contiguous block means the shorter word list appears in the longer one as a prefix followed by a suffix, with the insertion in between. Greedily matching as far as possible from each end settles it.",
        steps: [
          "Split both sentences on spaces and call the shorter list `a`, the longer `b`.",
          "Advance `i` while `a[i]` equals `b[i]`.",
          "Advance `j` while `a[|a|-1-j]` equals `b[|b|-1-j]`, stopping before the two runs overlap.",
          "They are similar exactly when `i + j >= |a|`.",
        ],
        why: "The prefix and suffix matches are independent and each is maximal, so if any split of `a` into a prefix and a suffix works, the greedy runs are at least as long. Capping `j` at `|a| - i` stops the same word being counted twice, which would wrongly accept a short sentence made of repeated words.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Character-level prefix/suffix matching accepts `\"CodeKairo\"` against `\"CodeKairos rank\"`, which is wrong — the insertion must land on a word boundary.",
          "Forgetting the `j < |a| - i` cap double-counts words when the sentences share repeats.",
          "Equal sentences are similar: the inserted sentence may be empty.",
        ],
      }),
      examples: [
        { input: '"CodeKairo runs a daily kata"\n"CodeKairo kata"', expectedOutput: "true" },
        { input: '"of"\n"A lot of words"', expectedOutput: "false" },
        { input: '"Solving right now"\n"Solving"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const vocab = ["CodeKairo", "kata", "duel", "rank", "solve", "fast", "a", "the", "daily"];
        const base = Array.from({ length: ri(rng, 1, 6) }, () => pick(rng, vocab));
        let other: string[];
        if (rng() < 0.55) {
          // Build a genuinely similar pair by splicing a block into `base`.
          const at = ri(rng, 0, base.length);
          const ins = Array.from({ length: ri(rng, 0, 4) }, () => pick(rng, vocab));
          other = base.slice(0, at).concat(ins, base.slice(at));
        } else {
          other = Array.from({ length: ri(rng, 1, 7) }, () => pick(rng, vocab));
        }
        const flip = rng() < 0.5;
        const s1 = (flip ? other : base).join(" ");
        const s2 = (flip ? base : other).join(" ");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: `def areSentencesSimilar(sentence1: str, sentence2: str) -> bool:\n    a = sentence1.split(" ")\n    b = sentence2.split(" ")\n    if len(a) > len(b):\n        a, b = b, a\n    i = 0\n    while i < len(a) and a[i] == b[i]:\n        i += 1\n    j = 0\n    while j < len(a) - i and a[len(a) - 1 - j] == b[len(b) - 1 - j]:\n        j += 1\n    return i + j >= len(a)`,
        javascript: `var areSentencesSimilar = function(sentence1, sentence2) {\n    var a = sentence1.split(" ");\n    var b = sentence2.split(" ");\n    if (a.length > b.length) { var t = a; a = b; b = t; }\n    var i = 0;\n    while (i < a.length && a[i] === b[i]) i++;\n    var j = 0;\n    while (j < a.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;\n    return i + j >= a.length;\n};`,
        typescript: `function areSentencesSimilar(sentence1: string, sentence2: string): boolean {\n    var a = sentence1.split(" ");\n    var b = sentence2.split(" ");\n    if (a.length > b.length) { var t = a; a = b; b = t; }\n    var i = 0;\n    while (i < a.length && a[i] === b[i]) i++;\n    var j = 0;\n    while (j < a.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;\n    return i + j >= a.length;\n}`,
        java: `public static boolean areSentencesSimilar(String sentence1, String sentence2) {\n    String[] a = sentence1.split(" ");\n    String[] b = sentence2.split(" ");\n    if (a.length > b.length) {\n        String[] t = a;\n        a = b;\n        b = t;\n    }\n    int i = 0;\n    while (i < a.length && a[i].equals(b[i])) i++;\n    int j = 0;\n    while (j < a.length - i && a[a.length - 1 - j].equals(b[b.length - 1 - j])) j++;\n    return i + j >= a.length;\n}`,
        cpp: `bool areSentencesSimilar(string sentence1, string sentence2) {\n    auto split = [](const string& s) {\n        vector<string> out;\n        string cur;\n        for (char ch : s) {\n            if (ch == ' ') { out.push_back(cur); cur.clear(); }\n            else cur += ch;\n        }\n        out.push_back(cur);\n        return out;\n    };\n    vector<string> a = split(sentence1), b = split(sentence2);\n    if (a.size() > b.size()) swap(a, b);\n    int na = (int) a.size(), nb = (int) b.size();\n    int i = 0;\n    while (i < na && a[i] == b[i]) i++;\n    int j = 0;\n    while (j < na - i && a[na - 1 - j] == b[nb - 1 - j]) j++;\n    return i + j >= na;\n}`,
        c: `bool areSentencesSimilar(char* sentence1, char* sentence2) {\n    char* copy1 = strdup(sentence1);\n    char* copy2 = strdup(sentence2);\n    char* wa[128];\n    char* wb[128];\n    int na = 0, nb = 0;\n    for (char* p = strtok(copy1, " "); p; p = strtok(NULL, " ")) wa[na++] = p;\n    for (char* p = strtok(copy2, " "); p; p = strtok(NULL, " ")) wb[nb++] = p;\n    char** a = wa;\n    char** b = wb;\n    if (na > nb) {\n        char** t = a; a = b; b = t;\n        int tn = na; na = nb; nb = tn;\n    }\n    int i = 0;\n    while (i < na && strcmp(a[i], b[i]) == 0) i++;\n    int j = 0;\n    while (j < na - i && strcmp(a[na - 1 - j], b[nb - 1 - j]) == 0) j++;\n    bool res = i + j >= na;\n    free(copy1);\n    free(copy2);\n    return res;\n}`,
        csharp: `public static bool AreSentencesSimilar(string sentence1, string sentence2)\n{\n    string[] a = sentence1.Split(' ');\n    string[] b = sentence2.Split(' ');\n    if (a.Length > b.Length)\n    {\n        string[] t = a;\n        a = b;\n        b = t;\n    }\n    int i = 0;\n    while (i < a.Length && a[i] == b[i]) i++;\n    int j = 0;\n    while (j < a.Length - i && a[a.Length - 1 - j] == b[b.Length - 1 - j]) j++;\n    return i + j >= a.Length;\n}`,
        go: `func areSentencesSimilar(sentence1 string, sentence2 string) bool {\n\ta := strings.Split(sentence1, " ")\n\tb := strings.Split(sentence2, " ")\n\tif len(a) > len(b) {\n\t\ta, b = b, a\n\t}\n\ti := 0\n\tfor i < len(a) && a[i] == b[i] {\n\t\ti++\n\t}\n\tj := 0\n\tfor j < len(a)-i && a[len(a)-1-j] == b[len(b)-1-j] {\n\t\tj++\n\t}\n\treturn i+j >= len(a)\n}`,
        kotlin: `fun areSentencesSimilar(sentence1: String, sentence2: String): Boolean {\n    var a = sentence1.split(" ")\n    var b = sentence2.split(" ")\n    if (a.size > b.size) {\n        val t = a\n        a = b\n        b = t\n    }\n    var i = 0\n    while (i < a.size && a[i] == b[i]) i++\n    var j = 0\n    while (j < a.size - i && a[a.size - 1 - j] == b[b.size - 1 - j]) j++\n    return i + j >= a.size\n}`,
        swift: `func areSentencesSimilar(_ sentence1: String, _ sentence2: String) -> Bool {\n    var a = sentence1.split(separator: " ").map(String.init)\n    var b = sentence2.split(separator: " ").map(String.init)\n    if a.count > b.count {\n        let t = a\n        a = b\n        b = t\n    }\n    var i = 0\n    while i < a.count && a[i] == b[i] { i += 1 }\n    var j = 0\n    while j < a.count - i && a[a.count - 1 - j] == b[b.count - 1 - j] { j += 1 }\n    return i + j >= a.count\n}`,
        rust: `fn areSentencesSimilar(sentence1: String, sentence2: String) -> bool {\n    let w1: Vec<&str> = sentence1.split(' ').collect();\n    let w2: Vec<&str> = sentence2.split(' ').collect();\n    let (a, b) = if w1.len() > w2.len() { (w2, w1) } else { (w1, w2) };\n    let mut i = 0usize;\n    while i < a.len() && a[i] == b[i] {\n        i += 1;\n    }\n    let mut j = 0usize;\n    while j < a.len() - i && a[a.len() - 1 - j] == b[b.len() - 1 - j] {\n        j += 1;\n    }\n    i + j >= a.len()\n}`,
        php: `function areSentencesSimilar($sentence1, $sentence2) {\n    $a = explode(" ", $sentence1);\n    $b = explode(" ", $sentence2);\n    if (count($a) > count($b)) {\n        $t = $a;\n        $a = $b;\n        $b = $t;\n    }\n    $na = count($a);\n    $nb = count($b);\n    $i = 0;\n    while ($i < $na && $a[$i] === $b[$i]) $i++;\n    $j = 0;\n    while ($j < $na - $i && $a[$na - 1 - $j] === $b[$nb - 1 - $j]) $j++;\n    return $i + $j >= $na;\n}`,
        ruby: `def areSentencesSimilar(sentence1, sentence2)\n  a = sentence1.split(" ")\n  b = sentence2.split(" ")\n  a, b = b, a if a.length > b.length\n  i = 0\n  i += 1 while i < a.length && a[i] == b[i]\n  j = 0\n  j += 1 while j < a.length - i && a[a.length - 1 - j] == b[b.length - 1 - j]\n  i + j >= a.length\nend`,
      },
    };
  })(),

  // ── Subarrays with K Different Integers (LC 992) ────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const atMost = (limit: number) => {
        if (limit < 0) return 0;
        const cnt: Record<number, number> = {};
        let distinct = 0, l = 0, res = 0;
        for (let r = 0; r < nums.length; r++) {
          const v = nums[r];
          cnt[v] = (cnt[v] || 0) + 1;
          if (cnt[v] === 1) distinct++;
          while (distinct > limit) {
            const u = nums[l];
            cnt[u]--;
            if (cnt[u] === 0) distinct--;
            l++;
          }
          res += r - l + 1;
        }
        return res;
      };
      return atMost(k) - atMost(k - 1);
    };
    return {
      slug: "subarrays-with-k-different-integers",
      title: "Subarrays with K Different Integers",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Two Pointers", "Counting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "subarraysWithKDistinct", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the subarrays of `nums` containing **exactly** `k` distinct integers.",
        [
          { in: "nums = [1,2,1,2,3], k = 2", out: "7", note: "[1,2], [2,1], [1,2], [2,3], [1,2,1], [2,1,2] and [1,2,1,2]." },
          { in: "nums = [1,2,1,3,4], k = 3", out: "3", note: "[1,2,1,3], [2,1,3] and [1,3,4]." },
          { in: "nums = [5,5,5], k = 1", out: "6", note: "Every subarray of a constant array has one distinct value." },
        ],
        ["1 <= nums.length <= 20000", "1 <= nums[i], k <= nums.length"]),
      hints: [
        "A window with *exactly* `k` distinct values is not monotone, so a single sliding window cannot count it directly.",
        "A window with *at most* `k` distinct values is monotone — shrinking it never raises the distinct count.",
        "exactly(k) = atMost(k) − atMost(k − 1).",
      ],
      editorial: explain({
        idea: "The 'exactly k' predicate is not monotone in the window's left edge, which breaks the usual two-pointer count. The 'at most k' predicate is, so count that twice and subtract.",
        steps: [
          "Write `atMost(limit)`: slide `r` over the array, tally the values, and shrink from `l` while more than `limit` distinct values are in the window.",
          "Each `r` contributes `r - l + 1` subarrays — every window ending at `r` and starting at or after `l`.",
          "Return `atMost(k) - atMost(k - 1)`.",
        ],
        why: "For a fixed right end, the set of valid left ends under 'at most `limit`' is a contiguous suffix, so `r - l + 1` counts them all in constant time and `l` never moves backwards. Every subarray with at most `k` distinct values either has exactly `k` or at most `k-1`, and the two cases are disjoint, so the subtraction isolates the exact count.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Trying to maintain 'exactly k' with one window undercounts — the valid left ends form a range, not a suffix.",
          "`atMost(0)` must be 0, not a crash, when `k = 1`.",
          "Decrementing the tally without dropping zero entries leaves the distinct count wrong.",
        ],
      }),
      examples: [
        { input: "[1,2,1,2,3]\n2", expectedOutput: "7" },
        { input: "[1,2,1,3,4]\n3", expectedOutput: "3" },
        { input: "[5,5,5]\n1", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const nums = Array.from({ length: n }, () => ri(rng, 1, n));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subarraysWithKDistinct(nums: List[int], k: int) -> int:\n    def at_most(limit: int) -> int:\n        if limit < 0:\n            return 0\n        cnt = {}\n        distinct = 0\n        l = 0\n        res = 0\n        for r, v in enumerate(nums):\n            cnt[v] = cnt.get(v, 0) + 1\n            if cnt[v] == 1:\n                distinct += 1\n            while distinct > limit:\n                u = nums[l]\n                cnt[u] -= 1\n                if cnt[u] == 0:\n                    distinct -= 1\n                l += 1\n            res += r - l + 1\n        return res\n\n    return at_most(k) - at_most(k - 1)`,
        javascript: `var subarraysWithKDistinct = function(nums, k) {\n    var atMost = function(limit) {\n        if (limit < 0) return 0;\n        var cnt = {};\n        var distinct = 0, l = 0, res = 0;\n        for (var r = 0; r < nums.length; r++) {\n            var v = nums[r];\n            cnt[v] = (cnt[v] || 0) + 1;\n            if (cnt[v] === 1) distinct++;\n            while (distinct > limit) {\n                var u = nums[l];\n                cnt[u]--;\n                if (cnt[u] === 0) distinct--;\n                l++;\n            }\n            res += r - l + 1;\n        }\n        return res;\n    };\n    return atMost(k) - atMost(k - 1);\n};`,
        typescript: `function subarraysWithKDistinct(nums: number[], k: number): number {\n    var atMost = function(limit: number): number {\n        if (limit < 0) return 0;\n        var cnt: { [key: number]: number } = {};\n        var distinct = 0, l = 0, res = 0;\n        for (var r = 0; r < nums.length; r++) {\n            var v = nums[r];\n            cnt[v] = (cnt[v] || 0) + 1;\n            if (cnt[v] === 1) distinct++;\n            while (distinct > limit) {\n                var u = nums[l];\n                cnt[u]--;\n                if (cnt[u] === 0) distinct--;\n                l++;\n            }\n            res += r - l + 1;\n        }\n        return res;\n    };\n    return atMost(k) - atMost(k - 1);\n}`,
        java: `private static int atMostKDistinct(int[] nums, int limit) {\n    if (limit < 0) return 0;\n    int[] cnt = new int[nums.length + 1];\n    int distinct = 0, l = 0, res = 0;\n    for (int r = 0; r < nums.length; r++) {\n        if (cnt[nums[r]]++ == 0) distinct++;\n        while (distinct > limit) {\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n        res += r - l + 1;\n    }\n    return res;\n}\n\npublic static int subarraysWithKDistinct(int[] nums, int k) {\n    return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);\n}`,
        cpp: `static int atMostKDistinct(vector<int>& nums, int limit) {\n    if (limit < 0) return 0;\n    vector<int> cnt(nums.size() + 1, 0);\n    int distinct = 0, l = 0, res = 0;\n    for (int r = 0; r < (int) nums.size(); r++) {\n        if (cnt[nums[r]]++ == 0) distinct++;\n        while (distinct > limit) {\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n        res += r - l + 1;\n    }\n    return res;\n}\n\nint subarraysWithKDistinct(vector<int>& nums, int k) {\n    return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);\n}`,
        c: `static int atMostKDistinct(int* nums, int numsSize, int limit) {\n    if (limit < 0) return 0;\n    int* cnt = (int*) calloc((size_t) numsSize + 1, sizeof(int));\n    int distinct = 0, l = 0, res = 0;\n    for (int r = 0; r < numsSize; r++) {\n        if (cnt[nums[r]]++ == 0) distinct++;\n        while (distinct > limit) {\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n        res += r - l + 1;\n    }\n    free(cnt);\n    return res;\n}\n\nint subarraysWithKDistinct(int* nums, int numsSize, int k) {\n    return atMostKDistinct(nums, numsSize, k) - atMostKDistinct(nums, numsSize, k - 1);\n}`,
        csharp: `private static int AtMostKDistinct(int[] nums, int limit)\n{\n    if (limit < 0) return 0;\n    int[] cnt = new int[nums.Length + 1];\n    int distinct = 0, l = 0, res = 0;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        if (cnt[nums[r]]++ == 0) distinct++;\n        while (distinct > limit)\n        {\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n        res += r - l + 1;\n    }\n    return res;\n}\n\npublic static int SubarraysWithKDistinct(int[] nums, int k)\n{\n    return AtMostKDistinct(nums, k) - AtMostKDistinct(nums, k - 1);\n}`,
        go: `func atMostKDistinct(nums []int, limit int) int {\n\tif limit < 0 {\n\t\treturn 0\n\t}\n\tcnt := make([]int, len(nums)+1)\n\tdistinct, l, res := 0, 0, 0\n\tfor r := 0; r < len(nums); r++ {\n\t\tif cnt[nums[r]] == 0 {\n\t\t\tdistinct++\n\t\t}\n\t\tcnt[nums[r]]++\n\t\tfor distinct > limit {\n\t\t\tcnt[nums[l]]--\n\t\t\tif cnt[nums[l]] == 0 {\n\t\t\t\tdistinct--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tres += r - l + 1\n\t}\n\treturn res\n}\n\nfunc subarraysWithKDistinct(nums []int, k int) int {\n\treturn atMostKDistinct(nums, k) - atMostKDistinct(nums, k-1)\n}`,
        kotlin: `private fun atMostKDistinct(nums: IntArray, limit: Int): Int {\n    if (limit < 0) return 0\n    val cnt = IntArray(nums.size + 1)\n    var distinct = 0\n    var l = 0\n    var res = 0\n    for (r in nums.indices) {\n        if (cnt[nums[r]] == 0) distinct++\n        cnt[nums[r]]++\n        while (distinct > limit) {\n            cnt[nums[l]]--\n            if (cnt[nums[l]] == 0) distinct--\n            l++\n        }\n        res += r - l + 1\n    }\n    return res\n}\n\nfun subarraysWithKDistinct(nums: IntArray, k: Int): Int {\n    return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1)\n}`,
        swift: `func subarraysWithKDistinct(_ nums: [Int], _ k: Int) -> Int {\n    func atMost(_ limit: Int) -> Int {\n        if limit < 0 { return 0 }\n        var cnt = [Int](repeating: 0, count: nums.count + 1)\n        var distinct = 0\n        var l = 0\n        var res = 0\n        for r in 0..<nums.count {\n            if cnt[nums[r]] == 0 { distinct += 1 }\n            cnt[nums[r]] += 1\n            while distinct > limit {\n                cnt[nums[l]] -= 1\n                if cnt[nums[l]] == 0 { distinct -= 1 }\n                l += 1\n            }\n            res += r - l + 1\n        }\n        return res\n    }\n    return atMost(k) - atMost(k - 1)\n}`,
        rust: `fn subarraysWithKDistinct(nums: Vec<i32>, k: i32) -> i32 {\n    fn at_most(nums: &Vec<i32>, limit: i32) -> i32 {\n        if limit < 0 {\n            return 0;\n        }\n        let mut cnt = vec![0i32; nums.len() + 1];\n        let mut distinct = 0i32;\n        let mut l = 0usize;\n        let mut res = 0i32;\n        for r in 0..nums.len() {\n            let v = nums[r] as usize;\n            if cnt[v] == 0 {\n                distinct += 1;\n            }\n            cnt[v] += 1;\n            while distinct > limit {\n                let u = nums[l] as usize;\n                cnt[u] -= 1;\n                if cnt[u] == 0 {\n                    distinct -= 1;\n                }\n                l += 1;\n            }\n            res += (r - l + 1) as i32;\n        }\n        res\n    }\n    at_most(&nums, k) - at_most(&nums, k - 1)\n}`,
        php: `function subarraysWithKDistinct($nums, $k) {\n    $atMost = function($limit) use ($nums) {\n        if ($limit < 0) return 0;\n        $cnt = array_fill(0, count($nums) + 1, 0);\n        $distinct = 0;\n        $l = 0;\n        $res = 0;\n        for ($r = 0; $r < count($nums); $r++) {\n            if ($cnt[$nums[$r]] === 0) $distinct++;\n            $cnt[$nums[$r]]++;\n            while ($distinct > $limit) {\n                $cnt[$nums[$l]]--;\n                if ($cnt[$nums[$l]] === 0) $distinct--;\n                $l++;\n            }\n            $res += $r - $l + 1;\n        }\n        return $res;\n    };\n    return $atMost($k) - $atMost($k - 1);\n}`,
        ruby: `def subarraysWithKDistinct(nums, k)\n  at_most = lambda do |limit|\n    next 0 if limit < 0\n    cnt = Hash.new(0)\n    distinct = 0\n    l = 0\n    res = 0\n    nums.each_with_index do |v, r|\n      cnt[v] += 1\n      distinct += 1 if cnt[v] == 1\n      while distinct > limit\n        u = nums[l]\n        cnt[u] -= 1\n        distinct -= 1 if cnt[u] == 0\n        l += 1\n      end\n      res += r - l + 1\n    end\n    res\n  end\n  at_most.call(k) - at_most.call(k - 1)\nend`,
      },
    };
  })(),

  // ── Find K-th Smallest Pair Distance (LC 719) ───────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      const countLE = (d: number) => {
        let cnt = 0, l = 0;
        for (let r = 0; r < s.length; r++) {
          while (s[r] - s[l] > d) l++;
          cnt += r - l;
        }
        return cnt;
      };
      let lo = 0, hi = s[s.length - 1] - s[0];
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "find-k-th-smallest-pair-distance",
      title: "Find K-th Smallest Pair Distance",
      difficulty: "HARD" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Sorting", "Amazon", "Google", "Apple"],
      signature: { funcName: "smallestDistancePair", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The distance of a pair `(a, b)` is `|a - b|`.\n\nGiven `nums`, return the `k`-th smallest distance among all `n · (n - 1) / 2` index pairs.",
        [
          { in: "nums = [1,3,1], k = 1", out: "0", note: "The three distances are 0, 2 and 2." },
          { in: "nums = [1,1,1], k = 2", out: "0" },
          { in: "nums = [1,6,1], k = 3", out: "5", note: "The distances are 0, 5 and 5." },
        ],
        ["2 <= nums.length <= 10000", "0 <= nums[i] <= 1000000", "1 <= k <= nums.length · (nums.length - 1) / 2"]),
      hints: [
        "Materialising every distance is `O(n²)` — too many to sort at the upper limit.",
        "Binary search the *answer*: for a candidate distance `d`, how many pairs are at most `d` apart?",
        "On a sorted array that count is a two-pointer sweep, and it is non-decreasing in `d`.",
      ],
      editorial: explain({
        idea: "Binary search over the distance rather than over the data. Counting pairs within a given distance is cheap on a sorted array, and the count is monotone in the distance, so the smallest distance whose count reaches `k` is the answer.",
        steps: [
          "Sort `nums`. The candidate distances lie in `[0, max - min]`.",
          "`countLE(d)`: slide `r` forward, advancing `l` while `s[r] - s[l] > d`; each `r` contributes `r - l` pairs.",
          "Binary search the smallest `d` with `countLE(d) >= k`.",
        ],
        why: "`countLE` is non-decreasing in `d`, so the predicate `countLE(d) >= k` flips exactly once — that boundary is the `k`-th smallest distance, because a distance is achieved by some pair precisely when the count strictly increases there. The sweep is linear: `l` only moves right, since a larger `s[r]` can only push the feasible start further along.",
        time: "O(n log n + n log M) where M is the value range",
        space: "O(n)",
        pitfalls: [
          "Binary searching on indices instead of on the distance value gets the monotonicity wrong.",
          "`cnt += r - l`, not `r - l + 1` — a value is not paired with itself.",
          "The count reaches about `5 · 10^7`, which fits `int` but overflows a 16-bit accumulator.",
        ],
      }),
      examples: [
        { input: "[1,3,1]\n1", expectedOutput: "0" },
        { input: "[1,1,1]\n2", expectedOutput: "0" },
        { input: "[1,6,1]\n3", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 15 : 1000000;
        const n = ri(rng, 2, 40);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const k = ri(rng, 1, (n * (n - 1)) / 2);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef smallestDistancePair(nums: List[int], k: int) -> int:\n    s = sorted(nums)\n\n    def count_le(d: int) -> int:\n        cnt = 0\n        l = 0\n        for r in range(len(s)):\n            while s[r] - s[l] > d:\n                l += 1\n            cnt += r - l\n        return cnt\n\n    lo, hi = 0, s[-1] - s[0]\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if count_le(mid) >= k:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var smallestDistancePair = function(nums, k) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var countLE = function(d) {\n        var cnt = 0, l = 0;\n        for (var r = 0; r < s.length; r++) {\n            while (s[r] - s[l] > d) l++;\n            cnt += r - l;\n        }\n        return cnt;\n    };\n    var lo = 0, hi = s[s.length - 1] - s[0];\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function smallestDistancePair(nums: number[], k: number): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var countLE = function(d: number): number {\n        var cnt = 0, l = 0;\n        for (var r = 0; r < s.length; r++) {\n            while (s[r] - s[l] > d) l++;\n            cnt += r - l;\n        }\n        return cnt;\n    };\n    var lo = 0, hi = s[s.length - 1] - s[0];\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `public static int smallestDistancePair(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int lo = 0, hi = s[s.length - 1] - s[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int cnt = 0, l = 0;\n        for (int r = 0; r < s.length; r++) {\n            while (s[r] - s[l] > mid) l++;\n            cnt += r - l;\n        }\n        if (cnt >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `int smallestDistancePair(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    int lo = 0, hi = s[n - 1] - s[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int cnt = 0, l = 0;\n        for (int r = 0; r < n; r++) {\n            while (s[r] - s[l] > mid) l++;\n            cnt += r - l;\n        }\n        if (cnt >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int cmpDistAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint smallestDistancePair(int* nums, int numsSize, int k) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpDistAsc);\n    int lo = 0, hi = s[numsSize - 1] - s[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int cnt = 0, l = 0;\n        for (int r = 0; r < numsSize; r++) {\n            while (s[r] - s[l] > mid) l++;\n            cnt += r - l;\n        }\n        if (cnt >= k) hi = mid; else lo = mid + 1;\n    }\n    free(s);\n    return lo;\n}`,
        csharp: `public static int SmallestDistancePair(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int n = s.Length;\n    int lo = 0, hi = s[n - 1] - s[0];\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        int cnt = 0, l = 0;\n        for (int r = 0; r < n; r++)\n        {\n            while (s[r] - s[l] > mid) l++;\n            cnt += r - l;\n        }\n        if (cnt >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func smallestDistancePair(nums []int, k int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tn := len(s)\n\tlo, hi := 0, s[n-1]-s[0]\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tcnt, l := 0, 0\n\t\tfor r := 0; r < n; r++ {\n\t\t\tfor s[r]-s[l] > mid {\n\t\t\t\tl++\n\t\t\t}\n\t\t\tcnt += r - l\n\t\t}\n\t\tif cnt >= k {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun smallestDistancePair(nums: IntArray, k: Int): Int {\n    val s = nums.sortedArray()\n    val n = s.size\n    var lo = 0\n    var hi = s[n - 1] - s[0]\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        var cnt = 0\n        var l = 0\n        for (r in 0 until n) {\n            while (s[r] - s[l] > mid) l++\n            cnt += r - l\n        }\n        if (cnt >= k) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func smallestDistancePair(_ nums: [Int], _ k: Int) -> Int {\n    let s = nums.sorted()\n    let n = s.count\n    var lo = 0\n    var hi = s[n - 1] - s[0]\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        var cnt = 0\n        var l = 0\n        for r in 0..<n {\n            while s[r] - s[l] > mid { l += 1 }\n            cnt += r - l\n        }\n        if cnt >= k { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn smallestDistancePair(nums: Vec<i32>, k: i32) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let n = s.len();\n    let mut lo = 0i32;\n    let mut hi = s[n - 1] - s[0];\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        let mut cnt = 0i32;\n        let mut l = 0usize;\n        for r in 0..n {\n            while s[r] - s[l] > mid {\n                l += 1;\n            }\n            cnt += (r - l) as i32;\n        }\n        if cnt >= k {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function smallestDistancePair($nums, $k) {\n    $s = $nums;\n    sort($s);\n    $n = count($s);\n    $lo = 0;\n    $hi = $s[$n - 1] - $s[0];\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $cnt = 0;\n        $l = 0;\n        for ($r = 0; $r < $n; $r++) {\n            while ($s[$r] - $s[$l] > $mid) $l++;\n            $cnt += $r - $l;\n        }\n        if ($cnt >= $k) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def smallestDistancePair(nums, k)\n  s = nums.sort\n  n = s.length\n  lo = 0\n  hi = s[n - 1] - s[0]\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    cnt = 0\n    l = 0\n    (0...n).each do |r|\n      l += 1 while s[r] - s[l] > mid\n      cnt += r - l\n    end\n    if cnt >= k\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Minimum Number of Moves to Make Palindrome (LC 2193) ────────
  (() => {
    const ref = (s: string) => {
      const arr = s.split("");
      let moves = 0, i = 0, j = arr.length - 1;
      while (i < j) {
        let k = j;
        while (k > i && arr[k] !== arr[i]) k--;
        if (k === i) {
          const t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t;
          moves++;
        } else {
          while (k < j) { const t = arr[k]; arr[k] = arr[k + 1]; arr[k + 1] = t; k++; moves++; }
          i++; j--;
        }
      }
      return moves;
    };
    return {
      slug: "minimum-number-of-moves-to-make-palindrome",
      title: "Minimum Number of Moves to Make Palindrome",
      difficulty: "HARD" as const,
      tags: ["String", "Two Pointers", "Greedy", "Amazon", "Google", "Directi"],
      signature: { funcName: "minMovesToMakePalindrome", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "In one move you may swap two **adjacent** characters of `s`. The input is guaranteed to be rearrangeable into a palindrome.\n\nReturn the minimum number of moves needed to make `s` a palindrome.",
        [
          { in: 's = "aabb"', out: "2", note: '"aabb" → "abab" → "abba".' },
          { in: 's = "letelt"', out: "2", note: '"letelt" → "letelt" → "lettel".' },
          { in: 's = "kaiak"', out: "0", note: "Already a palindrome." },
        ],
        ["1 <= s.length <= 2000", "s consists of lowercase English letters.", "s can be rearranged to form a palindrome."]),
      hints: [
        "Fix the outermost pair first: whatever ends up at both ends costs the same wherever it comes from.",
        "For the leftmost character, its cheapest partner is the *rightmost* occurrence of that same character.",
        "A character with no partner is the palindrome's centre — nudge it one step inward and carry on.",
      ],
      editorial: explain({
        idea: "Work from the outside in. For the character now at the left end, find its rightmost match and bubble that match to the right end; the swaps used are exactly its distance from the end. A character with no match anywhere else is the odd one out and only ever needs to drift toward the centre.",
        steps: [
          "Keep pointers `i` at the left and `j` at the right of the unsettled region.",
          "Scan `k` from `j` down to `i` looking for `arr[k] == arr[i]`.",
          "If `k > i`, bubble it to position `j` with `j - k` adjacent swaps, then shrink both pointers.",
          "If `k == i` the character is unmatched: swap it one step right, count one move, and retry the same `i`.",
        ],
        why: "Choosing the rightmost match is optimal because any other occurrence of that character lies further left and would need at least as many swaps, and the swaps never disturb the relative order of the characters still to be paired. The unmatched character is unique (the string is rearrangeable), so pushing it inward one step at a time is exactly the cost of moving it to the centre.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Matching the *leftmost* occurrence of the character costs more and gives a wrong answer.",
          "When the unmatched character is found, `i` must not advance — the same position needs a new partner search.",
          "Counting moves as index differences after several bubbles double-counts; count each adjacent swap as it happens.",
        ],
      }),
      examples: [
        { input: '"aabb"', expectedOutput: "2" },
        { input: '"letelt"', expectedOutput: "2" },
        { input: '"kaiak"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        // Build a multiset with at most one odd count, then shuffle it — the
        // statement promises the input is rearrangeable into a palindrome.
        const half = Array.from({ length: ri(rng, 0, 10) }, () => randLower(rng));
        const chars = half.concat(half.slice());
        if (rng() < 0.5 || chars.length === 0) chars.push(randLower(rng));
        const s = shuffle(rng, chars).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minMovesToMakePalindrome(s: str) -> int:\n    arr = list(s)\n    moves = 0\n    i, j = 0, len(arr) - 1\n    while i < j:\n        k = j\n        while k > i and arr[k] != arr[i]:\n            k -= 1\n        if k == i:\n            arr[i], arr[i + 1] = arr[i + 1], arr[i]\n            moves += 1\n        else:\n            while k < j:\n                arr[k], arr[k + 1] = arr[k + 1], arr[k]\n                k += 1\n                moves += 1\n            i += 1\n            j -= 1\n    return moves`,
        javascript: `var minMovesToMakePalindrome = function(s) {\n    var arr = s.split("");\n    var moves = 0, i = 0, j = arr.length - 1, t;\n    while (i < j) {\n        var k = j;\n        while (k > i && arr[k] !== arr[i]) k--;\n        if (k === i) {\n            t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t;\n            moves++;\n        } else {\n            while (k < j) {\n                t = arr[k]; arr[k] = arr[k + 1]; arr[k + 1] = t;\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    return moves;\n};`,
        typescript: `function minMovesToMakePalindrome(s: string): number {\n    var arr = s.split("");\n    var moves = 0, i = 0, j = arr.length - 1;\n    var t: string;\n    while (i < j) {\n        var k = j;\n        while (k > i && arr[k] !== arr[i]) k--;\n        if (k === i) {\n            t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t;\n            moves++;\n        } else {\n            while (k < j) {\n                t = arr[k]; arr[k] = arr[k + 1]; arr[k + 1] = t;\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    return moves;\n}`,
        java: `public static int minMovesToMakePalindrome(String s) {\n    char[] arr = s.toCharArray();\n    int moves = 0, i = 0, j = arr.length - 1;\n    while (i < j) {\n        int k = j;\n        while (k > i && arr[k] != arr[i]) k--;\n        if (k == i) {\n            char t = arr[i];\n            arr[i] = arr[i + 1];\n            arr[i + 1] = t;\n            moves++;\n        } else {\n            while (k < j) {\n                char t = arr[k];\n                arr[k] = arr[k + 1];\n                arr[k + 1] = t;\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    return moves;\n}`,
        cpp: `int minMovesToMakePalindrome(string s) {\n    int moves = 0, i = 0, j = (int) s.size() - 1;\n    while (i < j) {\n        int k = j;\n        while (k > i && s[k] != s[i]) k--;\n        if (k == i) {\n            swap(s[i], s[i + 1]);\n            moves++;\n        } else {\n            while (k < j) {\n                swap(s[k], s[k + 1]);\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    return moves;\n}`,
        c: `int minMovesToMakePalindrome(char* s) {\n    int n = (int) strlen(s);\n    char* arr = (char*) malloc((size_t) n + 1);\n    for (int t = 0; t <= n; t++) arr[t] = s[t];\n    int moves = 0, i = 0, j = n - 1;\n    while (i < j) {\n        int k = j;\n        while (k > i && arr[k] != arr[i]) k--;\n        if (k == i) {\n            char tmp = arr[i];\n            arr[i] = arr[i + 1];\n            arr[i + 1] = tmp;\n            moves++;\n        } else {\n            while (k < j) {\n                char tmp = arr[k];\n                arr[k] = arr[k + 1];\n                arr[k + 1] = tmp;\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    free(arr);\n    return moves;\n}`,
        csharp: `public static int MinMovesToMakePalindrome(string s)\n{\n    char[] arr = s.ToCharArray();\n    int moves = 0, i = 0, j = arr.Length - 1;\n    while (i < j)\n    {\n        int k = j;\n        while (k > i && arr[k] != arr[i]) k--;\n        if (k == i)\n        {\n            char t = arr[i];\n            arr[i] = arr[i + 1];\n            arr[i + 1] = t;\n            moves++;\n        }\n        else\n        {\n            while (k < j)\n            {\n                char t = arr[k];\n                arr[k] = arr[k + 1];\n                arr[k + 1] = t;\n                k++;\n                moves++;\n            }\n            i++;\n            j--;\n        }\n    }\n    return moves;\n}`,
        go: `func minMovesToMakePalindrome(s string) int {\n\tarr := []byte(s)\n\tmoves, i, j := 0, 0, len(arr)-1\n\tfor i < j {\n\t\tk := j\n\t\tfor k > i && arr[k] != arr[i] {\n\t\t\tk--\n\t\t}\n\t\tif k == i {\n\t\t\tarr[i], arr[i+1] = arr[i+1], arr[i]\n\t\t\tmoves++\n\t\t} else {\n\t\t\tfor k < j {\n\t\t\t\tarr[k], arr[k+1] = arr[k+1], arr[k]\n\t\t\t\tk++\n\t\t\t\tmoves++\n\t\t\t}\n\t\t\ti++\n\t\t\tj--\n\t\t}\n\t}\n\treturn moves\n}`,
        kotlin: `fun minMovesToMakePalindrome(s: String): Int {\n    val arr = s.toCharArray()\n    var moves = 0\n    var i = 0\n    var j = arr.size - 1\n    while (i < j) {\n        var k = j\n        while (k > i && arr[k] != arr[i]) k--\n        if (k == i) {\n            val t = arr[i]\n            arr[i] = arr[i + 1]\n            arr[i + 1] = t\n            moves++\n        } else {\n            while (k < j) {\n                val t = arr[k]\n                arr[k] = arr[k + 1]\n                arr[k + 1] = t\n                k++\n                moves++\n            }\n            i++\n            j--\n        }\n    }\n    return moves\n}`,
        swift: `func minMovesToMakePalindrome(_ s: String) -> Int {\n    var arr = Array(s)\n    var moves = 0\n    var i = 0\n    var j = arr.count - 1\n    while i < j {\n        var k = j\n        while k > i && arr[k] != arr[i] { k -= 1 }\n        if k == i {\n            arr.swapAt(i, i + 1)\n            moves += 1\n        } else {\n            while k < j {\n                arr.swapAt(k, k + 1)\n                k += 1\n                moves += 1\n            }\n            i += 1\n            j -= 1\n        }\n    }\n    return moves\n}`,
        rust: `fn minMovesToMakePalindrome(s: String) -> i32 {\n    let mut arr: Vec<u8> = s.into_bytes();\n    let mut moves = 0i32;\n    let mut i = 0usize;\n    let mut j = arr.len() - 1;\n    while i < j {\n        let mut k = j;\n        while k > i && arr[k] != arr[i] {\n            k -= 1;\n        }\n        if k == i {\n            arr.swap(i, i + 1);\n            moves += 1;\n        } else {\n            while k < j {\n                arr.swap(k, k + 1);\n                k += 1;\n                moves += 1;\n            }\n            i += 1;\n            j -= 1;\n        }\n    }\n    moves\n}`,
        php: `function minMovesToMakePalindrome($s) {\n    $arr = str_split($s);\n    $moves = 0;\n    $i = 0;\n    $j = count($arr) - 1;\n    while ($i < $j) {\n        $k = $j;\n        while ($k > $i && $arr[$k] !== $arr[$i]) $k--;\n        if ($k === $i) {\n            $t = $arr[$i];\n            $arr[$i] = $arr[$i + 1];\n            $arr[$i + 1] = $t;\n            $moves++;\n        } else {\n            while ($k < $j) {\n                $t = $arr[$k];\n                $arr[$k] = $arr[$k + 1];\n                $arr[$k + 1] = $t;\n                $k++;\n                $moves++;\n            }\n            $i++;\n            $j--;\n        }\n    }\n    return $moves;\n}`,
        ruby: `def minMovesToMakePalindrome(s)\n  arr = s.chars\n  moves = 0\n  i = 0\n  j = arr.length - 1\n  while i < j\n    k = j\n    k -= 1 while k > i && arr[k] != arr[i]\n    if k == i\n      arr[i], arr[i + 1] = arr[i + 1], arr[i]\n      moves += 1\n    else\n      while k < j\n        arr[k], arr[k + 1] = arr[k + 1], arr[k]\n        k += 1\n        moves += 1\n      end\n      i += 1\n      j -= 1\n    end\n  end\n  moves\nend`,
      },
    };
  })(),

  // ── Minimum Window Subsequence (LC 727) ─────────────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const n = s1.length, m = s2.length;
      let bestStart = -1, bestLen = n + 1;
      let i = 0;
      while (i < n) {
        let j = 0, k = i;
        while (k < n) {
          if (s1[k] === s2[j]) { j++; if (j === m) break; }
          k++;
        }
        if (j < m) break;
        // Walk back from k to the tightest start for this match.
        let back = k, jj = m - 1;
        while (jj >= 0) {
          if (s1[back] === s2[jj]) jj--;
          if (jj >= 0) back--;
        }
        if (k - back + 1 < bestLen) { bestLen = k - back + 1; bestStart = back; }
        i = back + 1;
      }
      return bestStart < 0 ? "" : s1.slice(bestStart, bestStart + bestLen);
    };
    return {
      slug: "minimum-window-subsequence",
      title: "Minimum Window Subsequence",
      difficulty: "HARD" as const,
      tags: ["String", "Two Pointers", "Dynamic Programming", "Sliding Window", "Amazon", "Google", "Uber"],
      signature: { funcName: "minWindow", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Find the **shortest contiguous substring** of `s1` that contains `s2` as a **subsequence**.\n\nIf there is none, return the empty string. If several are equally short, return the one that starts earliest.",
        [
          { in: 's1 = "codekairo", s2 = "dei"', out: '"dekai"', note: "The only `d` is at index 2, and the window must reach the `i` at index 6." },
          { in: 's1 = "abcdebdde", s2 = "bde"', out: '"bcde"', note: '"bdde" is also a window but it is longer.' },
          { in: 's1 = "codekairo", s2 = "zz"', out: '""', note: "No window contains it." },
        ],
        ["1 <= s1.length <= 20000", "1 <= s2.length <= 100", "Both strings consist of lowercase English letters."]),
      hints: [
        "A subsequence match, not a substring match — the characters of `s2` need only appear in order.",
        "Greedily match `s2` forward from a start position; the first position where the match completes is the tightest possible end.",
        "From that end, walk *backwards* matching `s2` in reverse to pull the start as far right as it will go.",
      ],
      editorial: explain({
        idea: "Two greedy passes per candidate. Going forward finds the earliest end that can complete the match; going backward from that end finds the latest start that still works. Together they produce the minimal window beginning at or after the current position.",
        steps: [
          "From `i`, scan forward matching characters of `s2` in order; stop when the last one is consumed, at index `k`.",
          "If the scan runs off the end, no further window exists — stop.",
          "From `k`, scan backward matching `s2` in reverse; the position where the first character is consumed is the tightest start `back`.",
          "Record the window and restart the outer scan at `back + 1`.",
        ],
        why: "The forward scan is greedy-earliest, so no window starting at or after `i` can end before `k`. The backward scan is greedy-latest from that fixed end, so no window ending at `k` can start after `back`. Restarting at `back + 1` skips only starts whose optimal window is the one just recorded, so nothing shorter is missed, and each character is visited a bounded number of times.",
        time: "O(n · m) in the worst case",
        space: "O(1) beyond the output",
        pitfalls: [
          "Treating the requirement as a substring match misses every window with characters interleaved.",
          "Restarting the outer scan at `i + 1` instead of `back + 1` is correct but slower, and restarting at `k + 1` skips valid windows.",
          "Ties are broken by the earliest start, so record only on a strictly shorter window.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n"dei"', expectedOutput: "dekai" },
        { input: '"abcdebdde"\n"bde"', expectedOutput: "bcde" },
        { input: '"codekairo"\n"zz"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const alpha = ["a", "b", "c", "d", "e"];
        const s1 = Array.from({ length: ri(rng, 1, 40) }, () => pick(rng, alpha)).join("");
        const s2 = Array.from({ length: ri(rng, 1, 4) }, () => pick(rng, alpha)).join("");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: ref(s1, s2) };
      },
      solutions: {
        python: `def minWindow(s1: str, s2: str) -> str:\n    n, m = len(s1), len(s2)\n    best_start, best_len = -1, n + 1\n    i = 0\n    while i < n:\n        j, k = 0, i\n        while k < n:\n            if s1[k] == s2[j]:\n                j += 1\n                if j == m:\n                    break\n            k += 1\n        if j < m:\n            break\n        back, jj = k, m - 1\n        while jj >= 0:\n            if s1[back] == s2[jj]:\n                jj -= 1\n            if jj >= 0:\n                back -= 1\n        if k - back + 1 < best_len:\n            best_len = k - back + 1\n            best_start = back\n        i = back + 1\n    return "" if best_start < 0 else s1[best_start:best_start + best_len]`,
        javascript: `var minWindow = function(s1, s2) {\n    var n = s1.length, m = s2.length;\n    var bestStart = -1, bestLen = n + 1;\n    var i = 0;\n    while (i < n) {\n        var j = 0, k = i;\n        while (k < n) {\n            if (s1.charAt(k) === s2.charAt(j)) {\n                j++;\n                if (j === m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        var back = k, jj = m - 1;\n        while (jj >= 0) {\n            if (s1.charAt(back) === s2.charAt(jj)) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen) { bestLen = k - back + 1; bestStart = back; }\n        i = back + 1;\n    }\n    return bestStart < 0 ? "" : s1.substring(bestStart, bestStart + bestLen);\n};`,
        typescript: `function minWindow(s1: string, s2: string): string {\n    var n = s1.length, m = s2.length;\n    var bestStart = -1, bestLen = n + 1;\n    var i = 0;\n    while (i < n) {\n        var j = 0, k = i;\n        while (k < n) {\n            if (s1.charAt(k) === s2.charAt(j)) {\n                j++;\n                if (j === m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        var back = k, jj = m - 1;\n        while (jj >= 0) {\n            if (s1.charAt(back) === s2.charAt(jj)) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen) { bestLen = k - back + 1; bestStart = back; }\n        i = back + 1;\n    }\n    return bestStart < 0 ? "" : s1.substring(bestStart, bestStart + bestLen);\n}`,
        java: `public static String minWindow(String s1, String s2) {\n    int n = s1.length(), m = s2.length();\n    int bestStart = -1, bestLen = n + 1;\n    int i = 0;\n    while (i < n) {\n        int j = 0, k = i;\n        while (k < n) {\n            if (s1.charAt(k) == s2.charAt(j)) {\n                j++;\n                if (j == m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        int back = k, jj = m - 1;\n        while (jj >= 0) {\n            if (s1.charAt(back) == s2.charAt(jj)) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen) {\n            bestLen = k - back + 1;\n            bestStart = back;\n        }\n        i = back + 1;\n    }\n    return bestStart < 0 ? "" : s1.substring(bestStart, bestStart + bestLen);\n}`,
        cpp: `string minWindow(string s1, string s2) {\n    int n = (int) s1.size(), m = (int) s2.size();\n    int bestStart = -1, bestLen = n + 1;\n    int i = 0;\n    while (i < n) {\n        int j = 0, k = i;\n        while (k < n) {\n            if (s1[k] == s2[j]) {\n                j++;\n                if (j == m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        int back = k, jj = m - 1;\n        while (jj >= 0) {\n            if (s1[back] == s2[jj]) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen) {\n            bestLen = k - back + 1;\n            bestStart = back;\n        }\n        i = back + 1;\n    }\n    return bestStart < 0 ? string("") : s1.substr(bestStart, bestLen);\n}`,
        c: `char* minWindow(char* s1, char* s2) {\n    int n = (int) strlen(s1), m = (int) strlen(s2);\n    int bestStart = -1, bestLen = n + 1;\n    int i = 0;\n    while (i < n) {\n        int j = 0, k = i;\n        while (k < n) {\n            if (s1[k] == s2[j]) {\n                j++;\n                if (j == m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        int back = k, jj = m - 1;\n        while (jj >= 0) {\n            if (s1[back] == s2[jj]) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen) {\n            bestLen = k - back + 1;\n            bestStart = back;\n        }\n        i = back + 1;\n    }\n    if (bestStart < 0) {\n        char* empty = (char*) malloc(1);\n        empty[0] = 0;\n        return empty;\n    }\n    char* res = (char*) malloc((size_t) bestLen + 1);\n    for (int t = 0; t < bestLen; t++) res[t] = s1[bestStart + t];\n    res[bestLen] = 0;\n    return res;\n}`,
        csharp: `public static string MinWindow(string s1, string s2)\n{\n    int n = s1.Length, m = s2.Length;\n    int bestStart = -1, bestLen = n + 1;\n    int i = 0;\n    while (i < n)\n    {\n        int j = 0, k = i;\n        while (k < n)\n        {\n            if (s1[k] == s2[j])\n            {\n                j++;\n                if (j == m) break;\n            }\n            k++;\n        }\n        if (j < m) break;\n        int back = k, jj = m - 1;\n        while (jj >= 0)\n        {\n            if (s1[back] == s2[jj]) jj--;\n            if (jj >= 0) back--;\n        }\n        if (k - back + 1 < bestLen)\n        {\n            bestLen = k - back + 1;\n            bestStart = back;\n        }\n        i = back + 1;\n    }\n    return bestStart < 0 ? "" : s1.Substring(bestStart, bestLen);\n}`,
        go: `func minWindow(s1 string, s2 string) string {\n\tn, m := len(s1), len(s2)\n\tbestStart, bestLen := -1, n+1\n\ti := 0\n\tfor i < n {\n\t\tj, k := 0, i\n\t\tfor k < n {\n\t\t\tif s1[k] == s2[j] {\n\t\t\t\tj++\n\t\t\t\tif j == m {\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t}\n\t\t\tk++\n\t\t}\n\t\tif j < m {\n\t\t\tbreak\n\t\t}\n\t\tback, jj := k, m-1\n\t\tfor jj >= 0 {\n\t\t\tif s1[back] == s2[jj] {\n\t\t\t\tjj--\n\t\t\t}\n\t\t\tif jj >= 0 {\n\t\t\t\tback--\n\t\t\t}\n\t\t}\n\t\tif k-back+1 < bestLen {\n\t\t\tbestLen = k - back + 1\n\t\t\tbestStart = back\n\t\t}\n\t\ti = back + 1\n\t}\n\tif bestStart < 0 {\n\t\treturn ""\n\t}\n\treturn s1[bestStart : bestStart+bestLen]\n}`,
        kotlin: `fun minWindow(s1: String, s2: String): String {\n    val n = s1.length\n    val m = s2.length\n    var bestStart = -1\n    var bestLen = n + 1\n    var i = 0\n    while (i < n) {\n        var j = 0\n        var k = i\n        while (k < n) {\n            if (s1[k] == s2[j]) {\n                j++\n                if (j == m) break\n            }\n            k++\n        }\n        if (j < m) break\n        var back = k\n        var jj = m - 1\n        while (jj >= 0) {\n            if (s1[back] == s2[jj]) jj--\n            if (jj >= 0) back--\n        }\n        if (k - back + 1 < bestLen) {\n            bestLen = k - back + 1\n            bestStart = back\n        }\n        i = back + 1\n    }\n    return if (bestStart < 0) "" else s1.substring(bestStart, bestStart + bestLen)\n}`,
        swift: `func minWindow(_ s1: String, _ s2: String) -> String {\n    let a = Array(s1)\n    let b = Array(s2)\n    let n = a.count\n    let m = b.count\n    var bestStart = -1\n    var bestLen = n + 1\n    var i = 0\n    while i < n {\n        var j = 0\n        var k = i\n        while k < n {\n            if a[k] == b[j] {\n                j += 1\n                if j == m { break }\n            }\n            k += 1\n        }\n        if j < m { break }\n        var back = k\n        var jj = m - 1\n        while jj >= 0 {\n            if a[back] == b[jj] { jj -= 1 }\n            if jj >= 0 { back -= 1 }\n        }\n        if k - back + 1 < bestLen {\n            bestLen = k - back + 1\n            bestStart = back\n        }\n        i = back + 1\n    }\n    if bestStart < 0 { return "" }\n    return String(a[bestStart..<(bestStart + bestLen)])\n}`,
        rust: `fn minWindow(s1: String, s2: String) -> String {\n    let a: Vec<u8> = s1.clone().into_bytes();\n    let b: Vec<u8> = s2.into_bytes();\n    let n = a.len() as i32;\n    let m = b.len() as i32;\n    let mut best_start: i32 = -1;\n    let mut best_len: i32 = n + 1;\n    let mut i: i32 = 0;\n    while i < n {\n        let mut j: i32 = 0;\n        let mut k: i32 = i;\n        while k < n {\n            if a[k as usize] == b[j as usize] {\n                j += 1;\n                if j == m {\n                    break;\n                }\n            }\n            k += 1;\n        }\n        if j < m {\n            break;\n        }\n        let mut back: i32 = k;\n        let mut jj: i32 = m - 1;\n        while jj >= 0 {\n            if a[back as usize] == b[jj as usize] {\n                jj -= 1;\n            }\n            if jj >= 0 {\n                back -= 1;\n            }\n        }\n        if k - back + 1 < best_len {\n            best_len = k - back + 1;\n            best_start = back;\n        }\n        i = back + 1;\n    }\n    if best_start < 0 {\n        return String::new();\n    }\n    s1[best_start as usize..(best_start + best_len) as usize].to_string()\n}`,
        php: `function minWindow($s1, $s2) {\n    $n = strlen($s1);\n    $m = strlen($s2);\n    $bestStart = -1;\n    $bestLen = $n + 1;\n    $i = 0;\n    while ($i < $n) {\n        $j = 0;\n        $k = $i;\n        while ($k < $n) {\n            if ($s1[$k] === $s2[$j]) {\n                $j++;\n                if ($j === $m) break;\n            }\n            $k++;\n        }\n        if ($j < $m) break;\n        $back = $k;\n        $jj = $m - 1;\n        while ($jj >= 0) {\n            if ($s1[$back] === $s2[$jj]) $jj--;\n            if ($jj >= 0) $back--;\n        }\n        if ($k - $back + 1 < $bestLen) {\n            $bestLen = $k - $back + 1;\n            $bestStart = $back;\n        }\n        $i = $back + 1;\n    }\n    return $bestStart < 0 ? "" : substr($s1, $bestStart, $bestLen);\n}`,
        ruby: `def minWindow(s1, s2)\n  n = s1.length\n  m = s2.length\n  best_start = -1\n  best_len = n + 1\n  i = 0\n  while i < n\n    j = 0\n    k = i\n    while k < n\n      if s1[k] == s2[j]\n        j += 1\n        break if j == m\n      end\n      k += 1\n    end\n    break if j < m\n    back = k\n    jj = m - 1\n    while jj >= 0\n      jj -= 1 if s1[back] == s2[jj]\n      back -= 1 if jj >= 0\n    end\n    if k - back + 1 < best_len\n      best_len = k - back + 1\n      best_start = back\n    end\n    i = back + 1\n  end\n  best_start < 0 ? "" : s1[best_start, best_len]\nend`,
      },
    };
  })(),

  // ── Maximum Number of Robots Within Budget (LC 2398) ────────────
  (() => {
    const ref = (chargeTimes: number[], runningCosts: number[], budget: number) => {
      const n = chargeTimes.length;
      const dq: number[] = [];
      let sum = 0, l = 0, best = 0;
      for (let r = 0; r < n; r++) {
        while (dq.length > 0 && chargeTimes[dq[dq.length - 1]] <= chargeTimes[r]) dq.pop();
        dq.push(r);
        sum += runningCosts[r];
        while (l <= r && chargeTimes[dq[0]] + (r - l + 1) * sum > budget) {
          sum -= runningCosts[l];
          if (dq[0] === l) dq.shift();
          l++;
        }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "maximum-number-of-robots-within-budget",
      title: "Maximum Number of Robots Within Budget",
      difficulty: "HARD" as const,
      tags: ["Array", "Sliding Window", "Two Pointers", "Queue", "Monotonic Queue", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maximumRobots", params: [{ name: "chargeTimes", type: "int[]" as const }, { name: "runningCosts", type: "int[]" as const }, { name: "budget", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You run a **consecutive** stretch of robots. Running robots `i … j` costs\n\n`max(chargeTimes[i…j]) + (j - i + 1) · sum(runningCosts[i…j])`\n\nReturn the maximum number of consecutive robots you can run without exceeding `budget`.",
        [
          { in: "chargeTimes = [3,6,1,3,4], runningCosts = [2,1,3,4,5], budget = 25", out: "3", note: "Robots 0–2 cost 6 + 3 · 6 = 24." },
          { in: "chargeTimes = [11,12,19], runningCosts = [10,8,7], budget = 19", out: "0", note: "Even one robot is too expensive." },
          { in: "chargeTimes = [1,1,1], runningCosts = [1,1,1], budget = 100", out: "3" },
        ],
        ["1 <= chargeTimes.length == runningCosts.length <= 1000", "1 <= chargeTimes[i], runningCosts[i] <= 100000", "1 <= budget <= 1000000000"]),
      hints: [
        "The cost of a window grows when the window grows, so the feasible windows form a sliding window.",
        "The running-cost part is a prefix sum; the charge-time part is a window maximum.",
        "A monotonic deque keeps the window maximum in amortised constant time.",
      ],
      editorial: explain({
        idea: "Extend the window to the right and shrink from the left whenever the cost exceeds the budget. The only awkward term is the window maximum of `chargeTimes`, which a decreasing deque of indices maintains as the window slides.",
        steps: [
          "For each right end `r`, pop the deque's back while its charge time is at most `chargeTimes[r]`, then push `r`; the front is now the window maximum.",
          "Add `runningCosts[r]` to the running sum.",
          "While the window's cost exceeds the budget, drop the left element from the sum and, if it was the deque's front, from the deque.",
          "Track the largest window seen.",
        ],
        why: "Both the maximum and the length-times-sum term are non-decreasing as the window grows, so for each `r` the feasible left ends form a suffix — a genuine sliding window, with `l` never moving backwards. The deque stays decreasing, so its front is always the maximum of the current window, and each index enters and leaves once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`(j - i + 1) · sum` reaches about `10^3 · 10^3 · 10^5 = 10^11`, so the cost must be computed in 64-bit even though the answer is small.",
          "Popping the deque with `<` instead of `<=` leaves stale equal maxima behind — harmless for the value but it must still be removed when it falls out of the window.",
          "The answer can be 0 when no single robot fits.",
        ],
      }),
      examples: [
        { input: "[3,6,1,3,4]\n[2,1,3,4,5]\n25", expectedOutput: "3" },
        { input: "[11,12,19]\n[10,8,7]\n19", expectedOutput: "0" },
        { input: "[1,1,1]\n[1,1,1]\n100", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.6 ? 20 : 100000;
        const chargeTimes = Array.from({ length: n }, () => ri(rng, 1, hi));
        const runningCosts = Array.from({ length: n }, () => ri(rng, 1, hi));
        const budget = ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(chargeTimes)}\n${fmtIntArr(runningCosts)}\n${budget}`, expectedOutput: String(ref(chargeTimes, runningCosts, budget)) };
      },
      solutions: {
        python: `from collections import deque\nfrom typing import List\n\ndef maximumRobots(chargeTimes: List[int], runningCosts: List[int], budget: int) -> int:\n    dq = deque()\n    total = 0\n    l = 0\n    best = 0\n    for r in range(len(chargeTimes)):\n        while dq and chargeTimes[dq[-1]] <= chargeTimes[r]:\n            dq.pop()\n        dq.append(r)\n        total += runningCosts[r]\n        while l <= r and chargeTimes[dq[0]] + (r - l + 1) * total > budget:\n            total -= runningCosts[l]\n            if dq[0] == l:\n                dq.popleft()\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var maximumRobots = function(chargeTimes, runningCosts, budget) {\n    var n = chargeTimes.length;\n    var dq = [];\n    var head = 0, sum = 0, l = 0, best = 0;\n    for (var r = 0; r < n; r++) {\n        while (dq.length > head && chargeTimes[dq[dq.length - 1]] <= chargeTimes[r]) dq.pop();\n        dq.push(r);\n        sum += runningCosts[r];\n        while (l <= r && chargeTimes[dq[head]] + (r - l + 1) * sum > budget) {\n            sum -= runningCosts[l];\n            if (dq[head] === l) head++;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function maximumRobots(chargeTimes: number[], runningCosts: number[], budget: number): number {\n    var n = chargeTimes.length;\n    var dq: number[] = [];\n    var head = 0, sum = 0, l = 0, best = 0;\n    for (var r = 0; r < n; r++) {\n        while (dq.length > head && chargeTimes[dq[dq.length - 1]] <= chargeTimes[r]) dq.pop();\n        dq.push(r);\n        sum += runningCosts[r];\n        while (l <= r && chargeTimes[dq[head]] + (r - l + 1) * sum > budget) {\n            sum -= runningCosts[l];\n            if (dq[head] === l) head++;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int maximumRobots(int[] chargeTimes, int[] runningCosts, int budget) {\n    int n = chargeTimes.length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    long sum = 0;\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        while (tail > head && chargeTimes[dq[tail - 1]] <= chargeTimes[r]) tail--;\n        dq[tail++] = r;\n        sum += runningCosts[r];\n        while (l <= r && chargeTimes[dq[head]] + (long) (r - l + 1) * sum > budget) {\n            sum -= runningCosts[l];\n            if (dq[head] == l) head++;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int maximumRobots(vector<int>& chargeTimes, vector<int>& runningCosts, int budget) {\n    int n = (int) chargeTimes.size();\n    deque<int> dq;\n    long long sum = 0;\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        while (!dq.empty() && chargeTimes[dq.back()] <= chargeTimes[r]) dq.pop_back();\n        dq.push_back(r);\n        sum += runningCosts[r];\n        while (l <= r && chargeTimes[dq.front()] + (long long) (r - l + 1) * sum > budget) {\n            sum -= runningCosts[l];\n            if (dq.front() == l) dq.pop_front();\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `int maximumRobots(int* chargeTimes, int chargeTimesSize, int* runningCosts, int runningCostsSize, int budget) {\n    (void) runningCostsSize;\n    int n = chargeTimesSize;\n    int* dq = (int*) malloc((size_t) n * sizeof(int));\n    int head = 0, tail = 0;\n    long long sum = 0;\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        while (tail > head && chargeTimes[dq[tail - 1]] <= chargeTimes[r]) tail--;\n        dq[tail++] = r;\n        sum += runningCosts[r];\n        while (l <= r && (long long) chargeTimes[dq[head]] + (long long) (r - l + 1) * sum > (long long) budget) {\n            sum -= runningCosts[l];\n            if (dq[head] == l) head++;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    free(dq);\n    return best;\n}`,
        csharp: `public static int MaximumRobots(int[] chargeTimes, int[] runningCosts, int budget)\n{\n    int n = chargeTimes.Length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    long sum = 0;\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++)\n    {\n        while (tail > head && chargeTimes[dq[tail - 1]] <= chargeTimes[r]) tail--;\n        dq[tail++] = r;\n        sum += runningCosts[r];\n        while (l <= r && chargeTimes[dq[head]] + (long) (r - l + 1) * sum > budget)\n        {\n            sum -= runningCosts[l];\n            if (dq[head] == l) head++;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func maximumRobots(chargeTimes []int, runningCosts []int, budget int) int {\n\tn := len(chargeTimes)\n\tdq := make([]int, 0, n)\n\tvar sum int64 = 0\n\tl, best := 0, 0\n\tfor r := 0; r < n; r++ {\n\t\tfor len(dq) > 0 && chargeTimes[dq[len(dq)-1]] <= chargeTimes[r] {\n\t\t\tdq = dq[:len(dq)-1]\n\t\t}\n\t\tdq = append(dq, r)\n\t\tsum += int64(runningCosts[r])\n\t\tfor l <= r && int64(chargeTimes[dq[0]])+int64(r-l+1)*sum > int64(budget) {\n\t\t\tsum -= int64(runningCosts[l])\n\t\t\tif dq[0] == l {\n\t\t\t\tdq = dq[1:]\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumRobots(chargeTimes: IntArray, runningCosts: IntArray, budget: Int): Int {\n    val n = chargeTimes.size\n    val dq = IntArray(n)\n    var head = 0\n    var tail = 0\n    var sum = 0L\n    var l = 0\n    var best = 0\n    for (r in 0 until n) {\n        while (tail > head && chargeTimes[dq[tail - 1]] <= chargeTimes[r]) tail--\n        dq[tail++] = r\n        sum += runningCosts[r]\n        while (l <= r && chargeTimes[dq[head]] + (r - l + 1).toLong() * sum > budget) {\n            sum -= runningCosts[l]\n            if (dq[head] == l) head++\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func maximumRobots(_ chargeTimes: [Int], _ runningCosts: [Int], _ budget: Int) -> Int {\n    let n = chargeTimes.count\n    var dq = [Int]()\n    var head = 0\n    var sum = 0\n    var l = 0\n    var best = 0\n    for r in 0..<n {\n        while dq.count > head && chargeTimes[dq[dq.count - 1]] <= chargeTimes[r] {\n            dq.removeLast()\n        }\n        dq.append(r)\n        sum += runningCosts[r]\n        while l <= r && chargeTimes[dq[head]] + (r - l + 1) * sum > budget {\n            sum -= runningCosts[l]\n            if dq[head] == l { head += 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn maximumRobots(chargeTimes: Vec<i32>, runningCosts: Vec<i32>, budget: i32) -> i32 {\n    let n = chargeTimes.len();\n    let mut dq: std::collections::VecDeque<usize> = std::collections::VecDeque::new();\n    let mut sum: i64 = 0;\n    let mut l: usize = 0;\n    let mut best: i32 = 0;\n    for r in 0..n {\n        while let Some(&back) = dq.back() {\n            if chargeTimes[back] <= chargeTimes[r] {\n                dq.pop_back();\n            } else {\n                break;\n            }\n        }\n        dq.push_back(r);\n        sum += runningCosts[r] as i64;\n        while l <= r && chargeTimes[*dq.front().unwrap()] as i64 + (r - l + 1) as i64 * sum > budget as i64 {\n            sum -= runningCosts[l] as i64;\n            if *dq.front().unwrap() == l {\n                dq.pop_front();\n            }\n            l += 1;\n        }\n        let len = (r as i32) - (l as i32) + 1;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function maximumRobots($chargeTimes, $runningCosts, $budget) {\n    $n = count($chargeTimes);\n    $dq = [];\n    $head = 0;\n    $sum = 0;\n    $l = 0;\n    $best = 0;\n    for ($r = 0; $r < $n; $r++) {\n        while (count($dq) > $head && $chargeTimes[$dq[count($dq) - 1]] <= $chargeTimes[$r]) array_pop($dq);\n        $dq[] = $r;\n        $sum += $runningCosts[$r];\n        while ($l <= $r && $chargeTimes[$dq[$head]] + ($r - $l + 1) * $sum > $budget) {\n            $sum -= $runningCosts[$l];\n            if ($dq[$head] === $l) $head++;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def maximumRobots(chargeTimes, runningCosts, budget)\n  n = chargeTimes.length\n  dq = []\n  head = 0\n  sum = 0\n  l = 0\n  best = 0\n  (0...n).each do |r|\n    dq.pop while dq.length > head && chargeTimes[dq[-1]] <= chargeTimes[r]\n    dq << r\n    sum += runningCosts[r]\n    while l <= r && chargeTimes[dq[head]] + (r - l + 1) * sum > budget\n      sum -= runningCosts[l]\n      head += 1 if dq[head] == l\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),
];
