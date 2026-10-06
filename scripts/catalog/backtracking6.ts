/**
 * Backtracking & search problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Every list answer has one canonical order (named in the statement) that all
 * thirteen solutions produce. String lists are sorted by byte (ASCII) order:
 * C# sorts with `string.CompareOrdinal` and PHP with `SORT_STRING`, because
 * their defaults are culture-aware or numeric-string-aware respectively.
 * Searches keep their generated inputs small; the few with a tiny input space
 * or an inherently exponential case set `hiddenCount`.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** Lexicographic comparison of two int lists (a proper prefix sorts first). */
const cmpList = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length && i < b.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
};
/** Byte-order string comparison (all catalog strings are ASCII). */
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const BACKTRACKING6_PROBLEMS: CatalogProblem[] = [

  // ── Subsets II (LC 90) ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const seen = new Map<string, number[]>();
      for (let mask = 0; mask < 1 << nums.length; mask++) {
        const sub: number[] = [];
        for (let i = 0; i < nums.length; i++) if (mask & (1 << i)) sub.push(nums[i]);
        sub.sort((a, b) => a - b);
        seen.set(sub.join(","), sub);
      }
      return [...seen.values()].sort(cmpList);
    };
    return {
      slug: "subsets-ii",
      title: "Subsets II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Bit Manipulation", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "subsetsWithDup", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "`nums` is an integer array that may contain **repeated** values. Return every subset of it (its power set), with no subset appearing twice. Two subsets are the same when they hold the same values with the same multiplicities, whichever positions they were taken from.\n\n" +
        "Write each subset in **non-decreasing** order, and list the subsets in **lexicographic** order: compare two subsets value by value from the left; when one is a prefix of the other, the shorter one comes first. So the empty subset is always first.",
        [
          { in: "nums = [1,2,2]", out: "[[],[1],[1,2],[1,2,2],[2],[2,2]]", note: "Picking either of the two 2s gives the same subset `[1,2]`, so it is listed once." },
          { in: "nums = [0]", out: "[[],[0]]" },
          { in: "nums = [4,4,1,4]", out: "[[],[1],[1,4],[1,4,4],[1,4,4,4],[4],[4,4],[4,4,4]]" },
        ],
        ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10"]),
      hints: [
        "Sort the array first, so equal values sit next to each other and every subset is built in non-decreasing order.",
        "Build subsets by choosing which index comes next. Record the current subset every time you enter the recursion, before extending it.",
        "At one level of the recursion, try each distinct value only once: skip index `i` when `i > start` and `nums[i] == nums[i - 1]`. Visiting the values in increasing order makes the output lexicographic for free.",
      ],
      editorial: explain({
        idea: "After sorting, a subset is a non-decreasing sequence of values, and a subset is a duplicate exactly when the same value is chosen twice as the *next* element at the same depth. Skipping repeated values at each level removes every duplicate without a hash set.",
        steps: [
          "Sort `nums`.",
          "Run `dfs(start)` with a shared `path`: first append a copy of `path` to the answer.",
          "Then for every `i` from `start` to the end, skip it if `i > start` and `nums[i] == nums[i - 1]`; otherwise push `nums[i]`, call `dfs(i + 1)`, and pop.",
          "Call `dfs(0)` and return the collected subsets.",
        ],
        why: "Each distinct subset, written in sorted order, has exactly one leftmost way of being picked: for each value, take its copies from the earliest equal positions. The skip rule allows only that choice, so every subset is produced exactly once. The order is lexicographic because a subset is emitted before its extensions (a prefix comes first) and the children of a node are explored in increasing order of their next value.",
        time: "O(n · 2^n)",
        space: "O(n) besides the output",
        pitfalls: [
          "The skip test is `i > start`, not `i > 0` — the first copy of a value at a new depth must still be usable, which is how `[2,2]` is formed.",
          "Push a copy of `path`, not `path` itself, or every entry ends up as the same mutated list.",
          "Without sorting, equal values are not adjacent and the skip rule misses duplicates.",
        ],
      }),
      examples: [
        { input: "[1,2,2]", expectedOutput: "[[],[1],[1,2],[1,2,2],[2],[2,2]]" },
        { input: "[0]", expectedOutput: "[[],[0]]" },
        { input: "[4,4,1,4]", expectedOutput: "[[],[1],[1,4],[1,4,4],[1,4,4,4],[4],[4,4],[4,4,4]]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 10]);
        const distinct = n >= 7 ? ri(rng, 1, 3) : ri(rng, 1, n);
        const pool = shuffle(rng, Array.from({ length: 21 }, (_, i) => i - 10)).slice(0, distinct);
        const nums = Array.from({ length: n }, () => pick(rng, pool));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def subsetsWithDup(nums: List[int]) -> List[List[int]]:
              a = sorted(nums)
              out = []
              path = []

              def dfs(start):
                  out.append(path[:])
                  for i in range(start, len(a)):
                      if i > start and a[i] == a[i - 1]:
                          continue
                      path.append(a[i])
                      dfs(i + 1)
                      path.pop()

              dfs(0)
              return out
        `,
        javascript: code`
          var subsetsWithDup = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var out = [];
              var path = [];
              var dfs = function(start) {
                  out.push(path.slice());
                  for (var i = start; i < a.length; i++) {
                      if (i > start && a[i] === a[i - 1]) continue;
                      path.push(a[i]);
                      dfs(i + 1);
                      path.pop();
                  }
              };
              dfs(0);
              return out;
          };
        `,
        typescript: code`
          function subsetsWithDup(nums: number[]): number[][] {
              var a: number[] = nums.slice().sort(function(x, y) { return x - y; });
              var out: number[][] = [];
              var path: number[] = [];
              function dfs(start: number): void {
                  out.push(path.slice());
                  for (var i = start; i < a.length; i++) {
                      if (i > start && a[i] === a[i - 1]) continue;
                      path.push(a[i]);
                      dfs(i + 1);
                      path.pop();
                  }
              }
              dfs(0);
              return out;
          }
        `,
        java: code`
          public static int[][] subsetsWithDup(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              List<int[]> out = new ArrayList<>();
              subsetsDfs(a, 0, new int[a.length], 0, out);
              return out.toArray(new int[0][]);
          }

          static void subsetsDfs(int[] a, int start, int[] path, int len, List<int[]> out) {
              out.add(Arrays.copyOf(path, len));
              for (int i = start; i < a.length; i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  path[len] = a[i];
                  subsetsDfs(a, i + 1, path, len + 1, out);
              }
          }
        `,
        cpp: code`
          void subsetsDfs(vector<int>& a, int start, vector<int>& path, vector<vector<int>>& out) {
              out.push_back(path);
              for (int i = start; i < (int)a.size(); i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  path.push_back(a[i]);
                  subsetsDfs(a, i + 1, path, out);
                  path.pop_back();
              }
          }

          vector<vector<int>> subsetsWithDup(vector<int>& nums) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              vector<vector<int>> out;
              vector<int> path;
              subsetsDfs(a, 0, path, out);
              return out;
          }
        `,
        c: code`
          static int subsetsCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static void subsetsDfs(int* a, int n, int start, int* path, int len, int** out, int* sizes, int* count) {
              int* row = (int*)malloc(sizeof(int) * (len > 0 ? len : 1));
              for (int k = 0; k < len; k++) row[k] = path[k];
              out[*count] = row;
              sizes[*count] = len;
              (*count)++;
              for (int i = start; i < n; i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  path[len] = a[i];
                  subsetsDfs(a, n, i + 1, path, len + 1, out, sizes, count);
              }
          }

          int** subsetsWithDup(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
              int* a = (int*)malloc(sizeof(int) * (numsSize + 1));
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), subsetsCmp);
              int cap = 1 << numsSize;
              int** out = (int**)malloc(sizeof(int*) * cap);
              int* sizes = (int*)malloc(sizeof(int) * cap);
              int* path = (int*)malloc(sizeof(int) * (numsSize + 1));
              int count = 0;
              subsetsDfs(a, numsSize, 0, path, 0, out, sizes, &count);
              free(a);
              free(path);
              *returnSize = count;
              *returnColumnSizes = sizes;
              return out;
          }
        `,
        csharp: code`
          public static int[][] SubsetsWithDup(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              var result = new List<int[]>();
              var path = new List<int>();
              SubsetsDfs(a, 0, path, result);
              return result.ToArray();
          }

          static void SubsetsDfs(int[] a, int start, List<int> path, List<int[]> result)
          {
              result.Add(path.ToArray());
              for (int i = start; i < a.Length; i++)
              {
                  if (i > start && a[i] == a[i - 1]) continue;
                  path.Add(a[i]);
                  SubsetsDfs(a, i + 1, path, result);
                  path.RemoveAt(path.Count - 1);
              }
          }
        `,
        go: code`
          func subsetsWithDup(nums []int) [][]int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	out := [][]int{}
          	path := []int{}
          	var dfs func(start int)
          	dfs = func(start int) {
          		row := make([]int, len(path))
          		copy(row, path)
          		out = append(out, row)
          		for i := start; i < len(a); i++ {
          			if i > start && a[i] == a[i-1] {
          				continue
          			}
          			path = append(path, a[i])
          			dfs(i + 1)
          			path = path[:len(path)-1]
          		}
          	}
          	dfs(0)
          	return out
          }
        `,
        kotlin: code`
          fun subsetsWithDup(nums: IntArray): Array<IntArray> {
              val a = nums.copyOf()
              a.sort()
              val out = ArrayList<IntArray>()
              val path = ArrayList<Int>()
              fun dfs(start: Int) {
                  out.add(path.toIntArray())
                  for (i in start until a.size) {
                      if (i > start && a[i] == a[i - 1]) continue
                      path.add(a[i])
                      dfs(i + 1)
                      path.removeAt(path.size - 1)
                  }
              }
              dfs(0)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func subsetsWithDup(_ nums: [Int]) -> [[Int]] {
              let a = nums.sorted()
              var out = [[Int]]()
              var path = [Int]()
              func dfs(_ start: Int) {
                  out.append(path)
                  var i = start
                  while i < a.count {
                      if i > start && a[i] == a[i - 1] {
                          i += 1
                          continue
                      }
                      path.append(a[i])
                      dfs(i + 1)
                      path.removeLast()
                      i += 1
                  }
              }
              dfs(0)
              return out
          }
        `,
        rust: code`
          fn subsets_dfs(a: &Vec<i32>, start: usize, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              out.push(path.clone());
              for i in start..a.len() {
                  if i > start && a[i] == a[i - 1] {
                      continue;
                  }
                  path.push(a[i]);
                  subsets_dfs(a, i + 1, path, out);
                  path.pop();
              }
          }

          fn subsetsWithDup(nums: Vec<i32>) -> Vec<Vec<i32>> {
              let mut a = nums.clone();
              a.sort();
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut path: Vec<i32> = Vec::new();
              subsets_dfs(&a, 0, &mut path, &mut out);
              out
          }
        `,
        php: code`
          function subsetsWithDup($nums) {
              $a = $nums;
              sort($a);
              $out = [];
              $path = [];
              subsetsDfs($a, 0, $path, $out);
              return $out;
          }

          function subsetsDfs(&$a, $start, &$path, &$out) {
              $out[] = $path;
              $n = count($a);
              for ($i = $start; $i < $n; $i++) {
                  if ($i > $start && $a[$i] == $a[$i - 1]) continue;
                  $path[] = $a[$i];
                  subsetsDfs($a, $i + 1, $path, $out);
                  array_pop($path);
              }
          }
        `,
        ruby: code`
          def subsetsWithDup(nums)
            a = nums.sort
            out = []
            path = []
            dfs = lambda do |start|
              out << path.dup
              (start...a.length).each do |i|
                next if i > start && a[i] == a[i - 1]
                path << a[i]
                dfs.call(i + 1)
                path.pop
              end
            end
            dfs.call(0)
            out
          end
        `,
      },
    };
  })(),

  // ── Permutations II (LC 47) ─────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      // next-permutation walk from the sorted order: an independent check.
      const a = nums.slice().sort((x, y) => x - y);
      const out: number[][] = [a.slice()];
      for (;;) {
        let i = a.length - 2;
        while (i >= 0 && a[i] >= a[i + 1]) i--;
        if (i < 0) break;
        let j = a.length - 1;
        while (a[j] <= a[i]) j--;
        [a[i], a[j]] = [a[j], a[i]];
        for (let l = i + 1, r = a.length - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
        out.push(a.slice());
      }
      return out;
    };
    const distinctPerms = (nums: number[]) => {
      const cnt = new Map<number, number>();
      for (const v of nums) cnt.set(v, (cnt.get(v) || 0) + 1);
      let r = 1;
      for (let i = 2; i <= nums.length; i++) r *= i;
      for (const c of cnt.values()) for (let i = 2; i <= c; i++) r /= i;
      return Math.round(r);
    };
    return {
      slug: "permutations-ii",
      title: "Permutations II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Sorting", "Microsoft", "Meta", "Bloomberg"],
      signature: { funcName: "permuteUnique", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "`nums` may contain repeated values. Return every **distinct** ordering (permutation) of its elements — two orderings that read the same value by value count once, even if they place different copies of a repeated value.\n\n" +
        "List the permutations in **lexicographic** order (compare value by value from the left).",
        [
          { in: "nums = [1,1,2]", out: "[[1,1,2],[1,2,1],[2,1,1]]" },
          { in: "nums = [3,0,3,3]", out: "[[0,3,3,3],[3,0,3,3],[3,3,0,3],[3,3,3,0]]", note: "The three 3s are interchangeable, so only the position of the 0 matters." },
          { in: "nums = [2,-1,5]", out: "[[-1,2,5],[-1,5,2],[2,-1,5],[2,5,-1],[5,-1,2],[5,2,-1]]" },
        ],
        ["1 <= nums.length <= 8", "-10 <= nums[i] <= 10"]),
      hints: [
        "Sort first so that equal values are adjacent and the smallest choice is always tried first.",
        "Fill the permutation one position at a time, marking which indices are already used.",
        "Among equal values, always use the copies in their original left-to-right order: skip index `i` when `nums[i] == nums[i - 1]` and `i - 1` is not yet used. That forbids the swapped twins of a permutation you already built.",
      ],
      editorial: explain({
        idea: "Treat equal values as if they must be placed in index order. Every distinct permutation then has exactly one way to be built, and trying values in increasing order emits them lexicographically.",
        steps: [
          "Sort `nums` and keep a `used` flag per index.",
          "`dfs` fills the next position: for each unused index `i`, skip it if `i > 0`, `nums[i] == nums[i - 1]` and `used[i - 1]` is false.",
          "Otherwise mark `i`, append `nums[i]`, recurse, then undo both.",
          "When the path has length `n`, record a copy.",
        ],
        why: "The skip rule means the copies of one value are always consumed left to right, so two builds that differ only by swapping equal copies cannot both happen — each distinct sequence appears once. Positions are filled left to right and, at each position, candidate values are tried in increasing order, which is exactly lexicographic order of the finished sequences.",
        time: "O(n · n!) in the worst case (all values distinct)",
        space: "O(n) besides the output",
        pitfalls: [
          "Testing `used[i - 1]` instead of `!used[i - 1]` also removes duplicates but emits the permutations in a different order — and is much slower.",
          "Without sorting, equal values are not adjacent and duplicates slip through.",
          "Copy the path when recording it.",
        ],
      }),
      examples: [
        { input: "[1,1,2]", expectedOutput: "[[1,1,2],[1,2,1],[2,1,1]]" },
        { input: "[3,0,3,3]", expectedOutput: "[[0,3,3,3],[3,0,3,3],[3,3,0,3],[3,3,3,0]]" },
        { input: "[2,-1,5]", expectedOutput: "[[-1,2,5],[-1,5,2],[2,-1,5],[2,5,-1],[5,-1,2],[5,2,-1]]" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const n = pick(rng, [1, 2, 3, 4, 4, 5, 5, 6, 7, 8]);
          const distinct = ri(rng, 1, Math.min(n, 5));
          const pool = shuffle(rng, Array.from({ length: 21 }, (_, i) => i - 10)).slice(0, distinct);
          const nums = Array.from({ length: n }, () => pick(rng, pool));
          if (distinctPerms(nums) > 120) continue;
          return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def permuteUnique(nums: List[int]) -> List[List[int]]:
              a = sorted(nums)
              n = len(a)
              used = [False] * n
              out = []
              path = []

              def dfs():
                  if len(path) == n:
                      out.append(path[:])
                      return
                  for i in range(n):
                      if used[i]:
                          continue
                      if i > 0 and a[i] == a[i - 1] and not used[i - 1]:
                          continue
                      used[i] = True
                      path.append(a[i])
                      dfs()
                      path.pop()
                      used[i] = False

              dfs()
              return out
        `,
        javascript: code`
          var permuteUnique = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              var used = new Array(n).fill(false);
              var out = [];
              var path = [];
              var dfs = function() {
                  if (path.length === n) {
                      out.push(path.slice());
                      return;
                  }
                  for (var i = 0; i < n; i++) {
                      if (used[i]) continue;
                      if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) continue;
                      used[i] = true;
                      path.push(a[i]);
                      dfs();
                      path.pop();
                      used[i] = false;
                  }
              };
              dfs();
              return out;
          };
        `,
        typescript: code`
          function permuteUnique(nums: number[]): number[][] {
              var a: number[] = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              var used: boolean[] = [];
              for (var k = 0; k < n; k++) used.push(false);
              var out: number[][] = [];
              var path: number[] = [];
              function dfs(): void {
                  if (path.length === n) {
                      out.push(path.slice());
                      return;
                  }
                  for (var i = 0; i < n; i++) {
                      if (used[i]) continue;
                      if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) continue;
                      used[i] = true;
                      path.push(a[i]);
                      dfs();
                      path.pop();
                      used[i] = false;
                  }
              }
              dfs();
              return out;
          }
        `,
        java: code`
          public static int[][] permuteUnique(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              List<int[]> out = new ArrayList<>();
              permDfs(a, new boolean[a.length], new int[a.length], 0, out);
              return out.toArray(new int[0][]);
          }

          static void permDfs(int[] a, boolean[] used, int[] path, int len, List<int[]> out) {
              if (len == a.length) {
                  out.add(path.clone());
                  return;
              }
              for (int i = 0; i < a.length; i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  used[i] = true;
                  path[len] = a[i];
                  permDfs(a, used, path, len + 1, out);
                  used[i] = false;
              }
          }
        `,
        cpp: code`
          void permDfs(vector<int>& a, vector<bool>& used, vector<int>& path, vector<vector<int>>& out) {
              if (path.size() == a.size()) {
                  out.push_back(path);
                  return;
              }
              for (int i = 0; i < (int)a.size(); i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  used[i] = true;
                  path.push_back(a[i]);
                  permDfs(a, used, path, out);
                  path.pop_back();
                  used[i] = false;
              }
          }

          vector<vector<int>> permuteUnique(vector<int>& nums) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              vector<bool> used(a.size(), false);
              vector<int> path;
              vector<vector<int>> out;
              permDfs(a, used, path, out);
              return out;
          }
        `,
        c: code`
          static int permCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static void permDfs(int* a, int n, bool* used, int* path, int len, int*** out, int* count, int* cap) {
              if (len == n) {
                  if (*count == *cap) {
                      *cap *= 2;
                      *out = (int**)realloc(*out, sizeof(int*) * (*cap));
                  }
                  int* row = (int*)malloc(sizeof(int) * n);
                  for (int k = 0; k < n; k++) row[k] = path[k];
                  (*out)[(*count)++] = row;
                  return;
              }
              for (int i = 0; i < n; i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  used[i] = true;
                  path[len] = a[i];
                  permDfs(a, n, used, path, len + 1, out, count, cap);
                  used[i] = false;
              }
          }

          int** permuteUnique(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), permCmp);
              bool* used = (bool*)calloc(numsSize, sizeof(bool));
              int* path = (int*)malloc(sizeof(int) * numsSize);
              int cap = 16, count = 0;
              int** out = (int**)malloc(sizeof(int*) * cap);
              permDfs(a, numsSize, used, path, 0, &out, &count, &cap);
              int* sizes = (int*)malloc(sizeof(int) * (count > 0 ? count : 1));
              for (int i = 0; i < count; i++) sizes[i] = numsSize;
              free(a);
              free(used);
              free(path);
              *returnSize = count;
              *returnColumnSizes = sizes;
              return out;
          }
        `,
        csharp: code`
          public static int[][] PermuteUnique(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              var result = new List<int[]>();
              PermDfs(a, new bool[a.Length], new int[a.Length], 0, result);
              return result.ToArray();
          }

          static void PermDfs(int[] a, bool[] used, int[] path, int len, List<int[]> result)
          {
              if (len == a.Length)
              {
                  result.Add((int[])path.Clone());
                  return;
              }
              for (int i = 0; i < a.Length; i++)
              {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  used[i] = true;
                  path[len] = a[i];
                  PermDfs(a, used, path, len + 1, result);
                  used[i] = false;
              }
          }
        `,
        go: code`
          func permuteUnique(nums []int) [][]int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	n := len(a)
          	used := make([]bool, n)
          	path := make([]int, 0, n)
          	out := [][]int{}
          	var dfs func()
          	dfs = func() {
          		if len(path) == n {
          			row := make([]int, n)
          			copy(row, path)
          			out = append(out, row)
          			return
          		}
          		for i := 0; i < n; i++ {
          			if used[i] {
          				continue
          			}
          			if i > 0 && a[i] == a[i-1] && !used[i-1] {
          				continue
          			}
          			used[i] = true
          			path = append(path, a[i])
          			dfs()
          			path = path[:len(path)-1]
          			used[i] = false
          		}
          	}
          	dfs()
          	return out
          }
        `,
        kotlin: code`
          fun permuteUnique(nums: IntArray): Array<IntArray> {
              val a = nums.copyOf()
              a.sort()
              val n = a.size
              val used = BooleanArray(n)
              val path = IntArray(n)
              val out = ArrayList<IntArray>()
              fun dfs(len: Int) {
                  if (len == n) {
                      out.add(path.copyOf())
                      return
                  }
                  for (i in 0 until n) {
                      if (used[i]) continue
                      if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue
                      used[i] = true
                      path[len] = a[i]
                      dfs(len + 1)
                      used[i] = false
                  }
              }
              dfs(0)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func permuteUnique(_ nums: [Int]) -> [[Int]] {
              let a = nums.sorted()
              let n = a.count
              var used = [Bool](repeating: false, count: n)
              var path = [Int]()
              var out = [[Int]]()
              func dfs() {
                  if path.count == n {
                      out.append(path)
                      return
                  }
                  for i in 0..<n {
                      if used[i] { continue }
                      if i > 0 && a[i] == a[i - 1] && !used[i - 1] { continue }
                      used[i] = true
                      path.append(a[i])
                      dfs()
                      path.removeLast()
                      used[i] = false
                  }
              }
              dfs()
              return out
          }
        `,
        rust: code`
          fn perm_dfs(a: &Vec<i32>, used: &mut Vec<bool>, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              if path.len() == a.len() {
                  out.push(path.clone());
                  return;
              }
              for i in 0..a.len() {
                  if used[i] {
                      continue;
                  }
                  if i > 0 && a[i] == a[i - 1] && !used[i - 1] {
                      continue;
                  }
                  used[i] = true;
                  path.push(a[i]);
                  perm_dfs(a, used, path, out);
                  path.pop();
                  used[i] = false;
              }
          }

          fn permuteUnique(nums: Vec<i32>) -> Vec<Vec<i32>> {
              let mut a = nums.clone();
              a.sort();
              let mut used = vec![false; a.len()];
              let mut path: Vec<i32> = Vec::new();
              let mut out: Vec<Vec<i32>> = Vec::new();
              perm_dfs(&a, &mut used, &mut path, &mut out);
              out
          }
        `,
        php: code`
          function permuteUnique($nums) {
              $a = $nums;
              sort($a);
              $used = array_fill(0, count($a), false);
              $path = [];
              $out = [];
              permDfs($a, $used, $path, $out);
              return $out;
          }

          function permDfs(&$a, &$used, &$path, &$out) {
              $n = count($a);
              if (count($path) == $n) {
                  $out[] = $path;
                  return;
              }
              for ($i = 0; $i < $n; $i++) {
                  if ($used[$i]) continue;
                  if ($i > 0 && $a[$i] == $a[$i - 1] && !$used[$i - 1]) continue;
                  $used[$i] = true;
                  $path[] = $a[$i];
                  permDfs($a, $used, $path, $out);
                  array_pop($path);
                  $used[$i] = false;
              }
          }
        `,
        ruby: code`
          def permuteUnique(nums)
            a = nums.sort
            n = a.length
            used = Array.new(n, false)
            path = []
            out = []
            dfs = lambda do
              if path.length == n
                out << path.dup
                next
              end
              (0...n).each do |i|
                next if used[i]
                next if i > 0 && a[i] == a[i - 1] && !used[i - 1]
                used[i] = true
                path << a[i]
                dfs.call
                path.pop
                used[i] = false
              end
            end
            dfs.call
            out
          end
        `,
      },
    };
  })(),

  // ── Combination Sum II (LC 40) ──────────────────────────────────
  (() => {
    const ref = (cands: number[], target: number) => {
      // Enumerate how many copies of each distinct value to take.
      const cnt = new Map<number, number>();
      for (const v of cands) cnt.set(v, (cnt.get(v) || 0) + 1);
      const vals = [...cnt.keys()].sort((a, b) => a - b);
      const out: number[][] = [];
      const go = (idx: number, rem: number, path: number[]) => {
        if (rem === 0) { out.push(path.slice()); return; }
        if (idx === vals.length) return;
        const v = vals[idx];
        const maxTake = Math.min(cnt.get(v)!, Math.floor(rem / v));
        for (let t = 0; t <= maxTake; t++) {
          for (let k = 0; k < t; k++) path.push(v);
          go(idx + 1, rem - t * v, path);
          for (let k = 0; k < t; k++) path.pop();
        }
      };
      go(0, target, []);
      return out.sort(cmpList);
    };
    return {
      slug: "combination-sum-ii",
      title: "Combination Sum II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Amazon", "Meta", "LinkedIn"],
      signature: {
        funcName: "combinationSum2",
        params: [{ name: "candidates", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "You are given a list of positive integers `candidates` (values may repeat) and a positive `target`. Return every distinct combination of candidates whose values add up to exactly `target`. Each **position** of `candidates` may be used at most once in a combination, so a value can appear in a combination at most as many times as it appears in the input.\n\n" +
        "Two combinations are the same if they hold the same values with the same multiplicities; list each only once. Write each combination in **non-decreasing** order and list the combinations in **lexicographic** order. If there is none, return an empty list.",
        [
          { in: "candidates = [3,1,4,1,5,2], target = 6", out: "[[1,1,4],[1,2,3],[1,5],[2,4]]" },
          { in: "candidates = [2,2,2,2], target = 5", out: "[]", note: "Sums of 2s are always even." },
          { in: "candidates = [4,2,6], target = 6", out: "[[2,4],[6]]" },
        ],
        ["1 <= candidates.length <= 100", "1 <= candidates[i] <= 50", "1 <= target <= 30"]),
      hints: [
        "Sort the candidates. Once a candidate exceeds what is left of the target, so does every later one.",
        "Choose the next element of the combination by index, always moving forward so each position is used at most once.",
        "To avoid duplicate combinations, at a single recursion depth use each distinct value once: skip `i` when `i > start` and `candidates[i] == candidates[i - 1]`.",
      ],
      editorial: explain({
        idea: "This is Subsets II restricted to subsets with the right sum: after sorting, skipping repeated values at the same depth makes each combination appear once, and the positive values let the search stop early.",
        steps: [
          "Sort `candidates`.",
          "`dfs(start, remaining)`: if `remaining == 0`, record a copy of the path.",
          "Otherwise for `i` from `start`: skip duplicates at this depth; if `candidates[i] > remaining`, stop the loop; else push it, call `dfs(i + 1, remaining - candidates[i])`, pop.",
          "Return what was recorded.",
        ],
        why: "Moving to `i + 1` uses each position at most once, and the duplicate skip lets only the leftmost copy of a value start a branch at a given depth, so each multiset is built exactly once. Values are tried in increasing order at every depth, and no combination is a prefix of another (all have the same positive sum), so the output comes out lexicographically sorted.",
        time: "O(2^n · n) in the worst case; the sum bound prunes most branches",
        space: "O(target) recursion depth besides the output",
        pitfalls: [
          "Recursing on `i` instead of `i + 1` reuses the same position (that is Combination Sum I).",
          "`break` rather than `continue` when a value is too big — the array is sorted, so the rest are too big as well.",
          "Return an empty list, not `[[]]`, when nothing sums to the target.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5,2]\n6", expectedOutput: "[[1,1,4],[1,2,3],[1,5],[2,4]]" },
        { input: "[2,2,2,2]\n5", expectedOutput: "[]" },
        { input: "[4,2,6]\n6", expectedOutput: "[[2,4],[6]]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 6), ri(rng, 6, 12), ri(rng, 12, 25), ri(rng, 25, 100)]);
        const hi = n > 25 ? pick(rng, [30, 50]) : pick(rng, [5, 10, 20, 50]);
        const cands = Array.from({ length: n }, () => ri(rng, 1, hi));
        let target = ri(rng, 1, n > 25 ? 20 : 30);
        if (rng() < 0.6) {
          // Aim at a reachable sum: a few candidates added together.
          const take = shuffle(rng, cands.slice()).slice(0, ri(rng, 1, Math.min(4, n)));
          const sum = take.reduce((a, b) => a + b, 0);
          if (sum <= 30) target = sum;
        }
        return { input: `${fmtIntArr(cands)}\n${target}`, expectedOutput: fmtIntMat(ref(cands, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def combinationSum2(candidates: List[int], target: int) -> List[List[int]]:
              a = sorted(candidates)
              out = []
              path = []

              def dfs(start, rem):
                  if rem == 0:
                      out.append(path[:])
                      return
                  for i in range(start, len(a)):
                      if i > start and a[i] == a[i - 1]:
                          continue
                      if a[i] > rem:
                          break
                      path.append(a[i])
                      dfs(i + 1, rem - a[i])
                      path.pop()

              dfs(0, target)
              return out
        `,
        javascript: code`
          var combinationSum2 = function(candidates, target) {
              var a = candidates.slice().sort(function(x, y) { return x - y; });
              var out = [];
              var path = [];
              var dfs = function(start, rem) {
                  if (rem === 0) {
                      out.push(path.slice());
                      return;
                  }
                  for (var i = start; i < a.length; i++) {
                      if (i > start && a[i] === a[i - 1]) continue;
                      if (a[i] > rem) break;
                      path.push(a[i]);
                      dfs(i + 1, rem - a[i]);
                      path.pop();
                  }
              };
              dfs(0, target);
              return out;
          };
        `,
        typescript: code`
          function combinationSum2(candidates: number[], target: number): number[][] {
              var a: number[] = candidates.slice().sort(function(x, y) { return x - y; });
              var out: number[][] = [];
              var path: number[] = [];
              function dfs(start: number, rem: number): void {
                  if (rem === 0) {
                      out.push(path.slice());
                      return;
                  }
                  for (var i = start; i < a.length; i++) {
                      if (i > start && a[i] === a[i - 1]) continue;
                      if (a[i] > rem) break;
                      path.push(a[i]);
                      dfs(i + 1, rem - a[i]);
                      path.pop();
                  }
              }
              dfs(0, target);
              return out;
          }
        `,
        java: code`
          public static int[][] combinationSum2(int[] candidates, int target) {
              int[] a = candidates.clone();
              Arrays.sort(a);
              List<int[]> out = new ArrayList<>();
              comboDfs(a, 0, target, new int[a.length], 0, out);
              return out.toArray(new int[0][]);
          }

          static void comboDfs(int[] a, int start, int rem, int[] path, int len, List<int[]> out) {
              if (rem == 0) {
                  out.add(Arrays.copyOf(path, len));
                  return;
              }
              for (int i = start; i < a.length; i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  if (a[i] > rem) break;
                  path[len] = a[i];
                  comboDfs(a, i + 1, rem - a[i], path, len + 1, out);
              }
          }
        `,
        cpp: code`
          void comboDfs(vector<int>& a, int start, int rem, vector<int>& path, vector<vector<int>>& out) {
              if (rem == 0) {
                  out.push_back(path);
                  return;
              }
              for (int i = start; i < (int)a.size(); i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  if (a[i] > rem) break;
                  path.push_back(a[i]);
                  comboDfs(a, i + 1, rem - a[i], path, out);
                  path.pop_back();
              }
          }

          vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
              vector<int> a(candidates.begin(), candidates.end());
              sort(a.begin(), a.end());
              vector<vector<int>> out;
              vector<int> path;
              comboDfs(a, 0, target, path, out);
              return out;
          }
        `,
        c: code`
          static int comboCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static void comboDfs(int* a, int n, int start, int rem, int* path, int len,
                               int*** out, int** sizes, int* count, int* cap) {
              if (rem == 0) {
                  if (*count == *cap) {
                      *cap *= 2;
                      *out = (int**)realloc(*out, sizeof(int*) * (*cap));
                      *sizes = (int*)realloc(*sizes, sizeof(int) * (*cap));
                  }
                  int* row = (int*)malloc(sizeof(int) * (len > 0 ? len : 1));
                  for (int k = 0; k < len; k++) row[k] = path[k];
                  (*out)[*count] = row;
                  (*sizes)[*count] = len;
                  (*count)++;
                  return;
              }
              for (int i = start; i < n; i++) {
                  if (i > start && a[i] == a[i - 1]) continue;
                  if (a[i] > rem) break;
                  path[len] = a[i];
                  comboDfs(a, n, i + 1, rem - a[i], path, len + 1, out, sizes, count, cap);
              }
          }

          int** combinationSum2(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {
              int* a = (int*)malloc(sizeof(int) * candidatesSize);
              for (int i = 0; i < candidatesSize; i++) a[i] = candidates[i];
              qsort(a, candidatesSize, sizeof(int), comboCmp);
              int* path = (int*)malloc(sizeof(int) * (candidatesSize + 1));
              int cap = 16, count = 0;
              int** out = (int**)malloc(sizeof(int*) * cap);
              int* sizes = (int*)malloc(sizeof(int) * cap);
              comboDfs(a, candidatesSize, 0, target, path, 0, &out, &sizes, &count, &cap);
              free(a);
              free(path);
              *returnSize = count;
              *returnColumnSizes = sizes;
              return out;
          }
        `,
        csharp: code`
          public static int[][] CombinationSum2(int[] candidates, int target)
          {
              int[] a = (int[])candidates.Clone();
              Array.Sort(a);
              var result = new List<int[]>();
              ComboDfs(a, 0, target, new List<int>(), result);
              return result.ToArray();
          }

          static void ComboDfs(int[] a, int start, int rem, List<int> path, List<int[]> result)
          {
              if (rem == 0)
              {
                  result.Add(path.ToArray());
                  return;
              }
              for (int i = start; i < a.Length; i++)
              {
                  if (i > start && a[i] == a[i - 1]) continue;
                  if (a[i] > rem) break;
                  path.Add(a[i]);
                  ComboDfs(a, i + 1, rem - a[i], path, result);
                  path.RemoveAt(path.Count - 1);
              }
          }
        `,
        go: code`
          func combinationSum2(candidates []int, target int) [][]int {
          	a := make([]int, len(candidates))
          	copy(a, candidates)
          	sort.Ints(a)
          	out := [][]int{}
          	path := []int{}
          	var dfs func(start, rem int)
          	dfs = func(start, rem int) {
          		if rem == 0 {
          			row := make([]int, len(path))
          			copy(row, path)
          			out = append(out, row)
          			return
          		}
          		for i := start; i < len(a); i++ {
          			if i > start && a[i] == a[i-1] {
          				continue
          			}
          			if a[i] > rem {
          				break
          			}
          			path = append(path, a[i])
          			dfs(i+1, rem-a[i])
          			path = path[:len(path)-1]
          		}
          	}
          	dfs(0, target)
          	return out
          }
        `,
        kotlin: code`
          fun combinationSum2(candidates: IntArray, target: Int): Array<IntArray> {
              val a = candidates.copyOf()
              a.sort()
              val out = ArrayList<IntArray>()
              val path = ArrayList<Int>()
              fun dfs(start: Int, rem: Int) {
                  if (rem == 0) {
                      out.add(path.toIntArray())
                      return
                  }
                  for (i in start until a.size) {
                      if (i > start && a[i] == a[i - 1]) continue
                      if (a[i] > rem) break
                      path.add(a[i])
                      dfs(i + 1, rem - a[i])
                      path.removeAt(path.size - 1)
                  }
              }
              dfs(0, target)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func combinationSum2(_ candidates: [Int], _ target: Int) -> [[Int]] {
              let a = candidates.sorted()
              var out = [[Int]]()
              var path = [Int]()
              func dfs(_ start: Int, _ rem: Int) {
                  if rem == 0 {
                      out.append(path)
                      return
                  }
                  var i = start
                  while i < a.count {
                      if i > start && a[i] == a[i - 1] {
                          i += 1
                          continue
                      }
                      if a[i] > rem { break }
                      path.append(a[i])
                      dfs(i + 1, rem - a[i])
                      path.removeLast()
                      i += 1
                  }
              }
              dfs(0, target)
              return out
          }
        `,
        rust: code`
          fn combo_dfs(a: &Vec<i32>, start: usize, rem: i32, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              if rem == 0 {
                  out.push(path.clone());
                  return;
              }
              for i in start..a.len() {
                  if i > start && a[i] == a[i - 1] {
                      continue;
                  }
                  if a[i] > rem {
                      break;
                  }
                  path.push(a[i]);
                  combo_dfs(a, i + 1, rem - a[i], path, out);
                  path.pop();
              }
          }

          fn combinationSum2(candidates: Vec<i32>, target: i32) -> Vec<Vec<i32>> {
              let mut a = candidates.clone();
              a.sort();
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut path: Vec<i32> = Vec::new();
              combo_dfs(&a, 0, target, &mut path, &mut out);
              out
          }
        `,
        php: code`
          function combinationSum2($candidates, $target) {
              $a = $candidates;
              sort($a);
              $out = [];
              $path = [];
              comboDfs($a, 0, $target, $path, $out);
              return $out;
          }

          function comboDfs(&$a, $start, $rem, &$path, &$out) {
              if ($rem == 0) {
                  $out[] = $path;
                  return;
              }
              $n = count($a);
              for ($i = $start; $i < $n; $i++) {
                  if ($i > $start && $a[$i] == $a[$i - 1]) continue;
                  if ($a[$i] > $rem) break;
                  $path[] = $a[$i];
                  comboDfs($a, $i + 1, $rem - $a[$i], $path, $out);
                  array_pop($path);
              }
          }
        `,
        ruby: code`
          def combinationSum2(candidates, target)
            a = candidates.sort
            out = []
            path = []
            dfs = lambda do |start, rem|
              if rem == 0
                out << path.dup
                next
              end
              i = start
              while i < a.length
                if i > start && a[i] == a[i - 1]
                  i += 1
                  next
                end
                break if a[i] > rem
                path << a[i]
                dfs.call(i + 1, rem - a[i])
                path.pop
                i += 1
              end
            end
            dfs.call(0, target)
            out
          end
        `,
      },
    };
  })(),

  // ── Combination Sum III (LC 216) ────────────────────────────────
  (() => {
    const ref = (k: number, n: number) => {
      const out: number[][] = [];
      for (let mask = 0; mask < 512; mask++) {
        const pickd: number[] = [];
        let sum = 0;
        for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) { pickd.push(d); sum += d; }
        if (pickd.length === k && sum === n) out.push(pickd);
      }
      return out.sort(cmpList);
    };
    return {
      slug: "combination-sum-iii",
      title: "Combination Sum III",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "combinationSum3",
        params: [{ name: "k", type: "int" as const }, { name: "n", type: "int" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "Find every way to choose exactly `k` **different** digits from `1` to `9` whose sum is exactly `n`. Each digit may be used at most once in a combination.\n\n" +
        "Write each combination in **increasing** order and list the combinations in **lexicographic** order. Return an empty list if no combination works.",
        [
          { in: "k = 3, n = 7", out: "[[1,2,4]]" },
          { in: "k = 3, n = 9", out: "[[1,2,6],[1,3,5],[2,3,4]]" },
          { in: "k = 4, n = 1", out: "[]", note: "Four different digits add up to at least 1 + 2 + 3 + 4 = 10." },
        ],
        ["2 <= k <= 9", "1 <= n <= 60"]),
      hints: [
        "There are only nine digits, so a search over \"take it or not\" for each digit is tiny.",
        "Pick the digits in increasing order: after choosing `d`, only digits greater than `d` may follow. That makes every combination unique and already sorted.",
        "Stop a branch as soon as the running sum passes `n` or the count reaches `k`.",
      ],
      editorial: explain({
        idea: "Choose digits in strictly increasing order with a depth-first search. Each combination is generated once, already sorted, and the branches come out in lexicographic order.",
        steps: [
          "`dfs(next, remaining, path)`: if `path` has `k` digits, record it when `remaining == 0` and return.",
          "Otherwise try each digit `d` from `next` to 9; stop when `d > remaining` (larger digits only overshoot).",
          "Push `d`, recurse with `d + 1` and `remaining - d`, pop.",
          "Start with `dfs(1, n, [])`.",
        ],
        why: "Strictly increasing choices make every set of digits correspond to exactly one path, and trying smaller digits first at every depth lists the sets in lexicographic order (all have the same length `k`).",
        time: "O(C(9, k) · k)",
        space: "O(k)",
        pitfalls: [
          "Digits must be distinct and between 1 and 9 — 0 is not allowed.",
          "Large `n` (above 45) has no answer at all; the search handles it, but do not assume a result exists.",
          "Record only when both the count and the sum match.",
        ],
      }),
      examples: [
        { input: "3\n7", expectedOutput: "[[1,2,4]]" },
        { input: "3\n9", expectedOutput: "[[1,2,6],[1,3,5],[2,3,4]]" },
        { input: "4\n1", expectedOutput: "[]" },
      ],
      hiddenCount: 500,
      gen: (rng: Rng) => {
        const k = ri(rng, 2, 9);
        const lo = (k * (k + 1)) / 2;
        const hi = 45 - ((9 - k) * (10 - k)) / 2;
        const n = rng() < 0.55 ? ri(rng, lo, hi) : ri(rng, 1, 60);
        return { input: `${k}\n${n}`, expectedOutput: fmtIntMat(ref(k, n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def combinationSum3(k: int, n: int) -> List[List[int]]:
              out = []
              path = []

              def dfs(nxt, rem):
                  if len(path) == k:
                      if rem == 0:
                          out.append(path[:])
                      return
                  for d in range(nxt, 10):
                      if d > rem:
                          break
                      path.append(d)
                      dfs(d + 1, rem - d)
                      path.pop()

              dfs(1, n)
              return out
        `,
        javascript: code`
          var combinationSum3 = function(k, n) {
              var out = [];
              var path = [];
              var dfs = function(nxt, rem) {
                  if (path.length === k) {
                      if (rem === 0) out.push(path.slice());
                      return;
                  }
                  for (var d = nxt; d <= 9; d++) {
                      if (d > rem) break;
                      path.push(d);
                      dfs(d + 1, rem - d);
                      path.pop();
                  }
              };
              dfs(1, n);
              return out;
          };
        `,
        typescript: code`
          function combinationSum3(k: number, n: number): number[][] {
              var out: number[][] = [];
              var path: number[] = [];
              function dfs(nxt: number, rem: number): void {
                  if (path.length === k) {
                      if (rem === 0) out.push(path.slice());
                      return;
                  }
                  for (var d = nxt; d <= 9; d++) {
                      if (d > rem) break;
                      path.push(d);
                      dfs(d + 1, rem - d);
                      path.pop();
                  }
              }
              dfs(1, n);
              return out;
          }
        `,
        java: code`
          public static int[][] combinationSum3(int k, int n) {
              List<int[]> out = new ArrayList<>();
              digitDfs(k, 1, n, new int[k], 0, out);
              return out.toArray(new int[0][]);
          }

          static void digitDfs(int k, int nxt, int rem, int[] path, int len, List<int[]> out) {
              if (len == k) {
                  if (rem == 0) out.add(path.clone());
                  return;
              }
              for (int d = nxt; d <= 9; d++) {
                  if (d > rem) break;
                  path[len] = d;
                  digitDfs(k, d + 1, rem - d, path, len + 1, out);
              }
          }
        `,
        cpp: code`
          void digitDfs(int k, int nxt, int rem, vector<int>& path, vector<vector<int>>& out) {
              if ((int)path.size() == k) {
                  if (rem == 0) out.push_back(path);
                  return;
              }
              for (int d = nxt; d <= 9; d++) {
                  if (d > rem) break;
                  path.push_back(d);
                  digitDfs(k, d + 1, rem - d, path, out);
                  path.pop_back();
              }
          }

          vector<vector<int>> combinationSum3(int k, int n) {
              vector<vector<int>> out;
              vector<int> path;
              digitDfs(k, 1, n, path, out);
              return out;
          }
        `,
        c: code`
          static void digitDfs(int k, int nxt, int rem, int* path, int len, int** out, int* count) {
              if (len == k) {
                  if (rem == 0) {
                      int* row = (int*)malloc(sizeof(int) * k);
                      for (int i = 0; i < k; i++) row[i] = path[i];
                      out[(*count)++] = row;
                  }
                  return;
              }
              for (int d = nxt; d <= 9; d++) {
                  if (d > rem) break;
                  path[len] = d;
                  digitDfs(k, d + 1, rem - d, path, len + 1, out, count);
              }
          }

          int** combinationSum3(int k, int n, int* returnSize, int** returnColumnSizes) {
              int** out = (int**)malloc(sizeof(int*) * 512);
              int path[10];
              int count = 0;
              digitDfs(k, 1, n, path, 0, out, &count);
              int* sizes = (int*)malloc(sizeof(int) * (count > 0 ? count : 1));
              for (int i = 0; i < count; i++) sizes[i] = k;
              *returnSize = count;
              *returnColumnSizes = sizes;
              return out;
          }
        `,
        csharp: code`
          public static int[][] CombinationSum3(int k, int n)
          {
              var result = new List<int[]>();
              DigitDfs(k, 1, n, new List<int>(), result);
              return result.ToArray();
          }

          static void DigitDfs(int k, int nxt, int rem, List<int> path, List<int[]> result)
          {
              if (path.Count == k)
              {
                  if (rem == 0) result.Add(path.ToArray());
                  return;
              }
              for (int d = nxt; d <= 9; d++)
              {
                  if (d > rem) break;
                  path.Add(d);
                  DigitDfs(k, d + 1, rem - d, path, result);
                  path.RemoveAt(path.Count - 1);
              }
          }
        `,
        go: code`
          func combinationSum3(k int, n int) [][]int {
          	out := [][]int{}
          	path := []int{}
          	var dfs func(nxt, rem int)
          	dfs = func(nxt, rem int) {
          		if len(path) == k {
          			if rem == 0 {
          				row := make([]int, k)
          				copy(row, path)
          				out = append(out, row)
          			}
          			return
          		}
          		for d := nxt; d <= 9; d++ {
          			if d > rem {
          				break
          			}
          			path = append(path, d)
          			dfs(d+1, rem-d)
          			path = path[:len(path)-1]
          		}
          	}
          	dfs(1, n)
          	return out
          }
        `,
        kotlin: code`
          fun combinationSum3(k: Int, n: Int): Array<IntArray> {
              val out = ArrayList<IntArray>()
              val path = ArrayList<Int>()
              fun dfs(nxt: Int, rem: Int) {
                  if (path.size == k) {
                      if (rem == 0) out.add(path.toIntArray())
                      return
                  }
                  for (d in nxt..9) {
                      if (d > rem) break
                      path.add(d)
                      dfs(d + 1, rem - d)
                      path.removeAt(path.size - 1)
                  }
              }
              dfs(1, n)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func combinationSum3(_ k: Int, _ n: Int) -> [[Int]] {
              var out = [[Int]]()
              var path = [Int]()
              func dfs(_ nxt: Int, _ rem: Int) {
                  if path.count == k {
                      if rem == 0 { out.append(path) }
                      return
                  }
                  var d = nxt
                  while d <= 9 {
                      if d > rem { break }
                      path.append(d)
                      dfs(d + 1, rem - d)
                      path.removeLast()
                      d += 1
                  }
              }
              dfs(1, n)
              return out
          }
        `,
        rust: code`
          fn digit_dfs(k: usize, nxt: i32, rem: i32, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              if path.len() == k {
                  if rem == 0 {
                      out.push(path.clone());
                  }
                  return;
              }
              let mut d = nxt;
              while d <= 9 {
                  if d > rem {
                      break;
                  }
                  path.push(d);
                  digit_dfs(k, d + 1, rem - d, path, out);
                  path.pop();
                  d += 1;
              }
          }

          fn combinationSum3(k: i32, n: i32) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut path: Vec<i32> = Vec::new();
              digit_dfs(k as usize, 1, n, &mut path, &mut out);
              out
          }
        `,
        php: code`
          function combinationSum3($k, $n) {
              $out = [];
              $path = [];
              digitDfs($k, 1, $n, $path, $out);
              return $out;
          }

          function digitDfs($k, $nxt, $rem, &$path, &$out) {
              if (count($path) == $k) {
                  if ($rem == 0) $out[] = $path;
                  return;
              }
              for ($d = $nxt; $d <= 9; $d++) {
                  if ($d > $rem) break;
                  $path[] = $d;
                  digitDfs($k, $d + 1, $rem - $d, $path, $out);
                  array_pop($path);
              }
          }
        `,
        ruby: code`
          def combinationSum3(k, n)
            out = []
            path = []
            dfs = lambda do |nxt, rem|
              if path.length == k
                out << path.dup if rem == 0
                next
              end
              d = nxt
              while d <= 9
                break if d > rem
                path << d
                dfs.call(d + 1, rem - d)
                path.pop
                d += 1
              end
            end
            dfs.call(1, n)
            out
          end
        `,
      },
    };
  })(),


  // ── N-Queens II (LC 52) ─────────────────────────────────────────
  (() => {
    // Known counts of the n-queens problem (OEIS A000170), n = 1..9.
    const KNOWN = [1, 0, 0, 2, 10, 4, 40, 92, 352];
    return {
      slug: "n-queens-ii",
      title: "N-Queens II",
      difficulty: "HARD" as const,
      tags: ["Backtracking", "Bit Manipulation", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "totalNQueens", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Place `n` chess queens on an `n x n` board so that no two of them attack each other: no two queens may share a row, a column, or a diagonal (in either direction).\n\n" +
        "Return the **number** of different placements. Two placements are different when some square holds a queen in one and not in the other — mirror images and rotations count separately.",
        [
          { in: "n = 4", out: "2", note: "The two placements put the queens in columns `[1,3,0,2]` and `[2,0,3,1]` of rows 0..3." },
          { in: "n = 1", out: "1" },
          { in: "n = 6", out: "4" },
        ],
        ["1 <= n <= 9"]),
      hints: [
        "Every row holds exactly one queen, so place them row by row and only choose the column.",
        "A square is attacked when its column, its `row - col` diagonal or its `row + col` anti-diagonal is already taken. Keep three sets (or three bitmasks).",
        "With bitmasks, shift the diagonal masks by one bit when moving to the next row; the free columns are `~(cols | diag | anti) & full`, and the lowest set bit is `x & -x`.",
      ],
      editorial: explain({
        idea: "Place one queen per row and backtrack over the column choice. Bitmasks for the occupied columns and both diagonal directions make each \"is this square free?\" test a single AND.",
        steps: [
          "Let `full = (1 << n) - 1`. `solve(cols, d1, d2)` returns the number of completions; when `cols == full`, every row has a queen, so return 1.",
          "The free squares of the current row are `full & ~(cols | d1 | d2)`.",
          "For each free bit `b` (take `free & -free`, then clear it), add `solve(cols | b, ((d1 | b) << 1) & full, (d2 | b) >> 1)`.",
          "Return `solve(0, 0, 0)`.",
        ],
        why: "A queen in column `c` of the current row attacks column `c - 1` (or `c + 1`) of the next row along its diagonals, and one further per row after that — shifting the diagonal masks by one bit per row tracks exactly those squares. So the search visits exactly the valid partial placements, and every complete one is counted once because each row's column is chosen once.",
        time: "O(n!) in the worst case — far less in practice thanks to pruning",
        space: "O(n) recursion depth",
        pitfalls: [
          "Shift the two diagonal masks in opposite directions.",
          "Mask the left-shifted diagonal (or the free set) with `full`, or bits beyond the board look occupied or free.",
          "n = 2 and n = 3 have no solution: the answer is 0, not an error.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: "2" },
        { input: "1", expectedOutput: "1" },
        { input: "6", expectedOutput: "4" },
      ],
      hiddenCount: 100,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        return { input: String(n), expectedOutput: String(KNOWN[n - 1]) };
      },
      solutions: {
        python: code`
          def totalNQueens(n: int) -> int:
              full = (1 << n) - 1

              def solve(cols, d1, d2):
                  if cols == full:
                      return 1
                  count = 0
                  avail = full & ~(cols | d1 | d2)
                  while avail:
                      bit = avail & -avail
                      avail ^= bit
                      count += solve(cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1)
                  return count

              return solve(0, 0, 0)
        `,
        javascript: code`
          var totalNQueens = function(n) {
              var full = (1 << n) - 1;
              var solve = function(cols, d1, d2) {
                  if (cols === full) return 1;
                  var count = 0;
                  var avail = full & ~(cols | d1 | d2);
                  while (avail !== 0) {
                      var bit = avail & -avail;
                      avail ^= bit;
                      count += solve(cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
                  }
                  return count;
              };
              return solve(0, 0, 0);
          };
        `,
        typescript: code`
          function totalNQueens(n: number): number {
              var full = (1 << n) - 1;
              function solve(cols: number, d1: number, d2: number): number {
                  if (cols === full) return 1;
                  var count = 0;
                  var avail = full & ~(cols | d1 | d2);
                  while (avail !== 0) {
                      var bit = avail & -avail;
                      avail ^= bit;
                      count += solve(cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
                  }
                  return count;
              }
              return solve(0, 0, 0);
          }
        `,
        java: code`
          public static int totalNQueens(int n) {
              return queensSolve((1 << n) - 1, 0, 0, 0);
          }

          static int queensSolve(int full, int cols, int d1, int d2) {
              if (cols == full) return 1;
              int count = 0;
              int avail = full & ~(cols | d1 | d2);
              while (avail != 0) {
                  int bit = avail & -avail;
                  avail ^= bit;
                  count += queensSolve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
              }
              return count;
          }
        `,
        cpp: code`
          int queensSolve(int full, int cols, int d1, int d2) {
              if (cols == full) return 1;
              int count = 0;
              int avail = full & ~(cols | d1 | d2);
              while (avail != 0) {
                  int bit = avail & -avail;
                  avail ^= bit;
                  count += queensSolve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
              }
              return count;
          }

          int totalNQueens(int n) {
              return queensSolve((1 << n) - 1, 0, 0, 0);
          }
        `,
        c: code`
          static int queensSolve(int full, int cols, int d1, int d2) {
              if (cols == full) return 1;
              int count = 0;
              int avail = full & ~(cols | d1 | d2);
              while (avail != 0) {
                  int bit = avail & -avail;
                  avail ^= bit;
                  count += queensSolve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
              }
              return count;
          }

          int totalNQueens(int n) {
              return queensSolve((1 << n) - 1, 0, 0, 0);
          }
        `,
        csharp: code`
          public static int TotalNQueens(int n)
          {
              return QueensSolve((1 << n) - 1, 0, 0, 0);
          }

          static int QueensSolve(int full, int cols, int d1, int d2)
          {
              if (cols == full) return 1;
              int count = 0;
              int avail = full & ~(cols | d1 | d2);
              while (avail != 0)
              {
                  int bit = avail & -avail;
                  avail ^= bit;
                  count += QueensSolve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
              }
              return count;
          }
        `,
        go: code`
          func queensSolve(full, cols, d1, d2 int) int {
          	if cols == full {
          		return 1
          	}
          	count := 0
          	avail := full &^ (cols | d1 | d2)
          	for avail != 0 {
          		bit := avail & -avail
          		avail ^= bit
          		count += queensSolve(full, cols|bit, ((d1|bit)<<1)&full, (d2|bit)>>1)
          	}
          	return count
          }

          func totalNQueens(n int) int {
          	return queensSolve((1<<uint(n))-1, 0, 0, 0)
          }
        `,
        kotlin: code`
          fun queensSolve(full: Int, cols: Int, d1: Int, d2: Int): Int {
              if (cols == full) return 1
              var count = 0
              var avail = full and (cols or d1 or d2).inv()
              while (avail != 0) {
                  val bit = avail and -avail
                  avail = avail xor bit
                  count += queensSolve(full, cols or bit, ((d1 or bit) shl 1) and full, (d2 or bit) shr 1)
              }
              return count
          }

          fun totalNQueens(n: Int): Int {
              return queensSolve((1 shl n) - 1, 0, 0, 0)
          }
        `,
        swift: code`
          func queensSolve(_ full: Int, _ cols: Int, _ d1: Int, _ d2: Int) -> Int {
              if cols == full { return 1 }
              var count = 0
              var avail = full & ~(cols | d1 | d2)
              while avail != 0 {
                  let bit = avail & -avail
                  avail ^= bit
                  count += queensSolve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1)
              }
              return count
          }

          func totalNQueens(_ n: Int) -> Int {
              return queensSolve((1 << n) - 1, 0, 0, 0)
          }
        `,
        rust: code`
          fn queens_solve(full: i32, cols: i32, d1: i32, d2: i32) -> i32 {
              if cols == full {
                  return 1;
              }
              let mut count = 0;
              let mut avail = full & !(cols | d1 | d2);
              while avail != 0 {
                  let bit = avail & -avail;
                  avail ^= bit;
                  count += queens_solve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);
              }
              count
          }

          fn totalNQueens(n: i32) -> i32 {
              queens_solve((1 << n) - 1, 0, 0, 0)
          }
        `,
        php: code`
          function totalNQueens($n) {
              return queensSolve((1 << $n) - 1, 0, 0, 0);
          }

          function queensSolve($full, $cols, $d1, $d2) {
              if ($cols == $full) return 1;
              $count = 0;
              $avail = $full & ~($cols | $d1 | $d2);
              while ($avail != 0) {
                  $bit = $avail & -$avail;
                  $avail ^= $bit;
                  $count += queensSolve($full, $cols | $bit, (($d1 | $bit) << 1) & $full, ($d2 | $bit) >> 1);
              }
              return $count;
          }
        `,
        ruby: code`
          def totalNQueens(n)
            queens_solve((1 << n) - 1, 0, 0, 0)
          end

          def queens_solve(full, cols, d1, d2)
            return 1 if cols == full
            count = 0
            avail = full & ~(cols | d1 | d2)
            while avail != 0
              bit = avail & -avail
              avail ^= bit
              count += queens_solve(full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1)
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Expression Add Operators (LC 282) ───────────────────────────
  (() => {
    /** Brute force: every gap gets one of "", +, -, *; evaluate with precedence. */
    const ref = (num: string, target: number) => {
      const out: string[] = [];
      const gaps = num.length - 1;
      const OPS = ["", "+", "-", "*"];
      for (let code = 0; code < 4 ** gaps; code++) {
        let expr = num[0];
        let c = code;
        for (let g = 0; g < gaps; g++) { expr += OPS[c % 4] + num[g + 1]; c = Math.floor(c / 4); }
        const tokens = expr.split(/([+\-*])/);
        if (tokens.some((t, i) => i % 2 === 0 && t.length > 1 && t[0] === "0")) continue;
        let total = 0;
        let term = Number(tokens[0]);
        for (let i = 1; i < tokens.length; i += 2) {
          const v = Number(tokens[i + 1]);
          if (tokens[i] === "*") term *= v;
          else { total += term; term = tokens[i] === "+" ? v : -v; }
        }
        if (total + term === target) out.push(expr);
      }
      return out.sort(cmpStr);
    };
    const randomExprValue = (rng: Rng, num: string) => {
      // Value of one random valid expression over num (so the case has an answer).
      let expr = num[0];
      for (let i = 1; i < num.length; i++) {
        const lastTok = expr.split(/[+\-*]/).pop()!;
        const canGlue = !(lastTok === "0");
        const op = pick(rng, canGlue ? ["", "+", "-", "*"] : ["+", "-", "*"]);
        expr += op + num[i];
      }
      const tokens = expr.split(/([+\-*])/);
      let total = 0;
      let term = Number(tokens[0]);
      for (let i = 1; i < tokens.length; i += 2) {
        const v = Number(tokens[i + 1]);
        if (tokens[i] === "*") term *= v;
        else { total += term; term = tokens[i] === "+" ? v : -v; }
      }
      return total + term;
    };
    return {
      slug: "expression-add-operators",
      title: "Expression Add Operators",
      difficulty: "HARD" as const,
      tags: ["Math", "String", "Backtracking", "Meta", "Google", "Amazon"],
      signature: {
        funcName: "addOperators",
        params: [{ name: "num", type: "string" as const }, { name: "target", type: "int" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "`num` is a string of digits. Between any two neighbouring digits you may insert one of the binary operators `+`, `-` or `*`, or nothing (which glues the digits into a longer number). The digits stay in their order.\n\n" +
        "Return every expression built this way whose value equals `target`, evaluated with the usual precedence (`*` before `+` and `-`, left to right otherwise). An operand may not have a **leading zero**: `0` on its own is fine, but `05` is not.\n\n" +
        "List the expressions in ascending **ASCII** order (so `*` < `+` < `-` < digits). Return an empty list if none works.",
        [
          { in: "num = \"123\", target = 6", out: "[\"1*2*3\",\"1+2+3\"]" },
          { in: "num = \"105\", target = 5", out: "[\"1*0+5\",\"10-5\"]", note: "`1*05` is not allowed: `05` has a leading zero." },
          { in: "num = \"99\", target = 10", out: "[]" },
        ],
        ["1 <= num.length <= 10", "num consists only of digits", "-2^31 <= target <= 2^31 - 1"]),
      hints: [
        "Walk through `num` choosing where the next operand ends; between operands try each of the three operators.",
        "Track the running value and the value of the **last multiplicative term** separately, so a `*` can undo that term and re-apply it multiplied.",
        "For `*`: new value = `value - last + last * cur`, new last = `last * cur`. Use 64-bit arithmetic — a ten-digit operand does not fit in 32 bits — and stop extending an operand that starts with `0`.",
      ],
      editorial: explain({
        idea: "Backtrack over operand boundaries and operators while evaluating on the fly. The only tricky operator is `*`, which binds tighter than what was already added — remembering the last term lets us replace it in O(1).",
        steps: [
          "`dfs(pos, expr, value, last)`: if `pos == n`, record `expr` when `value == target`.",
          "For every end `i >= pos`, let `cur` be the number `num[pos..i]`; stop as soon as the operand would start with a 0 and have two or more digits.",
          "At `pos == 0`, the operand starts the expression: recurse with `value = last = cur`.",
          "Otherwise recurse three times: `+` (`value + cur`, last `cur`), `-` (`value - cur`, last `-cur`), `*` (`value - last + last * cur`, last `last * cur`).",
          "Sort the collected expressions.",
        ],
        why: "Under standard precedence an expression is a sum of signed products. `last` is the signed product currently being built; extending it by `* cur` changes the total by replacing `last` with `last * cur`, which is exactly the update. Every expression corresponds to one sequence of operand ends and operators, so each is generated once.",
        time: "O(4^n · n)",
        space: "O(n) recursion depth besides the output",
        pitfalls: [
          "Operands and intermediate products can exceed 32 bits (`\"9999999999\"`); use 64-bit integers.",
          "Leading zeros: `0` alone is a valid operand, but nothing may be glued after a leading `0`.",
          "Keep the sign in `last` for subtraction, or `a - b * c` evaluates wrongly.",
        ],
      }),
      examples: [
        { input: "\"123\"\n6", expectedOutput: "[\"1*2*3\",\"1+2+3\"]" },
        { input: "\"105\"\n5", expectedOutput: "[\"1*0+5\",\"10-5\"]" },
        { input: "\"99\"\n10", expectedOutput: "[]" },
      ],
      hiddenCount: 800,
      gen: (rng: Rng) => {
        const len = rng() < 0.04 ? 8 : pick(rng, [1, 2, 3, 4, 5, 5, 6, 6, 7, 7]);
        const zeroish = rng() < 0.3;
        let num = "";
        for (let i = 0; i < len; i++) num += String(zeroish && rng() < 0.4 ? 0 : ri(rng, 0, 9));
        let target: number;
        const r = rng();
        if (r < 0.6) target = randomExprValue(rng, num);
        else if (r < 0.9) target = ri(rng, -20, 60);
        else target = pick(rng, [-2147483648, 2147483647, 0, 1]);
        if (target > 2147483647 || target < -2147483648) target = 0;
        return { input: `"${num}"\n${target}`, expectedOutput: fmtStrArr(ref(num, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def addOperators(num: str, target: int) -> List[str]:
              n = len(num)
              out = []

              def dfs(pos, expr, value, last):
                  if pos == n:
                      if value == target:
                          out.append(expr)
                      return
                  for i in range(pos, n):
                      if i > pos and num[pos] == '0':
                          break
                      part = num[pos:i + 1]
                      cur = int(part)
                      if pos == 0:
                          dfs(i + 1, part, cur, cur)
                      else:
                          dfs(i + 1, expr + '+' + part, value + cur, cur)
                          dfs(i + 1, expr + '-' + part, value - cur, -cur)
                          dfs(i + 1, expr + '*' + part, value - last + last * cur, last * cur)

              dfs(0, '', 0, 0)
              out.sort()
              return out
        `,
        javascript: code`
          var addOperators = function(num, target) {
              var n = num.length;
              var out = [];
              var dfs = function(pos, expr, value, last) {
                  if (pos === n) {
                      if (value === target) out.push(expr);
                      return;
                  }
                  for (var i = pos; i < n; i++) {
                      if (i > pos && num.charAt(pos) === '0') break;
                      var part = num.substring(pos, i + 1);
                      var cur = parseInt(part, 10);
                      if (pos === 0) {
                          dfs(i + 1, part, cur, cur);
                      } else {
                          dfs(i + 1, expr + '+' + part, value + cur, cur);
                          dfs(i + 1, expr + '-' + part, value - cur, -cur);
                          dfs(i + 1, expr + '*' + part, value - last + last * cur, last * cur);
                      }
                  }
              };
              dfs(0, '', 0, 0);
              out.sort();
              return out;
          };
        `,
        typescript: code`
          function addOperators(num: string, target: number): string[] {
              var n = num.length;
              var out: string[] = [];
              function dfs(pos: number, expr: string, value: number, last: number): void {
                  if (pos === n) {
                      if (value === target) out.push(expr);
                      return;
                  }
                  for (var i = pos; i < n; i++) {
                      if (i > pos && num.charAt(pos) === '0') break;
                      var part = num.substring(pos, i + 1);
                      var cur = parseInt(part, 10);
                      if (pos === 0) {
                          dfs(i + 1, part, cur, cur);
                      } else {
                          dfs(i + 1, expr + '+' + part, value + cur, cur);
                          dfs(i + 1, expr + '-' + part, value - cur, -cur);
                          dfs(i + 1, expr + '*' + part, value - last + last * cur, last * cur);
                      }
                  }
              }
              dfs(0, '', 0, 0);
              out.sort();
              return out;
          }
        `,
        java: code`
          public static String[] addOperators(String num, int target) {
              List<String> out = new ArrayList<>();
              exprDfs(num, target, 0, "", 0L, 0L, out);
              Collections.sort(out);
              return out.toArray(new String[0]);
          }

          static void exprDfs(String num, long target, int pos, String expr, long value, long last, List<String> out) {
              if (pos == num.length()) {
                  if (value == target) out.add(expr);
                  return;
              }
              long cur = 0;
              for (int i = pos; i < num.length(); i++) {
                  if (i > pos && num.charAt(pos) == '0') break;
                  cur = cur * 10 + (num.charAt(i) - '0');
                  String part = num.substring(pos, i + 1);
                  if (pos == 0) {
                      exprDfs(num, target, i + 1, part, cur, cur, out);
                  } else {
                      exprDfs(num, target, i + 1, expr + "+" + part, value + cur, cur, out);
                      exprDfs(num, target, i + 1, expr + "-" + part, value - cur, -cur, out);
                      exprDfs(num, target, i + 1, expr + "*" + part, value - last + last * cur, last * cur, out);
                  }
              }
          }
        `,
        cpp: code`
          void exprDfs(const string& num, long long target, int pos, const string& expr, long long value, long long last, vector<string>& out) {
              if (pos == (int)num.size()) {
                  if (value == target) out.push_back(expr);
                  return;
              }
              long long cur = 0;
              for (int i = pos; i < (int)num.size(); i++) {
                  if (i > pos && num[pos] == '0') break;
                  cur = cur * 10 + (num[i] - '0');
                  string part = num.substr(pos, i - pos + 1);
                  if (pos == 0) {
                      exprDfs(num, target, i + 1, part, cur, cur, out);
                  } else {
                      exprDfs(num, target, i + 1, expr + "+" + part, value + cur, cur, out);
                      exprDfs(num, target, i + 1, expr + "-" + part, value - cur, -cur, out);
                      exprDfs(num, target, i + 1, expr + "*" + part, value - last + last * cur, last * cur, out);
                  }
              }
          }

          vector<string> addOperators(string num, int target) {
              vector<string> out;
              exprDfs(num, target, 0, "", 0, 0, out);
              sort(out.begin(), out.end());
              return out;
          }
        `,
        c: code`
          typedef struct {
              char** items;
              int count;
              int cap;
          } ExprList;

          static void exprPush(ExprList* l, const char* buf, int len) {
              if (l->count == l->cap) {
                  l->cap *= 2;
                  l->items = (char**)realloc(l->items, sizeof(char*) * l->cap);
              }
              char* s = (char*)malloc(len + 1);
              memcpy(s, buf, len);
              s[len] = '\0';
              l->items[l->count++] = s;
          }

          static void exprDfs(const char* num, int n, long long target, int pos, char* buf, int blen,
                              long long value, long long last, ExprList* l) {
              if (pos == n) {
                  if (value == target) exprPush(l, buf, blen);
                  return;
              }
              long long cur = 0;
              for (int i = pos; i < n; i++) {
                  if (i > pos && num[pos] == '0') break;
                  cur = cur * 10 + (num[i] - '0');
                  int plen = i - pos + 1;
                  if (pos == 0) {
                      memcpy(buf, num + pos, plen);
                      exprDfs(num, n, target, i + 1, buf, plen, cur, cur, l);
                  } else {
                      memcpy(buf + blen + 1, num + pos, plen);
                      buf[blen] = '+';
                      exprDfs(num, n, target, i + 1, buf, blen + 1 + plen, value + cur, cur, l);
                      buf[blen] = '-';
                      exprDfs(num, n, target, i + 1, buf, blen + 1 + plen, value - cur, -cur, l);
                      buf[blen] = '*';
                      exprDfs(num, n, target, i + 1, buf, blen + 1 + plen, value - last + last * cur, last * cur, l);
                  }
              }
          }

          static int exprCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** addOperators(const char* num, int target, int* returnSize) {
              int n = (int)strlen(num);
              ExprList l;
              l.cap = 16;
              l.count = 0;
              l.items = (char**)malloc(sizeof(char*) * l.cap);
              char buf[64];
              exprDfs(num, n, (long long)target, 0, buf, 0, 0, 0, &l);
              qsort(l.items, l.count, sizeof(char*), exprCmp);
              *returnSize = l.count;
              return l.items;
          }
        `,
        csharp: code`
          public static string[] AddOperators(string num, int target)
          {
              var result = new List<string>();
              ExprDfs(num, target, 0, "", 0L, 0L, result);
              result.Sort((x, y) => string.CompareOrdinal(x, y));
              return result.ToArray();
          }

          static void ExprDfs(string num, long target, int pos, string expr, long value, long last, List<string> result)
          {
              if (pos == num.Length)
              {
                  if (value == target) result.Add(expr);
                  return;
              }
              long cur = 0;
              for (int i = pos; i < num.Length; i++)
              {
                  if (i > pos && num[pos] == '0') break;
                  cur = cur * 10 + (num[i] - '0');
                  string part = num.Substring(pos, i - pos + 1);
                  if (pos == 0)
                  {
                      ExprDfs(num, target, i + 1, part, cur, cur, result);
                  }
                  else
                  {
                      ExprDfs(num, target, i + 1, expr + "+" + part, value + cur, cur, result);
                      ExprDfs(num, target, i + 1, expr + "-" + part, value - cur, -cur, result);
                      ExprDfs(num, target, i + 1, expr + "*" + part, value - last + last * cur, last * cur, result);
                  }
              }
          }
        `,
        go: code`
          func addOperators(num string, target int) []string {
          	n := len(num)
          	out := []string{}
          	var dfs func(pos int, expr string, value, last int64)
          	dfs = func(pos int, expr string, value, last int64) {
          		if pos == n {
          			if value == int64(target) {
          				out = append(out, expr)
          			}
          			return
          		}
          		var cur int64
          		for i := pos; i < n; i++ {
          			if i > pos && num[pos] == '0' {
          				break
          			}
          			cur = cur*10 + int64(num[i]-'0')
          			part := num[pos : i+1]
          			if pos == 0 {
          				dfs(i+1, part, cur, cur)
          			} else {
          				dfs(i+1, expr+"+"+part, value+cur, cur)
          				dfs(i+1, expr+"-"+part, value-cur, -cur)
          				dfs(i+1, expr+"*"+part, value-last+last*cur, last*cur)
          			}
          		}
          	}
          	dfs(0, "", 0, 0)
          	sort.Strings(out)
          	return out
          }
        `,
        kotlin: code`
          fun addOperators(num: String, target: Int): Array<String> {
              val n = num.length
              val out = ArrayList<String>()
              fun dfs(pos: Int, expr: String, value: Long, last: Long) {
                  if (pos == n) {
                      if (value == target.toLong()) out.add(expr)
                      return
                  }
                  var cur = 0L
                  for (i in pos until n) {
                      if (i > pos && num[pos] == '0') break
                      cur = cur * 10 + (num[i] - '0')
                      val part = num.substring(pos, i + 1)
                      if (pos == 0) {
                          dfs(i + 1, part, cur, cur)
                      } else {
                          dfs(i + 1, expr + "+" + part, value + cur, cur)
                          dfs(i + 1, expr + "-" + part, value - cur, -cur)
                          dfs(i + 1, expr + "*" + part, value - last + last * cur, last * cur)
                      }
                  }
              }
              dfs(0, "", 0L, 0L)
              out.sort()
              return out.toTypedArray()
          }
        `,
        swift: code`
          func addOperators(_ num: String, _ target: Int) -> [String] {
              let chars = Array(num)
              let digits = Array(num.utf8).map { Int($0) - 48 }
              let n = digits.count
              var out = [String]()
              func dfs(_ pos: Int, _ expr: String, _ value: Int, _ last: Int) {
                  if pos == n {
                      if value == target { out.append(expr) }
                      return
                  }
                  var cur = 0
                  var part = ""
                  for i in pos..<n {
                      if i > pos && digits[pos] == 0 { break }
                      cur = cur * 10 + digits[i]
                      part.append(chars[i])
                      if pos == 0 {
                          dfs(i + 1, part, cur, cur)
                      } else {
                          dfs(i + 1, expr + "+" + part, value + cur, cur)
                          dfs(i + 1, expr + "-" + part, value - cur, -cur)
                          dfs(i + 1, expr + "*" + part, value - last + last * cur, last * cur)
                      }
                  }
              }
              dfs(0, "", 0, 0)
              out.sort { $0.utf8.lexicographicallyPrecedes($1.utf8) }
              return out
          }
        `,
        rust: code`
          fn expr_dfs(d: &Vec<u8>, target: i64, pos: usize, expr: &mut String, value: i64, last: i64, out: &mut Vec<String>) {
              if pos == d.len() {
                  if value == target {
                      out.push(expr.clone());
                  }
                  return;
              }
              let base = expr.len();
              let mut cur: i64 = 0;
              for i in pos..d.len() {
                  if i > pos && d[pos] == b'0' {
                      break;
                  }
                  cur = cur * 10 + (d[i] - b'0') as i64;
                  let part = String::from_utf8(d[pos..i + 1].to_vec()).unwrap();
                  if pos == 0 {
                      expr.push_str(&part);
                      expr_dfs(d, target, i + 1, expr, cur, cur, out);
                      expr.truncate(base);
                  } else {
                      expr.push('+');
                      expr.push_str(&part);
                      expr_dfs(d, target, i + 1, expr, value + cur, cur, out);
                      expr.truncate(base);
                      expr.push('-');
                      expr.push_str(&part);
                      expr_dfs(d, target, i + 1, expr, value - cur, -cur, out);
                      expr.truncate(base);
                      expr.push('*');
                      expr.push_str(&part);
                      expr_dfs(d, target, i + 1, expr, value - last + last * cur, last * cur, out);
                      expr.truncate(base);
                  }
              }
          }

          fn addOperators(num: String, target: i32) -> Vec<String> {
              let d: Vec<u8> = num.as_bytes().to_vec();
              let mut out: Vec<String> = Vec::new();
              let mut expr = String::new();
              expr_dfs(&d, target as i64, 0, &mut expr, 0, 0, &mut out);
              out.sort();
              out
          }
        `,
        php: code`
          function addOperators($num, $target) {
              $out = [];
              exprDfs($num, strlen($num), $target, 0, "", 0, 0, $out);
              sort($out, SORT_STRING);
              return $out;
          }

          function exprDfs($num, $n, $target, $pos, $expr, $value, $last, &$out) {
              if ($pos == $n) {
                  if ($value == $target) $out[] = $expr;
                  return;
              }
              $cur = 0;
              for ($i = $pos; $i < $n; $i++) {
                  if ($i > $pos && $num[$pos] === '0') break;
                  $cur = $cur * 10 + (ord($num[$i]) - 48);
                  $part = substr($num, $pos, $i - $pos + 1);
                  if ($pos == 0) {
                      exprDfs($num, $n, $target, $i + 1, $part, $cur, $cur, $out);
                  } else {
                      exprDfs($num, $n, $target, $i + 1, $expr . "+" . $part, $value + $cur, $cur, $out);
                      exprDfs($num, $n, $target, $i + 1, $expr . "-" . $part, $value - $cur, -$cur, $out);
                      exprDfs($num, $n, $target, $i + 1, $expr . "*" . $part, $value - $last + $last * $cur, $last * $cur, $out);
                  }
              }
          }
        `,
        ruby: code`
          def addOperators(num, target)
            n = num.length
            out = []
            dfs = lambda do |pos, expr, value, last|
              if pos == n
                out << expr if value == target
                next
              end
              cur = 0
              (pos...n).each do |i|
                break if i > pos && num[pos] == '0'
                cur = cur * 10 + (num[i].ord - 48)
                part = num[pos..i]
                if pos == 0
                  dfs.call(i + 1, part, cur, cur)
                else
                  dfs.call(i + 1, expr + '+' + part, value + cur, cur)
                  dfs.call(i + 1, expr + '-' + part, value - cur, -cur)
                  dfs.call(i + 1, expr + '*' + part, value - last + last * cur, last * cur)
                end
              end
            end
            dfs.call(0, '', 0, 0)
            out.sort
          end
        `,
      },
    };
  })(),

  // ── Matchsticks to Square (LC 473) ──────────────────────────────
  (() => {
    /** Subset DP: dp[mask] — the sticks in mask fill whole sides plus a partial one. */
    const ref = (m: number[]) => {
      const n = m.length;
      const total = m.reduce((a, b) => a + b, 0);
      if (n < 4 || total % 4 !== 0) return false;
      const side = total / 4;
      const dp = new Uint8Array(1 << n);
      const sum = new Float64Array(1 << n);
      dp[0] = 1;
      for (let mask = 0; mask < 1 << n; mask++) {
        if (!dp[mask]) continue;
        const cur = sum[mask] % side;
        for (let i = 0; i < n; i++) {
          if (mask & (1 << i)) continue;
          if (cur + m[i] > side) continue;
          const nm = mask | (1 << i);
          dp[nm] = 1;
          sum[nm] = sum[mask] + m[i];
        }
      }
      return dp[(1 << n) - 1] === 1;
    };
    const splitInto = (rng: Rng, total: number, parts: number) => {
      const cuts = new Set<number>();
      while (cuts.size < parts - 1) cuts.add(ri(rng, 1, total - 1));
      const c = [0, ...[...cuts].sort((a, b) => a - b), total];
      const out: number[] = [];
      for (let i = 1; i < c.length; i++) out.push(c[i] - c[i - 1]);
      return out;
    };
    return {
      slug: "matchsticks-to-square",
      title: "Matchsticks to Square",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Bitmask", "Dynamic Programming", "Amazon", "Microsoft", "Meta"],
      signature: { funcName: "makesquare", params: [{ name: "matchsticks", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "`matchsticks[i]` is the length of the `i`-th matchstick. Decide whether **all** of them can be laid end to end to form the four sides of one square: every stick must be used exactly once, sticks cannot be broken, and each side may consist of several sticks.\n\n" +
        "Return `true` if such a square exists, otherwise `false`.",
        [
          { in: "matchsticks = [1,1,2,2,2]", out: "true", note: "Sides `1+1`, `2`, `2`, `2`." },
          { in: "matchsticks = [3,3,3,3,4]", out: "false", note: "The total, 16, means sides of length 4, and a stick of length 3 can never be topped up to exactly 4." },
          { in: "matchsticks = [5,5,5,5]", out: "true" },
        ],
        ["1 <= matchsticks.length <= 15", "1 <= matchsticks[i] <= 10^8"]),
      hints: [
        "The side length is forced: the total must be divisible by 4, and each side is `total / 4`. A stick longer than that rules the square out at once.",
        "Place the sticks one by one into one of four buckets, never letting a bucket exceed the side length.",
        "Sort the sticks longest first so dead ends appear early, and skip a bucket whose current length equals that of a bucket you already tried for this stick — the outcome would be the same.",
      ],
      editorial: explain({
        idea: "Distribute the sticks into four buckets of capacity `total / 4` by backtracking. Placing long sticks first and ignoring buckets that are interchangeable prunes the search to almost nothing on real inputs.",
        steps: [
          "If there are fewer than 4 sticks or `total % 4 != 0`, return false. Let `side = total / 4`.",
          "Sort the sticks in decreasing order; if the longest exceeds `side`, return false.",
          "`dfs(i)`: if `i == n`, return true. Otherwise try each bucket `j` with `bucket[j] + stick[i] <= side` whose current length differs from every earlier bucket's; add the stick, recurse, and remove it on failure.",
          "Return `dfs(0)`.",
        ],
        why: "When every stick is placed and no bucket exceeds `side`, the four buckets sum to `4 · side`, so each is exactly `side` — a square. Two buckets of equal current length are interchangeable for every remaining choice, so trying only one of them loses no solution.",
        time: "O(4^n) worst case; heavily pruned in practice. A subset DP is O(2^n · n).",
        space: "O(n)",
        pitfalls: [
          "Check divisibility and the longest stick before searching.",
          "Without sorting longest first, the search explores many hopeless partial fills.",
          "The total can reach 1.5 · 10^9 — it still fits in a 32-bit int, but `bucket + stick` comparisons should not overflow either.",
        ],
      }),
      examples: [
        { input: "[1,1,2,2,2]", expectedOutput: "true" },
        { input: "[3,3,3,3,4]", expectedOutput: "false" },
        { input: "[5,5,5,5]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 9);
        let sticks: number[];
        if (mode < 6) {
          const n = ri(rng, 4, mode === 0 ? 15 : 12);
          const counts = [1, 1, 1, 1];
          for (let i = 4; i < n; i++) counts[ri(rng, 0, 3)]++;
          const most = Math.max(...counts);
          const side = rng() < 0.15 ? ri(rng, Math.max(most, 1000), 100000000) : ri(rng, most + 1, most + 25);
          sticks = [];
          for (const c of counts) sticks.push(...splitInto(rng, side, c));
          shuffle(rng, sticks);
          if (mode >= 3) {
            // Move one unit between two sticks: the total stays, the square may not.
            const i = ri(rng, 0, n - 1);
            const j = ri(rng, 0, n - 1);
            if (i !== j && sticks[i] > 1 && sticks[j] < 100000000) { sticks[i]--; sticks[j]++; }
          }
        } else {
          const n = ri(rng, 1, 12);
          const hi = pick(rng, [3, 6, 20, 100000000]);
          sticks = Array.from({ length: n }, () => ri(rng, 1, hi));
        }
        return { input: fmtIntArr(sticks), expectedOutput: bool(ref(sticks)) };
      },
      solutions: {
        python: code`
          from typing import List

          def makesquare(matchsticks: List[int]) -> bool:
              n = len(matchsticks)
              total = sum(matchsticks)
              if n < 4 or total % 4 != 0:
                  return False
              side = total // 4
              a = sorted(matchsticks, reverse=True)
              if a[0] > side:
                  return False
              sides = [0, 0, 0, 0]

              def dfs(i):
                  if i == n:
                      return True
                  for j in range(4):
                      if sides[j] + a[i] > side:
                          continue
                      if any(sides[k] == sides[j] for k in range(j)):
                          continue
                      sides[j] += a[i]
                      if dfs(i + 1):
                          return True
                      sides[j] -= a[i]
                  return False

              return dfs(0)
        `,
        javascript: code`
          var makesquare = function(matchsticks) {
              var n = matchsticks.length;
              var total = 0;
              for (var i = 0; i < n; i++) total += matchsticks[i];
              if (n < 4 || total % 4 !== 0) return false;
              var side = total / 4;
              var a = matchsticks.slice().sort(function(x, y) { return y - x; });
              if (a[0] > side) return false;
              var sides = [0, 0, 0, 0];
              var dfs = function(idx) {
                  if (idx === n) return true;
                  for (var j = 0; j < 4; j++) {
                      if (sides[j] + a[idx] > side) continue;
                      var dup = false;
                      for (var k = 0; k < j; k++) if (sides[k] === sides[j]) { dup = true; break; }
                      if (dup) continue;
                      sides[j] += a[idx];
                      if (dfs(idx + 1)) return true;
                      sides[j] -= a[idx];
                  }
                  return false;
              };
              return dfs(0);
          };
        `,
        typescript: code`
          function makesquare(matchsticks: number[]): boolean {
              var n = matchsticks.length;
              var total = 0;
              for (var i = 0; i < n; i++) total += matchsticks[i];
              if (n < 4 || total % 4 !== 0) return false;
              var side = total / 4;
              var a: number[] = matchsticks.slice().sort(function(x, y) { return y - x; });
              if (a[0] > side) return false;
              var sides: number[] = [0, 0, 0, 0];
              function dfs(idx: number): boolean {
                  if (idx === n) return true;
                  for (var j = 0; j < 4; j++) {
                      if (sides[j] + a[idx] > side) continue;
                      var dup = false;
                      for (var k = 0; k < j; k++) if (sides[k] === sides[j]) { dup = true; break; }
                      if (dup) continue;
                      sides[j] += a[idx];
                      if (dfs(idx + 1)) return true;
                      sides[j] -= a[idx];
                  }
                  return false;
              }
              return dfs(0);
          }
        `,
        java: code`
          public static boolean makesquare(int[] matchsticks) {
              int n = matchsticks.length;
              long total = 0;
              for (int v : matchsticks) total += v;
              if (n < 4 || total % 4 != 0) return false;
              long side = total / 4;
              int[] a = matchsticks.clone();
              Arrays.sort(a);
              for (int l = 0, r = n - 1; l < r; l++, r--) { int t = a[l]; a[l] = a[r]; a[r] = t; }
              if (a[0] > side) return false;
              return squareDfs(a, 0, new long[4], side);
          }

          static boolean squareDfs(int[] a, int idx, long[] sides, long side) {
              if (idx == a.length) return true;
              for (int j = 0; j < 4; j++) {
                  if (sides[j] + a[idx] > side) continue;
                  boolean dup = false;
                  for (int k = 0; k < j; k++) if (sides[k] == sides[j]) { dup = true; break; }
                  if (dup) continue;
                  sides[j] += a[idx];
                  if (squareDfs(a, idx + 1, sides, side)) return true;
                  sides[j] -= a[idx];
              }
              return false;
          }
        `,
        cpp: code`
          bool squareDfs(vector<int>& a, int idx, long long* sides, long long side) {
              if (idx == (int)a.size()) return true;
              for (int j = 0; j < 4; j++) {
                  if (sides[j] + a[idx] > side) continue;
                  bool dup = false;
                  for (int k = 0; k < j; k++) if (sides[k] == sides[j]) { dup = true; break; }
                  if (dup) continue;
                  sides[j] += a[idx];
                  if (squareDfs(a, idx + 1, sides, side)) return true;
                  sides[j] -= a[idx];
              }
              return false;
          }

          bool makesquare(vector<int>& matchsticks) {
              int n = matchsticks.size();
              long long total = 0;
              for (int v : matchsticks) total += v;
              if (n < 4 || total % 4 != 0) return false;
              long long side = total / 4;
              vector<int> a(matchsticks.begin(), matchsticks.end());
              sort(a.rbegin(), a.rend());
              if (a[0] > side) return false;
              long long sides[4] = {0, 0, 0, 0};
              return squareDfs(a, 0, sides, side);
          }
        `,
        c: code`
          static int squareCmpDesc(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a < b) - (a > b);
          }

          static bool squareDfs(int* a, int n, int idx, long long* sides, long long side) {
              if (idx == n) return true;
              for (int j = 0; j < 4; j++) {
                  if (sides[j] + a[idx] > side) continue;
                  bool dup = false;
                  for (int k = 0; k < j; k++) if (sides[k] == sides[j]) { dup = true; break; }
                  if (dup) continue;
                  sides[j] += a[idx];
                  if (squareDfs(a, n, idx + 1, sides, side)) return true;
                  sides[j] -= a[idx];
              }
              return false;
          }

          bool makesquare(int* matchsticks, int matchsticksSize) {
              int n = matchsticksSize;
              long long total = 0;
              for (int i = 0; i < n; i++) total += matchsticks[i];
              if (n < 4 || total % 4 != 0) return false;
              long long side = total / 4;
              int* a = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = matchsticks[i];
              qsort(a, n, sizeof(int), squareCmpDesc);
              if (a[0] > side) { free(a); return false; }
              long long sides[4] = {0, 0, 0, 0};
              bool ok = squareDfs(a, n, 0, sides, side);
              free(a);
              return ok;
          }
        `,
        csharp: code`
          public static bool Makesquare(int[] matchsticks)
          {
              int n = matchsticks.Length;
              long total = 0;
              foreach (int v in matchsticks) total += v;
              if (n < 4 || total % 4 != 0) return false;
              long side = total / 4;
              int[] a = (int[])matchsticks.Clone();
              Array.Sort(a);
              Array.Reverse(a);
              if (a[0] > side) return false;
              return SquareDfs(a, 0, new long[4], side);
          }

          static bool SquareDfs(int[] a, int idx, long[] sides, long side)
          {
              if (idx == a.Length) return true;
              for (int j = 0; j < 4; j++)
              {
                  if (sides[j] + a[idx] > side) continue;
                  bool dup = false;
                  for (int k = 0; k < j; k++) if (sides[k] == sides[j]) { dup = true; break; }
                  if (dup) continue;
                  sides[j] += a[idx];
                  if (SquareDfs(a, idx + 1, sides, side)) return true;
                  sides[j] -= a[idx];
              }
              return false;
          }
        `,
        go: code`
          func makesquare(matchsticks []int) bool {
          	n := len(matchsticks)
          	total := 0
          	for _, v := range matchsticks {
          		total += v
          	}
          	if n < 4 || total%4 != 0 {
          		return false
          	}
          	side := total / 4
          	a := make([]int, n)
          	copy(a, matchsticks)
          	sort.Sort(sort.Reverse(sort.IntSlice(a)))
          	if a[0] > side {
          		return false
          	}
          	sides := make([]int, 4)
          	var dfs func(idx int) bool
          	dfs = func(idx int) bool {
          		if idx == n {
          			return true
          		}
          		for j := 0; j < 4; j++ {
          			if sides[j]+a[idx] > side {
          				continue
          			}
          			dup := false
          			for k := 0; k < j; k++ {
          				if sides[k] == sides[j] {
          					dup = true
          					break
          				}
          			}
          			if dup {
          				continue
          			}
          			sides[j] += a[idx]
          			if dfs(idx + 1) {
          				return true
          			}
          			sides[j] -= a[idx]
          		}
          		return false
          	}
          	return dfs(0)
          }
        `,
        kotlin: code`
          fun makesquare(matchsticks: IntArray): Boolean {
              val n = matchsticks.size
              var total = 0L
              for (v in matchsticks) total += v
              if (n < 4 || total % 4 != 0L) return false
              val side = total / 4
              val a = matchsticks.sortedArrayDescending()
              if (a[0] > side) return false
              val sides = LongArray(4)
              fun dfs(idx: Int): Boolean {
                  if (idx == n) return true
                  for (j in 0 until 4) {
                      if (sides[j] + a[idx] > side) continue
                      var dup = false
                      for (k in 0 until j) if (sides[k] == sides[j]) { dup = true; break }
                      if (dup) continue
                      sides[j] += a[idx].toLong()
                      if (dfs(idx + 1)) return true
                      sides[j] -= a[idx].toLong()
                  }
                  return false
              }
              return dfs(0)
          }
        `,
        swift: code`
          func makesquare(_ matchsticks: [Int]) -> Bool {
              let n = matchsticks.count
              let total = matchsticks.reduce(0, +)
              if n < 4 || total % 4 != 0 { return false }
              let side = total / 4
              let a = matchsticks.sorted(by: >)
              if a[0] > side { return false }
              var sides = [0, 0, 0, 0]
              func dfs(_ idx: Int) -> Bool {
                  if idx == n { return true }
                  for j in 0..<4 {
                      if sides[j] + a[idx] > side { continue }
                      var dup = false
                      for k in 0..<j where sides[k] == sides[j] { dup = true; break }
                      if dup { continue }
                      sides[j] += a[idx]
                      if dfs(idx + 1) { return true }
                      sides[j] -= a[idx]
                  }
                  return false
              }
              return dfs(0)
          }
        `,
        rust: code`
          fn square_dfs(a: &Vec<i64>, idx: usize, sides: &mut [i64; 4], side: i64) -> bool {
              if idx == a.len() {
                  return true;
              }
              for j in 0..4 {
                  if sides[j] + a[idx] > side {
                      continue;
                  }
                  let mut dup = false;
                  for k in 0..j {
                      if sides[k] == sides[j] {
                          dup = true;
                          break;
                      }
                  }
                  if dup {
                      continue;
                  }
                  sides[j] += a[idx];
                  if square_dfs(a, idx + 1, sides, side) {
                      return true;
                  }
                  sides[j] -= a[idx];
              }
              false
          }

          fn makesquare(matchsticks: Vec<i32>) -> bool {
              let n = matchsticks.len();
              let mut a: Vec<i64> = matchsticks.iter().map(|&v| v as i64).collect();
              let total: i64 = a.iter().sum();
              if n < 4 || total % 4 != 0 {
                  return false;
              }
              let side = total / 4;
              a.sort_by(|x, y| y.cmp(x));
              if a[0] > side {
                  return false;
              }
              let mut sides = [0i64; 4];
              square_dfs(&a, 0, &mut sides, side)
          }
        `,
        php: code`
          function makesquare($matchsticks) {
              $n = count($matchsticks);
              $total = array_sum($matchsticks);
              if ($n < 4 || $total % 4 != 0) return false;
              $side = intdiv($total, 4);
              $a = $matchsticks;
              rsort($a);
              if ($a[0] > $side) return false;
              $sides = [0, 0, 0, 0];
              return squareDfs($a, 0, $sides, $side);
          }

          function squareDfs(&$a, $idx, &$sides, $side) {
              if ($idx == count($a)) return true;
              for ($j = 0; $j < 4; $j++) {
                  if ($sides[$j] + $a[$idx] > $side) continue;
                  $dup = false;
                  for ($k = 0; $k < $j; $k++) {
                      if ($sides[$k] == $sides[$j]) { $dup = true; break; }
                  }
                  if ($dup) continue;
                  $sides[$j] += $a[$idx];
                  if (squareDfs($a, $idx + 1, $sides, $side)) return true;
                  $sides[$j] -= $a[$idx];
              }
              return false;
          }
        `,
        ruby: code`
          def makesquare(matchsticks)
            n = matchsticks.length
            total = matchsticks.sum
            return false if n < 4 || total % 4 != 0
            side = total / 4
            a = matchsticks.sort.reverse
            return false if a[0] > side
            sides = [0, 0, 0, 0]
            square_dfs(a, 0, sides, side)
          end

          def square_dfs(a, idx, sides, side)
            return true if idx == a.length
            4.times do |j|
              next if sides[j] + a[idx] > side
              next if (0...j).any? { |k| sides[k] == sides[j] }
              sides[j] += a[idx]
              return true if square_dfs(a, idx + 1, sides, side)
              sides[j] -= a[idx]
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Letter Case Permutation (LC 784) ────────────────────────────
  (() => {
    const isLetter = (c: string) => /[a-zA-Z]/.test(c);
    const ref = (s: string) => {
      const pos: number[] = [];
      for (let i = 0; i < s.length; i++) if (isLetter(s[i])) pos.push(i);
      const out: string[] = [];
      for (let mask = 0; mask < 1 << pos.length; mask++) {
        const chars = s.split("");
        pos.forEach((p, b) => { chars[p] = mask & (1 << b) ? chars[p].toUpperCase() : chars[p].toLowerCase(); });
        out.push(chars.join(""));
      }
      return out.sort(cmpStr);
    };
    const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return {
      slug: "letter-case-permutation",
      title: "Letter Case Permutation",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Bit Manipulation", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "letterCasePermutation", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "`s` consists of English letters and digits. You may switch any letter of `s` to lowercase or to uppercase, independently of the others; digits stay as they are.\n\n" +
        "Return every distinct string you can produce this way, sorted in ascending **ASCII** order (digits before uppercase letters, uppercase before lowercase).",
        [
          { in: "s = \"a1b2\"", out: "[\"A1B2\",\"A1b2\",\"a1B2\",\"a1b2\"]" },
          { in: "s = \"7K\"", out: "[\"7K\",\"7k\"]" },
          { in: "s = \"2026\"", out: "[\"2026\"]", note: "No letters, so the string itself is the only result." },
        ],
        ["1 <= s.length <= 12", "s consists of lowercase letters, uppercase letters and digits"]),
      hints: [
        "Every letter doubles the number of results; digits contribute one choice. With `k` letters there are exactly `2^k` strings.",
        "Build the strings position by position: a letter branches into its lowercase and uppercase forms, a digit continues unchanged.",
        "Collect everything, then sort — or think of the uppercase/lowercase choice as the bits of a counter from 0 to `2^k - 1`.",
      ],
      editorial: explain({
        idea: "Each letter is an independent binary choice, so the answer is a product of `2^k` choices. A depth-first build (or a bitmask over the letter positions) enumerates them; a final byte-order sort fixes the order.",
        steps: [
          "Walk `s` with an index `i` and a working character buffer.",
          "If `i == n`, record the buffer as a string.",
          "If `s[i]` is a letter, set it to lowercase and recurse, then to uppercase and recurse; otherwise just recurse.",
          "Sort the collected strings by character code.",
        ],
        why: "Every combination of cases is a distinct path through the binary choices, and different paths differ at some letter's case, so all `2^k` strings are distinct and none is missed.",
        time: "O(2^k · n log(2^k)) with the sort",
        space: "O(2^k · n) for the output",
        pitfalls: [
          "Sort by character code, not with a locale-aware comparison: `'B'` must come before `'a'`.",
          "Digits do not branch — branching on them duplicates strings.",
          "The input may already contain uppercase letters; both cases are still produced.",
        ],
      }),
      examples: [
        { input: "\"a1b2\"", expectedOutput: "[\"A1B2\",\"A1b2\",\"a1B2\",\"a1b2\"]" },
        { input: "\"7K\"", expectedOutput: "[\"7K\",\"7k\"]" },
        { input: "\"2026\"", expectedOutput: "[\"2026\"]" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 12);
        const letters = Math.min(len, pick(rng, [0, 1, 2, 3, 3, 4, 4, 5, 6]));
        const positions = new Set(shuffle(rng, Array.from({ length: len }, (_, i) => i)).slice(0, letters));
        let s = "";
        for (let i = 0; i < len; i++) s += positions.has(i) ? LETTERS[ri(rng, 0, 51)] : String(ri(rng, 0, 9));
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def letterCasePermutation(s: str) -> List[str]:
              out = ['']
              for c in s:
                  if c.isalpha():
                      out = [p + c.lower() for p in out] + [p + c.upper() for p in out]
                  else:
                      out = [p + c for p in out]
              out.sort()
              return out
        `,
        javascript: code`
          var letterCasePermutation = function(s) {
              var chars = s.split('');
              var out = [];
              var dfs = function(i) {
                  if (i === chars.length) {
                      out.push(chars.join(''));
                      return;
                  }
                  var c = chars[i];
                  if (/[a-zA-Z]/.test(c)) {
                      chars[i] = c.toLowerCase();
                      dfs(i + 1);
                      chars[i] = c.toUpperCase();
                      dfs(i + 1);
                      chars[i] = c;
                  } else {
                      dfs(i + 1);
                  }
              };
              dfs(0);
              out.sort();
              return out;
          };
        `,
        typescript: code`
          function letterCasePermutation(s: string): string[] {
              var chars: string[] = s.split('');
              var out: string[] = [];
              function dfs(i: number): void {
                  if (i === chars.length) {
                      out.push(chars.join(''));
                      return;
                  }
                  var c = chars[i];
                  if (c.toLowerCase() !== c.toUpperCase()) {
                      chars[i] = c.toLowerCase();
                      dfs(i + 1);
                      chars[i] = c.toUpperCase();
                      dfs(i + 1);
                      chars[i] = c;
                  } else {
                      dfs(i + 1);
                  }
              }
              dfs(0);
              out.sort();
              return out;
          }
        `,
        java: code`
          public static String[] letterCasePermutation(String s) {
              List<String> out = new ArrayList<>();
              caseDfs(s.toCharArray(), 0, out);
              Collections.sort(out);
              return out.toArray(new String[0]);
          }

          static void caseDfs(char[] c, int i, List<String> out) {
              if (i == c.length) {
                  out.add(new String(c));
                  return;
              }
              if (Character.isLetter(c[i])) {
                  char orig = c[i];
                  c[i] = Character.toLowerCase(orig);
                  caseDfs(c, i + 1, out);
                  c[i] = Character.toUpperCase(orig);
                  caseDfs(c, i + 1, out);
                  c[i] = orig;
              } else {
                  caseDfs(c, i + 1, out);
              }
          }
        `,
        cpp: code`
          void caseDfs(string& c, int i, vector<string>& out) {
              if (i == (int)c.size()) {
                  out.push_back(c);
                  return;
              }
              if (isalpha((unsigned char)c[i])) {
                  char orig = c[i];
                  c[i] = (char)tolower((unsigned char)orig);
                  caseDfs(c, i + 1, out);
                  c[i] = (char)toupper((unsigned char)orig);
                  caseDfs(c, i + 1, out);
                  c[i] = orig;
              } else {
                  caseDfs(c, i + 1, out);
              }
          }

          vector<string> letterCasePermutation(string s) {
              vector<string> out;
              caseDfs(s, 0, out);
              sort(out.begin(), out.end());
              return out;
          }
        `,
        c: code`
          static int caseIsLetter(char ch) {
              return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
          }

          static int caseCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** letterCasePermutation(const char* s, int* returnSize) {
              int n = (int)strlen(s);
              int pos[16];
              int k = 0;
              for (int i = 0; i < n; i++) if (caseIsLetter(s[i])) pos[k++] = i;
              int total = 1 << k;
              char** out = (char**)malloc(sizeof(char*) * total);
              for (int mask = 0; mask < total; mask++) {
                  char* t = (char*)malloc(n + 1);
                  memcpy(t, s, n + 1);
                  for (int b = 0; b < k; b++) {
                      char ch = t[pos[b]];
                      if (mask & (1 << b)) {
                          if (ch >= 'a' && ch <= 'z') ch = (char)(ch - 'a' + 'A');
                      } else {
                          if (ch >= 'A' && ch <= 'Z') ch = (char)(ch - 'A' + 'a');
                      }
                      t[pos[b]] = ch;
                  }
                  out[mask] = t;
              }
              qsort(out, total, sizeof(char*), caseCmp);
              *returnSize = total;
              return out;
          }
        `,
        csharp: code`
          public static string[] LetterCasePermutation(string s)
          {
              var result = new List<string>();
              CaseDfs(s.ToCharArray(), 0, result);
              result.Sort((x, y) => string.CompareOrdinal(x, y));
              return result.ToArray();
          }

          static void CaseDfs(char[] c, int i, List<string> result)
          {
              if (i == c.Length)
              {
                  result.Add(new string(c));
                  return;
              }
              if (char.IsLetter(c[i]))
              {
                  char orig = c[i];
                  c[i] = char.ToLowerInvariant(orig);
                  CaseDfs(c, i + 1, result);
                  c[i] = char.ToUpperInvariant(orig);
                  CaseDfs(c, i + 1, result);
                  c[i] = orig;
              }
              else
              {
                  CaseDfs(c, i + 1, result);
              }
          }
        `,
        go: code`
          func letterCasePermutation(s string) []string {
          	b := []byte(s)
          	out := []string{}
          	var dfs func(i int)
          	dfs = func(i int) {
          		if i == len(b) {
          			out = append(out, string(b))
          			return
          		}
          		c := b[i]
          		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
          			b[i] = c | 32
          			dfs(i + 1)
          			b[i] = c &^ 32
          			dfs(i + 1)
          			b[i] = c
          		} else {
          			dfs(i + 1)
          		}
          	}
          	dfs(0)
          	sort.Strings(out)
          	return out
          }
        `,
        kotlin: code`
          fun letterCasePermutation(s: String): Array<String> {
              val c = s.toCharArray()
              val out = ArrayList<String>()
              fun dfs(i: Int) {
                  if (i == c.size) {
                      out.add(String(c))
                      return
                  }
                  if (c[i].isLetter()) {
                      val orig = c[i]
                      c[i] = orig.toLowerCase()
                      dfs(i + 1)
                      c[i] = orig.toUpperCase()
                      dfs(i + 1)
                      c[i] = orig
                  } else {
                      dfs(i + 1)
                  }
              }
              dfs(0)
              out.sort()
              return out.toTypedArray()
          }
        `,
        swift: code`
          func letterCasePermutation(_ s: String) -> [String] {
              var b = Array(s.utf8)
              var out = [String]()
              func dfs(_ i: Int) {
                  if i == b.count {
                      out.append(String(decoding: b, as: UTF8.self))
                      return
                  }
                  let c = b[i]
                  if (c >= 97 && c <= 122) || (c >= 65 && c <= 90) {
                      b[i] = c | 32
                      dfs(i + 1)
                      b[i] = c & ~32
                      dfs(i + 1)
                      b[i] = c
                  } else {
                      dfs(i + 1)
                  }
              }
              dfs(0)
              out.sort { $0.utf8.lexicographicallyPrecedes($1.utf8) }
              return out
          }
        `,
        rust: code`
          fn case_dfs(b: &mut Vec<u8>, i: usize, out: &mut Vec<String>) {
              if i == b.len() {
                  out.push(String::from_utf8(b.clone()).unwrap());
                  return;
              }
              let c = b[i];
              if (c >= b'a' && c <= b'z') || (c >= b'A' && c <= b'Z') {
                  b[i] = c | 32;
                  case_dfs(b, i + 1, out);
                  b[i] = c & !32u8;
                  case_dfs(b, i + 1, out);
                  b[i] = c;
              } else {
                  case_dfs(b, i + 1, out);
              }
          }

          fn letterCasePermutation(s: String) -> Vec<String> {
              let mut b: Vec<u8> = s.as_bytes().to_vec();
              let mut out: Vec<String> = Vec::new();
              case_dfs(&mut b, 0, &mut out);
              out.sort();
              out
          }
        `,
        php: code`
          function letterCasePermutation($s) {
              $out = [''];
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $c = $s[$i];
                  $next = [];
                  $o = ord($c);
                  if (($o >= 97 && $o <= 122) || ($o >= 65 && $o <= 90)) {
                      foreach ($out as $p) $next[] = $p . strtolower($c);
                      foreach ($out as $p) $next[] = $p . strtoupper($c);
                  } else {
                      foreach ($out as $p) $next[] = $p . $c;
                  }
                  $out = $next;
              }
              sort($out, SORT_STRING);
              return $out;
          }
        `,
        ruby: code`
          def letterCasePermutation(s)
            out = ['']
            s.each_char do |c|
              if c =~ /[a-zA-Z]/
                out = out.map { |p| p + c.downcase } + out.map { |p| p + c.upcase }
              else
                out = out.map { |p| p + c }
              end
            end
            out.sort
          end
        `,
      },
    };
  })(),


  // ── Splitting a String Into Descending Consecutive Values (LC 1849) ─
  (() => {
    const ref = (s: string) => {
      // Exact BigInt values, no magnitude cut-off: an independent check.
      const n = s.length;
      const ONE = BigInt(1);
      const TEN = BigInt(10);
      const dfs = (start: number, prev: bigint): boolean => {
        if (start === n) return true;
        let cur = BigInt(0);
        for (let j = start; j < n; j++) {
          cur = cur * TEN + BigInt(s.charCodeAt(j) - 48);
          if (cur >= prev) break;
          if (cur === prev - ONE && dfs(j + 1, cur)) return true;
        }
        return false;
      };
      let first = BigInt(0);
      for (let i = 0; i < n - 1; i++) {
        first = first * TEN + BigInt(s.charCodeAt(i) - 48);
        if (dfs(i + 1, first)) return true;
      }
      return false;
    };
    const yesString = (rng: Rng) => {
      for (;;) {
        const k = ri(rng, 2, 6);
        const mag = pick(rng, [1, 1, 2, 3, 4, 6, 9]);
        let v = mag === 1 ? ri(rng, k - 1, 9) : ri(rng, 10 ** (mag - 1), 10 ** mag - 1);
        if (rng() < 0.15 && mag > 1) v = 10 ** (mag - 1) + ri(rng, 0, k - 2);
        if (v - (k - 1) < 0) continue;
        let s = "";
        for (let t = 0; t < k; t++) {
          const zeros = rng() < 0.3 ? ri(rng, 1, 3) : 0;
          s += "0".repeat(zeros) + String(v - t);
        }
        if (s.length <= 20) return s;
      }
    };
    return {
      slug: "splitting-a-string-into-descending-consecutive-values",
      title: "Splitting a String Into Descending Consecutive Values",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Enumeration", "Google", "Amazon"],
      signature: { funcName: "splitString", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "`s` is a string of digits. Decide whether it can be cut into **two or more** non-empty consecutive pieces such that, reading each piece as a number, the values strictly decrease by **exactly 1** from one piece to the next.\n\n" +
        "Pieces may have leading zeros — `\"004\"` is read as `4`. Return `true` if such a split exists.",
        [
          { in: "s = \"050043\"", out: "true", note: "`\"05\"`, `\"004\"`, `\"3\"` read as 5, 4, 3." },
          { in: "s = \"1234\"", out: "false", note: "The values would have to decrease, but every split increases." },
          { in: "s = \"10009998\"", out: "true", note: "`\"100\"`, `\"099\"`, `\"98\"`." },
        ],
        ["1 <= s.length <= 20", "s consists only of digits"]),
      hints: [
        "Once the first piece is chosen, every later value is forced: it must be the previous value minus one.",
        "So try every first piece (it cannot be the whole string), then greedily check whether the rest can be cut into the forced values.",
        "Values may exceed 32 bits. Build each piece digit by digit and stop extending it as soon as it reaches the previous value — it can only grow. A first piece of 10^10 or more can never work in 20 characters.",
      ],
      editorial: explain({
        idea: "The first value determines the whole sequence. For each choice of first piece, scan the remainder and match the next expected value; prefixes only grow, so each check stops early.",
        steps: [
          "For every end `i` of the first piece with `i < n - 1`, accumulate its value `first` (stop once it reaches 10^10).",
          "`dfs(start, prev)`: if `start == n`, succeed. Otherwise extend a piece `cur` from `start` digit by digit; if `cur >= prev`, stop; if `cur == prev - 1`, try `dfs(j + 1, cur)`.",
          "Return true when any first piece leads to success.",
        ],
        why: "A valid split is fully described by its first piece, and the pruning only discards pieces whose value is already at least `prev` — adding digits never decreases a value, so those can never equal `prev - 1`. If the first value has `d` significant digits, the next one needs at least `d - 1`, so `2d - 1 <= 20` and the first value is below 10^10, which keeps every quantity inside 64 bits.",
        time: "O(n^2) per first piece, O(n^3) overall (n ≤ 20)",
        space: "O(n) recursion depth",
        pitfalls: [
          "At least two pieces are required: the whole string on its own does not count.",
          "Leading zeros are allowed, so `\"0090089\"`-style pieces are legal; do not reject them.",
          "Parsing a 20-digit piece into a 64-bit integer overflows — prune by value before it gets that large.",
        ],
      }),
      examples: [
        { input: "\"050043\"", expectedOutput: "true" },
        { input: "\"1234\"", expectedOutput: "false" },
        { input: "\"10009998\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 9);
        let s: string;
        if (mode < 5) s = yesString(rng);
        else if (mode < 8) {
          const chars = yesString(rng).split("");
          const i = ri(rng, 0, chars.length - 1);
          chars[i] = String(ri(rng, 0, 9));
          s = chars.join("");
        } else {
          const len = ri(rng, 1, 20);
          s = "";
          for (let i = 0; i < len; i++) s += String(rng() < 0.2 ? 0 : ri(rng, 0, 9));
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def splitString(s: str) -> bool:
              n = len(s)
              limit = 10 ** 10

              def dfs(start, prev):
                  if start == n:
                      return True
                  cur = 0
                  for j in range(start, n):
                      cur = cur * 10 + ord(s[j]) - 48
                      if cur >= prev:
                          break
                      if cur == prev - 1 and dfs(j + 1, cur):
                          return True
                  return False

              first = 0
              for i in range(n - 1):
                  first = first * 10 + ord(s[i]) - 48
                  if first >= limit:
                      break
                  if dfs(i + 1, first):
                      return True
              return False
        `,
        javascript: code`
          var splitString = function(s) {
              var n = s.length;
              var LIMIT = 10000000000;
              var dfs = function(start, prev) {
                  if (start === n) return true;
                  var cur = 0;
                  for (var j = start; j < n; j++) {
                      cur = cur * 10 + (s.charCodeAt(j) - 48);
                      if (cur >= prev) break;
                      if (cur === prev - 1 && dfs(j + 1, cur)) return true;
                  }
                  return false;
              };
              var first = 0;
              for (var i = 0; i < n - 1; i++) {
                  first = first * 10 + (s.charCodeAt(i) - 48);
                  if (first >= LIMIT) break;
                  if (dfs(i + 1, first)) return true;
              }
              return false;
          };
        `,
        typescript: code`
          function splitString(s: string): boolean {
              var n = s.length;
              var LIMIT = 10000000000;
              function dfs(start: number, prev: number): boolean {
                  if (start === n) return true;
                  var cur = 0;
                  for (var j = start; j < n; j++) {
                      cur = cur * 10 + (s.charCodeAt(j) - 48);
                      if (cur >= prev) break;
                      if (cur === prev - 1 && dfs(j + 1, cur)) return true;
                  }
                  return false;
              }
              var first = 0;
              for (var i = 0; i < n - 1; i++) {
                  first = first * 10 + (s.charCodeAt(i) - 48);
                  if (first >= LIMIT) break;
                  if (dfs(i + 1, first)) return true;
              }
              return false;
          }
        `,
        java: code`
          public static boolean splitString(String s) {
              int n = s.length();
              long first = 0;
              for (int i = 0; i < n - 1; i++) {
                  first = first * 10 + (s.charAt(i) - '0');
                  if (first >= 10000000000L) break;
                  if (splitDfs(s, i + 1, first)) return true;
              }
              return false;
          }

          static boolean splitDfs(String s, int start, long prev) {
              if (start == s.length()) return true;
              long cur = 0;
              for (int j = start; j < s.length(); j++) {
                  cur = cur * 10 + (s.charAt(j) - '0');
                  if (cur >= prev) break;
                  if (cur == prev - 1 && splitDfs(s, j + 1, cur)) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool splitDfs(const string& s, int start, long long prev) {
              if (start == (int)s.size()) return true;
              long long cur = 0;
              for (int j = start; j < (int)s.size(); j++) {
                  cur = cur * 10 + (s[j] - '0');
                  if (cur >= prev) break;
                  if (cur == prev - 1 && splitDfs(s, j + 1, cur)) return true;
              }
              return false;
          }

          bool splitString(string s) {
              int n = s.size();
              long long first = 0;
              for (int i = 0; i < n - 1; i++) {
                  first = first * 10 + (s[i] - '0');
                  if (first >= 10000000000LL) break;
                  if (splitDfs(s, i + 1, first)) return true;
              }
              return false;
          }
        `,
        c: code`
          static bool splitDfs(const char* s, int n, int start, long long prev) {
              if (start == n) return true;
              long long cur = 0;
              for (int j = start; j < n; j++) {
                  cur = cur * 10 + (s[j] - '0');
                  if (cur >= prev) break;
                  if (cur == prev - 1 && splitDfs(s, n, j + 1, cur)) return true;
              }
              return false;
          }

          bool splitString(const char* s) {
              int n = (int)strlen(s);
              long long first = 0;
              for (int i = 0; i < n - 1; i++) {
                  first = first * 10 + (s[i] - '0');
                  if (first >= 10000000000LL) break;
                  if (splitDfs(s, n, i + 1, first)) return true;
              }
              return false;
          }
        `,
        csharp: code`
          public static bool SplitString(string s)
          {
              int n = s.Length;
              long first = 0;
              for (int i = 0; i < n - 1; i++)
              {
                  first = first * 10 + (s[i] - '0');
                  if (first >= 10000000000L) break;
                  if (SplitDfs(s, i + 1, first)) return true;
              }
              return false;
          }

          static bool SplitDfs(string s, int start, long prev)
          {
              if (start == s.Length) return true;
              long cur = 0;
              for (int j = start; j < s.Length; j++)
              {
                  cur = cur * 10 + (s[j] - '0');
                  if (cur >= prev) break;
                  if (cur == prev - 1 && SplitDfs(s, j + 1, cur)) return true;
              }
              return false;
          }
        `,
        go: code`
          func splitDfs(s string, start int, prev int64) bool {
          	if start == len(s) {
          		return true
          	}
          	var cur int64
          	for j := start; j < len(s); j++ {
          		cur = cur*10 + int64(s[j]-'0')
          		if cur >= prev {
          			break
          		}
          		if cur == prev-1 && splitDfs(s, j+1, cur) {
          			return true
          		}
          	}
          	return false
          }

          func splitString(s string) bool {
          	var first int64
          	for i := 0; i < len(s)-1; i++ {
          		first = first*10 + int64(s[i]-'0')
          		if first >= 10000000000 {
          			break
          		}
          		if splitDfs(s, i+1, first) {
          			return true
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          fun splitDfs(s: String, start: Int, prev: Long): Boolean {
              if (start == s.length) return true
              var cur = 0L
              for (j in start until s.length) {
                  cur = cur * 10 + (s[j] - '0')
                  if (cur >= prev) break
                  if (cur == prev - 1 && splitDfs(s, j + 1, cur)) return true
              }
              return false
          }

          fun splitString(s: String): Boolean {
              var first = 0L
              for (i in 0 until s.length - 1) {
                  first = first * 10 + (s[i] - '0')
                  if (first >= 10000000000L) break
                  if (splitDfs(s, i + 1, first)) return true
              }
              return false
          }
        `,
        swift: code`
          func splitDfs(_ d: [Int], _ start: Int, _ prev: Int) -> Bool {
              if start == d.count { return true }
              var cur = 0
              var j = start
              while j < d.count {
                  cur = cur * 10 + d[j]
                  if cur >= prev { break }
                  if cur == prev - 1 && splitDfs(d, j + 1, cur) { return true }
                  j += 1
              }
              return false
          }

          func splitString(_ s: String) -> Bool {
              let d = Array(s.utf8).map { Int($0) - 48 }
              var first = 0
              var i = 0
              while i < d.count - 1 {
                  first = first * 10 + d[i]
                  if first >= 10000000000 { break }
                  if splitDfs(d, i + 1, first) { return true }
                  i += 1
              }
              return false
          }
        `,
        rust: code`
          fn split_dfs(d: &[u8], start: usize, prev: i64) -> bool {
              if start == d.len() {
                  return true;
              }
              let mut cur: i64 = 0;
              for j in start..d.len() {
                  cur = cur * 10 + (d[j] - b'0') as i64;
                  if cur >= prev {
                      break;
                  }
                  if cur == prev - 1 && split_dfs(d, j + 1, cur) {
                      return true;
                  }
              }
              false
          }

          fn splitString(s: String) -> bool {
              let d = s.as_bytes();
              let mut first: i64 = 0;
              for i in 0..d.len() - 1 {
                  first = first * 10 + (d[i] - b'0') as i64;
                  if first >= 10_000_000_000 {
                      break;
                  }
                  if split_dfs(d, i + 1, first) {
                      return true;
                  }
              }
              false
          }
        `,
        php: code`
          function splitString($s) {
              $n = strlen($s);
              $first = 0;
              for ($i = 0; $i < $n - 1; $i++) {
                  $first = $first * 10 + (ord($s[$i]) - 48);
                  if ($first >= 10000000000) break;
                  if (splitDfs($s, $n, $i + 1, $first)) return true;
              }
              return false;
          }

          function splitDfs($s, $n, $start, $prev) {
              if ($start == $n) return true;
              $cur = 0;
              for ($j = $start; $j < $n; $j++) {
                  $cur = $cur * 10 + (ord($s[$j]) - 48);
                  if ($cur >= $prev) break;
                  if ($cur == $prev - 1 && splitDfs($s, $n, $j + 1, $cur)) return true;
              }
              return false;
          }
        `,
        ruby: code`
          def splitString(s)
            n = s.length
            first = 0
            (0...(n - 1)).each do |i|
              first = first * 10 + (s[i].ord - 48)
              break if first >= 10_000_000_000
              return true if split_dfs(s, n, i + 1, first)
            end
            false
          end

          def split_dfs(s, n, start, prev)
            return true if start == n
            cur = 0
            (start...n).each do |j|
              cur = cur * 10 + (s[j].ord - 48)
              break if cur >= prev
              return true if cur == prev - 1 && split_dfs(s, n, j + 1, cur)
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Numbers With Same Consecutive Differences (LC 967) ──────────
  (() => {
    const ref = (n: number, k: number) => {
      let cur = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let step = 1; step < n; step++) {
        const nxt: number[] = [];
        for (const x of cur) {
          const d = x % 10;
          for (const nd of new Set([d - k, d + k])) if (nd >= 0 && nd <= 9) nxt.push(x * 10 + nd);
        }
        cur = nxt;
      }
      return cur.sort((a, b) => a - b);
    };
    return {
      slug: "numbers-with-same-consecutive-differences",
      title: "Numbers With Same Consecutive Differences",
      difficulty: "MEDIUM" as const,
      tags: ["Backtracking", "Breadth-First Search", "Amazon", "Flipkart"],
      signature: {
        funcName: "numsSameConsecDiff",
        params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Return every `n`-digit positive integer in which any two neighbouring digits differ by exactly `k` (in absolute value). Numbers may not have leading zeros, so the first digit is between 1 and 9 — but later digits may be 0.\n\n" +
        "Return the numbers in **ascending** order.",
        [
          { in: "n = 3, k = 7", out: "[181,292,707,818,929]" },
          { in: "n = 2, k = 1", out: "[10,12,21,23,32,34,43,45,54,56,65,67,76,78,87,89,98]" },
          { in: "n = 2, k = 0", out: "[11,22,33,44,55,66,77,88,99]", note: "With k = 0 every digit repeats the first; each number appears once." },
        ],
        ["2 <= n <= 9", "0 <= k <= 9"]),
      hints: [
        "Build the numbers digit by digit: after a digit `d`, the next digit can only be `d - k` or `d + k`, if it stays between 0 and 9.",
        "Start from each first digit 1..9 and extend depth-first (or level by level) until the number has `n` digits.",
        "When `k = 0`, `d - k` and `d + k` are the same digit — take it once, or you will list numbers twice.",
      ],
      editorial: explain({
        idea: "Every valid number is a walk of length `n` on the digits where each step moves by `±k`. Enumerate the walks from each non-zero first digit.",
        steps: [
          "For each first digit `f` from 1 to 9, run `dfs(f, 1)`.",
          "`dfs(num, len)`: if `len == n`, record `num`. Otherwise let `d = num % 10` and recurse on `num * 10 + (d - k)` when `d - k >= 0`, then on `num * 10 + (d + k)` when `k > 0` and `d + k <= 9`.",
          "Because every number has the same length, trying smaller digits first at every position produces them in ascending order.",
        ],
        why: "Each number is determined by its digits, and each digit after the first is forced to be one of at most two values, so the search lists every valid number exactly once (the `k > 0` test stops the duplicate branch when the two candidates coincide).",
        time: "O(9 · 2^(n-1)) numbers at most",
        space: "O(n) recursion depth besides the output",
        pitfalls: [
          "The first digit cannot be 0, but later digits can.",
          "k = 0 makes both candidates equal; branching twice duplicates every number.",
          "The largest value, 989898989, still fits in a 32-bit int.",
        ],
      }),
      examples: [
        { input: "3\n7", expectedOutput: "[181,292,707,818,929]" },
        { input: "2\n1", expectedOutput: "[10,12,21,23,32,34,43,45,54,56,65,67,76,78,87,89,98]" },
        { input: "2\n0", expectedOutput: "[11,22,33,44,55,66,77,88,99]" },
      ],
      hiddenCount: 100,
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 9);
        const k = rng() < 0.15 ? 1 : ri(rng, 0, 9);
        return { input: `${n}\n${k}`, expectedOutput: fmtIntArr(ref(n, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numsSameConsecDiff(n: int, k: int) -> List[int]:
              out = []

              def dfs(num, length):
                  if length == n:
                      out.append(num)
                      return
                  d = num % 10
                  if d - k >= 0:
                      dfs(num * 10 + d - k, length + 1)
                  if k > 0 and d + k <= 9:
                      dfs(num * 10 + d + k, length + 1)

              for f in range(1, 10):
                  dfs(f, 1)
              return out
        `,
        javascript: code`
          var numsSameConsecDiff = function(n, k) {
              var out = [];
              var dfs = function(num, len) {
                  if (len === n) {
                      out.push(num);
                      return;
                  }
                  var d = num % 10;
                  if (d - k >= 0) dfs(num * 10 + d - k, len + 1);
                  if (k > 0 && d + k <= 9) dfs(num * 10 + d + k, len + 1);
              };
              for (var f = 1; f <= 9; f++) dfs(f, 1);
              return out;
          };
        `,
        typescript: code`
          function numsSameConsecDiff(n: number, k: number): number[] {
              var out: number[] = [];
              function dfs(num: number, len: number): void {
                  if (len === n) {
                      out.push(num);
                      return;
                  }
                  var d = num % 10;
                  if (d - k >= 0) dfs(num * 10 + d - k, len + 1);
                  if (k > 0 && d + k <= 9) dfs(num * 10 + d + k, len + 1);
              }
              for (var f = 1; f <= 9; f++) dfs(f, 1);
              return out;
          }
        `,
        java: code`
          public static int[] numsSameConsecDiff(int n, int k) {
              List<Integer> out = new ArrayList<>();
              for (int f = 1; f <= 9; f++) consecDfs(f, 1, n, k, out);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }

          static void consecDfs(int num, int len, int n, int k, List<Integer> out) {
              if (len == n) {
                  out.add(num);
                  return;
              }
              int d = num % 10;
              if (d - k >= 0) consecDfs(num * 10 + d - k, len + 1, n, k, out);
              if (k > 0 && d + k <= 9) consecDfs(num * 10 + d + k, len + 1, n, k, out);
          }
        `,
        cpp: code`
          void consecDfs(int num, int len, int n, int k, vector<int>& out) {
              if (len == n) {
                  out.push_back(num);
                  return;
              }
              int d = num % 10;
              if (d - k >= 0) consecDfs(num * 10 + d - k, len + 1, n, k, out);
              if (k > 0 && d + k <= 9) consecDfs(num * 10 + d + k, len + 1, n, k, out);
          }

          vector<int> numsSameConsecDiff(int n, int k) {
              vector<int> out;
              for (int f = 1; f <= 9; f++) consecDfs(f, 1, n, k, out);
              return out;
          }
        `,
        c: code`
          static void consecDfs(int num, int len, int n, int k, int** out, int* count, int* cap) {
              if (len == n) {
                  if (*count == *cap) {
                      *cap *= 2;
                      *out = (int*)realloc(*out, sizeof(int) * (*cap));
                  }
                  (*out)[(*count)++] = num;
                  return;
              }
              int d = num % 10;
              if (d - k >= 0) consecDfs(num * 10 + d - k, len + 1, n, k, out, count, cap);
              if (k > 0 && d + k <= 9) consecDfs(num * 10 + d + k, len + 1, n, k, out, count, cap);
          }

          int* numsSameConsecDiff(int n, int k, int* returnSize) {
              int cap = 64, count = 0;
              int* out = (int*)malloc(sizeof(int) * cap);
              for (int f = 1; f <= 9; f++) consecDfs(f, 1, n, k, &out, &count, &cap);
              *returnSize = count;
              return out;
          }
        `,
        csharp: code`
          public static int[] NumsSameConsecDiff(int n, int k)
          {
              var result = new List<int>();
              for (int f = 1; f <= 9; f++) ConsecDfs(f, 1, n, k, result);
              return result.ToArray();
          }

          static void ConsecDfs(int num, int len, int n, int k, List<int> result)
          {
              if (len == n)
              {
                  result.Add(num);
                  return;
              }
              int d = num % 10;
              if (d - k >= 0) ConsecDfs(num * 10 + d - k, len + 1, n, k, result);
              if (k > 0 && d + k <= 9) ConsecDfs(num * 10 + d + k, len + 1, n, k, result);
          }
        `,
        go: code`
          func numsSameConsecDiff(n int, k int) []int {
          	out := []int{}
          	var dfs func(num, length int)
          	dfs = func(num, length int) {
          		if length == n {
          			out = append(out, num)
          			return
          		}
          		d := num % 10
          		if d-k >= 0 {
          			dfs(num*10+d-k, length+1)
          		}
          		if k > 0 && d+k <= 9 {
          			dfs(num*10+d+k, length+1)
          		}
          	}
          	for f := 1; f <= 9; f++ {
          		dfs(f, 1)
          	}
          	return out
          }
        `,
        kotlin: code`
          fun numsSameConsecDiff(n: Int, k: Int): IntArray {
              val out = ArrayList<Int>()
              fun dfs(num: Int, len: Int) {
                  if (len == n) {
                      out.add(num)
                      return
                  }
                  val d = num % 10
                  if (d - k >= 0) dfs(num * 10 + d - k, len + 1)
                  if (k > 0 && d + k <= 9) dfs(num * 10 + d + k, len + 1)
              }
              for (f in 1..9) dfs(f, 1)
              return out.toIntArray()
          }
        `,
        swift: code`
          func numsSameConsecDiff(_ n: Int, _ k: Int) -> [Int] {
              var out = [Int]()
              func dfs(_ num: Int, _ len: Int) {
                  if len == n {
                      out.append(num)
                      return
                  }
                  let d = num % 10
                  if d - k >= 0 { dfs(num * 10 + d - k, len + 1) }
                  if k > 0 && d + k <= 9 { dfs(num * 10 + d + k, len + 1) }
              }
              for f in 1...9 { dfs(f, 1) }
              return out
          }
        `,
        rust: code`
          fn consec_dfs(num: i32, len: i32, n: i32, k: i32, out: &mut Vec<i32>) {
              if len == n {
                  out.push(num);
                  return;
              }
              let d = num % 10;
              if d - k >= 0 {
                  consec_dfs(num * 10 + d - k, len + 1, n, k, out);
              }
              if k > 0 && d + k <= 9 {
                  consec_dfs(num * 10 + d + k, len + 1, n, k, out);
              }
          }

          fn numsSameConsecDiff(n: i32, k: i32) -> Vec<i32> {
              let mut out: Vec<i32> = Vec::new();
              for f in 1..10 {
                  consec_dfs(f, 1, n, k, &mut out);
              }
              out
          }
        `,
        php: code`
          function numsSameConsecDiff($n, $k) {
              $out = [];
              for ($f = 1; $f <= 9; $f++) consecDfs($f, 1, $n, $k, $out);
              return $out;
          }

          function consecDfs($num, $len, $n, $k, &$out) {
              if ($len == $n) {
                  $out[] = $num;
                  return;
              }
              $d = $num % 10;
              if ($d - $k >= 0) consecDfs($num * 10 + $d - $k, $len + 1, $n, $k, $out);
              if ($k > 0 && $d + $k <= 9) consecDfs($num * 10 + $d + $k, $len + 1, $n, $k, $out);
          }
        `,
        ruby: code`
          def numsSameConsecDiff(n, k)
            out = []
            (1..9).each { |f| consec_dfs(f, 1, n, k, out) }
            out
          end

          def consec_dfs(num, len, n, k, out)
            if len == n
              out << num
              return
            end
            d = num % 10
            consec_dfs(num * 10 + d - k, len + 1, n, k, out) if d - k >= 0
            consec_dfs(num * 10 + d + k, len + 1, n, k, out) if k > 0 && d + k <= 9
          end
        `,
      },
    };
  })(),

  // ── Distribute Repeating Integers (LC 1655) ─────────────────────
  (() => {
    /** Subset DP over customers: dp[mask] after each distinct value's count. */
    const ref = (nums: number[], quantity: number[]) => {
      const freq = new Map<number, number>();
      for (const v of nums) freq.set(v, (freq.get(v) || 0) + 1);
      const m = quantity.length;
      const full = (1 << m) - 1;
      const sum = new Array<number>(1 << m).fill(0);
      for (let mask = 1; mask <= full; mask++) {
        let low = 0;
        while (!(mask & (1 << low))) low++;
        sum[mask] = sum[mask & (mask - 1)] + quantity[low];
      }
      let dp = new Uint8Array(1 << m);
      dp[0] = 1;
      for (const c of freq.values()) {
        const nd = dp.slice();
        for (let mask = 1; mask <= full; mask++) {
          if (nd[mask]) continue;
          for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
            if (sum[sub] <= c && dp[mask ^ sub]) { nd[mask] = 1; break; }
          }
        }
        dp = nd;
      }
      return dp[full] === 1;
    };
    return {
      slug: "distribute-repeating-integers",
      title: "Distribute Repeating Integers",
      difficulty: "HARD" as const,
      tags: ["Array", "Backtracking", "Bitmask", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "canDistribute",
        params: [{ name: "nums", type: "int[]" as const }, { name: "quantity", type: "int[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A warehouse holds the integers in `nums` (at most 50 distinct values, each possibly repeated many times). There are `m` customers; customer `i` wants exactly `quantity[i]` integers, and all the integers one customer receives must be **equal** to each other. Each integer in `nums` can be given to at most one customer, and some may be left over.\n\n" +
        "Return `true` if every customer can be satisfied at the same time.",
        [
          { in: "nums = [4,4,4,9,9], quantity = [2,2]", out: "true", note: "One customer gets `[4,4]`, the other `[9,9]`." },
          { in: "nums = [1,2,3,3], quantity = [2,2]", out: "false", note: "Only the value 3 appears twice, and it cannot serve both customers." },
          { in: "nums = [5,5,5,5,5,5], quantity = [3,1,2]", out: "true", note: "All three customers take 5s: 3 + 1 + 2 = 6." },
        ],
        [
          "1 <= nums.length <= 10^5",
          "1 <= nums[i] <= 1000",
          "There are at most 50 distinct values in nums",
          "1 <= quantity.length <= 10",
          "1 <= quantity[i] <= 10^5",
        ]),
      hints: [
        "Only how many copies each value has matters, not the values themselves.",
        "There are at most 10 customers. Try to serve them one at a time, choosing which value's stock each one draws from.",
        "Serve the largest orders first so dead ends appear early, and when two values have the same remaining stock, trying both is redundant — try only one.",
      ],
      editorial: explain({
        idea: "Reduce `nums` to the multiset of stock counts, then backtrack over customers, largest order first, assigning each to a value whose remaining stock can cover it. Interchangeable stocks (equal remaining counts) are tried once.",
        steps: [
          "Count each distinct value; keep only the counts.",
          "Sort `quantity` in decreasing order.",
          "`dfs(i)`: if `i == m`, succeed. For each stock `j` with `count[j] >= quantity[i]` whose current count differs from every earlier stock's, subtract, recurse on `i + 1`, and add back.",
          "Return `dfs(0)`.",
        ],
        why: "Every valid distribution assigns each customer to one value with enough stock, which is exactly what the search enumerates. Two stocks with the same remaining count are interchangeable for all later customers, so skipping the second one discards only mirror images of branches already explored. A bitmask DP over subsets of customers (O(k · 3^m)) proves the same answer and is the alternative when the search space is adversarial.",
        time: "O(k^m) worst case for k distinct values; tiny in practice. The subset DP is O(k · 3^m).",
        space: "O(k + m)",
        pitfalls: [
          "A customer's integers must all be the same value — you cannot split one order across two values.",
          "Several customers may share one value as long as its count covers all of them.",
          "Sorting the orders in decreasing order matters for speed, not for correctness.",
        ],
      }),
      examples: [
        { input: "[4,4,4,9,9]\n[2,2]", expectedOutput: "true" },
        { input: "[1,2,3,3]\n[2,2]", expectedOutput: "false" },
        { input: "[5,5,5,5,5,5]\n[3,1,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const u = ri(rng, 1, 8);
        const m = ri(rng, 1, 8);
        const valueSet = new Set<number>();
        while (valueSet.size < u) valueSet.add(ri(rng, 1, 1000));
        const values = [...valueSet];
        const cap = pick(rng, [3, 6, 12]);
        const counts = values.map(() => ri(rng, 1, cap));
        let quantity: number[];
        if (rng() < 0.5) {
          // Build a feasible order book, then maybe nudge one order up.
          const owner = Array.from({ length: m }, () => ri(rng, 0, u - 1));
          quantity = new Array<number>(m).fill(0);
          for (let j = 0; j < u; j++) {
            const mine: number[] = [];
            for (let i = 0; i < m; i++) if (owner[i] === j) mine.push(i);
            if (!mine.length) continue;
            if (counts[j] < mine.length) counts[j] = mine.length + ri(rng, 0, 3);
            const budget = ri(rng, mine.length, counts[j]);
            let left = budget;
            mine.forEach((i, t) => {
              const rest = mine.length - t - 1;
              const q = t === mine.length - 1 ? left : ri(rng, 1, left - rest);
              quantity[i] = q;
              left -= q;
            });
          }
          if (rng() < 0.4) quantity[ri(rng, 0, m - 1)] += ri(rng, 1, 3);
        } else {
          quantity = Array.from({ length: m }, () => ri(rng, 1, cap));
        }
        const nums: number[] = [];
        values.forEach((v, j) => { for (let t = 0; t < counts[j]; t++) nums.push(v); });
        shuffle(rng, nums);
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(quantity)}`, expectedOutput: bool(ref(nums, quantity)) };
      },
      solutions: {
        python: code`
          from typing import List

          def canDistribute(nums: List[int], quantity: List[int]) -> bool:
              freq = {}
              for v in nums:
                  freq[v] = freq.get(v, 0) + 1
              counts = sorted(freq.values(), reverse=True)
              q = sorted(quantity, reverse=True)
              m = len(q)

              def dfs(i):
                  if i == m:
                      return True
                  for j in range(len(counts)):
                      if counts[j] < q[i]:
                          continue
                      if any(counts[t] == counts[j] for t in range(j)):
                          continue
                      counts[j] -= q[i]
                      if dfs(i + 1):
                          return True
                      counts[j] += q[i]
                  return False

              return dfs(0)
        `,
        javascript: code`
          var canDistribute = function(nums, quantity) {
              var freq = new Map();
              for (var i = 0; i < nums.length; i++) freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
              var counts = Array.from(freq.values()).sort(function(a, b) { return b - a; });
              var q = quantity.slice().sort(function(a, b) { return b - a; });
              var dfs = function(i) {
                  if (i === q.length) return true;
                  for (var j = 0; j < counts.length; j++) {
                      if (counts[j] < q[i]) continue;
                      var dup = false;
                      for (var t = 0; t < j; t++) if (counts[t] === counts[j]) { dup = true; break; }
                      if (dup) continue;
                      counts[j] -= q[i];
                      if (dfs(i + 1)) return true;
                      counts[j] += q[i];
                  }
                  return false;
              };
              return dfs(0);
          };
        `,
        typescript: code`
          function canDistribute(nums: number[], quantity: number[]): boolean {
              var freq: { [k: string]: number } = {};
              var keys: string[] = [];
              for (var i = 0; i < nums.length; i++) {
                  var key = "" + nums[i];
                  if (freq[key] === undefined) { freq[key] = 0; keys.push(key); }
                  freq[key]++;
              }
              var counts: number[] = [];
              for (var k = 0; k < keys.length; k++) counts.push(freq[keys[k]]);
              counts.sort(function(a, b) { return b - a; });
              var q: number[] = quantity.slice().sort(function(a, b) { return b - a; });
              function dfs(idx: number): boolean {
                  if (idx === q.length) return true;
                  for (var j = 0; j < counts.length; j++) {
                      if (counts[j] < q[idx]) continue;
                      var dup = false;
                      for (var t = 0; t < j; t++) if (counts[t] === counts[j]) { dup = true; break; }
                      if (dup) continue;
                      counts[j] -= q[idx];
                      if (dfs(idx + 1)) return true;
                      counts[j] += q[idx];
                  }
                  return false;
              }
              return dfs(0);
          }
        `,
        java: code`
          public static boolean canDistribute(int[] nums, int[] quantity) {
              Map<Integer, Integer> freq = new HashMap<>();
              for (int v : nums) freq.merge(v, 1, Integer::sum);
              int[] counts = new int[freq.size()];
              int idx = 0;
              for (int c : freq.values()) counts[idx++] = c;
              int[] q = quantity.clone();
              Arrays.sort(q);
              for (int l = 0, r = q.length - 1; l < r; l++, r--) { int t = q[l]; q[l] = q[r]; q[r] = t; }
              return distDfs(counts, q, 0);
          }

          static boolean distDfs(int[] counts, int[] q, int i) {
              if (i == q.length) return true;
              for (int j = 0; j < counts.length; j++) {
                  if (counts[j] < q[i]) continue;
                  boolean dup = false;
                  for (int t = 0; t < j; t++) if (counts[t] == counts[j]) { dup = true; break; }
                  if (dup) continue;
                  counts[j] -= q[i];
                  if (distDfs(counts, q, i + 1)) return true;
                  counts[j] += q[i];
              }
              return false;
          }
        `,
        cpp: code`
          bool distDfs(vector<int>& counts, vector<int>& q, int i) {
              if (i == (int)q.size()) return true;
              for (int j = 0; j < (int)counts.size(); j++) {
                  if (counts[j] < q[i]) continue;
                  bool dup = false;
                  for (int t = 0; t < j; t++) if (counts[t] == counts[j]) { dup = true; break; }
                  if (dup) continue;
                  counts[j] -= q[i];
                  if (distDfs(counts, q, i + 1)) return true;
                  counts[j] += q[i];
              }
              return false;
          }

          bool canDistribute(vector<int>& nums, vector<int>& quantity) {
              map<int, int> freq;
              for (int v : nums) freq[v]++;
              vector<int> counts;
              for (auto& p : freq) counts.push_back(p.second);
              vector<int> q(quantity.begin(), quantity.end());
              sort(q.rbegin(), q.rend());
              return distDfs(counts, q, 0);
          }
        `,
        c: code`
          static int distCmpDesc(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a < b) - (a > b);
          }

          static bool distDfs(int* counts, int k, int* q, int m, int i) {
              if (i == m) return true;
              for (int j = 0; j < k; j++) {
                  if (counts[j] < q[i]) continue;
                  bool dup = false;
                  for (int t = 0; t < j; t++) if (counts[t] == counts[j]) { dup = true; break; }
                  if (dup) continue;
                  counts[j] -= q[i];
                  if (distDfs(counts, k, q, m, i + 1)) return true;
                  counts[j] += q[i];
              }
              return false;
          }

          bool canDistribute(int* nums, int numsSize, int* quantity, int quantitySize) {
              int freq[1001];
              memset(freq, 0, sizeof(freq));
              for (int i = 0; i < numsSize; i++) freq[nums[i]]++;
              int counts[1001];
              int k = 0;
              for (int v = 0; v <= 1000; v++) if (freq[v] > 0) counts[k++] = freq[v];
              int* q = (int*)malloc(sizeof(int) * quantitySize);
              for (int i = 0; i < quantitySize; i++) q[i] = quantity[i];
              qsort(q, quantitySize, sizeof(int), distCmpDesc);
              bool ok = distDfs(counts, k, q, quantitySize, 0);
              free(q);
              return ok;
          }
        `,
        csharp: code`
          public static bool CanDistribute(int[] nums, int[] quantity)
          {
              var freq = new Dictionary<int, int>();
              foreach (int v in nums)
              {
                  int c;
                  freq.TryGetValue(v, out c);
                  freq[v] = c + 1;
              }
              int[] counts = freq.Values.ToArray();
              int[] q = (int[])quantity.Clone();
              Array.Sort(q);
              Array.Reverse(q);
              return DistDfs(counts, q, 0);
          }

          static bool DistDfs(int[] counts, int[] q, int i)
          {
              if (i == q.Length) return true;
              for (int j = 0; j < counts.Length; j++)
              {
                  if (counts[j] < q[i]) continue;
                  bool dup = false;
                  for (int t = 0; t < j; t++) if (counts[t] == counts[j]) { dup = true; break; }
                  if (dup) continue;
                  counts[j] -= q[i];
                  if (DistDfs(counts, q, i + 1)) return true;
                  counts[j] += q[i];
              }
              return false;
          }
        `,
        go: code`
          func canDistribute(nums []int, quantity []int) bool {
          	freq := map[int]int{}
          	for _, v := range nums {
          		freq[v]++
          	}
          	counts := []int{}
          	for _, c := range freq {
          		counts = append(counts, c)
          	}
          	sort.Ints(counts)
          	q := make([]int, len(quantity))
          	copy(q, quantity)
          	sort.Sort(sort.Reverse(sort.IntSlice(q)))
          	var dfs func(i int) bool
          	dfs = func(i int) bool {
          		if i == len(q) {
          			return true
          		}
          		for j := 0; j < len(counts); j++ {
          			if counts[j] < q[i] {
          				continue
          			}
          			dup := false
          			for t := 0; t < j; t++ {
          				if counts[t] == counts[j] {
          					dup = true
          					break
          				}
          			}
          			if dup {
          				continue
          			}
          			counts[j] -= q[i]
          			if dfs(i + 1) {
          				return true
          			}
          			counts[j] += q[i]
          		}
          		return false
          	}
          	return dfs(0)
          }
        `,
        kotlin: code`
          fun canDistribute(nums: IntArray, quantity: IntArray): Boolean {
              val freq = HashMap<Int, Int>()
              for (v in nums) freq[v] = (freq[v] ?: 0) + 1
              val counts = freq.values.toIntArray()
              val q = quantity.sortedArrayDescending()
              fun dfs(i: Int): Boolean {
                  if (i == q.size) return true
                  for (j in counts.indices) {
                      if (counts[j] < q[i]) continue
                      var dup = false
                      for (t in 0 until j) if (counts[t] == counts[j]) { dup = true; break }
                      if (dup) continue
                      counts[j] -= q[i]
                      if (dfs(i + 1)) return true
                      counts[j] += q[i]
                  }
                  return false
              }
              return dfs(0)
          }
        `,
        swift: code`
          func canDistribute(_ nums: [Int], _ quantity: [Int]) -> Bool {
              var freq = [Int: Int]()
              for v in nums { freq[v, default: 0] += 1 }
              var counts = Array(freq.values)
              let q = quantity.sorted(by: >)
              func dfs(_ i: Int) -> Bool {
                  if i == q.count { return true }
                  for j in 0..<counts.count {
                      if counts[j] < q[i] { continue }
                      var dup = false
                      for t in 0..<j where counts[t] == counts[j] { dup = true; break }
                      if dup { continue }
                      counts[j] -= q[i]
                      if dfs(i + 1) { return true }
                      counts[j] += q[i]
                  }
                  return false
              }
              return dfs(0)
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn dist_dfs(counts: &mut Vec<i32>, q: &Vec<i32>, i: usize) -> bool {
              if i == q.len() {
                  return true;
              }
              for j in 0..counts.len() {
                  if counts[j] < q[i] {
                      continue;
                  }
                  let mut dup = false;
                  for t in 0..j {
                      if counts[t] == counts[j] {
                          dup = true;
                          break;
                      }
                  }
                  if dup {
                      continue;
                  }
                  counts[j] -= q[i];
                  if dist_dfs(counts, q, i + 1) {
                      return true;
                  }
                  counts[j] += q[i];
              }
              false
          }

          fn canDistribute(nums: Vec<i32>, quantity: Vec<i32>) -> bool {
              let mut freq: HashMap<i32, i32> = HashMap::new();
              for &v in nums.iter() {
                  *freq.entry(v).or_insert(0) += 1;
              }
              let mut counts: Vec<i32> = freq.values().cloned().collect();
              counts.sort();
              let mut q = quantity.clone();
              q.sort_by(|a, b| b.cmp(a));
              dist_dfs(&mut counts, &q, 0)
          }
        `,
        php: code`
          function canDistribute($nums, $quantity) {
              $freq = [];
              foreach ($nums as $v) $freq[$v] = (isset($freq[$v]) ? $freq[$v] : 0) + 1;
              $counts = array_values($freq);
              $q = $quantity;
              rsort($q);
              return distDfs($counts, $q, 0);
          }

          function distDfs(&$counts, &$q, $i) {
              if ($i == count($q)) return true;
              $k = count($counts);
              for ($j = 0; $j < $k; $j++) {
                  if ($counts[$j] < $q[$i]) continue;
                  $dup = false;
                  for ($t = 0; $t < $j; $t++) {
                      if ($counts[$t] == $counts[$j]) { $dup = true; break; }
                  }
                  if ($dup) continue;
                  $counts[$j] -= $q[$i];
                  if (distDfs($counts, $q, $i + 1)) return true;
                  $counts[$j] += $q[$i];
              }
              return false;
          }
        `,
        ruby: code`
          def canDistribute(nums, quantity)
            freq = Hash.new(0)
            nums.each { |v| freq[v] += 1 }
            counts = freq.values
            q = quantity.sort.reverse
            dist_dfs(counts, q, 0)
          end

          def dist_dfs(counts, q, i)
            return true if i == q.length
            counts.length.times do |j|
              next if counts[j] < q[i]
              next if (0...j).any? { |t| counts[t] == counts[j] }
              counts[j] -= q[i]
              return true if dist_dfs(counts, q, i + 1)
              counts[j] += q[i]
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Construct the Lexicographically Largest Valid Sequence (LC 1718) ─
  (() => {
    const ref = (n: number) => {
      const len = 2 * n - 1;
      const res = new Array<number>(len).fill(0);
      const used = new Array<boolean>(n + 1).fill(false);
      const dfs = (pos: number): boolean => {
        if (pos === len) return true;
        if (res[pos]) return dfs(pos + 1);
        for (let v = n; v >= 1; v--) {
          if (used[v]) continue;
          const other = v === 1 ? pos : pos + v;
          if (other >= len || res[other]) continue;
          res[pos] = v; res[other] = v; used[v] = true;
          if (dfs(pos + 1)) return true;
          res[pos] = 0; res[other] = 0; used[v] = false;
        }
        return false;
      };
      dfs(0);
      // Sanity: 1 once, every v >= 2 twice at distance v.
      for (let v = 2; v <= n; v++) {
        const i = res.indexOf(v);
        if (res[i + v] !== v) throw new Error("invalid sequence");
      }
      return res;
    };
    return {
      slug: "construct-the-lexicographically-largest-valid-sequence",
      title: "Construct the Lexicographically Largest Valid Sequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Google", "Amazon"],
      signature: { funcName: "constructDistancedSequence", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Build a sequence of length `2n - 1` that satisfies all of these rules:\n\n" +
        "- The value `1` appears exactly once.\n" +
        "- Every value `v` from `2` to `n` appears exactly twice, and its two occurrences are exactly `v` positions apart (if they sit at indices `i < j`, then `j - i == v`).\n" +
        "- No other values appear.\n\n" +
        "Among all such sequences, return the **lexicographically largest** one — the one that is larger at the first index where two sequences differ. A valid sequence always exists.",
        [
          { in: "n = 3", out: "[3,1,2,3,2]", note: "`[2,3,2,1,3]` is valid too, but it is smaller at index 0." },
          { in: "n = 5", out: "[5,3,1,4,3,5,2,4,2]" },
          { in: "n = 1", out: "[1]" },
        ],
        ["1 <= n <= 20"]),
      hints: [
        "Fill the positions left to right. To make the result as large as possible, try the largest unused value first at each empty position.",
        "Placing `v >= 2` at position `i` also fixes position `i + v`; it is only possible if that position is inside the array and still empty. The value 1 occupies just one cell.",
        "The first complete sequence found this way is the answer — backtrack only when a position cannot be filled.",
      ],
      editorial: explain({
        idea: "Greedy with backtracking: the leftmost position is the most significant, so at each empty position try values from `n` down to 1, and accept the first complete assignment.",
        steps: [
          "Create an array of `2n - 1` zeros and a `used` flag per value.",
          "`dfs(pos)`: if `pos` is past the end, succeed; if `res[pos]` is already filled (by an earlier pair), move on to `pos + 1`.",
          "Otherwise for `v` from `n` down to 1, if `v` is unused and its partner cell (`pos + v`, or nothing for `v = 1`) is free and inside the array, place it, recurse, and undo on failure.",
          "Return the array after `dfs(0)` succeeds.",
        ],
        why: "The search visits complete sequences in decreasing lexicographic order: at each position it commits to the largest value that still admits a completion. So the first sequence it finishes is the largest one. In practice the greedy choice almost never needs to backtrack far.",
        time: "Exponential in the worst case; immediate for every n ≤ 20",
        space: "O(n)",
        pitfalls: [
          "The two copies of `v` are `v` apart — indices `i` and `i + v` — not `v` cells *between* them.",
          "Skip positions already filled by the second copy of an earlier value.",
          "The value 1 occupies a single cell; treating it like the others breaks the length.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "[3,1,2,3,2]" },
        { input: "5", expectedOutput: "[5,3,1,4,3,5,2,4,2]" },
        { input: "1", expectedOutput: "[1]" },
      ],
      hiddenCount: 100,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def constructDistancedSequence(n: int) -> List[int]:
              size = 2 * n - 1
              res = [0] * size
              used = [False] * (n + 1)

              def dfs(pos):
                  if pos == size:
                      return True
                  if res[pos]:
                      return dfs(pos + 1)
                  for v in range(n, 0, -1):
                      if used[v]:
                          continue
                      other = pos if v == 1 else pos + v
                      if other >= size or res[other]:
                          continue
                      res[pos] = v
                      res[other] = v
                      used[v] = True
                      if dfs(pos + 1):
                          return True
                      res[pos] = 0
                      res[other] = 0
                      used[v] = False
                  return False

              dfs(0)
              return res
        `,
        javascript: code`
          var constructDistancedSequence = function(n) {
              var size = 2 * n - 1;
              var res = new Array(size).fill(0);
              var used = new Array(n + 1).fill(false);
              var dfs = function(pos) {
                  if (pos === size) return true;
                  if (res[pos] !== 0) return dfs(pos + 1);
                  for (var v = n; v >= 1; v--) {
                      if (used[v]) continue;
                      var other = v === 1 ? pos : pos + v;
                      if (other >= size || res[other] !== 0) continue;
                      res[pos] = v;
                      res[other] = v;
                      used[v] = true;
                      if (dfs(pos + 1)) return true;
                      res[pos] = 0;
                      res[other] = 0;
                      used[v] = false;
                  }
                  return false;
              };
              dfs(0);
              return res;
          };
        `,
        typescript: code`
          function constructDistancedSequence(n: number): number[] {
              var size = 2 * n - 1;
              var res: number[] = [];
              for (var i = 0; i < size; i++) res.push(0);
              var used: boolean[] = [];
              for (var j = 0; j <= n; j++) used.push(false);
              function dfs(pos: number): boolean {
                  if (pos === size) return true;
                  if (res[pos] !== 0) return dfs(pos + 1);
                  for (var v = n; v >= 1; v--) {
                      if (used[v]) continue;
                      var other = v === 1 ? pos : pos + v;
                      if (other >= size || res[other] !== 0) continue;
                      res[pos] = v;
                      res[other] = v;
                      used[v] = true;
                      if (dfs(pos + 1)) return true;
                      res[pos] = 0;
                      res[other] = 0;
                      used[v] = false;
                  }
                  return false;
              }
              dfs(0);
              return res;
          }
        `,
        java: code`
          public static int[] constructDistancedSequence(int n) {
              int[] res = new int[2 * n - 1];
              seqDfs(res, new boolean[n + 1], n, 0);
              return res;
          }

          static boolean seqDfs(int[] res, boolean[] used, int n, int pos) {
              if (pos == res.length) return true;
              if (res[pos] != 0) return seqDfs(res, used, n, pos + 1);
              for (int v = n; v >= 1; v--) {
                  if (used[v]) continue;
                  int other = v == 1 ? pos : pos + v;
                  if (other >= res.length || res[other] != 0) continue;
                  res[pos] = v;
                  res[other] = v;
                  used[v] = true;
                  if (seqDfs(res, used, n, pos + 1)) return true;
                  res[pos] = 0;
                  res[other] = 0;
                  used[v] = false;
              }
              return false;
          }
        `,
        cpp: code`
          bool seqDfs(vector<int>& res, vector<bool>& used, int n, int pos) {
              if (pos == (int)res.size()) return true;
              if (res[pos] != 0) return seqDfs(res, used, n, pos + 1);
              for (int v = n; v >= 1; v--) {
                  if (used[v]) continue;
                  int other = v == 1 ? pos : pos + v;
                  if (other >= (int)res.size() || res[other] != 0) continue;
                  res[pos] = v;
                  res[other] = v;
                  used[v] = true;
                  if (seqDfs(res, used, n, pos + 1)) return true;
                  res[pos] = 0;
                  res[other] = 0;
                  used[v] = false;
              }
              return false;
          }

          vector<int> constructDistancedSequence(int n) {
              vector<int> res(2 * n - 1, 0);
              vector<bool> used(n + 1, false);
              seqDfs(res, used, n, 0);
              return res;
          }
        `,
        c: code`
          static bool seqDfs(int* res, int size, bool* used, int n, int pos) {
              if (pos == size) return true;
              if (res[pos] != 0) return seqDfs(res, size, used, n, pos + 1);
              for (int v = n; v >= 1; v--) {
                  if (used[v]) continue;
                  int other = v == 1 ? pos : pos + v;
                  if (other >= size || res[other] != 0) continue;
                  res[pos] = v;
                  res[other] = v;
                  used[v] = true;
                  if (seqDfs(res, size, used, n, pos + 1)) return true;
                  res[pos] = 0;
                  res[other] = 0;
                  used[v] = false;
              }
              return false;
          }

          int* constructDistancedSequence(int n, int* returnSize) {
              int size = 2 * n - 1;
              int* res = (int*)calloc(size, sizeof(int));
              bool* used = (bool*)calloc(n + 1, sizeof(bool));
              seqDfs(res, size, used, n, 0);
              free(used);
              *returnSize = size;
              return res;
          }
        `,
        csharp: code`
          public static int[] ConstructDistancedSequence(int n)
          {
              int[] res = new int[2 * n - 1];
              SeqDfs(res, new bool[n + 1], n, 0);
              return res;
          }

          static bool SeqDfs(int[] res, bool[] used, int n, int pos)
          {
              if (pos == res.Length) return true;
              if (res[pos] != 0) return SeqDfs(res, used, n, pos + 1);
              for (int v = n; v >= 1; v--)
              {
                  if (used[v]) continue;
                  int other = v == 1 ? pos : pos + v;
                  if (other >= res.Length || res[other] != 0) continue;
                  res[pos] = v;
                  res[other] = v;
                  used[v] = true;
                  if (SeqDfs(res, used, n, pos + 1)) return true;
                  res[pos] = 0;
                  res[other] = 0;
                  used[v] = false;
              }
              return false;
          }
        `,
        go: code`
          func constructDistancedSequence(n int) []int {
          	size := 2*n - 1
          	res := make([]int, size)
          	used := make([]bool, n+1)
          	var dfs func(pos int) bool
          	dfs = func(pos int) bool {
          		if pos == size {
          			return true
          		}
          		if res[pos] != 0 {
          			return dfs(pos + 1)
          		}
          		for v := n; v >= 1; v-- {
          			if used[v] {
          				continue
          			}
          			other := pos + v
          			if v == 1 {
          				other = pos
          			}
          			if other >= size || res[other] != 0 {
          				continue
          			}
          			res[pos] = v
          			res[other] = v
          			used[v] = true
          			if dfs(pos + 1) {
          				return true
          			}
          			res[pos] = 0
          			res[other] = 0
          			used[v] = false
          		}
          		return false
          	}
          	dfs(0)
          	return res
          }
        `,
        kotlin: code`
          fun constructDistancedSequence(n: Int): IntArray {
              val size = 2 * n - 1
              val res = IntArray(size)
              val used = BooleanArray(n + 1)
              fun dfs(pos: Int): Boolean {
                  if (pos == size) return true
                  if (res[pos] != 0) return dfs(pos + 1)
                  for (v in n downTo 1) {
                      if (used[v]) continue
                      val other = if (v == 1) pos else pos + v
                      if (other >= size || res[other] != 0) continue
                      res[pos] = v
                      res[other] = v
                      used[v] = true
                      if (dfs(pos + 1)) return true
                      res[pos] = 0
                      res[other] = 0
                      used[v] = false
                  }
                  return false
              }
              dfs(0)
              return res
          }
        `,
        swift: code`
          func constructDistancedSequence(_ n: Int) -> [Int] {
              let size = 2 * n - 1
              var res = [Int](repeating: 0, count: size)
              var used = [Bool](repeating: false, count: n + 1)
              func dfs(_ pos: Int) -> Bool {
                  if pos == size { return true }
                  if res[pos] != 0 { return dfs(pos + 1) }
                  var v = n
                  while v >= 1 {
                      let other = v == 1 ? pos : pos + v
                      if !used[v] && other < size && res[other] == 0 {
                          res[pos] = v
                          res[other] = v
                          used[v] = true
                          if dfs(pos + 1) { return true }
                          res[pos] = 0
                          res[other] = 0
                          used[v] = false
                      }
                      v -= 1
                  }
                  return false
              }
              _ = dfs(0)
              return res
          }
        `,
        rust: code`
          fn seq_dfs(res: &mut Vec<i32>, used: &mut Vec<bool>, n: usize, pos: usize) -> bool {
              let size = res.len();
              if pos == size {
                  return true;
              }
              if res[pos] != 0 {
                  return seq_dfs(res, used, n, pos + 1);
              }
              let mut v = n;
              while v >= 1 {
                  let other = if v == 1 { pos } else { pos + v };
                  if !used[v] && other < size && res[other] == 0 {
                      res[pos] = v as i32;
                      res[other] = v as i32;
                      used[v] = true;
                      if seq_dfs(res, used, n, pos + 1) {
                          return true;
                      }
                      res[pos] = 0;
                      res[other] = 0;
                      used[v] = false;
                  }
                  v -= 1;
              }
              false
          }

          fn constructDistancedSequence(n: i32) -> Vec<i32> {
              let n = n as usize;
              let mut res = vec![0i32; 2 * n - 1];
              let mut used = vec![false; n + 1];
              seq_dfs(&mut res, &mut used, n, 0);
              res
          }
        `,
        php: code`
          function constructDistancedSequence($n) {
              $res = array_fill(0, 2 * $n - 1, 0);
              $used = array_fill(0, $n + 1, false);
              seqDfs($res, $used, $n, 0);
              return $res;
          }

          function seqDfs(&$res, &$used, $n, $pos) {
              $size = count($res);
              if ($pos == $size) return true;
              if ($res[$pos] != 0) return seqDfs($res, $used, $n, $pos + 1);
              for ($v = $n; $v >= 1; $v--) {
                  if ($used[$v]) continue;
                  $other = $v == 1 ? $pos : $pos + $v;
                  if ($other >= $size || $res[$other] != 0) continue;
                  $res[$pos] = $v;
                  $res[$other] = $v;
                  $used[$v] = true;
                  if (seqDfs($res, $used, $n, $pos + 1)) return true;
                  $res[$pos] = 0;
                  $res[$other] = 0;
                  $used[$v] = false;
              }
              return false;
          }
        `,
        ruby: code`
          def constructDistancedSequence(n)
            res = Array.new(2 * n - 1, 0)
            used = Array.new(n + 1, false)
            seq_dfs(res, used, n, 0)
            res
          end

          def seq_dfs(res, used, n, pos)
            return true if pos == res.length
            return seq_dfs(res, used, n, pos + 1) if res[pos] != 0
            n.downto(1) do |v|
              next if used[v]
              other = v == 1 ? pos : pos + v
              next if other >= res.length || res[other] != 0
              res[pos] = v
              res[other] = v
              used[v] = true
              return true if seq_dfs(res, used, n, pos + 1)
              res[pos] = 0
              res[other] = 0
              used[v] = false
            end
            false
          end
        `,
      },
    };
  })(),


  // ── Verbal Arithmetic Puzzle (LC 1307) ──────────────────────────
  (() => {
    /** Independent check: per-letter place-value weights, bounded backtracking. */
    const ref = (words: string[], result: string) => {
      if (words.some((w) => w.length > result.length)) return false;
      const weight = new Map<string, number>();
      const lead = new Set<string>();
      const add = (s: string, sign: number) => {
        if (s.length > 1) lead.add(s[0]);
        let p = 1;
        for (let i = s.length - 1; i >= 0; i--) { weight.set(s[i], (weight.get(s[i]) || 0) + sign * p); p *= 10; }
      };
      for (const w of words) add(w, 1);
      add(result, -1);
      const letters = [...weight.keys()].sort((a, b) => Math.abs(weight.get(b)!) - Math.abs(weight.get(a)!));
      const ws = letters.map((c) => weight.get(c)!);
      const room: number[] = new Array(letters.length + 1).fill(0);
      for (let i = letters.length - 1; i >= 0; i--) room[i] = room[i + 1] + 9 * Math.abs(ws[i]);
      const used: boolean[] = new Array(10).fill(false);
      const dfs = (i: number, total: number): boolean => {
        if (i === letters.length) return total === 0;
        if (Math.abs(total) > room[i]) return false;
        for (let d = 0; d <= 9; d++) {
          if (used[d] || (d === 0 && lead.has(letters[i]))) continue;
          used[d] = true;
          const ok = dfs(i + 1, total + ws[i] * d);
          used[d] = false;
          if (ok) return true;
        }
        return false;
      };
      return dfs(0, 0);
    };
    const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return {
      slug: "verbal-arithmetic-puzzle",
      title: "Verbal Arithmetic Puzzle",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "String", "Backtracking", "Google", "Atlassian"],
      signature: {
        funcName: "isSolvable",
        params: [{ name: "words", type: "string[]" as const }, { name: "result", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A cryptarithm: every uppercase letter stands for a decimal digit. Decide whether the letters can be assigned digits so that the sum of the numbers spelled by `words` equals the number spelled by `result`.\n\n" +
        "The assignment must follow these rules:\n\n" +
        "- Each letter gets one digit, and **different letters get different digits**.\n" +
        "- No number may have a leading zero: the first letter of any word (or of `result`) that is longer than one letter cannot be 0. A one-letter word may be 0.\n\n" +
        "Return `true` if such an assignment exists.",
        [
          { in: "words = [\"TO\",\"GO\"], result = \"OUT\"", out: "true", note: "T = 2, O = 1, G = 8, U = 0: 21 + 81 = 102." },
          { in: "words = [\"A\",\"B\"], result = \"CDE\"", out: "false", note: "Two digits add up to at most 18, never a three-digit number." },
          { in: "words = [\"SEND\",\"MORE\"], result = \"MONEY\"", out: "true", note: "9567 + 1085 = 10652." },
        ],
        [
          "2 <= words.length <= 5",
          "1 <= words[i].length, result.length <= 7",
          "words[i] and result consist of uppercase English letters",
          "At most 10 different letters appear in the whole puzzle",
        ]),
      hints: [
        "Trying all digit assignments is up to 10! ≈ 3.6 million per puzzle. Prune earlier by checking the sum column by column, as you would on paper.",
        "Process the units column first: go through the words' letters in that column (assigning a digit to any unseen letter), add the carry, and the units digit of the column sum is forced for the result's letter.",
        "If the result letter is already assigned a different digit — or the forced digit is taken by another letter — the branch dies right there. After the last column the carry must be 0. Also: a word longer than `result` can never work.",
      ],
      editorial: explain({
        idea: "Simulate column addition from right to left while assigning digits lazily. Each result letter's digit is forced by the column sum, so most wrong partial assignments are rejected after a single column.",
        steps: [
          "If any word is longer than `result`, return false. Mark the first letter of every word or result with length > 1 as non-zero.",
          "`solve(col, row, sum)`: if `col == len(result)`, succeed exactly when `sum == 0` (no carry left).",
          "While `row` points at a word: if the word has no digit in this column, move to the next row; if its letter is assigned, add its digit; otherwise try every free digit (not 0 for a leading letter), add it and recurse on the next row.",
          "When `row` reaches the result: the needed digit is `sum % 10`. If the result letter is assigned it must match; otherwise the digit must be free (and non-zero if the letter is leading) — assign it. Continue with `solve(col + 1, 0, sum / 10)`.",
          "Undo every assignment when backtracking.",
        ],
        why: "Column addition is exactly how the sum is computed: the digit of `result` at a column is the column total modulo 10 and the rest is carried. By deciding letters in the order the paper algorithm reads them, every constraint is checked as soon as all of its letters are known, and the search still covers every injective assignment, so it answers correctly.",
        time: "O(10!) worst case; far smaller with column pruning",
        space: "O(number of letters + columns)",
        pitfalls: [
          "A one-letter word or result may be 0; only multi-letter numbers forbid a leading zero.",
          "Without the final `carry == 0` check, sums that overflow `result` look valid.",
          "A letter can appear in several words and in `result`; it must get the same digit everywhere.",
        ],
      }),
      examples: [
        { input: "[\"TO\",\"GO\"]\n\"OUT\"", expectedOutput: "true" },
        { input: "[\"A\",\"B\"]\n\"CDE\"", expectedOutput: "false" },
        { input: "[\"SEND\",\"MORE\"]\n\"MONEY\"", expectedOutput: "true" },
      ],
      hiddenCount: 200,
      gen: (rng: Rng) => {
        for (;;) {
          const letters = shuffle(rng, ALPHA.split("")).slice(0, 10);
          const spell = (x: number) => String(x).split("").map((ch) => letters[ch.charCodeAt(0) - 48]).join("");
          const W = ri(rng, 2, 5);
          const maxLen = pick(rng, [1, 2, 3, 4, 4, 5, 6, 6]);
          // Numbers drawn from a few digits repeat letters, which makes a corrupted
          // result genuinely unsolvable more often.
          const digits = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, ri(rng, 2, 10));
          const nonZero = digits.filter((d) => d !== 0);
          if (!nonZero.length) continue;
          const nums: number[] = [];
          for (let w = 0; w < W; w++) {
            const len = ri(rng, Math.max(1, maxLen - 2), maxLen);
            let x = len === 1 ? pick(rng, digits) : pick(rng, nonZero);
            for (let i = 1; i < len; i++) x = x * 10 + pick(rng, digits);
            nums.push(x);
          }
          const sum = nums.reduce((a, b) => a + b, 0);
          if (String(sum).length > 7) continue;
          const words = nums.map(spell);
          let result = spell(sum);
          if (rng() < 0.25) {
            // Corrupt one letter of the result.
            const present = new Set((words.join("") + result).split(""));
            const i = ri(rng, 0, result.length - 1);
            result = result.slice(0, i) + pick(rng, [...present]) + result.slice(i + 1);
          } else if (rng() < 0.6) {
            // A random puzzle over a few letters: mostly unsolvable, sometimes not.
            const set = shuffle(rng, ALPHA.split("")).slice(0, ri(rng, 3, 8));
            const word = (len: number) => Array.from({ length: len }, () => pick(rng, set)).join("");
            const wl = ri(rng, 1, 5);
            const rand = Array.from({ length: W }, () => word(ri(rng, Math.max(1, wl - 1), wl)));
            const rl = Math.min(7, wl + ri(rng, 0, 1));
            const rres = word(rl);
            return { input: `${fmtStrArr(rand)}\n"${rres}"`, expectedOutput: bool(ref(rand, rres)) };
          }
          return { input: `${fmtStrArr(words)}\n"${result}"`, expectedOutput: bool(ref(words, result)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def isSolvable(words: List[str], result: str) -> bool:
              L = len(result)
              if any(len(w) > L for w in words):
                  return False
              W = len(words)
              assign = [-1] * 26
              used = [False] * 10
              lead = [False] * 26
              for s in words + [result]:
                  if len(s) > 1:
                      lead[ord(s[0]) - 65] = True

              def solve(col, row, total):
                  if col == L:
                      return total == 0
                  if row == W:
                      rc = ord(result[L - 1 - col]) - 65
                      d = total % 10
                      if assign[rc] >= 0:
                          return assign[rc] == d and solve(col + 1, 0, total // 10)
                      if used[d] or (d == 0 and lead[rc]):
                          return False
                      assign[rc] = d
                      used[d] = True
                      ok = solve(col + 1, 0, total // 10)
                      assign[rc] = -1
                      used[d] = False
                      return ok
                  w = words[row]
                  if col >= len(w):
                      return solve(col, row + 1, total)
                  c = ord(w[len(w) - 1 - col]) - 65
                  if assign[c] >= 0:
                      return solve(col, row + 1, total + assign[c])
                  for d in range(10):
                      if used[d] or (d == 0 and lead[c]):
                          continue
                      assign[c] = d
                      used[d] = True
                      ok = solve(col, row + 1, total + d)
                      assign[c] = -1
                      used[d] = False
                      if ok:
                          return True
                  return False

              return solve(0, 0, 0)
        `,
        javascript: code`
          var isSolvable = function(words, result) {
              var L = result.length;
              var W = words.length;
              for (var w = 0; w < W; w++) if (words[w].length > L) return false;
              var assign = new Array(26).fill(-1);
              var used = new Array(10).fill(false);
              var lead = new Array(26).fill(false);
              var rows = words.concat([result]);
              for (var r = 0; r < rows.length; r++) if (rows[r].length > 1) lead[rows[r].charCodeAt(0) - 65] = true;
              var solve = function(col, row, sum) {
                  if (col === L) return sum === 0;
                  if (row === W) {
                      var rc = result.charCodeAt(L - 1 - col) - 65;
                      var d = sum % 10;
                      var carry = Math.floor(sum / 10);
                      if (assign[rc] >= 0) return assign[rc] === d && solve(col + 1, 0, carry);
                      if (used[d] || (d === 0 && lead[rc])) return false;
                      assign[rc] = d;
                      used[d] = true;
                      var ok = solve(col + 1, 0, carry);
                      assign[rc] = -1;
                      used[d] = false;
                      return ok;
                  }
                  var word = words[row];
                  if (col >= word.length) return solve(col, row + 1, sum);
                  var c = word.charCodeAt(word.length - 1 - col) - 65;
                  if (assign[c] >= 0) return solve(col, row + 1, sum + assign[c]);
                  for (var dd = 0; dd <= 9; dd++) {
                      if (used[dd] || (dd === 0 && lead[c])) continue;
                      assign[c] = dd;
                      used[dd] = true;
                      var good = solve(col, row + 1, sum + dd);
                      assign[c] = -1;
                      used[dd] = false;
                      if (good) return true;
                  }
                  return false;
              };
              return solve(0, 0, 0);
          };
        `,
        typescript: code`
          function isSolvable(words: string[], result: string): boolean {
              var L = result.length;
              var W = words.length;
              for (var w = 0; w < W; w++) if (words[w].length > L) return false;
              var assign: number[] = [];
              var lead: boolean[] = [];
              for (var a = 0; a < 26; a++) { assign.push(-1); lead.push(false); }
              var used: boolean[] = [];
              for (var u = 0; u < 10; u++) used.push(false);
              var rows: string[] = words.concat([result]);
              for (var r = 0; r < rows.length; r++) if (rows[r].length > 1) lead[rows[r].charCodeAt(0) - 65] = true;
              function solve(col: number, row: number, sum: number): boolean {
                  if (col === L) return sum === 0;
                  if (row === W) {
                      var rc = result.charCodeAt(L - 1 - col) - 65;
                      var d = sum % 10;
                      var carry = Math.floor(sum / 10);
                      if (assign[rc] >= 0) return assign[rc] === d && solve(col + 1, 0, carry);
                      if (used[d] || (d === 0 && lead[rc])) return false;
                      assign[rc] = d;
                      used[d] = true;
                      var ok = solve(col + 1, 0, carry);
                      assign[rc] = -1;
                      used[d] = false;
                      return ok;
                  }
                  var word = words[row];
                  if (col >= word.length) return solve(col, row + 1, sum);
                  var c = word.charCodeAt(word.length - 1 - col) - 65;
                  if (assign[c] >= 0) return solve(col, row + 1, sum + assign[c]);
                  for (var dd = 0; dd <= 9; dd++) {
                      if (used[dd] || (dd === 0 && lead[c])) continue;
                      assign[c] = dd;
                      used[dd] = true;
                      var good = solve(col, row + 1, sum + dd);
                      assign[c] = -1;
                      used[dd] = false;
                      if (good) return true;
                  }
                  return false;
              }
              return solve(0, 0, 0);
          }
        `,
        java: code`
          static int[] vaAssign = new int[26];
          static boolean[] vaUsed = new boolean[10];
          static boolean[] vaLead = new boolean[26];
          static String[] vaWords;
          static String vaResult;

          public static boolean isSolvable(String[] words, String result) {
              int L = result.length();
              for (String w : words) if (w.length() > L) return false;
              Arrays.fill(vaAssign, -1);
              Arrays.fill(vaUsed, false);
              Arrays.fill(vaLead, false);
              for (String w : words) if (w.length() > 1) vaLead[w.charAt(0) - 'A'] = true;
              if (L > 1) vaLead[result.charAt(0) - 'A'] = true;
              vaWords = words;
              vaResult = result;
              return vaSolve(0, 0, 0);
          }

          static boolean vaSolve(int col, int row, int sum) {
              int L = vaResult.length();
              if (col == L) return sum == 0;
              if (row == vaWords.length) {
                  int rc = vaResult.charAt(L - 1 - col) - 'A';
                  int d = sum % 10;
                  if (vaAssign[rc] >= 0) return vaAssign[rc] == d && vaSolve(col + 1, 0, sum / 10);
                  if (vaUsed[d] || (d == 0 && vaLead[rc])) return false;
                  vaAssign[rc] = d;
                  vaUsed[d] = true;
                  boolean ok = vaSolve(col + 1, 0, sum / 10);
                  vaAssign[rc] = -1;
                  vaUsed[d] = false;
                  return ok;
              }
              String w = vaWords[row];
              if (col >= w.length()) return vaSolve(col, row + 1, sum);
              int c = w.charAt(w.length() - 1 - col) - 'A';
              if (vaAssign[c] >= 0) return vaSolve(col, row + 1, sum + vaAssign[c]);
              for (int d = 0; d <= 9; d++) {
                  if (vaUsed[d] || (d == 0 && vaLead[c])) continue;
                  vaAssign[c] = d;
                  vaUsed[d] = true;
                  boolean ok = vaSolve(col, row + 1, sum + d);
                  vaAssign[c] = -1;
                  vaUsed[d] = false;
                  if (ok) return true;
              }
              return false;
          }
        `,
        cpp: code`
          struct VerbalState {
              vector<string> words;
              string result;
              int assign[26];
              bool used[10];
              bool lead[26];
          };

          bool verbalSolve(VerbalState& st, int col, int row, int sum) {
              int L = st.result.size();
              if (col == L) return sum == 0;
              if (row == (int)st.words.size()) {
                  int rc = st.result[L - 1 - col] - 'A';
                  int d = sum % 10;
                  if (st.assign[rc] >= 0) return st.assign[rc] == d && verbalSolve(st, col + 1, 0, sum / 10);
                  if (st.used[d] || (d == 0 && st.lead[rc])) return false;
                  st.assign[rc] = d;
                  st.used[d] = true;
                  bool ok = verbalSolve(st, col + 1, 0, sum / 10);
                  st.assign[rc] = -1;
                  st.used[d] = false;
                  return ok;
              }
              const string& w = st.words[row];
              if (col >= (int)w.size()) return verbalSolve(st, col, row + 1, sum);
              int c = w[w.size() - 1 - col] - 'A';
              if (st.assign[c] >= 0) return verbalSolve(st, col, row + 1, sum + st.assign[c]);
              for (int d = 0; d <= 9; d++) {
                  if (st.used[d] || (d == 0 && st.lead[c])) continue;
                  st.assign[c] = d;
                  st.used[d] = true;
                  bool ok = verbalSolve(st, col, row + 1, sum + d);
                  st.assign[c] = -1;
                  st.used[d] = false;
                  if (ok) return true;
              }
              return false;
          }

          bool isSolvable(vector<string>& words, string result) {
              for (auto& w : words) if (w.size() > result.size()) return false;
              VerbalState st;
              st.words = words;
              st.result = result;
              for (int i = 0; i < 26; i++) { st.assign[i] = -1; st.lead[i] = false; }
              for (int i = 0; i < 10; i++) st.used[i] = false;
              for (auto& w : words) if (w.size() > 1) st.lead[w[0] - 'A'] = true;
              if (result.size() > 1) st.lead[result[0] - 'A'] = true;
              return verbalSolve(st, 0, 0, 0);
          }
        `,
        c: code`
          static int vaAssign[26];
          static bool vaUsed[10];
          static bool vaLead[26];
          static char** vaWords;
          static int vaCount;
          static const char* vaResult;
          static int vaL;

          static bool vaSolve(int col, int row, int sum) {
              if (col == vaL) return sum == 0;
              if (row == vaCount) {
                  int rc = vaResult[vaL - 1 - col] - 'A';
                  int d = sum % 10;
                  if (vaAssign[rc] >= 0) return vaAssign[rc] == d && vaSolve(col + 1, 0, sum / 10);
                  if (vaUsed[d] || (d == 0 && vaLead[rc])) return false;
                  vaAssign[rc] = d;
                  vaUsed[d] = true;
                  bool ok = vaSolve(col + 1, 0, sum / 10);
                  vaAssign[rc] = -1;
                  vaUsed[d] = false;
                  return ok;
              }
              const char* w = vaWords[row];
              int wl = (int)strlen(w);
              if (col >= wl) return vaSolve(col, row + 1, sum);
              int c = w[wl - 1 - col] - 'A';
              if (vaAssign[c] >= 0) return vaSolve(col, row + 1, sum + vaAssign[c]);
              for (int d = 0; d <= 9; d++) {
                  if (vaUsed[d] || (d == 0 && vaLead[c])) continue;
                  vaAssign[c] = d;
                  vaUsed[d] = true;
                  bool ok = vaSolve(col, row + 1, sum + d);
                  vaAssign[c] = -1;
                  vaUsed[d] = false;
                  if (ok) return true;
              }
              return false;
          }

          bool isSolvable(char** words, int wordsSize, const char* result) {
              vaL = (int)strlen(result);
              for (int i = 0; i < wordsSize; i++) if ((int)strlen(words[i]) > vaL) return false;
              for (int i = 0; i < 26; i++) { vaAssign[i] = -1; vaLead[i] = false; }
              for (int i = 0; i < 10; i++) vaUsed[i] = false;
              for (int i = 0; i < wordsSize; i++) if (strlen(words[i]) > 1) vaLead[words[i][0] - 'A'] = true;
              if (vaL > 1) vaLead[result[0] - 'A'] = true;
              vaWords = words;
              vaCount = wordsSize;
              vaResult = result;
              return vaSolve(0, 0, 0);
          }
        `,
        csharp: code`
          static int[] vaAssign = new int[26];
          static bool[] vaUsed = new bool[10];
          static bool[] vaLead = new bool[26];
          static string[] vaWords;
          static string vaResult;

          public static bool IsSolvable(string[] words, string result)
          {
              int L = result.Length;
              foreach (string w in words) if (w.Length > L) return false;
              for (int i = 0; i < 26; i++) { vaAssign[i] = -1; vaLead[i] = false; }
              for (int i = 0; i < 10; i++) vaUsed[i] = false;
              foreach (string w in words) if (w.Length > 1) vaLead[w[0] - 'A'] = true;
              if (L > 1) vaLead[result[0] - 'A'] = true;
              vaWords = words;
              vaResult = result;
              return VaSolve(0, 0, 0);
          }

          static bool VaSolve(int col, int row, int sum)
          {
              int L = vaResult.Length;
              if (col == L) return sum == 0;
              if (row == vaWords.Length)
              {
                  int rc = vaResult[L - 1 - col] - 'A';
                  int d = sum % 10;
                  if (vaAssign[rc] >= 0) return vaAssign[rc] == d && VaSolve(col + 1, 0, sum / 10);
                  if (vaUsed[d] || (d == 0 && vaLead[rc])) return false;
                  vaAssign[rc] = d;
                  vaUsed[d] = true;
                  bool ok = VaSolve(col + 1, 0, sum / 10);
                  vaAssign[rc] = -1;
                  vaUsed[d] = false;
                  return ok;
              }
              string w = vaWords[row];
              if (col >= w.Length) return VaSolve(col, row + 1, sum);
              int c = w[w.Length - 1 - col] - 'A';
              if (vaAssign[c] >= 0) return VaSolve(col, row + 1, sum + vaAssign[c]);
              for (int d = 0; d <= 9; d++)
              {
                  if (vaUsed[d] || (d == 0 && vaLead[c])) continue;
                  vaAssign[c] = d;
                  vaUsed[d] = true;
                  bool ok = VaSolve(col, row + 1, sum + d);
                  vaAssign[c] = -1;
                  vaUsed[d] = false;
                  if (ok) return true;
              }
              return false;
          }
        `,
        go: code`
          func isSolvable(words []string, result string) bool {
          	L := len(result)
          	W := len(words)
          	for _, w := range words {
          		if len(w) > L {
          			return false
          		}
          	}
          	assign := make([]int, 26)
          	for i := range assign {
          		assign[i] = -1
          	}
          	used := make([]bool, 10)
          	lead := make([]bool, 26)
          	for _, w := range words {
          		if len(w) > 1 {
          			lead[w[0]-'A'] = true
          		}
          	}
          	if L > 1 {
          		lead[result[0]-'A'] = true
          	}
          	var solve func(col, row, sum int) bool
          	solve = func(col, row, sum int) bool {
          		if col == L {
          			return sum == 0
          		}
          		if row == W {
          			rc := int(result[L-1-col] - 'A')
          			d := sum % 10
          			if assign[rc] >= 0 {
          				return assign[rc] == d && solve(col+1, 0, sum/10)
          			}
          			if used[d] || (d == 0 && lead[rc]) {
          				return false
          			}
          			assign[rc] = d
          			used[d] = true
          			ok := solve(col+1, 0, sum/10)
          			assign[rc] = -1
          			used[d] = false
          			return ok
          		}
          		w := words[row]
          		if col >= len(w) {
          			return solve(col, row+1, sum)
          		}
          		c := int(w[len(w)-1-col] - 'A')
          		if assign[c] >= 0 {
          			return solve(col, row+1, sum+assign[c])
          		}
          		for d := 0; d <= 9; d++ {
          			if used[d] || (d == 0 && lead[c]) {
          				continue
          			}
          			assign[c] = d
          			used[d] = true
          			ok := solve(col, row+1, sum+d)
          			assign[c] = -1
          			used[d] = false
          			if ok {
          				return true
          			}
          		}
          		return false
          	}
          	return solve(0, 0, 0)
          }
        `,
        kotlin: code`
          fun isSolvable(words: Array<String>, result: String): Boolean {
              val L = result.length
              val W = words.size
              for (w in words) if (w.length > L) return false
              val assign = IntArray(26) { -1 }
              val used = BooleanArray(10)
              val lead = BooleanArray(26)
              for (w in words) if (w.length > 1) lead[w[0] - 'A'] = true
              if (L > 1) lead[result[0] - 'A'] = true
              fun solve(col: Int, row: Int, sum: Int): Boolean {
                  if (col == L) return sum == 0
                  if (row == W) {
                      val rc = result[L - 1 - col] - 'A'
                      val d = sum % 10
                      if (assign[rc] >= 0) return assign[rc] == d && solve(col + 1, 0, sum / 10)
                      if (used[d] || (d == 0 && lead[rc])) return false
                      assign[rc] = d
                      used[d] = true
                      val ok = solve(col + 1, 0, sum / 10)
                      assign[rc] = -1
                      used[d] = false
                      return ok
                  }
                  val w = words[row]
                  if (col >= w.length) return solve(col, row + 1, sum)
                  val c = w[w.length - 1 - col] - 'A'
                  if (assign[c] >= 0) return solve(col, row + 1, sum + assign[c])
                  for (d in 0..9) {
                      if (used[d] || (d == 0 && lead[c])) continue
                      assign[c] = d
                      used[d] = true
                      val ok = solve(col, row + 1, sum + d)
                      assign[c] = -1
                      used[d] = false
                      if (ok) return true
                  }
                  return false
              }
              return solve(0, 0, 0)
          }
        `,
        swift: code`
          func isSolvable(_ words: [String], _ result: String) -> Bool {
              let ws: [[Int]] = words.map { Array($0.utf8).map { Int($0) - 65 } }
              let res: [Int] = Array(result.utf8).map { Int($0) - 65 }
              let L = res.count
              let W = ws.count
              for w in ws where w.count > L { return false }
              var assign = [Int](repeating: -1, count: 26)
              var used = [Bool](repeating: false, count: 10)
              var lead = [Bool](repeating: false, count: 26)
              for w in ws where w.count > 1 { lead[w[0]] = true }
              if L > 1 { lead[res[0]] = true }
              func solve(_ col: Int, _ row: Int, _ sum: Int) -> Bool {
                  if col == L { return sum == 0 }
                  if row == W {
                      let rc = res[L - 1 - col]
                      let d = sum % 10
                      if assign[rc] >= 0 { return assign[rc] == d && solve(col + 1, 0, sum / 10) }
                      if used[d] || (d == 0 && lead[rc]) { return false }
                      assign[rc] = d
                      used[d] = true
                      let ok = solve(col + 1, 0, sum / 10)
                      assign[rc] = -1
                      used[d] = false
                      return ok
                  }
                  let w = ws[row]
                  if col >= w.count { return solve(col, row + 1, sum) }
                  let c = w[w.count - 1 - col]
                  if assign[c] >= 0 { return solve(col, row + 1, sum + assign[c]) }
                  for d in 0...9 {
                      if used[d] || (d == 0 && lead[c]) { continue }
                      assign[c] = d
                      used[d] = true
                      let ok = solve(col, row + 1, sum + d)
                      assign[c] = -1
                      used[d] = false
                      if ok { return true }
                  }
                  return false
              }
              return solve(0, 0, 0)
          }
        `,
        rust: code`
          struct Verbal {
              rows: Vec<Vec<usize>>,
              w: usize,
              l: usize,
              assign: [i32; 26],
              used: [bool; 10],
              lead: [bool; 26],
          }

          fn verbal_solve(st: &mut Verbal, col: usize, row: usize, sum: i32) -> bool {
              if col == st.l {
                  return sum == 0;
              }
              if row == st.w {
                  let rc = st.rows[st.w][st.l - 1 - col];
                  let d = sum % 10;
                  if st.assign[rc] >= 0 {
                      return st.assign[rc] == d && verbal_solve(st, col + 1, 0, sum / 10);
                  }
                  if st.used[d as usize] || (d == 0 && st.lead[rc]) {
                      return false;
                  }
                  st.assign[rc] = d;
                  st.used[d as usize] = true;
                  let ok = verbal_solve(st, col + 1, 0, sum / 10);
                  st.assign[rc] = -1;
                  st.used[d as usize] = false;
                  return ok;
              }
              let wl = st.rows[row].len();
              if col >= wl {
                  return verbal_solve(st, col, row + 1, sum);
              }
              let c = st.rows[row][wl - 1 - col];
              if st.assign[c] >= 0 {
                  let add = st.assign[c];
                  return verbal_solve(st, col, row + 1, sum + add);
              }
              for d in 0..10usize {
                  if st.used[d] || (d == 0 && st.lead[c]) {
                      continue;
                  }
                  st.assign[c] = d as i32;
                  st.used[d] = true;
                  let ok = verbal_solve(st, col, row + 1, sum + d as i32);
                  st.assign[c] = -1;
                  st.used[d] = false;
                  if ok {
                      return true;
                  }
              }
              false
          }

          fn isSolvable(words: Vec<String>, result: String) -> bool {
              let l = result.len();
              for w in words.iter() {
                  if w.len() > l {
                      return false;
                  }
              }
              let mut rows: Vec<Vec<usize>> = Vec::new();
              for w in words.iter() {
                  rows.push(w.bytes().map(|b| (b - b'A') as usize).collect());
              }
              rows.push(result.bytes().map(|b| (b - b'A') as usize).collect());
              let mut lead = [false; 26];
              for r in rows.iter() {
                  if r.len() > 1 {
                      lead[r[0]] = true;
                  }
              }
              let mut st = Verbal { rows: rows, w: words.len(), l: l, assign: [-1; 26], used: [false; 10], lead: lead };
              verbal_solve(&mut st, 0, 0, 0)
          }
        `,
        php: code`
          function isSolvable($words, $result) {
              $L = strlen($result);
              foreach ($words as $w) if (strlen($w) > $L) return false;
              $assign = array_fill(0, 26, -1);
              $used = array_fill(0, 10, false);
              $lead = array_fill(0, 26, false);
              foreach ($words as $w) if (strlen($w) > 1) $lead[ord($w[0]) - 65] = true;
              if ($L > 1) $lead[ord($result[0]) - 65] = true;
              return vaSolve($words, $result, $assign, $used, $lead, 0, 0, 0);
          }

          function vaSolve(&$words, &$result, &$assign, &$used, &$lead, $col, $row, $sum) {
              $L = strlen($result);
              if ($col == $L) return $sum == 0;
              if ($row == count($words)) {
                  $rc = ord($result[$L - 1 - $col]) - 65;
                  $d = $sum % 10;
                  $carry = intdiv($sum, 10);
                  if ($assign[$rc] >= 0) return $assign[$rc] == $d && vaSolve($words, $result, $assign, $used, $lead, $col + 1, 0, $carry);
                  if ($used[$d] || ($d == 0 && $lead[$rc])) return false;
                  $assign[$rc] = $d;
                  $used[$d] = true;
                  $ok = vaSolve($words, $result, $assign, $used, $lead, $col + 1, 0, $carry);
                  $assign[$rc] = -1;
                  $used[$d] = false;
                  return $ok;
              }
              $w = $words[$row];
              $wl = strlen($w);
              if ($col >= $wl) return vaSolve($words, $result, $assign, $used, $lead, $col, $row + 1, $sum);
              $c = ord($w[$wl - 1 - $col]) - 65;
              if ($assign[$c] >= 0) return vaSolve($words, $result, $assign, $used, $lead, $col, $row + 1, $sum + $assign[$c]);
              for ($d = 0; $d <= 9; $d++) {
                  if ($used[$d] || ($d == 0 && $lead[$c])) continue;
                  $assign[$c] = $d;
                  $used[$d] = true;
                  $ok = vaSolve($words, $result, $assign, $used, $lead, $col, $row + 1, $sum + $d);
                  $assign[$c] = -1;
                  $used[$d] = false;
                  if ($ok) return true;
              }
              return false;
          }
        `,
        ruby: code`
          def isSolvable(words, result)
            l = result.length
            return false if words.any? { |w| w.length > l }
            rows = words.map { |w| w.bytes.map { |b| b - 65 } }
            res = result.bytes.map { |b| b - 65 }
            assign = Array.new(26, -1)
            used = Array.new(10, false)
            lead = Array.new(26, false)
            (rows + [res]).each { |r| lead[r[0]] = true if r.length > 1 }
            va_solve(rows, res, assign, used, lead, 0, 0, 0)
          end

          def va_solve(rows, res, assign, used, lead, col, row, sum)
            l = res.length
            return sum == 0 if col == l
            if row == rows.length
              rc = res[l - 1 - col]
              d = sum % 10
              return assign[rc] == d && va_solve(rows, res, assign, used, lead, col + 1, 0, sum / 10) if assign[rc] >= 0
              return false if used[d] || (d == 0 && lead[rc])
              assign[rc] = d
              used[d] = true
              ok = va_solve(rows, res, assign, used, lead, col + 1, 0, sum / 10)
              assign[rc] = -1
              used[d] = false
              return ok
            end
            w = rows[row]
            return va_solve(rows, res, assign, used, lead, col, row + 1, sum) if col >= w.length
            c = w[w.length - 1 - col]
            return va_solve(rows, res, assign, used, lead, col, row + 1, sum + assign[c]) if assign[c] >= 0
            (0..9).each do |dd|
              next if used[dd] || (dd == 0 && lead[c])
              assign[c] = dd
              used[dd] = true
              ok = va_solve(rows, res, assign, used, lead, col, row + 1, sum + dd)
              assign[c] = -1
              used[dd] = false
              return true if ok
            end
            false
          end
        `,
      },
    };
  })(),

  // ── 24 Game (LC 679) ────────────────────────────────────────────
  (() => {
    type Frac = [number, number];
    /** Independent check: every ordering × every operator triple × all five tree shapes. */
    const ref = (cards: number[]) => {
      const ops = (x: Frac | null, y: Frac | null, op: number): Frac | null => {
        if (!x || !y) return null;
        const [a, b] = x;
        const [c, d] = y;
        if (op === 0) return [a * d + c * b, b * d];
        if (op === 1) return [a * d - c * b, b * d];
        if (op === 2) return [a * c, b * d];
        if (c === 0) return null;
        return [a * d, b * c];
      };
      const is24 = (f: Frac | null) => f !== null && f[0] === 24 * f[1];
      const perms: number[][] = [];
      const permute = (arr: number[], rest: number[]) => {
        if (!rest.length) { perms.push(arr); return; }
        rest.forEach((v, i) => permute([...arr, v], rest.filter((_, j) => j !== i)));
      };
      permute([], cards);
      for (const p of perms) {
        const [A, B, C, D] = p.map((v): Frac => [v, 1]);
        for (let o1 = 0; o1 < 4; o1++) for (let o2 = 0; o2 < 4; o2++) for (let o3 = 0; o3 < 4; o3++) {
          if (is24(ops(ops(ops(A, B, o1), C, o2), D, o3))) return true;
          if (is24(ops(ops(A, ops(B, C, o2), o1), D, o3))) return true;
          if (is24(ops(ops(A, B, o1), ops(C, D, o3), o2))) return true;
          if (is24(ops(A, ops(ops(B, C, o2), D, o3), o1))) return true;
          if (is24(ops(A, ops(B, ops(C, D, o3), o2), o1))) return true;
        }
      }
      return false;
    };
    return {
      slug: "24-game",
      title: "24 Game",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Backtracking", "Google", "Amazon", "Uber"],
      signature: { funcName: "judgePoint24", params: [{ name: "cards", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You hold four cards, each showing a number from 1 to 9. Decide whether you can combine all four numbers, each used exactly once, with `+`, `-`, `*`, `/` and any parentheses, into an expression whose value is exactly **24**.\n\n" +
        "Rules:\n\n" +
        "- `/` is **real** division, not integer division: `4 / (1 - 2 / 3) = 12`.\n" +
        "- Every operator is binary; `-` cannot be used to negate a single number (`-1 - 1 - 1 - 1` is not allowed).\n" +
        "- Numbers cannot be glued together: cards `1` and `2` cannot form `12`.\n\n" +
        "Return `true` if 24 can be reached.",
        [
          { in: "cards = [4,1,8,7]", out: "true", note: "(8 - 4) * (7 - 1) = 24." },
          { in: "cards = [1,2,1,2]", out: "false" },
          { in: "cards = [3,3,8,8]", out: "true", note: "8 / (3 - 8 / 3) = 24 — it needs a fraction along the way." },
        ],
        ["cards.length == 4", "1 <= cards[i] <= 9"]),
      hints: [
        "Any expression combines two of the current numbers into one at some point. Pick an (unordered) pair, replace it by each possible result, and recurse on the shorter list.",
        "For a pair `a, b` the results are `a + b`, `a - b`, `b - a`, `a * b`, `a / b` (if `b != 0`) and `b / a` (if `a != 0`). Stop when one number is left.",
        "Floating point needs an epsilon. Even safer: keep every value as an exact fraction `num / den`, and check `num == 24 * den` at the end.",
      ],
      editorial: explain({
        idea: "Search over the order in which numbers are merged. With exact fractions there is no rounding, so the check at the end is a plain integer comparison.",
        steps: [
          "Represent each card as the fraction `card / 1`.",
          "`solve(list)`: if one fraction `n / d` is left, return `n == 24 * d`.",
          "Otherwise, for every pair `i < j`, build the list without them and append, in turn, each combination: sum, both differences, product, and both quotients whose divisor is non-zero. Recurse; succeed if any branch does.",
        ],
        why: "Every fully parenthesised expression is a binary tree, and evaluating it bottom-up merges two values at a time — so some sequence of pair merges reproduces any expression, and the search tries them all. Fractions `a/b ± c/d = (ad ± bc)/bd`, `(a/b)(c/d) = ac/bd`, `(a/b)/(c/d) = ad/bc` are exact, and with four cards up to 9 the numerators and denominators stay small integers.",
        time: "O(1) — at most 6 · 6 · 3 · 6 · 1 · 6 ≈ 3,900 leaves",
        space: "O(1)",
        pitfalls: [
          "Integer division gives wrong answers: `[3,3,8,8]` needs `8 / 3`.",
          "Comparing doubles with `==` fails on values like `24.000000000000004`; use fractions or an epsilon.",
          "Subtraction and division are not symmetric — try both orders for every pair.",
        ],
      }),
      examples: [
        { input: "[4,1,8,7]", expectedOutput: "true" },
        { input: "[1,2,1,2]", expectedOutput: "false" },
        { input: "[3,3,8,8]", expectedOutput: "true" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const hi = rng() < 0.3 ? 4 : 9;
        const cards = [ri(rng, 1, hi), ri(rng, 1, hi), ri(rng, 1, 9), ri(rng, 1, hi)];
        return { input: fmtIntArr(cards), expectedOutput: bool(ref(cards)) };
      },
      solutions: {
        python: code`
          from typing import List

          def judgePoint24(cards: List[int]) -> bool:
              def solve(fr):
                  if len(fr) == 1:
                      return fr[0][0] == 24 * fr[0][1]
                  k = len(fr)
                  for i in range(k):
                      for j in range(i + 1, k):
                          rest = [fr[t] for t in range(k) if t != i and t != j]
                          a, b = fr[i]
                          c, d = fr[j]
                          cand = [(a * d + c * b, b * d), (a * d - c * b, b * d), (c * b - a * d, b * d), (a * c, b * d)]
                          if c != 0:
                              cand.append((a * d, b * c))
                          if a != 0:
                              cand.append((c * b, d * a))
                          for f in cand:
                              if solve(rest + [f]):
                                  return True
                  return False

              return solve([(v, 1) for v in cards])
        `,
        javascript: code`
          var judgePoint24 = function(cards) {
              var solve = function(nums, dens) {
                  var k = nums.length;
                  if (k === 1) return nums[0] === 24 * dens[0];
                  for (var i = 0; i < k; i++) {
                      for (var j = i + 1; j < k; j++) {
                          var rn = [], rd = [];
                          for (var t = 0; t < k; t++) if (t !== i && t !== j) { rn.push(nums[t]); rd.push(dens[t]); }
                          var a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                          var cn = [a * d + c * b, a * d - c * b, c * b - a * d, a * c];
                          var cd = [b * d, b * d, b * d, b * d];
                          if (c !== 0) { cn.push(a * d); cd.push(b * c); }
                          if (a !== 0) { cn.push(c * b); cd.push(d * a); }
                          for (var x = 0; x < cn.length; x++) {
                              rn.push(cn[x]);
                              rd.push(cd[x]);
                              if (solve(rn, rd)) return true;
                              rn.pop();
                              rd.pop();
                          }
                      }
                  }
                  return false;
              };
              return solve(cards.slice(), [1, 1, 1, 1]);
          };
        `,
        typescript: code`
          function judgePoint24(cards: number[]): boolean {
              function solve(nums: number[], dens: number[]): boolean {
                  var k = nums.length;
                  if (k === 1) return nums[0] === 24 * dens[0];
                  for (var i = 0; i < k; i++) {
                      for (var j = i + 1; j < k; j++) {
                          var rn: number[] = [];
                          var rd: number[] = [];
                          for (var t = 0; t < k; t++) if (t !== i && t !== j) { rn.push(nums[t]); rd.push(dens[t]); }
                          var a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                          var cn: number[] = [a * d + c * b, a * d - c * b, c * b - a * d, a * c];
                          var cd: number[] = [b * d, b * d, b * d, b * d];
                          if (c !== 0) { cn.push(a * d); cd.push(b * c); }
                          if (a !== 0) { cn.push(c * b); cd.push(d * a); }
                          for (var x = 0; x < cn.length; x++) {
                              rn.push(cn[x]);
                              rd.push(cd[x]);
                              if (solve(rn, rd)) return true;
                              rn.pop();
                              rd.pop();
                          }
                      }
                  }
                  return false;
              }
              return solve(cards.slice(), [1, 1, 1, 1]);
          }
        `,
        java: code`
          public static boolean judgePoint24(int[] cards) {
              long[] nums = new long[4];
              long[] dens = new long[4];
              for (int i = 0; i < 4; i++) { nums[i] = cards[i]; dens[i] = 1; }
              return solve24(nums, dens, 4);
          }

          static boolean solve24(long[] nums, long[] dens, int k) {
              if (k == 1) return nums[0] == 24 * dens[0];
              for (int i = 0; i < k; i++) {
                  for (int j = i + 1; j < k; j++) {
                      long[] rn = new long[k - 1];
                      long[] rd = new long[k - 1];
                      int m = 0;
                      for (int t = 0; t < k; t++) if (t != i && t != j) { rn[m] = nums[t]; rd[m] = dens[t]; m++; }
                      long a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                      long[] cn = {a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b};
                      long[] cd = {b * d, b * d, b * d, b * d, b * c, d * a};
                      for (int x = 0; x < 6; x++) {
                          if (x == 4 && c == 0) continue;
                          if (x == 5 && a == 0) continue;
                          rn[m] = cn[x];
                          rd[m] = cd[x];
                          if (solve24(rn, rd, k - 1)) return true;
                      }
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool solve24(vector<long long> nums, vector<long long> dens) {
              int k = nums.size();
              if (k == 1) return nums[0] == 24 * dens[0];
              for (int i = 0; i < k; i++) {
                  for (int j = i + 1; j < k; j++) {
                      vector<long long> rn, rd;
                      for (int t = 0; t < k; t++) if (t != i && t != j) { rn.push_back(nums[t]); rd.push_back(dens[t]); }
                      long long a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                      long long cn[6] = {a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b};
                      long long cd[6] = {b * d, b * d, b * d, b * d, b * c, d * a};
                      for (int x = 0; x < 6; x++) {
                          if (x == 4 && c == 0) continue;
                          if (x == 5 && a == 0) continue;
                          rn.push_back(cn[x]);
                          rd.push_back(cd[x]);
                          if (solve24(rn, rd)) return true;
                          rn.pop_back();
                          rd.pop_back();
                      }
                  }
              }
              return false;
          }

          bool judgePoint24(vector<int>& cards) {
              vector<long long> nums(cards.begin(), cards.end());
              vector<long long> dens(4, 1);
              return solve24(nums, dens);
          }
        `,
        c: code`
          static bool solve24(long long* nums, long long* dens, int k) {
              if (k == 1) return nums[0] == 24 * dens[0];
              for (int i = 0; i < k; i++) {
                  for (int j = i + 1; j < k; j++) {
                      long long rn[4], rd[4];
                      int m = 0;
                      for (int t = 0; t < k; t++) if (t != i && t != j) { rn[m] = nums[t]; rd[m] = dens[t]; m++; }
                      long long a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                      long long cn[6] = {a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b};
                      long long cd[6] = {b * d, b * d, b * d, b * d, b * c, d * a};
                      for (int x = 0; x < 6; x++) {
                          if (x == 4 && c == 0) continue;
                          if (x == 5 && a == 0) continue;
                          rn[m] = cn[x];
                          rd[m] = cd[x];
                          if (solve24(rn, rd, k - 1)) return true;
                      }
                  }
              }
              return false;
          }

          bool judgePoint24(int* cards, int cardsSize) {
              long long nums[4], dens[4];
              for (int i = 0; i < 4; i++) { nums[i] = cards[i]; dens[i] = 1; }
              return solve24(nums, dens, cardsSize);
          }
        `,
        csharp: code`
          public static bool JudgePoint24(int[] cards)
          {
              long[] nums = new long[4];
              long[] dens = new long[4];
              for (int i = 0; i < 4; i++) { nums[i] = cards[i]; dens[i] = 1; }
              return Solve24(nums, dens, 4);
          }

          static bool Solve24(long[] nums, long[] dens, int k)
          {
              if (k == 1) return nums[0] == 24 * dens[0];
              for (int i = 0; i < k; i++)
              {
                  for (int j = i + 1; j < k; j++)
                  {
                      long[] rn = new long[k - 1];
                      long[] rd = new long[k - 1];
                      int m = 0;
                      for (int t = 0; t < k; t++) if (t != i && t != j) { rn[m] = nums[t]; rd[m] = dens[t]; m++; }
                      long a = nums[i], b = dens[i], c = nums[j], d = dens[j];
                      long[] cn = { a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b };
                      long[] cd = { b * d, b * d, b * d, b * d, b * c, d * a };
                      for (int x = 0; x < 6; x++)
                      {
                          if (x == 4 && c == 0) continue;
                          if (x == 5 && a == 0) continue;
                          rn[m] = cn[x];
                          rd[m] = cd[x];
                          if (Solve24(rn, rd, k - 1)) return true;
                      }
                  }
              }
              return false;
          }
        `,
        go: code`
          func solve24(nums, dens []int) bool {
          	k := len(nums)
          	if k == 1 {
          		return nums[0] == 24*dens[0]
          	}
          	for i := 0; i < k; i++ {
          		for j := i + 1; j < k; j++ {
          			rn := make([]int, 0, k-1)
          			rd := make([]int, 0, k-1)
          			for t := 0; t < k; t++ {
          				if t != i && t != j {
          					rn = append(rn, nums[t])
          					rd = append(rd, dens[t])
          				}
          			}
          			a, b, c, d := nums[i], dens[i], nums[j], dens[j]
          			cn := []int{a*d + c*b, a*d - c*b, c*b - a*d, a * c, a * d, c * b}
          			cd := []int{b * d, b * d, b * d, b * d, b * c, d * a}
          			for x := 0; x < 6; x++ {
          				if x == 4 && c == 0 {
          					continue
          				}
          				if x == 5 && a == 0 {
          					continue
          				}
          				if solve24(append(rn, cn[x]), append(rd, cd[x])) {
          					return true
          				}
          			}
          		}
          	}
          	return false
          }

          func judgePoint24(cards []int) bool {
          	nums := make([]int, len(cards))
          	copy(nums, cards)
          	dens := []int{1, 1, 1, 1}
          	return solve24(nums, dens)
          }
        `,
        kotlin: code`
          fun solve24(nums: LongArray, dens: LongArray): Boolean {
              val k = nums.size
              if (k == 1) return nums[0] == 24 * dens[0]
              for (i in 0 until k) {
                  for (j in i + 1 until k) {
                      val rn = LongArray(k - 1)
                      val rd = LongArray(k - 1)
                      var m = 0
                      for (t in 0 until k) if (t != i && t != j) { rn[m] = nums[t]; rd[m] = dens[t]; m++ }
                      val a = nums[i]
                      val b = dens[i]
                      val c = nums[j]
                      val d = dens[j]
                      val cn = longArrayOf(a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b)
                      val cd = longArrayOf(b * d, b * d, b * d, b * d, b * c, d * a)
                      for (x in 0 until 6) {
                          if (x == 4 && c == 0L) continue
                          if (x == 5 && a == 0L) continue
                          rn[m] = cn[x]
                          rd[m] = cd[x]
                          if (solve24(rn, rd)) return true
                      }
                  }
              }
              return false
          }

          fun judgePoint24(cards: IntArray): Boolean {
              val nums = LongArray(4) { cards[it].toLong() }
              val dens = LongArray(4) { 1L }
              return solve24(nums, dens)
          }
        `,
        swift: code`
          func solve24(_ nums: [Int], _ dens: [Int]) -> Bool {
              let k = nums.count
              if k == 1 { return nums[0] == 24 * dens[0] }
              for i in 0..<k {
                  for j in (i + 1)..<k {
                      var rn = [Int]()
                      var rd = [Int]()
                      for t in 0..<k where t != i && t != j {
                          rn.append(nums[t])
                          rd.append(dens[t])
                      }
                      let a = nums[i], b = dens[i], c = nums[j], d = dens[j]
                      var cn = [a * d + c * b, a * d - c * b, c * b - a * d, a * c]
                      var cd = [b * d, b * d, b * d, b * d]
                      if c != 0 { cn.append(a * d); cd.append(b * c) }
                      if a != 0 { cn.append(c * b); cd.append(d * a) }
                      for x in 0..<cn.count {
                          if solve24(rn + [cn[x]], rd + [cd[x]]) { return true }
                      }
                  }
              }
              return false
          }

          func judgePoint24(_ cards: [Int]) -> Bool {
              return solve24(cards, [1, 1, 1, 1])
          }
        `,
        rust: code`
          fn solve24(nums: &Vec<i64>, dens: &Vec<i64>) -> bool {
              let k = nums.len();
              if k == 1 {
                  return nums[0] == 24 * dens[0];
              }
              for i in 0..k {
                  for j in (i + 1)..k {
                      let mut rn: Vec<i64> = Vec::new();
                      let mut rd: Vec<i64> = Vec::new();
                      for t in 0..k {
                          if t != i && t != j {
                              rn.push(nums[t]);
                              rd.push(dens[t]);
                          }
                      }
                      let (a, b, c, d) = (nums[i], dens[i], nums[j], dens[j]);
                      let cn = [a * d + c * b, a * d - c * b, c * b - a * d, a * c, a * d, c * b];
                      let cd = [b * d, b * d, b * d, b * d, b * c, d * a];
                      for x in 0..6 {
                          if x == 4 && c == 0 {
                              continue;
                          }
                          if x == 5 && a == 0 {
                              continue;
                          }
                          rn.push(cn[x]);
                          rd.push(cd[x]);
                          if solve24(&rn, &rd) {
                              return true;
                          }
                          rn.pop();
                          rd.pop();
                      }
                  }
              }
              false
          }

          fn judgePoint24(cards: Vec<i32>) -> bool {
              let nums: Vec<i64> = cards.iter().map(|&v| v as i64).collect();
              let dens: Vec<i64> = vec![1; nums.len()];
              solve24(&nums, &dens)
          }
        `,
        php: code`
          function judgePoint24($cards) {
              return solve24($cards, [1, 1, 1, 1]);
          }

          function solve24($nums, $dens) {
              $k = count($nums);
              if ($k == 1) return $nums[0] == 24 * $dens[0];
              for ($i = 0; $i < $k; $i++) {
                  for ($j = $i + 1; $j < $k; $j++) {
                      $rn = [];
                      $rd = [];
                      for ($t = 0; $t < $k; $t++) {
                          if ($t != $i && $t != $j) { $rn[] = $nums[$t]; $rd[] = $dens[$t]; }
                      }
                      $a = $nums[$i]; $b = $dens[$i]; $c = $nums[$j]; $d = $dens[$j];
                      $cn = [$a * $d + $c * $b, $a * $d - $c * $b, $c * $b - $a * $d, $a * $c];
                      $cd = [$b * $d, $b * $d, $b * $d, $b * $d];
                      if ($c != 0) { $cn[] = $a * $d; $cd[] = $b * $c; }
                      if ($a != 0) { $cn[] = $c * $b; $cd[] = $d * $a; }
                      $cnt = count($cn);
                      for ($x = 0; $x < $cnt; $x++) {
                          $nn = $rn;
                          $dd = $rd;
                          $nn[] = $cn[$x];
                          $dd[] = $cd[$x];
                          if (solve24($nn, $dd)) return true;
                      }
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def judgePoint24(cards)
            solve24(cards.dup, [1, 1, 1, 1])
          end

          def solve24(nums, dens)
            k = nums.length
            return nums[0] == 24 * dens[0] if k == 1
            (0...k).each do |i|
              ((i + 1)...k).each do |j|
                rn = []
                rd = []
                k.times do |t|
                  next if t == i || t == j
                  rn << nums[t]
                  rd << dens[t]
                end
                a = nums[i]
                b = dens[i]
                c = nums[j]
                d = dens[j]
                cand = [[a * d + c * b, b * d], [a * d - c * b, b * d], [c * b - a * d, b * d], [a * c, b * d]]
                cand << [a * d, b * c] if c != 0
                cand << [c * b, d * a] if a != 0
                cand.each do |pair|
                  return true if solve24(rn + [pair[0]], rd + [pair[1]])
                end
              end
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Tiling a Rectangle with the Fewest Squares (LC 1240) ────────
  (() => {
    /** Skyline search, cross-checked against the published values below. */
    const ref = (n: number, m: number) => {
      const h = new Array<number>(m).fill(0);
      let best = n * m;
      const dfs = (cnt: number) => {
        if (cnt >= best) return;
        let mn = Infinity;
        let at = -1;
        for (let i = 0; i < m; i++) if (h[i] < mn) { mn = h[i]; at = i; }
        if (mn === n) { best = cnt; return; }
        let j = at;
        while (j < m && h[j] === mn && j - at < n - mn) j++;
        for (let size = j - at; size >= 1; size--) {
          for (let k = at; k < at + size; k++) h[k] += size;
          dfs(cnt + 1);
          for (let k = at; k < at + size; k++) h[k] -= size;
        }
      };
      dfs(0);
      return best;
    };
    const KNOWN: Array<[number, number, number]> = [[2, 3, 3], [5, 8, 5], [11, 13, 6], [13, 13, 1], [1, 7, 7], [6, 7, 5], [12, 13, 7]];
    for (const [n, m, want] of KNOWN) if (ref(n, m) !== want || ref(m, n) !== want) throw new Error(`tiling ref ${n}x${m}`);
    return {
      slug: "tiling-a-rectangle-with-the-fewest-squares",
      title: "Tiling a Rectangle with the Fewest Squares",
      difficulty: "HARD" as const,
      tags: ["Backtracking", "Recursion", "Google", "Amazon"],
      signature: {
        funcName: "tilingRectangle",
        params: [{ name: "n", type: "int" as const }, { name: "m", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Cover an `n x m` rectangle completely with squares whose sides are whole numbers. The squares may not overlap or stick out of the rectangle, and different squares may have different sizes.\n\n" +
        "Return the **minimum** number of squares needed.",
        [
          { in: "n = 2, m = 3", out: "3", note: "One 2x2 square and two 1x1 squares." },
          { in: "n = 5, m = 8", out: "5", note: "A 5x5, a 3x3, a 2x2 and two 1x1 squares." },
          { in: "n = 11, m = 13", out: "6", note: "The famous case where cutting the rectangle into two smaller rectangles is not optimal." },
        ],
        ["1 <= n, m <= 13"]),
      hints: [
        "Splitting the rectangle into two rectangles and recursing is tempting but wrong: 11 x 13 needs 6 squares, while the best sequence of straight cuts needs 8.",
        "Search over actual placements instead. Keep the height filled so far in each column (a skyline); always fill the lowest, leftmost empty cell next — some square must cover it, with that cell as its top-left corner.",
        "Try the largest square that fits there first, and prune any branch whose count already reaches the best answer found.",
      ],
      editorial: explain({
        idea: "Every tiling can be built by repeatedly covering the lowest-leftmost uncovered cell with a square anchored there. Branch over the square's size, track the filled profile as column heights, and use branch-and-bound to cut the search.",
        steps: [
          "Keep `h[c]`, the filled height of each of the `m` columns, and `best = n * m` (all unit squares).",
          "`dfs(count)`: if `count >= best`, return. Find the lowest height `mn` and its leftmost column `i`; if `mn == n`, the rectangle is full — set `best = count`.",
          "The square anchored at column `i` can be as wide as the run of columns at height `mn` starting at `i`, and no taller than `n - mn`.",
          "For each size from that maximum down to 1, raise those columns by the size, recurse with `count + 1`, and lower them back.",
          "Return `best`.",
        ],
        why: "The lowest-leftmost uncovered cell must be the top-left corner of the square that covers it (anything to its left or below is already covered), so branching over that square's size enumerates every tiling. Trying big squares first finds a good tiling quickly, after which the `count >= best` bound discards almost everything else.",
        time: "Exponential in the worst case; a few thousand nodes for every input with n, m ≤ 13",
        space: "O(m)",
        pitfalls: [
          "The \"cut into two rectangles\" DP is incorrect for 11 x 13 (it gives 8).",
          "The square anchored at the lowest cell is limited both by the run of equal-height columns and by the remaining height.",
          "n == m is a single square — handle it or let the search find it.",
        ],
      }),
      examples: [
        { input: "2\n3", expectedOutput: "3" },
        { input: "5\n8", expectedOutput: "5" },
        { input: "11\n13", expectedOutput: "6" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 13);
        const m = ri(rng, 1, 13);
        return { input: `${n}\n${m}`, expectedOutput: String(ref(n, m)) };
      },
      solutions: {
        python: code`
          def tilingRectangle(n: int, m: int) -> int:
              h = [0] * m
              best = [n * m]

              def dfs(cnt):
                  if cnt >= best[0]:
                      return
                  mn = min(h)
                  if mn == n:
                      best[0] = cnt
                      return
                  i = h.index(mn)
                  j = i
                  while j < m and h[j] == mn and j - i < n - mn:
                      j += 1
                  for size in range(j - i, 0, -1):
                      for k in range(i, i + size):
                          h[k] += size
                      dfs(cnt + 1)
                      for k in range(i, i + size):
                          h[k] -= size

              dfs(0)
              return best[0]
        `,
        javascript: code`
          var tilingRectangle = function(n, m) {
              var h = new Array(m).fill(0);
              var best = n * m;
              var dfs = function(cnt) {
                  if (cnt >= best) return;
                  var mn = n + 1, at = -1;
                  for (var c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
                  if (mn === n) { best = cnt; return; }
                  var j = at;
                  while (j < m && h[j] === mn && j - at < n - mn) j++;
                  for (var size = j - at; size >= 1; size--) {
                      for (var k = at; k < at + size; k++) h[k] += size;
                      dfs(cnt + 1);
                      for (var k2 = at; k2 < at + size; k2++) h[k2] -= size;
                  }
              };
              dfs(0);
              return best;
          };
        `,
        typescript: code`
          function tilingRectangle(n: number, m: number): number {
              var h: number[] = [];
              for (var i = 0; i < m; i++) h.push(0);
              var best = n * m;
              function dfs(cnt: number): void {
                  if (cnt >= best) return;
                  var mn = n + 1, at = -1;
                  for (var c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
                  if (mn === n) { best = cnt; return; }
                  var j = at;
                  while (j < m && h[j] === mn && j - at < n - mn) j++;
                  for (var size = j - at; size >= 1; size--) {
                      for (var k = at; k < at + size; k++) h[k] += size;
                      dfs(cnt + 1);
                      for (var k2 = at; k2 < at + size; k2++) h[k2] -= size;
                  }
              }
              dfs(0);
              return best;
          }
        `,
        java: code`
          static int tileBest;

          public static int tilingRectangle(int n, int m) {
              tileBest = n * m;
              tileDfs(new int[m], n, m, 0);
              return tileBest;
          }

          static void tileDfs(int[] h, int n, int m, int cnt) {
              if (cnt >= tileBest) return;
              int mn = n + 1, at = -1;
              for (int c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
              if (mn == n) { tileBest = cnt; return; }
              int j = at;
              while (j < m && h[j] == mn && j - at < n - mn) j++;
              for (int size = j - at; size >= 1; size--) {
                  for (int k = at; k < at + size; k++) h[k] += size;
                  tileDfs(h, n, m, cnt + 1);
                  for (int k = at; k < at + size; k++) h[k] -= size;
              }
          }
        `,
        cpp: code`
          void tileDfs(vector<int>& h, int n, int m, int cnt, int& best) {
              if (cnt >= best) return;
              int mn = n + 1, at = -1;
              for (int c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
              if (mn == n) { best = cnt; return; }
              int j = at;
              while (j < m && h[j] == mn && j - at < n - mn) j++;
              for (int size = j - at; size >= 1; size--) {
                  for (int k = at; k < at + size; k++) h[k] += size;
                  tileDfs(h, n, m, cnt + 1, best);
                  for (int k = at; k < at + size; k++) h[k] -= size;
              }
          }

          int tilingRectangle(int n, int m) {
              vector<int> h(m, 0);
              int best = n * m;
              tileDfs(h, n, m, 0, best);
              return best;
          }
        `,
        c: code`
          static void tileDfs(int* h, int n, int m, int cnt, int* best) {
              if (cnt >= *best) return;
              int mn = n + 1, at = -1;
              for (int c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
              if (mn == n) { *best = cnt; return; }
              int j = at;
              while (j < m && h[j] == mn && j - at < n - mn) j++;
              for (int size = j - at; size >= 1; size--) {
                  for (int k = at; k < at + size; k++) h[k] += size;
                  tileDfs(h, n, m, cnt + 1, best);
                  for (int k = at; k < at + size; k++) h[k] -= size;
              }
          }

          int tilingRectangle(int n, int m) {
              int h[16];
              for (int i = 0; i < m; i++) h[i] = 0;
              int best = n * m;
              tileDfs(h, n, m, 0, &best);
              return best;
          }
        `,
        csharp: code`
          static int tileBest;

          public static int TilingRectangle(int n, int m)
          {
              tileBest = n * m;
              TileDfs(new int[m], n, m, 0);
              return tileBest;
          }

          static void TileDfs(int[] h, int n, int m, int cnt)
          {
              if (cnt >= tileBest) return;
              int mn = n + 1, at = -1;
              for (int c = 0; c < m; c++) if (h[c] < mn) { mn = h[c]; at = c; }
              if (mn == n) { tileBest = cnt; return; }
              int j = at;
              while (j < m && h[j] == mn && j - at < n - mn) j++;
              for (int size = j - at; size >= 1; size--)
              {
                  for (int k = at; k < at + size; k++) h[k] += size;
                  TileDfs(h, n, m, cnt + 1);
                  for (int k = at; k < at + size; k++) h[k] -= size;
              }
          }
        `,
        go: code`
          func tilingRectangle(n int, m int) int {
          	h := make([]int, m)
          	best := n * m
          	var dfs func(cnt int)
          	dfs = func(cnt int) {
          		if cnt >= best {
          			return
          		}
          		mn, at := n+1, -1
          		for c := 0; c < m; c++ {
          			if h[c] < mn {
          				mn = h[c]
          				at = c
          			}
          		}
          		if mn == n {
          			best = cnt
          			return
          		}
          		j := at
          		for j < m && h[j] == mn && j-at < n-mn {
          			j++
          		}
          		for size := j - at; size >= 1; size-- {
          			for k := at; k < at+size; k++ {
          				h[k] += size
          			}
          			dfs(cnt + 1)
          			for k := at; k < at+size; k++ {
          				h[k] -= size
          			}
          		}
          	}
          	dfs(0)
          	return best
          }
        `,
        kotlin: code`
          fun tilingRectangle(n: Int, m: Int): Int {
              val h = IntArray(m)
              var best = n * m
              fun dfs(cnt: Int) {
                  if (cnt >= best) return
                  var mn = n + 1
                  var at = -1
                  for (c in 0 until m) if (h[c] < mn) { mn = h[c]; at = c }
                  if (mn == n) { best = cnt; return }
                  var j = at
                  while (j < m && h[j] == mn && j - at < n - mn) j++
                  var size = j - at
                  while (size >= 1) {
                      for (k in at until at + size) h[k] += size
                      dfs(cnt + 1)
                      for (k in at until at + size) h[k] -= size
                      size--
                  }
              }
              dfs(0)
              return best
          }
        `,
        swift: code`
          func tilingRectangle(_ n: Int, _ m: Int) -> Int {
              var h = [Int](repeating: 0, count: m)
              var best = n * m
              func dfs(_ cnt: Int) {
                  if cnt >= best { return }
                  var mn = n + 1
                  var at = -1
                  for c in 0..<m where h[c] < mn {
                      mn = h[c]
                      at = c
                  }
                  if mn == n {
                      best = cnt
                      return
                  }
                  var j = at
                  while j < m && h[j] == mn && j - at < n - mn { j += 1 }
                  var size = j - at
                  while size >= 1 {
                      for k in at..<(at + size) { h[k] += size }
                      dfs(cnt + 1)
                      for k in at..<(at + size) { h[k] -= size }
                      size -= 1
                  }
              }
              dfs(0)
              return best
          }
        `,
        rust: code`
          fn tile_dfs(h: &mut Vec<i32>, n: i32, m: usize, cnt: i32, best: &mut i32) {
              if cnt >= *best {
                  return;
              }
              let mut mn = n + 1;
              let mut at = 0usize;
              for c in 0..m {
                  if h[c] < mn {
                      mn = h[c];
                      at = c;
                  }
              }
              if mn == n {
                  *best = cnt;
                  return;
              }
              let mut j = at;
              while j < m && h[j] == mn && ((j - at) as i32) < n - mn {
                  j += 1;
              }
              let mut size = j - at;
              while size >= 1 {
                  for k in at..at + size {
                      h[k] += size as i32;
                  }
                  tile_dfs(h, n, m, cnt + 1, best);
                  for k in at..at + size {
                      h[k] -= size as i32;
                  }
                  size -= 1;
              }
          }

          fn tilingRectangle(n: i32, m: i32) -> i32 {
              let mut h = vec![0i32; m as usize];
              let mut best = n * m;
              tile_dfs(&mut h, n, m as usize, 0, &mut best);
              best
          }
        `,
        php: code`
          function tilingRectangle($n, $m) {
              $h = array_fill(0, $m, 0);
              $best = $n * $m;
              tileDfs($h, $n, $m, 0, $best);
              return $best;
          }

          function tileDfs(&$h, $n, $m, $cnt, &$best) {
              if ($cnt >= $best) return;
              $mn = $n + 1;
              $at = -1;
              for ($c = 0; $c < $m; $c++) {
                  if ($h[$c] < $mn) { $mn = $h[$c]; $at = $c; }
              }
              if ($mn == $n) { $best = $cnt; return; }
              $j = $at;
              while ($j < $m && $h[$j] == $mn && $j - $at < $n - $mn) $j++;
              for ($size = $j - $at; $size >= 1; $size--) {
                  for ($k = $at; $k < $at + $size; $k++) $h[$k] += $size;
                  tileDfs($h, $n, $m, $cnt + 1, $best);
                  for ($k = $at; $k < $at + $size; $k++) $h[$k] -= $size;
              }
          }
        `,
        ruby: code`
          def tilingRectangle(n, m)
            h = Array.new(m, 0)
            best = [n * m]
            tile_dfs(h, n, m, 0, best)
            best[0]
          end

          def tile_dfs(h, n, m, cnt, best)
            return if cnt >= best[0]
            mn = h.min
            if mn == n
              best[0] = cnt
              return
            end
            at = h.index(mn)
            j = at
            j += 1 while j < m && h[j] == mn && j - at < n - mn
            size = j - at
            while size >= 1
              (at...(at + size)).each { |k| h[k] += size }
              tile_dfs(h, n, m, cnt + 1, best)
              (at...(at + size)).each { |k| h[k] -= size }
              size -= 1
            end
          end
        `,
      },
    };
  })(),

  // ── Stickers to Spell Word (LC 691) ─────────────────────────────
  (() => {
    /** Independent check: memoised search over the multiset of letters still needed. */
    const ref = (stickers: string[], target: string) => {
      const cnt = (s: string) => {
        const c = new Array<number>(26).fill(0);
        for (const ch of s) c[ch.charCodeAt(0) - 97]++;
        return c;
      };
      const sc = stickers.map(cnt);
      const memo = new Map<string, number>();
      const go = (need: number[]): number => {
        const key = need.join(",");
        if (memo.has(key)) return memo.get(key)!;
        const first = need.findIndex((x) => x > 0);
        if (first < 0) return 0;
        let best = Infinity;
        for (const s of sc) {
          if (!s[first]) continue;
          best = Math.min(best, 1 + go(need.map((v, i) => Math.max(0, v - s[i]))));
        }
        memo.set(key, best);
        return best;
      };
      const r = go(cnt(target));
      return r === Infinity ? -1 : r;
    };
    const LOWER = "abcdefghijklmnopqrstuvwxyz";
    return {
      slug: "stickers-to-spell-word",
      title: "Stickers to Spell Word",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Backtracking", "Bitmask", "Meta", "Google"],
      signature: {
        funcName: "minStickers",
        params: [{ name: "stickers", type: "string[]" as const }, { name: "target", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Each sticker shows a lowercase word. You may buy any sticker as many times as you like, cut its letters apart, and rearrange letters from all the stickers you bought to spell `target`.\n\n" +
        "Return the **minimum number of stickers** you need to buy to spell `target`, or `-1` if it is impossible.",
        [
          { in: "stickers = [\"with\",\"example\",\"science\"], target = \"thehat\"", out: "3", note: "Two \"with\" and one \"example\" give t, h, e, h, a, t." },
          { in: "stickers = [\"notice\",\"possible\"], target = \"basicbasic\"", out: "-1", note: "No sticker has an `a`." },
          { in: "stickers = [\"kai\",\"ro\",\"code\"], target = \"codekairo\"", out: "3" },
        ],
        [
          "1 <= stickers.length <= 50",
          "1 <= stickers[i].length <= 10",
          "1 <= target.length <= 15",
          "stickers[i] and target consist of lowercase English letters",
        ]),
      hints: [
        "With at most 15 letters in `target`, a bitmask can record which positions of `target` are already covered.",
        "From a mask, applying one sticker covers as many uncovered positions as its letters allow — this gives the next mask. Take the minimum number of steps from the empty mask to the full mask.",
        "Big speed-up: the first uncovered position must be covered by *some* sticker eventually, and order does not matter, so only try stickers that contain that letter.",
      ],
      editorial: explain({
        idea: "Shortest path over the 2^t subsets of target positions. Each sticker moves a mask to a superset, so processing masks in increasing numeric order is a valid DP order.",
        steps: [
          "Count the letters of every sticker once.",
          "`dp[0] = 0`, every other entry infinite. For each mask in increasing order with a finite `dp[mask]`, find its lowest uncovered position `i`.",
          "For each sticker containing `target[i]`, copy its letter counts and walk the uncovered positions, covering each one whose letter is still available; that yields `next`. Relax `dp[next] = min(dp[next], dp[mask] + 1)`.",
          "Return `dp[full]`, or -1 if it stayed infinite.",
        ],
        why: "Applying a sticker greedily covers the maximum number of positions possible for each letter, and positions holding the same letter are interchangeable, so nothing is lost by the greedy choice. Requiring the chosen sticker to cover the first uncovered position only fixes the order of the stickers in an optimal solution — some sticker in it covers that position, and it can be applied first.",
        time: "O(2^t · k · (t + 26)) for k stickers and target length t",
        space: "O(2^t)",
        pitfalls: [
          "If a letter of `target` appears on no sticker, the answer is -1 — the DP shows it as an unreachable full mask.",
          "Repeated letters in `target` need repeated letters from stickers (or more stickers).",
          "Masks only grow, so iterating them in increasing order never reads a value before it is final.",
        ],
      }),
      examples: [
        { input: "[\"with\",\"example\",\"science\"]\n\"thehat\"", expectedOutput: "3" },
        { input: "[\"notice\",\"possible\"]\n\"basicbasic\"", expectedOutput: "-1" },
        { input: "[\"kai\",\"ro\",\"code\"]\n\"codekairo\"", expectedOutput: "3" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["abc", "abcde", "abcdefgh", "etaoinshr", LOWER]);
        const t = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 12]);
        let target = "";
        for (let i = 0; i < t; i++) target += alpha[ri(rng, 0, alpha.length - 1)];
        const k = ri(rng, 1, 8);
        const stickers: string[] = [];
        for (let s = 0; s < k; s++) {
          const len = ri(rng, 1, 10);
          let w = "";
          for (let i = 0; i < len; i++) w += rng() < 0.7 ? alpha[ri(rng, 0, alpha.length - 1)] : LOWER[ri(rng, 0, 25)];
          stickers.push(w);
        }
        if (rng() < 0.6) {
          // Usually make sure every target letter is available somewhere.
          const have = new Set(stickers.join(""));
          const missing = [...new Set(target)].filter((c) => !have.has(c));
          if (missing.length) stickers[ri(rng, 0, k - 1)] = (stickers[0] + missing.join("")).slice(-10);
        }
        return { input: `${fmtStrArr(stickers)}\n"${target}"`, expectedOutput: String(ref(stickers, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minStickers(stickers: List[str], target: str) -> int:
              t = len(target)
              full = (1 << t) - 1
              counts = []
              for s in stickers:
                  c = [0] * 26
                  for ch in s:
                      c[ord(ch) - 97] += 1
                  counts.append(c)
              tg = [ord(ch) - 97 for ch in target]
              INF = float('inf')
              dp = [INF] * (full + 1)
              dp[0] = 0
              for mask in range(full + 1):
                  if dp[mask] == INF:
                      continue
                  if mask == full:
                      break
                  first = 0
                  while mask >> first & 1:
                      first += 1
                  for c in counts:
                      if c[tg[first]] == 0:
                          continue
                      left = c[:]
                      nxt = mask
                      for i in range(t):
                          if not (nxt >> i & 1) and left[tg[i]] > 0:
                              left[tg[i]] -= 1
                              nxt |= 1 << i
                      if dp[mask] + 1 < dp[nxt]:
                          dp[nxt] = dp[mask] + 1
              return -1 if dp[full] == INF else dp[full]
        `,
        javascript: code`
          var minStickers = function(stickers, target) {
              var t = target.length;
              var full = (1 << t) - 1;
              var counts = stickers.map(function(s) {
                  var c = new Array(26).fill(0);
                  for (var i = 0; i < s.length; i++) c[s.charCodeAt(i) - 97]++;
                  return c;
              });
              var tg = [];
              for (var i = 0; i < t; i++) tg.push(target.charCodeAt(i) - 97);
              var INF = 1e9;
              var dp = new Array(full + 1).fill(INF);
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var first = 0;
                  while ((mask >> first) & 1) first++;
                  for (var s = 0; s < counts.length; s++) {
                      var c = counts[s];
                      if (c[tg[first]] === 0) continue;
                      var left = c.slice();
                      var nxt = mask;
                      for (var p = 0; p < t; p++) {
                          if (!((nxt >> p) & 1) && left[tg[p]] > 0) {
                              left[tg[p]]--;
                              nxt |= 1 << p;
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1;
                  }
              }
              return dp[full] === INF ? -1 : dp[full];
          };
        `,
        typescript: code`
          function minStickers(stickers: string[], target: string): number {
              var t = target.length;
              var full = (1 << t) - 1;
              var counts: number[][] = [];
              for (var s = 0; s < stickers.length; s++) {
                  var c0: number[] = [];
                  for (var z = 0; z < 26; z++) c0.push(0);
                  for (var i = 0; i < stickers[s].length; i++) c0[stickers[s].charCodeAt(i) - 97]++;
                  counts.push(c0);
              }
              var tg: number[] = [];
              for (var q = 0; q < t; q++) tg.push(target.charCodeAt(q) - 97);
              var INF = 1000000000;
              var dp: number[] = [];
              for (var w = 0; w <= full; w++) dp.push(INF);
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var first = 0;
                  while ((mask >> first) & 1) first++;
                  for (var k = 0; k < counts.length; k++) {
                      var c = counts[k];
                      if (c[tg[first]] === 0) continue;
                      var left = c.slice();
                      var nxt = mask;
                      for (var p = 0; p < t; p++) {
                          if (!((nxt >> p) & 1) && left[tg[p]] > 0) {
                              left[tg[p]]--;
                              nxt |= 1 << p;
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1;
                  }
              }
              return dp[full] === INF ? -1 : dp[full];
          }
        `,
        java: code`
          public static int minStickers(String[] stickers, String target) {
              int t = target.length();
              int full = (1 << t) - 1;
              int[][] counts = new int[stickers.length][26];
              for (int s = 0; s < stickers.length; s++)
                  for (char ch : stickers[s].toCharArray()) counts[s][ch - 'a']++;
              int[] tg = new int[t];
              for (int i = 0; i < t; i++) tg[i] = target.charAt(i) - 'a';
              int INF = Integer.MAX_VALUE;
              int[] dp = new int[full + 1];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int first = 0;
                  while (((mask >> first) & 1) == 1) first++;
                  for (int[] c : counts) {
                      if (c[tg[first]] == 0) continue;
                      int[] left = c.clone();
                      int nxt = mask;
                      for (int p = 0; p < t; p++) {
                          if (((nxt >> p) & 1) == 0 && left[tg[p]] > 0) {
                              left[tg[p]]--;
                              nxt |= 1 << p;
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1;
                  }
              }
              return dp[full] == INF ? -1 : dp[full];
          }
        `,
        cpp: code`
          int minStickers(vector<string>& stickers, string target) {
              int t = target.size();
              int full = (1 << t) - 1;
              vector<array<int, 26>> counts;
              for (auto& s : stickers) {
                  array<int, 26> c;
                  c.fill(0);
                  for (char ch : s) c[ch - 'a']++;
                  counts.push_back(c);
              }
              const int INF = INT_MAX;
              vector<int> dp(full + 1, INF);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int first = 0;
                  while ((mask >> first) & 1) first++;
                  for (auto& c : counts) {
                      if (c[target[first] - 'a'] == 0) continue;
                      array<int, 26> left = c;
                      int nxt = mask;
                      for (int p = 0; p < t; p++) {
                          int ch = target[p] - 'a';
                          if (!((nxt >> p) & 1) && left[ch] > 0) {
                              left[ch]--;
                              nxt |= 1 << p;
                          }
                      }
                      dp[nxt] = min(dp[nxt], dp[mask] + 1);
                  }
              }
              return dp[full] == INF ? -1 : dp[full];
          }
        `,
        c: code`
          int minStickers(char** stickers, int stickersSize, const char* target) {
              int t = (int)strlen(target);
              int full = (1 << t) - 1;
              int* counts = (int*)calloc(stickersSize * 26, sizeof(int));
              for (int s = 0; s < stickersSize; s++)
                  for (const char* p = stickers[s]; *p; p++) counts[s * 26 + (*p - 'a')]++;
              int INF = 2147483647;
              int* dp = (int*)malloc(sizeof(int) * (full + 1));
              for (int i = 0; i <= full; i++) dp[i] = INF;
              dp[0] = 0;
              int left[26];
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int first = 0;
                  while ((mask >> first) & 1) first++;
                  for (int s = 0; s < stickersSize; s++) {
                      int* c = counts + s * 26;
                      if (c[target[first] - 'a'] == 0) continue;
                      for (int z = 0; z < 26; z++) left[z] = c[z];
                      int nxt = mask;
                      for (int p = 0; p < t; p++) {
                          int ch = target[p] - 'a';
                          if (!((nxt >> p) & 1) && left[ch] > 0) {
                              left[ch]--;
                              nxt |= 1 << p;
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1;
                  }
              }
              int ans = dp[full] == INF ? -1 : dp[full];
              free(dp);
              free(counts);
              return ans;
          }
        `,
        csharp: code`
          public static int MinStickers(string[] stickers, string target)
          {
              int t = target.Length;
              int full = (1 << t) - 1;
              int[][] counts = new int[stickers.Length][];
              for (int s = 0; s < stickers.Length; s++)
              {
                  counts[s] = new int[26];
                  foreach (char ch in stickers[s]) counts[s][ch - 'a']++;
              }
              int INF = int.MaxValue;
              int[] dp = new int[full + 1];
              for (int i = 0; i <= full; i++) dp[i] = INF;
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++)
              {
                  if (dp[mask] == INF) continue;
                  int first = 0;
                  while (((mask >> first) & 1) == 1) first++;
                  foreach (int[] c in counts)
                  {
                      if (c[target[first] - 'a'] == 0) continue;
                      int[] left = (int[])c.Clone();
                      int nxt = mask;
                      for (int p = 0; p < t; p++)
                      {
                          int ch = target[p] - 'a';
                          if (((nxt >> p) & 1) == 0 && left[ch] > 0)
                          {
                              left[ch]--;
                              nxt |= 1 << p;
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1;
                  }
              }
              return dp[full] == INF ? -1 : dp[full];
          }
        `,
        go: code`
          func minStickers(stickers []string, target string) int {
          	t := len(target)
          	full := (1 << uint(t)) - 1
          	counts := make([][26]int, len(stickers))
          	for s, w := range stickers {
          		for i := 0; i < len(w); i++ {
          			counts[s][w[i]-'a']++
          		}
          	}
          	const INF = 1 << 30
          	dp := make([]int, full+1)
          	for i := range dp {
          		dp[i] = INF
          	}
          	dp[0] = 0
          	for mask := 0; mask < full; mask++ {
          		if dp[mask] == INF {
          			continue
          		}
          		first := 0
          		for (mask>>uint(first))&1 == 1 {
          			first++
          		}
          		for s := range counts {
          			if counts[s][target[first]-'a'] == 0 {
          				continue
          			}
          			left := counts[s]
          			nxt := mask
          			for p := 0; p < t; p++ {
          				ch := target[p] - 'a'
          				if (nxt>>uint(p))&1 == 0 && left[ch] > 0 {
          					left[ch]--
          					nxt |= 1 << uint(p)
          				}
          			}
          			if dp[mask]+1 < dp[nxt] {
          				dp[nxt] = dp[mask] + 1
          			}
          		}
          	}
          	if dp[full] == INF {
          		return -1
          	}
          	return dp[full]
          }
        `,
        kotlin: code`
          fun minStickers(stickers: Array<String>, target: String): Int {
              val t = target.length
              val full = (1 shl t) - 1
              val counts = Array(stickers.size) { IntArray(26) }
              for (s in stickers.indices) for (ch in stickers[s]) counts[s][ch - 'a']++
              val inf = Int.MAX_VALUE
              val dp = IntArray(full + 1) { inf }
              dp[0] = 0
              for (mask in 0 until full) {
                  if (dp[mask] == inf) continue
                  var first = 0
                  while ((mask shr first) and 1 == 1) first++
                  for (c in counts) {
                      if (c[target[first] - 'a'] == 0) continue
                      val left = c.copyOf()
                      var nxt = mask
                      for (p in 0 until t) {
                          val ch = target[p] - 'a'
                          if ((nxt shr p) and 1 == 0 && left[ch] > 0) {
                              left[ch]--
                              nxt = nxt or (1 shl p)
                          }
                      }
                      if (dp[mask] + 1 < dp[nxt]) dp[nxt] = dp[mask] + 1
                  }
              }
              return if (dp[full] == inf) -1 else dp[full]
          }
        `,
        swift: code`
          func minStickers(_ stickers: [String], _ target: String) -> Int {
              let tg = Array(target.utf8).map { Int($0) - 97 }
              let t = tg.count
              let full = (1 << t) - 1
              var counts = [[Int]]()
              for s in stickers {
                  var c = [Int](repeating: 0, count: 26)
                  for b in s.utf8 { c[Int(b) - 97] += 1 }
                  counts.append(c)
              }
              let inf = Int.max
              var dp = [Int](repeating: inf, count: full + 1)
              dp[0] = 0
              var mask = 0
              while mask < full {
                  if dp[mask] != inf {
                      var first = 0
                      while (mask >> first) & 1 == 1 { first += 1 }
                      for c in counts where c[tg[first]] > 0 {
                          var left = c
                          var nxt = mask
                          for p in 0..<t where (nxt >> p) & 1 == 0 && left[tg[p]] > 0 {
                              left[tg[p]] -= 1
                              nxt |= 1 << p
                          }
                          if dp[mask] + 1 < dp[nxt] { dp[nxt] = dp[mask] + 1 }
                      }
                  }
                  mask += 1
              }
              return dp[full] == inf ? -1 : dp[full]
          }
        `,
        rust: code`
          fn minStickers(stickers: Vec<String>, target: String) -> i32 {
              let tg: Vec<usize> = target.bytes().map(|b| (b - b'a') as usize).collect();
              let t = tg.len();
              let full = (1usize << t) - 1;
              let mut counts: Vec<[i32; 26]> = Vec::new();
              for s in stickers.iter() {
                  let mut c = [0i32; 26];
                  for b in s.bytes() {
                      c[(b - b'a') as usize] += 1;
                  }
                  counts.push(c);
              }
              let inf = std::i32::MAX;
              let mut dp = vec![inf; full + 1];
              dp[0] = 0;
              for mask in 0..full {
                  if dp[mask] == inf {
                      continue;
                  }
                  let mut first = 0;
                  while (mask >> first) & 1 == 1 {
                      first += 1;
                  }
                  for c in counts.iter() {
                      if c[tg[first]] == 0 {
                          continue;
                      }
                      let mut left = *c;
                      let mut nxt = mask;
                      for p in 0..t {
                          if (nxt >> p) & 1 == 0 && left[tg[p]] > 0 {
                              left[tg[p]] -= 1;
                              nxt |= 1 << p;
                          }
                      }
                      if dp[mask] + 1 < dp[nxt] {
                          dp[nxt] = dp[mask] + 1;
                      }
                  }
              }
              if dp[full] == inf { -1 } else { dp[full] }
          }
        `,
        php: code`
          function minStickers($stickers, $target) {
              $t = strlen($target);
              $full = (1 << $t) - 1;
              $counts = [];
              foreach ($stickers as $s) {
                  $c = array_fill(0, 26, 0);
                  $len = strlen($s);
                  for ($i = 0; $i < $len; $i++) $c[ord($s[$i]) - 97]++;
                  $counts[] = $c;
              }
              $tg = [];
              for ($i = 0; $i < $t; $i++) $tg[] = ord($target[$i]) - 97;
              $INF = PHP_INT_MAX;
              $dp = array_fill(0, $full + 1, $INF);
              $dp[0] = 0;
              for ($mask = 0; $mask < $full; $mask++) {
                  if ($dp[$mask] == $INF) continue;
                  $first = 0;
                  while (($mask >> $first) & 1) $first++;
                  foreach ($counts as $c) {
                      if ($c[$tg[$first]] == 0) continue;
                      $left = $c;
                      $nxt = $mask;
                      for ($p = 0; $p < $t; $p++) {
                          if (!(($nxt >> $p) & 1) && $left[$tg[$p]] > 0) {
                              $left[$tg[$p]]--;
                              $nxt |= 1 << $p;
                          }
                      }
                      if ($dp[$mask] + 1 < $dp[$nxt]) $dp[$nxt] = $dp[$mask] + 1;
                  }
              }
              return $dp[$full] == $INF ? -1 : $dp[$full];
          }
        `,
        ruby: code`
          def minStickers(stickers, target)
            tg = target.bytes.map { |b| b - 97 }
            t = tg.length
            full = (1 << t) - 1
            counts = stickers.map do |s|
              c = Array.new(26, 0)
              s.each_byte { |b| c[b - 97] += 1 }
              c
            end
            inf = 1 << 40
            dp = Array.new(full + 1, inf)
            dp[0] = 0
            (0...full).each do |mask|
              next if dp[mask] == inf
              first = 0
              first += 1 while (mask >> first) & 1 == 1
              counts.each do |c|
                next if c[tg[first]] == 0
                left = c.dup
                nxt = mask
                t.times do |p|
                  if (nxt >> p) & 1 == 0 && left[tg[p]] > 0
                    left[tg[p]] -= 1
                    nxt |= 1 << p
                  end
                end
                dp[nxt] = dp[mask] + 1 if dp[mask] + 1 < dp[nxt]
              end
            end
            dp[full] == inf ? -1 : dp[full]
          end
        `,
      },
    };
  })(),


  // ── Generate Binary Strings Without Adjacent Zeros (LC 3211) ────
  (() => {
    const ref = (n: number) => {
      let level = ["0", "1"];
      for (let len = 1; len < n; len++) {
        const nxt: string[] = [];
        for (const s of level) {
          if (s[s.length - 1] === "1") nxt.push(s + "0");
          nxt.push(s + "1");
        }
        level = nxt;
      }
      return level.sort(cmpStr);
    };
    return {
      slug: "generate-binary-strings-without-adjacent-zeros",
      title: "Generate Binary Strings Without Adjacent Zeros",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Bit Manipulation", "Amazon", "Google"],
      signature: { funcName: "validStrings", params: [{ name: "n", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "A binary string is **valid** when every substring of length 2 contains at least one `1` — in other words, no two `0`s are adjacent.\n\n" +
        "Return all valid binary strings of length `n`, in ascending **lexicographic** order.",
        [
          { in: "n = 3", out: "[\"010\",\"011\",\"101\",\"110\",\"111\"]", note: "`000`, `001` and `100` contain `00`." },
          { in: "n = 1", out: "[\"0\",\"1\"]" },
          { in: "n = 2", out: "[\"01\",\"10\",\"11\"]" },
        ],
        ["1 <= n <= 18"]),
      hints: [
        "Build the string one character at a time; the only rule is about the previous character.",
        "A `1` can always be appended. A `0` can be appended only if the string is empty or ends in `1`.",
        "Try `0` before `1` at every position and the strings come out already sorted.",
      ],
      editorial: explain({
        idea: "Depth-first construction with a one-character look-back. Because all strings have the same length and `0` is tried before `1`, the depth-first order is the lexicographic order.",
        steps: [
          "`dfs(prefix)`: if `prefix` has length `n`, record it.",
          "If `prefix` is empty or ends with `1`, recurse on `prefix + \"0\"`.",
          "Always recurse on `prefix + \"1\"`.",
        ],
        why: "A string has no `00` exactly when no `0` follows a `0`, which is the only append the search forbids — so it produces precisely the valid strings, each once. Two strings first differ at some position where the one with `0` was explored first, so the output is sorted.",
        time: "O(n · F(n+2)) — the count of valid strings is a Fibonacci number",
        space: "O(n) recursion depth besides the output",
        pitfalls: [
          "The first character may be `0` (there is no previous character).",
          "`n = 1` gives both `0` and `1`.",
          "Generating all 2^n strings and filtering works but wastes most of its time.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "[\"010\",\"011\",\"101\",\"110\",\"111\"]" },
        { input: "1", expectedOutput: "[\"0\",\"1\"]" },
        { input: "2", expectedOutput: "[\"01\",\"10\",\"11\"]" },
      ],
      hiddenCount: 100,
      gen: (rng: Rng) => {
        const n = rng() < 0.08 ? ri(rng, 15, 18) : ri(rng, 1, 14);
        return { input: String(n), expectedOutput: fmtStrArr(ref(n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validStrings(n: int) -> List[str]:
              out = []
              buf = []

              def dfs():
                  if len(buf) == n:
                      out.append(''.join(buf))
                      return
                  if not buf or buf[-1] == '1':
                      buf.append('0')
                      dfs()
                      buf.pop()
                  buf.append('1')
                  dfs()
                  buf.pop()

              dfs()
              return out
        `,
        javascript: code`
          var validStrings = function(n) {
              var out = [];
              var buf = [];
              var dfs = function() {
                  if (buf.length === n) {
                      out.push(buf.join(''));
                      return;
                  }
                  if (buf.length === 0 || buf[buf.length - 1] === '1') {
                      buf.push('0');
                      dfs();
                      buf.pop();
                  }
                  buf.push('1');
                  dfs();
                  buf.pop();
              };
              dfs();
              return out;
          };
        `,
        typescript: code`
          function validStrings(n: number): string[] {
              var out: string[] = [];
              var buf: string[] = [];
              function dfs(): void {
                  if (buf.length === n) {
                      out.push(buf.join(''));
                      return;
                  }
                  if (buf.length === 0 || buf[buf.length - 1] === '1') {
                      buf.push('0');
                      dfs();
                      buf.pop();
                  }
                  buf.push('1');
                  dfs();
                  buf.pop();
              }
              dfs();
              return out;
          }
        `,
        java: code`
          public static String[] validStrings(int n) {
              List<String> out = new ArrayList<>();
              binDfs(new char[n], 0, out);
              return out.toArray(new String[0]);
          }

          static void binDfs(char[] buf, int i, List<String> out) {
              if (i == buf.length) {
                  out.add(new String(buf));
                  return;
              }
              if (i == 0 || buf[i - 1] == '1') {
                  buf[i] = '0';
                  binDfs(buf, i + 1, out);
              }
              buf[i] = '1';
              binDfs(buf, i + 1, out);
          }
        `,
        cpp: code`
          void binDfs(string& buf, int n, vector<string>& out) {
              if ((int)buf.size() == n) {
                  out.push_back(buf);
                  return;
              }
              if (buf.empty() || buf.back() == '1') {
                  buf.push_back('0');
                  binDfs(buf, n, out);
                  buf.pop_back();
              }
              buf.push_back('1');
              binDfs(buf, n, out);
              buf.pop_back();
          }

          vector<string> validStrings(int n) {
              vector<string> out;
              string buf;
              binDfs(buf, n, out);
              return out;
          }
        `,
        c: code`
          static void binDfs(char* buf, int i, int n, char** out, int* count) {
              if (i == n) {
                  char* s = (char*)malloc(n + 1);
                  memcpy(s, buf, n);
                  s[n] = '\0';
                  out[(*count)++] = s;
                  return;
              }
              if (i == 0 || buf[i - 1] == '1') {
                  buf[i] = '0';
                  binDfs(buf, i + 1, n, out, count);
              }
              buf[i] = '1';
              binDfs(buf, i + 1, n, out, count);
          }

          char** validStrings(int n, int* returnSize) {
              int a = 1, b = 2;
              for (int i = 1; i < n; i++) { int c = a + b; a = b; b = c; }
              char** out = (char**)malloc(sizeof(char*) * b);
              char buf[24];
              int count = 0;
              binDfs(buf, 0, n, out, &count);
              *returnSize = count;
              return out;
          }
        `,
        csharp: code`
          public static string[] ValidStrings(int n)
          {
              var result = new List<string>();
              BinDfs(new char[n], 0, result);
              return result.ToArray();
          }

          static void BinDfs(char[] buf, int i, List<string> result)
          {
              if (i == buf.Length)
              {
                  result.Add(new string(buf));
                  return;
              }
              if (i == 0 || buf[i - 1] == '1')
              {
                  buf[i] = '0';
                  BinDfs(buf, i + 1, result);
              }
              buf[i] = '1';
              BinDfs(buf, i + 1, result);
          }
        `,
        go: code`
          func validStrings(n int) []string {
          	out := []string{}
          	buf := make([]byte, n)
          	var dfs func(i int)
          	dfs = func(i int) {
          		if i == n {
          			out = append(out, string(buf))
          			return
          		}
          		if i == 0 || buf[i-1] == '1' {
          			buf[i] = '0'
          			dfs(i + 1)
          		}
          		buf[i] = '1'
          		dfs(i + 1)
          	}
          	dfs(0)
          	return out
          }
        `,
        kotlin: code`
          fun validStrings(n: Int): Array<String> {
              val out = ArrayList<String>()
              val buf = CharArray(n)
              fun dfs(i: Int) {
                  if (i == n) {
                      out.add(String(buf))
                      return
                  }
                  if (i == 0 || buf[i - 1] == '1') {
                      buf[i] = '0'
                      dfs(i + 1)
                  }
                  buf[i] = '1'
                  dfs(i + 1)
              }
              dfs(0)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func validStrings(_ n: Int) -> [String] {
              var out = [String]()
              var buf = [UInt8](repeating: 49, count: n)
              func dfs(_ i: Int) {
                  if i == n {
                      out.append(String(decoding: buf, as: UTF8.self))
                      return
                  }
                  if i == 0 || buf[i - 1] == 49 {
                      buf[i] = 48
                      dfs(i + 1)
                  }
                  buf[i] = 49
                  dfs(i + 1)
              }
              dfs(0)
              return out
          }
        `,
        rust: code`
          fn bin_dfs(buf: &mut Vec<u8>, i: usize, out: &mut Vec<String>) {
              if i == buf.len() {
                  out.push(String::from_utf8(buf.clone()).unwrap());
                  return;
              }
              if i == 0 || buf[i - 1] == b'1' {
                  buf[i] = b'0';
                  bin_dfs(buf, i + 1, out);
              }
              buf[i] = b'1';
              bin_dfs(buf, i + 1, out);
          }

          fn validStrings(n: i32) -> Vec<String> {
              let mut buf = vec![b'1'; n as usize];
              let mut out: Vec<String> = Vec::new();
              bin_dfs(&mut buf, 0, &mut out);
              out
          }
        `,
        php: code`
          function validStrings($n) {
              $out = [];
              binDfs('', $n, $out);
              return $out;
          }

          function binDfs($prefix, $n, &$out) {
              $len = strlen($prefix);
              if ($len == $n) {
                  $out[] = $prefix;
                  return;
              }
              if ($len == 0 || $prefix[$len - 1] === '1') binDfs($prefix . '0', $n, $out);
              binDfs($prefix . '1', $n, $out);
          }
        `,
        ruby: code`
          def validStrings(n)
            out = []
            bin_dfs('', n, out)
            out
          end

          def bin_dfs(prefix, n, out)
            if prefix.length == n
              out << prefix
              return
            end
            bin_dfs(prefix + '0', n, out) if prefix.empty? || prefix[-1] == '1'
            bin_dfs(prefix + '1', n, out)
          end
        `,
      },
    };
  })(),

  // ── Permutation Sequence (LC 60) ────────────────────────────────
  (() => {
    const ref = (n: number, k: number) => {
      const fact = [1];
      for (let i = 1; i <= n; i++) fact.push(fact[i - 1] * i);
      const digits = Array.from({ length: n }, (_, i) => i + 1);
      let rem = k - 1;
      let out = "";
      for (let i = n; i >= 1; i--) {
        const idx = Math.floor(rem / fact[i - 1]);
        rem %= fact[i - 1];
        out += String(digits[idx]);
        digits.splice(idx, 1);
      }
      return out;
    };
    // Cross-check the factorial-base formula against plain enumeration for small n.
    for (let n = 1; n <= 6; n++) {
      const all: string[] = [];
      const walk = (prefix: string, rest: number[]) => {
        if (!rest.length) { all.push(prefix); return; }
        rest.forEach((v, i) => walk(prefix + v, rest.filter((_, j) => j !== i)));
      };
      walk("", Array.from({ length: n }, (_, i) => i + 1));
      all.forEach((p, i) => { if (ref(n, i + 1) !== p) throw new Error(`permutation-sequence ref n=${n} k=${i + 1}`); });
    }
    return {
      slug: "permutation-sequence",
      title: "Permutation Sequence",
      difficulty: "HARD" as const,
      tags: ["Math", "Recursion", "Amazon", "Microsoft", "Adobe"],
      signature: {
        funcName: "getPermutation",
        params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "The numbers `1, 2, ..., n` have `n!` orderings. Write each ordering as a string of digits and sort them; for `n = 3` the list is `\"123\"`, `\"132\"`, `\"213\"`, `\"231\"`, `\"312\"`, `\"321\"`.\n\n" +
        "Return the `k`-th string in that sorted list (counting from 1).",
        [
          { in: "n = 3, k = 3", out: "213" },
          { in: "n = 4, k = 9", out: "2314" },
          { in: "n = 3, k = 1", out: "123" },
        ],
        ["1 <= n <= 9", "1 <= k <= n!"]),
      hints: [
        "Generating permutations one by one costs up to 9! steps — instead, decide the answer digit by digit.",
        "Fixing the first digit leaves `(n - 1)!` orderings of the rest. So the first digit is determined by which block of `(n - 1)!` the index `k - 1` falls into.",
        "Repeat with the remaining digits and the remainder `(k - 1) mod (n - 1)!` — this is writing `k - 1` in the factorial number system.",
      ],
      editorial: explain({
        idea: "The sorted permutations come in blocks: all those starting with the smallest available digit, then the next, and so on, each block of size `(remaining - 1)!`. Dividing the zero-based index by that block size picks the next digit.",
        steps: [
          "Precompute factorials up to `n!` and keep the available digits `1..n` in increasing order.",
          "Let `r = k - 1`. For `i` from `n` down to 1: `idx = r / (i - 1)!`, `r = r % (i - 1)!`.",
          "Append the `idx`-th available digit and remove it from the list.",
          "Return the built string.",
        ],
        why: "Among the permutations of the remaining digits, the ones beginning with the `j`-th smallest digit occupy exactly positions `j · (i-1)!` to `(j+1) · (i-1)! - 1` in sorted order. So the quotient selects the right block and the remainder is the index inside it, recursively.",
        time: "O(n^2) (removing from the digit list)",
        space: "O(n)",
        pitfalls: [
          "Convert `k` to a zero-based index first; using `k` directly is off by one block at every boundary.",
          "Remove each chosen digit from the available list so it is not reused.",
          "The answer is a string of digits, not a number.",
        ],
      }),
      examples: [
        { input: "3\n3", expectedOutput: "213" },
        { input: "4\n9", expectedOutput: "2314" },
        { input: "3\n1", expectedOutput: "123" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        const r = rng();
        const k = r < 0.1 ? 1 : r < 0.2 ? f : ri(rng, 1, f);
        return { input: `${n}\n${k}`, expectedOutput: ref(n, k) };
      },
      solutions: {
        python: code`
          def getPermutation(n: int, k: int) -> str:
              fact = [1] * (n + 1)
              for i in range(1, n + 1):
                  fact[i] = fact[i - 1] * i
              digits = [str(i) for i in range(1, n + 1)]
              r = k - 1
              out = []
              for i in range(n, 0, -1):
                  idx = r // fact[i - 1]
                  r %= fact[i - 1]
                  out.append(digits.pop(idx))
              return ''.join(out)
        `,
        javascript: code`
          var getPermutation = function(n, k) {
              var fact = [1];
              for (var i = 1; i <= n; i++) fact.push(fact[i - 1] * i);
              var digits = [];
              for (var d = 1; d <= n; d++) digits.push(d);
              var r = k - 1;
              var out = '';
              for (var j = n; j >= 1; j--) {
                  var idx = Math.floor(r / fact[j - 1]);
                  r %= fact[j - 1];
                  out += digits[idx];
                  digits.splice(idx, 1);
              }
              return out;
          };
        `,
        typescript: code`
          function getPermutation(n: number, k: number): string {
              var fact: number[] = [1];
              for (var i = 1; i <= n; i++) fact.push(fact[i - 1] * i);
              var digits: number[] = [];
              for (var d = 1; d <= n; d++) digits.push(d);
              var r = k - 1;
              var out = '';
              for (var j = n; j >= 1; j--) {
                  var idx = Math.floor(r / fact[j - 1]);
                  r %= fact[j - 1];
                  out += digits[idx];
                  digits.splice(idx, 1);
              }
              return out;
          }
        `,
        java: code`
          public static String getPermutation(int n, int k) {
              int[] fact = new int[n + 1];
              fact[0] = 1;
              for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
              List<Integer> digits = new ArrayList<>();
              for (int d = 1; d <= n; d++) digits.add(d);
              int r = k - 1;
              StringBuilder sb = new StringBuilder();
              for (int i = n; i >= 1; i--) {
                  int idx = r / fact[i - 1];
                  r %= fact[i - 1];
                  sb.append(digits.remove(idx));
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string getPermutation(int n, int k) {
              vector<int> fact(n + 1, 1);
              for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
              string digits;
              for (int d = 1; d <= n; d++) digits.push_back((char)('0' + d));
              int r = k - 1;
              string out;
              for (int i = n; i >= 1; i--) {
                  int idx = r / fact[i - 1];
                  r %= fact[i - 1];
                  out.push_back(digits[idx]);
                  digits.erase(digits.begin() + idx);
              }
              return out;
          }
        `,
        c: code`
          char* getPermutation(int n, int k) {
              int fact[10];
              fact[0] = 1;
              for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
              char digits[10];
              int left = n;
              for (int d = 0; d < n; d++) digits[d] = (char)('1' + d);
              char* out = (char*)malloc(n + 1);
              int r = k - 1;
              for (int i = n; i >= 1; i--) {
                  int idx = r / fact[i - 1];
                  r %= fact[i - 1];
                  out[n - i] = digits[idx];
                  for (int t = idx; t < left - 1; t++) digits[t] = digits[t + 1];
                  left--;
              }
              out[n] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string GetPermutation(int n, int k)
          {
              int[] fact = new int[n + 1];
              fact[0] = 1;
              for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
              var digits = new List<int>();
              for (int d = 1; d <= n; d++) digits.Add(d);
              int r = k - 1;
              var sb = new System.Text.StringBuilder();
              for (int i = n; i >= 1; i--)
              {
                  int idx = r / fact[i - 1];
                  r %= fact[i - 1];
                  sb.Append(digits[idx]);
                  digits.RemoveAt(idx);
              }
              return sb.ToString();
          }
        `,
        go: code`
          func getPermutation(n int, k int) string {
          	fact := make([]int, n+1)
          	fact[0] = 1
          	for i := 1; i <= n; i++ {
          		fact[i] = fact[i-1] * i
          	}
          	digits := []byte{}
          	for d := 1; d <= n; d++ {
          		digits = append(digits, byte('0'+d))
          	}
          	r := k - 1
          	out := []byte{}
          	for i := n; i >= 1; i-- {
          		idx := r / fact[i-1]
          		r %= fact[i-1]
          		out = append(out, digits[idx])
          		digits = append(digits[:idx], digits[idx+1:]...)
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun getPermutation(n: Int, k: Int): String {
              val fact = IntArray(n + 1)
              fact[0] = 1
              for (i in 1..n) fact[i] = fact[i - 1] * i
              val digits = ArrayList<Int>()
              for (d in 1..n) digits.add(d)
              var r = k - 1
              val sb = StringBuilder()
              for (i in n downTo 1) {
                  val idx = r / fact[i - 1]
                  r %= fact[i - 1]
                  sb.append(digits[idx])
                  digits.removeAt(idx)
              }
              return sb.toString()
          }
        `,
        swift: code`
          func getPermutation(_ n: Int, _ k: Int) -> String {
              var fact = [Int](repeating: 1, count: n + 1)
              if n >= 1 {
                  for i in 1...n { fact[i] = fact[i - 1] * i }
              }
              var digits = Array(1...n)
              var r = k - 1
              var out = ""
              var i = n
              while i >= 1 {
                  let idx = r / fact[i - 1]
                  r %= fact[i - 1]
                  out += String(digits[idx])
                  digits.remove(at: idx)
                  i -= 1
              }
              return out
          }
        `,
        rust: code`
          fn getPermutation(n: i32, k: i32) -> String {
              let n = n as usize;
              let mut fact = vec![1usize; n + 1];
              for i in 1..=n {
                  fact[i] = fact[i - 1] * i;
              }
              let mut digits: Vec<u8> = (1..=n).map(|d| b'0' + d as u8).collect();
              let mut r = (k - 1) as usize;
              let mut out: Vec<u8> = Vec::new();
              for i in (1..=n).rev() {
                  let idx = r / fact[i - 1];
                  r %= fact[i - 1];
                  out.push(digits.remove(idx));
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function getPermutation($n, $k) {
              $fact = [1];
              for ($i = 1; $i <= $n; $i++) $fact[$i] = $fact[$i - 1] * $i;
              $digits = range(1, $n);
              $r = $k - 1;
              $out = '';
              for ($i = $n; $i >= 1; $i--) {
                  $idx = intdiv($r, $fact[$i - 1]);
                  $r %= $fact[$i - 1];
                  $out .= $digits[$idx];
                  array_splice($digits, $idx, 1);
              }
              return $out;
          }
        `,
        ruby: code`
          def getPermutation(n, k)
            fact = [1]
            (1..n).each { |i| fact << fact[-1] * i }
            digits = (1..n).to_a
            r = k - 1
            out = ''
            n.downto(1) do |i|
              idx = r / fact[i - 1]
              r %= fact[i - 1]
              out += digits.delete_at(idx).to_s
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Non-decreasing Subsequences (LC 491) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const seen = new Map<string, number[]>();
      for (let mask = 0; mask < 1 << nums.length; mask++) {
        const sub: number[] = [];
        let ok = true;
        for (let i = 0; i < nums.length && ok; i++) {
          if (!(mask & (1 << i))) continue;
          if (sub.length && nums[i] < sub[sub.length - 1]) ok = false;
          sub.push(nums[i]);
        }
        if (ok && sub.length >= 2) seen.set(sub.join(","), sub);
      }
      return [...seen.values()].sort(cmpList);
    };
    return {
      slug: "non-decreasing-subsequences",
      title: "Non-decreasing Subsequences",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Backtracking", "Bit Manipulation", "Amazon", "Yahoo"],
      signature: { funcName: "findSubsequences", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Return every **distinct** subsequence of `nums` that has at least two elements and is **non-decreasing** (each element is at least the one before it). A subsequence keeps the original order but may skip elements; two subsequences that read the same value by value count once, even if they come from different positions.\n\n" +
        "List the subsequences in **lexicographic** order: compare value by value from the left; when one is a prefix of the other, the shorter comes first.",
        [
          { in: "nums = [4,6,7,7]", out: "[[4,6],[4,6,7],[4,6,7,7],[4,7],[4,7,7],[6,7],[6,7,7],[7,7]]" },
          { in: "nums = [4,4,3,2,1]", out: "[[4,4]]" },
          { in: "nums = [3,-1,3,0]", out: "[[-1,0],[-1,3],[3,3]]" },
        ],
        ["1 <= nums.length <= 15", "-100 <= nums[i] <= 100"]),
      hints: [
        "Build subsequences by choosing the index of the next element, which must be later in the array and not smaller than the last chosen value.",
        "Duplicates appear when the same value is chosen at the same step from different positions. At each step, use each value at most once — its earliest remaining occurrence is always the best choice, because it leaves the most room afterwards.",
        "If, at each step, you try the candidate values in increasing order and record a subsequence before extending it, the results come out in lexicographic order with no sorting.",
      ],
      editorial: explain({
        idea: "Generate each distinct value sequence through its earliest-possible embedding: at every step choose a value (not an index), and take that value's first occurrence after the current position. Distinct choices give distinct sequences, so no hash set of results is needed.",
        steps: [
          "`dfs(pos, path)`: if `path` has at least two elements, record a copy.",
          "Scan `i` from `pos + 1` to the end; for each `nums[i]` that is at least the last value of `path` (or any value when `path` is empty), remember its first such index.",
          "For each remembered value in increasing order, append it, recurse with `pos` set to its first index, and remove it.",
          "Start with `dfs(-1, [])`.",
        ],
        why: "Any non-decreasing value sequence that occurs in `nums` also occurs when every element is matched as early as possible, and that greedy embedding is unique — so each distinct subsequence is produced exactly once. Recording before extending puts a prefix before its extensions, and increasing candidate order at every depth makes the whole output lexicographic.",
        time: "O(2^n · n) in the worst case",
        space: "O(n) recursion depth besides the output",
        pitfalls: [
          "Deduplicate per recursion level (or globally with a set); deduplicating only adjacent equal elements is wrong because the array is not sorted.",
          "Do not sort `nums` — the order of the original array defines which subsequences exist.",
          "Single elements are not answers; record only paths of length ≥ 2.",
        ],
      }),
      examples: [
        { input: "[4,6,7,7]", expectedOutput: "[[4,6],[4,6,7],[4,6,7,7],[4,7],[4,7,7],[6,7],[6,7,7],[7,7]]" },
        { input: "[4,4,3,2,1]", expectedOutput: "[[4,4]]" },
        { input: "[3,-1,3,0]", expectedOutput: "[[-1,0],[-1,3],[3,3]]" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const n = rng() < 0.04 ? ri(rng, 11, 15) : ri(rng, 1, 9);
          const span = pick(rng, [2, 4, 10, 100]);
          let nums = Array.from({ length: n }, () => ri(rng, -span, span));
          if (n > 9) {
            // Long arrays mostly descending, so the answer stays small.
            nums.sort((a, b) => b - a);
            for (let t = 0; t < 2; t++) { const i = ri(rng, 0, n - 2); [nums[i], nums[i + 1]] = [nums[i + 1], nums[i]]; }
          }
          nums = nums.map((v) => Math.max(-100, Math.min(100, v)));
          const out = ref(nums);
          if (out.length > 120) continue;
          return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(out) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def findSubsequences(nums: List[int]) -> List[List[int]]:
              n = len(nums)
              out = []
              path = []

              def dfs(pos):
                  if len(path) >= 2:
                      out.append(path[:])
                  first = {}
                  for i in range(pos + 1, n):
                      if path and nums[i] < path[-1]:
                          continue
                      if nums[i] not in first:
                          first[nums[i]] = i
                  for v in sorted(first):
                      path.append(v)
                      dfs(first[v])
                      path.pop()

              dfs(-1)
              return out
        `,
        javascript: code`
          var findSubsequences = function(nums) {
              var n = nums.length;
              var out = [];
              var path = [];
              var dfs = function(pos) {
                  if (path.length >= 2) out.push(path.slice());
                  var first = new Map();
                  for (var i = pos + 1; i < n; i++) {
                      if (path.length && nums[i] < path[path.length - 1]) continue;
                      if (!first.has(nums[i])) first.set(nums[i], i);
                  }
                  var vals = Array.from(first.keys()).sort(function(a, b) { return a - b; });
                  for (var t = 0; t < vals.length; t++) {
                      path.push(vals[t]);
                      dfs(first.get(vals[t]));
                      path.pop();
                  }
              };
              dfs(-1);
              return out;
          };
        `,
        typescript: code`
          function findSubsequences(nums: number[]): number[][] {
              var n = nums.length;
              var out: number[][] = [];
              var path: number[] = [];
              function dfs(pos: number): void {
                  if (path.length >= 2) out.push(path.slice());
                  var vals: number[] = [];
                  var idxs: number[] = [];
                  for (var i = pos + 1; i < n; i++) {
                      if (path.length > 0 && nums[i] < path[path.length - 1]) continue;
                      var seen = false;
                      for (var s = 0; s < vals.length; s++) if (vals[s] === nums[i]) { seen = true; break; }
                      if (seen) continue;
                      var p = vals.length;
                      vals.push(0);
                      idxs.push(0);
                      while (p > 0 && vals[p - 1] > nums[i]) { vals[p] = vals[p - 1]; idxs[p] = idxs[p - 1]; p--; }
                      vals[p] = nums[i];
                      idxs[p] = i;
                  }
                  for (var t = 0; t < vals.length; t++) {
                      path.push(vals[t]);
                      dfs(idxs[t]);
                      path.pop();
                  }
              }
              dfs(-1);
              return out;
          }
        `,
        java: code`
          public static int[][] findSubsequences(int[] nums) {
              List<int[]> out = new ArrayList<>();
              subseqDfs(nums, -1, new int[nums.length], 0, out);
              return out.toArray(new int[0][]);
          }

          static void subseqDfs(int[] nums, int pos, int[] path, int len, List<int[]> out) {
              if (len >= 2) out.add(Arrays.copyOf(path, len));
              TreeMap<Integer, Integer> first = new TreeMap<>();
              for (int i = pos + 1; i < nums.length; i++) {
                  if (len > 0 && nums[i] < path[len - 1]) continue;
                  first.putIfAbsent(nums[i], i);
              }
              for (Map.Entry<Integer, Integer> e : first.entrySet()) {
                  path[len] = e.getKey();
                  subseqDfs(nums, e.getValue(), path, len + 1, out);
              }
          }
        `,
        cpp: code`
          void subseqDfs(vector<int>& nums, int pos, vector<int>& path, vector<vector<int>>& out) {
              if (path.size() >= 2) out.push_back(path);
              map<int, int> first;
              for (int i = pos + 1; i < (int)nums.size(); i++) {
                  if (!path.empty() && nums[i] < path.back()) continue;
                  first.emplace(nums[i], i);
              }
              for (auto& e : first) {
                  path.push_back(e.first);
                  subseqDfs(nums, e.second, path, out);
                  path.pop_back();
              }
          }

          vector<vector<int>> findSubsequences(vector<int>& nums) {
              vector<vector<int>> out;
              vector<int> path;
              subseqDfs(nums, -1, path, out);
              return out;
          }
        `,
        c: code`
          typedef struct {
              int** rows;
              int* sizes;
              int count;
              int cap;
          } SubseqList;

          static void subseqPush(SubseqList* l, int* path, int len) {
              if (l->count == l->cap) {
                  l->cap *= 2;
                  l->rows = (int**)realloc(l->rows, sizeof(int*) * l->cap);
                  l->sizes = (int*)realloc(l->sizes, sizeof(int) * l->cap);
              }
              int* row = (int*)malloc(sizeof(int) * len);
              for (int i = 0; i < len; i++) row[i] = path[i];
              l->rows[l->count] = row;
              l->sizes[l->count] = len;
              l->count++;
          }

          static void subseqDfs(int* nums, int n, int pos, int* path, int len, SubseqList* l) {
              if (len >= 2) subseqPush(l, path, len);
              int vals[16], idxs[16], k = 0;
              for (int i = pos + 1; i < n; i++) {
                  if (len > 0 && nums[i] < path[len - 1]) continue;
                  bool seen = false;
                  for (int s = 0; s < k; s++) if (vals[s] == nums[i]) { seen = true; break; }
                  if (seen) continue;
                  int p = k++;
                  while (p > 0 && vals[p - 1] > nums[i]) { vals[p] = vals[p - 1]; idxs[p] = idxs[p - 1]; p--; }
                  vals[p] = nums[i];
                  idxs[p] = i;
              }
              for (int t = 0; t < k; t++) {
                  path[len] = vals[t];
                  subseqDfs(nums, n, idxs[t], path, len + 1, l);
              }
          }

          int** findSubsequences(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
              SubseqList l;
              l.cap = 16;
              l.count = 0;
              l.rows = (int**)malloc(sizeof(int*) * l.cap);
              l.sizes = (int*)malloc(sizeof(int) * l.cap);
              int path[16];
              subseqDfs(nums, numsSize, -1, path, 0, &l);
              *returnSize = l.count;
              *returnColumnSizes = l.sizes;
              return l.rows;
          }
        `,
        csharp: code`
          public static int[][] FindSubsequences(int[] nums)
          {
              var result = new List<int[]>();
              SubseqDfs(nums, -1, new List<int>(), result);
              return result.ToArray();
          }

          static void SubseqDfs(int[] nums, int pos, List<int> path, List<int[]> result)
          {
              if (path.Count >= 2) result.Add(path.ToArray());
              var first = new SortedDictionary<int, int>();
              for (int i = pos + 1; i < nums.Length; i++)
              {
                  if (path.Count > 0 && nums[i] < path[path.Count - 1]) continue;
                  if (!first.ContainsKey(nums[i])) first[nums[i]] = i;
              }
              foreach (var e in first)
              {
                  path.Add(e.Key);
                  SubseqDfs(nums, e.Value, path, result);
                  path.RemoveAt(path.Count - 1);
              }
          }
        `,
        go: code`
          func findSubsequences(nums []int) [][]int {
          	n := len(nums)
          	out := [][]int{}
          	path := []int{}
          	var dfs func(pos int)
          	dfs = func(pos int) {
          		if len(path) >= 2 {
          			row := make([]int, len(path))
          			copy(row, path)
          			out = append(out, row)
          		}
          		first := map[int]int{}
          		vals := []int{}
          		for i := pos + 1; i < n; i++ {
          			if len(path) > 0 && nums[i] < path[len(path)-1] {
          				continue
          			}
          			if _, ok := first[nums[i]]; !ok {
          				first[nums[i]] = i
          				vals = append(vals, nums[i])
          			}
          		}
          		sort.Ints(vals)
          		for _, v := range vals {
          			path = append(path, v)
          			dfs(first[v])
          			path = path[:len(path)-1]
          		}
          	}
          	dfs(-1)
          	return out
          }
        `,
        kotlin: code`
          fun findSubsequences(nums: IntArray): Array<IntArray> {
              val out = ArrayList<IntArray>()
              val path = ArrayList<Int>()
              fun dfs(pos: Int) {
                  if (path.size >= 2) out.add(path.toIntArray())
                  val first = java.util.TreeMap<Int, Int>()
                  for (i in pos + 1 until nums.size) {
                      if (path.isNotEmpty() && nums[i] < path[path.size - 1]) continue
                      if (!first.containsKey(nums[i])) first[nums[i]] = i
                  }
                  for ((v, idx) in first) {
                      path.add(v)
                      dfs(idx)
                      path.removeAt(path.size - 1)
                  }
              }
              dfs(-1)
              return out.toTypedArray()
          }
        `,
        swift: code`
          func findSubsequences(_ nums: [Int]) -> [[Int]] {
              let n = nums.count
              var out = [[Int]]()
              var path = [Int]()
              func dfs(_ pos: Int) {
                  if path.count >= 2 { out.append(path) }
                  var first = [Int: Int]()
                  var i = pos + 1
                  while i < n {
                      if !(path.count > 0 && nums[i] < path[path.count - 1]) && first[nums[i]] == nil {
                          first[nums[i]] = i
                      }
                      i += 1
                  }
                  for v in first.keys.sorted() {
                      path.append(v)
                      dfs(first[v]!)
                      path.removeLast()
                  }
              }
              dfs(-1)
              return out
          }
        `,
        rust: code`
          use std::collections::BTreeMap;

          fn subseq_dfs(nums: &Vec<i32>, start: usize, path: &mut Vec<i32>, out: &mut Vec<Vec<i32>>) {
              if path.len() >= 2 {
                  out.push(path.clone());
              }
              let mut first: BTreeMap<i32, usize> = BTreeMap::new();
              for i in start..nums.len() {
                  if !path.is_empty() && nums[i] < path[path.len() - 1] {
                      continue;
                  }
                  first.entry(nums[i]).or_insert(i);
              }
              for (&v, &idx) in first.iter() {
                  path.push(v);
                  subseq_dfs(nums, idx + 1, path, out);
                  path.pop();
              }
          }

          fn findSubsequences(nums: Vec<i32>) -> Vec<Vec<i32>> {
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut path: Vec<i32> = Vec::new();
              subseq_dfs(&nums, 0, &mut path, &mut out);
              out
          }
        `,
        php: code`
          function findSubsequences($nums) {
              $out = [];
              $path = [];
              subseqDfs($nums, -1, $path, $out);
              return $out;
          }

          function subseqDfs(&$nums, $pos, &$path, &$out) {
              $len = count($path);
              if ($len >= 2) $out[] = $path;
              $n = count($nums);
              $first = [];
              for ($i = $pos + 1; $i < $n; $i++) {
                  if ($len > 0 && $nums[$i] < $path[$len - 1]) continue;
                  if (!isset($first[$nums[$i]])) $first[$nums[$i]] = $i;
              }
              ksort($first);
              foreach ($first as $v => $idx) {
                  $path[] = $v;
                  subseqDfs($nums, $idx, $path, $out);
                  array_pop($path);
              }
          }
        `,
        ruby: code`
          def findSubsequences(nums)
            out = []
            subseq_dfs(nums, -1, [], out)
            out
          end

          def subseq_dfs(nums, pos, path, out)
            out << path.dup if path.length >= 2
            first = {}
            ((pos + 1)...nums.length).each do |i|
              next if !path.empty? && nums[i] < path[-1]
              first[nums[i]] = i unless first.key?(nums[i])
            end
            first.keys.sort.each do |v|
              path << v
              subseq_dfs(nums, first[v], path, out)
              path.pop
            end
          end
        `,
      },
    };
  })(),

  // ── Ambiguous Coordinates (LC 816) ──────────────────────────────
  (() => {
    const VALID = /^(0|[1-9][0-9]*)(\.[0-9]*[1-9])?$/;
    const ref = (s: string) => {
      const d = s.slice(1, -1);
      const forms = (x: string) => {
        const all = [x];
        for (let i = 1; i < x.length; i++) all.push(x.slice(0, i) + "." + x.slice(i));
        return all.filter((t) => VALID.test(t));
      };
      const out: string[] = [];
      for (let i = 1; i < d.length; i++) {
        for (const a of forms(d.slice(0, i))) for (const b of forms(d.slice(i))) out.push(`(${a}, ${b})`);
      }
      return out.sort(cmpStr);
    };
    return {
      slug: "ambiguous-coordinates",
      title: "Ambiguous Coordinates",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Enumeration", "Google", "Amazon"],
      signature: { funcName: "ambiguousCoordinates", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "A 2-D point was written as `\"(x, y)\"`, for example `\"(1, 3)\"` or `\"(2, 0.5)\"`. Then every comma, decimal point and space was erased, leaving `s` — for example `\"(13)\"` or `\"(205)\"`.\n\n" +
        "Return every point the original string could have been. A number in the original never had **extraneous digits**: no leading zeros (`\"00\"`, `\"01\"`, `\"001.5\"` are impossible), no trailing zeros after a decimal point (`\"1.0\"`, `\"0.50\"` are impossible), and a decimal point always had at least one digit on each side (`\".5\"` is impossible, `\"0.5\"` is fine).\n\n" +
        "Write each point as `\"(x, y)\"` — exactly one space after the comma — and return the list sorted in ascending **ASCII** order.",
        [
          { in: "s = \"(123)\"", out: "[\"(1, 2.3)\",\"(1, 23)\",\"(1.2, 3)\",\"(12, 3)\"]" },
          { in: "s = \"(0010)\"", out: "[\"(0.01, 0)\"]", note: "`\"0, 010\"` and `\"00, 10\"` have leading zeros; `\"0.010\"` has a trailing zero." },
          { in: "s = \"(100)\"", out: "[\"(10, 0)\"]" },
        ],
        ["4 <= s.length <= 12", "s[0] == '(' and s[s.length - 1] == ')'", "the other characters of s are digits"]),
      hints: [
        "First choose where the comma goes: every split of the digits into a non-empty left part and a non-empty right part.",
        "For one digit string, list its legal spellings separately: the string itself if it has no leading zero (or is just `\"0\"`), plus each way of inserting a decimal point whose integer part has no leading zero and whose fraction does not end in `0`.",
        "Combine every legal left spelling with every legal right spelling, then sort.",
      ],
      editorial: explain({
        idea: "The two coordinates are independent once the comma position is fixed, so the answer is a union over comma positions of (legal spellings of the left) × (legal spellings of the right).",
        steps: [
          "Strip the parentheses to get the digit string `d`.",
          "`spell(x)`: include `x` if `x == \"0\"` or `x[0] != '0'`. For each `i` from 1 to `len(x) - 1`, include `x[:i] + \".\" + x[i:]` when the integer part `x[:i]` is `\"0\"` or does not start with `0`, and the fraction `x[i:]` does not end with `0`.",
          "For each comma position `i`, add `\"(\" + a + \", \" + b + \")\"` for all `a` in `spell(d[:i])` and `b` in `spell(d[i:])`.",
          "Sort the strings by character code.",
        ],
        why: "A spelling is legal exactly when its integer part is canonical (no leading zero unless it is the single digit 0) and its fractional part, if present, is non-empty and does not end in 0 — the checks in `spell`. Every original point corresponds to one comma position and one spelling on each side, so the enumeration finds all of them once.",
        time: "O(n^4) — n comma positions, O(n^2) spelling pairs, O(n) to build each",
        space: "O(n^3) for the output",
        pitfalls: [
          "`\"0\"` alone is legal, but `\"00\"`, `\"0.0\"` and `\"1.0\"` are not.",
          "A part ending in `0` can still be an integer (`\"10\"`), just never a decimal.",
          "Keep the exact format `\"(x, y)\"` with one space after the comma.",
        ],
      }),
      examples: [
        { input: "\"(123)\"", expectedOutput: "[\"(1, 2.3)\",\"(1, 23)\",\"(1.2, 3)\",\"(12, 3)\"]" },
        { input: "\"(0010)\"", expectedOutput: "[\"(0.01, 0)\"]" },
        { input: "\"(100)\"", expectedOutput: "[\"(10, 0)\"]" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const len = pick(rng, [2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 10]);
        const zeroRate = pick(rng, [0, 0.2, 0.5]);
        let d = "";
        for (let i = 0; i < len; i++) d += String(rng() < zeroRate ? 0 : ri(rng, 0, 9));
        const s = `(${d})`;
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def ambiguousCoordinates(s: str) -> List[str]:
              d = s[1:-1]

              def spell(x):
                  res = []
                  if x == '0' or x[0] != '0':
                      res.append(x)
                  for i in range(1, len(x)):
                      left, right = x[:i], x[i:]
                      if (left == '0' or left[0] != '0') and right[-1] != '0':
                          res.append(left + '.' + right)
                  return res

              out = []
              for i in range(1, len(d)):
                  for a in spell(d[:i]):
                      for b in spell(d[i:]):
                          out.append('(' + a + ', ' + b + ')')
              out.sort()
              return out
        `,
        javascript: code`
          var ambiguousCoordinates = function(s) {
              var d = s.substring(1, s.length - 1);
              var spell = function(x) {
                  var res = [];
                  if (x === '0' || x.charAt(0) !== '0') res.push(x);
                  for (var i = 1; i < x.length; i++) {
                      var left = x.substring(0, i), right = x.substring(i);
                      if ((left === '0' || left.charAt(0) !== '0') && right.charAt(right.length - 1) !== '0') {
                          res.push(left + '.' + right);
                      }
                  }
                  return res;
              };
              var out = [];
              for (var i = 1; i < d.length; i++) {
                  var as = spell(d.substring(0, i));
                  var bs = spell(d.substring(i));
                  for (var a = 0; a < as.length; a++) {
                      for (var b = 0; b < bs.length; b++) out.push('(' + as[a] + ', ' + bs[b] + ')');
                  }
              }
              out.sort();
              return out;
          };
        `,
        typescript: code`
          function ambiguousCoordinates(s: string): string[] {
              var d = s.substring(1, s.length - 1);
              function spell(x: string): string[] {
                  var res: string[] = [];
                  if (x === '0' || x.charAt(0) !== '0') res.push(x);
                  for (var i = 1; i < x.length; i++) {
                      var left = x.substring(0, i), right = x.substring(i);
                      if ((left === '0' || left.charAt(0) !== '0') && right.charAt(right.length - 1) !== '0') {
                          res.push(left + '.' + right);
                      }
                  }
                  return res;
              }
              var out: string[] = [];
              for (var i = 1; i < d.length; i++) {
                  var as = spell(d.substring(0, i));
                  var bs = spell(d.substring(i));
                  for (var a = 0; a < as.length; a++) {
                      for (var b = 0; b < bs.length; b++) out.push('(' + as[a] + ', ' + bs[b] + ')');
                  }
              }
              out.sort();
              return out;
          }
        `,
        java: code`
          public static String[] ambiguousCoordinates(String s) {
              String d = s.substring(1, s.length() - 1);
              List<String> out = new ArrayList<>();
              for (int i = 1; i < d.length(); i++) {
                  for (String a : coordSpell(d.substring(0, i))) {
                      for (String b : coordSpell(d.substring(i))) out.add("(" + a + ", " + b + ")");
                  }
              }
              Collections.sort(out);
              return out.toArray(new String[0]);
          }

          static List<String> coordSpell(String x) {
              List<String> res = new ArrayList<>();
              if (x.equals("0") || x.charAt(0) != '0') res.add(x);
              for (int i = 1; i < x.length(); i++) {
                  String left = x.substring(0, i), right = x.substring(i);
                  if ((left.equals("0") || left.charAt(0) != '0') && right.charAt(right.length() - 1) != '0') {
                      res.add(left + "." + right);
                  }
              }
              return res;
          }
        `,
        cpp: code`
          vector<string> coordSpell(const string& x) {
              vector<string> res;
              if (x == "0" || x[0] != '0') res.push_back(x);
              for (int i = 1; i < (int)x.size(); i++) {
                  string left = x.substr(0, i), right = x.substr(i);
                  if ((left == "0" || left[0] != '0') && right.back() != '0') res.push_back(left + "." + right);
              }
              return res;
          }

          vector<string> ambiguousCoordinates(string s) {
              string d = s.substr(1, s.size() - 2);
              vector<string> out;
              for (int i = 1; i < (int)d.size(); i++) {
                  vector<string> as = coordSpell(d.substr(0, i));
                  vector<string> bs = coordSpell(d.substr(i));
                  for (auto& a : as) for (auto& b : bs) out.push_back("(" + a + ", " + b + ")");
              }
              sort(out.begin(), out.end());
              return out;
          }
        `,
        c: code`
          static int coordSpell(const char* x, int len, char** res) {
              int k = 0;
              if (len == 1 || x[0] != '0') {
                  char* t = (char*)malloc(len + 1);
                  memcpy(t, x, len);
                  t[len] = '\0';
                  res[k++] = t;
              }
              for (int i = 1; i < len; i++) {
                  if ((i == 1 || x[0] != '0') && x[len - 1] != '0') {
                      char* t = (char*)malloc(len + 2);
                      memcpy(t, x, i);
                      t[i] = '.';
                      memcpy(t + i + 1, x + i, len - i);
                      t[len + 1] = '\0';
                      res[k++] = t;
                  }
              }
              return k;
          }

          static int coordCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** ambiguousCoordinates(const char* s, int* returnSize) {
              int dl = (int)strlen(s) - 2;
              const char* d = s + 1;
              int cap = 64, count = 0;
              char** out = (char**)malloc(sizeof(char*) * cap);
              char* as[16];
              char* bs[16];
              for (int i = 1; i < dl; i++) {
                  int na = coordSpell(d, i, as);
                  int nb = coordSpell(d + i, dl - i, bs);
                  for (int a = 0; a < na; a++) {
                      for (int b = 0; b < nb; b++) {
                          if (count == cap) {
                              cap *= 2;
                              out = (char**)realloc(out, sizeof(char*) * cap);
                          }
                          int la = (int)strlen(as[a]), lb = (int)strlen(bs[b]);
                          char* t = (char*)malloc(la + lb + 5);
                          int p = 0;
                          t[p++] = '(';
                          memcpy(t + p, as[a], la);
                          p += la;
                          t[p++] = ',';
                          t[p++] = ' ';
                          memcpy(t + p, bs[b], lb);
                          p += lb;
                          t[p++] = ')';
                          t[p] = '\0';
                          out[count++] = t;
                      }
                  }
                  for (int a = 0; a < na; a++) free(as[a]);
                  for (int b = 0; b < nb; b++) free(bs[b]);
              }
              qsort(out, count, sizeof(char*), coordCmp);
              *returnSize = count;
              return out;
          }
        `,
        csharp: code`
          public static string[] AmbiguousCoordinates(string s)
          {
              string d = s.Substring(1, s.Length - 2);
              var result = new List<string>();
              for (int i = 1; i < d.Length; i++)
              {
                  foreach (string a in CoordSpell(d.Substring(0, i)))
                      foreach (string b in CoordSpell(d.Substring(i)))
                          result.Add("(" + a + ", " + b + ")");
              }
              result.Sort((x, y) => string.CompareOrdinal(x, y));
              return result.ToArray();
          }

          static List<string> CoordSpell(string x)
          {
              var res = new List<string>();
              if (x == "0" || x[0] != '0') res.Add(x);
              for (int i = 1; i < x.Length; i++)
              {
                  string left = x.Substring(0, i), right = x.Substring(i);
                  if ((left == "0" || left[0] != '0') && right[right.Length - 1] != '0') res.Add(left + "." + right);
              }
              return res;
          }
        `,
        go: code`
          func coordSpell(x string) []string {
          	res := []string{}
          	if x == "0" || x[0] != '0' {
          		res = append(res, x)
          	}
          	for i := 1; i < len(x); i++ {
          		left, right := x[:i], x[i:]
          		if (left == "0" || left[0] != '0') && right[len(right)-1] != '0' {
          			res = append(res, left+"."+right)
          		}
          	}
          	return res
          }

          func ambiguousCoordinates(s string) []string {
          	d := s[1 : len(s)-1]
          	out := []string{}
          	for i := 1; i < len(d); i++ {
          		for _, a := range coordSpell(d[:i]) {
          			for _, b := range coordSpell(d[i:]) {
          				out = append(out, "("+a+", "+b+")")
          			}
          		}
          	}
          	sort.Strings(out)
          	return out
          }
        `,
        kotlin: code`
          fun coordSpell(x: String): List<String> {
              val res = ArrayList<String>()
              if (x == "0" || x[0] != '0') res.add(x)
              for (i in 1 until x.length) {
                  val left = x.substring(0, i)
                  val right = x.substring(i)
                  if ((left == "0" || left[0] != '0') && right[right.length - 1] != '0') res.add(left + "." + right)
              }
              return res
          }

          fun ambiguousCoordinates(s: String): Array<String> {
              val d = s.substring(1, s.length - 1)
              val out = ArrayList<String>()
              for (i in 1 until d.length) {
                  for (a in coordSpell(d.substring(0, i))) {
                      for (b in coordSpell(d.substring(i))) out.add("(" + a + ", " + b + ")")
                  }
              }
              out.sort()
              return out.toTypedArray()
          }
        `,
        swift: code`
          func coordSpell(_ x: [Character]) -> [String] {
              var res = [String]()
              let whole = String(x)
              if whole == "0" || x[0] != "0" { res.append(whole) }
              if x.count > 1 {
                  for i in 1..<x.count {
                      let left = String(x[0..<i])
                      let right = String(x[i..<x.count])
                      if (left == "0" || x[0] != "0") && x[x.count - 1] != "0" {
                          res.append(left + "." + right)
                      }
                  }
              }
              return res
          }

          func ambiguousCoordinates(_ s: String) -> [String] {
              let chars = Array(s)
              let d = Array(chars[1..<(chars.count - 1)])
              var out = [String]()
              for i in 1..<d.count {
                  let lefts = coordSpell(Array(d[0..<i]))
                  let rights = coordSpell(Array(d[i..<d.count]))
                  for a in lefts {
                      for b in rights { out.append("(" + a + ", " + b + ")") }
                  }
              }
              out.sort { $0.utf8.lexicographicallyPrecedes($1.utf8) }
              return out
          }
        `,
        rust: code`
          fn coord_spell(x: &str) -> Vec<String> {
              let b = x.as_bytes();
              let n = b.len();
              let mut res: Vec<String> = Vec::new();
              if x == "0" || b[0] != b'0' {
                  res.push(x.to_string());
              }
              for i in 1..n {
                  let left = &x[..i];
                  let right = &x[i..];
                  if (left == "0" || b[0] != b'0') && b[n - 1] != b'0' {
                      res.push(format!("{}.{}", left, right));
                  }
              }
              res
          }

          fn ambiguousCoordinates(s: String) -> Vec<String> {
              let d = &s[1..s.len() - 1];
              let mut out: Vec<String> = Vec::new();
              for i in 1..d.len() {
                  let lefts = coord_spell(&d[..i]);
                  let rights = coord_spell(&d[i..]);
                  for a in lefts.iter() {
                      for b in rights.iter() {
                          out.push(format!("({}, {})", a, b));
                      }
                  }
              }
              out.sort();
              out
          }
        `,
        php: code`
          function ambiguousCoordinates($s) {
              $d = substr($s, 1, strlen($s) - 2);
              $dl = strlen($d);
              $out = [];
              for ($i = 1; $i < $dl; $i++) {
                  foreach (coordSpell(substr($d, 0, $i)) as $a) {
                      foreach (coordSpell(substr($d, $i)) as $b) $out[] = "(" . $a . ", " . $b . ")";
                  }
              }
              sort($out, SORT_STRING);
              return $out;
          }

          function coordSpell($x) {
              $res = [];
              $n = strlen($x);
              if ($x === "0" || $x[0] !== '0') $res[] = $x;
              for ($i = 1; $i < $n; $i++) {
                  $left = substr($x, 0, $i);
                  $right = substr($x, $i);
                  if (($left === "0" || $left[0] !== '0') && $right[strlen($right) - 1] !== '0') {
                      $res[] = $left . "." . $right;
                  }
              }
              return $res;
          }
        `,
        ruby: code`
          def ambiguousCoordinates(s)
            d = s[1...-1]
            out = []
            (1...d.length).each do |i|
              coord_spell(d[0...i]).each do |a|
                coord_spell(d[i..-1]).each { |b| out << "(" + a + ", " + b + ")" }
              end
            end
            out.sort
          end

          def coord_spell(x)
            res = []
            res << x if x == '0' || x[0] != '0'
            (1...x.length).each do |i|
              left = x[0...i]
              right = x[i..-1]
              res << left + '.' + right if (left == '0' || left[0] != '0') && right[-1] != '0'
            end
            res
          end
        `,
      },
    };
  })(),


  // ── Maximum Number of Achievable Transfer Requests (LC 1601) ────
  (() => {
    const ref = (n: number, requests: number[][]) => {
      let best = 0;
      for (let mask = 0; mask < 1 << requests.length; mask++) {
        const deg = new Array<number>(n).fill(0);
        let cnt = 0;
        for (let i = 0; i < requests.length; i++) {
          if (!(mask & (1 << i))) continue;
          deg[requests[i][0]]--;
          deg[requests[i][1]]++;
          cnt++;
        }
        if (cnt > best && deg.every((d) => d === 0)) best = cnt;
      }
      return best;
    };
    return {
      slug: "maximum-number-of-achievable-transfer-requests",
      title: "Maximum Number of Achievable Transfer Requests",
      difficulty: "HARD" as const,
      tags: ["Array", "Backtracking", "Bit Manipulation", "Enumeration", "Amazon", "Google"],
      signature: {
        funcName: "maximumRequests",
        params: [{ name: "n", type: "int" as const }, { name: "requests", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` buildings, numbered `0` to `n - 1`, and every building is full. Each `requests[i] = [from, to]` is an employee asking to move from building `from` to building `to` (possibly the same building).\n\n" +
        "You may approve any subset of the requests, but because the buildings are full, the approved set must leave every building's headcount unchanged: for each building, the number of approved employees leaving it equals the number of approved employees arriving.\n\n" +
        "Return the **maximum** number of requests you can approve.",
        [
          { in: "n = 5, requests = [[0,1],[1,0],[0,1],[1,2],[2,0],[3,4]]", out: "5", note: "Approve every request except `[3,4]`: buildings 0, 1 and 2 each lose and gain the same number of people." },
          { in: "n = 3, requests = [[0,0],[1,2],[2,1]]", out: "3" },
          { in: "n = 4, requests = [[0,3],[3,1],[1,2],[2,0]]", out: "4", note: "The four moves form one cycle." },
        ],
        ["1 <= n <= 20", "1 <= requests.length <= 16", "requests[i].length == 2", "0 <= from_i, to_i < n"]),
      hints: [
        "There are at most 16 requests, so every subset of them can be examined.",
        "For a chosen subset, track the net change of every building (−1 for each departure, +1 for each arrival). The subset is valid when every net change is 0.",
        "Backtrack request by request (take it or skip it), updating the net changes as you go, and stop exploring a branch once even taking every remaining request could not beat the best answer so far.",
      ],
      editorial: explain({
        idea: "With at most 16 requests, enumerate every subset — by backtracking over take/skip decisions with an incrementally maintained balance per building — and keep the largest balanced one.",
        steps: [
          "Keep `delta[b]` for each building, all zero at the start.",
          "`dfs(i, taken)`: if `i == len(requests)`, update the answer with `taken` when every `delta` is zero.",
          "If `taken + (remaining requests) <= best`, return early.",
          "Take request `i` (`delta[from]--`, `delta[to]++`, recurse with `taken + 1`, undo), then skip it (recurse with `taken`).",
        ],
        why: "A set of approved moves keeps every building full exactly when each building's departures equal its arrivals, i.e. all net changes are zero. The search inspects every subset that could still beat the current best, so it finds the maximum.",
        time: "O(2^m · n) for m requests",
        space: "O(n + m)",
        pitfalls: [
          "A request from a building to itself is always approvable — it never changes the balance.",
          "Checking only that the total balance is zero is not enough; every building must balance on its own.",
          "Skipping the bound is fine for correctness but much slower.",
        ],
      }),
      examples: [
        { input: "5\n[[0,1],[1,0],[0,1],[1,2],[2,0],[3,4]]", expectedOutput: "5" },
        { input: "3\n[[0,0],[1,2],[2,1]]", expectedOutput: "3" },
        { input: "4\n[[0,3],[3,1],[1,2],[2,0]]", expectedOutput: "4" },
      ],
      hiddenCount: 1200,
      gen: (rng: Rng) => {
        const n = rng() < 0.1 ? ri(rng, 7, 20) : ri(rng, 1, 6);
        const m = rng() < 0.1 ? ri(rng, 11, 12) : ri(rng, 1, 10);
        const requests = Array.from({ length: m }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        return { input: `${n}\n${fmtIntMat(requests)}`, expectedOutput: String(ref(n, requests)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumRequests(n: int, requests: List[List[int]]) -> int:
              m = len(requests)
              delta = [0] * n
              best = [0]

              def dfs(i, taken):
                  if i == m:
                      if taken > best[0] and all(d == 0 for d in delta):
                          best[0] = taken
                      return
                  if taken + (m - i) <= best[0]:
                      return
                  a, b = requests[i]
                  delta[a] -= 1
                  delta[b] += 1
                  dfs(i + 1, taken + 1)
                  delta[a] += 1
                  delta[b] -= 1
                  dfs(i + 1, taken)

              dfs(0, 0)
              return best[0]
        `,
        javascript: code`
          var maximumRequests = function(n, requests) {
              var m = requests.length;
              var delta = new Array(n).fill(0);
              var best = 0;
              var dfs = function(i, taken) {
                  if (i === m) {
                      if (taken > best) {
                          for (var b = 0; b < n; b++) if (delta[b] !== 0) return;
                          best = taken;
                      }
                      return;
                  }
                  if (taken + (m - i) <= best) return;
                  var from = requests[i][0], to = requests[i][1];
                  delta[from]--;
                  delta[to]++;
                  dfs(i + 1, taken + 1);
                  delta[from]++;
                  delta[to]--;
                  dfs(i + 1, taken);
              };
              dfs(0, 0);
              return best;
          };
        `,
        typescript: code`
          function maximumRequests(n: number, requests: number[][]): number {
              var m = requests.length;
              var delta: number[] = [];
              for (var z = 0; z < n; z++) delta.push(0);
              var best = 0;
              function dfs(i: number, taken: number): void {
                  if (i === m) {
                      if (taken > best) {
                          for (var b = 0; b < n; b++) if (delta[b] !== 0) return;
                          best = taken;
                      }
                      return;
                  }
                  if (taken + (m - i) <= best) return;
                  var from = requests[i][0], to = requests[i][1];
                  delta[from]--;
                  delta[to]++;
                  dfs(i + 1, taken + 1);
                  delta[from]++;
                  delta[to]--;
                  dfs(i + 1, taken);
              }
              dfs(0, 0);
              return best;
          }
        `,
        java: code`
          static int transferBest;

          public static int maximumRequests(int n, int[][] requests) {
              transferBest = 0;
              transferDfs(requests, new int[n], 0, 0);
              return transferBest;
          }

          static void transferDfs(int[][] req, int[] delta, int i, int taken) {
              if (i == req.length) {
                  if (taken > transferBest) {
                      for (int d : delta) if (d != 0) return;
                      transferBest = taken;
                  }
                  return;
              }
              if (taken + (req.length - i) <= transferBest) return;
              delta[req[i][0]]--;
              delta[req[i][1]]++;
              transferDfs(req, delta, i + 1, taken + 1);
              delta[req[i][0]]++;
              delta[req[i][1]]--;
              transferDfs(req, delta, i + 1, taken);
          }
        `,
        cpp: code`
          void transferDfs(vector<vector<int>>& req, vector<int>& delta, int i, int taken, int& best) {
              if (i == (int)req.size()) {
                  if (taken > best) {
                      for (int d : delta) if (d != 0) return;
                      best = taken;
                  }
                  return;
              }
              if (taken + ((int)req.size() - i) <= best) return;
              delta[req[i][0]]--;
              delta[req[i][1]]++;
              transferDfs(req, delta, i + 1, taken + 1, best);
              delta[req[i][0]]++;
              delta[req[i][1]]--;
              transferDfs(req, delta, i + 1, taken, best);
          }

          int maximumRequests(int n, vector<vector<int>>& requests) {
              vector<int> delta(n, 0);
              int best = 0;
              transferDfs(requests, delta, 0, 0, best);
              return best;
          }
        `,
        c: code`
          static void transferDfs(int** req, int m, int* delta, int n, int i, int taken, int* best) {
              if (i == m) {
                  if (taken > *best) {
                      for (int b = 0; b < n; b++) if (delta[b] != 0) return;
                      *best = taken;
                  }
                  return;
              }
              if (taken + (m - i) <= *best) return;
              delta[req[i][0]]--;
              delta[req[i][1]]++;
              transferDfs(req, m, delta, n, i + 1, taken + 1, best);
              delta[req[i][0]]++;
              delta[req[i][1]]--;
              transferDfs(req, m, delta, n, i + 1, taken, best);
          }

          int maximumRequests(int n, int** requests, int requestsSize, int* requestsColSize) {
              int delta[20];
              for (int b = 0; b < n; b++) delta[b] = 0;
              int best = 0;
              transferDfs(requests, requestsSize, delta, n, 0, 0, &best);
              return best;
          }
        `,
        csharp: code`
          static int transferBest;

          public static int MaximumRequests(int n, int[][] requests)
          {
              transferBest = 0;
              TransferDfs(requests, new int[n], 0, 0);
              return transferBest;
          }

          static void TransferDfs(int[][] req, int[] delta, int i, int taken)
          {
              if (i == req.Length)
              {
                  if (taken > transferBest)
                  {
                      foreach (int d in delta) if (d != 0) return;
                      transferBest = taken;
                  }
                  return;
              }
              if (taken + (req.Length - i) <= transferBest) return;
              delta[req[i][0]]--;
              delta[req[i][1]]++;
              TransferDfs(req, delta, i + 1, taken + 1);
              delta[req[i][0]]++;
              delta[req[i][1]]--;
              TransferDfs(req, delta, i + 1, taken);
          }
        `,
        go: code`
          func maximumRequests(n int, requests [][]int) int {
          	m := len(requests)
          	delta := make([]int, n)
          	best := 0
          	var dfs func(i, taken int)
          	dfs = func(i, taken int) {
          		if i == m {
          			if taken > best {
          				for _, d := range delta {
          					if d != 0 {
          						return
          					}
          				}
          				best = taken
          			}
          			return
          		}
          		if taken+(m-i) <= best {
          			return
          		}
          		from, to := requests[i][0], requests[i][1]
          		delta[from]--
          		delta[to]++
          		dfs(i+1, taken+1)
          		delta[from]++
          		delta[to]--
          		dfs(i+1, taken)
          	}
          	dfs(0, 0)
          	return best
          }
        `,
        kotlin: code`
          fun maximumRequests(n: Int, requests: Array<IntArray>): Int {
              val m = requests.size
              val delta = IntArray(n)
              var best = 0
              fun dfs(i: Int, taken: Int) {
                  if (i == m) {
                      if (taken > best && delta.all { it == 0 }) best = taken
                      return
                  }
                  if (taken + (m - i) <= best) return
                  val from = requests[i][0]
                  val to = requests[i][1]
                  delta[from]--
                  delta[to]++
                  dfs(i + 1, taken + 1)
                  delta[from]++
                  delta[to]--
                  dfs(i + 1, taken)
              }
              dfs(0, 0)
              return best
          }
        `,
        swift: code`
          func maximumRequests(_ n: Int, _ requests: [[Int]]) -> Int {
              let m = requests.count
              var delta = [Int](repeating: 0, count: n)
              var best = 0
              func dfs(_ i: Int, _ taken: Int) {
                  if i == m {
                      if taken > best && delta.allSatisfy({ $0 == 0 }) { best = taken }
                      return
                  }
                  if taken + (m - i) <= best { return }
                  let from = requests[i][0]
                  let to = requests[i][1]
                  delta[from] -= 1
                  delta[to] += 1
                  dfs(i + 1, taken + 1)
                  delta[from] += 1
                  delta[to] -= 1
                  dfs(i + 1, taken)
              }
              dfs(0, 0)
              return best
          }
        `,
        rust: code`
          fn transfer_dfs(req: &Vec<Vec<i32>>, delta: &mut Vec<i32>, i: usize, taken: i32, best: &mut i32) {
              if i == req.len() {
                  if taken > *best && delta.iter().all(|&d| d == 0) {
                      *best = taken;
                  }
                  return;
              }
              if taken + (req.len() - i) as i32 <= *best {
                  return;
              }
              let from = req[i][0] as usize;
              let to = req[i][1] as usize;
              delta[from] -= 1;
              delta[to] += 1;
              transfer_dfs(req, delta, i + 1, taken + 1, best);
              delta[from] += 1;
              delta[to] -= 1;
              transfer_dfs(req, delta, i + 1, taken, best);
          }

          fn maximumRequests(n: i32, requests: Vec<Vec<i32>>) -> i32 {
              let mut delta = vec![0i32; n as usize];
              let mut best = 0;
              transfer_dfs(&requests, &mut delta, 0, 0, &mut best);
              best
          }
        `,
        php: code`
          function maximumRequests($n, $requests) {
              $delta = array_fill(0, $n, 0);
              $best = 0;
              transferDfs($requests, $delta, 0, 0, $best);
              return $best;
          }

          function transferDfs(&$req, &$delta, $i, $taken, &$best) {
              $m = count($req);
              if ($i == $m) {
                  if ($taken > $best) {
                      foreach ($delta as $d) if ($d != 0) return;
                      $best = $taken;
                  }
                  return;
              }
              if ($taken + ($m - $i) <= $best) return;
              $from = $req[$i][0];
              $to = $req[$i][1];
              $delta[$from]--;
              $delta[$to]++;
              transferDfs($req, $delta, $i + 1, $taken + 1, $best);
              $delta[$from]++;
              $delta[$to]--;
              transferDfs($req, $delta, $i + 1, $taken, $best);
          }
        `,
        ruby: code`
          def maximumRequests(n, requests)
            delta = Array.new(n, 0)
            best = [0]
            transfer_dfs(requests, delta, 0, 0, best)
            best[0]
          end

          def transfer_dfs(req, delta, i, taken, best)
            m = req.length
            if i == m
              best[0] = taken if taken > best[0] && delta.all? { |d| d == 0 }
              return
            end
            return if taken + (m - i) <= best[0]
            from = req[i][0]
            to = req[i][1]
            delta[from] -= 1
            delta[to] += 1
            transfer_dfs(req, delta, i + 1, taken + 1, best)
            delta[from] += 1
            delta[to] -= 1
            transfer_dfs(req, delta, i + 1, taken, best)
          end
        `,
      },
    };
  })(),

  // ── Closest Subsequence Sum (LC 1755) ───────────────────────────
  (() => {
    const ref = (nums: number[], goal: number) => {
      // Every subset sum, built incrementally (exact: |sums| <= 4e8).
      let sums = [0];
      for (const v of nums) sums = sums.concat(sums.map((s) => s + v));
      let best = Infinity;
      for (const s of sums) best = Math.min(best, Math.abs(s - goal));
      return best;
    };
    return {
      slug: "closest-subsequence-sum",
      title: "Closest Subsequence Sum",
      difficulty: "HARD" as const,
      tags: ["Array", "Two Pointers", "Bitmask", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "minAbsDifference",
        params: [{ name: "nums", type: "int[]" as const }, { name: "goal", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Choose a subsequence of `nums` (any subset of its elements — possibly none, possibly all) so that its sum is as close as possible to `goal`. The empty subsequence has sum 0.\n\n" +
        "Return the minimum possible value of `abs(sum - goal)`.",
        [
          { in: "nums = [5,-7,3,5], goal = 6", out: "0", note: "The whole array sums to 6." },
          { in: "nums = [7,-9,15,-2], goal = -5", out: "1", note: "`[7,-9,-2]` sums to -4." },
          { in: "nums = [1,2,3], goal = -7", out: "7", note: "Every element is positive, so the empty subsequence (sum 0) is closest." },
        ],
        ["1 <= nums.length <= 40", "-10^7 <= nums[i] <= 10^7", "-10^9 <= goal <= 10^9"]),
      hints: [
        "2^40 subsets is far too many, but 2^20 is fine. Split the array into two halves.",
        "List every subset sum of the left half and of the right half. A subsequence of the whole array is a left subset plus a right subset.",
        "Sort the right half's sums. For each left sum `s`, binary-search the right sums for the values just below and just above `goal - s`.",
      ],
      editorial: explain({
        idea: "Meet in the middle: enumerate the subset sums of each half separately, then pair them up with a sorted search instead of trying all 2^n combinations.",
        steps: [
          "Split `nums` into halves `A` and `B`.",
          "Generate all subset sums of `A` (`L`) and of `B` (`R`) by doubling a list: start with `[0]`, and for each element append every existing sum plus that element.",
          "Sort `R`. For each `s` in `L`, find the first `r` in `R` with `r >= goal - s`; check both it and its predecessor, updating `best = min(best, |s + r - goal|)`.",
          "Return `best` (stop early if it reaches 0).",
        ],
        why: "Every subsequence splits uniquely into its part in `A` and its part in `B`, so the candidate sums are exactly `s + r` with `s ∈ L`, `r ∈ R`. For a fixed `s`, the best `r` is the one closest to `goal - s`, which in sorted order is one of the two neighbours of the insertion point.",
        time: "O(2^(n/2) · n)",
        space: "O(2^(n/2))",
        pitfalls: [
          "Do not forget the empty subsequence: both half-lists must contain 0.",
          "Sums reach ±4 · 10^8 and the difference to `goal` up to 1.4 · 10^9 — it still fits in 32 bits, but use 64-bit to be safe.",
          "A DP over sums is hopeless here: the values span ±4 · 10^8.",
        ],
      }),
      examples: [
        { input: "[5,-7,3,5]\n6", expectedOutput: "0" },
        { input: "[7,-9,15,-2]\n-5", expectedOutput: "1" },
        { input: "[1,2,3]\n-7", expectedOutput: "7" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? ri(rng, 17, 18) : ri(rng, 1, 16);
        const big = rng() < 0.4;
        const nums = Array.from({ length: n }, () => (big ? ri(rng, -10000000, 10000000) : ri(rng, -50, 50)));
        let goal: number;
        const r = rng();
        if (r < 0.3) {
          let s = 0;
          for (const v of nums) if (rng() < 0.5) s += v;
          goal = s + ri(rng, -3, 3);
        } else if (r < 0.8) goal = big ? ri(rng, -200000000, 200000000) : ri(rng, -400, 400);
        else goal = ri(rng, -1000000000, 1000000000);
        return { input: `${fmtIntArr(nums)}\n${goal}`, expectedOutput: String(ref(nums, goal)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_left

          def minAbsDifference(nums: List[int], goal: int) -> int:
              half = len(nums) // 2

              def sums(arr):
                  res = [0]
                  for v in arr:
                      res += [s + v for s in res]
                  return res

              left = sums(nums[:half])
              right = sorted(sums(nums[half:]))
              best = abs(goal)
              for s in left:
                  i = bisect_left(right, goal - s)
                  if i < len(right):
                      best = min(best, abs(s + right[i] - goal))
                  if i > 0:
                      best = min(best, abs(s + right[i - 1] - goal))
                  if best == 0:
                      return 0
              return best
        `,
        javascript: code`
          var minAbsDifference = function(nums, goal) {
              var half = nums.length >> 1;
              var sums = function(lo, hi) {
                  var res = [0];
                  for (var i = lo; i < hi; i++) {
                      var len = res.length;
                      for (var j = 0; j < len; j++) res.push(res[j] + nums[i]);
                  }
                  return res;
              };
              var left = sums(0, half);
              var right = sums(half, nums.length).sort(function(a, b) { return a - b; });
              var best = Math.abs(goal);
              for (var t = 0; t < left.length && best > 0; t++) {
                  var need = goal - left[t];
                  var lo = 0, hi = right.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (right[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < right.length) best = Math.min(best, Math.abs(left[t] + right[lo] - goal));
                  if (lo > 0) best = Math.min(best, Math.abs(left[t] + right[lo - 1] - goal));
              }
              return best;
          };
        `,
        typescript: code`
          function minAbsDifference(nums: number[], goal: number): number {
              var half = nums.length >> 1;
              function sums(lo: number, hi: number): number[] {
                  var res: number[] = [0];
                  for (var i = lo; i < hi; i++) {
                      var len = res.length;
                      for (var j = 0; j < len; j++) res.push(res[j] + nums[i]);
                  }
                  return res;
              }
              var left = sums(0, half);
              var right = sums(half, nums.length).sort(function(a, b) { return a - b; });
              var best = Math.abs(goal);
              for (var t = 0; t < left.length && best > 0; t++) {
                  var need = goal - left[t];
                  var lo = 0, hi = right.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (right[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < right.length) best = Math.min(best, Math.abs(left[t] + right[lo] - goal));
                  if (lo > 0) best = Math.min(best, Math.abs(left[t] + right[lo - 1] - goal));
              }
              return best;
          }
        `,
        java: code`
          public static int minAbsDifference(int[] nums, int goal) {
              int half = nums.length / 2;
              long[] left = subsetSums(nums, 0, half);
              long[] right = subsetSums(nums, half, nums.length);
              Arrays.sort(right);
              long best = Math.abs((long) goal);
              for (long s : left) {
                  long need = goal - s;
                  int lo = 0, hi = right.length;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (right[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < right.length) best = Math.min(best, Math.abs(s + right[lo] - goal));
                  if (lo > 0) best = Math.min(best, Math.abs(s + right[lo - 1] - goal));
                  if (best == 0) break;
              }
              return (int) best;
          }

          static long[] subsetSums(int[] nums, int lo, int hi) {
              long[] res = new long[1 << (hi - lo)];
              int len = 1;
              for (int i = lo; i < hi; i++) {
                  for (int j = 0; j < len; j++) res[len + j] = res[j] + nums[i];
                  len *= 2;
              }
              return res;
          }
        `,
        cpp: code`
          vector<long long> subsetSums(vector<int>& nums, int lo, int hi) {
              vector<long long> res(1, 0);
              for (int i = lo; i < hi; i++) {
                  int len = res.size();
                  for (int j = 0; j < len; j++) res.push_back(res[j] + nums[i]);
              }
              return res;
          }

          int minAbsDifference(vector<int>& nums, int goal) {
              int half = nums.size() / 2;
              vector<long long> left = subsetSums(nums, 0, half);
              vector<long long> right = subsetSums(nums, half, nums.size());
              sort(right.begin(), right.end());
              long long best = llabs((long long)goal);
              for (long long s : left) {
                  long long need = goal - s;
                  auto it = lower_bound(right.begin(), right.end(), need);
                  if (it != right.end()) best = min(best, llabs(s + *it - goal));
                  if (it != right.begin()) best = min(best, llabs(s + *(it - 1) - goal));
                  if (best == 0) break;
              }
              return (int)best;
          }
        `,
        c: code`
          static int closestCmp(const void* x, const void* y) {
              long long a = *(const long long*)x, b = *(const long long*)y;
              return (a > b) - (a < b);
          }

          static long long* closestSums(int* nums, int lo, int hi, int* outLen) {
              int total = 1 << (hi - lo);
              long long* res = (long long*)malloc(sizeof(long long) * total);
              res[0] = 0;
              int len = 1;
              for (int i = lo; i < hi; i++) {
                  for (int j = 0; j < len; j++) res[len + j] = res[j] + nums[i];
                  len *= 2;
              }
              *outLen = len;
              return res;
          }

          static long long closestAbs(long long x) {
              return x < 0 ? -x : x;
          }

          int minAbsDifference(int* nums, int numsSize, int goal) {
              int half = numsSize / 2;
              int ln, rn;
              long long* left = closestSums(nums, 0, half, &ln);
              long long* right = closestSums(nums, half, numsSize, &rn);
              qsort(right, rn, sizeof(long long), closestCmp);
              long long best = closestAbs((long long)goal);
              for (int t = 0; t < ln && best > 0; t++) {
                  long long need = (long long)goal - left[t];
                  int lo = 0, hi = rn;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (right[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < rn) {
                      long long d = closestAbs(left[t] + right[lo] - goal);
                      if (d < best) best = d;
                  }
                  if (lo > 0) {
                      long long d = closestAbs(left[t] + right[lo - 1] - goal);
                      if (d < best) best = d;
                  }
              }
              free(left);
              free(right);
              return (int)best;
          }
        `,
        csharp: code`
          public static int MinAbsDifference(int[] nums, int goal)
          {
              int half = nums.Length / 2;
              long[] left = SubsetSums(nums, 0, half);
              long[] right = SubsetSums(nums, half, nums.Length);
              Array.Sort(right);
              long best = Math.Abs((long)goal);
              foreach (long s in left)
              {
                  long need = goal - s;
                  int lo = 0, hi = right.Length;
                  while (lo < hi)
                  {
                      int mid = (lo + hi) / 2;
                      if (right[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < right.Length) best = Math.Min(best, Math.Abs(s + right[lo] - goal));
                  if (lo > 0) best = Math.Min(best, Math.Abs(s + right[lo - 1] - goal));
                  if (best == 0) break;
              }
              return (int)best;
          }

          static long[] SubsetSums(int[] nums, int lo, int hi)
          {
              long[] res = new long[1 << (hi - lo)];
              int len = 1;
              for (int i = lo; i < hi; i++)
              {
                  for (int j = 0; j < len; j++) res[len + j] = res[j] + nums[i];
                  len *= 2;
              }
              return res;
          }
        `,
        go: code`
          func closestSums(nums []int) []int {
          	res := []int{0}
          	for _, v := range nums {
          		l := len(res)
          		for j := 0; j < l; j++ {
          			res = append(res, res[j]+v)
          		}
          	}
          	return res
          }

          func closestAbs(x int) int {
          	if x < 0 {
          		return -x
          	}
          	return x
          }

          func minAbsDifference(nums []int, goal int) int {
          	half := len(nums) / 2
          	left := closestSums(nums[:half])
          	right := closestSums(nums[half:])
          	sort.Ints(right)
          	best := closestAbs(goal)
          	for _, s := range left {
          		need := goal - s
          		lo := sort.SearchInts(right, need)
          		if lo < len(right) && closestAbs(s+right[lo]-goal) < best {
          			best = closestAbs(s + right[lo] - goal)
          		}
          		if lo > 0 && closestAbs(s+right[lo-1]-goal) < best {
          			best = closestAbs(s + right[lo-1] - goal)
          		}
          		if best == 0 {
          			break
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun closestSums(nums: IntArray, lo: Int, hi: Int): LongArray {
              val res = LongArray(1 shl (hi - lo))
              var len = 1
              for (i in lo until hi) {
                  for (j in 0 until len) res[len + j] = res[j] + nums[i]
                  len *= 2
              }
              return res
          }

          fun minAbsDifference(nums: IntArray, goal: Int): Int {
              val half = nums.size / 2
              val left = closestSums(nums, 0, half)
              val right = closestSums(nums, half, nums.size)
              right.sort()
              var best = Math.abs(goal.toLong())
              for (s in left) {
                  val need = goal - s
                  var lo = 0
                  var hi = right.size
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (right[mid] < need) lo = mid + 1 else hi = mid
                  }
                  if (lo < right.size) best = minOf(best, Math.abs(s + right[lo] - goal))
                  if (lo > 0) best = minOf(best, Math.abs(s + right[lo - 1] - goal))
                  if (best == 0L) break
              }
              return best.toInt()
          }
        `,
        swift: code`
          func closestSums(_ arr: ArraySlice<Int>) -> [Int] {
              var res = [0]
              for v in arr {
                  let len = res.count
                  for j in 0..<len { res.append(res[j] + v) }
              }
              return res
          }

          func minAbsDifference(_ nums: [Int], _ goal: Int) -> Int {
              let half = nums.count / 2
              let left = closestSums(nums[0..<half])
              let right = closestSums(nums[half..<nums.count]).sorted()
              var best = abs(goal)
              for s in left {
                  let need = goal - s
                  var lo = 0
                  var hi = right.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if right[mid] < need { lo = mid + 1 } else { hi = mid }
                  }
                  if lo < right.count { best = min(best, abs(s + right[lo] - goal)) }
                  if lo > 0 { best = min(best, abs(s + right[lo - 1] - goal)) }
                  if best == 0 { break }
              }
              return best
          }
        `,
        rust: code`
          fn closest_sums(arr: &[i32]) -> Vec<i64> {
              let mut res: Vec<i64> = vec![0];
              for &v in arr.iter() {
                  let len = res.len();
                  for j in 0..len {
                      let s = res[j] + v as i64;
                      res.push(s);
                  }
              }
              res
          }

          fn minAbsDifference(nums: Vec<i32>, goal: i32) -> i32 {
              let half = nums.len() / 2;
              let left = closest_sums(&nums[..half]);
              let mut right = closest_sums(&nums[half..]);
              right.sort();
              let goal = goal as i64;
              let mut best = goal.abs();
              for &s in left.iter() {
                  let need = goal - s;
                  let mut lo = 0usize;
                  let mut hi = right.len();
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if right[mid] < need {
                          lo = mid + 1;
                      } else {
                          hi = mid;
                      }
                  }
                  if lo < right.len() {
                      best = best.min((s + right[lo] - goal).abs());
                  }
                  if lo > 0 {
                      best = best.min((s + right[lo - 1] - goal).abs());
                  }
                  if best == 0 {
                      break;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function minAbsDifference($nums, $goal) {
              $half = intdiv(count($nums), 2);
              $left = closestSums(array_slice($nums, 0, $half));
              $right = closestSums(array_slice($nums, $half));
              sort($right);
              $rn = count($right);
              $best = abs($goal);
              foreach ($left as $s) {
                  $need = $goal - $s;
                  $lo = 0;
                  $hi = $rn;
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($right[$mid] < $need) $lo = $mid + 1; else $hi = $mid;
                  }
                  if ($lo < $rn) $best = min($best, abs($s + $right[$lo] - $goal));
                  if ($lo > 0) $best = min($best, abs($s + $right[$lo - 1] - $goal));
                  if ($best == 0) break;
              }
              return $best;
          }

          function closestSums($arr) {
              $res = [0];
              foreach ($arr as $v) {
                  $len = count($res);
                  for ($j = 0; $j < $len; $j++) $res[] = $res[$j] + $v;
              }
              return $res;
          }
        `,
        ruby: code`
          def minAbsDifference(nums, goal)
            half = nums.length / 2
            left = closest_sums(nums[0...half])
            right = closest_sums(nums[half..-1]).sort
            best = goal.abs
            left.each do |s|
              need = goal - s
              lo = right.bsearch_index { |x| x >= need } || right.length
              best = [best, (s + right[lo] - goal).abs].min if lo < right.length
              best = [best, (s + right[lo - 1] - goal).abs].min if lo > 0
              return 0 if best == 0
            end
            best
          end

          def closest_sums(arr)
            res = [0]
            arr.each do |v|
              res += res.map { |s| s + v }
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Number of Squareful Arrays (LC 996) ─────────────────────────
  (() => {
    const isSq = (x: number) => {
      const r = Math.round(Math.sqrt(x));
      return r * r === x;
    };
    /** Independent check: count Hamiltonian paths over indices, divide out equal values. */
    const ref = (nums: number[]) => {
      const n = nums.length;
      const dp: number[][] = Array.from({ length: 1 << n }, () => new Array<number>(n).fill(0));
      for (let i = 0; i < n; i++) dp[1 << i][i] = 1;
      for (let mask = 1; mask < 1 << n; mask++) {
        for (let last = 0; last < n; last++) {
          const w = dp[mask][last];
          if (!w) continue;
          for (let nx = 0; nx < n; nx++) {
            if (mask & (1 << nx)) continue;
            if (!isSq(nums[last] + nums[nx])) continue;
            dp[mask | (1 << nx)][nx] += w;
          }
        }
      }
      let total = 0;
      for (let i = 0; i < n; i++) total += dp[(1 << n) - 1][i];
      const cnt = new Map<number, number>();
      for (const v of nums) cnt.set(v, (cnt.get(v) || 0) + 1);
      for (const c of cnt.values()) for (let k = 2; k <= c; k++) total /= k;
      return Math.round(total);
    };
    return {
      slug: "number-of-squareful-arrays",
      title: "Number of Squareful Arrays",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Backtracking", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "numSquarefulPerms", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An array is **squareful** when the sum of every pair of adjacent elements is a perfect square (0, 1, 4, 9, 16, ...).\n\n" +
        "Return the number of **distinct** permutations of `nums` that are squareful. Two permutations are different when they differ at some index — swapping two equal values does not create a new permutation.",
        [
          { in: "nums = [1,17,8]", out: "2", note: "`[1,8,17]` and `[17,8,1]`: 1 + 8 = 9 and 8 + 17 = 25." },
          { in: "nums = [2,2,2]", out: "1", note: "2 + 2 = 4, and all orderings are the same array." },
          { in: "nums = [3,6,10]", out: "2", note: "`[3,6,10]` and `[10,6,3]`: 9 and 16." },
        ],
        ["1 <= nums.length <= 12", "0 <= nums[i] <= 10^9"]),
      hints: [
        "Precompute, for every pair of positions, whether their values add up to a perfect square. Sums reach 2 · 10^9, so use 64-bit arithmetic and an integer square-root check.",
        "Build the permutation one position at a time, only placing a value whose sum with the previous value is a square.",
        "To count each distinct permutation once, sort the array and, among equal values, always use the leftmost unused copy first (skip `i` if `nums[i] == nums[i - 1]` and `i - 1` is unused).",
      ],
      editorial: explain({
        idea: "Backtracking over permutations with two prunings: adjacency (the next value must form a square with the previous one) and duplicate suppression (equal values are used in a fixed order).",
        steps: [
          "Sort `nums` and precompute `ok[i][j]` = `nums[i] + nums[j]` is a perfect square.",
          "`dfs(last, placed)`: if `placed == n`, count 1.",
          "Otherwise for each unused index `i`: skip it if `i > 0`, `nums[i] == nums[i - 1]` and `i - 1` is unused; skip it if `last >= 0` and `!ok[last][i]`. Mark, recurse with `last = i`, unmark.",
          "Return `dfs(-1, 0)`.",
        ],
        why: "The duplicate rule allows exactly one ordering of the copies of each value, so every distinct value sequence is built once; the adjacency check rejects a prefix as soon as it stops being squareful, which keeps the tree small. An equivalent check: a bitmask DP counting index-paths, divided by the factorials of the multiplicities, gives the same number.",
        time: "O(n!) worst case, much less with pruning; O(n^2) precomputation",
        space: "O(n^2)",
        pitfalls: [
          "`a + b` can exceed 2^31 − 1 — compute it in 64 bits.",
          "Floating-point `sqrt` can be off by one for large values; verify with an integer square.",
          "0 is a perfect square, so `[0,0]` is squareful.",
        ],
      }),
      examples: [
        { input: "[1,17,8]", expectedOutput: "2" },
        { input: "[2,2,2]", expectedOutput: "1" },
        { input: "[3,6,10]", expectedOutput: "2" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 9);
        let nums: number[];
        const n = rng() < 0.08 ? ri(rng, 10, 12) : ri(rng, 1, 9);
        if (mode < 6) {
          // A squareful chain (answer >= 1), then shuffled.
          const bigVals = mode >= 4;
          nums = [bigVals ? ri(rng, 0, 1000000000) : ri(rng, 0, 40)];
          while (nums.length < n) {
            const a = nums[nums.length - 1];
            const kLo = Math.ceil(Math.sqrt(a));
            const kHi = Math.floor(Math.sqrt(a + (bigVals ? 1000000000 : 60)));
            if (kHi < kLo) break;
            const k = ri(rng, kLo, Math.min(kHi, kLo + 4));
            const b = k * k - a;
            if (b < 0 || b > 1000000000) break;
            nums.push(b);
          }
          shuffle(rng, nums);
        } else if (mode < 8) {
          const pool = shuffle(rng, [0, 1, 2, 3, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 21, 30, 34, 47]).slice(0, ri(rng, 2, 5));
          nums = Array.from({ length: n }, () => pick(rng, pool));
        } else {
          nums = Array.from({ length: n }, () => ri(rng, 0, 50));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import isqrt

          def numSquarefulPerms(nums: List[int]) -> int:
              a = sorted(nums)
              n = len(a)

              def square(x):
                  r = isqrt(x)
                  return r * r == x

              ok = [[square(a[i] + a[j]) for j in range(n)] for i in range(n)]
              used = [False] * n

              def dfs(last, placed):
                  if placed == n:
                      return 1
                  total = 0
                  for i in range(n):
                      if used[i]:
                          continue
                      if i > 0 and a[i] == a[i - 1] and not used[i - 1]:
                          continue
                      if last >= 0 and not ok[last][i]:
                          continue
                      used[i] = True
                      total += dfs(i, placed + 1)
                      used[i] = False
                  return total

              return dfs(-1, 0)
        `,
        javascript: code`
          var numSquarefulPerms = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              var square = function(x) {
                  var r = Math.floor(Math.sqrt(x));
                  while (r * r > x) r--;
                  while ((r + 1) * (r + 1) <= x) r++;
                  return r * r === x;
              };
              var ok = [];
              for (var i = 0; i < n; i++) {
                  ok.push([]);
                  for (var j = 0; j < n; j++) ok[i].push(square(a[i] + a[j]));
              }
              var used = new Array(n).fill(false);
              var dfs = function(last, placed) {
                  if (placed === n) return 1;
                  var total = 0;
                  for (var i = 0; i < n; i++) {
                      if (used[i]) continue;
                      if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) continue;
                      if (last >= 0 && !ok[last][i]) continue;
                      used[i] = true;
                      total += dfs(i, placed + 1);
                      used[i] = false;
                  }
                  return total;
              };
              return dfs(-1, 0);
          };
        `,
        typescript: code`
          function numSquarefulPerms(nums: number[]): number {
              var a: number[] = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              function square(x: number): boolean {
                  var r = Math.floor(Math.sqrt(x));
                  while (r * r > x) r--;
                  while ((r + 1) * (r + 1) <= x) r++;
                  return r * r === x;
              }
              var ok: boolean[][] = [];
              for (var i = 0; i < n; i++) {
                  ok.push([]);
                  for (var j = 0; j < n; j++) ok[i].push(square(a[i] + a[j]));
              }
              var used: boolean[] = [];
              for (var u = 0; u < n; u++) used.push(false);
              function dfs(last: number, placed: number): number {
                  if (placed === n) return 1;
                  var total = 0;
                  for (var k = 0; k < n; k++) {
                      if (used[k]) continue;
                      if (k > 0 && a[k] === a[k - 1] && !used[k - 1]) continue;
                      if (last >= 0 && !ok[last][k]) continue;
                      used[k] = true;
                      total += dfs(k, placed + 1);
                      used[k] = false;
                  }
                  return total;
              }
              return dfs(-1, 0);
          }
        `,
        java: code`
          public static int numSquarefulPerms(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              boolean[][] ok = new boolean[n][n];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) ok[i][j] = squareSum((long) a[i] + a[j]);
              return squarefulDfs(a, ok, new boolean[n], -1, 0);
          }

          static boolean squareSum(long x) {
              long r = (long) Math.sqrt((double) x);
              while (r * r > x) r--;
              while ((r + 1) * (r + 1) <= x) r++;
              return r * r == x;
          }

          static int squarefulDfs(int[] a, boolean[][] ok, boolean[] used, int last, int placed) {
              if (placed == a.length) return 1;
              int total = 0;
              for (int i = 0; i < a.length; i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  if (last >= 0 && !ok[last][i]) continue;
                  used[i] = true;
                  total += squarefulDfs(a, ok, used, i, placed + 1);
                  used[i] = false;
              }
              return total;
          }
        `,
        cpp: code`
          bool squareSum(long long x) {
              long long r = (long long)sqrt((double)x);
              while (r * r > x) r--;
              while ((r + 1) * (r + 1) <= x) r++;
              return r * r == x;
          }

          int squarefulDfs(vector<int>& a, vector<vector<bool>>& ok, vector<bool>& used, int last, int placed) {
              int n = a.size();
              if (placed == n) return 1;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  if (last >= 0 && !ok[last][i]) continue;
                  used[i] = true;
                  total += squarefulDfs(a, ok, used, i, placed + 1);
                  used[i] = false;
              }
              return total;
          }

          int numSquarefulPerms(vector<int>& nums) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              int n = a.size();
              vector<vector<bool>> ok(n, vector<bool>(n, false));
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) ok[i][j] = squareSum((long long)a[i] + a[j]);
              vector<bool> used(n, false);
              return squarefulDfs(a, ok, used, -1, 0);
          }
        `,
        c: code`
          static bool squareSum(long long x) {
              long long lo = 0, hi = 50000;
              while (lo < hi) {
                  long long mid = (lo + hi + 1) / 2;
                  if (mid * mid <= x) lo = mid; else hi = mid - 1;
              }
              return lo * lo == x;
          }

          static int squarefulDfs(int* a, int n, bool ok[12][12], bool* used, int last, int placed) {
              if (placed == n) return 1;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  if (last >= 0 && !ok[last][i]) continue;
                  used[i] = true;
                  total += squarefulDfs(a, n, ok, used, i, placed + 1);
                  used[i] = false;
              }
              return total;
          }

          static int squarefulCmp(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int numSquarefulPerms(int* nums, int numsSize) {
              int a[12];
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), squarefulCmp);
              bool ok[12][12];
              for (int i = 0; i < numsSize; i++)
                  for (int j = 0; j < numsSize; j++) ok[i][j] = squareSum((long long)a[i] + a[j]);
              bool used[12];
              for (int i = 0; i < 12; i++) used[i] = false;
              return squarefulDfs(a, numsSize, ok, used, -1, 0);
          }
        `,
        csharp: code`
          public static int NumSquarefulPerms(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length;
              bool[,] ok = new bool[n, n];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) ok[i, j] = SquareSum((long)a[i] + a[j]);
              return SquarefulDfs(a, ok, new bool[n], -1, 0);
          }

          static bool SquareSum(long x)
          {
              long r = (long)Math.Sqrt((double)x);
              while (r * r > x) r--;
              while ((r + 1) * (r + 1) <= x) r++;
              return r * r == x;
          }

          static int SquarefulDfs(int[] a, bool[,] ok, bool[] used, int last, int placed)
          {
              if (placed == a.Length) return 1;
              int total = 0;
              for (int i = 0; i < a.Length; i++)
              {
                  if (used[i]) continue;
                  if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
                  if (last >= 0 && !ok[last, i]) continue;
                  used[i] = true;
                  total += SquarefulDfs(a, ok, used, i, placed + 1);
                  used[i] = false;
              }
              return total;
          }
        `,
        go: code`
          func squareSum(x int) bool {
          	r := int(math.Sqrt(float64(x)))
          	for r*r > x {
          		r--
          	}
          	for (r+1)*(r+1) <= x {
          		r++
          	}
          	return r*r == x
          }

          func numSquarefulPerms(nums []int) int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	n := len(a)
          	ok := make([][]bool, n)
          	for i := 0; i < n; i++ {
          		ok[i] = make([]bool, n)
          		for j := 0; j < n; j++ {
          			ok[i][j] = squareSum(a[i] + a[j])
          		}
          	}
          	used := make([]bool, n)
          	var dfs func(last, placed int) int
          	dfs = func(last, placed int) int {
          		if placed == n {
          			return 1
          		}
          		total := 0
          		for i := 0; i < n; i++ {
          			if used[i] {
          				continue
          			}
          			if i > 0 && a[i] == a[i-1] && !used[i-1] {
          				continue
          			}
          			if last >= 0 && !ok[last][i] {
          				continue
          			}
          			used[i] = true
          			total += dfs(i, placed+1)
          			used[i] = false
          		}
          		return total
          	}
          	return dfs(-1, 0)
          }
        `,
        kotlin: code`
          fun squareSum(x: Long): Boolean {
              var r = Math.sqrt(x.toDouble()).toLong()
              while (r * r > x) r--
              while ((r + 1) * (r + 1) <= x) r++
              return r * r == x
          }

          fun numSquarefulPerms(nums: IntArray): Int {
              val a = nums.sortedArray()
              val n = a.size
              val ok = Array(n) { i -> BooleanArray(n) { j -> squareSum(a[i].toLong() + a[j]) } }
              val used = BooleanArray(n)
              fun dfs(last: Int, placed: Int): Int {
                  if (placed == n) return 1
                  var total = 0
                  for (i in 0 until n) {
                      if (used[i]) continue
                      if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue
                      if (last >= 0 && !ok[last][i]) continue
                      used[i] = true
                      total += dfs(i, placed + 1)
                      used[i] = false
                  }
                  return total
              }
              return dfs(-1, 0)
          }
        `,
        swift: code`
          func squareSum(_ x: Int) -> Bool {
              var r = Int(Double(x).squareRoot())
              while r * r > x { r -= 1 }
              while (r + 1) * (r + 1) <= x { r += 1 }
              return r * r == x
          }

          func numSquarefulPerms(_ nums: [Int]) -> Int {
              let a = nums.sorted()
              let n = a.count
              var ok = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)
              for i in 0..<n {
                  for j in 0..<n { ok[i][j] = squareSum(a[i] + a[j]) }
              }
              var used = [Bool](repeating: false, count: n)
              func dfs(_ last: Int, _ placed: Int) -> Int {
                  if placed == n { return 1 }
                  var total = 0
                  for i in 0..<n {
                      if used[i] { continue }
                      if i > 0 && a[i] == a[i - 1] && !used[i - 1] { continue }
                      if last >= 0 && !ok[last][i] { continue }
                      used[i] = true
                      total += dfs(i, placed + 1)
                      used[i] = false
                  }
                  return total
              }
              return dfs(-1, 0)
          }
        `,
        rust: code`
          fn square_sum(x: i64) -> bool {
              let mut r = (x as f64).sqrt() as i64;
              while r * r > x {
                  r -= 1;
              }
              while (r + 1) * (r + 1) <= x {
                  r += 1;
              }
              r * r == x
          }

          fn squareful_dfs(a: &Vec<i64>, ok: &Vec<Vec<bool>>, used: &mut Vec<bool>, last: i32, placed: usize) -> i32 {
              let n = a.len();
              if placed == n {
                  return 1;
              }
              let mut total = 0;
              for i in 0..n {
                  if used[i] {
                      continue;
                  }
                  if i > 0 && a[i] == a[i - 1] && !used[i - 1] {
                      continue;
                  }
                  if last >= 0 && !ok[last as usize][i] {
                      continue;
                  }
                  used[i] = true;
                  total += squareful_dfs(a, ok, used, i as i32, placed + 1);
                  used[i] = false;
              }
              total
          }

          fn numSquarefulPerms(nums: Vec<i32>) -> i32 {
              let mut a: Vec<i64> = nums.iter().map(|&v| v as i64).collect();
              a.sort();
              let n = a.len();
              let mut ok = vec![vec![false; n]; n];
              for i in 0..n {
                  for j in 0..n {
                      ok[i][j] = square_sum(a[i] + a[j]);
                  }
              }
              let mut used = vec![false; n];
              squareful_dfs(&a, &ok, &mut used, -1, 0)
          }
        `,
        php: code`
          function numSquarefulPerms($nums) {
              $a = $nums;
              sort($a);
              $n = count($a);
              $ok = [];
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $n; $j++) $ok[$i][$j] = squareSum($a[$i] + $a[$j]);
              }
              $used = array_fill(0, $n, false);
              return squarefulDfs($a, $ok, $used, -1, 0);
          }

          function squareSum($x) {
              $r = (int)floor(sqrt($x));
              while ($r * $r > $x) $r--;
              while (($r + 1) * ($r + 1) <= $x) $r++;
              return $r * $r == $x;
          }

          function squarefulDfs(&$a, &$ok, &$used, $last, $placed) {
              $n = count($a);
              if ($placed == $n) return 1;
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($used[$i]) continue;
                  if ($i > 0 && $a[$i] == $a[$i - 1] && !$used[$i - 1]) continue;
                  if ($last >= 0 && !$ok[$last][$i]) continue;
                  $used[$i] = true;
                  $total += squarefulDfs($a, $ok, $used, $i, $placed + 1);
                  $used[$i] = false;
              }
              return $total;
          }
        `,
        ruby: code`
          def numSquarefulPerms(nums)
            a = nums.sort
            n = a.length
            ok = Array.new(n) { |i| Array.new(n) { |j| s = a[i] + a[j]; r = Integer.sqrt(s); r * r == s } }
            used = Array.new(n, false)
            squareful_dfs(a, ok, used, -1, 0)
          end

          def squareful_dfs(a, ok, used, last, placed)
            n = a.length
            return 1 if placed == n
            total = 0
            n.times do |i|
              next if used[i]
              next if i > 0 && a[i] == a[i - 1] && !used[i - 1]
              next if last >= 0 && !ok[last][i]
              used[i] = true
              total += squareful_dfs(a, ok, used, i, placed + 1)
              used[i] = false
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Remove Boxes (LC 546) ───────────────────────────────────────
  (() => {
    const dpSolve = (boxes: number[]) => {
      const n = boxes.length;
      const memo = new Map<number, number>();
      const dp = (l: number, r: number, k: number): number => {
        if (l > r) return 0;
        const key = (l * 128 + r) * 128 + k;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = (k + 1) * (k + 1) + dp(l + 1, r, 0);
        for (let m = l + 1; m <= r; m++) {
          if (boxes[m] === boxes[l]) best = Math.max(best, dp(l + 1, m - 1, 0) + dp(m, r, k + 1));
        }
        memo.set(key, best);
        return best;
      };
      return dp(0, n - 1, 0);
    };
    /** Plain exhaustive search over removal orders (memoised on the remaining row). */
    const brute = (boxes: number[]) => {
      const memo = new Map<string, number>();
      const go = (row: number[]): number => {
        if (!row.length) return 0;
        const key = row.join(",");
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = 0;
        for (let i = 0; i < row.length; ) {
          let j = i;
          while (j < row.length && row[j] === row[i]) j++;
          best = Math.max(best, (j - i) * (j - i) + go(row.slice(0, i).concat(row.slice(j))));
          i = j;
        }
        memo.set(key, best);
        return best;
      };
      return go(boxes);
    };
    // The DP is the honest reference; prove it against exhaustive search on small rows first.
    {
      const rng = (() => { let s = 12345; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; })();
      for (let t = 0; t < 300; t++) {
        const n = ri(rng, 1, 8);
        const row = Array.from({ length: n }, () => ri(rng, 1, 3));
        if (dpSolve(row) !== brute(row)) throw new Error(`remove-boxes ref mismatch on ${row}`);
      }
    }
    return {
      slug: "remove-boxes",
      title: "Remove Boxes",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Memoization", "Google", "Amazon"],
      signature: { funcName: "removeBoxes", params: [{ name: "boxes", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A row of boxes is given, `boxes[i]` being the colour of the `i`-th box. In each round you remove one maximal group of `k >= 1` **adjacent boxes of the same colour** and score `k * k` points; the boxes on either side then become adjacent. You keep going until no boxes remain.\n\n" +
        "Return the **maximum** total score you can get.",
        [
          { in: "boxes = [1,3,2,2,2,3,4,3,1]", out: "23", note: "Remove `[2,2,2]` (9), then the single 4 (1), then `[3,3,3]` (9), then `[1,1]` (4)." },
          { in: "boxes = [1,1,1]", out: "9" },
          { in: "boxes = [5]", out: "1" },
        ],
        ["1 <= boxes.length <= 100", "1 <= boxes[i] <= 100"]),
      hints: [
        "Greedy removal of the biggest group fails: it can be better to remove what separates two groups of the same colour first, so they merge into a bigger group.",
        "Interval DP needs extra state: the score of a segment depends on how many boxes of the same colour as its left end are waiting to be removed together with it. Let `dp(l, r, k)` be the best score for `boxes[l..r]` when `k` boxes equal to `boxes[l]` are already attached to its left.",
        "Either remove `boxes[l]` with its `k` companions now — `(k + 1)^2 + dp(l + 1, r, 0)` — or, for some `m` in `(l, r]` with `boxes[m] == boxes[l]`, first clear `boxes[l+1..m-1]` and carry the group along: `dp(l + 1, m - 1, 0) + dp(m, r, k + 1)`.",
      ],
      editorial: explain({
        idea: "A three-dimensional interval DP. The extra index `k` records how many boxes of the left end's colour have been saved up to be removed together with it, which is exactly the information plain `dp(l, r)` loses.",
        steps: [
          "`dp(l, r, k)` = maximum points for `boxes[l..r]` with `k` extra boxes of colour `boxes[l]` attached on the left; `dp(l, r, k) = 0` when `l > r`.",
          "Option 1: remove the left group now — `(k + 1)^2 + dp(l + 1, r, 0)`.",
          "Option 2: for each `m` in `l + 1..r` with `boxes[m] == boxes[l]`, clear the middle first and merge — `dp(l + 1, m - 1, 0) + dp(m, r, k + 1)`.",
          "Take the maximum, memoise it, and return `dp(0, n - 1, 0)`.",
        ],
        why: "Consider the round in which box `l` disappears. Either it is removed with only its `k` attached companions (option 1), or it is removed together with some later box of the same colour; letting `m` be the first such box, everything strictly between them must have been removed before, independently of the rest (option 2). These cases cover every strategy, and each subproblem is again of the same form.",
        time: "O(n^4) worst case (n^3 states, O(n) transitions)",
        space: "O(n^3)",
        pitfalls: [
          "A two-index `dp(l, r)` cannot express the merge bonus and gives wrong answers.",
          "The score is `k * k` for the group removed in one round, not one point per box.",
          "Memoise all three indices — without it the recursion is exponential.",
        ],
      }),
      examples: [
        { input: "[1,3,2,2,2,3,4,3,1]", expectedOutput: "23" },
        { input: "[1,1,1]", expectedOutput: "9" },
        { input: "[5]", expectedOutput: "1" },
      ],
      hiddenCount: 800,
      gen: (rng: Rng) => {
        const n = rng() < 0.1 ? ri(rng, 15, 20) : ri(rng, 1, 14);
        const colours = ri(rng, 1, 5);
        const palette = shuffle(rng, Array.from({ length: 100 }, (_, i) => i + 1)).slice(0, colours);
        const boxes = Array.from({ length: n }, () => pick(rng, palette));
        return { input: fmtIntArr(boxes), expectedOutput: String(dpSolve(boxes)) };
      },
      solutions: {
        python: code`
          import sys
          from typing import List

          def removeBoxes(boxes: List[int]) -> int:
              sys.setrecursionlimit(10000)
              n = len(boxes)
              memo = {}

              def dp(l, r, k):
                  if l > r:
                      return 0
                  key = (l * 128 + r) * 128 + k
                  if key in memo:
                      return memo[key]
                  best = (k + 1) * (k + 1) + dp(l + 1, r, 0)
                  for m in range(l + 1, r + 1):
                      if boxes[m] == boxes[l]:
                          cand = dp(l + 1, m - 1, 0) + dp(m, r, k + 1)
                          if cand > best:
                              best = cand
                  memo[key] = best
                  return best

              return dp(0, n - 1, 0)
        `,
        javascript: code`
          var removeBoxes = function(boxes) {
              var n = boxes.length;
              var memo = new Int32Array(n * n * n).fill(-1);
              var dp = function(l, r, k) {
                  if (l > r) return 0;
                  var key = (l * n + r) * n + k;
                  if (memo[key] >= 0) return memo[key];
                  var best = (k + 1) * (k + 1) + dp(l + 1, r, 0);
                  for (var m = l + 1; m <= r; m++) {
                      if (boxes[m] === boxes[l]) {
                          var cand = dp(l + 1, m - 1, 0) + dp(m, r, k + 1);
                          if (cand > best) best = cand;
                      }
                  }
                  memo[key] = best;
                  return best;
              };
              return dp(0, n - 1, 0);
          };
        `,
        typescript: code`
          function removeBoxes(boxes: number[]): number {
              var n = boxes.length;
              var memo: number[] = [];
              for (var i = 0; i < n * n * n; i++) memo.push(-1);
              function dp(l: number, r: number, k: number): number {
                  if (l > r) return 0;
                  var key = (l * n + r) * n + k;
                  if (memo[key] >= 0) return memo[key];
                  var best = (k + 1) * (k + 1) + dp(l + 1, r, 0);
                  for (var m = l + 1; m <= r; m++) {
                      if (boxes[m] === boxes[l]) {
                          var cand = dp(l + 1, m - 1, 0) + dp(m, r, k + 1);
                          if (cand > best) best = cand;
                      }
                  }
                  memo[key] = best;
                  return best;
              }
              return dp(0, n - 1, 0);
          }
        `,
        java: code`
          public static int removeBoxes(int[] boxes) {
              int n = boxes.length;
              int[][][] memo = new int[n][n][n];
              return boxesDp(boxes, memo, 0, n - 1, 0);
          }

          static int boxesDp(int[] b, int[][][] memo, int l, int r, int k) {
              if (l > r) return 0;
              if (memo[l][r][k] > 0) return memo[l][r][k];
              int best = (k + 1) * (k + 1) + boxesDp(b, memo, l + 1, r, 0);
              for (int m = l + 1; m <= r; m++) {
                  if (b[m] == b[l]) best = Math.max(best, boxesDp(b, memo, l + 1, m - 1, 0) + boxesDp(b, memo, m, r, k + 1));
              }
              memo[l][r][k] = best;
              return best;
          }
        `,
        cpp: code`
          int boxesDp(vector<int>& b, vector<int>& memo, int n, int l, int r, int k) {
              if (l > r) return 0;
              int key = (l * n + r) * n + k;
              if (memo[key] > 0) return memo[key];
              int best = (k + 1) * (k + 1) + boxesDp(b, memo, n, l + 1, r, 0);
              for (int m = l + 1; m <= r; m++) {
                  if (b[m] == b[l]) best = max(best, boxesDp(b, memo, n, l + 1, m - 1, 0) + boxesDp(b, memo, n, m, r, k + 1));
              }
              memo[key] = best;
              return best;
          }

          int removeBoxes(vector<int>& boxes) {
              int n = boxes.size();
              vector<int> memo(n * n * n, 0);
              return boxesDp(boxes, memo, n, 0, n - 1, 0);
          }
        `,
        c: code`
          static int boxesDp(int* b, int* memo, int n, int l, int r, int k) {
              if (l > r) return 0;
              int key = (l * n + r) * n + k;
              if (memo[key] > 0) return memo[key];
              int best = (k + 1) * (k + 1) + boxesDp(b, memo, n, l + 1, r, 0);
              for (int m = l + 1; m <= r; m++) {
                  if (b[m] == b[l]) {
                      int cand = boxesDp(b, memo, n, l + 1, m - 1, 0) + boxesDp(b, memo, n, m, r, k + 1);
                      if (cand > best) best = cand;
                  }
              }
              memo[key] = best;
              return best;
          }

          int removeBoxes(int* boxes, int boxesSize) {
              int n = boxesSize;
              int* memo = (int*)calloc(n * n * n, sizeof(int));
              int ans = boxesDp(boxes, memo, n, 0, n - 1, 0);
              free(memo);
              return ans;
          }
        `,
        csharp: code`
          public static int RemoveBoxes(int[] boxes)
          {
              int n = boxes.Length;
              int[,,] memo = new int[n, n, n];
              return BoxesDp(boxes, memo, 0, n - 1, 0);
          }

          static int BoxesDp(int[] b, int[,,] memo, int l, int r, int k)
          {
              if (l > r) return 0;
              if (memo[l, r, k] > 0) return memo[l, r, k];
              int best = (k + 1) * (k + 1) + BoxesDp(b, memo, l + 1, r, 0);
              for (int m = l + 1; m <= r; m++)
              {
                  if (b[m] == b[l]) best = Math.Max(best, BoxesDp(b, memo, l + 1, m - 1, 0) + BoxesDp(b, memo, m, r, k + 1));
              }
              memo[l, r, k] = best;
              return best;
          }
        `,
        go: code`
          func removeBoxes(boxes []int) int {
          	n := len(boxes)
          	memo := make([]int, n*n*n)
          	var dp func(l, r, k int) int
          	dp = func(l, r, k int) int {
          		if l > r {
          			return 0
          		}
          		key := (l*n+r)*n + k
          		if memo[key] > 0 {
          			return memo[key]
          		}
          		best := (k+1)*(k+1) + dp(l+1, r, 0)
          		for m := l + 1; m <= r; m++ {
          			if boxes[m] == boxes[l] {
          				cand := dp(l+1, m-1, 0) + dp(m, r, k+1)
          				if cand > best {
          					best = cand
          				}
          			}
          		}
          		memo[key] = best
          		return best
          	}
          	return dp(0, n-1, 0)
          }
        `,
        kotlin: code`
          fun removeBoxes(boxes: IntArray): Int {
              val n = boxes.size
              val memo = IntArray(n * n * n)
              fun dp(l: Int, r: Int, k: Int): Int {
                  if (l > r) return 0
                  val key = (l * n + r) * n + k
                  if (memo[key] > 0) return memo[key]
                  var best = (k + 1) * (k + 1) + dp(l + 1, r, 0)
                  for (m in l + 1..r) {
                      if (boxes[m] == boxes[l]) best = maxOf(best, dp(l + 1, m - 1, 0) + dp(m, r, k + 1))
                  }
                  memo[key] = best
                  return best
              }
              return dp(0, n - 1, 0)
          }
        `,
        swift: code`
          func removeBoxes(_ boxes: [Int]) -> Int {
              let n = boxes.count
              var memo = [Int](repeating: 0, count: n * n * n)
              func dp(_ l: Int, _ r: Int, _ k: Int) -> Int {
                  if l > r { return 0 }
                  let key = (l * n + r) * n + k
                  if memo[key] > 0 { return memo[key] }
                  var best = (k + 1) * (k + 1) + dp(l + 1, r, 0)
                  var m = l + 1
                  while m <= r {
                      if boxes[m] == boxes[l] { best = max(best, dp(l + 1, m - 1, 0) + dp(m, r, k + 1)) }
                      m += 1
                  }
                  memo[key] = best
                  return best
              }
              return dp(0, n - 1, 0)
          }
        `,
        rust: code`
          fn boxes_dp(b: &Vec<i32>, memo: &mut Vec<i32>, n: usize, l: usize, r: i64, k: usize) -> i32 {
              if (l as i64) > r {
                  return 0;
              }
              let ru = r as usize;
              let key = (l * n + ru) * n + k;
              if memo[key] > 0 {
                  return memo[key];
              }
              let mut best = ((k + 1) * (k + 1)) as i32 + boxes_dp(b, memo, n, l + 1, r, 0);
              for m in (l + 1)..=ru {
                  if b[m] == b[l] {
                      let cand = boxes_dp(b, memo, n, l + 1, m as i64 - 1, 0) + boxes_dp(b, memo, n, m, r, k + 1);
                      if cand > best {
                          best = cand;
                      }
                  }
              }
              memo[key] = best;
              best
          }

          fn removeBoxes(boxes: Vec<i32>) -> i32 {
              let n = boxes.len();
              let mut memo = vec![0i32; n * n * n];
              boxes_dp(&boxes, &mut memo, n, 0, n as i64 - 1, 0)
          }
        `,
        php: code`
          function removeBoxes($boxes) {
              $memo = [];
              return boxesDp($boxes, $memo, 0, count($boxes) - 1, 0);
          }

          function boxesDp(&$b, &$memo, $l, $r, $k) {
              if ($l > $r) return 0;
              $key = ($l * 128 + $r) * 128 + $k;
              if (isset($memo[$key])) return $memo[$key];
              $best = ($k + 1) * ($k + 1) + boxesDp($b, $memo, $l + 1, $r, 0);
              for ($m = $l + 1; $m <= $r; $m++) {
                  if ($b[$m] == $b[$l]) {
                      $cand = boxesDp($b, $memo, $l + 1, $m - 1, 0) + boxesDp($b, $memo, $m, $r, $k + 1);
                      if ($cand > $best) $best = $cand;
                  }
              }
              $memo[$key] = $best;
              return $best;
          }
        `,
        ruby: code`
          def removeBoxes(boxes)
            boxes_dp(boxes, {}, 0, boxes.length - 1, 0)
          end

          def boxes_dp(b, memo, l, r, k)
            return 0 if l > r
            key = (l * 128 + r) * 128 + k
            return memo[key] if memo.key?(key)
            best = (k + 1) * (k + 1) + boxes_dp(b, memo, l + 1, r, 0)
            ((l + 1)..r).each do |m|
              next unless b[m] == b[l]
              cand = boxes_dp(b, memo, l + 1, m - 1, 0) + boxes_dp(b, memo, m, r, k + 1)
              best = cand if cand > best
            end
            memo[key] = best
            best
          end
        `,
      },
    };
  })(),

  // ── Zuma Game (LC 488) ──────────────────────────────────────────
  (() => {
    const clean = (s: string) => {
      for (;;) {
        let changed = false;
        for (let i = 0; i < s.length; ) {
          let j = i;
          while (j < s.length && s[j] === s[i]) j++;
          if (j - i >= 3) { s = s.slice(0, i) + s.slice(j); changed = true; break; }
          i = j;
        }
        if (!changed) return s;
      }
    };
    /** Unpruned BFS: every ball of the hand at every gap. */
    const ref = (board: string, hand: string) => {
      const start = hand.split("").sort().join("");
      let level: Array<[string, string]> = [[board, start]];
      const seen = new Set([`${board}#${start}`]);
      for (let step = 1; level.length; step++) {
        const nxt: Array<[string, string]> = [];
        for (const [b, h] of level) {
          for (let j = 0; j < h.length; j++) {
            if (j > 0 && h[j] === h[j - 1]) continue;
            const nh = h.slice(0, j) + h.slice(j + 1);
            for (let i = 0; i <= b.length; i++) {
              const nb = clean(b.slice(0, i) + h[j] + b.slice(i));
              if (!nb.length) return step;
              const key = `${nb}#${nh}`;
              if (!seen.has(key)) { seen.add(key); nxt.push([nb, nh]); }
            }
          }
        }
        level = nxt;
      }
      return -1;
    };
    const COLORS = "RYBGW";
    return {
      slug: "zuma-game",
      title: "Zuma Game",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Breadth-First Search", "Memoization", "Google", "Amazon"],
      signature: {
        funcName: "findMinStep",
        params: [{ name: "board", type: "string" as const }, { name: "hand", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A row of coloured balls lies on the board; each ball is red `'R'`, yellow `'Y'`, blue `'B'`, green `'G'` or white `'W'`. You also hold some balls in your hand.\n\n" +
        "In one turn you take any ball from your hand and insert it anywhere in the row — between two balls or at either end. Then, while the row contains a group of **three or more** consecutive balls of the same colour, that group is removed (removing one group can make its neighbours touch and form a new group, which is removed too).\n\n" +
        "Return the **minimum** number of balls you must insert to clear the whole board, or `-1` if the balls in your hand are not enough. The starting row never contains three or more consecutive balls of one colour.",
        [
          { in: "board = \"WRRBBW\", hand = \"RB\"", out: "-1", note: "Inserting R then B leaves `WW`, and there is nothing left to finish it." },
          { in: "board = \"WWRRBBWW\", hand = \"WRBRW\"", out: "2", note: "`WWRR[R]BBWW` clears the reds, then `WWBB[B]WW` clears the blues and the whites merge into four." },
          { in: "board = \"G\", hand = \"GGGGG\"", out: "2" },
        ],
        [
          "1 <= board.length <= 16",
          "1 <= hand.length <= 5",
          "board and hand consist of the characters 'R', 'Y', 'B', 'G' and 'W'",
          "The initial board has no group of three or more consecutive balls of the same colour",
        ]),
      hints: [
        "The hand holds at most 5 balls, so the answer is at most 5 insertions — a breadth-first search over (board, remaining hand) states finds the minimum. Store the hand sorted so equal hands are one state.",
        "Write a `clean` routine that repeatedly deletes any run of 3+ equal balls until none is left; after one insertion that reproduces the chain reaction.",
        "Most insertions are pointless. It is enough to insert a ball of colour `c` either just before a ball of the same colour (never right after one — that is the same row), or between two equal balls of a *different* colour, to split them. Use a visited set.",
      ],
      editorial: explain({
        idea: "Breadth-first search over game states `(row, sorted hand)`, so the first time the row becomes empty we have used the fewest balls. Pruning the insertion points to the two useful kinds keeps the branching small.",
        steps: [
          "Sort `hand`; push `(board, hand)` into the queue and the visited set.",
          "Process the queue level by level (level = balls used). For each state, for each insertion index `i` and each distinct colour `c` in the hand:",
          "skip if the ball before `i` is already `c`; keep it only if `board[i] == c`, or if `board[i - 1] == board[i] != c` (splitting a pair).",
          "Insert, run `clean`; if the row is empty, return the current level. Otherwise, if `(row, hand minus c)` is new, enqueue it.",
          "If the queue empties, return -1.",
        ],
        why: "Breadth-first order guarantees minimality. The pruning is safe: putting `c` next to a same-coloured ball can always be done at the left end of that group (identical results), and putting `c` between two different-coloured neighbours, neither equal to `c` nor equal to each other, never creates or destroys anything that a later, better-placed insertion could not achieve — while splitting an equal pair can matter (it can let the two halves merge with other balls later), so that case is kept.",
        time: "Exponential in the hand size (≤ 5) — small in practice with the visited set",
        space: "O(number of distinct states)",
        pitfalls: [
          "Only inserting next to same-coloured balls is not enough: `RRWWRRBBRR` with hand `WB` needs a `W` between the last two `R`s.",
          "After a removal the neighbours may form a new group of 3+; keep cleaning until nothing changes.",
          "Two identical balls in the hand lead to identical states — try each colour once per position.",
        ],
      }),
      examples: [
        { input: "\"WRRBBW\"\n\"RB\"", expectedOutput: "-1" },
        { input: "\"WWRRBBWW\"\n\"WRBRW\"", expectedOutput: "2" },
        { input: "\"G\"\n\"GGGGG\"", expectedOutput: "2" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const palette = shuffle(rng, COLORS.split("")).slice(0, ri(rng, 1, 4));
        if (palette.length > 1 && rng() < 0.5) {
          // Solvable by construction: groups of 1-2 balls (neighbours differ in colour)
          // and a hand that can complete every group — the optimum may need fewer.
          let board = "";
          let hand = "";
          let prev = "";
          while (hand.length < 5) {
            const c = pick(rng, palette.filter((x) => x !== prev));
            const size = hand.length === 4 ? 2 : ri(rng, 1, 2);
            board += c.repeat(size);
            hand += c.repeat(3 - size);
            prev = c;
            if (rng() < 0.3) break;
          }
          if (hand.length < 5 && rng() < 0.4) hand += pick(rng, COLORS.split(""));
          hand = shuffle(rng, hand.split("")).join("");
          return { input: `"${board}"\n"${hand}"`, expectedOutput: String(ref(board, hand)) };
        }
        const target = ri(rng, 1, rng() < 0.15 ? 14 : 10);
        let board = "";
        while (board.length < target) {
          let c = pick(rng, palette);
          const n = board.length;
          if (n >= 2 && board[n - 1] === c && board[n - 2] === c) {
            const others = palette.filter((x) => x !== c);
            if (!others.length) break;
            c = pick(rng, others);
          }
          board += c;
        }
        const hl = ri(rng, 1, 5);
        let hand = "";
        for (let i = 0; i < hl; i++) hand += rng() < 0.85 ? pick(rng, palette) : pick(rng, COLORS.split(""));
        return { input: `"${board}"\n"${hand}"`, expectedOutput: String(ref(board, hand)) };
      },
      solutions: {
        python: code`
          def findMinStep(board: str, hand: str) -> int:
              def clean(s):
                  while True:
                      changed = False
                      i = 0
                      while i < len(s):
                          j = i
                          while j < len(s) and s[j] == s[i]:
                              j += 1
                          if j - i >= 3:
                              s = s[:i] + s[j:]
                              changed = True
                              break
                          i = j
                      if not changed:
                          return s

              start = ''.join(sorted(hand))
              level = [(board, start)]
              seen = {board + '#' + start}
              step = 0
              while level:
                  step += 1
                  nxt = []
                  for b, h in level:
                      for i in range(len(b) + 1):
                          for j in range(len(h)):
                              c = h[j]
                              if j > 0 and c == h[j - 1]:
                                  continue
                              if i > 0 and b[i - 1] == c:
                                  continue
                              worth = (i < len(b) and b[i] == c) or (0 < i < len(b) and b[i - 1] == b[i] and b[i] != c)
                              if not worth:
                                  continue
                              nb = clean(b[:i] + c + b[i:])
                              if not nb:
                                  return step
                              nh = h[:j] + h[j + 1:]
                              key = nb + '#' + nh
                              if key not in seen:
                                  seen.add(key)
                                  nxt.append((nb, nh))
                  level = nxt
              return -1
        `,
        javascript: code`
          var findMinStep = function(board, hand) {
              var clean = function(s) {
                  for (;;) {
                      var changed = false;
                      var i = 0;
                      while (i < s.length) {
                          var j = i;
                          while (j < s.length && s.charAt(j) === s.charAt(i)) j++;
                          if (j - i >= 3) {
                              s = s.substring(0, i) + s.substring(j);
                              changed = true;
                              break;
                          }
                          i = j;
                      }
                      if (!changed) return s;
                  }
              };
              var start = hand.split('').sort().join('');
              var level = [[board, start]];
              var seen = new Set([board + '#' + start]);
              var step = 0;
              while (level.length) {
                  step++;
                  var nxt = [];
                  for (var q = 0; q < level.length; q++) {
                      var b = level[q][0], h = level[q][1];
                      for (var i = 0; i <= b.length; i++) {
                          for (var j = 0; j < h.length; j++) {
                              var c = h.charAt(j);
                              if (j > 0 && c === h.charAt(j - 1)) continue;
                              if (i > 0 && b.charAt(i - 1) === c) continue;
                              var worth = (i < b.length && b.charAt(i) === c) ||
                                  (i > 0 && i < b.length && b.charAt(i - 1) === b.charAt(i) && b.charAt(i) !== c);
                              if (!worth) continue;
                              var nb = clean(b.substring(0, i) + c + b.substring(i));
                              if (nb.length === 0) return step;
                              var nh = h.substring(0, j) + h.substring(j + 1);
                              var key = nb + '#' + nh;
                              if (!seen.has(key)) {
                                  seen.add(key);
                                  nxt.push([nb, nh]);
                              }
                          }
                      }
                  }
                  level = nxt;
              }
              return -1;
          };
        `,
        typescript: code`
          function zumaClean(s: string): string {
              for (;;) {
                  var changed = false;
                  var i = 0;
                  while (i < s.length) {
                      var j = i;
                      while (j < s.length && s.charAt(j) === s.charAt(i)) j++;
                      if (j - i >= 3) {
                          s = s.substring(0, i) + s.substring(j);
                          changed = true;
                          break;
                      }
                      i = j;
                  }
                  if (!changed) return s;
              }
          }

          function findMinStep(board: string, hand: string): number {
              var start = hand.split('').sort().join('');
              var levelB: string[] = [board];
              var levelH: string[] = [start];
              var seen: { [k: string]: boolean } = {};
              seen[board + '#' + start] = true;
              var step = 0;
              while (levelB.length > 0) {
                  step++;
                  var nextB: string[] = [];
                  var nextH: string[] = [];
                  for (var q = 0; q < levelB.length; q++) {
                      var b = levelB[q], h = levelH[q];
                      for (var i = 0; i <= b.length; i++) {
                          for (var j = 0; j < h.length; j++) {
                              var c = h.charAt(j);
                              if (j > 0 && c === h.charAt(j - 1)) continue;
                              if (i > 0 && b.charAt(i - 1) === c) continue;
                              var worth = (i < b.length && b.charAt(i) === c) ||
                                  (i > 0 && i < b.length && b.charAt(i - 1) === b.charAt(i) && b.charAt(i) !== c);
                              if (!worth) continue;
                              var nb = zumaClean(b.substring(0, i) + c + b.substring(i));
                              if (nb.length === 0) return step;
                              var nh = h.substring(0, j) + h.substring(j + 1);
                              var key = nb + '#' + nh;
                              if (!seen[key]) {
                                  seen[key] = true;
                                  nextB.push(nb);
                                  nextH.push(nh);
                              }
                          }
                      }
                  }
                  levelB = nextB;
                  levelH = nextH;
              }
              return -1;
          }
        `,
        java: code`
          static String zumaClean(String s) {
              while (true) {
                  boolean changed = false;
                  int i = 0;
                  while (i < s.length()) {
                      int j = i;
                      while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
                      if (j - i >= 3) {
                          s = s.substring(0, i) + s.substring(j);
                          changed = true;
                          break;
                      }
                      i = j;
                  }
                  if (!changed) return s;
              }
          }

          public static int findMinStep(String board, String hand) {
              char[] hc = hand.toCharArray();
              Arrays.sort(hc);
              String start = new String(hc);
              List<String[]> level = new ArrayList<>();
              level.add(new String[] { board, start });
              Set<String> seen = new HashSet<>();
              seen.add(board + "#" + start);
              int step = 0;
              while (!level.isEmpty()) {
                  step++;
                  List<String[]> next = new ArrayList<>();
                  for (String[] st : level) {
                      String b = st[0], h = st[1];
                      for (int i = 0; i <= b.length(); i++) {
                          for (int j = 0; j < h.length(); j++) {
                              char c = h.charAt(j);
                              if (j > 0 && c == h.charAt(j - 1)) continue;
                              if (i > 0 && b.charAt(i - 1) == c) continue;
                              boolean worth = (i < b.length() && b.charAt(i) == c)
                                  || (i > 0 && i < b.length() && b.charAt(i - 1) == b.charAt(i) && b.charAt(i) != c);
                              if (!worth) continue;
                              String nb = zumaClean(b.substring(0, i) + c + b.substring(i));
                              if (nb.isEmpty()) return step;
                              String nh = h.substring(0, j) + h.substring(j + 1);
                              if (seen.add(nb + "#" + nh)) next.add(new String[] { nb, nh });
                          }
                      }
                  }
                  level = next;
              }
              return -1;
          }
        `,
        cpp: code`
          string zumaClean(string s) {
              while (true) {
                  bool changed = false;
                  int i = 0, n = s.size();
                  while (i < n) {
                      int j = i;
                      while (j < n && s[j] == s[i]) j++;
                      if (j - i >= 3) {
                          s = s.substr(0, i) + s.substr(j);
                          changed = true;
                          break;
                      }
                      i = j;
                  }
                  if (!changed) return s;
              }
          }

          int findMinStep(string board, string hand) {
              sort(hand.begin(), hand.end());
              vector<pair<string, string>> level;
              level.push_back(make_pair(board, hand));
              unordered_set<string> seen;
              seen.insert(board + "#" + hand);
              int step = 0;
              while (!level.empty()) {
                  step++;
                  vector<pair<string, string>> nxt;
                  for (auto& st : level) {
                      const string& b = st.first;
                      const string& h = st.second;
                      int bl = b.size(), hl = h.size();
                      for (int i = 0; i <= bl; i++) {
                          for (int j = 0; j < hl; j++) {
                              char c = h[j];
                              if (j > 0 && c == h[j - 1]) continue;
                              if (i > 0 && b[i - 1] == c) continue;
                              bool worth = (i < bl && b[i] == c) || (i > 0 && i < bl && b[i - 1] == b[i] && b[i] != c);
                              if (!worth) continue;
                              string nb = zumaClean(b.substr(0, i) + c + b.substr(i));
                              if (nb.empty()) return step;
                              string nh = h.substr(0, j) + h.substr(j + 1);
                              if (seen.insert(nb + "#" + nh).second) nxt.push_back(make_pair(nb, nh));
                          }
                      }
                  }
                  level = nxt;
              }
              return -1;
          }
        `,
        c: code`
          typedef struct {
              char b[24];
              char h[8];
          } ZumaState;

          static unsigned long long* zumaSet;
          static int zumaCap;
          static int zumaCount;

          static int zumaClean(char* s) {
              int len = (int)strlen(s);
              for (;;) {
                  int changed = 0, i = 0;
                  while (i < len) {
                      int j = i;
                      while (j < len && s[j] == s[i]) j++;
                      if (j - i >= 3) {
                          memmove(s + i, s + j, len - j + 1);
                          len -= j - i;
                          changed = 1;
                          break;
                      }
                      i = j;
                  }
                  if (!changed) return len;
              }
          }

          static int zumaCode(char c) {
              if (c == 'R') return 1;
              if (c == 'Y') return 2;
              if (c == 'B') return 3;
              if (c == 'G') return 4;
              return 5;
          }

          static unsigned long long zumaKey(const char* b, const char* h) {
              unsigned long long k = 0;
              for (const char* p = b; *p; p++) k = k * 6 + zumaCode(*p);
              k = k * 6;
              for (const char* p = h; *p; p++) k = k * 6 + zumaCode(*p);
              return k;
          }

          static int zumaSlot(unsigned long long* set, int cap, unsigned long long key) {
              unsigned long long mixed = key * 0x9E3779B97F4A7C15ULL;
              int idx = (int)((mixed >> 32) & (unsigned long long)(cap - 1));
              while (set[idx] != 0 && set[idx] != key) idx = (idx + 1) & (cap - 1);
              return idx;
          }

          static int zumaAdd(unsigned long long key) {
              if ((zumaCount + 1) * 2 > zumaCap) {
                  int ncap = zumaCap * 2;
                  unsigned long long* ns = (unsigned long long*)calloc(ncap, sizeof(unsigned long long));
                  for (int i = 0; i < zumaCap; i++) {
                      if (zumaSet[i] != 0) ns[zumaSlot(ns, ncap, zumaSet[i])] = zumaSet[i];
                  }
                  free(zumaSet);
                  zumaSet = ns;
                  zumaCap = ncap;
              }
              int idx = zumaSlot(zumaSet, zumaCap, key);
              if (zumaSet[idx] == key) return 0;
              zumaSet[idx] = key;
              zumaCount++;
              return 1;
          }

          int findMinStep(const char* board, const char* hand) {
              int hl0 = (int)strlen(hand);
              char start[8];
              memcpy(start, hand, hl0 + 1);
              for (int i = 1; i < hl0; i++) {
                  char c = start[i];
                  int j = i - 1;
                  while (j >= 0 && start[j] > c) { start[j + 1] = start[j]; j--; }
                  start[j + 1] = c;
              }
              zumaCap = 1024;
              zumaCount = 0;
              zumaSet = (unsigned long long*)calloc(zumaCap, sizeof(unsigned long long));
              int qcap = 1024, qhead = 0, qtail = 1;
              ZumaState* q = (ZumaState*)malloc(sizeof(ZumaState) * qcap);
              strcpy(q[0].b, board);
              strcpy(q[0].h, start);
              zumaAdd(zumaKey(board, start));
              int step = 0, answer = -1;
              while (qhead < qtail && answer < 0) {
                  step++;
                  int levelEnd = qtail;
                  while (qhead < levelEnd && answer < 0) {
                      ZumaState cur = q[qhead++];
                      int bl = (int)strlen(cur.b), hl = (int)strlen(cur.h);
                      for (int i = 0; i <= bl && answer < 0; i++) {
                          for (int j = 0; j < hl; j++) {
                              char c = cur.h[j];
                              if (j > 0 && c == cur.h[j - 1]) continue;
                              if (i > 0 && cur.b[i - 1] == c) continue;
                              int worth = (i < bl && cur.b[i] == c) ||
                                  (i > 0 && i < bl && cur.b[i - 1] == cur.b[i] && cur.b[i] != c);
                              if (!worth) continue;
                              ZumaState nx;
                              memcpy(nx.b, cur.b, i);
                              nx.b[i] = c;
                              memcpy(nx.b + i + 1, cur.b + i, bl - i + 1);
                              if (zumaClean(nx.b) == 0) {
                                  answer = step;
                                  break;
                              }
                              memcpy(nx.h, cur.h, j);
                              memcpy(nx.h + j, cur.h + j + 1, hl - j);
                              if (zumaAdd(zumaKey(nx.b, nx.h))) {
                                  if (qtail == qcap) {
                                      qcap *= 2;
                                      q = (ZumaState*)realloc(q, sizeof(ZumaState) * qcap);
                                  }
                                  q[qtail++] = nx;
                              }
                          }
                      }
                  }
              }
              free(q);
              free(zumaSet);
              return answer;
          }
        `,
        csharp: code`
          static string ZumaClean(string s)
          {
              while (true)
              {
                  bool changed = false;
                  int i = 0;
                  while (i < s.Length)
                  {
                      int j = i;
                      while (j < s.Length && s[j] == s[i]) j++;
                      if (j - i >= 3)
                      {
                          s = s.Substring(0, i) + s.Substring(j);
                          changed = true;
                          break;
                      }
                      i = j;
                  }
                  if (!changed) return s;
              }
          }

          public static int FindMinStep(string board, string hand)
          {
              char[] hc = hand.ToCharArray();
              Array.Sort(hc);
              string start = new string(hc);
              var level = new List<string[]> { new string[] { board, start } };
              var seen = new HashSet<string> { board + "#" + start };
              int step = 0;
              while (level.Count > 0)
              {
                  step++;
                  var next = new List<string[]>();
                  foreach (var st in level)
                  {
                      string b = st[0], h = st[1];
                      for (int i = 0; i <= b.Length; i++)
                      {
                          for (int j = 0; j < h.Length; j++)
                          {
                              char c = h[j];
                              if (j > 0 && c == h[j - 1]) continue;
                              if (i > 0 && b[i - 1] == c) continue;
                              bool worth = (i < b.Length && b[i] == c) || (i > 0 && i < b.Length && b[i - 1] == b[i] && b[i] != c);
                              if (!worth) continue;
                              string nb = ZumaClean(b.Substring(0, i) + c + b.Substring(i));
                              if (nb.Length == 0) return step;
                              string nh = h.Substring(0, j) + h.Substring(j + 1);
                              if (seen.Add(nb + "#" + nh)) next.Add(new string[] { nb, nh });
                          }
                      }
                  }
                  level = next;
              }
              return -1;
          }
        `,
        go: code`
          func zumaClean(s string) string {
          	for {
          		changed := false
          		i := 0
          		for i < len(s) {
          			j := i
          			for j < len(s) && s[j] == s[i] {
          				j++
          			}
          			if j-i >= 3 {
          				s = s[:i] + s[j:]
          				changed = true
          				break
          			}
          			i = j
          		}
          		if !changed {
          			return s
          		}
          	}
          }

          func findMinStep(board string, hand string) int {
          	hb := []byte(hand)
          	sort.Slice(hb, func(a, b int) bool { return hb[a] < hb[b] })
          	start := string(hb)
          	level := [][2]string{{board, start}}
          	seen := map[string]bool{board + "#" + start: true}
          	step := 0
          	for len(level) > 0 {
          		step++
          		next := [][2]string{}
          		for _, st := range level {
          			b, h := st[0], st[1]
          			for i := 0; i <= len(b); i++ {
          				for j := 0; j < len(h); j++ {
          					c := h[j]
          					if j > 0 && c == h[j-1] {
          						continue
          					}
          					if i > 0 && b[i-1] == c {
          						continue
          					}
          					worth := (i < len(b) && b[i] == c) || (i > 0 && i < len(b) && b[i-1] == b[i] && b[i] != c)
          					if !worth {
          						continue
          					}
          					nb := zumaClean(b[:i] + string(c) + b[i:])
          					if len(nb) == 0 {
          						return step
          					}
          					nh := h[:j] + h[j+1:]
          					key := nb + "#" + nh
          					if !seen[key] {
          						seen[key] = true
          						next = append(next, [2]string{nb, nh})
          					}
          				}
          			}
          		}
          		level = next
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun zumaClean(input: String): String {
              var s = input
              var changed = true
              while (changed) {
                  changed = false
                  var i = 0
                  while (i < s.length) {
                      var j = i
                      while (j < s.length && s[j] == s[i]) j++
                      if (j - i >= 3) {
                          s = s.substring(0, i) + s.substring(j)
                          changed = true
                          break
                      }
                      i = j
                  }
              }
              return s
          }

          fun findMinStep(board: String, hand: String): Int {
              val start = String(hand.toCharArray().sortedArray())
              var level = ArrayList<Pair<String, String>>()
              level.add(Pair(board, start))
              val seen = HashSet<String>()
              seen.add(board + "#" + start)
              var step = 0
              while (level.isNotEmpty()) {
                  step++
                  val next = ArrayList<Pair<String, String>>()
                  for ((b, h) in level) {
                      for (i in 0..b.length) {
                          for (j in h.indices) {
                              val c = h[j]
                              if (j > 0 && c == h[j - 1]) continue
                              if (i > 0 && b[i - 1] == c) continue
                              val worth = (i < b.length && b[i] == c) || (i > 0 && i < b.length && b[i - 1] == b[i] && b[i] != c)
                              if (!worth) continue
                              val nb = zumaClean(b.substring(0, i) + c + b.substring(i))
                              if (nb.isEmpty()) return step
                              val nh = h.substring(0, j) + h.substring(j + 1)
                              if (seen.add(nb + "#" + nh)) next.add(Pair(nb, nh))
                          }
                      }
                  }
                  level = next
              }
              return -1
          }
        `,
        swift: code`
          func zumaClean(_ input: [UInt8]) -> [UInt8] {
              var s = input
              var changed = true
              while changed {
                  changed = false
                  var i = 0
                  while i < s.count {
                      var j = i
                      while j < s.count && s[j] == s[i] { j += 1 }
                      if j - i >= 3 {
                          s.removeSubrange(i..<j)
                          changed = true
                          break
                      }
                      i = j
                  }
              }
              return s
          }

          func findMinStep(_ board: String, _ hand: String) -> Int {
              let start = Array(hand.utf8).sorted()
              let b0 = Array(board.utf8)
              var level: [([UInt8], [UInt8])] = [(b0, start)]
              var seen = Set<String>()
              seen.insert(String(decoding: b0 + [35] + start, as: UTF8.self))
              var step = 0
              while !level.isEmpty {
                  step += 1
                  var next: [([UInt8], [UInt8])] = []
                  for (b, h) in level {
                      for i in 0...b.count {
                          for j in 0..<h.count {
                              let c = h[j]
                              if j > 0 && c == h[j - 1] { continue }
                              if i > 0 && b[i - 1] == c { continue }
                              let worth = (i < b.count && b[i] == c) || (i > 0 && i < b.count && b[i - 1] == b[i] && b[i] != c)
                              if !worth { continue }
                              var inserted = b
                              inserted.insert(c, at: i)
                              let nb = zumaClean(inserted)
                              if nb.isEmpty { return step }
                              var nh = h
                              nh.remove(at: j)
                              let key = String(decoding: nb + [35] + nh, as: UTF8.self)
                              if !seen.contains(key) {
                                  seen.insert(key)
                                  next.append((nb, nh))
                              }
                          }
                      }
                  }
                  level = next
              }
              return -1
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn zuma_clean(mut s: Vec<u8>) -> Vec<u8> {
              loop {
                  let mut changed = false;
                  let mut i = 0;
                  while i < s.len() {
                      let mut j = i;
                      while j < s.len() && s[j] == s[i] {
                          j += 1;
                      }
                      if j - i >= 3 {
                          s.drain(i..j);
                          changed = true;
                          break;
                      }
                      i = j;
                  }
                  if !changed {
                      return s;
                  }
              }
          }

          fn findMinStep(board: String, hand: String) -> i32 {
              let mut start: Vec<u8> = hand.into_bytes();
              start.sort();
              let b0: Vec<u8> = board.into_bytes();
              let mut seen: HashSet<Vec<u8>> = HashSet::new();
              let mut key0 = b0.clone();
              key0.push(b'#');
              key0.extend_from_slice(&start);
              seen.insert(key0);
              let mut level: Vec<(Vec<u8>, Vec<u8>)> = vec![(b0, start)];
              let mut step = 0;
              while !level.is_empty() {
                  step += 1;
                  let mut next: Vec<(Vec<u8>, Vec<u8>)> = Vec::new();
                  for (b, h) in level.iter() {
                      for i in 0..=b.len() {
                          for j in 0..h.len() {
                              let c = h[j];
                              if j > 0 && c == h[j - 1] {
                                  continue;
                              }
                              if i > 0 && b[i - 1] == c {
                                  continue;
                              }
                              let worth = (i < b.len() && b[i] == c) || (i > 0 && i < b.len() && b[i - 1] == b[i] && b[i] != c);
                              if !worth {
                                  continue;
                              }
                              let mut inserted = b.clone();
                              inserted.insert(i, c);
                              let nb = zuma_clean(inserted);
                              if nb.is_empty() {
                                  return step;
                              }
                              let mut nh = h.clone();
                              nh.remove(j);
                              let mut key = nb.clone();
                              key.push(b'#');
                              key.extend_from_slice(&nh);
                              if seen.insert(key) {
                                  next.push((nb, nh));
                              }
                          }
                      }
                  }
                  level = next;
              }
              -1
          }
        `,
        php: code`
          function zumaClean($s) {
              while (true) {
                  $changed = false;
                  $i = 0;
                  $n = strlen($s);
                  while ($i < $n) {
                      $j = $i;
                      while ($j < $n && $s[$j] === $s[$i]) $j++;
                      if ($j - $i >= 3) {
                          $s = substr($s, 0, $i) . substr($s, $j);
                          $changed = true;
                          break;
                      }
                      $i = $j;
                  }
                  if (!$changed) return $s;
              }
          }

          function findMinStep($board, $hand) {
              $hc = str_split($hand);
              sort($hc, SORT_STRING);
              $start = implode('', $hc);
              $level = [[$board, $start]];
              $seen = [$board . '#' . $start => true];
              $step = 0;
              while (count($level) > 0) {
                  $step++;
                  $next = [];
                  foreach ($level as $st) {
                      $b = $st[0];
                      $h = $st[1];
                      $bl = strlen($b);
                      $hl = strlen($h);
                      for ($i = 0; $i <= $bl; $i++) {
                          for ($j = 0; $j < $hl; $j++) {
                              $c = $h[$j];
                              if ($j > 0 && $c === $h[$j - 1]) continue;
                              if ($i > 0 && $b[$i - 1] === $c) continue;
                              $worth = ($i < $bl && $b[$i] === $c) || ($i > 0 && $i < $bl && $b[$i - 1] === $b[$i] && $b[$i] !== $c);
                              if (!$worth) continue;
                              $nb = zumaClean(substr($b, 0, $i) . $c . substr($b, $i));
                              if ($nb === '') return $step;
                              $nh = substr($h, 0, $j) . substr($h, $j + 1);
                              $key = $nb . '#' . $nh;
                              if (!isset($seen[$key])) {
                                  $seen[$key] = true;
                                  $next[] = [$nb, $nh];
                              }
                          }
                      }
                  }
                  $level = $next;
              }
              return -1;
          }
        `,
        ruby: code`
          def zuma_clean(s)
            loop do
              changed = false
              i = 0
              while i < s.length
                j = i
                j += 1 while j < s.length && s[j] == s[i]
                if j - i >= 3
                  s = s[0...i] + s[j..-1]
                  changed = true
                  break
                end
                i = j
              end
              return s unless changed
            end
          end

          def findMinStep(board, hand)
            start = hand.chars.sort.join
            level = [[board, start]]
            seen = { board + '#' + start => true }
            step = 0
            until level.empty?
              step += 1
              nxt = []
              level.each do |b, h|
                (0..b.length).each do |i|
                  h.length.times do |j|
                    c = h[j]
                    next if j > 0 && c == h[j - 1]
                    next if i > 0 && b[i - 1] == c
                    worth = (i < b.length && b[i] == c) || (i > 0 && i < b.length && b[i - 1] == b[i] && b[i] != c)
                    next unless worth
                    nb = zuma_clean(b[0...i] + c + b[i..-1])
                    return step if nb.empty?
                    nh = h[0...j] + h[(j + 1)..-1]
                    key = nb + '#' + nh
                    next if seen[key]
                    seen[key] = true
                    nxt << [nb, nh]
                  end
                end
              end
              level = nxt
            end
            -1
          end
        `,
      },
    };
  })(),

];
