/**
 * Arrays & prefix sums II — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Where LeetCode returns a 64-bit value (Minimum Elements to Add, Maximum
 * Alternating Subsequence Sum, Grid Game) the constraints are tightened so the
 * true answer fits in int32; the solutions still accumulate in 64 bits.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const ARRAYS7_PROBLEMS: CatalogProblem[] = [

  // ── Array Nesting (LC 565) ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let k = 0; k < nums.length; k++) {
        const seen = new Set<number>();
        let x = nums[k];
        while (!seen.has(x)) { seen.add(x); x = nums[x]; }
        best = Math.max(best, seen.size);
      }
      return best;
    };
    return {
      slug: "array-nesting",
      title: "Array Nesting",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Amazon", "Apple"],
      signature: { funcName: "arrayNesting", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` has length `n` and is a permutation of the integers `0` to `n - 1`, so every value is also a valid index.\n\nFor a starting index `k`, build the set `s[k]` by following the array as a chain of pointers: take `nums[k]`, then `nums[nums[k]]`, then `nums[nums[nums[k]]]`, and so on. Stop just before you would add a value that is already in the set.\n\nReturn the size of the largest set `s[k]` over all starting indices `k`.",
        [
          { in: "nums = [2,0,1,4,3]", out: "3", note: "From `k = 0`: `nums[0] = 2`, `nums[2] = 1`, `nums[1] = 0`, then `nums[0] = 2` again — the set is `{2, 1, 0}`. Indices 3 and 4 only reach each other." },
          { in: "nums = [0,1,2]", out: "1", note: "Every value points to itself." },
          { in: "nums = [1,2,3,4,0]", out: "5" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] < nums.length", "All the values of `nums` are distinct."]),
      hints: [
        "Draw an arrow from each index `i` to `nums[i]`. Because `nums` is a permutation, what shape do the arrows form?",
        "Every index lies on exactly one cycle, and `s[k]` is precisely the cycle that contains `k`.",
        "Walk each cycle once, marking indices as visited, and keep the longest cycle length.",
      ],
      editorial: explain({
        idea: "A permutation splits into disjoint cycles, and the set built from any index is exactly the cycle through that index — so the answer is the length of the longest cycle.",
        steps: [
          "Keep a visited flag per index.",
          "For each unvisited index, follow `j = nums[j]` until you reach a visited index, marking and counting as you go.",
          "The count is that cycle's length; keep the maximum.",
        ],
        why: "Every value has exactly one predecessor and one successor in a permutation, so following the pointers from `k` must return to `k` itself — never to some earlier element of a tail. All indices on that cycle produce the same set, so measuring each cycle once and never revisiting it is enough.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Restarting the walk from every index without the shared visited array is O(n^2).",
          "The visited array is global across starts: an index on an already-measured cycle cannot belong to a longer one.",
          "A fixed point (`nums[i] = i`) is a cycle of length 1, so the answer is at least 1.",
        ],
      }),
      examples: [
        { input: "[2,0,1,4,3]", expectedOutput: "3" },
        { input: "[0,1,2]", expectedOutput: "1" },
        { input: "[1,2,3,4,0]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const nums = Array.from({ length: n }, (_, i) => i);
        const mode = ri(rng, 0, 9);
        if (mode === 0) {
          // identity — every cycle has length 1
        } else if (mode === 1) {
          // one big cycle
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          for (let i = 0; i < n; i++) nums[order[i]] = order[(i + 1) % n];
        } else {
          shuffle(rng, nums);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def arrayNesting(nums: List[int]) -> int:
              seen = [False] * len(nums)
              best = 0
              for i in range(len(nums)):
                  length = 0
                  j = i
                  while not seen[j]:
                      seen[j] = True
                      j = nums[j]
                      length += 1
                  best = max(best, length)
              return best
        `,
        javascript: code`
          var arrayNesting = function(nums) {
              var n = nums.length;
              var seen = new Array(n).fill(false);
              var best = 0;
              for (var i = 0; i < n; i++) {
                  var len = 0, j = i;
                  while (!seen[j]) {
                      seen[j] = true;
                      j = nums[j];
                      len++;
                  }
                  if (len > best) best = len;
              }
              return best;
          };
        `,
        typescript: code`
          function arrayNesting(nums: number[]): number {
              var n = nums.length;
              var seen: boolean[] = [];
              for (var i = 0; i < n; i++) seen.push(false);
              var best = 0;
              for (var s = 0; s < n; s++) {
                  var len = 0;
                  var j = s;
                  while (!seen[j]) {
                      seen[j] = true;
                      j = nums[j];
                      len++;
                  }
                  if (len > best) best = len;
              }
              return best;
          }
        `,
        java: code`
          public static int arrayNesting(int[] nums) {
              int n = nums.length;
              boolean[] seen = new boolean[n];
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int len = 0, j = i;
                  while (!seen[j]) {
                      seen[j] = true;
                      j = nums[j];
                      len++;
                  }
                  best = Math.max(best, len);
              }
              return best;
          }
        `,
        cpp: code`
          int arrayNesting(vector<int>& nums) {
              int n = nums.size();
              vector<bool> seen(n, false);
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int len = 0, j = i;
                  while (!seen[j]) {
                      seen[j] = true;
                      j = nums[j];
                      len++;
                  }
                  best = max(best, len);
              }
              return best;
          }
        `,
        c: code`
          int arrayNesting(int* nums, int numsSize) {
              char* seen = (char*)calloc(numsSize + 1, 1);
              int best = 0;
              for (int i = 0; i < numsSize; i++) {
                  int len = 0, j = i;
                  while (!seen[j]) {
                      seen[j] = 1;
                      j = nums[j];
                      len++;
                  }
                  if (len > best) best = len;
              }
              free(seen);
              return best;
          }
        `,
        csharp: code`
          public static int ArrayNesting(int[] nums)
          {
              int n = nums.Length;
              var seen = new bool[n];
              int best = 0;
              for (int i = 0; i < n; i++)
              {
                  int len = 0, j = i;
                  while (!seen[j])
                  {
                      seen[j] = true;
                      j = nums[j];
                      len++;
                  }
                  if (len > best) best = len;
              }
              return best;
          }
        `,
        go: code`
          func arrayNesting(nums []int) int {
              n := len(nums)
              seen := make([]bool, n)
              best := 0
              for i := 0; i < n; i++ {
                  length := 0
                  j := i
                  for !seen[j] {
                      seen[j] = true
                      j = nums[j]
                      length++
                  }
                  if length > best {
                      best = length
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun arrayNesting(nums: IntArray): Int {
              val seen = BooleanArray(nums.size)
              var best = 0
              for (i in nums.indices) {
                  var len = 0
                  var j = i
                  while (!seen[j]) {
                      seen[j] = true
                      j = nums[j]
                      len++
                  }
                  if (len > best) best = len
              }
              return best
          }
        `,
        swift: code`
          func arrayNesting(_ nums: [Int]) -> Int {
              var seen = [Bool](repeating: false, count: nums.count)
              var best = 0
              for i in 0..<nums.count {
                  var len = 0
                  var j = i
                  while !seen[j] {
                      seen[j] = true
                      j = nums[j]
                      len += 1
                  }
                  best = max(best, len)
              }
              return best
          }
        `,
        rust: code`
          fn arrayNesting(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut seen = vec![false; n];
              let mut best = 0;
              for i in 0..n {
                  let mut len = 0;
                  let mut j = i;
                  while !seen[j] {
                      seen[j] = true;
                      j = nums[j] as usize;
                      len += 1;
                  }
                  if len > best {
                      best = len;
                  }
              }
              best
          }
        `,
        php: code`
          function arrayNesting($nums) {
              $n = count($nums);
              $seen = array_fill(0, $n, false);
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $len = 0;
                  $j = $i;
                  while (!$seen[$j]) {
                      $seen[$j] = true;
                      $j = $nums[$j];
                      $len++;
                  }
                  if ($len > $best) $best = $len;
              }
              return $best;
          }
        `,
        ruby: code`
          def arrayNesting(nums)
            seen = Array.new(nums.length, false)
            best = 0
            nums.each_index do |i|
              len = 0
              j = i
              until seen[j]
                seen[j] = true
                j = nums[j]
                len += 1
              end
              best = len if len > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Global and Local Inversions (LC 775) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let global = 0, local = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) if (nums[i] > nums[j]) global++;
        if (i + 1 < nums.length && nums[i] > nums[i + 1]) local++;
      }
      return global === local;
    };
    return {
      slug: "global-and-local-inversions",
      title: "Global and Local Inversions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Amazon", "Google"],
      signature: { funcName: "isIdealPermutation", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "`nums` is a permutation of the integers `0` to `n - 1`.\n\n- A **global inversion** is a pair of indices `i < j` with `nums[i] > nums[j]`.\n- A **local inversion** is an index `i` with `nums[i] > nums[i + 1]`.\n\nEvery local inversion is also a global one. Return `true` if the number of global inversions equals the number of local inversions.",
        [
          { in: "nums = [0,2,1,3]", out: "true", note: "The only inversion is `(2, 1)`, and it is adjacent." },
          { in: "nums = [2,0,1]", out: "false", note: "Global inversions: `(2, 0)` and `(2, 1)`. Local: only `(2, 0)`." },
          { in: "nums = [0]", out: "true" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] < nums.length", "All the integers of `nums` are unique.", "`nums` is a permutation of all the numbers in the range `[0, n - 1]`."]),
      hints: [
        "Since every local inversion is global, the counts are equal exactly when there is no global inversion that is not local.",
        "A non-local inversion is a pair `i < j` with `j >= i + 2` and `nums[i] > nums[j]`.",
        "Scan left to right keeping the maximum of `nums[0..j-2]`; if it ever exceeds `nums[j]`, the answer is `false`.",
      ],
      editorial: explain({
        idea: "Local inversions are a subset of global ones, so the counts match exactly when no inversion spans a gap of two or more positions.",
        steps: [
          "Keep `maxSeen`, the largest value among `nums[0..j-2]`.",
          "For each `j` from 2 upward, first fold `nums[j-2]` into `maxSeen`.",
          "If `maxSeen > nums[j]`, some `i <= j - 2` forms a non-local inversion with `j` — return `false`.",
          "If the scan finishes, return `true`.",
        ],
        why: "Global = local + (number of inversions with distance at least 2). The difference is zero precisely when that second set is empty. For a fixed `j`, such an inversion exists iff some earlier value at distance two or more is larger, i.e. iff the prefix maximum up to `j - 2` exceeds `nums[j]`. Checking each `j` once covers every candidate pair.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting global inversions directly is O(n^2) (or O(n log n) with merge sort) and unnecessary.",
          "The prefix maximum must stop two positions back — including `nums[j-1]` would flag legal local inversions.",
          "An equivalent test is `|nums[i] - i| <= 1` for every `i`, which holds because the values are exactly `0..n-1`.",
        ],
      }),
      examples: [
        { input: "[0,2,1,3]", expectedOutput: "true" },
        { input: "[2,0,1]", expectedOutput: "false" },
        { input: "[0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 4, 10), ri(rng, 11, 40)]);
        const nums = Array.from({ length: n }, (_, i) => i);
        const mode = ri(rng, 0, 2);
        if (mode === 0) {
          shuffle(rng, nums);
        } else {
          for (let i = 0; i + 1 < n; i++) {
            if (rng() < 0.4) { const t = nums[i]; nums[i] = nums[i + 1]; nums[i + 1] = t; i++; }
          }
          if (mode === 2 && n >= 3) {
            const a = ri(rng, 0, n - 3), b = ri(rng, a + 2, n - 1);
            const t = nums[a]; nums[a] = nums[b]; nums[b] = t;
          }
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isIdealPermutation(nums: List[int]) -> bool:
              max_seen = -1
              for j in range(2, len(nums)):
                  max_seen = max(max_seen, nums[j - 2])
                  if max_seen > nums[j]:
                      return False
              return True
        `,
        javascript: code`
          var isIdealPermutation = function(nums) {
              var maxSeen = -1;
              for (var j = 2; j < nums.length; j++) {
                  if (nums[j - 2] > maxSeen) maxSeen = nums[j - 2];
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function isIdealPermutation(nums: number[]): boolean {
              var maxSeen = -1;
              for (var j = 2; j < nums.length; j++) {
                  if (nums[j - 2] > maxSeen) maxSeen = nums[j - 2];
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isIdealPermutation(int[] nums) {
              int maxSeen = -1;
              for (int j = 2; j < nums.length; j++) {
                  maxSeen = Math.max(maxSeen, nums[j - 2]);
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool isIdealPermutation(vector<int>& nums) {
              int maxSeen = -1;
              for (int j = 2; j < (int)nums.size(); j++) {
                  maxSeen = max(maxSeen, nums[j - 2]);
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          }
        `,
        c: code`
          bool isIdealPermutation(int* nums, int numsSize) {
              int maxSeen = -1;
              for (int j = 2; j < numsSize; j++) {
                  if (nums[j - 2] > maxSeen) maxSeen = nums[j - 2];
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool IsIdealPermutation(int[] nums)
          {
              int maxSeen = -1;
              for (int j = 2; j < nums.Length; j++)
              {
                  maxSeen = Math.Max(maxSeen, nums[j - 2]);
                  if (maxSeen > nums[j]) return false;
              }
              return true;
          }
        `,
        go: code`
          func isIdealPermutation(nums []int) bool {
              maxSeen := -1
              for j := 2; j < len(nums); j++ {
                  if nums[j-2] > maxSeen {
                      maxSeen = nums[j-2]
                  }
                  if maxSeen > nums[j] {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun isIdealPermutation(nums: IntArray): Boolean {
              var maxSeen = -1
              for (j in 2 until nums.size) {
                  if (nums[j - 2] > maxSeen) maxSeen = nums[j - 2]
                  if (maxSeen > nums[j]) return false
              }
              return true
          }
        `,
        swift: code`
          func isIdealPermutation(_ nums: [Int]) -> Bool {
              var maxSeen = -1
              var j = 2
              while j < nums.count {
                  maxSeen = max(maxSeen, nums[j - 2])
                  if maxSeen > nums[j] { return false }
                  j += 1
              }
              return true
          }
        `,
        rust: code`
          fn isIdealPermutation(nums: Vec<i32>) -> bool {
              let mut max_seen = -1;
              for j in 2..nums.len() {
                  if nums[j - 2] > max_seen {
                      max_seen = nums[j - 2];
                  }
                  if max_seen > nums[j] {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function isIdealPermutation($nums) {
              $maxSeen = -1;
              $n = count($nums);
              for ($j = 2; $j < $n; $j++) {
                  if ($nums[$j - 2] > $maxSeen) $maxSeen = $nums[$j - 2];
                  if ($maxSeen > $nums[$j]) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def isIdealPermutation(nums)
            max_seen = -1
            (2...nums.length).each do |j|
              max_seen = nums[j - 2] if nums[j - 2] > max_seen
              return false if max_seen > nums[j]
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Friends Of Appropriate Ages (LC 825) ────────────────────────
  (() => {
    const ref = (ages: number[]) => {
      let total = 0;
      for (let x = 0; x < ages.length; x++) {
        for (let y = 0; y < ages.length; y++) {
          if (x === y) continue;
          const ax = ages[x], ay = ages[y];
          if (ay <= 0.5 * ax + 7) continue;
          if (ay > ax) continue;
          if (ay > 100 && ax < 100) continue;
          total++;
        }
      }
      return total;
    };
    return {
      slug: "friends-of-appropriate-ages",
      title: "Friends Of Appropriate Ages",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Counting", "Sorting", "Meta", "Amazon"],
      signature: { funcName: "numFriendRequests", params: [{ name: "ages", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A community has `n` members and `ages[i]` is the age of member `i`.\n\nMember `x` sends a friend request to member `y` (with `x != y`) **unless at least one** of these holds:\n\n- `ages[y] <= 0.5 * ages[x] + 7`\n- `ages[y] > ages[x]`\n- `ages[y] > 100` and `ages[x] < 100`\n\nRequests are one-way: `x` requesting `y` does not imply `y` requests `x`, and nobody requests themselves. Return the total number of friend requests sent.",
        [
          { in: "ages = [17,18,19]", out: "3", note: "18 requests 17, and 19 requests both 18 and 17." },
          { in: "ages = [14,14]", out: "0", note: "`14 <= 0.5 * 14 + 7`, so neither sends a request." },
          { in: "ages = [25,60,61,99]", out: "3", note: "61 requests 60, and 99 requests 61 and 60." },
        ],
        ["n == ages.length", "1 <= n <= 2 * 10^4", "1 <= ages[i] <= 120"]),
      hints: [
        "Comparing every pair of people is O(n^2), but there are only 120 possible ages.",
        "Count how many people have each age, then reason about pairs of ages instead of pairs of people.",
        "For ages `a` and `b`, if `a` may request `b`, that contributes `count[a] * count[b]` requests — minus `count[a]` when `a == b`, since nobody requests themselves.",
      ],
      editorial: explain({
        idea: "The rule depends only on the two ages, so group people by age and count requests between age buckets.",
        steps: [
          "Build `count[age]` for ages 1..120.",
          "For every pair of ages `(a, b)` with `b <= a` and `2 * b > a + 14` (the integer form of `b > 0.5a + 7`), add `count[a] * count[b]`.",
          "When `a == b`, use `count[a] - 1` instead of `count[b]` so a person never requests themselves.",
          "Return the total.",
        ],
        why: "Two people of the same ages behave identically under the rules, so the number of requests from bucket `a` to bucket `b` is the product of their sizes (excluding self-pairs when the buckets coincide). The third rule never adds a restriction: if `b > 100` and `a < 100`, then `b > a` already rejects the pair.",
        time: "O(n + 120^2)",
        space: "O(120)",
        pitfalls: [
          "Forgetting to subtract self-requests inside the same age bucket.",
          "Using floating point for `0.5 * a + 7` invites rounding mistakes; compare `2 * b <= a + 14` instead.",
          "Anyone aged 14 or less never sends a request at all, since `b <= a` forces `2b <= a + 14`.",
        ],
      }),
      examples: [
        { input: "[17,18,19]", expectedOutput: "3" },
        { input: "[14,14]", expectedOutput: "0" },
        { input: "[25,60,61,99]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 11, 50), ri(rng, 11, 50)]);
        const mode = ri(rng, 0, 3);
        let ages: number[];
        if (mode === 0) ages = Array.from({ length: n }, () => ri(rng, 1, 120));
        else if (mode === 1) ages = Array.from({ length: n }, () => ri(rng, 12, 22));
        else if (mode === 2) ages = Array.from({ length: n }, () => ri(rng, 95, 110));
        else { const a = ri(rng, 1, 120); ages = Array.from({ length: n }, () => a); }
        return { input: fmtIntArr(ages), expectedOutput: String(ref(ages)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numFriendRequests(ages: List[int]) -> int:
              count = [0] * 121
              for a in ages:
                  count[a] += 1
              total = 0
              for a in range(1, 121):
                  if count[a] == 0:
                      continue
                  for b in range(1, a + 1):
                      if count[b] == 0 or 2 * b <= a + 14:
                          continue
                      total += count[a] * (count[b] - (1 if a == b else 0))
              return total
        `,
        javascript: code`
          var numFriendRequests = function(ages) {
              var count = new Array(121).fill(0);
              for (var i = 0; i < ages.length; i++) count[ages[i]]++;
              var total = 0;
              for (var a = 1; a <= 120; a++) {
                  if (count[a] === 0) continue;
                  for (var b = 1; b <= a; b++) {
                      if (count[b] === 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a === b ? 1 : 0));
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function numFriendRequests(ages: number[]): number {
              var count: number[] = [];
              for (var k = 0; k <= 120; k++) count.push(0);
              for (var i = 0; i < ages.length; i++) count[ages[i]]++;
              var total = 0;
              for (var a = 1; a <= 120; a++) {
                  if (count[a] === 0) continue;
                  for (var b = 1; b <= a; b++) {
                      if (count[b] === 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a === b ? 1 : 0));
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int numFriendRequests(int[] ages) {
              int[] count = new int[121];
              for (int a : ages) count[a]++;
              int total = 0;
              for (int a = 1; a <= 120; a++) {
                  if (count[a] == 0) continue;
                  for (int b = 1; b <= a; b++) {
                      if (count[b] == 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a == b ? 1 : 0));
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int numFriendRequests(vector<int>& ages) {
              vector<int> count(121, 0);
              for (int a : ages) count[a]++;
              int total = 0;
              for (int a = 1; a <= 120; a++) {
                  if (count[a] == 0) continue;
                  for (int b = 1; b <= a; b++) {
                      if (count[b] == 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a == b ? 1 : 0));
                  }
              }
              return total;
          }
        `,
        c: code`
          int numFriendRequests(int* ages, int agesSize) {
              int count[121] = { 0 };
              for (int i = 0; i < agesSize; i++) count[ages[i]]++;
              int total = 0;
              for (int a = 1; a <= 120; a++) {
                  if (count[a] == 0) continue;
                  for (int b = 1; b <= a; b++) {
                      if (count[b] == 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a == b ? 1 : 0));
                  }
              }
              return total;
          }
        `,
        csharp: code`
          public static int NumFriendRequests(int[] ages)
          {
              var count = new int[121];
              foreach (var a in ages) count[a]++;
              int total = 0;
              for (int a = 1; a <= 120; a++)
              {
                  if (count[a] == 0) continue;
                  for (int b = 1; b <= a; b++)
                  {
                      if (count[b] == 0 || 2 * b <= a + 14) continue;
                      total += count[a] * (count[b] - (a == b ? 1 : 0));
                  }
              }
              return total;
          }
        `,
        go: code`
          func numFriendRequests(ages []int) int {
              count := make([]int, 121)
              for _, a := range ages {
                  count[a]++
              }
              total := 0
              for a := 1; a <= 120; a++ {
                  if count[a] == 0 {
                      continue
                  }
                  for b := 1; b <= a; b++ {
                      if count[b] == 0 || 2*b <= a+14 {
                          continue
                      }
                      same := 0
                      if a == b {
                          same = 1
                      }
                      total += count[a] * (count[b] - same)
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun numFriendRequests(ages: IntArray): Int {
              val count = IntArray(121)
              for (a in ages) count[a]++
              var total = 0
              for (a in 1..120) {
                  if (count[a] == 0) continue
                  for (b in 1..a) {
                      if (count[b] == 0 || 2 * b <= a + 14) continue
                      total += count[a] * (count[b] - (if (a == b) 1 else 0))
                  }
              }
              return total
          }
        `,
        swift: code`
          func numFriendRequests(_ ages: [Int]) -> Int {
              var count = [Int](repeating: 0, count: 121)
              for a in ages { count[a] += 1 }
              var total = 0
              for a in 1...120 {
                  if count[a] == 0 { continue }
                  for b in 1...a {
                      if count[b] == 0 || 2 * b <= a + 14 { continue }
                      total += count[a] * (count[b] - (a == b ? 1 : 0))
                  }
              }
              return total
          }
        `,
        rust: code`
          fn numFriendRequests(ages: Vec<i32>) -> i32 {
              let mut count = vec![0i32; 121];
              for &a in ages.iter() {
                  count[a as usize] += 1;
              }
              let mut total: i32 = 0;
              for a in 1..121usize {
                  if count[a] == 0 {
                      continue;
                  }
                  for b in 1..(a + 1) {
                      if count[b] == 0 || 2 * b <= a + 14 {
                          continue;
                      }
                      let same = if a == b { 1 } else { 0 };
                      total += count[a] * (count[b] - same);
                  }
              }
              total
          }
        `,
        php: code`
          function numFriendRequests($ages) {
              $count = array_fill(0, 121, 0);
              foreach ($ages as $a) $count[$a]++;
              $total = 0;
              for ($a = 1; $a <= 120; $a++) {
                  if ($count[$a] == 0) continue;
                  for ($b = 1; $b <= $a; $b++) {
                      if ($count[$b] == 0 || 2 * $b <= $a + 14) continue;
                      $total += $count[$a] * ($count[$b] - ($a == $b ? 1 : 0));
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def numFriendRequests(ages)
            count = Array.new(121, 0)
            ages.each { |a| count[a] += 1 }
            total = 0
            (1..120).each do |a|
              next if count[a] == 0
              (1..a).each do |b|
                next if count[b] == 0 || 2 * b <= a + 14
                total += count[a] * (count[b] - (a == b ? 1 : 0))
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Minimum Increment to Make Array Unique (LC 945) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      const taken = new Set<number>();
      let moves = 0;
      for (const v of sorted) {
        let t = v;
        while (taken.has(t)) t++;
        taken.add(t);
        moves += t - v;
      }
      return moves;
    };
    return {
      slug: "minimum-increment-to-make-array-unique",
      title: "Minimum Increment to Make Array Unique",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Counting", "Amazon", "Uber"],
      signature: { funcName: "minIncrementForUnique", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "In one move you may pick any index `i` and increase `nums[i]` by `1`.\n\nReturn the minimum number of moves needed so that every value in `nums` is distinct.\n\nThe test cases guarantee the answer fits in a 32-bit integer.",
        [
          { in: "nums = [4,4,4]", out: "3", note: "Raise one 4 to 5 (1 move) and another to 6 (2 moves)." },
          { in: "nums = [0,2,2,1]", out: "1", note: "One of the 2s becomes 3." },
          { in: "nums = [5,1,5,2,1]", out: "3", note: "For example `[6,1,5,3,2]`." },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^5", "The answer fits in a 32-bit integer."]),
      hints: [
        "Values can only go up, so a small value never needs to move past a larger one.",
        "Sort the array. Walking left to right, what is the smallest value the current element may take?",
        "Track the next free value `need`: an element below it is raised to `need` (costing `need - nums[i]`), otherwise it stays and `need` becomes `nums[i] + 1`.",
      ],
      editorial: explain({
        idea: "After sorting, each element should take the smallest value that is at least itself and larger than everything already placed.",
        steps: [
          "Sort `nums` ascending.",
          "Keep `need`, the smallest value not yet taken by the processed prefix (start at 0).",
          "For each element: if it is below `need`, add `need - nums[i]` moves and increment `need`; otherwise set `need = nums[i] + 1`.",
          "Return the total moves.",
        ],
        why: "Processing in sorted order, the placed values form an increasing sequence ending at `need - 1`. Giving the current element any value above `need` would only push later elements higher too, and a value below `need` is either taken or below the element itself. An exchange argument shows that assigning final values in the same order as the sorted originals is optimal, so this greedy is minimum.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "Moving only to the next value up (`nums[i-1] + 1`) without carrying `need` breaks on runs like `[1,1,1]`.",
          "Elements already above `need` must reset it, not increase the move count.",
          "A counting-sort sweep over values `0..max + n` also works in O(n + max).",
        ],
      }),
      examples: [
        { input: "[4,4,4]", expectedOutput: "3" },
        { input: "[0,2,2,1]", expectedOutput: "1" },
        { input: "[5,1,5,2,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 10), ri(rng, 11, 50), ri(rng, 11, 50), ri(rng, 11, 50)]);
        const mode = ri(rng, 0, 5);
        let nums: number[];
        if (mode <= 2) nums = Array.from({ length: n }, () => ri(rng, 0, pick(rng, [3, 10, 30])));
        else if (mode === 3) nums = Array.from({ length: n }, () => ri(rng, 0, 100000));
        else if (mode === 4) { const v = pick(rng, [0, 7, 100000]); nums = Array.from({ length: n }, () => v); }
        else nums = Array.from({ length: n }, () => ri(rng, 99980, 100000));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minIncrementForUnique(nums: List[int]) -> int:
              moves = 0
              need = 0
              for v in sorted(nums):
                  if v < need:
                      moves += need - v
                      need += 1
                  else:
                      need = v + 1
              return moves
        `,
        javascript: code`
          var minIncrementForUnique = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var moves = 0, need = 0;
              for (var i = 0; i < a.length; i++) {
                  if (a[i] < need) {
                      moves += need - a[i];
                      need++;
                  } else {
                      need = a[i] + 1;
                  }
              }
              return moves;
          };
        `,
        typescript: code`
          function minIncrementForUnique(nums: number[]): number {
              var a = nums.slice().sort(function(x: number, y: number) { return x - y; });
              var moves = 0, need = 0;
              for (var i = 0; i < a.length; i++) {
                  if (a[i] < need) {
                      moves += need - a[i];
                      need++;
                  } else {
                      need = a[i] + 1;
                  }
              }
              return moves;
          }
        `,
        java: code`
          public static int minIncrementForUnique(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int moves = 0, need = 0;
              for (int v : a) {
                  if (v < need) {
                      moves += need - v;
                      need++;
                  } else {
                      need = v + 1;
                  }
              }
              return moves;
          }
        `,
        cpp: code`
          int minIncrementForUnique(vector<int>& nums) {
              vector<int> a(nums);
              sort(a.begin(), a.end());
              int moves = 0, need = 0;
              for (int v : a) {
                  if (v < need) {
                      moves += need - v;
                      need++;
                  } else {
                      need = v + 1;
                  }
              }
              return moves;
          }
        `,
        c: code`
          static int cmpAsc945(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int minIncrementForUnique(int* nums, int numsSize) {
              int* a = (int*)malloc(sizeof(int) * (numsSize + 1));
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpAsc945);
              int moves = 0, need = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (a[i] < need) {
                      moves += need - a[i];
                      need++;
                  } else {
                      need = a[i] + 1;
                  }
              }
              free(a);
              return moves;
          }
        `,
        csharp: code`
          public static int MinIncrementForUnique(int[] nums)
          {
              var a = (int[])nums.Clone();
              Array.Sort(a);
              int moves = 0, need = 0;
              foreach (var v in a)
              {
                  if (v < need)
                  {
                      moves += need - v;
                      need++;
                  }
                  else
                  {
                      need = v + 1;
                  }
              }
              return moves;
          }
        `,
        go: code`
          func minIncrementForUnique(nums []int) int {
              a := make([]int, len(nums))
              copy(a, nums)
              sort.Ints(a)
              moves, need := 0, 0
              for _, v := range a {
                  if v < need {
                      moves += need - v
                      need++
                  } else {
                      need = v + 1
                  }
              }
              return moves
          }
        `,
        kotlin: code`
          fun minIncrementForUnique(nums: IntArray): Int {
              val a = nums.copyOf()
              a.sort()
              var moves = 0
              var need = 0
              for (v in a) {
                  if (v < need) {
                      moves += need - v
                      need++
                  } else {
                      need = v + 1
                  }
              }
              return moves
          }
        `,
        swift: code`
          func minIncrementForUnique(_ nums: [Int]) -> Int {
              let a = nums.sorted()
              var moves = 0
              var need = 0
              for v in a {
                  if v < need {
                      moves += need - v
                      need += 1
                  } else {
                      need = v + 1
                  }
              }
              return moves
          }
        `,
        rust: code`
          fn minIncrementForUnique(nums: Vec<i32>) -> i32 {
              let mut a = nums.clone();
              a.sort();
              let mut moves: i32 = 0;
              let mut need: i32 = 0;
              for &v in a.iter() {
                  if v < need {
                      moves += need - v;
                      need += 1;
                  } else {
                      need = v + 1;
                  }
              }
              moves
          }
        `,
        php: code`
          function minIncrementForUnique($nums) {
              sort($nums);
              $moves = 0;
              $need = 0;
              foreach ($nums as $v) {
                  if ($v < $need) {
                      $moves += $need - $v;
                      $need++;
                  } else {
                      $need = $v + 1;
                  }
              }
              return $moves;
          }
        `,
        ruby: code`
          def minIncrementForUnique(nums)
            moves = 0
            need = 0
            nums.sort.each do |v|
              if v < need
                moves += need - v
                need += 1
              else
                need = v + 1
              end
            end
            moves
          end
        `,
      },
    };
  })(),

  // ── Array of Doubled Pairs (LC 954) ─────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const sorted = arr.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
      const count = new Map<number, number>();
      for (const v of sorted) count.set(v, (count.get(v) || 0) + 1);
      for (const v of sorted) {
        if ((count.get(v) || 0) === 0) continue;
        count.set(v, (count.get(v) || 0) - 1);
        const d = count.get(2 * v) || 0;
        if (d === 0) return false;
        count.set(2 * v, d - 1);
      }
      return true;
    };
    return {
      slug: "array-of-doubled-pairs",
      title: "Array of Doubled Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Sorting", "Google", "Amazon"],
      signature: { funcName: "canReorderDoubled", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "`arr` has an even length. Decide whether its elements can be rearranged so that, for every `i` with `0 <= i < arr.length / 2`, the element at position `2 * i + 1` is exactly twice the element at position `2 * i`.\n\nIn other words: can the whole array be split into pairs `(x, 2x)`, each element used exactly once? Return `true` if it can.",
        [
          { in: "arr = [-6,4,2,-3]", out: "true", note: "Pairs `(2, 4)` and `(-3, -6)`." },
          { in: "arr = [5,1,5,10]", out: "false", note: "`1` needs a `2` and there is none." },
          { in: "arr = [0,4,0,2]", out: "true", note: "`(0, 0)` and `(2, 4)`." },
        ],
        ["2 <= arr.length <= 3 * 10^4", "arr.length is even", "-10^5 <= arr[i] <= 10^5"]),
      hints: [
        "Think about the element with the smallest absolute value: can it be the *double* in its pair?",
        "No — its partner would have to be half of it, which is smaller in absolute value. So it must pair with twice itself.",
        "Count the values, visit them in increasing absolute value, and match each remaining copy of `x` with a copy of `2x`. Zeros pair among themselves.",
      ],
      editorial: explain({
        idea: "The element of least absolute value has no smaller half available, so it is forced to pair with its double; repeating that forced choice decides the answer greedily.",
        steps: [
          "Count every value.",
          "Visit the distinct values in increasing order of absolute value.",
          "For `x = 0`, the count must be even (zeros pair with each other).",
          "For any other `x` with `c` copies left, require at least `c` copies of `2x`, then remove `c` copies of `2x`.",
          "If every value is settled, return `true`.",
        ],
        why: "When `x` is processed, every value of smaller absolute value has already been settled, so the only remaining partner for a copy of `x` is `2x` (its half `x / 2` would be smaller in absolute value and is already used up). The choice is forced, so failing here means no arrangement exists, and succeeding at every step builds one.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by plain value breaks negatives: for `-4` the partner is `-8`, which is *smaller*. Sort by absolute value instead.",
          "Zero is its own double, so its copies must pair among themselves — an odd count fails.",
          "Decrement the double's count by all copies of `x` at once; otherwise the loop may revisit `2x` with a stale count.",
        ],
      }),
      examples: [
        { input: "[-6,4,2,-3]", expectedOutput: "true" },
        { input: "[5,1,5,10]", expectedOutput: "false" },
        { input: "[0,4,0,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const half = pick(rng, [1, ri(rng, 2, 4), ri(rng, 5, 15)]);
        const mode = ri(rng, 0, 3);
        let arr: number[];
        if (mode === 0) {
          arr = Array.from({ length: 2 * half }, () => ri(rng, -4, 4));
        } else {
          const span = pick(rng, [3, 20, 50000]);
          arr = [];
          for (let i = 0; i < half; i++) {
            const x = ri(rng, -span, span);
            arr.push(x, 2 * x);
          }
          if (mode === 2) {
            const p = ri(rng, 0, arr.length - 1);
            arr[p] = ri(rng, -span, span);
          }
          shuffle(rng, arr);
        }
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def canReorderDoubled(arr: List[int]) -> bool:
              count = Counter(arr)
              for x in sorted(count, key=abs):
                  c = count[x]
                  if c == 0:
                      continue
                  if x == 0:
                      if c % 2:
                          return False
                      continue
                  if count[2 * x] < c:
                      return False
                  count[2 * x] -= c
              return True
        `,
        javascript: code`
          var canReorderDoubled = function(arr) {
              var count = new Map();
              for (var i = 0; i < arr.length; i++) count.set(arr[i], (count.get(arr[i]) || 0) + 1);
              var keys = Array.from(count.keys()).sort(function(a, b) { return Math.abs(a) - Math.abs(b); });
              for (var k = 0; k < keys.length; k++) {
                  var x = keys[k];
                  var c = count.get(x);
                  if (c === 0) continue;
                  if (x === 0) {
                      if (c % 2 !== 0) return false;
                      continue;
                  }
                  var d = count.get(2 * x) || 0;
                  if (d < c) return false;
                  count.set(2 * x, d - c);
              }
              return true;
          };
        `,
        typescript: code`
          function canReorderDoubled(arr: number[]): boolean {
              var count: { [k: string]: number } = {};
              var keys: number[] = [];
              for (var i = 0; i < arr.length; i++) {
                  var key = "" + arr[i];
                  if (count[key] === undefined) {
                      count[key] = 0;
                      keys.push(arr[i]);
                  }
                  count[key]++;
              }
              keys.sort(function(a: number, b: number) { return Math.abs(a) - Math.abs(b); });
              for (var k = 0; k < keys.length; k++) {
                  var x = keys[k];
                  var c = count["" + x];
                  if (c === 0) continue;
                  if (x === 0) {
                      if (c % 2 !== 0) return false;
                      continue;
                  }
                  var d = count["" + (2 * x)];
                  if (d === undefined || d < c) return false;
                  count["" + (2 * x)] = d - c;
              }
              return true;
          }
        `,
        java: code`
          public static boolean canReorderDoubled(int[] arr) {
              Map<Integer, Integer> count = new HashMap<>();
              for (int v : arr) count.merge(v, 1, Integer::sum);
              List<Integer> keys = new ArrayList<>(count.keySet());
              keys.sort((a, b) -> Integer.compare(Math.abs(a), Math.abs(b)));
              for (int x : keys) {
                  int c = count.get(x);
                  if (c == 0) continue;
                  if (x == 0) {
                      if (c % 2 != 0) return false;
                      continue;
                  }
                  int d = count.getOrDefault(2 * x, 0);
                  if (d < c) return false;
                  count.put(2 * x, d - c);
              }
              return true;
          }
        `,
        cpp: code`
          bool canReorderDoubled(vector<int>& arr) {
              unordered_map<int, int> count;
              for (int v : arr) count[v]++;
              vector<int> keys;
              for (auto& p : count) keys.push_back(p.first);
              sort(keys.begin(), keys.end(), [](int a, int b) { return abs(a) < abs(b); });
              for (int x : keys) {
                  int c = count[x];
                  if (c == 0) continue;
                  if (x == 0) {
                      if (c % 2 != 0) return false;
                      continue;
                  }
                  auto it = count.find(2 * x);
                  if (it == count.end() || it->second < c) return false;
                  it->second -= c;
              }
              return true;
          }
        `,
        c: code`
          static int cmpAsc954(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static int find954(int* vals, int m, int target) {
              int lo = 0, hi = m - 1;
              while (lo <= hi) {
                  int mid = (lo + hi) / 2;
                  if (vals[mid] == target) return mid;
                  if (vals[mid] < target) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }

          static bool settle954(int* vals, int* cnts, int m, int idx) {
              int c = cnts[idx];
              if (c == 0) return true;
              int j = find954(vals, m, 2 * vals[idx]);
              if (j < 0 || cnts[j] < c) return false;
              cnts[j] -= c;
              return true;
          }

          bool canReorderDoubled(int* arr, int arrSize) {
              int* a = (int*)malloc(sizeof(int) * (arrSize + 1));
              int* vals = (int*)malloc(sizeof(int) * (arrSize + 1));
              int* cnts = (int*)malloc(sizeof(int) * (arrSize + 1));
              for (int i = 0; i < arrSize; i++) a[i] = arr[i];
              qsort(a, arrSize, sizeof(int), cmpAsc954);
              int m = 0;
              for (int i = 0; i < arrSize; i++) {
                  if (m > 0 && vals[m - 1] == a[i]) {
                      cnts[m - 1]++;
                  } else {
                      vals[m] = a[i];
                      cnts[m] = 1;
                      m++;
                  }
              }
              bool ok = true;
              int firstNonNeg = 0;
              while (firstNonNeg < m && vals[firstNonNeg] < 0) firstNonNeg++;
              /* negatives from closest-to-zero outward, then zero and the positives upward */
              for (int i = firstNonNeg - 1; i >= 0 && ok; i--) ok = settle954(vals, cnts, m, i);
              for (int i = firstNonNeg; i < m && ok; i++) {
                  if (vals[i] == 0) {
                      if (cnts[i] % 2 != 0) ok = false;
                  } else {
                      ok = settle954(vals, cnts, m, i);
                  }
              }
              free(a);
              free(vals);
              free(cnts);
              return ok;
          }
        `,
        csharp: code`
          public static bool CanReorderDoubled(int[] arr)
          {
              var count = new Dictionary<int, int>();
              foreach (var v in arr)
              {
                  count.TryGetValue(v, out int cur);
                  count[v] = cur + 1;
              }
              var keys = count.Keys.ToList();
              keys.Sort((a, b) => Math.Abs(a).CompareTo(Math.Abs(b)));
              foreach (var x in keys)
              {
                  int c = count[x];
                  if (c == 0) continue;
                  if (x == 0)
                  {
                      if (c % 2 != 0) return false;
                      continue;
                  }
                  count.TryGetValue(2 * x, out int d);
                  if (d < c) return false;
                  count[2 * x] = d - c;
              }
              return true;
          }
        `,
        go: code`
          func canReorderDoubled(arr []int) bool {
              count := map[int]int{}
              for _, v := range arr {
                  count[v]++
              }
              keys := make([]int, 0, len(count))
              for k := range count {
                  keys = append(keys, k)
              }
              sort.Slice(keys, func(i, j int) bool { return abs954(keys[i]) < abs954(keys[j]) })
              for _, x := range keys {
                  c := count[x]
                  if c == 0 {
                      continue
                  }
                  if x == 0 {
                      if c%2 != 0 {
                          return false
                      }
                      continue
                  }
                  if count[2*x] < c {
                      return false
                  }
                  count[2*x] -= c
              }
              return true
          }

          func abs954(x int) int {
              if x < 0 {
                  return -x
              }
              return x
          }
        `,
        kotlin: code`
          fun canReorderDoubled(arr: IntArray): Boolean {
              val count = HashMap<Int, Int>()
              for (v in arr) count[v] = (count[v] ?: 0) + 1
              val keys = count.keys.sortedBy { Math.abs(it) }
              for (x in keys) {
                  val c = count[x] ?: 0
                  if (c == 0) continue
                  if (x == 0) {
                      if (c % 2 != 0) return false
                      continue
                  }
                  val d = count[2 * x] ?: 0
                  if (d < c) return false
                  count[2 * x] = d - c
              }
              return true
          }
        `,
        swift: code`
          func canReorderDoubled(_ arr: [Int]) -> Bool {
              var count = [Int: Int]()
              for v in arr { count[v, default: 0] += 1 }
              let keys = count.keys.sorted { abs($0) < abs($1) }
              for x in keys {
                  let c = count[x] ?? 0
                  if c == 0 { continue }
                  if x == 0 {
                      if c % 2 != 0 { return false }
                      continue
                  }
                  let d = count[2 * x] ?? 0
                  if d < c { return false }
                  count[2 * x] = d - c
              }
              return true
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn canReorderDoubled(arr: Vec<i32>) -> bool {
              let mut count: HashMap<i32, i32> = HashMap::new();
              for &v in arr.iter() {
                  *count.entry(v).or_insert(0) += 1;
              }
              let mut keys: Vec<i32> = count.keys().cloned().collect();
              keys.sort_by_key(|x| x.abs());
              for &x in keys.iter() {
                  let c = *count.get(&x).unwrap_or(&0);
                  if c == 0 {
                      continue;
                  }
                  if x == 0 {
                      if c % 2 != 0 {
                          return false;
                      }
                      continue;
                  }
                  let d = *count.get(&(2 * x)).unwrap_or(&0);
                  if d < c {
                      return false;
                  }
                  count.insert(2 * x, d - c);
              }
              true
          }
        `,
        php: code`
          function canReorderDoubled($arr) {
              $count = [];
              foreach ($arr as $v) $count[$v] = (isset($count[$v]) ? $count[$v] : 0) + 1;
              $keys = array_keys($count);
              usort($keys, function ($a, $b) { return abs($a) - abs($b); });
              foreach ($keys as $x) {
                  $c = $count[$x];
                  if ($c == 0) continue;
                  if ($x == 0) {
                      if ($c % 2 != 0) return false;
                      continue;
                  }
                  $d = isset($count[2 * $x]) ? $count[2 * $x] : 0;
                  if ($d < $c) return false;
                  $count[2 * $x] = $d - $c;
              }
              return true;
          }
        `,
        ruby: code`
          def canReorderDoubled(arr)
            count = Hash.new(0)
            arr.each { |v| count[v] += 1 }
            count.keys.sort_by { |x| x.abs }.each do |x|
              c = count[x]
              next if c == 0
              if x == 0
                return false if c.odd?
                next
              end
              return false if count[2 * x] < c
              count[2 * x] -= c
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Pairs of Songs With Total Durations Divisible by 60 (LC 1010) ─
  (() => {
    const ref = (time: number[]) => {
      let pairs = 0;
      for (let i = 0; i < time.length; i++) {
        for (let j = i + 1; j < time.length; j++) if ((time[i] + time[j]) % 60 === 0) pairs++;
      }
      return pairs;
    };
    return {
      slug: "pairs-of-songs-with-total-durations-divisible-by-60",
      title: "Pairs of Songs With Total Durations Divisible by 60",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Goldman Sachs", "Microsoft"],
      signature: { funcName: "numPairsDivisibleBy60", params: [{ name: "time", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A playlist is described by `time`, where `time[i]` is the length of song `i` in seconds.\n\nCount the pairs of indices `(i, j)` with `i < j` such that the two songs together last a whole number of minutes — that is, `(time[i] + time[j]) % 60 == 0`.",
        [
          { in: "time = [60,60,60]", out: "3", note: "Every pair sums to 120 seconds." },
          { in: "time = [10,50,70,110]", out: "4", note: "`10+50`, `10+110`, `50+70` and `70+110` are all multiples of 60." },
          { in: "time = [25,7]", out: "0" },
        ],
        ["1 <= time.length <= 6 * 10^4", "1 <= time[i] <= 500"]),
      hints: [
        "Only each duration's remainder modulo 60 matters.",
        "A song with remainder `r` completes a pair with any earlier song whose remainder is `(60 - r) % 60`.",
        "Scan once, keeping a count of each remainder seen so far; add the matching count before recording the current song.",
      ],
      editorial: explain({
        idea: "Two durations sum to a multiple of 60 exactly when their remainders mod 60 add up to 0 or 60, so pairs can be counted by remainder in one pass.",
        steps: [
          "Keep `cnt[0..59]`, the number of earlier songs with each remainder.",
          "For each song, let `r = time[i] % 60`.",
          "Add `cnt[(60 - r) % 60]` to the answer — every earlier song with the complementary remainder forms a valid pair.",
          "Then increment `cnt[r]`.",
        ],
        why: "Each valid pair `(i, j)` with `i < j` is counted exactly once: at index `j`, when `i` is already in the table with the complementary remainder. The `% 60` on the complement maps remainder 0 to itself, so songs that are exact minutes pair with each other.",
        time: "O(n)",
        space: "O(60)",
        pitfalls: [
          "Without the outer `% 60`, a remainder of 0 looks for `cnt[60]`, which is out of range.",
          "Counting `cnt[r] * cnt[60 - r]` afterwards needs special handling for remainders 0 and 30 (pairs within one bucket).",
          "With up to 6 * 10^4 songs the count reaches about 1.8 * 10^9 — it still fits in a 32-bit int, but only just.",
        ],
      }),
      examples: [
        { input: "[60,60,60]", expectedOutput: "3" },
        { input: "[10,50,70,110]", expectedOutput: "4" },
        { input: "[25,7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 10), ri(rng, 11, 60), ri(rng, 11, 60), ri(rng, 11, 60)]);
        const mode = ri(rng, 0, 3);
        let time: number[];
        if (mode === 0) time = Array.from({ length: n }, () => ri(rng, 1, 500));
        else if (mode === 1) time = Array.from({ length: n }, () => 30 * ri(rng, 1, 16));
        else if (mode === 2) time = Array.from({ length: n }, () => pick(rng, [10, 20, 40, 50, 60, 70, 100, 110, 480]));
        else { const v = pick(rng, [60, 30, 1, 500]); time = Array.from({ length: n }, () => v); }
        return { input: fmtIntArr(time), expectedOutput: String(ref(time)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numPairsDivisibleBy60(time: List[int]) -> int:
              cnt = [0] * 60
              pairs = 0
              for t in time:
                  r = t % 60
                  pairs += cnt[(60 - r) % 60]
                  cnt[r] += 1
              return pairs
        `,
        javascript: code`
          var numPairsDivisibleBy60 = function(time) {
              var cnt = new Array(60).fill(0);
              var pairs = 0;
              for (var i = 0; i < time.length; i++) {
                  var r = time[i] % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          };
        `,
        typescript: code`
          function numPairsDivisibleBy60(time: number[]): number {
              var cnt: number[] = [];
              for (var k = 0; k < 60; k++) cnt.push(0);
              var pairs = 0;
              for (var i = 0; i < time.length; i++) {
                  var r = time[i] % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          }
        `,
        java: code`
          public static int numPairsDivisibleBy60(int[] time) {
              int[] cnt = new int[60];
              int pairs = 0;
              for (int t : time) {
                  int r = t % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          }
        `,
        cpp: code`
          int numPairsDivisibleBy60(vector<int>& time) {
              int cnt[60] = { 0 };
              int pairs = 0;
              for (int t : time) {
                  int r = t % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          }
        `,
        c: code`
          int numPairsDivisibleBy60(int* time, int timeSize) {
              int cnt[60] = { 0 };
              int pairs = 0;
              for (int i = 0; i < timeSize; i++) {
                  int r = time[i] % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          }
        `,
        csharp: code`
          public static int NumPairsDivisibleBy60(int[] time)
          {
              var cnt = new int[60];
              int pairs = 0;
              foreach (var t in time)
              {
                  int r = t % 60;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r]++;
              }
              return pairs;
          }
        `,
        go: code`
          func numPairsDivisibleBy60(time []int) int {
              cnt := make([]int, 60)
              pairs := 0
              for _, t := range time {
                  r := t % 60
                  pairs += cnt[(60-r)%60]
                  cnt[r]++
              }
              return pairs
          }
        `,
        kotlin: code`
          fun numPairsDivisibleBy60(time: IntArray): Int {
              val cnt = IntArray(60)
              var pairs = 0
              for (t in time) {
                  val r = t % 60
                  pairs += cnt[(60 - r) % 60]
                  cnt[r]++
              }
              return pairs
          }
        `,
        swift: code`
          func numPairsDivisibleBy60(_ time: [Int]) -> Int {
              var cnt = [Int](repeating: 0, count: 60)
              var pairs = 0
              for t in time {
                  let r = t % 60
                  pairs += cnt[(60 - r) % 60]
                  cnt[r] += 1
              }
              return pairs
          }
        `,
        rust: code`
          fn numPairsDivisibleBy60(time: Vec<i32>) -> i32 {
              let mut cnt = [0i32; 60];
              let mut pairs: i32 = 0;
              for &t in time.iter() {
                  let r = (t % 60) as usize;
                  pairs += cnt[(60 - r) % 60];
                  cnt[r] += 1;
              }
              pairs
          }
        `,
        php: code`
          function numPairsDivisibleBy60($time) {
              $cnt = array_fill(0, 60, 0);
              $pairs = 0;
              foreach ($time as $t) {
                  $r = $t % 60;
                  $pairs += $cnt[(60 - $r) % 60];
                  $cnt[$r]++;
              }
              return $pairs;
          }
        `,
        ruby: code`
          def numPairsDivisibleBy60(time)
            cnt = Array.new(60, 0)
            pairs = 0
            time.each do |t|
              r = t % 60
              pairs += cnt[(60 - r) % 60]
              cnt[r] += 1
            end
            pairs
          end
        `,
      },
    };
  })(),

  // ── Previous Permutation With One Swap (LC 1053) ────────────────
  (() => {
    const less = (a: number[], b: number[]) => {
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
      return false;
    };
    const ref = (arr: number[]) => {
      let best: number[] | null = null;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const c = arr.slice();
          const t = c[i]; c[i] = c[j]; c[j] = t;
          if (less(c, arr) && (best === null || less(best, c))) best = c;
        }
      }
      return best === null ? arr.slice() : best;
    };
    return {
      slug: "previous-permutation-with-one-swap",
      title: "Previous Permutation With One Swap",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Meta", "Amazon"],
      signature: { funcName: "prevPermOpt1", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array of positive integers `arr` (values may repeat).\n\nA **swap** exchanges the values at two positions `i` and `j`. Among all arrays obtainable from `arr` with **exactly one** swap that are **lexicographically smaller** than `arr`, return the **lexicographically largest** one.\n\nIf no single swap makes `arr` smaller, return `arr` unchanged.",
        [
          { in: "arr = [4,3,2]", out: "[4,2,3]", note: "Swapping the last two values gives the largest array that is still smaller." },
          { in: "arr = [2,2,7]", out: "[2,2,7]", note: "The array is non-decreasing, so every swap makes it larger or leaves it equal." },
          { in: "arr = [4,1,1,4]", out: "[1,4,1,4]", note: "Swapping 4 with the *first* of the two 1s keeps the larger value as far left as possible." },
        ],
        ["1 <= arr.length <= 10^4", "1 <= arr[i] <= 10^4"]),
      hints: [
        "To make the array smaller but as large as possible, change it as far to the right as you can.",
        "The leftmost changed position must receive a smaller value from its right. Find the rightmost `i` with `arr[i] > arr[i + 1]`.",
        "Swap `arr[i]` with the largest value to its right that is still smaller than `arr[i]`; if that value occurs several times, take its leftmost occurrence.",
      ],
      editorial: explain({
        idea: "The swap should touch the latest possible position `i` (so the shared prefix is as long as possible) and put there the largest smaller value available to its right.",
        steps: [
          "Scan from the right for the first index `i` with `arr[i] > arr[i + 1]`. If none exists, the array is non-decreasing — return it.",
          "Among indices `j > i`, the values smaller than `arr[i]` are candidates. Pick the largest such value.",
          "If that value appears several times, choose the leftmost of its occurrences after `i`.",
          "Swap `arr[i]` and `arr[j]` and return the array.",
        ],
        why: "A smaller result must lower the first position it changes, and that position needs a smaller value somewhere to its right — the rightmost such position is `i`, and everything after `i` is non-decreasing. Putting the largest smaller value at `i` maximises position `i`. The displaced `arr[i]` lands at `j`; among equal candidates the leftmost `j` places the larger value `arr[i]` earliest, which maximises the rest.",
        time: "O(n)",
        space: "O(1) (plus the output copy)",
        pitfalls: [
          "Picking the rightmost duplicate of the chosen value gives a smaller result: `[4,1,1,4]` must become `[1,4,1,4]`, not `[1,1,4,4]`.",
          "Because the suffix after `i` is non-decreasing, scanning `j` leftwards from the end while `arr[j] >= arr[i]` finds the largest smaller value.",
          "An already non-decreasing array has no smaller neighbour — return it as is.",
        ],
      }),
      examples: [
        { input: "[4,3,2]", expectedOutput: "[4,2,3]" },
        { input: "[2,2,7]", expectedOutput: "[2,2,7]" },
        { input: "[4,1,1,4]", expectedOutput: "[1,4,1,4]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 3, 8), ri(rng, 9, 25), ri(rng, 9, 25), ri(rng, 9, 25), ri(rng, 9, 25)]);
        const mode = ri(rng, 0, 3);
        let arr: number[];
        if (mode === 0) arr = Array.from({ length: n }, () => ri(rng, 1, 4));
        else if (mode === 1) arr = Array.from({ length: n }, () => ri(rng, 1, 10000));
        else if (mode === 2) arr = Array.from({ length: n }, () => ri(rng, 1, 6)).sort((a, b) => a - b);
        else arr = Array.from({ length: n }, () => ri(rng, 1, 9)).sort((a, b) => b - a);
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def prevPermOpt1(arr: List[int]) -> List[int]:
              a = list(arr)
              n = len(a)
              i = n - 2
              while i >= 0 and a[i] <= a[i + 1]:
                  i -= 1
              if i < 0:
                  return a
              j = n - 1
              while a[j] >= a[i]:
                  j -= 1
              while j - 1 > i and a[j - 1] == a[j]:
                  j -= 1
              a[i], a[j] = a[j], a[i]
              return a
        `,
        javascript: code`
          var prevPermOpt1 = function(arr) {
              var a = arr.slice();
              var n = a.length;
              var i = n - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              var j = n - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] === a[j]) j--;
              var t = a[i];
              a[i] = a[j];
              a[j] = t;
              return a;
          };
        `,
        typescript: code`
          function prevPermOpt1(arr: number[]): number[] {
              var a = arr.slice();
              var n = a.length;
              var i = n - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              var j = n - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] === a[j]) j--;
              var t = a[i];
              a[i] = a[j];
              a[j] = t;
              return a;
          }
        `,
        java: code`
          public static int[] prevPermOpt1(int[] arr) {
              int[] a = arr.clone();
              int n = a.length;
              int i = n - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              int j = n - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] == a[j]) j--;
              int t = a[i];
              a[i] = a[j];
              a[j] = t;
              return a;
          }
        `,
        cpp: code`
          vector<int> prevPermOpt1(vector<int>& arr) {
              vector<int> a(arr);
              int n = a.size();
              int i = n - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              int j = n - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] == a[j]) j--;
              swap(a[i], a[j]);
              return a;
          }
        `,
        c: code`
          int* prevPermOpt1(int* arr, int arrSize, int* returnSize) {
              int* a = (int*)malloc(sizeof(int) * (arrSize + 1));
              for (int k = 0; k < arrSize; k++) a[k] = arr[k];
              *returnSize = arrSize;
              int i = arrSize - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              int j = arrSize - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] == a[j]) j--;
              int t = a[i];
              a[i] = a[j];
              a[j] = t;
              return a;
          }
        `,
        csharp: code`
          public static int[] PrevPermOpt1(int[] arr)
          {
              var a = (int[])arr.Clone();
              int n = a.Length;
              int i = n - 2;
              while (i >= 0 && a[i] <= a[i + 1]) i--;
              if (i < 0) return a;
              int j = n - 1;
              while (a[j] >= a[i]) j--;
              while (j - 1 > i && a[j - 1] == a[j]) j--;
              int t = a[i];
              a[i] = a[j];
              a[j] = t;
              return a;
          }
        `,
        go: code`
          func prevPermOpt1(arr []int) []int {
              a := make([]int, len(arr))
              copy(a, arr)
              n := len(a)
              i := n - 2
              for i >= 0 && a[i] <= a[i+1] {
                  i--
              }
              if i < 0 {
                  return a
              }
              j := n - 1
              for a[j] >= a[i] {
                  j--
              }
              for j-1 > i && a[j-1] == a[j] {
                  j--
              }
              a[i], a[j] = a[j], a[i]
              return a
          }
        `,
        kotlin: code`
          fun prevPermOpt1(arr: IntArray): IntArray {
              val a = arr.copyOf()
              val n = a.size
              var i = n - 2
              while (i >= 0 && a[i] <= a[i + 1]) i--
              if (i < 0) return a
              var j = n - 1
              while (a[j] >= a[i]) j--
              while (j - 1 > i && a[j - 1] == a[j]) j--
              val t = a[i]
              a[i] = a[j]
              a[j] = t
              return a
          }
        `,
        swift: code`
          func prevPermOpt1(_ arr: [Int]) -> [Int] {
              var a = arr
              let n = a.count
              var i = n - 2
              while i >= 0 && a[i] <= a[i + 1] { i -= 1 }
              if i < 0 { return a }
              var j = n - 1
              while a[j] >= a[i] { j -= 1 }
              while j - 1 > i && a[j - 1] == a[j] { j -= 1 }
              a.swapAt(i, j)
              return a
          }
        `,
        rust: code`
          fn prevPermOpt1(arr: Vec<i32>) -> Vec<i32> {
              let mut a = arr.clone();
              let n = a.len();
              let mut idx: isize = n as isize - 2;
              while idx >= 0 && a[idx as usize] <= a[idx as usize + 1] {
                  idx -= 1;
              }
              if idx < 0 {
                  return a;
              }
              let i = idx as usize;
              let mut j = n - 1;
              while a[j] >= a[i] {
                  j -= 1;
              }
              while j - 1 > i && a[j - 1] == a[j] {
                  j -= 1;
              }
              a.swap(i, j);
              a
          }
        `,
        php: code`
          function prevPermOpt1($arr) {
              $a = $arr;
              $n = count($a);
              $i = $n - 2;
              while ($i >= 0 && $a[$i] <= $a[$i + 1]) $i--;
              if ($i < 0) return $a;
              $j = $n - 1;
              while ($a[$j] >= $a[$i]) $j--;
              while ($j - 1 > $i && $a[$j - 1] == $a[$j]) $j--;
              $t = $a[$i];
              $a[$i] = $a[$j];
              $a[$j] = $t;
              return $a;
          }
        `,
        ruby: code`
          def prevPermOpt1(arr)
            a = arr.dup
            n = a.length
            i = n - 2
            i -= 1 while i >= 0 && a[i] <= a[i + 1]
            return a if i < 0
            j = n - 1
            j -= 1 while a[j] >= a[i]
            j -= 1 while j - 1 > i && a[j - 1] == a[j]
            a[i], a[j] = a[j], a[i]
            a
          end
        `,
      },
    };
  })(),

  // ── Minimum Domino Rotations For Equal Row (LC 1007) ────────────
  (() => {
    const ref = (tops: number[], bottoms: number[]) => {
      let best = -1;
      for (let x = 1; x <= 6; x++) {
        let okTop = true, okBottom = true, rt = 0, rb = 0;
        for (let i = 0; i < tops.length; i++) {
          if (tops[i] !== x) { if (bottoms[i] === x) rt++; else okTop = false; }
          if (bottoms[i] !== x) { if (tops[i] === x) rb++; else okBottom = false; }
        }
        if (okTop && (best === -1 || rt < best)) best = rt;
        if (okBottom && (best === -1 || rb < best)) best = rb;
      }
      return best;
    };
    return {
      slug: "minimum-domino-rotations-for-equal-row",
      title: "Minimum Domino Rotations For Equal Row",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "minDominoRotations",
        params: [{ name: "tops", type: "int[]" as const }, { name: "bottoms", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A row of dominoes is laid out left to right. Domino `i` shows `tops[i]` on its top half and `bottoms[i]` on its bottom half; every half shows a number from 1 to 6.\n\nA **rotation** flips one domino so its top and bottom values trade places.\n\nReturn the minimum number of rotations after which **all** top values are equal, or **all** bottom values are equal. If neither can be achieved, return `-1`.",
        [
          { in: "tops = [3,1,3,3], bottoms = [1,3,4,5]", out: "1", note: "Rotating domino 1 makes the top row `[3,3,3,3]`." },
          { in: "tops = [2,5,1], bottoms = [6,2,4]", out: "-1", note: "No single value appears on every domino." },
          { in: "tops = [4,4], bottoms = [4,4]", out: "0" },
        ],
        ["2 <= tops.length <= 2 * 10^4", "bottoms.length == tops.length", "1 <= tops[i], bottoms[i] <= 6"]),
      hints: [
        "If a whole row ends up showing value `x`, then `x` must appear on every domino, in particular on domino 0.",
        "So only two candidates matter: `tops[0]` and `bottoms[0]`.",
        "For a candidate `x`, fail if some domino shows `x` on neither half; otherwise the cost for the top row is the number of dominoes whose top is not `x`, and similarly for the bottom row.",
      ],
      editorial: explain({
        idea: "The common value must appear on the first domino, so there are at most two candidates, and each is checked in one linear pass.",
        steps: [
          "For each candidate `x` in `{tops[0], bottoms[0]}`:",
          "Walk the dominoes. If neither half shows `x`, the candidate fails.",
          "Otherwise count `rotTop` (dominoes whose top is not `x` — they must be flipped to fill the top row) and `rotBottom` (likewise for the bottom).",
          "The candidate costs `min(rotTop, rotBottom)`. Return the best over the candidates, or `-1` if both fail.",
        ],
        why: "A domino showing `x` on one half can always be oriented to put `x` in the target row, at a cost of one rotation exactly when `x` is currently on the other side. Choosing the row whose current mismatches are fewer is optimal for that `x`, and any feasible `x` must come from domino 0.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A domino showing `x` on both halves never needs a rotation — count mismatches, not matches on the other side.",
          "Check both rows: making the bottom row uniform may be cheaper than the top.",
          "Trying all six values also works; restricting to domino 0's values is just a shortcut.",
        ],
      }),
      examples: [
        { input: "[3,1,3,3]\n[1,3,4,5]", expectedOutput: "1" },
        { input: "[2,5,1]\n[6,2,4]", expectedOutput: "-1" },
        { input: "[4,4]\n[4,4]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 3, 8), ri(rng, 9, 30), ri(rng, 9, 30)]);
        const mode = ri(rng, 0, 3);
        const tops: number[] = [], bottoms: number[] = [];
        if (mode === 0) {
          const hi = pick(rng, [2, 6]);
          for (let i = 0; i < n; i++) { tops.push(ri(rng, 1, hi)); bottoms.push(ri(rng, 1, hi)); }
        } else {
          const x = ri(rng, 1, 6);
          const pTop = pick(rng, [0.1, 0.5, 0.9]);
          for (let i = 0; i < n; i++) {
            const other = ri(rng, 1, 6);
            if (rng() < pTop) { tops.push(x); bottoms.push(other); } else { tops.push(other); bottoms.push(x); }
          }
          if (mode === 3) {
            const p = ri(rng, 0, n - 1);
            tops[p] = x === 6 ? 1 : x + 1;
            bottoms[p] = x === 1 ? 6 : x - 1;
          }
        }
        return { input: `${fmtIntArr(tops)}\n${fmtIntArr(bottoms)}`, expectedOutput: String(ref(tops, bottoms)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minDominoRotations(tops: List[int], bottoms: List[int]) -> int:
              def cost(x):
                  rot_top = rot_bottom = 0
                  for t, b in zip(tops, bottoms):
                      if t != x and b != x:
                          return -1
                      if t != x:
                          rot_top += 1
                      if b != x:
                          rot_bottom += 1
                  return min(rot_top, rot_bottom)

              best = -1
              for x in (tops[0], bottoms[0]):
                  c = cost(x)
                  if c != -1 and (best == -1 or c < best):
                      best = c
              return best
        `,
        javascript: code`
          var minDominoRotations = function(tops, bottoms) {
              var cost = function(x) {
                  var rotTop = 0, rotBottom = 0;
                  for (var i = 0; i < tops.length; i++) {
                      if (tops[i] !== x && bottoms[i] !== x) return -1;
                      if (tops[i] !== x) rotTop++;
                      if (bottoms[i] !== x) rotBottom++;
                  }
                  return Math.min(rotTop, rotBottom);
              };
              var a = cost(tops[0]), b = cost(bottoms[0]);
              if (a === -1) return b;
              if (b === -1) return a;
              return Math.min(a, b);
          };
        `,
        typescript: code`
          function minDominoRotations(tops: number[], bottoms: number[]): number {
              var cost = function(x: number): number {
                  var rotTop = 0, rotBottom = 0;
                  for (var i = 0; i < tops.length; i++) {
                      if (tops[i] !== x && bottoms[i] !== x) return -1;
                      if (tops[i] !== x) rotTop++;
                      if (bottoms[i] !== x) rotBottom++;
                  }
                  return Math.min(rotTop, rotBottom);
              };
              var a = cost(tops[0]), b = cost(bottoms[0]);
              if (a === -1) return b;
              if (b === -1) return a;
              return Math.min(a, b);
          }
        `,
        java: code`
          private static int dominoCost(int[] tops, int[] bottoms, int x) {
              int rotTop = 0, rotBottom = 0;
              for (int i = 0; i < tops.length; i++) {
                  if (tops[i] != x && bottoms[i] != x) return -1;
                  if (tops[i] != x) rotTop++;
                  if (bottoms[i] != x) rotBottom++;
              }
              return Math.min(rotTop, rotBottom);
          }

          public static int minDominoRotations(int[] tops, int[] bottoms) {
              int a = dominoCost(tops, bottoms, tops[0]);
              int b = dominoCost(tops, bottoms, bottoms[0]);
              if (a == -1) return b;
              if (b == -1) return a;
              return Math.min(a, b);
          }
        `,
        cpp: code`
          int dominoCost1007(vector<int>& tops, vector<int>& bottoms, int x) {
              int rotTop = 0, rotBottom = 0;
              for (size_t i = 0; i < tops.size(); i++) {
                  if (tops[i] != x && bottoms[i] != x) return -1;
                  if (tops[i] != x) rotTop++;
                  if (bottoms[i] != x) rotBottom++;
              }
              return min(rotTop, rotBottom);
          }

          int minDominoRotations(vector<int>& tops, vector<int>& bottoms) {
              int a = dominoCost1007(tops, bottoms, tops[0]);
              int b = dominoCost1007(tops, bottoms, bottoms[0]);
              if (a == -1) return b;
              if (b == -1) return a;
              return min(a, b);
          }
        `,
        c: code`
          static int dominoCost1007(int* tops, int* bottoms, int n, int x) {
              int rotTop = 0, rotBottom = 0;
              for (int i = 0; i < n; i++) {
                  if (tops[i] != x && bottoms[i] != x) return -1;
                  if (tops[i] != x) rotTop++;
                  if (bottoms[i] != x) rotBottom++;
              }
              return rotTop < rotBottom ? rotTop : rotBottom;
          }

          int minDominoRotations(int* tops, int topsSize, int* bottoms, int bottomsSize) {
              int a = dominoCost1007(tops, bottoms, topsSize, tops[0]);
              int b = dominoCost1007(tops, bottoms, topsSize, bottoms[0]);
              if (a == -1) return b;
              if (b == -1) return a;
              return a < b ? a : b;
          }
        `,
        csharp: code`
          private static int DominoCost(int[] tops, int[] bottoms, int x)
          {
              int rotTop = 0, rotBottom = 0;
              for (int i = 0; i < tops.Length; i++)
              {
                  if (tops[i] != x && bottoms[i] != x) return -1;
                  if (tops[i] != x) rotTop++;
                  if (bottoms[i] != x) rotBottom++;
              }
              return Math.Min(rotTop, rotBottom);
          }

          public static int MinDominoRotations(int[] tops, int[] bottoms)
          {
              int a = DominoCost(tops, bottoms, tops[0]);
              int b = DominoCost(tops, bottoms, bottoms[0]);
              if (a == -1) return b;
              if (b == -1) return a;
              return Math.Min(a, b);
          }
        `,
        go: code`
          func dominoCost1007(tops []int, bottoms []int, x int) int {
              rotTop, rotBottom := 0, 0
              for i := range tops {
                  if tops[i] != x && bottoms[i] != x {
                      return -1
                  }
                  if tops[i] != x {
                      rotTop++
                  }
                  if bottoms[i] != x {
                      rotBottom++
                  }
              }
              if rotTop < rotBottom {
                  return rotTop
              }
              return rotBottom
          }

          func minDominoRotations(tops []int, bottoms []int) int {
              a := dominoCost1007(tops, bottoms, tops[0])
              b := dominoCost1007(tops, bottoms, bottoms[0])
              if a == -1 {
                  return b
              }
              if b == -1 || a < b {
                  return a
              }
              return b
          }
        `,
        kotlin: code`
          fun dominoCost1007(tops: IntArray, bottoms: IntArray, x: Int): Int {
              var rotTop = 0
              var rotBottom = 0
              for (i in tops.indices) {
                  if (tops[i] != x && bottoms[i] != x) return -1
                  if (tops[i] != x) rotTop++
                  if (bottoms[i] != x) rotBottom++
              }
              return Math.min(rotTop, rotBottom)
          }

          fun minDominoRotations(tops: IntArray, bottoms: IntArray): Int {
              val a = dominoCost1007(tops, bottoms, tops[0])
              val b = dominoCost1007(tops, bottoms, bottoms[0])
              if (a == -1) return b
              if (b == -1) return a
              return Math.min(a, b)
          }
        `,
        swift: code`
          func dominoCost1007(_ tops: [Int], _ bottoms: [Int], _ x: Int) -> Int {
              var rotTop = 0
              var rotBottom = 0
              for i in 0..<tops.count {
                  if tops[i] != x && bottoms[i] != x { return -1 }
                  if tops[i] != x { rotTop += 1 }
                  if bottoms[i] != x { rotBottom += 1 }
              }
              return min(rotTop, rotBottom)
          }

          func minDominoRotations(_ tops: [Int], _ bottoms: [Int]) -> Int {
              let a = dominoCost1007(tops, bottoms, tops[0])
              let b = dominoCost1007(tops, bottoms, bottoms[0])
              if a == -1 { return b }
              if b == -1 { return a }
              return min(a, b)
          }
        `,
        rust: code`
          fn domino_cost_1007(tops: &Vec<i32>, bottoms: &Vec<i32>, x: i32) -> i32 {
              let mut rot_top = 0;
              let mut rot_bottom = 0;
              for i in 0..tops.len() {
                  if tops[i] != x && bottoms[i] != x {
                      return -1;
                  }
                  if tops[i] != x {
                      rot_top += 1;
                  }
                  if bottoms[i] != x {
                      rot_bottom += 1;
                  }
              }
              std::cmp::min(rot_top, rot_bottom)
          }

          fn minDominoRotations(tops: Vec<i32>, bottoms: Vec<i32>) -> i32 {
              let a = domino_cost_1007(&tops, &bottoms, tops[0]);
              let b = domino_cost_1007(&tops, &bottoms, bottoms[0]);
              if a == -1 {
                  return b;
              }
              if b == -1 {
                  return a;
              }
              std::cmp::min(a, b)
          }
        `,
        php: code`
          function dominoCost1007($tops, $bottoms, $x) {
              $rotTop = 0;
              $rotBottom = 0;
              $n = count($tops);
              for ($i = 0; $i < $n; $i++) {
                  if ($tops[$i] != $x && $bottoms[$i] != $x) return -1;
                  if ($tops[$i] != $x) $rotTop++;
                  if ($bottoms[$i] != $x) $rotBottom++;
              }
              return $rotTop < $rotBottom ? $rotTop : $rotBottom;
          }

          function minDominoRotations($tops, $bottoms) {
              $a = dominoCost1007($tops, $bottoms, $tops[0]);
              $b = dominoCost1007($tops, $bottoms, $bottoms[0]);
              if ($a == -1) return $b;
              if ($b == -1) return $a;
              return $a < $b ? $a : $b;
          }
        `,
        ruby: code`
          def domino_cost_1007(tops, bottoms, x)
            rot_top = 0
            rot_bottom = 0
            tops.each_index do |i|
              return -1 if tops[i] != x && bottoms[i] != x
              rot_top += 1 if tops[i] != x
              rot_bottom += 1 if bottoms[i] != x
            end
            [rot_top, rot_bottom].min
          end

          def minDominoRotations(tops, bottoms)
            a = domino_cost_1007(tops, bottoms, tops[0])
            b = domino_cost_1007(tops, bottoms, bottoms[0])
            return b if a == -1
            return a if b == -1
            [a, b].min
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum of Two Non-Overlapping Subarrays (LC 1031) ──────
  (() => {
    const ref = (nums: number[], L: number, M: number) => {
      const sum = (s: number, len: number) => { let t = 0; for (let i = s; i < s + len; i++) t += nums[i]; return t; };
      let best = -1;
      for (let a = 0; a + L <= nums.length; a++) {
        for (let b = 0; b + M <= nums.length; b++) {
          if (a + L <= b || b + M <= a) best = Math.max(best, sum(a, L) + sum(b, M));
        }
      }
      return best;
    };
    return {
      slug: "maximum-sum-of-two-non-overlapping-subarrays",
      title: "Maximum Sum of Two Non-Overlapping Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Sliding Window", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "maxSumTwoNoOverlap",
        params: [{ name: "nums", type: "int[]" as const }, { name: "firstLen", type: "int" as const }, { name: "secondLen", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given `nums` and two lengths `firstLen` and `secondLen`, choose two **non-overlapping** contiguous subarrays: one of length `firstLen` and one of length `secondLen`.\n\nThe subarray of length `firstLen` may lie either before or after the one of length `secondLen` — they just may not share an index. Return the largest possible total of the elements in the two subarrays.",
        [
          { in: "nums = [3,1,4,1,5,9,2,6], firstLen = 2, secondLen = 3", out: "23", note: "For example `[1,4]` and `[9,2,6]`: 5 + 18 = 23." },
          { in: "nums = [1,2,3], firstLen = 1, secondLen = 2", out: "6" },
          { in: "nums = [5,0,0,5], firstLen = 1, secondLen = 1", out: "10" },
        ],
        ["1 <= firstLen, secondLen <= 1000", "2 <= firstLen + secondLen <= 1000", "firstLen + secondLen <= nums.length <= 1000", "0 <= nums[i] <= 1000"]),
      hints: [
        "Prefix sums give any window's total in O(1).",
        "Fix where the *later* of the two windows ends. The earlier window can be any window that ends before it starts — you only need the best such one.",
        "Sweep the end index once, maintaining the best `firstLen` window seen so far to the left and the best `secondLen` window seen so far to the left; try both orders at every step.",
      ],
      editorial: explain({
        idea: "Treat the two orders separately: when a window of one length ends at `i`, pair it with the best window of the other length that ends before it begins — a running maximum.",
        steps: [
          "Build prefix sums `P` with `P[0] = 0`, so a window `[s, e)` sums to `P[e] - P[s]`.",
          "Let `L = firstLen`, `M = secondLen`. Start with `best = P[L + M]`, `bestL = P[L]`, `bestM = P[M]`.",
          "For each end `i` from `L + M + 1` to `n`: update `bestL` with the `L`-window ending at `i - M`, update `bestM` with the `M`-window ending at `i - L`.",
          "Then `best = max(best, bestL + (M-window ending at i), bestM + (L-window ending at i))`.",
          "Return `best`.",
        ],
        why: "In any valid pair one window comes second. If the `M`-window is second and ends at `i`, the `L`-window must end at or before `i - M`, and `bestL` is exactly the maximum over those choices — similarly with roles swapped. Every pair is therefore dominated by a candidate the sweep evaluates.",
        time: "O(n)",
        space: "O(n) for the prefix sums",
        pitfalls: [
          "Considering only the order \"`firstLen` window first\" misses half the answers.",
          "The running maxima must be updated before the combination at each step, and must only include windows ending at `i - M` (or `i - L`) or earlier.",
          "The initial value `P[L + M]` covers the case where the two windows exactly tile the first `L + M` elements in either order.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5,9,2,6]\n2\n3", expectedOutput: "23" },
        { input: "[1,2,3]\n1\n2", expectedOutput: "6" },
        { input: "[5,0,0,5]\n1\n1", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const L = ri(rng, 1, n - 1);
        const M = ri(rng, 1, n - L);
        const hi = pick(rng, [0, 5, 5, 1000, 1000, 1000, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: `${fmtIntArr(nums)}\n${L}\n${M}`, expectedOutput: String(ref(nums, L, M)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSumTwoNoOverlap(nums: List[int], firstLen: int, secondLen: int) -> int:
              n = len(nums)
              p = [0] * (n + 1)
              for i, v in enumerate(nums):
                  p[i + 1] = p[i] + v
              L, M = firstLen, secondLen
              best = p[L + M]
              best_l = p[L]
              best_m = p[M]
              for i in range(L + M + 1, n + 1):
                  best_l = max(best_l, p[i - M] - p[i - M - L])
                  best_m = max(best_m, p[i - L] - p[i - L - M])
                  best = max(best, best_l + p[i] - p[i - M], best_m + p[i] - p[i - L])
              return best
        `,
        javascript: code`
          var maxSumTwoNoOverlap = function(nums, firstLen, secondLen) {
              var n = nums.length, L = firstLen, M = secondLen;
              var p = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) p[i + 1] = p[i] + nums[i];
              var best = p[L + M], bestL = p[L], bestM = p[M];
              for (var e = L + M + 1; e <= n; e++) {
                  bestL = Math.max(bestL, p[e - M] - p[e - M - L]);
                  bestM = Math.max(bestM, p[e - L] - p[e - L - M]);
                  best = Math.max(best, bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]);
              }
              return best;
          };
        `,
        typescript: code`
          function maxSumTwoNoOverlap(nums: number[], firstLen: number, secondLen: number): number {
              var n = nums.length, L = firstLen, M = secondLen;
              var p: number[] = [0];
              for (var i = 0; i < n; i++) p.push(p[i] + nums[i]);
              var best = p[L + M], bestL = p[L], bestM = p[M];
              for (var e = L + M + 1; e <= n; e++) {
                  bestL = Math.max(bestL, p[e - M] - p[e - M - L]);
                  bestM = Math.max(bestM, p[e - L] - p[e - L - M]);
                  best = Math.max(best, bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]);
              }
              return best;
          }
        `,
        java: code`
          public static int maxSumTwoNoOverlap(int[] nums, int firstLen, int secondLen) {
              int n = nums.length, L = firstLen, M = secondLen;
              int[] p = new int[n + 1];
              for (int i = 0; i < n; i++) p[i + 1] = p[i] + nums[i];
              int best = p[L + M], bestL = p[L], bestM = p[M];
              for (int e = L + M + 1; e <= n; e++) {
                  bestL = Math.max(bestL, p[e - M] - p[e - M - L]);
                  bestM = Math.max(bestM, p[e - L] - p[e - L - M]);
                  best = Math.max(best, Math.max(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]));
              }
              return best;
          }
        `,
        cpp: code`
          int maxSumTwoNoOverlap(vector<int>& nums, int firstLen, int secondLen) {
              int n = nums.size(), L = firstLen, M = secondLen;
              vector<int> p(n + 1, 0);
              for (int i = 0; i < n; i++) p[i + 1] = p[i] + nums[i];
              int best = p[L + M], bestL = p[L], bestM = p[M];
              for (int e = L + M + 1; e <= n; e++) {
                  bestL = max(bestL, p[e - M] - p[e - M - L]);
                  bestM = max(bestM, p[e - L] - p[e - L - M]);
                  best = max(best, max(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]));
              }
              return best;
          }
        `,
        c: code`
          static int max1031(int a, int b) { return a > b ? a : b; }

          int maxSumTwoNoOverlap(int* nums, int numsSize, int firstLen, int secondLen) {
              int n = numsSize, L = firstLen, M = secondLen;
              int* p = (int*)malloc(sizeof(int) * (n + 1));
              p[0] = 0;
              for (int i = 0; i < n; i++) p[i + 1] = p[i] + nums[i];
              int best = p[L + M], bestL = p[L], bestM = p[M];
              for (int e = L + M + 1; e <= n; e++) {
                  bestL = max1031(bestL, p[e - M] - p[e - M - L]);
                  bestM = max1031(bestM, p[e - L] - p[e - L - M]);
                  best = max1031(best, max1031(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]));
              }
              free(p);
              return best;
          }
        `,
        csharp: code`
          public static int MaxSumTwoNoOverlap(int[] nums, int firstLen, int secondLen)
          {
              int n = nums.Length, L = firstLen, M = secondLen;
              var p = new int[n + 1];
              for (int i = 0; i < n; i++) p[i + 1] = p[i] + nums[i];
              int best = p[L + M], bestL = p[L], bestM = p[M];
              for (int e = L + M + 1; e <= n; e++)
              {
                  bestL = Math.Max(bestL, p[e - M] - p[e - M - L]);
                  bestM = Math.Max(bestM, p[e - L] - p[e - L - M]);
                  best = Math.Max(best, Math.Max(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]));
              }
              return best;
          }
        `,
        go: code`
          func maxSumTwoNoOverlap(nums []int, firstLen int, secondLen int) int {
              n, L, M := len(nums), firstLen, secondLen
              p := make([]int, n+1)
              for i := 0; i < n; i++ {
                  p[i+1] = p[i] + nums[i]
              }
              best, bestL, bestM := p[L+M], p[L], p[M]
              for e := L + M + 1; e <= n; e++ {
                  if v := p[e-M] - p[e-M-L]; v > bestL {
                      bestL = v
                  }
                  if v := p[e-L] - p[e-L-M]; v > bestM {
                      bestM = v
                  }
                  if v := bestL + p[e] - p[e-M]; v > best {
                      best = v
                  }
                  if v := bestM + p[e] - p[e-L]; v > best {
                      best = v
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxSumTwoNoOverlap(nums: IntArray, firstLen: Int, secondLen: Int): Int {
              val n = nums.size
              val L = firstLen
              val M = secondLen
              val p = IntArray(n + 1)
              for (i in 0 until n) p[i + 1] = p[i] + nums[i]
              var best = p[L + M]
              var bestL = p[L]
              var bestM = p[M]
              for (e in (L + M + 1)..n) {
                  bestL = Math.max(bestL, p[e - M] - p[e - M - L])
                  bestM = Math.max(bestM, p[e - L] - p[e - L - M])
                  best = Math.max(best, Math.max(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]))
              }
              return best
          }
        `,
        swift: code`
          func maxSumTwoNoOverlap(_ nums: [Int], _ firstLen: Int, _ secondLen: Int) -> Int {
              let n = nums.count
              let L = firstLen
              let M = secondLen
              var p = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { p[i + 1] = p[i] + nums[i] }
              var best = p[L + M]
              var bestL = p[L]
              var bestM = p[M]
              var e = L + M + 1
              while e <= n {
                  bestL = max(bestL, p[e - M] - p[e - M - L])
                  bestM = max(bestM, p[e - L] - p[e - L - M])
                  best = max(best, max(bestL + p[e] - p[e - M], bestM + p[e] - p[e - L]))
                  e += 1
              }
              return best
          }
        `,
        rust: code`
          fn maxSumTwoNoOverlap(nums: Vec<i32>, first_len: i32, second_len: i32) -> i32 {
              let n = nums.len();
              let l = first_len as usize;
              let m = second_len as usize;
              let mut p = vec![0i32; n + 1];
              for i in 0..n {
                  p[i + 1] = p[i] + nums[i];
              }
              let mut best = p[l + m];
              let mut best_l = p[l];
              let mut best_m = p[m];
              for e in (l + m + 1)..(n + 1) {
                  best_l = std::cmp::max(best_l, p[e - m] - p[e - m - l]);
                  best_m = std::cmp::max(best_m, p[e - l] - p[e - l - m]);
                  best = std::cmp::max(best, std::cmp::max(best_l + p[e] - p[e - m], best_m + p[e] - p[e - l]));
              }
              best
          }
        `,
        php: code`
          function maxSumTwoNoOverlap($nums, $firstLen, $secondLen) {
              $n = count($nums);
              $L = $firstLen;
              $M = $secondLen;
              $p = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $p[$i + 1] = $p[$i] + $nums[$i];
              $best = $p[$L + $M];
              $bestL = $p[$L];
              $bestM = $p[$M];
              for ($e = $L + $M + 1; $e <= $n; $e++) {
                  $bestL = max($bestL, $p[$e - $M] - $p[$e - $M - $L]);
                  $bestM = max($bestM, $p[$e - $L] - $p[$e - $L - $M]);
                  $best = max($best, $bestL + $p[$e] - $p[$e - $M], $bestM + $p[$e] - $p[$e - $L]);
              }
              return $best;
          }
        `,
        ruby: code`
          def maxSumTwoNoOverlap(nums, first_len, second_len)
            n = nums.length
            l = first_len
            m = second_len
            p = Array.new(n + 1, 0)
            nums.each_with_index { |v, i| p[i + 1] = p[i] + v }
            best = p[l + m]
            best_l = p[l]
            best_m = p[m]
            (l + m + 1).upto(n) do |e|
              best_l = [best_l, p[e - m] - p[e - m - l]].max
              best_m = [best_m, p[e - l] - p[e - l - m]].max
              best = [best, best_l + p[e] - p[e - m], best_m + p[e] - p[e - l]].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Decrease Elements To Make Array Zigzag (LC 1144) ────────────
  (() => {
    const isZigzag = (a: number[], valleyParity: number) => {
      for (let i = 0; i < a.length; i++) {
        if (i % 2 !== valleyParity) continue;
        if (i > 0 && a[i] >= a[i - 1]) return false;
        if (i + 1 < a.length && a[i] >= a[i + 1]) return false;
      }
      return true;
    };
    const ref = (nums: number[]) => {
      let best = Infinity;
      for (let parity = 0; parity < 2; parity++) {
        const a = nums.slice();
        let moves = 0;
        for (let i = parity; i < a.length; i += 2) {
          while ((i > 0 && a[i] >= a[i - 1]) || (i + 1 < a.length && a[i] >= a[i + 1])) { a[i]--; moves++; }
        }
        if (!isZigzag(a, parity)) throw new Error("ref: not zigzag");
        best = Math.min(best, moves);
      }
      return best;
    };
    return {
      slug: "decrease-elements-to-make-array-zigzag",
      title: "Decrease Elements To Make Array Zigzag",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Google", "Amazon"],
      signature: { funcName: "movesToMakeZigzag", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "In one move you may choose any element of `nums` and **decrease** it by `1` (values may drop to zero or below).\n\nAn array is a **zigzag array** if one of these holds:\n\n- every even-indexed element is greater than its neighbours: `A[0] > A[1] < A[2] > A[3] < ...`, or\n- every odd-indexed element is greater than its neighbours: `A[0] < A[1] > A[2] < A[3] > ...`.\n\nReturn the minimum number of moves needed to turn `nums` into a zigzag array.",
        [
          { in: "nums = [4,4,4]", out: "1", note: "Lower the middle 4 to 3." },
          { in: "nums = [5,1,5,1,5]", out: "0", note: "Already a zigzag." },
          { in: "nums = [6,5,6,7,7]", out: "2", note: "Lower index 3 from 7 to 5, giving `[6,5,6,5,7]`." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 1000"]),
      hints: [
        "Only decreases are allowed. In each pattern, which elements would you ever want to decrease — the peaks or the valleys?",
        "Lowering a peak only makes things worse for its neighbouring valleys, so in a fixed pattern only the valleys move.",
        "For each of the two patterns, push every valley down to one less than its smaller neighbour (if it is not already below both), sum the cost, and take the cheaper pattern.",
      ],
      editorial: explain({
        idea: "Fix which parity holds the valleys; then the peaks never need to change, and each valley independently drops to just below its smaller neighbour.",
        steps: [
          "For each index `i`, let `low` be the minimum of its existing neighbours.",
          "If `nums[i] >= low`, making `i` a valley costs `nums[i] - low + 1`; otherwise it costs 0.",
          "Add that cost to the total for parity `i % 2`.",
          "Return the smaller of the two totals.",
        ],
        why: "In a chosen pattern, decreasing a peak can only raise the cost of the valleys beside it, so an optimal solution leaves every peak at its original value. Valleys are never adjacent to each other, so each valley's cost depends only on the original values of its neighbours, and the cheapest choice is to stop exactly one below the smaller of them.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using already-decreased neighbour values is wrong — a valley's neighbours are peaks, which never change.",
          "End elements have only one neighbour; a single-element array is trivially zigzag.",
          "The valley must be strictly smaller, hence the `+ 1`.",
        ],
      }),
      examples: [
        { input: "[4,4,4]", expectedOutput: "1" },
        { input: "[5,1,5,1,5]", expectedOutput: "0" },
        { input: "[6,5,6,7,7]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 3, 8), ri(rng, 9, 30), ri(rng, 9, 30), ri(rng, 9, 30), ri(rng, 9, 30)]);
        const hi = pick(rng, [3, 10, 1000]);
        const mode = ri(rng, 0, 3);
        let nums: number[];
        if (mode === 0) { const v = ri(rng, 1, hi); nums = Array.from({ length: n }, () => v); }
        else if (mode === 1) nums = Array.from({ length: n }, (_, i) => Math.min(1000, 1 + i * ri(rng, 1, 3)));
        else nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def movesToMakeZigzag(nums: List[int]) -> int:
              n = len(nums)
              cost = [0, 0]
              for i in range(n):
                  low = float("inf")
                  if i > 0:
                      low = min(low, nums[i - 1])
                  if i + 1 < n:
                      low = min(low, nums[i + 1])
                  if nums[i] >= low:
                      cost[i % 2] += nums[i] - low + 1
              return int(min(cost))
        `,
        javascript: code`
          var movesToMakeZigzag = function(nums) {
              var n = nums.length;
              var cost = [0, 0];
              for (var i = 0; i < n; i++) {
                  var low = 2147483647;
                  if (i > 0) low = Math.min(low, nums[i - 1]);
                  if (i + 1 < n) low = Math.min(low, nums[i + 1]);
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return Math.min(cost[0], cost[1]);
          };
        `,
        typescript: code`
          function movesToMakeZigzag(nums: number[]): number {
              var n = nums.length;
              var cost: number[] = [0, 0];
              for (var i = 0; i < n; i++) {
                  var low = 2147483647;
                  if (i > 0) low = Math.min(low, nums[i - 1]);
                  if (i + 1 < n) low = Math.min(low, nums[i + 1]);
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return Math.min(cost[0], cost[1]);
          }
        `,
        java: code`
          public static int movesToMakeZigzag(int[] nums) {
              int n = nums.length;
              int[] cost = new int[2];
              for (int i = 0; i < n; i++) {
                  int low = Integer.MAX_VALUE;
                  if (i > 0) low = Math.min(low, nums[i - 1]);
                  if (i + 1 < n) low = Math.min(low, nums[i + 1]);
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return Math.min(cost[0], cost[1]);
          }
        `,
        cpp: code`
          int movesToMakeZigzag(vector<int>& nums) {
              int n = nums.size();
              int cost[2] = { 0, 0 };
              for (int i = 0; i < n; i++) {
                  int low = INT_MAX;
                  if (i > 0) low = min(low, nums[i - 1]);
                  if (i + 1 < n) low = min(low, nums[i + 1]);
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return min(cost[0], cost[1]);
          }
        `,
        c: code`
          int movesToMakeZigzag(int* nums, int numsSize) {
              int cost[2] = { 0, 0 };
              for (int i = 0; i < numsSize; i++) {
                  int low = 2147483647;
                  if (i > 0 && nums[i - 1] < low) low = nums[i - 1];
                  if (i + 1 < numsSize && nums[i + 1] < low) low = nums[i + 1];
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return cost[0] < cost[1] ? cost[0] : cost[1];
          }
        `,
        csharp: code`
          public static int MovesToMakeZigzag(int[] nums)
          {
              int n = nums.Length;
              var cost = new int[2];
              for (int i = 0; i < n; i++)
              {
                  int low = int.MaxValue;
                  if (i > 0) low = Math.Min(low, nums[i - 1]);
                  if (i + 1 < n) low = Math.Min(low, nums[i + 1]);
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1;
              }
              return Math.Min(cost[0], cost[1]);
          }
        `,
        go: code`
          func movesToMakeZigzag(nums []int) int {
              n := len(nums)
              cost := [2]int{0, 0}
              for i := 0; i < n; i++ {
                  low := 2147483647
                  if i > 0 && nums[i-1] < low {
                      low = nums[i-1]
                  }
                  if i+1 < n && nums[i+1] < low {
                      low = nums[i+1]
                  }
                  if nums[i] >= low {
                      cost[i%2] += nums[i] - low + 1
                  }
              }
              if cost[0] < cost[1] {
                  return cost[0]
              }
              return cost[1]
          }
        `,
        kotlin: code`
          fun movesToMakeZigzag(nums: IntArray): Int {
              val n = nums.size
              val cost = IntArray(2)
              for (i in 0 until n) {
                  var low = Int.MAX_VALUE
                  if (i > 0) low = Math.min(low, nums[i - 1])
                  if (i + 1 < n) low = Math.min(low, nums[i + 1])
                  if (nums[i] >= low) cost[i % 2] += nums[i] - low + 1
              }
              return Math.min(cost[0], cost[1])
          }
        `,
        swift: code`
          func movesToMakeZigzag(_ nums: [Int]) -> Int {
              let n = nums.count
              var cost = [0, 0]
              for i in 0..<n {
                  var low = Int.max
                  if i > 0 { low = min(low, nums[i - 1]) }
                  if i + 1 < n { low = min(low, nums[i + 1]) }
                  if nums[i] >= low { cost[i % 2] += nums[i] - low + 1 }
              }
              return min(cost[0], cost[1])
          }
        `,
        rust: code`
          fn movesToMakeZigzag(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut cost = [0i32; 2];
              for i in 0..n {
                  let mut low = std::i32::MAX;
                  if i > 0 && nums[i - 1] < low {
                      low = nums[i - 1];
                  }
                  if i + 1 < n && nums[i + 1] < low {
                      low = nums[i + 1];
                  }
                  if nums[i] >= low {
                      cost[i % 2] += nums[i] - low + 1;
                  }
              }
              std::cmp::min(cost[0], cost[1])
          }
        `,
        php: code`
          function movesToMakeZigzag($nums) {
              $n = count($nums);
              $cost = [0, 0];
              for ($i = 0; $i < $n; $i++) {
                  $low = PHP_INT_MAX;
                  if ($i > 0) $low = min($low, $nums[$i - 1]);
                  if ($i + 1 < $n) $low = min($low, $nums[$i + 1]);
                  if ($nums[$i] >= $low) $cost[$i % 2] += $nums[$i] - $low + 1;
              }
              return min($cost[0], $cost[1]);
          }
        `,
        ruby: code`
          def movesToMakeZigzag(nums)
            n = nums.length
            cost = [0, 0]
            n.times do |i|
              low = nil
              low = nums[i - 1] if i > 0
              low = nums[i + 1] if i + 1 < n && (low.nil? || nums[i + 1] < low)
              cost[i % 2] += nums[i] - low + 1 if !low.nil? && nums[i] >= low
            end
            cost.min
          end
        `,
      },
    };
  })(),

  // ── Number of Burgers with No Waste of Ingredients (LC 1276) ────
  (() => {
    const ref = (tomato: number, cheese: number) => {
      for (let j = 0; j <= cheese; j++) if (4 * j + 2 * (cheese - j) === tomato) return [j, cheese - j];
      return [] as number[];
    };
    return {
      slug: "number-of-burgers-with-no-waste-of-ingredients",
      title: "Number of Burgers with No Waste of Ingredients",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Amazon", "Google"],
      signature: {
        funcName: "numOfBurgers",
        params: [{ name: "tomatoSlices", type: "int" as const }, { name: "cheeseSlices", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "The CodeKairo canteen makes two kinds of burger:\n\n- a **Jumbo Burger** uses 4 tomato slices and 1 cheese slice;\n- a **Small Burger** uses 2 tomato slices and 1 cheese slice.\n\nGiven `tomatoSlices` and `cheeseSlices`, find how many of each burger to make so that **no** slice of either ingredient is left over. Return `[total_jumbo, total_small]`.\n\nIf it is impossible to use up both ingredients exactly, return an empty array `[]`. (When a solution exists it is unique.)",
        [
          { in: "tomatoSlices = 20, cheeseSlices = 6", out: "[4,2]", note: "4 Jumbo use 16 tomato + 4 cheese, 2 Small use 4 tomato + 2 cheese." },
          { in: "tomatoSlices = 17, cheeseSlices = 4", out: "[]", note: "Every burger uses an even number of tomato slices." },
          { in: "tomatoSlices = 0, cheeseSlices = 0", out: "[0,0]" },
        ],
        ["0 <= tomatoSlices, cheeseSlices <= 10^7"]),
      hints: [
        "Write two equations: one for tomato slices and one for cheese slices.",
        "With `J` jumbo and `S` small burgers: `4J + 2S = tomatoSlices` and `J + S = cheeseSlices`.",
        "Subtracting twice the second equation gives `2J = tomatoSlices - 2 * cheeseSlices`; check that `J` and `S` come out as non-negative integers.",
      ],
      editorial: explain({
        idea: "Two unknowns, two linear equations: solve them directly and check the answer is a pair of non-negative integers.",
        steps: [
          "Compute `d = tomatoSlices - 2 * cheeseSlices`, which must equal `2J`.",
          "If `d` is negative or odd, return `[]`.",
          "Let `J = d / 2` and `S = cheeseSlices - J`. If `S < 0`, return `[]`.",
          "Otherwise return `[J, S]`.",
        ],
        why: "The system `4J + 2S = T`, `J + S = C` has the unique solution `J = (T - 2C) / 2`, `S = C - J`. Burgers come in whole, non-negative quantities, so the ingredients can be used exactly if and only if both values are non-negative integers.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "An odd tomato count can never work — check parity before dividing.",
          "`S` can be negative even when `J` is fine (too many tomatoes for the cheese).",
          "Return an empty array, not `[0, 0]`, when there is no solution; `[0,0]` is the correct answer only for zero ingredients.",
        ],
      }),
      examples: [
        { input: "20\n6", expectedOutput: "[4,2]" },
        { input: "17\n4", expectedOutput: "[]" },
        { input: "0\n0", expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 5);
        let t: number, c: number, out: number[];
        if (mode <= 1) {
          const j = ri(rng, 0, pick(rng, [3, 300])), s = ri(rng, 0, pick(rng, [3, 300]));
          t = 4 * j + 2 * s; c = j + s; out = ref(t, c);
        } else if (mode === 2) {
          t = ri(rng, 0, 1300); c = ri(rng, 0, 400); out = ref(t, c);
        } else if (mode === 3) {
          // large and valid: the system has a unique solution, so (j, s) is the answer
          const j = ri(rng, 0, 1500000), s = ri(rng, 0, 1500000);
          t = 4 * j + 2 * s; c = j + s; out = [j, s];
        } else if (mode === 4) {
          // large with an odd tomato count: never possible
          t = 2 * ri(rng, 0, 4999999) + 1; c = ri(rng, 0, 10000000); out = [];
        } else {
          const j = ri(rng, 0, 50), s = ri(rng, 0, 50);
          t = 4 * j + 2 * s + pick(rng, [-2, 2, 4]); c = j + s;
          if (t < 0) t = 0;
          out = ref(t, c);
        }
        return { input: `${t}\n${c}`, expectedOutput: fmtIntArr(out) };
      },
      solutions: {
        python: code`
          from typing import List

          def numOfBurgers(tomatoSlices: int, cheeseSlices: int) -> List[int]:
              d = tomatoSlices - 2 * cheeseSlices
              if d < 0 or d % 2 != 0:
                  return []
              jumbo = d // 2
              small = cheeseSlices - jumbo
              if small < 0:
                  return []
              return [jumbo, small]
        `,
        javascript: code`
          var numOfBurgers = function(tomatoSlices, cheeseSlices) {
              var d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 !== 0) return [];
              var jumbo = d / 2;
              var small = cheeseSlices - jumbo;
              if (small < 0) return [];
              return [jumbo, small];
          };
        `,
        typescript: code`
          function numOfBurgers(tomatoSlices: number, cheeseSlices: number): number[] {
              var d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 !== 0) return [];
              var jumbo = d / 2;
              var small = cheeseSlices - jumbo;
              if (small < 0) return [];
              return [jumbo, small];
          }
        `,
        java: code`
          public static int[] numOfBurgers(int tomatoSlices, int cheeseSlices) {
              int d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 != 0) return new int[0];
              int jumbo = d / 2;
              int small = cheeseSlices - jumbo;
              if (small < 0) return new int[0];
              return new int[] { jumbo, small };
          }
        `,
        cpp: code`
          vector<int> numOfBurgers(int tomatoSlices, int cheeseSlices) {
              int d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 != 0) return {};
              int jumbo = d / 2;
              int small = cheeseSlices - jumbo;
              if (small < 0) return {};
              return { jumbo, small };
          }
        `,
        c: code`
          int* numOfBurgers(int tomatoSlices, int cheeseSlices, int* returnSize) {
              int* res = (int*)malloc(sizeof(int) * 2);
              *returnSize = 0;
              int d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 != 0) return res;
              int jumbo = d / 2;
              int small = cheeseSlices - jumbo;
              if (small < 0) return res;
              res[0] = jumbo;
              res[1] = small;
              *returnSize = 2;
              return res;
          }
        `,
        csharp: code`
          public static int[] NumOfBurgers(int tomatoSlices, int cheeseSlices)
          {
              int d = tomatoSlices - 2 * cheeseSlices;
              if (d < 0 || d % 2 != 0) return new int[0];
              int jumbo = d / 2;
              int small = cheeseSlices - jumbo;
              if (small < 0) return new int[0];
              return new int[] { jumbo, small };
          }
        `,
        go: code`
          func numOfBurgers(tomatoSlices int, cheeseSlices int) []int {
              d := tomatoSlices - 2*cheeseSlices
              if d < 0 || d%2 != 0 {
                  return []int{}
              }
              jumbo := d / 2
              small := cheeseSlices - jumbo
              if small < 0 {
                  return []int{}
              }
              return []int{jumbo, small}
          }
        `,
        kotlin: code`
          fun numOfBurgers(tomatoSlices: Int, cheeseSlices: Int): IntArray {
              val d = tomatoSlices - 2 * cheeseSlices
              if (d < 0 || d % 2 != 0) return intArrayOf()
              val jumbo = d / 2
              val small = cheeseSlices - jumbo
              if (small < 0) return intArrayOf()
              return intArrayOf(jumbo, small)
          }
        `,
        swift: code`
          func numOfBurgers(_ tomatoSlices: Int, _ cheeseSlices: Int) -> [Int] {
              let d = tomatoSlices - 2 * cheeseSlices
              if d < 0 || d % 2 != 0 { return [] }
              let jumbo = d / 2
              let small = cheeseSlices - jumbo
              if small < 0 { return [] }
              return [jumbo, small]
          }
        `,
        rust: code`
          fn numOfBurgers(tomato_slices: i32, cheese_slices: i32) -> Vec<i32> {
              let d = tomato_slices - 2 * cheese_slices;
              if d < 0 || d % 2 != 0 {
                  return vec![];
              }
              let jumbo = d / 2;
              let small = cheese_slices - jumbo;
              if small < 0 {
                  return vec![];
              }
              vec![jumbo, small]
          }
        `,
        php: code`
          function numOfBurgers($tomatoSlices, $cheeseSlices) {
              $d = $tomatoSlices - 2 * $cheeseSlices;
              if ($d < 0 || $d % 2 != 0) return [];
              $jumbo = intdiv($d, 2);
              $small = $cheeseSlices - $jumbo;
              if ($small < 0) return [];
              return [$jumbo, $small];
          }
        `,
        ruby: code`
          def numOfBurgers(tomato_slices, cheese_slices)
            d = tomato_slices - 2 * cheese_slices
            return [] if d < 0 || d.odd?
            jumbo = d / 2
            small = cheese_slices - jumbo
            return [] if small < 0
            [jumbo, small]
          end
        `,
      },
    };
  })(),

  // ── Maximum Subarray Sum with One Deletion (LC 1186) ────────────
  (() => {
    const ref = (arr: number[]) => {
      let best = -Infinity;
      for (let l = 0; l < arr.length; l++) {
        let sum = 0, mn = Infinity;
        for (let r = l; r < arr.length; r++) {
          sum += arr[r];
          mn = Math.min(mn, arr[r]);
          best = Math.max(best, sum);
          if (r > l) best = Math.max(best, sum - mn);
        }
      }
      return best;
    };
    return {
      slug: "maximum-subarray-sum-with-one-deletion",
      title: "Maximum Subarray Sum with One Deletion",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maximumSum", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Choose a non-empty contiguous subarray of `arr`, then optionally delete **at most one** element from it. The subarray must still contain at least one element after the deletion.\n\nReturn the maximum possible sum of the remaining elements.",
        [
          { in: "arr = [2,-5,3,4]", out: "9", note: "Take the whole array and delete `-5`." },
          { in: "arr = [-3,-1,-4]", out: "-1", note: "The best is the single element `-1`; deleting it would leave nothing." },
          { in: "arr = [6,-1,-1,6]", out: "11", note: "Delete one of the `-1`s: `6 - 1 + 6`." },
        ],
        ["1 <= arr.length <= 10^5", "-10^4 <= arr[i] <= 10^4"]),
      hints: [
        "Start from Kadane's algorithm: the best subarray sum ending at each index.",
        "Add a second state: the best sum of a subarray ending at `i` from which exactly one element has been deleted.",
        "`withDel[i] = max(withDel[i-1] + arr[i], keep[i-1])` — either the deletion happened earlier, or `arr[i]` itself is the deleted element.",
      ],
      editorial: explain({
        idea: "Run Kadane's algorithm with two states per index: no deletion yet, and exactly one deletion already used.",
        steps: [
          "Let `keep` be the best sum of a subarray ending at the current index with no deletion, and `del` the best with one deletion. Start with `keep = arr[0]`, `del = -infinity`, `best = arr[0]`.",
          "For each later element `a`: `newDel = max(del + a, keep)` (extend a deleted run, or delete `a` itself after a non-empty run).",
          "`keep = max(keep + a, a)` (plain Kadane).",
          "Set `del = newDel` and `best = max(best, keep, del)`.",
          "Return `best`.",
        ],
        why: "Every candidate subarray ending at `i` either uses no deletion (covered by Kadane) or deletes one element; if the deleted element is `arr[i]` the rest is a non-empty no-deletion subarray ending at `i - 1`, and otherwise it is a one-deletion subarray ending at `i - 1` extended by `arr[i]`. Both cases are exactly the two terms of the recurrence.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Deleting the only element of a single-element subarray is not allowed — `del` must start at minus infinity, not 0.",
          "When every value is negative the answer is the largest single element.",
          "Compute the new `del` from the *old* `keep` before overwriting it.",
        ],
      }),
      examples: [
        { input: "[2,-5,3,4]", expectedOutput: "9" },
        { input: "[-3,-1,-4]", expectedOutput: "-1" },
        { input: "[6,-1,-1,6]", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const mode = ri(rng, 0, 3);
        let arr: number[];
        if (mode === 0) arr = Array.from({ length: n }, () => ri(rng, -5, 5));
        else if (mode === 1) arr = Array.from({ length: n }, () => ri(rng, -10000, 10000));
        else if (mode === 2) arr = Array.from({ length: n }, () => ri(rng, -10000, -1));
        else arr = Array.from({ length: n }, () => (rng() < 0.7 ? ri(rng, 1, 100) : ri(rng, -300, -1)));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSum(arr: List[int]) -> int:
              keep = arr[0]
              dele = float("-inf")
              best = arr[0]
              for a in arr[1:]:
                  new_del = max(dele + a, keep)
                  keep = max(keep + a, a)
                  dele = new_del
                  best = max(best, keep, dele)
              return int(best)
        `,
        javascript: code`
          var maximumSum = function(arr) {
              var keep = arr[0], del = -1000000000, best = arr[0];
              for (var i = 1; i < arr.length; i++) {
                  var a = arr[i];
                  var newDel = Math.max(del + a, keep);
                  keep = Math.max(keep + a, a);
                  del = newDel;
                  best = Math.max(best, keep, del);
              }
              return best;
          };
        `,
        typescript: code`
          function maximumSum(arr: number[]): number {
              var keep = arr[0], del = -1000000000, best = arr[0];
              for (var i = 1; i < arr.length; i++) {
                  var a = arr[i];
                  var newDel = Math.max(del + a, keep);
                  keep = Math.max(keep + a, a);
                  del = newDel;
                  best = Math.max(best, keep, del);
              }
              return best;
          }
        `,
        java: code`
          public static int maximumSum(int[] arr) {
              int keep = arr[0], del = -1000000000, best = arr[0];
              for (int i = 1; i < arr.length; i++) {
                  int a = arr[i];
                  int newDel = Math.max(del + a, keep);
                  keep = Math.max(keep + a, a);
                  del = newDel;
                  best = Math.max(best, Math.max(keep, del));
              }
              return best;
          }
        `,
        cpp: code`
          int maximumSum(vector<int>& arr) {
              int keep = arr[0], del = -1000000000, best = arr[0];
              for (size_t i = 1; i < arr.size(); i++) {
                  int a = arr[i];
                  int newDel = max(del + a, keep);
                  keep = max(keep + a, a);
                  del = newDel;
                  best = max(best, max(keep, del));
              }
              return best;
          }
        `,
        c: code`
          static int max1186(int a, int b) { return a > b ? a : b; }

          int maximumSum(int* arr, int arrSize) {
              int keep = arr[0], del = -1000000000, best = arr[0];
              for (int i = 1; i < arrSize; i++) {
                  int a = arr[i];
                  int newDel = max1186(del + a, keep);
                  keep = max1186(keep + a, a);
                  del = newDel;
                  best = max1186(best, max1186(keep, del));
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaximumSum(int[] arr)
          {
              int keep = arr[0], del = -1000000000, best = arr[0];
              for (int i = 1; i < arr.Length; i++)
              {
                  int a = arr[i];
                  int newDel = Math.Max(del + a, keep);
                  keep = Math.Max(keep + a, a);
                  del = newDel;
                  best = Math.Max(best, Math.Max(keep, del));
              }
              return best;
          }
        `,
        go: code`
          func maximumSum(arr []int) int {
              keep, del, best := arr[0], -1000000000, arr[0]
              for i := 1; i < len(arr); i++ {
                  a := arr[i]
                  newDel := del + a
                  if keep > newDel {
                      newDel = keep
                  }
                  if keep+a > a {
                      keep = keep + a
                  } else {
                      keep = a
                  }
                  del = newDel
                  if keep > best {
                      best = keep
                  }
                  if del > best {
                      best = del
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumSum(arr: IntArray): Int {
              var keep = arr[0]
              var del = -1000000000
              var best = arr[0]
              for (i in 1 until arr.size) {
                  val a = arr[i]
                  val newDel = Math.max(del + a, keep)
                  keep = Math.max(keep + a, a)
                  del = newDel
                  best = Math.max(best, Math.max(keep, del))
              }
              return best
          }
        `,
        swift: code`
          func maximumSum(_ arr: [Int]) -> Int {
              var keep = arr[0]
              var del = -1000000000
              var best = arr[0]
              var i = 1
              while i < arr.count {
                  let a = arr[i]
                  let newDel = max(del + a, keep)
                  keep = max(keep + a, a)
                  del = newDel
                  best = max(best, max(keep, del))
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn maximumSum(arr: Vec<i32>) -> i32 {
              let mut keep = arr[0];
              let mut del: i32 = -1000000000;
              let mut best = arr[0];
              for i in 1..arr.len() {
                  let a = arr[i];
                  let new_del = std::cmp::max(del + a, keep);
                  keep = std::cmp::max(keep + a, a);
                  del = new_del;
                  best = std::cmp::max(best, std::cmp::max(keep, del));
              }
              best
          }
        `,
        php: code`
          function maximumSum($arr) {
              $keep = $arr[0];
              $del = -1000000000;
              $best = $arr[0];
              $n = count($arr);
              for ($i = 1; $i < $n; $i++) {
                  $a = $arr[$i];
                  $newDel = max($del + $a, $keep);
                  $keep = max($keep + $a, $a);
                  $del = $newDel;
                  $best = max($best, $keep, $del);
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumSum(arr)
            keep = arr[0]
            del = -1_000_000_000
            best = arr[0]
            (1...arr.length).each do |i|
              a = arr[i]
              new_del = [del + a, keep].max
              keep = [keep + a, a].max
              del = new_del
              best = [best, keep, del].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── K-Concatenation Maximum Sum (LC 1191) ───────────────────────
  (() => {
    const MOD = 1000000007;
    const kadane = (a: number[]) => {
      let best = 0, cur = 0;
      for (const v of a) { cur = Math.max(cur + v, v); best = Math.max(best, cur); }
      return best;
    };
    const ref = (arr: number[], k: number) => {
      const copies = Math.min(k, 3);
      let rep: number[] = [];
      for (let t = 0; t < copies; t++) rep = rep.concat(arr);
      let best = kadane(rep);
      if (k > 3) {
        let total = 0;
        for (const v of arr) total += v;
        if (total > 0) {
          let pre = 0, maxPre = 0, suf = 0, maxSuf = 0;
          for (let i = 0; i < arr.length; i++) { pre += arr[i]; maxPre = Math.max(maxPre, pre); }
          for (let i = arr.length - 1; i >= 0; i--) { suf += arr[i]; maxSuf = Math.max(maxSuf, suf); }
          best = Math.max(best, maxSuf + (k - 2) * total + maxPre);
        }
      }
      return best % MOD;
    };
    return {
      slug: "k-concatenation-maximum-sum",
      title: "K-Concatenation Maximum Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Uber"],
      signature: {
        funcName: "kConcatenationMaxSum",
        params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Build a new array by writing `arr` out `k` times back to back. For example, `arr = [1, 2]` with `k = 3` gives `[1, 2, 1, 2, 1, 2]`.\n\nReturn the maximum sum of a contiguous subarray of this new array. The subarray may be **empty**, in which case its sum is `0`.\n\nThe answer can be very large, so return it **modulo** `10^9 + 7`.",
        [
          { in: "arr = [3,-1], k = 3", out: "7", note: "`[3,-1,3,-1,3,-1]`: take `3,-1,3,-1,3`." },
          { in: "arr = [2,-5,1], k = 4", out: "3", note: "The copies lose value overall; the best is `1, 2` across one boundary." },
          { in: "arr = [10000,10000], k = 100000", out: "999999993", note: "The whole array sums to `2 * 10^9`, which is `999999993` modulo `10^9 + 7`." },
        ],
        ["1 <= arr.length <= 10^5", "1 <= k <= 10^5", "-10^4 <= arr[i] <= 10^4"]),
      hints: [
        "Never build the full array. What can the best subarray look like when `k` is large?",
        "It is either inside one copy, or it starts in some copy and ends in a later one: a suffix of one copy, some number of full copies, then a prefix of another.",
        "Full copies in the middle help only when the total of `arr` is positive. Run Kadane on two copies, then add `(k - 2) * total` if the total is positive. Use 64-bit arithmetic and reduce at the end.",
      ],
      editorial: explain({
        idea: "A best subarray spanning several copies is a suffix + some whole copies + a prefix; whole copies are worth including exactly when `arr` sums to something positive.",
        steps: [
          "If `k == 1`, return Kadane's maximum (with the empty subarray allowed) on `arr`.",
          "Otherwise compute `best2`, Kadane's maximum over two concatenated copies — this covers every subarray within one copy and every suffix + prefix pair.",
          "Let `total` be the sum of `arr`. If `total > 0`, add `(k - 2) * total`.",
          "Return the result modulo `10^9 + 7`.",
        ],
        why: "A subarray of the `k`-fold array either fits inside two adjacent copies or contains at least one full copy. If it contains `m >= 1` full copies plus a suffix and a prefix, then with `total > 0` it is best to take all `k - 2` middle copies, while with `total <= 0` dropping full copies never hurts, so it reduces to the two-copy case. When `total > 0` the best two-copy subarray is in fact a suffix + prefix pair, so adding `(k - 2) * total` to it is valid.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The empty subarray is allowed, so an all-negative array answers 0.",
          "`(k - 2) * total` reaches about 10^14 — compute in 64 bits and take the modulus only at the end (the maximum must be compared before reducing).",
          "For `k == 1` do not run on two copies — that would allow a subarray that wraps around.",
        ],
      }),
      examples: [
        { input: "[3,-1]\n3", expectedOutput: "7" },
        { input: "[2,-5,1]\n4", expectedOutput: "3" },
        { input: "[10000,10000]\n100000", expectedOutput: "999999993" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 30)]);
        const k = pick(rng, [1, 2, ri(rng, 3, 5), ri(rng, 6, 1000), ri(rng, 1000, 100000), 100000]);
        const mode = ri(rng, 0, 7);
        let arr: number[];
        if (mode <= 1) arr = Array.from({ length: n }, () => ri(rng, -10, 10));
        else if (mode <= 3) arr = Array.from({ length: n }, () => ri(rng, -10000, 10000));
        else if (mode <= 6) arr = Array.from({ length: n }, () => (rng() < 0.75 ? ri(rng, 0, 10000) : ri(rng, -10000, 0)));
        else arr = Array.from({ length: n }, () => ri(rng, -10000, -1));
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def kConcatenationMaxSum(arr: List[int], k: int) -> int:
              MOD = 10 ** 9 + 7

              def kadane(times):
                  best = cur = 0
                  for _ in range(times):
                      for a in arr:
                          cur = max(cur + a, a)
                          best = max(best, cur)
                  return best

              if k == 1:
                  return kadane(1) % MOD
              best = kadane(2)
              total = sum(arr)
              if total > 0:
                  best += (k - 2) * total
              return best % MOD
        `,
        javascript: code`
          var kConcatenationMaxSum = function(arr, k) {
              var MOD = 1000000007;
              var kadane = function(times) {
                  var best = 0, cur = 0;
                  for (var t = 0; t < times; t++) {
                      for (var i = 0; i < arr.length; i++) {
                          cur = Math.max(cur + arr[i], arr[i]);
                          if (cur > best) best = cur;
                      }
                  }
                  return best;
              };
              if (k === 1) return kadane(1) % MOD;
              var total = 0;
              for (var j = 0; j < arr.length; j++) total += arr[j];
              var best = kadane(2);
              if (total > 0) best += (k - 2) * total;
              return best % MOD;
          };
        `,
        typescript: code`
          function kConcatenationMaxSum(arr: number[], k: number): number {
              var MOD = 1000000007;
              var kadane = function(times: number): number {
                  var best = 0, cur = 0;
                  for (var t = 0; t < times; t++) {
                      for (var i = 0; i < arr.length; i++) {
                          cur = Math.max(cur + arr[i], arr[i]);
                          if (cur > best) best = cur;
                      }
                  }
                  return best;
              };
              if (k === 1) return kadane(1) % MOD;
              var total = 0;
              for (var j = 0; j < arr.length; j++) total += arr[j];
              var best = kadane(2);
              if (total > 0) best += (k - 2) * total;
              return best % MOD;
          }
        `,
        java: code`
          private static long kadane1191(int[] arr, int times) {
              long best = 0, cur = 0;
              for (int t = 0; t < times; t++) {
                  for (int a : arr) {
                      cur = Math.max(cur + a, (long) a);
                      best = Math.max(best, cur);
                  }
              }
              return best;
          }

          public static int kConcatenationMaxSum(int[] arr, int k) {
              long MOD = 1000000007L;
              if (k == 1) return (int) (kadane1191(arr, 1) % MOD);
              long total = 0;
              for (int a : arr) total += a;
              long best = kadane1191(arr, 2);
              if (total > 0) best += (long) (k - 2) * total;
              return (int) (best % MOD);
          }
        `,
        cpp: code`
          long long kadane1191(vector<int>& arr, int times) {
              long long best = 0, cur = 0;
              for (int t = 0; t < times; t++) {
                  for (int a : arr) {
                      cur = max(cur + a, (long long)a);
                      best = max(best, cur);
                  }
              }
              return best;
          }

          int kConcatenationMaxSum(vector<int>& arr, int k) {
              const long long MOD = 1000000007LL;
              if (k == 1) return (int)(kadane1191(arr, 1) % MOD);
              long long total = 0;
              for (int a : arr) total += a;
              long long best = kadane1191(arr, 2);
              if (total > 0) best += (long long)(k - 2) * total;
              return (int)(best % MOD);
          }
        `,
        c: code`
          static long long kadane1191(int* arr, int n, int times) {
              long long best = 0, cur = 0;
              for (int t = 0; t < times; t++) {
                  for (int i = 0; i < n; i++) {
                      long long ext = cur + arr[i];
                      cur = ext > arr[i] ? ext : arr[i];
                      if (cur > best) best = cur;
                  }
              }
              return best;
          }

          int kConcatenationMaxSum(int* arr, int arrSize, int k) {
              const long long MOD = 1000000007LL;
              if (k == 1) return (int)(kadane1191(arr, arrSize, 1) % MOD);
              long long total = 0;
              for (int i = 0; i < arrSize; i++) total += arr[i];
              long long best = kadane1191(arr, arrSize, 2);
              if (total > 0) best += (long long)(k - 2) * total;
              return (int)(best % MOD);
          }
        `,
        csharp: code`
          private static long Kadane1191(int[] arr, int times)
          {
              long best = 0, cur = 0;
              for (int t = 0; t < times; t++)
              {
                  foreach (var a in arr)
                  {
                      cur = Math.Max(cur + a, (long)a);
                      best = Math.Max(best, cur);
                  }
              }
              return best;
          }

          public static int KConcatenationMaxSum(int[] arr, int k)
          {
              const long MOD = 1000000007L;
              if (k == 1) return (int)(Kadane1191(arr, 1) % MOD);
              long total = 0;
              foreach (var a in arr) total += a;
              long best = Kadane1191(arr, 2);
              if (total > 0) best += (long)(k - 2) * total;
              return (int)(best % MOD);
          }
        `,
        go: code`
          func kadane1191(arr []int, times int) int64 {
              var best, cur int64
              for t := 0; t < times; t++ {
                  for _, a := range arr {
                      v := int64(a)
                      if cur+v > v {
                          cur = cur + v
                      } else {
                          cur = v
                      }
                      if cur > best {
                          best = cur
                      }
                  }
              }
              return best
          }

          func kConcatenationMaxSum(arr []int, k int) int {
              const MOD int64 = 1000000007
              if k == 1 {
                  return int(kadane1191(arr, 1) % MOD)
              }
              var total int64
              for _, a := range arr {
                  total += int64(a)
              }
              best := kadane1191(arr, 2)
              if total > 0 {
                  best += int64(k-2) * total
              }
              return int(best % MOD)
          }
        `,
        kotlin: code`
          fun kadane1191(arr: IntArray, times: Int): Long {
              var best = 0L
              var cur = 0L
              for (t in 0 until times) {
                  for (a in arr) {
                      cur = Math.max(cur + a, a.toLong())
                      best = Math.max(best, cur)
                  }
              }
              return best
          }

          fun kConcatenationMaxSum(arr: IntArray, k: Int): Int {
              val MOD = 1000000007L
              if (k == 1) return (kadane1191(arr, 1) % MOD).toInt()
              var total = 0L
              for (a in arr) total += a
              var best = kadane1191(arr, 2)
              if (total > 0) best += (k - 2).toLong() * total
              return (best % MOD).toInt()
          }
        `,
        swift: code`
          func kadane1191(_ arr: [Int], _ times: Int) -> Int {
              var best = 0
              var cur = 0
              for _ in 0..<times {
                  for a in arr {
                      cur = max(cur + a, a)
                      best = max(best, cur)
                  }
              }
              return best
          }

          func kConcatenationMaxSum(_ arr: [Int], _ k: Int) -> Int {
              let MOD = 1000000007
              if k == 1 { return kadane1191(arr, 1) % MOD }
              var total = 0
              for a in arr { total += a }
              var best = kadane1191(arr, 2)
              if total > 0 { best += (k - 2) * total }
              return best % MOD
          }
        `,
        rust: code`
          fn kadane_1191(arr: &Vec<i32>, times: i32) -> i64 {
              let mut best: i64 = 0;
              let mut cur: i64 = 0;
              for _ in 0..times {
                  for &a in arr.iter() {
                      let v = a as i64;
                      cur = std::cmp::max(cur + v, v);
                      best = std::cmp::max(best, cur);
                  }
              }
              best
          }

          fn kConcatenationMaxSum(arr: Vec<i32>, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              if k == 1 {
                  return (kadane_1191(&arr, 1) % modulus) as i32;
              }
              let total: i64 = arr.iter().map(|&a| a as i64).sum();
              let mut best = kadane_1191(&arr, 2);
              if total > 0 {
                  best += (k as i64 - 2) * total;
              }
              (best % modulus) as i32
          }
        `,
        php: code`
          function kadane1191($arr, $times) {
              $best = 0;
              $cur = 0;
              for ($t = 0; $t < $times; $t++) {
                  foreach ($arr as $a) {
                      $cur = max($cur + $a, $a);
                      if ($cur > $best) $best = $cur;
                  }
              }
              return $best;
          }

          function kConcatenationMaxSum($arr, $k) {
              $MOD = 1000000007;
              if ($k == 1) return kadane1191($arr, 1) % $MOD;
              $total = array_sum($arr);
              $best = kadane1191($arr, 2);
              if ($total > 0) $best += ($k - 2) * $total;
              return $best % $MOD;
          }
        `,
        ruby: code`
          def kadane_1191(arr, times)
            best = 0
            cur = 0
            times.times do
              arr.each do |a|
                cur = [cur + a, a].max
                best = cur if cur > best
              end
            end
            best
          end

          def kConcatenationMaxSum(arr, k)
            mod = 1_000_000_007
            return kadane_1191(arr, 1) % mod if k == 1
            total = arr.sum
            best = kadane_1191(arr, 2)
            best += (k - 2) * total if total > 0
            best % mod
          end
        `,
      },
    };
  })(),

  // ── Number of Sub-arrays With Odd Sum (LC 1524) ─────────────────
  (() => {
    const ref = (arr: number[]) => {
      let count = 0;
      for (let l = 0; l < arr.length; l++) {
        let s = 0;
        for (let r = l; r < arr.length; r++) { s += arr[r]; if (s % 2 === 1) count++; }
      }
      return count % 1000000007;
    };
    return {
      slug: "number-of-sub-arrays-with-odd-sum",
      title: "Number of Sub-arrays With Odd Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Prefix Sum", "Amazon", "Directi"],
      signature: { funcName: "numOfSubarrays", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `arr`, count its non-empty contiguous subarrays whose sum is **odd**.\n\nThe count can be large, so return it **modulo** `10^9 + 7`.",
        [
          { in: "arr = [1,2,3,4]", out: "6", note: "`[1]`, `[1,2]`, `[2,3]`, `[2,3,4]`, `[3]` and `[3,4]`." },
          { in: "arr = [2,4,6]", out: "0" },
          { in: "arr = [7]", out: "1" },
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i] <= 100"]),
      hints: [
        "A subarray sum is a difference of two prefix sums.",
        "The difference of two integers is odd exactly when one is odd and the other is even.",
        "Walk the prefix sums keeping how many so far were even (the empty prefix counts as even) and how many were odd; each new prefix pairs with all earlier prefixes of the opposite parity.",
      ],
      editorial: explain({
        idea: "Subarray `arr[l..r]` has sum `P[r+1] - P[l]`, which is odd exactly when the two prefix sums have different parity — so count opposite-parity pairs of prefixes.",
        steps: [
          "Start with `even = 1` (the empty prefix, sum 0) and `odd = 0`.",
          "Scan the array maintaining the parity of the running prefix sum.",
          "If the current prefix is odd, add `even` to the answer and increment `odd`; otherwise add `odd` and increment `even`.",
          "Keep the answer reduced modulo `10^9 + 7`.",
        ],
        why: "Each subarray corresponds to exactly one pair of prefix positions `l < r + 1`, and its sum is odd iff those prefixes differ in parity. At step `r` the counters hold the parities of all earlier prefixes, so every odd-sum subarray ending at `r` is counted once.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the empty prefix misses every odd subarray that starts at index 0.",
          "Only parity matters — keeping full prefix sums is unnecessary.",
          "The count is about n^2 / 4 at most, which overflows 32 bits for large `n` — reduce as you go.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "6" },
        { input: "[2,4,6]", expectedOutput: "0" },
        { input: "[7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 11, 60), ri(rng, 11, 60)]);
        const mode = ri(rng, 0, 7);
        let arr: number[];
        if (mode <= 2) arr = Array.from({ length: n }, () => ri(rng, 1, 100));
        else if (mode <= 4) arr = Array.from({ length: n }, () => ri(rng, 1, 2));
        else if (mode === 5) arr = Array.from({ length: n }, () => 2 * ri(rng, 1, 50));
        else arr = Array.from({ length: n }, () => (rng() < 0.7 ? 2 * ri(rng, 1, 50) : 2 * ri(rng, 0, 49) + 1));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numOfSubarrays(arr: List[int]) -> int:
              MOD = 10 ** 9 + 7
              even, odd = 1, 0
              parity = 0
              ans = 0
              for a in arr:
                  parity ^= a & 1
                  if parity:
                      ans += even
                      odd += 1
                  else:
                      ans += odd
                      even += 1
              return ans % MOD
        `,
        javascript: code`
          var numOfSubarrays = function(arr) {
              var MOD = 1000000007;
              var even = 1, odd = 0, parity = 0, ans = 0;
              for (var i = 0; i < arr.length; i++) {
                  parity ^= arr[i] & 1;
                  if (parity === 1) {
                      ans = (ans + even) % MOD;
                      odd++;
                  } else {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function numOfSubarrays(arr: number[]): number {
              var MOD = 1000000007;
              var even = 1, odd = 0, parity = 0, ans = 0;
              for (var i = 0; i < arr.length; i++) {
                  parity ^= arr[i] & 1;
                  if (parity === 1) {
                      ans = (ans + even) % MOD;
                      odd++;
                  } else {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int numOfSubarrays(int[] arr) {
              final int MOD = 1000000007;
              int even = 1, odd = 0, parity = 0, ans = 0;
              for (int a : arr) {
                  parity ^= a & 1;
                  if (parity == 1) {
                      ans = (ans + even) % MOD;
                      odd++;
                  } else {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int numOfSubarrays(vector<int>& arr) {
              const int MOD = 1000000007;
              int even = 1, odd = 0, parity = 0, ans = 0;
              for (int a : arr) {
                  parity ^= a & 1;
                  if (parity == 1) {
                      ans = (ans + even) % MOD;
                      odd++;
                  } else {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          }
        `,
        c: code`
          int numOfSubarrays(int* arr, int arrSize) {
              const int MOD = 1000000007;
              int even = 1, odd = 0, parity = 0, ans = 0;
              for (int i = 0; i < arrSize; i++) {
                  parity ^= arr[i] & 1;
                  if (parity == 1) {
                      ans = (ans + even) % MOD;
                      odd++;
                  } else {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          }
        `,
        csharp: code`
          public static int NumOfSubarrays(int[] arr)
          {
              const int MOD = 1000000007;
              int even = 1, odd = 0, parity = 0, ans = 0;
              foreach (var a in arr)
              {
                  parity ^= a & 1;
                  if (parity == 1)
                  {
                      ans = (ans + even) % MOD;
                      odd++;
                  }
                  else
                  {
                      ans = (ans + odd) % MOD;
                      even++;
                  }
              }
              return ans;
          }
        `,
        go: code`
          func numOfSubarrays(arr []int) int {
              const MOD = 1000000007
              even, odd, parity, ans := 1, 0, 0, 0
              for _, a := range arr {
                  parity ^= a & 1
                  if parity == 1 {
                      ans = (ans + even) % MOD
                      odd++
                  } else {
                      ans = (ans + odd) % MOD
                      even++
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun numOfSubarrays(arr: IntArray): Int {
              val MOD = 1000000007
              var even = 1
              var odd = 0
              var parity = 0
              var ans = 0
              for (a in arr) {
                  parity = parity xor (a and 1)
                  if (parity == 1) {
                      ans = (ans + even) % MOD
                      odd++
                  } else {
                      ans = (ans + odd) % MOD
                      even++
                  }
              }
              return ans
          }
        `,
        swift: code`
          func numOfSubarrays(_ arr: [Int]) -> Int {
              let MOD = 1000000007
              var even = 1
              var odd = 0
              var parity = 0
              var ans = 0
              for a in arr {
                  parity ^= a & 1
                  if parity == 1 {
                      ans = (ans + even) % MOD
                      odd += 1
                  } else {
                      ans = (ans + odd) % MOD
                      even += 1
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn numOfSubarrays(arr: Vec<i32>) -> i32 {
              let modulus: i32 = 1_000_000_007;
              let mut even: i32 = 1;
              let mut odd: i32 = 0;
              let mut parity = 0;
              let mut ans: i32 = 0;
              for &a in arr.iter() {
                  parity ^= a & 1;
                  if parity == 1 {
                      ans = (ans + even) % modulus;
                      odd += 1;
                  } else {
                      ans = (ans + odd) % modulus;
                      even += 1;
                  }
              }
              ans
          }
        `,
        php: code`
          function numOfSubarrays($arr) {
              $MOD = 1000000007;
              $even = 1;
              $odd = 0;
              $parity = 0;
              $ans = 0;
              foreach ($arr as $a) {
                  $parity ^= $a & 1;
                  if ($parity == 1) {
                      $ans = ($ans + $even) % $MOD;
                      $odd++;
                  } else {
                      $ans = ($ans + $odd) % $MOD;
                      $even++;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def numOfSubarrays(arr)
            mod = 1_000_000_007
            even = 1
            odd = 0
            parity = 0
            ans = 0
            arr.each do |a|
              parity ^= a & 1
              if parity == 1
                ans = (ans + even) % mod
                odd += 1
              else
                ans = (ans + odd) % mod
                even += 1
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Make Sum Divisible by P (LC 1590) ───────────────────────────
  (() => {
    const ref = (nums: number[], p: number) => {
      const n = nums.length;
      const pre = [0];
      for (let i = 0; i < n; i++) pre.push((pre[i] + nums[i]) % p);
      if (pre[n] === 0) return 0;
      let best = -1;
      for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
          if (l === 0 && r === n - 1) continue;
          const removed = ((pre[r + 1] - pre[l]) % p + p) % p;
          if (removed === pre[n] && (best === -1 || r - l + 1 < best)) best = r - l + 1;
        }
      }
      return best;
    };
    return {
      slug: "make-sum-divisible-by-p",
      title: "Make Sum Divisible by P",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "minSubarray",
        params: [{ name: "nums", type: "int[]" as const }, { name: "p", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an array of positive integers `nums` and an integer `p`, remove the **smallest** contiguous subarray (possibly empty) so that the sum of the remaining elements is divisible by `p`. You may **not** remove the whole array.\n\nReturn the length of the subarray to remove, or `-1` if it cannot be done.",
        [
          { in: "nums = [3,2,4], p = 6", out: "1", note: "The total is 9; removing `[3]` leaves 6." },
          { in: "nums = [1,2,3], p = 7", out: "-1", note: "The total is 6, and no proper subarray has a sum of 6 modulo 7." },
          { in: "nums = [5,3,6,2], p = 4", out: "0", note: "The total 16 is already divisible by 4." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9", "1 <= p <= 10^9"]),
      hints: [
        "Let `need = sum(nums) % p`. You must remove a subarray whose sum is congruent to `need` modulo `p`.",
        "With prefix sums mod `p`, a subarray `(l, r]` has sum `need` (mod p) when `prefix[l] == (prefix[r] - need) mod p`.",
        "Sweep `r` from left to right, remembering the latest index at which each prefix remainder occurred; the latest one gives the shortest subarray ending at `r`.",
      ],
      editorial: explain({
        idea: "Removing a subarray fixes the total exactly when the subarray's sum leaves the same remainder as the whole array — a prefix-sum-plus-hash-map search for the shortest such subarray.",
        steps: [
          "Compute `need = total % p`. If it is 0, return 0.",
          "Store `last[0] = -1` (the empty prefix).",
          "For each index `i`, update the running prefix `cur = (cur + nums[i]) % p` and look up `want = (cur - need + p) % p`.",
          "If `want` was seen at index `j`, the subarray `j+1..i` works; record `i - j` if shorter. Then set `last[cur] = i`.",
          "If the best length equals `n` (the whole array) or nothing was found, return -1.",
        ],
        why: "The remaining sum is `total - sum(sub)`, divisible by `p` iff `sum(sub) ≡ need (mod p)`. For a subarray ending at `i`, that means its starting prefix remainder is `want`; the latest such prefix yields the shortest candidate, and overwriting `last[cur]` keeps exactly that.",
        time: "O(n)",
        space: "O(min(n, p))",
        pitfalls: [
          "The total can reach 10^14 — reduce modulo `p` while summing (or use 64-bit integers).",
          "In languages where `%` keeps the sign of the dividend, add `p` before taking `(cur - need) % p`.",
          "Removing the whole array is forbidden, so a best length of `n` means -1.",
        ],
      }),
      examples: [
        { input: "[3,2,4]\n6", expectedOutput: "1" },
        { input: "[1,2,3]\n7", expectedOutput: "-1" },
        { input: "[5,3,6,2]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 30), ri(rng, 9, 30)]);
        const mode = ri(rng, 0, 4);
        let nums: number[], p: number;
        if (mode === 0) { nums = Array.from({ length: n }, () => ri(rng, 1, 20)); p = ri(rng, 1, 12); }
        else if (mode === 1) { nums = Array.from({ length: n }, () => ri(rng, 1, 1000000000)); p = ri(rng, 1, 1000); }
        else if (mode === 2) { nums = Array.from({ length: n }, () => ri(rng, 1, 50)); p = ri(rng, 20, 200); }
        else {
          // Solvable by construction: pick a proper subarray to remove, then nudge one
          // element outside it so the rest is divisible by p.
          const big = mode === 4;
          nums = Array.from({ length: n }, () => ri(rng, 1, big ? 1000000000 : 60));
          p = big ? ri(rng, 2, 1000000000) : ri(rng, 2, 100);
          if (n >= 2) {
            const l = ri(rng, 0, n - 1);
            const r = ri(rng, l, l === 0 ? n - 2 : n - 1);
            let rest = 0;
            for (let i = 0; i < n; i++) if (i < l || i > r) rest = (rest + nums[i]) % p;
            const outside: number[] = [];
            for (let i = 0; i < n; i++) if (i < l || i > r) outside.push(i);
            const j = pick(rng, outside);
            if (nums[j] - rest >= 1) nums[j] -= rest;
            else nums[j] += p - rest;
          }
        }
        return { input: `${fmtIntArr(nums)}\n${p}`, expectedOutput: String(ref(nums, p)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSubarray(nums: List[int], p: int) -> int:
              need = sum(nums) % p
              if need == 0:
                  return 0
              last = {0: -1}
              cur = 0
              n = len(nums)
              best = n
              for i, v in enumerate(nums):
                  cur = (cur + v) % p
                  want = (cur - need) % p
                  if want in last:
                      best = min(best, i - last[want])
                  last[cur] = i
              return -1 if best == n else best
        `,
        javascript: code`
          var minSubarray = function(nums, p) {
              var n = nums.length;
              var need = 0;
              for (var i = 0; i < n; i++) need = (need + nums[i]) % p;
              if (need === 0) return 0;
              var last = new Map();
              last.set(0, -1);
              var cur = 0, best = n;
              for (var j = 0; j < n; j++) {
                  cur = (cur + nums[j]) % p;
                  var want = (cur - need + p) % p;
                  if (last.has(want)) best = Math.min(best, j - last.get(want));
                  last.set(cur, j);
              }
              return best === n ? -1 : best;
          };
        `,
        typescript: code`
          function minSubarray(nums: number[], p: number): number {
              var n = nums.length;
              var need = 0;
              for (var i = 0; i < n; i++) need = (need + nums[i]) % p;
              if (need === 0) return 0;
              var last: { [k: string]: number } = {};
              last["0"] = -1;
              var cur = 0, best = n;
              for (var j = 0; j < n; j++) {
                  cur = (cur + nums[j]) % p;
                  var want = (cur - need + p) % p;
                  var seen = last["" + want];
                  if (seen !== undefined) best = Math.min(best, j - seen);
                  last["" + cur] = j;
              }
              return best === n ? -1 : best;
          }
        `,
        java: code`
          public static int minSubarray(int[] nums, int p) {
              int n = nums.length;
              long need = 0;
              for (int v : nums) need = (need + v) % p;
              if (need == 0) return 0;
              Map<Long, Integer> last = new HashMap<>();
              last.put(0L, -1);
              long cur = 0;
              int best = n;
              for (int i = 0; i < n; i++) {
                  cur = (cur + nums[i]) % p;
                  long want = (cur - need + p) % p;
                  Integer j = last.get(want);
                  if (j != null) best = Math.min(best, i - j);
                  last.put(cur, i);
              }
              return best == n ? -1 : best;
          }
        `,
        cpp: code`
          int minSubarray(vector<int>& nums, int p) {
              int n = nums.size();
              long long need = 0;
              for (int v : nums) need = (need + v) % p;
              if (need == 0) return 0;
              unordered_map<long long, int> last;
              last[0] = -1;
              long long cur = 0;
              int best = n;
              for (int i = 0; i < n; i++) {
                  cur = (cur + nums[i]) % p;
                  long long want = (cur - need + p) % p;
                  auto it = last.find(want);
                  if (it != last.end()) best = min(best, i - it->second);
                  last[cur] = i;
              }
              return best == n ? -1 : best;
          }
        `,
        c: code`
          static int slot1590(int* keys, char* used, int cap, int key) {
              unsigned int mask = (unsigned int)(cap - 1);
              unsigned int h = ((unsigned int)key * 2654435761u) & mask;
              while (used[h] && keys[h] != key) h = (h + 1) & mask;
              return (int)h;
          }

          int minSubarray(int* nums, int numsSize, int p) {
              int n = numsSize;
              long long need = 0;
              for (int i = 0; i < n; i++) need = (need + nums[i]) % p;
              if (need == 0) return 0;
              int cap = 1;
              while (cap < 2 * n + 4) cap <<= 1;
              int* keys = (int*)malloc(sizeof(int) * cap);
              int* vals = (int*)malloc(sizeof(int) * cap);
              char* used = (char*)calloc(cap, 1);
              int s = slot1590(keys, used, cap, 0);
              used[s] = 1;
              keys[s] = 0;
              vals[s] = -1;
              long long cur = 0;
              int best = n;
              for (int i = 0; i < n; i++) {
                  cur = (cur + nums[i]) % p;
                  int want = (int)((cur - need + p) % p);
                  int w = slot1590(keys, used, cap, want);
                  if (used[w] && i - vals[w] < best) best = i - vals[w];
                  int c = slot1590(keys, used, cap, (int)cur);
                  used[c] = 1;
                  keys[c] = (int)cur;
                  vals[c] = i;
              }
              free(keys);
              free(vals);
              free(used);
              return best == n ? -1 : best;
          }
        `,
        csharp: code`
          public static int MinSubarray(int[] nums, int p)
          {
              int n = nums.Length;
              long need = 0;
              foreach (var v in nums) need = (need + v) % p;
              if (need == 0) return 0;
              var last = new Dictionary<long, int>();
              last[0] = -1;
              long cur = 0;
              int best = n;
              for (int i = 0; i < n; i++)
              {
                  cur = (cur + nums[i]) % p;
                  long want = (cur - need + p) % p;
                  if (last.TryGetValue(want, out int j)) best = Math.Min(best, i - j);
                  last[cur] = i;
              }
              return best == n ? -1 : best;
          }
        `,
        go: code`
          func minSubarray(nums []int, p int) int {
              n := len(nums)
              need := 0
              for _, v := range nums {
                  need = (need + v) % p
              }
              if need == 0 {
                  return 0
              }
              last := map[int]int{0: -1}
              cur, best := 0, n
              for i, v := range nums {
                  cur = (cur + v) % p
                  want := (cur - need + p) % p
                  if j, ok := last[want]; ok && i-j < best {
                      best = i - j
                  }
                  last[cur] = i
              }
              if best == n {
                  return -1
              }
              return best
          }
        `,
        kotlin: code`
          fun minSubarray(nums: IntArray, p: Int): Int {
              val n = nums.size
              var need = 0L
              for (v in nums) need = (need + v) % p
              if (need == 0L) return 0
              val last = HashMap<Long, Int>()
              last[0L] = -1
              var cur = 0L
              var best = n
              for (i in 0 until n) {
                  cur = (cur + nums[i]) % p
                  val want = (cur - need + p) % p
                  val j = last[want]
                  if (j != null && i - j < best) best = i - j
                  last[cur] = i
              }
              return if (best == n) -1 else best
          }
        `,
        swift: code`
          func minSubarray(_ nums: [Int], _ p: Int) -> Int {
              let n = nums.count
              var need = 0
              for v in nums { need = (need + v) % p }
              if need == 0 { return 0 }
              var last: [Int: Int] = [0: -1]
              var cur = 0
              var best = n
              for i in 0..<n {
                  cur = (cur + nums[i]) % p
                  let want = (cur - need + p) % p
                  if let j = last[want], i - j < best { best = i - j }
                  last[cur] = i
              }
              return best == n ? -1 : best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minSubarray(nums: Vec<i32>, p: i32) -> i32 {
              let n = nums.len() as i64;
              let pm = p as i64;
              let mut need: i64 = 0;
              for &v in nums.iter() {
                  need = (need + v as i64) % pm;
              }
              if need == 0 {
                  return 0;
              }
              let mut last: HashMap<i64, i64> = HashMap::new();
              last.insert(0, -1);
              let mut cur: i64 = 0;
              let mut best = n;
              for (i, &v) in nums.iter().enumerate() {
                  let idx = i as i64;
                  cur = (cur + v as i64) % pm;
                  let want = (cur - need + pm) % pm;
                  if let Some(&j) = last.get(&want) {
                      if idx - j < best {
                          best = idx - j;
                      }
                  }
                  last.insert(cur, idx);
              }
              if best == n { -1 } else { best as i32 }
          }
        `,
        php: code`
          function minSubarray($nums, $p) {
              $n = count($nums);
              $need = 0;
              foreach ($nums as $v) $need = ($need + $v) % $p;
              if ($need == 0) return 0;
              $last = [0 => -1];
              $cur = 0;
              $best = $n;
              for ($i = 0; $i < $n; $i++) {
                  $cur = ($cur + $nums[$i]) % $p;
                  $want = ($cur - $need + $p) % $p;
                  if (isset($last[$want]) && $i - $last[$want] < $best) $best = $i - $last[$want];
                  $last[$cur] = $i;
              }
              return $best == $n ? -1 : $best;
          }
        `,
        ruby: code`
          def minSubarray(nums, p)
            n = nums.length
            need = nums.sum % p
            return 0 if need == 0
            last = { 0 => -1 }
            cur = 0
            best = n
            nums.each_with_index do |v, i|
              cur = (cur + v) % p
              want = (cur - need) % p
              j = last[want]
              best = i - j if !j.nil? && i - j < best
              last[cur] = i
            end
            best == n ? -1 : best
          end
        `,
      },
    };
  })(),

  // ── Ways to Make a Fair Array (LC 1664) ─────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let ways = 0;
      for (let i = 0; i < nums.length; i++) {
        const rest = nums.slice(0, i).concat(nums.slice(i + 1));
        let e = 0, o = 0;
        for (let j = 0; j < rest.length; j++) { if (j % 2 === 0) e += rest[j]; else o += rest[j]; }
        if (e === o) ways++;
      }
      return ways;
    };
    return {
      slug: "ways-to-make-a-fair-array",
      title: "Ways to Make a Fair Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "waysToMakeFair", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You will delete **exactly one** element of `nums`; the elements after it shift one place to the left, so their indices change parity.\n\nAn array is **fair** if the sum of its even-indexed elements equals the sum of its odd-indexed elements.\n\nReturn the number of indices whose removal leaves a fair array.",
        [
          { in: "nums = [1,2,1,2,2]", out: "1", note: "Removing index 1 leaves `[1,1,2,2]`: even positions sum to 3 and odd positions to 3." },
          { in: "nums = [4,4,4,4,4]", out: "5", note: "Any removal leaves four 4s, split 8 and 8." },
          { in: "nums = [7]", out: "1", note: "Removing the only element leaves an empty array, where both sums are 0." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"]),
      hints: [
        "Removing index `i` leaves the elements before `i` where they were, and flips the parity of every element after `i`.",
        "Keep prefix sums of the even-indexed and odd-indexed elements.",
        "After removing `i`: new even sum = (even sum before `i`) + (odd sum after `i`), and new odd sum = (odd sum before `i`) + (even sum after `i`).",
      ],
      editorial: explain({
        idea: "Deleting index `i` swaps the roles of even and odd positions to its right, so the new sums are prefix sums on the left combined with crossed suffix sums on the right.",
        steps: [
          "Compute `totalEven` and `totalOdd`, the sums over even and odd indices.",
          "Sweep `i` from left to right with `leftEven` and `leftOdd` covering indices `< i`.",
          "The right side (indices `> i`) has `rightEven = totalEven - leftEven - (nums[i] if i is even)` and `rightOdd` likewise.",
          "Index `i` works if `leftEven + rightOdd == leftOdd + rightEven`; then add `nums[i]` to the matching left sum.",
        ],
        why: "Elements left of `i` keep their indices; each element right of `i` moves one place left, so even becomes odd and vice versa. The two expressions are exactly the even and odd sums of the array after deletion.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Recomputing the sums for each removal is O(n^2).",
          "Exclude `nums[i]` itself from the right-side sums.",
          "A single-element array counts as one way: the empty array is fair.",
        ],
      }),
      examples: [
        { input: "[1,2,1,2,2]", expectedOutput: "1" },
        { input: "[4,4,4,4,4]", expectedOutput: "5" },
        { input: "[7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const mode = ri(rng, 0, 5);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, 1, 2));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 1, 4));
        else if (mode === 2) { const v = ri(rng, 1, 10000); nums = Array.from({ length: n }, () => v); }
        else nums = Array.from({ length: n }, () => ri(rng, 1, mode === 3 ? 10000 : 50));
        if (mode >= 4 && n >= 3) {
          // Balance the array left after deleting one chosen index by raising one element.
          const del = ri(rng, 0, n - 1);
          let even = 0, odd = 0;
          const evenPos: number[] = [], oddPos: number[] = [];
          for (let i = 0, pos = 0; i < n; i++) {
            if (i === del) continue;
            if (pos % 2 === 0) { even += nums[i]; evenPos.push(i); } else { odd += nums[i]; oddPos.push(i); }
            pos++;
          }
          const j = even < odd ? pick(rng, evenPos) : pick(rng, oddPos);
          const v = nums[j] + Math.abs(even - odd);
          if (v <= 10000) nums[j] = v;
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def waysToMakeFair(nums: List[int]) -> int:
              total_even = sum(nums[0::2])
              total_odd = sum(nums[1::2])
              left_even = left_odd = 0
              ways = 0
              for i, v in enumerate(nums):
                  right_even = total_even - left_even - (v if i % 2 == 0 else 0)
                  right_odd = total_odd - left_odd - (v if i % 2 == 1 else 0)
                  if left_even + right_odd == left_odd + right_even:
                      ways += 1
                  if i % 2 == 0:
                      left_even += v
                  else:
                      left_odd += v
              return ways
        `,
        javascript: code`
          var waysToMakeFair = function(nums) {
              var totalEven = 0, totalOdd = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (i % 2 === 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              var leftEven = 0, leftOdd = 0, ways = 0;
              for (var j = 0; j < nums.length; j++) {
                  var rightEven = totalEven - leftEven - (j % 2 === 0 ? nums[j] : 0);
                  var rightOdd = totalOdd - leftOdd - (j % 2 === 1 ? nums[j] : 0);
                  if (leftEven + rightOdd === leftOdd + rightEven) ways++;
                  if (j % 2 === 0) leftEven += nums[j]; else leftOdd += nums[j];
              }
              return ways;
          };
        `,
        typescript: code`
          function waysToMakeFair(nums: number[]): number {
              var totalEven = 0, totalOdd = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (i % 2 === 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              var leftEven = 0, leftOdd = 0, ways = 0;
              for (var j = 0; j < nums.length; j++) {
                  var rightEven = totalEven - leftEven - (j % 2 === 0 ? nums[j] : 0);
                  var rightOdd = totalOdd - leftOdd - (j % 2 === 1 ? nums[j] : 0);
                  if (leftEven + rightOdd === leftOdd + rightEven) ways++;
                  if (j % 2 === 0) leftEven += nums[j]; else leftOdd += nums[j];
              }
              return ways;
          }
        `,
        java: code`
          public static int waysToMakeFair(int[] nums) {
              int totalEven = 0, totalOdd = 0;
              for (int i = 0; i < nums.length; i++) {
                  if (i % 2 == 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              int leftEven = 0, leftOdd = 0, ways = 0;
              for (int i = 0; i < nums.length; i++) {
                  int rightEven = totalEven - leftEven - (i % 2 == 0 ? nums[i] : 0);
                  int rightOdd = totalOdd - leftOdd - (i % 2 == 1 ? nums[i] : 0);
                  if (leftEven + rightOdd == leftOdd + rightEven) ways++;
                  if (i % 2 == 0) leftEven += nums[i]; else leftOdd += nums[i];
              }
              return ways;
          }
        `,
        cpp: code`
          int waysToMakeFair(vector<int>& nums) {
              int n = nums.size();
              int totalEven = 0, totalOdd = 0;
              for (int i = 0; i < n; i++) {
                  if (i % 2 == 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              int leftEven = 0, leftOdd = 0, ways = 0;
              for (int i = 0; i < n; i++) {
                  int rightEven = totalEven - leftEven - (i % 2 == 0 ? nums[i] : 0);
                  int rightOdd = totalOdd - leftOdd - (i % 2 == 1 ? nums[i] : 0);
                  if (leftEven + rightOdd == leftOdd + rightEven) ways++;
                  if (i % 2 == 0) leftEven += nums[i]; else leftOdd += nums[i];
              }
              return ways;
          }
        `,
        c: code`
          int waysToMakeFair(int* nums, int numsSize) {
              int totalEven = 0, totalOdd = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (i % 2 == 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              int leftEven = 0, leftOdd = 0, ways = 0;
              for (int i = 0; i < numsSize; i++) {
                  int rightEven = totalEven - leftEven - (i % 2 == 0 ? nums[i] : 0);
                  int rightOdd = totalOdd - leftOdd - (i % 2 == 1 ? nums[i] : 0);
                  if (leftEven + rightOdd == leftOdd + rightEven) ways++;
                  if (i % 2 == 0) leftEven += nums[i]; else leftOdd += nums[i];
              }
              return ways;
          }
        `,
        csharp: code`
          public static int WaysToMakeFair(int[] nums)
          {
              int n = nums.Length;
              int totalEven = 0, totalOdd = 0;
              for (int i = 0; i < n; i++)
              {
                  if (i % 2 == 0) totalEven += nums[i]; else totalOdd += nums[i];
              }
              int leftEven = 0, leftOdd = 0, ways = 0;
              for (int i = 0; i < n; i++)
              {
                  int rightEven = totalEven - leftEven - (i % 2 == 0 ? nums[i] : 0);
                  int rightOdd = totalOdd - leftOdd - (i % 2 == 1 ? nums[i] : 0);
                  if (leftEven + rightOdd == leftOdd + rightEven) ways++;
                  if (i % 2 == 0) leftEven += nums[i]; else leftOdd += nums[i];
              }
              return ways;
          }
        `,
        go: code`
          func waysToMakeFair(nums []int) int {
              totalEven, totalOdd := 0, 0
              for i, v := range nums {
                  if i%2 == 0 {
                      totalEven += v
                  } else {
                      totalOdd += v
                  }
              }
              leftEven, leftOdd, ways := 0, 0, 0
              for i, v := range nums {
                  rightEven, rightOdd := totalEven-leftEven, totalOdd-leftOdd
                  if i%2 == 0 {
                      rightEven -= v
                  } else {
                      rightOdd -= v
                  }
                  if leftEven+rightOdd == leftOdd+rightEven {
                      ways++
                  }
                  if i%2 == 0 {
                      leftEven += v
                  } else {
                      leftOdd += v
                  }
              }
              return ways
          }
        `,
        kotlin: code`
          fun waysToMakeFair(nums: IntArray): Int {
              var totalEven = 0
              var totalOdd = 0
              for (i in nums.indices) {
                  if (i % 2 == 0) totalEven += nums[i] else totalOdd += nums[i]
              }
              var leftEven = 0
              var leftOdd = 0
              var ways = 0
              for (i in nums.indices) {
                  val rightEven = totalEven - leftEven - (if (i % 2 == 0) nums[i] else 0)
                  val rightOdd = totalOdd - leftOdd - (if (i % 2 == 1) nums[i] else 0)
                  if (leftEven + rightOdd == leftOdd + rightEven) ways++
                  if (i % 2 == 0) leftEven += nums[i] else leftOdd += nums[i]
              }
              return ways
          }
        `,
        swift: code`
          func waysToMakeFair(_ nums: [Int]) -> Int {
              var totalEven = 0
              var totalOdd = 0
              for i in 0..<nums.count {
                  if i % 2 == 0 { totalEven += nums[i] } else { totalOdd += nums[i] }
              }
              var leftEven = 0
              var leftOdd = 0
              var ways = 0
              for i in 0..<nums.count {
                  let rightEven = totalEven - leftEven - (i % 2 == 0 ? nums[i] : 0)
                  let rightOdd = totalOdd - leftOdd - (i % 2 == 1 ? nums[i] : 0)
                  if leftEven + rightOdd == leftOdd + rightEven { ways += 1 }
                  if i % 2 == 0 { leftEven += nums[i] } else { leftOdd += nums[i] }
              }
              return ways
          }
        `,
        rust: code`
          fn waysToMakeFair(nums: Vec<i32>) -> i32 {
              let mut total_even = 0;
              let mut total_odd = 0;
              for (i, &v) in nums.iter().enumerate() {
                  if i % 2 == 0 {
                      total_even += v;
                  } else {
                      total_odd += v;
                  }
              }
              let mut left_even = 0;
              let mut left_odd = 0;
              let mut ways = 0;
              for (i, &v) in nums.iter().enumerate() {
                  let right_even = total_even - left_even - if i % 2 == 0 { v } else { 0 };
                  let right_odd = total_odd - left_odd - if i % 2 == 1 { v } else { 0 };
                  if left_even + right_odd == left_odd + right_even {
                      ways += 1;
                  }
                  if i % 2 == 0 {
                      left_even += v;
                  } else {
                      left_odd += v;
                  }
              }
              ways
          }
        `,
        php: code`
          function waysToMakeFair($nums) {
              $n = count($nums);
              $totalEven = 0;
              $totalOdd = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($i % 2 == 0) $totalEven += $nums[$i]; else $totalOdd += $nums[$i];
              }
              $leftEven = 0;
              $leftOdd = 0;
              $ways = 0;
              for ($i = 0; $i < $n; $i++) {
                  $rightEven = $totalEven - $leftEven - ($i % 2 == 0 ? $nums[$i] : 0);
                  $rightOdd = $totalOdd - $leftOdd - ($i % 2 == 1 ? $nums[$i] : 0);
                  if ($leftEven + $rightOdd == $leftOdd + $rightEven) $ways++;
                  if ($i % 2 == 0) $leftEven += $nums[$i]; else $leftOdd += $nums[$i];
              }
              return $ways;
          }
        `,
        ruby: code`
          def waysToMakeFair(nums)
            total_even = 0
            total_odd = 0
            nums.each_with_index do |v, i|
              if i.even?
                total_even += v
              else
                total_odd += v
              end
            end
            left_even = 0
            left_odd = 0
            ways = 0
            nums.each_with_index do |v, i|
              right_even = total_even - left_even - (i.even? ? v : 0)
              right_odd = total_odd - left_odd - (i.odd? ? v : 0)
              ways += 1 if left_even + right_odd == left_odd + right_even
              if i.even?
                left_even += v
              else
                left_odd += v
              end
            end
            ways
          end
        `,
      },
    };
  })(),

  // ── Sum of Absolute Differences in a Sorted Array (LC 1685) ─────
  (() => {
    const ref = (nums: number[]) => nums.map((x) => {
      let s = 0;
      for (const y of nums) s += Math.abs(x - y);
      return s;
    });
    return {
      slug: "sum-of-absolute-differences-in-a-sorted-array",
      title: "Sum of Absolute Differences in a Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "getSumAbsoluteDifferences", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "`nums` is sorted in **non-decreasing** order.\n\nReturn an array `result` of the same length where `result[i]` is the sum of `|nums[i] - nums[j]|` over every index `j` of the array (the term for `j = i` is zero).",
        [
          { in: "nums = [2,5,9]", out: "[10,7,11]", note: "`result[1] = |5-2| + |5-5| + |5-9| = 3 + 0 + 4 = 7`." },
          { in: "nums = [1,1,4]", out: "[3,3,6]" },
          { in: "nums = [7,7]", out: "[0,0]" },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= nums[i + 1] <= 10^4"]),
      hints: [
        "Because the array is sorted, every element left of `i` is at most `nums[i]` and every element right of it is at least `nums[i]`.",
        "So the left part contributes `nums[i] * i - (sum of the left elements)` and the right part `(sum of the right elements) - nums[i] * (count on the right)`.",
        "Keep a running prefix sum and the total; each `result[i]` is then O(1).",
      ],
      editorial: explain({
        idea: "Sorting removes the absolute values: to the left of `i` every difference is `nums[i] - nums[j]`, to the right it is `nums[j] - nums[i]`, and both sides collapse into prefix-sum formulas.",
        steps: [
          "Compute `total`, the sum of all elements, and sweep `i` with `left`, the sum of `nums[0..i-1]`.",
          "`right = total - left - nums[i]` is the sum of `nums[i+1..n-1]`.",
          "`result[i] = nums[i] * i - left + right - nums[i] * (n - 1 - i)`.",
          "Add `nums[i]` to `left` and continue.",
        ],
        why: "For `j < i`, `nums[j] <= nums[i]`, so `|nums[i] - nums[j]| = nums[i] - nums[j]`; summing over the `i` such indices gives `nums[i] * i - left`. The right side is symmetric. Together they are exactly the requested sum.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "The double loop is O(n^2) — too slow for 10^5 elements.",
          "Mind the counts: `i` elements on the left, `n - 1 - i` on the right.",
          "Each result is at most about 10^9 here, which fits in 32 bits; use 64-bit intermediates if the bounds grow.",
        ],
      }),
      examples: [
        { input: "[2,5,9]", expectedOutput: "[10,7,11]" },
        { input: "[1,1,4]", expectedOutput: "[3,3,6]" },
        { input: "[7,7]", expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const hi = pick(rng, [1, 5, 100, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi)).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getSumAbsoluteDifferences(nums: List[int]) -> List[int]:
              n = len(nums)
              total = sum(nums)
              left = 0
              result = []
              for i, x in enumerate(nums):
                  right = total - left - x
                  result.append(x * i - left + right - x * (n - 1 - i))
                  left += x
              return result
        `,
        javascript: code`
          var getSumAbsoluteDifferences = function(nums) {
              var n = nums.length, total = 0, left = 0;
              for (var i = 0; i < n; i++) total += nums[i];
              var result = new Array(n);
              for (var j = 0; j < n; j++) {
                  var x = nums[j];
                  var right = total - left - x;
                  result[j] = x * j - left + right - x * (n - 1 - j);
                  left += x;
              }
              return result;
          };
        `,
        typescript: code`
          function getSumAbsoluteDifferences(nums: number[]): number[] {
              var n = nums.length, total = 0, left = 0;
              for (var i = 0; i < n; i++) total += nums[i];
              var result: number[] = [];
              for (var j = 0; j < n; j++) {
                  var x = nums[j];
                  var right = total - left - x;
                  result.push(x * j - left + right - x * (n - 1 - j));
                  left += x;
              }
              return result;
          }
        `,
        java: code`
          public static int[] getSumAbsoluteDifferences(int[] nums) {
              int n = nums.length;
              long total = 0, left = 0;
              for (int v : nums) total += v;
              int[] result = new int[n];
              for (int i = 0; i < n; i++) {
                  long x = nums[i];
                  long right = total - left - x;
                  result[i] = (int) (x * i - left + right - x * (n - 1 - i));
                  left += x;
              }
              return result;
          }
        `,
        cpp: code`
          vector<int> getSumAbsoluteDifferences(vector<int>& nums) {
              int n = nums.size();
              long long total = 0, left = 0;
              for (int v : nums) total += v;
              vector<int> result(n);
              for (int i = 0; i < n; i++) {
                  long long x = nums[i];
                  long long right = total - left - x;
                  result[i] = (int)(x * i - left + right - x * (n - 1 - i));
                  left += x;
              }
              return result;
          }
        `,
        c: code`
          int* getSumAbsoluteDifferences(int* nums, int numsSize, int* returnSize) {
              int n = numsSize;
              long long total = 0, left = 0;
              for (int i = 0; i < n; i++) total += nums[i];
              int* result = (int*)malloc(sizeof(int) * (n + 1));
              for (int i = 0; i < n; i++) {
                  long long x = nums[i];
                  long long right = total - left - x;
                  result[i] = (int)(x * i - left + right - x * (n - 1 - i));
                  left += x;
              }
              *returnSize = n;
              return result;
          }
        `,
        csharp: code`
          public static int[] GetSumAbsoluteDifferences(int[] nums)
          {
              int n = nums.Length;
              long total = 0, left = 0;
              foreach (var v in nums) total += v;
              var result = new int[n];
              for (int i = 0; i < n; i++)
              {
                  long x = nums[i];
                  long right = total - left - x;
                  result[i] = (int)(x * i - left + right - x * (n - 1 - i));
                  left += x;
              }
              return result;
          }
        `,
        go: code`
          func getSumAbsoluteDifferences(nums []int) []int {
              n := len(nums)
              total, left := 0, 0
              for _, v := range nums {
                  total += v
              }
              result := make([]int, n)
              for i, x := range nums {
                  right := total - left - x
                  result[i] = x*i - left + right - x*(n-1-i)
                  left += x
              }
              return result
          }
        `,
        kotlin: code`
          fun getSumAbsoluteDifferences(nums: IntArray): IntArray {
              val n = nums.size
              var total = 0L
              var left = 0L
              for (v in nums) total += v
              val result = IntArray(n)
              for (i in 0 until n) {
                  val x = nums[i].toLong()
                  val right = total - left - x
                  result[i] = (x * i - left + right - x * (n - 1 - i)).toInt()
                  left += x
              }
              return result
          }
        `,
        swift: code`
          func getSumAbsoluteDifferences(_ nums: [Int]) -> [Int] {
              let n = nums.count
              var total = 0
              for v in nums { total += v }
              var left = 0
              var result = [Int](repeating: 0, count: n)
              for i in 0..<n {
                  let x = nums[i]
                  let right = total - left - x
                  result[i] = x * i - left + right - x * (n - 1 - i)
                  left += x
              }
              return result
          }
        `,
        rust: code`
          fn getSumAbsoluteDifferences(nums: Vec<i32>) -> Vec<i32> {
              let n = nums.len() as i64;
              let total: i64 = nums.iter().map(|&v| v as i64).sum();
              let mut left: i64 = 0;
              let mut result = Vec::with_capacity(nums.len());
              for (i, &v) in nums.iter().enumerate() {
                  let x = v as i64;
                  let idx = i as i64;
                  let right = total - left - x;
                  result.push((x * idx - left + right - x * (n - 1 - idx)) as i32);
                  left += x;
              }
              result
          }
        `,
        php: code`
          function getSumAbsoluteDifferences($nums) {
              $n = count($nums);
              $total = array_sum($nums);
              $left = 0;
              $result = [];
              for ($i = 0; $i < $n; $i++) {
                  $x = $nums[$i];
                  $right = $total - $left - $x;
                  $result[] = $x * $i - $left + $right - $x * ($n - 1 - $i);
                  $left += $x;
              }
              return $result;
          }
        `,
        ruby: code`
          def getSumAbsoluteDifferences(nums)
            n = nums.length
            total = nums.sum
            left = 0
            result = []
            nums.each_with_index do |x, i|
              right = total - left - x
              result << x * i - left + right - x * (n - 1 - i)
              left += x
            end
            result
          end
        `,
      },
    };
  })(),

  // ── Count Good Meals (LC 1711) ──────────────────────────────────
  (() => {
    const ref = (d: number[]) => {
      let count = 0;
      for (let i = 0; i < d.length; i++) {
        for (let j = i + 1; j < d.length; j++) {
          const s = d[i] + d[j];
          if (s > 0 && (s & (s - 1)) === 0) count++;
        }
      }
      return count % 1000000007;
    };
    return {
      slug: "count-good-meals",
      title: "Count Good Meals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google"],
      signature: { funcName: "countPairs", params: [{ name: "deliciousness", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`deliciousness[i]` is how tasty the `i`-th dish on the menu is. A **good meal** is a pair of two **different** dishes (different indices) whose deliciousness adds up to a power of two (`1, 2, 4, 8, ...`).\n\nReturn the number of good meals, i.e. pairs of indices `i < j` with `deliciousness[i] + deliciousness[j]` a power of two. Dishes with equal deliciousness but different indices are different dishes.\n\nReturn the count **modulo** `10^9 + 7`.",
        [
          { in: "deliciousness = [2,6,1,1]", out: "2", note: "`2 + 6 = 8` and `1 + 1 = 2`." },
          { in: "deliciousness = [0,1,0]", out: "2", note: "Each 0 pairs with the 1 to make `1 = 2^0`; `0 + 0` is not a power of two." },
          { in: "deliciousness = [4,4,12,4]", out: "6", note: "Three pairs of 4s make 8, and each 4 with 12 makes 16." },
        ],
        ["1 <= deliciousness.length <= 10^5", "0 <= deliciousness[i] <= 2^20"]),
      hints: [
        "A pair sum is at most `2^21`, so there are only 22 powers of two it could equal.",
        "For each dish, the partner it needs for power `2^p` is exactly `2^p - deliciousness[i]`.",
        "Scan left to right with a hash map of counts seen so far; for each dish add the counts of all 22 possible partners, then record the dish.",
      ],
      editorial: explain({
        idea: "Instead of checking every pair, check every power of two: for each dish there are only 22 possible target sums, and each fixes the partner's value.",
        steps: [
          "Keep `count[value]` for dishes already scanned.",
          "For dish `x`, for `p` from 0 to 21, add `count[2^p - x]` to the answer.",
          "Then increment `count[x]`.",
          "Reduce the answer modulo `10^9 + 7`.",
        ],
        why: "Each good pair `i < j` is counted exactly once — at `j`, under the unique power equal to their sum, when dish `i` is already in the table. Sums never exceed `2^21`, so no power is missed.",
        time: "O(22 · n)",
        space: "O(n)",
        pitfalls: [
          "Zero is allowed: `0 + 1 = 1 = 2^0` is a good meal, but `0 + 0 = 0` is not a power of two.",
          "Go up to `2^21` — two dishes of `2^20` sum to `2^21`.",
          "Count only earlier dishes so a dish never pairs with itself and no pair is counted twice.",
        ],
      }),
      examples: [
        { input: "[2,6,1,1]", expectedOutput: "2" },
        { input: "[0,1,0]", expectedOutput: "2" },
        { input: "[4,4,12,4]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 10), ri(rng, 11, 50), ri(rng, 11, 50), ri(rng, 11, 50)]);
        const mode = ri(rng, 0, 6);
        let d: number[];
        if (mode <= 1) d = Array.from({ length: n }, () => ri(rng, 0, 8));
        else if (mode === 2) d = Array.from({ length: n }, () => 1 << ri(rng, 0, 20));
        else if (mode === 3) d = Array.from({ length: n }, () => ri(rng, 0, 1 << 20));
        else if (mode <= 5) {
          d = [];
          for (let i = 0; i < n; i++) {
            if (i > 0 && rng() < 0.6) {
              // a partner that completes a power of two with an earlier dish
              const other = pick(rng, d);
              let k = 0;
              while ((1 << k) < other) k++;
              if (rng() < 0.4 && (1 << (k + 1)) - other <= (1 << 20)) k++;
              d.push((1 << k) - other);
            } else d.push(ri(rng, 0, 1 << ri(rng, 1, 20)));
          }
        } else d = Array.from({ length: n }, () => pick(rng, [0, 1, 1 << 20, 3, 5, 1 << 19]));
        return { input: fmtIntArr(d), expectedOutput: String(ref(d)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPairs(deliciousness: List[int]) -> int:
              MOD = 10 ** 9 + 7
              count = {}
              ans = 0
              for x in deliciousness:
                  for p in range(22):
                      ans += count.get((1 << p) - x, 0)
                  count[x] = count.get(x, 0) + 1
              return ans % MOD
        `,
        javascript: code`
          var countPairs = function(deliciousness) {
              var MOD = 1000000007;
              var count = new Map();
              var ans = 0;
              for (var i = 0; i < deliciousness.length; i++) {
                  var x = deliciousness[i];
                  for (var p = 0; p <= 21; p++) {
                      var c = count.get((1 << p) - x);
                      if (c !== undefined) ans = (ans + c) % MOD;
                  }
                  count.set(x, (count.get(x) || 0) + 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function countPairs(deliciousness: number[]): number {
              var MOD = 1000000007;
              var count: { [k: string]: number } = {};
              var ans = 0;
              for (var i = 0; i < deliciousness.length; i++) {
                  var x = deliciousness[i];
                  for (var p = 0; p <= 21; p++) {
                      var c = count["" + ((1 << p) - x)];
                      if (c !== undefined) ans = (ans + c) % MOD;
                  }
                  var key = "" + x;
                  count[key] = (count[key] === undefined ? 0 : count[key]) + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int countPairs(int[] deliciousness) {
              final int MOD = 1000000007;
              Map<Integer, Integer> count = new HashMap<>();
              int ans = 0;
              for (int x : deliciousness) {
                  for (int p = 0; p <= 21; p++) {
                      Integer c = count.get((1 << p) - x);
                      if (c != null) ans = (ans + c) % MOD;
                  }
                  count.merge(x, 1, Integer::sum);
              }
              return ans;
          }
        `,
        cpp: code`
          int countPairs(vector<int>& deliciousness) {
              const int MOD = 1000000007;
              unordered_map<int, int> count;
              int ans = 0;
              for (int x : deliciousness) {
                  for (int p = 0; p <= 21; p++) {
                      auto it = count.find((1 << p) - x);
                      if (it != count.end()) ans = (ans + it->second) % MOD;
                  }
                  count[x]++;
              }
              return ans;
          }
        `,
        c: code`
          static int cmpAsc1711(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static int find1711(int* vals, int m, int target) {
              int lo = 0, hi = m - 1;
              while (lo <= hi) {
                  int mid = (lo + hi) / 2;
                  if (vals[mid] == target) return mid;
                  if (vals[mid] < target) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }

          int countPairs(int* deliciousness, int deliciousnessSize) {
              const long long MOD = 1000000007LL;
              int n = deliciousnessSize;
              int* a = (int*)malloc(sizeof(int) * (n + 1));
              int* vals = (int*)malloc(sizeof(int) * (n + 1));
              long long* cnts = (long long*)malloc(sizeof(long long) * (n + 1));
              for (int i = 0; i < n; i++) a[i] = deliciousness[i];
              qsort(a, n, sizeof(int), cmpAsc1711);
              int m = 0;
              for (int i = 0; i < n; i++) {
                  if (m > 0 && vals[m - 1] == a[i]) {
                      cnts[m - 1]++;
                  } else {
                      vals[m] = a[i];
                      cnts[m] = 1;
                      m++;
                  }
              }
              /* each unordered pair of values {x, y} with x <= y is counted once */
              long long ans = 0;
              for (int i = 0; i < m; i++) {
                  int x = vals[i];
                  for (int p = 0; p <= 21; p++) {
                      int y = (1 << p) - x;
                      if (y < x) continue;
                      if (y == x) {
                          ans = (ans + cnts[i] * (cnts[i] - 1) / 2) % MOD;
                      } else {
                          int j = find1711(vals, m, y);
                          if (j >= 0) ans = (ans + cnts[i] * cnts[j]) % MOD;
                      }
                  }
              }
              free(a);
              free(vals);
              free(cnts);
              return (int)ans;
          }
        `,
        csharp: code`
          public static int CountPairs(int[] deliciousness)
          {
              const int MOD = 1000000007;
              var count = new Dictionary<int, int>();
              int ans = 0;
              foreach (var x in deliciousness)
              {
                  for (int p = 0; p <= 21; p++)
                  {
                      if (count.TryGetValue((1 << p) - x, out int c)) ans = (ans + c) % MOD;
                  }
                  count.TryGetValue(x, out int cur);
                  count[x] = cur + 1;
              }
              return ans;
          }
        `,
        go: code`
          func countPairs(deliciousness []int) int {
              const MOD = 1000000007
              count := map[int]int{}
              ans := 0
              for _, x := range deliciousness {
                  for p := uint(0); p <= 21; p++ {
                      ans = (ans + count[(1<<p)-x]) % MOD
                  }
                  count[x]++
              }
              return ans
          }
        `,
        kotlin: code`
          fun countPairs(deliciousness: IntArray): Int {
              val MOD = 1000000007
              val count = HashMap<Int, Int>()
              var ans = 0
              for (x in deliciousness) {
                  for (p in 0..21) {
                      val c = count[(1 shl p) - x]
                      if (c != null) ans = (ans + c) % MOD
                  }
                  count[x] = (count[x] ?: 0) + 1
              }
              return ans
          }
        `,
        swift: code`
          func countPairs(_ deliciousness: [Int]) -> Int {
              let MOD = 1000000007
              var count = [Int: Int]()
              var ans = 0
              for x in deliciousness {
                  for p in 0...21 {
                      if let c = count[(1 << p) - x] { ans = (ans + c) % MOD }
                  }
                  count[x, default: 0] += 1
              }
              return ans
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn countPairs(deliciousness: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let mut count: HashMap<i32, i64> = HashMap::new();
              let mut ans: i64 = 0;
              for &x in deliciousness.iter() {
                  for p in 0..22 {
                      if let Some(&c) = count.get(&((1i32 << p) - x)) {
                          ans = (ans + c) % modulus;
                      }
                  }
                  *count.entry(x).or_insert(0) += 1;
              }
              ans as i32
          }
        `,
        php: code`
          function countPairs($deliciousness) {
              $MOD = 1000000007;
              $count = [];
              $ans = 0;
              foreach ($deliciousness as $x) {
                  for ($p = 0; $p <= 21; $p++) {
                      $y = (1 << $p) - $x;
                      if (isset($count[$y])) $ans = ($ans + $count[$y]) % $MOD;
                  }
                  $count[$x] = (isset($count[$x]) ? $count[$x] : 0) + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def countPairs(deliciousness)
            mod = 1_000_000_007
            count = Hash.new(0)
            ans = 0
            deliciousness.each do |x|
              22.times { |p| ans += count[(1 << p) - x] }
              count[x] += 1
            end
            ans % mod
          end
        `,
      },
    };
  })(),

  // ── Tuple with Same Product (LC 1726) ───────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const pairs: number[] = [];
      for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) pairs.push(nums[i] * nums[j]);
      let tuples = 0;
      for (let a = 0; a < pairs.length; a++) for (let b = a + 1; b < pairs.length; b++) if (pairs[a] === pairs[b]) tuples += 8;
      return tuples;
    };
    return {
      slug: "tuple-with-same-product",
      title: "Tuple with Same Product",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Google", "Amazon"],
      signature: { funcName: "tupleSameProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` holds **distinct** positive integers. Count the ordered tuples `(a, b, c, d)` such that `a * b == c * d`, where `a`, `b`, `c` and `d` are elements of `nums` and all four are different (`a != b != c != d`, pairwise).\n\nTuples are ordered: `(2, 6, 3, 4)` and `(6, 2, 3, 4)` are counted separately.",
        [
          { in: "nums = [1,2,3,6]", out: "8", note: "`1 * 6 = 2 * 3`, and that one match gives 8 orderings: `(1,6,2,3)`, `(1,6,3,2)`, `(6,1,2,3)`, `(6,1,3,2)`, `(2,3,1,6)`, `(3,2,1,6)`, `(2,3,6,1)`, `(3,2,6,1)`." },
          { in: "nums = [1,2,4,8,16]", out: "24", note: "`1*8 = 2*4`, `1*16 = 2*8` and `2*16 = 4*8` — three matches." },
          { in: "nums = [3,7]", out: "0" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^4", "All elements in `nums` are distinct."]),
      hints: [
        "Think in terms of unordered pairs `{a, b}` and their products.",
        "Two different pairs with the same product never share an element (the values are distinct), so any two of them form valid tuples.",
        "Count how many pairs give each product. A product shared by `c` pairs contributes `C(c, 2)` matches, and each match yields 8 ordered tuples.",
      ],
      editorial: explain({
        idea: "Group the `n(n-1)/2` pairs by product; every two pairs in one group make 8 ordered tuples.",
        steps: [
          "For every `i < j`, increment `count[nums[i] * nums[j]]`.",
          "For each product with `c` pairs, add `8 * c * (c - 1) / 2`, i.e. `4 * c * (c - 1)`.",
          "Return the sum.",
        ],
        why: "If `{a, b} != {c, d}` and `a * b == c * d` with distinct values, the pairs are disjoint: sharing `a = c` would force `b = d`. So each unordered pair of pairs is a valid match, and its tuples come from ordering within each pair (2 · 2) and choosing which pair goes first (2): 8 in total.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Counting ordered pairs instead of unordered ones overcounts by a factor of 4.",
          "The distinctness of the values is what makes every match valid — without it you would need to exclude shared elements.",
          "Products reach 10^8, which still fits in a 32-bit integer.",
        ],
      }),
      examples: [
        { input: "[1,2,3,6]", expectedOutput: "8" },
        { input: "[1,2,4,8,16]", expectedOutput: "24" },
        { input: "[3,7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 8), ri(rng, 4, 8), ri(rng, 9, 16), ri(rng, 9, 16), ri(rng, 9, 16)]);
        const range = Math.max(n, pick(rng, [12, 16, 24, 30, 40, 10000]));
        const chosen = new Set<number>();
        if (n >= 4 && rng() < 0.5) {
          // Plant matches: x*y times z*w equals x*z times y*w.
          const plants = ri(rng, 1, Math.floor(n / 4));
          for (let t = 0; t < plants; t++) {
            const x = ri(rng, 1, 12), y = ri(rng, 1, 12), z = ri(rng, 1, 12), w = ri(rng, 1, 12);
            const four = [x * y, z * w, x * z, y * w];
            if (new Set(four).size === 4 && four.every((v) => !chosen.has(v)) && chosen.size + 4 <= n) four.forEach((v) => chosen.add(v));
          }
        }
        while (chosen.size < n) chosen.add(ri(rng, 1, range));
        const nums = shuffle(rng, Array.from(chosen));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def tupleSameProduct(nums: List[int]) -> int:
              count = {}
              n = len(nums)
              for i in range(n):
                  for j in range(i + 1, n):
                      p = nums[i] * nums[j]
                      count[p] = count.get(p, 0) + 1
              return sum(4 * c * (c - 1) for c in count.values())
        `,
        javascript: code`
          var tupleSameProduct = function(nums) {
              var count = new Map();
              var n = nums.length;
              for (var i = 0; i < n; i++) {
                  for (var j = i + 1; j < n; j++) {
                      var p = nums[i] * nums[j];
                      count.set(p, (count.get(p) || 0) + 1);
                  }
              }
              var total = 0;
              count.forEach(function(c) { total += 4 * c * (c - 1); });
              return total;
          };
        `,
        typescript: code`
          function tupleSameProduct(nums: number[]): number {
              var count: { [k: string]: number } = {};
              var keys: string[] = [];
              var n = nums.length;
              for (var i = 0; i < n; i++) {
                  for (var j = i + 1; j < n; j++) {
                      var key = "" + nums[i] * nums[j];
                      if (count[key] === undefined) {
                          count[key] = 0;
                          keys.push(key);
                      }
                      count[key]++;
                  }
              }
              var total = 0;
              for (var k = 0; k < keys.length; k++) {
                  var c = count[keys[k]];
                  total += 4 * c * (c - 1);
              }
              return total;
          }
        `,
        java: code`
          public static int tupleSameProduct(int[] nums) {
              Map<Integer, Integer> count = new HashMap<>();
              int n = nums.length;
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      count.merge(nums[i] * nums[j], 1, Integer::sum);
                  }
              }
              int total = 0;
              for (int c : count.values()) total += 4 * c * (c - 1);
              return total;
          }
        `,
        cpp: code`
          int tupleSameProduct(vector<int>& nums) {
              unordered_map<int, int> count;
              int n = nums.size();
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) count[nums[i] * nums[j]]++;
              }
              int total = 0;
              for (auto& kv : count) total += 4 * kv.second * (kv.second - 1);
              return total;
          }
        `,
        c: code`
          static int cmpAsc1726(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int tupleSameProduct(int* nums, int numsSize) {
              int n = numsSize;
              int m = n * (n - 1) / 2;
              int* prods = (int*)malloc(sizeof(int) * (m + 1));
              int k = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) prods[k++] = nums[i] * nums[j];
              }
              qsort(prods, m, sizeof(int), cmpAsc1726);
              int total = 0;
              int i = 0;
              while (i < m) {
                  int j = i;
                  while (j < m && prods[j] == prods[i]) j++;
                  int c = j - i;
                  total += 4 * c * (c - 1);
                  i = j;
              }
              free(prods);
              return total;
          }
        `,
        csharp: code`
          public static int TupleSameProduct(int[] nums)
          {
              var count = new Dictionary<int, int>();
              int n = nums.Length;
              for (int i = 0; i < n; i++)
              {
                  for (int j = i + 1; j < n; j++)
                  {
                      int p = nums[i] * nums[j];
                      count.TryGetValue(p, out int cur);
                      count[p] = cur + 1;
                  }
              }
              int total = 0;
              foreach (var c in count.Values) total += 4 * c * (c - 1);
              return total;
          }
        `,
        go: code`
          func tupleSameProduct(nums []int) int {
              count := map[int]int{}
              n := len(nums)
              for i := 0; i < n; i++ {
                  for j := i + 1; j < n; j++ {
                      count[nums[i]*nums[j]]++
                  }
              }
              total := 0
              for _, c := range count {
                  total += 4 * c * (c - 1)
              }
              return total
          }
        `,
        kotlin: code`
          fun tupleSameProduct(nums: IntArray): Int {
              val count = HashMap<Int, Int>()
              val n = nums.size
              for (i in 0 until n) {
                  for (j in i + 1 until n) {
                      val p = nums[i] * nums[j]
                      count[p] = (count[p] ?: 0) + 1
                  }
              }
              var total = 0
              for (c in count.values) total += 4 * c * (c - 1)
              return total
          }
        `,
        swift: code`
          func tupleSameProduct(_ nums: [Int]) -> Int {
              var count = [Int: Int]()
              let n = nums.count
              for i in 0..<n {
                  for j in (i + 1)..<n {
                      count[nums[i] * nums[j], default: 0] += 1
                  }
              }
              var total = 0
              for c in count.values { total += 4 * c * (c - 1) }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn tupleSameProduct(nums: Vec<i32>) -> i32 {
              let mut count: HashMap<i32, i32> = HashMap::new();
              let n = nums.len();
              for i in 0..n {
                  for j in (i + 1)..n {
                      *count.entry(nums[i] * nums[j]).or_insert(0) += 1;
                  }
              }
              let mut total = 0;
              for &c in count.values() {
                  total += 4 * c * (c - 1);
              }
              total
          }
        `,
        php: code`
          function tupleSameProduct($nums) {
              $count = [];
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  for ($j = $i + 1; $j < $n; $j++) {
                      $p = $nums[$i] * $nums[$j];
                      $count[$p] = (isset($count[$p]) ? $count[$p] : 0) + 1;
                  }
              }
              $total = 0;
              foreach ($count as $c) $total += 4 * $c * ($c - 1);
              return $total;
          }
        `,
        ruby: code`
          def tupleSameProduct(nums)
            count = Hash.new(0)
            n = nums.length
            (0...n).each do |i|
              ((i + 1)...n).each { |j| count[nums[i] * nums[j]] += 1 }
            end
            count.values.sum { |c| 4 * c * (c - 1) }
          end
        `,
      },
    };
  })(),

  // ── Maximum Absolute Sum of Any Subarray (LC 1749) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let l = 0; l < nums.length; l++) {
        let s = 0;
        for (let r = l; r < nums.length; r++) { s += nums[r]; best = Math.max(best, Math.abs(s)); }
      }
      return best;
    };
    return {
      slug: "maximum-absolute-sum-of-any-subarray",
      title: "Maximum Absolute Sum of Any Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maxAbsoluteSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **absolute sum** of a subarray `[nums[l], ..., nums[r]]` is `|nums[l] + ... + nums[r]|`.\n\nReturn the maximum absolute sum over all subarrays of `nums`. The subarray may be empty, with absolute sum 0.",
        [
          { in: "nums = [3,-5,1,-6,2]", out: "10", note: "`[-5,1,-6]` sums to -10." },
          { in: "nums = [-2,-1]", out: "3" },
          { in: "nums = [4]", out: "4" },
        ],
        ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"]),
      hints: [
        "The answer is the larger of the maximum subarray sum and the negated minimum subarray sum.",
        "Every subarray sum is a difference of two prefix sums `P[j] - P[i]` with `i < j`.",
        "So the largest absolute value of such a difference is simply `max(P) - min(P)` over all prefix sums, including the empty prefix 0.",
      ],
      editorial: explain({
        idea: "A subarray's sum is a difference of two prefix sums, and the largest absolute difference between any two prefix sums is the gap between the largest and smallest one.",
        steps: [
          "Sweep the array keeping the running prefix sum, starting from 0.",
          "Track the maximum and minimum prefix sums seen (both start at 0, the empty prefix).",
          "Return `maxPrefix - minPrefix`.",
        ],
        why: "For any two prefix positions the absolute difference is the absolute sum of the subarray between them, regardless of which comes first. So the best absolute sum is the largest difference between two prefix sums, which is attained by the maximum and the minimum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the empty prefix (0) misses subarrays that start at index 0.",
          "Running only Kadane for the maximum misses strongly negative subarrays.",
          "The answer is at most 10^9 under these bounds, so it fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "[3,-5,1,-6,2]", expectedOutput: "10" },
        { input: "[-2,-1]", expectedOutput: "3" },
        { input: "[4]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const mode = ri(rng, 0, 3);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, -5, 5));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, -10000, 10000));
        else if (mode === 2) nums = Array.from({ length: n }, () => ri(rng, -10000, 0));
        else nums = Array.from({ length: n }, () => ri(rng, 0, 10000));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxAbsoluteSum(nums: List[int]) -> int:
              prefix = hi = lo = 0
              for v in nums:
                  prefix += v
                  hi = max(hi, prefix)
                  lo = min(lo, prefix)
              return hi - lo
        `,
        javascript: code`
          var maxAbsoluteSum = function(nums) {
              var prefix = 0, hi = 0, lo = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  if (prefix > hi) hi = prefix;
                  if (prefix < lo) lo = prefix;
              }
              return hi - lo;
          };
        `,
        typescript: code`
          function maxAbsoluteSum(nums: number[]): number {
              var prefix = 0, hi = 0, lo = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  if (prefix > hi) hi = prefix;
                  if (prefix < lo) lo = prefix;
              }
              return hi - lo;
          }
        `,
        java: code`
          public static int maxAbsoluteSum(int[] nums) {
              int prefix = 0, hi = 0, lo = 0;
              for (int v : nums) {
                  prefix += v;
                  hi = Math.max(hi, prefix);
                  lo = Math.min(lo, prefix);
              }
              return hi - lo;
          }
        `,
        cpp: code`
          int maxAbsoluteSum(vector<int>& nums) {
              int prefix = 0, hi = 0, lo = 0;
              for (int v : nums) {
                  prefix += v;
                  hi = max(hi, prefix);
                  lo = min(lo, prefix);
              }
              return hi - lo;
          }
        `,
        c: code`
          int maxAbsoluteSum(int* nums, int numsSize) {
              int prefix = 0, hi = 0, lo = 0;
              for (int i = 0; i < numsSize; i++) {
                  prefix += nums[i];
                  if (prefix > hi) hi = prefix;
                  if (prefix < lo) lo = prefix;
              }
              return hi - lo;
          }
        `,
        csharp: code`
          public static int MaxAbsoluteSum(int[] nums)
          {
              int prefix = 0, hi = 0, lo = 0;
              foreach (var v in nums)
              {
                  prefix += v;
                  hi = Math.Max(hi, prefix);
                  lo = Math.Min(lo, prefix);
              }
              return hi - lo;
          }
        `,
        go: code`
          func maxAbsoluteSum(nums []int) int {
              prefix, hi, lo := 0, 0, 0
              for _, v := range nums {
                  prefix += v
                  if prefix > hi {
                      hi = prefix
                  }
                  if prefix < lo {
                      lo = prefix
                  }
              }
              return hi - lo
          }
        `,
        kotlin: code`
          fun maxAbsoluteSum(nums: IntArray): Int {
              var prefix = 0
              var hi = 0
              var lo = 0
              for (v in nums) {
                  prefix += v
                  hi = Math.max(hi, prefix)
                  lo = Math.min(lo, prefix)
              }
              return hi - lo
          }
        `,
        swift: code`
          func maxAbsoluteSum(_ nums: [Int]) -> Int {
              var prefix = 0
              var hi = 0
              var lo = 0
              for v in nums {
                  prefix += v
                  hi = max(hi, prefix)
                  lo = min(lo, prefix)
              }
              return hi - lo
          }
        `,
        rust: code`
          fn maxAbsoluteSum(nums: Vec<i32>) -> i32 {
              let mut prefix = 0;
              let mut hi = 0;
              let mut lo = 0;
              for &v in nums.iter() {
                  prefix += v;
                  hi = std::cmp::max(hi, prefix);
                  lo = std::cmp::min(lo, prefix);
              }
              hi - lo
          }
        `,
        php: code`
          function maxAbsoluteSum($nums) {
              $prefix = 0;
              $hi = 0;
              $lo = 0;
              foreach ($nums as $v) {
                  $prefix += $v;
                  if ($prefix > $hi) $hi = $prefix;
                  if ($prefix < $lo) $lo = $prefix;
              }
              return $hi - $lo;
          }
        `,
        ruby: code`
          def maxAbsoluteSum(nums)
            prefix = 0
            hi = 0
            lo = 0
            nums.each do |v|
              prefix += v
              hi = prefix if prefix > hi
              lo = prefix if prefix < lo
            end
            hi - lo
          end
        `,
      },
    };
  })(),

  // ── Minimum Elements to Add to Form a Given Sum (LC 1785) ───────
  (() => {
    const ref = (nums: number[], limit: number, goal: number) => {
      let sum = 0;
      for (const v of nums) sum += v;
      return Math.ceil(Math.abs(goal - sum) / limit);
    };
    return {
      slug: "minimum-elements-to-add-to-form-a-given-sum",
      title: "Minimum Elements to Add to Form a Given Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Microsoft"],
      signature: {
        funcName: "minElements",
        params: [{ name: "nums", type: "int[]" as const }, { name: "limit", type: "int" as const }, { name: "goal", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Every element of `nums` satisfies `|nums[i]| <= limit`.\n\nYou may append new integers to `nums`, each of which must also satisfy `|x| <= limit`. Return the minimum number of integers you need to append so that the sum of the array equals `goal`.\n\n*CodeKairo bounds: the array and value limits are smaller than in the original problem so that the answer and every intermediate sum fit in a 32-bit integer.*",
        [
          { in: "nums = [2,-3,4], limit = 2, goal = 10", out: "4", note: "The sum is 3 and 7 more is needed: `2 + 2 + 2 + 1`." },
          { in: "nums = [5,-5], limit = 5, goal = 0", out: "0" },
          { in: "nums = [-1,1,-1], limit = 1, goal = -6", out: "5", note: "The sum is -1, so five more `-1`s are needed." },
        ],
        ["1 <= nums.length <= 10^4", "1 <= limit <= 10^5", "-limit <= nums[i] <= limit", "-10^9 <= goal <= 10^9"]),
      hints: [
        "Only the gap `|goal - sum(nums)|` matters, not the individual elements.",
        "Each appended number can close at most `limit` of the gap.",
        "So the answer is the gap divided by `limit`, rounded up.",
      ],
      editorial: explain({
        idea: "Each new element moves the sum by at most `limit`, so closing a gap of `d` needs at least `ceil(d / limit)` elements — and that many always suffice.",
        steps: [
          "Compute the current sum (in 64-bit if your bounds allow larger values).",
          "Let `d = |goal - sum|`.",
          "Return `(d + limit - 1) / limit` using integer division.",
        ],
        why: "Fewer than `ceil(d / limit)` elements can move the sum by less than `d`. With exactly that many, use `limit` (with the sign of the gap) for all but the last one and the remainder for the last, which is at most `limit` in absolute value.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "With the original bounds (`n` up to 10^5, `limit` up to 10^6) the sum and the gap overflow 32 bits — accumulate in 64 bits.",
          "Use integer ceiling division; floating point can round wrongly for large values.",
          "A gap of zero needs zero elements.",
        ],
      }),
      examples: [
        { input: "[2,-3,4]\n2\n10", expectedOutput: "4" },
        { input: "[5,-5]\n5\n0", expectedOutput: "0" },
        { input: "[-1,1,-1]\n1\n-6", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 11, 40)]);
        const limit = pick(rng, [1, ri(rng, 1, 10), ri(rng, 11, 1000), 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, -limit, limit));
        let sum = 0;
        for (const v of nums) sum += v;
        const mode = ri(rng, 0, 3);
        let goal: number;
        if (mode === 0) goal = sum;
        else if (mode === 1) goal = sum + ri(rng, -3 * limit, 3 * limit);
        else if (mode === 2) goal = pick(rng, [-1000000000, 1000000000]);
        else goal = ri(rng, -1000000000, 1000000000);
        return { input: `${fmtIntArr(nums)}\n${limit}\n${goal}`, expectedOutput: String(ref(nums, limit, goal)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minElements(nums: List[int], limit: int, goal: int) -> int:
              d = abs(goal - sum(nums))
              return (d + limit - 1) // limit
        `,
        javascript: code`
          var minElements = function(nums, limit, goal) {
              var sum = 0;
              for (var i = 0; i < nums.length; i++) sum += nums[i];
              var d = Math.abs(goal - sum);
              return Math.floor((d + limit - 1) / limit);
          };
        `,
        typescript: code`
          function minElements(nums: number[], limit: number, goal: number): number {
              var sum = 0;
              for (var i = 0; i < nums.length; i++) sum += nums[i];
              var d = Math.abs(goal - sum);
              return Math.floor((d + limit - 1) / limit);
          }
        `,
        java: code`
          public static int minElements(int[] nums, int limit, int goal) {
              long sum = 0;
              for (int v : nums) sum += v;
              long d = Math.abs((long) goal - sum);
              return (int) ((d + limit - 1) / limit);
          }
        `,
        cpp: code`
          int minElements(vector<int>& nums, int limit, int goal) {
              long long sum = 0;
              for (int v : nums) sum += v;
              long long d = llabs((long long)goal - sum);
              return (int)((d + limit - 1) / limit);
          }
        `,
        c: code`
          int minElements(int* nums, int numsSize, int limit, int goal) {
              long long sum = 0;
              for (int i = 0; i < numsSize; i++) sum += nums[i];
              long long d = (long long)goal - sum;
              if (d < 0) d = -d;
              return (int)((d + limit - 1) / limit);
          }
        `,
        csharp: code`
          public static int MinElements(int[] nums, int limit, int goal)
          {
              long sum = 0;
              foreach (var v in nums) sum += v;
              long d = Math.Abs((long)goal - sum);
              return (int)((d + limit - 1) / limit);
          }
        `,
        go: code`
          func minElements(nums []int, limit int, goal int) int {
              sum := 0
              for _, v := range nums {
                  sum += v
              }
              d := goal - sum
              if d < 0 {
                  d = -d
              }
              return (d + limit - 1) / limit
          }
        `,
        kotlin: code`
          fun minElements(nums: IntArray, limit: Int, goal: Int): Int {
              var sum = 0L
              for (v in nums) sum += v
              val d = Math.abs(goal.toLong() - sum)
              return ((d + limit - 1) / limit).toInt()
          }
        `,
        swift: code`
          func minElements(_ nums: [Int], _ limit: Int, _ goal: Int) -> Int {
              var sum = 0
              for v in nums { sum += v }
              let d = abs(goal - sum)
              return (d + limit - 1) / limit
          }
        `,
        rust: code`
          fn minElements(nums: Vec<i32>, limit: i32, goal: i32) -> i32 {
              let sum: i64 = nums.iter().map(|&v| v as i64).sum();
              let d = (goal as i64 - sum).abs();
              let lim = limit as i64;
              ((d + lim - 1) / lim) as i32
          }
        `,
        php: code`
          function minElements($nums, $limit, $goal) {
              $d = abs($goal - array_sum($nums));
              return intdiv($d + $limit - 1, $limit);
          }
        `,
        ruby: code`
          def minElements(nums, limit, goal)
            d = (goal - nums.sum).abs
            (d + limit - 1) / limit
          end
        `,
      },
    };
  })(),

  // ── Reduction Operations to Make the Array Elements Equal (LC 1887)
  (() => {
    const ref = (input: number[]) => {
      const a = input.slice();
      let ops = 0;
      for (;;) {
        let largest = -Infinity;
        for (const v of a) largest = Math.max(largest, v);
        let nextLargest = -Infinity;
        for (const v of a) if (v < largest) nextLargest = Math.max(nextLargest, v);
        if (nextLargest === -Infinity) return ops;
        const idx = a.indexOf(largest);
        a[idx] = nextLargest;
        ops++;
      }
    };
    return {
      slug: "reduction-operations-to-make-the-array-elements-equal",
      title: "Reduction Operations to Make the Array Elements Equal",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Amazon", "Google"],
      signature: { funcName: "reductionOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You repeatedly apply the following operation to `nums` until all its elements are equal:\n\n1. Find the largest value `largest`. If several elements share it, take the one with the smallest index `i`.\n2. Find `nextLargest`, the largest value **strictly smaller** than `largest`.\n3. Set `nums[i] = nextLargest`.\n\nReturn the number of operations performed.",
        [
          { in: "nums = [4,4,2]", out: "2", note: "Each 4 is lowered to 2 in turn." },
          { in: "nums = [6,6,6]", out: "0" },
          { in: "nums = [1,2,2,3]", out: "4", note: "`3 -> 2` once, then each of the three 2s becomes 1." },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 5 * 10^4"]),
      hints: [
        "An element only ever steps down through the distinct values below it, one distinct value per operation.",
        "So an element ends up costing exactly the number of distinct values that are smaller than it.",
        "Sort the array and walk it, counting how many times the value has changed so far; add that count for each element.",
      ],
      editorial: explain({
        idea: "Each operation moves one element down by exactly one distinct-value level, and every element must reach the minimum — so an element costs the number of distinct values below it.",
        steps: [
          "Sort `nums` ascending.",
          "Keep `levels`, the number of distinct values seen strictly below the current element: increase it whenever `a[i] != a[i - 1]`.",
          "Add `levels` to the answer for every element.",
          "Return the answer.",
        ],
        why: "`nextLargest` is the next distinct value below the current maximum, so an operation never skips a level. An element with `k` distinct values beneath it is lowered exactly `k` times before it equals the minimum; the order in which the operations happen does not change these per-element counts.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "Counting the plain rank (index) of each element overcounts when values repeat — use distinct levels.",
          "Elements equal to the minimum cost nothing.",
          "The total is at most about n^2 / 2 for all-distinct values, roughly 1.25 * 10^9 at the bounds — still inside 32 bits.",
        ],
      }),
      examples: [
        { input: "[4,4,2]", expectedOutput: "2" },
        { input: "[6,6,6]", expectedOutput: "0" },
        { input: "[1,2,2,3]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 30), ri(rng, 9, 30), ri(rng, 9, 30)]);
        const hi = pick(rng, [1, 3, 10, 50, 50000, 50000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def reductionOperations(nums: List[int]) -> int:
              a = sorted(nums)
              ops = 0
              levels = 0
              for i in range(1, len(a)):
                  if a[i] != a[i - 1]:
                      levels += 1
                  ops += levels
              return ops
        `,
        javascript: code`
          var reductionOperations = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var ops = 0, levels = 0;
              for (var i = 1; i < a.length; i++) {
                  if (a[i] !== a[i - 1]) levels++;
                  ops += levels;
              }
              return ops;
          };
        `,
        typescript: code`
          function reductionOperations(nums: number[]): number {
              var a = nums.slice().sort(function(x: number, y: number) { return x - y; });
              var ops = 0, levels = 0;
              for (var i = 1; i < a.length; i++) {
                  if (a[i] !== a[i - 1]) levels++;
                  ops += levels;
              }
              return ops;
          }
        `,
        java: code`
          public static int reductionOperations(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int ops = 0, levels = 0;
              for (int i = 1; i < a.length; i++) {
                  if (a[i] != a[i - 1]) levels++;
                  ops += levels;
              }
              return ops;
          }
        `,
        cpp: code`
          int reductionOperations(vector<int>& nums) {
              vector<int> a(nums);
              sort(a.begin(), a.end());
              int ops = 0, levels = 0;
              for (size_t i = 1; i < a.size(); i++) {
                  if (a[i] != a[i - 1]) levels++;
                  ops += levels;
              }
              return ops;
          }
        `,
        c: code`
          static int cmpAsc1887(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int reductionOperations(int* nums, int numsSize) {
              int* a = (int*)malloc(sizeof(int) * (numsSize + 1));
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpAsc1887);
              int ops = 0, levels = 0;
              for (int i = 1; i < numsSize; i++) {
                  if (a[i] != a[i - 1]) levels++;
                  ops += levels;
              }
              free(a);
              return ops;
          }
        `,
        csharp: code`
          public static int ReductionOperations(int[] nums)
          {
              var a = (int[])nums.Clone();
              Array.Sort(a);
              int ops = 0, levels = 0;
              for (int i = 1; i < a.Length; i++)
              {
                  if (a[i] != a[i - 1]) levels++;
                  ops += levels;
              }
              return ops;
          }
        `,
        go: code`
          func reductionOperations(nums []int) int {
              a := make([]int, len(nums))
              copy(a, nums)
              sort.Ints(a)
              ops, levels := 0, 0
              for i := 1; i < len(a); i++ {
                  if a[i] != a[i-1] {
                      levels++
                  }
                  ops += levels
              }
              return ops
          }
        `,
        kotlin: code`
          fun reductionOperations(nums: IntArray): Int {
              val a = nums.copyOf()
              a.sort()
              var ops = 0
              var levels = 0
              for (i in 1 until a.size) {
                  if (a[i] != a[i - 1]) levels++
                  ops += levels
              }
              return ops
          }
        `,
        swift: code`
          func reductionOperations(_ nums: [Int]) -> Int {
              let a = nums.sorted()
              var ops = 0
              var levels = 0
              var i = 1
              while i < a.count {
                  if a[i] != a[i - 1] { levels += 1 }
                  ops += levels
                  i += 1
              }
              return ops
          }
        `,
        rust: code`
          fn reductionOperations(nums: Vec<i32>) -> i32 {
              let mut a = nums.clone();
              a.sort();
              let mut ops = 0;
              let mut levels = 0;
              for i in 1..a.len() {
                  if a[i] != a[i - 1] {
                      levels += 1;
                  }
                  ops += levels;
              }
              ops
          }
        `,
        php: code`
          function reductionOperations($nums) {
              sort($nums);
              $ops = 0;
              $levels = 0;
              $n = count($nums);
              for ($i = 1; $i < $n; $i++) {
                  if ($nums[$i] != $nums[$i - 1]) $levels++;
                  $ops += $levels;
              }
              return $ops;
          }
        `,
        ruby: code`
          def reductionOperations(nums)
            a = nums.sort
            ops = 0
            levels = 0
            (1...a.length).each do |i|
              levels += 1 if a[i] != a[i - 1]
              ops += levels
            end
            ops
          end
        `,
      },
    };
  })(),

  // ── Maximum Alternating Subsequence Sum (LC 1911) ───────────────
  (() => {
    const ref = (nums: number[]) => {
      // plus[i]: best sum of a subsequence ending at i with nums[i] added;
      // minus[i]: best ending at i with nums[i] subtracted.
      const n = nums.length;
      const plus: number[] = [], minus: number[] = [];
      let best = -Infinity;
      for (let i = 0; i < n; i++) {
        let bestMinus = 0, bestPlus = -Infinity;
        for (let j = 0; j < i; j++) { bestMinus = Math.max(bestMinus, minus[j]); bestPlus = Math.max(bestPlus, plus[j]); }
        plus.push(nums[i] + bestMinus);
        minus.push(bestPlus - nums[i]);
        best = Math.max(best, plus[i]);
      }
      return best;
    };
    return {
      slug: "maximum-alternating-subsequence-sum",
      title: "Maximum Alternating Subsequence Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "maxAlternatingSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **alternating sum** of a sequence is the sum of the elements at even positions minus the sum of the elements at odd positions (0-indexed). For example, the alternating sum of `[4,2,5,3]` is `(4 + 5) - (2 + 3) = 4`.\n\nPick a subsequence of `nums` (delete any elements, keep the order; positions are re-indexed from 0) and return the **maximum** alternating sum it can have.\n\n*CodeKairo bounds: the array is shorter than in the original problem so that the answer fits in a 32-bit integer.*",
        [
          { in: "nums = [3,1,4]", out: "6", note: "Take all three: `3 - 1 + 4`." },
          { in: "nums = [5,4,3]", out: "5", note: "Take just `[5]`." },
          { in: "nums = [1,6,2,7]", out: "11", note: "`[6,2,7]` gives `6 - 2 + 7`." },
        ],
        ["1 <= nums.length <= 10^4", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Process elements left to right. At each point, a partial subsequence has either just added an element or just subtracted one.",
        "Track two values: the best alternating sum whose last element was added, and the best whose last element was subtracted (the empty subsequence counts here with 0).",
        "For each `x`: `added = max(added, subtracted + x)` and `subtracted = max(subtracted, added - x)`; the answer is the final `added`.",
      ],
      editorial: explain({
        idea: "A two-state DP: the best alternating sum so far whose next element would be subtracted, and the one whose next element would be added.",
        steps: [
          "Let `added = 0` and `subtracted = 0` (the empty subsequence).",
          "For each element `x`, compute `newAdded = max(added, subtracted + x)` and `newSubtracted = max(subtracted, added - x)` from the old values.",
          "Assign both and continue.",
          "Return `added`.",
        ],
        why: "Any subsequence is built by deciding, element by element, to skip or to take; taking flips which sign comes next. `added` and `subtracted` hold the best value reachable in each sign state over all choices for the prefix, and the recurrence considers both skipping and taking `x`. An optimal subsequence never ends on a subtracted element (dropping it increases the sum), so the answer is `added`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Update both states from the old values — overwriting `added` first and then using it for `subtracted` lets an element be taken twice.",
          "Equivalently, the answer is `nums[0]` plus every positive rise `nums[i] - nums[i-1]`.",
          "With the original bounds (10^5 elements up to 10^5) the answer needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[3,1,4]", expectedOutput: "6" },
        { input: "[5,4,3]", expectedOutput: "5" },
        { input: "[1,6,2,7]", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 40), ri(rng, 9, 40)]);
        const mode = ri(rng, 0, 3);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, 1, 10));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 1, 100000));
        else if (mode === 2) nums = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? ri(rng, 90000, 100000) : ri(rng, 1, 10)));
        else nums = Array.from({ length: n }, () => ri(rng, 1, 100000)).sort((a, b) => (rng() < 0.5 ? a - b : b - a));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxAlternatingSum(nums: List[int]) -> int:
              added = subtracted = 0
              for x in nums:
                  added, subtracted = max(added, subtracted + x), max(subtracted, added - x)
              return added
        `,
        javascript: code`
          var maxAlternatingSum = function(nums) {
              var added = 0, subtracted = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var newAdded = Math.max(added, subtracted + x);
                  var newSubtracted = Math.max(subtracted, added - x);
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return added;
          };
        `,
        typescript: code`
          function maxAlternatingSum(nums: number[]): number {
              var added = 0, subtracted = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var newAdded = Math.max(added, subtracted + x);
                  var newSubtracted = Math.max(subtracted, added - x);
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return added;
          }
        `,
        java: code`
          public static int maxAlternatingSum(int[] nums) {
              long added = 0, subtracted = 0;
              for (int x : nums) {
                  long newAdded = Math.max(added, subtracted + x);
                  long newSubtracted = Math.max(subtracted, added - x);
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return (int) added;
          }
        `,
        cpp: code`
          int maxAlternatingSum(vector<int>& nums) {
              long long added = 0, subtracted = 0;
              for (int x : nums) {
                  long long newAdded = max(added, subtracted + x);
                  long long newSubtracted = max(subtracted, added - x);
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return (int)added;
          }
        `,
        c: code`
          int maxAlternatingSum(int* nums, int numsSize) {
              long long added = 0, subtracted = 0;
              for (int i = 0; i < numsSize; i++) {
                  long long x = nums[i];
                  long long newAdded = subtracted + x > added ? subtracted + x : added;
                  long long newSubtracted = added - x > subtracted ? added - x : subtracted;
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return (int)added;
          }
        `,
        csharp: code`
          public static int MaxAlternatingSum(int[] nums)
          {
              long added = 0, subtracted = 0;
              foreach (var x in nums)
              {
                  long newAdded = Math.Max(added, subtracted + x);
                  long newSubtracted = Math.Max(subtracted, added - x);
                  added = newAdded;
                  subtracted = newSubtracted;
              }
              return (int)added;
          }
        `,
        go: code`
          func maxAlternatingSum(nums []int) int {
              added, subtracted := 0, 0
              for _, x := range nums {
                  newAdded, newSubtracted := added, subtracted
                  if subtracted+x > newAdded {
                      newAdded = subtracted + x
                  }
                  if added-x > newSubtracted {
                      newSubtracted = added - x
                  }
                  added, subtracted = newAdded, newSubtracted
              }
              return added
          }
        `,
        kotlin: code`
          fun maxAlternatingSum(nums: IntArray): Int {
              var added = 0L
              var subtracted = 0L
              for (x in nums) {
                  val newAdded = Math.max(added, subtracted + x)
                  val newSubtracted = Math.max(subtracted, added - x)
                  added = newAdded
                  subtracted = newSubtracted
              }
              return added.toInt()
          }
        `,
        swift: code`
          func maxAlternatingSum(_ nums: [Int]) -> Int {
              var added = 0
              var subtracted = 0
              for x in nums {
                  let newAdded = max(added, subtracted + x)
                  let newSubtracted = max(subtracted, added - x)
                  added = newAdded
                  subtracted = newSubtracted
              }
              return added
          }
        `,
        rust: code`
          fn maxAlternatingSum(nums: Vec<i32>) -> i32 {
              let mut added: i64 = 0;
              let mut subtracted: i64 = 0;
              for &v in nums.iter() {
                  let x = v as i64;
                  let new_added = std::cmp::max(added, subtracted + x);
                  let new_subtracted = std::cmp::max(subtracted, added - x);
                  added = new_added;
                  subtracted = new_subtracted;
              }
              added as i32
          }
        `,
        php: code`
          function maxAlternatingSum($nums) {
              $added = 0;
              $subtracted = 0;
              foreach ($nums as $x) {
                  $newAdded = max($added, $subtracted + $x);
                  $newSubtracted = max($subtracted, $added - $x);
                  $added = $newAdded;
                  $subtracted = $newSubtracted;
              }
              return $added;
          }
        `,
        ruby: code`
          def maxAlternatingSum(nums)
            added = 0
            subtracted = 0
            nums.each do |x|
              added, subtracted = [added, subtracted + x].max, [subtracted, added - x].max
            end
            added
          end
        `,
      },
    };
  })(),

  // ── Grid Game (LC 2017) ─────────────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid[0].length;
      let answer = Infinity;
      for (let turn1 = 0; turn1 < n; turn1++) {
        const g = [grid[0].slice(), grid[1].slice()];
        for (let c = 0; c <= turn1; c++) g[0][c] = 0;
        for (let c = turn1; c < n; c++) g[1][c] = 0;
        let second = 0;
        for (let turn2 = 0; turn2 < n; turn2++) {
          let s = 0;
          for (let c = 0; c <= turn2; c++) s += g[0][c];
          for (let c = turn2; c < n; c++) s += g[1][c];
          second = Math.max(second, s);
        }
        answer = Math.min(answer, second);
      }
      return answer;
    };
    return {
      slug: "grid-game",
      title: "Grid Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "gridGame", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`grid` has exactly 2 rows and `n` columns; `grid[r][c]` is the number of points on cell `(r, c)`. Two robots both start at `(0, 0)` and must reach `(1, n - 1)`, each moving only **right** or **down**.\n\nThe first robot moves first and collects every point on its path; those cells then hold 0. The second robot then moves and collects the points remaining on its path.\n\nThe first robot wants to **minimise** what the second robot collects, and the second robot wants to **maximise** it. Return the number of points the second robot collects when both play optimally.\n\n*CodeKairo bounds: `n` is smaller than in the original problem so that the answer fits in a 32-bit integer.*",
        [
          { in: "grid = [[3,1,2],[4,1,1]]", out: "3", note: "If the first robot goes down at column 0, the second can take the top row's remaining `1 + 2`." },
          { in: "grid = [[1,9],[9,1]]", out: "9" },
          { in: "grid = [[5],[7]]", out: "0", note: "The first robot takes both cells." },
        ],
        ["grid.length == 2", "n == grid[r].length", "1 <= n <= 2 * 10^4", "1 <= grid[r][c] <= 10^5"]),
      hints: [
        "Each robot's path is fixed by the single column where it moves down.",
        "If the first robot turns down at column `i`, what is left is the top row to the right of `i` and the bottom row to the left of `i`.",
        "The second robot can take only one of those two pieces, so it gets their maximum. Try every `i` with prefix sums and take the minimum.",
      ],
      editorial: explain({
        idea: "After the first robot turns at column `i`, only two disjoint pieces remain — the top row right of `i` and the bottom row left of `i` — and the second robot can collect one of them in full.",
        steps: [
          "Let `top` be the sum of the whole top row and `bottom = 0`.",
          "For each column `i` from left to right: subtract `grid[0][i]` from `top` (now `top` is the top row right of `i`).",
          "The second robot's best is `max(top, bottom)`; keep the minimum over all `i`.",
          "Then add `grid[1][i]` to `bottom` (the bottom row left of the next column).",
        ],
        why: "The second robot's path also goes down once: if it turns at column `j > i` it collects part of the top piece, if `j < i` part of the bottom piece, and turning exactly at the ends gathers one whole piece. Since all values are positive, the best it can do is the larger piece. The first robot picks the turn that minimises that maximum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Minimising the first robot's own score is not the goal — maximising its score can leave the second robot more.",
          "The two remaining pieces cannot both be collected, so the answer is a max of two sums, not their total.",
          "With the original bounds (`n` up to 5 * 10^4) the sums need 64 bits.",
        ],
      }),
      examples: [
        { input: "[[3,1,2],[4,1,1]]", expectedOutput: "3" },
        { input: "[[1,9],[9,1]]", expectedOutput: "9" },
        { input: "[[5],[7]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 9, 20), ri(rng, 9, 20), ri(rng, 9, 20)]);
        const hi = pick(rng, [1, 9, 100000]);
        const grid = [0, 1].map(() => Array.from({ length: n }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def gridGame(grid: List[List[int]]) -> int:
              top = sum(grid[0])
              bottom = 0
              best = None
              for i in range(len(grid[0])):
                  top -= grid[0][i]
                  second = max(top, bottom)
                  if best is None or second < best:
                      best = second
                  bottom += grid[1][i]
              return best
        `,
        javascript: code`
          var gridGame = function(grid) {
              var n = grid[0].length;
              var top = 0, bottom = 0, best = Infinity;
              for (var c = 0; c < n; c++) top += grid[0][c];
              for (var i = 0; i < n; i++) {
                  top -= grid[0][i];
                  best = Math.min(best, Math.max(top, bottom));
                  bottom += grid[1][i];
              }
              return best;
          };
        `,
        typescript: code`
          function gridGame(grid: number[][]): number {
              var n = grid[0].length;
              var top = 0, bottom = 0, best = -1;
              for (var c = 0; c < n; c++) top += grid[0][c];
              for (var i = 0; i < n; i++) {
                  top -= grid[0][i];
                  var second = Math.max(top, bottom);
                  if (best === -1 || second < best) best = second;
                  bottom += grid[1][i];
              }
              return best;
          }
        `,
        java: code`
          public static int gridGame(int[][] grid) {
              int n = grid[0].length;
              long top = 0, bottom = 0, best = Long.MAX_VALUE;
              for (int v : grid[0]) top += v;
              for (int i = 0; i < n; i++) {
                  top -= grid[0][i];
                  best = Math.min(best, Math.max(top, bottom));
                  bottom += grid[1][i];
              }
              return (int) best;
          }
        `,
        cpp: code`
          int gridGame(vector<vector<int>>& grid) {
              int n = grid[0].size();
              long long top = 0, bottom = 0, best = LLONG_MAX;
              for (int v : grid[0]) top += v;
              for (int i = 0; i < n; i++) {
                  top -= grid[0][i];
                  best = min(best, max(top, bottom));
                  bottom += grid[1][i];
              }
              return (int)best;
          }
        `,
        c: code`
          int gridGame(int** grid, int gridSize, int* gridColSize) {
              int n = gridColSize[0];
              long long top = 0, bottom = 0, best = -1;
              for (int c = 0; c < n; c++) top += grid[0][c];
              for (int i = 0; i < n; i++) {
                  top -= grid[0][i];
                  long long second = top > bottom ? top : bottom;
                  if (best < 0 || second < best) best = second;
                  bottom += grid[1][i];
              }
              return (int)best;
          }
        `,
        csharp: code`
          public static int GridGame(int[][] grid)
          {
              int n = grid[0].Length;
              long top = 0, bottom = 0, best = long.MaxValue;
              foreach (var v in grid[0]) top += v;
              for (int i = 0; i < n; i++)
              {
                  top -= grid[0][i];
                  best = Math.Min(best, Math.Max(top, bottom));
                  bottom += grid[1][i];
              }
              return (int)best;
          }
        `,
        go: code`
          func gridGame(grid [][]int) int {
              n := len(grid[0])
              top, bottom, best := 0, 0, -1
              for _, v := range grid[0] {
                  top += v
              }
              for i := 0; i < n; i++ {
                  top -= grid[0][i]
                  second := top
                  if bottom > second {
                      second = bottom
                  }
                  if best < 0 || second < best {
                      best = second
                  }
                  bottom += grid[1][i]
              }
              return best
          }
        `,
        kotlin: code`
          fun gridGame(grid: Array<IntArray>): Int {
              val n = grid[0].size
              var top = 0L
              var bottom = 0L
              var best = Long.MAX_VALUE
              for (v in grid[0]) top += v
              for (i in 0 until n) {
                  top -= grid[0][i]
                  best = Math.min(best, Math.max(top, bottom))
                  bottom += grid[1][i]
              }
              return best.toInt()
          }
        `,
        swift: code`
          func gridGame(_ grid: [[Int]]) -> Int {
              let n = grid[0].count
              var top = 0
              var bottom = 0
              var best = Int.max
              for v in grid[0] { top += v }
              for i in 0..<n {
                  top -= grid[0][i]
                  best = min(best, max(top, bottom))
                  bottom += grid[1][i]
              }
              return best
          }
        `,
        rust: code`
          fn gridGame(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid[0].len();
              let mut top: i64 = grid[0].iter().map(|&v| v as i64).sum();
              let mut bottom: i64 = 0;
              let mut best = std::i64::MAX;
              for i in 0..n {
                  top -= grid[0][i] as i64;
                  best = std::cmp::min(best, std::cmp::max(top, bottom));
                  bottom += grid[1][i] as i64;
              }
              best as i32
          }
        `,
        php: code`
          function gridGame($grid) {
              $n = count($grid[0]);
              $top = array_sum($grid[0]);
              $bottom = 0;
              $best = PHP_INT_MAX;
              for ($i = 0; $i < $n; $i++) {
                  $top -= $grid[0][$i];
                  $best = min($best, max($top, $bottom));
                  $bottom += $grid[1][$i];
              }
              return $best;
          }
        `,
        ruby: code`
          def gridGame(grid)
            n = grid[0].length
            top = grid[0].sum
            bottom = 0
            best = nil
            n.times do |i|
              top -= grid[0][i]
              second = [top, bottom].max
              best = second if best.nil? || second < best
              bottom += grid[1][i]
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make a Uni-Value Grid (LC 2033) ───────
  (() => {
    const ref = (grid: number[][], x: number) => {
      const vals: number[] = [];
      for (const row of grid) for (const v of row) vals.push(v);
      for (const v of vals) if ((v - vals[0]) % x !== 0) return -1;
      let best = Infinity;
      for (const t of vals) {
        let ops = 0;
        for (const v of vals) ops += Math.abs(v - t) / x;
        best = Math.min(best, ops);
      }
      return best;
    };
    return {
      slug: "minimum-operations-to-make-a-uni-value-grid",
      title: "Minimum Operations to Make a Uni-Value Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Sorting", "Matrix", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "grid", type: "int[][]" as const }, { name: "x", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an `m x n` integer grid and an integer `x`. In one operation you may add `x` to, or subtract `x` from, any single cell.\n\nA grid is **uni-value** when all its cells hold the same number. Return the minimum number of operations to make the grid uni-value, or `-1` if it is impossible.",
        [
          { in: "grid = [[1,4],[7,10]], x = 3", out: "4", note: "Make every cell 4: one step for 1, one for 7 and two for 10." },
          { in: "grid = [[1,2],[3,4]], x = 2", out: "-1", note: "Odd and even cells can never meet when every step is 2." },
          { in: "grid = [[6]], x = 4", out: "0" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10^5", "1 <= m * n <= 10^5", "1 <= x, grid[i][j] <= 10^4"]),
      hints: [
        "A cell's value modulo `x` never changes. What does that say about when the task is possible?",
        "If every cell has the same remainder, the cost of a target `t` is the sum of `|v - t| / x` — a sum of absolute deviations.",
        "Sum of absolute deviations is minimised at the median. Flatten, sort, and measure against the middle value.",
      ],
      editorial: explain({
        idea: "Steps of size `x` preserve each value's remainder mod `x`, so either all remainders match or the task is impossible; when they match, the cheapest common value is the median.",
        steps: [
          "Flatten the grid into a list of values.",
          "If any value has a different remainder modulo `x` from the first, return -1.",
          "Sort the values and take the median `t = vals[len / 2]`.",
          "Return the sum of `|v - t| / x` over all values.",
        ],
        why: "Every reachable value for a cell is congruent to it mod `x`, so a common value exists only if all cells share a remainder; then any value in that class — in particular every grid value — is reachable. The total cost is proportional to the sum of absolute differences from the target, which a median minimises; the median is itself a grid value, so it lies in the right residue class.",
        time: "O(k log k) for `k = m * n` cells",
        space: "O(k)",
        pitfalls: [
          "Checking `v % x` equal for all cells works only for non-negative values; comparing `(v - first) % x == 0` is the robust form.",
          "The mean is not the optimal target for absolute differences — the median is.",
          "With an even number of cells, either middle value gives the same minimum.",
        ],
      }),
      examples: [
        { input: "[[1,4],[7,10]]\n3", expectedOutput: "4" },
        { input: "[[1,2],[3,4]]\n2", expectedOutput: "-1" },
        { input: "[[6]]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = pick(rng, [1, ri(rng, 1, 3), ri(rng, 2, 6), ri(rng, 2, 6)]);
        const n = pick(rng, [1, ri(rng, 1, 3), ri(rng, 2, 6), ri(rng, 2, 6)]);
        const x = pick(rng, [1, ri(rng, 2, 5), ri(rng, 6, 100), ri(rng, 101, 3000)]);
        const mode = ri(rng, 0, 3);
        const base = ri(rng, 1, Math.min(x, 10000));
        const maxK = Math.floor((10000 - base) / x);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => base + x * ri(rng, 0, maxK)));
        if (mode === 3) {
          const r = ri(rng, 0, m - 1), c = ri(rng, 0, n - 1);
          grid[r][c] = ri(rng, 1, 10000);
        }
        return { input: `${fmtIntMat(grid)}\n${x}`, expectedOutput: String(ref(grid, x)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minOperations(grid: List[List[int]], x: int) -> int:
              vals = sorted(v for row in grid for v in row)
              first = vals[0]
              for v in vals:
                  if (v - first) % x != 0:
                      return -1
              t = vals[len(vals) // 2]
              return sum(abs(v - t) // x for v in vals)
        `,
        javascript: code`
          var minOperations = function(grid, x) {
              var vals = [];
              for (var r = 0; r < grid.length; r++) {
                  for (var c = 0; c < grid[r].length; c++) vals.push(grid[r][c]);
              }
              for (var i = 0; i < vals.length; i++) {
                  if ((vals[i] - vals[0]) % x !== 0) return -1;
              }
              vals.sort(function(a, b) { return a - b; });
              var t = vals[Math.floor(vals.length / 2)];
              var ops = 0;
              for (var j = 0; j < vals.length; j++) ops += Math.abs(vals[j] - t) / x;
              return ops;
          };
        `,
        typescript: code`
          function minOperations(grid: number[][], x: number): number {
              var vals: number[] = [];
              for (var r = 0; r < grid.length; r++) {
                  for (var c = 0; c < grid[r].length; c++) vals.push(grid[r][c]);
              }
              for (var i = 0; i < vals.length; i++) {
                  if ((vals[i] - vals[0]) % x !== 0) return -1;
              }
              vals.sort(function(a: number, b: number) { return a - b; });
              var t = vals[Math.floor(vals.length / 2)];
              var ops = 0;
              for (var j = 0; j < vals.length; j++) ops += Math.abs(vals[j] - t) / x;
              return ops;
          }
        `,
        java: code`
          public static int minOperations(int[][] grid, int x) {
              int k = 0;
              for (int[] row : grid) k += row.length;
              int[] vals = new int[k];
              int idx = 0;
              for (int[] row : grid) for (int v : row) vals[idx++] = v;
              for (int v : vals) if ((v - vals[0]) % x != 0) return -1;
              Arrays.sort(vals);
              int t = vals[k / 2];
              int ops = 0;
              for (int v : vals) ops += Math.abs(v - t) / x;
              return ops;
          }
        `,
        cpp: code`
          int minOperations(vector<vector<int>>& grid, int x) {
              vector<int> vals;
              for (auto& row : grid) for (int v : row) vals.push_back(v);
              for (int v : vals) if ((v - vals[0]) % x != 0) return -1;
              sort(vals.begin(), vals.end());
              int t = vals[vals.size() / 2];
              int ops = 0;
              for (int v : vals) ops += abs(v - t) / x;
              return ops;
          }
        `,
        c: code`
          static int cmpAsc2033(const void* p, const void* q) {
              int a = *(const int*)p, b = *(const int*)q;
              return (a > b) - (a < b);
          }

          int minOperations(int** grid, int gridSize, int* gridColSize, int x) {
              int k = 0;
              for (int r = 0; r < gridSize; r++) k += gridColSize[r];
              int* vals = (int*)malloc(sizeof(int) * (k + 1));
              int idx = 0;
              for (int r = 0; r < gridSize; r++) {
                  for (int c = 0; c < gridColSize[r]; c++) vals[idx++] = grid[r][c];
              }
              for (int i = 0; i < k; i++) {
                  if ((vals[i] - vals[0]) % x != 0) {
                      free(vals);
                      return -1;
                  }
              }
              qsort(vals, k, sizeof(int), cmpAsc2033);
              int t = vals[k / 2];
              int ops = 0;
              for (int i = 0; i < k; i++) {
                  int d = vals[i] - t;
                  if (d < 0) d = -d;
                  ops += d / x;
              }
              free(vals);
              return ops;
          }
        `,
        csharp: code`
          public static int MinOperations(int[][] grid, int x)
          {
              var vals = new List<int>();
              foreach (var row in grid) foreach (var v in row) vals.Add(v);
              foreach (var v in vals) if ((v - vals[0]) % x != 0) return -1;
              vals.Sort();
              int t = vals[vals.Count / 2];
              int ops = 0;
              foreach (var v in vals) ops += Math.Abs(v - t) / x;
              return ops;
          }
        `,
        go: code`
          func minOperations(grid [][]int, x int) int {
              vals := []int{}
              for _, row := range grid {
                  vals = append(vals, row...)
              }
              for _, v := range vals {
                  if (v-vals[0])%x != 0 {
                      return -1
                  }
              }
              sort.Ints(vals)
              t := vals[len(vals)/2]
              ops := 0
              for _, v := range vals {
                  d := v - t
                  if d < 0 {
                      d = -d
                  }
                  ops += d / x
              }
              return ops
          }
        `,
        kotlin: code`
          fun minOperations(grid: Array<IntArray>, x: Int): Int {
              val vals = ArrayList<Int>()
              for (row in grid) for (v in row) vals.add(v)
              for (v in vals) if ((v - vals[0]) % x != 0) return -1
              vals.sort()
              val t = vals[vals.size / 2]
              var ops = 0
              for (v in vals) ops += Math.abs(v - t) / x
              return ops
          }
        `,
        swift: code`
          func minOperations(_ grid: [[Int]], _ x: Int) -> Int {
              var vals = [Int]()
              for row in grid { vals.append(contentsOf: row) }
              for v in vals where (v - vals[0]) % x != 0 { return -1 }
              vals.sort()
              let t = vals[vals.count / 2]
              var ops = 0
              for v in vals { ops += abs(v - t) / x }
              return ops
          }
        `,
        rust: code`
          fn minOperations(grid: Vec<Vec<i32>>, x: i32) -> i32 {
              let mut vals: Vec<i32> = Vec::new();
              for row in grid.iter() {
                  for &v in row.iter() {
                      vals.push(v);
                  }
              }
              let first = vals[0];
              for &v in vals.iter() {
                  if (v - first) % x != 0 {
                      return -1;
                  }
              }
              vals.sort();
              let t = vals[vals.len() / 2];
              let mut ops = 0;
              for &v in vals.iter() {
                  ops += (v - t).abs() / x;
              }
              ops
          }
        `,
        php: code`
          function minOperations($grid, $x) {
              $vals = [];
              foreach ($grid as $row) foreach ($row as $v) $vals[] = $v;
              foreach ($vals as $v) if (($v - $vals[0]) % $x != 0) return -1;
              sort($vals);
              $t = $vals[intdiv(count($vals), 2)];
              $ops = 0;
              foreach ($vals as $v) $ops += intdiv(abs($v - $t), $x);
              return $ops;
          }
        `,
        ruby: code`
          def minOperations(grid, x)
            vals = grid.flatten.sort
            first = vals[0]
            return -1 if vals.any? { |v| (v - first) % x != 0 }
            t = vals[vals.length / 2]
            vals.sum { |v| (v - t).abs / x }
          end
        `,
      },
    };
  })(),

];
