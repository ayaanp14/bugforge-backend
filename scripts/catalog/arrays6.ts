/**
 * Array problems — wave 6 (Arrays I, easy).
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** `k` distinct integers drawn from [lo, hi] (the range must hold at least k). */
const sampleDistinct = (rng: Rng, k: number, lo: number, hi: number): number[] => {
  const seen = new Set<number>();
  while (seen.size < k) seen.add(ri(rng, lo, hi));
  return Array.from(seen);
};

/** A size drawn from one of a few classes, so tiny and larger arrays both show up. */
const sizeOf = (rng: Rng, classes: Array<[number, number]>): number => {
  const [lo, hi] = pick(rng, classes);
  return ri(rng, lo, hi);
};

export const ARRAYS6_PROBLEMS: CatalogProblem[] = [

  // ── Largest Number At Least Twice of Others (LC 747) ────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 1; i < nums.length; i++) if (nums[i] > nums[best]) best = i;
      for (let j = 0; j < nums.length; j++) if (j !== best && 2 * nums[j] > nums[best]) return -1;
      return best;
    };
    return {
      slug: "largest-number-at-least-twice-of-others",
      title: "Largest Number At Least Twice of Others",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Google", "Amazon"],
      signature: { funcName: "dominantIndex", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "In `nums` the largest value occurs exactly once. Call it **dominant** when it is at least twice as large as every other value in the array.\n\nReturn the index of the largest value if it is dominant, and `-1` otherwise.",
        [
          { in: "nums = [3,6,1,0]", out: "1", note: "6 is the largest value and 6 >= 2 * 3, 6 >= 2 * 1, 6 >= 2 * 0." },
          { in: "nums = [1,2,3,4]", out: "-1", note: "4 is the largest value but 4 < 2 * 3." },
          { in: "nums = [8,0,3]", out: "0" },
        ],
        ["2 <= nums.length <= 50", "0 <= nums[i] <= 100", "The largest element of nums is unique."]),
      hints: [
        "Only one other value matters: if the largest beats the runner-up by a factor of two, it beats everything else too.",
        "Find the index of the maximum in one pass.",
        "Then check `2 * nums[j] <= nums[best]` for every other index — or track the second largest during the first pass.",
      ],
      editorial: explain({
        idea: "The maximum is dominant exactly when it is at least twice the second-largest value, since every other element is no bigger than that one.",
        steps: [
          "Scan once to find `best`, the index of the maximum.",
          "Scan again: if any other index `j` has `2 * nums[j] > nums[best]`, return `-1`.",
          "Otherwise return `best`.",
        ],
        why: "The condition is a statement about every other element, and checking each of them directly is exactly what the definition asks. Because the maximum is unique, no other element is equal to it, so the comparison never trips on a duplicate of the maximum itself.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Return the index, not the value.",
          "Zeros are allowed: `[0,1]` returns 1, because 1 >= 2 * 0.",
          "Exclude the maximum itself from the check, or it fails against itself whenever it is positive.",
        ],
      }),
      examples: [
        { input: "[3,6,1,0]", expectedOutput: "1" },
        { input: "[1,2,3,4]", expectedOutput: "-1" },
        { input: "[8,0,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[2, 2], [3, 10], [11, 50]]);
        const want = rng() < 0.5;
        const cap = want ? pick(rng, [0, 5, 50]) : pick(rng, [3, 40, 99]);
        const nums = Array.from({ length: n - 1 }, () => ri(rng, 0, cap));
        const mo = Math.max(...nums);
        const top = want ? ri(rng, Math.max(2 * mo, mo + 1), 100) : ri(rng, mo + 1, mo >= 2 ? Math.min(100, 2 * mo + 2) : 100);
        nums.splice(ri(rng, 0, nums.length), 0, top);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def dominantIndex(nums: List[int]) -> int:
              best = 0
              for i in range(1, len(nums)):
                  if nums[i] > nums[best]:
                      best = i
              for j, x in enumerate(nums):
                  if j != best and x * 2 > nums[best]:
                      return -1
              return best
        `,
        javascript: code`
          var dominantIndex = function(nums) {
              var best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[best]) best = i;
              }
              for (var j = 0; j < nums.length; j++) {
                  if (j !== best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          };
        `,
        typescript: code`
          function dominantIndex(nums: number[]): number {
              var best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[best]) best = i;
              }
              for (var j = 0; j < nums.length; j++) {
                  if (j !== best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          }
        `,
        java: code`
          public static int dominantIndex(int[] nums) {
              int best = 0;
              for (int i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[best]) best = i;
              }
              for (int j = 0; j < nums.length; j++) {
                  if (j != best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          }
        `,
        cpp: code`
          int dominantIndex(vector<int>& nums) {
              int n = nums.size(), best = 0;
              for (int i = 1; i < n; i++) {
                  if (nums[i] > nums[best]) best = i;
              }
              for (int j = 0; j < n; j++) {
                  if (j != best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          }
        `,
        c: code`
          int dominantIndex(int* nums, int numsSize) {
              int best = 0;
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] > nums[best]) best = i;
              }
              for (int j = 0; j < numsSize; j++) {
                  if (j != best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          }
        `,
        csharp: code`
          public static int DominantIndex(int[] nums)
          {
              int best = 0;
              for (int i = 1; i < nums.Length; i++)
              {
                  if (nums[i] > nums[best]) best = i;
              }
              for (int j = 0; j < nums.Length; j++)
              {
                  if (j != best && nums[j] * 2 > nums[best]) return -1;
              }
              return best;
          }
        `,
        go: code`
          func dominantIndex(nums []int) int {
              best := 0
              for i := 1; i < len(nums); i++ {
                  if nums[i] > nums[best] {
                      best = i
                  }
              }
              for j, x := range nums {
                  if j != best && x*2 > nums[best] {
                      return -1
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun dominantIndex(nums: IntArray): Int {
              var best = 0
              for (i in 1 until nums.size) {
                  if (nums[i] > nums[best]) best = i
              }
              for (j in nums.indices) {
                  if (j != best && nums[j] * 2 > nums[best]) return -1
              }
              return best
          }
        `,
        swift: code`
          func dominantIndex(_ nums: [Int]) -> Int {
              var best = 0
              for i in 0..<nums.count {
                  if nums[i] > nums[best] { best = i }
              }
              for j in 0..<nums.count {
                  if j != best && nums[j] * 2 > nums[best] { return -1 }
              }
              return best
          }
        `,
        rust: code`
          fn dominantIndex(nums: Vec<i32>) -> i32 {
              let mut best = 0usize;
              for i in 1..nums.len() {
                  if nums[i] > nums[best] {
                      best = i;
                  }
              }
              for j in 0..nums.len() {
                  if j != best && nums[j] * 2 > nums[best] {
                      return -1;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function dominantIndex($nums) {
              $n = count($nums);
              $best = 0;
              for ($i = 1; $i < $n; $i++) {
                  if ($nums[$i] > $nums[$best]) $best = $i;
              }
              for ($j = 0; $j < $n; $j++) {
                  if ($j != $best && $nums[$j] * 2 > $nums[$best]) return -1;
              }
              return $best;
          }
        `,
        ruby: code`
          def dominantIndex(nums)
            best = 0
            (1...nums.length).each { |i| best = i if nums[i] > nums[best] }
            nums.each_with_index do |x, j|
              return -1 if j != best && x * 2 > nums[best]
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Valid Mountain Array (LC 941) ───────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      let i = 0;
      while (i + 1 < n && arr[i] < arr[i + 1]) i++;
      if (i === 0 || i === n - 1) return false;
      while (i + 1 < n && arr[i] > arr[i + 1]) i++;
      return i === n - 1;
    };
    return {
      slug: "valid-mountain-array",
      title: "Valid Mountain Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Google", "Adobe"],
      signature: { funcName: "validMountainArray", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "An array is a **mountain** when it has at least three elements and some peak index `p` with `0 < p < arr.length - 1` such that the values rise strictly up to `p` and fall strictly after it:\n\n- `arr[0] < arr[1] < ... < arr[p]`\n- `arr[p] > arr[p + 1] > ... > arr[arr.length - 1]`\n\nReturn `true` if `arr` is a mountain. Equal neighbours anywhere break the mountain, and so does a slope that only rises or only falls.",
        [
          { in: "arr = [2,1]", out: "false", note: "Fewer than three elements." },
          { in: "arr = [1,4,4,2]", out: "false", note: "The two 4s form a flat top, so the climb is not strict." },
          { in: "arr = [0,3,9,4,1]", out: "true" },
        ],
        ["1 <= arr.length <= 10^4", "0 <= arr[i] <= 10^4"]),
      hints: [
        "Walk up from the left while each next value is strictly larger.",
        "Where the climb stops is the only candidate peak — it must not be the first or the last index.",
        "From there, walk down while each next value is strictly smaller; the array is a mountain exactly when this walk reaches the end.",
      ],
      editorial: explain({
        idea: "A mountain has exactly one place where the strict climb ends, so a single walker that climbs as far as it can and then descends as far as it can decides the question.",
        steps: [
          "Set `i = 0` and advance while `arr[i] < arr[i + 1]`.",
          "If `i` is still 0 (no climb) or is the last index (no descent), return `false`.",
          "Advance while `arr[i] > arr[i + 1]`.",
          "Return whether `i` reached the last index.",
        ],
        why: "The first walk stops at the first index where the array does not strictly increase, which is the only possible peak: a later peak would need this non-increase to be part of a strict climb. The second walk then accepts the array only if everything after the peak strictly decreases. A plateau stops both walks early, so it is rejected automatically.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Arrays shorter than three elements are never mountains.",
          "A purely increasing or purely decreasing array has its 'peak' at an end, which is not allowed.",
          "Use strict comparisons: equal neighbours are a plateau, not a slope.",
        ],
      }),
      examples: [
        { input: "[2,1]", expectedOutput: "false" },
        { input: "[1,4,4,2]", expectedOutput: "false" },
        { input: "[0,3,9,4,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let arr: number[];
        if (rng() < 0.08) {
          arr = Array.from({ length: ri(rng, 1, 2) }, () => ri(rng, 0, 10));
        } else if (rng() < 0.1) {
          arr = Array.from({ length: ri(rng, 3, 30) }, () => ri(rng, 0, pick(rng, [3, 10000])));
        } else {
          const up = ri(rng, 1, 15), down = ri(rng, 1, 15);
          const peak = ri(rng, Math.max(up, down), pick(rng, [40, 10000]));
          const left = sampleDistinct(rng, up, 0, peak - 1).sort((a, b) => a - b);
          const right = sampleDistinct(rng, down, 0, peak - 1).sort((a, b) => b - a);
          arr = [...left, peak, ...right];
          if (rng() < 0.5) {
            const kind = ri(rng, 0, 3);
            if (kind === 0) { const j = ri(rng, 0, arr.length - 2); arr[j] = arr[j + 1]; }
            else if (kind === 1) arr = rng() < 0.5 ? [...left, peak] : [peak, ...right];
            else if (kind === 2) { const a = ri(rng, 0, arr.length - 1), b = ri(rng, 0, arr.length - 1); [arr[a], arr[b]] = [arr[b], arr[a]]; }
            else arr[ri(rng, 0, arr.length - 1)] = ri(rng, 0, 10000);
          }
        }
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validMountainArray(arr: List[int]) -> bool:
              n = len(arr)
              i = 0
              while i + 1 < n and arr[i] < arr[i + 1]:
                  i += 1
              if i == 0 or i == n - 1:
                  return False
              while i + 1 < n and arr[i] > arr[i + 1]:
                  i += 1
              return i == n - 1
        `,
        javascript: code`
          var validMountainArray = function(arr) {
              var n = arr.length, i = 0;
              while (i + 1 < n && arr[i] < arr[i + 1]) i++;
              if (i === 0 || i === n - 1) return false;
              while (i + 1 < n && arr[i] > arr[i + 1]) i++;
              return i === n - 1;
          };
        `,
        typescript: code`
          function validMountainArray(arr: number[]): boolean {
              var n = arr.length, i = 0;
              while (i + 1 < n && arr[i] < arr[i + 1]) i++;
              if (i === 0 || i === n - 1) return false;
              while (i + 1 < n && arr[i] > arr[i + 1]) i++;
              return i === n - 1;
          }
        `,
        java: code`
          public static boolean validMountainArray(int[] arr) {
              int n = arr.length, i = 0;
              while (i + 1 < n && arr[i] < arr[i + 1]) i++;
              if (i == 0 || i == n - 1) return false;
              while (i + 1 < n && arr[i] > arr[i + 1]) i++;
              return i == n - 1;
          }
        `,
        cpp: code`
          bool validMountainArray(vector<int>& arr) {
              int n = arr.size(), i = 0;
              while (i + 1 < n && arr[i] < arr[i + 1]) i++;
              if (i == 0 || i == n - 1) return false;
              while (i + 1 < n && arr[i] > arr[i + 1]) i++;
              return i == n - 1;
          }
        `,
        c: code`
          bool validMountainArray(int* arr, int arrSize) {
              int i = 0;
              while (i + 1 < arrSize && arr[i] < arr[i + 1]) i++;
              if (i == 0 || i == arrSize - 1) return false;
              while (i + 1 < arrSize && arr[i] > arr[i + 1]) i++;
              return i == arrSize - 1;
          }
        `,
        csharp: code`
          public static bool ValidMountainArray(int[] arr)
          {
              int n = arr.Length, i = 0;
              while (i + 1 < n && arr[i] < arr[i + 1]) i++;
              if (i == 0 || i == n - 1) return false;
              while (i + 1 < n && arr[i] > arr[i + 1]) i++;
              return i == n - 1;
          }
        `,
        go: code`
          func validMountainArray(arr []int) bool {
              n, i := len(arr), 0
              for i+1 < n && arr[i] < arr[i+1] {
                  i++
              }
              if i == 0 || i == n-1 {
                  return false
              }
              for i+1 < n && arr[i] > arr[i+1] {
                  i++
              }
              return i == n-1
          }
        `,
        kotlin: code`
          fun validMountainArray(arr: IntArray): Boolean {
              val n = arr.size
              var i = 0
              while (i + 1 < n && arr[i] < arr[i + 1]) i++
              if (i == 0 || i == n - 1) return false
              while (i + 1 < n && arr[i] > arr[i + 1]) i++
              return i == n - 1
          }
        `,
        swift: code`
          func validMountainArray(_ arr: [Int]) -> Bool {
              let n = arr.count
              var i = 0
              while i + 1 < n && arr[i] < arr[i + 1] { i += 1 }
              if i == 0 || i == n - 1 { return false }
              while i + 1 < n && arr[i] > arr[i + 1] { i += 1 }
              return i == n - 1
          }
        `,
        rust: code`
          fn validMountainArray(arr: Vec<i32>) -> bool {
              let n = arr.len();
              let mut i = 0usize;
              while i + 1 < n && arr[i] < arr[i + 1] {
                  i += 1;
              }
              if i == 0 || i + 1 == n {
                  return false;
              }
              while i + 1 < n && arr[i] > arr[i + 1] {
                  i += 1;
              }
              i + 1 == n
          }
        `,
        php: code`
          function validMountainArray($arr) {
              $n = count($arr);
              $i = 0;
              while ($i + 1 < $n && $arr[$i] < $arr[$i + 1]) $i++;
              if ($i == 0 || $i == $n - 1) return false;
              while ($i + 1 < $n && $arr[$i] > $arr[$i + 1]) $i++;
              return $i == $n - 1;
          }
        `,
        ruby: code`
          def validMountainArray(arr)
            n = arr.length
            i = 0
            i += 1 while i + 1 < n && arr[i] < arr[i + 1]
            return false if i == 0 || i == n - 1
            i += 1 while i + 1 < n && arr[i] > arr[i + 1]
            i == n - 1
          end
        `,
      },
    };
  })(),

  // ── Distance Between Bus Stops (LC 1184) ────────────────────────
  (() => {
    const ref = (distance: number[], start: number, destination: number) => {
      const n = distance.length;
      let cw = 0;
      for (let i = start; i !== destination; i = (i + 1) % n) cw += distance[i];
      let ccw = 0;
      for (let i = destination; i !== start; i = (i + 1) % n) ccw += distance[i];
      return Math.min(cw, ccw);
    };
    return {
      slug: "distance-between-bus-stops",
      title: "Distance Between Bus Stops",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "distanceBetweenBusStops",
        params: [{ name: "distance", type: "int[]" as const }, { name: "start", type: "int" as const }, { name: "destination", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A bus line is a loop of `n` stops numbered `0` to `n - 1`. `distance[i]` is the length of the road between stop `i` and stop `(i + 1) % n`, and the bus may travel the loop in either direction.\n\nReturn the length of the shorter way round from stop `start` to stop `destination`.",
        [
          { in: "distance = [4,1,6,2], start = 3, destination = 1", out: "6", note: "Going 3 → 0 → 1 costs 2 + 4 = 6; going 3 → 2 → 1 costs 6 + 1 = 7." },
          { in: "distance = [5,8,2], start = 0, destination = 2", out: "2" },
          { in: "distance = [2,5,9,1], start = 1, destination = 1", out: "0" },
        ],
        ["1 <= n <= 10^4", "distance.length == n", "0 <= start, destination < n", "0 <= distance[i] <= 10^4"]),
      hints: [
        "There are only two routes: clockwise and counter-clockwise.",
        "The two routes together cover the whole loop exactly once.",
        "Sum the segments between the smaller and the larger stop index; the other route is the loop total minus that.",
      ],
      editorial: explain({
        idea: "The clockwise and counter-clockwise routes split the loop between them, so one sum and the loop's total give both lengths.",
        steps: [
          "Let `lo = min(start, destination)` and `hi = max(start, destination)`.",
          "Sum `distance[lo..hi-1]` — the route that does not cross stop 0's back edge — and the whole array.",
          "Return the smaller of that sum and `total - sum`.",
        ],
        why: "Travelling from `lo` up to `hi` uses exactly the segments `lo` through `hi - 1`; the other direction uses every remaining segment. Distance is symmetric, so swapping start and destination changes nothing, and the answer is the smaller of the two complementary sums.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`start` may be larger than `destination` — normalise the pair first.",
          "When `start == destination` the answer is 0.",
          "Segment `i` joins stop `i` to stop `i + 1`, so the range is `lo` to `hi - 1`, not `hi`.",
        ],
      }),
      examples: [
        { input: "[4,1,6,2]\n3\n1", expectedOutput: "6" },
        { input: "[5,8,2]\n0\n2", expectedOutput: "2" },
        { input: "[2,5,9,1]\n1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 1], [2, 10], [11, 40]]);
        const top = pick(rng, [0, 3, 100, 10000]);
        const distance = Array.from({ length: n }, () => ri(rng, 0, top));
        const start = ri(rng, 0, n - 1), destination = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(distance)}\n${start}\n${destination}`, expectedOutput: String(ref(distance, start, destination)) };
      },
      solutions: {
        python: code`
          from typing import List

          def distanceBetweenBusStops(distance: List[int], start: int, destination: int) -> int:
              lo, hi = min(start, destination), max(start, destination)
              inner = sum(distance[lo:hi])
              return min(inner, sum(distance) - inner)
        `,
        javascript: code`
          var distanceBetweenBusStops = function(distance, start, destination) {
              var lo = Math.min(start, destination), hi = Math.max(start, destination);
              var total = 0, inner = 0;
              for (var i = 0; i < distance.length; i++) {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return Math.min(inner, total - inner);
          };
        `,
        typescript: code`
          function distanceBetweenBusStops(distance: number[], start: number, destination: number): number {
              var lo = Math.min(start, destination), hi = Math.max(start, destination);
              var total = 0, inner = 0;
              for (var i = 0; i < distance.length; i++) {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return Math.min(inner, total - inner);
          }
        `,
        java: code`
          public static int distanceBetweenBusStops(int[] distance, int start, int destination) {
              int lo = Math.min(start, destination), hi = Math.max(start, destination);
              int total = 0, inner = 0;
              for (int i = 0; i < distance.length; i++) {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return Math.min(inner, total - inner);
          }
        `,
        cpp: code`
          int distanceBetweenBusStops(vector<int>& distance, int start, int destination) {
              int lo = min(start, destination), hi = max(start, destination);
              int total = 0, inner = 0;
              for (int i = 0; i < (int)distance.size(); i++) {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return min(inner, total - inner);
          }
        `,
        c: code`
          int distanceBetweenBusStops(int* distance, int distanceSize, int start, int destination) {
              int lo = start < destination ? start : destination;
              int hi = start < destination ? destination : start;
              int total = 0, inner = 0;
              for (int i = 0; i < distanceSize; i++) {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return inner < total - inner ? inner : total - inner;
          }
        `,
        csharp: code`
          public static int DistanceBetweenBusStops(int[] distance, int start, int destination)
          {
              int lo = Math.Min(start, destination), hi = Math.Max(start, destination);
              int total = 0, inner = 0;
              for (int i = 0; i < distance.Length; i++)
              {
                  total += distance[i];
                  if (i >= lo && i < hi) inner += distance[i];
              }
              return Math.Min(inner, total - inner);
          }
        `,
        go: code`
          func distanceBetweenBusStops(distance []int, start int, destination int) int {
              lo, hi := start, destination
              if lo > hi {
                  lo, hi = hi, lo
              }
              total, inner := 0, 0
              for i, d := range distance {
                  total += d
                  if i >= lo && i < hi {
                      inner += d
                  }
              }
              if inner < total-inner {
                  return inner
              }
              return total - inner
          }
        `,
        kotlin: code`
          fun distanceBetweenBusStops(distance: IntArray, start: Int, destination: Int): Int {
              val lo = minOf(start, destination)
              val hi = maxOf(start, destination)
              var total = 0
              var inner = 0
              for (i in distance.indices) {
                  total += distance[i]
                  if (i >= lo && i < hi) inner += distance[i]
              }
              return minOf(inner, total - inner)
          }
        `,
        swift: code`
          func distanceBetweenBusStops(_ distance: [Int], _ start: Int, _ destination: Int) -> Int {
              let lo = min(start, destination), hi = max(start, destination)
              var total = 0, inner = 0
              for i in 0..<distance.count {
                  total += distance[i]
                  if i >= lo && i < hi { inner += distance[i] }
              }
              return min(inner, total - inner)
          }
        `,
        rust: code`
          fn distanceBetweenBusStops(distance: Vec<i32>, start: i32, destination: i32) -> i32 {
              let lo = start.min(destination) as usize;
              let hi = start.max(destination) as usize;
              let mut total: i32 = 0;
              let mut inner: i32 = 0;
              for i in 0..distance.len() {
                  total += distance[i];
                  if i >= lo && i < hi {
                      inner += distance[i];
                  }
              }
              inner.min(total - inner)
          }
        `,
        php: code`
          function distanceBetweenBusStops($distance, $start, $destination) {
              $lo = min($start, $destination);
              $hi = max($start, $destination);
              $total = 0;
              $inner = 0;
              foreach ($distance as $i => $d) {
                  $total += $d;
                  if ($i >= $lo && $i < $hi) $inner += $d;
              }
              return min($inner, $total - $inner);
          }
        `,
        ruby: code`
          def distanceBetweenBusStops(distance, start, destination)
            lo, hi = [start, destination].minmax
            inner = distance[lo...hi].sum
            [inner, distance.sum - inner].min
          end
        `,
      },
    };
  })(),

  // ── Element Appearing More Than 25% In Sorted Array (LC 1287) ───
  (() => {
    const ref = (arr: number[]) => {
      const count = new Map<number, number>();
      for (const v of arr) count.set(v, (count.get(v) || 0) + 1);
      for (const [v, c] of count) if (4 * c > arr.length) return v;
      return -1;
    };
    return {
      slug: "element-appearing-more-than-25-in-sorted-array",
      title: "Element Appearing More Than 25% In Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Meta"],
      signature: { funcName: "findSpecialInteger", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`arr` is sorted in non-decreasing order, and exactly one value in it occurs **more than** 25% of the time — that is, its count `c` satisfies `4 * c > arr.length`.\n\nReturn that value.",
        [
          { in: "arr = [1,2,2,6,6,6,6,7,10]", out: "6", note: "6 appears 4 times out of 9, which is more than a quarter." },
          { in: "arr = [1,1]", out: "1" },
          { in: "arr = [4,7,7,7,9]", out: "7" },
        ],
        ["1 <= arr.length <= 10^4", "0 <= arr[i] <= 10^5", "arr is sorted in non-decreasing order", "Exactly one value occurs more than 25% of the time"]),
      hints: [
        "Equal values sit next to each other because the array is sorted.",
        "A value occurring more than `n / 4` times covers a block longer than `n / 4` positions.",
        "Let `step = floor(n / 4)`. The answer is the first `arr[i]` with `arr[i] == arr[i + step]`.",
      ],
      editorial: explain({
        idea: "In a sorted array a value with more than `n / 4` copies forms one contiguous block of length at least `floor(n / 4) + 1`, so its first element equals the element `floor(n / 4)` places later.",
        steps: [
          "Let `step = floor(n / 4)`.",
          "For each `i` with `i + step < n`, return `arr[i]` as soon as `arr[i] == arr[i + step]`.",
        ],
        why: "If `arr[i] == arr[i + step]`, sortedness forces all `step + 1` positions between them to hold the same value, so that value occurs at least `floor(n / 4) + 1` times, which is more than `n / 4`. Conversely the special value's block is that long, so the scan finds it at the block's first index at the latest. Since only one value qualifies, the first hit is the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "\"More than 25%\" means `4 * count > n`; with `n = 8` a value needs 3 copies, not 2.",
          "When `n < 4`, `step` is 0 and the first element is returned — correct, since then the whole array is one value.",
          "Counting with a hash map works but ignores the sortedness the problem gives you.",
        ],
      }),
      examples: [
        { input: "[1,2,2,6,6,6,6,7,10]", expectedOutput: "6" },
        { input: "[1,1]", expectedOutput: "1" },
        { input: "[4,7,7,7,9]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 60]]);
        const q = Math.floor(n / 4);
        const special = q === 0 ? n : ri(rng, q + 1, Math.min(n, q + 1 + pick(rng, [0, 2, n])));
        const groups: number[] = [special];
        let rest = n - special;
        while (rest > 0) {
          const k = ri(rng, 1, Math.min(q, rest));
          groups.push(k);
          rest -= k;
        }
        const values = sampleDistinct(rng, groups.length, 0, pick(rng, [80, 100000]));
        const arr: number[] = [];
        groups.forEach((k, g) => { for (let t = 0; t < k; t++) arr.push(values[g]); });
        arr.sort((a, b) => a - b);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findSpecialInteger(arr: List[int]) -> int:
              step = len(arr) // 4
              for i in range(len(arr) - step):
                  if arr[i] == arr[i + step]:
                      return arr[i]
              return arr[0]
        `,
        javascript: code`
          var findSpecialInteger = function(arr) {
              var step = Math.floor(arr.length / 4);
              for (var i = 0; i + step < arr.length; i++) {
                  if (arr[i] === arr[i + step]) return arr[i];
              }
              return arr[0];
          };
        `,
        typescript: code`
          function findSpecialInteger(arr: number[]): number {
              var step = Math.floor(arr.length / 4);
              for (var i = 0; i + step < arr.length; i++) {
                  if (arr[i] === arr[i + step]) return arr[i];
              }
              return arr[0];
          }
        `,
        java: code`
          public static int findSpecialInteger(int[] arr) {
              int step = arr.length / 4;
              for (int i = 0; i + step < arr.length; i++) {
                  if (arr[i] == arr[i + step]) return arr[i];
              }
              return arr[0];
          }
        `,
        cpp: code`
          int findSpecialInteger(vector<int>& arr) {
              int n = arr.size(), step = n / 4;
              for (int i = 0; i + step < n; i++) {
                  if (arr[i] == arr[i + step]) return arr[i];
              }
              return arr[0];
          }
        `,
        c: code`
          int findSpecialInteger(int* arr, int arrSize) {
              int step = arrSize / 4;
              for (int i = 0; i + step < arrSize; i++) {
                  if (arr[i] == arr[i + step]) return arr[i];
              }
              return arr[0];
          }
        `,
        csharp: code`
          public static int FindSpecialInteger(int[] arr)
          {
              int step = arr.Length / 4;
              for (int i = 0; i + step < arr.Length; i++)
              {
                  if (arr[i] == arr[i + step]) return arr[i];
              }
              return arr[0];
          }
        `,
        go: code`
          func findSpecialInteger(arr []int) int {
              step := len(arr) / 4
              for i := 0; i+step < len(arr); i++ {
                  if arr[i] == arr[i+step] {
                      return arr[i]
                  }
              }
              return arr[0]
          }
        `,
        kotlin: code`
          fun findSpecialInteger(arr: IntArray): Int {
              val step = arr.size / 4
              var i = 0
              while (i + step < arr.size) {
                  if (arr[i] == arr[i + step]) return arr[i]
                  i++
              }
              return arr[0]
          }
        `,
        swift: code`
          func findSpecialInteger(_ arr: [Int]) -> Int {
              let step = arr.count / 4
              var i = 0
              while i + step < arr.count {
                  if arr[i] == arr[i + step] { return arr[i] }
                  i += 1
              }
              return arr[0]
          }
        `,
        rust: code`
          fn findSpecialInteger(arr: Vec<i32>) -> i32 {
              let step = arr.len() / 4;
              let mut i = 0usize;
              while i + step < arr.len() {
                  if arr[i] == arr[i + step] {
                      return arr[i];
                  }
                  i += 1;
              }
              arr[0]
          }
        `,
        php: code`
          function findSpecialInteger($arr) {
              $n = count($arr);
              $step = intdiv($n, 4);
              for ($i = 0; $i + $step < $n; $i++) {
                  if ($arr[$i] == $arr[$i + $step]) return $arr[$i];
              }
              return $arr[0];
          }
        `,
        ruby: code`
          def findSpecialInteger(arr)
            step = arr.length / 4
            (0...(arr.length - step)).each do |i|
              return arr[i] if arr[i] == arr[i + step]
            end
            arr[0]
          end
        `,
      },
    };
  })(),

  // ── Make Two Arrays Equal by Reversing Subarrays (LC 1460) ──────
  (() => {
    const ref = (target: number[], arr: number[]) => {
      const a = target.slice().sort((x, y) => x - y), b = arr.slice().sort((x, y) => x - y);
      return a.every((v, i) => v === b[i]);
    };
    return {
      slug: "make-two-arrays-equal-by-reversing-subarrays",
      title: "Make Two Arrays Equal by Reversing Subarrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Meta", "Amazon"],
      signature: {
        funcName: "canBeEqual",
        params: [{ name: "target", type: "int[]" as const }, { name: "arr", type: "int[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You get two integer arrays `target` and `arr` of the same length. In one move you may pick any non-empty contiguous subarray of `arr` and reverse it, and you may make as many moves as you like.\n\nReturn `true` if some sequence of moves turns `arr` into `target`.",
        [
          { in: "target = [1,2,3,4], arr = [2,4,1,3]", out: "true", note: "Reverse [2,4,1] to get [1,4,2,3], then [4,2] to get [1,2,4,3], then [4,3] to get [1,2,3,4]." },
          { in: "target = [7], arr = [7]", out: "true" },
          { in: "target = [3,7,9], arr = [3,7,11]", out: "false", note: "`arr` has no 9, and reversing never creates a value." },
        ],
        ["target.length == arr.length", "1 <= target.length <= 1000", "1 <= target[i] <= 1000", "1 <= arr[i] <= 1000"]),
      hints: [
        "Reversing a subarray of length 2 swaps two neighbours.",
        "Adjacent swaps are enough to sort any array — so they can produce any arrangement of the same values.",
        "The answer only depends on whether both arrays hold the same values with the same multiplicities.",
      ],
      editorial: explain({
        idea: "Reversals of length 2 are adjacent swaps, and adjacent swaps reach every permutation; reversals never change which values are present. So the arrays can be made equal exactly when they are equal as multisets.",
        steps: [
          "Keep a count per value (values are at most 1000).",
          "Add 1 for every value of `target` and subtract 1 for every value of `arr`.",
          "Return `true` if every count ends at zero.",
        ],
        why: "Bubble sort shows that adjacent swaps can move `arr` into any order of its own elements, including the order of `target` when the multisets agree. If the multisets differ, no reversal can help, because a reversal only rearranges existing elements.",
        time: "O(n + V) with V = 1000",
        space: "O(V)",
        pitfalls: [
          "Comparing sets instead of counts misses duplicates: `[1,1,2]` and `[1,2,2]` are not equal.",
          "There is no limit on the number of moves, so do not simulate them.",
          "Sorting both copies is fine too, in O(n log n).",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]\n[2,4,1,3]", expectedOutput: "true" },
        { input: "[7]\n[7]", expectedOutput: "true" },
        { input: "[3,7,9]\n[3,7,11]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 2], [3, 10], [11, 40]]);
        const top = pick(rng, [3, 20, 1000]);
        const target = Array.from({ length: n }, () => ri(rng, 1, top));
        const arr = shuffle(rng, target.slice());
        if (rng() < 0.5) arr[ri(rng, 0, n - 1)] = ri(rng, 1, top);
        return { input: `${fmtIntArr(target)}\n${fmtIntArr(arr)}`, expectedOutput: bool(ref(target, arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def canBeEqual(target: List[int], arr: List[int]) -> bool:
              return sorted(target) == sorted(arr)
        `,
        javascript: code`
          var canBeEqual = function(target, arr) {
              var count = new Map();
              for (var i = 0; i < target.length; i++) {
                  count.set(target[i], (count.get(target[i]) || 0) + 1);
                  count.set(arr[i], (count.get(arr[i]) || 0) - 1);
              }
              var ok = true;
              count.forEach(function(c) {
                  if (c !== 0) ok = false;
              });
              return ok;
          };
        `,
        typescript: code`
          function canBeEqual(target: number[], arr: number[]): boolean {
              var count: number[] = [];
              for (var v = 0; v <= 1000; v++) count.push(0);
              for (var i = 0; i < target.length; i++) {
                  count[target[i]]++;
                  count[arr[i]]--;
              }
              for (var w = 0; w <= 1000; w++) {
                  if (count[w] !== 0) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean canBeEqual(int[] target, int[] arr) {
              int[] count = new int[1001];
              for (int i = 0; i < target.length; i++) {
                  count[target[i]]++;
                  count[arr[i]]--;
              }
              for (int c : count) {
                  if (c != 0) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool canBeEqual(vector<int>& target, vector<int>& arr) {
              vector<int> count(1001, 0);
              for (size_t i = 0; i < target.size(); i++) {
                  count[target[i]]++;
                  count[arr[i]]--;
              }
              for (int c : count) {
                  if (c != 0) return false;
              }
              return true;
          }
        `,
        c: code`
          bool canBeEqual(int* target, int targetSize, int* arr, int arrSize) {
              int count[1001] = { 0 };
              for (int i = 0; i < targetSize; i++) count[target[i]]++;
              for (int i = 0; i < arrSize; i++) count[arr[i]]--;
              for (int v = 0; v <= 1000; v++) {
                  if (count[v] != 0) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CanBeEqual(int[] target, int[] arr)
          {
              int[] count = new int[1001];
              for (int i = 0; i < target.Length; i++)
              {
                  count[target[i]]++;
                  count[arr[i]]--;
              }
              foreach (int c in count)
              {
                  if (c != 0) return false;
              }
              return true;
          }
        `,
        go: code`
          func canBeEqual(target []int, arr []int) bool {
              count := make([]int, 1001)
              for i := range target {
                  count[target[i]]++
                  count[arr[i]]--
              }
              for _, c := range count {
                  if c != 0 {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun canBeEqual(target: IntArray, arr: IntArray): Boolean {
              val count = IntArray(1001)
              for (i in target.indices) {
                  count[target[i]]++
                  count[arr[i]]--
              }
              return count.all { it == 0 }
          }
        `,
        swift: code`
          func canBeEqual(_ target: [Int], _ arr: [Int]) -> Bool {
              var count = [Int](repeating: 0, count: 1001)
              for i in 0..<target.count {
                  count[target[i]] += 1
                  count[arr[i]] -= 1
              }
              for c in count where c != 0 { return false }
              return true
          }
        `,
        rust: code`
          fn canBeEqual(target: Vec<i32>, arr: Vec<i32>) -> bool {
              let mut count = vec![0i32; 1001];
              for i in 0..target.len() {
                  count[target[i] as usize] += 1;
                  count[arr[i] as usize] -= 1;
              }
              count.iter().all(|&c| c == 0)
          }
        `,
        php: code`
          function canBeEqual($target, $arr) {
              sort($target);
              sort($arr);
              return $target === $arr;
          }
        `,
        ruby: code`
          def canBeEqual(target, arr)
            target.sort == arr.sort
          end
        `,
      },
    };
  })(),

  // ── Detect Pattern of Length M Repeated K or More Times (LC 1566) ─
  (() => {
    const ref = (arr: number[], m: number, k: number) => {
      for (let s = 0; s + m * k <= arr.length; s++) {
        let ok = true;
        for (let j = 0; j < m * k && ok; j++) if (arr[s + j] !== arr[s + (j % m)]) ok = false;
        if (ok) return true;
      }
      return false;
    };
    return {
      slug: "detect-pattern-of-length-m-repeated-k-or-more-times",
      title: "Detect Pattern of Length M Repeated K or More Times",
      difficulty: "EASY" as const,
      tags: ["Array", "Enumeration", "Google", "Amazon"],
      signature: {
        funcName: "containsPattern",
        params: [{ name: "arr", type: "int[]" as const }, { name: "m", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A **pattern** is a contiguous subarray of length `m`. It is **repeated `k` times** when `k` copies of it appear back to back in `arr`, without overlapping — that is, some block of `m * k` consecutive elements is the pattern written `k` times in a row.\n\nReturn `true` if `arr` contains a pattern of length `m` repeated `k` or more times.",
        [
          { in: "arr = [3,5,5,5,5,2], m = 1, k = 3", out: "true", note: "The pattern [5] occurs four times in a row." },
          { in: "arr = [1,2,1,2,1,3], m = 2, k = 3", out: "false", note: "[1,2] occurs twice in a row, then the run breaks." },
          { in: "arr = [6,4,6,4,6,4,6,4], m = 2, k = 4", out: "true" },
        ],
        ["2 <= arr.length <= 100", "1 <= arr[i] <= 100", "1 <= m <= 100", "2 <= k <= 100"]),
      hints: [
        "A block made of `k` copies of an `m`-element pattern is exactly a block of length `m * k` in which every element equals the one `m` places later.",
        "Compare `arr[i]` with `arr[i + m]` for every valid `i`.",
        "Count how many consecutive indices pass that comparison; reaching `(k - 1) * m` means you have found the block.",
      ],
      editorial: explain({
        idea: "`k` back-to-back copies of a length-`m` pattern form a block of length `m * k` with period `m`. Period `m` over that block means `(k - 1) * m` consecutive indices `i` with `arr[i] == arr[i + m]`.",
        steps: [
          "Set `run = 0`.",
          "For each `i` from 0 while `i + m < n`: if `arr[i] == arr[i + m]`, increment `run` and return `true` once it reaches `(k - 1) * m`; otherwise reset `run` to 0.",
          "Return `false` after the scan.",
        ],
        why: "If indices `s` to `s + (k - 1) * m - 1` all satisfy `arr[i] == arr[i + m]`, then every element of `arr[s .. s + k * m - 1]` equals the element `m` before it, so the block is the first `m` elements repeated `k` times. Conversely such a block yields that run of matches. The counter finds any such run in one pass.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`m * k` can exceed the array length; the loop then never fires and the answer is `false`.",
          "Reset the run on a mismatch — matches separated by a break do not combine.",
          "Copies must not overlap: [1,1,1] holds the pattern [1,1] only once.",
        ],
      }),
      examples: [
        { input: "[3,5,5,5,5,2]\n1\n3", expectedOutput: "true" },
        { input: "[1,2,1,2,1,3]\n2\n3", expectedOutput: "false" },
        { input: "[6,4,6,4,6,4,6,4]\n2\n4", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [2, 3, 100]);
        if (rng() < 0.2) {
          const arr = Array.from({ length: sizeOf(rng, [[2, 10], [11, 40]]) }, () => ri(rng, 1, top));
          const m = ri(rng, 1, pick(rng, [3, 100])), k = ri(rng, 2, pick(rng, [4, 100]));
          return { input: `${fmtIntArr(arr)}\n${m}\n${k}`, expectedOutput: bool(ref(arr, m, k)) };
        }
        const m = ri(rng, 1, 6), k = ri(rng, 2, 6);
        const reps = Math.max(1, k + ri(rng, -1, 1));
        const pattern = Array.from({ length: m }, () => ri(rng, 1, top));
        const block: number[] = [];
        for (let r = 0; r < reps; r++) block.push(...pattern);
        const before = ri(rng, 0, 8), after = ri(rng, 0, 8);
        const arr = [
          ...Array.from({ length: before }, () => ri(rng, 1, top)),
          ...block,
          ...Array.from({ length: after }, () => ri(rng, 1, top)),
        ];
        while (arr.length < 2) arr.push(ri(rng, 1, top));
        if (rng() < 0.25) arr[ri(rng, 0, arr.length - 1)] = ri(rng, 1, top);
        return { input: `${fmtIntArr(arr)}\n${m}\n${k}`, expectedOutput: bool(ref(arr, m, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def containsPattern(arr: List[int], m: int, k: int) -> bool:
              run = 0
              for i in range(len(arr) - m):
                  if arr[i] == arr[i + m]:
                      run += 1
                      if run == (k - 1) * m:
                          return True
                  else:
                      run = 0
              return False
        `,
        javascript: code`
          var containsPattern = function(arr, m, k) {
              var run = 0;
              for (var i = 0; i + m < arr.length; i++) {
                  if (arr[i] === arr[i + m]) {
                      run++;
                      if (run === (k - 1) * m) return true;
                  } else {
                      run = 0;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function containsPattern(arr: number[], m: number, k: number): boolean {
              var run = 0;
              for (var i = 0; i + m < arr.length; i++) {
                  if (arr[i] === arr[i + m]) {
                      run++;
                      if (run === (k - 1) * m) return true;
                  } else {
                      run = 0;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean containsPattern(int[] arr, int m, int k) {
              int run = 0;
              for (int i = 0; i + m < arr.length; i++) {
                  if (arr[i] == arr[i + m]) {
                      run++;
                      if (run == (k - 1) * m) return true;
                  } else {
                      run = 0;
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool containsPattern(vector<int>& arr, int m, int k) {
              int n = arr.size(), run = 0;
              for (int i = 0; i + m < n; i++) {
                  if (arr[i] == arr[i + m]) {
                      run++;
                      if (run == (k - 1) * m) return true;
                  } else {
                      run = 0;
                  }
              }
              return false;
          }
        `,
        c: code`
          bool containsPattern(int* arr, int arrSize, int m, int k) {
              int run = 0;
              for (int i = 0; i + m < arrSize; i++) {
                  if (arr[i] == arr[i + m]) {
                      run++;
                      if (run == (k - 1) * m) return true;
                  } else {
                      run = 0;
                  }
              }
              return false;
          }
        `,
        csharp: code`
          public static bool ContainsPattern(int[] arr, int m, int k)
          {
              int run = 0;
              for (int i = 0; i + m < arr.Length; i++)
              {
                  if (arr[i] == arr[i + m])
                  {
                      run++;
                      if (run == (k - 1) * m) return true;
                  }
                  else
                  {
                      run = 0;
                  }
              }
              return false;
          }
        `,
        go: code`
          func containsPattern(arr []int, m int, k int) bool {
              run := 0
              for i := 0; i+m < len(arr); i++ {
                  if arr[i] == arr[i+m] {
                      run++
                      if run == (k-1)*m {
                          return true
                      }
                  } else {
                      run = 0
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun containsPattern(arr: IntArray, m: Int, k: Int): Boolean {
              var run = 0
              var i = 0
              while (i + m < arr.size) {
                  if (arr[i] == arr[i + m]) {
                      run++
                      if (run == (k - 1) * m) return true
                  } else {
                      run = 0
                  }
                  i++
              }
              return false
          }
        `,
        swift: code`
          func containsPattern(_ arr: [Int], _ m: Int, _ k: Int) -> Bool {
              var run = 0
              var i = 0
              while i + m < arr.count {
                  if arr[i] == arr[i + m] {
                      run += 1
                      if run == (k - 1) * m { return true }
                  } else {
                      run = 0
                  }
                  i += 1
              }
              return false
          }
        `,
        rust: code`
          fn containsPattern(arr: Vec<i32>, m: i32, k: i32) -> bool {
              let m = m as usize;
              let need = (k as usize - 1) * m;
              let mut run = 0usize;
              let mut i = 0usize;
              while i + m < arr.len() {
                  if arr[i] == arr[i + m] {
                      run += 1;
                      if run == need {
                          return true;
                      }
                  } else {
                      run = 0;
                  }
                  i += 1;
              }
              false
          }
        `,
        php: code`
          function containsPattern($arr, $m, $k) {
              $n = count($arr);
              $run = 0;
              for ($i = 0; $i + $m < $n; $i++) {
                  if ($arr[$i] == $arr[$i + $m]) {
                      $run++;
                      if ($run == ($k - 1) * $m) return true;
                  } else {
                      $run = 0;
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def containsPattern(arr, m, k)
            run = 0
            i = 0
            while i + m < arr.length
              if arr[i] == arr[i + m]
                run += 1
                return true if run == (k - 1) * m
              else
                run = 0
              end
              i += 1
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Check Array Formation Through Concatenation (LC 1640) ───────
  (() => {
    const ref = (arr: number[], pieces: number[][]) => {
      for (const p of pieces) {
        const at = arr.indexOf(p[0]);
        if (at < 0) return false;
        for (let j = 0; j < p.length; j++) if (arr[at + j] !== p[j]) return false;
      }
      return true;
    };
    return {
      slug: "check-array-formation-through-concatenation",
      title: "Check Array Formation Through Concatenation",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Google", "Amazon"],
      signature: {
        funcName: "canFormArray",
        params: [{ name: "arr", type: "int[]" as const }, { name: "pieces", type: "int[][]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "`arr` holds distinct integers, and `pieces` is a list of integer arrays whose values, taken all together, are also distinct. The pieces hold exactly as many numbers as `arr`.\n\nYou may place the pieces one after another **in any order**, but you may not reorder the numbers **inside** a piece. Return `true` if some order of the pieces concatenates to exactly `arr`.",
        [
          { in: "arr = [12,40], pieces = [[40],[12]]", out: "true", note: "Place [12] then [40]." },
          { in: "arr = [7,3,9], pieces = [[9,3,7]]", out: "false", note: "The single piece cannot be reversed." },
          { in: "arr = [5,21,8,30], pieces = [[30],[21,8],[5]]", out: "true" },
        ],
        [
          "1 <= pieces.length <= arr.length <= 100",
          "sum(pieces[i].length) == arr.length",
          "1 <= pieces[i].length <= arr.length",
          "1 <= arr[i], pieces[i][j] <= 100",
          "The integers in arr are distinct",
          "The integers in pieces are distinct (across all pieces)",
        ]),
      hints: [
        "Because all values are distinct, the first element of a piece can only go in one place.",
        "Walk through `arr` from the left; the value at the current position must start some piece.",
        "Index the pieces by their first element, then match that piece element by element and jump past it.",
      ],
      editorial: explain({
        idea: "Distinct values make the choice forced: whatever value sits at the current position of `arr` must be the first element of the next piece, and there is at most one piece that starts with it.",
        steps: [
          "Map each piece's first element to the piece.",
          "Set `i = 0`. While `i < n`: look up the piece starting with `arr[i]`; if there is none, return `false`.",
          "Compare that piece with `arr[i..]` element by element; on any mismatch return `false`; otherwise advance `i` by the piece's length.",
          "Return `true` when `i` reaches `n`.",
        ],
        why: "At every step only one piece could be placed next, so the greedy walk is the only possible arrangement — if it fails, nothing succeeds. When it succeeds, it has consumed `arr` exactly, and since the pieces hold exactly `n` distinct values, every piece was used once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The order inside a piece is fixed — a piece cannot be reversed or rotated.",
          "A piece can be longer than what remains of `arr`; check bounds while matching.",
          "Values go up to 100, so a 101-slot array works as the index instead of a hash map.",
        ],
      }),
      examples: [
        { input: "[12,40]\n[[40],[12]]", expectedOutput: "true" },
        { input: "[7,3,9]\n[[9,3,7]]", expectedOutput: "false" },
        { input: "[5,21,8,30]\n[[30],[21,8],[5]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 40]]);
        const arr = sampleDistinct(rng, n, 1, pick(rng, [n + 10, 100]));
        const pieces: number[][] = [];
        let at = 0;
        while (at < n) {
          const len = ri(rng, 1, Math.min(n - at, pick(rng, [1, 3, 8])));
          pieces.push(arr.slice(at, at + len));
          at += len;
        }
        shuffle(rng, pieces);
        if (rng() < 0.5) {
          const kind = ri(rng, 0, 2);
          const long = pieces.filter((p) => p.length >= 2);
          if (kind === 0 && long.length) {
            const p = pick(rng, long);
            const a = ri(rng, 0, p.length - 1), b = ri(rng, 0, p.length - 1);
            [p[a], p[b]] = [p[b], p[a]];
          } else if (kind === 1 && n < 100) {
            const used = new Set(arr);
            let fresh = ri(rng, 1, 100);
            while (used.has(fresh)) fresh = ri(rng, 1, 100);
            const p = pick(rng, pieces);
            p[ri(rng, 0, p.length - 1)] = fresh;
          } else if (n >= 2) {
            const i = ri(rng, 0, n - 2);
            [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          }
        }
        return { input: `${fmtIntArr(arr)}\n${fmtIntMat(pieces)}`, expectedOutput: bool(ref(arr, pieces)) };
      },
      solutions: {
        python: code`
          from typing import List

          def canFormArray(arr: List[int], pieces: List[List[int]]) -> bool:
              first = {p[0]: p for p in pieces}
              i = 0
              while i < len(arr):
                  p = first.get(arr[i])
                  if p is None or arr[i:i + len(p)] != p:
                      return False
                  i += len(p)
              return True
        `,
        javascript: code`
          var canFormArray = function(arr, pieces) {
              var first = new Map();
              for (var p = 0; p < pieces.length; p++) first.set(pieces[p][0], pieces[p]);
              var i = 0;
              while (i < arr.length) {
                  var piece = first.get(arr[i]);
                  if (piece === undefined) return false;
                  for (var j = 0; j < piece.length; j++) {
                      if (i + j >= arr.length || arr[i + j] !== piece[j]) return false;
                  }
                  i += piece.length;
              }
              return true;
          };
        `,
        typescript: code`
          function canFormArray(arr: number[], pieces: number[][]): boolean {
              var first: number[] = [];
              for (var v = 0; v <= 100; v++) first.push(-1);
              for (var p = 0; p < pieces.length; p++) first[pieces[p][0]] = p;
              var i = 0;
              while (i < arr.length) {
                  var idx = first[arr[i]];
                  if (idx < 0) return false;
                  var piece = pieces[idx];
                  for (var j = 0; j < piece.length; j++) {
                      if (i + j >= arr.length || arr[i + j] !== piece[j]) return false;
                  }
                  i += piece.length;
              }
              return true;
          }
        `,
        java: code`
          public static boolean canFormArray(int[] arr, int[][] pieces) {
              int[] first = new int[101];
              Arrays.fill(first, -1);
              for (int p = 0; p < pieces.length; p++) first[pieces[p][0]] = p;
              int i = 0;
              while (i < arr.length) {
                  int idx = first[arr[i]];
                  if (idx < 0) return false;
                  int[] piece = pieces[idx];
                  for (int j = 0; j < piece.length; j++) {
                      if (i + j >= arr.length || arr[i + j] != piece[j]) return false;
                  }
                  i += piece.length;
              }
              return true;
          }
        `,
        cpp: code`
          bool canFormArray(vector<int>& arr, vector<vector<int>>& pieces) {
              vector<int> first(101, -1);
              for (int p = 0; p < (int)pieces.size(); p++) first[pieces[p][0]] = p;
              int n = arr.size(), i = 0;
              while (i < n) {
                  int idx = first[arr[i]];
                  if (idx < 0) return false;
                  const vector<int>& piece = pieces[idx];
                  for (int j = 0; j < (int)piece.size(); j++) {
                      if (i + j >= n || arr[i + j] != piece[j]) return false;
                  }
                  i += piece.size();
              }
              return true;
          }
        `,
        c: code`
          bool canFormArray(int* arr, int arrSize, int** pieces, int piecesSize, int* piecesColSize) {
              int first[101];
              for (int v = 0; v <= 100; v++) first[v] = -1;
              for (int p = 0; p < piecesSize; p++) first[pieces[p][0]] = p;
              int i = 0;
              while (i < arrSize) {
                  int idx = first[arr[i]];
                  if (idx < 0) return false;
                  for (int j = 0; j < piecesColSize[idx]; j++) {
                      if (i + j >= arrSize || arr[i + j] != pieces[idx][j]) return false;
                  }
                  i += piecesColSize[idx];
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CanFormArray(int[] arr, int[][] pieces)
          {
              int[] first = new int[101];
              for (int v = 0; v <= 100; v++) first[v] = -1;
              for (int p = 0; p < pieces.Length; p++) first[pieces[p][0]] = p;
              int i = 0;
              while (i < arr.Length)
              {
                  int idx = first[arr[i]];
                  if (idx < 0) return false;
                  int[] piece = pieces[idx];
                  for (int j = 0; j < piece.Length; j++)
                  {
                      if (i + j >= arr.Length || arr[i + j] != piece[j]) return false;
                  }
                  i += piece.Length;
              }
              return true;
          }
        `,
        go: code`
          func canFormArray(arr []int, pieces [][]int) bool {
              first := make([]int, 101)
              for v := range first {
                  first[v] = -1
              }
              for p, piece := range pieces {
                  first[piece[0]] = p
              }
              i := 0
              for i < len(arr) {
                  idx := first[arr[i]]
                  if idx < 0 {
                      return false
                  }
                  piece := pieces[idx]
                  for j := 0; j < len(piece); j++ {
                      if i+j >= len(arr) || arr[i+j] != piece[j] {
                          return false
                      }
                  }
                  i += len(piece)
              }
              return true
          }
        `,
        kotlin: code`
          fun canFormArray(arr: IntArray, pieces: Array<IntArray>): Boolean {
              val first = IntArray(101) { -1 }
              for (p in pieces.indices) first[pieces[p][0]] = p
              var i = 0
              while (i < arr.size) {
                  val idx = first[arr[i]]
                  if (idx < 0) return false
                  val piece = pieces[idx]
                  for (j in piece.indices) {
                      if (i + j >= arr.size || arr[i + j] != piece[j]) return false
                  }
                  i += piece.size
              }
              return true
          }
        `,
        swift: code`
          func canFormArray(_ arr: [Int], _ pieces: [[Int]]) -> Bool {
              var first = [Int](repeating: -1, count: 101)
              for p in 0..<pieces.count { first[pieces[p][0]] = p }
              var i = 0
              while i < arr.count {
                  let idx = first[arr[i]]
                  if idx < 0 { return false }
                  let piece = pieces[idx]
                  for j in 0..<piece.count {
                      if i + j >= arr.count || arr[i + j] != piece[j] { return false }
                  }
                  i += piece.count
              }
              return true
          }
        `,
        rust: code`
          fn canFormArray(arr: Vec<i32>, pieces: Vec<Vec<i32>>) -> bool {
              let mut first = vec![-1i32; 101];
              for (p, piece) in pieces.iter().enumerate() {
                  first[piece[0] as usize] = p as i32;
              }
              let mut i = 0usize;
              while i < arr.len() {
                  let idx = first[arr[i] as usize];
                  if idx < 0 {
                      return false;
                  }
                  let piece = &pieces[idx as usize];
                  for j in 0..piece.len() {
                      if i + j >= arr.len() || arr[i + j] != piece[j] {
                          return false;
                      }
                  }
                  i += piece.len();
              }
              true
          }
        `,
        php: code`
          function canFormArray($arr, $pieces) {
              $first = [];
              foreach ($pieces as $p => $piece) $first[$piece[0]] = $p;
              $n = count($arr);
              $i = 0;
              while ($i < $n) {
                  if (!isset($first[$arr[$i]])) return false;
                  $piece = $pieces[$first[$arr[$i]]];
                  $len = count($piece);
                  for ($j = 0; $j < $len; $j++) {
                      if ($i + $j >= $n || $arr[$i + $j] != $piece[$j]) return false;
                  }
                  $i += $len;
              }
              return true;
          }
        `,
        ruby: code`
          def canFormArray(arr, pieces)
            first = {}
            pieces.each { |p| first[p[0]] = p }
            i = 0
            while i < arr.length
              piece = first[arr[i]]
              return false if piece.nil? || arr[i, piece.length] != piece
              i += piece.length
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Get Maximum in Generated Array (LC 1646) ────────────────────
  (() => {
    const ref = (n: number) => {
      const nums = new Array<number>(n + 1).fill(0);
      if (n >= 1) nums[1] = 1;
      for (let i = 2; i <= n; i++) nums[i] = i % 2 === 0 ? nums[i / 2] : nums[(i - 1) / 2] + nums[(i + 1) / 2];
      return Math.max(...nums);
    };
    return {
      slug: "get-maximum-in-generated-array",
      title: "Get Maximum in Generated Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Google"],
      signature: { funcName: "getMaximumGenerated", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Build an array `nums` of length `n + 1` by these rules:\n\n- `nums[0] = 0`\n- `nums[1] = 1` (when `n >= 1`)\n- `nums[2 * i] = nums[i]` when `2 <= 2 * i <= n`\n- `nums[2 * i + 1] = nums[i] + nums[i + 1]` when `2 <= 2 * i + 1 <= n`\n\nReturn the largest value in `nums`.",
        [
          { in: "n = 7", out: "3", note: "nums = [0,1,1,2,1,3,2,3], whose maximum is 3." },
          { in: "n = 2", out: "1", note: "nums = [0,1,1]." },
          { in: "n = 0", out: "0" },
        ],
        ["0 <= n <= 100"]),
      hints: [
        "Every entry depends only on entries with smaller indices.",
        "Fill the array from index 2 upwards, using `i / 2` (and `i / 2 + 1` for odd `i`).",
        "Track the maximum as you go, and handle `n = 0` before touching `nums[1]`.",
      ],
      editorial: explain({
        idea: "The recurrence only looks backwards — `nums[i]` uses indices around `i / 2` — so filling the array left to right computes every value once.",
        steps: [
          "If `n == 0` return 0.",
          "Set `nums[0] = 0`, `nums[1] = 1`, `best = 1`.",
          "For `i` from 2 to `n`: let `h = i / 2`; set `nums[i] = nums[h]` for even `i`, otherwise `nums[h] + nums[h + 1]`; update `best`.",
          "Return `best`.",
        ],
        why: "For `i >= 2`, both `h` and `h + 1` are smaller than `i`, so the values they need are already final when `nums[i]` is computed. Every entry is therefore exactly what the rules define, and the running maximum covers all of them.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "For `n = 0` the array is just `[0]`; writing `nums[1]` would go out of bounds.",
          "An odd index `2i + 1` uses `nums[i] + nums[i + 1]`, with `i = (index - 1) / 2`.",
          "The maximum is not always at the last index — `n = 7` peaks at index 5.",
        ],
      }),
      examples: [
        { input: "7", expectedOutput: "3" },
        { input: "2", expectedOutput: "1" },
        { input: "0", expectedOutput: "0" },
      ],
      hiddenCount: 300,
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 100);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def getMaximumGenerated(n: int) -> int:
              if n == 0:
                  return 0
              nums = [0] * (n + 1)
              nums[1] = 1
              for i in range(2, n + 1):
                  h = i // 2
                  nums[i] = nums[h] if i % 2 == 0 else nums[h] + nums[h + 1]
              return max(nums)
        `,
        javascript: code`
          var getMaximumGenerated = function(n) {
              if (n === 0) return 0;
              var nums = [0, 1], best = 1;
              for (var i = 2; i <= n; i++) {
                  var h = Math.floor(i / 2);
                  nums.push(i % 2 === 0 ? nums[h] : nums[h] + nums[h + 1]);
                  if (nums[i] > best) best = nums[i];
              }
              return best;
          };
        `,
        typescript: code`
          function getMaximumGenerated(n: number): number {
              if (n === 0) return 0;
              var nums: number[] = [0, 1];
              var best = 1;
              for (var i = 2; i <= n; i++) {
                  var h = Math.floor(i / 2);
                  nums.push(i % 2 === 0 ? nums[h] : nums[h] + nums[h + 1]);
                  if (nums[i] > best) best = nums[i];
              }
              return best;
          }
        `,
        java: code`
          public static int getMaximumGenerated(int n) {
              if (n == 0) return 0;
              int[] nums = new int[n + 1];
              nums[1] = 1;
              int best = 1;
              for (int i = 2; i <= n; i++) {
                  int h = i / 2;
                  nums[i] = i % 2 == 0 ? nums[h] : nums[h] + nums[h + 1];
                  best = Math.max(best, nums[i]);
              }
              return best;
          }
        `,
        cpp: code`
          int getMaximumGenerated(int n) {
              if (n == 0) return 0;
              vector<int> nums(n + 1, 0);
              nums[1] = 1;
              int best = 1;
              for (int i = 2; i <= n; i++) {
                  int h = i / 2;
                  nums[i] = i % 2 == 0 ? nums[h] : nums[h] + nums[h + 1];
                  best = max(best, nums[i]);
              }
              return best;
          }
        `,
        c: code`
          int getMaximumGenerated(int n) {
              if (n == 0) return 0;
              int nums[101];
              nums[0] = 0;
              nums[1] = 1;
              int best = 1;
              for (int i = 2; i <= n; i++) {
                  int h = i / 2;
                  nums[i] = i % 2 == 0 ? nums[h] : nums[h] + nums[h + 1];
                  if (nums[i] > best) best = nums[i];
              }
              return best;
          }
        `,
        csharp: code`
          public static int GetMaximumGenerated(int n)
          {
              if (n == 0) return 0;
              int[] nums = new int[n + 1];
              nums[1] = 1;
              int best = 1;
              for (int i = 2; i <= n; i++)
              {
                  int h = i / 2;
                  nums[i] = i % 2 == 0 ? nums[h] : nums[h] + nums[h + 1];
                  best = Math.Max(best, nums[i]);
              }
              return best;
          }
        `,
        go: code`
          func getMaximumGenerated(n int) int {
              if n == 0 {
                  return 0
              }
              nums := make([]int, n+1)
              nums[1] = 1
              best := 1
              for i := 2; i <= n; i++ {
                  h := i / 2
                  if i%2 == 0 {
                      nums[i] = nums[h]
                  } else {
                      nums[i] = nums[h] + nums[h+1]
                  }
                  if nums[i] > best {
                      best = nums[i]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun getMaximumGenerated(n: Int): Int {
              if (n == 0) return 0
              val nums = IntArray(n + 1)
              nums[1] = 1
              var best = 1
              for (i in 2..n) {
                  val h = i / 2
                  nums[i] = if (i % 2 == 0) nums[h] else nums[h] + nums[h + 1]
                  best = maxOf(best, nums[i])
              }
              return best
          }
        `,
        swift: code`
          func getMaximumGenerated(_ n: Int) -> Int {
              if n == 0 { return 0 }
              var nums = [Int](repeating: 0, count: n + 1)
              nums[1] = 1
              var best = 1
              var i = 2
              while i <= n {
                  let h = i / 2
                  nums[i] = i % 2 == 0 ? nums[h] : nums[h] + nums[h + 1]
                  best = max(best, nums[i])
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn getMaximumGenerated(n: i32) -> i32 {
              if n == 0 {
                  return 0;
              }
              let n = n as usize;
              let mut nums = vec![0i32; n + 1];
              nums[1] = 1;
              let mut best = 1;
              for i in 2..=n {
                  let h = i / 2;
                  nums[i] = if i % 2 == 0 { nums[h] } else { nums[h] + nums[h + 1] };
                  if nums[i] > best {
                      best = nums[i];
                  }
              }
              best
          }
        `,
        php: code`
          function getMaximumGenerated($n) {
              if ($n == 0) return 0;
              $nums = array_fill(0, $n + 1, 0);
              $nums[1] = 1;
              $best = 1;
              for ($i = 2; $i <= $n; $i++) {
                  $h = intdiv($i, 2);
                  $nums[$i] = $i % 2 == 0 ? $nums[$h] : $nums[$h] + $nums[$h + 1];
                  if ($nums[$i] > $best) $best = $nums[$i];
              }
              return $best;
          }
        `,
        ruby: code`
          def getMaximumGenerated(n)
            return 0 if n == 0
            nums = Array.new(n + 1, 0)
            nums[1] = 1
            (2..n).each do |i|
              h = i / 2
              nums[i] = i.even? ? nums[h] : nums[h] + nums[h + 1]
            end
            nums.max
          end
        `,
      },
    };
  })(),

  // ── Number Of Rectangles That Can Form The Largest Square (LC 1725) ─
  (() => {
    const ref = (rectangles: number[][]) => {
      const sides = rectangles.map((r) => Math.min(r[0], r[1]));
      const top = Math.max(...sides);
      return sides.filter((s) => s === top).length;
    };
    return {
      slug: "number-of-rectangles-that-can-form-the-largest-square",
      title: "Number Of Rectangles That Can Form The Largest Square",
      difficulty: "EASY" as const,
      tags: ["Array", "Counting", "Google", "Amazon"],
      signature: { funcName: "countGoodRectangles", params: [{ name: "rectangles", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`rectangles[i] = [l, w]` is a rectangle of length `l` and width `w`. You may cut a square out of a rectangle as long as its side is at most both `l` and `w` — so the biggest square rectangle `i` can give has side `min(l, w)`.\n\nLet `maxLen` be the largest square side that **any** rectangle can give. Return how many rectangles can give a square of side `maxLen`.",
        [
          { in: "rectangles = [[4,9],[7,3],[9,4],[4,6]]", out: "3", note: "The best squares have sides 4, 3, 4 and 4, so maxLen = 4 and three rectangles reach it." },
          { in: "rectangles = [[2,3],[6,5],[3,9]]", out: "1" },
          { in: "rectangles = [[10,1000000000]]", out: "1" },
        ],
        ["1 <= rectangles.length <= 1000", "rectangles[i].length == 2", "1 <= l, w <= 10^9", "l != w"]),
      hints: [
        "Each rectangle contributes exactly one number: the shorter of its two sides.",
        "You need the maximum of those numbers and how often it occurs.",
        "Both can be tracked in a single pass: reset the count when a new maximum appears.",
      ],
      editorial: explain({
        idea: "Reduce each rectangle to `min(l, w)`, the side of the largest square it can give; the answer is how many times the maximum of those values occurs.",
        steps: [
          "Keep `best = 0` and `count = 0`.",
          "For each rectangle compute `side = min(l, w)`.",
          "If `side > best`, set `best = side` and `count = 1`; if `side == best`, increment `count`.",
          "Return `count`.",
        ],
        why: "A rectangle can give a square of side `maxLen` exactly when its shorter side is at least `maxLen`, and since `maxLen` is the largest shorter side, that means exactly equal. The running maximum with a reset counter counts those rectangles in one pass.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Use the shorter side — the longer side does not limit the square.",
          "Reset the count to 1, not 0, when a new maximum appears.",
          "Sides reach 10^9, which still fits a 32-bit int; no sums are needed.",
        ],
      }),
      examples: [
        { input: "[[4,9],[7,3],[9,4],[4,6]]", expectedOutput: "3" },
        { input: "[[2,3],[6,5],[3,9]]", expectedOutput: "1" },
        { input: "[[10,1000000000]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 1], [2, 10], [11, 40]]);
        const top = pick(rng, [3, 12, 1000000000]);
        const rectangles: number[][] = [];
        for (let i = 0; i < n; i++) {
          const l = ri(rng, 1, top);
          let w = ri(rng, 1, top);
          while (w === l) w = ri(rng, 1, Math.max(top, 2));
          rectangles.push([l, w]);
        }
        return { input: fmtIntMat(rectangles), expectedOutput: String(ref(rectangles)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countGoodRectangles(rectangles: List[List[int]]) -> int:
              sides = [min(l, w) for l, w in rectangles]
              return sides.count(max(sides))
        `,
        javascript: code`
          var countGoodRectangles = function(rectangles) {
              var best = 0, count = 0;
              for (var i = 0; i < rectangles.length; i++) {
                  var side = Math.min(rectangles[i][0], rectangles[i][1]);
                  if (side > best) {
                      best = side;
                      count = 1;
                  } else if (side === best) {
                      count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function countGoodRectangles(rectangles: number[][]): number {
              var best = 0, count = 0;
              for (var i = 0; i < rectangles.length; i++) {
                  var side = Math.min(rectangles[i][0], rectangles[i][1]);
                  if (side > best) {
                      best = side;
                      count = 1;
                  } else if (side === best) {
                      count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int countGoodRectangles(int[][] rectangles) {
              int best = 0, count = 0;
              for (int[] r : rectangles) {
                  int side = Math.min(r[0], r[1]);
                  if (side > best) {
                      best = side;
                      count = 1;
                  } else if (side == best) {
                      count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int countGoodRectangles(vector<vector<int>>& rectangles) {
              int best = 0, count = 0;
              for (auto& r : rectangles) {
                  int side = min(r[0], r[1]);
                  if (side > best) {
                      best = side;
                      count = 1;
                  } else if (side == best) {
                      count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          int countGoodRectangles(int** rectangles, int rectanglesSize, int* rectanglesColSize) {
              int best = 0, count = 0;
              for (int i = 0; i < rectanglesSize; i++) {
                  int side = rectangles[i][0] < rectangles[i][1] ? rectangles[i][0] : rectangles[i][1];
                  if (side > best) {
                      best = side;
                      count = 1;
                  } else if (side == best) {
                      count++;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          public static int CountGoodRectangles(int[][] rectangles)
          {
              int best = 0, count = 0;
              foreach (int[] r in rectangles)
              {
                  int side = Math.Min(r[0], r[1]);
                  if (side > best)
                  {
                      best = side;
                      count = 1;
                  }
                  else if (side == best)
                  {
                      count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func countGoodRectangles(rectangles [][]int) int {
              best, count := 0, 0
              for _, r := range rectangles {
                  side := r[0]
                  if r[1] < side {
                      side = r[1]
                  }
                  if side > best {
                      best = side
                      count = 1
                  } else if side == best {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun countGoodRectangles(rectangles: Array<IntArray>): Int {
              var best = 0
              var count = 0
              for (r in rectangles) {
                  val side = minOf(r[0], r[1])
                  if (side > best) {
                      best = side
                      count = 1
                  } else if (side == best) {
                      count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func countGoodRectangles(_ rectangles: [[Int]]) -> Int {
              var best = 0, count = 0
              for r in rectangles {
                  let side = min(r[0], r[1])
                  if side > best {
                      best = side
                      count = 1
                  } else if side == best {
                      count += 1
                  }
              }
              return count
          }
        `,
        rust: code`
          fn countGoodRectangles(rectangles: Vec<Vec<i32>>) -> i32 {
              let mut best = 0;
              let mut count = 0;
              for r in rectangles.iter() {
                  let side = r[0].min(r[1]);
                  if side > best {
                      best = side;
                      count = 1;
                  } else if side == best {
                      count += 1;
                  }
              }
              count
          }
        `,
        php: code`
          function countGoodRectangles($rectangles) {
              $best = 0;
              $cnt = 0;
              foreach ($rectangles as $r) {
                  $side = min($r[0], $r[1]);
                  if ($side > $best) {
                      $best = $side;
                      $cnt = 1;
                  } elseif ($side == $best) {
                      $cnt++;
                  }
              }
              return $cnt;
          }
        `,
        ruby: code`
          def countGoodRectangles(rectangles)
            sides = rectangles.map { |l, w| [l, w].min }
            sides.count(sides.max)
          end
        `,
      },
    };
  })(),

  // ── Check if Array Is Sorted and Rotated (LC 1752) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      for (let r = 0; r < n; r++) {
        const rot = nums.slice(r).concat(nums.slice(0, r));
        let ok = true;
        for (let i = 1; i < n; i++) if (rot[i - 1] > rot[i]) ok = false;
        if (ok) return true;
      }
      return false;
    };
    return {
      slug: "check-if-array-is-sorted-and-rotated",
      title: "Check if Array Is Sorted and Rotated",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "check", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Return `true` if `nums` could have been produced by taking an array sorted in **non-decreasing** order and rotating it by some number of positions (possibly zero); otherwise return `false`.\n\nRotating an array `a` by `x` positions gives the array `b` with `b[i] = a[(i + x) % a.length]`. The array may contain duplicates.",
        [
          { in: "nums = [6,8,9,2,4]", out: "true", note: "[2,4,6,8,9] rotated by 2 positions." },
          { in: "nums = [5,3,4,1]", out: "false", note: "The order breaks at 5 → 3 and again at 4 → 1." },
          { in: "nums = [7,7,7]", out: "true" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "A sorted array has no place where a value is followed by a smaller one.",
        "Rotating it creates at most one such drop — at the seam — if you also compare the last element with the first.",
        "Count indices `i` where `nums[i] > nums[(i + 1) % n]`; the answer is whether the count is at most 1.",
      ],
      editorial: explain({
        idea: "Read the array as a circle. A rotated sorted array, read around the circle, goes down at most once — where the end of the original array meets its start.",
        steps: [
          "Count the indices `i` with `nums[i] > nums[(i + 1) % n]`.",
          "Return `true` if the count is 0 or 1.",
        ],
        why: "Rotation does not change the circular order, and a sorted array read circularly has at most one drop (from its last element back to its first). Conversely, if there is at most one circular drop, starting the reading just after it gives a non-decreasing array, which rotates into `nums`. With zero drops all values are equal, which is sorted too.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Include the wrap-around pair (last, first); without it `[2,1,3,4]` would look like one drop and pass.",
          "Duplicates are allowed, so compare with `>`, not `>=`.",
          "A rotation by zero is allowed: an already sorted array is `true`.",
        ],
      }),
      examples: [
        { input: "[6,8,9,2,4]", expectedOutput: "true" },
        { input: "[5,3,4,1]", expectedOutput: "false" },
        { input: "[7,7,7]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 2], [3, 10], [11, 40]]);
        const top = pick(rng, [3, 100]);
        const sorted = Array.from({ length: n }, () => ri(rng, 1, top)).sort((a, b) => a - b);
        const r = ri(rng, 0, n - 1);
        const nums = sorted.slice(r).concat(sorted.slice(0, r));
        if (rng() < 0.4) {
          if (rng() < 0.5) {
            const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
            [nums[a], nums[b]] = [nums[b], nums[a]];
          } else {
            nums[ri(rng, 0, n - 1)] = ri(rng, 1, top);
          }
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def check(nums: List[int]) -> bool:
              n = len(nums)
              drops = sum(1 for i in range(n) if nums[i] > nums[(i + 1) % n])
              return drops <= 1
        `,
        javascript: code`
          var check = function(nums) {
              var n = nums.length, drops = 0;
              for (var i = 0; i < n; i++) {
                  if (nums[i] > nums[(i + 1) % n]) drops++;
              }
              return drops <= 1;
          };
        `,
        typescript: code`
          function check(nums: number[]): boolean {
              var n = nums.length, drops = 0;
              for (var i = 0; i < n; i++) {
                  if (nums[i] > nums[(i + 1) % n]) drops++;
              }
              return drops <= 1;
          }
        `,
        java: code`
          public static boolean check(int[] nums) {
              int n = nums.length, drops = 0;
              for (int i = 0; i < n; i++) {
                  if (nums[i] > nums[(i + 1) % n]) drops++;
              }
              return drops <= 1;
          }
        `,
        cpp: code`
          bool check(vector<int>& nums) {
              int n = nums.size(), drops = 0;
              for (int i = 0; i < n; i++) {
                  if (nums[i] > nums[(i + 1) % n]) drops++;
              }
              return drops <= 1;
          }
        `,
        c: code`
          bool check(int* nums, int numsSize) {
              int drops = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] > nums[(i + 1) % numsSize]) drops++;
              }
              return drops <= 1;
          }
        `,
        csharp: code`
          public static bool Check(int[] nums)
          {
              int n = nums.Length, drops = 0;
              for (int i = 0; i < n; i++)
              {
                  if (nums[i] > nums[(i + 1) % n]) drops++;
              }
              return drops <= 1;
          }
        `,
        go: code`
          func check(nums []int) bool {
              n, drops := len(nums), 0
              for i := 0; i < n; i++ {
                  if nums[i] > nums[(i+1)%n] {
                      drops++
                  }
              }
              return drops <= 1
          }
        `,
        kotlin: code`
          fun check(nums: IntArray): Boolean {
              val n = nums.size
              var drops = 0
              for (i in 0 until n) {
                  if (nums[i] > nums[(i + 1) % n]) drops++
              }
              return drops <= 1
          }
        `,
        swift: code`
          func check(_ nums: [Int]) -> Bool {
              let n = nums.count
              var drops = 0
              for i in 0..<n {
                  if nums[i] > nums[(i + 1) % n] { drops += 1 }
              }
              return drops <= 1
          }
        `,
        rust: code`
          fn check(nums: Vec<i32>) -> bool {
              let n = nums.len();
              let mut drops = 0;
              for i in 0..n {
                  if nums[i] > nums[(i + 1) % n] {
                      drops += 1;
                  }
              }
              drops <= 1
          }
        `,
        php: code`
          function check($nums) {
              $n = count($nums);
              $drops = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($nums[$i] > $nums[($i + 1) % $n]) $drops++;
              }
              return $drops <= 1;
          }
        `,
        ruby: code`
          def check(nums)
            n = nums.length
            drops = (0...n).count { |i| nums[i] > nums[(i + 1) % n] }
            drops <= 1
          end
        `,
      },
    };
  })(),

  // ── Find Nearest Point That Has the Same X or Y Coordinate (LC 1779) ─
  (() => {
    const ref = (x: number, y: number, points: number[][]) => {
      const valid = points
        .map((p, i) => ({ i, ok: p[0] === x || p[1] === y, d: Math.abs(p[0] - x) + Math.abs(p[1] - y) }))
        .filter((v) => v.ok)
        .sort((a, b) => a.d - b.d || a.i - b.i);
      return valid.length ? valid[0].i : -1;
    };
    return {
      slug: "find-nearest-point-that-has-the-same-x-or-y-coordinate",
      title: "Find Nearest Point That Has the Same X or Y Coordinate",
      difficulty: "EASY" as const,
      tags: ["Array", "Geometry", "Amazon", "Google"],
      signature: {
        funcName: "nearestValidPoint",
        params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }, { name: "points", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You stand at `(x, y)` on a grid. `points[i] = [a, b]` is a point at `(a, b)`. A point is **valid** when it shares your x-coordinate or your y-coordinate (`a == x` or `b == y`).\n\nReturn the index of the valid point with the smallest **Manhattan distance** `|a - x| + |b - y|` from you. If several valid points are equally close, return the smallest index among them. If no point is valid, return `-1`.",
        [
          { in: "x = 5, y = 2, points = [[5,9],[1,2],[4,4],[5,3]]", out: "3", note: "Valid points are indices 0, 1 and 3 at distances 7, 4 and 1." },
          { in: "x = 2, y = 2, points = [[3,3]]", out: "-1" },
          { in: "x = 1, y = 1, points = [[1,4],[4,1]]", out: "0", note: "Both are at distance 3; the smaller index wins." },
        ],
        ["1 <= points.length <= 10^4", "points[i].length == 2", "1 <= x, y, a, b <= 10^4"]),
      hints: [
        "Skip every point that matches neither coordinate.",
        "For the rest, compute the Manhattan distance and keep the best one seen so far.",
        "Replace the best only on a strictly smaller distance, so ties keep the earlier index.",
      ],
      editorial: explain({
        idea: "A single scan that filters out invalid points and keeps the closest valid one answers the question; the strict comparison handles the tie rule for free.",
        steps: [
          "Set `best = -1` and `bestDist` to a value larger than any distance.",
          "For each index `i`: if `a == x` or `b == y`, compute `d = |a - x| + |b - y|`.",
          "If `d < bestDist`, record `best = i` and `bestDist = d`.",
          "Return `best`.",
        ],
        why: "Indices are visited in increasing order, and a later point replaces the current best only when it is strictly closer. So among the closest valid points, the first one found — the smallest index — is kept. If no point is valid, `best` is never set.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Use `<`, not `<=`, or ties return the largest index.",
          "A point equal to `(x, y)` is valid with distance 0.",
          "Return the index, not the distance or the point.",
        ],
      }),
      examples: [
        { input: "5\n2\n[[5,9],[1,2],[4,4],[5,3]]", expectedOutput: "3" },
        { input: "2\n2\n[[3,3]]", expectedOutput: "-1" },
        { input: "1\n1\n[[1,4],[4,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 2], [3, 10], [11, 40]]);
        const top = pick(rng, [3, 10, 10000]);
        const x = ri(rng, 1, top), y = ri(rng, 1, top);
        const share = top > 10 ? pick(rng, [0, 0.2, 0.5]) : 0;
        const points: number[][] = [];
        for (let i = 0; i < n; i++) {
          let a = ri(rng, 1, top), b = ri(rng, 1, top);
          if (rng() < share) { if (rng() < 0.5) a = x; else b = y; }
          points.push([a, b]);
        }
        return { input: `${x}\n${y}\n${fmtIntMat(points)}`, expectedOutput: String(ref(x, y, points)) };
      },
      solutions: {
        python: code`
          from typing import List

          def nearestValidPoint(x: int, y: int, points: List[List[int]]) -> int:
              best, best_dist = -1, None
              for i, (a, b) in enumerate(points):
                  if a == x or b == y:
                      d = abs(a - x) + abs(b - y)
                      if best_dist is None or d < best_dist:
                          best, best_dist = i, d
              return best
        `,
        javascript: code`
          var nearestValidPoint = function(x, y, points) {
              var best = -1, bestDist = Infinity;
              for (var i = 0; i < points.length; i++) {
                  var a = points[i][0], b = points[i][1];
                  if (a === x || b === y) {
                      var d = Math.abs(a - x) + Math.abs(b - y);
                      if (d < bestDist) {
                          bestDist = d;
                          best = i;
                      }
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function nearestValidPoint(x: number, y: number, points: number[][]): number {
              var best = -1, bestDist = Infinity;
              for (var i = 0; i < points.length; i++) {
                  var a = points[i][0], b = points[i][1];
                  if (a === x || b === y) {
                      var d = Math.abs(a - x) + Math.abs(b - y);
                      if (d < bestDist) {
                          bestDist = d;
                          best = i;
                      }
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int nearestValidPoint(int x, int y, int[][] points) {
              int best = -1, bestDist = Integer.MAX_VALUE;
              for (int i = 0; i < points.length; i++) {
                  int a = points[i][0], b = points[i][1];
                  if (a == x || b == y) {
                      int d = Math.abs(a - x) + Math.abs(b - y);
                      if (d < bestDist) {
                          bestDist = d;
                          best = i;
                      }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int nearestValidPoint(int x, int y, vector<vector<int>>& points) {
              int best = -1, bestDist = INT_MAX;
              for (int i = 0; i < (int)points.size(); i++) {
                  int a = points[i][0], b = points[i][1];
                  if (a == x || b == y) {
                      int d = abs(a - x) + abs(b - y);
                      if (d < bestDist) {
                          bestDist = d;
                          best = i;
                      }
                  }
              }
              return best;
          }
        `,
        c: code`
          int nearestValidPoint(int x, int y, int** points, int pointsSize, int* pointsColSize) {
              int best = -1, bestDist = 2147483647;
              for (int i = 0; i < pointsSize; i++) {
                  int a = points[i][0], b = points[i][1];
                  if (a == x || b == y) {
                      int dx = a > x ? a - x : x - a;
                      int dy = b > y ? b - y : y - b;
                      if (dx + dy < bestDist) {
                          bestDist = dx + dy;
                          best = i;
                      }
                  }
              }
              return best;
          }
        `,
        csharp: code`
          public static int NearestValidPoint(int x, int y, int[][] points)
          {
              int best = -1, bestDist = int.MaxValue;
              for (int i = 0; i < points.Length; i++)
              {
                  int a = points[i][0], b = points[i][1];
                  if (a == x || b == y)
                  {
                      int d = Math.Abs(a - x) + Math.Abs(b - y);
                      if (d < bestDist)
                      {
                          bestDist = d;
                          best = i;
                      }
                  }
              }
              return best;
          }
        `,
        go: code`
          func nearestValidPoint(x int, y int, points [][]int) int {
              best, bestDist := -1, 1<<31-1
              for i, p := range points {
                  if p[0] == x || p[1] == y {
                      dx, dy := p[0]-x, p[1]-y
                      if dx < 0 {
                          dx = -dx
                      }
                      if dy < 0 {
                          dy = -dy
                      }
                      if dx+dy < bestDist {
                          bestDist = dx + dy
                          best = i
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun nearestValidPoint(x: Int, y: Int, points: Array<IntArray>): Int {
              var best = -1
              var bestDist = Int.MAX_VALUE
              for (i in points.indices) {
                  val a = points[i][0]
                  val b = points[i][1]
                  if (a == x || b == y) {
                      val d = Math.abs(a - x) + Math.abs(b - y)
                      if (d < bestDist) {
                          bestDist = d
                          best = i
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func nearestValidPoint(_ x: Int, _ y: Int, _ points: [[Int]]) -> Int {
              var best = -1
              var bestDist = Int.max
              for i in 0..<points.count {
                  let a = points[i][0], b = points[i][1]
                  if a == x || b == y {
                      let d = abs(a - x) + abs(b - y)
                      if d < bestDist {
                          bestDist = d
                          best = i
                      }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn nearestValidPoint(x: i32, y: i32, points: Vec<Vec<i32>>) -> i32 {
              let mut best = -1i32;
              let mut best_dist = std::i32::MAX;
              for (i, p) in points.iter().enumerate() {
                  if p[0] == x || p[1] == y {
                      let d = (p[0] - x).abs() + (p[1] - y).abs();
                      if d < best_dist {
                          best_dist = d;
                          best = i as i32;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function nearestValidPoint($x, $y, $points) {
              $best = -1;
              $bestDist = PHP_INT_MAX;
              foreach ($points as $i => $p) {
                  if ($p[0] == $x || $p[1] == $y) {
                      $d = abs($p[0] - $x) + abs($p[1] - $y);
                      if ($d < $bestDist) {
                          $bestDist = $d;
                          $best = $i;
                      }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def nearestValidPoint(x, y, points)
            best = -1
            best_dist = nil
            points.each_with_index do |(a, b), i|
              next unless a == x || b == y
              d = (a - x).abs + (b - y).abs
              if best_dist.nil? || d < best_dist
                best_dist = d
                best = i
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Check if All the Integers in a Range Are Covered (LC 1893) ──
  (() => {
    const ref = (ranges: number[][], left: number, right: number) => {
      for (let v = left; v <= right; v++) if (!ranges.some((r) => r[0] <= v && v <= r[1])) return false;
      return true;
    };
    return {
      slug: "check-if-all-the-integers-in-a-range-are-covered",
      title: "Check if All the Integers in a Range Are Covered",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "isCovered",
        params: [{ name: "ranges", type: "int[][]" as const }, { name: "left", type: "int" as const }, { name: "right", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "`ranges[i] = [start, end]` describes the inclusive interval of integers from `start` to `end`. An integer `v` is **covered** if at least one interval contains it (`start <= v <= end`).\n\nReturn `true` if every integer in the inclusive range `[left, right]` is covered.",
        [
          { in: "ranges = [[2,4],[6,9]], left = 3, right = 7", out: "false", note: "5 lies in neither interval." },
          { in: "ranges = [[1,5],[4,8]], left = 2, right = 8", out: "true" },
          { in: "ranges = [[10,20]], left = 10, right = 10", out: "true" },
        ],
        ["1 <= ranges.length <= 50", "1 <= start <= end <= 50", "1 <= left <= right <= 50"]),
      hints: [
        "The values are tiny (at most 50), so you can afford to look at each integer separately.",
        "Instead of testing each integer against every interval, mark the coverage once.",
        "A difference array: +1 at `start`, -1 at `end + 1`; its running sum is how many intervals cover each integer.",
      ],
      editorial: explain({
        idea: "A difference array turns all intervals into per-integer coverage counts in one sweep; then every integer from `left` to `right` must have a positive count.",
        steps: [
          "Create `diff` of size 52 filled with 0.",
          "For each interval, add 1 at `diff[start]` and subtract 1 at `diff[end + 1]`.",
          "Sweep `v` from 1 to `right`, keeping the running sum `cover`.",
          "If some `v >= left` has `cover == 0`, return `false`; otherwise return `true`.",
        ],
        why: "The running sum at `v` adds 1 for every interval that started at or before `v` and subtracts 1 for every one that ended before `v`, so it is exactly the number of intervals containing `v`. A positive value means covered.",
        time: "O(n + R) with R = 50",
        space: "O(R)",
        pitfalls: [
          "Intervals are inclusive: the -1 goes at `end + 1`, not `end`.",
          "The sweep must start at 1, not at `left`, so intervals that begin before `left` are counted.",
          "Overlapping intervals are fine — only whether the count is positive matters.",
        ],
      }),
      examples: [
        { input: "[[2,4],[6,9]]\n3\n7", expectedOutput: "false" },
        { input: "[[1,5],[4,8]]\n2\n8", expectedOutput: "true" },
        { input: "[[10,20]]\n10\n10", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [10, 50]);
        const m = sizeOf(rng, [[1, 1], [2, 6], [7, 20]]);
        const ranges: number[][] = [];
        for (let i = 0; i < m; i++) {
          const s = ri(rng, 1, top);
          ranges.push([s, ri(rng, s, Math.min(top, s + pick(rng, [0, 3, 15])))]);
        }
        const left = ri(rng, 1, top);
        const right = ri(rng, left, Math.min(top, left + pick(rng, [0, 4, 20])));
        return { input: `${fmtIntMat(ranges)}\n${left}\n${right}`, expectedOutput: bool(ref(ranges, left, right)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isCovered(ranges: List[List[int]], left: int, right: int) -> bool:
              diff = [0] * 52
              for s, e in ranges:
                  diff[s] += 1
                  diff[e + 1] -= 1
              cover = 0
              for v in range(1, right + 1):
                  cover += diff[v]
                  if v >= left and cover <= 0:
                      return False
              return True
        `,
        javascript: code`
          var isCovered = function(ranges, left, right) {
              var diff = new Array(52).fill(0);
              for (var i = 0; i < ranges.length; i++) {
                  diff[ranges[i][0]]++;
                  diff[ranges[i][1] + 1]--;
              }
              var cover = 0;
              for (var v = 1; v <= right; v++) {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function isCovered(ranges: number[][], left: number, right: number): boolean {
              var diff: number[] = [];
              for (var k = 0; k < 52; k++) diff.push(0);
              for (var i = 0; i < ranges.length; i++) {
                  diff[ranges[i][0]]++;
                  diff[ranges[i][1] + 1]--;
              }
              var cover = 0;
              for (var v = 1; v <= right; v++) {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isCovered(int[][] ranges, int left, int right) {
              int[] diff = new int[52];
              for (int[] r : ranges) {
                  diff[r[0]]++;
                  diff[r[1] + 1]--;
              }
              int cover = 0;
              for (int v = 1; v <= right; v++) {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool isCovered(vector<vector<int>>& ranges, int left, int right) {
              vector<int> diff(52, 0);
              for (auto& r : ranges) {
                  diff[r[0]]++;
                  diff[r[1] + 1]--;
              }
              int cover = 0;
              for (int v = 1; v <= right; v++) {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          }
        `,
        c: code`
          bool isCovered(int** ranges, int rangesSize, int* rangesColSize, int left, int right) {
              int diff[52] = { 0 };
              for (int i = 0; i < rangesSize; i++) {
                  diff[ranges[i][0]]++;
                  diff[ranges[i][1] + 1]--;
              }
              int cover = 0;
              for (int v = 1; v <= right; v++) {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool IsCovered(int[][] ranges, int left, int right)
          {
              int[] diff = new int[52];
              foreach (int[] r in ranges)
              {
                  diff[r[0]]++;
                  diff[r[1] + 1]--;
              }
              int cover = 0;
              for (int v = 1; v <= right; v++)
              {
                  cover += diff[v];
                  if (v >= left && cover <= 0) return false;
              }
              return true;
          }
        `,
        go: code`
          func isCovered(ranges [][]int, left int, right int) bool {
              diff := make([]int, 52)
              for _, r := range ranges {
                  diff[r[0]]++
                  diff[r[1]+1]--
              }
              cover := 0
              for v := 1; v <= right; v++ {
                  cover += diff[v]
                  if v >= left && cover <= 0 {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun isCovered(ranges: Array<IntArray>, left: Int, right: Int): Boolean {
              val diff = IntArray(52)
              for (r in ranges) {
                  diff[r[0]]++
                  diff[r[1] + 1]--
              }
              var cover = 0
              for (v in 1..right) {
                  cover += diff[v]
                  if (v >= left && cover <= 0) return false
              }
              return true
          }
        `,
        swift: code`
          func isCovered(_ ranges: [[Int]], _ left: Int, _ right: Int) -> Bool {
              var diff = [Int](repeating: 0, count: 52)
              for r in ranges {
                  diff[r[0]] += 1
                  diff[r[1] + 1] -= 1
              }
              var cover = 0
              var v = 1
              while v <= right {
                  cover += diff[v]
                  if v >= left && cover <= 0 { return false }
                  v += 1
              }
              return true
          }
        `,
        rust: code`
          fn isCovered(ranges: Vec<Vec<i32>>, left: i32, right: i32) -> bool {
              let mut diff = vec![0i32; 52];
              for r in ranges.iter() {
                  diff[r[0] as usize] += 1;
                  diff[r[1] as usize + 1] -= 1;
              }
              let mut cover = 0;
              for v in 1..=(right as usize) {
                  cover += diff[v];
                  if v as i32 >= left && cover <= 0 {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function isCovered($ranges, $left, $right) {
              $diff = array_fill(0, 52, 0);
              foreach ($ranges as $r) {
                  $diff[$r[0]]++;
                  $diff[$r[1] + 1]--;
              }
              $cover = 0;
              for ($v = 1; $v <= $right; $v++) {
                  $cover += $diff[$v];
                  if ($v >= $left && $cover <= 0) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def isCovered(ranges, left, right)
            diff = Array.new(52, 0)
            ranges.each do |s, e|
              diff[s] += 1
              diff[e + 1] -= 1
            end
            cover = 0
            (1..right).each do |v|
              cover += diff[v]
              return false if v >= left && cover <= 0
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Remove One Element to Make the Array Strictly Increasing (LC 1909) ─
  (() => {
    const ref = (nums: number[]) => {
      for (let skip = 0; skip < nums.length; skip++) {
        const rest = nums.filter((_, i) => i !== skip);
        let ok = true;
        for (let i = 1; i < rest.length; i++) if (rest[i - 1] >= rest[i]) ok = false;
        if (ok) return true;
      }
      return false;
    };
    return {
      slug: "remove-one-element-to-make-the-array-strictly-increasing",
      title: "Remove One Element to Make the Array Strictly Increasing",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Amazon", "Google"],
      signature: { funcName: "canBeIncreasing", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Return `true` if deleting **exactly one** element of `nums` leaves an array that is **strictly increasing** — every element smaller than the one after it. Otherwise return `false`.\n\nIf `nums` is already strictly increasing the answer is `true`, since deleting any element keeps it that way.",
        [
          { in: "nums = [3,8,5,9]", out: "true", note: "Deleting 8 leaves [3,5,9]." },
          { in: "nums = [4,6,2,5]", out: "false", note: "Every single deletion still leaves a descent." },
          { in: "nums = [7,7]", out: "true", note: "Deleting either 7 leaves [7]." },
        ],
        ["2 <= nums.length <= 1000", "1 <= nums[i] <= 1000"]),
      hints: [
        "Walk left to right and look for the first place where `nums[i - 1] >= nums[i]`.",
        "At such a conflict you must delete one of the two. Two conflicts that need two deletions mean `false`.",
        "Prefer deleting `nums[i - 1]` (it keeps the last kept value small) — but only if `nums[i - 2] < nums[i]`; otherwise delete `nums[i]`.",
      ],
      editorial: explain({
        idea: "Scan once, remembering the last value kept. The first conflict forces a deletion, and the better choice is the one that leaves the smaller last value, as long as it keeps the prefix increasing.",
        steps: [
          "Set `prev = nums[0]` and `removed = false`.",
          "For each `i >= 1`: if `nums[i] > prev`, set `prev = nums[i]` and continue.",
          "Otherwise, if `removed` is already true, return `false`; set `removed = true`.",
          "If `i == 1` or `nums[i - 2] < nums[i]`, delete `nums[i - 1]` by setting `prev = nums[i]`; else delete `nums[i]` by leaving `prev` unchanged.",
          "Return `true` after the scan.",
        ],
        why: "Before the first conflict nothing has been deleted, so the kept prefix is `nums[0..i-1]` and the element before `nums[i - 1]` is `nums[i - 2]`. Deleting `nums[i - 1]` is allowed only if `nums[i - 2] < nums[i]`, and when it is allowed it leaves the last kept value `nums[i] <= nums[i - 1]`, which can only make the rest easier. Any later conflict needs a second deletion, so it means `false`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Strictly increasing: equal neighbours are a conflict.",
          "Deleting `nums[i - 1]` without checking `nums[i - 2] < nums[i]` wrongly accepts `[5,6,1,2]`; always deleting `nums[i]` instead wrongly rejects `[1,9,3,4]`, where 9 is the one to drop.",
          "Do not modify the input array in languages where it is shared with the caller — track `prev` instead.",
        ],
      }),
      examples: [
        { input: "[3,8,5,9]", expectedOutput: "true" },
        { input: "[4,6,2,5]", expectedOutput: "false" },
        { input: "[7,7]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[2, 3], [4, 10], [11, 40]]);
        const top = pick(rng, [n + 5, 1000]);
        const nums = sampleDistinct(rng, n, 1, top).sort((a, b) => a - b);
        const changes = pick(rng, [0, 1, 1, 1, 2]);
        for (let t = 0; t < changes; t++) nums[ri(rng, 0, n - 1)] = ri(rng, 1, top);
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def canBeIncreasing(nums: List[int]) -> bool:
              prev = nums[0]
              removed = False
              for i in range(1, len(nums)):
                  if nums[i] > prev:
                      prev = nums[i]
                      continue
                  if removed:
                      return False
                  removed = True
                  if i == 1 or nums[i - 2] < nums[i]:
                      prev = nums[i]
              return True
        `,
        javascript: code`
          var canBeIncreasing = function(nums) {
              var prev = nums[0], removed = false;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > prev) {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i === 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          };
        `,
        typescript: code`
          function canBeIncreasing(nums: number[]): boolean {
              var prev = nums[0], removed = false;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > prev) {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i === 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          }
        `,
        java: code`
          public static boolean canBeIncreasing(int[] nums) {
              int prev = nums[0];
              boolean removed = false;
              for (int i = 1; i < nums.length; i++) {
                  if (nums[i] > prev) {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i == 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          }
        `,
        cpp: code`
          bool canBeIncreasing(vector<int>& nums) {
              int prev = nums[0];
              bool removed = false;
              for (int i = 1; i < (int)nums.size(); i++) {
                  if (nums[i] > prev) {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i == 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          }
        `,
        c: code`
          bool canBeIncreasing(int* nums, int numsSize) {
              int prev = nums[0];
              bool removed = false;
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] > prev) {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i == 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CanBeIncreasing(int[] nums)
          {
              int prev = nums[0];
              bool removed = false;
              for (int i = 1; i < nums.Length; i++)
              {
                  if (nums[i] > prev)
                  {
                      prev = nums[i];
                      continue;
                  }
                  if (removed) return false;
                  removed = true;
                  if (i == 1 || nums[i - 2] < nums[i]) prev = nums[i];
              }
              return true;
          }
        `,
        go: code`
          func canBeIncreasing(nums []int) bool {
              prev, removed := nums[0], false
              for i := 1; i < len(nums); i++ {
                  if nums[i] > prev {
                      prev = nums[i]
                      continue
                  }
                  if removed {
                      return false
                  }
                  removed = true
                  if i == 1 || nums[i-2] < nums[i] {
                      prev = nums[i]
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun canBeIncreasing(nums: IntArray): Boolean {
              var prev = nums[0]
              var removed = false
              for (i in 1 until nums.size) {
                  if (nums[i] > prev) {
                      prev = nums[i]
                      continue
                  }
                  if (removed) return false
                  removed = true
                  if (i == 1 || nums[i - 2] < nums[i]) prev = nums[i]
              }
              return true
          }
        `,
        swift: code`
          func canBeIncreasing(_ nums: [Int]) -> Bool {
              var prev = nums[0]
              var removed = false
              for i in 1..<nums.count {
                  if nums[i] > prev {
                      prev = nums[i]
                      continue
                  }
                  if removed { return false }
                  removed = true
                  if i == 1 || nums[i - 2] < nums[i] { prev = nums[i] }
              }
              return true
          }
        `,
        rust: code`
          fn canBeIncreasing(nums: Vec<i32>) -> bool {
              let mut prev = nums[0];
              let mut removed = false;
              for i in 1..nums.len() {
                  if nums[i] > prev {
                      prev = nums[i];
                      continue;
                  }
                  if removed {
                      return false;
                  }
                  removed = true;
                  if i == 1 || nums[i - 2] < nums[i] {
                      prev = nums[i];
                  }
              }
              true
          }
        `,
        php: code`
          function canBeIncreasing($nums) {
              $prev = $nums[0];
              $removed = false;
              $n = count($nums);
              for ($i = 1; $i < $n; $i++) {
                  if ($nums[$i] > $prev) {
                      $prev = $nums[$i];
                      continue;
                  }
                  if ($removed) return false;
                  $removed = true;
                  if ($i == 1 || $nums[$i - 2] < $nums[$i]) $prev = $nums[$i];
              }
              return true;
          }
        `,
        ruby: code`
          def canBeIncreasing(nums)
            prev = nums[0]
            removed = false
            (1...nums.length).each do |i|
              if nums[i] > prev
                prev = nums[i]
                next
              end
              return false if removed
              removed = true
              prev = nums[i] if i == 1 || nums[i - 2] < nums[i]
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Count Special Quadruplets (LC 1995) ─────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let count = 0;
      for (let a = 0; a < n; a++)
        for (let b = a + 1; b < n; b++)
          for (let c = b + 1; c < n; c++)
            for (let d = c + 1; d < n; d++) if (nums[a] + nums[b] + nums[c] === nums[d]) count++;
      return count;
    };
    return {
      slug: "count-special-quadruplets",
      title: "Count Special Quadruplets",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "countQuadruplets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return the number of index quadruplets `(a, b, c, d)` with `a < b < c < d` such that `nums[a] + nums[b] + nums[c] == nums[d]`.\n\nQuadruplets are counted by their indices, so equal values at different positions count separately.",
        [
          { in: "nums = [2,3,5,10]", out: "1", note: "2 + 3 + 5 == 10." },
          { in: "nums = [5,5,5,5]", out: "0" },
          { in: "nums = [2,2,2,6,10]", out: "4", note: "(0,1,2,3) gives 6, and (0,1,3,4), (0,2,3,4), (1,2,3,4) each give 2 + 2 + 6 == 10." },
        ],
        ["4 <= nums.length <= 50", "1 <= nums[i] <= 100"]),
      hints: [
        "With `n <= 50` four nested loops already pass, but you can do much better.",
        "Rewrite the equation as `nums[a] + nums[b] == nums[d] - nums[c]`.",
        "Fix `b` and move it from right to left; keep a count of every difference `nums[d] - nums[c]` with `b < c < d`, and look up `nums[a] + nums[b]` for each `a < b`.",
      ],
      editorial: explain({
        idea: "Split the equation into a left pair and a right pair: `nums[a] + nums[b] == nums[d] - nums[c]`. With `b` as the pivot, all right pairs have `c > b`, so they can be counted incrementally as `b` moves left.",
        steps: [
          "Keep `cnt[v]`, the number of pairs `c < d` with `c > b` and `nums[d] - nums[c] == v` (only positive `v` can ever match).",
          "For `b` from `n - 3` down to 1: first add the pairs that use `c = b + 1` — every `d > b + 1` contributes `nums[d] - nums[b + 1]`.",
          "Then, for every `a < b`, add `cnt[nums[a] + nums[b]]` to the answer.",
          "Return the answer.",
        ],
        why: "When `b` is processed, `cnt` holds exactly the pairs `(c, d)` with `b < c < d`: the pairs with `c = b + 1` were just added, and those with larger `c` were added in earlier iterations. Each valid quadruplet is counted once — at its own `b`, for its own `a`, through its own `(c, d)` pair.",
        time: "O(n^2)",
        space: "O(V) with V = 200",
        pitfalls: [
          "Differences can be negative; since `nums[a] + nums[b] >= 2`, only positive differences need storing.",
          "Add the new `c = b + 1` pairs before counting for this `b`, not after.",
          "Count index quadruplets, not distinct value combinations.",
        ],
      }),
      examples: [
        { input: "[2,3,5,10]", expectedOutput: "1" },
        { input: "[5,5,5,5]", expectedOutput: "0" },
        { input: "[2,2,2,6,10]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[4, 6], [7, 15], [16, 26]]);
        const top = pick(rng, [4, 12, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countQuadruplets(nums: List[int]) -> int:
              n = len(nums)
              cnt = [0] * 201
              ans = 0
              for b in range(n - 3, 0, -1):
                  c = b + 1
                  for d in range(c + 1, n):
                      diff = nums[d] - nums[c]
                      if diff > 0:
                          cnt[diff] += 1
                  for a in range(b):
                      ans += cnt[nums[a] + nums[b]]
              return ans
        `,
        javascript: code`
          var countQuadruplets = function(nums) {
              var n = nums.length, ans = 0;
              var cnt = new Array(201).fill(0);
              for (var b = n - 3; b >= 1; b--) {
                  var c = b + 1;
                  for (var d = c + 1; d < n; d++) {
                      var diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (var a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          };
        `,
        typescript: code`
          function countQuadruplets(nums: number[]): number {
              var n = nums.length, ans = 0;
              var cnt: number[] = [];
              for (var k = 0; k <= 200; k++) cnt.push(0);
              for (var b = n - 3; b >= 1; b--) {
                  var c = b + 1;
                  for (var d = c + 1; d < n; d++) {
                      var diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (var a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          }
        `,
        java: code`
          public static int countQuadruplets(int[] nums) {
              int n = nums.length, ans = 0;
              int[] cnt = new int[201];
              for (int b = n - 3; b >= 1; b--) {
                  int c = b + 1;
                  for (int d = c + 1; d < n; d++) {
                      int diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (int a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          }
        `,
        cpp: code`
          int countQuadruplets(vector<int>& nums) {
              int n = nums.size(), ans = 0;
              vector<int> cnt(201, 0);
              for (int b = n - 3; b >= 1; b--) {
                  int c = b + 1;
                  for (int d = c + 1; d < n; d++) {
                      int diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (int a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          }
        `,
        c: code`
          int countQuadruplets(int* nums, int numsSize) {
              int n = numsSize, ans = 0;
              int cnt[201] = { 0 };
              for (int b = n - 3; b >= 1; b--) {
                  int c = b + 1;
                  for (int d = c + 1; d < n; d++) {
                      int diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (int a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          }
        `,
        csharp: code`
          public static int CountQuadruplets(int[] nums)
          {
              int n = nums.Length, ans = 0;
              int[] cnt = new int[201];
              for (int b = n - 3; b >= 1; b--)
              {
                  int c = b + 1;
                  for (int d = c + 1; d < n; d++)
                  {
                      int diff = nums[d] - nums[c];
                      if (diff > 0) cnt[diff]++;
                  }
                  for (int a = 0; a < b; a++) ans += cnt[nums[a] + nums[b]];
              }
              return ans;
          }
        `,
        go: code`
          func countQuadruplets(nums []int) int {
              n, ans := len(nums), 0
              cnt := make([]int, 201)
              for b := n - 3; b >= 1; b-- {
                  c := b + 1
                  for d := c + 1; d < n; d++ {
                      diff := nums[d] - nums[c]
                      if diff > 0 {
                          cnt[diff]++
                      }
                  }
                  for a := 0; a < b; a++ {
                      ans += cnt[nums[a]+nums[b]]
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun countQuadruplets(nums: IntArray): Int {
              val n = nums.size
              var ans = 0
              val cnt = IntArray(201)
              var b = n - 3
              while (b >= 1) {
                  val c = b + 1
                  for (d in c + 1 until n) {
                      val diff = nums[d] - nums[c]
                      if (diff > 0) cnt[diff]++
                  }
                  for (a in 0 until b) ans += cnt[nums[a] + nums[b]]
                  b--
              }
              return ans
          }
        `,
        swift: code`
          func countQuadruplets(_ nums: [Int]) -> Int {
              let n = nums.count
              var ans = 0
              var cnt = [Int](repeating: 0, count: 201)
              var b = n - 3
              while b >= 1 {
                  let c = b + 1
                  var d = c + 1
                  while d < n {
                      let diff = nums[d] - nums[c]
                      if diff > 0 { cnt[diff] += 1 }
                      d += 1
                  }
                  for a in 0..<b { ans += cnt[nums[a] + nums[b]] }
                  b -= 1
              }
              return ans
          }
        `,
        rust: code`
          fn countQuadruplets(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut ans = 0i32;
              let mut cnt = vec![0i32; 201];
              let mut b = n - 3;
              while b >= 1 {
                  let c = b + 1;
                  for d in (c + 1)..n {
                      let diff = nums[d] - nums[c];
                      if diff > 0 {
                          cnt[diff as usize] += 1;
                      }
                  }
                  for a in 0..b {
                      ans += cnt[(nums[a] + nums[b]) as usize];
                  }
                  b -= 1;
              }
              ans
          }
        `,
        php: code`
          function countQuadruplets($nums) {
              $n = count($nums);
              $ans = 0;
              $cnt = array_fill(0, 201, 0);
              for ($b = $n - 3; $b >= 1; $b--) {
                  $c = $b + 1;
                  for ($d = $c + 1; $d < $n; $d++) {
                      $diff = $nums[$d] - $nums[$c];
                      if ($diff > 0) $cnt[$diff]++;
                  }
                  for ($a = 0; $a < $b; $a++) $ans += $cnt[$nums[$a] + $nums[$b]];
              }
              return $ans;
          }
        `,
        ruby: code`
          def countQuadruplets(nums)
            n = nums.length
            cnt = Array.new(201, 0)
            ans = 0
            (n - 3).downto(1) do |b|
              c = b + 1
              ((c + 1)...n).each do |d|
                diff = nums[d] - nums[c]
                cnt[diff] += 1 if diff > 0
              end
              (0...b).each { |a| ans += cnt[nums[a] + nums[b]] }
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Final Value of Variable After Performing Operations (LC 2011) ─
  (() => {
    const ref = (operations: string[]) => operations.reduce((x, op) => x + (op.indexOf("+") >= 0 ? 1 : -1), 0);
    return {
      slug: "final-value-of-variable-after-performing-operations",
      title: "Final Value of Variable After Performing Operations",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Simulation", "Amazon", "Google"],
      signature: { funcName: "finalValueAfterOperations", params: [{ name: "operations", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A tiny language has one variable `X`, which starts at `0`, and four statements:\n\n- `\"++X\"` and `\"X++\"` add 1 to `X`;\n- `\"--X\"` and `\"X--\"` subtract 1 from `X`.\n\nGiven the statements in `operations`, run them in order and return the final value of `X`.",
        [
          { in: "operations = [\"X++\",\"X++\",\"--X\"]", out: "1", note: "0 → 1 → 2 → 1." },
          { in: "operations = [\"--X\",\"X--\",\"X--\",\"++X\"]", out: "-2" },
          { in: "operations = [\"++X\"]", out: "1" },
        ],
        ["1 <= operations.length <= 100", "operations[i] is one of \"++X\", \"X++\", \"--X\" or \"X--\""]),
      hints: [
        "Prefix and postfix forms do the same thing here — nothing reads `X` mid-statement.",
        "Every statement is three characters, and its middle character is always the operator's sign.",
        "Add 1 when the middle character is `+`, subtract 1 otherwise.",
      ],
      editorial: explain({
        idea: "Each statement changes `X` by exactly ±1, and the sign can be read from its middle character, which is `+` or `-` in all four forms.",
        steps: [
          "Start with `x = 0`.",
          "For each statement, add 1 if `op[1] == '+'`, else subtract 1.",
          "Return `x`.",
        ],
        why: "All four statements are three characters long and the character at index 1 is a sign in every one of them (`+`/`-` in `++X`, `X++`, `--X`, `X--`). The order of statements does not matter for a sum of ±1 steps, so a single pass gives the final value.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking only the first character fails for the postfix forms, whose first character is `X`.",
          "Pre- and post-increment differ only in what an expression would read, not in the final value.",
          "The result can be negative.",
        ],
      }),
      examples: [
        { input: '["X++","X++","--X"]', expectedOutput: "1" },
        { input: '["--X","X--","X--","++X"]', expectedOutput: "-2" },
        { input: '["++X"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 15], [16, 60]]);
        const bias = pick(rng, [0.2, 0.5, 0.8]);
        const operations = Array.from({ length: n }, () =>
          rng() < bias ? pick(rng, ["++X", "X++"]) : pick(rng, ["--X", "X--"]));
        return { input: fmtStrArr(operations), expectedOutput: String(ref(operations)) };
      },
      solutions: {
        python: code`
          from typing import List

          def finalValueAfterOperations(operations: List[str]) -> int:
              return sum(1 if op[1] == '+' else -1 for op in operations)
        `,
        javascript: code`
          var finalValueAfterOperations = function(operations) {
              var x = 0;
              for (var i = 0; i < operations.length; i++) {
                  x += operations[i].charAt(1) === '+' ? 1 : -1;
              }
              return x;
          };
        `,
        typescript: code`
          function finalValueAfterOperations(operations: string[]): number {
              var x = 0;
              for (var i = 0; i < operations.length; i++) {
                  x += operations[i].charAt(1) === '+' ? 1 : -1;
              }
              return x;
          }
        `,
        java: code`
          public static int finalValueAfterOperations(String[] operations) {
              int x = 0;
              for (String op : operations) {
                  x += op.charAt(1) == '+' ? 1 : -1;
              }
              return x;
          }
        `,
        cpp: code`
          int finalValueAfterOperations(vector<string>& operations) {
              int x = 0;
              for (const string& op : operations) {
                  x += op[1] == '+' ? 1 : -1;
              }
              return x;
          }
        `,
        c: code`
          int finalValueAfterOperations(char** operations, int operationsSize) {
              int x = 0;
              for (int i = 0; i < operationsSize; i++) {
                  x += operations[i][1] == '+' ? 1 : -1;
              }
              return x;
          }
        `,
        csharp: code`
          public static int FinalValueAfterOperations(string[] operations)
          {
              int x = 0;
              foreach (string op in operations)
              {
                  x += op[1] == '+' ? 1 : -1;
              }
              return x;
          }
        `,
        go: code`
          func finalValueAfterOperations(operations []string) int {
              x := 0
              for _, op := range operations {
                  if op[1] == '+' {
                      x++
                  } else {
                      x--
                  }
              }
              return x
          }
        `,
        kotlin: code`
          fun finalValueAfterOperations(operations: Array<String>): Int {
              var x = 0
              for (op in operations) {
                  x += if (op[1] == '+') 1 else -1
              }
              return x
          }
        `,
        swift: code`
          func finalValueAfterOperations(_ operations: [String]) -> Int {
              var x = 0
              for op in operations {
                  x += op.contains("+") ? 1 : -1
              }
              return x
          }
        `,
        rust: code`
          fn finalValueAfterOperations(operations: Vec<String>) -> i32 {
              let mut x = 0;
              for op in operations.iter() {
                  if op.as_bytes()[1] == b'+' {
                      x += 1;
                  } else {
                      x -= 1;
                  }
              }
              x
          }
        `,
        php: code`
          function finalValueAfterOperations($operations) {
              $x = 0;
              foreach ($operations as $op) {
                  $x += $op[1] == '+' ? 1 : -1;
              }
              return $x;
          }
        `,
        ruby: code`
          def finalValueAfterOperations(operations)
            operations.sum { |op| op[1] == '+' ? 1 : -1 }
          end
        `,
      },
    };
  })(),

  // ── Two Out of Three (LC 2032) ──────────────────────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[], nums3: number[]) => {
      const out: number[] = [];
      for (let v = 1; v <= 100; v++) {
        const hits = [nums1, nums2, nums3].filter((a) => a.indexOf(v) >= 0).length;
        if (hits >= 2) out.push(v);
      }
      return out;
    };
    return {
      slug: "two-out-of-three",
      title: "Two Out of Three",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Amazon", "Google"],
      signature: {
        funcName: "twoOutOfThree",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }, { name: "nums3", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Given three integer arrays, return every **distinct** value that appears in **at least two** of them.\n\nReturn the values in **ascending order**; if there are none, return an empty array.",
        [
          { in: "nums1 = [4,7,7,1], nums2 = [7,2], nums3 = [1,9]", out: "[1,7]", note: "1 is in nums1 and nums3; 7 is in nums1 and nums2." },
          { in: "nums1 = [5], nums2 = [6], nums3 = [8]", out: "[]" },
          { in: "nums1 = [3,2], nums2 = [2,3], nums3 = [3,2]", out: "[2,3]" },
        ],
        ["1 <= nums1.length, nums2.length, nums3.length <= 100", "1 <= nums1[i], nums2[j], nums3[k] <= 100"]),
      hints: [
        "Repeats inside one array do not count twice — only which arrays contain a value matters.",
        "Give each value a 3-bit mask: bit `k` set when the value occurs in array `k`.",
        "Values are at most 100: scan `v` from 1 to 100 and keep those whose mask has at least two bits set.",
      ],
      editorial: explain({
        idea: "Record, for every value, the set of arrays it appears in as a 3-bit mask; a value qualifies when its mask has two or more bits.",
        steps: [
          "Create `mask[0..100]` filled with 0.",
          "For array `k` (0, 1, 2) and each of its values `v`, set `mask[v] |= 1 << k`.",
          "Scan `v` from 1 to 100 and collect it if `mask[v]` is 3, 5, 6 or 7 (at least two bits).",
        ],
        why: "OR-ing a bit is idempotent, so duplicates within one array do not inflate the count; the mask records exactly which arrays contain `v`. Scanning values in increasing order produces the required ascending output with no sort.",
        time: "O(n1 + n2 + n3 + V) with V = 100",
        space: "O(V)",
        pitfalls: [
          "Counting occurrences instead of arrays wrongly accepts `[7,7]` appearing in only one array.",
          "Each value must be reported once, even if it is in all three arrays.",
          "The output order must be ascending here.",
        ],
      }),
      examples: [
        { input: "[4,7,7,1]\n[7,2]\n[1,9]", expectedOutput: "[1,7]" },
        { input: "[5]\n[6]\n[8]", expectedOutput: "[]" },
        { input: "[3,2]\n[2,3]\n[3,2]", expectedOutput: "[2,3]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 20, 100]);
        const mk = () => Array.from({ length: sizeOf(rng, [[1, 2], [3, 8], [9, 20]]) }, () => ri(rng, 1, top));
        const nums1 = mk(), nums2 = mk(), nums3 = mk();
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}\n${fmtIntArr(nums3)}`, expectedOutput: fmtIntArr(ref(nums1, nums2, nums3)) };
      },
      solutions: {
        python: code`
          from typing import List

          def twoOutOfThree(nums1: List[int], nums2: List[int], nums3: List[int]) -> List[int]:
              s1, s2, s3 = set(nums1), set(nums2), set(nums3)
              return sorted(v for v in s1 | s2 | s3 if (v in s1) + (v in s2) + (v in s3) >= 2)
        `,
        javascript: code`
          var twoOutOfThree = function(nums1, nums2, nums3) {
              var mask = new Array(101).fill(0);
              var arrays = [nums1, nums2, nums3];
              for (var k = 0; k < 3; k++) {
                  for (var i = 0; i < arrays[k].length; i++) mask[arrays[k][i]] |= 1 << k;
              }
              var out = [];
              for (var v = 1; v <= 100; v++) {
                  var m = mask[v];
                  if (m === 3 || m === 5 || m === 6 || m === 7) out.push(v);
              }
              return out;
          };
        `,
        typescript: code`
          function twoOutOfThree(nums1: number[], nums2: number[], nums3: number[]): number[] {
              var mask: number[] = [];
              for (var z = 0; z <= 100; z++) mask.push(0);
              var arrays: number[][] = [nums1, nums2, nums3];
              for (var k = 0; k < 3; k++) {
                  for (var i = 0; i < arrays[k].length; i++) mask[arrays[k][i]] |= 1 << k;
              }
              var out: number[] = [];
              for (var v = 1; v <= 100; v++) {
                  var m = mask[v];
                  if (m === 3 || m === 5 || m === 6 || m === 7) out.push(v);
              }
              return out;
          }
        `,
        java: code`
          public static int[] twoOutOfThree(int[] nums1, int[] nums2, int[] nums3) {
              int[] mask = new int[101];
              for (int v : nums1) mask[v] |= 1;
              for (int v : nums2) mask[v] |= 2;
              for (int v : nums3) mask[v] |= 4;
              List<Integer> out = new ArrayList<>();
              for (int v = 1; v <= 100; v++) {
                  if (Integer.bitCount(mask[v]) >= 2) out.add(v);
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> twoOutOfThree(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3) {
              vector<int> mask(101, 0);
              for (int v : nums1) mask[v] |= 1;
              for (int v : nums2) mask[v] |= 2;
              for (int v : nums3) mask[v] |= 4;
              vector<int> out;
              for (int v = 1; v <= 100; v++) {
                  int m = mask[v];
                  if (m == 3 || m == 5 || m == 6 || m == 7) out.push_back(v);
              }
              return out;
          }
        `,
        c: code`
          int* twoOutOfThree(int* nums1, int nums1Size, int* nums2, int nums2Size, int* nums3, int nums3Size, int* returnSize) {
              int mask[101] = { 0 };
              for (int i = 0; i < nums1Size; i++) mask[nums1[i]] |= 1;
              for (int i = 0; i < nums2Size; i++) mask[nums2[i]] |= 2;
              for (int i = 0; i < nums3Size; i++) mask[nums3[i]] |= 4;
              int* out = (int*)malloc(101 * sizeof(int));
              int k = 0;
              for (int v = 1; v <= 100; v++) {
                  int m = mask[v];
                  if (m == 3 || m == 5 || m == 6 || m == 7) out[k++] = v;
              }
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] TwoOutOfThree(int[] nums1, int[] nums2, int[] nums3)
          {
              int[] mask = new int[101];
              foreach (int v in nums1) mask[v] |= 1;
              foreach (int v in nums2) mask[v] |= 2;
              foreach (int v in nums3) mask[v] |= 4;
              var output = new List<int>();
              for (int v = 1; v <= 100; v++)
              {
                  int m = mask[v];
                  if (m == 3 || m == 5 || m == 6 || m == 7) output.Add(v);
              }
              return output.ToArray();
          }
        `,
        go: code`
          func twoOutOfThree(nums1 []int, nums2 []int, nums3 []int) []int {
              mask := make([]int, 101)
              for _, v := range nums1 {
                  mask[v] |= 1
              }
              for _, v := range nums2 {
                  mask[v] |= 2
              }
              for _, v := range nums3 {
                  mask[v] |= 4
              }
              out := []int{}
              for v := 1; v <= 100; v++ {
                  m := mask[v]
                  if m == 3 || m == 5 || m == 6 || m == 7 {
                      out = append(out, v)
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun twoOutOfThree(nums1: IntArray, nums2: IntArray, nums3: IntArray): IntArray {
              val mask = IntArray(101)
              for (v in nums1) mask[v] = mask[v] or 1
              for (v in nums2) mask[v] = mask[v] or 2
              for (v in nums3) mask[v] = mask[v] or 4
              val out = ArrayList<Int>()
              for (v in 1..100) {
                  if (Integer.bitCount(mask[v]) >= 2) out.add(v)
              }
              return out.toIntArray()
          }
        `,
        swift: code`
          func twoOutOfThree(_ nums1: [Int], _ nums2: [Int], _ nums3: [Int]) -> [Int] {
              var mask = [Int](repeating: 0, count: 101)
              for v in nums1 { mask[v] |= 1 }
              for v in nums2 { mask[v] |= 2 }
              for v in nums3 { mask[v] |= 4 }
              var out = [Int]()
              for v in 1...100 where mask[v].nonzeroBitCount >= 2 {
                  out.append(v)
              }
              return out
          }
        `,
        rust: code`
          fn twoOutOfThree(nums1: Vec<i32>, nums2: Vec<i32>, nums3: Vec<i32>) -> Vec<i32> {
              let mut mask = vec![0u32; 101];
              for &v in nums1.iter() {
                  mask[v as usize] |= 1;
              }
              for &v in nums2.iter() {
                  mask[v as usize] |= 2;
              }
              for &v in nums3.iter() {
                  mask[v as usize] |= 4;
              }
              let mut out = Vec::new();
              for v in 1..=100usize {
                  if mask[v].count_ones() >= 2 {
                      out.push(v as i32);
                  }
              }
              out
          }
        `,
        php: code`
          function twoOutOfThree($nums1, $nums2, $nums3) {
              $mask = array_fill(0, 101, 0);
              foreach ($nums1 as $v) $mask[$v] |= 1;
              foreach ($nums2 as $v) $mask[$v] |= 2;
              foreach ($nums3 as $v) $mask[$v] |= 4;
              $out = [];
              for ($v = 1; $v <= 100; $v++) {
                  $m = $mask[$v];
                  if ($m == 3 || $m == 5 || $m == 6 || $m == 7) $out[] = $v;
              }
              return $out;
          }
        `,
        ruby: code`
          def twoOutOfThree(nums1, nums2, nums3)
            s1, s2, s3 = nums1.uniq, nums2.uniq, nums3.uniq
            (1..100).select { |v| [s1, s2, s3].count { |s| s.include?(v) } >= 2 }
          end
        `,
      },
    };
  })(),

  // ── Smallest Index With Equal Value (LC 2057) ───────────────────
  (() => {
    const ref = (nums: number[]) => {
      for (let i = 0; i < nums.length; i++) if (i % 10 === nums[i]) return i;
      return -1;
    };
    return {
      slug: "smallest-index-with-equal-value",
      title: "Smallest Index With Equal Value",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Google"],
      signature: { funcName: "smallestEqual", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` is a 0-indexed array of digits. Return the **smallest** index `i` such that `i mod 10 == nums[i]`, or `-1` if there is no such index.",
        [
          { in: "nums = [7,1,5]", out: "1", note: "Index 0: 0 ≠ 7. Index 1: 1 mod 10 = 1 = nums[1]." },
          { in: "nums = [3,0,1]", out: "-1" },
          { in: "nums = [1,2,3,4,5,6,7,8,9,0,4,1]", out: "11", note: "No index below 10 matches; 10 mod 10 = 0 ≠ 4, and 11 mod 10 = 1 = nums[11]." },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 9"]),
      hints: [
        "Check the indices in increasing order — the first match is the answer.",
        "Compare `nums[i]` with `i % 10`, not with `i`: from index 10 onwards the index has two digits.",
        "If the loop finishes without a match, return -1.",
      ],
      editorial: explain({
        idea: "Scanning indices from 0 upward and stopping at the first `i` with `i % 10 == nums[i]` returns the smallest such index by construction.",
        steps: [
          "For `i` from 0 to `n - 1`: if `i % 10 == nums[i]`, return `i`.",
          "Return -1.",
        ],
        why: "Every index is tested in increasing order, so the first one that passes is the smallest that passes; if none passes, -1 is correct.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing with `i` instead of `i % 10` misses every match at index 10 or above.",
          "Return the index, not the value.",
          "Stop at the first match — later matches are larger.",
        ],
      }),
      examples: [
        { input: "[7,1,5]", expectedOutput: "1" },
        { input: "[3,0,1]", expectedOutput: "-1" },
        { input: "[1,2,3,4,5,6,7,8,9,0,4,1]", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 60], [61, 100]]);
        const avoid = rng() < 0.4;
        const nums = Array.from({ length: n }, (_, i) => {
          if (!avoid) return ri(rng, 0, 9);
          const d = ri(rng, 0, 8);
          return d >= i % 10 ? d + 1 : d;
        });
        if (avoid && rng() < 0.5) { const i = ri(rng, 0, n - 1); nums[i] = i % 10; }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def smallestEqual(nums: List[int]) -> int:
              for i, x in enumerate(nums):
                  if i % 10 == x:
                      return i
              return -1
        `,
        javascript: code`
          var smallestEqual = function(nums) {
              for (var i = 0; i < nums.length; i++) {
                  if (i % 10 === nums[i]) return i;
              }
              return -1;
          };
        `,
        typescript: code`
          function smallestEqual(nums: number[]): number {
              for (var i = 0; i < nums.length; i++) {
                  if (i % 10 === nums[i]) return i;
              }
              return -1;
          }
        `,
        java: code`
          public static int smallestEqual(int[] nums) {
              for (int i = 0; i < nums.length; i++) {
                  if (i % 10 == nums[i]) return i;
              }
              return -1;
          }
        `,
        cpp: code`
          int smallestEqual(vector<int>& nums) {
              for (int i = 0; i < (int)nums.size(); i++) {
                  if (i % 10 == nums[i]) return i;
              }
              return -1;
          }
        `,
        c: code`
          int smallestEqual(int* nums, int numsSize) {
              for (int i = 0; i < numsSize; i++) {
                  if (i % 10 == nums[i]) return i;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int SmallestEqual(int[] nums)
          {
              for (int i = 0; i < nums.Length; i++)
              {
                  if (i % 10 == nums[i]) return i;
              }
              return -1;
          }
        `,
        go: code`
          func smallestEqual(nums []int) int {
              for i, x := range nums {
                  if i%10 == x {
                      return i
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun smallestEqual(nums: IntArray): Int {
              for (i in nums.indices) {
                  if (i % 10 == nums[i]) return i
              }
              return -1
          }
        `,
        swift: code`
          func smallestEqual(_ nums: [Int]) -> Int {
              for i in 0..<nums.count where i % 10 == nums[i] {
                  return i
              }
              return -1
          }
        `,
        rust: code`
          fn smallestEqual(nums: Vec<i32>) -> i32 {
              for (i, &x) in nums.iter().enumerate() {
                  if (i % 10) as i32 == x {
                      return i as i32;
                  }
              }
              -1
          }
        `,
        php: code`
          function smallestEqual($nums) {
              foreach ($nums as $i => $x) {
                  if ($i % 10 == $x) return $i;
              }
              return -1;
          }
        `,
        ruby: code`
          def smallestEqual(nums)
            nums.each_with_index { |x, i| return i if i % 10 == x }
            -1
          end
        `,
      },
    };
  })(),

  // ── Two Furthest Houses With Different Colors (LC 2078) ─────────
  (() => {
    const ref = (colors: number[]) => {
      let best = 0;
      for (let i = 0; i < colors.length; i++)
        for (let j = i + 1; j < colors.length; j++) if (colors[i] !== colors[j]) best = Math.max(best, j - i);
      return best;
    };
    return {
      slug: "two-furthest-houses-with-different-colors",
      title: "Two Furthest Houses With Different Colors",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Amazon", "Google"],
      signature: { funcName: "maxDistance", params: [{ name: "colors", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`n` houses stand in a row, and `colors[i]` is the colour of house `i`. The distance between houses `i` and `j` is `|i - j|`.\n\nReturn the largest distance between two houses of **different** colours. At least two houses have different colours.",
        [
          { in: "colors = [2,2,5,2,2]", out: "2", note: "House 2 is the only one with colour 5; it is 2 away from both ends." },
          { in: "colors = [4,8]", out: "1" },
          { in: "colors = [3,1,3,3,3,3]", out: "4", note: "Houses 1 and 5." },
        ],
        ["2 <= n <= 100", "n == colors.length", "0 <= colors[i] <= 100", "At least two houses have different colours"]),
      hints: [
        "One end of the best pair can always be the first house or the last house.",
        "If the first and last houses differ, the answer is `n - 1`.",
        "Otherwise compare: the furthest house from the left end whose colour differs from `colors[0]`, and the furthest house from the right end whose colour differs from `colors[n - 1]`.",
      ],
      editorial: explain({
        idea: "An optimal pair can always be stretched to touch an end of the row, so only pairs involving house 0 or house `n - 1` need checking.",
        steps: [
          "Find the largest `j` with `colors[j] != colors[0]`; it gives distance `j`.",
          "Find the smallest `i` with `colors[i] != colors[n - 1]`; it gives distance `n - 1 - i`.",
          "Return the larger of the two.",
        ],
        why: "Take an optimal pair `i < j`. If `colors[j] != colors[0]`, the pair `(0, j)` is at least as long, and the first scan finds some `j' >= j`. If `colors[i] != colors[n - 1]`, the pair `(i, n - 1)` is at least as long, and the second scan finds some `i' <= i`. Otherwise `colors[0] == colors[j]` and `colors[n - 1] == colors[i]`, so the two ends differ and the first scan already returns `n - 1`, the largest distance there is.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking only pairs that use house 0 returns 1 on `[2,1,2,2,2]`, whose answer is 3 — scan from both ends.",
          "The brute-force double loop is fine for n ≤ 100, but the end-anchored scan is O(n).",
          "Colours may be 0, so do not use 0 as a 'no colour' sentinel.",
        ],
      }),
      examples: [
        { input: "[2,2,5,2,2]", expectedOutput: "2" },
        { input: "[4,8]", expectedOutput: "1" },
        { input: "[3,1,3,3,3,3]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[2, 3], [4, 12], [13, 60]]);
        const top = pick(rng, [1, 2, 100]);
        const base = ri(rng, 0, 100);
        const colors = Array.from({ length: n }, () => (rng() < 0.6 ? base : ri(rng, 0, top)));
        if (colors.every((c) => c === colors[0])) {
          const i = ri(rng, 0, n - 1);
          colors[i] = colors[i] === 100 ? 99 : colors[i] + 1;
        }
        return { input: fmtIntArr(colors), expectedOutput: String(ref(colors)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxDistance(colors: List[int]) -> int:
              n = len(colors)
              best = 0
              for j in range(n - 1, -1, -1):
                  if colors[j] != colors[0]:
                      best = j
                      break
              for i in range(n):
                  if colors[i] != colors[n - 1]:
                      best = max(best, n - 1 - i)
                      break
              return best
        `,
        javascript: code`
          var maxDistance = function(colors) {
              var n = colors.length, best = 0;
              for (var j = n - 1; j >= 0; j--) {
                  if (colors[j] !== colors[0]) { best = j; break; }
              }
              for (var i = 0; i < n; i++) {
                  if (colors[i] !== colors[n - 1]) { best = Math.max(best, n - 1 - i); break; }
              }
              return best;
          };
        `,
        typescript: code`
          function maxDistance(colors: number[]): number {
              var n = colors.length, best = 0;
              for (var j = n - 1; j >= 0; j--) {
                  if (colors[j] !== colors[0]) { best = j; break; }
              }
              for (var i = 0; i < n; i++) {
                  if (colors[i] !== colors[n - 1]) { best = Math.max(best, n - 1 - i); break; }
              }
              return best;
          }
        `,
        java: code`
          public static int maxDistance(int[] colors) {
              int n = colors.length, best = 0;
              for (int j = n - 1; j >= 0; j--) {
                  if (colors[j] != colors[0]) { best = j; break; }
              }
              for (int i = 0; i < n; i++) {
                  if (colors[i] != colors[n - 1]) { best = Math.max(best, n - 1 - i); break; }
              }
              return best;
          }
        `,
        cpp: code`
          int maxDistance(vector<int>& colors) {
              int n = colors.size(), best = 0;
              for (int j = n - 1; j >= 0; j--) {
                  if (colors[j] != colors[0]) { best = j; break; }
              }
              for (int i = 0; i < n; i++) {
                  if (colors[i] != colors[n - 1]) { best = max(best, n - 1 - i); break; }
              }
              return best;
          }
        `,
        c: code`
          int maxDistance(int* colors, int colorsSize) {
              int n = colorsSize, best = 0;
              for (int j = n - 1; j >= 0; j--) {
                  if (colors[j] != colors[0]) { best = j; break; }
              }
              for (int i = 0; i < n; i++) {
                  if (colors[i] != colors[n - 1]) {
                      if (n - 1 - i > best) best = n - 1 - i;
                      break;
                  }
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxDistance(int[] colors)
          {
              int n = colors.Length, best = 0;
              for (int j = n - 1; j >= 0; j--)
              {
                  if (colors[j] != colors[0]) { best = j; break; }
              }
              for (int i = 0; i < n; i++)
              {
                  if (colors[i] != colors[n - 1]) { best = Math.Max(best, n - 1 - i); break; }
              }
              return best;
          }
        `,
        go: code`
          func maxDistance(colors []int) int {
              n, best := len(colors), 0
              for j := n - 1; j >= 0; j-- {
                  if colors[j] != colors[0] {
                      best = j
                      break
                  }
              }
              for i := 0; i < n; i++ {
                  if colors[i] != colors[n-1] {
                      if n-1-i > best {
                          best = n - 1 - i
                      }
                      break
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxDistance(colors: IntArray): Int {
              val n = colors.size
              var best = 0
              for (j in n - 1 downTo 0) {
                  if (colors[j] != colors[0]) { best = j; break }
              }
              for (i in 0 until n) {
                  if (colors[i] != colors[n - 1]) { best = maxOf(best, n - 1 - i); break }
              }
              return best
          }
        `,
        swift: code`
          func maxDistance(_ colors: [Int]) -> Int {
              let n = colors.count
              var best = 0
              for j in stride(from: n - 1, through: 0, by: -1) where colors[j] != colors[0] {
                  best = j
                  break
              }
              for i in 0..<n where colors[i] != colors[n - 1] {
                  best = max(best, n - 1 - i)
                  break
              }
              return best
          }
        `,
        rust: code`
          fn maxDistance(colors: Vec<i32>) -> i32 {
              let n = colors.len();
              let mut best = 0usize;
              for j in (0..n).rev() {
                  if colors[j] != colors[0] {
                      best = j;
                      break;
                  }
              }
              for i in 0..n {
                  if colors[i] != colors[n - 1] {
                      best = best.max(n - 1 - i);
                      break;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function maxDistance($colors) {
              $n = count($colors);
              $best = 0;
              for ($j = $n - 1; $j >= 0; $j--) {
                  if ($colors[$j] != $colors[0]) { $best = $j; break; }
              }
              for ($i = 0; $i < $n; $i++) {
                  if ($colors[$i] != $colors[$n - 1]) { $best = max($best, $n - 1 - $i); break; }
              }
              return $best;
          }
        `,
        ruby: code`
          def maxDistance(colors)
            n = colors.length
            right = (n - 1).downto(0).find { |j| colors[j] != colors[0] } || 0
            left = (0...n).find { |i| colors[i] != colors[n - 1] }
            left.nil? ? right : [right, n - 1 - left].max
          end
        `,
      },
    };
  })(),

  // ── Find Target Indices After Sorting Array (LC 2089) ───────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      const out: number[] = [];
      sorted.forEach((v, i) => { if (v === target) out.push(i); });
      return out;
    };
    return {
      slug: "find-target-indices-after-sorting-array",
      title: "Find Target Indices After Sorting Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "targetIndices",
        params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Sort `nums` in non-decreasing order. A **target index** is an index `i` of the sorted array with `nums[i] == target`.\n\nReturn all target indices in **increasing order**, or an empty array if `target` does not occur.",
        [
          { in: "nums = [6,3,6,1], target = 6", out: "[2,3]", note: "Sorted: [1,3,6,6]; the 6s sit at indices 2 and 3." },
          { in: "nums = [5,9,2], target = 4", out: "[]" },
          { in: "nums = [7,7,7], target = 7", out: "[0,1,2]" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i], target <= 100"]),
      hints: [
        "After sorting, all copies of `target` form one contiguous block.",
        "Where does that block start? Exactly after every element smaller than `target`.",
        "Count `less` (elements below `target`) and `equal` (copies of `target`); the answer is `less, less + 1, ..., less + equal - 1` — no sort needed.",
      ],
      editorial: explain({
        idea: "In the sorted array the copies of `target` occupy a single block that begins right after all smaller elements, so two counts determine the answer without sorting.",
        steps: [
          "Count `less`, the elements smaller than `target`, and `equal`, the elements equal to it.",
          "Return the indices `less` through `less + equal - 1`.",
        ],
        why: "Sorting places every element smaller than `target` before every copy of `target`, and every larger element after them. So the copies of `target` fill positions `less` to `less + equal - 1` exactly, regardless of the original order.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "Return indices of the sorted array, not of the original array.",
          "When `equal == 0`, return an empty array.",
          "Sorting and scanning also works (O(n log n)) — just do not sort the caller's array in place where it matters.",
        ],
      }),
      examples: [
        { input: "[6,3,6,1]\n6", expectedOutput: "[2,3]" },
        { input: "[5,9,2]\n4", expectedOutput: "[]" },
        { input: "[7,7,7]\n7", expectedOutput: "[0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 60]]);
        const top = pick(rng, [3, 10, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const target = rng() < 0.7 ? pick(rng, nums) : ri(rng, 1, 100);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntArr(ref(nums, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def targetIndices(nums: List[int], target: int) -> List[int]:
              less = sum(1 for x in nums if x < target)
              equal = nums.count(target)
              return list(range(less, less + equal))
        `,
        javascript: code`
          var targetIndices = function(nums, target) {
              var less = 0, equal = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] < target) less++;
                  else if (nums[i] === target) equal++;
              }
              var out = [];
              for (var k = 0; k < equal; k++) out.push(less + k);
              return out;
          };
        `,
        typescript: code`
          function targetIndices(nums: number[], target: number): number[] {
              var less = 0, equal = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] < target) less++;
                  else if (nums[i] === target) equal++;
              }
              var out: number[] = [];
              for (var k = 0; k < equal; k++) out.push(less + k);
              return out;
          }
        `,
        java: code`
          public static int[] targetIndices(int[] nums, int target) {
              int less = 0, equal = 0;
              for (int v : nums) {
                  if (v < target) less++;
                  else if (v == target) equal++;
              }
              int[] out = new int[equal];
              for (int k = 0; k < equal; k++) out[k] = less + k;
              return out;
          }
        `,
        cpp: code`
          vector<int> targetIndices(vector<int>& nums, int target) {
              int less = 0, equal = 0;
              for (int v : nums) {
                  if (v < target) less++;
                  else if (v == target) equal++;
              }
              vector<int> out;
              for (int k = 0; k < equal; k++) out.push_back(less + k);
              return out;
          }
        `,
        c: code`
          int* targetIndices(int* nums, int numsSize, int target, int* returnSize) {
              int less = 0, equal = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] < target) less++;
                  else if (nums[i] == target) equal++;
              }
              int* out = (int*)malloc((equal > 0 ? equal : 1) * sizeof(int));
              for (int k = 0; k < equal; k++) out[k] = less + k;
              *returnSize = equal;
              return out;
          }
        `,
        csharp: code`
          public static int[] TargetIndices(int[] nums, int target)
          {
              int less = 0, equal = 0;
              foreach (int v in nums)
              {
                  if (v < target) less++;
                  else if (v == target) equal++;
              }
              int[] output = new int[equal];
              for (int k = 0; k < equal; k++) output[k] = less + k;
              return output;
          }
        `,
        go: code`
          func targetIndices(nums []int, target int) []int {
              less, equal := 0, 0
              for _, v := range nums {
                  if v < target {
                      less++
                  } else if v == target {
                      equal++
                  }
              }
              out := make([]int, equal)
              for k := 0; k < equal; k++ {
                  out[k] = less + k
              }
              return out
          }
        `,
        kotlin: code`
          fun targetIndices(nums: IntArray, target: Int): IntArray {
              var less = 0
              var equal = 0
              for (v in nums) {
                  if (v < target) less++ else if (v == target) equal++
              }
              return IntArray(equal) { less + it }
          }
        `,
        swift: code`
          func targetIndices(_ nums: [Int], _ target: Int) -> [Int] {
              var less = 0, equal = 0
              for v in nums {
                  if v < target { less += 1 } else if v == target { equal += 1 }
              }
              var out = [Int]()
              var k = 0
              while k < equal {
                  out.append(less + k)
                  k += 1
              }
              return out
          }
        `,
        rust: code`
          fn targetIndices(nums: Vec<i32>, target: i32) -> Vec<i32> {
              let mut less = 0i32;
              let mut equal = 0i32;
              for &v in nums.iter() {
                  if v < target {
                      less += 1;
                  } else if v == target {
                      equal += 1;
                  }
              }
              (less..less + equal).collect()
          }
        `,
        php: code`
          function targetIndices($nums, $target) {
              $less = 0;
              $equal = 0;
              foreach ($nums as $v) {
                  if ($v < $target) $less++;
                  elseif ($v == $target) $equal++;
              }
              $out = [];
              for ($k = 0; $k < $equal; $k++) $out[] = $less + $k;
              return $out;
          }
        `,
        ruby: code`
          def targetIndices(nums, target)
            less = nums.count { |x| x < target }
            equal = nums.count(target)
            (less...(less + equal)).to_a
          end
        `,
      },
    };
  })(),

  // ── Finding 3-Digit Even Numbers (LC 2094) ──────────────────────
  (() => {
    const ref = (digits: number[]) => {
      const found = new Set<number>();
      const n = digits.length;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          for (let k = 0; k < n; k++) {
            if (i === j || j === k || i === k) continue;
            if (digits[i] === 0 || digits[k] % 2 !== 0) continue;
            found.add(digits[i] * 100 + digits[j] * 10 + digits[k]);
          }
      return Array.from(found).sort((a, b) => a - b);
    };
    return {
      slug: "finding-3-digit-even-numbers",
      title: "Finding 3-Digit Even Numbers",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Sorting", "Amazon", "Google"],
      signature: { funcName: "findEvenNumbers", params: [{ name: "digits", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "`digits` is a list of decimal digits that may repeat. Build integers by choosing **three different positions** of `digits` and writing their digits in any order, subject to:\n\n- the integer has no leading zero (so it really has three digits), and\n- the integer is even.\n\nReturn every distinct integer that can be built this way, sorted in **ascending order**.",
        [
          { in: "digits = [4,0,4]", out: "[404,440]" },
          { in: "digits = [1,3,5]", out: "[]", note: "No even digit is available for the last place." },
          { in: "digits = [6,1,6,0]", out: "[106,160,166,606,610,616,660]" },
        ],
        ["3 <= digits.length <= 100", "0 <= digits[i] <= 9"]),
      hints: [
        "There are only 450 even three-digit numbers: 100, 102, ..., 998.",
        "A candidate can be built when, for each digit, it uses that digit no more often than `digits` contains it.",
        "Count the digits once, then test each even number from 100 to 998 against the counts — the output comes out sorted for free.",
      ],
      editorial: explain({
        idea: "Instead of combining positions (up to 100^3 triples), enumerate the answers: test each of the 450 even three-digit numbers against the digit counts.",
        steps: [
          "Count how many times each digit 0–9 occurs in `digits`.",
          "For `x` from 100 to 998 in steps of 2, split it into its three digits.",
          "Keep `x` if, after taking those three digits from the counts, no count is negative; restore the counts afterwards.",
          "The kept numbers are already in ascending order.",
        ],
        why: "A number can be formed from three distinct positions exactly when the multiset of its digits fits inside the multiset of `digits`. Starting at 100 rules out leading zeros, and stepping by 2 from an even start keeps only even numbers, so the scan produces precisely the required set, once each, in order.",
        time: "O(n + 450)",
        space: "O(1)",
        pitfalls: [
          "A digit may be used only as many times as it occurs: `[2,2,8]` can make 282 but not 222.",
          "Duplicates in `digits` produce the same number many ways — report each number once.",
          "Leading zeros are not allowed: `[0,2,4]` gives 204, 240, 402, 420, but not 024.",
        ],
      }),
      examples: [
        { input: "[4,0,4]", expectedOutput: "[404,440]" },
        { input: "[1,3,5]", expectedOutput: "[]" },
        { input: "[6,1,6,0]", expectedOutput: "[106,160,166,606,610,616,660]" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[3, 4], [5, 7], [8, 14], [15, 30]]);
        const alphabet = pick(rng, [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 3, 5, 7, 9, 2], [0, 2, 4], [0, 0, 1, 7, 8]]);
        const digits = Array.from({ length: n }, () => pick(rng, alphabet));
        return { input: fmtIntArr(digits), expectedOutput: fmtIntArr(ref(digits)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findEvenNumbers(digits: List[int]) -> List[int]:
              cnt = [0] * 10
              for d in digits:
                  cnt[d] += 1
              out = []
              for x in range(100, 1000, 2):
                  a, b, c = x // 100, x // 10 % 10, x % 10
                  cnt[a] -= 1
                  cnt[b] -= 1
                  cnt[c] -= 1
                  if cnt[a] >= 0 and cnt[b] >= 0 and cnt[c] >= 0:
                      out.append(x)
                  cnt[a] += 1
                  cnt[b] += 1
                  cnt[c] += 1
              return out
        `,
        javascript: code`
          var findEvenNumbers = function(digits) {
              var cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < digits.length; i++) cnt[digits[i]]++;
              var out = [];
              for (var x = 100; x < 1000; x += 2) {
                  var a = Math.floor(x / 100), b = Math.floor(x / 10) % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out.push(x);
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              return out;
          };
        `,
        typescript: code`
          function findEvenNumbers(digits: number[]): number[] {
              var cnt: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < digits.length; i++) cnt[digits[i]]++;
              var out: number[] = [];
              for (var x = 100; x < 1000; x += 2) {
                  var a = Math.floor(x / 100), b = Math.floor(x / 10) % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out.push(x);
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              return out;
          }
        `,
        java: code`
          public static int[] findEvenNumbers(int[] digits) {
              int[] cnt = new int[10];
              for (int d : digits) cnt[d]++;
              List<Integer> out = new ArrayList<>();
              for (int x = 100; x < 1000; x += 2) {
                  int a = x / 100, b = x / 10 % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out.add(x);
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> findEvenNumbers(vector<int>& digits) {
              int cnt[10] = { 0 };
              for (int d : digits) cnt[d]++;
              vector<int> out;
              for (int x = 100; x < 1000; x += 2) {
                  int a = x / 100, b = x / 10 % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out.push_back(x);
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              return out;
          }
        `,
        c: code`
          int* findEvenNumbers(int* digits, int digitsSize, int* returnSize) {
              int cnt[10] = { 0 };
              for (int i = 0; i < digitsSize; i++) cnt[digits[i]]++;
              int* out = (int*)malloc(450 * sizeof(int));
              int k = 0;
              for (int x = 100; x < 1000; x += 2) {
                  int a = x / 100, b = x / 10 % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out[k++] = x;
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] FindEvenNumbers(int[] digits)
          {
              int[] cnt = new int[10];
              foreach (int d in digits) cnt[d]++;
              var output = new List<int>();
              for (int x = 100; x < 1000; x += 2)
              {
                  int a = x / 100, b = x / 10 % 10, c = x % 10;
                  cnt[a]--; cnt[b]--; cnt[c]--;
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) output.Add(x);
                  cnt[a]++; cnt[b]++; cnt[c]++;
              }
              return output.ToArray();
          }
        `,
        go: code`
          func findEvenNumbers(digits []int) []int {
              cnt := make([]int, 10)
              for _, d := range digits {
                  cnt[d]++
              }
              out := []int{}
              for x := 100; x < 1000; x += 2 {
                  a, b, c := x/100, x/10%10, x%10
                  cnt[a]--
                  cnt[b]--
                  cnt[c]--
                  if cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0 {
                      out = append(out, x)
                  }
                  cnt[a]++
                  cnt[b]++
                  cnt[c]++
              }
              return out
          }
        `,
        kotlin: code`
          fun findEvenNumbers(digits: IntArray): IntArray {
              val cnt = IntArray(10)
              for (d in digits) cnt[d]++
              val out = ArrayList<Int>()
              var x = 100
              while (x < 1000) {
                  val a = x / 100
                  val b = x / 10 % 10
                  val c = x % 10
                  cnt[a]--; cnt[b]--; cnt[c]--
                  if (cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0) out.add(x)
                  cnt[a]++; cnt[b]++; cnt[c]++
                  x += 2
              }
              return out.toIntArray()
          }
        `,
        swift: code`
          func findEvenNumbers(_ digits: [Int]) -> [Int] {
              var cnt = [Int](repeating: 0, count: 10)
              for d in digits { cnt[d] += 1 }
              var out = [Int]()
              for x in stride(from: 100, to: 1000, by: 2) {
                  let a = x / 100, b = x / 10 % 10, c = x % 10
                  cnt[a] -= 1; cnt[b] -= 1; cnt[c] -= 1
                  if cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0 { out.append(x) }
                  cnt[a] += 1; cnt[b] += 1; cnt[c] += 1
              }
              return out
          }
        `,
        rust: code`
          fn findEvenNumbers(digits: Vec<i32>) -> Vec<i32> {
              let mut cnt = [0i32; 10];
              for &d in digits.iter() {
                  cnt[d as usize] += 1;
              }
              let mut out = Vec::new();
              let mut x = 100usize;
              while x < 1000 {
                  let (a, b, c) = (x / 100, x / 10 % 10, x % 10);
                  cnt[a] -= 1;
                  cnt[b] -= 1;
                  cnt[c] -= 1;
                  if cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0 {
                      out.push(x as i32);
                  }
                  cnt[a] += 1;
                  cnt[b] += 1;
                  cnt[c] += 1;
                  x += 2;
              }
              out
          }
        `,
        php: code`
          function findEvenNumbers($digits) {
              $cnt = array_fill(0, 10, 0);
              foreach ($digits as $d) $cnt[$d]++;
              $out = [];
              for ($x = 100; $x < 1000; $x += 2) {
                  $a = intdiv($x, 100);
                  $b = intdiv($x, 10) % 10;
                  $c = $x % 10;
                  $cnt[$a]--; $cnt[$b]--; $cnt[$c]--;
                  if ($cnt[$a] >= 0 && $cnt[$b] >= 0 && $cnt[$c] >= 0) $out[] = $x;
                  $cnt[$a]++; $cnt[$b]++; $cnt[$c]++;
              }
              return $out;
          }
        `,
        ruby: code`
          def findEvenNumbers(digits)
            cnt = Array.new(10, 0)
            digits.each { |d| cnt[d] += 1 }
            out = []
            100.step(998, 2) do |x|
              a, b, c = x / 100, x / 10 % 10, x % 10
              cnt[a] -= 1
              cnt[b] -= 1
              cnt[c] -= 1
              out << x if cnt[a] >= 0 && cnt[b] >= 0 && cnt[c] >= 0
              cnt[a] += 1
              cnt[b] += 1
              cnt[c] += 1
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Check if Every Row and Column Contains All Numbers (LC 2133) ─
  (() => {
    const ref = (matrix: number[][]) => {
      const n = matrix.length;
      const full = (vals: number[]) => new Set(vals).size === n && vals.every((v) => v >= 1 && v <= n);
      for (let i = 0; i < n; i++) {
        if (!full(matrix[i])) return false;
        if (!full(matrix.map((row) => row[i]))) return false;
      }
      return true;
    };
    return {
      slug: "check-if-every-row-and-column-contains-all-numbers",
      title: "Check if Every Row and Column Contains All Numbers",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Matrix", "Amazon", "Google"],
      signature: { funcName: "checkValid", params: [{ name: "matrix", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "An `n x n` matrix is **valid** when every row and every column contains each of the integers `1` to `n` (so each exactly once).\n\nGiven an `n x n` matrix whose entries are all between `1` and `n`, return `true` if it is valid.",
        [
          { in: "matrix = [[3,1,2],[1,2,3],[2,3,1]]", out: "true" },
          { in: "matrix = [[1,2,3],[2,3,1],[1,3,2]]", out: "false", note: "Every row is fine, but column 0 is [1,2,1]: it repeats 1 and misses 3." },
          { in: "matrix = [[1]]", out: "true" },
        ],
        ["n == matrix.length == matrix[i].length", "1 <= n <= 100", "1 <= matrix[i][j] <= n"]),
      hints: [
        "A line of `n` values drawn from 1..n contains every number exactly when it has no repeated value.",
        "So the task reduces to: no row and no column has a duplicate.",
        "Check row `i` and column `i` together with two 'seen' arrays of size `n + 1`.",
      ],
      editorial: explain({
        idea: "Since every entry is already in `1..n`, a row or column of `n` entries covers all of `1..n` if and only if it has no duplicates — so duplicate detection per line is enough.",
        steps: [
          "For each `i` from 0 to `n - 1`, clear two boolean arrays `row` and `col` of size `n + 1`.",
          "For each `j`, look at `a = matrix[i][j]` and `b = matrix[j][i]`; if `row[a]` or `col[b]` is already set, return `false`; otherwise set both.",
          "Return `true` when every row and column passes.",
        ],
        why: "By the pigeonhole principle, `n` values from a set of size `n` with no repetition must use every value once. Checking row `i` and column `i` in the same loop visits each line exactly once.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Checking only rows (or only sums) is not enough: `[[1,2],[1,2]]` has perfect rows but bad columns.",
          "Equal row sums prove nothing — `[2,2,2]` sums like `[1,2,3]`.",
          "Reset the seen arrays for each new row and column.",
        ],
      }),
      examples: [
        { input: "[[3,1,2],[1,2,3],[2,3,1]]", expectedOutput: "true" },
        { input: "[[1,2,3],[2,3,1],[1,3,2]]", expectedOutput: "false" },
        { input: "[[1]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 2], [3, 5], [6, 9]]);
        const perm = () => shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const P = perm(), Q = perm(), S = perm();
        let matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => S[(P[i] + Q[j]) % n] + 1));
        if (rng() < 0.55) {
          const kind = ri(rng, 0, 2);
          if (kind === 0) matrix[ri(rng, 0, n - 1)][ri(rng, 0, n - 1)] = ri(rng, 1, n);
          else if (kind === 1) {
            const row = matrix[ri(rng, 0, n - 1)];
            const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
            [row[a], row[b]] = [row[b], row[a]];
          } else matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, 1, n)));
        }
        return { input: fmtIntMat(matrix), expectedOutput: bool(ref(matrix)) };
      },
      solutions: {
        python: code`
          from typing import List

          def checkValid(matrix: List[List[int]]) -> bool:
              n = len(matrix)
              for i in range(n):
                  if len(set(matrix[i])) != n:
                      return False
                  if len(set(matrix[j][i] for j in range(n))) != n:
                      return False
              return True
        `,
        javascript: code`
          var checkValid = function(matrix) {
              var n = matrix.length;
              for (var i = 0; i < n; i++) {
                  var row = new Array(n + 1).fill(false), col = new Array(n + 1).fill(false);
                  for (var j = 0; j < n; j++) {
                      var a = matrix[i][j], b = matrix[j][i];
                      if (row[a] || col[b]) return false;
                      row[a] = true;
                      col[b] = true;
                  }
              }
              return true;
          };
        `,
        typescript: code`
          function checkValid(matrix: number[][]): boolean {
              var n = matrix.length;
              var row: number[] = [], col: number[] = [];
              for (var k = 0; k <= n; k++) { row.push(-1); col.push(-1); }
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      var a = matrix[i][j], b = matrix[j][i];
                      if (row[a] === i || col[b] === i) return false;
                      row[a] = i;
                      col[b] = i;
                  }
              }
              return true;
          }
        `,
        java: code`
          public static boolean checkValid(int[][] matrix) {
              int n = matrix.length;
              for (int i = 0; i < n; i++) {
                  boolean[] row = new boolean[n + 1], col = new boolean[n + 1];
                  for (int j = 0; j < n; j++) {
                      int a = matrix[i][j], b = matrix[j][i];
                      if (row[a] || col[b]) return false;
                      row[a] = true;
                      col[b] = true;
                  }
              }
              return true;
          }
        `,
        cpp: code`
          bool checkValid(vector<vector<int>>& matrix) {
              int n = matrix.size();
              for (int i = 0; i < n; i++) {
                  vector<bool> row(n + 1, false), col(n + 1, false);
                  for (int j = 0; j < n; j++) {
                      int a = matrix[i][j], b = matrix[j][i];
                      if (row[a] || col[b]) return false;
                      row[a] = true;
                      col[b] = true;
                  }
              }
              return true;
          }
        `,
        c: code`
          bool checkValid(int** matrix, int matrixSize, int* matrixColSize) {
              int n = matrixSize;
              int row[101], col[101];
              for (int k = 0; k <= 100; k++) { row[k] = -1; col[k] = -1; }
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      int a = matrix[i][j], b = matrix[j][i];
                      if (row[a] == i || col[b] == i) return false;
                      row[a] = i;
                      col[b] = i;
                  }
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CheckValid(int[][] matrix)
          {
              int n = matrix.Length;
              for (int i = 0; i < n; i++)
              {
                  bool[] row = new bool[n + 1], col = new bool[n + 1];
                  for (int j = 0; j < n; j++)
                  {
                      int a = matrix[i][j], b = matrix[j][i];
                      if (row[a] || col[b]) return false;
                      row[a] = true;
                      col[b] = true;
                  }
              }
              return true;
          }
        `,
        go: code`
          func checkValid(matrix [][]int) bool {
              n := len(matrix)
              for i := 0; i < n; i++ {
                  row := make([]bool, n+1)
                  col := make([]bool, n+1)
                  for j := 0; j < n; j++ {
                      a, b := matrix[i][j], matrix[j][i]
                      if row[a] || col[b] {
                          return false
                      }
                      row[a] = true
                      col[b] = true
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun checkValid(matrix: Array<IntArray>): Boolean {
              val n = matrix.size
              for (i in 0 until n) {
                  val row = BooleanArray(n + 1)
                  val col = BooleanArray(n + 1)
                  for (j in 0 until n) {
                      val a = matrix[i][j]
                      val b = matrix[j][i]
                      if (row[a] || col[b]) return false
                      row[a] = true
                      col[b] = true
                  }
              }
              return true
          }
        `,
        swift: code`
          func checkValid(_ matrix: [[Int]]) -> Bool {
              let n = matrix.count
              for i in 0..<n {
                  var row = [Bool](repeating: false, count: n + 1)
                  var col = [Bool](repeating: false, count: n + 1)
                  for j in 0..<n {
                      let a = matrix[i][j], b = matrix[j][i]
                      if row[a] || col[b] { return false }
                      row[a] = true
                      col[b] = true
                  }
              }
              return true
          }
        `,
        rust: code`
          fn checkValid(matrix: Vec<Vec<i32>>) -> bool {
              let n = matrix.len();
              for i in 0..n {
                  let mut row = vec![false; n + 1];
                  let mut col = vec![false; n + 1];
                  for j in 0..n {
                      let a = matrix[i][j] as usize;
                      let b = matrix[j][i] as usize;
                      if row[a] || col[b] {
                          return false;
                      }
                      row[a] = true;
                      col[b] = true;
                  }
              }
              true
          }
        `,
        php: code`
          function checkValid($matrix) {
              $n = count($matrix);
              for ($i = 0; $i < $n; $i++) {
                  $row = [];
                  $col = [];
                  for ($j = 0; $j < $n; $j++) {
                      $a = $matrix[$i][$j];
                      $b = $matrix[$j][$i];
                      if (isset($row[$a]) || isset($col[$b])) return false;
                      $row[$a] = true;
                      $col[$b] = true;
                  }
              }
              return true;
          }
        `,
        ruby: code`
          def checkValid(matrix)
            n = matrix.length
            matrix.all? { |r| r.uniq.length == n } && matrix.transpose.all? { |c| c.uniq.length == n }
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost of Buying Candies With Discount (LC 2144) ──────
  (() => {
    const ref = (cost: number[]) => cost.slice().sort((a, b) => b - a).reduce((s, c, i) => (i % 3 === 2 ? s : s + c), 0);
    return {
      slug: "minimum-cost-of-buying-candies-with-discount",
      title: "Minimum Cost of Buying Candies With Discount",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumCost", params: [{ name: "cost", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A shop runs an offer: for every **two** candies you buy, you may take a **third** candy for free, as long as the free candy costs **no more** than the cheaper of the two you paid for.\n\n`cost[i]` is the price of candy `i`. Return the minimum total you must pay to take home **all** the candies.",
        [
          { in: "cost = [7,3,5]", out: "12", note: "Pay for 7 and 5, take 3 free." },
          { in: "cost = [4,4,4,4,4,4]", out: "16", note: "Two rounds of 'pay for two, take one': four candies paid, two free." },
          { in: "cost = [9]", out: "9" },
        ],
        ["1 <= cost.length <= 100", "1 <= cost[i] <= 100"]),
      hints: [
        "The free candy can never be pricier than the two you pay for — so the two most expensive candies can never be free.",
        "Group candies from most to least expensive.",
        "Sort in descending order and skip every third candy (indices 2, 5, 8, ...).",
      ],
      editorial: explain({
        idea: "Sort prices in descending order and take candies in groups of three: pay for the first two of each group and get the third free. Each group's free candy is as expensive as the rule allows.",
        steps: [
          "Sort `cost` in descending order.",
          "Sum every price whose index `i` satisfies `i % 3 != 2`.",
          "Return the sum.",
        ],
        why: "In any valid purchase, the `k`-th free candy must be preceded by at least `2k` paid candies that are at least as expensive, so at most `k` of the top `3k` candies can be free. The descending grouping frees exactly the `3k`-th most expensive candy for every `k`, which is the best possible at every prefix — so it minimises what is paid.",
        time: "O(n log n)",
        space: "O(1) besides the sort",
        pitfalls: [
          "Sorting ascending and freeing every third from the cheap end gives away cheap candies and pays for expensive ones.",
          "A leftover group of one or two candies has no free item.",
          "The free candy must cost at most the cheaper paid one — equality is allowed.",
        ],
      }),
      examples: [
        { input: "[7,3,5]", expectedOutput: "12" },
        { input: "[4,4,4,4,4,4]", expectedOutput: "16" },
        { input: "[9]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 60]]);
        const top = pick(rng, [3, 20, 100]);
        const cost = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(cost), expectedOutput: String(ref(cost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumCost(cost: List[int]) -> int:
              ordered = sorted(cost, reverse=True)
              return sum(c for i, c in enumerate(ordered) if i % 3 != 2)
        `,
        javascript: code`
          var minimumCost = function(cost) {
              var sorted = cost.slice().sort(function(a, b) { return b - a; });
              var total = 0;
              for (var i = 0; i < sorted.length; i++) {
                  if (i % 3 !== 2) total += sorted[i];
              }
              return total;
          };
        `,
        typescript: code`
          function minimumCost(cost: number[]): number {
              var sorted = cost.slice().sort(function(a, b) { return b - a; });
              var total = 0;
              for (var i = 0; i < sorted.length; i++) {
                  if (i % 3 !== 2) total += sorted[i];
              }
              return total;
          }
        `,
        java: code`
          public static int minimumCost(int[] cost) {
              int[] sorted = cost.clone();
              Arrays.sort(sorted);
              int total = 0, n = sorted.length;
              for (int i = 0; i < n; i++) {
                  if (i % 3 != 2) total += sorted[n - 1 - i];
              }
              return total;
          }
        `,
        cpp: code`
          int minimumCost(vector<int>& cost) {
              vector<int> sorted(cost);
              sort(sorted.rbegin(), sorted.rend());
              int total = 0;
              for (int i = 0; i < (int)sorted.size(); i++) {
                  if (i % 3 != 2) total += sorted[i];
              }
              return total;
          }
        `,
        c: code`
          static int candyDesc(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (b > a) - (b < a);
          }

          int minimumCost(int* cost, int costSize) {
              int* sorted = (int*)malloc(costSize * sizeof(int));
              for (int i = 0; i < costSize; i++) sorted[i] = cost[i];
              qsort(sorted, costSize, sizeof(int), candyDesc);
              int total = 0;
              for (int i = 0; i < costSize; i++) {
                  if (i % 3 != 2) total += sorted[i];
              }
              free(sorted);
              return total;
          }
        `,
        csharp: code`
          public static int MinimumCost(int[] cost)
          {
              int[] sorted = cost.OrderByDescending(c => c).ToArray();
              int total = 0;
              for (int i = 0; i < sorted.Length; i++)
              {
                  if (i % 3 != 2) total += sorted[i];
              }
              return total;
          }
        `,
        go: code`
          func minimumCost(cost []int) int {
              sorted := append([]int{}, cost...)
              sort.Sort(sort.Reverse(sort.IntSlice(sorted)))
              total := 0
              for i, c := range sorted {
                  if i%3 != 2 {
                      total += c
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun minimumCost(cost: IntArray): Int {
              val sorted = cost.sortedDescending()
              var total = 0
              for (i in sorted.indices) {
                  if (i % 3 != 2) total += sorted[i]
              }
              return total
          }
        `,
        swift: code`
          func minimumCost(_ cost: [Int]) -> Int {
              let sorted = cost.sorted(by: >)
              var total = 0
              for i in 0..<sorted.count where i % 3 != 2 {
                  total += sorted[i]
              }
              return total
          }
        `,
        rust: code`
          fn minimumCost(cost: Vec<i32>) -> i32 {
              let mut sorted = cost.clone();
              sorted.sort_by(|a, b| b.cmp(a));
              let mut total = 0;
              for (i, &c) in sorted.iter().enumerate() {
                  if i % 3 != 2 {
                      total += c;
                  }
              }
              total
          }
        `,
        php: code`
          function minimumCost($cost) {
              rsort($cost);
              $total = 0;
              foreach ($cost as $i => $c) {
                  if ($i % 3 != 2) $total += $c;
              }
              return $total;
          }
        `,
        ruby: code`
          def minimumCost(cost)
            cost.sort.reverse.each_with_index.sum { |c, i| i % 3 == 2 ? 0 : c }
          end
        `,
      },
    };
  })(),

  // ── Count Elements With Strictly Smaller and Greater Elements (LC 2148) ─
  (() => {
    const ref = (nums: number[]) => nums.filter((x) => nums.some((y) => y < x) && nums.some((y) => y > x)).length;
    return {
      slug: "count-elements-with-strictly-smaller-and-greater-elements",
      title: "Count Elements With Strictly Smaller and Greater Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Counting", "Amazon", "Google"],
      signature: { funcName: "countElements", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return how many elements of `nums` have **both** a strictly smaller element and a strictly greater element somewhere in `nums`.\n\nEach position counts on its own, so equal values are counted once per occurrence.",
        [
          { in: "nums = [5,-3,8,5,-3]", out: "2", note: "Both 5s have -3 below and 8 above; -3 has nothing smaller and 8 nothing larger." },
          { in: "nums = [4,4,4]", out: "0" },
          { in: "nums = [-100000,0,100000]", out: "1" },
        ],
        ["1 <= nums.length <= 100", "-10^5 <= nums[i] <= 10^5"]),
      hints: [
        "An element has something strictly smaller unless it is the minimum.",
        "Likewise it has something strictly larger unless it is the maximum.",
        "Find the minimum and maximum, then count the elements equal to neither.",
      ],
      editorial: explain({
        idea: "An element qualifies exactly when it is neither the minimum nor the maximum of the array.",
        steps: [
          "Compute `lo = min(nums)` and `hi = max(nums)`.",
          "Count the elements `x` with `lo < x < hi`.",
        ],
        why: "If `x > lo`, the minimum itself is a strictly smaller element; if `x == lo`, nothing is smaller. The same argument with the maximum handles 'strictly greater'. So `x` qualifies if and only if `lo < x < hi`; when all elements are equal, `lo == hi` and the count is 0.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Every copy of the minimum and of the maximum is excluded, not just one.",
          "With only one or two distinct values the answer is 0 — the test `lo < x < hi` handles that without a special case.",
          "Values can be negative; do not start the running maximum at 0.",
        ],
      }),
      examples: [
        { input: "[5,-3,8,5,-3]", expectedOutput: "2" },
        { input: "[4,4,4]", expectedOutput: "0" },
        { input: "[-100000,0,100000]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = sizeOf(rng, [[1, 3], [4, 12], [13, 60]]);
        const span = pick(rng, [1, 3, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countElements(nums: List[int]) -> int:
              lo, hi = min(nums), max(nums)
              return sum(1 for x in nums if lo < x < hi)
        `,
        javascript: code`
          var countElements = function(nums) {
              var lo = nums[0], hi = nums[0];
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] < lo) lo = nums[i];
                  if (nums[i] > hi) hi = nums[i];
              }
              var count = 0;
              for (var j = 0; j < nums.length; j++) {
                  if (nums[j] > lo && nums[j] < hi) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function countElements(nums: number[]): number {
              var lo = nums[0], hi = nums[0];
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] < lo) lo = nums[i];
                  if (nums[i] > hi) hi = nums[i];
              }
              var count = 0;
              for (var j = 0; j < nums.length; j++) {
                  if (nums[j] > lo && nums[j] < hi) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int countElements(int[] nums) {
              int lo = nums[0], hi = nums[0];
              for (int v : nums) {
                  lo = Math.min(lo, v);
                  hi = Math.max(hi, v);
              }
              int count = 0;
              for (int v : nums) {
                  if (v > lo && v < hi) count++;
              }
              return count;
          }
        `,
        cpp: code`
          int countElements(vector<int>& nums) {
              int lo = *min_element(nums.begin(), nums.end());
              int hi = *max_element(nums.begin(), nums.end());
              int count = 0;
              for (int v : nums) {
                  if (v > lo && v < hi) count++;
              }
              return count;
          }
        `,
        c: code`
          int countElements(int* nums, int numsSize) {
              int lo = nums[0], hi = nums[0];
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] < lo) lo = nums[i];
                  if (nums[i] > hi) hi = nums[i];
              }
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] > lo && nums[i] < hi) count++;
              }
              return count;
          }
        `,
        csharp: code`
          public static int CountElements(int[] nums)
          {
              int lo = nums.Min(), hi = nums.Max();
              int count = 0;
              foreach (int v in nums)
              {
                  if (v > lo && v < hi) count++;
              }
              return count;
          }
        `,
        go: code`
          func countElements(nums []int) int {
              lo, hi := nums[0], nums[0]
              for _, v := range nums {
                  if v < lo {
                      lo = v
                  }
                  if v > hi {
                      hi = v
                  }
              }
              count := 0
              for _, v := range nums {
                  if v > lo && v < hi {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun countElements(nums: IntArray): Int {
              var lo = nums[0]
              var hi = nums[0]
              for (v in nums) {
                  if (v < lo) lo = v
                  if (v > hi) hi = v
              }
              return nums.count { it > lo && it < hi }
          }
        `,
        swift: code`
          func countElements(_ nums: [Int]) -> Int {
              let lo = nums.min()!, hi = nums.max()!
              var count = 0
              for v in nums where v > lo && v < hi {
                  count += 1
              }
              return count
          }
        `,
        rust: code`
          fn countElements(nums: Vec<i32>) -> i32 {
              let lo = *nums.iter().min().unwrap();
              let hi = *nums.iter().max().unwrap();
              nums.iter().filter(|&&v| v > lo && v < hi).count() as i32
          }
        `,
        php: code`
          function countElements($nums) {
              $lo = min($nums);
              $hi = max($nums);
              $cnt = 0;
              foreach ($nums as $v) {
                  if ($v > $lo && $v < $hi) $cnt++;
              }
              return $cnt;
          }
        `,
        ruby: code`
          def countElements(nums)
            lo, hi = nums.minmax
            nums.count { |x| x > lo && x < hi }
          end
        `,
      },
    };
  })(),

  // ── Keep Multiplying Found Values by Two (LC 2154) ──────────────
  (() => {
    const ref = (nums: number[], original: number) => {
      let x = original;
      while (nums.indexOf(x) >= 0) x *= 2;
      return x;
    };
    return {
      slug: "keep-multiplying-found-values-by-two",
      title: "Keep Multiplying Found Values by Two",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Simulation", "Amazon", "Google"],
      signature: {
        funcName: "findFinalValue",
        params: [{ name: "nums", type: "int[]" as const }, { name: "original", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Start with the number `original` and repeat:\n\n1. If `original` occurs in `nums`, double it (`original = 2 * original`) and go back to step 1.\n2. Otherwise stop.\n\nReturn the final value of `original`.",
        [
          { in: "nums = [8,2,4,9], original = 2", out: "16", note: "2 is present → 4 is present → 8 is present → 16 is not." },
          { in: "nums = [2,7,9], original = 4", out: "4" },
          { in: "nums = [1,2,4,8,16,32], original = 1", out: "64" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i], original <= 1000"]),
      hints: [
        "Each step is a membership test followed by a doubling.",
        "Searching the array every time costs O(n) per step; a set makes each test O(1).",
        "Values never exceed 1000, so once `original` passes 1000 it can no longer be found.",
      ],
      editorial: explain({
        idea: "Put the values in a set and follow the chain `original, 2·original, 4·original, ...` until a value is missing.",
        steps: [
          "Insert every value of `nums` into a set (or a boolean array indexed up to 1000).",
          "While `original` is in the set, double it.",
          "Return `original`.",
        ],
        why: "This is exactly the process in the statement, with each membership test answered in constant time. The loop terminates because `original` at least doubles each round and the set holds nothing above 1000 — at most about ten doublings.",
        time: "O(n + log(max / original))",
        space: "O(n)",
        pitfalls: [
          "With a boolean array, check the bound before indexing: `original` can reach 2048.",
          "Keep doubling until a value is missing — not just once.",
          "Sorting and scanning once also works, since the chain only increases.",
        ],
      }),
      examples: [
        { input: "[8,2,4,9]\n2", expectedOutput: "16" },
        { input: "[2,7,9]\n4", expectedOutput: "4" },
        { input: "[1,2,4,8,16,32]\n1", expectedOutput: "64" },
      ],
      gen: (rng: Rng) => {
        const original = rng() < 0.5 ? ri(rng, 1, 20) : ri(rng, 1, 1000);
        const nums: number[] = [];
        let x = original;
        const links = pick(rng, [0, 1, 3, 10]);
        for (let t = 0; t < links && x <= 1000; t++) { nums.push(x); x *= 2; }
        const filler = sizeOf(rng, [[0, 2], [3, 10], [11, 40]]);
        for (let t = 0; t < filler; t++) nums.push(ri(rng, 1, pick(rng, [50, 1000])));
        if (nums.length === 0) nums.push(ri(rng, 1, 1000));
        shuffle(rng, nums);
        return { input: `${fmtIntArr(nums)}\n${original}`, expectedOutput: String(ref(nums, original)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findFinalValue(nums: List[int], original: int) -> int:
              present = set(nums)
              while original in present:
                  original *= 2
              return original
        `,
        javascript: code`
          var findFinalValue = function(nums, original) {
              var present = new Set(nums);
              while (present.has(original)) original *= 2;
              return original;
          };
        `,
        typescript: code`
          function findFinalValue(nums: number[], original: number): number {
              var present: boolean[] = [];
              for (var v = 0; v <= 1000; v++) present.push(false);
              for (var i = 0; i < nums.length; i++) present[nums[i]] = true;
              while (original <= 1000 && present[original]) original *= 2;
              return original;
          }
        `,
        java: code`
          public static int findFinalValue(int[] nums, int original) {
              boolean[] present = new boolean[1001];
              for (int v : nums) present[v] = true;
              while (original <= 1000 && present[original]) original *= 2;
              return original;
          }
        `,
        cpp: code`
          int findFinalValue(vector<int>& nums, int original) {
              unordered_set<int> present(nums.begin(), nums.end());
              while (present.count(original)) original *= 2;
              return original;
          }
        `,
        c: code`
          int findFinalValue(int* nums, int numsSize, int original) {
              bool present[1001] = { false };
              for (int i = 0; i < numsSize; i++) present[nums[i]] = true;
              while (original <= 1000 && present[original]) original *= 2;
              return original;
          }
        `,
        csharp: code`
          public static int FindFinalValue(int[] nums, int original)
          {
              var present = new HashSet<int>(nums);
              while (present.Contains(original)) original *= 2;
              return original;
          }
        `,
        go: code`
          func findFinalValue(nums []int, original int) int {
              present := map[int]bool{}
              for _, v := range nums {
                  present[v] = true
              }
              for present[original] {
                  original *= 2
              }
              return original
          }
        `,
        kotlin: code`
          fun findFinalValue(nums: IntArray, original: Int): Int {
              val present = nums.toHashSet()
              var x = original
              while (x in present) x *= 2
              return x
          }
        `,
        swift: code`
          func findFinalValue(_ nums: [Int], _ original: Int) -> Int {
              let present = Set(nums)
              var x = original
              while present.contains(x) { x *= 2 }
              return x
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn findFinalValue(nums: Vec<i32>, original: i32) -> i32 {
              let present: HashSet<i32> = nums.into_iter().collect();
              let mut x = original;
              while present.contains(&x) {
                  x *= 2;
              }
              x
          }
        `,
        php: code`
          function findFinalValue($nums, $original) {
              $present = array_flip($nums);
              while (isset($present[$original])) $original *= 2;
              return $original;
          }
        `,
        ruby: code`
          def findFinalValue(nums, original)
            present = {}
            nums.each { |v| present[v] = true }
            original *= 2 while present[original]
            original
          end
        `,
      },
    };
  })(),

  // ── Range Addition II (LC 598) ──────────────────────────────────
  (() => {
    const ref = (m: number, n: number, ops: number[][]) => {
      let a = m, b = n;
      for (const op of ops) { a = Math.min(a, op[0]); b = Math.min(b, op[1]); }
      return a * b;
    };
    return {
      slug: "range-addition-ii",
      title: "Range Addition II",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Google"],
      signature: {
        funcName: "maxCount",
        params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "ops", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Start with an `m x n` matrix `M` of zeros. Each operation `ops[i] = [a, b]` adds 1 to every cell `M[x][y]` with `0 <= x < a` and `0 <= y < b` — the top-left `a x b` block.\n\nAfter performing all operations, return how many cells hold the **maximum** value in the matrix.",
        [
          { in: "m = 4, n = 5, ops = [[3,4],[2,5],[4,2]]", out: "4", note: "Only the top-left 2 x 2 block is inside all three operations, so its 4 cells hold the maximum, 3." },
          { in: "m = 3, n = 3, ops = []", out: "9", note: "With no operations every cell is 0, the maximum." },
          { in: "m = 6, n = 2, ops = [[6,1]]", out: "6" },
        ],
        ["1 <= m, n <= 4 * 10^4", "0 <= ops.length <= 10^4", "ops[i].length == 2", "1 <= a <= m", "1 <= b <= n"]),
      hints: [
        "Every operation includes the cell `(0, 0)`, so that cell always reaches the maximum.",
        "A cell holds the maximum exactly when every operation covers it.",
        "The cells covered by all operations form the top-left `minA x minB` block.",
      ],
      editorial: explain({
        idea: "All operations are top-left blocks, so their common part is again a top-left block: `min(a)` rows by `min(b)` columns. Those cells are incremented by every operation, and no other cell is.",
        steps: [
          "Set `minA = m` and `minB = n`.",
          "For each operation `[a, b]`, lower `minA` to `a` and `minB` to `b` when smaller.",
          "Return `minA * minB`.",
        ],
        why: "Cell `(x, y)` is incremented by operation `[a, b]` exactly when `x < a` and `y < b`. It is incremented by every operation exactly when `x < minA` and `y < minB`, and cell `(0, 0)` shows that the maximum equals the number of operations. So the cells holding the maximum are precisely the `minA x minB` block — and with no operations, the whole matrix.",
        time: "O(k) for k operations",
        space: "O(1)",
        pitfalls: [
          "Do not build the matrix — it can have 1.6 × 10^9 cells.",
          "With an empty `ops`, the answer is `m * n`, not 0.",
          "`m * n` reaches 1.6 × 10^9, which still fits a signed 32-bit int (the limit is about 2.1 × 10^9).",
        ],
      }),
      examples: [
        { input: "4\n5\n[[3,4],[2,5],[4,2]]", expectedOutput: "4" },
        { input: "3\n3\n[]", expectedOutput: "9" },
        { input: "6\n2\n[[6,1]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.4;
        const m = big ? ri(rng, 1, 40000) : ri(rng, 1, 10);
        const n = big ? ri(rng, 1, 40000) : ri(rng, 1, 10);
        const k = sizeOf(rng, [[0, 0], [1, 3], [4, 20]]);
        const ops: number[][] = [];
        for (let i = 0; i < k; i++) ops.push([ri(rng, 1, m), ri(rng, 1, n)]);
        return { input: `${m}\n${n}\n${fmtIntMat(ops)}`, expectedOutput: String(ref(m, n, ops)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxCount(m: int, n: int, ops: List[List[int]]) -> int:
              for a, b in ops:
                  m = min(m, a)
                  n = min(n, b)
              return m * n
        `,
        javascript: code`
          var maxCount = function(m, n, ops) {
              for (var i = 0; i < ops.length; i++) {
                  m = Math.min(m, ops[i][0]);
                  n = Math.min(n, ops[i][1]);
              }
              return m * n;
          };
        `,
        typescript: code`
          function maxCount(m: number, n: number, ops: number[][]): number {
              for (var i = 0; i < ops.length; i++) {
                  m = Math.min(m, ops[i][0]);
                  n = Math.min(n, ops[i][1]);
              }
              return m * n;
          }
        `,
        java: code`
          public static int maxCount(int m, int n, int[][] ops) {
              for (int[] op : ops) {
                  m = Math.min(m, op[0]);
                  n = Math.min(n, op[1]);
              }
              return m * n;
          }
        `,
        cpp: code`
          int maxCount(int m, int n, vector<vector<int>>& ops) {
              for (auto& op : ops) {
                  m = min(m, op[0]);
                  n = min(n, op[1]);
              }
              return m * n;
          }
        `,
        c: code`
          int maxCount(int m, int n, int** ops, int opsSize, int* opsColSize) {
              for (int i = 0; i < opsSize; i++) {
                  if (ops[i][0] < m) m = ops[i][0];
                  if (ops[i][1] < n) n = ops[i][1];
              }
              return m * n;
          }
        `,
        csharp: code`
          public static int MaxCount(int m, int n, int[][] ops)
          {
              foreach (int[] op in ops)
              {
                  m = Math.Min(m, op[0]);
                  n = Math.Min(n, op[1]);
              }
              return m * n;
          }
        `,
        go: code`
          func maxCount(m int, n int, ops [][]int) int {
              for _, op := range ops {
                  if op[0] < m {
                      m = op[0]
                  }
                  if op[1] < n {
                      n = op[1]
                  }
              }
              return m * n
          }
        `,
        kotlin: code`
          fun maxCount(m: Int, n: Int, ops: Array<IntArray>): Int {
              var rows = m
              var cols = n
              for (op in ops) {
                  rows = minOf(rows, op[0])
                  cols = minOf(cols, op[1])
              }
              return rows * cols
          }
        `,
        swift: code`
          func maxCount(_ m: Int, _ n: Int, _ ops: [[Int]]) -> Int {
              var rows = m, cols = n
              for op in ops {
                  rows = min(rows, op[0])
                  cols = min(cols, op[1])
              }
              return rows * cols
          }
        `,
        rust: code`
          fn maxCount(m: i32, n: i32, ops: Vec<Vec<i32>>) -> i32 {
              let mut rows = m;
              let mut cols = n;
              for op in ops.iter() {
                  rows = rows.min(op[0]);
                  cols = cols.min(op[1]);
              }
              rows * cols
          }
        `,
        php: code`
          function maxCount($m, $n, $ops) {
              foreach ($ops as $op) {
                  $m = min($m, $op[0]);
                  $n = min($n, $op[1]);
              }
              return $m * $n;
          }
        `,
        ruby: code`
          def maxCount(m, n, ops)
            ops.each do |a, b|
              m = a if a < m
              n = b if b < n
            end
            m * n
          end
        `,
      },
    };
  })(),

];
