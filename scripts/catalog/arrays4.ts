/**
 * Array fundamentals — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" array set that TCS NQT / Infosys / Wipro rounds draw from.
 * Worked examples are phrased for CodeKairo, so a sample string is
 * "codekairo" rather than another site's name.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const ARRAY4_PROBLEMS: CatalogProblem[] = [

  // ── Find the Difference of Two Arrays (LC 2215) ─────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const sa: Record<string, boolean> = {}, sb: Record<string, boolean> = {};
      for (const x of a) sa[String(x)] = true;
      for (const x of b) sb[String(x)] = true;
      const left = Object.keys(sa).filter((k) => sb[k] !== true).map(Number).sort((x, y) => x - y);
      const right = Object.keys(sb).filter((k) => sa[k] !== true).map(Number).sort((x, y) => x - y);
      return [left, right];
    };
    return {
      slug: "find-the-difference-of-two-arrays",
      title: "Find the Difference of Two Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Infosys"],
      signature: { funcName: "findDifference", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given two integer arrays `nums1` and `nums2`, return a list `answer` of size `2` where:\n\n- `answer[0]` holds every **distinct** value present in `nums1` but not in `nums2`;\n- `answer[1]` holds every **distinct** value present in `nums2` but not in `nums1`.\n\nBoth lists must be sorted in **ascending** order. A list with nothing in it is returned as `[]`.",
        [
          { in: "nums1 = [1,2,3], nums2 = [2,4,6]", out: "[[1,3],[4,6]]", note: "1 and 3 are missing from nums2; 4 and 6 are missing from nums1." },
          { in: "nums1 = [1,2,3,3], nums2 = [1,1,2,2]", out: "[[3],[]]", note: "Duplicates collapse: only the value 3 is unique to nums1, and nums2 adds nothing new." },
          { in: "nums1 = [5], nums2 = [5]", out: "[[],[]]" },
        ],
        ["1 <= nums1.length, nums2.length <= 1000", "-1000 <= nums1[i], nums2[i] <= 1000"]),
      hints: [
        "The word *distinct* is the whole problem — a set on each side removes the duplicates for free.",
        "Membership tests are what make this linear; scanning the other array per element is O(n·m).",
        "Sort each result once at the end rather than keeping the sets ordered as you go.",
      ],
      editorial: explain({
        idea: "Reduce both arrays to sets, then each answer is one filtered pass: keep the values of one set the other set does not contain.",
        steps: [
          "Build `s1` from `nums1` and `s2` from `nums2`; duplicates disappear here.",
          "Walk `s1` and keep every value `s2` is missing — that is `answer[0]`.",
          "Walk `s2` and keep every value `s1` is missing — that is `answer[1]`.",
          "Sort both lists ascending so the answer is unique.",
        ],
        why: "Set membership is exactly the predicate the statement asks about, and a set visits each distinct value once, so each element is reported at most once and no duplicate can survive.",
        time: "O(n + m + k log k) where k is the answer size",
        space: "O(n + m)",
        pitfalls: [
          "Returning duplicates — filtering the raw array instead of the set reports `3` twice for `[1,2,3,3]`.",
          "An empty side must still appear as `[]`; dropping it gives a one-element answer.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n[2,4,6]", expectedOutput: "[[1,3],[4,6]]" },
        { input: "[1,2,3,3]\n[1,1,2,2]", expectedOutput: "[[3],[]]" },
        { input: "[5]\n[5]", expectedOutput: "[[],[]]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 8 : 1000;
        const a = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -hi, hi));
        const b = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -hi, hi));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntMat(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findDifference(nums1: List[int], nums2: List[int]) -> List[List[int]]:\n    s1 = set(nums1)\n    s2 = set(nums2)\n    return [sorted(s1 - s2), sorted(s2 - s1)]`,
        javascript: `var findDifference = function(nums1, nums2) {\n    var s1 = {}, s2 = {};\n    for (var i = 0; i < nums1.length; i++) s1[String(nums1[i])] = true;\n    for (var j = 0; j < nums2.length; j++) s2[String(nums2[j])] = true;\n    var left = [], right = [];\n    for (var k in s1) { if (s2[k] !== true) left.push(Number(k)); }\n    for (var m in s2) { if (s1[m] !== true) right.push(Number(m)); }\n    left.sort(function(a, b) { return a - b; });\n    right.sort(function(a, b) { return a - b; });\n    return [left, right];\n};`,
        typescript: `function findDifference(nums1: number[], nums2: number[]): number[][] {\n    var s1: { [key: string]: boolean } = {}, s2: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums1.length; i++) s1[String(nums1[i])] = true;\n    for (var j = 0; j < nums2.length; j++) s2[String(nums2[j])] = true;\n    var left: number[] = [], right: number[] = [];\n    var k1 = Object.keys(s1);\n    for (var a = 0; a < k1.length; a++) { if (s2[k1[a]] !== true) left.push(Number(k1[a])); }\n    var k2 = Object.keys(s2);\n    for (var b = 0; b < k2.length; b++) { if (s1[k2[b]] !== true) right.push(Number(k2[b])); }\n    left.sort(function(x, y) { return x - y; });\n    right.sort(function(x, y) { return x - y; });\n    return [left, right];\n}`,
        java: `public static int[][] findDifference(int[] nums1, int[] nums2) {\n    TreeSet<Integer> s1 = new TreeSet<>();\n    TreeSet<Integer> s2 = new TreeSet<>();\n    for (int x : nums1) s1.add(x);\n    for (int x : nums2) s2.add(x);\n    List<Integer> left = new ArrayList<>();\n    List<Integer> right = new ArrayList<>();\n    for (int x : s1) { if (!s2.contains(x)) left.add(x); }\n    for (int x : s2) { if (!s1.contains(x)) right.add(x); }\n    int[][] out = new int[2][];\n    out[0] = new int[left.size()];\n    for (int i = 0; i < left.size(); i++) out[0][i] = left.get(i);\n    out[1] = new int[right.size()];\n    for (int i = 0; i < right.size(); i++) out[1][i] = right.get(i);\n    return out;\n}`,
        cpp: `vector<vector<int>> findDifference(vector<int>& nums1, vector<int>& nums2) {\n    set<int> s1(nums1.begin(), nums1.end());\n    set<int> s2(nums2.begin(), nums2.end());\n    vector<int> left, right;\n    for (int x : s1) { if (!s2.count(x)) left.push_back(x); }\n    for (int x : s2) { if (!s1.count(x)) right.push_back(x); }\n    return { left, right };\n}`,
        c: `static int cmpDiffAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int uniqueSorted(int* src, int n, int* dst) {\n    for (int i = 0; i < n; i++) dst[i] = src[i];\n    qsort(dst, (size_t) n, sizeof(int), cmpDiffAsc);\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (i == 0 || dst[i] != dst[i - 1]) dst[m++] = dst[i];\n    }\n    return m;\n}\n\nstatic int containsVal(int* a, int n, int v) {\n    for (int i = 0; i < n; i++) { if (a[i] == v) return 1; }\n    return 0;\n}\n\nint** findDifference(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize, int** returnColumnSizes) {\n    int* u1 = (int*) malloc((size_t) nums1Size * sizeof(int));\n    int* u2 = (int*) malloc((size_t) nums2Size * sizeof(int));\n    int n1 = uniqueSorted(nums1, nums1Size, u1);\n    int n2 = uniqueSorted(nums2, nums2Size, u2);\n    int* left = (int*) malloc((size_t) (n1 > 0 ? n1 : 1) * sizeof(int));\n    int* right = (int*) malloc((size_t) (n2 > 0 ? n2 : 1) * sizeof(int));\n    int lc = 0, rc = 0;\n    for (int i = 0; i < n1; i++) { if (!containsVal(u2, n2, u1[i])) left[lc++] = u1[i]; }\n    for (int i = 0; i < n2; i++) { if (!containsVal(u1, n1, u2[i])) right[rc++] = u2[i]; }\n    free(u1);\n    free(u2);\n    int** out = (int**) malloc(2 * sizeof(int*));\n    int* cols = (int*) malloc(2 * sizeof(int));\n    out[0] = left; cols[0] = lc;\n    out[1] = right; cols[1] = rc;\n    *returnSize = 2;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] FindDifference(int[] nums1, int[] nums2)\n{\n    var s1 = new SortedSet<int>(nums1);\n    var s2 = new SortedSet<int>(nums2);\n    var left = new List<int>();\n    var right = new List<int>();\n    foreach (int x in s1) { if (!s2.Contains(x)) left.Add(x); }\n    foreach (int x in s2) { if (!s1.Contains(x)) right.Add(x); }\n    return new int[][] { left.ToArray(), right.ToArray() };\n}`,
        go: `func findDifference(nums1 []int, nums2 []int) [][]int {\n\ts1 := map[int]bool{}\n\ts2 := map[int]bool{}\n\tfor _, x := range nums1 {\n\t\ts1[x] = true\n\t}\n\tfor _, x := range nums2 {\n\t\ts2[x] = true\n\t}\n\tleft := []int{}\n\tright := []int{}\n\tfor x := range s1 {\n\t\tif !s2[x] {\n\t\t\tleft = append(left, x)\n\t\t}\n\t}\n\tfor x := range s2 {\n\t\tif !s1[x] {\n\t\t\tright = append(right, x)\n\t\t}\n\t}\n\tsort.Ints(left)\n\tsort.Ints(right)\n\treturn [][]int{left, right}\n}`,
        kotlin: `fun findDifference(nums1: IntArray, nums2: IntArray): Array<IntArray> {\n    val s1 = nums1.toHashSet()\n    val s2 = nums2.toHashSet()\n    val left = s1.filter { !s2.contains(it) }.sorted().toIntArray()\n    val right = s2.filter { !s1.contains(it) }.sorted().toIntArray()\n    return arrayOf(left, right)\n}`,
        swift: `func findDifference(_ nums1: [Int], _ nums2: [Int]) -> [[Int]] {\n    let s1 = Set(nums1)\n    let s2 = Set(nums2)\n    let left = s1.filter { !s2.contains($0) }.sorted()\n    let right = s2.filter { !s1.contains($0) }.sorted()\n    return [left, right]\n}`,
        rust: `fn findDifference(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<Vec<i32>> {\n    let s1: std::collections::HashSet<i32> = nums1.into_iter().collect();\n    let s2: std::collections::HashSet<i32> = nums2.into_iter().collect();\n    let mut left: Vec<i32> = s1.iter().filter(|x| !s2.contains(x)).cloned().collect();\n    let mut right: Vec<i32> = s2.iter().filter(|x| !s1.contains(x)).cloned().collect();\n    left.sort();\n    right.sort();\n    vec![left, right]\n}`,
        php: `function findDifference($nums1, $nums2) {\n    $s1 = array_unique($nums1);\n    $s2 = array_unique($nums2);\n    $left = array_values(array_diff($s1, $s2));\n    $right = array_values(array_diff($s2, $s1));\n    sort($left);\n    sort($right);\n    return array($left, $right);\n}`,
        ruby: `def findDifference(nums1, nums2)\n  s1 = nums1.uniq\n  s2 = nums2.uniq\n  [(s1 - s2).sort, (s2 - s1).sort]\nend`,
      },
    };
  })(),

  // ── The Two Sneaky Numbers of Digitville (LC 3289) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: number[] = [];
      for (let i = 0; i < nums.length; i++) count.push(0);
      for (const x of nums) count[x]++;
      const out: number[] = [];
      for (let v = 0; v < count.length; v++) { if (count[v] === 2) out.push(v); }
      return out;
    };
    return {
      slug: "the-two-sneaky-numbers-of-digitville",
      title: "The Two Sneaky Numbers of Digitville",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "TCS", "Cognizant"],
      signature: { funcName: "getSneakyNumbers", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "The registry of Digitville was supposed to list every number from `0` to `n - 1` exactly once. Instead the list `nums` has length `n + 2`: two of the numbers sneaked in a **second** time.\n\nReturn the two repeated numbers in **ascending** order.",
        [
          { in: "nums = [0,1,1,0]", out: "[0,1]", note: "n is 2, so 0 and 1 should each appear once — both appear twice." },
          { in: "nums = [0,3,2,1,3,2]", out: "[2,3]", note: "n is 4; 2 and 3 are the repeats." },
          { in: "nums = [7,1,5,4,3,4,6,0,9,5,8,2]", out: "[4,5]" },
        ],
        ["2 <= n <= 100", "nums.length == n + 2", "0 <= nums[i] <= n - 1", "Exactly two values occur twice; every other value occurs once."]),
      hints: [
        "The values are bounded by the array length, which is the signal to count with an array rather than a hash map.",
        "Tally every value, then report the two whose tally is 2.",
        "Scanning the tally in index order gives ascending output for free.",
      ],
      editorial: explain({
        idea: "Because the values are exactly `0 .. n - 1`, a value is its own index into a counting array — no hashing is needed at all.",
        steps: [
          "Allocate `count` of length `n + 2` (any size at least `n` works) filled with zeros.",
          "For each `x` in `nums`, increment `count[x]`.",
          "Scan `count` from `0` upward and collect every index whose tally is `2`.",
        ],
        why: "Every legal value appears once except the two sneaks, so a tally of `2` identifies exactly the repeats. Scanning indices in increasing order means the result is already sorted.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Sorting and comparing neighbours also works but costs an extra `log n` factor for nothing.",
          "Using a hash map and iterating it gives an arbitrary order — the answer must be ascending.",
        ],
      }),
      examples: [
        { input: "[0,1,1,0]", expectedOutput: "[0,1]" },
        { input: "[0,3,2,1,3,2]", expectedOutput: "[2,3]" },
        { input: "[7,1,5,4,3,4,6,0,9,5,8,2]", expectedOutput: "[4,5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 60);
        const base = Array.from({ length: n }, (_, i) => i);
        const i1 = ri(rng, 0, n - 1);
        let i2 = ri(rng, 0, n - 1);
        while (i2 === i1) i2 = ri(rng, 0, n - 1);
        const nums = shuffle(rng, base.concat([i1, i2]));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getSneakyNumbers(nums: List[int]) -> List[int]:\n    count = [0] * len(nums)\n    for x in nums:\n        count[x] += 1\n    return [v for v in range(len(count)) if count[v] == 2]`,
        javascript: `var getSneakyNumbers = function(nums) {\n    var count = [];\n    for (var i = 0; i < nums.length; i++) count.push(0);\n    for (var j = 0; j < nums.length; j++) count[nums[j]]++;\n    var out = [];\n    for (var v = 0; v < count.length; v++) {\n        if (count[v] === 2) out.push(v);\n    }\n    return out;\n};`,
        typescript: `function getSneakyNumbers(nums: number[]): number[] {\n    var count: number[] = [];\n    for (var i = 0; i < nums.length; i++) count.push(0);\n    for (var j = 0; j < nums.length; j++) count[nums[j]]++;\n    var out: number[] = [];\n    for (var v = 0; v < count.length; v++) {\n        if (count[v] === 2) out.push(v);\n    }\n    return out;\n}`,
        java: `public static int[] getSneakyNumbers(int[] nums) {\n    int[] count = new int[nums.length];\n    for (int x : nums) count[x]++;\n    int[] out = new int[2];\n    int m = 0;\n    for (int v = 0; v < count.length; v++) {\n        if (count[v] == 2) out[m++] = v;\n    }\n    return out;\n}`,
        cpp: `vector<int> getSneakyNumbers(vector<int>& nums) {\n    vector<int> count(nums.size(), 0);\n    for (int x : nums) count[x]++;\n    vector<int> out;\n    for (int v = 0; v < (int) count.size(); v++) {\n        if (count[v] == 2) out.push_back(v);\n    }\n    return out;\n}`,
        c: `int* getSneakyNumbers(int* nums, int numsSize, int* returnSize) {\n    int* count = (int*) calloc((size_t) numsSize, sizeof(int));\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int* out = (int*) malloc(2 * sizeof(int));\n    int m = 0;\n    for (int v = 0; v < numsSize; v++) {\n        if (count[v] == 2) out[m++] = v;\n    }\n    free(count);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] GetSneakyNumbers(int[] nums)\n{\n    int[] count = new int[nums.Length];\n    foreach (int x in nums) count[x]++;\n    var out_ = new List<int>();\n    for (int v = 0; v < count.Length; v++)\n    {\n        if (count[v] == 2) out_.Add(v);\n    }\n    return out_.ToArray();\n}`,
        go: `func getSneakyNumbers(nums []int) []int {\n\tcount := make([]int, len(nums))\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tout := []int{}\n\tfor v := 0; v < len(count); v++ {\n\t\tif count[v] == 2 {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun getSneakyNumbers(nums: IntArray): IntArray {\n    val count = IntArray(nums.size)\n    for (x in nums) count[x]++\n    val out = ArrayList<Int>()\n    for (v in count.indices) {\n        if (count[v] == 2) out.add(v)\n    }\n    return out.toIntArray()\n}`,
        swift: `func getSneakyNumbers(_ nums: [Int]) -> [Int] {\n    var count = [Int](repeating: 0, count: nums.count)\n    for x in nums { count[x] += 1 }\n    var out: [Int] = []\n    for v in 0..<count.count {\n        if count[v] == 2 { out.append(v) }\n    }\n    return out\n}`,
        rust: `fn getSneakyNumbers(nums: Vec<i32>) -> Vec<i32> {\n    let mut count = vec![0; nums.len()];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for v in 0..count.len() {\n        if count[v] == 2 {\n            out.push(v as i32);\n        }\n    }\n    out\n}`,
        php: `function getSneakyNumbers($nums) {\n    $count = array_fill(0, count($nums), 0);\n    foreach ($nums as $x) $count[$x]++;\n    $out = array();\n    for ($v = 0; $v < count($count); $v++) {\n        if ($count[$v] === 2) $out[] = $v;\n    }\n    return $out;\n}`,
        ruby: `def getSneakyNumbers(nums)\n  count = Array.new(nums.length, 0)\n  nums.each { |x| count[x] += 1 }\n  (0...count.length).select { |v| count[v] == 2 }\nend`,
      },
    };
  })(),

  // ── Find the Peaks (LC 2951) ────────────────────────────────────
  (() => {
    const ref = (mountain: number[]) => {
      const out: number[] = [];
      for (let i = 1; i + 1 < mountain.length; i++) {
        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-the-peaks",
      title: "Find the Peaks",
      difficulty: "EASY" as const,
      tags: ["Array", "Enumeration", "TCS", "Accenture"],
      signature: { funcName: "findPeaks", params: [{ name: "mountain", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `mountain` of heights. An index `i` is a **peak** when `mountain[i]` is strictly greater than both of its neighbours.\n\nThe first and last indices are **never** peaks — they have only one neighbour. Return every peak index in increasing order.",
        [
          { in: "mountain = [2,4,4]", out: "[]", note: "Index 1 is not a peak because 4 is not strictly greater than the 4 on its right." },
          { in: "mountain = [1,4,3,8,5]", out: "[1,3]", note: "4 beats 1 and 3; 8 beats 3 and 5. Indices 0 and 4 are excluded by the rule." },
          { in: "mountain = [5,5,5,5]", out: "[]" },
        ],
        ["3 <= mountain.length <= 100", "1 <= mountain[i] <= 100"]),
      hints: [
        "The definition is purely local — one index only ever needs its two neighbours.",
        "Loop `i` from `1` to `n - 2` so the neighbour lookups are always in range.",
        "`>` and not `>=`: a plateau is not a peak.",
      ],
      editorial: explain({
        idea: "A peak is a local condition, so a single sweep that never touches the two ends answers the whole question.",
        steps: [
          "Run `i` from `1` up to `n - 2` inclusive.",
          "Record `i` when `mountain[i] > mountain[i - 1]` **and** `mountain[i] > mountain[i + 1]`.",
          "Return the recorded indices; the loop order already makes them increasing.",
        ],
        why: "Restricting the loop to the interior is the statement's own rule that the endpoints cannot qualify, and testing both neighbours is the definition verbatim, so nothing is missed and nothing extra is reported.",
        time: "O(n)",
        space: "O(1) beyond the output",
        pitfalls: [
          "Using `>=` turns a flat run such as `[2,4,4]` into a false peak.",
          "Looping from `0` or to `n - 1` reads out of bounds — or, worse, silently reads a default value.",
        ],
      }),
      examples: [
        { input: "[2,4,4]", expectedOutput: "[]" },
        { input: "[1,4,3,8,5]", expectedOutput: "[1,3]" },
        { input: "[5,5,5,5]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 40);
        const hi = rng() < 0.4 ? 4 : 100;
        const mountain = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(mountain), expectedOutput: fmtIntArr(ref(mountain)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findPeaks(mountain: List[int]) -> List[int]:\n    out = []\n    for i in range(1, len(mountain) - 1):\n        if mountain[i] > mountain[i - 1] and mountain[i] > mountain[i + 1]:\n            out.append(i)\n    return out`,
        javascript: `var findPeaks = function(mountain) {\n    var out = [];\n    for (var i = 1; i + 1 < mountain.length; i++) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.push(i);\n    }\n    return out;\n};`,
        typescript: `function findPeaks(mountain: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 1; i + 1 < mountain.length; i++) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.push(i);\n    }\n    return out;\n}`,
        java: `public static int[] findPeaks(int[] mountain) {\n    List<Integer> out = new ArrayList<>();\n    for (int i = 1; i + 1 < mountain.length; i++) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.add(i);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
        cpp: `vector<int> findPeaks(vector<int>& mountain) {\n    vector<int> out;\n    for (int i = 1; i + 1 < (int) mountain.size(); i++) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.push_back(i);\n    }\n    return out;\n}`,
        c: `int* findPeaks(int* mountain, int mountainSize, int* returnSize) {\n    int* out = (int*) malloc((size_t) (mountainSize > 0 ? mountainSize : 1) * sizeof(int));\n    int m = 0;\n    for (int i = 1; i + 1 < mountainSize; i++) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out[m++] = i;\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] FindPeaks(int[] mountain)\n{\n    var out_ = new List<int>();\n    for (int i = 1; i + 1 < mountain.Length; i++)\n    {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out_.Add(i);\n    }\n    return out_.ToArray();\n}`,
        go: `func findPeaks(mountain []int) []int {\n\tout := []int{}\n\tfor i := 1; i+1 < len(mountain); i++ {\n\t\tif mountain[i] > mountain[i-1] && mountain[i] > mountain[i+1] {\n\t\t\tout = append(out, i)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findPeaks(mountain: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    for (i in 1 until mountain.size - 1) {\n        if (mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]) out.add(i)\n    }\n    return out.toIntArray()\n}`,
        swift: `func findPeaks(_ mountain: [Int]) -> [Int] {\n    var out: [Int] = []\n    var i = 1\n    while i + 1 < mountain.count {\n        if mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1] { out.append(i) }\n        i += 1\n    }\n    return out\n}`,
        rust: `fn findPeaks(mountain: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for i in 1..mountain.len().saturating_sub(1) {\n        if mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1] {\n            out.push(i as i32);\n        }\n    }\n    out\n}`,
        php: `function findPeaks($mountain) {\n    $out = array();\n    for ($i = 1; $i + 1 < count($mountain); $i++) {\n        if ($mountain[$i] > $mountain[$i - 1] && $mountain[$i] > $mountain[$i + 1]) $out[] = $i;\n    }\n    return $out;\n}`,
        ruby: `def findPeaks(mountain)\n  out = []\n  (1...(mountain.length - 1)).each do |i|\n    out << i if mountain[i] > mountain[i - 1] && mountain[i] > mountain[i + 1]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Maximum Ascending Subarray Sum (LC 1800) ────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = nums[0], run = nums[0];
      for (let i = 1; i < nums.length; i++) {
        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];
        if (run > best) best = run;
      }
      return best;
    };
    return {
      slug: "maximum-ascending-subarray-sum",
      title: "Maximum Ascending Subarray Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Infosys", "Capgemini", "Amazon"],
      signature: { funcName: "maxAscendingSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **ascending** when every element is strictly greater than the one before it. A single element is ascending by itself.\n\nGiven an array `nums`, return the largest sum of any ascending **contiguous** subarray.",
        [
          { in: "nums = [10,20,30,5,10,50]", out: "65", note: "The run [5,10,50] sums to 65, beating [10,20,30] at 60." },
          { in: "nums = [10,20,30,40,50]", out: "150", note: "The whole array ascends." },
          { in: "nums = [12,17,15,13,10,11,12]", out: "33", note: "[10,11,12] sums to 33." },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "An ascending run ends the moment `nums[i] <= nums[i-1]` — that is the only place a new run can start.",
        "Carry the running sum of the current run and the best sum seen so far.",
        "Reset the running sum to `nums[i]`, not to zero, when the run breaks.",
      ],
      editorial: explain({
        idea: "The array splits uniquely into maximal ascending runs, and a best ascending subarray is always a whole run — extending a run only adds positive values. So one pass that sums each run and keeps the maximum is enough.",
        steps: [
          "Start `run` and `best` at `nums[0]`.",
          "For each later `i`, if `nums[i] > nums[i-1]` the run continues, so `run += nums[i]`; otherwise a new run begins at `run = nums[i]`.",
          "Update `best = max(best, run)` after each step.",
        ],
        why: "All values are positive, so within a run the sum is maximised by taking the run entirely. Because runs are maximal and disjoint, taking the best over all of them is the global answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Resetting `run` to `0` loses the element that starts the new run.",
          "`>=` would let a flat pair such as `[3,3]` count as ascending.",
        ],
      }),
      examples: [
        { input: "[10,20,30,5,10,50]", expectedOutput: "65" },
        { input: "[10,20,30,40,50]", expectedOutput: "150" },
        { input: "[12,17,15,13,10,11,12]", expectedOutput: "33" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const hi = rng() < 0.4 ? 6 : 100;
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxAscendingSum(nums: List[int]) -> int:\n    best = run = nums[0]\n    for i in range(1, len(nums)):\n        run = run + nums[i] if nums[i] > nums[i - 1] else nums[i]\n        if run > best:\n            best = run\n    return best`,
        javascript: `var maxAscendingSum = function(nums) {\n    var best = nums[0], run = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n};`,
        typescript: `function maxAscendingSum(nums: number[]): number {\n    var best = nums[0], run = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n}`,
        java: `public static int maxAscendingSum(int[] nums) {\n    int best = nums[0], run = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n}`,
        cpp: `int maxAscendingSum(vector<int>& nums) {\n    int best = nums[0], run = nums[0];\n    for (int i = 1; i < (int) nums.size(); i++) {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n}`,
        c: `int maxAscendingSum(int* nums, int numsSize) {\n    int best = nums[0], run = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n}`,
        csharp: `public static int MaxAscendingSum(int[] nums)\n{\n    int best = nums[0], run = nums[0];\n    for (int i = 1; i < nums.Length; i++)\n    {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i];\n        if (run > best) best = run;\n    }\n    return best;\n}`,
        go: `func maxAscendingSum(nums []int) int {\n\tbest, run := nums[0], nums[0]\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i] > nums[i-1] {\n\t\t\trun += nums[i]\n\t\t} else {\n\t\t\trun = nums[i]\n\t\t}\n\t\tif run > best {\n\t\t\tbest = run\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxAscendingSum(nums: IntArray): Int {\n    var best = nums[0]\n    var run = nums[0]\n    for (i in 1 until nums.size) {\n        run = if (nums[i] > nums[i - 1]) run + nums[i] else nums[i]\n        if (run > best) best = run\n    }\n    return best\n}`,
        swift: `func maxAscendingSum(_ nums: [Int]) -> Int {\n    var best = nums[0]\n    var run = nums[0]\n    for i in 1..<max(nums.count, 1) where i < nums.count {\n        run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i]\n        if run > best { best = run }\n    }\n    return best\n}`,
        rust: `fn maxAscendingSum(nums: Vec<i32>) -> i32 {\n    let mut best = nums[0];\n    let mut run = nums[0];\n    for i in 1..nums.len() {\n        run = if nums[i] > nums[i - 1] { run + nums[i] } else { nums[i] };\n        if run > best {\n            best = run;\n        }\n    }\n    best\n}`,
        php: `function maxAscendingSum($nums) {\n    $best = $nums[0];\n    $run = $nums[0];\n    for ($i = 1; $i < count($nums); $i++) {\n        $run = $nums[$i] > $nums[$i - 1] ? $run + $nums[$i] : $nums[$i];\n        if ($run > $best) $best = $run;\n    }\n    return $best;\n}`,
        ruby: `def maxAscendingSum(nums)\n  best = nums[0]\n  run = nums[0]\n  (1...nums.length).each do |i|\n    run = nums[i] > nums[i - 1] ? run + nums[i] : nums[i]\n    best = run if run > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find the Distinct Difference Array (LC 2670) ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const pre: Record<string, boolean> = {}, suf: Record<string, boolean> = {};
        let a = 0, b = 0;
        for (let j = 0; j <= i; j++) { if (pre[String(nums[j])] !== true) { pre[String(nums[j])] = true; a++; } }
        for (let j = i + 1; j < n; j++) { if (suf[String(nums[j])] !== true) { suf[String(nums[j])] = true; b++; } }
        out.push(a - b);
      }
      return out;
    };
    return {
      slug: "find-the-distinct-difference-array",
      title: "Find the Distinct Difference Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Wipro"],
      signature: { funcName: "distinctDifferenceArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For a 0-indexed array `nums` of length `n`, the **distinct difference array** `diff` also has length `n`, and\n\n`diff[i]` = (number of distinct values in the prefix `nums[0..i]`) − (number of distinct values in the suffix `nums[i+1..n-1]`).\n\nAn empty suffix contributes `0`. Return `diff`.",
        [
          { in: "nums = [1,2,3,4,5]", out: "[-3,-1,1,3,5]", note: "At i = 0 the prefix has 1 distinct value and the suffix has 4, so diff[0] = 1 - 4 = -3." },
          { in: "nums = [3,2,3,4,2]", out: "[-2,-1,0,2,3]", note: "At i = 2 the prefix {3,2} has 2 distinct values and the suffix {4,2} has 2, so diff[2] = 0." },
          { in: "nums = [7]", out: "[1]", note: "The suffix is empty." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "Two quantities per index: distinct in the prefix, distinct in the suffix.",
        "One right-to-left pass can precompute every suffix count into an array.",
        "Then a left-to-right pass grows the prefix set and subtracts the precomputed suffix count.",
      ],
      editorial: explain({
        idea: "The two halves move in opposite directions, so precompute one of them. A right-to-left pass records how many distinct values sit strictly after each index; a left-to-right pass then grows the prefix set and subtracts.",
        steps: [
          "Sweep `i` from `n - 1` down to `0`, inserting `nums[i]` into a set **after** recording `sufCount[i]` — the size of the set covering `nums[i+1..]`.",
          "Sweep `i` from `0` upward, inserting `nums[i]` into a second set first, so its size is the prefix distinct count for `nums[0..i]`.",
          "Write `diff[i] = prefixSize - sufCount[i]`.",
        ],
        why: "Each pass maintains exactly the set the definition names, and because a set is inserted into before (or after) the read in the right order, the count read at index `i` covers precisely the half the statement describes.",
        time: "O(n) with hashing — the O(n²) recount also passes at these limits",
        space: "O(n)",
        pitfalls: [
          "Recording the suffix count *after* inserting `nums[i]` includes `nums[i]` itself, which the definition excludes.",
          "The last suffix is empty and must contribute `0`, not `1`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "[-3,-1,1,3,5]" },
        { input: "[3,2,3,4,2]", expectedOutput: "[-2,-1,0,2,3]" },
        { input: "[7]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.5 ? 5 : 50;
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef distinctDifferenceArray(nums: List[int]) -> List[int]:\n    n = len(nums)\n    suf = [0] * (n + 1)\n    seen = set()\n    for i in range(n - 1, -1, -1):\n        suf[i] = len(seen)\n        seen.add(nums[i])\n    out = []\n    pre = set()\n    for i in range(n):\n        pre.add(nums[i])\n        out.append(len(pre) - suf[i])\n    return out`,
        javascript: `var distinctDifferenceArray = function(nums) {\n    var n = nums.length;\n    var suf = [];\n    for (var t = 0; t <= n; t++) suf.push(0);\n    var seen = {}, sc = 0;\n    for (var i = n - 1; i >= 0; i--) {\n        suf[i] = sc;\n        if (seen[String(nums[i])] !== true) { seen[String(nums[i])] = true; sc++; }\n    }\n    var out = [], pre = {}, pc = 0;\n    for (var j = 0; j < n; j++) {\n        if (pre[String(nums[j])] !== true) { pre[String(nums[j])] = true; pc++; }\n        out.push(pc - suf[j]);\n    }\n    return out;\n};`,
        typescript: `function distinctDifferenceArray(nums: number[]): number[] {\n    var n = nums.length;\n    var suf: number[] = [];\n    for (var t = 0; t <= n; t++) suf.push(0);\n    var seen: { [key: string]: boolean } = {}, sc = 0;\n    for (var i = n - 1; i >= 0; i--) {\n        suf[i] = sc;\n        if (seen[String(nums[i])] !== true) { seen[String(nums[i])] = true; sc++; }\n    }\n    var out: number[] = [], pre: { [key: string]: boolean } = {}, pc = 0;\n    for (var j = 0; j < n; j++) {\n        if (pre[String(nums[j])] !== true) { pre[String(nums[j])] = true; pc++; }\n        out.push(pc - suf[j]);\n    }\n    return out;\n}`,
        java: `public static int[] distinctDifferenceArray(int[] nums) {\n    int n = nums.length;\n    int[] suf = new int[n + 1];\n    Set<Integer> seen = new HashSet<>();\n    for (int i = n - 1; i >= 0; i--) {\n        suf[i] = seen.size();\n        seen.add(nums[i]);\n    }\n    int[] out = new int[n];\n    Set<Integer> pre = new HashSet<>();\n    for (int i = 0; i < n; i++) {\n        pre.add(nums[i]);\n        out[i] = pre.size() - suf[i];\n    }\n    return out;\n}`,
        cpp: `vector<int> distinctDifferenceArray(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> suf(n + 1, 0);\n    unordered_set<int> seen;\n    for (int i = n - 1; i >= 0; i--) {\n        suf[i] = (int) seen.size();\n        seen.insert(nums[i]);\n    }\n    vector<int> out(n);\n    unordered_set<int> pre;\n    for (int i = 0; i < n; i++) {\n        pre.insert(nums[i]);\n        out[i] = (int) pre.size() - suf[i];\n    }\n    return out;\n}`,
        c: `int* distinctDifferenceArray(int* nums, int numsSize, int* returnSize) {\n    int* suf = (int*) calloc((size_t) numsSize + 1, sizeof(int));\n    int mark[64];\n    for (int i = 0; i < 64; i++) mark[i] = 0;\n    int sc = 0;\n    for (int i = numsSize - 1; i >= 0; i--) {\n        suf[i] = sc;\n        if (!mark[nums[i]]) { mark[nums[i]] = 1; sc++; }\n    }\n    for (int i = 0; i < 64; i++) mark[i] = 0;\n    int* out = (int*) malloc((size_t) numsSize * sizeof(int));\n    int pc = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (!mark[nums[i]]) { mark[nums[i]] = 1; pc++; }\n        out[i] = pc - suf[i];\n    }\n    free(suf);\n    *returnSize = numsSize;\n    return out;\n}`,
        csharp: `public static int[] DistinctDifferenceArray(int[] nums)\n{\n    int n = nums.Length;\n    int[] suf = new int[n + 1];\n    var seen = new HashSet<int>();\n    for (int i = n - 1; i >= 0; i--)\n    {\n        suf[i] = seen.Count;\n        seen.Add(nums[i]);\n    }\n    int[] out_ = new int[n];\n    var pre = new HashSet<int>();\n    for (int i = 0; i < n; i++)\n    {\n        pre.Add(nums[i]);\n        out_[i] = pre.Count - suf[i];\n    }\n    return out_;\n}`,
        go: `func distinctDifferenceArray(nums []int) []int {\n\tn := len(nums)\n\tsuf := make([]int, n+1)\n\tseen := map[int]bool{}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tsuf[i] = len(seen)\n\t\tseen[nums[i]] = true\n\t}\n\tout := make([]int, n)\n\tpre := map[int]bool{}\n\tfor i := 0; i < n; i++ {\n\t\tpre[nums[i]] = true\n\t\tout[i] = len(pre) - suf[i]\n\t}\n\treturn out\n}`,
        kotlin: `fun distinctDifferenceArray(nums: IntArray): IntArray {\n    val n = nums.size\n    val suf = IntArray(n + 1)\n    val seen = HashSet<Int>()\n    for (i in n - 1 downTo 0) {\n        suf[i] = seen.size\n        seen.add(nums[i])\n    }\n    val out = IntArray(n)\n    val pre = HashSet<Int>()\n    for (i in 0 until n) {\n        pre.add(nums[i])\n        out[i] = pre.size - suf[i]\n    }\n    return out\n}`,
        swift: `func distinctDifferenceArray(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var suf = [Int](repeating: 0, count: n + 1)\n    var seen = Set<Int>()\n    var i = n - 1\n    while i >= 0 {\n        suf[i] = seen.count\n        seen.insert(nums[i])\n        i -= 1\n    }\n    var out = [Int](repeating: 0, count: n)\n    var pre = Set<Int>()\n    for j in 0..<n {\n        pre.insert(nums[j])\n        out[j] = pre.count - suf[j]\n    }\n    return out\n}`,
        rust: `fn distinctDifferenceArray(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut suf = vec![0i32; n + 1];\n    let mut seen: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    for i in (0..n).rev() {\n        suf[i] = seen.len() as i32;\n        seen.insert(nums[i]);\n    }\n    let mut out = vec![0i32; n];\n    let mut pre: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    for i in 0..n {\n        pre.insert(nums[i]);\n        out[i] = pre.len() as i32 - suf[i];\n    }\n    out\n}`,
        php: `function distinctDifferenceArray($nums) {\n    $n = count($nums);\n    $suf = array_fill(0, $n + 1, 0);\n    $seen = array();\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $suf[$i] = count($seen);\n        $seen[$nums[$i]] = true;\n    }\n    $out = array();\n    $pre = array();\n    for ($i = 0; $i < $n; $i++) {\n        $pre[$nums[$i]] = true;\n        $out[] = count($pre) - $suf[$i];\n    }\n    return $out;\n}`,
        ruby: `def distinctDifferenceArray(nums)\n  n = nums.length\n  suf = Array.new(n + 1, 0)\n  seen = {}\n  (n - 1).downto(0) do |i|\n    suf[i] = seen.size\n    seen[nums[i]] = true\n  end\n  out = []\n  pre = {}\n  (0...n).each do |i|\n    pre[nums[i]] = true\n    out << pre.size - suf[i]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Sum of Values at Indices With K Set Bits (LC 2859) ──────────
  (() => {
    const popcount = (x: number) => { let c = 0; while (x > 0) { c += x & 1; x >>= 1; } return c; };
    const ref = (nums: number[], k: number) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++) { if (popcount(i) === k) total += nums[i]; }
      return total;
    };
    return {
      slug: "sum-of-values-at-indices-with-k-set-bits",
      title: "Sum of Values at Indices With K Set Bits",
      difficulty: "EASY" as const,
      tags: ["Array", "Bit Manipulation", "Adobe", "Zoho"],
      signature: { funcName: "sumIndicesWithKSetBits", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a 0-indexed array `nums` and an integer `k`.\n\nReturn the sum of `nums[i]` over every **index** `i` whose binary representation contains exactly `k` set bits (ones). The values in `nums` are irrelevant to the test — only the index matters.",
        [
          { in: "nums = [5,10,1,5,2], k = 1", out: "13", note: "Indices with one set bit are 1 (binary 1), 2 (binary 10) and 4 (binary 100): 10 + 1 + 2 = 13." },
          { in: "nums = [4,3,2,1], k = 2", out: "1", note: "Only index 3 (binary 11) has two set bits." },
          { in: "nums = [9,8,7], k = 0", out: "9", note: "Index 0 is the only index with no set bits." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 100000", "0 <= k <= 10"]),
      hints: [
        "Iterate over indices, not values — the condition is a property of `i`.",
        "Counting set bits is a loop of `x & 1` followed by `x >>= 1`.",
        "`k = 0` selects exactly one index: zero.",
      ],
      editorial: explain({
        idea: "The filter is a property of the index, so walk the indices, count the ones in each index's binary form, and add the value when the count matches.",
        steps: [
          "Write a helper that counts set bits: while `x > 0`, add `x & 1` and shift `x` right by one.",
          "Loop `i` from `0` to `n - 1`.",
          "When the helper returns `k`, add `nums[i]` to the running total.",
        ],
        why: "Every index is tested exactly once against the exact predicate the statement gives, so the total is the sum over precisely the qualifying indices.",
        time: "O(n log n) — the bit loop runs at most log n times per index",
        space: "O(1)",
        pitfalls: [
          "Counting the bits of `nums[i]` instead of `i` — the values are deliberately noisy to punish that.",
          "A `while (x)` loop that shifts a negative number never ends; indices are non-negative, so this is safe here but worth knowing.",
        ],
      }),
      examples: [
        { input: "[5,10,1,5,2]\n1", expectedOutput: "13" },
        { input: "[4,3,2,1]\n2", expectedOutput: "1" },
        { input: "[9,8,7]\n0", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 120);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 100000));
        const k = ri(rng, 0, 6);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumIndicesWithKSetBits(nums: List[int], k: int) -> int:\n    total = 0\n    for i, v in enumerate(nums):\n        if bin(i).count("1") == k:\n            total += v\n    return total`,
        javascript: `var sumIndicesWithKSetBits = function(nums, k) {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var x = i, c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        if (c === k) total += nums[i];\n    }\n    return total;\n};`,
        typescript: `function sumIndicesWithKSetBits(nums: number[], k: number): number {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var x = i, c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        if (c === k) total += nums[i];\n    }\n    return total;\n}`,
        java: `public static int sumIndicesWithKSetBits(int[] nums, int k) {\n    int total = 0;\n    for (int i = 0; i < nums.length; i++) {\n        if (Integer.bitCount(i) == k) total += nums[i];\n    }\n    return total;\n}`,
        cpp: `int sumIndicesWithKSetBits(vector<int>& nums, int k) {\n    int total = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (__builtin_popcount((unsigned) i) == k) total += nums[i];\n    }\n    return total;\n}`,
        c: `int sumIndicesWithKSetBits(int* nums, int numsSize, int k) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int x = i, c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        if (c == k) total += nums[i];\n    }\n    return total;\n}`,
        csharp: `public static int SumIndicesWithKSetBits(int[] nums, int k)\n{\n    int total = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int x = i, c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        if (c == k) total += nums[i];\n    }\n    return total;\n}`,
        go: `func sumIndicesWithKSetBits(nums []int, k int) int {\n\ttotal := 0\n\tfor i := 0; i < len(nums); i++ {\n\t\tif bits.OnesCount(uint(i)) == k {\n\t\t\ttotal += nums[i]\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun sumIndicesWithKSetBits(nums: IntArray, k: Int): Int {\n    var total = 0\n    for (i in nums.indices) {\n        if (Integer.bitCount(i) == k) total += nums[i]\n    }\n    return total\n}`,
        swift: `func sumIndicesWithKSetBits(_ nums: [Int], _ k: Int) -> Int {\n    var total = 0\n    for i in 0..<nums.count {\n        if i.nonzeroBitCount == k { total += nums[i] }\n    }\n    return total\n}`,
        rust: `fn sumIndicesWithKSetBits(nums: Vec<i32>, k: i32) -> i32 {\n    let mut total = 0;\n    for i in 0..nums.len() {\n        if (i as u32).count_ones() as i32 == k {\n            total += nums[i];\n        }\n    }\n    total\n}`,
        php: `function sumIndicesWithKSetBits($nums, $k) {\n    $total = 0;\n    for ($i = 0; $i < count($nums); $i++) {\n        $x = $i;\n        $c = 0;\n        while ($x > 0) { $c += $x & 1; $x >>= 1; }\n        if ($c === $k) $total += $nums[$i];\n    }\n    return $total;\n}`,
        ruby: `def sumIndicesWithKSetBits(nums, k)\n  total = 0\n  nums.each_with_index do |v, i|\n    total += v if i.to_s(2).count("1") == k\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Divide Array Into Arrays With Max Difference (LC 2966) ──────
  (() => {
    const ref = (nums: number[], k: number) => {
      const s = nums.slice().sort((a, b) => a - b);
      const out: number[][] = [];
      for (let i = 0; i < s.length; i += 3) {
        if (s[i + 2] - s[i] > k) return [];
        out.push([s[i], s[i + 1], s[i + 2]]);
      }
      return out;
    };
    return {
      slug: "divide-array-into-arrays-with-max-difference",
      title: "Divide Array Into Arrays With Max Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Flipkart"],
      signature: { funcName: "divideArray", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an array `nums` whose length is a multiple of `3`, and an integer `k`. Split every element into groups of exactly **three** so that in each group the difference between any two elements is at most `k`.\n\nReturn the groups, each group sorted ascending, and the groups themselves ordered by their smallest element. If no such split exists, return `[]`.",
        [
          { in: "nums = [1,3,4,8,7,9,3,5,1], k = 2", out: "[[1,1,3],[3,4,5],[7,8,9]]", note: "Every group spans at most 2." },
          { in: "nums = [2,4,2,2,5,2], k = 2", out: "[]", note: "Sorted it reads 2,2,2,2,4,5 — the group 2,4,5 spans 3, and no arrangement does better." },
          { in: "nums = [4,2,9,8,2,12,7,12,10,5,8,5,5,7,9,2,5,11], k = 14", out: "[[2,2,2],[4,5,5],[5,5,7],[7,8,8],[9,9,10],[11,12,12]]" },
        ],
        ["nums.length is a multiple of 3", "3 <= nums.length <= 300", "1 <= nums[i] <= 100000", "1 <= k <= 100000"]),
      hints: [
        "Sort first. Once sorted, the span of a group is its last element minus its first.",
        "Adjacent triples in sorted order are the best possible grouping — pulling elements apart can only widen some group.",
        "Check `s[i+2] - s[i] <= k` for each triple; one failure kills the whole split.",
      ],
      editorial: explain({
        idea: "Sort, then take consecutive triples. Any valid split must group values that are close together, and sorted order already puts the closest values side by side — so if consecutive triples fail, nothing works.",
        steps: [
          "Sort `nums` ascending into `s`.",
          "Walk `i` in steps of three. The triple is `s[i], s[i+1], s[i+2]`, already ascending.",
          "If `s[i+2] - s[i] > k`, return `[]` immediately.",
          "Otherwise append the triple and continue.",
        ],
        why: "Exchange argument: take any valid split and sort it; if some group is not three consecutive sorted elements, two groups interleave, and swapping the offending elements back into consecutive positions never increases either group's span. Repeating the swap reaches the consecutive-triple split, so it is valid whenever anything is.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Comparing only neighbouring pairs inside a triple misses the first-to-last span, which is the real constraint.",
          "Returning partial groups before discovering a failing triple — the answer is all-or-nothing.",
        ],
      }),
      examples: [
        { input: "[1,3,4,8,7,9,3,5,1]\n2", expectedOutput: "[[1,1,3],[3,4,5],[7,8,9]]" },
        { input: "[2,4,2,2,5,2]\n2", expectedOutput: "[]" },
        { input: "[4,2,9,8,2,12,7,12,10,5,8,5,5,7,9,2,5,11]\n14", expectedOutput: "[[2,2,2],[4,5,5],[5,5,7],[7,8,8],[9,9,10],[11,12,12]]" },
      ],
      gen: (rng: Rng) => {
        const groups = ri(rng, 1, 20);
        const hi = rng() < 0.5 ? 20 : 100000;
        const nums = Array.from({ length: groups * 3 }, () => ri(rng, 1, hi));
        const k = rng() < 0.4 ? ri(rng, 1, 5) : ri(rng, 1, hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntMat(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef divideArray(nums: List[int], k: int) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n    for i in range(0, len(s), 3):\n        if s[i + 2] - s[i] > k:\n            return []\n        out.append([s[i], s[i + 1], s[i + 2]])\n    return out`,
        javascript: `var divideArray = function(nums, k) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var out = [];\n    for (var i = 0; i < s.length; i += 3) {\n        if (s[i + 2] - s[i] > k) return [];\n        out.push([s[i], s[i + 1], s[i + 2]]);\n    }\n    return out;\n};`,
        typescript: `function divideArray(nums: number[], k: number): number[][] {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var out: number[][] = [];\n    for (var i = 0; i < s.length; i += 3) {\n        if (s[i + 2] - s[i] > k) return [];\n        out.push([s[i], s[i + 1], s[i + 2]]);\n    }\n    return out;\n}`,
        java: `public static int[][] divideArray(int[] nums, int k) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int groups = s.length / 3;\n    int[][] out = new int[groups][3];\n    for (int i = 0, g = 0; i < s.length; i += 3, g++) {\n        if (s[i + 2] - s[i] > k) return new int[0][];\n        out[g][0] = s[i];\n        out[g][1] = s[i + 1];\n        out[g][2] = s[i + 2];\n    }\n    return out;\n}`,
        cpp: `vector<vector<int>> divideArray(vector<int>& nums, int k) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    vector<vector<int>> out;\n    for (size_t i = 0; i < s.size(); i += 3) {\n        if (s[i + 2] - s[i] > k) return {};\n        out.push_back({ s[i], s[i + 1], s[i + 2] });\n    }\n    return out;\n}`,
        c: `static int cmpDivAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint** divideArray(int* nums, int numsSize, int k, int* returnSize, int** returnColumnSizes) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpDivAsc);\n    for (int i = 0; i < numsSize; i += 3) {\n        if (s[i + 2] - s[i] > k) {\n            free(s);\n            *returnSize = 0;\n            *returnColumnSizes = (int*) malloc(sizeof(int));\n            return (int**) malloc(sizeof(int*));\n        }\n    }\n    int groups = numsSize / 3;\n    int** out = (int**) malloc((size_t) (groups > 0 ? groups : 1) * sizeof(int*));\n    int* cols = (int*) malloc((size_t) (groups > 0 ? groups : 1) * sizeof(int));\n    for (int g = 0; g < groups; g++) {\n        int* row = (int*) malloc(3 * sizeof(int));\n        row[0] = s[g * 3];\n        row[1] = s[g * 3 + 1];\n        row[2] = s[g * 3 + 2];\n        out[g] = row;\n        cols[g] = 3;\n    }\n    free(s);\n    *returnSize = groups;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] DivideArray(int[] nums, int k)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    var out_ = new List<int[]>();\n    for (int i = 0; i < s.Length; i += 3)\n    {\n        if (s[i + 2] - s[i] > k) return new int[0][];\n        out_.Add(new int[] { s[i], s[i + 1], s[i + 2] });\n    }\n    return out_.ToArray();\n}`,
        go: `func divideArray(nums []int, k int) [][]int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tout := [][]int{}\n\tfor i := 0; i < len(s); i += 3 {\n\t\tif s[i+2]-s[i] > k {\n\t\t\treturn [][]int{}\n\t\t}\n\t\tout = append(out, []int{s[i], s[i+1], s[i+2]})\n\t}\n\treturn out\n}`,
        kotlin: `fun divideArray(nums: IntArray, k: Int): Array<IntArray> {\n    val s = nums.sortedArray()\n    val out = ArrayList<IntArray>()\n    var i = 0\n    while (i < s.size) {\n        if (s[i + 2] - s[i] > k) return arrayOf()\n        out.add(intArrayOf(s[i], s[i + 1], s[i + 2]))\n        i += 3\n    }\n    return out.toTypedArray()\n}`,
        swift: `func divideArray(_ nums: [Int], _ k: Int) -> [[Int]] {\n    let s = nums.sorted()\n    var out: [[Int]] = []\n    var i = 0\n    while i < s.count {\n        if s[i + 2] - s[i] > k { return [] }\n        out.append([s[i], s[i + 1], s[i + 2]])\n        i += 3\n    }\n    return out\n}`,
        rust: `fn divideArray(nums: Vec<i32>, k: i32) -> Vec<Vec<i32>> {\n    let mut s = nums.clone();\n    s.sort();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut i = 0;\n    while i < s.len() {\n        if s[i + 2] - s[i] > k {\n            return Vec::new();\n        }\n        out.push(vec![s[i], s[i + 1], s[i + 2]]);\n        i += 3;\n    }\n    out\n}`,
        php: `function divideArray($nums, $k) {\n    $s = $nums;\n    sort($s);\n    $out = array();\n    for ($i = 0; $i < count($s); $i += 3) {\n        if ($s[$i + 2] - $s[$i] > $k) return array();\n        $out[] = array($s[$i], $s[$i + 1], $s[$i + 2]);\n    }\n    return $out;\n}`,
        ruby: `def divideArray(nums, k)\n  s = nums.sort\n  out = []\n  i = 0\n  while i < s.length\n    return [] if s[i + 2] - s[i] > k\n    out << [s[i], s[i + 1], s[i + 2]]\n    i += 3\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Find the Array Concatenation Value (LC 2562) ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice();
      let i = 0, j = a.length - 1, total = 0;
      while (i < j) {
        total += Number(String(a[i]) + String(a[j]));
        i++; j--;
      }
      if (i === j) total += a[i];
      return total;
    };
    return {
      slug: "find-the-array-concatenation-value",
      title: "Find the Array Concatenation Value",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Simulation", "TCS", "Mindtree"],
      signature: { funcName: "findTheArrayConcVal", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **concatenation** of two integers is the number formed by writing the first and then the second, so concatenating `15` and `49` gives `1549`.\n\nRepeat until `nums` is empty: if at least two elements remain, remove the first and last, concatenate them in that order and add the result to a running total; if exactly one element remains, add it to the total and remove it.\n\nReturn the total.",
        [
          { in: "nums = [7,52,2,4]", out: "596", note: "7 and 4 concatenate to 74; then 52 and 2 concatenate to 522. 74 + 522 = 596." },
          { in: "nums = [5,14,13,8,12]", out: "673", note: "512 + 148 + 13 = 673 — 13 is the lone middle element." },
          { in: "nums = [9]", out: "9" },
        ],
        ["1 <= nums.length <= 30", "1 <= nums[i] <= 999"]),
      hints: [
        "Two pointers, one at each end, walking inward.",
        "Concatenation is easiest as string join then parse back, but `a * 10^digits(b) + b` avoids strings entirely.",
        "An odd-length array leaves a single middle element when the pointers meet — add it plain.",
      ],
      editorial: explain({
        idea: "Removing the first and last element repeatedly is exactly a two-pointer walk inward, so nothing needs to be deleted from the array at all.",
        steps: [
          "Set `i = 0` and `j = n - 1`.",
          "While `i < j`, add the concatenation of `nums[i]` and `nums[j]` to the total, then step `i` forward and `j` back.",
          "If `i == j` after the loop, one element is left — add it as it is.",
        ],
        why: "Each iteration consumes exactly the pair the statement removes, in the same order, so the running total matches the simulation step for step. The loop ends when fewer than two elements remain, which is precisely when the single-element rule applies.",
        time: "O(n · d) where d is the digit count",
        space: "O(1)",
        pitfalls: [
          "Concatenating in the wrong order — it is first-then-last, not last-then-first.",
          "Forgetting the lone middle element in an odd-length array.",
        ],
      }),
      examples: [
        { input: "[7,52,2,4]", expectedOutput: "596" },
        { input: "[5,14,13,8,12]", expectedOutput: "673" },
        { input: "[9]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = pick(rng, [9, 99, 999]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findTheArrayConcVal(nums: List[int]) -> int:\n    i, j = 0, len(nums) - 1\n    total = 0\n    while i < j:\n        total += int(str(nums[i]) + str(nums[j]))\n        i += 1\n        j -= 1\n    if i == j:\n        total += nums[i]\n    return total`,
        javascript: `var findTheArrayConcVal = function(nums) {\n    var i = 0, j = nums.length - 1, total = 0;\n    while (i < j) {\n        total += Number(String(nums[i]) + String(nums[j]));\n        i++;\n        j--;\n    }\n    if (i === j) total += nums[i];\n    return total;\n};`,
        typescript: `function findTheArrayConcVal(nums: number[]): number {\n    var i = 0, j = nums.length - 1, total = 0;\n    while (i < j) {\n        total += Number(String(nums[i]) + String(nums[j]));\n        i++;\n        j--;\n    }\n    if (i === j) total += nums[i];\n    return total;\n}`,
        java: `public static int findTheArrayConcVal(int[] nums) {\n    int i = 0, j = nums.length - 1, total = 0;\n    while (i < j) {\n        total += Integer.parseInt(String.valueOf(nums[i]) + String.valueOf(nums[j]));\n        i++;\n        j--;\n    }\n    if (i == j) total += nums[i];\n    return total;\n}`,
        cpp: `int findTheArrayConcVal(vector<int>& nums) {\n    int i = 0, j = (int) nums.size() - 1, total = 0;\n    while (i < j) {\n        total += stoi(to_string(nums[i]) + to_string(nums[j]));\n        i++;\n        j--;\n    }\n    if (i == j) total += nums[i];\n    return total;\n}`,
        c: `int findTheArrayConcVal(int* nums, int numsSize) {\n    int i = 0, j = numsSize - 1, total = 0;\n    while (i < j) {\n        int p = 1;\n        int b = nums[j];\n        while (b > 0) { p *= 10; b /= 10; }\n        total += nums[i] * p + nums[j];\n        i++;\n        j--;\n    }\n    if (i == j) total += nums[i];\n    return total;\n}`,
        csharp: `public static int FindTheArrayConcVal(int[] nums)\n{\n    int i = 0, j = nums.Length - 1, total = 0;\n    while (i < j)\n    {\n        total += int.Parse(nums[i].ToString() + nums[j].ToString());\n        i++;\n        j--;\n    }\n    if (i == j) total += nums[i];\n    return total;\n}`,
        go: `func findTheArrayConcVal(nums []int) int {\n\ti, j, total := 0, len(nums)-1, 0\n\tfor i < j {\n\t\tv, _ := strconv.Atoi(strconv.Itoa(nums[i]) + strconv.Itoa(nums[j]))\n\t\ttotal += v\n\t\ti++\n\t\tj--\n\t}\n\tif i == j {\n\t\ttotal += nums[i]\n\t}\n\treturn total\n}`,
        kotlin: `fun findTheArrayConcVal(nums: IntArray): Int {\n    var i = 0\n    var j = nums.size - 1\n    var total = 0\n    while (i < j) {\n        total += (nums[i].toString() + nums[j].toString()).toInt()\n        i++\n        j--\n    }\n    if (i == j) total += nums[i]\n    return total\n}`,
        swift: `func findTheArrayConcVal(_ nums: [Int]) -> Int {\n    var i = 0\n    var j = nums.count - 1\n    var total = 0\n    while i < j {\n        total += Int(String(nums[i]) + String(nums[j]))!\n        i += 1\n        j -= 1\n    }\n    if i == j { total += nums[i] }\n    return total\n}`,
        rust: `fn findTheArrayConcVal(nums: Vec<i32>) -> i32 {\n    let mut i = 0usize;\n    let mut j = nums.len() - 1;\n    let mut total = 0i32;\n    while i < j {\n        let joined = format!("{}{}", nums[i], nums[j]);\n        total += joined.parse::<i32>().unwrap();\n        i += 1;\n        j -= 1;\n    }\n    if i == j {\n        total += nums[i];\n    }\n    total\n}`,
        php: `function findTheArrayConcVal($nums) {\n    $i = 0;\n    $j = count($nums) - 1;\n    $total = 0;\n    while ($i < $j) {\n        $total += intval(strval($nums[$i]) . strval($nums[$j]));\n        $i++;\n        $j--;\n    }\n    if ($i === $j) $total += $nums[$i];\n    return $total;\n}`,
        ruby: `def findTheArrayConcVal(nums)\n  i = 0\n  j = nums.length - 1\n  total = 0\n  while i < j\n    total += (nums[i].to_s + nums[j].to_s).to_i\n    i += 1\n    j -= 1\n  end\n  total += nums[i] if i == j\n  total\nend`,
      },
    };
  })(),

  // ── Maximum Sum With Exactly K Elements (LC 2656) ───────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let m = nums[0];
      for (const x of nums) { if (x > m) m = x; }
      return k * m + (k * (k - 1)) / 2;
    };
    return {
      slug: "maximum-sum-with-exactly-k-elements",
      title: "Maximum Sum With Exactly K Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "TCS", "Capgemini"],
      signature: { funcName: "maximizeSum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You start with a score of `0` and repeat this operation exactly `k` times:\n\n1. pick the **largest** element of `nums` — call it `m`;\n2. add `m` to your score;\n3. append `m + 1` to `nums`.\n\nReturn the final score.",
        [
          { in: "nums = [1,2,3,4,5], k = 3", out: "18", note: "Take 5, then the appended 6, then the appended 7: 5 + 6 + 7 = 18." },
          { in: "nums = [5,5,5], k = 2", out: "11", note: "5 + 6 = 11 — duplicates of the maximum change nothing." },
          { in: "nums = [7], k = 1", out: "7" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 100", "1 <= k <= 100"]),
      hints: [
        "After the first pick, what is the new maximum?",
        "The maximum goes up by exactly one every round, forever.",
        "The score is `m + (m+1) + … + (m+k-1)`, an arithmetic series — no loop needed.",
      ],
      editorial: explain({
        idea: "The appended value `m + 1` is strictly larger than every element, so it is the next pick. The maxima form the run `m, m+1, …, m+k-1`, and their sum is an arithmetic series.",
        steps: [
          "Find `m`, the maximum of `nums`, in one pass.",
          "The score is `m + (m+1) + … + (m+k-1)`.",
          "Close the series: `k*m + k*(k-1)/2`.",
        ],
        why: "By induction, if the maximum before a round is `v` then the round appends `v + 1`, which becomes the unique new maximum; so round `t` (0-indexed) contributes `m + t`. Summing `t` from `0` to `k-1` gives the closed form.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Actually appending to the array and re-scanning is O(n·k) for no reason.",
          "`k*(k-1)/2` is exact in integers because `k*(k-1)` is always even — no floating point needed.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n3", expectedOutput: "18" },
        { input: "[5,5,5]\n2", expectedOutput: "11" },
        { input: "[7]\n1", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 80) }, () => ri(rng, 0, 100));
        const k = ri(rng, 1, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximizeSum(nums: List[int], k: int) -> int:\n    m = max(nums)\n    return k * m + k * (k - 1) // 2`,
        javascript: `var maximizeSum = function(nums, k) {\n    var m = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > m) m = nums[i];\n    }\n    return k * m + (k * (k - 1)) / 2;\n};`,
        typescript: `function maximizeSum(nums: number[], k: number): number {\n    var m = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > m) m = nums[i];\n    }\n    return k * m + (k * (k - 1)) / 2;\n}`,
        java: `public static int maximizeSum(int[] nums, int k) {\n    int m = nums[0];\n    for (int x : nums) {\n        if (x > m) m = x;\n    }\n    return k * m + k * (k - 1) / 2;\n}`,
        cpp: `int maximizeSum(vector<int>& nums, int k) {\n    int m = *max_element(nums.begin(), nums.end());\n    return k * m + k * (k - 1) / 2;\n}`,
        c: `int maximizeSum(int* nums, int numsSize, int k) {\n    int m = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] > m) m = nums[i];\n    }\n    return k * m + k * (k - 1) / 2;\n}`,
        csharp: `public static int MaximizeSum(int[] nums, int k)\n{\n    int m = nums.Max();\n    return k * m + k * (k - 1) / 2;\n}`,
        go: `func maximizeSum(nums []int, k int) int {\n\tm := nums[0]\n\tfor _, x := range nums {\n\t\tif x > m {\n\t\t\tm = x\n\t\t}\n\t}\n\treturn k*m + k*(k-1)/2\n}`,
        kotlin: `fun maximizeSum(nums: IntArray, k: Int): Int {\n    val m = nums.max()!!\n    return k * m + k * (k - 1) / 2\n}`,
        swift: `func maximizeSum(_ nums: [Int], _ k: Int) -> Int {\n    let m = nums.max()!\n    return k * m + k * (k - 1) / 2\n}`,
        rust: `fn maximizeSum(nums: Vec<i32>, k: i32) -> i32 {\n    let m = *nums.iter().max().unwrap();\n    k * m + k * (k - 1) / 2\n}`,
        php: `function maximizeSum($nums, $k) {\n    $m = max($nums);\n    return $k * $m + intdiv($k * ($k - 1), 2);\n}`,
        ruby: `def maximizeSum(nums, k)\n  m = nums.max\n  k * m + k * (k - 1) / 2\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Collect Elements (LC 2869) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const have: Record<string, boolean> = {};
      let got = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        const v = nums[i];
        if (v <= k && have[String(v)] !== true) { have[String(v)] = true; got++; }
        if (got === k) return nums.length - i;
      }
      return nums.length;
    };
    return {
      slug: "minimum-operations-to-collect-elements",
      title: "Minimum Operations to Collect Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Simulation", "Infosys", "Zoho"],
      signature: { funcName: "minOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers and an integer `k`.\n\nOne operation removes the **last** element of `nums` and puts it into your collection. Return the minimum number of operations after which your collection contains every number from `1` to `k`.\n\nThe input always makes this possible.",
        [
          { in: "nums = [3,1,5,4,2], k = 2", out: "4", note: "Removing 2, 4, 5, 1 collects both 1 and 2 after four operations." },
          { in: "nums = [3,1,5,4,2], k = 5", out: "5", note: "All five elements are needed." },
          { in: "nums = [3,2,5,3,1], k = 3", out: "4", note: "Removing 1, 3, 5, 2 covers 1, 2 and 3." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= nums.length", "1 <= k <= nums.length", "The input guarantees 1 through k all appear."]),
      hints: [
        "Operations always come off the back, so walk the array from right to left.",
        "Only values in `1..k` matter; anything larger is collected but never helps.",
        "Stop the moment you have seen `k` distinct qualifying values — the count of steps so far is the answer.",
      ],
      editorial: explain({
        idea: "The removal order is fixed — last to first — so there is nothing to choose. Scan right to left and stop at the first prefix (from the right) that covers `1..k`.",
        steps: [
          "Walk `i` from `n - 1` down to `0`, counting operations as `n - i`.",
          "If `nums[i] <= k` and it has not been seen, mark it and increment `got`.",
          "As soon as `got == k`, return `n - i`.",
        ],
        why: "Every strategy performs the same removals in the same order, so the cost of collecting `1..k` is exactly the position of the earliest suffix containing all of them. Scanning right to left finds that suffix at its first occurrence, which is minimal by construction.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Counting values greater than `k` towards the goal — they never satisfy the requirement.",
          "Counting duplicates twice; the goal is `k` *distinct* values.",
        ],
      }),
      examples: [
        { input: "[3,1,5,4,2]\n2", expectedOutput: "4" },
        { input: "[3,1,5,4,2]\n5", expectedOutput: "5" },
        { input: "[3,2,5,3,1]\n3", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const base = Array.from({ length: n }, (_, i) => i + 1);
        const nums = shuffle(rng, base);
        const extra = ri(rng, 0, 2);
        for (let t = 0; t < extra && nums.length > 1; t++) nums[ri(rng, 0, nums.length - 1)] = ri(rng, 1, n);
        // k is derived from what survived the overwrites, so 1 must still be there.
        if (nums.indexOf(1) < 0) nums[ri(rng, 0, n - 1)] = 1;
        const present: Record<string, boolean> = {};
        for (const v of nums) present[String(v)] = true;
        let k = 1;
        while (k < n && present[String(k + 1)] === true) k++;
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperations(nums: List[int], k: int) -> int:\n    have = set()\n    for i in range(len(nums) - 1, -1, -1):\n        if nums[i] <= k:\n            have.add(nums[i])\n        if len(have) == k:\n            return len(nums) - i\n    return len(nums)`,
        javascript: `var minOperations = function(nums, k) {\n    var have = {}, got = 0;\n    for (var i = nums.length - 1; i >= 0; i--) {\n        var v = nums[i];\n        if (v <= k && have[String(v)] !== true) { have[String(v)] = true; got++; }\n        if (got === k) return nums.length - i;\n    }\n    return nums.length;\n};`,
        typescript: `function minOperations(nums: number[], k: number): number {\n    var have: { [key: string]: boolean } = {}, got = 0;\n    for (var i = nums.length - 1; i >= 0; i--) {\n        var v = nums[i];\n        if (v <= k && have[String(v)] !== true) { have[String(v)] = true; got++; }\n        if (got === k) return nums.length - i;\n    }\n    return nums.length;\n}`,
        java: `public static int minOperations(int[] nums, int k) {\n    boolean[] have = new boolean[k + 1];\n    int got = 0;\n    for (int i = nums.length - 1; i >= 0; i--) {\n        int v = nums[i];\n        if (v <= k && !have[v]) { have[v] = true; got++; }\n        if (got == k) return nums.length - i;\n    }\n    return nums.length;\n}`,
        cpp: `int minOperations(vector<int>& nums, int k) {\n    vector<bool> have(k + 1, false);\n    int got = 0;\n    for (int i = (int) nums.size() - 1; i >= 0; i--) {\n        int v = nums[i];\n        if (v <= k && !have[v]) { have[v] = true; got++; }\n        if (got == k) return (int) nums.size() - i;\n    }\n    return (int) nums.size();\n}`,
        c: `int minOperations(int* nums, int numsSize, int k) {\n    int* have = (int*) calloc((size_t) k + 1, sizeof(int));\n    int got = 0;\n    int ans = numsSize;\n    for (int i = numsSize - 1; i >= 0; i--) {\n        int v = nums[i];\n        if (v <= k && !have[v]) { have[v] = 1; got++; }\n        if (got == k) { ans = numsSize - i; break; }\n    }\n    free(have);\n    return ans;\n}`,
        csharp: `public static int MinOperations(int[] nums, int k)\n{\n    bool[] have = new bool[k + 1];\n    int got = 0;\n    for (int i = nums.Length - 1; i >= 0; i--)\n    {\n        int v = nums[i];\n        if (v <= k && !have[v]) { have[v] = true; got++; }\n        if (got == k) return nums.Length - i;\n    }\n    return nums.Length;\n}`,
        go: `func minOperations(nums []int, k int) int {\n\thave := make([]bool, k+1)\n\tgot := 0\n\tfor i := len(nums) - 1; i >= 0; i-- {\n\t\tv := nums[i]\n\t\tif v <= k && !have[v] {\n\t\t\thave[v] = true\n\t\t\tgot++\n\t\t}\n\t\tif got == k {\n\t\t\treturn len(nums) - i\n\t\t}\n\t}\n\treturn len(nums)\n}`,
        kotlin: `fun minOperations(nums: IntArray, k: Int): Int {\n    val have = BooleanArray(k + 1)\n    var got = 0\n    for (i in nums.size - 1 downTo 0) {\n        val v = nums[i]\n        if (v <= k && !have[v]) {\n            have[v] = true\n            got++\n        }\n        if (got == k) return nums.size - i\n    }\n    return nums.size\n}`,
        swift: `func minOperations(_ nums: [Int], _ k: Int) -> Int {\n    var have = [Bool](repeating: false, count: k + 1)\n    var got = 0\n    var i = nums.count - 1\n    while i >= 0 {\n        let v = nums[i]\n        if v <= k && !have[v] {\n            have[v] = true\n            got += 1\n        }\n        if got == k { return nums.count - i }\n        i -= 1\n    }\n    return nums.count\n}`,
        rust: `fn minOperations(nums: Vec<i32>, k: i32) -> i32 {\n    let mut have = vec![false; (k + 1) as usize];\n    let mut got = 0;\n    let n = nums.len() as i32;\n    for i in (0..nums.len()).rev() {\n        let v = nums[i];\n        if v <= k && !have[v as usize] {\n            have[v as usize] = true;\n            got += 1;\n        }\n        if got == k {\n            return n - i as i32;\n        }\n    }\n    n\n}`,
        php: `function minOperations($nums, $k) {\n    $have = array_fill(0, $k + 1, false);\n    $got = 0;\n    for ($i = count($nums) - 1; $i >= 0; $i--) {\n        $v = $nums[$i];\n        if ($v <= $k && !$have[$v]) { $have[$v] = true; $got++; }\n        if ($got === $k) return count($nums) - $i;\n    }\n    return count($nums);\n}`,
        ruby: `def minOperations(nums, k)\n  have = Array.new(k + 1, false)\n  got = 0\n  (nums.length - 1).downto(0) do |i|\n    v = nums[i]\n    if v <= k && !have[v]\n      have[v] = true\n      got += 1\n    end\n    return nums.length - i if got == k\n  end\n  nums.length\nend`,
      },
    };
  })(),

  // ── Count Inversions (GFG) ──────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const MAX = 1001;
      const bit = new Array(MAX + 1).fill(0);
      const add = (i: number) => { for (let p = i; p <= MAX; p += p & -p) bit[p]++; };
      const sum = (i: number) => { let s = 0; for (let p = i; p > 0; p -= p & -p) s += bit[p]; return s; };
      let total = 0, seen = 0;
      for (const x of arr) {
        total += seen - sum(x);
        add(x);
        seen++;
      }
      return total;
    };
    return {
      slug: "count-inversions",
      title: "Count Inversions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Divide and Conquer", "Fenwick Tree", "Amazon", "Microsoft", "Flipkart"],
      signature: { funcName: "countInversions", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An **inversion** is a pair of indices `(i, j)` with `i < j` and `arr[i] > arr[j]` — a pair that is out of order.\n\nThe inversion count measures how far an array is from being sorted: a sorted array has `0`, and a strictly decreasing array has the maximum possible.\n\nGiven `arr`, return its inversion count.",
        [
          { in: "arr = [2,4,1,3,5]", out: "3", note: "The out-of-order pairs are (2,1), (4,1) and (4,3)." },
          { in: "arr = [2,3,4,5,6]", out: "0", note: "Already sorted." },
          { in: "arr = [10,10,10]", out: "0", note: "Equal values are not inversions — the comparison is strict." },
        ],
        ["1 <= arr.length <= 1000", "1 <= arr[i] <= 1000"]),
      hints: [
        "The brute-force double loop is O(n²). The interview wants O(n log n).",
        "Process left to right and ask: how many values already placed are strictly greater than the current one?",
        "A Fenwick (binary indexed) tree over the value range answers that in `log` time. Merge sort is the other standard route.",
      ],
      editorial: explain({
        idea: "Sweep left to right keeping a frequency structure over values already seen. For the current `x`, the number of earlier values strictly greater than `x` is `seen - (count of values <= x)`, and a Fenwick tree gives that prefix count in `O(log V)`.",
        steps: [
          "Create a Fenwick tree over the value range `1 .. 1000`, all zeros.",
          "For each element `x` in order: add `seen - query(x)` to the answer, where `query(x)` counts already-inserted values `<= x`.",
          "Insert `x` into the tree and increment `seen`.",
        ],
        why: "Every inversion `(i, j)` is counted exactly once — at the moment `j` is processed, because `arr[i]` is already in the tree and `arr[i] > arr[j]` is exactly what `seen - query(arr[j])` measures.",
        time: "O(n log V)",
        space: "O(V)",
        pitfalls: [
          "Using `query(x)` alone counts values `<= x`, which includes ties; the strict comparison is why the subtraction is from `seen`.",
          "A Fenwick tree is 1-indexed — a value of `0` would loop forever in the update, so the values here start at 1.",
        ],
      }),
      examples: [
        { input: "[2,4,1,3,5]", expectedOutput: "3" },
        { input: "[2,3,4,5,6]", expectedOutput: "0" },
        { input: "[10,10,10]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 120);
        const mode = rng();
        let arr: number[];
        if (mode < 0.15) arr = Array.from({ length: n }, (_, i) => Math.min(1000, i + 1));
        else if (mode < 0.3) arr = Array.from({ length: n }, (_, i) => Math.max(1, n - i));
        else arr = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 12 : 1000));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countInversions(arr: List[int]) -> int:\n    MAX = 1001\n    bit = [0] * (MAX + 1)\n\n    def add(i: int) -> None:\n        while i <= MAX:\n            bit[i] += 1\n            i += i & -i\n\n    def pref(i: int) -> int:\n        s = 0\n        while i > 0:\n            s += bit[i]\n            i -= i & -i\n        return s\n\n    total = 0\n    seen = 0\n    for x in arr:\n        total += seen - pref(x)\n        add(x)\n        seen += 1\n    return total`,
        javascript: `var countInversions = function(arr) {\n    var MAX = 1001;\n    var bit = [];\n    for (var t = 0; t <= MAX; t++) bit.push(0);\n    var total = 0, seen = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        var s = 0;\n        for (var p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (var q = x; q <= MAX; q += q & -q) bit[q]++;\n        seen++;\n    }\n    return total;\n};`,
        typescript: `function countInversions(arr: number[]): number {\n    var MAX = 1001;\n    var bit: number[] = [];\n    for (var t = 0; t <= MAX; t++) bit.push(0);\n    var total = 0, seen = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        var s = 0;\n        for (var p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (var q = x; q <= MAX; q += q & -q) bit[q]++;\n        seen++;\n    }\n    return total;\n}`,
        java: `public static int countInversions(int[] arr) {\n    final int MAX = 1001;\n    int[] bit = new int[MAX + 1];\n    int total = 0, seen = 0;\n    for (int x : arr) {\n        int s = 0;\n        for (int p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (int q = x; q <= MAX; q += q & -q) bit[q]++;\n        seen++;\n    }\n    return total;\n}`,
        cpp: `int countInversions(vector<int>& arr) {\n    const int MAXV = 1001;\n    vector<int> bit(MAXV + 1, 0);\n    int total = 0, seen = 0;\n    for (int x : arr) {\n        int s = 0;\n        for (int p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (int q = x; q <= MAXV; q += q & -q) bit[q]++;\n        seen++;\n    }\n    return total;\n}`,
        c: `int countInversions(int* arr, int arrSize) {\n    const int MAXV = 1001;\n    int* bit = (int*) calloc((size_t) MAXV + 1, sizeof(int));\n    int total = 0, seen = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int x = arr[i];\n        int s = 0;\n        for (int p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (int q = x; q <= MAXV; q += q & -q) bit[q]++;\n        seen++;\n    }\n    free(bit);\n    return total;\n}`,
        csharp: `public static int CountInversions(int[] arr)\n{\n    const int MAXV = 1001;\n    int[] bit = new int[MAXV + 1];\n    int total = 0, seen = 0;\n    foreach (int x in arr)\n    {\n        int s = 0;\n        for (int p = x; p > 0; p -= p & -p) s += bit[p];\n        total += seen - s;\n        for (int q = x; q <= MAXV; q += q & -q) bit[q]++;\n        seen++;\n    }\n    return total;\n}`,
        go: `func countInversions(arr []int) int {\n\tconst maxV = 1001\n\tbit := make([]int, maxV+1)\n\ttotal, seen := 0, 0\n\tfor _, x := range arr {\n\t\ts := 0\n\t\tfor p := x; p > 0; p -= p & -p {\n\t\t\ts += bit[p]\n\t\t}\n\t\ttotal += seen - s\n\t\tfor q := x; q <= maxV; q += q & -q {\n\t\t\tbit[q]++\n\t\t}\n\t\tseen++\n\t}\n\treturn total\n}`,
        kotlin: `fun countInversions(arr: IntArray): Int {\n    val maxV = 1001\n    val bit = IntArray(maxV + 1)\n    var total = 0\n    var seen = 0\n    for (x in arr) {\n        var s = 0\n        var p = x\n        while (p > 0) {\n            s += bit[p]\n            p -= p and -p\n        }\n        total += seen - s\n        var q = x\n        while (q <= maxV) {\n            bit[q]++\n            q += q and -q\n        }\n        seen++\n    }\n    return total\n}`,
        swift: `func countInversions(_ arr: [Int]) -> Int {\n    let maxV = 1001\n    var bit = [Int](repeating: 0, count: maxV + 1)\n    var total = 0\n    var seen = 0\n    for x in arr {\n        var s = 0\n        var p = x\n        while p > 0 {\n            s += bit[p]\n            p -= p & -p\n        }\n        total += seen - s\n        var q = x\n        while q <= maxV {\n            bit[q] += 1\n            q += q & -q\n        }\n        seen += 1\n    }\n    return total\n}`,
        rust: `fn countInversions(arr: Vec<i32>) -> i32 {\n    let max_v: i32 = 1001;\n    let mut bit = vec![0i32; (max_v + 1) as usize];\n    let mut total = 0i32;\n    let mut seen = 0i32;\n    for &x in arr.iter() {\n        let mut s = 0i32;\n        let mut p = x;\n        while p > 0 {\n            s += bit[p as usize];\n            p -= p & -p;\n        }\n        total += seen - s;\n        let mut q = x;\n        while q <= max_v {\n            bit[q as usize] += 1;\n            q += q & -q;\n        }\n        seen += 1;\n    }\n    total\n}`,
        php: `function countInversions($arr) {\n    $maxV = 1001;\n    $bit = array_fill(0, $maxV + 1, 0);\n    $total = 0;\n    $seen = 0;\n    foreach ($arr as $x) {\n        $s = 0;\n        for ($p = $x; $p > 0; $p -= $p & -$p) $s += $bit[$p];\n        $total += $seen - $s;\n        for ($q = $x; $q <= $maxV; $q += $q & -$q) $bit[$q]++;\n        $seen++;\n    }\n    return $total;\n}`,
        ruby: `def countInversions(arr)\n  max_v = 1001\n  bit = Array.new(max_v + 1, 0)\n  total = 0\n  seen = 0\n  arr.each do |x|\n    s = 0\n    p = x\n    while p > 0\n      s += bit[p]\n      p -= p & -p\n    end\n    total += seen - s\n    q = x\n    while q <= max_v\n      bit[q] += 1\n      q += q & -q\n    end\n    seen += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Swaps to Sort (GFG) ─────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => arr[a] - arr[b]);
      const done = new Array(n).fill(false);
      let swaps = 0;
      for (let i = 0; i < n; i++) {
        if (done[i] || idx[i] === i) continue;
        let size = 0, j = i;
        while (!done[j]) { done[j] = true; j = idx[j]; size++; }
        swaps += size - 1;
      }
      return swaps;
    };
    return {
      slug: "minimum-swaps-to-sort",
      title: "Minimum Swaps to Sort",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Graph", "Amazon", "Adobe", "Morgan Stanley"],
      signature: { funcName: "minSwaps", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` of **distinct** integers, return the minimum number of swaps needed to sort it in ascending order. A swap may exchange any two positions, not just adjacent ones.",
        [
          { in: "arr = [2,8,5,4]", out: "1", note: "Swapping 8 and 4 gives [2,4,5,8]." },
          { in: "arr = [10,19,6,3,5]", out: "2", note: "Swap 10 with 3, then 19 with 5." },
          { in: "arr = [1,2,3]", out: "0" },
        ],
        ["1 <= arr.length <= 100000", "1 <= arr[i] <= 1000000", "All values in arr are distinct."]),
      hints: [
        "Think of each element as needing to move to the position it occupies once sorted. That defines a permutation.",
        "A permutation decomposes into disjoint cycles, and cycles are independent of each other.",
        "A cycle of length `L` costs exactly `L - 1` swaps. Sum over all cycles.",
      ],
      editorial: explain({
        idea: "Sorting is a permutation: element at position `i` must end up at the index it takes in sorted order. A permutation splits into disjoint cycles, and a cycle of length `L` needs exactly `L - 1` swaps — so the answer is `n` minus the number of cycles.",
        steps: [
          "Build `idx`, the indices `0..n-1` sorted by their value in `arr`. `idx[i]` is the original position of the element that belongs at position `i`.",
          "Walk every unvisited `i`, following `j = idx[j]` and marking visited, to measure that cycle's length.",
          "Add `length - 1` to the answer for each cycle.",
        ],
        why: "Within one cycle no element is already home, and each swap can place at most one element correctly while keeping the rest a cycle, so `L - 1` swaps are both necessary and sufficient. Distinct cycles share no positions, so their costs simply add.",
        time: "O(n log n) for the sort",
        space: "O(n)",
        pitfalls: [
          "Fixed points (`idx[i] == i`) are cycles of length 1 and cost nothing — counting them as 1 swap inflates the answer.",
          "The technique assumes distinct values; with duplicates the target permutation is no longer unique.",
        ],
      }),
      examples: [
        { input: "[2,8,5,4]", expectedOutput: "1" },
        { input: "[10,19,6,3,5]", expectedOutput: "2" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const pool: number[] = [];
        const used: Record<string, boolean> = {};
        while (pool.length < n) {
          const v = ri(rng, 1, 1000000);
          if (used[String(v)] !== true) { used[String(v)] = true; pool.push(v); }
        }
        const arr = rng() < 0.15 ? pool.slice().sort((a, b) => a - b) : shuffle(rng, pool);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minSwaps(arr: List[int]) -> int:\n    n = len(arr)\n    idx = sorted(range(n), key=lambda i: arr[i])\n    done = [False] * n\n    swaps = 0\n    for i in range(n):\n        if done[i] or idx[i] == i:\n            continue\n        size = 0\n        j = i\n        while not done[j]:\n            done[j] = True\n            j = idx[j]\n            size += 1\n        swaps += size - 1\n    return swaps`,
        javascript: `var minSwaps = function(arr) {\n    var n = arr.length;\n    var idx = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return arr[a] - arr[b]; });\n    var done = [];\n    for (var u = 0; u < n; u++) done.push(false);\n    var swaps = 0;\n    for (var i = 0; i < n; i++) {\n        if (done[i] || idx[i] === i) continue;\n        var size = 0, j = i;\n        while (!done[j]) { done[j] = true; j = idx[j]; size++; }\n        swaps += size - 1;\n    }\n    return swaps;\n};`,
        typescript: `function minSwaps(arr: number[]): number {\n    var n = arr.length;\n    var idx: number[] = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return arr[a] - arr[b]; });\n    var done: boolean[] = [];\n    for (var u = 0; u < n; u++) done.push(false);\n    var swaps = 0;\n    for (var i = 0; i < n; i++) {\n        if (done[i] || idx[i] === i) continue;\n        var size = 0, j = i;\n        while (!done[j]) { done[j] = true; j = idx[j]; size++; }\n        swaps += size - 1;\n    }\n    return swaps;\n}`,
        java: `public static int minSwaps(int[] arr) {\n    int n = arr.length;\n    Integer[] order = new Integer[n];\n    for (int i = 0; i < n; i++) order[i] = i;\n    Arrays.sort(order, (a, b) -> Integer.compare(arr[a], arr[b]));\n    boolean[] done = new boolean[n];\n    int swaps = 0;\n    for (int i = 0; i < n; i++) {\n        if (done[i] || order[i] == i) continue;\n        int size = 0, j = i;\n        while (!done[j]) { done[j] = true; j = order[j]; size++; }\n        swaps += size - 1;\n    }\n    return swaps;\n}`,
        cpp: `int minSwaps(vector<int>& arr) {\n    int n = (int) arr.size();\n    vector<int> idx(n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    sort(idx.begin(), idx.end(), [&](int a, int b) { return arr[a] < arr[b]; });\n    vector<bool> done(n, false);\n    int swaps = 0;\n    for (int i = 0; i < n; i++) {\n        if (done[i] || idx[i] == i) continue;\n        int size = 0, j = i;\n        while (!done[j]) { done[j] = true; j = idx[j]; size++; }\n        swaps += size - 1;\n    }\n    return swaps;\n}`,
        c: `static int* gSwapBase;\n\nstatic int cmpSwapIdx(const void* a, const void* b) {\n    int x = gSwapBase[*(const int*) a];\n    int y = gSwapBase[*(const int*) b];\n    return (x > y) - (x < y);\n}\n\nint minSwaps(int* arr, int arrSize) {\n    int* idx = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) idx[i] = i;\n    gSwapBase = arr;\n    qsort(idx, (size_t) arrSize, sizeof(int), cmpSwapIdx);\n    int* done = (int*) calloc((size_t) arrSize, sizeof(int));\n    int swaps = 0;\n    for (int i = 0; i < arrSize; i++) {\n        if (done[i] || idx[i] == i) continue;\n        int size = 0, j = i;\n        while (!done[j]) { done[j] = 1; j = idx[j]; size++; }\n        swaps += size - 1;\n    }\n    free(idx);\n    free(done);\n    return swaps;\n}`,
        csharp: `public static int MinSwaps(int[] arr)\n{\n    int n = arr.Length;\n    int[] idx = Enumerable.Range(0, n).ToArray();\n    Array.Sort(idx, (a, b) => arr[a].CompareTo(arr[b]));\n    bool[] done = new bool[n];\n    int swaps = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (done[i] || idx[i] == i) continue;\n        int size = 0, j = i;\n        while (!done[j]) { done[j] = true; j = idx[j]; size++; }\n        swaps += size - 1;\n    }\n    return swaps;\n}`,
        go: `func minSwaps(arr []int) int {\n\tn := len(arr)\n\tidx := make([]int, n)\n\tfor i := range idx {\n\t\tidx[i] = i\n\t}\n\tsort.Slice(idx, func(a, b int) bool { return arr[idx[a]] < arr[idx[b]] })\n\tdone := make([]bool, n)\n\tswaps := 0\n\tfor i := 0; i < n; i++ {\n\t\tif done[i] || idx[i] == i {\n\t\t\tcontinue\n\t\t}\n\t\tsize, j := 0, i\n\t\tfor !done[j] {\n\t\t\tdone[j] = true\n\t\t\tj = idx[j]\n\t\t\tsize++\n\t\t}\n\t\tswaps += size - 1\n\t}\n\treturn swaps\n}`,
        kotlin: `fun minSwaps(arr: IntArray): Int {\n    val n = arr.size\n    val idx = (0 until n).sortedBy { arr[it] }\n    val done = BooleanArray(n)\n    var swaps = 0\n    for (i in 0 until n) {\n        if (done[i] || idx[i] == i) continue\n        var size = 0\n        var j = i\n        while (!done[j]) {\n            done[j] = true\n            j = idx[j]\n            size++\n        }\n        swaps += size - 1\n    }\n    return swaps\n}`,
        swift: `func minSwaps(_ arr: [Int]) -> Int {\n    let n = arr.count\n    let idx = (0..<n).sorted { arr[$0] < arr[$1] }\n    var done = [Bool](repeating: false, count: n)\n    var swaps = 0\n    for i in 0..<n {\n        if done[i] || idx[i] == i { continue }\n        var size = 0\n        var j = i\n        while !done[j] {\n            done[j] = true\n            j = idx[j]\n            size += 1\n        }\n        swaps += size - 1\n    }\n    return swaps\n}`,
        rust: `fn minSwaps(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    let mut idx: Vec<usize> = (0..n).collect();\n    idx.sort_by(|a, b| arr[*a].cmp(&arr[*b]));\n    let mut done = vec![false; n];\n    let mut swaps = 0i32;\n    for i in 0..n {\n        if done[i] || idx[i] == i {\n            continue;\n        }\n        let mut size = 0i32;\n        let mut j = i;\n        while !done[j] {\n            done[j] = true;\n            j = idx[j];\n            size += 1;\n        }\n        swaps += size - 1;\n    }\n    swaps\n}`,
        php: `function minSwaps($arr) {\n    $n = count($arr);\n    $idx = range(0, $n - 1);\n    usort($idx, function($a, $b) use ($arr) { return $arr[$a] - $arr[$b]; });\n    $done = array_fill(0, $n, false);\n    $swaps = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($done[$i] || $idx[$i] === $i) continue;\n        $size = 0;\n        $j = $i;\n        while (!$done[$j]) { $done[$j] = true; $j = $idx[$j]; $size++; }\n        $swaps += $size - 1;\n    }\n    return $swaps;\n}`,
        ruby: `def minSwaps(arr)\n  n = arr.length\n  idx = (0...n).sort_by { |i| arr[i] }\n  done = Array.new(n, false)\n  swaps = 0\n  (0...n).each do |i|\n    next if done[i] || idx[i] == i\n    size = 0\n    j = i\n    while !done[j]\n      done[j] = true\n      j = idx[j]\n      size += 1\n    end\n    swaps += size - 1\n  end\n  swaps\nend`,
      },
    };
  })(),

  // ── Longest Subarray With Sum Zero (GFG) ────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const first: Record<string, number> = {};
      let sum = 0, best = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (sum === 0) { best = i + 1; continue; }
        const key = String(sum);
        if (first[key] === undefined) first[key] = i;
        else if (i - first[key] > best) best = i - first[key];
      }
      return best;
    };
    return {
      slug: "longest-subarray-with-sum-zero",
      title: "Longest Subarray With Sum Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Paytm", "Samsung"],
      signature: { funcName: "maxLenZeroSum", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` that may contain negative numbers, return the length of the **longest contiguous subarray** whose elements sum to `0`.\n\nIf no such subarray exists, return `0`.",
        [
          { in: "arr = [15,-2,2,-8,1,7,10,23]", out: "5", note: "The subarray [-2,2,-8,1,7] sums to 0." },
          { in: "arr = [1,2,3]", out: "0", note: "Everything is positive, so no subarray can reach 0." },
          { in: "arr = [1,-1,3,-3,4]", out: "4", note: "[1,-1,3,-3] is the longest." },
        ],
        ["1 <= arr.length <= 100000", "-1000 <= arr[i] <= 1000"]),
      hints: [
        "A subarray `arr[i+1..j]` sums to zero exactly when the prefix sums at `i` and `j` are equal.",
        "So the question becomes: how far apart can two equal prefix sums be?",
        "Store the **first** index at which each prefix sum occurs and never overwrite it.",
      ],
      editorial: explain({
        idea: "Let `P[j]` be the sum of `arr[0..j]`. Then `arr[i+1..j]` sums to zero precisely when `P[i] == P[j]`, so the longest zero-sum subarray is the widest gap between two equal prefix sums.",
        steps: [
          "Sweep left to right maintaining the running prefix sum.",
          "If the running sum is `0` at index `i`, the whole prefix works — a candidate of length `i + 1`.",
          "Otherwise, record the first index at which each sum value appears; on a repeat, the candidate length is `i - first[sum]`.",
          "Return the largest candidate.",
        ],
        why: "Keeping only the *first* occurrence is what maximises the distance: for a fixed right end `j`, the leftmost `i` with `P[i] == P[j]` gives the longest subarray, and every zero-sum subarray is detected at its own right end.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Overwriting the stored index on every occurrence yields the *shortest* such subarray, not the longest.",
          "Forgetting the `sum == 0` case misses subarrays that start at index 0.",
        ],
      }),
      examples: [
        { input: "[15,-2,2,-8,1,7,10,23]", expectedOutput: "5" },
        { input: "[1,2,3]", expectedOutput: "0" },
        { input: "[1,-1,3,-3,4]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 80);
        const hi = rng() < 0.5 ? 3 : 1000;
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxLenZeroSum(arr: List[int]) -> int:\n    first = {}\n    total = 0\n    best = 0\n    for i, x in enumerate(arr):\n        total += x\n        if total == 0:\n            best = i + 1\n        elif total in first:\n            best = max(best, i - first[total])\n        else:\n            first[total] = i\n    return best`,
        javascript: `var maxLenZeroSum = function(arr) {\n    var first = {};\n    var sum = 0, best = 0;\n    for (var i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        if (sum === 0) { best = i + 1; continue; }\n        var key = String(sum);\n        if (first[key] === undefined) first[key] = i;\n        else if (i - first[key] > best) best = i - first[key];\n    }\n    return best;\n};`,
        typescript: `function maxLenZeroSum(arr: number[]): number {\n    var first: { [key: string]: number } = {};\n    var sum = 0, best = 0;\n    for (var i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        if (sum === 0) { best = i + 1; continue; }\n        var key = String(sum);\n        if (first[key] === undefined) first[key] = i;\n        else if (i - first[key] > best) best = i - first[key];\n    }\n    return best;\n}`,
        java: `public static int maxLenZeroSum(int[] arr) {\n    Map<Integer, Integer> first = new HashMap<>();\n    int sum = 0, best = 0;\n    for (int i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        if (sum == 0) { best = i + 1; continue; }\n        Integer at = first.get(sum);\n        if (at == null) first.put(sum, i);\n        else if (i - at > best) best = i - at;\n    }\n    return best;\n}`,
        cpp: `int maxLenZeroSum(vector<int>& arr) {\n    unordered_map<int, int> first;\n    int sum = 0, best = 0;\n    for (int i = 0; i < (int) arr.size(); i++) {\n        sum += arr[i];\n        if (sum == 0) { best = i + 1; continue; }\n        auto it = first.find(sum);\n        if (it == first.end()) first[sum] = i;\n        else if (i - it->second > best) best = i - it->second;\n    }\n    return best;\n}`,
        c: `static int zeroSumSlot(int* keys, int* used, int mask, int key) {\n    unsigned int h = (unsigned int) key * 2654435761u;\n    int i = (int) (h & (unsigned int) mask);\n    while (used[i] && keys[i] != key) i = (i + 1) & mask;\n    return i;\n}\n\nint maxLenZeroSum(int* arr, int arrSize) {\n    int cap = 1;\n    while (cap < 2 * arrSize + 4) cap <<= 1;\n    int mask = cap - 1;\n    int* keys = (int*) calloc((size_t) cap, sizeof(int));\n    int* used = (int*) calloc((size_t) cap, sizeof(int));\n    int* at = (int*) calloc((size_t) cap, sizeof(int));\n    int sum = 0, best = 0;\n    for (int i = 0; i < arrSize; i++) {\n        sum += arr[i];\n        if (sum == 0) { best = i + 1; continue; }\n        int slot = zeroSumSlot(keys, used, mask, sum);\n        if (!used[slot]) { used[slot] = 1; keys[slot] = sum; at[slot] = i; }\n        else if (i - at[slot] > best) best = i - at[slot];\n    }\n    free(keys);\n    free(used);\n    free(at);\n    return best;\n}`,
        csharp: `public static int MaxLenZeroSum(int[] arr)\n{\n    var first = new Dictionary<int, int>();\n    int sum = 0, best = 0;\n    for (int i = 0; i < arr.Length; i++)\n    {\n        sum += arr[i];\n        if (sum == 0) { best = i + 1; continue; }\n        int at;\n        if (!first.TryGetValue(sum, out at)) first[sum] = i;\n        else if (i - at > best) best = i - at;\n    }\n    return best;\n}`,
        go: `func maxLenZeroSum(arr []int) int {\n\tfirst := map[int]int{}\n\tsum, best := 0, 0\n\tfor i, x := range arr {\n\t\tsum += x\n\t\tif sum == 0 {\n\t\t\tbest = i + 1\n\t\t\tcontinue\n\t\t}\n\t\tif at, ok := first[sum]; ok {\n\t\t\tif i-at > best {\n\t\t\t\tbest = i - at\n\t\t\t}\n\t\t} else {\n\t\t\tfirst[sum] = i\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxLenZeroSum(arr: IntArray): Int {\n    val first = HashMap<Int, Int>()\n    var sum = 0\n    var best = 0\n    for (i in arr.indices) {\n        sum += arr[i]\n        if (sum == 0) {\n            best = i + 1\n            continue\n        }\n        val at = first[sum]\n        if (at == null) first[sum] = i\n        else if (i - at > best) best = i - at\n    }\n    return best\n}`,
        swift: `func maxLenZeroSum(_ arr: [Int]) -> Int {\n    var first: [Int: Int] = [:]\n    var sum = 0\n    var best = 0\n    for i in 0..<arr.count {\n        sum += arr[i]\n        if sum == 0 {\n            best = i + 1\n            continue\n        }\n        if let at = first[sum] {\n            if i - at > best { best = i - at }\n        } else {\n            first[sum] = i\n        }\n    }\n    return best\n}`,
        rust: `fn maxLenZeroSum(arr: Vec<i32>) -> i32 {\n    let mut first: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut sum = 0i32;\n    let mut best = 0i32;\n    for i in 0..arr.len() {\n        sum += arr[i];\n        let i32i = i as i32;\n        if sum == 0 {\n            best = i32i + 1;\n            continue;\n        }\n        match first.get(&sum) {\n            Some(&at) => {\n                if i32i - at > best {\n                    best = i32i - at;\n                }\n            }\n            None => {\n                first.insert(sum, i32i);\n            }\n        }\n    }\n    best\n}`,
        php: `function maxLenZeroSum($arr) {\n    $first = array();\n    $sum = 0;\n    $best = 0;\n    for ($i = 0; $i < count($arr); $i++) {\n        $sum += $arr[$i];\n        if ($sum === 0) { $best = $i + 1; continue; }\n        if (!array_key_exists($sum, $first)) $first[$sum] = $i;\n        else if ($i - $first[$sum] > $best) $best = $i - $first[$sum];\n    }\n    return $best;\n}`,
        ruby: `def maxLenZeroSum(arr)\n  first = {}\n  sum = 0\n  best = 0\n  arr.each_with_index do |x, i|\n    sum += x\n    if sum == 0\n      best = i + 1\n      next\n    end\n    if first.key?(sum)\n      best = i - first[sum] if i - first[sum] > best\n    else\n      first[sum] = i\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Subarray With Given Sum (GFG) ───────────────────────────────
  (() => {
    const ref = (arr: number[], target: number) => {
      let sum = 0, start = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        while (sum > target && start < i) { sum -= arr[start]; start++; }
        if (sum === target) return [start + 1, i + 1];
      }
      return [-1];
    };
    return {
      slug: "subarray-with-given-sum",
      title: "Subarray With Given Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Two Pointers", "Amazon", "Flipkart", "Zoho"],
      signature: { funcName: "subarrayWithSum", params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `arr` of **positive** integers and an integer `target`, find the contiguous subarray that adds up to `target`.\n\nReturn its `[start, end]` positions using **1-based** indexing. If several subarrays qualify, return the one that ends **earliest**. If none does, return `[-1]`.",
        [
          { in: "arr = [1,2,3,7,5], target = 12", out: "[2,4]", note: "arr[2..4] is 2 + 3 + 7 = 12." },
          { in: "arr = [1,2,3,4,5,6,7,8,9,10], target = 15", out: "[1,5]", note: "1 + 2 + 3 + 4 + 5 = 15." },
          { in: "arr = [5,3,4], target = 2", out: "[-1]" },
        ],
        ["1 <= arr.length <= 100000", "1 <= arr[i] <= 1000", "1 <= target <= 1000000000"]),
      hints: [
        "All values are positive, so growing the window can only increase the sum and shrinking it can only decrease it.",
        "That monotonicity is exactly what a sliding window needs — no prefix-sum hash map required.",
        "Extend on the right; while the sum overshoots, contract from the left.",
      ],
      editorial: explain({
        idea: "With strictly positive values the window sum is monotone in both directions, so one window that only ever moves right finds the answer in a single pass.",
        steps: [
          "Keep `start` at the window's left edge and a running `sum`.",
          "Add `arr[i]` for each new right edge `i`.",
          "While `sum > target` and the window holds more than one element, drop `arr[start]` and advance `start`.",
          "If `sum == target`, return `[start + 1, i + 1]` — the 1-based bounds.",
        ],
        why: "For a fixed right end there is at most one left end that hits the target, because shrinking strictly decreases the sum. The loop reports the first right end for which such a left end exists, which is the earliest-ending subarray.",
        time: "O(n) — each index enters and leaves the window once",
        space: "O(1)",
        pitfalls: [
          "Returning 0-based indices; the classic statement of this problem is 1-based.",
          "The `start < i` guard stops the window from collapsing to nothing when a single element already exceeds the target.",
          "This shortcut relies on positivity — with negatives you need prefix sums and a hash map instead.",
        ],
      }),
      examples: [
        { input: "[1,2,3,7,5]\n12", expectedOutput: "[2,4]" },
        { input: "[1,2,3,4,5,6,7,8,9,10]\n15", expectedOutput: "[1,5]" },
        { input: "[5,3,4]\n2", expectedOutput: "[-1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const arr = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 10 : 1000));
        let target: number;
        if (rng() < 0.65) {
          const i = ri(rng, 0, n - 1);
          const j = ri(rng, i, n - 1);
          target = 0;
          for (let t = i; t <= j; t++) target += arr[t];
        } else {
          target = ri(rng, 1, 3000);
        }
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: fmtIntArr(ref(arr, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subarrayWithSum(arr: List[int], target: int) -> List[int]:\n    total = 0\n    start = 0\n    for i, x in enumerate(arr):\n        total += x\n        while total > target and start < i:\n            total -= arr[start]\n            start += 1\n        if total == target:\n            return [start + 1, i + 1]\n    return [-1]`,
        javascript: `var subarrayWithSum = function(arr, target) {\n    var sum = 0, start = 0;\n    for (var i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum === target) return [start + 1, i + 1];\n    }\n    return [-1];\n};`,
        typescript: `function subarrayWithSum(arr: number[], target: number): number[] {\n    var sum = 0, start = 0;\n    for (var i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum === target) return [start + 1, i + 1];\n    }\n    return [-1];\n}`,
        java: `public static int[] subarrayWithSum(int[] arr, int target) {\n    long sum = 0;\n    int start = 0;\n    for (int i = 0; i < arr.length; i++) {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum == target) return new int[] { start + 1, i + 1 };\n    }\n    return new int[] { -1 };\n}`,
        cpp: `vector<int> subarrayWithSum(vector<int>& arr, int target) {\n    long long sum = 0;\n    int start = 0;\n    for (int i = 0; i < (int) arr.size(); i++) {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum == target) return { start + 1, i + 1 };\n    }\n    return { -1 };\n}`,
        c: `int* subarrayWithSum(int* arr, int arrSize, int target, int* returnSize) {\n    long long sum = 0;\n    int start = 0;\n    for (int i = 0; i < arrSize; i++) {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum == target) {\n            int* out = (int*) malloc(2 * sizeof(int));\n            out[0] = start + 1;\n            out[1] = i + 1;\n            *returnSize = 2;\n            return out;\n        }\n    }\n    int* out = (int*) malloc(sizeof(int));\n    out[0] = -1;\n    *returnSize = 1;\n    return out;\n}`,
        csharp: `public static int[] SubarrayWithSum(int[] arr, int target)\n{\n    long sum = 0;\n    int start = 0;\n    for (int i = 0; i < arr.Length; i++)\n    {\n        sum += arr[i];\n        while (sum > target && start < i) { sum -= arr[start]; start++; }\n        if (sum == target) return new int[] { start + 1, i + 1 };\n    }\n    return new int[] { -1 };\n}`,
        go: `func subarrayWithSum(arr []int, target int) []int {\n\tsum, start := 0, 0\n\tfor i := 0; i < len(arr); i++ {\n\t\tsum += arr[i]\n\t\tfor sum > target && start < i {\n\t\t\tsum -= arr[start]\n\t\t\tstart++\n\t\t}\n\t\tif sum == target {\n\t\t\treturn []int{start + 1, i + 1}\n\t\t}\n\t}\n\treturn []int{-1}\n}`,
        kotlin: `fun subarrayWithSum(arr: IntArray, target: Int): IntArray {\n    var sum = 0L\n    var start = 0\n    for (i in arr.indices) {\n        sum += arr[i]\n        while (sum > target && start < i) {\n            sum -= arr[start]\n            start++\n        }\n        if (sum == target.toLong()) return intArrayOf(start + 1, i + 1)\n    }\n    return intArrayOf(-1)\n}`,
        swift: `func subarrayWithSum(_ arr: [Int], _ target: Int) -> [Int] {\n    var sum = 0\n    var start = 0\n    for i in 0..<arr.count {\n        sum += arr[i]\n        while sum > target && start < i {\n            sum -= arr[start]\n            start += 1\n        }\n        if sum == target { return [start + 1, i + 1] }\n    }\n    return [-1]\n}`,
        rust: `fn subarrayWithSum(arr: Vec<i32>, target: i32) -> Vec<i32> {\n    let mut sum: i64 = 0;\n    let mut start = 0usize;\n    for i in 0..arr.len() {\n        sum += arr[i] as i64;\n        while sum > target as i64 && start < i {\n            sum -= arr[start] as i64;\n            start += 1;\n        }\n        if sum == target as i64 {\n            return vec![start as i32 + 1, i as i32 + 1];\n        }\n    }\n    vec![-1]\n}`,
        php: `function subarrayWithSum($arr, $target) {\n    $sum = 0;\n    $start = 0;\n    for ($i = 0; $i < count($arr); $i++) {\n        $sum += $arr[$i];\n        while ($sum > $target && $start < $i) { $sum -= $arr[$start]; $start++; }\n        if ($sum === $target) return array($start + 1, $i + 1);\n    }\n    return array(-1);\n}`,
        ruby: `def subarrayWithSum(arr, target)\n  sum = 0\n  start = 0\n  arr.each_with_index do |x, i|\n    sum += x\n    while sum > target && start < i\n      sum -= arr[start]\n      start += 1\n    end\n    return [start + 1, i + 1] if sum == target\n  end\n  [-1]\nend`,
      },
    };
  })(),

  // ── Rearrange Array in Max/Min Form (GFG) ───────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const out: number[] = [];
      let lo = 0, hi = arr.length - 1;
      while (lo <= hi) {
        out.push(arr[hi]);
        hi--;
        if (lo <= hi) { out.push(arr[lo]); lo++; }
      }
      return out;
    };
    return {
      slug: "rearrange-array-in-max-min-form",
      title: "Rearrange Array in Max/Min Form",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Paytm", "Accenture"],
      signature: { funcName: "rearrangeMaxMin", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `arr` **sorted in ascending order**. Rearrange it so that it alternates largest, smallest, second largest, second smallest, and so on.\n\nReturn the rearranged array.",
        [
          { in: "arr = [1,2,3,4,5,6]", out: "[6,1,5,2,4,3]", note: "Largest 6, smallest 1, then 5 and 2, then 4 and 3." },
          { in: "arr = [10,20,30,40,50,60,70]", out: "[70,10,60,20,50,30,40]", note: "An odd length leaves the middle element last." },
          { in: "arr = [4]", out: "[4]" },
        ],
        ["1 <= arr.length <= 100000", "1 <= arr[i] <= 1000000", "arr is given in ascending order."]),
      hints: [
        "The array is already sorted, so the largest and smallest remaining values are always at the two ends.",
        "Two pointers, one at each end, taking turns — the right one goes first.",
        "Stop when the pointers cross; with an odd length the last element written comes from the left pointer.",
      ],
      editorial: explain({
        idea: "Sorted input means the n-th largest is at the right pointer and the n-th smallest at the left pointer, so the required order is just an alternating read from the two ends.",
        steps: [
          "Set `lo = 0` and `hi = n - 1`.",
          "While `lo <= hi`: append `arr[hi]` and decrement `hi`; then, if the pointers have not crossed, append `arr[lo]` and increment `lo`.",
          "Return the collected values.",
        ],
        why: "Each step consumes exactly the current maximum then the current minimum of the untouched middle, which is the pattern the statement asks for. The inner guard is what handles an odd length, where the final write has no partner.",
        time: "O(n)",
        space: "O(n) for the output — the classic version does it in place with a modular-arithmetic trick",
        pitfalls: [
          "Writing the smallest first — the sequence starts with the **largest**.",
          "An odd length appends one extra element from the left pointer; forgetting the guard reads past `hi`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6]", expectedOutput: "[6,1,5,2,4,3]" },
        { input: "[10,20,30,40,50,60,70]", expectedOutput: "[70,10,60,20,50,30,40]" },
        { input: "[4]", expectedOutput: "[4]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const arr = Array.from({ length: n }, () => ri(rng, 1, 1000000)).sort((a, b) => a - b);
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef rearrangeMaxMin(arr: List[int]) -> List[int]:\n    out = []\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        out.append(arr[hi])\n        hi -= 1\n        if lo <= hi:\n            out.append(arr[lo])\n            lo += 1\n    return out`,
        javascript: `var rearrangeMaxMin = function(arr) {\n    var out = [];\n    var lo = 0, hi = arr.length - 1;\n    while (lo <= hi) {\n        out.push(arr[hi]);\n        hi--;\n        if (lo <= hi) { out.push(arr[lo]); lo++; }\n    }\n    return out;\n};`,
        typescript: `function rearrangeMaxMin(arr: number[]): number[] {\n    var out: number[] = [];\n    var lo = 0, hi = arr.length - 1;\n    while (lo <= hi) {\n        out.push(arr[hi]);\n        hi--;\n        if (lo <= hi) { out.push(arr[lo]); lo++; }\n    }\n    return out;\n}`,
        java: `public static int[] rearrangeMaxMin(int[] arr) {\n    int n = arr.length;\n    int[] out = new int[n];\n    int lo = 0, hi = n - 1, k = 0;\n    while (lo <= hi) {\n        out[k++] = arr[hi--];\n        if (lo <= hi) out[k++] = arr[lo++];\n    }\n    return out;\n}`,
        cpp: `vector<int> rearrangeMaxMin(vector<int>& arr) {\n    vector<int> out;\n    int lo = 0, hi = (int) arr.size() - 1;\n    while (lo <= hi) {\n        out.push_back(arr[hi--]);\n        if (lo <= hi) out.push_back(arr[lo++]);\n    }\n    return out;\n}`,
        c: `int* rearrangeMaxMin(int* arr, int arrSize, int* returnSize) {\n    int* out = (int*) malloc((size_t) arrSize * sizeof(int));\n    int lo = 0, hi = arrSize - 1, k = 0;\n    while (lo <= hi) {\n        out[k++] = arr[hi--];\n        if (lo <= hi) out[k++] = arr[lo++];\n    }\n    *returnSize = arrSize;\n    return out;\n}`,
        csharp: `public static int[] RearrangeMaxMin(int[] arr)\n{\n    int n = arr.Length;\n    int[] out_ = new int[n];\n    int lo = 0, hi = n - 1, k = 0;\n    while (lo <= hi)\n    {\n        out_[k++] = arr[hi--];\n        if (lo <= hi) out_[k++] = arr[lo++];\n    }\n    return out_;\n}`,
        go: `func rearrangeMaxMin(arr []int) []int {\n\tout := []int{}\n\tlo, hi := 0, len(arr)-1\n\tfor lo <= hi {\n\t\tout = append(out, arr[hi])\n\t\thi--\n\t\tif lo <= hi {\n\t\t\tout = append(out, arr[lo])\n\t\t\tlo++\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun rearrangeMaxMin(arr: IntArray): IntArray {\n    val out = IntArray(arr.size)\n    var lo = 0\n    var hi = arr.size - 1\n    var k = 0\n    while (lo <= hi) {\n        out[k++] = arr[hi--]\n        if (lo <= hi) out[k++] = arr[lo++]\n    }\n    return out\n}`,
        swift: `func rearrangeMaxMin(_ arr: [Int]) -> [Int] {\n    var out: [Int] = []\n    var lo = 0\n    var hi = arr.count - 1\n    while lo <= hi {\n        out.append(arr[hi])\n        hi -= 1\n        if lo <= hi {\n            out.append(arr[lo])\n            lo += 1\n        }\n    }\n    return out\n}`,
        rust: `fn rearrangeMaxMin(arr: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut lo: i32 = 0;\n    let mut hi: i32 = arr.len() as i32 - 1;\n    while lo <= hi {\n        out.push(arr[hi as usize]);\n        hi -= 1;\n        if lo <= hi {\n            out.push(arr[lo as usize]);\n            lo += 1;\n        }\n    }\n    out\n}`,
        php: `function rearrangeMaxMin($arr) {\n    $out = array();\n    $lo = 0;\n    $hi = count($arr) - 1;\n    while ($lo <= $hi) {\n        $out[] = $arr[$hi];\n        $hi--;\n        if ($lo <= $hi) { $out[] = $arr[$lo]; $lo++; }\n    }\n    return $out;\n}`,
        ruby: `def rearrangeMaxMin(arr)\n  out = []\n  lo = 0\n  hi = arr.length - 1\n  while lo <= hi\n    out << arr[hi]\n    hi -= 1\n    if lo <= hi\n      out << arr[lo]\n      lo += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Wave Array (GFG) ────────────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const s = arr.slice().sort((a, b) => a - b);
      for (let i = 0; i + 1 < s.length; i += 2) {
        const t = s[i]; s[i] = s[i + 1]; s[i + 1] = t;
      }
      return s;
    };
    return {
      slug: "wave-array",
      title: "Wave Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "waveArray", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "An array is in **wave form** when `arr[0] >= arr[1] <= arr[2] >= arr[3] <= …`.\n\nGiven `arr`, return the **lexicographically smallest** wave arrangement of its elements. That arrangement is obtained by sorting the array ascending and then swapping every adjacent pair: positions `(0,1)`, `(2,3)`, and so on.",
        [
          { in: "arr = [1,2,3,4,5]", out: "[2,1,4,3,5]", note: "Sorted it is [1,2,3,4,5]; swapping (0,1) and (2,3) gives [2,1,4,3,5]. The lone last element stays put." },
          { in: "arr = [20,10,8,6,4,2]", out: "[4,2,8,6,20,10]" },
          { in: "arr = [9]", out: "[9]" },
        ],
        ["1 <= arr.length <= 100000", "1 <= arr[i] <= 1000000"]),
      hints: [
        "Sort first — the wave then falls out of a fixed swap pattern.",
        "Swap `(0,1)`, `(2,3)`, `(4,5)` … and never `(1,2)`.",
        "An odd-length array leaves the final element alone; it is already larger than its left neighbour.",
      ],
      editorial: explain({
        idea: "After sorting, swapping each disjoint adjacent pair puts a larger value in every even position and a smaller one in every odd position — exactly the wave condition — and because the sort came first, no smaller arrangement exists.",
        steps: [
          "Sort a copy of `arr` ascending.",
          "For `i = 0, 2, 4, …` while `i + 1 < n`, swap `s[i]` and `s[i+1]`.",
          "Return the result.",
        ],
        why: "In sorted order `s[i] <= s[i+1]`, so after the swap position `i` holds the larger of the pair and position `i+1` the smaller — giving `s[i] >= s[i+1]`. Across a pair boundary, `s[i+1]` (the old `s[i]`) is at most `s[i+2]` (the old `s[i+3]`), so `<=` holds there too.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Swapping overlapping pairs `(0,1)`, `(1,2)` destroys the invariant the previous swap just established.",
          "Skipping the `i + 1 < n` guard reads past the end on an odd-length array.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "[2,1,4,3,5]" },
        { input: "[20,10,8,6,4,2]", expectedOutput: "[4,2,8,6,20,10]" },
        { input: "[9]", expectedOutput: "[9]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const hi = rng() < 0.4 ? 8 : 1000000;
        const arr = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef waveArray(arr: List[int]) -> List[int]:\n    s = sorted(arr)\n    for i in range(0, len(s) - 1, 2):\n        s[i], s[i + 1] = s[i + 1], s[i]\n    return s`,
        javascript: `var waveArray = function(arr) {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        var t = s[i];\n        s[i] = s[i + 1];\n        s[i + 1] = t;\n    }\n    return s;\n};`,
        typescript: `function waveArray(arr: number[]): number[] {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        var t = s[i];\n        s[i] = s[i + 1];\n        s[i + 1] = t;\n    }\n    return s;\n}`,
        java: `public static int[] waveArray(int[] arr) {\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    for (int i = 0; i + 1 < s.length; i += 2) {\n        int t = s[i];\n        s[i] = s[i + 1];\n        s[i + 1] = t;\n    }\n    return s;\n}`,
        cpp: `vector<int> waveArray(vector<int>& arr) {\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    for (size_t i = 0; i + 1 < s.size(); i += 2) swap(s[i], s[i + 1]);\n    return s;\n}`,
        c: `static int cmpWaveAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* waveArray(int* arr, int arrSize, int* returnSize) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, (size_t) arrSize, sizeof(int), cmpWaveAsc);\n    for (int i = 0; i + 1 < arrSize; i += 2) {\n        int t = s[i];\n        s[i] = s[i + 1];\n        s[i + 1] = t;\n    }\n    *returnSize = arrSize;\n    return s;\n}`,
        csharp: `public static int[] WaveArray(int[] arr)\n{\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    for (int i = 0; i + 1 < s.Length; i += 2)\n    {\n        int t = s[i];\n        s[i] = s[i + 1];\n        s[i + 1] = t;\n    }\n    return s;\n}`,
        go: `func waveArray(arr []int) []int {\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\tfor i := 0; i+1 < len(s); i += 2 {\n\t\ts[i], s[i+1] = s[i+1], s[i]\n\t}\n\treturn s\n}`,
        kotlin: `fun waveArray(arr: IntArray): IntArray {\n    val s = arr.sortedArray()\n    var i = 0\n    while (i + 1 < s.size) {\n        val t = s[i]\n        s[i] = s[i + 1]\n        s[i + 1] = t\n        i += 2\n    }\n    return s\n}`,
        swift: `func waveArray(_ arr: [Int]) -> [Int] {\n    var s = arr.sorted()\n    var i = 0\n    while i + 1 < s.count {\n        s.swapAt(i, i + 1)\n        i += 2\n    }\n    return s\n}`,
        rust: `fn waveArray(arr: Vec<i32>) -> Vec<i32> {\n    let mut s = arr.clone();\n    s.sort();\n    let mut i = 0usize;\n    while i + 1 < s.len() {\n        s.swap(i, i + 1);\n        i += 2;\n    }\n    s\n}`,
        php: `function waveArray($arr) {\n    $s = $arr;\n    sort($s);\n    for ($i = 0; $i + 1 < count($s); $i += 2) {\n        $t = $s[$i];\n        $s[$i] = $s[$i + 1];\n        $s[$i + 1] = $t;\n    }\n    return $s;\n}`,
        ruby: `def waveArray(arr)\n  s = arr.sort\n  i = 0\n  while i + 1 < s.length\n    s[i], s[i + 1] = s[i + 1], s[i]\n    i += 2\n  end\n  s\nend`,
      },
    };
  })(),

  // ── Convert Array Into Zig-Zag Fashion (GFG) ────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const a = arr.slice();
      let wantLess = true;
      for (let i = 0; i + 1 < a.length; i++) {
        if (wantLess) {
          if (a[i] > a[i + 1]) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }
        } else {
          if (a[i] < a[i + 1]) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }
        }
        wantLess = !wantLess;
      }
      return a;
    };
    return {
      slug: "convert-array-into-zig-zag-fashion",
      title: "Convert Array Into Zig-Zag Fashion",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Amazon", "Wipro", "Cognizant"],
      signature: { funcName: "zigZag", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Rearrange `arr` so that it zig-zags: `arr[0] < arr[1] > arr[2] < arr[3] > arr[4] …`.\n\nProduce the arrangement the **single left-to-right pass** gives: walk `i` from `0` to `n - 2`, alternating the relation you require starting with `<`, and swap `arr[i]` with `arr[i+1]` whenever the required relation does not already hold.",
        [
          { in: "arr = [4,3,7,8,6,2,1]", out: "[3,7,4,8,2,6,1]", note: "3 < 7 > 4 < 8 > 2 < 6 > 1." },
          { in: "arr = [1,4,3,2]", out: "[1,4,2,3]" },
          { in: "arr = [5,5,5]", out: "[5,5,5]", note: "Equal values need no swap under either relation." },
        ],
        ["1 <= arr.length <= 100000", "0 <= arr[i] <= 1000000"]),
      hints: [
        "One pass is enough — no sorting needed.",
        "Keep a flag that alternates between 'the next relation must be <' and 'must be >'.",
        "A swap only ever touches `i` and `i+1`, and it can never break the relation you fixed at `i-1`.",
      ],
      editorial: explain({
        idea: "Fix the relations left to right. At each step only the pair `(i, i+1)` is examined; if it violates the required relation, swapping repairs it, and the repair cannot undo an earlier one.",
        steps: [
          "Start with `wantLess = true`, meaning `arr[0] < arr[1]` is required.",
          "For each `i` from `0` to `n - 2`: if `wantLess` and `arr[i] > arr[i+1]`, swap; if not `wantLess` and `arr[i] < arr[i+1]`, swap.",
          "Flip `wantLess` and continue.",
        ],
        why: "When the pass swaps at `i`, the value moved into position `i` is the smaller (for `<`) or larger (for `>`) of the pair — which only strengthens the relation already established between `i-1` and `i`. So each fixed relation stays fixed.",
        time: "O(n)",
        space: "O(n) for the copy",
        pitfalls: [
          "Sorting first and then swapping pairs gives a valid zig-zag but a *different* one — this problem asks for the single-pass result.",
          "Starting the flag on `>` produces the mirror pattern and fails every case.",
        ],
      }),
      examples: [
        { input: "[4,3,7,8,6,2,1]", expectedOutput: "[3,7,4,8,2,6,1]" },
        { input: "[1,4,3,2]", expectedOutput: "[1,4,2,3]" },
        { input: "[5,5,5]", expectedOutput: "[5,5,5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const hi = rng() < 0.4 ? 6 : 1000000;
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef zigZag(arr: List[int]) -> List[int]:\n    a = list(arr)\n    want_less = True\n    for i in range(len(a) - 1):\n        if want_less:\n            if a[i] > a[i + 1]:\n                a[i], a[i + 1] = a[i + 1], a[i]\n        else:\n            if a[i] < a[i + 1]:\n                a[i], a[i + 1] = a[i + 1], a[i]\n        want_less = not want_less\n    return a`,
        javascript: `var zigZag = function(arr) {\n    var a = arr.slice();\n    var wantLess = true;\n    for (var i = 0; i + 1 < a.length; i++) {\n        if (wantLess) {\n            if (a[i] > a[i + 1]) { var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }\n        } else {\n            if (a[i] < a[i + 1]) { var u = a[i]; a[i] = a[i + 1]; a[i + 1] = u; }\n        }\n        wantLess = !wantLess;\n    }\n    return a;\n};`,
        typescript: `function zigZag(arr: number[]): number[] {\n    var a = arr.slice();\n    var wantLess = true;\n    for (var i = 0; i + 1 < a.length; i++) {\n        if (wantLess) {\n            if (a[i] > a[i + 1]) { var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }\n        } else {\n            if (a[i] < a[i + 1]) { var u = a[i]; a[i] = a[i + 1]; a[i + 1] = u; }\n        }\n        wantLess = !wantLess;\n    }\n    return a;\n}`,
        java: `public static int[] zigZag(int[] arr) {\n    int[] a = arr.clone();\n    boolean wantLess = true;\n    for (int i = 0; i + 1 < a.length; i++) {\n        if (wantLess) {\n            if (a[i] > a[i + 1]) { int t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }\n        } else {\n            if (a[i] < a[i + 1]) { int t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }\n        }\n        wantLess = !wantLess;\n    }\n    return a;\n}`,
        cpp: `vector<int> zigZag(vector<int>& arr) {\n    vector<int> a = arr;\n    bool wantLess = true;\n    for (size_t i = 0; i + 1 < a.size(); i++) {\n        if (wantLess) {\n            if (a[i] > a[i + 1]) swap(a[i], a[i + 1]);\n        } else {\n            if (a[i] < a[i + 1]) swap(a[i], a[i + 1]);\n        }\n        wantLess = !wantLess;\n    }\n    return a;\n}`,
        c: `int* zigZag(int* arr, int arrSize, int* returnSize) {\n    int* a = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) a[i] = arr[i];\n    int wantLess = 1;\n    for (int i = 0; i + 1 < arrSize; i++) {\n        int shouldSwap = wantLess ? (a[i] > a[i + 1]) : (a[i] < a[i + 1]);\n        if (shouldSwap) {\n            int t = a[i];\n            a[i] = a[i + 1];\n            a[i + 1] = t;\n        }\n        wantLess = !wantLess;\n    }\n    *returnSize = arrSize;\n    return a;\n}`,
        csharp: `public static int[] ZigZag(int[] arr)\n{\n    int[] a = (int[]) arr.Clone();\n    bool wantLess = true;\n    for (int i = 0; i + 1 < a.Length; i++)\n    {\n        bool shouldSwap = wantLess ? a[i] > a[i + 1] : a[i] < a[i + 1];\n        if (shouldSwap)\n        {\n            int t = a[i];\n            a[i] = a[i + 1];\n            a[i + 1] = t;\n        }\n        wantLess = !wantLess;\n    }\n    return a;\n}`,
        go: `func zigZag(arr []int) []int {\n\ta := append([]int{}, arr...)\n\twantLess := true\n\tfor i := 0; i+1 < len(a); i++ {\n\t\tshouldSwap := a[i] < a[i+1]\n\t\tif wantLess {\n\t\t\tshouldSwap = a[i] > a[i+1]\n\t\t}\n\t\tif shouldSwap {\n\t\t\ta[i], a[i+1] = a[i+1], a[i]\n\t\t}\n\t\twantLess = !wantLess\n\t}\n\treturn a\n}`,
        kotlin: `fun zigZag(arr: IntArray): IntArray {\n    val a = arr.copyOf()\n    var wantLess = true\n    for (i in 0 until a.size - 1) {\n        val shouldSwap = if (wantLess) a[i] > a[i + 1] else a[i] < a[i + 1]\n        if (shouldSwap) {\n            val t = a[i]\n            a[i] = a[i + 1]\n            a[i + 1] = t\n        }\n        wantLess = !wantLess\n    }\n    return a\n}`,
        swift: `func zigZag(_ arr: [Int]) -> [Int] {\n    var a = arr\n    var wantLess = true\n    var i = 0\n    while i + 1 < a.count {\n        let shouldSwap = wantLess ? a[i] > a[i + 1] : a[i] < a[i + 1]\n        if shouldSwap { a.swapAt(i, i + 1) }\n        wantLess = !wantLess\n        i += 1\n    }\n    return a\n}`,
        rust: `fn zigZag(arr: Vec<i32>) -> Vec<i32> {\n    let mut a = arr.clone();\n    let mut want_less = true;\n    let mut i = 0usize;\n    while i + 1 < a.len() {\n        let should_swap = if want_less { a[i] > a[i + 1] } else { a[i] < a[i + 1] };\n        if should_swap {\n            a.swap(i, i + 1);\n        }\n        want_less = !want_less;\n        i += 1;\n    }\n    a\n}`,
        php: `function zigZag($arr) {\n    $a = $arr;\n    $wantLess = true;\n    for ($i = 0; $i + 1 < count($a); $i++) {\n        $shouldSwap = $wantLess ? ($a[$i] > $a[$i + 1]) : ($a[$i] < $a[$i + 1]);\n        if ($shouldSwap) {\n            $t = $a[$i];\n            $a[$i] = $a[$i + 1];\n            $a[$i + 1] = $t;\n        }\n        $wantLess = !$wantLess;\n    }\n    return $a;\n}`,
        ruby: `def zigZag(arr)\n  a = arr.dup\n  want_less = true\n  (0...(a.length - 1)).each do |i|\n    should_swap = want_less ? a[i] > a[i + 1] : a[i] < a[i + 1]\n    a[i], a[i + 1] = a[i + 1], a[i] if should_swap\n    want_less = !want_less\n  end\n  a\nend`,
      },
    };
  })(),

  // ── Find Transition Point (GFG) ─────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let lo = 0, hi = arr.length - 1, ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] === 1) { ans = mid; hi = mid - 1; } else lo = mid + 1;
      }
      return ans;
    };
    return {
      slug: "find-transition-point",
      title: "Find Transition Point",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "TCS", "Infosys", "Capgemini"],
      signature: { funcName: "transitionPoint", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a sorted array `arr` that contains only `0`s followed by only `1`s. The **transition point** is the index of the first `1`.\n\nReturn that index, or `-1` if the array holds no `1` at all.",
        [
          { in: "arr = [0,0,0,1,1]", out: "3", note: "Index 3 is the first 1." },
          { in: "arr = [0,0,0,0]", out: "-1", note: "No 1 exists." },
          { in: "arr = [1,1,1]", out: "0" },
        ],
        ["1 <= arr.length <= 500000", "arr[i] is 0 or 1", "All 0s come before all 1s."]),
      hints: [
        "A linear scan works but throws away the fact that the array is sorted.",
        "Binary search for the boundary: when you land on a `1`, the answer is at that index or to its left.",
        "Keep the best candidate seen so far and keep shrinking to the left half.",
      ],
      editorial: explain({
        idea: "The array is a run of `0`s followed by a run of `1`s, so the predicate 'this element is 1' is monotone — false then true. That is exactly what binary search finds the boundary of.",
        steps: [
          "Set `lo = 0`, `hi = n - 1`, `ans = -1`.",
          "While `lo <= hi`, take `mid`. If `arr[mid] == 1`, record `ans = mid` and search left (`hi = mid - 1`).",
          "Otherwise the first `1` must be to the right, so `lo = mid + 1`.",
          "Return `ans`, which stays `-1` when no `1` was ever seen.",
        ],
        why: "Each iteration halves the range while preserving the invariant that `ans` is the leftmost `1` found so far and everything left of `lo` is `0`. When the range empties, no smaller index can hold a `1`.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Returning `mid` as soon as a `1` is found — that is *a* one, not necessarily the *first* one.",
          "`(lo + hi) / 2` can overflow in fixed-width languages on very large arrays; `lo + (hi - lo) / 2` is the safe form.",
        ],
      }),
      examples: [
        { input: "[0,0,0,1,1]", expectedOutput: "3" },
        { input: "[0,0,0,0]", expectedOutput: "-1" },
        { input: "[1,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 200);
        const zeros = ri(rng, 0, n);
        const arr = Array.from({ length: n }, (_, i) => (i < zeros ? 0 : 1));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef transitionPoint(arr: List[int]) -> int:\n    lo, hi, ans = 0, len(arr) - 1, -1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == 1:\n            ans = mid\n            hi = mid - 1\n        else:\n            lo = mid + 1\n    return ans`,
        javascript: `var transitionPoint = function(arr) {\n    var lo = 0, hi = arr.length - 1, ans = -1;\n    while (lo <= hi) {\n        var mid = lo + ((hi - lo) >> 1);\n        if (arr[mid] === 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n};`,
        typescript: `function transitionPoint(arr: number[]): number {\n    var lo = 0, hi = arr.length - 1, ans = -1;\n    while (lo <= hi) {\n        var mid = lo + ((hi - lo) >> 1);\n        if (arr[mid] === 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n}`,
        java: `public static int transitionPoint(int[] arr) {\n    int lo = 0, hi = arr.length - 1, ans = -1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] == 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n}`,
        cpp: `int transitionPoint(vector<int>& arr) {\n    int lo = 0, hi = (int) arr.size() - 1, ans = -1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] == 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n}`,
        c: `int transitionPoint(int* arr, int arrSize) {\n    int lo = 0, hi = arrSize - 1, ans = -1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] == 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n}`,
        csharp: `public static int TransitionPoint(int[] arr)\n{\n    int lo = 0, hi = arr.Length - 1, ans = -1;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] == 1) { ans = mid; hi = mid - 1; }\n        else lo = mid + 1;\n    }\n    return ans;\n}`,
        go: `func transitionPoint(arr []int) int {\n\tlo, hi, ans := 0, len(arr)-1, -1\n\tfor lo <= hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif arr[mid] == 1 {\n\t\t\tans = mid\n\t\t\thi = mid - 1\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun transitionPoint(arr: IntArray): Int {\n    var lo = 0\n    var hi = arr.size - 1\n    var ans = -1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (arr[mid] == 1) {\n            ans = mid\n            hi = mid - 1\n        } else {\n            lo = mid + 1\n        }\n    }\n    return ans\n}`,
        swift: `func transitionPoint(_ arr: [Int]) -> Int {\n    var lo = 0\n    var hi = arr.count - 1\n    var ans = -1\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if arr[mid] == 1 {\n            ans = mid\n            hi = mid - 1\n        } else {\n            lo = mid + 1\n        }\n    }\n    return ans\n}`,
        rust: `fn transitionPoint(arr: Vec<i32>) -> i32 {\n    let mut lo: i32 = 0;\n    let mut hi: i32 = arr.len() as i32 - 1;\n    let mut ans: i32 = -1;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        if arr[mid as usize] == 1 {\n            ans = mid;\n            hi = mid - 1;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    ans\n}`,
        php: `function transitionPoint($arr) {\n    $lo = 0;\n    $hi = count($arr) - 1;\n    $ans = -1;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($arr[$mid] === 1) { $ans = $mid; $hi = $mid - 1; }\n        else $lo = $mid + 1;\n    }\n    return $ans;\n}`,
        ruby: `def transitionPoint(arr)\n  lo = 0\n  hi = arr.length - 1\n  ans = -1\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    if arr[mid] == 1\n      ans = mid\n      hi = mid - 1\n    else\n      lo = mid + 1\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Common Elements in Three Sorted Arrays (GFG) ────────────────
  (() => {
    const ref = (a: number[], b: number[], c: number[]) => {
      const out: number[] = [];
      let i = 0, j = 0, k = 0;
      while (i < a.length && j < b.length && k < c.length) {
        if (a[i] === b[j] && b[j] === c[k]) {
          if (out.length === 0 || out[out.length - 1] !== a[i]) out.push(a[i]);
          i++; j++; k++;
        } else if (a[i] < b[j]) i++;
        else if (b[j] < c[k]) j++;
        else k++;
      }
      return out;
    };
    return {
      slug: "common-elements-in-three-sorted-arrays",
      title: "Common Elements in Three Sorted Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Infosys", "Oracle"],
      signature: { funcName: "commonElements", params: [{ name: "a", type: "int[]" as const }, { name: "b", type: "int[]" as const }, { name: "c", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given three arrays `a`, `b` and `c`, each sorted in **non-decreasing** order, return the values that appear in all three.\n\nThe result must be sorted ascending and contain each value **once**, even if it repeats in the inputs. Return `[]` when nothing is common.",
        [
          { in: "a = [1,5,10,20,40,80], b = [6,7,20,80,100], c = [3,4,15,20,30,70,80,120]", out: "[20,80]" },
          { in: "a = [1,2,3], b = [4,5,6], c = [7,8,9]", out: "[]" },
          { in: "a = [1,1,2,2,3], b = [1,1,2,2,3], c = [1,2,2,3,3]", out: "[1,2,3]", note: "Duplicates collapse to one entry each." },
        ],
        ["1 <= a.length, b.length, c.length <= 100000", "1 <= values <= 1000000", "Each array is sorted non-decreasing."]),
      hints: [
        "Three pointers, one per array, all starting at 0.",
        "If all three point at the same value, record it and advance all three.",
        "Otherwise advance whichever pointer sits on the smallest value — it can never match anything later.",
      ],
      editorial: explain({
        idea: "Sorted inputs make a three-way merge possible: keep one pointer per array and always move the one that is behind, because a value smaller than another array's current value can never appear there again.",
        steps: [
          "Start `i`, `j`, `k` at `0` and loop while all three are in range.",
          "If `a[i] == b[j] == c[k]`, append the value unless it equals the last one recorded, then advance all three pointers.",
          "Otherwise advance the pointer whose value is the smallest of the three.",
        ],
        why: "Each array is sorted, so if `a[i]` is strictly smallest it cannot equal anything at or after `b[j]` and `c[k]` — discarding it is safe. Every pointer only moves forward, so the scan is linear.",
        time: "O(n + m + p)",
        space: "O(1) beyond the output",
        pitfalls: [
          "Forgetting the duplicate guard — `[1,1]` in all three arrays would report `1` twice.",
          "Advancing all three pointers on a partial match loses values.",
        ],
      }),
      examples: [
        { input: "[1,5,10,20,40,80]\n[6,7,20,80,100]\n[3,4,15,20,30,70,80,120]", expectedOutput: "[20,80]" },
        { input: "[1,2,3]\n[4,5,6]\n[7,8,9]", expectedOutput: "[]" },
        { input: "[1,1,2,2,3]\n[1,1,2,2,3]\n[1,2,2,3,3]", expectedOutput: "[1,2,3]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 12 : 1000;
        const mk = () => Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi)).sort((x, y) => x - y);
        const a = mk(), b = mk(), c = mk();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${fmtIntArr(c)}`, expectedOutput: fmtIntArr(ref(a, b, c)) };
      },
      solutions: {
        python: `from typing import List\n\ndef commonElements(a: List[int], b: List[int], c: List[int]) -> List[int]:\n    out = []\n    i = j = k = 0\n    while i < len(a) and j < len(b) and k < len(c):\n        if a[i] == b[j] == c[k]:\n            if not out or out[-1] != a[i]:\n                out.append(a[i])\n            i += 1\n            j += 1\n            k += 1\n        elif a[i] < b[j]:\n            i += 1\n        elif b[j] < c[k]:\n            j += 1\n        else:\n            k += 1\n    return out`,
        javascript: `var commonElements = function(a, b, c) {\n    var out = [];\n    var i = 0, j = 0, k = 0;\n    while (i < a.length && j < b.length && k < c.length) {\n        if (a[i] === b[j] && b[j] === c[k]) {\n            if (out.length === 0 || out[out.length - 1] !== a[i]) out.push(a[i]);\n            i++; j++; k++;\n        } else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    return out;\n};`,
        typescript: `function commonElements(a: number[], b: number[], c: number[]): number[] {\n    var out: number[] = [];\n    var i = 0, j = 0, k = 0;\n    while (i < a.length && j < b.length && k < c.length) {\n        if (a[i] === b[j] && b[j] === c[k]) {\n            if (out.length === 0 || out[out.length - 1] !== a[i]) out.push(a[i]);\n            i++; j++; k++;\n        } else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    return out;\n}`,
        java: `public static int[] commonElements(int[] a, int[] b, int[] c) {\n    List<Integer> out = new ArrayList<>();\n    int i = 0, j = 0, k = 0;\n    while (i < a.length && j < b.length && k < c.length) {\n        if (a[i] == b[j] && b[j] == c[k]) {\n            if (out.isEmpty() || out.get(out.size() - 1) != a[i]) out.add(a[i]);\n            i++; j++; k++;\n        } else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    int[] res = new int[out.size()];\n    for (int t = 0; t < out.size(); t++) res[t] = out.get(t);\n    return res;\n}`,
        cpp: `vector<int> commonElements(vector<int>& a, vector<int>& b, vector<int>& c) {\n    vector<int> out;\n    size_t i = 0, j = 0, k = 0;\n    while (i < a.size() && j < b.size() && k < c.size()) {\n        if (a[i] == b[j] && b[j] == c[k]) {\n            if (out.empty() || out.back() != a[i]) out.push_back(a[i]);\n            i++; j++; k++;\n        } else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    return out;\n}`,
        c: `int* commonElements(int* a, int aSize, int* b, int bSize, int* c, int cSize, int* returnSize) {\n    int cap = aSize < bSize ? aSize : bSize;\n    if (cSize < cap) cap = cSize;\n    int* out = (int*) malloc((size_t) (cap > 0 ? cap : 1) * sizeof(int));\n    int m = 0, i = 0, j = 0, k = 0;\n    while (i < aSize && j < bSize && k < cSize) {\n        if (a[i] == b[j] && b[j] == c[k]) {\n            if (m == 0 || out[m - 1] != a[i]) out[m++] = a[i];\n            i++; j++; k++;\n        } else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] CommonElements(int[] a, int[] b, int[] c)\n{\n    var out_ = new List<int>();\n    int i = 0, j = 0, k = 0;\n    while (i < a.Length && j < b.Length && k < c.Length)\n    {\n        if (a[i] == b[j] && b[j] == c[k])\n        {\n            if (out_.Count == 0 || out_[out_.Count - 1] != a[i]) out_.Add(a[i]);\n            i++; j++; k++;\n        }\n        else if (a[i] < b[j]) i++;\n        else if (b[j] < c[k]) j++;\n        else k++;\n    }\n    return out_.ToArray();\n}`,
        go: `func commonElements(a []int, b []int, c []int) []int {\n\tout := []int{}\n\ti, j, k := 0, 0, 0\n\tfor i < len(a) && j < len(b) && k < len(c) {\n\t\tif a[i] == b[j] && b[j] == c[k] {\n\t\t\tif len(out) == 0 || out[len(out)-1] != a[i] {\n\t\t\t\tout = append(out, a[i])\n\t\t\t}\n\t\t\ti++\n\t\t\tj++\n\t\t\tk++\n\t\t} else if a[i] < b[j] {\n\t\t\ti++\n\t\t} else if b[j] < c[k] {\n\t\t\tj++\n\t\t} else {\n\t\t\tk++\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun commonElements(a: IntArray, b: IntArray, c: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    var i = 0\n    var j = 0\n    var k = 0\n    while (i < a.size && j < b.size && k < c.size) {\n        if (a[i] == b[j] && b[j] == c[k]) {\n            if (out.isEmpty() || out[out.size - 1] != a[i]) out.add(a[i])\n            i++\n            j++\n            k++\n        } else if (a[i] < b[j]) i++\n        else if (b[j] < c[k]) j++\n        else k++\n    }\n    return out.toIntArray()\n}`,
        swift: `func commonElements(_ a: [Int], _ b: [Int], _ c: [Int]) -> [Int] {\n    var out: [Int] = []\n    var i = 0, j = 0, k = 0\n    while i < a.count && j < b.count && k < c.count {\n        if a[i] == b[j] && b[j] == c[k] {\n            if out.isEmpty || out[out.count - 1] != a[i] { out.append(a[i]) }\n            i += 1\n            j += 1\n            k += 1\n        } else if a[i] < b[j] {\n            i += 1\n        } else if b[j] < c[k] {\n            j += 1\n        } else {\n            k += 1\n        }\n    }\n    return out\n}`,
        rust: `fn commonElements(a: Vec<i32>, b: Vec<i32>, c: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let (mut i, mut j, mut k) = (0usize, 0usize, 0usize);\n    while i < a.len() && j < b.len() && k < c.len() {\n        if a[i] == b[j] && b[j] == c[k] {\n            if out.is_empty() || out[out.len() - 1] != a[i] {\n                out.push(a[i]);\n            }\n            i += 1;\n            j += 1;\n            k += 1;\n        } else if a[i] < b[j] {\n            i += 1;\n        } else if b[j] < c[k] {\n            j += 1;\n        } else {\n            k += 1;\n        }\n    }\n    out\n}`,
        php: `function commonElements($a, $b, $c) {\n    $out = array();\n    $i = 0; $j = 0; $k = 0;\n    while ($i < count($a) && $j < count($b) && $k < count($c)) {\n        if ($a[$i] === $b[$j] && $b[$j] === $c[$k]) {\n            if (count($out) === 0 || $out[count($out) - 1] !== $a[$i]) $out[] = $a[$i];\n            $i++; $j++; $k++;\n        } else if ($a[$i] < $b[$j]) $i++;\n        else if ($b[$j] < $c[$k]) $j++;\n        else $k++;\n    }\n    return $out;\n}`,
        ruby: `def commonElements(a, b, c)\n  out = []\n  i = 0\n  j = 0\n  k = 0\n  while i < a.length && j < b.length && k < c.length\n    if a[i] == b[j] && b[j] == c[k]\n      out << a[i] if out.empty? || out[-1] != a[i]\n      i += 1\n      j += 1\n      k += 1\n    elsif a[i] < b[j]\n      i += 1\n    elsif b[j] < c[k]\n      j += 1\n    else\n      k += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Maximum Index (GFG) ─────────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const leftMin = new Array(n).fill(0);
      const rightMax = new Array(n).fill(0);
      leftMin[0] = arr[0];
      for (let i = 1; i < n; i++) leftMin[i] = Math.min(leftMin[i - 1], arr[i]);
      rightMax[n - 1] = arr[n - 1];
      for (let j = n - 2; j >= 0; j--) rightMax[j] = Math.max(rightMax[j + 1], arr[j]);
      let i = 0, j = 0, best = 0;
      while (i < n && j < n) {
        if (leftMin[i] <= rightMax[j]) { if (j - i > best) best = j - i; j++; }
        else i++;
      }
      return best;
    };
    return {
      slug: "maximum-index",
      title: "Maximum Index",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "maxIndexDiff", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr`, find the maximum value of `j - i` over all pairs of indices with `i <= j` and `arr[i] <= arr[j]`.\n\nReturn that maximum difference. It is always at least `0`, since `i == j` always qualifies.",
        [
          { in: "arr = [34,8,10,3,2,80,30,33,1]", out: "6", note: "arr[1] = 8 and arr[7] = 33 give j - i = 6." },
          { in: "arr = [1,2,3,4,5,6]", out: "5", note: "The first and last elements already satisfy the condition." },
          { in: "arr = [9,2,3,4,5,6,7,8,18,0]", out: "8", note: "arr[0] = 9 and arr[8] = 18." },
        ],
        ["1 <= arr.length <= 100000", "0 <= arr[i] <= 1000000000"]),
      hints: [
        "The double loop is O(n²). Ask instead: for a given left index, how far right can it usefully reach?",
        "Precompute `leftMin[i]` — the minimum of `arr[0..i]` — and `rightMax[j]` — the maximum of `arr[j..n-1]`.",
        "Both arrays are monotone, which lets two pointers sweep them in one pass.",
      ],
      editorial: explain({
        idea: "Replace each index by the best value it can offer: on the left, the running minimum (a smaller left value can only help); on the right, the running maximum. Both sequences are monotone, so a single two-pointer sweep finds the widest valid gap.",
        steps: [
          "Build `leftMin`, where `leftMin[i] = min(arr[0..i])` — non-increasing.",
          "Build `rightMax`, where `rightMax[j] = max(arr[j..n-1])` — non-increasing.",
          "Walk `i` and `j` from 0. While `leftMin[i] <= rightMax[j]`, the pair is feasible: record `j - i` and advance `j`.",
          "Otherwise advance `i`, since no larger `j` will help this `i`.",
        ],
        why: "If `leftMin[i] <= rightMax[j]` then some `i' <= i` and `j' >= j` satisfy the original condition with an even wider gap, so recording `j - i` never overestimates. When the test fails, `leftMin[i]` is too large for every `rightMax` at or beyond `j` (that sequence only shrinks), so `i` is exhausted.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Advancing `j` when the test fails — it is `i` that must move on.",
          "Answering `-1` when no pair works; `i == j` always works, so the floor is `0`.",
        ],
      }),
      examples: [
        { input: "[34,8,10,3,2,80,30,33,1]", expectedOutput: "6" },
        { input: "[1,2,3,4,5,6]", expectedOutput: "5" },
        { input: "[9,2,3,4,5,6,7,8,18,0]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const hi = rng() < 0.5 ? 10 : 1000000000;
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxIndexDiff(arr: List[int]) -> int:\n    n = len(arr)\n    left_min = [0] * n\n    right_max = [0] * n\n    left_min[0] = arr[0]\n    for i in range(1, n):\n        left_min[i] = min(left_min[i - 1], arr[i])\n    right_max[n - 1] = arr[n - 1]\n    for j in range(n - 2, -1, -1):\n        right_max[j] = max(right_max[j + 1], arr[j])\n    i = j = 0\n    best = 0\n    while i < n and j < n:\n        if left_min[i] <= right_max[j]:\n            best = max(best, j - i)\n            j += 1\n        else:\n            i += 1\n    return best`,
        javascript: `var maxIndexDiff = function(arr) {\n    var n = arr.length;\n    var leftMin = [], rightMax = [];\n    for (var t = 0; t < n; t++) { leftMin.push(0); rightMax.push(0); }\n    leftMin[0] = arr[0];\n    for (var i = 1; i < n; i++) leftMin[i] = Math.min(leftMin[i - 1], arr[i]);\n    rightMax[n - 1] = arr[n - 1];\n    for (var j = n - 2; j >= 0; j--) rightMax[j] = Math.max(rightMax[j + 1], arr[j]);\n    var p = 0, q = 0, best = 0;\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            if (q - p > best) best = q - p;\n            q++;\n        } else p++;\n    }\n    return best;\n};`,
        typescript: `function maxIndexDiff(arr: number[]): number {\n    var n = arr.length;\n    var leftMin: number[] = [], rightMax: number[] = [];\n    for (var t = 0; t < n; t++) { leftMin.push(0); rightMax.push(0); }\n    leftMin[0] = arr[0];\n    for (var i = 1; i < n; i++) leftMin[i] = Math.min(leftMin[i - 1], arr[i]);\n    rightMax[n - 1] = arr[n - 1];\n    for (var j = n - 2; j >= 0; j--) rightMax[j] = Math.max(rightMax[j + 1], arr[j]);\n    var p = 0, q = 0, best = 0;\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            if (q - p > best) best = q - p;\n            q++;\n        } else p++;\n    }\n    return best;\n}`,
        java: `public static int maxIndexDiff(int[] arr) {\n    int n = arr.length;\n    int[] leftMin = new int[n];\n    int[] rightMax = new int[n];\n    leftMin[0] = arr[0];\n    for (int i = 1; i < n; i++) leftMin[i] = Math.min(leftMin[i - 1], arr[i]);\n    rightMax[n - 1] = arr[n - 1];\n    for (int j = n - 2; j >= 0; j--) rightMax[j] = Math.max(rightMax[j + 1], arr[j]);\n    int p = 0, q = 0, best = 0;\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            best = Math.max(best, q - p);\n            q++;\n        } else p++;\n    }\n    return best;\n}`,
        cpp: `int maxIndexDiff(vector<int>& arr) {\n    int n = (int) arr.size();\n    vector<int> leftMin(n), rightMax(n);\n    leftMin[0] = arr[0];\n    for (int i = 1; i < n; i++) leftMin[i] = min(leftMin[i - 1], arr[i]);\n    rightMax[n - 1] = arr[n - 1];\n    for (int j = n - 2; j >= 0; j--) rightMax[j] = max(rightMax[j + 1], arr[j]);\n    int p = 0, q = 0, best = 0;\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            if (q - p > best) best = q - p;\n            q++;\n        } else p++;\n    }\n    return best;\n}`,
        c: `int maxIndexDiff(int* arr, int arrSize) {\n    int n = arrSize;\n    int* leftMin = (int*) malloc((size_t) n * sizeof(int));\n    int* rightMax = (int*) malloc((size_t) n * sizeof(int));\n    leftMin[0] = arr[0];\n    for (int i = 1; i < n; i++) leftMin[i] = leftMin[i - 1] < arr[i] ? leftMin[i - 1] : arr[i];\n    rightMax[n - 1] = arr[n - 1];\n    for (int j = n - 2; j >= 0; j--) rightMax[j] = rightMax[j + 1] > arr[j] ? rightMax[j + 1] : arr[j];\n    int p = 0, q = 0, best = 0;\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            if (q - p > best) best = q - p;\n            q++;\n        } else p++;\n    }\n    free(leftMin);\n    free(rightMax);\n    return best;\n}`,
        csharp: `public static int MaxIndexDiff(int[] arr)\n{\n    int n = arr.Length;\n    int[] leftMin = new int[n];\n    int[] rightMax = new int[n];\n    leftMin[0] = arr[0];\n    for (int i = 1; i < n; i++) leftMin[i] = Math.Min(leftMin[i - 1], arr[i]);\n    rightMax[n - 1] = arr[n - 1];\n    for (int j = n - 2; j >= 0; j--) rightMax[j] = Math.Max(rightMax[j + 1], arr[j]);\n    int p = 0, q = 0, best = 0;\n    while (p < n && q < n)\n    {\n        if (leftMin[p] <= rightMax[q])\n        {\n            if (q - p > best) best = q - p;\n            q++;\n        }\n        else p++;\n    }\n    return best;\n}`,
        go: `func maxIndexDiff(arr []int) int {\n\tn := len(arr)\n\tleftMin := make([]int, n)\n\trightMax := make([]int, n)\n\tleftMin[0] = arr[0]\n\tfor i := 1; i < n; i++ {\n\t\tleftMin[i] = leftMin[i-1]\n\t\tif arr[i] < leftMin[i] {\n\t\t\tleftMin[i] = arr[i]\n\t\t}\n\t}\n\trightMax[n-1] = arr[n-1]\n\tfor j := n - 2; j >= 0; j-- {\n\t\trightMax[j] = rightMax[j+1]\n\t\tif arr[j] > rightMax[j] {\n\t\t\trightMax[j] = arr[j]\n\t\t}\n\t}\n\tp, q, best := 0, 0, 0\n\tfor p < n && q < n {\n\t\tif leftMin[p] <= rightMax[q] {\n\t\t\tif q-p > best {\n\t\t\t\tbest = q - p\n\t\t\t}\n\t\t\tq++\n\t\t} else {\n\t\t\tp++\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxIndexDiff(arr: IntArray): Int {\n    val n = arr.size\n    val leftMin = IntArray(n)\n    val rightMax = IntArray(n)\n    leftMin[0] = arr[0]\n    for (i in 1 until n) leftMin[i] = minOf(leftMin[i - 1], arr[i])\n    rightMax[n - 1] = arr[n - 1]\n    for (j in n - 2 downTo 0) rightMax[j] = maxOf(rightMax[j + 1], arr[j])\n    var p = 0\n    var q = 0\n    var best = 0\n    while (p < n && q < n) {\n        if (leftMin[p] <= rightMax[q]) {\n            if (q - p > best) best = q - p\n            q++\n        } else p++\n    }\n    return best\n}`,
        swift: `func maxIndexDiff(_ arr: [Int]) -> Int {\n    let n = arr.count\n    var leftMin = [Int](repeating: 0, count: n)\n    var rightMax = [Int](repeating: 0, count: n)\n    leftMin[0] = arr[0]\n    for i in 1..<max(n, 1) where i < n {\n        leftMin[i] = min(leftMin[i - 1], arr[i])\n    }\n    rightMax[n - 1] = arr[n - 1]\n    var j = n - 2\n    while j >= 0 {\n        rightMax[j] = max(rightMax[j + 1], arr[j])\n        j -= 1\n    }\n    var p = 0, q = 0, best = 0\n    while p < n && q < n {\n        if leftMin[p] <= rightMax[q] {\n            if q - p > best { best = q - p }\n            q += 1\n        } else {\n            p += 1\n        }\n    }\n    return best\n}`,
        rust: `fn maxIndexDiff(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    let mut left_min = vec![0i32; n];\n    let mut right_max = vec![0i32; n];\n    left_min[0] = arr[0];\n    for i in 1..n {\n        left_min[i] = left_min[i - 1].min(arr[i]);\n    }\n    right_max[n - 1] = arr[n - 1];\n    for j in (0..n - 1).rev() {\n        right_max[j] = right_max[j + 1].max(arr[j]);\n    }\n    let (mut p, mut q, mut best) = (0usize, 0usize, 0i32);\n    while p < n && q < n {\n        if left_min[p] <= right_max[q] {\n            if (q - p) as i32 > best {\n                best = (q - p) as i32;\n            }\n            q += 1;\n        } else {\n            p += 1;\n        }\n    }\n    best\n}`,
        php: `function maxIndexDiff($arr) {\n    $n = count($arr);\n    $leftMin = array_fill(0, $n, 0);\n    $rightMax = array_fill(0, $n, 0);\n    $leftMin[0] = $arr[0];\n    for ($i = 1; $i < $n; $i++) $leftMin[$i] = min($leftMin[$i - 1], $arr[$i]);\n    $rightMax[$n - 1] = $arr[$n - 1];\n    for ($j = $n - 2; $j >= 0; $j--) $rightMax[$j] = max($rightMax[$j + 1], $arr[$j]);\n    $p = 0; $q = 0; $best = 0;\n    while ($p < $n && $q < $n) {\n        if ($leftMin[$p] <= $rightMax[$q]) {\n            if ($q - $p > $best) $best = $q - $p;\n            $q++;\n        } else $p++;\n    }\n    return $best;\n}`,
        ruby: `def maxIndexDiff(arr)\n  n = arr.length\n  left_min = Array.new(n, 0)\n  right_max = Array.new(n, 0)\n  left_min[0] = arr[0]\n  (1...n).each { |i| left_min[i] = [left_min[i - 1], arr[i]].min }\n  right_max[n - 1] = arr[n - 1]\n  (n - 2).downto(0) { |j| right_max[j] = [right_max[j + 1], arr[j]].max }\n  p = 0\n  q = 0\n  best = 0\n  while p < n && q < n\n    if left_min[p] <= right_max[q]\n      best = q - p if q - p > best\n      q += 1\n    else\n      p += 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Kth Smallest Element (GFG) ──────────────────────────────────
  (() => {
    const ref = (arr: number[], k: number) => arr.slice().sort((a, b) => a - b)[k - 1];
    return {
      slug: "kth-smallest-element",
      title: "Kth Smallest Element",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Quickselect", "Amazon", "Microsoft", "Flipkart"],
      signature: { funcName: "kthSmallest", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` of **distinct** integers and a number `k`, return the `k`-th smallest element — the value that would sit at index `k - 1` if the array were sorted ascending.\n\n`k` is 1-based and always valid.",
        [
          { in: "arr = [7,10,4,3,20,15], k = 3", out: "7", note: "Sorted it is [3,4,7,10,15,20]; the 3rd value is 7." },
          { in: "arr = [7,10,4,20,15], k = 4", out: "15" },
          { in: "arr = [5], k = 1", out: "5" },
        ],
        ["1 <= arr.length <= 100000", "1 <= k <= arr.length", "1 <= arr[i] <= 1000000000", "All values in arr are distinct."]),
      hints: [
        "Sorting and indexing is O(n log n) and completely acceptable.",
        "The interview answer is quickselect: partition like quicksort, but recurse into only the side that contains index `k - 1`.",
        "A max-heap of size `k` is the third standard route and streams the input.",
      ],
      editorial: explain({
        idea: "Sorting puts the answer at index `k - 1` by definition. The faster route is quickselect: partition around a pivot and recurse into only the half that can hold the target index, which averages linear time.",
        steps: [
          "Sort a copy of `arr` ascending.",
          "Return the element at index `k - 1`.",
          "For quickselect instead: partition around a pivot at final index `p`. If `p == k - 1` the pivot is the answer; if `p > k - 1` recurse left, otherwise recurse right.",
        ],
        why: "After partitioning, the pivot is in its final sorted position, so comparing `p` with `k - 1` tells you which side holds the answer — the other side can be discarded entirely. Halving the work each time gives `O(n)` expected total.",
        time: "O(n log n) sorting, O(n) expected with quickselect",
        space: "O(n) for the copy, O(1) extra for in-place quickselect",
        pitfalls: [
          "Off-by-one: `k` is 1-based but array indices are 0-based.",
          "Quickselect degrades to O(n²) on adversarial pivots — randomise or use median-of-three.",
        ],
      }),
      examples: [
        { input: "[7,10,4,3,20,15]\n3", expectedOutput: "7" },
        { input: "[7,10,4,20,15]\n4", expectedOutput: "15" },
        { input: "[5]\n1", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const used: Record<string, boolean> = {};
        const arr: number[] = [];
        while (arr.length < n) {
          const v = ri(rng, 1, 1000000000);
          if (used[String(v)] !== true) { used[String(v)] = true; arr.push(v); }
        }
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef kthSmallest(arr: List[int], k: int) -> int:\n    return sorted(arr)[k - 1]`,
        javascript: `var kthSmallest = function(arr, k) {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    return s[k - 1];\n};`,
        typescript: `function kthSmallest(arr: number[], k: number): number {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    return s[k - 1];\n}`,
        java: `public static int kthSmallest(int[] arr, int k) {\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    return s[k - 1];\n}`,
        cpp: `int kthSmallest(vector<int>& arr, int k) {\n    vector<int> s = arr;\n    nth_element(s.begin(), s.begin() + (k - 1), s.end());\n    return s[k - 1];\n}`,
        c: `static int cmpKthAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint kthSmallest(int* arr, int arrSize, int k) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, (size_t) arrSize, sizeof(int), cmpKthAsc);\n    int ans = s[k - 1];\n    free(s);\n    return ans;\n}`,
        csharp: `public static int KthSmallest(int[] arr, int k)\n{\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    return s[k - 1];\n}`,
        go: `func kthSmallest(arr []int, k int) int {\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\treturn s[k-1]\n}`,
        kotlin: `fun kthSmallest(arr: IntArray, k: Int): Int {\n    val s = arr.sortedArray()\n    return s[k - 1]\n}`,
        swift: `func kthSmallest(_ arr: [Int], _ k: Int) -> Int {\n    let s = arr.sorted()\n    return s[k - 1]\n}`,
        rust: `fn kthSmallest(arr: Vec<i32>, k: i32) -> i32 {\n    let mut s = arr.clone();\n    s.sort();\n    s[(k - 1) as usize]\n}`,
        php: `function kthSmallest($arr, $k) {\n    $s = $arr;\n    sort($s);\n    return $s[$k - 1];\n}`,
        ruby: `def kthSmallest(arr, k)\n  arr.sort[k - 1]\nend`,
      },
    };
  })(),

  // ── Count Triplets With Sum Smaller Than X (GFG) ────────────────
  (() => {
    const ref = (arr: number[], target: number) => {
      const s = arr.slice().sort((a, b) => a - b);
      let total = 0;
      for (let i = 0; i < s.length - 2; i++) {
        let lo = i + 1, hi = s.length - 1;
        while (lo < hi) {
          if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }
          else hi--;
        }
      }
      return total;
    };
    return {
      slug: "count-triplets-with-sum-smaller-than-x",
      title: "Count Triplets With Sum Smaller Than X",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Adobe", "Samsung"],
      signature: { funcName: "countTriplets", params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` and an integer `target`, count the triples of indices `(i, j, k)` with `i < j < k` whose values sum to **strictly less than** `target`.",
        [
          { in: "arr = [-2,0,1,3], target = 2", out: "2", note: "(-2,0,1) sums to -1 and (-2,0,3) sums to 1. Both are below 2." },
          { in: "arr = [5,1,3,4,7], target = 12", out: "4", note: "(1,3,4), (1,3,5), (1,3,7) and (1,4,5)." },
          { in: "arr = [1,2,3], target = 5", out: "0" },
        ],
        ["3 <= arr.length <= 200", "-1000 <= arr[i] <= 1000", "-3000 <= target <= 3000"]),
      hints: [
        "Sorting does not change which triples exist — only how easily you can count them.",
        "Fix the smallest element, then two-pointer over the rest.",
        "When `s[i] + s[lo] + s[hi] < target`, every index between `lo` and `hi` also works with `s[lo]` — that is `hi - lo` triples at once.",
      ],
      editorial: explain({
        idea: "Sort, fix the first element, and two-pointer the remaining suffix. The key counting trick is that a single successful comparison settles a whole block of triples at once.",
        steps: [
          "Sort `arr` ascending.",
          "For each `i`, set `lo = i + 1` and `hi = n - 1`.",
          "If `s[i] + s[lo] + s[hi] < target`, then pairing `s[lo]` with any of `s[lo+1] … s[hi]` also stays under the target — add `hi - lo` and advance `lo`.",
          "Otherwise the sum is too big, so decrement `hi`.",
        ],
        why: "The array is sorted, so `s[lo] + s[m] <= s[lo] + s[hi]` for every `m` between `lo` and `hi`. One passing comparison therefore certifies all `hi - lo` of those triples, and each pointer moves at most `n` times, keeping the inner loop linear.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Adding `1` instead of `hi - lo` turns the counting into an O(n³) enumeration in disguise — and undercounts.",
          "Strictly less than, not less than or equal — a triple that hits `target` exactly does not count.",
        ],
      }),
      examples: [
        { input: "[-2,0,1,3]\n2", expectedOutput: "2" },
        { input: "[5,1,3,4,7]\n12", expectedOutput: "4" },
        { input: "[1,2,3]\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 60);
        const hi = rng() < 0.5 ? 10 : 1000;
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const target = ri(rng, -3 * hi, 3 * hi);
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: String(ref(arr, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countTriplets(arr: List[int], target: int) -> int:\n    s = sorted(arr)\n    total = 0\n    for i in range(len(s) - 2):\n        lo, hi = i + 1, len(s) - 1\n        while lo < hi:\n            if s[i] + s[lo] + s[hi] < target:\n                total += hi - lo\n                lo += 1\n            else:\n                hi -= 1\n    return total`,
        javascript: `var countTriplets = function(arr, target) {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var total = 0;\n    for (var i = 0; i < s.length - 2; i++) {\n        var lo = i + 1, hi = s.length - 1;\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    return total;\n};`,
        typescript: `function countTriplets(arr: number[], target: number): number {\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var total = 0;\n    for (var i = 0; i < s.length - 2; i++) {\n        var lo = i + 1, hi = s.length - 1;\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    return total;\n}`,
        java: `public static int countTriplets(int[] arr, int target) {\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    int total = 0;\n    for (int i = 0; i < s.length - 2; i++) {\n        int lo = i + 1, hi = s.length - 1;\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    return total;\n}`,
        cpp: `int countTriplets(vector<int>& arr, int target) {\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    int total = 0;\n    for (int i = 0; i + 2 < (int) s.size(); i++) {\n        int lo = i + 1, hi = (int) s.size() - 1;\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    return total;\n}`,
        c: `static int cmpTripAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint countTriplets(int* arr, int arrSize, int target) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, (size_t) arrSize, sizeof(int), cmpTripAsc);\n    int total = 0;\n    for (int i = 0; i + 2 < arrSize; i++) {\n        int lo = i + 1, hi = arrSize - 1;\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    free(s);\n    return total;\n}`,
        csharp: `public static int CountTriplets(int[] arr, int target)\n{\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    int total = 0;\n    for (int i = 0; i + 2 < s.Length; i++)\n    {\n        int lo = i + 1, hi = s.Length - 1;\n        while (lo < hi)\n        {\n            if (s[i] + s[lo] + s[hi] < target) { total += hi - lo; lo++; }\n            else hi--;\n        }\n    }\n    return total;\n}`,
        go: `func countTriplets(arr []int, target int) int {\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\ttotal := 0\n\tfor i := 0; i+2 < len(s); i++ {\n\t\tlo, hi := i+1, len(s)-1\n\t\tfor lo < hi {\n\t\t\tif s[i]+s[lo]+s[hi] < target {\n\t\t\t\ttotal += hi - lo\n\t\t\t\tlo++\n\t\t\t} else {\n\t\t\t\thi--\n\t\t\t}\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countTriplets(arr: IntArray, target: Int): Int {\n    val s = arr.sortedArray()\n    var total = 0\n    for (i in 0 until s.size - 2) {\n        var lo = i + 1\n        var hi = s.size - 1\n        while (lo < hi) {\n            if (s[i] + s[lo] + s[hi] < target) {\n                total += hi - lo\n                lo++\n            } else {\n                hi--\n            }\n        }\n    }\n    return total\n}`,
        swift: `func countTriplets(_ arr: [Int], _ target: Int) -> Int {\n    let s = arr.sorted()\n    var total = 0\n    for i in 0..<(s.count - 2) {\n        var lo = i + 1\n        var hi = s.count - 1\n        while lo < hi {\n            if s[i] + s[lo] + s[hi] < target {\n                total += hi - lo\n                lo += 1\n            } else {\n                hi -= 1\n            }\n        }\n    }\n    return total\n}`,
        rust: `fn countTriplets(arr: Vec<i32>, target: i32) -> i32 {\n    let mut s = arr.clone();\n    s.sort();\n    let mut total = 0i32;\n    for i in 0..s.len() - 2 {\n        let mut lo = i + 1;\n        let mut hi = s.len() - 1;\n        while lo < hi {\n            if s[i] + s[lo] + s[hi] < target {\n                total += (hi - lo) as i32;\n                lo += 1;\n            } else {\n                hi -= 1;\n            }\n        }\n    }\n    total\n}`,
        php: `function countTriplets($arr, $target) {\n    $s = $arr;\n    sort($s);\n    $total = 0;\n    $n = count($s);\n    for ($i = 0; $i + 2 < $n; $i++) {\n        $lo = $i + 1;\n        $hi = $n - 1;\n        while ($lo < $hi) {\n            if ($s[$i] + $s[$lo] + $s[$hi] < $target) { $total += $hi - $lo; $lo++; }\n            else $hi--;\n        }\n    }\n    return $total;\n}`,
        ruby: `def countTriplets(arr, target)\n  s = arr.sort\n  total = 0\n  (0...(s.length - 2)).each do |i|\n    lo = i + 1\n    hi = s.length - 1\n    while lo < hi\n      if s[i] + s[lo] + s[hi] < target\n        total += hi - lo\n        lo += 1\n      else\n        hi -= 1\n      end\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count of Smaller Numbers After Self (LC 315) ────────────────
  (() => {
    const OFF = 1001, SIZE = 2002;
    const ref = (nums: number[]) => {
      const bit = new Array(SIZE + 1).fill(0);
      const out: number[] = [];
      for (let i = nums.length - 1; i >= 0; i--) {
        const v = nums[i] + OFF;
        let s = 0;
        for (let p = v - 1; p > 0; p -= p & -p) s += bit[p];
        out.push(s);
        for (let q = v; q <= SIZE; q += q & -q) bit[q]++;
      }
      out.reverse();
      return out;
    };
    return {
      slug: "count-of-smaller-numbers-after-self",
      title: "Count of Smaller Numbers After Self",
      difficulty: "HARD" as const,
      tags: ["Array", "Fenwick Tree", "Divide and Conquer", "Google", "Amazon", "Uber"],
      signature: { funcName: "countSmaller", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums`, return an array `counts` where `counts[i]` is the number of elements **to the right of** `nums[i]` that are strictly smaller than it.",
        [
          { in: "nums = [5,2,6,1]", out: "[2,1,1,0]", note: "To the right of 5 sit 2 and 1; to the right of 2 sits 1; to the right of 6 sits 1; nothing follows 1." },
          { in: "nums = [-1,-1]", out: "[0,0]", note: "Equal values do not count — the comparison is strict." },
          { in: "nums = [3,2,1]", out: "[2,1,0]" },
        ],
        ["1 <= nums.length <= 100000", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "The O(n²) double loop is the thing to beat.",
        "Walk **right to left** and ask: of the values already inserted, how many are strictly smaller than the current one?",
        "A Fenwick tree over the value range answers that as a prefix sum. Shift the values so the smallest maps to index 1 — a Fenwick tree cannot hold index 0.",
      ],
      editorial: explain({
        idea: "Process the array from right to left, maintaining a frequency table of everything already seen — which is exactly 'everything to the right'. The answer for the current element is the count of stored values strictly below it, a prefix sum a Fenwick tree serves in `O(log V)`.",
        steps: [
          "Offset every value by `+1001` so the range `[-1000, 1000]` becomes `[1, 2001]`; a Fenwick tree is 1-indexed and would loop forever on index 0.",
          "Sweep `i` from `n - 1` down to `0`. Query the prefix sum up to `v - 1` — the number of stored values strictly less than `v` — and record it.",
          "Insert `v` into the tree, then continue.",
          "Reverse the collected answers, since they were produced right to left.",
        ],
        why: "When index `i` is processed, the tree holds precisely `nums[i+1..n-1]`, so `prefix(v - 1)` counts exactly the elements to the right that are strictly smaller. Using `v - 1` rather than `v` is what excludes ties.",
        time: "O(n log V)",
        space: "O(V)",
        pitfalls: [
          "Querying `prefix(v)` counts equal values too and overcounts every duplicate.",
          "Forgetting the final reverse returns the answers back to front.",
          "Merge sort with an index array is the other standard solution and has the same complexity.",
        ],
      }),
      examples: [
        { input: "[5,2,6,1]", expectedOutput: "[2,1,1,0]" },
        { input: "[-1,-1]", expectedOutput: "[0,0]" },
        { input: "[3,2,1]", expectedOutput: "[2,1,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 80);
        const hi = rng() < 0.4 ? 5 : 1000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countSmaller(nums: List[int]) -> List[int]:\n    OFF, SIZE = 1001, 2002\n    bit = [0] * (SIZE + 1)\n    out = []\n    for i in range(len(nums) - 1, -1, -1):\n        v = nums[i] + OFF\n        s = 0\n        p = v - 1\n        while p > 0:\n            s += bit[p]\n            p -= p & -p\n        out.append(s)\n        q = v\n        while q <= SIZE:\n            bit[q] += 1\n            q += q & -q\n    out.reverse()\n    return out`,
        javascript: `var countSmaller = function(nums) {\n    var OFF = 1001, SIZE = 2002;\n    var bit = [];\n    for (var t = 0; t <= SIZE; t++) bit.push(0);\n    var out = [];\n    for (var i = nums.length - 1; i >= 0; i--) {\n        var v = nums[i] + OFF;\n        var s = 0;\n        for (var p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out.push(s);\n        for (var q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    out.reverse();\n    return out;\n};`,
        typescript: `function countSmaller(nums: number[]): number[] {\n    var OFF = 1001, SIZE = 2002;\n    var bit: number[] = [];\n    for (var t = 0; t <= SIZE; t++) bit.push(0);\n    var out: number[] = [];\n    for (var i = nums.length - 1; i >= 0; i--) {\n        var v = nums[i] + OFF;\n        var s = 0;\n        for (var p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out.push(s);\n        for (var q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    out.reverse();\n    return out;\n}`,
        java: `public static int[] countSmaller(int[] nums) {\n    final int OFF = 1001, SIZE = 2002;\n    int[] bit = new int[SIZE + 1];\n    int n = nums.length;\n    int[] out = new int[n];\n    for (int i = n - 1; i >= 0; i--) {\n        int v = nums[i] + OFF;\n        int s = 0;\n        for (int p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out[i] = s;\n        for (int q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    return out;\n}`,
        cpp: `vector<int> countSmaller(vector<int>& nums) {\n    const int OFF = 1001, SIZE = 2002;\n    vector<int> bit(SIZE + 1, 0);\n    int n = (int) nums.size();\n    vector<int> out(n);\n    for (int i = n - 1; i >= 0; i--) {\n        int v = nums[i] + OFF;\n        int s = 0;\n        for (int p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out[i] = s;\n        for (int q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    return out;\n}`,
        c: `int* countSmaller(int* nums, int numsSize, int* returnSize) {\n    const int OFF = 1001, SIZE = 2002;\n    int* bit = (int*) calloc((size_t) SIZE + 1, sizeof(int));\n    int* out = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = numsSize - 1; i >= 0; i--) {\n        int v = nums[i] + OFF;\n        int s = 0;\n        for (int p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out[i] = s;\n        for (int q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    free(bit);\n    *returnSize = numsSize;\n    return out;\n}`,
        csharp: `public static int[] CountSmaller(int[] nums)\n{\n    const int OFF = 1001, SIZE = 2002;\n    int[] bit = new int[SIZE + 1];\n    int n = nums.Length;\n    int[] out_ = new int[n];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        int v = nums[i] + OFF;\n        int s = 0;\n        for (int p = v - 1; p > 0; p -= p & -p) s += bit[p];\n        out_[i] = s;\n        for (int q = v; q <= SIZE; q += q & -q) bit[q]++;\n    }\n    return out_;\n}`,
        go: `func countSmaller(nums []int) []int {\n\tconst off, size = 1001, 2002\n\tbit := make([]int, size+1)\n\tn := len(nums)\n\tout := make([]int, n)\n\tfor i := n - 1; i >= 0; i-- {\n\t\tv := nums[i] + off\n\t\ts := 0\n\t\tfor p := v - 1; p > 0; p -= p & -p {\n\t\t\ts += bit[p]\n\t\t}\n\t\tout[i] = s\n\t\tfor q := v; q <= size; q += q & -q {\n\t\t\tbit[q]++\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun countSmaller(nums: IntArray): IntArray {\n    val off = 1001\n    val size = 2002\n    val bit = IntArray(size + 1)\n    val n = nums.size\n    val out = IntArray(n)\n    for (i in n - 1 downTo 0) {\n        val v = nums[i] + off\n        var s = 0\n        var p = v - 1\n        while (p > 0) {\n            s += bit[p]\n            p -= p and -p\n        }\n        out[i] = s\n        var q = v\n        while (q <= size) {\n            bit[q]++\n            q += q and -q\n        }\n    }\n    return out\n}`,
        swift: `func countSmaller(_ nums: [Int]) -> [Int] {\n    let off = 1001\n    let size = 2002\n    var bit = [Int](repeating: 0, count: size + 1)\n    let n = nums.count\n    var out = [Int](repeating: 0, count: n)\n    var i = n - 1\n    while i >= 0 {\n        let v = nums[i] + off\n        var s = 0\n        var p = v - 1\n        while p > 0 {\n            s += bit[p]\n            p -= p & -p\n        }\n        out[i] = s\n        var q = v\n        while q <= size {\n            bit[q] += 1\n            q += q & -q\n        }\n        i -= 1\n    }\n    return out\n}`,
        rust: `fn countSmaller(nums: Vec<i32>) -> Vec<i32> {\n    let off: i32 = 1001;\n    let size: i32 = 2002;\n    let mut bit = vec![0i32; (size + 1) as usize];\n    let n = nums.len();\n    let mut out = vec![0i32; n];\n    for i in (0..n).rev() {\n        let v = nums[i] + off;\n        let mut s = 0i32;\n        let mut p = v - 1;\n        while p > 0 {\n            s += bit[p as usize];\n            p -= p & -p;\n        }\n        out[i] = s;\n        let mut q = v;\n        while q <= size {\n            bit[q as usize] += 1;\n            q += q & -q;\n        }\n    }\n    out\n}`,
        php: `function countSmaller($nums) {\n    $off = 1001;\n    $size = 2002;\n    $bit = array_fill(0, $size + 1, 0);\n    $n = count($nums);\n    $out = array_fill(0, $n, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $v = $nums[$i] + $off;\n        $s = 0;\n        for ($p = $v - 1; $p > 0; $p -= $p & -$p) $s += $bit[$p];\n        $out[$i] = $s;\n        for ($q = $v; $q <= $size; $q += $q & -$q) $bit[$q]++;\n    }\n    return $out;\n}`,
        ruby: `def countSmaller(nums)\n  off = 1001\n  size = 2002\n  bit = Array.new(size + 1, 0)\n  n = nums.length\n  out = Array.new(n, 0)\n  (n - 1).downto(0) do |i|\n    v = nums[i] + off\n    s = 0\n    p = v - 1\n    while p > 0\n      s += bit[p]\n      p -= p & -p\n    end\n    out[i] = s\n    q = v\n    while q <= size\n      bit[q] += 1\n      q += q & -q\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Max Value of Equation (LC 1499) ─────────────────────────────
  (() => {
    const ref = (points: number[][], k: number) => {
      const dq: number[] = [];
      let head = 0;
      let best = -Infinity;
      for (let j = 0; j < points.length; j++) {
        const xj = points[j][0], yj = points[j][1];
        while (head < dq.length && xj - points[dq[head]][0] > k) head++;
        if (head < dq.length) {
          const i = dq[head];
          const v = yj + xj + (points[i][1] - points[i][0]);
          if (v > best) best = v;
        }
        const cur = yj - xj;
        while (head < dq.length && points[dq[dq.length - 1]][1] - points[dq[dq.length - 1]][0] <= cur) dq.pop();
        dq.push(j);
      }
      return best;
    };
    return {
      slug: "max-value-of-equation",
      title: "Max Value of Equation",
      difficulty: "HARD" as const,
      tags: ["Array", "Monotonic Queue", "Sliding Window", "Google", "Amazon", "Meta"],
      signature: { funcName: "findMaxValueOfEquation", params: [{ name: "points", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given `points`, where `points[i] = [xi, yi]`, sorted by `x` in strictly increasing order, and an integer `k`.\n\nReturn the maximum value of `yi + yj + |xi - xj|` over all pairs `i < j` with `|xi - xj| <= k`.\n\nAt least one such pair is guaranteed to exist.",
        [
          { in: "points = [[1,3],[2,0],[5,10],[6,-10]], k = 1", out: "4", note: "Pairing (1,3) with (2,0) gives 3 + 0 + 1 = 4; the pair (5,10),(6,-10) gives 1." },
          { in: "points = [[0,0],[3,0],[9,2]], k = 3", out: "3", note: "Only (0,0) and (3,0) are within k, giving 0 + 0 + 3 = 3." },
          { in: "points = [[-19,9],[-15,-19],[-5,-8]], k = 10", out: "-6", note: "(-19,9) with (-15,-19) gives 9 - 19 + 4 = -6." },
        ],
        ["2 <= points.length <= 100000", "-100000 <= xi, yi <= 100000", "xi < xj for all i < j", "0 <= k <= 200000"]),
      hints: [
        "Because `x` is increasing, `i < j` means `xi < xj`, so `|xi - xj|` is just `xj - xi`.",
        "Rewrite the objective as `(yj + xj) + (yi - xi)`. The first bracket depends only on `j`.",
        "So for each `j` you want the largest `yi - xi` among the `i` still inside the window `xj - xi <= k` — a sliding-window maximum, which a monotonic deque answers in O(1) amortised.",
      ],
      editorial: explain({
        idea: "Sorted `x` removes the absolute value, and the expression splits into a part that depends only on `j` and a part that depends only on `i`. The task becomes a sliding-window maximum of `yi - xi`, which is the textbook monotonic-deque problem.",
        steps: [
          "Keep a deque of indices whose `y - x` values are strictly decreasing from front to back.",
          "For each `j`, pop from the **front** while `xj - x[front] > k` — those points have fallen out of the window.",
          "The front now holds the best `yi - xi` in range, so the candidate answer is `yj + xj + (y[front] - x[front])`.",
          "Before pushing `j`, pop from the **back** while the back's `y - x` is at most `yj - xj` — it can never win again.",
        ],
        why: "A point that is both older and has a smaller `y - x` than a newer point is dominated: it leaves the window sooner and is worth less, so discarding it loses nothing. That leaves a decreasing deque whose front is the window maximum. Each index is pushed and popped once, giving linear total work.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Evicting from the front *after* reading the candidate uses points that are out of range.",
          "The answer can be negative, so initialising `best` to `0` is wrong — start from negative infinity.",
          "Pushing `j` before computing the candidate would let a point pair with itself.",
        ],
      }),
      examples: [
        { input: "[[1,3],[2,0],[5,10],[6,-10]]\n1", expectedOutput: "4" },
        { input: "[[0,0],[3,0],[9,2]]\n3", expectedOutput: "3" },
        { input: "[[-19,9],[-15,-19],[-5,-8]]\n10", expectedOutput: "-6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        let x = ri(rng, -100000, -100000 + 1000);
        const points: number[][] = [];
        for (let i = 0; i < n; i++) {
          points.push([x, ri(rng, -100000, 100000)]);
          x += ri(rng, 1, 30);
        }
        let k = rng() < 0.3 ? ri(rng, 0, 5) : ri(rng, 1, 200);
        // The statement guarantees at least one pair inside the window, so widen
        // k to the narrowest adjacent gap when the draw came out too small.
        let minGap = Infinity;
        for (let i = 1; i < n; i++) minGap = Math.min(minGap, points[i][0] - points[i - 1][0]);
        if (k < minGap) k = minGap;
        return { input: `${fmtIntMat(points)}\n${k}`, expectedOutput: String(ref(points, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMaxValueOfEquation(points: List[List[int]], k: int) -> int:\n    dq = []\n    head = 0\n    best = None\n    for j in range(len(points)):\n        xj, yj = points[j][0], points[j][1]\n        while head < len(dq) and xj - points[dq[head]][0] > k:\n            head += 1\n        if head < len(dq):\n            i = dq[head]\n            v = yj + xj + points[i][1] - points[i][0]\n            if best is None or v > best:\n                best = v\n        cur = yj - xj\n        while head < len(dq) and points[dq[-1]][1] - points[dq[-1]][0] <= cur:\n            dq.pop()\n        dq.append(j)\n    return best`,
        javascript: `var findMaxValueOfEquation = function(points, k) {\n    var dq = [];\n    var head = 0;\n    var best = -Infinity;\n    for (var j = 0; j < points.length; j++) {\n        var xj = points[j][0], yj = points[j][1];\n        while (head < dq.length && xj - points[dq[head]][0] > k) head++;\n        if (head < dq.length) {\n            var i = dq[head];\n            var v = yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        var cur = yj - xj;\n        while (head < dq.length && points[dq[dq.length - 1]][1] - points[dq[dq.length - 1]][0] <= cur) dq.pop();\n        dq.push(j);\n    }\n    return best;\n};`,
        typescript: `function findMaxValueOfEquation(points: number[][], k: number): number {\n    var dq: number[] = [];\n    var head = 0;\n    var best = -Infinity;\n    for (var j = 0; j < points.length; j++) {\n        var xj = points[j][0], yj = points[j][1];\n        while (head < dq.length && xj - points[dq[head]][0] > k) head++;\n        if (head < dq.length) {\n            var i = dq[head];\n            var v = yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        var cur = yj - xj;\n        while (head < dq.length && points[dq[dq.length - 1]][1] - points[dq[dq.length - 1]][0] <= cur) dq.pop();\n        dq.push(j);\n    }\n    return best;\n}`,
        java: `public static int findMaxValueOfEquation(int[][] points, int k) {\n    int n = points.length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    long best = Long.MIN_VALUE;\n    for (int j = 0; j < n; j++) {\n        int xj = points[j][0], yj = points[j][1];\n        while (head < tail && xj - points[dq[head]][0] > k) head++;\n        if (head < tail) {\n            int i = dq[head];\n            long v = (long) yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        int cur = yj - xj;\n        while (head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur) tail--;\n        dq[tail++] = j;\n    }\n    return (int) best;\n}`,
        cpp: `int findMaxValueOfEquation(vector<vector<int>>& points, int k) {\n    int n = (int) points.size();\n    vector<int> dq(n);\n    int head = 0, tail = 0;\n    long long best = LLONG_MIN;\n    for (int j = 0; j < n; j++) {\n        int xj = points[j][0], yj = points[j][1];\n        while (head < tail && xj - points[dq[head]][0] > k) head++;\n        if (head < tail) {\n            int i = dq[head];\n            long long v = (long long) yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        int cur = yj - xj;\n        while (head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur) tail--;\n        dq[tail++] = j;\n    }\n    return (int) best;\n}`,
        c: `int findMaxValueOfEquation(int** points, int pointsSize, int* pointsColSize, int k) {\n    int* dq = (int*) malloc((size_t) pointsSize * sizeof(int));\n    int head = 0, tail = 0;\n    long long best = -4000000000LL;\n    for (int j = 0; j < pointsSize; j++) {\n        int xj = points[j][0], yj = points[j][1];\n        while (head < tail && xj - points[dq[head]][0] > k) head++;\n        if (head < tail) {\n            int i = dq[head];\n            long long v = (long long) yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        int cur = yj - xj;\n        while (head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur) tail--;\n        dq[tail++] = j;\n    }\n    free(dq);\n    return (int) best;\n}`,
        csharp: `public static int FindMaxValueOfEquation(int[][] points, int k)\n{\n    int n = points.Length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    long best = long.MinValue;\n    for (int j = 0; j < n; j++)\n    {\n        int xj = points[j][0], yj = points[j][1];\n        while (head < tail && xj - points[dq[head]][0] > k) head++;\n        if (head < tail)\n        {\n            int i = dq[head];\n            long v = (long) yj + xj + points[i][1] - points[i][0];\n            if (v > best) best = v;\n        }\n        int cur = yj - xj;\n        while (head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur) tail--;\n        dq[tail++] = j;\n    }\n    return (int) best;\n}`,
        go: `func findMaxValueOfEquation(points [][]int, k int) int {\n\tn := len(points)\n\tdq := make([]int, n)\n\thead, tail := 0, 0\n\tbest := math.MinInt64\n\tfor j := 0; j < n; j++ {\n\t\txj, yj := points[j][0], points[j][1]\n\t\tfor head < tail && xj-points[dq[head]][0] > k {\n\t\t\thead++\n\t\t}\n\t\tif head < tail {\n\t\t\ti := dq[head]\n\t\t\tv := yj + xj + points[i][1] - points[i][0]\n\t\t\tif v > best {\n\t\t\t\tbest = v\n\t\t\t}\n\t\t}\n\t\tcur := yj - xj\n\t\tfor head < tail && points[dq[tail-1]][1]-points[dq[tail-1]][0] <= cur {\n\t\t\ttail--\n\t\t}\n\t\tdq[tail] = j\n\t\ttail++\n\t}\n\treturn best\n}`,
        kotlin: `fun findMaxValueOfEquation(points: Array<IntArray>, k: Int): Int {\n    val n = points.size\n    val dq = IntArray(n)\n    var head = 0\n    var tail = 0\n    var best = Long.MIN_VALUE\n    for (j in 0 until n) {\n        val xj = points[j][0]\n        val yj = points[j][1]\n        while (head < tail && xj - points[dq[head]][0] > k) head++\n        if (head < tail) {\n            val i = dq[head]\n            val v = yj.toLong() + xj + points[i][1] - points[i][0]\n            if (v > best) best = v\n        }\n        val cur = yj - xj\n        while (head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur) tail--\n        dq[tail] = j\n        tail++\n    }\n    return best.toInt()\n}`,
        swift: `func findMaxValueOfEquation(_ points: [[Int]], _ k: Int) -> Int {\n    let n = points.count\n    var dq = [Int](repeating: 0, count: n)\n    var head = 0\n    var tail = 0\n    var best = Int.min\n    for j in 0..<n {\n        let xj = points[j][0]\n        let yj = points[j][1]\n        while head < tail && xj - points[dq[head]][0] > k { head += 1 }\n        if head < tail {\n            let i = dq[head]\n            let v = yj + xj + points[i][1] - points[i][0]\n            if v > best { best = v }\n        }\n        let cur = yj - xj\n        while head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur { tail -= 1 }\n        dq[tail] = j\n        tail += 1\n    }\n    return best\n}`,
        rust: `fn findMaxValueOfEquation(points: Vec<Vec<i32>>, k: i32) -> i32 {\n    let n = points.len();\n    let mut dq = vec![0usize; n];\n    let mut head = 0usize;\n    let mut tail = 0usize;\n    let mut best = std::i64::MIN;\n    for j in 0..n {\n        let xj = points[j][0];\n        let yj = points[j][1];\n        while head < tail && xj - points[dq[head]][0] > k {\n            head += 1;\n        }\n        if head < tail {\n            let i = dq[head];\n            let v = yj as i64 + xj as i64 + points[i][1] as i64 - points[i][0] as i64;\n            if v > best {\n                best = v;\n            }\n        }\n        let cur = yj - xj;\n        while head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur {\n            tail -= 1;\n        }\n        dq[tail] = j;\n        tail += 1;\n    }\n    best as i32\n}`,
        php: `function findMaxValueOfEquation($points, $k) {\n    $n = count($points);\n    $dq = array_fill(0, $n, 0);\n    $head = 0;\n    $tail = 0;\n    $best = null;\n    for ($j = 0; $j < $n; $j++) {\n        $xj = $points[$j][0];\n        $yj = $points[$j][1];\n        while ($head < $tail && $xj - $points[$dq[$head]][0] > $k) $head++;\n        if ($head < $tail) {\n            $i = $dq[$head];\n            $v = $yj + $xj + $points[$i][1] - $points[$i][0];\n            if ($best === null || $v > $best) $best = $v;\n        }\n        $cur = $yj - $xj;\n        while ($head < $tail && $points[$dq[$tail - 1]][1] - $points[$dq[$tail - 1]][0] <= $cur) $tail--;\n        $dq[$tail] = $j;\n        $tail++;\n    }\n    return $best;\n}`,
        ruby: `def findMaxValueOfEquation(points, k)\n  n = points.length\n  dq = Array.new(n, 0)\n  head = 0\n  tail = 0\n  best = nil\n  (0...n).each do |j|\n    xj = points[j][0]\n    yj = points[j][1]\n    head += 1 while head < tail && xj - points[dq[head]][0] > k\n    if head < tail\n      i = dq[head]\n      v = yj + xj + points[i][1] - points[i][0]\n      best = v if best.nil? || v > best\n    end\n    cur = yj - xj\n    tail -= 1 while head < tail && points[dq[tail - 1]][1] - points[dq[tail - 1]][0] <= cur\n    dq[tail] = j\n    tail += 1\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find Missing and Repeated Values (LC 2965) ──────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const total = n * n;
      const count = new Array(total + 1).fill(0);
      for (const row of grid) { for (const v of row) count[v]++; }
      let rep = 0, miss = 0;
      for (let v = 1; v <= total; v++) {
        if (count[v] === 2) rep = v;
        else if (count[v] === 0) miss = v;
      }
      return [rep, miss];
    };
    return {
      slug: "find-missing-and-repeated-values",
      title: "Find Missing and Repeated Values",
      difficulty: "EASY" as const,
      tags: ["Matrix", "Hash Table", "Math", "TCS", "Infosys", "Oracle"],
      signature: { funcName: "findMissingAndRepeatedValues", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an `n x n` grid that should contain each integer from `1` to `n²` exactly once. Instead one value `a` appears **twice** and one value `b` is **missing**.\n\nReturn `[a, b]`.",
        [
          { in: "grid = [[1,3],[2,2]]", out: "[2,4]", note: "2 appears twice and 4 never appears." },
          { in: "grid = [[9,1,7],[8,9,2],[3,4,6]]", out: "[9,5]", note: "9 is repeated and 5 is missing." },
          { in: "grid = [[1,1],[3,4]]", out: "[1,2]" },
        ],
        ["2 <= n <= 50", "grid.length == grid[i].length == n", "1 <= grid[i][j] <= n * n", "Exactly one value repeats and exactly one is missing."]),
      hints: [
        "The values are bounded by `n²`, which is exactly the number of cells — so a counting array is the natural structure.",
        "Tally every cell, then scan the tallies: a `2` is the repeat, a `0` is the missing value.",
        "The O(1)-space alternative compares the actual sum and sum of squares with their expected values.",
      ],
      editorial: explain({
        idea: "Flatten the grid into a tally over `1 .. n²`. Exactly one value lands on 2 and exactly one on 0, which is precisely the pair being asked for.",
        steps: [
          "Allocate `count` of size `n² + 1`, all zeros.",
          "Increment `count[v]` for every cell value `v`.",
          "Scan `v` from `1` to `n²`: record `v` as the repeat when `count[v] == 2` and as the missing value when `count[v] == 0`.",
          "Return `[repeat, missing]`.",
        ],
        why: "There are `n²` cells and `n²` candidate values; one duplicate forces exactly one omission, so the tallies are all 1 except a single 2 and a single 0.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Returning `[missing, repeat]` — the order is repeat first.",
          "Sizing the counting array at `n` rather than `n²` overflows on the first large cell.",
        ],
      }),
      examples: [
        { input: "[[1,3],[2,2]]", expectedOutput: "[2,4]" },
        { input: "[[9,1,7],[8,9,2],[3,4,6]]", expectedOutput: "[9,5]" },
        { input: "[[1,1],[3,4]]", expectedOutput: "[1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 12);
        const total = n * n;
        const values = shuffle(rng, Array.from({ length: total }, (_, i) => i + 1));
        const missing = ri(rng, 1, total);
        let repeat = ri(rng, 1, total);
        while (repeat === missing) repeat = ri(rng, 1, total);
        const at = values.indexOf(missing);
        values[at] = repeat;
        const grid: number[][] = [];
        for (let r = 0; r < n; r++) grid.push(values.slice(r * n, r * n + n));
        return { input: fmtIntMat(grid), expectedOutput: fmtIntArr(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMissingAndRepeatedValues(grid: List[List[int]]) -> List[int]:\n    n = len(grid)\n    total = n * n\n    count = [0] * (total + 1)\n    for row in grid:\n        for v in row:\n            count[v] += 1\n    rep = miss = 0\n    for v in range(1, total + 1):\n        if count[v] == 2:\n            rep = v\n        elif count[v] == 0:\n            miss = v\n    return [rep, miss]`,
        javascript: `var findMissingAndRepeatedValues = function(grid) {\n    var n = grid.length;\n    var total = n * n;\n    var count = [];\n    for (var t = 0; t <= total; t++) count.push(0);\n    for (var r = 0; r < n; r++) {\n        for (var c = 0; c < n; c++) count[grid[r][c]]++;\n    }\n    var rep = 0, miss = 0;\n    for (var v = 1; v <= total; v++) {\n        if (count[v] === 2) rep = v;\n        else if (count[v] === 0) miss = v;\n    }\n    return [rep, miss];\n};`,
        typescript: `function findMissingAndRepeatedValues(grid: number[][]): number[] {\n    var n = grid.length;\n    var total = n * n;\n    var count: number[] = [];\n    for (var t = 0; t <= total; t++) count.push(0);\n    for (var r = 0; r < n; r++) {\n        for (var c = 0; c < n; c++) count[grid[r][c]]++;\n    }\n    var rep = 0, miss = 0;\n    for (var v = 1; v <= total; v++) {\n        if (count[v] === 2) rep = v;\n        else if (count[v] === 0) miss = v;\n    }\n    return [rep, miss];\n}`,
        java: `public static int[] findMissingAndRepeatedValues(int[][] grid) {\n    int n = grid.length;\n    int total = n * n;\n    int[] count = new int[total + 1];\n    for (int[] row : grid) {\n        for (int v : row) count[v]++;\n    }\n    int rep = 0, miss = 0;\n    for (int v = 1; v <= total; v++) {\n        if (count[v] == 2) rep = v;\n        else if (count[v] == 0) miss = v;\n    }\n    return new int[] { rep, miss };\n}`,
        cpp: `vector<int> findMissingAndRepeatedValues(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    int total = n * n;\n    vector<int> count(total + 1, 0);\n    for (auto& row : grid) {\n        for (int v : row) count[v]++;\n    }\n    int rep = 0, miss = 0;\n    for (int v = 1; v <= total; v++) {\n        if (count[v] == 2) rep = v;\n        else if (count[v] == 0) miss = v;\n    }\n    return { rep, miss };\n}`,
        c: `int* findMissingAndRepeatedValues(int** grid, int gridSize, int* gridColSize, int* returnSize) {\n    int n = gridSize;\n    int total = n * n;\n    int* count = (int*) calloc((size_t) total + 1, sizeof(int));\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) count[grid[r][c]]++;\n    }\n    int rep = 0, miss = 0;\n    for (int v = 1; v <= total; v++) {\n        if (count[v] == 2) rep = v;\n        else if (count[v] == 0) miss = v;\n    }\n    free(count);\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = rep;\n    out[1] = miss;\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] FindMissingAndRepeatedValues(int[][] grid)\n{\n    int n = grid.Length;\n    int total = n * n;\n    int[] count = new int[total + 1];\n    foreach (var row in grid)\n    {\n        foreach (int v in row) count[v]++;\n    }\n    int rep = 0, miss = 0;\n    for (int v = 1; v <= total; v++)\n    {\n        if (count[v] == 2) rep = v;\n        else if (count[v] == 0) miss = v;\n    }\n    return new int[] { rep, miss };\n}`,
        go: `func findMissingAndRepeatedValues(grid [][]int) []int {\n\tn := len(grid)\n\ttotal := n * n\n\tcount := make([]int, total+1)\n\tfor _, row := range grid {\n\t\tfor _, v := range row {\n\t\t\tcount[v]++\n\t\t}\n\t}\n\trep, miss := 0, 0\n\tfor v := 1; v <= total; v++ {\n\t\tif count[v] == 2 {\n\t\t\trep = v\n\t\t} else if count[v] == 0 {\n\t\t\tmiss = v\n\t\t}\n\t}\n\treturn []int{rep, miss}\n}`,
        kotlin: `fun findMissingAndRepeatedValues(grid: Array<IntArray>): IntArray {\n    val n = grid.size\n    val total = n * n\n    val count = IntArray(total + 1)\n    for (row in grid) {\n        for (v in row) count[v]++\n    }\n    var rep = 0\n    var miss = 0\n    for (v in 1..total) {\n        if (count[v] == 2) rep = v\n        else if (count[v] == 0) miss = v\n    }\n    return intArrayOf(rep, miss)\n}`,
        swift: `func findMissingAndRepeatedValues(_ grid: [[Int]]) -> [Int] {\n    let n = grid.count\n    let total = n * n\n    var count = [Int](repeating: 0, count: total + 1)\n    for row in grid {\n        for v in row { count[v] += 1 }\n    }\n    var rep = 0\n    var miss = 0\n    for v in 1...total {\n        if count[v] == 2 { rep = v }\n        else if count[v] == 0 { miss = v }\n    }\n    return [rep, miss]\n}`,
        rust: `fn findMissingAndRepeatedValues(grid: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = grid.len();\n    let total = n * n;\n    let mut count = vec![0i32; total + 1];\n    for row in grid.iter() {\n        for &v in row.iter() {\n            count[v as usize] += 1;\n        }\n    }\n    let mut rep = 0i32;\n    let mut miss = 0i32;\n    for v in 1..=total {\n        if count[v] == 2 {\n            rep = v as i32;\n        } else if count[v] == 0 {\n            miss = v as i32;\n        }\n    }\n    vec![rep, miss]\n}`,
        php: `function findMissingAndRepeatedValues($grid) {\n    $n = count($grid);\n    $total = $n * $n;\n    $count = array_fill(0, $total + 1, 0);\n    foreach ($grid as $row) {\n        foreach ($row as $v) $count[$v]++;\n    }\n    $rep = 0;\n    $miss = 0;\n    for ($v = 1; $v <= $total; $v++) {\n        if ($count[$v] === 2) $rep = $v;\n        else if ($count[$v] === 0) $miss = $v;\n    }\n    return array($rep, $miss);\n}`,
        ruby: `def findMissingAndRepeatedValues(grid)\n  n = grid.length\n  total = n * n\n  count = Array.new(total + 1, 0)\n  grid.each { |row| row.each { |v| count[v] += 1 } }\n  rep = 0\n  miss = 0\n  (1..total).each do |v|\n    if count[v] == 2\n      rep = v\n    elsif count[v] == 0\n      miss = v\n    end\n  end\n  [rep, miss]\nend`,
      },
    };
  })(),

  // ── Left Rotate an Array by D Places (GFG) ──────────────────────
  (() => {
    const ref = (arr: number[], d: number) => {
      const n = arr.length;
      const shift = ((d % n) + n) % n;
      return arr.slice(shift).concat(arr.slice(0, shift));
    };
    return {
      slug: "left-rotate-array-by-d",
      title: "Left Rotate an Array by D Places",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "TCS", "Infosys", "Wipro", "Accenture"],
      signature: { funcName: "rotateLeft", params: [{ name: "arr", type: "int[]" as const }, { name: "d", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Rotate the array `arr` to the **left** by `d` positions and return the result. A left rotation by one moves `arr[0]` to the end.\n\n`d` may be larger than the array length.",
        [
          { in: "arr = [1,2,3,4,5,6,7], d = 2", out: "[3,4,5,6,7,1,2]", note: "The first two elements move to the back." },
          { in: "arr = [1,2,3], d = 4", out: "[2,3,1]", note: "Rotating by 4 is the same as rotating by 4 mod 3 = 1." },
          { in: "arr = [5,5,5], d = 0", out: "[5,5,5]" },
        ],
        ["1 <= arr.length <= 100000", "0 <= d <= 1000000000", "1 <= arr[i] <= 1000000"]),
      hints: [
        "Rotating by `n` returns the array unchanged, so only `d % n` matters.",
        "The answer is the suffix starting at `d % n` followed by the prefix before it.",
        "The classic O(1)-space trick is the reversal algorithm: reverse the first `d`, reverse the rest, then reverse the whole thing.",
      ],
      editorial: explain({
        idea: "A left rotation by `d` splits the array at index `d % n` and swaps the two blocks. Reducing `d` modulo `n` first is what makes a huge `d` free.",
        steps: [
          "Compute `shift = d % n`.",
          "The result is `arr[shift..n-1]` followed by `arr[0..shift-1]`.",
          "For the in-place version: reverse `arr[0..shift-1]`, reverse `arr[shift..n-1]`, then reverse the whole array.",
        ],
        why: "Rotating by `n` is the identity, so the group of rotations is cyclic of order `n` and only the residue matters. The three-reversal trick works because reversing a block twice — once alone and once inside the full reversal — restores its order while moving it to the other side.",
        time: "O(n)",
        space: "O(n) here; O(1) with the reversal algorithm",
        pitfalls: [
          "Rotating one step at a time `d` times is O(n·d) and times out for large `d`.",
          "Skipping the modulo indexes past the end as soon as `d >= n`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7]\n2", expectedOutput: "[3,4,5,6,7,1,2]" },
        { input: "[1,2,3]\n4", expectedOutput: "[2,3,1]" },
        { input: "[5,5,5]\n0", expectedOutput: "[5,5,5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const arr = Array.from({ length: n }, () => ri(rng, 1, 1000000));
        const d = rng() < 0.5 ? ri(rng, 0, n) : ri(rng, 0, 1000000000);
        return { input: `${fmtIntArr(arr)}\n${d}`, expectedOutput: fmtIntArr(ref(arr, d)) };
      },
      solutions: {
        python: `from typing import List\n\ndef rotateLeft(arr: List[int], d: int) -> List[int]:\n    n = len(arr)\n    shift = d % n\n    return arr[shift:] + arr[:shift]`,
        javascript: `var rotateLeft = function(arr, d) {\n    var n = arr.length;\n    var shift = d % n;\n    var out = [];\n    for (var i = 0; i < n; i++) out.push(arr[(i + shift) % n]);\n    return out;\n};`,
        typescript: `function rotateLeft(arr: number[], d: number): number[] {\n    var n = arr.length;\n    var shift = d % n;\n    var out: number[] = [];\n    for (var i = 0; i < n; i++) out.push(arr[(i + shift) % n]);\n    return out;\n}`,
        java: `public static int[] rotateLeft(int[] arr, int d) {\n    int n = arr.length;\n    int shift = d % n;\n    int[] out = new int[n];\n    for (int i = 0; i < n; i++) out[i] = arr[(i + shift) % n];\n    return out;\n}`,
        cpp: `vector<int> rotateLeft(vector<int>& arr, int d) {\n    int n = (int) arr.size();\n    int shift = d % n;\n    vector<int> out(n);\n    for (int i = 0; i < n; i++) out[i] = arr[(i + shift) % n];\n    return out;\n}`,
        c: `int* rotateLeft(int* arr, int arrSize, int d, int* returnSize) {\n    int shift = d % arrSize;\n    int* out = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) out[i] = arr[(i + shift) % arrSize];\n    *returnSize = arrSize;\n    return out;\n}`,
        csharp: `public static int[] RotateLeft(int[] arr, int d)\n{\n    int n = arr.Length;\n    int shift = d % n;\n    int[] out_ = new int[n];\n    for (int i = 0; i < n; i++) out_[i] = arr[(i + shift) % n];\n    return out_;\n}`,
        go: `func rotateLeft(arr []int, d int) []int {\n\tn := len(arr)\n\tshift := d % n\n\tout := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tout[i] = arr[(i+shift)%n]\n\t}\n\treturn out\n}`,
        kotlin: `fun rotateLeft(arr: IntArray, d: Int): IntArray {\n    val n = arr.size\n    val shift = d % n\n    val out = IntArray(n)\n    for (i in 0 until n) out[i] = arr[(i + shift) % n]\n    return out\n}`,
        swift: `func rotateLeft(_ arr: [Int], _ d: Int) -> [Int] {\n    let n = arr.count\n    let shift = d % n\n    var out = [Int](repeating: 0, count: n)\n    for i in 0..<n { out[i] = arr[(i + shift) % n] }\n    return out\n}`,
        rust: `fn rotateLeft(arr: Vec<i32>, d: i32) -> Vec<i32> {\n    let n = arr.len();\n    let shift = (d as usize) % n;\n    let mut out = vec![0i32; n];\n    for i in 0..n {\n        out[i] = arr[(i + shift) % n];\n    }\n    out\n}`,
        php: `function rotateLeft($arr, $d) {\n    $n = count($arr);\n    $shift = $d % $n;\n    $out = array();\n    for ($i = 0; $i < $n; $i++) $out[] = $arr[($i + $shift) % $n];\n    return $out;\n}`,
        ruby: `def rotateLeft(arr, d)\n  n = arr.length\n  shift = d % n\n  arr[shift..-1] + arr[0...shift]\nend`,
      },
    };
  })(),

  // ── Sort the People (LC 2418) ───────────────────────────────────
  (() => {
    const ref = (names: string[], heights: number[]) => {
      const order = names.map((_, i) => i).sort((a, b) => heights[b] - heights[a]);
      return order.map((i) => names[i]);
    };
    return {
      slug: "sort-the-people",
      title: "Sort the People",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Hash Table", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "sortPeople", params: [{ name: "names", type: "string[]" as const }, { name: "heights", type: "int[]" as const }], returns: "string[]" as const },
      description: describe(
        "A CodeKairo team photo is being arranged. You are given `names`, the members' names, and `heights`, where `heights[i]` is the height of `names[i]`. All heights are **distinct**.\n\nReturn `names` sorted by height in **descending** order.",
        [
          { in: 'names = ["Ayaan","Mira","Kai"], heights = [180,165,172]', out: '["Ayaan","Kai","Mira"]', note: "180 > 172 > 165." },
          { in: 'names = ["Riya","Dev"], heights = [150,190]', out: '["Dev","Riya"]' },
          { in: 'names = ["Sol"], heights = [161]', out: '["Sol"]' },
        ],
        ["1 <= names.length <= 1000", "names.length == heights.length", "1 <= heights[i] <= 100000", "All values in heights are distinct."]),
      hints: [
        "Sorting the names alone loses the link to their heights.",
        "Sort the **indices** by height instead, then read the names off in that order.",
        "Descending means the comparator subtracts the other way round.",
      ],
      editorial: explain({
        idea: "The two arrays are parallel, so sort a list of indices by the height they point at, then project the names through that order. Nothing needs to be paired up into objects.",
        steps: [
          "Build `order = [0, 1, …, n-1]`.",
          "Sort `order` with the comparator `heights[b] - heights[a]`, which puts the tallest first.",
          "Map `order` back through `names` to build the result.",
        ],
        why: "Sorting indices keeps the association between a name and its height intact for free, because the index *is* the association. Distinct heights mean the comparator is a strict total order, so the result is unique.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting `heights` and `names` separately destroys the pairing.",
          "`heights[a] - heights[b]` sorts ascending — the shortest person would lead.",
        ],
      }),
      examples: [
        { input: '["Ayaan","Mira","Kai"]\n[180,165,172]', expectedOutput: '["Ayaan","Kai","Mira"]' },
        { input: '["Riya","Dev"]\n[150,190]', expectedOutput: '["Dev","Riya"]' },
        { input: '["Sol"]\n[161]', expectedOutput: '["Sol"]' },
      ],
      gen: (rng: Rng) => {
        const pool = ["Ayaan", "Mira", "Kai", "Riya", "Dev", "Sol", "Nia", "Arjun", "Zara", "Ishan", "Tara", "Veer", "Anya", "Rohan", "Leela", "Omar", "Priya", "Sana", "Kabir", "Neel"];
        const n = ri(rng, 1, 15);
        const names = shuffle(rng, pool.slice()).slice(0, n);
        const used: Record<string, boolean> = {};
        const heights: number[] = [];
        while (heights.length < n) {
          const h = ri(rng, 1, 100000);
          if (used[String(h)] !== true) { used[String(h)] = true; heights.push(h); }
        }
        return { input: `${fmtStrArr(names)}\n${fmtIntArr(heights)}`, expectedOutput: fmtStrArr(ref(names, heights)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sortPeople(names: List[str], heights: List[int]) -> List[str]:\n    order = sorted(range(len(names)), key=lambda i: -heights[i])\n    return [names[i] for i in order]`,
        javascript: `var sortPeople = function(names, heights) {\n    var order = [];\n    for (var t = 0; t < names.length; t++) order.push(t);\n    order.sort(function(a, b) { return heights[b] - heights[a]; });\n    var out = [];\n    for (var i = 0; i < order.length; i++) out.push(names[order[i]]);\n    return out;\n};`,
        typescript: `function sortPeople(names: string[], heights: number[]): string[] {\n    var order: number[] = [];\n    for (var t = 0; t < names.length; t++) order.push(t);\n    order.sort(function(a, b) { return heights[b] - heights[a]; });\n    var out: string[] = [];\n    for (var i = 0; i < order.length; i++) out.push(names[order[i]]);\n    return out;\n}`,
        java: `public static String[] sortPeople(String[] names, int[] heights) {\n    int n = names.length;\n    Integer[] order = new Integer[n];\n    for (int i = 0; i < n; i++) order[i] = i;\n    Arrays.sort(order, (a, b) -> Integer.compare(heights[b], heights[a]));\n    String[] out = new String[n];\n    for (int i = 0; i < n; i++) out[i] = names[order[i]];\n    return out;\n}`,
        cpp: `vector<string> sortPeople(vector<string>& names, vector<int>& heights) {\n    int n = (int) names.size();\n    vector<int> order(n);\n    for (int i = 0; i < n; i++) order[i] = i;\n    sort(order.begin(), order.end(), [&](int a, int b) { return heights[a] > heights[b]; });\n    vector<string> out;\n    for (int i = 0; i < n; i++) out.push_back(names[order[i]]);\n    return out;\n}`,
        c: `static int* gHeights;\n\nstatic int cmpPeopleDesc(const void* a, const void* b) {\n    int x = gHeights[*(const int*) a];\n    int y = gHeights[*(const int*) b];\n    return (x < y) - (x > y);\n}\n\nchar** sortPeople(char** names, int namesSize, int* heights, int heightsSize, int* returnSize) {\n    int* order = (int*) malloc((size_t) namesSize * sizeof(int));\n    for (int i = 0; i < namesSize; i++) order[i] = i;\n    gHeights = heights;\n    qsort(order, (size_t) namesSize, sizeof(int), cmpPeopleDesc);\n    char** out = (char**) malloc((size_t) namesSize * sizeof(char*));\n    for (int i = 0; i < namesSize; i++) {\n        const char* src = names[order[i]];\n        char* copy = (char*) malloc(strlen(src) + 1);\n        strcpy(copy, src);\n        out[i] = copy;\n    }\n    free(order);\n    *returnSize = namesSize;\n    return out;\n}`,
        csharp: `public static string[] SortPeople(string[] names, int[] heights)\n{\n    int n = names.Length;\n    int[] order = Enumerable.Range(0, n).ToArray();\n    Array.Sort(order, (a, b) => heights[b].CompareTo(heights[a]));\n    string[] out_ = new string[n];\n    for (int i = 0; i < n; i++) out_[i] = names[order[i]];\n    return out_;\n}`,
        go: `func sortPeople(names []string, heights []int) []string {\n\tn := len(names)\n\torder := make([]int, n)\n\tfor i := range order {\n\t\torder[i] = i\n\t}\n\tsort.Slice(order, func(a, b int) bool { return heights[order[a]] > heights[order[b]] })\n\tout := make([]string, n)\n\tfor i := 0; i < n; i++ {\n\t\tout[i] = names[order[i]]\n\t}\n\treturn out\n}`,
        kotlin: `fun sortPeople(names: Array<String>, heights: IntArray): Array<String> {\n    val order = names.indices.sortedByDescending { heights[it] }\n    return Array(names.size) { names[order[it]] }\n}`,
        swift: `func sortPeople(_ names: [String], _ heights: [Int]) -> [String] {\n    let order = (0..<names.count).sorted { heights[$0] > heights[$1] }\n    return order.map { names[$0] }\n}`,
        rust: `fn sortPeople(names: Vec<String>, heights: Vec<i32>) -> Vec<String> {\n    let mut order: Vec<usize> = (0..names.len()).collect();\n    order.sort_by(|a, b| heights[*b].cmp(&heights[*a]));\n    order.into_iter().map(|i| names[i].clone()).collect()\n}`,
        php: `function sortPeople($names, $heights) {\n    $order = range(0, count($names) - 1);\n    usort($order, function($a, $b) use ($heights) { return $heights[$b] - $heights[$a]; });\n    $out = array();\n    foreach ($order as $i) $out[] = $names[$i];\n    return $out;\n}`,
        ruby: `def sortPeople(names, heights)\n  (0...names.length).sort_by { |i| -heights[i] }.map { |i| names[i] }\nend`,
      },
    };
  })(),

  // ── Maximum Difference Between Adjacent Elements in a Circular Array (LC 3423) ──
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let best = 0;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(nums[i] - nums[(i + 1) % n]);
        if (d > best) best = d;
      }
      return best;
    };
    return {
      slug: "maximum-difference-between-adjacent-elements-in-a-circular-array",
      title: "Maximum Difference Between Adjacent Elements in a Circular Array",
      difficulty: "EASY" as const,
      tags: ["Array", "TCS", "Capgemini", "Accenture"],
      signature: { funcName: "maxAdjacentDistance", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The array `nums` is **circular**: the element after the last one is the first one again.\n\nReturn the maximum absolute difference between any two adjacent elements.",
        [
          { in: "nums = [1,2,4]", out: "3", note: "The wrap-around pair (4, 1) differs by 3, more than any straight neighbour." },
          { in: "nums = [-5,-10,-5]", out: "5", note: "|-5 - (-10)| = 5." },
          { in: "nums = [7]", out: "0", note: "A single element is its own neighbour." },
        ],
        ["1 <= nums.length <= 100", "-100 <= nums[i] <= 100"]),
      hints: [
        "Every index `i` pairs with `i + 1`, and the last index pairs with `0`.",
        "Modulo arithmetic — `(i + 1) % n` — handles the wrap without a special case.",
        "A single-element array pairs with itself, so the answer is 0.",
      ],
      editorial: explain({
        idea: "The circular neighbour of index `i` is `(i + 1) % n`, so one loop over every index covers all `n` adjacent pairs, wrap included.",
        steps: [
          "Start `best` at `0`.",
          "For each `i`, compute `|nums[i] - nums[(i + 1) % n]|`.",
          "Keep the largest value seen.",
        ],
        why: "In a circle of `n` elements there are exactly `n` adjacent pairs, one per starting index, and `(i + 1) % n` enumerates each exactly once.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Looping only to `n - 2` misses the wrap-around pair, which is often the answer.",
          "Forgetting the absolute value reports a negative difference as small.",
        ],
      }),
      examples: [
        { input: "[1,2,4]", expectedOutput: "3" },
        { input: "[-5,-10,-5]", expectedOutput: "5" },
        { input: "[7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 60) }, () => ri(rng, -100, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxAdjacentDistance(nums: List[int]) -> int:\n    n = len(nums)\n    return max(abs(nums[i] - nums[(i + 1) % n]) for i in range(n))`,
        javascript: `var maxAdjacentDistance = function(nums) {\n    var n = nums.length, best = 0;\n    for (var i = 0; i < n; i++) {\n        var d = Math.abs(nums[i] - nums[(i + 1) % n]);\n        if (d > best) best = d;\n    }\n    return best;\n};`,
        typescript: `function maxAdjacentDistance(nums: number[]): number {\n    var n = nums.length, best = 0;\n    for (var i = 0; i < n; i++) {\n        var d = Math.abs(nums[i] - nums[(i + 1) % n]);\n        if (d > best) best = d;\n    }\n    return best;\n}`,
        java: `public static int maxAdjacentDistance(int[] nums) {\n    int n = nums.length, best = 0;\n    for (int i = 0; i < n; i++) {\n        int d = Math.abs(nums[i] - nums[(i + 1) % n]);\n        if (d > best) best = d;\n    }\n    return best;\n}`,
        cpp: `int maxAdjacentDistance(vector<int>& nums) {\n    int n = (int) nums.size(), best = 0;\n    for (int i = 0; i < n; i++) {\n        int d = abs(nums[i] - nums[(i + 1) % n]);\n        if (d > best) best = d;\n    }\n    return best;\n}`,
        c: `int maxAdjacentDistance(int* nums, int numsSize) {\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int d = nums[i] - nums[(i + 1) % numsSize];\n        if (d < 0) d = -d;\n        if (d > best) best = d;\n    }\n    return best;\n}`,
        csharp: `public static int MaxAdjacentDistance(int[] nums)\n{\n    int n = nums.Length, best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int d = Math.Abs(nums[i] - nums[(i + 1) % n]);\n        if (d > best) best = d;\n    }\n    return best;\n}`,
        go: `func maxAdjacentDistance(nums []int) int {\n\tn := len(nums)\n\tbest := 0\n\tfor i := 0; i < n; i++ {\n\t\td := nums[i] - nums[(i+1)%n]\n\t\tif d < 0 {\n\t\t\td = -d\n\t\t}\n\t\tif d > best {\n\t\t\tbest = d\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxAdjacentDistance(nums: IntArray): Int {\n    val n = nums.size\n    var best = 0\n    for (i in 0 until n) {\n        val d = Math.abs(nums[i] - nums[(i + 1) % n])\n        if (d > best) best = d\n    }\n    return best\n}`,
        swift: `func maxAdjacentDistance(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var best = 0\n    for i in 0..<n {\n        let d = abs(nums[i] - nums[(i + 1) % n])\n        if d > best { best = d }\n    }\n    return best\n}`,
        rust: `fn maxAdjacentDistance(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut best = 0;\n    for i in 0..n {\n        let d = (nums[i] - nums[(i + 1) % n]).abs();\n        if d > best {\n            best = d;\n        }\n    }\n    best\n}`,
        php: `function maxAdjacentDistance($nums) {\n    $n = count($nums);\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $d = abs($nums[$i] - $nums[($i + 1) % $n]);\n        if ($d > $best) $best = $d;\n    }\n    return $best;\n}`,
        ruby: `def maxAdjacentDistance(nums)\n  n = nums.length\n  (0...n).map { |i| (nums[i] - nums[(i + 1) % n]).abs }.max\nend`,
      },
    };
  })(),

  // ── Count Pairs With Given Sum (GFG) ────────────────────────────
  (() => {
    const ref = (arr: number[], target: number) => {
      const seen: Record<string, number> = {};
      let total = 0;
      for (const x of arr) {
        const need = String(target - x);
        if (seen[need] !== undefined) total += seen[need];
        const key = String(x);
        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;
      }
      return total;
    };
    return {
      slug: "count-pairs-with-given-sum",
      title: "Count Pairs With Given Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "TCS", "Wipro", "Amazon", "Zoho"],
      signature: { funcName: "countPairsWithSum", params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` and an integer `target`, count the pairs of **indices** `(i, j)` with `i < j` and `arr[i] + arr[j] == target`.\n\nPairs are counted by position, so repeated values contribute several pairs.",
        [
          { in: "arr = [1,5,7,-1,5], target = 6", out: "3", note: "(1,5), (7,-1) and (1,5) again with the second 5." },
          { in: "arr = [1,1,1,1], target = 2", out: "6", note: "Every one of the six index pairs sums to 2." },
          { in: "arr = [10,12,10,15,-1], target = 125", out: "0" },
        ],
        ["1 <= arr.length <= 100000", "-100000 <= arr[i] <= 100000", "-200000 <= target <= 200000"]),
      hints: [
        "The nested double loop is O(n²). A single pass with a frequency map does better.",
        "When you reach `arr[i]`, how many earlier elements equal `target - arr[i]`?",
        "Count the match **before** inserting the current element, or an element pairs with itself.",
      ],
      editorial: explain({
        idea: "For each element, the partner it needs is fixed: `target - x`. Keeping a running tally of everything seen so far turns the search for partners into a single lookup.",
        steps: [
          "Keep a map from value to how many times it has appeared so far.",
          "For each `x`, add `seen[target - x]` (zero if absent) to the answer.",
          "Then increment `seen[x]` and continue.",
        ],
        why: "Counting before inserting means every pair is attributed exactly once — at its later index — so no pair is double counted and no element pairs with itself. Repeated values are handled naturally because the map stores counts, not just presence.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Inserting `x` before the lookup makes `x` its own partner whenever `2x == target`.",
          "Using a set instead of a count map reports `[1,1,1,1]` as one pair rather than six.",
        ],
      }),
      examples: [
        { input: "[1,5,7,-1,5]\n6", expectedOutput: "3" },
        { input: "[1,1,1,1]\n2", expectedOutput: "6" },
        { input: "[10,12,10,15,-1]\n125", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 70);
        const hi = rng() < 0.5 ? 6 : 100000;
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const target = rng() < 0.5 ? arr[ri(rng, 0, n - 1)] + arr[ri(rng, 0, n - 1)] : ri(rng, -2 * hi, 2 * hi);
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: String(ref(arr, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPairsWithSum(arr: List[int], target: int) -> int:\n    seen = {}\n    total = 0\n    for x in arr:\n        total += seen.get(target - x, 0)\n        seen[x] = seen.get(x, 0) + 1\n    return total`,
        javascript: `var countPairsWithSum = function(arr, target) {\n    var seen = {}, total = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var need = String(target - arr[i]);\n        if (seen[need] !== undefined) total += seen[need];\n        var key = String(arr[i]);\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n};`,
        typescript: `function countPairsWithSum(arr: number[], target: number): number {\n    var seen: { [key: string]: number } = {}, total = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var need = String(target - arr[i]);\n        if (seen[need] !== undefined) total += seen[need];\n        var key = String(arr[i]);\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n}`,
        java: `public static int countPairsWithSum(int[] arr, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    int total = 0;\n    for (int x : arr) {\n        Integer c = seen.get(target - x);\n        if (c != null) total += c;\n        seen.put(x, seen.getOrDefault(x, 0) + 1);\n    }\n    return total;\n}`,
        cpp: `int countPairsWithSum(vector<int>& arr, int target) {\n    unordered_map<int, int> seen;\n    int total = 0;\n    for (int x : arr) {\n        auto it = seen.find(target - x);\n        if (it != seen.end()) total += it->second;\n        seen[x]++;\n    }\n    return total;\n}`,
        c: `int countPairsWithSum(int* arr, int arrSize, int target) {\n    int cap = 1;\n    while (cap < 2 * arrSize + 4) cap <<= 1;\n    int mask = cap - 1;\n    int* keys = (int*) calloc((size_t) cap, sizeof(int));\n    int* used = (int*) calloc((size_t) cap, sizeof(int));\n    int* cnt = (int*) calloc((size_t) cap, sizeof(int));\n    int total = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int need = target - arr[i];\n        unsigned int h = (unsigned int) need * 2654435761u;\n        int s = (int) (h & (unsigned int) mask);\n        while (used[s] && keys[s] != need) s = (s + 1) & mask;\n        if (used[s]) total += cnt[s];\n        int x = arr[i];\n        unsigned int h2 = (unsigned int) x * 2654435761u;\n        int t = (int) (h2 & (unsigned int) mask);\n        while (used[t] && keys[t] != x) t = (t + 1) & mask;\n        used[t] = 1;\n        keys[t] = x;\n        cnt[t]++;\n    }\n    free(keys);\n    free(used);\n    free(cnt);\n    return total;\n}`,
        csharp: `public static int CountPairsWithSum(int[] arr, int target)\n{\n    var seen = new Dictionary<int, int>();\n    int total = 0;\n    foreach (int x in arr)\n    {\n        int c;\n        if (seen.TryGetValue(target - x, out c)) total += c;\n        int cur;\n        seen[x] = seen.TryGetValue(x, out cur) ? cur + 1 : 1;\n    }\n    return total;\n}`,
        go: `func countPairsWithSum(arr []int, target int) int {\n\tseen := map[int]int{}\n\ttotal := 0\n\tfor _, x := range arr {\n\t\ttotal += seen[target-x]\n\t\tseen[x]++\n\t}\n\treturn total\n}`,
        kotlin: `fun countPairsWithSum(arr: IntArray, target: Int): Int {\n    val seen = HashMap<Int, Int>()\n    var total = 0\n    for (x in arr) {\n        total += seen[target - x] ?: 0\n        seen[x] = (seen[x] ?: 0) + 1\n    }\n    return total\n}`,
        swift: `func countPairsWithSum(_ arr: [Int], _ target: Int) -> Int {\n    var seen: [Int: Int] = [:]\n    var total = 0\n    for x in arr {\n        total += seen[target - x] ?? 0\n        seen[x] = (seen[x] ?? 0) + 1\n    }\n    return total\n}`,
        rust: `fn countPairsWithSum(arr: Vec<i32>, target: i32) -> i32 {\n    let mut seen: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut total = 0i32;\n    for &x in arr.iter() {\n        if let Some(&c) = seen.get(&(target - x)) {\n            total += c;\n        }\n        *seen.entry(x).or_insert(0) += 1;\n    }\n    total\n}`,
        php: `function countPairsWithSum($arr, $target) {\n    $seen = array();\n    $total = 0;\n    foreach ($arr as $x) {\n        $need = $target - $x;\n        if (isset($seen[$need])) $total += $seen[$need];\n        $seen[$x] = isset($seen[$x]) ? $seen[$x] + 1 : 1;\n    }\n    return $total;\n}`,
        ruby: `def countPairsWithSum(arr, target)\n  seen = Hash.new(0)\n  total = 0\n  arr.each do |x|\n    total += seen[target - x]\n    seen[x] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Number Game (LC 2974) ───────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = nums.slice().sort((a, b) => a - b);
      const out: number[] = [];
      for (let i = 0; i + 1 < s.length; i += 2) { out.push(s[i + 1]); out.push(s[i]); }
      return out;
    };
    return {
      slug: "minimum-number-game",
      title: "Minimum Number Game",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Simulation", "TCS", "Mindtree"],
      signature: { funcName: "numberGame", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Alice and Bob play with an array `nums` of **even** length and build a new array `arr`.\n\nEach round: Alice removes the smallest remaining element, then Bob removes the smallest remaining element. **Bob** appends his element to `arr` first, then Alice appends hers.\n\nReturn `arr` once `nums` is empty.",
        [
          { in: "nums = [5,4,2,3]", out: "[3,2,5,4]", note: "Round 1: Alice takes 2, Bob takes 3; Bob appends first, giving [3,2]. Round 2: Alice takes 4, Bob takes 5, giving [3,2,5,4]." },
          { in: "nums = [2,5]", out: "[5,2]" },
          { in: "nums = [1,1,2,2]", out: "[1,1,2,2]" },
        ],
        ["2 <= nums.length <= 100", "nums.length is even", "1 <= nums[i] <= 100"]),
      hints: [
        "Both players always take the smallest remaining element, so the removal order is simply sorted order.",
        "Round `t` consumes the sorted elements at positions `2t` and `2t + 1`.",
        "Bob appends first, so each pair is written to the output in swapped order.",
      ],
      editorial: explain({
        idea: "Neither player has a choice — both always take the minimum — so the whole game is 'sort the array, then swap each adjacent pair'.",
        steps: [
          "Sort `nums` ascending into `s`.",
          "Walk `i` in steps of two and append `s[i+1]` then `s[i]`.",
          "Return the collected array.",
        ],
        why: "In round `t` the two smallest remaining values are `s[2t]` (Alice's) and `s[2t+1]` (Bob's). Bob appends before Alice, so the pair lands as `s[2t+1], s[2t]`.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Appending Alice's element first reverses every pair.",
          "Actually simulating removals from the array is O(n²) for no benefit.",
        ],
      }),
      examples: [
        { input: "[5,4,2,3]", expectedOutput: "[3,2,5,4]" },
        { input: "[2,5]", expectedOutput: "[5,2]" },
        { input: "[1,1,2,2]", expectedOutput: "[1,1,2,2]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: 2 * ri(rng, 1, 25) }, () => ri(rng, 1, 100));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberGame(nums: List[int]) -> List[int]:\n    s = sorted(nums)\n    out = []\n    for i in range(0, len(s), 2):\n        out.append(s[i + 1])\n        out.append(s[i])\n    return out`,
        javascript: `var numberGame = function(nums) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var out = [];\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        out.push(s[i + 1]);\n        out.push(s[i]);\n    }\n    return out;\n};`,
        typescript: `function numberGame(nums: number[]): number[] {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var out: number[] = [];\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        out.push(s[i + 1]);\n        out.push(s[i]);\n    }\n    return out;\n}`,
        java: `public static int[] numberGame(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int[] out = new int[s.length];\n    for (int i = 0; i + 1 < s.length; i += 2) {\n        out[i] = s[i + 1];\n        out[i + 1] = s[i];\n    }\n    return out;\n}`,
        cpp: `vector<int> numberGame(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    vector<int> out;\n    for (size_t i = 0; i + 1 < s.size(); i += 2) {\n        out.push_back(s[i + 1]);\n        out.push_back(s[i]);\n    }\n    return out;\n}`,
        c: `static int cmpGameAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* numberGame(int* nums, int numsSize, int* returnSize) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpGameAsc);\n    int* out = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i + 1 < numsSize; i += 2) {\n        out[i] = s[i + 1];\n        out[i + 1] = s[i];\n    }\n    free(s);\n    *returnSize = numsSize;\n    return out;\n}`,
        csharp: `public static int[] NumberGame(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int[] out_ = new int[s.Length];\n    for (int i = 0; i + 1 < s.Length; i += 2)\n    {\n        out_[i] = s[i + 1];\n        out_[i + 1] = s[i];\n    }\n    return out_;\n}`,
        go: `func numberGame(nums []int) []int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tout := []int{}\n\tfor i := 0; i+1 < len(s); i += 2 {\n\t\tout = append(out, s[i+1], s[i])\n\t}\n\treturn out\n}`,
        kotlin: `fun numberGame(nums: IntArray): IntArray {\n    val s = nums.sortedArray()\n    val out = IntArray(s.size)\n    var i = 0\n    while (i + 1 < s.size) {\n        out[i] = s[i + 1]\n        out[i + 1] = s[i]\n        i += 2\n    }\n    return out\n}`,
        swift: `func numberGame(_ nums: [Int]) -> [Int] {\n    let s = nums.sorted()\n    var out: [Int] = []\n    var i = 0\n    while i + 1 < s.count {\n        out.append(s[i + 1])\n        out.append(s[i])\n        i += 2\n    }\n    return out\n}`,
        rust: `fn numberGame(nums: Vec<i32>) -> Vec<i32> {\n    let mut s = nums.clone();\n    s.sort();\n    let mut out: Vec<i32> = Vec::new();\n    let mut i = 0usize;\n    while i + 1 < s.len() {\n        out.push(s[i + 1]);\n        out.push(s[i]);\n        i += 2;\n    }\n    out\n}`,
        php: `function numberGame($nums) {\n    $s = $nums;\n    sort($s);\n    $out = array();\n    for ($i = 0; $i + 1 < count($s); $i += 2) {\n        $out[] = $s[$i + 1];\n        $out[] = $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def numberGame(nums)\n  s = nums.sort\n  out = []\n  i = 0\n  while i + 1 < s.length\n    out << s[i + 1]\n    out << s[i]\n    i += 2\n  end\n  out\nend`,
      },
    };
  })(),
];
