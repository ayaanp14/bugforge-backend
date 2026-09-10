/**
 * Greedy, sorting, heaps and intervals, second wave — the "sort it the right
 * way and the answer falls out" questions that Amazon and Google lean on, plus
 * the platform/scheduling classics from Indian service-company rounds.
 * Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

export const GREEDY2_PROBLEMS: CatalogProblem[] = [

  // ── Assign Cookies ──────────────────────────────────────────────
  (() => {
    const ref = (g: number[], s: number[]) => {
      const greed = g.slice().sort((a, b) => a - b);
      const sizes = s.slice().sort((a, b) => a - b);
      let i = 0, j = 0;
      while (i < greed.length && j < sizes.length) {
        if (sizes[j] >= greed[i]) i++;
        j++;
      }
      return i;
    };
    return {
      slug: "assign-cookies",
      title: "Assign Cookies",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findContentChildren", params: [{ name: "g", type: "int[]" as const }, { name: "s", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You want to give cookies to children. Child `i` is content only with a cookie of size at least `g[i]`, their **greed factor**. Cookie `j` has size `s[j]`, and each child may receive at most one cookie.\n\nReturn the maximum number of children you can content.",
        [
          { in: "g = [1,2,3], s = [1,1]", out: "1", note: "Only the least greedy child can be satisfied." },
          { in: "g = [1,2], s = [1,2,3]", out: "2" },
          { in: "g = [5], s = [1,2,3]", out: "0" },
        ],
        ["1 <= g.length, s.length <= 40", "1 <= g[i], s[j] <= 1000"]),
      hints: [
        "Sort both lists and walk them together with two pointers.",
        "Always give the smallest cookie that will actually content the least greedy remaining child.",
        "Wasting a large cookie on a small child can never help — the exchange argument makes greedy optimal.",
      ],
      examples: [
        { input: "[1,2,3]\n[1,1]", expectedOutput: "1" },
        { input: "[1,2]\n[1,2,3]", expectedOutput: "2" },
        { input: "[5]\n[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const g = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.6 ? 12 : 1000);
        const s = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.6 ? 12 : 1000);
        return { input: `${fmtIntArr(g)}\n${fmtIntArr(s)}`, expectedOutput: String(ref(g, s)) };
      },
      solutions: {
        python: `def findContentChildren(g, s) -> int:\n    greed = sorted(g)\n    sizes = sorted(s)\n    i = j = 0\n    while i < len(greed) and j < len(sizes):\n        if sizes[j] >= greed[i]:\n            i += 1\n        j += 1\n    return i`,
        javascript: `var findContentChildren = function(g, s) {\n    const greed = g.slice().sort(function(a, b) { return a - b; });\n    const sizes = s.slice().sort(function(a, b) { return a - b; });\n    let i = 0, j = 0;\n    while (i < greed.length && j < sizes.length) {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    return i;\n};`,
              typescript: `function findContentChildren(g: number[], s: number[]): number {\n    var greed = g.slice().sort(function (a, b) { return a - b; });\n    var sizes = s.slice().sort(function (a, b) { return a - b; });\n    var i = 0, j = 0;\n    while (i < greed.length && j < sizes.length) {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    return i;\n}`,
              java: `public static int findContentChildren(int[] g, int[] s) {\n    int[] greed = g.clone();\n    int[] sizes = s.clone();\n    Arrays.sort(greed);\n    Arrays.sort(sizes);\n    int i = 0, j = 0;\n    while (i < greed.length && j < sizes.length) {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    return i;\n}`,
              cpp: `int findContentChildren(vector<int>& g, vector<int>& s) {\n    vector<int> greed = g;\n    vector<int> sizes = s;\n    sort(greed.begin(), greed.end());\n    sort(sizes.begin(), sizes.end());\n    int i = 0, j = 0;\n    while (i < (int) greed.size() && j < (int) sizes.size()) {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    return i;\n}`,
              c: `static int cmpAscCookie(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findContentChildren(int* g, int gSize, int* s, int sSize) {\n    int* greed = (int*) malloc((gSize > 0 ? gSize : 1) * sizeof(int));\n    int* sizes = (int*) malloc((sSize > 0 ? sSize : 1) * sizeof(int));\n    for (int i = 0; i < gSize; i++) greed[i] = g[i];\n    for (int i = 0; i < sSize; i++) sizes[i] = s[i];\n    qsort(greed, gSize, sizeof(int), cmpAscCookie);\n    qsort(sizes, sSize, sizeof(int), cmpAscCookie);\n    int i = 0, j = 0;\n    while (i < gSize && j < sSize) {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    free(greed);\n    free(sizes);\n    return i;\n}`,
              csharp: `public static int FindContentChildren(int[] g, int[] s)\n{\n    int[] greed = (int[]) g.Clone();\n    int[] sizes = (int[]) s.Clone();\n    Array.Sort(greed);\n    Array.Sort(sizes);\n    int i = 0, j = 0;\n    while (i < greed.Length && j < sizes.Length)\n    {\n        if (sizes[j] >= greed[i]) i++;\n        j++;\n    }\n    return i;\n}`,
              go: `func findContentChildren(g []int, s []int) int {\n	greed := append([]int{}, g...)\n	sizes := append([]int{}, s...)\n	sort.Ints(greed)\n	sort.Ints(sizes)\n	i, j := 0, 0\n	for i < len(greed) && j < len(sizes) {\n		if sizes[j] >= greed[i] {\n			i++\n		}\n		j++\n	}\n	return i\n}`,
              kotlin: `fun findContentChildren(g: IntArray, s: IntArray): Int {\n    val greed = g.sortedArray()\n    val sizes = s.sortedArray()\n    var i = 0\n    var j = 0\n    while (i < greed.size && j < sizes.size) {\n        if (sizes[j] >= greed[i]) i++\n        j++\n    }\n    return i\n}`,
              swift: `func findContentChildren(_ g: [Int], _ s: [Int]) -> Int {\n    let greed = g.sorted()\n    let sizes = s.sorted()\n    var i = 0\n    var j = 0\n    while i < greed.count && j < sizes.count {\n        if sizes[j] >= greed[i] { i += 1 }\n        j += 1\n    }\n    return i\n}`,
              rust: `fn findContentChildren(g: Vec<i32>, s: Vec<i32>) -> i32 {\n    let mut greed = g.clone();\n    let mut sizes = s.clone();\n    greed.sort();\n    sizes.sort();\n    let mut i = 0usize;\n    let mut j = 0usize;\n    while i < greed.len() && j < sizes.len() {\n        if sizes[j] >= greed[i] {\n            i += 1;\n        }\n        j += 1;\n    }\n    i as i32\n}`,
              php: `function findContentChildren($g, $s) {\n    $greed = $g;\n    $sizes = $s;\n    sort($greed);\n    sort($sizes);\n    $i = 0;\n    $j = 0;\n    while ($i < count($greed) && $j < count($sizes)) {\n        if ($sizes[$j] >= $greed[$i]) $i++;\n        $j++;\n    }\n    return $i;\n}`,
              ruby: `def findContentChildren(g, s)\n  greed = g.sort\n  sizes = s.sort\n  i = 0\n  j = 0\n  while i < greed.length && j < sizes.length\n    i += 1 if sizes[j] >= greed[i]\n    j += 1\n  end\n  i\nend`,
      },
    };
  })(),

  // ── Two City Scheduling ─────────────────────────────────────────
  (() => {
    const ref = (costs: number[][]) => {
      const sorted = costs.slice().sort((a, b) => (a[0] - a[1]) - (b[0] - b[1]));
      let total = 0;
      const half = sorted.length / 2;
      for (let i = 0; i < sorted.length; i++) total += i < half ? sorted[i][0] : sorted[i][1];
      return total;
    };
    return {
      slug: "two-city-scheduling",
      title: "Two City Scheduling",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Bloomberg", "Adobe"],
      signature: { funcName: "twoCitySchedCost", params: [{ name: "costs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A company is interviewing `2n` people. Flying person `i` to city **A** costs `costs[i][0]`, and flying them to city **B** costs `costs[i][1]`.\n\nReturn the minimum total cost of flying **exactly `n`** people to each city.",
        [
          { in: "costs = [[10,20],[30,200],[400,50],[30,20]]", out: "110", note: "Send the first two to A and the last two to B." },
          { in: "costs = [[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]]", out: "1859" },
          { in: "costs = [[10,20],[20,10]]", out: "20" },
        ],
        ["2 <= costs.length <= 40", "costs.length is even.", "1 <= costs[i][0], costs[i][1] <= 1000"]),
      hints: [
        "Imagine flying everyone to B first, then upgrading exactly `n` of them to A.",
        "The cost of upgrading person `i` is `costs[i][0] - costs[i][1]`, so upgrade the `n` cheapest.",
        "Sorting by that difference and splitting the list in half does exactly that.",
      ],
      examples: [
        { input: "[[10,20],[30,200],[400,50],[30,20]]", expectedOutput: "110" },
        { input: "[[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]]", expectedOutput: "1859" },
        { input: "[[10,20],[20,10]]", expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 20);
        const costs = Array.from({ length: n }, () => [ri(rng, 1, 1000), ri(rng, 1, 1000)]);
        return { input: fmtIntMat(costs), expectedOutput: String(ref(costs)) };
      },
      solutions: {
        python: `def twoCitySchedCost(costs) -> int:\n    ordered = sorted(costs, key=lambda c: c[0] - c[1])\n    half = len(ordered) // 2\n    return sum(c[0] for c in ordered[:half]) + sum(c[1] for c in ordered[half:])`,
        javascript: `var twoCitySchedCost = function(costs) {\n    const sorted = costs.slice().sort(function(a, b) { return (a[0] - a[1]) - (b[0] - b[1]); });\n    const half = sorted.length / 2;\n    let total = 0;\n    for (let i = 0; i < sorted.length; i++) {\n        total += i < half ? sorted[i][0] : sorted[i][1];\n    }\n    return total;\n};`,
              typescript: `function twoCitySchedCost(costs: number[][]): number {\n    var sorted = costs.slice().sort(function (a, b) { return (a[0] - a[1]) - (b[0] - b[1]); });\n    var half = sorted.length / 2;\n    var total = 0;\n    for (var i = 0; i < sorted.length; i++) {\n        total += i < half ? sorted[i][0] : sorted[i][1];\n    }\n    return total;\n}`,
              java: `public static int twoCitySchedCost(int[][] costs) {\n    int[][] s = costs.clone();\n    Arrays.sort(s, (a, b) -> (a[0] - a[1]) - (b[0] - b[1]));\n    int half = s.length / 2;\n    int total = 0;\n    for (int i = 0; i < s.length; i++) total += i < half ? s[i][0] : s[i][1];\n    return total;\n}`,
              cpp: `int twoCitySchedCost(vector<vector<int>>& costs) {\n    vector<vector<int>> s = costs;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) {\n        return (a[0] - a[1]) < (b[0] - b[1]);\n    });\n    int half = (int) s.size() / 2;\n    int total = 0;\n    for (int i = 0; i < (int) s.size(); i++) total += i < half ? s[i][0] : s[i][1];\n    return total;\n}`,
              c: `static int cmpTwoCity(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    int dx = x[0] - x[1];\n    int dy = y[0] - y[1];\n    return (dx > dy) - (dx < dy);\n}\n\nint twoCitySchedCost(int** costs, int costsSize, int* costsColSize) {\n    int** s = (int**) malloc((costsSize > 0 ? costsSize : 1) * sizeof(int*));\n    for (int i = 0; i < costsSize; i++) s[i] = costs[i];\n    qsort(s, costsSize, sizeof(int*), cmpTwoCity);\n    int half = costsSize / 2;\n    int total = 0;\n    for (int i = 0; i < costsSize; i++) total += i < half ? s[i][0] : s[i][1];\n    free(s);\n    return total;\n}`,
              csharp: `public static int TwoCitySchedCost(int[][] costs)\n{\n    var s = new List<int[]>(costs);\n    s.Sort((a, b) => (a[0] - a[1]).CompareTo(b[0] - b[1]));\n    int half = s.Count / 2;\n    int total = 0;\n    for (int i = 0; i < s.Count; i++) total += i < half ? s[i][0] : s[i][1];\n    return total;\n}`,
              go: `func twoCitySchedCost(costs [][]int) int {\n	s := append([][]int{}, costs...)\n	sort.Slice(s, func(a, b int) bool { return s[a][0]-s[a][1] < s[b][0]-s[b][1] })\n	half := len(s) / 2\n	total := 0\n	for i := 0; i < len(s); i++ {\n		if i < half {\n			total += s[i][0]\n		} else {\n			total += s[i][1]\n		}\n	}\n	return total\n}`,
              kotlin: `fun twoCitySchedCost(costs: Array<IntArray>): Int {\n    val s = costs.sortedBy { it[0] - it[1] }\n    val half = s.size / 2\n    var total = 0\n    for (i in s.indices) total += if (i < half) s[i][0] else s[i][1]\n    return total\n}`,
              swift: `func twoCitySchedCost(_ costs: [[Int]]) -> Int {\n    let s = costs.sorted { ($0[0] - $0[1]) < ($1[0] - $1[1]) }\n    let half = s.count / 2\n    var total = 0\n    for i in 0..<s.count {\n        total += i < half ? s[i][0] : s[i][1]\n    }\n    return total\n}`,
              rust: `fn twoCitySchedCost(costs: Vec<Vec<i32>>) -> i32 {\n    let mut s = costs.clone();\n    s.sort_by(|a, b| (a[0] - a[1]).cmp(&(b[0] - b[1])));\n    let half = s.len() / 2;\n    let mut total = 0;\n    for i in 0..s.len() {\n        total += if i < half { s[i][0] } else { s[i][1] };\n    }\n    total\n}`,
              php: `function twoCitySchedCost($costs) {\n    $s = $costs;\n    usort($s, function($a, $b) { return ($a[0] - $a[1]) - ($b[0] - $b[1]); });\n    $half = intdiv(count($s), 2);\n    $total = 0;\n    for ($i = 0; $i < count($s); $i++) {\n        $total += $i < $half ? $s[$i][0] : $s[$i][1];\n    }\n    return $total;\n}`,
              ruby: `def twoCitySchedCost(costs)\n  s = costs.sort_by { |c| c[0] - c[1] }\n  half = s.length / 2\n  total = 0\n  s.each_with_index do |c, i|\n    total += i < half ? c[0] : c[1]\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Queue Reconstruction by Height ──────────────────────────────
  (() => {
    const ref = (people: number[][]) => {
      const sorted = people.slice().sort((a, b) => (b[0] !== a[0] ? b[0] - a[0] : a[1] - b[1]));
      const out: number[][] = [];
      for (let i = 0; i < sorted.length; i++) out.splice(sorted[i][1], 0, sorted[i]);
      return out;
    };
    return {
      slug: "queue-reconstruction-by-height",
      title: "Queue Reconstruction by Height",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Binary Indexed Tree", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "reconstructQueue", params: [{ name: "people", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an array `people` where `people[i] = [h, k]` means the i-th person has height `h` and that exactly `k` people **of height at least `h`** stand in front of them.\n\nReconstruct and return the queue as an array in the same `[h, k]` format, ordered front to back.",
        [
          { in: "people = [[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]", out: "[[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]" },
          { in: "people = [[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]", out: "[[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]" },
          { in: "people = [[1,0]]", out: "[[1,0]]" },
        ],
        ["1 <= people.length <= 30", "0 <= h <= 100", "0 <= k < people.length", "The queue is guaranteed to be reconstructible."]),
      hints: [
        "Place the tallest people first: shorter people inserted later are invisible to them, so their `k` never changes.",
        "Sort by height descending, breaking ties by `k` ascending.",
        "Then insert each person at index `k` — with only taller-or-equal people already placed, index `k` is exactly the right spot.",
      ],
      examples: [
        { input: "[[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]", expectedOutput: "[[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]" },
        { input: "[[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]", expectedOutput: "[[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]" },
        { input: "[[1,0]]", expectedOutput: "[[1,0]]" },
      ],
      gen: (rng: Rng) => {
        // Build a real queue, then shuffle it — that guarantees reconstructibility.
        const n = ri(rng, 1, 20);
        const heights = randArr(rng, n, 0, 100);
        const queue = heights.map((h, i) => {
          let taller = 0;
          for (let j = 0; j < i; j++) if (heights[j] >= h) taller++;
          return [h, taller];
        });
        const people = shuffle(rng, queue.map((p) => p.slice()));
        return { input: fmtIntMat(people), expectedOutput: fmtIntMat(ref(people)) };
      },
      solutions: {
        python: `def reconstructQueue(people):\n    ordered = sorted(people, key=lambda p: (-p[0], p[1]))\n    out = []\n    for person in ordered:\n        out.insert(person[1], person)\n    return out`,
        javascript: `var reconstructQueue = function(people) {\n    const sorted = people.slice().sort(function(a, b) {\n        return b[0] !== a[0] ? b[0] - a[0] : a[1] - b[1];\n    });\n    const out = [];\n    for (let i = 0; i < sorted.length; i++) {\n        out.splice(sorted[i][1], 0, sorted[i]);\n    }\n    return out;\n};`,
              typescript: `function reconstructQueue(people: number[][]): number[][] {\n    var sorted = people.slice().sort(function (a, b) {\n        if (b[0] !== a[0]) return b[0] - a[0];\n        return a[1] - b[1];\n    });\n    var out: number[][] = [];\n    for (var i = 0; i < sorted.length; i++) {\n        out.splice(sorted[i][1], 0, [sorted[i][0], sorted[i][1]]);\n    }\n    return out;\n}`,
              java: `public static int[][] reconstructQueue(int[][] people) {\n    int[][] s = people.clone();\n    Arrays.sort(s, (a, b) -> a[0] != b[0] ? b[0] - a[0] : a[1] - b[1]);\n    List<int[]> out = new ArrayList<>();\n    for (int[] p : s) out.add(p[1], new int[]{p[0], p[1]});\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {\n    vector<vector<int>> s = people;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) {\n        if (a[0] != b[0]) return a[0] > b[0];\n        return a[1] < b[1];\n    });\n    vector<vector<int>> out;\n    for (const auto& p : s) {\n        out.insert(out.begin() + p[1], vector<int>{p[0], p[1]});\n    }\n    return out;\n}`,
              c: `static int cmpQueueHeight(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    if (x[0] != y[0]) return (y[0] > x[0]) - (y[0] < x[0]);\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint** reconstructQueue(int** people, int peopleSize, int* peopleColSize, int* returnSize, int** returnColumnSizes) {\n    int n = peopleSize;\n    int** s = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    for (int i = 0; i < n; i++) s[i] = people[i];\n    qsort(s, n, sizeof(int*), cmpQueueHeight);\n    int** out = (int**) malloc((n > 0 ? n : 1) * sizeof(int*));\n    int* cols = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        int pos = s[i][1];\n        for (int j = count; j > pos; j--) out[j] = out[j - 1];\n        int* row = (int*) malloc(2 * sizeof(int));\n        row[0] = s[i][0];\n        row[1] = s[i][1];\n        out[pos] = row;\n        count++;\n    }\n    for (int i = 0; i < count; i++) cols[i] = 2;\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] ReconstructQueue(int[][] people)\n{\n    var s = new List<int[]>(people);\n    s.Sort((a, b) => a[0] != b[0] ? b[0].CompareTo(a[0]) : a[1].CompareTo(b[1]));\n    var res = new List<int[]>();\n    foreach (int[] p in s) res.Insert(p[1], new int[] { p[0], p[1] });\n    return res.ToArray();\n}`,
              go: `func reconstructQueue(people [][]int) [][]int {\n	s := append([][]int{}, people...)\n	sort.Slice(s, func(a, b int) bool {\n		if s[a][0] != s[b][0] {\n			return s[a][0] > s[b][0]\n		}\n		return s[a][1] < s[b][1]\n	})\n	out := [][]int{}\n	for _, p := range s {\n		pos := p[1]\n		out = append(out, nil)\n		copy(out[pos+1:], out[pos:])\n		out[pos] = []int{p[0], p[1]}\n	}\n	return out\n}`,
              kotlin: `fun reconstructQueue(people: Array<IntArray>): Array<IntArray> {\n    val s = people.sortedWith(compareByDescending<IntArray> { it[0] }.thenBy { it[1] })\n    val out = ArrayList<IntArray>()\n    for (p in s) out.add(p[1], intArrayOf(p[0], p[1]))\n    return out.toTypedArray()\n}`,
              swift: `func reconstructQueue(_ people: [[Int]]) -> [[Int]] {\n    let s = people.sorted { a, b in\n        if a[0] != b[0] { return a[0] > b[0] }\n        return a[1] < b[1]\n    }\n    var out: [[Int]] = []\n    for p in s {\n        out.insert([p[0], p[1]], at: p[1])\n    }\n    return out\n}`,
              rust: `fn reconstructQueue(people: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut s = people.clone();\n    s.sort_by(|a, b| {\n        if a[0] != b[0] {\n            b[0].cmp(&a[0])\n        } else {\n            a[1].cmp(&b[1])\n        }\n    });\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for p in s.iter() {\n        let pos = p[1] as usize;\n        out.insert(pos, vec![p[0], p[1]]);\n    }\n    out\n}`,
              php: `function reconstructQueue($people) {\n    $s = $people;\n    usort($s, function($a, $b) {\n        if ($a[0] != $b[0]) return $b[0] - $a[0];\n        return $a[1] - $b[1];\n    });\n    $out = array();\n    foreach ($s as $p) {\n        array_splice($out, $p[1], 0, array(array($p[0], $p[1])));\n    }\n    return $out;\n}`,
              ruby: `def reconstructQueue(people)\n  s = people.sort_by { |p| [-p[0], p[1]] }\n  out = []\n  s.each { |p| out.insert(p[1], [p[0], p[1]]) }\n  out\nend`,
      },
    };
  })(),

  // ── Reduce Array Size to The Half ───────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < arr.length; i++) count.set(arr[i], (count.get(arr[i]) ?? 0) + 1);
      const freqs: number[] = [];
      count.forEach((c) => freqs.push(c));
      freqs.sort((a, b) => b - a);
      let removed = 0, chosen = 0;
      const half = arr.length / 2;
      for (let i = 0; i < freqs.length; i++) {
        removed += freqs[i];
        chosen++;
        if (removed >= half) break;
      }
      return chosen;
    };
    return {
      slug: "reduce-array-size-to-the-half",
      title: "Reduce Array Size to The Half",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Sorting", "Heap", "Amazon", "Microsoft"],
      signature: { funcName: "minSetSize", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `arr`. Choose a set of integers and remove **every** occurrence of them from `arr`.\n\nReturn the minimum size of such a set so that at least half of the array's elements are removed.",
        [
          { in: "arr = [3,3,3,3,5,5,5,2,2,7]", out: "2", note: "Removing {3,7} leaves 5 of the 10 elements." },
          { in: "arr = [7,7,7,7,7,7]", out: "1" },
          { in: "arr = [1,2]", out: "1" },
        ],
        ["2 <= arr.length <= 40", "arr.length is even.", "1 <= arr[i] <= 100000"]),
      hints: [
        "Removing a value removes all of its copies at once, so only the frequencies matter.",
        "Take the most frequent values first — each choice removes as much as possible.",
        "Sort the frequencies descending and accumulate until the running total reaches half the length.",
      ],
      examples: [
        { input: "[3,3,3,3,5,5,5,2,2,7]", expectedOutput: "2" },
        { input: "[7,7,7,7,7,7]", expectedOutput: "1" },
        { input: "[1,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 20);
        const arr = randArr(rng, n, 1, rng() < 0.7 ? 8 : 100000);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def minSetSize(arr) -> int:\n    count = {}\n    for x in arr:\n        count[x] = count.get(x, 0) + 1\n    freqs = sorted(count.values(), reverse=True)\n    removed = chosen = 0\n    half = len(arr) // 2\n    for f in freqs:\n        removed += f\n        chosen += 1\n        if removed >= half:\n            break\n    return chosen`,
        javascript: `var minSetSize = function(arr) {\n    const count = new Map();\n    for (let i = 0; i < arr.length; i++) {\n        count.set(arr[i], (count.get(arr[i]) || 0) + 1);\n    }\n    const freqs = [];\n    count.forEach(function(c) { freqs.push(c); });\n    freqs.sort(function(a, b) { return b - a; });\n    let removed = 0, chosen = 0;\n    const half = arr.length / 2;\n    for (let i = 0; i < freqs.length; i++) {\n        removed += freqs[i];\n        chosen++;\n        if (removed >= half) break;\n    }\n    return chosen;\n};`,
              typescript: `function minSetSize(arr: number[]): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < arr.length; i++) {\n        var key = String(arr[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    var freqs: number[] = [];\n    for (var k in count) {\n        if (Object.prototype.hasOwnProperty.call(count, k)) freqs.push(count[k]);\n    }\n    freqs.sort(function (a, b) { return b - a; });\n    var removed = 0, chosen = 0;\n    var half = arr.length / 2;\n    for (var j = 0; j < freqs.length; j++) {\n        removed += freqs[j];\n        chosen++;\n        if (removed >= half) break;\n    }\n    return chosen;\n}`,
              java: `public static int minSetSize(int[] arr) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : arr) count.put(x, count.getOrDefault(x, 0) + 1);\n    List<Integer> freqs = new ArrayList<>(count.values());\n    Collections.sort(freqs, Collections.reverseOrder());\n    int removed = 0, chosen = 0;\n    int half = arr.length / 2;\n    for (int f : freqs) {\n        removed += f;\n        chosen++;\n        if (removed >= half) break;\n    }\n    return chosen;\n}`,
              cpp: `int minSetSize(vector<int>& arr) {\n    unordered_map<int, int> count;\n    for (int x : arr) count[x]++;\n    vector<int> freqs;\n    for (const auto& kv : count) freqs.push_back(kv.second);\n    sort(freqs.begin(), freqs.end(), greater<int>());\n    int removed = 0, chosen = 0;\n    int half = (int) arr.size() / 2;\n    for (int f : freqs) {\n        removed += f;\n        chosen++;\n        if (removed >= half) break;\n    }\n    return chosen;\n}`,
              c: `static int cmpHalfAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int cmpHalfDesc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (y > x) - (y < x);\n}\n\nint minSetSize(int* arr, int arrSize) {\n    int* a = (int*) malloc((arrSize > 0 ? arrSize : 1) * sizeof(int));\n    for (int i = 0; i < arrSize; i++) a[i] = arr[i];\n    qsort(a, arrSize, sizeof(int), cmpHalfAsc);\n    int* freqs = (int*) malloc((arrSize > 0 ? arrSize : 1) * sizeof(int));\n    int m = 0;\n    int i = 0;\n    while (i < arrSize) {\n        int j = i;\n        while (j < arrSize && a[j] == a[i]) j++;\n        freqs[m++] = j - i;\n        i = j;\n    }\n    qsort(freqs, m, sizeof(int), cmpHalfDesc);\n    int removed = 0, chosen = 0;\n    int half = arrSize / 2;\n    for (int k = 0; k < m; k++) {\n        removed += freqs[k];\n        chosen++;\n        if (removed >= half) break;\n    }\n    free(a);\n    free(freqs);\n    return chosen;\n}`,
              csharp: `public static int MinSetSize(int[] arr)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in arr)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    var freqs = new List<int>(count.Values);\n    freqs.Sort((a, b) => b.CompareTo(a));\n    int removed = 0, chosen = 0;\n    int half = arr.Length / 2;\n    foreach (int f in freqs)\n    {\n        removed += f;\n        chosen++;\n        if (removed >= half) break;\n    }\n    return chosen;\n}`,
              go: `func minSetSize(arr []int) int {\n	count := map[int]int{}\n	for _, x := range arr {\n		count[x]++\n	}\n	freqs := []int{}\n	for _, c := range count {\n		freqs = append(freqs, c)\n	}\n	sort.Sort(sort.Reverse(sort.IntSlice(freqs)))\n	removed, chosen := 0, 0\n	half := len(arr) / 2\n	for _, f := range freqs {\n		removed += f\n		chosen++\n		if removed >= half {\n			break\n		}\n	}\n	return chosen\n}`,
              kotlin: `fun minSetSize(arr: IntArray): Int {\n    val count = HashMap<Int, Int>()\n    for (x in arr) count[x] = (count[x] ?: 0) + 1\n    val freqs = count.values.sortedDescending()\n    var removed = 0\n    var chosen = 0\n    val half = arr.size / 2\n    for (f in freqs) {\n        removed += f\n        chosen++\n        if (removed >= half) break\n    }\n    return chosen\n}`,
              swift: `func minSetSize(_ arr: [Int]) -> Int {\n    var count: [Int: Int] = [:]\n    for x in arr { count[x] = (count[x] ?? 0) + 1 }\n    let freqs = count.values.sorted(by: >)\n    var removed = 0\n    var chosen = 0\n    let half = arr.count / 2\n    for f in freqs {\n        removed += f\n        chosen += 1\n        if removed >= half { break }\n    }\n    return chosen\n}`,
              rust: `use std::collections::HashMap;\n\nfn minSetSize(arr: Vec<i32>) -> i32 {\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for x in arr.iter() {\n        *count.entry(*x).or_insert(0) += 1;\n    }\n    let mut freqs: Vec<i32> = count.values().cloned().collect();\n    freqs.sort_by(|a, b| b.cmp(a));\n    let mut removed = 0;\n    let mut chosen = 0;\n    let half = (arr.len() / 2) as i32;\n    for f in freqs.iter() {\n        removed += *f;\n        chosen += 1;\n        if removed >= half {\n            break;\n        }\n    }\n    chosen\n}`,
              php: `function minSetSize($arr) {\n    $count = array();\n    foreach ($arr as $x) {\n        if (isset($count[$x])) $count[$x]++;\n        else $count[$x] = 1;\n    }\n    $freqs = array_values($count);\n    rsort($freqs);\n    $removed = 0;\n    $chosen = 0;\n    $half = intdiv(count($arr), 2);\n    foreach ($freqs as $f) {\n        $removed += $f;\n        $chosen++;\n        if ($removed >= $half) break;\n    }\n    return $chosen;\n}`,
              ruby: `def minSetSize(arr)\n  count = Hash.new(0)\n  arr.each { |x| count[x] += 1 }\n  freqs = count.values.sort.reverse\n  removed = 0\n  chosen = 0\n  half = arr.length / 2\n  freqs.each do |f|\n    removed += f\n    chosen += 1\n    break if removed >= half\n  end\n  chosen\nend`,
      },
    };
  })(),

  // ── Maximum Units on a Truck ────────────────────────────────────
  (() => {
    const ref = (boxTypes: number[][], truckSize: number) => {
      const sorted = boxTypes.slice().sort((a, b) => b[1] - a[1]);
      let remaining = truckSize, total = 0;
      for (let i = 0; i < sorted.length && remaining > 0; i++) {
        const take = Math.min(remaining, sorted[i][0]);
        total += take * sorted[i][1];
        remaining -= take;
      }
      return total;
    };
    return {
      slug: "maximum-units-on-a-truck",
      title: "Maximum Units on a Truck",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "maximumUnits", params: [{ name: "boxTypes", type: "int[][]" as const }, { name: "truckSize", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are loading boxes onto one truck. `boxTypes[i] = [count, unitsPerBox]` means there are `count` boxes of that type and each holds `unitsPerBox` units.\n\nYou may load at most `truckSize` **boxes** in total, choosing any combination. Return the maximum total number of **units** you can carry.",
        [
          { in: "boxTypes = [[1,3],[2,2],[3,1]], truckSize = 4", out: "8", note: "Take the 1 box of 3 units, both boxes of 2 units, and one box of 1 unit." },
          { in: "boxTypes = [[5,10],[2,5],[4,7],[3,9]], truckSize = 10", out: "91" },
          { in: "boxTypes = [[1,1]], truckSize = 5", out: "1" },
        ],
        ["1 <= boxTypes.length <= 30", "1 <= count, unitsPerBox <= 1000", "1 <= truckSize <= 1000"]),
      hints: [
        "Every box takes the same amount of truck space, so always prefer the box that carries more units.",
        "Sort by units per box descending and take greedily until the truck is full.",
        "The last box type may be taken only partially — clamp the count to the remaining space.",
      ],
      examples: [
        { input: "[[1,3],[2,2],[3,1]]\n4", expectedOutput: "8" },
        { input: "[[5,10],[2,5],[4,7],[3,9]]\n10", expectedOutput: "91" },
        { input: "[[1,1]]\n5", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const boxTypes = Array.from({ length: ri(rng, 1, 30) }, () => [ri(rng, 1, 1000), ri(rng, 1, 1000)]);
        const truckSize = ri(rng, 1, 1000);
        return { input: `${fmtIntMat(boxTypes)}\n${truckSize}`, expectedOutput: String(ref(boxTypes, truckSize)) };
      },
      solutions: {
        python: `def maximumUnits(boxTypes, truckSize: int) -> int:\n    ordered = sorted(boxTypes, key=lambda b: -b[1])\n    remaining = truckSize\n    total = 0\n    for count, units in ordered:\n        if remaining <= 0:\n            break\n        take = min(remaining, count)\n        total += take * units\n        remaining -= take\n    return total`,
        javascript: `var maximumUnits = function(boxTypes, truckSize) {\n    const sorted = boxTypes.slice().sort(function(a, b) { return b[1] - a[1]; });\n    let remaining = truckSize, total = 0;\n    for (let i = 0; i < sorted.length && remaining > 0; i++) {\n        const take = Math.min(remaining, sorted[i][0]);\n        total += take * sorted[i][1];\n        remaining -= take;\n    }\n    return total;\n};`,
              typescript: `function maximumUnits(boxTypes: number[][], truckSize: number): number {\n    var sorted = boxTypes.slice().sort(function (a, b) { return b[1] - a[1]; });\n    var remaining = truckSize;\n    var total = 0;\n    for (var i = 0; i < sorted.length && remaining > 0; i++) {\n        var take = Math.min(remaining, sorted[i][0]);\n        total += take * sorted[i][1];\n        remaining -= take;\n    }\n    return total;\n}`,
              java: `public static int maximumUnits(int[][] boxTypes, int truckSize) {\n    int[][] s = boxTypes.clone();\n    Arrays.sort(s, (a, b) -> b[1] - a[1]);\n    int remaining = truckSize, total = 0;\n    for (int i = 0; i < s.length && remaining > 0; i++) {\n        int take = Math.min(remaining, s[i][0]);\n        total += take * s[i][1];\n        remaining -= take;\n    }\n    return total;\n}`,
              cpp: `int maximumUnits(vector<vector<int>>& boxTypes, int truckSize) {\n    vector<vector<int>> s = boxTypes;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] > b[1]; });\n    int remaining = truckSize, total = 0;\n    for (int i = 0; i < (int) s.size() && remaining > 0; i++) {\n        int take = min(remaining, s[i][0]);\n        total += take * s[i][1];\n        remaining -= take;\n    }\n    return total;\n}`,
              c: `static int cmpUnitsDesc(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (y[1] > x[1]) - (y[1] < x[1]);\n}\n\nint maximumUnits(int** boxTypes, int boxTypesSize, int* boxTypesColSize, int truckSize) {\n    int** s = (int**) malloc((boxTypesSize > 0 ? boxTypesSize : 1) * sizeof(int*));\n    for (int i = 0; i < boxTypesSize; i++) s[i] = boxTypes[i];\n    qsort(s, boxTypesSize, sizeof(int*), cmpUnitsDesc);\n    int remaining = truckSize, total = 0;\n    for (int i = 0; i < boxTypesSize && remaining > 0; i++) {\n        int take = remaining < s[i][0] ? remaining : s[i][0];\n        total += take * s[i][1];\n        remaining -= take;\n    }\n    free(s);\n    return total;\n}`,
              csharp: `public static int MaximumUnits(int[][] boxTypes, int truckSize)\n{\n    var s = new List<int[]>(boxTypes);\n    s.Sort((a, b) => b[1].CompareTo(a[1]));\n    int remaining = truckSize, total = 0;\n    for (int i = 0; i < s.Count && remaining > 0; i++)\n    {\n        int take = Math.Min(remaining, s[i][0]);\n        total += take * s[i][1];\n        remaining -= take;\n    }\n    return total;\n}`,
              go: `func maximumUnits(boxTypes [][]int, truckSize int) int {\n	s := append([][]int{}, boxTypes...)\n	sort.Slice(s, func(a, b int) bool { return s[a][1] > s[b][1] })\n	remaining, total := truckSize, 0\n	for i := 0; i < len(s) && remaining > 0; i++ {\n		take := s[i][0]\n		if remaining < take {\n			take = remaining\n		}\n		total += take * s[i][1]\n		remaining -= take\n	}\n	return total\n}`,
              kotlin: `fun maximumUnits(boxTypes: Array<IntArray>, truckSize: Int): Int {\n    val s = boxTypes.sortedByDescending { it[1] }\n    var remaining = truckSize\n    var total = 0\n    for (b in s) {\n        if (remaining <= 0) break\n        val take = if (remaining < b[0]) remaining else b[0]\n        total += take * b[1]\n        remaining -= take\n    }\n    return total\n}`,
              swift: `func maximumUnits(_ boxTypes: [[Int]], _ truckSize: Int) -> Int {\n    let s = boxTypes.sorted { $0[1] > $1[1] }\n    var remaining = truckSize\n    var total = 0\n    for b in s {\n        if remaining <= 0 { break }\n        let take = min(remaining, b[0])\n        total += take * b[1]\n        remaining -= take\n    }\n    return total\n}`,
              rust: `fn maximumUnits(boxTypes: Vec<Vec<i32>>, truckSize: i32) -> i32 {\n    let mut s = boxTypes.clone();\n    s.sort_by(|a, b| b[1].cmp(&a[1]));\n    let mut remaining = truckSize;\n    let mut total = 0;\n    for b in s.iter() {\n        if remaining <= 0 {\n            break;\n        }\n        let take = if remaining < b[0] { remaining } else { b[0] };\n        total += take * b[1];\n        remaining -= take;\n    }\n    total\n}`,
              php: `function maximumUnits($boxTypes, $truckSize) {\n    $s = $boxTypes;\n    usort($s, function($a, $b) { return $b[1] - $a[1]; });\n    $remaining = $truckSize;\n    $total = 0;\n    foreach ($s as $b) {\n        if ($remaining <= 0) break;\n        $take = min($remaining, $b[0]);\n        $total += $take * $b[1];\n        $remaining -= $take;\n    }\n    return $total;\n}`,
              ruby: `def maximumUnits(boxTypes, truckSize)\n  s = boxTypes.sort_by { |b| -b[1] }\n  remaining = truckSize\n  total = 0\n  s.each do |b|\n    break if remaining <= 0\n    take = [remaining, b[0]].min\n    total += take * b[1]\n    remaining -= take\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Deletions to Make Character Frequencies Unique ──────
  (() => {
    const ref = (s: string) => {
      const count = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
      const used = new Set<number>();
      let deletions = 0;
      for (let c = 0; c < 26; c++) {
        let f = count[c];
        while (f > 0 && used.has(f)) { f--; deletions++; }
        if (f > 0) used.add(f);
      }
      return deletions;
    };
    return {
      slug: "minimum-deletions-to-make-character-frequencies-unique",
      title: "Minimum Deletions to Make Character Frequencies Unique",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Greedy", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minDeletions", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **good** if no two different characters occur the same number of times.\n\nGiven a string `s`, return the minimum number of characters you must delete to make it good.",
        [
          { in: 's = "aab"', out: "0", note: "a occurs twice and b once — already good." },
          { in: 's = "aaabbbcc"', out: "2", note: 'Deleting two c\'s gives frequencies 3, 3 — no; deleting one b and one c gives 3, 2, 1.' },
          { in: 's = "ceabaacb"', out: "2" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters."]),
      hints: [
        "Only the 26 frequencies matter, not the characters themselves.",
        "Process the frequencies and keep a set of the ones already taken.",
        "While the current frequency is taken, delete one character — decrement it and count the deletion — until it is free or reaches zero.",
      ],
      examples: [
        { input: '"aab"', expectedOutput: "0" },
        { input: '"aaabbbcc"', expectedOutput: "2" },
        { input: '"ceabaacb"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.6 ? "abcde" : LOWER);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minDeletions(s: str) -> int:\n    count = [0] * 26\n    for ch in s:\n        count[ord(ch) - 97] += 1\n    used = set()\n    deletions = 0\n    for f in count:\n        while f > 0 and f in used:\n            f -= 1\n            deletions += 1\n        if f > 0:\n            used.add(f)\n    return deletions`,
        javascript: `var minDeletions = function(s) {\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    const used = new Set();\n    let deletions = 0;\n    for (let c = 0; c < 26; c++) {\n        let f = count[c];\n        while (f > 0 && used.has(f)) {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used.add(f);\n    }\n    return deletions;\n};`,
              typescript: `function minDeletions(s: string): number {\n    var count: number[] = [];\n    for (var i = 0; i < 26; i++) count.push(0);\n    for (var j = 0; j < s.length; j++) count[s.charCodeAt(j) - 97]++;\n    var used: { [key: string]: boolean } = {};\n    var deletions = 0;\n    for (var c = 0; c < 26; c++) {\n        var f = count[c];\n        while (f > 0 && used[String(f)] === true) {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used[String(f)] = true;\n    }\n    return deletions;\n}`,
              java: `public static int minDeletions(String s) {\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    Set<Integer> used = new HashSet<>();\n    int deletions = 0;\n    for (int c = 0; c < 26; c++) {\n        int f = count[c];\n        while (f > 0 && used.contains(f)) {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used.add(f);\n    }\n    return deletions;\n}`,
              cpp: `int minDeletions(string s) {\n    vector<int> count(26, 0);\n    for (char ch : s) count[ch - 'a']++;\n    unordered_set<int> used;\n    int deletions = 0;\n    for (int c = 0; c < 26; c++) {\n        int f = count[c];\n        while (f > 0 && used.count(f) > 0) {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used.insert(f);\n    }\n    return deletions;\n}`,
              c: `int minDeletions(const char* s) {\n    int count[26];\n    for (int i = 0; i < 26; i++) count[i] = 0;\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) count[s[i] - 'a']++;\n    int* used = (int*) calloc(n + 2, sizeof(int));\n    int deletions = 0;\n    for (int c = 0; c < 26; c++) {\n        int f = count[c];\n        while (f > 0 && used[f]) {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used[f] = 1;\n    }\n    free(used);\n    return deletions;\n}`,
              csharp: `public static int MinDeletions(string s)\n{\n    int[] count = new int[26];\n    foreach (char ch in s) count[ch - 'a']++;\n    var used = new HashSet<int>();\n    int deletions = 0;\n    for (int c = 0; c < 26; c++)\n    {\n        int f = count[c];\n        while (f > 0 && used.Contains(f))\n        {\n            f--;\n            deletions++;\n        }\n        if (f > 0) used.Add(f);\n    }\n    return deletions;\n}`,
              go: `func minDeletions(s string) int {\n	count := make([]int, 26)\n	for _, ch := range s {\n		count[ch-'a']++\n	}\n	used := map[int]bool{}\n	deletions := 0\n	for c := 0; c < 26; c++ {\n		f := count[c]\n		for f > 0 && used[f] {\n			f--\n			deletions++\n		}\n		if f > 0 {\n			used[f] = true\n		}\n	}\n	return deletions\n}`,
              kotlin: `fun minDeletions(s: String): Int {\n    val count = IntArray(26)\n    for (ch in s) count[ch - 'a']++\n    val used = HashSet<Int>()\n    var deletions = 0\n    for (c in 0 until 26) {\n        var f = count[c]\n        while (f > 0 && used.contains(f)) {\n            f--\n            deletions++\n        }\n        if (f > 0) used.add(f)\n    }\n    return deletions\n}`,
              swift: `func minDeletions(_ s: String) -> Int {\n    var count = [Int](repeating: 0, count: 26)\n    for ch in s.unicodeScalars {\n        count[Int(ch.value) - 97] += 1\n    }\n    var used = Set<Int>()\n    var deletions = 0\n    for c in 0..<26 {\n        var f = count[c]\n        while f > 0 && used.contains(f) {\n            f -= 1\n            deletions += 1\n        }\n        if f > 0 { used.insert(f) }\n    }\n    return deletions\n}`,
              rust: `use std::collections::HashSet;\n\nfn minDeletions(s: String) -> i32 {\n    let mut count = vec![0i32; 26];\n    for b in s.bytes() {\n        count[(b - b'a') as usize] += 1;\n    }\n    let mut used: HashSet<i32> = HashSet::new();\n    let mut deletions = 0;\n    for c in 0..26 {\n        let mut f = count[c];\n        while f > 0 && used.contains(&f) {\n            f -= 1;\n            deletions += 1;\n        }\n        if f > 0 {\n            used.insert(f);\n        }\n    }\n    deletions\n}`,
              php: `function minDeletions($s) {\n    $count = array_fill(0, 26, 0);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $count[ord($s[$i]) - 97]++;\n    }\n    $used = array();\n    $deletions = 0;\n    for ($c = 0; $c < 26; $c++) {\n        $f = $count[$c];\n        while ($f > 0 && isset($used[$f])) {\n            $f--;\n            $deletions++;\n        }\n        if ($f > 0) $used[$f] = true;\n    }\n    return $deletions;\n}`,
              ruby: `def minDeletions(s)\n  count = Array.new(26, 0)\n  s.each_byte { |b| count[b - 97] += 1 }\n  used = {}\n  deletions = 0\n  count.each do |c|\n    f = c\n    while f > 0 && used[f]\n      f -= 1\n      deletions += 1\n    end\n    used[f] = true if f > 0\n  end\n  deletions\nend`,
      },
    };
  })(),

  // ── Minimum Number of Steps to Make Two Strings Anagram ─────────
  (() => {
    const ref = (s: string, t: string) => {
      const count = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
      for (let i = 0; i < t.length; i++) count[t.charCodeAt(i) - 97]--;
      let steps = 0;
      for (let c = 0; c < 26; c++) if (count[c] > 0) steps += count[c];
      return steps;
    };
    return {
      slug: "minimum-number-of-steps-to-make-two-strings-anagram",
      title: "Minimum Number of Steps to Make Two Strings Anagram",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Adobe", "Microsoft"],
      signature: { funcName: "minSteps", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given two strings `s` and `t` of the **same length**. In one step you may replace any character of `t` with any other character.\n\nReturn the minimum number of steps needed to make `t` an anagram of `s`.",
        [
          { in: 's = "bab", t = "aba"', out: "1", note: 'Replacing the first a of t with b gives "bba", an anagram of "bab".' },
          { in: 's = "leetcode", t = "practice"', out: "5" },
          { in: 's = "anagram", t = "mangaar"', out: "0" },
        ],
        ["1 <= s.length <= 40", "t.length == s.length", "Both consist of lowercase English letters."]),
      hints: [
        "Count each letter in both strings and look at the difference.",
        "Every letter `s` needs more of has to be written into `t` somewhere — one step each.",
        "Because the lengths match, the surplus in `t` exactly covers those slots, so summing the positive differences is the answer.",
      ],
      examples: [
        { input: '"bab"\n"aba"', expectedOutput: "1" },
        { input: '"leetcode"\n"practice"', expectedOutput: "5" },
        { input: '"anagram"\n"mangaar"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "abcde" : LOWER;
        const n = ri(rng, 1, 40);
        const s = randStr(rng, n, n, alphabet);
        const t = rng() < 0.3 ? shuffle(rng, s.split("")).join("") : randStr(rng, n, n, alphabet);
        return { input: `"${s}"\n"${t}"`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: `def minSteps(s: str, t: str) -> int:\n    count = [0] * 26\n    for ch in s:\n        count[ord(ch) - 97] += 1\n    for ch in t:\n        count[ord(ch) - 97] -= 1\n    return sum(c for c in count if c > 0)`,
        javascript: `var minSteps = function(s, t) {\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    for (let i = 0; i < t.length; i++) count[t.charCodeAt(i) - 97]--;\n    let steps = 0;\n    for (let c = 0; c < 26; c++) {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n};`,
              typescript: `function minSteps(s: string, t: string): number {\n    var count: number[] = [];\n    for (var i = 0; i < 26; i++) count.push(0);\n    for (var j = 0; j < s.length; j++) count[s.charCodeAt(j) - 97]++;\n    for (var k = 0; k < t.length; k++) count[t.charCodeAt(k) - 97]--;\n    var steps = 0;\n    for (var c = 0; c < 26; c++) {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n}`,
              java: `public static int minSteps(String s, String t) {\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    for (int i = 0; i < t.length(); i++) count[t.charAt(i) - 'a']--;\n    int steps = 0;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n}`,
              cpp: `int minSteps(string s, string t) {\n    vector<int> count(26, 0);\n    for (char ch : s) count[ch - 'a']++;\n    for (char ch : t) count[ch - 'a']--;\n    int steps = 0;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n}`,
              c: `int minSteps(const char* s, const char* t) {\n    int count[26];\n    for (int i = 0; i < 26; i++) count[i] = 0;\n    for (int i = 0; s[i] != '\\0'; i++) count[s[i] - 'a']++;\n    for (int i = 0; t[i] != '\\0'; i++) count[t[i] - 'a']--;\n    int steps = 0;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n}`,
              csharp: `public static int MinSteps(string s, string t)\n{\n    int[] count = new int[26];\n    foreach (char ch in s) count[ch - 'a']++;\n    foreach (char ch in t) count[ch - 'a']--;\n    int steps = 0;\n    for (int c = 0; c < 26; c++)\n    {\n        if (count[c] > 0) steps += count[c];\n    }\n    return steps;\n}`,
              go: `func minSteps(s string, t string) int {\n	count := make([]int, 26)\n	for _, ch := range s {\n		count[ch-'a']++\n	}\n	for _, ch := range t {\n		count[ch-'a']--\n	}\n	steps := 0\n	for c := 0; c < 26; c++ {\n		if count[c] > 0 {\n			steps += count[c]\n		}\n	}\n	return steps\n}`,
              kotlin: `fun minSteps(s: String, t: String): Int {\n    val count = IntArray(26)\n    for (ch in s) count[ch - 'a']++\n    for (ch in t) count[ch - 'a']--\n    var steps = 0\n    for (c in 0 until 26) {\n        if (count[c] > 0) steps += count[c]\n    }\n    return steps\n}`,
              swift: `func minSteps(_ s: String, _ t: String) -> Int {\n    var count = [Int](repeating: 0, count: 26)\n    for ch in s.unicodeScalars { count[Int(ch.value) - 97] += 1 }\n    for ch in t.unicodeScalars { count[Int(ch.value) - 97] -= 1 }\n    var steps = 0\n    for c in 0..<26 {\n        if count[c] > 0 { steps += count[c] }\n    }\n    return steps\n}`,
              rust: `fn minSteps(s: String, t: String) -> i32 {\n    let mut count = vec![0i32; 26];\n    for b in s.bytes() {\n        count[(b - b'a') as usize] += 1;\n    }\n    for b in t.bytes() {\n        count[(b - b'a') as usize] -= 1;\n    }\n    let mut steps = 0;\n    for c in 0..26 {\n        if count[c] > 0 {\n            steps += count[c];\n        }\n    }\n    steps\n}`,
              php: `function minSteps($s, $t) {\n    $count = array_fill(0, 26, 0);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) $count[ord($s[$i]) - 97]++;\n    $m = strlen($t);\n    for ($i = 0; $i < $m; $i++) $count[ord($t[$i]) - 97]--;\n    $steps = 0;\n    for ($c = 0; $c < 26; $c++) {\n        if ($count[$c] > 0) $steps += $count[$c];\n    }\n    return $steps;\n}`,
              ruby: `def minSteps(s, t)\n  count = Array.new(26, 0)\n  s.each_byte { |b| count[b - 97] += 1 }\n  t.each_byte { |b| count[b - 97] -= 1 }\n  count.select { |c| c > 0 }.sum\nend`,
      },
    };
  })(),

  // ── Remove Covered Intervals ────────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const sorted = intervals.slice().sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]));
      let count = 0, right = -1;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i][1] > right) { count++; right = sorted[i][1]; }
      }
      return count;
    };
    return {
      slug: "remove-covered-intervals",
      title: "Remove Covered Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "removeCoveredIntervals", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of `intervals` where `intervals[i] = [l, r]`, remove every interval that is **covered** by another one, then return the number of intervals left.\n\nInterval `[a, b)` is covered by `[c, d)` when `c <= a` and `b <= d`.",
        [
          { in: "intervals = [[1,4],[3,6],[2,8]]", out: "2", note: "[3,6] is covered by [2,8]." },
          { in: "intervals = [[1,4],[2,3]]", out: "1" },
          { in: "intervals = [[0,10],[5,12]]", out: "2" },
        ],
        ["1 <= intervals.length <= 30", "0 <= l < r <= 1000"]),
      hints: [
        "Sort by left endpoint ascending; ties must break by right endpoint **descending**.",
        "That tie-break puts a covering interval before the ones it swallows.",
        "Then keep an interval only when its right endpoint exceeds the largest right endpoint seen so far.",
      ],
      examples: [
        { input: "[[1,4],[3,6],[2,8]]", expectedOutput: "2" },
        { input: "[[1,4],[2,3]]", expectedOutput: "1" },
        { input: "[[0,10],[5,12]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const intervals = Array.from({ length: ri(rng, 1, 30) }, () => {
          const l = ri(rng, 0, 999);
          return [l, ri(rng, l + 1, 1000)];
        });
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      solutions: {
        python: `def removeCoveredIntervals(intervals) -> int:\n    ordered = sorted(intervals, key=lambda p: (p[0], -p[1]))\n    count = 0\n    right = -1\n    for l, r in ordered:\n        if r > right:\n            count += 1\n            right = r\n    return count`,
        javascript: `var removeCoveredIntervals = function(intervals) {\n    const sorted = intervals.slice().sort(function(a, b) {\n        return a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1];\n    });\n    let count = 0, right = -1;\n    for (let i = 0; i < sorted.length; i++) {\n        if (sorted[i][1] > right) {\n            count++;\n            right = sorted[i][1];\n        }\n    }\n    return count;\n};`,
              typescript: `function removeCoveredIntervals(intervals: number[][]): number {\n    var sorted = intervals.slice().sort(function (a, b) {\n        if (a[0] !== b[0]) return a[0] - b[0];\n        return b[1] - a[1];\n    });\n    var count = 0;\n    var right = -1;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i][1] > right) {\n            count++;\n            right = sorted[i][1];\n        }\n    }\n    return count;\n}`,
              java: `public static int removeCoveredIntervals(int[][] intervals) {\n    int[][] s = intervals.clone();\n    Arrays.sort(s, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);\n    int count = 0, right = -1;\n    for (int[] iv : s) {\n        if (iv[1] > right) {\n            count++;\n            right = iv[1];\n        }\n    }\n    return count;\n}`,
              cpp: `int removeCoveredIntervals(vector<vector<int>>& intervals) {\n    vector<vector<int>> s = intervals;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) {\n        if (a[0] != b[0]) return a[0] < b[0];\n        return a[1] > b[1];\n    });\n    int count = 0, right = -1;\n    for (const auto& iv : s) {\n        if (iv[1] > right) {\n            count++;\n            right = iv[1];\n        }\n    }\n    return count;\n}`,
              c: `static int cmpCovered(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    if (x[0] != y[0]) return (x[0] > y[0]) - (x[0] < y[0]);\n    return (y[1] > x[1]) - (y[1] < x[1]);\n}\n\nint removeCoveredIntervals(int** intervals, int intervalsSize, int* intervalsColSize) {\n    int** s = (int**) malloc((intervalsSize > 0 ? intervalsSize : 1) * sizeof(int*));\n    for (int i = 0; i < intervalsSize; i++) s[i] = intervals[i];\n    qsort(s, intervalsSize, sizeof(int*), cmpCovered);\n    int count = 0, right = -1;\n    for (int i = 0; i < intervalsSize; i++) {\n        if (s[i][1] > right) {\n            count++;\n            right = s[i][1];\n        }\n    }\n    free(s);\n    return count;\n}`,
              csharp: `public static int RemoveCoveredIntervals(int[][] intervals)\n{\n    var s = new List<int[]>(intervals);\n    s.Sort((a, b) => a[0] != b[0] ? a[0].CompareTo(b[0]) : b[1].CompareTo(a[1]));\n    int count = 0, right = -1;\n    foreach (int[] iv in s)\n    {\n        if (iv[1] > right)\n        {\n            count++;\n            right = iv[1];\n        }\n    }\n    return count;\n}`,
              go: `func removeCoveredIntervals(intervals [][]int) int {\n	s := append([][]int{}, intervals...)\n	sort.Slice(s, func(a, b int) bool {\n		if s[a][0] != s[b][0] {\n			return s[a][0] < s[b][0]\n		}\n		return s[a][1] > s[b][1]\n	})\n	count, right := 0, -1\n	for _, iv := range s {\n		if iv[1] > right {\n			count++\n			right = iv[1]\n		}\n	}\n	return count\n}`,
              kotlin: `fun removeCoveredIntervals(intervals: Array<IntArray>): Int {\n    val s = intervals.sortedWith(compareBy<IntArray> { it[0] }.thenByDescending { it[1] })\n    var count = 0\n    var right = -1\n    for (iv in s) {\n        if (iv[1] > right) {\n            count++\n            right = iv[1]\n        }\n    }\n    return count\n}`,
              swift: `func removeCoveredIntervals(_ intervals: [[Int]]) -> Int {\n    let s = intervals.sorted { a, b in\n        if a[0] != b[0] { return a[0] < b[0] }\n        return a[1] > b[1]\n    }\n    var count = 0\n    var right = -1\n    for iv in s {\n        if iv[1] > right {\n            count += 1\n            right = iv[1]\n        }\n    }\n    return count\n}`,
              rust: `fn removeCoveredIntervals(intervals: Vec<Vec<i32>>) -> i32 {\n    let mut s = intervals.clone();\n    s.sort_by(|a, b| {\n        if a[0] != b[0] {\n            a[0].cmp(&b[0])\n        } else {\n            b[1].cmp(&a[1])\n        }\n    });\n    let mut count = 0;\n    let mut right = -1;\n    for iv in s.iter() {\n        if iv[1] > right {\n            count += 1;\n            right = iv[1];\n        }\n    }\n    count\n}`,
              php: `function removeCoveredIntervals($intervals) {\n    $s = $intervals;\n    usort($s, function($a, $b) {\n        if ($a[0] != $b[0]) return $a[0] - $b[0];\n        return $b[1] - $a[1];\n    });\n    $count = 0;\n    $right = -1;\n    foreach ($s as $iv) {\n        if ($iv[1] > $right) {\n            $count++;\n            $right = $iv[1];\n        }\n    }\n    return $count;\n}`,
              ruby: `def removeCoveredIntervals(intervals)\n  s = intervals.sort_by { |iv| [iv[0], -iv[1]] }\n  count = 0\n  right = -1\n  s.each do |iv|\n    if iv[1] > right\n      count += 1\n      right = iv[1]\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum Ice Cream Bars ──────────────────────────────────────
  (() => {
    const ref = (costs: number[], coins: number) => {
      const sorted = costs.slice().sort((a, b) => a - b);
      let bought = 0, left = coins;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] > left) break;
        left -= sorted[i];
        bought++;
      }
      return bought;
    };
    return {
      slug: "maximum-ice-cream-bars",
      title: "Maximum Ice Cream Bars",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Counting Sort", "Amazon", "Adobe"],
      signature: { funcName: "maxIceCream", params: [{ name: "costs", type: "int[]" as const }, { name: "coins", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A shop sells ice cream bars; `costs[i]` is the price of the i-th bar. A boy has `coins` coins and wants **as many bars as possible**, not the most expensive ones.\n\nReturn the maximum number of bars he can buy.",
        [
          { in: "costs = [1,3,2,4,1], coins = 7", out: "4", note: "Buy the bars costing 1, 1, 2 and 3." },
          { in: "costs = [10,6,8,7,7,8], coins = 5", out: "0" },
          { in: "costs = [1,6,3,1,2,5], coins = 20", out: "6" },
        ],
        ["1 <= costs.length <= 40", "1 <= costs[i] <= 1000", "1 <= coins <= 100000"]),
      hints: [
        "Since every bar counts the same toward the answer, always buy the cheapest remaining one.",
        "Sort ascending and spend until the next bar is unaffordable.",
        "Because the prices are bounded, a counting sort makes it linear.",
      ],
      examples: [
        { input: "[1,3,2,4,1]\n7", expectedOutput: "4" },
        { input: "[10,6,8,7,7,8]\n5", expectedOutput: "0" },
        { input: "[1,6,3,1,2,5]\n20", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const costs = randArr(rng, ri(rng, 1, 40), 1, 1000);
        const coins = ri(rng, 1, 100000);
        return { input: `${fmtIntArr(costs)}\n${coins}`, expectedOutput: String(ref(costs, coins)) };
      },
      solutions: {
        python: `def maxIceCream(costs, coins: int) -> int:\n    bought = 0\n    for price in sorted(costs):\n        if price > coins:\n            break\n        coins -= price\n        bought += 1\n    return bought`,
        javascript: `var maxIceCream = function(costs, coins) {\n    const sorted = costs.slice().sort(function(a, b) { return a - b; });\n    let bought = 0, left = coins;\n    for (let i = 0; i < sorted.length; i++) {\n        if (sorted[i] > left) break;\n        left -= sorted[i];\n        bought++;\n    }\n    return bought;\n};`,
              typescript: `function maxIceCream(costs: number[], coins: number): number {\n    var sorted = costs.slice().sort(function (a, b) { return a - b; });\n    var bought = 0;\n    var left = coins;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i] > left) break;\n        left -= sorted[i];\n        bought++;\n    }\n    return bought;\n}`,
              java: `public static int maxIceCream(int[] costs, int coins) {\n    int[] s = costs.clone();\n    Arrays.sort(s);\n    int bought = 0, left = coins;\n    for (int price : s) {\n        if (price > left) break;\n        left -= price;\n        bought++;\n    }\n    return bought;\n}`,
              cpp: `int maxIceCream(vector<int>& costs, int coins) {\n    vector<int> s = costs;\n    sort(s.begin(), s.end());\n    int bought = 0, left = coins;\n    for (int price : s) {\n        if (price > left) break;\n        left -= price;\n        bought++;\n    }\n    return bought;\n}`,
              c: `static int cmpIceAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maxIceCream(int* costs, int costsSize, int coins) {\n    int* s = (int*) malloc((costsSize > 0 ? costsSize : 1) * sizeof(int));\n    for (int i = 0; i < costsSize; i++) s[i] = costs[i];\n    qsort(s, costsSize, sizeof(int), cmpIceAsc);\n    int bought = 0, left = coins;\n    for (int i = 0; i < costsSize; i++) {\n        if (s[i] > left) break;\n        left -= s[i];\n        bought++;\n    }\n    free(s);\n    return bought;\n}`,
              csharp: `public static int MaxIceCream(int[] costs, int coins)\n{\n    int[] s = (int[]) costs.Clone();\n    Array.Sort(s);\n    int bought = 0, left = coins;\n    foreach (int price in s)\n    {\n        if (price > left) break;\n        left -= price;\n        bought++;\n    }\n    return bought;\n}`,
              go: `func maxIceCream(costs []int, coins int) int {\n	s := append([]int{}, costs...)\n	sort.Ints(s)\n	bought, left := 0, coins\n	for _, price := range s {\n		if price > left {\n			break\n		}\n		left -= price\n		bought++\n	}\n	return bought\n}`,
              kotlin: `fun maxIceCream(costs: IntArray, coins: Int): Int {\n    val s = costs.sortedArray()\n    var bought = 0\n    var left = coins\n    for (price in s) {\n        if (price > left) break\n        left -= price\n        bought++\n    }\n    return bought\n}`,
              swift: `func maxIceCream(_ costs: [Int], _ coins: Int) -> Int {\n    let s = costs.sorted()\n    var bought = 0\n    var left = coins\n    for price in s {\n        if price > left { break }\n        left -= price\n        bought += 1\n    }\n    return bought\n}`,
              rust: `fn maxIceCream(costs: Vec<i32>, coins: i32) -> i32 {\n    let mut s = costs.clone();\n    s.sort();\n    let mut bought = 0;\n    let mut left = coins;\n    for price in s.iter() {\n        if *price > left {\n            break;\n        }\n        left -= *price;\n        bought += 1;\n    }\n    bought\n}`,
              php: `function maxIceCream($costs, $coins) {\n    $s = $costs;\n    sort($s);\n    $bought = 0;\n    $left = $coins;\n    foreach ($s as $price) {\n        if ($price > $left) break;\n        $left -= $price;\n        $bought++;\n    }\n    return $bought;\n}`,
              ruby: `def maxIceCream(costs, coins)\n  bought = 0\n  left = coins\n  costs.sort.each do |price|\n    break if price > left\n    left -= price\n    bought += 1\n  end\n  bought\nend`,
      },
    };
  })(),

  // ── Minimum Cost to Move Chips to The Same Position ─────────────
  (() => {
    const ref = (position: number[]) => {
      let even = 0, odd = 0;
      for (let i = 0; i < position.length; i++) {
        if (position[i] % 2 === 0) even++;
        else odd++;
      }
      return Math.min(even, odd);
    };
    return {
      slug: "minimum-cost-to-move-chips-to-the-same-position",
      title: "Minimum Cost to Move Chips to The Same Position",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Greedy", "Amazon", "Adobe"],
      signature: { funcName: "minCostToMoveChips", params: [{ name: "position", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are chips at various positions; `position[i]` is where the i-th chip sits. You may move any chip:\n\n- by **2** in either direction, at cost `0`;\n- by **1** in either direction, at cost `1`.\n\nReturn the minimum total cost of gathering all the chips onto one position.",
        [
          { in: "position = [1,2,3]", out: "1", note: "Move the chip at 1 to 3 for free, then the chip at 2 to 3 for 1." },
          { in: "position = [2,2,2,3,3]", out: "2" },
          { in: "position = [1,1000000000]", out: "1" },
        ],
        ["1 <= position.length <= 40", "1 <= position[i] <= 1000000000"]),
      hints: [
        "Moving by 2 is free, so a chip can reach any position of the **same parity** at no cost.",
        "Gather every even chip onto one even square and every odd chip onto one odd square — still free.",
        "Then one group has to step across, costing 1 per chip, so the answer is the size of the smaller group.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "1" },
        { input: "[2,2,2,3,3]", expectedOutput: "2" },
        { input: "[1,1000000000]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const position = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.5 ? 10 : 1000000000);
        return { input: fmtIntArr(position), expectedOutput: String(ref(position)) };
      },
      solutions: {
        python: `def minCostToMoveChips(position) -> int:\n    even = sum(1 for p in position if p % 2 == 0)\n    return min(even, len(position) - even)`,
        javascript: `var minCostToMoveChips = function(position) {\n    let even = 0, odd = 0;\n    for (let i = 0; i < position.length; i++) {\n        if (position[i] % 2 === 0) even++;\n        else odd++;\n    }\n    return Math.min(even, odd);\n};`,
              typescript: `function minCostToMoveChips(position: number[]): number {\n    var even = 0, odd = 0;\n    for (var i = 0; i < position.length; i++) {\n        if (position[i] % 2 === 0) even++;\n        else odd++;\n    }\n    return Math.min(even, odd);\n}`,
              java: `public static int minCostToMoveChips(int[] position) {\n    int even = 0, odd = 0;\n    for (int p : position) {\n        if (p % 2 == 0) even++;\n        else odd++;\n    }\n    return Math.min(even, odd);\n}`,
              cpp: `int minCostToMoveChips(vector<int>& position) {\n    int even = 0, odd = 0;\n    for (int p : position) {\n        if (p % 2 == 0) even++;\n        else odd++;\n    }\n    return min(even, odd);\n}`,
              c: `int minCostToMoveChips(int* position, int positionSize) {\n    int even = 0, odd = 0;\n    for (int i = 0; i < positionSize; i++) {\n        if (position[i] % 2 == 0) even++;\n        else odd++;\n    }\n    return even < odd ? even : odd;\n}`,
              csharp: `public static int MinCostToMoveChips(int[] position)\n{\n    int even = 0, odd = 0;\n    foreach (int p in position)\n    {\n        if (p % 2 == 0) even++;\n        else odd++;\n    }\n    return Math.Min(even, odd);\n}`,
              go: `func minCostToMoveChips(position []int) int {\n	even, odd := 0, 0\n	for _, p := range position {\n		if p%2 == 0 {\n			even++\n		} else {\n			odd++\n		}\n	}\n	if even < odd {\n		return even\n	}\n	return odd\n}`,
              kotlin: `fun minCostToMoveChips(position: IntArray): Int {\n    var even = 0\n    var odd = 0\n    for (p in position) {\n        if (p % 2 == 0) even++ else odd++\n    }\n    return if (even < odd) even else odd\n}`,
              swift: `func minCostToMoveChips(_ position: [Int]) -> Int {\n    var even = 0\n    var odd = 0\n    for p in position {\n        if p % 2 == 0 { even += 1 } else { odd += 1 }\n    }\n    return min(even, odd)\n}`,
              rust: `fn minCostToMoveChips(position: Vec<i32>) -> i32 {\n    let mut even = 0;\n    let mut odd = 0;\n    for p in position.iter() {\n        if *p % 2 == 0 {\n            even += 1;\n        } else {\n            odd += 1;\n        }\n    }\n    if even < odd { even } else { odd }\n}`,
              php: `function minCostToMoveChips($position) {\n    $even = 0;\n    $odd = 0;\n    foreach ($position as $p) {\n        if ($p % 2 == 0) $even++;\n        else $odd++;\n    }\n    return min($even, $odd);\n}`,
              ruby: `def minCostToMoveChips(position)\n  even = position.count { |p| p % 2 == 0 }\n  [even, position.length - even].min\nend`,
      },
    };
  })(),

  // ── Largest Number ──────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const strs = nums.map((x) => String(x));
      strs.sort((a, b) => (b + a < a + b ? -1 : b + a > a + b ? 1 : 0));
      if (strs[0] === "0") return "0";
      return strs.join("");
    };
    return {
      slug: "largest-number",
      title: "Largest Number",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Greedy", "Sorting", "Amazon", "Microsoft", "Meta", "Adobe"],
      signature: { funcName: "largestNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "Given a list of non-negative integers `nums`, arrange them so that they form the **largest** possible number, and return it as a string.",
        [
          { in: "nums = [10,2]", out: "210" },
          { in: "nums = [3,30,34,5,9]", out: "9534330" },
          { in: "nums = [0,0]", out: "0", note: "All zeros collapse to a single 0, not 00." },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000000000"]),
      hints: [
        "Plain numeric or lexicographic sorting both fail: 3 must come before 30, but 30 before 34.",
        "Compare two numbers `a` and `b` by which concatenation is larger — `a+b` or `b+a` — and sort by that.",
        "Watch the all-zeros case: joining gives `\"000…\"`, which must be reported as `\"0\"`.",
      ],
      examples: [
        { input: "[10,2]", expectedOutput: "210" },
        { input: "[3,30,34,5,9]", expectedOutput: "9534330" },
        { input: "[0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const nums = Array.from({ length: n }, () => (rng() < 0.2 ? 0 : ri(rng, 0, rng() < 0.5 ? 99 : 1000000000)));
        return { input: fmtIntArr(nums), expectedOutput: ref(nums) };
      },
      solutions: {
        python: `import functools\n\ndef largestNumber(nums) -> str:\n    strs = [str(x) for x in nums]\n    strs.sort(key=functools.cmp_to_key(lambda a, b: (b + a > a + b) - (b + a < a + b)))\n    if strs[0] == "0":\n        return "0"\n    return "".join(strs)`,
        javascript: `var largestNumber = function(nums) {\n    const strs = nums.map(function(x) { return String(x); });\n    strs.sort(function(a, b) {\n        const ab = a + b;\n        const ba = b + a;\n        if (ba < ab) return -1;\n        if (ba > ab) return 1;\n        return 0;\n    });\n    if (strs[0] === "0") return "0";\n    return strs.join("");\n};`,
              typescript: `function largestNumber(nums: number[]): string {\n    var strs: string[] = [];\n    for (var i = 0; i < nums.length; i++) strs.push(String(nums[i]));\n    strs.sort(function (a, b) {\n        var ab = a + b;\n        var ba = b + a;\n        if (ba < ab) return -1;\n        if (ba > ab) return 1;\n        return 0;\n    });\n    if (strs[0] === "0") return "0";\n    return strs.join("");\n}`,
              java: `public static String largestNumber(int[] nums) {\n    String[] strs = new String[nums.length];\n    for (int i = 0; i < nums.length; i++) strs[i] = String.valueOf(nums[i]);\n    Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));\n    if (strs[0].equals("0")) return "0";\n    StringBuilder sb = new StringBuilder();\n    for (String x : strs) sb.append(x);\n    return sb.toString();\n}`,
              cpp: `string largestNumber(vector<int>& nums) {\n    vector<string> strs;\n    for (int x : nums) strs.push_back(to_string(x));\n    sort(strs.begin(), strs.end(), [](const string& a, const string& b) {\n        return a + b > b + a;\n    });\n    if (strs[0] == "0") return "0";\n    string out;\n    for (const string& x : strs) out += x;\n    return out;\n}`,
              c: `static int cmpLargestNum(const void* a, const void* b) {\n    const char* x = *(const char**) a;\n    const char* y = *(const char**) b;\n    char ab[32], ba[32];\n    strcpy(ab, x);\n    strcat(ab, y);\n    strcpy(ba, y);\n    strcat(ba, x);\n    return strcmp(ba, ab);\n}\n\nchar* largestNumber(int* nums, int numsSize) {\n    char** strs = (char**) malloc((numsSize > 0 ? numsSize : 1) * sizeof(char*));\n    for (int i = 0; i < numsSize; i++) {\n        strs[i] = (char*) malloc(16);\n        sprintf(strs[i], "%d", nums[i]);\n    }\n    qsort(strs, numsSize, sizeof(char*), cmpLargestNum);\n    char* out = (char*) malloc((size_t) numsSize * 16 + 2);\n    out[0] = '\\0';\n    if (strcmp(strs[0], "0") == 0) {\n        strcpy(out, "0");\n    } else {\n        for (int i = 0; i < numsSize; i++) strcat(out, strs[i]);\n    }\n    for (int i = 0; i < numsSize; i++) free(strs[i]);\n    free(strs);\n    return out;\n}`,
              csharp: `public static string LargestNumber(int[] nums)\n{\n    var strs = new List<string>();\n    foreach (int x in nums) strs.Add(x.ToString());\n    strs.Sort((a, b) => string.CompareOrdinal(b + a, a + b));\n    if (strs[0] == "0") return "0";\n    return string.Concat(strs);\n}`,
              go: `func largestNumber(nums []int) string {\n	strs := []string{}\n	for _, x := range nums {\n		strs = append(strs, strconv.Itoa(x))\n	}\n	sort.Slice(strs, func(a, b int) bool { return strs[a]+strs[b] > strs[b]+strs[a] })\n	if strs[0] == "0" {\n		return "0"\n	}\n	return strings.Join(strs, "")\n}`,
              kotlin: `fun largestNumber(nums: IntArray): String {\n    val strs = nums.map { it.toString() }.sortedWith(Comparator { a, b -> (b + a).compareTo(a + b) })\n    if (strs[0] == "0") return "0"\n    return strs.joinToString("")\n}`,
              swift: `func largestNumber(_ nums: [Int]) -> String {\n    let strs = nums.map { String($0) }.sorted { ($0 + $1) > ($1 + $0) }\n    if strs[0] == "0" { return "0" }\n    return strs.joined()\n}`,
              rust: `fn largestNumber(nums: Vec<i32>) -> String {\n    let mut strs: Vec<String> = nums.iter().map(|x| x.to_string()).collect();\n    strs.sort_by(|a, b| {\n        let ab = format!("{}{}", a, b);\n        let ba = format!("{}{}", b, a);\n        ba.cmp(&ab)\n    });\n    if strs[0] == "0" {\n        return String::from("0");\n    }\n    strs.join("")\n}`,
              php: `function largestNumber($nums) {\n    $strs = array();\n    foreach ($nums as $x) $strs[] = (string) $x;\n    usort($strs, function($a, $b) { return strcmp($b . $a, $a . $b); });\n    if ($strs[0] === "0") return "0";\n    return implode("", $strs);\n}`,
              ruby: `def largestNumber(nums)\n  strs = nums.map(&:to_s).sort { |a, b| (b + a) <=> (a + b) }\n  return "0" if strs[0] == "0"\n  strs.join\nend`,
      },
    };
  })(),

  // ── Maximum Number of Coins You Can Get ─────────────────────────
  (() => {
    const ref = (piles: number[]) => {
      const sorted = piles.slice().sort((a, b) => a - b);
      const rounds = sorted.length / 3;
      let total = 0;
      for (let i = 0; i < rounds; i++) total += sorted[sorted.length - 2 - 2 * i];
      return total;
    };
    return {
      slug: "maximum-number-of-coins-you-can-get",
      title: "Maximum Number of Coins You Can Get",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Sorting", "Game Theory", "Amazon", "Adobe"],
      signature: { funcName: "maxCoins", params: [{ name: "piles", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `3n` piles of coins. You, Alice and Bob repeat this until no piles remain:\n\n1. You choose **any three** piles.\n2. Alice takes the largest of the three, you take the next largest, and Bob takes the smallest.\n\nGiven the array `piles`, return the maximum number of coins **you** can end up with.",
        [
          { in: "piles = [2,4,1,2,7,8]", out: "9", note: "Take (8,7,1) — you get 7 — then (4,2,2) — you get 2." },
          { in: "piles = [2,4,5]", out: "4" },
          { in: "piles = [9,8,7,6,5,1,2,3,4]", out: "18" },
        ],
        ["3 <= piles.length <= 30", "piles.length is a multiple of 3.", "1 <= piles[i] <= 10000"]),
      hints: [
        "Sort the piles. Alice always takes the biggest of a triple, so pair each of the largest piles with the one just below it.",
        "Bob's pile should be as small as possible — sacrifice the very smallest piles to him.",
        "Working from the largest end, you take every **second** pile: index `n-2`, `n-4`, `n-6`, … for `n/3` rounds.",
      ],
      examples: [
        { input: "[2,4,1,2,7,8]", expectedOutput: "9" },
        { input: "[2,4,5]", expectedOutput: "4" },
        { input: "[9,8,7,6,5,1,2,3,4]", expectedOutput: "18" },
      ],
      gen: (rng: Rng) => {
        const piles = randArr(rng, 3 * ri(rng, 1, 10), 1, 10000);
        return { input: fmtIntArr(piles), expectedOutput: String(ref(piles)) };
      },
      solutions: {
        python: `def maxCoins(piles) -> int:\n    ordered = sorted(piles)\n    n = len(ordered)\n    return sum(ordered[n - 2 - 2 * i] for i in range(n // 3))`,
        javascript: `var maxCoins = function(piles) {\n    const sorted = piles.slice().sort(function(a, b) { return a - b; });\n    const rounds = sorted.length / 3;\n    let total = 0;\n    for (let i = 0; i < rounds; i++) {\n        total += sorted[sorted.length - 2 - 2 * i];\n    }\n    return total;\n};`,
              typescript: `function maxCoins(piles: number[]): number {\n    var sorted = piles.slice().sort(function (a, b) { return a - b; });\n    var rounds = sorted.length / 3;\n    var total = 0;\n    for (var i = 0; i < rounds; i++) total += sorted[sorted.length - 2 - 2 * i];\n    return total;\n}`,
              java: `public static int maxCoins(int[] piles) {\n    int[] s = piles.clone();\n    Arrays.sort(s);\n    int rounds = s.length / 3;\n    int total = 0;\n    for (int i = 0; i < rounds; i++) total += s[s.length - 2 - 2 * i];\n    return total;\n}`,
              cpp: `int maxCoins(vector<int>& piles) {\n    vector<int> s = piles;\n    sort(s.begin(), s.end());\n    int n = (int) s.size();\n    int rounds = n / 3;\n    int total = 0;\n    for (int i = 0; i < rounds; i++) total += s[n - 2 - 2 * i];\n    return total;\n}`,
              c: `static int cmpCoinsAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maxCoins(int* piles, int pilesSize) {\n    int* s = (int*) malloc((pilesSize > 0 ? pilesSize : 1) * sizeof(int));\n    for (int i = 0; i < pilesSize; i++) s[i] = piles[i];\n    qsort(s, pilesSize, sizeof(int), cmpCoinsAsc);\n    int rounds = pilesSize / 3;\n    int total = 0;\n    for (int i = 0; i < rounds; i++) total += s[pilesSize - 2 - 2 * i];\n    free(s);\n    return total;\n}`,
              csharp: `public static int MaxCoins(int[] piles)\n{\n    int[] s = (int[]) piles.Clone();\n    Array.Sort(s);\n    int rounds = s.Length / 3;\n    int total = 0;\n    for (int i = 0; i < rounds; i++) total += s[s.Length - 2 - 2 * i];\n    return total;\n}`,
              go: `func maxCoins(piles []int) int {\n	s := append([]int{}, piles...)\n	sort.Ints(s)\n	rounds := len(s) / 3\n	total := 0\n	for i := 0; i < rounds; i++ {\n		total += s[len(s)-2-2*i]\n	}\n	return total\n}`,
              kotlin: `fun maxCoins(piles: IntArray): Int {\n    val s = piles.sortedArray()\n    val rounds = s.size / 3\n    var total = 0\n    for (i in 0 until rounds) total += s[s.size - 2 - 2 * i]\n    return total\n}`,
              swift: `func maxCoins(_ piles: [Int]) -> Int {\n    let s = piles.sorted()\n    let rounds = s.count / 3\n    var total = 0\n    for i in 0..<rounds {\n        total += s[s.count - 2 - 2 * i]\n    }\n    return total\n}`,
              rust: `fn maxCoins(piles: Vec<i32>) -> i32 {\n    let mut s = piles.clone();\n    s.sort();\n    let n = s.len();\n    let rounds = n / 3;\n    let mut total = 0;\n    for i in 0..rounds {\n        total += s[n - 2 - 2 * i];\n    }\n    total\n}`,
              php: `function maxCoins($piles) {\n    $s = $piles;\n    sort($s);\n    $n = count($s);\n    $rounds = intdiv($n, 3);\n    $total = 0;\n    for ($i = 0; $i < $rounds; $i++) $total += $s[$n - 2 - 2 * $i];\n    return $total;\n}`,
              ruby: `def maxCoins(piles)\n  s = piles.sort\n  n = s.length\n  rounds = n / 3\n  total = 0\n  (0...rounds).each { |i| total += s[n - 2 - 2 * i] }\n  total\nend`,
      },
    };
  })(),

  // ── Sort Array By Parity II ─────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const evens: number[] = [], odds: number[] = [];
      for (let i = 0; i < nums.length; i++) (nums[i] % 2 === 0 ? evens : odds).push(nums[i]);
      const out: number[] = [];
      for (let i = 0; i < evens.length; i++) { out.push(evens[i]); out.push(odds[i]); }
      return out;
    };
    return {
      slug: "sort-array-by-parity-ii",
      title: "Sort Array By Parity II",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Meta"],
      signature: { funcName: "sortArrayByParityII", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums` of non-negative integers, half of which are even and half odd, rearrange it so that `nums[i]` is even whenever `i` is even and odd whenever `i` is odd.\n\nWithin each parity class, keep the elements in their **original relative order**.",
        [
          { in: "nums = [4,2,5,7]", out: "[4,5,2,7]" },
          { in: "nums = [2,3]", out: "[2,3]" },
          { in: "nums = [3,4]", out: "[4,3]" },
        ],
        ["2 <= nums.length <= 40", "nums.length is even.", "Half the elements are even and half are odd.", "0 <= nums[i] <= 1000"]),
      hints: [
        "Collect the evens and the odds into two lists, each keeping its original order.",
        "Then interleave: the k-th even goes to index `2k` and the k-th odd to index `2k + 1`.",
        "The classic in-place version walks two pointers over the even and odd slots and swaps mismatches — but that does not preserve order.",
      ],
      examples: [
        { input: "[4,2,5,7]", expectedOutput: "[4,5,2,7]" },
        { input: "[2,3]", expectedOutput: "[2,3]" },
        { input: "[3,4]", expectedOutput: "[4,3]" },
      ],
      gen: (rng: Rng) => {
        const half = ri(rng, 1, 20);
        const values: number[] = [];
        for (let i = 0; i < half; i++) values.push(2 * ri(rng, 0, 500));
        for (let i = 0; i < half; i++) values.push(2 * ri(rng, 0, 499) + 1);
        const nums = shuffle(rng, values);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def sortArrayByParityII(nums):\n    evens = [x for x in nums if x % 2 == 0]\n    odds = [x for x in nums if x % 2 != 0]\n    out = []\n    for e, o in zip(evens, odds):\n        out.append(e)\n        out.append(o)\n    return out`,
        javascript: `var sortArrayByParityII = function(nums) {\n    const evens = [], odds = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 === 0) evens.push(nums[i]);\n        else odds.push(nums[i]);\n    }\n    const out = [];\n    for (let i = 0; i < evens.length; i++) {\n        out.push(evens[i]);\n        out.push(odds[i]);\n    }\n    return out;\n};`,
              typescript: `function sortArrayByParityII(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var k = 0; k < nums.length; k++) out.push(0);\n    var e = 0, o = 1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 === 0) {\n            out[e] = nums[i];\n            e += 2;\n        } else {\n            out[o] = nums[i];\n            o += 2;\n        }\n    }\n    return out;\n}`,
              java: `public static int[] sortArrayByParityII(int[] nums) {\n    int[] out = new int[nums.length];\n    int e = 0, o = 1;\n    for (int x : nums) {\n        if (x % 2 == 0) {\n            out[e] = x;\n            e += 2;\n        } else {\n            out[o] = x;\n            o += 2;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<int> sortArrayByParityII(vector<int>& nums) {\n    vector<int> out(nums.size(), 0);\n    int e = 0, o = 1;\n    for (int x : nums) {\n        if (x % 2 == 0) {\n            out[e] = x;\n            e += 2;\n        } else {\n            out[o] = x;\n            o += 2;\n        }\n    }\n    return out;\n}`,
              c: `int* sortArrayByParityII(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    int e = 0, o = 1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] % 2 == 0) {\n            out[e] = nums[i];\n            e += 2;\n        } else {\n            out[o] = nums[i];\n            o += 2;\n        }\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] SortArrayByParityII(int[] nums)\n{\n    int[] out_ = new int[nums.Length];\n    int e = 0, o = 1;\n    foreach (int x in nums)\n    {\n        if (x % 2 == 0)\n        {\n            out_[e] = x;\n            e += 2;\n        }\n        else\n        {\n            out_[o] = x;\n            o += 2;\n        }\n    }\n    return out_;\n}`,
              go: `func sortArrayByParityII(nums []int) []int {\n	out := make([]int, len(nums))\n	e, o := 0, 1\n	for _, x := range nums {\n		if x%2 == 0 {\n			out[e] = x\n			e += 2\n		} else {\n			out[o] = x\n			o += 2\n		}\n	}\n	return out\n}`,
              kotlin: `fun sortArrayByParityII(nums: IntArray): IntArray {\n    val out = IntArray(nums.size)\n    var e = 0\n    var o = 1\n    for (x in nums) {\n        if (x % 2 == 0) {\n            out[e] = x\n            e += 2\n        } else {\n            out[o] = x\n            o += 2\n        }\n    }\n    return out\n}`,
              swift: `func sortArrayByParityII(_ nums: [Int]) -> [Int] {\n    var out = [Int](repeating: 0, count: nums.count)\n    var e = 0\n    var o = 1\n    for x in nums {\n        if x % 2 == 0 {\n            out[e] = x\n            e += 2\n        } else {\n            out[o] = x\n            o += 2\n        }\n    }\n    return out\n}`,
              rust: `fn sortArrayByParityII(nums: Vec<i32>) -> Vec<i32> {\n    let mut out = vec![0i32; nums.len()];\n    let mut e = 0usize;\n    let mut o = 1usize;\n    for x in nums.iter() {\n        if *x % 2 == 0 {\n            out[e] = *x;\n            e += 2;\n        } else {\n            out[o] = *x;\n            o += 2;\n        }\n    }\n    out\n}`,
              php: `function sortArrayByParityII($nums) {\n    $out = array_fill(0, count($nums), 0);\n    $e = 0;\n    $o = 1;\n    foreach ($nums as $x) {\n        if ($x % 2 == 0) {\n            $out[$e] = $x;\n            $e += 2;\n        } else {\n            $out[$o] = $x;\n            $o += 2;\n        }\n    }\n    return $out;\n}`,
              ruby: `def sortArrayByParityII(nums)\n  out = Array.new(nums.length, 0)\n  e = 0\n  o = 1\n  nums.each do |x|\n    if x.even?\n      out[e] = x\n      e += 2\n    else\n      out[o] = x\n      o += 2\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Rearrange Array Elements by Sign ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const pos: number[] = [], neg: number[] = [];
      for (let i = 0; i < nums.length; i++) (nums[i] > 0 ? pos : neg).push(nums[i]);
      const out: number[] = [];
      for (let i = 0; i < pos.length; i++) { out.push(pos[i]); out.push(neg[i]); }
      return out;
    };
    return {
      slug: "rearrange-array-elements-by-sign",
      title: "Rearrange Array Elements by Sign",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "rearrangeArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a 0-indexed integer array `nums` of **even** length, holding an equal number of positive and negative integers.\n\nRearrange it so that consecutive elements have opposite signs, the array **starts with a positive** integer, and the relative order within the positives and within the negatives is preserved.",
        [
          { in: "nums = [3,1,-2,-5,2,-4]", out: "[3,-2,1,-5,2,-4]" },
          { in: "nums = [-1,1]", out: "[1,-1]" },
          { in: "nums = [1,-1,2,-2]", out: "[1,-1,2,-2]" },
        ],
        ["2 <= nums.length <= 40", "nums.length is even.", "Equal counts of positive and negative values.", "-1000 <= nums[i] <= 1000, and nums[i] != 0"]),
      hints: [
        "Split into a list of positives and a list of negatives, each in original order.",
        "Then interleave them, positives at the even indices.",
        "Two cursors over the original array achieve the same in one pass, writing directly into the output.",
      ],
      examples: [
        { input: "[3,1,-2,-5,2,-4]", expectedOutput: "[3,-2,1,-5,2,-4]" },
        { input: "[-1,1]", expectedOutput: "[1,-1]" },
        { input: "[1,-1,2,-2]", expectedOutput: "[1,-1,2,-2]" },
      ],
      gen: (rng: Rng) => {
        const half = ri(rng, 1, 20);
        const values: number[] = [];
        for (let i = 0; i < half; i++) values.push(ri(rng, 1, 1000));
        for (let i = 0; i < half; i++) values.push(-ri(rng, 1, 1000));
        const nums = shuffle(rng, values);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def rearrangeArray(nums):\n    pos = [x for x in nums if x > 0]\n    neg = [x for x in nums if x < 0]\n    out = []\n    for p, n in zip(pos, neg):\n        out.append(p)\n        out.append(n)\n    return out`,
        javascript: `var rearrangeArray = function(nums) {\n    const pos = [], neg = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] > 0) pos.push(nums[i]);\n        else neg.push(nums[i]);\n    }\n    const out = [];\n    for (let i = 0; i < pos.length; i++) {\n        out.push(pos[i]);\n        out.push(neg[i]);\n    }\n    return out;\n};`,
              typescript: `function rearrangeArray(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var k = 0; k < nums.length; k++) out.push(0);\n    var p = 0, n = 1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] > 0) {\n            out[p] = nums[i];\n            p += 2;\n        } else {\n            out[n] = nums[i];\n            n += 2;\n        }\n    }\n    return out;\n}`,
              java: `public static int[] rearrangeArray(int[] nums) {\n    int[] out = new int[nums.length];\n    int p = 0, n = 1;\n    for (int x : nums) {\n        if (x > 0) {\n            out[p] = x;\n            p += 2;\n        } else {\n            out[n] = x;\n            n += 2;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<int> rearrangeArray(vector<int>& nums) {\n    vector<int> out(nums.size(), 0);\n    int p = 0, n = 1;\n    for (int x : nums) {\n        if (x > 0) {\n            out[p] = x;\n            p += 2;\n        } else {\n            out[n] = x;\n            n += 2;\n        }\n    }\n    return out;\n}`,
              c: `int* rearrangeArray(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    int p = 0, n = 1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > 0) {\n            out[p] = nums[i];\n            p += 2;\n        } else {\n            out[n] = nums[i];\n            n += 2;\n        }\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] RearrangeArray(int[] nums)\n{\n    int[] out_ = new int[nums.Length];\n    int p = 0, n = 1;\n    foreach (int x in nums)\n    {\n        if (x > 0)\n        {\n            out_[p] = x;\n            p += 2;\n        }\n        else\n        {\n            out_[n] = x;\n            n += 2;\n        }\n    }\n    return out_;\n}`,
              go: `func rearrangeArray(nums []int) []int {\n	out := make([]int, len(nums))\n	p, n := 0, 1\n	for _, x := range nums {\n		if x > 0 {\n			out[p] = x\n			p += 2\n		} else {\n			out[n] = x\n			n += 2\n		}\n	}\n	return out\n}`,
              kotlin: `fun rearrangeArray(nums: IntArray): IntArray {\n    val out = IntArray(nums.size)\n    var p = 0\n    var n = 1\n    for (x in nums) {\n        if (x > 0) {\n            out[p] = x\n            p += 2\n        } else {\n            out[n] = x\n            n += 2\n        }\n    }\n    return out\n}`,
              swift: `func rearrangeArray(_ nums: [Int]) -> [Int] {\n    var out = [Int](repeating: 0, count: nums.count)\n    var p = 0\n    var n = 1\n    for x in nums {\n        if x > 0 {\n            out[p] = x\n            p += 2\n        } else {\n            out[n] = x\n            n += 2\n        }\n    }\n    return out\n}`,
              rust: `fn rearrangeArray(nums: Vec<i32>) -> Vec<i32> {\n    let mut out = vec![0i32; nums.len()];\n    let mut p = 0usize;\n    let mut n = 1usize;\n    for x in nums.iter() {\n        if *x > 0 {\n            out[p] = *x;\n            p += 2;\n        } else {\n            out[n] = *x;\n            n += 2;\n        }\n    }\n    out\n}`,
              php: `function rearrangeArray($nums) {\n    $out = array_fill(0, count($nums), 0);\n    $p = 0;\n    $n = 1;\n    foreach ($nums as $x) {\n        if ($x > 0) {\n            $out[$p] = $x;\n            $p += 2;\n        } else {\n            $out[$n] = $x;\n            $n += 2;\n        }\n    }\n    return $out;\n}`,
              ruby: `def rearrangeArray(nums)\n  out = Array.new(nums.length, 0)\n  p = 0\n  n = 1\n  nums.each do |x|\n    if x > 0\n      out[p] = x\n      p += 2\n    else\n      out[n] = x\n      n += 2\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Largest Perimeter Triangle ──────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const sorted = nums.slice().sort((a, b) => b - a);
      for (let i = 0; i + 2 < sorted.length; i++) {
        if (sorted[i] < sorted[i + 1] + sorted[i + 2]) return sorted[i] + sorted[i + 1] + sorted[i + 2];
      }
      return 0;
    };
    return {
      slug: "largest-perimeter-triangle",
      title: "Largest Perimeter Triangle",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "largestPerimeter", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the largest perimeter of a triangle with **non-zero area** whose three side lengths are taken from `nums`. If no such triangle exists, return `0`.",
        [
          { in: "nums = [2,1,2]", out: "5" },
          { in: "nums = [1,2,1,10]", out: "0", note: "No three of these can form a triangle." },
          { in: "nums = [3,6,2,3]", out: "8" },
        ],
        ["3 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "Three lengths form a triangle exactly when the largest is **strictly less** than the sum of the other two.",
        "Sort descending; the first consecutive triple that satisfies the inequality is the best possible.",
        "Skipping past a failing triple is safe — any other triple with that same largest side is even smaller.",
      ],
      examples: [
        { input: "[2,1,2]", expectedOutput: "5" },
        { input: "[1,2,1,10]", expectedOutput: "0" },
        { input: "[3,6,2,3]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 3, 40), 1, rng() < 0.5 ? 20 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def largestPerimeter(nums) -> int:\n    ordered = sorted(nums, reverse=True)\n    for i in range(len(ordered) - 2):\n        if ordered[i] < ordered[i + 1] + ordered[i + 2]:\n            return ordered[i] + ordered[i + 1] + ordered[i + 2]\n    return 0`,
        javascript: `var largestPerimeter = function(nums) {\n    const sorted = nums.slice().sort(function(a, b) { return b - a; });\n    for (let i = 0; i + 2 < sorted.length; i++) {\n        if (sorted[i] < sorted[i + 1] + sorted[i + 2]) {\n            return sorted[i] + sorted[i + 1] + sorted[i + 2];\n        }\n    }\n    return 0;\n};`,
              typescript: `function largestPerimeter(nums: number[]): number {\n    var s = nums.slice().sort(function (a, b) { return b - a; });\n    for (var i = 0; i + 2 < s.length; i++) {\n        if (s[i] < s[i + 1] + s[i + 2]) return s[i] + s[i + 1] + s[i + 2];\n    }\n    return 0;\n}`,
              java: `public static int largestPerimeter(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    for (int i = s.length - 1; i >= 2; i--) {\n        if (s[i] < s[i - 1] + s[i - 2]) return s[i] + s[i - 1] + s[i - 2];\n    }\n    return 0;\n}`,
              cpp: `int largestPerimeter(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    for (int i = (int) s.size() - 1; i >= 2; i--) {\n        if (s[i] < s[i - 1] + s[i - 2]) return s[i] + s[i - 1] + s[i - 2];\n    }\n    return 0;\n}`,
              c: `static int cmpPerimAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint largestPerimeter(int* nums, int numsSize) {\n    int* s = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpPerimAsc);\n    int answer = 0;\n    for (int i = numsSize - 1; i >= 2; i--) {\n        if (s[i] < s[i - 1] + s[i - 2]) {\n            answer = s[i] + s[i - 1] + s[i - 2];\n            break;\n        }\n    }\n    free(s);\n    return answer;\n}`,
              csharp: `public static int LargestPerimeter(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    for (int i = s.Length - 1; i >= 2; i--)\n    {\n        if (s[i] < s[i - 1] + s[i - 2]) return s[i] + s[i - 1] + s[i - 2];\n    }\n    return 0;\n}`,
              go: `func largestPerimeter(nums []int) int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	for i := len(s) - 1; i >= 2; i-- {\n		if s[i] < s[i-1]+s[i-2] {\n			return s[i] + s[i-1] + s[i-2]\n		}\n	}\n	return 0\n}`,
              kotlin: `fun largestPerimeter(nums: IntArray): Int {\n    val s = nums.sortedArray()\n    for (i in s.size - 1 downTo 2) {\n        if (s[i] < s[i - 1] + s[i - 2]) return s[i] + s[i - 1] + s[i - 2]\n    }\n    return 0\n}`,
              swift: `func largestPerimeter(_ nums: [Int]) -> Int {\n    let s = nums.sorted()\n    var i = s.count - 1\n    while i >= 2 {\n        if s[i] < s[i - 1] + s[i - 2] { return s[i] + s[i - 1] + s[i - 2] }\n        i -= 1\n    }\n    return 0\n}`,
              rust: `fn largestPerimeter(nums: Vec<i32>) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut i = s.len();\n    while i >= 3 {\n        if s[i - 1] < s[i - 2] + s[i - 3] {\n            return s[i - 1] + s[i - 2] + s[i - 3];\n        }\n        i -= 1;\n    }\n    0\n}`,
              php: `function largestPerimeter($nums) {\n    $s = $nums;\n    sort($s);\n    for ($i = count($s) - 1; $i >= 2; $i--) {\n        if ($s[$i] < $s[$i - 1] + $s[$i - 2]) return $s[$i] + $s[$i - 1] + $s[$i - 2];\n    }\n    return 0;\n}`,
              ruby: `def largestPerimeter(nums)\n  s = nums.sort\n  i = s.length - 1\n  while i >= 2\n    return s[i] + s[i - 1] + s[i - 2] if s[i] < s[i - 1] + s[i - 2]\n    i -= 1\n  end\n  0\nend`,
      },
    };
  })(),

  // ── Valid Triangle Number ───────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      let count = 0;
      for (let k = sorted.length - 1; k >= 2; k--) {
        let i = 0, j = k - 1;
        while (i < j) {
          if (sorted[i] + sorted[j] > sorted[k]) { count += j - i; j--; }
          else i++;
        }
      }
      return count;
    };
    return {
      slug: "valid-triangle-number",
      title: "Valid Triangle Number",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Greedy", "Sorting", "Amazon", "Google", "Meta"],
      signature: { funcName: "triangleNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the number of index triples that can form a triangle with **non-zero area** using the values at those indices as side lengths.",
        [
          { in: "nums = [2,2,3,4]", out: "3", note: "The valid triples are (2,3,4), (2,3,4) using the other 2, and (2,2,3)." },
          { in: "nums = [4,2,3,4]", out: "4" },
          { in: "nums = [0,0,0]", out: "0" },
        ],
        ["3 <= nums.length <= 30", "0 <= nums[i] <= 1000"]),
      hints: [
        "Sort the array; then only the condition `a + b > c` for the largest side `c` needs checking.",
        "Fix the largest side and run two pointers over the prefix below it.",
        "When `nums[i] + nums[j] > nums[k]`, every index between `i` and `j` also works with `j` — add `j - i` at once.",
      ],
      examples: [
        { input: "[2,2,3,4]", expectedOutput: "3" },
        { input: "[4,2,3,4]", expectedOutput: "4" },
        { input: "[0,0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 3, 30), 0, rng() < 0.5 ? 15 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def triangleNumber(nums) -> int:\n    ordered = sorted(nums)\n    count = 0\n    for k in range(len(ordered) - 1, 1, -1):\n        i, j = 0, k - 1\n        while i < j:\n            if ordered[i] + ordered[j] > ordered[k]:\n                count += j - i\n                j -= 1\n            else:\n                i += 1\n    return count`,
        javascript: `var triangleNumber = function(nums) {\n    const sorted = nums.slice().sort(function(a, b) { return a - b; });\n    let count = 0;\n    for (let k = sorted.length - 1; k >= 2; k--) {\n        let i = 0, j = k - 1;\n        while (i < j) {\n            if (sorted[i] + sorted[j] > sorted[k]) {\n                count += j - i;\n                j--;\n            } else {\n                i++;\n            }\n        }\n    }\n    return count;\n};`,
              typescript: `function triangleNumber(nums: number[]): number {\n    var s = nums.slice().sort(function (a, b) { return a - b; });\n    var count = 0;\n    for (var k = s.length - 1; k >= 2; k--) {\n        var i = 0;\n        var j = k - 1;\n        while (i < j) {\n            if (s[i] + s[j] > s[k]) {\n                count += j - i;\n                j--;\n            } else {\n                i++;\n            }\n        }\n    }\n    return count;\n}`,
              java: `public static int triangleNumber(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int count = 0;\n    for (int k = s.length - 1; k >= 2; k--) {\n        int i = 0, j = k - 1;\n        while (i < j) {\n            if (s[i] + s[j] > s[k]) {\n                count += j - i;\n                j--;\n            } else {\n                i++;\n            }\n        }\n    }\n    return count;\n}`,
              cpp: `int triangleNumber(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    int count = 0;\n    for (int k = (int) s.size() - 1; k >= 2; k--) {\n        int i = 0, j = k - 1;\n        while (i < j) {\n            if (s[i] + s[j] > s[k]) {\n                count += j - i;\n                j--;\n            } else {\n                i++;\n            }\n        }\n    }\n    return count;\n}`,
              c: `static int cmpTriAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint triangleNumber(int* nums, int numsSize) {\n    int* s = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpTriAsc);\n    int count = 0;\n    for (int k = numsSize - 1; k >= 2; k--) {\n        int i = 0, j = k - 1;\n        while (i < j) {\n            if (s[i] + s[j] > s[k]) {\n                count += j - i;\n                j--;\n            } else {\n                i++;\n            }\n        }\n    }\n    free(s);\n    return count;\n}`,
              csharp: `public static int TriangleNumber(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    int count = 0;\n    for (int k = s.Length - 1; k >= 2; k--)\n    {\n        int i = 0, j = k - 1;\n        while (i < j)\n        {\n            if (s[i] + s[j] > s[k])\n            {\n                count += j - i;\n                j--;\n            }\n            else\n            {\n                i++;\n            }\n        }\n    }\n    return count;\n}`,
              go: `func triangleNumber(nums []int) int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	count := 0\n	for k := len(s) - 1; k >= 2; k-- {\n		i, j := 0, k-1\n		for i < j {\n			if s[i]+s[j] > s[k] {\n				count += j - i\n				j--\n			} else {\n				i++\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun triangleNumber(nums: IntArray): Int {\n    val s = nums.sortedArray()\n    var count = 0\n    for (k in s.size - 1 downTo 2) {\n        var i = 0\n        var j = k - 1\n        while (i < j) {\n            if (s[i] + s[j] > s[k]) {\n                count += j - i\n                j--\n            } else {\n                i++\n            }\n        }\n    }\n    return count\n}`,
              swift: `func triangleNumber(_ nums: [Int]) -> Int {\n    let s = nums.sorted()\n    var count = 0\n    var k = s.count - 1\n    while k >= 2 {\n        var i = 0\n        var j = k - 1\n        while i < j {\n            if s[i] + s[j] > s[k] {\n                count += j - i\n                j -= 1\n            } else {\n                i += 1\n            }\n        }\n        k -= 1\n    }\n    return count\n}`,
              rust: `fn triangleNumber(nums: Vec<i32>) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut count = 0;\n    let mut k = s.len();\n    while k >= 3 {\n        let top = k - 1;\n        let mut i = 0usize;\n        let mut j = top - 1;\n        while i < j {\n            if s[i] + s[j] > s[top] {\n                count += (j - i) as i32;\n                j -= 1;\n            } else {\n                i += 1;\n            }\n        }\n        k -= 1;\n    }\n    count\n}`,
              php: `function triangleNumber($nums) {\n    $s = $nums;\n    sort($s);\n    $count = 0;\n    for ($k = count($s) - 1; $k >= 2; $k--) {\n        $i = 0;\n        $j = $k - 1;\n        while ($i < $j) {\n            if ($s[$i] + $s[$j] > $s[$k]) {\n                $count += $j - $i;\n                $j--;\n            } else {\n                $i++;\n            }\n        }\n    }\n    return $count;\n}`,
              ruby: `def triangleNumber(nums)\n  s = nums.sort\n  count = 0\n  k = s.length - 1\n  while k >= 2\n    i = 0\n    j = k - 1\n    while i < j\n      if s[i] + s[j] > s[k]\n        count += j - i\n        j -= 1\n      else\n        i += 1\n      end\n    end\n    k -= 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum Swap ────────────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      const digits = String(num).split("");
      const lastIndex = new Array(10).fill(-1);
      for (let i = 0; i < digits.length; i++) lastIndex[Number(digits[i])] = i;
      for (let i = 0; i < digits.length; i++) {
        for (let d = 9; d > Number(digits[i]); d--) {
          if (lastIndex[d] > i) {
            const t = digits[i];
            digits[i] = digits[lastIndex[d]];
            digits[lastIndex[d]] = t;
            return parseInt(digits.join(""), 10);
          }
        }
      }
      return num;
    };
    return {
      slug: "maximum-swap",
      title: "Maximum Swap",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Google", "Meta", "Microsoft"],
      signature: { funcName: "maximumSwap", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer `num`. You may swap two of its digits **at most once**.\n\nReturn the maximum value you can obtain.",
        [
          { in: "num = 2736", out: "7236", note: "Swap the 2 and the 7." },
          { in: "num = 9973", out: "9973", note: "No swap improves it." },
          { in: "num = 1993", out: "9913" },
        ],
        ["0 <= num <= 100000000"]),
      hints: [
        "Scan from the most significant digit; the first place you can raise is where the swap belongs.",
        "For that position, bring in the **largest** digit that appears later.",
        "If that largest digit occurs several times later, take the **rightmost** occurrence — moving a digit from further right leaves more value behind.",
      ],
      examples: [
        { input: "2736", expectedOutput: "7236" },
        { input: "9973", expectedOutput: "9973" },
        { input: "1993", expectedOutput: "9913" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.25 ? ri(rng, 0, 99) : ri(rng, 0, 100000000);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def maximumSwap(num: int) -> int:\n    digits = list(str(num))\n    last = {int(d): i for i, d in enumerate(digits)}\n    for i, d in enumerate(digits):\n        for bigger in range(9, int(d), -1):\n            if last.get(bigger, -1) > i:\n                j = last[bigger]\n                digits[i], digits[j] = digits[j], digits[i]\n                return int("".join(digits))\n    return num`,
        javascript: `var maximumSwap = function(num) {\n    const digits = String(num).split("");\n    const lastIndex = new Array(10).fill(-1);\n    for (let i = 0; i < digits.length; i++) lastIndex[Number(digits[i])] = i;\n    for (let i = 0; i < digits.length; i++) {\n        for (let d = 9; d > Number(digits[i]); d--) {\n            if (lastIndex[d] > i) {\n                const j = lastIndex[d];\n                const t = digits[i];\n                digits[i] = digits[j];\n                digits[j] = t;\n                return parseInt(digits.join(""), 10);\n            }\n        }\n    }\n    return num;\n};`,
              typescript: `function maximumSwap(num: number): number {\n    var digits = String(num).split("");\n    var lastIndex: number[] = [];\n    for (var i = 0; i < 10; i++) lastIndex.push(-1);\n    for (var j = 0; j < digits.length; j++) lastIndex[Number(digits[j])] = j;\n    for (var k = 0; k < digits.length; k++) {\n        for (var d = 9; d > Number(digits[k]); d--) {\n            if (lastIndex[d] > k) {\n                var idx = lastIndex[d];\n                var t = digits[k];\n                digits[k] = digits[idx];\n                digits[idx] = t;\n                return parseInt(digits.join(""), 10);\n            }\n        }\n    }\n    return num;\n}`,
              java: `public static int maximumSwap(int num) {\n    char[] digits = String.valueOf(num).toCharArray();\n    int[] lastIndex = new int[10];\n    for (int i = 0; i < 10; i++) lastIndex[i] = -1;\n    for (int i = 0; i < digits.length; i++) lastIndex[digits[i] - '0'] = i;\n    for (int i = 0; i < digits.length; i++) {\n        for (int d = 9; d > digits[i] - '0'; d--) {\n            if (lastIndex[d] > i) {\n                int j = lastIndex[d];\n                char t = digits[i];\n                digits[i] = digits[j];\n                digits[j] = t;\n                return Integer.parseInt(new String(digits));\n            }\n        }\n    }\n    return num;\n}`,
              cpp: `int maximumSwap(int num) {\n    string digits = to_string(num);\n    vector<int> lastIndex(10, -1);\n    for (int i = 0; i < (int) digits.size(); i++) lastIndex[digits[i] - '0'] = i;\n    for (int i = 0; i < (int) digits.size(); i++) {\n        for (int d = 9; d > digits[i] - '0'; d--) {\n            if (lastIndex[d] > i) {\n                int j = lastIndex[d];\n                char t = digits[i];\n                digits[i] = digits[j];\n                digits[j] = t;\n                return stoi(digits);\n            }\n        }\n    }\n    return num;\n}`,
              c: `int maximumSwap(int num) {\n    char digits[16];\n    sprintf(digits, "%d", num);\n    int n = (int) strlen(digits);\n    int lastIndex[10];\n    for (int i = 0; i < 10; i++) lastIndex[i] = -1;\n    for (int i = 0; i < n; i++) lastIndex[digits[i] - '0'] = i;\n    for (int i = 0; i < n; i++) {\n        for (int d = 9; d > digits[i] - '0'; d--) {\n            if (lastIndex[d] > i) {\n                int j = lastIndex[d];\n                char t = digits[i];\n                digits[i] = digits[j];\n                digits[j] = t;\n                return atoi(digits);\n            }\n        }\n    }\n    return num;\n}`,
              csharp: `public static int MaximumSwap(int num)\n{\n    char[] digits = num.ToString().ToCharArray();\n    int[] lastIndex = new int[10];\n    for (int i = 0; i < 10; i++) lastIndex[i] = -1;\n    for (int i = 0; i < digits.Length; i++) lastIndex[digits[i] - '0'] = i;\n    for (int i = 0; i < digits.Length; i++)\n    {\n        for (int d = 9; d > digits[i] - '0'; d--)\n        {\n            if (lastIndex[d] > i)\n            {\n                int j = lastIndex[d];\n                char t = digits[i];\n                digits[i] = digits[j];\n                digits[j] = t;\n                return int.Parse(new string(digits));\n            }\n        }\n    }\n    return num;\n}`,
              go: `func maximumSwap(num int) int {\n	digits := []byte(strconv.Itoa(num))\n	lastIndex := make([]int, 10)\n	for i := range lastIndex {\n		lastIndex[i] = -1\n	}\n	for i := 0; i < len(digits); i++ {\n		lastIndex[digits[i]-'0'] = i\n	}\n	for i := 0; i < len(digits); i++ {\n		for d := 9; d > int(digits[i]-'0'); d-- {\n			if lastIndex[d] > i {\n				j := lastIndex[d]\n				digits[i], digits[j] = digits[j], digits[i]\n				out, _ := strconv.Atoi(string(digits))\n				return out\n			}\n		}\n	}\n	return num\n}`,
              kotlin: `fun maximumSwap(num: Int): Int {\n    val digits = num.toString().toCharArray()\n    val lastIndex = IntArray(10)\n    for (i in 0 until 10) lastIndex[i] = -1\n    for (i in digits.indices) lastIndex[digits[i] - '0'] = i\n    for (i in digits.indices) {\n        var d = 9\n        while (d > digits[i] - '0') {\n            if (lastIndex[d] > i) {\n                val j = lastIndex[d]\n                val t = digits[i]\n                digits[i] = digits[j]\n                digits[j] = t\n                return String(digits).toInt()\n            }\n            d--\n        }\n    }\n    return num\n}`,
              swift: `func maximumSwap(_ num: Int) -> Int {\n    var digits = Array(String(num).unicodeScalars).map { Int($0.value) - 48 }\n    var lastIndex = [Int](repeating: -1, count: 10)\n    for i in 0..<digits.count {\n        lastIndex[digits[i]] = i\n    }\n    for i in 0..<digits.count {\n        var d = 9\n        while d > digits[i] {\n            if lastIndex[d] > i {\n                let j = lastIndex[d]\n                let t = digits[i]\n                digits[i] = digits[j]\n                digits[j] = t\n                var value = 0\n                for x in digits { value = value * 10 + x }\n                return value\n            }\n            d -= 1\n        }\n    }\n    return num\n}`,
              rust: `fn maximumSwap(num: i32) -> i32 {\n    let mut digits: Vec<i32> = num.to_string().bytes().map(|b| (b - b'0') as i32).collect();\n    let mut last_index = vec![-1i32; 10];\n    for i in 0..digits.len() {\n        last_index[digits[i] as usize] = i as i32;\n    }\n    for i in 0..digits.len() {\n        let cur = digits[i];\n        let mut d = 9i32;\n        while d > cur {\n            if last_index[d as usize] > i as i32 {\n                let j = last_index[d as usize] as usize;\n                digits.swap(i, j);\n                let mut value = 0i32;\n                for x in digits.iter() {\n                    value = value * 10 + *x;\n                }\n                return value;\n            }\n            d -= 1;\n        }\n    }\n    num\n}`,
              php: `function maximumSwap($num) {\n    $digits = str_split((string) $num);\n    $n = count($digits);\n    $lastIndex = array_fill(0, 10, -1);\n    for ($i = 0; $i < $n; $i++) $lastIndex[(int) $digits[$i]] = $i;\n    for ($i = 0; $i < $n; $i++) {\n        for ($d = 9; $d > (int) $digits[$i]; $d--) {\n            if ($lastIndex[$d] > $i) {\n                $j = $lastIndex[$d];\n                $t = $digits[$i];\n                $digits[$i] = $digits[$j];\n                $digits[$j] = $t;\n                return (int) implode("", $digits);\n            }\n        }\n    }\n    return $num;\n}`,
              ruby: `def maximumSwap(num)\n  digits = num.to_s.chars\n  last_index = Array.new(10, -1)\n  digits.each_with_index { |d, i| last_index[d.to_i] = i }\n  digits.each_with_index do |d, i|\n    9.downto(d.to_i + 1) do |v|\n      if last_index[v] > i\n        j = last_index[v]\n        digits[i], digits[j] = digits[j], digits[i]\n        return digits.join.to_i\n      end\n    end\n  end\n  num\nend`,
      },
    };
  })(),

  // ── Monotone Increasing Digits ──────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const digits = String(n).split("").map(Number);
      let mark = digits.length;
      for (let i = digits.length - 1; i > 0; i--) {
        if (digits[i - 1] > digits[i]) {
          digits[i - 1]--;
          mark = i;
        }
      }
      for (let i = mark; i < digits.length; i++) digits[i] = 9;
      return parseInt(digits.join(""), 10);
    };
    return {
      slug: "monotone-increasing-digits",
      title: "Monotone Increasing Digits",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Google"],
      signature: { funcName: "monotoneIncreasingDigits", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An integer has **monotone increasing digits** if each digit is at least as large as the one before it.\n\nGiven an integer `n`, return the largest number less than or equal to `n` with monotone increasing digits.",
        [
          { in: "n = 10", out: "9" },
          { in: "n = 1234", out: "1234", note: "It already qualifies." },
          { in: "n = 332", out: "299" },
        ],
        ["0 <= n <= 100000000"]),
      hints: [
        "Walk the digits from the right. Wherever a digit is smaller than the one before it, that earlier digit must come down by one.",
        "Everything after the last such break can then be raised to 9.",
        "Do the scan right to left in one pass so cascading breaks (like 332 → 329 → 299) resolve correctly.",
      ],
      examples: [
        { input: "10", expectedOutput: "9" },
        { input: "1234", expectedOutput: "1234" },
        { input: "332", expectedOutput: "299" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.25 ? ri(rng, 0, 99) : ri(rng, 0, 100000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def monotoneIncreasingDigits(n: int) -> int:\n    digits = [int(c) for c in str(n)]\n    mark = len(digits)\n    for i in range(len(digits) - 1, 0, -1):\n        if digits[i - 1] > digits[i]:\n            digits[i - 1] -= 1\n            mark = i\n    for i in range(mark, len(digits)):\n        digits[i] = 9\n    return int("".join(str(d) for d in digits))`,
        javascript: `var monotoneIncreasingDigits = function(n) {\n    const digits = String(n).split("").map(Number);\n    let mark = digits.length;\n    for (let i = digits.length - 1; i > 0; i--) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (let i = mark; i < digits.length; i++) digits[i] = 9;\n    return parseInt(digits.join(""), 10);\n};`,
              typescript: `function monotoneIncreasingDigits(n: number): number {\n    var digits = String(n).split("").map(Number);\n    var mark = digits.length;\n    for (var i = digits.length - 1; i > 0; i--) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (var j = mark; j < digits.length; j++) digits[j] = 9;\n    var value = 0;\n    for (var k = 0; k < digits.length; k++) value = value * 10 + digits[k];\n    return value;\n}`,
              java: `public static int monotoneIncreasingDigits(int n) {\n    char[] digits = String.valueOf(n).toCharArray();\n    int mark = digits.length;\n    for (int i = digits.length - 1; i > 0; i--) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (int i = mark; i < digits.length; i++) digits[i] = '9';\n    return Integer.parseInt(new String(digits));\n}`,
              cpp: `int monotoneIncreasingDigits(int n) {\n    string digits = to_string(n);\n    int mark = (int) digits.size();\n    for (int i = (int) digits.size() - 1; i > 0; i--) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (int i = mark; i < (int) digits.size(); i++) digits[i] = '9';\n    return stoi(digits);\n}`,
              c: `int monotoneIncreasingDigits(int n) {\n    char digits[16];\n    sprintf(digits, "%d", n);\n    int len = (int) strlen(digits);\n    int mark = len;\n    for (int i = len - 1; i > 0; i--) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (int i = mark; i < len; i++) digits[i] = '9';\n    return atoi(digits);\n}`,
              csharp: `public static int MonotoneIncreasingDigits(int n)\n{\n    char[] digits = n.ToString().ToCharArray();\n    int mark = digits.Length;\n    for (int i = digits.Length - 1; i > 0; i--)\n    {\n        if (digits[i - 1] > digits[i])\n        {\n            digits[i - 1]--;\n            mark = i;\n        }\n    }\n    for (int i = mark; i < digits.Length; i++) digits[i] = '9';\n    return int.Parse(new string(digits));\n}`,
              go: `func monotoneIncreasingDigits(n int) int {\n	digits := []byte(strconv.Itoa(n))\n	mark := len(digits)\n	for i := len(digits) - 1; i > 0; i-- {\n		if digits[i-1] > digits[i] {\n			digits[i-1]--\n			mark = i\n		}\n	}\n	for i := mark; i < len(digits); i++ {\n		digits[i] = '9'\n	}\n	out, _ := strconv.Atoi(string(digits))\n	return out\n}`,
              kotlin: `fun monotoneIncreasingDigits(n: Int): Int {\n    val digits = n.toString().toCharArray()\n    var mark = digits.size\n    for (i in digits.size - 1 downTo 1) {\n        if (digits[i - 1] > digits[i]) {\n            digits[i - 1] = digits[i - 1] - 1\n            mark = i\n        }\n    }\n    for (i in mark until digits.size) digits[i] = '9'\n    return String(digits).toInt()\n}`,
              swift: `func monotoneIncreasingDigits(_ n: Int) -> Int {\n    var digits = Array(String(n).unicodeScalars).map { Int($0.value) - 48 }\n    var mark = digits.count\n    var i = digits.count - 1\n    while i > 0 {\n        if digits[i - 1] > digits[i] {\n            digits[i - 1] -= 1\n            mark = i\n        }\n        i -= 1\n    }\n    for j in mark..<max(mark, digits.count) where j < digits.count {\n        digits[j] = 9\n    }\n    var value = 0\n    for x in digits { value = value * 10 + x }\n    return value\n}`,
              rust: `fn monotoneIncreasingDigits(n: i32) -> i32 {\n    let mut digits: Vec<i32> = n.to_string().bytes().map(|b| (b - b'0') as i32).collect();\n    let mut mark = digits.len();\n    let mut i = digits.len();\n    while i > 1 {\n        if digits[i - 2] > digits[i - 1] {\n            digits[i - 2] -= 1;\n            mark = i - 1;\n        }\n        i -= 1;\n    }\n    for j in mark..digits.len() {\n        digits[j] = 9;\n    }\n    let mut value = 0i32;\n    for x in digits.iter() {\n        value = value * 10 + *x;\n    }\n    value\n}`,
              php: `function monotoneIncreasingDigits($n) {\n    $digits = array_map('intval', str_split((string) $n));\n    $len = count($digits);\n    $mark = $len;\n    for ($i = $len - 1; $i > 0; $i--) {\n        if ($digits[$i - 1] > $digits[$i]) {\n            $digits[$i - 1]--;\n            $mark = $i;\n        }\n    }\n    for ($i = $mark; $i < $len; $i++) $digits[$i] = 9;\n    $value = 0;\n    foreach ($digits as $d) $value = $value * 10 + $d;\n    return $value;\n}`,
              ruby: `def monotoneIncreasingDigits(n)\n  digits = n.to_s.chars.map(&:to_i)\n  mark = digits.length\n  (digits.length - 1).downto(1) do |i|\n    if digits[i - 1] > digits[i]\n      digits[i - 1] -= 1\n      mark = i\n    end\n  end\n  (mark...digits.length).each { |i| digits[i] = 9 }\n  digits.inject(0) { |acc, d| acc * 10 + d }\nend`,
      },
    };
  })(),

  // ── Remove Duplicate Letters ────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const lastIndex = new Map<string, number>();
      for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i);
      const stack: string[] = [];
      const inStack = new Set<string>();
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inStack.has(c)) continue;
        while (stack.length > 0 && stack[stack.length - 1] > c && lastIndex.get(stack[stack.length - 1])! > i) {
          inStack.delete(stack.pop()!);
        }
        stack.push(c);
        inStack.add(c);
      }
      return stack.join("");
    };
    return {
      slug: "remove-duplicate-letters",
      title: "Remove Duplicate Letters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Monotonic Stack", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "removeDuplicateLetters", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, remove duplicate letters so that every letter appears exactly **once**, and among all such results return the **lexicographically smallest** one.",
        [
          { in: 's = "bcabc"', out: "abc" },
          { in: 's = "cbacdcbc"', out: "acdb" },
          { in: 's = "abc"', out: "abc" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters."]),
      hints: [
        "Build the answer on a stack that you keep as small as possible, lexicographically.",
        "Before pushing a character, pop any larger character on top — but only if that character occurs **again later**, so dropping it is safe.",
        "Skip characters already on the stack; each letter must appear once.",
      ],
      examples: [
        { input: '"bcabc"', expectedOutput: "abc" },
        { input: '"cbacdcbc"', expectedOutput: "acdb" },
        { input: '"abc"', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.6 ? "abcd" : "abcdefgh");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def removeDuplicateLetters(s: str) -> str:\n    last = {ch: i for i, ch in enumerate(s)}\n    stack = []\n    in_stack = set()\n    for i, ch in enumerate(s):\n        if ch in in_stack:\n            continue\n        while stack and stack[-1] > ch and last[stack[-1]] > i:\n            in_stack.discard(stack.pop())\n        stack.append(ch)\n        in_stack.add(ch)\n    return "".join(stack)`,
        javascript: `var removeDuplicateLetters = function(s) {\n    const lastIndex = new Map();\n    for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i);\n    const stack = [];\n    const inStack = new Set();\n    for (let i = 0; i < s.length; i++) {\n        const c = s[i];\n        if (inStack.has(c)) continue;\n        while (stack.length > 0 && stack[stack.length - 1] > c && lastIndex.get(stack[stack.length - 1]) > i) {\n            inStack.delete(stack.pop());\n        }\n        stack.push(c);\n        inStack.add(c);\n    }\n    return stack.join("");\n};`,
              typescript: `function removeDuplicateLetters(s: string): string {\n    var last: number[] = [];\n    for (var i = 0; i < 26; i++) last.push(-1);\n    for (var j = 0; j < s.length; j++) last[s.charCodeAt(j) - 97] = j;\n    var stack: string[] = [];\n    var inStack: boolean[] = [];\n    for (var k = 0; k < 26; k++) inStack.push(false);\n    for (var i2 = 0; i2 < s.length; i2++) {\n        var c = s.charCodeAt(i2) - 97;\n        if (inStack[c]) continue;\n        while (stack.length > 0) {\n            var topCode = stack[stack.length - 1].charCodeAt(0) - 97;\n            if (topCode > c && last[topCode] > i2) {\n                inStack[topCode] = false;\n                stack.pop();\n            } else {\n                break;\n            }\n        }\n        stack.push(s.charAt(i2));\n        inStack[c] = true;\n    }\n    return stack.join("");\n}`,
              java: `public static String removeDuplicateLetters(String s) {\n    int[] last = new int[26];\n    for (int i = 0; i < 26; i++) last[i] = -1;\n    for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;\n    StringBuilder stack = new StringBuilder();\n    boolean[] inStack = new boolean[26];\n    for (int i = 0; i < s.length(); i++) {\n        int c = s.charAt(i) - 'a';\n        if (inStack[c]) continue;\n        while (stack.length() > 0) {\n            int top = stack.charAt(stack.length() - 1) - 'a';\n            if (top > c && last[top] > i) {\n                inStack[top] = false;\n                stack.deleteCharAt(stack.length() - 1);\n            } else {\n                break;\n            }\n        }\n        stack.append(s.charAt(i));\n        inStack[c] = true;\n    }\n    return stack.toString();\n}`,
              cpp: `string removeDuplicateLetters(string s) {\n    vector<int> last(26, -1);\n    for (int i = 0; i < (int) s.size(); i++) last[s[i] - 'a'] = i;\n    string stk;\n    vector<bool> inStack(26, false);\n    for (int i = 0; i < (int) s.size(); i++) {\n        int c = s[i] - 'a';\n        if (inStack[c]) continue;\n        while (!stk.empty()) {\n            int top = stk.back() - 'a';\n            if (top > c && last[top] > i) {\n                inStack[top] = false;\n                stk.pop_back();\n            } else {\n                break;\n            }\n        }\n        stk.push_back(s[i]);\n        inStack[c] = true;\n    }\n    return stk;\n}`,
              c: `char* removeDuplicateLetters(const char* s) {\n    int n = (int) strlen(s);\n    int last[26];\n    for (int i = 0; i < 26; i++) last[i] = -1;\n    for (int i = 0; i < n; i++) last[s[i] - 'a'] = i;\n    char* stack = (char*) malloc((size_t) n + 2);\n    int top = 0;\n    int inStack[26];\n    for (int i = 0; i < 26; i++) inStack[i] = 0;\n    for (int i = 0; i < n; i++) {\n        int c = s[i] - 'a';\n        if (inStack[c]) continue;\n        while (top > 0) {\n            int tc = stack[top - 1] - 'a';\n            if (tc > c && last[tc] > i) {\n                inStack[tc] = 0;\n                top--;\n            } else {\n                break;\n            }\n        }\n        stack[top++] = s[i];\n        inStack[c] = 1;\n    }\n    stack[top] = '\\0';\n    return stack;\n}`,
              csharp: `public static string RemoveDuplicateLetters(string s)\n{\n    int[] last = new int[26];\n    for (int i = 0; i < 26; i++) last[i] = -1;\n    for (int i = 0; i < s.Length; i++) last[s[i] - 'a'] = i;\n    var stack = new List<char>();\n    bool[] inStack = new bool[26];\n    for (int i = 0; i < s.Length; i++)\n    {\n        int c = s[i] - 'a';\n        if (inStack[c]) continue;\n        while (stack.Count > 0)\n        {\n            int top = stack[stack.Count - 1] - 'a';\n            if (top > c && last[top] > i)\n            {\n                inStack[top] = false;\n                stack.RemoveAt(stack.Count - 1);\n            }\n            else\n            {\n                break;\n            }\n        }\n        stack.Add(s[i]);\n        inStack[c] = true;\n    }\n    return new string(stack.ToArray());\n}`,
              go: `func removeDuplicateLetters(s string) string {\n	last := make([]int, 26)\n	for i := range last {\n		last[i] = -1\n	}\n	for i := 0; i < len(s); i++ {\n		last[s[i]-'a'] = i\n	}\n	stack := []byte{}\n	inStack := make([]bool, 26)\n	for i := 0; i < len(s); i++ {\n		c := int(s[i] - 'a')\n		if inStack[c] {\n			continue\n		}\n		for len(stack) > 0 {\n			top := int(stack[len(stack)-1] - 'a')\n			if top > c && last[top] > i {\n				inStack[top] = false\n				stack = stack[:len(stack)-1]\n			} else {\n				break\n			}\n		}\n		stack = append(stack, s[i])\n		inStack[c] = true\n	}\n	return string(stack)\n}`,
              kotlin: `fun removeDuplicateLetters(s: String): String {\n    val last = IntArray(26)\n    for (i in 0 until 26) last[i] = -1\n    for (i in s.indices) last[s[i] - 'a'] = i\n    val stack = StringBuilder()\n    val inStack = BooleanArray(26)\n    for (i in s.indices) {\n        val c = s[i] - 'a'\n        if (inStack[c]) continue\n        while (stack.isNotEmpty()) {\n            val top = stack[stack.length - 1] - 'a'\n            if (top > c && last[top] > i) {\n                inStack[top] = false\n                stack.deleteCharAt(stack.length - 1)\n            } else {\n                break\n            }\n        }\n        stack.append(s[i])\n        inStack[c] = true\n    }\n    return stack.toString()\n}`,
              swift: `func removeDuplicateLetters(_ s: String) -> String {\n    let chars = Array(s.unicodeScalars).map { Int($0.value) - 97 }\n    var last = [Int](repeating: -1, count: 26)\n    for i in 0..<chars.count { last[chars[i]] = i }\n    var stack: [Int] = []\n    var inStack = [Bool](repeating: false, count: 26)\n    for i in 0..<chars.count {\n        let c = chars[i]\n        if inStack[c] { continue }\n        while let top = stack.last {\n            if top > c && last[top] > i {\n                inStack[top] = false\n                stack.removeLast()\n            } else {\n                break\n            }\n        }\n        stack.append(c)\n        inStack[c] = true\n    }\n    var out = ""\n    for c in stack {\n        out.append(Character(UnicodeScalar(UInt8(c + 97))))\n    }\n    return out\n}`,
              rust: `fn removeDuplicateLetters(s: String) -> String {\n    let chars: Vec<usize> = s.bytes().map(|b| (b - b'a') as usize).collect();\n    let mut last = vec![-1i32; 26];\n    for i in 0..chars.len() {\n        last[chars[i]] = i as i32;\n    }\n    let mut stack: Vec<usize> = Vec::new();\n    let mut in_stack = vec![false; 26];\n    for i in 0..chars.len() {\n        let c = chars[i];\n        if in_stack[c] {\n            continue;\n        }\n        while let Some(&top) = stack.last() {\n            if top > c && last[top] > i as i32 {\n                in_stack[top] = false;\n                stack.pop();\n            } else {\n                break;\n            }\n        }\n        stack.push(c);\n        in_stack[c] = true;\n    }\n    stack.iter().map(|c| (*c as u8 + b'a') as char).collect()\n}`,
              php: `function removeDuplicateLetters($s) {\n    $n = strlen($s);\n    $last = array_fill(0, 26, -1);\n    for ($i = 0; $i < $n; $i++) $last[ord($s[$i]) - 97] = $i;\n    $stack = array();\n    $inStack = array_fill(0, 26, false);\n    for ($i = 0; $i < $n; $i++) {\n        $c = ord($s[$i]) - 97;\n        if ($inStack[$c]) continue;\n        while (count($stack) > 0) {\n            $top = $stack[count($stack) - 1];\n            if ($top > $c && $last[$top] > $i) {\n                $inStack[$top] = false;\n                array_pop($stack);\n            } else {\n                break;\n            }\n        }\n        $stack[] = $c;\n        $inStack[$c] = true;\n    }\n    $out = "";\n    foreach ($stack as $c) $out .= chr($c + 97);\n    return $out;\n}`,
              ruby: `def removeDuplicateLetters(s)\n  last = Array.new(26, -1)\n  s.each_byte.with_index { |b, i| last[b - 97] = i }\n  stack = []\n  in_stack = Array.new(26, false)\n  s.each_byte.with_index do |b, i|\n    c = b - 97\n    next if in_stack[c]\n    while !stack.empty?\n      top = stack[-1]\n      if top > c && last[top] > i\n        in_stack[top] = false\n        stack.pop\n      else\n        break\n      end\n    end\n    stack.push(c)\n    in_stack[c] = true\n  end\n  stack.map { |c| (c + 97).chr }.join\nend`,
      },
    };
  })(),

  // ── Smallest Range I ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let lo = nums[0], hi = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] < lo) lo = nums[i];
        if (nums[i] > hi) hi = nums[i];
      }
      const span = hi - lo - 2 * k;
      return span > 0 ? span : 0;
    };
    return {
      slug: "smallest-range-i",
      title: "Smallest Range I",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Adobe"],
      signature: { funcName: "smallestRangeI", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `k`. For **each** index you may change `nums[i]` to any value in the range `[nums[i] - k, nums[i] + k]`, once.\n\nReturn the minimum possible difference between the largest and smallest value of the resulting array.",
        [
          { in: "nums = [1], k = 0", out: "0" },
          { in: "nums = [0,10], k = 2", out: "6", note: "Turn [0,10] into [2,8]." },
          { in: "nums = [1,3,6], k = 3", out: "0" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 10000", "0 <= k <= 10000"]),
      hints: [
        "Only the current minimum and maximum matter — everything else can be moved inside whatever gap they leave.",
        "Raise the minimum by `k` and lower the maximum by `k`.",
        "If they cross, the whole array can be made equal, so the answer is 0 rather than a negative number.",
      ],
      examples: [
        { input: "[1]\n0", expectedOutput: "0" },
        { input: "[0,10]\n2", expectedOutput: "6" },
        { input: "[1,3,6]\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, 10000);
        const k = ri(rng, 0, rng() < 0.5 ? 100 : 10000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `def smallestRangeI(nums, k: int) -> int:\n    return max(0, max(nums) - min(nums) - 2 * k)`,
        javascript: `var smallestRangeI = function(nums, k) {\n    let lo = nums[0], hi = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    const span = hi - lo - 2 * k;\n    return span > 0 ? span : 0;\n};`,
              typescript: `function smallestRangeI(nums: number[], k: number): number {\n    var lo = nums[0];\n    var hi = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    var span = hi - lo - 2 * k;\n    return span > 0 ? span : 0;\n}`,
              java: `public static int smallestRangeI(int[] nums, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        lo = Math.min(lo, x);\n        hi = Math.max(hi, x);\n    }\n    return Math.max(0, hi - lo - 2 * k);\n}`,
              cpp: `int smallestRangeI(vector<int>& nums, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        lo = min(lo, x);\n        hi = max(hi, x);\n    }\n    return max(0, hi - lo - 2 * k);\n}`,
              c: `int smallestRangeI(int* nums, int numsSize, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    int span = hi - lo - 2 * k;\n    return span > 0 ? span : 0;\n}`,
              csharp: `public static int SmallestRangeI(int[] nums, int k)\n{\n    int lo = nums[0], hi = nums[0];\n    foreach (int x in nums)\n    {\n        lo = Math.Min(lo, x);\n        hi = Math.Max(hi, x);\n    }\n    return Math.Max(0, hi - lo - 2 * k);\n}`,
              go: `func smallestRangeI(nums []int, k int) int {\n	lo, hi := nums[0], nums[0]\n	for _, x := range nums {\n		if x < lo {\n			lo = x\n		}\n		if x > hi {\n			hi = x\n		}\n	}\n	span := hi - lo - 2*k\n	if span > 0 {\n		return span\n	}\n	return 0\n}`,
              kotlin: `fun smallestRangeI(nums: IntArray, k: Int): Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for (x in nums) {\n        if (x < lo) lo = x\n        if (x > hi) hi = x\n    }\n    val span = hi - lo - 2 * k\n    return if (span > 0) span else 0\n}`,
              swift: `func smallestRangeI(_ nums: [Int], _ k: Int) -> Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for x in nums {\n        if x < lo { lo = x }\n        if x > hi { hi = x }\n    }\n    return max(0, hi - lo - 2 * k)\n}`,
              rust: `fn smallestRangeI(nums: Vec<i32>, k: i32) -> i32 {\n    let mut lo = nums[0];\n    let mut hi = nums[0];\n    for x in nums.iter() {\n        if *x < lo {\n            lo = *x;\n        }\n        if *x > hi {\n            hi = *x;\n        }\n    }\n    let span = hi - lo - 2 * k;\n    if span > 0 { span } else { 0 }\n}`,
              php: `function smallestRangeI($nums, $k) {\n    $span = max($nums) - min($nums) - 2 * $k;\n    return $span > 0 ? $span : 0;\n}`,
              ruby: `def smallestRangeI(nums, k)\n  span = nums.max - nums.min - 2 * k\n  span > 0 ? span : 0\nend`,
      },
    };
  })(),

  // ── Minimum Time to Make Rope Colorful ──────────────────────────
  (() => {
    const ref = (colors: string, neededTime: number[]) => {
      let total = 0;
      let i = 0;
      while (i < colors.length) {
        let j = i, sum = 0, maxT = 0;
        while (j < colors.length && colors[j] === colors[i]) {
          sum += neededTime[j];
          if (neededTime[j] > maxT) maxT = neededTime[j];
          j++;
        }
        total += sum - maxT;
        i = j;
      }
      return total;
    };
    return {
      slug: "minimum-time-to-make-rope-colorful",
      title: "Minimum Time to Make Rope Colorful",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Dynamic Programming", "Greedy", "Amazon", "Adobe"],
      signature: { funcName: "minCost", params: [{ name: "colors", type: "string" as const }, { name: "neededTime", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Alice has `n` balloons on a rope; `colors[i]` is the colour of the i-th balloon. The rope is **colorful** if no two consecutive balloons share a colour.\n\nBob can remove the i-th balloon at a cost of `neededTime[i]` seconds. Return the minimum total time needed to make the rope colorful.",
        [
          { in: 'colors = "abaac", neededTime = [1,2,3,4,5]', out: "3", note: "Remove the cheaper of the two consecutive a's." },
          { in: 'colors = "abc", neededTime = [1,2,3]', out: "0" },
          { in: 'colors = "aabaa", neededTime = [1,2,3,4,1]', out: "2" },
        ],
        ["1 <= colors.length <= 40", "neededTime.length == colors.length", "1 <= neededTime[i] <= 10000", "colors consists of lowercase English letters."]),
      hints: [
        "Balloons only conflict inside a **run** of one colour, and each run must be reduced to a single balloon.",
        "Within a run, keep the most expensive balloon and remove the rest.",
        "So each run contributes `sum(run) - max(run)`.",
      ],
      examples: [
        { input: '"abaac"\n[1,2,3,4,5]', expectedOutput: "3" },
        { input: '"abc"\n[1,2,3]', expectedOutput: "0" },
        { input: '"aabaa"\n[1,2,3,4,1]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const colors = randStr(rng, n, n, "abc");
        const neededTime = randArr(rng, n, 1, 10000);
        return { input: `"${colors}"\n${fmtIntArr(neededTime)}`, expectedOutput: String(ref(colors, neededTime)) };
      },
      solutions: {
        python: `def minCost(colors: str, neededTime) -> int:\n    total = 0\n    i = 0\n    while i < len(colors):\n        j = i\n        run_sum = 0\n        run_max = 0\n        while j < len(colors) and colors[j] == colors[i]:\n            run_sum += neededTime[j]\n            run_max = max(run_max, neededTime[j])\n            j += 1\n        total += run_sum - run_max\n        i = j\n    return total`,
        javascript: `var minCost = function(colors, neededTime) {\n    let total = 0;\n    let i = 0;\n    while (i < colors.length) {\n        let j = i, sum = 0, maxT = 0;\n        while (j < colors.length && colors[j] === colors[i]) {\n            sum += neededTime[j];\n            if (neededTime[j] > maxT) maxT = neededTime[j];\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n};`,
              typescript: `function minCost(colors: string, neededTime: number[]): number {\n    var total = 0;\n    var i = 0;\n    while (i < colors.length) {\n        var j = i;\n        var sum = 0;\n        var maxT = 0;\n        while (j < colors.length && colors.charAt(j) === colors.charAt(i)) {\n            sum += neededTime[j];\n            if (neededTime[j] > maxT) maxT = neededTime[j];\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n}`,
              java: `public static int minCost(String colors, int[] neededTime) {\n    int total = 0, i = 0;\n    while (i < colors.length()) {\n        int j = i, sum = 0, maxT = 0;\n        while (j < colors.length() && colors.charAt(j) == colors.charAt(i)) {\n            sum += neededTime[j];\n            maxT = Math.max(maxT, neededTime[j]);\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n}`,
              cpp: `int minCost(string colors, vector<int>& neededTime) {\n    int total = 0, i = 0;\n    int n = (int) colors.size();\n    while (i < n) {\n        int j = i, sum = 0, maxT = 0;\n        while (j < n && colors[j] == colors[i]) {\n            sum += neededTime[j];\n            maxT = max(maxT, neededTime[j]);\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n}`,
              c: `int minCost(const char* colors, int* neededTime, int neededTimeSize) {\n    int n = (int) strlen(colors);\n    int total = 0, i = 0;\n    while (i < n) {\n        int j = i, sum = 0, maxT = 0;\n        while (j < n && colors[j] == colors[i]) {\n            sum += neededTime[j];\n            if (neededTime[j] > maxT) maxT = neededTime[j];\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n}`,
              csharp: `public static int MinCost(string colors, int[] neededTime)\n{\n    int total = 0, i = 0;\n    while (i < colors.Length)\n    {\n        int j = i, sum = 0, maxT = 0;\n        while (j < colors.Length && colors[j] == colors[i])\n        {\n            sum += neededTime[j];\n            maxT = Math.Max(maxT, neededTime[j]);\n            j++;\n        }\n        total += sum - maxT;\n        i = j;\n    }\n    return total;\n}`,
              go: `func minCost(colors string, neededTime []int) int {\n	total, i := 0, 0\n	for i < len(colors) {\n		j, sum, maxT := i, 0, 0\n		for j < len(colors) && colors[j] == colors[i] {\n			sum += neededTime[j]\n			if neededTime[j] > maxT {\n				maxT = neededTime[j]\n			}\n			j++\n		}\n		total += sum - maxT\n		i = j\n	}\n	return total\n}`,
              kotlin: `fun minCost(colors: String, neededTime: IntArray): Int {\n    var total = 0\n    var i = 0\n    while (i < colors.length) {\n        var j = i\n        var sum = 0\n        var maxT = 0\n        while (j < colors.length && colors[j] == colors[i]) {\n            sum += neededTime[j]\n            if (neededTime[j] > maxT) maxT = neededTime[j]\n            j++\n        }\n        total += sum - maxT\n        i = j\n    }\n    return total\n}`,
              swift: `func minCost(_ colors: String, _ neededTime: [Int]) -> Int {\n    let chars = Array(colors)\n    var total = 0\n    var i = 0\n    while i < chars.count {\n        var j = i\n        var sum = 0\n        var maxT = 0\n        while j < chars.count && chars[j] == chars[i] {\n            sum += neededTime[j]\n            if neededTime[j] > maxT { maxT = neededTime[j] }\n            j += 1\n        }\n        total += sum - maxT\n        i = j\n    }\n    return total\n}`,
              rust: `fn minCost(colors: String, neededTime: Vec<i32>) -> i32 {\n    let chars: Vec<u8> = colors.bytes().collect();\n    let mut total = 0;\n    let mut i = 0usize;\n    while i < chars.len() {\n        let mut j = i;\n        let mut sum = 0;\n        let mut max_t = 0;\n        while j < chars.len() && chars[j] == chars[i] {\n            sum += neededTime[j];\n            if neededTime[j] > max_t {\n                max_t = neededTime[j];\n            }\n            j += 1;\n        }\n        total += sum - max_t;\n        i = j;\n    }\n    total\n}`,
              php: `function minCost($colors, $neededTime) {\n    $n = strlen($colors);\n    $total = 0;\n    $i = 0;\n    while ($i < $n) {\n        $j = $i;\n        $sum = 0;\n        $maxT = 0;\n        while ($j < $n && $colors[$j] === $colors[$i]) {\n            $sum += $neededTime[$j];\n            if ($neededTime[$j] > $maxT) $maxT = $neededTime[$j];\n            $j++;\n        }\n        $total += $sum - $maxT;\n        $i = $j;\n    }\n    return $total;\n}`,
              ruby: `def minCost(colors, neededTime)\n  total = 0\n  i = 0\n  n = colors.length\n  while i < n\n    j = i\n    sum = 0\n    max_t = 0\n    while j < n && colors[j] == colors[i]\n      sum += neededTime[j]\n      max_t = neededTime[j] if neededTime[j] > max_t\n      j += 1\n    end\n    total += sum - max_t\n    i = j\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Maximum Score After Splitting a String ──────────────────────
  (() => {
    const ref = (s: string) => {
      let ones = 0;
      for (let i = 0; i < s.length; i++) if (s[i] === "1") ones++;
      let zeros = 0, best = -1, rightOnes = ones;
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] === "0") zeros++;
        else rightOnes--;
        const score = zeros + rightOnes;
        if (score > best) best = score;
      }
      return best;
    };
    return {
      slug: "maximum-score-after-splitting-a-string",
      title: "Maximum Score After Splitting a String",
      difficulty: "EASY" as const,
      tags: ["String", "Prefix Sum", "Amazon", "Adobe"],
      signature: { funcName: "maxScore", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` of zeros and ones, split it into two **non-empty** parts, left and right.\n\nThe score of a split is the number of zeros in the left part plus the number of ones in the right part. Return the maximum score.",
        [
          { in: 's = "011101"', out: "5", note: 'Splitting after the first character gives 1 zero on the left and 4 ones on the right.' },
          { in: 's = "00111"', out: "5" },
          { in: 's = "1111"', out: "3", note: "The left part must be non-empty, so one 1 is always sacrificed." },
        ],
        ["2 <= s.length <= 40", "s consists of '0' and '1'."]),
      hints: [
        "Count the total ones first, then sweep the split point left to right.",
        "Moving the split past a `0` adds one to the left count; moving past a `1` removes one from the right count.",
        "Stop before the final character — the right part must stay non-empty.",
      ],
      examples: [
        { input: '"011101"', expectedOutput: "5" },
        { input: '"00111"', expectedOutput: "5" },
        { input: '"1111"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 2, 40, "01");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def maxScore(s: str) -> int:\n    right_ones = s.count("1")\n    zeros = 0\n    best = -1\n    for i in range(len(s) - 1):\n        if s[i] == "0":\n            zeros += 1\n        else:\n            right_ones -= 1\n        best = max(best, zeros + right_ones)\n    return best`,
        javascript: `var maxScore = function(s) {\n    let ones = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === "1") ones++;\n    }\n    let zeros = 0, best = -1, rightOnes = ones;\n    for (let i = 0; i < s.length - 1; i++) {\n        if (s[i] === "0") zeros++;\n        else rightOnes--;\n        const score = zeros + rightOnes;\n        if (score > best) best = score;\n    }\n    return best;\n};`,
              typescript: `function maxScore(s: string): number {\n    var ones = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1") ones++;\n    }\n    var zeros = 0;\n    var best = -1;\n    var rightOnes = ones;\n    for (var j = 0; j < s.length - 1; j++) {\n        if (s.charAt(j) === "0") zeros++;\n        else rightOnes--;\n        var score = zeros + rightOnes;\n        if (score > best) best = score;\n    }\n    return best;\n}`,
              java: `public static int maxScore(String s) {\n    int ones = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '1') ones++;\n    }\n    int zeros = 0, best = -1, rightOnes = ones;\n    for (int i = 0; i < s.length() - 1; i++) {\n        if (s.charAt(i) == '0') zeros++;\n        else rightOnes--;\n        best = Math.max(best, zeros + rightOnes);\n    }\n    return best;\n}`,
              cpp: `int maxScore(string s) {\n    int ones = 0;\n    for (char ch : s) {\n        if (ch == '1') ones++;\n    }\n    int zeros = 0, best = -1, rightOnes = ones;\n    for (int i = 0; i < (int) s.size() - 1; i++) {\n        if (s[i] == '0') zeros++;\n        else rightOnes--;\n        best = max(best, zeros + rightOnes);\n    }\n    return best;\n}`,
              c: `int maxScore(const char* s) {\n    int n = (int) strlen(s);\n    int ones = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '1') ones++;\n    }\n    int zeros = 0, best = -1, rightOnes = ones;\n    for (int i = 0; i < n - 1; i++) {\n        if (s[i] == '0') zeros++;\n        else rightOnes--;\n        int score = zeros + rightOnes;\n        if (score > best) best = score;\n    }\n    return best;\n}`,
              csharp: `public static int MaxScore(string s)\n{\n    int ones = 0;\n    foreach (char ch in s)\n    {\n        if (ch == '1') ones++;\n    }\n    int zeros = 0, best = -1, rightOnes = ones;\n    for (int i = 0; i < s.Length - 1; i++)\n    {\n        if (s[i] == '0') zeros++;\n        else rightOnes--;\n        best = Math.Max(best, zeros + rightOnes);\n    }\n    return best;\n}`,
              go: `func maxScore(s string) int {\n	ones := 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '1' {\n			ones++\n		}\n	}\n	zeros, best, rightOnes := 0, -1, ones\n	for i := 0; i < len(s)-1; i++ {\n		if s[i] == '0' {\n			zeros++\n		} else {\n			rightOnes--\n		}\n		if zeros+rightOnes > best {\n			best = zeros + rightOnes\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxScore(s: String): Int {\n    var ones = 0\n    for (ch in s) {\n        if (ch == '1') ones++\n    }\n    var zeros = 0\n    var best = -1\n    var rightOnes = ones\n    for (i in 0 until s.length - 1) {\n        if (s[i] == '0') zeros++ else rightOnes--\n        val score = zeros + rightOnes\n        if (score > best) best = score\n    }\n    return best\n}`,
              swift: `func maxScore(_ s: String) -> Int {\n    let chars = Array(s)\n    var ones = 0\n    for ch in chars where ch == "1" { ones += 1 }\n    var zeros = 0\n    var best = -1\n    var rightOnes = ones\n    for i in 0..<(chars.count - 1) {\n        if chars[i] == "0" { zeros += 1 } else { rightOnes -= 1 }\n        let score = zeros + rightOnes\n        if score > best { best = score }\n    }\n    return best\n}`,
              rust: `fn maxScore(s: String) -> i32 {\n    let chars: Vec<u8> = s.bytes().collect();\n    let mut ones = 0;\n    for c in chars.iter() {\n        if *c == b'1' {\n            ones += 1;\n        }\n    }\n    let mut zeros = 0;\n    let mut best = -1;\n    let mut right_ones = ones;\n    for i in 0..chars.len() - 1 {\n        if chars[i] == b'0' {\n            zeros += 1;\n        } else {\n            right_ones -= 1;\n        }\n        let score = zeros + right_ones;\n        if score > best {\n            best = score;\n        }\n    }\n    best\n}`,
              php: `function maxScore($s) {\n    $n = strlen($s);\n    $ones = substr_count($s, "1");\n    $zeros = 0;\n    $best = -1;\n    $rightOnes = $ones;\n    for ($i = 0; $i < $n - 1; $i++) {\n        if ($s[$i] === "0") $zeros++;\n        else $rightOnes--;\n        $score = $zeros + $rightOnes;\n        if ($score > $best) $best = $score;\n    }\n    return $best;\n}`,
              ruby: `def maxScore(s)\n  ones = s.count("1")\n  zeros = 0\n  best = -1\n  right_ones = ones\n  (0...(s.length - 1)).each do |i|\n    if s[i] == "0"\n      zeros += 1\n    else\n      right_ones -= 1\n    end\n    score = zeros + right_ones\n    best = score if score > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Partition Array into Disjoint Intervals ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let leftMax = nums[0], curMax = nums[0], cut = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > curMax) curMax = nums[i];
        if (nums[i] < leftMax) { leftMax = curMax; cut = i + 1; }
      }
      return cut;
    };
    return {
      slug: "partition-array-into-disjoint-intervals",
      title: "Partition Array into Disjoint Intervals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "partitionDisjoint", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, split it into two contiguous parts `left` and `right` so that:\n\n- every element of `left` is less than or equal to every element of `right`;\n- both parts are non-empty;\n- `left` is as **short** as possible.\n\nReturn the length of `left`. A valid split is guaranteed to exist.",
        [
          { in: "nums = [5,0,3,8,6]", out: "3", note: "left = [5,0,3], right = [8,6]." },
          { in: "nums = [1,1,1,0,6,12]", out: "4" },
          { in: "nums = [1,2]", out: "1" },
        ],
        ["2 <= nums.length <= 40", "0 <= nums[i] <= 1000", "A valid partition exists."]),
      hints: [
        "Track two maxima: the maximum of the committed left part, and the maximum seen so far overall.",
        "Any element smaller than the left maximum forces the cut to move past it.",
        "When that happens, the left part absorbs everything up to here, so its maximum becomes the running overall maximum.",
      ],
      examples: [
        { input: "[5,0,3,8,6]", expectedOutput: "3" },
        { input: "[1,1,1,0,6,12]", expectedOutput: "4" },
        { input: "[1,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 2, 40), 0, rng() < 0.5 ? 10 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def partitionDisjoint(nums) -> int:\n    left_max = cur_max = nums[0]\n    cut = 1\n    for i in range(1, len(nums)):\n        cur_max = max(cur_max, nums[i])\n        if nums[i] < left_max:\n            left_max = cur_max\n            cut = i + 1\n    return cut`,
        javascript: `var partitionDisjoint = function(nums) {\n    let leftMax = nums[0], curMax = nums[0], cut = 1;\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] > curMax) curMax = nums[i];\n        if (nums[i] < leftMax) {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n};`,
              typescript: `function partitionDisjoint(nums: number[]): number {\n    var leftMax = nums[0];\n    var curMax = nums[0];\n    var cut = 1;\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > curMax) curMax = nums[i];\n        if (nums[i] < leftMax) {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n}`,
              java: `public static int partitionDisjoint(int[] nums) {\n    int leftMax = nums[0], curMax = nums[0], cut = 1;\n    for (int i = 1; i < nums.length; i++) {\n        curMax = Math.max(curMax, nums[i]);\n        if (nums[i] < leftMax) {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n}`,
              cpp: `int partitionDisjoint(vector<int>& nums) {\n    int leftMax = nums[0], curMax = nums[0], cut = 1;\n    for (int i = 1; i < (int) nums.size(); i++) {\n        curMax = max(curMax, nums[i]);\n        if (nums[i] < leftMax) {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n}`,
              c: `int partitionDisjoint(int* nums, int numsSize) {\n    int leftMax = nums[0], curMax = nums[0], cut = 1;\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] > curMax) curMax = nums[i];\n        if (nums[i] < leftMax) {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n}`,
              csharp: `public static int PartitionDisjoint(int[] nums)\n{\n    int leftMax = nums[0], curMax = nums[0], cut = 1;\n    for (int i = 1; i < nums.Length; i++)\n    {\n        curMax = Math.Max(curMax, nums[i]);\n        if (nums[i] < leftMax)\n        {\n            leftMax = curMax;\n            cut = i + 1;\n        }\n    }\n    return cut;\n}`,
              go: `func partitionDisjoint(nums []int) int {\n	leftMax, curMax, cut := nums[0], nums[0], 1\n	for i := 1; i < len(nums); i++ {\n		if nums[i] > curMax {\n			curMax = nums[i]\n		}\n		if nums[i] < leftMax {\n			leftMax = curMax\n			cut = i + 1\n		}\n	}\n	return cut\n}`,
              kotlin: `fun partitionDisjoint(nums: IntArray): Int {\n    var leftMax = nums[0]\n    var curMax = nums[0]\n    var cut = 1\n    for (i in 1 until nums.size) {\n        if (nums[i] > curMax) curMax = nums[i]\n        if (nums[i] < leftMax) {\n            leftMax = curMax\n            cut = i + 1\n        }\n    }\n    return cut\n}`,
              swift: `func partitionDisjoint(_ nums: [Int]) -> Int {\n    var leftMax = nums[0]\n    var curMax = nums[0]\n    var cut = 1\n    for i in 1..<max(nums.count, 1) {\n        if nums[i] > curMax { curMax = nums[i] }\n        if nums[i] < leftMax {\n            leftMax = curMax\n            cut = i + 1\n        }\n    }\n    return cut\n}`,
              rust: `fn partitionDisjoint(nums: Vec<i32>) -> i32 {\n    let mut left_max = nums[0];\n    let mut cur_max = nums[0];\n    let mut cut = 1;\n    for i in 1..nums.len() {\n        if nums[i] > cur_max {\n            cur_max = nums[i];\n        }\n        if nums[i] < left_max {\n            left_max = cur_max;\n            cut = (i + 1) as i32;\n        }\n    }\n    cut\n}`,
              php: `function partitionDisjoint($nums) {\n    $leftMax = $nums[0];\n    $curMax = $nums[0];\n    $cut = 1;\n    for ($i = 1; $i < count($nums); $i++) {\n        if ($nums[$i] > $curMax) $curMax = $nums[$i];\n        if ($nums[$i] < $leftMax) {\n            $leftMax = $curMax;\n            $cut = $i + 1;\n        }\n    }\n    return $cut;\n}`,
              ruby: `def partitionDisjoint(nums)\n  left_max = nums[0]\n  cur_max = nums[0]\n  cut = 1\n  (1...nums.length).each do |i|\n    cur_max = nums[i] if nums[i] > cur_max\n    if nums[i] < left_max\n      left_max = cur_max\n      cut = i + 1\n    end\n  end\n  cut\nend`,
      },
    };
  })(),

  // ── K Closest Points to Origin ──────────────────────────────────
  (() => {
    const ref = (points: number[][], k: number) => {
      const sorted = points.slice().sort((a, b) => {
        const da = a[0] * a[0] + a[1] * a[1];
        const db = b[0] * b[0] + b[1] * b[1];
        if (da !== db) return da - db;
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
      });
      return sorted.slice(0, k);
    };
    return {
      slug: "k-closest-points-to-origin",
      title: "K Closest Points to Origin",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Divide and Conquer", "Geometry", "Sorting", "Heap", "Quickselect", "Amazon", "Google", "Meta", "Microsoft"],
      signature: { funcName: "kClosest", params: [{ name: "points", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array of `points` where `points[i] = [x, y]` and an integer `k`, return the `k` points closest to the origin `(0, 0)`.\n\nDistance is the usual Euclidean distance. Return the points sorted by distance ascending, breaking ties by `x` and then by `y`, both ascending.",
        [
          { in: "points = [[1,3],[-2,2]], k = 1", out: "[[-2,2]]", note: "√8 < √10." },
          { in: "points = [[3,3],[5,-1],[-2,4]], k = 2", out: "[[3,3],[-2,4]]" },
          { in: "points = [[0,1],[1,0]], k = 2", out: "[[0,1],[1,0]]", note: "Equal distances, so x then y decides." },
        ],
        ["1 <= k <= points.length <= 30", "-100 <= x, y <= 100"]),
      hints: [
        "Compare **squared** distances — the square root is monotone and only costs precision.",
        "Sorting is O(n log n); a max-heap of size `k` or quickselect does better on large inputs.",
        "The tie-break is part of the specification here, so it must be applied even when distances are equal.",
      ],
      examples: [
        { input: "[[1,3],[-2,2]]\n1", expectedOutput: "[[-2,2]]" },
        { input: "[[3,3],[5,-1],[-2,4]]\n2", expectedOutput: "[[3,3],[-2,4]]" },
        { input: "[[0,1],[1,0]]\n2", expectedOutput: "[[0,1],[1,0]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const points = Array.from({ length: n }, () => [ri(rng, -100, 100), ri(rng, -100, 100)]);
        const k = ri(rng, 1, n);
        return { input: `${fmtIntMat(points)}\n${k}`, expectedOutput: fmtIntMat(ref(points, k)) };
      },
      solutions: {
        python: `def kClosest(points, k: int):\n    ordered = sorted(points, key=lambda p: (p[0] * p[0] + p[1] * p[1], p[0], p[1]))\n    return ordered[:k]`,
        javascript: `var kClosest = function(points, k) {\n    const sorted = points.slice().sort(function(a, b) {\n        const da = a[0] * a[0] + a[1] * a[1];\n        const db = b[0] * b[0] + b[1] * b[1];\n        if (da !== db) return da - db;\n        if (a[0] !== b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return sorted.slice(0, k);\n};`,
              typescript: `function kClosest(points: number[][], k: number): number[][] {\n    var sorted = points.slice().sort(function (a, b) {\n        var da = a[0] * a[0] + a[1] * a[1];\n        var db = b[0] * b[0] + b[1] * b[1];\n        if (da !== db) return da - db;\n        if (a[0] !== b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return sorted.slice(0, k);\n}`,
              java: `public static int[][] kClosest(int[][] points, int k) {\n    int[][] s = points.clone();\n    Arrays.sort(s, (a, b) -> {\n        int da = a[0] * a[0] + a[1] * a[1];\n        int db = b[0] * b[0] + b[1] * b[1];\n        if (da != db) return da - db;\n        if (a[0] != b[0]) return a[0] - b[0];\n        return a[1] - b[1];\n    });\n    return Arrays.copyOfRange(s, 0, k);\n}`,
              cpp: `vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {\n    vector<vector<int>> s = points;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) {\n        int da = a[0] * a[0] + a[1] * a[1];\n        int db = b[0] * b[0] + b[1] * b[1];\n        if (da != db) return da < db;\n        if (a[0] != b[0]) return a[0] < b[0];\n        return a[1] < b[1];\n    });\n    s.resize(k);\n    return s;\n}`,
              c: `static int cmpClosestPoint(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    int dx = x[0] * x[0] + x[1] * x[1];\n    int dy = y[0] * y[0] + y[1] * y[1];\n    if (dx != dy) return (dx > dy) - (dx < dy);\n    if (x[0] != y[0]) return (x[0] > y[0]) - (x[0] < y[0]);\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {\n    int** s = (int**) malloc((pointsSize > 0 ? pointsSize : 1) * sizeof(int*));\n    for (int i = 0; i < pointsSize; i++) s[i] = points[i];\n    qsort(s, pointsSize, sizeof(int*), cmpClosestPoint);\n    int** out = (int**) malloc((k > 0 ? k : 1) * sizeof(int*));\n    int* cols = (int*) malloc((k > 0 ? k : 1) * sizeof(int));\n    for (int i = 0; i < k; i++) {\n        out[i] = (int*) malloc(2 * sizeof(int));\n        out[i][0] = s[i][0];\n        out[i][1] = s[i][1];\n        cols[i] = 2;\n    }\n    free(s);\n    *returnSize = k;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] KClosest(int[][] points, int k)\n{\n    var s = new List<int[]>(points);\n    s.Sort((a, b) =>\n    {\n        int da = a[0] * a[0] + a[1] * a[1];\n        int db = b[0] * b[0] + b[1] * b[1];\n        if (da != db) return da.CompareTo(db);\n        if (a[0] != b[0]) return a[0].CompareTo(b[0]);\n        return a[1].CompareTo(b[1]);\n    });\n    return s.GetRange(0, k).ToArray();\n}`,
              go: `func kClosest(points [][]int, k int) [][]int {\n	s := append([][]int{}, points...)\n	sort.Slice(s, func(a, b int) bool {\n		da := s[a][0]*s[a][0] + s[a][1]*s[a][1]\n		db := s[b][0]*s[b][0] + s[b][1]*s[b][1]\n		if da != db {\n			return da < db\n		}\n		if s[a][0] != s[b][0] {\n			return s[a][0] < s[b][0]\n		}\n		return s[a][1] < s[b][1]\n	})\n	return s[:k]\n}`,
              kotlin: `fun kClosest(points: Array<IntArray>, k: Int): Array<IntArray> {\n    val s = points.sortedWith(Comparator { a, b ->\n        val da = a[0] * a[0] + a[1] * a[1]\n        val db = b[0] * b[0] + b[1] * b[1]\n        when {\n            da != db -> da - db\n            a[0] != b[0] -> a[0] - b[0]\n            else -> a[1] - b[1]\n        }\n    })\n    return s.subList(0, k).toTypedArray()\n}`,
              swift: `func kClosest(_ points: [[Int]], _ k: Int) -> [[Int]] {\n    let s = points.sorted { a, b in\n        let da = a[0] * a[0] + a[1] * a[1]\n        let db = b[0] * b[0] + b[1] * b[1]\n        if da != db { return da < db }\n        if a[0] != b[0] { return a[0] < b[0] }\n        return a[1] < b[1]\n    }\n    return Array(s.prefix(k))\n}`,
              rust: `fn kClosest(points: Vec<Vec<i32>>, k: i32) -> Vec<Vec<i32>> {\n    let mut s = points.clone();\n    s.sort_by(|a, b| {\n        let da = a[0] * a[0] + a[1] * a[1];\n        let db = b[0] * b[0] + b[1] * b[1];\n        if da != db {\n            da.cmp(&db)\n        } else if a[0] != b[0] {\n            a[0].cmp(&b[0])\n        } else {\n            a[1].cmp(&b[1])\n        }\n    });\n    s.truncate(k as usize);\n    s\n}`,
              php: `function kClosest($points, $k) {\n    $s = $points;\n    usort($s, function($a, $b) {\n        $da = $a[0] * $a[0] + $a[1] * $a[1];\n        $db = $b[0] * $b[0] + $b[1] * $b[1];\n        if ($da != $db) return $da - $db;\n        if ($a[0] != $b[0]) return $a[0] - $b[0];\n        return $a[1] - $b[1];\n    });\n    return array_slice($s, 0, $k);\n}`,
              ruby: `def kClosest(points, k)\n  points.sort_by { |p| [p[0] * p[0] + p[1] * p[1], p[0], p[1]] }.first(k)\nend`,
      },
    };
  })(),

  // ── Top K Frequent Words ────────────────────────────────────────
  (() => {
    const ref = (words: string[], k: number) => {
      const count = new Map<string, number>();
      for (let i = 0; i < words.length; i++) count.set(words[i], (count.get(words[i]) ?? 0) + 1);
      const unique: string[] = [];
      count.forEach((_, w) => unique.push(w));
      unique.sort((a, b) => {
        const ca = count.get(a)!, cb = count.get(b)!;
        if (ca !== cb) return cb - ca;
        return a < b ? -1 : a > b ? 1 : 0;
      });
      return unique.slice(0, k);
    };
    return {
      slug: "top-k-frequent-words",
      title: "Top K Frequent Words",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Sorting", "Heap", "Counting", "Amazon", "Google", "Bloomberg", "Uber"],
      signature: { funcName: "topKFrequent", params: [{ name: "words", type: "string[]" as const }, { name: "k", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "Given an array of strings `words` and an integer `k`, return the `k` most frequent strings.\n\nSort the answer by frequency from highest to lowest; words with the same frequency are ordered **lexicographically**.",
        [
          { in: 'words = ["i","love","leetcode","i","love","coding"], k = 2', out: '["i","love"]' },
          { in: 'words = ["the","day","is","sunny","the","the","the","sunny","is","is"], k = 4', out: '["the","is","sunny","day"]' },
          { in: 'words = ["a"], k = 1', out: '["a"]' },
        ],
        ["1 <= words.length <= 40", "1 <= words[i].length <= 8", "words[i] consists of lowercase English letters.", "1 <= k <= number of distinct words"]),
      hints: [
        "Count the words, then sort the distinct ones by (frequency descending, word ascending).",
        "The tie-break is lexicographic on the word itself, not on insertion order.",
        "A heap of size `k` with the same comparator gives O(n log k).",
      ],
      examples: [
        { input: '["i","love","leetcode","i","love","coding"]\n2', expectedOutput: '["i","love"]' },
        { input: '["the","day","is","sunny","the","the","the","sunny","is","is"]\n4', expectedOutput: '["the","is","sunny","day"]' },
        { input: '["a"]\n1', expectedOutput: '["a"]' },
      ],
      gen: (rng: Rng) => {
        const pool = ["a", "b", "ab", "ba", "abc", "cab", "day", "sun", "the", "is"];
        const n = ri(rng, 1, 40);
        const words = Array.from({ length: n }, () => pool[ri(rng, 0, pool.length - 1)]);
        const distinct = new Set(words).size;
        const k = ri(rng, 1, distinct);
        return { input: `${fmtStrArr(words)}\n${k}`, expectedOutput: fmtStrArr(ref(words, k)) };
      },
      solutions: {
        python: `def topKFrequent(words, k: int):\n    count = {}\n    for w in words:\n        count[w] = count.get(w, 0) + 1\n    ordered = sorted(count.keys(), key=lambda w: (-count[w], w))\n    return ordered[:k]`,
        javascript: `var topKFrequent = function(words, k) {\n    const count = new Map();\n    for (let i = 0; i < words.length; i++) {\n        count.set(words[i], (count.get(words[i]) || 0) + 1);\n    }\n    const unique = [];\n    count.forEach(function(_, w) { unique.push(w); });\n    unique.sort(function(a, b) {\n        const ca = count.get(a), cb = count.get(b);\n        if (ca !== cb) return cb - ca;\n        if (a < b) return -1;\n        if (a > b) return 1;\n        return 0;\n    });\n    return unique.slice(0, k);\n};`,
              typescript: `function topKFrequent(words: string[], k: number): string[] {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < words.length; i++) {\n        count[words[i]] = (count[words[i]] || 0) + 1;\n    }\n    var unique: string[] = [];\n    for (var w in count) {\n        if (Object.prototype.hasOwnProperty.call(count, w)) unique.push(w);\n    }\n    unique.sort(function (a, b) {\n        if (count[a] !== count[b]) return count[b] - count[a];\n        if (a < b) return -1;\n        if (a > b) return 1;\n        return 0;\n    });\n    return unique.slice(0, k);\n}`,
              java: `public static String[] topKFrequent(String[] words, int k) {\n    Map<String, Integer> count = new HashMap<>();\n    for (String w : words) count.put(w, count.getOrDefault(w, 0) + 1);\n    List<String> unique = new ArrayList<>(count.keySet());\n    Collections.sort(unique, (a, b) -> {\n        int ca = count.get(a), cb = count.get(b);\n        if (ca != cb) return cb - ca;\n        return a.compareTo(b);\n    });\n    return unique.subList(0, k).toArray(new String[0]);\n}`,
              cpp: `vector<string> topKFrequent(vector<string>& words, int k) {\n    unordered_map<string, int> count;\n    for (const string& w : words) count[w]++;\n    vector<string> unique;\n    for (const auto& kv : count) unique.push_back(kv.first);\n    sort(unique.begin(), unique.end(), [&](const string& a, const string& b) {\n        int ca = count[a], cb = count[b];\n        if (ca != cb) return ca > cb;\n        return a < b;\n    });\n    unique.resize(k);\n    return unique;\n}`,
              c: `typedef struct {\n    char word[16];\n    int count;\n} WordCount;\n\nstatic int cmpWordCount(const void* a, const void* b) {\n    const WordCount* x = (const WordCount*) a;\n    const WordCount* y = (const WordCount*) b;\n    if (x->count != y->count) return y->count - x->count;\n    return strcmp(x->word, y->word);\n}\n\nchar** topKFrequent(char** words, int wordsSize, int k, int* returnSize) {\n    WordCount* wc = (WordCount*) malloc((size_t) (wordsSize > 0 ? wordsSize : 1) * sizeof(WordCount));\n    int m = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        int found = -1;\n        for (int j = 0; j < m; j++) {\n            if (strcmp(wc[j].word, words[i]) == 0) {\n                found = j;\n                break;\n            }\n        }\n        if (found >= 0) {\n            wc[found].count++;\n        } else {\n            strcpy(wc[m].word, words[i]);\n            wc[m].count = 1;\n            m++;\n        }\n    }\n    qsort(wc, m, sizeof(WordCount), cmpWordCount);\n    char** out = (char**) malloc((size_t) (k > 0 ? k : 1) * sizeof(char*));\n    for (int i = 0; i < k; i++) {\n        out[i] = (char*) malloc(16);\n        strcpy(out[i], wc[i].word);\n    }\n    free(wc);\n    *returnSize = k;\n    return out;\n}`,
              csharp: `public static string[] TopKFrequent(string[] words, int k)\n{\n    var count = new Dictionary<string, int>();\n    foreach (string w in words)\n    {\n        if (count.ContainsKey(w)) count[w]++;\n        else count[w] = 1;\n    }\n    var unique = new List<string>(count.Keys);\n    unique.Sort((a, b) =>\n    {\n        if (count[a] != count[b]) return count[b].CompareTo(count[a]);\n        return string.CompareOrdinal(a, b);\n    });\n    return unique.GetRange(0, k).ToArray();\n}`,
              go: `func topKFrequent(words []string, k int) []string {\n	count := map[string]int{}\n	for _, w := range words {\n		count[w]++\n	}\n	unique := []string{}\n	for w := range count {\n		unique = append(unique, w)\n	}\n	sort.Slice(unique, func(a, b int) bool {\n		if count[unique[a]] != count[unique[b]] {\n			return count[unique[a]] > count[unique[b]]\n		}\n		return unique[a] < unique[b]\n	})\n	return unique[:k]\n}`,
              kotlin: `fun topKFrequent(words: Array<String>, k: Int): Array<String> {\n    val count = HashMap<String, Int>()\n    for (w in words) count[w] = (count[w] ?: 0) + 1\n    val unique = count.keys.sortedWith(Comparator { a, b ->\n        val ca = count[a]!!\n        val cb = count[b]!!\n        if (ca != cb) cb - ca else a.compareTo(b)\n    })\n    return unique.subList(0, k).toTypedArray()\n}`,
              swift: `func topKFrequent(_ words: [String], _ k: Int) -> [String] {\n    var count: [String: Int] = [:]\n    for w in words { count[w] = (count[w] ?? 0) + 1 }\n    let unique = count.keys.sorted { a, b in\n        let ca = count[a]!\n        let cb = count[b]!\n        if ca != cb { return ca > cb }\n        return a < b\n    }\n    return Array(unique.prefix(k))\n}`,
              rust: `use std::collections::HashMap;\n\nfn topKFrequent(words: Vec<String>, k: i32) -> Vec<String> {\n    let mut count: HashMap<String, i32> = HashMap::new();\n    for w in words.iter() {\n        *count.entry(w.clone()).or_insert(0) += 1;\n    }\n    let mut unique: Vec<String> = count.keys().cloned().collect();\n    unique.sort_by(|a, b| {\n        let ca = count[a];\n        let cb = count[b];\n        if ca != cb {\n            cb.cmp(&ca)\n        } else {\n            a.cmp(b)\n        }\n    });\n    unique.truncate(k as usize);\n    unique\n}`,
              php: `function topKFrequent($words, $k) {\n    $count = array();\n    foreach ($words as $w) {\n        if (isset($count[$w])) $count[$w]++;\n        else $count[$w] = 1;\n    }\n    $unique = array_keys($count);\n    $unique = array_map('strval', $unique);\n    usort($unique, function($a, $b) use ($count) {\n        if ($count[$a] != $count[$b]) return $count[$b] - $count[$a];\n        return strcmp($a, $b);\n    });\n    return array_slice($unique, 0, $k);\n}`,
              ruby: `def topKFrequent(words, k)\n  count = Hash.new(0)\n  words.each { |w| count[w] += 1 }\n  count.keys.sort { |a, b| count[a] != count[b] ? count[b] <=> count[a] : a <=> b }.first(k)\nend`,
      },
    };
  })(),

  // ── Sort Array by Increasing Frequency ──────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) count.set(nums[i], (count.get(nums[i]) ?? 0) + 1);
      return nums.slice().sort((a, b) => {
        const ca = count.get(a)!, cb = count.get(b)!;
        if (ca !== cb) return ca - cb;
        return b - a;
      });
    };
    return {
      slug: "sort-array-by-increasing-frequency",
      title: "Sort Array by Increasing Frequency",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "frequencySort", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array of integers `nums`, sort it in **increasing order of the frequency** of the values.\n\nValues that occur equally often are sorted in **decreasing** order of value.",
        [
          { in: "nums = [1,1,2,2,2,3]", out: "[3,1,1,2,2,2]", note: "3 occurs once, 1 twice, 2 three times." },
          { in: "nums = [2,3,1,3,2]", out: "[1,3,3,2,2]", note: "2 and 3 both occur twice, so the larger value comes first." },
          { in: "nums = [-1,1,-6,4,5,-6,1,4,1]", out: "[5,-1,4,4,-6,-6,1,1,1]" },
        ],
        ["1 <= nums.length <= 40", "-100 <= nums[i] <= 100"]),
      hints: [
        "Count the occurrences first, then sort with a comparator that reads those counts.",
        "The primary key is the count ascending; the secondary key is the value **descending**.",
        "Sorting the original array (not the distinct values) keeps every copy in the output.",
      ],
      examples: [
        { input: "[1,1,2,2,2,3]", expectedOutput: "[3,1,1,2,2,2]" },
        { input: "[2,3,1,3,2]", expectedOutput: "[1,3,3,2,2]" },
        { input: "[-1,1,-6,4,5,-6,1,4,1]", expectedOutput: "[5,-1,4,4,-6,-6,1,1,1]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -100, rng() < 0.6 ? -90 : 100);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def frequencySort(nums):\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    return sorted(nums, key=lambda x: (count[x], -x))`,
        javascript: `var frequencySort = function(nums) {\n    const count = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        count.set(nums[i], (count.get(nums[i]) || 0) + 1);\n    }\n    return nums.slice().sort(function(a, b) {\n        const ca = count.get(a), cb = count.get(b);\n        if (ca !== cb) return ca - cb;\n        return b - a;\n    });\n};`,
              typescript: `function frequencySort(nums: number[]): number[] {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    return nums.slice().sort(function (a, b) {\n        var ca = count[String(a)];\n        var cb = count[String(b)];\n        if (ca !== cb) return ca - cb;\n        return b - a;\n    });\n}`,
              java: `public static int[] frequencySort(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    Integer[] boxed = new Integer[nums.length];\n    for (int i = 0; i < nums.length; i++) boxed[i] = nums[i];\n    Arrays.sort(boxed, (a, b) -> {\n        int ca = count.get(a), cb = count.get(b);\n        if (ca != cb) return ca - cb;\n        return b - a;\n    });\n    int[] out = new int[nums.length];\n    for (int i = 0; i < nums.length; i++) out[i] = boxed[i];\n    return out;\n}`,
              cpp: `vector<int> frequencySort(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int x : nums) count[x]++;\n    vector<int> out = nums;\n    sort(out.begin(), out.end(), [&](int a, int b) {\n        int ca = count[a], cb = count[b];\n        if (ca != cb) return ca < cb;\n        return a > b;\n    });\n    return out;\n}`,
              c: `static int gFreqCount[201];\n\nstatic int cmpFreqSort(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    int cx = gFreqCount[x + 100];\n    int cy = gFreqCount[y + 100];\n    if (cx != cy) return cx - cy;\n    return y - x;\n}\n\nint* frequencySort(int* nums, int numsSize, int* returnSize) {\n    for (int i = 0; i < 201; i++) gFreqCount[i] = 0;\n    for (int i = 0; i < numsSize; i++) gFreqCount[nums[i] + 100]++;\n    int* out = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) out[i] = nums[i];\n    qsort(out, numsSize, sizeof(int), cmpFreqSort);\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] FrequencySort(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    var list = new List<int>(nums);\n    list.Sort((a, b) =>\n    {\n        if (count[a] != count[b]) return count[a].CompareTo(count[b]);\n        return b.CompareTo(a);\n    });\n    return list.ToArray();\n}`,
              go: `func frequencySort(nums []int) []int {\n	count := map[int]int{}\n	for _, x := range nums {\n		count[x]++\n	}\n	out := append([]int{}, nums...)\n	sort.Slice(out, func(a, b int) bool {\n		if count[out[a]] != count[out[b]] {\n			return count[out[a]] < count[out[b]]\n		}\n		return out[a] > out[b]\n	})\n	return out\n}`,
              kotlin: `fun frequencySort(nums: IntArray): IntArray {\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    val sorted = nums.toTypedArray().sortedWith(Comparator { a, b ->\n        val ca = count[a]!!\n        val cb = count[b]!!\n        if (ca != cb) ca - cb else b - a\n    })\n    return sorted.toIntArray()\n}`,
              swift: `func frequencySort(_ nums: [Int]) -> [Int] {\n    var count: [Int: Int] = [:]\n    for x in nums { count[x] = (count[x] ?? 0) + 1 }\n    return nums.sorted { a, b in\n        let ca = count[a]!\n        let cb = count[b]!\n        if ca != cb { return ca < cb }\n        return a > b\n    }\n}`,
              rust: `use std::collections::HashMap;\n\nfn frequencySort(nums: Vec<i32>) -> Vec<i32> {\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for x in nums.iter() {\n        *count.entry(*x).or_insert(0) += 1;\n    }\n    let mut out = nums.clone();\n    out.sort_by(|a, b| {\n        let ca = count[a];\n        let cb = count[b];\n        if ca != cb {\n            ca.cmp(&cb)\n        } else {\n            b.cmp(a)\n        }\n    });\n    out\n}`,
              php: `function frequencySort($nums) {\n    $count = array();\n    foreach ($nums as $x) {\n        if (isset($count[$x])) $count[$x]++;\n        else $count[$x] = 1;\n    }\n    $out = $nums;\n    usort($out, function($a, $b) use ($count) {\n        if ($count[$a] != $count[$b]) return $count[$a] - $count[$b];\n        return $b - $a;\n    });\n    return $out;\n}`,
              ruby: `def frequencySort(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  nums.sort_by { |x| [count[x], -x] }\nend`,
      },
    };
  })(),

  // ── Kth Smallest Element in a Sorted Matrix ─────────────────────
  (() => {
    const ref = (matrix: number[][], k: number) => {
      const flat: number[] = [];
      for (let r = 0; r < matrix.length; r++) for (let c = 0; c < matrix[r].length; c++) flat.push(matrix[r][c]);
      flat.sort((a, b) => a - b);
      return flat[k - 1];
    };
    return {
      slug: "kth-smallest-element-in-a-sorted-matrix",
      title: "Kth Smallest Element in a Sorted Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Heap", "Matrix", "Amazon", "Google", "Meta", "Uber"],
      signature: { funcName: "kthSmallest", params: [{ name: "matrix", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an `n × n` matrix where each row and each column is sorted in ascending order, return the `k`-th smallest element **in the matrix**.\n\nNote this is the k-th smallest in sorted order, counting duplicates separately — not the k-th distinct value.",
        [
          { in: "matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8", out: "13", note: "Sorted, the matrix reads 1,5,9,10,11,12,13,13,15." },
          { in: "matrix = [[-5]], k = 1", out: "-5" },
          { in: "matrix = [[1,2],[1,3]], k = 2", out: "1" },
        ],
        ["1 <= matrix.length <= 8", "matrix[i].length == matrix.length", "-1000 <= matrix[i][j] <= 1000", "1 <= k <= n²"],
        "Flattening and sorting is O(n² log n). Can you do it in O(n log(max - min)) using binary search on the answer?"),
      hints: [
        "Flattening and sorting is correct and simple — start there.",
        "A min-heap seeded with the first column pops the smallest element `k` times in O(k log n).",
        "Best: binary search on the **value**, counting how many entries are at most the midpoint using the row/column sortedness.",
      ],
      examples: [
        { input: "[[1,5,9],[10,11,13],[12,13,15]]\n8", expectedOutput: "13" },
        { input: "[[-5]]\n1", expectedOutput: "-5" },
        { input: "[[1,2],[1,3]]\n2", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const matrix: number[][] = [];
        for (let r = 0; r < n; r++) {
          const row: number[] = [];
          for (let c = 0; c < n; c++) {
            const lo = Math.max(c > 0 ? row[c - 1] : -1000, r > 0 ? matrix[r - 1][c] : -1000);
            row.push(ri(rng, lo, 1000));
          }
          matrix.push(row);
        }
        const k = ri(rng, 1, n * n);
        return { input: `${fmtIntMat(matrix)}\n${k}`, expectedOutput: String(ref(matrix, k)) };
      },
      solutions: {
        python: `def kthSmallest(matrix, k: int) -> int:\n    flat = [v for row in matrix for v in row]\n    flat.sort()\n    return flat[k - 1]`,
        javascript: `var kthSmallest = function(matrix, k) {\n    const flat = [];\n    for (let r = 0; r < matrix.length; r++) {\n        for (let c = 0; c < matrix[r].length; c++) flat.push(matrix[r][c]);\n    }\n    flat.sort(function(a, b) { return a - b; });\n    return flat[k - 1];\n};`,
              typescript: `function kthSmallest(matrix: number[][], k: number): number {\n    var flat: number[] = [];\n    for (var r = 0; r < matrix.length; r++) {\n        for (var c = 0; c < matrix[r].length; c++) flat.push(matrix[r][c]);\n    }\n    flat.sort(function (a, b) { return a - b; });\n    return flat[k - 1];\n}`,
              java: `public static int kthSmallest(int[][] matrix, int k) {\n    int n = matrix.length;\n    int[] flat = new int[n * n];\n    int idx = 0;\n    for (int[] row : matrix) {\n        for (int v : row) flat[idx++] = v;\n    }\n    Arrays.sort(flat);\n    return flat[k - 1];\n}`,
              cpp: `int kthSmallest(vector<vector<int>>& matrix, int k) {\n    vector<int> flat;\n    for (const auto& row : matrix) {\n        for (int v : row) flat.push_back(v);\n    }\n    sort(flat.begin(), flat.end());\n    return flat[k - 1];\n}`,
              c: `static int cmpKthAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint kthSmallest(int** matrix, int matrixSize, int* matrixColSize, int k) {\n    int total = 0;\n    for (int r = 0; r < matrixSize; r++) total += matrixColSize[r];\n    int* flat = (int*) malloc((total > 0 ? total : 1) * sizeof(int));\n    int idx = 0;\n    for (int r = 0; r < matrixSize; r++) {\n        for (int c = 0; c < matrixColSize[r]; c++) flat[idx++] = matrix[r][c];\n    }\n    qsort(flat, total, sizeof(int), cmpKthAsc);\n    int answer = flat[k - 1];\n    free(flat);\n    return answer;\n}`,
              csharp: `public static int KthSmallest(int[][] matrix, int k)\n{\n    var flat = new List<int>();\n    foreach (int[] row in matrix)\n    {\n        foreach (int v in row) flat.Add(v);\n    }\n    flat.Sort();\n    return flat[k - 1];\n}`,
              go: `func kthSmallest(matrix [][]int, k int) int {\n	flat := []int{}\n	for _, row := range matrix {\n		flat = append(flat, row...)\n	}\n	sort.Ints(flat)\n	return flat[k-1]\n}`,
              kotlin: `fun kthSmallest(matrix: Array<IntArray>, k: Int): Int {\n    val flat = ArrayList<Int>()\n    for (row in matrix) {\n        for (v in row) flat.add(v)\n    }\n    flat.sort()\n    return flat[k - 1]\n}`,
              swift: `func kthSmallest(_ matrix: [[Int]], _ k: Int) -> Int {\n    var flat: [Int] = []\n    for row in matrix {\n        for v in row { flat.append(v) }\n    }\n    flat.sort()\n    return flat[k - 1]\n}`,
              rust: `fn kthSmallest(matrix: Vec<Vec<i32>>, k: i32) -> i32 {\n    let mut flat: Vec<i32> = Vec::new();\n    for row in matrix.iter() {\n        for v in row.iter() {\n            flat.push(*v);\n        }\n    }\n    flat.sort();\n    flat[(k - 1) as usize]\n}`,
              php: `function kthSmallest($matrix, $k) {\n    $flat = array();\n    foreach ($matrix as $row) {\n        foreach ($row as $v) $flat[] = $v;\n    }\n    sort($flat);\n    return $flat[$k - 1];\n}`,
              ruby: `def kthSmallest(matrix, k)\n  matrix.flatten.sort[k - 1]\nend`,
      },
    };
  })(),

  // ── Find K Closest Elements ─────────────────────────────────────
  (() => {
    const ref = (arr: number[], k: number, x: number) => {
      let lo = 0, hi = arr.length - k;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;
        else hi = mid;
      }
      return arr.slice(lo, lo + k);
    };
    return {
      slug: "find-k-closest-elements",
      title: "Find K Closest Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Sorting", "Heap", "Amazon", "Google", "Meta"],
      signature: { funcName: "findClosestElements", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }, { name: "x", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **sorted** integer array `arr`, and two integers `k` and `x`, return the `k` elements closest to `x`, sorted ascending.\n\nAn element `a` is closer than `b` when `|a - x| < |b - x|`, or when the distances tie and `a < b`.",
        [
          { in: "arr = [1,2,3,4,5], k = 4, x = 3", out: "[1,2,3,4]" },
          { in: "arr = [1,2,3,4,5], k = 4, x = -1", out: "[1,2,3,4]" },
          { in: "arr = [1,1,2,3,4,5], k = 4, x = -1", out: "[1,1,2,3]" },
        ],
        ["1 <= k <= arr.length <= 40", "1 <= arr[i], x <= 10000", "arr is sorted in ascending order."]),
      hints: [
        "The answer is a contiguous window of length `k` — the array is sorted, so the closest elements sit together.",
        "Binary search for the window's left edge among `0 … n - k`.",
        "Compare `x - arr[mid]` with `arr[mid + k] - x`: if the left edge is further away, slide right.",
      ],
      examples: [
        { input: "[1,2,3,4,5]\n4\n3", expectedOutput: "[1,2,3,4]" },
        { input: "[1,2,3,4,5]\n4\n-1", expectedOutput: "[1,2,3,4]" },
        { input: "[1,1,2,3,4,5]\n4\n-1", expectedOutput: "[1,1,2,3]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const arr = randArr(rng, n, 1, rng() < 0.5 ? 50 : 10000).sort((a, b) => a - b);
        const k = ri(rng, 1, n);
        const x = ri(rng, 1, rng() < 0.5 ? 50 : 10000);
        return { input: `${fmtIntArr(arr)}\n${k}\n${x}`, expectedOutput: fmtIntArr(ref(arr, k, x)) };
      },
      solutions: {
        python: `def findClosestElements(arr, k: int, x: int):\n    lo, hi = 0, len(arr) - k\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if x - arr[mid] > arr[mid + k] - x:\n            lo = mid + 1\n        else:\n            hi = mid\n    return arr[lo:lo + k]`,
        javascript: `var findClosestElements = function(arr, k, x) {\n    let lo = 0, hi = arr.length - k;\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    return arr.slice(lo, lo + k);\n};`,
              typescript: `function findClosestElements(arr: number[], k: number, x: number): number[] {\n    var lo = 0;\n    var hi = arr.length - k;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    return arr.slice(lo, lo + k);\n}`,
              java: `public static int[] findClosestElements(int[] arr, int k, int x) {\n    int lo = 0, hi = arr.length - k;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    return Arrays.copyOfRange(arr, lo, lo + k);\n}`,
              cpp: `vector<int> findClosestElements(vector<int>& arr, int k, int x) {\n    int lo = 0, hi = (int) arr.size() - k;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    return vector<int>(arr.begin() + lo, arr.begin() + lo + k);\n}`,
              c: `int* findClosestElements(int* arr, int arrSize, int k, int x, int* returnSize) {\n    int lo = 0, hi = arrSize - k;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    int* out = (int*) malloc((k > 0 ? k : 1) * sizeof(int));\n    for (int i = 0; i < k; i++) out[i] = arr[lo + i];\n    *returnSize = k;\n    return out;\n}`,
              csharp: `public static int[] FindClosestElements(int[] arr, int k, int x)\n{\n    int lo = 0, hi = arr.Length - k;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1;\n        else hi = mid;\n    }\n    int[] out_ = new int[k];\n    Array.Copy(arr, lo, out_, 0, k);\n    return out_;\n}`,
              go: `func findClosestElements(arr []int, k int, x int) []int {\n	lo, hi := 0, len(arr)-k\n	for lo < hi {\n		mid := (lo + hi) / 2\n		if x-arr[mid] > arr[mid+k]-x {\n			lo = mid + 1\n		} else {\n			hi = mid\n		}\n	}\n	return arr[lo : lo+k]\n}`,
              kotlin: `fun findClosestElements(arr: IntArray, k: Int, x: Int): IntArray {\n    var lo = 0\n    var hi = arr.size - k\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (x - arr[mid] > arr[mid + k] - x) lo = mid + 1 else hi = mid\n    }\n    return arr.copyOfRange(lo, lo + k)\n}`,
              swift: `func findClosestElements(_ arr: [Int], _ k: Int, _ x: Int) -> [Int] {\n    var lo = 0\n    var hi = arr.count - k\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if x - arr[mid] > arr[mid + k] - x {\n            lo = mid + 1\n        } else {\n            hi = mid\n        }\n    }\n    return Array(arr[lo..<(lo + k)])\n}`,
              rust: `fn findClosestElements(arr: Vec<i32>, k: i32, x: i32) -> Vec<i32> {\n    let ks = k as usize;\n    let mut lo = 0usize;\n    let mut hi = arr.len() - ks;\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if x - arr[mid] > arr[mid + ks] - x {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    arr[lo..lo + ks].to_vec()\n}`,
              php: `function findClosestElements($arr, $k, $x) {\n    $lo = 0;\n    $hi = count($arr) - $k;\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($x - $arr[$mid] > $arr[$mid + $k] - $x) $lo = $mid + 1;\n        else $hi = $mid;\n    }\n    return array_slice($arr, $lo, $k);\n}`,
              ruby: `def findClosestElements(arr, k, x)\n  lo = 0\n  hi = arr.length - k\n  while lo < hi\n    mid = (lo + hi) / 2\n    if x - arr[mid] > arr[mid + k] - x\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  arr[lo, k]\nend`,
      },
    };
  })(),

  // ── Minimum Absolute Difference ─────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const sorted = arr.slice().sort((a, b) => a - b);
      let best = Infinity;
      for (let i = 1; i < sorted.length; i++) {
        const d = sorted[i] - sorted[i - 1];
        if (d < best) best = d;
      }
      const out: number[][] = [];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === best) out.push([sorted[i - 1], sorted[i]]);
      }
      return out;
    };
    return {
      slug: "minimum-absolute-difference",
      title: "Minimum Absolute Difference",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "minimumAbsDifference", params: [{ name: "arr", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array of **distinct** integers `arr`, find all pairs of elements with the minimum absolute difference between them.\n\nReturn the pairs in ascending order, each pair written as `[a, b]` with `a < b`.",
        [
          { in: "arr = [4,2,1,3]", out: "[[1,2],[2,3],[3,4]]", note: "The minimum difference is 1." },
          { in: "arr = [1,3,6,10,15]", out: "[[1,3]]" },
          { in: "arr = [3,8,-10,23,19,-4,-14,27]", out: "[[-14,-10],[19,23],[23,27]]" },
        ],
        ["2 <= arr.length <= 40", "-1000000 <= arr[i] <= 1000000", "All elements are distinct."]),
      hints: [
        "After sorting, the minimum difference must occur between **adjacent** elements.",
        "One pass finds the minimum gap; a second collects every adjacent pair achieving it.",
        "Sorting also gives the required output order for free.",
      ],
      examples: [
        { input: "[4,2,1,3]", expectedOutput: "[[1,2],[2,3],[3,4]]" },
        { input: "[1,3,6,10,15]", expectedOutput: "[[1,3]]" },
        { input: "[3,8,-10,23,19,-4,-14,27]", expectedOutput: "[[-14,-10],[19,23],[23,27]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const values = new Set<number>();
        const hi = rng() < 0.5 ? 60 : 1000000;
        while (values.size < n) values.add(ri(rng, -hi, hi));
        const arr = shuffle(rng, Array.from(values));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntMat(ref(arr)) };
      },
      solutions: {
        python: `def minimumAbsDifference(arr):\n    ordered = sorted(arr)\n    best = min(ordered[i] - ordered[i - 1] for i in range(1, len(ordered)))\n    return [[ordered[i - 1], ordered[i]] for i in range(1, len(ordered))\n            if ordered[i] - ordered[i - 1] == best]`,
        javascript: `var minimumAbsDifference = function(arr) {\n    const sorted = arr.slice().sort(function(a, b) { return a - b; });\n    let best = Infinity;\n    for (let i = 1; i < sorted.length; i++) {\n        const d = sorted[i] - sorted[i - 1];\n        if (d < best) best = d;\n    }\n    const out = [];\n    for (let i = 1; i < sorted.length; i++) {\n        if (sorted[i] - sorted[i - 1] === best) out.push([sorted[i - 1], sorted[i]]);\n    }\n    return out;\n};`,
              typescript: `function minimumAbsDifference(arr: number[]): number[][] {\n    var s = arr.slice().sort(function (a, b) { return a - b; });\n    var best = s[1] - s[0];\n    for (var i = 2; i < s.length; i++) {\n        var d = s[i] - s[i - 1];\n        if (d < best) best = d;\n    }\n    var out: number[][] = [];\n    for (var j = 1; j < s.length; j++) {\n        if (s[j] - s[j - 1] === best) out.push([s[j - 1], s[j]]);\n    }\n    return out;\n}`,
              java: `public static int[][] minimumAbsDifference(int[] arr) {\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    int best = s[1] - s[0];\n    for (int i = 2; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);\n    List<int[]> out = new ArrayList<>();\n    for (int i = 1; i < s.length; i++) {\n        if (s[i] - s[i - 1] == best) out.add(new int[]{s[i - 1], s[i]});\n    }\n    return out.toArray(new int[0][]);\n}`,
              cpp: `vector<vector<int>> minimumAbsDifference(vector<int>& arr) {\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    int best = s[1] - s[0];\n    for (int i = 2; i < (int) s.size(); i++) best = min(best, s[i] - s[i - 1]);\n    vector<vector<int>> out;\n    for (int i = 1; i < (int) s.size(); i++) {\n        if (s[i] - s[i - 1] == best) out.push_back(vector<int>{s[i - 1], s[i]});\n    }\n    return out;\n}`,
              c: `static int cmpAbsDiffAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint** minimumAbsDifference(int* arr, int arrSize, int* returnSize, int** returnColumnSizes) {\n    int* s = (int*) malloc((size_t) arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, arrSize, sizeof(int), cmpAbsDiffAsc);\n    int best = s[1] - s[0];\n    for (int i = 2; i < arrSize; i++) {\n        if (s[i] - s[i - 1] < best) best = s[i] - s[i - 1];\n    }\n    int** out = (int**) malloc((size_t) arrSize * sizeof(int*));\n    int* cols = (int*) malloc((size_t) arrSize * sizeof(int));\n    int count = 0;\n    for (int i = 1; i < arrSize; i++) {\n        if (s[i] - s[i - 1] == best) {\n            int* row = (int*) malloc(2 * sizeof(int));\n            row[0] = s[i - 1];\n            row[1] = s[i];\n            out[count] = row;\n            cols[count] = 2;\n            count++;\n        }\n    }\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] MinimumAbsDifference(int[] arr)\n{\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    int best = s[1] - s[0];\n    for (int i = 2; i < s.Length; i++) best = Math.Min(best, s[i] - s[i - 1]);\n    var out_ = new List<int[]>();\n    for (int i = 1; i < s.Length; i++)\n    {\n        if (s[i] - s[i - 1] == best) out_.Add(new int[] { s[i - 1], s[i] });\n    }\n    return out_.ToArray();\n}`,
              go: `func minimumAbsDifference(arr []int) [][]int {\n	s := append([]int{}, arr...)\n	sort.Ints(s)\n	best := s[1] - s[0]\n	for i := 2; i < len(s); i++ {\n		if s[i]-s[i-1] < best {\n			best = s[i] - s[i-1]\n		}\n	}\n	out := [][]int{}\n	for i := 1; i < len(s); i++ {\n		if s[i]-s[i-1] == best {\n			out = append(out, []int{s[i-1], s[i]})\n		}\n	}\n	return out\n}`,
              kotlin: `fun minimumAbsDifference(arr: IntArray): Array<IntArray> {\n    val s = arr.sortedArray()\n    var best = s[1] - s[0]\n    for (i in 2 until s.size) {\n        if (s[i] - s[i - 1] < best) best = s[i] - s[i - 1]\n    }\n    val out = ArrayList<IntArray>()\n    for (i in 1 until s.size) {\n        if (s[i] - s[i - 1] == best) out.add(intArrayOf(s[i - 1], s[i]))\n    }\n    return out.toTypedArray()\n}`,
              swift: `func minimumAbsDifference(_ arr: [Int]) -> [[Int]] {\n    let s = arr.sorted()\n    var best = s[1] - s[0]\n    for i in 2..<max(s.count, 2) where i < s.count {\n        if s[i] - s[i - 1] < best { best = s[i] - s[i - 1] }\n    }\n    var out: [[Int]] = []\n    for i in 1..<s.count {\n        if s[i] - s[i - 1] == best { out.append([s[i - 1], s[i]]) }\n    }\n    return out\n}`,
              rust: `fn minimumAbsDifference(arr: Vec<i32>) -> Vec<Vec<i32>> {\n    let mut s = arr.clone();\n    s.sort();\n    let mut best = s[1] - s[0];\n    for i in 2..s.len() {\n        if s[i] - s[i - 1] < best {\n            best = s[i] - s[i - 1];\n        }\n    }\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for i in 1..s.len() {\n        if s[i] - s[i - 1] == best {\n            out.push(vec![s[i - 1], s[i]]);\n        }\n    }\n    out\n}`,
              php: `function minimumAbsDifference($arr) {\n    $s = $arr;\n    sort($s);\n    $best = $s[1] - $s[0];\n    for ($i = 2; $i < count($s); $i++) {\n        if ($s[$i] - $s[$i - 1] < $best) $best = $s[$i] - $s[$i - 1];\n    }\n    $out = array();\n    for ($i = 1; $i < count($s); $i++) {\n        if ($s[$i] - $s[$i - 1] === $best) $out[] = array($s[$i - 1], $s[$i]);\n    }\n    return $out;\n}`,
              ruby: `def minimumAbsDifference(arr)\n  s = arr.sort\n  best = (1...s.length).map { |i| s[i] - s[i - 1] }.min\n  (1...s.length).select { |i| s[i] - s[i - 1] == best }.map { |i| [s[i - 1], s[i]] }\nend`,
      },
    };
  })(),

  // ── Maximum Product of Three Numbers ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice().sort((x, y) => x - y);
      const n = a.length;
      const highThree = a[n - 1] * a[n - 2] * a[n - 3];
      const twoLow = a[0] * a[1] * a[n - 1];
      return Math.max(highThree, twoLow);
    };
    return {
      slug: "maximum-product-of-three-numbers",
      title: "Maximum Product of Three Numbers",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Sorting", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "maximumProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, find three numbers whose product is maximum and return that product.",
        [
          { in: "nums = [1,2,3]", out: "6" },
          { in: "nums = [1,2,3,4]", out: "24" },
          { in: "nums = [-100,-98,-1,2,3,4]", out: "39200", note: "Two large negatives multiply to a large positive." },
        ],
        ["3 <= nums.length <= 40", "-1000 <= nums[i] <= 1000", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Sorting makes both candidates obvious.",
        "Either the three largest values win, or the two most negative values pair with the single largest.",
        "Take the maximum of those two products — nothing else can beat them.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "6" },
        { input: "[1,2,3,4]", expectedOutput: "24" },
        { input: "[-100,-98,-1,2,3,4]", expectedOutput: "39200" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 3, 40), -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maximumProduct(nums) -> int:\n    a = sorted(nums)\n    return max(a[-1] * a[-2] * a[-3], a[0] * a[1] * a[-1])`,
        javascript: `var maximumProduct = function(nums) {\n    const a = nums.slice().sort(function(x, y) { return x - y; });\n    const n = a.length;\n    const highThree = a[n - 1] * a[n - 2] * a[n - 3];\n    const twoLow = a[0] * a[1] * a[n - 1];\n    return Math.max(highThree, twoLow);\n};`,
              typescript: `function maximumProduct(nums: number[]): number {\n    var a = nums.slice().sort(function (x, y) { return x - y; });\n    var n = a.length;\n    var highThree = a[n - 1] * a[n - 2] * a[n - 3];\n    var twoLow = a[0] * a[1] * a[n - 1];\n    return Math.max(highThree, twoLow);\n}`,
              java: `public static int maximumProduct(int[] nums) {\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int n = a.length;\n    return Math.max(a[n - 1] * a[n - 2] * a[n - 3], a[0] * a[1] * a[n - 1]);\n}`,
              cpp: `int maximumProduct(vector<int>& nums) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int n = (int) a.size();\n    return max(a[n - 1] * a[n - 2] * a[n - 3], a[0] * a[1] * a[n - 1]);\n}`,
              c: `static int cmpProdAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maximumProduct(int* nums, int numsSize) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, numsSize, sizeof(int), cmpProdAsc);\n    int n = numsSize;\n    int highThree = a[n - 1] * a[n - 2] * a[n - 3];\n    int twoLow = a[0] * a[1] * a[n - 1];\n    free(a);\n    return highThree > twoLow ? highThree : twoLow;\n}`,
              csharp: `public static int MaximumProduct(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int n = a.Length;\n    return Math.Max(a[n - 1] * a[n - 2] * a[n - 3], a[0] * a[1] * a[n - 1]);\n}`,
              go: `func maximumProduct(nums []int) int {\n	a := append([]int{}, nums...)\n	sort.Ints(a)\n	n := len(a)\n	highThree := a[n-1] * a[n-2] * a[n-3]\n	twoLow := a[0] * a[1] * a[n-1]\n	if highThree > twoLow {\n		return highThree\n	}\n	return twoLow\n}`,
              kotlin: `fun maximumProduct(nums: IntArray): Int {\n    val a = nums.sortedArray()\n    val n = a.size\n    val highThree = a[n - 1] * a[n - 2] * a[n - 3]\n    val twoLow = a[0] * a[1] * a[n - 1]\n    return if (highThree > twoLow) highThree else twoLow\n}`,
              swift: `func maximumProduct(_ nums: [Int]) -> Int {\n    let a = nums.sorted()\n    let n = a.count\n    return max(a[n - 1] * a[n - 2] * a[n - 3], a[0] * a[1] * a[n - 1])\n}`,
              rust: `fn maximumProduct(nums: Vec<i32>) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let n = a.len();\n    let high_three = a[n - 1] * a[n - 2] * a[n - 3];\n    let two_low = a[0] * a[1] * a[n - 1];\n    if high_three > two_low { high_three } else { two_low }\n}`,
              php: `function maximumProduct($nums) {\n    $a = $nums;\n    sort($a);\n    $n = count($a);\n    return max($a[$n - 1] * $a[$n - 2] * $a[$n - 3], $a[0] * $a[1] * $a[$n - 1]);\n}`,
              ruby: `def maximumProduct(nums)\n  a = nums.sort\n  n = a.length\n  [a[n - 1] * a[n - 2] * a[n - 3], a[0] * a[1] * a[n - 1]].max\nend`,
      },
    };
  })(),

  // ── Sort Integers by The Number of 1 Bits ───────────────────────
  (() => {
    const popcount = (x: number) => {
      let count = 0, v = x;
      while (v > 0) { count += v & 1; v >>>= 1; }
      return count;
    };
    const ref = (arr: number[]) =>
      arr.slice().sort((a, b) => {
        const pa = popcount(a), pb = popcount(b);
        return pa !== pb ? pa - pb : a - b;
      });
    return {
      slug: "sort-integers-by-the-number-of-1-bits",
      title: "Sort Integers by The Number of 1 Bits",
      difficulty: "EASY" as const,
      tags: ["Array", "Bit Manipulation", "Sorting", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "sortByBits", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `arr`, sort it in ascending order by the **number of 1 bits** in each value's binary representation. Values with the same bit count are sorted by their numeric value, ascending.",
        [
          { in: "arr = [0,1,2,3,4,5,6,7,8]", out: "[0,1,2,4,8,3,5,6,7]" },
          { in: "arr = [1024,512,256,128,64,32,16,8,4,2,1]", out: "[1,2,4,8,16,32,64,128,256,512,1024]", note: "Every value has exactly one set bit." },
          { in: "arr = [3,5,6]", out: "[3,5,6]" },
        ],
        ["1 <= arr.length <= 40", "0 <= arr[i] <= 10000"]),
      hints: [
        "Count set bits by repeatedly testing the lowest bit and shifting right.",
        "Sort with a comparator: bit count first, then the value itself.",
        "`x & (x - 1)` clears the lowest set bit, giving a loop that runs once per set bit.",
      ],
      examples: [
        { input: "[0,1,2,3,4,5,6,7,8]", expectedOutput: "[0,1,2,4,8,3,5,6,7]" },
        { input: "[1024,512,256,128,64,32,16,8,4,2,1]", expectedOutput: "[1,2,4,8,16,32,64,128,256,512,1024]" },
        { input: "[3,5,6]", expectedOutput: "[3,5,6]" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 40), 0, 10000);
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `def sortByBits(arr):\n    return sorted(arr, key=lambda x: (bin(x).count("1"), x))`,
        javascript: `var sortByBits = function(arr) {\n    const popcount = function(x) {\n        let count = 0, v = x;\n        while (v > 0) {\n            count += v & 1;\n            v >>>= 1;\n        }\n        return count;\n    };\n    return arr.slice().sort(function(a, b) {\n        const pa = popcount(a), pb = popcount(b);\n        return pa !== pb ? pa - pb : a - b;\n    });\n};`,
              typescript: `function sortByBits(arr: number[]): number[] {\n    var popcount = function (x: number): number {\n        var count = 0;\n        var v = x;\n        while (v > 0) {\n            count += v & 1;\n            v >>>= 1;\n        }\n        return count;\n    };\n    return arr.slice().sort(function (a, b) {\n        var pa = popcount(a);\n        var pb = popcount(b);\n        if (pa !== pb) return pa - pb;\n        return a - b;\n    });\n}`,
              java: `public static int[] sortByBits(int[] arr) {\n    Integer[] boxed = new Integer[arr.length];\n    for (int i = 0; i < arr.length; i++) boxed[i] = arr[i];\n    Arrays.sort(boxed, (a, b) -> {\n        int pa = Integer.bitCount(a), pb = Integer.bitCount(b);\n        if (pa != pb) return pa - pb;\n        return a - b;\n    });\n    int[] out = new int[arr.length];\n    for (int i = 0; i < arr.length; i++) out[i] = boxed[i];\n    return out;\n}`,
              cpp: `vector<int> sortByBits(vector<int>& arr) {\n    vector<int> out = arr;\n    sort(out.begin(), out.end(), [](int a, int b) {\n        int pa = __builtin_popcount((unsigned) a);\n        int pb = __builtin_popcount((unsigned) b);\n        if (pa != pb) return pa < pb;\n        return a < b;\n    });\n    return out;\n}`,
              c: `static int popcountBits(int x) {\n    int c = 0;\n    unsigned v = (unsigned) x;\n    while (v > 0) {\n        c += (int) (v & 1u);\n        v >>= 1;\n    }\n    return c;\n}\n\nstatic int cmpByBits(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    int px = popcountBits(x);\n    int py = popcountBits(y);\n    if (px != py) return px - py;\n    return (x > y) - (x < y);\n}\n\nint* sortByBits(int* arr, int arrSize, int* returnSize) {\n    int* out = (int*) malloc((arrSize > 0 ? arrSize : 1) * sizeof(int));\n    for (int i = 0; i < arrSize; i++) out[i] = arr[i];\n    qsort(out, arrSize, sizeof(int), cmpByBits);\n    *returnSize = arrSize;\n    return out;\n}`,
              csharp: `public static int[] SortByBits(int[] arr)\n{\n    Func<int, int> popcount = x =>\n    {\n        int c = 0;\n        uint v = (uint) x;\n        while (v > 0)\n        {\n            c += (int) (v & 1u);\n            v >>= 1;\n        }\n        return c;\n    };\n    var list = new List<int>(arr);\n    list.Sort((a, b) =>\n    {\n        int pa = popcount(a), pb = popcount(b);\n        if (pa != pb) return pa.CompareTo(pb);\n        return a.CompareTo(b);\n    });\n    return list.ToArray();\n}`,
              go: `func sortByBits(arr []int) []int {\n	popcount := func(x int) int {\n		c := 0\n		v := x\n		for v > 0 {\n			c += v & 1\n			v >>= 1\n		}\n		return c\n	}\n	out := append([]int{}, arr...)\n	sort.Slice(out, func(a, b int) bool {\n		pa, pb := popcount(out[a]), popcount(out[b])\n		if pa != pb {\n			return pa < pb\n		}\n		return out[a] < out[b]\n	})\n	return out\n}`,
              kotlin: `fun sortByBits(arr: IntArray): IntArray {\n    fun popcount(x: Int): Int {\n        var c = 0\n        var v = x\n        while (v > 0) {\n            c += v and 1\n            v = v shr 1\n        }\n        return c\n    }\n    val sorted = arr.toTypedArray().sortedWith(Comparator { a, b ->\n        val pa = popcount(a)\n        val pb = popcount(b)\n        if (pa != pb) pa - pb else a - b\n    })\n    return sorted.toIntArray()\n}`,
              swift: `func sortByBits(_ arr: [Int]) -> [Int] {\n    func popcount(_ x: Int) -> Int {\n        var c = 0\n        var v = x\n        while v > 0 {\n            c += v & 1\n            v >>= 1\n        }\n        return c\n    }\n    return arr.sorted { a, b in\n        let pa = popcount(a)\n        let pb = popcount(b)\n        if pa != pb { return pa < pb }\n        return a < b\n    }\n}`,
              rust: `fn popcount_bits(x: i32) -> i32 {\n    let mut c = 0;\n    let mut v = x;\n    while v > 0 {\n        c += v & 1;\n        v >>= 1;\n    }\n    c\n}\n\nfn sortByBits(arr: Vec<i32>) -> Vec<i32> {\n    let mut out = arr.clone();\n    out.sort_by(|a, b| {\n        let pa = popcount_bits(*a);\n        let pb = popcount_bits(*b);\n        if pa != pb {\n            pa.cmp(&pb)\n        } else {\n            a.cmp(b)\n        }\n    });\n    out\n}`,
              php: `function sortByBits($arr) {\n    $popcount = function($x) {\n        $c = 0;\n        $v = $x;\n        while ($v > 0) {\n            $c += $v & 1;\n            $v >>= 1;\n        }\n        return $c;\n    };\n    $out = $arr;\n    usort($out, function($a, $b) use ($popcount) {\n        $pa = $popcount($a);\n        $pb = $popcount($b);\n        if ($pa != $pb) return $pa - $pb;\n        return $a - $b;\n    });\n    return $out;\n}`,
              ruby: `def sortByBits(arr)\n  arr.sort_by { |x| [x.to_s(2).count("1"), x] }\nend`,
      },
    };
  })(),

  // ── Sort Even and Odd Indices Independently ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const evens: number[] = [], odds: number[] = [];
      for (let i = 0; i < nums.length; i++) (i % 2 === 0 ? evens : odds).push(nums[i]);
      evens.sort((a, b) => a - b);
      odds.sort((a, b) => b - a);
      const out: number[] = [];
      for (let i = 0; i < nums.length; i++) out.push(i % 2 === 0 ? evens[i / 2] : odds[(i - 1) / 2]);
      return out;
    };
    return {
      slug: "sort-even-and-odd-indices-independently",
      title: "Sort Even and Odd Indices Independently",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Amazon", "Microsoft"],
      signature: { funcName: "sortEvenOdd", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a 0-indexed integer array `nums`. Rearrange it so that:\n\n1. the values at **odd** indices are sorted in **non-increasing** order;\n2. the values at **even** indices are sorted in **non-decreasing** order.\n\nReturn the resulting array.",
        [
          { in: "nums = [4,1,2,3]", out: "[2,3,4,1]", note: "Even indices hold 2 and 4 ascending; odd indices hold 3 and 1 descending." },
          { in: "nums = [2,1]", out: "[2,1]" },
          { in: "nums = [5,5,5,5]", out: "[5,5,5,5]" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "Split the array by index parity into two lists.",
        "Sort the even-index list ascending and the odd-index list descending.",
        "Then write them back into their original index slots in order.",
      ],
      examples: [
        { input: "[4,1,2,3]", expectedOutput: "[2,3,4,1]" },
        { input: "[2,1]", expectedOutput: "[2,1]" },
        { input: "[5,5,5,5]", expectedOutput: "[5,5,5,5]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.5 ? 8 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def sortEvenOdd(nums):\n    evens = sorted(nums[0::2])\n    odds = sorted(nums[1::2], reverse=True)\n    out = []\n    for i in range(len(nums)):\n        out.append(evens[i // 2] if i % 2 == 0 else odds[i // 2])\n    return out`,
        javascript: `var sortEvenOdd = function(nums) {\n    const evens = [], odds = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (i % 2 === 0) evens.push(nums[i]);\n        else odds.push(nums[i]);\n    }\n    evens.sort(function(a, b) { return a - b; });\n    odds.sort(function(a, b) { return b - a; });\n    const out = [];\n    for (let i = 0; i < nums.length; i++) {\n        out.push(i % 2 === 0 ? evens[i / 2] : odds[(i - 1) / 2]);\n    }\n    return out;\n};`,
              typescript: `function sortEvenOdd(nums: number[]): number[] {\n    var evens: number[] = [];\n    var odds: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        if (i % 2 === 0) evens.push(nums[i]);\n        else odds.push(nums[i]);\n    }\n    evens.sort(function (a, b) { return a - b; });\n    odds.sort(function (a, b) { return b - a; });\n    var out: number[] = [];\n    for (var j = 0; j < nums.length; j++) {\n        out.push(j % 2 === 0 ? evens[j / 2] : odds[(j - 1) / 2]);\n    }\n    return out;\n}`,
              java: `public static int[] sortEvenOdd(int[] nums) {\n    int evenCount = (nums.length + 1) / 2;\n    int oddCount = nums.length / 2;\n    int[] evens = new int[evenCount];\n    int[] odds = new int[oddCount];\n    int e = 0, o = 0;\n    for (int i = 0; i < nums.length; i++) {\n        if (i % 2 == 0) evens[e++] = nums[i];\n        else odds[o++] = nums[i];\n    }\n    Arrays.sort(evens);\n    Arrays.sort(odds);\n    int[] out = new int[nums.length];\n    for (int i = 0; i < nums.length; i++) {\n        out[i] = i % 2 == 0 ? evens[i / 2] : odds[oddCount - 1 - (i - 1) / 2];\n    }\n    return out;\n}`,
              cpp: `vector<int> sortEvenOdd(vector<int>& nums) {\n    vector<int> evens, odds;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (i % 2 == 0) evens.push_back(nums[i]);\n        else odds.push_back(nums[i]);\n    }\n    sort(evens.begin(), evens.end());\n    sort(odds.begin(), odds.end(), greater<int>());\n    vector<int> out;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        out.push_back(i % 2 == 0 ? evens[i / 2] : odds[(i - 1) / 2]);\n    }\n    return out;\n}`,
              c: `static int cmpEvenOddAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int cmpEvenOddDesc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (y > x) - (y < x);\n}\n\nint* sortEvenOdd(int* nums, int numsSize, int* returnSize) {\n    int evenCount = (numsSize + 1) / 2;\n    int oddCount = numsSize / 2;\n    int* evens = (int*) malloc((evenCount > 0 ? evenCount : 1) * sizeof(int));\n    int* odds = (int*) malloc((oddCount > 0 ? oddCount : 1) * sizeof(int));\n    int e = 0, o = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (i % 2 == 0) evens[e++] = nums[i];\n        else odds[o++] = nums[i];\n    }\n    qsort(evens, evenCount, sizeof(int), cmpEvenOddAsc);\n    qsort(odds, oddCount, sizeof(int), cmpEvenOddDesc);\n    int* out = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) {\n        out[i] = i % 2 == 0 ? evens[i / 2] : odds[(i - 1) / 2];\n    }\n    free(evens);\n    free(odds);\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] SortEvenOdd(int[] nums)\n{\n    var evens = new List<int>();\n    var odds = new List<int>();\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (i % 2 == 0) evens.Add(nums[i]);\n        else odds.Add(nums[i]);\n    }\n    evens.Sort();\n    odds.Sort((a, b) => b.CompareTo(a));\n    int[] out_ = new int[nums.Length];\n    for (int i = 0; i < nums.Length; i++)\n    {\n        out_[i] = i % 2 == 0 ? evens[i / 2] : odds[(i - 1) / 2];\n    }\n    return out_;\n}`,
              go: `func sortEvenOdd(nums []int) []int {\n	evens := []int{}\n	odds := []int{}\n	for i := 0; i < len(nums); i++ {\n		if i%2 == 0 {\n			evens = append(evens, nums[i])\n		} else {\n			odds = append(odds, nums[i])\n		}\n	}\n	sort.Ints(evens)\n	sort.Sort(sort.Reverse(sort.IntSlice(odds)))\n	out := make([]int, len(nums))\n	for i := 0; i < len(nums); i++ {\n		if i%2 == 0 {\n			out[i] = evens[i/2]\n		} else {\n			out[i] = odds[(i-1)/2]\n		}\n	}\n	return out\n}`,
              kotlin: `fun sortEvenOdd(nums: IntArray): IntArray {\n    val evens = ArrayList<Int>()\n    val odds = ArrayList<Int>()\n    for (i in nums.indices) {\n        if (i % 2 == 0) evens.add(nums[i]) else odds.add(nums[i])\n    }\n    evens.sort()\n    odds.sortDescending()\n    val out = IntArray(nums.size)\n    for (i in nums.indices) {\n        out[i] = if (i % 2 == 0) evens[i / 2] else odds[(i - 1) / 2]\n    }\n    return out\n}`,
              swift: `func sortEvenOdd(_ nums: [Int]) -> [Int] {\n    var evens: [Int] = []\n    var odds: [Int] = []\n    for i in 0..<nums.count {\n        if i % 2 == 0 { evens.append(nums[i]) } else { odds.append(nums[i]) }\n    }\n    evens.sort()\n    odds.sort(by: >)\n    var out: [Int] = []\n    for i in 0..<nums.count {\n        out.append(i % 2 == 0 ? evens[i / 2] : odds[(i - 1) / 2])\n    }\n    return out\n}`,
              rust: `fn sortEvenOdd(nums: Vec<i32>) -> Vec<i32> {\n    let mut evens: Vec<i32> = Vec::new();\n    let mut odds: Vec<i32> = Vec::new();\n    for i in 0..nums.len() {\n        if i % 2 == 0 {\n            evens.push(nums[i]);\n        } else {\n            odds.push(nums[i]);\n        }\n    }\n    evens.sort();\n    odds.sort_by(|a, b| b.cmp(a));\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..nums.len() {\n        if i % 2 == 0 {\n            out.push(evens[i / 2]);\n        } else {\n            out.push(odds[(i - 1) / 2]);\n        }\n    }\n    out\n}`,
              php: `function sortEvenOdd($nums) {\n    $evens = array();\n    $odds = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        if ($i % 2 == 0) $evens[] = $nums[$i];\n        else $odds[] = $nums[$i];\n    }\n    sort($evens);\n    rsort($odds);\n    $out = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        $out[] = $i % 2 == 0 ? $evens[intdiv($i, 2)] : $odds[intdiv($i - 1, 2)];\n    }\n    return $out;\n}`,
              ruby: `def sortEvenOdd(nums)\n  evens = nums.each_with_index.select { |_, i| i.even? }.map(&:first).sort\n  odds = nums.each_with_index.select { |_, i| i.odd? }.map(&:first).sort.reverse\n  (0...nums.length).map { |i| i.even? ? evens[i / 2] : odds[(i - 1) / 2] }\nend`,
      },
    };
  })(),

  // ── Minimum Number of Platforms ─────────────────────────────────
  (() => {
    const ref = (arrival: number[], departure: number[]) => {
      const arr = arrival.slice().sort((a, b) => a - b);
      const dep = departure.slice().sort((a, b) => a - b);
      let i = 0, j = 0, platforms = 0, best = 0;
      while (i < arr.length) {
        if (arr[i] <= dep[j]) { platforms++; i++; if (platforms > best) best = platforms; }
        else { platforms--; j++; }
      }
      return best;
    };
    return {
      slug: "minimum-number-of-platforms",
      title: "Minimum Number of Platforms",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Two Pointers", "Amazon", "TCS", "Infosys", "Wipro", "Accenture"],
      signature: { funcName: "findPlatform", params: [{ name: "arrival", type: "int[]" as const }, { name: "departure", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given the arrival and departure times of all the trains that reach a railway station in a day, find the **minimum number of platforms** needed so that no train has to wait.\n\nA platform can hold only one train at a time, and a train arriving at exactly the moment another departs still needs its own platform.",
        [
          { in: "arrival = [900,940,950,1100,1500,1800], departure = [910,1200,1120,1130,1900,2000]", out: "3", note: "Between 950 and 1100 three trains are at the station." },
          { in: "arrival = [900,1100,1235], departure = [1000,1200,1240]", out: "1" },
          { in: "arrival = [100,200], departure = [200,300]", out: "2", note: "The second train arrives exactly as the first departs." },
        ],
        ["1 <= arrival.length <= 40", "departure.length == arrival.length", "0 <= arrival[i] <= departure[i] <= 2359"]),
      hints: [
        "Trains do not need to be matched to each other — only the count present at any moment matters.",
        "Sort the arrivals and the departures **separately** and sweep both with two pointers.",
        "An arrival at or before the next departure occupies a new platform; otherwise a platform frees up.",
      ],
      examples: [
        { input: "[900,940,950,1100,1500,1800]\n[910,1200,1120,1130,1900,2000]", expectedOutput: "3" },
        { input: "[900,1100,1235]\n[1000,1200,1240]", expectedOutput: "1" },
        { input: "[100,200]\n[200,300]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const arrival: number[] = [];
        const departure: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = ri(rng, 0, 2300);
          arrival.push(a);
          departure.push(ri(rng, a, 2359));
        }
        return { input: `${fmtIntArr(arrival)}\n${fmtIntArr(departure)}`, expectedOutput: String(ref(arrival, departure)) };
      },
      solutions: {
        python: `def findPlatform(arrival, departure) -> int:\n    arr = sorted(arrival)\n    dep = sorted(departure)\n    i = j = platforms = best = 0\n    while i < len(arr):\n        if arr[i] <= dep[j]:\n            platforms += 1\n            i += 1\n            best = max(best, platforms)\n        else:\n            platforms -= 1\n            j += 1\n    return best`,
        javascript: `var findPlatform = function(arrival, departure) {\n    const arr = arrival.slice().sort(function(a, b) { return a - b; });\n    const dep = departure.slice().sort(function(a, b) { return a - b; });\n    let i = 0, j = 0, platforms = 0, best = 0;\n    while (i < arr.length) {\n        if (arr[i] <= dep[j]) {\n            platforms++;\n            i++;\n            if (platforms > best) best = platforms;\n        } else {\n            platforms--;\n            j++;\n        }\n    }\n    return best;\n};`,
              typescript: `function findPlatform(arrival: number[], departure: number[]): number {\n    var arr = arrival.slice().sort(function (a, b) { return a - b; });\n    var dep = departure.slice().sort(function (a, b) { return a - b; });\n    var i = 0, j = 0, platforms = 0, best = 0;\n    while (i < arr.length) {\n        if (arr[i] <= dep[j]) {\n            platforms++;\n            i++;\n            if (platforms > best) best = platforms;\n        } else {\n            platforms--;\n            j++;\n        }\n    }\n    return best;\n}`,
              java: `public static int findPlatform(int[] arrival, int[] departure) {\n    int[] arr = arrival.clone();\n    int[] dep = departure.clone();\n    Arrays.sort(arr);\n    Arrays.sort(dep);\n    int i = 0, j = 0, platforms = 0, best = 0;\n    while (i < arr.length) {\n        if (arr[i] <= dep[j]) {\n            platforms++;\n            i++;\n            best = Math.max(best, platforms);\n        } else {\n            platforms--;\n            j++;\n        }\n    }\n    return best;\n}`,
              cpp: `int findPlatform(vector<int>& arrival, vector<int>& departure) {\n    vector<int> arr = arrival;\n    vector<int> dep = departure;\n    sort(arr.begin(), arr.end());\n    sort(dep.begin(), dep.end());\n    int i = 0, j = 0, platforms = 0, best = 0;\n    while (i < (int) arr.size()) {\n        if (arr[i] <= dep[j]) {\n            platforms++;\n            i++;\n            best = max(best, platforms);\n        } else {\n            platforms--;\n            j++;\n        }\n    }\n    return best;\n}`,
              c: `static int cmpPlatformAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findPlatform(int* arrival, int arrivalSize, int* departure, int departureSize) {\n    int* arr = (int*) malloc((arrivalSize > 0 ? arrivalSize : 1) * sizeof(int));\n    int* dep = (int*) malloc((departureSize > 0 ? departureSize : 1) * sizeof(int));\n    for (int i = 0; i < arrivalSize; i++) arr[i] = arrival[i];\n    for (int i = 0; i < departureSize; i++) dep[i] = departure[i];\n    qsort(arr, arrivalSize, sizeof(int), cmpPlatformAsc);\n    qsort(dep, departureSize, sizeof(int), cmpPlatformAsc);\n    int i = 0, j = 0, platforms = 0, best = 0;\n    while (i < arrivalSize) {\n        if (arr[i] <= dep[j]) {\n            platforms++;\n            i++;\n            if (platforms > best) best = platforms;\n        } else {\n            platforms--;\n            j++;\n        }\n    }\n    free(arr);\n    free(dep);\n    return best;\n}`,
              csharp: `public static int FindPlatform(int[] arrival, int[] departure)\n{\n    int[] arr = (int[]) arrival.Clone();\n    int[] dep = (int[]) departure.Clone();\n    Array.Sort(arr);\n    Array.Sort(dep);\n    int i = 0, j = 0, platforms = 0, best = 0;\n    while (i < arr.Length)\n    {\n        if (arr[i] <= dep[j])\n        {\n            platforms++;\n            i++;\n            best = Math.Max(best, platforms);\n        }\n        else\n        {\n            platforms--;\n            j++;\n        }\n    }\n    return best;\n}`,
              go: `func findPlatform(arrival []int, departure []int) int {\n	arr := append([]int{}, arrival...)\n	dep := append([]int{}, departure...)\n	sort.Ints(arr)\n	sort.Ints(dep)\n	i, j, platforms, best := 0, 0, 0, 0\n	for i < len(arr) {\n		if arr[i] <= dep[j] {\n			platforms++\n			i++\n			if platforms > best {\n				best = platforms\n			}\n		} else {\n			platforms--\n			j++\n		}\n	}\n	return best\n}`,
              kotlin: `fun findPlatform(arrival: IntArray, departure: IntArray): Int {\n    val arr = arrival.sortedArray()\n    val dep = departure.sortedArray()\n    var i = 0\n    var j = 0\n    var platforms = 0\n    var best = 0\n    while (i < arr.size) {\n        if (arr[i] <= dep[j]) {\n            platforms++\n            i++\n            if (platforms > best) best = platforms\n        } else {\n            platforms--\n            j++\n        }\n    }\n    return best\n}`,
              swift: `func findPlatform(_ arrival: [Int], _ departure: [Int]) -> Int {\n    let arr = arrival.sorted()\n    let dep = departure.sorted()\n    var i = 0\n    var j = 0\n    var platforms = 0\n    var best = 0\n    while i < arr.count {\n        if arr[i] <= dep[j] {\n            platforms += 1\n            i += 1\n            if platforms > best { best = platforms }\n        } else {\n            platforms -= 1\n            j += 1\n        }\n    }\n    return best\n}`,
              rust: `fn findPlatform(arrival: Vec<i32>, departure: Vec<i32>) -> i32 {\n    let mut arr = arrival.clone();\n    let mut dep = departure.clone();\n    arr.sort();\n    dep.sort();\n    let mut i = 0usize;\n    let mut j = 0usize;\n    let mut platforms = 0;\n    let mut best = 0;\n    while i < arr.len() {\n        if arr[i] <= dep[j] {\n            platforms += 1;\n            i += 1;\n            if platforms > best {\n                best = platforms;\n            }\n        } else {\n            platforms -= 1;\n            j += 1;\n        }\n    }\n    best\n}`,
              php: `function findPlatform($arrival, $departure) {\n    $arr = $arrival;\n    $dep = $departure;\n    sort($arr);\n    sort($dep);\n    $i = 0;\n    $j = 0;\n    $platforms = 0;\n    $best = 0;\n    while ($i < count($arr)) {\n        if ($arr[$i] <= $dep[$j]) {\n            $platforms++;\n            $i++;\n            if ($platforms > $best) $best = $platforms;\n        } else {\n            $platforms--;\n            $j++;\n        }\n    }\n    return $best;\n}`,
              ruby: `def findPlatform(arrival, departure)\n  arr = arrival.sort\n  dep = departure.sort\n  i = 0\n  j = 0\n  platforms = 0\n  best = 0\n  while i < arr.length\n    if arr[i] <= dep[j]\n      platforms += 1\n      i += 1\n      best = platforms if platforms > best\n    else\n      platforms -= 1\n      j += 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),
];
