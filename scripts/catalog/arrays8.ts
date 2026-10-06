/**
 * Array problems III — wave 6.
 * Real problems only: LeetCode numbered classics from the 2100–2700 range
 * (mostly medium). Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Several originals return a 64-bit count or sum (Task Scheduler II, Maximum
 * Sum of Distinct Subarrays, Divide Players, Beautiful Subarrays, Find Score,
 * Sum of Distances); their constraints are tightened here so the true answer
 * fits in int32, and each statement says so.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const ARRAYS8_PROBLEMS: CatalogProblem[] = [

  // ── Find All Lonely Numbers in the Array (LC 2150) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (const v of nums) count.set(v, (count.get(v) || 0) + 1);
      const out: number[] = [];
      count.forEach((c, v) => {
        if (c === 1 && !count.has(v - 1) && !count.has(v + 1)) out.push(v);
      });
      return out.sort((a, b) => a - b);
    };
    return {
      slug: "find-all-lonely-numbers-in-the-array",
      title: "Find All Lonely Numbers in the Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Google"],
      signature: { funcName: "findLonely", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "A value `x` in the integer array `nums` is **lonely** when it occurs **exactly once** in `nums` and neither `x - 1` nor `x + 1` occurs anywhere in `nums`.\n\nReturn every lonely value in **ascending order**. If no value is lonely, return an empty array.",
        [
          { in: "nums = [12,7,6,9]", out: "[9,12]", note: "`12` has no `11` or `13` beside it and `9` has no `8` or `10`. `6` and `7` are neighbours of each other, so neither is lonely." },
          { in: "nums = [2,4,4,7,3]", out: "[7]", note: "`4` repeats, and `2` and `3` each have a neighbour value present." },
          { in: "nums = [5,5]", out: "[]" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^6"]),
      hints: [
        "Two things must hold for `x`: it appears once, and both `x - 1` and `x + 1` are absent.",
        "A frequency map answers both questions in constant time per value.",
        "Alternatively sort the array: a unique `x` is lonely exactly when the value right before it is below `x - 1` and the value right after it is above `x + 1`.",
      ],
      editorial: explain({
        idea: "After sorting, everything that could disqualify `x` — another copy of `x`, or the values `x - 1` and `x + 1` — would sit immediately next to it. So one pass over the sorted array with a look at each element's two neighbours decides loneliness.",
        steps: [
          "Sort a copy of `nums` ascending.",
          "For each position `i` with value `x`, reject it if the previous value is at least `x - 1` (a duplicate or `x - 1`).",
          "Reject it too if the next value is at most `x + 1` (a duplicate or `x + 1`).",
          "Every value that survives both checks is lonely; they are collected in ascending order already.",
        ],
        why: "In a sorted array the element before `x` is the largest value not after it. If `x` repeats, that neighbour equals `x`; if `x - 1` is present (and `x` is unique), that neighbour is exactly `x - 1`; otherwise it is smaller than `x - 1`. The same argument mirrored covers the element after `x`, so the two comparisons are equivalent to the definition.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "A value that appears twice is never lonely, even if its neighbours are missing.",
          "The output order is fixed (ascending) — a hash-map solution must sort its result.",
          "The first and last sorted elements have only one neighbour to check.",
        ],
      }),
      examples: [
        { input: "[12,7,6,9]", expectedOutput: "[9,12]" },
        { input: "[2,4,4,7,3]", expectedOutput: "[7]" },
        { input: "[5,5]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const span = pick(rng, [4, 15, 60, 1000000]);
        const base = span === 1000000 ? 0 : ri(rng, 0, 1000000 - span);
        const nums = Array.from({ length: n }, () => base + ri(rng, 0, span));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findLonely(nums: List[int]) -> List[int]:
              a = sorted(nums)
              n = len(a)
              res = []
              for i in range(n):
                  x = a[i]
                  if i > 0 and a[i - 1] >= x - 1:
                      continue
                  if i + 1 < n and a[i + 1] <= x + 1:
                      continue
                  res.append(x)
              return res
        `,
        javascript: code`
          var findLonely = function(nums) {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var res = [];
              for (var i = 0; i < a.length; i++) {
                  var x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < a.length && a[i + 1] <= x + 1) continue;
                  res.push(x);
              }
              return res;
          };
        `,
        typescript: code`
          function findLonely(nums: number[]): number[] {
              var a: number[] = nums.slice();
              a.sort(function(p: number, q: number) { return p - q; });
              var res: number[] = [];
              for (var i = 0; i < a.length; i++) {
                  var x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < a.length && a[i + 1] <= x + 1) continue;
                  res.push(x);
              }
              return res;
          }
        `,
        java: code`
          public static int[] findLonely(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              List<Integer> res = new ArrayList<>();
              for (int i = 0; i < n; i++) {
                  int x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < n && a[i + 1] <= x + 1) continue;
                  res.add(x);
              }
              int[] out = new int[res.size()];
              for (int i = 0; i < out.length; i++) out[i] = res.get(i);
              return out;
          }
        `,
        cpp: code`
          vector<int> findLonely(vector<int>& nums) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              int n = a.size();
              vector<int> res;
              for (int i = 0; i < n; i++) {
                  int x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < n && a[i + 1] <= x + 1) continue;
                  res.push_back(x);
              }
              return res;
          }
        `,
        c: code`
          static int cmpLonelyAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int* findLonely(int* nums, int numsSize, int* returnSize) {
              int* a = (int*)malloc(sizeof(int) * (numsSize + 1));
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpLonelyAsc);
              int* res = (int*)malloc(sizeof(int) * (numsSize + 1));
              int k = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < numsSize && a[i + 1] <= x + 1) continue;
                  res[k++] = x;
              }
              free(a);
              *returnSize = k;
              return res;
          }
        `,
        csharp: code`
          public static int[] FindLonely(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length;
              var res = new List<int>();
              for (int i = 0; i < n; i++)
              {
                  int x = a[i];
                  if (i > 0 && a[i - 1] >= x - 1) continue;
                  if (i + 1 < n && a[i + 1] <= x + 1) continue;
                  res.Add(x);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func findLonely(nums []int) []int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	n := len(a)
          	res := []int{}
          	for i := 0; i < n; i++ {
          		x := a[i]
          		if i > 0 && a[i-1] >= x-1 {
          			continue
          		}
          		if i+1 < n && a[i+1] <= x+1 {
          			continue
          		}
          		res = append(res, x)
          	}
          	return res
          }
        `,
        kotlin: code`
          fun findLonely(nums: IntArray): IntArray {
              val a = nums.sortedArray()
              val n = a.size
              val res = ArrayList<Int>()
              for (i in 0 until n) {
                  val x = a[i]
                  if (i > 0 && a[i - 1] >= x - 1) continue
                  if (i + 1 < n && a[i + 1] <= x + 1) continue
                  res.add(x)
              }
              return res.toIntArray()
          }
        `,
        swift: code`
          func findLonely(_ nums: [Int]) -> [Int] {
              let a = nums.sorted()
              let n = a.count
              var res = [Int]()
              for i in 0..<n {
                  let x = a[i]
                  if i > 0 && a[i - 1] >= x - 1 { continue }
                  if i + 1 < n && a[i + 1] <= x + 1 { continue }
                  res.append(x)
              }
              return res
          }
        `,
        rust: code`
          fn findLonely(nums: Vec<i32>) -> Vec<i32> {
              let mut a = nums.clone();
              a.sort();
              let n = a.len();
              let mut res: Vec<i32> = Vec::new();
              for i in 0..n {
                  let x = a[i];
                  if i > 0 && a[i - 1] >= x - 1 {
                      continue;
                  }
                  if i + 1 < n && a[i + 1] <= x + 1 {
                      continue;
                  }
                  res.push(x);
              }
              res
          }
        `,
        php: code`
          function findLonely($nums) {
              $a = $nums;
              sort($a);
              $n = count($a);
              $res = [];
              for ($i = 0; $i < $n; $i++) {
                  $x = $a[$i];
                  if ($i > 0 && $a[$i - 1] >= $x - 1) continue;
                  if ($i + 1 < $n && $a[$i + 1] <= $x + 1) continue;
                  $res[] = $x;
              }
              return $res;
          }
        `,
        ruby: code`
          def findLonely(nums)
            a = nums.sort
            n = a.length
            res = []
            (0...n).each do |i|
              x = a[i]
              next if i > 0 && a[i - 1] >= x - 1
              next if i + 1 < n && a[i + 1] <= x + 1
              res << x
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Partition Array According to Given Pivot (LC 2161) ──────────
  (() => {
    const ref = (nums: number[], pivot: number) => [
      ...nums.filter((x) => x < pivot),
      ...nums.filter((x) => x === pivot),
      ...nums.filter((x) => x > pivot),
    ];
    return {
      slug: "partition-array-according-to-given-pivot",
      title: "Partition Array According to Given Pivot",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Simulation", "Amazon", "Microsoft"],
      signature: {
        funcName: "pivotArray",
        params: [{ name: "nums", type: "int[]" as const }, { name: "pivot", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Rearrange the integer array `nums` around the value `pivot` so that:\n\n- every element **smaller** than `pivot` comes first,\n- then every element **equal** to `pivot`,\n- then every element **greater** than `pivot`.\n\nInside the \"smaller\" group and inside the \"greater\" group the elements must keep the **relative order** they had in `nums` (the partition is stable). Return the rearranged array.",
        [
          { in: "nums = [7,2,11,4,7,15,1], pivot = 7", out: "[2,4,1,7,7,11,15]", note: "`2, 4, 1` are smaller and stay in that order; `11, 15` are greater and stay in that order." },
          { in: "nums = [-3,8,-1,5], pivot = 5", out: "[-3,-1,5,8]" },
          { in: "nums = [4], pivot = 4", out: "[4]" },
        ],
        ["1 <= nums.length <= 10^5", "-10^6 <= nums[i] <= 10^6", "pivot equals some element of nums"]),
      hints: [
        "An in-place swap-based partition (as in quicksort) is not stable — it scrambles the order inside a group.",
        "Use an output array and fill it group by group.",
        "Three passes over `nums`: copy the smaller values, then the equal ones, then the greater ones.",
      ],
      editorial: explain({
        idea: "Stability is the whole difficulty, and an extra output array removes it: scanning `nums` from left to right and copying only one group per scan preserves each group's original order automatically.",
        steps: [
          "Create a result array and a write index at 0.",
          "Scan `nums`; append every value smaller than `pivot`.",
          "Scan again; append every value equal to `pivot`.",
          "Scan a third time; append every value greater than `pivot`.",
        ],
        why: "Each scan visits elements in their original order and appends them, so within a group the output order equals the input order. Every element belongs to exactly one of the three groups, so the result is a permutation of `nums` with the groups in the required sequence.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The classic Lomuto/Hoare partition swaps elements and breaks the relative order.",
          "Values equal to `pivot` may appear several times — all of them go in the middle.",
          "A single pass with two pointers (smaller from the front, greater from the back) also works, but the back-filled group must then be written in reverse scan order.",
        ],
      }),
      examples: [
        { input: "[7,2,11,4,7,15,1]\n7", expectedOutput: "[2,4,1,7,7,11,15]" },
        { input: "[-3,8,-1,5]\n5", expectedOutput: "[-3,-1,5,8]" },
        { input: "[4]\n4", expectedOutput: "[4]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const span = pick(rng, [3, 10, 100, 1000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        const pivot = pick(rng, nums);
        return { input: `${fmtIntArr(nums)}\n${pivot}`, expectedOutput: fmtIntArr(ref(nums, pivot)) };
      },
      solutions: {
        python: code`
          from typing import List

          def pivotArray(nums: List[int], pivot: int) -> List[int]:
              less = [x for x in nums if x < pivot]
              equal = [x for x in nums if x == pivot]
              greater = [x for x in nums if x > pivot]
              return less + equal + greater
        `,
        javascript: code`
          var pivotArray = function(nums, pivot) {
              var res = [];
              for (var i = 0; i < nums.length; i++) if (nums[i] < pivot) res.push(nums[i]);
              for (var j = 0; j < nums.length; j++) if (nums[j] === pivot) res.push(nums[j]);
              for (var k = 0; k < nums.length; k++) if (nums[k] > pivot) res.push(nums[k]);
              return res;
          };
        `,
        typescript: code`
          function pivotArray(nums: number[], pivot: number): number[] {
              var res: number[] = [];
              for (var i = 0; i < nums.length; i++) if (nums[i] < pivot) res.push(nums[i]);
              for (var j = 0; j < nums.length; j++) if (nums[j] === pivot) res.push(nums[j]);
              for (var k = 0; k < nums.length; k++) if (nums[k] > pivot) res.push(nums[k]);
              return res;
          }
        `,
        java: code`
          public static int[] pivotArray(int[] nums, int pivot) {
              int n = nums.length;
              int[] res = new int[n];
              int w = 0;
              for (int x : nums) if (x < pivot) res[w++] = x;
              for (int x : nums) if (x == pivot) res[w++] = x;
              for (int x : nums) if (x > pivot) res[w++] = x;
              return res;
          }
        `,
        cpp: code`
          vector<int> pivotArray(vector<int>& nums, int pivot) {
              vector<int> res;
              res.reserve(nums.size());
              for (int x : nums) if (x < pivot) res.push_back(x);
              for (int x : nums) if (x == pivot) res.push_back(x);
              for (int x : nums) if (x > pivot) res.push_back(x);
              return res;
          }
        `,
        c: code`
          int* pivotArray(int* nums, int numsSize, int pivot, int* returnSize) {
              int* res = (int*)malloc(sizeof(int) * (numsSize + 1));
              int w = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] < pivot) res[w++] = nums[i];
              for (int i = 0; i < numsSize; i++) if (nums[i] == pivot) res[w++] = nums[i];
              for (int i = 0; i < numsSize; i++) if (nums[i] > pivot) res[w++] = nums[i];
              *returnSize = w;
              return res;
          }
        `,
        csharp: code`
          public static int[] PivotArray(int[] nums, int pivot)
          {
              int[] res = new int[nums.Length];
              int w = 0;
              foreach (int x in nums) if (x < pivot) res[w++] = x;
              foreach (int x in nums) if (x == pivot) res[w++] = x;
              foreach (int x in nums) if (x > pivot) res[w++] = x;
              return res;
          }
        `,
        go: code`
          func pivotArray(nums []int, pivot int) []int {
          	res := make([]int, 0, len(nums))
          	for _, x := range nums {
          		if x < pivot {
          			res = append(res, x)
          		}
          	}
          	for _, x := range nums {
          		if x == pivot {
          			res = append(res, x)
          		}
          	}
          	for _, x := range nums {
          		if x > pivot {
          			res = append(res, x)
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun pivotArray(nums: IntArray, pivot: Int): IntArray {
              val res = IntArray(nums.size)
              var w = 0
              for (x in nums) if (x < pivot) { res[w] = x; w++ }
              for (x in nums) if (x == pivot) { res[w] = x; w++ }
              for (x in nums) if (x > pivot) { res[w] = x; w++ }
              return res
          }
        `,
        swift: code`
          func pivotArray(_ nums: [Int], _ pivot: Int) -> [Int] {
              var res = [Int]()
              res.reserveCapacity(nums.count)
              for x in nums where x < pivot { res.append(x) }
              for x in nums where x == pivot { res.append(x) }
              for x in nums where x > pivot { res.append(x) }
              return res
          }
        `,
        rust: code`
          fn pivotArray(nums: Vec<i32>, pivot: i32) -> Vec<i32> {
              let mut res: Vec<i32> = Vec::with_capacity(nums.len());
              for &x in nums.iter() {
                  if x < pivot {
                      res.push(x);
                  }
              }
              for &x in nums.iter() {
                  if x == pivot {
                      res.push(x);
                  }
              }
              for &x in nums.iter() {
                  if x > pivot {
                      res.push(x);
                  }
              }
              res
          }
        `,
        php: code`
          function pivotArray($nums, $pivot) {
              $res = [];
              foreach ($nums as $x) if ($x < $pivot) $res[] = $x;
              foreach ($nums as $x) if ($x == $pivot) $res[] = $x;
              foreach ($nums as $x) if ($x > $pivot) $res[] = $x;
              return $res;
          }
        `,
        ruby: code`
          def pivotArray(nums, pivot)
            nums.select { |x| x < pivot } + nums.select { |x| x == pivot } + nums.select { |x| x > pivot }
          end
        `,
      },
    };
  })(),

  // ── Minimum Rounds to Complete All Tasks (LC 2244) ──────────────
  (() => {
    const ref = (tasks: number[]) => {
      const count = new Map<number, number>();
      for (const t of tasks) count.set(t, (count.get(t) || 0) + 1);
      // dp[c] = fewest rounds of size 2 or 3 that add up to exactly c.
      const INF = 1e9;
      const dp = [0, INF];
      for (let c = 2; c <= tasks.length; c++) dp.push(Math.min(dp[c - 2], c >= 3 ? dp[c - 3] : INF) + 1);
      let total = 0;
      let ok = true;
      count.forEach((c) => {
        if (dp[c] >= INF) ok = false;
        else total += dp[c];
      });
      return ok ? total : -1;
    };
    return {
      slug: "minimum-rounds-to-complete-all-tasks",
      title: "Minimum Rounds to Complete All Tasks",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Counting", "Amazon", "Google"],
      signature: { funcName: "minimumRounds", params: [{ name: "tasks", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`tasks[i]` is the difficulty level of the `i`-th task. In one **round** you finish either **2** or **3** tasks, and all tasks finished in the same round must have the **same** difficulty level.\n\nReturn the minimum number of rounds needed to finish every task, or `-1` if it cannot be done.",
        [
          { in: "tasks = [3,3,8,3,8,8,8,3,3]", out: "4", note: "Level 3 has five tasks: a round of 3 and a round of 2. Level 8 has four tasks: two rounds of 2. Total 4." },
          { in: "tasks = [6,6,1]", out: "-1", note: "The single level-1 task can never be part of a round." },
          { in: "tasks = [9,9,9,9,9,9,9]", out: "3", note: "Seven tasks: 3 + 2 + 2." },
        ],
        ["1 <= tasks.length <= 10^5", "1 <= tasks[i] <= 10^9"]),
      hints: [
        "Different difficulty levels never share a round, so each level can be solved on its own.",
        "For a level with `c` tasks, what is the fewest rounds of size 2 or 3 adding up to `c`? When is it impossible?",
        "Only `c = 1` is impossible. Otherwise use as many 3s as possible: the answer is `ceil(c / 3)`.",
      ],
      editorial: explain({
        idea: "Group tasks by level and count each group. A count of 1 cannot be written as a sum of 2s and 3s; every other count `c` needs exactly `ceil(c / 3)` rounds.",
        steps: [
          "Count how many tasks each difficulty level has.",
          "If any level has exactly one task, return `-1`.",
          "Otherwise add `(c + 2) / 3` (integer division) for every level's count `c`.",
          "Return the total.",
        ],
        why: "No round can hold more than 3 tasks, so at least `ceil(c / 3)` rounds are needed. That many always suffice for `c >= 2`: if `c % 3 == 0` use only 3s; if `c % 3 == 2` add one round of 2; if `c % 3 == 1` (so `c >= 4`) turn one 3 into two 2s — `3k + 1 = 3(k - 1) + 2 + 2`, which is `k + 1 = ceil(c / 3)` rounds.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A count of 1 makes the whole answer `-1`, not just that level's contribution.",
          "Greedy 'take a 3 whenever possible' fails on `c = 4` (3 + 1); the closed form handles it.",
          "Difficulty values go up to `10^9`, so count with a hash map (or by sorting), not a direct-address array.",
        ],
      }),
      examples: [
        { input: "[3,3,8,3,8,8,8,3,3]", expectedOutput: "4" },
        { input: "[6,6,1]", expectedOutput: "-1" },
        { input: "[9,9,9,9,9,9,9]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const groups = pick(rng, [1, 1, 2, ri(rng, 2, 5), ri(rng, 4, 9)]);
        const big = rng() < 0.3;
        const used = new Set<number>();
        const tasks: number[] = [];
        for (let i = 0; i < groups; i++) {
          let v = big ? ri(rng, 1, 1000000000) : ri(rng, 1, 20);
          while (used.has(v)) v = big ? ri(rng, 1, 1000000000) : ri(rng, 1, 20);
          used.add(v);
          const c = rng() < 0.05 ? 1 : ri(rng, 2, 10);
          for (let j = 0; j < c; j++) tasks.push(v);
        }
        shuffle(rng, tasks);
        return { input: fmtIntArr(tasks), expectedOutput: String(ref(tasks)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def minimumRounds(tasks: List[int]) -> int:
              rounds = 0
              for c in Counter(tasks).values():
                  if c == 1:
                      return -1
                  rounds += (c + 2) // 3
              return rounds
        `,
        javascript: code`
          var minimumRounds = function(tasks) {
              var count = new Map();
              for (var i = 0; i < tasks.length; i++) {
                  var cur = count.get(tasks[i]);
                  count.set(tasks[i], (cur === undefined ? 0 : cur) + 1);
              }
              var rounds = 0;
              var possible = true;
              count.forEach(function(c) {
                  if (c === 1) possible = false;
                  rounds += Math.floor((c + 2) / 3);
              });
              return possible ? rounds : -1;
          };
        `,
        typescript: code`
          function minimumRounds(tasks: number[]): number {
              var count: { [k: string]: number } = {};
              for (var i = 0; i < tasks.length; i++) {
                  var key = "" + tasks[i];
                  count[key] = (count[key] === undefined ? 0 : count[key]) + 1;
              }
              var rounds = 0;
              for (var k in count) {
                  if (!count.hasOwnProperty(k)) continue;
                  var c = count[k];
                  if (c === 1) return -1;
                  rounds += Math.floor((c + 2) / 3);
              }
              return rounds;
          }
        `,
        java: code`
          public static int minimumRounds(int[] tasks) {
              Map<Integer, Integer> count = new HashMap<>();
              for (int t : tasks) count.merge(t, 1, Integer::sum);
              int rounds = 0;
              for (int c : count.values()) {
                  if (c == 1) return -1;
                  rounds += (c + 2) / 3;
              }
              return rounds;
          }
        `,
        cpp: code`
          int minimumRounds(vector<int>& tasks) {
              unordered_map<int, int> count;
              for (int t : tasks) count[t]++;
              int rounds = 0;
              for (auto& kv : count) {
                  if (kv.second == 1) return -1;
                  rounds += (kv.second + 2) / 3;
              }
              return rounds;
          }
        `,
        c: code`
          static int cmpRoundsAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int minimumRounds(int* tasks, int tasksSize) {
              int* a = (int*)malloc(sizeof(int) * (tasksSize + 1));
              for (int i = 0; i < tasksSize; i++) a[i] = tasks[i];
              qsort(a, tasksSize, sizeof(int), cmpRoundsAsc);
              int rounds = 0;
              int i = 0;
              while (i < tasksSize) {
                  int j = i;
                  while (j < tasksSize && a[j] == a[i]) j++;
                  int c = j - i;
                  if (c == 1) {
                      free(a);
                      return -1;
                  }
                  rounds += (c + 2) / 3;
                  i = j;
              }
              free(a);
              return rounds;
          }
        `,
        csharp: code`
          public static int MinimumRounds(int[] tasks)
          {
              var count = new Dictionary<int, int>();
              foreach (int t in tasks)
              {
                  count.TryGetValue(t, out int cur);
                  count[t] = cur + 1;
              }
              int rounds = 0;
              foreach (int c in count.Values)
              {
                  if (c == 1) return -1;
                  rounds += (c + 2) / 3;
              }
              return rounds;
          }
        `,
        go: code`
          func minimumRounds(tasks []int) int {
          	count := map[int]int{}
          	for _, t := range tasks {
          		count[t]++
          	}
          	rounds := 0
          	for _, c := range count {
          		if c == 1 {
          			return -1
          		}
          		rounds += (c + 2) / 3
          	}
          	return rounds
          }
        `,
        kotlin: code`
          fun minimumRounds(tasks: IntArray): Int {
              val count = HashMap<Int, Int>()
              for (t in tasks) count[t] = (count[t] ?: 0) + 1
              var rounds = 0
              for (c in count.values) {
                  if (c == 1) return -1
                  rounds += (c + 2) / 3
              }
              return rounds
          }
        `,
        swift: code`
          func minimumRounds(_ tasks: [Int]) -> Int {
              var count = [Int: Int]()
              for t in tasks { count[t, default: 0] += 1 }
              var rounds = 0
              for c in count.values {
                  if c == 1 { return -1 }
                  rounds += (c + 2) / 3
              }
              return rounds
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minimumRounds(tasks: Vec<i32>) -> i32 {
              let mut count: HashMap<i32, i32> = HashMap::new();
              for &t in tasks.iter() {
                  *count.entry(t).or_insert(0) += 1;
              }
              let mut rounds = 0;
              for (_, &c) in count.iter() {
                  if c == 1 {
                      return -1;
                  }
                  rounds += (c + 2) / 3;
              }
              rounds
          }
        `,
        php: code`
          function minimumRounds($tasks) {
              $count = [];
              foreach ($tasks as $t) {
                  $count[$t] = (isset($count[$t]) ? $count[$t] : 0) + 1;
              }
              $rounds = 0;
              foreach ($count as $c) {
                  if ($c == 1) return -1;
                  $rounds += intdiv($c + 2, 3);
              }
              return $rounds;
          }
        `,
        ruby: code`
          def minimumRounds(tasks)
            count = Hash.new(0)
            tasks.each { |t| count[t] += 1 }
            rounds = 0
            count.each_value do |c|
              return -1 if c == 1
              rounds += (c + 2) / 3
            end
            rounds
          end
        `,
      },
    };
  })(),

  // ── Minimum Average Difference (LC 2256) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let best = -1;
      let bestDiff = Infinity;
      for (let i = 0; i < n; i++) {
        let l = 0;
        let r = 0;
        for (let j = 0; j <= i; j++) l += nums[j];
        for (let j = i + 1; j < n; j++) r += nums[j];
        const la = Math.floor(l / (i + 1));
        const ra = n - i - 1 === 0 ? 0 : Math.floor(r / (n - i - 1));
        const d = Math.abs(la - ra);
        if (d < bestDiff) {
          bestDiff = d;
          best = i;
        }
      }
      return best;
    };
    return {
      slug: "minimum-average-difference",
      title: "Minimum Average Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Microsoft"],
      signature: { funcName: "minimumAverageDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "For an index `i` of the 0-indexed array `nums` (length `n`), the **average difference** is the absolute difference between:\n\n- the average of the first `i + 1` elements, and\n- the average of the last `n - i - 1` elements.\n\nBoth averages are rounded **down** to the nearest integer, and the average of zero elements is taken to be `0`.\n\nReturn the index with the **minimum** average difference. If several indices tie, return the **smallest** one.",
        [
          { in: "nums = [3,8,1,6,2]", out: "2", note: "At index 2 the first three elements average 12 / 3 = 4 and the last two average 8 / 2 = 4, a difference of 0." },
          { in: "nums = [0]", out: "0", note: "The only index: 0 versus the empty average 0." },
          { in: "nums = [5,5,5,1]", out: "0", note: "Indices 0 and 1 both give a difference of 2; the smaller index wins." },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^5"]),
      hints: [
        "Recomputing both sums for every index is quadratic. What can you precompute?",
        "With the total sum and a running prefix sum, the suffix sum is `total - prefix`.",
        "Sums reach `10^10`, so keep them in 64-bit integers; remember the right side is empty at the last index.",
      ],
      editorial: explain({
        idea: "A running prefix sum plus the total gives both sides' sums at every index in O(1), so one pass evaluates every candidate.",
        steps: [
          "Compute `total`, the sum of all elements (in 64-bit).",
          "Sweep `i` from left to right, adding `nums[i]` to `prefix`.",
          "Left average is `prefix / (i + 1)`; right average is `(total - prefix) / (n - i - 1)`, or 0 when `i = n - 1`.",
          "Track the smallest absolute difference, updating only on a strict improvement so the first index wins ties.",
        ],
        why: "The two sums are exactly the prefix and suffix sums at `i`, and the averages are floor divisions of non-negative numbers, so integer division matches the definition. Strictly-smaller updates during a left-to-right sweep keep the earliest index among equal differences.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "At `i = n - 1` the right side is empty — guard the division by zero and use 0.",
          "The sums overflow 32-bit integers (up to `10^5 * 10^5`).",
          "Use `<`, not `<=`, when comparing differences, or a later index steals the tie.",
        ],
      }),
      examples: [
        { input: "[3,8,1,6,2]", expectedOutput: "2" },
        { input: "[0]", expectedOutput: "0" },
        { input: "[5,5,5,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const hi = pick(rng, [0, 5, 100, 100000, 100000, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumAverageDifference(nums: List[int]) -> int:
              n = len(nums)
              total = sum(nums)
              prefix = 0
              best, best_diff = 0, -1
              for i in range(n):
                  prefix += nums[i]
                  left = prefix // (i + 1)
                  right = (total - prefix) // (n - i - 1) if n - i - 1 > 0 else 0
                  d = abs(left - right)
                  if best_diff < 0 or d < best_diff:
                      best_diff = d
                      best = i
              return best
        `,
        javascript: code`
          var minimumAverageDifference = function(nums) {
              var n = nums.length;
              var total = 0;
              for (var i = 0; i < n; i++) total += nums[i];
              var prefix = 0, best = 0, bestDiff = -1;
              for (var j = 0; j < n; j++) {
                  prefix += nums[j];
                  var left = Math.floor(prefix / (j + 1));
                  var right = n - j - 1 > 0 ? Math.floor((total - prefix) / (n - j - 1)) : 0;
                  var d = Math.abs(left - right);
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d;
                      best = j;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumAverageDifference(nums: number[]): number {
              var n = nums.length;
              var total = 0;
              for (var i = 0; i < n; i++) total += nums[i];
              var prefix = 0, best = 0, bestDiff = -1;
              for (var j = 0; j < n; j++) {
                  prefix += nums[j];
                  var left = Math.floor(prefix / (j + 1));
                  var right = n - j - 1 > 0 ? Math.floor((total - prefix) / (n - j - 1)) : 0;
                  var d = Math.abs(left - right);
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d;
                      best = j;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumAverageDifference(int[] nums) {
              int n = nums.length;
              long total = 0;
              for (int x : nums) total += x;
              long prefix = 0, bestDiff = -1;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  prefix += nums[i];
                  long left = prefix / (i + 1);
                  long right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0;
                  long d = Math.abs(left - right);
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d;
                      best = i;
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int minimumAverageDifference(vector<int>& nums) {
              int n = nums.size();
              long long total = 0;
              for (int x : nums) total += x;
              long long prefix = 0, bestDiff = -1;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  prefix += nums[i];
                  long long left = prefix / (i + 1);
                  long long right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0;
                  long long d = left > right ? left - right : right - left;
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d;
                      best = i;
                  }
              }
              return best;
          }
        `,
        c: code`
          int minimumAverageDifference(int* nums, int numsSize) {
              int n = numsSize;
              long long total = 0;
              for (int i = 0; i < n; i++) total += nums[i];
              long long prefix = 0, bestDiff = -1;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  prefix += nums[i];
                  long long left = prefix / (i + 1);
                  long long right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0;
                  long long d = left > right ? left - right : right - left;
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d;
                      best = i;
                  }
              }
              return best;
          }
        `,
        csharp: code`
          public static int MinimumAverageDifference(int[] nums)
          {
              int n = nums.Length;
              long total = 0;
              foreach (int x in nums) total += x;
              long prefix = 0, bestDiff = -1;
              int best = 0;
              for (int i = 0; i < n; i++)
              {
                  prefix += nums[i];
                  long left = prefix / (i + 1);
                  long right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0;
                  long d = Math.Abs(left - right);
                  if (bestDiff < 0 || d < bestDiff)
                  {
                      bestDiff = d;
                      best = i;
                  }
              }
              return best;
          }
        `,
        go: code`
          func minimumAverageDifference(nums []int) int {
          	n := len(nums)
          	var total int64
          	for _, x := range nums {
          		total += int64(x)
          	}
          	var prefix int64
          	var bestDiff int64 = -1
          	best := 0
          	for i := 0; i < n; i++ {
          		prefix += int64(nums[i])
          		left := prefix / int64(i+1)
          		var right int64
          		if n-i-1 > 0 {
          			right = (total - prefix) / int64(n-i-1)
          		}
          		d := left - right
          		if d < 0 {
          			d = -d
          		}
          		if bestDiff < 0 || d < bestDiff {
          			bestDiff = d
          			best = i
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minimumAverageDifference(nums: IntArray): Int {
              val n = nums.size
              var total = 0L
              for (x in nums) total += x
              var prefix = 0L
              var bestDiff = -1L
              var best = 0
              for (i in 0 until n) {
                  prefix += nums[i]
                  val left = prefix / (i + 1)
                  val right = if (n - i - 1 > 0) (total - prefix) / (n - i - 1) else 0L
                  val d = Math.abs(left - right)
                  if (bestDiff < 0 || d < bestDiff) {
                      bestDiff = d
                      best = i
                  }
              }
              return best
          }
        `,
        swift: code`
          func minimumAverageDifference(_ nums: [Int]) -> Int {
              let n = nums.count
              var total = 0
              for x in nums { total += x }
              var prefix = 0
              var bestDiff = -1
              var best = 0
              for i in 0..<n {
                  prefix += nums[i]
                  let left = prefix / (i + 1)
                  let right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0
                  let d = abs(left - right)
                  if bestDiff < 0 || d < bestDiff {
                      bestDiff = d
                      best = i
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumAverageDifference(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut total: i64 = 0;
              for &x in nums.iter() {
                  total += x as i64;
              }
              let mut prefix: i64 = 0;
              let mut best_diff: i64 = -1;
              let mut best: i32 = 0;
              for i in 0..n {
                  prefix += nums[i] as i64;
                  let left = prefix / (i as i64 + 1);
                  let rest = (n - i - 1) as i64;
                  let right = if rest > 0 { (total - prefix) / rest } else { 0 };
                  let d = (left - right).abs();
                  if best_diff < 0 || d < best_diff {
                      best_diff = d;
                      best = i as i32;
                  }
              }
              best
          }
        `,
        php: code`
          function minimumAverageDifference($nums) {
              $n = count($nums);
              $total = array_sum($nums);
              $prefix = 0;
              $bestDiff = -1;
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $prefix += $nums[$i];
                  $left = intdiv($prefix, $i + 1);
                  $right = $n - $i - 1 > 0 ? intdiv($total - $prefix, $n - $i - 1) : 0;
                  $d = abs($left - $right);
                  if ($bestDiff < 0 || $d < $bestDiff) {
                      $bestDiff = $d;
                      $best = $i;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumAverageDifference(nums)
            n = nums.length
            total = nums.sum
            prefix = 0
            best_diff = -1
            best = 0
            (0...n).each do |i|
              prefix += nums[i]
              left = prefix / (i + 1)
              right = n - i - 1 > 0 ? (total - prefix) / (n - i - 1) : 0
              d = (left - right).abs
              if best_diff < 0 || d < best_diff
                best_diff = d
                best = i
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Number of Ways to Split Array (LC 2270) ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let ways = 0;
      for (let i = 0; i < nums.length - 1; i++) {
        let l = 0;
        let r = 0;
        for (let j = 0; j <= i; j++) l += nums[j];
        for (let j = i + 1; j < nums.length; j++) r += nums[j];
        if (l >= r) ways++;
      }
      return ways;
    };
    return {
      slug: "number-of-ways-to-split-array",
      title: "Number of Ways to Split Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Microsoft"],
      signature: { funcName: "waysToSplitArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **split** of the integer array `nums` (length `n`) at index `i`, where `0 <= i < n - 1`, cuts it into a left part `nums[0..i]` and a right part `nums[i+1..n-1]`. Both parts are therefore non-empty.\n\nThe split is **valid** when the sum of the left part is **greater than or equal to** the sum of the right part.\n\nReturn the number of valid splits.",
        [
          { in: "nums = [4,-2,6,-3]", out: "2", note: "Cutting after index 0 gives 4 vs 1, and after index 2 gives 8 vs -3. Cutting after index 1 gives 2 vs 3, which is not valid." },
          { in: "nums = [1,1]", out: "1" },
          { in: "nums = [-5,3,3]", out: "0" },
        ],
        ["2 <= nums.length <= 10^5", "-10^5 <= nums[i] <= 10^5"]),
      hints: [
        "Summing both sides from scratch for every cut is quadratic.",
        "If you know the total, the right part's sum is `total - left`.",
        "Sweep once with a running left sum (64-bit: it can reach `10^10` in magnitude) and stop before the last index.",
      ],
      editorial: explain({
        idea: "The right part's sum is always the total minus the left part's sum, so a single prefix sweep checks every cut in O(1).",
        steps: [
          "Compute `total`, the sum of the whole array, in a 64-bit integer.",
          "Sweep `i` from 0 to `n - 2`, adding `nums[i]` to `left`.",
          "Count the cut when `left >= total - left`.",
          "Return the count.",
        ],
        why: "At cut `i` the left part is exactly the prefix `nums[0..i]` and the right part is everything else, whose sum is `total - left`. Every legal cut is visited once, and the last index is excluded because the right part must be non-empty.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The loop stops at `n - 2`; cutting after the last element leaves the right side empty.",
          "Negative numbers mean the left sum is not monotonic — do not stop early or binary search.",
          "Sums reach `10^10` in magnitude, beyond 32-bit range.",
        ],
      }),
      examples: [
        { input: "[4,-2,6,-3]", expectedOutput: "2" },
        { input: "[1,1]", expectedOutput: "1" },
        { input: "[-5,3,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, ri(rng, 4, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const span = pick(rng, [3, 100, 100000]);
        const skew = pick(rng, [0, 0, -span >> 1, span >> 1]);
        const nums = Array.from({ length: n }, () => Math.max(-100000, Math.min(100000, ri(rng, -span, span) + skew)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def waysToSplitArray(nums: List[int]) -> int:
              total = sum(nums)
              left = 0
              ways = 0
              for i in range(len(nums) - 1):
                  left += nums[i]
                  if left >= total - left:
                      ways += 1
              return ways
        `,
        javascript: code`
          var waysToSplitArray = function(nums) {
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              var left = 0, ways = 0;
              for (var j = 0; j < nums.length - 1; j++) {
                  left += nums[j];
                  if (left >= total - left) ways++;
              }
              return ways;
          };
        `,
        typescript: code`
          function waysToSplitArray(nums: number[]): number {
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              var left = 0, ways = 0;
              for (var j = 0; j < nums.length - 1; j++) {
                  left += nums[j];
                  if (left >= total - left) ways++;
              }
              return ways;
          }
        `,
        java: code`
          public static int waysToSplitArray(int[] nums) {
              long total = 0;
              for (int x : nums) total += x;
              long left = 0;
              int ways = 0;
              for (int i = 0; i < nums.length - 1; i++) {
                  left += nums[i];
                  if (left >= total - left) ways++;
              }
              return ways;
          }
        `,
        cpp: code`
          int waysToSplitArray(vector<int>& nums) {
              long long total = 0;
              for (int x : nums) total += x;
              long long left = 0;
              int ways = 0;
              for (int i = 0; i + 1 < (int)nums.size(); i++) {
                  left += nums[i];
                  if (left >= total - left) ways++;
              }
              return ways;
          }
        `,
        c: code`
          int waysToSplitArray(int* nums, int numsSize) {
              long long total = 0;
              for (int i = 0; i < numsSize; i++) total += nums[i];
              long long left = 0;
              int ways = 0;
              for (int i = 0; i + 1 < numsSize; i++) {
                  left += nums[i];
                  if (left >= total - left) ways++;
              }
              return ways;
          }
        `,
        csharp: code`
          public static int WaysToSplitArray(int[] nums)
          {
              long total = 0;
              foreach (int x in nums) total += x;
              long left = 0;
              int ways = 0;
              for (int i = 0; i < nums.Length - 1; i++)
              {
                  left += nums[i];
                  if (left >= total - left) ways++;
              }
              return ways;
          }
        `,
        go: code`
          func waysToSplitArray(nums []int) int {
          	var total int64
          	for _, x := range nums {
          		total += int64(x)
          	}
          	var left int64
          	ways := 0
          	for i := 0; i+1 < len(nums); i++ {
          		left += int64(nums[i])
          		if left >= total-left {
          			ways++
          		}
          	}
          	return ways
          }
        `,
        kotlin: code`
          fun waysToSplitArray(nums: IntArray): Int {
              var total = 0L
              for (x in nums) total += x
              var left = 0L
              var ways = 0
              for (i in 0 until nums.size - 1) {
                  left += nums[i]
                  if (left >= total - left) ways++
              }
              return ways
          }
        `,
        swift: code`
          func waysToSplitArray(_ nums: [Int]) -> Int {
              var total = 0
              for x in nums { total += x }
              var left = 0
              var ways = 0
              for i in 0..<(nums.count - 1) {
                  left += nums[i]
                  if left >= total - left { ways += 1 }
              }
              return ways
          }
        `,
        rust: code`
          fn waysToSplitArray(nums: Vec<i32>) -> i32 {
              let mut total: i64 = 0;
              for &x in nums.iter() {
                  total += x as i64;
              }
              let mut left: i64 = 0;
              let mut ways = 0;
              for i in 0..nums.len() - 1 {
                  left += nums[i] as i64;
                  if left >= total - left {
                      ways += 1;
                  }
              }
              ways
          }
        `,
        php: code`
          function waysToSplitArray($nums) {
              $total = array_sum($nums);
              $left = 0;
              $ways = 0;
              $n = count($nums);
              for ($i = 0; $i < $n - 1; $i++) {
                  $left += $nums[$i];
                  if ($left >= $total - $left) $ways++;
              }
              return $ways;
          }
        `,
        ruby: code`
          def waysToSplitArray(nums)
            total = nums.sum
            left = 0
            ways = 0
            (0...(nums.length - 1)).each do |i|
              left += nums[i]
              ways += 1 if left >= total - left
            end
            ways
          end
        `,
      },
    };
  })(),

  // ── Maximum Bags With Full Capacity of Rocks (LC 2279) ──────────
  (() => {
    const ref = (capacity: number[], rocks: number[], additionalRocks: number) => {
      const need = capacity.map((c, i) => c - rocks[i]).sort((a, b) => a - b);
      let left = additionalRocks;
      let full = 0;
      for (const d of need) {
        if (d > left) break;
        left -= d;
        full++;
      }
      return full;
    };
    return {
      slug: "maximum-bags-with-full-capacity-of-rocks",
      title: "Maximum Bags With Full Capacity of Rocks",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "maximumBags",
        params: [
          { name: "capacity", type: "int[]" as const },
          { name: "rocks", type: "int[]" as const },
          { name: "additionalRocks", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` bags. Bag `i` can hold at most `capacity[i]` rocks and currently holds `rocks[i]` of them. You also have `additionalRocks` spare rocks that you may drop into any bags you like.\n\nA bag is **full** when it holds exactly its capacity. Return the **maximum** number of bags that can be full after you place some (or all) of the spare rocks.",
        [
          { in: "capacity = [3,5,2,6], rocks = [1,5,0,3], additionalRocks = 4", out: "3", note: "Bag 1 is already full. Spend 2 rocks on bag 0 and 2 on bag 2. Bag 3 would need 3 more." },
          { in: "capacity = [10,4,7], rocks = [2,4,6], additionalRocks = 1", out: "2", note: "Bag 1 is full and one rock completes bag 2." },
          { in: "capacity = [9], rocks = [0], additionalRocks = 5", out: "0" },
        ],
        ["n == capacity.length == rocks.length", "1 <= n <= 5 * 10^4", "1 <= capacity[i] <= 10^9", "0 <= rocks[i] <= capacity[i]", "1 <= additionalRocks <= 10^9"]),
      hints: [
        "Only the shortfall `capacity[i] - rocks[i]` of each bag matters.",
        "To complete as many bags as possible with a fixed budget, which bags should you complete first?",
        "Sort the shortfalls ascending and fill bags until the next shortfall exceeds what is left.",
      ],
      editorial: explain({
        idea: "Every bag costs its shortfall to complete and every completed bag is worth the same, so the cheapest bags should be completed first.",
        steps: [
          "Compute `need[i] = capacity[i] - rocks[i]` for every bag.",
          "Sort `need` ascending.",
          "Walk the sorted list, subtracting each shortfall from the remaining rocks while it fits, and count the bags completed.",
          "Stop at the first shortfall that does not fit.",
        ],
        why: "Suppose an optimal plan completes `k` bags. Replacing them by the `k` cheapest bags never costs more, so the `k` smallest shortfalls also fit in the budget. Hence the greedy prefix of the sorted shortfalls reaches the optimum.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Bags that are already full have shortfall 0 and count for free.",
          "Once a shortfall does not fit, the larger ones after it will not either — stop.",
          "Summing all shortfalls can overflow 32-bit; subtracting from the budget only while it fits stays in range.",
        ],
      }),
      examples: [
        { input: "[3,5,2,6]\n[1,5,0,3]\n4", expectedOutput: "3" },
        { input: "[10,4,7]\n[2,4,6]\n1", expectedOutput: "2" },
        { input: "[9]\n[0]\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const hi = pick(rng, [5, 100, 1000000000]);
        const capacity = Array.from({ length: n }, () => ri(rng, 1, hi));
        const rocks = capacity.map((c) => (rng() < 0.2 ? c : ri(rng, 0, c)));
        let deficit = 0;
        for (let i = 0; i < n; i++) deficit += capacity[i] - rocks[i];
        const additionalRocks = ri(rng, 1, Math.max(1, Math.min(1000000000, deficit + 3)));
        return {
          input: `${fmtIntArr(capacity)}\n${fmtIntArr(rocks)}\n${additionalRocks}`,
          expectedOutput: String(ref(capacity, rocks, additionalRocks)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumBags(capacity: List[int], rocks: List[int], additionalRocks: int) -> int:
              need = sorted(c - r for c, r in zip(capacity, rocks))
              left = additionalRocks
              full = 0
              for d in need:
                  if d > left:
                      break
                  left -= d
                  full += 1
              return full
        `,
        javascript: code`
          var maximumBags = function(capacity, rocks, additionalRocks) {
              var need = [];
              for (var i = 0; i < capacity.length; i++) need.push(capacity[i] - rocks[i]);
              need.sort(function(a, b) { return a - b; });
              var left = additionalRocks, full = 0;
              for (var j = 0; j < need.length; j++) {
                  if (need[j] > left) break;
                  left -= need[j];
                  full++;
              }
              return full;
          };
        `,
        typescript: code`
          function maximumBags(capacity: number[], rocks: number[], additionalRocks: number): number {
              var need: number[] = [];
              for (var i = 0; i < capacity.length; i++) need.push(capacity[i] - rocks[i]);
              need.sort(function(a: number, b: number) { return a - b; });
              var left = additionalRocks, full = 0;
              for (var j = 0; j < need.length; j++) {
                  if (need[j] > left) break;
                  left -= need[j];
                  full++;
              }
              return full;
          }
        `,
        java: code`
          public static int maximumBags(int[] capacity, int[] rocks, int additionalRocks) {
              int n = capacity.length;
              int[] need = new int[n];
              for (int i = 0; i < n; i++) need[i] = capacity[i] - rocks[i];
              Arrays.sort(need);
              int left = additionalRocks, full = 0;
              for (int d : need) {
                  if (d > left) break;
                  left -= d;
                  full++;
              }
              return full;
          }
        `,
        cpp: code`
          int maximumBags(vector<int>& capacity, vector<int>& rocks, int additionalRocks) {
              int n = capacity.size();
              vector<int> need(n);
              for (int i = 0; i < n; i++) need[i] = capacity[i] - rocks[i];
              sort(need.begin(), need.end());
              int left = additionalRocks, full = 0;
              for (int d : need) {
                  if (d > left) break;
                  left -= d;
                  full++;
              }
              return full;
          }
        `,
        c: code`
          static int cmpBagsAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int maximumBags(int* capacity, int capacitySize, int* rocks, int rocksSize, int additionalRocks) {
              int n = capacitySize;
              int* need = (int*)malloc(sizeof(int) * (n + 1));
              for (int i = 0; i < n; i++) need[i] = capacity[i] - rocks[i];
              qsort(need, n, sizeof(int), cmpBagsAsc);
              int left = additionalRocks, full = 0;
              for (int i = 0; i < n; i++) {
                  if (need[i] > left) break;
                  left -= need[i];
                  full++;
              }
              free(need);
              return full;
          }
        `,
        csharp: code`
          public static int MaximumBags(int[] capacity, int[] rocks, int additionalRocks)
          {
              int n = capacity.Length;
              int[] need = new int[n];
              for (int i = 0; i < n; i++) need[i] = capacity[i] - rocks[i];
              Array.Sort(need);
              int left = additionalRocks, full = 0;
              foreach (int d in need)
              {
                  if (d > left) break;
                  left -= d;
                  full++;
              }
              return full;
          }
        `,
        go: code`
          func maximumBags(capacity []int, rocks []int, additionalRocks int) int {
          	n := len(capacity)
          	need := make([]int, n)
          	for i := 0; i < n; i++ {
          		need[i] = capacity[i] - rocks[i]
          	}
          	sort.Ints(need)
          	left, full := additionalRocks, 0
          	for _, d := range need {
          		if d > left {
          			break
          		}
          		left -= d
          		full++
          	}
          	return full
          }
        `,
        kotlin: code`
          fun maximumBags(capacity: IntArray, rocks: IntArray, additionalRocks: Int): Int {
              val need = IntArray(capacity.size) { capacity[it] - rocks[it] }
              need.sort()
              var left = additionalRocks
              var full = 0
              for (d in need) {
                  if (d > left) break
                  left -= d
                  full++
              }
              return full
          }
        `,
        swift: code`
          func maximumBags(_ capacity: [Int], _ rocks: [Int], _ additionalRocks: Int) -> Int {
              var need = [Int]()
              for i in 0..<capacity.count { need.append(capacity[i] - rocks[i]) }
              need.sort()
              var left = additionalRocks
              var full = 0
              for d in need {
                  if d > left { break }
                  left -= d
                  full += 1
              }
              return full
          }
        `,
        rust: code`
          fn maximumBags(capacity: Vec<i32>, rocks: Vec<i32>, additionalRocks: i32) -> i32 {
              let mut need: Vec<i32> = Vec::with_capacity(capacity.len());
              for i in 0..capacity.len() {
                  need.push(capacity[i] - rocks[i]);
              }
              need.sort();
              let mut left = additionalRocks;
              let mut full = 0;
              for &d in need.iter() {
                  if d > left {
                      break;
                  }
                  left -= d;
                  full += 1;
              }
              full
          }
        `,
        php: code`
          function maximumBags($capacity, $rocks, $additionalRocks) {
              $need = [];
              $n = count($capacity);
              for ($i = 0; $i < $n; $i++) $need[] = $capacity[$i] - $rocks[$i];
              sort($need);
              $left = $additionalRocks;
              $full = 0;
              foreach ($need as $d) {
                  if ($d > $left) break;
                  $left -= $d;
                  $full++;
              }
              return $full;
          }
        `,
        ruby: code`
          def maximumBags(capacity, rocks, additionalRocks)
            need = capacity.each_index.map { |i| capacity[i] - rocks[i] }.sort
            left = additionalRocks
            full = 0
            need.each do |d|
              break if d > left
              left -= d
              full += 1
            end
            full
          end
        `,
      },
    };
  })(),

  // ── Minimum Lines to Represent a Line Chart (LC 2280) ───────────
  (() => {
    // Exact reference: cross-multiplied slopes in BigInt (products reach 10^18).
    const ref = (stockPrices: number[][]) => {
      const p = stockPrices.map((x) => [x[0], x[1]]).sort((a, b) => a[0] - b[0]);
      if (p.length < 2) return 0;
      let lines = 1;
      for (let i = 2; i < p.length; i++) {
        const dx1 = BigInt(p[i - 1][0] - p[i - 2][0]);
        const dy1 = BigInt(p[i - 1][1] - p[i - 2][1]);
        const dx2 = BigInt(p[i][0] - p[i - 1][0]);
        const dy2 = BigInt(p[i][1] - p[i - 1][1]);
        if (dy1 * dx2 !== dy2 * dx1) lines++;
      }
      return lines;
    };
    return {
      slug: "minimum-lines-to-represent-a-line-chart",
      title: "Minimum Lines to Represent a Line Chart",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Geometry", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumLines", params: [{ name: "stockPrices", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`stockPrices[i] = [day_i, price_i]` says a stock closed at `price_i` on `day_i`. The points are given in **no particular order**, and every day appears at most once.\n\nA line chart is drawn by plotting the points on a plane and joining each point to the next one in order of day with a straight segment. Consecutive segments that lie on the same straight line can be drawn as one line.\n\nReturn the **minimum number of lines** needed to draw the chart. A single point needs 0 lines.",
        [
          { in: "stockPrices = [[2,10],[4,6],[1,12],[3,8],[6,8],[5,7]]", out: "2", note: "Sorted by day the prices fall by 2 per day up to day 4, then rise by 1 per day: two lines." },
          { in: "stockPrices = [[5,3]]", out: "0" },
          { in: "stockPrices = [[10,4],[20,9],[40,19]]", out: "1", note: "Both segments have slope 1/2." },
        ],
        ["1 <= stockPrices.length <= 10^5", "stockPrices[i].length == 2", "1 <= day_i, price_i <= 10^9", "All day_i are distinct"]),
      hints: [
        "Sort the points by day first; the chart joins neighbours in that order.",
        "A new line starts exactly where the slope between consecutive points changes.",
        "Comparing slopes as floating-point numbers fails for huge coordinates. Compare them exactly — reduce each slope `dy/dx` by `gcd(|dy|, dx)`, or cross-multiply in a type wide enough for `10^18`.",
      ],
      editorial: explain({
        idea: "After sorting by day, the chart is a polyline, and the number of lines is the number of segments minus the number of joints where the slope stays the same. The only subtlety is comparing slopes exactly.",
        steps: [
          "If there is one point, return 0.",
          "Sort the points by day.",
          "For each consecutive pair compute `dx > 0` and `dy`, and reduce both by `g = gcd(|dy|, dx)` so every slope has one canonical form.",
          "Count the first segment as a line, then add one more every time a segment's reduced `(dx, dy)` differs from the previous segment's.",
        ],
        why: "Two consecutive segments share their middle point, so they lie on one line exactly when their slopes are equal. Since `dx` is positive, the reduced fraction `(dy/g, dx/g)` is a unique representation of the slope, so equal pairs mean equal slopes and different pairs mean different slopes — no rounding is involved.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Slopes like `499999998/499999999` and `499999997/499999998` differ by about `4e-18`; doubles call them equal.",
          "Cross-multiplying needs 64-bit integers — the products reach `10^18` (and JavaScript numbers lose precision beyond `2^53`, so reduce by the gcd there).",
          "With one point the answer is 0, not 1.",
        ],
      }),
      examples: [
        { input: "[[2,10],[4,6],[1,12],[3,8],[6,8],[5,7]]", expectedOutput: "2" },
        { input: "[[5,3]]", expectedOutput: "0" },
        { input: "[[10,4],[20,9],[40,19]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 9);
        const pts: number[][] = [];
        if (mode === 0) {
          // Three points with huge, nearly equal slopes: floating-point slopes cannot tell them apart.
          const b = ri(rng, 400000000, 499999999);
          const a = b - ri(rng, 1, 5);
          const d = b - ri(rng, 0, 5);
          const c = d - (b - a) + ri(rng, -1, 1);
          const up = rng() < 0.5;
          const p0 = up ? 1 : 999999999;
          pts.push([1, p0], [1 + b, up ? p0 + a : p0 - a], [1 + b + d, up ? p0 + a + c : p0 - a - c]);
        } else if (mode === 1) {
          // Exactly equal slopes with large coordinates.
          const q = ri(rng, 1, 1000);
          const p = ri(rng, -1000, 1000);
          const lim = Math.floor(220000000 / Math.max(Math.abs(p), q));
          const k1 = ri(rng, 1, lim);
          const k2 = ri(rng, 1, lim);
          const d0 = ri(rng, 1, 1000);
          const p0 = 500000000;
          pts.push([d0, p0], [d0 + k1 * q, p0 + k1 * p], [d0 + (k1 + k2) * q, p0 + (k1 + k2) * p]);
          if (rng() < 0.5) {
            const last = pts[2];
            pts.push([last[0] + ri(rng, 1, 1000), last[1] + ri(rng, -1000, 1000)]);
          }
        } else {
          const n = pick(rng, [1, 2, 3, ri(rng, 4, 12), ri(rng, 10, 30)]);
          const big = rng() < 0.3;
          const stepHi = big ? 10000000 : 5;
          let day = ri(rng, 1, big ? 100000000 : 20);
          let price = big ? ri(rng, 300000000, 700000000) : ri(rng, 1, 60);
          pts.push([day, price]);
          let bx = 1;
          let by = 0;
          while (pts.length < n) {
            if (pts.length === 1 || rng() < 0.6) {
              bx = ri(rng, 1, stepHi);
              by = ri(rng, -stepHi, stepHi);
            }
            const f = ri(rng, 1, 3);
            const len = ri(rng, 1, 5);
            for (let j = 0; j < len && pts.length < n; j++) {
              day += bx * f;
              price = Math.min(1000000000, Math.max(1, price + by * f));
              pts.push([day, price]);
            }
          }
        }
        shuffle(rng, pts);
        return { input: fmtIntMat(pts), expectedOutput: String(ref(pts)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def minimumLines(stockPrices: List[List[int]]) -> int:
              p = sorted(stockPrices, key=lambda x: x[0])
              n = len(p)
              if n < 2:
                  return 0
              lines = 0
              prev = None
              for i in range(1, n):
                  dx = p[i][0] - p[i - 1][0]
                  dy = p[i][1] - p[i - 1][1]
                  g = gcd(abs(dy), dx)
                  cur = (dx // g, dy // g)
                  if cur != prev:
                      lines += 1
                  prev = cur
              return lines
        `,
        javascript: code`
          var minimumLines = function(stockPrices) {
              var p = stockPrices.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = p.length;
              if (n < 2) return 0;
              var gcd = function(a, b) {
                  while (b !== 0) { var t = a % b; a = b; b = t; }
                  return a;
              };
              var lines = 0, pdx = 0, pdy = 0;
              for (var i = 1; i < n; i++) {
                  var dx = p[i][0] - p[i - 1][0];
                  var dy = p[i][1] - p[i - 1][1];
                  var g = gcd(Math.abs(dy), dx);
                  dx /= g;
                  dy /= g;
                  if (i === 1 || dx !== pdx || dy !== pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              return lines;
          };
        `,
        typescript: code`
          function gcdLines(a: number, b: number): number {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          }

          function minimumLines(stockPrices: number[][]): number {
              var p: number[][] = stockPrices.slice();
              p.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });
              var n = p.length;
              if (n < 2) return 0;
              var lines = 0, pdx = 0, pdy = 0;
              for (var i = 1; i < n; i++) {
                  var dx = p[i][0] - p[i - 1][0];
                  var dy = p[i][1] - p[i - 1][1];
                  var g = gcdLines(Math.abs(dy), dx);
                  dx /= g;
                  dy /= g;
                  if (i === 1 || dx !== pdx || dy !== pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              return lines;
          }
        `,
        java: code`
          static int gcdLines(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int minimumLines(int[][] stockPrices) {
              int n = stockPrices.length;
              if (n < 2) return 0;
              int[][] p = stockPrices.clone();
              Arrays.sort(p, (a, b) -> Integer.compare(a[0], b[0]));
              int lines = 0, pdx = 0, pdy = 0;
              for (int i = 1; i < n; i++) {
                  int dx = p[i][0] - p[i - 1][0];
                  int dy = p[i][1] - p[i - 1][1];
                  int g = gcdLines(Math.abs(dy), dx);
                  dx /= g;
                  dy /= g;
                  if (i == 1 || dx != pdx || dy != pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              return lines;
          }
        `,
        cpp: code`
          static int gcdLines(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int minimumLines(vector<vector<int>>& stockPrices) {
              int n = stockPrices.size();
              if (n < 2) return 0;
              vector<vector<int>> p(stockPrices.begin(), stockPrices.end());
              sort(p.begin(), p.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
              int lines = 0, pdx = 0, pdy = 0;
              for (int i = 1; i < n; i++) {
                  int dx = p[i][0] - p[i - 1][0];
                  int dy = p[i][1] - p[i - 1][1];
                  int g = gcdLines(dy < 0 ? -dy : dy, dx);
                  dx /= g;
                  dy /= g;
                  if (i == 1 || dx != pdx || dy != pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              return lines;
          }
        `,
        c: code`
          static int gcdLines(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          static int cmpLinesByDay(const void* p, const void* q) {
              int a = (*(int* const*)p)[0], b = (*(int* const*)q)[0];
              return (a > b) - (a < b);
          }

          int minimumLines(int** stockPrices, int stockPricesSize, int* stockPricesColSize) {
              int n = stockPricesSize;
              if (n < 2) return 0;
              int** p = (int**)malloc(sizeof(int*) * n);
              for (int i = 0; i < n; i++) p[i] = stockPrices[i];
              qsort(p, n, sizeof(int*), cmpLinesByDay);
              int lines = 0, pdx = 0, pdy = 0;
              for (int i = 1; i < n; i++) {
                  int dx = p[i][0] - p[i - 1][0];
                  int dy = p[i][1] - p[i - 1][1];
                  int g = gcdLines(dy < 0 ? -dy : dy, dx);
                  dx /= g;
                  dy /= g;
                  if (i == 1 || dx != pdx || dy != pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              free(p);
              return lines;
          }
        `,
        csharp: code`
          static int GcdLines(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int MinimumLines(int[][] stockPrices)
          {
              int n = stockPrices.Length;
              if (n < 2) return 0;
              int[][] p = stockPrices.OrderBy(x => x[0]).ToArray();
              int lines = 0, pdx = 0, pdy = 0;
              for (int i = 1; i < n; i++)
              {
                  int dx = p[i][0] - p[i - 1][0];
                  int dy = p[i][1] - p[i - 1][1];
                  int g = GcdLines(Math.Abs(dy), dx);
                  dx /= g;
                  dy /= g;
                  if (i == 1 || dx != pdx || dy != pdy) lines++;
                  pdx = dx;
                  pdy = dy;
              }
              return lines;
          }
        `,
        go: code`
          func gcdLines(a, b int) int {
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return a
          }

          func minimumLines(stockPrices [][]int) int {
          	n := len(stockPrices)
          	if n < 2 {
          		return 0
          	}
          	p := make([][]int, n)
          	copy(p, stockPrices)
          	sort.Slice(p, func(i, j int) bool { return p[i][0] < p[j][0] })
          	lines, pdx, pdy := 0, 0, 0
          	for i := 1; i < n; i++ {
          		dx := p[i][0] - p[i-1][0]
          		dy := p[i][1] - p[i-1][1]
          		ady := dy
          		if ady < 0 {
          			ady = -ady
          		}
          		g := gcdLines(ady, dx)
          		dx /= g
          		dy /= g
          		if i == 1 || dx != pdx || dy != pdy {
          			lines++
          		}
          		pdx, pdy = dx, dy
          	}
          	return lines
          }
        `,
        kotlin: code`
          fun gcdLines(x: Int, y: Int): Int {
              var a = x
              var b = y
              while (b != 0) { val t = a % b; a = b; b = t }
              return a
          }

          fun minimumLines(stockPrices: Array<IntArray>): Int {
              val n = stockPrices.size
              if (n < 2) return 0
              val p = stockPrices.sortedBy { it[0] }
              var lines = 0
              var pdx = 0
              var pdy = 0
              for (i in 1 until n) {
                  var dx = p[i][0] - p[i - 1][0]
                  var dy = p[i][1] - p[i - 1][1]
                  val g = gcdLines(Math.abs(dy), dx)
                  dx /= g
                  dy /= g
                  if (i == 1 || dx != pdx || dy != pdy) lines++
                  pdx = dx
                  pdy = dy
              }
              return lines
          }
        `,
        swift: code`
          func gcdLines(_ x: Int, _ y: Int) -> Int {
              var a = x
              var b = y
              while b != 0 { let t = a % b; a = b; b = t }
              return a
          }

          func minimumLines(_ stockPrices: [[Int]]) -> Int {
              let n = stockPrices.count
              if n < 2 { return 0 }
              let p = stockPrices.sorted { $0[0] < $1[0] }
              var lines = 0
              var pdx = 0
              var pdy = 0
              for i in 1..<n {
                  var dx = p[i][0] - p[i - 1][0]
                  var dy = p[i][1] - p[i - 1][1]
                  let g = gcdLines(abs(dy), dx)
                  dx /= g
                  dy /= g
                  if i == 1 || dx != pdx || dy != pdy { lines += 1 }
                  pdx = dx
                  pdy = dy
              }
              return lines
          }
        `,
        rust: code`
          fn gcd_lines(a: i64, b: i64) -> i64 {
              let (mut a, mut b) = (a, b);
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              a
          }

          fn minimumLines(stockPrices: Vec<Vec<i32>>) -> i32 {
              let n = stockPrices.len();
              if n < 2 {
                  return 0;
              }
              let mut p = stockPrices.clone();
              p.sort_by_key(|v| v[0]);
              let mut lines = 0;
              let (mut pdx, mut pdy) = (0i64, 0i64);
              for i in 1..n {
                  let mut dx = (p[i][0] - p[i - 1][0]) as i64;
                  let mut dy = (p[i][1] - p[i - 1][1]) as i64;
                  let g = gcd_lines(dy.abs(), dx);
                  dx /= g;
                  dy /= g;
                  if i == 1 || dx != pdx || dy != pdy {
                      lines += 1;
                  }
                  pdx = dx;
                  pdy = dy;
              }
              lines
          }
        `,
        php: code`
          function gcdLines($a, $b) {
              while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
              return $a;
          }

          function minimumLines($stockPrices) {
              $p = $stockPrices;
              $n = count($p);
              if ($n < 2) return 0;
              usort($p, function($a, $b) { return $a[0] <=> $b[0]; });
              $lines = 0;
              $pdx = 0;
              $pdy = 0;
              for ($i = 1; $i < $n; $i++) {
                  $dx = $p[$i][0] - $p[$i - 1][0];
                  $dy = $p[$i][1] - $p[$i - 1][1];
                  $g = gcdLines(abs($dy), $dx);
                  $dx = intdiv($dx, $g);
                  $dy = intdiv($dy, $g);
                  if ($i == 1 || $dx != $pdx || $dy != $pdy) $lines++;
                  $pdx = $dx;
                  $pdy = $dy;
              }
              return $lines;
          }
        `,
        ruby: code`
          def minimumLines(stockPrices)
            p = stockPrices.sort_by { |x| x[0] }
            n = p.length
            return 0 if n < 2
            lines = 0
            pdx = 0
            pdy = 0
            (1...n).each do |i|
              dx = p[i][0] - p[i - 1][0]
              dy = p[i][1] - p[i - 1][1]
              g = dy.abs.gcd(dx)
              dx /= g
              dy /= g
              lines += 1 if i == 1 || dx != pdx || dy != pdy
              pdx = dx
              pdy = dy
            end
            lines
          end
        `,
      },
    };
  })(),

  // ── Replace Elements in an Array (LC 2295) ──────────────────────
  (() => {
    const ref = (nums: number[], operations: number[][]) => {
      const res = nums.slice();
      for (const [a, b] of operations) res[res.indexOf(a)] = b;
      return res;
    };
    return {
      slug: "replace-elements-in-an-array",
      title: "Replace Elements in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Simulation", "Amazon", "Google"],
      signature: {
        funcName: "arrayChange",
        params: [{ name: "nums", type: "int[]" as const }, { name: "operations", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "`nums` holds `n` **distinct** positive integers. Apply the operations in order: operation `operations[i] = [a, b]` replaces the element whose value is `a` with the value `b`.\n\nEvery operation is guaranteed to be valid at the moment it runs: `a` is currently in `nums`, and `b` currently is not (so the elements stay distinct).\n\nReturn `nums` after all the operations.",
        [
          { in: "nums = [4,9,2,7], operations = [[9,3],[2,8],[3,1]]", out: "[4,1,8,7]", note: "`[4,9,2,7]` → `[4,3,2,7]` → `[4,3,8,7]` → `[4,1,8,7]`. The third operation replaces the value written by the first." },
          { in: "nums = [5,6], operations = [[5,1],[1,5],[6,1]]", out: "[5,1]" },
        ],
        ["n == nums.length", "m == operations.length", "1 <= n, m <= 10^5", "All values in nums are distinct", "operations[i].length == 2", "1 <= nums[i], operations[i][0], operations[i][1] <= 10^6", "operations[i][0] is in nums and operations[i][1] is not, when operation i is applied"]),
      hints: [
        "Searching the array for `a` on every operation costs O(n) each time.",
        "Since the values stay distinct, a value identifies one position.",
        "Keep a map from value to index; each operation moves that index from key `a` to key `b`.",
      ],
      editorial: explain({
        idea: "Distinct values make value → position a well-defined map, and an operation only changes one entry of it, so each replacement costs O(1).",
        steps: [
          "Build `pos[value] = index` for the initial array.",
          "For each operation `[a, b]`: look up `i = pos[a]`, set `nums[i] = b`, remove `a` from the map and record `pos[b] = i`.",
          "Return the array.",
        ],
        why: "The guarantees keep the values distinct after every operation, so the map stays a bijection between current values and positions. Each operation reads the correct position for `a` and updates the map exactly the way the array changed.",
        time: "O(n + m)",
        space: "O(n)",
        pitfalls: [
          "An operation may target a value written by an earlier operation — the map must be updated, not built once.",
          "Do not search with `indexOf` per operation; that is O(n·m).",
          "Removing `a` from the map is optional (it can never be looked up again until it is re-inserted) but keeps the map honest.",
        ],
      }),
      examples: [
        { input: "[4,9,2,7]\n[[9,3],[2,8],[3,1]]", expectedOutput: "[4,1,8,7]" },
        { input: "[5,6]\n[[5,1],[1,5],[6,1]]", expectedOutput: "[5,1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 30)]);
        const hi = pick(rng, [n + 2, n + 10, 100, 1000000]);
        const present = new Set<number>();
        const nums: number[] = [];
        while (nums.length < n) {
          const v = ri(rng, 1, hi);
          if (!present.has(v)) {
            present.add(v);
            nums.push(v);
          }
        }
        const m = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 30)]);
        const cur = nums.slice();
        const operations: number[][] = [];
        for (let k = 0; k < m; k++) {
          const i = ri(rng, 0, n - 1);
          let b = ri(rng, 1, hi);
          while (present.has(b)) b = ri(rng, 1, hi);
          present.delete(cur[i]);
          present.add(b);
          operations.push([cur[i], b]);
          cur[i] = b;
        }
        return {
          input: `${fmtIntArr(nums)}\n${fmtIntMat(operations)}`,
          expectedOutput: fmtIntArr(ref(nums, operations)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def arrayChange(nums: List[int], operations: List[List[int]]) -> List[int]:
              res = list(nums)
              pos = {x: i for i, x in enumerate(res)}
              for a, b in operations:
                  i = pos.pop(a)
                  res[i] = b
                  pos[b] = i
              return res
        `,
        javascript: code`
          var arrayChange = function(nums, operations) {
              var res = nums.slice();
              var pos = new Map();
              for (var i = 0; i < res.length; i++) pos.set(res[i], i);
              for (var k = 0; k < operations.length; k++) {
                  var a = operations[k][0], b = operations[k][1];
                  var at = pos.get(a);
                  pos.delete(a);
                  res[at] = b;
                  pos.set(b, at);
              }
              return res;
          };
        `,
        typescript: code`
          function arrayChange(nums: number[], operations: number[][]): number[] {
              var res: number[] = nums.slice();
              var pos: { [k: string]: number } = {};
              for (var i = 0; i < res.length; i++) pos["" + res[i]] = i;
              for (var k = 0; k < operations.length; k++) {
                  var a = operations[k][0], b = operations[k][1];
                  var at = pos["" + a];
                  delete pos["" + a];
                  res[at] = b;
                  pos["" + b] = at;
              }
              return res;
          }
        `,
        java: code`
          public static int[] arrayChange(int[] nums, int[][] operations) {
              int[] res = nums.clone();
              Map<Integer, Integer> pos = new HashMap<>();
              for (int i = 0; i < res.length; i++) pos.put(res[i], i);
              for (int[] op : operations) {
                  int at = pos.remove(op[0]);
                  res[at] = op[1];
                  pos.put(op[1], at);
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> arrayChange(vector<int>& nums, vector<vector<int>>& operations) {
              vector<int> res(nums.begin(), nums.end());
              unordered_map<int, int> pos;
              for (int i = 0; i < (int)res.size(); i++) pos[res[i]] = i;
              for (auto& op : operations) {
                  int at = pos[op[0]];
                  pos.erase(op[0]);
                  res[at] = op[1];
                  pos[op[1]] = at;
              }
              return res;
          }
        `,
        c: code`
          /* Values are at most 10^6. Only positions written during this call are
             ever read, because every looked-up value is currently in the array. */
          static int arrayChangePos[1000001];

          int* arrayChange(int* nums, int numsSize, int** operations, int operationsSize, int* operationsColSize, int* returnSize) {
              int* res = (int*)malloc(sizeof(int) * (numsSize + 1));
              for (int i = 0; i < numsSize; i++) {
                  res[i] = nums[i];
                  arrayChangePos[nums[i]] = i;
              }
              for (int k = 0; k < operationsSize; k++) {
                  int at = arrayChangePos[operations[k][0]];
                  res[at] = operations[k][1];
                  arrayChangePos[operations[k][1]] = at;
              }
              *returnSize = numsSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] ArrayChange(int[] nums, int[][] operations)
          {
              int[] res = (int[])nums.Clone();
              var pos = new Dictionary<int, int>();
              for (int i = 0; i < res.Length; i++) pos[res[i]] = i;
              foreach (var op in operations)
              {
                  int at = pos[op[0]];
                  pos.Remove(op[0]);
                  res[at] = op[1];
                  pos[op[1]] = at;
              }
              return res;
          }
        `,
        go: code`
          func arrayChange(nums []int, operations [][]int) []int {
          	res := make([]int, len(nums))
          	copy(res, nums)
          	pos := map[int]int{}
          	for i, x := range res {
          		pos[x] = i
          	}
          	for _, op := range operations {
          		at := pos[op[0]]
          		delete(pos, op[0])
          		res[at] = op[1]
          		pos[op[1]] = at
          	}
          	return res
          }
        `,
        kotlin: code`
          fun arrayChange(nums: IntArray, operations: Array<IntArray>): IntArray {
              val res = nums.copyOf()
              val pos = HashMap<Int, Int>()
              for (i in res.indices) pos[res[i]] = i
              for (op in operations) {
                  val at = pos.remove(op[0])!!
                  res[at] = op[1]
                  pos[op[1]] = at
              }
              return res
          }
        `,
        swift: code`
          func arrayChange(_ nums: [Int], _ operations: [[Int]]) -> [Int] {
              var res = nums
              var pos = [Int: Int]()
              for i in 0..<res.count { pos[res[i]] = i }
              for op in operations {
                  let at = pos[op[0]]!
                  pos[op[0]] = nil
                  res[at] = op[1]
                  pos[op[1]] = at
              }
              return res
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn arrayChange(nums: Vec<i32>, operations: Vec<Vec<i32>>) -> Vec<i32> {
              let mut res = nums.clone();
              let mut pos: HashMap<i32, usize> = HashMap::new();
              for i in 0..res.len() {
                  pos.insert(res[i], i);
              }
              for op in operations.iter() {
                  let at = pos.remove(&op[0]).unwrap();
                  res[at] = op[1];
                  pos.insert(op[1], at);
              }
              res
          }
        `,
        php: code`
          function arrayChange($nums, $operations) {
              $res = $nums;
              $pos = [];
              foreach ($res as $i => $x) $pos[$x] = $i;
              foreach ($operations as $op) {
                  $at = $pos[$op[0]];
                  unset($pos[$op[0]]);
                  $res[$at] = $op[1];
                  $pos[$op[1]] = $at;
              }
              return $res;
          }
        `,
        ruby: code`
          def arrayChange(nums, operations)
            res = nums.dup
            pos = {}
            res.each_with_index { |x, i| pos[x] = i }
            operations.each do |a, b|
              at = pos.delete(a)
              res[at] = b
              pos[b] = at
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Groups Entering a Competition (LC 2358) ───
  (() => {
    // Simulate the construction on the sorted grades: group k takes the next k students.
    const ref = (grades: number[]) => {
      let left = grades.length;
      let k = 0;
      while (left >= k + 1) {
        k++;
        left -= k;
      }
      return k;
    };
    return {
      slug: "maximum-number-of-groups-entering-a-competition",
      title: "Maximum Number of Groups Entering a Competition",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Binary Search", "Greedy", "Google", "Amazon"],
      signature: { funcName: "maximumGroups", params: [{ name: "grades", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`grades` lists the (positive) grades of the students who want to enter a competition. **Every** student must be placed in exactly one of a sequence of non-empty groups `g_1, g_2, ..., g_k`, ordered so that for every `i < k`:\n\n- the sum of grades in `g_i` is **strictly less** than the sum of grades in `g_(i+1)`, and\n- the number of students in `g_i` is **strictly less** than the number in `g_(i+1)`.\n\nReturn the **maximum** possible number of groups `k`.",
        [
          { in: "grades = [8,3,5,1,9,4,2]", out: "3", note: "For example `[1]`, `[2,3]`, `[4,5,8,9]`: sizes 1 < 2 < 4 and sums 1 < 5 < 26. Four groups would need at least 1 + 2 + 3 + 4 = 10 students." },
          { in: "grades = [6,6]", out: "1", note: "Two groups would need at least 1 + 2 = 3 students." },
          { in: "grades = [5]", out: "1" },
        ],
        ["1 <= grades.length <= 10^5", "1 <= grades[i] <= 10^5"]),
      hints: [
        "Do the actual grades matter, or only how many students there are?",
        "Sort the grades: if groups take consecutive runs of increasing size from the sorted list, the sums increase automatically.",
        "So the answer is the largest `k` with `1 + 2 + ... + k <= n`.",
      ],
      editorial: explain({
        idea: "Sizes must strictly increase, so `k` groups need at least `1 + 2 + ... + k` students. That many always suffice, whatever the grades are, so the answer depends on `n` alone.",
        steps: [
          "Let `n` be the number of students.",
          "Find the largest `k` with `k(k + 1) / 2 <= n` — a loop that keeps taking groups of size 1, 2, 3, ... while enough students remain.",
          "Return `k`.",
        ],
        why: "Necessity: group sizes are distinct positive integers in increasing order, so the `i`-th smallest is at least `i` and the total is at least `k(k + 1)/2`. Sufficiency: sort the grades ascending and give group `i` the next `i` students, putting any leftovers into the last group. Each group has more students than the previous one, and each of them has a grade at least as large as every grade in the previous group, so its sum is strictly larger (grades are positive).",
        time: "O(sqrt(n))",
        space: "O(1)",
        pitfalls: [
          "No sorting or grade arithmetic is needed in the final algorithm — only the count.",
          "Leftover students join the last group; they never create a new one.",
          "Floating-point square roots for `k` invite off-by-one errors; a loop or integer binary search is safer.",
        ],
      }),
      examples: [
        { input: "[8,3,5,1,9,4,2]", expectedOutput: "3" },
        { input: "[6,6]", expectedOutput: "1" },
        { input: "[5]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 4, 12), ri(rng, 10, 40), ri(rng, 40, 120)]);
        const hi = pick(rng, [10, 1000, 100000]);
        const grades = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(grades), expectedOutput: String(ref(grades)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumGroups(grades: List[int]) -> int:
              n = len(grades)
              k = 0
              while (k + 1) * (k + 2) // 2 <= n:
                  k += 1
              return k
        `,
        javascript: code`
          var maximumGroups = function(grades) {
              var n = grades.length, k = 0;
              while ((k + 1) * (k + 2) / 2 <= n) k++;
              return k;
          };
        `,
        typescript: code`
          function maximumGroups(grades: number[]): number {
              var n = grades.length, k = 0;
              while ((k + 1) * (k + 2) / 2 <= n) k++;
              return k;
          }
        `,
        java: code`
          public static int maximumGroups(int[] grades) {
              int n = grades.length, k = 0;
              while ((long) (k + 1) * (k + 2) / 2 <= n) k++;
              return k;
          }
        `,
        cpp: code`
          int maximumGroups(vector<int>& grades) {
              long long n = grades.size(), k = 0;
              while ((k + 1) * (k + 2) / 2 <= n) k++;
              return (int)k;
          }
        `,
        c: code`
          int maximumGroups(int* grades, int gradesSize) {
              long long n = gradesSize, k = 0;
              while ((k + 1) * (k + 2) / 2 <= n) k++;
              return (int)k;
          }
        `,
        csharp: code`
          public static int MaximumGroups(int[] grades)
          {
              long n = grades.Length, k = 0;
              while ((k + 1) * (k + 2) / 2 <= n) k++;
              return (int)k;
          }
        `,
        go: code`
          func maximumGroups(grades []int) int {
          	n, k := len(grades), 0
          	for (k+1)*(k+2)/2 <= n {
          		k++
          	}
          	return k
          }
        `,
        kotlin: code`
          fun maximumGroups(grades: IntArray): Int {
              val n = grades.size.toLong()
              var k = 0L
              while ((k + 1) * (k + 2) / 2 <= n) k++
              return k.toInt()
          }
        `,
        swift: code`
          func maximumGroups(_ grades: [Int]) -> Int {
              let n = grades.count
              var k = 0
              while (k + 1) * (k + 2) / 2 <= n { k += 1 }
              return k
          }
        `,
        rust: code`
          fn maximumGroups(grades: Vec<i32>) -> i32 {
              let n = grades.len() as i64;
              let mut k: i64 = 0;
              while (k + 1) * (k + 2) / 2 <= n {
                  k += 1;
              }
              k as i32
          }
        `,
        php: code`
          function maximumGroups($grades) {
              $n = count($grades);
              $k = 0;
              while (intdiv(($k + 1) * ($k + 2), 2) <= $n) $k++;
              return $k;
          }
        `,
        ruby: code`
          def maximumGroups(grades)
            n = grades.length
            k = 0
            k += 1 while (k + 1) * (k + 2) / 2 <= n
            k
          end
        `,
      },
    };
  })(),

  // ── Task Scheduler II (LC 2365) ─────────────────────────────────
  (() => {
    // Day-by-day simulation: on each day either run the next task or take a break.
    const ref = (tasks: number[], space: number) => {
      const last = new Map<number, number>();
      let day = 0;
      let idx = 0;
      while (idx < tasks.length) {
        day++;
        const t = tasks[idx];
        const prev = last.get(t);
        if (prev === undefined || day - prev > space) {
          last.set(t, day);
          idx++;
        }
      }
      return day;
    };
    return {
      slug: "task-scheduler-ii",
      title: "Task Scheduler II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Simulation", "Amazon", "Google"],
      signature: {
        funcName: "taskSchedulerII",
        params: [{ name: "tasks", type: "int[]" as const }, { name: "space", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You must complete the tasks in the order given: `tasks[i]` is the type of the `i`-th task. Each day, starting from day 1, you either complete the next task or take a break.\n\nAfter completing a task of some type, you must wait **at least `space` days** before completing another task of the **same** type — that is, if a task of type `t` was done on day `d`, the next task of type `t` can be done on day `d + space + 1` at the earliest.\n\nReturn the minimum number of days needed to complete all tasks.\n\n*Note:* the original problem allows `10^5` tasks and returns a 64-bit day count; here `tasks.length <= 10^4`, so the answer always fits in a 32-bit integer.",
        [
          { in: "tasks = [2,5,2,7,5,2], space = 2", out: "7", note: "Days 1–2 run types 2 and 5. Type 2 is next but was done on day 1, so day 3 is a break and it runs on day 4. Then 7, 5 and 2 run on days 5, 6 and 7." },
          { in: "tasks = [4,4,4], space = 3", out: "9", note: "The type-4 tasks run on days 1, 5 and 9." },
          { in: "tasks = [1,2,3], space = 1", out: "3" },
        ],
        ["1 <= tasks.length <= 10^4", "1 <= tasks[i] <= 10^9", "1 <= space <= tasks.length"]),
      hints: [
        "Simulating break days one at a time can take `space` steps per task.",
        "For each task type, remember the day it was last completed.",
        "When the next task's type is not ready yet, jump the clock straight to `last + space + 1`.",
      ],
      editorial: explain({
        idea: "The order is fixed, so the only freedom is how many breaks to take — and the fewest breaks means running each task on the earliest day its type allows. Jumping the clock over the breaks makes it one O(1) step per task.",
        steps: [
          "Keep `day = 0` and a map `last` from task type to the day it last ran.",
          "For each task: advance `day` by one.",
          "If its type ran before and `day - last[type] <= space`, set `day = last[type] + space + 1`.",
          "Record `last[type] = day`. After the loop, `day` is the answer.",
        ],
        why: "Running a task as early as possible never hurts later tasks: the following task's earliest day is a non-decreasing function of this task's day, and the cooldown of its own type only gets looser the earlier this one ran. So by induction the greedy day for every task is the minimum achievable, and in particular for the last one.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The gap is `space` full days between two runs, so the earliest next day is `last + space + 1`, not `last + space`.",
          "The day count grows to about `n * space`; with the original limits it needs 64 bits.",
          "Different types never block each other — only the same type does.",
        ],
      }),
      examples: [
        { input: "[2,5,2,7,5,2]\n2", expectedOutput: "7" },
        { input: "[4,4,4]\n3", expectedOutput: "9" },
        { input: "[1,2,3]\n1", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const big = rng() < 0.2;
        const types = pick(rng, [1, 2, 3, 6, 15]);
        const pool = Array.from({ length: types }, () => (big ? ri(rng, 1, 1000000000) : ri(rng, 1, 20)));
        const tasks = Array.from({ length: n }, () => pick(rng, pool));
        const space = pick(rng, [1, ri(rng, 1, n), n]);
        return { input: `${fmtIntArr(tasks)}\n${space}`, expectedOutput: String(ref(tasks, space)) };
      },
      solutions: {
        python: code`
          from typing import List

          def taskSchedulerII(tasks: List[int], space: int) -> int:
              last = {}
              day = 0
              for t in tasks:
                  day += 1
                  if t in last and day - last[t] <= space:
                      day = last[t] + space + 1
                  last[t] = day
              return day
        `,
        javascript: code`
          var taskSchedulerII = function(tasks, space) {
              var last = new Map();
              var day = 0;
              for (var i = 0; i < tasks.length; i++) {
                  var t = tasks[i];
                  day++;
                  var prev = last.get(t);
                  if (prev !== undefined && day - prev <= space) day = prev + space + 1;
                  last.set(t, day);
              }
              return day;
          };
        `,
        typescript: code`
          function taskSchedulerII(tasks: number[], space: number): number {
              var last: { [k: string]: number } = {};
              var day = 0;
              for (var i = 0; i < tasks.length; i++) {
                  var key = "" + tasks[i];
                  day++;
                  var prev = last[key];
                  if (prev !== undefined && day - prev <= space) day = prev + space + 1;
                  last[key] = day;
              }
              return day;
          }
        `,
        java: code`
          public static int taskSchedulerII(int[] tasks, int space) {
              Map<Integer, Long> last = new HashMap<>();
              long day = 0;
              for (int t : tasks) {
                  day++;
                  Long prev = last.get(t);
                  if (prev != null && day - prev <= space) day = prev + space + 1;
                  last.put(t, day);
              }
              return (int) day;
          }
        `,
        cpp: code`
          int taskSchedulerII(vector<int>& tasks, int space) {
              unordered_map<int, long long> last;
              long long day = 0;
              for (int t : tasks) {
                  day++;
                  auto it = last.find(t);
                  if (it != last.end() && day - it->second <= space) day = it->second + space + 1;
                  last[t] = day;
              }
              return (int)day;
          }
        `,
        c: code`
          static int cmpSchedAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int taskSchedulerII(int* tasks, int tasksSize, int space) {
              int n = tasksSize;
              int* vals = (int*)malloc(sizeof(int) * (n + 1));
              for (int i = 0; i < n; i++) vals[i] = tasks[i];
              qsort(vals, n, sizeof(int), cmpSchedAsc);
              long long* last = (long long*)malloc(sizeof(long long) * (n + 1));
              for (int i = 0; i < n; i++) last[i] = -1;
              long long day = 0;
              for (int i = 0; i < n; i++) {
                  int lo = 0, hi = n - 1;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (vals[mid] < tasks[i]) lo = mid + 1; else hi = mid;
                  }
                  day++;
                  if (last[lo] >= 0 && day - last[lo] <= space) day = last[lo] + space + 1;
                  last[lo] = day;
              }
              free(vals);
              free(last);
              return (int)day;
          }
        `,
        csharp: code`
          public static int TaskSchedulerII(int[] tasks, int space)
          {
              var last = new Dictionary<int, long>();
              long day = 0;
              foreach (int t in tasks)
              {
                  day++;
                  if (last.TryGetValue(t, out long prev) && day - prev <= space) day = prev + space + 1;
                  last[t] = day;
              }
              return (int)day;
          }
        `,
        go: code`
          func taskSchedulerII(tasks []int, space int) int {
          	last := map[int]int{}
          	day := 0
          	for _, t := range tasks {
          		day++
          		if prev, ok := last[t]; ok && day-prev <= space {
          			day = prev + space + 1
          		}
          		last[t] = day
          	}
          	return day
          }
        `,
        kotlin: code`
          fun taskSchedulerII(tasks: IntArray, space: Int): Int {
              val last = HashMap<Int, Long>()
              var day = 0L
              for (t in tasks) {
                  day++
                  val prev = last[t]
                  if (prev != null && day - prev <= space) day = prev + space + 1
                  last[t] = day
              }
              return day.toInt()
          }
        `,
        swift: code`
          func taskSchedulerII(_ tasks: [Int], _ space: Int) -> Int {
              var last = [Int: Int]()
              var day = 0
              for t in tasks {
                  day += 1
                  if let prev = last[t], day - prev <= space { day = prev + space + 1 }
                  last[t] = day
              }
              return day
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn taskSchedulerII(tasks: Vec<i32>, space: i32) -> i32 {
              let mut last: HashMap<i32, i64> = HashMap::new();
              let sp = space as i64;
              let mut day: i64 = 0;
              for &t in tasks.iter() {
                  day += 1;
                  if let Some(&prev) = last.get(&t) {
                      if day - prev <= sp {
                          day = prev + sp + 1;
                      }
                  }
                  last.insert(t, day);
              }
              day as i32
          }
        `,
        php: code`
          function taskSchedulerII($tasks, $space) {
              $last = [];
              $day = 0;
              foreach ($tasks as $t) {
                  $day++;
                  if (isset($last[$t]) && $day - $last[$t] <= $space) $day = $last[$t] + $space + 1;
                  $last[$t] = $day;
              }
              return $day;
          }
        `,
        ruby: code`
          def taskSchedulerII(tasks, space)
            last = {}
            day = 0
            tasks.each do |t|
              day += 1
              prev = last[t]
              day = prev + space + 1 if prev && day - prev <= space
              last[t] = day
            end
            day
          end
        `,
      },
    };
  })(),

  // ── Check if There is a Valid Partition For The Array (LC 2369) ─
  (() => {
    // Plain recursion with memo over "can the suffix starting at i be partitioned".
    const ref = (nums: number[]) => {
      const n = nums.length;
      const memo = new Map<number, boolean>();
      const go = (i: number): boolean => {
        if (i === n) return true;
        const hit = memo.get(i);
        if (hit !== undefined) return hit;
        let ok = false;
        if (i + 2 <= n && nums[i] === nums[i + 1] && go(i + 2)) ok = true;
        if (!ok && i + 3 <= n) {
          const same = nums[i] === nums[i + 1] && nums[i + 1] === nums[i + 2];
          const run = nums[i + 1] === nums[i] + 1 && nums[i + 2] === nums[i] + 2;
          if ((same || run) && go(i + 3)) ok = true;
        }
        memo.set(i, ok);
        return ok;
      };
      return go(0);
    };
    return {
      slug: "check-if-there-is-a-valid-partition-for-the-array",
      title: "Check if There is a Valid Partition For The Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "validPartition", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Cut the integer array `nums` into one or more **contiguous** pieces. The partition is **valid** when every piece is one of:\n\n1. exactly **2** equal elements, e.g. `[4,4]`;\n2. exactly **3** equal elements, e.g. `[4,4,4]`;\n3. exactly **3** consecutive increasing elements, each one more than the previous, e.g. `[3,4,5]` (but not `[1,3,5]`).\n\nReturn `true` if `nums` has at least one valid partition, and `false` otherwise.",
        [
          { in: "nums = [3,3,5,6,7]", out: "true", note: "`[3,3]` and `[5,6,7]`." },
          { in: "nums = [7,8,9,9]", out: "false", note: "`[7,8,9]` would leave a lone `9`, and `[7,8]` is not a valid piece." },
          { in: "nums = [1,1,1,1]", out: "true", note: "`[1,1]` and `[1,1]`." },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 10^6"]),
      hints: [
        "Greedily taking the first piece that fits can paint you into a corner — `[1,1,1,2,3]` needs `[1,1]` first.",
        "Let `dp[i]` say whether the first `i` elements can be partitioned validly.",
        "`dp[i]` is true if the last piece is a valid 2-piece and `dp[i-2]` holds, or a valid 3-piece and `dp[i-3]` holds.",
      ],
      editorial: explain({
        idea: "Every valid partition ends in a piece of length 2 or 3, so whether a prefix can be partitioned depends only on the two or three prefixes just before it — a linear DP.",
        steps: [
          "Set `dp[0] = true` (the empty prefix) and compute `dp[i]` for `i = 1..n`.",
          "`dp[i]` is true if `i >= 2`, `nums[i-1] == nums[i-2]` and `dp[i-2]` is true.",
          "It is also true if `i >= 3`, `dp[i-3]` is true and the last three are all equal or form `x, x+1, x+2`.",
          "Return `dp[n]`.",
        ],
        why: "Removing the last piece of any valid partition of the first `i` elements leaves a valid partition of the first `i - 2` or `i - 3` elements, and conversely appending a valid last piece to a valid partition is valid. So the recurrence captures exactly the partitionable prefixes.",
        time: "O(n)",
        space: "O(n), or O(1) keeping only the last three values",
        pitfalls: [
          "A first-fit greedy fails; both piece lengths must be tried.",
          "'Consecutive increasing' means steps of exactly +1 — `[1,2,4]` or `[3,2,1]` do not qualify.",
          "Four equal elements are two pairs, not one piece.",
        ],
      }),
      examples: [
        { input: "[3,3,5,6,7]", expectedOutput: "true" },
        { input: "[7,8,9,9]", expectedOutput: "false" },
        { input: "[1,1,1,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const pieces = pick(rng, [1, 2, ri(rng, 2, 5), ri(rng, 5, 12)]);
        const hi = pick(rng, [4, 10, 1000000]);
        const nums: number[] = [];
        for (let p = 0; p < pieces; p++) {
          const kind = ri(rng, 0, 2);
          if (kind === 2) {
            const x = ri(rng, 1, Math.max(1, hi - 2));
            nums.push(x, x + 1, x + 2);
          } else {
            const x = ri(rng, 1, hi);
            for (let j = 0; j < (kind === 0 ? 2 : 3); j++) nums.push(x);
          }
        }
        // Perturb about half the cases so both answers are common.
        const r = rng();
        if (r < 0.2) {
          nums[ri(rng, 0, nums.length - 1)] = ri(rng, 1, hi);
        } else if (r < 0.35) {
          nums.splice(ri(rng, 0, nums.length - 1), 1);
          if (nums.length < 2) nums.push(ri(rng, 1, hi));
        } else if (r < 0.5) {
          nums.splice(ri(rng, 0, nums.length), 0, ri(rng, 1, hi));
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validPartition(nums: List[int]) -> bool:
              n = len(nums)
              dp = [False] * (n + 1)
              dp[0] = True
              for i in range(2, n + 1):
                  if dp[i - 2] and nums[i - 1] == nums[i - 2]:
                      dp[i] = True
                  elif i >= 3 and dp[i - 3]:
                      a, b, c = nums[i - 3], nums[i - 2], nums[i - 1]
                      if (a == b == c) or (b == a + 1 and c == b + 1):
                          dp[i] = True
              return dp[n]
        `,
        javascript: code`
          var validPartition = function(nums) {
              var n = nums.length;
              var dp = new Array(n + 1).fill(false);
              dp[0] = true;
              for (var i = 2; i <= n; i++) {
                  if (dp[i - 2] && nums[i - 1] === nums[i - 2]) {
                      dp[i] = true;
                  } else if (i >= 3 && dp[i - 3]) {
                      var a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a === b && b === c) || (b === a + 1 && c === b + 1)) dp[i] = true;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function validPartition(nums: number[]): boolean {
              var n = nums.length;
              var dp: boolean[] = [];
              for (var k = 0; k <= n; k++) dp.push(false);
              dp[0] = true;
              for (var i = 2; i <= n; i++) {
                  if (dp[i - 2] && nums[i - 1] === nums[i - 2]) {
                      dp[i] = true;
                  } else if (i >= 3 && dp[i - 3]) {
                      var a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a === b && b === c) || (b === a + 1 && c === b + 1)) dp[i] = true;
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static boolean validPartition(int[] nums) {
              int n = nums.length;
              boolean[] dp = new boolean[n + 1];
              dp[0] = true;
              for (int i = 2; i <= n; i++) {
                  if (dp[i - 2] && nums[i - 1] == nums[i - 2]) {
                      dp[i] = true;
                  } else if (i >= 3 && dp[i - 3]) {
                      int a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a == b && b == c) || (b == a + 1 && c == b + 1)) dp[i] = true;
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          bool validPartition(vector<int>& nums) {
              int n = nums.size();
              vector<bool> dp(n + 1, false);
              dp[0] = true;
              for (int i = 2; i <= n; i++) {
                  if (dp[i - 2] && nums[i - 1] == nums[i - 2]) {
                      dp[i] = true;
                  } else if (i >= 3 && dp[i - 3]) {
                      int a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a == b && b == c) || (b == a + 1 && c == b + 1)) dp[i] = true;
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          bool validPartition(int* nums, int numsSize) {
              int n = numsSize;
              bool* dp = (bool*)malloc(sizeof(bool) * (n + 1));
              for (int i = 0; i <= n; i++) dp[i] = false;
              dp[0] = true;
              for (int i = 2; i <= n; i++) {
                  if (dp[i - 2] && nums[i - 1] == nums[i - 2]) {
                      dp[i] = true;
                  } else if (i >= 3 && dp[i - 3]) {
                      int a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a == b && b == c) || (b == a + 1 && c == b + 1)) dp[i] = true;
                  }
              }
              bool res = dp[n];
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static bool ValidPartition(int[] nums)
          {
              int n = nums.Length;
              bool[] dp = new bool[n + 1];
              dp[0] = true;
              for (int i = 2; i <= n; i++)
              {
                  if (dp[i - 2] && nums[i - 1] == nums[i - 2])
                  {
                      dp[i] = true;
                  }
                  else if (i >= 3 && dp[i - 3])
                  {
                      int a = nums[i - 3], b = nums[i - 2], c = nums[i - 1];
                      if ((a == b && b == c) || (b == a + 1 && c == b + 1)) dp[i] = true;
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func validPartition(nums []int) bool {
          	n := len(nums)
          	dp := make([]bool, n+1)
          	dp[0] = true
          	for i := 2; i <= n; i++ {
          		if dp[i-2] && nums[i-1] == nums[i-2] {
          			dp[i] = true
          		} else if i >= 3 && dp[i-3] {
          			a, b, c := nums[i-3], nums[i-2], nums[i-1]
          			if (a == b && b == c) || (b == a+1 && c == b+1) {
          				dp[i] = true
          			}
          		}
          	}
          	return dp[n]
          }
        `,
        kotlin: code`
          fun validPartition(nums: IntArray): Boolean {
              val n = nums.size
              val dp = BooleanArray(n + 1)
              dp[0] = true
              for (i in 2..n) {
                  if (dp[i - 2] && nums[i - 1] == nums[i - 2]) {
                      dp[i] = true
                  } else if (i >= 3 && dp[i - 3]) {
                      val a = nums[i - 3]
                      val b = nums[i - 2]
                      val c = nums[i - 1]
                      if ((a == b && b == c) || (b == a + 1 && c == b + 1)) dp[i] = true
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func validPartition(_ nums: [Int]) -> Bool {
              let n = nums.count
              var dp = [Bool](repeating: false, count: n + 1)
              dp[0] = true
              if n < 2 { return false }
              for i in 2...n {
                  if dp[i - 2] && nums[i - 1] == nums[i - 2] {
                      dp[i] = true
                  } else if i >= 3 && dp[i - 3] {
                      let a = nums[i - 3], b = nums[i - 2], c = nums[i - 1]
                      if (a == b && b == c) || (b == a + 1 && c == b + 1) { dp[i] = true }
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn validPartition(nums: Vec<i32>) -> bool {
              let n = nums.len();
              let mut dp = vec![false; n + 1];
              dp[0] = true;
              for i in 2..n + 1 {
                  if dp[i - 2] && nums[i - 1] == nums[i - 2] {
                      dp[i] = true;
                  } else if i >= 3 && dp[i - 3] {
                      let (a, b, c) = (nums[i - 3], nums[i - 2], nums[i - 1]);
                      if (a == b && b == c) || (b == a + 1 && c == b + 1) {
                          dp[i] = true;
                      }
                  }
              }
              dp[n]
          }
        `,
        php: code`
          function validPartition($nums) {
              $n = count($nums);
              $dp = array_fill(0, $n + 1, false);
              $dp[0] = true;
              for ($i = 2; $i <= $n; $i++) {
                  if ($dp[$i - 2] && $nums[$i - 1] == $nums[$i - 2]) {
                      $dp[$i] = true;
                  } elseif ($i >= 3 && $dp[$i - 3]) {
                      $a = $nums[$i - 3];
                      $b = $nums[$i - 2];
                      $c = $nums[$i - 1];
                      if (($a == $b && $b == $c) || ($b == $a + 1 && $c == $b + 1)) $dp[$i] = true;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def validPartition(nums)
            n = nums.length
            dp = Array.new(n + 1, false)
            dp[0] = true
            (2..n).each do |i|
              if dp[i - 2] && nums[i - 1] == nums[i - 2]
                dp[i] = true
              elsif i >= 3 && dp[i - 3]
                a, b, c = nums[i - 3], nums[i - 2], nums[i - 1]
                dp[i] = true if (a == b && b == c) || (b == a + 1 && c == b + 1)
              end
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Node With Highest Edge Score (LC 2374) ──────────────────────
  (() => {
    const ref = (edges: number[]) => {
      const n = edges.length;
      let best = 0;
      let bestScore = -1;
      for (let v = 0; v < n; v++) {
        let s = 0;
        for (let i = 0; i < n; i++) if (edges[i] === v) s += i;
        if (s > bestScore) {
          bestScore = s;
          best = v;
        }
      }
      return best;
    };
    return {
      slug: "node-with-highest-edge-score",
      title: "Node With Highest Edge Score",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Graph", "Amazon", "Google"],
      signature: { funcName: "edgeScore", params: [{ name: "edges", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A directed graph has `n` nodes labelled `0` to `n - 1`, and every node has exactly one outgoing edge: node `i` points to node `edges[i]` (never to itself).\n\nThe **edge score** of a node `v` is the sum of the **labels** of all nodes that point to `v`.\n\nReturn the node with the highest edge score. If several nodes share the highest score, return the one with the **smallest** label.",
        [
          { in: "edges = [1,4,1,4,2]", out: "2", note: "Node 1 is pointed to by 0 and 2 (score 2), node 4 by 1 and 3 (score 4), node 2 by 4 (score 4). Nodes 2 and 4 tie; 2 is smaller." },
          { in: "edges = [2,0,0,2]", out: "0", note: "Node 0 scores 1 + 2 = 3 and node 2 scores 0 + 3 = 3." },
        ],
        ["n == edges.length", "2 <= n <= 10^5", "0 <= edges[i] < n", "edges[i] != i"]),
      hints: [
        "Each node contributes its own label to exactly one other node's score.",
        "Accumulate `score[edges[i]] += i` in one pass.",
        "Scores can exceed 32-bit range (about `n^2 / 2`); pick the first maximum when scanning nodes in increasing order.",
      ],
      editorial: explain({
        idea: "The edge score is a weighted in-degree: node `i` adds weight `i` to the node it points to. One accumulation pass and one arg-max pass solve it.",
        steps: [
          "Create a 64-bit `score` array of length `n`, all zero.",
          "For each `i`, add `i` to `score[edges[i]]`.",
          "Scan nodes from 0 to `n - 1`, keeping the node whose score is strictly greater than the best so far.",
          "Return that node.",
        ],
        why: "Every edge `i -> edges[i]` is counted exactly once, in the score of its target, so the array holds the exact edge scores. Updating only on a strictly greater score while scanning in increasing label order returns the smallest label among the maxima.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "With `n = 10^5` a node can score almost `5 * 10^9`, which overflows a 32-bit integer.",
          "Use `>` rather than `>=` so ties keep the smaller label.",
          "Nodes nobody points to score 0 and can still be the answer only if every score is 0 (impossible here, but the scan handles it).",
        ],
      }),
      examples: [
        { input: "[1,4,1,4,2]", expectedOutput: "2" },
        { input: "[2,0,0,2]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, ri(rng, 4, 10), ri(rng, 10, 40), ri(rng, 10, 40), ri(rng, 10, 40)]);
        // Targets drawn from a few random "hub" labels, so scores concentrate and tie.
        const hubs = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, pick(rng, [n, 2, 3, ri(rng, 1, n)]));
        const edges = Array.from({ length: n }, (_, i) => {
          let t = pick(rng, hubs);
          if (t === i) t = (i + 1 + ri(rng, 0, n - 2)) % n;
          return t;
        });
        return { input: fmtIntArr(edges), expectedOutput: String(ref(edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def edgeScore(edges: List[int]) -> int:
              n = len(edges)
              score = [0] * n
              for i, t in enumerate(edges):
                  score[t] += i
              best = 0
              for v in range(1, n):
                  if score[v] > score[best]:
                      best = v
              return best
        `,
        javascript: code`
          var edgeScore = function(edges) {
              var n = edges.length;
              var score = new Array(n).fill(0);
              for (var i = 0; i < n; i++) score[edges[i]] += i;
              var best = 0;
              for (var v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              return best;
          };
        `,
        typescript: code`
          function edgeScore(edges: number[]): number {
              var n = edges.length;
              var score: number[] = [];
              for (var k = 0; k < n; k++) score.push(0);
              for (var i = 0; i < n; i++) score[edges[i]] += i;
              var best = 0;
              for (var v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              return best;
          }
        `,
        java: code`
          public static int edgeScore(int[] edges) {
              int n = edges.length;
              long[] score = new long[n];
              for (int i = 0; i < n; i++) score[edges[i]] += i;
              int best = 0;
              for (int v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              return best;
          }
        `,
        cpp: code`
          int edgeScore(vector<int>& edges) {
              int n = edges.size();
              vector<long long> score(n, 0);
              for (int i = 0; i < n; i++) score[edges[i]] += i;
              int best = 0;
              for (int v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              return best;
          }
        `,
        c: code`
          int edgeScore(int* edges, int edgesSize) {
              int n = edgesSize;
              long long* score = (long long*)calloc(n, sizeof(long long));
              for (int i = 0; i < n; i++) score[edges[i]] += i;
              int best = 0;
              for (int v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              free(score);
              return best;
          }
        `,
        csharp: code`
          public static int EdgeScore(int[] edges)
          {
              int n = edges.Length;
              long[] score = new long[n];
              for (int i = 0; i < n; i++) score[edges[i]] += i;
              int best = 0;
              for (int v = 1; v < n; v++) if (score[v] > score[best]) best = v;
              return best;
          }
        `,
        go: code`
          func edgeScore(edges []int) int {
          	n := len(edges)
          	score := make([]int64, n)
          	for i, t := range edges {
          		score[t] += int64(i)
          	}
          	best := 0
          	for v := 1; v < n; v++ {
          		if score[v] > score[best] {
          			best = v
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun edgeScore(edges: IntArray): Int {
              val n = edges.size
              val score = LongArray(n)
              for (i in 0 until n) score[edges[i]] += i.toLong()
              var best = 0
              for (v in 1 until n) if (score[v] > score[best]) best = v
              return best
          }
        `,
        swift: code`
          func edgeScore(_ edges: [Int]) -> Int {
              let n = edges.count
              var score = [Int](repeating: 0, count: n)
              for i in 0..<n { score[edges[i]] += i }
              var best = 0
              for v in 1..<n where score[v] > score[best] { best = v }
              return best
          }
        `,
        rust: code`
          fn edgeScore(edges: Vec<i32>) -> i32 {
              let n = edges.len();
              let mut score = vec![0i64; n];
              for i in 0..n {
                  score[edges[i] as usize] += i as i64;
              }
              let mut best = 0usize;
              for v in 1..n {
                  if score[v] > score[best] {
                      best = v;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function edgeScore($edges) {
              $n = count($edges);
              $score = array_fill(0, $n, 0);
              for ($i = 0; $i < $n; $i++) $score[$edges[$i]] += $i;
              $best = 0;
              for ($v = 1; $v < $n; $v++) if ($score[$v] > $score[$best]) $best = $v;
              return $best;
          }
        `,
        ruby: code`
          def edgeScore(edges)
            n = edges.length
            score = Array.new(n, 0)
            edges.each_with_index { |t, i| score[t] += i }
            best = 0
            (1...n).each { |v| best = v if score[v] > score[best] }
            best
          end
        `,
      },
    };
  })(),

  // ── Find All Good Indices (LC 2420) ─────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const out: number[] = [];
      for (let i = k; i < n - k; i++) {
        let ok = true;
        for (let j = i - k + 1; j < i; j++) if (nums[j] > nums[j - 1]) ok = false;
        for (let j = i + 2; j <= i + k; j++) if (nums[j] < nums[j - 1]) ok = false;
        if (ok) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-all-good-indices",
      title: "Find All Good Indices",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "goodIndices",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Index `i` of the 0-indexed array `nums` (length `n`) is **good** when `k <= i < n - k` and:\n\n- the `k` elements just **before** `i` (`nums[i-k..i-1]`) are in **non-increasing** order, and\n- the `k` elements just **after** `i` (`nums[i+1..i+k]`) are in **non-decreasing** order.\n\nThe value at `i` itself is not compared with anything. Return all good indices in **ascending** order.",
        [
          { in: "nums = [5,4,4,3,6,2,2,7,8], k = 2", out: "[2,4,6]", note: "Index 2: `[5,4]` falls and `[3,6]` rises. Index 4: `[4,3]` and `[2,2]`. Index 6: `[6,2]` and `[7,8]`. Index 3 fails because `[6,2]` after it falls." },
          { in: "nums = [1,2,3,4,5], k = 2", out: "[]", note: "Only index 2 is in range, and `[1,2]` before it is increasing." },
        ],
        ["n == nums.length", "3 <= n <= 10^5", "1 <= nums[i] <= 10^6", "1 <= k <= n / 2"]),
      hints: [
        "Checking `2k` neighbours for every index costs O(n·k).",
        "Precompute, for every position, how long the non-increasing run ending there is.",
        "Likewise the non-decreasing run starting at each position (scan from the right). Index `i` is good when the run ending at `i - 1` and the run starting at `i + 1` are both at least `k` long.",
      ],
      editorial: explain({
        idea: "\"The `k` elements before `i` are non-increasing\" is the same as \"the non-increasing run ending at `i - 1` has length at least `k`\". Run lengths for every position take one pass each, after which every index is checked in O(1).",
        steps: [
          "`dec[j]` = length of the longest non-increasing run ending at `j`: `dec[j] = dec[j-1] + 1` if `nums[j] <= nums[j-1]`, else 1.",
          "`inc[j]` = length of the longest non-decreasing run starting at `j`: scan from the right, `inc[j] = inc[j+1] + 1` if `nums[j] <= nums[j+1]`, else 1.",
          "For `i` from `k` to `n - k - 1`, keep `i` when `dec[i-1] >= k` and `inc[i+1] >= k`.",
          "The indices come out in ascending order.",
        ],
        why: "A window of `k` elements ending at `i - 1` is non-increasing exactly when every adjacent pair inside it is, which is exactly when the maximal non-increasing run ending at `i - 1` covers it — i.e. has length at least `k`. The same holds for the window after `i` with the non-decreasing run starting at `i + 1`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Equal neighbours are allowed on both sides (non-increasing / non-decreasing, not strict).",
          "`nums[i]` itself is not part of either window.",
          "The index range is `k <= i < n - k`; indices outside it are never good.",
        ],
      }),
      examples: [
        { input: "[5,4,4,3,6,2,2,7,8]\n2", expectedOutput: "[2,4,6]" },
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 4, ri(rng, 5, 12), ri(rng, 12, 40), ri(rng, 12, 40)]);
        const k = Math.min(n >> 1, pick(rng, [1, 2, ri(rng, 1, n >> 1), n >> 1]));
        const style = ri(rng, 0, 2);
        let nums: number[];
        if (style === 0) {
          nums = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [3, 1000000])));
        } else {
          // Valleys: random walks that tend to fall then rise, with flat steps.
          nums = [];
          let v = ri(rng, 20, 1000);
          let dir = -1;
          for (let i = 0; i < n; i++) {
            if (rng() < 0.15) dir = -dir;
            v = Math.max(1, Math.min(1000000, v + dir * ri(rng, 0, style === 1 ? 2 : 50)));
            nums.push(v);
          }
        }
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def goodIndices(nums: List[int], k: int) -> List[int]:
              n = len(nums)
              dec = [1] * n
              for i in range(1, n):
                  if nums[i] <= nums[i - 1]:
                      dec[i] = dec[i - 1] + 1
              inc = [1] * n
              for i in range(n - 2, -1, -1):
                  if nums[i] <= nums[i + 1]:
                      inc[i] = inc[i + 1] + 1
              return [i for i in range(k, n - k) if dec[i - 1] >= k and inc[i + 1] >= k]
        `,
        javascript: code`
          var goodIndices = function(nums, k) {
              var n = nums.length;
              var dec = new Array(n).fill(1), inc = new Array(n).fill(1);
              for (var i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (var j = n - 2; j >= 0; j--) if (nums[j] <= nums[j + 1]) inc[j] = inc[j + 1] + 1;
              var res = [];
              for (var p = k; p < n - k; p++) if (dec[p - 1] >= k && inc[p + 1] >= k) res.push(p);
              return res;
          };
        `,
        typescript: code`
          function goodIndices(nums: number[], k: number): number[] {
              var n = nums.length;
              var dec: number[] = [], inc: number[] = [];
              for (var t = 0; t < n; t++) { dec.push(1); inc.push(1); }
              for (var i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (var j = n - 2; j >= 0; j--) if (nums[j] <= nums[j + 1]) inc[j] = inc[j + 1] + 1;
              var res: number[] = [];
              for (var p = k; p < n - k; p++) if (dec[p - 1] >= k && inc[p + 1] >= k) res.push(p);
              return res;
          }
        `,
        java: code`
          public static int[] goodIndices(int[] nums, int k) {
              int n = nums.length;
              int[] dec = new int[n], inc = new int[n];
              Arrays.fill(dec, 1);
              Arrays.fill(inc, 1);
              for (int i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (int i = n - 2; i >= 0; i--) if (nums[i] <= nums[i + 1]) inc[i] = inc[i + 1] + 1;
              List<Integer> res = new ArrayList<>();
              for (int i = k; i < n - k; i++) if (dec[i - 1] >= k && inc[i + 1] >= k) res.add(i);
              int[] out = new int[res.size()];
              for (int i = 0; i < out.length; i++) out[i] = res.get(i);
              return out;
          }
        `,
        cpp: code`
          vector<int> goodIndices(vector<int>& nums, int k) {
              int n = nums.size();
              vector<int> dec(n, 1), inc(n, 1);
              for (int i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (int i = n - 2; i >= 0; i--) if (nums[i] <= nums[i + 1]) inc[i] = inc[i + 1] + 1;
              vector<int> res;
              for (int i = k; i < n - k; i++) if (dec[i - 1] >= k && inc[i + 1] >= k) res.push_back(i);
              return res;
          }
        `,
        c: code`
          int* goodIndices(int* nums, int numsSize, int k, int* returnSize) {
              int n = numsSize;
              int* dec = (int*)malloc(sizeof(int) * n);
              int* inc = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) { dec[i] = 1; inc[i] = 1; }
              for (int i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (int i = n - 2; i >= 0; i--) if (nums[i] <= nums[i + 1]) inc[i] = inc[i + 1] + 1;
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              int w = 0;
              for (int i = k; i < n - k; i++) if (dec[i - 1] >= k && inc[i + 1] >= k) res[w++] = i;
              free(dec);
              free(inc);
              *returnSize = w;
              return res;
          }
        `,
        csharp: code`
          public static int[] GoodIndices(int[] nums, int k)
          {
              int n = nums.Length;
              int[] dec = new int[n], inc = new int[n];
              for (int i = 0; i < n; i++) { dec[i] = 1; inc[i] = 1; }
              for (int i = 1; i < n; i++) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1;
              for (int i = n - 2; i >= 0; i--) if (nums[i] <= nums[i + 1]) inc[i] = inc[i + 1] + 1;
              var res = new List<int>();
              for (int i = k; i < n - k; i++) if (dec[i - 1] >= k && inc[i + 1] >= k) res.Add(i);
              return res.ToArray();
          }
        `,
        go: code`
          func goodIndices(nums []int, k int) []int {
          	n := len(nums)
          	dec := make([]int, n)
          	inc := make([]int, n)
          	for i := 0; i < n; i++ {
          		dec[i], inc[i] = 1, 1
          	}
          	for i := 1; i < n; i++ {
          		if nums[i] <= nums[i-1] {
          			dec[i] = dec[i-1] + 1
          		}
          	}
          	for i := n - 2; i >= 0; i-- {
          		if nums[i] <= nums[i+1] {
          			inc[i] = inc[i+1] + 1
          		}
          	}
          	res := []int{}
          	for i := k; i < n-k; i++ {
          		if dec[i-1] >= k && inc[i+1] >= k {
          			res = append(res, i)
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun goodIndices(nums: IntArray, k: Int): IntArray {
              val n = nums.size
              val dec = IntArray(n) { 1 }
              val inc = IntArray(n) { 1 }
              for (i in 1 until n) if (nums[i] <= nums[i - 1]) dec[i] = dec[i - 1] + 1
              for (i in n - 2 downTo 0) if (nums[i] <= nums[i + 1]) inc[i] = inc[i + 1] + 1
              val res = ArrayList<Int>()
              for (i in k until n - k) if (dec[i - 1] >= k && inc[i + 1] >= k) res.add(i)
              return res.toIntArray()
          }
        `,
        swift: code`
          func goodIndices(_ nums: [Int], _ k: Int) -> [Int] {
              let n = nums.count
              var dec = [Int](repeating: 1, count: n)
              var inc = [Int](repeating: 1, count: n)
              for i in 1..<n where nums[i] <= nums[i - 1] { dec[i] = dec[i - 1] + 1 }
              for i in stride(from: n - 2, through: 0, by: -1) where nums[i] <= nums[i + 1] { inc[i] = inc[i + 1] + 1 }
              var res = [Int]()
              if n - k > k {
                  for i in k..<(n - k) where dec[i - 1] >= k && inc[i + 1] >= k { res.append(i) }
              }
              return res
          }
        `,
        rust: code`
          fn goodIndices(nums: Vec<i32>, k: i32) -> Vec<i32> {
              let n = nums.len();
              let k = k as usize;
              let mut dec = vec![1usize; n];
              let mut inc = vec![1usize; n];
              for i in 1..n {
                  if nums[i] <= nums[i - 1] {
                      dec[i] = dec[i - 1] + 1;
                  }
              }
              for i in (0..n - 1).rev() {
                  if nums[i] <= nums[i + 1] {
                      inc[i] = inc[i + 1] + 1;
                  }
              }
              let mut res: Vec<i32> = Vec::new();
              let mut i = k;
              while i + k < n {
                  if dec[i - 1] >= k && inc[i + 1] >= k {
                      res.push(i as i32);
                  }
                  i += 1;
              }
              res
          }
        `,
        php: code`
          function goodIndices($nums, $k) {
              $n = count($nums);
              $dec = array_fill(0, $n, 1);
              $inc = array_fill(0, $n, 1);
              for ($i = 1; $i < $n; $i++) if ($nums[$i] <= $nums[$i - 1]) $dec[$i] = $dec[$i - 1] + 1;
              for ($i = $n - 2; $i >= 0; $i--) if ($nums[$i] <= $nums[$i + 1]) $inc[$i] = $inc[$i + 1] + 1;
              $res = [];
              for ($i = $k; $i < $n - $k; $i++) if ($dec[$i - 1] >= $k && $inc[$i + 1] >= $k) $res[] = $i;
              return $res;
          }
        `,
        ruby: code`
          def goodIndices(nums, k)
            n = nums.length
            dec = Array.new(n, 1)
            inc = Array.new(n, 1)
            (1...n).each { |i| dec[i] = dec[i - 1] + 1 if nums[i] <= nums[i - 1] }
            (n - 2).downto(0) { |i| inc[i] = inc[i + 1] + 1 if nums[i] <= nums[i + 1] }
            (k...(n - k)).select { |i| dec[i - 1] >= k && inc[i + 1] >= k }
          end
        `,
      },
    };
  })(),

  // ── Minimize Maximum of Array (LC 2439) ─────────────────────────
  (() => {
    // Independent check: binary search the answer, pushing any excess leftwards.
    const ref = (nums: number[]) => {
      const fits = (cap: number) => {
        let carry = 0;
        for (let i = nums.length - 1; i >= 1; i--) carry = Math.max(0, nums[i] + carry - cap);
        return nums[0] + carry <= cap;
      };
      let lo = 0;
      let hi = Math.max(...nums);
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimize-maximum-of-array",
      title: "Minimize Maximum of Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "minimizeArrayValue", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` is a 0-indexed array of non-negative integers. In one operation you pick an index `i` with `1 <= i < n` and `nums[i] > 0`, decrease `nums[i]` by 1 and increase `nums[i - 1]` by 1 — one unit moves one step to the **left**.\n\nYou may perform any number of operations. Return the **minimum** possible value of the largest element of `nums`.",
        [
          { in: "nums = [2,7,1,6]", out: "5", note: "Move 2 units from index 1 to index 0 and 1 unit from index 3 to index 2: `[4,5,2,5]`. The first two elements total 9, so one of them is always at least 5." },
          { in: "nums = [9,3]", out: "9", note: "Units only move left, so `nums[0]` can never shrink." },
          { in: "nums = [0,0,10]", out: "4", note: "For example `[4,3,3]`." },
        ],
        ["n == nums.length", "2 <= n <= 10^5", "0 <= nums[i] <= 10^9"]),
      hints: [
        "Units can only move left, so the first `i + 1` elements can never lose their total.",
        "That makes `ceil(prefix_sum(i) / (i + 1))` a lower bound on the answer for every `i`.",
        "The largest of those lower bounds is achievable. Compute it in one pass with 64-bit prefix sums (or binary search the answer with a right-to-left carry check).",
      ],
      editorial: explain({
        idea: "Moving units leftwards never changes the total of a prefix except by adding to it, so each prefix's average (rounded up) is a floor on the maximum. The maximum of those floors is also achievable, which turns the problem into one prefix-sum pass.",
        steps: [
          "Sweep `i` from 0 to `n - 1`, keeping the running sum `prefix` in 64 bits.",
          "Compute `ceil(prefix / (i + 1))` as `(prefix + i) / (i + 1)` with integer division.",
          "Return the largest such value.",
        ],
        why: "Lower bound: no operation moves units out of the prefix `nums[0..i]` (they only move left), so its total stays at least `prefix_i`, and `i + 1` numbers with that total have a maximum of at least `ceil(prefix_i / (i + 1))`. Achievability: let `A` be the largest bound. Scanning from the right, any element above `A` can push its excess one step left; the excess carried into position `i` never makes the prefix ending there exceed `A·(i + 1)`, so the carry finally absorbed by `nums[0]` leaves it at most `A` — every element ends at most `A`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Prefix sums reach `10^14`; keep them in 64-bit integers.",
          "Use integer ceiling division — floating-point division can round across an integer boundary.",
          "Units cannot move right, so a large `nums[0]` is a hard floor on the answer.",
        ],
      }),
      examples: [
        { input: "[2,7,1,6]", expectedOutput: "5" },
        { input: "[9,3]", expectedOutput: "9" },
        { input: "[0,0,10]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, ri(rng, 4, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const hi = pick(rng, [0, 5, 100, 1000000000, 1000000000, 1000000000]);
        const nums = Array.from({ length: n }, () => (rng() < 0.2 ? 0 : ri(rng, 0, hi)));
        if (rng() < 0.2) nums[n - 1] = hi;
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimizeArrayValue(nums: List[int]) -> int:
              prefix = 0
              best = 0
              for i, x in enumerate(nums):
                  prefix += x
                  best = max(best, (prefix + i) // (i + 1))
              return best
        `,
        javascript: code`
          var minimizeArrayValue = function(nums) {
              var prefix = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  var need = Math.floor((prefix + i) / (i + 1));
                  if (need > best) best = need;
              }
              return best;
          };
        `,
        typescript: code`
          function minimizeArrayValue(nums: number[]): number {
              var prefix = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  var need = Math.floor((prefix + i) / (i + 1));
                  if (need > best) best = need;
              }
              return best;
          }
        `,
        java: code`
          public static int minimizeArrayValue(int[] nums) {
              long prefix = 0, best = 0;
              for (int i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  best = Math.max(best, (prefix + i) / (i + 1));
              }
              return (int) best;
          }
        `,
        cpp: code`
          int minimizeArrayValue(vector<int>& nums) {
              long long prefix = 0, best = 0;
              for (int i = 0; i < (int)nums.size(); i++) {
                  prefix += nums[i];
                  best = max(best, (prefix + i) / (i + 1));
              }
              return (int)best;
          }
        `,
        c: code`
          int minimizeArrayValue(int* nums, int numsSize) {
              long long prefix = 0, best = 0;
              for (int i = 0; i < numsSize; i++) {
                  prefix += nums[i];
                  long long need = (prefix + i) / (i + 1);
                  if (need > best) best = need;
              }
              return (int)best;
          }
        `,
        csharp: code`
          public static int MinimizeArrayValue(int[] nums)
          {
              long prefix = 0, best = 0;
              for (int i = 0; i < nums.Length; i++)
              {
                  prefix += nums[i];
                  best = Math.Max(best, (prefix + i) / (i + 1));
              }
              return (int)best;
          }
        `,
        go: code`
          func minimizeArrayValue(nums []int) int {
          	var prefix, best int64
          	for i, x := range nums {
          		prefix += int64(x)
          		need := (prefix + int64(i)) / int64(i+1)
          		if need > best {
          			best = need
          		}
          	}
          	return int(best)
          }
        `,
        kotlin: code`
          fun minimizeArrayValue(nums: IntArray): Int {
              var prefix = 0L
              var best = 0L
              for (i in nums.indices) {
                  prefix += nums[i]
                  best = maxOf(best, (prefix + i) / (i + 1))
              }
              return best.toInt()
          }
        `,
        swift: code`
          func minimizeArrayValue(_ nums: [Int]) -> Int {
              var prefix = 0
              var best = 0
              for i in 0..<nums.count {
                  prefix += nums[i]
                  best = max(best, (prefix + i) / (i + 1))
              }
              return best
          }
        `,
        rust: code`
          fn minimizeArrayValue(nums: Vec<i32>) -> i32 {
              let mut prefix: i64 = 0;
              let mut best: i64 = 0;
              for i in 0..nums.len() {
                  prefix += nums[i] as i64;
                  let need = (prefix + i as i64) / (i as i64 + 1);
                  if need > best {
                      best = need;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function minimizeArrayValue($nums) {
              $prefix = 0;
              $best = 0;
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  $prefix += $nums[$i];
                  $need = intdiv($prefix + $i, $i + 1);
                  if ($need > $best) $best = $need;
              }
              return $best;
          }
        `,
        ruby: code`
          def minimizeArrayValue(nums)
            prefix = 0
            best = 0
            nums.each_with_index do |x, i|
              prefix += x
              need = (prefix + i) / (i + 1)
              best = need if need > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Number of Subarrays With GCD Equal to K (LC 2447) ───────────
  (() => {
    const g2 = (a: number, b: number): number => (b === 0 ? a : g2(b, a % b));
    const ref = (nums: number[], k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          let g = 0;
          for (let t = i; t <= j; t++) g = g2(g, nums[t]);
          if (g === k) count++;
        }
      }
      return count;
    };
    return {
      slug: "number-of-subarrays-with-gcd-equal-to-k",
      title: "Number of Subarrays With GCD Equal to K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Number Theory", "Amazon", "Google"],
      signature: {
        funcName: "subarrayGCD",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the number of **subarrays** (contiguous, non-empty) whose elements have a **greatest common divisor** equal to `k`.\n\nThe greatest common divisor of a set of numbers is the largest integer that divides every one of them.",
        [
          { in: "nums = [6,3,12,9,2], k = 3", out: "7", note: "`[6,3]`, `[6,3,12]`, `[6,3,12,9]`, `[3]`, `[3,12]`, `[3,12,9]` and `[12,9]`." },
          { in: "nums = [5], k = 2", out: "0" },
          { in: "nums = [4,4,4], k = 4", out: "6", note: "Every one of the six subarrays has GCD 4." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i], k <= 10^9"]),
      hints: [
        "Fix the left end and extend the right end one element at a time — the GCD can be updated incrementally.",
        "As a subarray grows, its GCD only stays the same or drops to a divisor of itself.",
        "Once the running GCD is no longer a multiple of `k`, no extension can bring it back to `k`: stop extending.",
      ],
      editorial: explain({
        idea: "For a fixed start, the GCD of `nums[i..j]` is `gcd(GCD of nums[i..j-1], nums[j])`, so all subarrays with that start cost one gcd step each. And once that GCD stops being a multiple of `k`, it never will be again.",
        steps: [
          "For each start `i`, set `g = 0` (gcd(0, x) = x).",
          "For `j = i..n-1`, update `g = gcd(g, nums[j])`.",
          "If `g % k != 0`, break — every longer subarray also fails.",
          "If `g == k`, count the subarray.",
        ],
        why: "The running GCD of a growing subarray divides the previous one. If `k` does not divide it, `k` does not divide any later value either (they are divisors of it), so none of them can equal `k`. Every subarray is otherwise visited once, so the count is exact.",
        time: "O(n^2 log(max))",
        space: "O(1)",
        pitfalls: [
          "Start the running GCD at 0 (or at `nums[i]`), not at 1 — gcd(1, x) is always 1.",
          "Breaking when `g < k` alone is not enough; break when `k` does not divide `g`.",
          "A single element equal to `k` is a valid subarray.",
        ],
      }),
      examples: [
        { input: "[6,3,12,9,2]\n3", expectedOutput: "7" },
        { input: "[5]\n2", expectedOutput: "0" },
        { input: "[4,4,4]\n4", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 30), ri(rng, 10, 30)]);
        const k = pick(rng, [1, 2, 3, 6, ri(rng, 1, 50), ri(rng, 1, 1000000000)]);
        const maxF = Math.max(1, Math.floor(1000000000 / k));
        const fHi = Math.min(maxF, pick(rng, [4, 12, 60]));
        const nums = Array.from({ length: n }, () => {
          if (rng() < 0.12) return ri(rng, 1, 1000000000);
          return k * ri(rng, 1, fHi);
        });
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def subarrayGCD(nums: List[int], k: int) -> int:
              n = len(nums)
              count = 0
              for i in range(n):
                  g = 0
                  for j in range(i, n):
                      g = gcd(g, nums[j])
                      if g % k != 0:
                          break
                      if g == k:
                          count += 1
              return count
        `,
        javascript: code`
          var subarrayGCD = function(nums, k) {
              var gcd = function(a, b) {
                  while (b !== 0) { var t = a % b; a = b; b = t; }
                  return a;
              };
              var n = nums.length, count = 0;
              for (var i = 0; i < n; i++) {
                  var g = 0;
                  for (var j = i; j < n; j++) {
                      g = gcd(g, nums[j]);
                      if (g % k !== 0) break;
                      if (g === k) count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function gcdSub(a: number, b: number): number {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          }

          function subarrayGCD(nums: number[], k: number): number {
              var n = nums.length, count = 0;
              for (var i = 0; i < n; i++) {
                  var g = 0;
                  for (var j = i; j < n; j++) {
                      g = gcdSub(g, nums[j]);
                      if (g % k !== 0) break;
                      if (g === k) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          static int gcdSub(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int subarrayGCD(int[] nums, int k) {
              int n = nums.length, count = 0;
              for (int i = 0; i < n; i++) {
                  int g = 0;
                  for (int j = i; j < n; j++) {
                      g = gcdSub(g, nums[j]);
                      if (g % k != 0) break;
                      if (g == k) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          static int gcdSub(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int subarrayGCD(vector<int>& nums, int k) {
              int n = nums.size(), count = 0;
              for (int i = 0; i < n; i++) {
                  int g = 0;
                  for (int j = i; j < n; j++) {
                      g = gcdSub(g, nums[j]);
                      if (g % k != 0) break;
                      if (g == k) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          static int gcdSub(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int subarrayGCD(int* nums, int numsSize, int k) {
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  int g = 0;
                  for (int j = i; j < numsSize; j++) {
                      g = gcdSub(g, nums[j]);
                      if (g % k != 0) break;
                      if (g == k) count++;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          static int GcdSub(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int SubarrayGCD(int[] nums, int k)
          {
              int n = nums.Length, count = 0;
              for (int i = 0; i < n; i++)
              {
                  int g = 0;
                  for (int j = i; j < n; j++)
                  {
                      g = GcdSub(g, nums[j]);
                      if (g % k != 0) break;
                      if (g == k) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func gcdSub(a, b int) int {
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return a
          }

          func subarrayGCD(nums []int, k int) int {
          	n, count := len(nums), 0
          	for i := 0; i < n; i++ {
          		g := 0
          		for j := i; j < n; j++ {
          			g = gcdSub(g, nums[j])
          			if g%k != 0 {
          				break
          			}
          			if g == k {
          				count++
          			}
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun gcdSub(x: Int, y: Int): Int {
              var a = x
              var b = y
              while (b != 0) { val t = a % b; a = b; b = t }
              return a
          }

          fun subarrayGCD(nums: IntArray, k: Int): Int {
              val n = nums.size
              var count = 0
              for (i in 0 until n) {
                  var g = 0
                  for (j in i until n) {
                      g = gcdSub(g, nums[j])
                      if (g % k != 0) break
                      if (g == k) count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func gcdSub(_ x: Int, _ y: Int) -> Int {
              var a = x
              var b = y
              while b != 0 { let t = a % b; a = b; b = t }
              return a
          }

          func subarrayGCD(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var count = 0
              for i in 0..<n {
                  var g = 0
                  for j in i..<n {
                      g = gcdSub(g, nums[j])
                      if g % k != 0 { break }
                      if g == k { count += 1 }
                  }
              }
              return count
          }
        `,
        rust: code`
          fn gcd_sub(a: i32, b: i32) -> i32 {
              let (mut a, mut b) = (a, b);
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              a
          }

          fn subarrayGCD(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut count = 0;
              for i in 0..n {
                  let mut g = 0;
                  for j in i..n {
                      g = gcd_sub(g, nums[j]);
                      if g % k != 0 {
                          break;
                      }
                      if g == k {
                          count += 1;
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function gcdSub($a, $b) {
              while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
              return $a;
          }

          function subarrayGCD($nums, $k) {
              $n = count($nums);
              $count = 0;
              for ($i = 0; $i < $n; $i++) {
                  $g = 0;
                  for ($j = $i; $j < $n; $j++) {
                      $g = gcdSub($g, $nums[$j]);
                      if ($g % $k != 0) break;
                      if ($g == $k) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def subarrayGCD(nums, k)
            n = nums.length
            count = 0
            (0...n).each do |i|
              g = 0
              (i...n).each do |j|
                g = g.gcd(nums[j])
                break if g % k != 0
                count += 1 if g == k
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Number of Subarrays With LCM Equal to K (LC 2470) ───────────
  (() => {
    const g2 = (a: number, b: number): number => (b === 0 ? a : g2(b, a % b));
    // Per subarray: the LCM can equal k only if every element divides k, and then it stays <= k.
    const ref = (nums: number[], k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          let all = true;
          let l = 1;
          for (let t = i; t <= j; t++) {
            if (k % nums[t] !== 0) {
              all = false;
              break;
            }
            l = (l / g2(l, nums[t])) * nums[t];
          }
          if (all && l === k) count++;
        }
      }
      return count;
    };
    return {
      slug: "number-of-subarrays-with-lcm-equal-to-k",
      title: "Number of Subarrays With LCM Equal to K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Number Theory", "Amazon", "Google"],
      signature: {
        funcName: "subarrayLCM",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the number of **subarrays** (contiguous, non-empty) whose elements have a **least common multiple** equal to `k`.\n\nThe least common multiple of a set of numbers is the smallest positive integer divisible by every one of them.",
        [
          { in: "nums = [2,6,3,1,4], k = 6", out: "6", note: "`[2,6]`, `[2,6,3]`, `[2,6,3,1]`, `[6]`, `[6,3]` and `[6,3,1]`. Anything containing the `4` has LCM 12 or more." },
          { in: "nums = [7], k = 1", out: "0" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i], k <= 1000"]),
      hints: [
        "Fix the left end and extend to the right, updating the LCM incrementally: `lcm(a, b) = a / gcd(a, b) * b`.",
        "If some element does not divide `k`, no subarray containing it can have LCM `k`.",
        "Stop extending as soon as the running LCM no longer divides `k` — this also keeps every value at most `k`, so nothing overflows.",
      ],
      editorial: explain({
        idea: "The LCM of a growing subarray only grows (each new value is a multiple of the old one). Once it stops dividing `k` it can never come back to `k`, so each start only extends while the LCM is a divisor of `k`.",
        steps: [
          "For each start `i`, set `l = 1`.",
          "For `j = i..n-1`, update `l = l / gcd(l, nums[j]) * nums[j]`.",
          "If `k % l != 0`, break.",
          "If `l == k`, count the subarray.",
        ],
        why: "Extending a subarray replaces its LCM by a multiple of it. If `l` does not divide `k`, no multiple of `l` divides `k` either, so `k` is unreachable and breaking loses nothing. Before the break every `l` divides `k`, so it is at most `k` and the products stay small.",
        time: "O(n^2 log k)",
        space: "O(1)",
        pitfalls: [
          "Without the early break the LCM of a long subarray overflows 64-bit integers quickly.",
          "Divide before multiplying (`l / gcd * x`) to keep the intermediate small.",
          "Start the running LCM at 1, the identity for LCM.",
        ],
      }),
      examples: [
        { input: "[2,6,3,1,4]\n6", expectedOutput: "6" },
        { input: "[7]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 30), ri(rng, 10, 30)]);
        const k = pick(rng, [1, 6, 12, 60, 360, 720, 840, 1000, ri(rng, 1, 1000)]);
        const divisors: number[] = [];
        for (let d = 1; d <= k; d++) if (k % d === 0) divisors.push(d);
        const nums = Array.from({ length: n }, () => (rng() < 0.12 ? ri(rng, 1, 1000) : pick(rng, divisors)));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def subarrayLCM(nums: List[int], k: int) -> int:
              n = len(nums)
              count = 0
              for i in range(n):
                  l = 1
                  for j in range(i, n):
                      l = l // gcd(l, nums[j]) * nums[j]
                      if k % l != 0:
                          break
                      if l == k:
                          count += 1
              return count
        `,
        javascript: code`
          var subarrayLCM = function(nums, k) {
              var gcd = function(a, b) {
                  while (b !== 0) { var t = a % b; a = b; b = t; }
                  return a;
              };
              var n = nums.length, count = 0;
              for (var i = 0; i < n; i++) {
                  var l = 1;
                  for (var j = i; j < n; j++) {
                      l = l / gcd(l, nums[j]) * nums[j];
                      if (k % l !== 0) break;
                      if (l === k) count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function gcdLcm(a: number, b: number): number {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          }

          function subarrayLCM(nums: number[], k: number): number {
              var n = nums.length, count = 0;
              for (var i = 0; i < n; i++) {
                  var l = 1;
                  for (var j = i; j < n; j++) {
                      l = l / gcdLcm(l, nums[j]) * nums[j];
                      if (k % l !== 0) break;
                      if (l === k) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          static int gcdLcm(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int subarrayLCM(int[] nums, int k) {
              int n = nums.length, count = 0;
              for (int i = 0; i < n; i++) {
                  int l = 1;
                  for (int j = i; j < n; j++) {
                      l = l / gcdLcm(l, nums[j]) * nums[j];
                      if (k % l != 0) break;
                      if (l == k) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          static int gcdLcm(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int subarrayLCM(vector<int>& nums, int k) {
              int n = nums.size(), count = 0;
              for (int i = 0; i < n; i++) {
                  int l = 1;
                  for (int j = i; j < n; j++) {
                      l = l / gcdLcm(l, nums[j]) * nums[j];
                      if (k % l != 0) break;
                      if (l == k) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          static int gcdLcm(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int subarrayLCM(int* nums, int numsSize, int k) {
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  int l = 1;
                  for (int j = i; j < numsSize; j++) {
                      l = l / gcdLcm(l, nums[j]) * nums[j];
                      if (k % l != 0) break;
                      if (l == k) count++;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          static int GcdLcm(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int SubarrayLCM(int[] nums, int k)
          {
              int n = nums.Length, count = 0;
              for (int i = 0; i < n; i++)
              {
                  int l = 1;
                  for (int j = i; j < n; j++)
                  {
                      l = l / GcdLcm(l, nums[j]) * nums[j];
                      if (k % l != 0) break;
                      if (l == k) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func gcdLcm(a, b int) int {
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return a
          }

          func subarrayLCM(nums []int, k int) int {
          	n, count := len(nums), 0
          	for i := 0; i < n; i++ {
          		l := 1
          		for j := i; j < n; j++ {
          			l = l / gcdLcm(l, nums[j]) * nums[j]
          			if k%l != 0 {
          				break
          			}
          			if l == k {
          				count++
          			}
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun gcdLcm(x: Int, y: Int): Int {
              var a = x
              var b = y
              while (b != 0) { val t = a % b; a = b; b = t }
              return a
          }

          fun subarrayLCM(nums: IntArray, k: Int): Int {
              val n = nums.size
              var count = 0
              for (i in 0 until n) {
                  var l = 1
                  for (j in i until n) {
                      l = l / gcdLcm(l, nums[j]) * nums[j]
                      if (k % l != 0) break
                      if (l == k) count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func gcdLcm(_ x: Int, _ y: Int) -> Int {
              var a = x
              var b = y
              while b != 0 { let t = a % b; a = b; b = t }
              return a
          }

          func subarrayLCM(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var count = 0
              for i in 0..<n {
                  var l = 1
                  for j in i..<n {
                      l = l / gcdLcm(l, nums[j]) * nums[j]
                      if k % l != 0 { break }
                      if l == k { count += 1 }
                  }
              }
              return count
          }
        `,
        rust: code`
          fn gcd_lcm(a: i32, b: i32) -> i32 {
              let (mut a, mut b) = (a, b);
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              a
          }

          fn subarrayLCM(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut count = 0;
              for i in 0..n {
                  let mut l = 1;
                  for j in i..n {
                      l = l / gcd_lcm(l, nums[j]) * nums[j];
                      if k % l != 0 {
                          break;
                      }
                      if l == k {
                          count += 1;
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function gcdLcm($a, $b) {
              while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
              return $a;
          }

          function subarrayLCM($nums, $k) {
              $n = count($nums);
              $count = 0;
              for ($i = 0; $i < $n; $i++) {
                  $l = 1;
                  for ($j = $i; $j < $n; $j++) {
                      $l = intdiv($l, gcdLcm($l, $nums[$j])) * $nums[$j];
                      if ($k % $l != 0) break;
                      if ($l == $k) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def subarrayLCM(nums, k)
            n = nums.length
            count = 0
            (0...n).each do |i|
              l = 1
              (i...n).each do |j|
                l = l.lcm(nums[j])
                break if k % l != 0
                count += 1 if l == k
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum of Distinct Subarrays With Length K (LC 2461) ───
  (() => {
    const ref = (nums: number[], k: number) => {
      let best = 0;
      for (let i = 0; i + k <= nums.length; i++) {
        const w = nums.slice(i, i + k);
        if (new Set(w).size === k) best = Math.max(best, w.reduce((a, b) => a + b, 0));
      }
      return best;
    };
    return {
      slug: "maximum-sum-of-distinct-subarrays-with-length-k",
      title: "Maximum Sum of Distinct Subarrays With Length K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Microsoft", "Google"],
      signature: {
        funcName: "maximumSubarraySum",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Among all subarrays of `nums` that have length exactly `k` **and** consist of `k` **distinct** values, return the largest sum. If no subarray of length `k` has all-distinct values, return `0`.\n\n*Note:* the original problem allows values up to `10^5` and returns a 64-bit sum; here `nums[i] <= 10^4`, so the answer always fits in a 32-bit integer.",
        [
          { in: "nums = [3,6,6,2,7,4,4], k = 3", out: "15", note: "The windows with distinct values are `[6,2,7]` (sum 15) and `[2,7,4]` (sum 13); the rest repeat a value." },
          { in: "nums = [5,5,5], k = 2", out: "0" },
          { in: "nums = [1,2,3], k = 3", out: "6" },
        ],
        ["1 <= k <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"]),
      hints: [
        "Every candidate is a window of fixed length `k` — slide it one step at a time.",
        "Maintain the window's sum and a count of each value inside it as elements enter and leave.",
        "The window is all-distinct exactly when the number of different values in it equals `k`.",
      ],
      editorial: explain({
        idea: "A fixed-size sliding window with a frequency map: each step adds one element and removes one, updating the sum and the number of distinct values in O(1).",
        steps: [
          "Keep `sum`, a frequency map `cnt`, and `distinct` = the number of values with a non-zero count.",
          "For each index `i`, add `nums[i]` (bump `distinct` when its count goes 0 → 1).",
          "If `i >= k`, remove `nums[i - k]` (drop `distinct` when its count goes 1 → 0).",
          "Once the window has `k` elements, if `distinct == k` update the best sum. Return the best (0 if never updated).",
        ],
        why: "A window of `k` elements has `k` distinct values exactly when no value repeats, so `distinct == k` is the precise test. The window visits every length-`k` subarray once, so the maximum over the valid ones is found.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Return 0, not a negative sentinel, when no window qualifies.",
          "Update `distinct` only on 0 ↔ 1 transitions of a count.",
          "With the original limits the sum needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[3,6,6,2,7,4,4]\n3", expectedOutput: "15" },
        { input: "[5,5,5]\n2", expectedOutput: "0" },
        { input: "[1,2,3]\n3", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const k = pick(rng, [1, n, ri(rng, 1, Math.min(n, 4)), ri(rng, 1, n)]);
        const hi = pick(rng, [3, 8, 30, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSubarraySum(nums: List[int], k: int) -> int:
              cnt = {}
              distinct = 0
              total = 0
              best = 0
              for i, x in enumerate(nums):
                  total += x
                  cnt[x] = cnt.get(x, 0) + 1
                  if cnt[x] == 1:
                      distinct += 1
                  if i >= k:
                      y = nums[i - k]
                      total -= y
                      cnt[y] -= 1
                      if cnt[y] == 0:
                          distinct -= 1
                  if i >= k - 1 and distinct == k:
                      best = max(best, total)
              return best
        `,
        javascript: code`
          var maximumSubarraySum = function(nums, k) {
              var cnt = new Map();
              var distinct = 0, total = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  total += x;
                  var cx = (cnt.get(x) || 0) + 1;
                  cnt.set(x, cx);
                  if (cx === 1) distinct++;
                  if (i >= k) {
                      var y = nums[i - k];
                      total -= y;
                      var cy = cnt.get(y) - 1;
                      cnt.set(y, cy);
                      if (cy === 0) distinct--;
                  }
                  if (i >= k - 1 && distinct === k && total > best) best = total;
              }
              return best;
          };
        `,
        typescript: code`
          function maximumSubarraySum(nums: number[], k: number): number {
              var cnt: { [key: string]: number } = {};
              var distinct = 0, total = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = "" + nums[i];
                  total += nums[i];
                  cnt[x] = (cnt[x] === undefined ? 0 : cnt[x]) + 1;
                  if (cnt[x] === 1) distinct++;
                  if (i >= k) {
                      var y = "" + nums[i - k];
                      total -= nums[i - k];
                      cnt[y] = cnt[y] - 1;
                      if (cnt[y] === 0) distinct--;
                  }
                  if (i >= k - 1 && distinct === k && total > best) best = total;
              }
              return best;
          }
        `,
        java: code`
          public static int maximumSubarraySum(int[] nums, int k) {
              Map<Integer, Integer> cnt = new HashMap<>();
              int distinct = 0;
              long total = 0, best = 0;
              for (int i = 0; i < nums.length; i++) {
                  int x = nums[i];
                  total += x;
                  if (cnt.merge(x, 1, Integer::sum) == 1) distinct++;
                  if (i >= k) {
                      int y = nums[i - k];
                      total -= y;
                      int cy = cnt.get(y) - 1;
                      cnt.put(y, cy);
                      if (cy == 0) distinct--;
                  }
                  if (i >= k - 1 && distinct == k && total > best) best = total;
              }
              return (int) best;
          }
        `,
        cpp: code`
          int maximumSubarraySum(vector<int>& nums, int k) {
              unordered_map<int, int> cnt;
              int distinct = 0;
              long long total = 0, best = 0;
              for (int i = 0; i < (int)nums.size(); i++) {
                  int x = nums[i];
                  total += x;
                  if (++cnt[x] == 1) distinct++;
                  if (i >= k) {
                      int y = nums[i - k];
                      total -= y;
                      if (--cnt[y] == 0) distinct--;
                  }
                  if (i >= k - 1 && distinct == k && total > best) best = total;
              }
              return (int)best;
          }
        `,
        c: code`
          int maximumSubarraySum(int* nums, int numsSize, int k) {
              /* Values are at most 10^4, so a direct-address count table works. */
              int* cnt = (int*)calloc(10001, sizeof(int));
              int distinct = 0;
              long long total = 0, best = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  total += x;
                  if (++cnt[x] == 1) distinct++;
                  if (i >= k) {
                      int y = nums[i - k];
                      total -= y;
                      if (--cnt[y] == 0) distinct--;
                  }
                  if (i >= k - 1 && distinct == k && total > best) best = total;
              }
              free(cnt);
              return (int)best;
          }
        `,
        csharp: code`
          public static int MaximumSubarraySum(int[] nums, int k)
          {
              var cnt = new Dictionary<int, int>();
              int distinct = 0;
              long total = 0, best = 0;
              for (int i = 0; i < nums.Length; i++)
              {
                  int x = nums[i];
                  total += x;
                  cnt.TryGetValue(x, out int cx);
                  cnt[x] = cx + 1;
                  if (cx + 1 == 1) distinct++;
                  if (i >= k)
                  {
                      int y = nums[i - k];
                      total -= y;
                      cnt[y] = cnt[y] - 1;
                      if (cnt[y] == 0) distinct--;
                  }
                  if (i >= k - 1 && distinct == k && total > best) best = total;
              }
              return (int)best;
          }
        `,
        go: code`
          func maximumSubarraySum(nums []int, k int) int {
          	cnt := map[int]int{}
          	distinct, total, best := 0, 0, 0
          	for i, x := range nums {
          		total += x
          		cnt[x]++
          		if cnt[x] == 1 {
          			distinct++
          		}
          		if i >= k {
          			y := nums[i-k]
          			total -= y
          			cnt[y]--
          			if cnt[y] == 0 {
          				distinct--
          			}
          		}
          		if i >= k-1 && distinct == k && total > best {
          			best = total
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maximumSubarraySum(nums: IntArray, k: Int): Int {
              val cnt = HashMap<Int, Int>()
              var distinct = 0
              var total = 0L
              var best = 0L
              for (i in nums.indices) {
                  val x = nums[i]
                  total += x
                  val cx = (cnt[x] ?: 0) + 1
                  cnt[x] = cx
                  if (cx == 1) distinct++
                  if (i >= k) {
                      val y = nums[i - k]
                      total -= y
                      val cy = cnt[y]!! - 1
                      cnt[y] = cy
                      if (cy == 0) distinct--
                  }
                  if (i >= k - 1 && distinct == k && total > best) best = total
              }
              return best.toInt()
          }
        `,
        swift: code`
          func maximumSubarraySum(_ nums: [Int], _ k: Int) -> Int {
              var cnt = [Int: Int]()
              var distinct = 0
              var total = 0
              var best = 0
              for i in 0..<nums.count {
                  let x = nums[i]
                  total += x
                  cnt[x, default: 0] += 1
                  if cnt[x]! == 1 { distinct += 1 }
                  if i >= k {
                      let y = nums[i - k]
                      total -= y
                      cnt[y]! -= 1
                      if cnt[y]! == 0 { distinct -= 1 }
                  }
                  if i >= k - 1 && distinct == k && total > best { best = total }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maximumSubarraySum(nums: Vec<i32>, k: i32) -> i32 {
              let k = k as usize;
              let mut cnt: HashMap<i32, i32> = HashMap::new();
              let mut distinct = 0usize;
              let mut total: i64 = 0;
              let mut best: i64 = 0;
              for i in 0..nums.len() {
                  let x = nums[i];
                  total += x as i64;
                  let cx = cnt.entry(x).or_insert(0);
                  *cx += 1;
                  if *cx == 1 {
                      distinct += 1;
                  }
                  if i >= k {
                      let y = nums[i - k];
                      total -= y as i64;
                      let cy = cnt.get_mut(&y).unwrap();
                      *cy -= 1;
                      if *cy == 0 {
                          distinct -= 1;
                      }
                  }
                  if i + 1 >= k && distinct == k && total > best {
                      best = total;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function maximumSubarraySum($nums, $k) {
              $cnt = [];
              $distinct = 0;
              $total = 0;
              $best = 0;
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  $x = $nums[$i];
                  $total += $x;
                  $cnt[$x] = (isset($cnt[$x]) ? $cnt[$x] : 0) + 1;
                  if ($cnt[$x] == 1) $distinct++;
                  if ($i >= $k) {
                      $y = $nums[$i - $k];
                      $total -= $y;
                      $cnt[$y]--;
                      if ($cnt[$y] == 0) $distinct--;
                  }
                  if ($i >= $k - 1 && $distinct == $k && $total > $best) $best = $total;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumSubarraySum(nums, k)
            cnt = Hash.new(0)
            distinct = 0
            total = 0
            best = 0
            nums.each_with_index do |x, i|
              total += x
              cnt[x] += 1
              distinct += 1 if cnt[x] == 1
              if i >= k
                y = nums[i - k]
                total -= y
                cnt[y] -= 1
                distinct -= 1 if cnt[y] == 0
              end
              best = total if i >= k - 1 && distinct == k && total > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Divide Players Into Teams of Equal Skill (LC 2491) ──────────
  (() => {
    // Counting reference: every player of skill v must meet a partner of skill target - v.
    const ref = (skill: number[]) => {
      const n = skill.length;
      const total = skill.reduce((a, b) => a + b, 0);
      if ((2 * total) % n !== 0) return -1;
      const target = (2 * total) / n;
      const cnt = new Map<number, number>();
      for (const s of skill) cnt.set(s, (cnt.get(s) || 0) + 1);
      let chem = 0;
      const keys = Array.from(cnt.keys()).sort((a, b) => a - b);
      for (const v of keys) {
        const c = cnt.get(v)!;
        if (c === 0) continue;
        const w = target - v;
        if (w === v) {
          if (c % 2 !== 0) return -1;
          chem += (c / 2) * v * v;
          cnt.set(v, 0);
        } else {
          if ((cnt.get(w) || 0) !== c) return -1;
          chem += c * v * w;
          cnt.set(v, 0);
          cnt.set(w, 0);
        }
      }
      return chem;
    };
    return {
      slug: "divide-players-into-teams-of-equal-skill",
      title: "Divide Players Into Teams of Equal Skill",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Sorting", "Amazon", "Google"],
      signature: { funcName: "dividePlayers", params: [{ name: "skill", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`skill` has an **even** length `n`; `skill[i]` is the skill of player `i`. Split the players into `n / 2` teams of **two** so that every team has the **same total skill**.\n\nThe **chemistry** of a team is the **product** of its two players' skills. Return the sum of the chemistry of all teams, or `-1` if no such split exists.\n\n*Note:* the original problem allows `10^5` players and returns a 64-bit sum; here `skill.length <= 2000`, so the answer always fits in a 32-bit integer.",
        [
          { in: "skill = [4,2,5,1,3,3]", out: "22", note: "Teams `(1,5)`, `(2,4)` and `(3,3)` each total 6; chemistry 5 + 8 + 9 = 22." },
          { in: "skill = [2,7]", out: "14" },
          { in: "skill = [1,1,2,3]", out: "-1", note: "The total 7 cannot be split into two equal team totals." },
        ],
        ["2 <= skill.length <= 2000", "skill.length is even", "1 <= skill[i] <= 1000"]),
      hints: [
        "If a split exists, every team's total must be `2 * sum / n`.",
        "The weakest player must be paired with the strongest one — otherwise the strongest one's team would be too strong.",
        "Sort, pair `skill[i]` with `skill[n-1-i]`, and check every pair has the same total while summing the products.",
      ],
      editorial: explain({
        idea: "Sorted, the only possible pairing is outermost-with-outermost: the smallest player must team up with the largest. So pairing the sorted ends inwards either works or proves no split exists.",
        steps: [
          "Sort `skill` ascending.",
          "Let `target = skill[0] + skill[n-1]`.",
          "For `i = 0 .. n/2 - 1`, pair `skill[i]` with `skill[n-1-i]`; if their sum differs from `target`, return `-1`.",
          "Otherwise add `skill[i] * skill[n-1-i]` to the answer and return it.",
        ],
        why: "Suppose a valid split with common total `T` exists. The largest player `M` is paired with someone of skill `T - M`, which is the smallest possible partner value; if a smaller player `m < T - M` existed, its partner would need skill `T - m > M`, impossible. So the smallest and largest are paired, and removing them leaves the same situation on the rest — by induction, the end-to-end pairing is the only one, and the check is exact.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "Checking only that the total is divisible by `n / 2` is not enough — `[1,1,2,4]` has total 8 but no valid split.",
          "Chemistry is a product per team, summed — not the product of team totals.",
          "With the original limits the sum needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[4,2,5,1,3,3]", expectedOutput: "22" },
        { input: "[2,7]", expectedOutput: "14" },
        { input: "[1,1,2,3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const teams = pick(rng, [1, 2, ri(rng, 2, 6), ri(rng, 6, 20)]);
        const hi = pick(rng, [6, 50, 1000]);
        const target = ri(rng, 2, Math.min(2 * hi, 2000));
        const skill: number[] = [];
        for (let t = 0; t < teams; t++) {
          const lo = Math.max(1, target - 1000);
          const up = Math.min(1000, target - 1);
          const a = ri(rng, lo, up);
          skill.push(a, target - a);
        }
        if (rng() < 0.35) {
          const i = ri(rng, 0, skill.length - 1);
          skill[i] = Math.max(1, Math.min(1000, skill[i] + pick(rng, [-2, -1, 1, 2])));
        }
        shuffle(rng, skill);
        return { input: fmtIntArr(skill), expectedOutput: String(ref(skill)) };
      },
      solutions: {
        python: code`
          from typing import List

          def dividePlayers(skill: List[int]) -> int:
              s = sorted(skill)
              n = len(s)
              target = s[0] + s[n - 1]
              chem = 0
              for i in range(n // 2):
                  a, b = s[i], s[n - 1 - i]
                  if a + b != target:
                      return -1
                  chem += a * b
              return chem
        `,
        javascript: code`
          var dividePlayers = function(skill) {
              var s = skill.slice().sort(function(a, b) { return a - b; });
              var n = s.length, target = s[0] + s[n - 1], chem = 0;
              for (var i = 0; i < n / 2; i++) {
                  var a = s[i], b = s[n - 1 - i];
                  if (a + b !== target) return -1;
                  chem += a * b;
              }
              return chem;
          };
        `,
        typescript: code`
          function dividePlayers(skill: number[]): number {
              var s: number[] = skill.slice();
              s.sort(function(a: number, b: number) { return a - b; });
              var n = s.length, target = s[0] + s[n - 1], chem = 0;
              for (var i = 0; i < n / 2; i++) {
                  var a = s[i], b = s[n - 1 - i];
                  if (a + b !== target) return -1;
                  chem += a * b;
              }
              return chem;
          }
        `,
        java: code`
          public static int dividePlayers(int[] skill) {
              int[] s = skill.clone();
              Arrays.sort(s);
              int n = s.length, target = s[0] + s[n - 1];
              long chem = 0;
              for (int i = 0; i < n / 2; i++) {
                  int a = s[i], b = s[n - 1 - i];
                  if (a + b != target) return -1;
                  chem += (long) a * b;
              }
              return (int) chem;
          }
        `,
        cpp: code`
          int dividePlayers(vector<int>& skill) {
              vector<int> s(skill.begin(), skill.end());
              sort(s.begin(), s.end());
              int n = s.size(), target = s[0] + s[n - 1];
              long long chem = 0;
              for (int i = 0; i < n / 2; i++) {
                  int a = s[i], b = s[n - 1 - i];
                  if (a + b != target) return -1;
                  chem += (long long)a * b;
              }
              return (int)chem;
          }
        `,
        c: code`
          static int cmpPlayersAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int dividePlayers(int* skill, int skillSize) {
              int n = skillSize;
              int* s = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) s[i] = skill[i];
              qsort(s, n, sizeof(int), cmpPlayersAsc);
              int target = s[0] + s[n - 1];
              long long chem = 0;
              for (int i = 0; i < n / 2; i++) {
                  int a = s[i], b = s[n - 1 - i];
                  if (a + b != target) {
                      free(s);
                      return -1;
                  }
                  chem += (long long)a * b;
              }
              free(s);
              return (int)chem;
          }
        `,
        csharp: code`
          public static int DividePlayers(int[] skill)
          {
              int[] s = (int[])skill.Clone();
              Array.Sort(s);
              int n = s.Length, target = s[0] + s[n - 1];
              long chem = 0;
              for (int i = 0; i < n / 2; i++)
              {
                  int a = s[i], b = s[n - 1 - i];
                  if (a + b != target) return -1;
                  chem += (long)a * b;
              }
              return (int)chem;
          }
        `,
        go: code`
          func dividePlayers(skill []int) int {
          	s := make([]int, len(skill))
          	copy(s, skill)
          	sort.Ints(s)
          	n := len(s)
          	target := s[0] + s[n-1]
          	chem := 0
          	for i := 0; i < n/2; i++ {
          		a, b := s[i], s[n-1-i]
          		if a+b != target {
          			return -1
          		}
          		chem += a * b
          	}
          	return chem
          }
        `,
        kotlin: code`
          fun dividePlayers(skill: IntArray): Int {
              val s = skill.sortedArray()
              val n = s.size
              val target = s[0] + s[n - 1]
              var chem = 0L
              for (i in 0 until n / 2) {
                  val a = s[i]
                  val b = s[n - 1 - i]
                  if (a + b != target) return -1
                  chem += a.toLong() * b
              }
              return chem.toInt()
          }
        `,
        swift: code`
          func dividePlayers(_ skill: [Int]) -> Int {
              let s = skill.sorted()
              let n = s.count
              let target = s[0] + s[n - 1]
              var chem = 0
              for i in 0..<(n / 2) {
                  let a = s[i], b = s[n - 1 - i]
                  if a + b != target { return -1 }
                  chem += a * b
              }
              return chem
          }
        `,
        rust: code`
          fn dividePlayers(skill: Vec<i32>) -> i32 {
              let mut s = skill.clone();
              s.sort();
              let n = s.len();
              let target = s[0] + s[n - 1];
              let mut chem: i64 = 0;
              for i in 0..n / 2 {
                  let (a, b) = (s[i], s[n - 1 - i]);
                  if a + b != target {
                      return -1;
                  }
                  chem += a as i64 * b as i64;
              }
              chem as i32
          }
        `,
        php: code`
          function dividePlayers($skill) {
              $s = $skill;
              sort($s);
              $n = count($s);
              $target = $s[0] + $s[$n - 1];
              $chem = 0;
              for ($i = 0; $i < intdiv($n, 2); $i++) {
                  $a = $s[$i];
                  $b = $s[$n - 1 - $i];
                  if ($a + $b != $target) return -1;
                  $chem += $a * $b;
              }
              return $chem;
          }
        `,
        ruby: code`
          def dividePlayers(skill)
            s = skill.sort
            n = s.length
            target = s[0] + s[n - 1]
            chem = 0
            (0...(n / 2)).each do |i|
              a = s[i]
              b = s[n - 1 - i]
              return -1 if a + b != target
              chem += a * b
            end
            chem
          end
        `,
      },
    };
  })(),

  // ── Longest Square Streak in an Array (LC 2501) ─────────────────
  (() => {
    const ref = (nums: number[]) => {
      const have = new Set(nums);
      let best = -1;
      have.forEach((v) => {
        let len = 1;
        let x = v * v;
        while (have.has(x)) {
          len++;
          x = x * x;
        }
        if (len >= 2 && len > best) best = len;
      });
      return best;
    };
    return {
      slug: "longest-square-streak-in-an-array",
      title: "Longest Square Streak in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "longestSquareStreak", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subsequence of `nums` is a **square streak** when it has length **at least 2** and, once sorted, every element except the first is the **square** of the element before it (for example `3, 9, 81`).\n\nReturn the length of the longest square streak in `nums`, or `-1` if there is none.",
        [
          { in: "nums = [4,16,3,256,9,7]", out: "3", note: "`[4,16,256]`: 16 = 4² and 256 = 16². `[3,9]` is a shorter streak." },
          { in: "nums = [2,3,5,6,7]", out: "-1" },
          { in: "nums = [5,25,25,625]", out: "3", note: "`[5,25,625]` — a value can be used only once in the streak, but duplicates do not hurt." },
        ],
        ["2 <= nums.length <= 10^5", "2 <= nums[i] <= 10^5"]),
      hints: [
        "Order in the array does not matter for a subsequence that gets sorted — only which values are present.",
        "Put the values in a set and, from each value `v`, follow `v, v², v⁴, …` while the next value is present.",
        "Values are at most `10^5`, so a chain is at most 5 long (2, 4, 16, 256, 65536); stop before squaring overflows.",
      ],
      editorial: explain({
        idea: "A streak is determined by its smallest value: the rest are forced (`v²`, `v⁴`, …). So try every distinct value as the start and walk its chain through a hash set.",
        steps: [
          "Insert all values into a set.",
          "For each distinct value `v`, set `len = 1`, `x = v`, and while `x * x` is in the set (and `x * x <= 10^5`), square `x` and increment `len`.",
          "Track the largest `len` that is at least 2.",
          "Return it, or `-1` if no chain reached length 2.",
        ],
        why: "Sorting a square streak puts it in the order `v, v², v⁴, …`, so every streak is a prefix of the chain that starts at its smallest element, and the walk from that element finds the longest such prefix. Squares grow so fast that each walk takes at most four steps.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`v * v` overflows 32-bit integers for `v > 46340`; check `v <= 316` (or use 64-bit) before squaring.",
          "A single element is not a streak — the answer is `-1`, not 1.",
          "Duplicated values do not lengthen a streak.",
        ],
      }),
      examples: [
        { input: "[4,16,3,256,9,7]", expectedOutput: "3" },
        { input: "[2,3,5,6,7]", expectedOutput: "-1" },
        { input: "[5,25,25,625]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, ri(rng, 4, 10), ri(rng, 10, 40)]);
        const nums: number[] = [];
        const chains = ri(rng, 0, 3);
        for (let c = 0; c < chains && nums.length < n; c++) {
          let v = pick(rng, [2, 2, 3, 4, 5, 6, 7, 10, 13, 17, ri(rng, 2, 316)]);
          const len = ri(rng, 1, 5);
          for (let j = 0; j < len && v <= 100000 && nums.length < n; j++) {
            if (rng() < 0.85) nums.push(v);
            v = v * v;
          }
        }
        while (nums.length < n) nums.push(rng() < 0.5 ? ri(rng, 2, 50) : ri(rng, 2, 100000));
        shuffle(rng, nums);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestSquareStreak(nums: List[int]) -> int:
              have = set(nums)
              best = -1
              for v in have:
                  length = 1
                  x = v
                  while x * x in have:
                      x = x * x
                      length += 1
                  if length >= 2 and length > best:
                      best = length
              return best
        `,
        javascript: code`
          var longestSquareStreak = function(nums) {
              var have = new Set(nums);
              var best = -1;
              have.forEach(function(v) {
                  var len = 1, x = v;
                  while (x <= 316 && have.has(x * x)) {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              });
              return best;
          };
        `,
        typescript: code`
          function longestSquareStreak(nums: number[]): number {
              var have: { [k: string]: boolean } = {};
              for (var i = 0; i < nums.length; i++) have["" + nums[i]] = true;
              var best = -1;
              for (var j = 0; j < nums.length; j++) {
                  var len = 1, x = nums[j];
                  while (x <= 316 && have["" + (x * x)] === true) {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              }
              return best;
          }
        `,
        java: code`
          public static int longestSquareStreak(int[] nums) {
              Set<Integer> have = new HashSet<>();
              for (int v : nums) have.add(v);
              int best = -1;
              for (int v : have) {
                  int len = 1, x = v;
                  while (x <= 316 && have.contains(x * x)) {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              }
              return best;
          }
        `,
        cpp: code`
          int longestSquareStreak(vector<int>& nums) {
              unordered_set<int> have(nums.begin(), nums.end());
              int best = -1;
              for (int v : have) {
                  int len = 1, x = v;
                  while (x <= 316 && have.count(x * x)) {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              }
              return best;
          }
        `,
        c: code`
          int longestSquareStreak(int* nums, int numsSize) {
              /* Values are at most 10^5: a presence table indexed by value. */
              char* have = (char*)calloc(100001, 1);
              for (int i = 0; i < numsSize; i++) have[nums[i]] = 1;
              int best = -1;
              for (int i = 0; i < numsSize; i++) {
                  int len = 1, x = nums[i];
                  while (x <= 316 && have[x * x]) {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              }
              free(have);
              return best;
          }
        `,
        csharp: code`
          public static int LongestSquareStreak(int[] nums)
          {
              var have = new HashSet<int>(nums);
              int best = -1;
              foreach (int v in have)
              {
                  int len = 1, x = v;
                  while (x <= 316 && have.Contains(x * x))
                  {
                      x = x * x;
                      len++;
                  }
                  if (len >= 2 && len > best) best = len;
              }
              return best;
          }
        `,
        go: code`
          func longestSquareStreak(nums []int) int {
          	have := map[int]bool{}
          	for _, v := range nums {
          		have[v] = true
          	}
          	best := -1
          	for v := range have {
          		length, x := 1, v
          		for x <= 316 && have[x*x] {
          			x = x * x
          			length++
          		}
          		if length >= 2 && length > best {
          			best = length
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun longestSquareStreak(nums: IntArray): Int {
              val have = HashSet<Int>()
              for (v in nums) have.add(v)
              var best = -1
              for (v in have) {
                  var len = 1
                  var x = v
                  while (x <= 316 && have.contains(x * x)) {
                      x *= x
                      len++
                  }
                  if (len >= 2 && len > best) best = len
              }
              return best
          }
        `,
        swift: code`
          func longestSquareStreak(_ nums: [Int]) -> Int {
              let have = Set(nums)
              var best = -1
              for v in have {
                  var len = 1
                  var x = v
                  while x <= 316 && have.contains(x * x) {
                      x = x * x
                      len += 1
                  }
                  if len >= 2 && len > best { best = len }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn longestSquareStreak(nums: Vec<i32>) -> i32 {
              let have: HashSet<i32> = nums.iter().cloned().collect();
              let mut best = -1;
              for &v in have.iter() {
                  let mut len = 1;
                  let mut x = v;
                  while x <= 316 && have.contains(&(x * x)) {
                      x = x * x;
                      len += 1;
                  }
                  if len >= 2 && len > best {
                      best = len;
                  }
              }
              best
          }
        `,
        php: code`
          function longestSquareStreak($nums) {
              $have = [];
              foreach ($nums as $v) $have[$v] = true;
              $best = -1;
              foreach ($have as $v => $unused) {
                  $len = 1;
                  $x = $v;
                  while ($x <= 316 && isset($have[$x * $x])) {
                      $x = $x * $x;
                      $len++;
                  }
                  if ($len >= 2 && $len > $best) $best = $len;
              }
              return $best;
          }
        `,
        ruby: code`
          require 'set'

          def longestSquareStreak(nums)
            have = Set.new(nums)
            best = -1
            have.each do |v|
              len = 1
              x = v
              while x <= 316 && have.include?(x * x)
                x *= x
                len += 1
              end
              best = len if len >= 2 && len > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Rearrange Array to Maximize Prefix Score (LC 2587) ──────────
  (() => {
    const ref = (nums: number[]) => {
      const s = nums.slice().sort((a, b) => b - a);
      let prefix = 0;
      let score = 0;
      for (const x of s) {
        prefix += x;
        if (prefix > 0) score++;
      }
      return score;
    };
    return {
      slug: "rearrange-array-to-maximize-prefix-score",
      title: "Rearrange Array to Maximize Prefix Score",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maxScore", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You may reorder the integer array `nums` any way you like. After reordering, let `prefix[i]` be the sum of the first `i + 1` elements. The **score** of the arrangement is the number of **positive** values among `prefix[0], prefix[1], ..., prefix[n-1]`.\n\nReturn the **maximum** score you can achieve.",
        [
          { in: "nums = [2,-1,0,1,-3,-3]", out: "4", note: "Order `[2,1,0,-1,-3,-3]` gives prefix sums `2,3,3,2,-1,-4` — four positive." },
          { in: "nums = [-3,-1,-2]", out: "0" },
          { in: "nums = [0,0]", out: "0", note: "Zero is not positive." },
        ],
        ["1 <= nums.length <= 10^5", "-10^6 <= nums[i] <= 10^6"]),
      hints: [
        "To keep the running sum positive for as long as possible, which numbers should come first?",
        "Sort in descending order — the prefix sums are then as large as they can be at every length.",
        "Count prefix sums that are strictly positive (in 64-bit; they can reach `10^11`).",
      ],
      editorial: explain({
        idea: "For every length `i + 1`, the largest possible sum of `i + 1` elements is the sum of the `i + 1` largest ones. Descending order achieves that maximum for every prefix simultaneously.",
        steps: [
          "Sort `nums` in descending order.",
          "Accumulate a 64-bit running sum.",
          "Count how many running sums are strictly greater than 0 (you can stop at the first non-positive one).",
        ],
        why: "Any arrangement's prefix of length `m` sums to at most the sum of the `m` largest values, which is exactly the descending arrangement's prefix of length `m`. So if any arrangement has a positive prefix of length `m`, the descending one does too — it maximises the count for every `m` at once.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Zero prefix sums do not count; the comparison is strictly greater than 0.",
          "Once a descending prefix sum is non-positive, every later one is too (only non-positive values remain to add).",
          "Sums reach `10^11`, beyond 32-bit range.",
        ],
      }),
      examples: [
        { input: "[2,-1,0,1,-3,-3]", expectedOutput: "4" },
        { input: "[-3,-1,-2]", expectedOutput: "0" },
        { input: "[0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const span = pick(rng, [3, 50, 1000000]);
        const skew = pick(rng, [0, -Math.floor(span / 3), Math.floor(span / 4)]);
        const nums = Array.from({ length: n }, () => Math.max(-1000000, Math.min(1000000, ri(rng, -span, span) + skew)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(nums: List[int]) -> int:
              prefix = 0
              score = 0
              for x in sorted(nums, reverse=True):
                  prefix += x
                  if prefix <= 0:
                      break
                  score += 1
              return score
        `,
        javascript: code`
          var maxScore = function(nums) {
              var s = nums.slice().sort(function(a, b) { return b - a; });
              var prefix = 0, score = 0;
              for (var i = 0; i < s.length; i++) {
                  prefix += s[i];
                  if (prefix <= 0) break;
                  score++;
              }
              return score;
          };
        `,
        typescript: code`
          function maxScore(nums: number[]): number {
              var s: number[] = nums.slice();
              s.sort(function(a: number, b: number) { return b - a; });
              var prefix = 0, score = 0;
              for (var i = 0; i < s.length; i++) {
                  prefix += s[i];
                  if (prefix <= 0) break;
                  score++;
              }
              return score;
          }
        `,
        java: code`
          public static int maxScore(int[] nums) {
              int[] s = nums.clone();
              Arrays.sort(s);
              long prefix = 0;
              int score = 0;
              for (int i = s.length - 1; i >= 0; i--) {
                  prefix += s[i];
                  if (prefix <= 0) break;
                  score++;
              }
              return score;
          }
        `,
        cpp: code`
          int maxScore(vector<int>& nums) {
              vector<int> s(nums.begin(), nums.end());
              sort(s.rbegin(), s.rend());
              long long prefix = 0;
              int score = 0;
              for (int x : s) {
                  prefix += x;
                  if (prefix <= 0) break;
                  score++;
              }
              return score;
          }
        `,
        c: code`
          static int cmpScoreDesc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a < b) - (a > b);
          }

          int maxScore(int* nums, int numsSize) {
              int* s = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) s[i] = nums[i];
              qsort(s, numsSize, sizeof(int), cmpScoreDesc);
              long long prefix = 0;
              int score = 0;
              for (int i = 0; i < numsSize; i++) {
                  prefix += s[i];
                  if (prefix <= 0) break;
                  score++;
              }
              free(s);
              return score;
          }
        `,
        csharp: code`
          public static int MaxScore(int[] nums)
          {
              int[] s = (int[])nums.Clone();
              Array.Sort(s);
              long prefix = 0;
              int score = 0;
              for (int i = s.Length - 1; i >= 0; i--)
              {
                  prefix += s[i];
                  if (prefix <= 0) break;
                  score++;
              }
              return score;
          }
        `,
        go: code`
          func maxScore(nums []int) int {
          	s := make([]int, len(nums))
          	copy(s, nums)
          	sort.Ints(s)
          	var prefix int64
          	score := 0
          	for i := len(s) - 1; i >= 0; i-- {
          		prefix += int64(s[i])
          		if prefix <= 0 {
          			break
          		}
          		score++
          	}
          	return score
          }
        `,
        kotlin: code`
          fun maxScore(nums: IntArray): Int {
              val s = nums.sortedArray()
              var prefix = 0L
              var score = 0
              for (i in s.size - 1 downTo 0) {
                  prefix += s[i]
                  if (prefix <= 0) break
                  score++
              }
              return score
          }
        `,
        swift: code`
          func maxScore(_ nums: [Int]) -> Int {
              let s = nums.sorted(by: >)
              var prefix = 0
              var score = 0
              for x in s {
                  prefix += x
                  if prefix <= 0 { break }
                  score += 1
              }
              return score
          }
        `,
        rust: code`
          fn maxScore(nums: Vec<i32>) -> i32 {
              let mut s = nums.clone();
              s.sort();
              s.reverse();
              let mut prefix: i64 = 0;
              let mut score = 0;
              for &x in s.iter() {
                  prefix += x as i64;
                  if prefix <= 0 {
                      break;
                  }
                  score += 1;
              }
              score
          }
        `,
        php: code`
          function maxScore($nums) {
              $s = $nums;
              rsort($s);
              $prefix = 0;
              $score = 0;
              foreach ($s as $x) {
                  $prefix += $x;
                  if ($prefix <= 0) break;
                  $score++;
              }
              return $score;
          }
        `,
        ruby: code`
          def maxScore(nums)
            prefix = 0
            score = 0
            nums.sort.reverse.each do |x|
              prefix += x
              break if prefix <= 0
              score += 1
            end
            score
          end
        `,
      },
    };
  })(),

  // ── Count the Number of Beautiful Subarrays (LC 2588) ───────────
  (() => {
    const ref = (nums: number[]) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let x = 0;
        for (let j = i; j < nums.length; j++) {
          x ^= nums[j];
          if (x === 0) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-the-number-of-beautiful-subarrays",
      title: "Count the Number of Beautiful Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "beautifulSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An operation on an array picks two **different** indices `i` and `j` and a bit position `b` such that bit `b` is set in both `arr[i]` and `arr[j]`, then subtracts `2^b` from both of them.\n\nAn array is **beautiful** if some sequence of operations (possibly none) turns every element into `0`. Return the number of **beautiful subarrays** (contiguous, non-empty) of `nums`.\n\n*Note:* the original problem allows `10^5` elements and returns a 64-bit count; here `nums.length <= 5 * 10^4`, so the answer always fits in a 32-bit integer.",
        [
          { in: "nums = [5,1,4,7,7]", out: "3", note: "`[5,1,4]` (bit 0 from 5 and 1, then bit 2 from 4 and 4), `[7,7]`, and the whole array." },
          { in: "nums = [1,10,4]", out: "0" },
          { in: "nums = [0]", out: "1", note: "Already all zeros." },
        ],
        ["1 <= nums.length <= 5 * 10^4", "0 <= nums[i] <= 10^6"]),
      hints: [
        "Each operation clears one bit in exactly two elements. What does that say about how many elements have a given bit set?",
        "A subarray is beautiful exactly when every bit is set in an even number of its elements — i.e. its XOR is 0.",
        "Count pairs of equal prefix XORs with a hash map (including the empty prefix 0).",
      ],
      editorial: explain({
        idea: "An operation removes bit `b` from exactly two elements, so it preserves the parity of how many elements have bit `b`. Hence a subarray can be zeroed if and only if its XOR is 0, and counting zero-XOR subarrays is a prefix-XOR pair count.",
        steps: [
          "Keep `cnt`, a map from prefix XOR value to how often it has appeared, starting with `cnt[0] = 1`.",
          "Sweep the array maintaining `x` = XOR of the prefix so far.",
          "Add `cnt[x]` to the answer (each earlier equal prefix starts a zero-XOR subarray ending here), then increment `cnt[x]`.",
          "Return the total.",
        ],
        why: "Necessity: parity of each bit's count is invariant, and all-zero has even counts. Sufficiency: if every bit has an even count, pair up the elements holding each bit and clear it pairwise, bit by bit. Finally `XOR(nums[l..r]) = P[r+1] ^ P[l]`, which is 0 exactly when the two prefix XORs are equal.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Seed the map with the empty prefix (`cnt[0] = 1`), or subarrays starting at index 0 are missed.",
          "Zeros alone are beautiful (`[0]` counts).",
          "With the original limits the count needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[5,1,4,7,7]", expectedOutput: "3" },
        { input: "[1,10,4]", expectedOutput: "0" },
        { input: "[0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const mode = ri(rng, 0, 4);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, 0, 3));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 0, 15));
        else if (mode === 2) {
          const pool = Array.from({ length: 3 }, () => ri(rng, 0, 1000000));
          nums = Array.from({ length: n }, () => pick(rng, pool));
        } else if (mode === 3) nums = Array.from({ length: n }, () => ri(rng, 0, 1000000));
        else {
          // Blocks of large values closed by their XOR (all below 2^19, so the XOR stays <= 10^6).
          nums = [];
          while (nums.length < n) {
            const len = ri(rng, 1, 3);
            let x = 0;
            for (let j = 0; j < len && nums.length < n; j++) {
              const v = ri(rng, 0, 524287);
              nums.push(v);
              x ^= v;
            }
            if (nums.length < n) nums.push(x);
          }
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def beautifulSubarrays(nums: List[int]) -> int:
              cnt = {0: 1}
              x = 0
              total = 0
              for v in nums:
                  x ^= v
                  c = cnt.get(x, 0)
                  total += c
                  cnt[x] = c + 1
              return total
        `,
        javascript: code`
          var beautifulSubarrays = function(nums) {
              var cnt = new Map();
              cnt.set(0, 1);
              var x = 0, total = 0;
              for (var i = 0; i < nums.length; i++) {
                  x ^= nums[i];
                  var c = cnt.get(x) || 0;
                  total += c;
                  cnt.set(x, c + 1);
              }
              return total;
          };
        `,
        typescript: code`
          function beautifulSubarrays(nums: number[]): number {
              var cnt: { [k: string]: number } = {};
              cnt["0"] = 1;
              var x = 0, total = 0;
              for (var i = 0; i < nums.length; i++) {
                  x ^= nums[i];
                  var key = "" + x;
                  var c = cnt[key] === undefined ? 0 : cnt[key];
                  total += c;
                  cnt[key] = c + 1;
              }
              return total;
          }
        `,
        java: code`
          public static int beautifulSubarrays(int[] nums) {
              Map<Integer, Integer> cnt = new HashMap<>();
              cnt.put(0, 1);
              int x = 0;
              long total = 0;
              for (int v : nums) {
                  x ^= v;
                  int c = cnt.getOrDefault(x, 0);
                  total += c;
                  cnt.put(x, c + 1);
              }
              return (int) total;
          }
        `,
        cpp: code`
          int beautifulSubarrays(vector<int>& nums) {
              unordered_map<int, int> cnt;
              cnt[0] = 1;
              int x = 0;
              long long total = 0;
              for (int v : nums) {
                  x ^= v;
                  total += cnt[x];
                  cnt[x]++;
              }
              return (int)total;
          }
        `,
        c: code`
          /* Values are below 2^20, so every prefix XOR is too: a direct-address
             table, reset after each call by replaying the prefixes. */
          static int beautifulCnt[1 << 20];

          int beautifulSubarrays(int* nums, int numsSize) {
              long long total = 0;
              int x = 0;
              beautifulCnt[0] = 1;
              for (int i = 0; i < numsSize; i++) {
                  x ^= nums[i];
                  total += beautifulCnt[x];
                  beautifulCnt[x]++;
              }
              x = 0;
              beautifulCnt[0] = 0;
              for (int i = 0; i < numsSize; i++) {
                  x ^= nums[i];
                  beautifulCnt[x] = 0;
              }
              return (int)total;
          }
        `,
        csharp: code`
          public static int BeautifulSubarrays(int[] nums)
          {
              var cnt = new Dictionary<int, int>();
              cnt[0] = 1;
              int x = 0;
              long total = 0;
              foreach (int v in nums)
              {
                  x ^= v;
                  cnt.TryGetValue(x, out int c);
                  total += c;
                  cnt[x] = c + 1;
              }
              return (int)total;
          }
        `,
        go: code`
          func beautifulSubarrays(nums []int) int {
          	cnt := map[int]int{0: 1}
          	x, total := 0, 0
          	for _, v := range nums {
          		x ^= v
          		total += cnt[x]
          		cnt[x]++
          	}
          	return total
          }
        `,
        kotlin: code`
          fun beautifulSubarrays(nums: IntArray): Int {
              val cnt = HashMap<Int, Int>()
              cnt[0] = 1
              var x = 0
              var total = 0L
              for (v in nums) {
                  x = x xor v
                  val c = cnt[x] ?: 0
                  total += c
                  cnt[x] = c + 1
              }
              return total.toInt()
          }
        `,
        swift: code`
          func beautifulSubarrays(_ nums: [Int]) -> Int {
              var cnt = [Int: Int]()
              cnt[0] = 1
              var x = 0
              var total = 0
              for v in nums {
                  x ^= v
                  let c = cnt[x] ?? 0
                  total += c
                  cnt[x] = c + 1
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn beautifulSubarrays(nums: Vec<i32>) -> i32 {
              let mut cnt: HashMap<i32, i64> = HashMap::new();
              cnt.insert(0, 1);
              let mut x = 0;
              let mut total: i64 = 0;
              for &v in nums.iter() {
                  x ^= v;
                  let c = cnt.entry(x).or_insert(0);
                  total += *c;
                  *c += 1;
              }
              total as i32
          }
        `,
        php: code`
          function beautifulSubarrays($nums) {
              $cnt = [0 => 1];
              $x = 0;
              $total = 0;
              foreach ($nums as $v) {
                  $x ^= $v;
                  $c = isset($cnt[$x]) ? $cnt[$x] : 0;
                  $total += $c;
                  $cnt[$x] = $c + 1;
              }
              return $total;
          }
        `,
        ruby: code`
          def beautifulSubarrays(nums)
            cnt = Hash.new(0)
            cnt[0] = 1
            x = 0
            total = 0
            nums.each do |v|
              x ^= v
              total += cnt[x]
              cnt[x] += 1
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximize Greatness of an Array (LC 2592) ────────────────────
  (() => {
    // Known closed form, independent of the two-pointer greedy: n minus the largest multiplicity.
    const ref = (nums: number[]) => {
      const cnt = new Map<number, number>();
      let most = 0;
      for (const v of nums) {
        const c = (cnt.get(v) || 0) + 1;
        cnt.set(v, c);
        if (c > most) most = c;
      }
      return nums.length - most;
    };
    return {
      slug: "maximize-greatness-of-an-array",
      title: "Maximize Greatness of an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "maximizeGreatness", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You may permute the integer array `nums` into a new array `perm`. The **greatness** of `perm` is the number of indices `i` with `perm[i] > nums[i]` (comparing against the original, unpermuted `nums`).\n\nReturn the **maximum** greatness you can achieve.",
        [
          { in: "nums = [2,7,2,4,9]", out: "3", note: "`perm = [4,9,7,2,2]` beats `nums` at indices 0, 1 and 2. The two 2s can never both be beaten by smaller-or-equal values left over." },
          { in: "nums = [6,6,6]", out: "0" },
          { in: "nums = [1,2,3,4]", out: "3", note: "`perm = [2,3,4,1]`." },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^9"]),
      hints: [
        "Only the multiset of values matters: think of matching each original value with a strictly larger value from the same multiset.",
        "Sort. Try to beat the smallest values first, each with the smallest value that is strictly larger.",
        "Two pointers over the sorted array: a pointer to the next value to beat, and a scan for the next strictly larger one.",
      ],
      editorial: explain({
        idea: "This is a matching problem on the sorted values: pair as many values as possible with a strictly larger partner, each value used once as a partner. Greedily beating the smallest remaining value with the smallest sufficient partner is optimal.",
        steps: [
          "Sort `nums` ascending into `s`.",
          "Keep `beaten = 0` — the index in `s` of the smallest value not yet beaten.",
          "Scan `x` over `s`; whenever `x > s[beaten]`, use `x` to beat it and increment `beaten`.",
          "Return `beaten`.",
        ],
        why: "Exchange argument: in any optimal matching we can reassign partners so that the smallest beaten values are beaten by the smallest larger values without losing a pair, so the greedy count is optimal. Equivalently, the answer is `n` minus the largest multiplicity of a value — copies of the most frequent value can only be beaten by larger values, and at most `n - maxFreq` such partners exist.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The comparison is strict: an equal value does not count.",
          "Sorting `perm` alone and comparing position by position is not the same as matching — use the greedy scan.",
          "The answer never exceeds `n - 1`: the largest value can never be beaten.",
        ],
      }),
      examples: [
        { input: "[2,7,2,4,9]", expectedOutput: "3" },
        { input: "[6,6,6]", expectedOutput: "0" },
        { input: "[1,2,3,4]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const hi = pick(rng, [0, 2, 6, 6, 30, 30, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximizeGreatness(nums: List[int]) -> int:
              s = sorted(nums)
              beaten = 0
              for x in s:
                  if x > s[beaten]:
                      beaten += 1
              return beaten
        `,
        javascript: code`
          var maximizeGreatness = function(nums) {
              var s = nums.slice().sort(function(a, b) { return a - b; });
              var beaten = 0;
              for (var i = 0; i < s.length; i++) if (s[i] > s[beaten]) beaten++;
              return beaten;
          };
        `,
        typescript: code`
          function maximizeGreatness(nums: number[]): number {
              var s: number[] = nums.slice();
              s.sort(function(a: number, b: number) { return a - b; });
              var beaten = 0;
              for (var i = 0; i < s.length; i++) if (s[i] > s[beaten]) beaten++;
              return beaten;
          }
        `,
        java: code`
          public static int maximizeGreatness(int[] nums) {
              int[] s = nums.clone();
              Arrays.sort(s);
              int beaten = 0;
              for (int x : s) if (x > s[beaten]) beaten++;
              return beaten;
          }
        `,
        cpp: code`
          int maximizeGreatness(vector<int>& nums) {
              vector<int> s(nums.begin(), nums.end());
              sort(s.begin(), s.end());
              int beaten = 0;
              for (int x : s) if (x > s[beaten]) beaten++;
              return beaten;
          }
        `,
        c: code`
          static int cmpGreatAsc(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int maximizeGreatness(int* nums, int numsSize) {
              int* s = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) s[i] = nums[i];
              qsort(s, numsSize, sizeof(int), cmpGreatAsc);
              int beaten = 0;
              for (int i = 0; i < numsSize; i++) if (s[i] > s[beaten]) beaten++;
              free(s);
              return beaten;
          }
        `,
        csharp: code`
          public static int MaximizeGreatness(int[] nums)
          {
              int[] s = (int[])nums.Clone();
              Array.Sort(s);
              int beaten = 0;
              foreach (int x in s) if (x > s[beaten]) beaten++;
              return beaten;
          }
        `,
        go: code`
          func maximizeGreatness(nums []int) int {
          	s := make([]int, len(nums))
          	copy(s, nums)
          	sort.Ints(s)
          	beaten := 0
          	for _, x := range s {
          		if x > s[beaten] {
          			beaten++
          		}
          	}
          	return beaten
          }
        `,
        kotlin: code`
          fun maximizeGreatness(nums: IntArray): Int {
              val s = nums.sortedArray()
              var beaten = 0
              for (x in s) if (x > s[beaten]) beaten++
              return beaten
          }
        `,
        swift: code`
          func maximizeGreatness(_ nums: [Int]) -> Int {
              let s = nums.sorted()
              var beaten = 0
              for x in s where x > s[beaten] { beaten += 1 }
              return beaten
          }
        `,
        rust: code`
          fn maximizeGreatness(nums: Vec<i32>) -> i32 {
              let mut s = nums.clone();
              s.sort();
              let mut beaten = 0usize;
              for i in 0..s.len() {
                  if s[i] > s[beaten] {
                      beaten += 1;
                  }
              }
              beaten as i32
          }
        `,
        php: code`
          function maximizeGreatness($nums) {
              $s = $nums;
              sort($s);
              $beaten = 0;
              foreach ($s as $x) if ($x > $s[$beaten]) $beaten++;
              return $beaten;
          }
        `,
        ruby: code`
          def maximizeGreatness(nums)
            s = nums.sort
            beaten = 0
            s.each { |x| beaten += 1 if x > s[beaten] }
            beaten
          end
        `,
      },
    };
  })(),

  // ── Find Score of an Array After Marking All Elements (LC 2593) ─
  (() => {
    // Literal simulation: repeatedly scan for the smallest unmarked element.
    const ref = (nums: number[]) => {
      const n = nums.length;
      const marked = new Array(n).fill(false);
      let score = 0;
      for (;;) {
        let at = -1;
        for (let i = 0; i < n; i++) if (!marked[i] && (at < 0 || nums[i] < nums[at])) at = i;
        if (at < 0) return score;
        score += nums[at];
        marked[at] = true;
        if (at > 0) marked[at - 1] = true;
        if (at + 1 < n) marked[at + 1] = true;
      }
    };
    return {
      slug: "find-score-of-an-array-after-marking-all-elements",
      title: "Find Score of an Array After Marking All Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: { funcName: "findScore", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Start with `score = 0` and every element of the positive integer array `nums` unmarked. Repeat until every element is marked:\n\n1. Choose the **smallest unmarked** element; if several are equal, choose the one with the **smallest index**.\n2. Add its value to `score`.\n3. Mark it and its two adjacent elements (those that exist).\n\nReturn the final `score`.\n\n*Note:* the original problem allows values up to `10^6` and returns a 64-bit score; here `nums[i] <= 10^4`, so the answer always fits in a 32-bit integer.",
        [
          { in: "nums = [3,1,4,1,5,2]", out: "4", note: "Take the 1 at index 1 (marks indices 0–2), then the 1 at index 3 (marks 2–4), then the 2 at index 5. Score 1 + 1 + 2 = 4." },
          { in: "nums = [7]", out: "7" },
          { in: "nums = [2,2,2,2]", out: "4", note: "Index 0 is chosen first (ties go to the smaller index), marking 0 and 1; then index 2." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"]),
      hints: [
        "The order in which elements are considered is fixed: by value, then by index.",
        "Marking only ever removes candidates; it never changes the order of the rest.",
        "Sort the indices by `(value, index)` and walk them, skipping any index that is already marked.",
      ],
      editorial: explain({
        idea: "The process always picks the first unmarked index in `(value, index)` order. Sorting the indices by that key once and skipping marked ones reproduces the process exactly.",
        steps: [
          "Create the list of indices sorted by `nums[i]`, ties by `i`.",
          "Keep a boolean `marked` array.",
          "Walk the sorted indices; skip a marked one. Otherwise add `nums[i]` to the score and mark `i - 1`, `i` and `i + 1`.",
          "Return the score.",
        ],
        why: "At each step the process selects the unmarked index that is smallest in `(value, index)` order. Walking the sorted list and skipping marked entries reaches exactly that index next, because every earlier entry in the list is already marked. Marks only accumulate, so a skipped index never becomes eligible again.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Ties must go to the smaller index — sort with the index as the second key (or use a stable sort).",
          "Marking a neighbour does not add it to the score.",
          "With the original limits the score needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5,2]", expectedOutput: "4" },
        { input: "[7]", expectedOutput: "7" },
        { input: "[2,2,2,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 4, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const hi = pick(rng, [1, 3, 10, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findScore(nums: List[int]) -> int:
              n = len(nums)
              order = sorted(range(n), key=lambda i: (nums[i], i))
              marked = [False] * n
              score = 0
              for i in order:
                  if marked[i]:
                      continue
                  score += nums[i]
                  marked[i] = True
                  if i > 0:
                      marked[i - 1] = True
                  if i + 1 < n:
                      marked[i + 1] = True
              return score
        `,
        javascript: code`
          var findScore = function(nums) {
              var n = nums.length;
              var order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return nums[a] !== nums[b] ? nums[a] - nums[b] : a - b; });
              var marked = new Array(n).fill(false);
              var score = 0;
              for (var k = 0; k < n; k++) {
                  var at = order[k];
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = true;
                  if (at > 0) marked[at - 1] = true;
                  if (at + 1 < n) marked[at + 1] = true;
              }
              return score;
          };
        `,
        typescript: code`
          function findScore(nums: number[]): number {
              var n = nums.length;
              var order: number[] = [];
              var marked: boolean[] = [];
              for (var i = 0; i < n; i++) { order.push(i); marked.push(false); }
              order.sort(function(a: number, b: number) { return nums[a] !== nums[b] ? nums[a] - nums[b] : a - b; });
              var score = 0;
              for (var k = 0; k < n; k++) {
                  var at = order[k];
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = true;
                  if (at > 0) marked[at - 1] = true;
                  if (at + 1 < n) marked[at + 1] = true;
              }
              return score;
          }
        `,
        java: code`
          public static int findScore(int[] nums) {
              int n = nums.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> nums[a] != nums[b] ? Integer.compare(nums[a], nums[b]) : Integer.compare(a, b));
              boolean[] marked = new boolean[n];
              long score = 0;
              for (int at : order) {
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = true;
                  if (at > 0) marked[at - 1] = true;
                  if (at + 1 < n) marked[at + 1] = true;
              }
              return (int) score;
          }
        `,
        cpp: code`
          int findScore(vector<int>& nums) {
              int n = nums.size();
              vector<int> order(n);
              for (int i = 0; i < n; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) {
                  return nums[a] != nums[b] ? nums[a] < nums[b] : a < b;
              });
              vector<bool> marked(n, false);
              long long score = 0;
              for (int at : order) {
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = true;
                  if (at > 0) marked[at - 1] = true;
                  if (at + 1 < n) marked[at + 1] = true;
              }
              return (int)score;
          }
        `,
        c: code`
          static int cmpScoreKey(const void* p, const void* q) {
              long long a = *(const long long*)p, b = *(const long long*)q;
              return (a > b) - (a < b);
          }

          int findScore(int* nums, int numsSize) {
              int n = numsSize;
              /* key = value * 2^17 + index sorts by value, then by index (n <= 10^5 < 2^17). */
              long long* keys = (long long*)malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) keys[i] = (long long)nums[i] * 131072 + i;
              qsort(keys, n, sizeof(long long), cmpScoreKey);
              char* marked = (char*)calloc(n + 1, 1);
              long long score = 0;
              for (int k = 0; k < n; k++) {
                  int at = (int)(keys[k] % 131072);
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = 1;
                  if (at > 0) marked[at - 1] = 1;
                  if (at + 1 < n) marked[at + 1] = 1;
              }
              free(keys);
              free(marked);
              return (int)score;
          }
        `,
        csharp: code`
          public static int FindScore(int[] nums)
          {
              int n = nums.Length;
              int[] order = Enumerable.Range(0, n).OrderBy(i => nums[i]).ThenBy(i => i).ToArray();
              bool[] marked = new bool[n];
              long score = 0;
              foreach (int at in order)
              {
                  if (marked[at]) continue;
                  score += nums[at];
                  marked[at] = true;
                  if (at > 0) marked[at - 1] = true;
                  if (at + 1 < n) marked[at + 1] = true;
              }
              return (int)score;
          }
        `,
        go: code`
          func findScore(nums []int) int {
          	n := len(nums)
          	order := make([]int, n)
          	for i := range order {
          		order[i] = i
          	}
          	sort.Slice(order, func(x, y int) bool {
          		a, b := order[x], order[y]
          		if nums[a] != nums[b] {
          			return nums[a] < nums[b]
          		}
          		return a < b
          	})
          	marked := make([]bool, n)
          	score := 0
          	for _, at := range order {
          		if marked[at] {
          			continue
          		}
          		score += nums[at]
          		marked[at] = true
          		if at > 0 {
          			marked[at-1] = true
          		}
          		if at+1 < n {
          			marked[at+1] = true
          		}
          	}
          	return score
          }
        `,
        kotlin: code`
          fun findScore(nums: IntArray): Int {
              val n = nums.size
              val order = (0 until n).sortedBy { nums[it].toLong() * 131072L + it }
              val marked = BooleanArray(n)
              var score = 0L
              for (at in order) {
                  if (marked[at]) continue
                  score += nums[at]
                  marked[at] = true
                  if (at > 0) marked[at - 1] = true
                  if (at + 1 < n) marked[at + 1] = true
              }
              return score.toInt()
          }
        `,
        swift: code`
          func findScore(_ nums: [Int]) -> Int {
              let n = nums.count
              let order = (0..<n).sorted { nums[$0] != nums[$1] ? nums[$0] < nums[$1] : $0 < $1 }
              var marked = [Bool](repeating: false, count: n)
              var score = 0
              for at in order {
                  if marked[at] { continue }
                  score += nums[at]
                  marked[at] = true
                  if at > 0 { marked[at - 1] = true }
                  if at + 1 < n { marked[at + 1] = true }
              }
              return score
          }
        `,
        rust: code`
          fn findScore(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&i| (nums[i], i));
              let mut marked = vec![false; n];
              let mut score: i64 = 0;
              for &at in order.iter() {
                  if marked[at] {
                      continue;
                  }
                  score += nums[at] as i64;
                  marked[at] = true;
                  if at > 0 {
                      marked[at - 1] = true;
                  }
                  if at + 1 < n {
                      marked[at + 1] = true;
                  }
              }
              score as i32
          }
        `,
        php: code`
          function findScore($nums) {
              $n = count($nums);
              $order = range(0, $n - 1);
              usort($order, function($a, $b) use ($nums) {
                  if ($nums[$a] != $nums[$b]) return $nums[$a] <=> $nums[$b];
                  return $a <=> $b;
              });
              $marked = array_fill(0, $n, false);
              $score = 0;
              foreach ($order as $at) {
                  if ($marked[$at]) continue;
                  $score += $nums[$at];
                  $marked[$at] = true;
                  if ($at > 0) $marked[$at - 1] = true;
                  if ($at + 1 < $n) $marked[$at + 1] = true;
              }
              return $score;
          }
        `,
        ruby: code`
          def findScore(nums)
            n = nums.length
            order = (0...n).sort_by { |i| [nums[i], i] }
            marked = Array.new(n, false)
            score = 0
            order.each do |at|
              next if marked[at]
              score += nums[at]
              marked[at] = true
              marked[at - 1] = true if at > 0
              marked[at + 1] = true if at + 1 < n
            end
            score
          end
        `,
      },
    };
  })(),

  // ── Find the Prefix Common Array of Two Arrays (LC 2657) ────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < a.length; i++) {
        const sa = new Set(a.slice(0, i + 1));
        out.push(b.slice(0, i + 1).filter((x) => sa.has(x)).length);
      }
      return out;
    };
    return {
      slug: "find-the-prefix-common-array-of-two-arrays",
      title: "Find the Prefix Common Array of Two Arrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Amazon", "Google"],
      signature: {
        funcName: "findThePrefixCommonArray",
        params: [{ name: "a", type: "int[]" as const }, { name: "b", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "`a` and `b` are both **permutations** of the integers `1` to `n`. Their **prefix common array** is the array `c` of length `n` where `c[i]` is the number of values that appear in **both** `a[0..i]` and `b[0..i]`.\n\nReturn `c`.",
        [
          { in: "a = [2,4,1,3], b = [4,1,2,3]", out: "[0,1,3,4]", note: "After index 1 only `4` is shared; after index 2 the prefixes hold `{1,2,4}` each." },
          { in: "a = [3,1,2], b = [3,2,1]", out: "[1,1,3]" },
        ],
        ["1 <= a.length == b.length == n <= 50", "1 <= a[i], b[i] <= n", "a and b are permutations of 1..n"]),
      hints: [
        "Recomputing the intersection for every prefix is O(n²) — fine for these limits, but there is a one-pass way.",
        "Each value appears once in each array, so it becomes common exactly when its second occurrence (in either array) has been seen.",
        "Keep a count per value; when a count reaches 2, the number of common values grows by one.",
      ],
      editorial: explain({
        idea: "A value joins the common set at the moment both arrays have shown it — that is, the second time it is seen across the two prefixes. Counting sightings per value turns the prefix intersection into a running counter.",
        steps: [
          "Keep `seen[v]` for `v = 1..n`, all 0, and `common = 0`.",
          "For each `i`: increment `seen[a[i]]`; if it became 2, increment `common`.",
          "Do the same for `b[i]`.",
          "Set `c[i] = common`.",
        ],
        why: "Within one permutation a value occurs once, so `seen[v] = 2` means `v` is in both prefixes, and that transition happens exactly once per value, at the first index where both prefixes contain it. Hence `common` always equals the size of the intersection.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Process both `a[i]` and `b[i]` before recording `c[i]` — when `a[i] == b[i]` the value counts at index `i`.",
          "The answer is non-decreasing and ends at `n`; a quick sanity check.",
          "A bitmask (`n <= 50` fits in 64 bits) also works, but the counting array is simpler.",
        ],
      }),
      examples: [
        { input: "[2,4,1,3]\n[4,1,2,3]", expectedOutput: "[0,1,3,4]" },
        { input: "[3,1,2]\n[3,2,1]", expectedOutput: "[1,1,3]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 50), 50]);
        const a = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const mode = ri(rng, 0, 5);
        let b: number[];
        if (mode === 0) b = a.slice();
        else if (mode === 1) b = a.slice().reverse();
        else if (mode === 2) {
          b = a.slice();
          for (let t = 0; t < 2; t++) {
            const i = ri(rng, 0, n - 1);
            const j = ri(rng, 0, n - 1);
            const tmp = b[i];
            b[i] = b[j];
            b[j] = tmp;
          }
        } else b = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findThePrefixCommonArray(a: List[int], b: List[int]) -> List[int]:
              n = len(a)
              seen = [0] * (n + 1)
              common = 0
              res = []
              for i in range(n):
                  seen[a[i]] += 1
                  if seen[a[i]] == 2:
                      common += 1
                  seen[b[i]] += 1
                  if seen[b[i]] == 2:
                      common += 1
                  res.append(common)
              return res
        `,
        javascript: code`
          var findThePrefixCommonArray = function(a, b) {
              var n = a.length;
              var seen = new Array(n + 1).fill(0);
              var common = 0, res = [];
              for (var i = 0; i < n; i++) {
                  if (++seen[a[i]] === 2) common++;
                  if (++seen[b[i]] === 2) common++;
                  res.push(common);
              }
              return res;
          };
        `,
        typescript: code`
          function findThePrefixCommonArray(a: number[], b: number[]): number[] {
              var n = a.length;
              var seen: number[] = [];
              for (var t = 0; t <= n; t++) seen.push(0);
              var common = 0;
              var res: number[] = [];
              for (var i = 0; i < n; i++) {
                  if (++seen[a[i]] === 2) common++;
                  if (++seen[b[i]] === 2) common++;
                  res.push(common);
              }
              return res;
          }
        `,
        java: code`
          public static int[] findThePrefixCommonArray(int[] a, int[] b) {
              int n = a.length;
              int[] seen = new int[n + 1];
              int[] res = new int[n];
              int common = 0;
              for (int i = 0; i < n; i++) {
                  if (++seen[a[i]] == 2) common++;
                  if (++seen[b[i]] == 2) common++;
                  res[i] = common;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> findThePrefixCommonArray(vector<int>& a, vector<int>& b) {
              int n = a.size();
              vector<int> seen(n + 1, 0), res(n);
              int common = 0;
              for (int i = 0; i < n; i++) {
                  if (++seen[a[i]] == 2) common++;
                  if (++seen[b[i]] == 2) common++;
                  res[i] = common;
              }
              return res;
          }
        `,
        c: code`
          int* findThePrefixCommonArray(int* a, int aSize, int* b, int bSize, int* returnSize) {
              int n = aSize;
              int* seen = (int*)calloc(n + 1, sizeof(int));
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              int common = 0;
              for (int i = 0; i < n; i++) {
                  if (++seen[a[i]] == 2) common++;
                  if (++seen[b[i]] == 2) common++;
                  res[i] = common;
              }
              free(seen);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          public static int[] FindThePrefixCommonArray(int[] a, int[] b)
          {
              int n = a.Length;
              int[] seen = new int[n + 1];
              int[] res = new int[n];
              int common = 0;
              for (int i = 0; i < n; i++)
              {
                  if (++seen[a[i]] == 2) common++;
                  if (++seen[b[i]] == 2) common++;
                  res[i] = common;
              }
              return res;
          }
        `,
        go: code`
          func findThePrefixCommonArray(a []int, b []int) []int {
          	n := len(a)
          	seen := make([]int, n+1)
          	res := make([]int, n)
          	common := 0
          	for i := 0; i < n; i++ {
          		seen[a[i]]++
          		if seen[a[i]] == 2 {
          			common++
          		}
          		seen[b[i]]++
          		if seen[b[i]] == 2 {
          			common++
          		}
          		res[i] = common
          	}
          	return res
          }
        `,
        kotlin: code`
          fun findThePrefixCommonArray(a: IntArray, b: IntArray): IntArray {
              val n = a.size
              val seen = IntArray(n + 1)
              val res = IntArray(n)
              var common = 0
              for (i in 0 until n) {
                  seen[a[i]]++
                  if (seen[a[i]] == 2) common++
                  seen[b[i]]++
                  if (seen[b[i]] == 2) common++
                  res[i] = common
              }
              return res
          }
        `,
        swift: code`
          func findThePrefixCommonArray(_ a: [Int], _ b: [Int]) -> [Int] {
              let n = a.count
              var seen = [Int](repeating: 0, count: n + 1)
              var res = [Int](repeating: 0, count: n)
              var common = 0
              for i in 0..<n {
                  seen[a[i]] += 1
                  if seen[a[i]] == 2 { common += 1 }
                  seen[b[i]] += 1
                  if seen[b[i]] == 2 { common += 1 }
                  res[i] = common
              }
              return res
          }
        `,
        rust: code`
          fn findThePrefixCommonArray(a: Vec<i32>, b: Vec<i32>) -> Vec<i32> {
              let n = a.len();
              let mut seen = vec![0; n + 1];
              let mut res = vec![0i32; n];
              let mut common = 0;
              for i in 0..n {
                  seen[a[i] as usize] += 1;
                  if seen[a[i] as usize] == 2 {
                      common += 1;
                  }
                  seen[b[i] as usize] += 1;
                  if seen[b[i] as usize] == 2 {
                      common += 1;
                  }
                  res[i] = common;
              }
              res
          }
        `,
        php: code`
          function findThePrefixCommonArray($a, $b) {
              $n = count($a);
              $seen = array_fill(0, $n + 1, 0);
              $res = [];
              $common = 0;
              for ($i = 0; $i < $n; $i++) {
                  $seen[$a[$i]]++;
                  if ($seen[$a[$i]] == 2) $common++;
                  $seen[$b[$i]]++;
                  if ($seen[$b[$i]] == 2) $common++;
                  $res[] = $common;
              }
              return $res;
          }
        `,
        ruby: code`
          def findThePrefixCommonArray(a, b)
            n = a.length
            seen = Array.new(n + 1, 0)
            common = 0
            res = []
            (0...n).each do |i|
              seen[a[i]] += 1
              common += 1 if seen[a[i]] == 2
              seen[b[i]] += 1
              common += 1 if seen[b[i]] == 2
              res << common
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Sum of Distances (LC 2615) ──────────────────────────────────
  (() => {
    const ref = (nums: number[]) =>
      nums.map((v, i) => {
        let s = 0;
        for (let j = 0; j < nums.length; j++) if (nums[j] === v) s += Math.abs(i - j);
        return s;
      });
    return {
      slug: "sum-of-distances",
      title: "Sum of Distances",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "distance", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For each index `i` of the 0-indexed integer array `nums`, let `arr[i]` be the sum of `|i - j|` over every **other** index `j` with `nums[j] == nums[i]`. If `nums[i]` occurs nowhere else, `arr[i] = 0`.\n\nReturn `arr`.\n\n*Note:* the original problem allows `10^5` elements and returns 64-bit sums; here `nums.length <= 5 * 10^4`, so every answer fits in a 32-bit integer.",
        [
          { in: "nums = [2,5,2,2,5]", out: "[5,3,3,4,3]", note: "The value 2 sits at indices 0, 2 and 3: index 0 gets 2 + 3 = 5, index 2 gets 2 + 1 = 3, index 3 gets 3 + 1 = 4. The value 5 sits at 1 and 4, three apart." },
          { in: "nums = [7,8,9]", out: "[0,0,0]" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "0 <= nums[i] <= 10^9"]),
      hints: [
        "Only indices holding the same value interact, so handle each value's list of positions separately.",
        "For a position `p` with `c` equal values to its left whose indices sum to `s`, their contribution is `c * p - s`.",
        "Sweep left to right accumulating (count, sum) per value, then right to left for the other side.",
      ],
      editorial: explain({
        idea: "The distances to equal values on the left of `i` add up to `count_left * i - sum_left`, and those on the right to `sum_right - count_right * i`. Two sweeps with per-value running counts and index sums give both in O(1) per index.",
        steps: [
          "Left-to-right: for each `i` with value `v`, add `cnt[v] * i - sum[v]` to `arr[i]`, then increment `cnt[v]` and add `i` to `sum[v]`.",
          "Reset the maps.",
          "Right-to-left: for each `i`, add `sum[v] - cnt[v] * i` to `arr[i]`, then update `cnt[v]` and `sum[v]`.",
          "Return `arr`.",
        ],
        why: "Every equal index to the left of `i` is smaller than `i`, so `Σ (i - j) = c·i - Σ j` over exactly those `c` indices, which the left sweep has accumulated when it reaches `i`. The right sweep is the mirror image. Together they cover every other index holding the same value once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Intermediate products like `cnt * i` can exceed 32 bits even when the final answer fits — use 64-bit arithmetic.",
          "The value itself never enters the sum, only indices.",
          "A value that occurs once gives 0.",
        ],
      }),
      examples: [
        { input: "[2,5,2,2,5]", expectedOutput: "[5,3,3,4,3]" },
        { input: "[7,8,9]", expectedOutput: "[0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 10, 40)]);
        const big = rng() < 0.3;
        const pool = Array.from({ length: pick(rng, [1, 2, 4, 10, 40]) }, () => (big ? ri(rng, 0, 1000000000) : ri(rng, 0, 20)));
        const nums = Array.from({ length: n }, () => pick(rng, pool));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def distance(nums: List[int]) -> List[int]:
              n = len(nums)
              res = [0] * n
              cnt, tot = {}, {}
              for i in range(n):
                  v = nums[i]
                  c, s = cnt.get(v, 0), tot.get(v, 0)
                  res[i] += c * i - s
                  cnt[v], tot[v] = c + 1, s + i
              cnt, tot = {}, {}
              for i in range(n - 1, -1, -1):
                  v = nums[i]
                  c, s = cnt.get(v, 0), tot.get(v, 0)
                  res[i] += s - c * i
                  cnt[v], tot[v] = c + 1, s + i
              return res
        `,
        javascript: code`
          var distance = function(nums) {
              var n = nums.length;
              var res = new Array(n).fill(0);
              var cnt = new Map(), tot = new Map();
              for (var i = 0; i < n; i++) {
                  var v = nums[i];
                  var c = cnt.get(v) || 0, s = tot.get(v) || 0;
                  res[i] += c * i - s;
                  cnt.set(v, c + 1);
                  tot.set(v, s + i);
              }
              cnt = new Map();
              tot = new Map();
              for (var j = n - 1; j >= 0; j--) {
                  var w = nums[j];
                  var c2 = cnt.get(w) || 0, s2 = tot.get(w) || 0;
                  res[j] += s2 - c2 * j;
                  cnt.set(w, c2 + 1);
                  tot.set(w, s2 + j);
              }
              return res;
          };
        `,
        typescript: code`
          function distance(nums: number[]): number[] {
              var n = nums.length;
              var res: number[] = [];
              for (var t = 0; t < n; t++) res.push(0);
              var cnt: { [k: string]: number } = {}, tot: { [k: string]: number } = {};
              for (var i = 0; i < n; i++) {
                  var v = "" + nums[i];
                  var c = cnt[v] === undefined ? 0 : cnt[v], s = tot[v] === undefined ? 0 : tot[v];
                  res[i] += c * i - s;
                  cnt[v] = c + 1;
                  tot[v] = s + i;
              }
              cnt = {};
              tot = {};
              for (var j = n - 1; j >= 0; j--) {
                  var w = "" + nums[j];
                  var c2 = cnt[w] === undefined ? 0 : cnt[w], s2 = tot[w] === undefined ? 0 : tot[w];
                  res[j] += s2 - c2 * j;
                  cnt[w] = c2 + 1;
                  tot[w] = s2 + j;
              }
              return res;
          }
        `,
        java: code`
          public static int[] distance(int[] nums) {
              int n = nums.length;
              long[] res = new long[n];
              Map<Integer, long[]> left = new HashMap<>();
              for (int i = 0; i < n; i++) {
                  long[] cs = left.computeIfAbsent(nums[i], key -> new long[2]);
                  res[i] += cs[0] * i - cs[1];
                  cs[0]++;
                  cs[1] += i;
              }
              Map<Integer, long[]> right = new HashMap<>();
              for (int i = n - 1; i >= 0; i--) {
                  long[] cs = right.computeIfAbsent(nums[i], key -> new long[2]);
                  res[i] += cs[1] - cs[0] * i;
                  cs[0]++;
                  cs[1] += i;
              }
              int[] out = new int[n];
              for (int i = 0; i < n; i++) out[i] = (int) res[i];
              return out;
          }
        `,
        cpp: code`
          vector<int> distance(vector<int>& nums) {
              int n = nums.size();
              vector<long long> res(n, 0);
              unordered_map<int, pair<long long, long long>> left, right;
              for (int i = 0; i < n; i++) {
                  auto& cs = left[nums[i]];
                  res[i] += cs.first * i - cs.second;
                  cs.first++;
                  cs.second += i;
              }
              for (int i = n - 1; i >= 0; i--) {
                  auto& cs = right[nums[i]];
                  res[i] += cs.second - cs.first * i;
                  cs.first++;
                  cs.second += i;
              }
              vector<int> out(n);
              for (int i = 0; i < n; i++) out[i] = (int)res[i];
              return out;
          }
        `,
        c: code`
          static int cmpDistKey(const void* p, const void* q) {
              long long a = *(const long long*)p, b = *(const long long*)q;
              return (a > b) - (a < b);
          }

          int* distance(int* nums, int numsSize, int* returnSize) {
              int n = numsSize;
              /* key = value * 2^16 + index groups equal values with their indices ascending. */
              long long* keys = (long long*)malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) keys[i] = (long long)nums[i] * 65536 + i;
              qsort(keys, n, sizeof(long long), cmpDistKey);
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              int g = 0;
              while (g < n) {
                  int h = g;
                  long long total = 0;
                  while (h < n && keys[h] / 65536 == keys[g] / 65536) {
                      total += keys[h] % 65536;
                      h++;
                  }
                  long long before = 0;
                  for (int k = g; k < h; k++) {
                      long long p = keys[k] % 65536;
                      long long cl = k - g, cr = h - 1 - k;
                      long long after = total - before - p;
                      res[p] = (int)(cl * p - before + after - cr * p);
                      before += p;
                  }
                  g = h;
              }
              free(keys);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          public static int[] Distance(int[] nums)
          {
              int n = nums.Length;
              long[] res = new long[n];
              var cnt = new Dictionary<int, long>();
              var tot = new Dictionary<int, long>();
              for (int i = 0; i < n; i++)
              {
                  cnt.TryGetValue(nums[i], out long c);
                  tot.TryGetValue(nums[i], out long s);
                  res[i] += c * i - s;
                  cnt[nums[i]] = c + 1;
                  tot[nums[i]] = s + i;
              }
              cnt.Clear();
              tot.Clear();
              for (int i = n - 1; i >= 0; i--)
              {
                  cnt.TryGetValue(nums[i], out long c);
                  tot.TryGetValue(nums[i], out long s);
                  res[i] += s - c * i;
                  cnt[nums[i]] = c + 1;
                  tot[nums[i]] = s + i;
              }
              int[] outArr = new int[n];
              for (int i = 0; i < n; i++) outArr[i] = (int)res[i];
              return outArr;
          }
        `,
        go: code`
          func distance(nums []int) []int {
          	n := len(nums)
          	res := make([]int, n)
          	cnt, tot := map[int]int{}, map[int]int{}
          	for i, v := range nums {
          		res[i] += cnt[v]*i - tot[v]
          		cnt[v]++
          		tot[v] += i
          	}
          	cnt, tot = map[int]int{}, map[int]int{}
          	for i := n - 1; i >= 0; i-- {
          		v := nums[i]
          		res[i] += tot[v] - cnt[v]*i
          		cnt[v]++
          		tot[v] += i
          	}
          	return res
          }
        `,
        kotlin: code`
          fun distance(nums: IntArray): IntArray {
              val n = nums.size
              val res = LongArray(n)
              var cnt = HashMap<Int, Long>()
              var tot = HashMap<Int, Long>()
              for (i in 0 until n) {
                  val v = nums[i]
                  val c = cnt[v] ?: 0L
                  val s = tot[v] ?: 0L
                  res[i] += c * i - s
                  cnt[v] = c + 1
                  tot[v] = s + i
              }
              cnt = HashMap()
              tot = HashMap()
              for (i in n - 1 downTo 0) {
                  val v = nums[i]
                  val c = cnt[v] ?: 0L
                  val s = tot[v] ?: 0L
                  res[i] += s - c * i
                  cnt[v] = c + 1
                  tot[v] = s + i
              }
              return IntArray(n) { res[it].toInt() }
          }
        `,
        swift: code`
          func distance(_ nums: [Int]) -> [Int] {
              let n = nums.count
              var res = [Int](repeating: 0, count: n)
              var cnt = [Int: Int]()
              var tot = [Int: Int]()
              for i in 0..<n {
                  let v = nums[i]
                  let c = cnt[v] ?? 0
                  let s = tot[v] ?? 0
                  res[i] += c * i - s
                  cnt[v] = c + 1
                  tot[v] = s + i
              }
              cnt = [Int: Int]()
              tot = [Int: Int]()
              for i in stride(from: n - 1, through: 0, by: -1) {
                  let v = nums[i]
                  let c = cnt[v] ?? 0
                  let s = tot[v] ?? 0
                  res[i] += s - c * i
                  cnt[v] = c + 1
                  tot[v] = s + i
              }
              return res
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn distance(nums: Vec<i32>) -> Vec<i32> {
              let n = nums.len();
              let mut res = vec![0i64; n];
              let mut left: HashMap<i32, (i64, i64)> = HashMap::new();
              for i in 0..n {
                  let cs = left.entry(nums[i]).or_insert((0, 0));
                  res[i] += cs.0 * i as i64 - cs.1;
                  cs.0 += 1;
                  cs.1 += i as i64;
              }
              let mut right: HashMap<i32, (i64, i64)> = HashMap::new();
              for i in (0..n).rev() {
                  let cs = right.entry(nums[i]).or_insert((0, 0));
                  res[i] += cs.1 - cs.0 * i as i64;
                  cs.0 += 1;
                  cs.1 += i as i64;
              }
              res.iter().map(|&x| x as i32).collect()
          }
        `,
        php: code`
          function distance($nums) {
              $n = count($nums);
              $res = array_fill(0, $n, 0);
              $cnt = [];
              $tot = [];
              for ($i = 0; $i < $n; $i++) {
                  $v = $nums[$i];
                  $c = isset($cnt[$v]) ? $cnt[$v] : 0;
                  $s = isset($tot[$v]) ? $tot[$v] : 0;
                  $res[$i] += $c * $i - $s;
                  $cnt[$v] = $c + 1;
                  $tot[$v] = $s + $i;
              }
              $cnt = [];
              $tot = [];
              for ($i = $n - 1; $i >= 0; $i--) {
                  $v = $nums[$i];
                  $c = isset($cnt[$v]) ? $cnt[$v] : 0;
                  $s = isset($tot[$v]) ? $tot[$v] : 0;
                  $res[$i] += $s - $c * $i;
                  $cnt[$v] = $c + 1;
                  $tot[$v] = $s + $i;
              }
              return $res;
          }
        `,
        ruby: code`
          def distance(nums)
            n = nums.length
            res = Array.new(n, 0)
            cnt = Hash.new(0)
            tot = Hash.new(0)
            (0...n).each do |i|
              v = nums[i]
              res[i] += cnt[v] * i - tot[v]
              cnt[v] += 1
              tot[v] += i
            end
            cnt = Hash.new(0)
            tot = Hash.new(0)
            (n - 1).downto(0) do |i|
              v = nums[i]
              res[i] += tot[v] - cnt[v] * i
              cnt[v] += 1
              tot[v] += i
            end
            res
          end
        `,
      },
    };
  })(),

];
